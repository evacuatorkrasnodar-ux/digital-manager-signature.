/* SEYVEO Infinite Living Space v1
 * Move the ONE approved sphere between its Home anchor and the persistent
 * companion. The existing route/content engine remains the source of truth.
 * Transitions use transforms only; no cloned sphere, intervals or user writes. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const orbCluster=$('orbCluster'),stage=$('stage'),companion=$('seyveoCompanion');
const root=document.documentElement;
if(!orbCluster||!stage||!companion)return;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const screens={
  manage:$('managePage'),
  tasks:$('tasksPage'),
  picture:$('picturePage'),
  calendar:$('calendarPage'),
  life:$('lifePage')
};
let current='home',beforeRect=null,animation=null,frame=0;
const route=()=>{
 const hash=location.hash;
 if(hash==='#manage'||hash==='#manage-theme')return 'manage';
 if(hash==='#tasks')return 'tasks';
 if(hash==='#picture')return 'picture';
 if(hash==='#calendar')return 'calendar';
 if(hash==='#life')return 'life';
 return 'home';
};
function animateOrb(from){
 if(!from||reduce.matches||typeof orbCluster.animate!=='function')return;
 const to=orbCluster.getBoundingClientRect();
 if(!to.width||!to.height||!from.width||!from.height)return;
 const dx=from.left+from.width/2-(to.left+to.width/2);
 const dy=from.top+from.height/2-(to.top+to.height/2);
 const ratio=from.width/to.width;
 // Do not fling the sphere across an unexpectedly huge scrolled page.
 if(Math.abs(dy)>650||ratio>4)return;
 animation?.cancel();
 animation=orbCluster.animate([
  {transform:'translate3d('+dx+'px,'+dy+'px,0) scale('+ratio+')',opacity:.88},
  {transform:'translate3d(0,0,0) scale(1)',opacity:1}
 ],{duration:1060,easing:'cubic-bezier(.22,1,.36,1)'});
 animation.addEventListener('finish',()=>{animation=null},{once:true});
}
function before(next){
 if(!next)next=route();
 if(next===current&&orbCluster.parentNode===(next==='home'?stage:companion))return;
 animation?.cancel();
 animation=null;
 beforeRect=orbCluster.getBoundingClientRect();
 if(next==='home'){
  root.classList.remove('sv-space-active');
  root.removeAttribute('data-sv-space');
  stage.insertBefore(orbCluster,stage.firstChild);
  companion.hidden=true;
 }else{
  root.classList.add('sv-space-active');
  root.dataset.svSpace=next;
  companion.hidden=false;
  companion.insertBefore(orbCluster,companion.firstChild);
 }
 current=next;
}
function cascade(page){
 const target=screens[page];
 if(!target||reduce.matches)return;
 target.classList.remove('sv-cascade');
 cancelAnimationFrame(frame);
 // Reapply in a different frame; no geometry reads/forced layout.
 frame=requestAnimationFrame(()=>{
  if(current!==page||target.hidden)return;
  target.classList.add('sv-cascade');
 });
}
function after(next){
 if(!next)next=route();
 if(current!==next)before(next);
 if(beforeRect){animateOrb(beforeRect);beforeRect=null;}
 if(next!=='home')cascade(next);
}
function initialize(){
 // Existing rows retain their original click handlers and destinations.
 document.querySelectorAll('#seyveoCleanManageMenu .manage-group')
  .forEach((group,i)=>group.style.setProperty('--sv-group-index',String(i)));
 document.querySelectorAll('#seyveoCleanManageMenu .seyveo-clean-link')
  .forEach((row,i)=>row.style.setProperty('--sv-row-index',String(i)));
 document.addEventListener('click',event=>{
  if(!event.target.closest('#seyveoCleanManageMenu [data-clean-section], #seyveoCleanBack'))return;
  if(route()!=='manage')return;
  // A click changes the existing detail view; animate the result, not a copy.
  requestAnimationFrame(()=>cascade('manage'));
 });
 before(route());
 after(route());
}
window.SEYVEO_LIVING_SPACE=Object.freeze({before,after});
initialize();
window.addEventListener('pageshow',event=>{if(event.persisted)after(route())});
})();
