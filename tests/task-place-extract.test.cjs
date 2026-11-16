const test=require('node:test');
const assert=require('node:assert/strict');
const {extract}=require('../assets/seyveo-task-places.js');

test('understands a cafe name and unmarked city without putting the city into the brand',()=>{
 const result=extract('завтра в 18 встретиться с романом в кафе вкусно и точка краснодар»');
 assert.equal(result.label,'кафе «Вкусно — и точка»');
 assert.equal(result.city,'Краснодар');
 assert.equal(result.query,'кафе вкусно и точка, Краснодар');
});

test('does not invent a place when only a meeting is mentioned',()=>{
 assert.equal(extract('завтра встретиться с романом'),null);
});
