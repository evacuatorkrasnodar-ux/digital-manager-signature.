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
   repeatOf:typeof x.repeatOf==='string'?x.repeatOf.slice(0,90):'',
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
// A single blood-pressure scene takes upper, lower AND pulse from one reading.
// Standalone pulse records stay in the original journal for viewing/editing.
const healthUnits=Object.freeze({
 'Давление':['calHealthPressureValue','calHealthPressureDate']
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
/* Optional birth year is separate from measurements and never sent automatically. */
const BP_BIRTH_YEAR_KEY='seyveo-health-birth-year-v1';
function bpAge(){
 let year=0;try{year=Number(localStorage.getItem(BP_BIRTH_YEAR_KEY)||0)}catch{}
 const currentYear=new Date().getFullYear();
 return Number.isInteger(year)&&year>=1900&&year<=currentYear?currentYear-year:null;
}
function setupHealthAge(){
 const field=$('calendarHealthBirthYear'),hint=$('calendarHealthAgeHint');if(!field)return;
 const today=new Date().getFullYear();
 field.replaceChildren(new Option('Не указан',''));
 for(let year=today;year>=1900;year--)field.add(new Option(String(year),String(year)));
 let saved='';try{saved=localStorage.getItem(BP_BIRTH_YEAR_KEY)||''}catch{}
 if([...field.options].some(option=>option.value===saved))field.value=saved;
 field.addEventListener('change',()=>{
  try{
   if(field.value)localStorage.setItem(BP_BIRTH_YEAR_KEY,field.value);
   else localStorage.removeItem(BP_BIRTH_YEAR_KEY);
   hint.textContent='Год рождения сохранён только в этом браузере.';
   if(current==='health'){bpReport();bpPreview();renderBpJournal();}
  }catch{hint.textContent='Не удалось сохранить год рождения.';}
 });
}
function bpAssess(s,d,p){
 const age=bpAge();
 if(age!==null&&age<18)return {
  level:'neutral',summary:'Для детей и подростков нужна оценка врача',
  advice:'У детей давление оценивают с учётом возраста, роста и пола. Взрослые пороги здесь неприменимы. При необычных показателях обратитесь к педиатру; при боли в груди, нарушении сознания, сильной одышке или других острых симптомах вызывайте экстренную помощь.'
 };
 let level,summary,advice;
 if(s>=180||d>=120){
  level='urgent';summary='Очень высокое давление — проверьте симптомы';
  advice='Если есть боль в груди, одышка, сильная головная боль с нарушением зрения, онемение, слабость, спутанность или нарушение речи — сразу вызывайте скорую помощь по местному номеру. Не ждите повторного измерения. Если таких симптомов нет, спокойно посидите не менее минуты, повторите измерение и срочно свяжитесь с врачом, если значение остаётся очень высоким.';
 }else if(s<90||d<60){
  level='low';summary='Возможно пониженное давление';
  advice='Если кружится голова, присядьте или прилягте, чтобы не упасть. При обмороке, боли в груди, затруднённом дыхании или выраженной слабости нужна срочная медицинская помощь. При хорошем самочувствии измерьте повторно после отдыха и обсудите повторяющиеся низкие значения с врачом.';
 }else if(s>=160||d>=100){
  level='high';summary='Значительно повышенное давление';
  advice='Спокойно сядьте, опираясь на спинку, расслабьте руку на уровне сердца и отдохните пять минут. Повторите измерение через 1–2 минуты. Если показания сохраняются, свяжитесь с врачом в ближайшее время; не принимайте дополнительные лекарства без его назначения. При тревожных симптомах обращайтесь за экстренной помощью.';
 }else if(s>=135||d>=85){
  level='raised';summary='Выше ориентира домашних измерений';
  advice='Спокойно посидите пять минут и повторите измерение через 1–2 минуты. Важны средние значения за несколько дней, а не одно число. Если высокие значения повторяются, обсудите журнал с врачом.';
 }else if(s>=120||d>=70){
  level='watch';summary='В диапазоне, требующем наблюдения';
  advice='Это не диагноз. Если измеряли после нагрузки или волнения, отдохните пять минут и перемерьте давление через 1–2 минуты. Продолжайте вести журнал.';
 }else{
  level='usual';summary='Ниже ориентира повышенного домашнего давления';
  advice='Единичное измерение не заменяет оценку самочувствия и наблюдение за несколькими днями. Продолжайте журнал по рекомендациям своего врача.';
 }
 if(Number.isInteger(p)&&(p>100||p<60)){
  advice+=' Пульс '+p+' уд/мин вне обычного диапазона покоя 60–100; учитывайте нагрузку и особенности организма. При обмороке, боли в груди или сильной одышке срочно обращайтесь за медицинской помощью.';
 }
 if(age===null)advice+=' Оценка использует общие ориентиры для взрослых: возраст не указан.';
 else if(age>=85)advice+=' В возрасте 85 лет и старше целевые значения определяются врачом индивидуально.';
 advice+=' Если вы беременны, обратитесь к врачу за индивидуальной оценкой давления, особенно при повышенных значениях.';
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
 const emergency=$('calendarBpReportEmergency');if(emergency)emergency.hidden=!(records.length&&bpAge()!==null&&bpAge()<18?false:records.length&&(records[0].s>=180||records[0].d>=120));
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
 if(ids.some(id=>!$(id).value.trim())){box.textContent='Введите три значения с тонометра. Сэйви объяснит результат.';box.dataset.level='neutral';$('calendarBpEmergency').hidden=true;return;}
 const [s,d,p]=ids.map(id=>Number($(id).value));
 if(![s,d,p].every(Number.isInteger)||s<50||s>300||d<30||d>200||s<=d||p<30||p>240){
  box.textContent='Проверьте числа: верхнее должно быть больше нижнего. Если показатели необычные, повторите измерение и при плохом самочувствии обратитесь за медицинской помощью.';
  box.dataset.level='neutral';$('calendarBpEmergency').hidden=true;return;
 }
 const info=bpAssess(s,d,p);
 const emergency=$('calendarBpEmergency');
 if(emergency)emergency.hidden=!(s>=180||d>=120);
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
/* An explicit second measurement is a separate record linked to the first.
   The call to emergency care is never delayed by the repeat suggestion. */
let bpRepeatSourceId='',bpNotice=null;
function bpRepeatReading(id){return read().find(x=>x.space==='health'&&x.kind==='Давление'&&x.id===id)||null}
function updateBpRepeatPanel(){
 const box=$('calendarBpRepeatPanel');if(!box)return;
 box.hidden=current!=='health'||!bpNotice||dialog.dataset.measureFocus==='true';
 if(box.hidden)return;
 const title=$('calendarBpRepeatHeading'),message=$('calendarBpRepeatMessage');
 const values=$('calendarBpRepeatValues'),action=$('calendarBpRepeatAction');
 values.replaceChildren();
 const first=bpRepeatReading(bpNotice.first),second=bpNotice.second?bpRepeatReading(bpNotice.second):null;
 if(!first){box.hidden=true;return;}
 const bp1=bpParse(first),bp2=bpParse(second);
 if(!bp1){box.hidden=true;return;}
 if(bp2){
  title.textContent='Два измерения сохранены';
  const ds=bp2.s-bp1.s,dd=bp2.d-bp1.d;
  const fmt=n=>n>0?'+'+n:String(n);
  message.textContent='Второе измерение: изменение верхнего '+fmt(ds)+', нижнего '+fmt(dd)+' мм рт. ст. Два отдельных результата записаны в журнал. Если значения остаются высокими, обсудите их с врачом. При тревожных симптомах вызывайте экстренную помощь.';
  for(const [label,bp] of [['Первое',bp1],['Повторное',bp2]]){
   const item=dom('div','cal-bp-repeat-value');
   item.append(dom('small','',label),dom('strong','',bp.s+'/'+bp.d),dom('span','',bp.p===null?'Пульс не указан':'Пульс '+bp.p));
   values.append(item);
  }
  values.hidden=false;action.hidden=true;box.dataset.level='paired';
 }else{
  const info=bpAssess(bp1.s,bp1.d,bp1.p);
  title.textContent=info.level==='urgent'?'Очень высокое давление':'Сэйви · проверьте измерение';
  message.textContent=info.level==='urgent'
   ?'Если есть боль в груди, одышка, сильная головная боль с нарушением зрения, слабость или нарушение речи — немедленно вызывайте скорую, не ожидая повторного замера. Если этих симптомов нет, спокойно посидите, повторите измерение не раньше чем через минуту и срочно свяжитесь с врачом при сохраняющихся очень высоких показателях.'
   :'Если нет тревожных симптомов, отдохните спокойно пять минут и повторите измерение через 1–2 минуты. При боли в груди, одышке, обмороке или нарушении речи вызывайте экстренную помощь.';
  values.hidden=true;action.hidden=false;box.dataset.level=info.level;
 }
}
/* A physician-friendly pressure log from the existing local records only. */
let bpJournalPeriod='7';
function bpJournalItems(){
 const now=new Date(),end=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const min=bpJournalPeriod==='all'?null:new Date(end.getFullYear(),end.getMonth(),end.getDate()-Number(bpJournalPeriod)+1);
 const since=min?[min.getFullYear(),String(min.getMonth()+1).padStart(2,'0'),String(min.getDate()).padStart(2,'0')].join('-'):null;
 return read().filter(x=>x.space==='health'&&x.kind==='Давление')
  .map(x=>({item:x,bp:bpParse(x)})).filter(x=>x.bp&&(!since||(x.bp.date&&x.bp.date>=since)))
  .sort((a,b)=>(b.bp.date||'').localeCompare(a.bp.date||'')||b.bp.time-a.bp.time);
}
function bpJournalOverview(items){
 if(!items.length)return {average:'Нет измерений за период',insight:'Добавьте измерения, чтобы Сэйви показала динамику.'};
 const avg=k=>Math.round(items.reduce((sum,x)=>sum+x.bp[k],0)/items.length);
 const pulse=items.filter(x=>Number.isInteger(x.bp.p));
 const p=pulse.length?' · пульс '+Math.round(pulse.reduce((n,x)=>n+x.bp.p,0)/pulse.length):'';
 const bp=avg('s')+'/'+avg('d');
 const oldest=items[items.length-1].bp,newest=items[0].bp;
 const deltaS=newest.s-oldest.s,deltaD=newest.d-oldest.d;
 let trend='Для оценки изменения нужны измерения в разные дни.';
 if(items.length>=2&&newest.date&&oldest.date&&newest.date!==oldest.date){
  const sign=x=>x>0?'+'+x:String(x);
  trend='Первый и последний замеры периода: изменение верхнего '+sign(deltaS)+', нижнего '+sign(deltaD)+' мм рт. ст. Это разница отдельных измерений, не доказанный тренд.';
 }
 const days=new Set(items.map(x=>x.bp.date).filter(Boolean)).size;
 let note=items.length<4||days<3?' Данных пока мало для устойчивых выводов.':' Сравнивайте измерения в похожих условиях и обсудите средние значения с врачом.';
 return {average:bp+' мм рт. ст.'+p,insight:items.length+' измерений за '+days+' '+(days===1?'день':'дн.')+'. '+trend+note};
}
function renderBpJournal(){
 const root=$('calendarBpJournal');if(!root)return;
 root.hidden=current!=='health';if(root.hidden)return;
 const items=bpJournalItems(),summary=bpJournalOverview(items);
 $('calendarBpJournalCount').textContent=items.length+' '+(items.length===1?'измерение':'измерений');
 $('calendarBpJournalAverage').textContent=summary.average;
 $('calendarBpJournalInsight').textContent=summary.insight;
 root.querySelectorAll('[data-bp-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bpPeriod===bpJournalPeriod)));
 const rows=$('calendarBpJournalRows');rows.replaceChildren();
 if(!items.length){rows.append(dom('p','cal-bp-journal-empty','Нет измерений за выбранный период.'));return;}
 const formatter=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'});
 for(const {item,bp} of items){
  const row=dom('button','cal-bp-journal-row');row.type='button';row.dataset.bpOpen=item.id;
  const when=bp.date?formatter.format(new Date(bp.date+'T12:00:00')):'Дата не указана';
  const clock=bp.time?new Date(bp.time).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'';
  row.append(dom('span','cal-bp-journal-date',when+(clock?' · '+clock:'')));
  row.append(dom('strong','cal-bp-journal-reading',bp.s+'/'+bp.d+'  ·  '+(bp.p===null?'—':bp.p)));
  if(item.repeatOf)row.append(dom('small','cal-bp-repeat-tag','Повторное измерение'));
  else if(items.some(other=>other.item.repeatOf===item.id))row.append(dom('small','cal-bp-repeat-tag','Первое измерение в паре'));
  if(item.detail)row.append(dom('small','cal-bp-journal-note',item.detail));
  rows.append(row);
 }
}
/* No extra required questions: optional doctor details are included only if entered. */
function bpDoctorDetails(){
 return {
  name:$('calendarBpPatientName')?.value.trim()||'',
  medication:$('calendarBpMedicationList')?.value.trim()||'',
  comment:$('calendarBpDoctorComment')?.value.trim()||'',
  year:$('calendarHealthBirthYear')?.value||''
 };
}
function bpDoctorText(){
 const items=bpJournalItems(),overview=bpJournalOverview(items),details=bpDoctorDetails();
 if(!items.length)return '';
 const now=new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'long',year:'numeric'}).format(new Date());
 const lines=['SEYVEO · Журнал артериального давления','Дата отчёта: '+now,
  'Период: '+(bpJournalPeriod==='all'?'все записи':bpJournalPeriod+' дней'),
  'Измерений: '+items.length];
 if(details.name)lines.push('Имя: '+details.name);
 if(details.year)lines.push('Год рождения: '+details.year);
 if(details.medication)lines.push('Лекарства: '+details.medication);
 if(details.comment)lines.push('Комментарий: '+details.comment);
 lines.push('','Среднее всех записей периода: '+overview.average,'Вывод Сэйви: '+overview.insight,'','Дата и время | Давление | Пульс | Примечание');
 for(const {item,bp} of items)lines.push(
  (bp.date||'Без даты')+(bp.time?' '+new Date(bp.time).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'')
  +' | '+bp.s+'/'+bp.d+' | '+(bp.p===null?'—':bp.p)
  +' | '+(item.repeatOf?'Повторный замер. ':'')+(item.detail||'—').replace(/[\r\n]+/g,' ')
 );
 lines.push('','Информация подготовлена из измерений, внесённых пользователем. Не является диагнозом или медицинским заключением.');
 return lines.join('\n');
}
function bpPrintDoctor(){
 const report=bpDoctorText(),status=$('calendarBpJournalStatus');
 if(!report){status.textContent='Для печати сначала добавьте измерение.';return;}
 const pop=window.open('','_blank');
 if(!pop){status.textContent='Разрешите открыть окно печати в браузере.';return;}
 const details=bpDoctorDetails(),items=bpJournalItems(),overview=bpJournalOverview(items);
 const escapeText=value=>String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const dateTime=bp=>escapeText((bp.date||'Без даты')+(bp.time?' '+new Date(bp.time).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):''));
 const meta=[details.name&&['Пациент',details.name],details.year&&['Год рождения',details.year],
  details.medication&&['Лекарства',details.medication],details.comment&&['Комментарий',details.comment]].filter(Boolean)
  .map(([key,value])=>'<div><b>'+escapeText(key)+':</b> '+escapeText(value)+'</div>').join('');
 const rows=items.map(({item,bp})=>'<tr><td>'+dateTime(bp)+'</td><td><b>'+bp.s+'/'+bp.d+'</b></td><td>'+(bp.p===null?'—':bp.p)+'</td><td>'+escapeText((item.repeatOf?'Повторный замер. ':'')+(item.detail||''))+'</td></tr>').join('');
 const page='<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>SEYVEO · Журнал давления</title>'
 +'<style>@page{size:A4;margin:17mm}body{font:12px/1.5 -apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#222;margin:0}header{border-bottom:2px solid #38383A;padding-bottom:14px;margin-bottom:18px}small{color:#606773}h1{font-size:24px;margin:3px 0 4px}h2{font-size:15px;margin-top:20px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin:15px 0}.summary{background:#f3f4f5;padding:12px;border-radius:8px}.summary strong{font-size:19px}table{width:100%;border-collapse:collapse;margin-top:12px;table-layout:fixed}th,td{text-align:left;padding:9px 7px;border-bottom:1px solid #dce0e3;vertical-align:top;overflow-wrap:anywhere}th{background:#f3f4f5}th:nth-child(1){width:28%}th:nth-child(2){width:21%}th:nth-child(3){width:12%}footer{margin-top:20px;color:#6b717a;font-size:10px}@media print{.summary{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>'
 +'<header><small>SEYVEO / ЗДОРОВЬЕ</small><h1>Журнал давления</h1><small>Отчёт от '+escapeText(new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'long',year:'numeric'}).format(new Date()))+' · '
 +escapeText(bpJournalPeriod==='all'?'все записи':bpJournalPeriod+' дней')+'</small></header>'
 +(meta?'<section class="meta">'+meta+'</section>':'')
 +'<section class="summary"><small>Сводка Сэйви · '+items.length+' измерений</small><div><strong>'+escapeText(overview.average)+'</strong></div><p>'+escapeText(overview.insight)+'</p></section>'
 +'<h2>История измерений</h2><table><thead><tr><th>Дата и время</th><th>Давление</th><th>Пульс</th><th>Примечание</th></tr></thead><tbody>'+rows+'</tbody></table>'
 +'<footer>Ручные измерения, предоставленные пользователем. Информационная сводка не является диагнозом или медицинским заключением.</footer>'
 +'</body></html>';
 pop.document.open();pop.document.write(page);pop.document.close();pop.focus();
 pop.addEventListener('load',()=>{pop.print();},{once:true});
 status.textContent='Подготовлен печатный журнал. В окне печати можно выбрать принтер или сохранить PDF.';
}
async function bpShareDoctor(){
 const report=bpDoctorText(),status=$('calendarBpJournalStatus');
 if(!report){status.textContent='Для отправки сначала добавьте измерение.';return;}
 try{
  if(navigator.share){
   await navigator.share({title:'SEYVEO · Журнал давления',text:report});
   status.textContent='Открыто системное меню отправки.';return;
  }
  const file=new Blob([report],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(file),link=document.createElement('a');
  link.href=url;link.download='SEYVEO-davlenie.txt';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  status.textContent='Отчёт сохранён. Отправьте файл врачу удобным способом.';
 }catch(error){
  status.textContent=error?.name==='AbortError'?'Отправка отменена.':'Не удалось открыть отправку.';
 }
}
$('calendarHealthOverview').addEventListener('click',event=>{
 const period=event.target.closest('[data-bp-period]');
 if(period){bpJournalPeriod=period.dataset.bpPeriod;renderBpJournal();return;}
 if(event.target.closest('#calendarBpJournalShare')){bpShareDoctor();return;}
 if(event.target.closest('#calendarBpJournalPrint')){bpPrintDoctor();return;}
 const row=event.target.closest('[data-bp-open]');
 if(row)open('health',row.dataset.bpOpen);
});

function renderHealthOverview(){
 const overview=$('calendarHealthOverview');overview.hidden=current!=='health';
 if(current!=='health')return;
 const records=read().filter(x=>x.space==='health');
 const formatted=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'});
 // Do not merge two measurements taken at different times. This summary
 // displays the pulse only if it belongs to the SAME blood-pressure record.
 const recent=kind=>records.map((x,i)=>({x,i})).filter(a=>a.x.kind===kind)
  .sort((a,b)=>(b.x.date||'').localeCompare(a.x.date||'')||
   (b.x.recordedAt||0)-(a.x.recordedAt||0)||b.i-a.i)[0]?.x;
 const latest=recent('Давление'),standalonePulse=recent('Пульс');
 const bp=bpParse(latest);
 const value=$('calHealthPressureValue'),date=$('calHealthPressureDate');
 if(bp){
  value.textContent=bp.s+'/'+bp.d+' мм рт. ст.'+
   (bp.p!==null?' · '+bp.p+' уд/мин':'');
  date.textContent=latest.date?
   'Последний замер · '+formatted.format(new Date(latest.date+'T12:00:00')):
   'Последний замер · без даты';
 }else if(latest){
  // Preserve display of legacy free-text blood-pressure notes.
  value.textContent=latest.title;
  date.textContent='Предыдущая запись давления';
 }else{
  value.textContent='Нет измерений';
  // Older pulse-only observations are never deleted or re-labelled as BP.
  date.textContent=standalonePulse?'Отдельный пульс — в истории ниже':'Верхнее · нижнее · пульс';
 }
 value.closest('[data-health-quick]')?.setAttribute('data-has-record',String(Boolean(latest)));
 bpReport();
 renderBpJournal();
 updateBpRepeatPanel();
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
setupHealthAge();

function measurementFocus(active){
 const enabled=Boolean(active&&current==='health');
 dialog.dataset.measureFocus=String(enabled);
 $('calendarMeasureBack').hidden=!enabled;
 if(enabled){
  $('calendarSpaceJournal').open=true;
  $('svCareScroll').scrollTop=0;
 }
}
function leaveMeasurement(message=''){
 bpRepeatSourceId='';
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
 $('svCareScroll').scrollTop=0;
 // The user returns to the overview, not a hidden form field.
 const target=[...$('calendarHealthOverview').querySelectorAll('[data-health-quick]')]
  .find(node=>node.dataset.healthQuick===category)||$('calendarSpaceClose');
 target.focus({preventScroll:true});
}
function open(space,id=null,selectedDate=''){
 if(!META[space])return;
 bpRepeatSourceId='';bpNotice=null;
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
 else $('svCareScroll').scrollTop=0;
}
function add(kind=null){
 if(!bpRepeatSourceId)bpNotice=null;
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
 const previous=isBP?read().find(x=>x.id===editing&&x.space===current):null;
 const measuredAt=isBP&&!previous?new Date():null;
 const localStamp=measuredAt?[measuredAt.getFullYear(),String(measuredAt.getMonth()+1).padStart(2,'0'),String(measuredAt.getDate()).padStart(2,'0')].join('-'):'';
 const date=isBP?(previous?.date||localStamp):$('calendarSpaceDate').value;
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
  recordedAt:isBP?(old?.recordedAt||measuredAt?.getTime()||Date.now()):0,
  repeatOf:isBP?(old?.repeatOf||(bpRepeatSourceId&&bpRepeatReading(bpRepeatSourceId)?bpRepeatSourceId:'')):'',
  yearless:current==='world'&&$('calendarSpaceKind').value==='День рождения'&&$('calendarSpaceAnnual').checked&&!!date
 };
 const updated=old?all.map(x=>x.id===old.id?row:x):[...all,row];
 if(!store(updated)){status.textContent='Не удалось сохранить. Проверьте память браузера.';return}
 if(isBP&&!old){
  const linked=row.repeatOf?bpRepeatReading(row.repeatOf):null;
  const info=bpAssess(sys,dia,pulse);
  if(linked)bpNotice={first:linked.id,second:row.id};
  else if(['raised','high','urgent','low'].includes(info.level))bpNotice={first:row.id,second:''};
  else bpNotice=null;
 }
 bpRepeatSourceId='';
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
$('calendarHealthOverview').addEventListener('click',event=>{
 if(event.target.closest('#calendarBpRepeatDismiss')){bpNotice=null;updateBpRepeatPanel();return;}
 if(event.target.closest('#calendarBpRepeatAction')){
  const source=bpNotice?.first;
  if(!source||!bpRepeatReading(source))return;
  add('Давление');
  bpRepeatSourceId=source;
 }
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
