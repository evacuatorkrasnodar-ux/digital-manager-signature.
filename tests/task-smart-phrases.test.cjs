const test = require('node:test');
const assert = require('node:assert/strict');
const {plan,parse} = require('../assets/seyveo-task-smart-nl.js');

const now = new Date(2026, 10, 16, 10, 0);

test('understands several tasks without commas and capitalizes names', () => {
 const result = plan('завтра позвонить мише и купить хлеб', now);
 assert.deepEqual(result.items.map(item => item.title), ['Позвонить Мише', 'Купить хлеб']);
 assert.deepEqual(result.items.map(item => item.date), ['2026-11-17', '2026-11-17']);
});

test('keeps distinct dates and times for independent actions', () => {
 const result = plan('сегодня в 16 встретиться с андреем завтра в 10 забрать документы', now);
 assert.deepEqual(result.items.map(({title,date,time}) => ({title,date,time})), [
  {title:'Встретиться с Андреем',date:'2026-11-16',time:'16:00'},
  {title:'Забрать документы',date:'2026-11-17',time:'10:00'}
 ]);
});

test('does not split ordinary list items into separate tasks', () => {
 assert.equal(plan('купить хлеб молоко и яйца', now).items.length, 1);
});

test('normalizes venue spelling while retaining one task', () => {
 assert.equal(plan('в пятницу встретиться с наташей в кафе вкусно и точка', now).items[0].title,
  'Встретиться с Наташей в кафе «Вкусно — и точка»');
 assert.equal(plan('завтра в 18 встретиться с романом в кафе вкусно и точка краснодар»',now).items[0].title,
  'Встретиться с Романом в кафе «Вкусно — и точка», Краснодар');
});

test('recognizes dates inside an entirely quoted phrase without swallowing venue quotes',()=>{
 const phrase='«завтра в 18 встретиться с романом в кафе вкусно и точка краснодар»';
 assert.equal(parse(phrase,now).date,'2026-11-17');
 assert.equal(parse(phrase,now).time,'18:00');
 assert.deepEqual(plan(phrase,now).items.map(({title,date,time})=>({title,date,time})),[
  {title:'Встретиться с Романом в кафе «Вкусно — и точка», Краснодар',date:'2026-11-17',time:'18:00'}
 ]);
 assert.deepEqual(plan('«завтра в 10 позвонить мише и в 12 купить хлеб»',now).items.map(item=>item.date),[
  '2026-11-17','2026-11-17'
 ]);
});

test('corrects safe common misspellings before reading the schedule', () => {
 const result=plan('сегдня в 16 пазвонить мише зафтра купить хлеб',now);
 assert.deepEqual(result.items.map(item=>item.title),['Позвонить Мише','Купить хлеб']);
 assert.deepEqual(result.items.map(item=>item.date),['2026-11-16','2026-11-17']);
});

test('preserves Roman as a person but not as the word for a novel', () => {
 assert.equal(plan('завтра позвонить роману',now).items[0].title,'Позвонить Роману');
 assert.equal(plan('встретиться с романом',now).items[0].title,'Встретиться с Романом');
 assert.equal(plan('купить роман для мамы',now).items[0].title,'Купить роман для мамы');
});

test('capitalizes unfamiliar names in personal contexts without changing nouns', () => {
 assert.equal(plan('позвонить виталику',now).items[0].title,'Позвонить Виталику');
 assert.equal(plan('встреча с валерием',now).items[0].title,'Встреча с Валерием');
 assert.equal(plan('позвонить оператору',now).items[0].title,'Позвонить оператору');
 assert.equal(plan('написать письмо',now).items[0].title,'Написать письмо');
});

test('can preview five distinct tasks without losing any', () => {
 const result = plan('купить хлеб и позвонить мише и оплатить счет и отправить письмо и забрать посылку', now);
 assert.equal(result.needsReview, false);
 assert.equal(result.items.length, 5);
});

test('understands mixed meeting and action requests in a single line',()=>{
 const result=plan('завтра в 10 встреча с клиентом, в 12 купить молоко; в 17 совещание с командой',now);
 assert.deepEqual(result.items.map(({title,date,time})=>({title,date,time})),[
  {title:'Встреча с клиентом',date:'2026-11-17',time:'10:00'},
  {title:'Купить молоко',date:'2026-11-17',time:'12:00'},
  {title:'Совещание с командой',date:'2026-11-17',time:'17:00'}
 ]);
});

test('asks for review instead of silently saving more than twelve tasks',()=>{
 const input=Array.from({length:13},(_,index)=>'купить товар '+(index+1)).join('; ');
 const result=plan(input,now);
 assert.equal(result.items.length,12);
 assert.equal(result.needsReview,true);
});
