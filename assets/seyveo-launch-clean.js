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
 const close=()=>{
  if(finished)return;
  finished=true;
  clearTimeout(phaseTimer);clearTimeout(landingTimer);
  clearTimeout(cleanupTimer);clearTimeout(watchdog);
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
  cleanupTimer=setTimeout(close,690);
 };
 mark.addEventListener('animationend',event=>{
  if(event.target===mark&&event.animationName==='svLaunchApproach')reveal();
 });
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
   // Static, independently positioned typesetting: the mark flies towards
   // the viewer, the wordmark stays anchored below its final sphere.
   const greeting=document.querySelector('#stage > .message');
   const greetingBox=greeting?.getBoundingClientRect();
   const titleY=greetingBox&&greetingBox.height>0
    ?greetingBox.top+8:y+diameter*.5+25;
   const wordY=Math.max(y+diameter*.5+10,Math.min(height-98,titleY));
   splash.style.setProperty('--sv-launch-word-y',wordY.toFixed(1)+'px');
   splash.style.setProperty('--sv-launch-d',initialDiameter+'px');
   const finalScale=diameter/initialDiameter;
   splash.style.setProperty('--sv-launch-scale',String(finalScale));
   splash.style.setProperty('--sv-launch-near-scale',
    String(1+(finalScale-1)*.973));
   splash.dataset.stage='ready';
   document.documentElement.classList.remove('sv-cinema-boot');
   try{localStorage.setItem(key,day)}catch{}
   const start=()=>{
    if(finished)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){close();return}
    splash.dataset.stage='zoom';
    // Safari fallback only. Normal landing is driven by animationend to
    // preserve the final frame even if the device drops frames under load.
    landingTimer=setTimeout(reveal,3460);
   };
   phaseTimer=setTimeout(start,880);
  }));
 }).catch(close);
})();
