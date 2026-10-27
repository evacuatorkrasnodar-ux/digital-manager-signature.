/* SEYVEO Connections — visual concept only. Does not access Telegram, contacts or network. */
(()=>{'use strict';
const mount=()=>{
if(document.getElementById('seyveoConnectionsDialog'))return;
const dialog=document.createElement('dialog');
dialog.id='seyveoConnectionsDialog';dialog.className='svc-dialog';
dialog.setAttribute('aria-label','Общение SEYVEO — демонстрация интерфейса');
dialog.innerHTML=`<div class="svc-root">
<header class="svc-head"><div class="svc-head-copy"><p class="svc-kicker">SEYVEO / CONNECTIONS</p><h2>Общение</h2><p class="svc-intro">Люди, сообщения и новости — в одном месте.</p></div><button type="button" class="svc-close" data-svc="close" aria-label="Закрыть"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button></header>
<div class="svc-demo"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg><span>Демо SEYVEO · неофициальная интеграция Telegram. Аккаунты ещё не подключаются; сообщения не читаются и не отправляются.</span></div>
<div class="svc-tabs" role="tablist" aria-label="Разделы общения"><button type="button" class="svc-tab" role="tab" data-svc-tab="chats" aria-selected="true">Чаты</button><button type="button" class="svc-tab" role="tab" data-svc-tab="channels" aria-selected="false">Каналы</button><button type="button" class="svc-tab" role="tab" data-svc-tab="connection" aria-selected="false">Подключение</button></div>
<section class="svc-section" data-svc-section="chats"><h3>Как будут выглядеть диалоги</h3><button class="svc-card" data-svc="example-chat" type="button"><span class="svc-bubble">А</span><span class="svc-card-body"><strong class="svc-card-title">Андрей · пример</strong><span class="svc-card-summary">Добрый день! Когда будет готов заказ?</span></span><span class="svc-card-arrow" aria-hidden="true">›</span></button><div class="svc-hero"><svg class="svc-hero-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-5 3V6Z"/><path d="M8 9h8M8 13h5"/></svg><h3>Чат, который понимает контекст</h3><p>В будущем Сэйви сможет помогать с ответами только в рамках разрешённых функций и согласий.</p></div></section>
<section class="svc-section" data-svc-section="channels" hidden><h3>Новости без визуального шума</h3><button class="svc-card" type="button" data-svc="example-channel"><span class="svc-bubble">◈</span><span class="svc-card-body"><strong class="svc-card-title">Лента новостей · пример</strong><span class="svc-card-summary">Статьи, видео и публикации в удобных карточках.</span></span><span class="svc-card-arrow" aria-hidden="true">›</span></button><p class="svc-subtle">Источники и их авторство будут обозначены явно. Никаких реальных публикаций в этом демо нет.</p></section>
<section class="svc-section" data-svc-section="connection" hidden><div class="svc-hero"><svg class="svc-hero-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 5 5L20 7"/><path d="M3 3h18v18H3z" opacity=".35"/></svg><h3>Один вход — своё пространство</h3><p>Авторизация в Telegram через официальный механизм TDLib. Необходимые подтверждения покажем честно и понятно.</p></div><div class="svc-line"><span class="svc-step">1</span><div><strong>Пользователь подключает аккаунт</strong><p>Номер телефона, код и возможная двухфакторная проверка через Telegram.</p></div></div><div class="svc-line"><span class="svc-step">2</span><div><strong>SEYVEO показывает выбранные диалоги</strong><p>Никакого скрытого чтения и пересылки личных сообщений помощнику.</p></div></div><div class="svc-line"><span class="svc-step">3</span><div><strong>Связь восстанавливается автоматически</strong><p>Когда доступна сеть и это допускают правила и настройки. Бесперебойность не гарантируется.</p></div></div><p class="svc-subtle">Реальное подключение появится после разработки мобильного клиента и проверки требований Telegram.</p></section>
<div class="svc-detail" data-svc-detail="chat" hidden><span class="svc-label">Демонстрационный диалог</span><h3 class="svc-detail-title">Андрей · пример</h3><div class="svc-msg">Добрый день! Когда будет готов заказ?</div><div class="svc-msg svc-msg-self">Здравствуйте! Подскажу после уточнения статуса заказа.</div><p class="svc-subtle">Это вымышленные сообщения. Отправка и ИИ-обработка отключены.</p><button type="button" class="svc-button" data-svc="back">Вернуться к чатам</button></div>
<div class="svc-detail" data-svc-detail="channel" hidden><span class="svc-label">Макет публикации</span><h3 class="svc-detail-title">Лента новостей</h3><p class="svc-subtle">Здесь появятся публикации из выбранных пользователем каналов после подключения Telegram. Авторство, изображения и оригинальные ссылки будут сохранены.</p><button type="button" class="svc-button" data-svc="back">Вернуться к каналам</button></div>
</div>`;
document.body.appendChild(dialog);
let active='chats',previous=null;
const sections=[...dialog.querySelectorAll('[data-svc-section]')],tabs=[...dialog.querySelectorAll('[data-svc-tab]')],details=[...dialog.querySelectorAll('[data-svc-detail]')];
function showTab(name){active=name;sections.forEach(el=>el.hidden=el.dataset.svcSection!==name);tabs.forEach(el=>el.setAttribute('aria-selected',el.dataset.svcTab===name?'true':'false'));details.forEach(el=>el.hidden=true);dialog.querySelector('.svc-tabs').hidden=false;}
function showDetail(name){sections.forEach(el=>el.hidden=true);details.forEach(el=>el.hidden=el.dataset.svcDetail!==name);dialog.querySelector('.svc-tabs').hidden=true;}
function close(){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}
function open(){previous=document.activeElement;showTab('chats');if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
document.addEventListener('click',ev=>{const button=ev.target.closest?.('[data-calendar-space="connections"]');if(!button)return;ev.preventDefault();ev.stopImmediatePropagation();open();},true);
dialog.addEventListener('click',ev=>{const button=ev.target.closest('button');if(!button)return;
const tab=button.dataset.svcTab,action=button.dataset.svc;
if(tab)showTab(tab);
else if(action==='close')close();
else if(action==='example-chat')showDetail('chat');
else if(action==='example-channel')showDetail('channel');
else if(action==='back')showTab(active);
});
dialog.addEventListener('close',()=>previous?.focus?.());
dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
