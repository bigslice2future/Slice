const {importSource}=require('../../server/import/pipeline.cjs');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Use POST.'});}
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return res.status(415).json({error:'Send JSON.'});
  if(req.headers['sec-fetch-site']==='cross-site')return res.status(403).json({error:'Cross-site import requests are not allowed.'});
  try{
    let body=req.body;
    if(body===undefined){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>2097152)return res.status(413).json({error:'Request too large.'});}body=JSON.parse(raw);}
    if(typeof body==='string')body=JSON.parse(body);
    if(Buffer.byteLength(JSON.stringify(body)||'')>2097152)return res.status(413).json({error:'Request too large.'});
    if(typeof body?.html!=='string'||(body.filename!==undefined&&(typeof body.filename!=='string'||body.filename.length>255)))return res.status(400).json({error:'Choose an HTML file or paste HTML code.'});
    const result=await importSource({source_type:'upload',html:body.html,filename:body.filename});
    return res.status(200).json(result);
  }catch(error){return res.status(422).json({error:/ENOTFOUND|ECONN|CERT|TLS|socket/i.test(error.message)?'Could not securely reach this URL. Check the deployment and try again.':error.message});}
};
