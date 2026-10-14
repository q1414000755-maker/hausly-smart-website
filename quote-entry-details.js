document.addEventListener('DOMContentLoaded',()=>{
 const form=document.getElementById('quote-details-form'),field=document.getElementById('inquiry-requirements'),status=document.getElementById('quote-details-status');
 if(!form||!field)return;
 let added='';
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const data=new FormData(form),lines=['CONTACT DETAILS','Contact name: '+data.get('name'),'Company: '+data.get('company'),'Business email: '+data.get('email'),'Country / region: '+data.get('country'),'','PRODUCT / PROJECT REQUIREMENTS',''];
  const existing=added&&field.value.startsWith(added)?field.value.slice(added.length):field.value;
  added=lines.join('\n');field.value=added+existing;field.dispatchEvent(new Event('input',{bubbles:true}));
  status.textContent='Your details have been added. Review the complete draft before sending.';
 });
});
