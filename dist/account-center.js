(() => {
 'use strict';
 const account=window.SliceAccount,client=account?.client;if(!client)return;
 const panel=document.querySelector('#account-dialog'),signed=panel.querySelector('#account-signed-in');
 const nameOf=p=>p?.display_name||'Curious Slicer';
 const validAvatar=value=>typeof value==='string'&&value.length<=100000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value);
 const avatarMarkup=(p,cls='creator-avatar')=>validAvatar(p?.avatar)?`<img class="${cls}" src="${p.avatar}" alt="">`:`<span class="${cls}" aria-hidden="true">${escapeHtml(nameOf(p).slice(0,1).toUpperCase())}</span>`;
 async function checked(query){const {data,error}=await query;if(error)throw error;return data;}
 const store=new CreatorStore({
  profile:id=>checked(client.from('creator_profiles').select('id,display_name,avatar').eq('id',id).maybeSingle()),
  slices:id=>checked(client.from('slices').select('id,title,description,created_at,deleted_at,status').eq('creator_id',id).eq('status','published').order('created_at',{ascending:false}))
 },renderAccount);
 let draftAvatar='',avatarDirty=false,avatarBusy=false,profileDirty=false,profileOwner=null,tab='published',pendingDelete=null,profileEpoch=0;
 const updateRequests=new Map(),updateCache=new Map(),updateLoading=new Set(),updateErrors=new Map();let updateEpoch=0;
 const owns=w=>!!account.user&&w?.cloud&&w.creatorId===account.user.id;
 window.SliceCreator={owns,updates:id=>updateCache.get(id)||[],loadUpdates,saveUpdate,deleteUpdate};
 signed.innerHTML=`<div id="creator-summary"></div><nav class="account-tabs" aria-label="Account sections"><button type="button" data-account-tab="published">My Slices</button><button type="button" data-account-tab="profile">Edit profile</button><button type="button" data-account-tab="trophies">Trophies</button></nav><section id="creator-work-section"><div class="account-section-heading"><h3>Published Slices</h3><button type="button" id="creator-refresh">Refresh</button></div><div class="creator-filter"><button type="button" data-creator-filter="published">Published</button><button type="button" data-creator-filter="deleted">Deleted</button></div><div id="creator-works" aria-live="polite"></div></section><section id="creator-profile-section" hidden><h3>Edit your profile</h3><form id="creator-profile-form"><div class="avatar-editor"><div id="creator-avatar-preview"></div><div><label class="avatar-upload" for="creator-avatar-file">Choose photo</label><input id="creator-avatar-file" type="file" accept="image/png,image/jpeg,image/webp"><button type="button" id="creator-avatar-remove">Remove photo</button><p>JPG, PNG or WebP · up to 5 MB</p></div></div><label for="creator-display-name">Display name</label><input id="creator-display-name" name="displayName" required maxlength="40" autocomplete="nickname"><p class="account-note">Your name and photo appear on your public creator page.</p><button type="submit" class="dark">Save profile</button><p id="creator-profile-status" role="status"></p></form></section><section id="creator-trophy-section" hidden><span class="eyebrow">YOUR TROPHY SHELF</span><h3>A place for your achievements.</h3><div class="trophy-shelf" aria-label="Future trophy collection"><span aria-hidden="true">♜</span><span aria-hidden="true">✧</span><span aria-hidden="true">☆</span></div><p>Trophies are coming soon. Your earned achievements will appear here.</p></section><p id="creator-service-status" role="status"></p><div class="account-footer"><span id="creator-private-email"></span><button type="button" id="account-sign-out">Sign out</button></div>`;
 let filter='published';
 const nameInput=signed.querySelector('#creator-display-name'),profileForm=signed.querySelector('#creator-profile-form'),profileStatus=signed.querySelector('#creator-profile-status');
 function renderAccount(){
  const user=account.user;panel.classList.toggle('account-member',!!user);
  if(!user||account.recovering){panel.classList.toggle('account-member',false);return;}
  const p=store.profile;
  signed.querySelector('#creator-summary').innerHTML=`${avatarMarkup(p)}<div><span class="eyebrow">YOUR CREATOR SPACE</span><h2>${escapeHtml(nameOf(p))}</h2><p>${store.slices.filter(s=>!s.deleted_at).length} published Slices</p></div><button type="button" id="creator-public-page">View public page ↗</button>`;
  signed.querySelector('#creator-public-page').onclick=()=>showCreator(user.id);
  signed.querySelector('#creator-private-email').textContent=user.email||'';
  signed.querySelector('#creator-service-status').textContent=store.error||(store.phase==='loading'?'Loading your creator space…':'');
  signed.querySelector('#creator-refresh').disabled=store.busy;
  profileForm.querySelector('[type=submit]').disabled=store.phase!=='ready'||store.busy||avatarBusy;
  if(profileOwner!==user.id){profileOwner=user.id;profileDirty=false;avatarDirty=false;draftAvatar='';}
  if(!profileDirty)nameInput.value=nameOf(p);
  if(!avatarDirty)draftAvatar=p?.avatar||'';
  signed.querySelector('#creator-avatar-preview').innerHTML=avatarMarkup({display_name:nameInput.value,avatar:draftAvatar});
  signed.querySelectorAll('[data-account-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.accountTab===tab?'page':'false'));
  signed.querySelector('#creator-work-section').hidden=tab!=='published';signed.querySelector('#creator-profile-section').hidden=tab!=='profile';signed.querySelector('#creator-trophy-section').hidden=tab!=='trophies';
  signed.querySelectorAll('[data-creator-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.creatorFilter===filter));
  const list=store.slices.filter(s=>filter==='deleted'?!!s.deleted_at:!s.deleted_at);
  signed.querySelector('#creator-works').innerHTML=store.phase==='loading'?'<p>Loading your Slices…</p>':store.phase==='error'?'<p>We could not load your Slices. Use Refresh to retry.</p>':list.map(s=>`<article class="creator-work"><div><span class="eyebrow">${s.deleted_at?'DELETED':escapeHtml(updateDate(s.created_at))}</span><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.description)}</p></div><div class="creator-work-actions">${s.deleted_at?`<button data-creator-restore="${s.id}">Restore Slice</button>`:`<button data-creator-open="${s.id}">Play ↗</button><button data-creator-updates="${s.id}">Add / manage updates</button><button data-creator-delete="${s.id}" class="danger-text">Delete Slice</button>`}</div></article>`).join('')||`<div class="creator-empty"><h4>${filter==='deleted'?'No deleted Slices.':'Your first Slice starts here.'}</h4><p>${filter==='deleted'?'Deleted works can be restored here.':'Publish an interactive experience to see it on your creator page.'}</p>${filter==='published'?'<button type="button" data-creator-new class="dark">Create a Slice →</button>':''}</div>`;
  signed.querySelectorAll('[data-creator-restore],[data-creator-delete],[data-creator-updates],[data-creator-open]').forEach(b=>b.disabled=store.busy);
  account.renderAvatar(p);
  for(const w of works)if(w.cloud&&w.creatorId===user.id){w.author=nameOf(p);w.authorAvatar=p?.avatar||'';}
 }
 signed.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.accountTab){tab=b.dataset.accountTab;renderAccount();}
  if(b.dataset.creatorFilter){filter=b.dataset.creatorFilter;renderAccount();}
  if(b.id==='creator-refresh')void store.reload();
  if(b.hasAttribute('data-creator-new')){panel.close();openCreator();}
  if(b.dataset.creatorOpen||b.dataset.creatorUpdates){
   const id=b.dataset.creatorOpen||b.dataset.creatorUpdates,owner=account.user?.id;
   b.disabled=true;
   try{await ensureWork(id);if(owner!==account.user?.id)return;panel.close();openWork(id);if(b.dataset.creatorUpdates){await loadUpdates(id);updateManaging=true;renderSliceUpdates();editSliceUpdate(null);updateSection.scrollIntoView({block:'start',behavior:'smooth'});}}
   catch(_){toast('This Slice could not load. Refresh and try again.');}finally{b.disabled=false;}
  }
  if(b.dataset.creatorDelete){pendingDelete={id:b.dataset.creatorDelete,owner:account.user.id};const s=store.slices.find(s=>s.id===pendingDelete.id);confirmDialog.querySelector('strong').textContent=s.title;confirmDialog.showModal();}
  if(b.dataset.creatorRestore)await changeDeleted(b.dataset.creatorRestore,false);
  if(b.id==='account-sign-out'){
   b.disabled=true;try{const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;account.open();}catch(_){toast('Could not sign out. Please try again.');}finally{b.disabled=false;}
  }
 });
 const confirmDialog=document.createElement('dialog');confirmDialog.id='creator-delete-dialog';confirmDialog.setAttribute('aria-labelledby','creator-delete-title');confirmDialog.innerHTML='<h2 id="creator-delete-title">Delete this Slice?</h2><p><strong></strong> will disappear from Discover and your public page. You can restore it from Deleted Slices.</p><div><button type="button" data-cancel-delete>Cancel</button><button type="button" class="dark" data-confirm-delete>Delete Slice</button></div>';document.body.append(confirmDialog);
 confirmDialog.querySelector('[data-cancel-delete]').onclick=()=>{confirmDialog.close();pendingDelete=null;};
 confirmDialog.querySelector('[data-confirm-delete]').onclick=async()=>{const pending=pendingDelete;confirmDialog.close();pendingDelete=null;if(pending?.owner===account.user?.id)await changeDeleted(pending.id,true);};
 async function changeDeleted(id,deleted){const owner=account.user?.id;const ok=await store.mutate(()=>checked(client.rpc('set_slice_deleted',{p_slice:id,p_deleted:deleted})));if(!ok||account.user?.id!==owner)return;if(deleted){const i=works.findIndex(w=>w.id===id);if(i!==-1)works.splice(i,1);updateCache.delete(id);if(activeId===id&&dialog.open)dialog.close();}else await ensureWork(id);render();if(libraryDialog.open)renderLibrary();toast(deleted?'Slice deleted. You can restore it from Deleted.':'Slice restored.');}
 nameInput.addEventListener('input',()=>{profileDirty=true;});
 signed.querySelector('#creator-avatar-remove').onclick=()=>{draftAvatar='';avatarDirty=true;renderAccount();};
 signed.querySelector('#creator-avatar-file').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){profileStatus.textContent='Choose a JPG, PNG or WebP image up to 5 MB.';event.target.value='';return;}
  const owner=account.user?.id,epoch=++profileEpoch;avatarBusy=true;renderAccount();profileStatus.textContent='Preparing your photo…';
  try{const bitmap=await createImageBitmap(file);try{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const context=canvas.getContext('2d');context.fillStyle='#eef0e5';context.fillRect(0,0,256,256);const size=Math.min(bitmap.width,bitmap.height);context.drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,256,256);const avatar=canvas.toDataURL('image/jpeg',0.82);if(!validAvatar(avatar))throw Error('Image too large');if(owner===account.user?.id&&epoch===profileEpoch){draftAvatar=avatar;avatarDirty=true;profileStatus.textContent='Photo ready. Save profile to apply it.';}}finally{bitmap.close();}}catch(_){if(owner===account.user?.id)profileStatus.textContent='This image could not be read. Try another photo.';}finally{if(epoch===profileEpoch){avatarBusy=false;renderAccount();}event.target.value='';}
 };
 profileForm.onsubmit=async event=>{event.preventDefault();const name=nameInput.value.trim();if(!name||[...name].length>40){profileStatus.textContent='Enter a display name of 1 to 40 characters.';return;}if(avatarBusy)return;const owner=account.user?.id;profileStatus.textContent='Saving…';const ok=await store.mutate(()=>checked(client.rpc('save_creator_profile',{p_name:name,p_avatar:draftAvatar})));if(owner!==account.user?.id)return;if(ok){profileDirty=false;avatarDirty=false;renderAccount();render();profileStatus.textContent='Profile saved.';}else profileStatus.textContent=store.error;};
 async function ensureWork(id){if(works.some(w=>w.id===id))return;const row=await checked(client.from('public_slices').select('*').eq('id',id).single());works.unshift(window.SliceCloudProject(row));}
 function loadUpdates(id){if(updateRequests.has(id))return updateRequests.get(id);const request=performLoadUpdates(id).finally(()=>{if(updateRequests.get(id)===request)updateRequests.delete(id);});updateRequests.set(id,request);return request;}
 async function performLoadUpdates(id){const epoch=updateEpoch;updateLoading.add(id);updateErrors.delete(id);if(updateWorkId===id)renderSliceUpdates();try{const rows=await checked(client.from('slice_updates').select('*').eq('slice_id',id).order('created_at',{ascending:false}));if(epoch!==updateEpoch)return;updateCache.set(id,rows.map(r=>({id:r.id,kind:r.kind,title:r.title,body:r.body,eventDate:r.event_date||'',date:r.created_at,edited:r.edited,deleted:!!r.deleted_at})));}catch(_){if(epoch===updateEpoch)updateErrors.set(id,'Updates could not load. Retry to continue.');}finally{if(epoch===updateEpoch){updateLoading.delete(id);if(updateWorkId===id)renderSliceUpdates();}}}
 window.SliceCreator.loading=id=>updateLoading.has(id);window.SliceCreator.error=id=>updateErrors.get(id)||'';
 async function saveUpdate(id,entry){if(!owns(works.find(w=>w.id===id)))throw Error('Only the creator can post updates.');await checked(client.rpc('save_slice_update',{p_slice:id,p_id:entry.id||null,p_kind:entry.kind,p_title:entry.title,p_body:entry.body,p_event_date:entry.eventDate||null}));await loadUpdates(id);}
 async function deleteUpdate(id,entryId,deleted){if(!owns(works.find(w=>w.id===id)))throw Error('Only the creator can manage updates.');await checked(client.rpc('set_slice_update_deleted',{p_slice:id,p_id:entryId,p_deleted:deleted}));await loadUpdates(id);}
 function sessionChanged(){profileEpoch++;avatarBusy=false;profileDirty=false;avatarDirty=false;profileOwner=null;profileStatus.textContent='';pendingDelete=null;confirmDialog.close();updateEpoch++;updateRequests.clear();updateCache.clear();updateLoading.clear();updateErrors.clear();updateManaging=false;panel.classList.toggle('account-member',!!account.user&&!account.recovering);void store.setUser(account.user?.id||null);if(dialog.open&&works.find(w=>w.id===updateWorkId)?.cloud)void loadUpdates(updateWorkId);}
 let sessionOwner;window.addEventListener('slice-account-changed',()=>{const id=account.user?.id||null;if(id!==sessionOwner){sessionOwner=id;sessionChanged();}else renderAccount();});sessionOwner=account.user?.id||null;sessionChanged();
 window.addEventListener('slice-cloud-loaded',()=>{if(account.user&&!store.busy)void store.reload();});
 const creatorPage=document.createElement('dialog');creatorPage.id='creator-page';creatorPage.setAttribute('aria-labelledby','creator-page-title');document.body.append(creatorPage);let publicEpoch=0;
 async function showCreator(id){if(!/^[0-9a-f-]{36}$/i.test(id))return;const epoch=++publicEpoch;panel.close();document.querySelectorAll('dialog[open]').forEach(d=>d.close());creatorPage.innerHTML='<div class="dialog-head"><span>CREATOR PAGE</span><button data-close-creator aria-label="Close creator page">✕</button></div><p>Loading creator…</p>';creatorPage.showModal();creatorPage.querySelector('[data-close-creator]').onclick=()=>creatorPage.close();
  try{const [p,rows]=await Promise.all([checked(client.from('creator_profiles').select('id,display_name,avatar').eq('id',id).maybeSingle()),checked(client.from('public_slices').select('*').eq('creator_id',id).order('created_at',{ascending:false}).limit(100))]);if(epoch!==publicEpoch||!creatorPage.open)return;const person=p||{display_name:rows[0]?.author||'Curious Slicer'};for(const row of rows){const i=works.findIndex(w=>w.id===row.id),w=window.SliceCloudProject(row);if(i<0)works.push(w);else works[i]=w;}creatorPage.innerHTML=`<div class="dialog-head"><span>CREATOR PAGE</span><button data-close-creator aria-label="Close creator page">✕</button></div><div class="creator-public-hero">${avatarMarkup(person)}<div><span class="eyebrow">SLICER</span><h2 id="creator-page-title">${escapeHtml(nameOf(person))}</h2><p>${rows.length} published Slices</p></div><button data-share-creator>Share creator page ↗</button></div><section class="public-trophy-preview"><span aria-hidden="true">☆</span> Trophy shelf · Coming soon</section><h3>Published Slices</h3><div class="creator-public-grid">${rows.map(r=>`<article><div class="creator-public-art" aria-hidden="true">✳</div><h4>${escapeHtml(r.title)}</h4><p>${escapeHtml(r.description)}</p><button data-public-play="${r.id}">Play Slice ↗</button></article>`).join('')||'<p>No published Slices yet.</p>'}</div>`;creatorPage.querySelector('[data-close-creator]').onclick=()=>creatorPage.close();creatorPage.querySelector('[data-share-creator]').onclick=async()=>{const url=location.origin+location.pathname+'#creator='+id;try{await navigator.clipboard.writeText(url);toast('Creator page link copied.');}catch(_){toast('Copy this link: '+url);}};creatorPage.querySelectorAll('[data-public-play]').forEach(b=>b.onclick=()=>{creatorPage.close();openWork(b.dataset.publicPlay);});
  }catch(_){if(epoch!==publicEpoch)return;creatorPage.querySelector('p').textContent='This creator page could not load. Close it and try again.';}
 }
 window.SliceCreator.openPage=showCreator;
 const decorateBefore=decorateWork;decorateWork=function(w){decorateBefore(w);if(w?.cloud&&w.creatorId){const info=document.querySelector('#full-work-panel');if(info&&!info.querySelector('[data-creator-page]')){const button=document.createElement('button');button.type='button';button.dataset.creatorPage=w.creatorId;button.textContent='View '+w.author+'’s Slices ↗';button.onclick=()=>showCreator(w.creatorId);info.append(button);}}};
 const openBefore=openWork;openWork=function(id,remix=false){openBefore(id,remix);if(!remix&&works.find(w=>w.id===id)?.cloud)void loadUpdates(id);};
 function routeCreator(){if(location.hash.startsWith('#creator='))void showCreator(location.hash.slice(9));}
 window.addEventListener('hashchange',routeCreator);routeCreator();
})();
