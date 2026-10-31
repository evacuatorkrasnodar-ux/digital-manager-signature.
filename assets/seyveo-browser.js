/* SEYVEO Browser · Black Velvet home, safe HTTPS embed prototype.
   Full web navigation and ad blocking require native WKWebView/Android WebView. */
(()=>{'use strict';
if(document.getElementById('seyveoBrowser'))return;
const root=document.createElement('section');
root.id='seyveoBrowser';root.className='seyveo-browser';root.hidden=true;
root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','SEYVEO Browser');
root.innerHTML=`<header class="seyveo-browser-top"><button type="button" data-close aria-label="Вернуться в Мой мир">‹</button><span class="seyveo-browser-header-space" aria-hidden="true"></span></header>
<div class="seyveo-browser-home"><div class="seyveo-browser-kicker">SEYVEO</div><h2>Browser</h2></div>
<form class="seyveo-browser-bar"><span class="seyveo-browser-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg></span><input type="text" name="address" autocomplete="off" spellcheck="false" placeholder="Поиск или адрес сайта" aria-label="Поиск или адрес сайта"><button type="button" class="seyveo-browser-scan" data-scan aria-label="Сканировать QR-код" title="Сканировать QR-код"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/></svg></button><input type="file" accept="image/*" capture="environment" data-scan-file hidden></form>
<div class="seyveo-browser-start"><div class="seyveo-browser-start-heading"><span>Быстрый доступ</span></div><div class="seyveo-browser-shortcuts"><button type="button" data-site="https://ya.ru"><span class="sb-site-mark sb-yandex">Я</span><span>Яндекс</span><small>ya.ru</small></button><button type="button" data-site="https://www.youtube.com"><span class="sb-site-mark sb-youtube">▶</span><span>YouTube</span><small>youtube.com</small></button><button type="button" data-site="https://www.wikipedia.org"><span class="sb-site-mark sb-wiki">W</span><span>Wikipedia</span><small>wikipedia.org</small></button><button type="button" data-bookmarks><span class="sb-site-mark sb-saved">☆</span><span>Избранное</span><small>Закладки</small></button></div><div class="seyveo-browser-continue"><div class="seyveo-browser-start-heading"><span>Продолжить просмотр</span><button type="button" data-history-toggle hidden>Показать все ›</button></div><div data-continue-list></div></div></div>
<nav class="seyveo-browser-tabs" aria-label="Вкладки"><div data-tabs></div><button type="button" data-new aria-label="Новая вкладка">＋</button></nav>
<div class="seyveo-browser-content" hidden><div class="seyveo-browser-blocked" hidden><strong>Этот сайт не разрешает встроенный просмотр</strong><p>YouTube запрещает открывать главную страницу во фрейме. Можно открыть сайт отдельно.</p><button type="button" data-open-blocked>Открыть YouTube ↗</button></div><iframe title="Веб-страница" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms" hidden></iframe><div class="seyveo-browser-frame-note">Если сайт не отображается, он может запрещать встраивание. Используй ↗ для открытия отдельно.</div></div>
<footer class="seyveo-browser-bottom"><button type="button" data-back aria-label="Назад">‹</button><button type="button" data-forward aria-label="Вперёд">›</button><button type="button" data-home aria-label="На стартовую">⌂</button><button type="button" data-bookmark aria-label="Сохранить страницу">☆</button><button type="button" data-bookmarks aria-label="Закладки">☷</button><button type="button" data-external aria-label="Открыть отдельно">↗</button><button type="button" data-close aria-label="Закрыть браузер">Готово</button></footer>
<div class="seyveo-browser-sheet" hidden><div class="seyveo-browser-sheet-bar"><strong>Избранное</strong><button type="button" data-dismiss>Готово</button></div><div data-bookmark-list></div></div>`;
document.body.append(root);
const manager=document.createElement('section');manager.className='seyveo-browser-manager';manager.hidden=true;manager.setAttribute('aria-label','Управление вкладками');manager.innerHTML='<div class="sb-manager-nav"><button type="button" data-manager-back aria-label="Вернуться в браузер">‹</button><div class="sb-manager-brand"><span>SEYVEO</span><small>Browser</small></div><span class="sb-manager-nav-spacer" aria-hidden="true"></span></div><div class="sb-manager-heading"><strong>Открытые вкладки</strong><button type="button" data-close-all>Закрыть все</button></div><div class="sb-manager-list" data-manager-list></div><div class="sb-manager-heading"><strong>Недавно закрытые</strong></div><div class="sb-manager-closed" data-manager-closed></div>';
root.append(manager);
const switcher=document.createElement('nav');switcher.className='sb-manager-switcher';switcher.setAttribute('aria-label','Разделы браузера');
const sections=[['tabs','▣','Вкладки'],['favorites','♧','Избранное'],['history','◷','История'],['collections','◇','Коллекции']];
let managerSection='tabs';
for(const [id,glyph,label] of sections){const button=document.createElement('button');button.type='button';button.dataset.section=id;button.innerHTML='<span class="sb-switch-icon" aria-hidden="true">'+glyph+'</span><span>'+label+'</span>';button.addEventListener('click',()=>{managerSection=id;renderManager()});switcher.append(button)}
manager.querySelector('.sb-manager-nav').after(switcher);
const tabsPanel=document.createElement('div');tabsPanel.className='sb-manager-tabs-panel';
while(switcher.nextSibling)tabsPanel.append(switcher.nextSibling);
manager.append(tabsPanel);
const secondary=document.createElement('div');secondary.className='sb-manager-secondary';manager.append(secondary);
const notice=root.querySelector('.seyveo-browser-blocked');
notice.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:25px;text-align:center;background:var(--bg,#111a16);color:var(--text,#edf3ef);z-index:2';
notice.querySelector('p').style.cssText='font-size:13px;line-height:1.5;opacity:.7';
notice.querySelector('button').style.cssText='padding:13px;border-radius:14px;border:1px solid #65b88b;background:#ffffff10;color:inherit';
const $=s=>root.querySelector(s),input=$('input'),frame=$('iframe'),tabArea=$('[data-tabs]'),sheet=$('.seyveo-browser-sheet');
let tabs=[{id:1,entries:[],position:-1}],active=1,nextId=2,displayedTab=null;
let managerOpen=false;let recentlyClosed=[];
const key='seyveo-browser-bookmarks-v1';
let showAllHistory=false;
let expandedHistory=null;
const historyKey='seyveo-browser-history-v1';
function historyItems(){try{const a=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&secureUrl(x)).slice(0,24):[]}catch{return []}}
function remember(url){try{localStorage.setItem(historyKey,JSON.stringify([url,...historyItems().filter(x=>x!==url)].slice(0,24)))}catch{}}
function secureUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
function target(value){let s=String(value||'').trim();if(!s)return null;if(/^https?:\/\//i.test(s))return secureUrl(s);if(/^([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(s))return secureUrl('https://'+s);return 'https://yandex.ru/search/?text='+encodeURIComponent(s)}
function current(){return tabs.find(t=>t.id===active)}
function currentUrl(){const t=current();return t.entries[t.position]||null}
function saved(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&secureUrl(x)).slice(0,60):[]}catch{return []}}
function store(a){try{localStorage.setItem(key,JSON.stringify(a.slice(0,60)))}catch{}}
function closeTab(id){const t=tabs.find(x=>x.id===id);if(!t)return;const u=t.entries[t.position];if(u){recentlyClosed=[u,...recentlyClosed.filter(x=>x!==u)].slice(0,12)}tabs=tabs.filter(x=>x.id!==id);if(!tabs.length)tabs=[{id:nextId++,entries:[],position:-1}];if(active===id)active=tabs[tabs.length-1].id;render()}
function tabManager(value=true){managerOpen=value;manager.hidden=!value;if(value)renderManager();}
function renderManager(){switcher.querySelectorAll('button').forEach(b=>{const selected=b.dataset.section===managerSection;b.classList.toggle('is-selected',selected);b.setAttribute('aria-pressed',String(selected))});tabsPanel.hidden=managerSection!=='tabs';secondary.hidden=managerSection==='tabs';if(managerSection!=='tabs'){renderSecondary();return}const list=manager.querySelector('[data-manager-list]'),closed=manager.querySelector('[data-manager-closed]');const count=switcher.querySelector('[data-section="tabs"] span:last-child');count.textContent='Вкладки '+tabs.length;list.replaceChildren();closed.replaceChildren();for(const t of tabs){const u=t.entries[t.position];const item=document.createElement('div');item.className='sb-manager-card'+(t.id===active?' is-current':'');const select=document.createElement('button');select.type='button';select.className='sb-manager-select';const icon=document.createElement('span');icon.className='sb-manager-site-icon';const domain=u?new URL(u).hostname.toLowerCase():'';icon.textContent=domain.includes('youtube')?'▶':domain.includes('wikipedia')?'W':domain.includes('yandex')||domain.includes('ya.ru')?'Я':u?'◈':'＋';if(domain.includes('youtube'))icon.classList.add('sb-manager-youtube');const words=document.createElement('span');const name=document.createElement('strong');name.textContent=u?new URL(u).hostname.replace(/^www\\./,''):'Новая вкладка';const sub=document.createElement('small');sub.textContent=t.id===active?'● Активная вкладка':u?'Открыть страницу':'Пустая вкладка';words.append(name,sub);select.append(icon,words);select.addEventListener('click',()=>{active=t.id;tabManager(false);render()});const x=document.createElement('button');x.type='button';x.className='sb-manager-close';x.textContent='×';x.setAttribute('aria-label','Закрыть вкладку');x.addEventListener('click',()=>closeTab(t.id));item.append(select,x);list.append(item)}if(!recentlyClosed.length){const empty=document.createElement('p');empty.className='sb-manager-empty';empty.textContent='Здесь будут недавно закрытые страницы';closed.append(empty)}for(const u of recentlyClosed){const b=document.createElement('button');b.type='button';b.className='sb-manager-restore';b.textContent=new URL(u).hostname.replace(/^www\\./,'')+'    ↶';b.addEventListener('click',()=>{recentlyClosed=recentlyClosed.filter(x=>x!==u);const t={id:nextId++,entries:[u],position:0};tabs.push(t);active=t.id;tabManager(false);render()});closed.append(b)}}
function renderSecondary(){secondary.replaceChildren();const heading=document.createElement('h3');heading.textContent=managerSection==='favorites'?'Избранное':managerSection==='history'?'История':'Коллекции';secondary.append(heading);const links=managerSection==='favorites'?saved():managerSection==='history'?historyItems():[];if(managerSection==='collections'){const hint=document.createElement('p');hint.className='sb-manager-empty';hint.textContent='Коллекции появятся здесь, когда мы добавим создание папок для закладок.';secondary.append(hint);return}if(!links.length){const hint=document.createElement('p');hint.className='sb-manager-empty';hint.textContent=managerSection==='favorites'?'Сохрани страницу в закладки, чтобы она появилась здесь':'История просмотров пока пуста';secondary.append(hint)}for(const u of links){const b=document.createElement('button');b.type='button';b.className='sb-manager-restore';b.textContent=new URL(u).hostname.replace(/^www\\./,'');b.addEventListener('click',()=>{tabManager(false);navigate(u)});secondary.append(b)}}
function render(){
 const t=current(),url=currentUrl(),home=!url;if(managerOpen)renderManager();
 $('.seyveo-browser-home').hidden=!home;$('.seyveo-browser-start').hidden=!home;$('.seyveo-browser-content').hidden=home;$('.seyveo-browser-tabs').hidden=home;
 input.value=url||'';
 const blocked=!!url&&['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(new URL(url).hostname.toLowerCase());
 $('.seyveo-browser-blocked').hidden=!blocked;
 frame.hidden=home||blocked;
 if(blocked){frame.removeAttribute('src');displayedTab=null}
 else if(url){if(displayedTab!==active||frame.getAttribute('src')!==url){frame.src=url;displayedTab=active}}
 else{frame.removeAttribute('src');displayedTab=null}
 $('[data-back]').disabled=t.position<=0;$('[data-forward]').disabled=t.position>=t.entries.length-1;
 $('[data-bookmark]').disabled=!url;$('[data-external]').disabled=!url;
 $('[data-bookmark]').textContent=url&&saved().includes(url)?'★':'☆';
 document.dispatchEvent(new Event('seyveo:browser-state'));
 const items=historyItems();const contList=$('[data-continue-list]');contList.replaceChildren();const toggle=$('[data-history-toggle]');toggle.hidden=items.length<2;toggle.textContent=showAllHistory?'Свернуть':'Показать все ›';
 const selected=showAllHistory?items:items.slice(0,3);
 if(!selected.length){const msg=document.createElement('p');msg.className='seyveo-browser-recent-empty';msg.textContent='Открой любой сайт — здесь появятся карточки для продолжения просмотра';contList.append(msg)}
 for(const link of selected){
  const url=new URL(link),host=url.hostname.replace(/^www\./,'');
  const name=host.includes('youtube.com')?'YouTube':host.includes('wikipedia.org')?'Wikipedia':host.includes('ya.ru')||host.includes('yandex.')?'Яндекс':host;
  const card=document.createElement('article');card.className='seyveo-browser-history-card';
  const head=document.createElement('button');head.type='button';head.className='seyveo-browser-history-head';head.setAttribute('aria-label','Открыть '+name);
  const logo=document.createElement('span');logo.className='seyveo-browser-history-logo';logo.setAttribute('aria-hidden','true');
  logo.textContent=name==='YouTube'?'▶':name==='Wikipedia'?'W':name==='Яндекс'?'Я':'◈';
  const words=document.createElement('span');words.className='seyveo-browser-history-words';const title=document.createElement('strong');title.textContent=name;const sub=document.createElement('small');sub.textContent=host;words.append(title,sub);
  head.append(logo,words);head.addEventListener('click',()=>navigate(link));
  const menu=document.createElement('button');menu.type='button';menu.className='seyveo-browser-history-menu';menu.textContent='⋯';menu.setAttribute('aria-label','Действия с '+name);menu.setAttribute('aria-expanded',String(expandedHistory===link));menu.addEventListener('click',()=>{expandedHistory=expandedHistory===link?null:link;render()});
  const actions=document.createElement('div');actions.className='seyveo-browser-history-actions';actions.hidden=expandedHistory!==link;
  const action=(label,handler)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',handler);actions.append(button)};
  action(saved().includes(link)?'Убрать из закладок':'☆ В закладки',()=>{const list=saved();store(list.includes(link)?list.filter(x=>x!==link):[link,...list]);render()});
  action('Убрать из истории',()=>{try{localStorage.setItem(historyKey,JSON.stringify(historyItems().filter(x=>x!==link)))}catch{}if(expandedHistory===link)expandedHistory=null;render()});
  const top=document.createElement('div');top.className='seyveo-browser-history-top';top.append(head,menu);card.append(top,actions);contList.append(card);
 }
 tabArea.replaceChildren();
 for(const item of tabs){const pill=document.createElement('span');pill.className='seyveo-browser-tab'+(item.id===active?' is-active':'');
 const choose=document.createElement('button');choose.type='button';choose.textContent=item.entries[item.position]?new URL(item.entries[item.position]).hostname:'Новая вкладка';choose.addEventListener('click',()=>{active=item.id;render()});
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Закрыть вкладку');close.addEventListener('click',()=>closeTab(item.id));
 pill.append(choose,close);tabArea.append(pill)}
}
function navigate(value){const url=secureUrl(value);if(!url)return false;const t=current();t.entries=t.entries.slice(0,t.position+1);t.entries.push(url);t.position++;remember(url);render();return true}
function open(value){if(value&&!secureUrl(value))return false;root.hidden=false;document.body.classList.add('seyveo-browser-open');sheet.hidden=true;if(value)navigate(value);else render();document.dispatchEvent(new Event('seyveo:browser-open'));return true}
function close(){tabManager(false);root.hidden=true;sheet.hidden=true;document.body.classList.remove('seyveo-browser-open');frame.removeAttribute('src');displayedTab=null;document.dispatchEvent(new Event('seyveo:browser-close'))}
function bookmarks(){const list=saved(),holder=$('[data-bookmark-list]');holder.replaceChildren();if(!list.length){holder.textContent='Пока пусто. Открой страницу и нажми ☆.'}for(const url of list){const b=document.createElement('button');b.type='button';b.textContent=new URL(url).hostname;b.addEventListener('click',()=>{sheet.hidden=true;navigate(url)});holder.append(b)}sheet.hidden=false}
manager.querySelector('[data-manager-back]').addEventListener('click',()=>tabManager(false));
manager.querySelector('[data-manager-back]').addEventListener('click',()=>tabManager(false));
manager.querySelector('[data-manager-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;tabManager(false);render();input.focus()});
manager.querySelector('[data-close-all]').addEventListener('click',()=>{for(const t of tabs){const u=t.entries[t.position];if(u)recentlyClosed=[u,...recentlyClosed.filter(x=>x!==u)].slice(0,12)}tabs=[{id:nextId++,entries:[],position:-1}];active=tabs[0].id;render()});
root.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
root.querySelectorAll('[data-bookmarks]').forEach(b=>b.addEventListener('click',bookmarks));
$('[data-dismiss]').addEventListener('click',()=>sheet.hidden=true);
$('[data-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;render();input.focus()});
$('[data-back]').addEventListener('click',()=>{const t=current();if(t.position>0){t.position--;render()}});
$('[data-forward]').addEventListener('click',()=>{const t=current();if(t.position<t.entries.length-1){t.position++;render()}});
$('[data-home]').addEventListener('click',()=>{const t=current();t.entries=[];t.position=-1;render()});
$('[data-external]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});
$('[data-bookmark]').addEventListener('click',()=>{const url=currentUrl();if(!url)return;const a=saved();store(a.includes(url)?a.filter(x=>x!==url):[url,...a]);render()});

$('[data-open-blocked]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});
$('[data-history-toggle]').addEventListener('click',()=>{showAllHistory=!showAllHistory;render()});
root.querySelectorAll('[data-site]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.site)));

$('[data-scan]').addEventListener('click',()=>{if('BarcodeDetector' in window)$('[data-scan-file]').click();else window.alert('На этом устройстве сканирование QR-кода пока недоступно. Адрес можно ввести вручную.')});
$('[data-scan-file]').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const detector=new BarcodeDetector({formats:['qr_code']});const image=await createImageBitmap(file);let results;try{results=await detector.detect(image)}finally{image.close?.()}const value=results?.[0]?.rawValue;if(value){const url=target(value);if(url)navigate(url)}else window.alert('QR-код не найден на изображении')}catch{window.alert('Не удалось прочитать QR-код')}finally{e.target.value=''}});
$('form').addEventListener('submit',e=>{e.preventDefault();const url=target(input.value);if(!url){input.focus();return}navigate(url)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden){if(!sheet.hidden)sheet.hidden=true;else close()}});
document.addEventListener('click',e=>{const tile=e.target.closest?.('[data-calendar-space="browser"],[data-world-space="browser"]');if(tile){e.preventDefault();open()}});
document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||root.contains(a)||!a.closest('.seyveo-conversation'))return;const u=secureUrl(a.href);if(u){e.preventDefault();open(u)}});
window.SEYVEO_BROWSER=Object.freeze({open,close,back:()=> $('[data-back]').click(),forward:()=> $('[data-forward]').click(),home:()=> $('[data-home]').click(),tabs:()=>tabManager(!managerOpen),bookmarks:()=>bookmarks(),state:()=>({open:!root.hidden,canBack:!$('[data-back]').disabled,canForward:!$('[data-forward]').disabled})});render();
})();