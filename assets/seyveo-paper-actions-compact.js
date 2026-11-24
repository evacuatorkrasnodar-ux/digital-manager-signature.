/* SEYVEO Paper · compact contextual actions (November 2026).
   Preserve original handlers and do not clone any editing control. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const panel=document.querySelector('#notePaperSettingsMenu [data-sv-menu-panel="actions"]');
 if(!dialog||!panel)return;

 // Keep the original gradient command visible in Settings, not in the bottom row.
 const gradient=document.getElementById('notePaperColorTrigger');
 if(gradient){
  delete gradient.dataset.svRetired;gradient.hidden=false;
  gradient.style.removeProperty('display');
  gradient.classList.add('sv-newdock-menu-action');
  gradient.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M7 17 17 7M7 12l5-5M12 17l5-5"/></svg><span>Градиенты</span>';
 }
 // This is the complete everyday Drawing menu, ordered by actual workflow.
 // The original nodes keep all of their listeners and tool state.
 const actions=[
  document.getElementById('notePaperTextAction'),
  document.getElementById('notePaperAddPhoto'),
  panel.querySelector('[data-paper-tool="lasso"]')||
   document.querySelector('#notePaperSettingsMenu [data-paper-tool="lasso"]'),
  gradient,
  document.getElementById('notePaperClearSheet')
 ].filter(Boolean);
 for(const node of actions)panel.append(node);

 // The recognition engine remains callable from Sayvi; the standard Notebook
 // already has handwriting OCR with preview and explicit Apply.
 // Copying is contextual to a selected region, not an always-visible row.
 // Smoothing is exposed by the single Sayvi control at the top.
 // Leave its executable node available for Sayvi's explicit action routing.
 for(const id of ['notePaperSmoothInk','notePaperRecognizeOpen','notePaperDuplicate']){
  const node=document.getElementById(id);
  if(!node)continue;
  node.dataset.svRetired='true';node.hidden=true;
  node.style.setProperty('display','none','important');
 }
 const removePhoto=document.getElementById('notePaperRemovePhoto');
 if(removePhoto){
  // A photo-only command should not occupy the normal paint actions.
  removePhoto.dataset.svRetired='true';removePhoto.hidden=true;
  removePhoto.style.setProperty('display','none','important');
 }

 // Separate buttons are clearer and avoid a long-press collision on iPhone.
 // The existing Undo and Redo controls have their own live click handlers.
 const undo=document.getElementById('notePaperUndo');
 if(undo){
  undo.setAttribute('aria-label','Отменить последнее действие');
  undo.title='Отменить';
 }
})();
