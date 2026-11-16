const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/seyveo-task-places.js'),'utf8');

test('compact map shows the surrounding streets rather than only the mall roof',()=>{
 const places=require('../assets/seyveo-task-places.js');
 const thumbnails=places.mapTiles({name:'ТЦ Красная Площадь',address:'Дзержинского, 100 · Краснодар',lat:45.10221,lon:38.983892},112,96);
 assert(thumbnails.length>0);
 assert(thumbnails.every(tile=>tile.url.includes('/14/')));
});

test('uses the local same-origin address service without a cross-origin connection',async()=>{
 const urls=[];
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async(url,options)=>{
   urls.push({url,options});
   return {ok:true,json:async()=>({results:[{
    name:'Вкусно и точка',display_name:'Вкусно и точка, Краснодар',type:'fast_food',
    lat:'45.03',lon:'38.97',address:{city:'Краснодар',road:'Улица Красная'}
   }]})};
  }
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встретиться в кафе вкусно и точка краснодар');
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert.equal(urls.length,1);
 assert.equal(urls[0].url,'/api/seyveo-place-lookup');
 assert.equal(JSON.parse(urls[0].options.body).query,'кафе вкусно и точка, Краснодар');
 assert.equal(result.ambiguous,true);
 assert(result.candidates.some(candidate=>candidate.name==='Вкусно и точка'&&candidate.address.includes('Краснодар')));
 assert(result.candidates.some(candidate=>candidate.name.includes('Красная Площадь')&&candidate.address.includes('1-й этаж')));
});

test('searches within the chosen home city and excludes businesses from other cities',async()=>{
 const urls=[];
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  SAYVI_WEATHER:{getLocation:()=>({name:'Москва'})},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async(url,options)=>{
   urls.push(JSON.parse(options.body).query);
   return {ok:true,json:async()=>({results:[
    {name:'Вкусно и точка',type:'fast_food',lat:'45.10',lon:'38.98',address:{city:'Краснодар',road:'Дзержинского'}},
    {name:'Вкусно и точка',type:'fast_food',lat:'55.75',lon:'37.61',address:{city:'Москва',road:'Тверская'}}
   ]})};
  }
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе вкусно и точка');
 assert.equal(proposal.city,'Москва');
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert.equal(urls[0],'кафе вкусно и точка, Москва');
 assert(!result.ambiguous);
 assert(result.address.includes('Москва'));
});

test('asks for a city instead of searching the whole country when no city is known',async()=>{
 let calls=0;
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async()=>{calls++;throw Error('unexpected network search')}
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе вкусно и точка');
 assert.equal(proposal.city,'');
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert.equal(result.cityRequired,true);
 assert.equal(calls,0);
});

test('matches an address inside a shopping mall even when its tenant is absent from OpenStreetMap',async()=>{
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async()=>({ok:true,json:async()=>({results:[
   {name:'Вкусно и точка',type:'fast_food',lat:'45.02',lon:'38.9',address:{city:'Краснодар',road:'Западный Обход',house_number:'41'}}
  ]})})
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе вкусно и точка тц красная площадь дзержинского 100',{city:'Краснодар'});
 assert.equal(proposal.venueName,'Вкусно — и точка');
 assert(proposal.locationHint.includes('дзержинского 100'));
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert(!result.ambiguous,'the different street branch must be filtered out');
 assert.equal(result.source,'known-address');
 assert(result.address.includes('Дзержинского, 100'));
 assert(result.address.includes('1-й этаж'));
 assert(result.lat>45.1&&result.lat<45.11);
 assert(window.SEYVEO_TASK_PLACES.streetViewURL(result).includes('map_action=pano'));
});

test('keeps the known mall address usable during a temporary map outage',async()=>{
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async()=>{throw Error('network offline')}
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе вкусно и точка на улице Дзержинского 100',{city:'Краснодар'});
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert.equal(result.source,'known-address');
 assert(result.address.includes('1-й этаж'));
});

test('recognizes an older running local server and does not retry a blocked external address request',async()=>{
 const urls=[];
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async url=>{urls.push(url);return {ok:false,status:404}}
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('встретиться в кафе вкусно и точка краснодар');
 await assert.rejects(()=>window.SEYVEO_TASK_PLACES.lookup(proposal),/seyveo-place-server-restart-needed/);
 assert.deepEqual(urls,['/api/seyveo-place-lookup']);
});
