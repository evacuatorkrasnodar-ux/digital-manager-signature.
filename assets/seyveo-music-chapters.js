/* SEYVEO local virtual chapters. No audio files are modified or duplicated. */
(()=>{
'use strict';
const max=150, key='seyveo.music.chapters.v1';
const num=(a,p)=>new DataView(a.buffer,a.byteOffset,a.byteLength).getUint32(p);
const syn=(a,p)=>((a[p]&127)<<21)|((a[p+1]&127)<<14)|((a[p+2]&127)<<7)|(a[p+3]&127);
const str=(a,p,n)=>String.fromCharCode(...a.subarray(p,p+n));
function normalize(rows,duration){
 const result=rows.filter(x=>Number.isFinite(x.start)&&x.start>=0&&x.start<duration-1).sort((a,b)=>a.start-b.start).filter((x,i,arr)=>!i||x.start-arr[i-1].start>=1).slice(0,max).map(x=>({start:Math.round(x.start*1000)/1000,title:String(x.title||'').trim().slice(0,200)}));
 if(!result.length)return [];
 if(result[0].start>1)result.unshift({start:0,title:''});else result[0].start=0;
 return result.slice(0,max);
}
function parse(text,duration){
 const rows=[];
 for(const raw of String(text).split(/\r?\n/)){
  if(!raw.trim())continue;
  const m=raw.match(/^\s*\[?(\d{1,3}:\d{2}(?::\d{2})?)\]?\s*[-–—]?\s*(.*)$/);
  if(!m)return null;
  const parts=m[1].split(':').map(Number);
  if(parts.slice(1).some(x=>x>=60))return null;
  const start=parts.reduce((n,x)=>n*60+x,0);
  if(start>=duration||rows.length>=max||rows.length&&start<=rows[rows.length-1].start)return null;
  rows.push({start,title:m[2]});
 }
 const result=normalize(rows,duration);return result.length>1?result:null;
}
function read(id,duration){try{const item=JSON.parse(localStorage.getItem(key)||'{}')[id];if(!item)return null;const rows=normalize(item.rows||[],duration);return rows.length>1?{rows,source:item.source}:null}catch{return null}}
function save(id,rows,source){try{const all=JSON.parse(localStorage.getItem(key)||'{}');delete all[id];all[id]={rows,source};for(const k of Object.keys(all).slice(0,-40))delete all[k];localStorage.setItem(key,JSON.stringify(all));return true}catch{return false}}
function clear(id){try{const all=JSON.parse(localStorage.getItem(key)||'{}');delete all[id];localStorage.setItem(key,JSON.stringify(all))}catch{}}
function decodeText(a){if(a.length<2)return '';try{let enc=a[0],bytes=a.subarray(1),label=enc===3?'utf-8':enc===2?'utf-16be':enc===1?'utf-16':'windows-1252';if(enc===1&&bytes[0]===254&&bytes[1]===255)label='utf-16be';return new TextDecoder(label).decode(bytes).replace(/\0/g,'').trim()}catch{return ''}}
async function embedded(file,duration){
 if(!/\.mp3$/i.test(file.name))return [];
 const header=new Uint8Array(await file.slice(0,10).arrayBuffer());
 if(header.length<10||str(header,0,3)!=='ID3'||![3,4].includes(header[3])||(header[5]&0xc0))return [];
 const size=syn(header,6);if(size<10||size>4*1024*1024||size+10>file.size)return [];
 const a=new Uint8Array(await file.slice(10,10+size).arrayBuffer()),rows=[],v=header[3];
 for(let p=0;p+10<=a.length;){
  const id=str(a,p,4),n=v===4?syn(a,p+4):num(a,p+4),flags=a[p+9];p+=10;
  if(!/^[A-Z0-9]{4}$/.test(id)||!n||p+n>a.length)break;
  if(id==='CHAP'&&!flags){
   const f=a.subarray(p,p+n),z=f.indexOf(0);
   if(z>=0&&z+17<=f.length){
    const start=num(f,z+1)/1000;let title='';
    for(let q=z+17;q+10<=f.length;){const fid=str(f,q,4),length=v===4?syn(f,q+4):num(f,q+4);q+=10;if(!length||q+length>f.length)break;if(fid==='TIT2'){title=decodeText(f.subarray(q,q+length));break}q+=length}
    rows.push({start,title});
   }
  }p+=n;
 }
 return normalize(rows,duration);
}
// Scan MP3 frame headers incrementally, then decode only ~24-second blocks.
// No full-length PCM allocation, no analysis audio output.
function frame(a,p){
 if(p+4>a.length||a[p]!==255||(a[p+1]&224)!==224)return null;
 const v=(a[p+1]>>3)&3,layer=(a[p+1]>>1)&3,b=(a[p+2]>>4)&15,s=(a[p+2]>>2)&3;
 if(v===1||layer!==1||!b||b===15||s===3)return null;
 const rate=[44100,48000,32000][s]/(v===3?1:v===2?2:4);
 const kb=(v===3?[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]:[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160])[b];
 const len=Math.floor((v===3?144000:72000)*kb/rate)+((a[p+2]>>1)&1);
 return len>=24?{len,sec:(v===3?1152:576)/rate,rate}:null;
}
// Serialize long-recording decodes; never allocate a whole compilation.
let decodeTail=Promise.resolve();
function decodeWindow(bytes,valid){
 const job=decodeTail.then(async()=>{
  if(!valid())throw Error('cancel');
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)throw Error('offline-unavailable');
  const ctx=new Offline(1,1,16000);
  return new Promise((resolve,reject)=>{try{const fail=()=>reject(Error('decode-block'));const p=ctx.decodeAudioData(bytes,resolve,fail);if(p?.then)p.then(resolve,fail)}catch{reject(Error('decode-block'))}});
 });
 decodeTail=job.then(()=>{},()=>{});return job;
}
async function sampleLoudness(file,duration,valid){
 if(!/\.mp3$/i.test(file.name)||!Number.isFinite(duration)||duration<=0||file.size>180*1024*1024)return null;
 const header=new Uint8Array(await file.slice(0,10).arrayBuffer());
 const start=header.length>=10&&str(header,0,3)==='ID3'?10+syn(header,6)+(header[3]===4&&header[5]&16?10:0):0;
 if(start>=file.size)return null;
 const powers=[];
 for(const fraction of [.10,.30,.50,.70,.90]){
  if(!valid())return null;
  const from=Math.floor(start+(file.size-start)*fraction);
  // 512 KiB is enough for eight seconds even at 320 kbps.
  const a=new Uint8Array(await file.slice(from,Math.min(file.size,from+512*1024)).arrayBuffer());
  let begin=-1,end=0,seconds=0,rate=0;
  for(let p=0;p+4<a.length&&p<65536;p++){
   const first=frame(a,p);if(!first)continue;
   const second=frame(a,p+first.len),third=second&&frame(a,p+first.len+second.len);
   if(!second||!third||first.rate!==second.rate||first.rate!==third.rate)continue;
   begin=p;end=p;rate=first.rate;break;
  }
  if(begin<0)continue;
  while(end+4<a.length&&seconds<8){
   const f=frame(a,end);if(!f||f.rate!==rate||end+f.len>a.length)break;
   seconds+=f.sec;end+=f.len;
  }
  if(seconds<4)continue;
  try{
   const pcm=await decodeWindow(a.slice(begin,end).buffer,valid);
   if(!valid())return null;
   if(!pcm||pcm.duration<3||pcm.duration>12||!pcm.sampleRate)continue;
   let sum=0,count=0;
   for(let c=0;c<Math.min(2,pcm.numberOfChannels);c++){
    const data=pcm.getChannelData(c),edge=Math.round(pcm.sampleRate*.5);
    for(let i=edge;i<data.length-edge;i+=4){const x=data[i];if(Number.isFinite(x)){sum+=x*x;count++}}
   }
   if(count&&sum>0)powers.push(sum/count);
  }catch{if(!valid())return null}
  await new Promise(resolve=>setTimeout(resolve,220));
 }
 if(powers.length<3)return null;
 return 10*Math.log10(powers.reduce((a,b)=>a+b,0)/powers.length);
}
async function scan(file,duration,valid,progress,canWork=()=>true){
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 if(!Offline)throw Error('offline-unavailable');
 if(!/\.mp3$/i.test(file.name))throw Error('format');
 if(duration<600||file.size>180*1024*1024)throw Error('limit');
 const header=new Uint8Array(await file.slice(0,10).arrayBuffer());
 let pos=0;if(header.length>=10&&str(header,0,3)==='ID3')pos=10+syn(header,6)+(header[5]&16?10:0);
 let cache=new Uint8Array(),base=-1,t=0,groupStart=pos,groupTime=0,rate=0,found=false;
 let quietStart=-1,loudBefore=false,lastBoundary=0,quietSeconds=0,rows=[{start:0,title:''}];
 const wait=(ms=180)=>new Promise(r=>setTimeout(r,ms));
 async function gate(){while(valid()&&!canWork())await wait(700);if(!valid())throw Error('cancel')}
 let peak=.04,quietEnd=-1;
 async function decodeBlock(end,endTime){
  if(end<=groupStart||endTime-groupTime<2)return;
  await gate();
  const bytes=await file.slice(groupStart,end).arrayBuffer();
  const buffer=await decodeWindow(bytes,valid);
  if(!valid())throw Error('cancel');
  const expected=endTime-groupTime;
  if(!buffer||Math.abs(buffer.duration-expected)>Math.max(.9,expected*.08))throw Error('decode mismatch');
  const left=buffer.getChannelData(0),right=buffer.numberOfChannels>1?buffer.getChannelData(1):null,step=Math.max(1,Math.round(buffer.sampleRate*.1));
  // Ignore decoder startup/ending samples; require quiet surrounded by real sound.
  for(let i=step*2;i+step<left.length-step*2;i+=step){
   let power=0;for(let j=i;j<i+step;j++){power+=right?(left[j]*left[j]+right[j]*right[j])*.5:left[j]*left[j]}
   const rms=Math.sqrt(power/step),time=groupTime+i/buffer.sampleRate;
   peak=Math.max(rms,peak*.999);
   const quiet=Math.max(.0025,Math.min(.012,peak*.045)),loud=Math.max(.012,peak*.14);
   if(rms<quiet){if(quietStart<0||time-quietEnd>.65){quietStart=time;quietSeconds=0}quietEnd=time;quietSeconds+=.1}
   else if(rms>loud){
    if(loudBefore&&quietSeconds>=.7&&quietSeconds<=12&&time-quietEnd<.85&&quietStart-lastBoundary>=55&&duration-time>=35){
     const boundary=Math.round((quietStart+time)/2*10)/10;
     rows.push({start:boundary,title:''});lastBoundary=boundary;
    }
    loudBefore=true;quietStart=-1;quietSeconds=0;
   }else if(quietStart>=0&&time-quietEnd>.5){quietStart=-1;quietSeconds=0}
  }
  groupStart=end;groupTime=endTime;progress?.(Math.min(99,Math.round(endTime/duration*100)),normalize(rows,duration));await wait();
 }
 while(pos+4<file.size&&valid()&&rows.length<max){
  if(base<0||(pos-base+4096>cache.length&&base+cache.length<file.size)){await gate();base=pos;cache=new Uint8Array(await file.slice(pos,Math.min(file.size,pos+1024*1024)).arrayBuffer())}
  const offset=pos-base,f=frame(cache,offset);
  if(!found){
   const next=f&&frame(cache,offset+f.len);
   if(!f||!next||next.rate!==f.rate){pos++;if(pos-groupStart>65536)throw Error('frame-header');continue}
   found=true;groupStart=pos;rate=f.rate;
  }
  if(!f||f.rate!==rate||pos+f.len>file.size)break;
  pos+=f.len;t+=f.sec;
  if(t-groupTime>=24){await decodeBlock(pos,t);if(!valid())return []}
 }
 if(!valid())return [];
 if(!found||Math.abs(t-duration)>Math.max(3,duration*.015))throw Error('frame-timing');
 await decodeBlock(pos,t);progress?.(100,normalize(rows,duration));
 return normalize(rows,duration);
}
window.SEYVEO_MUSIC_CHAPTERS=Object.freeze({normalize,parse,read,save,clear,embedded,scan,sampleLoudness});
})();
