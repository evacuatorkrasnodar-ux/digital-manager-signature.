/* SEYVEO Signature · One Quiet Cinema v7
 * One living plane, sculpted editorial symbols and restrained kinetic rhythm.
 * Never writes fictional tasks, messages or business data. The approved
 * plasma, its effects, bottom dock and input controller remain untouched. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('homePage'),dynamic=$('dynamic'),space=$('seyveoLivingMoment');
const tiles=$('seyveoLivingTiles'),tip=$('seyveoLivingCaption');
const replay=$('openLivingMomentPreview'),caption=$('livingMomentPreviewStatus');
const demoLaunch=$('seyveoDemoLaunch');
if(!home||!dynamic||!space||!tiles)return;
const MOTION=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const reduced=()=>!!MOTION?.matches;
const TIMING=Object.freeze({open:reduced()?0:620,beat:2900,quiet:4800,close:reduced()?0:720});
let mode='idle',key='',quiet=new Set(),timers=[],readingUntil=0;
let hadRealWork=false,realSignature='';
let pendingUpdate=false;
function later(callback,ms){
 const id=window.setTimeout(callback,ms);
 timers.push(id);return id;
}
function cancel(){for(const id of timers)clearTimeout(id);timers=[]}
function available(){return !home.hidden&&!document.hidden&&(!location.hash||location.hash==='#home')&&!document.documentElement.classList.contains('seyveo-conversation')&&!(document.querySelector('dialog[open]'))}
function editing(){
 const composer=$('ask');
 const node=document.activeElement;
 return !!(composer&&!composer.hidden)
   ||!!(node&&/^(INPUT|TEXTAREA)$/.test(node.tagName||''));
}
function engaged(){
 const node=document.activeElement;
 const keyboardFocus=!!(node?.matches?.(':focus-visible')&&(space.contains(node)||dynamic.contains(node)));
 const mouse=!!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
 return editing()||keyboardFocus||Date.now()<readingUntil||(mouse&&(space.matches(':hover')||dynamic.matches(':hover')))
   ||document.querySelector('dialog[open]')!==null;
}
function focus(on){
 if(home.classList.contains('lm-focus')!==on)home.classList.toggle('lm-focus',on);
}
function resetSpace(){
 space.classList.remove('lm-reveal','lm-disappear','lm-preview','lm-real');
 space.hidden=true;tiles.replaceChildren();previewScene=null;realSignature='';
 tip.textContent='';
}
function rest(){
 cancel();mode='idle';key='';readingUntil=0;
 resetSpace();focus(false);
 scheduleRefresh();
}
function scheduleRefresh(){
 if(pendingUpdate)return;
 pendingUpdate=true;
 queueMicrotask(()=>{pendingUpdate=false;refresh()});
}
function create(tag,klass,words){
 const el=document.createElement(tag);if(klass)el.className=klass;
 if(words!==undefined)el.textContent=words;
 return el;
}
/* One hand-drawn monochrome symbol language, shared by the hero and its
 * quiet secondary rail. No emoji, picture files, WebGL or animated filters. */
const glyph=Object.freeze({
 contract: [
  '<path d="M29 11h29l15 15v53c0 4-3 7-7 7H30c-4 0-7-3-7-7V18c0-4 3-7 6-7Z"/>',
  '<path d="M58 12v15h15"/>',
  '<path d="M35 43h25M35 53h22M35 63h12"/>',
  '<path d="m54 70 5 5 11-12" class="lm-glyph-accent"/>'
 ].join(''),
 mail: [
  '<rect x="11.5" y="23" width="73" height="52" rx="10"/>',
  '<path d="M15 31 43.5 54a7 7 0 0 0 9 0L81 31"/>',
  '<path d="m16 68 22-18m42 18L58 50" class="lm-glyph-accent"/>'
 ].join(''),
 health: [
  '<path d="M48 81 20.2 54.5C1.1 36.2 15 14.3 32.1 19.3 39 21.3 44 26.8 48 33c4-6.2 9-11.7 15.9-13.7 17.1-5 31 16.9 11.9 35.2Z"/>',
  '<path d="M23 48h14l6-11 10 22 6-11h14" class="lm-glyph-accent"/>'
 ].join(''),
 breath: [
  '<path d="M13 35c12-16 21 11 33-1 12-12 20-8 37-3"/>',
  '<path d="M10 49c13-12 24 8 38-2 15-12 22-4 37-1"/>',
  '<path d="M18 64c13-11 24 4 37-3 10-6 18-5 24-2"/>'
 ].join(''),
 task: [
  '<rect x="16" y="14" width="64" height="69" rx="11"/>',
  '<path d="M32 31h33M32 44h24M32 57h12"/>',
  '<path d="m49 67 9 8 15-18" class="lm-glyph-accent"/>'
 ].join('')
});
function icon(kind){
 const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
 const type=Object.hasOwn(glyph,kind)?kind:'task';
 s.setAttribute('viewBox','0 0 96 96');
 s.setAttribute('aria-hidden','true');
 s.setAttribute('focusable','false');
 s.setAttribute('class','lm-art-svg lm-art-svg--'+type);
 s.innerHTML=glyph[type];
 return s;
}

const sample=[
 {kind:'contract',title:'Проверить документ',category:'ДОКУМЕНТЫ · ПРИМЕР',
  body:'Договор ожидает проверки условий до принятия решения.',
  cause:'Не проверены стороны, сроки и возможные обязательства. Это учебная ситуация.',
  proposal:'Сэйва разберёт условия по пунктам и подготовит вопросы к договору.',
  reason:'Это вымышленный договор. Настоящие документы доступны только после разрешённого подключения.',
  detail:'Ни один документ не будет подписан или отправлен без вашего подтверждения.'},
 {kind:'mail',title:'Ответить на письмо',category:'ПОЧТА · ПРИМЕР',
  body:'В примере есть обращение, на которое нужен ответ.',
  cause:'Без текста письма невозможно оценить важность. Почта сейчас не подключена.',
  proposal:'После подключения Сэйва выделит главное и подготовит черновик ответа.',
  reason:'Это пример, реальных писем Сэйва не читала.',
  detail:'Перед отправкой пользователь проверит текст и разрешит отправку.'},
 {kind:'health',title:'Пора передохнуть',category:'ЗАБОТА · ПРИМЕР',
  body:'Запланирована двухминутная пауза для восстановления внимания.',
  cause:'Это иллюстрация возможного напоминания, а не результат анализа здоровья.',
  proposal:'Сэйва может предложить короткую передышку или перенести напоминание.',
  reason:'Учебный пример, не основанный на медицинских измерениях.',
  detail:'Никаких медицинских выводов по этому примеру не делается.'}
];
/* Navigate through one continuous Sayvi space. No unrelated page or duplicate sphere. */
function openDestination(kind){
 if(kind==='task'){$('navTasks')?.click();return true}
 return window.SEYVEO_SAYVI_SURFACES?.open?.(kind)===true;
}
function openCardAction(item){
 if(item?.id){
  $('navTasks')?.click();
  window.dispatchEvent(new CustomEvent('seyveo:home-task-open',{detail:{id:item.id}}));
  return true;
 }
 if(item?.callTarget&&window.SEYVEO_CONTACTS?.requestCall){
  // No new address book and no fictional call completion.
  return !!window.SEYVEO_CONTACTS.requestCall(item.callTarget);
 }
 return openDestination(item.kind);
}
function polymer(label,callback,kind='quiet'){
 const b=create('button','lm-polymer lm-polymer--'+kind,label);
 b.type='button';b.addEventListener('click',event=>{event.stopPropagation();readingUntil=Date.now()+15000;callback(b)});
 return b;
}
function createSurface(primary,other=[],real=false){
 tiles.replaceChildren();
 const field=create('div','lm-field');
 field.dataset.lmMode=real?'real':'preview';
 const scene=create('div','lm-scene');
 const top=create('div','lm-field-top');
 const label=create('span','lm-field-eyebrow',primary.category);
 const sequence=[primary,...other];
 const position=create('span','lm-field-measure',
  (real?'ВАШИ ДАННЫЕ':'ПРЕДПРОСМОТР')+' · 01 / '+String(sequence.length).padStart(2,'0'));
 top.append(label,position);
 const main=create('section','lm-primary');
 const hero=create('div','lm-hero');
 const artwork=create('button','lm-hero-art lm-hero-art--'+primary.kind);
 artwork.type='button';artwork.setAttribute('aria-label','Открыть: '+primary.title);
 artwork.append(icon(primary.kind));
 artwork.addEventListener('click',()=>{
  readingUntil=Date.now()+20000;
  openCardAction(shown);
 });
 const copy=create('div','lm-primary-copy');
 const headline=create('strong','lm-primary-title',primary.title);
 const description=create('p','lm-primary-subtitle',primary.body);
 copy.append(headline,description);
 hero.append(artwork,copy);
 const controls=create('div','lm-actions');
 let shown=primary;
 let morphLocked=false;
 let expanded=false;
 const more=create('p','lm-explanation');
 more.id='seyveoSurfaceReason';
 more.hidden=true;
 // Quiet Cinema: two simple textual actions, no glass tiles or raised buttons.
 // Подробнее reveals local context; Исполнить opens the actual destination.
 // Neither action claims to have sent mail, signed a document or completed a call.
 const open=polymer('Подробнее',()=>{
  if(discussTask(shown,{demo:!real}))return;
  expanded=!expanded;
  field.classList.toggle('lm-has-reason',expanded);
  more.hidden=!expanded;
  more.textContent=expanded?shown.reason+' '+shown.detail:'';
  open.setAttribute('aria-expanded',String(expanded));
 },'main');
 const execute=polymer('Исполнить',()=>{
  const worked=openCardAction(shown);
  if(worked)return;
  expanded=true;field.classList.add('lm-has-reason');
  more.hidden=false;
  more.textContent=shown.reason+' '+shown.detail+
   ' Для реального исполнения необходимо открыть соответствующий раздел и подтвердить действие.';
  open.setAttribute('aria-expanded','true');
 },'main');
 open.setAttribute('aria-controls',more.id);
 open.setAttribute('aria-expanded','false');
 open.setAttribute('aria-label','Подробнее: '+primary.title);
 execute.setAttribute('aria-label','Исполнить: '+primary.title);
 controls.append(open,execute);
 main.append(hero,controls);
 const secondary=create('div','lm-secondary');
 function renderSecondary(){
  secondary.replaceChildren();
  // One next item on iPhone X and shorter devices; all items remain
  // reachable by tapping through the circular queue, with zero inner scroll.
  const limit=window.innerHeight<=860?1:2;
  const ordered=[primary,...other];
  const activeIndex=ordered.indexOf(shown);
  const upcoming=ordered.slice(activeIndex+1).concat(ordered.slice(0,activeIndex));
  for(const item of upcoming.slice(0,limit)){
   const row=create('button','lm-inline-item');
   row.type='button';row.dataset.lmKind=item.kind;
   row.setAttribute('aria-label','Показать: '+item.title);
   const mark=create('span','lm-inline-art');
   mark.append(icon(item.kind));
   const words=create('span','lm-inline-copy');
   words.append(create('span','lm-inline-title',item.title),create('span','lm-inline-note',item.body));
   // The whole row is the action. No decorative arrow: the artwork and
   // title already make it recognizable, as in SEYVEO Quiet Actions.
   row.append(mark,words);
   row.addEventListener('click',()=>{
    readingUntil=Date.now()+20000;
    changeFeatured(item);
   });
   secondary.append(row);
  }
 }
 function changeFeatured(item){
  if(item===shown||morphLocked)return;
  morphLocked=true;
  scene.classList.add('lm-scene--changing');
  later(()=>{
   if(!tiles.contains(field)||mode==='idle')return;
   shown=item;
   field.dataset.lmSubject=item.kind;
   artwork.className='lm-hero-art lm-hero-art--'+item.kind;
   artwork.replaceChildren(icon(item.kind));
   artwork.setAttribute('aria-label','Открыть: '+item.title);
   label.textContent=item.category;
   position.textContent=(real?'ВАШИ ДАННЫЕ':'ПРЕДПРОСМОТР')+' · '+
    String(sequence.indexOf(item)+1).padStart(2,'0')+' / '+
    String(sequence.length).padStart(2,'0');
   headline.textContent=item.title;
   description.textContent=item.body;
   expanded=false;
   field.classList.remove('lm-has-reason');
   more.hidden=true;
   more.textContent='';
   open.textContent='Подробнее';
   open.setAttribute('aria-expanded','false');
   open.setAttribute('aria-label','Подробнее: '+shown.title);
   execute.setAttribute('aria-label','Исполнить: '+shown.title);
   renderSecondary();
   scene.classList.remove('lm-scene--changing');
   later(()=>{morphLocked=false},720);
  },reduced()?0:430);
 }
 field.dataset.lmSubject=primary.kind;
 renderSecondary();
 scene.append(top,main,secondary,more);
 field.append(scene);
 tiles.append(field);
 return {field,changeFeatured};
}
let previewScene=null;
/* Keep saved tasks and previous postponements, with one visible Home renderer. */
const DEFERRED_KEY='seyveo-home-deferred-tasks-v1';
const deferredFallback={};
function localDay(date=new Date()){
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),
  String(date.getDate()).padStart(2,'0')].join('-');
}
function deferredTasks(){
 try{
  const value=JSON.parse(localStorage.getItem(DEFERRED_KEY)||'{}');
  return value&&typeof value==='object'&&!Array.isArray(value)?value:deferredFallback;
 }catch{return deferredFallback}
}
function readOpenTasks(){
 let data=[];try{data=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]')}catch{}
 if(!Array.isArray(data))return [];
 const deferred=deferredTasks(),today=localDay();
 return data.filter(t=>t&&t.done!==true&&typeof t.id==='string'&&
   typeof t.title==='string'&&t.title.trim()&&!(deferred[t.id]>today))
  .map(t=>({id:t.id,title:t.title.trim().slice(0,140),
   due:typeof t.due==='string'?t.due:'',sourceNoteId:t.sourceNoteId||''}))
  .sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31'));
}
function artisticKind(t){
 const title=String(t.title||'').toLowerCase();
 return /письм|почт|ответить|email/.test(title)?'mail':
   /документ|договор|акт|контракт|счет|счёт/.test(title)?'contract':
   /здоров|отдох|передох|пульс|врач/.test(title)?'health':'task';
}
function storyFromTask(task){
 const kind=artisticKind(task),today=localDay();
 const deadline=task.due?task.due.split('-').reverse().join('.'):'';
 const dueContext=task.due
  ? (task.due<today?'Срок уже прошёл: ':task.due===today?'Срок сегодня: ':'Запланировано на ')+deadline+'.'
  : 'Срок ещё не указан.';
 const suggestion=kind==='mail'?'Разобрать обращение и подготовить ответ для согласования.':
  kind==='contract'?'Проверить условия документа и подготовить решение.':
  kind==='health'?'Уточнить обстоятельства и выбрать безопасный следующий шаг.':
  'Уточнить детали с Сэйвой и согласовать последовательность действий.';
 return {kind,title:task.title,category:'ВАШЕ ДЕЛО',
  body:dueContext,
  cause:task.due?'Дело ожидает вашего решения в указанный срок.':
    'Дело сохранено, но для приоритета может понадобиться срок и дополнительный контекст.',
  proposal:suggestion,
  reason:'Это ваше сохранённое дело. Сэйва пока опирается только на его название и срок.',
  detail:'Обсудите детали в чате. Реальное исполнение потребует вашего подтверждения.',
  id:task.id,due:task.due,sourceNoteId:task.sourceNoteId};
}
/* Подробнее is a deep conversation, never an inline accordion.
   Reuse the ONE existing chat and composer; do not invent an assistant reply. */
function discussTask(item,{demo=false}={}){
 const chat=window.SEYVEO_CONVERSATION;
 if(typeof chat?.open!=='function')return false;
 chat.open();
 const input=$('question');
 if(!input)return false;
 const existing=input.value.trim();
 if(existing){
  chat.status?.('Ваш черновик сохранён. Отправьте его или очистите.',4300);
  return true;
 }
 const title=String(item.title||'').slice(0,140);
 const body=String(item.body||'').slice(0,300);
 const cause=String(item.cause||'').slice(0,370);
 const proposal=String(item.proposal||'').slice(0,370);
 const prompt=(demo?'Это учебный пример, не реальное дело. ':'')+
  'Сэйва, давай подробно разберём дело «'+title+'».\n'+
  'Ситуация: '+body+'\nПричина: '+cause+'\nПредложение: '+proposal+
  '\nПомоги разобраться в проблеме, уточни недостающую информацию и предложи безопасный план. Ничего не исполняй без моего подтверждения.';
 input.value=prompt;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 chat.status?.('Контекст дела подготовлен. Отправьте сообщение, чтобы начать.',5400);
 return true;
}
function disappear(){
 if(mode!=='advice')return;
 quiet.add(key);dynamic.classList.add('lm-real-out');
 later(()=>{if(mode==='advice'){dynamic.hidden=true;rest()}},TIMING.close);
}
function hold(callback,delay){
 const check=()=>{
  if(mode==='idle'||!available()){if(!available())return rest();return}
  if(engaged()){later(check,1800);return}
  callback();
 };
 later(check,delay);
}
function startPreview(list=null,{demo=true}={}){
 if(!available()||editing())return false;
 if(mode!=='idle')rest();
 const all=demo?sample:(list||readOpenTasks()).map(storyFromTask);
 if(!all.length)return false;
 if(!demo)hadRealWork=true;
 mode='preview';key=demo?'preview':'preview-real';
 if(demoLaunch)demoLaunch.hidden=true;
 dynamic.hidden=true;
 const scenes=all.slice(0,3);
 previewScene=createSurface(scenes[0],scenes.slice(1),!demo);
 tip.textContent='';
 space.hidden=false;
 space.classList.add('lm-preview');
 focus(true);
 later(()=>{if(mode==='preview')space.classList.add('lm-reveal')},TIMING.open);
 // The original preview stays visible; no second card deck or reflow.
 let featured=0;
 const nextBeat=()=>{
  if(mode!=='preview')return;
  featured++;
  if(featured>=scenes.length)return;
  previewScene?.changeFeatured(scenes[featured]);
  hold(nextBeat,TIMING.beat);
 };
 if(scenes.length>1)hold(nextBeat,TIMING.beat+TIMING.open);
 if(caption)caption.textContent='Quiet Cinema: одна живая главная, плавная смена важных сюжетов.';
 return true;
}
function adviceIdentity(card){
 if(!card)return '';
 const title=card.querySelector('.event-copy strong')?.textContent||'';
 const basis=card.querySelector('.card-tag')?.textContent||'';
 return 'advice:'+(title+'|'+basis).trim().slice(0,300);
}
function showExistingAdvice(){
 const card=dynamic.querySelector('[data-owner-advice]');
 if(!card)return false;
 // Bring existing permission-based recommendations into the same editorial
 // symbol system. Remove their obsolete small icon instead of stacking art.
 const heading=card.querySelector('.event-copy strong')?.textContent||'';
 const kind=/почт|письм|e-mail|email/i.test(heading)?'mail':
  /здоров|сердц|пульс/i.test(heading)?'health':'task';
 const row=card.querySelector('.card-main');
 if(row&&!row.querySelector('.lm-owner-art')){
  const art=create('button','lm-owner-art');
  art.type='button';
  art.setAttribute('aria-label',kind==='mail'?'Открыть почтовое пространство':kind==='health'?'Открыть здоровье':'Открыть дела');
  art.append(icon(kind));
  art.addEventListener('click',event=>{
   event.preventDefault();event.stopPropagation();
   openDestination(kind);
  });
  row.querySelector('.event-icon')?.remove();
  row.prepend(art);
 }
 const id=adviceIdentity(card);
 if(quiet.has(id))return false;
 mode='advice';key=id;
 space.hidden=true;
 dynamic.hidden=false;
 dynamic.classList.remove('lm-real-dim','lm-real-out');
 focus(true);
 hold(()=>{
  dynamic.classList.add('lm-real-dim');
  hold(()=>disappear(),6000);
 },11000);
 return true;
}
/* Personal tasks render in the same original preview surface. */
function showRealWork(tasks){
 if(!tasks.length)return false;
 if(mode!=='idle')rest();
 mode='real';key='real-work';hadRealWork=true;
 realSignature=tasks.map(t=>[t.id,t.title,t.due||''].join(':')).join('|');
 const stories=tasks.map(storyFromTask);
 dynamic.hidden=true;
 previewScene=createSurface(stories[0],stories.slice(1),true);
 tip.textContent='';
 space.hidden=false;
 space.classList.remove('lm-disappear','lm-preview');
 space.classList.add('lm-real');
 focus(true);
 later(()=>{if(mode==='real')space.classList.add('lm-reveal')},TIMING.open);
 return true;
}
function refresh(){
 if(demoLaunch)demoLaunch.hidden=true;
 if(document.hidden||home.hidden||document.documentElement.classList.contains('seyveo-conversation'))return;
 const pending=dynamic.querySelector('[data-owner-advice]');
 const pendingKey=adviceIdentity(pending);
 const realTasks=readOpenTasks();
 const nextSignature=realTasks.map(t=>[t.id,t.title,t.due||''].join(':')).join('|');
 if(mode==='preview'){
  if(realTasks.length){rest();showRealWork(realTasks);return}
  if(!dynamic.hidden)dynamic.hidden=true;
  return;
 }
 if(mode==='real'){
  if(nextSignature!==realSignature){
   rest();
   if(realTasks.length)showRealWork(realTasks);
  }
  return;
 }
 if(mode==='advice'){
  if(key!==pendingKey){rest();return}
  if(quiet.has(key)&&!dynamic.hidden)dynamic.hidden=true;
  return;
 }
 // Do not resize the sphere beneath a working mobile keyboard.
 if(editing())return;
 if(realTasks.length){showRealWork(realTasks);return;}
 if(pending&&showExistingAdvice())return;
 if(pending&&quiet.has(pendingKey)&&!dynamic.hidden)dynamic.hidden=true;
 if(mode==='idle'){
  focus(false);
  if(demoLaunch)demoLaunch.hidden=false;
  requestAutoDemo();
 }
}
const observer=new MutationObserver(scheduleRefresh);
observer.observe(dynamic,{childList:true,attributes:true,attributeFilter:['hidden']});
const viewObserver=new MutationObserver(()=>{
 if(document.documentElement.classList.contains('seyveo-conversation')){
  if(mode!=='idle')rest();
 }else scheduleRefresh();
});
viewObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
window.addEventListener('seyveo:tasks-changed',scheduleRefresh);
window.addEventListener('seyveo:business-map-changed',scheduleRefresh);
window.addEventListener('seyveo:connection-followup-changed',scheduleRefresh);
window.addEventListener('hashchange',()=>{
 if(mode!=='idle')rest();
 else focus(false);
 // Sync after the main router updates Home visibility.
 later(scheduleRefresh,160);
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&mode!=='idle')rest();
 else if(!document.hidden)scheduleRefresh();
});
window.addEventListener('pagehide',()=>{cancel();mode='idle';key='';resetSpace();focus(false)});
window.addEventListener('pageshow',scheduleRefresh);
/* Real business recommendations remain actionable. Explain in place without
 * launching a second modal and without overwriting their original approval logic. */
/* Director's flow for real recommendations:
 * first Подробнее, then show the ORIGINAL permitted action. */
dynamic.addEventListener('click',event=>{
 const button=event.target.closest?.('#inspect');
 if(!button)return;
 const card=dynamic.querySelector('[data-owner-advice]');
 if(!card)return;
 event.preventDefault();event.stopImmediatePropagation();
 const reason=create('p','lm-real-reason',
  card.dataset.explanation||card.querySelector('.card-tag')?.textContent||
  'Рекомендация основана на данных, предоставленных владельцем.');
 card.append(reason);
 button.setAttribute('aria-expanded','true');
 button.hidden=true;
 const action=card.querySelector('#resolve');
 if(action)action.hidden=false;
 const postpone=card.querySelector('#postponeConnection');
 if(postpone)postpone.hidden=false;
 card.classList.add('lm-real-expanded');
 readingUntil=Date.now()+45000;
},true);
replay?.addEventListener('click',()=>{
 if(replay.closest('dialog[open]'))replay.closest('dialog').close();
 $('navHome')?.click();
 later(()=>{startPreview()},260);
});
window.SEYVEO_LIVING_MOMENT=Object.freeze({preview:()=>startPreview(),state:()=>mode});
/* A repeatable demonstration is needed for QA on touch PCs and phones.
   Old session and pointer-type restrictions blocked cards after refresh.
   Never store illustrative tasks as real user data. */
let autoDemoShown=false,autoDemoPending=false;
function hasUnfinishedSavedTasks(){
 try{
  const rows=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]');
  return Array.isArray(rows)&&rows.some(item=>item&&item.done!==true&&
   typeof item.title==='string'&&item.title.trim());
 }catch{return false}
}
function requestAutoDemo(){
 if(autoDemoShown||autoDemoPending||mode!=='idle'||!available()||editing()
    ||hadRealWork||hasUnfinishedSavedTasks()
    ||dynamic.querySelector('[data-owner-advice]'))return;
 autoDemoPending=true;
 window.setTimeout(()=>{
  autoDemoPending=false;
  if(autoDemoShown||mode!=='idle'||!available()||editing()
     ||hadRealWork||hasUnfinishedSavedTasks()
     ||dynamic.querySelector('[data-owner-advice]'))return;
  if(startPreview())autoDemoShown=true;
 },1450);
}
/* An explicit, accessible demo action always remains available on an empty Home;
   it does not depend on timers, storage markers or device pointer type. */
demoLaunch?.addEventListener('click',()=>{
 if(!available()||editing()||readOpenTasks().length)return;
 if(mode!=='idle')rest();
 autoDemoShown=true;
 startPreview();
});
document.addEventListener('close',scheduleRefresh,true);
window.addEventListener('seyveo:route-changed',scheduleRefresh);
scheduleRefresh();
})();