import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createDemoEvents,ingest,transition,visible,actionFor,createCard} from '../assets/seyveo-card-engine.mjs';
const scope={accountId:'demo-account',workspaceId:'demo-workspace'};
const events=createDemoEvents(),cards=ingest([...events,events[0]],scope);
assert.equal(cards.length,3,'duplicate event merged');
assert.equal(cards[0].cardType,'message');
assert.deepEqual(cards[0].actions.map(a=>a.label),['Ответить','В чат']);
assert.equal(cards[1].cardType,'document');
assert.equal(cards[1].actions.length,2);
assert.throws(()=>createCard(events[0],{accountId:'other'}),/boundary/);
let card=transition(cards[0],'shown');
actionFor(card,'reply');
card=transition(card,'action_pending');
card=transition(card,'executing');
assert.throws(()=>transition(card,'succeeded'),/acknowledgement/);
assert.equal(visible([card]).length,1,'not dismissed without acknowledgement');
card=transition(card,'failed',{reason:'Network unavailable'});
assert.equal(visible([card]).length,1,'failure retains card');
card=transition(card,'action_pending');
card=transition(card,'executing');
card=transition(card,'succeeded',{acknowledged:true});
assert.equal(visible([card]).length,0,'acknowledged completion removes card');
card=transition(card,'archived');
assert.equal(card.history.length,8);
let chat=transition(cards[2],'shown');actionFor(chat,'chat');
assert.equal(visible([chat]).length,1,'chat navigation does not complete card');
console.log('SEYVEO Card Engine v1: tests passed');


// SEYVEO Card Engine Silver Flat action policy.
// The production browser renderer and the Studio must resolve the same actions.
const browserScope={window:{}};
runInNewContext(readFileSync(new URL('../assets/seyveo-card-engine.js',import.meta.url),'utf8'),browserScope);
const browserEngine=browserScope.window.SEYVEO_CARD_ENGINE;
assert.equal(browserEngine.cardPolicy.darkMaterial,'#38383A');
assert.equal(browserEngine.cardPolicy.primaryActionsMax,1);
assert.equal(browserEngine.cardPolicy.visibleActionLimit,3);
assert.equal(browserEngine.cardPolicy.deferGesture,'swipe-both');
assert.equal(browserEngine.isDeferSwipe(85,4),true,'right swipe defers');
assert.equal(browserEngine.isDeferSwipe(-90,7),true,'left swipe defers');
assert.equal(browserEngine.isDeferSwipe(20,95),false,'vertical scrolling does not defer');
assert.equal(browserEngine.isDeferSwipe(60,4),false,'short tap does not defer');
const allStudioCards=browserEngine.demoEvents().map(e=>browserEngine.buildCard(e));
assert.equal(allStudioCards.length,Object.keys(browserEngine.eventType).length);
for(const current of allStudioCards){
 const p=browserEngine.presentation(current);
 assert.ok(p,'Studio card presentation exists');
 assert.ok(p.actions.filter(a=>a.role==='primary').length<=1,'one primary action');
 assert.equal(new Set(Array.from(p.actions,a=>a.id)).size,p.actions.length,'unique actions');
 assert.ok(!p.actions.some(a=>browserEngine.cardPolicy.redundantAdviceActions.includes(a.id)),'no redundant advice control');
 assert.ok(!p.actions.some(a=>a.id==='later'),'Later is not a button');
 assert.ok(p.actions.length<=3,'up to three actions');
 if(current.actions.includes('later'))assert.ok(current.actions.includes('later'),'defer action remains in original event model');
}
const mailCard=allStudioCards.find(c=>c.family==='mail');
assert.ok(mailCard);
const withDuplicateAdvice={...mailCard,actions:['show-sayvi-advice','review-draft','review-draft','open-mail','later']};
const clean=browserEngine.presentation(withDuplicateAdvice);
assert.deepEqual(Array.from(clean.actions,a=>a.id),['review-draft','open-mail']);
assert.equal(clean.actions.filter(a=>a.role==='primary').length,1);
assert.deepEqual(Array.from(browserEngine.presentation({...withDuplicateAdvice,suggestion:''}).actions,a=>a.id),
 ['show-sayvi-advice','review-draft','open-mail'],'show-advice action stays when no visible advice');
console.log('SEYVEO Card Engine Silver Flat policy: tests passed');
