/* SEYVEO Signature · Living Surface · Atelier v2.1
 * One living plane, sculpted editorial symbols and restrained kinetic rhythm.
 * Never writes fictional tasks, messages or business data. The approved
 * plasma, its effects, bottom dock and input controller remain untouched. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('homePage'),stage=$('stage'),dynamic=$('dynamic'),space=$('seyveoLivingMoment');
const tiles=$('seyveoLivingTiles'),tip=$('seyveoLivingCaption');
const replay=$('openLivingMomentPreview'),caption=$('livingMomentPreviewStatus');
if(!home||!stage||!dynamic||!space||!tiles)return;
const MOTION=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const reduced=()=>!!MOTION?.matches;
const SESSION='seyveo-living-surface-atelier-v21';
const TIMING=Object.freeze({open:reduced()?0:800,beat:reduced()?0:5150,quiet:reduced()?0:4200,close:reduced()?0:790});
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
 space.classList.remove('lm-reveal','lm-condense','lm-disappear','lm-preview','lm-real');
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
 {kind:'contract',title:'Проверить договор',category:'ВАЖНОЕ',body:'Документ ожидает вашего решения.',
  reason:'Это вымышленный договор для предпросмотра. Настоящий появляется только из ваших документов или разрешённого источника.',
  detail:'В рабочем режиме Сэйви поможет проверить договор, но ничего не подпишет без вашего подтверждения.'},
 {kind:'mail',title:'Почта',category:'СООБЩЕНИЯ',body:'Ответить на письма',
  reason:'Почта не подключена, настоящих писем Сэйви пока не читала.',
  detail:'После разрешённого подключения почты Сэйви сможет помогать готовить черновики ответов.'},
 {kind:'health',title:'Время позаботиться о себе',category:'ЗДОРОВЬЕ',body:'Небольшая пауза для себя.',
  reason:'Учебный пример заботы о себе, не основан на данных Apple Health или медицинских измерениях.',
  detail:'Можно сделать короткую передышку. Это демонстрация будущей персональной заботы, а не медицинский совет.'}
];
function polymer(label,callback,kind='quiet'){
 const b=create('button','lm-polymer lm-polymer--'+kind,label);
 b.type='button';b.addEventListener('click',event=>{event.stopPropagation();readingUntil=Date.now()+15000;callback(b)});
 return b;
}
function explain(field,message,button){
 const panel=field.querySelector('.lm-explanation');
 if(!panel)return;
 const collapse=!panel.hidden&&panel.textContent===message;
 panel.textContent=message;panel.hidden=collapse;
 field.classList.toggle('lm-has-reason',!collapse);
 if(button)button.setAttribute('aria-expanded',String(!collapse));
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
 const artwork=create('div','lm-hero-art lm-hero-art--'+primary.kind);
 artwork.append(icon(primary.kind));
 const copy=create('div','lm-primary-copy');
 const headline=create('strong','lm-primary-title',primary.title);
 const description=create('p','lm-primary-subtitle',primary.body);
 copy.append(headline,description);
 hero.append(artwork,copy);
 const controls=create('div','lm-actions');
 let shown=primary;
 let morphLocked=false;
 const open=polymer('Открыть',()=>{
  if(real){$('navTasks')?.click();return}
  explain(field,shown.detail,open);
 },'main');
 const laterButton=polymer('Позже',()=>closeEarly());
 const why=polymer('Почему',()=>explain(field,shown.reason,why));
 why.setAttribute('aria-expanded','false');
 controls.append(open,laterButton,why);
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
   const arrow=create('span','lm-inline-arrow','↗');
   arrow.setAttribute('aria-hidden','true');
   row.append(mark,words,arrow);
   row.addEventListener('click',()=>{
    readingUntil=Date.now()+12000;
    changeFeatured(item);
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
   label.textContent=item.category;
   headline.textContent=item.title;
   description.textContent=item.body;
   const reason=field.querySelector('.lm-explanation');
   if(reason){reason.hidden=true;field.classList.remove('lm-has-reason')}
   why.setAttribute('aria-expanded','false');
   renderSecondary();
   scene.classList.remove('lm-scene--changing');
   later(()=>{morphLocked=false},420);
  },reduced()?0:270);
 }
 field.dataset.lmSubject=primary.kind;
 renderSecondary();
 const explanation=create('p','lm-explanation');
 explanation.hidden=true;
 scene.append(top,main,secondary,explanation);
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
 tip.textContent='ATELIER · ВЫМЫШЛЕННЫЕ ПРИМЕРЫ';
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
 if(caption)caption.textContent='Предпросмотр Living Surface запущен. Данные владельца не изменяются.';
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
 const id='task:'+(item.id||item.title)+'|'+item.due;
 if(quiet.has(id))return false;
 mode='task';key=id;
 dynamic.hidden=true;
 const when=item.due?new Date(item.due+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'';
 createSurface({
  kind:'task',
  title:item.title,
  body:'Срок наступил'+(when?' · '+when:'')+'. Дело сохранено в вашем списке.',
  category:'ВАШЕ ДЕЛО · ТРЕБУЕТ ВНИМАНИЯ',
  reason:'Вы сами добавили это дело. Сэйви показывает его, потому что наступил указанный срок.',
  detail:'Откройте «Дела», чтобы увидеть детали и завершить поручение.'
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
  const art=create('span','lm-owner-art');
  art.setAttribute('aria-hidden','true');
  art.append(icon(kind));
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
 const item=dueTask();
 if(item&&showTask(item))return;
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
dynamic.addEventListener('click',event=>{
 const button=event.target.closest?.('#inspect');
 if(!button||!dynamic.querySelector('[data-owner-advice]'))return;
 event.preventDefault();event.stopImmediatePropagation();
 const card=dynamic.querySelector('[data-owner-advice]');
 let reason=card.querySelector('.lm-real-reason');
 if(!reason){
  reason=create('p','lm-real-reason',
   'Основание: '+(card.querySelector('.card-tag')?.textContent||
   'сведения, которые вы внесли в приложение.')+
   ' Это предложение, а не действие, выполненное без вашего согласия.');
  reason.hidden=true;card.append(reason);
 }
 reason.hidden=!reason.hidden;
 button.textContent=reason.hidden?'Почему':'Скрыть';
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
  if(document.hidden||home.hidden||document.querySelector('dialog[open]')||mode!=='idle')return;
  startPreview();
 },9400);
}
})();