import {validatePackManifest} from './offlinePacks.mjs';
export function validateOfflineCatalog(entries,approvedHosts){
 if(!Array.isArray(entries)||entries.length>100||!Array.isArray(approvedHosts))throw Error('invalid-catalog');
 const ids=new Set();
 return entries.map(entry=>{
  const pack=validatePackManifest(entry);
  if(!approvedHosts.includes(new URL(pack.downloadUrl).hostname))throw Error('unapproved-host');
  if(ids.has(pack.id))throw Error('duplicate-id');
  ids.add(pack.id);
  return pack;
 });
}
