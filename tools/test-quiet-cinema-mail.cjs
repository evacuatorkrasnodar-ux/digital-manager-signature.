/* SEYVEO: original Quiet Cinema, THREE cards, mail adds controls in-place.
 * Fake DOM exercises real original module without external emails or device writes.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/living-moment.js','utf8');
const tasksSource=fs.readFileSync('assets/personal-tasks.js','utf8');
const style=fs.readFileSync('assets/living-moment.css','utf8');
const html=fs.readFileSync('index.html','utf8');
new vm.Script(source,{filename:'assets/living-moment.js'});
const sampleKinds=['contract','mail','health'];
for(const kind of sampleKinds)assert.match(source,new RegExp("kind:'"+kind+"'"),'Original card '+kind+' preserved');
assert.match(source,/previewScene=createSurface\(sample\[0\],sample\.slice\(1\)\)/,'Original three-card queue remains');
assert.match(source,/space\.classList\.add\('lm-gather'\)/,'Gathering animation remains');
assert.match(source,/window\.SEYVEO_SAYVI_SURFACES/,'Mail opens existing Mail page');
assert.match(source,/setMailDeferred\(true\)/,'Later is a real in-memory demo choice');
assert.match(html,/assets\/living-moment\.js\?v=56/);
assert.match(html,/assets\/living-moment\.css\?v=41/);
assert.match(html,/assets\/personal-tasks\.js\?v=23/);
assert.match(html,/assets\/personal-tasks\.css\?v=20/);
assert.doesNotMatch(html,/assets\/home-mail-demo\.(?:js|css)/,'No competing Home card module');
assert.match(style,/#seyveoLivingMoment\.lm-condense \.lm-mail-content\{display:none!important\}/,
 'Mail content must disappear with original card condensation');
assert.match(style,/#seyveoLivingMoment:not\(\.lm-condense\)/,
 'Mail cannot override original condensation');
assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/,'No actual mail transmission');
assert.match(tasksSource,/function deferredPreviewRow/,'All deferred previews share original Tasks list');
assert.match(tasksSource,/postponed\.forEach\(task=>list\.append\(row\(task,false,true\)\)\)/,'No second real-task store');
assert.doesNotMatch(source,/item=create\('section','lm-mail-later'\)/,'Old separate deferred tiles must stay removed');
class Node{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.className='';this.children=[];this.listeners={};
  this.dataset={};this.attrs={};this.style={setProperty(){}};this.hidden=false;this.textContent='';this.value='';
  this._classes=new Set();this.id='';this.disabled=false;
  this.classList={
   add:(...c)=>c.forEach(x=>this._classes.add(x)),
   remove:(...c)=>c.forEach(x=>this._classes.delete(x)),
   contains:c=>this._classes.has(c)||this.className.split(/\s+/).includes(c),
   toggle:(c,on)=>{if(on===false)this._classes.delete(c);else this._classes.add(c)}
  };
 }
 append(...nodes){this.children.push(...nodes)}
 prepend(node){this.children.unshift(node)}
 replaceChildren(...nodes){this.children=[...nodes]}
 insertBefore(node,reference){let i=this.children.indexOf(reference);if(i<0)this.children.push(node);else this.children.splice(i,0,node)}
 remove(){this.hidden=true}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 click(){for(const fn of this.listeners.click??[])fn({preventDefault(){},stopPropagation(){}})}
 querySelector(sel){
  if(sel.startsWith('.'))return walk(this,x=>x.className.split(/\s+/).includes(sel.slice(1))||x._classes.has(sel.slice(1)));
  if(sel==='textarea')return walk(this,x=>x.tagName==='TEXTAREA');
  return null;
 }
 contains(node){return this===node||this.children.some(c=>c===node||c.contains?.(node))}
 matches(){return false}
 getBoundingClientRect(){return {top:110}}
}
function walk(parent,p){for(const c of parent.children){if(p(c))return c;const r=walk(c,p);if(r)return r}return null}
const home=new Node(),stage=new Node(),dynamic=new Node(),space=new Node(),tiles=new Node();
const tip=new Node(),tasks=new Node(),personal=new Node(),navHome=new Node('button');
personal.className='personal-tasks-panel';tasks.append(personal);
const nodes={homePage:home,stage,dynamic,seyveoLivingMoment:space,seyveoLivingTiles:tiles,seyveoLivingCaption:tip,tasksPage:tasks,navHome};
const doc={hidden:false,activeElement:null,documentElement:new Node(),querySelector(){return null},
 getElementById:id=>nodes[id]||walk(tasks,x=>x.id===id),createElement:tag=>new Node(tag),
 createElementNS:(ns,tag)=>new Node(tag),addEventListener(){}};
const timers=[];
const win={
 matchMedia:()=>({matches:false}),innerHeight:820,visualViewport:{height:820},
 addEventListener(){},dispatchEvent(){},scrollTo(){},setTimeout:(fn,ms)=>{const id=timers.length+1;timers.push({fn,ms,id});return id}
};
const location={hash:''};
let mailOpen=0,documentOpen=0;win.SEYVEO_SAYVI_SURFACES={open:kind=>{if(kind==='mail')mailOpen++;else if(kind==='contract')documentOpen++;else assert.fail('Unknown surface: '+kind);return true}};
let navClicks=0;navHome.addEventListener('click',()=>navClicks++);
const MutationObserver=class{observe(){}};
vm.runInNewContext(source,{document:doc,window:win,location,MutationObserver,
 queueMicrotask(){},clearTimeout(){},Date,Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}}},{timeout:1700});
const api=win.SEYVEO_LIVING_MOMENT;assert.ok(api);
assert.equal(api.preview(),true,'Original rising preview starts');
assert.equal(api.state(),'preview');
const field=walk(tiles,x=>x.className==='lm-field');
assert.ok(field,'ONE existing Living Ink field');
assert.ok(walk(field,x=>x.className==='lm-primary'),'Original large card remains');
let rows=[];function all(node,p,out=[]){for(const c of node.children){if(p(c))out.push(c);all(c,p,out)}return out}
rows=all(field,x=>x.className==='lm-inline-item');
assert.equal(rows.length,2,'Two original other preview cards beneath primary = three');
assert.deepEqual(rows.map(r=>r.dataset.lmKind),['mail','health']);
assert.equal(field.dataset.lmSubject,'contract');
const originalActions=all(field,x=>x.className.startsWith('lm-polymer'));
assert.equal(originalActions.filter(b=>!b.hidden).length,4,'Document card has four in-place actions');
const documentDetails=walk(field,x=>x.className==='lm-document-content');
assert.ok(documentDetails&&!documentDetails.hidden,'Contract excerpt lives in original field');
const documentAction=label=>{
 const button=all(field,x=>x.className.startsWith('lm-polymer')).find(x=>x.textContent===label&&!x.hidden);
 assert.ok(button,'Document action '+label);return button;
};
documentAction('Проверить').click();
documentAction('Исправить').click();
const documentInput=walk(documentDetails,x=>x.tagName==='TEXTAREA');
assert.ok(documentInput,'Document comment edited in place');
documentInput.value='Уточнить срок поставки.';
documentAction('Сохранить').click();
assert.ok(all(documentDetails,x=>(x.textContent||'').includes('Уточнить срок поставки.')).length,'Suggestion stays in demo');
documentAction('Подробнее').click();
assert.equal(documentOpen,1,'Document opens the existing document center');
rows[0].click();
let timer=timers.find(t=>t.ms===400);assert.ok(timer,'Original morph animation triggered');
timer.fn();
assert.equal(field.dataset.lmSubject,'mail','Original Mail item becomes featured');
assert.equal(all(field,x=>x.className.startsWith('lm-polymer')).filter(b=>!b.hidden).length,4,
 'Mail has exactly four active actions, same field');
const b=label=>{const found=all(field,x=>x.className.startsWith('lm-polymer')).find(x=>x.textContent===label&&!x.hidden);assert.ok(found,'Action '+label);return found};
assert.equal(b('Отправить').click(),undefined);
assert.ok(walk(field,x=>x.className==='lm-mail-address'),'Send first asks recipient review');
b('Исправить').click();
let edit=walk(field,x=>x.tagName==='TEXTAREA');assert.ok(edit,'Compact editor is within existing card');
edit.value='Добрый день! Уточните адрес доставки.';
b('Сохранить').click();
assert.ok(all(field,x=>x.className==='lm-mail-draft').some(x=>x.textContent===edit.value),'Edited draft appears');
b('Подробнее').click();assert.equal(mailOpen,1,'Details navigates to existing Mail page');
b('Позже').click();
assert.equal(api.deferred().length,1,'The test mail is published for the ONE existing Tasks list');
assert.equal(api.deferred()[0].kind,'mail','Deferred training item remains distinct from real saved tasks');
assert.equal(walk(tasks,x=>x.id==='seyveoPreviewMailLater'),null,'No separate demonstration card on Tasks screen');
assert.equal(tasks.children[tasks.children.length-1],personal,'Existing personal task panel not replaced');
assert.equal(tiles.children.length,1,'No cloned or competing Home card ever created');
console.log('PASS original three-card Quiet Cinema, mail actions, review, edit, details, later and unchanged Tasks list.');

/* Twenty real locally saved Tasks (not twenty fabricated mail/documents):
 * only three may occupy the original Home scene; snooze reveals the next.
 * No item is accidentally marked complete, and the original two other cards
 * remain untouched in the initial three-card preview above. */
{
 const home2=new Node(),stage2=new Node(),dynamic2=new Node(),space2=new Node(),tiles2=new Node(),caption2=new Node(),tasks2=new Node();
 const ids={homePage:home2,stage:stage2,dynamic:dynamic2,seyveoLivingMoment:space2,seyveoLivingTiles:tiles2,seyveoLivingCaption:caption2,tasksPage:tasks2};
 const doc2={hidden:false,activeElement:null,documentElement:new Node(),querySelector(){return null},
  getElementById:id=>ids[id]||null,createElement:tag=>new Node(tag),createElementNS:(ns,tag)=>new Node(tag),addEventListener(){}};
 const taskTimers=[];
 const win2={matchMedia:()=>({matches:false}),innerHeight:820,visualViewport:{height:820},
  addEventListener(){},dispatchEvent(){},setTimeout:(fn,ms)=>{taskTimers.push({fn,ms});return taskTimers.length}};
 const twenty=Array.from({length:20},(_,i)=>({id:'example-'+i,title:'Дело '+(i+1),done:false,due:'2020-01-01'}));
 const storage={getItem:key=>key==='seyveo-personal-tasks-v1'?JSON.stringify(twenty):null};
 vm.runInNewContext(source,{document:doc2,window:win2,location:{hash:''},MutationObserver,
  queueMicrotask:fn=>fn(),clearTimeout(){},localStorage:storage,Date,Event:class{constructor(type){this.type=type}},
  CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}}},{timeout:1700});
 const taskField=walk(tiles2,x=>x.className==='lm-field');
 assert.ok(taskField,'Actual saved tasks use only one Quiet Cinema field');
 const taskRows=all(taskField,x=>x.className==='lm-inline-item');
 assert.equal(taskRows.length,2,'At most one main and two next recommendations');
 const meter=walk(taskField,x=>x.className==='lm-field-measure');
 assert.equal(meter.textContent,'3 ИЗ 20 · ВАШИ ДЕЛА','Seventeen real tasks remain queued, not rendered');
 const postpone=all(taskField,x=>x.className.startsWith('lm-polymer'))
  .find(x=>x.textContent==='Позже'&&!x.hidden);
 assert.ok(postpone,'A real task may be deferred');
 postpone.click();
 const swap=taskTimers.find(t=>t.ms===420);
 assert.ok(swap,'Original morph transition used for queue');
 swap.fn();
 assert.equal(meter.textContent,'3 ИЗ 19 · ВАШИ ДЕЛА','Next task enters after decision');
 assert.ok(win2.SEYVEO_LIVING_MOMENT.deferredTaskIds().includes('example-0'),'Snoozed item is visible to the ONE Tasks list');
 const freshRows=all(taskField,x=>x.className==='lm-inline-item');
 assert.equal(freshRows.length,2);
 assert.ok(freshRows[1].classList.contains('lm-next-arrive'),'The new queue item rises from below');
 assert.equal(twenty[0].done,false,'Deferring does not falsely complete the original task');
 assert.equal(tiles2.children.length,1,'No second queue or cloned Home card');
}
assert.match(style,/lm-queue-arrive/,'New queue entry has its own restrained rising animation');
console.log('PASS twenty-item Home queue, three visible, next rises after deferral, no fake completion.');
