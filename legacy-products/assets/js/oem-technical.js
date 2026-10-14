/* OEM「Technical Customization」页交互（2026-09-20，设计稿 03.png）
   初始状态由渲染器按 _data/oem/technical-customization.json 产出；每个会切换的
   文本/药丸都带 data-on-text / data-off-text 双态文案，这里只做纯切换与联动：
   03/05/06/07 的芯片勾选 → 01 工作台、03 功能摘要、05 逻辑摘要、04 硬件复核、
   08 技术简报状态。文案不写死，改文案改数据文件。 */
(() => {
  const chipAreas = ["behavior", "logic", "ui", "integration"];
  const chips = [...document.querySelectorAll(".otx-chip[data-chip]")];
  if (!chips.length) return;

  /* 芯片 → 所属领域（从最近的 .otx-group 上读，渲染器已写出） */
  const areaOf = new Map(chips.map((c) => [c, c.closest(".otx-group")?.dataset.chipArea || ""]));
  const groupOf = new Map(chips.map((c) => [c, c.closest(".otx-group")?.dataset.chipGroup || ""]));

  /* 文件引用卡：有文件即算「已提供」；用户新传文件会补进列表 */
  const refCards = [...document.querySelectorAll(".otx-ref[data-ref-card]")];
  const refHas = new Map(refCards.map((c) => [c.dataset.refCard, c.querySelectorAll(".otx-file").length > 0]));

  const smoothScrollTo = (t) => {
    if (!t) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  document.querySelectorAll('a[href^="#otx-"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      smoothScrollTo(t);
    });
  });

  const setPill = (el, on, kindOn = "ok", kindOff = "muted") => {
    if (!el) return;
    el.textContent = on ? el.dataset.onText : el.dataset.offText;
    el.classList.remove("osp-pill--ok", "osp-pill--muted", "osp-pill--warn");
    el.classList.add("osp-pill--" + (on ? kindOn : kindOff));
  };
  const setText = (el, on) => { if (el) el.textContent = on ? el.dataset.onText : el.dataset.offText; };

  const areaOn = (area) => chips.some((c) => areaOf.get(c) === area && c.classList.contains("is-on"));
  const groupOn = (group) => chips.some((c) => groupOf.get(c) === group && c.classList.contains("is-on"));
  const hardwareOn = () => refCards.some((c) => c.dataset.refArea === "hardware" && refHas.get(c.dataset.refCard));
  const uiRefOn = () => refCards.some((c) => c.dataset.refArea === "ui" && refHas.get(c.dataset.refCard));
  const defined = (area) => area === "hardware" ? hardwareOn() : area === "ui" ? (areaOn("ui") || uiRefOn()) : areaOn(area);

  const sync = () => {
    /* 芯片自身态 */
    chips.forEach((c) => {
      const on = c.classList.contains("is-on");
      c.setAttribute("aria-pressed", String(on));
    });

    /* 01 工作台药丸：functions←behavior / firmware←logic / ui / integration / hardware */
    const wsMap = { functions: "behavior", firmware: "logic", ui: "ui", integration: "integration", hardware: "hardware" };
    document.querySelectorAll("[data-ws]").forEach((row) => {
      const on = defined(wsMap[row.dataset.ws] || "");
      setPill(row.querySelector("[data-ws-pill]"), on);
    });

    /* 03 功能摘要逐组 + 技术复核 */
    document.querySelectorAll("[data-def-group]").forEach((row) => setText(row.querySelector("[data-def-text]"), groupOn(row.dataset.defGroup)));
    const reviewRow = document.querySelector("[data-review-text]");
    if (reviewRow) reviewRow.textContent = areaOn("behavior") ? reviewRow.dataset.onText : reviewRow.dataset.offText;

    /* 05 逻辑摘要 */
    document.querySelectorAll("[data-logic-row]").forEach((row) => {
      const k = row.dataset.logicRow;
      const on = k === "combined" ? (groupOn("logic_trigger") || groupOn("logic_rule"))
        : k === "firmware" ? (groupOn("logic_rule") || groupOn("logic_action"))
        : groupOn("logic_action");
      setText(row.querySelector("[data-logic-text]"), on);
    });

    /* 04 硬件复核 */
    document.querySelectorAll("[data-hw-row]").forEach((row) => {
      const k = row.dataset.hwRow;
      const on = k === "defined" ? hardwareOn()
        : k === "electrical" ? refHas.get("technical")
        : k === "interface" ? refHas.get("interface")
        : k === "physical" ? refHas.get("drawing")
        : false;
      if (k === "new_dev") return;
      setText(row.querySelector("[data-hw-text]"), on);
    });

    /* 04 参考卡药丸 */
    refCards.forEach((card) => setPill(card.querySelector("[data-ref-pill]"), refHas.get(card.dataset.refCard)));

    /* 08 技术简报 */
    const areas8 = ["behavior", "hardware", "logic", "ui", "integration"];
    areas8.forEach((area) => {
      const on = defined(area);
      const card = document.querySelector(`[data-brief-card="${area}"]`);
      if (card) {
        setText(card.querySelector("[data-brief-card-text]"), on);
        setPill(card.querySelector("[data-brief-card-pill]"), on);
      }
      const req = document.querySelector(`[data-brief-req="${area}"]`);
      if (req) setText(req.querySelector("[data-brief-req-text]"), on);
      const st = document.querySelector(`[data-brief-status="${area}"]`);
      if (st) setPill(st.querySelector("[data-brief-status-pill]"), on);
    });
  };

  chips.forEach((c) => c.addEventListener("click", () => {
    c.classList.toggle("is-on");
    sync();
  }));

  /* 04 / 06 文件引用：本地上传只做展示，不上传任何服务器 */
  refCards.forEach((card) => {
    const input = card.querySelector("[data-ref-input]");
    input?.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const box = card.querySelector("[data-ref-files]");
      const chipEl = document.createElement("span");
      chipEl.className = "otx-file";
      chipEl.textContent = file.name;
      box?.appendChild(chipEl);
      refHas.set(card.dataset.refCard, true);
      sync();
    });
  });

  /* 06 UI 预览 tabs：切到有预览的视图显示设备，其余给「尚无预览」提示（文案均在数据里） */
  const tabs = [...document.querySelectorAll("[data-preview-tab]")];
  const previewHead = document.querySelector("[data-preview-head]");
  const previewBody = document.querySelector("[data-preview-body]");
  const previewEmpty = document.querySelector("[data-preview-empty]");
  const previewRoom = previewBody?.dataset.room || "";
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const label = tab.dataset.previewTab;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-pressed", String(active));
      });
      const hasPreview = label === previewRoom;
      if (previewHead) previewHead.textContent = hasPreview ? previewRoom : label;
      if (previewBody) previewBody.hidden = !hasPreview;
      if (previewEmpty) previewEmpty.hidden = hasPreview;
    });
  });

  /* 03 「+ Add Requirement」→ 回到芯片区首个组 */
  document.querySelector("[data-add-requirement]")?.addEventListener("click", () => {
    smoothScrollTo(document.querySelector("#otx-behavior .otx-flow"));
    chips[0]?.focus({ preventScroll: true });
  });

  /* 保存 / 添加到简报：复制当前卡片摘要到剪贴板（诚实降级：不谎报提交） */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  };
  document.querySelectorAll("[data-copy-summary]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".osp-card");
      const target = btn.dataset.copySummary === "brief" ? document.querySelector("#otx-brief") : card;
      const lines = [];
      target?.querySelectorAll(".osp-card-title").forEach((t) => lines.push(t.textContent.trim().toUpperCase()));
      target?.querySelectorAll(".osp-kv").forEach((row) => {
        const k = row.querySelector(":scope > span")?.textContent?.trim();
        const v = row.querySelector("[data-brief-card-text], [data-brief-req-text], [data-brief-status-text], strong")?.textContent?.trim();
        if (k && v) lines.push(`- ${k}: ${v}`);
      });
      const text = lines.length ? lines.join("\n") : "# Technical requirement — nothing defined yet";
      const ok = await copyText(text);
      const note = card?.querySelector("[data-copy-note]") || target?.querySelector("[data-copy-note]");
      if (note && ok) {
        note.hidden = false;
        window.setTimeout(() => { note.hidden = true; }, 6000);
      }
    });
  });

  sync();
})();
