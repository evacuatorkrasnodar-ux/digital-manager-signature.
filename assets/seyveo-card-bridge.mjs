import './seyveo-card-copy-ui.mjs';
import {createCard,transition,visible,ingest} from './seyveo-card-engine.mjs';
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
function inspect(){return {cards:[...cards.values()].map(c=>({id:c.id,eventId:c.eventId,type:c.cardType,status:c.status,priority:c.priority})),trace:trace.slice()};}
// The bridge never sends messages or signs documents. It only records the
// outcome AFTER an external integration or explicit local demo confirms it.
Object.defineProperty(window,'SEYVEO_CARD_LIFECYCLE',{value:Object.freeze({receive,advance,list,deferred,archive,postpone,resume,orderPreview,inspect}),writable:false,configurable:false});
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
