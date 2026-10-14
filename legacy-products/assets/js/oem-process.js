/* OEM「OEM & ODM Process」页交互（2026-09-20，设计稿 05.png）
   初始状态由渲染器按 _data/oem/process.json 产出（第一步默认 is-current、第一个
   选项卡默认 is-on）。这里只做两件事：
     01 生命周期：点步骤 → 换成该步的 stage / copy（文案来自按钮的 data-stage / data-copy）
     04 复核选项卡：点标签 → 显示对应面板
   任何文案都不写死在本文件里，改文案改数据文件。 */
(() => {
  const steps = [...document.querySelectorAll("[data-steps] .opx-step[data-step]")];
  const stageOut = document.querySelector("[data-current-stage]");
  const copyOut = document.querySelector("[data-current-copy]");

  const smoothScrollTo = (t) => {
    if (!t) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  document.querySelectorAll('a[href^="#opx-"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      smoothScrollTo(t);
    });
  });

  /* 01 生命周期：选中的步骤高亮，并把「当前阶段」文案换成该步的 */
  const selectStep = (btn) => {
    steps.forEach((s) => {
      const on = s === btn;
      s.classList.toggle("is-current", on);
      s.setAttribute("aria-pressed", String(on));
    });
    if (stageOut) stageOut.textContent = btn.dataset.stage || "";
    if (copyOut) copyOut.textContent = btn.dataset.copy || "";
  };
  steps.forEach((btn) => {
    btn.addEventListener("click", () => selectStep(btn));
  });

  /* 04 复核选项卡：一次只亮一个标签 / 一个面板 */
  const tabs = [...document.querySelectorAll(".opx-tab[data-tab]")];
  const panels = [...document.querySelectorAll(".opx-tabpanel[data-panel]")];
  if (tabs.length) {
    const group = tabs[0].closest(".opx-tabs");
    const tablist = group?.getAttribute("role") === "tablist" ? group : null;
    const activate = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-hidden", panel.dataset.panel !== tab.dataset.tab);
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.tabIndex = tab.classList.contains("is-on") ? 0 : -1;
      tab.addEventListener("click", () => activate(tab, false));
      /* 键盘：← → Home End 在标签间移动（tablist 该有的行为） */
      tab.addEventListener("keydown", (e) => {
        const last = tabs.length - 1;
        let next = -1;
        if (e.key === "ArrowRight") next = i === last ? 0 : i + 1;
        else if (e.key === "ArrowLeft") next = i === 0 ? last : i - 1;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = last;
        if (next < 0) return;
        e.preventDefault();
        activate(tabs[next], true);
      });
    });
    if (tablist) tablist.addEventListener("keydown", (e) => { if (e.key === "Escape") activate(tabs[0], true); });
  }
})();
