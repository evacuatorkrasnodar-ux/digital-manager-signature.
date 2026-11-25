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
 // A single permanent header and tab bar own Notebook as well.
 // Only Notebook CONTENT mounts into Work; its old screen chrome is gone.
 const notesPage=document.getElementById('notesDialog');
 if(notesPage)shell.append(notesPage);
 // Wallet lives in the same Work shell: one genuine navigation capsule.
 const walletDialog=document.getElementById('seyveoPayDialog');
 if(walletDialog){
  shell.append(walletDialog);
  // Pay controller executes earlier than this Work shell. Its two genuine
  // Card / Finances controls initially live in the dialog; reparent them
  // to the free top header area once this shell exists, just like Notebook.
  const walletChoices=walletDialog.querySelector('.syp-view-switch');
  if(walletChoices)shell.append(walletChoices);
 }
 // Reuse the three real Notebook launch buttons in the spare top header area.
 // Their original listeners continue to open the editors and save real notes.
 const notebookChoices=document.getElementById('svNotebookCreateTiles');
 if(notebookChoices){
  shell.append(notebookChoices);
  notebookChoices.hidden=true;
  notebookChoices.setAttribute('aria-label','Создать заметку');
 }
 // The legacy heading must never paint beside the permanent work heading.
 // Inline important wins against old, later-loaded stylesheets without
 // destroying the original controls or their click handlers.
 for(const legacy of [tasks.querySelector('.tasks-heading'),calendar.querySelector('.calendar-header')]){
  if(legacy)legacy.style.setProperty('display','none','important');
 }
 const nav=document.createElement('nav');
 nav.id='svWorkTabs';
 nav.setAttribute('aria-label','Мои дела, Блокнот, Кошелёк и Кабинет');
 const choices=[['personal','Мои дела'],['notes','Блокнот'],['wallet','Кошелёк'],['business','Кабинет'],['employee','Моя работа']];
 for(const [id,label] of choices){
  const button=document.createElement('button');
  button.type='button';
  button.dataset.svWorkTab=id;
  button.textContent=label;
  button.setAttribute('aria-pressed','false');
  nav.append(button);
 }
 // Active tab draws its own flat white background; no floating duplicate.
 // The old moving lens caused subpixel offsets on Safari.
 shell.prepend(nav);
 // Mount one isolated, newly written header. Its controls live inside
 // Shadow DOM, so old app styles cannot remove Back's circular material.
 const workHeader=window.SEYVEO_WORK_HEADER?.create();
 if(!workHeader)throw new Error('SEYVEO Work header module is missing');
 const {host:heading,back,title,month,company,add}=workHeader;
 function syncCompanyName(){
  if(!company)return;
  let name='';
  try{const api=window.SEYVEO_COMPANY_PASSPORT;name=String((api?.getRecord?api.getRecord():JSON.parse(localStorage.getItem('seyveo-company-passport-v1')||'null'))?.name||'').trim();}catch{}
  company.querySelector('.company-name').textContent=name||'Моя компания';
  company.setAttribute('aria-label','Открыть профиль компании'+(name?': '+name:''));
 }
 company?.addEventListener('click',()=>window.SEYVEO_COMPANY_PASSPORT?.open?.());
 window.addEventListener('seyveo:company-changed',syncCompanyName);
 window.addEventListener('storage',event=>{if(event.key==='seyveo-company-passport-v1')syncCompanyName()});
 syncCompanyName();
 // The current calendar period occupies the center of the shared header,
 // aligned between Back and Add; the month grid retains its original structure.
 const calendarPeriodLabel=document.getElementById('calendarPeriodTitle');
 const zodiacNames=['Крысы','Быка','Тигра','Кролика','Дракона','Змеи','Лошади','Козы','Обезьяны','Петуха','Собаки','Свиньи'];
 const zodiacEmoji=['🐀','🐂','🐅','🐇','🐉','🐍','','🐐','🐒','🐓','🐕','🐖'];
 const horseArt='<svg viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="horseGold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#E9C58D"/><stop offset=".55" stop-color="#BD784C"/><stop offset="1" stop-color="#914E38"/></linearGradient></defs><path class="horse-heat" d="M18 36Q10 29 18 20M21 33Q15 24 23 16" fill="none" stroke="#EBA767" stroke-width="1.5" stroke-linecap="round"/><path d="M15 48c1-7 7-13 9-19l-1-12 7 3 7-12 4 16c8 5 11 11 10 17-2 4-6 6-11 5l-6-7-8-3-3 12z" fill="url(#horseGold)" stroke="#AE6A45" stroke-width=".7" stroke-linejoin="round"/><path d="M28 19c-1 7-4 13-8 20m6-20c2 9-2 16-5 20m9-20c3 7 0 13-3 17" fill="none" stroke="#F1AD69" stroke-width="2.5" stroke-linecap="round"/><path d="M37 8l1 12-5-1z" fill="#EBC18F"/><circle cx="41" cy="30" r="1.4" fill="#593D39"/><path d="M44 36c2 0 4 1 5 2" fill="none" stroke="#7B4539" stroke-width="1.15" stroke-linecap="round"/><path class="horse-spark" d="M12 15v7m-3.5-3.5h7M45 9v5m-2.5-2.5h5" fill="none" stroke="#EBA25E" stroke-width="1.1" stroke-linecap="round"/></svg>';
 const syncCalendarPeriod=()=>{
  if(calendar.hidden||!calendarPeriodLabel||heading.dataset.calendarPeriod!=='true')return;
  const label=calendarPeriodLabel.textContent.trim()||'Календарь';
  // Keep the year artwork and text node mounted until the actual period changes.
  if(title.dataset.calendarLabel===label)return;
  title.dataset.calendarLabel=label;
  title.textContent=label;
  const year=Number(label);
  if(!/^[0-9]{4}$/.test(label)||year<1900)return;
  const index=((year-2020)%12+12)%12;
  const symbol=document.createElement('span');
  symbol.className='sv-zodiac-symbol';
  symbol.setAttribute('aria-hidden','true');
  symbol.innerHTML=index===6?horseArt:zodiacEmoji[index];
  symbol.title=year+' — год '+zodiacNames[index]+' по китайскому календарю';
  title.append(symbol);
 };
 if(calendarPeriodLabel){
  new MutationObserver(syncCalendarPeriod).observe(calendarPeriodLabel,{childList:true,characterData:true,subtree:true});
 }
 // The calendar year and zodiac are styled in the single Work Header stylesheet.
 const plusIcon=workHeader.icons.plus;
 const searchIcon=workHeader.icons.search;
 // The landing uses the three-action capsule. In nested All Tasks, Search
 // becomes one 44px circle; choosing records lives in the bottom capsule.
 const historyBar=heading.shadowRoot?.querySelector('.bar');
 const historyGroup=document.createElement('div');
 historyGroup.className='sv-history-dual';

 const searchTasks=document.createElement('button');searchTasks.type='button';searchTasks.className='control sv-history-search';
 searchTasks.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4.5v5h5"/><path d="M3.7 9.5a8.5 8.5 0 1 1-.2 4"/><path d="M12 7.5V12l3 2"/></svg>';
 searchTasks.setAttribute('aria-label','История и все дела');
 const reviewCards=document.createElement('button');
 reviewCards.type='button';reviewCards.className='control sv-review-cards-control';reviewCards.setAttribute('aria-label','Разобрать карточки');
 reviewCards.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="7" width="14" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v10"/><path d="M8 11h8M8 15h5"/></svg>';
 const reviewBadge=document.createElement('span');
 reviewBadge.className='sv-review-cards-badge';reviewBadge.hidden=true;reviewBadge.setAttribute('aria-hidden','true');reviewCards.append(reviewBadge);
 window.addEventListener('seyveo:review-count',event=>{const count=Math.max(0,Number(event.detail?.count)||0);reviewBadge.hidden=count===0;reviewBadge.textContent=count>99?'99+':String(count);reviewCards.setAttribute('aria-label',count?'Разобрать карточки: '+count:'Разобрать карточки');});
 reviewCards.addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:open-card-review')));
 const selectHistory=document.createElement('button');
 selectHistory.className='control sv-history-select';
 selectHistory.type='button';
 selectHistory.setAttribute('aria-label','Выбрать записи истории');
 selectHistory.setAttribute('aria-pressed','false');
 selectHistory.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.2" width="17" height="12.2" rx="2.3"/><path d="M7 7.1h10M7 10.7h10M5.1 18.3h13.8M5.1 21h13.8"/></svg>';
 if(historyBar){
  historyBar.append(historyGroup);
  historyGroup.append(searchTasks,selectHistory,add,reviewCards);
 }
 // The private Work Header stylesheet owns all geometry and pointer states.
 selectHistory.addEventListener('click',event=>{
  event.stopPropagation();
  window.SEYVEO_TASK_INLINE?.select();
 });
 searchTasks.addEventListener('click',event=>{
  event.stopPropagation();
  if(window.SEYVEO_TASK_INLINE?.current?.())window.SEYVEO_TASK_INLINE.toggleSearch();
  else window.SEYVEO_TASK_INLINE?.open();
 });
 // Personal landing uses History in the left circle. Reuse the single
 // existing Action History panel; keep the original back chevron for subviews.
 const backIcon=back.innerHTML;
 const historyIcon='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 4.5v5h5"/><path d="M3.7 9.5a8.5 8.5 0 1 1-.2 4"/><path d="M12 7.5V12l3 2"/></svg>';
 back.dataset.svHeaderIcon='back';
 add.dataset.svHeaderIcon='add';
 shell.prepend(heading);
 // The visible month is the ONLY calendar entrance in My Tasks. No
 // second title row or redundant "Все календари" button.
 month.setAttribute('aria-label','Открыть календарь');
 month.addEventListener('click',()=>{
  location.hash='#calendar';
  resetWorkScroll();
  scheduleSync();
 });
 document.addEventListener('seyveo:agenda-month-changed',event=>{
  const detail=event.detail||{};
  if(detail.month)month.querySelector('.month-name').textContent=detail.month;
  if(detail.year)month.querySelector('.month-year').textContent=detail.year;
 });
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
  if(window.SEYVEO_TASK_INLINE?.current?.()&&activeSection()==='personal'){
   window.SEYVEO_TASK_INLINE.close();
   return;
  }
  if(notesPage?.open){notesPage.close();return;}
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
  // Notebook's three visible creation actions replace its redundant +.
  else if(section==='business'){
   if(!window.SEYVEO_PREVIEW?.isManager?.())return;
   businessCreate.hidden=!businessCreate.hidden;
   add.setAttribute('aria-expanded',String(!businessCreate.hidden));
  }
 });


 // All Tasks v2 stays within the permanent Work shell but owns its scroll
 // and bottom actions. The calendar and underlying task records are untouched.
 const personalView=document.getElementById('unifiedPersonalTasksView');
 const taskList=personalView?.querySelector('#personalTaskList');
 const toolPanel=document.createElement('section');
 toolPanel.id='svAllTasksView';toolPanel.hidden=true;
 if(taskList)taskList.parentElement.insertBefore(toolPanel,taskList);
 // Rebuilt actions: just one floating capsule, with no footer or backdrop.
 const actionCapsule=document.createElement('nav');
 actionCapsule.id='svTaskActionCapsule';
 actionCapsule.hidden=true;
 actionCapsule.setAttribute('aria-label','Действия с выбранными делами');
 document.body.append(actionCapsule);
 let toolMode='',filter='all',query='',selectionActive=false,searchOpen=false;
 const selected=new Set();
 // The floating bulk capsule rests while reading, without resizing the list.
 let bulkScrollTimer=0;
 function revealBulkCapsule(){
  clearTimeout(bulkScrollTimer);bulkScrollTimer=0;
  actionCapsule.classList.remove('sv-bulk-scrolling');
 }
 function trackBulkScroll(results){
  const hideDuringScroll=()=>{
   if(!results.isConnected||!toolMode||!selectionActive||actionCapsule.hidden||
      selected.size||actionCapsule.querySelector(':focus-visible')){
    revealBulkCapsule();return;
   }
   const focused=document.activeElement;
   if(actionCapsule.contains(focused))focused.blur();
   actionCapsule.classList.add('sv-bulk-scrolling');
   clearTimeout(bulkScrollTimer);
   bulkScrollTimer=setTimeout(revealBulkCapsule,300);
  };
  // Observe actual native movement, including inertial scrolling on iOS.
  results.addEventListener('scroll',hideDuringScroll,{passive:true});
  results.addEventListener('wheel',event=>{
   if(event.deltaY&&results.scrollHeight>results.clientHeight+1)hideDuringScroll();
  },{passive:true});
  let touchY=null;
  results.addEventListener('touchstart',event=>{touchY=event.touches[0]?.clientY??null;},{passive:true});
  results.addEventListener('touchmove',event=>{
   const y=event.touches[0]?.clientY;
   if(touchY!==null&&Number.isFinite(y)&&Math.abs(y-touchY)>5&&results.scrollHeight>results.clientHeight+1)hideDuringScroll();
  },{passive:true});
 }
 actionCapsule.addEventListener('focusin',revealBulkCapsule);
 document.addEventListener('keydown',event=>{
  if(toolMode&&event.key==='Tab')revealBulkCapsule();
 },true);
 document.addEventListener('visibilitychange',revealBulkCapsule);
 const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
 // All Tasks v2 uses one standalone stylesheet, without legacy injected layers.
 // Hide only the dock's position when the iPhone keyboard takes over search.
 // The approved dock material and its 60px geometry remain unchanged.
 toolPanel.addEventListener('focusin',event=>{
  if(event.target.matches('.sv-tool-input'))
   document.documentElement.classList.add('sv-task-search-focus');
 });
 toolPanel.addEventListener('focusout',event=>{
  if(event.target.matches('.sv-tool-input'))
   document.documentElement.classList.remove('sv-task-search-focus');
 });
 const getTasks=()=>{
  if(window.SEYVEO_PERSONAL_TASK_TOOLS?.list)return window.SEYVEO_PERSONAL_TASK_TOOLS.list();
  try{const v=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]');return Array.isArray(v)?v:[]}
  catch{return []}
 };
 const matches=()=>getTasks().filter(t=>{
  if(!t||typeof t.title!=='string')return false;
  if(filter==='active'&&t.done===true||filter==='done'&&t.done!==true)return false;
  return t.title.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').includes(query.trim().toLocaleLowerCase('ru-RU').replace(/ё/g,'е'));
 }).sort((a,b)=>String(b.doneAt||b.createdAt||'').localeCompare(String(a.doneAt||a.createdAt||'')));
 function paint(){
  revealBulkCapsule();
  const previousResultScroll=toolPanel.querySelector('.sv-tool-results')?.scrollTop||0;
  toolPanel.replaceChildren();
  // Always one search box and one results list. Selection is a mode within
  // this SAME screen; never a second page with duplicate search/filters.
  const input=make('input','sv-tool-input');
  input.type='search';input.placeholder='Найти дело';input.value=query;
  input.hidden=!searchOpen;
  input.setAttribute('aria-label','Поиск по названию дела');
  input.addEventListener('input',()=>{query=input.value;paintResults()});
  toolPanel.append(input);
  let results=make('div','sv-tool-results');
  const tabs=make('div','sv-tool-filters');
  for(const [key,label] of [['all','Все'],['active','Активные'],['done','Выполненные']]){
   const button=make('button','',label);button.type='button';
   button.setAttribute('aria-pressed',String(filter===key));
   button.addEventListener('click',()=>{filter=key;paint()});
   tabs.append(button);
  }
  // The active-status filter is the only capsule on the nested All Tasks page.
  // Move the live control into the existing work-tabs slot without cloning it.
  nav.querySelector('.sv-tool-filters')?.remove();
  nav.append(tabs);
  toolPanel.append(results);
  let counter=null,deleteButton=null,selectAll=null;
  actionCapsule.replaceChildren();
  if(selectionActive){
   selectAll=make('button','sv-task-all','Выбрать все');selectAll.type='button';
   selectAll.addEventListener('click',()=>{
    const hits=matches(),fully=hits.length>0&&hits.every(t=>selected.has(t.id));
    hits.forEach(t=>fully?selected.delete(t.id):selected.add(t.id));paint();
   });
   counter=make('span','sv-task-count','Выбрано: 0');
   counter.setAttribute('aria-live','polite');
   deleteButton=make('button','sv-task-delete','Удалить');deleteButton.type='button';
   deleteButton.addEventListener('click',()=>{
    const ids=[...selected];if(!ids.length)return;
    if(!window.confirm('Переместить выбранные дела ('+ids.length+') в «Недавно удалённые»? Их можно вернуть в течение 30 дней.'))return;
    if(!window.SEYVEO_PERSONAL_TASK_TOOLS?.removeMany?.(ids)){
     window.alert('Не удалось удалить выбранные дела');return;
    }
    selected.clear();paint();
   });
   const cancel=make('button','sv-task-cancel','Отмена');cancel.type='button';
   cancel.setAttribute('aria-label','Отменить выбор дел');
   cancel.addEventListener('click',()=>{selected.clear();paint()});
   actionCapsule.append(selectAll,counter,deleteButton,cancel);
  }
  function paintResults(){
   results.replaceChildren();
   const hits=matches();
   if(!hits.length)results.append(make('p','sv-tool-empty','Дел не найдено'));
   for(const task of hits){
    const row=make('div','sv-tool-result');
    if(selectionActive){
     const check=make('input');check.type='checkbox';check.checked=selected.has(task.id);
     check.setAttribute('aria-label','Выбрать '+task.title);
     check.addEventListener('change',()=>{check.checked?selected.add(task.id):selected.delete(task.id);updateBulk()});
     row.append(check);
    }
    const body=make('span','sv-tool-copy');
    body.append(make('strong','',task.title));
    const today=new Date();
    const localToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    const overdue=!task.done&&/^\d{4}-\d{2}-\d{2}$/.test(String(task.due||''))&&task.due<localToday;
    const dateLabel=value=>{
     const raw=String(value||'').slice(0,10);
     return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw.split('-').reverse().join('.'):raw;
    };
    const subtitle=make('small','',task.done?'Выполнено'+(task.doneAt?' · '+dateLabel(task.doneAt):''):
      task.due?(overdue?'Просрочено · ':'Срок · ')+dateLabel(task.due):'Активное дело');
    if(task.done)subtitle.dataset.status='done';
    else if(overdue)subtitle.dataset.status='overdue';
    body.append(subtitle);
    if(task.done){
     row.append(body);
     const btn=make('button','sv-tool-restore','Вернуть');btn.type='button';
     btn.addEventListener('click',()=>{if(window.SEYVEO_PERSONAL_TASK_HISTORY?.restore?.(task.id))paint()});
     row.append(btn);
    }else{
     const btn=make('button','sv-tool-open-row');btn.type='button';
     btn.setAttribute('aria-label','Открыть дело: '+task.title);
     const arrow=make('span','sv-tool-chevron');
     arrow.setAttribute('aria-hidden','true');
     arrow.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';
     btn.append(body,arrow);
     btn.addEventListener('click',()=>{setMode('');requestAnimationFrame(()=>{
      const item=[...document.querySelectorAll('.personal-task-row[data-task-id]')].find(x=>x.dataset.taskId===task.id);
      item?.scrollIntoView({block:'center',behavior:'auto'});
      item?.querySelector('[data-task-menu]')?.focus({preventScroll:true});
     })});
     row.append(btn);
    }
    results.append(row);
   }
   updateBulk();
  }
  function updateBulk(){
   actionCapsule.dataset.hasSelection=String(selected.size>0);
   results.dataset.hasSelection=String(selected.size>0);
   if(selected.size)revealBulkCapsule();
   if(counter){
    counter.textContent='Выбрано: '+selected.size;
    counter.dataset.hasSelection=String(selected.size>0);
   }
   if(selectAll){
    const hits=matches();
    selectAll.textContent=hits.length&&hits.every(t=>selected.has(t.id))?'Снять выбор':'Выбрать все';
   }
   if(deleteButton)deleteButton.disabled=!selected.size;
  }
  paintResults();
  results.scrollTop=previousResultScroll;
  trackBulkScroll(results);
 }
 function syncToolHeader(){
  const inPersonal=activeSection()==='personal'&&!tasks.classList.contains('sah-history-open');
  const nested=!!toolMode&&inPersonal;
  heading.dataset.taskSelecting=String(nested);
  heading.dataset.selectionActive=String(selectionActive);
  const selectionVisible=selectionActive&&nested;
  actionCapsule.hidden=!nested;
  if(!nested)revealBulkCapsule();
  document.documentElement.classList.toggle('sv-task-selection-active',selectionVisible);
  selectHistory.setAttribute('aria-pressed',String(selectionActive));
  selectHistory.setAttribute('aria-label',selectionActive?'Закончить выбор дел':'Выбрать дела');
  selectHistory.removeAttribute('aria-haspopup');
  selectHistory.removeAttribute('aria-expanded');
  searchTasks.setAttribute('aria-expanded',String(nested&&searchOpen));
  if(inPersonal){
   back.hidden=!nested;
   back.setAttribute('aria-label',nested?'Вернуться к моим делам':'Вернуться назад');
   title.textContent=nested?'Все дела':'Мои дела';
   month.hidden=nested;
   title.hidden=!nested; // The tab capsule already says «Мои дела».
  }
 }
 function setMode(mode){
  revealBulkCapsule();
  toolMode=mode?'all':'';
  filter='all';query='';searchOpen=false;selected.clear();
  selectionActive=!!toolMode;
  shell.dataset.taskToolMode=toolMode;
  toolPanel.hidden=!toolMode;
  if(!toolMode){
   document.documentElement.classList.remove('sv-task-search-focus');
   nav.querySelector('.sv-tool-filters')?.remove();
  }
  syncToolHeader();
  if(toolMode)paint();
  // The shared header and scroll container must switch as one component.
  // Otherwise the calendar's left label overlaps «Все дела» and the
  // long task list gets clipped behind the dock.
  sync();
 }
 function toggleSearch(){
  if(!toolMode)return;
  searchOpen=!searchOpen;
  if(!searchOpen){
   query='';
   document.activeElement?.blur?.();
   document.documentElement.classList.remove('sv-task-search-focus');
  }
  paint();
  syncToolHeader();
  if(searchOpen)requestAnimationFrame(()=>toolPanel.querySelector('.sv-tool-input')?.focus({preventScroll:true}));
 }
 function toggleSelection(){
  if(!toolMode)setMode('all');
  selectionActive=true;
  selected.clear();
  syncToolHeader();
  paint();
 }
 window.SEYVEO_TASK_INLINE=Object.freeze({
  open:()=>{if(!toolMode)setMode('all')},
  select:toggleSelection,
  toggleSearch,
  toggle:mode=>{if(mode==='select')toggleSelection();else if(!toolMode)setMode('all');else setMode('')},
  close:()=>{if(toolMode)setMode('')},
  current:()=>toolMode
 });
 window.addEventListener('seyveo:personal-tasks-changed',()=>{if(toolMode)paint()});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toolMode){event.preventDefault();setMode('')}});
 // Route switches always start at the same stable viewport origin.
 // Never scroll on routine data refreshes.
 function resetWorkScroll(){
  if(document.scrollingElement)document.scrollingElement.scrollTop=0;
  const viewport=document.querySelector('.app');
  if(viewport&&viewport.scrollTop>0)viewport.scrollTop=0;
  // Reset only on an explicit route switch, not a data refresh or editor close.
  for(const pane of [notesPage,walletDialog,document.getElementById('unifiedBusinessTasksView')]){
   if(pane&&pane.scrollTop>0)pane.scrollTop=0;
  }
 }
 const oldTab=(parent,attribute,name)=>parent.querySelector('['+attribute+'="'+name+'"]');
 function activeSection(){
  if(walletDialog?.open)return 'wallet';
  if(notesPage?.open)return 'notes';
  if(!calendar.hidden)return 'calendar';
  return tasks.dataset.workView==='business'?'business':tasks.dataset.workView==='employee'?'employee':'personal';
 }
 let svAgendaWasVisible=null;
 // Avoid redundant hidden-attribute mutations: the shared dock fade observes them.
 function setHidden(el,hidden){if(el.hidden!==hidden)el.hidden=hidden;}
 function setData(el,key,value){if(el.dataset[key]!==value)el.dataset[key]=value;}
 let syncFrame=0;
 function scheduleSync(){
  if(syncFrame)return;
  syncFrame=requestAnimationFrame(()=>{syncFrame=0;sync()});
 }
 function sync(){
  // A direct route commit takes precedence over queued refreshes.
  if(syncFrame){cancelAnimationFrame(syncFrame);syncFrame=0;}

  const active=activeSection();
  const managerTasks=!tasks.hidden&&oldTasks.dataset.manager==='true';
  const managerCal=!calendar.hidden&&!oldCalendar.hidden;
  // The employee's existing workspace is a top-level Tasks view.
  // Old tabs are deliberately hidden, so this shared bar must show it.
  const employeePreview=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
  const managerPreview=window.SEYVEO_PREVIEW?.isManager?.()===true;
  // UI preview role, not a subscription/authorization check.
  const managerMode=managerPreview||active==='business';
  const employeeMode=employeePreview&&!managerMode;
  // The same three-position shell also belongs to ONE.
  // Preview roles are an interface demo, not verified company authorization.
  // Only the Work routes own this in-flow screen. An old open notebook
  // or wallet must never expose Work on top of Home or another route.
  const workRoute=location.hash==='#tasks'||location.hash==='#calendar';
  const visible=workRoute&&(!!walletDialog?.open||!!notesPage?.open||!tasks.hidden||!calendar.hidden);
  setHidden(shell,!visible);
  if(visible)shell.style.removeProperty('display');
  else shell.style.setProperty('display','none','important');
  if(notebookChoices)setHidden(notebookChoices,!visible||active!=='notes');
  const history=visible&&!walletDialog?.open&&!notesPage?.open&&!tasks.hidden&&tasks.classList.contains('sah-history-open');
  parkCalendarMenu(visible&&!history&&active==='calendar');
  if(active!=='business'||!managerPreview||history)closeBusinessCreate();
  if(active!=='calendar'||history){
   if(createMenu&&!createMenu.hidden)createMenu.hidden=true;
   if(calendarAdd?.getAttribute('aria-expanded')!=='false')calendarAdd?.setAttribute('aria-expanded','false');
  }
  // Apple-style agenda: month heading flows directly into the day strip.
  // Other work sections retain their own navigation; no dock changes.
  // Calendar is a quiet, dedicated page: no cross-section capsule or
  // duplicate card-review shortcut above the month grid. Back, Add and
  // the permanent dock remain available; other Work views are unchanged.
  const calendarOnly=active==='calendar';
  setHidden(nav,!visible||history||calendarOnly);
  heading.dataset.workTabs=String(!nav.hidden);
  heading.dataset.history=String(history);
  // Notebook is a top-level tab: its Back and card-review shortcuts repeat
  // controls that belong to the tabs/dock or to My Tasks, respectively.
  setHidden(reviewCards,history||calendarOnly||active==='notes'||active==='wallet');
  nav.dataset.employee=String(employeeMode);
  nav.dataset.one=String(!managerMode&&!employeeMode);
  nav.dataset.business=String(managerMode&&!employeeMode);
  nav.dataset.wallet='true';
  const nested=visible&&active==='personal'&&!history&&!!toolMode;
  for(const tab of nav.querySelectorAll('[data-sv-work-tab]')){
   const name=tab.dataset.svWorkTab;
   // Manager (Business): 4; personal (ONE): 3; employee view: 2.
   // The last mode never turns «Моя работа» into «Кошелёк».
   const hide=!visible||nested||(employeeMode
    ? !['personal','employee'].includes(name)
    : managerMode
      ? !['personal','notes','wallet','business'].includes(name)
      : !['personal','notes','wallet'].includes(name));
   setHidden(tab,hide);
   // Older CSS has display:flex!important. Preserve hidden semantics even
   // if a previously cached stylesheet arrives after this component.
   tab.style.setProperty('display',hide?'none':'flex','important');
   const nextTabLabel=employeeMode
    ? (name==='personal'?'Мои дела':name==='employee'?'Моя работа':name==='wallet'?'Кошелёк':name==='business'?'Кабинет':'Блокнот')
    : name==='personal'?'Мои дела':name==='notes'?'Блокнот':name==='wallet'?'Кошелёк':name==='business'?'Кабинет':'Моя работа';
   if(tab.textContent!==nextTabLabel)tab.textContent=nextTabLabel;
  }
  // Keep the exact same header footprint as Tasks/Notebook/Cabinet so
  // Wallet's shared capsule starts at the identical vertical coordinate.
  // Hide the header visually, but never collapse its layout height.
  setHidden(heading,!visible);
  heading.style.visibility=active==='wallet'?'hidden':'';
  heading.style.pointerEvents=active==='wallet'?'none':'';
  heading.setAttribute('aria-hidden',String(active==='wallet'));
  heading.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  shell.dataset.sharedWork=String(visible);
  shell.dataset.history=String(history);
  heading.dataset.taskTools=String(active==='personal'&&!history);
  // Cabinet is a top-level Work tab. Its existing Review and Plus controls
  // share one right capsule, matching the Tasks capsule's 44px button axis.
  heading.dataset.businessTools=String(active==='business'&&!history);
  if(company)setHidden(company,!visible||active!=='business'||history);
  if(toolMode&&(!visible||active!=='personal'||history)){setMode('');return;}
  const nextSearchIcon=nested?'search':'history';
  if(searchTasks.dataset.svHeaderIcon!==nextSearchIcon){
   searchTasks.innerHTML=nested?searchIcon:historyIcon;
   searchTasks.dataset.svHeaderIcon=nextSearchIcon;
  }
  searchTasks.setAttribute('aria-label',nested?'Поиск по делам':'История и все дела');
  searchTasks.setAttribute('aria-expanded',String(nested&&searchOpen));
  nav.dataset.taskFilters=String(nested);
  nav.setAttribute('aria-label',nested?'Фильтры дел':managerMode?'Мои дела, Блокнот, Кошелёк и Кабинет':employeeMode?'Мои дела и Моя работа':'Мои дела, Блокнот и Кошелёк');
  heading.dataset.taskSelecting=String(nested);
  heading.dataset.selectionActive=String(selectionActive);
  const nextTitle=history?'История':nested?'Все дела':active==='notes'?'Блокнот':active==='calendar'?'Календарь':active==='business'?'Кабинет':active==='employee'?'Моя работа':'Мои дела';
  const showCalendarPeriod=active==='calendar'&&!history&&!nested;
  if(!showCalendarPeriod||!calendarPeriodLabel){
   delete title.dataset.calendarLabel;
   if(title.textContent!==nextTitle)title.textContent=nextTitle;
  }
  // Every top-level Work section is already named inside the permanent
  // segmented capsule. Never display a duplicate page title above it.
  // Keep titles for nested All Tasks/History and the standalone Calendar.
  setHidden(title,!history&&!nested&&!nav.hidden);
  setData(heading,'calendarPeriod',String(showCalendarPeriod));
  if(showCalendarPeriod)syncCalendarPeriod();
  const showMonth=active==='personal'&&!history&&!nested&&visible;
  setHidden(month,!showMonth);
  heading.dataset.agenda=String(showMonth);
  // Both the agenda and «Все дела» use a fixed shell with a native inner
  // scroll area. Only the agenda has the month and seven-day strip.
  const innerScroll=showMonth||nested;
  setData(shell,'agendaScroll',String(innerScroll));
  document.documentElement.classList.toggle('sv-agenda-scroll-active',innerScroll);
  // A dock hidden by a prior agenda flick must reappear in «Все дела».
  if((nested||!visible)&&document.documentElement.classList.contains('sv-agenda-dock-minimized'))
   document.documentElement.classList.remove('sv-agenda-dock-minimized');
  // A single composited fade on entry; no translate or layout shift, so the
  // permanent Apple-style header and approved 60px dock never jump.
  const returningToAgenda=svAgendaWasVisible===false&&showMonth;
  svAgendaWasVisible=showMonth;
  if(returningToAgenda&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   const view=document.getElementById('unifiedPersonalTasksView');
   view?.animate?.([{opacity:.90},{opacity:1}],{
    duration:180,easing:'cubic-bezier(.22,1,.36,1)'
   });
  }
  if(showMonth){
   const nav=document.getElementById('svTasksDateNav');
   const name=nav?.querySelector('.sv-agenda-month-name')?.textContent;
   const year=nav?.querySelector('.sv-agenda-year')?.textContent;
   const monthName=month.querySelector('.month-name'),monthYear=month.querySelector('.month-year');
   if(name&&monthName.textContent!==name)monthName.textContent=name;
   if(year&&monthYear.textContent!==year)monthYear.textContent=year;
  }
  // In the personal landing use the same approved circle for History.
  // Every nested view (including History) retains the real Back arrow.
  // Root Work destinations have no fake Back. Keep real Back for nested
  // Tasks/History and Calendar, but never in Cabinet or employee root.
  setHidden(back,(active==='personal'&&!history&&!nested)||active==='notes'||active==='wallet'||active==='business'||active==='employee');
  if(back.dataset.svHeaderIcon!=='back'){back.innerHTML=backIcon;back.dataset.svHeaderIcon='back'}
  back.setAttribute('aria-label',history||nested?'Вернуться к моим делам':'Вернуться назад');
  back.title='';
  back.setAttribute('aria-haspopup','false');
  // A single stylesheet now owns Back/Add material for all routes,
  // including History. Do not write inline visual overrides here.
  // The employee home has contextual controls inside its own dashboard.
  // Do not show an empty + action in the shared header.
  setHidden(add,active==='employee'||active==='notes'||active==='wallet');
  const nextIcon=history?'search':'add';
  if(add.dataset.svHeaderIcon!==nextIcon){
   add.innerHTML=history?searchIcon:plusIcon;
   add.dataset.svHeaderIcon=nextIcon;
  }
  add.setAttribute('aria-label',history?'Поиск в истории действий':active==='notes'?'Создать заметку':active==='personal'?'Добавить дело':active==='calendar'?'Открыть меню календаря':'Действия кабинета');
  add.title=history?'Поиск по истории':'';
  add.setAttribute('aria-haspopup',String(!history&&(active==='calendar'||active==='business')));
  add.setAttribute('aria-controls',history?'sahHistorySearch':active==='calendar'?'calendarCreateMenu':active==='business'?'svWorkCreateChoices':'');
  add.setAttribute('aria-expanded',history?String(document.getElementById('sahHistorySearch')?.hidden===false):active==='calendar'?String(calendarAdd?.getAttribute('aria-expanded')==='true'):active==='business'?String(!businessCreate.hidden):'false');
  setData(shell,'active',active);
  // Wallet is a full Work section, not a modal overlay.
  const selectedWorkTab=active;
  for(const button of nav.querySelectorAll('[data-sv-work-tab]')){
   button.setAttribute('aria-pressed',String(button.dataset.svWorkTab===selectedWorkTab));
  }
 }
 nav.addEventListener('click',event=>{
  const button=event.target.closest('[data-sv-work-tab]');
  if(!button||nav.hidden)return;
  const target=button.dataset.svWorkTab;
  if(button.hidden)return;
  // Update the selected button immediately on touch, before route handoff.
  // No cloned tab rail or interim loading panel.
  for(const tab of nav.querySelectorAll('[data-sv-work-tab]')){
   tab.setAttribute('aria-pressed',String(tab.dataset.svWorkTab===target));
  }
  if(target==='wallet'){
   // Enter the actual Wallet, preserving its QR and finance controllers.
   if(notesPage?.open)notesPage.close();
   // The Pay module owns the modal and bank integration limitations.
   if(typeof window.SEYVEO_PAY?.open==='function'){
    Promise.resolve(window.SEYVEO_PAY.open()).then(()=>{
     scheduleSync();
    }).catch(()=>scheduleSync());
   }else{
    const trigger=document.querySelector('[data-calendar-space="wallet"],[data-world-space="wallet"]');
    if(trigger)trigger.click();
    else scheduleSync();
   }
   return;
  }
  // Close Wallet before navigating to any other tab.
  if(walletDialog?.open)window.SEYVEO_PAY?.close?.(true);
  if(target==='notes'){
   // The Notebook landing is the single home for creation tiles and saved notes.
   const api=window.SEYVEO_NOTES_API;
   if(typeof api?.openNotes==='function')api.openNotes();
   else {const dialog=document.getElementById('notesDialog');if(dialog&&!dialog.open)dialog.show();}
   resetWorkScroll();
   sync();
   return;
  }
  if(target===activeSection())return;
  // Stay in ONE stable header/tab bar. Only switch the content panel.
  if(notesPage?.open)notesPage.close();
  if(createMenu){createMenu.hidden=true;calendarAdd?.setAttribute('aria-expanded','false');add.setAttribute('aria-expanded','false');}
  closeBusinessCreate();
  const fromCalendar=!calendar.hidden;
  // The new visible navigation must call the real Tasks controller directly.
  // Do not proxy taps through the old hidden tab buttons: the hidden legacy
  // control is not a reliable interactive target after the header rebuild.
  if(target==='personal'){
   const open=window.SEYVEO_UNIFIED_TASKS?.openPersonal;
   if(typeof open==='function')open();
   else if(location.hash!=='#tasks')location.hash='#tasks';
   else oldTab(oldTasks,'data-unified-tasks-tab','personal')?.click();
   resetWorkScroll();
   scheduleSync();
   return;
  }
  if(target==='business'){
   const open=window.SEYVEO_UNIFIED_TASKS?.openBusiness;
   if(typeof open==='function')open('preserve');
   else oldTab(oldTasks,'data-unified-tasks-tab','business')?.click();
   resetWorkScroll();
   scheduleSync();
   return;
  }
  // ONE has no manager-calendar legacy tabs, so use the original routes.
  if(!window.SEYVEO_PREVIEW?.isManager?.()&&!window.SEYVEO_PREVIEW?.isEmployee?.()){
   if(target==='calendar')location.hash='#calendar';
   else if(target==='personal')window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();
   resetWorkScroll();
   scheduleSync();
   return;
  }
  const employeePreview=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
  if(employeePreview&&fromCalendar&&target!=='calendar'){
   // Manager calendar tabs cannot navigate to an employee workspace.
   // Use the existing unified Tasks controller instead of a second route.
   if(target==='personal')window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();
   else if(target==='employee')window.SEYVEO_UNIFIED_TASKS?.openEmployee?.();
   resetWorkScroll();
   scheduleSync();
   return;
  }
  const original=fromCalendar
   ?oldTab(oldCalendar,'data-manager-calendar-tab',target)
   :oldTab(oldTasks,'data-unified-tasks-tab',target);
  if(original&&!original.disabled&&!original.hidden){
   original.click();
   resetWorkScroll();
   scheduleSync();
  }
 });
 const observer=new MutationObserver(sync);
 observer.observe(tasks,{attributes:true,attributeFilter:['hidden','data-work-view','class']});
 observer.observe(calendar,{attributes:true,attributeFilter:['hidden']});
 if(notesPage)observer.observe(notesPage,{attributes:true,attributeFilter:['open']});
 if(walletDialog)observer.observe(walletDialog,{attributes:true,attributeFilter:['open']});
 observer.observe(oldTasks,{attributes:true,attributeFilter:['data-manager']});
 observer.observe(oldCalendar,{attributes:true,attributeFilter:['hidden']});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 // Keep the visible + accessible state in sync when the original
 // calendar handlers close their menu (choice, outside tap or Escape).
 if(calendarAdd)observer.observe(calendarAdd,{attributes:true,attributeFilter:['aria-expanded']});
 if(createMenu)observer.observe(createMenu,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hashchange',()=>scheduleSync());
 window.addEventListener('seyveo:route-changed',()=>scheduleSync());
 window.addEventListener('seyveo:preview-role-changed',()=>scheduleSync());
 // Wallet is inline; the same bar stays mounted across every tab.
 walletDialog?.addEventListener('close',()=>scheduleSync());
 sync();
 // Reveal once every deferred Work/agenda initializer has run.
 // The route's old markup must never be painted as the first frame.
 const finishFirstPaint=()=>{
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   document.documentElement.classList.remove('sv-work-first-paint');
   delete document.documentElement.dataset.svWorkEntry;
  }));
 };
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',finishFirstPaint,{once:true});
 else finishFirstPaint();
 window.SEYVEO_WORK_SHELL=Object.freeze({
  version:29,sync,
  isNotesInline:()=>true
 });
})();
