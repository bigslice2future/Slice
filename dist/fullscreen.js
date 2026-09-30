// Expand the existing stage in place so sandboxed games keep their state.
(() => {
  const viewer = document.querySelector('#work-dialog');
  const panel = viewer.querySelector('.detail-main-card');
  const stage = document.querySelector('#dialog-stage');
  if (!panel || !stage) return;
  const bar = document.createElement('div');
  bar.className = 'slice-fullscreen-bar';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = '⛶ Full screen';
  toggle.setAttribute('aria-pressed', 'false');
  const hint = document.createElement('span');
  hint.textContent = 'Esc to return';
  hint.hidden = true;
  bar.append(hint, toggle);
  stage.before(bar);
  let expanded = false;
  let nativeEntered = false;
  let previousFocus;
  let previousOverflow;
  let requestId = 0;

  function restore() {
    if (!expanded) return;
    expanded = false;
    nativeEntered = false;
    requestId++;
    viewer.classList.remove('slice-expanded');
    document.body.style.overflow = previousOverflow;
    toggle.textContent = '⛶ Full screen';
    toggle.setAttribute('aria-pressed', 'false');
    hint.hidden = true;
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
    window.dispatchEvent(new Event('resize'));
  }
  async function leave() {
    restore();
    if (document.fullscreenElement === panel) {
      try { await document.exitFullscreen(); } catch (_) { /* Page mode is already restored. */ }
    }
  }
  function enter() {
    if (expanded || !viewer.open) return;
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    expanded = true;
    viewer.classList.add('slice-expanded');
    document.body.style.overflow = 'hidden';
    toggle.textContent = '↙ Exit full screen';
    toggle.setAttribute('aria-pressed', 'true');
    hint.hidden = false;
    toggle.focus({preventScroll: true});
    window.dispatchEvent(new Event('resize'));
    const id = ++requestId;
    if (panel.requestFullscreen && document.fullscreenEnabled) {
      try {
        Promise.resolve(panel.requestFullscreen()).then(() => {
          if (id !== requestId || !expanded) {
            if (document.fullscreenElement === panel) document.exitFullscreen().catch(() => {});
            return;
          }
          nativeEntered = document.fullscreenElement === panel;
        }).catch(() => { /* Keep the usable page-filling mode if fullscreen is denied. */ });
      } catch (_) { /* Older browsers still get page-filling mode. */ }
    }
  }
  toggle.addEventListener('click', () => expanded ? leave() : enter());
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === panel) nativeEntered = true;
    else if (nativeEntered) restore();
  });
  viewer.addEventListener('cancel', event => {
    if (expanded) { event.preventDefault(); leave(); }
  });
  viewer.addEventListener('close', leave);
  document.addEventListener('keydown', event => {
    if (expanded && event.key === 'Escape') {
      event.preventDefault();
      leave();
    }
  }, true);

  function decorateCards() {
    document.querySelectorAll('.card-actions [data-open], [data-library-open]').forEach(open => {
      const host = open.parentElement;
      if (host.querySelector('[data-fullscreen-work]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.fullscreenWork = open.dataset.open || open.dataset.libraryOpen;
      button.textContent = '⛶ Full screen';
      host.insertBefore(button, open);
    });
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-fullscreen-work]');
    if (!button) return;
    // A Library modal must be dismissed before opening the experience.
    button.closest('dialog')?.close();
    openWork(button.dataset.fullscreenWork);
    enter();
  });
  // Feed, search, cloud publications and Library all replace their card markup.
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; decorateCards(); });
  }).observe(document.body, {childList: true, subtree: true});
  decorateCards();
})();
