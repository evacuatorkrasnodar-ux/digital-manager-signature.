/* SEYVEO · Director's cut. One moving mark; in its final frames that
   very same mark becomes the actual themed Home sphere at its true location.
   No transformations or animations are applied to the live Home orb. */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 const preview=params.get('sayvi-intro')==='1';
 const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const navigation=performance.getEntriesByType('navigation')[0];
 const key='seyveo-clean-launch-day-v1';
 const day=new Date().toISOString().slice(0,10);
 let seen=false;
 try{seen=localStorage.getItem(key)===day}catch{}
 const eligible=(!location.hash||location.hash==='#home')
  &&params.get('sayvi-intro')!=='0'
  &&(preview||standalone||navigation?.type==='reload'||!seen);
 // Full director's cut: 0-.45 hold, .45-3.35 camera approach,
 // 2.45-3.06 lettering dissolves, 3.35-3.75 Home scene opens.
 // Daily repeat opens faster; ?sayvi-intro=1 always replays full motion.
 const quick=seen&&!preview;
 const holdMs=quick?260:450;
 const flightMs=quick?1550:2900;
 const fadeMs=quick?340:400;
 let splash=document.getElementById('svLaunchClean');
 if(!eligible){
  splash?.remove();
  document.documentElement.classList.remove('sv-cinema-boot');
  return;
 }
 if(!splash){
  splash=document.createElement('div');
  splash.id='svLaunchClean';
  splash.setAttribute('role','status');
  splash.setAttribute('aria-label','Загрузка SEYVEO');
  splash.innerHTML='<div class="svLaunchCleanMark" aria-hidden="true"></div><div class="svLaunchCleanSignature" aria-hidden="true"><span class="svLaunchCleanName">SEYVEO</span><span class="svLaunchCleanDescriptor">IT · AI · AUTOMATION</span></div>';
  document.body.append(splash);
 }
 splash.hidden=false;
 splash.style.setProperty('--sv-launch-flight-ms',flightMs+'ms');
 splash.style.setProperty('--sv-launch-fade-ms',fadeMs+'ms');
 splash.style.setProperty('--sv-launch-type-enter-ms',(quick?210:380)+'ms');
 // Match the browser's safe-area/status-bar tone to the velvet opening.
 // Restore the saved app theme color as soon as the opening is dismissed.
 const themeMeta=document.querySelector('meta[name="theme-color"]');
 const root=document.documentElement;
 if(themeMeta){
  if(!root.dataset.svLaunchPreviousThemeColor)
   root.dataset.svLaunchPreviousThemeColor=themeMeta.getAttribute('content')||'';
  themeMeta.setAttribute('content','#10271f');
 }
 const mark=splash.querySelector('.svLaunchCleanMark');
 if(!mark){splash.remove();document.documentElement.classList.remove('sv-cinema-boot');return}
 let finished=false,opening=false,phaseTimer=0,landingTimer=0,cleanupTimer=0,watchdog=0;
 let flightFrame=0,entryFrame=0;
 const close=()=>{
  if(finished)return;
  finished=true;
  clearTimeout(phaseTimer);clearTimeout(landingTimer);
  clearTimeout(cleanupTimer);clearTimeout(watchdog);
  cancelAnimationFrame(flightFrame);cancelAnimationFrame(entryFrame);
  splash.remove();
  if(themeMeta&&root.dataset.svLaunchPreviousThemeColor)
   themeMeta.setAttribute('content',root.dataset.svLaunchPreviousThemeColor);
  delete root.dataset.svLaunchPreviousThemeColor;
  root.classList.remove('sv-cinema-boot');
 };
 const reveal=()=>{
  if(finished||opening)return;
  opening=true;
  clearTimeout(landingTimer);
  // One uninterrupted final handoff: the moving emblem has become
  // the real Home orb, and only the velvet curtain dissolves.
  splash.dataset.stage='reveal';
  cleanupTimer=setTimeout(close,fadeMs+130);
 };
 splash.addEventListener('animationend',event=>{
  if(event.target===splash&&event.animationName==='svLaunchSceneOpen')close();
 });
 window.addEventListener('pagehide',close,{once:true});
 watchdog=setTimeout(close,12000);
 const decodeImage=src=>{
  const image=new Image();
  image.decoding='async';
  image.src=src;
  return new Promise((resolve,reject)=>{
   if(image.complete){
    image.naturalWidth?resolve(image):reject(new Error('Asset unavailable'));
   }else{
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('Asset unavailable'));
   }
  }).then(loaded=>typeof loaded.decode==='function'
    ?loaded.decode().catch(()=>{}).then(()=>loaded):loaded);
 };
 const readyForDom=new Promise(resolve=>{
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resolve,{once:true});
  else resolve();
 });
 Promise.all([
  decodeImage('assets/seyveo-circular-interlace-color-clean.png?v=clean-2'),
  readyForDom
 ]).then(async()=>{
  if(finished)return;
  // Work from the real, already themed Home image — never a guessed sphere.
  // On a reload Safari may restore a scroll position that moves the orb away.
  if(window.scrollY>0)window.scrollTo(0,0);
  const home=document.getElementById('plasmaVisual');
  const homeSrc=home?.currentSrc||home?.getAttribute('src')||
   (document.documentElement.dataset.theme==='dark'
    ?'assets/plasma-signature.svg?v=20'
    :'assets/plasma-signature-light.svg?v=24');
  const resolvedHomeURL=new URL(homeSrc,document.baseURI).href;
  splash.style.setProperty('--sv-launch-home-image','url('+JSON.stringify(resolvedHomeURL)+')');
  // Both pieces of artwork are decoded before we start; prevents the real
  // sphere from popping in late during the very last frames of the zoom.
  try{await decodeImage(resolvedHomeURL)}catch{}
  if(finished)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(finished)return;
   const orb=document.getElementById('orb');
   const rect=orb?.getBoundingClientRect();
   const width=document.documentElement.clientWidth||innerWidth;
   const height=innerHeight;
   const valid=!!(rect&&rect.width>90&&rect.height>90
    &&Number.isFinite(rect.left)&&Number.isFinite(rect.top));
   const diameter=valid?rect.width:Math.min(width*.76,300);
   const x=valid?rect.left+rect.width/2:width/2;
   const y=valid?rect.top+rect.height/2:height*.39;
   // The same outer bounds as the real Home button. Within them, the PNG
   // art is optically fitted to the circular content of Home's SVG.
   const initialDiameter=diameter*.45;
   splash.style.setProperty('--sv-launch-x',x+'px');
   splash.style.setProperty('--sv-launch-y',y+'px');
   // The source artwork has transparent margins. Use its VISIBLE radius
   // (~40% of its frame), never the frame's outer 50% as the text anchor.
   // This keeps the title optically close to the sphere throughout the shot.
   const initialGap=Math.max(11,Math.min(16,height*.016));
   const initialWordY=Math.min(height-96,y+initialDiameter*.40+initialGap);
   splash.style.setProperty('--sv-launch-word-y',initialWordY.toFixed(1)+'px');
   splash.style.setProperty('--sv-launch-d',initialDiameter+'px');
   const finalScale=diameter/initialDiameter;
   // One RAF clock drives both the sphere and the subtitle. The Home orb
   // itself is never animated, repositioned, or recreated.
   const signature=splash.querySelector('.svLaunchCleanSignature');
   const ease=t=>{
    const v=Math.max(0,Math.min(1,t));
    return v*v*v*(v*(v*6-15)+10);
   };
   const paint=t=>{
    const progress=Math.max(0,Math.min(1,t));
    const eased=ease(progress);
    const scale=1+(finalScale-1)*eased;
    mark.style.setProperty('--sv-orb-scale',scale.toFixed(6));
    // This follows the orb's exact current screen-space bottom instead of
    // independently interpolating a distant text destination.
    const textShift=initialDiameter*.40*(scale-1);
    signature?.style.setProperty('--sv-text-shift',textShift.toFixed(2)+'px');
    signature?.style.setProperty('--sv-text-scale',(.85+.26*eased).toFixed(5));
    const fade=progress<=.69?1:progress>=.9?0:1-ease((progress-.69)/.21);
    signature?.style.setProperty('--sv-text-opacity',fade.toFixed(4));
    const morph=progress<=.76?0:ease((progress-.76)/.24);
    mark.style.setProperty('--sv-logo-opacity',(1-morph).toFixed(4));
    mark.style.setProperty('--sv-real-orb-opacity',morph.toFixed(4));
   };
   splash.dataset.motion='single-frame';
   mark.style.setProperty('--sv-orb-scale','1');
   mark.style.setProperty('--sv-logo-opacity','1');
   mark.style.setProperty('--sv-real-orb-opacity','0');
   signature?.style.setProperty('--sv-text-shift','0px');
   signature?.style.setProperty('--sv-text-scale','.85');
   signature?.style.setProperty('--sv-text-opacity','0');
   splash.dataset.stage='ready';
   document.documentElement.classList.remove('sv-cinema-boot');
   try{localStorage.setItem(key,day)}catch{}
   const textFadeMs=quick?190:370;
   let entryStart=null;
   const enter=now=>{
    if(finished||opening||splash.dataset.stage!=='ready')return;
    if(entryStart===null)entryStart=now;
    const progress=Math.min(1,(now-entryStart)/textFadeMs);
    signature?.style.setProperty('--sv-text-opacity',ease(progress).toFixed(4));
    if(progress<1)entryFrame=requestAnimationFrame(enter);
   };
   entryFrame=requestAnimationFrame(enter);
   const start=()=>{
    if(finished)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){close();return}
    cancelAnimationFrame(entryFrame);
    splash.dataset.stage='zoom';
    let firstFrame=null;
    const run=now=>{
     if(finished||opening)return;
     if(firstFrame===null)firstFrame=now;
     const progress=Math.min(1,(now-firstFrame)/flightMs);
     paint(progress);
     if(progress<1)flightFrame=requestAnimationFrame(run);
     else reveal();
    };
    flightFrame=requestAnimationFrame(run);
    // Only a catastrophic Safari rendering stall uses this guard. Land on
    // the exact final pixel before opening, never cut to the real orb early.
    landingTimer=setTimeout(()=>{if(!opening){paint(1);reveal()}},flightMs+750);
   };
   phaseTimer=setTimeout(start,holdMs);
  }));
 }).catch(close);
})();
