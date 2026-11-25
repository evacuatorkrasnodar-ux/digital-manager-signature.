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
  noteModeText:'<path d="M7 3.5h6.5L18 8v10.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path d="M13.5 3.5V7a1 1 0 0 0 1 1H18" opacity=".7"/><path d="M8 10.5h7M8 13.5h7M8 16.5h4.5" opacity=".75"/><path d="M8 5.5h2.5" opacity=".45"/>',
  noteModeScan:'<path d="M8 3.5H6A2.5 2.5 0 0 0 3.5 6v2M16 3.5h2A2.5 2.5 0 0 1 20.5 6v2M20.5 16v2a2.5 2.5 0 0 1-2.5 2.5h-2M8 20.5H6A2.5 2.5 0 0 1 3.5 18v-2"/><rect x="8" y="6.5" width="8" height="11" rx="1.3" opacity=".55"/><path d="M6 12h12"/>',
  noteModeDraw:'<path d="M12 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H18a2 2 0 0 0 2-2V15" opacity=".8"/><path d="m10 16.8 1.2-4 7-7a1.7 1.7 0 0 1 2.4 2.4l-7 7Z" fill="currentColor" fill-opacity=".08"/><path d="m17 7 2.4 2.4" opacity=".65"/><path d="M7.5 17.5c-1.8-2.4-.3-5.3 1.7-4.5" opacity=".55"/>'
 };
 for(const [id,paths] of Object.entries(icons)){
  const host=document.getElementById(id)?.querySelector('.paper-choice-icon');
  if(host)host.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
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
