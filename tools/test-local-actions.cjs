'use strict';
const assert=require('node:assert/strict');
const {understand}=require('../assets/task-natural.js');
const reminderGrammar=require('../assets/reminder-dialogue.js');
const now=new Date(2026,9,21,10,0);
const originalDate=Date;
const handlers={};
global.CustomEvent=class{constructor(name,options){this.type=name;this.detail=options.detail;}};
const notes=[];
global.window={
 SEYVEO_TASK_NL:message=>understand(message,now),
 SEYVEO_REMINDER_NL:{fromPhrase:phrase=>reminderGrammar.fromPhrase(phrase,now),followup:(phrase,pending)=>reminderGrammar.followup(phrase,pending,now)},
 SEYVEO_CALENDAR_NL:message=>/^запиши встречу завтра в 15:00$/i.test(message)?
  {status:'ready',title:'Встреча',date:'2026-10-22',time:'15:00'}:null,
 SEYVEO_NOTE_NL:message=>message==='Запомни мысль: новая идея'?
  {status:'ready',text:'Новая идея'}:null,
 SEYVEO_NOTES_API:{getNotes:()=>notes,putNotes:items=>{notes.splice(0,notes.length,...items);return true}},
 dispatchEvent:e=>{handlers[e.type]?.(e.detail);return true}
};
const {handle,executePlan}=require('../assets/assistant-local-actions.js');
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
assert.equal(handle('Сэйви, напомни позвонить маме').status,'clarify');
assert.equal(handle('завтра 8').status,'saved');
assert.equal(calendar[0].time,'08:00');
assert.equal(calendar[0].remindAtStart,true);
assert.equal(handle('Сэйви, напомни завтра в 8 позвонить маме').status,'already');
assert.equal(handle('Напомни завтра в 15:00 позвонить маме').status,'already');
assert.equal(handle('Запиши встречу завтра в 15:00').status,'saved');
assert.equal(calendar[1].time,'15:00');
assert.equal(handle('Запиши встречу завтра в 15:00').status,'already');
assert.equal(handle('Запомни мысль: новая идея').status,'saved');
assert.equal(notes[0].text,'Новая идея');
assert.equal(handle('Запомни мысль: новая идея').status,'already');
assert.equal(handle('Вызови такси'),null,'Do not pretend to book taxis');
assert.equal(handle('Сделай покупку'),null,'Do not pretend to shop');
assert.equal(handle('Привет, Сэйви'),null,'Greetings are not actions');
assert.equal(executePlan({kind:'task',draft:{status:'ready',title:'Проверить счёт',date:'2026-10-23'}}).status,'saved');
assert.equal(tasks.at(-1).title,'Проверить счёт');
assert.equal(executePlan({kind:'task',draft:{status:'ready',title:'Проверить счёт',date:'2026-10-23'}}).status,'already');
assert.equal(executePlan({kind:'note',draft:{status:'ready',text:'Идея для завтра'}}).status,'saved');
assert.equal(notes[0].text,'Идея для завтра');
assert.equal(executePlan({kind:'calendar',draft:{status:'ready',title:'Звонок',date:'2026-10-22',time:'14:00'}}).status,'saved');
assert.equal(executePlan({kind:'calendar',draft:{status:'ready',title:'Звонок',date:'',time:'14:00'}}).status,'invalid');
assert.equal(executePlan({kind:'task',draft:{status:'ready',title:'',date:''}}).status,'invalid');
assert.equal(executePlan({kind:'taxi',draft:{status:'ready',title:'До аэропорта'}}).status,'unsupported');
assert.equal(executePlan(null).status,'unsupported');
assert.equal(handle('Напомни купить хлеб').status,'clarify');
assert.equal(handle('отмени').status,'cancelled');
assert.equal(handle('завтра 8'),null,'No stale context after cancelling');
assert.equal(handle('Напомни завтра купить хлеб').status,'clarify');
assert.equal(handle('в 9').status,'saved');
assert.equal(handle('завтра'),null,'Context cleared after saving');
console.log('SEYVEO local actions: contextual reminders and executor checks passed');
