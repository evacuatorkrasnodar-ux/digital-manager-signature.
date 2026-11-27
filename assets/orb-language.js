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
 let liquidGPU=null,liquidGPUAttempted=false;
 try{liquidContext=liquidCanvas?.getContext('2d',{alpha:true})||null}catch{}
 let liquidMode=true,liquidLast=0,liquidSize=0,liquidGradient=null,liquidPhase=0,liquidClock=-1;
 let liquidQuality=1,liquidSlowFrames=0,liquidAmbientLast=0;
 function liquidInterval(){return liquidQuality<.85?50:liquidMobile?40:32}
 const liquidEnergy=new Float32Array(3);
 try{liquidMode=localStorage.getItem('seyveo.music.visualizer')!=='classic'}catch{}
 const TAU=Math.PI*2;
 const liquidMobile=window.matchMedia?.('(max-width: 600px)').matches||((navigator.hardwareConcurrency||8)<=4);
 const liquidSteps=liquidMobile?120:180,liquidThreads=liquidMobile?36:64;
 const angles=Array.from({length:liquidSteps+1},(_,i)=>{const a=i/liquidSteps*TAU;return [a,Math.cos(a),Math.sin(a),Math.cos(2*a),Math.sin(2*a),Math.cos(3*a),Math.sin(3*a)]});
 function liquidVisible(){return !!liquidContext&&liquidMode&&!!audio&&!document.hidden&&location.hash==='#sayvi-music'&&musicPage?.dataset.musicView==='player'&&!musicPage.hidden&&visibleScenes.get(playerScene)!==false&&!musicPage.classList.contains('sv-karaoke-active')&&!playerStage?.classList.contains('has-artwork')}
 function releaseLiquid(){
  if(liquidGPU){try{liquidGPU.dispose?.()}catch{}liquidGPU=null}
  liquidGPUAttempted=false;liquidLast=0;liquidClock=-1;liquidSlowFrames=0;liquidAmbientLast=0;
  if(liquidSize){liquidCanvas.width=liquidCanvas.height=1;liquidSize=0;liquidGradient=null}
  liquidEnergy.fill(0);
 }
 function paintLiquid(timestamp,bass=0,mid=0,air=0,force=false){
  if(!liquidVisible()||document.hidden)return;
  const interval=liquidInterval();
  if(!force&&timestamp-liquidLast<interval-1)return;
  const dt=liquidLast?clamp(timestamp-liquidLast,1,100):33;
  if(!force&&liquidLast){
   liquidSlowFrames=dt>interval+23?liquidSlowFrames+1:Math.max(0,liquidSlowFrames-1);
   if(liquidSlowFrames>=12&&liquidQuality>.64){liquidQuality=liquidQuality>.85?.8:.64;liquidSlowFrames=0}
  }
  liquidLast=timestamp;
  const cssSize=liquidCanvas.clientWidth;
  if(!cssSize)return;
  const pixelRatio=liquidMobile?Math.min(window.devicePixelRatio||1,1.5):Math.max(1.75,Math.min(window.devicePixelRatio||1,2));
  const pixels=Math.max(160,Math.min(Math.round((liquidMobile?540:850)*liquidQuality),Math.round(cssSize*pixelRatio*liquidQuality)));
  if(liquidSize!==pixels){liquidCanvas.width=liquidCanvas.height=pixels;liquidSize=pixels;liquidGradient=null}
  const playing=!audio.paused&&!audio.ended&&!reduce?.matches;
  if(playing){
   const t=audio.currentTime;
   const elapsed=liquidClock<0?0:clamp(t-liquidClock,0,.12);
   liquidClock=t;
   liquidPhase+=elapsed*(1.10+liquidEnergy[0]*.65);
   for(let i=0;i<3;i++){const v=i===0?bass:i===1?mid:air;liquidEnergy[i]+=(v-liquidEnergy[i])*(1-Math.exp(-dt/(v>liquidEnergy[i]?110:260)))}
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
  // Render the GPU layer only when Liquid Sound is visible. The existing
  // Canvas 2D renderer remains intact for unavailable/lost WebGL contexts.
  if(!liquidGPUAttempted){
   liquidGPUAttempted=true;
   try{liquidGPU=window.SEYVEO_LIQUID_GL?.create(liquidMobile)||null}catch{liquidGPU=null}
  }
  if(liquidGPU){
   try{
    const frame=liquidGPU.render(pixels,p,b,m,h);
    if(frame){ctx.drawImage(frame,0,0,400,400);return}
   }catch{}
   try{liquidGPU.dispose?.()}catch{}liquidGPU=null;
  }

  const radius=164*(1+.025*b),t=p*.40;
  const rot=-.035+.065*Math.sin(t*.55),cr=Math.cos(rot),sr=Math.sin(rot);
  // A nearly spherical shell with independently shaped turning edges.
  // Local lobes reproduce the broad upper-left and lower-right light folds,
  // with a shallow double fold at the upper-right shoulder.
  const peak=(angle,center,width)=>Math.exp(-(1-Math.cos(angle-center))/(width*width));
  const drift=.10*Math.sin(t*.58);
  // Reference-derived polar profiles for the lit fold, rear edge and light.
  // Independent boundaries cross naturally as the silk turns over in space.
  const profiles=[
   [.997,.996,.966,.982,.996,.994,.973,.981,.981,.989,.969,.965,.950,.912,.884,.872,.890,.911,.901,.832,.813,.935,.993,.996],
   [.90,.914,.935,.947,.951,.942,.917,.927,.953,.930,.899,.997,1,1,1,1,1,1,1,1,1,.999,.930,.909],
   [.68,1,1,1,.98,.99,1,1,1,.89,.80,.77,.56,.52,.72,.90,.98,1,1,.98,.94,1,.98,.72]
  ];
  const profile=(values,a)=>{
   const n=values.length,z=((a/(Math.PI*2)*n)%n+n)%n,i=Math.floor(z),f=z-i;
   const get=k=>values[(i+k+n)%n],A=get(-1),B=get(0),C=get(1),D=get(2);
   return B+.5*f*(C-A+f*(2*A-5*B+4*C-D+f*(3*(B-C)+D-A)));
  };
  const geom=angles.map(([a,ca,sa])=>{
   const aa=a+drift;
   return {a,ca,sa,
    lip:profile(profiles[0],aa),back:profile(profiles[1],aa),
    pinch:peak(aa,-1.0,.21),
    innerTop:peak(aa,-1.85,.54),
    innerBottom:peak(aa,1.52,.40),
    innerKnot:peak(aa,1.49,.12)};
  });
  const point=(g,kind,u)=>{
   const {a,lip,back,pinch,innerTop,innerBottom,innerKnot}=g;
   let r;
   if(kind===0){
    r=radius*(back+(lip-back)*u+(.032+.017*m)*pinch*Math.sin(Math.PI*u));
   }else{
    r=radius*(.753+.007*Math.sin(2*a+t)+(.052*innerTop-(.107+.012*m)*innerBottom+.045*innerKnot)*u+.016*innerKnot*Math.sin(Math.PI*u));
   }
   const z=a+rot+.018*Math.sin(Math.PI*u)*Math.sin(2*a+.8+t*.45);
   return [200+r*Math.cos(z),200+r*Math.sin(z)];
  };
  // Smooth closed paths between sampled vertices. Straight polygon chords
  // shared by all strands can create radial scallops on a high-DPI canvas.
  const path=(pts,close=true)=>{
   ctx.beginPath();
   if(!pts.length)return;
   if(!close){ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);return;}
   const n=pts.length-1,first=pts[0],last=pts[n-1];
   ctx.moveTo((first[0]+last[0])/2,(first[1]+last[1])/2);
   for(let i=0;i<n;i++){
    const q=pts[i],next=pts[(i+1)%n];
    ctx.quadraticCurveTo(q[0],q[1],(q[0]+next[0])/2,(q[1]+next[1])/2);
   }
   ctx.closePath();
  };
  // Light follows a single turning edge, instead of drawing two complete hoops.
  function ribbon(kind,count){
   const rows=Array.from({length:count},(_,j)=>geom.map(g=>point(g,kind,j/(count-1))));
   const edgeU=kind===0?1:0;
   const intensity=a=>kind===0?clamp(profile(profiles[2],a+drift),0,1):clamp(.24+.78*peak(a+drift,-1.85,.60)+.78*peak(a+drift,1.52,.42),0,1);
   const conic=typeof ctx.createConicGradient==='function';
   const fallback=ctx.createLinearGradient(64,55,339,345);
   fallback.addColorStop(0,'rgba(151,255,233,.88)');
   fallback.addColorStop(.24,'rgba(229,255,249,1)');
   fallback.addColorStop(.48,'rgba(73,186,174,.22)');
   fallback.addColorStop(.77,'rgba(174,255,235,.96)');
   fallback.addColorStop(1,'rgba(224,255,247,.86)');
   // Continuous translucent silk, with subtle fibres rather than a luminous comb.
   const appendLoop=pts=>{
    const n=pts.length-1,first=pts[0],last=pts[n-1];
    ctx.moveTo((first[0]+last[0])/2,(first[1]+last[1])/2);
    for(let i=0;i<n;i++){
     const q=pts[i],next=pts[(i+1)%n];
     ctx.quadraticCurveTo(q[0],q[1],(q[0]+next[0])/2,(q[1]+next[1])/2);
    }
    ctx.closePath();
   };
   const bands=liquidMobile?20:30;
   for(let j=0;j<bands;j++){
    const u=(j+.5)/bands,rim=Math.exp(-Math.pow(u-edgeU,2)/.085),body=Math.sin(Math.PI*u);
    const rowA=rows[Math.round(j/bands*(count-1))],rowB=rows[Math.round((j+1)/bands*(count-1))];
    let color=fallback;
    if(conic){
     color=ctx.createConicGradient(rot,200,200);
     for(let k=0;k<=40;k++){
      const a=k/40*Math.PI*2,light=intensity(a);
      const alpha=clamp(.008+Math.pow(light,1.8)*(.98*rim+.34*body),0,.98),white=.86*rim*light;
      color.addColorStop(k/40,'rgba('+Math.round(70+175*white)+','+Math.round(232+23*white)+','+Math.round(209+42*white)+','+alpha.toFixed(3)+')');
     }
    }
    ctx.beginPath();appendLoop(rowA);appendLoop(rowB);
    ctx.fillStyle=color;ctx.globalAlpha=conic?1:.025+.81*rim+.25*body;
    ctx.fill('evenodd');
    ctx.strokeStyle=color;ctx.globalAlpha*=.35;ctx.lineWidth=.30;ctx.stroke();
   }
   for(let j=2;j<count-2;j+=4){
    const u=j/(count-1),rim=Math.exp(-Math.pow(u-edgeU,2)/.10);
    path(rows[j]);ctx.strokeStyle=fallback;
    ctx.globalAlpha=.035+.075*rim;ctx.lineWidth=.20;ctx.stroke();
   }
   ctx.globalAlpha=1;
   ctx.fillStyle='rgba(170,255,237,.18)';
   ctx.beginPath();
   for(let j=3;j<count-3;j+=3){
    for(let i=1;i<geom.length-1;i+=2){
     const g=geom[i];
     if(kind===0&&Math.abs(g.lip-g.back)<.052)continue;
     const q=point(g,kind,clamp((j+.25*Math.sin(i*2.399963+j))/(count-1),0,1));
     const d=.27+.08*intensity(g.a);
     ctx.rect(q[0]-d*.5,q[1]-d*.5,d,d);
    }
   }
   ctx.fill();
   let gloss=fallback;
   if(conic){
    gloss=ctx.createConicGradient(rot,200,200);
    for(let k=0;k<=48;k++){
     const a=k/48*Math.PI*2,light=kind===0?clamp(.06+.94*Math.pow(intensity(a),1.35),0,1):.95;
     gloss.addColorStop(k/48,'rgba(232,255,249,'+light.toFixed(3)+')');
    }
   }
   path(rows[kind===0?count-1:0]);ctx.strokeStyle=gloss;
   ctx.globalAlpha=.15;ctx.lineWidth=3.8;ctx.stroke();
   ctx.globalAlpha=.38;ctx.lineWidth=2.1;ctx.stroke();
   ctx.globalAlpha=1;ctx.lineWidth=1.20;ctx.stroke();
   // A narrow feathered reflection at the left turn and the lower-right rim.
   // Short arcs keep the highlights local instead of adding a second hoop.
   if(kind===0){
    for(const [center,spread,strength] of [[3.52,.46,.54],[.73,.63,.40],[4.09,.55,.42]]){
     const arc=geom.filter(g=>Math.abs(g.a-center)<spread);
     if(arc.length<3)continue;
     const pts=arc.map(g=>point(g,0,.98));
     const g=ctx.createLinearGradient(...pts[0],...pts[pts.length-1]);
     g.addColorStop(0,'rgba(103,255,225,0)');
     g.addColorStop(.5,'rgba(134,255,231,.64)');
     g.addColorStop(1,'rgba(103,255,225,0)');
     path(pts,false);ctx.strokeStyle=g;ctx.globalAlpha=strength*.20;ctx.lineWidth=6;ctx.stroke();
     ctx.globalAlpha=strength*.55;ctx.lineWidth=2.4;ctx.stroke();
    }
   }
   // Short, tapering return fold on the upper-right shoulder.
   if(kind===0){
    const from=5.10,to=5.58,fan=geom.filter(g=>g.a>=from&&g.a<=to);
    if(fan.length>2){
     const first=point(fan[0],0,1),last=point(fan[fan.length-1],0,1);
     const sheen=ctx.createLinearGradient(...first,...last);
     sheen.addColorStop(0,'rgba(157,255,234,0)');
     sheen.addColorStop(.45,'rgba(223,255,246,.96)');
     sheen.addColorStop(1,'rgba(157,255,234,0)');
     for(let j=0;j<12;j++){
      const v=j/11;
      const pts=fan.map(g=>point(g,0,1-(.24+.52*v)*Math.pow(Math.sin(Math.PI*(g.a-from)/(to-from)),1.6)));
      path(pts,false);ctx.strokeStyle=sheen;ctx.globalAlpha=.10+.72*v*v;ctx.lineWidth=.22+.38*v*v;ctx.stroke();
     }
    }
   }
   ctx.globalAlpha=1;
  }
  // A continuous folded sheet, projected from curved material coordinates.
  // The upper and lower edges share their tips but separate through the middle.
  const R=radius*.753,tilt=-.27+.035*Math.sin(t*.7),mc=Math.cos(tilt),ms=Math.sin(tilt);
  const project=(x,y)=>[200+R*(x*mc-y*ms),200+R*(x*ms+y*mc)];
  const shape=x=>{
   const env=Math.sqrt(Math.max(0,1-x*x));
   const curl=Math.exp(-Math.pow((x+.73)/.30,2));
   const wave=.025*Math.sin(t*.65+x*2.7)+.035*m*Math.sin(x*3.1+t);
   const upper=env*(-.125-.115*curl+.028*x+wave);
   const lower=env*(.155+.095*Math.exp(-Math.pow((x+.36)/.47,2))-.090*x+wave);
   return {env,upper,lower};
  };
  const membrane=(x,u)=>{
   const {env,upper}=shape(x);
   const arc=-env*(.985+.005*Math.sin(t));
   const flow=Math.sin(Math.PI*u);
   const xx=x+.065*env*flow*Math.sin(x*1.9+t*.55);
   const yy=arc+(upper-arc)*u+env*.12*flow*flow*Math.sin(x*2.4+.8+t*.45);
   return project(xx,yy);
  };
  const fold=(x,v)=>{
   const {env,upper,lower}=shape(x);
   const curl=Math.sin(Math.PI*v);
   const xx=x+env*(.10+.035*m)*curl*(.74-.26*x);
   const yy=upper+(lower-upper)*(v+.10*curl);
   return project(xx,yy);
  };
  const mesh=liquidMobile?48:78,columns=liquidMobile?94:140;
  const memGradient=ctx.createLinearGradient(72,235,324,155);
  memGradient.addColorStop(0,'rgba(151,252,230,.86)');
  memGradient.addColorStop(.24,'rgba(135,226,213,.67)');
  memGradient.addColorStop(.62,'rgba(153,244,227,.74)');
  memGradient.addColorStop(1,'rgba(232,255,249,.95)');
  // The upper surface is a delicate staggered grid of actual microdots.
  for(let j=0;j<mesh;j++){
   const u=(j+.45)/mesh,size=.40+.16*Math.pow(u,4)+.04*h;
   ctx.beginPath();
   for(let i=1;i<columns;i++){
    const x=-1+2*(i+(j%2)*.34)/columns;
    const [px,py]=membrane(x,u);
    ctx.rect(px-size/2,py-size/2,size,size);
   }
   ctx.fillStyle=memGradient;ctx.globalAlpha=.54+.35*Math.pow(u,5);ctx.fill();
  }
  // Follow the fabric across the fold, rather than stacking horizontal waves.
  // Thin dotted longitudinal fibres converge at both tips and curve in depth.
  const foldCols=liquidMobile?108:168,foldCount=liquidMobile?25:38;
  for(let j=0;j<foldCount;j++){
   const v=(j+.5)/foldCount,size=.41+.15*Math.pow(v,3);
   ctx.beginPath();
   for(let i=1;i<foldCols;i++){
    const x=-1+2*i/foldCols;
    const [px,py]=fold(x,v);
    ctx.rect(px-size/2,py-size/2,size,size);
   }
   ctx.fillStyle=memGradient;ctx.globalAlpha=.44+.49*Math.pow(v,2);ctx.fill();
  }
  // A narrow softly luminous turning edge, with no solid white stripe.
  const foldEdge=Array.from({length:liquidSteps+1},(_,i)=>fold(-1+2*i/liquidSteps,1));
  path(foldEdge,false);ctx.strokeStyle=memGradient;ctx.globalAlpha=.16;ctx.lineWidth=1.5;ctx.stroke();
  ctx.globalAlpha=.60;ctx.lineWidth=.43;ctx.stroke();
  // Tip reflections taper along the fabric; especially the hooked left tip.
  for(const side of [-1,1]){
   const [px,py]=project(side,0),glint=ctx.createRadialGradient(px,py,0,px,py,side<0?11:9);
   const size=side<0?11:9;
   glint.addColorStop(0,'rgba(186,255,241,.57)');
   glint.addColorStop(.36,'rgba(108,235,217,.17)');
   glint.addColorStop(1,'rgba(108,235,217,0)');
   ctx.globalAlpha=1;ctx.fillStyle=glint;ctx.fillRect(px-size,py-size,size*2,size*2);
  }
  // The back surface follows a lower hemisphere rather than a flat vertical grid.
  ctx.fillStyle='rgba(119,224,210,.26)';ctx.beginPath();
  const backRows=liquidMobile?17:24,backCols=liquidMobile?44:65;
  for(let j=1;j<=backRows;j++){
   const v=j/(backRows+1);
   for(let i=1;i<backCols;i++){
    const x=-1+2*(i+(j%2)*.5)/backCols;
    const {env,lower}=shape(x);
    const y=lower+(env*.96-lower)*v;
    const [px,py]=project(x,y);
    ctx.rect(px,py,.35,.35);
   }
  }
  ctx.globalAlpha=1;ctx.fill();
  ribbon(1,liquidMobile?44:68);
  ribbon(0,liquidMobile?56:84);
  ctx.globalAlpha=1;
 }
 function syncLiquidMode(){
  const enabled=!!liquidContext&&liquidMode;
  playerScene?.classList.toggle('sv-liquid-mode',enabled);
  musicPage?.classList.toggle('sv-liquid-visualizer',enabled);
  if(liquidToggle){liquidToggle.hidden=!liquidContext;liquidToggle.setAttribute('aria-pressed',String(enabled));liquidToggle.setAttribute('aria-label',enabled?'Liquid Sound. Переключить на эквалайзер':'Эквалайзер. Переключить на Liquid Sound')}
  if(liquidLabel)liquidLabel.textContent=enabled?'SEYVEO LIQUID SOUND':'SEYVEO SOUND';
  if(enabled)paintLiquid(performance.now(),0,0,0,true);else releaseLiquid();
 }
 liquidToggle?.addEventListener('click',event=>{
  event.stopPropagation();liquidMode=!liquidMode;
  try{localStorage.setItem('seyveo.music.visualizer',liquidMode?'liquid':'classic')}catch{}
  syncLiquidMode();
 });
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
  if(!sceneAllowed()||reduce?.matches||window.SEYVEO_MUSIC?.rhythmFile?.()!==sceneFile){syncScene();return}
  const data=rhythmCache.get(sceneFile);
  if(!data?.length){resetSceneWave();return}
  const full=scene===playerScene;
  const liquidActive=full&&liquidMode&&liquidVisible();
  // Avoid sampling and DOM updates between actual Liquid Sound frames.
  if(liquidActive&&timestamp-liquidLast<liquidInterval()-1){sceneFrame=requestAnimationFrame(tickScene);return}
  if(timestamp-sceneLast>=(full?0:50)){
   const dt=sceneLast?clamp(timestamp-sceneLast,1,80):16.7;
   sceneLast=timestamp;
   const position=clamp(audio.currentTime/RHYTHM_STEP,0,data.length/3-1);
   const frame=Math.floor(position)*3;
   const following=Math.min(frame+3,data.length-3),fraction=position-Math.floor(position);
   const band=i=>full?data[frame+i]+(data[following+i]-data[frame+i])*fraction:data[frame+i];
   const bass=band(0),mid=band(1),air=band(2);
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