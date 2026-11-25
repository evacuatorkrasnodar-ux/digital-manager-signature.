/* SEYVEO · native scroll-under glass. One visual layer, no scroll interception. */
(()=>{
'use strict';
const ids=['seyveoCompanyDialog','seyveoQrCardDialog','seyveoContactsDialog','picturePage','svcpManagerPeople','svStaffInvitePage','svRecruitDetail','svHrInterview'];
const mounted=new WeakSet();
function register(screen){
 if(!screen||mounted.has(screen))return;
 const body=Array.from(screen.children).find(el=>el.classList.contains('sv-page-scroll'));
 if(!body)return;
 const header=Array.from(screen.children).find(el=>el.matches('header,.seyveo-passport-dialog-head'));
 if(!header)return;
 mounted.add(screen);
 const isActive=()=>screen.tagName==='DIALOG'?screen.open:!screen.hidden;
 const material=document.createElement('span');
 material.className='sv-scroll-glass-material';
 material.setAttribute('aria-hidden','true');
 header.prepend(material);
 header.classList.add('sv-scroll-glass-head');
 let paintFrame=0,measureFrame=0;
 const scheduleMeasure=()=>{
  if(measureFrame)return;
  measureFrame=requestAnimationFrame(()=>{measureFrame=0;measure()});
 };
 const measure=()=>{
  if(!isActive())return;
  const mode=getComputedStyle(body).display;
  if(mode==='contents'||mode==='none'){
   screen.classList.remove('sv-scroll-glass-ready');
   return;
  }
  const style=getComputedStyle(header);
  const gap=Math.max(0,parseFloat(style.marginBottom)||0);
  const height=header.getBoundingClientRect().height;
  if(height<=0)return;
  const overlap=Math.ceil(height+gap);
  const underlap=overlap+'px',tail=Math.max(12,gap+10)+'px';
  if(screen.style.getPropertyValue('--sv-scroll-underlap')!==underlap)screen.style.setProperty('--sv-scroll-underlap',underlap);
  if(screen.style.getPropertyValue('--sv-scroll-glass-tail')!==tail)screen.style.setProperty('--sv-scroll-glass-tail',tail);
  screen.classList.add('sv-scroll-glass-ready');
  paint();
 };
 const paint=()=>{
  if(paintFrame){cancelAnimationFrame(paintFrame);paintFrame=0;}
  if(!isActive())return;
  const progress=String(Math.max(0,Math.min(1,body.scrollTop/12)));
  if(screen.style.getPropertyValue('--sv-scroll-glass-opacity')!==progress)
   screen.style.setProperty('--sv-scroll-glass-opacity',progress);
 };
 body.addEventListener('scroll',()=>{
  if(!paintFrame)paintFrame=requestAnimationFrame(()=>{paintFrame=0;paint()});
 },{passive:true});
 new MutationObserver(()=>{if(isActive())scheduleMeasure()})
  .observe(screen,{attributes:true,attributeFilter:['open','hidden','data-sv-company-mode','data-sv-company-filled']});
 if(typeof ResizeObserver==='function')new ResizeObserver(scheduleMeasure).observe(header);
 window.addEventListener('resize',scheduleMeasure,{passive:true});
 if(isActive())measure();
}
function init(){for(const id of [...ids,'svStaffProfile'])register(document.getElementById(id));}
window.SEYVEO_SCROLL_GLASS=Object.freeze({register});
init();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
})();

/* SEYVEO · shared 30px content fade, based on the actual floating dock.
   Explicitly audited scrollports only; never mask the dock, editors or a dialog
   that owns the dock. No changes to dimensions, padding, scrolling or input. */
(()=>{
'use strict';
const targets=[
 '#svWorkShell[data-agenda-scroll="true"]:not([data-task-tool-mode="all"]) #tasksPage:not([hidden]) #personalTaskList.personal-tasks-list',
 '#svWorkShell[data-active="notes"] #notesDialog:not(.sv-nb-selecting) > #notesList.sv-note-clean-list:not(.is-empty)',
 '#sayviSurfacePage[data-sv-subject="mail"][data-sv-mail-mode="overview"]:not([hidden]):not(:has(.sv-mail-bulk-active)) > #sayviSurfaceBody',
 '#svWorkShell[data-shared-work="true"][data-active="business"] > #tasksPage:not([hidden]) > #unifiedBusinessTasksView:not([hidden])',
 'dialog:is(#svcpManagerPeople,#svStaffProfile,#svRecruitDetail,#svHrInterview).seyveo-dock-host[open] > .sv-page-scroll',
 'dialog#calendarSpaceDialog[data-space="health"].seyveo-dock-host[open] > #svCareScroll',
 '#calendarPage:not([hidden]) #calendarView[data-mode="week"]:not([hidden]) #calendarWeekTimelineScroll'
].join(',');
let active=new Set(),watched=new Set(),pending=false;
const root=document.documentElement;
const resize=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
function schedule(){
 if(pending)return;pending=true;requestAnimationFrame(measure);
}
function clear(el){
 el.removeAttribute('data-sv-dock-fade');
 el.style.removeProperty('--sv-fade-start');
 el.style.removeProperty('--sv-fade-mid');
 el.style.removeProperty('--sv-fade-end');
}
function measure(){
 pending=false;
 const dock=document.querySelector('footer.dock.sv-shared-dock')||document.querySelector('footer.dock');
 const candidates=[...document.querySelectorAll(targets)];
 const nextWatch=new Set(dock?[dock,...candidates]:candidates);
 if(resize){
  for(const el of watched)if(!nextWatch.has(el))resize.unobserve(el);
  for(const el of nextWatch)if(!watched.has(el))resize.observe(el);
 }
 watched=nextWatch;
 const next=new Set();
 const dockStyle=dock&&getComputedStyle(dock),d=dock&&dock.getBoundingClientRect();
 const host=dock?.closest('dialog[open]');
 const focus=document.activeElement;
 const editing=focus?.matches('input,textarea,select,[contenteditable="true"]');
 if(dock&&d.height>0&&dockStyle.display!=='none'&&dockStyle.visibility==='visible'&&Number(dockStyle.opacity)>.05&&!editing&&!root.classList.contains('sv-task-selection-active')&&!root.classList.contains('sv-task-search-focus')){
  for(const el of candidates){
   if(el.contains(dock)||el.closest('[hidden]')||(host&&!host.contains(el))||(!host&&el.closest('dialog[open]')))continue;
   const box=el.getBoundingClientRect(),style=getComputedStyle(el);
   const overlap=box.bottom-d.top;
   if(box.height<110||box.width<1||d.right<=box.left||d.left>=box.right||overlap<12||overlap>150||!['auto','scroll','overlay'].includes(style.overflowY))continue;
   if(el.scrollHeight<=el.clientHeight+2)continue;
   // Respect existing special masks and only fade where the final row has its own scroll reserve.
   if(!active.has(el)&&[style.maskImage,style.webkitMaskImage].some(v=>v&&v!=='none'))continue;
   if((parseFloat(style.paddingBottom)||0)<overlap+4)continue;
   const start=Math.max(30,overlap+5),mid=start-22,end=start-30;
   for(const [name,value] of [['--sv-fade-start',start],['--sv-fade-mid',mid],['--sv-fade-end',end]]){
    const px=value+'px';
    if(el.style.getPropertyValue(name)!==px)el.style.setProperty(name,px);
   }
   if(el.getAttribute('data-sv-dock-fade')!=='true')el.setAttribute('data-sv-dock-fade','true');
   next.add(el);
  }
 }
 for(const el of active)if(!next.has(el))clear(el);
 active=next;
}
const observer=new MutationObserver(schedule);
observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','class','data-active','data-mode','data-month-layout','data-agenda-scroll','data-task-tool-mode','data-sv-subject','data-sv-mail-mode','data-space']});
window.addEventListener('resize',schedule,{passive:true});
window.visualViewport?.addEventListener('resize',schedule,{passive:true});
document.addEventListener('focusin',schedule);
document.addEventListener('focusout',schedule);
window.addEventListener('pageshow',schedule);
schedule();
})();
