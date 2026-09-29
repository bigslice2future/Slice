// User code is always untrusted. Resolve, validate, then pin the connection to that IP.
const dns = require('node:dns').promises;
const https = require('node:https');
const http = require('node:http');
const ipaddr = require('ipaddr.js');
const MAX_BYTES = 300 * 1024;
function publicIP(address) {
  try {
    let ip = ipaddr.parse(address);
    if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) ip = ip.toIPv4Address();
    return ip.range() === 'unicast';
  } catch { return false; }
}
function validateURL(value, allowHttp = false) {
  let url;
  try { url = new URL(value); } catch { throw Error('Enter a valid public HTTPS URL.'); }
  if (!['https:', ...(allowHttp ? ['http:'] : [])].includes(url.protocol)) throw Error('Use a public HTTPS URL. Other protocols are not supported.');
  if (url.username || url.password || url.port) throw Error('Credentials and custom ports are not supported.');
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (/^(localhost|metadata|metadata\.google\.internal)$/.test(host) || /\.(localhost|local|internal|home|test|invalid)\.?$/.test(host) || !host.includes('.') && !host.includes(':')) throw Error('Local and metadata hosts are not allowed.');
  if (ipaddr.isValid(host) && !publicIP(host)) throw Error('Private or reserved IP addresses are not allowed.');
  url.hash = '';
  return url;
}
async function addresses(url, lookup, signal) {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const result = ipaddr.isValid(host) ? [{address:host,family:ipaddr.parse(host).kind()==='ipv4'?4:6}] : await Promise.race([
    lookup(host, {all:true,verbatim:true}),
    new Promise((_, reject) => { if(signal.aborted) reject(Error('Import timed out.')); else signal.addEventListener('abort',()=>reject(Error('Import timed out.')), {once:true}); })
  ]);
  if (!result.length || result.some(a=>!publicIP(a.address))) throw Error('DNS resolved to a private or reserved address.');
  return result[0];
}
function requestPage(url, address, signal) {
  return new Promise((resolve,reject)=>{
    const req=(url.protocol==='https:'?https:http).get(url, {
      signal, agent:false,
      lookup:(_host,options,done)=>options.all?done(null,[address]):done(null,address.address,address.family),
      headers:{Accept:'text/html','Accept-Encoding':'identity','User-Agent':'Slice-Import/1.0'},
    },res=>{
      if([301,302,303,307,308].includes(res.statusCode)) { res.destroy(); resolve({redirect:res.headers.location}); return; }
      if(res.statusCode<200 || res.statusCode>=300){res.destroy();reject(Error('Source returned an unsuccessful HTTP status.'));return;}
      if(!/^text\/html(?:;|$)/i.test(res.headers['content-type']||'')){res.destroy();reject(Error('The URL must return HTML (text/html).'));return;}
      if(res.headers['content-encoding'] && res.headers['content-encoding']!=='identity'){res.destroy();reject(Error('Compressed responses are not supported. Serve uncompressed HTML.'));return;}
      if(Number(res.headers['content-length'])>MAX_BYTES){res.destroy();reject(Error('HTML exceeds the 300 KB limit.'));return;}
      let size=0;const chunks=[];
      res.on('data',chunk=>{size+=chunk.length;if(size>MAX_BYTES){res.destroy();reject(Error('HTML exceeds the 300 KB limit.'));}else chunks.push(chunk);});
      res.on('error',reject);
      res.on('end',()=>resolve({html:Buffer.concat(chunks).toString('utf8'),bytes:size}));
    });req.on('error',reject);
  });
}
async function acquireURL(value, options={}) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),options.timeoutMs??8000);
  try {
    const source=validateURL(value,options.allowHttp===true);
    let current=source;
    for(let redirects=0;redirects<=3;redirects++){
      const address=await addresses(current,options.lookup||dns.lookup,controller.signal);
      const page=await (options.request||requestPage)(current,address,controller.signal);
      if(controller.signal.aborted)throw Error('Import timed out.');
      if('redirect' in page){
        if(!page.redirect || redirects===3)throw Error('Too many redirects or missing redirect destination.');
        current=validateURL(new URL(page.redirect,current).href,options.allowHttp===true);
        continue;
      }
      return {...page,source_url:source.href,resolved_url:current.href};
    }
  } catch(error){if(controller.signal.aborted)throw Error('Import timed out. Try a smaller, faster page.');throw error;}
  finally {clearTimeout(timer);}
}
async function acquireSource(source,options){
  if(source.source_type==='url')return acquireURL(source.source_url,options);
  if(source.source_type==='upload'){
    if(typeof source.html!=='string'||!source.html.trim())throw Error('Choose an HTML file or paste your HTML code.');
    const bytes=Buffer.byteLength(source.html,'utf8');
    if(bytes>MAX_BYTES)throw Error('HTML must be smaller than 300 KB.');
    if(source.filename && !/\.html?$/i.test(source.filename))throw Error('Choose a .html file. ZIP and project folders are coming soon.');
    if(!/<(?:!doctype\s+html|html|head|body|button|canvas|div|script|svg)\b/i.test(source.html)||source.html.includes('\0'))throw Error('This does not look like an HTML document.');
    return {html:source.html,bytes,source_url:null,resolved_url:null};
  }
  if(source.source_type==='github')throw Error('Coming soon. This source adapter is not available yet.');
  throw Error('Unsupported source type.');
}
module.exports={acquireSource,acquireURL,publicIP,validateURL,requestPage,MAX_BYTES};
