import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pythonForNoteAudio,noteAudioFormat} from './note-audio-transcriber.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
export const MAX_LYRIC_BYTES=25*1024*1024;
export const lyricFormat=type=>noteAudioFormat(type)||({'audio/flac':'flac','audio/x-flac':'flac','audio/aac':'aac','audio/x-m4a':'m4a','audio/opus':'opus','audio/aiff':'aiff','audio/x-aiff':'aiff'})[String(type||'').split(';')[0].toLowerCase()]||null;
export async function transcribeLyrics(bytes,type,{signal,onProgress=()=>{}}={}){
 const ext=lyricFormat(type),python=pythonForNoteAudio();
 if(!python)throw Error('engine-missing');
 if(!ext||!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>MAX_LYRIC_BYTES)throw Error('bad-audio');
 if(signal?.aborted)throw Error('cancelled');
 const folder=await mkdtemp(join(tmpdir(),'seyveo-lyrics-'));
 try{
  const path=join(folder,'song.'+ext);
  await writeFile(path,bytes,{flag:'wx',mode:0o600});
  if(signal?.aborted)throw Error('cancelled');
  return await new Promise((ok,no)=>{
   const model=['tiny','base','small','medium'].includes(process.env.SEYVEO_ASR_MODEL)?process.env.SEYVEO_ASR_MODEL:'small';
   const child=spawn(python,[join(HERE,'music-lyrics-worker.py'),path,model],{cwd:HERE,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PYTHONIOENCODING:'utf-8'}});
   let chunks=[],size=0,reason='',settled=false;
   const kill=why=>{reason=why;child.kill()};
   const cancel=()=>kill('cancelled');
   signal?.addEventListener('abort',cancel,{once:true});
   if(signal?.aborted)cancel();
   const timer=setTimeout(()=>kill('timeout'),600000);
   const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);if(error)no(error);else ok(result)};
   let progressBuffer='',lastPercent=0;
   child.stderr.setEncoding('utf8');
   child.stderr.on('data',chunk=>{
    progressBuffer+=chunk;
    if(progressBuffer.length>32768){progressBuffer='';return}
    let newline;
    while((newline=progressBuffer.indexOf('\n'))!==-1){
     const line=progressBuffer.slice(0,newline);progressBuffer=progressBuffer.slice(newline+1);
     try{
      const data=JSON.parse(line);
      if(!['checking','loading','decoding','finishing'].includes(data.phase))continue;
      let percent=null;
      if(Number.isFinite(data.percent)){lastPercent=Math.max(lastPercent,Math.min(99,Math.max(0,Math.floor(data.percent))));percent=lastPercent}
      onProgress({phase:data.phase,percent});
     }catch{}
    }
   });
   child.stdout.on('data',chunk=>{size+=chunk.length;if(size>512*1024){kill('bad-audio');return}chunks.push(chunk)});
   child.on('error',()=>finish(Error('engine-missing')));
   child.on('close',code=>{
    if(reason){finish(Error(reason));return}
    try{
     const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
     if(code||data.error){finish(Error(data.error||'bad-audio'));return}
     const lines=Array.isArray(data.lines)?data.lines.filter(l=>Number.isFinite(l?.time)&&l.time>=0&&l.time<=600&&typeof l.text==='string'&&l.text.trim()).slice(0,500).map(l=>({time:l.time,text:l.text.slice(0,500),...(Number.isFinite(l.end)&&l.end>l.time&&l.end<=600?{end:l.end}:{}),words:Array.isArray(l.words)?l.words.filter(v=>typeof v?.text==='string'&&v.text.trim()&&Number.isFinite(v.start)&&Number.isFinite(v.end)&&v.start>=0&&v.end>v.start&&v.end<=600).slice(0,160).map(v=>({text:v.text.slice(0,120),start:v.start,end:v.end})):[]})).sort((a,b)=>a.time-b.time):[];
     if(!lines.length){finish(Error('no-speech'));return}
     onProgress({phase:'complete',percent:100});
     finish(null,{timed:true,lines,draft:true});
    }catch{finish(Error('bad-audio'))}
   });
  });
 }finally{await rm(folder,{recursive:true,force:true})}
}
