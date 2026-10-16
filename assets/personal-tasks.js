/* SEYVEO · Personal Tasks v1.
   Real local tasks, not AI or externally executed assignments. No imports from legacy code. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const list=$('personalTaskList'),summary=$('personalBriefList'),dialog=$('personalTaskDialog');
const form=$('personalTaskForm'),input=$('personalTaskTitle'),date=$('personalTaskDue');
if(!list||!summary||!dialog||!form||!input||!date)return;
const KEY='seyveo-personal-tasks-v1',MAX=150;
function safeParse(raw){try{const v=JSON.parse(raw||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function read(){
 let raw=null;try{raw=localStorage.getItem(KEY)}catch{}
 return safeParse(raw).filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string')
 .slice(-MAX).map(item=>({id:item.id,title:item.title.trim().slice(0,140),
 due:/^\d{4}-\d{2}-\d{2}$/.test(item.due)?item.due:'',done:item.done===true,
 createdAt:typeof item.createdAt==='string'?item.createdAt:'',doneAt:typeof item.doneAt==='string'?item.doneAt:''}));
}
function save(items){
 try{localStorage.setItem(KEY,JSON.stringify(items.slice(-MAX)));return true}
 catch{return false}
}
function strDate(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
 const [y,m,d]=iso.split('-').map(Number);
 const x=new Date(y,m-1,d);
 if(x.getFullYear()!==y||x.getMonth()+1!==m||x.getDate()!==d)return '';
 return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(x);
}
function element(tag,cls,txt){
 const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;
}
function displayDate(item){
 const label=strDate(item.due);if(!label)return '';
 const current=new Date(),today=[current.getFullYear(),String(current.getMonth()+1).padStart(2,'0'),String(current.getDate()).padStart(2,'0')].join('-');
 return item.due<today?'Срок прошёл · '+label:item.due===today?'Сегодня':'До '+label;
}
function row(item,compact=false){
 const section=element('div',compact?'personal-brief-row':'personal-task-row');section.dataset.taskId=item.id;
 const label=element('span','personal-task-content');
 const name=element('strong','',item.title);
 if(item.done)name.classList.add('is-done');
 label.append(name);
 const due=displayDate(item);
 if(due||item.done){const info=element('small','',item.done?'Завершено':due);label.append(info)}
 if(!compact){
   const checkbox=element('button','personal-task-check',item.done?'✓':'');
   checkbox.type='button';checkbox.dataset.taskToggle=item.id;
   checkbox.setAttribute('aria-label',item.done?'Вернуть дело: '+item.title:'Завершить дело: '+item.title);
   checkbox.setAttribute('aria-pressed',String(item.done));
   section.append(checkbox,label);
   const remove=element('button','personal-task-delete');
   remove.type='button';remove.dataset.taskDelete=item.id;remove.setAttribute('aria-label','Удалить дело: '+item.title);
   // The same centered, symmetrical vector X as all SEYVEO close controls.
   const cross=document.createElementNS('http://www.w3.org/2000/svg','svg');
   cross.setAttribute('class','seyveo-close-glyph');
   cross.setAttribute('viewBox','0 0 24 24');
   cross.setAttribute('aria-hidden','true');
   const strokes=document.createElementNS('http://www.w3.org/2000/svg','path');
   strokes.setAttribute('d','M7 7l10 10M17 7 7 17');
   cross.append(strokes);remove.append(cross);
   section.append(remove);
 }else{
   section.append(label);
 }
 return section;
}
function render(){
 const all=read(),open=all.filter(item=>!item.done)
 .sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31')||a.createdAt.localeCompare(b.createdAt));
 const done=all.filter(item=>item.done).reverse();
 list.replaceChildren();
 if(!all.length){
  list.append(element('p','personal-tasks-empty','Пока нет дел. Добавьте первое — SEYVEO сохранит его на этом устройстве.'));
 }else{
  if(open.length){const head=element('h3','personal-list-title','Нужно сделать · '+open.length);list.append(head);
   open.forEach(task=>list.append(row(task)))}
  if(done.length){const head=element('h3','personal-list-title','Выполнено · '+done.length);list.append(head);
   done.slice(0,30).forEach(task=>list.append(row(task)))}
 }
 summary.replaceChildren();
 if(open.length)open.slice(0,2).forEach(task=>summary.append(row(task,true)));
 else summary.append(element('p','personal-brief-empty',all.length?'Все личные дела завершены. Отличная работа.':'Личных дел пока нет.'));
 $('personalBriefCount').textContent=open.length?String(open.length):'';
 $('personalBriefCount').hidden=!open.length;
 // Keep personal tasks in Дела; show their compact Home preview only if pending.
 $('personalBrief').hidden=open.length===0;
 window.dispatchEvent(new CustomEvent('seyveo:tasks-changed',{detail:{open:open.length,total:all.length}}));
}
function openDialog(){
 form.reset();$('personalTaskStatus').textContent='';
 if(!dialog.open)dialog.showModal();
 input.focus({preventScroll:true});
}
function put(e){
 e.preventDefault();
 const title=input.value.trim().replace(/\s+/g,' ');
 if(!title){$('personalTaskStatus').textContent='Напишите, что нужно сделать.';input.focus();return}
 const all=read();
 if(all.length>=MAX){$('personalTaskStatus').textContent='Достигнут предел записей. Удалите ненужные завершённые дела.';return}
 const next=[...all,{id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),title:title.slice(0,140),due:date.value,done:false,createdAt:new Date().toISOString(),doneAt:''}];
 if(!save(next)){$('personalTaskStatus').textContent='Не удалось сохранить. Проверьте память браузера.';return}
 dialog.close();render();
}
function change(id,del=false){
 const all=read(),target=all.find(item=>item.id===id);if(!target)return;
 if(del){
   if(!window.confirm('Удалить дело «'+target.title+'»?'))return;
   if(!save(all.filter(item=>item.id!==id))){window.alert('Не удалось удалить запись.');return}
 }else{
   target.done=!target.done;target.doneAt=target.done?new Date().toISOString():'';
   if(!save(all)){window.alert('Не удалось сохранить изменение.');return}
 }
 render();
}
form.addEventListener('submit',put);
$('personalAddHome').addEventListener('click',openDialog);
$('personalAddTasks').addEventListener('click',openDialog);
$('personalTaskCancel').addEventListener('click',()=>dialog.close());
list.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.taskToggle)change(btn.dataset.taskToggle);
 else if(btn.dataset.taskDelete)change(btn.dataset.taskDelete,true);
});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
window.addEventListener('storage',event=>{if(event.key===KEY)render()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
render();
})();