const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {saveBatch,find}=require('../assets/seyveo-task-commit.js');
const {parse}=require('../assets/seyveo-task-smart-nl.js');
const KEY='seyveo-personal-tasks-v1';

function memory(){
 const map=new Map();
 return {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),map};
}

test('Save in chat creates a real, dated Sayvi entry in the existing Tasks store',()=>{
 const store=memory();
 const phrase='завтра в 18:00 встреча с Романом в кафе Вкусно — и точка, Красная Площадь.';
 const draft=parse(phrase,new Date(2026,10,16,12));
 const result=saveBatch([{title:draft.title,due:draft.date,time:draft.time}],{storage:store,createdBy:'sayvi'});
 assert.equal(result.status,'saved');
 const saved=JSON.parse(store.getItem(KEY));
 assert.equal(saved.length,1);
 assert.equal(saved[0].title,'Встреча с Романом в кафе Вкусно — и точка, Красная Площадь');
 assert.equal(saved[0].due,'2026-11-17');
 assert.equal(saved[0].time,'18:00');
 assert.equal(saved[0].createdBy,'sayvi');
 assert.equal(saved[0].entryType,'event');
 assert.equal(find({title:draft.title,date:draft.date,time:draft.time},store)?.id,saved[0].id);
});

test('until Save is tapped a prepared meeting writes nothing',()=>{
 const store=memory();
 const draft=parse('завтра в 18 встреча с Романом',new Date(2026,10,16,12));
 assert.ok(draft?.title&&draft?.date&&draft?.time);
 assert.equal(store.getItem(KEY),null);
});

test('repeated confirmation never duplicates a meeting, and manual data survives',()=>{
 const store=memory();
 store.setItem(KEY,JSON.stringify([{id:'older',title:'Купить хлеб',due:'',time:'',createdBy:'user'}]));
 const item={title:'Встреча с Романом',due:'2026-11-17',time:'18:00'};
 assert.equal(saveBatch([item],{storage:store,createdBy:'sayvi'}).status,'saved');
 assert.equal(saveBatch([item],{storage:store,createdBy:'sayvi'}).status,'already');
 const tasks=JSON.parse(store.getItem(KEY));
 assert.equal(tasks.length,2);
 assert.equal(tasks[0].id,'older');
});

test('invalid dates, inconsistent times and storage denial never claim Save',()=>{
 const store=memory();
 for(const draft of [
  {title:'Встреча',due:'2026-02-30',time:'18:00'},
  {title:'Встреча',due:'',time:'18:00'},
  {title:'Встреча',due:'2026-11-17',time:'25:30'},
  {title:'',due:'2026-11-17',time:'18:00'}
 ])assert.equal(saveBatch([draft],{storage:store,createdBy:'sayvi'}).status,'invalid');
 assert.equal(store.getItem(KEY),null);
 const denied={getItem:()=>null,setItem:()=>{throw Error('denied')}};
 assert.equal(saveBatch([{title:'Встреча',due:'2026-11-17',time:'18:00'}],{storage:denied}).status,'error');
});

test('the UI has a review card and no automatic save/redirect for complete meetings',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../sayvi-chat-new.html'),'utf8');
 const ask=html.slice(html.indexOf('async function ask('),html.indexOf('const intent=options.skipUser?null'));
 assert.match(ask,/const draft=meeting\|\|newTask\?window\.SEYVEO_TASK_SMART_NL/);
 assert.match(ask,/savedTurns\[savedTurns\.length-1\]\.taskReview=review/);
 assert.doesNotMatch(ask,/SEYVEO_LIVE_ACTION\?\.startPlan/);
 assert.match(html,/save\.addEventListener\('click',\(\)=>\{/);
});
