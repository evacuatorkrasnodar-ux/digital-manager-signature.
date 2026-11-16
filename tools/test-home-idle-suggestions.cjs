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
assert.match(source,/!document\.querySelector\('dialog\[open\]'\)/,
 'no suggestion while a dialog is open');
assert.match(source,/HINT_COOLDOWN_MS=90\*1000/,
 'later thoughts are spaced out');
assert.match(source,/Скоро научусь/,
 'not-yet-released features are honestly labeled');
assert.match(source,/Твоё время ценно/,
 'Sayvi conveys the value of the person, not just product features');

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
  const own=new Set();this.classList={add:name=>own.add(name),remove:name=>own.delete(name),contains:name=>own.has(name)};}
 setAttribute(){}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children}
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
console.log('PASS: two handwritten onboarding messages, rotating thoughts and unobtrusive timing.');
