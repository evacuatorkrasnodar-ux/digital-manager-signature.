import test from 'node:test';
import assert from 'node:assert/strict';
import {readYandexRoute,read2GISTransit,routeOptions} from './seyveo-route-service.mjs';

test('adds only provider-confirmed leg durations',()=>{
 const data={traffic_type:'realtime',route:{legs:[{status:'OK',steps:[{duration:600},{duration:280}]}]}};
 assert.deepEqual(readYandexRoute(data,'driving'),{mode:'driving',minutes:15,source:'yandex',traffic:'realtime'});
 assert.equal(readYandexRoute({route:{legs:[{status:'FAIL',steps:[]}]}},'walking'),null);
});

test('without a configured key no travel times are returned',async()=>{
 const result=await routeOptions({lat:45.01,lon:38.99},{lat:45.04,lon:38.95},{key:'',key2gis:''});
 assert.deepEqual(result,{status:'not-configured',routes:[]});
});

test('routing adapter uses dedicated provider endpoint, not user text',async()=>{
 const seen=[];
 const mock=async url=>{
  seen.push(new URL(url));
  return {ok:true,json:async()=>({traffic_type:'realtime',route:{legs:[{status:'OK',steps:[{duration:915}]}]}})};
 };
 const result=await routeOptions({lat:45.01,lon:38.99},{lat:45.04,lon:38.95},{key:'local-test',key2gis:'',fetcher:mock});
 assert.equal(result.routes.length,3);
 assert(seen.every(url=>url.host==='api.routing.yandex.net'));
 assert(seen.every(url=>url.searchParams.get('waypoints')==='45.01,38.99|45.04,38.95'));
 assert.deepEqual(seen.map(url=>url.searchParams.get('mode')).sort(),['driving','transit','walking']);
});

test('2GIS transit offers real tram/bus labels and rejects walking-only results',()=>{
 const result=read2GISTransit([{total_duration:2464,pedestrian:false,movements:[
  {type:'passage',routes:[{subtype:'tram',subtype_name:'трамвай',names:['7','Т1']}]},
  {type:'passage',routes:[{subtype:'bus',subtype_name:'автобус',names:['23']}]}
 ]}]);
 assert.deepEqual(result,{mode:'transit',minutes:42,source:'2gis',traffic:'unknown',lines:['трамвай №7','трамвай №Т1','автобус №23']});
 assert.equal(read2GISTransit([{total_duration:1100,pedestrian:true,movements:[]}]),null);
});

test('2GIS route is used for public transport when its key is configured',async()=>{
 const mock=async(url,opts)=>{
  assert.equal(new URL(url).hostname,'routing.api.2gis.com');
  assert.equal(opts.method,'POST');
  return {ok:true,json:async()=>[{total_duration:1000,pedestrian:false,movements:[{routes:[{subtype_name:'маршрутка',names:['45']}]}]}]};
 };
 const result=await routeOptions({lat:45.01,lon:38.99},{lat:45.04,lon:38.95},{key:'',key2gis:'2gis-demo',fetcher:mock});
 assert.equal(result.status,'ready');
 assert.deepEqual(result.routes,[{mode:'transit',minutes:17,source:'2gis',traffic:'unknown',lines:['маршрутка №45']}]);
});
