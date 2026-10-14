/* OEM「Start an OEM Project」页交互（2026-09-20，按设计稿 06-v2.png 重建）
   初始态由渲染器按 _data/oem/start-project.json 产出；这里只做「切换 + 联动」。
   不写死任何展示句子：会变的文案全部来自 DOM 上的
   data-done-text / data-pending-text / data-ok / data-fail，或直接读节点文本。

   ⚠️ 诚实降级：投递端点与在线保存都没有接入，按钮只把摘要复制到剪贴板并
   明说「没接上 / 复制失败」，绝不谎报「已提交 / 已保存」。
   因此右栏就绪清单里的 submit 永远保持 Pending —— 那是事实，不是 bug。 */
(() => {
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, type, fn) => el && el.addEventListener(type, fn);
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const val = (el) => (el && el.value ? String(el.value).trim() : "");

  const smooth = (el) => {
    if (!el) return;
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  /* ── 锚点平滑滚动（正文里所有 #ose-* 链接） ─────────────────── */
  qa('a[href^="#ose-"]').forEach((a) => on(a, "click", (e) => {
    const target = q(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    smooth(target);
  }));

  /* ── 右栏「草稿摘要」：值 + 单位都来自数据，这里只回填 ───────── */
  const sums = new Map();
  qa("[data-sum-key]").forEach((row) => {
    const em = q("em", row);
    if (em) sums.set(row.dataset.sumKey, { em, fallback: em.textContent, unit: row.dataset.sumUnit || "" });
  });
  const setSum = (key, value) => {
    const s = sums.get(key);
    if (!s) return;
    s.em.textContent = value || s.fallback;
  };
  const setSumCount = (key, n) => {
    const s = sums.get(key);
    if (!s) return;
    setSum(key, n > 0 && s.unit ? `${n} ${s.unit}` : "");
  };

  /* ── 右栏「就绪清单」 ───────────────────────────────────────── */
  const ready = new Map();
  qa("[data-readiness]").forEach((el) => {
    const text = q("[data-ready-text]", el);
    if (!text) return;
    ready.set(el.dataset.readiness, {
      el,
      text,
      doneText: el.dataset.doneText || text.textContent,
      pendingText: el.dataset.pendingText || text.textContent,
    });
  });
  const setReady = (key, done) => {
    const r = ready.get(key);
    if (!r) return;
    r.el.dataset.state = done ? "done" : "pending";
    r.text.textContent = done ? r.doneText : r.pendingText;
  };
  /* 08 复核：只有用户真的点了「Review All Sections」才算看过，不靠猜。 */
  let reviewed = false;

  /* ── 02 起始方式：单选（含方向键） ─────────────────────────── */
  const pairs = qa(".ose-opt[data-opt]")
    .map((opt) => ({ opt, btn: q("[data-opt-pick]", opt) }))
    .filter((p) => p.btn);
  const pick = (key) => pairs.forEach(({ opt, btn }) => {
    const live = opt.dataset.opt === key;
    opt.classList.toggle("is-on", live);
    btn.setAttribute("aria-checked", String(live));
  });
  pairs.forEach((p, i) => {
    on(p.btn, "click", () => pick(p.opt.dataset.opt));
    on(p.btn, "keydown", (e) => {
      const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const next = pairs[(i + dir + pairs.length) % pairs.length];
      next.btn.click();
      next.btn.focus();
    });
  });
  /* 卡片本体也能点（设计稿看着就是一整块可选）；但卡内那个 CTA 链接有自己的去处，别抢。 */
  pairs.forEach(({ opt }) => on(opt, "click", (e) => {
    if (e.target.closest("a")) return;
    pick(opt.dataset.opt);
  }));

  /* ── 03 产品行：移除 ───────────────────────────────────────── */
  const tbody = q("#ose-products tbody");
  const prodRows = () => (tbody ? qa("[data-product-row]", tbody) : []);
  qa("[data-remove-row]").forEach((btn) => on(btn, "click", () => {
    const tr = btn.closest("[data-product-row]");
    if (tr) tr.remove();
    sync();
  }));

  /* ── 04 定制勾选 ───────────────────────────────────────────── */
  const custChecks = qa("[data-cust-check]");
  custChecks.forEach((box) => on(box, "change", sync));

  /* ── 05 附件：只显示文件名（本地不上传） ───────────────────── */
  const uploads = qa("[data-upload]");
  uploads.forEach((input) => on(input, "change", () => {
    const file = input.files && input.files[0];
    const name = q(`[data-upload-name="${input.dataset.upload}"]`);
    if (name) {
      name.textContent = file ? file.name : "";
      name.hidden = !file;
    }
    sync();
  }));

  /* ── 06 / 07 表单：边填边联动 ──────────────────────────────── */
  qa("[data-input]").forEach((el) => {
    on(el, "input", sync);
    on(el, "change", sync);
  });

  /* ── 联动汇总 ───────────────────────────────────────────────── */
  const hasValue = (root) => qa("[data-input]", root).some((el) => val(el) !== "");
  const selectedText = (sel) => {
    const el = q(sel);
    return el && el.value ? txt(el.options[el.selectedIndex]) : "";
  };

  function sync() {
    const list = prodRows();
    list.forEach((tr, i) => {
      const n = q(".ose-td-n", tr);
      if (n) n.textContent = String(i + 1);
    });

    /* 摘要实时值 */
    setSumCount("products", list.length);
    setSumCount("customization", custChecks.filter((c) => c.checked).length);
    setSum("project_type", selectedText('#ose-context [name="project_type"]'));
    setSum("target_market", selectedText('#ose-context [name="target_market"]'));

    /* 就绪清单 */
    setReady("products", list.length > 0);
    setReady("customization", custChecks.some((c) => c.checked));
    setReady("technical", uploads.some((u) => u.files && u.files.length > 0));
    const ctx = q("#ose-context");
    const co = q("#ose-company");
    setReady("context", ctx ? hasValue(ctx) : false);
    setReady("company", co ? hasValue(co) : false);
    setReady("review", reviewed);
    /* submit：没有接收端点 → 永远 Pending，见文件头说明。 */
  }

  /* ── 摘要文本：只读当前 DOM（标题取页面自己的段标题，不另造文案） ── */
  const sectionTitle = (id) => txt(q(`#${id} .ose-title`));

  const buildSummary = () => {
    const out = [];
    const card = q("[data-copy-summary]")?.closest(".ose-card");
    if (card) {
      const head = txt(q(".ose-card-head strong", card));
      if (head) out.push(head.toUpperCase());
      qa("[data-sum-key]", card).forEach((row) => {
        const k = txt(q(":scope > span", row));
        const v = txt(q("em", row));
        if (k && v) out.push(`- ${k}: ${v}`);
      });
    }

    const list = prodRows();
    if (list.length) {
      const t = sectionTitle("ose-products");
      if (t) out.push("", t);
      list.forEach((tr, i) => {
        const name = txt(q(".ose-td-product strong", tr));
        const model = txt(q(".ose-td-model", tr));
        const qty = val(q(".ose-td-qty input", tr));
        const unit = txt(q(".ose-td-qty span", tr));
        const tail = [model, qty && `${qty}${unit ? " " + unit : ""}`].filter(Boolean).join(" · ");
        out.push(`${i + 1}. ${name}${tail ? ` — ${tail}` : ""}`);
      });
    }

    const checked = custChecks
      .filter((c) => c.checked)
      .map((c) => txt(q("span", c.closest(".ose-check-row"))));
    if (checked.length) {
      const t = sectionTitle("ose-customization");
      if (t) out.push("", t);
      checked.forEach((c) => out.push(`- ${c}`));
    }

    return out.join("\n").trim();
  };

  /* ── 复制（navigator.clipboard → execCommand 兜底） ────────── */
  const copyText = async (text) => {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  };

  /* 同一个 note 节点，成功/失败用 data-ok / data-fail 两套文案 —— 失败也必须说话。 */
  const flash = (el, ok, ms) => {
    if (!el) return;
    el.textContent = ok ? el.dataset.ok : el.dataset.fail;
    el.classList.toggle("ose-note--ok", !!ok);
    el.hidden = false;
    window.clearTimeout(el._oseTimer);
    el._oseTimer = window.setTimeout(() => { el.hidden = true; }, ms);
  };

  on(q("[data-copy-summary]"), "click", async () => {
    flash(q("[data-copy-note]"), await copyText(buildSummary()), 7000);
  });

  on(q("[data-submit]"), "click", async () => {
    flash(q("[data-submit-note]"), await copyText(buildSummary()), 9000);
  });

  on(q("[data-review-all]"), "click", () => {
    reviewed = true;
    sync();
  });

  sync();
})();
