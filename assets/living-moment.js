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
const TIMING=Object.freeze({open:reduced()?0:90,quiet:4800,close:reduced()?0:720});
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
  {id:'demo-1',kind:"contract",title:"Проверить договор аренды",category:"ДОКУМЕНТЫ · ПРИМЕР",
   body:"Срок согласования — завтра.",cause:"Проверьте обязательства и срок действия.",proposal:"Подготовить список вопросов перед согласованием.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-2',kind:"mail",title:"Ответить клиенту",category:"ПОЧТА · ПРИМЕР",
   body:"Запрос клиента ждёт ответа 18 часов.",cause:"Потеря времени может повлиять на общение.",proposal:"Подготовить короткий вежливый ответ на проверку.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-3',kind:"task",title:"Напомнить о встрече",category:"КАЛЕНДАРЬ · ПРИМЕР",
   body:"Завтра созвон в 11:30.",cause:"Перед встречей полезно сверить повестку.",proposal:"Подготовить напоминание и два вопроса.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-4',kind:"task",title:"Проверить рекламные расходы",category:"ФИНАНСЫ · ПРИМЕР",
   body:"Условный бюджет близок к пределу недели.",cause:"Расходы нужно проверить до решения об изменениях.",proposal:"Сравнить каналы и предложить экономию.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-5',kind:"contract",title:"Продлить подписку",category:"СЕРВИСЫ · ПРИМЕР",
   body:"Демо-подписка истекает через два дня.",cause:"Перерыв может остановить нужный сервис.",proposal:"Предложить варианты продления на подтверждение.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-6',kind:"mail",title:"Разобрать входящие обращения",category:"СВЯЗИ · ПРИМЕР",
   body:"В учебном ящике накопились сообщения.",cause:"Срочные обращения легко пропустить.",proposal:"Распределить письма по важности и подготовить ответы.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-7',kind:"task",title:"Проверить публикацию сайта",category:"САЙТ · ПРИМЕР",
   body:"Новость готова и ожидает согласования.",cause:"Лучше проверить текст до публичного размещения.",proposal:"Показать предпросмотр и запросить разрешение.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-8',kind:"health",title:"Сделать короткую паузу",category:"ЗАБОТА · ПРИМЕР",
   body:"Плановая десятиминутная передышка.",cause:"Это напоминание для удобства, не медицинский вывод.",proposal:"Предложить отдых и спокойное возвращение к делам.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-9',kind:"task",title:"Перенести встречу",category:"КАЛЕНДАРЬ · ПРИМЕР",
   body:"В вымышленном расписании пересеклись две встречи.",cause:"Участникам нужно предложить другое время.",proposal:"Подготовить вариант переноса для согласования.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'},
  {id:'demo-10',kind:"task",title:"Сверить дела на сегодня",category:"ПЛАН · ПРИМЕР",
   body:"В демонстрации есть несколько незакрытых пунктов.",cause:"Сначала полезно выбрать наиболее важный.",proposal:"Перестроить очередь дел по приоритетам.",
   reason:'Все сведения вымышлены. Это демонстрация SEYVEO.',
   detail:'Реальных писем, денег, встреч и документов приложение не меняет.'}
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
/* One canonical living decision, with an ordered queue. Intro drawings
   live only inside this surface; they never create a second dock or panel. */
/* Quiet Cinema: ONE card and ONE real queue. A short temporary film rises,
   gathers and is destroyed; it never leaves a duplicate UI behind. */
function createSurface(primary,other=[],real=false){
 tiles.replaceChildren();
 let queue=[primary,...other],shown=primary,completed=0,postponed=0;
 let moving=false,swipeStart=null,tapBlockUntil=0;
 let introStarted=false;
 const field=create('div','lm-field');
 field.dataset.lmMode=real?'real':'preview';
 const scene=create('div','lm-scene');
 const top=create('div','lm-field-top');
 const label=create('span','lm-field-eyebrow');
 const position=create('span','lm-field-measure');
 top.append(label,position);
 const main=create('section','lm-primary');
 const hero=create('div','lm-hero');
 const artwork=create('button','lm-hero-art');
 artwork.type='button';
 artwork.append(icon(primary.kind));
 const copy=create('div','lm-primary-copy');
 const headline=create('strong','lm-primary-title');
 const description=create('p','lm-primary-subtitle');
 copy.append(headline,description);
 hero.append(artwork,copy);
 const controls=create('div','lm-actions');
 const more=create('p','lm-explanation');
 more.id='seyveoSurfaceReason';more.hidden=true;
 const open=polymer('Подробнее',()=>{
  if(moving)return;
  if(discussTask(shown,{demo:!real}))return;
  more.textContent=shown.reason+' '+shown.detail;more.hidden=false;
  open.setAttribute('aria-expanded','true');
 },'quiet');
 const execute=polymer('Исполнить',()=>finishCurrent(),'main');
 const laterButton=polymer('Позже',()=>deferCurrent(1),'quiet');
 open.setAttribute('aria-controls',more.id);
 open.setAttribute('aria-expanded','false');
 controls.append(open,execute,laterButton);
 main.append(hero,controls);
 const secondary=create('div','lm-secondary');
 function refreshView(showOpening=false){
  if(!queue.length)return;
  shown=queue[0];
  field.dataset.lmSubject=shown.kind;
  artwork.className='lm-hero-art lm-hero-art--'+shown.kind;
  artwork.replaceChildren(icon(shown.kind));
  artwork.setAttribute('aria-label','Открыть: '+shown.title);
  label.textContent=shown.category;
  position.textContent=(real?'ВАШИ ДАННЫЕ':'ДЕМО · ВЫМЫШЛЕННЫЕ ДАННЫЕ')+
   ' · '+String(completed+1).padStart(2,'0')+' / '+String(completed+queue.length).padStart(2,'0');
  headline.textContent=shown.title;
  description.textContent=shown.body;
  open.setAttribute('aria-label','Подробнее: '+shown.title);
  open.setAttribute('aria-expanded','false');
  execute.setAttribute('aria-label',(real?'Отметить дело выполненным: ':'Исполнить учебное дело: ')+shown.title);
  execute.textContent=real?'Завершить дело':'Исполнить';
  more.hidden=true;more.textContent='';
  secondary.replaceChildren();
  // Original illustrated rows are ALSO the opening cinematic subjects.
  // Never create or overlay a second set of glass cards.
  const limit=showOpening?Math.min(queue.length-1,window.innerHeight<=710?2:3):
    window.innerHeight<=860?1:2;
  const upcoming=queue.slice(1);
  for(const item of upcoming.slice(0,limit)){
   const row=create('button','lm-inline-item');
   row.type='button';row.dataset.lmKind=item.kind;
   row.setAttribute('aria-label','Следующее дело: '+item.title);
   const mark=create('span','lm-inline-art');mark.append(icon(item.kind));
   const words=create('span','lm-inline-copy');
   words.append(create('span','lm-inline-title',item.title));
   row.append(mark,words);
   row.addEventListener('click',()=>deferCurrent(1));
   secondary.append(row);
  }
  laterButton.hidden=queue.length<2;
  if(!queue.length)laterButton.hidden=true;
 }
 function changeFeatured(item){
  if(moving||!queue.some(q=>q.id===item.id))return;
  if(item.id===shown.id)return;
  const n=queue.findIndex(q=>q.id===item.id);
  const moved=queue.splice(0,n);
  queue.push(...moved);
  refreshView();
 }
 artwork.addEventListener('click',()=>{
  if(!moving){readingUntil=Date.now()+18000;openCardAction(shown)}
 });
 /* A swipe only moves a task to the END of the queue; it never completes it.
    Pointer events work with touch and mouse, and the vertical gesture stays free. */
 field.addEventListener('pointerdown',event=>{
  if(moving||event.button!==0)return;
  swipeStart={x:event.clientX,y:event.clientY,id:event.pointerId};
 },{passive:true});
 field.addEventListener('pointercancel',()=>{swipeStart=null});
 field.addEventListener('pointerup',event=>{
  const start=swipeStart;swipeStart=null;
  if(!start||start.id!==event.pointerId||moving)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(Math.abs(dx)<62||Math.abs(dx)<Math.abs(dy)*1.45)return;
  tapBlockUntil=Date.now()+600;
  deferCurrent(Math.sign(dx));
 },{passive:true});
 field.addEventListener('click',event=>{
  if(Date.now()>tapBlockUntil)return;
  event.preventDefault();event.stopImmediatePropagation();
 },true);
 function notify(message){
  // The progress line already occupies space; status never stretches Home
  // or pushes the original card into the bottom dock.
  position.textContent=message;
  position.setAttribute('role','status');
  position.setAttribute('aria-live','polite');
 }
 function finishScene(){
  moving=false;
  if(!queue.length){
   field.classList.add('lm-finished');
   label.textContent=real?'ВАШИ ДЕЛА':'ДЕМОНСТРАЦИЯ';
   position.textContent=completed+' / '+completed;
   headline.textContent=real?(postponed?'Дело отложено до завтра':'Все дела завершены'):
    'Все учебные дела выполнены';
   description.textContent=real?(postponed?
    'Задача осталась сохранённой и вернётся завтра.':
    'Список дел обновлён. Внешние действия не выполнялись.'):
    'Это был пример работы Сэйви. Ни одно реальное действие не совершено.';
   artwork.replaceChildren(icon('task'));
   controls.hidden=true;secondary.hidden=true;
   mode='complete';key=real?'real-complete':'demo-complete';
   if(!real&&demoLaunch){
    demoLaunch.textContent='Повторить кинематографический показ';
    demoLaunch.hidden=false;
   }
   return;
  }
  refreshView();
 }
 function transition(kind,direction=1){
  if(moving||!queue.length)return;
  moving=true;readingUntil=Date.now()+1600;
  scene.style.setProperty('--lm-exit-x',((kind==='defer'?(direction<0?-1:1):1)*Math.min(window.innerWidth*.76,340))+'px');
  scene.classList.add('lm-swipe-out');
  const delay=reduced()?0:350;
  later(()=>{
   let outcome='';
   if(!tiles.contains(field))return;
   if(kind==='defer'){
    if(real&&queue.length===1){
     // A single remaining personal task can genuinely wait until tomorrow.
     const postponedItem=queue[0];
     const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
     try{
      const saved=deferredTasks();
      saved[postponedItem.id]=localDay(tomorrow);
      localStorage.setItem(DEFERRED_KEY,JSON.stringify(saved));
      queue.shift();postponed++;
     }catch{
      notify('Не удалось сохранить отсрочку. Дело осталось в очереди.');
      scene.classList.remove('lm-swipe-out');moving=false;return;
     }
    }else if(queue.length>1)queue.push(queue.shift());
    if(real){
     // Only the display order changes; saved personal tasks remain intact.
     try{localStorage.setItem('seyveo-home-task-order-v1',
       JSON.stringify(queue.map(task=>task.id)))}catch{}
    }
    outcome='Позже · дело в очереди';
   }else{
    const completedItem=queue.shift();
    if(real&&completedItem?.id){
     // The explicit tap marks ONLY the saved personal to-do as completed.
     // No message, payment, contract or external operation is performed.
     try{
      const key='seyveo-personal-tasks-v1';
      const tasks=JSON.parse(localStorage.getItem(key)||'[]');
      if(!Array.isArray(tasks))throw Error('Invalid task list');
      const task=tasks.find(t=>t&&t.id===completedItem.id);
      if(!task)throw Error('Missing task');
      task.done=true;task.doneAt=new Date().toISOString();
      localStorage.setItem(key,JSON.stringify(tasks));
     }catch{
      queue.unshift(completedItem);
      notify('Не удалось сохранить выполнение. Дело осталось в очереди.');
      scene.classList.remove('lm-swipe-out');
      moving=false;return;
     }
    }
    completed++;
    outcome=real?'Дело завершено · только в списке':
     'Демо выполнено · реальных действий нет';
   }
   scene.classList.remove('lm-swipe-out');
   scene.classList.add('lm-swipe-in');
   finishScene();
   notify(outcome);
   later(()=>{
    scene.classList.remove('lm-swipe-in');
    if(real){
     const tasks=readOpenTasks();
     realSignature=tasks.map(t=>[t.id,t.title,t.due||''].join(':')).join('|');
     window.dispatchEvent(new CustomEvent('seyveo:tasks-changed',
      {detail:{open:tasks.length}}));
    }
   },reduced()?0:390);
  },delay);
 }
 function deferCurrent(direction=1){transition('defer',direction)}
 function finishCurrent(){transition('finish',1)}
 function playIntro(){
  if(introStarted||!queue.length||!tiles.contains(field))return;
  introStarted=true;
  if(reduced()||queue.length<2)return;
  // Animate the ORIGINAL illustrated task rows, in normal document flow.
  // Nothing is superimposed over the decision card.
  refreshView(true);
  field.classList.add('lm-cinema-enter');
  later(()=>{
   if(!tiles.contains(field))return;
   field.classList.remove('lm-cinema-enter');
   field.classList.add('lm-cinema-gather');
   later(()=>{
    if(!tiles.contains(field))return;
    field.classList.remove('lm-cinema-gather');
    refreshView();
    notify(queue.length+' дел · свайпните в сторону, чтобы отложить');
   },reduced()?0:700);
  },reduced()?0:1950);
 }
 field.dataset.lmSubject=primary.kind;
 refreshView();
 scene.append(top,main,secondary,more);
 field.append(scene);
 tiles.append(field);
 return {field,changeFeatured,playIntro};
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
 const tasks=data.filter(t=>t&&t.done!==true&&typeof t.id==='string'&&
   typeof t.title==='string'&&t.title.trim()&&!(deferred[t.id]>today))
  .map(t=>({id:t.id,title:t.title.trim().slice(0,140),
   due:typeof t.due==='string'?t.due:'',sourceNoteId:t.sourceNoteId||''}))
  .sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31'));
 // A postponed item keeps its place after navigation or PWA relaunch.
 // This key stores IDs only, never copies the user's task content.
 let order=[];
 try{
  const saved=JSON.parse(localStorage.getItem('seyveo-home-task-order-v1')||'[]');
  if(Array.isArray(saved))order=saved.filter(id=>typeof id==='string').slice(0,150);
 }catch{}
 if(order.length){
  const positions=new Map(order.map((id,i)=>[id,i]));
  tasks.sort((a,b)=>(positions.get(a.id)??9999)-(positions.get(b.id)??9999));
 }
 return tasks;
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
 const scenes=all;
 previewScene=createSurface(scenes[0],scenes.slice(1),!demo);
 tip.textContent='';
 space.hidden=false;
 space.classList.add('lm-preview');
 focus(true);
 later(()=>{if(mode==='preview')space.classList.add('lm-reveal')},TIMING.open);
 // Original procession: rise, gather, and remain ONE decision.
 later(()=>{if(mode==='preview')previewScene?.playIntro()},TIMING.open);
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
 later(()=>{if(mode==='real'){space.classList.add('lm-reveal');previewScene?.playIntro()}},TIMING.open);
 return true;
}
function refresh(){
 if(mode==='complete'){
  if(demoLaunch)demoLaunch.hidden=key!=='demo-complete';
  return;
 }
 if(demoLaunch)demoLaunch.hidden=true;
 if(document.hidden||home.hidden||document.documentElement.classList.contains('seyveo-conversation'))return;
 const pending=dynamic.querySelector('[data-owner-advice]');
 const pendingKey=adviceIdentity(pending);
 const realTasks=readOpenTasks();
 const nextSignature=realTasks.map(t=>[t.id,t.title,t.due||''].join(':')).join('|');
 if(mode==='preview'){
  if(key!=='preview'&&realTasks.length){rest();showRealWork(realTasks);return}
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
 if(!available()||editing()||(mode!=='complete'&&readOpenTasks().length))return;
 if(mode!=='idle')rest();
 autoDemoShown=true;
 startPreview();
});
document.addEventListener('close',scheduleRefresh,true);
window.addEventListener('seyveo:route-changed',scheduleRefresh);
scheduleRefresh();
})();