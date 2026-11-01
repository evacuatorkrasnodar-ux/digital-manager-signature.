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
import {BROWSER_DOWNLOAD_MAX_BYTES,describeBrowserDownload,safeBrowserDownloadName} from './browser-download-core.mjs';
import {BROWSER_REVIEW_READ_LIMIT,inspectBrowserDocument,makeBrowserReviewPreview} from './browser-document-review.mjs';
import {BROWSER_PDF_FILE_LIMIT,inspectBrowserPdf,extractBrowserPdfPreview} from './browser-pdf-review.mjs';

// We store opaque .blob names; native preview needs the original safe extension.
const mimeFor = name => {
  const ext=name.split('.').pop().toLowerCase();
  return ({
    pdf:'application/pdf',txt:'text/plain',csv:'text/csv',
    jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',
    mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',
    mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm',
    zip:'application/zip',
    docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  })[ext] || 'application/octet-stream';
};
const root = () => new Directory(Paths.document,'seyveo-browser-downloads');
const validId = value => typeof value==='string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const file = id => new File(root(),id+'.blob');
const partial = id => new File(root(),id+'.partial');
const info = id => new File(root(),id+'.json');
const clean = entry => {
  if (!entry || typeof entry !== 'object' || !validId(entry.id) ||
      entry.status !== 'complete' || typeof entry.name!=='string' ||
      entry.name.length>100 || safeBrowserDownloadName(entry.name)!==entry.name ||
      typeof entry.category!=='string' ||
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

    async download(request,onProgress=()=>{}){
      if (!request || typeof request.url!=='string' ||
          typeof request.name!=='string' || request.maxBytes!==BROWSER_DOWNLOAD_MAX_BYTES) {
        throw Error('invalid-download-request');
      }
      // Repeat request validation here: this adapter may be called without the UI.
      const checked=describeBrowserDownload(request.url,request.name);
      if (checked.name!==request.name || checked.category!==request.category) {
        throw Error('invalid-download-request');
      }
      const id=Crypto.randomUUID().toLowerCase();
      if (!validId(id)) throw Error('download-id-unavailable');
      root().create({idempotent:true,intermediates:true});
      const candidate=partial(id), stored=file(id), receipt=info(id);
      const abort=new AbortController();
      let tooLarge=false;
      try{
        // A fresh .partial is only committed after a successful transfer.
        await File.downloadFileAsync(request.url,candidate,{
          signal:abort.signal,
          onProgress:progress=>{
            const written=Number(progress?.bytesWritten);
            const total=Number(progress?.totalBytes);
            if (written>BROWSER_DOWNLOAD_MAX_BYTES || total>BROWSER_DOWNLOAD_MAX_BYTES) {
              tooLarge=true;abort.abort();
            }
            if (Number.isFinite(written) && written>=0) onProgress({
              bytesWritten:written,
              totalBytes:Number.isFinite(total)&&total>0?total:null
            });
          }
        });
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
        throw Error(tooLarge?'download-size-not-allowed':'download-failed');
      }
    },

    async remove(id){
      if (!validId(id)) throw Error('invalid-download-id');
      if (!root().exists) return;
      if (info(id).exists) info(id).delete();
      if (file(id).exists) file(id).delete();
      if (partial(id).exists) partial(id).delete();
    },

    async preview(id){
      if (!validId(id) || !file(id).exists || !info(id).exists) {
        throw Error('download-not-found');
      }
      const record=clean(await info(id).json());
      if (!record || record.id!==id || file(id).size!==record.bytes) {
        throw Error('download-not-found');
      }
      // Only a direct user tap should invoke the platform preview.
      const stored=file(id),mimeType=mimeFor(record.name);
      if (!await File.canPreview(stored,{mimeType})) throw Error('download-preview-unavailable');
      await File.preview(stored,{title:record.name,mimeType});
    },

    async readLocalTextPreview(id){
      // Called only after user taps "Сэйви, посмотри" and approves a local read.
      if (!validId(id) || !info(id).exists || !file(id).exists) {
        throw Error('download-not-found');
      }
      const item=clean(await info(id).json());
      const current=file(id);
      if (!item || item.id!==id || current.size!==item.bytes ||
          !inspectBrowserDocument(item).canReadText ||
          current.size>BROWSER_REVIEW_READ_LIMIT) {
        throw Error('document-preview-unavailable');
      }
      // Small, validated .txt/.csv only: no PDF parsing and no cloud requests.
      const text=await current.text();
      return makeBrowserReviewPreview(item,text);
    },

    async readLocalPdfPreview(id,extractor){
      // User must approve locally before reaching this API.
      // The native library is optional until tested on real iOS and Android.
      if (!validId(id) || !info(id).exists || !file(id).exists) {
        throw Error('download-not-found');
      }
      const record=clean(await info(id).json());
      if (!record || record.id!==id ||
          file(id).size!==record.bytes ||
          record.bytes>BROWSER_PDF_FILE_LIMIT ||
          !inspectBrowserPdf(record).canExtract) {
        throw Error('pdf-review-unavailable');
      }
      // The stored file deliberately uses an opaque .blob suffix; create a
      // short-lived .pdf copy in app cache for native PDFKit/PDFBox readers.
      const temporary=new File(Paths.cache,'seyveo-pdf-'+Crypto.randomUUID().toLowerCase()+'.pdf');
      try{
        await file(id).copy(temporary);
        return await extractBrowserPdfPreview(record,temporary.uri,extractor);
      }finally{
        try{if(temporary.exists)temporary.delete()}catch{}
      }
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
