/* SEYVEO Home · clean cinematic director, October 2026.
   One scene and one queue. No legacy deck, overlays or duplicate cards. */
(()=>{
'use strict';
const byId=id=>document.getElementById(id);
const home=byId('homePage'),surface=byId('seyveoLivingMoment'),
 tiles=byId('seyveoLivingTiles'),hint=byId('seyveoLivingCaption'),
 trigger=byId('seyveoDemoLaunch'),preview=byId('openLivingMomentPreview'),
 previewStatus=byId('livingMomentPreviewStatus'),dynamic=byId('dynamic');
if(!home||!surface||!tiles)return;
const DATA_KEY='seyveo-personal-tasks-v1';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const demo=[
 ['Проверить договор аренды','Срок согласования завтра.','Проверить условия и подготовить вопросы.','file-text'],
 ['Ответить клиенту','Клиент ожидает ответ.','Подготовить ответ для согласования.','mail'],
 ['Напомнить о встрече','Завтра созвон в 11:30.','Подготовить напоминание.','calendar'],
 ['Проверить рекламные расходы','Бюджет приблизился к лимиту.','Проверить рекламные кампании.','chart'],
 ['Продлить подписку','Учебная подписка истекает через два дня.','Подготовить решение о продлении.','file-text'],
 ['Разобрать письма','В учебной почте накопились обращения.','Выделить срочные сообщения.','mail'],
 ['Проверить публикацию','Материал ожидает согласования.','Показать текст перед публикацией.','file-text'],
 ['Сделать перерыв','Пришло время короткой паузы.','Предложить десятиминутный отдых.','heart'],
 ['Перенести встречу','Учебные события пересеклись.','Предложить другую дату.','calendar'],
 ['Сверить планы','Есть незакрытые учебные пункты.','Выстроить приоритеты.','list']
].map((v,i)=>({id:'demo-'+i,title:v[0],body:v[1],proposal:v[2],art:v[3],demo:true}));
const paths={
 'file-text':'M7 3h7l4 4v14H7z M14 3v5h4 M10 12h5 M10 16h5',
 mail:'M3 6h18v12H3z M3 8l9 7 9-7',
 calendar:'M4 5h16v16H4z M4 10h16 M8 3v5 M16 3v5',
 chart:'M4 20V10 M10 20V5 M16 20v-8 M22 20H2',
 heart:'M12 21 4 13C-1 8 4 1 10 5l2 2 2-2c6-4 11 3 6 8z',
 list:'M4 6h1 M9 6h12 M4 12h1 M9 12h12 M4 18h1 M9 18h12'
};
let mode='idle',queue=[],done=0,timers=[],busy=false,opened=false,initial=true;
function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id)}
function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function icon(kind){
 const el=document.createElementNS('http://www.w3.org/2000/svg','svg');
 el.setAttribute('viewBox','0 0 24 24');el.setAttribute('fill','none');
 el.setAttribute('stroke','currentColor');el.setAttribute('stroke-width','1.5');
 el.setAttribute('stroke-linecap','round');el.setAttribute('stroke-linejoin','round');
 el.setAttribute('aria-hidden','true');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d',paths[kind]||paths.list);el.append(path);return el;
}
function homeVisible(){return !home.hidden&&(!location.hash||location.hash==='#home')&&
 !document.documentElement.classList.contains('seyveo-conversation')&&!document.querySelector('dialog[open]')}
function readTasks(){
 try{
  const raw=JSON.parse(localStorage.getItem(DATA_KEY)||'[]');
  if(!Array.isArray(raw))return [];
  return raw.filter(t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&t.title.trim()&&!t.done)
   .map(t=>({id:t.id,title:t.title,body:t.due?'Срок: '+t.due:'Срок не указан',
    proposal:'Обсудить детали и согласовать следующий шаг.',art:'list',demo:false}));
 }catch{return []}
}
function hide(){clearTimers();mode='idle';busy=false;queue=[];tiles.replaceChildren();surface.hidden=true;
 home.classList.remove('lm-focus');hint.textContent=''}
function makeRow(item,cls){
 const row=element('div',cls);
 const art=element('span','sv-film-icon');art.append(icon(item.art));
 row.append(art,element('span','sv-film-title',item.title));return row;
}
function build(){
 tiles.replaceChildren();
 if(!queue.length){
  const finished=element('section','sv-decision');
  finished.append(element('p','sv-eyebrow','СЭЙВИ · РЕШЕНИЯ'),
   element('h3','sv-title',mode==='demo'?'Демонстрация завершена':'Дела разобраны'),
   element('p','sv-subtitle',mode==='demo'?'Все действия были учебными.':'Ваши изменения сохранены.'));
  if(mode==='demo'){const btn=element('button','sv-action sv-action-primary','Повторить');
   btn.type='button';btn.addEventListener('click',()=>start(true));finished.append(btn)}
  tiles.append(finished);return;
 }
 const item=queue[0],card=element('section','sv-decision');
 card.setAttribute('aria-label',item.title);
 const eyebrow=element('p','sv-eyebrow',(item.demo?'УЧЕБНЫЕ ДАННЫЕ':'ВАШЕ ДЕЛО')+
  ' · '+(done+1)+' / '+(queue.length+done));
 const head=element('div','sv-decision-head');
 const mark=element('span','sv-decision-art');mark.append(icon(item.art));
 const text=element('div','sv-decision-copy');text.append(element('h3','sv-title',item.title),
  element('p','sv-subtitle',item.body));head.append(mark,text);
 const suggestion=element('p','sv-proposal',item.proposal);
 const actions=element('div','sv-actions');
 const detail=element('button','sv-action','Подробнее');
 const execute=element('button','sv-action sv-action-primary',item.demo?'Исполнить':'Завершить дело');
 const defer=element('button','sv-action','Позже');
 for(const button of [detail,execute,defer])button.type='button';
 detail.addEventListener('click',()=>{
  const chat=window.SEYVEO_CONVERSATION;if(typeof chat?.open!=='function')return;
  chat.open();const field=byId('question');if(!field||field.value.trim())return;
  field.value=(item.demo?'Учебный пример. ':'')+'Сэйва, давай разберём «'+item.title+'». '+item.body+
   ' Предложение: '+item.proposal+' Ничего не исполняй без подтверждения.';
  field.dispatchEvent(new Event('input',{bubbles:true}));
 });
 execute.addEventListener('click',()=>advance('execute',1));
 defer.addEventListener('click',()=>advance('later',1));
 actions.append(detail,execute,defer);card.append(eyebrow,head,suggestion,actions);
 let touch=null;
 card.addEventListener('pointerdown',e=>{if(busy||e.button!==0)return;
  touch={id:e.pointerId,x:e.clientX,y:e.clientY}});
 card.addEventListener('pointercancel',()=>{touch=null});
 card.addEventListener('pointerup',e=>{
  if(!touch||touch.id!==e.pointerId)return;
  const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;
  if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)advance('later',Math.sign(dx));
 });
 tiles.append(card);
}
function advance(action,direction){
 if(busy||!queue.length)return;busy=true;
 const card=tiles.querySelector('.sv-decision'),item=queue[0];
 card?.style.setProperty('--departure',direction<0?'-75vw':'75vw');
 card?.classList.add('sv-decision-out');
 later(()=>{
  if(action==='execute'){
   if(!item.demo){
    try{const records=JSON.parse(localStorage.getItem(DATA_KEY)||'[]');
     if(!Array.isArray(records))throw Error('Invalid records');
     const found=records.find(t=>t.id===item.id);
     if(!found)throw Error('Task missing');
     found.done=true;found.doneAt=new Date().toISOString();
     localStorage.setItem(DATA_KEY,JSON.stringify(records));
     window.dispatchEvent(new CustomEvent('seyveo:tasks-changed'));
    }catch{busy=false;build();return}
   }
   queue.shift();done++;
  }else if(queue.length>1)queue.push(queue.shift());
  build();const next=tiles.querySelector('.sv-decision');
  next?.classList.add('sv-decision-in');
  later(()=>{next?.classList.remove('sv-decision-in');busy=false},reduced()?0:370);
 },reduced()?0:340);
}
function intro(){
 if(reduced()||queue.length<2){build();return}
 // A single temporary, UNFRAMED list replaces the final decision while
 // entering. It is not stacked above another row/card or another screen.
 tiles.replaceChildren();const stage=element('div','sv-intro');
 const count=Math.min(queue.length,innerHeight<690?2:innerHeight<870?3:4);
 queue.slice(0,count).forEach((item,i)=>{
  const row=makeRow(item,'sv-intro-row');
  row.style.setProperty('--idx',String(i));
  row.style.animationDelay=(i*210)+'ms';stage.append(row);
 });tiles.append(stage);
 later(()=>{stage.classList.add('sv-intro-gather')},1450);
 later(()=>{build();tiles.firstElementChild?.classList.add('sv-decision-in');
  later(()=>tiles.firstElementChild?.classList.remove('sv-decision-in'),340)
 },reduced()?0:2250);
}
function start(isDemo=false){
 if(!homeVisible())return false;
 clearTimers();busy=false;done=0;mode=isDemo?'demo':'real';
 queue=isDemo?demo.map(x=>({...x})):readTasks();
 if(!queue.length){mode='idle';surface.hidden=true;trigger.hidden=false;return false}
 surface.hidden=false;trigger.hidden=true;
 home.classList.add('lm-focus');
 hint.textContent='';
 intro();return true;
}
function sync(){
 if(!homeVisible()){if(mode!=='idle')hide();return}
 if(mode!=='idle')return;
 const real=readTasks();
 if(real.length){start(false);return}
 trigger.hidden=false;
 if(initial){initial=false;later(()=>{if(mode==='idle'&&homeVisible())start(true)},1000)}
}
preview?.addEventListener('click',()=>{
 preview.closest('dialog[open]')?.close();byId('navHome')?.click();
 later(()=>start(true),260);
});
trigger?.addEventListener('click',()=>start(true));
addEventListener('hashchange',()=>later(sync,120));
addEventListener('pageshow',sync);
addEventListener('seyveo:tasks-changed',()=>{
 if(mode==='real'){hide()}sync();
});
new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
window.SEYVEO_LIVING_MOMENT=Object.freeze({preview:()=>start(true),state:()=>mode});
sync();
})();