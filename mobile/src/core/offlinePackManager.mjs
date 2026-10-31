/* Optional offline-pack manager. The storage adapter is restricted to the
 * app-owned offline-pack sandbox; it MUST NOT accept arbitrary paths.
 * The caller supplies verified catalog entries and platform storage functions.
 */
import {validatePackManifest,planPackInstall,planPackRemoval} from './offlinePacks.mjs';

export function createOfflinePackManager({storage,platform,getFreeBytes,activeIds=()=>[]}={}){
 if(!storage||!['download','verify','commit','remove','list'].every(k=>typeof storage[k]==='function'))
  throw Error('pack-storage-required');
 if(!['ios','android'].includes(platform)||typeof getFreeBytes!=='function'||typeof activeIds!=='function')
  throw Error('invalid-pack-manager-config');
 let busy=false;
 async function locked(fn){
  if(busy)throw Error('pack-operation-in-progress');
  busy=true;
  try{return await fn()}finally{busy=false}
 }
 return Object.freeze({
  async list(){return storage.list()},
  async install(manifest){
   return locked(async()=>{
    const p=validatePackManifest(manifest);
    const installed=await storage.list();
    const ids=installed.map(x=>x.id);
    if(ids.includes(p.id))return {status:'already-installed',id:p.id};
    const plan=planPackInstall([p],{platform,freeBytes:await getFreeBytes(),installedIds:ids});
    if(!plan.canInstall)throw Error('pack-install-not-allowed');
    let attempted=false;
    try{
     attempted=true;
     await storage.download(p);
     if(await storage.verify(p)!==true)throw Error('pack-integrity-failed');
     await storage.commit(p);
     return {status:'installed',id:p.id};
    }catch(e){
     if(attempted&&typeof storage.discard==='function'){
      try{await storage.discard(p.id)}catch{}
     }
     throw e;
    }
   });
  },
  async remove(id){
   return locked(async()=>{
    const installed=await storage.list();
    const plan=planPackRemoval(id,{installedIds:installed.map(x=>x.id),activeIds:await activeIds()});
    if(!plan.canRemove)return {status:plan.reason,id};
    await storage.remove(id);
    return {status:'removed',id};
   });
  }
 });
}
