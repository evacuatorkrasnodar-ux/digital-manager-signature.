/* SEYVEO · Medical passport and emergency summary
   Private local notes. Never infer allergies, diagnoses or doses from a pressure reading.
   Only confirmed intake marks are reported as taken. No background uploads. */
(()=>{
'use strict';
const dialog=document.getElementById('calendarSpaceDialog');
if(!dialog||document.getElementById('svMedicalEntry'))return;
const KEY='seyveo-medical-passport-v1';
const SPACES='seyveo-life-spaces-v1';
const WELLNESS='seyveo-private-health-care-v1';
const $=id=>document.getElementById(id);
const txt=(tag,value,cls)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=value;return el};
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
const safeString=(value,max=500)=>typeof value==='string'?value.trim().slice(0,max):'';
const validPhone=s=>/^\+?[0-9()\s-]{6,24}$/.test(s);
const defaults=()=>({name:'',allergies:'unknown',allergyDetails:'',heart:'unknown',heartDetails:'',conditions:'',operations:'',contactName:'',contactPhone:'',note:'',updatedAt:null});
const readProfile=()=>{
 const input=safeRead(KEY,{});
 const d=defaults();
 for(const key of ['name','allergyDetails','heartDetails','conditions','operations','contactName','contactPhone','note'])d[key]=safeString(input[key],key==='conditions'||key==='note'?750:300);
 for(const key of ['allergies','heart'])d[key]=['unknown','yes','no'].includes(input[key])?input[key]:'unknown';
 d.updatedAt=Number.isFinite(input.updatedAt)?input.updatedAt:null;
 return d;
};
const entry=document.createElement('button');
entry.id='svMedicalEntry';
entry.type='button';
entry.hidden=true;
entry.setAttribute('aria-label','Экстренная карта Сэйви · медицинский паспорт');
entry.setAttribute('title','Медпаспорт');
entry.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor"/></svg>';
dialog.append(entry);
const overlay=document.createElement('section');
overlay.id='svMedicalOverlay';
overlay.hidden=true;
overlay.setAttribute('role','dialog');
overlay.setAttribute('aria-modal','true');
overlay.setAttribute('aria-label','Медпаспорт Сэйви');
overlay.innerHTML=[
 '<div class="sv-med-shell">',
 '<header class="sv-med-header">',
 '<button type="button" class="sv-med-back" id="svMedicalBack" aria-label="Вернуться к здоровью"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg></button>',
 '<h2 id="svMedicalHeading">Экстренная карта</h2>',
 '<button type="button" class="sv-med-edit" id="svMedicalEdit" aria-label="Редактировать медпаспорт"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 4 4 4M4 20l4.5-1 11-11a2.83 2.83 0 0 0-4-4l-11 11L4 20Z"/></svg></button>',
 '</header>',
 '<div id="svMedicalView">',
 '<div class="sv-med-brand"><span class="sv-sayvi-symbol" aria-hidden="true"></span><span>Сэйви · Здоровье</span></div>',
 '<h3 id="svMedicalPerson"></h3>',
 '<p id="svMedicalUpdated" class="sv-med-muted"></p>',
 '<div id="svMedicalEssentials"></div>',
 '<div id="svMedicalMedications"></div>',
 '<div id="svMedicalIntakes"></div>',
 '<div id="svMedicalPressure"></div>',
 '<p class="sv-med-disclaimer">Информация внесена пользователем. «Не указано» не означает «нет». Приём лекарств показан только по ручным отметкам.</p>',
 '<div class="sv-med-actions">',
 '<button type="button" id="svMedicalPrint">Распечатать / PDF</button>',
 '<button type="button" id="svMedicalShare">Поделиться</button>',
 '</div>',
 '<p id="svMedicalShareMessage" class="sv-med-muted" role="status"></p>',
 '</div>',
 '<form id="svMedicalForm" hidden autocomplete="off">',
 '<p class="sv-med-intro">Заполните один раз. Сэйви добавит сохранённые лекарства и измерения автоматически.</p>',
 '<label>Имя и фамилия<input name="name" maxlength="120" placeholder="Как в документах" autocomplete="name"></label>',
 '<label>Аллергии<select name="allergies"><option value="unknown">Не указаны</option><option value="no">Подтверждаю: известных нет</option><option value="yes">Есть аллергии</option></select></label>',
 '<label data-sv-med-if="allergies">На что аллергия и какая реакция<textarea name="allergyDetails" maxlength="300" rows="2" placeholder="Например, название лекарства и реакция"></textarea></label>',
 '<label>Заболевания сердца<select name="heart"><option value="unknown">Не указаны</option><option value="no">Подтверждаю: известных нет</option><option value="yes">Есть</option></select></label>',
 '<label data-sv-med-if="heart">Какие заболевания сердца<textarea name="heartDetails" maxlength="300" rows="2"></textarea></label>',
 '<label>Другие важные заболевания<textarea name="conditions" maxlength="750" rows="2" placeholder="Например, диабет, эпилепсия, заболевания почек"></textarea></label>',
 '<label>Операции, импланты, кардиостимулятор<textarea name="operations" maxlength="300" rows="2" placeholder="Если есть"></textarea></label>',
 '<label>Экстренный контакт<input name="contactName" maxlength="120" placeholder="Имя близкого"></label>',
 '<label>Телефон контакта<input name="contactPhone" type="tel" maxlength="24" inputmode="tel" placeholder="+7 ..."></label>',
 '<label>Дополнительно<textarea name="note" maxlength="750" rows="2" placeholder="Важные сведения для бригады"></textarea></label>',
 '<p class="sv-med-muted">Возраст берётся из раздела «Давление». Лекарства и отметки приёма — из «Лекарства».</p>',
 '<div class="sv-med-actions"><button type="submit">Сохранить</button><button type="button" id="svMedicalCancel">Отмена</button></div>',
 '<p id="svMedicalFormStatus" role="status"></p>',
 '</form>',
 '</div>'
].join('');
document.body.append(overlay);
let isEditing=false;
let previousFocus=null;
const timeText=ms=>Number.isFinite(ms)&&ms>0?new Date(ms).toLocaleString('ru-RU',{dateStyle:'short',timeStyle:'short'}):'неизвестно';
const dateText=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)?d.split('-').reverse().join('.'):'дата не указана';
const ageText=()=>{
 try{const v=Number(localStorage.getItem('seyveo-health-age-v1'));return Number.isInteger(v)&&v>=1&&v<=110?v+' лет':'не указан'}catch{return 'не указан'}
};
const displayOrUnknown=value=>value||'Не указано';
const selectStatus=(choice,details)=>{
 if(choice==='no')return 'Известных нет (со слов пользователя)';
 if(choice==='yes')return details||'Есть, подробности не указаны';
 return 'Не указано';
};
function readMeds(){
 const source=safeRead(WELLNESS,{});
 const meds=Array.isArray(source.medications)?source.medications.filter(x=>x&&typeof x==='object'&&safeString(x.name,90)).slice(-60):[];
 const logs=source.medLogs&&typeof source.medLogs==='object'?source.medLogs:{};
 const times=source.medTakenAt&&typeof source.medTakenAt==='object'?source.medTakenAt:{};
 const confirmed=[];
 for(const med of meds){
  const id=String(med.id||'');
  for(const [key,status] of Object.entries(logs)){
   if(!key.startsWith(id+'|')||status!=='taken'||!id)continue;
   const date=key.slice(id.length+1);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;
   const at=Number(times[key]);
   confirmed.push({name:safeString(med.name,90),dose:safeString(med.dose,80),date,
    at:Number.isSafeInteger(at)&&at>0?at:null});
  }
 }
 confirmed.sort((a,b)=>b.date.localeCompare(a.date)||((b.at||0)-(a.at||0)));
 return {meds,confirmed:confirmed.slice(0,5)};
}
function readPressure(){
 const list=safeRead(SPACES,[]);
 return (Array.isArray(list)?list:[]).filter(x=>x?.space==='health'&&x.kind==='Давление')
 .map(x=>{
  const match=/^(\d{2,3})\s*\/\s*(\d{2,3})/.exec(String(x.title||''));
  return match?{s:Number(match[1]),d:Number(match[2]),pulse:Number.isInteger(x.bpPulse)?x.bpPulse:null,
   date:safeString(x.date,10),time:Number.isFinite(x.recordedAt)?x.recordedAt:0}:null;
 }).filter(x=>x&&x.s>=50&&x.s<=300&&x.d>=30&&x.d<=200&&x.s>x.d)
 .sort((a,b)=>b.time-a.time||b.date.localeCompare(a.date)).slice(0,5);
}
function getSnapshot(){
 const profile=readProfile(),{meds,confirmed}=readMeds(),pressure=readPressure();
 return {profile,meds,confirmed,pressure,age:ageText()};
}
function addPair(target,label,value,urgent=false){
 const row=document.createElement('div');row.className='sv-med-pair'+(urgent?' sv-med-pair-emphasis':'');
 row.append(txt('span',label),txt('strong',value));target.append(row);
}
function addSection(container,title,items,emptyLabel){
 const section=document.createElement('section');section.className='sv-med-block';
 section.append(txt('h4',title));
 if(items.length)for(const item of items)section.append(txt('p',item,'sv-med-item'));
 else section.append(txt('p',emptyLabel,'sv-med-muted'));
 container.replaceChildren(section);
}
function render(){
 const d=getSnapshot(),p=d.profile;
 $('svMedicalPerson').textContent=displayOrUnknown(p.name);
 $('svMedicalUpdated').textContent='Возраст: '+d.age+' · Профиль обновлён: '+(p.updatedAt?timeText(p.updatedAt):'ещё не заполнен');
 const essentials=$('svMedicalEssentials');essentials.replaceChildren();
 const block=document.createElement('section');block.className='sv-med-block';
 block.append(txt('h4','Важное для скорой'));
 addPair(block,'Аллергии',selectStatus(p.allergies,p.allergyDetails),p.allergies==='yes');
 addPair(block,'Сердце',selectStatus(p.heart,p.heartDetails),p.heart==='yes');
 addPair(block,'Другие заболевания',displayOrUnknown(p.conditions));
 addPair(block,'Операции / импланты',displayOrUnknown(p.operations));
 const last=d.confirmed[0];
 addPair(block,'Последний отмеченный приём',last?
  last.name+' · '+(last.dose||'доза не указана')+' · '+dateText(last.date)+
  (last.at?' · отметка '+new Date(last.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):' · точное время неизвестно')
  :'Нет подтверждённых отметок');
 const latestBp=d.pressure[0];
 addPair(block,'Последнее давление',latestBp?
  latestBp.s+'/'+latestBp.d+' мм рт. ст.'+(latestBp.pulse!==null?' · пульс '+latestBp.pulse:'')+' · '+
  (latestBp.time?timeText(latestBp.time):dateText(latestBp.date))
  :'Не измерялось в журнале');
 addPair(block,'Экстренный контакт',p.contactName||p.contactPhone?
  [p.contactName,p.contactPhone].filter(Boolean).join(' · '):'Не указан');
 if(p.note)addPair(block,'Дополнительно',p.note);
 essentials.append(block);
 const meds=d.meds.map(x=>[safeString(x.name,90),safeString(x.dose,80),safeString(x.time,5)].filter(Boolean).join(' · '));
 addSection($('svMedicalMedications'),'Записанные лекарства',meds,'Не указаны');
 const intakes=d.confirmed.map(x=>x.name+' · '+(x.dose||'доза не указана')+' · '+dateText(x.date)+
  (x.at?' · отметка '+new Date(x.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):' · время отметки неизвестно'));
 addSection($('svMedicalIntakes'),'Последние подтверждённые приёмы',intakes,'Подтверждений приёма пока нет');
 const pressure=d.pressure.map(x=>x.s+'/'+x.d+' мм рт. ст.'+(x.pulse!==null?' · пульс '+x.pulse:'')+
  ' · '+(x.time?timeText(x.time):dateText(x.date)));
 addSection($('svMedicalPressure'),'Последние измерения давления',pressure,'Измерений пока нет');
}
function plainText(){
 const d=getSnapshot(),p=d.profile,lines=[
 'SEYVEO · ЭКСТРЕННАЯ МЕДИЦИНСКАЯ КАРТА',
 'Сформировано: '+timeText(Date.now()),
 'Имя: '+displayOrUnknown(p.name),
 'Возраст: '+d.age,
 'Аллергии: '+selectStatus(p.allergies,p.allergyDetails),
 'Заболевания сердца: '+selectStatus(p.heart,p.heartDetails),
 'Другие заболевания: '+displayOrUnknown(p.conditions),
 'Операции и импланты: '+displayOrUnknown(p.operations),
 'Контакт: '+displayOrUnknown([p.contactName,p.contactPhone].filter(Boolean).join(' · '))];
 if(p.note)lines.push('Дополнительно: '+p.note);
 lines.push('','ЗАПИСАННЫЕ ЛЕКАРСТВА');
 if(d.meds.length)for(const med of d.meds)lines.push('• '+[med.name,med.dose,med.time].filter(Boolean).join(' · '));
 else lines.push('Не указаны');
 lines.push('','ПОСЛЕДНИЕ ПОДТВЕРЖДЁННЫЕ ПРИЁМЫ');
 if(d.confirmed.length)for(const x of d.confirmed)lines.push('• '+x.name+' · '+x.dose+' · '+dateText(x.date)+(x.at?' · '+timeText(x.at):' · точное время неизвестно'));
 else lines.push('Нет отметок');
 lines.push('','ДАВЛЕНИЕ (ПОСЛЕДНИЕ 5 ЗАМЕРОВ)');
 if(d.pressure.length)for(const x of d.pressure)lines.push('• '+x.s+'/'+x.d+(x.pulse!==null?' · пульс '+x.pulse:'')+' · '+(x.time?timeText(x.time):dateText(x.date)));
 else lines.push('Нет записей');
 lines.push('','Данные введены пользователем. Неуказанные сведения не означают отсутствие заболеваний. Отметки о приёме внесены вручную.');
 return lines.join('\n');
}
function formDisplay(edit){
 isEditing=edit;
 $('svMedicalView').hidden=edit;
 $('svMedicalForm').hidden=!edit;
 $('svMedicalEdit').hidden=edit;
 $('svMedicalHeading').textContent=edit?'Медпаспорт':'Экстренная карта';
 if(edit)fillForm();
 else render();
}
function fillForm(){
 const d=readProfile(),form=$('svMedicalForm');
 for(const key of ['name','allergies','allergyDetails','heart','heartDetails','conditions','operations','contactName','contactPhone','note']){
  form.elements.namedItem(key).value=d[key]||'';
 }
 updateDetails();
 $('svMedicalFormStatus').textContent='';
}
function updateDetails(){
 const form=$('svMedicalForm');
 for(const key of ['allergies','heart']){
  const yes=form.elements.namedItem(key).value==='yes';
  const row=form.querySelector('[data-sv-med-if="'+key+'"]');
  row.hidden=!yes;
 }
}
function openPassport(){
 previousFocus=document.activeElement;
 overlay.hidden=false;
 formDisplay(false);
 $('svMedicalBack').focus({preventScroll:true});
}
function closePassport(){
 if(isEditing){formDisplay(false);return}
 overlay.hidden=true;
 if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
}
entry.addEventListener('click',openPassport);
$('svMedicalBack').addEventListener('click',closePassport);
$('svMedicalEdit').addEventListener('click',()=>formDisplay(true));
$('svMedicalCancel').addEventListener('click',()=>formDisplay(false));
$('svMedicalForm').addEventListener('change',updateDetails);
$('svMedicalForm').addEventListener('submit',event=>{
 event.preventDefault();
 const form=event.currentTarget;
 const next=defaults();
 for(const key of ['name','allergyDetails','heartDetails','conditions','operations','contactName','contactPhone','note']){
  next[key]=safeString(form.elements.namedItem(key).value,key==='conditions'||key==='note'?750:300);
 }
 next.allergies=form.elements.namedItem('allergies').value;
 next.heart=form.elements.namedItem('heart').value;
 if(next.allergies==='yes'&&!next.allergyDetails){
  $('svMedicalFormStatus').textContent='Укажите аллергию или выберите «Не указаны».';
  form.elements.namedItem('allergyDetails').focus();return;
 }
 if(next.heart==='yes'&&!next.heartDetails){
  $('svMedicalFormStatus').textContent='Укажите заболевание сердца или выберите «Не указаны».';
  form.elements.namedItem('heartDetails').focus();return;
 }
 if(next.contactPhone&&!validPhone(next.contactPhone)){
  $('svMedicalFormStatus').textContent='Проверьте номер экстренного контакта.';
  form.elements.namedItem('contactPhone').focus();return;
 }
 next.updatedAt=Date.now();
 try{
  localStorage.setItem(KEY,JSON.stringify(next));
  formDisplay(false);
 }catch{
  $('svMedicalFormStatus').textContent='Не удалось сохранить на этом устройстве.';
 }
});
$('svMedicalPrint').addEventListener('click',()=>{render();window.print()});
$('svMedicalShare').addEventListener('click',async()=>{
 const message=$('svMedicalShareMessage');
 message.textContent='';
 const report=plainText();
 try{
  if(navigator.share)await navigator.share({title:'SEYVEO · Экстренная карта',text:report});
  else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(report);message.textContent='Сводка скопирована — можно отправить.';}
  else {message.textContent='Используйте «Распечатать / PDF».';}
 }catch(error){if(error?.name!=='AbortError')message.textContent='Не удалось отправить. Попробуйте PDF.';}
});
overlay.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();closePassport();}
 if(event.key==='Tab'){
  const fields=[...overlay.querySelectorAll('button,input,select,textarea')].filter(x=>x.getClientRects().length&&!x.disabled);
  if(!fields.length)return;
  if(event.shiftKey&&document.activeElement===fields[0]){event.preventDefault();fields[fields.length-1].focus();}
  else if(!event.shiftKey&&document.activeElement===fields[fields.length-1]){event.preventDefault();fields[0].focus();}
 }
});
function syncEntry(){entry.hidden=!dialog.open||dialog.dataset.space!=='health'}
window.addEventListener('seyveo:space-opened',syncEntry);
dialog.addEventListener('close',()=>{syncEntry();overlay.hidden=true;isEditing=false});
new MutationObserver(syncEntry).observe(dialog,{attributes:true,attributeFilter:['data-space','open']});
syncEntry();
})();