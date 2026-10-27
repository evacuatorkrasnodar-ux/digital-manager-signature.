/* SEYVEO · unified client inbox is a local, truthful teaching scenario.
 * Node-only functional test. None of these fake leads is user/business data.
 */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const src=fs.readFileSync('assets/pulse-inbox-demo.js','utf8');
const style=fs.readFileSync('assets/pulse-inbox-demo.css','utf8');
const roadmap=fs.readFileSync('assets/management.js','utf8');
new vm.Script(src,{filename:'pulse-inbox-demo.js'});
const ids=['manageRoadmapDialog','pulseInboxToggle','pulseInboxPanel','pulseInboxList',
 'pulseInboxHeadline','pulseInboxCount','pulseInboxSource','pulseInboxMessage',
 'pulseInboxState','pulseInboxDraft','pulseInboxDraftText','pulseInboxHistory',
 'pulseInboxAction','pulseInboxReset','pulseInboxClose','pulseInboxFeedback'];
for(const id of ids)
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'One inbox UI element '+id);
for(const type of ['all','unanswered','resolved'])
 assert.equal((html.match(new RegExp('data-pulse-inbox-filter="'+type+'"','g'))||[]).length,1,'Unique filter '+type);
assert.match(html,/assets\/pulse-inbox-demo\.js\?v=1/,'Included script');
assert.match(html,/assets\/pulse-inbox-demo\.css\?v=1/,'Included scoped style');
assert.ok(roadmap.includes("['crm_inbox_demo'"),'Second approved prototype appears in existing ideas');
const stripped=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/[^\n]*$/gm,'');
assert.doesNotMatch(stripped,/\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|sendBeacon)\b/,
 'No real client networking or browser storage');
class Node {
 constructor(){this.textContent='';this.hidden=false;this.children=[];this.props={};this.handlers={};this.className='';this.dataset={};}
 setAttribute(name,val){this.props[name]=val;}
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(){this.children=[]}
 click(){for(const fn of this.handlers.click??[])fn({target:this})}
 close(){for(const fn of this.handlers.close??[])fn({target:this})}
 focus(){}
 scrollIntoView(){}
}
const els=Object.fromEntries(ids.map(id=>[id,new Node()]));
els.pulseInboxPanel.hidden=true;
els.pulseInboxDraft.hidden=true;
const buttons=['all','unanswered','resolved'].map(type=>{
 const button=new Node();button.dataset.pulseInboxFilter=type;return button
});
const doc={
 getElementById(id){return els[id]||null},
 querySelectorAll(selector){return selector==='[data-pulse-inbox-filter]'?buttons:[]},
 createElement(){return new Node()}
};
vm.runInNewContext(src,{document:doc},{timeout:1800});
const click=id=>els[id].click();
const texts=items=>items.map(x=>x.textContent);
assert.match(els.pulseInboxCount.textContent,/3 учебных/);
assert.equal(els.pulseInboxList.children.length,3,'Initially three fake leads');
click('pulseInboxToggle');
assert.equal(els.pulseInboxPanel.hidden,false,'Inbox opened');
assert.equal(els.pulseInboxToggle.props['aria-expanded'],'true');
assert.match(els.pulseInboxCount.textContent,/2 требуют ответа/);
assert.match(els.pulseInboxHeadline.textContent,/Марина/);
click('pulseInboxAction');
assert.match(els.pulseInboxState.textContent,/Черновик/);
assert.equal(els.pulseInboxDraft.hidden,false);
assert.equal(els.pulseInboxHistory.children.length,2);
click('pulseInboxAction');
assert.match(els.pulseInboxState.textContent,/не отправлено/,'Approval never fakes delivery');
assert.match(els.pulseInboxFeedback.textContent,/не отправлен/);
click('pulseInboxAction');
assert.match(els.pulseInboxState.textContent,/симуляция/);
assert.match(els.pulseInboxCount.textContent,/1 требуют ответа/);
click('pulseInboxAction');
assert.match(els.pulseInboxState.textContent,/Завершено/);
assert.match(els.pulseInboxCount.textContent,/2 завершено/);
buttons[2].click();
assert.equal(els.pulseInboxList.children.length,2,'Resolved filter shows two closed fake leads');
buttons[1].click();
assert.equal(els.pulseInboxList.children.length,1,'Answer-needed filter shows only Igor');
assert.match(els.pulseInboxHeadline.textContent,/Игорь/);
click('pulseInboxAction');
assert.match(els.pulseInboxState.textContent,/Черновик/);
click('pulseInboxReset');
assert.equal(els.pulseInboxList.children.length,3,'Reset restores all demo cases');
assert.match(els.pulseInboxHeadline.textContent,/Марина/);
assert.equal(els.pulseInboxDraft.hidden,true,'Reset removes all unsent drafts');
assert.match(els.pulseInboxCount.textContent,/2 требуют ответа/);
click('pulseInboxClose');
assert.equal(els.pulseInboxPanel.hidden,true);
assert.equal(els.pulseInboxToggle.props['aria-expanded'],'false');
click('pulseInboxToggle');
els.manageRoadmapDialog.close();
assert.equal(els.pulseInboxPanel.hidden,true,'Parent dialog closure hides inbox');
assert.match(style,/var\(--seyveo-hdr-active\)/,'Matches shared Black Velvet visual system');
console.log('PASS SEYVEO unified inbox: filters, approval, simulated client, close, reset; no network or storage.');
