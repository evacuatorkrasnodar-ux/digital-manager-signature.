/* SEYVEO Management · live, read-only preview of the discreet mode.
   No new data access or protection claims: the preview explains behavior
   but does not reveal private content or enable any connection. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const toggle=$('seyveoDiscreetToggle'),preview=$('manageDiscreetPreview');
const state=$('manageDiscreetPreviewMode'),reply=$('manageDiscreetPreviewReply');
if(!toggle||!preview||!state||!reply)return;
function paint(){
 const privateMode=toggle.getAttribute('aria-pressed')==='true';
 preview.dataset.previewMode=privateMode?'quiet':'normal';
 state.textContent=privateMode?'Рядом люди · включено':'Обычный режим';
 reply.textContent=privateMode
  ?'Отвечу без озвучивания. Информация останется на экране.'
  :'Ответ появится на экране. Если включён голосовой ответ, он может прозвучать.';
}
paint();
// The real setting owns the state; only mirror it after the real handler runs.
toggle.addEventListener('click',()=>requestAnimationFrame(paint));
window.addEventListener('storage',event=>{
 if(event.key==='seyveo-discreet-mode-v1')requestAnimationFrame(paint);
});
})();