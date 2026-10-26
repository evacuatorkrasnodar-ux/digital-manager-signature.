/* SEYVEO · Business Map v1 · local-first knowledge about a business.
   Records facts explicitly supplied by the owner. NO scraping, CRM login,
   bank access, password collection, AI analysis, or permission requests. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('businessMapDialog'),entry=$('openBusinessMap');
if(!dialog||!entry)return;
const STORE='seyveo-business-map-v1',PROFILE='seyveo-first-acquaintance-v1',FIRST='seyveo-first-minute-state-v1';
const TYPES=[
 {id:'site',name:'Сайт',reason:'Адрес сайта компании'},
 {id:'yandex',name:'Яндекс Бизнес',reason:'Карточка компании на картах'},
 {id:'gis',name:'2ГИС',reason:'Карточка организации'},
 {id:'avito',name:'Авито',reason:'Профиль и объявления'},
 {id:'vk',name:'ВКонтакте',reason:'Страница или сообщество'},
 {id:'telegram',name:'Telegram',reason:'Канал или рабочий аккаунт'},
 {id:'crm',name:'CRM',reason:'Название системы для работы с заявками'},
 {id:'marketplace',name:'Маркетплейсы',reason:'Ozon, Wildberries и другие'},
 {id:'mail',name:'Почта',reason:'Название сервиса, без адресов и паролей'},
 {id:'ads',name:'Реклама',reason:'Где размещаете объявления'},
 {id:'accounting',name:'Бухгалтерия / 1С',reason:'Название бухгалтерской системы'},
 {id:'bank',name:'Банк',reason:'Только название банка, без реквизитов'},
 {id:'other',name:'Другое',reason:'Ещё один рабочий ресурс'}
];
const byType=id=>TYPES.find(item=>item.id===id);
const STOREFRONT_TYPES=new Set(['site','marketplace','avito','vk','yandex','gis','other']);
function publicPageUrl(text){
 try{
  const u=new URL(String(text||'').trim());
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443'))return '';
  const h=u.hostname.toLowerCase();
  if(!h||!h.includes('.')||!/[a-z\u00a1-\uffff]/i.test(h)||h==='localhost'||h.endsWith('.local')||h.endsWith('.internal')||
     h.endsWith('.localhost')||h.startsWith('[')||/^(?:10|127|0|169\.254|192\.168)\./.test(h)||
     /^172\.(?:1[6-9]|2\d|3[01])\./.test(h))return '';
  if(/[?&](?:token|auth|password|secret|key|api[_-]?key|access[_-]?token|session|code|signature)=/i.test(u.search))return '';
  u.search='';u.hash='';
  return u.href.length<=200?u.href:'';
 }catch{return ''}
}
function cleanStorefronts(items){
 if(!Array.isArray(items))return [];
 return items.slice(-8).filter(x=>x&&publicPageUrl(x.url)&&['owner','public-page'].includes(x.method))
 .map(x=>({url:publicPageUrl(x.url),method:x.method,
  title:norm(x.title,140),summary:norm(x.summary,580),
  products:Array.isArray(x.products)?x.products.slice(0,8).map(v=>norm(v,100)).filter(Boolean):[],
  capturedAt:typeof x.capturedAt==='string'?x.capturedAt.slice(0,35):''}));
}
/* A sector is NEVER assumed to be confirmed by a keyword match.
   This tiny local heuristic only proposes a choice, not a factual label.
   No AI inference, web request or transmission of business descriptions. */
const INDUSTRIES=Object.freeze([
 {id:'auto',name:'Автоуслуги',question:'Как вы принимаете заявки и распределяете заказы между исполнителями?',
  reason:'Порядок приёма заявок и записи помогает позже искать потерянные обращения и простои.',
  sources:['yandex','avito','crm','gis','site','ads','mail']},
 {id:'beauty',name:'Красота и уход',question:'Как клиенты записываются к мастерам и как вы отслеживаете свободные окна?',
  reason:'Способ записи и загрузка мастеров важны для планирования и повторных визитов.',
  sources:['yandex','vk','crm','site','gis','ads','mail']},
 {id:'retail',name:'Розничный магазин',question:'Где фиксируете продажи и как учитываете остатки товаров?',
  reason:'Учёт остатков и продаж помогает понимать, чего не хватает на складе, без доступа к кассе.',
  sources:['accounting','crm','yandex','vk','site','marketplace']},
 {id:'ecommerce',name:'Интернет-магазин',question:'Где размещаете товары и как отслеживаете заказы и остатки?',
  reason:'Информация о площадках и учёте заказов помогает выбрать будущие интеграции.',
  sources:['site','marketplace','crm','ads','accounting','mail']},
 {id:'construction',name:'Строительство и ремонт',question:'Где ведёте сметы, сроки и поручения по объектам?',
  reason:'Это помогает понять, как контролировать этапы работ и отклонения от сметы.',
  sources:['crm','accounting','site','yandex','mail','avito']},
 {id:'food',name:'Кафе и рестораны',question:'Как вы принимаете заказы и контролируете загрузку заведения?',
  reason:'Порядок заказов и учёт выручки помогают расставить приоритеты автоматизации.',
  sources:['yandex','gis','accounting','site','crm','ads']},
 {id:'services',name:'Профессиональные услуги',question:'Как к вам приходят клиенты и где вы отслеживаете выполнение заказов?',
  reason:'Каналы обращений и статус работ помогают понять путь клиента.',
  sources:['crm','site','yandex','mail','ads','vk']},
 {id:'other',name:'Другая сфера',question:'Какая часть вашей работы сейчас отнимает больше всего времени?',
  reason:'Ваш ответ поможет определить, какие процессы изучить следующими.',
  sources:['site','crm','mail','accounting']}
]);
const byIndustry=id=>INDUSTRIES.find(x=>x.id===id);
const INDUSTRY_CLUES=Object.freeze([
 ['ecommerce',/интернет[\s-]*магазин|онлайн[\s-]*магазин|электронн.{0,8}коммерц|e[ -]?commerce|прода.{0,15}через\s+(?:ozon|wb|маркетплейс)/i],
 ['auto',/автосервис|автомастерск|авторемонт|эвакуатор|эвакуаци.{0,8}авто|шиномонтаж|автомойк|автодетейлинг/i],
 ['beauty',/парикмахер|салон\s+красот|барбершоп|маникюр|педикюр|бровист|визажист|косметолог/i],
 ['construction',/строительств|стройк|строительн.{0,10}компан|ремонт\s+(?:квартир|домов|офисов)|отделочн.{0,8}работ|монтажн.{0,8}работ/i],
 ['food',/кафе|ресторан|кофейн|пекарн|пиццери|столов|доставк.{0,12}еды|кондитерск/i],
 ['retail',/магазин|розничн.{0,10}торговл|торгов.{0,10}точк|прода.{0,10}товар/i],
 ['services',/агентств|консалтин|репетитор|бухгалтерск.{0,8}услуг|юридическ.{0,8}услуг/i]
]);
function guessIndustry(description){
 const text=String(description||'').slice(0,1000);
 const candidates=INDUSTRY_CLUES.filter(([,regex])=>regex.test(text)).map(([id])=>id);
 // "Интернет-магазин" also contains the generic word "магазин".
 // Treat that overlap as one clue, not two conflicting professions.
 const distinct=candidates.includes('ecommerce')
  ?candidates.filter(id=>id!=='retail'):candidates;
 return distinct.length===1?distinct[0]:''; // ambiguous: ask, never guess
}
function orderedSectorSources(map){
 const sector=byIndustry(map.industry);
 if(!sector)return null;
 const base=prioritySourcesTopic(map);
 // Preserve financial urgency (banking/accounting), but otherwise lead
 // with industry-relevant questions without claiming those services are used.
 const financial=/доход|расход|финанс|налог|прибыл|выручк|бюджет|денег|затрат/.test(map.goal);
 return [...new Set([...(financial?base:sector.sources),...(financial?sector.sources:base)])];
}
const safeRead=key=>{try{return localStorage.getItem(key)}catch{return null}};
const store=(key,value)=>{try{localStorage.setItem(key,value);return true}catch{return false}};
const norm=(text,max)=>String(text||'').replace(/\s+/g,' ').trim().slice(0,max);
const fresh=mode=>({version:1,mode:mode==='start'?'start':'existing',description:'',goal:'',industry:'',industryAnswer:'',weeklyRequests:null,resources:[],dismissed:[],storefronts:[],updatedAt:''});
function validWeeklyRequests(x){
 if(!x||typeof x!=='object')return null;
 const n=x.value;
 if(!Number.isSafeInteger(n)||n<0||n>1000000||x.source!=='owner')return null;
 return {value:n,source:'owner',period:'week',recordedAt:typeof x.recordedAt==='string'?x.recordedAt.slice(0,35):''};
}
function load(){
 try{
  const saved=JSON.parse(safeRead(STORE)||'null');
  if(!saved||saved.version!==1||!['start','existing'].includes(saved.mode))return null;
  const resources=Array.isArray(saved.resources)?saved.resources.filter(x=>
   x&&byType(x.type)&&typeof x.value==='string'&&x.value.length<=200
  ).slice(0,20).map(x=>({type:x.type,value:norm(x.value,180)})).filter(x=>x.value):[];
  return {version:1,mode:saved.mode,description:norm(saved.description,1000),
   goal:norm(saved.goal,320),
   industry:byIndustry(saved.industry)?saved.industry:'',
   industryAnswer:norm(saved.industryAnswer,500),
   weeklyRequests:validWeeklyRequests(saved.weeklyRequests),
   resources,dismissed:Array.isArray(saved.dismissed)?[...new Set(saved.dismissed.filter(x=>typeof x==='string'&&byType(x)))].slice(0,TYPES.length):[],storefronts:cleanStorefronts(saved.storefronts),updatedAt:typeof saved.updatedAt==='string'?saved.updatedAt:''};
 }catch{return null}
}
function ownerFocus(){
 try{const x=JSON.parse(safeRead(PROFILE)||'null');return x?.focus}catch{return null}
}
function clone(x){return {version:1,mode:x.mode,description:x.description,goal:x.goal,
 industry:byIndustry(x.industry)?x.industry:'',industryAnswer:norm(x.industryAnswer,500),
 weeklyRequests:validWeeklyRequests(x.weeklyRequests),resources:x.resources.map(row=>({...row})),dismissed:[...(x.dismissed||[])],storefronts:cleanStorefronts(x.storefronts),updatedAt:x.updatedAt}}
let data=fresh('existing'),preview=false,firstLaunch=false,view='map',sourceType='',origin=null,sectorReturn='goal';
const title=$('businessMapTitle'),sub=$('businessMapLead'),status=$('businessMapStatus');
const field=$('businessMapInput'),form=$('businessMapForm'),inputLabel=$('businessMapInputLabel'),inputHelp=$('businessMapInputHelp');
const pages={sector:$('businessMapSector'),about:form,goal:form,source:form,workflow:form,sources:$('businessMapSources'),map:$('businessMapOverview'),storefront:$('businessMapStorefront')};
function save(){
 if(preview)return true;
 const next=clone(data);next.updatedAt=new Date().toISOString();
 if(!store(STORE,JSON.stringify(next))){status.textContent='Не удалось сохранить. Проверьте память устройства.';return false}
 data=next;updateEntry();
 window.dispatchEvent(new CustomEvent('seyveo:business-map-changed',{detail:{resources:next.resources.length}}));
 return true;
}
function updateEntry(){
 const s=load(),label=$('businessMapManageSummary'),prompt=$('businessMapManagePrompt');
 // A quiet status belongs here; details and the number of resources are visible inside the Map.
 const hasDetails=Boolean(s&&(s.description||s.goal||s.industry||s.industryAnswer||s.resources.length||s.storefronts?.length));
 if(label)label.textContent=hasDetails?'Сохранено':'По желанию';
 // The Management row should explain purpose, not act like another onboarding prompt.
 // Recommendations remain inside the Map, where the owner can choose when to continue.
 if(prompt)prompt.textContent='Что вы рассказали о целях, работе и ресурсах';
}
function markStep(next){
 view=next;status.textContent='';
 for(const [key,panel] of Object.entries(pages)){
  if(key==='about'||key==='goal'||key==='source'||key==='workflow')continue;
  panel.hidden=key!==view;
 }
 form.hidden=!['about','goal','source','workflow'].includes(view);
 if(view==='about'){
  const startup=data.mode==='start';
  title.textContent=startup?'Какое дело хотите открыть?':'Расскажите о своём бизнесе';
  sub.textContent=startup
   ?'Например: «Хочу открыть парикмахерскую в Краснодаре для семей с детьми».'
   :'Чем занимаетесь, в каком городе работаете и кто ваши клиенты? Можно своими словами.';
  inputLabel.textContent=startup?'Опишите будущий бизнес':'Что SEYVEO важно знать о вашем деле?';
  field.value=data.description;field.maxLength=1000;
  field.placeholder=startup?'Идея, город, будущие клиенты…':'Сфера, город, услуги, клиенты, сотрудники…';
  inputHelp.textContent='SEYVEO сохранит ваши слова без догадок и не будет публиковать их.';
  $('businessMapSubmit').textContent='Сохранить и продолжить';
 }else if(view==='sector'){
  const probable=byIndustry(guessIndustry(data.description));
  title.textContent='Уточним направление?';
  sub.textContent=probable
   ?'По описанию возможно, что у вас «'+probable.name+'». Это только предположение — выберите правильный вариант.'
   :'Чтобы задавать вопросы по делу, мне важно понять вашу сферу. Выберите направление или оставьте на потом.';
  drawIndustryChoices();
 }else if(view==='goal'){
  title.textContent='Что для вас сейчас важнее?';
  sub.textContent=data.mode==='start'?'Например: найти первых клиентов или рассчитать расходы.':'Например: больше заявок, меньше расходов или порядок в процессах.';
  inputLabel.textContent='Главная цель или трудность · необязательно';
  field.value=data.goal;field.maxLength=320;
  field.placeholder='Чего хотите добиться в первую очередь?';
  inputHelp.textContent='Можно пропустить и рассказать позже.';
  $('businessMapSubmit').textContent='Продолжить';
 }else if(view==='workflow'){
  const sector=byIndustry(data.industry);
  if(!sector){sectorReturn='map';markStep('sector');return}
  title.textContent='Как устроена ваша работа?';
  sub.textContent=sector.question;
  inputLabel.textContent='Расскажите своими словами';
  field.value=data.industryAnswer;field.maxLength=500;
  field.placeholder='Например, заявки принимаем по телефону и записываем вручную…';
  inputHelp.textContent='Это поможет уточнить будущие рекомендации. Можно ответить позже. Не вводите пароли и конфиденциальные данные.';
  $('businessMapSubmit').textContent='Сохранить ответ';
 }else if(view==='source'){
  const type=byType(sourceType);if(!type){markStep('sources');return}
  title.textContent='Расскажите о ресурсе';
  sub.textContent='SEYVEO запомнит, чем вы пользуетесь. Это ещё не подключение.';
  inputLabel.textContent=type.name;
  field.value='';field.maxLength=180;
  field.placeholder=type.id==='bank'?'Например, Т-Банк':type.id==='crm'?'Например, Битрикс24':'Название или адрес страницы';
  inputHelp.textContent='Только название или общедоступная ссылка. Никогда не вводите пароли, токены, коды, реквизиты или ключи API.';
  $('businessMapSubmit').textContent=preview?'Показать в демо':'Добавить сведения';
 }else if(view==='sources'){
  title.textContent='Какие ресурсы уже используете?';
  sub.textContent='Чем больше известно об источниках заявок и инструментах, тем полезнее будут будущие рекомендации.';
  drawCategories();
 }else if(view==='storefront'){
  // The long Business Map may be scrolled far down. The new reader always
  // starts from its first control, without touching Home or the fixed dock.
  const surface=dialog.querySelector?.('.business-map-main');
  if(surface)surface.scrollTop=0;
  title.textContent='Изучить публичную витрину';
  sub.textContent='Сначала попробую прочитать открытую страницу. Подтверждённые вами сведения можно сохранить в карту.';
 }else if(view==='map'){
  title.textContent='SEYVEO начинает понимать ваше дело';
  sub.textContent='Это карта того, что вы рассказали, а не автоматический анализ или подключение сервисов.';
  drawMap();
 }
 $('businessMapBack').hidden=view==='map'||view==='sector';
 $('businessMapSkipGoal').hidden=view!=='goal';
 $('businessMapWorkflowSkip').hidden=view!=='workflow';
 $('businessMapLater').textContent=preview?'Закрыть демо':'Продолжить позже';
 $('businessMapProgress').textContent=preview?'ДЕМО · БЕЗ СОХРАНЕНИЯ':
  view==='about'?'01 · О БИЗНЕСЕ':
  view==='sector'?'02 · СФЕРА ДЕЯТЕЛЬНОСТИ':
  view==='goal'?'02 · ЦЕЛИ':
  view==='sources'||view==='source'?'03 · РЕСУРСЫ':
  view==='workflow'?'04 · РАБОЧИЙ ПРОЦЕСС':view==='storefront'?'ПУБЛИЧНАЯ ВИТРИНА':'КАРТА БИЗНЕСА';
}
function drawIndustryChoices(){
 const box=$('businessMapIndustryChoices');if(!box)return;
 box.replaceChildren();
 const guessed=guessIndustry(data.description);
 const selected=byIndustry(data.industry)?.id||'';
 // Suggested first, remaining industries stable, with no auto-selection.
 const options=[...INDUSTRIES].sort((a,b)=>(a.id===guessed?-1:b.id===guessed?1:0));
 for(const industry of options){
  const button=document.createElement('button');button.type='button';button.className='business-map-industry-choice';
  button.dataset.businessIndustry=industry.id;
  button.dataset.industryState=industry.id===selected?'confirmed':industry.id===guessed?'proposed':'normal';
  const name=document.createElement('strong');name.textContent=industry.name;
  const detail=document.createElement('small');
  detail.textContent=industry.id===selected?'✓ Подтверждено вами':
   industry.id===guessed?'Возможно по описанию · подтвердите':'Выбрать направление';
  button.append(name,detail);box.append(button);
 }
}
function pickIndustry(id){
 if(!byIndustry(id))return;
 const before={industry:data.industry,industryAnswer:data.industryAnswer};
 data.industry=id;
 if(before.industry!==id)data.industryAnswer='';
 if(!save()){data.industry=before.industry;data.industryAnswer=before.industryAnswer;return}
 markStep(sectorReturn);
}
function drawCategories(){
 const box=$('businessMapCategories');box.replaceChildren();
 for(const type of TYPES){
  const count=data.resources.filter(x=>x.type===type.id).length;
  const button=document.createElement('button');button.type='button';button.className='business-map-source-choice';
  button.dataset.businessSource=type.id;
  const a=document.createElement('strong');a.textContent=type.name;
  const b=document.createElement('small');b.textContent=count?'Указано: '+count:type.reason;
  button.append(a,b);box.append(button);
 }
 $('businessMapResourcesCount').textContent=data.resources.length
  ?'Указано ресурсов: '+data.resources.length+' · доступ к ним ещё не подключён.'
  :'Пока не указан ни один источник. Начните с самого полезного.';
}
/* Transparent, deterministic needs engine. These are questions, not inferred facts.
   The user's current goal influences ORDER only; it never proves a missing
   resource is required. Explicit declines are respected until reset. */
const WHY=Object.freeze({
 site:'Адрес сайта поможет сопоставить описание услуг и онлайн-представительство. Для чтения статистики понадобится отдельное разрешённое подключение.',
 yandex:'Карточка на картах поможет учитывать локальную видимость и обращения. Отзывы и показатели пока не читаются.',
 gis:'Поможет учитывать присутствие компании на картах и контактные данные. Сейчас SEYVEO не читает этот сервис.',
 avito:'Поможет понять, используется ли Авито для привлечения обращений. Сообщения и статистика не читаются.',
 vk:'Поможет учесть сообщество как канал общения с клиентами. Переписки без подключения недоступны.',
 telegram:'Поможет учесть канал или рабочие обращения. Личная переписка не будет запрашиваться автоматически.',
 crm:'Путь заявки и этапы продажи помогут находить потерянные обращения. Для чтения CRM в будущем потребуется отдельное разрешение.',
 marketplace:'Поможет учитывать продажи через маркетплейсы. Заказы и остатки сейчас не загружаются.',
 mail:'Поможет учитывать почту как источник обращений. Содержимое писем нельзя читать без отдельного согласия.',
 ads:'Поможет понимать, из каких рекламных каналов приходят клиенты. Расходы и результаты пока не загружаются.',
 accounting:'Поможет в будущем сопоставлять доходы и расходы, если владелец предоставит доступ. Сейчас финансовые документы не читаются.',
 bank:'Поможет в будущем сверять денежные потоки с заказами. Ни реквизиты, ни операции сейчас не запрашиваются.',
 other:'Поможет не потерять важный рабочий инструмент. Возможности подключения нужно проверять отдельно.'
});
const TOPIC=Object.freeze({
 customers:['crm','site','yandex','vk','avito','ads','mail','telegram','gis'],
 finance:['accounting','bank','crm','ads','site'],
 operations:['crm','mail','accounting','site','telegram'],
 start:['site','yandex','vk','ads','crm','accounting'],
 general:['site','crm','yandex','mail','accounting','ads']
});
function prioritySourcesTopic(map=data){
 if(map.mode==='start')return TOPIC.start;
 const goal=map.goal.toLocaleLowerCase('ru-RU');
 if(/клиент|заказ|заяв|продаж|трафик|реклам|лид|покупател/.test(goal))return TOPIC.customers;
 if(/доход|расход|финанс|налог|прибыл|выручк|бюджет|денег|затрат/.test(goal))return TOPIC.finance;
 if(/процесс|сотруд|скорост|поручен|организ|автомат|срок/.test(goal))return TOPIC.operations;
 return TOPIC.general;
}
function prioritySources(map=data){return orderedSectorSources(map)||prioritySourcesTopic(map)}
function recommendations(map=data){
 const items=[];
 if(!map.description)items.push({kind:'about',title:map.mode==='start'?'Опишите будущий бизнес':'Расскажите о компании',
  why:'SEYVEO нужно знать сферу деятельности, город и клиентов, прежде чем советовать инструменты.'});
 if(!map.goal)items.push({kind:'goal',title:'Назовите главную цель',
  why:'Цель помогает выбирать вопросы по приоритету вместо случайных рекомендаций.'});
 if(map.description&&!byIndustry(map.industry)){
  const maybe=byIndustry(guessIndustry(map.description));
  items.push({kind:'industry',title:maybe?'Это «'+maybe.name+'»?':'Уточните сферу деятельности',
   why:'Отрасль влияет на порядок вопросов и рабочие инструменты. Предположение нужно подтвердить — SEYVEO не записывает его как факт.'});
 }
 const confirmed=byIndustry(map.industry);
 if(confirmed&&!map.industryAnswer)items.push({kind:'workflow',title:confirmed.question,
  why:confirmed.reason+' Ответ необязателен и сохранится только на вашем устройстве.'});
 const present=new Set(map.resources.map(x=>x.type)),dismissed=new Set(map.dismissed||[]);
 for(const type of prioritySources(map)){
  if(present.has(type)||dismissed.has(type))continue;
  const t=byType(type);if(!t)continue;
  items.push({kind:'source',type,title:'Пользуетесь «'+t.name+'»?',why:WHY[type]});
 }
 const ready=prioritySources(map).filter(type=>present.has(type));
 for(const type of [...ready,...map.resources.map(x=>x.type).filter(x=>!ready.includes(x))]){
  if(items.some(x=>x.kind==='connect'&&x.type===type))continue;
  const t=byType(type);if(!t)continue;
  items.push({kind:'connect',type,title:t.name+' указан · доступа пока нет',
   why:WHY[type]+' Сейчас можно только посмотреть порядок будущего безопасного подключения.'});
 }
 return items;
}
function openConnections(type='',sourcePrefill=''){
 // Shared resource destination, never an actual service login.
 if(dialog.open)finish();
 const nav=$('navManage');if(!nav)return false;
 nav.click();
 window.dispatchEvent(new CustomEvent('seyveo:connection-help',{
  detail:{type:byType(type)?type:'',sourcePrefill:typeof sourcePrefill==='string'?sourcePrefill:''}
 }));
 return true;
}
function adviceAction(button){
 const action=button.dataset.businessAdviceAction,source=button.dataset.businessAdviceType;
 if(action==='about'||action==='goal'){markStep(action);return}
 if(action==='industry'){sectorReturn='map';markStep('sector');return}
 if(action==='workflow'){markStep('workflow');return}
 if(action==='source'&&byType(source)){openConnections(source);return}
 if(action==='dismiss'&&byType(source)){
  if(!(data.dismissed||[]).includes(source)){
   data.dismissed.push(source);
   if(!save())data.dismissed=data.dismissed.filter(x=>x!==source);
  }
  markStep('map');return;
 }
 if(action==='restore'){
  const before=[...data.dismissed];data.dismissed=[];
  if(!save())data.dismissed=before;
  markStep('map');return;
 }
 if(action==='connect'||action==='connection-guide'){
  // No token flow exists. The existing Management screen explains consent
  // and explicitly says no actual service is linked.
  finish();
  $('navManage')?.click();
  window.dispatchEvent(new CustomEvent('seyveo:connection-help',{detail:{type:byType(source)?source:''}}));
 }
}
function drawAdvice(){
 const box=$('businessMapAdvice');if(!box)return;
 box.replaceChildren();
 const list=recommendations(),shown=list.slice(0,3);
 for(const item of shown){
  const row=document.createElement('div');row.className='business-map-advice-row';
  const line=document.createElement('strong');line.textContent=item.title;
  const why=document.createElement('p');why.textContent=item.why;
  const controls=document.createElement('div');controls.className='business-map-advice-actions';
  const act=document.createElement('button');act.type='button';act.className='business-map-advice-go';
  act.dataset.businessAdviceAction=item.kind;
  if(item.type)act.dataset.businessAdviceType=item.type;
  act.textContent=item.kind==='about'||item.kind==='goal'||item.kind==='workflow'?'Ответить':
   item.kind==='industry'?'Уточнить':item.kind==='connect'?'Как будет подключаться':'В Подключения';
  controls.append(act);
  if(item.kind==='source'){
   const skip=document.createElement('button');skip.type='button';skip.className='business-map-advice-dismiss';
   skip.textContent='Не использую';skip.dataset.businessAdviceAction='dismiss';
   skip.dataset.businessAdviceType=item.type;controls.append(skip);
  }
  row.append(line,why,controls);box.append(row);
 }
 $('businessMapNext').textContent=shown.length
  ?'Начать можно с одного вопроса. Остальные сведения добавим постепенно.'
  :'Пока новых вопросов нет. Можно уточнить описание, цели или добавить ресурс.';
 $('businessMapAdviceRemaining').textContent=list.length>shown.length
  ?'Ещё предложений: '+(list.length-shown.length)+'. Они появятся после следующих ответов.':'';
 const restore=$('businessMapRestoreSuggestions');
 if(restore)restore.hidden=!data.dismissed?.length;
}
function drawMap(){
 $('businessMapAboutText').textContent=data.description||'Вы ещё не рассказали о своём деле.';
 $('businessMapGoalText').textContent=data.goal||'Цель пока не указана.';
 $('businessMapMapMode').textContent=data.mode==='start'?'Бизнес с нуля':'Действующий бизнес';
 const selected=byIndustry(data.industry),guessed=byIndustry(guessIndustry(data.description));
 $('businessMapIndustryText').textContent=selected?selected.name+' · подтверждено вами':
  guessed?'Возможно: '+guessed.name+' · требуется подтверждение':'Пока не уточнена';
 $('businessMapWorkflowText').textContent=selected
  ?(data.industryAnswer||'Рабочий процесс пока не описан.')
  :'После уточнения направления SEYVEO задаст профильный вопрос.';
 const weekly=validWeeklyRequests(data.weeklyRequests);
 $('businessMapWeeklyRequests').textContent=weekly
  ?'Около '+weekly.value+' обращений за неделю · со слов владельца, не онлайн-статистика'
  :'Пока неизвестно · помощник может уточнить в разговоре';
 drawAdvice();
 const list=$('businessMapResourceList');list.replaceChildren();
 if(!data.resources.length){
  const p=document.createElement('p');p.className='business-map-empty';p.textContent='Ресурсы ещё не указаны.';list.append(p);
 }else for(const [i,item] of data.resources.entries()){
  const row=document.createElement('div');row.className='business-map-resource-row';
  const text=document.createElement('div');const strong=document.createElement('strong');
  strong.textContent=byType(item.type)?.name||'Ресурс';
  const small=document.createElement('small');
  const page=STOREFRONT_TYPES.has(item.type)?publicPageUrl(item.value):'';
  const observed=page?(data.storefronts||[]).find(x=>x.url===page):null;
  small.textContent=item.value+' · '+(observed
   ?observed.method==='owner'?'ассортимент со слов владельца':'публичная страница · подтверждено вами'
   :'данные об источнике, не подключение');
  text.append(strong,small);
  if(observed){
   const observation=document.createElement('p');
   observation.className='business-map-stored-assortment';
   const products=observed.products.slice(0,5).join(' · ');
   const described=observed.summary||observed.title;
   observation.textContent=products
    ?'Витрина: '+products+(observed.products.length>5?' · …':'')
    :described
      ?'Описание: '+described.slice(0,175)
      :'Сведения о странице подтверждены владельцем.';
   text.append(observation);
  }
  const controls=document.createElement('span');controls.className='business-map-resource-controls';
  if(page){
   const inspect=document.createElement('button');inspect.type='button';inspect.dataset.businessInspect=String(i);
   inspect.textContent=observed?'Обновить сведения':'Изучить витрину';
   controls.append(inspect);
  }
  // Editing and removal belong to Management → Connections.
  row.append(text,controls);list.append(row);
 }
 $('businessMapCount').textContent=data.resources.length
  ?'Указано источников: '+data.resources.length+'. Подключений к сервисам пока нет.'
  :'Ресурсы пока не указаны. Добавьте их в «Подключениях».';
}
function acceptable(value){
 if(!value)return false;
 if(/(?:парол[ья]|password|access[_ -]?token|api[_ -]?key|client[_ -]?secret|bearer\s|otp|pin[ =:]|код\s+доступа|секретн|[?&](?:token|auth|password|secret|key|session|code|signature)=)/i.test(value))return false;
 if(/\bhttps?:\/\/[^\s/]*@/i.test(value))return false;
 if(/[\r\n<>]/.test(value))return false;
 // These entries are plain labels, NEVER activated links or credentials.
 // Reject executable/unknown schemes instead of storing misleading addresses.
 if(/^[a-z][\w+.-]*:/i.test(value)&&!/^https:\/\//i.test(value))return false;
 return true;
}
function submit(evt){
 evt.preventDefault();
 const value=field.value.trim();
 if(view==='about'){
  if(!norm(value,1000)){status.textContent='Расскажите хотя бы одной фразой, чем занимаетесь.';return}
  data.description=norm(value,1000);
  if(!save())return;
  if(byIndustry(data.industry)){markStep('map');return}
  sectorReturn=(data.goal||data.resources.length)?'map':'goal';
  markStep('sector');
 }else if(view==='goal'){
  data.goal=norm(value,320);
  if(!save())return;
  markStep('map');
 }else if(view==='workflow'){
  const text=norm(value,500);
  if(!text){status.textContent='Расскажите одним предложением или выберите «Позже».';return}
  if(/(?:парол[ья]|password|access[_ -]?token|api[_ -]?key|client[_ -]?secret|bearer\s|otp|код\s+доступа|секретн)/i.test(text)){
   status.textContent='Не вводите пароли или секретные данные. Опишите только рабочий процесс.';return
  }
  const previous=data.industryAnswer;data.industryAnswer=text;
  if(!save()){data.industryAnswer=previous;return}
  markStep('map');
 }else if(view==='source'){
  const text=norm(value,180);
  if(!text){status.textContent='Укажите название или общедоступную ссылку.';return}
  if(value.length>180||!acceptable(value)){status.textContent='Укажите только название или безопасный адрес без секретных данных.';return}
  if(data.resources.length>=20){status.textContent='В карте уже 20 ресурсов. Уберите ненужный, чтобы добавить новый.';return}
  if(data.resources.some(x=>x.type===sourceType&&x.value.toLocaleLowerCase('ru-RU')===text.toLocaleLowerCase('ru-RU'))){
   status.textContent='Этот ресурс уже есть в карте.';return;
  }
  data.resources.push({type:sourceType,value:text});
  const declined=[...data.dismissed];data.dismissed=data.dismissed.filter(id=>id!==sourceType);
  if(!save()){data.resources.pop();data.dismissed=declined;return}
  markStep('map');
 }
}
function start(options={}){
 if(dialog.open||document.querySelector('dialog[open]'))return false;
 preview=options.preview===true;firstLaunch=options.firstLaunch===true;
 origin=options.trigger||null;
 const focus=ownerFocus(),stored=preview?null:load();
 const inferred=focus==='start'?'start':'existing';
 data=stored?clone(stored):fresh(inferred);
 if(preview)data=fresh(inferred);
 try{dialog.showModal()}catch{return false}
 // A business link supplied in conversation is only a DRAFT.
 // The owner must still press "Добавить сведения" before local storage writes.
 const aboutDraft=typeof options.aboutPrefill==='string'?options.aboutPrefill.trim():'';
 const aboutValid=aboutDraft.length>=8&&aboutDraft.length<=1000&&
  !/(?:парол[ья]|password|access[_ -]?token|api[_ -]?key|client[_ -]?secret|bearer\\s|otp|код\\s+доступа)/i.test(aboutDraft);
 const draft=options.sourcePrefill;
 const valid=typeof draft?.url==='string'&&typeof draft?.type==='string'&&
  byType(draft.type)&&STOREFRONT_TYPES.has(draft.type)&&publicPageUrl(draft.url)===draft.url&&
  draft.url.length<=180;
 if(valid){
  finish();return openConnections(draft.type,draft.url);
 }else if(aboutValid){
  markStep('about');field.value=aboutDraft;
 }else if(!preview&&options.guideStep==='source'&&byType(options.guideType)){
  finish();return openConnections(options.guideType);
 }else if(!preview&&['about','goal','industry','workflow'].includes(options.guideStep)){
  const step=options.guideStep==='industry'?'sector':options.guideStep;
  if(step==='sector')sectorReturn='map';
  markStep(step);
 }else{
  // The first welcome already captures whether this is a new or established business.
  // Saved maps reopen at their overview; new maps begin directly with optional details.
  markStep(stored&&!options.fromStart?'map':'about');
 }
 return true;
}
function finish(){
 if(!dialog.open)return;
 if(firstLaunch&&!preview)store(FIRST,data.description?'completed':'later');
 dialog.close();
 const ref=origin;
 origin=null;preview=false;firstLaunch=false;sourceType='';
 if(ref?.isConnected)try{ref.focus({preventScroll:true})}catch{}
 updateEntry();
}
$('businessMapClose').addEventListener('click',finish);
$('businessMapLater').addEventListener('click',finish);
dialog.addEventListener('cancel',event=>{event.preventDefault();finish()});
form.addEventListener('submit',submit);
$('businessMapBack').addEventListener('click',()=>{
 markStep(view==='source'?'sources':view==='goal'?'sector':'map');
});
$('businessMapSkipGoal').addEventListener('click',()=>{
 if(view==='goal'){markStep('map')}
});
$('businessMapWorkflowSkip').addEventListener('click',()=>{if(view==='workflow')markStep('map')});
$('businessMapIndustryBack').addEventListener('click',()=>markStep(sectorReturn==='goal'?'about':'map'));
$('businessMapIndustrySkip').addEventListener('click',()=>markStep(sectorReturn));
$('businessMapIndustryChoices').addEventListener('click',event=>{
 const button=event.target.closest?.('[data-business-industry]');
 if(button)pickIndustry(button.dataset.businessIndustry);
});
$('businessMapEditIndustry').addEventListener('click',()=>{sectorReturn='map';markStep('sector')});
$('businessMapEditWorkflow').addEventListener('click',()=>{
 if(!byIndustry(data.industry)){sectorReturn='map';markStep('sector')}else markStep('workflow');
});
$('businessMapCategories').addEventListener('click',event=>{
 const button=event.target.closest?.('[data-business-source]');if(!button)return;
 sourceType=button.dataset.businessSource;
 markStep('source');
});
$('businessMapSeeMap').addEventListener('click',()=>markStep('map'));
$('businessMapAddSource').addEventListener('click',()=>openConnections());
$('businessMapEditAbout').addEventListener('click',()=>markStep('about'));
$('businessMapEditGoal').addEventListener('click',()=>markStep('goal'));
$('businessMapFinish').addEventListener('click',finish);
$('businessMapStorefrontBack').addEventListener('click',()=>markStep('map'));
window.addEventListener('seyveo:storefront-save',event=>{
 const detail=event.detail;
 if(view!=='storefront'||!detail||!publicPageUrl(detail.url))return;
 const address=publicPageUrl(detail.url);
 if(!data.resources.some(x=>STOREFRONT_TYPES.has(x.type)&&publicPageUrl(x.value)===address)){
  detail.result={ok:false,message:'Эта ссылка больше не указана в карте бизнеса.'};return;
 }
 const observation={url:address,method:detail.method==='owner'?'owner':'public-page',
  title:norm(detail.title,140),summary:norm(detail.summary,580),
  products:Array.isArray(detail.products)?detail.products.slice(0,8).map(x=>norm(x,100)).filter(Boolean):[],
  capturedAt:new Date().toISOString()};
 if(!observation.summary&&!observation.title&&!observation.products.length){
  detail.result={ok:false,message:'Пока нет сведений для сохранения.'};return;
 }
 const before=[...data.storefronts];
 data.storefronts=[...data.storefronts.filter(x=>x.url!==address),observation].slice(-8);
 if(!save()){data.storefronts=before;detail.result={ok:false,message:'Не удалось сохранить наблюдения. Проверьте память устройства.'};return}
 detail.result={ok:true,message:preview?'Демо: сведения видны только в этом просмотре.':'Сведения сохранены в Карте бизнеса.'};
});
window.addEventListener('seyveo:storefront-leave',()=>{if(dialog.open&&view==='storefront')markStep('map')});
$('businessMapAdvice')?.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-business-advice-action]');if(button)adviceAction(button);
});
$('businessMapConnectionGuide')?.addEventListener('click',()=>adviceAction({dataset:{businessAdviceAction:'connection-guide'}}));
$('businessMapRestoreSuggestions')?.addEventListener('click',()=>adviceAction({dataset:{businessAdviceAction:'restore'}}));
$('businessMapResourceList').addEventListener('click',event=>{
 const inspect=event.target.closest?.('[data-business-inspect]');
 if(inspect){
  const idx=Number(inspect.dataset.businessInspect),source=data.resources[idx];
  const url=source&&STOREFRONT_TYPES.has(source.type)?publicPageUrl(source.value):'';
  if(url){
   markStep('storefront');
   window.dispatchEvent(new CustomEvent('seyveo:storefront-open',{
    detail:{url,type:source.type,existing:(data.storefronts||[]).find(x=>x.url===url)||null,preview}
   }));
  }
  return;
 }

});
entry.addEventListener('click',()=>start({trigger:entry}));

window.addEventListener('storage',event=>{if(event.key===STORE)updateEntry()});
window.addEventListener('pagehide',()=>{if(dialog.open)dialog.close()});
function saveOwnerWeeklyRequests(value){
 if(dialog.open||preview)return {ok:false,message:'Закройте Карту бизнеса, чтобы сохранить ответ из чата.'};
 const n=Number(value);
 if(!Number.isSafeInteger(n)||n<0||n>1000000)return {ok:false,message:'Неверное количество обращений.'};
 const current=load();
 if(!current||!current.description)return {ok:false,message:'Сначала расскажите о бизнесе в Карте.'};
 const previous=data;
 data=clone(current);
 data.weeklyRequests={value:n,source:'owner',period:'week',recordedAt:new Date().toISOString()};
 if(!save()){data=previous;return {ok:false,message:'Не удалось сохранить сведения на устройстве.'}}
 return {ok:true,message:'Сохранено: около '+n+' обращений в неделю, со слов владельца.'};
}
/* Small owner-confirmed checkbox from Connections; never a real service login. */
/* Reuse the same Business Map store; only Connections presents editing. */
function saveResourceDetail(type,value){
 if(!byType(type))return {ok:false,message:'Выберите сервис из списка.'};
 if(dialog.open)return {ok:false,message:'Сначала закройте Карту бизнеса.'};
 const raw=String(value||'').trim(),text=norm(raw,180);
 if(!text||raw.length>180||!acceptable(raw))
  return {ok:false,message:'Укажите название или безопасную HTTPS-ссылку без секретов.'};
 const current=load(),next=current?clone(current):fresh(ownerFocus()==='start'?'start':'existing');
 if(next.resources.some(x=>x.type===type&&x.value.toLocaleLowerCase('ru-RU')===text.toLocaleLowerCase('ru-RU')))
  return {ok:false,message:'Этот ресурс уже указан.'};
 if(next.resources.length>=20)return {ok:false,message:'Можно указать до 20 ресурсов.'};
 next.resources=next.resources.filter(x=>!(x.type===type&&x.value==='Использую'));
 next.resources.push({type,value:text});next.dismissed=next.dismissed.filter(x=>x!==type);
 next.updatedAt=new Date().toISOString();
 if(!store(STORE,JSON.stringify(next)))return {ok:false,message:'Не удалось сохранить на устройстве.'};
 updateEntry();
 window.dispatchEvent(new CustomEvent('seyveo:business-map-changed',{detail:{resources:next.resources.length}}));
 return {ok:true,message:'Ресурс сохранён. Доступ к сервису не подключён.'};
}
function removeResourceDetail(type,value){
 if(!byType(type)||typeof value!=='string'||dialog.open)return {ok:false,message:'Не удалось определить ресурс.'};
 const current=load();if(!current)return {ok:false,message:'Сохранённых ресурсов нет.'};
 const next=clone(current),index=next.resources.findIndex(x=>x.type===type&&x.value===value);
 if(index<0)return {ok:false,message:'Ресурс уже изменён или удалён.'};
 next.resources.splice(index,1);next.updatedAt=new Date().toISOString();
 if(!store(STORE,JSON.stringify(next)))return {ok:false,message:'Не удалось сохранить изменение.'};
 updateEntry();
 window.dispatchEvent(new CustomEvent('seyveo:business-map-changed',{detail:{resources:next.resources.length}}));
 return {ok:true,message:'Ресурс убран. Остальные сведения не изменены.'};
}
function markResourceUse(type,enabled){
 if(!byType(type)||type==='other')return {ok:false,message:'Неизвестный ресурс.'};
 if(dialog.open)return {ok:false,message:'Сначала закройте Карту бизнеса.'};
 const current=load(),next=current?clone(current):fresh(ownerFocus()==='start'?'start':'existing');
 const matches=next.resources.filter(row=>row.type===type);
 if(enabled){
  if(matches.length)return {ok:true};
  if(next.resources.length>=20)return {ok:false,message:'В Карте бизнеса уже 20 ресурсов.'};
  next.resources.push({type,value:'Использую'});
  next.dismissed=next.dismissed.filter(id=>id!==type);
 }else{
  if(matches.some(row=>row.value!=='Использую'))
   return {ok:false,message:'Название или адрес этого ресурса изменяется в Карте бизнеса.'};
  next.resources=next.resources.filter(row=>!(row.type===type&&row.value==='Использую'));
 }
 next.updatedAt=new Date().toISOString();
 if(!store(STORE,JSON.stringify(next)))return {ok:false,message:'Не удалось сохранить на устройстве.'};
 updateEntry();
 window.dispatchEvent(new CustomEvent('seyveo:business-map-changed',{detail:{resources:next.resources.length}}));
 return {ok:true};
}
window.SEYVEO_BUSINESS_MAP=Object.freeze({
 open:start,
 resourceTypes:()=>TYPES.map(x=>({id:x.id,name:x.name,reason:x.reason})),
 saveResourceDetail,removeResourceDetail,
 markResourceUse,
 saveWeeklyRequests:saveOwnerWeeklyRequests,
 getState:()=>{const stored=load();return stored?clone(stored):null},
 getAdvice:()=>{const stored=load();return stored?recommendations(stored).map(item=>({kind:item.kind,type:item.type||'',title:item.title,why:item.why})):[]}
});
updateEntry();
})();