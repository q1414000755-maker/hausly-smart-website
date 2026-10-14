document.addEventListener('DOMContentLoaded',()=>{
const names=['CE','FCC','RoHS','UKCA','ETL','ISO 9001'],dialog=document.querySelector('#cf-preview'),cards=[...document.querySelectorAll('[data-cert]')],filters=[...document.querySelectorAll('[data-filter]')];
function showAll(){cards.forEach(c=>c.hidden=false);filters.forEach(b=>b.setAttribute('aria-pressed','false'))}
filters.forEach(button=>button.addEventListener('click',()=>{const index=button.dataset.filter;cards.forEach(c=>c.hidden=c.dataset.cert!==index);filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('#documents').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}));
document.querySelector('#cf-show-all').addEventListener('click',showAll);
document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#cf-preview-title').textContent=names[Number(button.dataset.preview)]+' — Document Preview';dialog.showModal()}));
document.querySelector('#cf-close').addEventListener('click',()=>dialog.close());showAll();
});
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-request]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#resources').scrollIntoView({behavior:'smooth'})}))});
