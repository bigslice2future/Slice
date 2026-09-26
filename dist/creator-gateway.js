// Source adapters stay separate from the existing local Slice editor.
(() => {
  const futureSources = ['Create with AI', 'Remix Existing Slice', 'Connect Creator Tool'];
  const gateway = document.createElement('dialog');
  gateway.id = 'creator-gateway';
  gateway.setAttribute('aria-labelledby', 'gateway-heading');
  gateway.innerHTML = `
    <div class="dialog-head"><span>slice✳ / CREATOR GATEWAY</span><button type="button" data-close aria-label="Close Creator Gateway">✕</button></div>
    <div class="gateway-hero"><span class="eyebrow">YOUR TOOLS. YOUR IDEAS. YOUR SLICE.</span><h2 id="gateway-heading">Made anywhere.<br><em>Playable here.</em></h2><p>Create with the tools you love. Bring interactive experiences to slice* for everyone to play.</p></div>
    <div class="gateway-options" role="group" aria-label="Project source">
      <button type="button" data-source="github" aria-pressed="true"><small>01 / RECOMMENDED</small><strong>Import from GitHub ↗</strong><span>Start with a playable web repository</span></button>
      <button type="button" data-source="upload" aria-pressed="false"><small>02 / LOCAL PROJECT</small><strong>Upload Project</strong><span>Bring a self-contained HTML experience</span></button>
      <button type="button" data-source="url" aria-pressed="false"><small>03 / ALREADY ONLINE</small><strong>Import from URL</strong><span>Connect an experience already online</span></button>
    </div>
    <section class="gateway-panel" aria-labelledby="gateway-source-title"><h3 id="gateway-source-title">Import from GitHub</h3>
      <form id="gateway-source-form"><label for="gateway-source-url">GitHub Repository URL</label><div class="gateway-input-row"><input id="gateway-source-url" type="url" required placeholder="https://github.com/you/interactive-project"><button class="dark" type="submit">Check repository URL →</button></div><p id="gateway-source-help">Paste a repository URL. URL checks are available now; repository access, framework detection, and remote builds are not connected yet.</p></form>
      <div id="gateway-upload" hidden><p>Publish playable experiences only. Import one self-contained HTML file with working interactions, up to 300 KB. Images and text may be part of an experience, but cannot be published on their own. ZIP and project-folder imports are not available yet.</p><button type="button" class="dark" id="gateway-open-upload">Choose interactive HTML →</button></div>
      <p id="gateway-status" role="status" aria-live="polite"></p>
    </section>
    <details class="gateway-compatibility" open><summary>Web-based interactive projects · Initial scope</summary><p>Static HTML/CSS/JS · React/Vite · Three.js · WebGL · Canvas · p5.js</p><p>Projects must produce static web output. Arbitrary backends, Docker, Python servers, and system access are not supported.</p><p>These are the planned GitHub import formats. Local previews currently run self-contained HTML only, without external dependencies or builds.</p></details>
    <details class="gateway-pipeline"><summary>From your project to a Slice</summary><ol>${['Repository/Project','Detect','Validate/Build','Static Output','Sandbox Runtime','Slice'].map(s=>`<li>${s}</li>`).join('')}</ol><p>This describes the planned import flow. No remote task has started. URL imports will need embed validation; a link is not converted into static files.</p></details>
    <div class="gateway-future"><span>Future sources</span><p>${futureSources.join(' · ')}</p></div>
    <div class="gateway-footer"><span>Continue a playable draft or try a template.</span><button type="button" id="gateway-draft">Continue local draft</button><button type="button" id="gateway-template">Try a playable template</button></div>`;
  document.body.append(gateway);
  let source = 'github', destination = '';
  function openEditor(mode) {
    gateway.close(); legacyOpen();
    if (mode) setCreationMode(mode);
    if (destination) updateSlaceOptions(destination);
  }
  const input = gateway.querySelector('input');
  const status = gateway.querySelector('#gateway-status');
  function selectSource(next) {
    source = next;
    gateway.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.source === source)));
    gateway.querySelector('#gateway-source-title').textContent = {github:'Import from GitHub',upload:'Upload Project',url:'Import from URL'}[source];
    gateway.querySelector('form').hidden = source === 'upload';
    gateway.querySelector('#gateway-upload').hidden = source !== 'upload';
    gateway.querySelector('label').textContent = source === 'github' ? 'GitHub Repository URL' : 'Interactive Project URL';
    input.placeholder = source === 'github' ? 'https://github.com/you/interactive-project' : 'https://example.com/play';
    gateway.querySelector('[type="submit"]').textContent = source === 'github' ? 'Check repository URL →' : 'Check experience URL →';
    gateway.querySelector('#gateway-source-help').textContent = source === 'github' ? 'Paste a repository URL. URL checks are available now; repository access, framework detection, and remote builds are not connected yet.' : 'Enter an HTTPS interactive experience you own or have permission to publish. Server-side embed and runtime validation are required. This check does not publish or proxy the site.';
    input.value = ''; status.textContent = '';
  }
  function openGateway() {
    if (publishDialog.open) publishDialog.close();
    selectSource('github');
    destination = !slacePage.hidden && joinedSlaces.has(currentSlace) ? currentSlace : '';
    if (!gateway.open) gateway.showModal();
  }
  gateway.querySelector('[data-close]').onclick = ()=>gateway.close();
  gateway.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>selectSource(b.dataset.source));
  gateway.querySelector('form').onsubmit = e=>{
    e.preventDefault();
    try {
      const url = new URL(input.value.trim());
      if (url.protocol !== 'https:' || url.username || url.password || url.port) throw Error('Use an HTTPS URL without credentials or a custom port.');
      if (source === 'github' && (url.hostname !== 'github.com' || !/^\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+\/?$/.test(url.pathname) || url.search || url.hash)) throw Error('Use a repository URL: https://github.com/owner/repository.');
      status.textContent = source === 'github' ? 'URL format looks good. GitHub is not connected: no repository has been read, detected, built, or published. OAuth and repository import are needed to continue.' : 'URL format looks good. Accessibility and embed permission have not been verified. Preview and publishing require the URL import service.';
    } catch (error) { status.textContent = error instanceof TypeError ? 'Enter a valid HTTPS URL.' : error.message; }
  };
  const legacyOpen = openCreator;
  // Explicit work/remix callers retain their editor. The general Creator entry opens Gateway.
  openCreator = function(work) { if (work) legacyOpen(work); else openGateway(); };
  gateway.querySelector('#gateway-open-upload').onclick = ()=>{
    openEditor('html');
  };
  gateway.querySelector('#gateway-draft').onclick = ()=>openEditor();
  gateway.querySelector('#gateway-template').onclick = ()=>openEditor('template');
  const back = document.createElement('button');
  back.type='button'; back.className='gateway-back'; back.textContent='← Choose import source'; back.onclick=openGateway;
  publishDialog.querySelector('.dialog-head').prepend(back);
  modes.hidden = false;
  document.querySelector('#publish-heading').textContent='Prepare your playable Slice';
  publishDialog.querySelector('h2+p').textContent='Try your experience and tell people what they can play and explore.';
  const entry = document.querySelector('#publish-entry');
  entry.textContent='＋ Creator'; entry.onclick=openGateway;
  if (new URLSearchParams(location.search).has('create')) openGateway();
  // Put project identity first, with advanced delivery settings below the upload.
  const fields=publishDialog.querySelector('.publish-fields');
  const title=publishForm.elements.title.closest('label');
  const description=publishForm.elements.description.closest('label');
  const heading=document.createElement('h3');heading.className='project-section-title';heading.textContent='Project details';
  fields.prepend(heading,title,description);
  const settings=document.createElement('details');settings.className='project-settings';settings.open=true;
  settings.innerHTML='<summary>Project settings</summary>';
  fields.append(settings);
  for(const name of ['category','author'])settings.append(publishForm.elements[name].closest('label'));
  settings.append(deliveryFields);
  publishForm.elements.title.placeholder='Give your project a title';
  publishForm.elements.description.placeholder='What can people do, play, or explore?';
})();
