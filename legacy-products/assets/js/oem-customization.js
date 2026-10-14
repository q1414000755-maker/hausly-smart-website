/* OEM 定制入口页交互（2026-09-20 重建版）
   产品数据全部从 DOM data-* 读取（真源是 _data/oem/customization.json），
   本文件不再硬编码任何产品名 —— 改内容改数据文件，不动这里。 */
(() => {
  const productButtons = [...document.querySelectorAll("[data-product-name]")];
  const categoryButtons = [...document.querySelectorAll("[data-category]")];
  const contextTitle = document.querySelector("[data-product-context]");
  const contextCopy = document.querySelector("[data-product-context-copy]");
  const searchInput = document.querySelector("[data-product-search]");
  const searchButton = document.querySelector("[data-search-button]");
  const continueButton = document.querySelector("[data-continue]");
  let activeCategory = "";

  const setProduct = (button) => {
    if (!contextTitle || !contextCopy) return;
    const name = button.dataset.productName;
    const meta = button.dataset.productMeta;
    contextTitle.textContent = name;
    contextCopy.textContent = `${meta}. Start your customization request from this product.`;
    contextTitle.closest(".ocx-panel")?.classList.add("is-selected");
    continueButton?.focus({ preventScroll: true });
  };

  const filterProducts = () => {
    const query = (searchInput?.value || "").trim().toLowerCase();
    productButtons.forEach((button) => {
      const haystack = `${button.dataset.productName} ${button.dataset.productMeta} ${button.dataset.productCategory}`.toLowerCase();
      const matchText = !query || haystack.includes(query);
      const matchCategory = !activeCategory || button.dataset.productCategory === activeCategory;
      button.closest(".ocx-product").hidden = !(matchText && matchCategory);
    });
  };

  productButtons.forEach((button) => {
    button.addEventListener("click", () => setProduct(button));
  });

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      categoryButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      activeCategory = button.dataset.category || "";
      filterProducts();
    });
  });

  searchButton?.addEventListener("click", filterProducts);
  searchInput?.addEventListener("input", filterProducts);
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") filterProducts();
  });

  document.querySelectorAll("[data-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("is-active", item === tab));
    });
  });

  continueButton?.addEventListener("click", () => {
    const selected = contextTitle && contextTitle.textContent !== contextTitle.dataset.emptyText;
    if (!selected) {
      if (contextCopy) contextCopy.textContent = "Choose a product first, or start from your project requirements.";
      contextTitle?.closest(".ocx-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const href = continueButton.dataset.continueHref;
    if (href) window.location.href = href;
  });
})();
