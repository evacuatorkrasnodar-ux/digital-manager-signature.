/* SEYVEO: sample mail renders in the EXISTING Home Living Ink decision-card.
 * Validate recipient/body review, editable draft, detail route, Later,
 * reset isolation, and absence of any external send.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const code=fs.readFileSync('assets/home-mail-demo.js','utf8');
const styles=fs.readFileSync('assets/home-mail-demo.css','utf8');
const surfaces=fs.readFileSync('assets/sayvi-surfaces.js','utf8');
new vm.Script(code,{filename:'home-mail-demo.js'});
assert.match(html,/assets\/home-mail-demo\.js\?v=1/);
assert.match(html,/assets\/home-mail-demo\.css\?v=1/);
assert.match(html,/window\.SEYVEO_HOME_MAIL_DEMO\.renderInto\(\$\('dynamic'\)\)/);
assert.match(html,/window\.addEventListener\('seyveo:demo-mode-changed',render\)/);
assert.match(surfaces,/window\.SEYVEO_HOME_MAIL_DEMO\?\.renderDetail\?\.\(body\)/);
assert.match(styles,/#homePage #dynamic \.sv-home-mail-card/);
assert.doesNotMatch(code.replace(/\/\*[\s\S]*?\*\//g,''),/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|navigator\.share)\b/,'No message transmission or persistent letter data');
class N {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.textContent='';this.value='';this.hidden=false;
  this.dataset={};this.children=[];this.listeners={};this.className='';this.attrs={};this.style={};this.id='';this.lastFocus=false;}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=[...nodes]}
 insertBefore(child,node){let i=this.children.indexOf(node);if(i<0)this.children.push(child);else this.children.splice(i,0,child)}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 click(){for(const fn of this.listeners.click??[])fn({preventDefault(){},stopPropagation(){}})}
 querySelector(s){
  if(s==='.personal-tasks-panel')return this.children.find(x=>x.className==='personal-tasks-panel')||null;
  if(s.startsWith('.'))return find(this,x=>x.className?.split(/\s+/).includes(s.slice(1)));
  return null
 }
}
function find(root,predicate){for(const child of root.children){if(predicate(child))return child;const deep=find(child,predicate);if(deep)return deep;}return null}
const home=new N(),dyn=new N(),tasks=new N(),panel=new N(),nav=new N('button');
panel.className='personal-tasks-panel';tasks.append(panel);
const lookup={homePage:home,dynamic:dyn,tasksPage:tasks,navHome:nav,seyveoDemoMailLater:null};
const doc={getElementById(id){if(id==='seyveoDemoMailLater')return find(tasks,x=>x.id===id);return lookup[id]||null},createElement(tag){return new N(tag)}};
let demo=true,route='',navCount=0;
const listeners={};nav.addEventListener('click',()=>navCount++);
const win={SEYVEO_DEMO_MODE:{isEnabled:()=>demo},addEventListener:(k,fn)=>{(listeners[k]??=[]).push(fn)},
 dispatchEvent(event){for(const fn of listeners[event.type]||[])fn(event);}};
class Event{constructor(type){this.type=type}}
const location={set hash(v){route=v},get hash(){return route}};
vm.runInNewContext(code,{document:doc,window:win,Event,location},{timeout:1800});
const api=win.SEYVEO_HOME_MAIL_DEMO;
assert.deepEqual(Object.keys(api.kinds).sort(),['client','document','mail','reminder','task'].sort(),'Fixed reusable card families');
assert.equal(api.isVisible(),true);
api.renderInto(dyn);
let card=dyn.children[0];
assert.equal(card.className,'decision-card sv-home-mail-card','Original Home Living Ink decision-card reused');
assert.equal(card.dataset.ownerAdvice,'true','Existing Living Moment material and arrival reused');
function btn(kind){const item=find(dyn,x=>x.dataset.mailAction===kind);assert.ok(item,'Button '+kind);return item}
btn('send').click();
assert.equal(api.state().phase,'confirm');
api.renderInto(dyn);
assert.ok(find(dyn,x=>x.className==='sv-home-mail-check'),'Recipient/subject/body review shown');
assert.ok(find(dyn,x=>x.textContent.includes('адрес не подключён')));
btn('cancel').click();
assert.equal(api.state().phase,'inbox');
api.renderInto(dyn);
btn('edit').click();
api.renderInto(dyn);
const input=find(dyn,x=>x.tagName==='TEXTAREA');
assert.ok(input,'Existing Home card expands inline for editing');
input.value='Добрый день. Уточните точный адрес.';
btn('save').click();
assert.equal(api.state().draft,input.value);
api.renderInto(dyn);
btn('details').click();
assert.equal(route,'#sayvi-mail','Подробнее routes to existing Mail workspace');
const detailRoot=new N();
assert.equal(api.renderDetail(detailRoot),true);
assert.ok(find(detailRoot,x=>x.textContent.includes('Здравствуйте! Подскажите')));
assert.ok(find(detailRoot,x=>x.textContent.includes(input.value)));
api.renderInto(dyn);
btn('later').click();
assert.equal(api.isVisible(),false,'Later hides from Home');
assert.equal(doc.getElementById('seyveoDemoMailLater').hidden,false,'Later goes to demo-only Tasks panel');
assert.equal(panel, tasks.children[tasks.children.length-1],'Real personal Tasks untouched');
const deferred=doc.getElementById('seyveoDemoMailLater');
const restore=find(deferred,x=>x.dataset.mailAction==='restore');
assert.ok(restore);restore.click();
assert.equal(api.isVisible(),true);
assert.ok(navCount>0,'Return to Home triggered');
api.renderInto(dyn);
btn('send').click();api.renderInto(dyn);
btn('confirm').click();
assert.equal(api.state().phase,'done','Only fake confirmation reaches done');
api.renderInto(dyn);
assert.ok(find(dyn,x=>x.textContent.includes('Никому не отправлено')));
for(const fn of listeners['seyveo:demo-mode-reset']||[])fn({});
assert.equal(api.state().phase,'inbox','Demos reset on mode OFF');
assert.ok(api.state().draft.includes('адрес доставки'),'Edited draft discarded safely');
demo=false;
assert.equal(api.isVisible(),false);
assert.equal(api.renderDetail(new N()),false);
assert.equal(doc.getElementById('seyveoDemoMailLater').hidden,true);
console.log('PASS prebuilt Living Ink mail: draft editing, recipient review, original letter, Later in Tasks, no external send, no card redesign.');
