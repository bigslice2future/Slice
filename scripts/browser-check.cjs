// Run against the local static server with Playwright available via NODE_PATH.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const fs=require('node:fs');
const path=require('node:path');
let testPage;
const url=process.env.SLICE_TEST_URL||'http://127.0.0.1:4193/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN',reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];testPage=page;page.on('console',msg=>{if(msg.type()==='error')console.log('BROWSER:',msg.text())});
 page.setDefaultTimeout(8000);
 page.on('pageerror',e=>errors.push(e.message));
 const english=async()=>assert(!/[\u3400-\u9fff]/u.test(await page.locator('body').innerText()),'Non-English text rendered');
 await page.goto(url);
 assert.equal(await page.locator('#feed .card').count(),12);
 assert.equal(await page.locator('#plain-post-dialog, #gateway-post, [data-mode="image"]').count(),0);
 await english();
 // All demo experiences open without runtime exceptions; including the document's inner frame.
 for(const id of ['walkable-city','beat','orbit','quiz','wave','draw','social','city','manual-chat','memory-garden','lights-out','quick-signal']){
   await page.locator(`#card-${id} [data-open]`).click();
   await english();
   if(id==='manual-chat'){
     const frame=page.frameLocator('#dialog-stage iframe');
     await frame.getByRole('button',{name:'How long is the warranty?'}).click();
     await expect(frame.locator('#chat-log')).toContainText('One year');
   }
   if(id==='quiz'){await page.locator('#dialog-stage [data-answer="right"]').click();await expect(page.locator('#dialog-stage')).toContainText('Correct!')}
   if(id==='memory-garden'){await page.locator('#dialog-stage [data-flip="0"]').click();await expect(page.locator('#dialog-stage [data-flip="0"]')).not.toHaveText('✿')}
   await page.locator('#close-dialog').click();
 }
 console.log('PASS: 12 playable demos, quiz, memory game, English document Q&A');
 // Empty Library, saved experience, following, profile, share, and Space.
 await page.locator('#library-entry').click();assert((await page.locator('#library-dialog').innerText()).includes('Make room'));await english();await page.locator('[data-close-library]').first().click();
 await page.locator('#card-orbit [data-save]').click();await page.locator('#library-entry').click();assert.equal(await page.locator('.library-item').count(),1);await page.locator('[data-close-library]').first().click();
 await page.locator('#following-link').click();await english();await page.locator('[data-demo-following]').click();assert((await page.locator('.following-feed-card').count())>0);await english();
 await page.locator('header nav a[href="#discover"]').click();await page.locator('.profile').click();await english();
 await page.locator('#card-orbit [data-share]').click();await english();await page.locator('#close-share').click();
 await page.locator('#slace-link').click();await page.locator('[data-slace-join]').click();await page.locator('[data-slace-publish]').click();await page.locator('#gateway-template').click();assert.equal(await page.locator('[name="slaceDestination"]').inputValue(),'everyday');await page.locator('#close-publish').click();
 await page.locator('header nav a[href="#discover"]').click();
 console.log('PASS: Library, following, profile notice, share, and Space publishing destination');
 // GitHub/URL checks are honest placeholders, with English validation.
 await page.locator('#publish-entry').click();await page.locator('#gateway-source-form [type="submit"]').click();assert((await page.locator('.form-validation').innerText()).includes('Complete'));
 await page.locator('#gateway-source-url').fill('https://github.com/example/playground');await page.locator('#gateway-source-form [type="submit"]').click();assert((await page.locator('#gateway-status').innerText()).includes('not connected'));
 await page.locator('[data-source="url"]').click();await page.locator('#gateway-source-url').fill('http://example.com');await page.locator('#gateway-source-form [type="submit"]').click();assert((await page.locator('#gateway-status').innerText()).includes('HTTPS'));
 await page.locator('[data-source="upload"]').click();await page.locator('#gateway-open-upload').click();
 // Reject image/text/static HTML through the actual file picker handler.
 for(const [name,contents] of [['photo.png','fake image'],['note.txt','A static note'],['static.html','<h1>Static text</h1><img src="x">']]){
   await page.locator('#work-file').setInputFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(contents)});
   await page.waitForFunction(()=>document.querySelector('#publish-error').textContent.length>0);
   assert.equal(await page.locator('#publish-slice iframe').count(),0);
 }
 await page.locator('#load-example').click();
 await page.locator('#publish-form [type="submit"]').click();assert((await page.locator('#publish-error').innerText()).includes('confirm'));
 const frame=page.frameLocator('#publish-slice iframe');await frame.getByRole('button',{name:'Change the mood'}).click();await frame.locator('#answer').filter({hasNotText:'Tap to discover a new mood.'}).waitFor();
 await page.locator('#confirm-playable').check();await page.locator('#publish-form [type="submit"]').click();
 assert.equal(await page.locator('#feed .card').count(),13);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('slice-local-works-v1')));
 assert.equal(stored[0].contentType,'interactive');assert.equal(stored[0].assetType,'html');
 await page.reload();assert.equal(await page.locator('#feed .card').count(),13);
 console.log('PASS: English import validation, static/image/text rejection, preview confirmation, interactive publish and reload');
 // Template draft and publishing remain playable.
 await page.locator('#publish-entry').click();await page.locator('#gateway-template').click();
 await page.locator('[name="title"]').fill('My orbit experiment');await page.locator('#publish-form [name="description"]').fill('Adjust gravity.');await page.locator('[name="template"]').selectOption('orbit');await page.locator('#save-draft').click();await page.locator('#close-publish').click();
 await page.locator('#publish-entry').click();await page.locator('#gateway-draft').click();assert.equal(await page.locator('[name="title"]').inputValue(),'My orbit experiment');await page.locator('#publish-form [type="submit"]').click();assert.equal(await page.locator('#feed .card').count(),14);
 // Seed legacy data in this isolated test browser. Verify it stays archived and is not destroyed.
 const legacy={id:'local-legacy',template:'beat',cat:'Creative',title:'Old image post',desc:'Static',author:'Legacy',bg:'#ffffff',assetType:'image',asset:'data:image/png;base64,AA=='};
 await page.evaluate(legacy=>{const list=JSON.parse(localStorage.getItem('slice-local-works-v1'));localStorage.setItem('slice-local-works-v1',JSON.stringify([...list,legacy,{...legacy,id:'local-static',assetType:'html',asset:'<p>Static text</p>'}]));localStorage.setItem('slice-plain-posts-v1',JSON.stringify([{id:'post-old',title:'Old text post',desc:'Text',author:'Legacy',media:[]}]));localStorage.setItem('slice-publish-draft-v1',JSON.stringify(legacy));},legacy);
 await page.reload();assert.equal(await page.locator('#feed .card').count(),14);assert.equal(await page.locator('#card-local-legacy, #card-local-static, #card-post-old').count(),0);
 await page.locator('#publish-entry').click();await page.locator('#gateway-draft').click();assert((await page.locator('#publish-error').innerText()).includes('older draft'));await page.locator('[name="title"]').fill('Another playable idea');await page.locator('#publish-form [name="description"]').fill('Catch the beat.');await page.locator('#publish-form [type="submit"]').click();
 assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('slice-local-works-v1')).some(w=>w.id==='local-legacy')));
 assert(await page.evaluate(()=>localStorage.getItem('slice-plain-posts-v1')!==null));
 await page.goto(url+'?create=image');assert(await page.locator('#creator-gateway').isVisible());assert.equal(await page.locator('[data-mode="image"]').count(),0);await page.locator('#creator-gateway [data-close]').click();
 console.log('PASS: draft/template publishing, legacy posts and static wrappers excluded without data loss, old image deep link');
 // Capture desktop/mobile layouts in a clean context; inspect overflow across core screens.
 const clean=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),visual=await clean.newPage();visual.on('pageerror',e=>errors.push(e.message));
 await visual.goto(url);await visual.screenshot({path:'/private/tmp/slice-desktop.png'});
 for(const width of [1440,390]){
   await visual.setViewportSize({width,height:900});
   await visual.goto(url);
   assert(await visual.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Homepage overflow at ${width}`);
   await visual.screenshot({path:`/private/tmp/slice-home-${width}.png`});
   await visual.locator('#publish-entry').click();await visual.screenshot({path:`/private/tmp/slice-gateway-${width}.png`});
   assert(await visual.locator('#creator-gateway').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Gateway overflow at ${width}`);
   await visual.locator('#gateway-template').click();await visual.screenshot({path:`/private/tmp/slice-publish-${width}.png`});
   assert(await visual.locator('#publish-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Publish overflow at ${width}`);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: desktop/mobile overflow checks; no page errors');
 }catch(error){if(testPage){await testPage.screenshot({path:'/private/tmp/slice-test-failure.png'});console.log('FAILURE CONTEXT',await testPage.locator('#publish-error').innerText());}throw error;}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
