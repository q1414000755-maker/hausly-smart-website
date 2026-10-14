/* OEM「Branding, Packaging & Documentation」页交互（2026-09-20，设计稿 04.png）
   初始状态由渲染器按 _data/oem/branding-packaging.json 产出；会切换的文本/药丸都带
   data-on-text / data-off-text（部分带 data-warn-text 三态），这里只做纯切换与联动。
   文案不写死，改文案改数据文件。 */
(() => {
  const options = [...document.querySelectorAll(".obx-option[data-option]")];
  if (!options.length) return;

  /* 素材状态：初始「有文件」的算已提供（渲染器已把文件名写进 DOM） */
  const assetCards = [...document.querySelectorAll("[data-asset-card]")];
  const assetHas = new Map(assetCards.map((c) => [c.dataset.assetCard, c.querySelectorAll(".obx-file-chip").length > 0]));

  const brandField = document.querySelector('[data-field="brand_name"]');
  const docSelects = new Map([...document.querySelectorAll("[data-doc]")].map((s) => [s.dataset.doc, s]));
  const packSelects = new Map([...document.querySelectorAll("[data-pack]")].map((s) => [s.dataset.pack, s]));
  const markToggles = new Map([...document.querySelectorAll("[data-toggle]")].map((b) => [b.dataset.toggle, b]));

  const smoothScrollTo = (t) => {
    if (!t) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  document.querySelectorAll('a[href^="#obx-"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      smoothScrollTo(t);
    });
  });

  /* 三态药丸：on(ok) / warn / off(muted) */
  const setState = (el, state) => {
    if (!el) return;
    const map = { on: el.dataset.onText, warn: el.dataset.warnText, off: el.dataset.offText };
    el.textContent = map[state] || "";
    el.classList.remove("osp-pill--ok", "osp-pill--warn", "osp-pill--muted");
    el.classList.add("osp-pill--" + (state === "on" ? "ok" : state === "warn" ? "warn" : "muted"));
  };
  const selectedOption = () => options.find((o) => o.classList.contains("is-on"))?.dataset.option || "";
  /* 指定文案 + 指定态（用于「Not required」这类第三文案，仍然来自 data-* 不写死） */
  const setText = (el, text, kind) => {
    if (!el || !text) return;
    el.textContent = text;
    el.classList.remove("osp-pill--ok", "osp-pill--warn", "osp-pill--muted");
    el.classList.add("osp-pill--" + kind);
  };
  /* 数据里写的是状态名（ok / warn / pending / muted），setState 要的是 on / warn / off */
  const toKey = (s) => (s === "ok" ? "on" : s === "muted" ? "off" : "warn");

  const sync = () => {
    const brandName = (brandField?.value || "").trim();
    const isNeutral = selectedOption() === "neutral";
    const brandChosen = selectedOption() && !isNeutral;
    const hasLogo = !!assetHas.get("logo");
    const hasGuide = !!assetHas.get("brand_guide");
    const hasArtwork = !!assetHas.get("packaging_artwork");
    const hasDocs = !!assetHas.get("documentation");
    const packType = (packSelects.get("requirement")?.value || "").trim();
    const packCarton = (packSelects.get("carton")?.value || "").trim();
    const packDefined = !!packType && packType !== "Not defined";

    /* 01 工作台 */
    const ws = {
      branding: brandChosen && !!brandName,
      packaging: packDefined,
      documentation: hasDocs || !!docSelects.get("manual")?.value,
      label: !!markToggles.get("packaging_label:brand")?.classList.contains("is-on")
    };
    Object.entries(ws).forEach(([key, on]) => {
      const row = document.querySelector(`[data-ws="${key}"]`);
      const el = row?.querySelector("[data-ws-pill]");
      /* 主动选择「无品牌」时，品牌行不是「没填」而是「不需要」 */
      if (key === "branding" && isNeutral) return setText(el, el?.dataset.neutralText, "muted");
      setState(el, on ? "on" : "off");
    });

    /* 02 品牌素材状态：只在 dynamic 行上翻 */
    document.querySelectorAll("[data-asset-row]").forEach((row) => {
      const pill = row.querySelector("[data-asset-pill]");
      if (!pill) return;
      const key = row.dataset.assetRow;
      const on = key === "logo" ? hasLogo : key === "brand_guide" ? hasGuide : false;
      setState(pill, on ? "on" : "off");
    });

    /* 03 标签预览跟着品牌名 / 型号走（有值就用值） */
    const labelBrand = document.querySelector('[data-label="brand"]');
    if (labelBrand && brandName) labelBrand.textContent = brandName;

    /* 06 素材清单 */
    document.querySelectorAll("[data-checklist]").forEach((row) => {
      const key = row.dataset.checklist;
      const on = !!assetHas.get(key);
      const value = row.querySelector("[data-checklist-value]");
      /* 取最新一个文件（上传会 append 到末尾），不要取第一个 —— 否则清单永远停在初始文件 */
      const chips = assetCards.find((c) => c.dataset.assetCard === key)?.querySelectorAll(".obx-file-chip") || [];
      const file = chips[chips.length - 1]?.textContent?.trim();
      if (value && on && file) value.textContent = file;
      setState(row.querySelector("[data-checklist-pill]"), on ? "on" : "warn");
    });

    /* 07 量产前复核：带 key 的行按上游状态翻 */
    const reviewMap = {
      logo: hasLogo,
      logo_applied: hasLogo,
      brand_guide: hasGuide,
      packaging_artwork: hasArtwork,
      packaging_type: packDefined,
      carton_info: !!packCarton && packCarton !== "Not defined",
      language: !!docSelects.get("language")?.value,
      brand_name_ref: brandChosen,
      label_requirements: !!markToggles.get("packaging_label:brand")?.classList.contains("is-on")
    };
    Object.entries(reviewMap).forEach(([key, on]) => {
      document.querySelectorAll(`[data-review-pill="${key}"], [data-review-status="${key}"]`).forEach((el) => setState(el, on ? "on" : "off"));
    });

    /* 04 包装简报跟着下拉走。
       注意：药丸态不要跟着「已选」翻成 ok —— 数据里 Primary 的态是 warn（"To confirm"，
       意为还要我们这边确认），翻成 ok 会变成蓝色 "To confirm"，文案和颜色对不上。 */
    const packRow = document.querySelector('[data-pack-row="primary"]');
    if (packRow && packDefined) {
      const v = packRow.querySelector("[data-pack-value]");
      if (v) v.textContent = packType;
    }

    /* 05 文档状态跟着下拉走：值文本 + 药丸态。
       药丸态取数据声明的 pill_follow（如 language / translation 都是 pending → 琥珀色 "Pending"），
       绝不能一律刷成 ok —— 否则会出现蓝色底 + "Pending"/"Not provided" 这种文色不符。 */
    document.querySelectorAll("[data-doc-row]").forEach((row) => {
      const select = docSelects.get(row.dataset.docRow);
      if (!select) return;
      const v = row.querySelector("[data-doc-value]");
      if (v) v.textContent = select.value;
      const pill = row.querySelector("[data-doc-pill]");
      if (!pill) return;
      setState(pill, select.value.includes("Not") ? "off" : toKey(pill.dataset.docPillState));
    });

    /* 08 品牌包简报 */
    const briefMap = [
      ["brand_identity:brand_name", brandChosen ? brandName : null, "text"],
      ["brand_identity:logo", brandChosen && hasLogo ? "Provided" : null, "text"],
      ["brand_identity:branding", brandChosen ? "Brand marks applied" : null, "text"],
      ["product_branding:brand_name", brandChosen ? brandName : null, "text"],
      ["product_branding:product_id", selectedOption() === "product-id" ? "Yes" : null, "text"],
      ["packaging:type", packDefined ? packType : null, "text"],
      ["packaging:labeling", markToggles.get("packaging_label:brand")?.classList.contains("is-on") ? "Label on box" : null, "text"],
      ["packaging:included", (packSelects.get("included")?.value || "") || null, "text"],
      ["documentation:manual", hasDocs ? "Provided" : null, "text"],
      ["documentation:language", docSelects.get("language")?.value || null, "text"],
      ["assets:logo", hasLogo ? "Provided" : null, "text"],
      ["assets:brand_guide", hasGuide ? "Provided" : null, "text"],
      ["assets:packaging_artwork", hasArtwork ? "Provided" : null, "text"]
    ];
    briefMap.forEach(([key, value]) => {
      if (!value) return;
      const el = document.querySelector(`[data-brief-row="${key}"]`);
      if (el) el.textContent = value;
    });
    /* neutral：品牌专属项统一改口「不需要」（文案来自渲染器写的 data-neutral-text） */
    if (isNeutral) {
      document.querySelectorAll("#obx-brief [data-brief-row][data-neutral-text]").forEach((el) => {
        el.textContent = el.dataset.neutralText;
      });
    }
    const briefStatus = {
      branding: brandChosen && !!brandName,
      packaging: packDefined,
      documentation: hasDocs,
      labeling: !!markToggles.get("packaging_label:brand")?.classList.contains("is-on"),
      artwork: hasLogo || hasArtwork
    };
    Object.entries(briefStatus).forEach(([key, on]) => {
      const el = document.querySelector(`[data-brief-status="${key}"] [data-brief-status-pill]`);
      if (key === "branding" && isNeutral) return setText(el, el?.dataset.neutralText, "muted");
      setState(el, on ? "on" : "off");
    });
  };

  /* 02 选项卡：单选（点选项头切走） */
  options.forEach((opt) => {
    opt.querySelector("[data-option-pick]")?.addEventListener("click", () => {
      options.forEach((o) => {
        const on = o === opt;
        o.classList.toggle("is-on", on);
        o.querySelector("[data-option-pick]")?.setAttribute("aria-pressed", String(on));
      });
      sync();
    });
  });
  brandField?.addEventListener("input", sync);
  docSelects.forEach((s) => s.addEventListener("change", sync));
  packSelects.forEach((s) => s.addEventListener("change", sync));

  /* 03 打标开关 */
  markToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const on = !btn.classList.contains("is-on");
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
      const text = btn.querySelector(".obx-switch-text");
      if (text) text.textContent = on ? btn.dataset.onText : btn.dataset.offText;
      sync();
    });
  });

  /* 02 / 06 文件：本地展示，不上传任何服务器 */
  document.querySelectorAll("[data-asset-input]").forEach((input) => {
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const key = input.dataset.assetInput;
      const card = document.querySelector(`[data-asset-card="${key}"]`);
      if (card) {
        const box = card.querySelector("[data-asset-files]");
        const chipEl = document.createElement("span");
        chipEl.className = "obx-file-chip";
        chipEl.textContent = file.name;
        box?.appendChild(chipEl);
      }
      const fileLabel = document.querySelector(`[data-file-name="${key}"]`);
      if (fileLabel) fileLabel.textContent = file.name;
      assetHas.set(key, true);
      sync();
    });
  });

  /* 08 添加品牌包：复制摘要到剪贴板（诚实降级：不谎报提交） */
  const copyNote = document.querySelector("[data-copy-note]");
  document.querySelector("[data-copy-brief]")?.addEventListener("click", async () => {
    const lines = [];
    document.querySelectorAll("#obx-brief .osp-card-title").forEach((t) => lines.push(t.textContent.trim().toUpperCase()));
    document.querySelectorAll("#obx-brief .osp-kv").forEach((row) => {
      const k = row.querySelector(":scope > span")?.textContent?.trim();
      const v = row.querySelector("strong, [data-brief-status-pill]")?.textContent?.trim();
      if (k && v) lines.push(`- ${k}: ${v}`);
    });
    const text = lines.join("\n").trim() || "# Brand package brief — nothing defined yet";
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    if (copyNote && ok) {
      copyNote.hidden = false;
      window.setTimeout(() => { copyNote.hidden = true; }, 6000);
    }
  });

  sync();
})();
