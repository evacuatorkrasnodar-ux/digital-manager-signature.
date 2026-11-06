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
 const PREVIEW_STRUCTURE_KEY='seyveo-demo-preview-structure-v1';
 const MODES=['one','rise','autonom','large','employee'];
 const TIERS=['one','rise','autonom'];
 const PREVIEW_OPTIONS={
  one:['personal','family'],rise:['start','operating'],autonom:['standard','enterprise']
 };
 const tierPicker=$('seyveoPreviewTiers'),roleGroup=$('seyveoDemoRoleGroup');
 let previewMode='autonom';
 try{const stored=localStorage.getItem(MODE_KEY);if(MODES.includes(stored))previewMode=stored}catch{}
 let previewTier=previewMode==='one'?'one':previewMode==='rise'?'rise':'autonom';
 let previewRole=previewMode==='employee'?'employee':'manager';
 let previewOptions={one:'personal',rise:'operating',autonom:previewMode==='large'?'enterprise':'standard'};
 const previewModeFor=()=>previewTier==='one'?'one':previewRole==='employee'?'employee':
  previewTier==='rise'?'rise':previewOptions.autonom==='enterprise'?'large':'autonom';
 try{
  const saved=JSON.parse(localStorage.getItem(PREVIEW_STRUCTURE_KEY)||'null');
  if(saved&&TIERS.includes(saved.tier)){
   previewTier=saved.tier;
   previewRole=saved.role==='employee'?'employee':'manager';
   for(const tier of TIERS){
    if(PREVIEW_OPTIONS[tier].includes(saved.options?.[tier]))previewOptions[tier]=saved.options[tier];
   }
   if(previewTier==='one')previewRole='manager';
   previewMode=previewModeFor();
  }
 }catch{}
 let exitTarget='home',pending=null,lastWorkView='personal',pulseReturnView='business',managerCalendarContext=false;
 let businessFromPersonal=false;
 const taskTabs=$('unifiedTasksTabs'),managerSignal=$('svcpManagerSignal'),
  managerCalendarTabs=$('managerCalendarTabs'),
  calendarTab=page.querySelector('[data-unified-tasks-tab="calendar"]');
 const businessTab=page.querySelector('[data-unified-tasks-tab="business"]');
 const employeeTab=page.querySelector('[data-unified-tasks-tab="employee"]');
 const managerLabel=page.querySelector('.svcp-manager-kicker');
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
  if(managerLabel)managerLabel.textContent=previewTier==='autonom'&&previewOptions.autonom==='enterprise'
   ?'AUTONOM ENTERPRISE · ДЕМО':previewTier.toUpperCase()+' · SEYVEO · ДЕМО';
  if(picker)picker.value=previewMode;
  if(tierPicker){
   tierPicker.querySelectorAll('[data-preview-tier]').forEach(button=>
    button.setAttribute('aria-pressed',String(button.dataset.previewTier===previewTier)));
   tierPicker.querySelectorAll('[data-preview-tier-row]').forEach(row=>
    row.dataset.active=String(row.dataset.previewTierRow===previewTier));
   tierPicker.querySelectorAll('[data-preview-option]').forEach(button=>{
    const [tier,option]=button.dataset.previewOption.split(':');
    button.setAttribute('aria-pressed',String(tier===previewTier&&previewOptions[tier]===option));
   });
  }
  if(roleGroup){
   roleGroup.hidden=previewTier==='one';
   roleGroup.querySelectorAll('[data-preview-role]').forEach(button=>
    button.setAttribute('aria-pressed',String(button.dataset.previewRole===previewRole)));
  }
  if(previewNotice){
   const explanation=previewTier==='one'
    ?previewOptions.one==='family'
      ?'ONE Family · семейный вариант ONE с личными профилями. Отдельная подписка не создаётся.'
      :'ONE · личная жизнь и Сэйви без бизнес-пульта.'
    :previewTier==='rise'
     ?previewOptions.rise==='start'
       ?'RISE · запуск бизнеса с нуля. Это сценарий работы внутри RISE.'
       :'RISE · развитие действующего бизнеса. Это тот же уровень RISE.'
     :previewOptions.autonom==='enterprise'
      ?'AUTONOM Enterprise · крупная компания, роли и индивидуальное внедрение. Не четвёртый тариф.'
      :'AUTONOM · самостоятельное управление бизнесом в разрешённых пределах.';
   previewNotice.textContent=explanation+(previewTier!=='one'
    ?(previewRole==='employee'?' Вид сотрудника: Елена.':' Вид руководителя.'):'')
    +' Только демо: тариф и реальные права не меняются.';
  }
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
 // Photos in this FIRST preview remain only in the current tab's memory.
 // Never upload them, write them to localStorage or include them in task JSON.
 const demoPhotos=new Map();
 window.SEYVEO_APPROVAL_DEMO_PHOTO=Object.freeze({get:id=>demoPhotos.get(id)||null});
 window.addEventListener('pagehide',()=>{
  for(const url of demoPhotos.values())URL.revokeObjectURL(url);
  demoPhotos.clear();
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
   if(task.approvalFlow===true){
    row.classList.add('svcp-approval-employee-row');
    const title=document.createElement('strong');title.className='svcp-approval-task-title';title.textContent=task.text;
    const names={assigned:'Новое поручение',review:'Отправлено руководителю',rework:'Нужна доработка',approved:'Принято руководителем'};
    const state=document.createElement('small');state.className='svcp-approval-demo-state';
    state.textContent=names[task.reviewStatus]||names.assigned;
    row.append(title,state);
    if(task.reportText){
     const report=document.createElement('p');report.className='svcp-approval-demo-report';
     report.textContent='Твой отчёт: '+String(task.reportText).slice(0,350);row.append(report);
    }
    if(task.reviewStatus==='assigned'||task.reviewStatus==='rework'){
     const form=document.createElement('form');form.className='svcp-approval-report-form';
     const label=document.createElement('label');label.textContent='Что сделано';
     const note=document.createElement('textarea');note.rows=2;note.maxLength=350;
     note.placeholder='Например: проверила полку, поправила ценники';
     note.setAttribute('aria-label','Отчёт о выполнении: '+task.text);
     label.append(note);form.append(label);
     const photo=document.createElement('label');photo.className='svcp-approval-photo-label';
     photo.textContent='Фото результата · необязательно';
     const file=document.createElement('input');file.type='file';file.accept='image/*';
     file.setAttribute('capture','environment');file.setAttribute('aria-label','Выбрать фото результата');
     photo.append(file);form.append(photo);
     const hint=document.createElement('small');hint.className='svcp-approval-demo-note';
     hint.textContent='Фото только для просмотра в этой вкладке, не сохраняется и не отправляется.';
     form.append(hint);
     file.addEventListener('change',()=>{
      const selected=file.files?.[0];if(!selected)return;
      if(!selected.type.startsWith('image/')||selected.size>8*1024*1024){
       file.value='';hint.textContent='Выберите фото не более 8 МБ.';return;
      }
      const prev=demoPhotos.get(task.id);if(prev)URL.revokeObjectURL(prev);
      demoPhotos.set(task.id,URL.createObjectURL(selected));
      hint.textContent='Фото выбрано · доступно только до закрытия вкладки.';
     });
     const send=document.createElement('button');send.type='submit';
     send.className='svcp-approval-submit';send.textContent='Передать на проверку';
     form.append(send);
     form.addEventListener('submit',event=>{
      event.preventDefault();
      if(!isEmployee())return;
      const report=note.value.trim();if(!report){note.focus();return}
      let fresh=[];try{const value=JSON.parse(localStorage.getItem(TASK_KEY)||'[]');if(Array.isArray(value))fresh=value}catch{}
      if(!fresh.some(t=>t?.id===task.id&&t.approvalFlow===true&&t.assigneeId==='elena'&&
       (t.reviewStatus==='assigned'||t.reviewStatus==='rework')))return;
      const updated=fresh.map(t=>t.id===task.id?{
       ...t,reviewStatus:'review',reportText:report.slice(0,350),
       photoSelected:demoPhotos.has(task.id),submittedAt:Date.now(),done:false
      }:t);
      try{localStorage.setItem(TASK_KEY,JSON.stringify(updated))}
      catch{hint.textContent='Не удалось сохранить учебный отчёт на устройстве.';return}
      window.dispatchEvent(new Event('seyveo:employee-task-updated'));
      renderEmployeeTasks();
     });
     row.append(form);
    }else if(task.reviewStatus==='review'){
     const next=document.createElement('button');next.type='button';
     next.className='svcp-approval-demo-switch';next.textContent='Посмотреть как руководитель';
     next.addEventListener('click',()=>window.SEYVEO_UNIFIED_TASKS?.previewRole?.('manager'));
     row.append(next);
    }
    employeeTaskHost.append(row);continue;
   }
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
 // Only one existing dock. Reparent it while the chat directory is visible,
 // then return it to its exact original location when leaving the screen.
 const sharedDock=document.querySelector('footer.dock');
 const dockMarker=sharedDock?document.createComment('SEYVEO work chat dock origin'):null;
 if(sharedDock&&dockMarker)sharedDock.parentNode.insertBefore(dockMarker,sharedDock);
 function attachWorkChatDock(){
  if(!sharedDock||!employeeChatScreen)return;
  if(sharedDock.parentElement!==employeeChatScreen)employeeChatScreen.appendChild(sharedDock);
 }
 function restoreWorkChatDock(){
  if(sharedDock&&dockMarker?.parentNode)dockMarker.parentNode.insertBefore(sharedDock,dockMarker.nextSibling);
 }
 const chatTop=$('svcpWorkChatBack');
 // Dock destination buttons must close the chat shell before the normal
 // existing route handlers run; no duplicate nav or route implementation.
 sharedDock?.addEventListener('click',event=>{
  if(page.dataset.workChatOpen!=='true')return;
  const button=event.target.closest?.('button');
  if(!button||!['navHome','navTasks','navPicture','navManage','assistantButton'].includes(button.id))return;
  closeWorkChat({restoreFocus:false});
 },true);
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
  restoreWorkChatDock();
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
  attachWorkChatDock();
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
   pulseReturnView=lastWorkView;
  }else{
   pulseReturnView='business';
  }
  if(options?.efficiency)$('pictureEfficiency')?.setAttribute('open','');
  if(location.hash!=='#picture')location.hash='#picture';
  else window.dispatchEvent(new Event('seyveo:picture-open'));
 }
 function returnFromPulse(){navigate(pulseReturnView==='business'?'team':'personal')}
 function syncBack(){
  const button=$('unifiedTasksBack');
  const employeeSubpage=page.dataset.employeeMode==='true';
  const businessSubpage=page.dataset.workView==='business'&&businessFromPersonal;
  // Home is a permanent dock destination: do not duplicate it in the root
  // personal Tasks screen. Keep Back for genuine nested work routes.
  // "Мои дела / Календарь / Кабинет" is the route selector.
  // A duplicate "К делам" back link makes Cabinet look like a subpage.
  // Keep Back for real employee subpages and return to Management.
  const nested=employeeSubpage||exitTarget==='manage';
  if(button)button.hidden=!nested;
  const label=$('unifiedTasksBackLabel');
  if(label)label.textContent=employeeSubpage?'К моим делам'
   :(exitTarget==='manage'?'В бизнес':'Главная');
 }
 $('unifiedTasksBack')?.addEventListener('click',()=>{
  // Work is a dedicated page, and Back leads to the personal Tasks selector.
  if(page.dataset.workChatOpen==='true'){closeWorkChat();return}
  if(isEmployee()&&page.dataset.employeeMode==='true'){
   select('personal');resetViewportAtWorkEntry();return;
  }
  if(page.dataset.workView==='business'&&businessFromPersonal){
   businessFromPersonal=false;select('personal');resetViewportAtWorkEntry();return;
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
   chosen==='business'?'Кабинет':'Дела';
  page.dataset.workView=chosen;
  syncBack();
  if(taskTabs)taskTabs.hidden=false;
  if(managerSignal)managerSignal.hidden=true;
  const caption=page.querySelector('.tasks-heading .manage-caption');
  if(caption){
   // On personal Tasks the title already identifies the destination.
   // Keep the brand eyebrow only in business/employee workspaces.
   caption.hidden=chosen==='personal'||chosen==='business';
   if(caption.lastChild?.nodeType===3)
    caption.lastChild.textContent=chosen==='employee'?' РАБОЧИЙ ДЕНЬ':
     chosen==='business'?' BUSINESS':' НА КОНТРОЛЕ';
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
  if(source!=='preserve'){
   exitTarget=source==='home'?'home':'manage';
   businessFromPersonal=false;
  }
  syncBack();navigate('team');
 }
 function openChat(source='tasks',roomId=null,viewpoint='manager',filter='all'){
  if(source==='manage')exitTarget='manage';
  else if(source==='home')exitTarget='home';
  syncBack();navigate('chat',roomId,viewpoint,filter);
 }
 function openPersonal(){
  businessFromPersonal=false;
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
   if(button.dataset.unifiedTasksTab==='business'&&page.dataset.workView==='personal')
    businessFromPersonal=true;
   else if(button.dataset.unifiedTasksTab==='personal')businessFromPersonal=false;
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
    ?('Сэйви · '+count+' '+(count===1?'поручение':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'поручения':'поручений')+' в работе')
    :'Сэйви · Всё спокойно';
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
 function applyPreviewSelection(){
  closeWorkChat({restoreFocus:false});
  previewMode=previewModeFor();
  try{
   localStorage.setItem(MODE_KEY,previewMode);
   localStorage.setItem(PREVIEW_STRUCTURE_KEY,JSON.stringify({
    tier:previewTier,role:previewRole,options:previewOptions
   }));
  }catch{}
  updatePulseAccess();
  // Real access is unchanged. Clear the old role's local chat view only.
  window.SEYVEO_BUSINESS_COMMAND?.resetChatForRoleChange?.();
  exitTarget='home';syncBack();
  navigate(isEmployee()?'employee':isManager()?'team':'personal');
  resetViewportAtWorkEntry();
 }
 tierPicker?.addEventListener('click',event=>{
  const option=event.target.closest('[data-preview-option]');
  const tierButton=event.target.closest('[data-preview-tier]');
  if(option){
   const [tier,variant]=option.dataset.previewOption.split(':');
   if(!TIERS.includes(tier)||!PREVIEW_OPTIONS[tier].includes(variant))return;
   previewTier=tier;previewOptions[tier]=variant;
  }else if(tierButton){
   const tier=tierButton.dataset.previewTier;
   if(!TIERS.includes(tier))return;
   previewTier=tier;
  }else return;
  if(previewTier==='one')previewRole='manager';
  applyPreviewSelection();
 });
 roleGroup?.addEventListener('click',event=>{
  const button=event.target.closest('[data-preview-role]');
  if(!button||previewTier==='one')return;
  const role=button.dataset.previewRole;
  if(role!=='manager'&&role!=='employee')return;
  previewRole=role;applyPreviewSelection();
 });
 // Compatibility with existing stored/automated legacy preview modes.
 picker?.addEventListener('change',()=>{
  if(!MODES.includes(picker.value))return;
  const mode=picker.value;
  previewTier=mode==='one'?'one':mode==='rise'?'rise':'autonom';
  previewRole=mode==='employee'?'employee':'manager';
  if(mode==='large')previewOptions.autonom='enterprise';
  if(mode==='autonom')previewOptions.autonom='standard';
  applyPreviewSelection();
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
 function switchPreviewRole(role){
  if(role!=='manager'&&role!=='employee')return;
  // This is ONLY a view switch on one phone, not authorization.
  if(previewTier==='one')previewTier='rise';
  previewRole=role;
  applyPreviewSelection();
 }
 window.SEYVEO_UNIFIED_TASKS=Object.freeze({
  openBusiness,openPersonal,openChat,openPulse,returnFromPulse,openPeople,previewRole:switchPreviewRole
 });
 window.SEYVEO_PREVIEW=Object.freeze({getMode:()=>previewMode,isManager,isEmployee});
 syncBack();updatePulseAccess();select(isEmployee()?'employee':'personal');
})();


/* SEYVEO Smart Cabinet · manual tool layout, phase 1.
 * This saves visual preferences on ONE device. It never grants authority,
 * adds accounts, duplicates data or impersonates unfinished integrations.
 * The manager permission shown elsewhere is only a local preview role.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const root=$('unifiedBusinessTasksView'),list=root?.querySelector('.svcp-manager-actions');
 const dialog=$('svCabinetDialog'),launch=$('svCabinetConfigure');
 const empty=$('svCabinetEmpty');
 const catalogHost=$('svCabinetCatalog'),search=$('svCabinetSearch');
 const guideHost=$('svCabinetGuide'),searchWrap=search?.closest('.sv-cabinet-search');
 const saveButton=$('svCabinetSave'),cancelButton=$('svCabinetCancel');
 const resetButton=$('svCabinetReset'),status=$('svCabinetStatus');
 if(!root||!list||!dialog||!launch||!empty||!catalogHost||!search||!guideHost)return;
 const KEY='seyveo-cabinet-layout-v1';
 // A prominent, single-purpose continuation above cabinet tools while setup is unfinished.
 const resume=$('svCabinetContinueWithSayvi');
 function syncResume(){
  if(!resume)return;
  let complete=false;
  try{complete=localStorage.getItem(KEY)!==null}catch{}
  resume.hidden=complete;
 }
 resume?.addEventListener('click',()=>{
  // Reuse the existing Sayvi onboarding route; never create a parallel questionnaire.
  const existing=$('svCabinetStartWithSayvi');
  if(existing)existing.click();
  else launch.click();
 });
 window.addEventListener('storage',event=>{if(event.key===KEY)syncResume()});
 syncResume();
 const ready=[
  {id:'pulse',name:'Пульс бизнеса',category:'Управление',description:'Клиенты, продажи, показатели',tags:'директор аналитика руководитель результаты выручка'},
  {id:'chats',name:'Чаты команды',category:'Общение',description:'Рабочие переписки',tags:'мессенджер сообщения коллектив связь персонал'},
  {id:'mail',name:'Рабочая почта',category:'Общение',description:'Письма и черновики',tags:'помощник секретарь сообщения'},
  {id:'documents',name:'Документы бизнеса',category:'Документы',description:'Договоры и согласования',tags:'юрист бухгалтер договор акты счета документы подписи'},
  {id:'company',name:'Моя компания',category:'Управление',description:'Контакты и QR-визитка',tags:'организация реквизиты ип визитка'},
  {id:'people',name:'Сотрудники и кадры',category:'Команда и кадры',description:'Карточки, смены, подбор',tags:'кадровик отдел кадров персонал график отпуска найм кассир'}
 ];
 const upcoming=[
  {name:'Склад',category:'Склад и торговля',description:'Остатки, приёмка, инвентаризация',tags:'кладовщик товары штрихкод учет склад'},
  {name:'Логистика',category:'Логистика',description:'Маршруты, транспорт, доставка',tags:'логист водитель отгрузка перевозка'},
  {name:'Бухгалтерия',category:'Бухгалтерия и финансы',description:'Учёт, отчёты и платежи',tags:'бухгалтер кассир налоги зарплата'},
  {name:'Юридические процессы',category:'Юридический отдел',description:'Согласование и контроль сроков',tags:'юрист претензии договоры'},
  {name:'Производство',category:'Производство',description:'Задания, материалы, качество',tags:'цех мастер инженер'},
  {name:'Продажи и заказы',category:'Продажи',description:'Сделки, товары и заказы',tags:'менеджер торговля магазин'}
 ];
 // Goal-first labels are intentionally ordinary language, not internal module names.
 const GOALS={
  pulse:{title:'Следить за продажами',description:'Выручка, клиенты и результаты',benefit:'SEYVEO соберёт показатели в разделе «Пульс бизнеса». Для реальных цифр понадобится источник данных.',hint:'В текущем прототипе показатели могут быть учебными. Добавление инструмента не подключает 1С или CRM.',sources:true},
  chats:{title:'Общаться с командой',description:'Рабочие и групповые переписки',benefit:'Открывайте существующие рабочие чаты из кабинета.',hint:'Сейчас часть переписок работает локально на устройстве. Между сотрудниками потребуется защищённая серверная связь.'},
  mail:{title:'Работать с письмами',description:'Почта и черновики',benefit:'Открывайте рабочую почту из кабинета.',hint:'Для реальной переписки потребуется подключить почтовый ящик с отдельным разрешением.'},
  documents:{title:'Готовить документы',description:'Договоры и согласования',benefit:'Быстрый доступ к документам и подготовке договоров.',hint:'Реальные корпоративные документы потребуют подключённого хранилища и настроенных прав доступа.'},
  company:{title:'Хранить реквизиты компании',description:'Контакты и QR-визитка',benefit:'Открывайте карточку организации, реквизиты и QR-визитку.',hint:'Данные карточки в текущем прототипе сохраняются локально на устройстве.'},
  people:{title:'Управлять сотрудниками',description:'Карточки, смены и подбор',benefit:'Рабочий раздел с сотрудниками, сменами и поручениями.',hint:'Пока учебные сотрудники и графики находятся в локальном прототипе; права реальных людей будут назначаться отдельно.'}
 };
 const SOURCES=[
  {id:'1c',name:'1С',note:'Интеграция с 1С ещё не готова. Для реальных данных потребуется определить конфигурацию базы и согласовать подключение с администратором.'},
  {id:'bitrix',name:'Битрикс24',note:'Прямое подключение Битрикс24 пока не реализовано. В рабочей версии потребуется авторизация владельца и разрешение на чтение нужных данных.'},
  {id:'file',name:'Excel / CSV',note:'Импорт таблиц в показатели пока не реализован. Не загружайте конфиденциальные рабочие файлы в неподготовленные формы.'},
  {id:'manual',name:'Вручную',note:'Ввод реальных продаж вручную пока не реализован. Сейчас доступен только существующий локальный прототип раздела.'},
  {id:'later',name:'Подключить позже',note:'Можно добавить «Пульс бизнеса» в кабинет сейчас. Это не означает, что реальный источник данных уже подключён.'}
 ];
 const DEFAULT=ready.map(item=>item.id);
 const itemById=new Map(ready.map(item=>[item.id,item]));
 const tools=new Map(DEFAULT.map(id=>[id,list.querySelector('[data-cabinet-tool="'+id+'"]')]));
 if([...tools.values()].some(node=>!node))return;
 let selected=read(),draft=null,returnFocus=null,activeGoal=null,sourceChoice=null;
 const normalize=value=>String(value||'').toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
 function read(){
  try{
   const record=JSON.parse(localStorage.getItem(KEY)||'null');
   if(!record||!Array.isArray(record.order))return DEFAULT.slice();
   // Whitelist known module IDs. Future versions will safely ignore old IDs.
   return [...new Set(record.order.filter(id=>typeof id==='string'&&itemById.has(id)))];
  }catch{return DEFAULT.slice()}
 }
 function apply(){
  const order=[...selected,...DEFAULT.filter(id=>!selected.includes(id))];
  for(const id of order){
   const node=tools.get(id);
   list.appendChild(node); // Move, never clone: existing listeners and content survive.
   node.hidden=!selected.includes(id);
  }
  empty.hidden=selected.length!==0;
  launch.setAttribute('aria-label','Настроить кабинет, выбрано '+selected.length+' инструментов');
 }
 const node=(tag,className,label)=>{
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(label!==undefined)el.textContent=label;
  return el;
 };
 const button=(label,action,id)=>{
  const b=node('button','sv-cabinet-action',label);
  b.type='button';b.dataset.cabinetAction=action;
  if(id)b.dataset.cabinetId=id;
  return b;
 };
 function matches(item,query){
  return !query||normalize([GOALS[item.id]?.title,item.name,item.category,item.description,item.tags].join(' ')).includes(query);
 }
 function renderCatalog(){
  catalogHost.replaceChildren();
  const q=normalize(search.value);
  const found=ready.filter(item=>matches(item,q));
  for(const item of found){
   const goal=GOALS[item.id],checked=draft.includes(item.id);
   // Tap the task for a human explanation; plus/check changes the layout.
   const row=node('div','sv-cabinet-goal-row');
   const detail=button('','guide',item.id);
   detail.className='sv-cabinet-goal-detail';
   detail.setAttribute('aria-label','Как работает: '+goal.title);
   const copy=node('span','sv-cabinet-choice-copy');
   copy.append(node('strong',null,goal.title),node('small',null,goal.description));
   const arrow=node('span','sv-cabinet-goal-chevron');
   arrow.setAttribute('aria-hidden','true');
   arrow.innerHTML='<svg viewBox="0 0 24 24" focusable="false"><path d="m9 5 7 7-7 7"/></svg>';
   detail.append(copy,arrow);
   const toggle=button(checked?'✓':'+','toggle',item.id);
   toggle.className='sv-cabinet-goal-mark'+(checked?' is-selected':'');
   toggle.setAttribute('aria-pressed',String(checked));
   toggle.setAttribute('aria-label',(checked?'Убрать из кабинета: ':'Добавить в кабинет: ')+goal.title);
   row.append(detail,toggle);
   catalogHost.append(row);
  }
  // Future features never pretend to be connected.
  const future=q?upcoming.filter(item=>matches(item,q)):[];
  for(const item of future){
   const row=node('div','sv-cabinet-future');
   const copy=node('span','sv-cabinet-choice-copy');
   copy.append(node('strong',null,item.name),node('small',null,item.description));
   row.append(copy,node('span','sv-cabinet-soon','В планах'));
   catalogHost.append(row);
  }
  if(!found.length&&!future.length){
   catalogHost.append(node('p','sv-cabinet-muted','Пока такого инструмента нет. Попробуйте описать задачу другими словами.'));
  }
 }
 function showGoal(id){
  if(!itemById.has(id)||!draft)return;
  activeGoal=id;sourceChoice=null;
  catalogHost.hidden=true;
  if(searchWrap)searchWrap.hidden=true;
  guideHost.hidden=false;
  renderGuide();
 }
 function hideGoal(){
  activeGoal=null;sourceChoice=null;
  guideHost.hidden=true;guideHost.replaceChildren();
  catalogHost.hidden=false;
  if(searchWrap)searchWrap.hidden=false;
  renderCatalog();
 }
 function renderGuide(){
  if(!activeGoal||!draft)return;
  const info=itemById.get(activeGoal),goal=GOALS[activeGoal];
  guideHost.replaceChildren();
  const back=button('‹  К задачам','back');
  back.className='sv-cabinet-guide-back';
  const title=node('h3','sv-cabinet-guide-title',goal.title);
  const benefit=node('p','sv-cabinet-guide-benefit',goal.benefit);
  const module=node('p','sv-cabinet-guide-module','Инструмент: '+info.name);
  guideHost.append(back,title,benefit,module);
  if(goal.sources){
   const label=node('h4','sv-cabinet-guide-subtitle','Где вы ведёте продажи?');
   const sourceList=node('div','sv-cabinet-sources');
   for(const source of SOURCES){
    const chosen=source.id===sourceChoice;
    const option=button(source.name,'source',source.id);
    option.className='sv-cabinet-source'+(chosen?' is-current':'');
    option.setAttribute('aria-pressed',String(chosen));
    sourceList.append(option);
   }
   const instruction=node('p','sv-cabinet-source-note',
    sourceChoice?SOURCES.find(x=>x.id===sourceChoice).note:
    'Выберите программу, чтобы узнать следующий шаг. Добавить инструмент можно и без подключения.');
   guideHost.append(label,sourceList,instruction);
  }else guideHost.append(node('p','sv-cabinet-source-note',goal.hint));
  const checked=draft.includes(activeGoal);
  const action=button(checked?'Убрать из кабинета':'Добавить в кабинет','goal-toggle',activeGoal);
  action.className='sv-cabinet-guide-action';
  guideHost.append(action);
  if(status)status.textContent='';
 }
 function render(){if(!draft)return;renderCatalog();if(activeGoal)renderGuide();if(status)status.textContent=''}
 function open(){
  // This client check is for demo UI only. It is NOT a security boundary.
  if(!window.SEYVEO_PREVIEW?.isManager?.())return;
  returnFocus=document.activeElement;
  draft=selected.slice();search.value='';hideGoal();
  render();
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
 }
 function cancel(){
  if(dialog.open)dialog.close();
  else dialog.removeAttribute('open');
  draft=null;activeGoal=null;sourceChoice=null;
 }
 function save(){
  if(!draft)return;
  try{localStorage.setItem(KEY,JSON.stringify({version:1,order:draft.slice()}))}
  catch{if(status)status.textContent='Не получилось сохранить настройку на этом устройстве.';return}
  selected=draft.slice();apply();syncResume();cancel();
 }
 launch.addEventListener('click',open);
 empty.querySelector('[data-sv-cabinet-open]')?.addEventListener('click',open);
 cancelButton?.addEventListener('click',cancel);
 saveButton?.addEventListener('click',save);
 resetButton?.addEventListener('click',()=>{if(!draft)return;draft=DEFAULT.slice();search.value='';render()});
 search.addEventListener('input',renderCatalog);
 catalogHost.addEventListener('click',event=>{
  const b=event.target.closest('[data-cabinet-action]');
  if(!b||!draft)return;
  const id=b.dataset.cabinetId;if(!itemById.has(id))return;
  if(b.dataset.cabinetAction==='guide'){showGoal(id);return}
  if(b.dataset.cabinetAction!=='toggle')return;
  const i=draft.indexOf(id);if(i<0)draft.push(id);else draft.splice(i,1);
  render();
  catalogHost.querySelector('[data-cabinet-id="'+id+'"][data-cabinet-action="toggle"]')?.focus({preventScroll:true});
 });
 guideHost.addEventListener('click',event=>{
  const b=event.target.closest('[data-cabinet-action]');
  if(!b||!draft)return;
  const action=b.dataset.cabinetAction;
  if(action==='back'){hideGoal();return}
  if(action==='source'){sourceChoice=b.dataset.cabinetId;renderGuide();return}
  if(action==='goal-toggle'){
   const id=b.dataset.cabinetId;
   if(!itemById.has(id))return;
   const index=draft.indexOf(id);
   if(index<0)draft.push(id);else draft.splice(index,1);
   renderGuide();
  }
 });
 dialog.addEventListener('click',event=>{if(event.target===dialog)cancel()});
 dialog.addEventListener('close',()=>{
  draft=null;search.value='';
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  returnFocus=null;
 });
 window.addEventListener('hashchange',()=>{if(dialog.open&&location.hash!=='#tasks')cancel()});
 window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  selected=read();apply();
 });
 // iPhone-style arrangement: hold a real tool row, move and release.
 // The same nodes move in the DOM; regular taps, scroll and existing routes stay.
 const hint=launch.closest('.sv-cabinet-toolbar')?.querySelector('.sv-cabinet-toolbar-text small');
 const normalHint='Удерживайте инструмент, чтобы переместить';
 if(hint)hint.textContent=normalHint;
 let hold=null,drag=null,clickGuardUntil=0,hintTimer=null;
 const HOLD_MS=440,SCROLL_THRESHOLD=10;
 const visibleRows=()=>[...list.children].filter(x=>x.matches('[data-cabinet-tool]')&&!x.hidden);
 function clearHold(){
  if(hold?.timer)clearTimeout(hold.timer);
  hold=null;
 }
 function feedback(message){
  if(!hint)return;
  clearTimeout(hintTimer);hint.textContent=message;
  hintTimer=setTimeout(()=>{hint.textContent=normalHint},1700);
 }
 function beginDrag(){
  const pending=hold;
  if(!pending||drag||dialog.open||!window.SEYVEO_PREVIEW?.isManager?.())return;
  const item=pending.item;
  if(!item.isConnected||item.hidden)return;
  if(item.matches('details')&&item.open)item.open=false;
  const rect=item.getBoundingClientRect(),parent=list.getBoundingClientRect();
  const spacer=document.createElement('div');
  spacer.className='sv-cabinet-drop-placeholder';
  spacer.style.height=rect.height+'px';
  list.insertBefore(spacer,item);
  const originalStyle=item.getAttribute('style');
  drag={item,spacer,originalStyle,startY:pending.y,oldOrder:selected.slice(),
   touchId:pending.kind==='touch'?pending.id:null,
   pointerId:pending.kind==='pointer'?pending.id:null};
  item.classList.add('sv-cabinet-dragging');
  item.style.position='absolute';
  item.style.left=(rect.left-parent.left)+'px';
  item.style.top=(rect.top-parent.top)+'px';
  item.style.width=rect.width+'px';
  item.style.height=rect.height+'px';
  item.style.margin='0';
  item.style.zIndex='70';
  item.style.pointerEvents='none';
  item.style.transform='translate3d(0,0,0)';
  list.classList.add('sv-cabinet-reordering');
  clickGuardUntil=Date.now()+1000;
  clearHold();
 }
 function moveDrag(clientY){
  if(!drag)return;
  const bound=list.getBoundingClientRect();
  const y=Math.max(bound.top+8,Math.min(bound.bottom-8,clientY));
  drag.item.style.transform='translate3d(0,'+(y-drag.startY)+'px,0)';
  const other=visibleRows().filter(x=>x!==drag.item);
  const before=other.find(x=>y<x.getBoundingClientRect().top+x.getBoundingClientRect().height/2);
  if(before)list.insertBefore(drag.spacer,before);
  else{
   const hidden=[...list.children].find(x=>x.matches('[data-cabinet-tool]')&&x.hidden);
   list.insertBefore(drag.spacer,hidden||null);
  }
 }
 function finishDrag(commit){
  if(!drag)return;
  const d=drag;drag=null;
  list.insertBefore(d.item,d.spacer);d.spacer.remove();
  if(d.originalStyle===null)d.item.removeAttribute('style');
  else d.item.setAttribute('style',d.originalStyle);
  d.item.classList.remove('sv-cabinet-dragging');
  list.classList.remove('sv-cabinet-reordering');
  clickGuardUntil=Date.now()+700;
  if(!commit){selected=d.oldOrder;apply();return}
  const reordered=visibleRows().map(x=>x.dataset.cabinetTool);
  if(reordered.join('|')===d.oldOrder.join('|'))return;
  selected=reordered;apply();
  try{
   localStorage.setItem(KEY,JSON.stringify({version:1,order:selected.slice()}));
   feedback('Порядок сохранён');
  }catch{feedback('Порядок изменён только на этом экране')}
 }
 function pickRow(target){
  if(!(target instanceof Element))return null;
  const head=target.closest('.svcp-manager-row, .svcp-manager-staff > summary');
  if(!head||!list.contains(head))return null;
  const item=head.closest('[data-cabinet-tool]');
  return item?.parentElement===list&&!item.hidden?item:null;
 }
 function planHold(item,x,y,kind,id){
  clearHold();
  const state={item,x,y,kind,id,timer:null};
  state.timer=setTimeout(()=>{if(hold===state)beginDrag()},HOLD_MS);
  hold=state;
 }
 // Nonpassive touchmove allows native scroll before the long press and
 // stops scrolling only after the deliberate rearrangement starts.
 list.addEventListener('touchstart',event=>{
  if(event.touches.length!==1||drag)return;
  const item=pickRow(event.target);
  if(!item)return;
  const t=event.changedTouches[0];
  planHold(item,t.clientX,t.clientY,'touch',t.identifier);
 },{passive:true});
 document.addEventListener('touchmove',event=>{
  if(drag?.touchId!==null&&drag?.touchId!==undefined){
   const t=[...event.touches].find(t=>t.identifier===drag.touchId);
   if(!t)return;
   event.preventDefault();moveDrag(t.clientY);return;
  }
  if(hold?.kind!=='touch')return;
  const t=[...event.touches].find(t=>t.identifier===hold.id);
  if(!t||Math.hypot(t.clientX-hold.x,t.clientY-hold.y)>SCROLL_THRESHOLD)clearHold();
 },{passive:false});
 document.addEventListener('touchend',event=>{
  if(drag?.touchId!==null&&drag?.touchId!==undefined){
   if(![...event.changedTouches].some(t=>t.identifier===drag.touchId))return;
   event.preventDefault();finishDrag(true);
  }else if(hold?.kind==='touch'&&[...event.changedTouches].some(t=>t.identifier===hold.id))clearHold();
 },{passive:false});
 document.addEventListener('touchcancel',()=>{clearHold();finishDrag(false)},{passive:true});
 list.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'||event.button!==0||drag)return;
  const item=pickRow(event.target);
  if(item)planHold(item,event.clientX,event.clientY,'pointer',event.pointerId);
 });
 document.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch')return;
  if(drag?.pointerId===event.pointerId){event.preventDefault();moveDrag(event.clientY);return}
  if(hold?.kind==='pointer'&&hold.id===event.pointerId&&
   Math.hypot(event.clientX-hold.x,event.clientY-hold.y)>SCROLL_THRESHOLD)clearHold();
 },{passive:false});
 document.addEventListener('pointerup',event=>{
  if(event.pointerType==='touch')return;
  if(drag?.pointerId===event.pointerId)finishDrag(true);
  else if(hold?.kind==='pointer'&&hold.id===event.pointerId)clearHold();
 });
 document.addEventListener('pointercancel',event=>{
  if(hold?.kind==='pointer'&&hold.id===event.pointerId)clearHold();
  if(drag?.pointerId===event.pointerId)finishDrag(false);
 });
 // Swallow synthesized click or <summary> toggle after a long-press release.
 list.addEventListener('click',event=>{
  if(Date.now()<clickGuardUntil){event.preventDefault();event.stopImmediatePropagation()}
 },true);
 list.addEventListener('contextmenu',event=>{
  if(drag||hold)event.preventDefault();
 });
 window.addEventListener('hashchange',()=>{clearHold();finishDrag(false)});

 // First-run handoff from Sayvi: arrange only real, existing modules.
 // Never touch role permissions, external services or previously saved layouts
 // unless the user explicitly chooses "Применить предложение Сэйви".
 const arrival=$('svCabinetArrival'),arrivalText=$('svCabinetArrivalText');
 const arrivalSource=$('svCabinetArrivalSource'),arrivalApply=$('svCabinetArrivalApply');
 let lastArrivalPlan=null;
 function suggestFromPlan(plan){
  const features=Array.isArray(plan?.features)?plan.features:[];
  const systems=Array.isArray(plan?.sources)?plan.sources:[];
  const business=String(plan?.business||'');
  if(business==='Для себя')return [];
  const want=new Set(['company','mail']);
  if(features.includes('team')||(Number(plan?.employees)||0)>1){
   want.add('chats');want.add('people');
  }
  if(features.includes('sales')||systems.some(x=>['1С','Битрикс24','Кассовая система'].includes(x)))want.add('pulse');
  if(features.includes('docs')||features.includes('finance'))want.add('documents');
  return ['pulse','chats','people','documents','mail','company'].filter(id=>want.has(id)&&tools.has(id));
 }
 function prepareFromPlan(plan,options={}){
  const suggested=suggestFromPlan(plan);
  if(!suggested.length)return {applied:false,reason:'personal',tools:[]};
  let existing=false;
  try{existing=localStorage.getItem(KEY)!==null}catch{existing=true}
  if(existing&&!options.force)return {applied:false,reason:'existing-layout',tools:suggested};
  try{
   localStorage.setItem(KEY,JSON.stringify({version:1,order:suggested}));
   selected=suggested.slice();apply();syncResume();
   return {applied:true,reason:'prepared',tools:suggested};
  }catch{
   return {applied:false,reason:'storage-unavailable',tools:suggested};
  }
 }
 function showArrival(plan,outcome){
  if(!arrival||!plan||String(plan.business)==='Для себя')return false;
  lastArrivalPlan=plan;
  const current=outcome||prepareFromPlan(plan);
  const name=String(plan.name||'').trim().split(/\s+/)[0].slice(0,30);
  const greeting=name?name+', ':'';
  if(arrivalText){
   arrivalText.textContent=current.applied?
    greeting+'я собрала кабинет из доступных инструментов для вашей работы. Проверьте его: нажмите «+», чтобы добавить или убрать раздел, или удерживайте строку пальцем для изменения порядка.':
    current.reason==='existing-layout'?
    greeting+'я учла ваши ответы, но сохранила прежнее расположение инструментов. Его можно изменить через «+» или применить мой предложенный набор.':
    greeting+'ваш план сохранён. Я покажу доступные инструменты, а порядок вы сможете настроить через «+».';
  }
  if(arrivalSource){
   const systems=Array.isArray(plan.sources)?plan.sources.filter(s=>s!=='Пока ничем'):[];
   arrivalSource.hidden=systems.length===0;
   if(systems.length)arrivalSource.textContent='Следующий шаг: подключение '+systems.join(', ')+
    '. Сейчас это план: реальные данные и синхронизация ещё недоступны.';
  }
  if(arrivalApply)arrivalApply.hidden=current.reason!=='existing-layout';
  arrival.hidden=false;
  return true;
 }
 $('svCabinetArrivalClose')?.addEventListener('click',()=>{if(arrival)arrival.hidden=true});
 $('svCabinetArrivalEdit')?.addEventListener('click',()=>launch.click());
 $('svCabinetArrivalWorld')?.addEventListener('click',()=>{
  if(arrival)arrival.hidden=true;
  $('navPicture')?.click();
 });
 arrivalApply?.addEventListener('click',()=>{
  if(!lastArrivalPlan)return;
  const result=prepareFromPlan(lastArrivalPlan,{force:true});
  showArrival(lastArrivalPlan,result);
 });

 apply();
 window.SEYVEO_SMART_CABINET=Object.freeze({open,refresh:apply,prepareFromPlan,showArrival});
})();
