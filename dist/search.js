const searchForm=document.createElement('form');
searchForm.className='discovery-search';searchForm.setAttribute('role','search');
searchForm.innerHTML='<label for="slice-search"><span aria-hidden="true">⌕</span><span class="search-label">Search experiences</span></label><input id="slice-search" type="search" placeholder="Search experiences, creators, or topics…" autocomplete="off" aria-describedby="search-status"><button type="button" id="clear-search" hidden>Clear</button><span id="search-status" role="status" aria-live="polite"></span>';
categoryBar.before(searchForm);
const searchInput=searchForm.querySelector('input');
const searchRenderBefore=render;
render=function(){
 searchRenderBefore();
 const active=!!searchQuery.trim(),count=document.querySelectorAll('#feed .card').length;
 featuredRow.hidden=active||selected!=='All';
 document.querySelector('.feature').hidden=active||selected!=='All';
 document.querySelector('.queue-entry').hidden=active||selected!=='All';
 document.querySelector('.product-philosophy').hidden=active;
 document.querySelector('.app-downloads').hidden=active;
 document.querySelector('#clear-search').hidden=!searchQuery;
 document.querySelector('#search-status').textContent=active?`${count} ${count===1?'result':'results'}${selected!=='All'?' in '+selected:''}`:'';
 if(active)document.querySelector('#feed-label').textContent=`Search results · ${count} playable experiences`;
 if(!count){const empty=document.createElement('div');empty.className='search-empty';empty.innerHTML='<span aria-hidden="true">⌕</span><h3>No experiences found</h3><p>Try another keyword or explore all categories.</p><button type="button">Reset search and filters</button>';empty.querySelector('button').onclick=()=>{searchQuery='';searchInput.value='';categoryBar.querySelector('[data-cat="All"]').click();searchInput.focus()};document.querySelector('#feed').append(empty)}
};
searchInput.addEventListener('input',()=>{searchQuery=searchInput.value;render()});
searchForm.onsubmit=e=>{e.preventDefault();searchQuery=searchInput.value;render()};
document.querySelector('#clear-search').onclick=()=>{searchQuery='';searchInput.value='';render();searchInput.focus()};
// Category handlers also control featured blocks; reconcile search visibility last.
categoryBar.addEventListener('click',e=>{if(e.target.matches('[data-cat]'))render()});
render();
