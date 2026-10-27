/* SEYVEO Connections · Black Velvet interactive concept, no networking or storage. */
(()=>{'use strict';
const mount=()=>{
 if(document.getElementById('seyveoConnectionsDialog'))return;
 const icon={
  close:'<path d="M5 5 19 19M19 5 5 19"/>',
  arrow:'<path d="m14.5 5-7 7 7 7"/>',
  search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.8 4.8"/>',
  send:'<path d="m3 11 18-8-6.5 18-3.8-7.5L3 11Z"/><path d="M10.7 13.5 21 3"/>',
  spark:'<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/>',
  shield:'<path d="M12 2.5 20 6v6.5c0 5-4 8-8 9-4-1-8-4-8-9V6Z"/><path d="m8.5 12.2 2.2 2.2 4.8-5"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>',
  chat:'<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 10h8M8 13h5"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  news:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
 };
 const telegramMark='<svg class="svc-telegram-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M21.4 3.8 2.8 11c-.9.35-.88.9-.13 1.14l4.74 1.48 1.84 5.85c.2.65.43.87.86.87.34 0 .51-.15.73-.37l2.57-2.48 5.07 3.74c.94.52 1.62.25 1.84-.89l2.89-15.17c.26-1.24-.47-1.73-1.81-1.22ZM9.1 13.4l10.35-6.77c.48-.31.92-.14.56.22l-8.63 7.9-.32 3.78-1.96-5.13Z"/></svg>';
 const svg=(name,klass='')=>'<svg class="'+klass+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icon[name]||'')+'</svg>';
 const dialog=document.createElement('dialog');
 dialog.id='seyveoConnectionsDialog';
 dialog.className='svc-dialog';
 dialog.setAttribute('aria-label','SEYVEO · Telegram — интерактивная демонстрация');
 dialog.innerHTML='<div class="svc-shell">'
 +'<header class="svc-appbar"><div class="svc-brand">'
 +'<span class="svc-brand-emblem">'+telegramMark+'</span><span class="svc-brand-title"><strong>Telegram</strong><small>В ПРОСТРАНСТВЕ SEYVEO</small></span>'
 +'</div><div class="svc-appbar-right"><span class="svc-preview-tag">КОНЦЕПТ</span><button type="button" class="svc-iconbutton" data-svc="close" aria-label="Закрыть Telegram">'+svg('close')+'</button></div></header>'
 +'<div class="svc-view svc-list-view" data-svc-view="list">'
 +'<div class="svc-hero"><div class="svc-hero-light" aria-hidden="true"></div><div class="svc-hero-orbit" aria-hidden="true"></div>'
 +'<p class="svc-overline">SEYVEO / CONNECTIONS</p><h2>Ближе.<br><em>Чем когда-либо.</em></h2>'
 +'<p class="svc-hero-copy">Здесь встречаются люди, мысли и истории. Всё важное — без лишнего шума.</p>'
 +'<div class="svc-hero-signature">'+svg('spark')+'<span>ОБЩЕНИЕ НОВОГО УРОВНЯ</span></div></div>'
 +'<div class="svc-mode"><span class="svc-mode-led"></span><div><strong>Режим знакомства</strong><small>Пример интерфейса · Telegram не подключён</small></div>'+svg('shield')+'</div>'
 +'<div class="svc-tabs" role="tablist" aria-label="Разделы Telegram">'
 +'<button type="button" class="svc-tab" id="svcTabChats" role="tab" data-svc-tab="chats" aria-controls="svcPanelChats" aria-selected="true">Чаты</button>'
 +'<button type="button" class="svc-tab" id="svcTabChannels" role="tab" data-svc-tab="channels" aria-controls="svcPanelChannels" aria-selected="false">Каналы</button>'
 +'<button type="button" class="svc-tab" id="svcTabPrivacy" role="tab" data-svc-tab="privacy" aria-controls="svcPanelPrivacy" aria-selected="false">Подключение</button></div>'
 +'<section class="svc-panel" id="svcPanelChats" data-svc-panel="chats" role="tabpanel" aria-labelledby="svcTabChats">'
 +'<label class="svc-search">'+svg('search')+'<span class="svc-sr-only">Найти диалог</span><input type="search" id="svcChatSearch" placeholder="Найти разговор" autocomplete="off" maxlength="64"></label>'
 +'<div class="svc-filters" role="group" aria-label="Фильтр чатов"><button type="button" class="svc-filter is-active" data-svc-filter="all" aria-pressed="true">Все</button>'
 +'<button type="button" class="svc-filter" data-svc-filter="people" aria-pressed="false">Личные</button>'
 +'<button type="button" class="svc-filter" data-svc-filter="work" aria-pressed="false">Работа</button></div>'
 +'<div class="svc-section-heading"><span>Диалоги</span><small>3 демо-разговора</small></div><div id="svcChatList" class="svc-chatlist"></div>'
 +'<div class="svc-sayvi-teaser"><span class="svc-teaser-star">'+svg('spark')+'</span><div><strong>Твоя Сэйви. Рядом.</strong><p>Подберёт слова, когда попросишь. Никаких сообщений без твоего решения.</p></div></div>'
 +'</section>'
 +'<section class="svc-panel" id="svcPanelChannels" data-svc-panel="channels" role="tabpanel" aria-labelledby="svcTabChannels" hidden>'
 +'<div class="svc-section-heading"><span>Лента открытий</span><small>Демо-публикации</small></div>'
 +'<div class="svc-feature svc-feature-tech"><div class="svc-feature-art" aria-hidden="true"><span class="svc-feature-moon"></span><span class="svc-feature-track"></span></div>'
 +'<div class="svc-feature-content"><span class="svc-feature-kicker">ТЕХНОЛОГИИ · ПРИМЕР</span><h3>Будущее начинается сегодня.</h3><p>Идеи, которые меняют привычные вещи.</p><button type="button" class="svc-feature-link" data-svc-channel="tech">Читать историю '+svg('chevron')+'</button></div></div>'
 +'<div class="svc-feature svc-feature-life"><div class="svc-feature-content"><span class="svc-feature-kicker">ГОРОД И ЖИЗНЬ · ПРИМЕР</span><h3>Город, который удивляет.</h3><p>Моменты, которые стоит заметить.</p><button type="button" class="svc-feature-link" data-svc-channel="life">Открыть публикацию '+svg('chevron')+'</button></div></div>'
 +'<p class="svc-disclaimer">Все публикации на этом экране вымышлены. Реальные каналы будут отображаться только после подключения аккаунта.</p>'
 +'</section>'
 +'<section class="svc-panel" id="svcPanelPrivacy" data-svc-panel="privacy" role="tabpanel" aria-labelledby="svcTabPrivacy" hidden>'
 +'<div class="svc-privacy-hero">'+svg('lock')+'<div><small>ПРИВАТНОСТЬ ПО УМОЛЧАНИЮ</small><h3>Общение — это личное.</h3><p>Планируем хранить сессии и локальный кеш на устройстве, а не на серверах SEYVEO.</p></div></div>'
 +'<div class="svc-privacy-point"><span>01</span><div><strong>Вход в Telegram</strong><p>Официальная авторизация в мобильном клиенте TDLib, когда интеграция будет готова.</p></div></div>'
 +'<div class="svc-privacy-point"><span>02</span><div><strong>Сэйви — только по запросу</strong><p>Содержимое переписок не отправляется помощнику автоматически. Возможности ИИ — после проверки правил Telegram.</p></div></div>'
 +'<div class="svc-privacy-point"><span>03</span><div><strong>Доступ к данным под контролем</strong><p>Можно будет управлять разрешениями и очисткой локальных данных.</p></div></div>'
 +'<div class="svc-privacy-state">'+svg('shield')+'<span>Сейчас нет соединения, аккаунтов и серверной обработки.</span></div>'
 +'</section>'
 +'</div>'
 +'<section class="svc-view svc-thread-view" data-svc-view="thread" hidden>'
 +'<header class="svc-thread-top"><button type="button" class="svc-iconbutton" data-svc="back" aria-label="Назад к чатам">'+svg('arrow')+'</button>'
 +'<span class="svc-avatar svc-thread-avatar" id="svcThreadAvatar" aria-hidden="true"></span>'
 +'<span class="svc-thread-name"><strong id="svcThreadName"></strong><small>Демонстрационный диалог</small></span>'
 +'<span class="svc-thread-more" aria-hidden="true">'+svg('more')+'</span></header>'
 +'<div class="svc-thread-info">'+svg('lock')+'<span>Пример разговора · ничего не отправляется в Telegram</span></div>'
 +'<div class="svc-messages" id="svcMessages" role="log" aria-label="Пример переписки" aria-live="polite"></div>'
 +'<div class="svc-sayvi-inline"><div class="svc-sayvi-intro"><span>'+svg('spark')+'</span><strong>Сэйви · в диалоге</strong><small>Демо</small></div>'
 +'<button type="button" class="svc-suggest-button" data-svc="suggest">Подскажи, как красиво ответить '+svg('chevron')+'</button>'
 +'<div id="svcSuggestion" class="svc-suggestion" hidden><p id="svcSuggestionText"></p><button type="button" data-svc="apply" class="svc-apply">Вставить в сообщение '+svg('chevron')+'</button></div></div>'
 +'<form class="svc-compose" id="svcComposer"><label class="svc-sr-only" for="svcMessageInput">Сообщение</label>'
 +'<input type="text" id="svcMessageInput" autocomplete="off" maxlength="400" placeholder="Написать сообщение…">'
 +'<button class="svc-send" type="submit" aria-label="Добавить демо-сообщение">'+svg('send')+'</button></form>'
 +'<p class="svc-thread-foot">Демо · сообщение остаётся только на этом экране и исчезнет при закрытии.</p>'
 +'</section>'
 +'<section class="svc-view svc-article-view" data-svc-view="article" hidden>'
 +'<header class="svc-article-top"><button type="button" class="svc-iconbutton" data-svc="back" aria-label="Назад к каналам">'+svg('arrow')+'</button>'
 +'<span>ЛЕНТА / ДЕМО</span></header><div class="svc-article-art" aria-hidden="true">'+svg('globe')+'</div>'
 +'<span class="svc-article-kicker" id="svcArticleKicker"></span><h2 id="svcArticleTitle"></h2><p class="svc-article-body" id="svcArticleBody"></p>'
 +'<div class="svc-article-summary">'+svg('spark')+'<div><strong>Сэйви · коротко</strong><p id="svcArticleSummary"></p></div></div>'
 +'<p class="svc-disclaimer">Это вымышленная публикация для демонстрации интерфейса, не реальная новость.</p>'
 +'</section>'
 +'</div>';
 document.body.appendChild(dialog);
 const $=id=>dialog.querySelector('#'+id);
 const views=[...dialog.querySelectorAll('[data-svc-view]')];
 const panels=[...dialog.querySelectorAll('[data-svc-panel]')];
 const tabs=[...dialog.querySelectorAll('[data-svc-tab]')];
 const chatSeeds=[
 {id:'andrey',name:'Андрей',initials:'А',category:'people',shade:'mint',stamp:'10:42',unread:'2',summary:'Роман, подскажешь по заказу?',draft:'Здравствуйте, Андрей! Уточню информацию и скоро напишу вам.',messages:[{mine:false,text:'Привет! Получилось узнать по заказу?',time:'10:40'},{mine:false,text:'Роман, подскажешь по заказу?',time:'10:42'}]},
 {id:'maria',name:'Мария',initials:'М',category:'people',shade:'lavender',stamp:'Вчера',unread:'',summary:'Спасибо, всё отлично! ✨',draft:'Мария, спасибо! Очень рад, что всё понравилось.',messages:[{mine:false,text:'Спасибо, всё отлично! ✨',time:'18:20'}]},
 {id:'team',name:'Команда',initials:'✦',category:'work',shade:'gold',stamp:'Пн',unread:'',summary:'Встречаемся в 11:00, всё по плану.',draft:'Отлично, коллеги. Встречаемся в 11:00!',messages:[{mine:false,text:'Коллеги, встречаемся в 11:00, всё по плану.',time:'09:24'},{mine:true,text:'Принято!',time:'09:28'}]}
 ];
 const articles={
 tech:{kicker:'ТЕХНОЛОГИИ · ПРИМЕР',title:'Будущее начинается сегодня.',body:'Представь город, в котором цифровые инструменты становятся незаметными. Они помогают выбрать маршрут, вовремя напоминают о делах и освобождают время для того, что действительно важно. Это вымышленный пример подачи длинной публикации в новом пространстве SEYVEO.',summary:'Технологии должны освобождать время, а не требовать постоянного внимания.'},
 life:{kicker:'ГОРОД И ЖИЗНЬ · ПРИМЕР',title:'Город, который удивляет.',body:'Иногда самое интересное рядом: небольшие парки, тихие улицы, уютные пространства для работы и новые места для встреч. Такая лента могла бы объединять любимые каналы пользователя — с ясным авторством и ссылками на оригинальные публикации.',summary:'Интересные события могут быть рядом. Здесь позже будут публикации выбранных каналов.'}
 };
 let previous=null,activeTab='chats',activeChat=null,filter='all',messages={},article='tech';
 const resetMessages=()=>{messages={};chatSeeds.forEach(c=>messages[c.id]=c.messages.map(m=>({...m})));};
 const showView=name=>{views.forEach(el=>el.hidden=el.dataset.svcView!==name);const shell=dialog.querySelector('.svc-shell');if(shell)shell.scrollTop=0;};
 const setTab=name=>{
  activeTab=name;
  tabs.forEach(t=>{const selected=t.dataset.svcTab===name;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});
  panels.forEach(p=>p.hidden=p.dataset.svcPanel!==name);
  showView('list');
 };
 const make=(tag,klass,text)=>{const el=document.createElement(tag);if(klass)el.className=klass;if(text!==undefined)el.textContent=text;return el;};
 function renderChats(){
  const list=$('svcChatList');list.replaceChildren();
  const query=$('svcChatSearch').value.trim().toLocaleLowerCase('ru');
  const visible=chatSeeds.filter(c=>(filter==='all'||c.category===filter)&&(!query||(c.name+' '+c.summary).toLocaleLowerCase('ru').includes(query)));
  if(!visible.length){list.appendChild(make('p','svc-empty','Ничего не найдено. Попробуй другой запрос.'));return;}
  for(const c of visible){
   const btn=make('button','svc-chatrow');btn.type='button';btn.dataset.svcChat=c.id;btn.setAttribute('aria-label','Открыть демонстрационный диалог '+c.name);
   const avatar=make('span','svc-avatar svc-avatar-'+c.shade,c.initials);avatar.setAttribute('aria-hidden','true');
   const center=make('span','svc-chatrow-content');
   center.append(make('strong','',c.name),make('small','',messages[c.id].at(-1)?.text||c.summary));
   const right=make('span','svc-chatrow-meta');right.append(make('small','',c.stamp));
   if(c.unread)right.append(make('b','svc-unread',c.unread));
   btn.append(avatar,center,right);list.append(btn);
  }
 }
 function renderMessages(){
  const list=$('svcMessages');list.replaceChildren();
  for(const m of messages[activeChat.id]){
   const item=make('div','svc-message'+(m.mine?' is-own':''));
   item.append(make('span','svc-msg-text',m.text),make('small','svc-msg-time',m.time));
   list.append(item);
  }
  list.scrollTop=list.scrollHeight;
 }
 const currentTime=()=>{const d=new Date();return d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});};
 function openChat(id){
  const c=chatSeeds.find(row=>row.id===id);if(!c)return;activeChat=c;
  $('svcThreadAvatar').className='svc-avatar svc-thread-avatar svc-avatar-'+c.shade;
  $('svcThreadAvatar').textContent=c.initials;
  $('svcThreadName').textContent=c.name;
  $('svcSuggestion').hidden=true;$('svcMessageInput').value='';
  renderMessages();showView('thread');
 }
 function openArticle(key){
  const post=articles[key];if(!post)return;article=key;
  $('svcArticleKicker').textContent=post.kicker;
  $('svcArticleTitle').textContent=post.title;
  $('svcArticleBody').textContent=post.body;
  $('svcArticleSummary').textContent=post.summary;
  showView('article');
 }
 function close(){if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}
 function open(){
  previous=document.activeElement;resetMessages();activeChat=null;
  $('svcChatSearch').value='';filter='all';
  dialog.querySelectorAll('[data-svc-filter]').forEach(b=>{const active=b.dataset.svcFilter==='all';b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
  renderChats();setTab('chats');
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest?.('[data-calendar-space="connections"]');
  if(!trigger)return;event.preventDefault();event.stopImmediatePropagation();open();
 },true);
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){close();return;}
  const button=event.target.closest('button');if(!button)return;
  const action=button.dataset.svc;
  if(button.dataset.svcTab){setTab(button.dataset.svcTab);return;}
  if(button.dataset.svcFilter){
   filter=button.dataset.svcFilter;
   dialog.querySelectorAll('[data-svc-filter]').forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
   renderChats();return;
  }
  if(button.dataset.svcChat){openChat(button.dataset.svcChat);return;}
  if(button.dataset.svcChannel){openArticle(button.dataset.svcChannel);return;}
  if(action==='close'){close();return;}
  if(action==='back'){setTab(activeTab);return;}
  if(action==='suggest'){
   if(!activeChat)return;
   $('svcSuggestionText').textContent=activeChat.draft;
   $('svcSuggestion').hidden=false;return;
  }
  if(action==='apply'){
   if(!activeChat)return;
   $('svcMessageInput').value=activeChat.draft;
   $('svcSuggestion').hidden=true;
   $('svcMessageInput').focus();return;
  }
 });
 $('svcChatSearch').addEventListener('input',renderChats);
 $('svcComposer').addEventListener('submit',event=>{
  event.preventDefault();
  if(!activeChat)return;
  const input=$('svcMessageInput');
  const value=input.value.trim().slice(0,400);
  if(!value)return;
  messages[activeChat.id].push({mine:true,text:value,time:currentTime()});
  input.value='';$('svcSuggestion').hidden=true;
  renderMessages();input.focus();
 });
 dialog.querySelector('.svc-tabs').addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
  const idx=tabs.findIndex(t=>t.dataset.svcTab===activeTab);
  const target=event.key==='Home'?0:event.key==='End'?tabs.length-1:(idx+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  setTab(tabs[target].dataset.svcTab);tabs[target].focus();event.preventDefault();
 });
 dialog.addEventListener('close',()=>{resetMessages();activeChat=null;previous?.focus?.();});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();