const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const handler=require('../api/import/url.js'),uploadHandler=require('../api/import/upload.js');
const root=path.resolve(__dirname,'../dist');
http.createServer(async(req,res)=>{
 res.status=code=>{res.statusCode=code;return res};res.json=value=>res.end(JSON.stringify(value));
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/api/import/upload'){res.setHeader('Content-Type','application/json');return uploadHandler(req,res);}
 if(pathname==='/api/import/url'){res.setHeader('Content-Type','application/json');return handler(req,res);}
 const file=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 try{const data=fs.readFileSync(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.mjs':'text/javascript'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end('Not found');}
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Slice ready at http://127.0.0.1:'+(process.env.PORT||4173)));
