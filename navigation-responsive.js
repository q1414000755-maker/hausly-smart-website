(() => {
  const header = document.querySelector('[data-site-shell]');
  const button = header?.querySelector('.site-menu-toggle');
  const nav = header?.querySelector('.z02-shell-nav');
  if (!button || !nav) return;
  const compact = matchMedia('(max-width:1360px)');
  const close = (restore = false) => {
    header.classList.remove('mobile-menu-open');
    document.body.classList.remove('mobile-nav-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
    nav.querySelectorAll('details[open]').forEach(menu => { menu.open = false; });
    if (restore) button.focus();
  };
  button.addEventListener('click', () => {
    if (header.classList.contains('mobile-menu-open')) return close(true);
    header.classList.add('mobile-menu-open');
    document.body.classList.add('mobile-nav-open');
    document.body.classList.remove('header-hidden');
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Close navigation');
  });
  document.addEventListener('keydown', event => {
    if (!header.classList.contains('mobile-menu-open')) return;
    if (event.key === 'Escape') { close(true); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...header.querySelectorAll('a,button,summary')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('pointerdown', event => {
    if (header.classList.contains('mobile-menu-open') && !header.contains(event.target)) close();
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  compact.addEventListener('change', () => close());
})();

document.addEventListener('click',event=>{
 document.querySelectorAll('[data-site-shell] details[open]').forEach(menu=>{
  if(!event.target.closest('[data-site-shell]'))menu.open=false;
 });
});

// Mark the current destination and retain one project link per OEM panel.
(() => {
  const header = document.querySelector('[data-site-shell]');
  if (!header) return;
  const markCurrent = () => {
    const current=location.pathname.replace(/\/$/, '/index.html');
    const sceneView=location.hash==='#home-applications' && /\/index\.html$/.test(current);
    header.querySelectorAll('.z02-shell-nav a[href]').forEach(link=>{
      link.removeAttribute('aria-current');
      const destination=new URL(link.getAttribute('href'),location.href);
      const sameScene=!destination.searchParams.has('application')||destination.searchParams.get('application')===new URLSearchParams(location.search).get('application');
      const homeLink=link.parentElement.classList.contains('z02-shell-nav');
      if(destination.origin===location.origin&&destination.pathname===current&&(!destination.hash||destination.hash===location.hash)&&sameScene&&!(sceneView&&homeLink)){link.setAttribute('aria-current','page');}
    });
    header.querySelectorAll('.z02-menu').forEach(menu=>menu.classList.toggle('is-current',Boolean(menu.querySelector('a[aria-current="page"]'))));
  };
  markCurrent();window.addEventListener('hashchange',markCurrent);
  const oem = header.querySelector('[data-menu="oem"]');
  const featureLink = oem?.querySelector('.new-menu-feature-copy>a');
  if (featureLink && [...oem.querySelectorAll('.new-menu-links a')].some(link => link.href === featureLink.href)) featureLink.remove();
})();