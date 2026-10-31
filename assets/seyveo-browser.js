/* SEYVEO Browser · Black Velvet home, safe HTTPS embed prototype.
   Full web navigation and ad blocking require native WKWebView/Android WebView. */
(()=>{'use strict';
if(document.getElementById('seyveoBrowser'))return;
const root=document.createElement('section');
root.id='seyveoBrowser';root.className='seyveo-browser';root.hidden=true;
root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','SEYVEO Browser');
root.innerHTML=`<header class="seyveo-browser-top"><button type="button" data-close aria-label="Вернуться в Мой мир">‹</button><strong>SEYVEO <span>Browser</span></strong><span class="seyveo-browser-shield" title="Для адресов используется HTTPS">⌁</span></header>
<div class="seyveo-browser-home"><div class="seyveo-browser-kicker">SEYVEO</div><h2>Browser</h2><p>Твой интернет. В одном пространстве.</p></div>
<form class="seyveo-browser-bar"><span aria-hidden="true">⌕</span><input type="text" name="address" autocomplete="off" spellcheck="false" placeholder="Поиск или адрес сайта" aria-label="Поиск или адрес сайта"><button type="submit" aria-label="Искать или открыть">→</button></form>
<div class="seyveo-browser-start"><div class="seyveo-browser-start-heading">Быстрый доступ</div><div class="seyveo-browser-shortcuts"><button type="button" data-site="https://ya.ru"><span class="sb-site-mark sb-yandex">Я</span><span>Яндекс</span><small>ya.ru</small></button><button type="button" data-site="https://www.youtube.com"><span class="sb-site-mark sb-youtube">▶</span><span>YouTube</span><small>youtube.com</small></button><button type="button" data-site="https://www.wikipedia.org"><span class="sb-site-mark sb-wiki">W</span><span>Wikipedia</span><small>wikipedia.org</small></button><button type="button" data-bookmarks><span class="sb-site-mark sb-saved">♧</span><span>Избранное</span><small>Закладки</small></button></div><div class="seyveo-browser-recent"><div class="seyveo-browser-start-heading">Недавние вкладки <button type="button" data-recent-new aria-label="Новая вкладка">＋</button></div><div data-recent-tabs></div></div></div>
<nav class="seyveo-browser-tabs" aria-label="Вкладки"><div data-tabs></div><button type="button" data-new aria-label="Новая вкладка">＋</button></nav>
<div class="seyveo-browser-content" hidden><div class="seyveo-browser-blocked" hidden><strong>Этот сайт не разрешает встроенный просмотр</strong><p>YouTube запрещает открывать главную страницу во фрейме. Можно открыть сайт отдельно.</p><button type="button" data-open-blocked>Открыть YouTube ↗</button></div><iframe title="Веб-страница" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms" hidden></iframe><div class="seyveo-browser-frame-note">Если сайт не отображается, он может запрещать встраивание. Используй ↗ для открытия отдельно.</div></div>
<footer class="seyveo-browser-bottom"><button type="button" data-back aria-label="Назад">‹</button><button type="button" data-forward aria-label="Вперёд">›</button><button type="button" data-home aria-label="На стартовую">⌂</button><button type="button" data-bookmark aria-label="Сохранить страницу">☆</button><button type="button" data-bookmarks aria-label="Закладки">☷</button><button type="button" data-external aria-label="Открыть отдельно">↗</button><button type="button" data-close aria-label="Закрыть браузер">Готово</button></footer>
<div class="seyveo-browser-sheet" hidden><div class="seyveo-browser-sheet-bar"><strong>Избранное</strong><button type="button" data-dismiss>Готово</button></div><div data-bookmark-list></div></div>`;
document.body.append(root);
const notice=root.querySelector('.seyveo-browser-blocked');
notice.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:25px;text-align:center;background:var(--bg,#111a16);color:var(--text,#edf3ef);z-index:2';
notice.querySelector('p').style.cssText='font-size:13px;line-height:1.5;opacity:.7';
notice.querySelector('button').style.cssText='padding:13px;border-radius:14px;border:1px solid #65b88b;background:#ffffff10;color:inherit';
const $=s=>root.querySelector(s),input=$('input'),frame=$('iframe'),tabArea=$('[data-tabs]'),sheet=$('.seyveo-browser-sheet');
let tabs=[{id:1,entries:[],position:-1}],active=1,nextId=2,displayedTab=null;
const key='seyveo-browser-bookmarks-v1';
function secureUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
function target(value){let s=String(value||'').trim();if(!s)return null;if(/^https?:\/\//i.test(s))return secureUrl(s);if(/^([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(s))return secureUrl('https://'+s);return 'https://yandex.ru/search/?text='+encodeURIComponent(s)}
function current(){return tabs.find(t=>t.id===active)}
function currentUrl(){const t=current();return t.entries[t.position]||null}
function saved(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&secureUrl(x)).slice(0,60):[]}catch{return []}}
function store(a){try{localStorage.setItem(key,JSON.stringify(a.slice(0,60)))}catch{}}
function render(){
 const t=current(),url=currentUrl(),home=!url;
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
 const recent=$('[data-recent-tabs]');recent.replaceChildren();const pages=tabs.filter(x=>x.entries[x.position]);if(!pages.length){const note=document.createElement('p');note.textContent='Начни поиск — здесь появятся твои страницы';note.className='seyveo-browser-recent-empty';recent.append(note)}else for(const p of pages.slice(-3).reverse()){const b=document.createElement('button');b.type='button';b.className='seyveo-browser-recent-item';const host=new URL(p.entries[p.position]).hostname;const label=document.createElement('strong');label.textContent=host;const small=document.createElement('small');small.textContent=p.id===active?'Текущая вкладка':'Вернуться на страницу';b.append(label,small);b.addEventListener('click',()=>{active=p.id;render()});recent.append(b)}
 tabArea.replaceChildren();
 for(const item of tabs){const pill=document.createElement('span');pill.className='seyveo-browser-tab'+(item.id===active?' is-active':'');
 const choose=document.createElement('button');choose.type='button';choose.textContent=item.entries[item.position]?new URL(item.entries[item.position]).hostname:'Новая вкладка';choose.addEventListener('click',()=>{active=item.id;render()});
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Закрыть вкладку');close.addEventListener('click',()=>{tabs=tabs.filter(t=>t.id!==item.id);if(!tabs.length)tabs=[{id:nextId++,entries:[],position:-1}];if(active===item.id)active=tabs[tabs.length-1].id;render()});
 pill.append(choose,close);tabArea.append(pill)}
}
function navigate(value){const url=secureUrl(value);if(!url)return false;const t=current();t.entries=t.entries.slice(0,t.position+1);t.entries.push(url);t.position++;render();return true}
function open(value){if(value&&!secureUrl(value))return false;root.hidden=false;document.body.classList.add('seyveo-browser-open');sheet.hidden=true;if(value)navigate(value);else render();document.dispatchEvent(new Event('seyveo:browser-open'));return true}
function close(){root.hidden=true;sheet.hidden=true;document.body.classList.remove('seyveo-browser-open');frame.removeAttribute('src');displayedTab=null;document.dispatchEvent(new Event('seyveo:browser-close'))}
function bookmarks(){const list=saved(),holder=$('[data-bookmark-list]');holder.replaceChildren();if(!list.length){holder.textContent='Пока пусто. Открой страницу и нажми ☆.'}for(const url of list){const b=document.createElement('button');b.type='button';b.textContent=new URL(url).hostname;b.addEventListener('click',()=>{sheet.hidden=true;navigate(url)});holder.append(b)}sheet.hidden=false}
root.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
root.querySelectorAll('[data-bookmarks]').forEach(b=>b.addEventListener('click',bookmarks));
$('[data-dismiss]').addEventListener('click',()=>sheet.hidden=true);
$('[data-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;render();input.focus()});
$('[data-back]').addEventListener('click',()=>{const t=current();if(t.position>0){t.position--;render()}});
$('[data-forward]').addEventListener('click',()=>{const t=current();if(t.position<t.entries.length-1){t.position++;render()}});
$('[data-home]').addEventListener('click',()=>{const t=current();t.entries=[];t.position=-1;render()});
$('[data-external]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});
$('[data-bookmark]').addEventListener('click',()=>{const url=currentUrl();if(!url)return;const a=saved();store(a.includes(url)?a.filter(x=>x!==url):[url,...a]);render()});
$('[data-recent-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;render();input.focus()});
$('[data-open-blocked]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});
root.querySelectorAll('[data-site]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.site)));
$('form').addEventListener('submit',e=>{e.preventDefault();const url=target(input.value);if(!url){input.focus();return}navigate(url)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden){if(!sheet.hidden)sheet.hidden=true;else close()}});
document.addEventListener('click',e=>{const tile=e.target.closest?.('[data-calendar-space="browser"],[data-world-space="browser"]');if(tile){e.preventDefault();open()}});
document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||root.contains(a)||!a.closest('.seyveo-conversation'))return;const u=secureUrl(a.href);if(u){e.preventDefault();open(u)}});
window.SEYVEO_BROWSER=Object.freeze({open,close,back:()=> $('[data-back]').click(),forward:()=> $('[data-forward]').click(),home:()=> $('[data-home]').click(),tabs:()=>{root.querySelector('[data-new]').click()},bookmarks:()=>bookmarks(),state:()=>({open:!root.hidden,canBack:!$('[data-back]').disabled,canForward:!$('[data-forward]').disabled})});render();
})();