/* SEYVEO · Direct local actions.
 * A clear explicit request is authorization for a REVERSIBLE on-device write.
 * The actual Tasks, Calendar and Notebook handlers remain the only writers.
 * External actions (payment, taxi, messages, services) are NOT dispatched here. */
(function(){
'use strict';
function execute(kind,draft){
 if(draft.status!=='ready')return {kind,status:'clarify',message:draft.message||'Уточните поручение.'};
 if(kind==='task'){
  const detail={items:[{title:draft.title,due:draft.date||'',time:draft.time||''}]};
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
  if(kind==='task'&&draft.time!==undefined&&(typeof draft.time!=='string'||(draft.time&&(!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)||!draft.date))))
   return {kind,status:'invalid',message:'Уточни дату и время дела.'};
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

function previewAction(raw){
 if(typeof raw!=='string'||raw.length>700)return null;
 const phrase=raw.trim().replace(/\s+/g,' ').replace(/^(?:сэйва|сейва)(?=[,!.:\s])/i,'Сэйви');
 const normalized=phrase.replace(/^(?:(?:сэйви|сейви|сэйва|сейва|сэй|сей|seyveo)[,!.:\s]+)?(?:пожалуйста\s+)?(?:создай|сделай|добавь|поставь|запиши)\s+(?:мне\s+)?напоминание(?=\s|$)/i,'Напомни мне');
 const reminder=window.SEYVEO_REMINDER_NL?.fromPhrase(normalized);
 if(reminder?.status==='ready')return{kind:'calendar',source:'reminder',draft:{title:reminder.title,date:reminder.date,time:reminder.time,remindAtStart:true}};
 const task=window.SEYVEO_TASK_NL?.(phrase);
 if(task?.status==='ready')return{kind:'task',source:'task',draft:{title:task.title,date:task.date||'',time:task.time||''}};
 const event=window.SEYVEO_CALENDAR_NL?.(phrase);
 if(event?.status==='ready')return{kind:'calendar',source:'event',draft:{title:event.title.trim().replace(/\s+/g,' '),date:event.date,time:event.time||'',remindAtStart:false}};
 return null;
}
window.SEYVEO_LOCAL_ACTIONS=Object.freeze({handle,executePlan,previewAction,clearPendingReminder:()=>rememberReminder(null)});

if(typeof module!=='undefined'&&module.exports)module.exports={handle,execute,executePlan};
})();

/* Visible local execution: one user intent, real editor inputs, owner save,
 * read-back verification. Never announce success before the original store
 * confirms it. No synthetic background notification. */
(function(){
'use strict';
const HANDOFF='seyveo-live-action-handoff-v1',TASKS='seyveo-personal-tasks-v1',CAL='seyveo-calendar-events-v1';
const $=id=>document.getElementById(id);
const delay=ms=>new Promise(done=>window.setTimeout(done,ms));
const validTime=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''));
function validDate(v){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return false;
 const d=new Date(v+'T12:00:00');
 return !Number.isNaN(d.getTime())&&d.getFullYear()===Number(v.slice(0,4))&&d.getMonth()+1===Number(v.slice(5,7))&&d.getDate()===Number(v.slice(8,10));
}
function rows(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
let job=null,progress=null,receipt=null;
function styles(){
 if($('svLiveStyles'))return;
 const el=document.createElement('style');el.id='svLiveStyles';el.textContent="\n#svLiveProgress{position:fixed;z-index:2147483000;left:50%;bottom:calc(100px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(375px,calc(100vw - 24px));box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:56px;padding:11px 12px;background:rgba(251,252,254,.98);border:1px solid rgba(76,108,146,.15);box-shadow:0 10px 34px rgba(19,34,53,.16);border-radius:17px;color:#252A32;font:500 13px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif}\n#svLiveProgress .sv-la-mark{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;border-radius:50%;background:#EAF0FA;color:#5479AD;font-size:19px;animation:svLivePulse 1.2s ease-in-out infinite}\n#svLiveProgress span.sv-la-message{flex:1;min-width:0}\n#svLiveProgress button{min-height:40px;padding:8px 10px;border:0;border-radius:11px;background:#EDEFF3;color:#495361;font:550 12px -apple-system,system-ui,sans-serif}\n#svLiveReceipt{position:fixed;z-index:2147483000;left:50%;bottom:calc(106px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);box-sizing:border-box;width:min(375px,calc(100vw - 24px));padding:15px 17px;border-radius:19px;border:1px solid rgba(76,108,146,.13);background:#FBFCFE;box-shadow:0 12px 36px rgba(19,34,53,.16);color:#20252D;font:450 14px/1.45 -apple-system,system-ui,sans-serif}\n#svLiveReceipt .sv-la-top{display:flex;justify-content:space-between;align-items:center;color:#4B76A6;font-size:12px;font-weight:600}\n#svLiveReceipt strong{display:block;font-weight:600;font-size:16px;margin:6px 0 2px}\n#svLiveReceipt p{margin:0 0 13px;color:#6B7380;font-size:12.5px}\n#svLiveReceipt button{border:0;border-radius:11px;padding:10px 16px;background:#EAF1FA;color:#366B9F;font:600 13px -apple-system,system-ui,sans-serif;min-height:40px}\n#svLiveReceipt .sv-la-x{padding:0 6px;background:transparent;color:#89919B;font-size:21px;min-height:30px}\n.sv-live-focus{outline:2px solid rgba(81,131,196,.60)!important;outline-offset:3px;border-radius:8px!important;transition:outline-color .2s}\n@keyframes svLivePulse{50%{opacity:.55;transform:scale(.91)}}\n:root[data-theme=dark] #svLiveProgress,:root[data-theme=dark] #svLiveReceipt{background:rgba(42,44,51,.98);color:#F4F5F7;border-color:rgba(255,255,255,.10)}\n:root[data-theme=dark] #svLiveProgress button{background:#444650;color:#F3F4F8}\n:root[data-theme=dark] #svLiveReceipt p{color:#B8BEC8}\n@media(prefers-reduced-motion:reduce){#svLiveProgress .sv-la-mark{animation:none}}\n";document.head.append(el);
}
function panel(text){
 styles();
 if(!progress){
  progress=document.createElement('div');progress.id='svLiveProgress';progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');
  const mark=document.createElement('span');mark.className='sv-la-mark';mark.textContent='✧';
  const msg=document.createElement('span');msg.className='sv-la-message';
  const stop=document.createElement('button');stop.type='button';stop.textContent='Остановить';stop.addEventListener('click',cancel);
  progress.append(mark,msg,stop);
 }
 const target=job?.dialog?.open?job.dialog:document.body;
 if(progress.parentNode!==target)target.append(progress);
 progress.querySelector('.sv-la-message').textContent=text;
 progress.querySelector('button').hidden=!!job?.committing;
}
function clearPanel(){progress?.remove();progress=null}
function cancel(){
 if(!job||job.committing)return;
 job.cancelled=true;
 job?.focused?.classList.remove('sv-live-focus');
 if(job.dialog?.open)job.dialog.close();
 clearPanel();job=null;
 const home=$('navHome');if(home)home.click();else location.hash='#home';
}
function check(j){if(j.cancelled||job!==j)throw new Error('Остановлено')}
async function pause(j,ms){await delay(ms);check(j)}
function focus(j,node){
 j.focused?.classList.remove('sv-live-focus');
 j.focused=node;
 node?.classList.add('sv-live-focus');
}
function set(field,value){
 if(!field)throw new Error('Поле не найдено');
 field.value=value;
 field.dispatchEvent(new Event('input',{bubbles:true}));
 field.dispatchEvent(new Event('change',{bubbles:true}));
}
function dateText(v){
 if(!validDate(v))return 'Без срока';
 return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date(v+'T12:00:00'));
}
function verify(j){
 const d=j.plan.draft;
 if(!d||typeof d.title!=='string'||!d.title.trim()||d.title.length>140||
  (d.date&&!validDate(d.date))||(d.time&&(!validTime(d.time)||!d.date))||
  (j.plan.kind==='calendar'&&!validDate(d.date)))throw new Error('Уточни название, дату или время');
}
async function taskFlow(j){
 const d=j.plan.draft;
 panel('Сэйви открывает «Мои дела»');
 if(window.SEYVEO_UNIFIED_TASKS?.openPersonal)window.SEYVEO_UNIFIED_TASKS.openPersonal();
 else location.hash='#tasks';
 await pause(j,430);
 const button=$('personalAddTasks');
 if(!button)throw new Error('Редактор дел недоступен');
 button.click();
 await pause(j,300);
 j.dialog=$('personalTaskDialog');
 if(!j.dialog?.open)throw new Error('Не удалось открыть новое дело');
 panel('Сэйви заполняет название');
 focus(j,$('personalTaskTitle'));set($('personalTaskTitle'),d.title);
 await pause(j,340);
 if(d.date){
  panel('Сэйви выбирает дату');
  focus(j,$('personalTaskDue'));set($('personalTaskDue'),d.date);
  await pause(j,430);
 }
 if(d.time){
  const time=$('personalTaskTime');
  if(!time)throw new Error('Поле времени не подключено');
  panel('Сэйви устанавливает время · '+d.time);
  focus(j,time.closest('.sv-task-time-row')||time);await pause(j,390);
  set(time,d.time);
  j.dialog.dispatchEvent(new Event('sv-task-time-sync'));
  await pause(j,270);
 }
 focus(j,null);
 const before=rows(TASKS);
 if(before.some(x=>!x.done&&x.title.trim().toLocaleLowerCase('ru-RU')===d.title.trim().toLocaleLowerCase('ru-RU')&&x.due===(d.date||'')&&(x.time||'')===(d.time||'')))throw new Error('Такое дело уже есть. Повторно не создаю.');
 const oldIds=new Set(before.map(x=>x.id));
 j.committing=true;panel('Сохраняю дело и проверяю запись');
 const form=$('personalTaskForm');
 if(!form?.checkValidity())throw new Error('Проверьте обязательные поля');
 form.requestSubmit();
 await delay(160);
 const result=rows(TASKS).find(x=>!oldIds.has(x.id)&&x.title===d.title&&x.due===(d.date||'')&&x.time===(d.time||''));
 if(!result||j.dialog?.open)throw new Error('Сохранение дела не подтверждено');
 return result;
}
async function calendarFlow(j){
 const d=j.plan.draft;
 panel('Сэйви открывает календарь');
 location.hash='#calendar';
 await pause(j,390);
 window.dispatchEvent(new CustomEvent('seyveo:calendar-from-ask',{detail:{status:'ready',title:'',date:d.date,time:''}}));
 await pause(j,340);
 j.dialog=$('calendarEventDialog');
 if(!j.dialog?.open)throw new Error('Не удалось открыть редактор календаря');
 panel('Сэйви записывает событие');
 focus(j,$('calendarEventName'));set($('calendarEventName'),d.title);
 await pause(j,350);
 panel('Сэйви выбирает дату');
 focus(j,$('calendarEventDate'));set($('calendarEventDate'),d.date);
 await pause(j,400);
 if(d.time){
  panel('Сэйви устанавливает время · '+d.time);
  focus(j,$('calendarEventTime'));await pause(j,360);
  set($('calendarEventTime'),d.time);await pause(j,220);
 }
 if(d.remindAtStart){
  const radio=document.querySelector('#calendarEventForm input[name="calendarReminder"][value="-1"]');
  if(!radio)throw new Error('Выбор напоминания недоступен');
  radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));
  await pause(j,220);
 }
 focus(j,null);
 j.committing=true;panel('Сохраняю и проверяю календарь');
 const detail={status:'ready',title:d.title,date:d.date,time:d.time||'',remindAtStart:!!d.remindAtStart};
 window.dispatchEvent(new CustomEvent('seyveo:calendar-save-from-ask',{detail}));
 if(detail.result?.status!=='saved')throw new Error(detail.result?.message||'Сохранение не подтверждено');
 const result=rows(CAL).find(x=>x.title===d.title&&x.date===d.date&&x.time===(d.time||'')&&(!d.remindAtStart||x.remind===-1));
 if(!result)throw new Error('Событие не найдено после сохранения');
 if(j.dialog?.open)j.dialog.close();
 return result;
}
function showReceipt(j,result){
 styles();receipt?.remove();
 receipt=document.createElement('aside');receipt.id='svLiveReceipt';receipt.setAttribute('role','status');
 const top=document.createElement('div');top.className='sv-la-top';
 const label=document.createElement('span');label.textContent='✧ Сэйви · Готово, проверь';
 const close=document.createElement('button');close.type='button';close.className='sv-la-x';close.textContent='×';close.setAttribute('aria-label','Закрыть карточку');close.addEventListener('click',()=>{receipt?.remove();receipt=null});
 top.append(label,close);
 const title=document.createElement('strong');title.textContent=result.title;
 const when=document.createElement('p');when.textContent=dateText(j.plan.draft.date)+(j.plan.draft.time?' · '+j.plan.draft.time:'')+(j.plan.draft.remindAtStart?' · сигнал в приложении, пока оно открыто':'');
 const view=document.createElement('button');view.type='button';view.textContent='Проверить';
 view.addEventListener('click',()=>{
  receipt?.remove();receipt=null;
  if(j.plan.kind==='task'){window.SEYVEO_UNIFIED_TASKS?.openPersonal?.();location.hash='#tasks'}
  else{location.hash='#calendar';window.dispatchEvent(new CustomEvent('seyveo:calendar-focus-date',{detail:{date:j.plan.draft.date}}))}
 });
 receipt.append(top,title,when,view);
 document.body.append(receipt);
 window.SEYVEO_LOCAL_ACTIONS?.clearPendingReminder?.();
 window.dispatchEvent(new CustomEvent('seyveo:live-action-finished',{detail:{kind:j.plan.kind,id:result.id,status:'saved'}}));
}
async function run(j){
 try{
  check(j);verify(j);
  if(document.querySelector('dialog[open]'))throw new Error('Сначала закрой открытое окно');
  const record=j.plan.kind==='task'?await taskFlow(j):await calendarFlow(j);
  check(j);focus(j,null);clearPanel();job=null;
  if($('navHome'))$('navHome').click();else location.hash='#home';
  await delay(380);showReceipt(j,record);
 }catch(e){
  if(j.cancelled){clearPanel();return}
  focus(j,null);j.committing=false;
  const error=String(e?.message||'Ошибка сохранения');
  if(j.dialog?.open){
   const field=$(j.plan.kind==='task'?'personalTaskStatus':'calendarEventStatus');
   if(field)field.textContent=error;
  }
  panel('Не удалось: '+error);
  const ref=progress;
  job=null;
  window.setTimeout(()=>{if(progress===ref)clearPanel()},5500);
 }
}
function startPlan(plan){
 if(!plan||!['task','calendar'].includes(plan.kind))return false;
 if(job)return true;
 if(!$('personalTaskForm')||!$('calendarEventForm')){
  if(!location.pathname.endsWith('/sayvi-chat-new.html'))return false;
  try{sessionStorage.setItem(HANDOFF,JSON.stringify({plan,at:Date.now()}))}catch{return false}
  location.assign('./index.html#home');return true;
 }
 receipt?.remove();receipt=null;
 job={plan,cancelled:false,committing:false,dialog:null,focused:null};
 const current=job;
 window.setTimeout(()=>run(current),180);
 return true;
}
function start(raw){return startPlan(window.SEYVEO_LOCAL_ACTIONS?.previewAction?.(raw))}
window.SEYVEO_LIVE_ACTION=Object.freeze({start,startPlan,cancel,isBusy:()=>!!job});
if($('personalTaskForm')&&$('calendarEventForm')){
 let pending=null;
 try{pending=JSON.parse(sessionStorage.getItem(HANDOFF)||'null');sessionStorage.removeItem(HANDOFF)}catch{}
 if(pending?.plan&&Date.now()-Number(pending.at)<20000)window.setTimeout(()=>startPlan(pending.plan),600);
}
})();

// Russian keyboard-layout helper for typed messages.
window.SEYVEO_RU_LAYOUT=function(input){
 const en='qwertyuiop[]asdfghjkl;\'zxcvbnm,.';
 const ru='йцукенгшщзхъфывапролджэячсмитьбю';
 const raw=String(input||'');
 if(!/[a-z]{3}/i.test(raw)||/https?:|@|www\./i.test(raw))return raw;
 const converted=Array.from(raw,c=>{const i=en.indexOf(c.toLowerCase());return i<0?c:c===c.toUpperCase()?ru[i].toUpperCase():ru[i]}).join('');
 return /(?:привет|брат|давай|сэйви|сейви|помоги|напиши|что|как|меня|спасибо|дальше|понял)/i.test(converted)?converted:raw;
};
