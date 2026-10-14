document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('[data-chat-qr]').forEach(button=>button.addEventListener('click',()=>{
  if(!document.querySelector('[data-ft-ready]'))return;
  window.dispatchEvent(new CustomEvent('hausly:show-chat-qr',{detail:{channel:button.dataset.chatQr}}));
 }));
});
