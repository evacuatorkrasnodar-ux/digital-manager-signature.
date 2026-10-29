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
let host=null,role='manager',selected='',kind='schedule',info='',listFilter='active';
let returnDraft={id:'',text:''},revisionDraft={id:'',body:'',note:''};
const isActive=x=>x.state==='sent'||x.state==='read'||(role==='manager'&&x.state==='returned');
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
   &&['sent','read','approved','returned','revoked'].includes(x.state)
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
 if(x.state==='read')return 'Елена просмотрела · ждём подтверждения';
 if(x.state==='approved')return TYPES[x.kind].type==='Ознакомление'?'Ознакомление подтверждено':'Согласовано · демо';
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
  :{sent:['revoked'],read:['revoked']};
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
  read:'Елена отметила прочтение · учебный режим',
  approved:'Елена подтвердила '+(TYPES[x.kind].type==='Ознакомление'?'ознакомление':'согласование')+' · учебный режим',
  returned:'Елена вернула с замечанием: '+remark+' · учебный режим',
  revoked:'Руководитель отозвал документ · учебный режим'
 }[next];
 x.log=x.log.concat({at:Date.now(),text:label||next}).slice(-12);
 if(!persist()){x.state=oldState;x.log=oldLog;draw();return false;}
 returnDraft={id:'',text:''};
 info=next==='approved'?'Подтверждено в учебном режиме. Это не электронная подпись.':'Статус обновлён только в браузере.';
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
function select(id){if(!get(id))return false;selected=id;listFilter='all';revisionDraft={id:'',body:'',note:''};draw();return true;}
function setRole(which){if(which!=='manager'&&which!=='employee')return;role=which;info='';selected='';returnDraft={id:'',text:''};revisionDraft={id:'',body:'',note:''};listFilter='active';draw();}
function renderRecord(node,x){
 const card=$('article','svdf-record');
 if(x.id===selected)card.classList.add('is-current');
 const header=$('div','svdf-record-heading');
 header.append($('span','svdf-record-icon','▤'));
 const body=$('div','svdf-record-name');
 body.append($('strong','',TYPES[x.kind].title),$('small','',TYPES[x.kind].type+' · Елена · редакция №'+latestRevision(x).number));
 header.append(body);card.append(header);
 const state=$('div','svdf-record-state',status(x));state.dataset.state=x.state;card.append(state);
 card.append($('small','svdf-date','Создано '+stamp(x.created)));
 const controls=$('div','svdf-actions');
 controls.append(button(x.id===selected?'Свернуть':'Просмотреть',()=>{selected=x.id===selected?'':x.id;draw();},'svdf-quiet'));
 card.append(controls);
 if(x.id===selected){
  const detail=$('div','svdf-detail');
  detail.append($('p','svdf-document-body',latestRevision(x).body));
  detail.append($('p','svdf-disclaimer','Учебный текст. Редакции сохраняются только в этом браузере, без шифрования и подписи.'));
  const actions=$('div','svdf-actions');
  if(role==='employee'){
   if(x.state==='sent'){
    actions.append(button('Отметить как прочитанное',()=>updateRecord(x.id,'read'),'svdf-primary'));
    detail.append($('p','svdf-hint','Сначала ознакомься с текстом. Подтверждение станет доступно после прочтения.'));
   }
   if(x.state==='read'){
    actions.append(button(TYPES[x.kind].type==='Ознакомление'?'Подтвердить ознакомление':'Согласовать',()=>updateRecord(x.id,'approved'),'svdf-primary'));
    actions.append(button('Вернуть с замечанием',()=>{
     returnDraft={id:x.id,text:returnDraft.id===x.id?returnDraft.text:''};draw();
    },'svdf-quiet'));
   }
  }else if(x.state==='sent'||x.state==='read'){
   actions.append(button('Отозвать',()=>updateRecord(x.id,'revoked'),'svdf-quiet'));
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
   buttons.append(button('Отправить новую редакцию · демо',()=>resubmit(x.id,bodyField.value,noteField.value),'svdf-primary'));
   buttons.append(button('Отмена',()=>{revisionDraft={id:'',body:'',note:''};draw();},'svdf-quiet'));
   editor.append(buttons);detail.append(editor);
  }
  const versions=$('details','svdf-versions');
  const summary=$('summary','','Редакции документа · '+x.revisions.length);
  versions.append(summary);
  for(const rev of x.revisions.slice().reverse()){
   const section=$('div','svdf-revision-item');
   section.append($('strong','','Редакция №'+rev.number+' · '+stamp(rev.at)));
   section.append($('small','',rev.note));
   section.append($('p','',rev.body));
   versions.append(section);
  }
  detail.append(versions);
  const log=$('div','svdf-log');log.append($('strong','','История действий'));
  const timeline=$('ol','');
  for(const item of x.log)timeline.append($('li','',stamp(item.at)+' · '+item.text));
  log.append(timeline);detail.append(log);card.append(detail);
 }
 node.append(card);
}
function draw(){
 if(!host)return;
 host.replaceChildren();
 const lead=$('div','svdf-lead');
 lead.append($('span','svdf-kicker','SEYVEO BUSINESS · ДОКУМЕНТЫ'),
  $('h2','','Согласования'),
  $('p','','Документ → сотрудник → ознакомление или согласование → история действий.'));
 host.append(lead);
 host.append($('p','svdf-warning','УЧЕБНЫЙ РЕЖИМ · Редакции и замечания хранятся без шифрования в этом браузере. Не вводите личные, коммерческие или конфиденциальные данные. Переключение ролей не является авторизацией. Нет реальной доставки и юридически значимой подписи.'));
 const roleSwitch=$('div','svdf-role-switch');roleSwitch.setAttribute('role','group');roleSwitch.setAttribute('aria-label','Учебная роль');
 for(const [key,label] of [['manager','Руководитель'],['employee','Елена · сотрудник']]){
  const b=button(label,()=>setRole(key),'svdf-role');b.setAttribute('aria-pressed',String(key===role));roleSwitch.append(b);
 }
 host.append(roleSwitch);
 if(role==='manager'){
  const form=$('section','svdf-create');
  form.append($('strong','','Подготовить запрос'));
  const picker=$('select','svdf-select');picker.setAttribute('aria-label','Выберите учебный документ');
  for(const [key,type] of Object.entries(TYPES)){const o=$('option','',type.title);o.value=key;picker.append(o);}
  picker.value=kind;picker.addEventListener('change',()=>{if(TYPES[picker.value])kind=picker.value;});
  form.append(picker,$('small','','Получатель: Елена · учебный сотрудник'));
  form.append(button('Передать Елене · демо',create,'svdf-primary'));
  host.append(form);
 }else host.append($('p','svdf-hint','Ты видишь учебную роль Елены. Открой запрос, прочитай содержание и выбери действие.'));
 const active=records.filter(isActive).length,completed=records.length-active;
 const title=$('div','svdf-list-header');
 title.append($('strong','',role==='employee'?'Мои входящие':'Отправленные документы'),
  $('span','',active+' в работе · '+completed+' завершены'));
 host.append(title);
 const filters=$('div','svdf-list-filters');
 filters.setAttribute('role','group');filters.setAttribute('aria-label','Фильтр учебных документов');
 for(const [value,label] of [['active','В работе · '+active],['completed','Завершены · '+completed],['all','Все · '+records.length]]){
  const tab=button(label,()=>{listFilter=value;selected='';returnDraft={id:'',text:''};revisionDraft={id:'',body:'',note:''};draw();},'svdf-list-filter');
  tab.setAttribute('aria-pressed',String(listFilter===value));
  filters.append(tab);
 }
 host.append(filters);
 const list=$('div','svdf-list');
 const visible=records.filter(x=>listFilter==='all'||(listFilter==='active'?isActive(x):!isActive(x)));
 for(const x of visible.slice().reverse())renderRecord(list,x);
 if(!visible.length)list.append($('div','svdf-empty',
  records.length?'В этой категории пока нет документов.':'Пока нет запросов. Руководитель может создать учебный документ, а Елена — подтвердить ознакомление.'));
 host.append(list);
 const live=$('p','svdf-feedback',info);live.setAttribute('role','status');host.append(live);
 if(records.length)host.append(button('Очистить учебную историю',reset,'svdf-reset'));
 const chat=button('Обсудить документы в рабочем чате',()=>{
  const open=window.SEYVEO_UNIFIED_TASKS?.openChat;
  if(typeof open==='function')open('manage','docs',role==='employee'?'elena':'manager');
  else{info='Рабочий чат пока недоступен.';draw();}
 },'svdf-chat-link');
 host.append(chat);
 host.append($('p','svdf-footnote','Настоящее внедрение потребует учётных записей, прав доступа, серверной доставки, журналирования, хранения в подходящем контуре и интеграции с оператором ЭДО/ЭП.'));
}
function mount(parent){
 if(!parent)return false;
 if(host&&host.parentNode)host.remove();
 // The current app preview determines the initial document inbox, not any
 // previous unverified role toggled inside this training screen.
 role=window.SEYVEO_PREVIEW?.isEmployee?.()===true?'employee':'manager';
 selected='';listFilter='active';returnDraft={id:'',text:''};revisionDraft={id:'',body:'',note:''};info='';
 host=$('div','svdf-root');parent.append(host);draw();return true;
}
function unmount(){host=null;}
window.addEventListener('storage',e=>{if(e.key!==KEY)return;records=read();draw();});
window.SEYVEO_DOCUMENT_FLOW=Object.freeze({mount,unmount,select,get:get,getRecords:()=>records.slice(),setRole,reset});
})();
