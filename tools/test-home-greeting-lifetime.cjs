/* Home greeting has a bounded lifetime and yields its space to real cards. */
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const js=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.js'),'utf8');
const css=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.css'),'utf8');
const start=js.indexOf('  const homeGreetingMaxMs=');
const end=js.indexOf('  const orbHome=');
assert.ok(start>=0&&end>start,'greeting code is present');
assert.match(css,/sv-home-greeting-expired[^\n]*#homePage #stage > \.message/);
assert.match(css,/max-height:0 !important/);
assert.match(css,/margin-top:-11px !important/,'Home greeting is lifted near the safe area');

function scene(){
  let now=1000,nextId=0;
  const timers=new Map(),listeners=new Map(),classes=new Set(),styles=new Map();
  const context={
    Date:{now:()=>now},
    setTimeout:(fn,delay)=>{const id=++nextId;timers.set(id,{at:now+delay,fn});return id;},
    clearTimeout:id=>timers.delete(id),
    matchMedia:()=>({matches:false}),
    done:true,home:{hidden:false},location:{hash:'#home'},
    window:{addEventListener:(name,fn)=>(listeners.get(name)||listeners.set(name,[]).get(name)).push(fn)},
    root:{classList:{add:name=>classes.add(name),contains:name=>classes.has(name)}},
    message:{style:{setProperty:(name,value)=>styles.set(name,value)},getBoundingClientRect:()=>({height:92})},
    document:{hidden:false,addEventListener:(name,fn)=>(listeners.get(name)||listeners.set(name,[]).get(name)).push(fn)}
  };
  vm.runInNewContext(js.slice(start,end)+'\nglobalThis.startGreeting=beginHomeGreetingLifetime;',context);
  const advance=ms=>{
    const until=now+ms;
    while(true){
      const sorted=[...timers].sort((a,b)=>a[1].at-b[1].at);
      if(!sorted.length||sorted[0][1].at>until)break;
      const [id,item]=sorted[0];timers.delete(id);now=item.at;item.fn();
    }
    now=until;
  };
  const dispatch=(name,event={})=>(listeners.get(name)||[]).forEach(fn=>fn(event));
  return {context,advance,dispatch,classes,styles};
}

{
  const s=scene();s.context.startGreeting();s.advance(299999);
  assert.equal(s.classes.has('sv-home-greeting-fading'),false);
  s.advance(1);assert.equal(s.classes.has('sv-home-greeting-fading'),true);
  assert.equal(s.styles.get('--sv-home-greeting-height'),'94px');
  s.advance(390);assert.equal(s.classes.has('sv-home-greeting-expired'),true);
}
{
  const s=scene();s.context.startGreeting();s.advance(1000);
  s.dispatch('pointerdown',{target:{closest:()=>false}});
  s.advance(2499);assert.equal(s.classes.has('sv-home-greeting-fading'),false);
  s.advance(1);assert.equal(s.classes.has('sv-home-greeting-fading'),true,
    'real interaction dismisses after the minimum reading time');
}
{
  const s=scene();s.context.startGreeting();
  s.dispatch('pointerdown',{target:{closest:()=>true}});
  s.advance(10000);assert.equal(s.classes.has('sv-home-greeting-fading'),false,
    'tapping the welcome copy does not dismiss it');
}

process.stdout.write('PASS: greeting lifts, stays for reading, fades after interaction or 5 minutes.\n');
