/* Sandbox-only optional downloads. Never access SecureVault. */
import {File,Directory,Paths} from 'expo-file-system';
import {validatePackManifest} from './offlinePacks.mjs';

const base=()=>new Directory(Paths.document,'offline-packs');
const valid=id=>typeof id==='string'&&/^[a-z][a-z0-9-]{1,47}$/.test(id);
const pack=id=>new File(base(),id+'.pack');
const temp=id=>new File(base(),id+'.partial');
const record=id=>new File(base(),id+'.json');

export function createExpoPackStorage(){
 const guard=id=>{if(!valid(id))throw Error('invalid-pack-id')};
 return {
  async list(){
   if(!base().exists)return [];
   const found=[];
   for(const entry of base().list()){
    if(!(entry instanceof File)||!entry.name.endsWith('.json'))continue;
    const id=entry.name.slice(0,-5);
    if(!valid(id)||!pack(id).exists)continue;
    try{
     const m=validatePackManifest(await entry.json());
     if(m.id===id&&pack(id).size===m.bytes)found.push(m);
    }catch{}
   }
   return found;
  },
  async download(input){
   const m=validatePackManifest(input);
   base().create({idempotent:true,intermediates:true});
   if(temp(m.id).exists)temp(m.id).delete();
   await File.downloadFileAsync(m.downloadUrl,temp(m.id));
  },
  async verify(input){
   const m=validatePackManifest(input);
   const f=temp(m.id);
   if(!f.exists||f.size!==m.bytes)return false;
   return (await f.digest('SHA-256')).toLowerCase()===m.sha256;
  },
  async commit(input){
   const m=validatePackManifest(input);
   if(!await this.verify(m))throw Error('pack-integrity-failed');
   if(pack(m.id).exists)throw Error('pack-already-installed');
   temp(m.id).move(pack(m.id));
   await record(m.id).write(JSON.stringify(m));
  },
  async discard(id){guard(id);if(temp(id).exists)temp(id).delete()},
  async remove(id){
   guard(id);
   if(record(id).exists)record(id).delete();
   if(pack(id).exists)pack(id).delete();
  }
 };
}
