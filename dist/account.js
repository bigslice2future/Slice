(function(){
  'use strict';
  const profile = document.querySelector('header .profile');
  const panel = document.createElement('dialog'); panel.id = 'account-dialog';
  panel.setAttribute('aria-labelledby', 'account-title');
  panel.innerHTML = `<div class="dialog-head"><span>YOUR SLICE ACCOUNT</span><button type="button" data-account-close aria-label="Close account">✕</button></div><h2 id="account-title">Keep your discoveries.</h2><p id="account-description">Sign in with an email link. New here? The same link creates your account.</p><form id="account-form"><label for="account-email">Email address</label><input id="account-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"><button class="dark" type="submit">Email me a sign-in link</button></form><section id="account-signed-in" hidden><p>Signed in as <strong id="account-identity"></strong></p><button type="button" id="account-sign-out">Sign out on this device</button></section><p id="account-status" role="status" aria-live="polite"></p><p class="account-note">Cloud sync currently covers published demo experiences. Uploaded projects and guest saves stay on this browser. Signing in does not upload them.</p>`;
  document.body.append(panel);
  const status = panel.querySelector('#account-status'), form = panel.querySelector('form');
  let client, store, user = null, authBusy = false, lastSent = 0;
  let guestIds = new Set(libraryIds);
  const isCloudWork = id => works.some(w => w.id === id && !w.local && !id.startsWith('local-'));
  const localOnlyIds = () => [...guestIds].filter(id => !isCloudWork(id));
  const message = text => { status.textContent = text; };
  const closeOtherDialogs = () => document.querySelectorAll('dialog[open]').forEach(d => { if (d !== panel) d.close(); });
  function openAccount(){ closeOtherDialogs(); if (!panel.open) panel.showModal(); }
  profile.removeAttribute('onclick'); profile.onclick = openAccount;
  profile.textContent = 'Sign in'; profile.setAttribute('aria-label', 'Sign in to Slice');
  panel.querySelector('[data-account-close]').onclick = () => panel.close();
  function refreshViews(){
    libraryIds = store?.userId ? new Set([...store.ids, ...localOnlyIds()]) : new Set(guestIds);
    render();
    if (dialog.open) decorateWork(works.find(w => w.id === activeId));
    if (libraryDialog.open) renderLibrary();
  }
  const originalLibrary = renderLibrary;
  renderLibrary = function(){
    originalLibrary();
    const summary = libraryDialog.querySelector('.library-summary span:last-child');
    const foot = libraryDialog.querySelector('.library-foot p');
    summary.textContent = !store?.userId ? 'Saved on this browser' : store.phase === 'ready' ? 'Cloud Library · Local uploads stay on this browser' : store.phase === 'saving' ? 'Saving to your account…' : store.phase === 'loading' ? 'Loading your Cloud Library…' : store.error;
    foot.textContent = 'Saving does not purchase, download, or install an experience. Uploaded projects stay on this browser.';
    const action = document.createElement('button'); action.type = 'button';
    if (!store?.userId) { action.textContent = 'Sign in for cloud saves'; action.onclick = openAccount; }
    else { action.textContent = 'Refresh cloud saves'; action.disabled = ['loading','saving'].includes(store.phase); action.onclick = () => store.reload(); }
    libraryDialog.querySelector('.library-summary').after(action);
    if (store?.userId) {
      const accountAction = document.createElement('button'); accountAction.type = 'button';
      accountAction.textContent = 'Manage account'; accountAction.onclick = openAccount;
      action.after(accountAction);
    }
  };
  const originalToggle = toggleLibrary;
  toggleLibrary = function(id){
    if (!store?.userId || !isCloudWork(id)) {
      if (store?.userId) libraryIds = new Set(guestIds);
      originalToggle(id); guestIds = new Set(libraryIds); refreshViews(); return;
    }
    if (store.phase !== 'ready') { toast(store.error || 'Please wait for Cloud Library to finish syncing.'); return; }
    void store.toggle(id).then(ok => { if (ok) toast(store.ids.has(id) ? 'Saved to your account.' : 'Removed from your account.'); else if(store.error) toast(store.error); });
  };
  try {
    const config = window.SLICE_ACCOUNT_CONFIG;
    client = window.supabase.createClient(config.url, config.publishableKey);
    store = new CloudLibraryStore({
      async list(owner){
        const all = []; let offset = 0;
        while (true) {
          const {data,error} = await client.from('saved_slices').select('slice_id').eq('user_id',owner).order('slice_id').range(offset,offset+499);
          if (error) throw error;
          all.push(...data.map(r=>r.slice_id).filter(isCloudWork));
          if (data.length < 500) return all;
          offset += 500;
        }
      },
      async write(owner,id,save){
        const query = save ? client.from('saved_slices').upsert({user_id:owner,slice_id:id},{onConflict:'user_id,slice_id',ignoreDuplicates:true}) : client.from('saved_slices').delete().eq('user_id',owner).eq('slice_id',id);
        const {error} = await query; if (error) throw error;
      }
    }, refreshViews);
    function sessionChanged(session){
      user = session?.user || null;
      profile.textContent = user ? 'Account' : 'Sign in';
      profile.setAttribute('aria-label',user ? 'Your Slice account' : 'Sign in to Slice');
      form.hidden = !!user; panel.querySelector('#account-signed-in').hidden = !user;
      panel.querySelector('#account-identity').textContent = user?.email || '';
      panel.querySelector('#account-description').textContent = user ? 'Your published discoveries can now follow you across devices.' : 'Sign in with an email link. New here? The same link creates your account.';
      message(user ? 'Signed in. Open Library to check sync status.' : '');
      // Clear the old account immediately; perform requests outside the SDK auth lock.
      if (store.userId !== (user?.id || null)) {
        store.userId = null; store.ids = new Set(); ++store.epoch; store.phase = 'guest'; refreshViews();
      }
      const nextId = user?.id || null;
      setTimeout(() => { if ((user?.id || null) === nextId) void store.setUser(nextId); },0);
    }
    client.auth.onAuthStateChange((_event,session) => sessionChanged(session));
    // INITIAL_SESSION is emitted by the SDK; avoid racing a second session read against sign-out.
    form.onsubmit = async event => {
      event.preventDefault(); if(authBusy) return;
      if(Date.now()-lastSent < 60000){message('Please wait a minute before requesting another link.');return;}
      authBusy = true; const button = form.querySelector('button'); button.disabled = true;
      message('Sending your sign-in link…');
      try {
        const {error} = await client.auth.signInWithOtp({email:form.elements.email.value.trim(),options:{emailRedirectTo:location.origin+'/'}});
        if(error) throw error;
        lastSent = Date.now(); message('Check your email for a sign-in link. If it does not arrive, check spam or try again in a minute.');
      } catch(error) {
        message(error.code === 'over_email_send_rate_limit' ? 'Too many emails requested. Please wait before trying again.' : error.code === 'email_address_not_authorized' ? 'Email sign-in is not open to this address yet. Please contact the site owner.' : 'Could not send a sign-in link. Please try again later or contact the site owner.');
      } finally { authBusy = false; button.disabled = false; }
    };
    panel.querySelector('#account-sign-out').onclick = async () => {
      if(authBusy) return; authBusy = true;
      try { const {error} = await client.auth.signOut({scope:'local'}); if(error) throw error; message('Signed out on this device.'); }
      catch (_) { message('Could not sign out. Please try again.'); }
      finally {authBusy=false;}
    };
    window.addEventListener('focus',()=>{if(store.userId && !['loading','saving'].includes(store.phase)) void store.reload();});
    window.addEventListener('storage',event=>{if(event.key==='slice-library-v1'){const saved=readStored('slice-library-v1',[]);guestIds=new Set(Array.isArray(saved)?saved.filter(x=>typeof x==='string'):[]);refreshViews();}});
  } catch (_) {
    form.hidden = true; message('Account service is unavailable. Your local Library is still available.');
  }
})();
