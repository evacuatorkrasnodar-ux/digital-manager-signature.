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
  const detail={status:'ready',title:draft.title,date:draft.date,time:draft.time||''};
  window.dispatchEvent(new CustomEvent('seyveo:calendar-save-from-ask',{detail}));
  const result=detail.result||{status:'error',message:'Календарь пока недоступен.'};
  if(result.status==='saved')return {kind,status:'saved',message:'Готово! Записала в календарь: «'+draft.title+'» · '+draft.date+(draft.time?' в '+draft.time:'')+'.'};
  if(result.status==='already')return {kind,status:'already',message:'Это событие уже есть в календаре. Повторно не записываю.'};
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
function handle(raw){
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
window.SEYVEO_LOCAL_ACTIONS=Object.freeze({handle});
if(typeof module!=='undefined'&&module.exports)module.exports={handle,execute};
})();