/* SEYVEO · Work hub. The original team messenger and task list live
 * on the SAME Tasks page. Move DOM nodes (never clone) to preserve listeners,
 * local message history and recognitions. No cross-phone delivery in demo.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const page=$('tasksPage'),personal=$('unifiedPersonalTasksView'),
  business=$('unifiedBusinessTasksView'),board=$('unifiedTasksTeamBoard'),
  taskHost=$('unifiedBusinessTasksHost'),chatHost=$('unifiedTasksChatHost'),
  tasks=$('svcpTasks'),chats=$('svcpChats'),overview=$('tasksOverview'),
  people=$('svcpTeam'),peopleHost=$('unifiedPeopleHost'),staffReveal=$('svcpManagerPeople'),
  employee=$('unifiedEmployeeTasksView'),shiftHost=$('unifiedEmployeeShiftHost'),
  employeeChatHost=$('unifiedEmployeeChatHost'),employeeTaskHost=$('unifiedEmployeeAssignments'),
  picker=$('seyveoDemoModeSelect'),previewNotice=$('seyveoDemoModeNotice'),
  employeeProfileToggle=$('svcpEmployeeProfileToggle'),
  employeeAccount=$('svcpEmployeeAccountView'),employeeAccountBack=$('svcpEmployeeAccountBack');
 if(!page||!personal||!business||!board||!taskHost||!chatHost||!tasks||!chats)return;
 // Keep Elena's single account button in the top-right corner of the Tasks header.
 // Reparent the real button to preserve its listeners, expanded state and account data.
 if(employeeProfileToggle){
  const heading=page.querySelector('.tasks-heading');
  const caption=heading?.querySelector('.manage-caption');
  if(heading)heading.insertBefore(employeeProfileToggle,caption||heading.firstChild);
  employeeProfileToggle.hidden=true;
 }
 // The employee's identity belongs INSIDE the account opened by that avatar,
 // not in a second strip above assignments and chat. Preserve the live status IDs.
 const employeeIdentity=employee?.querySelector('.svcp-employee-person');
 const employeeAccountHeading=employeeAccount?.querySelector('.svcp-employee-account-heading');
 if(employeeIdentity&&employeeAccountHeading){
  employeeAccountHeading.appendChild(employeeIdentity);
  const nowEmptyIntro=employee.querySelector('.svcp-employee-intro');
  if(nowEmptyIntro&&!nowEmptyIntro.querySelector('.svcp-employee-person, .svcp-employee-profile-toggle')){
   nowEmptyIntro.remove();
  }
 }
 taskHost.appendChild(tasks);
 tasks.hidden=false;
 chatHost.appendChild(chats);
 chats.hidden=false;
 if(people&&peopleHost){peopleHost.appendChild(people);people.hidden=false}
 // Reparent the ONE existing shift widget; never duplicate its controls or ledger.
 const shiftFold=$('seyveoShiftToggle')?.closest('details.seyveo-hr-fold');
 if(shiftFold&&shiftHost){
  shiftHost.appendChild(shiftFold);
  shiftFold.open=true;
  const settings=$('svcpEmployeeHoursSettings');
  const plan=$('seyveoShiftPlanned')?.closest('label');
  const summary=$('seyveoShiftSummary'),exportButton=$('seyveoShiftExport');
  if(settings){
   if(plan)settings.appendChild(plan);
   if(summary)settings.appendChild(summary);
   if(exportButton)settings.appendChild(exportButton);
   const note=shiftFold.querySelector('.seyveo-shift-demo>small');
   if(note){
    const details=document.createElement('details'),caption=document.createElement('summary');
    details.className='svcp-shift-explanation';
    caption.textContent='Об учёте часов';
    details.append(caption,note);
    settings.appendChild(details);
   }
  }
 }
 const MODE_KEY='seyveo-demo-preview-mode-v1';
 const MODES=['one','rise','autonom','large','employee'];
 let previewMode='autonom';
 try{const stored=localStorage.getItem(MODE_KEY);if(MODES.includes(stored))previewMode=stored}catch{}
 let exitTarget='home',pending=null,lastWorkView='personal';
 const businessTab=page.querySelector('[data-unified-tasks-tab="business"]');
 const employeeTab=page.querySelector('[data-unified-tasks-tab="employee"]');
 const managerLabel=page.querySelector('.svcp-manager-kicker');
 const largeNote=$('svcpLargeCompanyNotice');
 const TASK_KEY='seyveo-business-command-tasks-demo-v1';
 const isEmployee=()=>previewMode==='employee';
 const isManager=()=>['rise','autonom','large'].includes(previewMode);
 function setEmployeeAccountOpen(open){
  if(!employeeAccount||!employee||!employeeProfileToggle)return;
  const shown=!!open&&isEmployee();
  employeeAccount.hidden=!shown;
  employee.dataset.accountOpen=String(shown);
  page.dataset.employeeAccountOpen=String(shown);
  const topBackLabel=$('unifiedTasksBackLabel');
  if(topBackLabel)topBackLabel.textContent=shown?'К работе':(exitTarget==='manage'?'В бизнес':'На Главную');
  employeeProfileToggle.setAttribute('aria-expanded',String(shown));
  employeeProfileToggle.setAttribute('aria-label',shown
   ?'Закрыть личный кабинет Елены, вернуться к поручениям и чатам'
   :'Открыть кабинет Елены: смены, часы и благодарности');
  if(shown){
   renderEmployeeClock();renderEmployeeThanks();
   requestAnimationFrame(()=>{
    if(location.hash!=='#tasks'||employeeAccount.hidden)return;
    const viewport=document.querySelector('.app');
    if(viewport)viewport.scrollTop=0;
    window.scrollTo(0,0);
   });
  }
 }
 employeeProfileToggle?.addEventListener('click',()=>setEmployeeAccountOpen(employeeAccount?.hidden));
 employeeAccountBack?.addEventListener('click',()=>{
  setEmployeeAccountOpen(false);
  employeeProfileToggle?.focus();
 });
 function updatePulseAccess(){
  // UI preview only. Real access will require verified roles and server authorization.
  if(businessTab)businessTab.hidden=!isManager();
  if(employeeTab)employeeTab.hidden=!isEmployee();
  if(managerLabel)managerLabel.textContent=previewMode==='large'?'КРУПНАЯ КОМПАНИЯ · ДЕМО':
   (previewMode==='rise'?'RISE':'AUTONOM')+' · SEYVEO · ДЕМО';
  if(largeNote)largeNote.hidden=previewMode!=='large';
  if(picker)picker.value=previewMode;
  if(previewNotice)previewNotice.textContent=isEmployee()
   ?'Пример Елены: её смена, поручения и рабочие чаты. Данные на одном устройстве.'
   :previewMode==='one'?'Личная версия без бизнес-пульта. Подписка не меняется.'
   :previewMode==='large'?'Сценарий крупной компании: структура и права пока не подключены.'
   :'Просмотр '+previewMode.toUpperCase()+'. Различия тарифов пока не подключены.';
  if(location.hash==='#picture'&&!isManager())navigate(isEmployee()?'employee':'personal');
 }

 const SHIFT_KEY='seyveo-demo-shift-history-v1';
 const LEGACY_SHIFT_KEY='seyveo-demo-shift-v1';
 const RECOGNITION_KEY='seyveo-peer-recognition-demo-v1';
 function readShiftLedger(){
  let value=null;
  try{value=JSON.parse(localStorage.getItem(SHIFT_KEY)||'null')}catch{}
  const history=Array.isArray(value?.history)?value.history.filter(e=>
   e&&Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.end>=e.start).slice(-500):[];
  let start=Number.isFinite(value?.start)?value.start:null;
  if(start===null&&!history.length){
   try{
    const legacy=JSON.parse(localStorage.getItem(LEGACY_SHIFT_KEY)||'null');
    if(legacy?.kind==='in'&&Number.isFinite(legacy.ts))start=legacy.ts;
   }catch{}
  }
  return{start,history};
 }
 let employeeHistorySignature='';
 function renderEmployeeClock(){
  if(!isEmployee()||location.hash!=='#tasks')return;
  const now=Date.now(),{start,history}=readShiftLedger();
  const active=start!==null&&start<=now;
  const today=new Date();today.setHours(0,0,0,0);
  const dayStart=today.getTime();
  const weekStart=new Date(today);weekStart.setDate(weekStart.getDate()-(weekStart.getDay()+6)%7);
  const monthStart=new Date(today.getFullYear(),today.getMonth(),1).getTime();
  const sessions=history.map(e=>({start:e.start,end:e.end}));
  if(active)sessions.push({start,end:now});
  const overlaps=(from,to)=>sessions.reduce((total,item)=>
   total+Math.max(0,Math.min(item.end,to)-Math.max(item.start,from)),0);
  const todayMs=overlaps(dayStart,now),weekMs=overlaps(weekStart.getTime(),now),monthMs=overlaps(monthStart,now);
  const elapsed=active?Math.max(0,now-start):todayMs;
  const hms=ms=>{
   const seconds=Math.max(0,Math.floor(ms/1000));
   return String(Math.floor(seconds/3600)).padStart(2,'0')+':'+
    String(Math.floor(seconds/60)%60).padStart(2,'0')+':'+
    String(seconds%60).padStart(2,'0');
  };
  const short=ms=>{
   const minutes=Math.floor(Math.max(0,ms)/60000);
   return minutes>=60?(Math.floor(minutes/60)+' ч '+(minutes%60?minutes%60+' мин':''))
     :minutes+' мин';
  };
  const plan=Number($('seyveoShiftPlanned')?.value);
  const plannedHours=Number.isFinite(plan)&&plan>=1&&plan<=24?plan:8;
  const percent=Math.min(100,Math.round(todayMs/(plannedHours*3600000)*100));
  const badge=$('svcpEmployeeDutyBadge');
  if(badge){badge.dataset.active=String(active);badge.lastChild.textContent=active?'На работе':'Не на смене'}
  const profileShift=$('svcpEmployeeHeaderShift');
  if(profileShift)profileShift.textContent=active?'Смена · '+short(elapsed)
   :todayMs>0?'Сегодня · '+short(todayMs):'Смена не начата';
  if(employeeProfileToggle)employeeProfileToggle.dataset.active=String(active);
  const card=$('svcpEmployeeShiftCard');
  if(card)card.dataset.active=String(active);
  const time=$('svcpEmployeeClock');
  if(time)time.textContent=hms(elapsed);
  const date=$('svcpEmployeeShiftDate');
  if(date)date.textContent=new Date(now).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
  const hint=$('svcpEmployeeClockHint');
  if(hint)hint.textContent=active
   ?'Начало в '+new Date(start).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})
   :todayMs>0?'Сегодняшняя смена завершена':'Смена не начата';
  const progress=$('svcpEmployeeProgress');
  if(progress)progress.setAttribute('aria-valuenow',String(percent));
  const fill=$('svcpEmployeeProgressFill');
  if(fill)fill.style.width=percent+'%';
  const dayHint=$('svcpEmployeeTodayHint');
  if(dayHint)dayHint.textContent=short(todayMs);
  const planHint=$('svcpEmployeePlanHint');
  if(planHint)planHint.textContent='План '+plannedHours+' ч';
  for(const [id,ms] of [['svcpHoursToday',todayMs],['svcpHoursWeek',weekMs],['svcpHoursMonth',monthMs]]){
   const el=$(id);if(el)el.textContent=short(ms);
  }
  const historyList=$('svcpEmployeeHistoryList');
  const historySignature=history.length+'|'+(history[history.length-1]?.end||0);
  if(historyList&&historySignature!==employeeHistorySignature){
   employeeHistorySignature=historySignature;
   historyList.replaceChildren();
   const recent=history.slice(-4).reverse();
   if(!recent.length){
    const info=document.createElement('p');
    info.className='svcp-employee-history-empty';info.textContent='Завершённых смен ещё нет.';
    historyList.append(info);
   }else for(const entry of recent){
    const row=document.createElement('div');row.className='svcp-employee-history-row';
    const when=document.createElement('span');
    when.textContent=new Date(entry.start).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})+
     ' · '+new Date(entry.start).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
    const duration=document.createElement('strong');duration.textContent=short(entry.end-entry.start);
    row.append(when,duration);historyList.append(row);
   }
  }
 }
 function renderEmployeeThanks(){
  if(!isEmployee())return;
  let records=[];
  try{
   const all=JSON.parse(localStorage.getItem(RECOGNITION_KEY)||'[]');
   if(Array.isArray(all))records=all.filter(x=>x&&x.to==='elena'&&typeof x.kind==='string');
  }catch{}
  const count=$('svcpEmployeeThanksCount');if(count)count.textContent=String(records.length);
  const text=$('svcpEmployeeThanksText');
  if(text){
   const names={help:'Спасибо',mentor:'Выручил',initiative:'Хорошая идея',reliable:'Отличная работа',support:'Поддержка'};
   const last=records[records.length-1];
   text.textContent=last?(names[last.kind]||'Благодарность')+' · отметка коллег':'Здесь появятся отметки коллег.';
  }
 }
 $('seyveoShiftToggle')?.addEventListener('click',()=>requestAnimationFrame(renderEmployeeClock));
 $('seyveoShiftPlanned')?.addEventListener('input',renderEmployeeClock);
 const employeeClockInterval=setInterval(()=>{
  if(isEmployee()&&!document.hidden&&location.hash==='#tasks')renderEmployeeClock();
 },1000);
 document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&isEmployee())renderEmployeeClock();
 });
 window.addEventListener('seyveo:recognition-changed',renderEmployeeThanks);
 window.addEventListener('storage',event=>{
  if(event.key===SHIFT_KEY||event.key===LEGACY_SHIFT_KEY)renderEmployeeClock();
  if(event.key===RECOGNITION_KEY)renderEmployeeThanks();
 });
 function renderEmployeeTasks(){
  if(!employeeTaskHost)return;
  employeeTaskHost.replaceChildren();
  let saved=[];
  try{const rows=JSON.parse(localStorage.getItem(TASK_KEY)||'[]');if(Array.isArray(rows))saved=rows}catch{}
  const mine=saved.map((task,index)=>({task,index}))
   .filter(({task})=>task&&typeof task.text==='string'&&task.assigneeId==='elena');
  const active=mine.filter(({task})=>!task.done);
  const count=$('svcpEmployeeTaskCount');if(count)count.textContent=String(active.length);
  if(!mine.length){
   const empty=document.createElement('p');empty.className='svcp-employee-empty';
   empty.textContent='Поручений пока нет.';employeeTaskHost.append(empty);return;
  }
  for(const {task,index} of [...active,...mine.filter(({task})=>task.done)]){
   const row=document.createElement('div');
   row.className='svcp-employee-task'+(task.done?' is-done':'');
   const taskLabel=document.createElement('label');taskLabel.className='svcp-employee-task-label';
   const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!task.done;
   checkbox.setAttribute('aria-label','Выполнено: '+task.text);
   const name=document.createElement('span');name.textContent=task.text;
   taskLabel.append(checkbox,name);
   const discuss=document.createElement('button');discuss.type='button';discuss.className='svcp-employee-task-chat';
   discuss.textContent='Обсудить';discuss.setAttribute('aria-label','Обсудить поручение: '+task.text);
   discuss.addEventListener('click',()=>{
    const chatsDetails=$('svcpEmployeeChats');if(chatsDetails)chatsDetails.open=true;
    window.SEYVEO_BUSINESS_COMMAND?.showChat?.('dm-elena','elena');
    requestAnimationFrame(()=>chatsDetails?.scrollIntoView({behavior:'smooth',block:'start'}));
   });
   row.append(taskLabel,discuss);
   checkbox.addEventListener('change',()=>{
    const updated=saved.map((item,i)=>i===index?{...item,done:checkbox.checked}:item);
    try{localStorage.setItem(TASK_KEY,JSON.stringify(updated))}
    catch{checkbox.checked=!checkbox.checked;return}
    window.dispatchEvent(new Event('seyveo:employee-task-updated'));
    renderEmployeeTasks();
   });
   employeeTaskHost.append(row);
  }
 }
 function showEmployee(){
  if(!isEmployee()||!employee||!employeeChatHost)return;
  // Preserve the complete styled chat host. Moving only #svcpChats here
  // detached it from all scoped chat styles and caused a giant black SVG.
  const entering=chatHost.parentElement!==employeeChatHost;
  if(entering)employeeChatHost.appendChild(chatHost);
  chatHost.hidden=false;
  chats.hidden=false;
  renderEmployeeTasks();
  renderEmployeeClock();
  renderEmployeeThanks();
  if(entering)window.SEYVEO_BUSINESS_COMMAND?.showChat?.();
 }
 function openPulse(options={}){
  if(!isManager())return;
  if(location.hash==='#tasks'){
   const active=page.querySelector('[data-unified-tasks-tab="business"][aria-pressed="true"]');
   lastWorkView=active?'business':'personal';
  }
  if(options?.efficiency)$('pictureEfficiency')?.setAttribute('open','');
  if(location.hash!=='#picture')location.hash='#picture';
  else window.dispatchEvent(new Event('seyveo:picture-open'));
 }
 function returnFromPulse(){navigate('team')}
 function syncBack(){
  const label=$('unifiedTasksBackLabel');
  if(label)label.textContent=employeeAccount&&!employeeAccount.hidden?'К работе':(exitTarget==='manage'?'В бизнес':'На Главную');
 }
 $('unifiedTasksBack')?.addEventListener('click',()=>{
  if(employeeAccount&&!employeeAccount.hidden){setEmployeeAccountOpen(false);return}
  if(exitTarget==='manage'){
   window.SEYVEO_BUSINESS_NAV?.returnToMenu?.();
   if(location.hash!=='#manage')location.hash='#manage';
  }else $('navHome')?.click();
 });
 function restoreManagerChat(){
  // Keep chats ahead of the manager's task list, without a duplicate DOM.
  if(chatHost.parentElement!==board)board.insertBefore(chatHost,taskHost);
  if(chats.parentElement!==chatHost)chatHost.appendChild(chats);
  chatHost.hidden=false;chats.hidden=false;
 }
 function showBoard(){
  board.hidden=false;
  restoreManagerChat();
  updateManagerSummary();
  window.SEYVEO_BUSINESS_COMMAND?.showChat?.();
 }
 function select(view){
  if(view==='pulse'){openPulse();return}
  const chosen=isEmployee()?(view==='personal'?'personal':'employee'):
   isManager()?(view==='business'?'business':'personal'):'personal';
  lastWorkView=chosen;
  page.dataset.employeeMode=String(chosen==='employee');
  personal.hidden=chosen!=='personal';business.hidden=chosen!=='business';
  if(employee)employee.hidden=chosen!=='employee';
  if(employeeProfileToggle)employeeProfileToggle.hidden=chosen!=='employee';
  if(chosen!=='employee')setEmployeeAccountOpen(false);
  if(overview)overview.hidden=chosen!=='personal';
  if(chosen==='business')showBoard();
  if(chosen==='employee')showEmployee();
  page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
   button.setAttribute('aria-pressed',String(button.dataset.unifiedTasksTab===chosen)));
 }
 function showChat(roomId,viewpoint,filter){
  if(isEmployee()){
   select('employee');
   if(roomId)window.SEYVEO_BUSINESS_COMMAND?.showChat?.(roomId,'elena');
   return;
  }
  if(!isManager()){select('personal');return}
  lastWorkView='business';
  personal.hidden=true;business.hidden=false;
  if(employee)employee.hidden=true;
  page.dataset.employeeMode='false';
  if(employeeProfileToggle)employeeProfileToggle.hidden=true;
  setEmployeeAccountOpen(false);
  if(overview)overview.hidden=true;
  board.hidden=false;
  restoreManagerChat();
  page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
   button.setAttribute('aria-pressed',String(button.dataset.unifiedTasksTab==='business')));
  window.SEYVEO_BUSINESS_COMMAND?.showChat?.(roomId||null,viewpoint||'manager',filter||'all');
 }
 function routePending(){
  const request=pending;pending=null;
  if(request?.kind==='chat')showChat(request.roomId,request.viewpoint,request.filter);
  else if(request?.kind==='team')select(isEmployee()?'employee':'business');
  else if(request?.kind==='employee')select('employee');
  else select('personal');
 }
 function navigate(kind,roomId,viewpoint,filter){
  pending={kind,roomId:roomId||null,viewpoint:viewpoint||'manager',filter:filter||'all'};
  if(location.hash!=='#tasks')location.hash='#tasks';
  else routePending();
 }
 function openBusiness(source='manage'){
  if(!isManager()){navigate(isEmployee()?'employee':'personal');return}
  if(source!=='preserve')exitTarget=source==='home'?'home':'manage';
  syncBack();navigate('team');
 }
 function openChat(source='tasks',roomId=null,viewpoint='manager',filter='all'){
  if(source==='manage')exitTarget='manage';
  else if(source==='home')exitTarget='home';
  syncBack();navigate('chat',roomId,viewpoint,filter);
 }
 function openPersonal(){
  exitTarget='home';syncBack();navigate('personal');
 }
 function resetViewportAtWorkEntry(){
  // #tasks is shared by several preview modes; its prior scroll location
  // must not be reused after changing between employee and manager.
  requestAnimationFrame(()=>{
   if(location.hash!=='#tasks')return;
   const viewport=document.querySelector('.app');
   if(viewport)viewport.scrollTop=0;
   window.scrollTo(0,0);
  });
 }
 page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
  button.addEventListener('click',()=>{
   pending=null;select(button.dataset.unifiedTasksTab);
  }));
 const businessActions=page.querySelector('.svcp-manager-actions');
 businessActions?.addEventListener('click',event=>{
  const button=event.target.closest('[data-business-hub]');
  if(!button||!isManager())return;
  const kind=button.dataset.businessHub;
  if(kind==='pulse')openPulse();
  if(kind==='mail')window.SEYVEO_SAYVI_SURFACES?.open?.('mail','business');
  if(kind==='documents')window.SEYVEO_SAYVI_SURFACES?.open?.('contract','business');
  if(kind==='company')window.SEYVEO_COMPANY_PASSPORT?.open?.();
 });
 function openPeople(kind='team'){
  if(!isManager())return;
  openBusiness('preserve');
  if(staffReveal)staffReveal.open=true;
  window.SEYVEO_BUSINESS_COMMAND?.openPeopleView?.(kind);
 }
 function updateManagerSummary(){
  const summary=$('svcpManagerStatus');if(!summary)return;
  try{
   const rows=JSON.parse(localStorage.getItem(TASK_KEY)||'[]');
   const count=Array.isArray(rows)?rows.filter(r=>r&&typeof r.text==='string'&&!r.done).length:0;
   summary.textContent=count?('Активных поручений: '+count+' · локальные данные'):'Новых поручений нет · данные на устройстве';
  }catch{summary.textContent='Поручения · данные только на устройстве'}
 }
 staffReveal?.addEventListener('toggle',()=>{
  if(staffReveal.open)window.SEYVEO_BUSINESS_COMMAND?.openPeopleView?.('team');
 });
 window.addEventListener('seyveo:manager-tasks-updated',()=>{updateManagerSummary();if(isEmployee())renderEmployeeTasks()});
 window.addEventListener('storage',event=>{if(event.key===TASK_KEY){updateManagerSummary();if(isEmployee())renderEmployeeTasks()}});
 window.addEventListener('pageshow',updateManagerSummary);
 picker?.addEventListener('change',()=>{
  if(!MODES.includes(picker.value))return;
  previewMode=picker.value;
  try{localStorage.setItem(MODE_KEY,previewMode)}catch{}
  updatePulseAccess();setEmployeeAccountOpen(false);exitTarget='home';syncBack();
  navigate(isEmployee()?'employee':isManager()?'team':'personal');
  resetViewportAtWorkEntry();
 });
 // The separate chat demo perspective must not change the selected app version.
 $('navTasks')?.addEventListener('click',()=>{
  // One dock destination, three meaningful workspaces.
  // Managers enter Business rather than being dropped into private errands;
  // ONE remains entirely personal, while employees land in their work view.
  if(isEmployee()){setEmployeeAccountOpen(false);navigate('employee');return}
  if(isManager()){openBusiness('home');return}
  openPersonal();
 });
 window.addEventListener('hashchange',()=>{
  if(location.hash==='#tasks')routePending();
  else{
   pending=null;
   setEmployeeAccountOpen(false);
   if(location.hash==='#picture'&&!isManager())navigate(isEmployee()?'employee':'personal');
  }
 });
 window.SEYVEO_UNIFIED_TASKS=Object.freeze({openBusiness,openPersonal,openChat,openPulse,returnFromPulse,openPeople});
 window.SEYVEO_PREVIEW=Object.freeze({getMode:()=>previewMode,isManager,isEmployee});
 syncBack();updatePulseAccess();select(isEmployee()?'employee':'personal');
})();
