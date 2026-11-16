/* SEYVEO: one gesture opens writing with the actual text cursor ready. */
'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const source=readFileSync(join(__dirname,'../assets/seyveo-writing-focus.js'),'utf8');
const cards=readFileSync(join(__dirname,'../assets/living-moment.js'),'utf8');
const tasks=readFileSync(join(__dirname,'../assets/personal-tasks.js'),'utf8');
const home=readFileSync(join(__dirname,'../index.html'),'utf8');
const chat=readFileSync(join(__dirname,'../sayvi-chat-new.html'),'utf8');
assert.match(cards,/updateDocument\(\);focusDraftField\(documentDetails\)/,
 'Home document edit focuses the new textarea in the same tap');
assert.match(cards,/updateMail\(\);focusDraftField\(mailDetails\)/,
 'Home mail edit focuses immediately');
assert.match(cards,/updateWork\(\);focusDraftField\(workDetails\)/,
 'Home work reply focuses immediately');
assert.match(tasks,/if\(!dialog\.open\)dialog\.showModal\(\);[\s\S]{0,130}focusTaskWriting\(\)/,
 'manual Tasks editor focuses its title on opening');
for(const [name,html] of [['Home',home],['Sayvi chat',chat]])
 assert.match(html,/assets\/seyveo-writing-focus\.js\?v=1/,`${name} includes the shared focus rule`);

const listeners={capture:[],bubble:[]},editors=[];
let active=null;
class Node{
 constructor(tag,{label='',text='',value='',scope=null}={}){
  this.tag=tag;this.label=label;this.textContent=text;this.value=value;
  this.isConnected=true;this.hidden=false;this.disabled=false;
  this.readOnly=false;this.dataset={};this.scope=scope;this.focusCount=0;
  this.selection=null;
 }
 getAttribute(name){return name==='aria-label'?this.label:'';}
 closest(selector){
  if(selector==='button,[role="button"]')return this.tag==='button'?this:null;
  if(selector==='[hidden],[inert]')return this.hidden?this:null;
  if(selector==='#svcpWorkChatScreen')return this.scope==='workchat'?this:null;
  if(selector==='#sayviMessages,#sayviComposer')return this.scope==='sayvi'?this:null;
  return null;
 }
 getClientRects(){return this.hidden?[]:[{width:200,height:50}];}
 focus(){this.focusCount++;active=this;}
 setSelectionRange(start,end){this.selection=[start,end];}
}
const document={
 get activeElement(){return active;},
 querySelectorAll:()=>editors,
 querySelector:()=>null,
 getElementById:id=>id==='svcpChatInput'?editors.find(x=>x.scope==='workchat'):null,
 addEventListener:(name,fn,capture)=>{
  if(name==='click')listeners[capture===true?'capture':'bubble'].push(fn);
 }
};
const window={};
vm.runInNewContext(source,{window,document,getComputedStyle:()=>({display:'block',visibility:'visible'})},
 {filename:'seyveo-writing-focus.js'});
const click=(button,action=()=>{},trusted=true)=>{
 const event={target:button,isTrusted:trusted};
 listeners.capture.forEach(fn=>fn(event));
 action();
 listeners.bubble.forEach(fn=>fn(event));
};

const edit=new Node('button',{label:'Исправить'});
const documentDraft=new Node('textarea',{value:'Уточни срок поставки'});
click(edit,()=>editors.push(documentDraft));
assert.equal(active,documentDraft,'the first newly created editor gets focus');
assert.deepEqual(documentDraft.selection,[documentDraft.value.length,documentDraft.value.length],
 'the caret is placed at the end of the editable draft');

const write=new Node('button',{label:'Написать ответ самостоятельно'});
const mailDraft=new Node('textarea',{value:'Здравствуйте!'});
click(write,()=>editors.push(mailDraft));
assert.equal(active,mailDraft,'a new editor takes focus even if an older field was active');

const deleteButton=new Node('button',{label:'Удалить'});
const ignored=new Node('textarea');
click(deleteButton,()=>editors.push(ignored));
assert.equal(active,mailDraft,'unrelated actions never steal typing focus');

const dateButton=new Node('button',{label:'Исправить дату'});
const dateInput=new Node('input');
click(dateButton,()=>editors.push(dateInput));
assert.equal(active,mailDraft,'date and time pickers do not open text keyboards');

const autoFocused=new Node('textarea',{value:'Текст уже набирается'});
click(edit,()=>{editors.push(autoFocused);autoFocused.focus();});
assert.equal(active,autoFocused,'respect an editor that the feature already focused');
assert.equal(autoFocused.focusCount,1,'do not focus a second time after the feature did');

const reply=new Node('button',{label:'Ответить',scope:'workchat'});
const chatInput=new Node('textarea',{scope:'workchat'});editors.push(chatInput);
click(reply);
assert.equal(active,chatInput,'reply in an existing work chat targets its composer');

const programmatic=new Node('button',{label:'Исправить'});
const synthetic=new Node('textarea');
click(programmatic,()=>editors.push(synthetic),false);
assert.equal(active,chatInput,'synthetic events do not pop the native keyboard');
console.log('PASS: one-tap caret for Home cards, Tasks and shared editors; no unrelated focus theft.');
