#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),POLICY=require('../seo/release-config.json'),ORIGIN=new URL(POLICY.canonicalOrigin).origin;
const APPROVED=new Set(POLICY.approvedProductModels||[]),APPROVED_OFFERS=new Set(POLICY.approvedOfferModels||[]);
const file=rel=>path.join(ROOT,rel),read=rel=>fs.readFileSync(file(rel),'utf8');
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const match=(html,re)=>(html.match(re)||[])[1]||'';
const attr=(tag,name)=>{const m=tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27)','i'));return m?(m[1]===undefined?m[2]:m[1]):'';};
const meta=(html,name)=>(html.match(/<meta\b[^>]*>/gi)||[]).find(t=>attr(t,'name').toLowerCase()===name)||'';
const canonical=html=>{const t=(html.match(/<link\b[^>]*>/gi)||[]).find(x=>attr(x,'rel').toLowerCase().split(/\s+/).includes('canonical'));return t?attr(t,'href'):'';};
function inspect(html){
 const main=match(html,/<main\b[^>]*>([\s\S]*?)<\/main>/i)||html;
 const robots=attr(meta(html,'robots'),'content').toLowerCase();
 return {title:clean(match(html,/<title[^>]*>([\s\S]*?)<\/title>/i)),description:attr(meta(html,'description'),'content'),
   h1s:[...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(x=>clean(x[1])),
   robots,canonical:canonical(html),indexable:!/\bnoindex\b/.test(robots)};
}
function productsIn(obj){
 const items=Array.isArray(obj)?obj:obj&&Array.isArray(obj['@graph'])?obj['@graph']:[obj];
 return items.filter(x=>x&&(x['@type']==='Product'||Array.isArray(x['@type'])&&x['@type'].includes('Product')));
}
function sanitizeProductSchema(html,modelId){
 let removed=0,strippedOffers=0;
 const result=html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,full=>{
  let doc;try{doc=JSON.parse(match(full,/>([\s\S]*?)<\/script>/i));}catch{return full;}
  const products=productsIn(doc);if(!products.length)return full;
  if(!APPROVED.has(modelId)){removed++;return '';}
  for(const p of products){
   if(!APPROVED_OFFERS.has(modelId)&&p.offers!==undefined){delete p.offers;strippedOffers++;}
   if(typeof p.image==='string'&&/\/placeholders\//i.test(p.image))delete p.image;
   if(typeof p.sku==='string'&&/\bpending\b/i.test(p.sku))delete p.sku;
  }
  return '<script type="application/ld+json">'+JSON.stringify(doc).replace(/</g,'\\u003c')+'</script>';
 });
 return {html:result,removed,strippedOffers};
}
function sourceModels(){
 const dir=file('legacy-products/_data/products'),map=new Map(),categories=[];
 for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.json'))){
  const data=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')),groups=Array.isArray(data.model_groups)?data.model_groups:[];
  categories.push({category:name.slice(0,-5),groups:groups.length,placeholder:!!data._placeholder?.active});
  for(const item of groups)if(item.model_id)map.set(item.model_id,{item,category:name.slice(0,-5)});
 }
 return {map,categories};
}
const visibleText=html=>clean(html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<!--[\s\S]*?-->/g,' '));
function audit(){
 const findings=[],add=(level,route,code,detail)=>findings.push({level,route,code,detail});
 const {map,categories}=sourceModels();
 const inspected=['index.html','products.html','contact.html',...categories.map(x=>x.category+'.html').filter(x=>fs.existsSync(file(x)))];
 for(const route of inspected){
  const x=inspect(read(route));
  if(x.h1s.length!==1)add('P1',route,'H1_COUNT',String(x.h1s.length));
  if(!x.title||!x.description)add('P1',route,'MISSING_META','Title or description missing');
  if(!x.canonical)add('P1',route,'NO_CANONICAL','Canonical missing');
  if(!x.indexable)add('review',route,'NOINDEX','Verify content readiness before enabling indexing');
  if(x.indexable&&x.canonical&&!x.canonical.startsWith(ORIGIN+'/'))add('P0',route,'NONCANONICAL_DOMAIN',x.canonical);
 }
 const manifest=JSON.parse(read('product-detail-v2-manifest.json')),seen=new Set();
 for(const entry of manifest.pages||[]){
  const route=entry.path.replace(/^\//,'');
  if(seen.has(route))add('P0',route,'DUPLICATE_ROUTE','Manifest duplicate');seen.add(route);
  if(!fs.existsSync(file(route))){add('P0',route,'PAGE_MISSING','Manifest route has no source file');continue;}
  const html=read(route),x=inspect(html),actual=match(html,/data-pdp-model="([^"]+)"/i);
  if(actual!==entry.model)add('P0',route,'MODEL_MISMATCH',actual+' != '+entry.model);
  if(!map.has(entry.model))add('P1',route,'SOURCE_MODEL_MISSING','No matching data model');
  if(x.h1s.length!==1)add('P1',route,'H1_COUNT',String(x.h1s.length));
  if(!x.title||!x.description)add('P1',route,'MISSING_META','Product title/description missing');
  if(x.indexable&&!x.canonical)add('P0',route,'NO_CANONICAL','Indexable product page');
  if(x.indexable&&x.canonical&&!x.canonical.startsWith(ORIGIN+'/'))add('P0',route,'NONCANONICAL_DOMAIN',x.canonical);
  if(x.indexable&&!APPROVED.has(entry.model))add('review',route,'INDEXABLE_UNREVIEWED','Product identity and specifications require manual review');
  if(entry.model!=='src03-m6'&&/\bM6\s*·\s*1-gang smart switch\b/i.test(visibleText(html)))add('P0',route,'M6_TEMPLATE_LEAK','Wrong model text in rendered HTML');
  for(const tag of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
   let doc;try{doc=JSON.parse(tag[1]);}catch(err){add('P0',route,'JSONLD_INVALID',err.message);continue;}
   for(const item of productsIn(doc)){
    if(!APPROVED.has(entry.model))add('P0',route,'UNREVIEWED_PRODUCT_SCHEMA','Product schema needs approval');
    if(item.offers&&!APPROVED_OFFERS.has(entry.model))add('P0',route,'UNREVIEWED_OFFER','Price/offer not approved for schema');
    if(typeof item.image==='string'&&/\/placeholders\//i.test(item.image))add('P1',route,'PLACEHOLDER_SCHEMA_IMAGE',item.image);
   }
  }
 }
 return {sourceSnapshot:'GitHub main imported 2026-10-14, not live HTTP verification',
  canonicalOrigin:ORIGIN,rootPages:inspected.length,productPages:(manifest.pages||[]).length,
  sourceModels:map.size,categories,summary:{P0:findings.filter(x=>x.level==='P0').length,P1:findings.filter(x=>x.level==='P1').length,review:findings.filter(x=>x.level==='review').length},findings};
}
function sitemap(){
 const urls=[],errors=[];
 for(const route of POLICY.approvedIndexRoutes||[]){
  if(!route.startsWith('/')||/[?#]/.test(route)){errors.push('Invalid route: '+route);continue;}
  const rel=route==='/'?'index.html':route.replace(/^\//,'').replace(/\/$/,'/index.html');
  if(!fs.existsSync(file(rel))){errors.push('Missing file: '+rel);continue;}
  const x=inspect(read(rel)),expected=ORIGIN+route;
  if(!x.title||x.h1s.length!==1||!x.description||!x.indexable||x.canonical!==expected){
   errors.push('Not ready: '+route+' '+JSON.stringify({title:!!x.title,h1:x.h1s.length,description:!!x.description,robots:x.robots,canonical:x.canonical}));
   continue;
  }
  urls.push(expected);
 }
 if(errors.length)throw Error(errors.join('\n'));
 return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
   [...new Set(urls)].sort().map(u=>'  <url><loc>'+u.replace(/&/g,'&amp;')+'</loc></url>').join('\n')+'\n</urlset>\n';
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.includes('--sitemap-write')){fs.writeFileSync(file('sitemap.xml'),sitemap());console.log('Wrote sitemap.xml');}
 else if(args.includes('--sitemap-check')){if(read('sitemap.xml')!==sitemap()){console.error('Sitemap does not match approved index routes');process.exitCode=1;}else console.log('Sitemap matches approved routes');}
 else {const result=audit(),out=args.find(x=>x.startsWith('--report='));
  if(out)fs.writeFileSync(file(out.slice('--report='.length)),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({...result,findings:result.findings.slice(0,25)},null,2));
  if(args.includes('--strict')&&result.summary.P0)process.exitCode=1;
 }
}
module.exports={inspect,sanitizeProductSchema,audit,sitemap};
