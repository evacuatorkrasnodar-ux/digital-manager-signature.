/* Explicit Safari reload and fresh installed-PWA launch replay the artwork.
   Ordinary tab navigation still respects the one-per-day gate. */
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const source=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.js'),'utf8');
const start=source.indexOf('  const params=new URLSearchParams(');
const end=source.indexOf('  const root=document.documentElement;');
assert.ok(start>0&&end>start,'startup gate remains inspectable');
const startup=source.slice(start,end)+'\nglobalThis.result={showCinema,atHome,noIntro};';
const day=new Date();
const iso=[day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');

function evaluate({standalone=false,legacy=false,type='navigate',hash='',query='',seen=true}={}){
 const context={
  URLSearchParams,Date,
  location:{search:query,origin:'https://example.test',hash},
  navigator:{standalone:legacy},
  localStorage:{getItem:key=>key==='seyveo-sayvi-cinema-last-day-v4'&&seen?iso:null},
  performance:{getEntriesByType:()=>[{type}],navigation:{type:type==='reload'?1:0}},
  matchMedia:query=>({matches:query==='(display-mode: standalone)'&&standalone})
 };
 vm.runInNewContext(startup,context);
 return context.result.showCinema;
}

assert.equal(evaluate(),false,'normal Safari navigation respects once-a-day setting');
assert.equal(evaluate({type:'reload'}),true,'Safari reload replays the approved opening');
assert.equal(evaluate({standalone:true}),true,'installed PWA opens with the full greeting');
assert.equal(evaluate({legacy:true}),true,'iPhone Safari standalone flag behaves the same');
assert.equal(evaluate({standalone:true,query:'?sayvi-intro=0'}),false,'explicit skip is respected');
assert.equal(evaluate({standalone:true,hash:'#tasks'}),false,'a task deep link keeps its route');
assert.equal(evaluate({seen:false}),true,'first normal visit of the day still plays');
assert.equal(evaluate({query:'?sayvi-intro=1'}),true,'explicit preview replays the long scene');
assert.match(source,/function beginHomeGreetingLifetime\(\)/,'the Home written greeting has its own lifetime');
assert.match(source,/renderToday\(\);\s*root\.classList\.toggle\('sv-home-card-sphere',hasHomeCards\(\)\);\s*beginHomeGreetingLifetime\(\)/,
 'Home content returns when the film finishes or is skipped');
assert.match(source,/document\.addEventListener\('visibilitychange',onVisible\)/,
 'a backgrounded PWA waits to become visible before starting its film');
process.stdout.write('PASS: Safari/PWA relaunch, daily navigation gate, explicit replay, deep links, visibility.\n');
