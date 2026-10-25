/* SEYVEO Signature · Living Objects & Decisions v5
 * One living plane, sculpted editorial symbols and restrained kinetic rhythm.
 * Never writes fictional tasks, messages or business data. The approved
 * plasma, its effects, bottom dock and input controller remain untouched. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('homePage'),dynamic=$('dynamic'),space=$('seyveoLivingMoment');
const tiles=$('seyveoLivingTiles'),tip=$('seyveoLivingCaption');
const replay=$('openLivingMomentPreview'),caption=$('livingMomentPreviewStatus');
if(!home||!dynamic||!space||!tiles)return;
const MOTION=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const reduced=()=>!!MOTION?.matches;
const SESSION='seyveo-living-objects-demo-v5'; // Only deliberate manual preview.
const TIMING=Object.freeze({open:reduced()?0:960,beat:6100,quiet:4800,close:reduced()?0:920});
let mode='idle',key='',quiet=new Set(),timers=[],readingUntil=0;
let pendingUpdate=false;
function later(callback,ms){
 const id=window.setTimeout(callback,ms);
 timers.push(id);return id;
}
function cancel(){for(const id of timers)clearTimeout(id);timers=[]}
function available(){return !home.hidden&&!document.hidden&&!location.hash&&!document.documentElement.classList.contains('seyveo-conversation')&&!(document.querySelector('dialog[open]'))}
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
 space.classList.remove('lm-reveal','lm-condense','lm-disappear','lm-preview','lm-real','lm-next-mode');
 space.hidden=true;tiles.replaceChildren();previewScene=null;
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
 {kind:'contract',title:'Проверить документ',category:'ВАЖНОЕ',body:'Есть договор, который нужно посмотреть.',
  reason:'Это вымышленный договор для предпросмотра. Настоящий появляется только из ваших документов или разрешённого источника.',
  detail:'В рабочем режиме Сэйви поможет проверить договор, но ничего не подпишет без вашего подтверждения.'},
 {kind:'mail',title:'Почта',category:'СООБЩЕНИЯ',body:'Есть письмо, которому нужен ответ.',
  reason:'Почта не подключена, настоящих писем Сэйви пока не читала.',
  detail:'После разрешённого подключения почты Сэйви сможет помогать готовить черновики ответов.'},
 {kind:'health',title:'Пора передохнуть',category:'ЗАБОТА',body:'Две спокойные минуты для себя.',
  reason:'Учебный пример заботы о себе, не основан на данных Apple Health или медицинских измерениях.',
  detail:'Можно сделать короткую передышку. Это демонстрация будущей персональной заботы, а не медицинский совет.'}
];
/* Navigate through one continuous Sayvi space. No unrelated page or duplicate sphere. */
function openDestination(kind){
 if(kind==='task'){$('navTasks')?.click();return true}
 return window.SEYVEO_SAYVI_SURFACES?.open?.(kind)===true;
}
function openCardAction(item){
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
 top.append(label,create('span','lm-field-measure',real?'ВАШИ ДАННЫЕ':'ДЕМО'));
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
 // One visible action at a time. "Исполнить" is NEVER offered for real
 // external operations until the service exposes a working executor.
 const defer=polymer('Позже',()=>closeEarly());
 defer.hidden=true;
 const open=polymer(real&&primary.callTarget?'Позвонить':'Подробнее',()=>{
  if(real&&shown.callTarget){
   openCardAction(shown);
   return;
  }
  if(!expanded){
   expanded=true;
   field.classList.add('lm-has-reason');
   more.hidden=false;
   more.textContent=shown.reason+' '+shown.detail;
   controls.classList.add('lm-actions--details');
   open.textContent=real?'К делу':shown.kind==='mail'?'Открыть почту':shown.kind==='health'?'Мои показатели':'К документам';
   open.setAttribute('aria-label','Открыть: '+shown.title);
   open.setAttribute('aria-expanded','true');
   defer.hidden=false;
   return;
  }
  openCardAction(shown);
 },'main');
 open.setAttribute('aria-controls',more.id);
 open.setAttribute('aria-expanded','false');
 open.setAttribute('aria-label',real&&shown.callTarget?'Подготовить звонок: '+shown.callTarget:'Подробнее: '+shown.title);
 if(real&&shown.callTarget)defer.hidden=false;
 controls.append(open,defer);
 main.append(hero,controls);
 const secondary=create('div','lm-secondary');
 function renderSecondary(){
  secondary.replaceChildren();
  if(real)return;
  for(const item of [primary,...other].filter(value=>value!==shown)){
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
    openDestination(item.kind);
   });
   secondary.append(row);
  }
 }
 function changeFeatured(item){
  if(real||item===shown||morphLocked||space.classList.contains('lm-condense'))return;
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
   headline.textContent=item.title;
   description.textContent=item.body;
   expanded=false;
   field.classList.remove('lm-has-reason');
   more.hidden=true;
   more.textContent='';
   controls.classList.remove('lm-actions--details','lm-actions--complete');
   open.hidden=false;open.textContent='Подробнее';
   open.setAttribute('aria-expanded','false');
   open.setAttribute('aria-label','Подробнее: '+item.title);
   defer.hidden=true;defer.textContent='Позже';
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
function buildExamples(){
 previewScene=createSurface(sample[0],sample.slice(1));
}
function shrink(){
 if(mode==='idle')return;
 space.classList.add('lm-condense');
 const reason=tiles.querySelector('.lm-explanation');
 if(reason)reason.hidden=true;
 const field=tiles.querySelector('.lm-field');
 if(field)field.classList.remove('lm-has-reason');
 tip.textContent=mode==='task'?'СОХРАНЕНО В «ДЕЛАХ»':
  'ПРИМЕР · ВАЖНОЕ СОХРАНЯЕТСЯ';
}
function disappear(){
 if(mode==='idle')return;
 if(mode==='advice'){
  quiet.add(key);dynamic.classList.add('lm-real-out');
  later(()=>{if(mode==='advice'){dynamic.hidden=true;rest()}},TIMING.close);
  return;
 }
 if(mode==='task')quiet.add(key);
 space.classList.add('lm-disappear');
 later(()=>{if(mode==='preview'||mode==='task')rest()},TIMING.close);
}
function closeEarly(){
 if(mode==='idle')return;
 cancel();
 if(mode==='task'||mode==='advice')quiet.add(key);
 space.classList.add('lm-condense','lm-disappear');
 later(()=>rest(),TIMING.close);
}
function hold(callback,delay){
 const check=()=>{
  if(mode==='idle'||!available()){if(!available())return rest();return}
  if(engaged()){later(check,1800);return}
  callback();
 };
 later(check,delay);
}
function startPreview(){
 if(!available()||editing())return false;
 if(mode!=='idle')rest();
 mode='preview';key='preview';
 try{sessionStorage.setItem(SESSION,'1')}catch{}
 dynamic.hidden=true;
 buildExamples();
 tip.textContent='ВОЗМОЖНОСТИ СЭЙВЫ · ДЕМО';
 space.hidden=false;space.classList.add('lm-preview');
 focus(true);
 later(()=>{if(mode==='preview')space.classList.add('lm-reveal')},TIMING.open);
 hold(()=>{
  previewScene?.changeFeatured(sample[1]);
  hold(()=>{
   previewScene?.changeFeatured(sample[2]);
   hold(()=>{
    shrink();
    hold(()=>disappear(),TIMING.quiet);
   },TIMING.beat);
  },TIMING.beat);
 },TIMING.beat+TIMING.open);
 if(caption)caption.textContent='Демонстрация трёх примеров без изменения личных данных.';
 return true;
}

/* All open tasks live in the existing Tasks store. This surface only reads
 * their metadata; writing status is delegated to Personal Tasks. */
let collectionPage=0,collectionOpen=false;
let collectionDemo=false,collectionAnimationSeen=false;
const GATHER_SESSION='seyveo-cinematic-collection-v1';
try{collectionAnimationSeen=sessionStorage.getItem(GATHER_SESSION)==='1'}catch{}
function openTasks(){
 const tasks=readLocal('seyveo-personal-tasks-v1');
 if(!Array.isArray(tasks))return [];
 return tasks.filter(task=>
  task&&typeof task.id==='string'&&task.id.length<=160&&
  typeof task.title==='string'&&task.title.trim()&&task.done!==true
 ).sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31')||
   String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
}
function demoTasks(){
 return [
  {id:'demo-mail',title:'Ответить клиенту',due:'',demoDescription:'Сэйва покажет обращение клиента и подготовит ответ для согласования.'},
  {id:'demo-document',title:'Проверить документ',due:'',demoDescription:'Сэйва выделит важные пункты договора и попросит подтвердить решение.'},
  {id:'demo-call',title:'Позвонить по заказу',due:'',demoDescription:'Сэйва предложит контакт и передаст вызов в системный Телефон для подтверждения.'}
 ];
}
function tasksSignature(tasks){
 return 'collection:'+tasks.map(item=>item.id+'|'+(item.due||'')+'|'+item.title).join('\u001e');
}
function deadlineLabel(task){
 if(typeof task.due!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(task.due))return 'Без даты';
 const [year,month,day]=task.due.split('-').map(Number);
 const date=new Date(year,month-1,day);
 if(date.getFullYear()!==year||date.getMonth()+1!==month||date.getDate()!==day)return 'Без даты';
 const now=new Date();
 const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const short=date.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
 if(task.due<today)return 'Срок прошёл · '+short;
 if(task.due===today)return 'Сегодня';
 return 'До '+short;
}
function activateTask(task){
 // An "execute" button opens the available, real action. It never falsely
 // declares a phone call, payment or arbitrary human task completed.
 const target=window.SEYVEO_CONTACTS?.taskTarget?.(task.title)||'';
 if(target&&window.SEYVEO_CONTACTS?.requestCall){
  window.SEYVEO_CONTACTS.requestCall(target);return;
 }
 $('navTasks')?.click();
 window.dispatchEvent(new CustomEvent('seyveo:calendar-task-view',{detail:{id:task.id}}));
}
function completeTask(task,feedback){
 // Only an explicit tap on "Отметить выполненным" may change status.
 const detail={id:task.id,result:null};
 window.dispatchEvent(new CustomEvent('seyveo:home-task-complete',{detail}));
 if(!detail.result?.ok&&feedback)feedback.textContent=detail.result?.message||'Не удалось завершить дело.';
}
function showCollection(tasks,{demo=false,animate=false}={}){
 if(!tasks.length)return false;
 collectionDemo=demo;
 mode='collection';key=(demo?'demo:':'real:')+tasksSignature(tasks);
 space.classList.remove('lm-preview','lm-real','lm-next-mode','lm-condense','lm-disappear','lm-collection-mode');
 space.classList.add('lm-collection-mode','lm-reveal');
 space.hidden=false;
 // Business advice may coexist, but it is not counted as a personal task.
 dynamic.hidden=!dynamic.querySelector('[data-owner-advice]');
 tip.textContent='';
 tiles.replaceChildren();
 const details=create('details','lm-task-collection');
 details.open=collectionOpen;
 if(demo)details.dataset.demo='true';
 // The scene uses real titles or clearly labelled demo titles, never fake activity.
 const runCinematic=animate&&!reduced();
 if(runCinematic){
  const stage=create('div','lm-gather-stage');
  stage.setAttribute('aria-hidden','true');
  tasks.slice(0,3).forEach((task,index)=>{
   const card=create('div','lm-gather-card');
   card.style.setProperty('--gather-index',String(index));
   card.append(create('span','lm-gather-kicker','СЭЙВА · '+(demo?'ДЕМО':'ДЕЛО')),
    create('strong','lm-gather-title',task.title));
   stage.append(card);
  });
  tiles.append(stage);
  // Remove decorative animation layer after it has joined the stable stack.
  stage.addEventListener('animationend',event=>{if(event.target===stage)stage.remove()},{once:true});
 }
 const summary=create('summary','lm-task-summary');
 const count=create('span','lm-task-count',String(tasks.length));
 const header=create('span','lm-task-heading');
 header.append(create('strong','lm-task-title','Центр решений'),
  create('small','lm-task-caption',demo?'Демонстрация возможностей · без сохранения':
   tasks.length===1?'Одно дело требует вашего внимания':'Дела собраны в одной стопке'));
 const total=create('span','lm-task-total',tasks.length+' '+(tasks.length%10===1&&tasks.length%100!==11?'дело':
  [2,3,4].includes(tasks.length%10)&&!(tasks.length%100>=12&&tasks.length%100<=14)?'дела':'дел'));
 summary.append(count,header,total);
 const body=create('div','lm-task-body');
 const position=create('p','lm-task-position');
 const name=create('h3','lm-task-current-title');
 const when=create('p','lm-task-when');
 const desc=create('p','lm-task-explanation');
 const buttons=create('div','lm-task-actions');
 const act=create('button','lm-task-execute',demo?'Исполнить · демо':'Исполнить');act.type='button';
 const done=create('button','lm-task-complete',demo?'Следующий пример':'Отметить выполненным');done.type='button';
 buttons.append(act,done);
 const paging=create('div','lm-task-paging');
 const prev=create('button','lm-task-prev','Предыдущее');prev.type='button';
 const next=create('button','lm-task-next','Следующее');next.type='button';
 paging.append(prev,next);
 const feedback=create('p','lm-task-feedback');feedback.setAttribute('role','status');
 feedback.setAttribute('aria-live','polite');
 body.append(position,name,when,desc,buttons,paging,feedback);
 function renderPage(){
  if(collectionPage>=tasks.length)collectionPage=tasks.length-1;
  if(collectionPage<0)collectionPage=0;
  const task=tasks[collectionPage];
  position.textContent=(collectionPage+1)+' из '+tasks.length;
  name.textContent=task.title;
  when.textContent=demo?'Пример для просмотра':deadlineLabel(task);
  const target=demo?'':(window.SEYVEO_CONTACTS?.taskTarget?.(task.title)||'');
  desc.textContent=demo?task.demoDescription+' Реальных подключений и действий здесь нет.':target
   ?'Если контакт найден, Сэйва поможет подготовить звонок. Сам вызов подтверждается в телефоне; дело не отмечается выполненным автоматически.'
   :task.sourceNoteId
   ?'Вы сохранили это дело из Блокнота. Откройте его для действий и отметьте выполненным только после результата.'
   :'Это дело сохранено вами. Нажмите «Исполнить», чтобы открыть его, и подтвердите завершение после выполнения.';
  prev.disabled=collectionPage===0;next.disabled=collectionPage===tasks.length-1;
  feedback.textContent='';
  act.onclick=()=>{
   if(demo){feedback.textContent='Демо: показано действие. Личные данные и настоящие сервисы не затронуты.';return}
   activateTask(task);
  };
  done.onclick=()=>{
   if(demo){collectionPage=(collectionPage+1)%tasks.length;renderPage();return}
   completeTask(task,feedback);
  };
 }
 prev.addEventListener('click',()=>{collectionPage--;renderPage()});
 next.addEventListener('click',()=>{collectionPage++;renderPage()});
 renderPage();
 if(demo){
  const replayButton=create('button','lm-task-replay','Повторить появление');replayButton.type='button';
  replayButton.addEventListener('click',()=>{
   collectionPage=0;collectionOpen=false;cancel();resetSpace();mode='idle';key='';
   showCollection(demoTasks(),{demo:true,animate:true});
  });
  body.append(replayButton);
 }
 details.append(summary,body);
 details.addEventListener('toggle',()=>{
  collectionOpen=details.open;
  focus(details.open);
 });
 tiles.append(details);
 focus(collectionOpen);
 if(runCinematic){
  collectionAnimationSeen=true;
  try{sessionStorage.setItem(GATHER_SESSION,'1')}catch{}
 }
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
 // Real recommendations stay until their originating data changes.
 return true;
}
/* ONE next step based on local truth; no fabricated stats or connected accounts.
 * No separate card framework, navigation shell or unapproved background work. */
function readLocal(key){
 try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'?value:null}
 catch{return null}
}
function soonTask(){
 const tasks=readLocal('seyveo-personal-tasks-v1');
 if(!Array.isArray(tasks))return null;
 const now=new Date();
 const iso=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 const today=iso(now);
 const horizon=new Date(now.getFullYear(),now.getMonth(),now.getDate()+7);
 const week=iso(horizon);
 return tasks.filter(item=>
  item&&item.done!==true&&typeof item.title==='string'&&item.title.trim()
  &&typeof item.due==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.due)
  &&item.due>today&&item.due<=week
 ).sort((a,b)=>a.due.localeCompare(b.due))[0]||null;
}
function nextIntent(){
 const upcoming=soonTask();
 if(upcoming){
  const date=new Date(upcoming.due+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
  return {id:'upcoming:'+(upcoming.id||upcoming.title)+'|'+upcoming.due,
   eyebrow:'СЭЙВА · СКОРО',
   title:upcoming.title,
   line:'Ближайший срок — '+date+'. Дело уже сохранено в вашем списке.',
   action:'Посмотреть дело',target:'tasks'};
 }
 const profile=readLocal('seyveo-first-acquaintance-v1');
 if(profile?.focus==='life')return {
  id:'life',eyebrow:'СЭЙВА · ВАШ ДЕНЬ',
  title:'Начнём с того, что важно вам',
  line:'Добавьте дело со сроком — я смогу напомнить о нём.',
  action:'Открыть дела',target:'tasks'
 };
 const map=readLocal('seyveo-business-map-v1');
 if(map?.version!==1||typeof map.description!=='string'||!map.description.trim())return{
  id:'map',eyebrow:'СЭЙВА · ПЕРВЫЙ ШАГ',
  title:'Расскажите о своём деле',
  line:'Пара деталей о работе поможет мне предлагать более уместные действия.',
  action:'Начать знакомство',target:'business'
 };
 return {
  id:'connections',eyebrow:'СЭЙВА · ВОЗМОЖНОСТИ',
  title:'Добавим полезные источники',
  line:'С разрешённым доступом смогу помогать с письмами, заявками и отзывами. Пока сервисы не подключены.',
  action:'Подключения',target:'connections'
 };
}
function openNext(target){
 if(target==='tasks'){$('navTasks')?.click();return}
 if(target==='business'){$('openBusinessMap')?.click();return}
 if(target==='connections')$('openManageConnections')?.click();
}
function showNext(intent){
 if(!available()||editing())return false;
 mode='next';key='next:'+intent.id;
 tiles.replaceChildren();
 const section=create('section','lm-next');
 section.append(
  create('p','lm-next-kicker',intent.eyebrow),
  create('strong','lm-next-title',intent.title),
  create('p','lm-next-description',intent.line)
 );
 const action=create('button','lm-next-action',intent.action);action.type='button';
 action.addEventListener('click',()=>{readingUntil=Date.now()+15000;openNext(intent.target)});
 section.append(action);
 tiles.append(section);
 tip.textContent='';
 space.hidden=false;space.classList.add('lm-next-mode','lm-reveal');
 focus(false);
 return true;
}
function refresh(){
 if(document.hidden||home.hidden||document.documentElement.classList.contains('seyveo-conversation'))return;
 const pending=dynamic.querySelector('[data-owner-advice]');
 const pendingKey=adviceIdentity(pending);
 if(mode==='preview'){if(!dynamic.hidden)dynamic.hidden=true;return}
 const tasks=openTasks();
 if(mode==='collection'){
  if(collectionDemo){
   // Any actual work replaces the demo automatically.
   if(tasks.length||pending){
    collectionOpen=false;collectionPage=0;resetSpace();
    mode='idle';key='';collectionDemo=false;scheduleRefresh();
   }
   return;
  }
  if(!tasks.length||key!=='real:'+tasksSignature(tasks)){
   collectionOpen=!!tiles.querySelector('.lm-task-collection[open]');
   resetSpace();mode='idle';key='';
   if(editing())return;
   if(tasks.length){showCollection(tasks);return}
   scheduleRefresh();return;
  }
  return;
 }
 if(mode==='advice'){
  if(key!==pendingKey){rest();return}
  return;
 }
 if(mode==='next'){
  if(tasks.length||pending){rest();return}
  const intent=nextIntent();
  if(key!=='next:'+intent.id){rest();return}
  return;
 }
 if(editing())return;
 if(tasks.length&&showCollection(tasks,{animate:!collectionAnimationSeen}))return;
 if(pending&&showExistingAdvice())return;
 if(mode==='idle'&&!pending)showCollection(demoTasks(),{demo:true,animate:!collectionAnimationSeen});
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
window.addEventListener('seyveo:profile-changed',scheduleRefresh);
window.addEventListener('storage',event=>{
 if(['seyveo-first-acquaintance-v1','seyveo-business-map-v1','seyveo-personal-tasks-v1'].includes(event.key))scheduleRefresh();
});
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',scheduleRefresh));
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
window.addEventListener('pagehide',()=>{cancel();resetSpace();focus(false)});
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
 later(()=>{
  collectionPage=0;collectionOpen=false;cancel();resetSpace();mode='idle';key='';
  showCollection(demoTasks(),{demo:true,animate:true});
 },260);
});
window.SEYVEO_LIVING_MOMENT=Object.freeze({
 preview:()=>{collectionPage=0;collectionOpen=false;cancel();resetSpace();mode='idle';key='';return showCollection(demoTasks(),{demo:true,animate:true})},
 state:()=>mode
});
scheduleRefresh();
// Real tasks take precedence; otherwise the PWA demonstrates the same
// cinematic collection with clearly marked fictional content.
})();