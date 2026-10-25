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
const SESSION='seyveo-original-quiet-cinema-restored-v1';
const TIMING=Object.freeze({open:reduced()?0:960,beat:6100,quiet:4800,close:reduced()?0:920});
let mode='idle',key='',quiet=new Set(),timers=[],readingUntil=0;
let ledgerState=null,demoFinished=false,hadRealWork=false,realIntroSeen=false;
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
 space.classList.remove('lm-reveal','lm-condense','lm-disappear','lm-preview','lm-real','lm-ledger-mode');
 space.hidden=true;tiles.replaceChildren();previewScene=null;ledgerState=null;
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
 top.append(label,create('span','lm-field-measure',real?'ВАШИ ДАННЫЕ':'ПРЕДПРОСМОТР'));
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
function buildExamples(){
 previewScene=createSurface(sample[0],sample.slice(1));
}
/* Drawn Decision Ledger · one paper-like sheet, no inset glass cards.
   The original Quiet Cinema animation is retained intact above this layer. */
function readOpenTasks(){
 let data=[];try{data=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]')}catch{}
 if(!Array.isArray(data))return [];
 return data.filter(t=>t&&t.done!==true&&typeof t.id==='string'&&
   typeof t.title==='string'&&t.title.trim())
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
function demoLedgerItems(){
 return sample.map((item,index)=>({id:'illustration-'+index,title:item.title,
   kind:item.kind,body:item.body,reason:item.reason,detail:item.detail,
   demo:true}));
}
function storyFromTask(task){
 const kind=artisticKind(task);
 const demoData=kind==='mail'?sample[1]:kind==='contract'?sample[0]:
  kind==='health'?sample[2]:null;
 return {kind,title:task.title,category:'ВАШЕ ДЕЛО',body:task.due?
  'Срок: '+task.due.split('-').reverse().join('.'):'Сохранено в «Делах».',
  reason:'Это запись из вашего списка дел, а не демонстрация.',
  detail:'Изучите дело и подтвердите его завершение в разделе «Дела».',
  id:task.id,due:task.due,sourceNoteId:task.sourceNoteId,
  ...(demoData?{}:{})};
}
function showLedger(items,{demo=false}={}){
 if(!items.length){if(demo)demoFinished=true;rest();return}
 if(!available()){rest();return}
 cancel();mode='ledger';key=demo?'ledger-demo':'ledger-real';
 tiles.replaceChildren();space.classList.remove('lm-preview','lm-condense','lm-disappear','lm-real');
 space.classList.add('lm-ledger-mode','lm-reveal');space.hidden=false;
 tip.textContent='';dynamic.hidden=true;focus(true);
 const section=create('section','lm-ledger');
 section.setAttribute('aria-label','Ваш центр решений');
 const mast=create('div','lm-ledger-heading');
 const illustration=create('span','lm-ledger-illustration');illustration.append(icon('task'));
 const heads=create('div','lm-ledger-headline');
 heads.append(create('small','lm-ledger-kicker',demo?'СЭЙВА · ДЕМОНСТРАЦИЯ':'СЭЙВА · ВАШИ ДЕЛА'),
  create('h3','lm-ledger-title','Центр решений'));
 const counter=create('span','lm-ledger-counter');
 mast.append(illustration,heads,counter);
 const intro=create('p','lm-ledger-intro','Всё важное собрано в одном месте.');
 const list=create('div','lm-ledger-list');
 list.setAttribute('aria-label','Дела, ожидающие решения');
 const note=create('p','lm-ledger-note');
 const explanation=create('p','lm-ledger-explanation');explanation.hidden=true;
 const actions=create('div','lm-ledger-actions');
 const more=create('button','lm-ledger-action','Подробнее');more.type='button';
 const act=create('button','lm-ledger-action','Исполнить');act.type='button';
 actions.append(more,act);
 const footer=create('small','lm-ledger-footer',
  demo?'Примеры для просмотра · реальные данные не изменяются':
  'Реальные действия требуют вашего подтверждения');
 section.append(mast,intro,list,note,explanation,actions,footer);
 tiles.append(section);
 let queue=items.slice(),activeId=queue[0]?.id,expanded=false,closing=false;
 function current(){return queue.find(t=>t.id===activeId)||queue[0]||null}
 function finish(){
  if(closing)return;
  closing=true;
  if(demo)demoFinished=true;
  section.classList.add('lm-ledger-finished');
  space.classList.add('lm-disappear');
  later(()=>{
   if(mode!=='ledger')return;
   rest();
  },reduced()?0:850);
 }
 function render(){
  if(!queue.length){finish();return}
  const currentItem=current();
  if(!queue.some(t=>t.id===activeId))activeId=currentItem.id;
  counter.textContent=queue.length+' '+(queue.length===1?'дело':queue.length<5?'дела':'дел');
  list.replaceChildren();
  for(const item of queue){
   const row=create('button','lm-ledger-row');
   row.type='button';
   row.setAttribute('aria-pressed',String(item.id===activeId));
   const mark=create('span','lm-ledger-row-art');
   mark.append(icon(item.kind||artisticKind(item)));
   const words=create('span','lm-ledger-row-copy');
   words.append(create('strong','lm-ledger-row-title',item.title),
    create('small','lm-ledger-row-sub',item.body||(
     item.due?'Срок: '+item.due.split('-').reverse().join('.'):'Задача из раздела «Дела»')));
   row.append(mark,words);
   row.addEventListener('click',()=>{
    activeId=item.id;expanded=false;readingUntil=Date.now()+25000;render();
   });
   list.append(row);
  }
  note.textContent='Выбрано: '+currentItem.title;
  explanation.textContent=demo
   ?(currentItem.reason||'Демонстрационный пример.')+' '+(currentItem.detail||'Реальных действий нет.')
   :'Это ваше сохранённое дело. Сэйва поможет разобраться, но фактическое исполнение подтверждается вами в разделе «Дела».';
  explanation.hidden=!expanded;
  more.textContent=expanded?'Свернуть':'Подробнее';
  more.setAttribute('aria-expanded',String(expanded));
  act.textContent=demo?'Исполнить · демо':'Исполнить';
 }
 more.addEventListener('click',()=>{expanded=!expanded;readingUntil=Date.now()+25000;render()});
 act.addEventListener('click',()=>{
  const task=current();if(!task)return;
  readingUntil=Date.now()+30000;
  if(demo){
   queue=queue.filter(item=>item.id!==task.id);
   activeId=queue[0]?.id||null;expanded=false;
   render();return;
  }
  // Actual work is completed in the canonical Tasks screen, not falsely
  // marked as sent or signed by the Home prototype.
  const event=new CustomEvent('seyveo:home-task-open',{detail:{id:task.id}});
  window.dispatchEvent(event);
  $('navTasks')?.click();
 });
 // Swipe selects the next item to review without altering any stored task.
 let beginX=null,beginY=null;
 section.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||e.target.closest('button'))return;
  beginX=e.touches[0].clientX;beginY=e.touches[0].clientY;
 },{passive:true});
 section.addEventListener('touchend',e=>{
  if(beginX===null||!e.changedTouches.length)return;
  const dx=e.changedTouches[0].clientX-beginX,dy=e.changedTouches[0].clientY-beginY;
  beginX=beginY=null;
  if(Math.abs(dx)>75&&Math.abs(dy)<50&&queue.length>1){
   const i=queue.findIndex(t=>t.id===activeId);
   activeId=queue[(i+1)%queue.length].id;expanded=false;render();
  }
 },{passive:true});
 ledgerState={demo,sync(next){
  if(demo)return;
  const previous=queue.map(t=>t.id).join('|');
  const updated=next.map(t=>t.id).join('|');
  if(previous===updated)return;
  queue=next;expanded=false;
  render();
 }};
 render();
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
function startPreview(list=null,{demo=true}={}){
 if(!available()||editing())return false;
 if(mode!=='idle')rest();
 const all=demo?demoLedgerItems():(list||readOpenTasks()).map(storyFromTask);
 if(!all.length)return false;
 if(demo)demoFinished=false;
 else{hadRealWork=true;realIntroSeen=true}
 mode='preview';key=demo?'preview':'preview-real';
 try{sessionStorage.setItem(SESSION,'1')}catch{}
 dynamic.hidden=true;
 const scenes=demo?sample:all.slice(0,3);
 previewScene=createSurface(scenes[0],scenes.slice(1));
 tip.textContent=demo?'QUIET CINEMA · ПРИМЕРЫ ДЛЯ ПРОСМОТРА':'СЭЙВА · ВАШИ ДЕЛА';
 space.hidden=false;space.classList.remove('lm-ledger-mode');
 space.classList.add('lm-preview');
 focus(true);
 later(()=>{if(mode==='preview')space.classList.add('lm-reveal')},TIMING.open);
 // Keep the verified original morph cadence; no second animation layer.
 if(scenes.length>=2)hold(()=>{
  previewScene?.changeFeatured(scenes[1]);
 },TIMING.beat+TIMING.open);
 if(scenes.length>=3)hold(()=>{
  previewScene?.changeFeatured(scenes[2]);
 },TIMING.beat*2+TIMING.open);
 hold(()=>{
  if(mode!=='preview')return;
  shrink();
  later(()=>{
   if(mode!=='preview')return;
   // Exactly the items introduced above flow into ONE illustrated sheet.
   showLedger(demo?demoLedgerItems():readOpenTasks().map(storyFromTask),{demo});
  },reduced()?0:1250);
 },TIMING.beat*Math.min(scenes.length,3)+TIMING.open);
 if(caption)caption.textContent='Quiet Cinema: плавный показ и один нарисованный список решений.';
 return true;
}
function dueTask(){
 let tasks=[];
 try{const data=JSON.parse(localStorage.getItem('seyveo-personal-tasks-v1')||'[]');if(Array.isArray(data))tasks=data}catch{}
 const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 return tasks.filter(t=>t&&t.done!==true&&typeof t.title==='string'&&t.title.trim()
  &&typeof t.due==='string'&&/^\d{4}-\d\d-\d\d$/.test(t.due)&&t.due<=today)
  .sort((a,b)=>a.due.localeCompare(b.due))[0]||null;
}
function showTask(item){
 const callTarget=window.SEYVEO_CONTACTS?.taskTarget?.(item.title)||'';
 const contact=callTarget?window.SEYVEO_CONTACTS?.availability?.(callTarget):null;
 const id='task:'+(item.id||item.title)+'|'+item.due;
 if(quiet.has(id))return false;
 mode='task';key=id;
 dynamic.hidden=true;
 const when=item.due?new Date(item.due+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'';
 createSurface({
  kind:'task',
  title:item.title,
  callTarget,
  body:callTarget
    ?'Срок наступил'+(when?' · '+when:'')+'. Сэйви поможет связаться с человеком.'
    :'Срок наступил'+(when?' · '+when:'')+'. Дело сохранено в вашем списке.',
  category:'ВАШЕ ДЕЛО · ТРЕБУЕТ ВНИМАНИЯ',
  reason:'Вы сами добавили это дело. Сэйви показывает его, потому что наступил срок.',
  detail:callTarget
    ?contact?.matches===1
      ?'Нашла «'+contact.name+'» в «Моём мире». Нажмите «Позвонить» и проверьте номер.'
      :contact?.matches>1
      ?'Есть несколько похожих контактов. Сэйви предложит выбрать нужного.'
      :'Номер не найден. Сэйви поможет выбрать человека или добавить контакт.'
    :'Откройте «Дела», чтобы увидеть детали и завершить поручение.'
 },[],true);
 tip.textContent='НА ОСНОВЕ ВАШИХ ЗАПИСЕЙ · НЕ ПРИМЕР';
 space.hidden=false;space.classList.remove('lm-preview');space.classList.add('lm-real');
 focus(true);
 later(()=>{if(mode==='task')space.classList.add('lm-reveal')},TIMING.open);
 hold(()=>{
  shrink();
  hold(()=>disappear(),6000);
 },12000);
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
function refresh(){
 if(document.hidden||home.hidden||document.documentElement.classList.contains('seyveo-conversation'))return;
 const pending=dynamic.querySelector('[data-owner-advice]');
 const pendingKey=adviceIdentity(pending);
 if(mode==='preview'){if(!dynamic.hidden)dynamic.hidden=true;return}
 if(mode==='ledger'){
  const real=readOpenTasks().map(storyFromTask);
  if(ledgerState?.demo){
   if(real.length){rest();startPreview(real,{demo:false})}
  }else ledgerState?.sync(real);
  return;
 }
 if(mode==='task'){
  if(!dynamic.hidden)dynamic.hidden=true;
  return;
 }
 if(mode==='advice'){
  if(key!==pendingKey){rest();return}
  if(quiet.has(key)&&!dynamic.hidden)dynamic.hidden=true;
  return;
 }
 // Do not resize the sphere beneath a working mobile keyboard.
 if(editing())return;
 const real=readOpenTasks();
 if(real.length){
  hadRealWork=true;
  if(!realIntroSeen){startPreview(real,{demo:false});return}
  showLedger(real.map(storyFromTask),{demo:false});
  return;
 }
 if(pending&&showExistingAdvice())return;
 if(pending&&quiet.has(pendingKey)&&!dynamic.hidden)dynamic.hidden=true;
 if(mode==='idle')focus(false);
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
 later(()=>{startPreview()},260);
});
window.SEYVEO_LIVING_MOMENT=Object.freeze({preview:()=>startPreview(),state:()=>mode});
scheduleRefresh();
// Developer preview is deliberately visible once per tab/session, NOT user data.
// Run after the approved opening logo has had time to appear.
let visited=false;
try{visited=sessionStorage.getItem(SESSION)==='1'}catch{}
if(!visited){
 later(()=>{
  if(document.hidden||home.hidden||document.querySelector('dialog[open]')||mode!=='idle'||hadRealWork||demoFinished)return;
  startPreview();
 },9400);
}
})();