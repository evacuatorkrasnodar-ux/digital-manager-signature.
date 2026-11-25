/* Gesture handling is opt-in and calls the original close handler.
   A drag never starts on a button, editor, calendar or scrollable content. */
(()=>{
'use strict';
function attach(handle,onUp,onDown){
 if(!handle)return;
 let start=null;
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.target.closest('button,a,input,textarea,select,[contenteditable]'))return;
  start={id:e.pointerId,x:e.clientX,y:e.clientY};handle.setPointerCapture?.(e.pointerId);
 });
 handle.addEventListener('pointerup',e=>{
  if(!start||e.pointerId!==start.id)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
  if(Math.abs(dy)<48||Math.abs(dy)<Math.abs(dx)*1.4)return;
  if(dy<0)onUp();else onDown();
 });
 handle.addEventListener('pointercancel',()=>{start=null;});
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