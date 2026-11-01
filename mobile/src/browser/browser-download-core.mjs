/**
 * SEYVEO Browser downloads — native-first, standalone / embedded shared core.
 * Pure functions; no network or filesystem access here.
 * Downloading must only be triggered by trusted browser chrome after a user
 * gesture; untrusted website messages must never invoke this module.
 */
export const BROWSER_DOWNLOAD_MAX_BYTES = 75 * 1024 * 1024;
const FILE_TYPES = Object.freeze({
  pdf:'document', txt:'document', csv:'document', docx:'document',
  xlsx:'document', pptx:'document', odt:'document', rtf:'document',
  jpg:'image', jpeg:'image', png:'image', webp:'image', gif:'image',
  mp3:'audio', wav:'audio', m4a:'audio',
  mp4:'video', mov:'video', webm:'video',
  zip:'archive'
});

export function parseBrowserDownloadUrl(value) {
  if (typeof value !== 'string' || value.length > 4096) throw Error('invalid-download-url');
  let url;
  try { url = new URL(value); } catch { throw Error('invalid-download-url'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password ||
      url.port && url.port !== '443' ||
      !host.includes('.') || !/^[a-z0-9.-]+$/.test(host) ||
      host.startsWith('.') || host.endsWith('.') || host.includes('..') ||
      host === 'localhost' || /\.(?:localhost|local|internal|test|invalid)$/.test(host) ||
      /^[0-9.]+$/.test(host)) {
    throw Error('unsupported-download-address');
  }
  url.hash = '';
  return url.href;
}

export function safeBrowserDownloadName(value) {
  let name = String(value || 'file');
  try { name = decodeURIComponent(name); } catch { /* keep original */ }
  name = name.split(/[\\/]/).pop() || 'file';
  // Strip invisible direction controls, reserved characters and leading dots.
  name = name.normalize('NFC').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'')
    .replace(/[<>:"|?*]/g,'_').replace(/\s+/g,' ').trim()
    .replace(/^\.+/,'').replace(/[. ]+$/,'');
  if (!name || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = 'file';
  name = name.slice(0, 90).replace(/[. ]+$/,'') || 'file';
  if (!/\.[a-z0-9]{1,8}$/i.test(name)) name += '.bin';
  return name;
}

export function describeBrowserDownload(input, preferredName) {
  const url = parseBrowserDownloadUrl(input);
  const parsed = new URL(url);
  const fromPath = parsed.pathname.split('/').filter(Boolean).pop() || 'file';
  const name = safeBrowserDownloadName(preferredName || fromPath);
  const ext = name.split('.').pop().toLowerCase();
  return Object.freeze({
    url,
    name,
    category: FILE_TYPES[ext] || 'other',
    maxBytes: BROWSER_DOWNLOAD_MAX_BYTES
  });
}

export function createBrowserDownloadController(storage, onChange=()=>{}) {
  if (!storage || typeof storage.list !== 'function' ||
      typeof storage.download !== 'function' || typeof storage.remove !== 'function') {
    throw new TypeError('Download storage adapter is required');
  }
  let items = [], busy = false, loading = false, operation = null;
  const snapshot = () => Object.freeze({
    items: items.map(item=>Object.freeze({...item})),
    busy, loading, operation:operation && Object.freeze({...operation})
  });
  const publish = () => { onChange(snapshot()); };
  return {
    snapshot,
    async refresh() {
      if (busy) return snapshot();
      loading=true;publish();
      try {
        const saved=await storage.list();
        items=Array.isArray(saved)?saved.filter(item=>item && item.status==='complete'):[];
        return snapshot();
      } finally { loading=false;publish(); }
    },
    async start(input, preferredName) {
      if (busy || loading) throw Error('download-already-in-progress');
      const request=describeBrowserDownload(input,preferredName);
      busy=true;
      operation={name:request.name,status:'downloading'};publish();
      try {
        const item=await storage.download(request);
        if (!item || item.status!=='complete') throw Error('download-not-committed');
        items=[item,...items.filter(other=>other.id!==item.id)];
        operation={name:item.name,status:'complete'};
        return item;
      } catch (error) {
        operation={name:request.name,status:'failed'};
        throw error;
      } finally { busy=false;publish(); }
    },
    async remove(id) {
      if (busy || loading) throw Error('download-already-in-progress');
      if (typeof id!=='string' || !/^[a-f0-9-]{36}$/.test(id)) throw Error('invalid-download-id');
      busy=true;publish();
      try { await storage.remove(id);items=items.filter(item=>item.id!==id); }
      finally { busy=false;publish(); }
      return snapshot();
    }
  };
}
