/* SEYVEO: a quiet, infrequent thought only while the original sphere is home.
   Simulated time, no network, storage writes or actual UI interaction. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const source=readFileSync(join(__dirname,'../assets/seyveo-home-presence.js'),'utf8');
const css=readFileSync(join(__dirname,'../assets/seyveo-home-presence.css'),'utf8');
assert.match(css,/sv-home-empty-sphere\.sv-home-greeting-expired[\s\S]*?data-sv-presence="idle"/,
 'suggestions use the single unboxed line below the weather');
assert.match(source,/!document\.querySelector\('dialog\[open\]'\)/,
 'no suggestion while a dialog is open');
assert.match(source,/HINT_COOLDOWN_MS=25\*60\*1000/,
 'only one nudge per 25 minutes');

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
  const own=new Set();this.classList={add:name=>own.add(name),contains:name=>own.has(name)};}
 setAttribute(){}
 append(...children){this.children.push(...children)}
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
 setInterval:(fn,delay)=>schedule(fn,delay,true)
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

advance(59_000);
assert.equal(line.hidden,true,'no prompt before a minute');
advance(65_000);
assert.equal(line.hidden,false,'first idea appears after a quiet minute');
assert.match(line.children[1].textContent,/музык/,'first idea offers a relevant capability');
assert.equal(line.dataset.svPresence,'idle');
advance(85_000);
assert.equal(line.hidden,true,'the thought disappears without user action');
advance(100_000);
assert.equal(line.hidden,true,'cooldown prevents nagging');
home.hidden=true;advance(160_000);
assert.equal(line.hidden,true,'nothing appears while away from Home');
home.hidden=false;
emit('pointerdown');
assert.equal(line.hidden,true,'touch cancels any pending idea');
classes.delete('sv-home-empty-sphere');
advance(2_000_000);
assert.equal(line.hidden,true,'real work/cards suppress idle prompts');
console.log('PASS: one discreet idle hint, delayed, expiring, cooldown and task-aware.');
