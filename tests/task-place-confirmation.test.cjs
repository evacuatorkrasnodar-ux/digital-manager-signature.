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
  this.classList={add:name=>{this.className+=(this.className?' ':'')+name}};
 }
 append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node)}}
 replaceChildren(...nodes){for(const child of this.children)child.parent=null;this.children=[];this.append(...nodes)}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null}}
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
 assert(descendants(panel).some(node=>node.className==='sv-place-map'&&node.tagName==='button'),
  'tapping the thumbnail must open an in-app map rather than a new browser tab');
 const mapButton=descendants(panel).find(node=>node.className==='sv-place-map');
 mapButton.click();
 const map=descendants(dialog).find(node=>node.className==='sv-place-map-overlay');
 assert(map,'in-app map overlay opens on demand');
 assert.equal(map.attributes['aria-modal'],'true');
 assert(descendants(map).filter(node=>node.className==='sv-place-map-tile').length>4,
  'expanded map loads tiles only when the user opens it');
 const navigatorLink=descendants(map).find(node=>node.className==='sv-place-map-route-primary');
 assert.match(navigatorLink.href,/^yandexnavi:\/\/build_route_on_map\?lat_to=45\.02&lon_to=38\.9$/);
 const mapsFallback=descendants(map).find(node=>node.className==='sv-place-map-route-secondary');
 assert.match(mapsFallback.href,/yandex\.ru\/maps\/\?mode=routes/);
 assert(descendants(map).some(node=>node.className==='sv-place-map-credit'&&node.href.includes('openstreetmap.org/copyright')));
 const zoomButton=descendants(map).find(node=>node.className==='sv-place-map-zoom'&&node.textContent==='+');
 assert(zoomButton);
 zoomButton.click();
 assert(descendants(map).some(node=>node.className==='sv-place-map-tile'&&node.src.includes('/17/')),
  'zoom changes the real tiles, not a stretched screenshot');
 const viewport=descendants(map).find(node=>node.className==='sv-place-map-viewport');
 const marker=descendants(map).find(node=>node.className==='sv-place-map-marker');
 const oldMarker=marker.style.left;
 viewport.listeners.pointerdown[0]({pointerId:1,clientX:90,clientY:100,target:{closest:()=>null}});
 viewport.listeners.pointermove[0]({pointerId:1,clientX:115,clientY:100});
 assert.notEqual(marker.style.left,oldMarker,'dragging moves the map beneath the selected marker');
 viewport.listeners.pointerup[0]({pointerId:1});
 descendants(map).find(node=>node.className==='sv-place-map-close').click();
 assert(!descendants(dialog).some(node=>node.className==='sv-place-map-overlay'));
 mapButton.click();
 const anotherMap=descendants(dialog).find(node=>node.className==='sv-place-map-overlay');
 const header=descendants(anotherMap).find(node=>node.className==='sv-place-map-header');
 header.listeners.pointerdown[0]({pointerId:3,clientX:100,clientY:180,target:{closest:()=>null}});
 header.listeners.pointerup[0]({pointerId:3,clientX:105,clientY:310});
 assert(!descendants(dialog).some(node=>node.className==='sv-place-map-overlay'),
  'swiping down the header closes the in-app map without changing the task');
 const button=descendants(panel).find(node=>node.className==='sv-place-confirm');
 assert(button,'the confirmed-location action is visible');
 button.click();
 assert.equal(editor.placeForSave()?.address,'Западный Обход, 41 · Краснодар');
});

test('more city branches can be revealed without losing nearest-first ordering',async()=>{
 const dialog=new Node('dialog');dialog.open=true;
 const title=new Node('textarea');title.value='завтра встреча в кафе Ромашка Краснодар';
 const panel=new Node('section');
 const store={personalTaskDialog:dialog,personalTaskTitle:title,svNewTaskPlacePanel:panel};
 const branches=Array.from({length:8},(_,i)=>({name:'Ромашка '+(i+1),
  address:'Красная, '+(i+1)+' · Краснодар',lat:45+i*.001,lon:38.9}));
 const window={SEYVEO_TASK_PLACES:places,SEYVEO_SEARCH_HUB:{findPlace:async()=>({ambiguous:true,nearby:true,candidates:branches})},
  matchMedia:()=>({matches:false}),dispatchEvent:()=>{},addEventListener:()=>{}};
 const document={getElementById:id=>store[id],createElement:tag=>new Node(tag)};
 class MutationObserver{observe(){}}
 vm.runInNewContext(script,{window,document,MutationObserver,Event:class{},setTimeout,clearTimeout,encodeURIComponent});
 const editor=window.SEYVEO_TASK_PLACE_EDITOR;
 editor.sync();await editor.lookup();
 assert.equal(descendants(panel).filter(el=>el.className==='sv-place-choice').length,5);
 assert(descendants(panel).some(el=>el.className==='sv-place-choice-intro'&&el.textContent.includes('ближайшие')));
 const showMore=descendants(panel).find(el=>el.className==='sv-place-refine-trigger'&&el.textContent.includes('Показать ещё'));
 assert(showMore);showMore.click();
 const visible=descendants(panel).filter(el=>el.className==='sv-place-choice');
 assert.equal(visible.length,8);
 assert.equal(descendants(visible[7]).find(el=>el.tagName==='strong').textContent,'Ромашка 8');
});

test('the confirmed mall entrance photo previews over the map and enlarges with attribution',async()=>{
 const dialog=new Node('dialog');dialog.open=true;
 const title=new Node('textarea');title.value='завтра встреча с Романом в кафе вкусно и точка Краснодар';
 const panel=new Node('section');dialog.append(panel);
 const store={personalTaskDialog:dialog,personalTaskTitle:title,svNewTaskPlacePanel:panel};
 const known={name:'Вкусно — и точка · ТРЦ «Красная Площадь»',
  address:'ул. Дзержинского, 100 · Краснодар · 1-й этаж',lat:45.102210,lon:38.983892,
  source:'known-address',photo:'2024-07-11. Краснодар DSC 2268.jpg'};
 const window={SEYVEO_TASK_PLACES:places,
  SEYVEO_SEARCH_HUB:{findPlace:async()=>known},
  matchMedia:()=>({matches:false}),dispatchEvent:()=>{},addEventListener:()=>{}};
 const document={getElementById:id=>store[id],createElement:tag=>new Node(tag)};
 class MutationObserver{observe(){}}
 vm.runInNewContext(script,{window,document,MutationObserver,Event:class{},setTimeout,clearTimeout,encodeURIComponent});
 const editor=window.SEYVEO_TASK_PLACE_EDITOR;
 editor.sync();await editor.lookup();
 const thumbnail=descendants(panel).find(el=>el.className==='sv-place-photo-link');
 assert(thumbnail,'the verified mall has a photo beside its map');
 assert.equal(thumbnail.tagName,'button','photo opens in the app rather than navigating away');
 assert.match(thumbnail.attributes['aria-label'],/Вход в ТРЦ/);
 assert(descendants(panel).some(el=>el.className==='sv-place-card sv-place-card-has-photo'),
  'a real photo must be large in its own card row, not hidden over the map');
 const photo=descendants(thumbnail).find(el=>el.tagName==='img');
 assert(photo.src.endsWith('assets/seyveo-krasnaya-ploshchad-entrance-2024.jpg'),
  'a known verified entrance photo must load from SEYVEO, not a fragile external hotlink');
 assert(descendants(panel).some(el=>el.className==='sv-place-map'),'the original map remains visible');
 const menu=descendants(panel).find(el=>el.className==='sv-place-menu-link');
 assert(menu&&menu.href==='https://vkusnoitochka.ru/menu',
  'the official menu link is visible without inventing branch-specific prices');
 thumbnail.click();
 const viewer=descendants(dialog).find(el=>el.className==='sv-place-photo-lightbox');
 assert(viewer,'tapping opens a larger in-app image');
 assert(descendants(viewer).some(el=>el.className==='sv-place-photo-large'&&el.src.endsWith('seyveo-krasnaya-ploshchad-entrance-2024.jpg')));
 assert(descendants(viewer).some(el=>el.tagName==='strong'&&el.textContent==='Вход в ТРЦ «Красная Площадь»'),
  'the mall entrance must never be called the cafe entrance');
 assert(descendants(viewer).some(el=>el.tagName==='a'&&el.textContent.includes('Andrew Butko')));
 assert(descendants(viewer).some(el=>el.tagName==='a'&&el.href.includes('creativecommons.org')));
 descendants(viewer).find(el=>el.className==='sv-place-photo-close').click();
 assert(!descendants(dialog).some(el=>el.className==='sv-place-photo-lightbox'));
});

test('a temporarily unavailable photo retries a standard size and explains the fallback',async()=>{
 const dialog=new Node('dialog');dialog.open=true;
 const title=new Node('textarea');title.value='завтра встреча в кафе Ромашка Краснодар';
 const panel=new Node('section');
 const store={personalTaskDialog:dialog,personalTaskTitle:title,svNewTaskPlacePanel:panel};
 const candidate={name:'Ромашка',address:'Краснодар',lat:45,lon:38.9,photo:'Romashka.jpg'};
 const window={SEYVEO_TASK_PLACES:places,SEYVEO_SEARCH_HUB:{findPlace:async()=>candidate},
  matchMedia:()=>({matches:false}),dispatchEvent:()=>{},addEventListener:()=>{}};
 const document={getElementById:id=>store[id],createElement:tag=>new Node(tag)};
 class MutationObserver{observe(){}}
 vm.runInNewContext(script,{window,document,MutationObserver,Event:class{},setTimeout,clearTimeout,encodeURIComponent});
 const editor=window.SEYVEO_TASK_PLACE_EDITOR;
 editor.sync();await editor.lookup();
 const photo=descendants(panel).find(el=>el.className==='sv-place-photo-link');
 const img=descendants(photo).find(el=>el.tagName==='img');
 img.listeners.error[0]();
 assert(img.src.includes('width=250'),'retry uses a second standard Wikimedia size');
 img.listeners.error[0]();
 assert(photo.className.includes('sv-place-photo-unavailable'));
 assert.equal(photo.textContent,'Фото временно недоступно',
  'a loading error must never make the photo disappear without explanation');
 assert(descendants(panel).some(el=>el.className==='sv-place-map'),
  'the map must remain usable when the photo is unavailable');
});

test('Sayvi enriches a non-curated venue photo and displays its real credit',async()=>{
 const dialog=new Node('dialog');dialog.open=true;
 const title=new Node('textarea');title.value='завтра встреча в кафе Ромашка Краснодар';
 const panel=new Node('section');dialog.append(panel);
 const store={personalTaskDialog:dialog,personalTaskTitle:title,svNewTaskPlacePanel:panel};
 let photoRequests=0;
 const window={SEYVEO_TASK_PLACES:places,SEYVEO_SEARCH_HUB:{
  findPlace:async()=>({name:'Кафе Ромашка',address:'ул. Красная, Краснодар',lat:45.05,lon:38.97,
   photo:'Romashka exterior.jpg'}),
  findPlacePhoto:async candidate=>{
   photoRequests++;return {...candidate,photoAuthor:'Автор снимка',photoLicense:'CC BY-SA 4.0',
    photoLicenseURL:'https://creativecommons.org/licenses/by-sa/4.0/'};
  }
 },matchMedia:()=>({matches:false}),dispatchEvent:()=>{},addEventListener:()=>{}};
 const document={getElementById:id=>store[id],createElement:tag=>new Node(tag)};
 class MutationObserver{observe(){}}
 vm.runInNewContext(script,{window,document,MutationObserver,Event:class{},setTimeout,clearTimeout,encodeURIComponent});
 const editor=window.SEYVEO_TASK_PLACE_EDITOR;
 editor.sync();await editor.lookup();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(photoRequests,1,'a direct photo still needs licensing metadata');
 const thumbnail=descendants(panel).find(el=>el.className==='sv-place-photo-link');
 assert(thumbnail);
 thumbnail.click();
 const viewer=descendants(dialog).find(el=>el.className==='sv-place-photo-lightbox');
 assert(descendants(viewer).some(el=>el.tagName==='a'&&el.textContent==='Фото: Автор снимка'));
 assert(descendants(viewer).some(el=>el.tagName==='strong'&&el.textContent==='Фото места'));
});
