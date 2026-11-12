/* SEYVEO Notebook · genuine Work header, not a visual imitation.
 * Reuse Work Shadow DOM, preserve the Notebook launcher and legacy back handler.
 * The original header is only hidden AFTER this component mounts successfully.
 */
(()=>{
 'use strict';
 function install(){
  const dialog=document.getElementById('notesDialog');
  const factory=window.SEYVEO_WORK_HEADER;
  const launcher=window.SEYVEO_NOTE_LAUNCH;
  const legacyBack=dialog?.querySelector(':scope > button.seyveo-dialog-close');
  if(!dialog||!factory?.create||!legacyBack||!launcher?.launch)return;
  if(dialog.querySelector('#svNotebookSharedHeader'))return;
  const {host,back,title,add}=factory.create();
  host.id='svNotebookSharedHeader';
  title.textContent='Блокнот';
  back.setAttribute('aria-label','Вернуться из блокнота');
  add.setAttribute('aria-label','Создать текстовую заметку');
  add.setAttribute('title','Новая текстовая заметка');
  back.addEventListener('click',()=>legacyBack.click());
  // The existing three tiles still offer text, drawing and photo-to-text.
  // Plus uses the SAME validated text-note launcher, never a second editor.
  add.addEventListener('click',()=>{
   if(dialog.open)launcher.launch('noteModeText');
  });
  dialog.insertBefore(host,dialog.firstChild);
  const updateTheme=()=>{
   host.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  };
  updateTheme();
  new MutationObserver(updateTheme).observe(document.documentElement,{
   attributes:true,attributeFilter:['data-theme']
  });
  dialog.setAttribute('aria-label','Блокнот');
  dialog.dataset.svSharedHeader='true';
 }
 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',install,{once:true});
 }else install();
})();
