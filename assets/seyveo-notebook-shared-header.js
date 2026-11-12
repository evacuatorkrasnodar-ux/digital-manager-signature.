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
  if(!dialog)return;
  // The segmented control is in index.html so it is visible even if
  // optional UI initialization fails. JS only supplies its real routing.
  const nav=dialog.querySelector(':scope > #svNotebookWorkTabs');
  if(nav&&!nav.dataset.svNotebookWired){
   nav.dataset.svNotebookWired='true';
   nav.addEventListener('click',event=>{
    const button=event.target.closest('button[data-sv-work-tab]');
    if(!button||!nav.contains(button)||!dialog.open)return;
    const target=button.dataset.svWorkTab;
    if(target==='notes')return;
    // Route in the same event turn as closing the Notebook. A delayed
    // requestAnimationFrame briefly exposed the previous Work page, causing
    // the header and bottom dock to visibly jump on every tab switch.
    const workTabs=document.getElementById('svWorkTabs');
    const existing=workTabs?.querySelector('[data-sv-work-tab="'+target+'"]');
    // Update the covered Work page before revealing it. Closing the modal
    // first exposed the previous tab during Safari's focus restoration.
    if(existing&&!existing.hidden&&!workTabs.hidden){
     existing.click();
    }else if(target==='personal'){
     if(typeof window.SEYVEO_UNIFIED_TASKS?.openPersonal==='function')
      window.SEYVEO_UNIFIED_TASKS.openPersonal();
     else location.hash='#tasks';
    }else if(target==='calendar')location.hash='#calendar';
    else if(target==='business'){
     if(typeof window.SEYVEO_UNIFIED_TASKS?.openBusiness==='function')
      window.SEYVEO_UNIFIED_TASKS.openBusiness('preserve');
     else location.hash='#tasks';
    }
    dialog.close();
    if(existing&&!existing.hidden)existing.focus({preventScroll:true});
   });
  }
  if(!factory?.create||!legacyBack)return;
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
   if(dialog.open)window.SEYVEO_NOTE_LAUNCH?.launch?.('noteModeText');
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
