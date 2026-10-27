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
assert.match(overview,/data-clean-section="command"/,'Business Command remains accessible');
assert.match(overview,/data-clean-section="business"/,'Company tools remain accessible');
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
menu.fire('click',{target:{closest:()=>entry('command','Пульт бизнеса','Команда · Чаты · Поручения')}});
assert.equal(command.hidden,false,'Corporate demo panel opens');
assert.equal(legacy.hidden,true,'Legacy section hidden during command');
back.fire('click',{});
assert.equal(command.hidden,true,'Corporate panel closes');
assert.equal(menu.hidden,false,'Back returns to Management');
console.log('PASS Management: direct unique Our Ideas, About materials, Business Command, Back.');
