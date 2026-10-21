/* SEYVEO Standalone Home dock — WebKit scroll isolation regression.
 * Simulates view switching, not a substitute for an iPhone PWA test. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const rootDir=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(rootDir,'assets/floating-navigation.css'),'utf8');
const source=fs.readFileSync(path.join(rootDir,'assets/future-presence.js'),'utf8');
const html=fs.readFileSync(path.join(rootDir,'index.html'),'utf8');

const selector='.seyveo-standalone[data-seyveo-view="home"]:not(.seyveo-conversation)';
assert.equal(css.split(selector).length-1,3,'Root, body, and app are isolated only on standalone Home');
assert.match(css,/@media\(max-width:700px\)/,'Small viewport only');
assert.match(css,/overflow-y:auto!important;/,'Home content remains scrollable');
assert.match(css,/-webkit-overflow-scrolling:touch/,'Native touch scrolling preserved');
assert.match(css,/overscroll-behavior-y:contain/,'Home scroller contains bounce');
assert.match(css,/bottom:calc\(8px \+ env\(safe-area-inset-bottom,0px\)\)!important/,'Dock offset remains approved');
assert.match(html,/assets\/future-presence\.js\?v=3/,'New standalone state module referenced');

function simulatedView({mediaStandalone=false,appleStandalone=false,view='home',conversation=false}={}){
 const pages=Object.fromEntries(['calendar','picture','tasks','life','manage','home'].map(name=>
  [name+'Page',{hidden:view!==name}]));
 const docRoot={
  dataset:{},
  classList:{
   values:new Set(conversation?['seyveo-conversation']:[]),
   toggle(key,value){if(value)this.values.add(key);else this.values.delete(key)},
   contains(key){return this.values.has(key)}
  }
 };
 const app={scrollTop:123};
 const queued=[];
 let mutated=null;
 const document={
  documentElement:docRoot,hidden:false,
  getElementById:id=>pages[id]||null,
  querySelector:selector=>selector==='.app'?app:null,
  addEventListener(){}
 };
 const window={
  navigator:{standalone:appleStandalone},
  matchMedia:query=>({matches:query.includes('display-mode: standalone')?mediaStandalone:false}),
  addEventListener(){}
 };
 const globals={
  window,document,
  MutationObserver:class{constructor(callback){mutated=callback}observe(){}},
  queueMicrotask:callback=>queued.push(callback),
  requestAnimationFrame:callback=>queued.push(callback),
  clearTimeout(){},
  setTimeout(){return 1}
 };
 vm.runInNewContext(source,globals,{filename:'future-presence.js'});
 while(queued.length)queued.shift()();
 return {
  root:docRoot,
  app,
  changeTo(name){
   for(const [id,page] of Object.entries(pages))page.hidden=(id!==name+'Page');
   mutated();
   while(queued.length)queued.shift()();
  }
 };
}
const safari=simulatedView();
assert.equal(safari.root.classList.contains('seyveo-standalone'),false);
assert.equal(safari.root.dataset.seyveoView,'home');
assert.equal(safari.app.scrollTop,123,'Safari Home retains normal scroll model');
const installed=simulatedView({mediaStandalone:true});
assert.equal(installed.root.classList.contains('seyveo-standalone'),true);
assert.equal(installed.app.scrollTop,0,'Standalone Home resets inner scroller');
const legacy=simulatedView({appleStandalone:true});
assert.equal(legacy.root.classList.contains('seyveo-standalone'),true,'Older iOS standalone detection works');
const manage=simulatedView({mediaStandalone:true,view:'manage'});
assert.equal(manage.root.dataset.seyveoView,'manage');
assert.equal(manage.app.scrollTop,123,'Management does not use isolated Home scroller');
manage.changeTo('home');
assert.equal(manage.root.dataset.seyveoView,'home');
assert.equal(manage.app.scrollTop,0,'Returning from Management resets Home inner scroller');
const chat=simulatedView({mediaStandalone:true,conversation:true});
assert.equal(chat.app.scrollTop,123,'Conversation does not reset its scroll context');
console.log('PASS standalone Home root isolation, Safari, Manage, and Chat states');
