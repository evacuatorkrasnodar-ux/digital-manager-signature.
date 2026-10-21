/* SEYVEO · Direct local actions.
 * A clear explicit request is authorization for a REVERSIBLE on-device write.
 * The actual Tasks, Calendar and Notebook handlers remain the only writers.
 * External actions (payment, taxi, messages, services) are NOT dispatched here. */
(function(){
'use strict';
function execute(kind,draft){
 if(draft.status!=='ready')return {kind,status:'clarify',message:draft.message||'Уточните поручение.'};
 if(kind==='task'){
  const detail={items:[{title:draft.title,due:draft.date||''}]};
  window.dispatchEvent(new CustomEvent('seyveo:tasks-plan-batch',{detail}));
  const result=detail.result||{status:'error',message:'Раздел дел пока недоступен.'};
  if(result.status==='saved')return {kind,status:'saved',
   message:'Готово! Добавила в Дела: «'+draft.title+'»'+(draft.date?' · '+draft.date:'')+'.'+
   (draft.date?' Это срок в списке дел, не фоновый будильник.':'')};
  if(result.status==='already')return {kind,status:'already',message:'Это дело уже записано. Дубликат не создаю.'};
  return {kind,status:result.status||'error',message:result.message||'Не удалось добавить дело.'};
 }
 if(kind==='calendar'){
  const detail={status:'ready',title:draft.title,date:draft.date,time:draft.time||'',remindAtStart:draft.remindAtStart===true};
  window.dispatchEvent(new CustomEvent('seyveo:calendar-save-from-ask',{detail}));
  const result=detail.result||{status:'error',message:'Календарь пока недоступен.'};
  if(result.status==='saved')return {kind,status:'saved',message:draft.remindAtStart===true
   ?'Готово! Напоминание «'+draft.title+'» на '+draft.date+' в '+draft.time+' записано. Оно появится, если SEYVEO открыт.'
   :'Готово! Записала в календарь: «'+draft.title+'» · '+draft.date+(draft.time?' в '+draft.time:'')+'.'};
  if(result.status==='already')return {kind,status:'already',message:draft.remindAtStart===true?'Это напоминание уже есть в календаре.':'Это событие уже есть в календаре. Повторно не записываю.'};
  return {kind,status:result.status||'error',message:result.message||'Не удалось записать событие.'};
 }
 if(kind==='note'){
  const api=window.SEYVEO_NOTES_API;
  if(typeof api?.getNotes!=='function'||typeof api?.putNotes!=='function')
   return {kind,status:'error',message:'Блокнот сейчас недоступен.'};
  const value=String(draft.text||'').trim();
  if(!value||value.length>2500)return {kind,status:'clarify',message:'Что именно нужно запомнить?'};
  const old=api.getNotes();
  if(old[0]?.text===value && Date.now()-Number(old[0]?.createdAt||0)<60000)
   return {kind,status:'already',message:'Эта мысль уже записана в Блокнот.'};
  const record={id:String(Date.now())+'-'+Math.random().toString(36).slice(2),text:value,createdAt:Date.now()};
  if(!api.putNotes([record,...old]))return {kind,status:'error',message:'Не удалось сохранить запись. Проверьте память устройства.'};
  return {kind,status:'saved',message:'Готово! Записала в Блокнот.'};
 }
 return null;
}
/* Stable tool contract: a future AI may return a structured plan
 * {kind:'task'|'calendar'|'note', draft:{status:'ready', ...}}.
 * All writes still go through the SAME local validators/stores; the AI
 * never writes the browser data directly. External operations are excluded. */
function executePlan(plan){
 if(!plan||typeof plan!=='object'||Array.isArray(plan)||
    !['task','calendar','note'].includes(plan.kind))
  return {status:'unsupported',message:'Это действие пока не подключено.'};
 const {kind,draft}=plan;
 if(!draft||typeof draft!=='object'||draft.status!=='ready')
  return {kind,status:'invalid',message:'Недостаточно данных для выполнения.'};
 if(kind==='note'){
  if(typeof draft.text!=='string'||!draft.text.trim()||draft.text.length>2500)
   return {kind,status:'invalid',message:'Уточни, что сохранить в Блокнот.'};
 }else{
  if(typeof draft.title!=='string'||!draft.title.trim()||draft.title.length>140)
   return {kind,status:'invalid',message:'Уточни название поручения.'};
  if(typeof draft.date!=='string'||(draft.date&&!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)))
   return {kind,status:'invalid',message:'Уточни дату поручения.'};
  if(kind==='calendar'&&(
   !draft.date||typeof draft.time!=='string'||
   draft.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)
  ))return {kind,status:'invalid',message:'Уточни день и время события.'};
 }
 return execute(kind,draft);
}
/* Short-lived unfinished conversational intent. The same typed and voice
 * entry point uses this. Session-only memory; no second calendar store. */
const CONTEXT_KEY='seyveo-pending-reminder-v1';
let pendingReminder=null;
try{
 const item=JSON.parse(sessionStorage.getItem(CONTEXT_KEY)||'null');
 if(item&&typeof item.title==='string'&&Date.now()-item.at<20*60000)pendingReminder=item;
}catch{}
function rememberReminder(value){
 pendingReminder=value?{title:value.title,date:value.date||'',time:value.time||'',at:Date.now()}:null;
 try{
  if(pendingReminder)sessionStorage.setItem(CONTEXT_KEY,JSON.stringify(pendingReminder));
  else sessionStorage.removeItem(CONTEXT_KEY);
 }catch{}
}
function processReminder(phrase){
 const grammar=window.SEYVEO_REMINDER_NL;
 if(!grammar)return null;
 const fresh=grammar.fromPhrase(phrase);
 const response=fresh||grammar.followup(phrase,pendingReminder);
 if(!response){
  if(pendingReminder)rememberReminder(null);
  return null;
 }
 if(response.status==='cancelled'){
  rememberReminder(null);return response;
 }
 if(response.status==='clarify'){
  if(response.title)rememberReminder(response);
  else rememberReminder(null);
  return response;
 }
 if(response.status==='ready'){
  const result=executePlan({kind:'calendar',draft:{
   status:'ready',title:response.title,date:response.date,
   time:response.time,remindAtStart:true
  }});
  if(result.status==='saved'||result.status==='already')rememberReminder(null);
  else rememberReminder(response);
  return result;
 }
 return response;
}
function handle(raw){
 const reminder=processReminder(String(raw||'').trim());
 if(reminder)return reminder;
 const phrase=typeof raw==='string'?raw.trim():'';
 if(!phrase)return null;
 const sequence=[
  ['task',window.SEYVEO_TASK_NL],
  ['calendar',window.SEYVEO_CALENDAR_NL],
  ['note',window.SEYVEO_NOTE_NL]
 ];
 for(const [kind,parser] of sequence){
  const plan=typeof parser==='function'?parser(phrase):null;
  if(plan)return execute(kind,plan);
 }
 return null;
}
window.SEYVEO_LOCAL_ACTIONS=Object.freeze({handle,executePlan});
if(typeof module!=='undefined'&&module.exports)module.exports={handle,execute,executePlan};
})();