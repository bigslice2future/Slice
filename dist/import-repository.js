// Repository contract: publish(preview, details, confirmed), list(), get(id).
// One atomic localStorage write keeps slices, sources and versions consistent.
// Replace this adapter with an authenticated Supabase repository for public publishing.
const SliceImportRepository = (()=>{
  const key='slice-import-repository-v1';
  function read(){const value=JSON.parse(localStorage.getItem(key)||'{"slices":[],"slice_sources":[],"slice_versions":[]}');if(!['slices','slice_sources','slice_versions'].every(k=>Array.isArray(value[k])))throw Error('Saved import data is invalid.');return value;}
  function project(db,slice){const version=db.slice_versions.find(v=>v.id===slice.current_version_id);if(!version)return null;return {...slice,desc:slice.description,assetType:'html',asset:version.html,contentType:'interactive',local:true,template:'beat',cat:'Creative',bg:'#dfff85',time:'Published locally',likes:0,plays:'0'};}
  return {
    publish(preview,details,confirmed){
      if(!confirmed||preview.status!=='preview'||!preview.version)throw Error('Test and confirm the preview before publishing.');
      if(!details.title.trim())throw Error('Enter a title.');
      const db=read();const existing=db.slices.find(s=>s.current_version_id===preview.version.id);if(existing)return project(db,existing);
      const id='local-'+crypto.randomUUID(),created_at=new Date().toISOString();
      const slice={id,title:details.title.trim().slice(0,80),description:details.description.trim().slice(0,160),author:'Curious Slicer',status:'published',current_version_id:preview.version.id,created_at};
      db.slices.unshift(slice);db.slice_sources.push({...preview.source,slice_id:id});db.slice_versions.push({...preview.version,slice_id:id,source_id:preview.source.id});
      localStorage.setItem(key,JSON.stringify(db));return project(db,slice);
    },
    list(){const db=read();return db.slices.map(s=>project(db,s)).filter(Boolean);},
    get(id){return this.list().find(s=>s.id===id)||null;}
  };
})();
try { works.unshift(...SliceImportRepository.list());render(); } catch { toast('Imported Library could not be loaded. Check browser storage.'); }
