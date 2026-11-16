const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../assets/seyveo-task-travel-core.js');

test('calculates a cautious departure from a confirmed journey duration',()=>{
 const result=core.departure('2026-11-17','18:00',{mode:'driving',minutes:28,bufferMinutes:12,source:'yandex'});
 assert.equal(result.time,'17:20');
 assert.equal(result.minutes,40);
});

test('does not invent travel time when no route has been selected',()=>{
 assert.equal(core.departure('2026-11-17','18:00',null),null);
 assert.equal(core.clean({mode:'driving',minutes:0,bufferMinutes:10}),null);
 assert.equal(core.clean({mode:'driving',minutes:27,bufferMinutes:-1}),null);
});

test('taxi deep link only prepares the destination and never orders a ride',()=>{
 const u=new URL(core.taxiURL({lat:45.03,lon:38.97}));
 assert.equal(u.host,'3.redirect.appmetrica.yandex.com');
 assert.equal(u.searchParams.get('end-lat'),'45.03');
 assert.equal(u.searchParams.get('end-lon'),'38.97');
 assert.equal(u.searchParams.get('appmetrica_tracking_id'),'25395763362139037');
 assert.equal(u.searchParams.has('order'),false);
});

test('directions link supports public transport without inventing bus numbers',()=>{
 const u=new URL(core.directionsURL({lat:45.03,lon:38.97},null,'transit'));
 assert.equal(u.searchParams.get('travelmode'),'transit');
 assert.equal(u.searchParams.get('destination'),'45.03,38.97');
});
