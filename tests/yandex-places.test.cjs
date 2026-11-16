const test=require('node:test');
const assert=require('node:assert/strict');
const yandex=require('../assets/seyveo-yandex-places.js');
const places=require('../assets/seyveo-task-places.js');

function response(name,address,{lon=38.98,lat=45.04,hours='ежедневно, 10:00–22:00'}={}){
 return {type:'FeatureCollection',features:[{
  type:'Feature',properties:{name,description:address,CompanyMetaData:{
   name,address,Address:{formatted:address,Components:[{kind:'locality',name:'Краснодар'}]},
   Hours:{text:hours},url:'https://example.org/menu'}},
  geometry:{type:'Point',coordinates:[lon,lat]}
 }]};
}

test('Yandex venue lookup sends only a category/place query and reads business hours',async()=>{
 let received;
 const proposal={query:'кафе Ромашка, Краснодар',kind:'кафе',venueName:'Ромашка',city:'Краснодар'};
 const value=await yandex.lookup(proposal,{fetcher:async(url,options)=>{
  received={url:new URL(url),options};
  return {ok:true,status:200,json:async()=>response('Ромашка','Краснодар, улица Красная, 5')};
 }});
 assert.equal(received.url.hostname,'search-maps.yandex.ru');
 assert.equal(received.url.searchParams.get('type'),'biz');
 assert.equal(received.url.searchParams.get('text'),proposal.query);
 assert(!received.url.searchParams.get('text').includes('Роман'));
 assert.equal(received.options.credentials,'omit');
 assert.equal(value.name,'Ромашка');
 assert.equal(value.source,'yandex');
 assert.match(places.cleanPlace(value).openingHours,/10:00–22:00/);
 assert.equal(places.cleanPlace(value).websiteURL,'https://example.org/menu');
});

test('does not silently suggest another city or street from Yandex results',()=>{
 const input={type:'FeatureCollection',features:[
  ...response('Ромашка','Москва, улица Красная, 5').features,
  ...response('Ромашка','Краснодар, улица Мира, 8').features,
  ...response('Ромашка','Краснодар, улица Красная, 10').features
 ]};
 const proposal={query:'кафе Ромашка на Красной 10 Краснодар',kind:'кафе',venueName:'Ромашка',
  city:'Краснодар',locationHint:'на Красной 10'};
 const found=yandex.parse(input,proposal);
 assert.equal(found.length,1);
 assert.match(found[0].address,/Красная, 10/);
});

test('an unknown venue name cannot be replaced by a similar Yandex listing',()=>{
 const result=yandex.parse(response('Кофейня Ромашка','Краснодар, ул. Красная, 5'),
  {venueName:'Вкусно — и точка',city:'Краснодар',locationHint:''});
 assert.equal(result.length,0);
});
