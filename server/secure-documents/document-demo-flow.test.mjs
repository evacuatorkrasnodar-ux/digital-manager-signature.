import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../../assets/seyveo-document-flow.js',import.meta.url),'utf8');
class Node {
 constructor(tag){
  this.tagName=tag.toUpperCase();this.className='';this.children=[];
  this.handlers={};this.dataset={};this.attrs={};this._text='';
  this.value='';this.classList={add:()=>{}};
 }
 set textContent(value){this._text=String(value);this.children=[]}
 get textContent(){return this._text+this.children.map(e=>e?.textContent||'').join('')}
 get childElementCount(){return this.children.length}
 append(...nodes){this.children.push(...nodes);for(const n of nodes)if(n&&typeof n==='object')n.parentNode=this}
 replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 addEventListener(name,listener){(this.handlers[name]??=[]).push(listener)}
 setAttribute(name,value){this.attrs[name]=value}
 click(){for(const listener of this.handlers.click||[])listener({target:this})}
 dispatch(name){for(const listener of this.handlers[name]||[])listener({target:this})}
}
function launch(storage=new Map(),{failWrites=false,employeePreview=false}={}){
 const events=[];
 const localStorage={
  getItem:key=>storage.get(key)||null,
  setItem:(key,value)=>{if(failWrites)throw new Error('disk full');storage.set(key,value)},
  removeItem:key=>storage.delete(key)
 };
 const window={addEventListener(){},dispatchEvent:e=>events.push(e),
  confirm:()=>true,SEYVEO_PREVIEW:{isEmployee:()=>employeePreview},SEYVEO_UNIFIED_TASKS:{openChat(){}}};
 const context={window,localStorage,
  document:{createElement:tag=>new Node(tag)},
  CustomEvent:class{constructor(name,options){this.type=name;this.detail=options.detail}}
 };
 runInNewContext(source,context,{filename:'seyveo-document-flow.js'});
 const host=new Node('div');
 const flow=window.SEYVEO_DOCUMENT_FLOW;
 assert.equal(flow.mount(host),true);
 const find=predicate=>{
  const found=[];const visit=node=>{if(predicate(node))found.push(node);
   for(const child of node.children||[])visit(child)};
  visit(host);return found;
 };
 const press=label=>{
  const found=find(node=>node.tagName==='BUTTON'&&node.textContent===label);
  assert.equal(found.length,1,'Expected unique control '+label);
  found[0].click();
 };
 return {flow,host,find,press,storage,events};
}
test('acknowledgement requires read step, then moves to completed archive',()=>{
 const demo=launch();
 demo.press('Передать Елене · демо');
 const record=demo.flow.getRecords()[0];
 assert.equal(record.state,'sent');
 demo.flow.setRole('employee');
 assert.equal(demo.flow.select(record.id),true);
 assert.equal(demo.find(x=>x.tagName==='BUTTON'&&x.textContent==='Подтвердить ознакомление').length,0);
 demo.press('Отметить как прочитанное');
 assert.equal(demo.flow.get(record.id).state,'read');
 demo.press('Подтвердить ознакомление');
 assert.equal(demo.flow.get(record.id).state,'approved');
 assert.equal(demo.flow.get(record.id).log.length,3);
 demo.flow.setRole('manager');
 demo.press('Завершены · 1');
 assert.match(demo.host.textContent,/Ознакомление подтверждено/);
 assert.deepEqual(demo.events.map(e=>e.detail.reason),['created','status','status']);
});
test('return requires written reason, persists full text and cannot be confirmed again',()=>{
 const storage=new Map(),demo=launch(storage);
 const select=demo.find(n=>n.tagName==='SELECT')[0];
 assert.ok(select);select.value='equipment';select.dispatch('change');
 demo.press('Передать Елене · демо');
 const id=demo.flow.getRecords()[0].id;
 demo.flow.setRole('employee');demo.flow.select(id);
 demo.press('Отметить как прочитанное');
 demo.press('Вернуть с замечанием');
 let field=demo.find(n=>n.tagName==='TEXTAREA')[0];
 assert.ok(field);
 field.value='нет';field.dispatch('input');
 demo.press('Отправить замечание');
 assert.equal(demo.flow.get(id).state,'read');
 field=demo.find(n=>n.tagName==='TEXTAREA')[0];
 field.value='Неверная сумма в учебном акте, требуется исправить.';
 field.dispatch('input');
 demo.press('Отправить замечание');
 assert.equal(demo.flow.get(id).state,'returned');
 assert.match(demo.flow.get(id).log.at(-1).text,/Неверная сумма/);
 assert.equal(demo.find(n=>n.tagName==='BUTTON'&&n.textContent==='Согласовать').length,0);
 const reopened=launch(storage);
 assert.equal(reopened.flow.get(id).state,'returned');
 assert.match(reopened.flow.get(id).log.at(-1).text,/Неверная сумма/);
});
test('when local storage is full, failed new request does not lose old records',()=>{
 const storage=new Map();
 const rows=Array.from({length:25},(_,i)=>({id:'demo-'+i,kind:'schedule',
  recipient:'elena',state:'sent',created:Date.now(),
  log:[{at:Date.now(),text:'test'}]}));
 storage.set('seyveo-document-flow-training-v1',JSON.stringify(rows));
 const demo=launch(storage,{failWrites:true});
 demo.press('Передать Елене · демо');
 assert.equal(demo.flow.getRecords().length,25);
 assert.ok(demo.flow.get('demo-0'));
 assert.match(demo.host.textContent,/Не удалось сохранить/);
});

test('employee and director open their own demo document view automatically',()=>{
 const storage=new Map();
 const manager=launch(storage);
 manager.press('Передать Елене · демо');
 assert.match(manager.host.textContent,/Отправленные документы/);
 const employee=launch(storage,{employeePreview:true});
 assert.match(employee.host.textContent,/Мои входящие/);
 assert.equal(employee.find(x=>x.tagName==='BUTTON'&&x.textContent==='Передать Елене · демо').length,0);
 const reopenedManager=launch(storage);
 assert.match(reopenedManager.host.textContent,/Отправленные документы/);
 assert.equal(reopenedManager.flow.getRecords().length,1);
});


test('director revises returned training text and Elena signs off only on new edition',()=>{
 const storage=new Map(),manager=launch(storage);
 const select=manager.find(n=>n.tagName==='SELECT')[0];
 select.value='equipment';select.dispatch('change');
 manager.press('Передать Елене · демо');
 const id=manager.flow.getRecords()[0].id;
 const original=manager.flow.get(id).revisions[0].body;
 manager.flow.setRole('employee');manager.flow.select(id);
 manager.press('Отметить как прочитанное');
 manager.press('Вернуть с замечанием');
 const reason=manager.find(n=>n.tagName==='TEXTAREA')[0];
 reason.value='Уточните сроки поставки оборудования.';
 reason.dispatch('input');
 manager.press('Отправить замечание');
 assert.equal(manager.flow.get(id).state,'returned');
 manager.flow.setRole('manager');
 assert.match(manager.host.textContent,/В работе · 1/);
 manager.flow.select(id);
 manager.press('Исправить и отправить повторно');
 let boxes=manager.find(n=>n.tagName==='TEXTAREA');
 assert.equal(boxes.length,2);
 boxes[1].value='Добавлены сроки и номер проверки.';
 boxes[1].dispatch('input');
 manager.press('Отправить новую редакцию · демо');
 assert.equal(manager.flow.get(id).state,'returned','unchanged body must not be resent');
 boxes=manager.find(n=>n.tagName==='TEXTAREA');
 boxes[0].value=original+' Сроки передачи уточнены в учебном тексте.';
 boxes[0].dispatch('input');
 manager.press('Отправить новую редакцию · демо');
 assert.equal(manager.flow.get(id).state,'sent');
 assert.equal(manager.flow.get(id).revisions.length,2);
 assert.equal(manager.flow.get(id).revisions[0].body,original);
 assert.match(manager.flow.get(id).revisions[1].body,/Сроки передачи уточнены/);
 assert.match(manager.flow.get(id).log.at(-1).text,/редакцию №2/);
 assert.equal(manager.events.at(-1).detail.reason,'revision');
 manager.flow.setRole('employee');
 manager.flow.select(id);
 assert.match(manager.host.textContent,/Сроки передачи уточнены/);
 assert.equal(manager.find(n=>n.tagName==='BUTTON'&&n.textContent==='Согласовать').length,0);
 manager.press('Отметить как прочитанное');
 manager.press('Согласовать');
 assert.equal(manager.flow.get(id).state,'approved');
 const reopened=launch(storage);
 assert.equal(reopened.flow.get(id).state,'approved');
 assert.equal(reopened.flow.get(id).revisions.length,2);
 assert.match(reopened.flow.get(id).revisions[1].body,/Сроки передачи уточнены/);
});
test('failed resubmission leaves previous returned revision and log intact',()=>{
 const storage=new Map();
 const initial=[{id:'demo-revision-1',kind:'equipment',recipient:'elena',state:'returned',
  created:Date.now(),log:[{at:Date.now(),text:'Елена вернула с замечанием: Нужно исправить сумму.'}]}];
 storage.set('seyveo-document-flow-training-v1',JSON.stringify(initial));
 const demo=launch(storage,{failWrites:true});
 assert.equal(demo.flow.get('demo-revision-1').revisions.length,1);
 demo.flow.select('demo-revision-1');
 demo.press('Исправить и отправить повторно');
 const fields=demo.find(n=>n.tagName==='TEXTAREA');
 assert.equal(fields.length,2);
 fields[0].value+=' Исправленная сумма по акту.';
 fields[0].dispatch('input');
 fields[1].value='Сумма уточнена.';
 fields[1].dispatch('input');
 demo.press('Отправить новую редакцию · демо');
 assert.equal(demo.flow.get('demo-revision-1').state,'returned');
 assert.equal(demo.flow.get('demo-revision-1').revisions.length,1);
 assert.equal(demo.flow.get('demo-revision-1').log.length,1);
 assert.match(demo.host.textContent,/Не удалось сохранить/);
});
test('legacy records without revisions gain original sample without data loss',()=>{
 const storage=new Map();
 const input=[{id:'demo-legacy',kind:'schedule',recipient:'elena',state:'approved',
  created:Date.now(),log:[{at:Date.now(),text:'Legacy done'}]}];
 storage.set('seyveo-document-flow-training-v1',JSON.stringify(input));
 const demo=launch(storage);
 const found=demo.flow.get('demo-legacy');
 assert.equal(found.state,'approved');
 assert.equal(found.revisions.length,1);
 assert.match(found.revisions[0].body,/График смен/);
});
