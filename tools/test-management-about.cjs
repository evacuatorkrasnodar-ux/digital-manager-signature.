/* SEYVEO · About entry regression: main Management Overview -> Passport,
 * Our Ideas and demo material must all open even if sibling order changes.
 * Runs on Node without a browser or external libraries.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
assert.equal((html.match(/data-clean-section="about"/g)||[]).length,1,'One About SEYVEO entry');
for(const id of ['seyveoCleanManageMenu','seyveoCleanDetail','seyveoCleanLegacy','seyveoCleanBack','seyveoCleanTitle','openManageRoadmap','openStudioPassportFromManage']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Unique About page control: '+id);
}
const start=html.indexOf('/* SEYVEO Management · one tap, one destination. Preserve original handlers. */');
assert.ok(start>0,'Management routing source present');
const end=html.indexOf('</script>',start);
assert.ok(end>start,'Management routing source complete');
const inline=html.slice(start,end);
new vm.Script(inline,{filename:'SEYVEO Management navigation'});
assert.match(inline,/about:\[2,'details\.seyveo-manage-fold'\]/,'About uses stable semantic selector');
assert.doesNotMatch(inline,/about:\[2,'details:nth-child/,'No position-dependent About route');
class Fake {
 constructor(tag='DIV'){this.tagName=tag;this.hidden=false;this.open=false;this.textContent='';this.handlers={};this.elements=[];this.states=new Set();this.classList={
  add:(x)=>this.states.add(x),remove:(x)=>this.states.delete(x),contains:(x)=>this.states.has(x)
 };}
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn)}
 fire(type,ev){for(const fn of this.handlers[type]??[])fn(ev)}
 replaceChildren(...x){this.elements=x}
 append(x){this.elements.push(x)}
 querySelector(){return null}
 querySelectorAll(){return []}
}
const material=new Fake('DETAILS'),ideas=new Fake('BUTTON');
const groups=[new Fake('SECTION'),new Fake('SECTION'),new Fake('SECTION'),new Fake('SECTION')];
groups[2].querySelector=selector=>{
 if(selector==='.manage-card > details.seyveo-manage-fold')return material;
 if(selector==='#openManageRoadmap')return ideas;
 return null;
};
groups[2].querySelectorAll=selector=>selector==='.seyveo-selected-item'?[material,ideas].filter(x=>x.states.has('seyveo-selected-item')):[];
const menu=new Fake(),detail=new Fake(),legacy=new Fake(),back=new Fake();
const network=new Fake(),title=new Fake(),explanation=new Fake();
legacy.querySelectorAll=selector=>selector==='.seyveo-management-v2-group'?groups:[];
const lookup={seyveoCleanManageMenu:menu,seyveoCleanDetail:detail,seyveoCleanLegacy:legacy,
 seyveoNetworkPage:network,seyveoCleanBack:back,seyveoCleanTitle:title,seyveoCleanExplain:explanation};
const document={getElementById:id=>lookup[id]||null,querySelector:()=>null,createElement:tag=>new Fake(tag.toUpperCase())};
const window={addEventListener(){},scrollTo(){}};
vm.runInNewContext(inline,{document,window},{timeout:1400});
const button={dataset:{cleanSection:'about'},textContent:'О SEYVEO',
 querySelector:selector=>{
  if(selector==='.manage-text strong')return {textContent:'О SEYVEO'};
  if(selector==='.manage-text small')return {textContent:'Паспорт, наши идеи и демонстрационные материалы.'};
  return null;
 }};
menu.fire('click',{target:{closest:()=>button}});
assert.equal(menu.hidden,true,'Overview closes');
assert.equal(detail.hidden,false,'About opens');
assert.equal(title.textContent,'О SEYVEO','Correct title appears');
assert.equal(material.open,true,'Material section expands');
assert.equal(material.states.has('seyveo-selected-item'),true,'Passport/demo entries are shown');
assert.equal(ideas.states.has('seyveo-selected-item'),true,'Ideas entry is shown');
assert.equal(groups[2].states.has('seyveo-selected-group'),true,'Correct SEYVEO group chosen');
assert.equal(explanation.hidden,false,'About explanation appears');
back.fire('click',{});
assert.equal(menu.hidden,false,'Back restores overview');
assert.equal(detail.hidden,true,'Back closes About');
assert.equal(material.states.has('seyveo-selected-item'),false,'No stale selected material');
assert.equal(ideas.states.has('seyveo-selected-item'),false,'No stale selected ideas entry');
console.log('PASS About SEYVEO opens Passport + Our Ideas + demo materials and Back restores navigation.');
