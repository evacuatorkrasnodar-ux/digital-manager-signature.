/**
 * SEYVEO Browser native file adapter (Expo).
 * Files remain inside the device app sandbox; this never sends data to SEYVEO.
 * Not connected to an in-app WebView or UI yet.
 *
 * Does not copy cookies/credentials from visited sites. Downloads requiring
 * authentication, blob: links or POST are not supported by this adapter.
 */
import * as Crypto from 'expo-crypto';
import {Directory,File,Paths} from 'expo-file-system';
import {BROWSER_DOWNLOAD_MAX_BYTES} from './browser-download-core.mjs';

const root = () => new Directory(Paths.document,'seyveo-browser-downloads');
const validId = value => typeof value==='string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const file = id => new File(root(),id+'.blob');
const partial = id => new File(root(),id+'.partial');
const info = id => new File(root(),id+'.json');
const clean = entry => {
  if (!entry || typeof entry !== 'object' || !validId(entry.id) ||
      entry.status !== 'complete' || typeof entry.name!=='string' ||
      entry.name.length>100 || typeof entry.category!=='string' ||
      typeof entry.bytes!=='number' || !Number.isFinite(entry.bytes) ||
      entry.bytes<0 || entry.bytes>BROWSER_DOWNLOAD_MAX_BYTES ||
      !Number.isSafeInteger(entry.savedAt)) return null;
  return {id:entry.id,name:entry.name,category:entry.category,
    bytes:entry.bytes,savedAt:entry.savedAt,status:'complete'};
};

export function createExpoBrowserDownloadStorage(){
  return {
    async list(){
      if (!root().exists) return [];
      const result=[];
      for (const entry of root().list()){
        if (!(entry instanceof File) || !entry.name.endsWith('.json')) continue;
        const id=entry.name.slice(0,-5);
        if (!validId(id) || !file(id).exists) continue;
        try{
          const record=clean(await entry.json());
          if (record && record.id===id && file(id).size===record.bytes) result.push(record);
        }catch{ /* corrupted metadata must not be shown as downloaded */ }
      }
      return result.sort((a,b)=>b.savedAt-a.savedAt);
    },

    async download(request){
      if (!request || typeof request.url!=='string' ||
          typeof request.name!=='string' || request.maxBytes!==BROWSER_DOWNLOAD_MAX_BYTES) {
        throw Error('invalid-download-request');
      }
      const id=Crypto.randomUUID().toLowerCase();
      if (!validId(id)) throw Error('download-id-unavailable');
      root().create({idempotent:true,intermediates:true});
      const candidate=partial(id), stored=file(id), receipt=info(id);
      try{
        // A fresh .partial is only committed after a successful transfer.
        await File.downloadFileAsync(request.url,candidate);
        const bytes=candidate.size;
        if (!Number.isFinite(bytes) || bytes<=0 || bytes>BROWSER_DOWNLOAD_MAX_BYTES) {
          throw Error('download-size-not-allowed');
        }
        await candidate.move(stored);
        const record=clean({
          id,name:request.name,category:request.category,
          bytes,savedAt:Date.now(),status:'complete'
        });
        if (!record) throw Error('download-record-invalid');
        await receipt.write(JSON.stringify(record));
        return record;
      }catch{
        // Remove a partial transfer or incomplete commit.
        try{if(candidate.exists)candidate.delete()}catch{}
        try{if(stored.exists)stored.delete()}catch{}
        try{if(receipt.exists)receipt.delete()}catch{}
        throw Error('download-failed');
      }
    },

    async remove(id){
      if (!validId(id)) throw Error('invalid-download-id');
      if (!root().exists) return;
      if (info(id).exists) info(id).delete();
      if (file(id).exists) file(id).delete();
      if (partial(id).exists) partial(id).delete();
    },

    async getLocalFileUri(id){
      if (!validId(id) || !file(id).exists || !info(id).exists) return null;
      try{
        const record=clean(await info(id).json());
        return record && record.id===id && file(id).size===record.bytes
          ? file(id).uri : null;
      }catch{return null}
    }
  };
}
