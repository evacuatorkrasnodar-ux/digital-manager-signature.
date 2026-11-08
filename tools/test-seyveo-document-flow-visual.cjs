/* Pictorial approvals: actual local demo behavior, not just decorative SVGs. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'assets/seyveo-document-flow.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/seyveo-document-flow.css'),'utf8');
class Node{
 constructor(tag='div'){
  this.tagName=tag.toUpperCase();this.className='';this.attributes={};
  this.children=[];this.dataset={};this.parentNode=null;this.listeners={};
  this.value='';this.textContent='';this.open=false;this._root=false;
  this.classList={add:value=>{this.className=(this.className+' '+value).trim()}};
 }
 append(...children){for(const c of children){this.children.push(c);c.parentNode=this;}}
 replaceChildren(...children){for(const c of this.children)c.parentNode=null;
  this.children=[];this.append(...children);}
 setAttribute(name,value){this.attributes[name]=String(value);}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 click(){for(const fn of this.listeners.click||[])fn({target:this});}
 remove(){if(!this.parentNode)return;const parent=this.parentNode;
  parent.children.splice(parent.children.indexOf(this),1);this.parentNode=null;}
 get childElementCount(){return this.children.length}
 get isConnected(){return this._root||Boolean(this.parentNode?.isConnected)}
}
function find(node,predicate){
 const out=[];function visit(n){if(predicate(n))out.push(n);
  for(const c of n.children)visit(c)}
 visit(node);return out;
}
function cls(node,name){return find(node,n=>n.className.split(' ').includes(name));}
function action(node,label){
 const buttons=find(node,n=>n.tagName==='BUTTON'&&n.textContent===label);
 assert.ok(buttons.length,'Action missing: '+label);
 return buttons.at(-1);
}
function fixture({employee=false,initial=[]}={}){
 const key='seyveo-document-flow-training-v1',data=new Map();
 if(initial.length)data.set(key,JSON.stringify(initial));
 const localStorage={
  getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v)},
  removeItem:k=>{data.delete(k)}
 };
 const document={
  createElement:tag=>new Node(tag),
  createElementNS:(_ns,tag)=>new Node(tag)
 };
 const events=[];
 const window={
  SEYVEO_PREVIEW:{isEmployee:()=>employee},
  addEventListener:()=>{},
  dispatchEvent:e=>events.push(e),
  confirm:()=>true
 };
 class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail}}
 vm.runInNewContext(code,{window,document,localStorage,CustomEvent,Date,Math,JSON},
  {filename:'seyveo-document-flow.js'});
 const host=new Node('main');host._root=true;
 assert.equal(window.SEYVEO_DOCUMENT_FLOW.mount(host),true);
 return {host,window,events,localStorage};
}
function record(state='sent',kind='equipment'){
 return {id:'demo-1',recipient:'elena',kind,state,created:1700000000000,
  revisions:[{number:1,body:'Учебный документ для проверки без настоящей отправки.',at:1700000000000,note:'Исходный учебный текст'}],
  log:[{at:1700000000000,text:'Учебный запрос создан'}]};
}
test('three visual document miniatures select actual request type and recipient',()=>{
 const f=fixture();
 assert.equal(cls(f.host,'svdf-journey').length,1);
 assert.equal(cls(f.host,'svdf-journey-step').length,4);
 assert.ok(cls(f.host,'svdf-journey-step').every(x=>x.dataset.phase==='sample'));
 const cards=cls(f.host,'svdf-template-card');
 assert.equal(cards.length,3);
 assert.equal(cls(f.host,'svdf-template-paper').length,3);
 const contract=cards.find(x=>x.dataset.kind==='supplier');
 contract.click();
 assert.equal(contract.attributes['aria-pressed'],'true');
 assert.ok(cards.filter(x=>x!==contract).every(x=>x.attributes['aria-pressed']==='false'));
 assert.ok(cls(f.host,'svdf-recipient').length);
 action(f.host,'Передать на согласование · демо').click();
 const records=f.window.SEYVEO_DOCUMENT_FLOW.getRecords();
 assert.equal(records.length,1);
 assert.equal(records[0].kind,'supplier');
 assert.equal(records[0].state,'sent');
 assert.deepEqual(cls(f.host,'svdf-journey-step').map(x=>x.dataset.phase),
  ['done','active','pending','pending']);
 assert.ok(cls(f.host,'svdf-record-icon')[0].children.length);
 assert.equal(cls(f.host,'svdf-footnote').length,0);
});
test('document preview uses actual fictional text on white paper; history preserved',()=>{
 const f=fixture({initial:[record('read')]});
 action(f.host,'Открыть документ').click();
 assert.equal(cls(f.host,'svdf-paper').length,1);
 assert.equal(cls(f.host,'svdf-paper-brand')[0].textContent,'SEYVEO · УЧЕБНЫЙ ОБРАЗЕЦ');
 assert.match(cls(f.host,'svdf-document-body')[0].textContent,/Учебный документ/);
 assert.ok(cls(f.host,'svdf-paper-version').length);
 assert.ok(cls(f.host,'svdf-versions').length);
 assert.ok(cls(f.host,'svdf-log').length);
});
test('employee decision advances only demo state, without electronic signature',()=>{
 const f=fixture({employee:true,initial:[record()]});
 assert.equal(cls(f.host,'svdf-template-card').length,0);
 action(f.host,'Открыть документ').click();
 assert.equal(f.window.SEYVEO_DOCUMENT_FLOW.getRecords()[0].state,'read');
 assert.deepEqual(cls(f.host,'svdf-journey-step').map(x=>x.dataset.phase),
  ['done','done','active','pending']);
 action(f.host,'Согласовать').click();
 assert.equal(f.window.SEYVEO_DOCUMENT_FLOW.getRecords()[0].state,'approved');
 assert.deepEqual(cls(f.host,'svdf-journey-step').map(x=>x.dataset.phase),
  ['done','done','done','pending']);
 assert.match(cls(f.host,'svdf-journey-caption')[0].textContent,/подпись не выполнена/);
});
test('return with remarks is displayed as a distinct illustrated decision state',()=>{
 const f=fixture({employee:true,initial:[record('read')]});
 action(f.host,'Открыть документ').click();
 action(f.host,'Вернуть с замечанием').click();
 const input=cls(f.host,'svdf-return-input')[0];
 assert.ok(input);
 input.value='Требуется исправить сроки поставки';
 action(f.host,'Отправить замечание').click();
 assert.equal(f.window.SEYVEO_DOCUMENT_FLOW.getRecords()[0].state,'returned');
 assert.equal(cls(f.host,'svdf-journey-step')[2].dataset.phase,'returned');
 assert.match(cls(f.host,'svdf-journey-caption')[0].textContent,/замечанием/);
});
test('approval illustration remains scoped and explicitly discloses demo limitations',()=>{
 for(const name of ['svdf-journey','svdf-journey-step','svdf-template-gallery',
  'svdf-template-paper','svdf-paper','svdf-recipient'])
  assert.ok(css.includes('#sayviSurfacePage .'+name));
 assert.doesNotMatch(css,/#(?:navHome|navTasks|navManage)|footer\.dock/);
 assert.match(code,/Демо · не загружайте настоящие документы/);
 assert.match(code,/без шифрования, без серверной отправки, проверки ролей/);
 assert.match(code,/КЭП пока не выполнена/);
 assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
