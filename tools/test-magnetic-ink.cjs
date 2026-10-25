/* SEYVEO · Permanent destinations in one dock; no swipe-page carousel.
 * Isolated DOM simulation + code contracts; verify on iPhone separately. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const html=read('index.html');
const source=read('assets/magnetic-ink-dock.js');
const nav=read('assets/floating-navigation.css');
const music=read('assets/seyveo-music-dock.js');
const composer=read('assets/composer-intent.css');
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1);
assert.equal((html.match(/id="orbCluster"/g)||[]).length,1);
assert.ok(html.indexOf('assets/seyveo-music-dock.js')<html.indexOf('assets/magnetic-ink-dock.js'));
assert.match(html,/assets\/magnetic-ink-dock\.js\?v=\d+/);
assert.match(source,/event\.isTrusted/,'Programmatic native handlers preserved');
assert.doesNotMatch(source,/pointerdown|pointerup|switchPage\(/,'No rotating dock destinations');
assert.match(nav,/\.dock\.sv-magnetic-dock>\.nav-item\{/,'Only original dock is styled');
assert.doesNotMatch(nav,/sv-magnetic-ink-snap|sv-magnetic-reveal/);
assert.match(composer,/#assistantQuickrail\.assistant-quickrail\{display:none!important\}/);
assert.match(music,/sideIds=\['navHome','navTasks','navPicture','navManage'\]/);

function classList(){
 const active=new Set();
 return {add:x=>active.add(x),remove:x=>active.delete(x),
  contains:x=>active.has(x),toggle(x,condition){if(condition)active.add(x);else active.delete(x)}};
}
function element(id){
 const handlers={},attributes=new Map();
 return {
  id,hidden:false,dataset:{},innerHTML:'<svg></svg><span>Original</span>',
  title:'',tabIndex:0,classList:classList(),
  setAttribute(k,v){attributes.set(k,String(v))},
  getAttribute(k){return attributes.get(k)||null},
  removeAttribute(k){attributes.delete(k)},
  addEventListener(k,fn){(handlers[k]??=[]).push(fn)},
  click(){
   this.programmaticClicks=(this.programmaticClicks||0)+1;
   for(const fn of handlers.click||[])fn({isTrusted:false,preventDefault(){},stopImmediatePropagation(){}});
  },
  get listeners(){return handlers}
 };
}
const ids=['navHome','navTasks','navPicture','navManage','assistantButton','assistantQuickrail','assistantQuickTrack'];
const elements=Object.fromEntries(ids.map(id=>[id,element(id)]));
const dock=element('dock');
const windowEvents={},documentEvents={};
const windowMock={
  SEYVEO_MUSIC_DOCK:{isActive:()=>false},
  addEventListener(event,fn){(windowEvents[event]??=[]).push(fn)}
};
const documentMock={
  readyState:'complete',
  querySelector:q=>q==='footer.dock'?dock:null,
  getElementById:id=>elements[id]||null,
  addEventListener(event,fn){(documentEvents[event]??=[]).push(fn)}
};
const location={hash:''};
const context={window:windowMock,document:documentMock,location};
vm.runInNewContext(source,context,{filename:'magnetic-ink-dock.js'});
const api=windowMock.SEYVEO_MAGNETIC_INK;
assert.ok(api,'Fixed dock API registered');
assert.deepEqual(Array.from(api.groups()[0]),['home','tasks','world','manage']);
assert.equal(api.page(),0);
assert.equal(api.next(),false);assert.equal(api.previous(),false);
assert.deepEqual(ids.slice(0,4).map(id=>elements[id].dataset.svFixedAction),
 ['home','tasks','world','manage']);
assert.ok(elements.navHome.innerHTML.includes('Главная'));
assert.ok(elements.navTasks.innerHTML.includes('Дела'));
assert.ok(elements.navPicture.innerHTML.includes('Мой мир'));
assert.ok(elements.navManage.innerHTML.includes('Управление'));
assert.equal(elements.assistantQuickrail.inert,true,'Old second rail stays inert');
assert.equal(elements.assistantQuickTrack.tabIndex,-1);

function trusted(id){
 const node=elements[id],event={isTrusted:true,prevented:false,stopped:false,
  preventDefault(){this.prevented=true},
  stopImmediatePropagation(){this.stopped=true}};
 for(const fn of node.listeners.click||[])fn(event);
 assert.ok(event.prevented&&event.stopped,'A physical side tap is mapped exactly once');
}
trusted('navHome');
assert.equal(elements.navHome.programmaticClicks,1,'Home calls existing goHome handler');
trusted('navTasks');
assert.equal(elements.navTasks.programmaticClicks,1,'Tasks calls original task handler');
trusted('navPicture');
assert.equal(location.hash,'life','World routes directly');
trusted('navManage');
assert.equal(elements.navManage.programmaticClicks,1,'Manage uses original handler');

location.hash='#calendar'; // Browsers prepend # to location.hash assignments.
for(const fn of windowEvents.hashchange||[])fn();
assert.equal(elements.navPicture.getAttribute('aria-current'),'page','Calendar belongs to My World');
assert.equal(elements.navHome.getAttribute('aria-current'),null);
location.hash='';
for(const fn of windowEvents.hashchange||[])fn();
assert.equal(elements.navHome.getAttribute('aria-current'),'page','Home is always reachable');
const htmlBefore=elements.navHome.innerHTML;
for(const fn of windowEvents.hashchange||[])fn();
assert.equal(elements.navHome.innerHTML,htmlBefore,'Repeated route does not repaint SVG');

dock.classList.add('seyveo-music-dock');
elements.navHome.innerHTML='music control';
api.refresh();
assert.equal(elements.navHome.innerHTML,'music control','Music controls own same dock');
dock.classList.remove('seyveo-music-dock');
for(const fn of documentEvents['seyveo:music-dock-exit']||[])fn();
assert.ok(elements.navHome.innerHTML.includes('Главная'),'Normal Home dock is restored after music');
assert.equal(elements.assistantButton.innerHTML,'<svg></svg><span>Original</span>','Sayvi center is untouched');
console.log('PASS fixed SEYVEO dock: four stable destinations, one center, Music takeover, no swipe pages');
