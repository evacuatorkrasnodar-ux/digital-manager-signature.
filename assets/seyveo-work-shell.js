/* SEYVEO · one permanent work navigation DOM node.
   Legacy pages keep their nodes and handlers; their old visual bars are hidden.
   The shared shell is not rebuilt when route or work mode changes. */
(()=>{
 'use strict';
 const tasks=document.getElementById('tasksPage');
 const calendar=document.getElementById('calendarPage');
 const oldTasks=document.getElementById('unifiedTasksTabs');
 const oldCalendar=document.getElementById('managerCalendarTabs');
 if(!tasks||!calendar||!oldTasks||!oldCalendar||document.getElementById('svWorkShell'))return;
 // The legacy controls remain functional delegates, never visual rows.
 // Inline !important wins over older calendar specificity while leaving
 // hidden/aria state untouched for existing navigation logic.
 oldTasks.style.setProperty('display','none','important');
 oldCalendar.style.setProperty('display','none','important');
 const app=calendar.parentElement;
 if(!app||tasks.parentElement!==app)return;
 const shell=document.createElement('section');
 shell.id='svWorkShell';
 shell.setAttribute('aria-label','Дела и календарь');
 app.insertBefore(shell,calendar);
 shell.append(calendar,tasks);
 // The Notebook is a peer of Tasks and Calendar, not a modal floating above them.
 const notebookHost=document.createElement('section');
 notebookHost.id='svWorkNotebook';
 notebookHost.hidden=true;
 notebookHost.setAttribute('aria-label','Блокнот');
 shell.append(notebookHost);
 let notebookActive=false;
 let notebookPending=false;
 const nav=document.createElement('nav');
 nav.id='svWorkTabs';
 nav.setAttribute('aria-label','Мои дела, календарь, блокнот и кабинет');
 const choices=[['personal','Мои дела'],['calendar','Календарь'],['notes','Блокнот'],['business','Кабинет'],['employee','Моя работа']];
 for(const [id,label] of choices){
  const button=document.createElement('button');
  button.type='button';
  button.dataset.svWorkTab=id;
  button.textContent=label;
  button.setAttribute('aria-pressed','false');
  nav.append(button);
 }
 shell.prepend(nav);
 // The header is also ONE persistent node; old headers retain their listeners.
 const heading=document.createElement('header');
 heading.id='svWorkHeader';
 const back=document.createElement('button');
 back.type='button';
 back.id='svWorkBack';
 back.classList.add('sv-nav-back');
 back.setAttribute('aria-label','Вернуться назад');
 back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7"/></svg>';
 const title=document.createElement('h1');
 title.id='svWorkTitle';
 const add=document.createElement('button');
 add.type='button';
 add.id='svWorkAdd';
 add.setAttribute('aria-label','Создать событие или дело');
 const plusIcon='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>';
 const searchIcon='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 5 5"/></svg>';
 add.innerHTML=plusIcon;
 add.dataset.svHeaderIcon='add';
 heading.append(back,title,add);
 shell.prepend(heading);
 const legacyTasksBack=document.getElementById('unifiedTasksBack');
 const legacyCalendarBack=document.getElementById('calendarBack');
 const calendarAdd=document.getElementById('calendarAdd');
 const personalAdd=document.getElementById('personalAddTasks');
 const cabinetAdd=document.getElementById('svCabinetConfigure');
 const createMenu=document.getElementById('calendarCreateMenu');
 const menuHome=createMenu?.parentElement;
 const noteDialog=document.getElementById('notesDialog');
 // Only the notebook's body goes into the normal Work document flow.
 // Keep the <dialog> itself outside the shell: non-modal dialog rendering
 // inside a flex scene can change positioning/stacking on mobile Safari.
 const noteParts=noteDialog?[
  noteDialog.querySelector('.notes-head'),
  document.getElementById('notesList'),
  document.getElementById('notesStatus')
 ].filter(Boolean):[];
 const noteTitle=document.getElementById('notesTitle');
 // Illustrated actions use the existing mode chooser and editor.
 // No extra document store, modal or artificial demo actions.
 const notebookTools=document.createElement('section');
 notebookTools.className='sv-notebook-tools';
 notebookTools.setAttribute('aria-label','Способы создания записи');
 notebookTools.innerHTML=`
  <div class="sv-note-tools-intro"><span>БЫСТРЫЙ СТАРТ</span><small>Выберите способ записи</small></div>
  <div class="sv-note-tools-grid">
   <button type="button" class="sv-note-tool sv-note-tool-text" data-note-choice="noteModeText" aria-label="Создать текстовую заметку">
    <span class="sv-note-tool-art" aria-hidden="true"><svg viewBox="0 0 64 64"><rect class="sv-note-sheet" x="17" y="8" width="32" height="47" rx="5"/><path d="M25 22h16M25 29h16M25 36h12M25 43h9"/><path class="sv-note-spark" d="M43 7v7M39.5 10.5h7"/></svg></span><strong>Текст</strong><small>Написать</small>
   </button>
   <button type="button" class="sv-note-tool sv-note-tool-paper" data-note-choice="noteModePaper" aria-label="Создать рукописную заметку">
    <span class="sv-note-tool-art" aria-hidden="true"><svg viewBox="0 0 64 64"><rect class="sv-note-sheet" x="12" y="12" width="39" height="38" rx="5"/><path d="M20 24h18M20 31h11"/><path class="sv-note-pen" d="M24 45l4.7-1.2L48 24.5 43.5 20 24.2 39.2 24 45ZM41.5 22l4.5 4.5"/></svg></span><strong>От руки</strong><small>Нарисовать</small>
   </button>
   <button type="button" class="sv-note-tool sv-note-tool-scan" data-note-choice="noteModeScan" aria-label="Создать заметку из фотографии">
    <span class="sv-note-tool-art" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M19 14h-6v11M45 14h6v11M13 40v10h11M51 40v10H40"/><rect class="sv-note-sheet" x="20" y="20" width="24" height="24" rx="4"/><path d="M26 29h12M26 34h12M26 39h8"/><path class="sv-note-spark" d="M45 9v7M41.5 12.5h7"/></svg></span><strong>Фото → текст</strong><small>Распознать</small>
   </button>
  </div>`;
 notebookTools.addEventListener('click',event=>{
  const tool=event.target.closest('[data-note-choice]');
  if(!tool||!notebookTools.contains(tool)||!notebookActive)return;
  const mode=tool.dataset.noteChoice;
  if(!['noteModeText','noteModePaper','noteModeScan'].includes(mode))return;
  document.getElementById('notesNew')?.click();
  if(document.getElementById('noteModeDialog')?.open)
   document.getElementById(mode)?.click();
 });
 function restoreNotebook(){
  notebookActive=false;notebookPending=false;
  if(noteTitle)noteTitle.textContent='Блокнот';
  if(noteDialog&&noteParts.length){
   noteDialog.append(...noteParts);
  }
  notebookHost.hidden=true;
 }
 function enterNotebook(){
  if(tasks.hidden||!noteDialog||noteParts.length<3)return;
  notebookPending=false;notebookActive=true;
  if(noteDialog.open)noteDialog.close();
  if(noteTitle)noteTitle.textContent='Мои записи';
  notebookHost.replaceChildren(notebookTools,...noteParts);
  notebookHost.hidden=false;
  sync();
  // Use the one original notes renderer and store, without displaying
  // a modal at the list level.
  window.dispatchEvent(new Event('seyveo:notes-open'));
  resetWorkScroll();
 }
 // ONE uses the existing Notebook. Business keeps its cabinet configuration,
 // with a single + that offers both actions and creates no duplicate notes.
 const businessCreate=document.createElement('div');
 businessCreate.id='svWorkCreateChoices';
 businessCreate.hidden=true;
 businessCreate.setAttribute('role','group');
 businessCreate.setAttribute('aria-label','Действия кабинета');
 const newNoteChoice=document.createElement('button');
 newNoteChoice.type='button';newNoteChoice.textContent='Новая заметка';
 const cabinetChoice=document.createElement('button');
 cabinetChoice.type='button';cabinetChoice.textContent='Настроить кабинет';
 businessCreate.append(newNoteChoice,cabinetChoice);
 shell.append(businessCreate);
 function closeBusinessCreate(){
  businessCreate.hidden=true;
  if(add.getAttribute('aria-controls')==='svWorkCreateChoices')add.setAttribute('aria-expanded','false');
 }
 function openNotebook(){
  closeBusinessCreate();
  if(tasks.hidden){
   notebookPending=true;
   window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();
   requestAnimationFrame(()=>{if(notebookPending&&!tasks.hidden)enterNotebook()});
   return;
  }
  enterNotebook();
 }
 newNoteChoice.addEventListener('click',()=>{
  closeBusinessCreate();
  openNotebook();
  document.getElementById('notesNew')?.click();
 });
 cabinetChoice.addEventListener('click',()=>{closeBusinessCreate();cabinetAdd?.click()});
 document.addEventListener('pointerdown',event=>{
  if(!businessCreate.hidden&&!businessCreate.contains(event.target)&&!add.contains(event.target))closeBusinessCreate();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!businessCreate.hidden){closeBusinessCreate();add.focus({preventScroll:true})}
 });
 noteDialog?.addEventListener('close',()=>requestAnimationFrame(sync));
 // Keep one visible + in the permanent work header. The original
 // calendar button remains the logic controller; its chooser sits in flow
 // between the header and tabs rather than covering the screen.
 function parkCalendarMenu(inSharedHeader){
  if(!createMenu||!menuHome)return;
  const destination=inSharedHeader?shell:menuHome;
  if(createMenu.parentElement!==destination)destination.append(createMenu);
  if(!inSharedHeader){
   if(!createMenu.hidden)createMenu.hidden=true;
   if(calendarAdd?.getAttribute('aria-expanded')!=='false')calendarAdd?.setAttribute('aria-expanded','false');
   add.setAttribute('aria-expanded','false');
  }
 }
 back.addEventListener('click',()=>{
  if(tasks.classList.contains('sah-history-open')){
   document.querySelector('#seyveoActionHistoryPanel .sah-inline-head button')?.click();
   return;
  }
  if(!calendar.hidden){legacyCalendarBack?.click();return}
  if(legacyTasksBack&&!legacyTasksBack.hidden){legacyTasksBack.click();return}
  document.getElementById('navHome')?.click();
 });
 // One contextual add action. Delegate to the ORIGINAL controls to retain
 // creation dialogs, validation, and existing click listeners.
 add.addEventListener('click',event=>{
  // Calendar's old click handler stops propagation; stop this shared
  // event too so the document-level outside-click listener cannot
  // immediately close the newly opened menu.
  event.stopPropagation();
  // History reuses the same 44px right-side header control for Search.
  if(shell.dataset.history==='true'){
   window.dispatchEvent(new Event('seyveo:history-search-toggle'));
   return;
  }
  const section=activeSection();
  if(section==='calendar'){
   calendarAdd?.click();
   add.setAttribute('aria-expanded',String(calendarAdd?.getAttribute('aria-expanded')==='true'));
  }else if(section==='personal')personalAdd?.click();
  else if(section==='notes')document.getElementById('notesNew')?.click();
  else if(section==='business'){
   if(!window.SEYVEO_PREVIEW?.isManager?.())return;
   businessCreate.hidden=!businessCreate.hidden;
   add.setAttribute('aria-expanded',String(!businessCreate.hidden));
  }
 });

 // Route switches always start at the same stable viewport origin.
 // Never scroll on routine data refreshes.
 function resetWorkScroll(){
  if(document.scrollingElement)document.scrollingElement.scrollTop=0;
  const viewport=document.querySelector('.app');
  if(viewport&&viewport.scrollTop>0)viewport.scrollTop=0;
 }
 const oldTab=(parent,attribute,name)=>parent.querySelector('['+attribute+'="'+name+'"]');
 function activeSection(){
  if(notebookActive&&!tasks.hidden)return 'notes';
  if(!calendar.hidden)return 'calendar';
  return tasks.dataset.workView==='business'?'business':tasks.dataset.workView==='employee'?'employee':'personal';
 }
 function sync(){
  if(notebookPending&&!tasks.hidden&&location.hash==='#tasks'){
   enterNotebook();
   return;
  }
  if(notebookActive&&(tasks.hidden||location.hash!=='#tasks'))restoreNotebook();
  const active=activeSection();
  const managerTasks=!tasks.hidden&&oldTasks.dataset.manager==='true';
  const managerCal=!calendar.hidden&&!oldCalendar.hidden;
  // The employee's existing workspace is a top-level Tasks view.
  // Old tabs are deliberately hidden, so this shared bar must show it.
  const employeePreview=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
  const managerPreview=window.SEYVEO_PREVIEW?.isManager?.()===true;
  const employeeTasks=!tasks.hidden&&(tasks.dataset.employeeMode==='true'||employeePreview);
  const employeeCalendar=!calendar.hidden&&employeePreview;
  const employeeMode=employeeTasks||employeeCalendar;
  // The same three-position shell also belongs to ONE.
  // Preview roles are an interface demo, not verified company authorization.
  const visible=!tasks.hidden||!calendar.hidden;
  const history=visible&&!tasks.hidden&&tasks.classList.contains('sah-history-open');
  parkCalendarMenu(visible&&!history&&active==='calendar');
  if(active!=='business'||!managerPreview||history)closeBusinessCreate();
  if(active!=='calendar'||history){
   if(createMenu&&!createMenu.hidden)createMenu.hidden=true;
   if(calendarAdd?.getAttribute('aria-expanded')!=='false')calendarAdd?.setAttribute('aria-expanded','false');
  }
  nav.hidden=!visible||history;
  nav.dataset.employee=String(employeeMode);
  nav.dataset.one=String(!managerPreview&&!employeeMode);
  nav.dataset.business=String(managerPreview&&!employeeMode);
  for(const tab of nav.querySelectorAll('[data-sv-work-tab]')){
   const name=tab.dataset.svWorkTab;
   tab.hidden=employeeMode
    ? name==='business'||name==='notes'
    : managerPreview
     ? name==='employee'
     : name==='business'||name==='employee';
   tab.textContent=employeeMode
    ? (name==='personal'?'Дела':name==='employee'?'Работа':name==='calendar'?'Календарь':'Блокнот')
    : (name==='personal'?'Мои дела':name==='calendar'?'Календарь':name==='notes'?'Блокнот':name==='business'?'Кабинет':'Моя работа');
  }
  heading.hidden=!visible;
  shell.dataset.sharedWork=String(visible);
  shell.dataset.history=String(history);
  title.textContent=history?'История':active==='notes'?'Блокнот':active==='calendar'?'Календарь':active==='business'?'Кабинет':active==='employee'?'Моя работа':'Мои дела';
  // Root destinations are already navigable through the bottom dock.
  // Do not show a redundant Back control beside each top-level title.
  back.hidden=!history;
  back.setAttribute('aria-label',history?'Вернуться к моим делам':'Вернуться назад');
  // The employee home has contextual controls inside its own dashboard.
  // Do not show an empty + action in the shared header.
  add.hidden=active==='employee'&&!history;
  const nextIcon=history?'search':'add';
  if(add.dataset.svHeaderIcon!==nextIcon){
   add.innerHTML=history?searchIcon:plusIcon;
   add.dataset.svHeaderIcon=nextIcon;
  }
  add.setAttribute('aria-label',history?'Поиск в истории действий':active==='notes'?'Новая заметка':active==='personal'?'Добавить дело':active==='calendar'?'Создать событие или дело':'Создать заметку или настроить кабинет');
  add.title=history?'Поиск по истории':'';
  add.setAttribute('aria-haspopup',String(!history&&(active==='calendar'||active==='business')));
  add.setAttribute('aria-controls',history?'sahHistorySearch':active==='calendar'?'calendarCreateMenu':active==='business'?'svWorkCreateChoices':'');
  add.setAttribute('aria-expanded',history?String(document.getElementById('sahHistorySearch')?.hidden===false):active==='calendar'?String(calendarAdd?.getAttribute('aria-expanded')==='true'):active==='business'?String(!businessCreate.hidden):'false');
  shell.dataset.active=active;
  for(const button of nav.querySelectorAll('button')){
   button.setAttribute('aria-pressed',String(button.dataset.svWorkTab===active));
  }
 }
 nav.addEventListener('click',event=>{
  const button=event.target.closest('[data-sv-work-tab]');
  if(!button||nav.hidden)return;
  const target=button.dataset.svWorkTab;
  if(target==='notes'){openNotebook();return}
  if(target===activeSection())return;
  if(notebookActive)restoreNotebook();
  if(createMenu){createMenu.hidden=true;calendarAdd?.setAttribute('aria-expanded','false');add.setAttribute('aria-expanded','false');}
  closeBusinessCreate();
  const fromCalendar=!calendar.hidden;
  // ONE has no manager-calendar legacy tabs, so use the original routes.
  if(!window.SEYVEO_PREVIEW?.isManager?.()&&!window.SEYVEO_PREVIEW?.isEmployee?.()){
   if(target==='calendar')location.hash='#calendar';
   else if(target==='personal')window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();
   resetWorkScroll();
   requestAnimationFrame(()=>{resetWorkScroll();sync()});
   return;
  }
  const employeePreview=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
  if(employeePreview&&fromCalendar&&target!=='calendar'){
   // Manager calendar tabs cannot navigate to an employee workspace.
   // Use the existing unified Tasks controller instead of a second route.
   if(target==='personal')window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();
   else if(target==='employee')window.SEYVEO_UNIFIED_TASKS?.openEmployee?.();
   resetWorkScroll();
   requestAnimationFrame(()=>{resetWorkScroll();sync()});
   return;
  }
  const original=fromCalendar
   ?oldTab(oldCalendar,'data-manager-calendar-tab',target)
   :oldTab(oldTasks,'data-unified-tasks-tab',target);
  if(original&&!original.disabled&&!original.hidden){
   original.click();
   resetWorkScroll();
   requestAnimationFrame(()=>{resetWorkScroll();sync()});
  }
 });
 const observer=new MutationObserver(sync);
 observer.observe(tasks,{attributes:true,attributeFilter:['hidden','data-work-view','class']});
 observer.observe(calendar,{attributes:true,attributeFilter:['hidden']});
 observer.observe(oldTasks,{attributes:true,attributeFilter:['data-manager']});
 observer.observe(oldCalendar,{attributes:true,attributeFilter:['hidden']});
 // Keep the visible + accessible state in sync when the original
 // calendar handlers close their menu (choice, outside tap or Escape).
 if(calendarAdd)observer.observe(calendarAdd,{attributes:true,attributeFilter:['aria-expanded']});
 if(createMenu)observer.observe(createMenu,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hashchange',()=>{
  if(notebookActive&&location.hash!=='#tasks')restoreNotebook();
  requestAnimationFrame(sync);
 });
 window.addEventListener('seyveo:route-changed',()=>requestAnimationFrame(sync));
 window.addEventListener('seyveo:preview-role-changed',()=>requestAnimationFrame(sync));
 sync();
 window.SEYVEO_WORK_SHELL=Object.freeze({
  version:15,sync,
  isNotesInline:()=>notebookActive&&!notebookHost.hidden
 });
})();