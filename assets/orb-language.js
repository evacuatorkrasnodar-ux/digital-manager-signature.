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
  // A nearly spherical shell with independently shaped turning edges.
  // Local lobes reproduce the broad upper-left and lower-right light folds,
  // with a shallow double fold at the upper-right shoulder.
  const peak=(angle,center,width)=>Math.exp(-(1-Math.cos(angle-center))/(width*width));
  const drift=.10*Math.sin(t*.58);
  const geom=angles.map(([a,ca,sa])=>{
   const aa=a+drift;
   return {a,ca,sa,
    topLeft:peak(aa,-2.16,.47),
    rightFold:peak(aa,.46,.54),
    bottomFold:peak(aa,1.64,.44),
    shoulder:peak(aa,-.76,.32),
    pinch:peak(aa,-1.03,.15),
    innerTop:peak(aa,-1.85,.54),
    innerBottom:peak(aa,1.52,.40),
    innerKnot:peak(aa,1.49,.12)};
  });
  const point=(g,kind,u)=>{
   const {a,ca,sa,topLeft,rightFold,bottomFold,shoulder,pinch,innerTop,innerBottom,innerKnot}=g;
   let r;
   if(kind===0){
    const silhouette=radius*(1+.007*Math.sin(2*a+t)+.004*Math.sin(3*a-t*.5));
    const depth=radius*(.004+(.129+.018*m)*topLeft+.103*rightFold+.073*bottomFold+.146*shoulder-.057*pinch);
    // Opposed bending produces a bright turning edge without deforming the silhouette.
    const curl=radius*(.068*pinch-.030*shoulder+.010*rightFold*Math.sin(4*a+t));
    r=silhouette-depth*u+curl*Math.sin(Math.PI*u);
   }else{
    const opening=radius*(.753+.009*Math.sin(2*a+t)+.005*Math.sin(3*a-t*.65));
    // At the bottom the membrane turns inward rather than forming another external hoop.
    const depth=radius*(.003+.066*innerTop-.104*innerBottom+.031*innerKnot);
    r=opening+depth*u+radius*.037*innerKnot*Math.sin(Math.PI*u);
   }
   const shear=(kind===0?.035:.024)*Math.sin(Math.PI*u)*Math.sin(2*a+.8+t*.45);
   const cs=Math.cos(shear),ss=Math.sin(shear);
   const x=r*(ca*cs-sa*ss),y=r*(sa*cs+ca*ss)*.995;
   return [200+x*cr-y*sr,200+x*sr+y*cr];
  };
  const path=(pts,close=true)=>{
   ctx.beginPath();for(let i=0;i<pts.length;i++){const [x,y]=pts[i];if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}if(close)ctx.closePath();
  };
  // Fine continuous filaments, not polygon tiles: light accumulates where the
  // folded surface turns toward its edge, while the wider shell stays transparent.
  function ribbon(kind,count){
   const rows=Array.from({length:count},(_,j)=>geom.map(g=>point(g,kind,j/(count-1))));
   // Soft light runs across the fabric, not just the sharp turning lip.
   // Directional gradients are continuous, with opposing luminous lobes.
   const fiber=ctx.createLinearGradient(64,55,339,345);
   fiber.addColorStop(0,'rgba(130,255,231,.96)');
   fiber.addColorStop(.21,'rgba(124,255,224,1)');
   fiber.addColorStop(.47,'rgba(59,174,166,.20)');
   fiber.addColorStop(.76,'rgba(116,255,224,.98)');
   fiber.addColorStop(1,'rgba(187,255,240,.92)');
   const veil=ctx.createLinearGradient(45,76,350,326);
   veil.addColorStop(0,'rgba(76,223,204,.45)');
   veil.addColorStop(.22,'rgba(116,249,221,.67)');
   veil.addColorStop(.48,'rgba(56,158,153,.08)');
   veil.addColorStop(.75,'rgba(117,251,222,.60)');
   veil.addColorStop(1,'rgba(91,229,207,.45)');
   // A seamless underlay softens gaps without tiled fills or a blurred halo.
   ctx.beginPath();
   for(let i=0;i<rows[0].length;i++){const [x,y]=rows[0][i];if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
   ctx.closePath();
   const far=rows[count-1];
   for(let i=far.length-1;i>=0;i--){const [x,y]=far[i];if(i===far.length-1)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
   ctx.closePath();
   ctx.fillStyle=veil;ctx.globalAlpha=kind===0?.17:.12;ctx.fill('evenodd');
   for(let j=0;j<count;j++){
    const u=j/(count-1),edgeU=kind===0?.89:.08;
    const lip=Math.exp(-Math.pow((u-edgeU)/.23,2));
    const body=Math.exp(-Math.pow((u-(kind===0?.57:.42))/.31,2));
    path(rows[j]);ctx.strokeStyle=fiber;
    ctx.globalAlpha=.035+.39*lip+.17*body;
    ctx.lineWidth=.15+.19*lip+.08*body;ctx.stroke();
   }
   // Sparse subpixel glints articulate the depth without opaque shading.
   ctx.fillStyle=kind===0?'rgba(147,255,231,.38)':'rgba(186,255,242,.30)';
   ctx.globalAlpha=1;ctx.beginPath();
   for(let j=2;j<count-2;j+=3){
    const u=j/(count-1);
    for(let i=1;i<liquidSteps;i+=2){
     const g=geom[i];
     const light=kind===0?Math.max(g.topLeft,g.rightFold,g.bottomFold,g.shoulder):Math.max(g.innerTop,g.innerBottom);
     if(light<.25)continue;
     const [x,y]=rows[j][i],d=.21+.15*light;
     ctx.rect(x-d/2,y-d/2,d,d);
    }
   }
   ctx.fill();
   ctx.globalAlpha=1;
   const edge=rows[kind===0?count-1:0];
   const spec=ctx.createLinearGradient(64,39,337,360);
   spec.addColorStop(0,'rgba(164,255,232,.68)');
   spec.addColorStop(.20,'rgba(229,255,249,1)');
   spec.addColorStop(.44,'rgba(126,232,215,.48)');
   spec.addColorStop(.69,'rgba(241,255,252,1)');
   spec.addColorStop(.88,'rgba(182,255,237,.94)');
   spec.addColorStop(1,'rgba(105,235,213,.38)');
   path(edge);ctx.strokeStyle=spec;ctx.globalAlpha=.13;ctx.lineWidth=2.5;ctx.stroke();
   ctx.globalAlpha=.30;ctx.lineWidth=1.6;ctx.stroke();
   ctx.globalAlpha=1;ctx.lineWidth=.92;ctx.stroke();
   path(rows[kind===0?0:count-1]);ctx.strokeStyle='rgba(151,240,225,.19)';ctx.lineWidth=.32;ctx.stroke();
  }
  // Silk membrane: a broad fine mesh tapers into two points and folds back
  // on itself near the diagonal crest. The interior is no longer a flat S line.
  const R=radius*.753,tilt=-.28+.045*Math.sin(t*.7),mc=Math.cos(tilt),ms=Math.sin(tilt);
  const membrane=(x,u)=>{
   const env=Math.sqrt(Math.max(0,1-x*x));
   const arc=-env*(.97+.012*Math.sin(t));
   const crest=env*(-.075-.045*Math.sin(Math.PI*x+t*.45)+.008*Math.sin(2*Math.PI*x-t));
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
   const size=.44+.20*Math.pow(u,4)+.04*h;
   ctx.beginPath();
   for(let i=1;i<columns;i++){
    const x=-1+2*(i+(j%2)*.34)/columns;
    const [px,py]=membrane(x,u);
    ctx.rect(px-size/2,py-size/2,size,size);
   }
   ctx.fillStyle=memGradient;
   ctx.globalAlpha=.54+.40*Math.pow(u,5);
   ctx.fill();
  }
  ctx.globalAlpha=1;
  // A single twisted leaf of silk, widest left of centre, tapering at both tips.
  // Microdots follow the surface rather than drawing a second heavy S-shaped rim.
  const foldCount=liquidMobile?28:44,foldCols=liquidMobile?100:156;
  for(let j=0;j<foldCount;j++){
   const v=(j+.45)/foldCount;
   const bend=Math.sin(v*Math.PI*.5);
   ctx.beginPath();
   for(let i=1;i<foldCols;i++){
    const x=-1+2*(i+(j%2)*.34)/foldCols,[px,py]=membrane(x,1);
    const env=Math.pow(Math.max(0,1-x*x),.78);
    const width=R*(.28+.035*m)*env*(.74+.26*Math.cos(Math.PI*(x+.29)+t*.5));
    const dx=R*.045*env*Math.sin(Math.PI*v);
    const size=.46+.19*Math.pow(v,2);
    ctx.rect(px+dx-size/2,py+width*bend-size/2,size,size);
   }
   ctx.fillStyle=memGradient;ctx.globalAlpha=.36+.55*Math.pow(v,2);ctx.fill();
  }
  ctx.globalAlpha=1;
  // Sparse back-surface pearls make the lower hemisphere read as a volume.
  ctx.fillStyle='rgba(119,224,210,.28)';
  ctx.beginPath();
  const backRows=liquidMobile?17:24,backCols=liquidMobile?44:65;
  for(let j=1;j<=backRows;j++){
   const v=j/(backRows+1);
   for(let i=1;i<backCols;i++){
    const x=-1+2*(i+(j%2)*.5)/backCols,env=Math.sqrt(Math.max(0,1-x*x));
    const [px,py]=membrane(x,1);
    const y=py+R*env*v*.83;
    if((px-200)*(px-200)+(y-200)*(y-200)<R*R*.94)ctx.rect(px,y,.38,.38);
   }
  }
  ctx.globalAlpha=1;ctx.fill();
  ribbon(1,liquidMobile?64:100);
  ribbon(0,liquidMobile?78:124);
  ctx.globalAlpha=1;
 }
 function syncLiquidMode(){
  const enabled=!!liquidContext&&liquidMode;
  playerScene?.classList.toggle('sv-liquid-mode',enabled);
  musicPage?.classList.toggle('sv-liquid-visualizer',enabled);
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