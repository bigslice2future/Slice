(() => {
  const prompt='Create a Slice-ready browser-only interactive experience using HTML/CSS/JS or React + Vite with a static build. Export a single self-contained HTML file with inline CSS/JS and embedded data: images. No backend, DB, login or private API keys. Avoid external network, scripts, iframes, service workers, popups and navigation. Make it responsive; the main interaction must work immediately. Return a downloadable index.html under 300 KB for direct upload to Slice.';
  const gateway=document.createElement('dialog');gateway.id='creator-gateway';gateway.setAttribute('aria-labelledby','gateway-heading');
  gateway.innerHTML=`<div class="dialog-head"><span>slice✳ / CREATOR GATEWAY</span><button type="button" data-close aria-label="Close Creator Gateway">✕</button></div>
  <div class="gateway-hero"><span class="eyebrow">YOUR TOOLS. YOUR IDEAS. YOUR SLICE.</span><h2 id="gateway-heading">Made anywhere.<br><em>Playable here.</em></h2><p>Bring your interactive experience to slice*. Upload your HTML file or paste your code. No hosting required.</p></div>
  <div class="gateway-options" role="group" aria-label="Project source">
  <button type="button" data-source="upload"><small>01 / AVAILABLE NOW</small><strong>Upload HTML</strong><span>Choose a file or paste your code</span></button>
  <button type="button" data-source="url"><small>02 / AVAILABLE NOW</small><strong>Import from URL</strong><span>Already have a published experience?</span></button>
  <button type="button" data-source="github"><small>03 / PUBLIC REPO IMPORT</small><strong>Import from GitHub ↗</strong><span>Coming soon</span></button></div>
  <section class="gateway-panel"><h3 id="gateway-source-title"></h3><p id="gateway-unavailable"></p>
  <form id="gateway-source-form"><label for="gateway-source-url">Interactive Project URL</label><div class="gateway-input-row"><input id="gateway-source-url" type="url" required placeholder="https://example.com/play.html"><button class="dark" type="submit">Check & preview →</button></div><p>Public HTTPS URL · No login required · Must run in a browser</p><small>Import a work you own or have permission to publish. V1 supports self-contained HTML, up to 300 KB.</small></form>
  <form id="gateway-upload-form"><label for="gateway-html-file">Choose an HTML file</label><input id="gateway-html-file" type="file" accept=".html,.htm,text/html"><p>Single HTML file · Up to 300 KB · No hosting required</p><details><summary>Or paste HTML code</summary><label for="gateway-html-code">HTML code</label><textarea id="gateway-html-code" rows="8" spellcheck="false" placeholder="Paste your complete HTML here…"></textarea></details><p id="gateway-upload-choice">Choose a file or paste code to begin.</p><button type="submit" class="dark">Check & preview →</button><p>Only upload work you own or have permission to publish.</p><button type="button" disabled>ZIP / project folders · Coming soon</button></form>
  <p id="gateway-status" role="status" aria-live="polite"></p></section>
  <section id="gateway-preflight" hidden><h3>Preflight results</h3><div id="gateway-checks"></div><div id="gateway-fix" hidden><h4>How to make it compatible</h4><p>Ask your AI coding tool to adapt the original project, then upload the new HTML or re-import its URL.</p><button type="button" id="gateway-copy-fix">Copy Make this Slice-ready prompt</button></div>
  <div id="gateway-ready" hidden><p>Try the main interaction below. Detection cannot guarantee that your experience works.</p><div id="gateway-preview"></div><label>Slice title<input id="gateway-title" maxlength="80"></label><label>Short description<textarea id="gateway-description" maxlength="160">Try this interactive experience.</textarea></label><label class="gateway-confirm"><input type="checkbox" id="gateway-confirm"> I tested the preview and confirmed the main interaction works.</label><p id="gateway-publish-scope">Published Slices are saved in this browser and appear in Discover.</p><button class="dark" type="button" id="gateway-publish" disabled>Publish locally →</button></div></section>
  <section class="gateway-ai"><h3>Creating with AI?</h3><p>Give your coding tool a head start with a Slice-ready brief.</p><button type="button" id="gateway-copy-prompt">Copy Slice-ready prompt</button><textarea id="gateway-copy-fallback" aria-label="Prompt to copy" hidden readonly></textarea></section>
  <details class="gateway-compatibility"><summary>View requirements</summary><h4>Works best</h4><p>Self-contained HTML/CSS/JS · Inline Canvas / WebGL · Embedded images · Immediate interactions. React + Vite projects must first be exported as a single static HTML file.</p><h4>Not supported yet</h4><p>External scripts or API requests · Embedded pages · Backend servers · Databases or login · Private API keys · Service workers · GitHub builds · ZIP / object storage uploads</p></details>
  <details class="gateway-pipeline"><summary>From your project to a Slice</summary><p>Source Acquisition → Detect → Validate → Security Check → Preview → Publish → Slice</p></details>
  <div class="gateway-footer"><span>Or start with a playable template.</span><button type="button" id="gateway-draft">Continue local draft</button><button type="button" id="gateway-template">Try a playable template</button></div>`;
  document.body.append(gateway);
  const $=s=>gateway.querySelector(s);let preview=null,revision=0,controller=null,destination='',uploadMode='file';
  const status=$('#gateway-status');
  function reset(){revision++;controller?.abort();preview=null;$('#gateway-preflight').hidden=true;$('#gateway-preview').replaceChildren();$('#gateway-confirm').checked=false;$('#gateway-publish').disabled=true;}
  function selectSource(source){reset();gateway.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source===source)));$('#gateway-source-title').textContent={github:'Import from GitHub',url:'Import from URL',upload:'Upload HTML'}[source];$('#gateway-source-form').hidden=source!=='url';$('#gateway-upload-form').hidden=source!=='upload';$('#gateway-unavailable').hidden=source!=='github';$('#gateway-unavailable').textContent=source==='github'?'Public repository import · Coming soon. Use a deployed, self-contained HTML URL for now.':'Coming soon. ZIP and local project uploads are not available yet.';status.textContent='';}
  async function copy(text){try{await navigator.clipboard.writeText(text);status.textContent='Prompt copied.';}catch{const field=$('#gateway-copy-fallback');field.hidden=false;field.value=text;field.focus();field.select();status.textContent='Select and copy the prompt below.';}}
  $('#gateway-copy-prompt').onclick=()=>copy(prompt);$('#gateway-copy-fix').onclick=()=>copy(preview?.fix_prompt||prompt);
  gateway.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>selectSource(b.dataset.source));
  $('#gateway-source-url').oninput=()=>reset();
  $('#gateway-html-file').onchange=()=>{reset();uploadMode='file';$('#gateway-html-code').value='';$('#gateway-upload-choice').textContent=$('#gateway-html-file').files[0]?.name||'Choose an HTML file.';};
  $('#gateway-html-code').oninput=()=>{reset();uploadMode='code';$('#gateway-html-file').value='';$('#gateway-upload-choice').textContent='Using pasted HTML code.';};
  $('#gateway-source-form').onsubmit=event=>runImport(event,false);
  $('#gateway-upload-form').onsubmit=event=>runImport(event,true);
  async function runImport(event,isUpload){
    event.preventDefault();reset();const current=revision;controller=new AbortController();status.textContent='Checking source, compatibility and security…';const submit=event.target.querySelector('[type="submit"]');submit.disabled=true;
    try{
      let payload;
      if(isUpload){
        const file=$('#gateway-html-file').files[0];
        if(uploadMode==='file'){
          if(!file)throw Error('Choose an HTML file or paste your code.');
          if(!/\.html?$/i.test(file.name))throw Error('Choose a .html file. ZIP and project folders are coming soon.');
          if(file.size>307200)throw Error('HTML must be smaller than 300 KB.');
          payload={html:await file.text(),filename:file.name};
        }else payload={html:$('#gateway-html-code').value};
        if(!payload.html.trim())throw Error('Paste your complete HTML code.');
        if(new TextEncoder().encode(payload.html).length>307200)throw Error('HTML must be smaller than 300 KB.');
      }else{const url=new URL($('#gateway-source-url').value.trim());if(url.protocol!=='https:')throw Error('Use a public HTTPS URL.');payload={url:url.href};}
      if(current!==revision)return;
      const response=await fetch('/api/import/'+(isUpload?'upload':'url'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(payload),signal:controller.signal});
      const result=await response.json();if(current!==revision)return;if(!response.ok)throw Error(result.error||'Import failed.');preview=result;
      $('#gateway-preflight').hidden=false;$('#gateway-checks').replaceChildren();
      for(const check of result.checks){const row=document.createElement('p');row.textContent=`${check.status==='pass'?'✓':check.status==='fail'?'✕':'—'} ${check.name} — ${check.detail}`;$('#gateway-checks').append(row);}
      $('#gateway-fix').hidden=result.status==='preview';$('#gateway-ready').hidden=result.status!=='preview';
      if(result.status==='preview'){$('#gateway-preview').innerHTML=SliceRuntime.frame(result.version.html,result.title);$('#gateway-title').value=result.title;status.textContent='Ready to preview. Test your experience before publishing.';}else status.textContent='Almost ready. Follow the compatibility guidance below.';
    }catch(error){if(current!==revision||error.name==='AbortError')return;status.textContent=error.message;$('#gateway-preflight').hidden=false;$('#gateway-checks').textContent='✕ Source — '+error.message;$('#gateway-ready').hidden=true;$('#gateway-fix').hidden=false;preview={fix_prompt:prompt+'\nResolve this import error: '+error.message};}
    finally{submit.disabled=false;}
  };
  $('#gateway-confirm').onchange=()=>{$('#gateway-publish').disabled=!$('#gateway-confirm').checked;};
  $('#gateway-publish').onclick=async()=>{
    const button=$('#gateway-publish');button.disabled=true;status.textContent='Publishing your Slice…';
    try{const work=await (window.SliceCloudPublishing||SliceImportRepository).publish(preview,{title:$('#gateway-title').value,description:$('#gateway-description').value},$('#gateway-confirm').checked);if(!works.some(w=>w.id===work.id))works.unshift(work);searchQuery='';selected='All';const search=document.querySelector('#slice-search');if(search)search.value='';document.querySelectorAll('[data-cat]').forEach(b=>{b.classList.toggle('selected',b.dataset.cat==='All');b.setAttribute('aria-pressed',String(b.dataset.cat==='All'));});render();gateway.close();toast(work.local?'Published locally. Find your Slice in Discover.':'Published. Your Slice is now visible to everyone.');document.querySelector('#card-'+work.id)?.scrollIntoView({block:'center'});}catch(error){status.textContent='Could not publish: '+error.message;}finally{button.disabled=!$('#gateway-confirm').checked;}
  };
  const legacyOpen=openCreator;
  function openGateway(){if(publishDialog.open)publishDialog.close();selectSource('upload');destination=!slacePage.hidden&&joinedSlaces.has(currentSlace)?currentSlace:'';if(!gateway.open)gateway.showModal();}
  function openEditor(mode){gateway.close();legacyOpen();if(mode)setCreationMode(mode);if(destination)updateSlaceOptions(destination);}
  openCreator=function(work){if(work)legacyOpen(work);else openGateway();};
  $('[data-close]').onclick=()=>gateway.close();gateway.addEventListener('close',reset);
  $('#gateway-draft').onclick=()=>openEditor();$('#gateway-template').onclick=()=>openEditor('template');
  // Legacy file editor stays disabled; all HTML enters the checked upload pipeline.
  document.querySelector('[data-mode="html"]').disabled=true;document.querySelector('[data-mode="html"] span').textContent='Coming soon';
  document.querySelector('#work-file').disabled=true;drop.ondrop=e=>e.preventDefault();
  const back=document.createElement('button');back.type='button';back.className='gateway-back';back.textContent='← Choose import source';back.onclick=openGateway;publishDialog.querySelector('.dialog-head').prepend(back);
  const entry=document.querySelector('#publish-entry');entry.textContent='＋ Creator';entry.onclick=openGateway;
  const fields=publishDialog.querySelector('.publish-fields');
  const heading=document.createElement('h3');heading.className='project-section-title';heading.textContent='Project details';
  fields.prepend(heading,publishForm.elements.title.closest('label'),publishForm.elements.description.closest('label'));
  const settings=document.createElement('details');settings.className='project-settings';settings.open=true;settings.innerHTML='<summary>Project settings</summary>';fields.append(settings);
  for(const name of ['category','author'])settings.append(publishForm.elements[name].closest('label'));
  settings.append(deliveryFields);
  publishForm.elements.title.placeholder='Give your project a title';publishForm.elements.description.placeholder='What can people do, play, or explore?';
  if(new URLSearchParams(location.search).has('create'))openGateway();
})();
