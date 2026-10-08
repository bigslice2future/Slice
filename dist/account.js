(function(){
  'use strict';
  const profile = document.querySelector('header .profile');
  const panel = document.createElement('dialog'); panel.id = 'account-dialog';
  panel.setAttribute('aria-labelledby', 'account-title');
  panel.innerHTML = `<div class="dialog-head"><span>SLICE ACCOUNT</span><button type="button" data-account-close aria-label="Close account">✕</button></div><h2 id="account-title">Sign in</h2><p id="account-description"></p><form id="account-form"><label for="account-email">Email address</label><input id="account-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"><div id="account-password-field"><label for="account-password">Password</label><input id="account-password" name="password" type="password" autocomplete="current-password" required maxlength="128" placeholder="Your password"></div><button class="dark" type="submit" id="account-submit">Sign in</button><div class="login-options"><button type="button" id="account-email-link">Email me a sign-in link</button><button type="button" id="account-forgot-password">Forgot password?</button></div></form><section id="account-signed-in" hidden><p>Signed in as <strong id="account-identity"></strong></p><button type="button" id="account-sign-out">Sign out</button></section><p id="account-status" role="status" aria-live="polite"></p>`;
  document.body.append(panel);
  const status = panel.querySelector('#account-status'), form = panel.querySelector('form');
  let client, store, user = null, authBusy = false, lastSent = 0;
  let loginMode='password';
  const defaultAvatar='<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="16" cy="11" r="5" fill="currentColor"/><path d="M6 28v-3a10 10 0 0 1 20 0v3" fill="currentColor"/></svg>';
  function renderAvatar(p){profile.innerHTML=p?.avatar&&p.avatar.length<=100000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.avatar)?`<img src="${p.avatar}" alt="">`:defaultAvatar;profile.setAttribute('aria-label',user?'Your Slice account':'Sign in to Slice');profile.title=user?'Account':'Sign in';}
  function setLoginMode(mode){loginMode=mode;const reset=mode==='reset';panel.querySelector('#account-title').textContent=reset?'Set your password':'Sign in';form.elements.email.closest('form').querySelector('label[for="account-email"]').hidden=reset;form.elements.email.hidden=reset;form.elements.email.required=!reset;form.elements.password.autocomplete=reset?'new-password':'current-password';form.elements.password.minLength=reset?8:0;panel.querySelector('#account-submit').textContent=reset?'Save password':'Sign in';panel.querySelector('.login-options').hidden=reset;panel.querySelector('#account-description').textContent=reset?'Choose a password with at least 8 characters.':'';form.elements.password.value='';message('');}
  let guestIds = new Set(libraryIds);
  const isCloudWork = id => works.some(w => w.id === id && !w.local && !id.startsWith('local-'));
  const localOnlyIds = () => [...guestIds].filter(id => !isCloudWork(id));
  const message = text => { status.textContent = text; };
  const closeOtherDialogs = () => document.querySelectorAll('dialog[open]').forEach(d => { if (d !== panel) d.close(); });
  function openAccount(){ closeOtherDialogs(); if (!panel.open) panel.showModal(); }
  panel.classList.add('account-login');
  profile.removeAttribute('onclick'); profile.onclick = openAccount;
  renderAvatar();
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
    summary.textContent = !store?.userId ? 'Saved on this browser' : store.phase === 'ready' ? 'Cloud Library · Public experiences sync across devices' : store.phase === 'saving' ? 'Saving to your account…' : store.phase === 'loading' ? 'Loading your Cloud Library…' : store.error;
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
    window.SliceAccount={client,open:openAccount,renderAvatar,get recovering(){return loginMode==='reset';},get user(){return user;}};
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
      renderAvatar();
      panel.classList.toggle('account-login',!user);
      form.elements.password.value='';
      profile.setAttribute('aria-label',user ? 'Your Slice account' : 'Sign in to Slice');
      form.hidden = !!user; panel.querySelector('#account-signed-in').hidden = !user;
      const identity=panel.querySelector('#account-identity');if(identity)identity.textContent = user?.email || '';
      panel.querySelector('#account-description').textContent = '';
      if(!user)setLoginMode('password');
      message('');
      // Clear the old account immediately; perform requests outside the SDK auth lock.
      if (store.userId !== (user?.id || null)) {
        store.userId = null; store.ids = new Set(); ++store.epoch; store.phase = 'guest'; refreshViews();
      }
      window.dispatchEvent(new CustomEvent('slice-account-changed',{detail:{user}}));
      const nextId = user?.id || null;
      setTimeout(() => { if ((user?.id || null) === nextId) void store.setUser(nextId); },0);
    }
    client.auth.onAuthStateChange((event,session) => {sessionChanged(session);if(event==='PASSWORD_RECOVERY'){setLoginMode('reset');panel.classList.remove('account-member');panel.classList.add('account-login');form.hidden=false;panel.querySelector('#account-signed-in').hidden=true;setTimeout(openAccount,0);}});
    // INITIAL_SESSION is emitted by the SDK; avoid racing a second session read against sign-out.
    function setAuthBusy(busy){authBusy=busy;form.querySelectorAll('button').forEach(b=>b.disabled=busy);}
    form.onsubmit = async event => {
      event.preventDefault();if(authBusy)return;setAuthBusy(true);const mode=loginMode;message(mode==='reset'?'Saving password…':'Signing in…');
      try {
        const password=form.elements.password.value;
        if(mode==='reset'){
          const {error}=await client.auth.updateUser({password});if(error)throw error;
          setLoginMode('password');form.hidden=!!user;panel.querySelector('#account-signed-in').hidden=!user;panel.classList.toggle('account-member',!!user);panel.classList.toggle('account-login',!user);message('Password saved. You can now sign in with your email and password.');
        }else{
          const {error}=await client.auth.signInWithPassword({email:form.elements.email.value.trim(),password});if(error)throw error;
          message('');
        }
      }catch(error){message(mode==='reset'?'Could not save the password. Use a new recovery link and try again.':error.code==='email_not_confirmed'?'Confirm your email before signing in.':'Could not sign in. Check your email and password, or use an email link.');}
      finally{form.elements.password.value='';setAuthBusy(false);}
    };
    async function sendEmail(recovery){
      if(authBusy)return;const email=form.elements.email;if(!email.reportValidity())return;
      if(Date.now()-lastSent<60000){message('Please wait a minute before requesting another email.');return;}
      setAuthBusy(true);message('Sending email…');
      try{
        const redirectTo=location.origin+location.pathname;
        const {error}=recovery?await client.auth.resetPasswordForEmail(email.value.trim(),{redirectTo}):await client.auth.signInWithOtp({email:email.value.trim(),options:{emailRedirectTo:redirectTo}});
        if(error)throw error;lastSent=Date.now();message(recovery?'If this email has an account, a password reset link is on its way. Open it to set your password.':'Check your email for a sign-in link. New here? The link creates your account.');
      }catch(_){message('Could not send the email. Please wait and try again.');}finally{setAuthBusy(false);}
    }
    panel.querySelector('#account-email-link').onclick=()=>sendEmail(false);
    panel.querySelector('#account-forgot-password').onclick=()=>sendEmail(true);
    panel.querySelector('#account-sign-out').onclick = async () => {
      if(authBusy) return; authBusy = true;
      try { const {error} = await client.auth.signOut({scope:'local'}); if(error) throw error; setLoginMode('password');openAccount(); }
      catch (_) { message('Could not sign out. Please try again.'); }
      finally {authBusy=false;}
    };
    window.addEventListener('slice-cloud-loaded',()=>{if(store.userId && !['loading','saving'].includes(store.phase))void store.reload();});
    window.addEventListener('focus',()=>{if(store.userId && !['loading','saving'].includes(store.phase)) void store.reload();});
    window.addEventListener('storage',event=>{if(event.key==='slice-library-v1'){const saved=readStored('slice-library-v1',[]);guestIds=new Set(Array.isArray(saved)?saved.filter(x=>typeof x==='string'):[]);refreshViews();}});
  } catch (_) {
    form.hidden = true; message('Account service is unavailable. Your local Library is still available.');
  }
})();
