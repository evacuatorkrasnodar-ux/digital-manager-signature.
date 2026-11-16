const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../assets/seyveo-task-places-ui.js'),'utf8');
const places=require('../assets/seyveo-task-places.js');

class Node{
 constructor(tag='div'){
  this.tagName=tag;this.children=[];this.listeners={};this.attributes={};this.hidden=false;
  this.style={};this.className='';this.textContent='';this.value='';
 }
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=[...nodes]}
 after(node){this.next=node}
 addEventListener(type,callback){(this.listeners[type]??=[]).push(callback)}
 setAttribute(key,value){this.attributes[key]=String(value)}
 click(){for(const fn of this.listeners.click||[])fn({preventDefault(){}})}
}
function descendants(node){return [node,...node.children.flatMap(descendants)]}

test('a found branch stays a suggestion until the user confirms the real address',async()=>{
 const dialog=new Node('dialog');dialog.open=true;
 const title=new Node('textarea');title.value='завтра в 18 встретиться с романом в кафе вкусно и точка Краснодар';
 const panel=new Node('section');
 const store={personalTaskDialog:dialog,personalTaskTitle:title,svNewTaskPlacePanel:panel};
 let searched=0;
 const window={
  SEYVEO_TASK_PLACES:places,
  SEYVEO_SEARCH_HUB:{findPlace:async()=>{
   searched++;
   return {name:'Вкусно и точка',address:'Западный Обход, 41 · Краснодар',lat:45.02,lon:38.9};
  }},
  matchMedia:()=>({matches:false}),dispatchEvent:()=>{},addEventListener:()=>{}
 };
 const document={getElementById:id=>store[id],createElement:tag=>new Node(tag)};
 class MutationObserver{observe(){}}
 vm.runInNewContext(script,{window,document,MutationObserver,Event:class{},setTimeout,clearTimeout,encodeURIComponent});
 const editor=window.SEYVEO_TASK_PLACE_EDITOR;
 editor.sync();await editor.lookup();
 assert.equal(searched,1);
 assert.equal(editor.placeForSave(),null,'an unconfirmed branch must not become a saved destination');
 const tiles=descendants(panel).filter(node=>node.className==='sv-place-map-tile');
 assert(tiles.length>0);
 assert(tiles.every(tile=>tile.referrerPolicy==='strict-origin-when-cross-origin'),
  'map tiles must identify their source so OpenStreetMap does not send an Access blocked image');
 assert.equal(descendants(panel).filter(node=>node.className==='sv-place-credit').length,0,
  'technical map footnotes must not take space beneath the small map');
 assert(!descendants(panel).some(node=>node.className==='sv-place-attribution'),
  'tiny thumbnail must not show a source badge');
 assert(descendants(panel).some(node=>node.className==='sv-place-map'&&node.href.includes('openstreetmap.org')),
  'tapping the thumbnail must still open its original map');
 const button=descendants(panel).find(node=>node.className==='sv-place-confirm');
 assert(button,'the confirmed-location action is visible');
 button.click();
 assert.equal(editor.placeForSave()?.address,'Западный Обход, 41 · Краснодар');
});
