const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../assets/seyveo-task-handoff.js'),'utf8');

function browser(){
 const memory=new Map();
 const sessionStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const window={sessionStorage};
 vm.runInNewContext(script,{window,Date,JSON});
 return {api:window.SEYVEO_TASK_HANDOFF,memory};
}
test('Sayvi understands a natural explicit New Task request',()=>{
 const {api}=browser();
 assert.equal(api.extract('Сэйви, создай дело: завтра в 18 встреча с Романом в кафе Вкусно и точка, Красная Площадь'),
  'завтра в 18 встреча с Романом в кафе Вкусно и точка, Красная Площадь');
 assert.equal(api.extract('добавь новую встречу с коллегой в кафе на Красной'),'с коллегой в кафе на Красной');
 assert.equal(api.extract('Запиши дело завтра купить цветы'),'завтра купить цветы');
});
test('a complete, matter-of-fact meeting is ready for an in-chat confirmation',()=>{
 const {api}=browser();
 assert.equal(api.extract('Завтра в 18 встреча с Романом'),'');
 assert.equal(api.extractMeeting('Завтра в 18 встреча с Романом'),'Завтра в 18 встреча с Романом');
 assert.equal(api.extractMeeting('завтра в 18:00 встреча с Романом в кафе Вкусно — и точка, Красная Площадь.'),
  'завтра в 18:00 встреча с Романом в кафе Вкусно — и точка, Красная Площадь.');
 assert.equal(api.extractMeeting('Встреча с Романом завтра в 18:00'),'Встреча с Романом завтра в 18:00');
});
test('ordinary conversation and uncertain plans never trigger a task handoff',()=>{
 const {api}=browser();
 assert.equal(api.extract('Найди информацию о кафе'), '');
 assert.equal(api.extract('Создай дело'), '');
 assert.equal(api.extract('Создай дело: <script>действие</script>'), '');
 assert.equal(api.extract('Завтра в 18 встреча с Романом?'), '');
 assert.equal(api.extract('Если завтра в 18 встреча с Романом, что делать?'), '');
 assert.equal(api.extract('Возможно завтра в 18 встреча с Романом'), '');
 assert.equal(api.extract('Завтра в 18 созвон с Романом — не записывай'), '');
 for(const text of ['Завтра в 18 встреча с Романом?','Если завтра в 18 встреча с Романом, что делать?',
  'Возможно завтра в 18 встреча с Романом','Завтра в 18 созвон с Романом — не записывай',
  'Завтра встреча с Романом','Встреча с Романом в 18:00'])
  assert.equal(api.extractMeeting(text),'',text);
});
test('task handoff uses only short-lived sessionStorage, never URL or permanent storage',()=>{
 const {api,memory}=browser();
 assert.equal(api.remember('завтра в 18 встреча с Романом'),true);
 assert.equal(api.take(),'завтра в 18 встреча с Романом');
 assert.equal(memory.size,1);
 api.clear();assert.equal(api.take(),'');
 const key='seyveo.sayvi.new-task-handoff.v1';
 memory.set(key,JSON.stringify({text:'просроченная встреча',at:Date.now()-120000}));
 assert.equal(api.take(),'');assert.equal(memory.size,0);
});
test('complete meetings show a review card and save only after its chat button is tapped',()=>{
 const home=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const chat=fs.readFileSync(path.join(__dirname,'../sayvi-chat-new.html'),'utf8');
 const tasks=fs.readFileSync(path.join(__dirname,'../assets/personal-tasks.js'),'utf8');
 const liveAction=fs.readFileSync(path.join(__dirname,'../assets/assistant-local-actions.js'),'utf8');
 assert(home.indexOf('seyveo-task-handoff.js?v=3')<home.search(/personal-tasks\.js\?v=\d+/),
  'task handoff loads before the currently versioned personal tasks script');
 assert.match(chat,/SEYVEO_TASK_HANDOFF\.remember\(newTask\)/);
 assert.match(chat,/SEYVEO_TASK_HANDOFF\?\.extractMeeting\?\.\(question\)/);
 assert.match(chat,/showChatTaskCard\(answers\.get\('reply-'\+id\),review\)/);
 assert.match(chat,/window\.SEYVEO_TASK_COMMIT\?\.saveBatch\?\.\(\[/,'a user tap invokes the validated writer');
 assert.match(chat,/savedTurns\[savedTurns\.length-1\]\.taskReview=review/,'the review is retained in chat history');
 assert.match(chat,/if\(turn\.role==='assistant'&&turn\.taskReview/,'a pending review survives reloading chat');
 assert.match(chat,/<script src="assets\/seyveo-task-smart-nl\.js\?v=7"><\/script>/);
 assert.match(chat,/<script src="assets\/seyveo-task-commit\.js\?v=1"><\/script>/);
 assert.match(home,/assets\/seyveo-task-commit\.js\?v=1/);
 assert.match(liveAction,/const entry=await awaitSaved\(j,TASKS/);
 assert.match(liveAction,/if\(record&&!j\.dialog\?\.open\)return record/);
 assert.match(liveAction,/if\(!record\)throw new Error\('Запись отсутствует после сохранения'\)/);
 assert.match(liveAction,/const existing=matchingRecord\(plan\)/,'repeat commands do not create duplicates');
 assert.match(liveAction,/new CustomEvent\('seyveo:tasks-focus-date'/,'the receipt can show the saved day');
 assert.match(tasks,/window\.addEventListener\('seyveo:tasks-focus-date'/,'Tasks opens the selected day');
 assert.match(tasks,/window\.SEYVEO_TASK_COMMIT\.saveBatch\(detail\?\.items/,'home and chat use the same validated writer');
 assert.match(tasks,/handoff\.clear\(\);\s*openDialog\(\);/);
 assert.match(tasks,/input\.dispatchEvent\(new Event\('input'/);
 assert.match(tasks,/document\.addEventListener\('DOMContentLoaded',openSayviTaskDraft/,
  'the editor must finish loading before a handed-off draft is parsed');
 assert.match(tasks,/SEYVEO_TASK_SMART_NL\|\|!window\.SEYVEO_TASK_PLACE_EDITOR/);
 assert.doesNotMatch(tasks,/Сэйви подготовила дело\. Проверь дату/,
  'a normal task draft must not display a red error status');
 assert.match(tasks,/SEYVEO_TASK_PLACE_EDITOR\?\.placeForSave/);
});
test('the exact meeting phrase is parsed into date, time, and a venue proposal',()=>{
 const {parse}=require('../assets/seyveo-task-smart-nl.js');
 const places=require('../assets/seyveo-task-places.js');
 const phrase='завтра в 18:00 встреча с Романом в кафе Вкусно — и точка, Красная Площадь.';
 const scheduled=parse(phrase,new Date(2026,10,16,12));
 const location=places.extract(phrase);
 assert.equal(scheduled.date,'2026-11-17');
 assert.equal(scheduled.time,'18:00');
 assert.equal(scheduled.title,'Встреча с Романом в кафе Вкусно — и точка, Красная Площадь');
 assert.equal(location.venueName,'Вкусно — и точка');
 assert.equal(location.locationHint,'Красная Площадь');
});
