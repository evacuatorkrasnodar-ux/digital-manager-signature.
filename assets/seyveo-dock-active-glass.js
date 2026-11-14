/* Move one inset highlight across the real dock. Do not alter navigation. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock.sv-shared-dock');
 if(!dock||window.SEYVEO_DOCK_ACTIVE_GLASS)return;
 const tabs=[
  {id:'navHome',accent:'home'},
  {id:'navTasks',accent:'tasks'},
  {id:'navPicture',accent:'world'},
  {id:'assistantButton',accent:'sayvi'}
 ].map(tab=>({...tab,element:document.getElementById(tab.id)}));
 const indicator=document.createElement('span');
 indicator.className='sv-dock-active-indicator';
 indicator.setAttribute('aria-hidden','true');
 dock.appendChild(indicator);
 let press=null,queued=false,releaseTimer=0;
 function normal(){
  return document.documentElement.dataset.theme==='light'&&
   !dock.matches('.seyveo-music-dock,.seyveo-browser-dock')&&
   !document.documentElement.classList.contains('seyveo-conversation')&&
   dock.closest('dialog')?.dataset.space!=='health';
 }
 function selected(){
  return tabs.slice(0,3).find(tab=>tab.element?.classList.contains('active')&&!tab.element.hidden);
 }
 function draw(tab){
  if(!tab?.element)return false;
  const r=tab.element.getBoundingClientRect(),outer=dock.getBoundingClientRect();
  if(r.width<20||r.height<20||outer.width<100)return false;
  const width=Math.max(38,Math.min(r.width-4,82));
  const x=r.left-outer.left+(r.width-width)/2;
  indicator.style.setProperty('--sv-indicator-width',`${width.toFixed(2)}px`);
  indicator.style.setProperty('--sv-indicator-x',`${x.toFixed(2)}px`);
  indicator.dataset.accent=tab.accent;
  return true;
 }
 function refresh(){
  queued=false;
  if(!normal()){
   dock.classList.remove('sv-dock-selection-ready','sv-dock-indicator-pressing');
   return;
  }
  dock.classList.toggle('sv-dock-selection-ready',draw(press||selected()));
 }
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(refresh);
 }
 function release(){
  clearTimeout(releaseTimer);
  releaseTimer=setTimeout(()=>{
   press?.element?.classList.remove('sv-dock-nav-press');
   press=null;
   dock.classList.remove('sv-dock-indicator-pressing');
   schedule();
  },80);
 }
 dock.addEventListener('pointerdown',event=>{
  if(!normal()||event.button!==0)return;
  const button=event.target.closest?.('button');
  const tab=tabs.find(item=>item.element===button);
  if(!tab)return;
  clearTimeout(releaseTimer);
  press?.element?.classList.remove('sv-dock-nav-press');
  press=tab;
  if(tab.id!=='assistantButton')tab.element.classList.add('sv-dock-nav-press');
  dock.classList.add('sv-dock-indicator-pressing');
  schedule();
 },{passive:true});
 dock.addEventListener('pointerup',release,{passive:true});
 dock.addEventListener('pointercancel',release,{passive:true});
 dock.addEventListener('pointerleave',()=>{if(press)release()},{passive:true});
 const changes=new MutationObserver(schedule);
 for(const tab of tabs)if(tab.element)changes.observe(tab.element,{
  attributes:true,attributeFilter:['class','hidden']
 });
 changes.observe(dock,{attributes:true,attributeFilter:['class']});
 if('ResizeObserver'in window){
  const resize=new ResizeObserver(schedule);
  resize.observe(dock);
  tabs.forEach(tab=>{if(tab.element)resize.observe(tab.element)});
 }
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('hashchange',schedule);
 window.addEventListener('seyveo:route-changed',schedule);
 document.addEventListener('seyveo:browser-dock-exit',schedule);
 document.addEventListener('seyveo:music-dock-exit',schedule);
 window.SEYVEO_DOCK_ACTIVE_GLASS=Object.freeze({refresh:schedule});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
