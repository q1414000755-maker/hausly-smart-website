/* Local OEM concept controls and an explicit, browser-local project draft. */
(()=>{'use strict';
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 // Colour selection: update its visible state and the actual brief destination.
 $$('.of-swatch').forEach(button=>button.addEventListener('click',()=>{
   $$('.of-swatch').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   $('#of-colour-value').textContent=button.dataset.colour;
   const a=$('#of-colour-link'),url=new URL(a.href);url.searchParams.set('colour',button.dataset.colour);a.href=url.href;
   const form=$('.of-mini-form');let field=$('[name=colour]',form);if(!field){field=document.createElement('input');field.type='hidden';field.name='colour';form.append(field);}field.value=button.dataset.colour;
 }));
 // A diagram, not a specification: controls and the summary always match.
 const config=$('#of-config');
 if(config){config.addEventListener('change',()=>{
   const data=new FormData(config);const count=Number.parseInt(data.get('layout'),10);
   const holder=$('.of-switch-buttons');holder.replaceChildren(...Array.from({length:count},()=>document.createElement('i')));holder.dataset.count=String(count);
   const model=$('.of-switch-model');model.setAttribute('aria-label',`Concept switch with ${count} controls`);
   model.style.background=({White:'linear-gradient(145deg,#fff,#dce3ea)',Graphite:'linear-gradient(145deg,#585e65,#282e35)',Champagne:'linear-gradient(145deg,#f3e5d4,#bda789)'})[data.get('colour')];
   $$('[data-config-summary]').forEach(el=>el.textContent=data.get(el.dataset.configSummary));
 });}
 const app=$('#of-app-preview');
 if(app){
   app.elements.navigation.value='Bottom bar';app.elements.languages.value='English';
   $('#of-brand-input').addEventListener('input',ev=>$('#of-app-brand').textContent=ev.target.value.trim()||'YOUR BRAND');
   $$('[data-theme]').forEach(b=>b.addEventListener('click',()=>{ $$('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('.of-phone').style.setProperty('--app-accent',b.dataset.themeColour);app.elements.theme.value=b.dataset.theme;}));
   app.elements.navigation.addEventListener('change',ev=>$('.of-phone-nav').dataset.mode=ev.target.value||'Bottom bar');
 }
 const form=$('#of-project-form');if(!form)return;
 const key='hausly:oem-project-brief:v2',status=$('#of-project-status'),summary=$('#of-brief-summary');
 const names=['model','market','quantity','timing','brand','languages','material','colour','surface','layout','function','installation','electrical','protocol','platform','interface','theme','navigation','packtype','documents','notes','name','company','email'];
 const labels={model:'Base product / reference',market:'Target market',quantity:'Estimated quantity',timing:'Target timing',brand:'Brand reference',languages:'Languages',material:'Material direction',colour:'Colour direction',surface:'Surface preference',layout:'Control layout',function:'Control function',installation:'Installation reference',electrical:'Electrical requirements',protocol:'Protocol direction',platform:'Target platform',interface:'Interface type',theme:'Interface theme',navigation:'Navigation direction',packtype:'Pack type',documents:'Required documents',notes:'Project notes',name:'Contact name',company:'Company',email:'Email address'};
 const scopes=$$('input[name=scope]',form).map(x=>x.value);
 const read=()=>{const data={version:2,scope:$$('input[name=scope]:checked',form).map(x=>x.value)};names.forEach(n=>data[n]=form.elements[n].value.trim());return data;};
 const fill=(data,onlyEmpty=false)=>{if(!data||typeof data!=='object'||Array.isArray(data))return;for(const n of names){if(typeof data[n]==='string'&&(!onlyEmpty||!form.elements[n].value))form.elements[n].value=data[n].slice(0,n==='notes'?5000:160);}if(Array.isArray(data.scope))$$('input[name=scope]',form).forEach(el=>{el.checked=(onlyEmpty&&el.checked)||data.scope.includes(el.value);});};
 const brief=()=>{const d=read();return ['Hauslysmart — OEM / ODM Project Brief','',`Scope: ${d.scope.join(', ')||'To be reviewed'}`,...names.filter(n=>d[n]).map(n=>`${labels[n]}: ${d[n]}`),'','Configuration and availability require project review.'].join('\n');};
 const refresh=()=>{const text=brief();summary.textContent=text;$('#of-email-brief').href='mailto:postmaster@hauslysmart.com?subject='+encodeURIComponent('OEM / ODM Project Brief'+(read().company?' — '+read().company:''))+'&body='+encodeURIComponent(text);};
 const parse=(storageKey)=>{try{const v=JSON.parse(localStorage.getItem(storageKey)||'null');return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch{return null;}};
 const saved=parse(key);if(saved){$('#of-saved-notice').hidden=false;}
 $('#of-restore-draft').addEventListener('click',()=>{const current=read();fill(saved);fill(current,true);$('#of-saved-notice').hidden=true;status.textContent='Saved draft restored. New details were added where saved fields were empty; review any overlapping requirements. Nothing has been sent.';refresh();});
 const appearance=parse('hauslysmart:appearance-brief:v1'),branding=parse('hauslysmart:branding-brief:v1');
 if(appearance||branding)$('#of-legacy-notice').hidden=false;
 $('#of-import-legacy').addEventListener('click',()=>{
   if(appearance)fill({model:appearance.model,scope:['Colors & Finishes','Product Customization'],notes:[appearance.notes,appearance.basis?'Earlier design basis: '+appearance.basis:'',Array.isArray(appearance.priorities)?'Earlier priorities: '+appearance.priorities.filter(x=>typeof x==='string').join(', '):''].filter(x=>typeof x==='string'&&x).join('\n')},true);
   if(branding)fill({model:branding.model,brand:branding.reference,languages:branding.languages,scope:['Branding & Private Label'],notes:branding.notes},true);
   $('#of-legacy-notice').hidden=true;status.textContent='Earlier draft details added where fields were empty. Review and save the combined brief.';refresh();
 });
 const params=new URLSearchParams(location.search),incoming={};for(const n of names){if(params.get(n)?.trim())incoming[n]=params.get(n);}incoming.scope=params.getAll('scope').filter(x=>scopes.includes(x));fill(incoming);
 form.addEventListener('input',refresh);form.addEventListener('change',refresh);
 form.addEventListener('submit',ev=>{ev.preventDefault();try{localStorage.setItem(key,JSON.stringify(read()));status.textContent='Draft saved in this browser. Nothing has been sent.';}catch{status.textContent='This browser could not save the draft. Please copy or download it to keep your work.';}});
 $('#of-clear-draft').addEventListener('click',()=>{try{localStorage.removeItem(key);$('#of-saved-notice').hidden=true;status.textContent='Saved browser draft cleared. The current form is still available to copy or download.';}catch{status.textContent='This browser could not clear the saved draft.';}});
 $('#of-download-brief').addEventListener('click',()=>{if(!form.reportValidity())return;const url=URL.createObjectURL(new Blob(['\uFEFF'+brief()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Hauslysmart-OEM-project-brief.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Brief downloaded. Review it before sharing with our team.';});
 $('#of-copy-brief').addEventListener('click',async()=>{if(!form.reportValidity())return;try{await navigator.clipboard.writeText(brief());status.textContent='Brief copied. Nothing has been sent.';}catch{const selection=getSelection(),range=document.createRange();range.selectNodeContents(summary);selection.removeAllRanges();selection.addRange(range);status.textContent='Select and copy the brief shown in the summary.';}});
 $('#of-email-brief').addEventListener('click',ev=>{if(!form.reportValidity()){ev.preventDefault();return;}refresh();status.textContent='Opening an email draft. Review and send it in your email app.';});
 refresh();
})();
