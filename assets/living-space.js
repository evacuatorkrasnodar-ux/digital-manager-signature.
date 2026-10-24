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
  life:$('lifePage'),
  sayvi:$('sayviSurfacePage')
};
let current='home',beforeRect=null,animation=null,frame=0;
const route=()=>{
 const hash=location.hash;
 if(hash==='#manage'||hash==='#manage-theme')return 'manage';
 if(hash==='#tasks')return 'tasks';
 if(hash==='#picture')return 'picture';
 if(hash==='#calendar')return 'calendar';
 if(hash==='#life')return 'life';
 if(/^#sayvi-(mail|documents|health)$/.test(hash)||hash==='#sayvi-answer'||hash==='#sayvi-music'||hash==='#sayvi-video')return 'sayvi';
 return 'home';
};

/* Living Screen director: reuses the approved headings, one sphere and one
 * dock. Its copy derives only from visible module state and real events.
 * It never clicks actions, invents data or changes the Home composition. */
const directorCore=window.SEYVEO_LIVING_SCREEN_CORE;
const dock=document.querySelector('footer.dock');
const companionCaption=companion.querySelector('.sv-presence-caption');
const assistantButton=$('assistantButton');
const originalAssistantTitle=assistantButton?.getAttribute('title');
const voiceTargets={
 tasks:'#tasksPage .tasks-heading > p:last-child',
 calendar:'#calendarPage .calendar-header > div > p:last-child',
 life:'#lifePage .life-description',
 picture:'#pictureLead',
 manage:'#managePage #manageOverview > .manage-heading > p:last-child',
 music:'#sayviMusicPage .sv-music-intro',
 video:'#sayviVideoPage .sv-video-intro'
};
let directorFrame=0,lastDirectorScreen='',lastDirectorText='';
let pendingTaskCount=null;
function directorScreen(page){
 if(page==='home')return 'home';
 if(page==='sayvi'){
  if(location.hash==='#sayvi-music')return 'music';
  if(location.hash==='#sayvi-video')return 'video';
  return 'sayvi';
 }
 return page;
}
function readDirector(page){
 const screen=directorScreen(page);
 const priority=$('tasksContextFocus')?.hidden===false;
 const rowCount=document.querySelectorAll('#personalTaskList .personal-task-row[data-task-id]').length;
 const tasksCount=Number.isInteger(pendingTaskCount)?pendingTaskCount:rowCount+(priority?1:0);
 const selected=$('calendarSelectedCount');
 const mode=document.querySelector('#calendarPage [data-calendar-mode][aria-pressed="true"]')?.dataset.calendarMode;
 const count=document.querySelectorAll('#homeWidgetGrid [data-home-widget]').length;
 const music=$('sayviMusicAudio');
 return directorCore?.resolve({
  screen,count:screen==='tasks'?tasksCount:screen==='picture'?count:null,
  priority,mode,selection:!!selected&&selected.textContent?.trim()!=='',
  playing:!!music&&!music.paused&&!music.ended
 })||{context:screen,eyebrow:'Сэйви',line:''};
}
function presentDirector(){
 if(!directorCore||!dock)return;
 const currentScreen=route();
 // Home belongs to the original stage; no modified headings/dock on Home.
 if(currentScreen==='home'){
  dock.removeAttribute('data-sv-living-context');
  assistantButton?.removeAttribute('data-sv-living-context');
  if(assistantButton){
   if(originalAssistantTitle===null)assistantButton.removeAttribute('title');
   else assistantButton.setAttribute('title',originalAssistantTitle);
  }
  root.removeAttribute('data-sv-living-scene');
  lastDirectorScreen='home';lastDirectorText='';
  return;
 }
 const scene=readDirector(currentScreen);
 const target=voiceTargets[scene.context]?document.querySelector(voiceTargets[scene.context]):null;
 if(target&&scene.line&&target.textContent!==scene.line){
  target.textContent=scene.line;
  target.classList.add('sv-living-director-copy');
 }
 dock.dataset.svLivingContext=scene.context;
 if(assistantButton){
  assistantButton.dataset.svLivingContext=scene.context;
  assistantButton.title='Сэйви · '+scene.eyebrow.replace(/^Сэйви · /,'');
 }
 if(companionCaption)companionCaption.textContent=scene.eyebrow;
 if(scene.context!==lastDirectorScreen||scene.line!==lastDirectorText){
  lastDirectorScreen=scene.context;lastDirectorText=scene.line;
  root.dataset.svLivingScene=scene.context;
 }
}
function scheduleDirector(){
 if(directorFrame)return;
 directorFrame=requestAnimationFrame(()=>{
  directorFrame=0;
  presentDirector();
 });
}

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
 // Moving between two non-Home screens does not move the physical sphere.
 if(next!=='home'&&orbCluster.parentNode===companion){
  current=next;root.dataset.svSpace=next;beforeRect=null;
  return;
 }
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
 const target=page==='sayvi'?( $('sayviAnswerPage')?.hidden===false?$('sayviAnswerPage'): $('sayviMusicPage')?.hidden===false?$('sayviMusicPage'): $('sayviVideoPage')?.hidden===false?$('sayviVideoPage'):screens[page]):screens[page];
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
 // The music stage is short and scrollable. Avoid FLIP interpolation across
 // its moving scrollport on iOS, which can make the single sphere flicker.
 if(location.hash==='#sayvi-music'||location.hash==='#sayvi-video'){
  animation?.cancel();
  animation=null;
  beforeRect=null;
 }else if(beforeRect){
  animateOrb(beforeRect);
  beforeRect=null;
 }
 if(next!=='home')cascade(next);
 scheduleDirector();
}
function initialize(){
 // The same orb remains an accessible assistant button on interior pages.
 // Home retains the approved cinematic brand-tap behaviour unchanged.
 $('orb')?.addEventListener('click',event=>{
  if(current==='home')return;
  event.preventDefault();
  event.stopImmediatePropagation();
  $('assistantButton')?.click();
 },true);
 // Recompute only after real data or navigation changes; no polling timers.
 window.addEventListener('seyveo:tasks-changed',event=>{
  const next=event.detail?.open;
  pendingTaskCount=Number.isInteger(next)&&next>=0?next:null;
  scheduleDirector();
 });
 for(const eventName of ['seyveo:calendar-changed','seyveo:spaces-changed',
  'seyveo:wellness-changed','seyveo:music-state','seyveo:space-opened']){
  window.addEventListener(eventName,scheduleDirector);
 }
 window.addEventListener('hashchange',scheduleDirector);
 window.addEventListener('storage',scheduleDirector);
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-calendar-mode],[data-picture-period], #seyveoCleanManageMenu [data-clean-section]'))scheduleDirector();
 });
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
window.SEYVEO_LIVING_SCREEN=Object.freeze({refresh:scheduleDirector,current:()=>readDirector(route())});
initialize();
window.addEventListener('pageshow',event=>{if(event.persisted)after(route())});
})();
