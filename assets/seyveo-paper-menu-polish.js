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

 // Related options belong in two compact, accessible views.
 // Move existing DOM controls; their original click/touch listeners survive.
 const buildSegments=(host,groups,initial)=>{
  if(!host||host.querySelector('.sv-polish-segments'))return null;
  const first=groups.flatMap(group=>group.nodes).find(Boolean);
  if(!first)return null;
  const tabs=document.createElement('div');
  tabs.className='sv-polish-segments';tabs.setAttribute('role','tablist');
  tabs.setAttribute('aria-label',host.getAttribute('aria-label')||'Разделы меню');
  const frames=document.createElement('div');frames.className='sv-polish-menu-frames';
  first.before(tabs,frames);
  const controls=[];
  groups.forEach((group,index)=>{
   const id=host.id+'-'+group.key;
   const button=document.createElement('button');
   button.type='button';button.className='sv-polish-segment';
   button.id=id+'-tab';button.setAttribute('role','tab');
   button.textContent=group.label;button.setAttribute('aria-controls',id+'-pane');
   button.setAttribute('aria-selected','false');button.tabIndex=-1;
   const pane=document.createElement('div');
   pane.id=id+'-pane';pane.className='sv-polish-menu-pane';
   pane.dataset.svMenuPanel=group.key;
   pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby',button.id);
   for(const node of group.nodes)if(node)pane.append(node);
   frames.append(pane);tabs.append(button);
   controls.push({key:group.key,button,pane});
   button.addEventListener('click',()=>activate(group.key));
   button.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    let next=index;
    if(event.key==='Home')next=0;
    else if(event.key==='End')next=controls.length-1;
    else next=(index+(event.key==='ArrowRight'?1:-1)+controls.length)%controls.length;
    const target=controls[next];activate(target.key);target.button.focus({preventScroll:true});
   });
  });
  function activate(key){
   controls.forEach(item=>{
    const current=item.key===key;
    item.button.setAttribute('aria-selected',String(current));
    item.button.tabIndex=current?0:-1;
    item.pane.hidden=!current;
   });
  }
  activate(initial);
  return {activate};
 };

 const paper=document.getElementById('notePaperPatternMenu');
 if(paper){
  const sections=[...paper.querySelectorAll('.sv-paper-menu-section')];
  const view=buildSegments(paper,[
   {key:'paper',label:'Бумага',nodes:sections.filter(s=>!s.classList.contains('sv-paper-menu-section-shapes'))},
   {key:'shapes',label:'Фигуры',nodes:sections.filter(s=>s.classList.contains('sv-paper-menu-section-shapes'))}
  ],'paper');
  document.getElementById('notePaperPatternTrigger')?.addEventListener('click',()=>{
   if(paper.hidden||!view)return;
   const shapes=['line','arrow','rect','circle','triangle','diamond'];
   const selected=paper.querySelector('[data-paper-tool][aria-pressed="true"]')?.dataset.paperTool;
   view.activate(shapes.includes(selected)?'shapes':'paper');
  });
 }

 if(colorMenu){
  const captions=[...colorMenu.querySelectorAll('.sv-gradient-section-caption')];
  const solid=colorMenu.querySelector('.sv-gradient-solid-grid');
  const presets=colorMenu.querySelector('.sv-gradient-presets');
  const custom=colorMenu.querySelector('details.sv-gradient-custom');
  const view=buildSegments(colorMenu,[
   {key:'colors',label:'Цвета',nodes:[captions[0],solid]},
   {key:'gradients',label:'Градиенты',nodes:[captions[1],presets,custom]}
  ],'colors');
  document.getElementById('notePaperColorTrigger')?.addEventListener('click',()=>{
   if(colorMenu.hidden||!view)return;
   view.activate(colorMenu.querySelector('[data-paper-gradient][aria-pressed="true"]')?'gradients':'colors');
  });
 }

 if(menu){
  const labels=[...menu.querySelectorAll('.sv-newdock-menu-title')];
  const backgrounds=menu.querySelector('.sv-newdock-backgrounds:not(.sv-newdock-ink-choices)');
  const inks=menu.querySelector('.sv-newdock-ink-choices');
  const actions=[...menu.children].filter(node=>node.tagName==='BUTTON');
  buildSegments(menu,[
   {key:'drawing',label:'Рисование',nodes:[labels[0],backgrounds,labels[1],inks]},
   {key:'actions',label:'Действия',nodes:[labels[2],...actions]}
  ],'drawing');
 }


 // Only one popover may be visible at once, even on fast taps and iOS.
 const settingsTrigger=document.getElementById('notePaperSettings');
 const colorTrigger=document.getElementById('notePaperColorTrigger');
 const sheetTrigger=document.getElementById('notePaperPatternTrigger');
 const hidePanel=(panel,trigger)=>{
  if(!panel||panel.hidden)return;
  panel.hidden=true;
  trigger?.setAttribute('aria-expanded','false');
 };
 settingsTrigger?.addEventListener('click',()=>{
  if(!menu?.hidden){hidePanel(colorMenu,colorTrigger);hidePanel(paper,sheetTrigger)}
 });
 colorTrigger?.addEventListener('click',()=>{
  if(!colorMenu?.hidden){hidePanel(menu,settingsTrigger);hidePanel(paper,sheetTrigger)}
 });
 sheetTrigger?.addEventListener('click',()=>{
  if(!paper?.hidden){hidePanel(menu,settingsTrigger);hidePanel(colorMenu,colorTrigger)}
 });

})();