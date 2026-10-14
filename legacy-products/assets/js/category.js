/* ═══════════════════════════════════════════════════════════════════════════
   Z02 产品列表页（PLP）交互 —— 筛选 / 排序 / 分批露脸 / 询价清单
   ═══════════════════════════════════════════════════════════════════════════
   和 Z01 的 category.js 不是同一套，别混用。三处关键差别：
     1) Z01 用 <select>，一维一值；这里用 checkbox 组，同维多选 OR、跨维 AND。
     2) Z01 的匹配读卡片自己的 data-* 扁平属性；这里读 data-variants 里的
        **变体数组** —— 因为一张卡有多个变体，必须「同一个变体同时满足所有已选维度」，
        不允许 A 维取一个变体的值、B 维取另一个变体的值拼出一个不存在的配置。
     3) Z01 是「Show more 按钮 + IntersectionObserver」；这里是**滚到底自动追加**
        （没有按钮、没有分页）：全部型号都在 HTML 里，JS 只决定「哪些先露脸」。

   **没有分页。** 包子 2026-09-18：产品全部显示出来，产品多的时候不要一次性渲染。
   所以 card 从头到尾都在 DOM 里（这也是筛选/排序的数据源，拿掉就筛不了），
   JS 只给超出 batch_size 的卡加 hidden，滚到接近底部再放下下一批 ——
   图片是 loading="lazy"，没露脸的卡浏览器也不会去排版/画。

   文案 / 标签 / 排序项 / 每批张数全部来自 assets/js/plp-data.js（生成物），
   本文件里不写死任何产品文案。
   ═══════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const main = document.querySelector('[data-plp]');
  const grid = document.querySelector('[data-cat-grid]');
  if (!main || !grid) return;

  const KEY = main.getAttribute('data-plp');
  const CFG = (window.Z02_PLP || {})[KEY];
  /* 配置缺失就什么都不做：生成器已经把全部型号渲染进 HTML 了，
     没有 JS 也是一个完整可读的清单（只是筛不了）。 */
  if (!CFG) return;

  const DIMS = (CFG.dimensions || []).map((d) => d.key);
  const LABELS = CFG.labels || {};
  const CARD = CFG.card || {};
  const SORTS = CFG.sorts || [];
  const DEFAULT_SORT = (SORTS[0] || {}).key || 'featured';
  /* 每批揭示多少张：首屏露这么多，之后每次滚到接近底部再追加这么多 */
  const BATCH_SIZE = CFG.batch_size || 8;
  const CURRENCY = CFG.currency || '';
  const COMPARE_MAX = (CARD.compare_limit && CARD.compare_limit.max) || 4;

  /* Pending source confirmation: keep the internal model IDs/routes, but do not
     expose the provisional Y10/T10 family labels in customer-facing cards. */
  const MODEL_PUBLIC_LABELS = {
    'mech-s3-005': 'S3 Mechanical Switch',
    'mech-s2-006': 'S2 Mechanical Switch',
    'mech-s5-007': 'S5 Mechanical Switch',
    'mech-a8-008': 'A8 Mechanical Switch',
    'mech-a6-009': 'A6 Emergency Call Switch',
    'mech-s8-005': 'S8 Mechanical Switch',
    'mech-a15-006': 'A15 Mechanical Switch',
    'mech-a16-007': 'A16 Mechanical Switch',
    'mech-y10-013': 'Mechanical Switch',
    'mech-t10-011': 'Mechanical Switch'
  };
  const MODEL_SEARCH_TERMS = {
    'mech-y10-013': 'emergency call switch emergency-call 3 gang 86-box',
    'mech-t10-011': 'mechanical switch switch 4 gang 86-box'
  };
  const MODEL_HIDE_SERIES_BADGE = new Set(['mech-y10-013', 'mech-t10-011']);

  const el = {
    toolbar: document.querySelector('[data-cat-toolbar]'),
    count: document.querySelector('[data-cat-count]'),
    chips: document.querySelector('[data-cat-chips]'),
    clear: [...document.querySelectorAll('[data-cat-clear]')],
    search: document.querySelector('[data-cat-search]'),
    sort: document.querySelector('[data-cat-sort]'),
    empty: document.querySelector('[data-cat-empty]'),
    quoteCount: document.querySelector('[data-quote-count]'),
    compareHint: document.querySelector('[data-compare-hint]')
  };

  const cards = [...grid.querySelectorAll('.cat-card:not(.cat-card--pending)')];
  const pendingCard = grid.querySelector('.cat-card--pending');
  if (pendingCard) {
    /* A pending card is an informational state, not a filterable product. */
    document.querySelector('[data-cat-toolbar]')?.setAttribute('hidden', '');
    if (el.empty) el.empty.hidden = true;
    return;
  }

  /* Normalize the two provisional labels at runtime as well as in generated
     HTML/data, so search and model sorting never leak the old public names. */
  cards.forEach((card) => {
    const publicLabel = MODEL_PUBLIC_LABELS[card.dataset.model];
    if (!publicLabel) return;
    card.dataset.name = publicLabel;
    card.dataset.search = `${publicLabel} ${card.dataset.model} ${MODEL_SEARCH_TERMS[card.dataset.model] || ''} ${card.dataset.search || ''}`;
    const title = card.querySelector('[data-detail]');
    if (title) title.textContent = publicLabel;
  });

  /* 变体索引只解析一次。解析失败 = 这张卡没有可筛属性，
     那就永远按默认变体显示、且只在无筛选时出现 —— 不能因为一条坏数据让整页失效。 */
  const index = cards.map((card) => {
    let variants = [];
    try {
      variants = JSON.parse(card.getAttribute('data-variants') || '[]');
    } catch (e) {
      variants = [];
    }
    return { card, variants, fallback: variants[0] || null };
  });

  const state = {
    /* Map<维度key, Set<取值>>。同维多个取值 = OR；不同维度 = AND。 */
    filters: new Map(),
    query: '',
    sort: DEFAULT_SORT,
    /* 已露脸的张数（不是页数）。只增不减 —— 用户滚出来的内容不会因为
       点了个筛选又缩回去。上限在 update() 里夹到命中总数。 */
    revealed: BATCH_SIZE
  };

  /* ── 小工具 ───────────────────────────────────────────────────────────── */
  const label = (key, value) => (LABELS[key] && LABELS[key][value]) || value;

  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* 缺价必须显示成「—」，不能是 0（§8 不变量 3） */
  const money = (amount) =>
    (CURRENCY ? CURRENCY + ' ' : '') +
    (amount === null || amount === undefined ? '\u2014.\u2014' : Number(amount).toFixed(2));

  /* Never expose an internal source-state in the customer-facing spec row.
     It may remain in the data layer for validation and import workflows. */
  const isPublicSpecValue = (value) => value && value !== 'source-pending';

  const specLine = (v) =>
    (CARD.spec_keys || [])
    .map((k) => {
      const first = (v[k] || [])[0];
        return isPublicSpecValue(first) ? label(k, first) : null;
      })
      .filter(Boolean)
      .join(' \u00b7 ');

  const activePairs = () => {
    const out = [];
    state.filters.forEach((vals, k) => {
      if (vals.size) out.push([k, vals]);
    });
    return out;
  };

  /* ── 匹配：判定发生在单个变体内部 ─────────────────────────────────────── */
  /* Option Matrix values describe product-level availability when the source
     does not yet contain a legal SKU combination. They remain separate from
     variant attributes so a filter cannot fabricate a Cartesian-product SKU. */
  const valuesFor = (v, key) => {
    const direct = v && v[key];
    if (direct && direct.length) return direct;
    return (v && v._options && v._options[key]) || [];
  };

  const variantMatches = (v, pairs) =>
    pairs.every(([k, vals]) => valuesFor(v, k).some((x) => vals.has(x)));

  /* 动态可用取值：保留当前已选值，但把在当前其它条件下不会命中的新值
     置为 disabled。这样筛选器不会把用户带到一个必然为空的组合。计数也
     跟随当前搜索词与其它筛选条件更新，不复制第二套产品数据。 */
  const updateOptionAvailability = () => {
    document.querySelectorAll('.cat-facet input[type="checkbox"]').forEach((input) => {
      const test = new Map();
      state.filters.forEach((values, key) => test.set(key, new Set(values)));
      if (!test.has(input.name)) test.set(input.name, new Set());
      test.get(input.name).add(input.value);
      const testPairs = [...test.entries()].filter(([, values]) => values.size);
      const hits = index.filter((item) => {
        const matchesQuery = !state.query || (item.card.dataset.search || '').toLocaleLowerCase().includes(state.query);
        return matchesQuery && item.variants.some((variant) => variantMatches(variant, testPairs));
      }).length;
      const option = input.closest('.cat-opt');
      const count = option && option.querySelector('.cat-opt-num');
      const unavailable = hits === 0 && !input.checked;
      input.disabled = unavailable;
      input.setAttribute('aria-disabled', String(unavailable));
      if (option) option.classList.toggle('is-unavailable', unavailable);
      if (count) count.textContent = String(hits);
    });
  };

  /* 分类页临时渲染图按产品型号固定：筛选变体时只更新 SKU/规格/价格，
     不再回退到原始占位 SVG。真实产品摄影到位后，只需替换这里的文件。 */
  const TEMP_PRODUCT_IMAGES = {
    'src03-m6': 'assets/images/products/smart-switches/m6/m6-plp-main.png',
    'src03-m6s': 'assets/images/products/smart-switches/m6s/m6s-plp-main.png',
    'src03-m8': 'assets/images/products/smart-switches/m8/m8-plp-main.png',
    'src03-m9': 'assets/images/products/smart-switches/m9/m9-plp-main.png',
    'src03-m10-glass': 'assets/images/products/smart-switches/m10-glass/m10-glass-plp-main.png',
    'src03-m12': 'assets/images/products/smart-switches/m12/m12-plp-main.png',
    'src03-m12s': 'assets/images/products/smart-switches/m12s/m12s-plp-main.png',
    'src03-z5': 'assets/images/products/smart-switches/z5/z5-plp-main.png',
    'src03-z6': 'assets/images/products/smart-switches/z6/z6-plp-main.png',
    'src03-z7': 'assets/images/products/smart-switches/z7/z7-plp-main.png',
    'src03-s8-smart': 'assets/images/products/smart-switches/s8/s8-plp-main.png',
    'gsl-s1': 'assets/images/smart-switches/gsl-s1-temp-v1.png',
    'gsl-s2': 'assets/images/smart-switches/gsl-s2-temp-v1.png',
    'gsl-s3': 'assets/images/smart-switches/gsl-s3-temp-v1.png',
    'gsl-s4': 'assets/images/smart-switches/gsl-s4-temp-v1.png',
    'gsl-d1': 'assets/images/smart-switches/gsl-d1-temp-v1.png',
    'gsl-d2': 'assets/images/smart-switches/gsl-d2-temp-v1.png',
    'gsl-sc4': 'assets/images/smart-switches/gsl-sc4-temp-v1.png',
    'gsl-sc6': 'assets/images/smart-switches/gsl-sc6-temp-v1.png',
    'gsl-cs1': 'assets/images/smart-switches/gsl-cs1-temp-v1.png',
    'gsl-fs3': 'assets/images/smart-switches/gsl-fs3-temp-v1.png',
    'gsl-ms1': 'assets/images/smart-switches/gsl-ms1-temp-v1.png',
    'gsl-kn1': 'assets/images/smart-switches/gsl-kn1-temp-v1.png',
    'mech-s3-005': 'assets/images/products/mechanical-switches/mechanical-1gang.png',
    'mech-s2-006': 'assets/images/products/mechanical-switches/mechanical-2gang.png',
    'mech-s5-007': 'assets/images/products/mechanical-switches/mechanical-3gang.png',
    'mech-a8-008': 'assets/images/products/mechanical-switches/mechanical-4gang.png',
    'mech-a6-009': 'assets/images/products/mechanical-switches/mechanical-emergency-1gang.png',
    'mech-s8-005': 'assets/images/products/mechanical-switches/mechanical-1gang.png',
    'mech-a15-006': 'assets/images/products/mechanical-switches/mechanical-2gang.png',
    'mech-a16-007': 'assets/images/products/mechanical-switches/mechanical-3gang.png',
    'mech-y10-013': 'assets/images/products/mechanical-switches/mechanical-emergency-3gang.png',
    'mech-t10-011': 'assets/images/products/mechanical-switches/mechanical-4gang.png'
  };

  /* ── 换装：把卡片换成命中的那个变体（图 / 型号 / 规格 / 价 / 角标 / 条件）──
     全部字段取自同一个 variant 对象，所以不会出现「图是这版、价是那版」。
     详情链接不在这里改 —— 它按型号组走（?model=<slug>），不随变体变。 */
  const paint = (card, v) => {
    if (!v || card.dataset.painted === v._v) return;
    card.dataset.painted = v._v;

    const img = card.querySelector('[data-img]');
    if (img) img.src = TEMP_PRODUCT_IMAGES[card.dataset.model] || v._img || img.src;

    const spec = card.querySelector('[data-spec]');
    if (spec) {
      const text = specLine(v);
      spec.textContent = text;
      spec.hidden = !text;
    }

    const price = card.querySelector('[data-price]');
    if (price) price.textContent = money(v._price);

    const terms = card.querySelector('[data-terms]');
    if (terms) {
      terms.textContent = v._terms || '';
      terms.hidden = !v._terms;
    }

    const media = card.querySelector('.cat-card-media');
    if (media) {
      media.querySelectorAll('[data-badge]').forEach((n) => n.remove());
      (CARD.badge_keys || []).forEach((k) => {
        if (k === 'series' && MODEL_HIDE_SERIES_BADGE.has(card.dataset.model)) return;
        const first = (v[k] || [])[0];
        if (!isPublicSpecValue(first)) return;
        const span = document.createElement('span');
        span.className = 'cat-badge cat-badge-' + k + '-' + first;
        span.setAttribute('data-badge', '');
        span.textContent = label(k, first);
        media.appendChild(span);
      });
    }

    /* 排序要读当前展示变体的价。缺价留空字符串 —— 排序里当「没有价」处理，
       绝不能退化成 0 混进最低价。 */
    card.dataset.currentPrice = v._price === null || v._price === undefined ? '' : String(v._price);
  };

  /* ── 排序 ─────────────────────────────────────────────────────────────── */
  const sortList = (list) => {
    const mode = state.sort;
    const priceOf = (card) => {
      const raw = card.dataset.currentPrice;
      if (raw === '' || raw === undefined) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    };
    return [...list].sort((a, b) => {
      if (mode === 'model-asc') {
        return String(a.dataset.name || '').localeCompare(String(b.dataset.name || ''), 'en');
      }
      if (mode === 'price-asc' || mode === 'price-desc') {
        const pa = priceOf(a);
        const pb = priceOf(b);
        /* 无价的一律排到最后，两种方向都一样 —— 它不是「0 元」 */
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return mode === 'price-asc' ? pa - pb : pb - pa;
      }
      const oa = Number(a.dataset.order || 9999);
      const ob = Number(b.dataset.order || 9999);
      if (oa !== ob) return oa - ob;
      return String(a.dataset.name || '').localeCompare(String(b.dataset.name || ''), 'en');
    });
  };

  /* ── URL 状态 ─────────────────────────────────────────────────────────────
     筛选 / 排序进 query string，所以任何一种视图都可分享、可前进后退。
     没有页码 —— 分页已删（包子 2026-09-18）。旧链接带 ?page=N 会被忽略，
     不会因此少显示产品。 */
  const urlFor = (over) => {
    over = over || {};
    const p = new URLSearchParams();
    state.filters.forEach((vals, k) => {
      if (vals.size) p.set(k, [...vals].join(','));
    });
    if (state.query) p.set('q', state.query);
    const sort = over.sort === undefined ? state.sort : over.sort;
    if (sort && sort !== DEFAULT_SORT) p.set('sort', sort);
    const q = p.toString();
    return location.pathname + (q ? '?' + q : '');
  };

  const syncUrl = (mode) => {
    const url = urlFor();
    if (url === location.pathname + location.search) return;
    if (mode === 'push') history.pushState(null, '', url);
    else history.replaceState(null, '', url);
  };

  const readUrl = () => {
    const p = new URLSearchParams(location.search);
    state.filters.clear();
    state.query = (p.get('q') || '').trim();
    DIMS.forEach((k) => {
      if (!p.has(k)) return;
      const vals = (p.get(k) || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (vals.length) state.filters.set(k, new Set(vals));
    });
    const keys = SORTS.map((s) => s.key);
    const s = p.get('sort');
    state.sort = keys.indexOf(s) >= 0 ? s : DEFAULT_SORT;
    /* 旧链接里的 ?page=N 直接忽略：分页没了，深链不该再决定「看多少」 */
  };

  const syncControls = () => {
    document.querySelectorAll('.cat-facet input[type="checkbox"]').forEach((i) => {
      const vals = state.filters.get(i.name);
      i.checked = Boolean(vals && vals.has(i.value));
    });
    if (el.sort) el.sort.value = state.sort;
    if (el.search) el.search.value = state.query;
  };

  const readControls = () => {
    state.filters.clear();
    document.querySelectorAll('.cat-facet input[type="checkbox"]').forEach((i) => {
      if (!i.checked) return;
      if (!state.filters.has(i.name)) state.filters.set(i.name, new Set());
      state.filters.get(i.name).add(i.value);
    });
  };

  /* ── 分批露脸（滚到底自动追加）───────────────────────────────────────────
     没有分页控件、也没有「点一下才加载」的按钮，所以没有任何可点的东西。
     机制：update() 之后观察「最后一张已露脸的卡」；它进入视口的提前量
     （下方 600px）时放出下一批，然后重新武装到新的尾巴。
     · 观察对象必须是**已露脸**的卡 —— hidden 的卡是 display:none，
       IntersectionObserver 收不到它，观察「下一张」永远不会触发。
     · 没有 IntersectionObserver 就一次性全露：宁可多画一点，
       也不能把内容永久藏起来。 */
  let revealIO = null;

  const applyReveal = (list) => {
    list.forEach((card, i) => {
      card.hidden = i >= state.revealed;
    });
  };

  const armReveal = (list) => {
    if (revealIO) {
      revealIO.disconnect();
      revealIO = null;
    }
    if (state.revealed >= list.length) return;
    if (!('IntersectionObserver' in window)) {
      state.revealed = list.length;
      applyReveal(list);
      return;
    }
    const tail = list[state.revealed - 1];
    if (!tail) return;
    revealIO = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        state.revealed = Math.min(state.revealed + BATCH_SIZE, list.length);
        applyReveal(list);
        armReveal(list);
      },
      { rootMargin: '400px 0px' }
    );
    revealIO.observe(tail);
  };

  /* ── 主更新 ───────────────────────────────────────────────────────────── */
  const update = () => {
    const pairs = activePairs();
    const query = state.query.toLocaleLowerCase();

    /* 1) 逐卡判定：有命中变体就取第一个命中的那个来展示（同源） */
    const matched = [];
    index.forEach((item) => {
      const matchesQuery = !query || (item.card.dataset.search || '').toLocaleLowerCase().includes(query);
      if (!matchesQuery) return;
      if (!pairs.length) {
        paint(item.card, item.fallback);
        matched.push(item.card);
        return;
      }
      const hit = item.variants.find((v) => variantMatches(v, pairs));
      if (hit) {
        paint(item.card, hit);
        matched.push(item.card);
      }
      /* 未命中的卡不管：它马上会被隐藏，下次命中时 paint 会重新换装 */
    });

    /* 2) 排序 */
    const sorted = sortList(matched);
    const total = sorted.length;

    /* 3) 分批：筛选会把命中总数改小，先把「已露脸张数」夹进 [min(批,总), 总] */
    if (state.revealed > total) state.revealed = total;
    if (state.revealed < Math.min(BATCH_SIZE, total)) state.revealed = Math.min(BATCH_SIZE, total);

    /* 4) 落 DOM：匹配的按序排好，超出「已露脸张数」的加 hidden */
    sorted.forEach((card, i) => {
      grid.appendChild(card);
      card.hidden = i >= state.revealed;
    });
    const shown = new Set(sorted);
    cards.forEach((card) => {
      if (!shown.has(card)) card.hidden = true;
    });

    /* 5) 计数：aria-live 只播报这一个节点，不重复念整张列表。
       没有页码了，所以不再有「showing 1–8」这种区间 */
    if (el.count) {
      const noun = total === 1 ? 'product' : 'products';
      let text = total + ' ' + noun;
      if (pairs.length || query) text += ' match your search and filters';
      el.count.textContent = text;
    }

    /* 6) 已选 chips */
    if (el.chips) {
      el.chips.innerHTML = '';
      state.filters.forEach((vals, k) => {
        vals.forEach((v) => {
          const li = document.createElement('li');
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cat-chip';
          btn.dataset.chip = k + ':' + v;
          btn.setAttribute('aria-label', 'Remove filter ' + label(k, v));
          btn.innerHTML = '<span>' + esc(label(k, v)) + '</span><span class="cat-chip-x" aria-hidden="true">\u00d7</span>';
          li.appendChild(btn);
          el.chips.appendChild(li);
        });
      });
    }

    /* 7) 每个入口上的已选计数（收起状态也能看出选了什么） */
    document.querySelectorAll('.cat-facet').forEach((facet) => {
      const badge = facet.querySelector('[data-facet-badge]');
      if (!badge) return;
      const n = facet.querySelectorAll('input[type="checkbox"]:checked').length;
      badge.textContent = String(n);
      badge.hidden = n === 0;
    });

    /* 8) Clear all 的可用性 + 空状态 */
    el.clear.forEach((b) => {
      b.disabled = pairs.length === 0;
    });
    if (el.empty) el.empty.hidden = total !== 0;

    /* 10) 在结果状态确定后更新每个筛选值的可用性与动态计数。 */
    updateOptionAvailability();

    /* 11) 武装下一批：观察最后一张已露脸的卡 */
    armReveal(sorted);
  };

  /* 筛选 / 排序变了：重算 + 同步 URL。
     ⚠️ 这里**不重置**已露脸张数 —— 分页时代是重置回第 1 页，现在没有「页」，
     而且已经滚出来的内容不该因为点了个筛选又缩回去（总数变小会自然夹住）。 */
  const applyFilters = (urlMode) => {
    update();
    syncUrl(urlMode);
  };

  /* ── 询价清单 / 对比选择（本地草稿，真提交在询价页）─────────────────────
     用 localStorage 存 id 列表。key 带页面 id，所以以后 11 个分类页各存各的。
     ⚠️ 这里只做「页面内的选择状态」。正式的 Quote List 页 / Compare 页尚未建模，
        见 _data/products/*.json 的 _placeholder.replace —— 那两项在待办里。 */
  const readSet = (k) => {
    try {
      return new Set(JSON.parse(window.localStorage.getItem(k) || '[]'));
    } catch (e) {
      return new Set();
    }
  };
  const writeSet = (k, s) => {
    try {
      window.localStorage.setItem(k, JSON.stringify([...s]));
    } catch (e) {
      /* 隐私模式下 localStorage 会抛；选择状态丢了不影响浏览，静默降级 */
    }
  };

  /* Compare 是全站产品工具，不属于某一张分类页；统一 key 后，用户从分类页
     进入详情页或 Product Center 时，已选择的型号仍然存在。 */
  const CKEY = 'z02-compare:global';

  /* 加购统一走 QuoteCart（assets/js/quote-cart.js）—— PLP 的 data-quote 已经是
     model_id，与 SSOT 的 key 一致，可以直接当清单条目用。旧版写到
     'z02-quote:' + KEY 的分页 key 已废弃，QuoteCart 首次加载会迁移并删除。 */
  const CART = window.QuoteCart;
  const COMPARE = window.Z02Compare;
  const compare = new Set(COMPARE ? COMPARE.get() : readSet(CKEY));
  const replaceCompare = (ids) => { compare.clear(); ids.forEach((id) => compare.add(id)); };

  const syncQuote = () => {
    document.querySelectorAll('[data-quote]').forEach((btn) => {
      const id = btn.dataset.quote;
      const on = Boolean(CART && id && CART.hasModel(id));
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? CARD.quote.added_label : CARD.quote.add_label;
    });
    if (!el.quoteCount) return;
    /* 页内计数只统计「本页这些型号」里已加的条目；全站条目数以页头角标为准 */
    const ids = [...document.querySelectorAll('[data-quote]')].map((b) => b.dataset.quote);
    const n = ids.filter((id) => CART && CART.hasModel(id)).length;
    el.quoteCount.hidden = n === 0;
    el.quoteCount.textContent = n
      ? n + (n === 1 ? ' model' : ' models') + ' in quote list'
      : '';
  };

  const syncCompare = () => {
    document.querySelectorAll('[data-compare]').forEach((i) => {
      i.checked = compare.has(i.value);
    });
    if (!el.compareHint) return;
    const min = (CARD.compare_limit && CARD.compare_limit.min) || 2;
    el.compareHint.hidden = compare.size === 0;
    el.compareHint.textContent =
      compare.size === 1
        ? 'Select one more model to compare'
        : compare.size + ' selected to compare';
    let bar = document.querySelector('[data-global-compare-bar]');
    if (!bar) {
      bar = document.createElement('aside');
      bar.className = 'cat-global-compare';
      bar.setAttribute('data-global-compare-bar', '');
      bar.innerHTML = '<span data-global-compare-copy></span><button type="button" data-global-compare-clear>Clear</button><a href="compare.html">Compare Products →</a>';
      document.body.appendChild(bar);
      bar.querySelector('[data-global-compare-clear]').addEventListener('click', () => { if (COMPARE) COMPARE.clear(); else { compare.clear(); writeSet(CKEY, compare); } replaceCompare(COMPARE ? COMPARE.get() : []); syncCompare(); });
    }
    bar.hidden = compare.size === 0;
    const copy = bar.querySelector('[data-global-compare-copy]');
    if (copy) copy.textContent = compare.size === 1 ? 'Select one more product to compare' : compare.size + ' products selected';
  };

  /* ── 事件 ─────────────────────────────────────────────────────────────── */
  const facetRoot = document.querySelector('.cat-facets');
  if (facetRoot) {
    facetRoot.addEventListener('change', (e) => {
      if (!e.target.matches('input[type="checkbox"]')) return;
      readControls();
      applyFilters('replace');
    });
  }

  if (el.search) {
    let searchTimer = null;
    el.search.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.query = el.search.value.trim();
        state.revealed = BATCH_SIZE;
        applyFilters('replace');
      }, 120);
    });
  }

  if (el.chips) {
    el.chips.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-chip]');
      if (!chip) return;
      const sep = chip.dataset.chip.indexOf(':');
      const key = chip.dataset.chip.slice(0, sep);
      const val = chip.dataset.chip.slice(sep + 1);
      const box = document.querySelector(
        '.cat-facet input[name="' + CSS.escape(key) + '"][value="' + CSS.escape(val) + '"]'
      );
      if (box) box.checked = false;
      readControls();
      applyFilters('replace');
    });
  }

  el.clear.forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.cat-facet input[type="checkbox"]').forEach((i) => {
        i.checked = false;
      });
      if (el.search) el.search.value = '';
      state.query = '';
      readControls();
      applyFilters('replace');
    });
  });

  if (el.sort) {
    el.sort.addEventListener('change', () => {
      state.sort = el.sort.value;
      applyFilters('replace');
    });
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quote]');
    if (!btn || !CART) return;
    const id = btn.dataset.quote;
    if (!id) return;
    if (CART.hasModel(id)) {
      CART.removeModel(id);
    } else {
      /* 列表页不加配置：卡片代表的是一整个型号组，具体配置留给 PDP 或 Drawer 里改。
         不自动打开 Drawer，只给轻提示（包子 2026-09-19 第 27 条）。 */
      CART.addLine({ model: id, qty: 1 });
      if (window.QuoteDrawer) {
        const card = btn.closest('article');
        const name = card && card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : '';
        window.QuoteDrawer.notifyAdded(name);
      }
    }
    syncQuote();
  });

  grid.addEventListener('change', (e) => {
    const box = e.target.closest('[data-compare]');
    if (!box) return;
    const id = box.value;
    if (box.checked) {
      const result = COMPARE ? COMPARE.add(id) : null;
      if (result && !result.ok) {
        box.checked = false;
        if (el.compareHint) {
          el.compareHint.hidden = false;
          el.compareHint.textContent = result.reason === 'category'
            ? 'Compare products from the same category'
            : 'Up to ' + COMPARE_MAX + ' models can be compared';
        }
        return;
      }
      if (result) replaceCompare(result.selected); else {
        if (compare.size >= COMPARE_MAX) { box.checked = false; return; }
        compare.add(id);
      }
    } else {
      if (COMPARE) replaceCompare(COMPARE.remove(id).selected); else compare.delete(id);
    }
    if (!COMPARE) writeSet(CKEY, compare);
    syncCompare();
  });

  /* 点空白处 / Esc 收起筛选面板。用 click 而不是 blur，因为焦点在面板内的
     复选框之间移动时 blur 会误关。 */
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.cat-facet[open]').forEach((d) => {
      if (!d.contains(e.target)) d.open = false;
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.cat-facet[open]').forEach((d) => {
      d.open = false;
    });
  });

  window.addEventListener('popstate', () => {
    readUrl();
    syncControls();
    update();
  });

  /* ── 启动 ─────────────────────────────────────────────────────────────── */
  readUrl();
  syncControls();
  update();
  syncQuote();
  syncCompare();
  /* 清单在别的页面 / 别的标签页被改动时（例如 Quote List 页清空），本页按钮态要跟上 */
  if (CART) CART.subscribe(syncQuote);
})();
