/* SEYVEO Offline Packs v1: pure, fail-closed install planning.
 * Catalog is metadata only; no packs/models/voice assets are bundled.
 * A download manager must verify each file's SHA-256 before marking ready.
 */
const ID=/^[a-z][a-z0-9-]{1,47}$/;
const HASH=/^[a-f0-9]{64}$/;
const BYTES_LIMIT=8*1024*1024*1024;
export function validatePackManifest(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||!ID.test(p.id)||
   !['knowledge','maps','language-model','speech-to-text','voice'].includes(p.kind)||
   typeof p.title!=='string'||!p.title.trim()||p.title.length>80||
   !Number.isSafeInteger(p.bytes)||p.bytes<=0||p.bytes>BYTES_LIMIT||
   !HASH.test(p.sha256)||!Number.isInteger(p.version)||p.version<1||
   !['ios','android','both'].includes(p.platform)||
   typeof p.downloadUrl!=='string'||!/^https:\/\//.test(p.downloadUrl))
  throw Error('invalid-pack-manifest');
 const u=new URL(p.downloadUrl);
 if(u.username||u.password||u.hash||!u.hostname||u.port||u.hostname==='localhost'||
   /^(?:127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname))
  throw Error('invalid-pack-source');
 return Object.freeze({id:p.id,kind:p.kind,title:p.title.trim(),bytes:p.bytes,
   sha256:p.sha256,version:p.version,platform:p.platform,downloadUrl:p.downloadUrl});
}
export function planPackInstall(manifests,{platform,freeBytes,installedIds=[]}={}){
 if(!['ios','android'].includes(platform)||!Number.isSafeInteger(freeBytes)||freeBytes<0||
   !Array.isArray(manifests)||!Array.isArray(installedIds))throw Error('invalid-install-request');
 const seen=new Set(),ready=new Set(installedIds);
 const selected=manifests.map(validatePackManifest).filter(p=>{
  if(seen.has(p.id))throw Error('duplicate-pack-id');
  seen.add(p.id);
  return !ready.has(p.id);
 });
 const incompatible=selected.filter(p=>p.platform!=='both'&&p.platform!==platform).map(p=>p.id);
 const bytes=selected.reduce((sum,p)=>sum+p.bytes,0);
 const reserve=Math.max(100*1024*1024,Math.ceil(bytes*.15));
 return Object.freeze({bytes,reserve,requiredBytes:bytes+reserve,freeBytes,
  incompatible,canInstall:incompatible.length===0&&bytes+reserve<=freeBytes,
  packIds:selected.map(p=>p.id)});
}
export async function verifyPackBytes(contents,expected){
 const p=validatePackManifest(expected);
 if(!(contents instanceof Uint8Array)||contents.byteLength!==p.bytes)return false;
 const digest=await crypto.subtle.digest('SHA-256',contents);
 const hex=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return hex===p.sha256;
}
