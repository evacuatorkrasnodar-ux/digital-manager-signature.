/* SEYVEO · One global, on-device Search button.
 * Canonical app stores stay read-only. A web search or Sayvi draft requires a
 * separate explicit tap. No remote indexing and no second dock. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const screen=$('svGlobalSearch'),field=$('svGlobalSearchInput');
const results=$('svGlobalSearchResults'),closeButton=$('svGlobalSearchClose');
const trigger=$('navManage');
if(!screen||!field||!results||!closeButton||!trigger)return;
let active=false,previousFocus=null,previousOverflow='';
const normalize=value=>String(value||'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim().replace(/\s+/g,' ');
const nice=value=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const rows=(key,max)=>{
 try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x.slice(-max):[]}
 catch{return []}
};
const sections=Object.freeze([
 {name:'Главная',tags:'домой сводка',action:'home'},
 {name:'Дела',tags:'задачи поручения работа список',action:'tasks'},
 {name:'Календарь',tags:'встречи события дата расписание планы',action:'calendar'},
 {name:'Блокнот',tags:'заметки записи идеи',action:'space:notes'},
 {name:'Здоровье',tags:'пульс давление',action:'space:health'},
 {name:'Забота',tags:'вода дыхание отдых',action:'space:care'},
 {name:'Семья',tags:'семейный чат',action:'space:family'},
 {name:'Контакты',tags:'люди телефон',action:'space:contacts'},
 {name:'Умный дом',tags:'устройства свет',action:'space:smart-home'},
 {name:'Документы',tags:'файлы бумаги',action:'space:documents'},
 {name:'SEYVEO PAY',tags:'кошелек платежи карты',action:'space:wallet'},
 {name:'Почта',tags:'письма email',action:'space:mail'},
 {name:'Браузер',tags:'интернет сайты',action:'space:browser'},
 {name:'Музыка',tags:'плеер треки',action:'space:music'},
 {name:'Управление',tags:'настройки подписка подключение тема профиль',action:'manage'}
]);
function searchableRecords(query){
 if(query.length<2)return [];
 const records=[];
 for(const task of rows('seyveo-personal-tasks-v1',150)){
  if(!task||typeof task.title!=='string'||task.done===true)continue;
  if(!normalize(task.title).includes(query))continue;
  records.push({title:nice(task.title).slice(0,140),meta:'Личное дело'+(task.due?' · '+task.due:''),action:'tasks'});
 }
 for(const item of rows('seyveo-calendar-events-v1',300)){
  if(!item||item.kind==='business'||typeof item.title!=='string')continue;
  if(!normalize(item.title).includes(query))continue;
  records.push({title:nice(item.title).slice(0,140),meta:'Календарь'+(item.date?' · '+item.date:'')+(item.time?' · '+item.time:''),action:'date:'+item.date});
 }
 const notes=window.SEYVEO_NOTES_API?.getNotes?.();
 if(Array.isArray(notes))for(const note of notes.slice(0,100)){
  if(!note||note.paper||typeof note.text!=='string'||!normalize(note.text).includes(query))continue;
  const flattened=nice(note.text).replace(/\s+/g,' ');
  records.push({title:flattened.slice(0,90),meta:'Личный блокнот',action:'space:notes'});
 }
 return records.slice(0,10);
}
function itemRow(entry,kind){
 const button=document.createElement('button');button.type='button';
 button.className='sv-search-result';
 button.dataset.searchAction=entry.action;
 button.setAttribute('aria-label',entry.title+' · '+(entry.meta||'Открыть раздел'));
 const icon=document.createElement('span');icon.className='sv-search-result-symbol';
 icon.setAttribute('aria-hidden','true');
 icon.textContent=kind==='record'?'•':'›';
 const body=document.createElement('span');body.className='sv-search-result-copy';
 const title=document.createElement('strong');title.textContent=entry.title;
 const detail=document.createElement('small');
 detail.textContent=entry.meta||(kind==='record'?'Ваша запись':'Раздел SEYVEO');
 body.append(title,detail);
 const arrow=document.createElement('span');arrow.className='sv-search-result-arrow';
 arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
 button.append(icon,body,arrow);
 return button;
}
function heading(value){
 const el=document.createElement('h3');el.className='sv-search-results-heading';
 el.textContent=value;return el;
}
function actionButton(label,action,meta){
 return itemRow({title:label,action,meta},'section');
}
function render(){
 const term=normalize(field.value);
 results.replaceChildren();
 const matching=term?sections.filter(x=>normalize(x.name+' '+x.tags).includes(term)).slice(0,7):
  sections.filter(x=>['calendar','tasks','space:notes','manage'].includes(x.action));
 const records=searchableRecords(term);
 if(!term){
  results.append(heading('Быстрый доступ'));
  for(const entry of matching)results.append(itemRow({...entry,meta:'Открыть раздел SEYVEO'},'section'));
  const hint=document.createElement('p');hint.className='sv-search-caption';
  hint.textContent='Поиск по разделам, личным делам, календарю и текстовым заметкам. Только на этом устройстве.';
  results.append(hint);
  return;
 }
 if(records.length){
  results.append(heading('Найдено в ваших записях'));
  for(const record of records)results.append(itemRow(record,'record'));
 }
 if(matching.length){
  results.append(heading('Разделы'));
  for(const entry of matching)results.append(itemRow({...entry,meta:'Открыть раздел SEYVEO'},'section'));
 }
 if(!records.length&&!matching.length){
  const empty=document.createElement('p');empty.className='sv-search-empty';
  empty.textContent='В SEYVEO ничего не найдено по этому запросу.';
  results.append(empty);
 }
 results.append(heading('Продолжить поиск'));
 results.append(actionButton('Спросить Сэйви','ask','Подготовить вопрос в вашем чате'));
 results.append(actionButton('Искать в интернете','web','Откроется SEYVEO Browser'));
}
function open(){
 if(active)return true;
 if(trigger.dataset.svMusicAction||trigger.dataset.svBrowserAction)return false;
 previousFocus=document.activeElement;
 active=true;
 screen.hidden=false;
 trigger.setAttribute('aria-expanded','true');
 trigger.setAttribute('aria-label','Закрыть поиск SEYVEO');
 document.documentElement.classList.add('sv-global-search-open');
 previousOverflow=document.body.style.overflow;
 document.body.style.overflow='hidden';
 field.value='';
 render();
 // Focusing within the real tap gesture allows iOS to display the keyboard.
 field.focus({preventScroll:true});
 return true;
}
function close({restoreFocus=false}={}){
 if(!active)return;
 active=false;
 field.blur();
 screen.hidden=true;
 document.documentElement.classList.remove('sv-global-search-open');
 document.body.style.overflow=previousOverflow;
 trigger.setAttribute('aria-expanded','false');
 trigger.setAttribute('aria-label','Умный поиск SEYVEO');
 if(restoreFocus&&(previousFocus?.isConnected))previousFocus.focus({preventScroll:true});
 previousFocus=null;
}
function visit(action){
 const query=field.value.trim();
 close();
 if(action==='home'){$('navHome')?.click();return;}
 if(action==='tasks'){location.hash='#tasks';return;}
 if(action==='calendar'){location.hash='#calendar';return;}
 if(action==='manage'){location.hash='#manage';return;}
 if(action.startsWith('date:')){
  const date=action.slice(5);
  location.hash='#calendar';
  requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent('seyveo:calendar-focus-date',{detail:{date}})));
  return;
 }
 if(action.startsWith('space:')){
  const key=action.slice(6);
  const button=document.querySelector('#calendarSpaces [data-calendar-space="'+key+'"]');
  if(!button||button.hidden)return;
  if(location.hash!=='#life')location.hash='#life';
  requestAnimationFrame(()=>button.click());
  return;
 }
 if(action==='web'){
  if(!query)return;
  // Public search is an EXPLICIT user action, never an implicit fallback.
  const url='https://yandex.ru/search/?text='+encodeURIComponent(query);
  window.SEYVEO_BROWSER?.open?.(url);
  return;
 }
 if(action==='ask'){
  if(!query)return;
  window.SEYVEO_CONVERSATION?.open?.();
  const composer=$('question');
  if(composer){
   composer.value=query;
   composer.dispatchEvent(new Event('input',{bubbles:true}));
   window.SEYVEO_CONVERSATION_ENSURE_INPUT?.();
   composer.focus({preventScroll:true});
  }
 }
}
trigger.addEventListener('click',()=>{
 if(active)close({restoreFocus:false});else open();
});
closeButton.addEventListener('click',()=>close({restoreFocus:true}));
field.addEventListener('input',render);
field.addEventListener('search',render);
field.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();close({restoreFocus:true});}
 if(event.key==='Enter'){
  const first=results.querySelector('button[data-search-action]');
  if(first){event.preventDefault();visit(first.dataset.searchAction);}
 }
});
results.addEventListener('click',event=>{
 const btn=event.target.closest?.('button[data-search-action]');
 if(btn&&results.contains(btn))visit(btn.dataset.searchAction);
});
window.addEventListener('hashchange',()=>{if(active)close()});
window.addEventListener('seyveo:route-changed',()=>{if(active)close()});
document.addEventListener('seyveo:browser-open',()=>{if(active)close()});
window.addEventListener('seyveo:notes-changed',()=>{if(active)render()});
window.addEventListener('seyveo:life-events-changed',()=>{if(active)render()});
window.SEYVEO_GLOBAL_SEARCH=Object.freeze({open,close,isOpen:()=>active});
})();