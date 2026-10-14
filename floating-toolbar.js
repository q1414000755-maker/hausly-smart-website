(() => {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const url = path => new URL(path, base).href;
  const load = path => new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = url(path);
    script.onload = resolve; script.onerror = reject; document.head.append(script);
  });
  const icon = path => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  async function mount() {
    if (document.querySelector('[data-ft-ready]')) return;
    document.querySelector('.ft-tools')?.remove();
    const tools = document.createElement('aside');
    tools.className = 'ft-tools'; tools.dataset.ftReady = ''; tools.setAttribute('aria-label','Quick assistance');
    tools.innerHTML = `<section class="ft-panel ft-list-panel" id="ft-list-panel" aria-labelledby="ft-list-title" hidden>
      <div class="ft-panel-head"><span class="ft-eyebrow">YOUR PRODUCT SELECTION</span><h2 class="ft-panel-title" id="ft-list-title">Quote List <span class="ft-head-count">0</span></h2><p class="ft-panel-copy ft-list-summary">Review your selected products.</p><button class="ft-close" type="button" aria-label="Close quote list">×</button></div>
      <div class="ft-list-content"></div><div class="ft-panel-body ft-list-foot"><a class="ft-primary" href="${url('quote-list.html')}">View full Quote List <span aria-hidden="true">→</span></a><a class="ft-secondary" href="${url('products.html')}">Continue selecting products <span aria-hidden="true">↗</span></a></div>
    </section>
    <section class="ft-panel" id="ft-contact-panel" aria-labelledby="ft-contact-title" hidden><div class="ft-panel-head"><span class="ft-eyebrow">HAUSLYSMART · PROJECT SUPPORT</span><h2 class="ft-panel-title" id="ft-contact-title">Let’s talk about<br>your project.</h2><p class="ft-panel-copy">Product selection, customization or a new idea. Start a conversation with us.</p><button type="button" class="ft-close" aria-label="Close contact panel">×</button></div><div class="ft-panel-body"><span class="ft-email-label">Email our team</span><a class="ft-email" href="mailto:postmaster@hauslysmart.com">postmaster@hauslysmart.com</a><a class="ft-primary" href="${url('oem-start-project.html')}">Start an OEM inquiry <span aria-hidden="true">↗</span></a><a class="ft-secondary" href="${url('contact.html')}">View contact details <span aria-hidden="true">→</span></a></div></section>
    <section class="ft-panel" id="ft-wechat-panel" aria-labelledby="ft-wechat-title" hidden><div class="ft-panel-head"><span class="ft-eyebrow">CHAT WITH OUR TEAM</span><h2 class="ft-panel-title" id="ft-wechat-title">WeChat</h2><p class="ft-panel-copy">Scan with WeChat to add our team.</p><button type="button" class="ft-close" aria-label="Close WeChat panel">×</button></div><div class="ft-panel-body"><img class="ft-chat-qr" src="${url('assets/images/contact/chat/wechat-qr.png')}" alt="WeChat QR code for Hauslysmart" width="688" height="690"><span class="ft-email-label">WeChat account</span><strong class="ft-wechat-account">19964058742</strong><button type="button" class="ft-primary ft-copy-wechat">Copy WeChat Account</button><a class="ft-qr-save" href="${url('assets/images/contact/chat/wechat-qr.png')}" download="Hauslysmart-WeChat-QR.png">Save QR Code ↓</a><p class="ft-copy-status" role="status" aria-live="polite"></p></div></section>
<section class="ft-panel" id="ft-whatsapp-panel" aria-labelledby="ft-whatsapp-title" hidden><div class="ft-panel-head"><span class="ft-eyebrow">HAUSLYSMART · WHATSAPP</span><h2 class="ft-panel-title" id="ft-whatsapp-title">Chat on WhatsApp</h2><p class="ft-panel-copy">Scan with WhatsApp to start a chat.</p><button type="button" class="ft-close" aria-label="Close WhatsApp panel">×</button></div><div class="ft-panel-body"><img class="ft-chat-qr" src="${url('assets/images/contact/chat/whatsapp-qr.png')}" alt="WhatsApp Business QR code for Hauslysmart" width="621" height="621"><a class="ft-primary" href="https://wa.me/message/NAQ4CB5AC2I2P1?src=qr" target="_blank" rel="noopener noreferrer">Start Chat ↗</a><a class="ft-qr-save" href="${url('assets/images/contact/chat/whatsapp-qr.png')}" download="Hauslysmart-WhatsApp-QR.png">Save QR Code ↓</a></div></section>
    <div class="ft-rail"><button type="button" class="ft-item ft-quote ft-list-trigger" aria-expanded="false" aria-controls="ft-list-panel">${icon('M5 3h14v18H5ZM8 8h8M8 12h8M8 16h5')}<span>Quote List</span><span class="ft-count" hidden>0</span><span class="ft-pending" hidden></span></button><button type="button" class="ft-item ft-contact" aria-expanded="false" aria-controls="ft-contact-panel">${icon('M4 12a8 8 0 0 1 16 0v5M4 12v5M4 12H3v6h4v-6H4Zm16 0h1v6h-4v-6h3ZM20 18c0 3-3 3-7 3')}<span>Contact</span></button><button type="button" class="ft-item ft-whatsapp" aria-expanded="false" aria-controls="ft-whatsapp-panel" aria-label="WhatsApp">${icon('M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.7-4.5A9 9 0 1 1 21 11.5ZM8 7c0 5 4 9 9 9M8 7l2 3-1 1M17 16l-3-2-1 1')}<span>WhatsApp</span></button><button type="button" class="ft-item ft-wechat" aria-expanded="false" aria-controls="ft-wechat-panel">${icon('M14 14a7 7 0 1 1 2-5M4 15l-1 3 4-1M21 15a5 5 0 1 0-3 4l3 2-1-4M7 8h.01M11 8h.01M14 14h.01M18 14h.01')}<span>WeChat</span></button><a class="ft-item ft-oem" href="${url('oem-start-project.html')}">${icon('M14 3H5v18h14V10M14 3v7h5M14 3l5 7M8 13h8M8 17h5')}<span>OEM Inquiry</span></a><button type="button" class="ft-item ft-top" aria-label="Back to top">${icon('m6 13 6-6 6 6M12 7v13M5 3h14')}<span>Top</span></button></div><div class="ft-toast" role="status" aria-live="polite" hidden></div>`;
    document.body.append(tools);
    const panels = [...tools.querySelectorAll('.ft-panel')];
    const triggers = [...tools.querySelectorAll('[aria-controls]')];
    function close(focus = false) {
      const active = triggers.find(t => t.getAttribute('aria-expanded') === 'true');
      panels.forEach(p => p.hidden = true); triggers.forEach(t => t.setAttribute('aria-expanded','false'));
      if (focus) active?.focus();
    }
    tools.querySelector('.ft-copy-wechat').addEventListener('click',async()=>{const status=tools.querySelector('.ft-copy-status');try{await navigator.clipboard.writeText('19964058742');status.textContent='WeChat account copied.';}catch{status.textContent='Copy the account number above and search for it in WeChat.';}});
    let catalogPromise;
    function catalog() {
      if (window.Z02_CATALOG) return Promise.resolve();
      return catalogPromise ||= load('assets/js/quote-catalog.js').catch(() => { catalogPromise = null; });
    }
    async function activate(t, forceQr = false) {
      if(t.classList.contains('ft-whatsapp') && matchMedia('(max-width:600px)').matches && !forceQr){window.open('https://wa.me/message/NAQ4CB5AC2I2P1?src=qr','_blank','noopener,noreferrer');return;}
      const open = t.getAttribute('aria-expanded') !== 'true'; close();
      if (!open) return;
      t.setAttribute('aria-expanded','true'); const panel = document.getElementById(t.getAttribute('aria-controls')); panel.hidden = false; panel.querySelector('.ft-close')?.focus({preventScroll:true});
      if (t.classList.contains('ft-list-trigger')) { render(); await catalog(); render(); }
    }
    triggers.forEach(t => t.addEventListener('click',()=>activate(t)));
    window.addEventListener('hausly:show-chat-qr',event=>{const channel=event.detail?.channel;if(channel==='wechat'||channel==='whatsapp'){const t=tools.querySelector('.ft-'+channel);if(t.getAttribute('aria-expanded')==='true')close();activate(t,true);}});
    tools.querySelectorAll('.ft-close').forEach(b => b.addEventListener('click',() => close(true)));
    document.addEventListener('click',e => { if (!tools.contains(e.target) && !e.target.closest('[data-chat-qr]')) close(); });
    document.addEventListener('keydown',e => { if (e.key === 'Escape') close(true); });
    tools.querySelector('.ft-top').addEventListener('click',() => window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));
    const esc = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const count = tools.querySelector('.ft-count');
    const content = tools.querySelector('.ft-list-content');
    const trigger = tools.querySelector('.ft-list-trigger');
    let previous = new Map(); let toastTimer;
    function render(event) {
      const cart = window.QuoteCart;
      const lines = cart?.lines() || []; const pending = !!cart?.hasPending();
      count.textContent = lines.length > 99 ? '99+' : String(lines.length); count.hidden = !lines.length;
      tools.querySelector('.ft-pending').hidden = !pending;
      trigger.setAttribute('aria-label',`Quote List, ${lines.length} product configuration${lines.length===1?'':'s'}${pending?', saved list available':''}`);
      tools.querySelector('.ft-head-count').textContent = String(lines.length);
      tools.querySelector('.ft-list-summary').textContent = lines.length ? `${lines.length} configuration${lines.length===1?'':'s'} · ${cart.totalQty().toLocaleString()} unit${cart.totalQty()===1?'':'s'}` : 'Review your selected products.';
      if (!lines.length) {
        content.innerHTML = pending ? '<div class="ft-empty"><strong>Saved Quote List available</strong><p>Restore your previous product selection to continue.</p><button type="button" class="ft-restore">Restore saved list</button></div>' : '<div class="ft-empty"><strong>Your list is ready for products.</strong><p>Configure a product, then choose “Add to Quote List”. Your selections will appear here.</p></div>';
        content.querySelector('.ft-restore')?.addEventListener('click',async () => { cart.restore(); await catalog(); render(); });
      } else {
        const models = window.Z02_CATALOG?.models || {};
        content.innerHTML = '<ul class="ft-products">'+lines.map(line => {
          const rec = models[line.model]; const variant = rec?.variants?.find(v => v.variant_id === line.variant_id);
          const attrs = Object.keys(line.attrs || {}).length ? line.attrs : (variant?.attrs || rec?.attrs || {});
          const summary = window.Z02_CONFIG_SUMMARY?.(rec,attrs,3);
          const hasOwn = Object.keys(line.attrs || {}).length > 0;
          const fallback = Object.entries(attrs).map(([k,v])=>`${k}: ${[].concat(v).join(' / ')}`).join(' · ');
          const image = variant?.image || rec?.image;
          const imageUrl = image ? url(String(image).replace(/^\//,'')) : '';
          const validImage = imageUrl && new URL(imageUrl).origin === base.origin;
          return `<li class="ft-product"><div class="ft-thumb">${validImage?`<img src="${esc(imageUrl)}" alt="" loading="lazy">`:icon('M4 4h16v16H4ZM8 8h8v8H8Z')}</div><div class="ft-product-info"><a href="${url(rec?.familyPage || 'quote-list.html')}">${esc(rec?.name || line.model)}</a><small>${esc(variant?.sku || rec?.sku || line.model)}</small><p title="${esc(summary?.full || fallback)}">${hasOwn?'':'Default: '}${esc(summary?.text || fallback || 'Configuration not selected')}${summary?.hidden?` +${summary.hidden}`:''}</p><span class="ft-qty">Qty ${Number(line.qty).toLocaleString()}</span></div></li>`;
        }).join('')+'</ul>';
      }
      const next = new Map(lines.map(l=>[l.key,l.qty]));
      const added = lines.some(l=>!previous.has(l.key) || l.qty>previous.get(l.key));
      if (event?.detail?.reason === 'cart' && added && !document.querySelector('[data-quote-toast]')) {
        const toast = tools.querySelector('.ft-toast'); toast.textContent = 'Added to Quote List'; toast.hidden = false;
        clearTimeout(toastTimer); toastTimer = setTimeout(()=>toast.hidden=true,2400);
      }
      previous = next;
    }
    if (!window.QuoteCart) { try { await load('assets/js/quote-cart.js'); } catch {} }
    render(); window.QuoteCart?.subscribe(render);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();
