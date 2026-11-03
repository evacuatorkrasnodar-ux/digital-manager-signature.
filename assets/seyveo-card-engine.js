/* SEYVEO Card Engine v2 · one event → one presentation contract.
 * Domain-only build/queue; DOM renderer contains no application side effects.
 * All 15 families share the same editorial order, touch targets and action IDs.
 * Services remain owners of real send/sign/pay/complete confirmations. */
(function(root){
 'use strict';
 const make=(family,icon,accent,actions,example)=>Object.freeze({
  family,icon,accent,actions:Object.freeze(actions),example:Object.freeze(example)
 });
 const catalog=Object.freeze({
  message:make('Сообщения','◎','#8FE3C3',['reply','open-chat','later'],['Елена написала','Проверить выкладку товаров','Запросить фотографию']),
  mail:make('Почта','✉','#8FE3C3',['review-draft','open-mail','later'],['Письмо Андрея','Клиент спрашивает о доставке','Уточнить адрес доставки']),
  document:make('Документы','▤','#B8D4E8',['review','open-document','later'],['Договор поставки','В учебном договоре нет срока','Предложить конкретный срок']),
  task:make('Дела','☑','#B8D4E8',['open-task','later'],['Срок поручения','Учебное поручение ожидает','Проверить исполнение']),
  calendar:make('Календарь','▦','#E7D2A2',['open-calendar','later'],['Скоро встреча','Запланировано событие','Подготовить материалы']),
  health:make('Здоровье','♡','#E8B8C7',['open-health','later'],['Время передышки','Учебное напоминание об отдыхе','Сделать короткую паузу']),
  care:make('Забота','♥','#E8B8C7',['open-care','later'],['Личное напоминание','Запланированное личное дело','Проверить расписание']),
  finance:make('Финансы','▱','#E7D2A2',['review-payment','later'],['Проверка платежа','Учебный платёж ожидает','Проверить реквизиты']),
  business:make('Бизнес','▥','#A5D8BB',['open-business','later'],['Новая продажа','Учебная запись о продаже','Посмотреть показатели']),
  employee:make('Сотрудники','♧','#CBBFE9',['open-team','later'],['Запрос сотрудника','Елена оставила запрос','Открыть обращение']),
  home:make('Умный дом','⌂','#C2DED1',['open-home','later'],['Нет связи с устройством','Учебный датчик недоступен','Проверить соединение']),
  security:make('Безопасность','◇','#B8D4E8',['review-security','later'],['Проверка доступа','Учебное событие входа','Посмотреть устройства']),
  shelf:make('Проверка выкладки','▧','#8FE3C3',['request-photo','open-chat','later'],['Елена закончила выкладку','Фото ещё не получено','Попросить прислать фото полки и ценников']),
  recognition:make('Благодарность','✦','#E7D2A2',['review-recognition','open-team','later'],['Предложена звезда сотруднику','Коллега отметил помощь Елены','Проверить благодарность без автоматического начисления']),
  secureFlow:make('Документооборот','▤','#B8D4E8',['review-document','open-document','later'],['Документ ожидает проверки','Учебный договор подготовлен','Проверить содержание и полномочия подписанта'])
 });
 const eventType=Object.freeze({
  'message.received':'message','mail.received':'mail','document.review_requested':'document',
  'task.due':'task','calendar.upcoming':'calendar','health.reminder':'health',
  'care.reminder':'care','finance.review_requested':'finance','business.sale_recorded':'business',
  'employee.requested':'employee','home.offline':'home','security.login_review':'security',
  'shelf.photo_requested':'shelf','employee.recognition_proposed':'recognition',
  'document.signature_review':'secureFlow'
 });
 const actionLabels=Object.freeze({
  reply:'Ответить','open-chat':'В чат',later:'Позже',
  'review-draft':'Проверить черновик','open-mail':'В почту',
  review:'Проверить','open-document':'В документы','open-task':'В дела',
  'open-calendar':'В календарь','open-health':'В здоровье','open-care':'В заботу',
  'review-payment':'Проверить платёж','open-business':'В бизнес',
  'open-team':'К сотрудникам','open-home':'В умный дом',
  'review-security':'Проверить доступ','request-photo':'Запросить фото',
  'review-recognition':'Проверить благодарность','review-document':'Проверить документ'
 });
 const confirmActions=new Set(['reply','review-payment','request-photo','review-recognition','review-document']);
 const trim=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
 const owns=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
 const safety=Object.freeze({
  states:['new','in-progress','deferred','done','failed'],
  sections:['source','fact','suggestion','actions'],
  autoExecute:false,realSend:false,realSign:false,realPay:false
 });
 function presentation(card){
  if(!card||!owns(catalog,card.family))return null;
  const config=catalog[card.family];
  return Object.freeze({
   family:config.family,icon:config.icon,accent:config.accent,
   source:card.source||'Источник не указан',title:card.title,fact:card.fact,
   suggestion:card.suggestion,priority:card.priority,demo:card.demo===true,
   sections:safety.sections,
   actions:Object.freeze(card.actions.map(id=>Object.freeze({
    id,label:actionLabels[id]||id,requiresConfirmation:confirmActions.has(id)
   })))
  });
 }
 function buildCard(event){
  if(!event||typeof event!=='object'||!owns(eventType,event.type))return null;
  const family=eventType[event.type],config=catalog[family];
  const id=trim(event.id,128),title=trim(event.title,140),fact=trim(event.fact,1200);
  if(!id||!title||!fact)return null;
  const card={id,family,eventType:event.type,title,fact,
   suggestion:trim(event.suggestion,1200),
   source:trim(event.source,100)||(event.demo===true?'Студия · учебный пример':'Источник не указан'),
   icon:config.icon,accent:config.accent,
   priority:['normal','important','urgent'].includes(event.priority)?event.priority:'normal',
   status:'new',actions:[...config.actions],
   demo:event.demo===true
  };
  card.presentation=presentation(card);
  return Object.freeze(card);
 }
 function fromEvents(events){
  if(!Array.isArray(events))return [];
  const seen=new Set(),out=[];
  for(const e of events.slice(0,200)){
   const card=buildCard(e);if(!card||seen.has(card.id))continue;
   seen.add(card.id);out.push(card);
  }
  const ranks={urgent:0,important:1,normal:2};
  return out.sort((a,b)=>ranks[a.priority]-ranks[b.priority]);
 }
 function demoEvents(){
  return Object.entries(eventType).map(([type,family],index)=>{
   const config=catalog[family],example=config.example;
   return {id:'studio-example-'+index,type,title:example[0],fact:example[1],
    suggestion:example[2],priority:'normal',source:'Студия Сэйви',demo:true};
  });
 }
 const homeKind=Object.freeze({work:'message',mail:'mail',contract:'document',task:'task',
  health:'health',breath:'care'});
 // The existing original Home scene owns its actual text, animation and button
 // handlers. Adding the shared card identity does not create a second surface.
 function decorateHome(field,kind,real=false){
  const family=owns(homeKind,kind)?homeKind[kind]:owns(catalog,kind)?kind:'task';
  if(!field?.classList)return null;
  field.classList.add('sv-card-system','sv-card-system--home');
  field.dataset.svCardFamily=family;
  field.dataset.svCardDemo=String(!real);
  field.dataset.svCardVersion='2';
  return family;
 }
 const el=(tag,klass,content)=>{
  const node=document.createElement(tag);
  if(klass)node.className=klass;
  if(content!==undefined)node.textContent=content;
  return node;
 };
 // Pure rendering: buttons call only the supplied onAction callback; without it
 // they are disabled. This UI does NOT send, approve, pay, sign or close tasks.
 function renderCard(card,{onAction}={}){
  const p=presentation(card);
  if(!p)return null;
  const article=el('article','sv-card-system sv-card-system--rendered');
  article.dataset.svCardFamily=card.family;
  article.dataset.svCardDemo=String(p.demo);
  article.dataset.svCardVersion='2';
  article.setAttribute('aria-label',p.family+': '+p.title);
  const head=el('div','sv-card-header');
  const mark=el('span','sv-card-mark',p.icon);
  mark.setAttribute('aria-hidden','true');
  mark.style.setProperty('--sv-card-accent',p.accent);
  const headCopy=el('div','sv-card-header-copy');
  headCopy.append(el('span','sv-card-source',p.family+' · '+p.source),
   el('strong','sv-card-title',p.title));
  head.append(mark,headCopy);
  article.append(head);
  const fact=el('div','sv-card-fact');
  fact.append(el('span','sv-card-label','Что произошло'),
   el('p','sv-card-value',p.fact));
  article.append(fact);
  if(p.suggestion){
   const proposal=el('div','sv-card-proposal');
   proposal.append(el('span','sv-card-label','Сэйви предлагает'),
    el('p','sv-card-value',p.suggestion));
   article.append(proposal);
  }
  if(p.demo)article.append(el('small','sv-card-training','Учебный пример · внешние действия не выполняются'));
  const actions=el('div','sv-card-actions');
  actions.setAttribute('role','group');
  actions.setAttribute('aria-label','Действия с карточкой');
  for(const action of p.actions){
   const button=el('button','sv-card-action',action.label);
   button.type='button';button.dataset.cardAction=action.id;
   button.disabled=typeof onAction!=='function';
   if(!button.disabled)button.addEventListener('click',()=>onAction(action.id,card));
   actions.append(button);
  }
  article.append(actions);
  return article;
 }
 root.SEYVEO_CARD_ENGINE=Object.freeze({
  version:2,catalog,eventType,actionLabels,safety,
  presentation,buildCard,fromEvents,demoEvents,renderCard,decorateHome
 });
})(window);
