/* SEYVEO Magnetic Ink · one physical dock, two or more magnetic action pages.
 * Source-level and isolated DOM behaviour; hardware iOS review still required. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const html=read('index.html');
const source=read('assets/magnetic-ink-dock.js');
const quick=read('assets/assistant-quick-swipe.js');
const nav=read('assets/floating-navigation.css');
const composer=read('assets/composer-intent.css');
const music=read('assets/seyveo-music-dock.js');
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1,'Original dock count remains one');
assert.equal((html.match(/id="orbCluster"/g)||[]).length,1,'The orb is never copied');
assert.ok(html.indexOf('assets/seyveo-music-dock.js')<html.indexOf('assets/magnetic-ink-dock.js'),'Music claims its controls first');
assert.match(html,/assets\/magnetic-ink-dock\.js\?v=\d+/);
assert.match(quick,/window\.SEYVEO_QUICK_ACTIONS=Object\.freeze/,'Saved actions reused, not duplicated');
assert.match(composer,/#assistantQuickrail\.assistant-quickrail\{display:none!important\}/,'Redundant upper action strip is retired');
assert.match(nav,/\.dock\.sv-magnetic-dock>\.nav-item\{/,'Only the original dock changes');
assert.match(source,/event\.isTrusted/,'Programmatic legacy navigation bypasses magnetic actions');
assert.match(source,/prefers-reduced-motion: reduce/,'Motion accessibility');
assert.match(source,/const BASIC=\['tasks','calendar','world','manage'\]/,'No redundant Home destination');
assert.match(music,/sideIds=\['navHome','navTasks','navPicture','navManage'\]/,'One real music dock');

function classList(){
 const set=new Set();
 return {
  add:x=>set.add(x),remove:x=>set.delete(x),
  contains:x=>set.has(x),toggle(x,on){if(on)set.add(x);else set.delete(x);}
 };
}
function element(id){
 const handlers={};
 const attrs=new Map();
 return {
  id,hidden:false,innerHTML:'<svg></svg><span>original</span>',dataset:{},classList:classList(),
  children:[],style:{},title:'',
  setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k)||null,
  removeAttribute:k=>attrs.delete(k),
  addEventListener:(k,fn)=>{(handlers[k]??=[]).push(fn)},
  append(child){this.children.push(child)},
  closest(selector){return selector==='.dock>.nav-item'&&id!=='assistantButton'?this:null},
  get listeners(){return handlers},
  click(){this.clicks=(this.clicks||0)+1;for(const fn of handlers.click||[])fn({isTrusted:false,preventDefault(){},stopImmediatePropagation(){},target:this});}
 };
}
const nodes=Object.fromEntries(['navHome','navTasks','assistantButton','navPicture','navManage','assistantQuickrail','assistantQuickTrack'].map(id=>[id,element(id)]));
nodes.assistantQuickrail.hidden=true;
const dock=element('dock');
const events={};
const quickApi={
 selected:()=>['event','note','music','history','world','notes'],
 details(id){
  const names={event:'Встреча',note:'Заметка',music:'Музыка',history:'История',notes:'Мои записи',health:'Здоровье',care:'Забота'};
  return names[id]?{name:names[id],description:'Открыть '+names[id],icon:'<path d="M4 4h16"/>'}:null;
 },
 run(id){quickApi.lastRun=id}
};
const windowMock={
 SEYVEO_QUICK_ACTIONS:quickApi,
 matchMedia:()=>({matches:false}),
 addEventListener(name,fn){(events[name]??=[]).push(fn)}
};
const documentMock={
 readyState:'complete',querySelector:q=>q==='footer.dock'?dock:null,
 getElementById:id=>nodes[id]||null,createElement:id=>element(id)
};
const context={window:windowMock,document:documentMock,location:{hash:''},Date};
vm.runInNewContext(source,context,{filename:'magnetic-ink-dock.js'});
const magnetic=windowMock.SEYVEO_MAGNETIC_INK;
assert.ok(magnetic,'Magnetic Ink registered');
assert.deepEqual(Array.from(magnetic.groups()[0]),['tasks','calendar','world','manage'],'Essentials always have four side slots');
assert.deepEqual(Array.from(magnetic.groups()[1]),['picture','event','note','music'],'Real favorite actions follow the essentials');
assert.equal(nodes.navHome.dataset.svMagneticAction,'tasks');
assert.equal(nodes.navTasks.dataset.svMagneticAction,'calendar');
assert.equal(nodes.navPicture.dataset.svMagneticAction,'world');
assert.equal(nodes.navManage.dataset.svMagneticAction,'manage');
assert.equal(dock.children.length,1,'Only a visually hidden announcement, no second dock');

function trustedClick(id){
 const node=nodes[id];
 for(const fn of node.listeners.click||[])fn({isTrusted:true,
  preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},target:node});
}
trustedClick('navHome');
assert.equal(nodes.navTasks.clicks,1,'First ink action opens real Tasks via existing handler');
assert.equal(nodes.navHome.clicks||0,0,'Trusted tap never invokes redundant Home');
assert.equal(magnetic.next(),true,'Swiping forward changes the magnetic page');
assert.equal(magnetic.page(),1);
assert.equal(nodes.navHome.dataset.svMagneticAction,'picture');
assert.equal(nodes.navTasks.dataset.svMagneticAction,'event');
assert.equal(nodes.navPicture.dataset.svMagneticAction,'note');
assert.equal(nodes.navManage.dataset.svMagneticAction,'music');
const before=magnetic.page();
const evt={target:nodes.assistantButton,clientX:200,clientY:30,pointerId:7,isPrimary:true};
for(const fn of dock.listeners.pointerdown||[])fn(evt);
for(const fn of dock.listeners.pointerup||[])fn({...evt,clientX:100});
assert.equal(magnetic.page(),before,'The center cannot initiate a swipe');
const sw={target:nodes.navPicture,clientX:190,clientY:25,pointerId:8,isPrimary:true};
for(const fn of dock.listeners.pointerdown||[])fn(sw);
for(const fn of dock.listeners.pointerup||[])fn({...sw,clientX:265,clientY:27});
assert.equal(magnetic.page(),0,'A rightward side swipe returns to essentials');
dock.classList.add('seyveo-music-dock');
magnetic.refresh();
assert.equal(magnetic.next(),false,'Music owns the dock, Magnetic Ink suspends');
dock.classList.remove('seyveo-music-dock');
magnetic.refresh();
assert.equal(nodes.navHome.dataset.svMagneticAction,'tasks');
assert.equal(nodes.assistantQuickrail.inert,true,'Invisible old rail cannot receive touch or keyboard focus');
assert.equal(nodes.assistantQuickTrack.tabIndex,-1);
magnetic.next();
context.location.hash='';
for(const fn of nodes.assistantButton.listeners.click||[])fn({isTrusted:true,target:nodes.assistantButton});
assert.equal(magnetic.page(),0,'Sayvi returns Home to the essential four without waiting for hashchange');
assert.equal(nodes.navHome.dataset.svMagneticAction,'tasks','The visible actions and page state stay in sync');
console.log('PASS Magnetic Ink: real actions, magnet pages, fixed center, Home reset, music isolation, no upper dock.');
