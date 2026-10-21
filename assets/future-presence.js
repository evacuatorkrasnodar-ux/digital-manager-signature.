/* SEYVEO Future presence: lightweight presentation, no fake AI.
 * Does not write storage, use microphone, make network requests or navigate. */
(()=>{
'use strict';
const root=document.documentElement;
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
window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
window.addEventListener('pageshow',sync);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){animation?.cancel?.();animation=null;root.dataset.seyveoPresence='idle'}
 else sync();
});
queueMicrotask(sync);
})();
