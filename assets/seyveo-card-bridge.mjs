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
function inspect(){return {cards:list().map(c=>({id:c.id,eventId:c.eventId,type:c.cardType,status:c.status,priority:c.priority})),trace:trace.slice()};}
Object.defineProperty(window,'SEYVEO_CARD_LIFECYCLE',{value:Object.freeze({receive,advance,list,inspect}),writable:false,configurable:false});
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
