document.addEventListener('DOMContentLoaded',()=>{
 const form=document.querySelector('#of-project-form'),extra=document.querySelector('.oem-extra-details'),link=document.querySelector('#of-email-brief'),guidance=document.querySelector('#oem-email-guidance');if(!form)return;
 function reveal(){if(extra&&[...extra.querySelectorAll('input')].some(input=>input.value.trim()))extra.open=true;}
 function emailLimit(){
  const body=document.querySelector('#of-brief-summary').textContent,subject='OEM / ODM Project Brief'+(form.elements.company.value.trim()?' — '+form.elements.company.value.trim():''),href='mailto:postmaster@hauslysmart.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  if(href.length>1900){link.href='mailto:postmaster@hauslysmart.com?subject='+encodeURIComponent(subject);guidance.textContent='This brief is long. Download it and attach it to your email, or copy it into the email draft before sending.';}else{link.href=href;guidance.textContent='Review your message in your email app before sending. You can also download the brief and attach it to your message.';}
 }
 form.addEventListener('input',emailLimit);form.addEventListener('change',emailLimit);
 link.addEventListener('click',emailLimit);
 for(const id of ['of-restore-draft','of-import-legacy'])document.getElementById(id)?.addEventListener('click',()=>{reveal();emailLimit();});
 reveal();emailLimit();
});
