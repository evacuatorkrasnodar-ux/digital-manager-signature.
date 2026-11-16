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
test('ordinary chat and ambiguous names do not silently create tasks',()=>{
 const {api}=browser();
 assert.equal(api.extract('Завтра в 18 встреча с Романом'), '');
 assert.equal(api.extract('Найди информацию о кафе'), '');
 assert.equal(api.extract('Создай дело'), '');
 assert.equal(api.extract('Создай дело: <script>действие</script>'), '');
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
test('handoff opens one canonical editor and still requires Save and place confirmation',()=>{
 const home=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const chat=fs.readFileSync(path.join(__dirname,'../sayvi-chat-new.html'),'utf8');
 const tasks=fs.readFileSync(path.join(__dirname,'../assets/personal-tasks.js'),'utf8');
 assert(home.indexOf('seyveo-task-handoff.js?v=1')<home.indexOf('personal-tasks.js?v=116'));
 assert.match(chat,/SEYVEO_TASK_HANDOFF\.remember\(newTask\)/);
 assert.match(tasks,/handoff\.clear\(\);\s*openDialog\(\);/);
 assert.match(tasks,/input\.dispatchEvent\(new Event\('input'/);
 assert.match(tasks,/Проверь дату, филиал и адрес, затем нажми сохранить/);
 assert.match(tasks,/SEYVEO_TASK_PLACE_EDITOR\?\.placeForSave/);
});
