const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/seyveo-meeting-place-picker.js'),'utf8');
const places=require('../assets/seyveo-task-places.js');

class Node{
 constructor(tag='div'){
  this.tagName=tag;this.children=[];this.listeners={};this.hidden=false;
  this.textContent='';this.className='';this.value='';
 }
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 after(node){this.next=node}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
 setAttribute(){}
 click(){for(const fn of this.listeners.click||[])fn()}
}
const descendants=node=>[node,...node.children.flatMap(descendants)];

test('Sayvi offers a choice only for a meeting without a specified venue',async()=>{
 const dialog=new Node('dialog');dialog.open=true;
 const title=new Node('textarea');title.value='Завтра встреча с Романом';
 const panel=new Node('section');let searched=0,selected=null;
 const store={personalTaskDialog:dialog,personalTaskTitle:title,svNewTaskPlacePanel:panel};
 const window={SEYVEO_TASK_PLACES:{...places,suggestedCity:()=> 'Краснодар'},
  SEYVEO_SEARCH_HUB:{findPlace:async()=>{searched++;return {ambiguous:true,candidates:[
   {name:'Кафе 1',address:'Красная 1, Краснодар',lat:45.02,lon:38.97},
   {name:'Кафе 2',address:'Красная 2, Краснодар',lat:45.03,lon:38.98}
  ]}}},
  SEYVEO_TASK_PLACE_EDITOR:{suggest:value=>{selected=value;return true}},
  dispatchEvent:()=>{}};
 const document={getElementById:id=>store[id],createElement:tag=>new Node(tag)};
 class MutationObserver{observe(){}}
 vm.runInNewContext(source,{window,document,URL,MutationObserver,Event:class{},setTimeout,clearTimeout});
 const picker=window.SEYVEO_MEETING_PLACE_PICKER;
 picker.render();const section=panel.next;
 assert(!section.hidden);assert.equal(searched,0,'typing a meeting must not trigger a search');
 descendants(section).find(x=>x.textContent==='Подобрать').click();
 assert(descendants(section).some(x=>x.textContent==='Свидание'));
 descendants(section).find(x=>x.textContent==='Деловая').click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(searched,1);
 assert.equal(descendants(section).filter(x=>x.className==='sv-meeting-place-choice').length,2);
 descendants(section).find(x=>x.className==='sv-meeting-place-choice').click();
 assert.equal(selected.name,'Кафе 1');
 assert(section.hidden,'suggestion is dismissed after person selects a place to confirm');
 title.value='Завтра встреча в кафе Ромашка';picker.render();
 assert(section.hidden,'a named venue must not be replaced by a recommendation');
});

test('unnamed category objects are not presented as recommended restaurants',async()=>{
 const dialog=new Node('dialog');dialog.open=true;
 const title=new Node('textarea');title.value='Завтра деловая встреча с Романом';
 const panel=new Node('section');
 const store={personalTaskDialog:dialog,personalTaskTitle:title,svNewTaskPlacePanel:panel};
 const window={SEYVEO_TASK_PLACES:{...places,suggestedCity:()=> 'Краснодар'},
  SEYVEO_SEARCH_HUB:{findPlace:async()=>({ambiguous:true,candidates:[
   {name:'Кафе',address:'улица Красная 1 · Краснодар',lat:45.02,lon:38.97},
   {name:'Кофейня Романтика',address:'улица Красная 2 · Краснодар',lat:45.03,lon:38.98}
  ]})},
  SEYVEO_TASK_PLACE_EDITOR:{suggest:()=>true},dispatchEvent:()=>{}};
 const document={getElementById:id=>store[id],createElement:tag=>new Node(tag)};
 class MutationObserver{observe(){}}
 vm.runInNewContext(source,{window,document,URL,MutationObserver,Event:class{},setTimeout,clearTimeout});
 window.SEYVEO_MEETING_PLACE_PICKER.render();
 const section=panel.next;
 descendants(section).find(x=>x.textContent==='Подобрать').click();
 descendants(section).find(x=>x.textContent==='Деловая').click();
 await new Promise(resolve=>setImmediate(resolve));
 const shown=descendants(section).filter(x=>x.className==='sv-meeting-place-choice');
 assert.equal(shown.length,1);
 assert.equal(shown[0].children[0].textContent,'Кофейня Романтика');
 assert(!descendants(section).some(x=>x.tagName==='a'),
  'suggestions remain in New Task without an unrelated Yandex Maps directory link');
});
