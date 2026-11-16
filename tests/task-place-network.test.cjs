const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/seyveo-task-places.js'),'utf8');

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
 assert.equal(result.name,'Вкусно и точка');
 assert.equal(result.address.includes('Краснодар'),true);
});
