const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/notebook-paper.js'),'utf8');
const chat=fs.readFileSync(path.join(root,'sayvi-chat-new.html'),'utf8');
const files=fs.readFileSync(path.join(root,'assets/sayvi-session-files.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const start=source.indexOf(' openSayvi:async()=>{');
const end=source.indexOf(' open,preview:',start);
assert.ok(start>0&&end>start,'the Notebook action is present');
const action=source.slice(start,end);

function harness({hasContent=true,changed=false,confirm=true,store=true}={}){
 const calls={opened:0,closed:0,notice:[],saved:null,previewed:0};
 const sandbox={
  data:{strokes:hasContent?[{tool:'pen',points:[[100,100,50]]}]:[],photo:'',texts:[]},
  changed,pending:null,sayviHandoffBusy:false,returnToList:true,
  window:{SEYVEO_CONVERSATION:{open(){calls.opened++}},confirm:()=>confirm,
   SEYVEO_CHAT_FILES:{remember:async()=>store?{'Лист SEYVEO.png':'doc-expected'}:{}}},
  normalize:d=>d,png:async()=>{calls.previewed++;return 'data:image/png;base64,QUJD'},
  atob:v=>Buffer.from(v,'base64').toString('binary'),
  File:class{constructor(parts,name,options){this.name=name;this.type=options.type;this.bytes=parts[0]}},
  sessionStorage:{setItem(key,value){calls.saved={key,value:JSON.parse(value)}}},
  dialog:{close(){calls.closed++}},report:value=>calls.notice.push(value),
  Uint8Array
 };
 const run=vm.runInNewContext('({'+action+'other(){}}).openSayvi',sandbox);
 return {run,sandbox,calls};
}

test('one tap prepares a private PNG attachment and never sends the chat message',async()=>{
 const {run,calls,sandbox}=harness();await run();
 assert.equal(calls.previewed,1);
 assert.deepEqual({key:calls.saved.key,state:calls.saved.value.state,ref:calls.saved.value.ref},
  {key:'seyveo.sayvi.paper-handoff.v1',state:'ready',ref:'doc-expected'});
 assert.equal(calls.closed,1);assert.equal(calls.opened,1);
 assert.equal(sandbox.returnToList,false);
 assert.match(calls.saved.value.draft,/посмотри мой лист/);
 assert.match(chat,/if\(image&&image\.type==='image\/png'\)\s*addAttachments\(\[image\]\)/);
 assert.match(chat,/Never submit it to Sayvi automatically/);
 assert.match(files,/crypto\.subtle\.encrypt\(\{name:'AES-GCM'/);
});

test('an unsaved sheet stays open if its author declines to leave',async()=>{
 const {run,calls}=harness({changed:true,confirm:false});await run();
 assert.equal(calls.previewed,0);assert.equal(calls.opened,0);
 assert.equal(calls.closed,0);assert.equal(calls.saved,null);
});

test('storage errors leave the editable sheet in place',async()=>{
 const {run,calls}=harness({store:false});await run();
 assert.equal(calls.opened,0);assert.equal(calls.closed,0);
 assert.match(calls.notice.at(-1),/Не удалось прикрепить лист/);
});

test('empty sheet opens Sayvi directly without adding a blank attachment',async()=>{
 const {run,calls}=harness({hasContent:false});await run();
 assert.equal(calls.opened,1);assert.equal(calls.closed,1);
 assert.equal(calls.saved,null);assert.equal(calls.previewed,0);
});

test('paper handoff uses the current cache-busted drawing engine',()=>{
 assert.match(html,/assets\/notebook-paper\.js\?v=43/);
 assert.match(html,/assets\/sayvi-session-files\.js\?v=1/);
 assert.match(source,/if\(pending\|\|sayviHandoffBusy\)/);
});
