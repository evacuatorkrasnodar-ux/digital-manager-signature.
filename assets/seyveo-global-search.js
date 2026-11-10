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
let active=false,previousFocus=null,previousOverflow='',searchEpoch=0,liveMatches=[];
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
 /(?:парол|паспорт|договор|переписк|зарплат|клиент|сотрудник|мои?\s+(?:письм|документ|контакт|файл)|наши?\s+(?:данн|запис)|личн|секретн)|(?:^|\s)(?:мой|моя|моё|мои|моей|моего|моих|мной|наши|наш|нашей|наших)(?:\s|$)/iu.test(value);

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
    if(hits.length>=12)return (await vault.status()).unlocked?hits:[];
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

/* One input, three invisible capabilities. Never require people to choose a
   provider; display accessible matching data while they type and execute only
   after a deliberate submission or a result tap. */
const isQuestion=q=>/^(?:как|почему|зачем|что|кто|когда|где|сколько|какой|какая|какое|какие|объясни|расскажи|помоги|посоветуй|можно ли)(?=\s|[?!,.:]|$)/u.test(q)||/\?$/.test(q);
const documentWords=/(?:документ|договор|архив|файл|подпись|подписать|подпиши|сч[её]т|(?:^|\s)акт(?:ы|а|ов)?(?=\s|$)|pdf|word|xlsx)/iu;
const mailWords=/(?:письм|писем|почт|email|емейл|черновик|входящ|корреспонденц)/iu;
const songWords=/(?:песн|трек|музык|мелоди|композици|плейлист)/iu;
function searchContext(){
 const route=String(location.hash||'');
 if(route==='#sayvi-documents'){
  const current=window.SEYVEO_DOCUMENT_CENTER?.getSearchContext?.();
  return {kind:'documents',area:current?.area==='business'?'business':'personal'};
 }
 if(route==='#sayvi-mail')return {kind:'mail'};
 if(route==='#sayvi-music')return {kind:'music'};
 if(route==='#tasks')return {kind:'tasks'};
 if(route==='#calendar')return {kind:'calendar'};
 if(route==='#life'||route==='#picture')return {kind:'life'};
 return {kind:'global'};
}
function songTitle(query){
 let value=withoutWake(query).replace(/^(?:(?:включи|включить|поставь|поставить|проиграй|послушай|запусти|запустить|найди|найти|поищи|ищи|слушать)\s+)/u,'');
 value=value.replace(/^(?:мне|нам|пожалуйста)\s+/u,'')
  .replace(/^(?:песню|песни|песня|трек|треки|музыку|композицию|мелодию)\s*/u,'').trim();
 return value.length>=2?value:'';
}
function musicIntent(query){
 const q=withoutWake(query);
 const here=searchContext();
 const wantsMusic=songWords.test(q)||(here.kind==='music'&&!documentWords.test(q)&&!mailWords.test(q));
 const isMusicVerb=/^(?:включи|включить|поставь|поставить|проиграй|воспроизведи|сыграй|послушай|запусти|запустить|слушать|найди|найти|поищи|начни играть)\s+/u.test(q);
 const namesSong=/^(?:песня|песню|песни|трек|треки|музыка|музыку|композиция|композицию)\s+/u.test(q);
 if(wantsMusic&&(isMusicVerb||namesSong||here.kind==='music')){
  const title=songTitle(q);
  return title?{action:'music:track',title}:{action:'music'};
 }
 // A name already in the local Music library is a search hit even when
 // the query is made from Home or Files, without guessing a public catalog.
 const matches=window.SEYVEO_MUSIC?.searchTracks?.(q);
 if(Array.isArray(matches)&&matches.length>0)return {action:'music:track',title:q};
 return null;
}
function intention(query){
 const q=withoutWake(query);
 if(!q)return null;
 // A direct web/search command is distinct from private app content.
 const direct=routeFor(query);
 if(direct&&['web','site'].includes(direct.action))return direct;
 if(/(?:подключ|настро|привяз)/u.test(q)){
  if(mailWords.test(q))return {action:'connect:mail'};
  if(documentWords.test(q))return {action:'connect:documents'};
  if(/(?:банк|касс|crm|срм|битрикс|1с)/u.test(q))return {action:'connect:pulse'};
 }
 const activeDoc=searchContext();
 const documentScope=/(?:рабоч|компан|контрагент|клиент)/u.test(q)&&window.SEYVEO_PREVIEW?.isManager?.()===true
  ?'business':/(?:личн(?:ый|ые|ая)|мо[йяи]\s+личн)/u.test(q)
   ?'personal':activeDoc.kind==='documents'?activeDoc.area:'personal';
 if(/^(?:где|покажи|открой|найди|найти|отыщи|перейди к)\s+/u.test(q)){
  if(documentWords.test(q))return {action:'docs:'+documentScope,reveal:true};
  if(mailWords.test(q))return {action:/черновик/u.test(q)?'mail:drafts':'mail:inbox'};
 }
 if(isQuestion(q))return {action:'ask'};
 const track=musicIntent(q);
 if(track)return track;
 // Within a workspace, an unqualified name means "find here". Explicit
 // mail/document/music/web intents above still take precedence.
 const context=searchContext();
 if(context.kind==='documents')return {action:'docs:'+context.area,reveal:true,contextual:true};
 if(context.kind==='mail')return {action:/черновик/u.test(q)?'mail:drafts':'mail:inbox',contextual:true};
 if(documentWords.test(q))return {action:'docs:'+documentScope,reveal:true};
 if(mailWords.test(q))return {action:/черновик/u.test(q)?'mail:drafts':'mail:inbox'};
 if(direct)return direct;
 const exact=sections.find(x=>normalize(x.name)===q);
 return exact?{action:exact.action}:null;
}
// Route readable requests to existing module searches, but never use
// the full sentence as a filename or sender-name filter.
function scopedTerm(query,action=''){
 const raw=withoutWake(query);
 let value=raw.replace(/^(?:найди|найти|отыщи|покажи|открой|где|поищи|ищи|поиск)\s+/u,'')
  .replace(/^(?:мой|моя|моё|мои|наши|наш|все|всё)\s+/u,'').trim();
 if(action.startsWith('mail:')){
  const sender=value.match(/(?:^|\s)от\s+([а-яёa-z-]{3,})/iu);
  if(sender){
   const name=sender[1];
   return normalize(name.length>=4&&/[аяыиею]$/iu.test(name)?name.slice(0,-1):name);
  }
  value=value.replace(/^(?:письм[оаы]?|писем|почт[ауы]?|email|черновик[иа]?|входящ[иех]+)\s*/iu,'')
   .replace(/^(?:по теме|с темой|от кого|от|для|за|про)\s+/iu,'').trim();
  return /^(?:почта|письма?|писем|черновики|входящие)$/iu.test(value)?'':normalize(value);
 }
 if(action.startsWith('docs:')){
  if(/^(?:документ[а-я]*|файл[а-я]*|мой архив|архив|все документы|все файлы)$/iu.test(value))return '';
  value=value.replace(/^(?:рабоч(?:ий|ие|ую)|личн(?:ый|ые|ую)|мо[йяи]|наш[иы])\s+/iu,'');
  value=value.replace(/^(?:все|всё)\s+/iu,'');
  // A short object label is more useful than a complete natural sentence:
  // "найди договор за март" -> "договор".
  const significant=value.match(/(?:договор[а-я]*|документ[а-я]*|файл[а-я]*|архив|сч[её]т[а-я]*|акт[а-я]*|pdf|word|xlsx)/iu);
  return normalize(significant?.[0]||value).slice(0,80);
 }
 return normalize(value).slice(0,120);
}
function note(textValue,className='sv-search-caption'){
 const p=document.createElement('p');p.className=className;p.textContent=textValue;return p;
}
function render(){
 const epoch=++searchEpoch;
 const query=normalize(field.value),raw=field.value.trim();
 results.replaceChildren();liveMatches=[];
 if(!raw){
  const ctx=searchContext();
  results.append(note(ctx.kind==='documents'
   ?'Поиск по текущим документам. Уже открытый архив остаётся разблокированным.'
   :ctx.kind==='music'
    ?'Найди песню среди загруженных записей SEYVEO SOUND.'
    :ctx.kind==='mail'
     ?'Поиск по доступной почте и локальным черновикам.'
     :'Напиши название, действие или вопрос. Сэйви определит нужный раздел или ответит в чате.'));
  return;
 }
 const detected=intention(raw);
 const lookup=detected?.action==='music:track'?songTitle(raw):scopedTerm(raw,detected?.action||'');
 const sectionsFound=sections.filter(x=>normalize(x.name+' '+x.tags).includes(query)).slice(0,5);
 const records=searchableRecords(lookup||query);
 const musicHits=window.SEYVEO_MUSIC?.searchTracks?.(lookup||query)||[];
 const trackRecords=Array.isArray(musicHits)?musicHits.slice(0,6).map(hit=>({
  title:hit.title,meta:'SEYVEO SOUND'+(hit.artist?' · '+hit.artist:''),
  action:'music-index:'+hit.index
 })):[];
 liveMatches=[...trackRecords,...records,...sectionsFound.map(x=>({...x,title:x.name,meta:'Раздел SEYVEO'}))];
 if(liveMatches.length){
  results.append(heading('Найдено в SEYVEO'));
  for(const entry of liveMatches.slice(0,10))results.append(itemRow(entry,
  records.includes(entry)||trackRecords.includes(entry)?'record':'section'));
 }
 const routeLabel=detected?.action?.startsWith('docs:')
  ?(searchContext().kind==='documents'
    ?'Ищу в текущих документах. Если архив открыт, повторный пароль не нужен.'
    :'Открою документы. Для закрытого архива потребуется пароль.'):
  detected?.action?.startsWith('mail:')?'Ищу в доступной почте. Если сервис не подключён, покажу подключение.':
  detected?.action==='music:track'?'Если песня загружена в SEYVEO SOUND, включу её в плеере.':
  detected?.action?.startsWith('connect:')?'Покажу настройки подключения.':
  detected?.action==='web'||detected?.action==='site'?'Открою результат в браузере после отправки запроса.':
  'Сэйви поможет разобраться и при необходимости проверит публичные источники.';
 results.append(note(routeLabel,'sv-search-assistant-hint'));
 if(query.length>=2){
  void unlockedDocumentHits(lookup||query).then(found=>{
   if(!active||epoch!==searchEpoch||normalize(field.value)!==query||!found.length)return;
   const group=document.createElement('section');group.className='sv-search-vault-hits';
   group.append(heading('В открытом архиве'));
   for(const entry of found)group.append(itemRow(entry,'record'));
   results.prepend(group);
   liveMatches=[...found,...liveMatches];
  });
 }
}
async function submitSearch(){
 const raw=field.value.trim();
 if(!raw)return;
 const planned=intention(raw);
 if(planned){visit(planned.action,{reveal:planned.reveal===true});return}
 // Exact local record or section can be opened directly, without opening
 // an extra menu. Multiple unrelated matches stay visible for selection.
 const exact=liveMatches.filter(x=>normalize(x.title)===normalize(raw));
 if(exact.length===1){visit(exact[0].action);return}
 if(liveMatches.length===1&&!isQuestion(withoutWake(raw))){
  visit(liveMatches[0].action);return;
 }
 // Unknown questions are not abandoned and private text is never silently
 // sent to an open web engine. The real Sayvi chat handles consent and tools.
 visit('ask');
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
 render();
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
function visit(action,{reveal=false}={}){
 const typed=field.value.trim(),intent=routeFor(typed);
 // Strip natural-language navigation verbs before filtering filenames.
 const searchText=scopedTerm(typed,action)||'';
 let query=typed;
 if(action==='smart'){
  if(!intent)return;
  action=intent.action;
 }
 // Natural language "открой сайт ..." and "найди в интернете ..."
 // must use the extracted URL/search term, not the whole command.
 if((action==='web'||action==='site')&&intent?.action===action&&intent.query)
  query=intent.query;
 // Close first: one chat, one browser, one underlying MediaSession.
 close();
 if(action==='music:track'||action.startsWith('music-index:')){
  const music=window.SEYVEO_MUSIC;
  if(action.startsWith('music-index:')){
   if(!music?.playIndexFromSearch?.(Number(action.slice(12))))music?.open?.();
  }else music?.playFromSearch?.(songTitle(typed)||typed);
  return;
 }
 if(action.startsWith('connect:')){
  const service=action.slice(8);
  if(service==='documents')window.SEYVEO_CONNECTION_PROMPTS?.open?.('documents');
  else if(service==='mail')window.SEYVEO_CONNECTION_PROMPTS?.open?.('mail');
  else window.SEYVEO_CONNECTION_PROMPTS?.open?.('pulse');
  return;
 }
 if(action==='home'){$('navHome')?.click();return;}
 if(action.startsWith('docs:')||action.startsWith('mail:')){
  const isDocs=action.startsWith('docs:');
  const kind=isDocs?'contract':'mail';
  const scope=action.split(':')[1];
  const area=isDocs?(scope==='business'?'business':'personal'):'all';
  // The current page owns its controls and unlocked state. Do not remount
  // Documents and accidentally discard the already unlocked vault context.
  if(isDocs&&location.hash==='#sayvi-documents'){
   void window.SEYVEO_DOCUMENT_CENTER?.searchInCurrentDocuments?.(
    searchText,{scope:area,requestArchive:reveal});
   return;
  }
  if(!isDocs&&location.hash==='#sayvi-mail'){
   window.SEYVEO_SAYVI_SURFACES?.searchInCurrentMail?.(searchText,scope);
   return;
  }
  window.dispatchEvent(new CustomEvent('seyveo:global-search-scope',{
   detail:{kind,query:searchText.slice(0,200),scope:isDocs?area:scope,revealArchive:isDocs&&reveal}
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
field.addEventListener('input',render);
field.addEventListener('search',render);
field.addEventListener('keydown',event=>{
 if(event.key==='Escape'){event.preventDefault();close({restoreFocus:true});return}
 if(event.key==='Enter'){
  event.preventDefault();
  void submitSearch();
 }
});

results.addEventListener('click',event=>{
 const btn=event.target.closest?.('button[data-search-action]');
 if(btn&&results.contains(btn))visit(btn.dataset.searchAction,{reveal:btn.dataset.searchAction.startsWith('docs:')});
});
window.addEventListener('hashchange',()=>{if(active)close()});
window.addEventListener('seyveo:route-changed',()=>{if(active)close()});
document.addEventListener('seyveo:browser-open',()=>{if(active)close()});
window.addEventListener('seyveo:notes-changed',()=>{if(active)render()});
window.addEventListener('seyveo:life-events-changed',()=>{if(active)render()});
window.SEYVEO_GLOBAL_SEARCH=Object.freeze({open,close,isOpen:()=>active,routeFor,intention});
})();