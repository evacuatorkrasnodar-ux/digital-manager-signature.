const test=require('node:test');
const assert=require('node:assert/strict');
const {accept}=require('../assets/seyveo-task-ai-policy.js');
const {plan}=require('../assets/seyveo-task-smart-nl.js');
const {extract}=require('../assets/seyveo-task-places.js');
const now=new Date(2026,10,16,11,0);

test('protects a correctly read meeting from a local model dropping the cafe and repeating the time',()=>{
 const phrase='завтра в 18 встретиться с романом в кафе вкусно и точка Краснодар';
 const baseline=plan(phrase,now);
 const wrong=[{title:'Встретиться с Романом в кафе в Краснодаре в 18:00',date:'2026-11-17',time:'18:00'}];
 assert.equal(baseline.items[0].title,'Встретиться с Романом в кафе «Вкусно — и точка», Краснодар');
 assert.equal(accept(phrase,wrong,baseline,extract),false);
});

test('does not accept a model hallucinating a different venue or person',()=>{
 const phrase='встретиться с романом в кафе вкусно и точка краснодар';
 assert.equal(accept(phrase,[{title:'Встретиться с Иваном в кафе «Пальма» в Краснодаре'}],null,extract),false);
 assert.equal(accept(phrase,[{title:'Встретиться с Романом в кафе «Вкусно и точка» в Краснодаре'}],null,extract),true);
});

test('allows a useful suggestion when there are no protected place details and schedule is uncertain',()=>{
 assert.equal(accept('позвонить мише',[{title:'Позвонить Мише',date:'',time:''}],null,extract),true);
});
