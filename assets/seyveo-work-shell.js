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
 // The legacy heading must never paint beside the permanent work heading.
 // Inline important wins against old, later-loaded stylesheets without
 // destroying the original controls or their click handlers.
 for(const legacy of [tasks.querySelector('.tasks-heading'),calendar.querySelector('.calendar-header')]){
  if(legacy)legacy.style.setProperty('display','none','important');
 }
 const nav=document.createElement('nav');
 nav.id='svWorkTabs';
 nav.setAttribute('aria-label','Мои дела, блокнот и кабинет');
 const choices=[['personal','Мои дела'],['notes','Блокнот'],['business','Кабинет'],['employee','Моя работа']];
 for(const [id,label] of choices){
  const button=document.createElement('button');
  button.type='button';
  button.dataset.svWorkTab=id;
  button.textContent=label;
  button.setAttribute('aria-pressed','false');
  nav.append(button);
 }
 shell.prepend(nav);
 // Mount one isolated, newly written header. Its controls live inside
 // Shadow DOM, so old app styles cannot remove Back's circular material.
 const workHeader=window.SEYVEO_WORK_HEADER?.create();
 if(!workHeader)throw new Error('SEYVEO Work header module is missing');
 const {host:heading,back,title,month,calendarJump,add}=workHeader;
 const plusIcon=workHeader.icons.plus;
 const searchIcon=workHeader.icons.search;
 // A single Apple-style grouped action: Select + Search in the History header.
 // The existing Search control is reused, not cloned. The group collapses
 // to display:contents elsewhere, keeping every other header unchanged.
 const historyBar=heading.shadowRoot?.querySelector('.bar');
 const historyGroup=document.createElement('div');
 historyGroup.className='sv-history-dual';

 const searchTasks=document.createElement('button');searchTasks.type='button';searchTasks.className='control sv-history-search';
 searchTasks.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4.5v5h5"/><path d="M3.7 9.5a8.5 8.5 0 1 1-.2 4"/><path d="M12 7.5V12l3 2"/></svg>';
 searchTasks.setAttribute('aria-label','История и все дела');
 const selectHistory=document.createElement('button');
 selectHistory.className='control sv-history-select';
 selectHistory.type='button';
 selectHistory.setAttribute('aria-label','Выбрать записи истории');
 selectHistory.setAttribute('aria-pressed','false');
 selectHistory.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.2" width="17" height="12.2" rx="2.3"/><path d="M7 7.1h10M7 10.7h10M5.1 18.3h13.8M5.1 21h13.8"/></svg>';
 if(historyBar){
  historyBar.append(historyGroup);
  historyGroup.append(searchTasks,selectHistory,add);
  const design=document.createElement('style');
  design.textContent=`
  /* Both task actions occupy the SAME 62px header grid row as the title.
     No per-button top offsets: one native grid baseline on every screen. */
  .sv-history-dual{display:contents}
  .sv-history-select,.sv-history-search{display:none}
  :host([data-task-tools="true"]) .bar{position:relative}
  /* The old header Select button is retired on every Tasks stage.
     The canonical Back occupies the left slot in All Tasks. */
  :host([data-task-tools="true"]) .sv-history-dual{
   position:relative;z-index:2;
   grid-column:3;grid-row:1;
   justify-self:end;align-self:center;
   box-sizing:border-box;display:flex;align-items:center;justify-content:center;
   gap:0;width:88px;height:42px;padding:0 2px;
   border:var(--sv-header-circle-border,1.75px solid rgba(255,255,255,.94));
   border-radius:999px;
   background:var(--sv-header-circle,rgba(190,193,202,.43));
   box-shadow:var(--sv-header-circle-shadow,0 0 0 .7px rgba(164,170,184,.3));
   -webkit-backdrop-filter:var(--sv-header-circle-filter,blur(12px));
   backdrop-filter:var(--sv-header-circle-filter,blur(12px));
  }
  :host([data-task-tools="true"]) .sv-history-dual .control{
   display:grid!important;flex:0 0 42px!important;
   width:42px!important;height:40px!important;min-width:42px!important;
   min-height:40px!important;margin:0!important;padding:0!important;
   border:0!important;border-radius:999px!important;
   background:transparent!important;box-shadow:none!important;
   -webkit-backdrop-filter:none!important;backdrop-filter:none!important;
   color:var(--sv-header-icon-ink,#0B0B0D)!important;
  }
  /* The landing calendar needs just History and Add. A third, hidden
     Select control previously inherited display:grid!important above and
     overflowed the 88px capsule, clipping Add at the right screen edge. */
  :host([data-task-tools="true"][data-task-selecting="false"]) .sv-history-dual .sv-history-select{
   display:none!important;
  }
  :host([data-task-tools="true"]) .sv-history-select svg{
   width:20px!important;height:20px!important;
   fill:none!important;stroke:currentColor!important;stroke-width:1.7!important;
  }
  :host([data-task-tools="true"]) .sv-history-dual .control svg{
   width:21px;height:21px;stroke-width:1.7;
  }
  :host([data-task-tools="true"]) .sv-history-search{
   display:grid!important;position:relative;
  }
  :host([data-task-tools="true"]) .sv-history-search::after{
   content:"";position:absolute;top:10px;bottom:10px;right:0;width:1px;
   background:rgba(100,106,119,.19);pointer-events:none;
  }
  :host([data-task-tools="true"]) .sv-history-dual .control:active{
   background:rgba(120,125,140,.12)!important;
  }
  :host([data-task-tools="true"]) .sv-history-select[aria-pressed="true"]{
   background:transparent!important;
  }
  /* The nested All Tasks capsule contains Search and Select. */
  :host([data-task-selecting="true"]) .sv-history-dual{display:flex!important}
  :host([data-task-selecting="true"]) .sv-history-dual .sv-history-select{display:grid!important}
  :host([data-task-selecting="true"]) .sv-history-dual .control:not(.sv-history-search):not(.sv-history-select){display:none!important}
  /* Selection is conveyed by the icon, not a second grey pill inside
     the already finished pearl capsule. */
  :host([data-task-selecting="true"]) .sv-history-dual .sv-history-select[aria-pressed="true"]{background:transparent!important}
  :host([data-task-selecting="true"]) .sv-history-select[aria-pressed="true"] svg{stroke-width:2!important}
  /* All Tasks has only the standard Back in the shared header.
     Select and Select All are below the list, never over the Back. */
  :host([data-task-tools="true"][data-theme="dark"]) .sv-history-select,
  :host([data-task-tools="true"][data-theme="dark"]) .sv-history-dual{
   background:var(--sv-header-circle,#38383A)!important;
   border:var(--sv-header-circle-border,1px solid rgba(255,255,255,.14))!important;
   box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;
  }
  `;
  heading.shadowRoot.append(design);
 }
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
 // The month is a real part of the shared header, not a floating calendar overlay.
 calendarJump.addEventListener('click',()=>month.click());
 month.addEventListener('click',()=>{
  // The month heading is the single entry point to the full calendar.
  // Keep the agenda's currently visible month; do not reset it to today.
  location.hash='#calendar';
  resetWorkScroll();
  requestAnimationFrame(sync);
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
  else if(section==='notes')window.SEYVEO_NOTE_LAUNCH?.launch?.('noteModeText');
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
    if(!window.confirm('Удалить выбранные дела ('+ids.length+')? Восстановить их нельзя.'))return;
    if(!window.SEYVEO_PERSONAL_TASK_TOOLS?.removeMany?.(ids)){
     window.alert('Не удалось удалить выбранные дела');return;
    }
    selected.clear();paint();
   });
   const cancel=make('button','sv-task-cancel','Отмена');cancel.type='button';
   cancel.setAttribute('aria-label','Отменить выбор дел');
   cancel.addEventListener('click',toggleSelection);
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
    const body=make('div','sv-tool-copy');
    body.append(make('strong','',task.title));
    const today=new Date();
    const localToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    const overdue=!task.done&&/^\d{4}-\d{2}-\d{2}$/.test(String(task.due||''))&&task.due<localToday;
    const subtitle=make('small','',task.done?'Выполнено'+(task.doneAt?' · '+String(task.doneAt).slice(0,10):''):
      task.due?(overdue?'Просрочено · ':'Срок · ')+task.due:'Активное дело');
    if(task.done)subtitle.dataset.status='done';
    else if(overdue)subtitle.dataset.status='overdue';
    body.append(subtitle);
    row.append(body);
    if(!selectionActive){
     const btn=make('button','',task.done?'Вернуть':'Открыть');btn.type='button';
     btn.addEventListener('click',()=>{
      if(task.done){if(window.SEYVEO_PERSONAL_TASK_HISTORY?.restore?.(task.id))paint()}
      else{setMode('');requestAnimationFrame(()=>{
       const item=[...document.querySelectorAll('.personal-task-row[data-task-id]')].find(x=>x.dataset.taskId===task.id);
       item?.scrollIntoView({block:'center',behavior:'auto'});
       item?.querySelector('[data-task-menu]')?.focus({preventScroll:true});
      })}
     });row.append(btn);
    }
    results.append(row);
   }
   updateBulk();
  }
  function updateBulk(){
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
 }
 function syncToolHeader(){
  const inPersonal=activeSection()==='personal'&&!tasks.classList.contains('sah-history-open');
  const nested=!!toolMode&&inPersonal;
  heading.dataset.taskSelecting=String(nested);
  heading.dataset.selectionActive=String(selectionActive);
  const selectionVisible=selectionActive&&nested;
  actionCapsule.hidden=!selectionVisible;
  document.documentElement.classList.toggle('sv-task-selection-active',selectionVisible);
  selectHistory.setAttribute('aria-pressed',String(selectionActive));
  selectHistory.setAttribute('aria-label',selectionActive?'Отменить выбор дел':'Выбрать дела');
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
  toolMode=mode?'all':'';
  filter='all';query='';searchOpen=false;selected.clear();
  selectionActive=false;
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
  selectionActive=!selectionActive;
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
 }
 const oldTab=(parent,attribute,name)=>parent.querySelector('['+attribute+'="'+name+'"]');
 function activeSection(){
  if(notesPage?.open)return 'notes';
  if(!calendar.hidden)return 'calendar';
  return tasks.dataset.workView==='business'?'business':tasks.dataset.workView==='employee'?'employee':'personal';
 }
 let svAgendaWasVisible=null;
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
  const visible=!!notesPage?.open||!tasks.hidden||!calendar.hidden;
  const history=visible&&!notesPage?.open&&!tasks.hidden&&tasks.classList.contains('sah-history-open');
  parkCalendarMenu(visible&&!history&&active==='calendar');
  if(active!=='business'||!managerPreview||history)closeBusinessCreate();
  if(active!=='calendar'||history){
   if(createMenu&&!createMenu.hidden)createMenu.hidden=true;
   if(calendarAdd?.getAttribute('aria-expanded')!=='false')calendarAdd?.setAttribute('aria-expanded','false');
  }
  // Apple-style agenda: month heading flows directly into the day strip.
  // Other work sections retain their own navigation; no dock changes.
  nav.hidden=!visible||history;
  heading.dataset.workTabs=String(!nav.hidden);
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
  heading.dataset.theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  shell.dataset.sharedWork=String(visible);
  shell.dataset.history=String(history);
  heading.dataset.taskTools=String(active==='personal'&&!history);
  if(active!=='personal')window.SEYVEO_TASK_INLINE?.close();
  const nested=active==='personal'&&!history&&!!toolMode;
  searchTasks.innerHTML=nested?searchIcon:historyIcon;
  searchTasks.setAttribute('aria-label',nested?'Поиск по делам':'История и все дела');
  searchTasks.setAttribute('aria-expanded',String(nested&&searchOpen));
  nav.dataset.taskFilters=String(nested);
  nav.setAttribute('aria-label',nested?'Фильтры дел':'Мои дела, блокнот и кабинет');
  heading.dataset.taskSelecting=String(nested);
  heading.dataset.selectionActive=String(selectionActive);
  title.textContent=history?'История':nested?'Все дела':active==='notes'?'Блокнот':active==='calendar'?'Календарь':active==='business'?'Кабинет':active==='employee'?'Моя работа':'Мои дела';
  // Top-level sections are named in the permanent tab capsule below.
  // Keep titles for nested «Все дела», «История», and the employee workspace.
  title.hidden=!history&&!nested&&['personal','calendar','notes','business'].includes(active);
  const showMonth=active==='personal'&&!history&&!nested&&visible;
  month.hidden=!showMonth;
  calendarJump.hidden=!showMonth;
  heading.dataset.agenda=String(showMonth);
  // Both the agenda and «Все дела» use a fixed shell with a native inner
  // scroll area. Only the agenda has the month and seven-day strip.
  const innerScroll=showMonth||nested;
  shell.dataset.agendaScroll=String(innerScroll);
  document.documentElement.classList.toggle('sv-agenda-scroll-active',innerScroll);
  // A dock hidden by a prior agenda flick must reappear in «Все дела».
  if(nested&&document.documentElement.classList.contains('sv-agenda-dock-minimized'))
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
   if(name)month.querySelector('.month-name').textContent=name;
   if(year)month.querySelector('.month-year').textContent=year;
  }
  // In the personal landing use the same approved circle for History.
  // Every nested view (including History) retains the real Back arrow.
  back.hidden=active==='personal'&&!history&&!nested;
  if(back.dataset.svHeaderIcon!=='back'){back.innerHTML=backIcon;back.dataset.svHeaderIcon='back'}
  back.setAttribute('aria-label',history||nested?'Вернуться к моим делам':'Вернуться назад');
  back.title='';
  back.setAttribute('aria-haspopup','false');
  // A single stylesheet now owns Back/Add material for all routes,
  // including History. Do not write inline visual overrides here.
  // The employee home has contextual controls inside its own dashboard.
  // Do not show an empty + action in the shared header.
  add.hidden=active==='employee';
  const nextIcon=history?'search':'add';
  if(add.dataset.svHeaderIcon!==nextIcon){
   add.innerHTML=history?searchIcon:plusIcon;
   add.dataset.svHeaderIcon=nextIcon;
  }
  add.setAttribute('aria-label',history?'Поиск в истории действий':active==='notes'?'Создать текстовую заметку':active==='personal'?'Добавить дело':active==='calendar'?'Открыть меню календаря':'Действия кабинета');
  add.title=history?'Поиск по истории':'';
  add.setAttribute('aria-haspopup',String(!history&&(active==='calendar'||active==='business')));
  add.setAttribute('aria-controls',history?'sahHistorySearch':active==='calendar'?'calendarCreateMenu':active==='business'?'svWorkCreateChoices':'');
  add.setAttribute('aria-expanded',history?String(document.getElementById('sahHistorySearch')?.hidden===false):active==='calendar'?String(calendarAdd?.getAttribute('aria-expanded')==='true'):active==='business'?String(!businessCreate.hidden):'false');
  shell.dataset.active=active;
  for(const button of nav.querySelectorAll('[data-sv-work-tab]')){
   button.setAttribute('aria-pressed',String(button.dataset.svWorkTab===active));
  }
 }
 nav.addEventListener('click',event=>{
  const button=event.target.closest('[data-sv-work-tab]');
  if(!button||nav.hidden)return;
  const target=button.dataset.svWorkTab;
  if(button.hidden)return;
  if(target==='notes'){
   // The Notebook landing is the single home for creation tiles and saved notes.
   const api=window.SEYVEO_NOTES_API;
   if(typeof api?.openNotes==='function')api.openNotes();
   else {const dialog=document.getElementById('notesDialog');if(dialog&&!dialog.open)dialog.show();}
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
   requestAnimationFrame(sync);
   return;
  }
  if(target==='business'){
   const open=window.SEYVEO_UNIFIED_TASKS?.openBusiness;
   if(typeof open==='function')open('preserve');
   else oldTab(oldTasks,'data-unified-tasks-tab','business')?.click();
   resetWorkScroll();
   requestAnimationFrame(sync);
   return;
  }
  // ONE has no manager-calendar legacy tabs, so use the original routes.
  if(!window.SEYVEO_PREVIEW?.isManager?.()&&!window.SEYVEO_PREVIEW?.isEmployee?.()){
   if(target==='calendar')location.hash='#calendar';
   else if(target==='personal')window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();
   resetWorkScroll();
   requestAnimationFrame(sync);
   return;
  }
  const employeePreview=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
  if(employeePreview&&fromCalendar&&target!=='calendar'){
   // Manager calendar tabs cannot navigate to an employee workspace.
   // Use the existing unified Tasks controller instead of a second route.
   if(target==='personal')window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();
   else if(target==='employee')window.SEYVEO_UNIFIED_TASKS?.openEmployee?.();
   resetWorkScroll();
   requestAnimationFrame(sync);
   return;
  }
  const original=fromCalendar
   ?oldTab(oldCalendar,'data-manager-calendar-tab',target)
   :oldTab(oldTasks,'data-unified-tasks-tab',target);
  if(original&&!original.disabled&&!original.hidden){
   original.click();
   resetWorkScroll();
   requestAnimationFrame(sync);
  }
 });
 const observer=new MutationObserver(sync);
 observer.observe(tasks,{attributes:true,attributeFilter:['hidden','data-work-view','class']});
 observer.observe(calendar,{attributes:true,attributeFilter:['hidden']});
 observer.observe(oldTasks,{attributes:true,attributeFilter:['data-manager']});
 observer.observe(oldCalendar,{attributes:true,attributeFilter:['hidden']});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 // Keep the visible + accessible state in sync when the original
 // calendar handlers close their menu (choice, outside tap or Escape).
 if(calendarAdd)observer.observe(calendarAdd,{attributes:true,attributeFilter:['aria-expanded']});
 if(createMenu)observer.observe(createMenu,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
 window.addEventListener('seyveo:route-changed',()=>requestAnimationFrame(sync));
 window.addEventListener('seyveo:preview-role-changed',()=>requestAnimationFrame(sync));
 sync();
 window.SEYVEO_WORK_SHELL=Object.freeze({
  version:26,sync,
  isNotesInline:()=>true
 });
})();
