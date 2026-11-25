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

/* SEYVEO · shared soft content fade, ending before the actual floating dock.
   Explicitly audited scrollports only; never mask the dock, editors or a dialog
   that owns the dock. No changes to dimensions, padding, scrolling or input. */
(()=>{
'use strict';
const targets=[
 '#svWorkShell[data-agenda-scroll="true"]:not([data-task-tool-mode="all"]) #tasksPage:not([hidden]) #personalTaskList.personal-tasks-list',
 '#svWorkShell[data-active="notes"] #notesDialog:not(.sv-nb-selecting) > #notesList.sv-note-clean-list:not(.is-empty)',
 '#sayviSurfacePage[data-sv-subject="mail"][data-sv-mail-mode="overview"]:not([hidden]):not(:has(.sv-mail-bulk-active)) > #sayviSurfaceBody',
 '#sayviSurfacePage[data-sv-subject="contract"][data-sv-doc-view="archive"]:not([hidden]):not(:has(dialog[open])) > #sayviSurfaceBody',
 '#svWorkShell[data-shared-work="true"][data-active="business"] > #tasksPage:not([hidden]) > #unifiedBusinessTasksView:not([hidden])',
 'dialog:is(#svcpManagerPeople,#svStaffProfile,#svRecruitDetail,#svHrInterview).seyveo-dock-host[open] > .sv-page-scroll',
 'dialog#calendarSpaceDialog[data-space="health"].seyveo-dock-host[open] > #svCareScroll',
 '#calendarPage:not([hidden]) #calendarView[data-mode="week"]:not([hidden]) #calendarWeekTimelineScroll'
].join(',');
let active=new Set(),watched=new Set(),pending=false;
const reserves=new WeakMap();
function reserve(el,needed){
 const old=reserves.get(el);
 const current=el.style.getPropertyValue('padding-bottom');
 if(old&&current!==old.applied){reserves.delete(el);}
 const previous=reserves.get(el);
 const base=previous?previous.base:(parseFloat(getComputedStyle(el).paddingBottom)||0);
 const value=Math.ceil(Math.max(base,needed))+'px';
 if(!previous&&base>=needed)return;
 const record=previous||{base,value:current,priority:el.style.getPropertyPriority('padding-bottom')};
 if(current!==value||el.style.getPropertyPriority('padding-bottom')!=='important')el.style.setProperty('padding-bottom',value,'important');
 record.applied=value;reserves.set(el,record);
}
function releaseReserve(el){
 const old=reserves.get(el);if(!old)return;
 if(el.style.getPropertyValue('padding-bottom')===old.applied){
  if(old.value)el.style.setProperty('padding-bottom',old.value,old.priority);
  else el.style.removeProperty('padding-bottom');
 }
 reserves.delete(el);
}
const root=document.documentElement;
const resize=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
function schedule(){
 if(pending)return;pending=true;requestAnimationFrame(measure);
}
function clear(el){
 releaseReserve(el);
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
   // Preserve bespoke masks. Fade the content to zero above the dock,
   // with enough actual scroll reserve for the last row to stay fully readable.
   if(!active.has(el)&&[style.maskImage,style.webkitMaskImage].some(v=>v&&v!=='none'))continue;
   const end=Math.max(0,overlap+3),mid=end+13,start=end+36;
   reserve(el,start+8);
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
observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','class','data-active','data-mode','data-month-layout','data-agenda-scroll','data-task-tool-mode','data-sv-subject','data-sv-mail-mode','data-sv-doc-view','data-space']});
window.addEventListener('resize',schedule,{passive:true});
window.visualViewport?.addEventListener('resize',schedule,{passive:true});
document.addEventListener('focusin',schedule);
document.addEventListener('focusout',schedule);
window.addEventListener('pageshow',schedule);
schedule();
})();

/* SEYVEO · calm mechanical-wheel scrolling, native touch/trackpad unchanged.
   Only established vertical list scrollports; never intercept editors, rails,
   nested scroll regions, calendar snapping or accessibility navigation. */
(()=>{
'use strict';
const docs='#sayviSurfacePage[data-sv-subject="contract"][data-sv-doc-view="archive"]:not([hidden]) > #sayviSurfaceBody';
const targets=[docs,
 '#sayviSurfacePage[data-sv-subject="mail"][data-sv-mail-mode="overview"]:not([hidden]) > #sayviSurfaceBody',
 '#svWorkShell[data-agenda-scroll="true"]:not([data-task-tool-mode="all"]) #tasksPage:not([hidden]) #personalTaskList.personal-tasks-list',
 '#svWorkShell[data-active="notes"] #notesDialog:not(.sv-nb-selecting) > #notesList.sv-note-clean-list',
 '#svWorkShell[data-shared-work="true"][data-active="business"] > #tasksPage:not([hidden]) > #unifiedBusinessTasksView:not([hidden])',
 'dialog:is(#svcpManagerPeople,#svStaffProfile,#svRecruitDetail,#svHrInterview,#seyveoCompanyDialog,#seyveoQrCardDialog,#seyveoContactsDialog)[open] > .sv-page-scroll'
].join(',');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let active=null,frame=0;
function stop(){if(frame)cancelAnimationFrame(frame);frame=0;active=null;}
function paintEdge(el){
 if(el.matches(docs))el.style.setProperty('--sv-doc-edge-opacity',String(Math.max(0,Math.min(1,el.scrollTop/20))));
}
document.addEventListener('scroll',e=>{if(e.target instanceof Element)paintEdge(e.target);},true);
function tick(now){
 frame=0;
 if(!active)return;
 const {el}=active;
 if(!el.isConnected||el.closest('[hidden]')||!el.matches(targets)||reduced.matches){stop();return;}
 const dt=Math.min(40,Math.max(1,now-active.last));active.last=now;
 const remaining=active.goal-el.scrollTop;
 if(Math.abs(remaining)<1){el.scrollTop=active.goal;stop();return;}
 el.scrollTop+=remaining*(1-Math.exp(-dt/70));
 frame=requestAnimationFrame(tick);
}
document.addEventListener('wheel',e=>{
 if(e.defaultPrevented||!e.cancelable||reduced.matches||e.ctrlKey||e.metaKey||e.shiftKey||!e.deltaY||Math.abs(e.deltaX)>0.5*Math.abs(e.deltaY))return;
 const origin=e.target instanceof Element?e.target:null;
 if(!origin||origin.closest('input,textarea,select,[contenteditable],canvas,iframe,[role="slider"],[role="spinbutton"],.sv-doc-recent-grid,.sv-doc-folders-grid'))return;
 const el=origin.closest(targets);
 if(!el||el.closest('[hidden]')||origin.closest('dialog[open]')!==el.closest('dialog[open]'))return;
 // Do not guess a continuous trackpad gesture: only line/page events or
 // conventional discrete 100/120-pixel wheel steps get animation.
 const n=Math.abs(e.deltaY);
 const discrete=e.deltaMode!==0||[100,120].some(k=>n>=k&&Math.abs(n/k-Math.round(n/k))<.001);
 if(!discrete){stop();return;}
 for(let node=origin;node&&node!==el;node=node.parentElement){
  const s=getComputedStyle(node);
  if((/(auto|scroll|overlay)/.test(s.overflowY)&&node.scrollHeight>node.clientHeight+2)||
     (/(auto|scroll|overlay)/.test(s.overflowX)&&node.scrollWidth>node.clientWidth+2))return;
 }
 const style=getComputedStyle(el);
 if(!/(auto|scroll|overlay)/.test(style.overflowY)||(style.scrollSnapType&&style.scrollSnapType!=='none'))return;
 const max=el.scrollHeight-el.clientHeight;
 if(max<2)return;
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?el.clientHeight:1);
 const step=Math.sign(delta)*Math.min(Math.abs(delta),Math.max(48,Math.min(160,el.clientHeight*.28)));
 if((step<0&&el.scrollTop<=0)||(step>0&&el.scrollTop>=max-1)){stop();return;}
 e.preventDefault();
 const now=performance.now();
 if(!active||active.el!==el){stop();active={el,goal:el.scrollTop,last:now};}
 if(Math.sign(active.goal-el.scrollTop)!==Math.sign(step))active.goal=el.scrollTop;
 active.goal=Math.max(0,Math.min(max,el.scrollTop+Math.sign(step)*Math.min(el.clientHeight*.7,Math.abs(active.goal-el.scrollTop)+Math.abs(step))));
 if(!frame)frame=requestAnimationFrame(tick);
},{passive:false});
 for(const type of ['pointerdown','touchstart','keydown','pagehide'])window.addEventListener(type,stop,{passive:true,capture:true});
})();
