const {parse}=require('parse5');
const {createHash,randomUUID}=require('node:crypto');
const {acquireSource}=require('./acquire.cjs');
const PROMPT='Create a Slice-ready, browser-only interactive experience using HTML/CSS/JS or React + Vite with a static build. For URL Import V1, export one self-contained HTML file with inline CSS and JavaScript and data: assets. No backend, database, login, private API keys, external network, external scripts, iframes, service workers, popups, downloads or navigation. Make it responsive and ensure the main interaction works immediately. Preserve the core experience and provide a public HTTPS deployment returning text/html.';
function inspect(html){
  const issues=new Set();let interactive=false,title='Imported experience';
  const doc=parse(html);
  function visit(node){
    const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
    const text=(node.childNodes||[]).filter(n=>n.nodeName==='#text').map(n=>n.value).join('');
    if(node.tagName==='title')title=text.trim().slice(0,80)||title;
    if(['iframe','frame','object','embed','base','form'].includes(node.tagName))issues.add('Remove embedded pages, forms, objects and base URLs.');
    if(node.tagName==='meta' && /refresh/i.test(attrs['http-equiv']||''))issues.add('Remove automatic page redirects.');
    for(const [name,value] of Object.entries(attrs)){
      if(/^on(click|input|change|submit|key\w*|pointer\w*|mouse\w*|touch\w*)$/.test(name))interactive=true;
      if(['src','href','srcset','action','poster','data','xlink:href','ping'].includes(name) && value && !value.startsWith('#') && !/^data:image\/(png|jpeg|gif|webp);base64,/i.test(value))issues.add('Inline external resources and remove links or navigation.');
    }
    if(node.tagName==='script' && /addEventListener\s*\(|\.on(?:click|input|change|key\w+|pointer\w+|mouse\w+|touch\w+)\s*=/.test(text))interactive=true;
    if(node.content)visit(node.content);
    for(const child of node.childNodes||[])visit(child);
  }visit(doc);
  const capabilities=[
    [/serviceWorker|\b(?:SharedWorker|Worker)\s*\(/i,'Remove service workers and background workers.'],
    [/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*(?:\(|["'{*])/i,'Remove network requests and external module imports.'],
    [/(?:window\s*\.\s*)?\bopen\s*\(|\b(?:top|parent)\s*[.\[]|\blocation\b/i,'Remove popups and page navigation.'],
    [/getUserMedia|geolocation|clipboard|PaymentRequest|\bdownload\s*=/i,'Remove camera, microphone, location, clipboard, payment or download requirements.'],
    [/@import|url\s*\(/i,'Inline CSS resources; CSS imports and URL assets are not supported in V1.']
  ];for(const [pattern,message] of capabilities)if(pattern.test(html))issues.add(message);
  if(!interactive)issues.add('Add an immediately usable interaction such as a button, slider or canvas control.');
  return {title,interactive,issues:[...issues]};
}
async function importSource(source,options){
  const acquired=await acquireSource(source,options);
  const detected=inspect(acquired.html);
  const ready=detected.issues.length===0;
  return {status:ready?'preview':'unsupported',title:detected.title,
    checks:[{name:'Source',status:'pass',detail:'Public HTML acquired.'},{name:'Browser compatibility',status:detected.interactive?'pass':'fail',detail:'Try the controls in the preview to confirm they work.'},{name:'Security',status:ready?'pass':'fail',detail:ready?'No unsupported features found. The preview runs with restricted permissions.':detected.issues.join(' ')},{name:'Runtime',status:ready?'pass':'blocked',detail:'Isolated preview ready. External connections and sensitive permissions are blocked.'}],
    issues:detected.issues,fix_prompt:PROMPT+'\nFix these detected issues:\n'+detected.issues.join('\n'),
    source:{id:randomUUID(),source_type:source.source_type,source_url:acquired.source_url,resolved_url:acquired.resolved_url,repo_url:null,owner:null,repo:null,branch:null,commit_sha:null},
    version:ready?{id:randomUUID(),version:1,html:acquired.html,content_hash:createHash('sha256').update(acquired.html).digest('hex'),runtime_metadata:{type:'sandboxed-srcdoc',policy_version:1,bytes:acquired.bytes},created_at:new Date().toISOString()}:null};
}
module.exports={importSource,inspect,PROMPT};
