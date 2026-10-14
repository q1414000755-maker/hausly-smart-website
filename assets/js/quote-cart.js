/* Quote List 统一存储层 —— 全站唯一读写入口（B2B 询价清单，不是购物车）。
   ─────────────────────────────────────────────────────────────────────────
   存储分工（包子 2026-09-19 拍板：分级恢复 + 7 天 TTL）：

     localStorage   z02-quote-cart     条目 [{ key, model, qty, attrs, customization, note, addedAt }]
                    z02-quote-request  整单加工项 { customization }  ← 只有加工项，**没有联系方式**
                    z02-quote-meta     最后活跃时间 { updatedAt }    ← TTL 计时用
                    z02-quote-restore-signal  跨标签页广播「恢复决定」
     sessionStorage z02-quote-session  会话标记（存在 = 同一次浏览）
                    z02-quote-contact  联系方式 { name, email, ... }  ← 关标签页即失

   两条硬规则（都是隐私/正确性底线，别改回去）：

   1. **联系方式绝不进 localStorage。** 它只活在当前标签页，关掉就没了。
      产品选择可以留 7 天，姓名邮箱电话不可以 —— 这两个生命周期必须分离。
   2. **条目只存 model_id + 数量 + 配置 + 加工项**，绝不存名称 / 图 / 价格：
      那些由 quote-catalog.js 按 model_id 还原，存了就会过期（「禁止手写价格」同理）。

   恢复状态机 phase：
     active   草稿可用，读接口返回真实条目
     pending  发现旧草稿，但隔得够久、不确定还是不是同一个人 → 读接口一律返回空，
              header 角标显示 0（外加一个蓝点暗示），由 UI 询问用户是否 Restore
     empty    没有草稿

   pending 判定（分级，只在「可能换人了」的区间才打扰）：
     同一浏览器会话 → active（刷新 / 站内跳转 / 多标签页，永远静默）
     新会话但间隔 ≤ 30 分钟 → active（去回邮件、看个 PDF 又回来，不去烦他）
     新会话且间隔 > 30 分钟 → pending（先问，不直接把上一个人的选择摆出来）
     间隔 > 7 天 → 静默清空，不提示「已过期」

   「同一型号 + 不同配置」= 两条独立条目。key 是派生量：无配置无加工时 key === model。
   历史包袱：加购曾有三套互不相认的 key，现已收敛；migrate() 首次加载自动搬运并删除旧 key。

   ⚠️ 隐私模式下 localStorage 会抛：全部读写包 try/catch 静默降级到内存，不让 JS 炸掉页面。
      拿不到 sessionStorage 时**视为同会话**——宁可不去问，也不要每次翻页都弹恢复提示。
*/
(function (global) {
  "use strict";

  var KEY = "z02-quote-cart";
  var REQ_KEY = "z02-quote-request";
  var META_KEY = "z02-quote-meta";
  var CONTACT_KEY = "z02-quote-contact";
  var SESSION_KEY = "z02-quote-session";
  var PROMPT_KEY = "z02-quote-prompt-dismissed";
  var SIGNAL_KEY = "z02-quote-restore-signal";

  var LEGACY_HOME = "z02-home-quote";
  var LEGACY_PREFIX = "z02-quote:";
  var MIGRATED_FLAG = "z02-quote-migrated";
  var PRIVACY_FLAG = "z02-quote-privacy-migrated";

  var EVENT = "z02:quote-change";
  var MAX_LINES = 60;
  var MAX_QTY = 99999;

  var DAY_MS = 24 * 60 * 60 * 1000;
  var TTL_MS = 7 * DAY_MS;
  var SILENT_MS = 30 * 60 * 1000;

  /* ── 存储探针：不可用就退内存，绝不因为存储异常炸页面 ─────────────────── */
  var probe = function (s) {
    try {
      if (!s) return null;
      s.setItem("z02-probe", "1");
      s.removeItem("z02-probe");
      return s;
    } catch (e) {
      return null;
    }
  };

  /* 注意：属性访问本身就可能抛（部分浏览器隐私模式），所以连取对象也要包 */
  var local = null;
  var sess = null;
  try {
    local = probe(global.localStorage);
  } catch (e) {
    local = null;
  }
  try {
    sess = probe(global.sessionStorage);
  } catch (e) {
    sess = null;
  }

  var memory = { cart: null, request: null, meta: null, contact: null };

  var slotOf = function (key) {
    if (key === KEY) return "cart";
    if (key === REQ_KEY) return "request";
    if (key === META_KEY) return "meta";
    if (key === CONTACT_KEY) return "contact";
    return null;
  };

  /* 只有联系方式 / 会话标记 / 提示关闭标记走 sessionStorage，其余一律 localStorage */
  var storeOf = function (key) {
    return key === CONTACT_KEY || key === SESSION_KEY || key === PROMPT_KEY ? sess : local;
  };

  var readRaw = function (key) {
    var s = storeOf(key);
    if (s) {
      try {
        var v = s.getItem(key);
        if (v != null) return v;
      } catch (e) {}
    }
    var slot = slotOf(key);
    return slot ? memory[slot] : null;
  };

  var writeRaw = function (key, value) {
    var s = storeOf(key);
    if (s) {
      try {
        s.setItem(key, value);
        return;
      } catch (e) {}
    }
    var slot = slotOf(key);
    if (slot) memory[slot] = value;
  };

  var dropRaw = function (key) {
    var s = storeOf(key);
    if (s) {
      try {
        s.removeItem(key);
      } catch (e) {}
    }
    var slot = slotOf(key);
    if (slot) memory[slot] = null;
  };

  var now = function () {
    return Date.now();
  };

  /* ── key 派生：同型号不同配置必须能区分 ───────────────────────────────── */
  var attrSig = function (attrs) {
    if (!attrs || typeof attrs !== "object") return "";
    return Object.keys(attrs)
      .sort()
      .map(function (k) {
        var v = attrs[k];
        var val = Array.isArray(v) ? v.slice().sort().join(",") : String(v == null ? "" : v);
        return k + "=" + val;
      })
      .filter(function (p) {
        return !/=$/.test(p);
      })
      .join("&");
  };

  var makeKey = function (model, attrs, customization, variantId) {
    var parts = [];
    var vId = String(variantId == null ? "" : variantId).trim();
    if (vId) parts.push("v=" + vId);
    var a = attrSig(attrs);
    if (a) parts.push(a);
    var cs = (customization || []).slice().sort();
    if (cs.length) parts.push("cf=" + cs.join(","));
    return parts.length ? model + "::" + parts.join("&") : model;
  };

  var normaliseAttrs = function (attrs) {
    if (!attrs || typeof attrs !== "object") return {};
    var out = {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === "") return;
      out[k] = Array.isArray(v) ? v.map(String) : [String(v)];
    });
    return out;
  };

  function normaliseQty(v) {
    var q = Number(v);
    if (!isFinite(q) || q < 1) q = 1;
    return Math.min(MAX_QTY, Math.round(q));
  }

  var normaliseLines = function (input) {
    if (!Array.isArray(input)) return [];
    var out = [];
    var seen = Object.create(null);
    input.forEach(function (raw) {
      if (!raw) return;
      var model = typeof raw === "string" ? raw.trim() : String(raw.model == null ? "" : raw.model).trim();
      if (!model) return;
      var attrs = typeof raw === "string" ? {} : normaliseAttrs(raw.attrs);
      var variantId = typeof raw === "string" ? "" : String(raw.variant_id == null ? "" : raw.variant_id).trim();
      var customization = (raw && Array.isArray(raw.customization) ? raw.customization : []).map(String);
      var key = makeKey(model, attrs, customization, variantId);
      if (seen[key]) {
        /* 同 key 合并数量，而不是产生重复行 */
        out[seen[key] - 1].qty = Math.min(MAX_QTY, out[seen[key] - 1].qty + normaliseQty(raw.qty));
        return;
      }
      seen[key] = out.length + 1;
      var addedAt = Number(raw && raw.addedAt);
      if (!isFinite(addedAt) || addedAt <= 0) addedAt = now();
      out.push({
        key: key,
        model: model,
        variant_id: variantId,
        qty: normaliseQty(raw.qty),
        attrs: attrs,
        customization: customization,
        note: raw && typeof raw.note === "string" ? raw.note : "",
        addedAt: addedAt
      });
    });
    return out.slice(0, MAX_LINES);
  };

  var emit = function (reason) {
    try {
      global.dispatchEvent(new CustomEvent(EVENT, { detail: { reason: reason || "write" } }));
    } catch (e) {}
  };

  /* ── 真实草稿（不管 phase，永远读得出） ───────────────────────────────── */
  var rawLines = function () {
    var raw = readRaw(KEY);
    if (!raw) return [];
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return [];
    }
    return normaliseLines(data);
  };

  /* ── 最后活跃时间 ─────────────────────────────────────────────────────
     meta 是后加的，老数据没有：拿最新 addedAt 兜底，绝不因为缺 meta 就把草稿当成过期。 */
  var lastActivity = function () {
    var raw = readRaw(META_KEY);
    if (raw) {
      try {
        var d = JSON.parse(raw);
        var t = d && Number(d.updatedAt);
        if (isFinite(t) && t > 0) return t;
      } catch (e) {}
    }
    var newest = 0;
    rawLines().forEach(function (i) {
      if (i.addedAt > newest) newest = i.addedAt;
    });
    return newest;
  };

  /* 只由写操作 / 显式恢复调用。**读页面不算活跃** ——
     否则客户第 6 天来逛一圈就把 7 天计时重置了，草稿永远不过期。 */
  var touch = function () {
    writeRaw(META_KEY, JSON.stringify({ updatedAt: now() }));
  };

  var dropAll = function () {
    dropRaw(KEY);
    dropRaw(META_KEY);
    dropRaw(REQ_KEY);
    dropRaw(CONTACT_KEY);
    dropRaw(PROMPT_KEY);
  };

  /* ── 恢复状态机 ─────────────────────────────────────────────────────── */
  var phase = "empty";

  /* 拿不到 sessionStorage → 视为同会话：宁可不去问，也不要每翻一页弹一次恢复提示 */
  var hasSession = function () {
    if (!sess) return true;
    return readRaw(SESSION_KEY) === "1";
  };

  var markSession = function () {
    writeRaw(SESSION_KEY, "1");
  };

  var resolveRestore = function (force) {
    if (!rawLines().length) {
      phase = "empty";
      return;
    }
    if (force || hasSession()) {
      phase = "active";
      return;
    }
    var age = now() - lastActivity();
    /* age <= 0 说明时钟被往回拨过 / meta 缺失，按「刚看过」处理，不去打扰 */
    if (!isFinite(age) || age <= SILENT_MS) {
      phase = "active";
      return;
    }
    phase = "pending";
  };

  /* 跨标签页广播「已经决定了」，避免另一个标签页还挂着恢复提示 */
  var signal = function () {
    if (!local) return;
    try {
      local.setItem(SIGNAL_KEY, String(now()));
    } catch (e) {}
  };

  /* ── 7 天过期：静默清空，不提示「已过期」 ─────────────────────────────── */
  var expireIfStale = function () {
    if (!rawLines().length) return false;
    var last = lastActivity();
    if (!last) {
      touch();
      return false;
    }
    if (now() - last <= TTL_MS) return false;
    dropAll();
    return true;
  };

  /* ── 联系方式：只在 sessionStorage ─────────────────────────────────── */
  var readContact = function () {
    var raw = readRaw(CONTACT_KEY);
    if (!raw) return {};
    try {
      var d = JSON.parse(raw);
      return d && typeof d === "object" ? d : {};
    } catch (e) {
      return {};
    }
  };

  /* ── 旧 key 迁移 ────────────────────────────────────────────────────── */
  var migrate = function () {
    if (!local) return;
    try {
      if (local.getItem(MIGRATED_FLAG)) return;
      var merged = rawLines();
      var seen = Object.create(null);
      merged.forEach(function (i) {
        seen[i.key] = true;
      });

      var pull = function (raw) {
        if (!raw) return;
        var arr;
        try {
          arr = JSON.parse(raw);
        } catch (e) {
          return;
        }
        if (!Array.isArray(arr)) return;
        arr.forEach(function (v) {
          var m = String(v == null ? "" : v).trim();
          if (!m || seen[m]) return;
          seen[m] = true;
          merged.push({ model: m, qty: 1 });
        });
      };

      pull(local.getItem(LEGACY_HOME));
      var legacyKeys = [];
      for (var i = 0; i < local.length; i += 1) {
        var k = local.key(i);
        if (k && k.indexOf(LEGACY_PREFIX) === 0) legacyKeys.push(k);
      }
      legacyKeys.forEach(function (k) {
        pull(local.getItem(k));
      });

      if (merged.length) {
        writeRaw(KEY, JSON.stringify(normaliseLines(merged)));
        touch();
      }

      dropRaw(LEGACY_HOME);
      legacyKeys.forEach(function (k) {
        try {
          local.removeItem(k);
        } catch (e) {}
      });
      try {
        local.setItem(MIGRATED_FLAG, "1");
      } catch (e) {}
    } catch (e) {}
  };

  /* ── 隐私迁移：把早期误存在 localStorage 里的联系方式搬到 sessionStorage ──
     v1 曾把 { customization, contact } 整个塞进 z02-quote-request，联系方式因此
     会在公用电脑上留 7 天。这里一次性搬走并改写，之后 request 只存加工项。 */
  var scrubLegacyContact = function () {
    if (!local) return;
    try {
      if (local.getItem(PRIVACY_FLAG)) return;
      var raw = local.getItem(REQ_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && typeof d === "object" && !Array.isArray(d) && d.contact && typeof d.contact === "object") {
          if (sess && !readRaw(CONTACT_KEY)) writeRaw(CONTACT_KEY, JSON.stringify(d.contact));
          local.setItem(
            REQ_KEY,
            JSON.stringify({ customization: Array.isArray(d.customization) ? d.customization.map(String) : [] })
          );
        }
      }
      local.setItem(PRIVACY_FLAG, "1");
    } catch (e) {}
  };

  /* ── 自愈发 ───────────────────────────────────────────────────────────
     quote-catalog.js 里带全部有效 model_id（构建期生成）。拿它校一遍，
     SSOT 里已经不存在的型号立刻剔掉 —— 任意页面都自愈，不必等访问 Quote List。 */
  var selfHeal = function () {
    var cat = global.Z02_CATALOG;
    var ids = cat && Array.isArray(cat.validIds) ? cat.validIds : null;
    if (!ids || !ids.length) return;
    var known = Object.create(null);
    ids.forEach(function (id) {
      known[String(id)] = true;
    });
    api.prune(function (model) {
      return Boolean(known[model]);
    });
  };

  /* ── 对外读接口一律走这里：pending 时返回空，界面与角标就都是 0 ────────── */
  var visibleLines = function () {
    return phase === "pending" ? [] : rawLines();
  };

  var saveVisible = function (list) {
    writeRaw(KEY, JSON.stringify(normaliseLines(list)));
    touch();
    emit("cart");
  };

  /* ── 整单需求（Apply-to-all 加工项 + 联系方式，两者分开存） ───────────── */
  var loadRequest = function () {
    var raw = readRaw(REQ_KEY);
    var custom = [];
    if (raw) {
      try {
        var d = JSON.parse(raw);
        if (Array.isArray(d)) custom = d.map(String);
        else if (d && Array.isArray(d.customization)) custom = d.customization.map(String);
      } catch (e) {}
    }
    return { customization: custom, contact: readContact() };
  };

  var saveRequest = function (patch) {
    var next = loadRequest();
    if (patch && Array.isArray(patch.customization)) {
      next.customization = patch.customization.map(String);
      /* ⚠️ 只写加工项，绝不把 contact 带进 localStorage */
      writeRaw(REQ_KEY, JSON.stringify({ customization: next.customization }));
      emit("request");
    }
    if (patch && patch.contact && typeof patch.contact === "object") {
      next.contact = Object.assign({}, next.contact, patch.contact);
      writeRaw(CONTACT_KEY, JSON.stringify(next.contact));
    }
    return next;
  };

  var api = {
    key: KEY,
    requestKey: REQ_KEY,
    metaKey: META_KEY,
    contactKey: CONTACT_KEY,
    event: EVENT,
    max: MAX_LINES,
    ttl: TTL_MS,
    silentWindow: SILENT_MS,

    /* ── 恢复状态 ──────────────────────────────────────────────────────── */
    state: function () {
      return phase;
    },
    hasPending: function () {
      return phase === "pending";
    },
    /* 待恢复草稿里的真实条目数 —— 只给「你上次存了 N 个产品」这句提示用 */
    pendingCount: function () {
      return phase === "pending" ? rawLines().length : 0;
    },
    pendingUnits: function () {
      return phase === "pending"
        ? rawLines().reduce(function (n, i) {
            return n + i.qty;
          }, 0)
        : 0;
    },
    lastActivityAt: lastActivity,
    expiresAt: function () {
      var last = lastActivity();
      return last ? last + TTL_MS : 0;
    },
    restore: function () {
      if (phase !== "pending") return false;
      resolveRestore(true);
      touch();
      dropRaw(PROMPT_KEY);
      signal();
      emit("restore");
      return true;
    },
    discard: function () {
      if (!rawLines().length) return false;
      dropAll();
      phase = "empty";
      signal();
      emit("discard");
      return true;
    },
    /* 「×」只是这一次别问了 —— 草稿留着，页头蓝点也留着，
       用户点开抽屉还能在空态位置看到同一个恢复入口。
       所以这里绝不清草稿，只记一个会话级标记。 */
    dismissPrompt: function () {
      writeRaw(PROMPT_KEY, "1");
    },
    promptDismissed: function () {
      return readRaw(PROMPT_KEY) === "1";
    },

    /* ── 清单读写 ──────────────────────────────────────────────────────── */
    lines: visibleLines,
    line: function (key) {
      var hit = visibleLines().filter(function (i) {
        return i.key === key;
      });
      return hit.length ? hit[0] : null;
    },
    /* 清单里是否存在这个型号（不论配置）—— 加购按钮态用这个 */
    hasModel: function (model) {
      var m = String(model == null ? "" : model);
      return visibleLines().some(function (i) {
        return i.model === m;
      });
    },
    linesOfModel: function (model) {
      var m = String(model == null ? "" : model);
      return visibleLines().filter(function (i) {
        return i.model === m;
      });
    },

    count: function () {
      return visibleLines().length;
    },
    totalQty: function () {
      return visibleLines().reduce(function (n, i) {
        return n + i.qty;
      }, 0);
    },

    /* 同型号 + 同配置 + 同加工 → 数量累加；否则新增一条独立行 */
    addLine: function (input) {
      var model = String((input && input.model) || "").trim();
      if (!model) return null;
      /* 旧草稿还挂着未确认，用户却往「看起来是空的」清单里加东西 = 明确开始新清单 */
      if (phase === "pending") {
        dropAll();
        phase = "active";
      }
      var attrs = normaliseAttrs(input.attrs);
      var variantId = String((input && input.variant_id) == null ? "" : (input && input.variant_id)).trim();
      var customization = (input.customization || []).map(String);
      var key = makeKey(model, attrs, customization, variantId);
      var list = rawLines();
      var hit = null;
      list.forEach(function (i) {
        if (i.key === key) hit = i;
      });
      if (hit) {
        hit.qty = Math.min(MAX_QTY, hit.qty + normaliseQty(input.qty));
      } else {
        list.push({
          key: key,
          model: model,
          variant_id: variantId,
          qty: normaliseQty(input.qty),
          attrs: attrs,
          customization: customization,
          note: typeof input.note === "string" ? input.note : "",
          addedAt: now()
        });
      }
      saveVisible(list);
      return key;
    },

    /* 改配置 / 加工 / 备注 / 数量 —— key 会因配置变化而重算，
       若与既有条目撞 key 就并入那条（避免出现两行一模一样的） */
    updateLine: function (key, patch) {
      var list = rawLines();
      var idx = -1;
      list.forEach(function (i, n) {
        if (i.key === key) idx = n;
      });
      if (idx < 0) return null;

      var cur = list[idx];
      var next = {
        model: cur.model,
        variant_id: patch && patch.variant_id != null ? String(patch.variant_id).trim() : cur.variant_id,
        qty: patch && patch.qty != null ? normaliseQty(patch.qty) : cur.qty,
        attrs: patch && patch.attrs ? normaliseAttrs(patch.attrs) : cur.attrs,
        customization: patch && patch.customization ? patch.customization.map(String) : cur.customization,
        note: patch && typeof patch.note === "string" ? patch.note : cur.note,
        addedAt: cur.addedAt
      };
      var nextKey = makeKey(next.model, next.attrs, next.customization, next.variant_id);

      var collide = -1;
      list.forEach(function (i, n) {
        if (n !== idx && i.key === nextKey) collide = n;
      });
      if (collide >= 0) {
        list[collide].qty = Math.min(MAX_QTY, list[collide].qty + next.qty);
        list.splice(idx, 1);
      } else {
        list[idx] = Object.assign({}, next, { key: nextKey });
      }
      saveVisible(list);
      return nextKey;
    },

    setQty: function (key, qty) {
      var n = Number(qty);
      if (!isFinite(n) || n < 1) return api.removeLine(key);
      var list = rawLines();
      var changed = false;
      list.forEach(function (i) {
        if (i.key === key) {
          i.qty = normaliseQty(n);
          changed = true;
        }
      });
      if (changed) saveVisible(list);
      return changed;
    },

    removeLine: function (key) {
      var before = rawLines();
      var after = before.filter(function (i) {
        return i.key !== key;
      });
      if (after.length === before.length) return false;
      saveVisible(after);
      return true;
    },

    removeModel: function (model) {
      var m = String(model == null ? "" : model);
      var before = rawLines();
      var after = before.filter(function (i) {
        return i.model !== m;
      });
      if (after.length === before.length) return false;
      saveVisible(after);
      return true;
    },

    clear: function () {
      dropAll();
      phase = "empty";
      emit("cart");
    },

    prune: function (isValid) {
      if (typeof isValid !== "function") return [];
      var list = rawLines();
      var dropped = [];
      var kept = list.filter(function (i) {
        if (isValid(i.model)) return true;
        dropped.push(i.model);
        return false;
      });
      if (dropped.length) saveVisible(kept);
      return dropped;
    },

    /* ── 整单需求 ──────────────────────────────────────────────────────── */
    request: loadRequest,
    saveRequest: saveRequest,

    /* 汇总：条目数 / 总件数 / 加工项并集（去重） */
    summary: function () {
      var lines = visibleLines();
      var custom = Object.create(null);
      var order = [];
      var push = function (c) {
        if (!custom[c]) {
          custom[c] = true;
          order.push(c);
        }
      };
      loadRequest().customization.forEach(push);
      lines.forEach(function (l) {
        l.customization.forEach(push);
      });
      return {
        lines: lines.length,
        units: lines.reduce(function (n, i) {
          return n + i.qty;
        }, 0),
        customization: order
      };
    },

    subscribe: function (fn) {
      if (typeof fn !== "function") return function () {};
      global.addEventListener(EVENT, fn);
      return function () {
        global.removeEventListener(EVENT, fn);
      };
    },

    makeKey: makeKey,

    /* 交给 RFQ 的表单线：gsl-s1:5,gsl-s4:2 */
    toQuery: function () {
      return visibleLines()
        .map(function (i) {
          return encodeURIComponent(i.model) + ":" + i.qty;
        })
        .join(",");
    }
  };

  global.QuoteCart = api;

  migrate();
  scrubLegacyContact();
  expireIfStale();
  selfHeal();
  resolveRestore(false);
  markSession();

  /* 多标签页同步 */
  global.addEventListener("storage", function (e) {
    if (!e) return;
    /* 别的标签页已经决定了「恢复」还是「重新开始」——本标签页收起提示跟上 */
    if (e.key === SIGNAL_KEY) {
      if (phase === "pending") {
        resolveRestore(true);
        emit("restore");
      }
      return;
    }
    if (e.key === KEY || e.key === REQ_KEY || e.key === META_KEY || e.key === CONTACT_KEY) emit("storage");
  });
})(window);
