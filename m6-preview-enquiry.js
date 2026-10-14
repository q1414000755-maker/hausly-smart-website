document.addEventListener('DOMContentLoaded',()=>{
 const p=new URLSearchParams(location.search);if(p.get('model')!=='src03-m6')return;
 const field=document.getElementById('inquiry-requirements'),feedback=document.getElementById('inquiry-feedback');if(!field)return;
 const config=p.get('configuration')||'M6 configuration review';if(config.length>240||/[\u0000-\u001f]/.test(config))return;
 const quantity=Math.max(1,Math.min(99999,Math.floor(Number(p.get('quantity')))||1));
 const types={'bulk-pricing':'Bulk pricing enquiry','connectivity-review':'Connectivity review',document:'Product document request'};
 const documents=['Datasheet','User Manual','Installation Guide'];const doc=documents.includes(p.get('document'))?p.get('document'):'';
 const type=p.get('sample')==='1'?'Sample request':types[p.get('request')]||'Product quotation';
 const brief=['M6 PROJECT BRIEF','Request: '+type,'Product: M6 Smart Switch','Configuration: '+config,'Quantity: '+quantity,...(p.get('variant')?['Catalog variant: '+p.get('variant').slice(0,80)]:[]),...(doc?['Requested document: '+doc]:[]),'Please confirm model suitability, reference pricing and delivery terms.','','ADDITIONAL REQUIREMENTS','Project / destination country:','Customization requirements:'].join('\n');
 field.value=brief;if(feedback)feedback.textContent='Your M6 configuration is ready. Review and edit this draft before sharing it.';
},{once:true});
