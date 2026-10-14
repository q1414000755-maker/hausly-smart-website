const fs=require('fs'),path=require('path'),vm=require('vm');
const root=__dirname,context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/quote-catalog.js'),'utf8'),context);
const catalog=context.window.Z02_CATALOG;
const entries=[];
for(const dir of fs.readdirSync(path.join(root,'products'))){const file=path.join(root,'products',dir,'index.html');if(!fs.existsSync(file))continue;const source=fs.readFileSync(file,'utf8');const model=source.match(/data-pdp-model="([^"]+)"/);const socket=dir.match(/^([a-z0-9]+)-(\d+)-socket$/);const modelId=model?.[1]||(socket?'socket-src03-'+socket[1]+'-socket-'+socket[2]:null);if(modelId&&catalog.models[modelId])entries.push({file,dir,model:modelId,source});}
if(process.argv.includes('--inventory')){console.log(JSON.stringify(entries.map(({dir,model})=>({dir,model})),null,2));process.exit(0);}
const backup=path.join(root,'.server-private','pdp-v2-originals');fs.mkdirSync(backup,{recursive:true});
const templatePath=path.join(root,'product-detail-v2-body.html');
if(!fs.existsSync(templatePath))fs.copyFileSync(path.join(root,'.server-private/m6-preview/body.html'),templatePath);
for(const [src,dest] of [['m6-design-preview.css','product-detail-v2-base.css'],['m6-design-refined.css','product-detail-v2.css']])fs.copyFileSync(path.join(root,src),path.join(root,dest));
fs.appendFileSync(path.join(root,'product-detail-v2.css'),'\n.m6-content[data-product-model]:not([data-product-model="src03-m6"]) .m6-stage::before{content:none}\n.m6-content[data-product-model] .m6-material-buttons{flex-wrap:wrap}\n');
let m6js=fs.readFileSync(path.join(root,'m6-design-preview.js'),'utf8').replaceAll('/m6-preview-request.html','/request-a-quote.html');
m6js=m6js.replace("const search=new URLSearchParams(location.search);","const search=new URLSearchParams(location.search);const legacyVariant=variants.find(v=>v.variant_id===search.get('variant'));if(legacyVariant){gang=legacyVariant.attributes.gang[0];material=legacyVariant.variant_id.includes('glass')?'glass':'pc';}if(search.has('option_color'))search.set('color',search.get('option_color'));if(search.has('option_finish'))search.set('color',search.get('option_finish').replace(/^m6-(?!premium)/,''));");
m6js=m6js.replace("url.searchParams.set('gang',gang);","url.searchParams.delete('option_color');url.searchParams.delete('option_finish');if(variant)url.searchParams.set('variant',variant.variant_id);else url.searchParams.delete('variant');url.searchParams.set('gang',gang);");
fs.writeFileSync(path.join(root,'product-detail-v2-m6.js'),m6js);
const snapshotContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'m6-design-preview-data.js'),'utf8'),snapshotContext);
const m6Snapshot=snapshotContext.window.M6_PREVIEW_DATA;
fs.writeFileSync(path.join(root,'product-detail-v2-m6-data.js'),`/* Runtime adapter: catalog is the product source of truth. */\n(()=>{const c=window.Z02_CATALOG,m=c.models['src03-m6'];window.M6_PREVIEW_DATA={model:'src03-m6',name:m.name,sourceFields:m.sourceFields,dims:c.dims[m.categoryPage],option_matrix:${JSON.stringify(m6Snapshot.option_matrix)},variants:m.variants.map(v=>({...v,attributes:v.attrs,publication_status:'published'}))};})();`);
const esc=s=>String(s||'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const routes={};for(const e of entries)if(!routes[e.model]||!e.dir.startsWith('src'))routes[e.model]='/products/'+e.dir+'/index.html';
const newAssets='<link rel="stylesheet" href="/product-detail-v2-base.css"><link rel="stylesheet" href="/product-detail-v2.css"><link rel="stylesheet" href="/legacy-products/assets/css/quote-drawer.css"><script defer src="/assets/js/variant-resolver.js"></script><script defer src="/assets/js/quote-catalog.js"></script><script defer src="/assets/js/quote-cart.js"></script><script defer src="/assets/js/quote-drawer.js"></script><script defer src="/assets/js/site-shell.js"></script><script defer src="/navigation-responsive.js"></script>';
let count=0;
for(const e of entries){
 const original=path.join(backup,e.dir+'.html');if(!fs.existsSync(original))fs.writeFileSync(original,e.source);
 const source=fs.readFileSync(original,'utf8'),model=catalog.models[e.model],m6=e.model==='src03-m6';
 const header=source.match(/<header\b[\s\S]*?<\/header>/)?.[0],footer=source.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];if(!header||!footer)throw Error('Missing shell: '+e.dir);
 let head=source.slice(0,source.indexOf('</head>')).replace(/<script\b(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/g,'').replace(/<link[^>]+href="[^"]*(?:product-detail|quote-drawer)[^"]*"[^>]*>/g,'');
 // Never imply stock from a reference-price record.
 head=head.replace(/,"availability":"https:\/\/schema.org\/InStock"/g,'');
 const runtime=m6?'<script defer src="/product-detail-v2-m6-data.js"></script><script defer src="/product-detail-v2-m6.js"></script>':'<script defer src="/product-detail-v2.js"></script>';
 head=head.replace(/<base\b[^>]*>/g,'');head+=newAssets+runtime+'</head>';
 let body=fs.readFileSync(templatePath,'utf8').replace('<main id="main-content" class="m6-content">',`<main id="main-content" class="m6-content" data-product-model="${e.model}" data-pdp-model="${e.model}" data-detail-version="2">`).replace('<nav class="m6-section-nav"','<nav data-shell-bar class="m6-section-nav"').replaceAll('/m6-preview-request.html','/request-a-quote.html').replaceAll('/m6-design-preview.html?','/products/m6-smart-switch/index.html?');
 if(!m6){
  body=body.replace(/<div class="m6-config">[\s\S]*?<\/div>\s*<div class="m6-selection"/,'<div class="m6-config" data-v2-config></div><div class="m6-selection"');
  body=body.replace(/<div class="m6-thumb-carousel">[\s\S]*?<\/div><\/div>\s*<div class="m6-hero-copy">/,`<div class="m6-thumb-carousel"><button class="m6-thumb-arrow m6-thumb-prev" type="button" disabled aria-label="Previous product images">‹</button><div class="m6-thumbs" style="--thumb-total-gap:48px" role="group" aria-label="Product views"><button type="button" aria-pressed="true" data-catalog-thumb><img src="/${esc(model.image)}" alt="${esc(model.name)}"><span>Product family</span></button></div><button class="m6-thumb-arrow m6-thumb-next" type="button" disabled aria-label="Next product images">›</button></div></div><div class="m6-hero-copy">`);
  body=body.replaceAll('M6 Smart Switch',esc(model.name)).replaceAll('M6 smart switch series',esc(model.family)).replaceAll('M6 Series',esc(model.series||model.name)).replaceAll('M6 <small>Smart Switch</small>',esc(model.series||model.name)+' <small>'+esc(model.family)+'</small>').replaceAll('M6 family · product reference',esc(model.name)+' · product reference').replaceAll('M6 product family front panels',esc(model.name)).replaceAll('M6 mechanical smart switches in gray, gold and white',esc(model.name));
  body=body.replace(/<p class="m6-intro">[\s\S]*?<\/p>/,'<p class="m6-intro">'+esc(model.family)+' · configuration for your project.</p>').replace(/<p class="m6-hero-description">[\s\S]*?<\/p>/,'<p class="m6-hero-description">Review available models, finishes and confirmed product information.</p>');
  body=body.replace(/<img data-main-image[^>]*>/,`<img data-main-image src="/${esc(model.image)}" alt="${esc(model.name)}" fetchpriority="high">`);
  body=body.replaceAll('/assets/images/previews/m6-v2/m6-family-1100.webp','/'+model.image);
  body=body.replace(/<figure class="m6-drawing">[\s\S]*?<\/figure>/,'<figure class="m6-drawing"><img style="width:100%;aspect-ratio:4/3;object-fit:contain" src="/assets/images/placeholders/pdp-dimension.svg" alt="Model dimensions pending"><figcaption>'+esc(model.sourceFields?.dimensions?.value||'Dimensions to be confirmed for selected model')+'</figcaption></figure>');
  body=body.replace(/Panel format: 86 × 86 mm\.[^<]*/,'Dimensions and installation requirements follow the selected model.').replaceAll('EU 86 box · model review','Confirm for selected model').replaceAll('EU 86 box · confirm site fit','Confirm for selected model');
  body=body.replaceAll('M6 family','product').replaceAll('the M6 family','the product').replaceAll('M6 configurations','available configurations').replaceAll('M6 project','product project');
  body=body.replace(/<div class="m6-related m6-related-products">[\s\S]*?<\/article><\/div>/,()=>{
   const related=Object.entries(catalog.models).filter(([id,m])=>id!==e.model&&m.family===model.family&&routes[id]).slice(0,4);
   return '<div class="m6-related m6-related-products">'+related.map(([id,m])=>'<article><div class="m6-related-media"><img loading="lazy" src="/'+esc(m.image)+'" alt="'+esc(m.name)+'"></div><div class="m6-related-copy"><h3>'+esc(m.name)+'</h3><p class="m6-product-spec">'+esc(m.sku)+'</p><div class="m6-product-price"><strong>'+(m.price?.status==='confirmed'?esc(m.price.currency)+' '+Number(m.price.amount).toFixed(2):'Price on request')+'</strong></div><p class="m6-product-moq">'+(m.price?.moq?'MOQ '+m.price.moq:'MOQ to be confirmed')+'</p><div class="m6-product-actions"><a class="m6-button" href="/request-a-quote.html?model='+id+'">Request a Quote</a><a href="'+routes[id]+'">View Product</a></div></div></article>').join('')+'</div>';
  });
  body=body.replace('/smart-switches.html', '/'+model.familyPage).replace('>Smart Switches</a>','>'+esc(model.family)+'</a>');
 }
 const drawer=source.match(/<!-- qd:start -->[\s\S]*?<!-- qd:end -->/)?.[0]||'';
 let output=head+'<body id="top" class="m6-preview-page product-page"><a class="new-skip" href="#main-content">Skip to content</a>'+header+body+drawer+footer+'</body></html>';
 output=output.replace(/(src|href)="([^"#][^"]*)"/g,(full,attr,ref)=>{if(/^(?:\/|https?:|data:|mailto:|tel:)/.test(ref))return full;const normalized=ref.replace(/^(?:(?:\.\.\/)|(?:\.\/))+/,'');if(fs.existsSync(path.join(root,normalized.split(/[?#]/)[0])))return attr+'="/'+normalized+'"';return full;});
 fs.writeFileSync(e.file,output);count++;
}
fs.writeFileSync(path.join(root,'product-detail-v2-manifest.json'),JSON.stringify({version:2,localOnly:true,pages:entries.map(({dir,model})=>({path:'/products/'+dir+'/index.html',model})),backup:'.server-private/pdp-v2-originals'},null,2));
console.log('Built '+count+' local product detail pages; original files backed up.');
const missing=[];for(const e of entries){const html=fs.readFileSync(e.file,'utf8');for(const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){const ref=match[1];if(!ref||ref.startsWith('#')||/^(?:https?:|data:|mailto:|tel:)/.test(ref))continue;const target=ref.startsWith('/')?path.join(root,ref):path.resolve(path.dirname(e.file),ref);if(!fs.existsSync(target))missing.push({page:e.dir,ref});}}
fs.writeFileSync(path.join(root,'.server-private/pdp-v2-originals/validation.json'),JSON.stringify({pages:count,missing},null,2));console.log('Missing local references: '+missing.length);
