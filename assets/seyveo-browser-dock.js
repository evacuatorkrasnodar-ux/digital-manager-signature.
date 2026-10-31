/* SEYVEO Browser · reuse the original dock, as Music does. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock');
 const outer=['navHome','navTasks','navPicture','navManage'].map(id=>document.getElementById(id));
 if(!dock||outer.some(x=>!x)||window.SEYVEO_BROWSER_DOCK)return;
 const icons={
 back:'<path d="m15 5-7 7 7 7"/>',
 forward:'<path d="m9 5 7 7-7 7"/>',
 home:'<path d="m3.5 11 8.5-7 8.5 7V20H14v-6h-4v6H3.5z"/>',
 tabs:'<rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 16H3a1 1 0 0 1-1-1V4a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v1"/>'
 };
 let active=false;
 function setButton(b,action,label){
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+icons[action]+'</svg><span>'+label+'</span>';
  b.dataset.svBrowserAction=action;
  b.removeAttribute('aria-current');b.classList.remove('active','sv-nav-feedback');
  b.setAttribute('aria-label',label);b.title=label;
 }
 function draw(){
  if(!active)return;
  setButton(outer[0],'back','Назад');
  setButton(outer[1],'forward','Вперёд');
  setButton(outer[2],'home','Старт');
  setButton(outer[3],'tabs','Вкладки');
  const s=window.SEYVEO_BROWSER?.state?.();
  outer[0].setAttribute('aria-disabled',String(!s?.canBack));
  outer[1].setAttribute('aria-disabled',String(!s?.canForward));
  dock.setAttribute('aria-label','SEYVEO Browser · навигация, Сэйви и вкладки');
 }
 function syncHeight(){document.body.style.setProperty('--seyveo-browser-dock-height',Math.ceil(dock.getBoundingClientRect().height)+'px')}
 function enter(){
  syncHeight();
  if(active){draw();return}
  active=true;dock.classList.add('seyveo-browser-dock');draw();
 }
 function leave(){
  if(!active)return;
  active=false;dock.classList.remove('seyveo-browser-dock');document.body.style.removeProperty('--seyveo-browser-dock-height');
  for(const b of outer){delete b.dataset.svBrowserAction;delete b.dataset.svFixedAction;b.removeAttribute('aria-disabled')}
  document.dispatchEvent(new Event('seyveo:browser-dock-exit'));
  window.SEYVEO_MAGNETIC_INK?.refresh?.();
 }
 function refresh(){if(window.SEYVEO_BROWSER?.state?.().open)enter();else leave()}
 // Capture actions at the actual dock, so standard route navigation doesn't fire.
 dock.addEventListener('click',event=>{
  if(!active)return;
  const b=event.target.closest?.('button[data-sv-browser-action]');
  if(!b||!outer.includes(b))return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  const action=b.dataset.svBrowserAction;
  if((action==='back'||action==='forward')&&b.getAttribute('aria-disabled')==='true')return;
  window.SEYVEO_BROWSER?.[action]?.();
 },true);
 window.addEventListener('resize',()=>{if(active)syncHeight()});
 document.addEventListener('seyveo:browser-open',refresh);
 document.addEventListener('seyveo:browser-close',refresh);
 document.addEventListener('seyveo:browser-state',()=>{if(active)draw()});
 window.SEYVEO_BROWSER_DOCK=Object.freeze({refresh,isActive:()=>active});
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();