/* Real startup-gate regression: iOS standalone loads are navigation entries,
   not necessarily reload entries. They must replay the approved Home opening. */
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const source=readFileSync(join(__dirname,'../assets/seyveo-sayvi-handoff-demo.js'),'utf8');
const start=source.indexOf('  const params=new URLSearchParams(');
const end=source.indexOf('  const root=document.documentElement;');
assert.ok(start>0&&end>start,'startup gate remains inspectable');
const startup=source.slice(start,end)+'\nglobalThis.result={showCinema,standaloneLaunch,pageReload};';
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
assert.equal(evaluate({type:'reload'}),true,'Safari reload replays the opening');
assert.equal(evaluate({standalone:true}),true,'installed PWA replays on a fresh navigate');
assert.equal(evaluate({legacy:true}),true,'older iOS navigator.standalone replays');
assert.equal(evaluate({standalone:true,query:'?sayvi-intro=0'}),false,'explicit skip is respected');
assert.equal(evaluate({standalone:true,hash:'#tasks'}),false,'a task deep link keeps its route');
assert.equal(evaluate({seen:false}),true,'first normal visit of the day still plays');
assert.match(source,/document\.addEventListener\('visibilitychange',onVisible\)/,
 'a backgrounded PWA waits to become visible before starting its film');
process.stdout.write('PASS: Safari reload, PWA launch, legacy standalone, deep links, visibility.\n');
