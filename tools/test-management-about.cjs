/* SEYVEO · Management navigation regression.
 * Our Ideas is a single direct overview button; About holds project materials.
 * Runs with Node, without a browser or external libraries.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const management=fs.readFileSync('assets/management.js','utf8');
const menuStart=html.indexOf('<div id="seyveoCleanManageMenu"');
const detailStart=html.indexOf('<div id="seyveoCleanDetail"');
assert.ok(menuStart>0&&detailStart>menuStart,'Management menu and detail exist in order');
const overview=html.slice(menuStart,detailStart);
assert.equal((html.match(/data-clean-section="about"/g)||[]).length,1,'Single About SEYVEO entry');
for(const id of ['seyveoCleanManageMenu','seyveoCleanDetail','seyveoCleanLegacy','seyveoCleanBack','seyveoCleanTitle','openManageRoadmap','manageRoadmapDialog','openStudioPassportFromManage','seyveoBusinessCommandPage']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Unique element id: '+id);
}
assert.match(overview,/id="openManageRoadmap"/,'Original Ideas button appears directly in overview');
assert.match(overview,/Карта развития · Поиск/,'Original roadmap displays an intelligible label');
assert.match(overview,/data-clean-section="command"/,'Single My Business entry remains accessible');
assert.doesNotMatch(overview,/data-clean-section="business"/,'No second confusing business menu entry');
assert.match(overview,/<strong>Мой бизнес<\/strong><small>Компания, сотрудники, чаты и задачи<\/small>/,'Business entry explains what is inside');
assert.match(html,/id="svcpOpenCompany"/,'Company still accessible within business hub');
assert.match(html,/id="svcpOpenMore"/,'Advanced company tools still accessible');
assert.ok(html.indexOf('id="openManageRoadmap"')<detailStart,'Roadmap control is not hidden in About detail');
assert.match(management,/\$\('openManageRoadmap'\)\.addEventListener\('click'/,'Single existing roadmap handler remains');
assert.match(management,/roadmapDialog\.showModal\(\)/,'Ideas open the original dialog');
const start=html.indexOf('/* SEYVEO Management · one tap, one destination. Preserve original handlers. */');
assert.ok(start>0,'Management routing source present');
const end=html.indexOf('</script>',start);
assert.ok(end>start,'Management routing source complete');
const inline=html.slice(start,end);
new vm.Script(inline,{filename:'SEYVEO Management navigation'});
assert.match(inline,/about:\[2,'details\.seyveo-manage-fold'\]/,'About uses stable semantic selector');
assert.doesNotMatch(inline,/if\(key==='about'\).*openManageRoadmap/,'About does not duplicate Ideas');
class Fake{
 constructor(tag='DIV'){
  this.tagName=tag;this.hidden=false;this.open=false;this.textContent='';this.handlers={};this.elements=[];this.states=new Set();
  this.classList={add:x=>this.states.add(x),remove:x=>this.states.delete(x),contains:x=>this.states.has(x)};
 }
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn)}
 fire(type,event){for(const fn of this.handlers[type]??[])fn(event)}
 replaceChildren(...items){this.elements=items}
 append(x){this.elements.push(x)}
 querySelector(){return null}
 querySelectorAll(){return []}
}
const material=new Fake('DETAILS');
const groups=Array.from({length:4},()=>new Fake('SECTION'));
groups[2].querySelector=selector=>selector==='.manage-card > details.seyveo-manage-fold'?material:null;
groups[2].querySelectorAll=selector=>selector==='.seyveo-selected-item'&&material.states.has('seyveo-selected-item')?[material]:[];
const advancedBusiness=new Fake('DETAILS');
groups[3].querySelector=selector=>selector==='.manage-card > details:nth-child(1)'?advancedBusiness:null;
const menu=new Fake(),detail=new Fake(),legacy=new Fake(),back=new Fake();
const network=new Fake(),command=new Fake(),title=new Fake(),explanation=new Fake();
legacy.querySelectorAll=selector=>selector==='.seyveo-management-v2-group'?groups:[];
const lookup={seyveoCleanManageMenu:menu,seyveoCleanDetail:detail,seyveoCleanLegacy:legacy,
 seyveoNetworkPage:network,seyveoBusinessCommandPage:command,seyveoCleanBack:back,
 seyveoCleanTitle:title,seyveoCleanExplain:explanation};
const document={getElementById:id=>lookup[id]||null,querySelector:()=>null,createElement:tag=>new Fake(tag.toUpperCase())};
const window={addEventListener(){},scrollTo(){}};
vm.runInNewContext(inline,{document,window},{timeout:1400});
function entry(name,label,desc){
 return {dataset:{cleanSection:name},textContent:label,querySelector:selector=>{
  if(selector==='.manage-text strong')return {textContent:label};
  if(selector==='.manage-text small')return {textContent:desc};
  return null;
 }};
}
menu.querySelector=selector=>selector==='[data-clean-section="command"]'
 ?entry('command','Мой бизнес','Компания, сотрудники, чаты и задачи'):null;
menu.fire('click',{target:{closest:()=>entry('about','О SEYVEO','История и материалы SEYVEO')}});
assert.equal(menu.hidden,true,'Overview closes');
assert.equal(detail.hidden,false,'About opens');
assert.equal(title.textContent,'О SEYVEO','Correct About title');
assert.equal(material.open,true,'Project materials unfold');
assert.equal(material.states.has('seyveo-selected-item'),true,'Project materials shown');
assert.equal(explanation.hidden,false,'About explanation appears');
back.fire('click',{});
assert.equal(menu.hidden,false,'Back restores overview');
assert.equal(detail.hidden,true,'Back closes About');
assert.equal(material.states.has('seyveo-selected-item'),false,'No stale selected material');
menu.fire('click',{target:{closest:()=>entry('command','Мой бизнес','Компания, сотрудники, чаты и задачи')}});
assert.equal(command.hidden,false,'Unified business hub opens');
assert.equal(title.textContent,'Мой бизнес','Clear business heading');
assert.equal(legacy.hidden,true,'Legacy section hidden during hub');
assert.equal(typeof window.SEYVEO_BUSINESS_NAV?.openTools,'function','Advanced route available without second menu row');
window.SEYVEO_BUSINESS_NAV.openTools();
assert.equal(command.hidden,true,'Company advanced section replaces hub');
assert.equal(advancedBusiness.open,true,'Existing business tools remain reachable');
assert.equal(title.textContent,'Инструменты бизнеса','Advanced company title');
back.fire('click',{});
assert.equal(command.hidden,false,'Back from advanced company tools returns to business hub');
back.fire('click',{});
assert.equal(command.hidden,true,'Hub closes');
assert.equal(menu.hidden,false,'Back returns to Management');
console.log('PASS Management: one My Business entrance, company and team tools, correct Back, original Ideas and About.');
