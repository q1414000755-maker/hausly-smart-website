/* ============================================================================
   content.js — 内容页交互（content 模板）

   两件事：
   1) 按 enquiry_type 显示 / 隐藏字段（registry 里 rfq 的 purpose 要求
      「fields that change by enquiry type」）。
   2) 提交时生成一份**可复制的询价摘要**。

   ⚠️ 口径：本页没有后端，所以提交**不发送任何东西**。
   页面上必须写清这一点，绝不能点一下就说「已提交 / We'll be in touch」。
   摘要是给用户自己复制走发邮件的，不是回执。
   ========================================================================== */
(function () {
  var form = document.querySelector("[data-ct-form]");
  if (!form) return;

  var state = form.querySelector("[data-ct-form-state]");
  var typeField = form.querySelector('[name="enquiry_type"]');
  var recipient = form.getAttribute("data-ct-recipient") || "";
  var endpoint = form.getAttribute("data-rfq-endpoint") || "";
  var esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  /* ── 条件字段 ──────────────────────────────────────────────────────────
     ⚠️ 隐藏时**必须同时 disabled**：display:none 的 required 字段照样参与校验，
        浏览器会抛「An invalid form control … is not focusable」，提交直接卡死
        而且没有任何可见提示。 */
  var conditional = [].slice.call(form.querySelectorAll("[data-only-for]"));
  var syncConditional = function () {
    var value = typeField ? typeField.value : "";
    conditional.forEach(function (node) {
      var allow = String(node.getAttribute("data-only-for") || "").split(",");
      var on = allow.indexOf(value) >= 0;
      node.hidden = !on;
      [].slice.call(node.querySelectorAll("input, select, textarea")).forEach(function (el) {
        el.disabled = !on;
      });
    });
  };
  if (typeField) {
    typeField.addEventListener("change", syncConditional);
    syncConditional();
  }

  /* ── Quote List → RFQ ──────────────────────────────────────────────────
     quote=1 means this form was opened from the shared Quote List. Read the
     full lines from QuoteCart first, so configuration, customisation, notes
     and quantities survive the hand-off. The compact models query remains a
     safe fallback for a copied/deep link opened without the original store. */
  var query = new URLSearchParams(window.location.search);
  var queryModels = query.get("models");
  var queryModel = query.get("model");
  var queryOptions = query.get("options");
  var fromQuote = query.get("quote") === "1";
  /* 05-02: the URL selects the entry mode only. Product lines remain sourced
     from QuoteCart or the source-backed catalogue; display text in the URL is
     never authoritative and personal data is never accepted here. */
  var rfqSource = fromQuote || queryModels ? "quote-list" : queryModel ? "product-detail" : "direct";
  var catalog = window.Z02_CATALOG || { models: {} };
  var quoteRows = [];
  var unresolvedProducts = [];
  var configText = function (rec, attrs) {
    var fn = window.Z02_CONFIG_SUMMARY;
    if (typeof fn !== "function" || !rec) return "";
    var result = fn(rec, attrs || {}, 99);
    return result && result.full ? result.full : "";
  };
  var labelCustom = function (id) {
    try {
      var i18n = document.getElementById("qd-i18n");
      var data = i18n ? JSON.parse(i18n.textContent || "{}") : {};
      var opts = Array.isArray(data.customOptions) ? data.customOptions : [];
      var hit = opts.filter(function (o) { return o.id === id; })[0];
      return hit ? hit.label : id;
    } catch (e) { return id; }
  };
  var isSourceBacked = function (id) {
    if (!id || !catalog.models || !catalog.models[id]) return false;
    return !Array.isArray(catalog.validIds) || catalog.validIds.indexOf(id) >= 0;
  };
  var parseOptions = function (raw) {
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      return {};
    }
  };
  var variantFor = function (model, attrs, variantId) {
    var resolver = window.Z02_VARIANT_RESOLVER;
    if (resolver) {
      return resolver.resolve(model, attrs, {
        variantId: variantId,
        allowDefault: true,
        preferredId: model && model.primary_variant
      });
    }
    return null;
  };
  var makeQuoteRow = function (line) {
    var id = String(line && line.model || "").trim();
    if (!isSourceBacked(id)) {
      if (id) unresolvedProducts.push(id);
      return null;
    }
    var model = catalog.models[id];
    var attrs = line && line.attrs && typeof line.attrs === "object" ? line.attrs : {};
    var variant = variantFor(model, attrs, line && line.variant_id);
    var cfg = configText(model, attrs);
    var custom = (line && Array.isArray(line.customization) ? line.customization : []).map(labelCustom).join(" / ");
    return {
      id: id,
      model: model,
      quantity: Math.max(1, Math.min(1000000, Number(line && (line.quantity != null ? line.quantity : line.qty)) || 1)),
      attrs: attrs,
      variant: variant,
      variantId: String((line && line.variant_id) || (variant && (variant.id || variant.variant_id || variant._v)) || ""),
      configuration: cfg,
      customization: custom,
      customizationIds: line && Array.isArray(line.customization) ? line.customization.slice() : [],
      note: line && typeof line.note === "string" ? line.note : ""
    };
  };
  var sharedLines = fromQuote && window.QuoteCart ? window.QuoteCart.lines() : [];
  if (sharedLines.length) {
    quoteRows = sharedLines.map(makeQuoteRow).filter(Boolean);
  }
  if (!quoteRows.length && queryModels) {
    quoteRows = queryModels.split(",").map(function (part) {
      var bits = part.split(":");
      var id = decodeURIComponent(bits[0] || "");
      var quantity = Math.max(1, Number(bits[1]) || 1);
      return makeQuoteRow({ model: id, qty: quantity });
    }).filter(Boolean);
  }
  if (!quoteRows.length && queryModel) {
    quoteRows = [makeQuoteRow({
      model: decodeURIComponent(queryModel),
      qty: Math.max(1, Number(query.get("quantity")) || 1),
      attrs: parseOptions(queryOptions),
      variant_id: query.get("variant") || ""
    })].filter(Boolean);
  }

  var contractItems = function () {
    return quoteRows.map(function (row) {
      return {
        product_id: row.id,
        variant_id: row.variantId || undefined,
        sku: row.model.sku || row.model.series || row.id,
        product_name: row.model.name || row.id,
        quantity: row.quantity,
        selected_options: row.attrs || {},
        customization: row.customizationIds || [],
        note: row.note || ""
      };
    });
  };
  /* ── Stage 05-03: idempotency boundary ────────────────────────────────
     Keep one key for this RFQ context across a refresh, but scope it to the
     current URL so a second product/detail or Quote List context does not
     accidentally reuse the first request's key. The key is intentionally
     session-only; the eventual intake service can use it to deduplicate a
     repeated submission without putting customer data in storage or URLs. */
  var token = function () {
    var raw = "";
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") raw = window.crypto.randomUUID();
      else if (window.crypto && typeof window.crypto.getRandomValues === "function") {
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        raw = Array.prototype.map.call(bytes, function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
      }
    } catch (e) {}
    if (!raw) raw = String(Date.now().toString(36) + Math.random().toString(36).slice(2));
    return raw.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 128);
  };
  var idempotencyStorageKey = "z02.rfq.idempotency.v1:" + window.location.pathname + window.location.search;
  var idempotencyKey = "";
  try { idempotencyKey = sessionStorage.getItem(idempotencyStorageKey) || ""; } catch (e) {}
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
    idempotencyKey = token();
    try { sessionStorage.setItem(idempotencyStorageKey, idempotencyKey); } catch (e) {}
  }
  var rotateIdempotencyKey = function () {
    idempotencyKey = token();
    try { sessionStorage.setItem(idempotencyStorageKey, idempotencyKey); } catch (e) {}
    if (window.Z02_RFQ) window.Z02_RFQ.idempotencyKey = idempotencyKey;
  };
  var readRfqDraft = function () {
    var data = new FormData(form);
    var value = function (name) { return String(data.get(name) || "").trim(); };
    return {
      contract: "z02-rfq-input",
      version: "1.0.0",
      idempotency_key: idempotencyKey,
      source: rfqSource,
      items: contractItems(),
      customer: {
        name: value("contact_name"),
        company: value("company"),
        email: value("email"),
        country: value("country"),
        phone: value("phone")
      },
      requirements: {
        enquiry_type: value("enquiry_type"),
        purchase_type: value("purchase_type"),
        message: value("message"),
        model_context: value("model"),
        variant_context: value("variant"),
        target_date: value("target_date"),
        destination: value("destination"),
        oem_scope: value("oem_scope"),
        sample_purpose: value("sample_purpose"),
        market: value("market")
      },
      unresolved_products: unresolvedProducts.slice()
    };
  };
  form.setAttribute("data-rfq-source", rfqSource);
  form.setAttribute("data-rfq-item-count", String(quoteRows.length));
  if (unresolvedProducts.length) form.setAttribute("data-rfq-context-error", "unknown-product");
  window.Z02_RFQ = {
    source: rfqSource,
    items: contractItems,
    getDraft: readRfqDraft,
    idempotencyKey: idempotencyKey,
    getIdempotencyKey: function () { return idempotencyKey; },
    unresolvedProducts: unresolvedProducts.slice()
  };

  var quoteSummaryText = function (rows) {
    return rows.map(function (row, index) {
      var extra = [row.configuration, row.customization, row.note].filter(Boolean);
      return (index + 1) + ". " + row.model.name + " (" + (row.model.sku || row.model.series || row.id) + ") × " + row.quantity +
        (extra.length ? "\n   " + extra.join("\n   ") : "");
    }).join("\n");
  };

  var renderQuoteReview = function (rows) {
    if (!rows.length) return;
    var originText = rfqSource === "quote-list"
      ? rows.length + (rows.length === 1 ? " product" : " products") + " from your Quote List. Edit any item in Quote List before returning here."
      : "This product and its selected configuration came from Product Detail.";
    var review = document.createElement("section");
    review.className = "ct-quote-review";
    review.setAttribute("aria-labelledby", "ct-quote-review-title");
    review.innerHTML = '<h2 class="ct-block-title" id="ct-quote-review-title">Review Your Quote Request</h2>' +
      '<p class="ct-block-note">' + originText + "</p>" +
      '<ol class="ct-quote-review-list">' + rows.map(function (row) {
        var extra = [row.configuration, row.customization, row.note].filter(Boolean);
        return '<li><strong>' + esc(row.model.name) + '</strong><span>' + esc(row.model.sku || row.model.series || row.id) +
          ' · Qty ' + esc(String(row.quantity)) + '</span>' + (extra.length ? '<small>' + esc(extra.join(" · ")) + '</small>' : '') + '</li>';
      }).join("") + '</ol>';
    form.parentNode.insertBefore(review, form);
  };

  if (quoteRows.length) {
    var modelField = form.querySelector('[name="model"]');
    var quantityField = form.querySelector('[name="quantity"]');
    var messageField = form.querySelector('[name="message"]');
    var productBlock = modelField && modelField.closest(".ct-block");
    var summary = quoteSummaryText(quoteRows);
    renderQuoteReview(quoteRows);
    if (quoteRows.length === 1) {
      if (modelField && !modelField.value) modelField.value = quoteRows[0].model.sku || quoteRows[0].model.name;
      if (quantityField && !quantityField.value) quantityField.value = String(quoteRows[0].quantity);
    } else if (productBlock) {
      /* The normal standalone form is still available for direct visits. For
         a Quote List hand-off, hide its one-model fields and let the review
         block plus the message carry the complete multi-line request. */
      productBlock.hidden = true;
      productBlock.querySelectorAll("input, select, textarea").forEach(function (field) { field.disabled = true; });
    }
    if (messageField && !messageField.value) messageField.value = "Quote List:\n" + summary;
    if (state) state.textContent = rfqSource === "quote-list"
      ? (quoteRows.length === 1
        ? "Your selected product and configuration were added from Quote List."
        : "Your selected products and configurations were added from Quote List for review.")
      : "This product and its selected configuration were added from Product Detail.";
  }
  if (unresolvedProducts.length && state) {
    state.textContent = "One or more selected products could not be verified and were not added to this RFQ.";
  }

  /* ── 摘要 ────────────────────────────────────────────────────────────── */
  var summary = document.createElement("div");
  summary.className = "ct-summary";
  summary.hidden = true;
  summary.innerHTML =
    '<h3 class="ct-summary-title">Enquiry ready to review</h3>' +
    '<pre class="ct-summary-body" data-ct-summary-body></pre>' +
    '<div class="ct-summary-actions">' +
    '<button type="button" class="ct-copy" data-ct-copy>Copy summary</button>' +
    (recipient ? '<a class="ct-copy ct-email" data-ct-email>Email this enquiry</a>' : '<a class="ct-copy" href="contact.html">Contact page</a>') +
    "</div>" +
    '<p class="ct-summary-note" data-ct-summary-note>' + (endpoint ? "The request is being sent to the Hauslysmart intake service." : "Email opens in your own email application. Review the recipient and message there, then choose whether to send.") + '</p>';
  form.appendChild(summary);
  var body = summary.querySelector("[data-ct-summary-body]");
  var copyBtn = summary.querySelector("[data-ct-copy]");
  var emailLink = summary.querySelector("[data-ct-email]");
  var summaryTitle = summary.querySelector(".ct-summary-title");
  var summaryNote = summary.querySelector("[data-ct-summary-note]");
  var submitButton = form.querySelector('button[type="submit"]');
  var originalSubmitLabel = submitButton ? submitButton.textContent : "Prepare email enquiry";
  var submissionLocked = false;

  var labelText = function (field) {
    var label = field.querySelector(".ct-label");
    if (!label) return "";
    var clone = label.cloneNode(true);
    var opt = clone.querySelector(".ct-optional");
    if (opt) opt.parentNode.removeChild(opt);
    return clone.textContent.replace(/\s+/g, " ").trim();
  };

  var buildSummary = function () {
    var lines = [];
    [].slice.call(form.querySelectorAll(".ct-field")).forEach(function (field) {
      if (field.hidden) return;
      var el = field.querySelector("input, select, textarea");
      if (!el || !el.name || el.disabled) return;
      var value = String(el.value || "").trim();
      var label = labelText(field);
      if (!label) return;
      /* 空值也列出来并标 (not given)：让对方一眼看到还差什么，
         比静默省略更能加快来回。 */
      lines.push(label + ": " + (value || "(not given)"));
    });
    return lines.join("\n");
  };

  var setCopyState = function (text) {
    if (!copyBtn) return;
    copyBtn.textContent = text;
    window.setTimeout(function () { copyBtn.textContent = "Copy summary"; }, 4000);
  };

  /* Client-side rules are deliberately explicit because this static form has
     novalidate: the same contract must be checked before a future API call,
     while direct RFQ, Product Detail and Quote List all retain one UX. */
  var validateRfq = function () {
    var errors = [];
    var firstInvalid = null;
    var fields = [].slice.call(form.querySelectorAll("input, select, textarea"));
    var fieldValue = function (name) {
      var field = form.querySelector('[name="' + name + '"]');
      return field && !field.disabled ? String(field.value || "").trim() : "";
    };
    var add = function (message, field) {
      errors.push(message);
      if (!firstInvalid && field) firstInvalid = field;
    };
    fields.forEach(function (field) {
      if (field.disabled || field.type === "hidden" || field.name === "") return;
      if (!field.checkValidity()) {
        if (field.validity && field.validity.valueMissing) add("complete " + (field.name === "contact_name" ? "your name" : field.name.replace(/_/g, " ")), field);
        else if (field.validity && field.validity.typeMismatch && field.type === "email") add("enter a valid business email", field);
        else add("check " + field.name.replace(/_/g, " "), field);
      }
    });
    if (rfqSource === "direct") {
      var modelField = form.querySelector('[name="model"]');
      if (modelField && !modelField.value.trim() && modelField.checkValidity()) add("a product model or SKU", modelField);
      var directQty = Number(fieldValue("quantity"));
      var quantityField = form.querySelector('[name="quantity"]');
      if (quantityField && quantityField.checkValidity() && (!Number.isInteger(directQty) || directQty < 1 || directQty > 1000000)) add("a quantity between 1 and 1,000,000", quantityField);
    } else {
      if (!quoteRows.length) add(rfqSource === "quote-list" ? "at least one verified Quote List product" : "a verified Product Detail product");
      if (unresolvedProducts.length) add("only verified source products");
      quoteRows.forEach(function (row) {
        if (!isSourceBacked(row.id) || !Number.isInteger(Number(row.quantity)) || Number(row.quantity) < 1 || Number(row.quantity) > 1000000) {
          add("valid product quantities");
        }
      });
    }
    return { errors: errors.filter(function (message, index, all) { return all.indexOf(message) === index; }), firstInvalid: firstInvalid };
  };

  var unlockAfterEdit = function () {
    if (!submissionLocked) return;
    submissionLocked = false;
    rotateIdempotencyKey();
    form.removeAttribute("data-rfq-submit-state");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitButton.textContent = originalSubmitLabel;
    }
    summary.hidden = true;
    if (state) state.textContent = "Your changes are ready to prepare again.";
  };
  var unlockForRetry = function (label) {
    submissionLocked = false;
    form.removeAttribute("data-rfq-submit-state");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitButton.textContent = label || originalSubmitLabel;
    }
  };
  form.addEventListener("input", unlockAfterEdit);
  form.addEventListener("change", unlockAfterEdit);

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var text = body.textContent || "";
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { setCopyState("Copied"); },
          function () { setCopyState("Copy failed — select the text instead"); }
        );
      } else {
        setCopyState("Copy failed — select the text instead");
      }
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (submissionLocked) return;
    var validation = validateRfq();
    if (validation.errors.length) {
      if (state) state.textContent = "Please correct: " + validation.errors.join("; ") + ". Nothing was prepared.";
      summary.hidden = true;
      if (validation.firstInvalid && typeof validation.firstInvalid.focus === "function") validation.firstInvalid.focus();
      return;
    }
    submissionLocked = true;
    form.setAttribute("data-rfq-submit-state", "locked");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      submitButton.textContent = endpoint ? "Sending…" : "Preparing…";
    }
    body.textContent = buildSummary();
    summary.hidden = false;
    summary.scrollIntoView({ block: "nearest" });
    if (endpoint) {
      if (emailLink) emailLink.hidden = true;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": readRfqDraft().idempotency_key },
        body: JSON.stringify(readRfqDraft())
      })
        .then(function (response) {
          return response.text().then(function (raw) {
            var data = {};
            try { data = raw ? JSON.parse(raw) : {}; } catch (e) {}
            if (!response.ok) {
              var error = new Error(data.error || "RFQ service error");
              error.status = response.status;
              throw error;
            }
            return data;
          });
        })
        .then(function (data) {
          if (data && data.email_status === "sent") {
            if (summaryTitle) summaryTitle.textContent = "Quote request sent";
            if (summaryNote) summaryNote.textContent = "Reference " + (data.request_id || "created") + ". The request was stored and the Hauslysmart sales notification was sent.";
            if (state) state.textContent = "Your quote request was received by Hauslysmart. Reference: " + (data.request_id || "created") + ".";
            if (submitButton) {
              submitButton.removeAttribute("aria-busy");
              submitButton.textContent = "Sent — request received";
            }
          } else {
            unlockForRetry("Retry notification");
            if (summaryTitle) summaryTitle.textContent = "Request saved — notification pending";
            if (summaryNote) summaryNote.textContent = "Reference " + (data.request_id || "saved") + ". The request is stored, but email notification is not confirmed. Retry when ready.";
            if (state) state.textContent = "Your request was stored, but notification is pending. You can retry without creating a duplicate.";
          }
        })
        .catch(function () {
          unlockForRetry("Retry RFQ");
          if (summaryTitle) summaryTitle.textContent = "RFQ was not confirmed";
          if (summaryNote) summaryNote.textContent = "The intake service did not confirm this request. Your form remains available so you can retry.";
          if (state) state.textContent = "The RFQ could not be confirmed. Nothing was marked as sent.";
        });
      return;
    }
    if (emailLink) {
      var company = String((form.querySelector('[name="company"]') || {}).value || "").trim();
      var subject = "RFQ" + (company ? " — " + company : "") + " — Hauslysmart";
      /* recipient 来自 RFQ 内容配置且只接受标准邮箱；@ 保持原样可兼容更多
         桌面邮件客户端，主题与正文仍须 URL 编码。 */
      emailLink.href = "mailto:" + recipient + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body.textContent);
    }
    if (submitButton) {
      submitButton.removeAttribute("aria-busy");
      submitButton.textContent = "Prepared — review below";
    }
    if (state) state.textContent = recipient
      ? "Your enquiry is ready. Open your email application to review and send it to Hauslysmart."
      : "Summary built below. Copy it and send it to us by email.";
    summary.scrollIntoView({ block: "nearest" });
  });
})();
