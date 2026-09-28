const {importSource}=require('../../server/import/pipeline.cjs');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Use POST.'});}
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return res.status(415).json({error:'Send JSON.'});
  if(req.headers['sec-fetch-site']==='cross-site')return res.status(403).json({error:'Cross-site import requests are not allowed.'});
  try{
    let body=req.body;
    if(body===undefined){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>4096)return res.status(413).json({error:'Request too large.'});}body=JSON.parse(raw);}
    if(typeof body==='string')body=JSON.parse(body);
    if(Buffer.byteLength(JSON.stringify(body)||'')>4096)return res.status(413).json({error:'Request too large.'});
    if(typeof body?.url!=='string'||body.url.length>2048)return res.status(400).json({error:'Enter a public HTTPS URL.'});
    const result=await importSource({source_type:'url',source_url:body.url});
    return res.status(200).json(result);
  }catch(error){return res.status(422).json({error:/ENOTFOUND|ECONN|CERT|TLS|socket/i.test(error.message)?'Could not securely reach this URL. Check the deployment and try again.':error.message});}
};
