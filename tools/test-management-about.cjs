/* SEYVEO · Management navigation regression.
 * Our Ideas remains direct; obsolete About/preview and demo controls must be absent.
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
assert.doesNotMatch(overview,/data-clean-section="about"/,'No empty About SEYVEO page');
for(const id of ['openSeyveoDemoMode','seyveoDemoModeState','openStudioPassportFromManage',
 'openSeyveoMusicPreview','openLivingAnswersPreview','openLivingMomentPreview','livingMomentPreviewStatus']){
 assert.doesNotMatch(overview,new RegExp('id="'+id+'"'),'Removed old preview/demo UI: '+id);
}
assert.doesNotMatch(overview,/Материалы SEYVEO|Демо-режим|предпросмотры/,'No obsolete preview catalog or demo switch');
for(const id of ['seyveoCleanManageMenu','seyveoCleanDetail','seyveoCleanLegacy','seyveoCleanBack','seyveoCleanTitle','openManageRoadmap','manageRoadmapDialog','seyveoBusinessCommandPage']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Unique element id: '+id);
}
assert.match(overview,/id="openManageRoadmap"/,'Original Ideas button appears directly in overview');
assert.match(overview,/Карта развития · Поиск/,'Original roadmap displays an intelligible label');
const businessKeys=[...overview.matchAll(/data-clean-business="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(businessKeys,['company','people','chat','tasks','pulse','documents','hiring','efficiency'],'Eight direct Business rows in order');
assert.doesNotMatch(overview,/data-clean-section="command"/,'No intermediary My Business menu');
assert.match(html,/id="svcpChats"/,'Existing chat preserved');
assert.doesNotMatch(html,/id="svcpOpenCompany"/,'No duplicate company link in Employees, Chats or Tasks');
assert.doesNotMatch(html,/id="svcpOpenPulse"|id="svcpOpenDocs"/,'No repeated Pulse or Documents beneath Employees');
assert.doesNotMatch(html,/Другие инструменты/,'No giant secondary catalogue');
assert.doesNotMatch(html,/Руководитель<\/strong>|Получают только нужные рабочие чаты/,'No pretend leader/member cards');
assert.match(html,/Сотрудников пока нет/,'One clear employee empty state');
assert.doesNotMatch(html,/id="svcpOpenMore"/,'No more giant second business menu');
for(const name of ['Команда']){
 assert.match(html,new RegExp('data-svcp-feature="'+name+'"'),'Direct specialized entry preserved: '+name);
}
assert.match(html,/id="openCompanyPassportFromManage"/,'Real company card preserved');
assert.match(html,/id="seyveoStaffCards"/,'HR data card preserved');
assert.match(html,/id="seyveoRoiForm"/,'ROI calculator preserved');
assert.ok(html.indexOf('id="openManageRoadmap"')<detailStart,'Roadmap control is visible directly in Management');
assert.match(html,/id="seyveoStudioDialog"/,'Studio passport engine retained for linked company / brand actions');
assert.match(html,/id="seyveoCompanyDialog"/,'Company card still works');
assert.match(management,/\$\('openManageRoadmap'\)\.addEventListener\('click'/,'Single existing roadmap handler remains');
assert.match(management,/roadmapDialog\.showModal\(\)/,'Ideas open the original dialog');
const start=html.indexOf('/* SEYVEO Management · one tap, one destination. Preserve original handlers. */');
assert.ok(start>0,'Management routing source present');
const end=html.indexOf('</script>',start);
assert.ok(end>start,'Management routing source complete');
const inline=html.slice(start,end);
new vm.Script(inline,{filename:'SEYVEO Management navigation'});
assert.doesNotMatch(inline,/about:\[/,'Old About route is retired, no blank details frame');
assert.doesNotMatch(inline,/if\(key==='about'\)/,'No About fallback recreated');
class Fake{
 constructor(tag='DIV'){
  this.tagName=tag;this.hidden=false;this.open=false;this.textContent='';this.handlers={};this.elements=[];this.states=new Set();this.dataset={};this.calls=0;
  this.classList={add:x=>this.states.add(x),remove:x=>this.states.delete(x),contains:x=>this.states.has(x),toggle:(x,on)=>{if(on)this.states.add(x);else this.states.delete(x)}};
 }
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn)}
 fire(type,event){for(const fn of this.handlers[type]??[])fn(event)}
 click(){this.calls++;this.fire('click',{})}
 replaceChildren(...items){this.elements=items}
 append(x){this.elements.push(x)}
 querySelector(){return null}
 querySelectorAll(){return []}
 removeAttribute(x){if(x==='open')this.open=false}
}
const groups=Array.from({length:4},()=>new Fake('SECTION'));
const advancedBusiness=new Fake('DETAILS');
const businessFeatures=Object.fromEntries(['Команда','Кадры','Эффект SEYVEO'].map(name=>{
 const node=new Fake('DETAILS');node.querySelector=selector=>
  selector==='summary .manage-text strong'?{textContent:name}:null;
 return [name,node];
}));
groups[3].querySelector=selector=>
 selector==='.manage-card > details:nth-child(1)'||
 selector==='.manage-card > details.seyveo-manage-fold'?advancedBusiness:null;
groups[3].querySelectorAll=selector=>selector==='.seyveo-hr-operations > details.seyveo-manage-fold'?
 Object.values(businessFeatures):[];
const menu=new Fake(),detail=new Fake(),legacy=new Fake(),back=new Fake();
const network=new Fake(),command=new Fake(),title=new Fake(),explanation=new Fake();
const company=new Fake('BUTTON'),pulse=new Fake('BUTTON'),documents=new Fake('BUTTON');
legacy.querySelectorAll=selector=>selector==='.seyveo-management-v2-group'?groups:
 selector==='.sv-business-focus'?Object.values(businessFeatures).filter(x=>x.states.has('sv-business-focus')):[];
const lookup={seyveoCleanManageMenu:menu,seyveoCleanDetail:detail,seyveoCleanLegacy:legacy,
 seyveoNetworkPage:network,seyveoBusinessCommandPage:command,seyveoCleanBack:back,
 seyveoCleanTitle:title,seyveoCleanExplain:explanation,
 openCompanyPassportFromManage:company,openBusinessPictureFromManage:pulse,
 openUnifiedDocumentsFromManage:documents};
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
const openedTabs=[];
window.SEYVEO_BUSINESS_COMMAND={openTab:name=>openedTabs.push(name)};
const clickBusiness=key=>{
 const target={dataset:{cleanBusiness:key}};
 menu.fire('click',{target:{closest:selector=>selector==='[data-clean-business]'?target:null}});
};
const normal=(key,title)=>menu.fire('click',{target:{closest:selector=>selector==='[data-clean-business]'?null:entry(key,title,'Описание')}});
clickBusiness('company');assert.equal(company.calls,1,'Company opens original profile');
clickBusiness('pulse');assert.equal(pulse.calls,1,'Business Pulse opens original picture');
clickBusiness('documents');assert.equal(documents.calls,1,'Documents open original center');
normal('about','О SEYVEO');
assert.equal(menu.hidden,false,'Removed About shortcut cannot open a ghost page');

for(const [key,heading,tab] of [['people','Сотрудники','team'],['chat','Рабочие чаты','chats'],['tasks','Поручения','tasks']]){
 clickBusiness(key);
 assert.equal(title.textContent,heading,'Direct destination '+key);
 assert.equal(command.hidden,false,'Business screen opens');
 assert.equal(command.states.has('svcp-direct-view'),true,'No nested Business hub');
 assert.equal(openedTabs.at(-1),tab,'Correct focused panel selected');
 back.click();
 assert.equal(menu.hidden,false,'Back to Business list');
}
assert.equal(typeof window.SEYVEO_BUSINESS_NAV?.openFeature,'function','Original advanced routing intact');
clickBusiness('people');
window.SEYVEO_BUSINESS_NAV.openFeature('Кадры');
assert.equal(title.textContent,'Подбор сотрудников');
back.click();
assert.equal(title.textContent,'Сотрудники','Advanced HR returns to employee screen');
back.click();
clickBusiness('hiring');
assert.equal(title.textContent,'Подбор сотрудников','Direct hiring route');
back.click();
clickBusiness('efficiency');
assert.equal(title.textContent,'Эффективность бизнеса','Direct efficiency route');
back.click();
assert.equal(menu.hidden,false,'Final Back returns to overview');
console.log('PASS Management: 8 Business buttons, direct Ideas, no obsolete About/preview/demo UI and correct Back.');
