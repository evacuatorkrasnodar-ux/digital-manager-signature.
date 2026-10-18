/* SEYVEO Smart Calendar · Life spaces.
   Personal logs only. No health interpretations, network sync or simulated records.
   Existing Notes remains the only Notebook and is opened through its own dialog. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),dialog=$('calendarSpaceDialog');
if(!dialog||!$('calendarSpaces'))return;
const KEY='seyveo-life-spaces-v1',MAX=240;
const META=Object.freeze({
 health:{name:'Здоровье',desc:'Давление, пульс, лекарства и сон',kinds:['Давление','Пульс','Шаги','Самочувствие','Другое'],placeholder:'Например, 120/80'},
 care:{name:'Забота ♡',desc:'Дыхание, вода, шаги, отдых для глаз и цикл',kinds:['О себе','О близких','Личное','Другое'],placeholder:'Например, записаться на приём'},
 world:{name:'Мой мир',desc:'Люди и события, которые дороги вам',kinds:['День рождения','Важная дата','Человек','Другое'],placeholder:'Например, мама'}
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
function renderHealthOverview(){
 const overview=$('calendarHealthOverview');
 overview.hidden=current!=='health';
 if(current!=='health')return;
 const records=read().filter(x=>x.space==='health');
 const formatted=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'});
 for(const [kind,[valueId,dateId]] of Object.entries(healthUnits)){
  const matching=records.filter(x=>x.kind===kind);
  // Existing entries have no modification timestamp: use their most recent
  // recorded date, then original storage order. Never invent a value.
  const latest=matching.map((item,index)=>({item,index})).sort((a,b)=>
   (b.item.date||'').localeCompare(a.item.date||'')||b.index-a.index
  )[0]?.item;
  $(valueId).textContent=latest?latest.title:'—';
  $(dateId).textContent=latest?(latest.date?formatted.format(new Date(latest.date+'T12:00:00')):'Без даты'):'Нет записей';
 }
}
function renderList(){
 const root=$('calendarSpaceList');root.replaceChildren();
 const items=read().filter(x=>x.space===current&&!(current==='health'&&x.kind==='Шаги')).sort((a,b)=>
  current==='health'?(b.date||'').localeCompare(a.date||''):
   (a.date||'9999').localeCompare(b.date||'9999')
 );
 renderHealthOverview();
 const count=items.length;
 const ending=count%10===1&&count%100!==11?'запись':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'записи':'записей';
 $('calendarSpaceCount').textContent=count+' '+ending;
 const journalLabel=$('calendarSpaceJournal')?.querySelector('summary');
 if(journalLabel){
  const name=current==='health'?'История измерений':current==='care'?'Другие записи':'Личные записи';
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
 $('calendarSpaceFormTitle').textContent=item?'Изменить запись':'Новая запись';
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
}
function updateHealthPlaceholder(){
 if(current!=='health')return;
 const examples={'Давление':'Например, 120/80','Пульс':'Например, 72 уд/мин','Шаги':'Например, 6200','Самочувствие':'Как вы себя чувствуете?'};
 $('calendarSpaceTitle').placeholder=examples[$('calendarSpaceKind').value]||'Ваша запись';
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
 const journal=$('calendarSpaceJournal');
 if(journal){
  // The metric tiles are the primary actions; the full log stays one tap away.
  // Editing an existing record still opens the journal immediately.
  journal.open=space==='world'||Boolean(id);
  const title=journal.querySelector('summary');
  if(title)title.textContent=space==='health'?'История измерений':space==='care'?'Другие записи':'Личные записи';
 }
 $('calendarSpaceForm').dataset.show=id?'true':'false';
 $('calendarSpaceDate').dataset.selectedDate=selectedDate;
 $('calendarSpaceTitleHeading').textContent=META[space].name;
 $('calendarSpaceIntro').textContent=META[space].desc;
 $('calendarSpacePrivacy').textContent=space==='health'
   ?'Ручной ввод. Данные хранятся в браузере без шифрования, без связи с Apple Health. Не для медицинских решений.'
   :space==='care'
   ?'Личные записи остаются в этом браузере без шифрования. Отправка другим людям и напоминания пока не подключены.'
   :'Даты и имена хранятся только в этом браузере без шифрования. При выборе «Каждый год» день рождения появится ежегодно.';
 $('calendarSpaceStatus').textContent='';
 $('calendarSpaceAdd').textContent=space==='health'?'＋ Запись':'＋ Добавить';
 renderList();renderForm();
 if(!dialog.open)dialog.showModal();
 window.dispatchEvent(new CustomEvent('seyveo:space-opened',{detail:{space}}));
 if(id)$('calendarSpaceTitle').focus({preventScroll:true});
}
function add(kind=null){
 // Health overview and history share this single form; reveal it before focus.
 const journal=$('calendarSpaceJournal');
 if(journal&&!journal.open)journal.open=true;
 editing=null;$('calendarSpaceForm').dataset.show='true';renderForm();
 if(typeof kind==='string'&&current==='health'&&healthUnits[kind]){
  $('calendarSpaceKind').value=kind;
  updateHealthPlaceholder();
 }
 $('calendarSpaceTitle').focus({preventScroll:true});
}
function save(event){
 event.preventDefault();
 const title=$('calendarSpaceTitle').value.trim().replace(/\s+/g,' ').slice(0,110);
 const date=$('calendarSpaceDate').value;
 const status=$('calendarSpaceStatus');
 if(!title){status.textContent='Напишите название.';return}
 if(date&&!dateValid(date)){status.textContent='Проверьте дату.';return}
 const all=read(),old=all.find(x=>x.id===editing&&x.space===current);
 if(!old&&all.length>=MAX){status.textContent='Достигнут предел записей. Удалите ненужные записи.';return}
 const row={
  id:old?.id||'space-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  space:current,title,kind:$('calendarSpaceKind').value,date,
  detail:$('calendarSpaceDetail').value.trim().slice(0,500),
  yearless:current==='world'&&$('calendarSpaceKind').value==='День рождения'&&$('calendarSpaceAnnual').checked&&!!date
 };
 const updated=old?all.map(x=>x.id===old.id?row:x):[...all,row];
 if(!store(updated)){status.textContent='Не удалось сохранить. Проверьте память браузера.';return}
 editing=null;$('calendarSpaceForm').dataset.show='false';renderList();renderForm();
 status.textContent='Сохранено на этом устройстве';
}
function remove(){
 const old=read().find(x=>x.id===editing&&x.space===current);
 if(!old||!window.confirm('Удалить запись «'+old.title+'»?'))return;
 if(!store(read().filter(x=>x.id!==old.id))){$('calendarSpaceStatus').textContent='Не удалось удалить';return}
 editing=null;$('calendarSpaceForm').dataset.show='false';renderList();renderForm();
 $('calendarSpaceStatus').textContent='Запись удалена';
}
$('calendarSpaces').addEventListener('click',event=>{
 const button=event.target.closest('[data-calendar-space]');
 if(!button)return;
 const name=button.dataset.calendarSpace;
 if(name==='notes'){
  window.dispatchEvent(new Event('seyveo:notes-open'));
  return;
 }
 open(name,null,window.SEYVEO_CALENDAR_DATE?.()||'');
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
$('calendarSpaceKind').addEventListener('change',updateHealthPlaceholder);
$('calendarSpaceFormFields').addEventListener('submit',save);
$('calendarSpaceCancel').addEventListener('click',()=>{
 editing=null;$('calendarSpaceForm').dataset.show='false';renderForm();
});
$('calendarSpaceDelete').addEventListener('click',remove);
$('calendarSpaceClose').addEventListener('click',()=>dialog.close());
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
