/* SEYVEO Document Flow — local training workflow, NOT a production EDMS.
 * Only fixed fictional template IDs, state and timestamps are stored in localStorage.
 * No real files, document bodies, signatures or personal data are transmitted.
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
const MAX=25;
const $=(tag,cls,label)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(label!==undefined)e.textContent=label;return e;
};
const button=(label,action,cls='')=>{const e=$('button','svdf-button '+cls,label);e.type='button';e.addEventListener('click',action);return e;};
let host=null,role='manager',selected='',kind='schedule',info='';
function read(){
 try{
  const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!Array.isArray(parsed))return [];
  return parsed.filter(x=>x&&typeof x.id==='string'&&TYPES[x.kind]&&x.recipient==='elena'
   &&['sent','read','approved','returned','revoked'].includes(x.state)
   &&Array.isArray(x.log))
   .slice(-MAX).map(x=>({id:x.id.slice(0,70),kind:x.kind,recipient:'elena',state:x.state,
    created:typeof x.created==='number'?x.created:Date.now(),
    log:x.log.filter(y=>y&&typeof y.at==='number'&&typeof y.text==='string').slice(-12).map(y=>({at:y.at,text:y.text.slice(0,120)}))}));
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
 if(x.state==='read')return 'Елена ознакомилась';
 if(x.state==='approved')return TYPES[x.kind].type==='Ознакомление'?'Ознакомление подтверждено':'Согласовано · демо';
 if(x.state==='returned')return 'Возвращено с замечанием';
 return 'Отозвано';
}
function emit(reason,record){
 window.dispatchEvent(new CustomEvent('seyveo:document-flow-updated',{detail:{reason,id:record?.id||'',kind:record?.kind||'',title:record?TYPES[record.kind].title:'',state:record?.state||''}}));
}
function updateRecord(id,next){
 const x=records.find(y=>y.id===id);
 if(!x)return false;
 const allowed=role==='employee'?
  {sent:['read','approved','returned'],read:['approved','returned']}:
  {sent:['revoked'],read:['revoked']};
 if(!(allowed[x.state]||[]).includes(next)){info='Действие для этого статуса недоступно.';draw();return false;}
 const oldState=x.state;
 x.state=next;
 const label={read:'Елена открыла документ · демо',approved:next==='approved'?'Елена подтвердила · демо':'',returned:'Елена вернула с замечанием · демо',revoked:'Руководитель отозвал · демо'}[next];
 x.log.push({at:Date.now(),text:label||next});
 if(!persist()){x.state=oldState;x.log.pop();draw();return false;}
 info=next==='approved'?'Подтверждено в учебном режиме. Это не электронная подпись.':'Статус обновлён только в браузере.';
 emit('status',x);draw();return true;
}
function create(){
 if(role!=='manager')return;
 const x={id:'demo-'+Date.now()+'-'+Math.floor(Math.random()*1e5),kind,recipient:'elena',state:'sent',
  created:Date.now(),log:[{at:Date.now(),text:'Руководитель подготовил запрос для Елены · только демо'}]};
 records.push(x);records=records.slice(-MAX);
 if(!persist()){records.pop();draw();return;}
 selected=x.id;info='Запрос создан. Другим устройствам он не отправлен.';
 emit('created',x);draw();
}
function reset(){
 if(!window.confirm('Очистить только учебную историю согласований на этом устройстве?'))return;
 records=[];selected='';info='Учебная история очищена.';
 try{localStorage.removeItem(KEY)}catch{info='Не удалось очистить данные браузера.';}
 emit('reset');draw();
}
function get(id){return records.find(r=>r.id===id)||null;}
function select(id){if(!get(id))return false;selected=id;draw();return true;}
function setRole(which){if(which!=='manager'&&which!=='employee')return;role=which;info='';draw();}
function renderRecord(node,x){
 const card=$('article','svdf-record');
 if(x.id===selected)card.classList.add('is-current');
 const header=$('div','svdf-record-heading');
 header.append($('span','svdf-record-icon','▤'));
 const body=$('div','svdf-record-name');
 body.append($('strong','',TYPES[x.kind].title),$('small','',TYPES[x.kind].type+' · Елена'));
 header.append(body);card.append(header);
 const state=$('div','svdf-record-state',status(x));state.dataset.state=x.state;card.append(state);
 card.append($('small','svdf-date','Создано '+stamp(x.created)));
 const controls=$('div','svdf-actions');
 controls.append(button(x.id===selected?'Свернуть':'Просмотреть',()=>{selected=x.id===selected?'':x.id;draw();},'svdf-quiet'));
 card.append(controls);
 if(x.id===selected){
  const detail=$('div','svdf-detail');
  detail.append($('p','',TYPES[x.kind].body));
  detail.append($('p','svdf-disclaimer','Учебный текст, не официальный документ. Содержимое не подписывается и не отправляется.'));
  const actions=$('div','svdf-actions');
  if(role==='employee'){
   if(x.state==='sent')actions.append(button('Я ознакомилась',()=>updateRecord(x.id,'read'),'svdf-primary'));
   if(x.state==='sent'||x.state==='read'){
    actions.append(button(TYPES[x.kind].type==='Ознакомление'?'Подтвердить ознакомление':'Согласовать',()=>updateRecord(x.id,'approved'),'svdf-primary'));
    actions.append(button('Вернуть с замечанием',()=>updateRecord(x.id,'returned'),'svdf-quiet'));
   }
  }else if(x.state==='sent'||x.state==='read'){
   actions.append(button('Отозвать',()=>updateRecord(x.id,'revoked'),'svdf-quiet'));
  }
  if(actions.childElementCount)detail.append(actions);
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
 host.append($('p','svdf-warning','УЧЕБНЫЙ РЕЖИМ · Один браузер, переключение ролей без авторизации. Нет реальной доставки, электронной подписи, защищённого обмена и юридической силы. Для настоящих документов используйте зашифрованный архив отдельно.'));
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
 const title=$('div','svdf-list-header');
 title.append($('strong','','История документов'),$('span','',records.length+' · учебные'));
 host.append(title);
 const list=$('div','svdf-list');
 for(const x of records.slice().reverse())renderRecord(list,x);
 if(!records.length)list.append($('div','svdf-empty','Пока нет запросов. Руководитель может создать учебный документ, а Елена — подтвердить ознакомление.'));
 host.append(list);
 const live=$('p','svdf-feedback',info);live.setAttribute('role','status');host.append(live);
 if(records.length)host.append(button('Очистить учебную историю',reset,'svdf-reset'));
 host.append($('p','svdf-footnote','Настоящее внедрение потребует учётных записей, прав доступа, серверной доставки, журналирования, хранения в подходящем контуре и интеграции с оператором ЭДО/ЭП.'));
}
function mount(parent){
 if(!parent)return false;
 if(host&&host.parentNode)host.remove();
 host=$('div','svdf-root');parent.append(host);draw();return true;
}
function unmount(){host=null;}
window.addEventListener('storage',e=>{if(e.key!==KEY)return;records=read();draw();});
window.SEYVEO_DOCUMENT_FLOW=Object.freeze({mount,unmount,select,get:get,getRecords:()=>records.slice(),setRole,reset});
})();
