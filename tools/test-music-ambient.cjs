/* Node-only regression for the Home music-artwork state machine.
   Runs without a browser, audio device, or a user music file. */
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const script=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.js'),'utf8');
const begin=script.indexOf('  const musicAudio=document.getElementById(');
const end=script.lastIndexOf('\n})();');
assert.ok(begin>0&&end>begin,'find the private ambient controller');
const listeners=()=>{
 const map=new Map();
 return {
  addEventListener(name,callback){
   if(!map.has(name))map.set(name,[]);
   map.get(name).push(callback);
  },
  fire(name,event={}){for(const fn of map.get(name)||[])fn(event);}
 };
};
const classList=initial=>{
 const state=new Set(initial);
 return {add:(...names)=>names.forEach(name=>state.add(name)),
  remove:(...names)=>names.forEach(name=>state.delete(name)),
  contains:name=>state.has(name)};
};
const root={classList:classList(['sv-sayvi-handoff-docked'])};
const home={hidden:true};
const audio={src:'blob:approved-local-track',paused:false,ended:false,error:null};
const mini={hidden:false};
const document={...listeners(),hidden:false,
 activeElement:{matches:()=>false},
 getElementById(id){return {
  sayviMusicAudio:audio,sayviMusicMini:mini,ask:{hidden:true}
 }[id]||null;},
 querySelector:()=>null};
const window={...listeners()};
const location={hash:'#sayvi-music'};
const box=(x,y,w,h)=>({left:x,top:y,width:w,height:h});
const orb={getBoundingClientRect:()=>box(65,120,260,260)};
const small={getBoundingClientRect:()=>box(260,744,50,50)};
let nextTimer=1,clock=0;
const timers=new Map();
const setTimeoutFake=(fn,delay=0)=>{
 const id=nextTimer++;
 timers.set(id,{fn,when:clock+Number(delay)});
 return id;
};
const clearTimeoutFake=id=>timers.delete(id);
function advance(ms){
 const end=clock+ms;
 while(true){
  const next=[...timers].sort((a,b)=>a[1].when-b[1].when)[0];
  if(!next||next[1].when>end)break;
  clock=next[1].when;timers.delete(next[0]);next[1].fn();
 }
 clock=end;
}
const state={root,home,document,window,location,orb,small,done:true,
 skipClickUntil:0,performance:{now:()=>clock},
 matchMedia:()=>({matches:true}), // Reduced motion makes test transitions instant.
 setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,
 setInterval:()=>0,clearInterval:()=>{}};
vm.runInNewContext(script.slice(begin,end),state,{filename:'seyveo-music-ambient-test.js'});

// Returning from a playing music session raises the hero without waiting 40s.
home.hidden=false;location.hash='#home';
window.fire('seyveo:route-changed');
document.fire('seyveo:music-state',{detail:{playing:true}}); // Must not reset 280ms.
advance(290);
assert.equal(root.classList.contains('sv-music-ambient'),true,'Sayvi rises on return from Music');

// A tap docks Sayvi while the one true music player continues playing.
let consumed=0;
document.fire('pointerdown',{
 target:{closest:()=>null},
 preventDefault(){consumed++},stopImmediatePropagation(){consumed++}
});
assert.equal(consumed,2,'the first background tap is consumed');
assert.equal(root.classList.contains('sv-music-ambient'),false,'tap returns Sayvi to dock');
assert.equal(audio.paused,false,'original music audio is untouched');

advance(39999);
assert.equal(root.classList.contains('sv-music-ambient'),false,'no premature return');
advance(1);
assert.equal(root.classList.contains('sv-music-ambient'),true,'Sayvi returns after idle time');

// Playback stop always restores the normal Home and all four dock actions.
audio.paused=true;
document.fire('seyveo:music-state',{detail:{playing:false}});
assert.equal(root.classList.contains('sv-music-ambient'),false,'music stop closes artwork');

process.stdout.write('PASS: music Home return, tap-to-dock, 40s idle, and stop behavior.\n');
