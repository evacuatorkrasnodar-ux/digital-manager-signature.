const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../assets/seyveo-saved-places.js'),'utf8');

function boot(){
 const state=new Map();const events=[];
 const storage={getItem:key=>state.get(key)||null,setItem:(key,value)=>state.set(key,value),removeItem:key=>state.delete(key)};
 const window={localStorage:storage,dispatchEvent:event=>events.push(event.type)};
 vm.runInNewContext(code,{window,Event:class{constructor(type){this.type=type}}});
 return {api:window.SEYVEO_SAVED_PLACES,state,events};
}

test('home and work are entirely optional and saved only on deliberate action',()=>{
 const {api,state,events}=boot();
 assert.deepEqual(Object.keys(api.read()),[]);
 assert.equal(state.size,0);
 assert.equal(api.set('home','Краснодар, ул. Красная, 12'),true);
 assert.equal(api.set('work','Краснодар, Дзержинского, 100'),true);
 assert.equal(api.city(),'Краснодар');
 assert.equal(api.read().work,'Краснодар, Дзержинского, 100');
 assert.equal(state.size,1,'no second location telemetry store is created');
 assert(events.includes('seyveo:saved-places-changed'));
});

test('saved addresses can be selectively deleted without geolocation',()=>{
 const {api,state}=boot();
 assert.equal(api.set('home','Москва, Тверская 10'),true);
 assert.equal(api.set('work','Москва, Арбат 4'),true);
 assert.equal(api.remove('home'),true);
 assert.equal(api.read().home,undefined);
 assert.equal(api.read().work,'Москва, Арбат 4');
 assert.equal(api.remove('work'),true);
 assert.equal(state.size,0,'clearing both actually removes the stored record');
 assert.equal(api.city(),'');
});

test('rejects empty, oversized and unsafe addresses',()=>{
 const {api,state}=boot();
 assert.equal(api.set('home',''),false);
 assert.equal(api.set('home','x'.repeat(161)),false);
 assert.equal(api.set('something','Краснодар, Красная 1'),false);
 assert.equal(state.size,0);
});
