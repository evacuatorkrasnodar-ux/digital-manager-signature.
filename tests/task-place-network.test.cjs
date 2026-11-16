const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/seyveo-task-places.js'),'utf8');

test('Yandex Maps handoff passes only the place query after a user click',()=>{
 const places=require('../assets/seyveo-task-places.js');
 const url=new URL(places.yandexSearchURL('Вкусно — и точка, Дзержинского 100, Краснодар'));
 assert.equal(url.origin,'https://yandex.ru');
 assert.equal(url.pathname,'/maps/');
 assert.equal(url.searchParams.get('text'),'Вкусно — и точка, Дзержинского 100, Краснодар');
 assert.equal(places.yandexSearchURL(''),'');
});

test('a shopping-mall landmark qualifies a familiar restaurant, not its brand',async()=>{
 const places=require('../assets/seyveo-task-places.js');
 const examples=[
  'Завтра в 18 встреча с Романом в кафе Вкусно и точка Красная Площадь',
  'Завтра в 18 встреча с Романом в кафе Вкусно и точка добавил Красная Площадь',
  'Завтра в 18 встреча с Романом в кафе Вкусно и точка, Красная Площадь',
  'Завтра в 18 встреча с Романом в кафе Вкусно и точка в ТРЦ Красная Площадь',
  'Завтра в 18 встреча с Романом в кафе Вкусно и точка на Дзержинского 100'
 ];
 for(const phrase of examples){
  const info=places.extract(phrase);
  assert.equal(info?.venueName,'Вкусно — и точка',phrase);
  assert.equal(info.city,'Краснодар',phrase);
  assert.match(info.locationHint,/Красная Площадь|Дзержинского 100/,phrase);
  assert(!/Роман|встреча|18/.test(info.query),'private task text must not enter a place lookup');
 }
 const unknown=places.extract('Завтра встреча в кафе Вкусно и точка на Тверской');
 assert.notEqual(unknown?.city,'Краснодар','an unverified branch should not be moved to Krasnodar');
});

test('the known shopping-mall branch still resolves when the map service is offline',async()=>{
 const window={location:{hostname:'example.github.io',href:'https://example.github.io/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},fetch:async()=>{throw Error('offline')}};
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposed=window.SEYVEO_TASK_PLACES.extract('Завтра в 18 встреча с Романом в кафе Вкусно и точка Красная Площадь');
 const found=await window.SEYVEO_TASK_PLACES.lookup(proposed);
 assert.equal(found.name,'Вкусно — и точка · ТРЦ «Красная Площадь»');
 assert.match(found.address,/Дзержинского, 100/);
});

test('a chain name without a branch stays a choice, even when only one known place is available',async()=>{
 const window={location:{hostname:'demo.github.io',href:'https://demo.github.io/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},fetch:async()=>{throw Error('offline')}};
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('Завтра в 18 встреча с Романом в кафе Вкусно и точка',{city:'Краснодар'});
 assert.equal(proposal.locationHint,'');
 const options=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert.equal(options.ambiguous,true,'the user must select a specific branch');
 assert.equal(options.candidates.length,1);
 assert.match(options.candidates[0].name,/Красная Площадь/);
});

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

test('a meeting category can find real venues without making up a restaurant name',async()=>{
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async()=>({ok:true,json:async()=>({results:[
   {name:'Ресторан Пример',type:'restaurant',lat:'45.05',lon:'38.97',address:{city:'Краснодар',road:'Красная',house_number:'5'}},
   {name:'Бар Пример',type:'bar',lat:'45.06',lon:'38.98',address:{city:'Краснодар',road:'Мира',house_number:'2'}},
   {name:'Ресторан Другой',type:'restaurant',lat:'45.07',lon:'38.98',address:{city:'Краснодар',road:'Горького',house_number:'8'}}
  ]})})
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const value=await window.SEYVEO_TASK_PLACES.lookup({kind:'ресторан',venueName:'',city:'Краснодар',query:'ресторан, Краснодар'});
 assert.equal(value.ambiguous,true);
 assert.equal(value.candidates.length,2);
 assert(value.candidates.every(item=>item.name.includes('Ресторан')));
});

test('an available Yandex business result takes priority without another OSM request',async()=>{
 let nominatimCalls=0,providerCalls=0;
 const window={
  location:{hostname:'demo.github.io',href:'https://demo.github.io/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  SEYVEO_YANDEX_PLACES:{lookup:async proposal=>{
   providerCalls++;
   assert.equal(proposal.city,'Краснодар');
   return {name:'Кофейня Ромашка',address:'Краснодар, улица Красная, 5',
    lat:45.05,lon:38.97,source:'yandex',openingHours:'ежедневно, 10:00–21:00'};
  }},
  fetch:async()=>{nominatimCalls++;throw Error('Unexpected map call')}
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const found=await window.SEYVEO_TASK_PLACES.lookup({query:'кофейня Ромашка, Краснодар',
  city:'Краснодар',kind:'кофейня',venueName:'Ромашка'});
 assert.equal(found.source,'yandex');
 assert.match(found.openingHours,/10:00–21:00/);
 assert.equal(providerCalls,1);
 assert.equal(nominatimCalls,0);
});

test('an unqualified chain asks Yandex for city-wide branches before the local example',async()=>{
 let providerCalls=0,nominatimCalls=0;
 const window={location:{hostname:'demo.github.io',href:'https://demo.github.io/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  SEYVEO_YANDEX_PLACES:{lookup:async proposal=>{
   providerCalls++;
   assert.equal(proposal.locationHint,'');
   return {name:'Вкусно — и точка',address:'Краснодар, ул. Красная, 1',
    lat:45.05,lon:38.97,source:'yandex'};
  }},fetch:async()=>{nominatimCalls++;throw Error('unexpected fallback')}};
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('Завтра встреча в кафе Вкусно и точка',{city:'Краснодар'});
 const options=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert.equal(providerCalls,1);
 assert.equal(nominatimCalls,0);
 assert.equal(options.ambiguous,true);
 assert.equal(options.candidates.length,1);
 assert.match(options.candidates[0].address,/Красная, 1/);
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

test('orders all returned city branches from the already granted device location',async()=>{
 let permissionChecks=0,positionCalls=0;
 const requests=[];
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  SAYVI_WEATHER:{getLocation:()=>({name:'Краснодар'})},
  navigator:{permissions:{query:async({name})=>{assert.equal(name,'geolocation');permissionChecks++;return {state:'granted'}}},
   geolocation:{getCurrentPosition:success=>{positionCalls++;success({coords:{latitude:45.053,longitude:38.976,accuracy:30}})}}},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async(url,options)=>{
   requests.push({url,body:JSON.parse(options.body)});
   return {ok:true,json:async()=>({results:[
    {name:'Ромашка',type:'cafe',lat:'45.145',lon:'39.05',address:{city:'Краснодар',road:'Северная',house_number:'2'}},
    {name:'Ромашка',type:'cafe',lat:'45.054',lon:'38.976',address:{city:'Краснодар',road:'Красная',house_number:'5'}},
    {name:'Ромашка',type:'cafe',lat:'45.08',lon:'38.98',address:{city:'Краснодар',road:'Тургенева',house_number:'40'}}
   ]})};
  }
 };
 vm.runInNewContext(source,{window,URL,setTimeout,clearTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе Ромашка');
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert.equal(permissionChecks,1);assert.equal(positionCalls,1);
 assert.equal(result.nearby,true);
 assert.deepEqual(Array.from(result.candidates,c=>c.address.split(' · ')[0]),['Красная, 5','Тургенева, 40','Северная, 2']);
 assert.equal(requests.length,1);
 assert.equal(requests[0].body.query,'кафе Ромашка, Краснодар');
 assert.deepEqual(Object.keys(requests[0].body),['query'],'the GPS position never leaves the browser');
});

test('never requests a new OS location permission when it is not already granted',async()=>{
 let positionCalls=0;
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  navigator:{permissions:{query:async()=>({state:'prompt'})},geolocation:{getCurrentPosition:()=>{positionCalls++}}},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async()=>({ok:true,json:async()=>({results:[
   {name:'Ромашка',type:'cafe',lat:'45.06',lon:'38.97',address:{city:'Краснодар',road:'Красная'}}
  ]})})
 };
 vm.runInNewContext(source,{window,URL,setTimeout,clearTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе Ромашка',{city:'Краснодар'});
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert(result.address.includes('Краснодар'));
 assert.equal(positionCalls,0);
});

test('filters only the requested street, including Russian grammatical endings',async()=>{
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async()=>({ok:true,json:async()=>({results:[
   {name:'Ромашка',type:'cafe',lat:'45.02',lon:'38.97',address:{city:'Краснодар',road:'Дзержинского',house_number:'100'}},
   {name:'Ромашка',type:'cafe',lat:'45.03',lon:'38.98',address:{city:'Краснодар',road:'Красная',house_number:'41'}},
   {name:'Ромашка',type:'cafe',lat:'45.04',lon:'38.99',address:{city:'Москва',road:'Красная',house_number:'42'}}
  ]})})
 };
 vm.runInNewContext(source,{window,URL,setTimeout,clearTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе Ромашка на улице Красной',{city:'Краснодар'});
 assert.equal(proposal.locationHint,'на улице Красной');
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert(!result.ambiguous);assert.match(result.address,/Красная, 41/);
});

test('requires the exact house, never silently replacing 10 with 100',async()=>{
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async()=>({ok:true,json:async()=>({results:[
   {name:'Ромашка',type:'cafe',lat:'45.02',lon:'38.97',address:{city:'Краснодар',road:'Красная',house_number:'100'}},
   {name:'Ромашка',type:'cafe',lat:'45.03',lon:'38.98',address:{city:'Краснодар',road:'Красная',house_number:'10'}}
  ]})})
 };
 vm.runInNewContext(source,{window,URL,setTimeout,clearTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе Ромашка ул Красная 10',{city:'Краснодар'});
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert(!result.ambiguous);assert.match(result.address,/Красная, 10/);
 assert.doesNotMatch(result.address,/100/);
});

test('with GPS but no saved city, shows only nearby results, never other regions',async()=>{
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  navigator:{permissions:{query:async()=>({state:'granted'})},
   geolocation:{getCurrentPosition:success=>success({coords:{latitude:45.05,longitude:38.97,accuracy:40}})}},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  fetch:async()=>({ok:true,json:async()=>({results:[
   {name:'Ромашка',type:'cafe',lat:'55.75',lon:'37.62',address:{city:'Москва',road:'Тверская'}},
   {name:'Ромашка',type:'cafe',lat:'45.06',lon:'38.97',address:{city:'Краснодар',road:'Красная'}}
  ]})})
 };
 vm.runInNewContext(source,{window,URL,setTimeout,clearTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе Ромашка');
 assert.equal(proposal.city,'');
 const result=await window.SEYVEO_TASK_PLACES.lookup(proposal);
 assert(!result.ambiguous);assert.match(result.address,/Краснодар/);
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

test('a voluntary saved home city can replace GPS for place searches',()=>{
 const window={
  location:{hostname:'127.0.0.1',href:'http://127.0.0.1:8790/'},
  SEYVEO_SAVED_PLACES:{city:()=> 'Краснодар'},
  localStorage:{getItem:()=>null,setItem:()=>{}}
 };
 vm.runInNewContext(source,{window,URL,setTimeout,encodeURIComponent});
 const proposal=window.SEYVEO_TASK_PLACES.extract('завтра встреча в кафе Ромашка');
 assert.equal(proposal.city,'Краснодар');
 assert.equal(proposal.query,'кафе Ромашка, Краснодар');
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
 assert.equal(window.SEYVEO_TASK_PLACES.photoURL(result,960),'assets/seyveo-krasnaya-ploshchad-entrance-2024.jpg');
 const localPhoto=path.join(__dirname,'../assets/seyveo-krasnaya-ploshchad-entrance-2024.jpg');
 assert.equal(fs.readFileSync(localPhoto).subarray(0,3).toString('hex'),'ffd8ff',
  'the real JPEG must be committed alongside the UI');
 const unrelated={name:'Другое кафе',address:'Краснодар, ул. Красная',lat:45.03,lon:38.97,photo:'Cafe exterior.jpg'};
 assert(window.SEYVEO_TASK_PLACES.photoURL(unrelated).includes('width=500'));
 assert(window.SEYVEO_TASK_PLACES.photoURL(unrelated,240).includes('width=250'));
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
