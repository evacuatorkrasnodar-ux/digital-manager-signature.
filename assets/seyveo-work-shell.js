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
 nav.setAttribute('aria-label','Мои дела, календарь и кабинет');
 const choices=[['personal','Мои дела'],['calendar','Календарь'],['business','Кабинет']];
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
 // Keep one visible + in the permanent work header. The original
 // calendar button remains the logic controller; only its popover moves.
 function parkCalendarMenu(inSharedHeader){
  if(!createMenu||!menuHome)return;
  const destination=inSharedHeader?heading:menuHome;
  if(createMenu.parentElement!==destination)destination.append(createMenu);
  if(!inSharedHeader){
   createMenu.hidden=true;
   calendarAdd?.setAttribute('aria-expanded','false');
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
  else if(section==='business')cabinetAdd?.click();
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
  return tasks.dataset.workView==='business'?'business':'personal';
 }
 function sync(){
  const active=activeSection();
  const managerTasks=!tasks.hidden&&oldTasks.dataset.manager==='true';
  const managerCal=!calendar.hidden&&!oldCalendar.hidden;
  const visible=managerTasks||managerCal;
  const history=visible&&!tasks.hidden&&tasks.classList.contains('sah-history-open');
  parkCalendarMenu(visible&&!history&&active==='calendar');
  if(active!=='calendar'||history){
   if(createMenu)createMenu.hidden=true;
   calendarAdd?.setAttribute('aria-expanded','false');
  }
  nav.hidden=!visible||history;
  heading.hidden=!visible;
  shell.dataset.sharedWork=String(visible);
  shell.dataset.history=String(history);
  title.textContent=history?'История действий':active==='calendar'?'Календарь':active==='business'?'Кабинет':'Мои дела';
  // Root destinations are already navigable through the bottom dock.
  // Do not show a redundant Back control beside each top-level title.
  back.hidden=!history;
  back.setAttribute('aria-label',history?'Вернуться к моим делам':'Вернуться назад');
  add.hidden=history;
  add.setAttribute('aria-label',active==='personal'?'Добавить дело':active==='calendar'?'Создать событие или дело':'Настроить инструменты кабинета');
  add.setAttribute('aria-haspopup',String(active==='calendar'));
  add.setAttribute('aria-controls',active==='calendar'?'calendarCreateMenu':'');
  add.setAttribute('aria-expanded',active==='calendar'?String(calendarAdd?.getAttribute('aria-expanded')==='true'):'false');
  shell.dataset.active=active;
  for(const button of nav.querySelectorAll('button')){
   button.setAttribute('aria-pressed',String(button.dataset.svWorkTab===active));
  }
 }
 nav.addEventListener('click',event=>{
  const button=event.target.closest('[data-sv-work-tab]');
  if(!button||nav.hidden)return;
  const target=button.dataset.svWorkTab;
  if(target===activeSection())return;
  if(createMenu){createMenu.hidden=true;calendarAdd?.setAttribute('aria-expanded','false');add.setAttribute('aria-expanded','false');}
  const fromCalendar=!calendar.hidden;
  const original=fromCalendar
   ?oldTab(oldCalendar,'data-manager-calendar-tab',target)
   :oldTab(oldTasks,'data-unified-tasks-tab',target);
  if(original&&!original.disabled){
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
 sync();
 window.SEYVEO_WORK_SHELL=Object.freeze({version:6,sync});
})();