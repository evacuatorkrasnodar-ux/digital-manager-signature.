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
  employeeChatScreen=$('svcpWorkChatScreen'),employeeChatCanvas=$('svcpWorkChatCanvas'),
  employeeTaskHost=$('unifiedEmployeeAssignments'),
  picker=$('seyveoDemoModeSelect'),previewNotice=$('seyveoDemoModeNotice'),
  employeeAvatar=$('svcpEmployeeAvatar'),employeeResults=$('svcpEmployeeResults'),
  workDashboard=$('svcpWorkDashboard');
 if(!page||!personal||!business||!board||!taskHost||!chatHost||!tasks||!chats)return;
 // The single avatar remains a static identity indicator in the heading.
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
 let exitTarget='home',pending=null,lastWorkView='personal',managerCalendarContext=false;
 const taskTabs=$('unifiedTasksTabs'),managerSignal=$('svcpManagerSignal'),
  managerCalendarTabs=$('managerCalendarTabs'),
  calendarTab=page.querySelector('[data-unified-tasks-tab="calendar"]');
 const businessTab=page.querySelector('[data-unified-tasks-tab="business"]');
 const employeeTab=page.querySelector('[data-unified-tasks-tab="employee"]');
 const managerLabel=page.querySelector('.svcp-manager-kicker');
 const largeNote=$('svcpLargeCompanyNotice');
 const TASK_KEY='seyveo-business-command-tasks-demo-v1';
 const isEmployee=()=>previewMode==='employee';
 const isManager=()=>['rise','autonom','large'].includes(previewMode);
 function updatePulseAccess(){
  // UI preview only. Real access will require verified roles and server authorization.
  if(businessTab)businessTab.hidden=!isManager();
  if(calendarTab)calendarTab.hidden=!isManager();
  if(taskTabs)taskTabs.dataset.manager=String(isManager());
  if(managerCalendarContext&&!isManager()){
   managerCalendarContext=false;
   if(managerCalendarTabs)managerCalendarTabs.hidden=true;
  }
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
 const BREAK_KEY='seyveo-employee-break-schedule-v1';
 const MINUTE_MS=60000;
 const BREAK_DEFAULT={afterMinutes:240,durationMinutes:30,paid:false};
 function safeBreakPolicy(p){
  const after=[120,180,240,300,360],duration=[15,30,45,60];
  return {afterMinutes:after.includes(Number(p?.afterMinutes))?Number(p.afterMinutes):240,
   durationMinutes:duration.includes(Number(p?.durationMinutes))?Number(p.durationMinutes):30,paid:p?.paid===true};
 }
 function readBreakPolicy(){try{return safeBreakPolicy(JSON.parse(localStorage.getItem(BREAK_KEY)||'null'))}
 catch{return {...BREAK_DEFAULT}}}
 function breakWindow(start,policy){const p=safeBreakPolicy(policy),begin=start+p.afterMinutes*MINUTE_MS;
  return {start:begin,end:begin+p.durationMinutes*MINUTE_MS,policy:p};
 }
 function overlapPeriod(a,b,x,y){return Math.max(0,Math.min(b,y)-Math.max(a,x))}
 function sessionWorkedPeriod(session,from,to){
  const gross=overlapPeriod(from,to,session.start,session.end);
  if(!session.breakPolicy||session.breakPolicy.paid)return gross;
  const pause=breakWindow(session.start,session.breakPolicy);
  return Math.max(0,gross-overlapPeriod(from,to,pause.start,Math.min(pause.end,session.end)));
 }
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
  return{start,history,activeBreakPolicy:value?.activeBreakPolicy?safeBreakPolicy(value.activeBreakPolicy):null};
 }
 let employeeHistorySignature='';
 function renderEmployeeClock(){
  if(!isEmployee()||location.hash!=='#tasks')return;
  const now=Date.now(),{start,history,activeBreakPolicy}=readShiftLedger();
  const active=start!==null&&start<=now;
  // Existing active sessions without a policy retain their prior clock behavior.
  const currentBreak=active&&activeBreakPolicy?breakWindow(start,activeBreakPolicy):null;
  const onBreak=!!(currentBreak&&now>=currentBreak.start&&now<currentBreak.end);
  const today=new Date();today.setHours(0,0,0,0);
  const dayStart=today.getTime();
  const weekStart=new Date(today);weekStart.setDate(weekStart.getDate()-(weekStart.getDay()+6)%7);
  const monthStart=new Date(today.getFullYear(),today.getMonth(),1).getTime();
  const sessions=history.map(e=>({start:e.start,end:e.end,breakPolicy:e.breakPolicy||null}));
  if(active)sessions.push({start,end:now,breakPolicy:activeBreakPolicy||null});
  const overlaps=(from,to)=>sessions.reduce((total,item)=>total+sessionWorkedPeriod(item,from,to),0);
  const todayMs=overlaps(dayStart,now),weekMs=overlaps(weekStart.getTime(),now),monthMs=overlaps(monthStart,now);
  const elapsed=active?sessionWorkedPeriod({start,end:now,breakPolicy:activeBreakPolicy||null},start,now):todayMs;
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
  // A session started before the new break scheduler has no retroactive break.
  // Show a truthful plain timeline until the employee starts their next shift.
  const scheduled=active?activeBreakPolicy:readBreakPolicy();
  const plannedMinutes=plannedHours*60;
  // The chart is a physical shift timeline. An unpaid break extends the shift;
  // a paid break fits inside the planned hours. Work totals still use net work.
  const wholeMinutes=plannedMinutes+(scheduled&&!scheduled.paid?scheduled.durationMinutes:0);
  const wholeMs=Math.max(1,wholeMinutes*MINUTE_MS);
  const progressPercent=active?Math.min(100,Math.max(0,(now-start)/wholeMs*100)):0;
  const progressShown=Math.round(progressPercent);
  const clockText=timestamp=>new Date(timestamp).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  if(employeeAvatar){employeeAvatar.dataset.active=String(active);employeeAvatar.dataset.break=String(onBreak)}
  const workDuty=$('svcpWorkDuty'),workDutyText=$('svcpWorkDutyText');
  if(workDuty){workDuty.dataset.active=String(active);workDuty.dataset.break=String(onBreak)}
  if(workDutyText)workDutyText.textContent=onBreak?'На перерыве'
   :active?'На смене · '+short(elapsed)
   :todayMs>0?'Смена завершена · '+short(todayMs):'Не на смене';
  const card=$('svcpEmployeeShiftCard');
  if(card){card.dataset.active=String(active);card.dataset.break=String(onBreak)}
  const time=$('svcpEmployeeClock');
  if(time)time.textContent=hms(elapsed);
  const date=$('svcpEmployeeShiftDate');
  if(date)date.textContent=new Date(now).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
  const hint=$('svcpEmployeeClockHint');
  if(hint)hint.textContent=onBreak?(activeBreakPolicy?.paid?'Оплачиваемый перерыв · время учитывается':'Рабочий таймер на паузе')
   :active?'Начало в '+new Date(start).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})
   :todayMs>0?'Сегодняшняя смена завершена':'Смена не начата';
  const progress=$('svcpEmployeeProgress');
  if(progress){
   progress.setAttribute('aria-valuenow',String(progressShown));
   progress.setAttribute('aria-valuetext',
    !active?'Смена не начата':onBreak?'Идёт перерыв, '+Math.ceil((currentBreak.end-now)/MINUTE_MS)+' мин осталось':
    'Идёт работа, учтено '+short(elapsed));
  }
  const fill=$('svcpEmployeeProgressFill');
  if(fill)fill.style.width=progressPercent+'%';
  const info=$('svcpEmployeeBreakInfo');
  const windowForBar=active?currentBreak:null;
  const bar=$('svcpEmployeeProgress');
  const markPercent=scheduled?Math.min(100,Math.max(0,scheduled.afterMinutes/wholeMinutes*100)):100;
  const markerWidth=scheduled?Math.max(0,Math.min(100-markPercent,scheduled.durationMinutes/wholeMinutes*100)):0;
  if(bar){
   bar.style.setProperty('--svcp-break-left',markPercent+'%');
   bar.style.setProperty('--svcp-break-width',markerWidth+'%');
   bar.style.setProperty('--svcp-now-left',progressPercent+'%');
   bar.dataset.scheduled=String(markerWidth>0);
   bar.dataset.running=String(active);
  }
  const timelineTotal=$('svcpShiftTimelineTotal');
  if(timelineTotal)timelineTotal.textContent=!scheduled?'Старая смена · перерыв не настроен'
   :plannedHours+' ч работы · '+scheduled.durationMinutes+' мин перерыв';
  const timelineStart=$('svcpShiftTimelineStart'),timelineBreak=$('svcpShiftTimelineBreak'),timelineEnd=$('svcpShiftTimelineEnd');
  if(timelineStart)timelineStart.textContent=active?clockText(start):'Начало';
  if(timelineBreak)timelineBreak.textContent=!scheduled?'Без перерыва'
   :active&&currentBreak?clockText(currentBreak.start)+'–'+clockText(currentBreak.end)
   :'Через '+scheduled.afterMinutes/60+' ч';
  if(timelineEnd)timelineEnd.textContent=active?clockText(start+wholeMs):'Финиш';
  if(info){
   if(active&&!scheduled){
    info.textContent='Перерыв по графику применяется со следующей смены';
   }else if(onBreak){
    const remaining=Math.max(0,Math.ceil((currentBreak.end-now)/MINUTE_MS));
    info.textContent='Перерыв · осталось '+remaining+' мин · до '+
     new Date(currentBreak.end).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
   }else if(active&&windowForBar){
    const timeFrom=new Date(currentBreak.start).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
    const timeTo=new Date(currentBreak.end).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
    info.textContent=now<currentBreak.start?'Перерыв по графику · '+timeFrom+'–'+timeTo:
     'Перерыв завершён · работа продолжается';
   }else{
    info.textContent='Перерыв автоматически через '+(scheduled.afterMinutes/60)+' ч · '+scheduled.durationMinutes+' мин';
   }
  }
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
    const duration=document.createElement('strong');duration.textContent=short(sessionWorkedPeriod({start:entry.start,end:entry.end,breakPolicy:entry.breakPolicy||null},entry.start,entry.end));
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
 window.addEventListener('seyveo:shift-updated',renderEmployeeClock);
 window.addEventListener('seyveo:break-schedule-updated',renderEmployeeClock);
 $('seyveoShiftPlanned')?.addEventListener('input',renderEmployeeClock);
 const employeeClockInterval=setInterval(()=>{
  if(isEmployee()&&!document.hidden&&location.hash==='#tasks')renderEmployeeClock();
 },1000);
 document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&isEmployee())renderEmployeeClock();
 });
 window.addEventListener('seyveo:recognition-changed',renderEmployeeThanks);
 window.addEventListener('storage',event=>{
  if(event.key===SHIFT_KEY||event.key===LEGACY_SHIFT_KEY||event.key===BREAK_KEY)renderEmployeeClock();
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
   discuss.addEventListener('click',()=>openWorkChat('dm-elena'));
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
  if(!isEmployee()||!employee)return;
  // Chat stays outside the employee's card layout until its full-size screen opens.
  renderEmployeeTasks();
  renderEmployeeClock();
  renderEmployeeThanks();
 }
 // Reuse the real chat component, message history and camera; never clone a thread.
 let chatReturnFocus=null;
 const chatTop=$('svcpWorkChatBack');
 const chatViewport=window.visualViewport;
 const workComposer=$('svcpChatInput');
 const composerMinHeight=46;
 function resizeWorkComposer(){
  if(page.dataset.workChatOpen!=='true'||!workComposer)return;
  const viewHeight=window.visualViewport?.height||window.innerHeight||700;
  const limit=Math.max(76,Math.min(138,Math.floor(viewHeight*.30)));
  workComposer.style.setProperty('height',composerMinHeight+'px','important');
  // Do not let a long placeholder create a second empty line on Safari.
  const natural=workComposer.value?Math.max(composerMinHeight,workComposer.scrollHeight||composerMinHeight):composerMinHeight;
  const actual=Math.min(limit,natural);
  workComposer.style.setProperty('height',actual+'px','important');
  workComposer.style.setProperty('overflow-y',natural>limit?'auto':'hidden','important');
 }
 function updateWorkChatViewport(){
  if(page.dataset.workChatOpen!=='true'||!employeeChatScreen)return;
  const viewport=window.visualViewport;
  const height=Math.max(160,Math.round(viewport?.height||window.innerHeight));
  const top=Math.max(0,Math.round(viewport?.offsetTop||0));
  employeeChatScreen.style.setProperty('--svcp-visible-height',height+'px');
  employeeChatScreen.style.setProperty('--svcp-visible-top',top+'px');
  resizeWorkComposer();
 }
 function closeWorkChat({restoreFocus=true}={}){
  if(page.dataset.workChatOpen!=='true')return;
  window.dispatchEvent(new Event('seyveo:work-chat-closing'));
  const composer=$('svcpChatInput');if(composer){
   composer.blur();composer.rows=1;
   composer.style.removeProperty('height');composer.style.removeProperty('overflow-y')
  }
  // The original chat still belongs to the manager's hub while it is closed.
  if(chatHost.parentElement!==board)board.insertBefore(chatHost,taskHost);
  chatHost.hidden=true;
  page.dataset.workChatOpen='false';
  employeeChatScreen.hidden=true;
  document.documentElement.classList.remove('svcp-work-chat-active');
  employeeChatScreen.style.removeProperty('--svcp-visible-height');
  employeeChatScreen.style.removeProperty('--svcp-visible-top');
  const heading=page.querySelector('.tasks-heading');
  if(heading)heading.inert=false;
  if(employee)employee.inert=false;
  if(business)business.inert=false;
  const previous=chatReturnFocus;chatReturnFocus=null;
  if(restoreFocus&&previous?.isConnected&&!previous.hidden)
   requestAnimationFrame(()=>previous.focus({preventScroll:true}));
 }
 function openWorkChat(roomId=null,{camera=false}={}){
  if((!isEmployee()&&!isManager())||!employeeChatScreen||!employeeChatCanvas)return;
  const employeeMode=isEmployee();
  if(employeeMode&&page.dataset.employeeMode!=='true')select('employee');
  if(!employeeMode&&business.hidden)select('business');
  if(page.dataset.workChatOpen!=='true')chatReturnFocus=document.activeElement;
  employeeChatScreen.hidden=false;
  page.dataset.workChatOpen='true';
  employeeChatCanvas.appendChild(chatHost);
  chatHost.hidden=false;chats.hidden=false;
  document.documentElement.classList.add('svcp-work-chat-active');
  const heading=page.querySelector('.tasks-heading');
  if(heading)heading.inert=true;
  if(employee)employee.inert=true;
  if(business)business.inert=true;
  const input=$('svcpChatInput');if(input)input.rows=1;
  chatTop?.setAttribute('aria-label',employeeMode?'Вернуться к моей работе':'Вернуться в пульт руководителя');
  const headingTitle=$('svcpWorkChatTitle');
  if(headingTitle)headingTitle.textContent='Сообщения';
  // Null opens the complete existing directory. Staff and management share one engine.
  window.SEYVEO_BUSINESS_COMMAND?.showChat?.(roomId,employeeMode?'elena':'manager');
  updateWorkChatViewport();
  requestAnimationFrame(()=>{
   if(page.dataset.workChatOpen!=='true')return;
   updateWorkChatViewport();
   chatTop?.focus({preventScroll:true});
   if(camera){
    const toggle=$('svcpCameraToggle');
    if(toggle?.getAttribute('aria-expanded')!=='true')toggle?.click();
   }
  });
 }
 chatTop?.addEventListener('click',()=>closeWorkChat());
 workComposer?.addEventListener('input',resizeWorkComposer);
 workComposer?.addEventListener('focus',resizeWorkComposer);
 window.addEventListener('seyveo:work-chat-sent',resizeWorkComposer);
 chatViewport?.addEventListener('resize',updateWorkChatViewport);
 chatViewport?.addEventListener('scroll',updateWorkChatViewport);
 window.addEventListener('resize',updateWorkChatViewport);
 document.addEventListener('keydown',event=>{
  if(page.dataset.workChatOpen!=='true')return;
  if(event.key==='Escape'){
   event.preventDefault();
   if(!$('svcpConversation')?.hidden)$('svcpConversationBack')?.click();
   else closeWorkChat();
   return;
  }
  if(event.key!=='Tab')return;
  const focusables=Array.from(employeeChatScreen.querySelectorAll('button:not([disabled]):not([hidden]),textarea:not([disabled]),input:not([disabled]):not([hidden]),select:not([disabled])'))
   .filter(el=>el.getClientRects().length&&el.offsetParent!==null);
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 });
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
  if(label)label.textContent=page.dataset.employeeMode==='true'?'К моим делам'
   :(exitTarget==='manage'?'В бизнес':'На Главную');
 }
 $('unifiedTasksBack')?.addEventListener('click',()=>{
  // Work is a dedicated page, and Back leads to the personal Tasks selector.
  if(page.dataset.workChatOpen==='true'){closeWorkChat();return}
  if(isEmployee()&&page.dataset.employeeMode==='true'){
   select('personal');resetViewportAtWorkEntry();return;
  }
  if(exitTarget==='manage'){
   window.SEYVEO_BUSINESS_NAV?.returnToMenu?.();
   if(location.hash!=='#manage')location.hash='#manage';
  }else $('navHome')?.click();
 });
 function restoreManagerChat(){
  // Keep chats ahead of the manager's task list, without a duplicate DOM.
  if(chatHost.parentElement!==board)board.insertBefore(chatHost,taskHost);
  if(chats.parentElement!==chatHost)chatHost.appendChild(chats);
  chatHost.hidden=true;chats.hidden=false;
 }
 function showBoard(){
  board.hidden=false;
  if(page.dataset.workChatOpen!=='true')restoreManagerChat();
  updateManagerSummary();
  // The messenger is a destination, not an inline card in the business hub.
  if(page.dataset.workChatOpen!=='true')chatHost.hidden=true;
 }
 function select(view){
  if(view==='pulse'){openPulse();return}
  const chosen=isEmployee()?(view==='personal'?'personal':'employee'):
   isManager()?(view==='business'?'business':'personal'):'personal';
  lastWorkView=chosen;
  // A route change closes the messenger before moving its live DOM back.
  if(page.dataset.workChatOpen==='true')closeWorkChat({restoreFocus:false});
  page.dataset.employeeMode=String(chosen==='employee');
  const title=$('tasksTitle');
  if(title)title.textContent=chosen==='employee'?'Моя работа':
   chosen==='business'?'Кабинет руководителя':'Дела';
  page.dataset.workView=chosen;
  if(taskTabs)taskTabs.hidden=false;
  if(managerSignal)managerSignal.hidden=chosen!=='business';
  const caption=page.querySelector('.tasks-heading .manage-caption');
  if(caption){
   caption.hidden=chosen==='business';
   if(caption.lastChild?.nodeType===3)
    caption.lastChild.textContent=chosen==='employee'?' РАБОЧИЙ ДЕНЬ':' НА КОНТРОЛЕ';
  }
  personal.hidden=chosen!=='personal';business.hidden=chosen!=='business';
  if(employee)employee.hidden=chosen!=='employee';
  if(employeeAvatar)employeeAvatar.hidden=chosen!=='employee';
  if(chosen!=='employee'&&employeeResults){
   employeeResults.hidden=true;
   const resultsButton=workDashboard?.querySelector('[data-svcp-work-action="results"]');
   resultsButton?.setAttribute('aria-expanded','false');
  }
  if(overview)overview.hidden=chosen!=='personal';
  if(chosen==='business')showBoard();
  if(chosen==='employee')showEmployee();
  page.querySelectorAll('[data-unified-tasks-tab]').forEach(button=>
   button.setAttribute('aria-pressed',String(button.dataset.unifiedTasksTab===chosen)));
  syncBack();
 }
 function openManagerCalendar(){
  if(!isManager())return;
  if(page.dataset.workChatOpen==='true')closeWorkChat({restoreFocus:false});
  managerCalendarContext=true;
  if(managerCalendarTabs)managerCalendarTabs.hidden=false;
  // Reuse the ONE existing Calendar page, never clone it into a work panel.
  // A preview-role check is still required; native server roles come later.
  if(location.hash!=='#calendar')location.hash='#calendar';
  window.dispatchEvent(new CustomEvent('seyveo:calendar-manager-context',
   {detail:{active:true}}));
 }
 function showChat(roomId,viewpoint,filter){
  if(isEmployee()){
   if(page.dataset.workChatOpen!=='true')select('employee');
   openWorkChat(roomId||null);
   return;
  }
  if(!isManager()){select('personal');return}
  // Always update the heading and hide the personal/business selector first.
  select('business');
  openWorkChat(roomId||null);
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
   pending=null;
   if(button.dataset.unifiedTasksTab==='calendar'){openManagerCalendar();return}
   select(button.dataset.unifiedTasksTab);
  }));
 managerCalendarTabs?.addEventListener('click',event=>{
  const tab=event.target.closest('[data-manager-calendar-tab]');
  if(!tab||!managerCalendarContext||!isManager())return;
  if(tab.dataset.managerCalendarTab==='calendar')return;
  // Keep the back destination and task/chat state intact across pages.
  navigate(tab.dataset.managerCalendarTab==='business'?'team':'personal');
 });
 // Shortcut tiles use existing task/chat/camera and inline results; no duplicate UIs.
 workDashboard?.addEventListener('click',event=>{
  const button=event.target.closest('[data-svcp-work-action]');
  if(!button||!isEmployee())return;
  const action=button.dataset.svcpWorkAction;
  if(action==='results'){
   if(!employeeResults)return;
   const open=employeeResults.hidden;
   employeeResults.hidden=!open;
   button.setAttribute('aria-expanded',String(open));
   if(open){renderEmployeeClock();renderEmployeeThanks();
    requestAnimationFrame(()=>employeeResults.scrollIntoView({behavior:'smooth',block:'start'}));
   }
   return;
  }
  if(action==='tasks'){
   $('unifiedEmployeeAssignments')?.closest('.svcp-employee-assignments')?.scrollIntoView({block:'start',behavior:'smooth'});
   return;
  }
  if(action==='chats')openWorkChat();
  if(action==='camera')openWorkChat('dm-elena',{camera:true});
 });
 const businessActions=page.querySelector('.svcp-manager-actions');
 businessActions?.addEventListener('click',event=>{
  const button=event.target.closest('[data-business-hub]');
  if(!button||!isManager())return;
  const kind=button.dataset.businessHub;
  if(kind==='pulse')openPulse();
  if(kind==='chats')openWorkChat();
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
  const signal=$('svcpManagerSignal');
  try{
   const rows=JSON.parse(localStorage.getItem(TASK_KEY)||'[]');
   const count=Array.isArray(rows)?rows.filter(r=>r&&typeof r.text==='string'&&!r.done).length:0;
   if(signal)signal.dataset.attention=count?'true':'false';
   summary.textContent=count
    ?('Сэйви · '+count+' '+(count===1?'поручение':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'поручения':'поручений')+' в работе · локально')
    :'Сэйви · Всё спокойно · локальное демо';
  }catch{
   if(signal)signal.dataset.attention='false';
   summary.textContent='Сэйви · Локальные поручения недоступны';
  }
 }
 staffReveal?.addEventListener('toggle',()=>{
  if(staffReveal.open)window.SEYVEO_BUSINESS_COMMAND?.openPeopleView?.('team');
 });
 window.addEventListener('seyveo:manager-tasks-updated',()=>{updateManagerSummary();if(isEmployee())renderEmployeeTasks()});
 window.addEventListener('storage',event=>{if(event.key===TASK_KEY){updateManagerSummary();if(isEmployee())renderEmployeeTasks()}});
 window.addEventListener('pageshow',updateManagerSummary);
 picker?.addEventListener('change',()=>{
  if(!MODES.includes(picker.value))return;
  closeWorkChat({restoreFocus:false});
  previewMode=picker.value;
  try{localStorage.setItem(MODE_KEY,previewMode)}catch{}
  updatePulseAccess();
  // Change account, not just the heading: clear the messenger's ephemeral
  // filters/selection so the manager cannot inherit Elena's open chat state.
  window.SEYVEO_BUSINESS_COMMAND?.resetChatForRoleChange?.();
  exitTarget='home';syncBack();
  navigate(isEmployee()?'employee':isManager()?'team':'personal');
  resetViewportAtWorkEntry();
 });
 // The separate chat demo perspective must not change the selected app version.
 $('navTasks')?.addEventListener('click',()=>{
  // One dock destination, three meaningful workspaces.
  // Managers enter Business rather than being dropped into private errands;
  // ONE remains entirely personal, while employees land in their work view.
  if(isEmployee()){navigate('employee');return}
  if(isManager()){openBusiness('home');return}
  openPersonal();
 });
 window.addEventListener('hashchange',()=>{
  if(location.hash!=='#calendar'){
   managerCalendarContext=false;
   if(managerCalendarTabs)managerCalendarTabs.hidden=true;
  }
  if(location.hash==='#tasks')routePending();
  else{
   closeWorkChat({restoreFocus:false});
   pending=null;
   if(location.hash==='#picture'&&!isManager())navigate(isEmployee()?'employee':'personal');
  }
 });
 window.SEYVEO_UNIFIED_TASKS=Object.freeze({openBusiness,openPersonal,openChat,openPulse,returnFromPulse,openPeople});
 window.SEYVEO_PREVIEW=Object.freeze({getMode:()=>previewMode,isManager,isEmployee});
 syncBack();updatePulseAccess();select(isEmployee()?'employee':'personal');
})();
