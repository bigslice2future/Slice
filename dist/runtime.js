// User code is always untrusted. Never add allow-same-origin to this sandbox.
const SliceRuntime = Object.freeze({
  policy: "default-src 'none'; script-src 'unsafe-inline'; script-src-elem 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; media-src data:; connect-src 'none'; worker-src 'none'; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
  frame(html,title='Interactive Slice preview') {
    const source='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+this.policy+'"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>';
    return `<iframe loading="lazy" title="${escapeHtml(title)}" sandbox="allow-scripts" allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; payment 'none'; fullscreen 'none'; usb 'none'; serial 'none'; bluetooth 'none'; display-capture 'none'" referrerpolicy="no-referrer" srcdoc="${escapeHtml(source)}"></iframe>`;
  }
});
