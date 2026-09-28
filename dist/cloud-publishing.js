// Public database HTML remains untrusted and only runs through SliceRuntime.
(() => {
 const client=window.SliceAccount?.client;if(!client)return;
 const isLocal=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
 function project(row){return {id:row.id,title:row.title,desc:row.description,author:row.author,asset:row.html,assetType:'html',contentType:'interactive',local:false,template:'beat',cat:'Creative',bg:'#dfff85',time:'Published',likes:0,plays:'0'};}
 async function load(){
  const {data,error}=await client.from('public_slices').select('*').order('created_at',{ascending:false}).limit(100);
  if(error){if(!isLocal)toast('Public Slices could not be loaded. Please refresh to retry.');return;}
  for(const row of data){const work=project(row);if(!works.some(w=>w.id===work.id))works.unshift(work);}
  render();
  const id=location.hash.startsWith('#work=')?location.hash.slice(6):null;if(id&&works.some(w=>w.id===id))openWork(id);
  window.dispatchEvent(new Event('slice-cloud-loaded'));
 }
 if(!isLocal){
  window.SliceCloudPublishing={async publish(preview,details,confirmed){
   if(!confirmed||preview?.status!=='preview'||!preview.version)throw Error('Test and confirm the preview first.');
   const {data:{session}}=await client.auth.getSession();if(!session)throw Error('Sign in using the Account button, then import and confirm your experience.');
   const response=await fetch(window.SLICE_ACCOUNT_CONFIG.url+'/functions/v1/publish-slice',{method:'POST',headers:{'Content-Type':'application/json',apikey:window.SLICE_ACCOUNT_CONFIG.publishableKey,Authorization:'Bearer '+session.access_token},body:JSON.stringify({url:preview.source.source_url,preview_hash:preview.version.content_hash,request_id:preview.version.id,title:details.title,description:details.description,confirmed:true})});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Publishing failed. Try again.');
   const {data,error}=await client.from('public_slices').select('*').eq('id',result.id).single();if(error)throw Error('Published, but reload Discover to see it.');return project(data);
  }};
  const button=document.querySelector('#gateway-publish');button.textContent='Publish to Slice →';
  const account=document.createElement('button');account.type='button';account.textContent='Sign in / Account';account.onclick=()=>window.SliceAccount.open();document.querySelector('#gateway-publish-scope').after(account);
  document.querySelector('#gateway-publish-scope').textContent='Sign in to publish. After confirmation, your experience will be visible to everyone in Discover and shareable by link.';
 }
 window.addEventListener('slice-cloud-loaded',()=>{if(libraryDialog.open)renderLibrary();});
 void load();
})();
