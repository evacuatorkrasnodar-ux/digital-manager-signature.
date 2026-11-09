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
  secureFlow:make('Документооборот','▤','#B8D4E8',['review-document','open-document','later'],['Документ ожидает проверки','Учебный договор подготовлен','Проверить содержание и полномочия подписанта']),
  music:make('Музыка','♫','#BBA6E4',['open-release','later','not-interested'],['Новый альбом любимого исполнителя','Учебный релиз подтверждён в музыкальном каталоге','Открыть страницу альбома'])
 });
 const eventType=Object.freeze({
  'message.received':'message','mail.received':'mail','document.review_requested':'document',
  'task.due':'task','calendar.upcoming':'calendar','health.reminder':'health',
  'care.reminder':'care','finance.review_requested':'finance','business.sale_recorded':'business',
  'employee.requested':'employee','home.offline':'home','security.login_review':'security',
  'shelf.photo_requested':'shelf','employee.recognition_proposed':'recognition',
  'document.signature_review':'secureFlow',
  'music.release_verified':'music'
 });
 const actionLabels=Object.freeze({
  reply:'Ответить','open-chat':'В чат',later:'Позже',
  'review-draft':'Проверить черновик','open-mail':'В почту',
  review:'Проверить','open-document':'В документы','open-task':'В дела',
  'open-calendar':'В календарь','open-health':'В здоровье','open-care':'В заботу',
  'review-payment':'Проверить платёж','open-business':'В бизнес',
  'open-team':'К сотрудникам','open-home':'В умный дом',
  'review-security':'Проверить доступ','request-photo':'Запросить фото',
  'review-recognition':'Проверить благодарность','review-document':'Проверить документ',
  'open-release':'Открыть альбом','not-interested':'Неинтересно'
 });
 // SEYVEO Card Studio · approved action policy (09.11.2026).
 // A visible Sayvi proposal is already an explanation. Do not create a
 // second button that merely repeats it. Preserve actual distinct operations:
 // composing drafts, opening chats, reviewing, sending (with confirmation).
 const cardPolicy=Object.freeze({
  id:'silver-flat-v1',
  darkMaterial:'#38383A',lightMaterial:'#E4E7E9',
  primaryActionsMax:1,primaryPillsMax:1,visibleActionLimit:3,secondaryPresentation:'text',
  deferGesture:'swipe-both-cycle',dismissGesture:'long-press-only',contextGesture:'long-press',deferMinPixels:75,
   singleCardSnoozeMs:60*60*1000,protectedSnoozeMs:10*60*1000,premiumGraphite:'#38383A',
  redundantAdviceActions:Object.freeze(['show-sayvi','show-sayvi-advice','show-suggestion','show-advice']),
  preserveDistinctAssistantActions:true
 });
 const redundantAdviceActions=new Set(cardPolicy.redundantAdviceActions);
 function visibleActions(card){
  if(!Array.isArray(card?.actions))return [];
  const adviceVisible=typeof card.suggestion==='string'&&card.suggestion.trim().length>0;
  const seen=new Set();
  return card.actions.filter(id=>{
   if(typeof id!=='string'||seen.has(id))return false;
   seen.add(id);
   if(id==='later')return false; // deferral is gesture-only, never a button
   if(adviceVisible&&redundantAdviceActions.has(id))return false;
   return true;
  }).slice(0,cardPolicy.visibleActionLimit);
 }
 // Semantic action roles are the single Studio/Home visual contract.
 // Only a meaningful alternative is secondary. Navigation and defer stay text.
 const quietActions=new Set(['later','not-interested']);
 function actionRole(id,index){
  if(quietActions.has(id))return 'quiet';
  if(index===0)return 'primary';
  if(id.startsWith('open-'))return 'navigation';
  return 'secondary';
 }
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
   actions:Object.freeze(visibleActions(card).map((id,index)=>Object.freeze({
    id,label:actionLabels[id]||id,role:actionRole(id,index),requiresConfirmation:confirmActions.has(id)
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
  return visibleCards(out.sort((a,b)=>ranks[a.priority]-ranks[b.priority]));
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
 // Visibility applies ONLY to the Home presentation, never the source.
 // Store identifiers and categories locally, never task/mail/document content.
 const visibilityKey='seyveo-card-visibility-v1';
 const protectedFamilies=new Set(['security','finance','secureFlow']);
 const validFamilies=new Set(Object.keys(catalog));
 function getVisibility(){
  try{
   const data=JSON.parse(window.localStorage?.getItem(visibilityKey)||'{}');
   return {hidden:Array.isArray(data.hidden)?data.hidden.filter(v=>v&&typeof v.key==='string'&&validFamilies.has(v.family)).slice(-500):[],
    muted:Array.isArray(data.muted)?data.muted.filter(v=>validFamilies.has(v)&&!protectedFamilies.has(v)):[]};
  }catch{return {hidden:[],muted:[]}}
 }
 function saveVisibility(data){
  try{window.localStorage?.setItem(visibilityKey,JSON.stringify({hidden:data.hidden.slice(-500),muted:data.muted}));
   window.dispatchEvent?.(new Event('seyveo:card-visibility-changed'));return true;}
  catch{return false;}
 }
 const cardVisibilityKey=card=>[card?.accountId||'local',card?.workspaceId||'personal',card?.family||'',card?.id||''].join('::');
 function isProtected(card){
  return !!card&&(card.protected===true||card.requiresAttention===true||card.priority==='urgent'||
   protectedFamilies.has(card.family)||(card.priority==='important'&&card.family==='task'));
 }
 function isSuppressed(card){
  if(!card||isProtected(card))return false;
  const state=getVisibility();
  return state.muted.includes(card.family)||state.hidden.some(v=>v.key===cardVisibilityKey(card));
 }
 function hideCard(card,hide=true){
  if(!card?.id||isProtected(card))return false;
  const state=getVisibility(),key=cardVisibilityKey(card);
  state.hidden=state.hidden.filter(v=>v.key!==key);
  if(hide)state.hidden.push({key,family:card.family});
  return saveVisibility(state);
 }
 function muteFamily(family,mute=true){
  if(!validFamilies.has(family)||protectedFamilies.has(family))return false;
  const state=getVisibility();state.muted=state.muted.filter(v=>v!==family);
  if(mute)state.muted.push(family);
  return saveVisibility(state);
 }
 function restoreVisibility(){return saveVisibility({hidden:[],muted:[]})}
 function visibleCards(cards){return Array.isArray(cards)?cards.filter(c=>!isSuppressed(c)&&!isSnoozed(c)):[]}
 function rotateQueue(cards,currentId){
  if(!Array.isArray(cards))return [];
  const position=cards.findIndex(c=>c.id===currentId);
  if(position<0||cards.length<2)return cards.slice();
  const copy=cards.slice(),item=copy.splice(position,1)[0];copy.push(item);
  return copy;
 }
 const snoozeKey='seyveo-card-snoozes-v1';
 function readSnoozes(){
  try{
   const raw=JSON.parse(window.localStorage?.getItem(snoozeKey)||'[]');
   if(!Array.isArray(raw))return [];
   const now=Date.now();
   return raw.filter(e=>e&&typeof e.key==='string'&&Number.isFinite(e.until)&&e.until>now).slice(-500);
  }catch{return []}
 }
 function isSnoozed(card){return !!card&&readSnoozes().some(e=>e.key===cardVisibilityKey(card))}
 function getSnoozes(){return readSnoozes().map(entry=>({...entry}))}
 function snoozeCards(cards,now=Date.now()){
  const list=Array.isArray(cards)?cards:[cards],active=readSnoozes();let count=0;
  for(const card of list){
   if(!card?.id)continue;
   const id=cardVisibilityKey(card),duration=isProtected(card)?cardPolicy.protectedSnoozeMs:cardPolicy.singleCardSnoozeMs;
   const until=now+duration,index=active.findIndex(x=>x.key===id);
   if(index>=0)active[index].until=until;
   else active.push({key:id,until});count++;
  }
  if(!count)return false;
  try{window.localStorage?.setItem(snoozeKey,JSON.stringify(active.slice(-500)));
   window.dispatchEvent?.(new Event('seyveo:card-snoozes-changed'));return true}
  catch{return false}
 }
 function clearSnoozes(){
  try{window.localStorage?.removeItem(snoozeKey);
   window.dispatchEvent?.(new Event('seyveo:card-snoozes-changed'));return true}
  catch{return false}
 }
 // Horizontal swipe to defer (both directions). A directional gesture must
 // be substantially longer than vertical movement so scrolling stays native.
 // Pointer events cover iOS 13+/Android/desktop; touch fallback covers old WebKit.
 function isDeferSwipe(dx,dy){
  return Number.isFinite(dx)&&Number.isFinite(dy)
   &&Math.abs(dx)>=cardPolicy.deferMinPixels
   &&Math.abs(dx)>Math.abs(dy)*1.6;
 }
 function installDeferSwipe(node,card,onAction){
  if(!card.actions.includes('later')||typeof onAction!=='function')return;
  node.dataset.svSwipeLater='both';
  node.dataset.svSwipeAction='cycle';
  const interactive=target=>target?.closest?.('button,a,input,textarea,select,[contenteditable="true"],[role="button"]');
  let start=null;
  const begin=(x,y,id,target)=>{
   start=interactive(target)?null:{x,y,id};
  };
  const finish=(x,y,id)=>{
   if(!start||start.id!==id){start=null;return;}
   const point=start;start=null;
   if(isDeferSwipe(x-point.x,y-point.y))onAction('cycle',card);
  };
  if(typeof window.PointerEvent==='function'){
   node.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button!==0){start=null;return;}
    begin(event.clientX,event.clientY,event.pointerId,event.target);
   });
   node.addEventListener('pointerup',event=>finish(event.clientX,event.clientY,event.pointerId));
   node.addEventListener('pointercancel',()=>{start=null;});
  }else{
   node.addEventListener('touchstart',event=>{
    if(event.touches.length!==1){start=null;return;}
    const point=event.touches[0];begin(point.clientX,point.clientY,point.identifier,event.target);
   },{passive:true});
   node.addEventListener('touchend',event=>{
    if(event.changedTouches.length!==1){start=null;return;}
    const point=event.changedTouches[0];finish(point.clientX,point.clientY,point.identifier);
   },{passive:true});
   node.addEventListener('touchcancel',()=>{start=null;},{passive:true});
  }
 }
  // Hold to open a small native-feeling Silver Flat menu. No permanent buttons.
 function installCardContextMenu(node,card,onAction){
  if(typeof onAction!=='function')return;
  const menu=document.createElement('div');
  menu.className='sv-card-context';menu.hidden=true;
  menu.setAttribute('role','group');menu.setAttribute('aria-label','Управление карточкой');
  let timer=null,start=null;
  const clear=()=>{if(timer!==null){window.clearTimeout(timer);timer=null}};
  const outside=event=>{if(!node.contains(event.target))close()};
  const close=()=>{clear();menu.hidden=true;node.removeAttribute('data-card-menu-open');document.removeEventListener('pointerdown',outside,true)};
  const open=()=>{
   clear();start=null;menu.hidden=false;node.dataset.cardMenuOpen='true';
   document.addEventListener('pointerdown',outside,true);
   menu.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  };
  const option=(title,action,disabled=false)=>{
   const button=document.createElement('button');button.type='button';button.className='sv-card-context-item';
   button.textContent=title;button.disabled=disabled;
   button.addEventListener('click',()=>{
    close();
    if(action==='cancel')return;
    if(action==='hide'){if(card.demo!==true&&!hideCard(card))return;node.hidden=true;}
    if(action==='mute-family'){if(card.demo!==true&&!muteFamily(card.family))return;node.hidden=true;}
    onAction(action,card);
   });
   menu.append(button);
  };
  
  option('Убрать карточку','hide',isProtected(card));
  option('Не показывать такие','mute-family',isProtected(card));
  option('Отмена','cancel');
  node.append(menu);
  const interactive=target=>target?.closest?.('button,a,input,textarea,select,[contenteditable="true"]');
  const down=(x,y,id,target)=>{
   clear();start=interactive(target)?null:{x,y,id};
   if(start)timer=window.setTimeout(open,580);
  };
  const move=(x,y,id)=>{
   if(start?.id===id&&Math.hypot(x-start.x,y-start.y)>12)clear();
  };
  if(typeof window.PointerEvent==='function'){
   node.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;down(e.clientX,e.clientY,e.pointerId,e.target)});
   node.addEventListener('pointermove',e=>move(e.clientX,e.clientY,e.pointerId));
   node.addEventListener('pointerup',()=>{clear();start=null});
   node.addEventListener('pointercancel',()=>{clear();start=null});
  }else{
   node.addEventListener('touchstart',e=>{if(e.touches.length===1){const p=e.touches[0];down(p.clientX,p.clientY,p.identifier,e.target)}},{passive:true});
   node.addEventListener('touchmove',e=>{if(e.touches.length===1){const p=e.touches[0];move(p.clientX,p.clientY,p.identifier)}},{passive:true});
   node.addEventListener('touchend',()=>{clear();start=null},{passive:true});
   node.addEventListener('touchcancel',()=>{clear();start=null},{passive:true});
  }
  node.addEventListener('contextmenu',e=>{if(interactive(e.target))return;e.preventDefault();open()});
  node.tabIndex=0;
  node.addEventListener('keydown',e=>{
   if(e.key==='Escape'){close();return}
   if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();open()}
  });
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
  article.dataset.svCardVersion='3';
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
   button.type='button';button.dataset.cardAction=action.id;button.dataset.cardRole=action.role;
   button.disabled=typeof onAction!=='function';
   if(!button.disabled)button.addEventListener('click',()=>onAction(action.id,card));
   actions.append(button);
  }
  article.append(actions);
  installDeferSwipe(article,card,onAction);
  installCardContextMenu(article,card,onAction);
  return article;
 }
 root.SEYVEO_CARD_ENGINE=Object.freeze({
  version:7,catalog,eventType,actionLabels,safety,cardPolicy,actionRole,visibleActions,isDeferSwipe,
   isProtected,isSuppressed,isSnoozed,hideCard,muteFamily,getVisibility,restoreVisibility,visibleCards,
   rotateQueue,snoozeCards,getSnoozes,clearSnoozes,
  presentation,buildCard,fromEvents,demoEvents,renderCard,decorateHome
 });
})(window);
