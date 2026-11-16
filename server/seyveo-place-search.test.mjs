import test from 'node:test';
import assert from 'node:assert/strict';
import {safePlaceQuery,searchPlace} from './seyveo-place-search.mjs';

test('sends only a short location query to the fixed official provider',async()=>{
 let url,options;
 const result=await searchPlace('кафе вкусно и точка, Краснодар',{
  fetcher:async(u,o)=>{
   url=new URL(u);options=o;
   return {ok:true,json:async()=>[{
    name:'Вкусно — и точка',display_name:'Вкусно — и точка, Краснодар',type:'fast_food',
    lat:'45.03',lon:'38.97',address:{city:'Краснодар'},
    extratags:{wikidata:'Q123',image:'File:My Cafe.jpg',private_extra:'must-be-removed'}
   }]};
  }
 });
 assert.equal(url.host,'nominatim.openstreetmap.org');
 assert.equal(url.searchParams.get('q'),'кафе вкусно и точка, Краснодар');
 assert.equal(url.searchParams.get('limit'),'15','one explicit search may show several branches in one city');
 assert.match(options.headers['User-Agent'],/SEYVEO/);
 assert.equal(result[0].name,'Вкусно — и точка');
 assert.deepEqual(result[0].extratags,{wikidata:'Q123',wikimedia_commons:'',image:'File:My Cafe.jpg',opening_hours:''});
});

test('returns more than five candidate branches without additional provider calls',async()=>{
 let calls=0;
 const data=Array.from({length:12},(_,i)=>({name:'Ромашка',lat:String(45+i*.001),lon:'38.97',
  type:'cafe',address:{road:'Красная',house_number:String(5+i),city:'Краснодар'}}));
 const results=await searchPlace('кафе Ромашка, Краснодар',{
  fetcher:async()=>{calls++;return {ok:true,json:async()=>data}}
 });
 assert.equal(calls,1);assert.equal(results.length,12);
});

test('rejects empty and too-long place queries',async()=>{
 assert.equal(safePlaceQuery(''), '');
 assert.equal(safePlaceQuery('x'.repeat(160)), '');
 assert.equal(safePlaceQuery('кафе\n  Краснодар'), 'кафе Краснодар');
 await assert.rejects(()=>searchPlace('x'.repeat(160)),/invalid-place-query/);
});
