/* SEYVEO owner-controlled Demo Mode contract.
 * A strict fake DOM checks that we only show samples on the real Pulse page,
 * never replace local business records, and clear the mode on request.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const src=fs.readFileSync('assets/demo-mode.js','utf8');
const picture=fs.readFileSync('assets/picture.js','utf8');
new vm.Script(src,{filename:'demo-mode.js'});
const required=['openSeyveoDemoMode','seyveoDemoModeState','pictureDemoExit','pictureDemoLabel','pictureDemoWorkspace'];
for(const id of required)assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Unique control '+id);
assert.match(html,/assets\/demo-mode\.js\?v=1/);
assert.match(picture,/return actual\|\|\(window\.SEYVEO_DEMO_MODE\?\.isEnabled\?\.\(\)\?sampleData\(\):null\)/,
 'Real Pulse metrics cannot fall back to a fabricated sample outside Demo Mode');
const ideas=html.slice(html.indexOf('<dialog id="manageRoadmapDialog"'),html.indexOf('<div class="manage-roadmap-toolbar">'));
assert.doesNotMatch(ideas,/<section class="sv-pulse-(demo|inbox)"/,'Ideas are a plan, not a demo playground');
const page=html.slice(html.indexOf('<main class="picture-main"'),html.indexOf('<main class="manage-main"'));
assert.match(page,/<section id="pictureDemoWorkspace" class="sv-demo-workspace" hidden/,'Scenarios start hidden in actual Business Pulse');
for(const cl of ['sv-pulse-demo','sv-pulse-inbox'])assert.ok(page.includes('class="'+cl+'"'),'Real page contains '+cl);
assert.ok(!src.includes('localStorage'),'Demo is never persistent account storage');
class Node {
 constructor(){this.textContent='';this.hidden=false;this.attrs={};this.handlers={};}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){(this.handlers[k]??=[]).push(fn)}
 click(){for(const fn of this.handlers.click??[])fn()}
}
const nodes=Object.fromEntries(required.map(id=>[id,new Node()]));
nodes.pictureDemoWorkspace.hidden=true;
nodes.pictureDemoExit.hidden=true;
nodes.pictureDemoLabel.hidden=true;
const document={getElementById:id=>nodes[id],documentElement:{dataset:{}}};
const storage=new Map();
const sessionStorage={
 getItem:key=>storage.get(key)||null,
 setItem:(key,v)=>storage.set(key,v),
 removeItem:key=>storage.delete(key)
};
const events=[];
const window={dispatchEvent:e=>{events.push({type:e.type,detail:e.detail});}};
class Event{constructor(type){this.type=type}}
class CustomEvent extends Event{constructor(type,init){super(type);this.detail=init.detail}}
const location={hash:'#manage'};
vm.runInNewContext(src,{document,window,sessionStorage,Event,CustomEvent,location},{timeout:1700});
const api=window.SEYVEO_DEMO_MODE;
assert.equal(api.isEnabled(),false,'Opt-in is off initially');
assert.equal(nodes.pictureDemoWorkspace.hidden,true);
nodes.openSeyveoDemoMode.click();
assert.equal(api.isEnabled(),true);
assert.equal(location.hash,'#picture','Start on actual Pulse route');
assert.equal(nodes.openSeyveoDemoMode.attrs['aria-pressed'],'true');
assert.equal(nodes.pictureDemoWorkspace.hidden,false);
assert.equal(nodes.pictureDemoExit.hidden,false);
assert.equal(storage.get('seyveo-demo-session-v1'),'on');
assert.ok(events.some(x=>x.type==='seyveo:demo-mode-changed'&&x.detail.enabled));
nodes.pictureDemoLabel.hidden=false;
nodes.pictureDemoExit.click();
assert.equal(api.isEnabled(),false,'Owner can exit from real Pulse');
assert.equal(nodes.pictureDemoWorkspace.hidden,true);
assert.equal(nodes.pictureDemoExit.hidden,true);
assert.equal(nodes.pictureDemoLabel.hidden,true);
assert.equal(storage.size,0,'No demo flag remains');
assert.ok(events.some(x=>x.type==='seyveo:demo-mode-reset'),'Training records should be reset');
assert.equal(nodes.openSeyveoDemoMode.attrs['aria-pressed'],'false');
assert.ok(fs.readFileSync('assets/pulse-inbox-demo.js','utf8').includes("window.addEventListener('seyveo:demo-mode-reset'"),'Queue reset handler present');
console.log('PASS real-page Demo Mode: opt-in, open Picture, isolated state, safe exit and reset.');
