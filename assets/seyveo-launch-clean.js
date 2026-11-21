/* SEYVEO · Filmic first paint. One approved logo, measured against the
   actual resting Sayvi sphere on Home; never manipulate the Home orb itself. */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 const preview=params.get('sayvi-intro')==='1';
 const nav=performance.getEntriesByType('navigation')[0];
 const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const day=new Date().toISOString().slice(0,10);
 const seenKey='seyveo-clean-launch-day-v1';
 let seen=false;
 try{seen=localStorage.getItem(seenKey)===day}catch{}
 const isHome=!location.hash||location.hash==='#home';
 const eligible=isHome&&params.get('sayvi-intro')!=='0'
   &&(preview||standalone||nav?.type==='reload'||!seen);
 if(!eligible){
  document.documentElement.classList.remove('sv-cinema-boot');
  return;
 }
 // This element is inserted right after BODY for a genuinely clean first paint.
 // Keep a fallback for previously cached HTML while the new index propagates.
 let splash=document.getElementById('svLaunchClean');
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
 if(!mark)return;
 let finished=false,phaseTimer=0,finishTimer=0,watchdog=0;
 const close=()=>{
  if(finished)return;
  finished=true;
  clearTimeout(phaseTimer);clearTimeout(finishTimer);clearTimeout(watchdog);
  splash.remove();
  document.documentElement.classList.remove('sv-cinema-boot');
 };
 window.addEventListener('pagehide',close,{once:true});
 watchdog=setTimeout(close,12000);
 const source='assets/seyveo-circular-interlace-color-clean.png?v=clean-2';
 const img=new Image();
 img.decoding='async';
 img.src=source;
 const logoReady=new Promise((resolve,reject)=>{
  if(img.complete){img.naturalWidth?resolve():reject(new Error('Logo unavailable'));return}
  img.onload=resolve;img.onerror=()=>reject(new Error('Logo unavailable'));
 }).then(()=>typeof img.decode==='function'?img.decode().catch(()=>{}):undefined);
 const domReady=new Promise(resolve=>{
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resolve,{once:true});
  else resolve();
 });
 const syncWithHome=()=>{
  const orb=document.getElementById('orb');
  const rect=orb?.getBoundingClientRect();
  const w=document.documentElement.clientWidth||window.innerWidth;
  const h=window.innerHeight;
  const hasOrb=!!(rect&&rect.width>90&&rect.height>90&&Number.isFinite(rect.top));
  const diameter=hasOrb?rect.width:Math.min(w*.76,300);
  const x=hasOrb?rect.left+rect.width/2:w/2;
  const y=hasOrb?rect.top+rect.height/2:h*.32;
  // On each device this is the SAME resting Home orb's exact diameter.
  // The launch logo starts smaller, approaches, and NEVER exceeds it.
  const firstSize=diameter*.55;
  splash.style.setProperty('--sv-launch-x',x+'px');
  splash.style.setProperty('--sv-launch-y',y+'px');
  splash.style.setProperty('--sv-launch-d',firstSize+'px');
  splash.style.setProperty('--sv-launch-scale',String(diameter/firstSize));
 };
 Promise.all([logoReady,domReady]).then(()=>{
  if(finished)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(finished)return;
   syncWithHome();
   // Decoded before display: no half-loaded image, pixelated placeholder,
   // or swap with a differently styled logo.
   mark.style.setProperty('background-image','url("'+img.src+'")','important');
   splash.dataset.stage='ready';
   document.documentElement.classList.remove('sv-cinema-boot');
   try{localStorage.setItem(seenKey,day)}catch{}
   phaseTimer=setTimeout(()=>{
    if(finished)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){close();return}
    splash.dataset.stage='zoom';
    phaseTimer=setTimeout(()=>{
     if(finished)return;
     // A short visual resting point makes the two same-size spheres feel
     // connected; the fade then reveals the undisturbed Home underneath.
     phaseTimer=setTimeout(()=>{
      if(finished)return;
      splash.dataset.stage='reveal';
      finishTimer=setTimeout(close,820);
     },130);
    },3000);
   },1120);
  }));
 }).catch(close);
})();
