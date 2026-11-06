/* SEYVEO community workshop. Local declarative cards, never executable plugins. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('homePage'),root=$('manageOverview');
if(!root)return;
const KEY='seyveo-fan-cards-v1',MAX=24;
const periods={any:'В любое время',morning:'Утром',day:'Днём',evening:'Вечером'};
function clean(item){
 if(!item||typeof item!=='object')return null;
 const title=String(item.title||'').trim().slice(0,72),message=String(item.message||'').trim().slice(0,280);
 if(!title||!message)return null;
 return {id:String(item.id||'').slice(0,60),title,message,period:periods[item.period]?item.period:'any',onHome:item.onHome!==false};
}
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.map(clean).filter(Boolean).slice(0,MAX):[]}catch{return []}}
let cards=read(),returnRoute='#manage';
function store(){
 try{localStorage.setItem(KEY,JSON.stringify(cards))}catch{}
 window.dispatchEvent(new Event('seyveo:fan-workshop-changed'));
}
function homeNote(){
 const hour=new Date().getHours(),period=hour>=5&&hour<12?'morning':hour>=12&&hour<18?'day':'evening';
 const item=cards.find(c=>c.onHome&&(c.period==='any'||c.period===period));
 return item?{title:item.title,message:item.message,period:item.period}:null;
}
function el(tag,klass,value){const n=document.createElement(tag);if(klass)n.className=klass;if(value!==undefined)n.textContent=value;return n}
const grid=document.querySelector('#lifePage .sv-life-category[aria-labelledby="svLifeServicesTitle"] .sv-life-category-grid');
if(grid){
 const tile=el('button','calendar-space-button sv-fan-tile');
 tile.type='button';tile.setAttribute('aria-label','Открыть SEYVEO LAB — Мастерскую Сэйви');
 tile.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"/><path d="M19 16v5M16.5 18.5h5"/></svg><span>SEYVEO LAB</span>';
 tile.addEventListener('click',open);grid.append(tile);
}
const panel=el('section','sv-fan-workshop');panel.id='svFanWorkshopPanel';panel.hidden=true;
panel.innerHTML=[
'<header class="sv-fan-top"><button id="svFanBack" type="button" class="sv-fan-back">‹ Назад</button><small>SEYVEO LAB</small></header>',
'<h1>Мастерская Сэйви</h1>',
'<p class="sv-fan-intro"><strong>Придумай. Создай с Сэйви. Поделись.</strong> Создавай свои подсказки и карточки. Они сохраняются только на этом устройстве. Выполнение команд и установка чужого кода пока не поддерживаются.</p>',
'<form id="svFanForm" class="sv-fan-form">',
'<label>Название<input id="svFanTitle" maxlength="72" required placeholder="Например: Перед выходом"></label>',
'<label>Что должна напомнить Сэйви<textarea id="svFanMessage" maxlength="280" rows="3" required placeholder="Проверь ключи и заряд телефона"></textarea></label>',
'<label>Когда показать<select id="svFanPeriod"><option value="any">В любое время</option><option value="morning">Утром</option><option value="day">Днём</option><option value="evening">Вечером</option></select></label>',
'<label class="sv-fan-checkbox"><input id="svFanShow" type="checkbox" checked> Показывать на Главной, если нет срочных дел</label>',
'<button class="sv-fan-primary" type="submit">Добавить карточку</button><p id="svFanStatus" class="sv-fan-status" role="status" aria-live="polite"></p>',
'</form>',
'<h2>Мои дополнения <small id="svFanCount"></small></h2><div id="svFanCards" class="sv-fan-cards"></div>',
'<section class="sv-fan-community"><h2>Клуб SEYVEO</h2>',
'<p>Первые открытые обсуждения работают через GitHub. Читать можно без регистрации, для комментариев нужен аккаунт GitHub.</p>',
'<a target="_blank" rel="noopener noreferrer" href="https://github.com/evacuatorkrasnodar-ux/digital-manager-signature./issues/27">Идеи и предложения ↗</a>',
'<a target="_blank" rel="noopener noreferrer" href="https://github.com/evacuatorkrasnodar-ux/digital-manager-signature./issues/28">Поделиться сценарием ↗</a>',
'<p class="sv-fan-caption">Это пока форумные ветки с комментариями, не встроенный чат. Не публикуйте личные данные и пароли.</p>',
'</section>'
].join('');
root.append(panel);
function render(){
 const holder=$('svFanCards');holder.replaceChildren();$('svFanCount').textContent='· '+cards.length+'/'+MAX;
 if(!cards.length){holder.append(el('p','sv-fan-caption','Здесь появятся твои карточки.'));return}
 for(const item of cards){
  const card=el('article','sv-fan-card');
  const title=el('strong','',item.title),time=el('small','',periods[item.period]);
  const desc=el('p','',item.message),buttons=el('div','sv-fan-actions');
  const toggle=el('button','',item.onHome?'На Главной ✓':'На Главную');
  toggle.type='button';toggle.addEventListener('click',()=>{item.onHome=!item.onHome;store();render()});
  const share=el('button','','Поделиться');share.type='button';
  share.addEventListener('click',async()=>{
   const text='SEYVEO · '+item.title+'\n'+periods[item.period]+'\n'+item.message;
   try{
    if(navigator.share)await navigator.share({title:item.title,text});
    else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);$('svFanStatus').textContent='Описание скопировано.'}
    else $('svFanStatus').textContent='Скопируй описание и отправь его в сообщество.';
   }catch(e){if(e?.name!=='AbortError')$('svFanStatus').textContent='Не удалось поделиться.'}
  });
  const remove=el('button','sv-fan-remove','Удалить');remove.type='button';
  remove.addEventListener('click',()=>{cards=cards.filter(c=>c.id!==item.id);store();render()});
  buttons.append(toggle,share,remove);card.append(title,time,desc,buttons);holder.append(card);
 }
}
function open(){
 returnRoute=location.hash||'';
 if(location.hash!=='#manage')location.hash='#manage';
 root.classList.add('sv-fan-open');panel.hidden=false;render();
 requestAnimationFrame(()=>panel.scrollIntoView({block:'start',behavior:'instant'}));
}
function close(navigateBack=false){
 panel.hidden=true;root.classList.remove('sv-fan-open');
 if(navigateBack&&returnRoute!=='#manage'){
  if(returnRoute)location.hash=returnRoute;
  else{history.pushState(null,'',location.pathname+location.search);window.dispatchEvent(new Event('hashchange'))}
 }
}
$('svFanBack').addEventListener('click',()=>close(true));
window.addEventListener('hashchange',()=>{if(location.hash!=='#manage')close(false)});
$('svFanForm').addEventListener('submit',e=>{
 e.preventDefault();const title=$('svFanTitle').value.trim(),message=$('svFanMessage').value.trim();
 if(!title||!message){$('svFanStatus').textContent='Заполни название и текст.';return}
 if(cards.length>=MAX){$('svFanStatus').textContent='Достигнут лимит 24 карточки.';return}
 const item=clean({id:String(Date.now())+Math.random().toString(36).slice(2),title,message,period:$('svFanPeriod').value,onHome:$('svFanShow').checked});
 if(!item)return;
 cards.unshift(item);store();render();e.target.reset();
 $('svFanStatus').textContent='Готово! Карточка сохранена и появится на Главной в выбранное время.';
});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;cards=read();render();window.dispatchEvent(new Event('seyveo:fan-workshop-changed'))});
window.SEYVEO_FAN_WORKSHOP=Object.freeze({open,homeNote,list:()=>cards.map(c=>({...c}))});
render();
window.dispatchEvent(new Event('seyveo:fan-workshop-changed'));
})();