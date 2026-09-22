function importedStage(w){
 if(w.assetType==='html'&&typeof w.asset==='string'){
 const policy="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
 const source='<!doctype html><meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="viewport" content="width=device-width,initial-scale=1">'+w.asset;
 return `<div class="slice imported-html"><iframe title="${escapeHtml(w.title||'HTML Slice预览')}" sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="${escapeHtml(source)}"></iframe><span class="slice-badge">HTML INTERACTIVE</span></div>`;
 }
 if(w.assetType==='image'&&/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(w.asset))return `<div class="slice reveal-slice"><img src="${escapeHtml(w.asset)}" alt="${escapeHtml(w.title||'Slice图片')}"><div class="reveal-overlay"><div class="reveal-result" hidden>${escapeHtml(w.reveal||'这里藏着一个新的发现。')}</div><button type="button" data-reveal aria-expanded="false">${escapeHtml(w.buttonText||'点击揭晓')}</button></div></div>`;
 return '<div class="upload-empty">文件无法读取，请重新导入。</div>';
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-reveal]');if(!b)return;const result=b.previousElementSibling;result.hidden=!result.hidden;b.setAttribute('aria-expanded',String(!result.hidden));if(!b.dataset.label)b.dataset.label=b.textContent;b.textContent=result.hidden?b.dataset.label:'收起 ↑'});
