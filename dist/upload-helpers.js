function importedStage(w) {
  if (w.assetType === 'html' && hasInteractiveRuntime(w.asset)) {
    const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
    const source = '<!doctype html><meta http-equiv="Content-Security-Policy" content="' + policy + '"><meta name="viewport" content="width=device-width,initial-scale=1">' + w.asset;
    return `<div class="slice imported-html"><iframe title="${escapeHtml(w.title || 'Interactive Slice preview')}" sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="${escapeHtml(source)}"></iframe><span class="slice-badge">PLAYABLE EXPERIENCE</span></div>`;
  }
  return '<div class="upload-empty">This item has no supported interactive experience. Import a playable HTML project.</div>';
}
