/* SEYVEO · compact employee schedule (local demonstration only).
 * Separate work calendar; personal calendar events are never queried.
 * No messages, leave approvals or shifts are transmitted to another device.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const work=$('svcpEmployeeSchedule'),daysHost=$('svcpScheduleDays'),
  monthHost=$('svcpScheduleMonth'),detail=$('svcpScheduleSelected'),
  requestsHost=$('svcpScheduleRequests'),manager=$('svcpManagerSchedule');
 if(!work||!daysHost||!monthHost||!detail||!requestsHost||!manager)return;
 const page=$('tasksPage');
 const PLAN_KEY='seyveo-elena-workweek-demo-v1';
 const REQUEST_KEY='seyveo-elena-shift-requests-demo-v1';
 const SHIFT_KEY='seyveo-demo-shift-history-v1';
 const TASK_KEY='seyveo-business-command-tasks-demo-v1';
 const validTime=v=>typeof v==='string'&&/^([01]\\d|2[0-3]):[0-5]\\d$/.test(v);
 const defaultPlan=()=>({days:[1,2,3,4,5],start:'09:00',end:'17:30'});
 function read(key,fallback){
  try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback}
  catch{return fallback}
 }
 function plan(){
  const stored=read(PLAN_KEY,{});
  const days=Array.isArray(stored.days)?[...new Set(stored.days.filter(x=>Number.isInteger(x)&&x>=0&&x<=6))].sort():[1,2,3,4,5];
  const start=validTime(stored.start)?stored.start:'09:00',end=validTime(stored.end)?stored.end:'17:30';
  return start<end?{days,start,end}:defaultPlan();
 }
 const cleanRequest=x=>x&&typeof x.id==='string'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(x.date)&&['off','swap'].includes(x.type)&&['pending','approved','declined'].includes(x.status);
 function requests(){const data=read(REQUEST_KEY,[]);return Array.isArray(data)?data.filter(cleanRequest).slice(-90):[]}
 function save(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}
 }
 const localDate=(y,m,d)=>new Date(y,m,d,12);
 function dayKey(date){const d=new Date(date);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
 function parseDay(key){if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(key||''))return null;
  const [y,m,d]=key.split('-').map(Number),dt=localDate(y,m-1,d);return dayKey(dt)===key?dt:null}
 const monday=d=>{const t=localDate(d.getFullYear(),d.getMonth(),d.getDate());t.setDate(t.getDate()-(t.getDay()+6)%7);return t};
 const plusDays=(date,n)=>localDate(date.getFullYear(),date.getMonth(),date.getDate()+n);
 const fmt=(d,options)=>new Intl.DateTimeFormat('ru-RU',options).format(d);
 const shortDay=d=>['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()];
 const dayRequest=(key,items)=>[...items].reverse().find(r=>r.date===key);
 const isApprovedOff=(key,items)=>items.some(r=>r.date===key&&r.type==='off'&&r.status==='approved');
 const todayKey=()=>dayKey(new Date());
 let selected=todayKey(),anchor=monday(new Date()),monthOpen=false;
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
 function buildDay(d,items,settings,compact=false){
  const key=dayKey(d),req=dayRequest(key,items),off=isApprovedOff(key,items);
  const scheduled=settings.days.includes(d.getDay())&&!off;
  const button=el('button','svcp-schedule-day');
  button.type='button';button.dataset.svcpDay=key;
  button.dataset.state=off?'leave':req?.status==='pending'?'pending':scheduled?'work':'rest';
  button.setAttribute('aria-pressed',String(key===selected));
  button.setAttribute('aria-label',fmt(d,{weekday:'long',day:'numeric',month:'long'})+', '+
    (off?'согласованный выходной, демо':scheduled?'смена':'выходной')+
    (req?.status==='pending'?', заявка на рассмотрении':''));
  if(key===todayKey())button.dataset.today='true';
  if(!compact)button.append(el('small',null,shortDay(d)));
  button.append(el('strong',null,String(d.getDate())));
  button.append(el('i'));
  return button;
 }
 function dayDescription(date,items,settings){
  const key=dayKey(date),req=dayRequest(key,items),off=isApprovedOff(key,items);
  const workDay=settings.days.includes(date.getDay())&&!off;
  const name=fmt(date,{weekday:'long',day:'numeric',month:'long'});
  const status=off?'Согласованный выходной · демо':workDay?'Смена '+settings.start+'–'+settings.end:'Выходной';
  let hint=workDay?'Время смены · график-демо. Перерыв настраивается отдельно руководителем.'
   :'Этот день свободен по учебному графику.';
  if(req)hint+=(req.status==='pending'?' · Заявка на рассмотрении (локально)':req.status==='approved'?' · Заявка согласована в демо':' · Заявка отклонена в демо');
  return {key,name,status,hint,workDay,req};
 }
 function renderSchedule(){
  const settings=plan(),items=requests();
  const weekEnd=plusDays(anchor,6);
  $('svcpSchedulePeriod').textContent=fmt(anchor,{day:'numeric',month:'short'})+' – '+fmt(weekEnd,{day:'numeric',month:'short'});
  const monthButton=$('svcpScheduleMonthToggle');
  monthButton.textContent=monthOpen?'Неделя':'Месяц';
  monthButton.setAttribute('aria-expanded',String(monthOpen));
  daysHost.replaceChildren();
  for(let i=0;i<7;i++)daysHost.append(buildDay(plusDays(anchor,i),items,settings));
  monthHost.hidden=!monthOpen;
  if(monthOpen){
   monthHost.replaceChildren();
   const chosen=parseDay(selected)||new Date(),monthDate=localDate(chosen.getFullYear(),chosen.getMonth(),1),first=monday(monthDate);
   $('svcpScheduleMonthLabel').textContent=fmt(monthDate,{month:'long',year:'numeric'});
   for(let i=0;i<42;i++){
    const day=plusDays(first,i),button=buildDay(day,items,settings,true);
    button.dataset.outside=String(day.getMonth()!==monthDate.getMonth());monthHost.append(button);
   }
  }
  const chosen=parseDay(selected)||new Date(),info=dayDescription(chosen,items,settings);
  $('svcpScheduleSelectedTitle').textContent=info.name;
  $('svcpScheduleSelectedState').textContent=info.status;
  $('svcpScheduleSelectedHint').textContent=info.hint;
  const askOff=$('svcpScheduleAskOff'),askSwap=$('svcpScheduleAskSwap');
  const past=info.key<todayKey();
  askOff.hidden=!info.workDay||past;
  askSwap.hidden=!info.workDay||past;
  askOff.disabled=info.req?.status==='pending';
  askSwap.disabled=info.req?.status==='pending';
  const note=$('svcpScheduleNotice');
  if(note&&!note.dataset.saved)note.textContent='Учебный график · заявки остаются на этом устройстве.';
  const hoursGoal=$('svcpScheduleMonthGoal');
  if(hoursGoal){
   let plannedDays=0;const y=chosen.getFullYear(),m=chosen.getMonth(),monthLength=new Date(y,m+1,0).getDate();
   for(let d=1;d<=monthLength;d++){
    const t=localDate(y,m,d);
    if(settings.days.includes(t.getDay())&&!isApprovedOff(dayKey(t),items))plannedDays++;
   }
   // The plan is illustrative until the manager supplies actual payroll records.
   const duration=(t)=>{const [h,min]=t.split(':').map(Number);return h*60+min};
   const minutes=Math.max(0,duration(settings.end)-duration(settings.start));
   const p=read('seyveo-employee-break-schedule-v1',{durationMinutes:30,paid:false});
   const unpaid=p?.paid===true?0:([15,30,45,60].includes(Number(p?.durationMinutes))?Number(p.durationMinutes):30);
   const perDay=Math.max(0,minutes-unpaid);
   const total=plannedDays*perDay/60;
   hoursGoal.textContent='План месяца · '+total.toLocaleString('ru-RU',{maximumFractionDigits:1})+' ч (демо)';
  }
  renderManager(items,settings);
 }
 function renderManager(items,settings){
  if(manager.hidden)return;
  const dateInput=$('svcpManagerDayStart'),endInput=$('svcpManagerDayEnd');
  if(dateInput&&document.activeElement!==dateInput)dateInput.value=settings.start;
  if(endInput&&document.activeElement!==endInput)endInput.value=settings.end;
  manager.querySelectorAll('[data-svcp-manager-day]').forEach(button=>{
   const on=settings.days.includes(Number(button.dataset.svcpManagerDay));
   button.setAttribute('aria-pressed',String(on));
  });
  const list=$('svcpManagerRequestList');if(!list)return;
  list.replaceChildren();
  const relevant=items.filter(r=>r.status==='pending').slice().reverse();
  const count=$('svcpManagerRequestCount');if(count)count.textContent=relevant.length?'На рассмотрении · '+relevant.length:'Нет новых заявок';
  if(!relevant.length){list.append(el('p','svcp-schedule-empty','Новых запросов нет. Здесь будут заявки Елены из учебного режима.'));return}
  for(const req of relevant){
   const date=parseDay(req.date);if(!date)continue;
   const row=el('article','svcp-manager-request'),info=el('div','svcp-manager-request-copy');
   info.append(el('strong',null,(req.type==='off'?'Выходной':'Замена смены')+' · Елена'),
    el('small',null,fmt(date,{day:'numeric',month:'long',weekday:'short'})+' · только на этом устройстве'));
   const actions=el('div','svcp-manager-request-actions');
   const accept=el('button',null,'Согласовать'),reject=el('button',null,'Отклонить');
   accept.type=reject.type='button';accept.dataset.svcpReview=req.id;accept.dataset.decision='approved';
   reject.dataset.svcpReview=req.id;reject.dataset.decision='declined';
   actions.append(accept,reject);row.append(info,actions);list.append(row);
  }
 }
 function requestDay(type){
  const chosen=parseDay(selected);if(!chosen||selected<todayKey())return;
  const items=requests(),settings=plan(),description=dayDescription(chosen,items,settings);
  if(!description.workDay||description.req?.status==='pending')return;
  const req={id:'work-'+Date.now()+'-'+Math.floor(Math.random()*1e6),
   date:selected,type,status:'pending',createdAt:new Date().toISOString()};
  if(save(REQUEST_KEY,[...items,req].slice(-90))){
   const note=$('svcpScheduleNotice');if(note){note.dataset.saved='true';note.textContent='Заявка создана в демо. Она ещё не отправлена работодателю.'}
   renderSchedule();
  }else{$('svcpScheduleNotice').textContent='Не удалось сохранить заявку на устройстве.'}
 }
 daysHost.addEventListener('click',onDay);monthHost.addEventListener('click',onDay);
 function onDay(event){
  const button=event.target.closest('[data-svcp-day]');if(!button)return;
  selected=button.dataset.svcpDay;const date=parseDay(selected);if(date)anchor=monday(date);
  renderSchedule();
 }
 $('svcpSchedulePrev')?.addEventListener('click',()=>{anchor=plusDays(anchor,-7);selected=dayKey(anchor);renderSchedule()});
 $('svcpScheduleNext')?.addEventListener('click',()=>{anchor=plusDays(anchor,7);selected=dayKey(anchor);renderSchedule()});
 $('svcpScheduleToday')?.addEventListener('click',()=>{selected=todayKey();anchor=monday(new Date());renderSchedule()});
 $('svcpScheduleMonthToggle')?.addEventListener('click',()=>{monthOpen=!monthOpen;renderSchedule()});
 $('svcpScheduleAskOff')?.addEventListener('click',()=>requestDay('off'));
 $('svcpScheduleAskSwap')?.addEventListener('click',()=>requestDay('swap'));
 let editDays=null;
 manager.addEventListener('toggle',()=>{if(manager.open){editDays=[...plan().days];renderManager(requests(),plan())}});
 manager.addEventListener('click',event=>{
  const dayButton=event.target.closest('[data-svcp-manager-day]');
  if(dayButton){
   if(!editDays)editDays=[...plan().days];const day=Number(dayButton.dataset.svcpManagerDay);
   editDays=editDays.includes(day)?editDays.filter(x=>x!==day):[...editDays,day].sort();
   manager.querySelectorAll('[data-svcp-manager-day]').forEach(b=>b.setAttribute('aria-pressed',String(editDays.includes(Number(b.dataset.svcpManagerDay)))));
   return;
  }
  const action=event.target.closest('[data-svcp-review]');if(action){
   const items=requests(),req=items.find(x=>x.id===action.dataset.svcpReview&&x.status==='pending');
   if(!req)return;
   req.status=action.dataset.decision==='approved'?'approved':'declined';req.reviewedAt=new Date().toISOString();
   if(!save(REQUEST_KEY,items)){$('svcpManagerScheduleStatus').textContent='Не удалось сохранить решение.';return}
   $('svcpManagerScheduleStatus').textContent=req.type==='swap'&&req.status==='approved'
    ?'Запрос согласован в демо. Сотрудник на замену ещё не назначен.'
    :'Решение сохранено в демо, без отправки уведомления на другой телефон.';
   renderSchedule();return;
  }
  if(event.target.closest('#svcpManagerScheduleSave')){
   const start=$('svcpManagerDayStart')?.value,end=$('svcpManagerDayEnd')?.value;
   const status=$('svcpManagerScheduleStatus');
   if(!validTime(start)||!validTime(end)||start>=end||!editDays?.length){
    status.textContent='Выбери рабочие дни и укажи корректные часы начала и окончания.';return;
   }
   if(!save(PLAN_KEY,{days:editDays,start,end})){
    status.textContent='Не удалось сохранить график на устройстве.';return;
   }
   status.textContent='График сохранён локально · для демонстрации. Реальная синхронизация ещё не подключена.';
   renderSchedule();
  }
 });
 window.addEventListener('storage',event=>{if([PLAN_KEY,REQUEST_KEY,SHIFT_KEY].includes(event.key))renderSchedule()});
 window.addEventListener('seyveo:shift-updated',renderSchedule);
 window.addEventListener('seyveo:break-schedule-updated',renderSchedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderSchedule()});
 // Switching between director / employee demo uses a single real calendar.
 const observer=new MutationObserver(()=>{if(!page.hidden)renderSchedule()});
 observer.observe(page,{attributes:true,attributeFilter:['data-employee-mode','hidden']});
 renderSchedule();
})();