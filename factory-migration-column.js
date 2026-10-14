document.addEventListener('DOMContentLoaded',()=>{
 const dialog=document.querySelector('#fq-photo-dialog');if(!dialog)return;
 const image=document.querySelector('#fq-photo-image'),title=document.querySelector('#fq-photo-title');let trigger;
 document.querySelectorAll('[data-fq-photo]').forEach(button=>button.addEventListener('click',()=>{trigger=button;image.src=button.dataset.fqPhoto;image.alt=button.dataset.fqTitle;title.textContent=button.dataset.fqTitle;dialog.showModal()}));
 document.querySelector('#fq-photo-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>trigger?.focus());
});
