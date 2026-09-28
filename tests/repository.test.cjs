const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('Preview/Confirm/Publish contract, atomic persistence, idempotency and reload',()=>{
 const data=new Map();let unavailable=false;
 const localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>{if(unavailable)throw Error('Quota exceeded');data.set(k,v);}};
 const make=()=>{const context=vm.createContext({localStorage,crypto:require('node:crypto').webcrypto,works:[],render(){},toast(){}});vm.runInContext(fs.readFileSync(require.resolve('../dist/import-repository.js'),'utf8'),context);return vm.runInContext('SliceImportRepository',context);};
 const repo=make(),preview={status:'preview',source:{id:'source-1',source_type:'url',source_url:'https://example.com/',resolved_url:'https://example.com/final'},version:{id:'version-1',version:1,html:'<button onclick="this.textContent=1">Tap</button>',runtime_metadata:{type:'sandboxed-srcdoc'}}};
 assert.throws(()=>repo.publish(preview,{title:'Tap',description:'Try'},false),/confirm/);assert.equal(data.size,0);
 const work=repo.publish(preview,{title:'Tap',description:'Try'},true);assert.equal(repo.list().length,1);assert.equal(repo.publish(preview,{title:'Tap',description:'Try'},true).id,work.id);assert.equal(repo.list().length,1);
 const persisted=JSON.parse([...data.values()][0]);assert(!('html' in persisted.slices[0]));assert(!('source_url' in persisted.slices[0]));assert.equal(persisted.slice_versions[0].source_id,persisted.slice_sources[0].id);
 assert.equal(make().get(work.id).asset,preview.version.html);
 unavailable=true;assert.throws(()=>repo.publish({...preview,version:{...preview.version,id:'version-2'}},{title:'Another',description:'Try'},true),/Quota/);assert.equal(make().list().length,1);
});
