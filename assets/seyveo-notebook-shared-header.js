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
  // The standalone Notebook belongs to the same four-section Work navigation.
  // Use a real segmented bar, not a screenshot or duplicate Work shell.
  const segments=[
   ['personal','Мои дела'],['calendar','Календарь'],
   ['notes','Блокнот'],['business','Кабинет']
  ];
  const nav=document.createElement('nav');
  nav.id='svNotebookWorkTabs';
  nav.setAttribute('aria-label','Разделы моих дел');
  for(const [id,label] of segments){
   const button=document.createElement('button');
   button.type='button';button.dataset.svWorkTab=id;
   button.textContent=label;
   button.setAttribute('aria-pressed',String(id==='notes'));
   if(id==='notes')button.setAttribute('aria-current','page');
   nav.append(button);
  }
  nav.addEventListener('click',event=>{
   const button=event.target.closest('button[data-sv-work-tab]');
   if(!button||!nav.contains(button)||!dialog.open)return;
   const target=button.dataset.svWorkTab;
   if(target==='notes')return;
   // Close the modal before moving into a route; otherwise its top layer
   // would cover the destination on Safari/iPhone.
   dialog.close();
   requestAnimationFrame(()=>{
    const workTabs=document.getElementById('svWorkTabs');
    const existing=workTabs?.querySelector('[data-sv-work-tab="'+target+'"]');
    if(existing&&!existing.hidden&&!workTabs.hidden){
     existing.click();return;
    }
    if(target==='personal'){
     if(typeof window.SEYVEO_UNIFIED_TASKS?.openPersonal==='function')
      window.SEYVEO_UNIFIED_TASKS.openPersonal();
     else location.hash='#tasks';
    }else if(target==='calendar'){
     location.hash='#calendar';
    }else if(target==='business'){
     if(typeof window.SEYVEO_UNIFIED_TASKS?.openBusiness==='function')
      window.SEYVEO_UNIFIED_TASKS.openBusiness('preserve');
     else location.hash='#tasks';
    }
   });
  });
  const tiles=dialog.querySelector('#svNotebookCreateTiles');
  if(tiles)dialog.insertBefore(nav,tiles);
  else dialog.append(nav);
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
