/* SEYVEO · Clean launch controller. Only the original approved sphere
   at the Home sphere's coordinates; one short zoom, no second layers. */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.get('sayvi-intro')==='0')return;
 if(location.hash&&location.hash!=='#home')return;
 const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const preview=params.get('sayvi-intro')==='1';
 const pageReload=performance.getEntriesByType('navigation')[0]?.type==='reload';
 const seenKey='seyveo-clean-launch-day-v1';
 const day=new Date().toISOString().slice(0,10);
 let seen=false;try{seen=localStorage.getItem(seenKey)===day}catch{}
 if(!preview&&!standalone&&!pageReload&&seen)return;
 if(document.getElementById('svLaunchClean'))return;

 const splash=document.createElement('dialog');
 splash.id='svLaunchClean';
 splash.setAttribute('aria-label','Загрузка SEYVEO');
 splash.setAttribute('aria-modal','true');
 const mark=document.createElement('div');
 mark.className='svLaunchCleanMark';
 mark.setAttribute('aria-hidden','true');
 splash.append(mark);
 document.body.append(splash);
 try{splash.showModal()}catch{splash.setAttribute('open','')}
 document.documentElement.classList.remove('sv-cinema-boot');
 try{localStorage.setItem(seenKey,day)}catch{}

 let closed=false;
 let endTimer=0,watchdog=0;
 const close=()=>{
  if(closed)return;
  closed=true;
  clearTimeout(endTimer);clearTimeout(watchdog);
  try{if(splash.open&&typeof splash.close==='function')splash.close()}catch{}
  splash.remove();
 };
 window.addEventListener('pagehide',close,{once:true});
 splash.addEventListener('cancel',event=>{event.preventDefault();close()});
 watchdog=setTimeout(close,8000);

 const source='assets/seyveo-circular-interlace-color-clean.png?v=clean-2';
 const img=new Image();
 img.decoding='async';
 img.src=source;
 const loaded=new Promise((resolve,reject)=>{
  if(img.complete){img.naturalWidth?resolve():reject(new Error('Image unavailable'));return}
  img.onload=()=>resolve();
  img.onerror=()=>reject(new Error('Image unavailable'));
 });
 const ready=loaded.then(()=>typeof img.decode==='function'?img.decode().catch(()=>{}):undefined);
 ready.then(()=>{
  if(closed)return;
  // Geometry comes from the REAL live Home sphere after its own init.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(closed)return;
   const orb=document.getElementById('orb');
   const rect=orb?.getBoundingClientRect();
   const w=document.documentElement.clientWidth||window.innerWidth;
   const h=window.innerHeight;
   const valid=rect&&rect.width>90&&rect.height>90;
   const diameter=valid?rect.width:Math.min(w*.76,300);
   const x=valid?rect.left+rect.width/2:w/2;
   const y=valid?rect.top+rect.height/2:h*.42;
   const firstSize=diameter*.75;
   splash.style.setProperty('--sv-launch-x',x+'px');
   splash.style.setProperty('--sv-launch-y',y+'px');
   splash.style.setProperty('--sv-launch-d',firstSize+'px');
   splash.style.setProperty('--sv-launch-scale',String(diameter/firstSize));
   // Paint the complete decoded asset as one background. No progressive
   // half-PNG painting or globally styled IMG element.
   // Override the isolated element reset; otherwise its important "all"
   // rule erases a normal inline background image (blank splash).
   mark.style.setProperty('background-image','url("'+img.src+'")','important');
   splash.dataset.stage='ready';
   const animate=()=>{
    if(closed)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){close();return}
    splash.dataset.stage='zoom';
    endTimer=setTimeout(close,800);
   };
   // The image is visible and still for a beat, then zoom only to
   // the Home sphere's final diameter, never beyond the screen.
   endTimer=setTimeout(animate,1600);
  }));
 }).catch(close);
})();
