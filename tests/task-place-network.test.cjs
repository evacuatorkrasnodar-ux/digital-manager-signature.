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
 const info=window.SEYVEO_TASK_PLACES.photoInfo(result);
 assert.match(info.label,/Вход в ТРЦ «Красная Площадь»/);
 assert.equal(info.author,'Andrew Butko');
 assert.equal(info.license,'CC BY-SA 4.0');
 assert(window.SEYVEO_TASK_PLACES.photoURL(result,960).includes('width=960'));
 assert(window.SEYVEO_TASK_PLACES.photoURL(result).includes('width=500'));
 assert(window.SEYVEO_TASK_PLACES.photoURL(result,240).includes('width=250'));
 const previousSave={...result};delete previousSave.photo;
 assert.equal(window.SEYVEO_TASK_PLACES.cleanPlace(previousSave).photo,result.photo,
  'previously saved tasks must acquire the verified photo too');
 assert.equal(window.SEYVEO_TASK_PLACES.photoInfo({name:'Произвольное кафе',address:'Другая улица',
  lat:45.12,lon:38.99,photo:result.photo}).author,'',
  'a photo of the mall must not be falsely attributed to an unrelated venue');
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

test('automatically uses only the exact venue Commons photo and its real photographer credit',async()=>{
 const urls=[];
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async(url)=>{
   urls.push(url);
   if(String(url).startsWith('/api/'))return {ok:true,json:async()=>({results:[{
    name:'Ромашка',type:'cafe',display_name:'Ромашка, Краснодар',
    lat:'45.065',lon:'38.972',address:{road:'Красная',city:'Краснодар'},
    extratags:{wikimedia_commons:'File:Romashka entrance.jpg',image:'https://bad.example/photo.jpg'}
   }]})};
   assert.equal(new URL(url).hostname,'commons.wikimedia.org');
   return {ok:true,json:async()=>({query:{pages:{123:{imageinfo:[{extmetadata:{
    Artist:{value:'<a href="https://commons.wikimedia.org/wiki/User:Photographer">Иван Автор</a>'},
    LicenseShortName:{value:'CC BY-SA 4.0'},
    LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0/'}
   }}]}}}})};
  }
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const places=window.SEYVEO_TASK_PLACES;
 const proposal=places.extract('завтра встреча в кафе Ромашка',{city:'Краснодар'});
 const venue=await places.lookup(proposal);
 assert.equal(venue.photo,'Romashka entrance.jpg');
 assert.equal(venue.photoAuthor,'');
 const enriched=await places.resolvePhoto(venue);
 assert.equal(enriched.photo,'Romashka entrance.jpg');
 assert.equal(enriched.photoAuthor,'Иван Автор');
 assert.equal(enriched.photoLicense,'CC BY-SA 4.0');
 assert(places.photoInfo(enriched).sourceURL.includes('commons.wikimedia.org'));
 assert.equal(places.photoInfo(enriched).label,'Фото места',
  'a linked picture is not automatically a verified photo of the entrance');
 await places.resolvePhoto(venue);
 assert.equal(urls.filter(url=>String(url).includes('commons.wikimedia.org/w/api.php')).length,1,
  'the same Commons file metadata is cached');
});

test('accepts a Wikimedia file page from OSM but rejects unrelated image hosts',()=>{
 const places=require('../assets/seyveo-task-places.js');
 const basis={name:'Кофейня',address:'Москва, Тверская',lat:55.76,lon:37.61};
 assert.equal(places.cleanPlace({...basis,photo:'https://commons.wikimedia.org/wiki/File:Coffee_Shop.jpg'}).photo,'Coffee Shop.jpg');
 assert.equal(places.cleanPlace({...basis,photo:'https://images.example.com/coffee.jpg'}).photo,'');
 assert.equal(places.cleanPlace({...basis,photo:'Category:Coffee shops'}).photo,'');
});

test('can obtain a photo from an exact Wikidata item when OSM has no direct photo',async()=>{
 const urls=[];
 const window={fetch:async url=>{
  urls.push(String(url));
  if(String(url).includes('wikidata.org'))return {ok:true,json:async()=>({entities:{Q123:{claims:{P18:[{
   mainsnak:{datavalue:{value:'My Cafe.jpg'}}
  }]}}}})};
  return {ok:true,json:async()=>({query:{pages:{77:{imageinfo:[{extmetadata:{
   Artist:{value:'Jane Photographer'},LicenseShortName:{value:'CC BY 4.0'},
   LicenseUrl:{value:'https://creativecommons.org/licenses/by/4.0/'}
  }}]}}}})};
 }};
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const place={name:'My Cafe',address:'Somewhere',lat:45.0,lon:38.9,wikidata:'Q123'};
 const enriched=await window.SEYVEO_TASK_PLACES.resolvePhoto(place);
 assert.equal(enriched.photo,'My Cafe.jpg');
 assert.equal(enriched.photoAuthor,'Jane Photographer');
 assert.equal(enriched.photoLicense,'CC BY 4.0');
 assert.equal(urls.length,2);
});
