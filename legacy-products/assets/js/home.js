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
    featuredSection.innerHTML = `
      <div class="home-canvas home-featured-v2__canvas">
        <header class="home-featured-v2__head">
          <p class="eyebrow">FEATURED PRODUCTS</p>
          <h2 id="featured-title">Products Worth Exploring</h2>
          <p>Selected smart control products for modern spaces. Get detailed information, pricing and request a quote directly.</p>
        </header>
        <div class="home-featured-v2__primary">
          <article class="home-featured-v2__hero-card" data-home-product="switch"><div class="home-featured-v2__hero-copy"><span>Featured</span><h3>Smart Touch Switch</h3><small>GSW Series</small><i></i><p>Elegant touch control for homes and hotels.</p><strong>USD 15.72</strong><div><a href="smart-switches.html">View Product</a><button type="button" data-home-quote="switch" data-home-model="gsl-s4">⌑&nbsp; Add to Quote</button></div></div><img src="assets/images/home/featured-v2-smart-touch-switch.png" alt="Smart touch switches in multiple finishes" loading="lazy" decoding="async"></article>
          <article class="home-featured-v2__hero-card" data-home-product="panel"><div class="home-featured-v2__hero-copy"><span>Featured</span><h3>Smart Control Panel</h3><small>GCP Series</small><i></i><p>Centralized control for lighting, curtains, HVAC and more.</p><strong>USD 86.00</strong><div><a href="control-panels.html">View Product</a><button type="button" data-home-quote="panel" data-home-model="gsl-cp8">⌑&nbsp; Add to Quote</button></div></div><img src="assets/images/home/featured-v2-control-panel.png" alt="Smart control panel" loading="lazy" decoding="async"></article>
        </div>
        <div class="home-featured-v2__grid">
          <article data-home-product="thermostat"><img src="assets/images/home/featured-thermostat-render-v1.png" alt="Smart thermostat" loading="lazy"><h3>Smart Thermostat</h3><small>GST Series</small><p><b class="is-wifi">Wi-Fi</b><b class="is-tuya">Tuya</b></p><strong>USD 42.00</strong><div><a href="thermostats.html">View Product</a><button type="button" data-home-quote="thermostat" data-home-model="gsl-th1">⌑</button></div></article>
          <article data-home-product="socket"><img src="assets/images/home/featured-usb-socket-render-v1.webp" alt="Smart socket" loading="lazy"><h3>Smart Socket</h3><small>GSO Series</small><p><b class="is-wifi">Wi-Fi</b><b class="is-tuya">Tuya</b></p><strong>USD 18.50</strong><div><a href="sockets.html">View Product</a><button type="button" data-home-quote="socket" data-home-model="gsl-skp1">⌑</button></div></article>
          <article data-home-product="module"><img src="assets/images/home/featured-control-module-render-v1.webp" alt="Smart controller" loading="lazy"><h3>Smart Controller</h3><small>GSC Series</small><p><b class="is-knx">KNX</b><b class="is-modbus">Modbus</b></p><strong>USD 68.00</strong><div><a href="controllers.html">View Product</a><button type="button" data-home-quote="module" data-home-model="gsl-gw6">⌑</button></div></article>
          <article data-home-product="sensor"><img src="assets/images/home/featured-presence-sensor-render-v1.webp" alt="Smart sensor" loading="lazy"><h3>Smart Sensor</h3><small>GSS Series</small><p><b class="is-zigbee">Zigbee</b><b class="is-bluetooth">Bluetooth</b></p><strong>USD 24.90</strong><div><a href="sensors.html">View Product</a><button type="button" data-home-quote="sensor" data-home-model="gsl-sn3">⌑</button></div></article>
          <article data-home-product="spotlight"><img src="assets/images/home/featured-led-spotlight-render-v1.webp" alt="Smart lighting" loading="lazy"><h3>Smart Lighting</h3><small>GSL Series</small><p><b class="is-dali">DALI</b><b class="is-zigbee">Zigbee</b></p><strong>USD 32.00</strong><div><a href="lighting.html">View Product</a><button type="button" data-home-quote="spotlight" data-home-model="gsl-lt2">⌑</button></div></article>
          <article data-home-product="lock"><img src="assets/images/home/featured-rfid-lock-render-v1.webp" alt="Smart door lock" loading="lazy"><h3>Smart Door Lock</h3><small>GSD Series</small><p><b class="is-wifi">Wi-Fi</b><b class="is-tuya">Tuya</b></p><strong>USD 78.00</strong><div><a href="smart-door-locks.html">View Product</a><button type="button" data-home-quote="lock" data-home-model="gsl-lk3">⌑</button></div></article>
        </div>
      </div>`;
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
    partnersSection.innerHTML = `
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

  /* model_id → 卡片快照（只在首页渲染预览条用；清单本体以 QuoteCart 为准） */
  const cardByModel = new Map();
  main.querySelectorAll("[data-home-product]").forEach((card) => {
    const button = card.querySelector("[data-home-quote]");
    const model = button && button.dataset.homeModel;
    if (!model) return;
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
      const added = Boolean(model && CART && CART.hasModel(model));
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
    if (!model) return;
    const info = cardByModel.get(model);
    /* 已在清单里 → 再点一次是移除（首页卡片只有「加/不加」两态，没有数量） */
    if (CART.hasModel(model)) {
      CART.removeModel(model);
    } else {
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
