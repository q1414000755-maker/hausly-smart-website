/* Quote Drawer 运行逻辑 —— B2B 询价清单侧边栏（不是购物车）。
   ─────────────────────────────────────────────────────────────────────────
   四个状态共用一个面板（壳由 shell-render.mjs 直出）：
     list  清单：产品行 + 数量步进 + 配置摘要 + 加工摘要 + Apply-to-all
     edit  改单个产品的数量 / 配置 / 加工 / 备注
     send  联系方式（Email 排第一，字段尽量少）
     done  已提交 / 待发送

   数据来源严格分开：
     · 清单条目  ← QuoteCart（localStorage）
     · 产品信息  ← window.Z02_CATALOG（构建期生成，按 model_id 取）
     · 全部文案  ← 壳里的 DOM（真源 pages.json.quoteDrawer），本文件不写死任何句子，
                   需要动态拼接的地方一律读壳上已有的文案再替换占位符。
*/
(function () {
  "use strict";

  /* 等 DOMContentLoaded 再挂：壳、QuoteCart、Z02_CATALOG 都可能排在本文件之后执行
     （脚本都是 defer，按文档顺序跑完才触发 DOMContentLoaded）。 */
  var boot = function () {

  var root = document.querySelector("[data-quote-drawer]");
  if (!root || !window.QuoteCart) return;

  var CART = window.QuoteCart;
  var CAT = window.Z02_CATALOG || { models: {}, dims: {}, validIds: [] };
  var MODELS = CAT.models || {};
  var DIMS = CAT.dims || {};

  /* 清单行摘要最多显示几项。5 项 ≈ 一行 40–45 字符，正好塞进 540px 抽屉行
     而不换行；再多就会把产品行撑高，扫清单时反而看不清。 */
  var SUMMARY_MAX = 5;

  /* ── DOM ────────────────────────────────────────────────────────────── */
  var q = function (sel) {
    return root.querySelector(sel);
  };
  var qa = function (sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  };
  var states = {};
  qa("[data-quote-state]").forEach(function (s) {
    states[s.getAttribute("data-quote-state")] = s;
  });

  var el = {
    lines: q("[data-quote-lines]"),
    empty: q("[data-quote-empty]"),
    all: q("[data-quote-all]"),
    allOptions: qa("[data-quote-all-option]"),
    applyAll: q("[data-quote-apply-all]"),
    /* 整单加工项默认折叠（包子 2026-09-19） */
    allHead: q("[data-quote-all-toggle]"),
    allBody: q("[data-quote-all-body]"),
    allCount: q("[data-quote-all-count]"),
    summary: q("[data-quote-summary]"),
    headCount: q("[data-quote-head-count]"),
    send: q("[data-quote-send]"),
    submit: q("[data-quote-submit]"),
    back: qa("[data-quote-back]"),
    save: q("[data-quote-save]"),
    editBody: q("[data-quote-edit-body]"),
    sendMeta: q("[data-quote-send-meta]"),
    error: q("[data-quote-error]"),
    fields: qa("[data-quote-field]"),
    doneTitle: q("[data-quote-done-title]"),
    doneBody: q("[data-quote-done-body]"),
    copySummary: q("[data-quote-copy-summary]"),
    continue: q("[data-quote-continue]"),
    /* ⚠️ toast 不在 root 里：它是抽屉的兄弟节点 —— 抽屉关着的时候（刚加购）
       也必须能弹出来。用 root.querySelector 会永远拿到 null，静默不显示。 */
    toast: document.querySelector("[data-quote-toast]"),
    full: qa("[data-quote-full]"),
    /* 清空确认：四个态各有一个 .qd-foot，必须锚到 list 那一块，别拿全局第一个 */
    listFoot: states.list ? states.list.querySelector(".qd-foot") : null,
    clearOpen: q("[data-quote-clear-open]"),
    clearConfirm: q("[data-quote-clear-confirm]"),
    clearBody: q("[data-quote-clear-body]"),
    restoreInline: q("[data-quote-restore-inline]"),
    restoreInlineBody: q("[data-quote-restore-inline-body]")
  };

  /* ── 运行期文案：全部来自壳里的 qd-i18n（真源 pages.json.quoteDrawer）。
        本文件不写死句子 —— 要改措辞改注册表，不要改这里。 ──────────────── */
  var I18N = (function () {
    try {
      var node = document.getElementById("qd-i18n");
      return node ? JSON.parse(node.textContent) : {};
    } catch (e) {
      return {};
    }
  })();

  /* Stage 05-04: one idempotency key per unchanged Quote List request.
     Retries reuse it; changing products, quantities or contact details gets
     a new key. No customer data is written to localStorage. */
  var requestKey = "";
  var requestFingerprint = "";
  var makeToken = function () {
    var raw = "";
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") raw = window.crypto.randomUUID();
      else if (window.crypto && typeof window.crypto.getRandomValues === "function") {
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        raw = Array.prototype.map.call(bytes, function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
      }
    } catch (e) {}
    return (raw || Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 128);
  };
  var fingerprint = function (payload) {
    var source = JSON.stringify({ items: payload.items, customer: payload.customer, requirements: payload.requirements });
    var hash = 2166136261;
    for (var i = 0; i < source.length; i += 1) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16) + "-" + source.length;
  };
  var idempotencyFor = function (payload) {
    var nextFingerprint = fingerprint(payload);
    if (!requestKey || requestFingerprint !== nextFingerprint) {
      requestFingerprint = nextFingerprint;
      requestKey = makeToken();
    }
    return requestKey;
  };

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ── 目录查询 ───────────────────────────────────────────────────────── */
  var model = function (id) {
    return MODELS[id] || null;
  };

  var variantImage = function (rec, attrs, variantId) {
    if (!rec) return "";
    var resolver = window.Z02_VARIANT_RESOLVER;
    var hit = resolver
      ? resolver.resolve(rec, attrs, { variantId: variantId, allowDefault: true, preferredId: rec.primary_variant })
      : null;
    if (hit && hit.image) return typeof hit.image === "string" ? hit.image : hit.image.src || "";
    return rec.image || "";
  };

  /* 该型号当前配置下对应的变体（用来显示 SKU）。找不到就明说待确认，不假装。 */
  var matchVariant = function (rec, attrs, variantId) {
    if (!rec || !attrs) return null;
    var resolver = window.Z02_VARIANT_RESOLVER;
    if (!resolver) return null;
    return resolver.resolveExact(rec, attrs, { variantId: variantId });
  };

  /* 清单行摘要。
     ⚠️ 实现**不在这个文件里** —— 在目录产物 `window.Z02_CONFIG_SUMMARY`（由 build.mjs 生成，
     见 quote-catalog.js）。原因：dims/labels 是目录的数据，只有目录知道哪些维度是
     primary（版本身份），哪些是规格细节；而且 Quote List 页要用同一份排版。
     以前这里叫 primarySummary、清单页叫 configText，两处各写一遍 —— 必然漂。

     包子 2026-09-19 看图：「内容应该精简」。原来把 9 个维度全铺开，
     540px 的抽屉行被撑成 4 行、客户扫清单时反而什么都看不见。
     现在只报前 5 项（primary 优先），其余用「+N more」明说，完整串挂 title。 */
  var summaryOf = function (rec, attrs) {
    if (!rec || !attrs) return null;
    var fn = window.Z02_CONFIG_SUMMARY;
    if (typeof fn !== "function") {
      /* 不写兜底渲染 —— 兜底会让「目录没加载」这件事静默看起来正常（本项目约定） */
      console.warn("Z02_CONFIG_SUMMARY missing — quote-catalog.js 没加载？");
      return null;
    }
    return fn(rec, attrs, SUMMARY_MAX);
  };

  var summaryMoreLabel = function (n) {
    return String(I18N.summaryMore || "+{n} more").replace("{n}", String(n));
  };

  /* 提交用的 payload 与复制出去的摘要必须是**完整**配置 ——
     屏幕上为了好扫才截到 5 项，发出去的东西不能跟着一起精简。 */
  var configFull = function (rec, attrs) {
    var s = summaryOf(rec, attrs);
    return s ? s.full : "";
  };

  /* 条目自带的配置为空时回落到该型号的默认（primary）配置 —— 只用于**展示**，
     不写回存储：客户从列表页加进来时并没有挑配置，界面上仍要说清
     「这将按哪个版本询价」，但别把默认值伪装成客户的选择。 */
  var effectiveAttrs = function (line, rec) {
    if (line.attrs && Object.keys(line.attrs).length) return line.attrs;
    return (rec && rec.attrs) || {};
  };

  var hasOwnAttrs = function (line) {
    return Boolean(line.attrs && Object.keys(line.attrs).length);
  };

  var priceLabel = function (rec) {
    var p = rec && rec.price;
    if (!p || p.amount == null || p.amount === "") return null;
    var n = Number(p.amount);
    if (!isFinite(n)) return null;
    var cur = p.currency ? String(p.currency) : "USD";
    var digits = Math.abs(n - Math.round(n)) < 0.005 ? 0 : 2;
    return cur + " " + n.toFixed(digits);
  };

  var optionLabel = function (id) {
    var hit = (I18N.customOptions || []).filter(function (o) {
      return o.id === id;
    })[0];
    return hit ? hit.label : id;
  };

  /* ── 渲染：清单行 ───────────────────────────────────────────────────── */
  var lineHtml = function (line) {
    var rec = model(line.model);
    var name = (rec && rec.name) || line.model;
    var family = (rec && rec.family) || "";
    var attrs = effectiveAttrs(line, rec);
    var summary = summaryOf(rec, attrs);
    var variant = matchVariant(rec, attrs, line.variant_id);
    var img = variantImage(rec, attrs, line.variant_id);
    var price = priceLabel(variant || rec);

    var custom = (line.customization || []).map(optionLabel);
    var customLine = custom.length
      ? esc(custom.join(" \u00b7 "))
      : '<span class="qd-muted">' + esc(I18N.notSelected) + "</span>";

    return (
      '<li class="qd-line" data-line-key="' +
      esc(line.key) +
      '">' +
      '<div class="qd-line-top">' +
      '<div class="qd-thumb">' +
      (img
        ? '<img src="' + esc(String(img).replace(/^\//, "")) + '" alt="" loading="lazy" decoding="async">'
        : "") +
      "</div>" +
      '<div class="qd-line-head">' +
      "<h3>" +
      (rec ? '<a href="product-detail-v3.html?model=' + encodeURIComponent(line.model) + '">' + esc(name) + "</a>" : esc(name)) +
      "</h3>" +
      (family ? '<p class="qd-line-family">' + esc(family) + "</p>" : "") +
      (summary
        ? '<p class="qd-line-config"' +
          (summary.hidden ? ' title="' + esc(summary.full) + '"' : "") +
          "><span>" +
          esc(I18N.selectedLabel) +
          '</span><em class="qd-line-summary">' +
          esc(summary.text) +
          "</em>" +
          (summary.hidden
            ? '<em class="qd-line-more">' + esc(summaryMoreLabel(summary.hidden)) + "</em>"
            : "") +
          "</p>"
        : "") +
      "</div>" +
      '<button type="button" class="qd-line-remove" data-line-remove aria-label="' + esc(I18N.removeLabel) + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M5 7h14M10 7V5.4h4V7M8 7l.8 12.2h6.4L16 7"/></svg>' +
      "</button>" +
      "</div>" +
      '<div class="qd-line-block">' +
      '<span class="qd-line-label">' + esc(I18N.qtyLabel) + "</span>" +
      '<div class="qd-stepper">' +
      '<button type="button" data-line-step="-1" aria-label="Decrease quantity">\u2212</button>' +
      '<input type="number" min="1" max="99999" step="1" inputmode="numeric" value="' +
      line.qty +
      '" data-line-qty aria-label="' +
      esc(I18N.qtyLabel + " " + name) +
      '">' +
      '<button type="button" data-line-step="1" aria-label="Increase quantity">+</button>' +
      "</div>" +
      (price ? '<span class="qd-line-price">' + esc(price) + "</span>" : "") +
      "</div>" +
      '<div class="qd-line-block">' +
      '<span class="qd-line-label">' + esc(I18N.customizationLabel) + "</span>" +
      '<span class="qd-line-custom">' + customLine + "</span>" +
      "</div>" +
      '<div class="qd-line-actions">' +
      '<button type="button" class="qd-link qd-link--btn" data-line-edit>' +
      (hasOwnAttrs(line) || custom.length ? esc(I18N.editLabel) : esc(I18N.addReqLabel)) +
      ' <b aria-hidden="true">\u2192</b></button>' +
      "</div>" +
      "</li>"
    );
  };

  /* ── 渲染：汇总 / 头部 ──────────────────────────────────────────────── */
  var renderSummary = function (sum) {
    if (!el.summary) return;
    if (!sum.lines) {
      el.summary.hidden = true;
      el.summary.innerHTML = "";
      return;
    }
    var plug = function (tpl, map) {
      return String(tpl).replace(/\{(\w+)\}/g, function (m, k) {
        return map[k] != null ? map[k] : m;
      });
    };
    var rows = [
      '<p class="qd-summary-title">' + esc(I18N.summaryTitle) + "</p>",
      '<ul class="qd-summary-list">',
      "<li>" + esc(plug(I18N.summaryProducts, { n: sum.lines })) + "</li>",
      "<li>" + esc(plug(I18N.summaryUnits, { n: sum.units })) + "</li>",
      sum.customization.length
        ? "<li>" + esc(I18N.summaryCustom) + ": " + esc(sum.customization.map(optionLabel).join(" \u00b7 ")) + "</li>"
        : "",
      "</ul>"
    ].join("");
    el.summary.hidden = false;
    el.summary.innerHTML = rows;
  };

  var renderHeadCount = function (sum) {
    if (!el.headCount) return;
    var tpl = sum.lines === 1 ? I18N.countOne : I18N.countMany;
    el.headCount.textContent = String(tpl || "").replace("{n}", String(sum.lines));
  };

  var currentState = "list";

  /* ── 恢复旧草稿（分级策略见 assets/js/quote-cart.js 顶部注释） ─────────
     两个入口共用同一套 accept / decline 委托处理器：
       · 右下角提示条 —— 主动告诉回来的访客「你上次存了东西」
       · 抽屉空态位置的内联块 —— 提示条被「×」掉之后的找回路径
     刻意都不做成 Modal：包子明确不要「一进来就弹大框挡住 Hero」。 */
  var syncRestoreCopy = function () {
    if (!el.restoreInlineBody) return;
    var n = CART.pendingCount ? CART.pendingCount() : 0;
    var R = I18N.restore || {};
    var tpl = n === 1 ? R.one : R.many;
    el.restoreInlineBody.textContent = String(tpl || "").replace("{n}", String(n));
  };

  var restoreBar = null;
  var restoreBarBody = null;

  var buildRestoreBar = function () {
    var R = I18N.restore || {};
    if (!R.title) return;
    restoreBar = document.createElement("div");
    restoreBar.className = "qd-restore";
    restoreBar.setAttribute("role", "status");
    restoreBar.hidden = true;
    restoreBar.innerHTML =
      '<button type="button" class="qd-icon-btn qd-restore-close" data-quote-restore-close aria-label="' +
      esc(R.close || "Dismiss") +
      '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>' +
      '<p class="qd-restore-title">' +
      esc(R.title) +
      '</p><p class="qd-restore-body" data-quote-restore-bar-body></p>' +
      '<span class="qd-restore-note">' +
      esc(R.note || "") +
      "</span>" +
      '<div class="qd-restore-actions">' +
      '<button type="button" class="qd-btn qd-btn--primary" data-quote-restore-accept>' +
      esc(R.accept || "") +
      "</button>" +
      '<button type="button" class="qd-btn qd-btn--ghost" data-quote-restore-decline title="' +
      esc(R.declineNote || "") +
      '">' +
      esc(R.decline || "") +
      "</button></div>";
    restoreBarBody = restoreBar.querySelector("[data-quote-restore-bar-body]");
    document.body.appendChild(restoreBar);
  };

  /* 只在「有旧草稿待确认」且「抽屉关着」时出现 ——
     抽屉一开，恢复入口就在里面（内联块），两条提示不该同屏打架。 */
  var syncRestoreBar = function () {
    if (!restoreBar) return;
    var pending = Boolean(CART.hasPending && CART.hasPending());
    if (!pending || !root.hidden || (CART.promptDismissed && CART.promptDismissed())) {
      restoreBar.hidden = true;
      return;
    }
    var n = CART.pendingCount ? CART.pendingCount() : 0;
    var R = I18N.restore || {};
    var tpl = n === 1 ? R.one : R.many;
    if (restoreBarBody) restoreBarBody.textContent = String(tpl || "").replace("{n}", String(n));
    restoreBar.hidden = false;
  };

  /* ── 清空确认（整单级动作，代价大，必须确认；单条 Remove 走 Undo 不弹窗） ── */
  var openClearConfirm = function () {
    if (!el.listFoot || !el.clearConfirm) return;
    if (el.clearBody) {
      /* 文案里带准确条数，别让用户猜「all」到底是几个；1 个要用单数版 */
      var n = CART.count();
      el.clearBody.textContent = String(el.clearBody.getAttribute(n === 1 ? "data-one" : "data-many") || "").replace(
        "{n}",
        String(n)
      );
    }
    el.clearConfirm.hidden = false;
    el.listFoot.classList.add("is-confirming");
    var ok = el.clearConfirm.querySelector("[data-quote-clear-ok]");
    if (ok) ok.focus({ preventScroll: true });
  };

  var closeClearConfirm = function () {
    if (!el.clearConfirm) return;
    if (el.clearConfirm.hidden && (!el.listFoot || !el.listFoot.classList.contains("is-confirming"))) return;
    el.clearConfirm.hidden = true;
    if (el.listFoot) el.listFoot.classList.remove("is-confirming");
  };

  /* 恢复 / 重新开始：两个入口（右下角提示条、抽屉内联块）共用 */
  var acceptRestore = function () {
    if (!CART.restore || !CART.restore()) return;
    toast((I18N.restore || {}).restored);
    render();
    syncRestoreBar();
  };

  var declineRestore = function () {
    if (!CART.discard || !CART.discard()) return;
    toast((I18N.restore || {}).discarded);
    render();
    syncRestoreBar();
  };

  /* 单条删除**不**弹确认框 —— 但必须给 Undo，否则误点一下就得把配置重配一遍。
     整单 Clear 才走确认（见 openClearConfirm）。 */
  var removeWithUndo = function (key) {
    var line = CART.line(key);
    if (!line) return;
    var rec = model(line.model);
    var name = (rec && rec.name) || line.model;
    CART.removeLine(key);
    toast(
      name + " \u2014 " + (I18N.lineRemoved || "Removed"),
      I18N.undo,
      function () {
        /* 原样写回：数量 / 配置 / 加工项 / 备注一个不丢（key 会重新派生，结果等价） */
        CART.addLine({
          model: line.model,
          variant_id: line.variant_id,
          qty: line.qty,
          attrs: line.attrs,
          customization: line.customization,
          note: line.note
        });
      },
      6000
    );
  };

  /* ── 整单加工项（OEM / ODM 那块）：默认折叠 ─────────────────────────────
     包子 2026-09-19：不该一进来就压掉半屏清单，客户要谈 OEM / ODM / 包装 /
     丝印时**才**点开。注意是「默认折叠」而不是「有选过就展开」——
     第一版写成 allOpen = allPicked > 0，结果只要客户在单品里勾过一项，
     整块就又铺开了，等于没折。**折叠行的「N selected」药丸已经把这个信息
     说清楚了**，不需要替他展开。

     两个「用户碰过」标志必须是分开的，否则会互相干扰：
       allOpenTouched 只管披露态（点过标题行）→ 冻结展开/折叠
       allBoxTouched  只管勾选框（动过任意一个）→ 冻结「按请求里的项回填」
     合用一个标志的话，客户点开一下就会连带把勾选框冻结在旧快照上。 */
  var allOpen = false;
  var allOpenTouched = false;
  var allBoxTouched = false;

  /* 折叠行右侧药丸 = 当前勾选数。不另存一个变量 —— 显示的口径必须
     和客户点开后看到的东西物理同一份，否则又会漂成「写着 2、点开 0 个」。 */
  var syncAll = function () {
    if (!el.allHead || !el.allBody) return;
    if (!allOpenTouched) allOpen = false;
    el.allBody.hidden = !allOpen;
    if (el.all) el.all.classList.toggle("is-open", allOpen);
    el.allHead.setAttribute("aria-expanded", allOpen ? "true" : "false");
    if (el.allCount) {
      var n = el.allOptions.filter(function (i) {
        return i.checked;
      }).length;
      if (n > 0) {
        el.allCount.hidden = false;
        el.allCount.textContent = String(I18N.allCount || "{n} selected").replace("{n}", String(n));
      } else {
        el.allCount.hidden = true;
        el.allCount.textContent = "";
      }
    }
  };

  /* 勾选框回填：把这个请求里已经涉及的加工项预勾上。
     不做这一步的话，折叠行写着「2 selected」、点开却是 5 个空框 —— 客户会
     以为自己选的东西丢了，然后重新勾一遍。回填来源是 summary().customization
     （整单项 ∪ 各条产品自带的），也就是药丸数出来的那一份，口径天然一致。
     ⚠️ 客户动过任意一个勾选框之后就不再回填（allBoxTouched），否则他取消勾选
        会被下一次 render 又勾回来 —— 因为那条线里确实还留着这个需求。 */
  var seedAll = function (picked) {
    if (allBoxTouched) return;
    var set = Object.create(null);
    (picked || []).forEach(function (c) {
      set[c] = true;
    });
    el.allOptions.forEach(function (i) {
      i.checked = Boolean(set[i.value]);
    });
  };

  var render = function () {
    var sum = CART.summary();
    var lines = CART.lines();
    var has = lines.length > 0;
    /* 旧草稿还没确认是不是同一个人：清单按空处理，空态位置换成恢复入口 */
    var pending = Boolean(CART.hasPending && CART.hasPending());

    if (el.restoreInline) el.restoreInline.hidden = !pending;
    if (el.empty) el.empty.hidden = has || pending;
    if (el.all) el.all.hidden = !has;
    /* 清单空的时候不摆「Clear list」——没东西可清 */
    if (el.clearOpen) el.clearOpen.hidden = !has;
    if (el.lines) el.lines.innerHTML = lines.map(lineHtml).join("");
    syncRestoreCopy();
    closeClearConfirm();
    /* 顺序有意义：先回填勾选框，药丸要按回填后的勾选数来写 */
    seedAll(sum.customization);
    syncAll();
    renderSummary(sum);
    renderHeadCount(sum);

    if (el.sendMeta) {
      el.sendMeta.textContent = String(I18N.sendMeta || "")
        .replace("{p}", String(sum.lines))
        .replace("{u}", String(sum.units));
    }
    if (el.send) el.send.disabled = !has;
  };

  /* ── 状态切换 ───────────────────────────────────────────────────────── */
  var setState = function (next) {
    currentState = next;
    Object.keys(states).forEach(function (k) {
      states[k].hidden = k !== next;
    });
    if (next === "list") render();
    var panel = root.querySelector(".qd-panel");
    if (panel) panel.scrollTop = 0;
    var scroller = states[next] && states[next].querySelector(".qd-scroll");
    if (scroller) scroller.scrollTop = 0;
    /* 切回 list 总是回顶：prepare 提示块跟着展开（scrollTop 赋值在已是 0 时不触发 scroll 事件） */
    if (next === "list") {
      var prep = root.querySelector(".qd-prepare");
      if (prep) prep.classList.remove("is-collapsed");
    }
  };

  var restoreFocus = null;

  var open = function (state) {
    if (!root.hidden) {
      if (state) setState(state);
      return;
    }
    restoreFocus = document.activeElement;
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("qd-lock");
    /* 每次重新打开都回到「默认折叠」，否则客户为了看一眼清单而展开过，
       下次进来还是铺开的 —— 那就白折了 */
    allOpenTouched = false;
    allBoxTouched = false;
    setState(state || "list");
    var panel = root.querySelector(".qd-panel");
    if (panel) {
      /* 焦点移进抽屉，键盘用户不会掉在背景里 */
      var first = panel.querySelector("button, a, input, textarea");
      if (first) first.focus({ preventScroll: true });
      else panel.focus({ preventScroll: true });
    }
    /* 抽屉开了，恢复入口就在里面那块，右下角那条让位 */
    syncRestoreBar();
  };

  var close = function () {
    if (root.hidden) return;
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("qd-lock");
    if (restoreFocus && typeof restoreFocus.focus === "function") {
      restoreFocus.focus({ preventScroll: true });
    }
    restoreFocus = null;
    syncRestoreBar();
  };

  /* ── 编辑状态：按品类自己的维度渲染 ───────────────────────────────── */
  var editingKey = null;

  var editHtml = function (line) {
    var rec = model(line.model);
    var name = (rec && rec.name) || line.model;
    var dimsInfo = rec ? DIMS[rec.categoryPage] : null;
    var dims = (dimsInfo && dimsInfo.dimensions) || [];
    var labels = (dimsInfo && dimsInfo.labels) || {};
    var order = (dimsInfo && dimsInfo.value_order) || {};
    var curAttrs = effectiveAttrs(line, rec);
    var img = variantImage(rec, curAttrs);
    var matched = matchVariant(rec, curAttrs);
    var skuLine = matched
      ? '<p class="qd-edit-sku">' + esc(I18N.matchedSku) + " <span>" + esc(matched.sku || matched.variant_id) + "</span></p>"
      : '<p class="qd-edit-sku qd-muted">' + esc(I18N.pendingSku) + "</p>";

    /* 每个维度一个单选组：值来自该型号所有变体里出现过的取值，顺序按数据里的 value_order。
       末尾固定加一个「不确定/需要建议」—— 不是每个采购都懂 Zigbee 和 Matter 的区别，
       不给这条出路只会降低提交率（包子 2026-09-19 第 14 条）。 */
    var seen = {};
    (rec && rec.variants ? rec.variants : []).forEach(function (v) {
      Object.keys(v.attrs || {}).forEach(function (k) {
        seen[k] = seen[k] || {};
        (v.attrs[k] || []).forEach(function (val) {
          seen[k][val] = true;
        });
      });
    });

    var configBlocks = dims
      .map(function (d) {
        var values = Object.keys(seen[d.key] || {});
        if (!values.length) return "";
        var ord = order[d.key];
        if (Array.isArray(ord) && ord.length) {
          values.sort(function (a, b) {
            var ia = ord.indexOf(a);
            var ib = ord.indexOf(b);
            if (ia < 0) ia = 999;
            if (ib < 0) ib = 999;
            return ia - ib;
          });
        }
        var cur = curAttrs[d.key] || [];
        var opts = values
          .map(function (val) {
            var on = cur.indexOf(val) >= 0;
            return (
              '<label class="qd-radio"><input type="radio" name="qd-dim-' +
              esc(d.key) +
              '" value="' +
              esc(val) +
              '" data-edit-dim="' +
              esc(d.key) +
              '"' +
              (on ? " checked" : "") +
              "><i aria-hidden=\"true\"></i><span>" +
              esc((labels[d.key] && labels[d.key][val]) || val) +
              "</span></label>"
            );
          })
          .join("");
        var unsureOn = cur.length === 0;
        opts +=
          '<label class="qd-radio"><input type="radio" name="qd-dim-' +
          esc(d.key) +
          '" value="" data-edit-dim="' +
          esc(d.key) +
          '"' +
          (unsureOn ? " checked" : "") +
          '><i aria-hidden="true"></i><span class="qd-muted">' +
          esc(I18N.notSure) +
          "</span></label>";
        return (
          '<section class="qd-edit-group"><h4>' +
          esc(d.label) +
          "</h4><div class=\"qd-radios\">" +
          opts +
          "</div></section>"
        );
      })
      .join("");

    var customChecks = (I18N.customOptions || [])
      .map(function (o) {
        var on = (line.customization || []).indexOf(o.id) >= 0;
        return (
          '<label class="qd-check"><input type="checkbox" value="' +
          esc(o.id) +
          '" data-edit-option' +
          (on ? " checked" : "") +
          '><i aria-hidden="true"></i><span>' +
          esc(o.label) +
          "</span></label>"
        );
      })
      .join("");

    return (
      '<div class="qd-edit-head">' +
      '<div class="qd-thumb qd-thumb--lg">' +
      (img ? '<img src="' + esc(String(img).replace(/^\//, "")) + '" alt="" loading="lazy" decoding="async">' : "") +
      "</div>" +
      "<div><h3>" + esc(name) + "</h3>" + skuLine + "</div>" +
      "</div>" +
      (configBlocks
        ? '<section class="qd-edit-group qd-edit-group--config"><h3 class="qd-section-title">' +
          esc(I18N.configTitle) +
          '</h3><p class="qd-edit-note">' +
          esc(I18N.configNote) +
          "</p>" +
          configBlocks +
          "</section>"
        : "") +
      '<section class="qd-edit-group"><h3 class="qd-section-title">' +
      esc(I18N.qtyTitle) +
      '</h3><div class="qd-stepper qd-stepper--wide">' +
      '<button type="button" data-edit-step="-1" aria-label="Decrease quantity">\u2212</button>' +
      '<input type="number" min="1" max="99999" step="1" inputmode="numeric" value="' +
      line.qty +
      '" data-edit-qty aria-label="' +
      esc(I18N.qtyTitle) +
      '">' +
      '<button type="button" data-edit-step="1" aria-label="Increase quantity">+</button>' +
      "</div></section>" +
      '<section class="qd-edit-group"><h3 class="qd-section-title">' +
      esc(I18N.customTitle) +
      '</h3><div class="qd-checks">' +
      customChecks +
      "</div></section>" +
      '<section class="qd-edit-group"><h3 class="qd-section-title">' +
      esc(I18N.noteTitle) +
      '</h3><textarea rows="3" data-edit-note placeholder="' +
      esc(I18N.notePlaceholder) +
      '">' +
      esc(line.note || "") +
      "</textarea></section>"
    );
  };

  var openEdit = function (key) {
    var line = CART.line(key);
    if (!line) return;
    editingKey = key;
    if (el.editBody) el.editBody.innerHTML = editHtml(line);
    setState("edit");
  };

  /* ── 提示条（加购后不自动开抽屉，只给一个很轻的反馈 —— 包子第 27 条）── */
  var toastTimer = 0;
  var toast = function (text, actionLabel, action, ms) {
    if (!el.toast) return;
    el.toast.innerHTML =
      '<span class="qd-toast-text">' + esc(text) + "</span>" +
      (actionLabel ? '<button type="button" class="qd-toast-action">' + esc(actionLabel) + "</button>" : "");
    el.toast.hidden = false;
    el.toast.classList.add("is-on");
    if (actionLabel && action && el.toast.querySelector(".qd-toast-action")) {
      el.toast.querySelector(".qd-toast-action").onclick = function () {
        hideToast();
        action();
      };
    }
    window.clearTimeout(toastTimer);
    /* Undo 要留够反应时间，默认 3.2s 对「点撤销」偏短 */
    toastTimer = window.setTimeout(hideToast, ms || 3200);
  };
  var hideToast = function () {
    if (!el.toast) return;
    el.toast.classList.remove("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.toast.hidden = true;
    }, 200);
  };

  /* ── 事件 ───────────────────────────────────────────────────────────── */
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-quote-open]");
    if (opener) {
      e.preventDefault();
      open("list");
      return;
    }
    /* 右下角恢复提示条不在抽屉里（document.body 直挂），只能走 document 委托。
       ⚠️ 必须先判断 .qd-restore：否则抽屉内联块里的同名按钮会被两处各处理一次。 */
    if (!e.target.closest(".qd-restore")) return;
    if (e.target.closest("[data-quote-restore-accept]")) {
      acceptRestore();
      return;
    }
    if (e.target.closest("[data-quote-restore-decline]")) {
      declineRestore();
      return;
    }
    if (e.target.closest("[data-quote-restore-close]")) {
      /* 「×」= 这次别问了。草稿与页头蓝点都留着，抽屉里还能找回 */
      if (CART.dismissPrompt) CART.dismissPrompt();
      syncRestoreBar();
    }
  });

  root.addEventListener("click", function (e) {
    if (e.target.closest("[data-quote-close]")) {
      close();
      return;
    }
    if (e.target.closest("[data-quote-back]")) {
      setState("list");
      return;
    }
    if (e.target.closest("[data-quote-continue]")) {
      close();
      return;
    }

    /* 发现旧草稿（抽屉内联块）*/
    if (e.target.closest("[data-quote-restore-accept]")) {
      acceptRestore();
      return;
    }
    if (e.target.closest("[data-quote-restore-decline]")) {
      declineRestore();
      return;
    }

    /* Clear list：先确认再删 */
    if (e.target.closest("[data-quote-clear-open]")) {
      openClearConfirm();
      return;
    }
    if (e.target.closest("[data-quote-clear-cancel]")) {
      closeClearConfirm();
      return;
    }
    if (e.target.closest("[data-quote-clear-ok]")) {
      CART.clear();
      closeClearConfirm();
      toast(I18N.clearDone);
      return;
    }

    /* 清单行操作 */
    var step = e.target.closest("[data-line-step]");
    if (step) {
      var row = step.closest("[data-line-key]");
      if (row) {
        var line = CART.line(row.getAttribute("data-line-key"));
        if (line) CART.setQty(line.key, line.qty + Number(step.getAttribute("data-line-step")));
      }
      return;
    }
    var rm = e.target.closest("[data-line-remove]");
    if (rm) {
      var r2 = rm.closest("[data-line-key]");
      if (r2) removeWithUndo(r2.getAttribute("data-line-key"));
      return;
    }
    var ed = e.target.closest("[data-line-edit]");
    if (ed) {
      var r3 = ed.closest("[data-line-key]");
      if (r3) openEdit(r3.getAttribute("data-line-key"));
      return;
    }

    /* 整单加工项折叠 / 展开（默认折叠，见 syncAll 注释） */
    if (e.target.closest("[data-quote-all-toggle]")) {
      allOpenTouched = true;
      allOpen = !allOpen;
      syncAll();
      return;
    }

    /* Apply to all */
    if (e.target.closest("[data-quote-apply-all]")) {
      var picked = el.allOptions
        .filter(function (i) {
          return i.checked;
        })
        .map(function (i) {
          return i.value;
        });
      /* 写进整单需求，并逐条落到每个产品上 —— 客户之后仍可单独改某一个 */
      CART.saveRequest({ customization: picked });
      CART.lines().forEach(function (l) {
        CART.updateLine(l.key, { customization: picked });
      });
      toast(I18N.appliedAll);
      return;
    }

    /* 编辑态：步进 / 保存 */
    var estep = e.target.closest("[data-edit-step]");
    if (estep) {
      var qi = root.querySelector("[data-edit-qty]");
      if (qi) {
        var v = parseInt(qi.value, 10) || 1;
        v += Number(estep.getAttribute("data-edit-step"));
        qi.value = Math.max(1, v);
      }
      return;
    }
    if (e.target.closest("[data-quote-save]")) {
      saveEdit();
      return;
    }

    /* 发送 / 提交 */
    if (e.target.closest("[data-quote-send]")) {
      if (CART.count() > 0) setState("send");
      return;
    }
    if (e.target.closest("[data-quote-submit]")) {
      submit();
      return;
    }
    if (e.target.closest("[data-quote-copy-summary]")) {
      copySummary();
    }
  });

  root.addEventListener("change", function (e) {
    var qty = e.target.closest("[data-line-qty]");
    if (qty) {
      var row = qty.closest("[data-line-key]");
      if (row) CART.setQty(row.getAttribute("data-line-key"), qty.value);
      return;
    }
    var opt = e.target.closest("[data-quote-all-option]");
    if (opt) {
      /* 客户动过勾选框 → 之后不再按请求回填，否则他刚取消的项会被重新勾上 */
      allBoxTouched = true;
      var picked = el.allOptions
        .filter(function (i) {
          return i.checked;
        })
        .map(function (i) {
          return i.value;
        });
      CART.saveRequest({ customization: picked });
      syncAll();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !root.hidden) {
      if (currentState === "edit" || currentState === "send") setState("list");
      else close();
    }
  });

  /* ── 保存单个产品需求 ──────────────────────────────────────────────── */
  var saveEdit = function () {
    if (!editingKey) return;
    var attrs = {};
    qa("[data-edit-dim]").forEach(function (input) {
      if (!input.checked) return;
      var k = input.getAttribute("data-edit-dim");
      if (!input.value) return; /* 空值 = 不确定，不写进 attrs */
      attrs[k] = [input.value];
    });
    var customization = qa("[data-edit-option]")
      .filter(function (i) {
        return i.checked;
      })
      .map(function (i) {
        return i.value;
      });
    var qtyEl = root.querySelector("[data-edit-qty]");
    var noteEl = root.querySelector("[data-edit-note]");
    CART.updateLine(editingKey, {
      attrs: attrs,
      customization: customization,
      qty: qtyEl ? qtyEl.value : undefined,
      note: noteEl ? noteEl.value : undefined
    });
    editingKey = null;
    setState("list");
  };

  /* ── 提交 ───────────────────────────────────────────────────────────── */
  var readContact = function () {
    var out = {};
    el.fields.forEach(function (f) {
      var name = f.getAttribute("data-quote-field");
      out[name] = f.type === "checkbox" ? f.checked : String(f.value || "").trim();
    });
    return out;
  };

  var submit = function () {
    var contact = readContact();
    if (el.error) {
      el.error.hidden = true;
      el.error.textContent = "";
    }
    var fail = function (msg) {
      if (el.error) {
        el.error.textContent = msg;
        el.error.hidden = false;
      }
      return false;
    };
    if (!contact.email) return fail(I18N.missingEmail);
    if (!contact.name) return fail(I18N.missingName);
    if (!contact.country) return fail(I18N.missingCountry);

    CART.saveRequest({ contact: contact });

    var payload = buildPayload();
    var endpoint = root.getAttribute("data-quote-endpoint") || "";

    /* 没有配置真实接收渠道时**不假装成功** —— 明说还没发出去，给可复制的摘要。
       包子 2026-09-18 的 P0-06 就是这个口子；配好 endpoint 后自动切到真提交。 */
    if (!endpoint) {
      showDone(false, payload);
      return;
    }

    if (el.submit) {
      el.submit.disabled = true;
      el.submit.textContent = "Sending\u2026";
    }
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": payload.idempotency_key },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.text().then(function (raw) {
          var data = {};
          try { data = raw ? JSON.parse(raw) : {}; } catch (e) {}
          return { ok: res.ok && data.email_status === "sent", data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          showDone(true, payload);
          return;
        }
        if (el.error) {
          el.error.textContent = result.data && result.data.email_status === "pending"
            ? "Your request was stored, but email notification is pending. Retry without creating a duplicate."
            : "The RFQ service did not confirm this request. Please review the fields and retry.";
          el.error.hidden = false;
        }
        if (el.submit) {
          el.submit.disabled = false;
          el.submit.textContent = "Retry Send";
        }
      })
      .catch(function () {
        if (el.error) {
          el.error.textContent = "The RFQ service could not be reached. Nothing was marked as sent; please retry.";
          el.error.hidden = false;
        }
        if (el.submit) {
          el.submit.disabled = false;
          el.submit.textContent = "Retry Send";
        }
      })
      .then(function () {
        if (el.submit && el.submit.textContent === "Sending…") {
          el.submit.disabled = false;
          el.submit.textContent = I18N.submitLabel || "Send Quote Request";
        }
      });
  };

  var buildPayload = function () {
    var sum = CART.summary();
    var req = CART.request();
    var payload = {
      contract: "z02-rfq-input",
      version: "1.0.0",
      source: "quote-list",
      submittedAt: new Date().toISOString(),
      summary: { products: sum.lines, units: sum.units },
      requestCustomization: req.customization,
      contact: req.contact,
      customer: {
        name: req.contact.name || "",
        company: req.contact.company || "",
        email: req.contact.email || "",
        country: req.contact.country || "",
        phone: req.contact.phone || ""
      },
      requirements: {
        enquiry_type: "product",
        purchase_type: "",
        message: req.contact.requirements || "",
        model_context: "",
        variant_context: ""
      },
      items: CART.lines().map(function (l) {
        var rec = model(l.model);
        var matched = matchVariant(rec, l.attrs);
        return {
          product_id: l.model,
          variant_id: (matched && matched.variant_id) || null,
          sku: (matched && matched.sku) || "",
          product_name: (rec && rec.name) || l.model,
          quantity: l.qty,
          selected_options: l.attrs || {},
          customization: l.customization || [],
          note: l.note || ""
        };
      }),
      lines: CART.lines().map(function (l) {
        var rec = model(l.model);
        var matched = matchVariant(rec, l.attrs);
        return {
          model: l.model,
          product: (rec && rec.name) || l.model,
          sku: (matched && matched.sku) || "",
          configuration: configFull(rec, l.attrs),
          attributes: l.attrs,
          customization: l.customization,
          note: l.note,
          qty: l.qty
        };
      })
    };
    payload.idempotency_key = idempotencyFor(payload);
    return payload;
  };

  var summaryText = function (payload) {
    var req = payload || buildPayload();
    var lines = req.lines
      .map(function (l, i) {
        var parts = [];
        if (l.configuration) parts.push(l.configuration);
        if (l.customization.length) parts.push(l.customization.map(optionLabel).join(" / "));
        if (l.note) parts.push(l.note);
        return (
          i +
          1 +
          ". " +
          l.product +
          (l.sku ? " (" + l.sku + ")" : "") +
          "  x" +
          l.qty +
          (parts.length ? "\n    " + parts.join("\n    ") : "")
        );
      })
      .join("\n");
    var c = req.contact || {};
    return (
      "Quote Request" +
      "\n" +
      req.summary.products +
      " products / " +
      req.summary.units +
      " units\n\n" +
      lines +
      "\n\nContact\n" +
      [c.name, c.company, c.email, c.country, c.phone].filter(Boolean).join("\n") +
      (c.requirements ? "\n\nRequirements\n" + c.requirements : "")
    );
  };

  var lastPayload = null;

  var showDone = function (ok, payload) {
    lastPayload = payload;
    if (el.doneTitle) el.doneTitle.textContent = ok ? I18N.doneTitle : I18N.doneFallbackTitle;
    if (el.doneBody) {
      var sum = payload.summary;
      el.doneBody.innerHTML =
        '<p class="qd-done-lead">' +
        esc(ok ? I18N.doneBody : I18N.doneFallbackBody) +
        "</p>" +
        '<div class="qd-done-facts">' +
        "<span>" +
        esc(String(I18N.summaryProducts).replace("{n}", String(sum.products))) +
        "</span>" +
        "<span>" +
        esc(String(I18N.summaryUnits).replace("{n}", String(sum.units))) +
        "</span>" +
        "</div>";
    }
    if (el.copySummary) el.copySummary.hidden = false;
    setState("done");
    if (ok) CART.clear();
  };

  var copySummary = function () {
    var text = summaryText(lastPayload);
    var done = function () {
      toast(I18N.copied);
    };
    var fail = function () {
      toast(I18N.copyFailed);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fail);
      return;
    }
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy") ? done() : fail();
      document.body.removeChild(ta);
    } catch (e) {
      fail();
    }
  };

  /* ── 对外接口：加购点调它，避免各处重复拼 toast 逻辑 ───────────────── */
  window.QuoteDrawer = {
    open: open,
    close: close,
    /* 完整 Quote List 页的「Edit」按钮复用它，不为同一件事写第二套表单 */
    edit: function (key) {
      open("list");
      openEdit(key);
    },
    notifyAdded: function (name) {
      toast(name ? name + " \u2014 " + I18N.toastAdded : I18N.toastAdded, I18N.toastView, function () {
        open("list");
      });
    },
    toast: toast
  };

  CART.subscribe(function () {
    /* 提示条是否出现与抽屉开关无关，先同步它，再决定要不要重渲染面板 */
    syncRestoreBar();
    if (root.hidden) return;
    if (currentState === "list") render();
  });

  buildRestoreBar();
  render();
  setState("list");
  syncRestoreBar();

  /* Prepare 提示块：列表下滑时收起、回顶展开 —— 滚动读清单时给它腾高度 */
  (function () {
    var listState = root.querySelector('.qd-state[data-quote-state="list"]');
    var prep = listState && listState.querySelector(".qd-prepare");
    var scroller = listState && listState.querySelector(".qd-scroll");
    if (!prep || !scroller) return;
    scroller.addEventListener("scroll", function () {
      prep.classList.toggle("is-collapsed", scroller.scrollTop > 24);
    }, { passive: true });
  })();
  };

  if (document.readyState === "complete") boot();
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
