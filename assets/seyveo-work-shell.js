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
 const businessCreate=document.createElement('div');
 businessCreate.id='svWorkCreateChoices';
 businessCreate.hidden=true;
 businessCreate.setAttribute('role','group');
 businessCreate.setAttribute('aria-label','Действия кабинета');
 const cabinetChoice=document.createElement('button');
 cabinetChoice.type='button';
 cabinetChoice.setAttribute('aria-label','Настроить кабинет');
 cabinetChoice.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 6h17M3.5 12h17M3.5 18h17"/><circle cx="9" cy="6" r="2.1"/><circle cx="15" cy="12" r="2.1"/><circle cx="10" cy="18" r="2.1"/></svg><span>Настроить кабинет</span>';
 const assignChoice=document.createElement('button');
 assignChoice.type='button';
 assignChoice.setAttribute('aria-label','Создать поручение');
 assignChoice.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 6h11M8 12h6M8 18h5M3 6h1M3 12h1M3 18h1"/><path d="m16 17 2 2 4-5"/></svg><span>Поручить</span>';
 businessCreate.append(assignChoice,cabinetChoice);
 shell.append(businessCreate);
 function closeBusinessCreate(){
  businessCreate.hidden=true;
  if(add.getAttribute('aria-controls')==='svWorkCreateChoices')add.setAttribute('aria-expanded','false');
 }
 cabinetChoice.addEventListener('click',()=>{closeBusinessCreate();cabinetAdd?.click()});
 assignChoice.addEventListener('click',()=>{
  closeBusinessCreate();
  const openChat=window.SEYVEO_UNIFIED_TASKS?.openChat;
  if(typeof openChat==='function')openChat('tasks');
  else window.alert('Рабочий чат сейчас недоступен. Поручение не создано.');
 });
 document.addEventListener('pointerdown',event=>{
  if(!businessCreate.hidden&&!businessCreate.contains(event.target)&&!add.contains(event.target))closeBusinessCreate();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!businessCreate.hidden){closeBusinessCreate();add.focus({preventScroll:true})}
 });
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
  if(!calendar.hidden)return 'calendar';
  return tasks.dataset.workView==='business'?'business':tasks.dataset.workView==='employee'?'employee':'personal';
 }
 function sync(){
  const active=activeSection();
  const managerTasks=!tasks.hidden&&oldTasks.dataset.manager==='true';
  const managerCal=!calendar.hidden&&!oldCalendar.hidden;
  // The employee's existing workspace is a top-level Tasks view.
  // Old tabs are deliberately hidden, so this shared bar must show it.
  const employeePreview=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
  const managerPreview=window.SEYVEO_PREVIEW?.isManager?.()===true;
  const employeeMode=employeePreview&&!managerPreview;
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
    ? (name==='business'||name==='notes')
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
  title.textContent=history?'История':active==='calendar'?'Календарь':active==='business'?'Кабинет':active==='employee'?'Моя работа':'Мои дела';
  // Root destinations are already navigable through the bottom dock.
  // Do not show a redundant Back control beside each top-level title.
  back.hidden=!history;
  back.setAttribute('aria-label',history?'Вернуться к моим делам':'Вернуться назад');
  // Keep both History controls as identical graphite circles even if an
  // older theme stylesheet overrides the shared Back class on mobile Safari.
  if(history){
   back.style.setProperty('background-color','#38383A','important');
   back.style.setProperty('color','#F6F7F8','important');
   back.style.setProperty('border-radius','50%','important');
   back.style.setProperty('box-shadow','none','important');
  }else{
   for(const name of ['background-color','color','border-radius','box-shadow'])back.style.removeProperty(name);
  }
  // The employee home has contextual controls inside its own dashboard.
  // Do not show an empty + action in the shared header.
  add.hidden=history||active==='employee';
  const nextIcon=history?'search':'add';
  if(add.dataset.svHeaderIcon!==nextIcon){
   add.innerHTML=history?searchIcon:plusIcon;
   add.dataset.svHeaderIcon=nextIcon;
  }
  add.setAttribute('aria-label',history?'Поиск в истории действий':active==='personal'?'Добавить дело':active==='calendar'?'Открыть меню календаря':'Действия кабинета');
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
  if(button.hidden)return;
  if(target==='notes'){
   // Notebook is an entry into the existing records/editor, not another empty Work page.
   // For an empty notebook open the creation chooser directly.
   const api=window.SEYVEO_NOTES_API;
   if(api?.getNotes?.().length===0)document.getElementById('notesNew')?.click();
   else if(typeof api?.openNotes==='function')api.openNotes();
   else document.getElementById('notesDialog')?.showModal();
   return;
  }
  if(target===activeSection())return;
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
 window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
 window.addEventListener('seyveo:route-changed',()=>requestAnimationFrame(sync));
 window.addEventListener('seyveo:preview-role-changed',()=>requestAnimationFrame(sync));
 sync();
 window.SEYVEO_WORK_SHELL=Object.freeze({
  version:17,sync,
  isNotesInline:()=>false
 });
})();