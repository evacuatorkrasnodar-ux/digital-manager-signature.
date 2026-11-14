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

// The approved master has a low-level transient in its first 50 ms followed
// by silence until ~478 ms. Remove that pre-roll ONLY from the private playback
// copy: keep the owner's verified download untouched and preserve every word.
// The remaining 78 ms of silence is intentional, to avoid a clipped first syllable.
export function prepareWelcomeForPlayback(master){
 if(!Buffer.isBuffer(master)||master.length<44||
    master.toString('ascii',0,4)!=='RIFF'||master.toString('ascii',8,12)!=='WAVE'||
    master.toString('ascii',12,16)!=='fmt '||master.readUInt32LE(16)!==16||
    master.readUInt16LE(20)!==1||master.readUInt16LE(22)!==1||
    master.readUInt32LE(24)!==24000||master.readUInt16LE(34)!==16||
    master.toString('ascii',36,40)!=='data'||master.readUInt32LE(40)!==master.length-44){
  throw Error('Неподдерживаемый формат утверждённого WAV Сэйви.');
 }
 const trimBytes=Math.round(24000*.4)*2;
 if(master.length<=44+trimBytes+24000)throw Error('Утверждённая запись Сэйви слишком короткая.');
 const result=Buffer.allocUnsafe(master.length-trimBytes);
 master.copy(result,0,0,44);
 master.copy(result,44,44+trimBytes);
 result.writeUInt32LE(result.length-8,4);
 result.writeUInt32LE(result.length-44,40);
 // A microscopic fade is applied entirely inside the remaining silent lead-in.
 const fadeSamples=Math.round(24000*.045);
 for(let index=0;index<fadeSamples;index++){
  const offset=44+index*2;
  const sample=result.readInt16LE(offset);
  result.writeInt16LE(Math.round(sample*index/fadeSamples),offset);
 }
 return result;
}
