/* Z02 site shell — 交互层
   ────────────────────────────────────────────────────────────────────────────
   2026-09-18 包子决策 1：页头/页脚改为**构建期直出**（见 _registry/shell-render.mjs）。
   本文件不再渲染任何标记 —— 它只负责接上交互：

     · 下拉菜单互斥 + 点击外部关闭 + Esc 关闭
     · 页头滚动态（透明 / 白条 / 下滑隐藏·上滑出现 / 被二级吸顶条接管）
     · 品牌 logo 按态换色（浅色 ↔ 深色）

   标记真源在 _registry/shell-render.mjs；改导航结构改 _registry/pages.json。
   ⚠️ 不要在**本文件**里拼 HTML —— 那等于把刚搬走的渲染又搬回来，
      爬虫依旧看不到。要改页头长相，改 shell-render.mjs 再跑 build。

   ⚠️ 兼容：若页面上没有直出的 [data-site-shell]（例如手作页忘了加），
      本文件不再兜底注入 —— 直接 console.warn 让人去修模板，
      不静默渲染出「一页有一页没有」的分裂状态。 */
(() => {
  // Shared floating assistance: root paths also work on nested product pages.
  const assistanceBase = new URL('../../', document.currentScript.src);

  const mount = () => {
    if (!document.querySelector('script[src*="floating-toolbar.js"]')) {
      const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('floating-toolbar.css?v=20261014-qr1',assistanceBase).href;
      const script=document.createElement('script');script.src=new URL('floating-toolbar.js?v=20261014-qr1',assistanceBase).href;
      document.head.append(style,script);
    }

    const shell = document.querySelector('[data-site-shell]');
    const footer = document.querySelector('[data-site-footer]');
    if (!shell) {
      console.warn('[z02-shell] 页头未直出：本页 HTML 缺少 [data-site-shell]。请确认它由 _registry/build.mjs 生成（模板见 _registry/shell-render.mjs）。');
      return;
    }
    if (!footer) {
      console.warn('[z02-shell] 页脚未直出：本页 HTML 缺少 [data-site-footer]。');
    }
    if (!document.body.classList.contains('shell-header-overlay')) document.body.classList.add('shell-header-overlay');

    /* ── logo 换色 ──────────────────────────────────────────────────────────
       页头有「静止透明 / 滚动白条」两态，logo 必须跟着换（浅色 ↔ 深色）。
       静止态用哪个由 computed token 决定：透明态是 #ffffff → 浅色 logo；
       没有主视觉的页面（banner 缺省）token 被改成 ink → 深色 logo，两态一样。
       ⚠️ 直出时 logo 的 src 是 1×1 透明占位（构建期拿不到 computed token），
          必须在这里填真图；两张都预载，否则第一次滚动换图会闪空白。 */
    const self = document.querySelector('script[src*="site-shell.js"]');
    const base = self ? self.getAttribute('src').replace(/assets\/js\/site-shell\.js.*$/, '') : '';
    const url = (p) => (p ? base + p : '#');

    const brandLogo = document.querySelector('[data-brand-logo]');
    const headerEl = document.querySelector('.z02-site-header');
    const LOGO_DARK = url('assets/images/logo-hauslysmart-20261010.png');
    const LOGO_LIGHT = url('assets/images/logo-hauslysmart-20261010.png');
    [LOGO_DARK, LOGO_LIGHT].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    let restLogo = LOGO_DARK;
    if (brandLogo && headerEl) {
      const foreground = getComputedStyle(headerEl).getPropertyValue('--z02-shell-header-foreground').trim();
      const onLight = foreground !== '' && !/^#fff/i.test(foreground) && !/^rgb\(255,\s*255,\s*255\)$/i.test(foreground);
      restLogo = onLight ? LOGO_DARK : LOGO_LIGHT;
      brandLogo.src = restLogo;
    }

    /* ── 下拉菜单 ─────────────────────────────────────────────────────────── */
    const menus = [...shell.querySelectorAll('details')];
    shell.addEventListener('toggle', (event) => {
      if (event.target.open) menus.forEach((menu) => { if (menu !== event.target) menu.open = false; });
      /* 下拉打开时整条页头要压过二级吸顶条：分类页筛选条是 z-index:60，
         页头默认 50，产品 mega 面板往下伸得比筛选条长，会被它盖住一截。
         抬高页头（不是筛选条）的原因是接管态筛选条要盖在页头位置上，
         两者的高低不能反过来；只在打开期间临时抬，关掉就换回去。 */
      document.body.classList.toggle('nav-open', menus.some((menu) => menu.open));
      /* 打开下拉时强制露出页头，避免被 header-hidden 藏住 */
      if (menus.some((menu) => menu.open)) document.body.classList.remove('header-hidden');
    }, true);
    document.addEventListener('pointerdown', (event) => {
      if (!shell.contains(event.target)) menus.forEach((menu) => { menu.open = false; });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const active = menus.find((menu) => menu.open);
      if (active) { active.open = false; active.querySelector('summary')?.focus(); }
    });

    /* ── 滚动状态 ────────────────────────────────────────────────────────────
       · is-scrolled   —— scrollY > 12：白条吸顶
       · header-hidden —— 向下滚隐藏；向上滚显示（近顶 / 下拉打开时强制显示）
       · bar-takeover  —— 分类页二级吸顶条接管时页头让位
       包子：下滑隐藏、上滑出现。 */
    const bar = document.querySelector('[data-shell-bar]');
    let rafId = 0;
    let lastY = window.scrollY || document.documentElement.scrollTop || 0;
    const staticHeader = document.body.dataset.headerScroll === 'static';
    const syncScrollState = () => {
      if (staticHeader) {
        document.body.classList.remove('is-scrolled', 'header-hidden', 'bar-takeover');
        return;
      }
      rafId = 0;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const scrolled = y > 12;
      document.body.classList.toggle('is-scrolled', scrolled);
      if (brandLogo) {
        const want = scrolled ? LOGO_DARK : restLogo;
        if (brandLogo.getAttribute('src') !== want) brandLogo.setAttribute('src', want);
      }

      const navOpen = menus.some((menu) => menu.open);
      const delta = y - lastY;
      let hide = document.body.classList.contains('header-hidden');
      if (y <= 12 || navOpen) {
        hide = false;
      } else if (delta > 4) {
        hide = true;
      } else if (delta < -4) {
        hide = false;
      }
      document.body.classList.toggle('header-hidden', hide);
      lastY = y;

      if (bar) {
        const r = bar.getBoundingClientRect();
        document.body.classList.toggle('bar-takeover', r.top <= 1 && r.bottom > 1);
      }
    };
    const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(syncScrollState); };
    if (!staticHeader) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    }
    syncScrollState();

    /* 页脚 Back to top：平滑滚回顶端，并露出页头 */
    document.querySelectorAll('.z02-back-top').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        document.body.classList.remove('header-hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    /* Quote List 角标：数量以 QuoteCart 为唯一口径（见 assets/js/quote-cart.js）。
       旧版自己遍历 z02-home-quote / z02-quote:* 三套 key，跟加购方和落地页各算各的，
       才会出现「角标有 8、Quote List 却是空的」。现在只问 QuoteCart 要一个数。 */
    const qdCopy = () => {
      const el = document.getElementById('qd-i18n');
      if (!el) return {};
      try { return JSON.parse(el.textContent) || {}; } catch (e) { return {}; }
    };
    const syncQuoteBadges = () => {
      const CART = window.QuoteCart;
      const total = CART ? CART.count() : 0;
      /* 发现旧草稿但还没确认是不是同一个人 —— 这时 count() 已经是 0，
         所以绝不能把「上次存了 6 个」当角标打出来，只给一个蓝点。 */
      const pending = Boolean(CART && CART.hasPending && CART.hasPending());
      document.querySelectorAll('[data-quote-badge]').forEach((badge) => {
        if (total > 0) {
          badge.hidden = false;
          badge.textContent = String(total);
        } else {
          badge.hidden = true;
          badge.textContent = '';
        }
      });
      const restore = qdCopy().restore || {};
      document.querySelectorAll('[data-quote-open]').forEach((link) => {
        link.classList.toggle('is-quote-pending', pending);
        if (pending) link.setAttribute('title', restore.badgeTitle || 'Saved quote available');
        else link.removeAttribute('title');
      });
    };
    syncQuoteBadges();
    /* 本标签页的增删改走 QuoteCart 自定义事件；跨标签页由 quote-cart.js 里的
       storage 监听转发成同一个事件，所以这里只订阅一处。 */
    if (window.QuoteCart) window.QuoteCart.subscribe(syncQuoteBadges);
  };

  /* 一律等 DOMContentLoaded 再挂：defer 脚本执行时 readyState 已经是 "interactive"，
     若此时直接 mount，就会赶在 quote-cart.js / quote-drawer.js（同为 defer 但排在后面）
     之前读 window.QuoteCart。等到 DOMContentLoaded，所有 defer 脚本都跑完了。 */
  if (document.readyState === "complete") mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
