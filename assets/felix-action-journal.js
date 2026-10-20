/* SEYVEO · Felix local action journal.
 * Prototype attached only to localhost REAL-Home adapter, never public Home.
 * Records metadata, not personal texts. "Completed" only after a matching
 * NEW record is observed in existing on-device Calendar/Notebook storage.
 */
(function(root){
 'use strict';
 const KEY='seyveo-felix-action-journal-v1';
 const CALENDAR='seyveo-calendar-events-v1';
 const MAX=40;
 const LABEL={calendar:'Событие Календаря',note:'Запись в Блокнот'};
 const DISPLAY={
  prepared:'Подготовил черновик',
  awaiting_confirmation:'Ожидаю подтверждения',
  completed:'Выполнено',
  failed:'Не получилось',
  cancelled:'Отменено'
 };
 let active=null,volatile=[];
 function read(){
  try{
   const data=JSON.parse(root.localStorage?.getItem(KEY)||'[]');
   return Array.isArray(data)?data.filter(x=>x&&typeof x.id==='string'&&
    Object.hasOwn(DISPLAY,x.status)&&Object.hasOwn(LABEL,x.kind))
    .slice(-MAX):[];
  }catch{return volatile.slice();}
 }
 function persist(rows){
  volatile=rows.slice(-MAX);
  try{root.localStorage?.setItem(KEY,JSON.stringify(volatile));return true}
  catch{return false}
 }
 function entries(){
  return read().map(x=>Object.freeze({...x}));
 }
 function mark(id,status,reason=''){
  if(!Object.hasOwn(DISPLAY,status))return false;
  const rows=read();
  const entry=rows.find(x=>x.id===id);
  if(!entry)return false;
  if(['completed','cancelled'].includes(entry.status))return false;
  entry.status=status;
  entry.updatedAt=new Date().toISOString();
  entry.reason=reason.slice(0,100); // generic machine status only
  persist(rows);
  return true;
 }
 function listRecords(storage,key){
  try{
   const rows=JSON.parse(storage?.getItem(key)||'[]');
   return Array.isArray(rows)?rows.filter(x=>x&&typeof x.id==='string'):[];
  }catch{return []}
 }
 function noteRows(){
  try{
   const rows=root.SEYVEO_NOTES_API?.getNotes?.();
   return Array.isArray(rows)?rows.filter(x=>x&&typeof x.id==='string'):[];
  }catch{return []}
 }
 function dialog(kind){
  return root.document?.getElementById(kind==='calendar'?'calendarEventDialog':'noteReviewDialog');
 }
 function showAwaiting(attempt=0){
  if(!active||active.status==='done')return;
  const dlg=dialog(active.kind);
  if(dlg?.open){
   mark(active.id,'awaiting_confirmation');
   return;
  }
  if(attempt<7&&typeof root.setTimeout==='function'){
   root.setTimeout(()=>showAwaiting(attempt+1),100);
  }else if(attempt>=7){
   mark(active.id,'failed','Форма проверки не открылась');
   active=null;
  }
 }
 function begin(kind){
  if(!Object.hasOwn(LABEL,kind))return null;
  if(active){
   mark(active.id,'cancelled','Новый черновик заменил предыдущий');
   active=null;
  }
  const id='fj-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
  const item={id,kind,label:LABEL[kind],status:'prepared',
   createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),reason:''};
  persist([...read(),item]);
  active={id,kind,baseline:new Set(
   (kind==='calendar'?listRecords(root.localStorage,CALENDAR):noteRows()).map(x=>x.id)
  ),attempted:false,expected:null,status:'pending'};
  if(typeof root.setTimeout==='function')root.setTimeout(()=>showAwaiting(),0);
  return Object.freeze({...item});
 }
 function onSubmit(event){
  if(!active)return;
  if(event.target?.id===(active.kind==='calendar'?'calendarEventForm':'noteReviewForm')){
   const dlg=dialog(active.kind);
   if(!dlg?.open)return;
   if(active.kind==='calendar'){
    const title=root.document.getElementById('calendarEventName')?.value?.trim()
     .replace(/\s+/gu,' ').slice(0,140);
    const date=root.document.getElementById('calendarEventDate')?.value;
    const time=root.document.getElementById('calendarEventTime')?.value||'';
    active.expected={title,date,time};
   }else{
    if(dlg.dataset?.noteMode==='edit')return;
    const value=root.document.getElementById('noteReviewText')?.value;
    active.expected={text:typeof value==='string'?value.trim().slice(0,8000):null};
   }
   active.attempted=true;
   mark(active.id,'awaiting_confirmation');
   const id=active.id;
   if(typeof root.setTimeout==='function')root.setTimeout(()=>{
    if(!active||active.id!==id||!active.attempted)return;
    const status=root.document.getElementById(active.kind==='calendar'?'calendarEventStatus':'noteReviewStatus');
    const text=status?.textContent?.trim()||'';
    const visible=active.kind==='calendar'?!!text:status?.hidden===false&&!!text;
    if(visible&&dialog(active.kind)?.open)mark(id,'failed','Форма сообщила об ошибке');
   },30);
  }
 }
 function onSaved(kind){
  if(!active||active.kind!==kind||!active.attempted||!active.expected)return;
  const rows=kind==='calendar'?listRecords(root.localStorage,CALENDAR):noteRows();
  const candidates=rows.filter(x=>!active.baseline.has(x.id));
  const target=candidates.find(x=>kind==='calendar'
   ?x.title===active.expected.title&&x.date===active.expected.date&&
     (x.time||'')===active.expected.time
   :x.text===active.expected.text);
  if(!target)return;
  mark(active.id,'completed');
  active=null;
 }
 function onClose(kind){
  if(!active||active.kind!==kind)return;
  const record=read().find(x=>x.id===active.id);
  if(record&&record.status!=='completed'&&record.status!=='failed')
   mark(active.id,'cancelled','Форма закрыта без подтверждённого сохранения');
  active=null;
 }
 // If localhost page reloads before user confirmed, the form is gone.
 // Never show an orphaned draft as a still-pending task.
 const old=read();
 if(old.some(x=>x.status==='prepared'||x.status==='awaiting_confirmation'))
  persist(old.map(x=>['prepared','awaiting_confirmation'].includes(x.status)
   ?{...x,status:'cancelled',reason:'Сеанс был прерван',updatedAt:new Date().toISOString()}:x));
 function format(){
  const rows=entries().slice(-10).reverse();
  if(!rows.length)return 'Журнал действий Феликса пока пуст. Здесь появятся только попытки создания записей через Филю.';
  return 'Журнал действий Феликса · на этом устройстве:\n\n'+rows.map(x=>
   '• '+x.label+' — '+DISPLAY[x.status]+
   (x.reason?' ('+x.reason+')':'')
  ).join('\n')+'\n\nЖурнал не хранит содержание заметок. Сохранение означает, что запись подтверждена в локальном приложении, а не во внешнем сервисе.';
 }
 function handleAsk(event){
  if(event.target?.id!=='ask'||event.target.dataset?.composerMode==='notes')return;
  const q=root.document?.getElementById('question')?.value?.trim()||'';
  if(!/^(?:(?:филя|феликс)[,\s]+)?(?:покажи\s+)?журнал\s+действий[?.!]?$/iu.test(q))
   return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(root.SEYVEO_LOCAL_PENDING)return;
  const panel=root.document.getElementById('orbInlineReplyText');
  const overlay=root.document.getElementById('orbInlineReply');
  const stage=root.document.getElementById('stage');
  if(!panel||!overlay||!stage)return;
  panel.textContent=format();
  panel.scrollTop=0;
  overlay.hidden=false;
  stage.classList.add('has-inline-reply');
  const question=root.document.getElementById('question');
  question.value='';
  root.SEYVEO_LOCAL_CHAT_ACTIVE=true;
  question.dispatchEvent(new Event('input',{bubbles:true}));
  // No history writes or model calls: private local status only.
 }
 root.SEYVEO_FELIX_JOURNAL=Object.freeze({begin,entries,format});
 if(root.document?.addEventListener){
  root.document.addEventListener('submit',handleAsk,true);
  root.document.addEventListener('submit',onSubmit,true);
  for(const [kind,id] of [['calendar','calendarEventDialog'],['note','noteReviewDialog']]){
   const attach=()=>{
    const dlg=root.document.getElementById(id);
    dlg?.addEventListener('close',()=>onClose(kind));
   };
   if(root.document.readyState==='loading')
    root.document.addEventListener('DOMContentLoaded',attach,{once:true});
   else attach();
  }
 }
 if(typeof root.addEventListener==='function'){
  root.addEventListener('seyveo:calendar-changed',()=>onSaved('calendar'));
  root.addEventListener('seyveo:notes-changed',()=>onSaved('note'));
 }
})(typeof window!=='undefined'?window:globalThis);
