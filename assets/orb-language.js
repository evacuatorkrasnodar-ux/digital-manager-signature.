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
 let sceneFrame=0,sceneLast=0,sceneFile=null,sceneWaiting=false,ringEnergy=0;
 const sceneLevels=new Float32Array(8);
 // Liquid Sound: bounded, locally rendered ribbons, no external graphics or audio path.
 const liquidCanvas=playerScene?.querySelector('#svLiquidSoundCanvas');
 const liquidToggle=playerScene?.querySelector('#svLiquidSoundToggle');
 const liquidLabel=playerScene?.querySelector('#svLiquidSoundLabel');
 let liquidContext=null;
 try{liquidContext=liquidCanvas?.getContext('2d',{alpha:true})||null}catch{}
 let liquidMode=true,liquidLast=0,liquidSize=0,liquidGradient=null,liquidPhase=0,liquidClock=-1;
 const liquidEnergy=new Float32Array(3);
 try{liquidMode=localStorage.getItem('seyveo.music.visualizer')!=='classic'}catch{}
 const TAU=Math.PI*2;
 const liquidMobile=window.matchMedia?.('(max-width: 600px)').matches||((navigator.hardwareConcurrency||8)<=4);
 const liquidSteps=liquidMobile?120:180,liquidThreads=liquidMobile?36:64;
 const angles=Array.from({length:liquidSteps+1},(_,i)=>{const a=i/liquidSteps*TAU;return [a,Math.cos(a),Math.sin(a),Math.cos(2*a),Math.sin(2*a),Math.cos(3*a),Math.sin(3*a)]});
 function liquidVisible(){return !!liquidContext&&liquidMode&&musicPage?.dataset.musicView==='player'&&!musicPage.hidden&&!musicPage.classList.contains('sv-karaoke-active')&&!playerStage?.classList.contains('has-artwork')}
 function paintLiquid(timestamp,bass=0,mid=0,air=0,force=false){
  if(!liquidVisible()||document.hidden)return;
  if(!force&&timestamp-liquidLast<(liquidMobile?40:32))return;
  const dt=liquidLast?clamp(timestamp-liquidLast,1,100):33;
  liquidLast=timestamp;
  const cssSize=liquidCanvas.clientWidth;
  if(!cssSize)return;
  const pixels=Math.max(160,Math.min(liquidMobile?620:850,Math.round(cssSize*Math.min(window.devicePixelRatio||1,1.8))));
  if(liquidSize!==pixels){liquidCanvas.width=liquidCanvas.height=pixels;liquidSize=pixels;liquidGradient=null}
  const playing=!audio.paused&&!audio.ended&&!reduce?.matches;
  if(playing){
   const t=audio.currentTime;
   const elapsed=liquidClock<0?0:clamp(t-liquidClock,0,.12);
   liquidClock=t;
   liquidPhase+=elapsed*(.42+liquidEnergy[0]*.44);
   for(let i=0;i<3;i++){const v=[bass,mid,air][i];liquidEnergy[i]+=(v-liquidEnergy[i])*(1-Math.exp(-dt/(v>liquidEnergy[i]?110:260)))}
  }else liquidClock=-1;
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
  const radius=164*(1+.025*b),t=p*.40;
  const rot=-.035+.065*Math.sin(t*.55),cr=Math.cos(rot),sr=Math.sin(rot);
  const geom=angles.map(([a,ca,sa])=>{
   const wave=Math.sin(2*a+t),fold=Math.sin(3*a-t*.65);
   // Asymmetric broad folds on opposite sides, with an almost circular silhouette.
   const lobe=Math.pow(.5+.5*Math.cos(2*(a+2.30)+t*.52),1.05);
   const innerLobe=Math.pow(.5+.5*Math.cos(2*(a+1.48)-t*.45),1.5);
   const kink=Math.pow(.5+.5*Math.cos(a+.9-t*.30),8);
   const ripple=Math.sin(5*a+t*.9);
   return {a,ca,sa,wave,fold,lobe,innerLobe,kink,ripple};
  });
  const point=(g,kind,u)=>{
   const {ca,sa,wave,fold,lobe,innerLobe,kink,ripple}=g;
   let r,z;
   if(kind===0){
    const silhouette=radius*(1+.009*wave+.006*fold);
    const depth=radius*(.012+(.135+.035*m)*lobe+.095*kink);
    const curl=radius*(.052+.028*m)*lobe*ripple;
    r=silhouette-depth*u+curl*Math.sin(Math.PI*u);
    z=radius*(.04*fold+.16*lobe*Math.sin(Math.PI*u));
   }else{
    const opening=radius*(.753+.008*wave+.007*fold);
    const depth=radius*(.009+(.104+.021*m)*innerLobe);
    r=opening+depth*u+radius*.023*innerLobe*ripple*Math.sin(Math.PI*u);
    z=radius*(.045*wave-.11*innerLobe*Math.sin(Math.PI*u));
   }
   const x=r*ca,y=r*sa*.994,scale=1+z*.0005;
   return [200+(x*cr-y*sr)*scale,200+(x*sr+y*cr)*scale];
  };
  const path=(pts,close=true)=>{
   ctx.beginPath();for(let i=0;i<pts.length;i++){const [x,y]=pts[i];if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}if(close)ctx.closePath();
  };
  // Each ribbon is lit across its surface. Brightness peaks at its turning lip.
  function ribbon(kind,count){
   const rows=Array.from({length:count},(_,j)=>geom.map(g=>point(g,kind,j/(count-1))));
   const tint=kind===0?'120,242,219':'188,255,240';
   const sections=24;
   const layers=10;
   for(let layer=0;layer<layers;layer++){
    const j=Math.floor(layer*(count-1)/layers),next=Math.floor((layer+1)*(count-1)/layers);
    const u=(j+next)/(2*(count-1));
    const lip=Math.exp(-Math.pow((u-(kind===0?.87:.08))/.29,2));
    for(let k=0;k<sections;k++){
     const i0=Math.floor(k*liquidSteps/sections),i1=Math.floor((k+1)*liquidSteps/sections),g=geom[(i0+i1)>>1];
     const lobe=kind===0?g.lobe:g.innerLobe;
     const facing=.06+.94*Math.pow(lobe,.7);
     ctx.beginPath();ctx.moveTo(...rows[j][i0]);
     for(let i=i0+1;i<=i1;i++)ctx.lineTo(...rows[j][i]);
     for(let i=i1;i>=i0;i--)ctx.lineTo(...rows[next][i]);
     ctx.closePath();
     ctx.fillStyle='rgba('+tint+','+((.018+.67*lip)*facing).toFixed(3)+')';
     ctx.fill();
    }
   }
   const fiber=ctx.createLinearGradient(46,45,346,351);
   fiber.addColorStop(0,'rgba(120,241,218,.32)');
   fiber.addColorStop(.25,'rgba(219,255,246,.95)');
   fiber.addColorStop(.52,'rgba(70,197,184,.24)');
   fiber.addColorStop(.78,'rgba(206,255,241,.94)');
   fiber.addColorStop(1,'rgba(129,245,219,.48)');
   for(let j=0;j<count;j++){
    const u=j/(count-1),lip=Math.exp(-Math.pow((u-(kind===0?.89:.08))/.19,2));
    path(rows[j]);ctx.strokeStyle=fiber;ctx.globalAlpha=.15+.57*lip;ctx.lineWidth=.23+.12*lip;ctx.stroke();
   }
   ctx.globalAlpha=1;
   // Smooth, narrow specular edge; no broad neon halo or segmented joints.
   const edge=rows[kind===0?count-1:0];
   const spec=ctx.createLinearGradient(64,39,337,360);
   spec.addColorStop(0,'rgba(128,244,221,.12)');
   spec.addColorStop(.18,'rgba(220,255,247,.96)');
   spec.addColorStop(.43,'rgba(111,226,211,.48)');
   spec.addColorStop(.68,'rgba(234,255,250,.97)');
   spec.addColorStop(.88,'rgba(166,255,235,.85)');
   spec.addColorStop(1,'rgba(98,227,208,.16)');
   path(edge);ctx.strokeStyle=spec;ctx.globalAlpha=.21;ctx.lineWidth=2.0;ctx.stroke();
   ctx.globalAlpha=1;ctx.lineWidth=kind===0?1.05:1.04;ctx.stroke();
   path(rows[kind===0?0:count-1]);ctx.strokeStyle='rgba(151,240,225,.15)';ctx.lineWidth=.36;ctx.stroke();
  }
  // Silk membrane: a broad fine mesh tapers into two points and folds back
  // on itself near the diagonal crest. The interior is no longer a flat S line.
  const R=radius*.753,tilt=-.32+.045*Math.sin(t*.7),mc=Math.cos(tilt),ms=Math.sin(tilt);
  const membrane=(x,u)=>{
   const env=Math.sqrt(Math.max(0,1-x*x));
   const arc=-env*(.97+.012*Math.sin(t));
   const crest=env*(.045+.085*Math.sin(Math.PI*x+t*.5)+.035*Math.sin(2*Math.PI*x-t));
   const crease=env*(.12+.05*m)*Math.pow(Math.sin(Math.PI*u),2)*Math.sin(Math.PI*x+.8+t*.45);
   const y=arc+(crest-arc)*u+crease;
   return [200+R*(x*mc-y*ms),200+R*(x*ms+y*mc)];
  };
  const mesh=liquidMobile?48:78;
  const memGradient=ctx.createLinearGradient(60,220,340,155);
  memGradient.addColorStop(0,'rgba(125,245,219,.72)');
  memGradient.addColorStop(.42,'rgba(135,226,213,.62)');
  memGradient.addColorStop(.76,'rgba(168,255,237,.78)');
  memGradient.addColorStop(1,'rgba(230,255,247,.88)');
  // Paint discrete subpixel pearls in one batched path per row. Dashes
  // with round caps were too dim on some high-DPI screens.
  const columns=liquidMobile?94:140;
  for(let j=0;j<mesh;j++){
   const u=(j+.45)/mesh;
   const size=.49+.17*Math.pow(u,4)+.04*h;
   ctx.beginPath();
   for(let i=1;i<columns;i++){
    const x=-1+2*(i+(j%2)*.34)/columns;
    const [px,py]=membrane(x,u);
    ctx.rect(px-size/2,py-size/2,size,size);
   }
   ctx.fillStyle=memGradient;
   ctx.globalAlpha=.39+.43*Math.pow(u,5);
   ctx.fill();
  }
  ctx.globalAlpha=1;
  const foldCount=liquidMobile?26:40;
  for(let j=0;j<foldCount;j++){
   const v=j/(foldCount-1),pts=[];
   for(let i=0;i<=liquidSteps;i++){
    const x=-1+2*i/liquidSteps,[px,py]=membrane(x,1);
    const env=Math.pow(Math.max(0,1-x*x),.9);
    pts.push([px,py+R*(.20+.035*m)*env*Math.sin(Math.PI*v)*(.70+.30*Math.cos(Math.PI*(x+.30)+t*.5))]);
   }
   path(pts,false);ctx.strokeStyle=memGradient;ctx.globalAlpha=.20+.49*Math.pow(Math.sin(Math.PI*v),2);ctx.lineWidth=.32;ctx.stroke();
  }
  ctx.globalAlpha=1;
  ribbon(1,liquidMobile?30:46);
  ribbon(0,liquidMobile?38:56);
  ctx.globalAlpha=1;
 }
 function syncLiquidMode(){
  const enabled=!!liquidContext&&liquidMode;
  playerScene?.classList.toggle('sv-liquid-mode',enabled);
  if(liquidToggle){liquidToggle.hidden=!liquidContext;liquidToggle.setAttribute('aria-pressed',String(enabled));liquidToggle.setAttribute('aria-label',enabled?'Liquid Sound. Переключить на эквалайзер':'Эквалайзер. Переключить на Liquid Sound')}
  if(liquidLabel)liquidLabel.textContent=enabled?'SEYVEO LIQUID SOUND':'SEYVEO SOUND';
  if(enabled)paintLiquid(performance.now(),0,0,0,true);
 }
 liquidToggle?.addEventListener('click',event=>{
  event.stopPropagation();liquidMode=!liquidMode;
  try{localStorage.setItem('seyveo.music.visualizer',liquidMode?'liquid':'classic')}catch{}
  syncLiquidMode();
 });
 window.addEventListener('resize',()=>{if(liquidVisible())paintLiquid(performance.now(),...liquidEnergy,true)});
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
  if(!sceneAllowed()||reduce?.matches||window.SEYVEO_MUSIC?.rhythmFile?.()!==sceneFile){syncScene();return}
  const data=rhythmCache.get(sceneFile);
  if(!data?.length){resetSceneWave();return}
  const full=scene===playerScene;
  if(timestamp-sceneLast>=(full?0:50)){
   const dt=sceneLast?clamp(timestamp-sceneLast,1,80):16.7;
   sceneLast=timestamp;
   const position=clamp(audio.currentTime/RHYTHM_STEP,0,data.length/3-1);
   const frame=Math.floor(position)*3;
   const following=Math.min(frame+3,data.length-3),fraction=position-Math.floor(position);
   const band=i=>full?data[frame+i]+(data[following+i]-data[frame+i])*fraction:data[frame+i];
   const bass=band(0),mid=band(1),air=band(2);
   if(full&&liquidMode)paintLiquid(timestamp,bass,mid,air);
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
  const target=sceneTarget();
  if(scene!==target){
   scene?.classList.remove('sv-scene-playing');resetSceneWave();
   scene=target;sceneBars=Array.from(scene?.querySelectorAll('.sv-music-scene-wave line')||[]);
  }
  const allowed=!!scene&&sceneAllowed();
  if(scene===playerScene&&liquidMode&&!allowed){liquidClock=-1;if(!liquidSize)paintLiquid(performance.now(),0,0,0,true)}
  if(scene===playerScene&&liquidMode&&liquidVisible()&&!liquidSize)paintLiquid(performance.now(),0,0,0,true);
  musicPage?.classList.toggle('sv-now-ambient-playing',!!playerScene&&scene===playerScene&&allowed);
  if(!scene)return;
  scene.classList.toggle('sv-scene-playing',allowed);
  if(!allowed||reduce?.matches){resetSceneWave();return}
  const file=window.SEYVEO_MUSIC?.rhythmFile?.();
  if(!file){if(sceneFile||sceneFrame)resetSceneWave();return}
  if(sceneFile!==file){resetSceneWave();sceneFile=file}
  prepareRhythm(file);
  if(!rhythmCache.get(file)?.length)return;
  scene.classList.add('sv-scene-rhythm');
  if(!sceneFrame)sceneFrame=requestAnimationFrame(tickScene);
 }
 if((homeScene||playerScene)&&audio){
  for(const name of ['waiting','stalled','seeking','emptied','error'])audio.addEventListener(name,()=>{sceneWaiting=true;syncScene()});
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
 sync();syncScene();
})();