(function(root){
  'use strict';
  class CloudLibraryStore {
    constructor(adapter, changed = () => {}) {
      this.adapter = adapter; this.changed = changed;
      this.userId = null; this.ids = new Set(); this.phase = 'guest'; this.error = '';
      this.epoch = 0;
    }
    emit() { this.changed(this); }
    async setUser(userId) {
      if (userId === this.userId && this.phase !== 'error') return;
      this.userId = userId; this.ids = new Set(); this.error = '';
      ++this.epoch;
      if (!userId) { this.phase = 'guest'; this.emit(); return; }
      await this.reload();
    }
    async reload() {
      if (!this.userId) return;
      const epoch = ++this.epoch, owner = this.userId;
      this.phase = 'loading'; this.error = ''; this.emit();
      try {
        const ids = await this.adapter.list(owner);
        if (epoch !== this.epoch) return;
        this.ids = new Set(ids); this.phase = 'ready';
      } catch (_) {
        if (epoch !== this.epoch) return;
        this.phase = 'error'; this.error = 'Cloud Library could not load. Retry to continue.';
      }
      this.emit();
    }
    async toggle(id) {
      if (this.phase !== 'ready' || !this.userId) return false;
      const epoch = this.epoch, owner = this.userId, saved = this.ids.has(id);
      this.phase = 'saving'; this.error = ''; this.emit();
      try {
        await this.adapter.write(owner, id, !saved);
        if (epoch !== this.epoch) return false;
        saved ? this.ids.delete(id) : this.ids.add(id);
        this.phase = 'ready'; this.emit(); return true;
      } catch (_) {
        if (epoch !== this.epoch) return false;
        // The server may have accepted a request before the connection failed.
        this.phase = 'error'; this.error = 'Save could not be confirmed. Retry to reload your Library.';
        this.emit(); return false;
      }
    }
  }
  root.CloudLibraryStore = CloudLibraryStore;
  if (typeof module !== 'undefined') module.exports = CloudLibraryStore;
})(typeof window === 'undefined' ? globalThis : window);
