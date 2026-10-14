document.addEventListener('DOMContentLoaded',()=>{
 const triggers=[...document.querySelectorAll('.ct-map-open,[data-open-factory-map]')],dialog=document.querySelector('#ct-map-dialog');if(!triggers.length||!dialog)return;let activeTrigger=triggers[0];
 const address='No. 182 Shiyu Road, Dongchong Town, Nansha District, Guangzhou, Guangdong, China',encoded=encodeURIComponent(address);
 dialog.querySelector('.ct-map-directions').href='https://www.google.com/maps/dir/?api=1&destination='+encoded;
 dialog.querySelector('.ct-map-external').href='https://www.google.com/maps/search/?api=1&query='+encoded;
 triggers.forEach(trigger=>trigger.addEventListener('click',()=>{activeTrigger=trigger;const map=dialog.querySelector('iframe');if(!map.getAttribute('src'))map.src='https://www.google.com/maps?q='+encoded+'&output=embed&hl=en';dialog.showModal();dialog.querySelector('.ct-map-close').focus();}));
 dialog.querySelector('.ct-map-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>activeTrigger.focus({preventScroll:true}));
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
});
