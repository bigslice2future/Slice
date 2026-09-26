// The deployable app is dist/ itself: no bundle or dependency installation is required.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const files=fs.readdirSync(dist).filter(f=>/\.(js|html|css)$/.test(f));
for(const name of files){
 const file=path.join(dist,name),source=fs.readFileSync(file,'utf8');
 assert(!/[\u3400-\u9fff]/u.test(source),`${name}: untranslated CJK text`);
 if(name.endsWith('.js')){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(result.status,0,result.stderr)}
}
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
assert(html.includes('lang="en"'));
for(const [,file] of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css)(?:\?[^"#]*)?)"/g))assert(fs.existsSync(path.join(dist,file.split('?')[0])),`Missing asset: ${file}`);
for(const removed of ['posts.js','daily.js','generate.js'])assert(!fs.existsSync(path.join(dist,removed)),`Deprecated publishing module still shipped: ${removed}`);
assert.equal(JSON.parse(fs.readFileSync(path.join(root,'vercel.json'))).outputDirectory,'dist');
console.log(`PASS: ${files.length} source files checked; JavaScript syntax, English UI source, script/style references, retired post modules, and static deployment config.`);
