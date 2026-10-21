/* SEYVEO shared dock + unified installed-PWA scrolling regression.
 * Static and simulated browser checks do not replace testing on iPhone. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const rootDir=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(rootDir,'assets/floating-navigation.css'),'utf8');
const source=fs.readFileSync(path.join(rootDir,'assets/future-presence.js'),'utf8');
const html=fs.readFileSync(path.join(rootDir,'index.html'),'utf8');

// The dock does not have a different geometry for Home or Management.
assert.match(css,/--seyveo-dock-bottom:calc\(8px \+ env\(safe-area-inset-bottom,0px\)\)/);
assert.match(css,/\.dock\{\s*position:fixed!important;\s*z-index:30!important;/);
assert.match(css,/bottom:var\(--seyveo-dock-bottom\)!important/);
assert.match(css,/--seyveo-dock-height:56px/,'Shared dock compact height');
assert.ok(css.includes('--seyveo-dock-bottom:max(18px,calc(env(safe-area-inset-bottom,0px) - 12px))'),'All installed PWA screens share the same unclipped low dock offset');
assert.doesNotMatch(css,/--seyveo-dock-bottom:[^;]*safe-area-inset-top/,'Bottom of the viewport never depends on top notch inset');
const dockOffset=bottomSafeArea=>Math.max(18,bottomSafeArea-12);
assert.equal(dockOffset(34),22,'iPhone bottom 34px inset lowers dock while preserving clearance');
assert.equal(dockOffset(0),18,'Even without inset, do not clip the rounded dock');
assert.match(css,/html\.seyveo-standalone:not\(\.seyveo-conversation\)\{/,'Standalone offset scoped to all app workspaces');
assert.ok(!css.includes('data-seyveo-view="home"'),'No page-by-page dock patches');
assert.doesNotMatch(css,/data-seyveo-view="(?:home|manage|picture)"/,'No per-page dock offsets');
assert.match(css,/html\.seyveo-standalone:not\(\.seyveo-conversation\) \.app\{/);
assert.match(css,/position:fixed!important;\s*inset:0!important;/);
assert.match(css,/overflow-y:auto!important;/,'All installed PWA pages can scroll');
assert.match(css,/overscroll-behavior-y:contain/);
assert.match(css,/-webkit-overflow-scrolling:touch/);
assert.match(html,/assets\/floating-navigation\.css\?v=12/);
assert.match(html,/assets\/future-presence\.js\?v=4/);
assert.ok(html.includes('</div></div><footer class="dock"'),'Dock is not inside app scroller');

function simulate({mediaStandalone=false,appleStandalone=false,view='home',chat=false}={}){
 const pages=Object.fromEntries(['calendar','picture','tasks','life','manage','home'].map(n=>
  [n+'Page',{hidden:n!==view}]));
 const classes=new Set(chat?['seyveo-conversation']:[]);
 const root={dataset:{},classList:{
  toggle(k,val){val?classes.add(k):classes.delete(k)},
  contains:k=>classes.has(k)
 }};
 const app={scrollTop:123};
 const queued=[];
 let observe=null;
 const document={
  documentElement:root,hidden:false,
  getElementById:k=>pages[k]||null,
  querySelector:k=>k==='.app'?app:null,
  addEventListener(){}
 };
 const window={
  navigator:{standalone:appleStandalone},
  matchMedia:q=>({matches:q.includes('display-mode: standalone')?mediaStandalone:false}),
  addEventListener(){}
 };
 const context={
  document,window,
  MutationObserver:class {constructor(callback){observe=callback}observe(){}},
  queueMicrotask:fn=>queued.push(fn),
  requestAnimationFrame:fn=>queued.push(fn),
  clearTimeout(){},setTimeout(){return 1}
 };
 vm.runInNewContext(source,context,{filename:'future-presence.js'});
 while(queued.length)queued.shift()();
 return {root,app,changeTo(name){
  for(const [id,page] of Object.entries(pages))page.hidden=id!==name+'Page';
  observe();
  while(queued.length)queued.shift()();
 }};
}
const browser=simulate();
assert.equal(browser.root.classList.contains('seyveo-standalone'),false,'Normal Safari keeps its scrolling');
assert.equal(browser.root.dataset.seyveoView,'home');
assert.equal(browser.app.scrollTop,123,'Safari app scroll stays untouched');
const installedHome=simulate({mediaStandalone:true});
assert.equal(installedHome.root.classList.contains('seyveo-standalone'),true);
assert.equal(installedHome.app.scrollTop,0,'Standalone Home resets its own scroller');
installedHome.app.scrollTop=88;
installedHome.changeTo('manage');
assert.equal(installedHome.root.dataset.seyveoView,'manage');
assert.equal(installedHome.app.scrollTop,0,'Management uses SAME standalone scroll frame');
installedHome.app.scrollTop=95;
installedHome.changeTo('picture');
assert.equal(installedHome.app.scrollTop,0,'Picture uses SAME standalone scroll frame');
installedHome.app.scrollTop=112;
installedHome.changeTo('calendar');
assert.equal(installedHome.app.scrollTop,0,'Calendar uses SAME standalone scroll frame');
installedHome.app.scrollTop=76;
installedHome.changeTo('home');
assert.equal(installedHome.app.scrollTop,0,'Home return uses SAME scroll frame');
const legacyIOS=simulate({appleStandalone:true,view:'tasks'});
assert.equal(legacyIOS.root.classList.contains('seyveo-standalone'),true,'Older iOS standalone flag still supported');
assert.equal(legacyIOS.app.scrollTop,0,'Tasks reset on older standalone iOS');
const chat=simulate({mediaStandalone:true,chat:true});
assert.equal(chat.app.scrollTop,123,'Full chat retains its keyboard/transcript scrolling');
console.log('PASS one fixed dock; unified PWA Home / Management / Picture / Calendar / Tasks scroll');
