/* SEYVEO · handwriting entry point. Reuse the approved editors.
 * Existing vector paper notes retain their original IDs and strokes.
 * New handwriting starts in the unified smart notebook, not a second dialog. */
(()=>{
 'use strict';
 if(window.SEYVEO_HANDWRITING)return;
 function open(note=null){
  const api=window.SEYVEO_NOTES_API;
  if(note){
   if(note.noteKind!=='handwriting'||!note.paper)return false;
   if(typeof window.SEYVEO_PAPER?.open==='function'){
    window.SEYVEO_PAPER.open(note);
    return true;
   }
  }else if(typeof api?.reviewText==='function'&&typeof window.SEYVEO_SMART_NOTE_INK?.open==='function'){
   api.reviewText('');
   window.SEYVEO_SMART_NOTE_INK.open();
   return true;
  }
  api?.openNotes?.();
  api?.message?.('Редактор не загрузился. Обновите страницу.');
  return false;
 }
 window.SEYVEO_HANDWRITING=Object.freeze({open});
})();
