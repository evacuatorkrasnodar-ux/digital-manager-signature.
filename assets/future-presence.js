/* SEYVEO Future presence: lightweight presentation, no fake AI.
 * Does not write storage, use microphone, make network requests or navigate. */
(()=>{
'use strict';
const root=document.documentElement;
// iOS standalone uses one app scroll frame on ALL workspaces; Safari stays native.
// This flag is independent of which tab is currently visible.
const standalone=Boolean(window.matchMedia?.('(display-mode: standalone)').matches
 || window.navigator?.standalone===true);
root.classList.toggle('seyveo-standalone',standalone);
const list=[
 ['calendar','calendarPage','.calendar-header'],
 ['picture','picturePage','.picture-head'],
 ['tasks','tasksPage','.tasks-heading'],
 ['life','lifePage','.life-heading'],
 ['manage','managePage','.manage-heading'],
 ['home','homePage',null]
];
let current='',animation=null;
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
function sync(){
 const active=list.find(([,id])=>{const page=document.getElementById(id);return page&&!page.hidden});
 const name=active?.[0]||'home';
 root.dataset.seyveoView=name;
 if(name===current)return;
 current=name;
 // One installed-PWA scroll container for EVERY workspace. Route changes
 // reset its content position, never the shared fixed dock or a live chat.
 if(standalone&&!root.classList.contains('seyveo-conversation')){
  const app=document.querySelector('.app');
  if(app)app.scrollTop=0;
 }
 animation?.cancel?.();animation=null;
 if(!active?.[2]||reduced?.matches||document.hidden)return;
 const heading=document.querySelector('#'+active[1]+' '+active[2]);
 if(!heading?.animate)return;
 animation=heading.animate([
  {opacity:.68,transform:'translate3d(0,5px,0)'},
  {opacity:1,transform:'translate3d(0,0,0)'}
 ],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});
}
const states={
 listening:'listening',thinking:'thinking',speaking:'speaking',
 'listening-end':'idle',text:'idle',end:'idle',ack:'idle',stop:'idle'
};
root.dataset.seyveoPresence='idle';
document.addEventListener('seyveo:assistant-presence',event=>{
 const phase=event.detail?.phase;
 if(Object.prototype.hasOwnProperty.call(states,phase)){
  root.dataset.seyveoPresence=states[phase];
 }
});
// A Home navigation may use history.pushState (no hashchange event).
// Observe the actual workspace visibility so view changes always stay in sync.
const pages=list.map(([,id])=>document.getElementById(id)).filter(Boolean);
const observer=new MutationObserver(()=>queueMicrotask(sync));
for(const page of pages)observer.observe(page,{attributes:true,attributeFilter:['hidden']});

/* Acknowledgement only after a successful local save; never fake progress. */
const confirmationTargets={
 calendar:{page:'calendarPage',main:'calendarAgenda',fallback:'calendarDeadlineList'},
 tasks:{page:'tasksPage',main:'personalTaskList'}
};
let confirmSurface=null,confirmTimer=0;
function clearConfirmation(){
 if(confirmTimer){clearTimeout(confirmTimer);confirmTimer=0;}
 if(confirmSurface){confirmSurface.classList.remove('seyveo-future-ack');confirmSurface=null;}
}
window.addEventListener('seyveo:future-committed',event=>{
 const info=confirmationTargets[event.detail?.area];
 if(!info||document.hidden)return;
 const page=document.getElementById(info.page);
 if(!page||page.hidden)return;
 const normal=document.getElementById(info.main);
 const surface=normal?.getClientRects().length?normal:
  info.fallback?document.getElementById(info.fallback):null;
 if(!surface?.getClientRects().length)return;
 clearConfirmation();
 if(reduced?.matches)return;
 confirmSurface=surface;
 surface.classList.add('seyveo-future-ack');
 confirmTimer=window.setTimeout(clearConfirmation,1050);
});
window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
window.addEventListener('pageshow',sync);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){animation?.cancel?.();animation=null;clearConfirmation();root.dataset.seyveoPresence='idle'}
 else sync();
});
queueMicrotask(sync);
})();
