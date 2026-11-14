/* Owner-only intro audio: the already-approved WAV is read from the owner's
   Downloads, never packaged in the website or synthesized again. */
import {createHash} from 'node:crypto';
import {readdir,readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';

export const APPROVED_WELCOME_SHA256='84776078a50c3cda79aa977712bd593905f369d545f78c5f9b17a9ea1f004a7d';
const NAME=/^SEYVEO-Sayvi-welcome(?:\s?\(\d+\))?\.wav$/i;

export function welcomeFolders({profile=process.env.USERPROFILE||homedir(),oneDrive=process.env.OneDrive}={}){
 const paths=[join(profile,'Downloads'),join(profile,'Загрузки')];
 if(oneDrive)paths.push(join(oneDrive,'Downloads'),join(oneDrive,'Загрузки'));
 return [...new Set(paths)];
}

export async function readApprovedWelcome({folders=welcomeFolders(),sha256=APPROVED_WELCOME_SHA256}={}){
 for(const folder of folders){
  let entries;
  try{entries=await readdir(folder,{withFileTypes:true})}catch{continue}
  for(const entry of entries){
   if(!entry.isFile()||!NAME.test(entry.name))continue;
   try{
    const buffer=await readFile(join(folder,entry.name));
    if(buffer.length<44||buffer.length>500000)continue;
    if(createHash('sha256').update(buffer).digest('hex')===sha256)return buffer;
   }catch{/* A moved or inaccessible download is simply not available. */}
  }
 }
 return null;
}
