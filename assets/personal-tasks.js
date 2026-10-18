/* SEYVEO · Personal Tasks v1.
   Real local tasks, not AI or externally executed assignments. No imports from legacy code. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const list=$('personalTaskList'),summary=$('personalBriefList'),dialog=$('personalTaskDialog');
const form=$('personalTaskForm'),input=$('personalTaskTitle'),date=$('personalTaskDue');
if(!list||!summary||!dialog||!form||!input||!date)return;
const notice=$('personalTasksNotice');
function showTaskError(message){if(!notice)return;notice.textContent=message;notice.hidden=false;}
function clearTaskError(){if(!notice)return;notice.textContent='';notice.hidden=true;}
const KEY='seyveo-personal-tasks-v1',MAX=150;
let pendingSourceNoteId='';
function safeNoteId(value){return typeof value==='string'&&value.length>0&&value.length<=128?value:'';}
function safeParse(raw){try{const v=JSON.parse(raw||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function read(){
 let raw=null;try{raw=localStorage.getItem(KEY)}catch{}
 return safeParse(raw).filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string')
 .slice(-MAX).map(item=>({id:item.id,title:item.title.trim().slice(0,140),
 due:/^\d{4}-\d{2}-\d{2}$/.test(item.due)?item.due:'',done:item.done===true,
 createdAt:typeof item.createdAt==='string'?item.createdAt:'',doneAt:typeof item.doneAt==='string'?item.doneAt:'',
 ...(safeNoteId(item.sourceNoteId)?{sourceNoteId:item.sourceNoteId}:{})}));
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
   if(item.sourceNoteId){
    const origin=element('button','personal-task-origin','Из Блокнота · Открыть запись');
    origin.type='button';origin.dataset.taskOrigin=item.id;
    origin.setAttribute('aria-label','Открыть исходную заметку для дела: '+item.title);
    label.append(origin);
   }
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
 clearTaskError();
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
function syncDueDateDisplay(){
 const display=$('personalTaskDueDisplay'),control=date.closest('.personal-task-date-control');
 if(!display||!control)return;
 const value=date.value;
 let label='Выбрать дату';
 if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
  const [year,month,day]=value.split('-').map(Number);
  const parsed=new Date(year,month-1,day);
  if(parsed.getFullYear()===year&&parsed.getMonth()===month-1&&parsed.getDate()===day)
   label=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(parsed);
 }
 display.textContent=label;
 control.dataset.filled=String(label!=='Выбрать дату');
}
for(const eventName of ['input','change','blur'])date.addEventListener(eventName,syncDueDateDisplay);
function openDialog(){
 pendingSourceNoteId='';
 form.reset();syncDueDateDisplay();$('personalTaskStatus').textContent='';
 if(!dialog.open)dialog.showModal();
 window.requestAnimationFrame(syncDueDateDisplay);
 input.focus({preventScroll:true});
}
function put(e){
 e.preventDefault();
 const title=input.value.trim().replace(/\s+/g,' ');
 if(!title){$('personalTaskStatus').textContent='Напишите, что нужно сделать.';input.focus();return}
 const all=read();
 if(all.length>=MAX){$('personalTaskStatus').textContent='Достигнут предел записей. Удалите ненужные завершённые дела.';return}
 const next=[...all,{id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),title:title.slice(0,140),due:date.value,done:false,createdAt:new Date().toISOString(),doneAt:'',
 ...(pendingSourceNoteId?{sourceNoteId:pendingSourceNoteId}:{})}];
 if(!save(next)){$('personalTaskStatus').textContent='Не удалось сохранить. Проверьте память браузера.';return}
 pendingSourceNoteId='';
 dialog.close();render();
}
function change(id,del=false){
 const all=read(),target=all.find(item=>item.id===id);if(!target)return;
 if(del){
   if(!window.confirm('Удалить дело «'+target.title+'»?'))return;
   if(!save(all.filter(item=>item.id!==id))){showTaskError('Не удалось удалить дело. Проверьте память устройства.');return}
 }else{
   target.done=!target.done;target.doneAt=target.done?new Date().toISOString():'';
   if(!save(all)){showTaskError('Не удалось сохранить изменение. Проверьте память устройства.');return}
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
 else if(btn.dataset.taskOrigin){
  const target=read().find(row=>row.id===btn.dataset.taskOrigin);
  if(!target?.sourceNoteId)return;
  const detail={id:target.sourceNoteId};
  window.dispatchEvent(new CustomEvent('seyveo:note-open-source',{detail}));
  if(detail.result?.status!=='opened')
   showTaskError(detail.result?.message||'Не удалось открыть исходную заметку.');
 }
});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
/* Prepared from a Notebook note; the existing task form is the only
   writer and still requires the person's explicit Save action. */
window.addEventListener('seyveo:task-plan-note',event=>{
 const draft=event.detail||{};
 const title=typeof draft.title==='string'?draft.title.trim().replace(/\s+/g,' ').slice(0,140):'';
 if(!title)return;
 openDialog();
 input.value=title;
 pendingSourceNoteId=safeNoteId(draft.sourceNoteId);
 const requested=typeof draft.date==='string'?draft.date:'';
 if(strDate(requested))date.value=requested;
 syncDueDateDisplay();
 $('personalTaskStatus').textContent='SEYVEO заметил возможное дело в заметке. Проверьте название и срок, затем сохраните.';
 input.focus({preventScroll:true});
});
/* Explicit one-click approval of up to five tasks from a reviewed Notebook plan.
   Same local task store and renderer as the normal task editor. Atomic write,
   existing and within-plan duplicates are skipped; never truncate old tasks. */
window.addEventListener('seyveo:tasks-plan-batch',event=>{
 const detail=event.detail;
 if(!detail||!Array.isArray(detail.items)||!detail.items.length||detail.items.length>5){
  if(detail)detail.result={status:'invalid',message:'Не удалось прочитать план.'};
  return;
 }
 const sourceNoteId=safeNoteId(detail.sourceNoteId);
 const all=read(),seen=new Set(all.map(item=>
  item.title.replace(/\s+/g,' ').trim().toLocaleLowerCase('ru-RU')+'|'+item.due));
 const pending=[];
 let duplicates=0;
 for(const draft of detail.items){
  if(!draft||typeof draft.title!=='string'||typeof draft.due!=='string'){
   detail.result={status:'invalid',message:'Проверьте текст дел и сроки.'};return;
  }
  const title=draft.title.trim().replace(/\s+/g,' ').slice(0,140);
  const due=draft.due;
  if(!title||(due&&!strDate(due))){
   detail.result={status:'invalid',message:'Проверьте текст дел и даты.'};return;
  }
  const key=title.toLocaleLowerCase('ru-RU')+'|'+due;
  if(seen.has(key)){duplicates++;continue}
  seen.add(key);pending.push({title,due});
 }
 if(!pending.length){
  detail.result={status:'already',added:0,duplicates,
   message:'Такие дела уже есть. Повторно ничего не добавлено.'};return;
 }
 if(all.length+pending.length>MAX){
  detail.result={status:'full',added:0,duplicates,
   message:'Для плана не хватает места в списке дел. Освободите место и повторите.'};return;
 }
 const stamp=Date.now(),createdAt=new Date(stamp).toISOString();
 const next=all.concat(pending.map((draft,index)=>({
  id:'personal-'+stamp+'-'+index+'-'+Math.random().toString(36).slice(2,9),
  title:draft.title,due:draft.due,done:false,createdAt,doneAt:'',
  ...(sourceNoteId?{sourceNoteId}:{})
 })));
 if(!save(next)){
  detail.result={status:'error',added:0,duplicates,
   message:'Не удалось сохранить план. Проверьте память устройства.'};return;
 }
 render();
 detail.result={status:'saved',added:pending.length,duplicates,
  message:'Добавлено в Дела: '+pending.length+(duplicates?' · уже были: '+duplicates:'')+'.'};
});
window.addEventListener('storage',event=>{if(event.key===KEY)render()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
render();
})();