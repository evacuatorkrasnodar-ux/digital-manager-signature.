/* SEYVEO Home caption: truthful states and a non-looping per-letter light pass. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const js=readFileSync(join(__dirname,'../assets/seyveo-home-status-light.js'),'utf8');
const css=readFileSync(join(__dirname,'../assets/seyveo-home-status-light.css'),'utf8');
const greeting=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.js'),'utf8');
assert.match(css,/background-clip:text/,'the glint follows letter shapes');
assert.match(css,/animation:svHomeStatusLetterLight 1\.65s/,'one gentle, visible pass');
assert.match(css,/--sv-home-letter-shine:linear-gradient/,'white and dark themes get a clear pearly highlight');
assert.match(css,/sv-cinema-written-line--wish\.sv-cinema-wish-light-running::after/,
 'the completed welcome receives the same per-letter light');
assert.match(css,/content:attr\(data-sv-shine-text\)/,'the welcome shine exactly matches its written letters');
assert.match(greeting,/writing\.setAttribute\('data-sv-shine-text',phrase\.text\)/,
 'the welcome shines only when Sayvi finishes typing');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/,'reduced-motion is respected');
assert.doesNotMatch(css,/animation:[^;]*infinite/,'there is no permanent shimmer');

let now=100000,seq=0,passCount=0;
const handlers={document:new Map(),window:new Map()},timers=new Map();
const on=(target,name,fn)=>{
 if(!handlers[target].has(name))handlers[target].set(name,[]);
 handlers[target].get(name).push(fn);
};
const emit=(target,name,detail)=>{
 for(const fn of handlers[target].get(name)||[])fn({type:name,detail});
};
const rootClasses=new Set(['sv-sayvi-handoff-demo','sv-sayvi-handoff-docked']);
const labelClasses=new Set();
const line={
 dataset:{},classList:{
  add(name){if(name==='sv-home-status-light-running')passCount++;labelClasses.add(name)},
  remove:name=>labelClasses.delete(name),contains:name=>labelClasses.has(name)
 },
 setAttribute(){},replaceChildren(...nodes){this.nodes=nodes;}
};
const home={hidden:false,querySelector:()=>line};
const root={classList:{contains:name=>rootClasses.has(name)}};
const navigator={onLine:true};
const document={hidden:false,documentElement:root,querySelector:()=>null,
 getElementById:()=>home,createElement:()=>({className:'',textContent:'',offsetWidth:40,setAttribute(){}}),
 addEventListener:(name,fn)=>on('document',name,fn)};
const schedule=(fn,delay)=>{const id=++seq;timers.set(id,{at:now+delay,fn});return id;};
const window={
 addEventListener:(name,fn)=>on('window',name,fn),
 matchMedia:()=>({matches:false}),setInterval(fn){this.tick=fn;},
 setTimeout:schedule
};
const context={window,document,navigator,location:{hash:'#home'},
 Date:{now:()=>now},setTimeout:schedule,clearTimeout:id=>timers.delete(id)};
vm.runInNewContext(js,context,{filename:'seyveo-home-status-light.js'});
const label=line.nodes[0],light=line.nodes[1];
assert.equal(label.textContent,'Сэйви · на связи');
assert.equal(light.textContent,label.textContent);
assert.equal(window.SEYVEO_HOME_STATUS_LIGHT.getState(),'online');
assert.equal(passCount,1,'initial Home receives exactly one glint');
emit('window','seyveo:home-recommendation-changed');
assert.equal(passCount,1,'card render does not duplicate a fresh glint');
now+=9500;emit('window','seyveo:home-recommendation-changed');
assert.equal(passCount,2,'a later card transition receives its own glint');
now+=9000;rootClasses.add('sv-cinema-intro-active');
emit('window','seyveo:cinema-opening');
assert.equal(passCount,3,'the top caption can shine during the handwritten opening');
rootClasses.delete('sv-cinema-intro-active');

emit('document','seyveo:assistant-presence',{phase:'ack'});
assert.equal(label.textContent,'Сэйви · думает');
const thinkingAt=now;
while([...timers.values()].some(t=>t.at<=thinkingAt+2200)){
 const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];
 if(!next||next[1].at>thinkingAt+2200)break;
 timers.delete(next[0]);now=next[1].at;next[1].fn();
}
assert.equal(label.textContent,'Сэйви · на связи','thinking has a safety end');
emit('document','seyveo:assistant-presence',{phase:'speaking'});
assert.equal(label.textContent,'Сэйви · говорит');
emit('document','seyveo:assistant-presence',{phase:'stop'});
assert.equal(label.textContent,'Сэйви · на связи');

navigator.onLine=false;emit('window','offline');
assert.equal(label.textContent,'Сэйви · нет связи');
assert.equal(window.SEYVEO_HOME_STATUS_LIGHT.getState(),'offline');
navigator.onLine=true;emit('window','online');
assert.equal(label.textContent,'Сэйви · на связи');
now+=65000;window.tick();
assert.ok(passCount>=6,'quiet Home gets an occasional one-pass glint');
const previous=passCount;
now+=15000;window.tick();
assert.equal(passCount,previous,'no fast repeating shimmer');
document.hidden=true;now+=65000;window.tick();
assert.equal(passCount,previous,'no shimmer in a background tab');
console.log('PASS: truthful Home states, one-pass glint, idle cooldown, offline and reduced motion.');
