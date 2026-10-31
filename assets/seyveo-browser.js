/* SEYVEO Browser · Black Velvet home, safe HTTPS embed prototype.
   Full web navigation and ad blocking require native WKWebView/Android WebView. */
(()=>{'use strict';
if(document.getElementById('seyveoBrowser'))return;
const root=document.createElement('section');
root.id='seyveoBrowser';root.className='seyveo-browser';root.hidden=true;
root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','SEYVEO Browser');
root.innerHTML=`<div class="seyveo-browser-home"><div class="seyveo-browser-kicker">SEYVEO</div><h2>Browser</h2></div>
<form class="seyveo-browser-bar"><span class="seyveo-browser-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg></span><input type="text" name="address" autocomplete="off" spellcheck="false" placeholder="Поиск или адрес сайта" aria-label="Поиск или адрес сайта"><button type="button" class="seyveo-browser-scan" data-scan aria-label="Сканировать QR-код" title="Сканировать QR-код"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/></svg></button><input type="file" accept="image/*" capture="environment" data-scan-file hidden></form>
<div class="seyveo-browser-start"><div class="seyveo-browser-start-heading"><span>Быстрый доступ</span><button type="button" data-quick-toggle aria-controls="seyveoBrowserQuickLinks" aria-expanded="false">Показать все ›</button></div><div class="seyveo-browser-shortcuts" id="seyveoBrowserQuickLinks"><button type="button" data-site="https://ya.ru"><span class="sb-site-mark sb-yandex">Я</span><span>Яндекс</span><small>ya.ru</small></button><button type="button" data-site="https://www.youtube.com"><span class="sb-site-mark sb-youtube">▶</span><span>YouTube</span><small>youtube.com</small></button><button type="button" data-site="https://www.wikipedia.org"><span class="sb-site-mark sb-wiki">W</span><span>Wikipedia</span><small>wikipedia.org</small></button><button type="button" data-bookmarks><span class="sb-site-mark sb-saved">☆</span><span>Избранное</span><small>Закладки</small></button></div><div class="seyveo-browser-continue"><div class="seyveo-browser-start-heading"><span>Продолжить просмотр</span><span class="sb-browser-history-heading-actions"><button type="button" data-history-toggle aria-controls="seyveoBrowserHistoryList" aria-expanded="false" hidden>Показать все ›</button><button type="button" data-history-clear hidden aria-label="Очистить продолжение просмотра" title="Очистить историю просмотра"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9.5 4h5M7.5 7l.7 13h7.6l.7-13M10 10v7m4-7v7"/></svg></button></span></div><div id="seyveoBrowserHistoryList" class="sb-manager-closed" data-continue-list></div></div><section class="sb-home-recent-tabs" hidden><div class="seyveo-browser-start-heading"><span>Недавние вкладки</span><button type="button" data-open-tab-manager aria-label="Показать все вкладки">Показать все ›</button></div><div class="sb-home-recent-grid" data-home-recent-tabs aria-label="Недавние вкладки, листайте влево и вправо"></div></section></div>
<nav class="seyveo-browser-tabs" aria-label="Вкладки"><div data-tabs></div><button type="button" data-new aria-label="Новая вкладка">＋</button></nav>
<div class="seyveo-browser-content" hidden><header class="sb-browser-sitebar" hidden aria-label="Панель браузера"><button type="button" class="sb-browser-sitebar-menu-button" data-site-menu aria-label="Меню браузера" aria-expanded="false" aria-controls="seyveoBrowserSiteMenu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><strong class="sb-browser-sitebar-title" data-site-title></strong><button type="button" class="sb-browser-sitebar-search-button" data-site-search aria-label="Поиск или адрес сайта"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg></button><nav id="seyveoBrowserSiteMenu" class="sb-browser-site-menu" data-site-menu-panel aria-label="Меню SEYVEO Browser" hidden><button type="button" data-site-action="tabs">Вкладки</button><button type="button" data-site-action="favorites">Избранное</button><button type="button" data-site-action="history">История</button><button type="button" data-site-action="home">Главная браузера</button></nav></header><div class="seyveo-browser-blocked" hidden role="status"><div class="sb-browser-embed-message"><strong>Встроенный просмотр недоступен</strong><p>Некоторые сайты ограничивают открытие внутри демоверсии браузера.</p><button type="button" data-open-blocked>Открыть отдельно ↗</button></div></div><section class="sb-browser-demo" data-browser-demo hidden aria-label="Демонстрация оформления страницы, не живой сайт">
 <div class="sb-browser-demo-head"><span class="sb-browser-demo-menu" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg></span><strong>Хабр</strong><span class="sb-browser-demo-fill"></span><span class="sb-browser-demo-search" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg></span></div>
 <article class="sb-browser-demo-article">
  <div class="sb-browser-demo-meta"><span>ДИЗАЙН</span><span>·</span><span>12 мая 2024</span><span>·</span><span>◷ 7 мин</span><small>ДЕМО</small></div>
  <h1>Минимализм в цифровом пространстве: почему меньше значит больше</h1>
  <p class="sb-browser-demo-lead">Разбираемся, как принципы минимализма помогают создавать более удобные, красивые и осознанные цифровые продукты.</p>
  <div class="sb-browser-demo-hero" role="img" aria-label="Иллюстрация рабочего стола с лампой, ноутбуком и чашкой">
   <svg viewBox="0 0 640 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="sbDemoWall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#233a3b"/><stop offset=".58" stop-color="#111c20"/><stop offset="1" stop-color="#071416"/></linearGradient><linearGradient id="sbDemoDesk" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#816346"/><stop offset=".16" stop-color="#3d352a"/><stop offset="1" stop-color="#111b1c"/></linearGradient><radialGradient id="sbDemoGlow"><stop stop-color="#e2ae68" stop-opacity=".28"/><stop offset="1" stop-color="#dfac68" stop-opacity="0"/></radialGradient></defs>
    <rect width="640" height="340" fill="url(#sbDemoWall)"/><g stroke="#9ab1ad" stroke-opacity=".12"><path d="M120 0v235M253 0v235M380 0v235M510 0v235"/></g><ellipse cx="126" cy="117" rx="180" ry="150" fill="url(#sbDemoGlow)"/>
    <path d="M0 229h640v111H0z" fill="url(#sbDemoDesk)"/><path d="M0 232h640" stroke="#d2b68a" stroke-width="3" stroke-opacity=".3"/>
    <path d="m162 224 33-142h54" stroke="#101719" stroke-width="9" fill="none"/><path d="m210 77-61 2-16 20h78z" fill="#20292a"/><path d="M151 97h52" stroke="#f3c083" stroke-width="5"/><path d="m155 226-33 0" stroke="#101718" stroke-width="10"/>
    <rect x="100" y="177" width="35" height="51" rx="4" fill="#111b1a"/><path d="M116 174q-17-30-13-50m13 50q20-42 13-57m-13 51q-3-25-24-40" stroke="#455838" fill="none" stroke-width="3"/>
    <path d="M277 149h163l30 83H311z" fill="#111719" stroke="#566260" stroke-width="3"/><path d="M313 232h158l42 12H273z" fill="#293031"/><path d="M275 244h241" stroke="#9a9b90" stroke-opacity=".32" stroke-width="3"/>
    <rect x="525" y="190" width="43" height="42" rx="5" fill="#121c1e" stroke="#4d5552" stroke-width="3"/><path d="M566 202q23-1 10 17h-9" fill="none" stroke="#4b5652" stroke-width="6"/>
    <rect x="0" y="293" width="640" height="47" fill="#10191b" opacity=".68"/>
   </svg>
  </div>
  <p>В мире, где нас ежедневно окружает избыток информации, минимализм становится не просто эстетическим выбором, а осознанной необходимостью. Он помогает сфокусироваться на главном, снижает когнитивную нагрузку и делает взаимодействие с технологиями по-настоящему приятным.</p>
  <p>Продуманная иерархия, свободное пространство и спокойные детали позволяют сосредоточиться на содержании.</p>
 </article>
</section><iframe title="Веб-страница" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms" hidden></iframe><div class="seyveo-browser-frame-note"><span>Некоторые сайты требуют cookies или запрещают встроенный просмотр.</span><button type="button" data-frame-external aria-label="Открыть сайт в отдельной вкладке">Открыть отдельно ↗</button></div></div>
<footer class="seyveo-browser-bottom"><button type="button" data-back aria-label="Назад">‹</button><button type="button" data-forward aria-label="Вперёд">›</button><button type="button" data-home aria-label="На стартовую">⌂</button><button type="button" data-bookmark aria-label="Сохранить страницу">☆</button><button type="button" data-bookmarks aria-label="Закладки">☷</button><button type="button" data-external aria-label="Открыть отдельно">↗</button><button type="button" data-close aria-label="Закрыть браузер">Готово</button></footer>
<div class="seyveo-browser-sheet" hidden><div class="seyveo-browser-sheet-bar"><strong>Избранное</strong><button type="button" data-dismiss>Готово</button></div><div data-bookmark-list></div></div>`;
// Embedded websites keep their sandbox; do not add allow-same-origin with allow-scripts.
document.body.append(root);
const manager=document.createElement('section');manager.className='seyveo-browser-manager';manager.hidden=true;manager.setAttribute('aria-label','Управление вкладками');manager.innerHTML='<div class="sb-manager-heading"><strong>Открытые вкладки</strong><span class="sb-manager-heading-actions"><button type="button" data-close-all>Закрыть все</button><button type="button" data-manager-new aria-label="Новая вкладка">＋</button></span></div><div class="sb-manager-list" data-manager-list></div><div class="sb-manager-heading sb-manager-recent-heading"><strong>Недавно закрытые</strong><span class="sb-manager-recent-actions"><button type="button" data-recent-all hidden>Показать все ›</button><button type="button" data-recent-clear hidden aria-label="Очистить недавно закрытые" title="Очистить список"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9.5 4h5M7.5 7l.7 13h7.6l.7-13M10 10v7m4-7v7"/></svg></button></span></div><div class="sb-manager-closed" data-manager-closed></div><div class="sb-manager-heading sb-manager-collections-heading"><strong>Коллекции</strong><button type="button" data-collection-new>Создать коллекцию ＋</button></div><div class="sb-manager-collections-list" data-manager-collections></div>';
root.append(manager);
const switcher=document.createElement('nav');switcher.className='sb-manager-switcher';switcher.setAttribute('aria-label','Разделы браузера');
const sections=[['tabs','Вкладки'],['favorites','Избранное'],['history','История'],['collections','Коллекции']];
const sectionPaths={
 tabs:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16H3a1 1 0 0 1-1-1V4a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v1"/>',
 favorites:'<path d="M6 4.5c0-1 .8-1.8 1.8-1.8h8.4c1 0 1.8.8 1.8 1.8V21l-6-4-6 4z"/>',
 history:'<circle cx="12" cy="12" r="9"/><path d="M12 6.5v6l4.2 2.7"/>',
 collections:'<path d="m12 2 9 5-9 5-9-5 9-5zm-9 10 9 5 9-5M3 17l9 5 9-5"/>'
};
let managerSection='tabs';
for(const [id,label] of sections){const button=document.createElement('button');button.type='button';button.dataset.section=id;button.innerHTML='<span class="sb-switch-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+sectionPaths[id]+'</svg></span><span>'+label+'</span>';button.addEventListener('click',()=>{if(id==='history')showManagerHistory=false;managerSection=id;renderManager()});switcher.append(button)}
// Put the ORIGINAL four-part switcher beside the search field in the same
// root flex slot. Toggling which one is visible guarantees matching geometry.
root.querySelector('.seyveo-browser-bar').after(switcher);
switcher.hidden=true;
const tabsPanel=document.createElement('div');tabsPanel.className='sb-manager-tabs-panel';
while(manager.firstChild)tabsPanel.append(manager.firstChild);
manager.append(tabsPanel);
const secondary=document.createElement('div');secondary.className='sb-manager-secondary';manager.append(secondary);
const notice=root.querySelector('.seyveo-browser-blocked');
// Styling belongs to the Browser stylesheet so all three native themes apply.
const embedExplanation=notice.querySelector('p');
const $=s=>root.querySelector(s),input=$('input'),frame=$('iframe'),tabArea=$('[data-tabs]'),sheet=$('.seyveo-browser-sheet');
const sitebar=$('.sb-browser-sitebar'),siteMenu=$('[data-site-menu-panel]'),siteMenuButton=$('[data-site-menu]');
function closeSiteMenu(){siteMenu.hidden=true;siteMenuButton.setAttribute('aria-expanded','false')}
let tabs=[{id:1,entries:[],position:-1}],active=1,nextId=2,displayedTab=null;
let managerOpen=false;let recentlyClosed=[];let allClosedShown=false;let openCollection=null;let managerMenuId=null;let creatingCollection=false;let collectionMenuId=null;let renamingCollectionId=null;let confirmCollectionDeleteId=null;let templateMenuName=null;
const key='seyveo-browser-bookmarks-v1';
const collectionsKey='seyveo-browser-collections-v1';
const sessionKey='seyveo-browser-session-v1';
function restoreSession(){try{const s=JSON.parse(localStorage.getItem(sessionKey)||'null');if(!s||!Array.isArray(s.tabs))return;const items=s.tabs.slice(0,20).filter(t=>t&&Number.isInteger(t.id)&&Array.isArray(t.entries)).map(t=>{const entries=t.entries.filter(u=>typeof u==='string'&&secureUrl(u)).slice(0,40);return{id:t.id,entries,position:Math.max(-1,Math.min(Number.isInteger(t.position)?t.position:-1,entries.length-1))}});if(items.length){tabs=items;active=tabs.some(t=>t.id===s.active)?s.active:tabs[0].id;nextId=Math.max(...tabs.map(t=>t.id),0)+1}if(Array.isArray(s.closed))recentlyClosed=s.closed.map(normalizeClosed).filter(Boolean).slice(0,25)}catch{}}
function persistSession(){try{localStorage.setItem(sessionKey,JSON.stringify({tabs,active,closed:recentlyClosed}))}catch{}}

let showAllHistory=false;
let showManagerHistory=false;
let expandedHistory=null;
const historyKey='seyveo-browser-history-v1';
const historyTimesKey='seyveo-browser-history-times-v1';
function historyItems(){try{const a=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&secureUrl(x)).slice(0,24):[]}catch{return []}}
function historyTimes(){
 try{
  const values=JSON.parse(localStorage.getItem(historyTimesKey)||'{}');
  if(!values||typeof values!=='object'||Array.isArray(values))return {};
  const out={};
  for(const [url,when] of Object.entries(values)){
   if(secureUrl(url)&&Number.isFinite(when)&&when>0&&when<=Date.now()+60000)out[url]=when;
  }
  return out;
 }catch{return {}}
}
function saveHistoryTimes(values){try{localStorage.setItem(historyTimesKey,JSON.stringify(values))}catch{}}
function remember(url){
 try{
  const urls=[url,...historyItems().filter(x=>x!==url)].slice(0,24);
  localStorage.setItem(historyKey,JSON.stringify(urls));
  const times=historyTimes();times[url]=Date.now();
  saveHistoryTimes(Object.fromEntries(urls.filter(x=>times[x]).map(x=>[x,times[x]])));
 }catch{}
}
function removeHistory(url){
 try{localStorage.setItem(historyKey,JSON.stringify(historyItems().filter(x=>x!==url)))}catch{}
 const times=historyTimes();delete times[url];saveHistoryTimes(times);
 if(expandedHistory===url)expandedHistory=null;
}
function clearHistory(){
 try{localStorage.removeItem(historyKey);localStorage.removeItem(historyTimesKey)}catch{}
 expandedHistory=null;showAllHistory=false;showManagerHistory=false;
}
function historyDate(when){
 if(!when)return 'Дата не сохранена';
 return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(when));
}
function historyDay(when){
 if(!when)return 'Без даты';
 const visited=new Date(when),today=new Date();
 if(visited.toDateString()===today.toDateString())return 'Сегодня';
 const yesterday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-1);
 if(visited.toDateString()===yesterday.toDateString())return 'Вчера';
 return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(visited);
}
function secureUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
function target(value){let s=String(value||'').trim();if(!s)return null;if(/^https?:\/\//i.test(s))return secureUrl(s);if(/^([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(s))return secureUrl('https://'+s);return 'https://yandex.ru/search/?text='+encodeURIComponent(s)}
function current(){return tabs.find(t=>t.id===active)}
function currentUrl(){const t=current();return t.entries[t.position]||null}
function saved(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&secureUrl(x)).slice(0,60):[]}catch{return []}}
function store(a){try{localStorage.setItem(key,JSON.stringify(a.slice(0,60)))}catch{}}
function getCollections(){try{const data=JSON.parse(localStorage.getItem(collectionsKey)||'[]');return Array.isArray(data)?data.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&Array.isArray(x.urls)).slice(0,30).map(x=>({id:x.id,name:x.name.slice(0,42),urls:x.urls.filter(u=>typeof u==='string'&&secureUrl(u)).slice(0,100)})):[]}catch{return []}}
function putCollections(items){try{localStorage.setItem(collectionsKey,JSON.stringify(items.slice(0,30)))}catch{}}

function collectionCover(collection){
 const cover=document.createElement('span');cover.className='sb-collection-cover';cover.setAttribute('aria-hidden','true');
 const travel=/путеш|travel|поезд|горы|туризм|природ|отдых|vacation|trip/i.test(collection.name);
 cover.classList.add(travel?'sb-collection-cover-travel':'sb-collection-cover-inspiration');
 cover.innerHTML=travel
 ?'<svg viewBox="0 0 72 72" focusable="false" aria-hidden="true"><defs><linearGradient id="sbtravelSky" x1="0" y1="0" x2="0.7" y2="1"><stop stop-color="#f3d6b5"/><stop offset=".48" stop-color="#b0d2d2"/><stop offset="1" stop-color="#355c55"/></linearGradient><linearGradient id="sbtravelGround" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3b6d62"/><stop offset="1" stop-color="#102b29"/></linearGradient></defs><rect width="72" height="72" rx="12" fill="url(#sbtravelSky)"/><circle cx="55" cy="17" r="10" fill="#e9eed5" opacity=".48"/><path d="M-6 57 25 21 42 42 53 29 80 62v18H-6Z" fill="#42545c"/><path d="m25 21 9 12-8-3-8 4Z" fill="#e7ece9"/><path d="m53 29 8 11-10-5-7 4Z" fill="#dce8e7"/><path d="m-5 58 17-12 15 10 13-8 35 16v10H-5Z" fill="#2f5d59"/><path d="M0 60q22-8 37 0t35-1v13H0Z" fill="url(#sbtravelGround)"/><path d="M5 64q26-10 58 2" stroke="#b3dbca" stroke-width="1.3" opacity=".37" fill="none"/></svg>'
 :'<svg viewBox="0 0 72 72" focusable="false" aria-hidden="true"><defs><linearGradient id="sbinspireCard" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#65e5c4"/><stop offset=".58" stop-color="#138b77"/><stop offset="1" stop-color="#054e4b"/></linearGradient></defs><rect width="72" height="72" rx="12" fill="#092d29"/><rect x="29" y="11" width="33" height="47" rx="5" fill="#8ca8ba" opacity=".48" transform="rotate(-7 45 34)"/><rect x="22" y="14" width="34" height="49" rx="5" fill="#5b93a0" opacity=".77" transform="rotate(2 39 39)"/><rect x="13" y="17" width="35" height="47" rx="5" fill="url(#sbinspireCard)"/><path d="M21 23h17v22L30 40l-9 5z" fill="#adffe4" opacity=".22"/><path d="M19 54h24" stroke="#b6ffe5" stroke-opacity=".33" stroke-width="1.5"/></svg>';
 return cover;
}
function collectionCount(n){
 const mod=n%10,group=n%100;
 return n+' '+(group>=11&&group<=14?'страниц':mod===1?'страница':mod>=2&&mod<=4?'страницы':'страниц');
}
function makeCollectionCard(collection){
 const id=collection.id,card=document.createElement('article');card.className='sb-manager-collection-tile';card.dataset.collectionId=id;
 if(collectionMenuId===id)card.classList.add('is-menu-open');
 const open=document.createElement('button');open.type='button';open.className='sb-collection-open';open.setAttribute('aria-label','Открыть коллекцию '+collection.name);
 const cover=collectionCover(collection),words=document.createElement('span');words.className='sb-collection-summary';
 const title=document.createElement('strong');title.textContent=collection.name;const count=document.createElement('small');count.textContent=collectionCount(collection.urls.length);
 words.append(title,count);open.append(cover,words);
 open.addEventListener('click',()=>{collectionMenuId=null;renamingCollectionId=null;confirmCollectionDeleteId=null;managerSection='collections';openCollection=id;renderManager()});
 const more=document.createElement('button');more.type='button';more.className='sb-collection-more';more.textContent='⋮';more.setAttribute('aria-label','Действия с коллекцией '+collection.name);more.setAttribute('aria-expanded',String(collectionMenuId===id));
 more.addEventListener('click',()=>{collectionMenuId=collectionMenuId===id?null:id;renamingCollectionId=null;confirmCollectionDeleteId=null;renderManager()});
 card.append(open,more);
 if(collectionMenuId!==id)return card;
 const panel=document.createElement('div');panel.className='sb-collection-quick-actions';
 if(renamingCollectionId===id){
  const form=document.createElement('form');form.className='sb-collection-rename-form';const input=document.createElement('input');input.type='text';input.className='sb-collection-rename-input';input.maxLength=42;input.value=collection.name;input.setAttribute('aria-label','Новое название коллекции');
  const submit=document.createElement('button');submit.type='submit';submit.textContent='Сохранить';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Отмена';cancel.addEventListener('click',()=>{renamingCollectionId=null;renderManager()});
  form.addEventListener('submit',event=>{event.preventDefault();const name=input.value.trim();if(!name)return;putCollections(getCollections().map(item=>item.id===id?{...item,name:name.slice(0,42)}:item));renamingCollectionId=null;collectionMenuId=null;renderManager()});
  form.append(input,submit,cancel);panel.append(form);
 }else if(confirmCollectionDeleteId===id){
  const warning=document.createElement('span');warning.className='sb-collection-confirm-label';warning.textContent='Удалить коллекцию?';
  const yes=document.createElement('button');yes.type='button';yes.textContent='Удалить';yes.addEventListener('click',()=>{putCollections(getCollections().filter(item=>item.id!==id));collectionMenuId=null;confirmCollectionDeleteId=null;if(openCollection===id)openCollection=null;renderManager()});
  const no=document.createElement('button');no.type='button';no.textContent='Отмена';no.addEventListener('click',()=>{confirmCollectionDeleteId=null;renderManager()});panel.append(warning,yes,no);
 }else{
  const rename=document.createElement('button');rename.type='button';rename.textContent='Переименовать';rename.addEventListener('click',()=>{renamingCollectionId=id;renderManager();manager.querySelector('.sb-collection-rename-input')?.focus()});
  const remove=document.createElement('button');remove.type='button';remove.textContent='Удалить';remove.addEventListener('click',()=>{confirmCollectionDeleteId=id;renderManager()});
  panel.append(rename,remove);
 }
 card.append(panel);return card;
}

function createStarterCollection(name){
 const collections=getCollections();
 const existing=collections.find(item=>item.name===name);
 if(existing){openCollection=existing.id;managerSection='collections';templateMenuName=null;renderManager();return}
 if(collections.length>=30)return;
 const id=String(Date.now())+'-'+Math.random().toString(36).slice(2,6);
 collections.push({id,name,urls:[]});putCollections(collections);
 templateMenuName=null;managerSection='collections';openCollection=id;renderManager();
}
function makeStarterCollectionCard(name){
 const card=document.createElement('article');card.className='sb-manager-collection-tile sb-collection-starter';
 const open=document.createElement('button');open.type='button';open.className='sb-collection-open';open.setAttribute('aria-label','Создать коллекцию '+name);
 const cover=collectionCover({name}),words=document.createElement('span');words.className='sb-collection-summary';
 const title=document.createElement('strong');title.textContent=name;
 const subtitle=document.createElement('small');subtitle.textContent='Создать коллекцию';
 words.append(title,subtitle);open.append(cover,words);
 open.addEventListener('click',()=>createStarterCollection(name));
 const more=document.createElement('button');more.type='button';more.className='sb-collection-more';more.textContent='⋮';
 more.setAttribute('aria-label','Действия с образцом '+name);
 more.setAttribute('aria-expanded',String(templateMenuName===name));
 more.addEventListener('click',()=>{templateMenuName=templateMenuName===name?null:name;renderManager()});
 card.append(open,more);
 if(templateMenuName===name){
  const panel=document.createElement('div');panel.className='sb-collection-quick-actions';
  const create=document.createElement('button');create.type='button';create.textContent='Создать эту коллекцию';
  create.addEventListener('click',()=>createStarterCollection(name));
  panel.append(create);card.append(panel);
 }
 return card;
}
function makeCollection(){managerSection='collections';creatingCollection=true;renderManager();secondary.querySelector('.sb-collection-name')?.focus()}
function normalizeClosed(item){
 const url=typeof item==='string'?item:item&&typeof item.url==='string'?item.url:null;
 if(!url||!secureUrl(url))return null;
 const at=typeof item==='object'&&item&&Number.isFinite(item.closedAt)&&item.closedAt>0&&item.closedAt<=Date.now()?item.closedAt:null;
 return {url,closedAt:at};
}
function saveClosed(url){
 if(!url||!secureUrl(url))return;
 recentlyClosed=[{url,closedAt:Date.now()},...recentlyClosed.filter(item=>item.url!==url)].slice(0,25);
}
function closedAge(at){
 if(!at)return 'закрыта ранее';
 const minutes=Math.max(0,Math.floor((Date.now()-at)/60000));
 if(minutes<1)return 'только что';
 if(minutes<60)return minutes+' мин. назад';
 const hours=Math.floor(minutes/60);
 if(hours<24)return hours+' ч. назад';
 const days=Math.floor(hours/24);
 return days+' дн. назад';
}
function closedLabel(url){
 const host=new URL(url).hostname.toLowerCase();
 if(host==='www.youtube.com'||host==='youtube.com'||host==='m.youtube.com')return 'YouTube — видео';
 if(host==='notion.so'||host==='www.notion.so'||host==='notion.com'||host==='www.notion.com')return 'Notion — заметки и проекты';
 if(host==='airbnb.com'||host==='www.airbnb.com'||host.startsWith('airbnb.'))return 'Airbnb — путешествия';
 if(host==='ya.ru'||host==='yandex.ru'||host==='www.yandex.ru')return 'Яндекс — поиск';
 return siteName(url);
}
function closedBrand(url){
 const host=new URL(url).hostname.toLowerCase();
 if(host.includes('youtube.com')||host==='youtu.be')return ['youtube','▶'];
 if(host==='notion.so'||host.endsWith('.notion.so')||host==='notion.com')return ['notion','N'];
 if(host.includes('airbnb.'))return ['airbnb','♧'];
 if(host==='ya.ru'||host.includes('yandex.'))return ['yandex','Я'];
 if(host.includes('wikipedia.org'))return ['wikipedia','W'];
 return ['default','◎'];
}
function siteName(url){const host=new URL(url).hostname.replace(/^www\./,'');return host.includes('youtube.com')?'YouTube':host.includes('wikipedia.org')?'Wikipedia':host.includes('ya.ru')||host.includes('yandex.')?'Яндекс':host}
/* Local crisp vector marks. No third-party favicon requests or pixelated letter placeholders. */
const siteMarks=Object.freeze({
 youtube:'<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="1" y="7" width="38" height="26" rx="8" fill="#FF0033"/><path d="M16 13.5 28 20l-12 6.5z" fill="#fff"/></svg>',
 wikipedia:'<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="1" y="1" width="38" height="38" rx="10" fill="#202B33"/><text x="20" y="28" text-anchor="middle" font-family="Georgia,serif" font-size="27" font-weight="bold" fill="#fff">W</text></svg>',
 yandex:'<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="19" fill="#fff"/><text x="20" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="bold" fill="#171b1b">Я</text></svg>',
 habr:'<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="1" y="1" width="38" height="38" rx="8" fill="#238EBA"/><path d="M12 9h6v8h5V9h6v22h-6v-9h-5v9h-6z" fill="#fff"/></svg>',
 notion:'<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="2" y="2" width="36" height="36" rx="5" fill="#fff"/><path d="M11 10h18v20h-4L15 17v13h-4z" fill="#111"/></svg>'
});
function siteBrand(url){
 const host=new URL(url).hostname.toLowerCase().replace(/^www[.]/,'');
 if(host==='youtube.com'||host.endsWith('.youtube.com')||host==='youtu.be')return 'youtube';
 if(host==='wikipedia.org'||host.endsWith('.wikipedia.org'))return 'wikipedia';
 if(host==='ya.ru'||host==='yandex.ru'||host.endsWith('.yandex.ru')||host.endsWith('.yandex.com'))return 'yandex';
 if(host==='habr.com'||host.endsWith('.habr.com'))return 'habr';
 if(host==='notion.so'||host.endsWith('.notion.so')||host==='notion.com')return 'notion';
 return 'generic';
}
function paintSiteMark(element,url){
 const brand=siteBrand(url);
 element.classList.add('sb-site-logo','sb-logo-'+brand);
 if(siteMarks[brand])element.innerHTML=siteMarks[brand];
 else {
  const name=new URL(url).hostname.replace(/^www[.]/,'').split('.')[0];
  element.textContent=Array.from(name)[0]?.toUpperCase()||'•';
 }
 element.setAttribute('aria-hidden','true');
 return element;
}
function paintQuickSites(){
 root.querySelectorAll('.seyveo-browser-shortcuts button[data-site]').forEach(button=>{
  const mark=button.querySelector('.sb-site-mark');
  if(mark)paintSiteMark(mark,button.dataset.site);
 });
 const savedMark=root.querySelector('.seyveo-browser-shortcuts [data-bookmarks] .sb-saved');
 if(savedMark)savedMark.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3 2.6 5.8 6.4.7-4.8 4.3 1.3 6.2-5.5-3.2-5.5 3.2 1.3-6.2L3 9.5l6.4-.7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
}
function siteSymbol(url){const brand=siteBrand(url);return brand==='youtube'?'▶':brand==='wikipedia'?'W':brand==='yandex'?'Я':brand==='habr'?'H':'•'}
function closeTab(id){const t=tabs.find(x=>x.id===id);if(!t)return;allClosedShown=false;const u=t.entries[t.position];if(u)saveClosed(u);tabs=tabs.filter(x=>x.id!==id);if(!tabs.length)tabs=[{id:nextId++,entries:[],position:-1}];if(active===id)active=tabs[tabs.length-1].id;render()}
function tabManager(value=true){
 managerOpen=Boolean(value);
 if(!managerOpen){allClosedShown=false;showManagerHistory=false;} // Begin with folded Quiet Cinema stacks on re-entry.
 manager.hidden=!managerOpen;
 switcher.hidden=!managerOpen;
 // The logo is one DOM node, and the existing search / tabs controls now
 // occupy the identical top-level slot rather than separate scroll containers.
 root.classList.toggle('is-managing',managerOpen);
 root.classList.toggle('is-site-view',!managerOpen&&!!currentUrl());
 $('.seyveo-browser-home').hidden=false;
 if(managerOpen){manager.scrollTop=0;renderManager();}
}
function setTabDetails(card,expanded){
 card.classList.toggle('is-expanded',expanded);
 const head=card.querySelector('.sb-manager-select'),menu=card.querySelector('.sb-manager-more'),details=card.querySelector('.sb-tab-context');
 if(head)head.setAttribute('aria-expanded',String(expanded));
 if(menu)menu.setAttribute('aria-expanded',String(expanded));
 if(details){details.setAttribute('aria-hidden',String(!expanded));details.inert=!expanded}
}
function toggleTabDetails(id){
 managerMenuId=managerMenuId===id?null:id;
 manager.querySelectorAll('.sb-manager-card').forEach(card=>setTabDetails(card,Number(card.dataset.tabId)===managerMenuId));
}
/* Shared Quiet Cinema fold/reveal behavior: same gesture and accessibility in both lists. */
function syncQuietCinemaStack(list,toggle,slotSelector,expanded){
 const slots=list.querySelectorAll(slotSelector);
 const expandable=slots.length>1,isExpanded=expandable&&expanded;
 toggle.hidden=!expandable;
 toggle.textContent=isExpanded?'Свернуть':'Показать все ›';
 toggle.setAttribute('aria-expanded',String(isExpanded));
 list.classList.toggle('is-expanded',isExpanded);
 list.classList.toggle('is-collapsed',expandable&&!isExpanded);
 slots.forEach((slot,index)=>{
  // A real inner wrapper lets the 0fr ↔ 1fr animation follow card content
  // automatically. No measured max-height: it clipped History on some screens.
  if(slotSelector==='.sb-history-slot'&&!slot.firstElementChild?.classList.contains('sb-quiet-inner')){
   const inner=document.createElement('div');
   inner.className='sb-quiet-inner';
   while(slot.firstChild)inner.append(slot.firstChild);
   slot.append(inner);
  }
  const folded=index>0&&!isExpanded;
  slot.classList.toggle('is-folded',folded);
  slot.inert=folded;
  slot.setAttribute('aria-hidden',String(folded));
 });
 return slots.length;
}
function syncClosedStack(){
 const closed=manager.querySelector('[data-manager-closed]'),toggle=manager.querySelector('[data-recent-all]'),clear=manager.querySelector('[data-recent-clear]');
 closed.id='seyveoRecentlyClosedList';
 const count=syncQuietCinemaStack(closed,toggle,'.sb-closed-slot',allClosedShown);
 toggle.setAttribute('aria-controls',closed.id);
 clear.hidden=!count;
}
function renderManager(){
 switcher.querySelectorAll('button').forEach(button=>{const isActive=button.dataset.section===managerSection;button.classList.toggle('is-selected',isActive);button.setAttribute('aria-pressed',String(isActive))});
 const tabLabel=switcher.querySelector('[data-section="tabs"] span:nth-child(2)');tabLabel.textContent='Вкладки';
 const count=switcher.querySelector('[data-section="tabs"] .sb-switch-count')||document.createElement('span');count.className='sb-switch-count';count.textContent=String(tabs.length);switcher.querySelector('[data-section="tabs"]').append(count);
 tabsPanel.hidden=managerSection!=='tabs';secondary.hidden=managerSection==='tabs';
 if(managerSection!=='tabs'){renderSecondary();return}
 const list=manager.querySelector('[data-manager-list]'),closed=manager.querySelector('[data-manager-closed]'),collections=manager.querySelector('[data-manager-collections]');
 list.replaceChildren();closed.replaceChildren();collections.replaceChildren();
 for(const t of tabs){
  const url=t.entries[t.position],item=document.createElement('article');item.className='sb-manager-card'+(t.id===active?' is-current':'');
  item.dataset.tabId=String(t.id);
  const select=document.createElement('button');select.type='button';select.className='sb-manager-select';
  const detailsId='sb-tab-details-'+t.id;
  select.setAttribute('aria-controls',detailsId);
  select.setAttribute('aria-expanded',String(managerMenuId===t.id));
  select.setAttribute('aria-label',(url?siteName(url):'Новая вкладка')+' — действия');
  const preview=document.createElement('span');preview.className='sb-tab-preview '+(url?'sb-preview-'+(new URL(url).hostname.includes('youtube')?'video':new URL(url).hostname.includes('wikipedia')?'reference':new URL(url).hostname.includes('yandex')?'search':'web'):'sb-preview-empty');
  const previewMark=document.createElement('span');if(url)paintSiteMark(previewMark,url);else previewMark.textContent='＋';preview.append(previewMark);
  const body=document.createElement('span');body.className='sb-tab-body';
  const title=document.createElement('strong');title.textContent=url?siteName(url):'Новая вкладка';
  const domain=document.createElement('small');domain.className='sb-tab-domain';domain.textContent=url?new URL(url).hostname.replace(/^www[.]/,''):'Начать просмотр';
  const status=document.createElement('small');status.className='sb-tab-status'+(t.id===active?' is-active':'');status.textContent=t.id===active?'● Активная вкладка':'● Открыта';
  body.append(title,domain,status);select.append(preview,body);
  const tools=document.createElement('span');tools.className='sb-manager-card-tools';
  const x=document.createElement('button');x.type='button';x.className='sb-manager-close';x.textContent='×';x.setAttribute('aria-label','Закрыть вкладку');x.addEventListener('click',()=>closeTab(t.id));
  const more=document.createElement('button');more.type='button';more.className='sb-manager-more';more.textContent='⋮';more.setAttribute('aria-label','Действия с вкладкой');more.setAttribute('aria-controls',detailsId);more.setAttribute('aria-expanded',String(managerMenuId===t.id));
  select.addEventListener('click',()=>toggleTabDetails(t.id));
  more.addEventListener('click',()=>toggleTabDetails(t.id));
  tools.append(x,more);item.append(select,tools);
  const actions=document.createElement('div');actions.className='sb-tab-context';actions.id=detailsId;
  const inner=document.createElement('div');inner.className='sb-tab-context-inner';
  const action=(label,handler,disabled=false)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=disabled;button.addEventListener('click',handler);inner.append(button);return button};
  action('Открыть',()=>{active=t.id;managerMenuId=null;tabManager(false);render()});
  const bookmark=action(url&&saved().includes(url)?'Убрать из закладок':'☆ В закладки',()=>{if(!url)return;const list=saved();const exists=list.includes(url);store(exists?list.filter(link=>link!==url):[url,...list]);bookmark.textContent=exists?'☆ В закладки':'Убрать из закладок'},!url);
  action('Закрыть',()=>closeTab(t.id));
  actions.append(inner);item.append(actions);
  setTabDetails(item,managerMenuId===t.id);
  list.append(item);
 }
 if(!recentlyClosed.length){
  const empty=document.createElement('div');empty.className='sb-closed-empty';
  const mark=document.createElement('span');mark.className='sb-closed-empty-icon';mark.textContent='◷';
  const hint=document.createElement('span');hint.textContent='Закрой вкладку — здесь её можно будет восстановить';
  empty.append(mark,hint);closed.append(empty);
 }
 for(const [position,entry] of recentlyClosed.entries()){
  const url=entry.url;
  const slot=document.createElement('div');slot.className='sb-closed-slot';
  slot.style.setProperty('--sb-closed-order',String(Math.min(position,6)));
  const row=document.createElement('div');row.className='sb-manager-closed-row';
  const icon=document.createElement('span');const brand=closedBrand(url);icon.className='sb-closed-icon sb-closed-icon-'+brand[0];paintSiteMark(icon,url);
  const body=document.createElement('button');body.type='button';body.className='sb-closed-content';
  const title=document.createElement('strong');title.textContent=closedLabel(url);
  const sub=document.createElement('small');const domain=new URL(url).hostname.replace(/^www[.]/,'');
  sub.textContent=domain+' · '+closedAge(entry.closedAt);
  body.append(title,sub);
  const restore=document.createElement('button');restore.type='button';restore.className='sb-closed-restore';
  restore.textContent='↶';restore.setAttribute('aria-label','Восстановить '+siteName(url));restore.title='Восстановить страницу';
  const restorePage=()=>{recentlyClosed=recentlyClosed.filter(x=>x.url!==url);const t={id:nextId++,entries:[url],position:0};tabs.push(t);active=t.id;tabManager(false);render()};
  restore.addEventListener('click',restorePage);body.addEventListener('click',restorePage);
  const remove=document.createElement('button');remove.type='button';remove.className='sb-closed-delete';
  remove.setAttribute('aria-label','Удалить из недавно закрытых: '+siteName(url));
  remove.title='Удалить запись';remove.textContent='×';
  remove.addEventListener('click',()=>{
   recentlyClosed=recentlyClosed.filter(x=>x.url!==url);
   if(recentlyClosed.length<2)allClosedShown=false;
   persistSession();renderManager();
  });
  row.append(icon,body,restore,remove);slot.append(row);closed.append(slot);
 }
 syncClosedStack();
 const entries=getCollections();
 for(const collection of entries)collections.append(makeCollectionCard(collection));
 const starterNames=['Вдохновение','Путешествия'];
 const hasStarter=entries.some(item=>starterNames.includes(item.name));
 if(!entries.length||hasStarter){
  for(const name of starterNames){
   if(!entries.some(item=>item.name===name))collections.append(makeStarterCollectionCard(name));
  }
 }
}
function renderSecondary(){
 secondary.replaceChildren();
 secondary.classList.toggle('is-history',managerSection==='history');
 const header=document.createElement('div');header.className='sb-secondary-header';const heading=document.createElement('h3');heading.textContent=managerSection==='favorites'?'Избранное':managerSection==='history'?'История':'Коллекции';header.append(heading);secondary.append(header);
 if(managerSection==='collections'){
  const add=document.createElement('button');add.type='button';add.textContent='＋ Новая коллекция';add.addEventListener('click',makeCollection);header.append(add);
  if(creatingCollection){const form=document.createElement('form');form.className='sb-collection-create';const field=document.createElement('input');field.type='text';field.className='sb-collection-name';field.maxLength=42;field.required=true;field.placeholder='Название коллекции';field.setAttribute('aria-label','Название коллекции');const save=document.createElement('button');save.type='submit';save.textContent='Создать';const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Отмена';cancel.addEventListener('click',()=>{creatingCollection=false;renderManager()});form.addEventListener('submit',event=>{event.preventDefault();const name=field.value.trim();if(!name)return;const items=getCollections();if(items.length>=30)return;const id=String(Date.now())+'-'+Math.random().toString(36).slice(2,6);items.push({id,name,urls:[]});putCollections(items);creatingCollection=false;openCollection=id;renderManager()});form.append(field,save,cancel);secondary.append(form)}
  const items=getCollections();
  if(!items.length){const templates=document.createElement('div');templates.className='sb-manager-collections-list';templates.append(makeStarterCollectionCard('Вдохновение'),makeStarterCollectionCard('Путешествия'));secondary.append(templates)}
  for(const collection of items){
   const group=document.createElement('section');group.className='sb-collection-group';
   const trigger=document.createElement('button');trigger.className='sb-collection-trigger';trigger.type='button';trigger.textContent=collection.name+' · '+collection.urls.length+' стр.';trigger.addEventListener('click',()=>{openCollection=openCollection===collection.id?null:collection.id;renderManager()});group.append(trigger);
   if(openCollection===collection.id){
    const content=document.createElement('div');content.className='sb-collection-content';
    for(const link of collection.urls){const row=document.createElement('div');row.className='sb-collection-link';const jump=document.createElement('button');jump.type='button';jump.textContent=siteName(link);jump.addEventListener('click',()=>{tabManager(false);navigate(link)});const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Убрать из коллекции');remove.addEventListener('click',()=>{putCollections(getCollections().map(x=>x.id===collection.id?{...x,urls:x.urls.filter(u=>u!==link)}:x));renderManager()});row.append(jump,remove);content.append(row)}
    const choices=saved().filter(x=>!collection.urls.includes(x));if(choices.length){const addRow=document.createElement('div');addRow.className='sb-collection-add';const select=document.createElement('select');select.setAttribute('aria-label','Добавить закладку');for(const link of choices){const option=document.createElement('option');option.value=link;option.textContent=siteName(link);select.append(option)}const button=document.createElement('button');button.type='button';button.textContent='Добавить';button.addEventListener('click',()=>{putCollections(getCollections().map(x=>x.id===collection.id?{...x,urls:[...x.urls,select.value]}:x));renderManager()});addRow.append(select,button);content.append(addRow)}else if(!collection.urls.length){const p=document.createElement('p');p.className='sb-manager-empty';p.textContent='Сначала сохрани сайт в Избранное, чтобы добавить его сюда';content.append(p)}
    const del=document.createElement('button');del.type='button';del.className='sb-collection-delete';del.textContent='Удалить коллекцию';del.addEventListener('click',()=>{putCollections(getCollections().filter(x=>x.id!==collection.id));openCollection=null;renderManager()});content.append(del);group.append(content)
   }
   secondary.append(group);
  }
  return
 }
 if(managerSection==='history'){
  const links=historyItems(),times=historyTimes();
  const controls=document.createElement('span');controls.className='sb-history-heading-actions';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='sb-history-show-all';
  toggle.textContent='Показать все ›';toggle.hidden=links.length<2;
  toggle.setAttribute('aria-controls','seyveoBrowserVisitHistoryList');
  toggle.setAttribute('aria-expanded',String(showManagerHistory));
  toggle.addEventListener('click',()=>{
   showManagerHistory=!showManagerHistory;
   syncQuietCinemaStack(historyList,toggle,'.sb-history-slot',showManagerHistory);
  });
  controls.append(toggle);
  if(links.length){
   const clear=document.createElement('button');clear.type='button';clear.className='sb-history-clear-all';
   clear.setAttribute('aria-label','Очистить историю');clear.title='Очистить историю';
   clear.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9.5 4h5M7.5 7l.7 13h7.6l.7-13M10 10v7m4-7v7"/></svg>';
   clear.addEventListener('click',()=>{
    if(!window.confirm('Удалить всю историю браузера SEYVEO? Вкладки и избранное останутся.'))return;
    clearHistory();renderManager();render();
   });
   controls.append(clear);
  }
  header.append(controls);
  if(!links.length){
   const hint=document.createElement('p');hint.className='sb-manager-empty';hint.textContent='История пока пуста';secondary.append(hint);
   return;
  }
  // Match the existing Recently Closed panel: one shared glass surface,
  // no separate card borders or gaps. The date label stays above the panel.
  const firstDay=historyDay(times[links[0]]||null);
  const dateHeading=document.createElement('div');dateHeading.className='sb-history-day';
  dateHeading.textContent=firstDay;secondary.append(dateHeading);
  const historyList=document.createElement('div');historyList.id='seyveoBrowserVisitHistoryList';
  historyList.className='sb-manager-history-list sb-manager-closed';secondary.append(historyList);
  let lastDay=firstDay;
  for(const [index,url] of links.entries()){
   const slot=document.createElement('div');slot.className='sb-history-slot';
   slot.style.setProperty('--sb-history-order',String(Math.min(index,6)));
   const time=times[url]||null,day=historyDay(time);
   if(day!==lastDay){
    const label=document.createElement('div');label.className='sb-history-day sb-history-day-inline';
    label.textContent=day;slot.append(label);lastDay=day;
   }
   const row=document.createElement('div');row.className='sb-history-entry';
   const open=document.createElement('button');open.type='button';open.className='sb-history-entry-open';
   open.setAttribute('aria-label','Открыть '+siteName(url));
   const icon=document.createElement('span');icon.className='sb-history-entry-icon';paintSiteMark(icon,url);
   const words=document.createElement('span');words.className='sb-history-entry-words';
   const title=document.createElement('strong');title.textContent=siteName(url);
   const line=document.createElement('span');line.className='sb-history-entry-meta';
   const host=document.createElement('small');host.textContent=new URL(url).hostname.replace(/^www[.]/,'');
   const clock=document.createElement('time');clock.textContent=time?new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(new Date(time)):'—';
   if(time)clock.dateTime=new Date(time).toISOString();
   clock.title=historyDate(time);
   line.append(host,clock);words.append(title,line);open.append(icon,words);
   open.addEventListener('click',()=>{tabManager(false);navigate(url)});
   const remove=document.createElement('button');remove.type='button';remove.className='sb-history-entry-delete';
   remove.setAttribute('aria-label','Удалить из истории: '+siteName(url));
   remove.title='Удалить запись';
   remove.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
   remove.addEventListener('click',()=>{removeHistory(url);if(historyItems().length<2)showManagerHistory=false;renderManager();render()});
   row.append(open,remove);slot.append(row);historyList.append(slot);
  }
  syncQuietCinemaStack(historyList,toggle,'.sb-history-slot',showManagerHistory);
  return;
 }
 const links=saved();
 if(!links.length){const hint=document.createElement('p');hint.className='sb-manager-empty';hint.textContent='Сохрани страницу в Избранное';secondary.append(hint)}
 for(const url of links){const row=document.createElement('button');row.type='button';row.className='sb-manager-secondary-link';const icon=document.createElement('span');paintSiteMark(icon,url);const words=document.createElement('span');const title=document.createElement('strong');title.textContent=siteName(url);const sub=document.createElement('small');sub.textContent=new URL(url).hostname.replace(/^www[.]/,'');words.append(title,sub);row.append(icon,words);row.addEventListener('click',()=>{tabManager(false);navigate(url)});secondary.append(row)}
}
/* Identical Quiet Cinema disclosure on the Browser start page. */
function syncHistoryStack(){
 const list=$('[data-continue-list]'),toggle=$('[data-history-toggle]'),clear=$('[data-history-clear]');
 const count=syncQuietCinemaStack(list,toggle,'.sb-history-slot',showAllHistory);
 if(count<2)showAllHistory=false;
 clear.hidden=!historyItems().length;
}
function render(){
 persistSession();
 const t=current(),url=currentUrl(),home=!url;if(managerOpen)renderManager();
 $('.seyveo-browser-home').hidden=false;
 root.classList.toggle('is-site-view',!home&&!managerOpen);
 $('.seyveo-browser-start').hidden=!home;$('.seyveo-browser-content').hidden=home;$('.seyveo-browser-tabs').hidden=home;
 input.value=url||'';
 // A static web demo cannot bypass X-Frame-Options / CSP frame-ancestors.
 // Sites that fail in the user's preview get a compact explanation, never a
 // full-height grey error iframe; a native app will require WebView integration.
 const embedHost=url?new URL(url).hostname.toLowerCase():'';
 const unsupportedEmbeds=new Set(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','ya.ru','www.ya.ru','yandex.ru','www.yandex.ru']);
 // The provided Habr-style reference is a DEMO only for this exact sample route.
 // Never substitute fabricated article text into another live website.
 const isDemo=!!url&&['habr.com','www.habr.com'].includes(embedHost)&&new URL(url).pathname.replace(/\/$/,'')==='/ru/company/design';
 const blocked=!!url&&!isDemo&&unsupportedEmbeds.has(embedHost);
 closeSiteMenu();sitebar.hidden=home||isDemo;
 if(url)$('[data-site-title]').textContent=siteBrand(url)==='habr'?'Хабр':siteName(url);
 $('[data-browser-demo]').hidden=!isDemo;
 notice.hidden=!blocked;
 $('.seyveo-browser-frame-note').hidden=home||blocked||isDemo;
 $('.seyveo-browser-content').classList.toggle('is-embed-unavailable',blocked);
 frame.hidden=home||blocked||isDemo;
 if(isDemo){frame.removeAttribute('src');displayedTab=null}
 else if(blocked){
  embedExplanation.textContent='Сайт '+embedHost+' не открывается внутри веб-демоверсии SEYVEO. Для полноценного встроенного просмотра потребуется нативный браузер приложения.';
  frame.removeAttribute('src');displayedTab=null;
 }else if(url){if(displayedTab!==active||frame.getAttribute('src')!==url){frame.src=url;displayedTab=active}}
 else{frame.removeAttribute('src');displayedTab=null}
 $('[data-back]').disabled=t.position<=0;$('[data-forward]').disabled=t.position>=t.entries.length-1;
 $('[data-bookmark]').disabled=!url;$('[data-external]').disabled=!url;
 $('[data-bookmark]').textContent=url&&saved().includes(url)?'★':'☆';
 document.dispatchEvent(new Event('seyveo:browser-state'));
 const items=historyItems();const contList=$('[data-continue-list]');contList.replaceChildren();
 const selected=items;
 if(!selected.length){const msg=document.createElement('p');msg.className='seyveo-browser-recent-empty';msg.textContent='Открой любой сайт — здесь появятся карточки для продолжения просмотра';contList.append(msg)}
 for(const [position,link] of selected.entries()){
  const url=new URL(link),host=url.hostname.replace(/^www\./,'');
  const name=host.includes('youtube.com')?'YouTube':host.includes('wikipedia.org')?'Wikipedia':host.includes('ya.ru')||host.includes('yandex.')?'Яндекс':host;
  const card=document.createElement('article');card.className='seyveo-browser-history-card';
  const head=document.createElement('button');head.type='button';head.className='seyveo-browser-history-head';head.setAttribute('aria-label','Открыть '+name);
  const logo=document.createElement('span');logo.className='seyveo-browser-history-logo';logo.setAttribute('aria-hidden','true');
  paintSiteMark(logo,link);
  const words=document.createElement('span');words.className='seyveo-browser-history-words';const title=document.createElement('strong');title.textContent=name;const sub=document.createElement('small');sub.textContent=host;words.append(title,sub);
  head.append(logo,words);head.addEventListener('click',()=>navigate(link));
  const menu=document.createElement('button');menu.type='button';menu.className='seyveo-browser-history-menu';menu.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';menu.setAttribute('aria-label','Действия с '+name);menu.setAttribute('aria-expanded',String(expandedHistory===link));menu.addEventListener('click',()=>{expandedHistory=expandedHistory===link?null:link;render()});
  const actions=document.createElement('div');actions.className='seyveo-browser-history-actions';actions.hidden=expandedHistory!==link;
  const action=(label,handler)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',handler);actions.append(button)};
  action(saved().includes(link)?'Убрать из закладок':'☆ В закладки',()=>{const list=saved();store(list.includes(link)?list.filter(x=>x!==link):[link,...list]);render()});
  action('Убрать из истории',()=>{removeHistory(link);render()});
  const top=document.createElement('div');top.className='seyveo-browser-history-top';top.append(head,menu);card.append(top,actions);
  const slot=document.createElement('div');slot.className='sb-history-slot';slot.style.setProperty('--sb-history-order',String(Math.min(position,6)));slot.append(card);contList.append(slot);
 }
 syncHistoryStack();
 const recentHome=root.querySelector('.sb-home-recent-tabs'),recentGrid=root.querySelector('[data-home-recent-tabs]');
 recentGrid.replaceChildren();
 const liveTabs=tabs.filter(tab=>tab.entries[tab.position]).slice().reverse();
 const recentEntries=liveTabs.map(tab=>({url:tab.entries[tab.position],tabId:tab.id}));
 for(const address of historyItems()){
  if(!recentEntries.some(entry=>entry.url===address))recentEntries.push({url:address,tabId:null});
 }
 recentHome.hidden=recentEntries.length===0;
 for(const entry of recentEntries){
  const address=entry.url,host=new URL(address).hostname.replace(/^www[.]/,''),name=siteName(address);
  const tile=document.createElement('article');tile.className='sb-home-recent-card';
  const jump=document.createElement('button');jump.type='button';jump.className='sb-home-recent-open';jump.setAttribute('aria-label','Открыть '+name);
  const mark=document.createElement('span');mark.className='sb-home-recent-symbol';paintSiteMark(mark,address);
  const info=document.createElement('span');info.className='sb-home-recent-info';
  const title=document.createElement('strong');title.textContent=name;
  const sub=document.createElement('small');sub.textContent=host;
  info.append(title,sub);jump.append(mark,info);
  jump.addEventListener('click',()=>{if(entry.tabId!==null){active=entry.tabId;render()}else navigate(address)});
  const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='sb-home-recent-close';
  closeButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';closeButton.setAttribute('aria-label',entry.tabId!==null?'Закрыть вкладку '+name:'Убрать из недавних '+name);
  closeButton.addEventListener('click',()=>{if(entry.tabId!==null){closeTab(entry.tabId)}else{removeHistory(address);render()}});
  tile.append(jump,closeButton);recentGrid.append(tile);
 }
 tabArea.replaceChildren();
 for(const item of tabs){const pill=document.createElement('span');pill.className='seyveo-browser-tab'+(item.id===active?' is-active':'');
  // Site-specific glass tint, based on known site branding, never on inaccessible page pixels.
  const tabAddress=item.entries[item.position];
  if(tabAddress){
   const siteHost=new URL(tabAddress).hostname.toLowerCase();
   const siteTint=siteHost.includes('wikipedia.org')?'#12161b'
    :siteHost.includes('ya.ru')||siteHost.includes('yandex.')?'#c9d9dc'
    :siteHost.includes('youtube.com')||siteHost==='youtu.be'?'#641923'
    :siteHost.includes('habr.com')?'#133c37'
    :null;
   if(siteTint)pill.style.setProperty('--sb-site-tint',siteTint);
   // Independent LED under the glass: a light source, not a coloured tab fill.
   const ledColor=siteHost.includes('wikipedia.org')?'#f3f7ff'
    :siteHost.includes('ya.ru')||siteHost.includes('yandex.')?'#f4d476'
    :siteHost.includes('youtube.com')||siteHost==='youtu.be'?'#ff4b62'
    :siteHost.includes('habr.com')?'#23e8ae'
    :null;
   if(ledColor)pill.style.setProperty('--sb-led-color',ledColor);
  }
  const choose=document.createElement('button');choose.type='button';choose.className='sb-browser-tab-select';
  const address=item.entries[item.position];
  if(address){
   const mark=document.createElement('span');mark.className='sb-browser-tab-mark';paintSiteMark(mark,address);
   const label=document.createElement('span');label.className='sb-browser-tab-name';
   const host=new URL(address).hostname.toLowerCase();
   label.textContent=host.includes('habr.com')?'Хабр':host.includes('wikipedia.org')?'Wikipedia':host.includes('ya.ru')||host.includes('yandex.')?'Яндекс':host.includes('youtube.com')?'YouTube':siteName(address);
   choose.append(mark,label);
  }else choose.textContent='Новая вкладка';
  choose.addEventListener('click',()=>{active=item.id;render()});
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Закрыть вкладку');close.addEventListener('click',()=>closeTab(item.id));
 pill.append(choose,close);tabArea.append(pill)}
 // Reserve three real interaction positions without pretending the user has
 // visited extra websites. Empty slots create a normal tab when tapped.
 for(let position=tabs.length;position<3;position++){
  const placeholder=document.createElement('span');placeholder.className='seyveo-browser-tab is-placeholder';
  const create=document.createElement('button');create.type='button';
  create.className='sb-browser-tab-select';create.setAttribute('aria-label','Создать вкладку '+(position+1));
  const icon=document.createElement('span');icon.className='sb-browser-tab-empty-mark';icon.setAttribute('aria-hidden','true');
  icon.innerHTML='<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7zM14 3v5h5"/></svg>';
  const label=document.createElement('span');label.className='sb-browser-tab-name';label.textContent='Новая вкладка';
  create.append(icon,label);
  create.addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;render();input.focus()});
  placeholder.append(create);tabArea.append(placeholder);
 }
}
function navigate(value){const url=secureUrl(value);if(!url)return false;const t=current();t.entries=t.entries.slice(0,t.position+1);t.entries.push(url);t.position++;remember(url);render();return true}
/* One existing Sayvi, one original dock: temporarily hide Browser without
   tearing down the iframe so its current page and scroll can be restored. */
let suspendedForSayvi=false;
function resumeAfterSayvi(){
 if(!suspendedForSayvi)return false;
 suspendedForSayvi=false;
 if(!root.hidden)return false;
 root.hidden=false;
 document.body.classList.add('seyveo-browser-open');
 document.dispatchEvent(new Event('seyveo:browser-open'));
 return true;
}
function askSayvi(){
 if(root.hidden||typeof window.SEYVEO_CONVERSATION?.open!=='function')return false;
 const url=currentUrl();
 if(managerOpen)tabManager(false);
 suspendedForSayvi=true;
 root.hidden=true;
 document.body.classList.remove('seyveo-browser-open');
 document.dispatchEvent(new Event('seyveo:browser-close'));
 window.SEYVEO_CONVERSATION.open();
 if(!document.documentElement.classList.contains('seyveo-conversation')){
  resumeAfterSayvi();
  return false;
 }
 // Share only the public host as editable context, never query tokens or page
 // contents. Cross-origin article text cannot be read from our sandboxed iframe.
 if(url){
  const host=new URL(url).hostname.replace(/^www[.]/,'');
  const field=document.getElementById('question');
  if(field&&!field.value.trim()){
   field.value='Я открыл сайт '+host+'. Помоги мне разобраться: ';
   field.dispatchEvent(new Event('input',{bubbles:true}));
  }
  window.SEYVEO_CONVERSATION.status?.('Браузер · '+host+' · для разбора статьи добавь её текст',8500);
 }else window.SEYVEO_CONVERSATION.status?.('Браузер · Сэйви на связи',2500);
 return true;
}
/* Voice commands reuse the one microphone and existing browser navigation.
   A public search is only opened after an explicit spoken search request. */
function browserVoiceCommand(transcript){
 if(root.hidden)return false;
 const phrase=String(transcript||'').trim().slice(0,400);
 if(!phrase)return true;
 const intent=phrase.replace(/^(?:сэйви|сейви|seyveo)[,!\s]+/i,'').trim();
 const search=intent.match(/^(?:найди|поищи|ищи|загугли|поиск(?:ать)?|найти)\s+(.+)$/iu);
 if(search){
  const query=search[1].trim();
  // Private context must never be silently sent to a public search engine.
  const privateQuery=/(?:парол|паспорт|договор|переписк|зарплат|клиент|сотрудник|(?:^|\s)(?:мой|моя|моё|мои|наши|наш)(?:\s|$))/iu.test(query);
  if(query&&!privateQuery){navigate(target(query));return true;}
 }
 const open=intent.match(/^(?:открой|открыть|перейди\s+на|зайди\s+на)\s+(.+)$/iu);
 if(open){
  const destination=open[1].trim().replace(/[.!?]+$/,'');
  const known={
   'ютуб':'https://www.youtube.com','youtube':'https://www.youtube.com',
   'яндекс':'https://ya.ru','yandex':'https://ya.ru',
   'википедию':'https://www.wikipedia.org','википедия':'https://www.wikipedia.org',
   'wikipedia':'https://www.wikipedia.org'
  };
  const named=known[destination.toLowerCase()];
  const link=named||(/^https?:\/\//i.test(destination)||/^(?:[\w-]+\.)+[a-z]{2,}(?:\/.*)?$/i.test(destination)?target(destination):null);
  if(link){navigate(link);return true;}
 }
 // For questions and unrecognized commands, use the real Feather Chat.
 // Never invent an answer or silently send an unrelated web query.
 if(askSayvi()){
  const field=document.getElementById('question');
  if(field){
   const old=field.value.trim();
   if(!old||/^Я открыл сайт [^.\s]+(?:\.[^.\s]+)+\. Помоги мне разобраться:\s*$/.test(old)){
    field.value=phrase;
    field.dispatchEvent(new Event('input',{bubbles:true}));
   }
  }
 }
 return true;
}
function browserVoiceUnavailable(message){
 if(root.hidden)return false;
 if(askSayvi())window.SEYVEO_CONVERSATION?.status?.(String(message||'Голосовой ввод недоступен. Напиши Сэйви в чате.'),6000);
 return true;
}
document.addEventListener('seyveo:conversation-close',resumeAfterSayvi);
function open(value){if(value&&!secureUrl(value))return false;suspendedForSayvi=false;root.hidden=false;document.body.classList.add('seyveo-browser-open');sheet.hidden=true;if(value)navigate(value);else render();document.dispatchEvent(new Event('seyveo:browser-open'));return true}
function close(){suspendedForSayvi=false;showAllHistory=false;expandedHistory=null;tabManager(false);root.hidden=true;sheet.hidden=true;document.body.classList.remove('seyveo-browser-open');frame.removeAttribute('src');displayedTab=null;document.dispatchEvent(new Event('seyveo:browser-close'))}
/* The dock house means SEYVEO Home, not Browser's internal blank tab.
   Keep all tab entries in the existing session for the next Browser visit. */
function goToSeyveoHome(){
 if(root.hidden)return false;
 close();
 document.getElementById('navHome')?.click();
 return true;
}
/* iOS back gesture from the left screen edge. Respect the two swipe rails and
   vertical scrolling. Embedded cross-origin pages must use native platform Back. */
let edgeSwipe=null;
root.addEventListener('touchstart',event=>{
 edgeSwipe=null;
 if(root.hidden||event.touches.length!==1)return;
 const touch=event.touches[0],target=event.target;
 if(touch.clientX>26||target.closest('input,textarea,select,.sb-home-recent-grid,.seyveo-browser-shortcuts'))return;
 edgeSwipe={x:touch.clientX,y:touch.clientY};
},{passive:true});
root.addEventListener('touchend',event=>{
 if(!edgeSwipe||root.hidden||event.changedTouches.length!==1)return;
 const start=edgeSwipe;edgeSwipe=null;
 const touch=event.changedTouches[0],dx=touch.clientX-start.x,dy=touch.clientY-start.y;
 if(dx<75||Math.abs(dy)>45||Math.abs(dy)>dx*.5)return;
 if(!sheet.hidden){sheet.hidden=true;return}
 if(managerOpen){tabManager(false);return}
 close();
},{passive:true});
root.addEventListener('touchcancel',()=>{edgeSwipe=null},{passive:true});
function bookmarks(){const list=saved(),holder=$('[data-bookmark-list]');holder.replaceChildren();if(!list.length){holder.textContent='Пока пусто. Открой страницу и нажми ☆.'}for(const url of list){const b=document.createElement('button');b.type='button';b.textContent=new URL(url).hostname;b.addEventListener('click',()=>{sheet.hidden=true;navigate(url)});holder.append(b)}sheet.hidden=false}
manager.querySelector('[data-recent-all]').addEventListener('click',()=>{allClosedShown=!allClosedShown;syncClosedStack()});
manager.querySelector('[data-recent-clear]').addEventListener('click',()=>{
 if(!recentlyClosed.length)return;
 if(!window.confirm('Очистить список недавно закрытых вкладок? Открытые вкладки, история и избранное останутся.'))return;
 recentlyClosed=[];allClosedShown=false;persistSession();renderManager();
});
manager.querySelector('[data-collection-new]').addEventListener('click',makeCollection);
manager.querySelector('[data-manager-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;tabManager(false);render();input.focus()});
manager.querySelector('[data-close-all]').addEventListener('click',()=>{allClosedShown=false;for(const t of tabs){const u=t.entries[t.position];if(u)saveClosed(u)}tabs=[{id:nextId++,entries:[],position:-1}];active=tabs[0].id;render()});
root.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
root.querySelectorAll('[data-bookmarks]').forEach(b=>b.addEventListener('click',bookmarks));
$('[data-dismiss]').addEventListener('click',()=>sheet.hidden=true);
$('[data-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;render();input.focus()});
siteMenuButton.addEventListener('click',()=>{
 const opening=siteMenu.hidden;
 siteMenu.hidden=!opening;
 siteMenuButton.setAttribute('aria-expanded',String(opening));
});
$('[data-site-search]').addEventListener('click',()=>{closeSiteMenu();input.focus();input.select()});
siteMenu.querySelectorAll('[data-site-action]').forEach(button=>button.addEventListener('click',()=>{
 const action=button.dataset.siteAction;closeSiteMenu();
 if(action==='home'){$('[data-home]').click();return}
 if(['tabs','favorites','history'].includes(action)){managerSection=action;tabManager(true)}
}));
root.addEventListener('click',event=>{
 if(!siteMenu.hidden&&!event.target.closest('.sb-browser-sitebar'))closeSiteMenu();
});
$('[data-back]').addEventListener('click',()=>{const t=current();if(t.position>0){t.position--;render()}});
$('[data-forward]').addEventListener('click',()=>{const t=current();if(t.position<t.entries.length-1){t.position++;render()}});
$('[data-home]').addEventListener('click',()=>{const t=current();t.entries=[];t.position=-1;render()});
$('[data-external]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});

$('[data-bookmark]').addEventListener('click',()=>{const url=currentUrl();if(!url)return;const a=saved();store(a.includes(url)?a.filter(x=>x!==url):[url,...a]);render()});

$('[data-open-blocked]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});
$('[data-frame-external]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});
$('[data-history-toggle]').addEventListener('click',()=>{showAllHistory=!showAllHistory;syncHistoryStack()});
$('[data-history-clear]').addEventListener('click',()=>{
 if(!historyItems().length)return;
 if(!window.confirm('Очистить историю просмотра? Записи исчезнут и из раздела «История». Открытые вкладки и избранное останутся.'))return;
 clearHistory();render();
});
/* Native magnetic snapping for swipes; the label opens the existing full tab manager. */
$('[data-open-tab-manager]').addEventListener('click',()=>{managerSection='tabs';tabManager(true)});
paintQuickSites();
/* Keep shortcut tiles intact: native swipe in the rail, expand all on request. */
const quickToggle=root.querySelector('[data-quick-toggle]');
const quickLinks=root.querySelector('#seyveoBrowserQuickLinks');
quickToggle.addEventListener('click',()=>{
 const expanded=quickLinks.classList.toggle('is-expanded');
 quickToggle.textContent=expanded?'Свернуть':'Показать все ›';
 quickToggle.setAttribute('aria-expanded',String(expanded));
 if(!expanded)quickLinks.scrollLeft=0;
});
root.querySelectorAll('[data-site]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.site)));

$('[data-scan]').addEventListener('click',()=>{if('BarcodeDetector' in window)$('[data-scan-file]').click();else window.alert('На этом устройстве сканирование QR-кода пока недоступно. Адрес можно ввести вручную.')});
$('[data-scan-file]').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const detector=new BarcodeDetector({formats:['qr_code']});const image=await createImageBitmap(file);let results;try{results=await detector.detect(image)}finally{image.close?.()}const value=results?.[0]?.rawValue;if(value){const url=target(value);if(url)navigate(url)}else window.alert('QR-код не найден на изображении')}catch{window.alert('Не удалось прочитать QR-код')}finally{e.target.value=''}});
$('form').addEventListener('submit',e=>{e.preventDefault();const url=target(input.value);if(!url){input.focus();return}if(managerOpen)tabManager(false);navigate(url)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden){if(!siteMenu.hidden)closeSiteMenu();else if(!sheet.hidden)sheet.hidden=true;else if(managerOpen)tabManager(false);else close()}});
document.addEventListener('click',e=>{const tile=e.target.closest?.('[data-calendar-space="browser"],[data-world-space="browser"]');if(tile){e.preventDefault();open()}});
document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||root.contains(a)||!a.closest('.seyveo-conversation'))return;const u=secureUrl(a.href);if(u){e.preventDefault();open(u)}});
window.SEYVEO_BROWSER=Object.freeze({open,close,askSayvi,voiceCommand:browserVoiceCommand,voiceUnavailable:browserVoiceUnavailable,back:()=> $('[data-back]').click(),forward:()=> $('[data-forward]').click(),home:goToSeyveoHome,tabs:()=>tabManager(!managerOpen),bookmarks:()=>bookmarks(),state:()=>({open:!root.hidden,canBack:!$('[data-back]').disabled,canForward:!$('[data-forward]').disabled})});restoreSession();render();
})();