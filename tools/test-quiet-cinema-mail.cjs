/* SEYVEO: original Quiet Cinema, THREE cards, mail adds controls in-place.
 * Fake DOM exercises real original module without external emails or device writes.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/living-moment.js','utf8');
const style=fs.readFileSync('assets/living-moment.css','utf8');
const html=fs.readFileSync('index.html','utf8');
new vm.Script(source,{filename:'assets/living-moment.js'});
const sampleKinds=['contract','mail','health'];
for(const kind of sampleKinds)assert.match(source,new RegExp("kind:'"+kind+"'"),'Original card '+kind+' preserved');
assert.match(source,/previewScene=createSurface\(sample\[0\],sample\.slice\(1\)\)/,'Original three-card queue remains');
assert.match(source,/space\.classList\.add\('lm-gather'\)/,'Gathering animation remains');
assert.match(source,/window\.SEYVEO_SAYVI_SURFACES/,'Mail opens existing Mail page');
assert.match(source,/setMailDeferred\(true\)/,'Later is a real in-memory demo choice');
assert.match(html,/assets\/living-moment\.js\?v=54/);
assert.match(html,/assets\/living-moment\.css\?v=40/);
assert.doesNotMatch(html,/assets\/home-mail-demo\.(?:js|css)/,'No competing Home card module');
assert.match(style,/#seyveoLivingMoment\.lm-condense \.lm-mail-content\{display:none!important\}/,
 'Mail content must disappear with original card condensation');
assert.match(style,/#seyveoLivingMoment:not\(\.lm-condense\)/,
 'Mail cannot override original condensation');
assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/,'No actual mail transmission');
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
 addEventListener(){},scrollTo(){},setTimeout:(fn,ms)=>{const id=timers.length+1;timers.push({fn,ms,id});return id}
};
const location={hash:''};
let mailOpen=0;win.SEYVEO_SAYVI_SURFACES={open:kind=>{assert.equal(kind,'mail');mailOpen++;return true}};
let navClicks=0;navHome.addEventListener('click',()=>navClicks++);
const MutationObserver=class{observe(){}};
vm.runInNewContext(source,{document:doc,window:win,location,MutationObserver,
 queueMicrotask(){},clearTimeout(){},Date,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}}},{timeout:1700});
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
assert.equal(originalActions.filter(b=>!b.hidden).length,2,'Document card has original two actions');
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
b('Позже').click();const later=walk(tasks,x=>x.id==='seyveoPreviewMailLater');
assert.ok(later&&!later.hidden,'Deferred test mail is available in Tasks');
assert.equal(tasks.children[tasks.children.length-1],personal,'Existing personal task panel not replaced');
assert.equal(tiles.children.length,1,'No cloned or competing Home card ever created');
console.log('PASS original three-card Quiet Cinema, mail actions, review, edit, details, later and unchanged Tasks list.');
