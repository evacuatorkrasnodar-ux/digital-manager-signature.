/* SEYVEO: Sayvi's handwritten thoughts on a quiet, card-free Home.
   Simulated time and a tiny DOM, no network or real browser storage. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const source=readFileSync(join(__dirname,'../assets/seyveo-home-presence.js'),'utf8');
const css=readFileSync(join(__dirname,'../assets/seyveo-home-presence.css'),'utf8');
assert.match(css,/sv-home-empty-sphere\.sv-home-greeting-expired[\s\S]*?data-sv-presence="idle"/,
 'suggestions use the single unboxed line below the weather');
assert.match(css,/sv-home-living-copy-ghost[\s\S]*?visibility:hidden/,
 'the full phrase reserves its dimensions while letters appear');
assert.match(css,/prefers-reduced-motion:reduce/,
 'the typewriter respects reduced-motion preferences');
assert.match(css,/data-sv-presence="reply"[\s\S]*?sv-home-living-copy-typed/,
 'short spoken answers use the same unboxed writing area');
assert.match(source,/!document\.querySelector\('dialog\[open\]'\)/,
 'no suggestion while a dialog is open');
assert.match(source,/HINT_COOLDOWN_MS=90\*1000/,
 'later thoughts are spaced out');
assert.match(source,/Скоро научусь/,
 'not-yet-released features are honestly labeled');
assert.match(source,/Твоё время ценно/,
 'Sayvi conveys the value of the person, not just product features');
assert.match(css,/sv-home-living-action:active[\s\S]*?scale\(\.975\)/,
 'the tiny optional action has a gentle press, separate from the dock');
assert.match(source,/Apple Color Emoji/,
 'emoji are rendered by the platform, not copied artwork');

let now=0,seq=0,line;
const classes=new Set(['sv-home-empty-sphere','sv-home-empty-arrived','sv-home-greeting-expired']);
const listeners=new Map(),timers=new Map(),storage=new Map();
const on=(event,handler)=>{
 if(!listeners.has(event))listeners.set(event,[]);
 listeners.get(event).push(handler);
};
const emit=(event,detail)=>{
 for(const handler of listeners.get(event)||[])handler({type:event,detail});
};
const schedule=(handler,delay,interval=false)=>{
 const id=++seq;timers.set(id,{handler,at:now+delay,interval:interval?delay:0});return id;
};
class Element{
 constructor(){this.hidden=false;this.dataset={};this.children=[];this.textContent='';
  this.listeners=new Map();
  const own=new Set();this.classList={add:name=>own.add(name),remove:name=>own.delete(name),contains:name=>own.has(name)};}
 setAttribute(){}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children}
 addEventListener(name,handler){this.listeners.set(name,handler)}
 click(){this.listeners.get('click')?.({preventDefault(){},stopPropagation(){}})}
 closest(selector){return selector.includes('data-sv-sayvi-action')&&this.dataset.svSayviAction?this:null}
}
const home={hidden:false};
const message={insertAdjacentElement:(_side,element)=>{line=element;}};
const stage={querySelector:()=>message};
const root={classList:{contains:name=>classes.has(name)}};
const document={
 hidden:false,documentElement:root,activeElement:{matches:()=>false},
 getElementById:id=>({homePage:home,stage,headline:{}}[id]||null),
 createElement:()=>new Element(),querySelector:()=>null,
 addEventListener:on
};
const window={
 addEventListener:on,dispatchEvent:event=>emit(event.type),
 setTimeout:(fn,delay)=>schedule(fn,delay),
 setInterval:(fn,delay)=>schedule(fn,delay,true),
 matchMedia:()=>({matches:false})
};
const context={window,document,location:{hash:'#home'},sessionStorage:{
 getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)
},Date:{now:()=>now},Event:class{constructor(type){this.type=type}},
 setTimeout:window.setTimeout,clearTimeout:id=>timers.delete(id)};
vm.runInNewContext(source,context,{filename:'seyveo-home-presence.js'});
const advance=until=>{
 while(true){
  const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];
  if(!next||next[1].at>until)break;
  const [id,timer]=next;now=timer.at;
  if(timer.interval)timer.at+=timer.interval;else timers.delete(id);
  timer.handler();
 }
 now=until;
};

const copy=()=>line.children[1].children[1].textContent;
const ghost=()=>line.children[1].children[0].textContent;
advance(13_900);
assert.equal(line.hidden,true,'the opening sentence waits for a quiet moment');
advance(15_000);
assert.equal(line.hidden,false,'the first message appears, without a new card');
assert.match(ghost(),/Нажми на сферу/,'Sayvi teaches how to open the chat');
assert.equal(line.dataset.svPresence,'idle');
assert.equal(line.dataset.svTyping,'true');
assert.ok(copy().length>0&&copy().length<ghost().length,
 'the first message appears letter by letter');
const initiallyTyped=copy();
advance(16_000);
assert.ok(copy().length>initiallyTyped.length,'the message continues to type');
advance(22_000);
assert.equal(copy(),ghost(),'the message becomes complete');
assert.equal(line.dataset.svTyping,'false','the cursor stops after the message');
advance(28_000);
assert.match(ghost(),/Удерживай сферу/,'the second hint explains voice and nickname');
advance(43_000);
assert.equal(line.hidden,true,'the introduction disappears without a tap');
const saved=JSON.parse(storage.get('seyveo.sayvi.quiet-home-hint.v2'));
assert.equal(saved.introDone,true,'the introduction is stored per session');
advance(125_000);
assert.equal(line.hidden,true,'later messages observe a long cooldown');
advance(133_000);
assert.equal(line.hidden,false,'a human-first thought arrives only after prolonged calm');
assert.match(ghost(),/особые команды/,'the next hint is helpful rather than promotional');
emit('pointerdown');
assert.equal(line.hidden,true,'touch immediately stops typing');
advance(136_000);
assert.equal(line.hidden,true,'touch resets the idle timer');
home.hidden=true;
advance(350_000);
assert.equal(line.hidden,true,'no messages while away from Home');
home.hidden=false;
classes.delete('sv-home-empty-sphere');
advance(550_000);
assert.equal(line.hidden,true,'real cards and tasks suppress idle thoughts');

// An offered button must remain tappable on mobile: a document-level
// pointerdown/touchstart handler otherwise removes the whole line before click.
function probeAction(next,kind,label){
 let clock=0,id=0,offered,opened='';
 const tickers=new Map(),events=new Map();
 const add=(type,handler)=>{
  if(!events.has(type))events.set(type,[]);
  events.get(type).push(handler);
 };
 const scheduleNext=(handler,delay,interval=false)=>{
  const key=++id;tickers.set(key,{handler,at:clock+delay,interval:interval?delay:0});return key;
 };
 const localClasses=new Set(['sv-home-empty-sphere','sv-home-empty-arrived','sv-home-greeting-expired']);
 const localHome={hidden:false};
 const localLocation={hash:'#home'};
 const localDocument={
  hidden:false,activeElement:{matches:()=>false},
  documentElement:{classList:{contains:name=>localClasses.has(name)}},
  getElementById:key=>({homePage:localHome,stage:{querySelector:()=>({
   insertAdjacentElement:(_where,element)=>{offered=element;}
  })},headline:{},navTasks:{click:()=>{opened='tasks';}}}[key]||null),
  createElement:()=>new Element(),querySelector:()=>null,addEventListener:add
 };
 const localWindow={
  addEventListener:add,dispatchEvent:event=>(events.get(event.type)||[]).forEach(fn=>fn(event)),
  setTimeout:(fn,delay)=>scheduleNext(fn,delay),
  setInterval:(fn,delay)=>scheduleNext(fn,delay,true),
  matchMedia:()=>({matches:false}),
  SEYVEO_MUSIC:{open:()=>{opened='music';}},
  SEYVEO_PAPER:{open:()=>{opened='drawing';}},
  SEYVEO_NOTES_API:{openNotes:()=>{opened='notes';}},
  SEYVEO_SAYVI_SURFACES:{open:()=>{opened='documents';return true;}},
  SEYVEO_CONVERSATION:{open:()=>{opened='chat';}}
 };
 const localStore=new Map([['seyveo.sayvi.quiet-home-hint.v2',
  JSON.stringify({at:0,next,introDone:true})]]);
 vm.runInNewContext(source,{
  document:localDocument,window:localWindow,location:localLocation,
  sessionStorage:{getItem:key=>localStore.get(key),setItem:(key,value)=>localStore.set(key,value)},
  Date:{now:()=>clock},Event:class{constructor(type){this.type=type}},
  setTimeout:localWindow.setTimeout,clearTimeout:key=>tickers.delete(key)
 },{filename:'seyveo-home-presence.js'});
 function step(until){
  while(true){
   const item=[...tickers].sort((a,b)=>a[1].at-b[1].at)[0];
   if(!item||item[1].at>until)break;
   const [key,timer]=item;clock=timer.at;
   if(timer.interval)timer.at+=timer.interval;else tickers.delete(key);
   timer.handler();
  }
  clock=until;
 }
 step(69_000);
 const row=offered.children[2],button=row.children[0];
 assert.equal(offered.hidden,false,kind+' is offered on quiet Home');
 assert.equal(row.hidden,false,kind+' has an action row');
 assert.equal(row.dataset.revealed,'true',kind+' reveals its action after typing');
 assert.equal(button.children[1].textContent,label,kind+' has a clear label');
 for(const type of ['pointerdown','touchstart']){
  for(const handler of events.get(type)||[])handler({target:button});
  assert.equal(offered.hidden,false,kind+' survives '+type+' before click');
 }
 button.click();
 assert.equal(opened,kind==='calendar'?'':kind,kind+' activates its actual route');
 if(kind==='calendar')assert.equal(localLocation.hash,'#calendar');
 assert.equal(offered.hidden,true,kind+' clears the invitation when opening');
}
for(const [next,kind,label] of [
 [2,'music','Открыть музыку'],[3,'drawing','Открыть планшет'],
 [4,'tasks','Мои дела'],[5,'documents','Документы'],
 [6,'calendar','Календарь'],[13,'chat','Поговорим'],
 [14,'notes','Блокнот']
])probeAction(next,kind,label);

// Last-card return is a distinct milestone; an ordinary empty Home arrival
// does not trigger it. The celebration then yields to an actual voice reply.
classes.add('sv-home-empty-sphere');
emit('seyveo:home-sayvi-arrived',{afterCards:true});
advance(552_000);
assert.equal(line.hidden,false,'last-card completion writes immediately after the sphere arrives');
assert.match(ghost(),/Ого, на главной всё разобрали/,
 'Sayvi celebrates this Home milestone without claiming all tasks are complete');
advance(557_000);
assert.equal(line.children[2].dataset.revealed,'true',
 'the celebration offers a music shortcut after typing');
emit('seyveo:assistant-presence',{phase:'ack',reply:'Рада помочь! Можем просто поговорить.'});
advance(559_000);
assert.equal(line.dataset.svPresence,'reply',
 'voice replies take priority over optional Home suggestions');
assert.equal(ghost(),'Рада помочь! Можем просто поговорить.');
advance(563_000);
assert.equal(copy(),ghost(),'the actual answer appears letter by letter');
assert.equal(line.children[3].textContent,ghost(),
 'VoiceOver receives one finished answer, not every changing character');
advance(576_000);
assert.equal(line.hidden,true,'voice reply clears after a calm reading period');
console.log('PASS: onboarding, seven routes, last-card celebration and live mini voice transcript.');
