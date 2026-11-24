/* SEYVEO Notebook launcher — one Smart Note, camera OCR and art tablet.
 * Legacy handwriting remains accessible from already saved note records. */
(()=>{
 'use strict';
 if(window.SEYVEO_NOTE_LAUNCH)return;
 const tiles=document.getElementById('svNotebookCreateTiles');
 const notebook=document.getElementById('notesDialog');
 const status=document.getElementById('notesStatus');
 if(!tiles||!notebook)return;
 // The fourth tile joins the existing three; the Work shell can move the
 // entire group without having to duplicate its markup or event handlers.
 if(!document.getElementById('noteModeDraw')){
  const draw=document.createElement('button');
  draw.id='noteModeDraw';draw.className='paper-choice-item';draw.type='button';
  draw.innerHTML='<span class="paper-choice-icon" aria-hidden="true"><svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M32 5v7"/><rect x="12.5" y="12" width="39" height="35" rx="3.2"/><circle cx="40.2" cy="22.1" r="3.6"/><path d="m17.5 38 10.1-12.7 7.7 9.7 5.8-6.4 5.4 9.4"/><path d="M17.5 41.5c8-2.8 17.7 4.2 29-1.2" opacity=".55"/><path d="M10 49h44M24 49l-5 10M40 49l5 10"/></svg></span><span class="paper-choice-copy"><strong>Рисовать</strong><small>Холст и кисти</small></span>';
  tiles.append(draw);
 }
 const noteTile=document.getElementById('noteModeText');
 const legacyInkTile=document.getElementById('noteModePaper');
 noteTile?.querySelector('.paper-choice-copy strong')?.replaceChildren(document.createTextNode('Заметка'));
 noteTile?.querySelector('.paper-choice-copy small')?.replaceChildren(document.createTextNode('Текст и от руки'));
 // Distinguish an OCR scanner from the paperclip inside a note:
 // the former extracts text, while the latter adds a photo or a file.
 const scanTile=document.getElementById('noteModeScan');
 scanTile?.querySelector('.paper-choice-copy strong')?.replaceChildren(document.createTextNode('Сканировать'));
 scanTile?.querySelector('.paper-choice-copy small')?.replaceChildren(document.createTextNode('Фото → текст'));
 // Three creation tools share one 24px vector grid and stroke weight.
 const icons={
  noteModeText:'<path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h4M8 17l3-7 3 7M9 15h4"/>',
  noteModeScan:'<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3"/><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 14h6M9 11h6"/>',
  noteModeDraw:'<path d="M12 2v3M5 5h14a1 1 0 0 1 1 1v12H4V6a1 1 0 0 1 1-1ZM2 18h20M9 18l-2 4m8-4 2 4"/><circle cx="15.5" cy="9" r="1.3"/><path d="m6 15 4-4 3 3 2-2 3 3"/>'
 };
 for(const [id,paths] of Object.entries(icons)){
  const host=document.getElementById(id)?.querySelector('.paper-choice-icon');
  if(host)host.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
 }
 if(legacyInkTile)legacyInkTile.hidden=true;
 const destinations={
  noteModeText:{label:'Заметка',run:()=>window.SEYVEO_NOTES_API?.reviewText?.('')},
  noteModePaper:{label:'От руки',run:()=>window.SEYVEO_HANDWRITING?.open?.()},
  noteModeScan:{label:'Сканировать',run:()=>window.SEYVEO_NOTE_SCANNER?.open?.()},
  noteModeDraw:{label:'Рисовать',run:()=>window.SEYVEO_PAPER?.open?.()}
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
    ?typeof window.SEYVEO_HANDWRITING?.open==='function'
    :id==='noteModeDraw'
     ?typeof window.SEYVEO_PAPER?.open==='function'
     :typeof window.SEYVEO_NOTE_SCANNER?.open==='function';
  if(!ready){
   report('Редактор «'+route.label+'» не загрузился. Обновите страницу и повторите действие.');
   return;
  }
  if(status){status.hidden=true;status.textContent='';}
  // Close the list and open its editor in the SAME task. Waiting for
  // requestAnimationFrame painted one frame of the previous workspace,
  // which looked like a full-screen Notebook jump on iOS.
  if(notebook.open)notebook.close();
  try{
   route.run();
   const dest=id==='noteModeText'?'noteReviewDialog'
    :id==='noteModePaper'?'svHandwritingDialog'
    :id==='noteModeDraw'?'notePaperDialog':'noteScanDialog';
   if(!document.getElementById(dest)?.open){
    report('Не удалось открыть «'+route.label+'». Попробуйте ещё раз.');
    if(!notebook.open)window.SEYVEO_NOTES_API?.openNotes?.();
   }
  }catch(error){
   report('Не удалось открыть «'+route.label+'». '+(error?.message||''));
   if(!notebook.open)window.SEYVEO_NOTES_API?.openNotes?.();
  }
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
