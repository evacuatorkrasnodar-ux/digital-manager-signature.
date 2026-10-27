/* SEYVEO · client-to-result Pulse walkthrough must remain honest and interactive.
 * No browser or external framework required: run with node directly.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const roadmap=fs.readFileSync('assets/management.js','utf8');
const source=fs.readFileSync('assets/pulse-business-walkthrough.js','utf8');
const css=fs.readFileSync('assets/pulse-business-walkthrough.css','utf8');
new vm.Script(source,{filename:'pulse-business-walkthrough.js'});
const ids=['manageRoadmapDialog','managePulseDemoToggle','managePulseDemoPanel','managePulseDemoNext',
 'managePulseDemoFold','managePulseDemoProgress','managePulseDemoStatus','managePulseDemoHeadline',
 'managePulseDemoText','managePulseDemoDraft','managePulseDemoHistory','managePulseDemoResult'];
for(const id of ids){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Unique demo control: '+id);
}
assert.ok(html.includes('assets/pulse-business-walkthrough.js?v=2'),'Module imported with cache version');
assert.ok(html.includes('assets/pulse-business-walkthrough.css?v=1'),'Scoped material imported');
assert.ok(roadmap.includes("['pulse_first_story','Пульс бизнеса")&&roadmap.includes("'demo'],\n  ['business_events'"),
 'Only finished simulation is marked demo, broader production sales architecture stays planned');
assert.equal((html.match(/id="openManageRoadmap"/g)||[]).length,1,'One entry to Our Ideas');
const materialsIndex=html.indexOf('<strong>Материалы SEYVEO</strong>');
const ideasIndex=html.indexOf('id="openManageRoadmap"');
assert.ok(ideasIndex>0&&ideasIndex<materialsIndex,'Our Ideas now visible before folded SEYVEO Materials');
const noComments=source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/[^\n]*$/gm,'');
assert.doesNotMatch(noComments,/\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|sendBeacon)\b/,
 'The demonstration must not talk to real services or store business data');
class Node {
 constructor(){this.textContent='';this.hidden=false;this.children=[];this.props={};this.handlers={};this.className=''}
 setAttribute(name,value){this.props[name]=value}
 addEventListener(name,fn){(this.handlers[name]??=[]).push(fn)}
 append(...children){this.children.push(...children)}
 replaceChildren(){this.children=[]}
 click(){for(const fn of this.handlers.click||[])fn({target:this})}
 close(){for(const fn of this.handlers.close||[])fn({target:this})}
 focus(){}
 scrollIntoView(){}
}
const nodes=Object.fromEntries(ids.map(id=>[id,new Node()]));
nodes.managePulseDemoPanel.hidden=true;
nodes.managePulseDemoDraft.hidden=true;
nodes.managePulseDemoResult.hidden=true;
const document={getElementById(id){return nodes[id]||null},createElement(){return new Node()}};
vm.runInNewContext(source,{document},{timeout:1500});
const click=id=>nodes[id].click();
assert.equal(nodes.managePulseDemoProgress.textContent,'Шаг 1 из 6');
assert.equal(nodes.managePulseDemoHistory.children.length,1);
click('managePulseDemoToggle');
assert.equal(nodes.managePulseDemoPanel.hidden,false);
assert.equal(nodes.managePulseDemoToggle.props['aria-expanded'],'true');
click('managePulseDemoNext');
assert.equal(nodes.managePulseDemoProgress.textContent,'Шаг 2 из 6');
assert.equal(nodes.managePulseDemoHistory.children.length,2);
click('managePulseDemoNext');
assert.equal(nodes.managePulseDemoDraft.hidden,false,'Show unsent suggestion');
click('managePulseDemoNext');
assert.match(nodes.managePulseDemoStatus.textContent,/не отправлено/,'Approval is not delivery');
for(let i=0;i<2;i++)click('managePulseDemoNext');
assert.equal(nodes.managePulseDemoProgress.textContent,'Шаг 6 из 6');
assert.equal(nodes.managePulseDemoResult.hidden,false,'Demo-only result appears after confirmation');
assert.equal(nodes.managePulseDemoHistory.children.length,6);
click('managePulseDemoNext');
assert.equal(nodes.managePulseDemoProgress.textContent,'Шаг 1 из 6','Restart resets progress');
assert.equal(nodes.managePulseDemoHistory.children.length,1,'Restart resets history');
assert.equal(nodes.managePulseDemoResult.hidden,true,'Restart clears success state');
click('managePulseDemoFold');
assert.equal(nodes.managePulseDemoPanel.hidden,true);
assert.equal(nodes.managePulseDemoToggle.props['aria-expanded'],'false');
assert.ok(css.includes('var(--seyveo-emerald)'),'Uses shared Black Velvet palette');
console.log('PASS SEYVEO Pulse business: real 6-step demo controls, no writes or fake external delivery.');
