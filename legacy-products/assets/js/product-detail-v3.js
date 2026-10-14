/* Data-driven PDP v3. The build injects the shared SSOT and quote assets. */
(function () {
  "use strict";
  var root = document.querySelector("[data-pdp-v3]");
  if (!root) return;

  var ssotNode = document.getElementById("pdv2-ssot");
  var SSOT = window.Z02_PDP_SSOT || null;
  try { SSOT = SSOT || (ssotNode ? JSON.parse(ssotNode.textContent.replace(/\\u003c/g, "<")) : null); } catch (e) { SSOT = null; }
  var esc = function (v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var params = new URLSearchParams(location.search);
  var requested = params.get("model") || root.getAttribute("data-pdp-model") || "";
  /* Legacy generated routes still exist in bookmarks and catalogue links. Keep
     those URLs working by resolving them to the canonical SSOT model instead
     of rendering a blank PDP when the old source id is no longer published. */
  var legacyAliases = {
    "src03-a15-mechanical": "mech-a15-006",
    "src03-a16-mechanical": "mech-a16-007",
    "src03-a6-mechanical": "mech-a6-009",
    "src03-a8-mechanical": "mech-a8-008",
    "src03-s2-mechanical": "mech-s2-006",
    "src03-s3-mechanical": "mech-s3-005",
    "src03-s5-mechanical": "mech-s5-007",
    "src03-s8-mechanical": "mech-s8-005",
    "src03-t10-mechanical": "mech-t10-011",
    "src03-y10-mechanical": "mech-y10-013",
    "src03-m6-glass": "src03-m6"
  };
  var resolvedRequested = legacyAliases[requested] || requested;
  var record = SSOT && SSOT.byModel ? (SSOT.byModel[resolvedRequested] || Object.values(SSOT.byModel).find(function (x) { return x.slug === resolvedRequested; })) : null;
  var empty = function (message) { root.innerHTML = '<div class="pdp-v3-empty"><h1>Product information is not ready.</h1><p>' + esc(message) + '</p></div>'; };
  if (!record) {
    if (/-mechanical$/.test(requested)) {
      root.innerHTML = '<div class="pdp-v3-empty pdp-v3-legacy-route"><h1>Product route moved.</h1><p>This legacy mechanical-switch URL is retained for compatibility, but its catalogue record is not published yet.</p><a class="blue-btn" href="../../mechanical-switches.html">Back to Mechanical Switches</a></div>';
    } else {
      empty("No catalogue product matched the requested model.");
    }
    return;
  }

  var detail = record.detail || {};
  var dims = (SSOT.dims && SSOT.dims[record.category_page]) || { dimensions: [], labels: {} };
  var allVariants = record.variants || [];
  var isPreview = root.hasAttribute("data-pdp-preview");
  var publicVariants = record.public_variants || (isPreview ? allVariants : allVariants.filter(function (v) { return v.publication_status === "published"; }));
  /* A draft route may exist as a noindex migration placeholder, but it must
     never expose draft price/SKU data to the interactive PDP. */
  var variants = publicVariants;
  var selected = variants.find(function (v) { return v.variant_id === params.get("variant"); }) || variants.find(function (v) { return v.variant_id === record.public_primary_variant; }) || variants.find(function (v) { return v.variant_id === record.primary_variant; }) || variants[0];
  if (!selected) { empty("This product has no configured variants yet."); return; }

  /* Option Matrix values are deliberately kept separate from SKU attributes.
     A matrix value can be displayed as a source-backed option, but it must not
     silently create a new variant or quotation line until a real SKU mapping
     exists. */
  var matrixAxes = record.option_matrix && record.option_matrix.axes || {};
  var m6GangControl = record.model_id === "src03-m6";
  var matrixSelection = {};
  var matrixFilterMaterial = "";
  var matrixEntries = function (key) {
    return (Array.isArray(matrixAxes[key]) ? matrixAxes[key] : []).map(function (entry) {
      return typeof entry === "string" ? { value: entry } : entry;
    }).filter(function (entry) { return entry && entry.value && !String(entry.value).includes("pending"); });
  };
  var matrixValues = function (key) {
    var selectedMaterial = matrixSelection.material || matrixFilterMaterial;
    return matrixEntries(key).filter(function (entry) { return !entry.material || !selectedMaterial || entry.material === selectedMaterial; }).map(function (entry) { return entry.value; }).filter(function (value, index, values) { return values.indexOf(value) === index; });
  };
  ["material", "color", "finish"].forEach(function(key){var value=params.get("option_"+key);if(value && (matrixValues(key).indexOf(value)!==-1 || (key==="finish" && variants.some(function(v){return ((v.attributes||{}).finish||[]).indexOf(value)!==-1;}))))matrixSelection[key]=value;});
  var matrixSummary = function () {
    return Object.keys(matrixSelection).map(function (key) { return key === "gang" ? matrixSelection[key] + " gang" : label(key, matrixSelection[key]); }).filter(Boolean).join(" / ");
  };
  var hasMatrixSelection = function () { return Object.keys(matrixSelection).length > 0; };
  var currentIsPublic = function () { return !hasMatrixSelection() && selected.publication_status === "published"; };
  var first = function (key, v) { return ((v || selected).attributes || {})[key] || []; };
  var label = function (key, value) { return (dims.labels && dims.labels[key] && dims.labels[key][value]) || value; };
  var initialMaterial = first("material")[0] || matrixValues("material")[0];
  if (initialMaterial && matrixEntries("color").some(function (entry) { return entry.material === initialMaterial; })) matrixFilterMaterial = initialMaterial;
  var swatchColors = {
    "advanced-gray": "#8b8d8f", "skin-gray": "#a6a6a2", "skin-silver": "#c9c9c6", "skin-white": "#f4f4f0",
    "skin-black": "#222326", "skin-gold": "#c7a15b", "cream-gold": "#d9c18a", "antique-bronze": "#806044",
    "gun-black": "#25282b", "colorful-blue": "#3f76b5", "coffee-bronze": "#765344", "bright-chrome": "#d7dce0",
    "business-gray": "#70757a", "classic-black": "#17191b", "champagne-gold": "#d6b77b", "hermes-orange": "#c96336",
    "ivory-white": "#f4f0e5", "space-gray": "#59616a", "sapphire-blue": "#23548c", "elegant-white": "#fafaf7",
    "glass-white": "#f7f7f4", "glass-black": "#161719", "white": "#ffffff", "black": "#161719",
    "gray": "#96999b", "silver": "#c7cbd0", "gold": "#c6a05b", "bronze": "#806044"
  };
  var swatchColor = function (value) { return swatchColors[String(value || "").toLowerCase()] || "#cbd5df"; };
  var joined = function (key, v, only) {
    if ((!v || v === selected) && key === "finish" && (matrixSelection.color || matrixSelection.finish)) return label("color", matrixSelection.color || matrixSelection.finish) + " (confirmation required)";
    var values = first(key, v).filter(function (x) { return !String(x).includes("pending") && (!only || only.indexOf(x) !== -1); });
    /* Finish values can describe the complete source-backed palette. They are
       not all part of the currently selected configuration, so keep the
       summary compact until the visitor chooses a matrix color. */
    if (key === "finish" && values.length > 1) values = values.slice(0, 1);
    return values.map(function (x) { return label(key, x); }).join(" / ");
  };
  var configDimensions = function () {
    var available = (dims.dimensions || []).filter(function (d) { return variants.some(function (v) { return first(d.key, v).length; }); });
    var primary = available.filter(function (d) { return d.primary; });
    return (primary.length ? primary : available).slice(0, 5);
  };
  var heroDimensions = function () {
    var available = configDimensions();
    var preferred = ["protocol", "gang", "finish"].map(function (key) { return available.find(function (d) { return d.key === key; }); }).filter(Boolean);
    return preferred.length === 3 ? preferred : available.slice(0, 3);
  };
  var configSummary = function () {
    return configDimensions().map(function (d) {
      if (m6GangControl && d.key === "gang" && matrixSelection.gang) return "";
      if (d.key === "finish" && matrixSelection.color) return "";
      return joined(d.key);
    }).filter(Boolean).concat(matrixSummary() ? [matrixSummary()] : []).join(" / ");
  };
  var heroSummary = function () { return heroDimensions().map(function (d) { return joined(d.key); }).filter(Boolean).join(" / "); };
  /* The first PDP visual follows the same canonical image used by the PLP.
     Other views remain explicit placeholders until model-specific photography
     is supplied; a variant image must never silently become a fake view. */
  var categoryImages = {
    "src03-m6": "assets/images/products/smart-switches/m6/m6-plp-main.png",
    "src03-m6s": "assets/images/products/smart-switches/m6s/m6s-plp-main.png",
    "src03-m8": "assets/images/products/smart-switches/m8/m8-plp-main.png",
    "src03-m9": "assets/images/products/smart-switches/m9/m9-plp-main.png",
    "src03-m10-glass": "assets/images/products/smart-switches/m10-glass/m10-glass-plp-main.png",
    "src03-m12": "assets/images/products/smart-switches/m12/m12-plp-main.png",
    "src03-m12s": "assets/images/products/smart-switches/m12s/m12s-plp-main.png",
    "src03-z5": "assets/images/products/smart-switches/z5/z5-plp-main.png",
    "src03-z6": "assets/images/products/smart-switches/z6/z6-plp-main.png",
    "src03-z7": "assets/images/products/smart-switches/z7/z7-plp-main.png",
    "src03-s8-smart": "assets/images/products/smart-switches/s8/s8-plp-main.png",
    "mech-s3-005": "assets/images/products/mechanical-switches/mechanical-1gang.png",
    "mech-s2-006": "assets/images/products/mechanical-switches/mechanical-2gang.png",
    "mech-s5-007": "assets/images/products/mechanical-switches/mechanical-3gang.png",
    "mech-a8-008": "assets/images/products/mechanical-switches/mechanical-4gang.png",
    "mech-a6-009": "assets/images/products/mechanical-switches/mechanical-emergency-1gang.png",
    "mech-s8-005": "assets/images/products/mechanical-switches/mechanical-1gang.png",
    "mech-a15-006": "assets/images/products/mechanical-switches/mechanical-2gang.png",
    "mech-a16-007": "assets/images/products/mechanical-switches/mechanical-3gang.png",
    "mech-y10-013": "assets/images/products/mechanical-switches/mechanical-emergency-3gang.png",
    "mech-t10-011": "assets/images/products/mechanical-switches/mechanical-4gang.png"
  };
  var categoryImage = function () { return categoryImages[record.model_id] || ""; };
  var imgSrc = function (v) { return categoryImage() || (v.asset_overrides && v.asset_overrides.primary_image) || (v.image && v.image.src) || "assets/images/placeholders/product-switch-a.svg"; };
  var heroReference = record.model_id === "gsl-s4" ? {
    image: "candidates/pdp-01-hero/hero-stage.png",
    note: "Reference visual — final S4 photography pending confirmation.",
    feature: "candidates/pdp-02-highlights/highlights-product.png",
    finish: "candidates/pdp-08-finishes/finish-hero.png",
    custom: "candidates/pdp-09-customization/customization-hero.png",
    rfq: "candidates/pdp-11-quote-rfq/selected-product-media.png",
    installation: "candidates/pdp-06-installation/dimension-drawing.png",
    connectivity: "candidates/pdp-07-connectivity/connectivity-diagram.png",
    gallery: [
      ["Front panel", "Premium glass panel reference", "candidates/pdp-03-gallery/main-detail.png"],
      ["Surface detail", "Surface-finish reference", "candidates/pdp-03-gallery/surface-detail.png"],
      ["Side profile", "Wall profile reference", "candidates/pdp-03-gallery/side-profile.png"],
      ["Rear structure", "Rear structure reference", "candidates/pdp-03-gallery/rear-structure.png"],
      ["Installed view", "Installation-context reference", "candidates/pdp-03-gallery/installed-view.png"]
    ],
    views: [
      ["Front", "candidates/pdp-01-hero/thumb-front.png"],
      ["Angle", "candidates/pdp-01-hero/thumb-angle.png"],
      ["Side", "candidates/pdp-01-hero/thumb-side.png"],
      ["Back", "candidates/pdp-01-hero/thumb-back.png"],
      ["Detail", "candidates/pdp-01-hero/thumb-detail.png"],
      ["Installed", "candidates/pdp-01-hero/thumb-installed.png"]
    ]
  } : null;
  var all = function (selector) { return Array.prototype.slice.call(root.querySelectorAll(selector)); };
  var setText = function (selector, value) { all(selector).forEach(function (node) { node.textContent = value == null ? "" : value; }); };
  var money = function (p) { return p && p.amount != null && p.status !== "placeholder" ? (p.currency || "USD") + " " + Number(p.amount).toFixed(2) : "Price on request"; };
  var qty = 1;

  function updateUrl() { var next = new URL(location.href); if (!root.getAttribute("data-pdp-model")) next.searchParams.set("model", record.model_id); next.searchParams.set("variant", selected.variant_id); ["material","color","finish"].forEach(function(key){if(matrixSelection[key])next.searchParams.set("option_"+key,matrixSelection[key]);else next.searchParams.delete("option_"+key);}); history.replaceState({}, "", next.pathname + "?" + next.searchParams.toString()); }
  function updateSelection() {
    var config = configSummary() || "—";
    setText("[data-pdp-selection]", config);
    setText("[data-pdp-hero-selection]", heroSummary() || config);
    setText("[data-pdp-series]", "Series " + (record.series || "—"));
    setText("[data-pdp-sku]", "SKU " + (selected.sku || "—"));
    setText("[data-pdp-price]", money(selected.price));
    setText("[data-pdp-rfq-sku]", selected.sku || "—");
    setText("[data-pdp-rfq-ready]", currentIsPublic() ? "Configuration ready" : "Configuration pending confirmation");
    setText("[data-pdp-price-note]", selected.price && selected.price.quantity_basis ? selected.price.quantity_basis : "Based on selected configuration.");
    var image = imgSrc(selected);
    [["[data-pdp-feature-image]", "feature"], ["[data-pdp-finish-image]", "finish"], ["[data-pdp-custom-image]", "custom"], ["[data-pdp-rfq-image]", "rfq"]].forEach(function (entry) { all(entry[0]).forEach(function (node) { node.src = heroReference && heroReference[entry[1]] || image; node.alt = heroReference && heroReference[entry[1]] ? "Reference visual — final product asset pending confirmation" : record.name + " — " + (selected.sku || "selected configuration"); }); });
    all("[data-pdp-hero-image]").forEach(function (node) { node.src = heroReference ? heroReference.image : image; node.alt = heroReference ? "Reference visual for product detail layout" : record.name + " — " + (selected.sku || "selected configuration"); });
    var note = root.querySelector("[data-pdp-hero-asset-note]");
    if (note) { note.hidden = !heroReference; note.textContent = heroReference ? heroReference.note : ""; }
    var rfq = "request-a-quote.html?model=" + encodeURIComponent(record.model_id) + "&variant=" + encodeURIComponent(selected.variant_id);
    all("[data-pdp-rfq], [data-pdp-rfq-final]").forEach(function (node) { node.href = rfq; });
    all("[data-pdp-add], [data-pdp-add-final], .hero-actions .blue-btn, .quote-request .blue-btn").forEach(function (node) {
      var disabled = !currentIsPublic();
      node.disabled = disabled;
      node.setAttribute("aria-disabled", String(disabled));
      node.classList.toggle("is-disabled", disabled);
      if (disabled) node.setAttribute("tabindex", "-1"); else node.removeAttribute("tabindex");
    });
    var status = currentIsPublic() ? "Published configuration" : "Draft configuration — quotation is disabled until publication is confirmed.";
    setText("[data-pdp-status]", status);
    setText("[data-pdp-rfq-name]", record.name || "Selected product");
    /* Titles identify the model page, not whichever configuration chip a
       visitor happens to select; this keeps canonical documents stable. */
    document.title = record.name + " | Hauslysmart";
  }
  function renderVariants() {
    var target = root.querySelector("[data-pdp-variants]");
if (!target) return;
    var optionDims = heroDimensions();
    var optionKeys = optionDims.map(function (d) { return d.key; });
    var selectedValue = function (key) { return first(key)[0] || ""; };
    var matchesValue = function (v, key, value) { return first(key, v).indexOf(value) !== -1; };
    target.innerHTML = optionKeys.map(function (key) {
      var dimension = optionDims.find(function (d) { return d.key === key; });
      var values = [];
      variants.forEach(function (v) { first(key, v).forEach(function (value) { if (values.indexOf(value) === -1) values.push(value); }); });
      return '<div class="pdp-v3-option-group" data-pdp-option-group="' + esc(key) + '"><strong>' + esc(dimension && dimension.label || key) + '</strong><div class="pdp-v3-option-list">' + values.map(function (value) {
        var available = variants.some(function (v) { return matchesValue(v, key, value); });
        var isSelected = selectedValue(key) === value;
        return '<button type="button" class="' + (isSelected ? "is-selected" : "") + '" data-pdp-option-value="' + esc(value) + '" aria-pressed="' + (isSelected ? "true" : "false") + '"' + (available ? "" : " disabled") + '>' + esc(label(key, value)) + '</button>';
      }).join("") + '</div></div>';
    }).join("");
    all("[data-pdp-option-value]").forEach(function (button) {
      button.addEventListener("click", function () {
        var group = button.closest("[data-pdp-option-group]");
        var key = group && group.getAttribute("data-pdp-option-group");
        var value = button.getAttribute("data-pdp-option-value");
        var next = variants.find(function (v) { return matchesValue(v, key, value) && optionKeys.every(function (other) { return other === key || matchesValue(v, other, selectedValue(other)); }); }) || variants.find(function (v) { return matchesValue(v, key, value); });
        if (!next) return;
        selected = next;
        updateUrl();
        renderAll();
      });
    });
  }
  function renderFeatures() {
    var isMechanical = record.category_page === "cat-mechanical-switches";
    var operation = joined("operation") || joined("function") || "Control details pending confirmation";
    var connectivity = joined("connectivity") || joined("protocol") || "Connectivity pending confirmation";
    var mechanism = joined("mechanism") || "Mechanism pending confirmation";
    var installation = detail.installation && detail.installation.rows && detail.installation.rows[0];
    var installationValue = installation && (installation.from ? joined(installation.from, selected, installation.only) : installation.value) || "Installation details pending confirmation";
    var items = isMechanical ? [
      { title: "Control function", value: operation },
      { title: "Switch configuration", value: configSummary() || "Configuration pending confirmation" },
      { title: "Mechanism", value: mechanism },
      { title: "Installation design", value: installationValue }
    ] : [
      { title: "Control interface", value: operation },
      { title: "Flexible configuration", value: configSummary() || "Configuration pending confirmation" },
      { title: "Smart connectivity", value: connectivity },
      { title: "Installation design", value: installationValue }
    ];
    var target = root.querySelector("[data-pdp-features]") || root.querySelector(".feature-list");
if (!target) return;
    target.innerHTML = items.map(function (item, i) { return '<article><b>0' + (i + 1) + '</b><div><h3>' + esc(item.title) + '</h3><p>' + esc(item.value) + '</p></div></article>'; }).join("");
    if (!target.parentElement.querySelector(".pdp-v3-inline-links") && !target.parentElement.querySelector(".inline-links")) target.insertAdjacentHTML("afterend", '<div class="pdp-v3-inline-links"><a href="#screen-05">View technical specifications <span>→</span></a><a href="#screen-06">Explore installation details <span>→</span></a></div>');
  }
  function renderHeroViews() {
    var target = root.querySelector("[data-pdp-hero-thumbs]");
    if (!target) return;
    var views = heroReference && heroReference.views || [];
    target.innerHTML = views.map(function (view, index) { return '<button type="button" class="' + (!index ? "is-selected" : "") + '" data-pdp-hero-view="' + esc(view[1]) + '"><img src="' + esc(view[1]) + '" alt="' + esc(view[0] + " reference view") + '"><span>' + esc(view[0]) + '</span></button>'; }).join("");
    all("[data-pdp-hero-view]").forEach(function (button) { button.addEventListener("click", function () { all("[data-pdp-hero-view]").forEach(function (item) { item.classList.toggle("is-selected", item === button); }); }); });
  }
  function renderGallery() {
    var views = heroReference && heroReference.gallery ? heroReference.gallery.map(function (view) { return { view: view[0], caption: view[1], src: view[2], verification: "reference" }; }) : (selected.views || []).filter(function (v) { return v && v.src && v.verification === "verified"; });
    if (!views.length && selected.image && selected.image.src) views = [selected.image];
    var pdT = root.querySelector("[data-pdp-gallery]"); if (pdT) pdT.innerHTML = views.length ? views.map(function (view, i) { return '<figure class="' + (!i ? "is-main" : "") + '"><img src="' + esc(view.src) + '" alt="' + esc((heroReference ? "Reference visual — " : record.name + " ") + (view.view || "product view")) + '" loading="lazy"><figcaption><b>' + esc(view.view || "Product view") + '</b><span>' + esc(view.caption || (heroReference ? "Reference visual — final product asset pending confirmation." : "Verified product view")) + '</span></figcaption></figure>'; }).join("") : '<div class="pdp-v3-pending">Verified product views are not available for this configuration.</div>';
  }
  function renderDimensions() {
    var target = root.querySelector("[data-pdp-dimensions]");
if (!target) return;
    target.innerHTML = (dims.dimensions || []).slice(0, 5).map(function (d) { return '<div><b>' + esc(d.label) + '</b><span>' + esc(joined(d.key) || "Confirm for selected configuration") + '</span></div>'; }).join("");
  }
  function renderConfigTable() {
    var dimensions = configDimensions();
    var pdT = root.querySelector("[data-pdp-config-head]"); if (pdT) pdT.innerHTML = dimensions.map(function (d) { return '<th>' + esc(d.label || d.key) + '</th>'; }).join("") + '<th>Price</th><th>Status</th>';
    var pdT = root.querySelector("[data-pdp-config-table]"); if (pdT) pdT.innerHTML = variants.map(function (v) { var status = v.publication_status === "published" ? "Available" : "Pending confirmation"; return '<tr class="' + (v.variant_id === selected.variant_id ? "is-current" : "") + '">' + dimensions.map(function (d) { return '<td>' + esc(joined(d.key, v) || "—") + '</td>'; }).join("") + '<td>' + esc(money(v.price)) + '</td><td>' + esc(status) + '</td></tr>'; }).join("");
  }
  function valueFor(row) { if (row.status === "pending") return "Confirm for selected configuration"; if (row.kind === "sku") return selected.sku; if (row.kind === "variant") return selected.variant_id; if (row.kind === "series") return record.series || "—"; return row.from ? (joined(row.from, selected, row.only) || "Confirm for selected configuration") : "—"; }
  function renderSpecs() {
    var groups = (detail.spec_groups || []).slice(0, 4);
    var pdT = root.querySelector("[data-pdp-spec-nav]"); if (pdT) pdT.innerHTML = groups.map(function (g) { return '<a href="#spec-' + esc(g.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")) + '">' + esc(g.label) + '</a>'; }).join("");
    var pdT = root.querySelector("[data-pdp-specs]"); if (pdT) pdT.innerHTML = groups.length ? groups.map(function (g) { var id = g.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"); return '<article id="spec-' + esc(id) + '"><h3>' + esc(g.label) + '</h3><dl>' + (g.rows || []).map(function (row) { return '<div><dt>' + esc(row.label) + '</dt><dd>' + esc(valueFor(row)) + '</dd></div>'; }).join("") + '</dl></article>'; }).join("") : '<div class="pdp-v3-pending">Technical specification groups are pending in the shared product contract.</div>';
  }
  function renderRows(target, rows) { if (!target) return; target.innerHTML = (rows || []).map(function (row) { var value = row.status === "pending" ? "Confirm for selected configuration" : row.from ? (joined(row.from, selected, row.only) || "Confirm for selected configuration") : "—"; return '<div><span>' + esc(row.label) + '</span><b>' + esc(value) + '</b></div>'; }).join(""); }
  function renderInstall() { renderRows(root.querySelector("[data-pdp-install]"), detail.installation && detail.installation.rows); var drawing = detail.installation && detail.installation.drawings && detail.installation.drawings.find(function (x) { return x.verification === "verified" && x.src; }); var pdT = root.querySelector("[data-pdp-drawing]"); if (pdT) pdT.innerHTML = heroReference && heroReference.installation ? '<img src="' + esc(heroReference.installation) + '" alt="Reference installation drawing — final product drawing pending confirmation"><p>Reference drawing — final S4 dimensions and wiring pending confirmation.</p>' : drawing ? '<img src="' + esc(drawing.src) + '" alt="' + esc(drawing.alt || drawing.title || "Installation drawing") + '"><p>' + esc(drawing.title || "Verified installation drawing") + '</p>' : '<div class="pdp-v3-pending">Verified dimension and wiring drawings are not available for this configuration.</div>'; }
  function renderCompatibility() { var isMechanical = record.category_page === "cat-mechanical-switches"; var rows = detail.compatibility || []; var pdT = root.querySelector("[data-pdp-compatibility]"); if (pdT) pdT.innerHTML = rows.map(function (row) { var value = row.status === "pending" ? "Pending confirmation" : row.status === "not_applicable" ? "Not applicable for this mechanical product" : row.from ? (joined(row.from, selected, row.only) || "Conditional") : row.support || "—"; return '<div><span>' + esc(row.mode) + '</span><b>' + esc(value) + '</b></div>'; }).join(""); var connection = (dims.dimensions || []).find(function (d) { return ["protocol", "integration", "control", "connectivity"].indexOf(d.key) !== -1; }); var platform = (dims.dimensions || []).find(function (d) { return ["app", "platform", "os", "integration"].indexOf(d.key) !== -1; }); var pdT = root.querySelector("[data-pdp-flow]"); if (pdT) pdT.innerHTML = isMechanical ? '<div class="pdp-v3-flow-node">' + esc(record.name) + '</div><span>→</span><div class="pdp-v3-flow-node">Mechanical control</div><span>→</span><div class="pdp-v3-flow-node">No network protocol</div>' : heroReference && heroReference.connectivity ? '<img class="pdp-v3-flow-image" src="' + esc(heroReference.connectivity) + '" alt="Reference connectivity diagram — final integration support pending confirmation">' : '<div class="pdp-v3-flow-node">' + esc(record.name) + '</div><span>→</span><div class="pdp-v3-flow-node">' + esc(connection ? (joined(connection.key) || connection.label) : (joined(configDimensions()[0] && configDimensions()[0].key) || "Configuration pending")) + '</div><span>→</span><div class="pdp-v3-flow-node">' + esc(platform ? (joined(platform.key) || platform.label) : "Integration pending") + '</div>'; }
  function renderFinishes() { var seen = {}; variants.forEach(function (v) { first("finish", v).forEach(function (x) { seen[x] = true; }); }); var keys = Object.keys(seen); var finishImages = { white: "finish-white.png", black: "finish-black.png", grey: "finish-grey.png", gray: "finish-grey.png", gold: "finish-gold.png" }; var target = root.querySelector("[data-pdp-finishes]"); if (!target) return; target.innerHTML = keys.length ? keys.map(function (key) { var normalized = String(key).toLowerCase(); var src = heroReference && finishImages[normalized] ? 'candidates/pdp-08-finishes/' + finishImages[normalized] : ""; return '<button type="button" class="' + (first("finish").includes(key) ? "is-selected" : "") + '" data-finish="' + esc(key) + '">' + (src ? '<img src="' + esc(src) + '" alt="Reference finish visual — ' + esc(label("finish", key)) + '">' : '<i></i>') + '<span>' + esc(label("finish", key)) + '</span></button>'; }).join("") : '<p class="pdp-v3-pending">Finish options are pending confirmation.</p>'; var panels = root.querySelector("[data-pdp-panel-options]"); if (panels) panels.innerHTML = heroReference ? '<div><img src="candidates/pdp-08-finishes/glass-panel-thumb.png" alt="Glass panel reference"><b>Glass panel</b><small>Reference option — availability pending.</small></div><div><img src="candidates/pdp-08-finishes/pc-panel-thumb.png" alt="PC panel reference"><b>PC panel</b><small>Reference option — availability pending.</small></div>' : '<p class="pdp-v3-pending">Panel options require verified product data.</p>'; all("[data-finish]").forEach(function (button) { button.addEventListener("click", function () { var value = button.getAttribute("data-finish"); var next = variants.find(function (v) { return first("finish", v).indexOf(value) !== -1 && configDimensions().every(function (d) { return d.key === "finish" || !first(d.key).length || first(d.key, v).indexOf(first(d.key)[0]) !== -1; }); }) || variants.find(function (v) { return first("finish", v).indexOf(value) !== -1; }); if (!next) return; selected = next; updateUrl(); renderAll(); }); }); }
  function renderCustomization() { var items = detail.ordering && detail.ordering.customization || []; var pdT = root.querySelector("[data-pdp-customization]"); if (pdT) pdT.innerHTML = items.length ? items.map(function (x) { return '<div><strong>' + esc(x) + '</strong><span>Discussion topic only</span></div>'; }).join("") : '<div class="pdp-v3-pending">Customization options are pending confirmation.</div>'; var media = root.querySelector(".pdp-v3-custom-media"); if (media && items.length && !media.querySelector(".pdp-v3-custom-chips")) media.insertAdjacentHTML("beforeend", '<div class="pdp-v3-custom-chips">' + items.slice(0, 3).map(function (x) { return '<div><strong>' + esc(x) + '</strong><small>By verified option / project discussion</small></div>'; }).join("") + '</div>'); }
  function renderRfqData() {
    var target = root.querySelector("[data-pdp-rfq-data]");
if (!target) return;
    var rows = configDimensions().slice(0, 3).map(function (d) { return { label: d.label || d.key, value: joined(d.key) || "Confirm for selected configuration" }; });
    rows.push({ label: "SKU", value: selected.sku || "Confirm for selected configuration" });
    rows.push({ label: "Reference price", value: money(selected.price) });
    target.innerHTML = rows.map(function (row) { return '<div><span>' + esc(row.label) + '</span><b>' + esc(row.value) + '</b></div>'; }).join("");
  }
  function renderNextSteps() {
    var section = root.querySelector(".pdp-v3-next");
    if (!section) return;
    var intro = section.firstElementChild;
    if (intro) intro.classList.add("pdp-v3-next-copy");
    var grid = section.querySelector(".pdp-v3-next-grid");
    if (!grid) return;
    if (!section.querySelector("[data-pdp-next-visual]")) {
      var visual = document.createElement("img");
      visual.className = "pdp-v3-next-visual";
      visual.setAttribute("data-pdp-next-visual", "");
      visual.alt = "Provisional lifestyle visual for next steps";
      visual.src = record.model_id === "gsl-s4" ? "candidates/pdp-10-next-steps/next-steps-visual.png" : "assets/images/placeholders/product-switch-a.svg";
      section.insertBefore(visual, grid);
      var note = document.createElement("small");
      note.className = "pdp-v3-provisional-note";
      note.textContent = "Visual reference — final product asset pending confirmation.";
      section.appendChild(note);
    }
    if (!section.querySelector("[data-pdp-support-strip]")) {
      var strip = document.createElement("div");
      strip.className = "pdp-v3-support-strip";
      strip.setAttribute("data-pdp-support-strip", "");
      strip.innerHTML = [
        ["Professional Support", "Product and project advice from our team."],
        ["Complete Documentation", "Datasheet, user manual and installation guidance."],
        ["Flexible Customization", "OEM / ODM options where verified."],
        ["Long-Term Partnership", "Reliable manufacturing and stable supply."]
      ].map(function (item) { return '<div><i aria-hidden="true">✓</i><span><strong>' + esc(item[0]) + '</strong><small>' + esc(item[1]) + '</small></span></div>'; }).join("");
      section.appendChild(strip);
    }
  }
  /* ── Combined master layout (product-detail-v3.html) ────────────────────
     The approved 11-screen master uses its own class vocabulary
     (.hero-copy / .data-panel / .spec-cards / .related-grid …) instead of the
     legacy [data-pdp-*] slots. renderMaster() fills THOSE nodes from the same
     SSOT state. Every lookup is null-safe: a missing node just skips.
     诚实规则：维度值只有非 pending 的才渲染成可选项；全 pending 时退化为
     Catalogue Code 选择，其余一律 "Confirm for selected configuration"。 */
  var PENDING_TEXT = "Confirm for selected configuration";
  var isReal = function (x) { return !String(x).includes("pending"); };
  var priceText = function (v) { if (hasMatrixSelection() && (!v || v === selected)) return "Price on request"; var p = v && v.price; return p && p.amount != null && p.status !== "placeholder" ? money(p) : "Price on request"; };
  var realDims = function () {
    return configDimensions().filter(function (d) {
      return variants.some(function (v) { return first(d.key, v).some(isReal); });
    });
  };
  var configValues = function () {
    return configDimensions().filter(function(d){return !(d.key === 'finish' && (matrixSelection.color || matrixSelection.finish)) && !(d.key === 'material' && matrixSelection.material);}).map(function (d) { return { label: d.label || d.key, value: joined(d.key) || PENDING_TEXT }; });
  };
  var selValues = function () {
    var real = realDims();
    var values = real.length ? configValues().slice(0, 3).map(function (x) { return x.value; }) : [selected.sku || selected.variant_id];
    if (matrixSummary()) values.push(matrixSummary());
    return values;
  };
  var readQty = function () {
    var input = root.querySelector(".quantity-control input");
    return Math.max(1, Number.parseInt((input && input.value) || "1", 10) || 1);
  };
  function switchVariant(next) { if (!next) return; selected = next; updateUrl(); renderAll(); }
  function renderMasterHero() {
    var family = record.family_label || "PRODUCTS";
    var familyPage = record.family_page || "products.html";
    var isMechanical = record.category_page === "cat-mechanical-switches";
    var mechanicalLead = "Source-backed mechanical switch for residential, hospitality, and commercial spaces. Confirmed configuration details are shown below.";
    var productName = record.name || "this product";
    var bcLink = root.querySelector(".hero-breadcrumb a:nth-of-type(3)"); if (bcLink) { bcLink.href = familyPage; bcLink.textContent = family; }
    var bc = root.querySelector(".hero-breadcrumb strong"); if (bc) bc.textContent = record.name || "";
    var kicker = root.querySelector(".hero-copy .screen-kicker"); if (kicker) kicker.textContent = family.toUpperCase();
    var h1 = root.querySelector("#title-01"); if (h1) h1.textContent = record.name || "Product";
    var lead = root.querySelector(".hero-copy .screen-lead"); if (lead) lead.textContent = isMechanical ? mechanicalLead : (record.summary || "");
    setText(".screen-03 .screen-lead", isMechanical ? "Review labelled product-view placeholders for the selected mechanical switch; final photography remains pending source confirmation." : "Explore the refined details of " + productName + ". Detailed product photography and installation views are shown when verified.");
    setText(".screen-09 .screen-lead", isMechanical ? "Review project-level customization topics for the selected mechanical switch. Standard colour, finish, and material values remain pending confirmation." : "Review product-level customization options for " + productName + ". Standard availability and project-supported OEM / ODM options are shown separately.");
    if (isMechanical) {
      setText(".screen-02 .screen-lead", "A source-backed mechanical switch overview with control function, gang configuration, mechanism, and installation details resolved from the catalogue.");
      setText(".screen-04 .screen-lead", "Review the confirmed function and gang configuration for this mechanical switch. Material, finish, colour, and technical values remain pending confirmation.");
      setText(".screen-08 .screen-lead", "Colour, finish, and panel material options remain pending source confirmation for this mechanical switch.");
      setText(".screen-08 .finish-group:first-of-type h3", "Colour & Finish");
      setText(".screen-08 .finish-group:first-of-type .finish-helper", "Source confirmation pending.");
      setText(".screen-08 .finish-group:nth-of-type(2) h3", "Panel Material");
      setText(".screen-08 .finish-group:nth-of-type(2) .finish-helper", "Source confirmation pending.");
    }
    setText("[data-series]", record.series || "—");
    setText("[data-series-sku]", selected.sku || "—");
    var price = root.querySelector(".hero-copy .price"); if (price) price.textContent = priceText(selected);
    var stage = root.querySelector(".hero-media img");
    /* PDP policy: only the category card image is real media during data intake.
       Candidate/detail photos stay purpose-labelled placeholders until verified. */
    if (stage) { stage.src = categoryImage() || imgSrc(selected); stage.alt = record.name + " — category product image"; }
    var placeholderViews = [
      { src: categoryImage() || imgSrc(selected), alt: record.name + " — category product image" },
      { src: "assets/images/placeholders/pdp-angle.svg", alt: record.name + " — angle view placeholder" },
      { src: "assets/images/placeholders/pdp-side.svg", alt: record.name + " — side view placeholder" },
      { src: "assets/images/placeholders/pdp-back.svg", alt: record.name + " — back view placeholder" },
      { src: "assets/images/placeholders/pdp-detail.svg", alt: record.name + " — detail view placeholder" },
      { src: "assets/images/placeholders/pdp-installed.svg", alt: record.name + " — installed view placeholder" }
    ];
    all(".hero-thumbs img").forEach(function (im, index) {
      var view = placeholderViews[index] || placeholderViews[0];
      im.src = view.src;
      im.alt = view.alt;
    });
  }
  function renderMasterChips() {
    var holder = root.querySelector(".hero-copy");
    if (!holder) return;
    all(".hero-copy .control-row").forEach(function (row) { row.remove(); });
    /* Matrix-owned axes get their own source-backed controls below. Keep them
       out of the legacy variant chip rows so Finish/Color do not appear twice
       with incompatible value vocabularies. */
    /* Material / finish / color are matrix-owned controls. Other dimensions
       such as connectivity and gang still have real published variants and
       must remain selectable in the hero configuration rows. */
    var matrixChipKeys = { material: true, finish: true, color: true };
    if (m6GangControl) matrixChipKeys.gang = true;
    var dims = realDims().filter(function (d) { return !matrixChipKeys[d.key]; });
    var html = "";
    if (dims.length) {
      html = dims.map(function (d) {
        var values = [];
        variants.forEach(function (v) { first(d.key, v).forEach(function (x) { if (isReal(x) && values.indexOf(x) === -1) values.push(x); }); });
        return '<div class="control-row"><b>' + esc(d.label || d.key) + '</b>' + values.map(function (value) {
          var isSel = first(d.key).indexOf(value) !== -1;
          return '<button type="button" class="choice' + (isSel ? " active" : "") + '" data-chip-key="' + esc(d.key) + '" data-chip-value="' + esc(value) + '" aria-pressed="' + isSel + '">' + esc(label(d.key, value)) + '</button>';
        }).join("") + '</div>';
      }).join("");
    } else {
      html = '<div class="control-row"><b>Catalogue Code</b>' + variants.map(function (v) {
        var isSel = v.variant_id === selected.variant_id;
        return '<button type="button" class="choice' + (isSel ? " active" : "") + '" data-chip-variant="' + esc(v.variant_id) + '" aria-pressed="' + isSel + '">' + esc(v.sku || v.variant_id) + '</button>';
      }).join("") + '</div>';
    }
    (m6GangControl ? ["gang", "material", "finish", "color"] : ["material", "finish", "color"]).forEach(function (key) {
      var values = key === "gang" ? ["1", "2", "3", "4", "6", "8"] : matrixValues(key);
      var matrixLabel = key === "color" ? "Color" : key === "finish" ? "Finish" : "Material";
      if (key === "gang") matrixLabel = "Keys & Channels";
      /* Some mechanical-switch records deliberately carry only a
         source-pending color attribute. Keep the configuration surface
         consistent without inventing a palette: show a disabled swatch and
         an explicit confirmation state until the catalogue supplies colors. */
      if (!values.length) {
        var hasPendingColor = key === "color" && record.category_page === "cat-mechanical-switches" && variants.some(function (v) {
          var colors = first("color", v);
          return colors.length && colors.every(function (value) { return !isReal(value); });
        });
        if (!hasPendingColor) return;
        html += '<div class="control-row matrix-control-row pending-control-row"><b>' + esc(matrixLabel) + '</b><button type="button" class="choice matrix-color-choice is-pending" disabled aria-disabled="true" title="Color confirmation pending" aria-label="Color confirmation pending"><span class="sr-only">Color confirmation pending</span></button><span class="pending-option-label">To be confirmed</span></div>';
        return;
      }
      html += '<div class="control-row matrix-control-row"><b>' + esc(matrixLabel) + '</b>' + values.map(function (value) {
        var isSel = matrixSelection[key] === value || (key === "material" && !matrixSelection.material && matrixFilterMaterial === value) || (key === "gang" && !matrixSelection.gang && first("gang")[0] === value);
        var valueLabel = key === "gang" ? (value + " gang") : label(key, value);
        var colorAttrs = key === "color" ? ' matrix-color-choice" style="--swatch-color:' + swatchColor(value) + '" title="' + esc(valueLabel) + '" aria-label="' + esc(valueLabel) + '"' : '"';
        var colorContent = key === "color" ? '<span class="sr-only">' + esc(valueLabel) + '</span>' : esc(valueLabel);
        var gangClass = key === "gang" ? " matrix-gang-choice" : "";
        return '<button type="button" class="choice' + gangClass + (isSel ? " active" : "") + colorAttrs + ' data-chip-matrix-key="' + esc(key) + '" data-chip-matrix-value="' + esc(value) + '" aria-pressed="' + isSel + '">' + colorContent + '</button>';
      }).join("") + '</div>';
    });
    var actions = root.querySelector(".hero-copy .hero-actions");
    if (actions) actions.insertAdjacentHTML("beforebegin", html); else holder.insertAdjacentHTML("beforeend", html);
    all("[data-chip-key]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-chip-key");
        var value = btn.getAttribute("data-chip-value");
        var current = realDims();
        var isActive = first(key).indexOf(value) !== -1;
        var next;
        if (isActive) {
          /* Clicking the active function is a toggle. Prefer the closest
             non-matching variant, keeping gang/protocol/etc. aligned. */
          var currentGang = String(first("gang")[0] || "").split("-")[0];
          next = variants.filter(function (v) { return first(key, v).indexOf(value) === -1; }).map(function (v) {
            var score = 0;
            current.forEach(function (d) {
              if (d.key === key) return;
              var wanted = first(d.key)[0];
              var candidate = first(d.key, v);
              if (wanted && candidate.indexOf(wanted) !== -1) score += 3;
              if (d.key === "gang" && currentGang && candidate.some(function (x) { return String(x).split("-")[0] === currentGang; })) score += 5;
            });
            return { variant: v, score: score };
          }).sort(function (a, b) { return b.score - a.score; }).map(function (x) { return x.variant; })[0];
        } else {
          next = variants.find(function (v) { return first(key, v).indexOf(value) !== -1 && current.every(function (d) { return d.key === key || !first(d.key).length || first(d.key, v).indexOf(first(d.key)[0]) !== -1; }); }) || variants.find(function (v) { return first(key, v).indexOf(value) !== -1; });
        }
        switchVariant(next);
      });
    });
    all("[data-chip-variant]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchVariant(variants.find(function (v) { return v.variant_id === btn.getAttribute("data-chip-variant"); }));
      });
    });
    all("[data-chip-matrix-key]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-chip-matrix-key");
        var value = btn.getAttribute("data-chip-matrix-value");
        if (!key || !value) return;
        if (key === "gang") {
          var matchingGang = variants.find(function (variant) { return first("gang", variant).indexOf(value) !== -1; });
          if (matchingGang) {
            delete matrixSelection.gang;
            switchVariant(matchingGang);
            return;
          }
        }
        if(matrixSelection[key]===value){delete matrixSelection[key];updateUrl();renderAll();return;} matrixSelection[key] = value; updateUrl();
        ["finish", "color"].forEach(function (dependent) {
          if (matrixSelection[dependent] && matrixValues(dependent).indexOf(matrixSelection[dependent]) === -1) delete matrixSelection[dependent];
        });
        renderAll();
      });
    });
    var strongSel = root.querySelector(".hero-actions > strong");
    if (strongSel) strongSel.textContent = configSummary() || (selected.sku ? "Code " + selected.sku : "—");
  }
  function renderMasterConfig() {
    var cols = realDims();
    var useCode = !cols.length;
    var head = "";
    var rows = "";
    if (useCode) {
      head = "<th>Code</th><th>Price</th><th>Status</th>";
      rows = variants.map(function (v) {
        var cur = v.variant_id === selected.variant_id;
        return '<tr class="' + (cur ? "is-current" : "") + '"><td>' + esc(v.sku || v.variant_id) + '</td><td>' + esc(priceText(v)) + '</td><td>' + esc(v.publication_status === "published" ? "● Available" : "○ Pending confirmation") + '</td></tr>';
      }).join("");
    } else {
      head = cols.map(function (d) { return "<th>" + esc(d.label || d.key) + "</th>"; }).join("") + "<th>Price</th><th>Status</th>";
      rows = variants.map(function (v) {
        var cur = v.variant_id === selected.variant_id;
        return '<tr class="' + (cur ? "is-current" : "") + '">' + cols.map(function (d) { return "<td>" + esc(joined(d.key, v) || "—") + "</td>"; }).join("") + "<td>" + esc(priceText(v)) + "</td><td>" + esc(v.publication_status === "published" ? "● Available" : "○ Pending confirmation") + "</td></tr>";
      }).join("");
    }
    var th = root.querySelector(".data-panel thead tr"); if (th) th.innerHTML = head;
    var tb = root.querySelector(".data-panel tbody"); if (tb) tb.innerHTML = rows;
    var dl = root.querySelector(".dimension-list");
    if (dl) {
      var link = dl.querySelector("a"); var aside = dl.querySelector("aside");
      dl.innerHTML = '<h3>Configuration Dimensions</h3>' + configValues().map(function (x) { return '<p><b>' + esc(x.label) + '</b><span>' + esc(x.value) + '</span></p>'; }).join("");
      if (link) dl.appendChild(link);
      if (aside) dl.appendChild(aside);
    }
    var line = root.querySelector(".data-panel .selection-line");
    if (line) line.innerHTML = '✓ &nbsp; <b>Current selection:</b> ' + selValues().map(function (x) { return "<span>" + esc(x) + "</span>"; }).join(" / ");
  }
  function renderMasterSpecs() {
    var groups = (detail.spec_groups || []).slice(0, 4);
    var cards = root.querySelector(".spec-cards");
    if (cards) cards.innerHTML = groups.length ? groups.map(function (g) {
      return '<article><h3>' + esc(String(g.label).toUpperCase()) + '</h3><p class="spec-table-head"><b>Parameter</b><b>Value</b></p>' + (g.rows || []).map(function (row) { return '<p>' + esc(row.label) + ' <b>' + esc(valueFor(row)) + '</b></p>'; }).join("") + '</article>';
    }).join("") : '<div class="pdp-v3-pending">Technical specification groups are pending in the shared product contract.</div>';
    var nav = root.querySelector(".spec-layout nav");
    var allGroups = (detail.spec_groups || []).slice(0, 7);
    if (nav && allGroups.length) nav.innerHTML = allGroups.map(function (g, i) { return (i ? "<span>" : "<b>") + esc(g.label) + (i ? "</span>" : "</b>"); }).join("");
    var line = root.querySelector(".spec-panel .selection-line");
    if (line) line.innerHTML = '✓ &nbsp; Current configuration: ' + selValues().map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + ' &nbsp; | &nbsp; SKU: <span data-sku>' + esc(selected.sku || "—") + '</span>';
  }
  function renderMasterInstall() {
    var rows = detail.installation && detail.installation.rows;
    var card = root.querySelector(".install-grid .info-card");
    if (card && rows && rows.length) {
      var h3 = card.querySelector("h3"); var aside = card.querySelector("aside"); var actions = card.querySelector(".install-actions");
      card.innerHTML = (h3 ? h3.outerHTML : "<h3>INSTALLATION INFORMATION</h3>") + rows.map(function (row) {
        var value = row.status === "pending" ? PENDING_TEXT : (row.from ? (joined(row.from) || PENDING_TEXT) : "—");
        return "<p>" + esc(row.label) + " <b>" + esc(value) + "</b></p>";
      }).join("") + (aside ? aside.outerHTML : "") + (actions ? actions.outerHTML : "");
    }
  }
  function renderMasterConnect() {
    var rows = detail.compatibility || [];
    var card = root.querySelector(".connect-grid .info-card");
    if (card) {
      var h3 = card.querySelector("h3"); var aside = card.querySelector("aside"); var actions = card.querySelector(".connect-actions");
      var isMechanical = record.category_page === "cat-mechanical-switches";
      card.innerHTML = (h3 ? h3.outerHTML : "<h3>CONNECTIVITY INFORMATION</h3>") + (rows.length ? rows.map(function (row) {
        var value = row.status === "pending" ? PENDING_TEXT : row.status === "not_applicable" ? "Not applicable for this mechanical product" : (row.from ? (joined(row.from, selected, row.only) || "Conditional") : row.support || "—");
        return "<p>" + esc(row.mode) + " <b>" + esc(value) + "</b></p>";
      }).join("") : '<p>Compatibility details <b>' + PENDING_TEXT + '</b></p>') + (aside ? aside.outerHTML : "") + (actions ? actions.outerHTML : "");
      if (isMechanical) card.querySelector("h3").textContent = "CONTROL & COMPATIBILITY";
    }
    var line = root.querySelector(".diagram-panel .selection-line");
    if (line) line.innerHTML = '✓ &nbsp; Current configuration: ' + selValues().map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + ' &nbsp; | &nbsp; SKU: <span data-sku>' + esc(selected.sku || "—") + '</span>';
  }
  function renderMasterFinishes() {
    /* The old screen-08 variant-row used disabled native selects and was not
       connected to the shared PDP configuration state. Remove it so every
       detail page uses the centered 85% content canvas and the hero's single
       data-driven configuration controls. */
    all(".variant-row").forEach(function (row) { row.remove(); });
    var holder = root.querySelector(".finish-options");
    var panels = root.querySelector(".panel-options");
    var isMechanical = record.category_page === "cat-mechanical-switches";
    if (isMechanical) {
      if (holder) holder.innerHTML = '<p class="pdp-v3-pending">Colour and finish options are pending source confirmation.</p>';
      if (panels) panels.innerHTML = '<p class="pdp-v3-pending">Panel material options are pending source confirmation.</p>';
      return;
    }
    if (!holder) return;
    var values = [];
    variants.forEach(function (v) { first("finish", v).forEach(function (x) { if (isReal(x) && values.indexOf(x) === -1) values.push(x); }); });
    if (!values.length) { holder.innerHTML = ""; if (panels && !heroReference) panels.innerHTML = '<p class="pdp-v3-pending">Panel options require verified product data.</p>'; return; }
    var imgs = { white: "finish-white.png", black: "finish-black.png", "matte black": "finish-black.png", grey: "finish-grey.png", gray: "finish-grey.png", "sand grey": "finish-grey.png", gold: "finish-gold.png", "champagne gold": "finish-gold.png" };
    var base = "candidates/pdp-combined-01-11/assets/pdp-08/";
    holder.innerHTML = values.map(function (value) {
      var colorValue = value === "m6-premium-gray" ? "advanced-gray" : value.replace(/^m6-/, ""); var isSel = matrixSelection.color ? matrixSelection.color === colorValue : !matrixSelection.finish && first("finish")[0] === value;
      var src = imgs[String(value).toLowerCase()] ? base + imgs[String(value).toLowerCase()] : "";
      return '<button type="button" class="' + (isSel ? "selected" : "") + '" data-master-finish="' + esc(value) + '" aria-pressed="' + isSel + '">' + (isSel ? '<i aria-hidden="true">✓</i>' : '') + (src ? '<img src="' + esc(src) + '" alt="' + esc(label("finish", value)) + ' finish" loading="lazy" decoding="async">' : '<i aria-hidden="true"></i>') + esc(label("finish", value)) + '</button>';
    }).join("");
    if (panels && !heroReference) panels.innerHTML = '<p class="pdp-v3-pending">Panel material visuals are pending product confirmation.</p>';
    all("[data-master-finish]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-master-finish");
        var colorValue=value==="m6-premium-gray"?"advanced-gray":value.replace(/^m6-/,"");if(matrixValues("color").indexOf(colorValue)!==-1){matrixSelection.color=colorValue;updateUrl();renderAll();}else{matrixSelection.finish=value;updateUrl();renderAll();}
      });
    });
  }
  function renderMasterCustom() {
    var rows = (detail.ordering && detail.ordering.rows) || [];
    var ul = root.querySelector(".custom-options ul");
    if (!ul) return;
    ul.innerHTML = rows.length ? rows.map(function (row, i) {
      var glyph = ["G", "P", "B", "D", "S"][i % 5];
      var value = row.kind === "moq" && selected.price && selected.price.moq != null ? "MOQ " + selected.price.moq : row.status === "pending" ? "To be confirmed" : row.kind === "terms" ? "Per quotation" : "By discussion";
      return '<li><i>' + esc(glyph) + '</i><span><b>' + esc(row.label) + '</b><small>Resolved from product data where verified.</small></span><em>' + esc(value) + '</em><strong>›</strong></li>';
    }).join("") : '<li><span><b>Customization options</b><small>Pending product data.</small></span></li>';
    var line = root.querySelector(".custom-selection");
    if (line) line.innerHTML = 'ⓘ &nbsp; <b>Current configuration:</b>' + selValues().map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + '<i></i><small>SKU: <span data-sku>' + esc(selected.sku || "—") + '</span></small>';
  }
  function relatedCardHtml(o) {
    return '<article class="related-card" data-group="' + esc(o.group) + '" data-model="' + esc(o.model) + '" data-variant="' + esc(o.variantId) + '"' + (o.group !== "same" ? " hidden" : "") + '><img class="related-media" src="' + esc(o.img) + '" alt="' + esc(o.name) + '" loading="lazy" decoding="async"><small>' + esc(record.family_label || "") + '</small><h3>' + esc(o.name) + '</h3><p>' + esc(o.blurb || "") + '</p><b>' + esc(o.price) + '</b><div class="related-actions"><a class="blue-btn" href="' + esc(record.family_page || "products.html") + '">View Products&nbsp; →</a><a class="outline-btn" href="#screen-11">▤ &nbsp; Add to Quote</a></div></article>';
  }
  function renderMasterRelated() {
    var grid = root.querySelector(".related-grid");
    if (grid) {
      var cards = variants.slice(0, 8).map(function (v) {
        return relatedCardHtml({ group: "same", model: record.model_id, variantId: v.variant_id, name: v.sku || v.variant_id, blurb: record.name, img: imgSrc(v), price: priceText(v) });
      });
      var others = (SSOT.list || []).filter(function (x) { return x.category_page === record.category_page && x.model_id !== record.model_id && SSOT.byModel[x.model_id] && SSOT.byModel[x.model_id].catalogue_visible; }).slice(0, 8);
      others.forEach(function (x) {
        var other = SSOT.byModel[x.model_id];
        var ov = other.variants.find(function (v) { return v.variant_id === other.public_primary_variant; }) || other.variants[0];
        cards.push(relatedCardHtml({ group: "alt", model: x.model_id, variantId: ov ? ov.variant_id : "", name: x.name, blurb: other.series ? other.series + " series" : "", img: ov ? imgSrc(ov) : "assets/images/placeholders/product-switch-a.svg", price: ov ? priceText(ov) : "Price on request" }));
      });
      cards.push('<article class="related-card" data-group="ctrl" hidden><div class="pdp-v3-pending">Related controls will be listed once control-product data is linked.</div></article>');
      cards.push('<article class="related-card" data-group="acc" hidden><div class="pdp-v3-pending">Matching accessories will be listed once accessory data is linked.</div></article>');
      grid.innerHTML = cards.join("");
    }
    var allLink = root.querySelector(".related-all");
    if (allLink) { allLink.href = record.family_page || "products.html"; allLink.textContent = "View All " + (record.family_label || "Products") + "\u00a0 →"; }
  }
  function renderMasterQuote() {
    setText("#screen-11 .screen-lead", currentIsPublic() ? "Review the selected SKU and quantity, then add it to your quote list." : "Review your requested options below. Availability and pricing require confirmation before a final SKU can be quoted.");
    var box = root.querySelector(".quote-product");
    if (box) {
      var img = box.querySelector("img"); if (img) { img.src = imgSrc(selected); img.alt = record.name || "Selected product"; }
      var nameP = box.querySelector("h3 + p"); if (nameP) nameP.textContent = record.name || "";
      var table = box.querySelector("table");
      if (table) {
        var rows = configValues().map(function (x) { return "<tr><th>" + esc(x.label) + "</th><td>" + esc(x.value) + "</td></tr>"; });
        Object.keys(matrixSelection).forEach(function (key) { rows.push("<tr><th>" + esc(key === "color" ? "Color" : key === "finish" ? "Finish" : "Material") + "</th><td>" + esc(label(key, matrixSelection[key])) + "</td></tr>"); });
        rows.push("<tr><th>" + (hasMatrixSelection() ? "Base SKU" : "SKU") + "</th><td>" + esc(selected.sku || "—") + "</td></tr>");
        rows.push("<tr><th>Reference Price</th><td>" + esc(priceText(selected)) + "</td></tr>");
        table.innerHTML = rows.join("");
      }
      var tags = box.querySelector(".quote-tags");
      if (tags) tags.innerHTML = selValues().map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
    }
    var ready = root.querySelector(".ready-box strong"); if (ready) ready.textContent = hasMatrixSelection() ? 'Base model: ' + (selected.sku || record.name) : selected.sku || "—";
    var readyTitle = root.querySelector('.ready-box b'); if(readyTitle) readyTitle.textContent = currentIsPublic() ? 'Configuration ready' : 'Configuration requires confirmation';
    var readyIcon = root.querySelector('.ready-box i'); if(readyIcon) readyIcon.textContent = currentIsPublic() ? '✓' : 'ⓘ';
    var requestCopy = root.querySelector('.quote-request h3 + p'); if(requestCopy) requestCopy.textContent = currentIsPublic() ? 'Add this published SKU and quantity to your quote list.' : 'These requested options are not yet mapped to a confirmed SKU. Contact us to confirm availability, pricing and samples.';
    var optionNote = root.querySelector('[data-option-confirmation-note]');
    if(!optionNote){optionNote=document.createElement('p');optionNote.dataset.optionConfirmationNote='';root.querySelector('.hero-actions')?.before(optionNote);}
    optionNote.textContent = 'Standard configurations can be added to your quote list. Material, finish and color options require confirmation unless mapped to a published SKU.';
    var readySmall = root.querySelector(".ready-box small");
    if (readySmall) readySmall.textContent = currentIsPublic() ? "Exact variant resolved from product data" : "Requested options — availability and price to be confirmed";
    all('.hero-actions a.blue-btn, .quote-request a.blue-btn').forEach(function(a){a.textContent=currentIsPublic()?'Add to Quote →':'Confirm Configuration →';a.removeAttribute('aria-disabled');a.removeAttribute('tabindex');a.classList.remove('is-disabled');if(currentIsPublic())a.href=location.pathname+'#screen-11';if(!currentIsPublic() && a.closest('.quote-request'))a.href='/request-a-quote.html?model='+encodeURIComponent(record.model_id)+'&configuration='+encodeURIComponent(configSummary())+'&quantity='+encodeURIComponent(readQty());});
    var snap = root.querySelector(".variant-snapshot");
    if (snap) snap.innerHTML = "<b>Selected variant snapshot:</b> " + esc(record.model_id) + " &nbsp;•&nbsp; " + esc(selected.variant_id) + " &nbsp;•&nbsp; SKU " + esc(selected.sku || "—") + " &nbsp;•&nbsp; " + esc(configSummary() || "attributes pending") + " &nbsp;•&nbsp; Qty " + esc(readQty()) + " &nbsp;•&nbsp; " + esc(priceText(selected));
    var rfqLink = root.querySelector(".quote-request a.quote-link");
    if (rfqLink) rfqLink.href = "request-a-quote.html?model=" + encodeURIComponent(record.model_id) + "&variant=" + encodeURIComponent(selected.variant_id);
    var viewList = root.querySelector(".quote-request a.outline-btn"); if (viewList) viewList.href = "quote-list.html";
    var qlabel = root.querySelector(".quote-request label");
    if (qlabel && !qlabel.classList.contains("quantity-control")) {
      qlabel.classList.add("quantity-control");
      qlabel.innerHTML = '<span>Quantity</span><button type="button" aria-label="Decrease quantity">−</button><input type="number" value="' + qty + '" min="1" step="1" aria-label="Quantity"><button type="button" aria-label="Increase quantity">+</button>';
    }
  }
  function renderPlaceholderMedia() {
    var set = function (selector, src, description) {
      all(selector).forEach(function (node) {
        node.src = src;
        node.alt = record.name + " — " + description;
      });
    };
    set(".feature-media", "assets/images/placeholders/pdp-feature.svg", "product highlight image placeholder");
    set(".drawing-panel img", "assets/images/placeholders/pdp-dimension.svg", "dimension drawing placeholder");
    set(".diagram-panel img", "assets/images/placeholders/pdp-connectivity.svg", "connectivity diagram placeholder");
    set(".finish-options img", "assets/images/placeholders/pdp-finish.svg", "finish and colour reference placeholder");
    set(".panel-options img", "assets/images/placeholders/pdp-panel.svg", "panel material reference placeholder");
    set(".finish-visual img", "assets/images/placeholders/pdp-installed.svg", "installed finish reference placeholder");
    set(".custom-preview > img", "assets/images/placeholders/pdp-customization.svg", "customization reference placeholder");
    set(".related-grid .related-media", "assets/images/placeholders/pdp-related.svg", "related product image placeholder");
    set(".quote-product > img", "assets/images/placeholders/pdp-quote.svg", "selected product image placeholder");
  }
  function renderMasterGallery() {
    var grid = root.querySelector(".gallery-grid"); if (!grid) return;
    /* Keep the gallery deterministic during catalogue intake. Even if a source
       record carries a candidate/verified view, the public PDP uses the first
       category image plus labelled placeholders for all detail views. */
    var fallbackViews = [
      { src: categoryImage() || imgSrc(selected), title: "Front panel", alt: record.name + " — category product image" },
      { src: "assets/images/placeholders/pdp-detail.svg", title: "Surface detail", alt: record.name + " — surface detail placeholder" },
      { src: "assets/images/placeholders/pdp-side.svg", title: "Side profile", alt: record.name + " — side profile placeholder" },
      { src: "assets/images/placeholders/pdp-back.svg", title: "Rear structure", alt: record.name + " — rear structure placeholder" },
      { src: "assets/images/placeholders/pdp-installed.svg", title: "Installed view", alt: record.name + " — installed view placeholder" }
    ];
    all(".gallery-grid figure").forEach(function (figure, index) {
      var view = fallbackViews[index] || fallbackViews[0];
      var im = figure.querySelector("img");
      var title = figure.querySelector("figcaption b");
      var cap = figure.querySelector("figcaption span");
      if (im) { im.src = view.src; im.alt = view.alt; }
      if (title) title.textContent = view.title;
      if (cap) cap.textContent = index ? "Placeholder — verified product photography pending." : "Category image — detailed product photography pending.";
    });
  }
  function bindMasterQty() {
    all(".quantity-control input").forEach(function (input) {
      if (input.hasAttribute("data-pdp-quantity")) return;
      input.setAttribute("data-pdp-quantity", "");
      input.addEventListener("input", function (e) { updateQty(e.target.value); refreshSnapshot(); });
    });
    all(".quantity-control button").forEach(function (btn) {
      if (btn.hasAttribute("data-master-qty")) return;
      btn.setAttribute("data-master-qty", "");
      var dir = btn.getAttribute("aria-label") === "Increase quantity" ? 1 : -1;
      btn.addEventListener("click", function () { updateQty(qty + dir); refreshSnapshot(); });
    });
  }
  function refreshSnapshot() {
    var snap = root.querySelector(".variant-snapshot");
    if (snap) snap.innerHTML = "<b>Selected variant snapshot:</b> " + esc(record.model_id) + " &nbsp;•&nbsp; " + esc(selected.variant_id) + " &nbsp;•&nbsp; SKU " + esc(selected.sku || "—") + " &nbsp;•&nbsp; " + esc(configSummary() || "attributes pending") + " &nbsp;•&nbsp; Qty " + esc(readQty()) + " &nbsp;•&nbsp; " + esc(priceText(selected));
  }
  function renderMaster() {
    if (!root.querySelector("#title-01")) return;
    renderMasterHero();
    renderMasterChips();
    renderMasterConfig();
    renderMasterSpecs();
    renderMasterInstall();
    renderMasterConnect();
    renderMasterFinishes();
    renderMasterCustom();
    renderMasterRelated();
    renderMasterQuote();
    renderMasterGallery();
    setText("[data-sku]", selected.sku || "—");
    bindMasterQty();
    renderPlaceholderMedia();
  }
  function assignSectionIds() { all(".pdp-v3-section").forEach(function (section, index) { section.id = "screen-" + String(index + 1).padStart(2, "0"); }); }
  function updateQty(next) { qty = Math.max(1, Math.min(999999, Math.floor(Number(next)) || 1)); all("[data-pdp-quantity]").forEach(function (input) { input.value = qty; }); renderMasterQuote(); }
  root.addEventListener('click', function(event) {
    var link=event.target.closest('[data-pdp-add], [data-pdp-add-final], .hero-actions a.blue-btn, .quote-request a.blue-btn');
    if(!link) return;
    if(!currentIsPublic() && link.closest('.quote-request')) return;
    event.preventDefault();
    // This handler owns current-product additions. The legacy document bridge
    // otherwise handles the same click again and doubles the requested quantity.
    event.stopPropagation();
    if(!currentIsPublic()){var inquiry=root.querySelector('#screen-11');if(inquiry){inquiry.scrollIntoView({behavior:'smooth'});history.replaceState(null,'',location.pathname+'#screen-11');}return;}
    if(addToQuote()) { if(window.QuoteDrawer && window.QuoteDrawer.open) window.QuoteDrawer.open(); }
  });
  function quoteAttributes(variant) {
    var attrs=Object.assign({}, (variant || selected).attributes || (variant || selected).attrs || {});
    if(Array.isArray(attrs.finish) && attrs.finish.length>1){attrs.available_finish=attrs.finish.slice();delete attrs.finish;attrs.finish_confirmation=["required"];}
    return attrs;
  }
  function addToQuote() { if (!currentIsPublic()) { setText("[data-pdp-status]", "This configuration is not published for quotation yet."); return false; } if (!window.QuoteCart) return false; window.QuoteCart.addLine({ model: record.model_id, variant_id: selected.variant_id, qty: qty, attrs: quoteAttributes() }); if (window.QuoteDrawer) window.QuoteDrawer.notifyAdded(record.name + " · " + selected.sku); setText("[data-pdp-status]", "Added to Quote List."); return true; }
  function renderAll() { assignSectionIds(); setText("[data-pdp-name]", record.name || "Product"); setText("[data-pdp-family]", record.family_label || "PRODUCT"); setText("[data-pdp-breadcrumb]", selected.sku || record.name); setText("[data-pdp-summary]", record.summary || ""); updateSelection(); renderVariants(); renderHeroViews(); renderFeatures(); renderGallery(); renderDimensions(); renderConfigTable(); renderSpecs(); renderInstall(); renderCompatibility(); renderFinishes(); renderCustomization(); renderRfqData(); renderNextSteps(); renderMaster(); }
  all("[data-pdp-qty]").forEach(function (button) { button.addEventListener("click", function () { updateQty(qty + Number(button.getAttribute("data-pdp-qty"))); }); });
  all("[data-pdp-quantity]").forEach(function (input) { input.addEventListener("input", function (e) { updateQty(e.target.value); }); });
  renderAll();
  /* Cart-block bridge: the inline cart script in product-detail-v3.html delegates here.
     currentLine() = the selected variant of THIS page; addCardLine() = a related/alt card
     (resolved by data-model + data-variant, other models via SSOT.byModel). */
  window.Z02_PDP_V3 = {
    currentLine: function () { return { model: record.model_id, variant_id: selected.variant_id, qty: readQty(), attrs: quoteAttributes(), sku: selected.sku }; },
    addCardLine: function (cardEl, button) {
      if (!window.QuoteCart) return;
      var card = cardEl || (button && button.closest("[data-model]"));
      if (!card) return;
      var model = card.getAttribute("data-model") || record.model_id;
      var rec = model === record.model_id ? record : (SSOT && SSOT.byModel ? SSOT.byModel[model] : null);
      if (!rec) return;
      var vid = card.getAttribute("data-variant") || "";
      var pool = rec === record ? variants : ((rec.public_variants && rec.public_variants.length ? rec.public_variants : rec.variants) || []);
      var v = pool.find(function (x) { return x.variant_id === vid; }) || pool[0];
      /* 诚实拒绝：未发布的 variant 不进询价单，但必须说话（memory 坑 18），不能静默 return。 */
      if (!v || v.publication_status !== "published") {
        if (window.QuoteDrawer && window.QuoteDrawer.toast) window.QuoteDrawer.toast("This configuration is pending publication — quotation opens once the source is confirmed.");
        return;
      }
      var lineQty = 1;
      var qtyInput = card.querySelector("input[type=number]");
      if (qtyInput) lineQty = Math.max(1, Number.parseInt(qtyInput.value, 10) || 1);
      window.QuoteCart.addLine({ model: rec.model_id, variant_id: v.variant_id, qty: lineQty, attrs: quoteAttributes(v) });
      if (window.QuoteDrawer) window.QuoteDrawer.notifyAdded((rec.name || rec.model_id) + " · " + (v.sku || v.variant_id));
      if (button) { var original = button.textContent; button.textContent = "Added ✓"; setTimeout(function () { button.textContent = original; }, 1600); }
    },
    addCurrent: function (button) { var ok = addToQuote(); if (ok && button) { var original = button.textContent; button.textContent = "Added ✓"; setTimeout(function () { button.textContent = original; }, 1600); } }
  };
})();
