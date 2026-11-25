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

/* Native scrolling: no document-wide wheel interception or scrollport masks.
   The floating dock itself supplies the glass material. */

/* Approved Avatar header: one measured glass surface for existing native
   scrollports, without moving controls, replacing handlers, or intercepting
   touch/wheel. Reuse the layout at rest; extend only the existing scrollport. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const light=()=>document.documentElement.dataset.theme==='light'&&!window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
 const number=value=>parseFloat(value)||0;
 const visible=el=>!!el&&!el.hidden&&el.getClientRects().length>0;
 const configs=[
  ['svWorkShell',root=>{
   const mode=root.dataset.active;
   if(!['notes','wallet','business'].includes(mode)||root.dataset.sharedWork!=='true')return null;
   const port=mode==='notes'?root.querySelector('#notesDialog[open] > #notesList.sv-note-clean-list:not(.is-empty)'):mode==='wallet'?root.querySelector('#seyveoPayDialog[open]'):root.querySelector('#unifiedBusinessTasksView:not([hidden])');
   const controls=[root.querySelector('seyveo-work-head'),$('svWorkTabs'),mode==='notes'?$('svNotebookCreateTiles'):mode==='wallet'?root.querySelector('.syp-view-switch'):null,mode==='notes'?$('svNotebookListTools'):null];
   return {port,controls};
  }],
  ['svcpWorkChatScreen',root=>{
   if(root.dataset.view!=='inbox'||root.classList.contains('svcp-history-screen-open'))return null;
   return {port:$('svcpConversationList'),controls:[root.querySelector('.svcp-work-chat-header'),$('svcpChatFilters'),$('svcpDirectorySearchBar')]};
  }],
  ['sayviSurfacePage',root=>{
   if(root.dataset.svSubject!=='contract'||root.dataset.svDocView!=='archive')return null;
   const sticky=root.querySelector('.sv-doc-pinned-switch');
   if(!sticky)return null;
   return {port:$('sayviSurfaceBody'),controls:[root.querySelector('.sv-deep-top'),sticky],sticky};
  }],
  ['svcpManagerPeople',root=>{
   if(!root.open)return null;
   const sticky=root.querySelector('.sv-staff-pinned-tabs');
   if(!sticky)return null;
   return {port:$('svcpManagerPeopleScroll'),controls:[root.querySelector('.sv-staff-head'),sticky],sticky};
  }]
 ];
 const mounted=new WeakSet();
 function mount(root,config){
  if(!root||mounted.has(root))return;
  mounted.add(root);
  const glass=document.createElement('span');
  glass.className='sv-full-header-material';glass.setAttribute('aria-hidden','true');root.prepend(glass);
  let frame=0,lastPort=null,lastControls=[],lastPass=[],lastSticky=null;
  const observed=new WeakSet();
  const resize=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
  function watch(el){if(el&&resize&&!observed.has(el)){observed.add(el);resize.observe(el)}}
  function clear(){
   root.classList.remove('sv-full-glass-ready','sv-full-glass-static-root');
   lastPort?.removeAttribute('data-sv-full-glass-port');
   lastSticky?.removeAttribute('data-sv-full-glass-sticky');
   lastControls.forEach(el=>el.removeAttribute('data-sv-full-glass-control'));
   lastPass.forEach(el=>el.removeAttribute('data-sv-full-glass-pass'));
   lastPort=null;lastControls=[];lastPass=[];lastSticky=null;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;measure()})}
  function measure(){
   const oldPort=lastPort,oldTop=oldPort?.scrollTop||0;
   clear();
   if(!light()||!visible(root))return;
   const target=config(root);
   const port=target?.port,sticky=target?.sticky;
   if(!port||!root.contains(port)||!visible(port))return;
   const style=getComputedStyle(port);
   if(!/^(auto|scroll|overlay)$/.test(style.overflowY)||port.clientHeight<=0)return;
   const controls=target.controls.filter(el=>visible(el)&&root.contains(el));
   if(!controls.length)return;
   const rect=root.getBoundingClientRect(),scroll=port.getBoundingClientRect();
   const overlap=Math.max(0,Math.round(scroll.top-rect.top));
   const pinnedTop=sticky?number(getComputedStyle(sticky).top):0;
   const bottom=Math.max(scroll.top,...controls.map(el=>el.getBoundingClientRect().bottom),sticky?scroll.top+pinnedTop+sticky.offsetHeight:0);
   if(bottom<=rect.top||overlap>rect.height*.8||bottom-rect.top>rect.height*.8)return;
   root.style.setProperty('--sv-full-glass-overlap',overlap+'px');
   root.style.setProperty('--sv-full-glass-margin',(number(style.marginTop)-overlap)+'px');
   root.style.setProperty('--sv-full-glass-padding',(number(style.paddingTop)+overlap)+'px');
   root.style.setProperty('--sv-full-glass-scroll-padding',(number(style.scrollPaddingTop)+overlap)+'px');
   root.style.setProperty('--sv-full-glass-height',Math.ceil(bottom-rect.top)+'px');
   root.style.setProperty('--sv-full-glass-sticky-top',(pinnedTop+overlap)+'px');
   if(getComputedStyle(root).position==='static')root.classList.add('sv-full-glass-static-root');
   port.setAttribute('data-sv-full-glass-port',sticky?'sticky':'plain');lastPort=port;
   for(let el=port.parentElement;el&&el!==root;el=el.parentElement){el.setAttribute('data-sv-full-glass-pass','');lastPass.push(el)}
   controls.forEach(el=>{el.setAttribute('data-sv-full-glass-control','');watch(el)});lastControls=controls;
   if(sticky){sticky.setAttribute('data-sv-full-glass-sticky','');lastSticky=sticky}
   root.classList.add('sv-full-glass-ready');
   if(oldPort===port&&port.scrollTop!==oldTop)port.scrollTop=oldTop;
  }
  watch(root);
  new MutationObserver(schedule).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','data-active','data-shared-work','data-view','data-sv-subject','data-sv-doc-view']});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('resize',schedule,{passive:true});
  const media=window.matchMedia('(prefers-reduced-transparency: reduce)');if(media.addEventListener)media.addEventListener('change',schedule);
  schedule();
 }
 function init(){configs.forEach(([id,config])=>mount($(id),config))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.addEventListener('load',init,{once:true});
})();
