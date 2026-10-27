/* SEYVEO Life spaces: private browser data and informational adult-home BP categories.
   No diagnosis, predictions, prescriptions or automatic transfer of records. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),dialog=$('calendarSpaceDialog');
if(!dialog||!$('calendarSpaces'))return;
const KEY='seyveo-life-spaces-v1',MAX=240;
const META=Object.freeze({
 health:{name:'Здоровье',desc:'Ваши измерения и личные записи',kinds:['Давление','Пульс','Шаги','Самочувствие','Другое'],placeholder:'Например, 120/80'},
 care:{name:'Забота ♡',desc:'Дыхание, вода, шаги, отдых для глаз и цикл',kinds:['О себе','О близких','Личное','Другое'],placeholder:'Например, записаться на приём'},
 world:{name:'Мой мир',desc:'Ваши люди, важные даты и общение',kinds:['День рождения','Важная дата','Человек','Другое'],placeholder:'Например, мама'}
});
const raw=()=>{try{return localStorage.getItem(KEY)}catch{return null}};
function dateValid(s){
 if(typeof s!=='string'||! /^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const [y,m,d]=s.split('-').map(Number),v=new Date(y,m-1,d);
 return v.getFullYear()===y&&v.getMonth()+1===m&&v.getDate()===d;
}
function read(){
 try{
  const v=JSON.parse(raw()||'[]');
  return (Array.isArray(v)?v:[]).filter(x=>x&&typeof x.id==='string'&&META[x.space]&&typeof x.title==='string')
  .slice(-MAX).map(x=>({
   id:x.id,space:x.space,title:x.title.trim().slice(0,110),
   kind:META[x.space].kinds.includes(x.kind)?x.kind:META[x.space].kinds[0],
   date:dateValid(x.date)?x.date:'',
   detail:typeof x.detail==='string'?x.detail.slice(0,500):'',
   bpPulse:Number.isInteger(x.bpPulse)&&x.bpPulse>=30&&x.bpPulse<=240?x.bpPulse:null,
   recordedAt:Number.isSafeInteger(x.recordedAt)&&x.recordedAt>0?x.recordedAt:0,
   yearless:x.space==='world'&&x.kind==='День рождения'&&x.yearless===true
  })).filter(x=>x.title);
 }catch{return []}
}
function store(items){
 try{localStorage.setItem(KEY,JSON.stringify(items.slice(-MAX)));window.dispatchEvent(new Event('seyveo:spaces-changed'));return true}
 catch{return false}
}
function dom(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el}
function calendarItems(ymd){
 if(!dateValid(ymd))return [];
 const [year,month,day]=ymd.split('-');
 return read().filter(x=>x.date&&(
  x.yearless?x.date.slice(5)===month+'-'+day:x.date===ymd
 )).map(x=>({
  id:x.id,space:x.space,source:'space',date:ymd,kind:x.kind,
  title:x.title,time:'',note:x.detail,
  label:META[x.space].name,
  sort:x.space==='health'?'96:00':'97:00'
 }));
}
function upcoming(start,end){
 const all=read().filter(x=>x.date&&x.space!=='health');
 let ans=[];
 const startDate=new Date(start+'T12:00:00'),endDate=new Date(end+'T12:00:00');
 if(isNaN(startDate.getTime())||isNaN(endDate.getTime()))return [];
 for(let stamp=startDate;stamp<=endDate;stamp.setDate(stamp.getDate()+1)){
  const ymd=[stamp.getFullYear(),String(stamp.getMonth()+1).padStart(2,'0'),String(stamp.getDate()).padStart(2,'0')].join('-');
  for(const x of all){
   if(x.yearless?x.date.slice(5)===ymd.slice(5):x.date===ymd)ans.push({
     id:x.id,space:x.space,source:'space',date:ymd,kind:x.kind,
     title:x.title,label:META[x.space].name,time:'',note:x.detail,sort:'97:00'
   });
  }
 }
 return ans;
}

/* The old space log remains the only source for steps. No migration or duplicate key. */
function stepsFor(date){
 if(!dateValid(date))return null;
 const rows=read().filter(x=>x.space==='health'&&x.kind==='Шаги'&&x.date===date);
 return rows[rows.length-1]||null;
}
function saveSteps(date,steps){
 if(!dateValid(date))return false;
 const now=new Date(),max=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 if(date>max)return false;
 if(!Number.isInteger(steps)||steps<0||steps>200000)return false;
 const all=read(),existing=stepsFor(date),row=existing?{
  ...existing,title:String(steps)
 }:{id:'space-steps-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
  space:'health',kind:'Шаги',title:String(steps),date,detail:'',yearless:false};
 if(!existing&&all.length>=MAX)return false;
 return store(existing?all.map(x=>x.id===existing.id?row:x):[...all,row]);
}
window.SEYVEO_SPACES=Object.freeze({calendarItems,upcoming,stepsFor,saveSteps});
let current='health',editing=null;
const healthUnits=Object.freeze({
 'Давление':['calHealthPressureValue','calHealthPressureDate'],
 'Пульс':['calHealthPulseValue','calHealthPulseDate']
});
/* SEYVEO Life: world hub reads the single existing Contacts source of truth.
   No copying, syncing or invented entries. Accessible for product testing. */
function worldContacts(){
 const reply={items:[]};
 window.dispatchEvent(new CustomEvent('seyveo:contacts-read',{detail:reply}));
 return Array.isArray(reply.items)?reply.items.filter(row=>
  row&&typeof row.id==='string'&&typeof row.name==='string'&&
  typeof row.phone==='string').slice(0,40):[];
}
function renderWorldHub(){
 const hub=$('seyveoWorldHub');
 if(!hub)return;
 hub.hidden=current!=='world';
 if(current!=='world')return;
 const contacts=worldContacts();
 const holder=$('worldPeopleList');
 holder.replaceChildren();
 const n=contacts.length;
 $('worldContactsSummary').textContent=n+' '+(n%10===1&&n%100!==11?'контакт':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'контакта':'контактов');
 if(!contacts.length){
  holder.append(dom('p','world-people-empty','Пока нет контактов. Добавьте первого человека кнопкой ＋.'));
  return;
 }
 for(const entry of contacts){
  const row=dom('div','world-person-row');
  // Open the same existing contact directory: no duplicate editor or store.
  const detail=dom('button','world-person-info');
  detail.type='button';detail.dataset.worldOpen=entry.id;
  detail.setAttribute('aria-label','Открыть справочник: '+entry.name);
  detail.append(dom('strong','',entry.name),dom('small','',entry.phone));
  const call=dom('button','world-person-call');
  call.type='button';call.dataset.worldCall=entry.id;
  call.title='Позвонить';call.setAttribute('aria-label','Подготовить звонок: '+entry.name);
  call.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.8c-.3-.7-1.1-1-1.8-.7L3.5 4a2 2 0 0 0-1.1 2.3 19 19 0 0 0 15.3 15.3 2 2 0 0 0 2.3-1.1l.9-1.9c.3-.7 0-1.5-.7-1.8l-4-1.6c-.6-.2-1.2-.1-1.6.4L13 17a15 15 0 0 1-6-6l1.4-1.6c.4-.4.6-1 .4-1.6z"/></svg>';
  row.append(detail,call);
  holder.append(row);
 }
}
/* Pressure journal · three real readings, explanatory context only.
   Home guidance uses ESC 2024 135/85 threshold for averaged home readings.
   No diagnosis, predicted measurement, automatic medication or data transfer. */
function bpParse(x){
 if(!x||x.kind!=='Давление')return null;
 const m=/^(\d{2,3})\s*\/\s*(\d{2,3})(?:\b|$)/.exec(x.title);
 if(!m)return null;
 const s=Number(m[1]),d=Number(m[2]);
 if(s<50||s>300||d<30||d>200||s<=d)return null;
 return {s,d,p:Number.isInteger(x.bpPulse)?x.bpPulse:null,date:x.date||'',time:x.recordedAt||0};
}
function bpAssess(s,d,p){
 let level,summary,advice;
 if(s>=180||d>=120){
  level='urgent';summary='Очень высокое давление';
  advice='Если есть боль в груди, одышка, выраженная слабость, онемение, нарушение зрения или речи — немедленно вызывайте экстренную помощь по местному номеру. Не ждите второго измерения при таких симптомах. Без симптомов повторите замер через минуту и срочно свяжитесь с врачом, если значение остаётся очень высоким.';
 }else if(s<90||d<60){
  level='low';summary='Возможно пониженное давление';
  advice='Давление может быть пониженным. При головокружении безопасно присядьте или прилягте. Если есть обморок или выраженная слабость, нужна срочная медицинская помощь. Если самочувствие хорошее, повторите измерение после отдыха.';
 }else if(s>=160||d>=100){
  level='high';summary='Значительно выше домашнего ориентира';
  advice='Значение значительно повышено. Посидите спокойно пять минут и повторите измерение через 1–2 минуты. Если давление остаётся высоким, обратитесь к врачу в ближайшее время. Не меняйте лечение самостоятельно.';
 }else if(s>=135||d>=85){
  level='raised';summary='Выше ориентира для домашних измерений';
  advice='По европейскому ориентиру для среднего домашнего давления это повышенный результат. Повторите измерение через 1–2 минуты после спокойного отдыха. Если такие значения повторяются, обсудите их с врачом.';
 }else if(s>=120||d>=70){
  level='watch';summary='Немного выше оптимального домашнего диапазона';
  advice='Это выше оптимального диапазона, но один замер не означает диагноз. Повторите измерение после спокойного отдыха через 1–2 минуты. Сэйви сохранит два результата и покажет среднее, если их измерили рядом по времени.';
 }else{
  level='usual';summary='Ниже ориентира повышенного домашнего давления';
  advice='По используемому ориентиру результат не повышен. Учитывайте самочувствие и рекомендации своего врача: один замер не заменяет наблюдения за несколькими днями.';
 }
 if(Number.isInteger(p)&&(p>100||p<60)){
  advice+=' Пульс '+p+' в минуту выходит за обычный диапазон покоя 60–100: нагрузка и индивидуальные особенности важны. При боли в груди, обмороке или одышке обращайтесь за экстренной помощью.';
 }
 if(level!=='urgent')advice+=' Перед измерением избегайте нагрузки и кофеина за 30 минут, держите руку на уровне сердца.';
 return {level,summary,advice};
}
function bpReadings(){
 return read().filter(x=>x.space==='health'&&x.kind==='Давление')
  .map((x,index)=>({bp:bpParse(x),index})).filter(x=>x.bp)
  .sort((a,b)=>b.bp.date.localeCompare(a.bp.date)||b.bp.time-a.bp.time||b.index-a.index)
  .map(x=>x.bp);
}
function bpAverage(list){
 if(list.length<2)return null;
 const [a,b]=list;
 if(!a.time||!b.time||a.date!==b.date||Math.abs(a.time-b.time)>30*60*1000)return null;
 return {s:Math.round((a.s+b.s)/2),d:Math.round((a.d+b.d)/2),
  p:Number.isInteger(a.p)&&Number.isInteger(b.p)?Math.round((a.p+b.p)/2):null};
}
function bpReport(){
 const box=$('calendarBpReport'),records=bpReadings();
 box.hidden=current!=='health'||records.length===0;
 if(box.hidden)return;
 const bp=records[0],info=bpAssess(bp.s,bp.d,bp.p);
 box.dataset.level=info.level;
 $('calendarBpReportStatus').textContent=info.summary+' · '+bp.s+'/'+bp.d+' мм рт. ст.'+(bp.p!==null?', пульс '+bp.p:'');
 $('calendarBpReportAdvice').textContent=info.advice;
 const average=bpAverage(records),node=$('calendarBpReportAverage');
 node.hidden=!average;
 if(average)node.textContent='Среднее двух замеров в пределах 30 минут: '+average.s+'/'+average.d+' мм рт. ст.'+(average.p!==null?', пульс '+average.p:'')+'. Это среднее, а не прогноз следующего результата.';
}
function bpPreview(){
 const box=$('calendarBpLiveAdvice');
 const ids=['calendarBpSystolic','calendarBpDiastolic','calendarBpPulse'];
 if(ids.some(id=>!$(id).value.trim())){box.textContent='Введите три значения с тонометра. Сэйви объяснит результат.';box.dataset.level='neutral';return;}
 const [s,d,p]=ids.map(id=>Number($(id).value));
 if(![s,d,p].every(Number.isInteger)||s<50||s>300||d<30||d>200||s<=d||p<30||p>240){
  box.textContent='Проверьте числа: верхнее должно быть больше нижнего. Если показатели необычные, повторите измерение и при плохом самочувствии обратитесь за медицинской помощью.';
  box.dataset.level='neutral';return;
 }
 const info=bpAssess(s,d,p);
 box.textContent='Сэйви · '+info.summary+'. '+info.advice;
 box.dataset.level=info.level;
}
function bpForm(item=null){
 const active=current==='health'&&$('calendarSpaceKind').value==='Давление';
 $('calendarBloodPressureFields').hidden=!active;
 $('calendarSpaceGenericValue').hidden=active;
 $('calendarSpaceTitle').required=!active;
 if(active){
  const bp=bpParse(item);
  $('calendarBpSystolic').value=bp?String(bp.s):'';
  $('calendarBpDiastolic').value=bp?String(bp.d):'';
  $('calendarBpPulse').value=bp?.p!==null&&bp?.p!==undefined?String(bp.p):'';
 }
 bpPreview();
}
for(const id of ['calendarBpSystolic','calendarBpDiastolic','calendarBpPulse']){
 $(id).addEventListener('input',bpPreview);
}
function renderHealthOverview(){
 const overview=$('calendarHealthOverview');overview.hidden=current!=='health';
 if(current!=='health')return;
 const records=read().filter(x=>x.space==='health');
 const formatted=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'});
 for(const [kind,[valueId,dateId]] of Object.entries(healthUnits)){
  const matching=records.map((x,i)=>({x,i})).filter(a=>a.x.kind===kind||
   (kind==='Пульс'&&a.x.kind==='Давление'&&Number.isInteger(a.x.bpPulse)));
  const latest=matching.sort((a,b)=>
   (b.x.date||'').localeCompare(a.x.date||'')||(b.x.recordedAt||0)-(a.x.recordedAt||0)||b.i-a.i
  )[0]?.x;
  const display=latest&&kind==='Пульс'&&latest.kind==='Давление'?latest.bpPulse+' уд/мин':latest?.title||'Нет записей';
  $(valueId).textContent=display;
  $(dateId).textContent=latest?(latest.date?'Последняя запись · '+formatted.format(new Date(latest.date+'T12:00:00')):'Последняя запись · без даты'):'';
  $(valueId).closest('[data-health-quick]')?.setAttribute('data-has-record',String(Boolean(latest)));
 }
 bpReport();
}
function renderList(){
 const root=$('calendarSpaceList');root.replaceChildren();
 const items=read().filter(x=>x.space===current&&!(current==='health'&&x.kind==='Шаги')).sort((a,b)=>
  current==='health'?(b.date||'').localeCompare(a.date||''):
   (a.date||'9999').localeCompare(b.date||'9999')
 );
 renderHealthOverview();
 renderWorldHub();
 const count=items.length;
 const ending=count%10===1&&count%100!==11?'запись':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'записи':'записей';
 $('calendarSpaceCount').textContent=count+' '+ending;
 const journalLabel=$('calendarSpaceJournal')?.querySelector('summary');
 if(journalLabel){
  const name=current==='health'?'История измерений':current==='care'?'Другие записи':current==='world'?'Важные даты':'Личные записи';
  journalLabel.textContent=count?name+' · '+count:name;
 }
 if(!items.length){
  const empty=dom('p','calendar-space-empty',current==='health'
   ?'Выберите показатель выше, чтобы внести первую запись.'
   :'Пока нет записей. Здесь будет только то, что вы внесёте сами.');
  root.append(empty);return;
 }
 for(const item of items){
  const row=dom('button','calendar-space-record');
  row.type='button';row.dataset.spaceRecord=item.id;
  row.setAttribute('aria-label','Изменить: '+item.title);
  const copy=dom('span','calendar-space-record-copy');
  const stamp=item.date?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date(item.date+'T12:00:00')):'Без даты';
  copy.append(dom('strong','',item.title),dom('small','',item.kind+' · '+stamp+(item.yearless?' · каждый год':'')));
  row.append(copy,dom('span','calendar-space-record-arrow','›'));
  root.append(row);
 }
}
function renderForm(){
 const item=read().find(x=>x.id===editing&&x.space===current);
 $('calendarSpaceForm').hidden=!editing&&$('calendarSpaceForm').dataset.show!=='true';
 $('calendarSpaceFormTitle').textContent=current==='health'?
  (item?'Изменить измерение':'Новое измерение'):
  (item?'Изменить запись':'Новая запись');
 $('calendarSpaceNameLabel').textContent=current==='world'?'Человек или событие':current==='health'?'Значение или запись':'Что важно не забыть?';
 $('calendarSpaceTitle').placeholder=META[current].placeholder;
 $('calendarSpaceDelete').hidden=!item;
 $('calendarSpaceAnnualLabel').hidden=current!=='world';
 $('calendarSpaceAnnual').disabled=current!=='world';
 const kind=$('calendarSpaceKind');kind.replaceChildren();
 for(const k of META[current].kinds.filter(k=>!(current==='health'&&k==='Шаги'))){
  const opt=dom('option','',k);opt.value=k;kind.append(opt);
 }
 if(item){
  $('calendarSpaceTitle').value=item.title;
  kind.value=item.kind;
  $('calendarSpaceDate').value=item.date;
  $('calendarSpaceDetail').value=item.detail;
  $('calendarSpaceAnnual').checked=item.yearless;
 }else{
  $('calendarSpaceFormFields').reset();
  const stamp=$('calendarSpaceDate').dataset.selectedDate;
  const now=new Date();
  const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  // New measurements get a date by default; personal dates remain optional.
  $('calendarSpaceDate').value=stamp||(current==='health'?today:'');
 }
 updateHealthPlaceholder();
 svSyncControls();
 bpForm(item);
}
function updateHealthPlaceholder(){
 if(current!=='health')return;
 const examples={'Давление':'Например, 120/80','Пульс':'Например, 72 уд/мин','Шаги':'Например, 6200','Самочувствие':'Как вы себя чувствуете?'};
 $('calendarSpaceTitle').placeholder=examples[$('calendarSpaceKind').value]||'Ваша запись';
}
/* Same Velvet dropdown language as Health/Care — keep original form inputs authoritative. */
const svKind=$('calendarSpaceKind'),svDate=$('calendarSpaceDate');
const svKindButton=document.createElement('button'),svDateButton=document.createElement('button');
const svPicker=document.createElement('section');
let svPickerField=null,svPickerYear=0,svPickerMonth=0;
svPicker.className='cal-velvet-picker';svPicker.hidden=true;
svPicker.setAttribute('role','dialog');svPicker.setAttribute('aria-label','Выбор значения');
svPicker.tabIndex=-1;
dialog.append(svPicker);
function svSyncControls(){
 svKindButton.textContent=svKind.selectedOptions[0]?.textContent||'Выбрать раздел';
 svDateButton.textContent=svDate.value?
  new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(svDate.value+'T12:00:00')):'Выбрать дату';
}
function svClosePicker(focus=true){
 const button=svPickerField==='kind'?svKindButton:svDateButton;
 svPicker.hidden=true;svPicker.replaceChildren();svPickerField=null;
 svKindButton.setAttribute('aria-expanded','false');svDateButton.setAttribute('aria-expanded','false');
 if(focus)button.focus({preventScroll:true});
}
function svPickerTitle(title){
 const head=document.createElement('div');head.className='cal-velvet-picker-head';
 const name=document.createElement('strong');name.textContent=title;head.append(name);
 const close=document.createElement('button');close.type='button';close.textContent='Готово';close.dataset.svClosePicker='1';head.append(close);
 svPicker.append(head);
}
function svRenderKind(){
 svPicker.replaceChildren();svPickerTitle('Раздел');
 const list=document.createElement('div');list.className='cal-velvet-choices';
 for(const option of svKind.options){
  const button=document.createElement('button');button.type='button';button.dataset.svKind=option.value;
  button.textContent=option.textContent;button.setAttribute('aria-pressed',String(svKind.value===option.value));
  list.append(button);
 }
 svPicker.append(list);
}
function svRenderDate(){
 svPicker.replaceChildren();
 const head=document.createElement('div');head.className='cal-velvet-month';
 const prev=document.createElement('button');prev.type='button';prev.dataset.svMonth='-1';prev.setAttribute('aria-label','Предыдущий месяц');prev.textContent='‹';
 const name=document.createElement('strong');
 name.textContent=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(new Date(svPickerYear,svPickerMonth,1,12));
 const next=document.createElement('button');next.type='button';next.dataset.svMonth='1';next.setAttribute('aria-label','Следующий месяц');next.textContent='›';
 head.append(prev,name,next);svPicker.append(head);
 const weekdays=document.createElement('div');weekdays.className='cal-velvet-weekdays';
 for(const label of ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']){const el=document.createElement('span');el.textContent=label;weekdays.append(el);}
 svPicker.append(weekdays);
 const grid=document.createElement('div');grid.className='cal-velvet-days';
 const month=new Date(svPickerYear,svPickerMonth,1,12),offset=(month.getDay()+6)%7;
 for(let i=0;i<offset;i++)grid.append(document.createElement('span'));
 for(let day=1,limit=new Date(svPickerYear,svPickerMonth+1,0).getDate();day<=limit;day++){
  const date=[svPickerYear,String(svPickerMonth+1).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
  const button=document.createElement('button');button.type='button';button.textContent=day;
  button.dataset.svDate=date;button.setAttribute('aria-pressed',String(date===svDate.value));
  if(date===new Date().toLocaleDateString('sv-SE'))button.classList.add('is-today');
  grid.append(button);
 }
 svPicker.append(grid);
 const foot=document.createElement('div');foot.className='cal-velvet-picker-foot';
 for(const [key,label] of [['today','Сегодня'],['clear','Без даты']]){
  const button=document.createElement('button');button.type='button';button.dataset.svDateAction=key;button.textContent=label;foot.append(button);
 }svPicker.append(foot);
}
for(const [input,button,label] of [[svKind,svKindButton,'Раздел'],[svDate,svDateButton,'Дата']]){
 input.classList.add('cal-velvet-original');
 input.tabIndex=-1;
 button.type='button';button.className='cal-velvet-trigger';button.setAttribute('aria-label',label);
 button.id=input.id+'VelvetButton';input.parentElement.htmlFor=button.id;
 button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 input.insertAdjacentElement('afterend',button);
 input.addEventListener('change',svSyncControls);
}
function svOpenPicker(field){
 if(svPickerField===field&&!svPicker.hidden){svClosePicker();return;}
 svPickerField=field;
 if(field==='date'){const value=svDate.value||new Date().toLocaleDateString('sv-SE');const date=new Date(value+'T12:00:00');svPickerYear=date.getFullYear();svPickerMonth=date.getMonth();svRenderDate();}
 else svRenderKind();
 svPicker.hidden=false;svKindButton.setAttribute('aria-expanded',String(field==='kind'));svDateButton.setAttribute('aria-expanded',String(field==='date'));
 const button=svPicker.querySelector('button');button?.focus({preventScroll:true});
}
svKindButton.addEventListener('click',()=>svOpenPicker('kind'));
svDateButton.addEventListener('click',()=>svOpenPicker('date'));
svPicker.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.svClosePicker){svClosePicker();return;}
 if(button.dataset.svMonth){const d=new Date(svPickerYear,svPickerMonth+Number(button.dataset.svMonth),1,12);svPickerYear=d.getFullYear();svPickerMonth=d.getMonth();svRenderDate();return;}
 if(button.dataset.svKind!==undefined){svKind.value=button.dataset.svKind;svKind.dispatchEvent(new Event('change',{bubbles:true}));svSyncControls();svClosePicker();return;}
 let date=button.dataset.svDate;
 if(button.dataset.svDateAction==='today')date=new Date().toLocaleDateString('sv-SE');
 if(button.dataset.svDateAction==='clear')date='';
 if(date!==undefined){svDate.value=date;svDate.dispatchEvent(new Event('change',{bubbles:true}));svSyncControls();svClosePicker();}
});
dialog.addEventListener('click',event=>{if(svPicker.hidden)return;if(!event.target.closest('.cal-velvet-picker,.cal-velvet-trigger'))svClosePicker(false);});
dialog.addEventListener('keydown',event=>{if(event.key==='Escape'&&!svPicker.hidden){event.preventDefault();event.stopPropagation();svClosePicker();}});
dialog.addEventListener('close',()=>{if(!svPicker.hidden)svClosePicker(false);});
svSyncControls();

function measurementFocus(active){
 const enabled=Boolean(active&&current==='health');
 dialog.dataset.measureFocus=String(enabled);
 $('calendarMeasureBack').hidden=!enabled;
 if(enabled){
  $('calendarSpaceJournal').open=true;
  dialog.scrollTop=0;
 }
}
function leaveMeasurement(message=''){
 if(!svPicker.hidden)svClosePicker(false);
 const active=document.activeElement;
 if(active&&dialog.contains(active)&&active.matches('input,textarea,select'))active.blur();
 const category=$('calendarSpaceKind').value;
 editing=null;
 $('calendarSpaceForm').dataset.show='false';
 measurementFocus(false);
 $('calendarSpaceJournal').open=false;
 renderList();renderForm();
 $('calendarSpaceStatus').textContent=message;
 dialog.scrollTop=0;
 // The user returns to the overview, not a hidden form field.
 const target=[...$('calendarHealthOverview').querySelectorAll('[data-health-quick]')]
  .find(node=>node.dataset.healthQuick===category)||$('calendarSpaceClose');
 target.focus({preventScroll:true});
}
function open(space,id=null,selectedDate=''){
 if(!META[space])return;
 const legacyStep=id&&read().find(row=>row.id===id&&row.kind==='Шаги'&&row.space==='health');
 if(legacyStep){
  open('care');
  window.dispatchEvent(new CustomEvent('seyveo:care-steps-open',{detail:{date:legacyStep.date}}));
  return;
 }
 current=space;editing=id;
 dialog.dataset.space=space;
 measurementFocus(false);
 const journal=$('calendarSpaceJournal');
 if(journal){
  // The metric tiles are the primary actions; the full log stays one tap away.
  // Editing an existing record still opens the journal immediately.
  // Important dates remain available, but do not expand a third heavy panel
  // by default on the World overview; edits still reveal the journal.
  journal.open=Boolean(id);
  const title=journal.querySelector('summary');
  if(title)title.textContent=space==='health'?'История измерений':space==='care'?'Другие записи':'Важные даты и записи';
 }
 $('calendarSpaceForm').dataset.show=id?'true':'false';
 $('calendarSpaceDate').dataset.selectedDate=selectedDate;
 $('calendarSpaceTitleHeading').textContent=META[space].name;
 $('calendarSpaceIntro').textContent=META[space].desc;
 $('calendarSpacePrivacy').textContent=space==='health'
   ?'Ручной ввод, без шифрования. Apple Health не подключён. Не для медицинских решений.'
   :space==='care'
   ?'Личные записи остаются в этом браузере без шифрования. Отправка другим людям и напоминания пока не подключены.'
   :'Даты и имена хранятся только в этом браузере без шифрования. При выборе «Каждый год» день рождения появится ежегодно.';
 $('calendarSpaceStatus').textContent='';
 $('calendarSpaceAdd').textContent=space==='health'?'＋ Запись':'＋ Добавить';
 renderList();renderForm();
 if(!dialog.open)dialog.showModal();
 window.dispatchEvent(new CustomEvent('seyveo:space-opened',{detail:{space}}));
 if(id&&space==='health'){
  measurementFocus(true);
  $('calendarMeasureBack').focus({preventScroll:true});
 }else if(id)$('calendarSpaceTitle').focus({preventScroll:true});
 else dialog.scrollTop=0;
}
function add(kind=null){
 // Health overview and history share this single form; reveal it before focus.
 const journal=$('calendarSpaceJournal');
 if(journal&&!journal.open)journal.open=true;
 editing=null;$('calendarSpaceForm').dataset.show='true';renderForm();
 if(typeof kind==='string'&&current==='health'&&healthUnits[kind]){
  $('calendarSpaceKind').value=kind;
  svSyncControls();
  updateHealthPlaceholder();
  bpForm();
 }
 if(current==='health'){
  measurementFocus(true);
  $('calendarMeasureBack').focus({preventScroll:true});
 }else $('calendarSpaceTitle').focus({preventScroll:true});
}
function save(event){
 event.preventDefault();
 const isBP=current==='health'&&$('calendarSpaceKind').value==='Давление';
 const ids=['calendarBpSystolic','calendarBpDiastolic','calendarBpPulse'];
 const vals=ids.map(id=>$(id).value.trim());
 const [sys,dia,pulse]=vals.map(Number);
 const validBp=vals.every(Boolean)&&[sys,dia,pulse].every(Number.isInteger)&&
  sys>=50&&sys<=300&&dia>=30&&dia<=200&&sys>dia&&pulse>=30&&pulse<=240;
 const title=isBP?sys+'/'+dia:$('calendarSpaceTitle').value.trim().replace(/\s+/g,' ').slice(0,110);
 const date=$('calendarSpaceDate').value;
 const status=$('calendarSpaceStatus');
 if(isBP&&!validBp){status.textContent='Проверьте верхнее, нижнее и пульс. Нужны три корректных числа.';return}
 if(!title){status.textContent='Напишите название.';return}
 if(date&&!dateValid(date)){status.textContent='Проверьте дату.';return}
 const all=read(),old=all.find(x=>x.id===editing&&x.space===current);
 if(!old&&all.length>=MAX){status.textContent='Достигнут предел записей. Удалите ненужные записи.';return}
 const row={
  id:old?.id||'space-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  space:current,title,kind:$('calendarSpaceKind').value,date,
  detail:$('calendarSpaceDetail').value.trim().slice(0,500),
  bpPulse:isBP?pulse:null,
  recordedAt:isBP?(old?.recordedAt||Date.now()):0,
  yearless:current==='world'&&$('calendarSpaceKind').value==='День рождения'&&$('calendarSpaceAnnual').checked&&!!date
 };
 const updated=old?all.map(x=>x.id===old.id?row:x):[...all,row];
 if(!store(updated)){status.textContent='Не удалось сохранить. Проверьте память браузера.';return}
 if(current==='health'&&dialog.dataset.measureFocus==='true'){
  leaveMeasurement('Сохранено на этом устройстве');
 }else{
  editing=null;$('calendarSpaceForm').dataset.show='false';renderList();renderForm();
  status.textContent='Сохранено на этом устройстве';
 }
}
function remove(){
 const old=read().find(x=>x.id===editing&&x.space===current);
 if(!old||!window.confirm('Удалить запись «'+old.title+'»?'))return;
 if(!store(read().filter(x=>x.id!==old.id))){$('calendarSpaceStatus').textContent='Не удалось удалить';return}
 if(current==='health'&&dialog.dataset.measureFocus==='true'){
  leaveMeasurement('Запись удалена');
 }else{
  editing=null;$('calendarSpaceForm').dataset.show='false';renderList();renderForm();
  $('calendarSpaceStatus').textContent='Запись удалена';
 }
}
$('worldManageContacts').addEventListener('click',()=>{
 window.dispatchEvent(new Event('seyveo:contacts-open'));
});
$('worldPeopleList').addEventListener('click',event=>{
 const call=event.target.closest('button[data-world-call]');
 if(call){
  window.dispatchEvent(new CustomEvent('seyveo:contact-call',{detail:{id:call.dataset.worldCall}}));
  return;
 }
 const detail=event.target.closest('button[data-world-open]');
 if(detail)window.dispatchEvent(new Event('seyveo:contacts-open'));
});
window.addEventListener('seyveo:contacts-changed',()=>{
 if(current==='world'&&dialog.open)renderWorldHub();
});
$('calendarSpaces').addEventListener('click',event=>{
 const button=event.target.closest('[data-calendar-space]');
 if(!button)return;
 const name=button.dataset.calendarSpace;
 if(name==='calendar'){
  if(location.hash!=='#calendar')location.hash='calendar';
  return;
 }
 if(name==='notes'){
  window.dispatchEvent(new Event('seyveo:notes-open'));
  return;
 }
 if(name==='contacts'){
  window.dispatchEvent(new Event('seyveo:contacts-open'));
  return;
 }
 if(name==='family'){
  // One personal SEYVEO Family surface; never enter corporate workspace.
  window.SEYVEO_FAMILY_CHAT?.open?.();
  return;
 }
 if(name==='smart-home'){
  window.SEYVEO_SMART_HOME?.openStandalone?.()||window.SEYVEO_SMART_HOME?.open?.();
  return;
 }
 if(name==='documents'){
  // Always open the existing Document Center in its personal area.
  // My Business has its own entry to the exact same center.
  if(!window.SEYVEO_SAYVI_SURFACES?.open?.('contract','personal'))location.hash='#sayvi-documents';
  return;
 }
 if(name==='mail'){
  // In-app inbox first; Connections is a separate voluntary action inside Mail.
  if(!window.SEYVEO_SAYVI_SURFACES?.open?.('mail','personal'))location.hash='#sayvi-mail';
  return;
 }
 if(name==='play'){
  // Open the current official video player; do not duplicate it inside My World.
  const from=location.hash==='#life'?'life':null;
  if(!window.SEYVEO_VIDEO?.open?.({from}))location.hash='#sayvi-video';
  return;
 }
 if(name==='music'){
  location.hash='#sayvi-music';
  return;
 }
 // Personal screens are standalone now, and shouldn't inherit a stale
 // selected date from the Calendar while opened from SEYVEO Life.
 const selectedDate=$('calendarPage').hidden?'':(window.SEYVEO_CALENDAR_DATE?.()||'');
 open(name,null,selectedDate);
});
$('calendarSpaceList').addEventListener('click',event=>{
 const row=event.target.closest('[data-space-record]');
 if(row)open(current,row.dataset.spaceRecord,window.SEYVEO_CALENDAR_DATE?.()||'');
});
$('calendarSpaceAdd').addEventListener('click',()=>add());
$('calendarHealthOverview').addEventListener('click',event=>{
 const quick=event.target.closest('[data-health-quick]');
 if(quick)add(quick.dataset.healthQuick);
});
$('calendarSpaceKind').addEventListener('change',()=>{updateHealthPlaceholder();bpForm();});
$('calendarSpaceFormFields').addEventListener('submit',save);
$('calendarSpaceCancel').addEventListener('click',()=>{
 if(current==='health'&&dialog.dataset.measureFocus==='true'){
  leaveMeasurement();return;
 }
 editing=null;$('calendarSpaceForm').dataset.show='false';renderForm();
});
$('calendarMeasureBack').addEventListener('click',()=>leaveMeasurement());
$('calendarSpaceDelete').addEventListener('click',remove);
$('calendarSpaceClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{
 dialog.dataset.measureFocus='false';
 $('calendarMeasureBack').hidden=true;
});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
window.addEventListener('seyveo:space-edit',event=>{
 const {space,id}=event.detail||{};if(META[space])open(space,id,window.SEYVEO_CALENDAR_DATE?.()||'');
});
window.addEventListener('storage',event=>{
 if(event.key===KEY&&dialog.open)renderList();
 if(event.key===KEY)window.dispatchEvent(new Event('seyveo:spaces-changed'));
});
// #calendar can be the first screen loaded; repaint after data providers mount.
if(!$('calendarPage').hidden)window.dispatchEvent(new Event('seyveo:spaces-changed'));
})();
