/* Quote List 完整页 —— 加购清单的表格化工作台（Drawer 是快速操作，这里是详细编辑）。
   ─────────────────────────────────────────────────────────────────────────
   数据来源两处，严格分开：
     · 清单条目  ← QuoteCart（localStorage，只存 model_id + qty + 配置 + 加工）
     · 产品信息  ← window.Z02_CATALOG（构建期生成，按 model_id 还原名称/图/型号/参考价）
   本文件不写死任何产品名称或价格，也不假设任何品类有哪些维度。
*/
(function () {
  "use strict";

  /* quote-cart.js / quote-catalog.js 由构建期注入，且被排在**本文件之前**
     （见 build.mjs injectQuoteAssets）。仍然等 DOMContentLoaded 再启动，
     是因为 product-detail-v3.html 这类独立 PDP 母版的脚本顺序不受本文件控制 ——
     加载期直接取全局会拿到 undefined（这个坑 2026-09-19 踩过）。 */
  var boot = function () {

  var root = document.querySelector("[data-quote-list]");
  if (!root || !window.QuoteCart) return;

  var CART = window.QuoteCart;
  var CAT = window.Z02_CATALOG || { models: {}, dims: {}, validIds: [] };
  var MODELS = CAT.models || {};

  /* 与 Drawer 用同一个上限，两页排版才对得上（改这里要一起改 quote-drawer.js 的同名常量） */
  var SUMMARY_MAX = 5;

  var el = {
    empty: root.querySelector("[data-quote-empty]"),
    body: root.querySelector("[data-quote-body]"),
    rows: root.querySelector("[data-quote-rows]"),
    summary: root.querySelector("[data-quote-summary]"),
    stale: root.querySelector("[data-quote-stale]"),
    copy: root.querySelector("[data-quote-copy]"),
    csv: root.querySelector("[data-quote-csv]"),
    clear: root.querySelector("[data-quote-clear]"),
    clearConfirm: root.querySelector("[data-quote-clear-confirm]"),
    clearBody: root.querySelector("[data-quote-clear-body]"),
    footActions: root.querySelector(".ql-foot-actions"),
    rfq: root.querySelector("[data-quote-rfq]")
  };

  /* ── 清空确认 / 单条删除撤销（2026-09-19）────────────────────────────────
     整单清空代价大 → 必须确认；单条删除代价小 → 直接删但给 Undo。
     确认块就地替换 .ql-foot-actions，不再叠一层 Modal。 */
  var openClearConfirm = function () {
    if (!el.clearConfirm) return;
    if (el.clearBody) {
      /* 文案里带准确条数；1 个用单数版 —— "all 1 products" 这种英文不能发出去 */
      var n = CART.count();
      el.clearBody.textContent = String(el.clearBody.getAttribute(n === 1 ? "data-one" : "data-many") || "").replace(
        "{n}",
        String(n)
      );
    }
    el.clearConfirm.hidden = false;
    if (el.footActions) el.footActions.hidden = true;
    var ok = el.clearConfirm.querySelector("[data-quote-clear-ok]");
    if (ok) ok.focus({ preventScroll: true });
  };

  var closeClearConfirm = function () {
    if (!el.clearConfirm) return;
    el.clearConfirm.hidden = true;
    if (el.footActions) el.footActions.hidden = false;
  };

  /* 单条删除不弹确认框 —— 但必须给 Undo，否则误点一下配置就得重配一遍 */
  var removeWithUndo = function (key) {
    var line = key ? CART.line(key) : null;
    if (!line) return;
    var rec = recOf(line.model);
    var name = (rec && rec.name) || line.model;
    var label = root.getAttribute("data-quote-removed-label") || "Removed";
    var undo = root.getAttribute("data-quote-undo-label") || "Undo";
    CART.removeLine(key);
    if (window.QuoteDrawer && window.QuoteDrawer.toast) {
      window.QuoteDrawer.toast(
        name + " \u2014 " + label,
        undo,
        function () {
          /* 原样写回：数量 / 配置 / 加工项 / 备注一个不丢 */
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
    }
  };

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var recOf = function (model) {
    return MODELS[model] || null;
  };

  var matchVariant = function (rec, attrs, variantId) {
    if (!rec) return null;
    var resolver = window.Z02_VARIANT_RESOLVER;
    if (!resolver) return null;
    return resolver.resolveExact(rec, attrs || {}, { variantId: variantId });
  };

  /* 条目没指定配置时回落到默认配置，**只用于展示**（不写回存储） */
  var effectiveAttrs = function (line, rec) {
    if (line.attrs && Object.keys(line.attrs).length) return line.attrs;
    return (rec && rec.attrs) || {};
  };

  /* 配置摘要。
     ⚠️ 实现**不在这个文件里** —— 在目录产物 `window.Z02_CONFIG_SUMMARY`（build.mjs 生成）。
     这里原来有一份和 Drawer 里 primarySummary 各写一遍的同款逻辑，必然漂；
     现在两页共用一份，且「显示几项」的口径也只有一处。 */
  var configSummary = function (rec, attrs) {
    if (!rec) return null;
    var fn = window.Z02_CONFIG_SUMMARY;
    if (typeof fn !== "function") {
      /* 不写兜底渲染 —— 兜底会让「目录没加载」这件事静默看起来正常（本项目约定） */
      console.warn("Z02_CONFIG_SUMMARY missing — quote-catalog.js 没加载？");
      return null;
    }
    return fn(rec, attrs, SUMMARY_MAX);
  };

  /* 复制出去的摘要必须是**完整**配置，不能跟着屏幕一起精简 */
  var configFull = function (rec, attrs) {
    var s = configSummary(rec, attrs);
    return s ? s.full : "";
  };

  var moreLabel = function (n) {
    return String(root.getAttribute("data-quote-more-label") || "+{n} more").replace("{n}", String(n));
  };

  var configHtml = function (s) {
    if (!s) return "";
    return (
      '<p class="ql-config"' +
      (s.hidden ? ' title="' + esc(s.full) + '"' : "") +
      ">" +
      esc(s.text) +
      (s.hidden ? ' <em class="ql-config-more">' + esc(moreLabel(s.hidden)) + "</em>" : "") +
      "</p>"
    );
  };

  var customText = function (line) {
    var opts = {};
    /* 不引 Drawer 的 i18n：完整页自己渲染，标签从壳里的 data-quote-custom-labels 取 */
    try {
      JSON.parse(root.getAttribute("data-quote-custom-labels") || "[]").forEach(function (o) {
        opts[o.id] = o.label;
      });
    } catch (e) {}
    var vals = (line.customization || []).map(function (id) {
      return opts[id] || id;
    });
    return vals.join(" \u00b7 ");
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

  var rowHtml = function (line) {
    var rec = recOf(line.model);
    var name = (rec && rec.name) || line.model;
    var family = rec ? rec.family || "" : "";
    var attrs = effectiveAttrs(line, rec);
    var config = configHtml(configSummary(rec, attrs));
    var custom = customText(line);
    var variant = matchVariant(rec, attrs, line.variant_id);
    var sku = (variant && variant.sku) || (rec && rec.sku) || line.model;
    var img = (variant && variant.image) || (rec && rec.image) || "";
    var price = priceLabel(variant || rec);

    return (
      '<li class="ql-row" data-line-key="' +
      esc(line.key) +
      '">' +
      '<div class="ql-cell ql-cell--product">' +
      '<div class="ql-media">' +
      (img ? '<img src="' + esc(String(img).replace(/^\//, "")) + '" alt="" loading="lazy" decoding="async">' : "") +
      "</div>" +
      '<div class="ql-copy">' +
      (family ? '<p class="ql-family">' + esc(family) + "</p>" : "") +
      '<h3 class="ql-name"><a href="product-detail-v3.html?model=' +
      encodeURIComponent(line.model) + (line.variant_id ? '&amp;variant=' + encodeURIComponent(line.variant_id) : '') +
      '">' +
      esc(name) +
      "</a></h3>" +
      '<p class="ql-sku">Model / SKU <span>' + esc(sku) + "</span></p>" +
      config +
      (custom ? '<p class="ql-config ql-config--custom">' + esc(custom) + "</p>" : "") +
      (line.note ? '<p class="ql-note">' + esc(line.note) + "</p>" : "") +
      "</div></div>" +
      '<div class="ql-cell ql-cell--price">' +
      '<span class="ql-cell-label">Reference price</span>' +
      (price
        ? '<span class="ql-price-value">' + esc(price) + "</span>"
        : '<span class="ql-price-none">Price on request</span>') +
      "</div>" +
      '<div class="ql-cell ql-cell--qty">' +
      '<span class="ql-cell-label">Quantity</span>' +
      '<div class="ql-stepper">' +
      '<button type="button" data-line-step="-1" aria-label="Decrease quantity">&#8722;</button>' +
      '<input type="number" min="1" max="99999" step="1" inputmode="numeric" value="' +
      line.qty +
      '" data-line-qty aria-label="Quantity for ' +
      esc(name) +
      '">' +
      '<button type="button" data-line-step="1" aria-label="Increase quantity">&#43;</button>' +
      "</div></div>" +
      '<div class="ql-cell ql-cell--remove">' +
      '<button type="button" class="ql-text-btn" data-line-edit>Edit</button>' +
      '<button type="button" class="ql-remove" data-line-remove>Remove</button>' +
      "</div></li>"
    );
  };

  var render = function () {
    var lines = CART.lines();
    var sum = CART.summary();
    var has = lines.length > 0;

    if (el.empty) el.empty.hidden = has;
    if (el.body) el.body.hidden = !has;
    /* 清单空了就把确认块收起来，别留一个删不了东西的确认框 */
    if (!has) closeClearConfirm();
    if (el.rows) el.rows.innerHTML = lines.map(rowHtml).join("");

    if (el.summary) {
      el.summary.textContent = has
        ? sum.lines + (sum.lines === 1 ? " model" : " models") + "  \u00b7  " + sum.units + (sum.units === 1 ? " unit" : " units") + " total"
        : "";
    }

    if (el.rfq) {
      var href = (el.rfq.getAttribute("href") || "request-a-quote.html").split("?")[0];
      /* Keep the same browser QuoteCart as the source of truth. The models
         query remains a compact fallback for a direct/opened link, while
         quote=1 tells RFQ to render the full multi-line review from the
         shared store (configuration, customization, notes and quantities). */
      el.rfq.setAttribute("href", has ? href + "?quote=1&models=" + CART.toQuery() : href);
    }
  };

  /* 陈旧数据自愈：catalog 里查不到的型号直接剔除并回写（角标随之归位） */
  var pruneStale = function () {
    var dropped = CART.prune(function (model) {
      return Boolean(MODELS[model]);
    });
    if (!dropped.length) return;
    if (el.stale) {
      var tpl =
        el.stale.getAttribute("data-template") ||
        "{n} item(s) could not be matched to the current catalogue and were removed.";
      el.stale.textContent = tpl.replace("{n}", String(dropped.length));
      el.stale.hidden = false;
    }
  };

  /* ── 事件 ───────────────────────────────────────────────────────────── */
  var keyOf = function (node) {
    var row = node.closest("[data-line-key]");
    return row ? row.getAttribute("data-line-key") : null;
  };

  if (el.rows) {
    el.rows.addEventListener("click", function (e) {
      var stepBtn = e.target.closest("[data-line-step]");
      if (stepBtn) {
        var k = keyOf(stepBtn);
        var line = k ? CART.line(k) : null;
        if (line) CART.setQty(k, line.qty + Number(stepBtn.getAttribute("data-line-step")));
        return;
      }
      var rm = e.target.closest("[data-line-remove]");
      if (rm) {
        removeWithUndo(keyOf(rm));
        return;
      }
      var ed = e.target.closest("[data-line-edit]");
      if (ed) {
        /* 复用全站常驻的 Drawer 编辑态 —— 不为完整页再写一套表单 */
        var key = keyOf(ed);
        if (key && window.QuoteDrawer && window.QuoteDrawer.edit) window.QuoteDrawer.edit(key);
      }
    });

    el.rows.addEventListener("change", function (e) {
      var input = e.target.closest("[data-line-qty]");
      if (!input) return;
      CART.setQty(keyOf(input), input.value);
    });
  }

  if (el.clear) {
    el.clear.addEventListener("click", function () {
      openClearConfirm();
    });
  }

  if (el.clearConfirm) {
    el.clearConfirm.addEventListener("click", function (e) {
      if (e.target.closest("[data-quote-clear-cancel]")) {
        closeClearConfirm();
        return;
      }
      if (e.target.closest("[data-quote-clear-ok]")) {
        CART.clear();
        closeClearConfirm();
        if (window.QuoteDrawer && window.QuoteDrawer.toast) {
          window.QuoteDrawer.toast(root.getAttribute("data-quote-clear-done") || "Quote list cleared");
        }
      }
    });
  }

  var lines = function () {
    return CART.lines().map(function (l) {
      var rec = recOf(l.model);
      var attrs = effectiveAttrs(l, rec);
      var v = matchVariant(rec, attrs, l.variant_id);
      return {
        model: l.model,
        name: (rec && rec.name) || l.model,
        sku: (v && v.sku) || (rec && rec.sku) || l.model,
        config: configFull(rec, attrs),
        custom: customText(l),
        qty: l.qty
      };
    });
  };

  var copyText = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "readonly");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
        document.body.removeChild(ta);
      } catch (err) {
        reject(err);
      }
    });
  };

  var flash = function (btn, msg) {
    if (!btn) return;
    var old = btn.textContent;
    btn.textContent = msg;
    window.setTimeout(function () {
      btn.textContent = old;
    }, 1800);
  };

  var asText = function () {
    return lines()
      .map(function (l) {
        var extra = [l.config, l.custom].filter(Boolean).join(" \u00b7 ");
        return l.name + "  (" + l.sku + ")  x" + l.qty + (extra ? "\n    " + extra : "");
      })
      .join("\n");
  };

  if (el.copy) {
    el.copy.addEventListener("click", function () {
      copyText(asText()).then(
        function () {
          flash(el.copy, "Copied");
        },
        function () {
          flash(el.copy, "Copy failed");
        }
      );
    });
  }

  if (el.csv) {
    el.csv.addEventListener("click", function () {
      var rows = [["Model", "SKU", "Product", "Configuration", "Customization", "Quantity"].join(",")].concat(
        lines().map(function (l) {
          return [l.model, l.sku, l.name, l.config, l.custom, l.qty]
            .map(function (v) {
              return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
            })
            .join(",");
        })
      ).join("\n");
      var blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "gsl-smart-quote-list.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
    });
  }

  CART.subscribe(render);
  pruneStale();
  render();

  };

  if (document.readyState === "complete") boot();
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
