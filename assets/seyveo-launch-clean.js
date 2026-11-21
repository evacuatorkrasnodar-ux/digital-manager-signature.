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
  splash.innerHTML='<div class="svLaunchCleanMark" aria-hidden="true"></div>';
  document.body.append(splash);
 }
 splash.hidden=false;
 const mark=splash.querySelector('.svLaunchCleanMark');
 if(!mark){splash.remove();document.documentElement.classList.remove('sv-cinema-boot');return}
 let finished=false,opening=false,phaseTimer=0,landingTimer=0,cleanupTimer=0,watchdog=0;
 const close=()=>{
  if(finished)return;
  finished=true;
  clearTimeout(phaseTimer);clearTimeout(landingTimer);
  clearTimeout(cleanupTimer);clearTimeout(watchdog);
  splash.remove();
  document.documentElement.classList.remove('sv-cinema-boot');
 };
 const reveal=()=>{
  if(finished||opening)return;
  opening=true;
  clearTimeout(landingTimer);
  // Same-size Home SVG is already the moving mark's outermost visual layer.
  // Fade the whole opening shot to reveal the identical live Home sphere.
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
   splash.style.setProperty('--sv-launch-d',initialDiameter+'px');
   splash.style.setProperty('--sv-launch-scale',String(diameter/initialDiameter));
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
