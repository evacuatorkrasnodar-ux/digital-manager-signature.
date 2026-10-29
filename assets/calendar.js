/* SEYVEO Calendar · one coherent local time view, linked to existing Tasks.
   Old prototypes inspired the timeline only; no old UI or demo records reused. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const page=$('calendarPage'),form=$('calendarEventForm');
if(!page||!form)return;
const STORE='seyveo-calendar-events-v1',TASKS='seyveo-personal-tasks-v1',MAX=300;
const weekday=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
/* Federal public holidays in article 112 of the Russian Labour Code.
   Only 2026 transfer days are encoded; future transfer schedules require new official acts. */
const FEDERAL_HOLIDAYS={
 '01-01':'Новогодние каникулы','01-02':'Новогодние каникулы','01-03':'Новогодние каникулы',
 '01-04':'Новогодние каникулы','01-05':'Новогодние каникулы','01-06':'Новогодние каникулы',
 '01-07':'Рождество Христово','01-08':'Новогодние каникулы',
 '02-23':'День защитника Отечества','03-08':'Международный женский день',
 '05-01':'Праздник Весны и Труда','05-09':'День Победы',
 '06-12':'День России','11-04':'День народного единства'
};
const TRANSFER_DAYS_2026={
 '01-09':'Перенесённый выходной (с 3 января)',
 '03-09':'Выходной после 8 Марта',
 '05-11':'Выходной после Дня Победы',
 '12-31':'Перенесённый выходной (с 4 января)'
};
function publicHoliday(date){
 const key=format(date).slice(5);
 const publicName=FEDERAL_HOLIDAYS[key];
 if(publicName)return {name:publicName,kind:'public'};
 const transferred=date.getFullYear()===2026?TRANSFER_DAYS_2026[key]:null;
 return transferred?{name:transferred,kind:'rest'}:null;
}
const format=(date)=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const at=(str)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(str||''))return null;const [y,m,d]=str.split('-').map(Number);const v=new Date(y,m-1,d);return v.getFullYear()===y&&v.getMonth()+1===m&&v.getDate()===d?v:null};
const step=(day,n)=>new Date(day.getFullYear(),day.getMonth(),day.getDate()+n);
const monday=day=>step(day,-((day.getDay()+6)%7));
const same=(a,b)=>format(a)===format(b);
const text=(tag,cls,val)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(val!==undefined)e.textContent=val;
 return e;
};
const fmtLong=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'});
const fmtShort=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'});
const fmtMonth=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'});
const niceFirst=s=>s.charAt(0).toLocaleUpperCase('ru-RU')+s.slice(1);
const raw=key=>{try{return localStorage.getItem(key)}catch{return null}};
const parse=s=>{try{return JSON.parse(s||'[]')}catch{return []}};
function events(){
 const input=parse(raw(STORE));
 return (Array.isArray(input)?input:[]).filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&at(x.date))
 .slice(-MAX).map(x=>({
  id:x.id,title:x.title.trim().slice(0,140),date:x.date,
  time:/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time||'')?x.time:'',
  kind:x.kind==='business'?'business':'personal',
  duration:[30,60,90,120].includes(Number(x.duration))?Number(x.duration):0,
  travel:[0,15,30,60].includes(Number(x.travel))?Number(x.travel):0,
  remind:[-1,15,30,60].includes(Number(x.remind))?Number(x.remind):0,
  note:typeof x.note==='string'?x.note.slice(0,600):'',
  createdAt:typeof x.createdAt==='string'?x.createdAt:'',
  updatedAt:typeof x.updatedAt==='string'?x.updatedAt:''
 })).filter(x=>x.title);
}
function tasks(){
 const data=parse(raw(TASKS));
 return (Array.isArray(data)?data:[])
 .filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string')
 .map(x=>({id:x.id,title:x.title.trim().slice(0,140),date:at(x.due)?x.due:'',done:x.done===true}))
 .filter(x=>x.title);
}
function saveEvents(list){
 try{localStorage.setItem(STORE,JSON.stringify(list.slice(-MAX)));return true}
 catch{return false}
}
let focus=new Date(),mode='month',editing=null,scope='all';
const managerPreview=()=>window.SEYVEO_PREVIEW?.isManager?.()===true;
const selectedScope=()=>managerPreview()?scope:'personal';
const visibleEvents=()=>events().filter(x=>selectedScope()==='all'||x.kind===selectedScope());
const iso=()=>format(focus);
function dayItems(dayKey,includeDone=true){
 const meeting=visibleEvents().filter(x=>x.date===dayKey).map(x=>({...x,source:'event',sort:x.time||'99:00'}));
 const todo=selectedScope()==='business'?[]:tasks().filter(x=>x.date===dayKey&&(includeDone||!x.done)).map(x=>({...x,source:'task',sort:'98:00'}));
 const personal=selectedScope()==='business'?[]:(window.SEYVEO_SPACES?.calendarItems(dayKey)||[]);
 return [...meeting,...todo,...personal].sort((a,b)=>a.sort.localeCompare(b.sort)||a.title.localeCompare(b.title,'ru'));
}
function createEntry(item){
 const btn=text('button','cal-entry');btn.type='button';
 const callTarget=item.source==='task'&&!item.done?window.SEYVEO_CONTACTS?.taskTarget?.(item.title)||'':'';
 const clock=text('span','cal-entry-time');
 if(item.source==='task'){
  clock.append(text('i','cal-entry-bullet'));btn.dataset.calendarTask=item.id;
  if(callTarget){
   btn.dataset.calendarCall=callTarget;
   btn.setAttribute('aria-label','Подготовить звонок: '+callTarget);
  }else btn.setAttribute('aria-label','Перейти к делу: '+item.title);
 }else if(item.source==='space'){
  clock.append(text('i','cal-entry-bullet cal-entry-space-bullet'));
  btn.dataset.calendarSpaceItem=item.space;
  btn.dataset.calendarSpaceRecord=item.id;
  btn.setAttribute('aria-label','Открыть '+item.label+': '+item.title);
 }else{
  clock.textContent=item.time||'Весь\u00a0день';btn.dataset.calendarEvent=item.id;
  btn.setAttribute('aria-label','Открыть событие: '+item.title);
 }
 const copy=text('span','cal-entry-copy');
 const title=text('strong','',item.title);
 if(item.done)title.style.textDecoration='line-through';
 const subtitle=item.source==='task'?(item.done?'Завершено · личное дело':'Личное дело · изменить в «Делах»'):
   item.source==='space'?(item.label+' · '+item.kind+(item.note?' · '+item.note:'')):
   (item.kind==='business'?'Работа':'Личное')
   +(item.duration?(' · '+(item.duration===30?'30 мин':item.duration===60?'1 ч':item.duration===90?'1 ч 30 мин':'2 ч')):'')
   +(item.travel?' · дорога по '+item.travel+' мин':'')
   +(item.remind===-1?' · напомнить в момент':item.remind?' · напомнить за '+(item.remind===60?'1 ч':item.remind+' мин'):'')
   +(item.note?' · '+item.note:'');
 copy.append(title,text('small','',subtitle));
 const trailing=text('span',callTarget?'cal-entry-chevron cal-entry-phone':'cal-entry-chevron',callTarget?'':'›');
 if(callTarget){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const shape=document.createElementNS(ns,'path');
  shape.setAttribute('d','M7.2 3.8 10 6.6 8.4 8.7a13 13 0 0 0 6.9 6.9l2.1-1.6 2.8 2.8-1.8 3c-.4.7-1.2 1.1-2 1C9 20 4 15 3.2 7.6c-.1-.8.3-1.6 1-2l3-1.8Z');
  svg.append(shape);trailing.append(svg);
 }
 btn.append(clock,copy,trailing);
 return btn;
}
function fillAgenda(target,items,emptyTitle,emptyCaption){
 target.replaceChildren();
 if(!items.length){
  const empty=text('div','cal-empty');
  empty.append(text('strong','',emptyTitle),text('span','',emptyCaption));
  target.append(empty);
 }else for(const item of items)target.append(createEntry(item));
}
function dayButton(day,week=false,calendarEvents=[],personalTasks=[]){
 const key=format(day),today=format(new Date()),holiday=publicHoliday(day);
 const btn=text('button','cal-day');btn.type='button';
 btn.dataset.calendarDate=key;
 btn.dataset.today=String(key===today);
 btn.dataset.selected=String(key===iso());
 btn.dataset.weekend=String(day.getDay()===0||day.getDay()===6);
 if(holiday)btn.dataset.holiday=holiday.kind;
 if(!week)btn.dataset.outside=String(day.getMonth()!==focus.getMonth());
 const personal=selectedScope()==='business'?[]:(window.SEYVEO_SPACES?.calendarItems(key)||[]);
 const records=calendarEvents.filter(x=>x.date===key).length+personalTasks.filter(x=>x.date===key).length+personal.length;
 btn.setAttribute('aria-label',fmtLong.format(day)+(key===today?' · сегодня':'')+(holiday?' · '+holiday.name:'')+' · '+records+' записей');
 if(week)btn.append(text('small','',weekday[(day.getDay()+6)%7]));
 btn.append(text('span','cal-day-number',String(day.getDate())));
 const dots=text('span','cal-day-dots');
 if(holiday)dots.append(text('i','cal-dot-holiday'));
 if(calendarEvents.some(x=>x.date===key))dots.append(text('i',''));
 if(personalTasks.some(x=>x.date===key&&!x.done))dots.append(text('i','cal-dot-task'));
 if(personal.length)dots.append(text('i','cal-dot-life'));
 btn.append(dots);return btn;
}
function renderMonth(){
 const selected=new Date(focus.getFullYear(),focus.getMonth(),1);
 const grid=$('calendarMonthGrid');grid.replaceChildren();
 const first=monday(selected),calendarEvents=visibleEvents(),personalTasks=selectedScope()==='business'?[]:tasks();
 const total=Math.ceil((((new Date(focus.getFullYear(),focus.getMonth()+1,0)).getDate())+(selected.getDay()+6)%7)/7)*7;
 for(let i=0;i<total;i++)grid.append(dayButton(step(first,i),false,calendarEvents,personalTasks));
 $('calendarMonth').hidden=false;
 $('calendarWeek').hidden=true;
}
function renderWeek(){
 const mondayStart=monday(focus),root=$('calendarWeekGrid'),calendarEvents=visibleEvents(),personalTasks=selectedScope()==='business'?[]:tasks();
 root.replaceChildren();
 for(let i=0;i<7;i++)root.append(dayButton(step(mondayStart,i),true,calendarEvents,personalTasks));
 $('calendarMonth').hidden=true;
 $('calendarWeek').hidden=false;
}
function renderDay(){
 $('calendarMonth').hidden=true;
 $('calendarWeek').hidden=true;
}
function renderAgenda(){
 const list=dayItems(iso());
 $('calendarSelectedTitle').textContent=mode==='day'?'Планы на день':niceFirst(fmtShort.format(focus));
 const count=list.length;
 $('calendarSelectedCount').textContent=count
  ?count+' '+(count%10===1&&count%100!==11?'запись':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'записи':'записей')
  :'Нет записей';
 const holiday=publicHoliday(focus),holidayNote=$('calendarHoliday');
 holidayNote.hidden=!holiday;
 if(holiday){
  holidayNote.dataset.kind=holiday.kind;
  $('calendarHolidayName').textContent=holiday.name;
 }else $('calendarHolidayName').textContent='';
 const agenda=$('calendarAgenda');
 agenda.hidden=count===0;
 if(count)fillAgenda(agenda,list);
 else agenda.replaceChildren();
}
/* Smart Calendar v1: local rule-based assistance, not an external AI model. */
function timeCollision(date,time,exceptID=null){
 if(!time||!at(date))return null;
 return events().find(item=>item.date===date&&item.time===time&&item.id!==exceptID)||null;
}
/* Local in-app reminders only, not background push notifications. */
function upcomingReminder(nowDate=new Date(),records=visibleEvents()){
 const now=nowDate.getTime();
 const active=[];
 for(const item of records){
  if(!item||!item.time||![-1,15,30,60].includes(Number(item.remind)))continue;
  const date=at(item.date);
  if(!date)continue;
  const parts=item.time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if(!parts)continue;
  const begins=new Date(date.getFullYear(),date.getMonth(),date.getDate(),Number(parts[1]),Number(parts[2])).getTime();
  const remaining=begins-now;
  if(Number(item.remind)===-1?(remaining>0||remaining< -120000):(remaining<=0||remaining>Number(item.remind)*60*1000))continue;
  active.push({...item,remaining});
 }
 return active.sort((a,b)=>a.remaining-b.remaining||a.title.localeCompare(b.title,'ru'))[0]||null;
}
function smartSuggestion(todayDate=new Date()){
 const today=format(todayDate),selected=iso();
 const dueReminder=upcomingReminder(todayDate);
 if(dueReminder){
  const remaining=Math.max(0,Math.ceil(dueReminder.remaining/60000));
  return{
   kind:'event',id:dueReminder.id,action:'Открыть',
   message:remaining===0?'Сейчас начинается «'+dueReminder.title.slice(0,55)+'».':
    'Через '+remaining+' мин: «'+dueReminder.title.slice(0,55)+'».'
  };
 }
 const entries=visibleEvents().filter(item=>item.date===selected&&item.time);
 const times=new Map();
 for(const entry of entries){
  if(times.has(entry.time))return{
   kind:'event',id:entry.id,
   message:'На '+entry.time+' записано несколько событий. Проверь, хватает ли времени.',
   action:'Проверить'
  };
  times.set(entry.time,entry);
 }
 const pending=selectedScope()==='business'?[]:
  tasks().filter(item=>!item.done&&item.date).sort((a,b)=>a.date.localeCompare(b.date));
 const late=pending.filter(item=>item.date<today);
 if(late.length)return{
  kind:'deadlines',
  message:late.length===1?'Срок одного дела уже прошёл. Стоит проверить его.':'Просрочено '+late.length+' дел. Стоит проверить сроки.',
  action:'Сроки'
 };
 const shortGap=window.SEYVEO_CALENDAR_TIME?.tightPair(entries,selected);
 if(shortGap)return{
  kind:'event',id:shortGap.second.id,
  message:shortGap.kind==='overlap'
   ?'События в '+shortGap.first.time+' и '+shortGap.second.time+' пересекаются с учётом длительности и дороги.'
   :'События в '+shortGap.first.time+' и '+shortGap.second.time+' близко друг к другу. Проверь длительность.',
  action:'Проверить'
 };
 const soon=pending.filter(item=>item.date>=today&&item.date<=format(step(todayDate,3)));
 if(soon.length){
  const n=soon.length,day=soon[0].date;
  const when=day===today?'сегодня':day===format(step(todayDate,1))?'завтра':'в ближайшие три дня';
  return{
   kind:'deadlines',
   message:n===1?'Срок одного дела — '+when+'.':'Ближайшее из '+n+' дел со сроком — '+when+'. Проверь план.',
   action:'Сроки'
  };
 }
 const tomorrow=format(step(todayDate,1));
 const meeting=visibleEvents().filter(item=>item.date===tomorrow&&item.time).sort((a,b)=>a.time.localeCompare(b.time))[0];
 if(meeting)return{
  kind:'event',id:meeting.id,
  message:'Завтра в '+meeting.time+' запланировано «'+meeting.title.slice(0,48)+'».',
  action:'Открыть'
 };
 /* Only important dates in My World; do not interpret private health records. */
 const upcoming=selectedScope()==='business'?[]:
  (window.SEYVEO_SPACES?.upcoming(today,format(step(todayDate,7)))||[]);
 const birthday=upcoming.find(item=>item.space==='world'&&item.kind==='День рождения'&&item.date>=today);
 if(birthday)return{
  kind:'day',date:birthday.date,
  message:birthday.date===today?'Сегодня важная дата: '+birthday.title.slice(0,48)+'.':'Скоро день рождения: '+birthday.title.slice(0,48)+'.',
  action:'К дате'
 };
 return null;
}
let currentAdvice=null;
function renderAdvice(){
 const panel=$('calendarAdvice');
 currentAdvice=mode==='deadlines'?null:smartSuggestion();
 panel.hidden=!currentAdvice;
 if(!currentAdvice){$('calendarAdviceText').textContent='';return}
 $('calendarAdviceText').textContent=currentAdvice.message;
 $('calendarAdviceAction').textContent=currentAdvice.action;
}
function planningValues(){
 const duration=Number(form.querySelector('input[name="calendarDuration"]:checked')?.value||0);
 const travel=Number(form.querySelector('input[name="calendarTravel"]:checked')?.value||0);
 return {duration,travel};
}
function reminderValue(){
 const selection=Number(form.querySelector('input[name="calendarReminder"]:checked')?.value||0);
 return [-1,15,30,60].includes(selection)?selection:0;
}
function setReminder(value){
 const chosen=[-1,15,30,60].includes(Number(value))?Number(value):0;
 const radio=form.querySelector('input[name="calendarReminder"][value="'+chosen+'"]');
 if(radio)radio.checked=true;
}
function choosePlanning(duration,travel){
 const d=form.querySelector('input[name="calendarDuration"][value="'+duration+'"]')||
  form.querySelector('input[name="calendarDuration"][value="0"]');
 const t=form.querySelector('input[name="calendarTravel"][value="'+travel+'"]')||
  form.querySelector('input[name="calendarTravel"][value="0"]');
 if(d)d.checked=true;
 if(t)t.checked=true;
 syncPlanningLabel();
}
function syncPlanningLabel(){
 const clock=$('calendarEventTime').value;
 const duration=planningValues().duration,travel=planningValues().travel,remind=reminderValue();
 $('calendarEventTiming').hidden=!clock;
 const length=duration===30?'30 мин':duration===60?'1 час':duration===90?'1,5 часа':duration===120?'2 часа':'Не указана';
 const road=travel?travel===60?'1 час':travel+' мин':'Без запаса';
 const reminder=remind===-1?'В момент события':remind?remind===60?'За 1 час':'За '+remind+' мин':'Выключено';
 $('calendarEventTimingValue').textContent=length+' · '+(travel?'дорога '+travel+' мин':'без дороги')+(remind?' · напомнить':'');
 $('calendarDurationValue').textContent=length;
 $('calendarTravelValue').textContent=road;
 $('calendarReminderValue').textContent=reminder;
}
function showTimeAlternatives(){
 const box=$('calendarTimeOptions'),choices=$('calendarTimeOptionsChoices');
 const date=$('calendarEventDate').value,time=$('calendarEventTime').value;
 const engine=window.SEYVEO_CALENDAR_TIME;
 const settings=planningValues();
 const nearby=engine?.nearest(events(),date,time,editing,settings)||null;
 box.hidden=!nearby;
 choices.replaceChildren();
 if(!nearby)return;
 const notice=nearby.kindOfIssue==='same'
  ?'В это время уже записано событие'
  :nearby.kindOfIssue==='overlap'
    ?'Время занято с учётом длительности и дороги'
    :'Время может быть занято: у одной встречи не указана длительность';
 $('calendarTimeOptionsMessage').textContent=notice+' — «'+nearby.title.slice(0,65)+'» ('+nearby.time+'). Возможные варианты:';
 const slots=engine.suggestions(events(),date,time,editing,new Date(),settings);
 if(!slots.length){
  $('calendarTimeOptionsMessage').textContent+=' Других вариантов с 09:00 до 19:00 не нашлось.';
  return;
 }
 for(const option of slots){
  const chip=text('button','',option);chip.type='button';
  chip.dataset.calendarSuggestedTime=option;
  chip.setAttribute('aria-label','Предложенное время '+option);
  choices.append(chip);
 }
}
/* Render the same calm date label on iPhone and desktop without relying on
   Safari's inconsistent internal layout for input[type=date]. */
function syncEventDateDisplay(){
 const input=$('calendarEventDate'),display=$('calendarDateDisplay');
 const date=at(input.value);
 display.textContent=date
  ?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(date)
  :'Выбрать дату';
 input.closest('.cal-date-control').dataset.filled=String(Boolean(date));
}
function showEventTimeHint(){
 syncEventDateDisplay();
 const status=$('calendarEventStatus');
 showTimeAlternatives();
 const conflict=timeCollision($('calendarEventDate').value,$('calendarEventTime').value,editing);
 if(conflict){
  status.dataset.smartCollision='true';
  status.textContent='На это время уже есть «'+conflict.title.slice(0,65)+'». Проверьте совпадение.';
 }else if(status.dataset.smartCollision==='true'){
  status.textContent='';
  delete status.dataset.smartCollision;
 }
}
function renderDeadlines(){
 const today=format(new Date()),tomorrow=format(step(new Date(),1)),weekEnd=format(step(new Date(),7));
 const all=[
  ...(selectedScope()==='business'?[]:tasks().filter(x=>!x.done).map(x=>({...x,source:'task'}))),
  ...visibleEvents().filter(x=>x.date>=today).map(x=>({...x,source:'event'})),
  ...(selectedScope()==='business'?[]:(window.SEYVEO_SPACES?.upcoming(today,format(step(new Date(),370)))||[]))
 ];
 const groups=[
  ['Просрочено',x=>x.source==='task'&&x.date&&x.date<today],
  ['Сегодня',x=>x.date===today],
  ['Завтра',x=>x.date===tomorrow],
  ['В ближайшие семь дней',x=>x.date>tomorrow&&x.date<=weekEnd],
  ['Позже',x=>x.date>weekEnd],
  ['Без даты',x=>x.source==='task'&&!x.date]
 ];
 const root=$('calendarDeadlineList');root.replaceChildren();
 let count=0;
 for(const [title,filter] of groups){
  const matches=all.filter(filter).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.time||'').localeCompare(b.time||''));
  if(!matches.length)continue;
  count+=matches.length;
  const section=text('section','cal-deadline-section');
  section.append(text('h3','',title));
  const list=text('div','cal-agenda');
  for(const x of matches){const line=createEntry(x);if(x.date&&x.date!==today)line.querySelector('.cal-entry-copy small').textContent+=(x.source==='event'?' · ':' · ')+fmtLong.format(at(x.date));list.append(line)}
  section.append(list);root.append(section);
 }
 if(!count)root.append(text('p','cal-empty','Сроков и предстоящих событий пока нет. Здесь появятся дела с датой и ваши встречи.'));
}
function render(){
 if(page.hidden)return;
 const currentScope=selectedScope();
 page.dataset.calendarScope=currentScope;
 const scopeControls=page.querySelector('.cal-scope');
 if(scopeControls)scopeControls.hidden=!managerPreview();
 document.querySelectorAll('#calendarPage [data-calendar-scope]').forEach(btn=>
  btn.setAttribute('aria-pressed',String(btn.dataset.calendarScope===currentScope)));
 const deadline=mode==='deadlines';
 $('calendarView').hidden=deadline;
 $('calendarView').dataset.mode=mode;
 $('calendarDeadlineView').hidden=!deadline;
 $('calendarAddInline').hidden=deadline;
 document.querySelector('#calendarPage .cal-actions').dataset.deadlines=String(deadline);
 document.querySelectorAll('[data-calendar-mode]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.calendarMode===mode)));
 $('calendarPeriodTitle').textContent=mode==='month'?niceFirst(fmtMonth.format(focus)):
  mode==='week'?fmtLong.format(monday(focus)).replace(/\s+\d{4}\s*г?\.?/,'')+' — '+fmtLong.format(step(monday(focus),6)):
  mode==='day'?niceFirst(fmtShort.format(focus)):'Сроки';
 if(deadline){renderDeadlines();renderAdvice();return}
 if(mode==='month')renderMonth();
 if(mode==='week')renderWeek();
 if(mode==='day')renderDay();
 renderAgenda();
 renderAdvice();
}
/* Reveal the first selected-day entry above the shared fixed dock on compact phones.
   No dock movement, permanent scroll lock, or automatic jump on initial page load. */
function revealSelectedDay(){
 if(page.hidden||mode==='deadlines')return;
 window.requestAnimationFrame(()=>{
  if(page.hidden||mode==='deadlines')return;
  const agenda=$('calendarAgenda'),dock=document.querySelector('footer.dock');
  if(!agenda||!dock)return;
  /* Empty days need no forced page jump: keep the month and personal menu in view. */
  if(!agenda.querySelector('.cal-entry'))return;
  const first=agenda.querySelector('.cal-entry, .cal-empty');
  const agendaBox=agenda.getBoundingClientRect();
  const itemBox=first?.getBoundingClientRect();
  const viewportBottom=window.visualViewport
   ? window.visualViewport.offsetTop+window.visualViewport.height
   : window.innerHeight;
  const availableBottom=Math.min(dock.getBoundingClientRect().top,viewportBottom)-14;
  const wantedBottom=itemBox?Math.min(itemBox.bottom,itemBox.top+76):agendaBox.top+66;
  if(wantedBottom<=availableBottom)return;
  window.scrollBy({
   top:Math.ceil(wantedBottom-availableBottom),
   behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'
  });
 });
}
function updateFocus(date){focus=new Date(date.getFullYear(),date.getMonth(),date.getDate());render()}
function animatePeriod(direction){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const surface=mode==='month'?$('calendarMonth'):mode==='week'?$('calendarWeek'):document.querySelector('#calendarPage .cal-day-summary');
 if(!surface||surface.hidden)return;
 surface.classList.remove('cal-swipe-next','cal-swipe-prev');
 void surface.offsetWidth;
 surface.classList.add(direction>0?'cal-swipe-next':'cal-swipe-prev');
}
function move(direction){
 if(mode==='deadlines')return;
 const d=mode==='day'?step(focus,direction):mode==='week'?step(focus,direction*7):new Date(focus.getFullYear(),focus.getMonth()+direction,Math.min(focus.getDate(),new Date(focus.getFullYear(),focus.getMonth()+direction+1,0).getDate()));
 updateFocus(d);
 animatePeriod(direction);
}
/* Vertical document scrolling stays native. Only horizontal gestures
   inside the calendar change the selected day, week or month. */
const gestureArea=$('calendarView');
let calendarTouch=null,lastCalendarSwipe=0;
gestureArea.addEventListener('touchstart',event=>{
 if(page.hidden||mode==='deadlines'||event.touches.length!==1){calendarTouch=null;return}
 const point=event.touches[0];
 calendarTouch={id:point.identifier,x:point.clientX,y:point.clientY,time:Date.now()};
},{passive:true});
gestureArea.addEventListener('touchend',event=>{
 if(!calendarTouch)return;
 const start=calendarTouch;calendarTouch=null;
 if(page.hidden||mode==='deadlines')return;
 const point=Array.from(event.changedTouches).find(t=>t.identifier===start.id);
 if(!point)return;
 const dx=point.clientX-start.x,dy=point.clientY-start.y;
 if(Math.abs(dx)<52||Math.abs(dx)<Math.abs(dy)*1.4||Date.now()-start.time>1400)return;
 lastCalendarSwipe=Date.now();
 move(dx<0?1:-1);
},{passive:true});
gestureArea.addEventListener('touchcancel',()=>{calendarTouch=null},{passive:true});
function syncTimeDisplay(){
 const input=$('calendarEventTime'),display=$('calendarTimeDisplay');
 const value=input.value;
 display.textContent=value||'Выбрать';
 input.closest('.cal-time-control').dataset.filled=String(Boolean(value));
 $('calendarClearTime').hidden=!value;
 syncPlanningLabel();
}
/* Some iOS pickers briefly insert the current hour when they open.  Only keep
   that transient value if the native picker reports an actual change. */
let timePickerBaseline='',timePickerChanged=false;
function beginNativeTimePick(){
 timePickerBaseline=$('calendarEventTime').value;
 timePickerChanged=false;
}
function finishNativeTimePick(){
 const field=$('calendarEventTime');
 if(!timePickerChanged&&field.value!==timePickerBaseline)
  field.value=timePickerBaseline;
 syncTimeDisplay();
 showEventTimeHint();
}
function setEventKind(kind){
 const radio=form.querySelector('input[name="calendarEventKind"][value="'+(kind==='business'?'business':'personal')+'"]');
 if(radio)radio.checked=true;
}
function getEventKind(){
 if(!managerPreview())return 'personal';
 return form.querySelector('input[name="calendarEventKind"]:checked')?.value==='business'?'business':'personal';
}
function openEvent(id=null){
 const item=id?visibleEvents().find(x=>x.id===id):null;editing=item?.id||null;
 form.reset();
 $('calendarEventTitleHeading').textContent=item?'Изменить событие':'Новое событие';
 $('calendarEventName').value=item?.title||'';
 $('calendarEventDate').value=item?.date||iso();
 $('calendarEventTime').value=item?.time||'';
 choosePlanning(item?item.duration:60,item?item.travel:0);
 setReminder(item?item.remind:0);
 $('calendarEventTiming').open=false;
 form.querySelectorAll('.cal-timing-setting').forEach(section=>{section.open=false});
 syncTimeDisplay();
 const workKind=form.querySelector('input[name="calendarEventKind"][value="business"]')?.closest('label');
 if(workKind)workKind.hidden=!managerPreview();
 setEventKind(item?.kind||(selectedScope()==='business'?'business':'personal'));
 $('calendarEventExtra').open=Boolean(item?.note);
 $('calendarEventNote').value=item?.note||'';
 $('calendarDeleteEvent').hidden=!item;
 $('calendarEventStatus').textContent='';
 delete $('calendarEventStatus').dataset.smartCollision;
 const dialog=$('calendarEventDialog');
 if(!dialog.open)dialog.showModal();
 showEventTimeHint();
 // iOS sometimes restores the previous scroll offset of a reopened dialog.
 // Only desktop auto-focuses: focusing a text input on touch Safari may jump
 // the form past the title/name and unexpectedly open the software keyboard.
 const body=dialog.querySelector('.cal-form-scroll');
 if(body){
  body.scrollTop=0;
  window.requestAnimationFrame(()=>{if(dialog.open)body.scrollTop=0});
 }
 if(window.matchMedia('(pointer:fine)').matches)
  $('calendarEventName').focus({preventScroll:true});
}
function onSubmit(e){
 e.preventDefault();
 const name=$('calendarEventName').value.trim().replace(/\s+/g,' ').slice(0,140);
 const date=$('calendarEventDate').value,clock=$('calendarEventTime').value;
 const note=$('calendarEventNote').value.trim().slice(0,600);
 const kind=getEventKind();
 const settings=planningValues();
 const duration=clock?settings.duration:0,travel=clock?settings.travel:0;
 const remind=clock?reminderValue():0;
 const status=$('calendarEventStatus');
 if(!name){status.textContent='Укажите название события.';return}
 if(!at(date)){status.textContent='Выберите правильную дату.';return}
 if(clock&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)){status.textContent='Проверьте время.';return}
 const all=events(),old=all.find(x=>x.id===editing);
 if(!old&&all.length>=MAX){status.textContent='Сохранено 300 событий. Для новых удалите ненужные старые.';return}
 const conflict=timeCollision(date,clock,old?.id||null);
 if(conflict&&!window.confirm('В '+clock+' уже записано «'+conflict.title+'». Сохранить ещё одно событие на то же время?'))return;
 const nearby=!conflict?window.SEYVEO_CALENDAR_TIME?.nearest(all,date,clock,old?.id||null,{duration,travel}):null;
 if(nearby){
  const notice=nearby.kindOfIssue==='overlap'
   ?'Встречи пересекаются с учётом длительности и дороги.'
   :'Длительность одной встречи неизвестна. Время может быть занято.';
  if(!window.confirm(notice+' Рядом «'+nearby.title+'» ('+nearby.time+'). Всё равно сохранить '+clock+'?'))return;
 }
 const now=new Date().toISOString();
 const entry={id:old?.id||'calendar-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  title:name,date,time:clock,kind,duration,travel,remind,note,createdAt:old?.createdAt||now,updatedAt:now};
 const next=old?all.map(x=>x.id===old.id?entry:x):[...all,entry];
 if(!saveEvents(next)){status.textContent='Не удалось сохранить событие. Проверьте память браузера.';return}
 $('calendarEventDialog').close();
 updateFocus(at(date));window.dispatchEvent(new Event('seyveo:calendar-changed'));
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'calendar'}}));
}
function deleteEvent(){
 const old=events().find(x=>x.id===editing);if(!old)return;
 if(!window.confirm('Удалить событие «'+old.title+'»?'))return;
 const rest=events().filter(x=>x.id!==old.id);
 if(!saveEvents(rest)){$('calendarEventStatus').textContent='Не удалось удалить событие.';return}
 $('calendarEventDialog').close();render();window.dispatchEvent(new Event('seyveo:calendar-changed'));
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'calendar'}}));
}
function routeTask(id){
 // The task exists only in existing Personal Tasks: never duplicate its data.
 if(location.hash!=='#tasks')location.hash='#tasks';
 else $('navTasks')?.click();
 window.dispatchEvent(new CustomEvent('seyveo:calendar-task-view',{detail:{id}}));
}
function addTask(){
 $('personalAddTasks')?.click();
 const field=$('personalTaskDue');if(field){
  field.value=iso();
  field.dispatchEvent(new Event('input',{bubbles:true}));
 }
}
$('calendarAdd').addEventListener('click',()=>openEvent());
$('calendarAddInline').addEventListener('click',()=>openEvent());
$('calendarAddTask').addEventListener('click',addTask);
$('calendarToday').addEventListener('click',()=>updateFocus(new Date()));
document.querySelectorAll('#calendarPage [data-calendar-scope]').forEach(btn=>btn.addEventListener('click',()=>{
 const next=btn.dataset.calendarScope;
 if(!managerPreview()||!['all','personal','business'].includes(next))return;
 scope=next;
 render();
}));
document.querySelectorAll('[data-calendar-mode]').forEach(btn=>btn.addEventListener('click',()=>{
 mode=btn.dataset.calendarMode;render();
}));
for(const id of ['calendarMonthGrid','calendarWeekGrid']){
 $(id).addEventListener('click',event=>{
  const day=event.target.closest('[data-calendar-date]');if(!day||Date.now()-lastCalendarSwipe<400)return;
  const chosen=at(day.dataset.calendarDate);if(!chosen)return;
  updateFocus(chosen);
  revealSelectedDay();
 });
}
for(const id of ['calendarAgenda','calendarDeadlineList']){
 $(id).addEventListener('click',event=>{
  const entry=event.target.closest('.cal-entry');
  if(!entry)return;
  if(entry.dataset.calendarEvent)openEvent(entry.dataset.calendarEvent);
  else if(entry.dataset.calendarTask){
   const task=tasks().find(row=>row.id===entry.dataset.calendarTask&&!row.done);
   const name=task?window.SEYVEO_CONTACTS?.taskTarget?.(task.title)||'':'';
   if(name&&name===entry.dataset.calendarCall)
    window.dispatchEvent(new CustomEvent('seyveo:call-request',{detail:{target:name}}));
   else routeTask(entry.dataset.calendarTask);
  }
  else if(entry.dataset.calendarSpaceRecord)window.dispatchEvent(new CustomEvent('seyveo:space-edit',{detail:{space:entry.dataset.calendarSpaceItem,id:entry.dataset.calendarSpaceRecord}}));
 });
}
form.addEventListener('submit',onSubmit);
$('calendarDeleteEvent').addEventListener('click',deleteEvent);
$('calendarEventCancel').addEventListener('click',()=>$('calendarEventDialog').close());
for(const eName of ['input','change'])$('calendarEventDate').addEventListener(eName,showEventTimeHint);
/* Keep only one settings row open and close after any confirmed selection. */
const timingRows=Array.from(form.querySelectorAll('.cal-timing-setting'));
timingRows.forEach(row=>row.addEventListener('toggle',()=>{
 if(row.open)timingRows.forEach(other=>{if(other!==row)other.open=false});
}));
for(const name of ['calendarDuration','calendarTravel','calendarReminder']){
 form.querySelectorAll('input[name="'+name+'"]').forEach(input=>
  input.addEventListener('change',()=>{
   syncPlanningLabel();
   showEventTimeHint();
   const row=input.closest('.cal-timing-setting');
   if(row)row.open=false;
  })
 );
}
$('calendarTimeOptionsChoices').addEventListener('click',event=>{
 const choice=event.target.closest('[data-calendar-suggested-time]');
 if(!choice)return;
 const chosen=choice.dataset.calendarSuggestedTime;
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(chosen))return;
 $('calendarEventTime').value=chosen;
 syncTimeDisplay();
 showEventTimeHint();
});
$('calendarEventTime').addEventListener('focus',beginNativeTimePick);
$('calendarEventTime').addEventListener('change',()=>{timePickerChanged=true;syncTimeDisplay();showEventTimeHint()});
$('calendarEventTime').addEventListener('input',()=>{syncTimeDisplay();showEventTimeHint()});
$('calendarEventTime').addEventListener('blur',finishNativeTimePick);
$('calendarClearTime').addEventListener('click',()=>{
 const field=$('calendarEventTime');
 field.value='';
 timePickerBaseline='';timePickerChanged=false;
 syncTimeDisplay();
 showEventTimeHint();
});
$('calendarAdviceAction').addEventListener('click',()=>{
 if(!currentAdvice)return;
 const advice=currentAdvice;
 if(advice.kind==='event')openEvent(advice.id);
 else if(advice.kind==='deadlines'){
  mode='deadlines';render();
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 }else if(advice.kind==='day'){
  const day=at(advice.date);if(!day)return;
  if(mode==='deadlines')mode='month';
  updateFocus(day);
  revealSelectedDay();
 }
});
$('calendarEventDialog').addEventListener('click',event=>{
 if(event.target===$('calendarEventDialog'))$('calendarEventDialog').close();
});
window.SEYVEO_CALENDAR_DATE=iso;
window.addEventListener('seyveo:calendar-open',()=>{render()});
window.addEventListener('seyveo:calendar-manager-context',event=>{
 if(event.detail?.active!==true||!managerPreview())return;
 scope='all';
 render();
});
window.addEventListener('seyveo:spaces-changed',()=>{if(!page.hidden)render()});
/* Explicit assistant appointments: save local appointments immediately when
 * well-defined; ask for clarification on clashes or missing meeting time.
 * The source store and rendering stay owned by Calendar, not the assistant. */
window.addEventListener('seyveo:calendar-save-from-ask',event=>{
 const plan=event.detail;
 if(!plan||plan.status!=='ready')return;
 const title=typeof plan.title==='string'?plan.title.trim().replace(/\s+/g,' ').slice(0,140):'';
 const date=typeof plan.date==='string'?plan.date:'';
 const time=typeof plan.time==='string'?plan.time:'';
 const atTime=plan.remindAtStart===true;
 const finish=(status,message)=>{plan.result={status,message}};
 if(!title||!at(date)||time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){
  finish('clarify','Уточни, пожалуйста, название, день или время события.');return;
 }
 if(!time&&/\b(?:встреча|встречу|звонок|при[её]м|собеседование)\b/i.test(title)){
  finish('clarify','Во сколько будет встреча? Назови время, и я запишу её.');return;
 }
 const all=events();
 const identity=t=>t.trim().replace(/\s+/g,' ').toLocaleLowerCase('ru-RU');
 const existing=all.find(x=>x.date===date&&x.time===time&&identity(x.title)===identity(title));
 if(existing){
  if(atTime&&existing.remind!==-1){
   const revised=all.map(x=>x.id===existing.id?{...x,remind:-1,updatedAt:new Date().toISOString()}:x);
   if(!saveEvents(revised)){finish('error','Не удалось включить напоминание.');return}
   window.dispatchEvent(new Event('seyveo:calendar-changed'));
   finish('saved','Напоминание включено для существующего события.');return;
  }
  finish('already','Такое событие уже сохранено.');return;
 }
 if(all.length>=MAX){finish('full','В календаре уже 300 событий. Для новых нужно освободить место.');return;}
 if(time){
  const collides=timeCollision(date,time);
  const near=window.SEYVEO_CALENDAR_TIME?.nearest(all,date,time,null,{duration:60,travel:0});
  if(collides||near){
   const titleOf=(collides||near).title.slice(0,60);
   finish('clarify','В это время уже есть или близко другое событие — «'+titleOf+'». Назови другое время или открой календарь.');return;
  }
 }
 const now=new Date().toISOString();
 const entry={
  id:'calendar-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  title,date,time,kind:'personal',duration:0,travel:0,remind:atTime?-1:0,note:'',createdAt:now,updatedAt:now
 };
 if(!saveEvents([...all,entry])){finish('error','Не удалось сохранить событие. Проверь память устройства.');return;}
 if(!page.hidden)updateFocus(at(date));
 window.dispatchEvent(new Event('seyveo:calendar-changed'));
 finish('saved','Событие добавлено в календарь.');
});
/* Assistant scheduling requests prepare a draft, never save without approval. */
window.addEventListener('seyveo:calendar-from-ask',event=>{
 const plan=event.detail;
 if(!plan||plan.status!=='ready'||!at(plan.date)||typeof plan.title!=='string')return;
 if(location.hash!=='#calendar')location.hash='#calendar';
 window.requestAnimationFrame(()=>{
  updateFocus(at(plan.date));
  openEvent();
  $('calendarEventName').value=plan.title.slice(0,140);
  $('calendarEventDate').value=plan.date;
  $('calendarEventTime').value=plan.time||'';
  syncTimeDisplay();
  setEventKind('personal');
  showEventTimeHint();
  if(!$('calendarEventStatus').dataset.smartCollision)
   $('calendarEventStatus').textContent='SEYVEO подготовил событие. Проверьте дату и время, затем сохраните.';
 });
});
window.addEventListener('seyveo:calendar-plan-note',event=>{
 const value=String(event.detail?.text||'').trim();
 const preferredDate=String(event.detail?.date||'');
 if(location.hash!=='#calendar')location.hash='#calendar';
 openEvent();
 $('calendarEventName').value=value.replace(/\s+/g,' ').slice(0,140);
 // Weekday dates from Notebook are ONLY a proposed date in the review form.
 const isRealDate=/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)&&
  Boolean(at(preferredDate));
 if(isRealDate){
  $('calendarEventDate').value=preferredDate;
  $('calendarEventDate').dispatchEvent(new Event('change',{bubbles:true}));
 }
 const proposedTime=String(event.detail?.time||'');
 if(isRealDate&&/^([01]\\d|2[0-3]):[0-5]\\d$/.test(proposedTime)){
  $('calendarEventTime').value=proposedTime;
  syncTimeDisplay();
  showEventTimeHint();
 }
 if(value.length>140){
  $('calendarEventNote').value=value.slice(140,740);
  $('calendarEventExtra').open=true;
 }
});
window.addEventListener('seyveo:tasks-changed',()=>{if(!page.hidden)render()});
window.addEventListener('storage',event=>{if((event.key===STORE||event.key===TASKS)&&!page.hidden)render()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!page.hidden)render()});
// Browser timers may pause on iOS when the app is not visible. No background guarantee.
window.setInterval(()=>{if(!page.hidden&&!document.hidden)renderAdvice()},60*1000);
// A saved #calendar URL may be active before this script initializes.
if(!page.hidden)render();
})();