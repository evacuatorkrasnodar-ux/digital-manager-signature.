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
const overlay=document.createElement('dialog');
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
 '<button type="button" class="sv-med-edit" id="svMedicalEdit" aria-label="Редактировать медпаспорт"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.6-1 10.5-10.6a2.4 2.4 0 0 0-3.4-3.4L5.3 15.6 4 20Z"/><path d="m14.7 6.2 3.3 3.3"/></svg></button>',
 '</header>',
 '<div id="svMedicalView">',
 '<div class="sv-med-brand"><span class="sv-sayvi-symbol" aria-hidden="true"></span><span>Сэйви · Здоровье</span></div>',
 '<h3 id="svMedicalPerson"></h3>',
 '<p id="svMedicalUpdated" class="sv-med-muted"></p>',
 '<div id="svMedicalEssentials"></div>',
 '<details id="svMedicalHistory" class="sv-med-history">',
 '<summary><span>История здоровья</span><small id="svMedicalHistoryCount"></small><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></summary>',
 '<div class="sv-med-history-body"><div id="svMedicalMedications"></div><div id="svMedicalIntakes"></div><div id="svMedicalPressure"></div></div>',
 '</details>',
 '<p class="sv-med-disclaimer">Сведения со слов пользователя. Отметки о приёме — ручные.</p>',
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
 const hasName=!!p.name;
 $('svMedicalPerson').textContent=hasName?p.name:'Медпаспорт';
 $('svMedicalPerson').classList.toggle('sv-med-person-empty',!hasName);
 $('svMedicalUpdated').textContent='Возраст: '+d.age+
   (hasName?'': ' · Имя не указано')+
   (p.updatedAt?' · Обновлено '+timeText(p.updatedAt):'');
 const essentials=$('svMedicalEssentials');essentials.replaceChildren();
 const block=document.createElement('section');block.className='sv-med-block';
 block.append(txt('h4','Важное для скорой'));
 addPair(block,'Аллергии',selectStatus(p.allergies,p.allergyDetails),p.allergies==='yes');
 addPair(block,'Сердце',selectStatus(p.heart,p.heartDetails),p.heart==='yes');
 if(p.conditions)addPair(block,'Другие заболевания',p.conditions);
 if(p.operations)addPair(block,'Операции и импланты',p.operations);
 const currentMeds=d.meds.map(x=>[safeString(x.name,90),safeString(x.dose,80)].filter(Boolean).join(' · '));
 const shownMeds=currentMeds.slice(0,2);
 addPair(block,'Лекарства',currentMeds.length?
   shownMeds.join('; ')+(currentMeds.length>shownMeds.length?' · +'+(currentMeds.length-shownMeds.length)+' ещё':'')
   :'Нет записей о лекарствах');
 const last=d.confirmed[0];
 if(last)addPair(block,'Последний отмеченный приём',
  last.name+' · '+(last.dose||'доза не указана')+' · '+dateText(last.date)+
  (last.at?' · '+new Date(last.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):' · время отметки неизвестно'));
 const latestBp=d.pressure[0];
 addPair(block,'Давление',latestBp?
  latestBp.s+'/'+latestBp.d+' мм рт. ст.'+(latestBp.pulse!==null?' · пульс '+latestBp.pulse:'')+' · '+
  (latestBp.time?timeText(latestBp.time):dateText(latestBp.date))
  :'Нет измерений');
 if(p.contactName||p.contactPhone)addPair(block,'Экстренный контакт',
  [p.contactName,p.contactPhone].filter(Boolean).join(' · '));
 if(p.note)addPair(block,'Дополнительно',p.note);
 essentials.append(block);
 const medRows=d.meds.map(x=>[safeString(x.name,90),safeString(x.dose,80),safeString(x.time,5)].filter(Boolean).join(' · '));
 addSection($('svMedicalMedications'),'Лекарства',medRows,'Лекарства не записаны');
 const intakes=d.confirmed.map(x=>x.name+' · '+(x.dose||'доза не указана')+' · '+dateText(x.date)+
  (x.at?' · отмечено '+new Date(x.at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):' · время отметки неизвестно'));
 addSection($('svMedicalIntakes'),'Отмеченные приёмы',intakes,'Приём не подтверждался');
 const pressure=d.pressure.map(x=>x.s+'/'+x.d+' мм рт. ст.'+(x.pulse!==null?' · пульс '+x.pulse:'')+
  ' · '+(x.time?timeText(x.time):dateText(x.date)));
 addSection($('svMedicalPressure'),'Измерения давления',pressure,'Измерений нет');
 const history=$('svMedicalHistory');
 const count=d.meds.length+d.confirmed.length+d.pressure.length;
 history.hidden=count===0;
 if(count){
  const parts=[];
  if(d.pressure.length)parts.push(d.pressure.length+' '+(d.pressure.length===1?'замер':'замеров'));
  if(d.meds.length)parts.push(d.meds.length+' '+(d.meds.length===1?'лекарство':'лекарств'));
  if(d.confirmed.length)parts.push(d.confirmed.length+' отметок');
  $('svMedicalHistoryCount').textContent=parts.join(' · ');
 }
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

/* Sayvi's compact guided intake: user-confirmed facts only. */
const wizard=document.createElement('section');
wizard.id='svMedicalWizard';wizard.hidden=true;
$('svMedicalForm').before(wizard);
const W_STEPS=[
 ['Как вас зовут?','name'],
 ['Есть аллергии?','allergies'],
 ['Есть заболевания сердца?','heart'],
 ['Какие заболевания вам известны?','conditions'],
 ['Были операции или есть импланты?','operations'],
 ['Кому позвонить в экстренном случае?','contact'],
 ['Что ещё важно знать?','note']
];
const W_CONDITIONS=['Гипертония','Диабет','Перенесённый инсульт','Заболевания почек','Эпилепсия'];
let wDraft=defaults(),wStep=0,wBook=false,wError='',wSelected=[],wOther='';
function wEl(tag,cls,text){
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;return el;
}
function wBtn(text,action,cls){
 const el=wEl('button','sv-med-w-btn '+(cls||''),text);el.type='button';el.dataset.action=action;return el;
}
function wAdvance(){
 wError='';
 if(wBook){wBook=false;wRender();return}
 if(wStep===1&&wDraft.allergies==='yes'&&!safeString(wDraft.allergyDetails)){
  wError='Уточните аллергию либо выберите «Не знаю».';wRender();return;
 }
 if(wStep===2&&wDraft.heart==='yes'&&!safeString(wDraft.heartDetails)){
  wError='Уточните заболевание сердца либо выберите «Не знаю».';wRender();return;
 }
 if(wStep===4&&wDraft.operations==='__yes__'){
  wError='Укажите операцию или имплант, либо выберите «Не знаю».';wRender();return;
 }
 if(wStep===5&&(wDraft.contactName||wDraft.contactPhone)&&!validPhone(wDraft.contactPhone)){
  wError='Укажите корректный номер или пропустите вопрос.';wRender();return;
 }
 if(wStep<6){wStep++;wRender();return}
 wDraft.updatedAt=Date.now();
 try{localStorage.setItem(KEY,JSON.stringify(wDraft));formDisplay(false)}
 catch{wError='Не удалось сохранить Медпаспорт на этом устройстве.';wRender()}
}
function wBegin(){
 wDraft=readProfile();wStep=0;wBook=false;wError='';
 const existing=wDraft.conditions.split(' · ').filter(Boolean);
 wSelected=W_CONDITIONS.filter(x=>existing.includes(x));
 wOther=existing.filter(x=>!W_CONDITIONS.includes(x)&&x!=='Известных нет (со слов пользователя)').join(' · ');
 wRender();
}
function wInput(root,key,placeholder,area){
 const el=wEl(area?'textarea':'input','sv-med-w-input');
 if(area){el.rows=3;}else{el.type=key==='contactPhone'?'tel':'text';}
 el.placeholder=placeholder;el.value=wDraft[key]||'';
 el.maxLength=['conditions','note'].includes(key)?750:key==='name'?120:key==='contactPhone'?24:300;
 el.addEventListener('input',()=>{wDraft[key]=el.value.slice(0,el.maxLength)});
 root.append(el);return el;
}
function wChoices(root,key){
 const group=wEl('div','sv-med-w-choices');
 for(const [value,label] of [['yes','Да'],['no','Нет'],['unknown','Не знаю']]){
  const b=wBtn(label,'yesno','sv-med-w-choice'+(wDraft[key]===value?' selected':''));
  b.dataset.key=key;b.dataset.value=value;
  b.setAttribute('aria-pressed',String(wDraft[key]===value));
  group.append(b);
 }
 root.append(group);
 if(wDraft[key]==='yes')wInput(root,key==='heart'?'heartDetails':'allergyDetails',
  key==='heart'?'Какое заболевание сердца?':'На что аллергия и какая реакция?',true);
}
function wReadContacts(){
 const result={items:[]};
 try{window.dispatchEvent(new CustomEvent('seyveo:contacts-read',{detail:result}))}catch{}
 return (Array.isArray(result.items)?result.items:[])
  .filter(x=>x&&typeof x.name==='string'&&typeof x.phone==='string')
  .map(x=>({name:safeString(x.name,120),phone:safeString(x.phone,24)}))
  .filter(x=>x.name&&validPhone(x.phone)).slice(0,100);
}
function wSaveContact(name,phone){
 const profile=readProfile();
 profile.contactName=name;profile.contactPhone=phone;profile.updatedAt=Date.now();
 try{localStorage.setItem(KEY,JSON.stringify(profile));return true}
 catch{return false}
}
function wRender(){
 if(!isEditing||wizard.hidden)return;
 wizard.replaceChildren();
 const brand=wEl('div','sv-med-w-brand');
 brand.append(wEl('span','sv-sayvi-symbol'),wEl('strong','','Сэйви'));
 wizard.append(brand);
 const track=wEl('div','sv-med-w-track');
 track.append(wEl('small','','Вопрос '+(wStep+1)+' из '+W_STEPS.length));
 const dots=wEl('div','sv-med-w-dots');
 W_STEPS.forEach((_,i)=>dots.append(wEl('i',i<=wStep?'active':'')));
 track.append(dots);wizard.append(track);
 wizard.append(wEl('h3','sv-med-w-title',wBook?'Выберите близкого человека':W_STEPS[wStep][0]));
 const box=wEl('div','sv-med-w-body');wizard.append(box);
 const key=W_STEPS[wStep][1];
 if(wBook){
  const items=wReadContacts();
  box.append(wEl('p','sv-med-w-note','Контакты SEYVEO. Нажмите на человека — имя и номер сохранятся.'));
  const search=wEl('input','sv-med-w-input');search.type='search';search.placeholder='Найти контакт';
  box.append(search);
  const list=wEl('div','sv-med-w-people');box.append(list);
  const show=q=>{
   list.replaceChildren();
   const found=items.filter(x=>(x.name+' '+x.phone).toLocaleLowerCase('ru-RU').includes(q.toLocaleLowerCase('ru-RU')));
   if(!found.length)list.append(wEl('p','sv-med-w-note',items.length?'Ничего не найдено.':'Контактов SEYVEO пока нет.'));
   for(const person of found){
    const b=wBtn('','person','sv-med-w-person');
    b.dataset.name=person.name;b.dataset.phone=person.phone;
    b.append(wEl('strong','',person.name),wEl('small','',person.phone));list.append(b);
   }
  };
  show('');search.addEventListener('input',()=>show(search.value.trim()));
  box.append(wBtn('Ввести номер вручную','manual','sv-med-w-link'));
 }else if(key==='name')wInput(box,'name','Имя и фамилия',false);
 else if(key==='allergies'||key==='heart')wChoices(box,key);
 else if(key==='conditions'){
  box.append(wEl('p','sv-med-w-note','Отметьте только то, что вам известно.'));
  const group=wEl('div','sv-med-w-checks');
  for(const condition of W_CONDITIONS){
   const on=wSelected.includes(condition);
   const b=wBtn((on?'✓  ':'○  ')+condition,'condition','sv-med-w-check'+(on?' selected':''));
   b.dataset.condition=condition;b.setAttribute('aria-pressed',String(on));group.append(b);
  }
  box.append(group);
  const other=wEl('input','sv-med-w-input');other.type='text';other.maxLength=300;other.placeholder='Другое (если есть)';
  other.value=wOther;
  other.addEventListener('input',()=>{wOther=other.value;wDraft.conditions=[...wSelected,wOther.trim()].filter(Boolean).join(' · ').slice(0,750)});
  box.append(other);
  box.append(wBtn('Известных заболеваний нет','no-conditions','sv-med-w-link'));
 }else if(key==='operations'){
  const yes=!!wDraft.operations&&wDraft.operations!=='Операций и имплантов нет (со слов пользователя)';
  const group=wEl('div','sv-med-w-choices');
  for(const [value,label] of [['yes','Да'],['no','Нет'],['unknown','Не знаю']]){
   const active=value==='yes'?yes:value==='no'?wDraft.operations==='Операций и имплантов нет (со слов пользователя)':!wDraft.operations;
   const b=wBtn(label,'operation','sv-med-w-choice'+(active?' selected':''));
   b.dataset.value=value;group.append(b);
  }
  box.append(group);
  if(yes){
   const el=wEl('textarea','sv-med-w-input');el.rows=3;el.maxLength=300;
   el.placeholder='Какая операция или имплант?';
   el.value=wDraft.operations==='__yes__'?'':wDraft.operations;
   el.addEventListener('input',()=>{wDraft.operations=el.value||'__yes__'});box.append(el);
  }
 }else if(key==='contact'){
  box.append(wBtn('Выбрать из контактов','book','sv-med-w-primary'));
  if(navigator.contacts&&typeof navigator.contacts.select==='function')
   box.append(wBtn('Контакты телефона','device','sv-med-w-link'));
  if(wDraft.contactPhone)box.append(wEl('p','sv-med-w-note','Выбран: '+wDraft.contactName+' · '+wDraft.contactPhone));
  wInput(box,'contactName','Имя близкого',false);
  wInput(box,'contactPhone','Номер телефона',false);
 }else if(key==='note')wInput(box,'note','Необязательно',true);
 if(wError)wizard.append(wEl('p','sv-med-w-error',wError));
 const actions=wEl('div','sv-med-w-actions');
 actions.append(wBtn('Назад','back','sv-med-w-back'));
 if(!wBook){
  actions.append(wBtn('Пропустить','skip','sv-med-w-skip'));
  actions.append(wBtn(wStep===6?'Сохранить':'Далее','next','sv-med-w-next'));
 }
 wizard.append(actions);
}
async function wDevice(){
 try{
  const result=await navigator.contacts.select(['name','tel'],{multiple:false});
  const person=result?.[0];
  const name=safeString(person?.name?.[0],120),phone=safeString(person?.tel?.[0],24);
  if(!name||!validPhone(phone)){wError='Номер не найден. Выберите другой контакт.';wRender();return}
  if(!wSaveContact(name,phone)){wError='Не удалось сохранить контакт.';wRender();return}
  wDraft.contactName=name;wDraft.contactPhone=phone;wAdvance();
 }catch(error){if(error?.name!=='AbortError'){wError='Не удалось открыть контакты телефона.';wRender()}}
}
wizard.addEventListener('click',e=>{
 const btn=e.target.closest('button[data-action]');if(!btn)return;
 const action=btn.dataset.action;wError='';
 if(action==='back'){
  if(wBook)wBook=false;
  else if(wStep>0)wStep--;
  else {formDisplay(false);return}
  wRender();return;
 }
 if(action==='skip'){
  const k=W_STEPS[wStep][1];
  if(k==='allergies'||k==='heart'){wDraft[k]='unknown';wDraft[k==='heart'?'heartDetails':'allergyDetails']=''}
  else if(k==='conditions'){wSelected=[];wOther='';wDraft.conditions=''}
  else if(k==='contact'){wDraft.contactName='';wDraft.contactPhone=''}
  else wDraft[k]='';
  wAdvance();return;
 }
 if(action==='next'){wAdvance();return}
 if(action==='yesno'){
  const k=btn.dataset.key,v=btn.dataset.value;wDraft[k]=v;
  if(v!=='yes'){wDraft[k==='heart'?'heartDetails':'allergyDetails']='';wAdvance()}
  else wRender();return;
 }
 if(action==='condition'){
  const c=btn.dataset.condition;
  wSelected=wSelected.includes(c)?wSelected.filter(x=>x!==c):[...wSelected,c];
  wDraft.conditions=[...wSelected,wOther.trim()].filter(Boolean).join(' · ').slice(0,750);
  wRender();return;
 }
 if(action==='no-conditions'){wSelected=[];wOther='';wDraft.conditions='Известных нет (со слов пользователя)';wStep++;wRender();return}
 if(action==='operation'){
  const v=btn.dataset.value;
  if(v==='yes'){wDraft.operations='__yes__';wRender()}
  else{wDraft.operations=v==='no'?'Операций и имплантов нет (со слов пользователя)':'';wAdvance()}
  return;
 }
 if(action==='book'){wBook=true;wRender();return}
 if(action==='manual'){wBook=false;wRender();return}
 if(action==='device'){wDevice();return}
 if(action==='person'){
  const name=btn.dataset.name,phone=btn.dataset.phone;
  if(!validPhone(phone))return;
  if(!wSaveContact(name,phone)){wError='Не удалось сохранить контакт.';wRender();return}
  wDraft.contactName=name;wDraft.contactPhone=phone;wBook=false;wAdvance();
 }
});

function formDisplay(edit){
 isEditing=edit;
 $('svMedicalView').hidden=edit;
 $('svMedicalForm').hidden=true;
 wizard.hidden=!edit;
 $('svMedicalEdit').hidden=edit;
 $('svMedicalHeading').textContent=edit?'Медпаспорт':'Экстренная карта';
 if(edit)wBegin();
 else render();
 overlay.scrollTop=0;
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
 if(!overlay.open)overlay.showModal();
 $('svMedicalBack').focus({preventScroll:true});
}
function closePassport(){
 if(isEditing){formDisplay(false);return}
 if(overlay.open)overlay.close();
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
$('svMedicalPrint').addEventListener('click',()=>{
 render();
 const history=$('svMedicalHistory'),wasOpen=history.open;
 if(!history.hidden)history.open=true;
 window.addEventListener('afterprint',()=>{history.open=wasOpen},{once:true});
 window.print();
});
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
overlay.addEventListener('cancel',event=>{event.preventDefault();closePassport();});
dialog.addEventListener('close',()=>{syncEntry();if(overlay.open)overlay.close();overlay.hidden=true;isEditing=false});
new MutationObserver(syncEntry).observe(dialog,{attributes:true,attributeFilter:['data-space','open']});
syncEntry();
})();