// User code is always untrusted. This function never executes imported HTML.
// Supabase's existing runtime service-role key stays inside Supabase.
const project = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = {'Access-Control-Allow-Origin':'https://slice-jade.vercel.app','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply(405,{error:'Use POST.'});
 const auth=req.headers.get('Authorization')||'';
 if(!/^Bearer [A-Za-z0-9._-]+$/.test(auth))return reply(401,{error:'Sign in before publishing.'});
 try{
  const session=await fetch(project+'/auth/v1/user',{headers:{apikey:serviceKey,Authorization:auth},signal:AbortSignal.timeout(5000)});
  if(!session.ok)return reply(401,{error:'Sign in again before publishing.'});
  const user=await session.json();if(!user.id)return reply(401,{error:'Sign in before publishing.'});
  if(Number(req.headers.get('content-length'))>4096)return reply(413,{error:'Request too large.'});
  const reader=req.body?.getReader();if(!reader)return reply(400,{error:'Missing request.'});
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();return reply(413,{error:'Request too large.'});}chunks.push(value);}
  const raw=new Uint8Array(size);let offset=0;for(const c of chunks){raw.set(c,offset);offset+=c.length;}
  const body=JSON.parse(new TextDecoder().decode(raw));
  if(typeof body.url!=='string'||body.url.length>2048||typeof body.title!=='string'||!body.title.trim()||body.title.length>80||typeof body.description!=='string'||body.description.length>160||!/^([a-f0-9]{64})$/.test(body.preview_hash)||!/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.test(body.request_id)||body.confirmed!==true)return reply(400,{error:'Test and confirm a valid preview before publishing.'});
  // Only this fixed trusted endpoint may acquire URLs; no user-selected proxy.
  const imported=await fetch('https://slice-jade.vercel.app/api/import/url',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:body.url}),signal:AbortSignal.timeout(12000)});
  if(!imported.ok)return reply(422,{error:'Could not recheck the source. Please run the preview again.'});
  const preview=await imported.json();
  if(preview.status!=='preview'||!preview.version)return reply(422,{error:'The source no longer passes compatibility checks. Import it again.'});
  if(preview.version.content_hash!==body.preview_hash)return reply(409,{error:'The source changed since your preview. Import and test the updated version before publishing.'});
  const saved=await fetch(project+'/rest/v1/rpc/publish_verified_slice',{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:JSON.stringify({p_creator:user.id,p_request:body.request_id,p_title:body.title,p_description:body.description,p_source:preview.source,p_version:preview.version}),signal:AbortSignal.timeout(8000)});
  if(!saved.ok){const error=await saved.json();return reply(422,{error:/limit reached/.test(error.message||'')?error.message:'Could not save the Slice. Retry with the same preview.'});}
  return reply(200,{id:await saved.json()});
 }catch{return reply(503,{error:'Publishing is temporarily unavailable. Your preview is unchanged; please retry.'});}
});
