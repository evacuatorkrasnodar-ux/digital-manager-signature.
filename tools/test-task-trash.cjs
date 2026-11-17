'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../assets/personal-tasks.js'),'utf8');
const start=source.indexOf('const SV_TASK_TRASH_KEY=');
const end=source.indexOf('/* Completed personal tasks remain',start);
assert.ok(start>0&&end>start,'The real trash store must exist');

let clock=Date.parse('2026-11-17T12:00:00Z');
class Clock extends Date{
 constructor(value){super(value===undefined?clock:value)}
 static now(){return clock}
}
const values=new Map(),removedAttachments=[];
let tasks=[{id:'a',title:'Встреча',due:'2026-11-18',done:false,notes:'Важная запись',attachment:{name:'plan.pdf',size:25}},
 {id:'b',title:'Отчёт',due:'',done:true,doneAt:'2026-11-16T18:00:00Z'}];
const scope={
 Date:Clock,JSON,Math,Number,String,Array,Set,localStorage:{
  getItem:key=>values.get(key)||null,
  setItem:(key,value)=>values.set(key,value)
 },window:{SEYVEO_TASK_ATTACHMENTS:{removeFor:ids=>removedAttachments.push(...ids)},dispatchEvent(){}},
 Event:class{},CustomEvent:class{},
 MAX:150,justCompletedTaskId:'a',read:()=>tasks.map(item=>({...item})),
 save:next=>{tasks=next.map(item=>({...item}));return true},render(){}
};
vm.createContext(scope);
vm.runInContext(source.slice(start,end),scope);
const trash=scope.window.SEYVEO_PERSONAL_TASK_TRASH;

assert.equal(trash.archive('a'),true);
assert.deepEqual(Array.from(tasks,task=>task.id),['b']);
assert.equal(trash.list().length,1);
assert.equal(trash.list()[0].id,'a');
assert.deepEqual(removedAttachments,[],'Attachments must survive ordinary deletion');
assert.equal(JSON.parse(values.get('seyveo-personal-tasks-trash-v1'))[0].task.notes,'Важная запись');
assert.equal(trash.restore('a'),true);
assert.deepEqual(Array.from(tasks,task=>task.id),['b','a']);
assert.equal(trash.list().length,0);

assert.equal(trash.archive(['a','b']),true);
assert.equal(tasks.length,0);
assert.equal(trash.list().length,2);
assert.equal(trash.removePermanently('a'),true);
assert.deepEqual(removedAttachments,['a'],'Permanent deletion alone removes an attachment');
assert.equal(trash.list().length,1);

clock+=31*86400000;
assert.equal(trash.list().length,0,'Expired reminders leave Recently Deleted after 30 days');
assert.deepEqual(removedAttachments,['a','b'],'Expiration disposes of unclaimed attachments');

tasks=[{id:'safe',title:'Не потерять',due:'',done:false}];
scope.localStorage.setItem=()=>{throw Error('Full storage')};
assert.equal(trash.archive('safe'),false,'A full trash store must reject deletion');
assert.equal(tasks[0].id,'safe','A failed archive must preserve the original task');
console.log('PASS: deleted tasks are recoverable for 30 days; permanent purge and failure are safe.');
