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

/* Search routes commands through the existing modules; it does not execute
   messages, connect services, or make network requests itself.
   Only unambiguous explicit requests get a one-key shortcut. */
const withoutWake = query => normalize(query)
 .replace(/^(?:(?:сэйви|сейви|сэй|сей|сейвео|seyveo)[\s,:!.]+)+/u,'')
 .replace(/[?.!]+$/u,'').trim();
const commands=Object.freeze([
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:мой мир|личное пространство)$/u, action:'space:life'},
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:главную|главная|домой)$/u, action:'home'},
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:дела|задачи|мои дела)$/u, action:'tasks'},
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:календарь|расписание)$/u, action:'calendar'},
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:блокнот|заметки)$/u, action:'space:notes'},
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:почту|письма)$/u, action:'space:mail'},
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:семью|семейный чат)$/u, action:'space:family'},
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:браузер|интернет)$/u, action:'space:browser'},
 {pattern:/^(?:открой|открыть|покажи|перейди в|зайди в)\s+(?:настройки|управление)$/u, action:'manage'},
 {pattern:/^(?:открой|открыть|покажи|запусти|включи|поставь|слушать|хочу послушать)\s+(?:мою |нашу )?(?:музыку|музыка|плеер|песни)$/u, action:'music'}
]);
const needsAssistant = q =>
 /^(?:как|почему|зачем|что|кто|когда|где|сколько|какой|какая|какое|какие|отчего|объясни|расскажи|помоги|посоветуй|напомни|запиши|создай|добавь|запланируй|назначь|поставь задачу)(?=[\s,;:!?]|$)/u.test(q)
 || /\?$/.test(String(field.value||'').trim());
function routeFor(query){
 const q=withoutWake(query);
 if(!q)return null;
 const web=q.match(/^(?:найди|найти|поищи|ищи|покажи|поиск)\s+(?:в интернете|в сети|в браузере|в вебе)\s+(.+)$/u);
 if(web&&web[1].trim())return {action:'web',query:web[1].trim(),reason:'Явный поиск в интернете'};
 const site=q.match(/^(?:открой|открыть|зайди на|перейди на)\s+(?:сайт|страницу)\s+(.+)$/u);
 if(site&&site[1].trim())return {action:'site',query:site[1].trim(),reason:'Открыть сайт в браузере'};
 for(const {pattern,action} of commands){
  if(pattern.test(q))return {action,reason:'Команда SEYVEO'};
 }
 if(needsAssistant(q))return {action:'ask',reason:'Вопрос или поручение для Сэйви'};
 return null;
}
const isPrivateQuery = value =>
 /(?:парол|паспорт|договор|переписк|зарплат|клиент|сотрудник|мои?\s+(?:письм|документ|контакт|файл)|наши?\s+(?:данн|запис))|(?:^|\s)(?:мой|моя|моё|мои|наши|наш)(?:\s|$)/iu.test(value);

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
 const intent=routeFor(field.value);
 results.replaceChildren();
 const matching=term?sections.filter(x=>normalize(x.name+' '+x.tags).includes(term)).slice(0,7):
  sections.filter(x=>['calendar','tasks','space:notes','manage'].includes(x.action));
 const records=searchableRecords(term);
 if(!term){
  results.append(heading('Быстрый доступ'));
  for(const entry of matching)results.append(itemRow({...entry,meta:'Открыть раздел SEYVEO'},'section'));
  const hint=document.createElement('p');hint.className='sv-search-caption';
  hint.textContent='Сэйви понимает вопросы и команды. Личные записи ищутся на устройстве; интернет — только по вашему выбору.';
  results.append(hint);
  return;
 }
 if(intent){
  const description=intent.action==='ask'?'Передать вопрос в настоящий чат Сэйви':
   intent.action==='music'?'Открыть SEYVEO Music':
   intent.action==='web'?'Открыть поиск в SEYVEO Browser':
   intent.action==='site'?'Открыть страницу в SEYVEO Browser':'Перейти в нужный раздел';
  results.append(heading('Сэйви предлагает'));
  results.append(actionButton(
   intent.action==='ask'?'Спросить Сэйви':
   intent.action==='music'?'Открыть музыку':
   intent.action==='web'?'Найти в интернете':
   intent.action==='site'?'Открыть сайт':'Выполнить команду',
   'smart',description));
 }
 if(records.length){
  results.append(heading('Найдено в ваших записях'));
  for(const record of records)results.append(itemRow(record,'record'));
 }
 if(matching.length){
  results.append(heading('Разделы'));
  for(const entry of matching)results.append(itemRow({...entry,meta:'Открыть раздел SEYVEO'},'section'));
 }
 if(!intent&&!records.length&&!matching.length){
  const empty=document.createElement('p');empty.className='sv-search-empty';
  empty.textContent='По этому запросу нет совпадений в доступных записях SEYVEO.';
  results.append(empty);
 }
 results.append(heading('Ещё варианты'));
 results.append(actionButton('Спросить Сэйви','ask','Обсудить вопрос в вашем чате'));
 results.append(actionButton('Искать в интернете','web','Отправить запрос через SEYVEO Browser'));
 if(!intent&&term){
  const hint=document.createElement('p');hint.className='sv-search-caption';
  hint.textContent='Выберите подходящий вариант. По одному слову Сэйви не будет угадывать ваше намерение.';
  results.append(hint);
 }
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
 const typed=field.value.trim(),intent=routeFor(typed);
 let query=typed;
 if(action==='smart'){
  if(!intent)return;
  action=intent.action;
  if(intent.query)query=intent.query;
 }
 // Close first: one chat, one browser, one underlying MediaSession.
 close();
 if(action==='home'){$('navHome')?.click();return;}
 if(action==='tasks'){location.hash='#tasks';return;}
 if(action==='calendar'){location.hash='#calendar';return;}
 if(action==='manage'){location.hash='#manage';return;}
 if(action==='music'){
  const state=window.SEYVEO_MUSIC?.state?.();
  if(state?.loaded>0&&!state?.playing)document.getElementById('sayviMusicPlay')?.click();
  window.SEYVEO_MUSIC?.open?.();
  return;
 }
 if(action==='space:life'){location.hash='#life';return;}
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
  if(key==='music'){window.SEYVEO_MUSIC?.open?.();return;}
  if(key==='browser'){window.SEYVEO_BROWSER?.open?.();return;}
  if(location.hash!=='#life')location.hash='#life';
  requestAnimationFrame(()=>button.click());
  return;
 }
 if(action==='web'||action==='site'){
  if(!query)return;
  // The user explicitly chose a public destination. For private wording,
  // never auto-navigate: offer the local Sayvi chat instead.
  if(isPrivateQuery(query)){
   openSayvi(typed,{submit:false});
   return;
  }
  const value=query.replace(/^https?:\/\//i,'');
  const isUrl=/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?$/iu.test(value);
  const url=isUrl?'https://'+value:'https://yandex.ru/search/?text='+encodeURIComponent(query);
  window.SEYVEO_BROWSER?.open?.(url);
  return;
 }
 if(action==='ask')openSayvi(typed,{submit:true});
}
function openSayvi(query,{submit=true}={}){
 if(!query)return;
 window.SEYVEO_CONVERSATION?.open?.();
 window.SEYVEO_CONVERSATION_ENSURE_INPUT?.();
 const composer=$('question'),form=$('ask');
 if(!composer||!form)return;
 composer.value=query;
 composer.dispatchEvent(new Event('input',{bubbles:true}));
 // A deliberate question sent through Search uses the SAME submit pipeline
 // as the user pressing Send in Sayvi: local tools, search and model checks.
 // If it is unavailable, leave an editable draft rather than fake an answer.
 if(submit&&typeof form.requestSubmit==='function'&&!form.hidden){
  form.requestSubmit();
 }else composer.focus({preventScroll:true});
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
  event.preventDefault();
  const intent=routeFor(field.value);
  if(intent){visit('smart');return;}
  // An exact section is safe to open; an ambiguous one-word search is not.
  const exact=sections.find(x=>normalize(x.name)===normalize(field.value));
  if(exact){visit(exact.action);return;}
  field.blur();
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
window.SEYVEO_GLOBAL_SEARCH=Object.freeze({open,close,isOpen:()=>active,routeFor});
})();