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
 add.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>';
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
 const noteOriginalParent=noteDialog?.parentNode||null;
 const noteOriginalNext=noteDialog?.nextSibling||null;
 function restoreNotebook(){
  notebookActive=false;notebookPending=false;
  if(noteDialog?.parentNode===notebookHost){
   if(noteDialog.open)noteDialog.close();
   if(noteOriginalParent){
    if(noteOriginalNext?.parentNode===noteOriginalParent)
     noteOriginalParent.insertBefore(noteDialog,noteOriginalNext);
    else noteOriginalParent.append(noteDialog);
   }
  }
  notebookHost.hidden=true;
 }
 function enterNotebook(){
  if(tasks.hidden)return;
  notebookPending=false;notebookActive=true;
  if(noteDialog?.parentNode!==notebookHost){
   if(noteDialog?.open)noteDialog.close();
   notebookHost.append(noteDialog);
  }
  notebookHost.hidden=false;
  sync();
  // One existing renderer/store; only the presentation mode changes.
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
  title.textContent=history?'История действий':active==='notes'?'Блокнот':active==='calendar'?'Календарь':active==='business'?'Кабинет':active==='employee'?'Моя работа':'Мои дела';
  // Root destinations are already navigable through the bottom dock.
  // Do not show a redundant Back control beside each top-level title.
  back.hidden=!history;
  back.setAttribute('aria-label',history?'Вернуться к моим делам':'Вернуться назад');
  // The employee home has contextual controls inside its own dashboard.
  // Do not show an empty + action in the shared header.
  add.hidden=history||active==='employee';
  add.setAttribute('aria-label',active==='notes'?'Новая заметка':active==='personal'?'Добавить дело':active==='calendar'?'Создать событие или дело':'Создать заметку или настроить кабинет');
  add.setAttribute('aria-haspopup',String(active==='calendar'||active==='business'));
  add.setAttribute('aria-controls',active==='calendar'?'calendarCreateMenu':active==='business'?'svWorkCreateChoices':'');
  add.setAttribute('aria-expanded',active==='calendar'?String(calendarAdd?.getAttribute('aria-expanded')==='true'):active==='business'?String(!businessCreate.hidden):'false');
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
  version:13,sync,
  isNotesInline:()=>notebookActive&&!notebookHost.hidden
 });
})();