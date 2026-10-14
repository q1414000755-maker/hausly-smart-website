const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.mp4':'video/mp4','.pdf':'application/pdf'};
http.createServer((req,res)=>{
 let url;try{url=decodeURIComponent(req.url.split('?')[0]);if(url.includes('\0'))throw Error();}catch{res.writeHead(400);return res.end();}
 const segments=url.replaceAll('\\','/').split('/');
 // Runtime credentials and local tooling never belong in the public site.
 if(segments.some(segment=>segment.startsWith('.')||segment==='node_modules')||/\.(?:cjs|mjs|ps1|env)(?:\.|$)/i.test(url)){res.writeHead(403);return res.end('Forbidden');}
 let file=path.resolve(root,'.'+(url==='/'?'/index.html':url));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 try{if(fs.statSync(file).isDirectory()){if(!url.endsWith('/')){res.writeHead(301,{Location:url+'/'+(req.url.includes('?')?'?'+req.url.split('?').slice(1).join('?'):'')});return res.end();}file=path.join(file,'index.html');}}catch{res.writeHead(404);return res.end('Not found');}
 fs.readFile(file,(error,body)=>{if(error){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',types[path.extname(file).toLowerCase()]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.setHeader('X-Content-Type-Options','nosniff');res.end(req.method==='HEAD'?undefined:body);});
}).listen(62236,'127.0.0.1',()=>console.log('New site: http://127.0.0.1:62236/'));
