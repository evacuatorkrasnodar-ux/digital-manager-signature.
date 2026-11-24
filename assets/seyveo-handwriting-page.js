/* Handwriting is a mode of the unified Notebook. Unsupported old art-like
   sheets keep their original editor rather than dropping vector content. */
(()=>{
 'use strict';
 if(window.SEYVEO_HANDWRITING)return;
 function open(note=null){
  const api=window.SEYVEO_NOTES_API,ink=window.SEYVEO_SMART_NOTE_INK;
  if(note){
   const p=note.paper;
   const compatible=!p||(!p.photo&&!(p.texts||[]).length&&['blank','lines','grid'].includes(p.pattern)&&
    Array.isArray(p.strokes)&&p.strokes.every(s=>['pen','eraser'].includes(s.tool)&&!s.gradient&&!s.pressureSensitive&&Number(s.width)<=70&&Array.isArray(s.points)&&s.points.length<=1200));
   if(compatible&&api?.editSavedNote&&ink?.open){
    api.editSavedNote(note.id);ink.open();return true;
   }
   if(p&&window.SEYVEO_PAPER?.open){window.SEYVEO_PAPER.open(note);return true;}
  }else if(api?.reviewText&&ink?.open){api.reviewText('');ink.open();return true;}
  api?.openNotes?.();api?.message?.('Редактор не загрузился. Обновите страницу.');return false;
 }
 window.SEYVEO_HANDWRITING=Object.freeze({open});
})();
