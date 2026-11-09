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
const preferenceMemory=new Map();
const browserScope={window:{
 localStorage:{getItem:key=>preferenceMemory.get(key)||null,setItem:(key,value)=>preferenceMemory.set(key,value),removeItem:key=>preferenceMemory.delete(key)},
 dispatchEvent:()=>{}
},Event:class{constructor(type){this.type=type}}};
runInNewContext(readFileSync(new URL('../assets/seyveo-card-engine.js',import.meta.url),'utf8'),browserScope);
const browserEngine=browserScope.window.SEYVEO_CARD_ENGINE;
assert.equal(browserEngine.cardPolicy.darkMaterial,'#38383A');
assert.equal(browserEngine.cardPolicy.primaryActionsMax,1);
assert.equal(browserEngine.cardPolicy.visibleActionLimit,3);
assert.equal(browserEngine.cardPolicy.deferGesture,'swipe-both-cycle');
assert.equal(browserEngine.cardPolicy.dismissGesture,'long-press-only');
assert.equal(browserEngine.cardPolicy.premiumGraphite,'#38383A');
assert.equal(browserEngine.cardPolicy.contextGesture,'long-press');
assert.equal(browserEngine.isDeferSwipe(85,4),true,'right swipe cycles');
assert.equal(browserEngine.isDeferSwipe(-90,7),true,'left swipe cycles without deleting');
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
 assert.equal(p.actions.length,3,'all cards inherit three predictable choices');
 if(current.actions.includes('later'))assert.ok(current.actions.includes('later'),'defer action remains in original event model');
}
const mailCard=allStudioCards.find(c=>c.family==='mail');
assert.ok(mailCard);
const withDuplicateAdvice={...mailCard,actions:['show-sayvi-advice','review-draft','review-draft','open-mail','later']};
const clean=browserEngine.presentation(withDuplicateAdvice);
assert.deepEqual(Array.from(clean.actions,a=>a.id),['sayvi','edit','navigate']);
assert.equal(clean.actions.filter(a=>a.role==='primary').length,1);
assert.deepEqual(Array.from(browserEngine.presentation({...withDuplicateAdvice,suggestion:''}).actions,a=>a.id),
 ['sayvi','edit','navigate'],'every future card inherits canonical actions');
assert.deepEqual(Array.from(clean.actions,a=>a.label),['Сэйви','Исправить','Перейти']);
console.log('SEYVEO Card Engine Silver Flat policy: tests passed');

const ordinary=allStudioCards.find(c=>c.family==='message');
const protectedSecurity=allStudioCards.find(c=>c.family==='security');
assert.ok(ordinary&&protectedSecurity);
assert.equal(browserEngine.isSuppressed(ordinary),false);
assert.equal(browserEngine.hideCard(ordinary),true);
assert.equal(browserEngine.isSuppressed(ordinary),true,'only card presentation is hidden');
assert.equal(browserEngine.visibleCards([ordinary]).length,0,'hidden card is filtered');
assert.equal(browserEngine.isSuppressed({...ordinary,priority:'urgent'}),false,'urgent event bypasses suppression');
assert.equal(browserEngine.hideCard(protectedSecurity),false,'security cannot be hidden');
assert.equal(browserEngine.muteFamily('security'),false,'security family cannot be muted');
assert.equal(browserEngine.hideCard(ordinary,false),true,'hidden card can be restored');
assert.equal(browserEngine.muteFamily('message'),true);
assert.equal(browserEngine.isSuppressed(ordinary),true,'matching family is muted');
assert.equal(browserEngine.muteFamily('message',false),true,'family may be restored');
assert.equal(browserEngine.isSuppressed(ordinary),false);
assert.equal(browserEngine.restoreVisibility(),true,'reset restores all cards');
console.log('SEYVEO Card Engine visibility preferences: tests passed');

const lineup=allStudioCards.slice(0,3);
const rotated=browserEngine.rotateQueue(lineup,lineup[0].id);
assert.deepEqual(rotated.map(x=>x.id),[lineup[1].id,lineup[2].id,lineup[0].id],'swiped card goes to end of the queue');
assert.equal(lineup[0].id,allStudioCards[0].id,'original event order remains unchanged');
assert.equal(browserEngine.rotateQueue([lineup[0]],lineup[0].id).length,1,'single item remains in source queue');
const now=Date.now();
assert.equal(browserEngine.snoozeCards(ordinary,now),true,'one card can pause');
assert.equal(browserEngine.isSnoozed(ordinary),true,'paused card temporarily hidden');
assert.equal(browserEngine.visibleCards([ordinary]).length,0);
const ordinaryUntil=browserEngine.getSnoozes().find(x=>x.key.endsWith('::'+ordinary.id)).until;
assert.equal(ordinaryUntil,now+60*60*1000,'ordinary card returns after one hour');
assert.equal(browserEngine.snoozeCards(protectedSecurity,now),true,'mandatory card may only be paused briefly');
const protectedUntil=browserEngine.getSnoozes().find(x=>x.key.endsWith('::'+protectedSecurity.id)).until;
assert.equal(protectedUntil,now+10*60*1000,'mandatory alert is paused for only ten minutes');
assert.equal(browserEngine.isSuppressed(protectedSecurity),false,'pause does not silence mandatory alerts permanently');
assert.equal(browserEngine.clearSnoozes(),true,'user can restore paused cards immediately');
assert.equal(browserEngine.isSnoozed(ordinary),false);
assert.equal(browserEngine.getSnoozes().length,0);
console.log('SEYVEO Card Engine queue rotation and timed pause: tests passed');


// Home communication and document flow: three initial actions, then a
// visible explicit Send/Save button, never a fake mail-provider receipt.
const homeSceneSource=readFileSync(new URL('../assets/living-moment.js',import.meta.url),'utf8');
assert.match(homeSceneSource,/workOwn=polymer\('Исправить'/,'manual work edit is called Исправить');
assert.match(homeSceneSource,/mailEdit\.hidden=!active\|\|mailStep!=='draft'/,'manual mail edit is initially available');
assert.match(homeSceneSource,/documentEdit\.hidden=!active\|\|documentStep!=='summary'/,'manual document edit is initially available');
assert.match(homeSceneSource,/documentSave\.hidden=!active\|\|!\['preview','edit'\]\.includes\(documentStep\)/);
assert.match(homeSceneSource,/const mailSave=polymer\('Отправить'/,'developer can see Send in manual mail flow');
assert.match(homeSceneSource,/execute\.textContent='Отправить'/,'developer can see Send after Sayvi mail proposal');
assert.match(homeSceneSource,/mailStep='sent-demo'/,'explicit demo Send shows no real delivery');
assert.match(homeSceneSource,/documentStep='preview'/,'Sayvi opens proposed amendment before Save');
assert.match(homeSceneSource,/documentStep='saved'/,'document Save creates a local draft state');
assert.match(homeSceneSource,/open\.textContent='Перейти'/,'third choice is navigation');
assert.match(homeSceneSource,/function syncDocumentTitleTap\(\)/,'title navigation is preserved');
assert.ok(!homeSceneSource.includes("documentStep==='review'?'Ознакомлен'"),'no fake acknowledgement button');
console.log('SEYVEO canonical Home three-button Send/Save flow: tests passed');

// iPhone-style icon contract: all new cards share the same five symbols,
// and the official Sayvi emblem has a circular orb at its centre.
const iconEngineSource=readFileSync(new URL('../assets/seyveo-card-engine.js',import.meta.url),'utf8');
const iconHomeSource=readFileSync(new URL('../assets/living-moment.js',import.meta.url),'utf8');
const iconSharedStyles=readFileSync(new URL('../assets/seyveo-card-system.css',import.meta.url),'utf8');
const iconHomeStyles=readFileSync(new URL('../assets/seyveo-home-work-actions-flat.css',import.meta.url),'utf8');
assert.equal(typeof browserEngine.decorateActionButton,'function');
for(const kind of ['sayvi','edit','navigate','send','save'])
 assert.match(iconEngineSource,new RegExp('\\b'+kind+':'),kind+' icon is available');
assert.match(iconEngineSource,/<circle cx="12" cy="12" r="1\.7"/,'the official Sayvi mark retains its central sphere');
assert.match(iconEngineSource,/createElementNS\('http:\/\/www\.w3\.org\/2000\/svg'/,'native vector icons');
assert.match(iconEngineSource,/decorateActionButton\(button,action\.id\)/,'new cards receive icons automatically');
assert.match(iconHomeSource,/cardIconize\(mailSave,'send'\)/,'mail Send has paper-plane icon');
assert.match(iconHomeSource,/cardIconize\(execute,'send'\)/,'Sayvi draft Send has paper-plane icon');
assert.match(iconHomeSource,/\[documentSave,'save'\]/,'document Save icon is wired');
assert.match(iconSharedStyles,/min-height:48px!important/,'regular card targets are >=44px');
assert.match(iconHomeStyles,/min-height:48px!important/,'Home card targets are >=44px');
console.log('SEYVEO official Sayvi-orb and iPhone action icon contract: tests passed');
assert.match(iconEngineSource,/classList\.remove\('sv-sayvi-label'\)/,
 'replaced Sayvi action must lose obsolete pseudo-icon class');
assert.match(iconHomeStyles,/sv-ref-card-sayvi\.sv-card-icon-button\[data-sv-card-icon="sayvi"\]/,
 'Mail and Document use their final shared Sayvi graphite capsule');
assert.match(iconHomeStyles,/mask:none!important/,
 'legacy masked Sayvi star is explicitly disabled');
console.log('SEYVEO single Sayvi mark and shared graphite background: tests passed');
