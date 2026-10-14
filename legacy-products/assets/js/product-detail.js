/* Product Detail — public SKU renderer.
   The public page only receives published variants from the shared SSOT. */
(function () {
  "use strict";

  var SSOT = null;
  try {
    var ssotNode = document.getElementById("pdv2-ssot");
    if (ssotNode) SSOT = JSON.parse(ssotNode.textContent.replace(/\\u003c/g, "<"));
  } catch (error) { SSOT = null; }

  function el(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function money(amount, currency) {
    return amount == null ? "—" : (currency ? currency + " " : "") + Number(amount).toFixed(2);
  }
  function valuesOf(variant, key) {
    return (variant && variant.attributes && variant.attributes[key]) || [];
  }
  function isPending(value) { return String(value).includes("pending"); }
  function firstValue(variant, key) { return valuesOf(variant, key)[0] || ""; }
  function variantImage(v) {
    return (v && v.asset_overrides && v.asset_overrides.primary_image) || (v && v.image && v.image.src) || "";
  }

  function pickModel(key) {
    if (!SSOT) return null;
    if (key && SSOT.byModel[key] && SSOT.byModel[key].catalogue_visible && publishedVariants(SSOT.byModel[key]).length) return SSOT.byModel[key];
    if (key) {
      return Object.values(SSOT.byModel).filter(function (record) {
        return record.catalogue_visible && record.slug === key && publishedVariants(record).length;
      })[0] || null;
    }
    var first = (SSOT.list || []).filter(function (item) {
      return SSOT.byModel[item.model_id] && publishedVariants(SSOT.byModel[item.model_id]).length;
    })[0];
    return first ? SSOT.byModel[first.model_id] : null;
  }
  function publishedVariants(record) {
    return (record && record.public_variants) || (record && record.variants || []).filter(function (variant) {
      return variant.publication_status === "published";
    });
  }

  function dimensionMap(record) {
    var category = SSOT && SSOT.dims && SSOT.dims[record.category_page];
    return category || { dimensions: [], labels: {} };
  }
  function labelFor(record, key, value) {
    var labels = dimensionMap(record).labels || {};
    return (labels[key] && labels[key][value]) || value;
  }
  function joinedLabel(record, variant, key) {
    return valuesOf(variant, key).filter(function (value) { return !isPending(value); })
      .map(function (value) { return labelFor(record, key, value); }).join(" / ");
  }
  function optionUrl(record, variant) {
    var next = new URL(location.href);
    next.searchParams.set("model", record.model_id);
    next.searchParams.set("variant", variant.variant_id);
    return next.pathname + "?" + next.searchParams.toString();
  }

  function renderBreadcrumb(record, variant) {
    el("pdv2-crumb").innerHTML =
      '<a href="index.html">Home</a><span class="pdv2-crumb-sep">/</span>' +
      '<a href="products.html">Products &amp; Prices</a><span class="pdv2-crumb-sep">/</span>' +
      '<a href="' + esc(record.family_page) + '">' + esc(record.family_label) + '</a>' +
      '<span class="pdv2-crumb-sep">/</span><span aria-current="page">' + esc(variant.sku) + "</span>";
  }

  function renderPicker(record, selected, selectVariant) {
    var picker = el("pdv2-sku-picker");
    var variants = publishedVariants(record);
    if (!picker) return;
    if (variants.length < 2) { picker.hidden = true; picker.innerHTML = ""; return; }
    picker.hidden = false;
    picker.innerHTML = '<p class="pdv2-opt-label">Published model</p><div class="pdv2-sku-options" role="group" aria-label="Published model">' +
      variants.map(function (variant) {
        var selectedState = variant.variant_id === selected.variant_id;
        return '<button type="button" class="pdv2-sku-option" data-pdv-option="variant" data-pdv2-variant="' + esc(variant.variant_id) + '" aria-pressed="' + selectedState + '">' +
          esc(variant.sku) + "</button>";
      }).join("") + "</div>";
    picker.querySelectorAll("[data-pdv2-variant]").forEach(function (button) {
      button.addEventListener("click", function () {
        var wanted = variants.filter(function (variant) {
          return variant.variant_id === button.getAttribute("data-pdv2-variant");
        })[0];
        if (wanted) selectVariant(wanted, true);
      });
    });
    updateOptionAvailability(record, selected);
  }

  /* The SKU picker is an exact-variant control, but it still resolves through
     the shared resolver so a future category cannot surface an impossible
     published combination. */
  function updateOptionAvailability(record, selected) {
    var resolver = window.Z02_VARIANT_RESOLVER;
    var picker = el("pdv2-sku-picker");
    if (!resolver || !picker) return;
    var rec = Object.assign({}, record, { variants: publishedVariants(record) });
    picker.querySelectorAll("button[data-pdv-option]").forEach(function (button) {
      var candidate = publishedVariants(record).filter(function (variant) {
        return variant.variant_id === button.getAttribute("data-pdv2-variant");
      })[0];
      var trial = candidate && resolver.selectionFromVariant ? resolver.selectionFromVariant(candidate) : (candidate && candidate.attributes) || {};
      var available = Boolean(candidate) && resolver.candidates(rec, trial).length > 0;
      var current = Boolean(candidate) && candidate.variant_id === selected.variant_id;
      button.disabled = !available && !current;
      button.setAttribute("aria-disabled", String(!available));
    });
  }

  function renderChips(record, variant) {
    var keys = record.category_page === "cat-curtains"
      ? ["drive", "control", "mounting", "track"]
      : (dimensionMap(record).dimensions || []).slice(0, 4).map(function (dim) { return dim.key; });
    var chips = keys.map(function (key) { return joinedLabel(record, variant, key); })
      .filter(Boolean).slice(0, 4).map(function (text) { return "<span><i></i>" + esc(text) + "</span>"; });
    el("pdv2-fchips").innerHTML = chips.join("");
  }

  function renderSpecsFor(record, selectedVariant) {
    var rows = [{ key: "model", label: "Model / SKU", value: selectedVariant.sku, status: "verified" }];
    (dimensionMap(record).dimensions || []).forEach(function (dim) {
      var value = joinedLabel(record, selectedVariant, dim.key);
      if (value) rows.push({ key: dim.key, label: dim.label, value: value, status: "by-model" });
    });
    var exact = record.source_fields && record.source_fields[selectedVariant.sku];
    var variantSpecMap = record.specs_by_variant && record.specs_by_variant[selectedVariant.variant_id];
    if (!exact && variantSpecMap) {
      exact = variantSpecMap.filter(function (row) { return row.key === "source-confirmed-rating"; })[0] || null;
    }
    if (exact && exact.value) rows.push({ key: "source-confirmed-rating", label: "Source-confirmed rating", value: exact.value, status: "verified" });
    el("pdv2-specs").innerHTML = rows.map(function (row) {
      var status = row.status === "verified" ? "Verified source" : "By selected model";
      return "<tr><th scope=\"row\">" + esc(row.label) + "</th><td>" + esc(row.value) +
        '</td><td><span class="pdv2-spec-status pdv2-spec-status--' + esc(row.status) + '">' + status + "</span></td></tr>";
    }).join("");
  }

  function differingDimensions(record) {
    var variants = publishedVariants(record);
    return (dimensionMap(record).dimensions || []).filter(function (dim) {
      var seen = {};
      variants.forEach(function (variant) { seen[joinedLabel(record, variant, dim.key) || "—"] = true; });
      return Object.keys(seen).length > 1;
    });
  }

  function renderCompare(record, selected, selectVariant) {
    var section = el("pdv2-compare-section");
    var target = el("pdv2-compare");
    if (!section || !target) return;
    var dims = differingDimensions(record);
    var variants = publishedVariants(record);
    if (variants.length < 2 || !dims.length) { section.hidden = true; target.innerHTML = ""; return; }
    section.hidden = false;
    var head = variants.map(function (variant) {
      return "<th scope=\"col\">" + esc(variant.sku) +
        '<button type="button" class="pdv2-compare-select" data-pdv2-variant="' + esc(variant.variant_id) + '">' +
        (variant.variant_id === selected.variant_id ? "Selected" : "Select") + "</button></th>";
    }).join("");
    var body = dims.map(function (dim) {
      return "<tr><th scope=\"row\">" + esc(dim.label) + "</th>" + variants.map(function (variant) {
        return "<td>" + esc(joinedLabel(record, variant, dim.key) || "—") + "</td>";
      }).join("") + "</tr>";
    }).join("");
    target.innerHTML = '<table><thead><tr><th scope="col">Specification</th>' + head + "</tr></thead><tbody>" + body + "</tbody></table>";
    target.querySelectorAll("[data-pdv2-variant]").forEach(function (button) {
      button.addEventListener("click", function () {
        var wanted = variants.filter(function (variant) { return variant.variant_id === button.getAttribute("data-pdv2-variant"); })[0];
        if (wanted) selectVariant(wanted, true);
      });
    });
  }

  function renderIntegration(record, variant) {
    var section = el("pdv2-integration-section");
    var target = el("pdv2-integration");
    if (!section || !target) return;
    var note = record.source_fields && record.source_fields.web_control_and_installation;
    if (record.category_page !== "cat-curtains" || !note || !note.value) { section.hidden = true; target.innerHTML = ""; return; }
    section.hidden = false;
    var control = joinedLabel(record, variant, "control") || "RS485 / Modbus RTU";
    var track = joinedLabel(record, variant, "track") || "Curtain track";
    target.innerHTML = '<div class="pdv2-control-path" aria-label="Curtain motor control path">' +
      '<span>' + esc(control) + "</span><b aria-hidden=\"true\">→</b><span>RS485 or dry-contact module</span><b aria-hidden=\"true\">→</b><span>" +
      esc(variant.sku) + "</span><b aria-hidden=\"true\">→</b><span>" + esc(track) + "</span></div>" +
      '<p class="pdv2-integration-note">' + esc(note.value) + "</p>";
  }

  function renderInstall(record, variant) {
    var section = el("pdv2-install-section");
    var target = el("pdv2-install");
    if (!section || !target) return;
    if (record.category_page !== "cat-curtains") { section.hidden = true; target.innerHTML = ""; return; }
    section.hidden = false;
    var mount = joinedLabel(record, variant, "mounting");
    var track = joinedLabel(record, variant, "track");
    var ratingRow = record.source_fields && record.source_fields[variant.sku];
    target.innerHTML = '<article><h3>Verified fit</h3><dl>' +
      "<div><dt>Mounting</dt><dd>" + esc(mount || "Confirm for selected configuration") + "</dd></div>" +
      "<div><dt>Track system</dt><dd>" + esc(track || "Confirm for selected configuration") + "</dd></div>" +
      (ratingRow ? "<div><dt>Source-confirmed envelope</dt><dd>" + esc(ratingRow.value) + "</dd></div>" : "") +
      "</dl></article><article><h3>Before installation</h3><p>Confirm the project control module, track arrangement and final installation drawing with the technical team. This page does not substitute a model-specific wiring drawing.</p></article>";
  }

  function renderSources(record, variant, rfqHref) {
    var target = el("pdv2-docs");
    if (!target) return;
    var exact = record.source_fields && record.source_fields[variant.sku];
    var web = record.source_fields && record.source_fields.web_control_and_installation;
    var cards = [];
    if (exact) {
      cards.push('<article class="pdv2-doc"><p class="pdv2-doc-type">SKU technical source</p><p class="pdv2-doc-meta">' +
        esc(exact.source_id || "Source") + (exact.source_page ? " · p." + esc(exact.source_page) : "") + " · Source-extracted</p></article>");
    }
    if (web && web.source_url) {
      cards.push('<article class="pdv2-doc"><p class="pdv2-doc-type">Manufacturer reference</p><p class="pdv2-doc-meta">Control and installation reference</p><a href="' + esc(web.source_url) + '" target="_blank" rel="noopener">View manufacturer reference →</a></article>');
    }
    cards.push('<article class="pdv2-doc"><p class="pdv2-doc-type">Project document request</p><p class="pdv2-doc-meta">Ask for the current datasheet or installation drawing for this selected SKU.</p><a href="' + esc(rfqHref) + '">Request technical document →</a></article>');
    target.innerHTML = cards.join("");
  }

  function render(record) {
    var params = new URLSearchParams(location.search);
    var requested = params.get("variant");
    var availableVariants = publishedVariants(record);
    var requestedVariant = availableVariants.filter(function (item) { return item.variant_id === requested; })[0];
    if (requested && !requestedVariant) {
      var unavailableHero = document.querySelector(".pdv2-hero");
      if (unavailableHero) unavailableHero.innerHTML = '<div class="pdv2-card"><h1 class="pdv2-h1">Configuration not available</h1><p class="pdv2-tagline">This SKU is not currently published for quotation.</p><a class="pdv2-btn pdv2-btn--primary" href="' + esc(record.family_page) + '">View published products</a></div>';
      document.querySelectorAll("main > section:not(.pdv2-band--hero), .pdv2-sticky").forEach(function (node) { node.hidden = true; });
      return;
    }
    var variant = requestedVariant ||
      availableVariants.filter(function (item) { return item.variant_id === record.public_primary_variant; })[0] || availableVariants[0];
    var cart = window.QuoteCart;

    function renderSpecs(v) { renderSpecsFor(record, v); }

    function quantity() {
      var input = el("pdv2-qty");
      var value = parseInt(input ? input.value : "1", 10);
      return isFinite(value) && value > 0 ? Math.min(value, 99999) : 1;
    }
    function attrs() { return variant ? (variant.attributes || {}) : {}; }
    function rfqHref() {
      var params = new URLSearchParams();
      params.set("model", record.model_id);
      params.set("variant", variant.variant_id);
      params.set("quantity", String(quantity()));
      params.set("options", JSON.stringify(attrs()));
      return "request-a-quote.html?" + params.toString();
    }
    function currentKey() { return cart ? cart.makeKey(record.model_id, attrs(), [], variant.variant_id) : ""; }
    function syncQuoteState() {
      var inList = Boolean(cart && cart.line(currentKey()));
      [el("pdv2-quote"), el("pdv2-quote-final"), el("pdv2-quote-sticky")].filter(Boolean).forEach(function (button) {
        button.setAttribute("aria-pressed", String(inList));
        button.textContent = inList ? "In Quote List — Update Quantity" : "Add to Quote List";
      });
      el("pdv2-added").textContent = inList ? "Saved in this browser — review it in Quote List." : "";
      el("pdv2-samples").href = rfqHref();
      el("pdv2-rfq-link").href = rfqHref();
    }
    function addToQuote() {
      if (!cart || !variant) return;
      var key = currentKey();
      if (cart.line(key)) cart.setQty(key, quantity());
      else cart.addLine({ model: record.model_id, variant_id: variant.variant_id, qty: quantity(), attrs: attrs() });
      if (window.QuoteDrawer) window.QuoteDrawer.notifyAdded(record.name + " · " + variant.sku);
      syncQuoteState();
    }
    function updateUrl() { history.replaceState({}, "", optionUrl(record, variant)); }
    function renderVariant(next, writeUrl) {
      variant = next;
      if (writeUrl) updateUrl();
      document.title = variant.sku + " — " + record.name + " — Hauslysmart";
      renderBreadcrumb(record, variant);
      el("pdv2-eyebrow").textContent = record.family_label;
      el("pdv2-h1").textContent = record.category_page === "cat-curtains"
        ? variant.sku + " Curtain Motor"
        : variant.sku;
      el("pdv2-tagline").textContent = record.summary || "";
      var image = variantImage(variant);
      var stage = el("pdv2-stage-img");
      if (stage && image) { stage.src = image; stage.alt = variant.sku + " curtain motor"; }
      var badgeValue = firstValue(variant, "control") || firstValue(variant, "protocol");
      var badge = el("pdv2-stage-badge");
      badge.hidden = !badgeValue;
      if (badgeValue) badge.textContent = labelFor(record, valuesOf(variant, "control").length ? "control" : "protocol", badgeValue);
      var price = variant.price || {};
      el("pdv2-price").innerHTML = '<span class="pdv2-price-amount">' + esc(money(price.amount, price.currency)) + '</span><span class="pdv2-price-unit">/ ' + esc(price.unit || "unit") + "</span>";
      el("pdv2-price-terms").textContent = "MOQ " + (price.moq || 1) + " pcs · Reference price, ex-works";
      el("pdv2-source-state").textContent = "Published configuration · source-backed technical information";
      el("pdv2-rfq-summary").textContent = variant.sku + " · " + money(price.amount, price.currency) + " per " + (price.unit || "unit") + " · MOQ " + (price.moq || 1) + " pcs";
      el("pdv2-sticky-summary").textContent = variant.sku + " · " + money(price.amount, price.currency) + " · MOQ " + (price.moq || 1) + " pcs";
      el("pdv2-sticky").hidden = false;
      renderPicker(record, variant, renderVariant);
      renderChips(record, variant);
      var v = variant;
      renderSpecs(v);
      renderCompare(record, variant, renderVariant);
      renderIntegration(record, variant);
      renderInstall(record, variant);
      renderSources(record, variant, rfqHref());
      syncQuoteState();
    }

    document.querySelectorAll("[data-qty]").forEach(function (button) {
      button.addEventListener("click", function () {
        var input = el("pdv2-qty");
        input.value = String(Math.max(1, quantity() + parseInt(button.getAttribute("data-qty"), 10)));
        syncQuoteState();
      });
    });
    el("pdv2-qty").addEventListener("change", function () { el("pdv2-qty").value = String(quantity()); syncQuoteState(); });
    [el("pdv2-quote"), el("pdv2-quote-final"), el("pdv2-quote-sticky")].filter(Boolean).forEach(function (button) {
      button.addEventListener("click", addToQuote);
    });
    if (cart) cart.subscribe(syncQuoteState);
    renderVariant(variant, false);
  }

  var record = pickModel(new URLSearchParams(location.search).get("model"));
  if (!record) {
    var hero = document.querySelector(".pdv2-hero");
    if (hero) hero.innerHTML = '<div class="pdv2-card"><h1 class="pdv2-h1">Product not found</h1><p class="pdv2-tagline">This product is not currently available as a published configuration.</p><a class="pdv2-btn pdv2-btn--primary" href="products.html">Browse products</a></div>';
    document.querySelectorAll("main > section:not(.pdv2-band--hero), .pdv2-sticky").forEach(function (node) { node.hidden = true; });
  } else {
    render(record);
  }
}());
