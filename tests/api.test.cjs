const {test}=require('node:test'),assert=require('node:assert/strict');
const handler=require('../api/import/url.js');
async function call(req){let status,body;const headers={};await handler(req,{setHeader:(k,v)=>headers[k]=v,status(code){status=code;return this;},json(value){body=value;}});return {status,body,headers};}
test('API method/content-type/body limits and errors are JSON without a publish side effect',async()=>{
 assert.equal((await call({method:'GET',headers:{}})).status,405);
 assert.equal((await call({method:'POST',headers:{}})).status,415);
 assert.equal((await call({method:'POST',headers:{'content-type':'application/json','sec-fetch-site':'cross-site'},body:{url:'https://example.com'}})).status,403);
 assert.equal((await call({method:'POST',headers:{'content-type':'application/json'},body:{url:'x'.repeat(5000)}})).status,413);
 const result=await call({method:'POST',headers:{'content-type':'application/json'},body:{url:'https://127.0.0.1'}});assert.equal(result.status,422);assert.match(result.body.error,/Private/);assert.equal(result.headers['Cache-Control'],'no-store');
});
