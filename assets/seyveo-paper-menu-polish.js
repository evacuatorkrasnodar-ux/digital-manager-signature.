/* SEYVEO Paper · one coherent menu system.
   This script only reorders existing controls and folds the manual gradient.
   Drawing, OCR, undo and saving handlers remain owned by their modules. */
(()=>{
 'use strict';
 const dialog=document.getElementById('notePaperDialog');
 if(!dialog)return;

 const menu=document.getElementById('notePaperSettingsMenu');
 if(menu&&!menu.querySelector('.sv-polish-menu-heading')){
  const heading=document.createElement('div');
  heading.className='sv-polish-menu-heading';
  heading.textContent='Настройки';
  menu.prepend(heading);
  const labels=[...menu.querySelectorAll('.sv-newdock-menu-title')];
  if(labels[0])labels[0].textContent='Фон листа';
  if(labels[1])labels[1].textContent='Инструмент';
  if(labels[2])labels[2].textContent='Действия';
  // Move real nodes, keeping every registered event listener and undo action.
  for(const id of ['notePaperAddPhoto','notePaperRemovePhoto',
    'notePaperRecognizeOpen','notePaperDuplicate','notePaperRedo']){
   const item=document.getElementById(id);
   if(item&&menu.contains(item))menu.append(item);
  }
  const lasso=menu.querySelector('[data-paper-tool="lasso"]');
  const clear=document.getElementById('notePaperClearSheet');
  // Selection belongs next to recognition, above history and destructive reset.
  if(lasso&&menu.contains(lasso)){
   const duplicate=document.getElementById('notePaperDuplicate');
   if(duplicate&&menu.contains(duplicate))menu.insertBefore(lasso,duplicate);
   else if(clear)menu.insertBefore(lasso,clear);
  }
  if(clear)menu.append(clear);
 }

 const colorMenu=document.getElementById('notePaperColorMenu');
 const editor=colorMenu?.querySelector('.sv-gradient-manual');
 if(editor&&!editor.closest('details')){
  const section=editor.previousElementSibling;
  const custom=document.createElement('details');
  custom.className='sv-gradient-custom';
  const summary=document.createElement('summary');
  summary.textContent='Свой градиент';
  custom.append(summary);
  if(section?.classList.contains('sv-gradient-section-caption'))section.replaceWith(custom);
  else editor.before(custom);
  custom.append(editor);
  // Every fresh opening starts compact, leaving the presets immediately visible.
  document.getElementById('notePaperColorTrigger')?.addEventListener('click',event=>{
   if(event.currentTarget.getAttribute('aria-expanded')==='true')custom.open=false;
  });
 }
})();