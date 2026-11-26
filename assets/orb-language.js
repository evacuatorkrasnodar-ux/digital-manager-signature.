/* SEYVEO Living Orb Language · one shared semantic layer, not a second orb.
   Priority: the approved launch logo > genuine voice activity > actual media > real events.
   No generated fake notifications, microphone recording or external access.
   Optional rhythm is calculated locally from the selected music file. */
(()=>{
 'use strict';
 const orb=document.getElementById('orb');
 const signal=document.getElementById('signal');
 const home=document.getElementById('homePage');
 const musicPage=document.getElementById('sayviMusicPage');
 const audio=document.getElementById('sayviMusicAudio');
 if(!orb||!signal||!home)return;
 const path={
   mail:'<rect x="23" y="30" width="54" height="40" rx="5"/><path d="m25 34 23.5 19q1.5 1.3 3 0L75 34"/>',
   calendar:'<rect x="26" y="25" width="48" height="51" rx="5"/><path d="M26 41h48M39 21v9M61 21v9M38 53h9m8 0h7M38 64h9"/>',
   task:'<path d="M30 37h12m-12 13h11m-11 13h11M55 51l7 7 12-15"/><path d="M31 25h35a6 6 0 0 1 6 6v11M31 25a5 5 0 0 0-5 5v39a5 5 0 0 0 5 5h35"/>',
   check:'<path d="m29 51 14 14 29-31"/>',
   video:'<rect x="22" y="30" width="56" height="40" rx="8"/><path d="m46 41 15 9-15 9Z"/>',
   chat:'<path d="M24 32a8 8 0 0 1 8-8h36a8 8 0 0 1 8 8v25a8 8 0 0 1-8 8H46L33 75V65h-1a8 8 0 0 1-8-8Z"/><path d="M35 39h30m-30 10h23"/>',
   note:'<path d="M34 22h26l9 9v45H34a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6Z"/><path d="M60 22v10h9M38 45h21m-21 11h21m-21 11h15"/>',
   phone:'<path d="M35 25c-6 5-8 15 6 34s26 22 32 14l-12-13-8 5q-12-6-18-19l6-8Z"/>',
   attention:'<path d="M50 25v31"/><circle cx="50" cy="68" r="1.5"/>'
 };
 const types=new Set(Object.keys(path));
 const alias={budget:'task',legal:'note',message:'chat',reminder:'task',appointment:'calendar',youtube:'video'};
 let voice='',oneShot=null,onceTimer=0,voiceTimer=0;
 const classNames=['svl-live','svl-equalizer','svl-listening','svl-speaking','svl-symbol'];
 function clearOwn(){
  stopRhythm();
  signal.classList.remove(...classNames);
  delete signal.dataset.svlKind;
  signal.querySelector(':scope > .svl-depth')?.remove();
 }
 function available(){
  // The ONE sphere travels to Music. Do not turn off its visual language
  // just because the Home DOM is hidden while the same sphere is reparented.
  return !document.hidden&&(!home.hidden||musicPage?.hidden===false)
   &&!document.documentElement.classList.contains('seyveo-conversation');
 }
 function protectedState(){
  return signal.classList.contains('is-pearl')||signal.classList.contains('is-brand')||
    signal.classList.contains('signal--notice')||signal.classList.contains('is-living');
 }
 function svg(type){
  return '<svg class="svl-outline" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+path[type]+'</g></svg>';
 }
 const bars='<span class="svl-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
 // Decode a bounded local file independently of the actual audio element.
 // Never connect a MediaElementSource: iOS output, volume, background audio,
 // AirPlay and the original playback path must remain unaffected.
 const RHYTHM_STEP=.05,MAX_RHYTHM_BYTES=18*1024*1024,MAX_RHYTHM_SECONDS=420;
 const rhythmCache=new WeakMap();
 const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let rhythmFrame=0,rhythmBars=null,rhythmFile=null,rhythmBusy=false,rhythmLast=0;
 const levels=new Float32Array(5);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function readBytes(file){
  if(typeof file.arrayBuffer==='function')return file.arrayBuffer();
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsArrayBuffer(file)});
 }
 function decode(context,bytes){
  return new Promise((resolve,reject)=>{
   try{const task=context.decodeAudioData(bytes,resolve,reject);if(task?.then)task.then(resolve,reject)}catch(error){reject(error)}
  });
 }
 // Analyse low, mid and high energy in 50 ms windows. Use transient
 // increases in bass as the main pulse, with gentle dynamic compression.
 async function analyse(file){
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)return null;
  let context=null,buffer=null;
  try{
   context=new Offline(1,1,16000);
   buffer=await decode(context,await readBytes(file));
   if(!buffer||!Number.isFinite(buffer.duration)||buffer.duration>MAX_RHYTHM_SECONDS||!buffer.length)return null;
   const rate=buffer.sampleRate,n=Math.max(1,Math.round(rate*RHYTHM_STEP)),frames=Math.ceil(buffer.length/n);
   const raw=new Float32Array(frames*3);
   const left=buffer.getChannelData(0),right=buffer.numberOfChannels>1?buffer.getChannelData(1):null;
   const a=1-Math.exp(-2*Math.PI*180/rate),b=1-Math.exp(-2*Math.PI*1800/rate);
   let low=0,mid=0,previousBass=0;
   for(let frame=0;frame<frames;frame++){
    let bass=0,body=0,air=0;
    const start=frame*n,end=Math.min(left.length,start+n);
    for(let i=start;i<end;i++){
     // Average channels without changing the source or output.
     const sample=right?(left[i]+right[i])*.5:left[i];
     low+=a*(sample-low);mid+=b*(sample-mid);
     const m=mid-low,h=sample-mid;
     bass+=low*low;body+=m*m;air+=h*h;
    }
    const count=Math.max(1,end-start);
    const rms=Math.sqrt(bass/count);
    const onset=Math.max(0,rms-previousBass);
    previousBass=previousBass*.72+rms*.28;
    raw[frame*3]=rms+onset*.9;
    raw[frame*3+1]=Math.sqrt(body/count);
    raw[frame*3+2]=Math.sqrt(air/count);
    // Yield during long tracks; no synchronous multi-second UI freeze.
    if(frame%120===119)await new Promise(resolve=>setTimeout(resolve,0));
   }
   const norm=[0,0,0];
   for(let band=0;band<3;band++){
    const values=Array.from({length:frames},(_,i)=>raw[i*3+band]).sort((a,b)=>a-b);
    norm[band]=Math.max(.006,values[Math.floor((values.length-1)*.92)]||0);
   }
   for(let i=0;i<raw.length;i++)raw[i]=clamp(Math.pow(raw[i]/norm[i%3],.65),0,1);
   return raw;
  }catch{return null}
  finally{buffer=null;context=null}
 }
 function stopRhythm(){
  if(rhythmFrame)cancelAnimationFrame(rhythmFrame);rhythmFrame=0;
  signal.classList.remove('svl-rhythm');
  if(rhythmBars)for(const bar of rhythmBars)bar.style.removeProperty('--svl-rhythm-scale');
  rhythmBars=null;rhythmFile=null;rhythmLast=0;levels.fill(0);
 }
 function rhythmAllowed(){
  return !reduce?.matches&&!document.hidden&&!home.hidden&&orb.closest('#homePage')&&signal.dataset.svlKind==='equalizer'&&!audio.paused&&!audio.ended;
 }
 function prepareRhythm(file){
  if(!file||rhythmCache.has(file)||rhythmBusy)return;
  // Metadata is needed to reject huge uncompressed/long audio before decode.
  if(!Number.isFinite(audio.duration)||audio.duration<=0)return;
  if(file.size>MAX_RHYTHM_BYTES||audio.duration>MAX_RHYTHM_SECONDS){rhythmCache.set(file,null);return}
  rhythmBusy=true;rhythmCache.set(file,null);
  analyse(file).then(data=>{rhythmCache.set(file,data)}).catch(()=>{}).finally(()=>{rhythmBusy=false;syncRhythm()});
 }
 function tickRhythm(timestamp){
  rhythmFrame=0;
  if(!rhythmAllowed()||window.SEYVEO_MUSIC?.rhythmFile?.()!==rhythmFile){stopRhythm();return}
  const data=rhythmCache.get(rhythmFile);
  if(!data||!rhythmBars?.length){stopRhythm();return}
  if(timestamp-rhythmLast>=45){
   rhythmLast=timestamp;
   const frame=clamp(Math.floor(audio.currentTime/RHYTHM_STEP),0,data.length/3-1)*3;
   const bass=data[frame],mid=data[frame+1],air=data[frame+2];
   const targets=[air*.56+mid*.15,mid*.79+bass*.14,bass*.93,mid*.73+air*.12,air*.51+bass*.12];
   for(let i=0;i<5;i++){
    const target=.10+targets[i]*.90;
    const smoothing=target>levels[i]?.72:.32;
    levels[i]+=(target-levels[i])*smoothing;
    rhythmBars[i].style.setProperty('--svl-rhythm-scale',levels[i].toFixed(3));
   }
  }
  rhythmFrame=requestAnimationFrame(tickRhythm);
 }
 function syncRhythm(){
  if(!audio||!rhythmAllowed()){stopRhythm();return}
  const file=window.SEYVEO_MUSIC?.rhythmFile?.();
  if(!file){stopRhythm();return}
  if(rhythmFile!==file){stopRhythm();rhythmFile=file}
  prepareRhythm(file);
  const data=rhythmCache.get(file);
  if(!data)return;
  const nodes=signal.querySelectorAll('.svl-bars i');
  if(nodes.length!==5){stopRhythm();return}
  rhythmBars=nodes;
  signal.classList.add('svl-rhythm');
  if(!rhythmFrame)rhythmFrame=requestAnimationFrame(tickRhythm);
 }

 function sync(){
  if(!available()){clearOwn();return;}
  if(protectedState()){clearOwn();return;}
  let kind=voice==='listening'?'listening':voice==='speaking'?'speaking':
    audio&&!audio.paused&&!audio.ended&&(!!audio.currentSrc||!!audio.getAttribute('src'))?'equalizer':oneShot?.kind||'';
  if(!kind){clearOwn();return;}
  let content=signal.querySelector(':scope > .svl-depth');
  if(content&&signal.dataset.svlKind===kind){syncRhythm();return}
  clearOwn();
  signal.dataset.svlKind=kind;
  content=document.createElement('span');
  content.className='svl-depth';
  content.innerHTML=['equalizer','listening','speaking'].includes(kind)?bars:svg(kind);
  signal.append(content);
  signal.classList.add('svl-live',kind==='equalizer'?'svl-equalizer':kind==='listening'?'svl-listening':kind==='speaking'?'svl-speaking':'svl-symbol');
  syncRhythm();
 }
 function show(type,duration=4200){
  type=alias[type]||type;
  if(!types.has(type))return false;
  oneShot={kind:type};
  clearTimeout(onceTimer);
  onceTimer=setTimeout(()=>{oneShot=null;sync();},Math.min(9000,Math.max(1200,Number(duration)||4200)));
  sync();return true;
 }
 document.addEventListener('seyveo:assistant-presence',event=>{
  const p=event.detail?.phase;
  if(p==='listening'||p==='speaking'){
   voice=p;
   clearTimeout(voiceTimer);
   voiceTimer=setTimeout(()=>{voice='';sync();},71000);
  }else if(p==='stop'||p==='end'||p==='listening-end'){
   voice='';clearTimeout(voiceTimer);
  }else if(p==='ack'||p==='text'){
   // The existing approved glass response remains; don't stack a fake notification.
   voice='';clearTimeout(voiceTimer);
  }
  sync();
 });
 for(const name of ['play','playing','pause','ended','emptied','error','loadedmetadata','durationchange','seeked'])audio?.addEventListener(name,sync);
 document.addEventListener('seyveo:music-state',sync);
 document.addEventListener('seyveo:orb-channel-reset',sync);
 window.addEventListener('seyveo:future-committed',event=>{
  if(event.detail?.area==='tasks')show('task');
  else if(event.detail?.area==='calendar')show('calendar');
 });
 window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
 window.addEventListener('seyveo:route-changed',()=>requestAnimationFrame(sync));
 if(reduce?.addEventListener)reduce.addEventListener('change',sync);else reduce?.addListener?.(sync);
 new MutationObserver(sync).observe(home,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('pageshow',sync);
 window.SEYVEO_ORB_LANGUAGE=Object.freeze({show,sync,state:()=>({
  voice:voice||'idle',musicPlaying:!!audio&&!audio.paused&&!audio.ended,signal:signal.dataset.svlKind||'idle'
 })});
 sync();
})();