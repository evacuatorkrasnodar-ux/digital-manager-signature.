/* SEYVEO Notebook launcher — three direct actions, independent of Work shell.
 * Owns only the three creation tiles. No storage changes or layout changes. */
(()=>{
 'use strict';
 if(window.SEYVEO_NOTE_LAUNCH)return;
 const tiles=document.getElementById('svNotebookCreateTiles');
 const notebook=document.getElementById('notesDialog');
 const status=document.getElementById('notesStatus');
 if(!tiles||!notebook)return;
 const destinations={
  noteModeText:{label:'Текст',run:()=>window.SEYVEO_NOTES_API?.reviewText?.('')},
  noteModePaper:{label:'От руки',run:()=>window.SEYVEO_PAPER?.open?.()},
  noteModeScan:{label:'Фото → текст',run:()=>window.SEYVEO_NOTE_SCANNER?.open?.()}
 };
 function report(message){
  if(status){status.textContent=message;status.hidden=false;}
  console.warn('SEYVEO Notebook:',message);
 }
 function launch(id){
  const route=destinations[id];if(!route)return;
  const ready=id==='noteModeText'
   ?typeof window.SEYVEO_NOTES_API?.reviewText==='function'
   :id==='noteModePaper'
    ?typeof window.SEYVEO_PAPER?.open==='function'
    :typeof window.SEYVEO_NOTE_SCANNER?.open==='function';
  if(!ready){
   report('Редактор «'+route.label+'» не загрузился. Обновите страницу и повторите действие.');
   return;
  }
  if(status){status.hidden=true;status.textContent='';}
  // Closing the parent modal first is essential for Safari's top layer.
  if(notebook.open)notebook.close();
  // Use one frame for the modal handoff, avoiding simultaneous dialogs.
  requestAnimationFrame(()=>{
   try{
    route.run();
    const dest=id==='noteModeText'?'noteReviewDialog':id==='noteModePaper'?'notePaperDialog':'noteScanDialog';
    if(!document.getElementById(dest)?.open){
     report('Не удалось открыть «'+route.label+'». Попробуйте ещё раз.');
     if(!notebook.open)window.SEYVEO_NOTES_API?.openNotes?.();
    }
   }catch(error){
    report('Не удалось открыть «'+route.label+'». '+(error?.message||''));
    if(!notebook.open)window.SEYVEO_NOTES_API?.openNotes?.();
   }
  });
 }
 // Capture before the legacy bubble listeners; no duplicate modal launches.
 document.addEventListener('click',event=>{
  const tile=event.target?.closest?.('#svNotebookCreateTiles > button');
  if(!tile||!notebook.open||!Object.hasOwn(destinations,tile.id))return;
  event.preventDefault();event.stopImmediatePropagation();
  launch(tile.id);
 },true);
 window.SEYVEO_NOTE_LAUNCH=Object.freeze({version:1,launch});
})();
