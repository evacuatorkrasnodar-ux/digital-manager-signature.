/* Gesture handling is opt-in and calls the original close handler.
   A drag never starts on a button, editor, calendar or scrollable content. */
(()=>{
'use strict';
const attached=new WeakSet();
function attach(handle,onUp,onDown){
 if(!handle||attached.has(handle))return;
 attached.add(handle);
 let start=null;
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.isPrimary===false||e.target.closest('button,a,input,textarea,select,label,[contenteditable],[role="button"]'))return;
  start={id:e.pointerId,x:e.clientX,y:e.clientY};try{handle.setPointerCapture?.(e.pointerId);}catch{}
 });
 handle.addEventListener('pointerup',e=>{
  if(!start||e.pointerId!==start.id)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
  if(Math.abs(dy)<48||Math.abs(dy)<Math.abs(dx)*1.4)return;
  if(dy<0)onUp?.();else onDown?.();
 });
 const reset=e=>{if(start?.id===e.pointerId)start=null;};
 handle.addEventListener('pointercancel',reset);
 handle.addEventListener('lostpointercapture',reset);
}
function init(){
 const note=document.getElementById('noteReadDialog'),head=note?.querySelector('.sv-note-reader-header');
 if(!head||head.querySelector('.sv-note-reader-grip'))return;
 const grip=document.createElement('div');grip.className='sv-note-reader-grip';grip.setAttribute('aria-hidden','true');head.prepend(grip);
 attach(head,()=>note.classList.add('sv-note-expanded'),()=>{
  if(note.classList.contains('sv-note-expanded'))note.classList.remove('sv-note-expanded');
  else document.getElementById('noteReadBack')?.click();
 });
 note.addEventListener('close',()=>note.classList.remove('sv-note-expanded'));
}
window.SEYVEO_SHEET_NAVIGATION=Object.freeze({attach});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();