/* Homepage connectivity protocol tabs. */
(() => {
  const root = document.querySelector(".home-connectivity");
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll("[data-protocol-tab]"));
  if (!tabs.length) return;

  const titleImg = root.querySelector("[data-protocol-title-image]");
  const titleText = root.querySelector("[data-protocol-title]");
  const markImg = root.querySelector("[data-protocol-mark-image]");
  const blurb = root.querySelector("[data-protocol-blurb]");
  const primary = root.querySelector("[data-protocol-link]");
  const outline = root.querySelector("[data-protocol-outline]");

  const activate = (tab) => {
    const id = tab.getAttribute("data-protocol-tab");
    const label = tab.getAttribute("data-protocol-label") || id;
    const src = tab.getAttribute("data-protocol-src") || "";
    const copy = tab.getAttribute("data-protocol-copy") || "";
    const motto = tab.getAttribute("data-protocol-motto") || "";
    const href = tab.getAttribute("data-protocol-href") || "finder.html";

    tabs.forEach((node) => node.setAttribute("aria-pressed", node === tab ? "true" : "false"));
    /* 2026-09-18: data-background removed — stage image is static now. */

    if (titleImg && src) titleImg.src = src;
    if (markImg && src) markImg.src = src;
    if (titleText) titleText.textContent = label;
    if (blurb && copy) blurb.textContent = copy;
    if (primary) primary.href = href;
    if (outline) outline.href = href;

    /* 2026-09-18: the protocol motto slogans were removed from the homepage
       copy baseline. Motto stays supported for the case where a future data
       entry re-introduces one — the node is only written when it exists. */
    const mottoNode = root.querySelector("[data-protocol-motto-text]");
    if (mottoNode) {
      if (motto) mottoNode.innerHTML = motto.replace(/\s*\|\s*/g, "<br>");
      else mottoNode.textContent = "";
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab));
  });

  const initial = tabs.find((tab) => tab.getAttribute("aria-pressed") === "true") || tabs[0];
  activate(initial);
})();
