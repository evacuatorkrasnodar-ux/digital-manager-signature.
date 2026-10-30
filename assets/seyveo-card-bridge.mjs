import './seyveo-developer-flow.mjs';
import './seyveo-business-mail.mjs';
import './seyveo-technology-signatures.mjs';
import './seyveo-mail-cabinet.mjs';
import './seyveo-action-history.mjs';
import './seyveo-adaptive-orb.mjs';
import './seyveo-card-copy-ui.mjs';
import {createCard,transition,visible,ingest} from './seyveo-card-engine.mjs';
import {validateMailReceipt} from './seyveo-mail-receipt.mjs';
// Main UI integration layer. Opt-in event API; legacy home rendering is untouched.
const cards=new Map(),trace=[];const scope={accountId:'demo-account',workspaceId:'demo-workspace'};
function log(type,detail){trace.push({at:new Date().toISOString(),type,detail});if(trace.length>100)trace.shift();}
function notify(){window.dispatchEvent(new CustomEvent('seyveo:cards-changed',{detail:{count:visible([...cards.values()]).length}}));}
function receive(event,context=scope){
 const card=createCard(event,context);
 if(cards.has(card.dedupeKey)){log('duplicate',card.eventId);return cards.get(card.dedupeKey);}
 const shown=transition(card,'shown');cards.set(shown.dedupeKey,shown);log('received',{eventId:shown.eventId,type:shown.cardType});notify();return shown;
}
function advance(key,next,meta={}){
 const card=cards.get(key);if(!card)throw new Error('Unknown card');
 const n=transition(card,next,meta);cards.set(key,n);log('transition',{eventId:n.eventId,from:card.status,to:next});notify();return n;
}
function list(){return visible([...cards.values()]).sort((a,b)=>a.priority-b.priority||a.createdAt.localeCompare(b.createdAt));}
function openChat(key){
 const card=cards.get(key);
 if(!card)throw new Error('Unknown card');
 if(!visible([card]).length)throw new Error('Card is not active');
 log('chat-opened',{eventId:card.eventId,status:card.status});
 // Navigation is not execution; keep the card in the queue.
 return card;
}
function complete(key,{acknowledged=false,reason=''}={}){
 if(acknowledged!==true)throw new Error('Verified acknowledgement required');
 let card=cards.get(key);
 if(!card)throw new Error('Unknown card');
 if(card.status==='shown'||card.status==='failed')card=advance(key,'action_pending');
 if(card.status==='action_pending')card=advance(key,'executing');
 if(card.status!=='executing')throw new Error('Card cannot be completed from '+card.status);
 card=advance(key,'succeeded',{acknowledged:true,reason});
 return advance(key,'archived',{reason:'Confirmed completion'});
}
function confirmSentMail(key,receipt){
 const verified=validateMailReceipt(receipt);
 const card=complete(key,{acknowledged:true,reason:'Mail provider: '+verified.provider+' / '+verified.messageId});
 log('mail-provider-confirmed',{eventId:card.eventId,provider:verified.provider,messageId:verified.messageId,sentAt:verified.sentAt});
 return card;
}
function deferred(){return [...cards.values()].filter(c=>c.status==='deferred');}
function archive(){return [...cards.values()].filter(c=>['archived','succeeded','canceled','expired'].includes(c.status));}
function postpone(key){return advance(key,'deferred',{reason:'User chose Later'});}
function resume(key){return advance(key,'shown',{reason:'User resumed deferred card'});}
// Stable order for Quiet Cinema's existing preview items, without changing geometry.
function orderPreview(items){
 // Explicit priority wins; stable family order breaks ties.
 // No guessing urgency from free-text, names, or sensitive medical content.
 const rank={work:0,mail:1,contract:2};
 const level={urgent:0,important:1,normal:2};
 const score=item=>Number.isInteger(item.priority)&&item.priority>=0&&item.priority<=3
   ?item.priority:(Object.hasOwn(level,item.priority)?level[item.priority]:2);
 return items.map((item,index)=>({item,index})).sort((a,b)=>
   score(a.item)-score(b.item)||
   (rank[a.item.kind]??3)-(rank[b.item.kind]??3)||
   a.index-b.index).map(entry=>entry.item);
}
function history(){return [...cards.values()].flatMap(card=>card.history.map(step=>({eventId:card.eventId,cardType:card.cardType,title:card.title,from:step.from,to:step.to,at:step.at,reason:step.reason}))).sort((a,b)=>b.at.localeCompare(a.at));}
function inspect(){return {cards:[...cards.values()].map(c=>({id:c.id,eventId:c.eventId,type:c.cardType,status:c.status,priority:c.priority})),trace:trace.slice()};}
// The bridge never sends messages or signs documents. It only records the
// outcome AFTER an external integration or explicit local demo confirms it.
Object.defineProperty(window,'SEYVEO_CARD_LIFECYCLE',{value:Object.freeze({receive,advance,list,deferred,archive,postpone,resume,openChat,complete,confirmSentMail,orderPreview,history,inspect}),writable:false,configurable:false});
log('ready','Card Engine bridge loaded; legacy cards untouched');

// Non-invasive adapter for the existing Quiet Cinema demo mail card.
// Tracks the confirmed demo step only; no network delivery is implied.
let demoMailCounter=0;
document.addEventListener('click',event=>{
 const button=event.target?.closest?.('button');
 const field=button?.closest?.('.lm-field');
 if(!field||field.dataset.lmSubject!=='mail')return;
 const label=button.textContent.trim();
 if(!label.includes('Завершить пример')||!label.includes('демо'))return;
 const seq=++demoMailCounter;
 try{
  const card=receive({eventId:'preview-mail-'+seq,source:'quiet-cinema-demo',accountId:'demo-account',workspaceId:'demo-workspace',sourceRecordId:'preview-mail-'+seq,eventType:'email_received',title:'Учебное письмо Андрея',contextText:'Демонстрация отправки',priority:2});
  const pending=advance(card.dedupeKey,'action_pending');
  const running=advance(pending.dedupeKey,'executing');
  // This only acknowledges a local simulation, never a message delivered to a recipient.
  const completed=advance(running.dedupeKey,'succeeded',{acknowledged:true,reason:'LOCAL DEMO SIMULATION ONLY'});
  advance(completed.dedupeKey,'archived',{reason:'Local demo step closed'});
 }catch(error){log('demo-mail-error',String(error));}
},true);

/* Quiet Cinema document and workplace-message demo completion.
 * Recording only: the existing scene remains the sole UI owner.
 * A local simulated outcome is NOT a signed document or a delivered chat.
 */
let demoOtherCounter=0;
function recordDemoCompletion(eventType,title){
 const seq=++demoOtherCounter;
 const recordId='preview-'+eventType+'-'+seq;
 const first=receive({
  eventId:recordId,source:'quiet-cinema-demo',
  accountId:'demo-account',workspaceId:'demo-workspace',
  sourceRecordId:recordId,eventType,title,
  contextText:'Учебное действие выполнено только в интерфейсе',
  priority:2
 });
 let current=first;
 for(const state of ['action_pending','executing']){
  current=advance(current.dedupeKey,state);
 }
 current=advance(current.dedupeKey,'succeeded',{
  acknowledged:true,reason:'LOCAL DEMO SIMULATION ONLY'
 });
 advance(current.dedupeKey,'archived',{reason:'Local preview handled'});
}
document.addEventListener('click',event=>{
 const button=event.target?.closest?.('button');
 const field=button?.closest?.('.lm-field');
 if(!field||field.dataset.lmMode!=='preview')return;
 const subject=field.dataset.lmSubject;
 const label=button.textContent.trim();
 try{
  if(subject==='work'&&label==='Отправить · демо'){
   // The original handler rejects an empty draft; do not claim success.
   const draft=field.querySelector('.lm-mail-edit-input')?.value?.trim();
   if(!draft)return;
   recordDemoCompletion('message_received','Учебный ответ сотруднику');
  }
  if(subject==='contract'&&label==='Исполнить'){
   // Only the explicit last click of the existing document preview counts.
   const done=[...field.querySelectorAll('.lm-document-note')]
    .some(node=>node.textContent.includes('Настоящий договор не изменён'));
   if(done)recordDemoCompletion('document_received','Учебное согласование документа');
  }
 }catch(error){log('demo-card-error',String(error));}
},true);

/* Business task -> shared lifecycle. No second Home card and no external send.
   The source remains the existing local demo task store. */
const LOCAL_TASK_STORE='seyveo-business-command-tasks-demo-v1';
const syncedTaskKeys=new Map();
function syncBusinessTaskCards(){
 let tasks;
 try{tasks=JSON.parse(localStorage.getItem(LOCAL_TASK_STORE)||'[]');}catch{return;}
 if(!Array.isArray(tasks))return;
 const active=new Set();
 for(const task of tasks.slice(0,200)){
  if(!task||typeof task.id!=='string'||!task.id||typeof task.text!=='string'||!task.text.trim())continue;
  const id=task.id.slice(0,128);active.add(id);
  let key=syncedTaskKeys.get(id);
  if(!key&&!task.done){
   try{
    const card=receive({eventId:'local-task:'+id,source:'business-command-local-demo',accountId:'demo-account',workspaceId:'demo-workspace',
     sourceRecordId:id,eventType:'task_assigned',title:task.text.slice(0,140),
     contextText:task.text.slice(0,1200),actorLabel:String(task.assigneeId||'').slice(0,80),priority:2});
    key=card.dedupeKey;syncedTaskKeys.set(id,key);
    log('local-business-task-linked',{taskId:id,eventId:card.eventId});
   }catch(e){log('local-task-link-error',String(e));}
  }
  if(task.done&&key){
   try{const card=cards.get(key);if(card&&visible([card]).length)advance(key,'canceled',{reason:'Task marked completed in source (not externally verified)'});}
   catch(e){log('local-task-close-error',String(e));}
  }
 }
 for(const [id,key] of syncedTaskKeys)if(!active.has(id)){
  try{const card=cards.get(key);if(card&&visible([card]).length)advance(key,'canceled',{reason:'Task removed from local source'});}
  catch(e){log('local-task-remove-error',String(e));}
  syncedTaskKeys.delete(id);
 }
}
window.addEventListener('seyveo:manager-tasks-updated',syncBusinessTaskCards);
window.addEventListener('storage',e=>{if(e.key===LOCAL_TASK_STORE)syncBusinessTaskCards();});
queueMicrotask(syncBusinessTaskCards);

/* Local-only employee message and peer-recognition adapters.
   These are developer lifecycle records, not extra Home cards.
   Do not treat an emoji as a manager-approved performance assessment. */
const LOCAL_CHAT_STORE='seyveo-business-command-chat-demo-v1';
const LOCAL_RECOGNITION_STORE='seyveo-peer-recognition-demo-v1';
const linkedLocalEvents=new Set();
function readLocalArray(key){
 try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data:[];}
 catch{return [];}
}
function linkLocalEvent(source,id,eventType,title,summary,actor){
 const recordId=String(id||'').slice(0,128);
 if(!recordId||linkedLocalEvents.has(source+':'+recordId))return;
 try{
  receive({eventId:source+':'+recordId,source,accountId:'demo-account',
   workspaceId:'demo-workspace',sourceRecordId:recordId,eventType,
   title:String(title||'Учебное событие').slice(0,140),
   contextText:String(summary||'').slice(0,1200),actorLabel:String(actor||'').slice(0,80),
   priority:2});
  linkedLocalEvents.add(source+':'+recordId);
 }catch(error){log('local-event-adapter-error',String(error));}
}
function syncLocalConversations(){
 const chat=readLocalArray(LOCAL_CHAT_STORE);
 chat.slice(-200).forEach((message,index)=>{
  if(!message||typeof message.text!=='string'||!message.text.trim())return;
  // Only received employee messages; manager's outgoing and special service
  // messages are excluded so the assistant doesn't generate false inbox alerts.
  if(message.role!=='elena'&&message.role!=='employee')return;
  const id=[message.room||'unknown',message.at||index,index].join(':');
  linkLocalEvent('local-work-chat',id,'message_received',
   'Сообщение в рабочем чате',message.text,message.role);
 });
 const rewards=readLocalArray(LOCAL_RECOGNITION_STORE);
 rewards.slice(-100).forEach((reward,index)=>{
  if(!reward||typeof reward.id!=='string'||!reward.id)return;
  linkLocalEvent('local-peer-recognition',reward.id,'employee_update',
   'Благодарность сотруднику · демо',
   'Знак: '+String(reward.kind||'').slice(0,60)+'; сотрудник: '+String(reward.to||'').slice(0,80),
   reward.from);
 });
}
window.addEventListener('seyveo:recognition-updated',syncLocalConversations);
window.addEventListener('seyveo:work-chat-updated',syncLocalConversations);
window.addEventListener('storage',event=>{
 if(event.key===LOCAL_CHAT_STORE||event.key===LOCAL_RECOGNITION_STORE)syncLocalConversations();
});
queueMicrotask(syncLocalConversations);
