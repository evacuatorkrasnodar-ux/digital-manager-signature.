'use strict';
const assert=require('node:assert/strict');
const {understand}=require('../assets/task-natural.js');
const now=new Date(2026,9,21,10,0);
const originalDate=Date;
const handlers={};
global.CustomEvent=class{constructor(name,options){this.type=name;this.detail=options.detail;}};
const notes=[];
global.window={
 SEYVEO_TASK_NL:message=>understand(message,now),
 SEYVEO_CALENDAR_NL:message=>/^запиши встречу завтра в 15:00$/i.test(message)?
  {status:'ready',title:'Встреча',date:'2026-10-22',time:'15:00'}:null,
 SEYVEO_NOTE_NL:message=>message==='Запомни мысль: новая идея'?
  {status:'ready',text:'Новая идея'}:null,
 SEYVEO_NOTES_API:{getNotes:()=>notes,putNotes:items=>{notes.splice(0,notes.length,...items);return true}},
 dispatchEvent:e=>{handlers[e.type]?.(e.detail);return true}
};
const {handle}=require('../assets/assistant-local-actions.js');
let tasks=[];
handlers['seyveo:tasks-plan-batch']=detail=>{
 const item=detail.items[0];
 if(tasks.some(x=>x.title===item.title&&x.due===item.due)){detail.result={status:'already'};return}
 tasks.push(item);detail.result={status:'saved'};
};
let calendar=[];
handlers['seyveo:calendar-save-from-ask']=detail=>{
 if(calendar.some(x=>x.title===detail.title)){detail.result={status:'already'};return}
 calendar.push({...detail});detail.result={status:'saved'};
};
assert.equal(handle('Сэйви, напомни завтра позвонить маме').status,'saved');
assert.deepEqual(tasks,[{title:'позвонить маме',due:'2026-10-22'}]);
assert.equal(handle('Сэйви, напомни завтра позвонить маме').status,'already');
assert.equal(handle('Напомни завтра в 15:00 позвонить маме').status,'clarify');
assert.equal(handle('Запиши встречу завтра в 15:00').status,'saved');
assert.equal(calendar[0].time,'15:00');
assert.equal(handle('Запиши встречу завтра в 15:00').status,'already');
assert.equal(handle('Запомни мысль: новая идея').status,'saved');
assert.equal(notes[0].text,'Новая идея');
assert.equal(handle('Запомни мысль: новая идея').status,'already');
assert.equal(handle('Вызови такси').status,null,'Do not pretend to book taxis');
assert.equal(handle('Сделай покупку').status,null,'Do not pretend to shop');
assert.equal(handle('Привет, Сэйви').status,null);
console.log('SEYVEO direct local actions: 12 checks passed');
