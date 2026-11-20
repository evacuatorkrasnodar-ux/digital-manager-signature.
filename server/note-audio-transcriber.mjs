/* SEYVEO notebook · private, opt-in speech-to-text for saved audio.
 * An audio file is held in an ephemeral system temp directory while the
 * local Whisper worker runs. Nothing is uploaded or retained by this service.
 */
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE=dirname(fileURLToPath(import.meta.url));
export const MAX_NOTE_AUDIO_BYTES=10*1024*1024;
const FORMATS=new Map([
 ['audio/webm','webm'],['audio/mp4','m4a'],['audio/ogg','ogg'],
 ['audio/wav','wav'],['audio/x-wav','wav'],['audio/mpeg','mp3']
]);
export class NoteAudioError extends Error{
 constructor(code){super(code);this.code=code;}
}
export function noteAudioFormat(type){
 const base=String(type||'').split(';')[0].trim().toLowerCase();
 return FORMATS.get(base)||null;
}
export function pythonForNoteAudio(){
 // User-selectable interpreter is allowed for an already configured local
 // installation; never start a shell or download/install anything here.
 const configured=process.env.SEYVEO_ASR_PYTHON;
 if(configured)return configured;
 const folder=resolve(HERE,'.venv-seyveo-asr');
 const candidate=process.platform==='win32'?join(folder,'Scripts','python.exe'):join(folder,'bin','python');
 return existsSync(candidate)?candidate:null;
}
export async function runLocalNoteWhisper(inputFile,{timeoutMs=240000}={}){
 const python=pythonForNoteAudio();
 if(!python)throw new NoteAudioError('engine-missing');
 const model=['tiny','base','small','medium'].includes(process.env.SEYVEO_ASR_MODEL)
  ?process.env.SEYVEO_ASR_MODEL:'small';
 return new Promise((resolvePromise,rejectPromise)=>{
  let settled=false,stdout='',timedOut=false;
  const child=spawn(python,[join(HERE,'note-whisper-worker.py'),inputFile,model],{
   cwd:HERE,windowsHide:true,stdio:['ignore','pipe','ignore'],
   env:{...process.env,PYTHONIOENCODING:'utf-8'}
  });
  const timer=setTimeout(()=>{timedOut=true;child.kill();},timeoutMs);
  const finish=(error,value)=>{
   if(settled)return;settled=true;clearTimeout(timer);
   if(error)rejectPromise(error);else resolvePromise(value);
  };
  child.stdout.on('data',chunk=>{
   stdout+=chunk.toString('utf8');
   if(stdout.length>50000)child.kill();
  });
  child.on('error',()=>finish(new NoteAudioError('engine-missing')));
  child.on('close',code=>{
   if(timedOut){finish(new NoteAudioError('timeout'));return;}
   let result;
   try{result=JSON.parse(stdout.trim());}catch{
    finish(new NoteAudioError('engine-failed'));return;
   }
   if(code!==0||result.error){
    const known=['dependency-missing','model-unavailable','bad-audio','too-long','no-speech'];
    finish(new NoteAudioError(known.includes(result.error)?result.error:'engine-failed'));
    return;
   }
   if(typeof result.text!=='string'||!result.text.trim()){
    finish(new NoteAudioError('no-speech'));return;
   }
   finish(null,result.text.trim());
  });
 });
}
export async function transcribeNoteAudio(audio,type,{runner=runLocalNoteWhisper}={}){
 if(!Buffer.isBuffer(audio)||!audio.length)throw new NoteAudioError('empty-audio');
 if(audio.length>MAX_NOTE_AUDIO_BYTES)throw new NoteAudioError('too-large');
 const extension=noteAudioFormat(type);
 if(!extension)throw new NoteAudioError('unsupported-audio');
 const folder=await mkdtemp(join(tmpdir(),'seyveo-note-audio-'));
 try{
  const filename=join(folder,'recording.'+extension);
  await writeFile(filename,audio,{flag:'wx',mode:0o600});
  const text=await runner(filename);
  if(typeof text!=='string'||!text.trim())throw new NoteAudioError('no-speech');
  return {text:text.trim().slice(0,16000),engine:'local-whisper',local:true};
 }finally{
  await rm(folder,{recursive:true,force:true});
 }
}
