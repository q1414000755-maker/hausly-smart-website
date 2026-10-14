document.addEventListener('DOMContentLoaded',()=>{
 const root=document.querySelector('[data-pdp-v3]'); if(!root||!root.querySelector('.hero-copy')){document.querySelectorAll('main a[href]').forEach(a=>{const h=a.getAttribute('href');if(h?.startsWith('../../'))a.setAttribute('href','/'+h.slice(6));});return;}
 const titles={'screen-02':'Product Highlights','screen-03':'Appearance & Structure','screen-04':'Product Configuration','screen-05':'Technical Specifications','screen-06':'Installation & Documents','screen-07':'Functions & Compatibility','screen-08':'Materials & Finishes','screen-09':'OEM / ODM Options','screen-10':'Related Products','screen-11':'Product Inquiry'};
 Object.entries(titles).forEach(([id,title])=>{const heading=root.querySelector('#'+id+' h2');if(heading)heading.textContent=title;});
 const nav=document.createElement('nav');nav.className='detail-section-nav';nav.setAttribute('aria-label','Product detail sections');[['screen-01','Overview'],['screen-04','Configuration'],['screen-05','Specifications'],['screen-06','Installation'],['screen-09','Customization'],['screen-11','Inquiry']].forEach(([id,label])=>{if(!root.querySelector('#'+id))return;const a=document.createElement('a');a.href='#'+id;a.textContent=label;nav.append(a);});root.prepend(nav);
 root.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href');if(/^products\/[^?#]+\/$/.test(href||''))a.href=href+'index.html';});
});
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href');if(href?.startsWith('#'))a.setAttribute('href',location.pathname+href);});});

document.addEventListener('click',event=>{
 const a=event.target.closest('a[href]');if(!a)return;
 let href=a.getAttribute('href');
 if(a.closest('[data-pdp-v3]')){
  if(/View Installation Guide/i.test(a.textContent))href='#screen-06';
  if(/Discuss Customization/i.test(a.textContent))href='#screen-11';
  if(/Explore OEM & ODM/i.test(a.textContent))href='/oem-product-customization.html';
 }
 if(href?.startsWith('#')&&document.querySelector(href)){
  a.setAttribute('href',location.pathname+href);
 }else if(href!==a.getAttribute('href'))a.setAttribute('href',href);
},true);

document.addEventListener('DOMContentLoaded',()=>{
 const main=document.querySelector('body.content-page main');if(!main||!location.pathname.startsWith('/products/'))return;
 main.querySelectorAll('td,strong').forEach(node=>{if(node.textContent.trim()==='-')node.textContent='To be confirmed';});
 const heading=main.querySelector('h2');if(heading)heading.textContent='Technical Specifications';
 const model=main.querySelector('h1')?.textContent.trim()||'Product';
 const section=document.createElement('section');section.className='detail-completion';
 [['Installation & Documents','Confirm the installation standard, mounting dimensions, power requirements and wiring for this model before ordering. Model-specific documents are awaiting customer information.'],['Materials & Customization','Color, panel material, logo and packaging requirements can be reviewed for your project. Availability, MOQ and lead time require confirmation.'],['Product Inquiry','Request the confirmed specifications and a quotation for '+model+'. Reference prices are indicative; the final configuration and commercial terms must be confirmed.']].forEach(([title,copy])=>{const block=document.createElement('div');const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=copy;block.append(h,p);section.append(block);});
  const docs=document.createElement('div');docs.className='pending-document-grid';
 ['Technical Datasheet','Installation Guide','Wiring Diagram','Certificates'].forEach(name=>{const card=document.createElement('div');const title=document.createElement('h3');title.textContent=name;const status=document.createElement('p');status.textContent='Awaiting product documentation';const button=document.createElement('button');button.type='button';button.disabled=true;button.textContent='Document pending';card.append(title,status,button);docs.append(card);});section.firstElementChild.append(docs);
 const nav=document.createElement('nav');nav.className='detail-section-nav';nav.setAttribute('aria-label','Product detail sections');
 const overview=main.querySelector('h1')?.closest('section');if(overview)overview.id='product-overview';
 const specifications=heading?.closest('section');if(specifications)specifications.id='product-specifications';
 [['product-overview','Overview'],['product-specifications','Specifications']].forEach(([id,label])=>{if(!main.querySelector('#'+id))return;const a=document.createElement('a');a.href=location.pathname+'#'+id;a.textContent=label;nav.append(a);});
 Array.from(section.children).forEach((block,index)=>{block.id=['product-installation','product-customization','product-inquiry'][index];const a=document.createElement('a');a.href=location.pathname+'#'+block.id;a.textContent=['Installation & Documents','Customization','Inquiry'][index];nav.append(a);});main.prepend(nav);
 const notice=document.createElement('p');notice.className='product-data-notice';notice.textContent='Product information is awaiting customer confirmation. Images, specifications and reference prices will be updated when the confirmed information is supplied.';main.querySelector('h1')?.after(notice);
 const inquiry=document.createElement('a');inquiry.className='button dark';inquiry.href='/request-a-quote.html?model='+encodeURIComponent(model);inquiry.textContent='Confirm Specifications & Request Quote →';section.lastElementChild.append(inquiry);main.append(section);
});

document.addEventListener('DOMContentLoaded',()=>{
 const product=document.querySelector('.quote-product'),summary=product?.querySelector(':scope>div');if(!summary)return;
 let last=0;
 const fit=()=>{
  if(innerWidth<=700)return;
  const style=getComputedStyle(product),available=product.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-parseFloat(style.columnGap);
  const size=Math.min(summary.getBoundingClientRect().height,Math.max(160,available-260));
  if(Math.abs(size-last)>1){last=size;product.style.setProperty('--quote-image-size',size+'px');}
 };
 new ResizeObserver(fit).observe(summary);window.addEventListener('resize',fit);fit();
});

document.addEventListener('click',event=>{
 const link=event.target.closest('a');if(!link||!link.closest('[data-pdp-v3]')||!link.textContent.includes('Request a Sample'))return;
 const root=link.closest('[data-pdp-v3]'),model=root.dataset.pdpModel||new URLSearchParams(location.search).get('model')||root.querySelector('h1')?.textContent;
 const config=root.querySelector('.hero-actions>strong')?.textContent||'',quantity=root.querySelector('[data-pdp-quantity]')?.value||'1';
 link.href='/request-a-quote.html?sample=1&model='+encodeURIComponent(model)+'&configuration='+encodeURIComponent(config)+'&quantity='+encodeURIComponent(quantity);
},true);
