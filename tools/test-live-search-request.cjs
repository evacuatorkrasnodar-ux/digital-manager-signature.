const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../assets/seyveo-live-search-request.js'),'utf8');
function prepare(fetcher,confirm=()=>true){
 const calls=[],received=[];
 const saved=new Map();
 const localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
 const chat={
  beginStream:(q,stop)=>calls.push({q,stop}),
  updateStream:()=>{},
  showSearchResults:x=>received.push(x),
  endStream:()=>{}
 };
 const window={SEYVEO_CONVERSATION:chat,confirm};
 vm.runInNewContext(src,{window,fetch:fetcher,AbortController,localStorage,console});
 return {api:window.SEYVEO_LIVE_SEARCH_REQUEST,calls,received,saved};
}
const tick=()=>new Promise(r=>setTimeout(r,5));
test('routes fresh public questions but not private work or ordinary dialogue',()=>{
 const {api}=prepare(async()=>{throw Error('not called')});
 assert.equal(api.isSearchQuestion('Правда ли Маск сделал летающую машину?'),true);
 assert.equal(api.isSearchQuestion('Какие последние новости о Tesla Roadster?'),true);
 assert.equal(api.isSearchQuestion('Найди фото новой Tesla'),true);
 assert.equal(api.isSearchQuestion('Добавь задачу на завтра'),false);
 assert.equal(api.isSearchQuestion('Проверь мой договор'),false);
 assert.equal(api.isSearchQuestion('Найди в интернете зарплату моего сотрудника'),false);
});
test('forwards only one explicit public question to local server',async()=>{
 let called;
 const t=prepare(async(path,init)=>{
  called={path,init};
  return {ok:true,json:async()=>({status:'results',results:[{title:'Verified',url:'https://example.org',snippet:'Report'}]})};
 });
 assert.equal(t.api.start('Что нового у Tesla?'),true);
 await tick();
 assert.equal(called.path,'/api/seyveo-live-search');
 assert.equal(called.init.credentials,'same-origin');
 assert.equal(JSON.parse(called.init.body).message,'Что нового у Tesla?');
 assert.deepEqual(Object.keys(JSON.parse(called.init.body)),['message']);
 assert.equal(t.received.length,1);
 assert.equal(t.received[0].status,'results');
 assert.equal(t.calls.length,1);
});
test('cancel aborts actual fetch without adding fabricated answer',async()=>{
 let signal;
 const t=prepare(async(_path,init)=>{
  signal=init.signal;
  return new Promise((_resolve,reject)=>{
   init.signal.addEventListener('abort',()=>reject(Object.assign(Error('abort'),{name:'AbortError'})));
  });
 });
 t.api.start('Правда ли Маск сделал летающую машину?');
 assert.equal(t.calls.length,1);
 t.calls[0].stop();
 await tick();
 assert.equal(signal.aborted,true);
 assert.equal(t.received.length,0);
});

test('one-time explicit search consent blocks declined external requests',async()=>{
 let calls=0;
 const t=prepare(async()=>{calls++;throw Error('should not contact provider')},()=>false);
 assert.equal(t.api.start('Правда ли Маск сделал летающую машину?'),true);
 await tick();
 assert.equal(calls,0);
 assert.equal(t.received[0].status,'unavailable');
 assert.equal(t.saved.size,0);
});
