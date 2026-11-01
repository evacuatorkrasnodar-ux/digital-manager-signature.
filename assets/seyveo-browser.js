/* SEYVEO Browser · Black Velvet home, safe HTTPS embed prototype.
   Full web navigation and ad blocking require native WKWebView/Android WebView. */
(()=>{'use strict';
if(document.getElementById('seyveoBrowser'))return;
const root=document.createElement('section');
root.id='seyveoBrowser';root.className='seyveo-browser';root.hidden=true;
root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','SEYVEO Browser');
root.innerHTML=`<div class="seyveo-browser-home"><div class="seyveo-browser-kicker">SEYVEO</div><h2>Browser<sup class="sb-browser-plus-mark" aria-label="Плюс">+</sup></h2></div>
<form class="seyveo-browser-bar"><span class="seyveo-browser-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg></span><input type="text" name="address" autocomplete="off" spellcheck="false" placeholder="Поиск или адрес сайта" aria-label="Поиск или адрес сайта"><button type="button" class="seyveo-browser-scan" data-scan aria-label="Сканировать QR-код" title="Сканировать QR-код"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/></svg></button><input type="file" accept="image/*" capture="environment" data-scan-file hidden></form>
<div class="seyveo-browser-start"><div class="seyveo-browser-start-heading"><span>Быстрый доступ</span><button type="button" data-quick-toggle aria-controls="seyveoBrowserQuickEditor" aria-expanded="false" aria-label="Изменить четвёртый сайт">Изменить</button></div><div class="seyveo-browser-shortcuts" id="seyveoBrowserQuickLinks"><button type="button" data-site="https://ya.ru"><span class="sb-site-mark sb-yandex">Я</span><span>Яндекс</span><small>ya.ru</small></button><button type="button" data-site="https://www.youtube.com"><span class="sb-site-mark sb-youtube">▶</span><span>YouTube</span><small>youtube.com</small></button><button type="button" data-site="https://www.wikipedia.org"><span class="sb-site-mark sb-wiki">W</span><span>Wikipedia</span><small>wikipedia.org</small></button><button type="button" data-custom-site aria-label="Добавить свой сайт"><span class="sb-site-mark sb-custom-site" aria-hidden="true">＋</span><span data-custom-label>Мой сайт</span><small data-custom-host>Добавить</small></button></div><form id="seyveoBrowserQuickEditor" class="sb-quick-site-editor" data-quick-editor hidden><label for="seyveoBrowserQuickUrl">Адрес любимого сайта</label><div class="sb-quick-site-fields"><input id="seyveoBrowserQuickUrl" type="text" inputmode="url" maxlength="2048" autocapitalize="off" autocomplete="url" spellcheck="false" placeholder="Адрес сайта" aria-label="Адрес любимого сайта"><button type="submit">Сохранить</button><button type="button" data-quick-cancel aria-label="Отменить изменение сайта" title="Отмена"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg></button></div><p class="sb-quick-site-error" role="status" aria-live="polite" hidden></p></form><div class="seyveo-browser-continue"><div class="seyveo-browser-start-heading"><span>Продолжить просмотр</span></div><div id="seyveoBrowserHistoryList" class="sb-manager-closed" data-continue-list></div></div></div>
<nav class="seyveo-browser-tabs" aria-label="Вкладки"><div data-tabs></div><button type="button" data-new aria-label="Новая вкладка">＋</button></nav>
<div class="seyveo-browser-content" hidden><header class="sb-browser-sitebar" hidden aria-label="Панель браузера"><button type="button" class="sb-browser-sitebar-menu-button" data-site-menu aria-label="Управление браузером" aria-expanded="false" aria-controls="seyveoBrowserManagerPanel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><strong class="sb-browser-sitebar-title" data-site-title></strong><span class=\"sb-browser-sitebar-spacer\" aria-hidden=\"true\"></span></header><div class="seyveo-browser-blocked" hidden role="status"><div class="sb-browser-embed-message"><strong>Встроенный просмотр недоступен</strong><p>Некоторые сайты ограничивают открытие внутри демоверсии браузера.</p><button type="button" data-open-blocked>Открыть отдельно ↗</button></div></div><section class="sb-browser-demo" data-browser-demo hidden aria-label="Демонстрация оформления страницы, не живой сайт">
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
`;
// Embedded websites keep their sandbox; do not add allow-same-origin with allow-scripts.
document.body.append(root);
const manager=document.createElement('section');manager.className='seyveo-browser-manager';manager.id='seyveoBrowserManagerPanel';manager.hidden=true;manager.setAttribute('aria-label','Управление вкладками');manager.innerHTML='<div class="sb-manager-heading"><strong>Открытые вкладки</strong><span class="sb-manager-heading-actions"><button type="button" data-close-all>Закрыть все</button><button type="button" data-manager-new aria-label="Новая вкладка">＋</button></span></div><div class="sb-manager-list" data-manager-list></div><div class="sb-manager-heading sb-manager-recent-heading"><strong>Недавно закрытые</strong><span class="sb-manager-recent-actions"><button type="button" data-recent-all hidden>Показать все ›</button><button type="button" data-recent-clear hidden aria-label="Очистить недавно закрытые" title="Очистить список"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9.5 4h5M7.5 7l.7 13h7.6l.7-13M10 10v7m4-7v7"/></svg></button></span></div><div class="sb-manager-closed" data-manager-closed></div>';
root.append(manager);
const switcher=document.createElement('nav');switcher.className='sb-manager-switcher';switcher.setAttribute('aria-label','Разделы браузера');
const sections=[['favorites','Избранное'],['history','История'],['downloads','Загрузки']];
const sectionPaths={
 favorites:'<path d="M6 4.5c0-1 .8-1.8 1.8-1.8h8.4c1 0 1.8.8 1.8 1.8V21l-6-4-6 4z"/>',
 history:'<circle cx="12" cy="12" r="9"/><path d="M12 6.5v6l4.2 2.7"/>',
 downloads:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>'
};
let managerSection='favorites';
for(const [id,label] of sections){const button=document.createElement('button');button.type='button';button.dataset.section=id;button.innerHTML='<span class="sb-switch-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+sectionPaths[id]+'</svg></span><span>'+label+'</span>';button.addEventListener('click',()=>{if(id==='history')showManagerHistory=false;managerSection=id;manager.scrollTop=0;renderManager()});switcher.append(button)}
// Three slim menu sections: open tabs are handled by the top glass carousel.
switcher.hidden=true;
const tabsPanel=document.createElement('div');tabsPanel.className='sb-manager-tabs-panel';
while(manager.firstChild)tabsPanel.append(manager.firstChild);
manager.append(tabsPanel);
manager.prepend(switcher);
const secondary=document.createElement('div');secondary.className='sb-manager-secondary';manager.append(secondary);
const panelScrim=document.createElement('div');
panelScrim.className='sb-browser-panel-scrim';panelScrim.hidden=true;
panelScrim.setAttribute('aria-hidden','true');
manager.before(panelScrim);
root.classList.add('is-unified');
const notice=root.querySelector('.seyveo-browser-blocked');
// Styling belongs to the Browser stylesheet so all three native themes apply.
const embedExplanation=notice.querySelector('p');
const $=s=>root.querySelector(s),input=root.querySelector('input'),frame=root.querySelector('iframe'),tabArea=$('[data-tabs]');
const sitebar=$('.sb-browser-sitebar'),siteMenuButton=$('[data-site-menu]');
// Reuse the ONE original grey navigation strip on both the home and web views.
$('.seyveo-browser-tabs').after(sitebar);

// The original glass search field belongs INSIDE the fixed-size grey sitebar
// while searching. No separate popup may cover Quick Access or the page.
const searchForm=$('.seyveo-browser-bar');
searchForm.id='seyveoBrowserSearch';
searchForm.classList.add('sb-browser-search-popup');
searchForm.setAttribute('role','search');
searchForm.hidden=true;
function makeSearchToggle(){
 const button=document.createElement('button');
 button.type='button';
 button.className='sb-browser-sitebar-search-button';
 button.dataset.browserSearchTrigger='';
 button.setAttribute('aria-label','Поиск или адрес сайта');
 button.setAttribute('aria-controls',searchForm.id);
 button.setAttribute('aria-expanded','false');
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';
 button.addEventListener('click',()=>searchForm.hidden?openBrowserSearch():closeBrowserSearch(true));
 return button;
}
for(const parent of [sitebar]){
 const spacer=parent.querySelector('.sb-browser-sitebar-spacer');
 if(spacer)spacer.replaceWith(makeSearchToggle());
}
// Keep the existing grey bar's menu button, title and search control.
// Only the title is replaced by the ORIGINAL search form while searching.
sitebar.insertBefore(searchForm,sitebar.querySelector('[data-browser-search-trigger]'));
function syncSearchButtons(){
 const open=!searchForm.hidden;
 root.querySelectorAll('[data-browser-search-trigger]').forEach(button=>{
  button.setAttribute('aria-expanded',String(open));
  button.setAttribute('aria-label',open?'Закрыть поиск':'Поиск или адрес сайта');
  button.title=open?'Закрыть поиск':'Поиск';
  button.classList.toggle('is-search-close',open);
  button.innerHTML=open
   ?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"/></svg>'
   :'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';
 });
}
function openBrowserSearch(){
 if(root.hidden)return;
 if(managerOpen)tabManager(false);
 input.value=currentUrl()||'';
 searchForm.hidden=false;
 root.classList.add('is-search-open');
 syncSearchButtons();
 // Focus synchronously in the click gesture so the iPhone keyboard
 // actually opens; deferred focus after requestAnimationFrame may be blocked.
 input.focus({preventScroll:true});
 input.select();
}
function closeBrowserSearch(restoreFocus=false){
 if(searchForm.hidden)return;
 searchForm.hidden=true;
 root.classList.remove('is-search-open');
 syncSearchButtons();
 if(restoreFocus&&!root.hidden)sitebar.querySelector('[data-browser-search-trigger]')?.focus({preventScroll:true});
}
// Clicking the page dismisses the address field without intercepting the
// click or moving any tile, tab, grey bar or dock.
root.addEventListener('pointerdown',event=>{
 if(searchForm.hidden||event.target.closest('.sb-browser-sitebar,.seyveo-browser-manager'))return;
 closeBrowserSearch();
});
let tabs=[{id:1,entries:[],position:-1}],active=1,nextId=2,displayedTab=null;
let managerOpen=false;let recentlyClosed=[];let allClosedShown=false;let openCollection=null;let managerMenuId=null;let creatingCollection=false;let collectionMenuId=null;let renamingCollectionId=null;let confirmCollectionDeleteId=null;let templateMenuName=null;
const key='seyveo-browser-bookmarks-v1';
const collectionsKey='seyveo-browser-collections-v1';
const sessionKey='seyveo-browser-session-v1';
function restoreSession(){try{const s=JSON.parse(localStorage.getItem(sessionKey)||'null');if(!s||!Array.isArray(s.tabs))return;const items=s.tabs.slice(0,20).filter(t=>t&&Number.isInteger(t.id)&&Array.isArray(t.entries)).map(t=>{const entries=t.entries.filter(u=>typeof u==='string'&&secureUrl(u)).slice(0,40);return{id:t.id,entries,position:Math.max(-1,Math.min(Number.isInteger(t.position)?t.position:-1,entries.length-1))}});if(items.length){tabs=items;active=tabs.some(t=>t.id===s.active)?s.active:tabs[0].id;nextId=Math.max(...tabs.map(t=>t.id),0)+1}if(Array.isArray(s.closed))recentlyClosed=s.closed.map(normalizeClosed).filter(Boolean).slice(0,25)}catch{}}
function persistSession(){try{localStorage.setItem(sessionKey,JSON.stringify({tabs,active,closed:recentlyClosed}))}catch{}}

let showManagerHistory=false;
let expandedHistory=null;
const historyKey='seyveo-browser-history-v1';
const historyTimesKey='seyveo-browser-history-times-v1';
const quickSiteKey='seyveo-browser-quick-site-v1';
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
 expandedHistory=null;showManagerHistory=false;
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

/* The user chooses one favorite URL; no remote metadata or favicon fetches. */
function configuredQuickSite(){
 try{const raw=localStorage.getItem(quickSiteKey);return raw?secureUrl(raw):null}catch{return null}
}
function resumablePage(raw){
 const href=secureUrl(raw);if(!href)return false;
 const page=new URL(href),segments=page.pathname.split('/').filter(Boolean);
 if(!segments.length)return false;
 // Search result pages, home feeds and category directories aren't reading progress.
 if(['search','results','feed','explore','trending'].includes(segments[segments.length-1].toLowerCase()))return false;
 if(page.hostname.endsWith('youtube.com')&&page.pathname==='/watch'&&!page.searchParams.has('v'))return false;
 return true;
}
function resumableTitle(raw){
 const page=new URL(raw),path=page.pathname;
 if(page.hostname.includes('youtube.com')&&path==='/watch')return 'Видео YouTube';
 const last=path.split('/').filter(Boolean).pop()||'';
 let title=last;
 try{title=decodeURIComponent(last)}catch{}
 title=title.replace(/[_-]+/g,' ').trim();
 if(title.length>=3&&!/^\d+$/.test(title)&&!['watch','video','article','articles','wiki','view'].includes(title.toLowerCase()))return title.slice(0,65);
 return siteName(raw)+' · страница';
}


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
 if(openCollection===id)card.classList.add('is-current');
 if(collectionMenuId===id)card.classList.add('is-menu-open');
 const open=document.createElement('button');open.type='button';open.className='sb-collection-open';open.setAttribute('aria-label','Открыть папку '+collection.name);
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
  const form=document.createElement('form');form.className='sb-collection-rename-form';const input=document.createElement('input');input.type='text';input.className='sb-collection-rename-input';input.maxLength=42;input.value=collection.name;input.setAttribute('aria-label','Новое название папки');
  const submit=document.createElement('button');submit.type='submit';submit.textContent='Сохранить';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Отмена';cancel.addEventListener('click',()=>{renamingCollectionId=null;renderManager()});
  form.addEventListener('submit',event=>{event.preventDefault();const name=input.value.trim();if(!name)return;putCollections(getCollections().map(item=>item.id===id?{...item,name:name.slice(0,42)}:item));renamingCollectionId=null;collectionMenuId=null;renderManager()});
  form.append(input,submit,cancel);panel.append(form);
 }else if(confirmCollectionDeleteId===id){
  const warning=document.createElement('span');warning.className='sb-collection-confirm-label';warning.textContent='Удалить папку?';
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
}
function renderQuickSite(){
 const button=root.querySelector('[data-custom-site]'),url=configuredQuickSite();
 // The empty tile's own plus opens setup; no duplicate Edit action until set.
 root.querySelector('[data-quick-toggle]').hidden=!url;
 const mark=button.querySelector('.sb-site-mark');
 mark.className='sb-site-mark sb-custom-site';
 mark.replaceChildren();
 if(url){
  paintSiteMark(mark,url);
  const host=new URL(url).hostname.replace(/^www[.]/,'');
  button.querySelector('[data-custom-label]').textContent=siteName(url);
  button.querySelector('[data-custom-host]').textContent=host;
  button.setAttribute('aria-label','Открыть мой сайт: '+host);
 }else{
  mark.textContent='＋';
  button.querySelector('[data-custom-label]').textContent='Мой сайт';
  button.querySelector('[data-custom-host]').textContent='Добавить';
  button.setAttribute('aria-label','Добавить свой сайт');
 }
}
function siteSymbol(url){const brand=siteBrand(url);return brand==='youtube'?'▶':brand==='wikipedia'?'W':brand==='yandex'?'Я':brand==='habr'?'H':'•'}
function closeTab(id){const t=tabs.find(x=>x.id===id);if(!t)return;allClosedShown=false;const u=t.entries[t.position];if(u)saveClosed(u);tabs=tabs.filter(x=>x.id!==id);if(!tabs.length)tabs=[{id:nextId++,entries:[],position:-1}];if(active===id)active=tabs[tabs.length-1].id;render()}
function positionSeamlessMenu(){
 // The real grey browser bar is our visual anchor. Its position is shared
 // by Home and opened websites, independent of menu content height.
 if(root.hidden||!managerOpen)return;
 const viewport=root.getBoundingClientRect();
 const bar=sitebar.getBoundingClientRect();
 if(!bar.width||!bar.height)return;
 root.style.setProperty('--sb-manager-top',Math.round(bar.bottom-viewport.top-1)+'px');
 root.style.setProperty('--sb-manager-left',Math.round(bar.left-viewport.left)+'px');
 root.style.setProperty('--sb-manager-right',Math.round(viewport.right-bar.right)+'px');
}
function tabManager(value=true){
 managerOpen=Boolean(value);
 if(managerOpen)closeBrowserSearch();
 if(!managerOpen){allClosedShown=false;showManagerHistory=false;}
 manager.hidden=!managerOpen;
 switcher.hidden=!managerOpen;
 panelScrim.hidden=!managerOpen;
 root.classList.toggle('is-panel-open',managerOpen);
 siteMenuButton.setAttribute('aria-expanded',String(managerOpen));
 siteMenuButton.setAttribute('aria-label',managerOpen?'Закрыть меню браузера':'Управление браузером');
 siteMenuButton.title=managerOpen?'Закрыть меню':'Меню';
 siteMenuButton.querySelector('svg').innerHTML=managerOpen
  ?'<path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"/>'
  :'<path d="M4 7h16M4 12h16M4 17h16"/>';
 if(managerOpen){
  $('[data-site-title]').textContent='Меню';
  manager.scrollTop=0;
  positionSeamlessMenu();
  renderManager();
 }else if(!root.hidden)render();
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
 const currentLabel=managerSection==='collections'?'Избранное':sections.find(([id])=>id===managerSection)?.[1]||'Избранное';
 manager.setAttribute('aria-label','Управление браузером · '+currentLabel);
 switcher.querySelectorAll('button').forEach(button=>{const isActive=button.dataset.section===(managerSection==='collections'?'favorites':managerSection);button.classList.toggle('is-selected',isActive);button.setAttribute('aria-pressed',String(isActive))});
 // No duplicate tab overview: the approved carousel already controls tabs.
 tabsPanel.hidden=true;secondary.hidden=false;
 renderSecondary();return;
 const list=manager.querySelector('[data-manager-list]'),closed=manager.querySelector('[data-manager-closed]');
 list.replaceChildren();closed.replaceChildren();
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
}
/* One compact recovery list, now living under History instead of Tabs. */
function renderRecentlyClosedHistory(){
 if(!recentlyClosed.length)return;
 const heading=document.createElement('div');heading.className='sb-browser-recent-toolbar';
 const title=document.createElement('span');title.textContent='Недавно закрытые';heading.append(title);
 if(recentlyClosed.length>3){
  const more=document.createElement('button');more.type='button';
  more.textContent=allClosedShown?'Свернуть':'Показать все ›';
  more.setAttribute('aria-expanded',String(allClosedShown));
  more.addEventListener('click',()=>{allClosedShown=!allClosedShown;renderManager()});
  heading.append(more);
 }
 secondary.append(heading);
 for(const entry of (allClosedShown?recentlyClosed:recentlyClosed.slice(0,3))){
  const row=document.createElement('div');row.className='sb-browser-recent-row';
  const open=document.createElement('button');open.type='button';open.className='sb-browser-recent-open';
  open.textContent=siteName(entry.url);
  open.setAttribute('aria-label','Восстановить '+siteName(entry.url));
  open.addEventListener('click',()=>{
   recentlyClosed=recentlyClosed.filter(item=>item.url!==entry.url);
   const t={id:nextId++,entries:[entry.url],position:0};tabs.push(t);active=t.id;
   tabManager(false);render();
  });
  const remove=document.createElement('button');remove.type='button';remove.className='sb-browser-recent-remove';
  remove.textContent='×';remove.setAttribute('aria-label','Убрать из недавно закрытых: '+siteName(entry.url));
  remove.addEventListener('click',()=>{
   recentlyClosed=recentlyClosed.filter(item=>item.url!==entry.url);
   if(recentlyClosed.length<=3)allClosedShown=false;
   persistSession();renderManager();
  });
  row.append(open,remove);secondary.append(row);
 }
}
function renderSecondary(){
 secondary.replaceChildren();
 secondary.classList.toggle('is-history',managerSection==='history');
 if(managerSection==='downloads'){
  // Browser JS cannot inspect files downloaded by the host OS/browser.
  const notice=document.createElement('p');
  notice.className='sb-manager-empty sb-browser-downloads-notice';
  notice.textContent='В веб-версии скачанные файлы находятся в папке «Загрузки» устройства или в списке загрузок обычного браузера. В мобильном приложении SEYVEO здесь будут файлы, скачанные внутри SEYVEO.';
  secondary.append(notice);
  return;
 }
 const header=document.createElement('div');header.className='sb-secondary-header';header.hidden=managerSection==='favorites';secondary.append(header);
// Section name already lives on the shared grey Browser strip; no duplicate title.
 if(managerSection==='collections'){
  const back=document.createElement('button');back.type='button';back.className='sb-folder-back';back.textContent='‹ Избранное';
  back.setAttribute('aria-label','Назад в Избранное');
  back.addEventListener('click',()=>{creatingCollection=false;openCollection=null;managerSection='favorites';renderManager()});
  const add=document.createElement('button');add.type='button';add.textContent='＋ Папка';add.setAttribute('aria-label','Создать папку');add.hidden=creatingCollection;add.addEventListener('click',makeCollection);header.append(back,add);
  if(creatingCollection){
   const form=document.createElement('form');form.className='sb-collection-create';form.setAttribute('aria-label','Новая папка');
   const field=document.createElement('input');field.type='text';field.className='sb-collection-name';
   field.maxLength=42;field.required=true;field.placeholder='Название папки';field.setAttribute('aria-label','Название папки');
   const save=document.createElement('button');save.type='submit';save.className='sb-collection-create-save';save.textContent='Создать';
   const cancel=document.createElement('button');cancel.type='button';cancel.className='sb-collection-create-cancel';cancel.textContent='×';cancel.title='Отмена';cancel.setAttribute('aria-label','Отменить создание папки');
   cancel.addEventListener('click',()=>{creatingCollection=false;renderManager()});
   form.addEventListener('submit',event=>{
    event.preventDefault();const name=field.value.trim();if(!name)return;
    const items=getCollections();if(items.length>=30)return;
    const id=String(Date.now())+'-'+Math.random().toString(36).slice(2,6);
    items.push({id,name,urls:[]});putCollections(items);
    creatingCollection=false;openCollection=id;renderManager();
   });
   form.append(field,save,cancel);secondary.append(form);
  }
  const items=getCollections(),cards=document.createElement('div');
  cards.className='sb-manager-collections-list';
  if(!items.length){const hint=document.createElement('p');hint.className='sb-manager-empty';hint.textContent='Пока нет папок';cards.append(hint)}
  else for(const collection of items.filter(item=>!openCollection||item.id===openCollection))cards.append(makeCollectionCard(collection));
  secondary.append(cards);
  const selected=items.find(item=>item.id===openCollection);
  if(selected){
   const group=document.createElement('section');group.className='sb-collection-group';
   const content=document.createElement('div');content.className='sb-collection-content';
   for(const link of selected.urls){
    const row=document.createElement('div');row.className='sb-collection-link';
    const jump=document.createElement('button');jump.type='button';jump.textContent=siteName(link);
    jump.addEventListener('click',()=>{tabManager(false);navigate(link)});
    const remove=document.createElement('button');remove.type='button';remove.textContent='×';
    remove.setAttribute('aria-label','Убрать из папки');
    remove.addEventListener('click',()=>{
     putCollections(getCollections().map(x=>x.id===selected.id?{...x,urls:x.urls.filter(u=>u!==link)}:x));
     renderManager();
    });
    row.append(jump,remove);content.append(row);
   }
   const choices=saved().filter(link=>!selected.urls.includes(link));
   if(choices.length){
    const addRow=document.createElement('div');addRow.className='sb-collection-add';
    const select=document.createElement('select');select.setAttribute('aria-label','Добавить сайт в папку');
    for(const link of choices){
     const option=document.createElement('option');option.value=link;option.textContent=siteName(link);select.append(option);
    }
    const button=document.createElement('button');button.type='button';button.textContent='Добавить';
    button.addEventListener('click',()=>{
     putCollections(getCollections().map(x=>x.id===selected.id?{...x,urls:[...x.urls,select.value]}:x));
     renderManager();
    });
    addRow.append(select,button);content.append(addRow);
   }else if(!selected.urls.length){
    const p=document.createElement('p');p.className='sb-manager-empty';
    p.textContent='Сначала сохрани сайт в Избранное, чтобы добавить его сюда';
    content.append(p);
   }
   group.append(content);secondary.append(group);
  }
  return;
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
   renderRecentlyClosedHistory();
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
  renderRecentlyClosedHistory();
  return;
 }
 const folders=getCollections();
 const folderBar=document.createElement('div');folderBar.className='sb-browser-folder-bar';
 const folderLabel=document.createElement('span');folderLabel.textContent='Папки';
 const createFolder=document.createElement('button');createFolder.type='button';createFolder.textContent='＋';
 createFolder.setAttribute('aria-label','Создать папку в Избранном');createFolder.title='Новая папка';
 createFolder.addEventListener('click',makeCollection);folderBar.append(folderLabel,createFolder);secondary.append(folderBar);
 for(const folder of folders){
  const row=document.createElement('button');row.type='button';row.className='sb-browser-folder-row';
  row.setAttribute('aria-label','Открыть папку '+folder.name);
  const mark=document.createElement('span');mark.className='sb-browser-folder-icon';mark.setAttribute('aria-hidden','true');
  mark.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h7l2 2h9v11H3z"/></svg>';
  const words=document.createElement('span');words.className='sb-browser-folder-name';words.textContent=folder.name;
  const num=document.createElement('small');num.textContent=String(folder.urls.length);
  row.append(mark,words,num);
  row.addEventListener('click',()=>{openCollection=folder.id;managerSection='collections';renderManager()});
  secondary.append(row);
 }
 const links=saved();
 if(links.length||!folders.length){const label=document.createElement('div');label.className='sb-browser-favorites-caption';label.textContent='Сохранённые сайты';secondary.append(label)}
 if(!links.length&&!folders.length){const hint=document.createElement('p');hint.className='sb-manager-empty';hint.textContent='Здесь будут твои сохранённые сайты и папки';secondary.append(hint)}
 for(const url of links){const row=document.createElement('button');row.type='button';row.className='sb-manager-secondary-link';const icon=document.createElement('span');paintSiteMark(icon,url);const words=document.createElement('span');const title=document.createElement('strong');title.textContent=siteName(url);const sub=document.createElement('small');sub.textContent=new URL(url).hostname.replace(/^www[.]/,'');words.append(title,sub);row.append(icon,words);row.addEventListener('click',()=>{tabManager(false);navigate(url)});secondary.append(row)}
}
/* With Search out of layout, the existing tab rail aligns directly under the
   wordmark. No live height compensation, so opening Search never moves tabs. */
function balanceBrowserVerticalRhythm(){
 root.style.removeProperty('--sb-balanced-tabs-margin');
}
function render(){
 persistSession();
 const t=current(),url=currentUrl(),home=!url;if(managerOpen)renderManager();
 renderQuickSite();
 $('.seyveo-browser-home').hidden=false;
 root.classList.add('is-site-view');
 root.classList.toggle('is-browser-home',home);
 $('.seyveo-browser-start').hidden=!home;
 $('.seyveo-browser-content').hidden=home;
 $('.seyveo-browser-tabs').hidden=false;
 if(searchForm.hidden)input.value=home?'':url||'';
 // A static web demo cannot bypass X-Frame-Options / CSP frame-ancestors.
 // Sites that fail in the user's preview get a compact explanation, never a
 // full-height grey error iframe; a native app will require WebView integration.
 const embedHost=url?new URL(url).hostname.toLowerCase():'';
 const unsupportedEmbeds=new Set(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','ya.ru','www.ya.ru','yandex.ru','www.yandex.ru']);
 // The provided Habr-style reference is a DEMO only for this exact sample route.
 // Never substitute fabricated article text into another live website.
 const isDemo=!!url&&['habr.com','www.habr.com'].includes(embedHost)&&new URL(url).pathname.replace(/\/$/,'')==='/ru/company/design';
 const blocked=!!url&&!isDemo&&unsupportedEmbeds.has(embedHost);
 sitebar.hidden=false;
 $('[data-site-title]').textContent=managerOpen?'Меню':home?'Главная':siteBrand(url)==='habr'?'Хабр':siteName(url);
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
 document.dispatchEvent(new Event('seyveo:browser-state'));
 // The home only resumes specific content, not a shortcut's homepage.
 // The complete chronology stays exclusively under Menu > History.
 const contList=$('[data-continue-list]');
 const ignored=new Set([
  ...Array.from(root.querySelectorAll('.seyveo-browser-shortcuts [data-site]'),button=>secureUrl(button.dataset.site)),
  configuredQuickSite()
 ].filter(Boolean));
 const resume=historyItems().find(link=>resumablePage(link)&&!ignored.has(link));
 const resumeBlock=$('.seyveo-browser-continue');
 resumeBlock.hidden=!resume;
 contList.replaceChildren();
 if(resume){
  const u=new URL(resume),card=document.createElement('button');
  card.type='button';card.className='seyveo-browser-history-card sb-home-resume';
  card.setAttribute('aria-label','Продолжить просмотр: '+resumableTitle(resume));
  const mark=document.createElement('span');
  mark.className='seyveo-browser-history-logo';paintSiteMark(mark,resume);
  const words=document.createElement('span');words.className='seyveo-browser-history-words';
  const title=document.createElement('strong');title.textContent=resumableTitle(resume);
  const subtitle=document.createElement('small');subtitle.textContent=u.hostname.replace(/^www[.]/,'');
  words.append(title,subtitle);
  const arrow=document.createElement('span');arrow.className='sb-home-resume-arrow';
  arrow.setAttribute('aria-hidden','true');
  arrow.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>';
  card.append(mark,words,arrow);
  card.addEventListener('click',()=>navigate(resume));
  contList.append(card);
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
  }else{
   // The empty tab uses the same raised label as ordinary tabs, not a bare
   // text node that the two-column grid pushes out of alignment.
   pill.classList.add('is-empty');
   const label=document.createElement('span');
   label.className='sb-browser-tab-name';
   label.textContent='Новая вкладка';
   choose.append(label);
  }
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
  create.addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;render();openBrowserSearch()});
  placeholder.append(create);tabArea.append(placeholder);
 }
 balanceBrowserVerticalRhythm();
}
function navigate(value){const url=secureUrl(value);if(!url)return false;closeBrowserSearch();const t=current();t.entries=t.entries.slice(0,t.position+1);t.entries.push(url);t.position++;remember(url);render();return true}
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
 closeBrowserSearch();
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
function open(value){if(value&&!secureUrl(value))return false;suspendedForSayvi=false;root.hidden=false;document.body.classList.add('seyveo-browser-open');if(value)navigate(value);else render();document.dispatchEvent(new Event('seyveo:browser-open'));return true}
function close(){suspendedForSayvi=false;expandedHistory=null;closeBrowserSearch();tabManager(false);root.hidden=true;document.body.classList.remove('seyveo-browser-open');frame.removeAttribute('src');displayedTab=null;document.dispatchEvent(new Event('seyveo:browser-close'))}
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
 if(managerOpen){tabManager(false);return}
 close();
},{passive:true});
root.addEventListener('touchcancel',()=>{edgeSwipe=null},{passive:true});
function bookmarks(){
 managerSection='favorites';
 tabManager(true); // All favorite entry points share the existing dedicated section.
}
function browserBack(){const t=current();if(t.position>0){t.position--;render()}}
function browserForward(){const t=current();if(t.position<t.entries.length-1){t.position++;render()}}
/* Reload a real page without adding duplicate history entries. */
function browserReload(){
 const url=currentUrl();
 if(root.hidden||!url)return false;
 if(managerOpen)tabManager(false);
 if(!frame.hidden){frame.setAttribute('src',url);displayedTab=active;}
 else render(); // blocked embeds and demo pages never bypass iframe protections
 return true;
}
manager.querySelector('[data-recent-all]').addEventListener('click',()=>{allClosedShown=!allClosedShown;syncClosedStack()});
manager.querySelector('[data-recent-clear]').addEventListener('click',()=>{
 if(!recentlyClosed.length)return;
 if(!window.confirm('Очистить список недавно закрытых вкладок? Открытые вкладки, история и избранное останутся.'))return;
 recentlyClosed=[];allClosedShown=false;persistSession();renderManager();
});
manager.querySelector('[data-manager-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;tabManager(false);render();openBrowserSearch()});
manager.querySelector('[data-close-all]').addEventListener('click',()=>{allClosedShown=false;for(const t of tabs){const u=t.entries[t.position];if(u)saveClosed(u)}tabs=[{id:nextId++,entries:[],position:-1}];active=tabs[0].id;render()});
const customShortcut=root.querySelector('[data-custom-site]');
customShortcut.addEventListener('click',()=>{
 const url=configuredQuickSite();
 if(url)navigate(url);
 else showQuickEditor(true);
});
$('[data-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;render();openBrowserSearch()});
function toggleBrowserPanel(){
 if(!managerOpen)managerSection='favorites';
 tabManager(!managerOpen);
}
siteMenuButton.addEventListener('click',toggleBrowserPanel);

panelScrim.addEventListener('click',()=>tabManager(false));

$('[data-open-blocked]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});
$('[data-frame-external]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});

paintQuickSites();
/* Keep shortcut tiles intact: native swipe in the rail, expand all on request. */
const quickToggle=root.querySelector('[data-quick-toggle]');
const quickEditor=root.querySelector('[data-quick-editor]');
const quickField=quickEditor.querySelector('input');
const quickError=quickEditor.querySelector('.sb-quick-site-error');
function showQuickEditor(open){
 quickEditor.hidden=!open;
 quickToggle.textContent=open?'Готово':'Изменить';
 quickToggle.setAttribute('aria-expanded',String(open));
 quickError.hidden=true;
 quickError.textContent='';
 if(open){
  quickField.value=configuredQuickSite()||'';
  quickField.focus({preventScroll:true});
 }
}
quickToggle.addEventListener('click',()=>showQuickEditor(quickEditor.hidden));
quickEditor.querySelector('[data-quick-cancel]').addEventListener('click',()=>showQuickEditor(false));
quickEditor.addEventListener('submit',event=>{
 event.preventDefault();
 const raw=quickField.value.trim();
 const candidate=/^https?:\/\//i.test(raw)?raw:'https://'+raw;
 const url=raw?secureUrl(candidate):null;
 if(!url){
  quickError.textContent='Укажи адрес сайта с защищённым соединением HTTPS';
  quickError.hidden=false;
  quickField.focus();
  return;
 }
 // Prevent accidentally replacing Favorites with a duplicated Yandex/YouTube/Wiki tile.
 if(Array.from(root.querySelectorAll('.seyveo-browser-shortcuts [data-site]'),button=>secureUrl(button.dataset.site)).includes(url)){
  quickError.textContent='Этот сайт уже есть в быстром доступе';
  quickError.hidden=false;
  quickField.focus();
  return;
 }
 try{localStorage.setItem(quickSiteKey,url)}
 catch{
  quickError.textContent='Не удалось сохранить сайт на устройстве';
  quickError.hidden=false;return;
 }
 showQuickEditor(false);
 render();
});
root.querySelectorAll('[data-site]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.site)));

$('[data-scan]').addEventListener('click',()=>{if('BarcodeDetector' in window)$('[data-scan-file]').click();else window.alert('На этом устройстве сканирование QR-кода пока недоступно. Адрес можно ввести вручную.')});
$('[data-scan-file]').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const detector=new BarcodeDetector({formats:['qr_code']});const image=await createImageBitmap(file);let results;try{results=await detector.detect(image)}finally{image.close?.()}const value=results?.[0]?.rawValue;if(value){const url=target(value);if(url)navigate(url)}else window.alert('QR-код не найден на изображении')}catch{window.alert('Не удалось прочитать QR-код')}finally{e.target.value=''}});
searchForm.addEventListener('submit',e=>{e.preventDefault();const url=target(input.value);if(!url){input.focus();return}if(managerOpen)tabManager(false);navigate(url)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden){if(!searchForm.hidden)closeBrowserSearch(true);else if(managerOpen)tabManager(false);else close()}});
document.addEventListener('click',e=>{const tile=e.target.closest?.('[data-calendar-space="browser"],[data-world-space="browser"]');if(tile){e.preventDefault();open()}});
document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||root.contains(a)||!a.closest('.seyveo-conversation'))return;const u=secureUrl(a.href);if(u){e.preventDefault();open(u)}});
window.SEYVEO_BROWSER=Object.freeze({open,close,askSayvi,voiceCommand:browserVoiceCommand,voiceUnavailable:browserVoiceUnavailable,back:browserBack,forward:browserForward,home:goToSeyveoHome,reload:browserReload,tabs:()=>tabManager(!managerOpen),bookmarks,search:openBrowserSearch,state:()=>({open:!root.hidden,canBack:current().position>0,canForward:current().position<current().entries.length-1,canReload:!!currentUrl()})});window.addEventListener('resize',()=>{balanceBrowserVerticalRhythm();positionSeamlessMenu()},{passive:true});
if(document.fonts?.ready)document.fonts.ready.then(balanceBrowserVerticalRhythm).catch(()=>{});
restoreSession();render();
})();