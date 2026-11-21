/* SEYVEO Paper · compact contextual actions (November 2026).
   Preserve original handlers and do not clone any editing control. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const panel=document.querySelector('#notePaperSettingsMenu [data-sv-menu-panel="actions"]');
 if(!dialog||!panel)return;

 // Drawing relies on the existing native color palette. Keep the older
 // custom gradient trigger wired for legacy callers, but never show it as
 // an additional visible control.
 const gradient=document.getElementById('notePaperColorTrigger');
 if(gradient){
  gradient.dataset.svRetired='true';gradient.hidden=true;
  gradient.style.setProperty('display','none','important');
 }

 // This is the complete everyday Drawing menu, ordered by actual workflow.
 // The original nodes keep all of their listeners and tool state.
 const actions=[
  document.getElementById('notePaperTextAction'),
  document.getElementById('notePaperAddPhoto'),
  panel.querySelector('[data-paper-tool="lasso"]')||
   document.querySelector('#notePaperSettingsMenu [data-paper-tool="lasso"]'),
  document.getElementById('notePaperClearSheet')
 ].filter(Boolean);
 for(const node of actions)panel.append(node);

 // The recognition engine remains callable from Sayvi; the standard Notebook
 // already has handwriting OCR with preview and explicit Apply.
 // Copying is contextual to a selected region, not an always-visible row.
 // Smoothing is exposed by the single Sayvi control at the top.
 // Leave its executable node available for Sayvi's explicit action routing.
 for(const id of ['notePaperSmoothInk','notePaperRecognizeOpen','notePaperDuplicate','notePaperRedo']){
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

 // The undo icon also supports Redo by a deliberate hold (touch/pen) or
 // Shift+click (desktop). A short tap retains the original undo listener.
 const undo=document.getElementById('notePaperUndo');
 const engine=window.SEYVEO_PAPER;
 if(undo&&engine?.redo){
  undo.setAttribute('aria-label','Отменить; удержать для повтора действия');
  undo.title='Отменить · удержать для повтора';
  let timer=null,held=false;
  const clear=()=>{if(timer!==null){clearTimeout(timer);timer=null}};
  const redo=()=>{
   if(!dialog.open||!engine.canRedo?.())return;
   engine.redo();
  };
  undo.addEventListener('pointerdown',event=>{
   clear();held=false;
   if(event.button!==0||!dialog.open)return;
   timer=setTimeout(()=>{timer=null;held=true;redo()},520);
  },{passive:true});
  for(const name of ['pointerup','pointercancel','pointerleave'])
   undo.addEventListener(name,clear,{passive:true});
  undo.addEventListener('click',event=>{
   if(!held&&!event.shiftKey)return;
   event.preventDefault();event.stopImmediatePropagation();
   if(event.shiftKey&&!held)redo();
   held=false;
  },true);
  undo.addEventListener('contextmenu',event=>{
   event.preventDefault();clear();
   if(!held)redo();
   held=false;
  });
  dialog.addEventListener('close',()=>{clear();held=false});
 }
})();
