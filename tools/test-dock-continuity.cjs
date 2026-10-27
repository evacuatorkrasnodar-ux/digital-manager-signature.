/* SEYVEO · Original dock survives top-layer full-screen workspaces.
 * node tools/test-dock-continuity.cjs
 * Static and isolated behavior checks; device QA remains necessary.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/seyveo-fullscreen-workspaces.css','utf8');
const source=fs.readFileSync('assets/seyveo-dock-continuity.js','utf8');
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1,'Exactly one real dock');
for(const id of ['navHome','navTasks','assistantButton','navPicture','navManage']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'No duplicate navigation: '+id);
}
assert.match(html,/assets\/seyveo-dock-continuity\.js\?v=\d+/,'Dock continuity controller loaded');
assert.match(html,/assets\/seyveo-fullscreen-workspaces\.css\?v=2/,'Current dock-safe viewport style');
const last=html.slice(-1200);
assert.ok(last.indexOf('seyveo-business-command.js')<last.indexOf('seyveo-dock-continuity.js'),
 'Bind after existing business/dialog handlers');
assert.match(source,/dock\.parentNode\.insertBefore\(origin,dock\)/,'Preserve original anchor');
assert.match(source,/next\.appendChild\(dock\)/,'Move existing dock, not create another');
assert.match(source,/origin\.parentNode\.insertBefore\(dock,origin\.nextSibling\)/,'Return to original DOM location');
assert.match(source,/seyveo-music-dock.*svMusicAction/,'Music player buttons remain transport controls');
assert.match(css,/calc\(112px \+ env\(safe-area-inset-bottom,0px\)\)/,'Reserve room below regular content');
assert.match(css,/dialog\.seyveo-dock-host\[open\] > footer\.dock/,'Existing dock stays above workspace contents');
assert.doesNotMatch(source,/cloneNode|createElement\(['"]footer/,'No cloned dock');
new vm.Script(source);
class Node{
 constructor(tag,id=''){this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.parentNode=null;this.open=false;this.isConnected=true;this.listeners={};this.dataset={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c)};}
 insertBefore(n,before){n.parentNode?.removeChild(n);n.parentNode=this;n.isConnected=true;const idx=this.children.indexOf(before);this.children.splice(idx<0?this.children.length:idx,0,n);return n}
 appendChild(n){return this.insertBefore(n,null)}
 removeChild(n){const idx=this.children.indexOf(n);if(idx>=0)this.children.splice(idx,1);n.parentNode=null;return n}
 get nextSibling(){if(!this.parentNode)return null;const i=this.parentNode.children.indexOf(this);return this.parentNode.children[i+1]||null}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 fire(k,e){(this.listeners[k]||[]).forEach(fn=>fn(e))}
 close(){this.open=false;observer([{target:this}])}
}
const body=new Node('body'),dock=new Node('footer'),family=new Node('dialog','seyveoFamilyDialog'),care=new Node('dialog','calendarSpaceDialog'),alert=new Node('dialog','wakeVoiceConsent');
dock.classList.add('dock');
body.appendChild(dock);body.appendChild(family);body.appendChild(care);body.appendChild(alert);
let observer=()=>{},chosen=null;
const documentMock={
 documentElement:body,
 querySelector:s=>s==='footer.dock'?dock:null,
 querySelectorAll:s=>s==='dialog[open]'?[family,care,alert].filter(x=>x.open):[],
 createComment:()=>new Node('#comment'),
 addEventListener(){}
};
const windowMock={};
class MockObserver{constructor(fn){observer=fn}observe(){}}
vm.runInNewContext(source,{document:documentMock,window:windowMock,MutationObserver:MockObserver},{timeout:1500});
assert.equal(body.children.filter(x=>x===dock).length,1,'Original dock remains in body');
family.open=true;observer([{target:family}]);
assert.equal(dock.parentNode,family,'Dock appears inside family modal');
care.open=true;observer([{target:care}]);
assert.equal(dock.parentNode,care,'Nested newer modal takes original dock');
care.open=false;observer([{target:care}]);
assert.equal(dock.parentNode,family,'Closing nested modal returns dock to family');
const nav={id:'navHome',dataset:{}};
dock.fire('click',{target:{closest:()=>nav}});
assert.equal(family.open,false,'Dock navigation dismisses full-screen modal');
assert.equal(dock.parentNode,body,'Dock restored to original parent');
family.open=true;observer([{target:family}]);
dock.classList.add('seyveo-music-dock');
dock.fire('click',{target:{closest:()=>({id:'navTasks',dataset:{svMusicAction:'play'}})}});
assert.equal(family.open,true,'Music player control does not dismiss workspace');
assert.equal(dock.parentNode,family,'Music mode retains the same dock');
console.log('PASS one real dock: family, nested care, Back, global navigation and music transport.');
