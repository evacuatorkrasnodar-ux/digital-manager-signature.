/* SEYVEO Signature · Living Moment + Cinematic Presence v1
 * Production-safe local cards and clearly marked design examples.
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
const SESSION='seyveo-living-moment-visited-v1';
const TIMING=Object.freeze({open:reduced()?0:820,bright:8500,quiet:4700,close:reduced()?0:740});
let mode='idle',key='',quiet=new Set(),timers=[];
let pendingUpdate=false;
function later(callback,ms){
 const id=window.setTimeout(callback,ms);
 timers.push(id);return id;
}
function cancel(){for(const id of timers)clearTimeout(id);timers=[]}
function available(){return !home.hidden&&!document.hidden&&!location.hash&&!(document.querySelector('dialog[open]'))}
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
 return editing()||keyboardFocus||(mouse&&(space.matches(':hover')||dynamic.matches(':hover')))
   ||document.querySelector('dialog[open]')!==null;
}
function focus(on){
 if(home.classList.contains('lm-focus')!==on)home.classList.toggle('lm-focus',on);
}
function resetSpace(){
 space.classList.remove('lm-reveal','lm-condense','lm-disappear','lm-preview','lm-real');
 space.hidden=true;tiles.replaceChildren();
 tip.textContent='';
}
function rest(){
 cancel();mode='idle';key='';
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
const glyph={
 contract:'<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5"/>',
 mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m5.6 8 6.4 5 6.4-5"/>',
 breath:'<path d="M3.5 12c3.5-6 7 6 10.4 0 2.3-4 4.5-3 6.6-1.8"/><path d="M4 17c3-3 5 2.7 8 0 2-2 4-2 6 0"/>',
 task:'<rect x="4.5" y="5.5" width="15" height="14" rx="3"/><path d="m8.2 12 2.7 2.6 5-5.5"/>'
};
function icon(kind){
 const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
 s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');
 s.innerHTML=glyph[kind]||glyph.task;return s;
}
function showExample(item){
 const modal=$('info'),heading=$('infoTitle'),body=$('infoText');
 if(!modal||!heading||!body)return;
 const descriptions={
  contract:'Учебный пример: когда документ действительно появится из разрешённого источника, Сэйви предложит его проверить. Подписание без подтверждения владельца недопустимо.',
  mail:'Учебный пример. Новые письма будут показаны только после настоящего подключения почты. Сейчас Сэйви не читает почту и не отправляет ответы.',
  breath:'Небольшая добровольная передышка. Это иллюстрация идеи, а не вывод из медицинских данных и не медицинская рекомендация.'
 };
 heading.textContent=item.title;
 body.textContent=descriptions[item.kind]||'Это только пример будущей рекомендации.';
 body.hidden=false;
 const previous=$('replyThread');if(previous)previous.hidden=true;
 const history=$('assistantDialogHistory');if(history)history.hidden=true;
 if(!modal.open)try{modal.showModal()}catch{}
}
const sample=[
 {kind:'contract',title:'Проверить договор',category:'ВАЖНОЕ РЕШЕНИЕ',body:'Новый документ ожидает проверки.',large:true},
 {kind:'mail',title:'Почта',category:'СООБЩЕНИЯ',body:'Ответить на письма',large:false},
 {kind:'breath',title:'Передышка',category:'ЗАБОТА',body:'Две минуты для себя',large:false}
];
function tile(item){
 const button=create('button','lm-card '+(item.large?'lm-card--hero':'lm-card--small'));
 button.type='button';button.dataset.lmKind=item.kind;
 button.setAttribute('aria-label',item.title+'. Пример: '+item.body);
 const head=create('span','lm-card-head');
 const sign=create('span','lm-card-icon');sign.append(icon(item.kind));head.append(sign,create('span','lm-card-category',item.category));
 const body=create('span','lm-card-content');
 body.append(create('strong','lm-card-title',item.title),create('span','lm-card-desc',item.body));
 const arrow=create('span','lm-card-arrow','↗');arrow.setAttribute('aria-hidden','true');
 button.append(head,body,arrow);
 button.addEventListener('click',()=>showExample(item));
 return button;
}
function buildExamples(){
 tiles.replaceChildren();sample.forEach(x=>tiles.append(tile(x)));
}
function hold(callback,delay){
 const check=()=>{
  if(mode==='idle'||!available()){if(!available())return rest();return}
  if(engaged()){later(check,1800);return}
  callback();
 };
 later(check,delay);
}
function startPreview(force=false){
 if(!available())return false;
 if(mode!=='idle')rest();
 mode='preview';key='preview';
 try{sessionStorage.setItem(SESSION,'1')}catch{}
 dynamic.hidden=true;
 buildExamples();
 tip.textContent='ПРЕДПРОСМОТР · вымышленные примеры, ничего не сохранено';
 space.hidden=false;space.classList.add('lm-preview');
 focus(true);
 later(()=>{if(mode==='preview')space.classList.add('lm-reveal')},TIMING.open);
 hold(()=>{
  space.classList.add('lm-condense');
  // One important decision remains as a compact memory before disappearing.
  tip.textContent='ПРИМЕР · важное остаётся доступным в своём разделе';
 },TIMING.bright+TIMING.open);
 hold(()=>{
  space.classList.add('lm-disappear');
  later(()=>{
   if(mode!=='preview')return;
   rest();
  },TIMING.close);
 },TIMING.bright+TIMING.quiet+TIMING.open);
 if(caption)caption.textContent='Предпросмотр запущен. Примеры не влияют на ваши данные.';
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
 tiles.replaceChildren();
 const wrapper=create('button','lm-card lm-card--hero lm-card--real');
 wrapper.type='button';wrapper.setAttribute('aria-label','Открыть дело: '+item.title);
 const head=create('span','lm-card-head');
 const sign=create('span','lm-card-icon');sign.append(icon('task'));
 head.append(sign,create('span','lm-card-category',item.due? 'ВАШЕ ДЕЛО · '+item.due:'ВАШЕ ДЕЛО'));
 const content=create('span','lm-card-content');
 content.append(create('strong','lm-card-title',item.title),create('span','lm-card-desc','Срок наступил · открыть в «Делах»'));
 wrapper.append(head,content,create('span','lm-card-arrow','↗'));
 wrapper.addEventListener('click',()=>{$('navTasks')?.click()});
 tiles.append(wrapper);
 tip.textContent='НА ОСНОВЕ ВАШИХ ЗАПИСЕЙ · НЕ ПРИМЕР';
 space.hidden=false;space.classList.remove('lm-preview');space.classList.add('lm-real');
 focus(true);
 later(()=>{if(mode==='task')space.classList.add('lm-reveal')},TIMING.open);
 hold(()=>{space.classList.add('lm-condense');tip.textContent='Дело сохранено в «Делах»'},12000);
 hold(()=>{
  space.classList.add('lm-disappear');quiet.add(id);
  later(()=>{if(mode==='task')rest()},TIMING.close);
 },18000);
 return true;
}
function showExistingAdvice(){
 const card=dynamic.querySelector('[data-owner-advice]');
 if(!card)return false;
 const id='advice:'+card.textContent.trim().slice(0,300);
 if(quiet.has(id))return false;
 mode='advice';key=id;
 space.hidden=true;
 dynamic.hidden=false;
 dynamic.classList.remove('lm-real-dim','lm-real-out');
 focus(true);
 hold(()=>{dynamic.classList.add('lm-real-dim')},11000);
 hold(()=>{
  quiet.add(id);dynamic.classList.add('lm-real-out');
  later(()=>{if(mode==='advice'){dynamic.hidden=true;rest()}},TIMING.close);
 },17000);
 return true;
}
function refresh(){
 if(document.hidden||home.hidden)return;
 const pending=dynamic.querySelector('[data-owner-advice]');
 const pendingKey=pending?'advice:'+pending.textContent.trim().slice(0,300):'';
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
replay?.addEventListener('click',()=>{
 if(replay.closest('dialog[open]'))replay.closest('dialog').close();
 $('navHome')?.click();
 later(()=>{startPreview(true)},260);
});
window.SEYVEO_LIVING_MOMENT=Object.freeze({preview:()=>startPreview(true),state:()=>mode});
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