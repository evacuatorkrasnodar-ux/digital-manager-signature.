'use strict';
const assert=require('node:assert/strict');
const {fromPhrase,followup}=require('../assets/reminder-dialogue.js');
const now=new Date(2026,9,21,7,0);
const tests=[
 ['напомни позвонить маме','clarify','позвонить маме','',''],
 ['Сэйви, напомни позвонить маме','clarify','позвонить маме','',''],
 ['Напомни завтра в восемь позвонить маме','ready','позвонить маме','2026-10-22','08:00'],
 ['Напомни завтра 8 позвонить маме','ready','позвонить маме','2026-10-22','08:00'],
 ['Напомни позвонить маме завтра в 8 вечера','ready','позвонить маме','2026-10-22','20:00'],
 ['Напомни про 8 этаж','clarify','8 этаж','',''],
 ['Напомни завтра позвонить маме','clarify','позвонить маме','2026-10-22',''],
 ['Напомни сегодня в 06:00 выпить воду','clarify','выпить воду','2026-10-21','06:00'],
 ['Напомни завтра в 15:30 оплатить счёт','ready','оплатить счёт','2026-10-22','15:30'],
 ['Добавь дело купить хлеб',null],
 ['Привет, Сэйви',null]
];
for(const [phrase,status,title,date,time] of tests){
 const r=fromPhrase(phrase,now);
 if(status===null){assert.equal(r,null,phrase);continue}
 assert.equal(r?.status,status,phrase+' status');
 assert.equal(r.title,title,phrase+' title');
 assert.equal(r.date,date,phrase+' date');
 assert.equal(r.time,time,phrase+' time');
}
const pending={title:'позвонить маме',date:'',time:''};
const answers=[
 ['завтра 8','ready','2026-10-22','08:00'],
 ['завтра в восемь утра','ready','2026-10-22','08:00'],
 ['завтра','clarify','2026-10-22',''],
 ['в 8 вечера','clarify','','20:00'],
 ['отмени','cancelled'],
 ['привет',null],
 ['покажи календарь',null],
 ['после обеда','clarify'],
 ['человек из дома',null]
];
for(const [phrase,status,date,time] of answers){
 const r=followup(phrase,pending,now);
 if(status===null){assert.equal(r,null,phrase);continue}
 assert.equal(r?.status,status,phrase+' status');
 if(date!==undefined)assert.equal(r.date,date,phrase+' date');
 if(time!==undefined)assert.equal(r.time,time,phrase+' time');
}
const half=followup('завтра',pending,now);
assert.equal(followup('в 8',{title:half.title,date:half.date,time:half.time},now).status,'ready');
console.log('SEYVEO reminder dialogue: 21 scenarios passed');
