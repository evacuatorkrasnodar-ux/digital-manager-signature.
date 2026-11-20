/* SEYVEO Paper · compact contextual actions (November 2026).
   Preserve original handlers and do not clone any editing control. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 const panel=document.querySelector('#notePaperSettingsMenu [data-sv-menu-panel="actions"]');
 if(!dialog||!panel)return;

 // The gradient editor is still fully functional; only its former square
 // shortcut was removed from the bottom color rail.
 const gradient=document.getElementById('notePaperColorTrigger');
 if(gradient){
  gradient.classList.add('sv-newdock-menu-action');
  gradient.classList.remove('sv-newdock-gradient-action');
  gradient.setAttribute('aria-label','Градиенты кисти');
  gradient.title='Градиенты кисти';
  gradient.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M5.4 17.3 17.4 5.6M7.2 6.8l9.9 10M4 12h16"/></svg><span>Градиенты</span>';
 }

 // This is the complete everyday Drawing menu, ordered by actual workflow.
 // The original nodes keep all of their listeners and tool state.
 const actions=[
  gradient,
  document.getElementById('notePaperTextAction'),
  document.getElementById('notePaperAddPhoto'),
  document.getElementById('notePaperSmoothInk'),
  panel.querySelector('[data-paper-tool="lasso"]')||
   document.querySelector('#notePaperSettingsMenu [data-paper-tool="lasso"]'),
  document.getElementById('notePaperClearSheet')
 ].filter(Boolean);
 for(const node of actions)panel.append(node);

 // The recognition engine remains callable from Sayvi; the standard Notebook
 // already has handwriting OCR with preview and explicit Apply.
 // Copying is contextual to a selected region, not an always-visible row.
 for(const id of ['notePaperRecognizeOpen','notePaperDuplicate','notePaperRedo']){
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
