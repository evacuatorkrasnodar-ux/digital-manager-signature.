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
const safeRead=key=>{try{return localStorage.getItem(key)}catch{return null}};
const store=(key,value)=>{try{localStorage.setItem(key,value);return true}catch{return false}};
const norm=(text,max)=>String(text||'').replace(/\s+/g,' ').trim().slice(0,max);
const fresh=mode=>({version:1,mode:mode==='start'?'start':'existing',description:'',goal:'',resources:[],dismissed:[],updatedAt:''});
function load(){
 try{
  const saved=JSON.parse(safeRead(STORE)||'null');
  if(!saved||saved.version!==1||!['start','existing'].includes(saved.mode))return null;
  const resources=Array.isArray(saved.resources)?saved.resources.filter(x=>
   x&&byType(x.type)&&typeof x.value==='string'&&x.value.length<=200
  ).slice(0,20).map(x=>({type:x.type,value:norm(x.value,180)})).filter(x=>x.value):[];
  return {version:1,mode:saved.mode,description:norm(saved.description,1000),
   goal:norm(saved.goal,320),resources,dismissed:Array.isArray(saved.dismissed)?[...new Set(saved.dismissed.filter(x=>typeof x==='string'&&byType(x)))].slice(0,TYPES.length):[],updatedAt:typeof saved.updatedAt==='string'?saved.updatedAt:''};
 }catch{return null}
}
function ownerFocus(){
 try{const x=JSON.parse(safeRead(PROFILE)||'null');return x?.focus}catch{return null}
}
function clone(x){return {version:1,mode:x.mode,description:x.description,goal:x.goal,
 resources:x.resources.map(row=>({...row})),dismissed:[...(x.dismissed||[])],updatedAt:x.updatedAt}}
let data=fresh('existing'),preview=false,firstLaunch=false,view='choose',sourceType='',origin=null;
const title=$('businessMapTitle'),sub=$('businessMapLead'),status=$('businessMapStatus');
const field=$('businessMapInput'),form=$('businessMapForm'),inputLabel=$('businessMapInputLabel'),inputHelp=$('businessMapInputHelp');
const pages={choose:$('businessMapChoose'),about:form,goal:form,source:form,sources:$('businessMapSources'),map:$('businessMapOverview')};
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
 if(label)label.textContent=s?(s.resources.length+' источн. · '+(s.description?'есть описание':'нужно описание')):'Начать';
 if(prompt){
  const suggestion=s?recommendations(s)[0]:null;
  prompt.textContent=s
   ?suggestion?'Следующий вопрос: '+suggestion.title:'Сведения сохранены. Можно продолжить знакомство.'
   :'Расскажите о компании, целях и используемых ресурсах';
 }
}
function markStep(next){
 view=next;status.textContent='';
 for(const [key,panel] of Object.entries(pages)){
  if(key==='about'||key==='goal'||key==='source')continue;
  panel.hidden=key!==view;
 }
 form.hidden=!['about','goal','source'].includes(view);
 if(view==='choose'){
  title.textContent='С чего начинается ваш путь?';
  sub.textContent='Расскажите, есть ли у вас бизнес. Никаких длинных анкет.';
 }else if(view==='about'){
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
 }else if(view==='goal'){
  title.textContent='Что для вас сейчас важнее?';
  sub.textContent=data.mode==='start'?'Например: найти первых клиентов или рассчитать расходы.':'Например: больше заявок, меньше расходов или порядок в процессах.';
  inputLabel.textContent='Главная цель или трудность · необязательно';
  field.value=data.goal;field.maxLength=320;
  field.placeholder='Чего хотите добиться в первую очередь?';
  inputHelp.textContent='Можно пропустить и рассказать позже.';
  $('businessMapSubmit').textContent='Продолжить';
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
 }else if(view==='map'){
  title.textContent='SEYVEO начинает понимать ваше дело';
  sub.textContent='Это карта того, что вы рассказали, а не автоматический анализ или подключение сервисов.';
  drawMap();
 }
 $('businessMapBack').hidden=view==='choose'||view==='map';
 $('businessMapSkipGoal').hidden=view!=='goal';
 $('businessMapLater').textContent=preview?'Закрыть демо':'Продолжить позже';
 $('businessMapProgress').textContent=preview?'ДЕМО · БЕЗ СОХРАНЕНИЯ':
  view==='choose'?'НАЧАЛО ЗНАКОМСТВА':
  view==='about'?'01 · О БИЗНЕСЕ':
  view==='goal'?'02 · ЦЕЛИ':
  view==='sources'||view==='source'?'03 · РЕСУРСЫ':'КАРТА БИЗНЕСА';
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
function prioritySources(map=data){
 if(map.mode==='start')return TOPIC.start;
 const goal=map.goal.toLocaleLowerCase('ru-RU');
 if(/клиент|заказ|заяв|продаж|трафик|реклам|лид|покупател/.test(goal))return TOPIC.customers;
 if(/доход|расход|финанс|налог|прибыл|выручк|бюджет|денег|затрат/.test(goal))return TOPIC.finance;
 if(/процесс|сотруд|скорост|поручен|организ|автомат|срок/.test(goal))return TOPIC.operations;
 return TOPIC.general;
}
function recommendations(map=data){
 const items=[];
 if(!map.description)items.push({kind:'about',title:map.mode==='start'?'Опишите будущий бизнес':'Расскажите о компании',
  why:'SEYVEO нужно знать сферу деятельности, город и клиентов, прежде чем советовать инструменты.'});
 if(!map.goal)items.push({kind:'goal',title:'Назовите главную цель',
  why:'Цель помогает выбирать вопросы по приоритету вместо случайных рекомендаций.'});
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
function adviceAction(button){
 const action=button.dataset.businessAdviceAction,source=button.dataset.businessAdviceType;
 if(action==='about'||action==='goal'){markStep(action);return}
 if(action==='source'&&byType(source)){sourceType=source;markStep('source');return}
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
  act.textContent=item.kind==='about'||item.kind==='goal'?'Ответить':item.kind==='connect'?'Как будет подключаться':'Указать ресурс';
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
 drawAdvice();
 const list=$('businessMapResourceList');list.replaceChildren();
 if(!data.resources.length){
  const p=document.createElement('p');p.className='business-map-empty';p.textContent='Ресурсы ещё не указаны.';list.append(p);
 }else for(const [i,item] of data.resources.entries()){
  const row=document.createElement('div');row.className='business-map-resource-row';
  const text=document.createElement('div');const strong=document.createElement('strong');
  strong.textContent=byType(item.type)?.name||'Ресурс';
  const small=document.createElement('small');
  small.textContent=item.value+' · данные об источнике, не подключение';
  text.append(strong,small);
  const remove=document.createElement('button');remove.type='button';remove.dataset.businessRemove=String(i);
  remove.textContent='Убрать';remove.setAttribute('aria-label','Убрать '+strong.textContent);
  row.append(text,remove);list.append(row);
 }
 $('businessMapCount').textContent=data.resources.length
  ?'Указано источников: '+data.resources.length+'. Подключений к сервисам пока нет.'
  :'Подключений к сервисам пока нет.';
}
function acceptable(value){
 if(!value)return false;
 if(/(?:парол[ья]|password|access[_ -]?token|api[_ -]?key|client[_ -]?secret|bearer\s|otp|pin[ =:]|код\s+доступа|секретн)/i.test(value))return false;
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
  markStep('goal');
 }else if(view==='goal'){
  data.goal=norm(value,320);
  if(!save())return;
  markStep('sources');
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
 const initial=!stored&&focus!=='start'&&!['pro','max'].includes(focus);
 try{dialog.showModal()}catch{return false}
 markStep(options.fromStart||(!stored&&['start','pro','max'].includes(focus))?'about':initial?'choose':stored?'map':'choose');
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
$('businessMapChoose').addEventListener('click',event=>{
 const button=event.target.closest?.('[data-business-mode]');if(!button)return;
 data.mode=button.dataset.businessMode==='start'?'start':'existing';
 markStep('about');
});
form.addEventListener('submit',submit);
$('businessMapBack').addEventListener('click',()=>{
 markStep(view==='source'?'sources':view==='goal'?'about':'map');
});
$('businessMapSkipGoal').addEventListener('click',()=>{
 if(view==='goal'){markStep('sources')}
});
$('businessMapCategories').addEventListener('click',event=>{
 const button=event.target.closest?.('[data-business-source]');if(!button)return;
 sourceType=button.dataset.businessSource;
 markStep('source');
});
$('businessMapSeeMap').addEventListener('click',()=>markStep('map'));
$('businessMapAddSource').addEventListener('click',()=>markStep('sources'));
$('businessMapEditAbout').addEventListener('click',()=>markStep('about'));
$('businessMapEditGoal').addEventListener('click',()=>markStep('goal'));
$('businessMapFinish').addEventListener('click',finish);
$('businessMapAdvice')?.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-business-advice-action]');if(button)adviceAction(button);
});
$('businessMapConnectionGuide')?.addEventListener('click',()=>adviceAction({dataset:{businessAdviceAction:'connection-guide'}}));
$('businessMapRestoreSuggestions')?.addEventListener('click',()=>adviceAction({dataset:{businessAdviceAction:'restore'}}));
$('businessMapResourceList').addEventListener('click',event=>{
 const button=event.target.closest?.('[data-business-remove]');if(!button)return;
 const index=Number(button.dataset.businessRemove);
 if(!Number.isInteger(index)||index<0||index>=data.resources.length)return;
 const existing=data.resources.slice();
 data.resources.splice(index,1);
 if(!save()){data.resources=existing;return}
 markStep('map');
});
entry.addEventListener('click',()=>start({trigger:entry}));

window.addEventListener('storage',event=>{if(event.key===STORE)updateEntry()});
window.addEventListener('pagehide',()=>{if(dialog.open)dialog.close()});
window.SEYVEO_BUSINESS_MAP=Object.freeze({
 open:start,
 getState:()=>{const stored=load();return stored?clone(stored):null},
 getAdvice:()=>{const stored=load();return stored?recommendations(stored).map(item=>({kind:item.kind,type:item.type||'',title:item.title,why:item.why})):[]}
});
updateEntry();
})();