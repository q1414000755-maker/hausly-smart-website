/* Homepage prototype interactions. */
(() => {
  const main = document.querySelector("[data-home]");
  if (!main) return;

  /* Approved V2 Featured Products migration. This deliberately replaces only
     the legacy Section 03 shelf; all other homepage sections retain their
     original DOM and interactions. */
  const featuredSection = main.querySelector(".home-featured");
  if (featuredSection) {
    featuredSection.classList.add("home-featured--v2");
    if (!document.body.hasAttribute('data-studio-prerendered')) featuredSection.innerHTML = "<div class=\"home-canvas home-featured-v2__canvas\"><header class=\"home-featured-v2__head\"><p class=\"eyebrow\">FEATURED PRODUCTS</p><h2 id=\"featured-title\">Products Worth Exploring</h2><p>Selected smart control products for modern spaces. Explore the models, review reference pricing and build your quote list.</p></header><div class=\"home-featured-v2__primary\"><article data-home-product=\"src03-m12s\" class=\"home-featured-v2__hero-card\" style=\"background-image:url('assets/images/products/smart-switches/m12s/m12s-plp-main.png')\"><div class=\"home-featured-v2__hero-copy\"><span>Featured</span><h3>M12/S Smart Switch</h3><small>M12/S Series</small><i></i><p>Touch control for lighting and room scenes.</p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-m12s/index.html\" aria-label=\"View M12/S Smart Switch\">View Product</a><button type=\"button\" data-home-quote=\"src03-m12s\" data-home-model=\"src03-m12s\" aria-label=\"Add M12/S Smart Switch to quote\" aria-pressed=\"false\">Add to Quote</button></div></div><img src=\"assets/images/products/smart-switches/m12s/m12s-plp-main.png\" alt=\"M12/S Smart Switch\" loading=\"lazy\" decoding=\"async\"></article>\n<article data-home-product=\"src03-m10-glass\" class=\"home-featured-v2__hero-card\" style=\"background-image:url('assets/images/products/smart-switches/m10-glass/m10-glass-plp-main.png')\"><div class=\"home-featured-v2__hero-copy\"><span>Featured</span><h3>M10 Smart Switch</h3><small>M10 Glass Series</small><i></i><p>Glass finishes for a coordinated switch range.</p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-m10-glass/index.html\" aria-label=\"View M10 Smart Switch\">View Product</a><button type=\"button\" data-home-quote=\"src03-m10-glass\" data-home-model=\"src03-m10-glass\" aria-label=\"Add M10 Smart Switch to quote\" aria-pressed=\"false\">Add to Quote</button></div></div><img src=\"assets/images/products/smart-switches/m10-glass/m10-glass-plp-main.png\" alt=\"M10 Smart Switch\" loading=\"lazy\" decoding=\"async\"></article></div><div class=\"home-products-carousel\" aria-roledescription=\"carousel\" aria-label=\"Featured products\"><button class=\"home-products-arrow home-products-prev\" type=\"button\" aria-label=\"Previous products\">‹</button><div id=\"home-products-track\" class=\"home-featured-v2__grid\" tabindex=\"0\" aria-label=\"Scrollable product list\"><article data-home-product=\"src03-half-screen-thermostat\"><span class=\"hf-white-media hf-white-media--generated\"><img src=\"assets/images/home-featured-white-20261013/src03-half-screen-thermostat.webp\" alt=\"Half Screen Thermostat\" loading=\"lazy\" decoding=\"async\" width=\"640\" height=\"640\"></span><h3>Half Screen Thermostat</h3><small>Thermostats</small><p class=\"home-product-spec\"><b class=\"is-zigbee\">Zigbee</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-half-screen-thermostat/index.html\" aria-label=\"View Half Screen Thermostat\">View Product</a><button type=\"button\" data-home-quote=\"src03-half-screen-thermostat\" data-home-model=\"src03-half-screen-thermostat\" data-home-v2-icon-quote=\"true\" aria-label=\"Add Half Screen Thermostat to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src03-z5\"><span class=\"hf-white-media\"><img src=\"assets/images/products/smart-switches/z5/z5-plp-main.png\" alt=\"Z5 Smart Switch\" loading=\"lazy\" decoding=\"async\" width=\"1600\" height=\"1200\"></span><h3>Z5 Smart Switch</h3><small>Z5 Series</small><p class=\"home-product-spec\"><b class=\"is-zigbee\">Zigbee</b><b class=\"is-bluetooth\">Bluetooth Mesh</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-z5/index.html\" aria-label=\"View Z5 Smart Switch\">View Product</a><button type=\"button\" data-home-quote=\"src03-z5\" data-home-model=\"src03-z5\" data-home-v2-icon-quote=\"true\" aria-label=\"Add Z5 Smart Switch to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src01-controller-modules\"><span class=\"hf-white-media hf-white-media--generated\"><img src=\"assets/images/home-featured-white-20261013/src01-controller-modules.webp\" alt=\"DIN-Rail Smart Controller Modules\" loading=\"lazy\" decoding=\"async\" width=\"640\" height=\"640\"></span><h3>DIN-Rail Controller Modules</h3><small>Controllers &amp; Gateways</small><p class=\"home-product-spec\"><b class=\"is-rs485\">RS485</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src01-controller-modules/index.html\" aria-label=\"View DIN-Rail Smart Controller Modules\">View Product</a><button type=\"button\" data-home-quote=\"src01-controller-modules\" data-home-model=\"src01-controller-modules\" data-home-v2-icon-quote=\"true\" aria-label=\"Add DIN-Rail Smart Controller Modules to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src03-human-body-sensor\"><span class=\"hf-white-media hf-white-media--generated\"><img src=\"assets/images/home-featured-white-20261013/src03-human-body-sensor.webp\" alt=\"Human Body Sensor\" loading=\"lazy\" decoding=\"async\" width=\"640\" height=\"640\"></span><h3>Human Body Sensor</h3><small>Sensors</small><p class=\"home-product-spec\"><b class=\"is-bluetooth\">Bluetooth Mesh</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-human-body-sensor/index.html\" aria-label=\"View Human Body Sensor\">View Product</a><button type=\"button\" data-home-quote=\"src03-human-body-sensor\" data-home-model=\"src03-human-body-sensor\" data-home-v2-icon-quote=\"true\" aria-label=\"Add Human Body Sensor to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src03-z6\"><span class=\"hf-white-media\"><img src=\"assets/images/products/smart-switches/z6/z6-plp-main.png\" alt=\"Z6 Smart Switch\" loading=\"lazy\" decoding=\"async\" width=\"1600\" height=\"1200\"></span><h3>Z6 Smart Switch</h3><small>Z6 Series</small><p class=\"home-product-spec\"><b class=\"is-zigbee\">Zigbee</b><b class=\"is-bluetooth\">Bluetooth Mesh</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-z6/index.html\" aria-label=\"View Z6 Smart Switch\">View Product</a><button type=\"button\" data-home-quote=\"src03-z6\" data-home-model=\"src03-z6\" data-home-v2-icon-quote=\"true\" aria-label=\"Add Z6 Smart Switch to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src01-hotel-door-locks\"><span class=\"hf-white-media hf-white-media--generated\"><img src=\"assets/images/home-featured-white-20261013/src01-hotel-door-locks.webp\" alt=\"Hotel Custom Door Lock Collection\" loading=\"lazy\" decoding=\"async\" width=\"640\" height=\"640\"></span><h3>Hotel Door Lock Collection</h3><small>Smart Door Locks</small><p class=\"home-product-spec\"><b>Card Access</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src01-hotel-door-locks/index.html\" aria-label=\"View Hotel Custom Door Lock Collection\">View Product</a><button type=\"button\" data-home-quote=\"src01-hotel-door-locks\" data-home-model=\"src01-hotel-door-locks\" data-home-v2-icon-quote=\"true\" aria-label=\"Add Hotel Custom Door Lock Collection to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src03-m6\"><span class=\"hf-white-media\"><img src=\"assets/images/products/smart-switches/m6/m6-plp-main.png\" alt=\"M6 Smart Switch\" loading=\"lazy\" decoding=\"async\" width=\"1600\" height=\"1200\"></span><h3>M6 Smart Switch</h3><small>M6 Series</small><p class=\"home-product-spec\"><b class=\"is-zigbee\">Zigbee</b><b class=\"is-bluetooth\">Bluetooth Mesh</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-m6/index.html\" aria-label=\"View M6 Smart Switch\">View Product</a><button type=\"button\" data-home-quote=\"src03-m6\" data-home-model=\"src03-m6\" data-home-v2-icon-quote=\"true\" aria-label=\"Add M6 Smart Switch to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src01-smart-curtain-motors\"><span class=\"hf-white-media hf-white-media--generated\"><img src=\"assets/images/home-featured-white-20261013/src01-smart-curtain-motors.webp\" alt=\"Smart Curtain Motors\" loading=\"lazy\" decoding=\"async\" width=\"640\" height=\"640\"></span><h3>Smart Curtain Motors</h3><small>Smart Curtains</small><p class=\"home-product-spec\"><b>Smart Curtains</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src01-smart-curtain-motors/index.html\" aria-label=\"View Smart Curtain Motors\">View Product</a><button type=\"button\" data-home-quote=\"src01-smart-curtain-motors\" data-home-model=\"src01-smart-curtain-motors\" data-home-v2-icon-quote=\"true\" aria-label=\"Add Smart Curtain Motors to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src03-door-window-sensor\"><span class=\"hf-white-media hf-white-media--generated\"><img src=\"assets/images/home-featured-white-20261013/src03-door-window-sensor.webp\" alt=\"Door &amp; Window Sensor\" loading=\"lazy\" decoding=\"async\" width=\"640\" height=\"640\"></span><h3>Door &amp; Window Sensor</h3><small>Sensors</small><p class=\"home-product-spec\"><b class=\"is-bluetooth\">Bluetooth Mesh</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-door-window-sensor/index.html\" aria-label=\"View Door &amp; Window Sensor\">View Product</a><button type=\"button\" data-home-quote=\"src03-door-window-sensor\" data-home-model=\"src03-door-window-sensor\" data-home-v2-icon-quote=\"true\" aria-label=\"Add Door &amp; Window Sensor to quote\" aria-pressed=\"false\">⌑</button></div></article>\n<article data-home-product=\"src03-knob-screen\"><span class=\"hf-white-media hf-white-media--generated\"><img src=\"assets/images/home-featured-white-20261013/src03-knob-screen.webp\" alt=\"Dimming &amp; Temperature-Control Knob Screen\" loading=\"lazy\" decoding=\"async\" width=\"640\" height=\"640\"></span><h3>Knob Control Screen</h3><small>Thermostats</small><p class=\"home-product-spec\"><b class=\"is-zigbee\">Zigbee</b></p><strong data-home-price>USD 8.80</strong><span class=\"home-price-note\">Reference price / unit</span><div><a href=\"products/src03-knob-screen/index.html\" aria-label=\"View Dimming &amp; Temperature-Control Knob Screen\">View Product</a><button type=\"button\" data-home-quote=\"src03-knob-screen\" data-home-model=\"src03-knob-screen\" data-home-v2-icon-quote=\"true\" aria-label=\"Add Dimming &amp; Temperature-Control Knob Screen to quote\" aria-pressed=\"false\">⌑</button></div></article></div><button class=\"home-products-arrow home-products-next\" type=\"button\" aria-label=\"Next products\">›</button><div class=\"home-products-dots\" aria-label=\"Product pages\"></div><span class=\"home-products-status\" aria-live=\"polite\"></span></div></div>";
    featuredSection.querySelectorAll(".home-featured-v2__grid [data-home-quote]").forEach((button) => {
      button.dataset.homeV2IconQuote = "true";
    });
  }

  /* Approved V2 OEM / ODM migration. This replaces only the former
     Dealers & Distributors section and intentionally uses the locked,
     880px V2 background asset. */
  const partnersSection = main.querySelector(".home-partners");
  if (partnersSection) {
    partnersSection.classList.add("home-oem-odm-v2");
    if (!document.body.hasAttribute('data-studio-prerendered')) partnersSection.innerHTML = `
      <div class="home-oem-odm-v2__backdrop" aria-hidden="true"></div>
      <div class="home-canvas home-oem-odm-v2__canvas">
        <header class="home-oem-odm-v2__head">
          <p>OEM / ODM</p>
          <h2 id="partners-title">Make the Product Yours</h2>
          <span>Customize selected products with finishes, branding, packaging and project-specific configurations.</span>
        </header>
        <section class="home-oem-odm-v2__finish" aria-label="Finish options">
          <h3><b>01</b> Finish</h3>
          <div class="home-oem-odm-v2__finish-list"><span class="is-active"><i></i>Glass</span><span class="is-metal"><i></i>Metal</span><span class="is-matte"><i></i>Matte</span><span class="is-stone"><i></i>Stone</span></div>
          <p>Premium materials for distinctive spaces.</p>
        </section>
        <section class="home-oem-odm-v2__colour" aria-label="Colour options">
          <h3><b>02</b> Color</h3>
          <div><span><i class="is-white"></i>White</span><span class="is-active"><i class="is-black"></i>Black</span><span><i class="is-champagne"></i>Champagne</span><span><i class="is-grey"></i>Grey</span></div>
          <p>A range of refined colors to match your project style.</p>
        </section>
        <section class="home-oem-odm-v2__brand">
          <h3><b>03</b> Branding</h3>
          <div><em>YOUR BRAND</em><p>Your brand,<br>beautifully presented.</p></div>
        </section>
        <section class="home-oem-odm-v2__interface">
          <h3><b>04</b> UI / Configuration</h3>
          <div><ul><li>☼ <span>Lighting</span><b>›</b></li><li>✳ <span>Climate</span><b>›</b></li><li>⌂ <span>Scenes</span><b>›</b></li><li>▣ <span>More Options</span><b>›</b></li></ul><p>Tailor the interface and functions for your project (requirement varies by model).</p></div>
        </section>
        <section class="home-oem-odm-v2__packaging">
          <h3><b>05</b> Packaging &amp; Documentation</h3>
          <p>Branded packaging and documentation to complete your product experience.</p>
        </section>
        <div class="home-oem-odm-v2__actions">
          <a class="button dark" href="oem/product-customization.html">Explore OEM Customization <b aria-hidden="true">→</b></a>
          <p>Looking for a specific platform or protocol? <a href="resources.html">Check Compatibility →</a></p>
          <small>Customization availability varies by product and project.</small>
        </div>
      </div>`;
  }

  /* 加购统一走 QuoteCart（assets/js/quote-cart.js）—— 不再自建 localStorage。
     首页只向存储里写 **model_id**，名称 / 图 / 价格一概不存：那些是 SSOT 的事，
     存了就会过期。「禁止手写价格」同样适用于 localStorage。 */
  const CART = window.QuoteCart;
  const CATALOG = window.Z02_CATALOG;
  const validModel = (model) => Boolean(model && CATALOG && CATALOG.validIds.includes(model) && CATALOG.models[model]);

  /* Prices and product identity stay aligned with the catalogue. Unknown IDs
     cannot be added, even if an older exported card reaches this handler. */
  main.querySelectorAll('[data-home-product]').forEach((card) => {
    const model = card.querySelector('[data-home-quote]')?.dataset.homeModel;
    const priceNode = card.querySelector('[data-home-price]');
    if (!priceNode) return;
    const price = validModel(model) ? CATALOG.models[model].price : null;
    priceNode.textContent = price?.status === 'confirmed' && Number.isFinite(price.amount)
      ? (price.currency || 'USD') + ' ' + price.amount.toFixed(2)
      : 'Request pricing';
  });

  /* model_id → 卡片快照（只在首页渲染预览条用；清单本体以 QuoteCart 为准） */
  const cardByModel = new Map();
  main.querySelectorAll("[data-home-product]").forEach((card) => {
    const button = card.querySelector("[data-home-quote]");
    const model = button && button.dataset.homeModel;
    if (!validModel(model)) return;
    cardByModel.set(model, {
      model,
      name: card.querySelector("h3")?.textContent.trim() || "Product",
      detail: card.querySelector(".home-product-spec")?.textContent.trim() || "",
      image: card.querySelector("img")?.getAttribute("src") || "",
    });
  });

  const syncButtons = () => {
    main.querySelectorAll("[data-home-quote]").forEach((button) => {
      const model = button.dataset.homeModel;
      const valid = validModel(model);
      const added = Boolean(valid && CART && CART.hasModel(model));
      const name = valid ? CATALOG.models[model].name : button.closest('[data-home-product]')?.querySelector('h3')?.textContent.trim() || 'Product';
      button.disabled = !valid;
      button.setAttribute('aria-label', valid ? (added ? 'Remove ' + name + ' from quote' : 'Add ' + name + ' to quote') : name + ' unavailable for quote');
      button.title = valid ? (added ? 'Remove from quote list' : 'Add to quote list') : 'Product information unavailable';
      button.setAttribute("aria-pressed", String(added));
      button.textContent = button.dataset.homeV2IconQuote === "true"
        ? "⌑"
        : (added ? "In Quote List" : "Add to Quote");
    });
  };

  const renderQuote = () => {
    const items = (CART ? CART.lines() : [])
      .map((entry) => cardByModel.get(entry.model))
      .filter(Boolean);
    const count = `${items.length} ${items.length === 1 ? "item" : "items"}`;
    const bar = main.querySelector("[data-home-quote-bar]");
    const names = main.querySelector("[data-home-quote-names]");

    main.querySelectorAll("[data-home-quote-count]").forEach((node) => {
      node.textContent = count;
    });

    if (names) {
      names.textContent = items.length
        ? items.map((item) => item.name).join(" · ")
        : "";
    }
    if (bar) bar.hidden = items.length === 0;

    const content = items.length
      ? items
          .map(
            (item) =>
              `<div class="home-quote-item"><img src="${item.image}" alt=""><div><strong>${item.name}</strong><span>${item.detail}</span></div></div>`
          )
          .join("")
      : '<p class="home-empty">No products selected yet.</p>';

    main.querySelectorAll("[data-home-quote-preview]").forEach((node) => {
      node.innerHTML = content;
    });
    main.querySelectorAll("[data-home-rfq-items]").forEach((node) => {
      node.innerHTML = content;
    });

    syncButtons();
  };

  main.addEventListener("click", (event) => {
    const quoteButton = event.target.closest("[data-home-quote]");
    if (!quoteButton || !CART) return;
    const model = quoteButton.dataset.homeModel;
    if (!validModel(model)) return;
    const info = cardByModel.get(model);
    /* 已在清单里 → 再点一次是移除（首页卡片只有「加/不加」两态，没有数量） */
    if (CART.hasModel(model)) {
      CART.removeModel(model);
    } else {
      /* A pending list belongs to a previous session. Adding would otherwise
         discard it inside QuoteCart; leave that decision to the visitor. */
      if (CART.hasPending && CART.hasPending()) {
        const message = "Restore your previous Quote List or start a new list before adding products";
        const drawer = window.QuoteDrawer;
        if (drawer && typeof drawer.toast === "function") {
          drawer.toast(message, "View Quote List", () => {
            if (typeof drawer.open === "function") drawer.open("list");
            else window.location.href = "quote-list.html";
          });
        } else {
          let notice = main.querySelector("[data-home-pending-quote]");
          if (!notice) {
            notice = document.createElement("p");
            notice.className = "hf-pending-quote";
            notice.setAttribute("data-home-pending-quote", "");
            notice.setAttribute("role", "alert");
            const link = document.createElement("a");
            link.href = "quote-list.html";
            link.textContent = "View Quote List";
            notice.append(message + ". ", link);
            const heading = main.querySelector(".home-featured-v2__head");
            if (heading) heading.append(notice);
            else quoteButton.parentElement.append(notice);
          }
        }
        if (drawer && typeof drawer.open === "function") drawer.open("list");
        return;
      }
      CART.addLine({ model: model, qty: 1 });
      /* 刻意**不自动打开 Drawer** —— 加一个弹一次，客户会烦到不敢再加。
         只给一条轻提示 + View List 入口。 */
      if (window.QuoteDrawer) window.QuoteDrawer.notifyAdded(info ? info.name : "");
    }
    renderQuote();
  });

  renderQuote();
  /* 其它页面 / 其它标签页改了清单，首页按钮态与预览条也要跟上 */
  if (CART) CART.subscribe(renderQuote);

  /* Featured shelf — horizontal peek scroll (no autoplay) */
  const featuredShelf = main.querySelector("[data-home-featured]");
  if (featuredShelf) {
    const track = featuredShelf.querySelector("[data-featured-track]");
    const prev = featuredShelf.querySelector("[data-featured-prev]");
    const next = featuredShelf.querySelector("[data-featured-next]");

    const updateFeaturedNav = () => {
      if (!track) return;
      const max = track.scrollWidth - track.clientWidth;
      const canPrev = track.scrollLeft > 4;
      const canNext = track.scrollLeft < max - 4;
      featuredShelf.dataset.canPrev = String(canPrev);
      featuredShelf.dataset.canNext = String(canNext);
      if (prev) prev.hidden = !canPrev;
      if (next) next.hidden = !canNext;
    };

    const step = () => {
      const card = track?.querySelector(".home-product-card");
      if (!card || !track) return track?.clientWidth * 0.8 || 320;
      const styles = getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 18;
      return card.getBoundingClientRect().width + gap;
    };

    prev?.addEventListener("click", () => {
      track?.scrollBy({ left: -step(), behavior: "smooth" });
    });
    next?.addEventListener("click", () => {
      track?.scrollBy({ left: step(), behavior: "smooth" });
    });

    track?.addEventListener("scroll", updateFeaturedNav, { passive: true });
    window.addEventListener("resize", updateFeaturedNav);

    if (track) {
      let pointerId = null;
      let startX = 0;
      let startLeft = 0;
      let moved = false;

      track.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (event.target.closest("a, button")) return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startLeft = track.scrollLeft;
        moved = false;
        track.classList.add("is-dragging");
        track.setPointerCapture(pointerId);
      });

      track.addEventListener("pointermove", (event) => {
        if (pointerId !== event.pointerId) return;
        const delta = event.clientX - startX;
        if (Math.abs(delta) > 4) moved = true;
        track.scrollLeft = startLeft - delta;
      });

      const endDrag = (event) => {
        if (pointerId !== event.pointerId) return;
        track.classList.remove("is-dragging");
        try {
          track.releasePointerCapture(pointerId);
        } catch (_) {}
        pointerId = null;
        updateFeaturedNav();
      };

      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
      track.addEventListener(
        "click",
        (event) => {
          if (!moved) return;
          event.preventDefault();
          event.stopPropagation();
          moved = false;
        },
        true
      );
    }

    updateFeaturedNav();
  }

  /* Product Finder — Z01 catalogue filter behaviour */
  const finder = main.querySelector("[data-finder-catalog]");
  if (!finder) return;

  const groups = [...finder.querySelectorAll("[data-filter-group]")];
  const cards = [...finder.querySelectorAll("[data-finder-grid] article")];
  const count = finder.querySelector("[data-finder-count]");
  const empty = finder.querySelector("[data-finder-empty]");
  const reset = finder.querySelector("[data-finder-reset]");

  const activeValue = (group) => {
    const active = group.querySelector('[data-filter-value][aria-pressed="true"]');
    return active ? active.getAttribute("data-filter-value") : "";
  };

  const matches = (card, key, value) =>
    !value || (card.getAttribute("data-" + key) || "").indexOf(value) !== -1;

  const update = () => {
    const selected = {};
    groups.forEach((group) => {
      selected[group.getAttribute("data-filter-group")] = activeValue(group);
    });
    let visible = 0;
    cards.forEach((card) => {
      const show =
        matches(card, "product-type", selected["product-type"]) &&
        matches(card, "connectivity", selected.connectivity) &&
        matches(card, "function", selected.function);
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (count) count.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
  };

  const clear = (group) => {
    group.querySelectorAll("[data-filter-value]").forEach((button) =>
      button.setAttribute("aria-pressed", "false")
    );
  };

  groups.forEach((group) => {
    group.addEventListener("click", (event) => {
      const clearButton = event.target.closest("[data-filter-clear]");
      const choice = event.target.closest("[data-filter-value]");
      if (clearButton) {
        clear(group);
        update();
        return;
      }
      if (!choice) return;
      const wasPressed = choice.getAttribute("aria-pressed") === "true";
      clear(group);
      choice.setAttribute("aria-pressed", String(!wasPressed));
      update();
    });
  });

  if (reset) reset.addEventListener("click", () => {
    groups.forEach(clear);
    update();
  });
  update();
})();
