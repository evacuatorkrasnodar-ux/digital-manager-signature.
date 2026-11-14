const assert=require('node:assert/strict');
const {extract,cleanPlace,mapURL,photoURL}=require('../assets/seyveo-task-places.js');
const cases=[
 ['Встреча с Леной завтра в 11 в кафе Пушкин в Краснодаре',{label:'кафе «Пушкин»',query:'кафе Пушкин, Краснодар'}],
 ['Пообедать в кофейне «Surf Coffee» в четверг в 12',{label:'кофейня «Surf Coffee»',query:'кофейня Surf Coffee'}],
 ['Встреча в ресторане Рис сегодня в 20',{label:'ресторан «Рис»',query:'ресторан Рис'}],
 ['Встретиться в кафе «Магия кофе» послезавтра',{label:'кафе «Магия кофе»',query:'кафе Магия кофе'}],
 ['Встреча с Анной по адресу Краснодар, ул. Красная, 20 завтра',{label:'Место встречи',query:'Краснодар, ул. Красная, 20'}]
];
for(const [phrase,expected] of cases){
 const result=extract(phrase);assert.ok(result,'No place: '+phrase);
 assert.equal(result.label,expected.label,phrase);assert.equal(result.query,expected.query,phrase);
}
for(const phrase of ['Позвонить Анне завтра в 12','Встреча с Анной в четверг','Купить хлеб в кафе','Кофе с другом в кафе']){
 assert.equal(extract(phrase),null,'Wrong place from: '+phrase);
}
assert.equal(cleanPlace({name:'Cafe',address:'улица',lat:'250',lon:'40'}),null);
assert.equal(cleanPlace({name:'Cafe',address:'улица',lat:'45.012',lon:'38.993'}).lat,45.012);
assert.ok(mapURL({name:'Cafe',address:'улица',lat:45.012,lon:38.993}).includes('marker=45.012000'));
assert.ok(photoURL({photo:'File:Coffee.jpg'}).includes('Coffee.jpg'));
assert.equal(photoURL({photo:'https://example.com/wrong.jpg'}),'');
console.log('SEYVEO place extraction: '+(cases.length+4)+' phrases + map/photo validation OK');
