/* Application selection handoff: editable draft only, preserving the quote form and product list. */
document.addEventListener('DOMContentLoaded',()=>{
 const params=new URLSearchParams(location.search);
 const applications={residential:'Residential',apartments:'Apartments',villas:'Villas','hotels-guest-rooms':'Hotels & Guest Rooms',offices:'Offices','commercial-buildings':'Commercial Buildings','smart-buildings':'Smart Buildings','lighting-scene-control':'Lighting & Scene Control','hvac-climate-control':'HVAC & Climate Control','curtain-shading-control':'Curtain & Shading Control'};
 const slug=params.get('application');if(!Object.hasOwn(applications,slug))return;
 const clean=(value,max)=>{if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value))return null;return value.trim();};
 let focus=clean(params.get('focus')||'General application planning',180),project=clean(params.get('project')||'Project discussion',100),scene=null;
 if(slug==='residential'){
 const rooms=['Living Room','Bedroom','Kitchen & Dining','Entrance'],projects=['New Build','Renovation','Residential Project'],scenes=['Welcome Home','Evening','Good Night'];
 focus=params.get('room')||'Living Room';project=params.get('project')||'New Build';scene=params.get('scene')||'Welcome Home';if(!rooms.includes(focus)||!projects.includes(project)||!scenes.includes(scene))return;
 }
 if(!focus||!project)return;
 const field=document.getElementById('inquiry-requirements'),feedback=document.getElementById('inquiry-feedback');if(!field||!feedback)return;
 const key='hauslysmart-application-review-v2:'+JSON.stringify([slug,focus,project,scene]),ttl=30*60*1000;let review=null;
 try{review=JSON.parse(sessionStorage.getItem(key));}catch{}
 const valid=review?.version===2&&typeof review.value==='string'&&review.value.length<=40000&&Number.isFinite(review.at)&&review.at<=Date.now()+60000&&Date.now()-review.at<ttl;
 const brief=[applications[slug].toUpperCase()+' PROJECT','Application: '+applications[slug],(slug==='residential'?'Selected room: ':'Configuration focus: ')+focus,'Project type: '+project,...(scene?['Suggested scene: '+scene]:[]),'Please review plans, quantities, finishes, installation and product compatibility.','','PRODUCT REQUIREMENTS',''].join('\n');
 field.value=valid?review.value:brief+field.value;
 feedback.textContent='Your '+applications[slug].toLowerCase()+' selections are ready. Review and edit the draft before sharing it with our team.';
 const save=()=>{try{sessionStorage.setItem(key,JSON.stringify({version:2,at:Date.now(),value:field.value}));}catch{feedback.textContent='Review and copy your application brief before leaving this page.';}};
 save();field.addEventListener('input',save);
},{once:true});

