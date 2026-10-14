/* Carry the visible OEM process brief to the manual enquiry draft. */
document.addEventListener('DOMContentLoaded',()=>{
 const form=document.querySelector('.oem-process-migrated .of-mini-form');if(!form)return;
 form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const data=new FormData(form),url=new URL('oem-start-project.html',location.href);url.searchParams.set('model',String(data.get('model')||'OEM / ODM project'));url.searchParams.set('notes',['OEM / ODM Process','Target market: '+(data.get('market')||'To be confirmed'),'Key requirement: '+(data.get('notes')||'To be discussed'),'Scope, samples, quantity and timing require project review.'].join('\n'));for(const [key,value] of data.entries()){if(key!=='scope'&&value)url.searchParams.set(key,String(value));}url.hash='project-form';location.href=url.href;});
});
