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

 // Eight logarithmic frequency bands from the same decoded PCM, no second decoder.
 function makeSilkSpectrum(rate){
  const N=1024,half=N/2,rev=new Uint16Array(N),win=new Float32Array(N),
    cs=new Float32Array(half),sn=new Float32Array(half),re=new Float32Array(N),im=new Float32Array(N);
  const edges=[35,90,180,360,720,1440,2880,5760,8000];
  const bins=new Int8Array(half);bins.fill(-1);
  for(let i=0;i<N;i++){
   let x=i,y=0;for(let j=0;j<10;j++){y=(y<<1)|(x&1);x>>=1}rev[i]=y;
   win[i]=.5-.5*Math.cos(2*Math.PI*i/(N-1));
  }
  for(let i=0;i<half;i++){
   cs[i]=Math.cos(-2*Math.PI*i/N);sn[i]=Math.sin(-2*Math.PI*i/N);
   const hz=i*rate/N;for(let k=0;k<8;k++)if(hz>=edges[k]&&hz<edges[k+1]){bins[i]=k;break}
  }
  const power=new Float32Array(8),counts=new Uint16Array(8);
  for(let i=0;i<half;i++)if(bins[i]>=0)counts[bins[i]]++;
  return function sampleSpectrum(left,right,center,out,offset){
   for(let i=0;i<N;i++){
    const p=center+i-half;
    const value=p>=0&&p<left.length?(right?(left[p]+right[p])*.5:left[p]):0;
    re[rev[i]]=value*win[i];im[rev[i]]=0;
   }
   for(let len=2;len<=N;len*=2){
    const step=N/len,mid=len/2;
    for(let i=0;i<N;i+=len)for(let j=0;j<mid;j++){
     const a=i+j,b=a+mid,k=j*step;
     const tr=re[b]*cs[k]-im[b]*sn[k],ti=re[b]*sn[k]+im[b]*cs[k];
     re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;
    }
   }
   power.fill(0);
   for(let i=1;i<half;i++){const k=bins[i];if(k>=0)power[k]+=re[i]*re[i]+im[i]*im[i]}
   for(let k=0;k<8;k++)out[offset+k]=Math.sqrt(power[k]/Math.max(1,counts[k]))*4/N;
  };
 }
 const silenceSpectrum=new Float32Array(8);
 const playerSpectrum=new Float32Array(8),homeSpectrum=new Float32Array(8);
 function updateSilkSpectrum(target,data,time,dt,amount){
  const spectrum=data?.silkSpectrum;
  const index=spectrum?.length?clamp(time/RHYTHM_STEP,0,spectrum.length/8-1):0;
  const a=Math.floor(index),b=spectrum?.length?Math.min(a+1,spectrum.length/8-1):0,f=index-a;
  for(let i=0;i<8;i++){
   const value=spectrum?(spectrum[a*8+i]*(1-f)+spectrum[b*8+i]*f)*amount:0;
   target[i]+=(value-target[i])*(1-Math.exp(-dt/(value>target[i]?75:240)));
  }
  return target;
 }
 async function analyse(file){
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Offline)return null;
  let context=null,buffer=null;
  try{
   context=new Offline(1,1,16000);
   buffer=await decode(context,await readBytes(file));
   if(!buffer||!Number.isFinite(buffer.duration)||buffer.duration>MAX_RHYTHM_SECONDS||!buffer.length)return null;
   const rate=buffer.sampleRate,n=Math.max(1,Math.round(rate*RHYTHM_STEP)),frames=Math.ceil(buffer.length/n);
   const raw=new Float32Array(frames*3),spectrum=new Float32Array(frames*8),sampleSpectrum=makeSilkSpectrum(rate);
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
    sampleSpectrum(left,right,Math.floor((start+end)/2),spectrum,frame*8);
    // Yield during long tracks; no synchronous multi-second UI freeze.
    if(frame%120===119)await new Promise(resolve=>setTimeout(resolve,0));
   }
   const norm=[0,0,0];
   for(let band=0;band<3;band++){
    const values=Array.from({length:frames},(_,i)=>raw[i*3+band]).sort((a,b)=>a-b);
    norm[band]=Math.max(.006,values[Math.floor((values.length-1)*.92)]||0);
   }
   for(let i=0;i<raw.length;i++)raw[i]=clamp(Math.pow(raw[i]/norm[i%3],.65),0,1);
   // A robust per-band reference keeps quiet highs visible without inventing motion.
   for(let k=0;k<8;k++){
    const values=Array.from({length:frames},(_,i)=>spectrum[i*8+k]).sort((a,b)=>a-b);
    const ref=Math.max(.002,values[Math.floor((values.length-1)*.95)]||0);
    for(let i=k;i<spectrum.length;i+=8)spectrum[i]=clamp(Math.pow(spectrum[i]/ref,.72),0,1);
   }
   raw.silkSpectrum=spectrum;
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
  analyse(file).then(data=>{rhythmCache.set(file,data)}).catch(()=>{}).finally(()=>{rhythmBusy=false;syncRhythm();syncScene()});
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

 // The Music scene consumes the SAME bounded analysis cache as the Home orb.
 // No second decoder, audio node, microphone, or change to the playback path.
 const homeScene=musicPage?.querySelector('.sv-music-scene');
 const playerStage=musicPage?.querySelector('#sayviMusicStage');
 const playerScene=playerStage?.querySelector('.sv-now-fallback');
 let scene=null,sceneBars=[];
 const visibleScenes=new Map([[homeScene,true],[playerScene,true]]);
 let sceneFrame=0,sceneLast=0,sceneFile=null,sceneWaiting=false,ringEnergy=0,sceneAudioTime=-1;
 const sceneLevels=new Float32Array(8);
 // Liquid Sound: bounded, locally rendered ribbons, no external graphics or audio path.
 const liquidCanvas=playerScene?.querySelector('#svLiquidSoundCanvas');
 const liquidLabel=playerScene?.querySelector('#svLiquidSoundLabel');
 let liquidContext=null;
 let liquidGPU=null,liquidGPUAttempted=false;
 try{liquidContext=liquidCanvas?.getContext('2d',{alpha:true})||null}catch{}
 let liquidMode=true,liquidLast=0,liquidSize=0,liquidGradient=null,liquidPhase=0,liquidClock=-1;
 let liquidQuality=1,liquidSlowFrames=0,liquidAmbientLast=0,liquidRenderCost=0;
 let liquidAutoReason="",liquidIdleMix=0,liquidIdleActive=false;
 const longAmbient=()=>Number.isFinite(audio?.duration)&&audio.duration>MAX_RHYTHM_SECONDS;
 // Adapt to actual display callbacks and render cost; never force extra GPU frames.
 const liquidCores=navigator.hardwareConcurrency||4;
 const liquidTiers=[20,30,60,90,120];
 let liquidFPS=liquidCores>=6?60:30,liquidFPSCeiling=120,liquidFastFrames=0;
 let liquidRafLast=0,liquidRefreshMs=0,liquidRefreshSamples=0;
 let liquidNext=0,liquidScheduledInterval=0;
 function observeLiquidRefresh(timestamp){
  const dt=liquidRafLast?timestamp-liquidRafLast:0;liquidRafLast=timestamp;
  if(dt>=3&&dt<=45){
   liquidRefreshMs=liquidRefreshSamples?liquidRefreshMs*.92+dt*.08:dt;
   liquidRefreshSamples=Math.min(120,liquidRefreshSamples+1);
  }
 }
 function liquidInterval(){return 1000/(musicPage?.dataset.liquidRhythm==='ambient'?Math.min(30,liquidFPS):liquidFPS)}
 function liquidFrameDue(timestamp,interval=liquidInterval()){
  return !liquidLast||!liquidNext||liquidScheduledInterval!==interval||timestamp+.5>=liquidNext;
 }
 function markLiquidFrame(timestamp,interval){
  if(!liquidNext||liquidScheduledInterval!==interval||timestamp-liquidNext>interval*2){
   liquidNext=timestamp+interval;
  }else{
   liquidNext+=interval;
   if(liquidNext<=timestamp+.5)liquidNext=timestamp+interval;
  }
  liquidScheduledInterval=interval;liquidLast=timestamp;
 }
 function resetLiquidTiming(){
  liquidLast=0;liquidNext=0;liquidScheduledInterval=0;
  liquidRafLast=0;liquidRefreshMs=0;liquidRefreshSamples=0;liquidFastFrames=0;
 }
 function adjustLiquidBudget(dt,interval){
  const overloaded=dt>Math.max(interval*1.65,interval+8)||liquidRenderCost>interval*.80;
  liquidSlowFrames=overloaded?liquidSlowFrames+1:Math.max(0,liquidSlowFrames-1);
  if(liquidSlowFrames>=12){
   if(liquidFPS>20){
    liquidFPS=liquidTiers[liquidTiers.indexOf(liquidFPS)-1];liquidFPSCeiling=liquidFPS;
   }else if(liquidQuality>.64){liquidQuality=liquidQuality>.85?.8:.64}
   else{fallBackLiquid("slow-render");return false}
   liquidSlowFrames=0;liquidFastFrames=0;
  }else{
   const next=liquidTiers[liquidTiers.indexOf(liquidFPS)+1];
   // Promote only when the browser actually supplies fast callbacks and the
   // next tier has spare render time. 60 Hz displays cannot qualify for 90/120.
   const canPromote=musicPage?.dataset.liquidRhythm==='audio'&&next&&next<=liquidFPSCeiling&&
    liquidRefreshSamples>=30&&liquidRefreshMs<=1000/next*1.09&&
    dt<=Math.max(interval*1.65,interval+liquidRefreshMs*.85)&&liquidRenderCost<1000/next*.55;
   if(canPromote){
    if(++liquidFastFrames>=90){liquidFPS=next;liquidFastFrames=0;liquidSlowFrames=0}
   }else liquidFastFrames=0;
  }
  return true;
 }
 const liquidEnergy=new Float32Array(3);
 const liquidMobile=window.matchMedia?.('(max-width: 600px)').matches||((navigator.hardwareConcurrency||8)<=4);
 function liquidVisible(){return !!liquidContext&&liquidMode&&!!audio&&!document.hidden&&location.hash==='#sayvi-music'&&musicPage?.dataset.musicView==='player'&&!musicPage.hidden&&visibleScenes.get(playerScene)!==false&&!musicPage.classList.contains('sv-karaoke-active')&&!playerStage?.classList.contains('has-artwork')}
 // Long compilations use the same low-rate internal cloth deformation as idle.
 // Do not decode a whole compilation or scale the glass canvas.
 function liquidResting(){return liquidVisible()&&!reduce?.matches&&(audio.paused||audio.ended||longAmbient())&&!audio.error}
 function releaseLiquid(){
  if(liquidGPU){try{liquidGPU.dispose?.()}catch{}liquidGPU=null}
  liquidGPUAttempted=false;resetLiquidTiming();liquidClock=-1;liquidSlowFrames=0;liquidAmbientLast=0;liquidRenderCost=0;
  if(liquidSize){liquidCanvas.width=liquidCanvas.height=1;liquidSize=0;liquidGradient=null}
  liquidEnergy.fill(0);playerSpectrum.fill(0);liquidIdleMix=0;liquidIdleActive=false;
 }
 function fallBackLiquid(reason){
  liquidAutoReason=reason;liquidMode=false;syncLiquidMode();
 }
 function paintLiquid(timestamp,bass=0,mid=0,air=0,force=false,idle=liquidResting()){
  if(!liquidVisible()||document.hidden)return;
  const interval=idle?1000/(liquidRenderCost>35?8:liquidMobile?12:15):liquidInterval();
  if(!force&&!idle&&longAmbient())return;
  if(!force&&!liquidFrameDue(timestamp,interval))return;
  const dt=liquidLast?clamp(timestamp-liquidLast,1,150):33;
  if(!force&&!idle&&liquidLast&&!adjustLiquidBudget(dt,interval))return;
  const renderStarted=performance.now();
  markLiquidFrame(timestamp,idle?interval:liquidInterval());
  const cssSize=liquidCanvas.clientWidth;
  if(!cssSize)return;
  const pixelRatio=liquidMobile?Math.min(window.devicePixelRatio||1,1.5):Math.max(1.75,Math.min(window.devicePixelRatio||1,2));
  const pixels=Math.max(160,Math.min(Math.round((liquidMobile?540:850)*liquidQuality),Math.round(cssSize*pixelRatio*liquidQuality)));
  if(liquidSize!==pixels){liquidCanvas.width=liquidCanvas.height=pixels;liquidSize=pixels;liquidGradient=null}
  const playing=!audio.paused&&!audio.ended&&!reduce?.matches&&!longAmbient();
  if(playing){
   const t=audio.currentTime;
   const elapsed=liquidClock<0?0:clamp(t-liquidClock,0,.12);
   liquidClock=t;
   liquidPhase+=elapsed*(1.10+liquidEnergy[0]*.65);
   for(let i=0;i<3;i++){const v=i===0?bass:i===1?mid:air;liquidEnergy[i]+=(v-liquidEnergy[i])*(1-Math.exp(-dt/(v>liquidEnergy[i]?110:260)))}
  }else{
   liquidClock=-1;
   if(idle){
    liquidPhase+=dt*.0035;
    for(let i=0;i<3;i++)liquidEnergy[i]*=Math.exp(-dt/330);
   }
  }
  liquidIdleMix+=((idle?1:0)-liquidIdleMix)*(1-Math.exp(-dt/450));
  const ctx=liquidContext,b=liquidEnergy[0],m=liquidEnergy[1],h=liquidEnergy[2],p=liquidPhase;
  ctx.setTransform(pixels/400,0,0,pixels/400,0,0);
  ctx.clearRect(0,0,400,400);
  ctx.lineJoin='round';ctx.lineCap='round';
  if(!liquidGradient){
   liquidGradient=ctx.createRadialGradient(200,192,18,200,200,198);
   liquidGradient.addColorStop(0,'rgba(0,13,19,.83)');
   liquidGradient.addColorStop(.52,'rgba(1,14,20,.78)');
   liquidGradient.addColorStop(.76,'rgba(2,18,24,.42)');
   liquidGradient.addColorStop(.89,'rgba(3,22,28,.12)');
   liquidGradient.addColorStop(1,'rgba(3,22,29,0)');
  }
  ctx.globalAlpha=1;ctx.fillStyle=liquidGradient;ctx.fillRect(0,0,400,400);
  // WebGL only. Unsupported/lost contexts use the original lightweight SVG.
  if(!liquidGPUAttempted){
   liquidGPUAttempted=true;
   try{liquidGPU=window.SEYVEO_LIQUID_GL?.create(liquidMobile)||null}catch{liquidGPU=null}
  }
  if(liquidGPU){
   try{
    const spectrumData=playing&&sceneFile?rhythmCache.get(sceneFile):null;
    const spectrum=reduce?.matches?silenceSpectrum:updateSilkSpectrum(playerSpectrum,spectrumData,audio.currentTime,dt,1);
    const frame=liquidGPU.render(pixels,p,b,m,h,liquidIdleMix,false,spectrum);
    if(frame){ctx.drawImage(frame,0,0,400,400);liquidRenderCost=force?0:performance.now()-renderStarted;return}
   }catch{}
   try{liquidGPU.dispose?.()}catch{}liquidGPU=null;
  }

  fallBackLiquid("webgl-unavailable");
 }
 function syncLiquidMode(){
  const enabled=!!liquidContext&&liquidMode;
  playerScene?.classList.toggle('sv-liquid-mode',enabled);
  musicPage?.classList.toggle('sv-liquid-visualizer',enabled);
  if(musicPage){if(enabled)delete musicPage.dataset.liquidFallback;else musicPage.dataset.liquidFallback=liquidAutoReason||"canvas-unavailable"}
  if(liquidLabel)liquidLabel.textContent=enabled?'SEYVEO LIQUID SOUND':'SEYVEO SOUND';
  if(enabled)paintLiquid(performance.now(),0,0,0,true);else releaseLiquid();
 }
 window.addEventListener('resize',()=>{if(liquidVisible())paintLiquid(performance.now(),...liquidEnergy,true)});
 window.addEventListener('pagehide',releaseLiquid);
 syncLiquidMode();
 function sceneTarget(){
  if(musicPage?.dataset.musicView==='home')return homeScene;
  if(musicPage?.dataset.musicView==='player'&&!musicPage.classList.contains('sv-karaoke-active')&&!playerStage?.classList.contains('has-artwork'))return playerScene;
  return null;
 }
 function sceneAllowed(){
  return !!scene&&!!audio&&!document.hidden&&!musicPage.hidden&&
   scene===sceneTarget()&&location.hash==='#sayvi-music'&&
   visibleScenes.get(scene)!==false&&!audio.paused&&!audio.ended&&!audio.error&&!sceneWaiting&&!audio.seeking&&audio.readyState>=2;
 }
 function resetSceneWave(){
  if(sceneFrame)cancelAnimationFrame(sceneFrame);
  sceneFrame=0;sceneLast=0;sceneFile=null;sceneLevels.fill(0);ringEnergy=0;
  scene?.classList.remove('sv-scene-rhythm');
  scene?.style.removeProperty('--sv-scene-glow');
  musicPage?.style.removeProperty('--sv-now-glow');
  for(const name of ['--sv-ring-scale','--sv-ring-angle','--sv-ring-opacity'])scene?.style.removeProperty(name);
  for(const bar of sceneBars){const h=Number(bar.dataset.rest)||8;bar.setAttribute('y1',String(74-h/2));bar.setAttribute('y2',String(74+h/2))}
 }
 function tickScene(timestamp){
  sceneFrame=0;
  if(scene===playerScene&&liquidResting()){
   paintLiquid(timestamp,0,0,0,false,true);
   if(liquidResting())sceneFrame=requestAnimationFrame(tickScene);
   return;
  }
  if(!sceneAllowed()||reduce?.matches||window.SEYVEO_MUSIC?.rhythmFile?.()!==sceneFile){syncScene();return}
  const data=sceneFile?rhythmCache.get(sceneFile):null;
  const full=scene===playerScene;
  if(!data?.length&&!full){resetSceneWave();return}
  const liquidActive=full&&liquidMode&&liquidVisible();
  // Avoid sampling and DOM updates between actual Liquid Sound frames.
  if(liquidActive)observeLiquidRefresh(timestamp);
  if(liquidActive&&!liquidFrameDue(timestamp)){sceneFrame=requestAnimationFrame(tickScene);return}
  if(liquidActive||timestamp-sceneLast>=(full?(data?.length?0:50):50)){
   const dt=sceneLast?clamp(timestamp-sceneLast,1,80):16.7;
   sceneLast=timestamp;
   let bass=0,mid=0,air=0;
   if(data?.length){
    const position=clamp(audio.currentTime/RHYTHM_STEP,0,data.length/3-1);
    const frame=Math.floor(position)*3;
    const following=Math.min(frame+3,data.length-3),fraction=position-Math.floor(position);
    const band=i=>full?data[frame+i]+(data[following+i]-data[frame+i])*fraction:data[frame+i];
    bass=band(0);mid=band(1);air=band(2);
   }
   // Neutral ambient motion until measured audio energy is available.
   if(full&&musicPage.dataset.liquidRhythm!==(data?.length?'audio':'ambient'))musicPage.dataset.liquidRhythm=data?.length?'audio':'ambient';
   if(liquidActive){
    paintLiquid(timestamp,bass,mid,air);
    // The classic SVG bars are hidden and the orbits are static in Liquid mode.
    // Only the subtle background glow still needs a slow update.
    if(!liquidAmbientLast||timestamp-liquidAmbientLast>=125){
     liquidAmbientLast=timestamp;
     musicPage?.style.setProperty('--sv-now-glow',(.15+.24*(bass*.55+mid*.30+air*.15)).toFixed(3));
    }
    sceneFrame=requestAnimationFrame(tickScene);return;
   }
   const targets=[air*.65+mid*.15,mid*.72+air*.16,bass*.48+mid*.42,bass*.92,mid*.67+bass*.24,air*.66+mid*.16,mid*.47+air*.36,air*.59];
   for(let i=0;i<sceneBars.length;i++){
    const target=full?clamp(.06+.94*targets[i],0,1):.12+.88*targets[i];
    const smooth=full?1-Math.exp(-dt/(target>sceneLevels[i]?95:180)):(target>sceneLevels[i]?.69:.31);
    sceneLevels[i]+=(target-sceneLevels[i])*smooth;
    const rest=Number(sceneBars[i].dataset.rest)||8;
    const height=full?Math.min(53,5+rest*.23+(17+rest*.48)*sceneLevels[i]):5+51*sceneLevels[i];
    sceneBars[i].setAttribute('y1',(74-height/2).toFixed(2));
    sceneBars[i].setAttribute('y2',(74+height/2).toFixed(2));
   }
   const energy=bass*.55+mid*.30+air*.15;
   const glow=(scene===playerScene?.15+.24*energy:.23+.52*energy).toFixed(3);
   scene.style.setProperty('--sv-scene-glow',glow);
   if(scene===playerScene)musicPage?.style.setProperty('--sv-now-glow',glow);
   // Slow breathing plus a small, smoothed bass response. No abrupt shaking.
   ringEnergy+=(bass-ringEnergy)*(full?1-Math.exp(-dt/(bass>ringEnergy?160:350)):(bass>ringEnergy?.32:.14));
   const breath=(1+Math.sin(audio.currentTime*Math.PI/4))/2;
   scene.style.setProperty('--sv-ring-scale',(full?1+.012*breath+.035*ringEnergy:1+.018*breath+.030*ringEnergy).toFixed(4));
   scene.style.setProperty('--sv-ring-angle',(.65*Math.sin(audio.currentTime*Math.PI/5)+.28*ringEnergy).toFixed(3)+'deg');
   scene.style.setProperty('--sv-ring-opacity',(full?.76+.10*breath+.12*ringEnergy:.83+.10*breath+.07*ringEnergy).toFixed(3));
  }
  sceneFrame=requestAnimationFrame(tickScene);
 }
 function syncScene(){
  if(!liquidVisible()&&(liquidGPU||liquidSize||liquidGPUAttempted))releaseLiquid();
  const target=sceneTarget();
  if(scene!==target){
   scene?.classList.remove('sv-scene-playing');resetSceneWave();
   scene=target;sceneBars=Array.from(scene?.querySelectorAll('.sv-music-scene-wave line')||[]);
  }
  const allowed=!!scene&&sceneAllowed();
  if(musicPage)musicPage.dataset.longAmbient=String(longAmbient());
  const resting=scene===playerScene&&liquidResting();
  if(resting!==liquidIdleActive){
   resetSceneWave();liquidIdleActive=resting;liquidClock=-1;resetLiquidTiming();liquidSlowFrames=0;liquidRenderCost=0;
  }
  if(scene===playerScene&&liquidMode&&!allowed&&!liquidSize)paintLiquid(performance.now(),0,0,0,true);
  if(scene===playerScene&&liquidMode&&liquidVisible()&&!liquidSize)paintLiquid(performance.now(),0,0,0,true);
  musicPage?.classList.toggle('sv-now-ambient-playing',!!playerScene&&scene===playerScene&&allowed);
  if(!scene)return;
  scene.classList.toggle('sv-scene-playing',allowed);
  if(resting){if(!sceneFrame)sceneFrame=requestAnimationFrame(tickScene);return}
  if(!allowed||reduce?.matches||(scene===playerScene&&liquidMode&&longAmbient())){resetSceneWave();return}
  const file=window.SEYVEO_MUSIC?.rhythmFile?.();
  if(!file){if(sceneFile||sceneFrame)resetSceneWave();return}
  if(sceneFile!==file){resetSceneWave();sceneFile=file}
  prepareRhythm(file);
  const measured=!!(file&&rhythmCache.get(file)?.length);
  if(!measured&&scene!==playerScene)return;
  scene.classList.toggle('sv-scene-rhythm',measured);
  if(!sceneFrame)sceneFrame=requestAnimationFrame(tickScene);
 }
 if((homeScene||playerScene)&&audio){
  for(const name of ['waiting','seeking','emptied','error'])audio.addEventListener(name,()=>{sceneWaiting=true;sceneAudioTime=-1;syncScene()});
  audio.addEventListener('timeupdate',()=>{
   const t=audio.currentTime,advancing=sceneAudioTime>=0&&t>sceneAudioTime+.015;
   sceneAudioTime=t;
   if(advancing&&!audio.paused&&!audio.ended&&!audio.seeking&&audio.readyState>=2&&(sceneWaiting||(!sceneFrame&&!longAmbient()))){sceneWaiting=false;syncScene()}
  });
  for(const name of ['playing','canplay','seeked'])audio.addEventListener(name,()=>{sceneWaiting=false;syncScene()});
  for(const name of ['pause','ended','loadedmetadata','durationchange'])audio.addEventListener(name,syncScene);
  for(const name of ['seyveo:music-view','seyveo:music-state','visibilitychange'])document.addEventListener(name,syncScene);
  for(const name of ['hashchange','seyveo:route-changed','pageshow'])window.addEventListener(name,syncScene);
  if(reduce?.addEventListener)reduce.addEventListener('change',syncScene);else reduce?.addListener?.(syncScene);
  if(typeof IntersectionObserver==='function'){
   const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)visibleScenes.set(entry.target,entry.isIntersecting);syncScene();
   },{threshold:0});
   for(const node of [homeScene,playerScene])if(node)observer.observe(node);
  }
  new MutationObserver(syncScene).observe(musicPage,{attributes:true,attributeFilter:['hidden','data-music-view']});
  if(playerStage)new MutationObserver(syncScene).observe(playerStage,{attributes:true,attributeFilter:['class']});
  if(musicPage){let wasKaraoke=musicPage.classList.contains('sv-karaoke-active');new MutationObserver(()=>{const active=musicPage.classList.contains('sv-karaoke-active');if(active!==wasKaraoke){wasKaraoke=active;syncScene()}}).observe(musicPage,{attributes:true,attributeFilter:['class']})}
 }

 function sync(){
  if(!available()){clearOwn();return;}
  if(protectedState()){clearOwn();return;}
  let kind=voice==='listening'?'listening':voice==='speaking'?'speaking':
    audio&&!audio.paused&&!audio.ended&&(!!audio.currentSrc||!!audio.getAttribute('src'))?'equalizer':oneShot?.kind||'';
  if(!kind){clearOwn();return;}
  // On the main screen the living silk replaces the legacy five music bars.
  // Keep the shared rhythm analysis running without creating the old indicator.
  if(kind==='equalizer'&&!home.hidden&&home.contains(orb)){
   clearOwn();
   if(!reduce?.matches)prepareRhythm(window.SEYVEO_MUSIC?.rhythmFile?.());
   return;
  }
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

 // Home only: place living silk over the original glass artwork, without replacing
 // its body, inner currents, rim, theme asset or interaction. No second glass layer.
 const homeMatter=document.createElement('canvas');
 homeMatter.id='svHomeMatter';
 homeMatter.width=homeMatter.height=1;
 homeMatter.hidden=true;
 homeMatter.setAttribute('aria-hidden','true');
 orb.insertBefore(homeMatter,signal);
 let homeMatterGPU=null,homeMatterTimer=0,homeMatterVisible=true,homeMatterFailed=false,homeMatterDrawn=false,homeMatterPhase=0;
 let homeMatterCtx=null;
 const homeMatterRoot=document.documentElement;
 function homeMatterAllowed(){
  return !document.hidden&&!home.hidden&&musicPage?.hidden!==false&&location.hash!=='#sayvi-music'&&home.contains(orb)&&homeMatterVisible&&homeMatterRoot.dataset.theme==='light'
   &&!homeMatterRoot.classList.contains('seyveo-conversation')
   &&!homeMatterRoot.classList.contains('sv-home-launch-pending')
   &&!homeMatterRoot.classList.contains('sv-home-launch-logo-visible')
   &&!homeMatterRoot.classList.contains('sv-sayvi-handoff-inflight')
   &&!protectedState()&&!voice&&!oneShot;
 }
 function releaseHomeMatter(){
  if(homeMatterTimer)clearTimeout(homeMatterTimer);
  homeMatterTimer=0;homeMatter.hidden=true;homeMatterDrawn=false;homeSpectrum.fill(0);
  if(homeMatterGPU){try{homeMatterGPU.dispose()}catch{}homeMatterGPU=null}
  if(homeMatter.width!==1)homeMatter.width=homeMatter.height=1;
 }
 function paintHomeMatter(){
  homeMatterTimer=0;
  if(!homeMatterAllowed()){releaseHomeMatter();return}
  if(homeMatterFailed)return;
  // Do not create a second active WebGL context when moving out of the player.
  if(liquidGPU)releaseLiquid();
  if(!homeMatterGPU){
   try{
    homeMatterCtx=homeMatterCtx||homeMatter.getContext('2d',{alpha:true});
    homeMatterGPU=homeMatterCtx&&window.SEYVEO_LIQUID_GL?.create(true);
   }catch{}
   if(!homeMatterGPU){homeMatterFailed=true;releaseHomeMatter();return}
  }
  const size=Math.max(128,Math.min(240,Math.round(orb.clientWidth*.76*Math.min(1.25,window.devicePixelRatio||1))));
  let b=0,m=0,h=0;
  const playing=audio&&!audio.paused&&!audio.ended;
  if(playing){
   const file=window.SEYVEO_MUSIC?.rhythmFile?.(),data=file&&rhythmCache.get(file);
   if(data?.length){const i=clamp(Math.floor(audio.currentTime/RHYTHM_STEP),0,data.length/3-1)*3;b=data[i]*.32;m=data[i+1]*.32;h=data[i+2]*.32}
  }
  if(!reduce?.matches)homeMatterPhase=(homeMatterPhase+.11) % 600;
  try{
   const file=playing?window.SEYVEO_MUSIC?.rhythmFile?.():null;
   const spectrum=reduce?.matches?silenceSpectrum:updateSilkSpectrum(homeSpectrum,file&&rhythmCache.get(file),audio?.currentTime||0,100,.62);
   const frame=homeMatterGPU.render(size,homeMatterPhase,b,m,h,1,true,spectrum);
   if(!frame)throw Error('Home silk unavailable');
   if(homeMatter.width!==size)homeMatter.width=homeMatter.height=size;
   homeMatterCtx.clearRect(0,0,size,size);
   homeMatterCtx.drawImage(frame,0,0,size,size);
   homeMatter.hidden=false;homeMatterDrawn=true;
  }catch{homeMatterFailed=true;releaseHomeMatter();return}
  if(!reduce?.matches)homeMatterTimer=setTimeout(paintHomeMatter,100);
 }
 function syncHomeMatter(){
  if(!homeMatterAllowed()){releaseHomeMatter();homeMatterFailed=false;return}
  if(!homeMatterTimer&&!homeMatterFailed&&(!homeMatterDrawn||!reduce?.matches))paintHomeMatter();
  if(reduce?.matches&&homeMatterTimer){clearTimeout(homeMatterTimer);homeMatterTimer=0}
 }
 if(typeof IntersectionObserver==='function'){
  new IntersectionObserver(entries=>{homeMatterVisible=entries[0]?.isIntersecting===true;syncHomeMatter()},{threshold:.1}).observe(orb);
 }
 const homeMatterObserver=new MutationObserver(syncHomeMatter);
 homeMatterObserver.observe(home,{attributes:true,attributeFilter:['hidden']});
 homeMatterObserver.observe(homeMatterRoot,{attributes:true,attributeFilter:['class','data-theme']});
 homeMatterObserver.observe(signal,{attributes:true,attributeFilter:['class']});
 for(const name of ['seyveo:assistant-presence','seyveo:music-state','visibilitychange'])document.addEventListener(name,syncHomeMatter);
 for(const name of ['hashchange','seyveo:route-changed','pageshow'])window.addEventListener(name,syncHomeMatter);
 window.addEventListener('pagehide',releaseHomeMatter);
 if(reduce?.addEventListener)reduce.addEventListener('change',syncHomeMatter);else reduce?.addListener?.(syncHomeMatter);
 sync();syncScene();syncHomeMatter();
})();