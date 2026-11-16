/* SEYVEO · one living Home status, four truthful states and a single light pass.
   No perpetual marquee, fabricated speech or network-connectivity promises. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const home=document.getElementById('homePage');
 const line=home?.querySelector('.sv-sayvi-home-online');
 if(!line||window.SEYVEO_HOME_STATUS_LIGHT)return;
 const words=Object.freeze({
  online:'Сэйви · на связи',
  thinking:'Сэйви · думает',
  speaking:'Сэйви · говорит',
  offline:'Сэйви · нет связи'
 });
 const base=document.createElement('span');
 base.className='sv-home-status-letters';
 const light=document.createElement('span');
 light.className='sv-home-status-light-pass';
 light.setAttribute('aria-hidden','true');
 line.replaceChildren(base,light);
 line.setAttribute('role','status');
 line.setAttribute('aria-live','polite');
 line.setAttribute('aria-atomic','true');
 let state='',assistantPhase='online',phaseTimer=0;
 let lightTimer=0,lastPassAt=0,lastInteractionAt=Date.now();
 const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const homeVisible=()=>!document.hidden&&!home.hidden&&
  (!location.hash||location.hash==='#home')&&
  !root.classList.contains('seyveo-conversation')&&
  !document.querySelector('dialog[open]');
 function passLight(force=false){
  if(!homeVisible()||reduceMotion()||
     root.classList.contains('sv-cinema-boot')||
     root.classList.contains('sv-cinema-intro-active'))return;
  const now=Date.now();
  // One pass for a whole card/route transition, even if several events fire.
  if(!force&&now-lastPassAt<8500)return;
  lastPassAt=now;
  clearTimeout(lightTimer);
  line.classList.remove('sv-home-status-light-running');
  // Safari needs one measured frame to replay an animation on the same text.
  void light.offsetWidth;
  line.classList.add('sv-home-status-light-running');
  lightTimer=setTimeout(()=>line.classList.remove('sv-home-status-light-running'),1500);
 }
 function refresh({onEntry=false}={}){
  const next=navigator.onLine===false?'offline':assistantPhase;
  if(next!==state){
   state=next;
   base.textContent=words[state];
   light.textContent=words[state];
   line.dataset.svSayviState=state;
   // Disconnection is a state change, not a decorative opportunity.
   if(state!=='offline')passLight(true);
   else line.classList.remove('sv-home-status-light-running');
  }else if(onEntry)passLight();
 }
 function setPhase(next,timeout=0){
  clearTimeout(phaseTimer);
  assistantPhase=next;
  refresh();
  if(timeout)phaseTimer=setTimeout(()=>{
   assistantPhase='online';refresh();
  },timeout);
 }
 document.addEventListener('seyveo:assistant-presence',event=>{
  const phase=event.detail?.phase;
  if(phase==='speaking'){setPhase('speaking',30000);return;}
  if(phase==='ack'||phase==='thinking'){setPhase('thinking',2200);return;}
  if(phase==='listening'){
   setPhase('online');passLight();return;
  }
  if(['listening-end','end','stop','text'].includes(phase))setPhase('online');
 });
 window.addEventListener('offline',()=>refresh());
 window.addEventListener('online',()=>refresh({onEntry:true}));
 const transition=()=>passLight();
 for(const name of ['seyveo:cinema-finished','seyveo:home-sayvi-arrived',
  'seyveo:home-recommendation-changed','seyveo:tasks-changed'])
  window.addEventListener(name,transition);
 window.addEventListener('hashchange',()=>{
  lastInteractionAt=Date.now();
  if(homeVisible())passLight();
 });
 window.addEventListener('seyveo:route-changed',()=>{
  lastInteractionAt=Date.now();
  if(homeVisible())passLight();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
   clearTimeout(lightTimer);
   line.classList.remove('sv-home-status-light-running');
  }else{
   lastInteractionAt=Date.now();
   refresh({onEntry:true});
  }
 });
 for(const type of ['pointerdown','keydown','scroll'])
  document.addEventListener(type,()=>{lastInteractionAt=Date.now();},
   {capture:true,passive:true});
 // No shimmer loop: just an occasional single pass while the Home is idle.
 window.setInterval(()=>{
  const now=Date.now();
  if(state==='online'&&homeVisible()&&now-lastPassAt>=60000&&
     now-lastInteractionAt>=45000)passLight();
 },15000);
 window.SEYVEO_HOME_STATUS_LIGHT=Object.freeze({getState:()=>state});
 refresh();
})();
