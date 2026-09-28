const assert = require('node:assert/strict');
const Store = require('../dist/cloud-library-store.js');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
(async()=>{
 const pending=deferred();
 const store=new Store({list:owner=>owner==='A'?pending.promise:Promise.resolve(['wave']),write:async()=>{}});
 const first=store.setUser('A'); await store.setUser('B'); pending.resolve(['orbit']); await first;
 assert.deepEqual([...store.ids],['wave']); assert.equal(store.userId,'B');
 const writing=deferred(); store.adapter.write=()=>writing.promise;
 const save=store.toggle('quiz'); await store.setUser(null);writing.resolve();assert.equal(await save,false);assert.equal(store.ids.size,0);
 await store.setUser('B'); store.adapter.write=async()=>{throw Error('offline')};
 assert.equal(await store.toggle('quiz'),false);assert(!store.ids.has('quiz'));assert.equal(store.phase,'error');
 store.adapter.list=async()=>['wave','quiz'];await store.reload();assert(store.ids.has('quiz'));
 const once=deferred();let count=0;store.adapter.write=()=>{count++;return once.promise};
 const one=store.toggle('quiz');assert.equal(await store.toggle('wave'),false);once.resolve();await one;assert.equal(count,1);assert(!store.ids.has('quiz'));
 const loading=deferred();store.adapter.list=()=>loading.promise;const load=store.reload();await store.setUser(null);loading.resolve(['orbit']);await load;assert.equal(store.ids.size,0);
 console.log('PASS: account switching, sign-out during save/load, ambiguous failure recovery, duplicate-click protection');
})().catch(e=>{console.error(e);process.exit(1)});
