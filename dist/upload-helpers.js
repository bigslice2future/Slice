function importedStage(w) {
  if (w.assetType === 'html' && hasInteractiveRuntime(w.asset)) {
    return `<div class="slice imported-html">${SliceRuntime.frame(w.asset,w.title)}<span class="slice-badge">PLAYABLE EXPERIENCE</span></div>`;
  }
  return '<div class="upload-empty">This item has no supported interactive experience. Import a playable HTML project.</div>';
}
