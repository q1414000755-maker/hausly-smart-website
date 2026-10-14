/* Opens an email draft or downloads it; this page never sends a message. */
document.addEventListener('DOMContentLoaded',()=>{
  const email=window.HAUSLYSMART_CONTACT?.enquiryEmail||'';
  if(!/^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/.test(email))return;
  document.querySelectorAll('[data-contact-email]').forEach(a=>{a.textContent=email;a.href='mailto:'+email;});
  const field=document.getElementById('inquiry-requirements');
  const compose=document.getElementById('inquiry-email-compose');
  const download=document.getElementById('inquiry-email-download');
  const delivery=document.getElementById('inquiry-delivery-status');
  if(!field||!compose||!download||!delivery)return;
  const subject=new URLSearchParams(location.search).has('support-enquiry')
    ?'Hauslysmart support enquiry'
    :'Hauslysmart product and project enquiry';
  const update=()=>{
    const body=field.value.trim();
    const mailto='mailto:'+email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    compose.href=mailto.length<=1900?mailto:'mailto:'+email+'?subject='+encodeURIComponent(subject);
    compose.dataset.fullBody=String(mailto.length<=1900);
    delivery.textContent=mailto.length<=1900
      ?'You review and send from your email application. This page does not send automatically.'
      :'Download your long enquiry as a complete email draft, or copy its text into your email application. Nothing has been sent.';
  };
  update();field.addEventListener('input',update);
  compose.addEventListener('click',()=>{
    update();
    delivery.textContent=compose.dataset.fullBody==='true'
      ?'Review the draft in your email application and send it when ready. This page has not sent a message.'
      :'Your draft is long. Copy its text into the email, or download the full email draft below. This page has not sent a message.';
  });
  download.addEventListener('click',()=>{
    const body=field.value.replace(/\r?\n/g,'\r\n');
    const text=['To: '+email,'Subject: '+subject,'X-Unsent: 1','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: 8bit','',''+body].join('\r\n');
    const url=URL.createObjectURL(new Blob([text],{type:'message/rfc822'}));
    const a=document.createElement('a');a.href=url;a.download='hauslysmart-enquiry.eml';a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    delivery.textContent='Email draft downloaded. Open it in your email application to review and send; nothing has been sent by this page.';
  });
});
