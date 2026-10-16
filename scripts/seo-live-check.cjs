#!/usr/bin/env node
'use strict';
// Read-only checks after deployment. Does not claim Google indexing status.
const site='https://www.hauslysmart.com';
const targets=[
 'https://hauslysmart.com/',
 site+'/',
 site+'/index.html',
 site+'/products.html',
 site+'/smart-switches.html',
 site+'/mechanical-switches.html',
 site+'/robots.txt',
 site+'/sitemap.xml'
];
(async()=>{
 const results=[];
 for(const url of targets){
  try{
   const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{'user-agent':'HauslySmart-SEO-QA/1.0'}});
   const mime=response.headers.get('content-type')||'';
   const entry={url,status:response.status,location:response.headers.get('location'),type:mime,
      xRobotsTag:response.headers.get('x-robots-tag')};
   if(response.ok&&/text\/html/i.test(mime)){
    const html=await response.text();
    entry.canonical=(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)||[])[0]||'not detected';
    entry.robots=(html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)||[])[0]||'not detected';
    entry.h1Count=(html.match(/<h1\b/gi)||[]).length;
   }else if(response.ok&&/text\/plain|xml/i.test(mime)){
    const body=await response.text();entry.bytes=body.length;
    if(url.endsWith('robots.txt'))entry.hasSitemap=/^Sitemap:\s*\S+/im.test(body);
    if(url.endsWith('sitemap.xml'))entry.locCount=(body.match(/<loc>/g)||[]).length;
   }
   results.push(entry);
  }catch(error){results.push({url,error:String(error.message||error)});}
 }
 console.log(JSON.stringify(results,null,2));
 if(results.some(r=>r.error||r.status>=500))process.exitCode=1;
})();
