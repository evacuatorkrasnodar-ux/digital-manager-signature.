/* SEYVEO Document Flow — local training workflow, NOT a production EDMS.
 * Fictional sample text, revision drafts, state and timestamps are stored UNENCRYPTED in localStorage.
 * No real files, signatures or personal data are transmitted. Never enter confidential data.
 * Switching demo roles is not authentication or access control.
 */
(()=>{
'use strict';
const KEY='seyveo-document-flow-training-v1';
const TYPES=Object.freeze({
 schedule:{title:'Приказ о графике смен',type:'Ознакомление',body:'Учебный пример. График смен на следующую неделю согласуется руководителем. Сотрудник знакомится с документом и подтверждает прочтение.'},
 equipment:{title:'Акт приёмки оборудования',type:'Согласование',body:'Учебный пример. Полученное оборудование проверяется ответственным сотрудником перед согласованием акта.'},
 supplier:{title:'Договор с поставщиком',type:'Согласование',body:'Учебный пример. Условия поставки, цена, сроки и реквизиты должны быть проверены перед заключением договора.'}
});
const MAX=25,MAX_REVISIONS=10,MAX_BODY=2400;
const validBody=value=>typeof value==='string'&&value.trim().length>=20&&value.length<=MAX_BODY;
const validNote=value=>typeof value==='string'&&value.trim().length>=5&&value.trim().length<=350;
const $=(tag,cls,label)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(label!==undefined)e.textContent=label;return e;
};
const button=(label,action,cls='')=>{const e=$('button','svdf-button '+cls,label);e.type='button';e.addEventListener('click',action);return e;};
/* Original SEYVEO line illustrations, no third-party assets or document HTML. */
const DRAWINGS=Object.freeze({
 schedule:'<path d="M14 8h34v48H14zM14 19h34M24 4v8M38 4v8M21 31h5M32 31h5M21 41h5M32 41h5"/>',
 equipment:'<path d="M11 17h42v37H11zM11 29h42M21 10h22v7M27 37l6 6 10-12"/>',
 supplier:'<path d="M16 7h25l9 9v40H16zM41 7v11h9M23 29h20M23 38h20M23 47h11"/>',
 person:'<circle cx="32" cy="20" r="9"/><path d="M14 54v-5c0-13 8-19 18-19s18 6 18 19v5"/>',
 decision:'<circle cx="32" cy="32" r="23"/><path d="m21 32 8 8 16-19"/>',
 signature:'<path d="M10 12h44v40H10zM17 23h25M17 31h16M17 45c7-13 9 5 14-3 5-8 4 5 15-4"/>',
 file:'<path d="M16 8h27l10 10v38H16zM43 8v11h10M23 29h20M23 38h15"/>'
});
function pictogram(kind){
 const node=$('span','svdf-pictogram');
 node.setAttribute('aria-hidden','true');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 64 64');
 svg.setAttribute('focusable','false');
 svg.innerHTML='<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'+
  (DRAWINGS[kind]||DRAWINGS.file)+'</g>';
 node.append(svg);return node;
}
function journey(record){
 const wrap=$('section','svdf-journey');
 const top=$('div','svdf-journey-head');
 top.append($('strong','',record?'Этапы документа':'Как проходит согласование'),
  $('small','',record?TYPES[record.kind].title:''));
 wrap.append(top);
 const approval=record&&TYPES[record.kind].type==='Согласование';
 const state=record?.state||'sample';
 const stages=state==='sample'?['sample','sample','sample','sample']:
  state==='sent'?['done','active','pending','pending']:
  state==='read'?['done','done','active','pending']:
  state==='returned'?['done','done','returned','pending']:
  state==='approved'?['done','done','done',approval?'pending':'done']:
  state==='signing'?['done','done','done','active']:
  ['done','stopped','stopped','stopped'];
 const steps=[
  ['file','Документ'],
  ['person','Елена'],
  ['decision',state==='returned'?'Замечание':'Решение'],
  [approval?'signature':'decision',approval?'КЭП':'Итог']
 ];
 const line=$('div','svdf-journey-line');
 line.setAttribute('aria-label','Состояние учебных этапов документа');
 const labels={done:'Пройден',active:'Текущий этап',pending:'Ожидает',
  returned:'Возвращён',stopped:'Отозван',sample:'Пример этапа'};
 steps.forEach(([icon,label],index)=>{
  const step=$('div','svdf-journey-step');
  step.dataset.phase=stages[index];
  step.setAttribute('aria-label',label+' · '+labels[stages[index]]);
  step.append(pictogram(icon),$('small','',label));
  line.append(step);
  if(index<steps.length-1){
   const arrow=$('span','svdf-journey-connector','›');
   arrow.setAttribute('aria-hidden','true');line.append(arrow);
  }
 });
 wrap.append(line);
 const caption=!record?'':
  state==='signing'?'КЭП пока не выполнена':
  state==='approved'?(approval?'Согласовано · подпись не выполнена':'Ознакомление отмечено · демо'):
  state==='returned'?'Елена вернула с замечанием':
  state==='revoked'?'Запрос отозван':
  state==='read'?'Документ открыт · ожидает решения':'Запрос создан только в браузере';
 if(caption)wrap.append($('p','svdf-journey-caption',caption));
 return wrap;
}

let host=null,role='manager',selected='',kind='schedule',info='',listFilter='active';
const centralPreviewRole=()=>window.SEYVEO_PREVIEW?.isEmployee?.()===true?'employee':'manager';
let returnDraft={id:'',text:''},revisionDraft={id:'',body:'',note:''};
const isActive=x=>x.state==='sent'||x.state==='read'||x.state==='signing'||(role==='manager'&&(x.state==='returned'||(x.state==='approved'&&TYPES[x.kind].type==='Согласование')));
function safeRevisions(x){
 const fallback={number:1,body:TYPES[x.kind].body,at:Number.isFinite(x.created)?x.created:Date.now(),note:'Исходный учебный текст'};
 if(!Array.isArray(x.revisions)||!x.revisions.length)return [fallback];
 const valid=x.revisions.slice(0,MAX_REVISIONS).filter(v=>v&&
  Number.isInteger(v.number)&&v.number>=1&&v.number<=MAX_REVISIONS&&
  validBody(v.body)&&Number.isFinite(v.at)&&typeof v.note==='string')
  .map(v=>({number:v.number,body:v.body,at:v.at,note:v.note.slice(0,350)}));
 if(!valid.length||valid[0].number!==1||
    valid.some((v,i)=>v.number!==i+1))return [fallback];
 return valid;
}
const latestRevision=x=>x.revisions[x.revisions.length-1];
const safeReason=text=>typeof text==='string'?text.trim().slice(0,350):'';
function read(){
 try{
  const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!Array.isArray(parsed))return [];
  return parsed.filter(x=>x&&typeof x.id==='string'&&TYPES[x.kind]&&x.recipient==='elena'
   &&['sent','read','approved','signing','returned','revoked'].includes(x.state)
   &&Array.isArray(x.log))
   .slice(-MAX).map(x=>({id:x.id.slice(0,70),kind:x.kind,recipient:'elena',state:x.state,
    created:Number.isFinite(x.created)?x.created:Date.now(),
    revisions:safeRevisions(x), 
    log:x.log.filter(y=>y&&Number.isFinite(y.at)&&typeof y.text==='string').slice(-12).map(y=>({at:y.at,text:y.text.slice(0,460)}))}));
 }catch{return [];}
}
let records=read();
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(records.slice(-MAX)));return true;}
 catch{info='Не удалось сохранить демонстрационные статусы в этом браузере.';return false;}
}
function stamp(t){return new Date(t).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}
function status(x){
 if(x.state==='sent')return 'Ожидает Елену';
 if(x.state==='read')return 'Открыт Еленой · ожидает решения';
 if(x.state==='approved')return TYPES[x.kind].type==='Ознакомление'?'Ознакомление подтверждено · демо':'Согласовано · ожидает оформления подписи';
 if(x.state==='signing')return 'Ожидает КЭП · подпись не выполнена';
 if(x.state==='returned')return 'Нужна новая редакция · замечание Елены';
 return 'Отозвано';
}
function emit(reason,record){
 window.dispatchEvent(new CustomEvent('seyveo:document-flow-updated',{detail:{reason,id:record?.id||'',kind:record?.kind||'',title:record?TYPES[record.kind].title:'',state:record?.state||''}}));
}
function updateRecord(id,next,reason=''){
 const x=records.find(y=>y.id===id);
 if(!x)return false;
 const allowed=role==='employee'
  ?{sent:['read'],read:['approved','returned']}
  :{sent:['revoked'],read:['revoked'],approved:['signing'],signing:['revoked']};
 if(!(allowed[x.state]||[]).includes(next)){
  info='Сначала нужно открыть документ и отметить прочтение. Недоступные действия не выполняются.';
  draw();return false;
 }
 const remark=safeReason(reason);
 if(next==='returned'&&(remark.length<5||remark.length>350)){
  info='Укажи причину возврата (от 5 до 350 символов).';
  draw();return false;
 }
 const oldState=x.state,oldLog=x.log.slice();
 x.state=next;
 const label={
  read:'Елена открыла документ · ожидается решение · учебный режим',
  approved:'Елена подтвердила '+(TYPES[x.kind].type==='Ознакомление'?'ознакомление':'согласование')+' · учебный режим',
  returned:'Елена вернула с замечанием: '+remark+' · учебный режим',
  signing:'Руководитель направил согласованный документ на этап КЭП · подпись ещё не выполнена',
  revoked:'Руководитель отозвал документ · учебный режим'
 }[next];
 x.log=x.log.concat({at:Date.now(),text:label||next}).slice(-12);
 if(!persist()){x.state=oldState;x.log=oldLog;draw();return false;}
 returnDraft={id:'',text:''};
 info=next==='approved'?'Учебное согласование подтверждено. Юридическая подпись ещё не выполнена.'
  :next==='signing'?'Подготовлено к КЭП. Сертификат и сервис подписания пока не подключены.'
  :'Статус обновлён только в браузере.';
 emit('status',x);draw();return true;
}
function resubmit(id,newBody,changeNote){
 if(role!=='manager')return false;
 const x=records.find(y=>y.id===id);
 if(!x||x.state!=='returned')return false;
 if(x.revisions.length>=MAX_REVISIONS){
  info='Достигнут предел учебных редакций. Создай новый документ.';
  draw();return false;
 }
 if(!validBody(newBody)||newBody.trim()===latestRevision(x).body.trim()){
  info='Измени текст документа (от 20 до 2400 символов), прежде чем отправлять новую редакцию.';
  draw();return false;
 }
 if(!validNote(changeNote)){
  info='Опиши исправление: от 5 до 350 символов.';
  draw();return false;
 }
 const now=Date.now(),nextNumber=latestRevision(x).number+1;
 const replacement={...x,state:'sent',
  revisions:x.revisions.concat({number:nextNumber,body:newBody.trim(),at:now,note:changeNote.trim()}),
  log:x.log.concat({at:now,text:'Руководитель отправил редакцию №'+nextNumber+
   ' · исправлено: '+changeNote.trim()+' · учебный режим'}).slice(-12)};
 const previous=records;
 records=records.map(item=>item.id===id?replacement:item);
 if(!persist()){records=previous;draw();return false;}
 revisionDraft={id:'',body:'',note:''};
 listFilter='active';info='Новая редакция №'+nextNumber+' передана Елене в этом браузере. Подтверждение потребуется заново.';
 emit('revision',replacement);draw();return true;
}
function create(){
 if(role!=='manager')return;
 const x={id:'demo-'+Date.now()+'-'+Math.floor(Math.random()*1e5),kind,recipient:'elena',state:'sent',
  created:Date.now(),revisions:[{number:1,body:TYPES[kind].body,at:Date.now(),note:'Исходный учебный текст'}],
  log:[{at:Date.now(),text:'Руководитель подготовил запрос для Елены · только демо'}]};
 const previous=records;
 records=records.concat(x).slice(-MAX);
 if(!persist()){records=previous;draw();return;}
 selected=x.id;listFilter='active';info='Запрос создан. Другим устройствам он не отправлен.';
 emit('created',x);draw();
}
function reset(){
 if(!window.confirm('Очистить только учебную историю согласований на этом устройстве?'))return;
 const previous=records;
 try{localStorage.removeItem(KEY)}catch{info='Не удалось очистить данные браузера.';draw();return;}
 records=[];selected='';returnDraft={id:'',text:''};revisionDraft={id:'',body:'',note:''};info='Учебная история очищена.';
 emit('reset');draw();
}
function get(id){return records.find(r=>r.id===id)||null;}
function select(id){
 const record=get(id);if(!record)return false;
 selected=id;listFilter=isActive(record)?'active':'completed';
 revisionDraft={id:'',body:'',note:''};draw();return true;
}
function openRecord(x){
 if(selected===x.id){selected='';draw();return;}
 selected=x.id;
 // In the training flow, opening the document is one action. It records
 // "opened" but NEVER confirms consent, agreement, or a legal signature.
 if(role==='employee'&&x.state==='sent'){
  updateRecord(x.id,'read');return;
 }
 draw();
}
// There is only ONE role preview in SEYVEO: owned by the working cabinet.
function setRole(which){
 if(which!=='manager'&&which!=='employee')return false;
 const change=window.SEYVEO_UNIFIED_TASKS?.previewRole;
 if(typeof change!=='function')return false;
 change(which);return true;
}
function syncRole(){
 const next=centralPreviewRole();
 if(next===role)return;
 role=next;selected='';info='';
 returnDraft={id:'',text:''};revisionDraft={id:'',body:'',note:''};
 listFilter='active';
 if(host?.isConnected)draw();
}
function renderRecord(node,x){
 const card=$('article','svdf-record');
 const expanded=x.id===selected;
 if(expanded)card.classList.add('is-current');
 // A single accessible title-row button handles both expand and collapse.
 const header=$('button','svdf-button svdf-record-heading svdf-record-toggle');
 header.type='button';
 header.setAttribute('aria-expanded',String(expanded));
 header.setAttribute('aria-label',(expanded?'Свернуть':'Открыть')+' '+TYPES[x.kind].title);
 header.addEventListener('click',()=>openRecord(x));
 const symbol=$('span','svdf-record-icon');
 symbol.append(pictogram(x.kind));header.append(symbol);
 const body=$('span','svdf-record-name');
 body.append($('strong','',TYPES[x.kind].title),
  $('small','',TYPES[x.kind].type+' · Елена · №'+latestRevision(x).number));
 const meta=$('span','svdf-record-meta');
 const state=$('span','svdf-record-state',status(x));
 state.dataset.state=x.state;
 meta.append(state,$('time','svdf-date',stamp(x.created)));
 body.append(meta);
 const chevron=$('span','svdf-record-chevron');
 chevron.setAttribute('aria-hidden','true');
 header.append(body,chevron);
 card.append(header);
 if(expanded){
  const detail=$('div','svdf-detail');
  const paper=$('div','svdf-paper');
  paper.append($('span','svdf-paper-brand','SEYVEO · УЧЕБНЫЙ ОБРАЗЕЦ'),
   $('strong','svdf-paper-title',TYPES[x.kind].title),
   $('p','svdf-document-body',latestRevision(x).body),
   $('small','svdf-paper-version','Редакция №'+latestRevision(x).number));
  // Keep progress with its corresponding document, not above the queue.
  detail.append(paper,journey(x));
  const actions=$('div','svdf-actions');
  if(role==='employee'){
   if(x.state==='sent'){
    detail.append($('p','svdf-hint','Документ пока не открыт в учебном маршруте. Открой его, чтобы перейти к решению.'));
   }
   if(x.state==='read'){
    actions.append(button(TYPES[x.kind].type==='Ознакомление'?'Подтвердить ознакомление':'Согласовать',()=>updateRecord(x.id,'approved'),'svdf-primary'));
    actions.append(button('Вернуть с замечанием',()=>{
     returnDraft={id:x.id,text:returnDraft.id===x.id?returnDraft.text:''};draw();
    },'svdf-quiet'));
   }
  }else if(x.state==='sent'||x.state==='read'){
   actions.append(button('Отозвать',()=>updateRecord(x.id,'revoked'),'svdf-quiet'));
  }else if(x.state==='approved'&&TYPES[x.kind].type==='Согласование'){
   actions.append(button('Подготовить к КЭП',()=>updateRecord(x.id,'signing'),'svdf-primary'));
  }else if(x.state==='signing'){
   detail.append($('p','svdf-signing-notice',
    'Документ согласован, но не подписан. Для реальной КЭП потребуется подключить сервис подписания, проверить сертификат и полномочия подписанта.'));
   actions.append(button('Отозвать запрос',()=>updateRecord(x.id,'revoked'),'svdf-quiet'));
  }else if(x.state==='returned'){
   actions.append(button('Исправить и отправить повторно',()=>{
    revisionDraft={id:x.id,body:latestRevision(x).body,note:''};draw();
   },'svdf-primary'));
  }
  if(actions.childElementCount)detail.append(actions);
  if(role==='employee'&&x.state==='read'&&returnDraft.id===x.id){
   const remark=$('div','svdf-return-editor');
   const heading=$('strong','','Причина возврата');
   const field=$('textarea','svdf-return-input');
   field.rows=3;field.maxLength=350;
   field.placeholder='Например, неверные сроки или требуется исправление…';
   field.setAttribute('aria-label','Причина возврата документа');
   field.value=returnDraft.text;
   field.addEventListener('input',()=>{returnDraft.text=field.value;});
   const buttons=$('div','svdf-actions');
   buttons.append(button('Отправить замечание',()=>updateRecord(x.id,'returned',field.value),'svdf-primary'));
   buttons.append(button('Отмена',()=>{returnDraft={id:'',text:''};draw();},'svdf-quiet'));
   remark.append(heading,field,buttons);
   detail.append(remark);
  }
  if(role==='manager'&&x.state==='returned'&&revisionDraft.id===x.id){
   const editor=$('section','svdf-revision-editor');
   editor.append($('strong','','Исправленная редакция №'+(latestRevision(x).number+1)));
   editor.append($('p','svdf-hint','Измени учебный текст и кратко опиши исправление. Предыдущая редакция сохранится в истории.'));
   const bodyField=$('textarea','svdf-revision-body');
   bodyField.maxLength=MAX_BODY;bodyField.rows=5;
   bodyField.setAttribute('aria-label','Исправленный текст учебного документа');
   bodyField.value=revisionDraft.body;
   bodyField.addEventListener('input',()=>revisionDraft.body=bodyField.value);
   const noteField=$('textarea','svdf-revision-note');
   noteField.rows=2;noteField.maxLength=350;
   noteField.placeholder='Что именно исправлено…';
   noteField.setAttribute('aria-label','Описание исправлений');
   noteField.value=revisionDraft.note;
   noteField.addEventListener('input',()=>revisionDraft.note=noteField.value);
   editor.append(bodyField,noteField);
   const buttons=$('div','svdf-actions');
   buttons.append(button('Отправить редакцию',()=>resubmit(x.id,bodyField.value,noteField.value),'svdf-primary'));
   buttons.append(button('Отмена',()=>{revisionDraft={id:'',body:'',note:''};draw();},'svdf-quiet'));
   editor.append(buttons);detail.append(editor);
  }
  // History and revisions now share one disclosure. Their data is untouched.
  const history=$('details','svdf-history');
  history.append($('summary','','История документа · '+x.revisions.length+' ред. · '+x.log.length+' действий'));
  const historyBody=$('div','svdf-history-body');
  const versions=$('section','svdf-versions');
  versions.append($('strong','svdf-history-subhead','Редакции'));
  for(const rev of x.revisions.slice().reverse()){
   const section=$('details','svdf-revision-item');
   section.append($('summary','','№'+rev.number+' · '+stamp(rev.at)),
    $('small','',rev.note),$('p','',rev.body));
   versions.append(section);
  }
  const log=$('section','svdf-log');
  log.append($('strong','svdf-history-subhead','Действия'));
  const timeline=$('ol','');
  for(const item of x.log)timeline.append($('li','',stamp(item.at)+' · '+item.text));
  log.append(timeline);
  historyBody.append(versions,log);history.append(historyBody);
  detail.append(history);card.append(detail);
 }
 node.append(card);
}
function draw(){
 if(!host)return;
 host.replaceChildren();
 const lead=$('div','svdf-lead');
 lead.append($('span','svdf-kicker','SEYVEO BUSINESS · ДОКУМЕНТЫ'),
  $('h2','','Согласования'),
  $('p','',''));
 host.append(lead);
 const safety=$('details','svdf-safety');
 safety.append($('summary','','Учебный режим · без отправки'));
 safety.append($('p','','Согласования здесь учебные: данные хранятся в браузере без шифрования, не отправляются на сервер и не являются электронной подписью. Используйте только вымышленные документы.'));
 host.append(safety);
 
 // Progress lives only within an expanded document.
 if(role==='manager'){
  const form=$('section','svdf-create svdf-create-simple');
  form.append($('strong','','Новый запрос · Елена'));
  const sendLabel=()=>TYPES[kind].type==='Ознакомление'?'На ознакомление':'На согласование';
  const submit=button(sendLabel(),create,'svdf-primary');
  const choices=$('div','svdf-template-gallery');
  choices.setAttribute('role','group');
  choices.setAttribute('aria-label','Выберите учебный документ');
  for(const [key,type] of Object.entries(TYPES)){
   const option=button('',()=>{
    kind=key;submit.textContent=sendLabel();
    for(const item of choices.children)
     item.setAttribute('aria-pressed',String(item.dataset.kind===kind));
   },'svdf-template-card');
   option.dataset.kind=key;
   option.setAttribute('aria-label','Выбрать учебный документ: '+type.title);
   option.setAttribute('aria-pressed',String(key===kind));
   const thumbnail=$('span','svdf-template-paper');
   thumbnail.setAttribute('aria-hidden','true');
   thumbnail.append($('span','svdf-template-mini-title',
    key==='schedule'?'Приказ':key==='equipment'?'Акт':'Договор'));
   for(const width of ['long','long','medium','short'])
    thumbnail.append($('i','svdf-template-line svdf-template-line-'+width));
   thumbnail.append($('span','svdf-template-mini-sign'));
   option.append(thumbnail,$('strong','',key==='schedule'?'Приказ':key==='equipment'?'Акт':'Договор'));
   choices.append(option);
  }
  // Recipient already appears above the templates.
  form.append(choices,submit);
  host.append(form);
 }else host.append($('p','svdf-hint svdf-staff-instruction','Выберите входящий документ для решения.'));
 const active=records.filter(isActive).length,completed=records.length-active;
 // Filter counters are the ONE queue scorecard. No duplicate thin bar.
 const title=$('div','svdf-list-header');
 title.append($('strong','',role==='employee'?'Мои входящие':'Отправленные документы'));
 host.append(title);
 const filters=$('div','svdf-list-filters');
 filters.setAttribute('role','group');filters.setAttribute('aria-label','Фильтр учебных документов');
 for(const [value,label] of [['active','В работе · '+active],['completed','История · '+completed]]){
  const tab=button(label,()=>{listFilter=value;selected='';returnDraft={id:'',text:''};revisionDraft={id:'',body:'',note:''};draw();},'svdf-list-filter');
  tab.setAttribute('aria-pressed',String(listFilter===value));
  filters.append(tab);
 }
 host.append(filters);
 const list=$('div','svdf-list');
 const visible=records.filter(x=>listFilter==='all'||(listFilter==='active'?isActive(x):!isActive(x)));
 for(const x of visible.slice().reverse())renderRecord(list,x);
 if(!visible.length)list.append($('div','svdf-empty',
  records.length?'Здесь пока пусто.':role==='employee'?'Входящих пока нет.':'Создайте первый запрос.'));
 host.append(list);
 const live=$('p','svdf-feedback',info);live.setAttribute('role','status');host.append(live);
 const more=$('details','svdf-optional');
 more.append($('summary','','Дополнительно'));
 const moreActions=$('div','svdf-optional-actions');
 const chat=button('Рабочий чат',()=>{
  const open=window.SEYVEO_UNIFIED_TASKS?.openChat;
  if(typeof open==='function')open('manage','docs',role==='employee'?'elena':'manager');
  else{info='Рабочий чат пока недоступен.';draw();}
 },'svdf-chat-link');
 moreActions.append(chat);
 if(records.length)moreActions.append(button('Очистить учебную историю',reset,'svdf-reset'));
 more.append(moreActions);
 host.append(more);
 // The safety disclosure above is the single owner of demo/privacy warnings.
}
function mount(parent){
 if(!parent)return false;
 if(host&&host.parentNode)host.remove();
 // The current app preview determines the initial document inbox, not any
 // previous unverified role toggled inside this training screen.
 role=centralPreviewRole();
 selected='';listFilter='active';returnDraft={id:'',text:''};revisionDraft={id:'',body:'',note:''};info='';
 host=$('div','svdf-root');parent.append(host);draw();return true;
}
function unmount(){host=null;}
window.addEventListener('storage',e=>{if(e.key!==KEY)return;records=read();draw();});
window.addEventListener('seyveo:preview-role-changed',syncRole);
window.SEYVEO_DOCUMENT_FLOW=Object.freeze({mount,unmount,select,get:get,getRecords:()=>records.slice(),setRole,reset});
})();
