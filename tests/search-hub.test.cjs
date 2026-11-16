const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/seyveo-search-hub.js'),'utf8');

function setup({approved=false}={}){
 const store=new Map(approved?[['seyveo-place-search-consent-v1','yes']]:[]);
 const calls=[];
 const window={
  localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},
  confirm:()=>false,
  SEYVEO_TASK_PLACES:{
   lookup:async proposal=>{calls.push(proposal);return {name:'Место',address:proposal.query}},
   resolvePhoto:async place=>place
  }
 };
 vm.runInNewContext(source,{window});
 return {hub:window.SEYVEO_SEARCH_HUB,calls};
}

test('does not search an address without user consent',async()=>{
 const {hub,calls}=setup();
 const result=await hub.findPlace({query:'Дзержинского 100'});
 assert.equal(result.consentRequired,true);
 assert.equal(calls.length,0);
});

test('sends only a short place proposal to the shared place provider',async()=>{
 const {hub,calls}=setup({approved:true});
 const proposal={query:'кафе Вкусно и точка, Краснодар'};
 const result=await hub.findPlace(proposal);
 assert.equal(result.address,proposal.query);
 assert.deepEqual(calls[0],proposal);
});
