(function(root){
 'use strict';
 class CreatorStore {
  constructor(adapter,changed=()=>{}){this.adapter=adapter;this.changed=changed;this.userId=null;this.epoch=0;this.profile=null;this.slices=[];this.phase='guest';this.error='';this.busy=false;}
  emit(){this.changed(this);}
  async setUser(id){this.userId=id;this.epoch++;this.profile=null;this.slices=[];this.busy=false;this.error='';this.phase=id?'loading':'guest';this.emit();if(id)await this.reload();}
  async reload(){if(!this.userId)return;const owner=this.userId,epoch=++this.epoch;this.phase='loading';this.error='';this.emit();try{const [profile,slices]=await Promise.all([this.adapter.profile(owner),this.adapter.slices(owner)]);if(epoch!==this.epoch)return;this.profile=profile;this.slices=slices;this.phase='ready';}catch(_){if(epoch!==this.epoch)return;this.phase='error';this.error='Your creator profile could not load. Please retry.';}this.emit();}
  async mutate(action){if(!this.userId||this.busy||this.phase!=='ready')return false;const owner=this.userId,epoch=this.epoch;let finishingEpoch=epoch;this.busy=true;this.error='';this.emit();try{await action(owner);if(epoch!==this.epoch)return false;const reload=this.reload();finishingEpoch=this.epoch;await reload;return this.userId===owner&&this.phase==='ready';}catch(_){if(epoch!==this.epoch)return false;this.error='The change could not be confirmed. Refresh before trying again.';this.phase='error';return false;}finally{if(this.userId===owner&&this.epoch===finishingEpoch){this.busy=false;this.emit();}}}
 }
 root.CreatorStore=CreatorStore;if(typeof module!=='undefined')module.exports=CreatorStore;
})(typeof window==='undefined'?globalThis:window);
