/* SEYVEO Signature · Living Surface + Cinematic Presence v2
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

const sample=[
 {kind:'contract',title:'Проверить договор',category:'ВАЖНОЕ',body:'Документ ожидает вашего решения.',
  reason:'Это вымышленный договор для предпросмотра. Настоящий появляется только из ваших документов или разрешённого источника.',
  detail:'В рабочем режиме Сэйви поможет проверить договор, но ничего не подпишет без вашего подтверждения.'},
 {kind:'mail',title:'Почта',category:'СООБЩЕНИЯ',body:'Ответить на письма',
  reason:'Почта не подключена, настоящих писем Сэйви пока не читала.',
  detail:'После разрешённого подключения почты Сэйви сможет помогать готовить черновики ответов.'},
 {kind:'breath',title:'Передышка',category:'ЗАБОТА',body:'Две минуты для себя',
  reason:'Это добровольный общий совет, а не вывод из данных о здоровье.',
  detail:'Можно спокойно посидеть и подышать в удобном ритме. Если некомфортно, пропустите.'}
];
function polymer(label,callback,kind='quiet'){
 const b=create('button','lm-polymer lm-polymer--'+kind,label);
 b.type='button';b.addEventListener('click',event=>{event.stopPropagation();callback(b)});
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
 const top=create('div','lm-field-top');
 top.append(create('span','lm-field-eyebrow',primary.category),create('span','lm-field-measure',real?'ВАШИ ДАННЫЕ':'КОНЦЕПТ'));
 const main=create('section','lm-primary');
 const copy=create('div','lm-primary-copy');
 copy.append(create('strong','lm-primary-title',primary.title),create('p','lm-primary-subtitle',primary.body));
 const controls=create('div','lm-actions');
 const open=polymer('Открыть',()=>{
  if(real){$('navTasks')?.click();return}
  explain(field,primary.detail,open);
 },'main');
 const laterButton=polymer('Позже',()=>closeEarly());
 const why=polymer('Почему',()=>explain(field,primary.reason,why));
 why.setAttribute('aria-expanded','false');
 controls.append(open,laterButton,why);
 main.append(copy,controls);field.append(top,main);
 if(other.length){
  const lines=create('div','lm-secondary');
  for(const item of other){
   const row=create('button','lm-inline-item');
   row.type='button';row.dataset.lmKind=item.kind;
   row.setAttribute('aria-label',item.title+'. '+item.body);
   const mark=create('span','lm-inline-icon');mark.append(icon(item.kind));
   const words=create('span','lm-inline-copy');
   words.append(create('span','lm-inline-title',item.title),create('span','lm-inline-note',item.body));
   const arrow=create('span','lm-inline-arrow','↗');arrow.setAttribute('aria-hidden','true');
   row.append(mark,words,arrow);
   row.addEventListener('click',()=>{
    explain(field,item.detail);
    const heading=field.querySelector('.lm-field-eyebrow');
    if(heading)heading.textContent=item.category+' · ПОДРОБНОСТИ';
   });
   lines.append(row);
  }
  field.append(lines);
 }
 const explanation=create('p','lm-explanation');explanation.hidden=true;
 field.append(explanation);
 tiles.append(field);
 return field;
}
function buildExamples(){createSurface(sample[0],sample.slice(1))}
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
 if(document.hidden||home.hidden||document.documentElement.classList.contains('seyveo-conversation'))return;
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