/* SEYVEO Family · protected My World regression.
 * node tools/test-family-chat.cjs
 * No simulated external send, upload, contact read, or production account.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const life=fs.readFileSync('assets/calendar-spaces.js','utf8');
const source=fs.readFileSync('assets/seyveo-family-chat.js','utf8');
const style=fs.readFileSync('assets/seyveo-family-chat.css','utf8');
const roadmap=fs.readFileSync('assets/management.js','utf8');
for(const id of ['seyveoFamilyDialog','svfClose','svfMessages','svfChatForm','svfFile',
 'svfAttachButton','svfAttachment','svfStatus','svfSuggestion','svfMessageInput',
 'svfPlanForm','svfPlanList','svfPlanText']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'One family control: '+id);
}
assert.equal((html.match(/data-calendar-space="family"/g)||[]).length,1,'One Family tile in My World');
assert.match(html,/assets\/seyveo-family-chat\.js\?v=\d+/,'Family module loaded');
assert.match(html,/assets\/seyveo-family-chat\.css\?v=\d+/,'Family theme loaded');
assert.match(life,/if\(name==='family'\)\{[\s\S]*?SEYVEO_FAMILY_CHAT\?\.open\?\.\(\)/,'My World tile routes to Family');
assert.match(roadmap,/\['family_chat_demo'/,'Family demo tracked once');
assert.match(roadmap,/\['family_chat_secure'/,'Real chat tracked as plan');
assert.match(style,/\.svf-dialog\{/,'Styles scoped to family dialog');
assert.doesNotMatch(source,/fetch\s*\(|new WebSocket|XMLHttpRequest|sendBeacon|\.postMessage\s*\(/,
 'No hidden family transport or uploads');
assert.doesNotMatch(source,/localStorage|SEYVEO_BUSINESS|business-command/,'Family must not touch business or personal vault stores');
new vm.Script(source,{filename:'assets/seyveo-family-chat.js'});
class Fake{
 constructor(tag='div',id=''){
  this.tagName=tag.toUpperCase();this.id=id;this.hidden=false;this.open=false;
  this.children=[];this.handlers={};this.attrs={};this.dataset={};
  this.files=[];this.value='';this.textContent='';this.checked=false;this.style={};this.scrollTop=0;this.scrollHeight=100;
 }
 addEventListener(kind,fn){(this.handlers[kind]??=[]).push(fn)}
 fire(kind,event={}){for(const fn of this.handlers[kind]||[])fn(event)}
 setAttribute(k,v){this.attrs[k]=v}
 append(...elements){this.children.push(...elements)}
 replaceChildren(...elements){this.children=elements}
 querySelectorAll(selector){
  if(selector==='[data-svf-tab]')return tabs;
  if(selector==='[data-svf-panel]')return panels;
  return [];
 }
 click(){this.fire('click',{preventDefault(){}})}
 showModal(){this.open=true}
 close(){this.open=false;this.fire('close',{})}
}
const ids=['seyveoFamilyDialog','svfClose','svfMessages','svfChatForm','svfFile',
 'svfAttachButton','svfAttachment','svfStatus','svfSuggestion','svfMessageInput',
 'svfPlanForm','svfPlanList','svfPlanText'];
const nodes=Object.fromEntries(ids.map(id=>[id,new Fake('div',id)]));
const tabs=['chat','plans'].map(k=>{const f=new Fake('button');f.dataset.svfTab=k;return f});
const panels=['chat','plans'].map(k=>{const f=new Fake('section');f.dataset.svfPanel=k;return f});
const handlers={},store=new Map();
const windowMock={addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn)};
const documentMock={getElementById:id=>nodes[id]||null,createElement:tag=>new Fake(tag)};
let selected=0;
nodes.svfFile.click=()=>{selected++};
vm.runInNewContext(source,{
 window:windowMock,document:documentMock,
 sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 URL:{createObjectURL:()=> 'blob:mock-family-image',revokeObjectURL:()=>{}},
 Math,Date
},{filename:'assets/seyveo-family-chat.js',timeout:1200});
assert.ok(windowMock.SEYVEO_FAMILY_CHAT?.open,'Open API is installed');
windowMock.SEYVEO_FAMILY_CHAT.open();
assert.equal(nodes.seyveoFamilyDialog.open,true,'Family dialog opens');
nodes.svfAttachButton.click();
assert.equal(selected,1,'Attachment button opens file selection');
nodes.svfMessageInput.value='Купить хлеб';
nodes.svfChatForm.fire('submit',{preventDefault(){}});
assert.match(nodes.svfStatus.textContent,/только в этой вкладке/,'Never claims a message was sent');
assert.equal(JSON.parse(store.get('seyveo-family-chat-demo-messages-v1')).length,1);
assert.equal(nodes.svfSuggestion.hidden,false,'Rule-based shopping suggestion appears');
const add=nodes.svfSuggestion.children.find(x=>x.tagName==='BUTTON'&&x.textContent==='Добавить в планы');
assert.ok(add,'Suggestion must require explicit confirmation');
add.click();
assert.equal(JSON.parse(store.get('seyveo-family-chat-demo-plans-v1')).length,1);
assert.equal(nodes.svfPlanList.children.length,1);
assert.equal(panels.find(x=>x.dataset.svfPanel==='plans').hidden,false);
nodes.svfClose.click();
assert.equal(nodes.seyveoFamilyDialog.open,false,'Close works');
console.log('PASS Family: one personal entry, working dialog, attachment picker, local unsent messages, opt-in family plan, no transport.');
