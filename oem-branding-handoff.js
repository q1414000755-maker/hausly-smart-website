/* Preserve brand references and languages in the existing manual enquiry. */
document.addEventListener('DOMContentLoaded',()=>{
 const form=document.querySelector('.oem-branding-migrated .of-mini-form');if(!form)return;
 form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const data=new FormData(form),url=new URL('oem-start-project.html',location.href);url.searchParams.set('model',String(data.get('model')||'Branding / private label project'));url.searchParams.set('notes',['OEM / ODM: Branding & Private Label','Brand reference: '+(data.get('brand')||'To be confirmed'),'Required languages: '+(data.get('languages')||'To be confirmed'),'Artwork, marking method and available areas require model review.'].join('\n'));for(const [key,value] of data.entries()){if(key!=='scope'&&value)url.searchParams.set(key,String(value));}url.searchParams.append('scope',"Branding & Private Label");url.hash='project-form';location.href=url.href;});
});
