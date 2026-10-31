/* SEYVEO Browser · in-app HTTPS viewer prototype.
   Native iOS/Android WebView is required for full browsing/navigation.
   Tabs are session-only; bookmarks are saved only on this device. */
(()=>{'use strict';
 const root=document.createElement('section');
 root.id='seyveoBrowser';root.className='seyveo-browser';root.hidden=true;
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','SEYVEO Browser');
 root.innerHTML=`<header class="seyveo-browser-top"><button type="button" data-close aria-label="Назад в SEYVEO">‹</button><strong>SEYVEO <span>Browser</span></strong><span class="seyveo-browser-shield" aria-label="HTTPS">◇</span></header>
 <form class="seyveo-browser-bar"><input type="text" name="address" inputmode="url" autocomplete="off" spellcheck="false" placeholder="Адрес сайта https://…" aria-label="Адрес сайта"><button type="submit" aria-label="Перейти">→</button></form>
 <nav class="seyveo-browser-tabs" aria-label="Вкладки"><div data-tabs></div><button type="button" data-new aria-label="Новая вкладка">＋</button></nav>
 <div class="seyveo-browser-content"><div class="seyveo-browser-empty">Открой сайт по адресу HTTPS. Для поиска информации попроси Сэйви.</div><iframe title="Веб-страница" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms" hidden></iframe></div>
 <div class="seyveo-browser-note">Сайты могут запретить встроенный просмотр. Это ещё не нативный браузер и не блокировщик рекламы.</div>
 <footer class="seyveo-browser-bottom"><button type="button" data-back aria-label="Назад">‹</button><button type="button" data-forward aria-label="Вперёд">›</button><button type="button" data-bookmark aria-label="Добавить закладку">☆</button><button type="button" data-bookmarks aria-label="Закладки">Закладки</button><button type="button" data-external aria-label="Открыть во внешнем браузере">↗</button><button type="button" data-close>Готово</button></footer>`;
 document.body.append(root);
 const input=root.querySelector('input'),frame=root.querySelector('iframe'),empty=root.querySelector('.seyveo-browser-empty');
 const tabsArea=root.querySelector('[data-tabs]');
 let tabs=[{id:1,entries:[],position:-1}],active=1,nextId=2;
 let displayedTab=null;
 const bookmarkKey='seyveo-browser-bookmarks-v1';
 // Secure embeds cannot expose their internal history or current URL to this page.
 function secureUrl(value){
  try{const u=new URL(String(value).trim());return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}
 }
 function currentTab(){return tabs.find(t=>t.id===active)}
 function currentUrl(){const t=currentTab();return t?.entries[t.position]||null}
 function loadBookmarks(){
  try{const data=JSON.parse(localStorage.getItem(bookmarkKey)||'[]');return Array.isArray(data)?data.filter(x=>typeof x==='string'&&secureUrl(x)).slice(0,40):[]}
  catch{return []}
 }
 function saveBookmarks(list){try{localStorage.setItem(bookmarkKey,JSON.stringify(list.slice(0,40)))}catch{}}
 function show(){
  root.hidden=false;document.body.classList.add('seyveo-browser-open');
 }
 function render(){
  const url=currentUrl();
  input.value=url||'';
  frame.hidden=!url;empty.hidden=!!url;
  if(url){if(displayedTab!==active||frame.getAttribute('src')!==url){frame.src=url;displayedTab=active}}
  else{frame.removeAttribute('src');displayedTab=null;}
  const t=currentTab();
  root.querySelector('[data-back]').disabled=t.position<=0;
  root.querySelector('[data-forward]').disabled=t.position>=t.entries.length-1;
  root.querySelector('[data-external]').disabled=!url;
  root.querySelector('[data-bookmark]').disabled=!url;
  root.querySelector('[data-bookmark]').textContent=url&&loadBookmarks().includes(url)?'★':'☆';
  tabsArea.replaceChildren();
  for(const item of tabs){
   const holder=document.createElement('span');holder.className='seyveo-browser-tab'+(item.id===active?' is-active':'');
   const choose=document.createElement('button');choose.type='button';choose.textContent=item.entries[item.position]?new URL(item.entries[item.position]).hostname:'Новая вкладка';
   choose.setAttribute('aria-label','Открыть вкладку');choose.addEventListener('click',()=>{active=item.id;render()});
   const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Закрыть вкладку');
   remove.addEventListener('click',()=>{tabs=tabs.filter(x=>x.id!==item.id);if(!tabs.length)tabs=[{id:nextId++,entries:[],position:-1}];if(active===item.id)active=tabs[tabs.length-1].id;render()});
   holder.append(choose,remove);tabsArea.append(holder);
  }
 }
 function navigate(value){
  const url=secureUrl(value);if(!url)return false;
  const t=currentTab();t.entries=t.entries.slice(0,t.position+1);t.entries.push(url);t.position++;
  render();return true;
 }
 function open(value){
  if(value&&!secureUrl(value))return false;
  show();if(value)navigate(value);else render();return true;
 }
 function close(){root.hidden=true;document.body.classList.remove('seyveo-browser-open');frame.removeAttribute('src');displayedTab=null;}
 root.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
 root.querySelector('[data-new]').addEventListener('click',()=>{const t={id:nextId++,entries:[],position:-1};tabs.push(t);active=t.id;render();input.focus()});
 root.querySelector('[data-back]').addEventListener('click',()=>{const t=currentTab();if(t.position>0){t.position--;render()}});
 root.querySelector('[data-forward]').addEventListener('click',()=>{const t=currentTab();if(t.position<t.entries.length-1){t.position++;render()}});
 root.querySelector('[data-external]').addEventListener('click',()=>{const url=currentUrl();if(url)window.open(url,'_blank','noopener,noreferrer')});
 root.querySelector('[data-bookmark]').addEventListener('click',()=>{const url=currentUrl();if(!url)return;let list=loadBookmarks();list=list.includes(url)?list.filter(x=>x!==url):[url,...list];saveBookmarks(list);render()});
 root.querySelector('[data-bookmarks]').addEventListener('click',()=>{
  const list=loadBookmarks();if(!list.length){empty.textContent='Закладок пока нет. Открой сайт и нажми ☆.';return}
  const selection=window.prompt('Закладки (введи номер):\n'+list.map((u,i)=>(i+1)+'. '+new URL(u).hostname).join('\n'));
  if(selection!==null&&/^\d+$/.test(selection)){const url=list[Number(selection)-1];if(url)navigate(url)}
 });
 root.querySelector('form').addEventListener('submit',e=>{
  e.preventDefault();if(!navigate(input.value)){input.setCustomValidity('Введи полный адрес https://…');input.reportValidity()}else input.setCustomValidity('');
 });
 input.addEventListener('input',()=>input.setCustomValidity(''));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden)close()});
 // Public HTTPS links from the Feather Chat open in SEYVEO without changing the chat.
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');
  if(!link||root.contains(link)||!link.closest('.seyveo-conversation'))return;
  const url=secureUrl(link.href);if(!url)return;
  event.preventDefault();open(url);
 });
 document.addEventListener('click',event=>{
  const tile=event.target.closest?.('[data-calendar-space="browser"]');
  if(!tile)return;
  event.preventDefault();open();
 });
 window.SEYVEO_BROWSER=Object.freeze({open,close});
 render();
})();
