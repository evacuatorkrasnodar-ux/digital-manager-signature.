/* SEYVEO · One global, on-device Search button.
 * Canonical app stores stay read-only. A web search or Sayvi draft requires a
 * separate explicit tap. No remote indexing and no second dock. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const screen=$('svGlobalSearch'),field=$('svGlobalSearchInput');
const results=$('svGlobalSearchResults'),closeButton=$('svGlobalSearchClose');
const trigger=$('navManage'),modes=$('svSearchModes');
if(!screen||!field||!results||!closeButton||!trigger||!modes)return;
let active=false,previousFocus=null,previousOverflow='',searchEpoch=0,mode='system';
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
 {name:'Умный дом',tags:'устройства свет телевизор пульт bluetooth подключенные устройства',action:'space:smart-home'},
 {name:'Документы',tags:'файлы бумаги договоры акты счета pdf word архив электронная подпись',action:'space:documents'},
 {name:'SEYVEO PAY',tags:'кошелек платежи карты',action:'space:wallet'},
 {name:'Почта',tags:'письма email черновики отправитель входящие',action:'space:mail'},
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
 // The working task list is in the same browser, but preview roles are not
 // authorization. Never show another employee's items in the employee preview.
 if(window.SEYVEO_PREVIEW?.isManager?.()===true||window.SEYVEO_PREVIEW?.isEmployee?.()===true){
  const employee=window.SEYVEO_PREVIEW?.isEmployee?.()===true;
  for(const task of rows('seyveo-business-command-tasks-demo-v1',180)){
   if(!task||typeof task.text!=='string'||(employee&&task.assigneeId!=='elena'))continue;
   if(!normalize(task.text).includes(query))continue;
   records.push({title:nice(task.text).slice(0,140),
    meta:'Рабочее поручение'+(task.done?' · выполнено':''),
    action:'tasks'});
  }
 }
 // Mail is not connected to a provider until authentication. These are
 // only the user's tab-local drafts, never fictitious inbox messages.
 try{
  const data=JSON.parse(sessionStorage.getItem('seyveo-mail-session-drafts-v1')||'[]');
  if(Array.isArray(data))for(const draft of data.slice(0,60)){
   if(!draft||typeof draft!=='object')continue;
   const subject=nice(draft.subject||''),to=nice(draft.to||''),body=nice(draft.body||'');
   if(!normalize([subject,to,body].join(' ')).includes(query))continue;
   records.push({title:(subject||to||'Черновик без темы').slice(0,140),
    meta:'Локальный черновик почты',action:'mail:drafts'});
  }
 }catch{}
 return records.slice(0,18);
}
/* Decrypt only filenames, only while the user has explicitly unlocked the
   browser-local vault. Never store an index, body, password or plaintext. */
async function unlockedDocumentHits(query){
 const vault=window.SEYVEO_DOCUMENT_VAULT;
 if(query.length<2||typeof vault?.status!=='function'||typeof vault?.list!=='function')return [];
 try{
  const status=await vault.status();
  if(!status.unlocked)return [];
  const visible=window.SEYVEO_PREVIEW?.isEmployee?.()===true?['personal']:['personal','business'];
  const hits=[];
  for(const area of visible){
   const items=await vault.list(area);
   if(!Array.isArray(items))continue;
   for(const item of items){
    if(typeof item?.name!=='string'||!normalize(item.name).includes(query))continue;
    hits.push({title:nice(item.name).slice(0,140),
     meta:(area==='personal'?'Личный':'Рабочий')+' · разблокированный архив',
     action:'docs:'+area});
    if(hits.length>=12)return hits;
   }
  }
  // Vault may have been locked while the asynchronous query was running.
  return (await vault.status()).unlocked?hits:[];
 }catch{return []}
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
function changeMode(next,{focus=false}={}){
 if(!['system','sayvi','web'].includes(next))return;
 mode=next;
 const placeholders={system:'Найти в SEYVEO',sayvi:'О чём спросить Сэйви?',web:'Поиск в интернете'};
 field.placeholder=placeholders[mode];
 field.setAttribute('aria-label',placeholders[mode]);
 for(const control of modes.querySelectorAll('[data-sv-search-mode]')){
  const selected=control.dataset.svSearchMode===mode;
  control.setAttribute('aria-pressed',String(selected));
 }
 if(active)render();
 if(focus)field.focus({preventScroll:true});
}
function nextSteps(){
 const group=document.createElement('section');
 group.className='sv-search-next-steps';
 const caption=document.createElement('p');caption.className='sv-search-empty';
 caption.textContent='В доступных данных совпадений не нашлось. Сэйви поможет разобраться — или можно продолжить поиск в интернете.';
 group.append(caption);
 group.append(actionButton('Попросить Сэйви помочь','mode:sayvi','Объяснить, уточнить или предложить следующий шаг'));
 group.append(actionButton('Продолжить в интернете','mode:web','Поиск через SEYVEO Browser по вашему выбору'));
 return group;
}
function render(){
 const epoch=++searchEpoch;
 const raw=field.value.trim(),term=normalize(raw),intent=routeFor(raw);
 results.replaceChildren();
 if(mode==='sayvi'){
  if(!raw){
   const note=document.createElement('p');note.className='sv-search-caption';
   note.textContent='Сэйви рядом: задай вопрос, опиши ситуацию или попроси помочь. Ответ появится в настоящем чате.';
   results.append(note);return;
  }
  results.append(heading('Помощь Сэйви'));
  results.append(actionButton('Спросить Сэйви','ask','Передать вопрос в чат Сэйви'));
  const hint=document.createElement('p');hint.className='sv-search-caption';
  hint.textContent='Сэйви может уточнить детали и предложить решение. Доступ к личным данным зависит от разрешений.';
  results.append(hint);return;
 }
 if(mode==='web'){
  if(!raw){
   const note=document.createElement('p');note.className='sv-search-caption';
   note.textContent='Напиши, что найти в интернете. Запрос откроется в SEYVEO Browser только после твоего действия.';
   results.append(note);return;
  }
  if(isPrivateQuery(raw)){
   results.append(heading('Личный вопрос'));
   const notice=document.createElement('p');notice.className='sv-search-empty';
   notice.textContent='Этот запрос может содержать личные сведения. Не отправляем его в открытый интернет.';
   results.append(notice);
   results.append(actionButton('Спросить Сэйви','mode:sayvi','Продолжить без открытого интернет-поиска'));
   return;
  }
  results.append(heading('Поиск в интернете'));
  results.append(actionButton('Найти через SEYVEO Browser','web','Открыть результаты в браузере'));
  const hint=document.createElement('p');hint.className='sv-search-caption';
  hint.textContent='Интернет-поиск выполняется по твоему выбору. Содержание частных документов и закрытого архива не отправляется.';
  results.append(hint);return;
 }
 // System: never send local data to the web or assistant merely because
 // an item is missing. Offer both meaningful next steps in the same view.
 const matching=term?sections.filter(x=>normalize(x.name+' '+x.tags).includes(term)).slice(0,7):
  sections.filter(x=>['calendar','tasks','space:notes','manage'].includes(x.action));
 const records=searchableRecords(term);
 if(!term){
  results.append(heading('Быстрый доступ'));
  for(const entry of matching)results.append(itemRow({...entry,meta:'Открыть раздел SEYVEO'},'section'));
  const hint=document.createElement('p');hint.className='sv-search-caption';
  hint.textContent='Система ищет в доступных разделах, делах, заметках, черновиках и разблокированном архиве. Сэйви и Интернет — рядом.';
  results.append(hint);return;
 }
 if(intent&&intent.action!=='ask'&&intent.action!=='web'&&intent.action!=='site'){
  results.append(heading('Быстрое действие'));
  results.append(actionButton('Выполнить команду','smart','Открыть нужный раздел SEYVEO'));
 }
 if(records.length){
  results.append(heading('Найдено на этом устройстве'));
  for(const record of records)results.append(itemRow(record,'record'));
 }
 if(term.length>=2){
  void unlockedDocumentHits(term).then(found=>{
   if(!active||mode!=='system'||epoch!==searchEpoch||normalize(field.value)!==term||!found.length)return;
   const group=document.createElement('section');group.className='sv-search-vault-hits';
   group.append(heading('В разблокированном архиве'));
   for(const record of found)group.append(itemRow(record,'record'));
   results.prepend(group);
   results.querySelector('.sv-search-next-steps')?.remove();
  });
 }
 if(matching.length){
  results.append(heading('Разделы'));
  for(const entry of matching)results.append(itemRow({...entry,meta:'Открыть раздел SEYVEO'},'section'));
 }
 const hasSystemResults=records.length>0||matching.length>0||
  !!(intent&&intent.action!=='ask'&&intent.action!=='web'&&intent.action!=='site');
 if(!hasSystemResults)results.append(nextSteps());
}

function open(){
 if(active)return true;
 if(trigger.dataset.svMusicAction||trigger.dataset.svBrowserAction)return false;
 previousFocus=document.activeElement;
 active=true;
 searchEpoch++;
 screen.hidden=false;
 trigger.setAttribute('aria-expanded','true');
 trigger.setAttribute('aria-label','Закрыть поиск SEYVEO');
 document.documentElement.classList.add('sv-global-search-open');
 previousOverflow=document.body.style.overflow;
 document.body.style.overflow='hidden';
 field.value='';
 changeMode('system');
 // Focusing within the real tap gesture allows iOS to display the keyboard.
 field.focus({preventScroll:true});
 return true;
}
function close({restoreFocus=false}={}){
 if(!active)return;
 active=false;
 searchEpoch++;
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
 if(action==='mode:sayvi'){changeMode('sayvi',{focus:true});return}
 if(action==='mode:web'){changeMode('web',{focus:true});return}
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
 if(action.startsWith('docs:')||action.startsWith('mail:')){
  const isDocs=action.startsWith('docs:');
  const kind=isDocs?'contract':'mail';
  const scope=action.split(':')[1];
  const area=isDocs?(scope==='business'?'business':'personal'):'all';
  window.dispatchEvent(new CustomEvent('seyveo:global-search-scope',{
   detail:{kind,query:typed.slice(0,200),scope:isDocs?area:scope}
  }));
  if(window.SEYVEO_SAYVI_SURFACES?.open?.(kind,area)!==true)
   location.hash=isDocs?'#sayvi-documents':'#sayvi-mail';
  return;
 }
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
  if(key==='documents'||key==='mail'){
   if(window.SEYVEO_SAYVI_SURFACES?.open?.(key==='documents'?'contract':'mail')!==true)
    location.hash=key==='documents'?'#sayvi-documents':'#sayvi-mail';
   return;
  }
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
// Also allow the familiar desktop search shortcut without duplicating controls.
document.addEventListener('keydown',event=>{
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
  if(trigger.dataset.svMusicAction||trigger.dataset.svBrowserAction)return;
  event.preventDefault();
  if(!active)open();else field.focus({preventScroll:true});
 }
});
trigger.addEventListener('click',()=>{
 if(active)close({restoreFocus:false});else open();
});
closeButton.addEventListener('click',()=>close({restoreFocus:true}));
modes.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-sv-search-mode]');
 if(button&&modes.contains(button))changeMode(button.dataset.svSearchMode,{focus:true});
});
field.addEventListener('input',render);
field.addEventListener('search',render);
field.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();close({restoreFocus:true});return;}
 if(event.key!=='Enter')return;
 event.preventDefault();
 if(!field.value.trim())return;
 if(mode==='sayvi'){visit('ask');return;}
 if(mode==='web'){visit('web');return;}
 const intent=routeFor(field.value);
 if(intent){visit('smart');return;}
 const exact=sections.find(x=>normalize(x.name)===normalize(field.value));
 if(exact){visit(exact.action);return;}
 // No dead-end Enter: introduce the next step without silently
 // sending a possibly private query to an external service.
 changeMode('sayvi');
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