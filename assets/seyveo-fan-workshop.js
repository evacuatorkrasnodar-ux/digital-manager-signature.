/* SEYVEO community workshop. Local declarative cards, never executable plugins. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const home=$('homePage'),root=$('manageOverview');
if(!root)return;
const KEY='seyveo-fan-cards-v1',MAX=24;
const periods={any:'В любое время',morning:'Утром',day:'Днём',evening:'Вечером'};
const marks={spark:'✦',heart:'♡',sun:'☼',bolt:'ϟ',note:'♫',home:'⌂'};
const tones={mint:'Мята',sky:'Небо',lilac:'Лаванда',pearl:'Жемчуг'};
const templates=[{title:'Перед выходом',message:'Сэйви, напомни проверить ключи, телефон и важные вещи.',mark:'home',tone:'mint',period:'morning'},{title:'Минутка отдыха',message:'Пора отвлечься от дел, размяться и отдохнуть.',mark:'sun',tone:'sky',period:'day'},{title:'Мой вечер',message:'Напомни закончить важное и подготовиться к завтрашнему дню.',mark:'heart',tone:'lilac',period:'evening'}];
function clean(item){
 if(!item||typeof item!=='object')return null;
 const title=String(item.title||'').trim().slice(0,72),message=String(item.message||'').trim().slice(0,280);
 if(!title||!message)return null;
 return {id:String(item.id||'').slice(0,60),title,message,period:periods[item.period]?item.period:'any',onHome:item.onHome!==false,mark:marks[item.mark]?item.mark:'spark',tone:tones[item.tone]?item.tone:'mint'};
}
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.map(clean).filter(Boolean).slice(0,MAX):[]}catch{return []}}
let cards=read(),returnRoute='#manage';
function store(){
 try{localStorage.setItem(KEY,JSON.stringify(cards))}catch{}
 window.dispatchEvent(new Event('seyveo:fan-workshop-changed'));
 renderMyWorld();
}
function homeNote(){
 const hour=new Date().getHours(),period=hour>=5&&hour<12?'morning':hour>=12&&hour<18?'day':'evening';
 const item=cards.find(c=>c.onHome&&(c.period==='any'||c.period===period));
 return item?{title:item.title,message:item.message,period:item.period}:null;
}
function el(tag,klass,value){const n=document.createElement(tag);if(klass)n.className=klass;if(value!==undefined)n.textContent=value;return n}
const grid=document.querySelector('#lifePage .sv-life-category[aria-labelledby="svLifeServicesTitle"] .sv-life-category-grid');
let personalGrid=null;
function renderMyWorld(){
 if(!grid)return;
 if(!personalGrid){personalGrid=el('div','sv-fan-personal-grid');personalGrid.setAttribute('aria-label','Мои дополнения');grid.after(personalGrid)}
 personalGrid.replaceChildren();personalGrid.hidden=cards.length===0;
 for(const item of cards){
  const tile=el('button','calendar-space-button sv-fan-personal-tile');tile.type='button';
  tile.setAttribute('aria-label','Открыть моё дополнение '+item.title);
  tile.dataset.tone=item.tone;
  const symbol=el('span','sv-fan-personal-symbol',marks[item.mark]);symbol.setAttribute('aria-hidden','true');
  tile.append(symbol,el('span','',item.title));
  tile.addEventListener('click',()=>showPersonal(item));personalGrid.append(tile);
 }
}
function showPersonal(item){
 let dialog=$('svFanPersonalDialog');
 if(!dialog){
  dialog=el('dialog','sv-fan-personal-dialog');dialog.id='svFanPersonalDialog';
  const sheet=el('div','sv-fan-personal-sheet');
  const back=el('button','sv-fan-personal-back','‹ Мой мир');back.type='button';back.addEventListener('click',()=>dialog.close());
  const title=el('h2','');title.id='svFanPersonalTitle';
  const description=el('p','');description.id='svFanPersonalDescription';
  const emblem=el('div','sv-fan-personal-emblem');emblem.id='svFanPersonalEmblem';
  const actions=el('div','sv-fan-personal-actions');
  const edit=el('button','','Открыть в Мастерской');edit.type='button';edit.addEventListener('click',()=>{dialog.close();open()});
  actions.append(edit);sheet.append(back,emblem,title,description,actions);dialog.append(sheet);document.body.append(dialog);
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 }
 $('svFanPersonalEmblem').textContent=marks[item.mark];
 dialog.dataset.tone=item.tone;
 $('svFanPersonalTitle').textContent=item.title;
 $('svFanPersonalDescription').textContent=item.message;
 if(!dialog.open)dialog.showModal();
}

if(grid){
 const tile=el('button','calendar-space-button sv-fan-tile');
 tile.type='button';tile.setAttribute('aria-label','Открыть SEYVEO LAB — Мастерскую Сэйви');
 tile.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"/><path d="M19 16v5M16.5 18.5h5"/></svg><span>SEYVEO LAB</span>';
 tile.addEventListener('click',open);grid.append(tile);
}
const panel=el('section','sv-fan-workshop');panel.id='svFanWorkshopPanel';panel.hidden=true;
panel.innerHTML=[
'<header class="sv-fan-top"><button id="svFanBack" type="button" class="sv-fan-back">‹ Назад</button><small>SEYVEO LAB</small></header>',
'<section class="sv-fan-hero"><div class="sv-fan-hero-orb" aria-hidden="true">✦</div><p class="sv-fan-eyebrow">ТВОЙ МИР · ТВОИ ПРАВИЛА</p><h1>Мастерская Сэйви</h1><p class="sv-fan-intro">Придумай свою возможность. Настрой её вместе с Сэйви — и она появится в твоём «Моём мире».</p><div class="sv-fan-hero-meta"><span>✦ Личные дополнения</span><span>◎ Без программирования</span></div></section>',
'<h2 class="sv-fan-subheading">Попробуй готовую идею</h2><div id="svFanTemplates" class="sv-fan-templates" aria-label="Примеры дополнений"></div>',
'<h2 class="sv-fan-subheading">Создай своё</h2>',
'<form id="svFanForm" class="sv-fan-form">',
'<label>Название<input id="svFanTitle" maxlength="72" required placeholder="Например: Перед выходом"></label>',
'<label>Что будет делать карточка<textarea id="svFanMessage" maxlength="280" rows="3" required placeholder="Например: напомни проверить ключи и заряд телефона"></textarea></label>',
'<div class="sv-fan-customize"><fieldset class="sv-fan-palette"><legend>Значок</legend><div id="svFanMarks" class="sv-fan-choices" role="group" aria-label="Значок дополнения"></div></fieldset><fieldset class="sv-fan-palette"><legend>Оттенок</legend><div id="svFanTones" class="sv-fan-choices" role="group" aria-label="Оттенок дополнения"></div></fieldset></div>',
'<label>Когда показать<select id="svFanPeriod"><option value="any">В любое время</option><option value="morning">Утром</option><option value="day">Днём</option><option value="evening">Вечером</option></select></label>',
'<label class="sv-fan-checkbox"><input id="svFanShow" type="checkbox" checked> Показывать на Главной, если нет срочных дел</label>',
'<div class="sv-fan-preview-label">Предпросмотр в «Моём мире» <span>Обновляется сразу</span></div><div id="svFanLivePreview" class="sv-fan-live-preview" aria-live="polite"></div>',
'<div class="sv-fan-submit-row"><button class="sv-fan-primary" id="svFanSubmit" type="submit">Добавить в Мой мир</button><button id="svFanCancelEdit" class="sv-fan-secondary" type="button" hidden>Отмена</button></div><p id="svFanStatus" class="sv-fan-status" role="status" aria-live="polite"></p>',
'</form>',
'<h2>Мои дополнения <small id="svFanCount"></small></h2><p class="sv-fan-caption">Созданы тобой · хранятся в этом браузере</p><div id="svFanCards" class="sv-fan-cards"></div>',
'<section class="sv-fan-community"><h2>Клуб SEYVEO</h2>',
'<p>Здесь не нужно уметь программировать: придумай идею, собери карточку и поделись с другими. Опубликованные разработки можно будет изучать, обсуждать, улучшать и создавать собственные версии — по правилам открытой лицензии.</p>',
'<div class="sv-fan-community-rules"><strong>Открытое сообщество</strong><p>Публичная идея доступна другим участникам. Сообщество сможет голосовать за полезные предложения, а SEYVEO — проверять и включать лучшие решения в основную версию на условиях публикации и лицензии. Автор указывается, когда этого требует лицензия.</p><p>Личные дополнения не публикуются автоматически. Сейчас доступно создание локальных карточек и обсуждение через GitHub; встроенные установки, голоса и выпуск дополнений ещё в разработке.</p></div>',
'<a target="_blank" rel="noopener noreferrer" href="https://github.com/evacuatorkrasnodar-ux/digital-manager-signature./issues/27">Идеи и предложения ↗</a>',
'<a target="_blank" rel="noopener noreferrer" href="https://github.com/evacuatorkrasnodar-ux/digital-manager-signature./issues/28">Поделиться сценарием ↗</a>',
'<p class="sv-fan-caption">Это пока форумные ветки с комментариями, не встроенный чат. Не публикуйте личные данные и пароли.</p>',
'</section>'
].join('');
root.append(panel);
let chosenMark='spark',chosenTone='mint',editingId=null;
function choose(mark,tone){
 if(marks[mark])chosenMark=mark;
 if(tones[tone])chosenTone=tone;
 panel.querySelectorAll('[data-fan-mark]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fanMark===chosenMark)));
 panel.querySelectorAll('[data-fan-tone]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fanTone===chosenTone)));
 updatePreview();
}
for(const [key,sign] of Object.entries(marks)){
 const b=el('button','sv-fan-mark-choice',sign);b.type='button';b.dataset.fanMark=key;b.setAttribute('aria-label','Значок '+key);
 b.addEventListener('click',()=>choose(key,null));$('svFanMarks').append(b);
}
for(const [key,name] of Object.entries(tones)){
 const b=el('button','sv-fan-tone-choice');b.type='button';b.dataset.fanTone=key;b.setAttribute('aria-label','Цвет '+name);
 b.title=name;b.addEventListener('click',()=>choose(null,key));$('svFanTones').append(b);
}
for(const [index,sample] of templates.entries()){
 const b=el('button','sv-fan-template');b.type='button';b.dataset.tone=sample.tone;
 b.append(el('span','sv-fan-template-symbol',marks[sample.mark]),el('strong','',sample.title),el('small','',''));
 b.querySelector('small').textContent='Применить пример';
 b.addEventListener('click',()=>{resetEdit();$('svFanTitle').value=sample.title;$('svFanMessage').value=sample.message;$('svFanPeriod').value=sample.period;choose(sample.mark,sample.tone);$('svFanForm').scrollIntoView({block:'start',behavior:'smooth'});});
 $('svFanTemplates').append(b);
}
function updatePreview(){
 const title=$('svFanTitle').value.trim()||'Моё дополнение',msg=$('svFanMessage').value.trim()||'Здесь появится твоя идея';
 const box=$('svFanLivePreview');box.replaceChildren();
 const tile=el('div','sv-fan-preview-tile');tile.dataset.tone=chosenTone;
 tile.append(el('span','sv-fan-preview-icon',marks[chosenMark]),el('span','',title));
 const summary=el('div','sv-fan-preview-summary');summary.append(el('strong','',title),el('p','',msg));
 box.append(tile,summary);
}
['svFanTitle','svFanMessage','svFanPeriod'].forEach(id=>$(id).addEventListener('input',updatePreview));
function resetEdit(){
 editingId=null;$('svFanForm').reset();$('svFanSubmit').textContent='Добавить в Мой мир';$('svFanCancelEdit').hidden=true;choose('spark','mint');
}
$('svFanCancelEdit').addEventListener('click',resetEdit);
function editItem(item){
 editingId=item.id;$('svFanTitle').value=item.title;$('svFanMessage').value=item.message;
 $('svFanPeriod').value=item.period;$('svFanShow').checked=item.onHome;choose(item.mark,item.tone);
 $('svFanSubmit').textContent='Сохранить изменения';$('svFanCancelEdit').hidden=false;
 $('svFanStatus').textContent='Редактирование: '+item.title;
 $('svFanForm').scrollIntoView({block:'start',behavior:'smooth'});
}
choose('spark','mint');
function render(){
 renderMyWorld();
 const holder=$('svFanCards');holder.replaceChildren();$('svFanCount').textContent='· '+cards.length+'/'+MAX;
 if(!cards.length){holder.append(el('p','sv-fan-caption','Здесь появятся твои карточки.'));return}
 for(const item of cards){
  const card=el('article','sv-fan-card');
  card.dataset.tone=item.tone;
  const badge=el('span','sv-fan-card-emblem',marks[item.mark]);
  const title=el('strong','',item.title),time=el('small','',periods[item.period]);
  const desc=el('p','',item.message),buttons=el('div','sv-fan-actions');
  const toggle=el('button','',item.onHome?'На Главной ✓':'На Главную');
  toggle.type='button';toggle.addEventListener('click',()=>{item.onHome=!item.onHome;store();render()});
  const edit=el('button','','Изменить');edit.type='button';edit.addEventListener('click',()=>editItem(item));
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
  buttons.append(edit,toggle,share,remove);card.append(badge,title,time,desc,buttons);holder.append(card);
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
 if(!editingId&&cards.length>=MAX){$('svFanStatus').textContent='Достигнут лимит 24 карточки.';return}
 const item=clean({id:editingId||String(Date.now())+Math.random().toString(36).slice(2),title,message,period:$('svFanPeriod').value,onHome:$('svFanShow').checked,mark:chosenMark,tone:chosenTone});
 if(!item)return;
 if(editingId){cards=cards.map(c=>c.id===editingId?item:c)}else cards.unshift(item);
 store();render();resetEdit();
 $('svFanStatus').textContent='Готово! Дополнение появилось в «Моём мире». Карточка на Главной будет показана по выбранным условиям.';
});
window.addEventListener('storage',e=>{if(e.key!==KEY)return;cards=read();render();window.dispatchEvent(new Event('seyveo:fan-workshop-changed'))});
window.SEYVEO_FAN_WORKSHOP=Object.freeze({open,homeNote,list:()=>cards.map(c=>({...c}))});
render();
window.dispatchEvent(new Event('seyveo:fan-workshop-changed'));
})();