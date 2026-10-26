/* SEYVEO · Connection Coach v1
 * An accessible guide, NOT a connector, OAuth flow, marketing campaign or crawler.
 * Uses only already-confirmed Business Map knowledge; never asks for secrets.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const parent=$('connectionCoach');
if(!parent)return;
const TOPICS=Object.freeze({
 site:{
  name:'Сайт',short:'Сайт',what:'Сайт — ваша вывеска в интернете: люди видят услуги, цены и как с вами связаться. Только дверь нужно не забыть открыть — указать телефон и способ оставить заявку.',
  benefit:'Понятная страница помогает человеку решить, обращаться к вам или искать дальше.',
  start:['Укажите адрес сайта в Подключениях. Пока это просто ссылка, а не доступ к управлению сайтом.',
   'Проверьте на телефоне: видно ли, что вы предлагаете, в каком городе работаете и как заказать.',
   'Если захотите измерять обращения, понадобится отдельная настройка статистики с вашим согласием.'],
  promo:['Проверьте, за пять секунд понятно ли, какую проблему решает ваш бизнес и где вы работаете.',
   'Сделайте заметной одну главную кнопку обращения: позвонить, написать или оставить заявку.',
   'Уточните страницы услуг, реальные примеры работы и контакты. Затем замеряйте обращения, когда аналитика будет подключена.'],
  specialist:['Уточнить, где размещён сайт, кто им управляет и есть ли официальная панель администратора.',
   'Проверить корректность мобильной версии, форм заявок и контактов; согласовать с владельцем изменения.',
   'При наличии согласия настроить поддерживаемую аналитику и ограниченный доступ. Пароли SEYVEO не передавать.'],
  needs:'Для автоматических отчётов понадобится доступ к поддерживаемой аналитике сайта, а не пароль от хостинга.'
 },
 vk:{
  name:'ВКонтакте',short:'ВКонтакте',what:'Сообщество ВКонтакте — витрина, место для вопросов и отзывов. Само наличие страницы клиентов не приводит: даже самый красивый магазин без вывески трудно найти.',
  benefit:'Можно знакомить людей с услугами, собирать вопросы и направлять их на заказ.',
  start:['Добавьте ссылку на сообщество в Подключения.',
   'Уточните, кто управляет сообществом и кому принадлежат права администратора.',
   'Для будущего чтения сообщений нужен отдельный официальный доступ, который можно отозвать.'],
  promo:['Проверьте описание, контакты, часы работы и закреплённое сообщение с понятным предложением.',
   'Составьте небольшой план реальных полезных публикаций: примеры работ, ответы на вопросы и отзывы с согласия клиентов.',
   'Рекламу запускайте только с утверждённым бюджетом и целью. Сравнивайте обращения, а не количество лайков.'],
  specialist:['Уточнить владельца сообщества и набор доступных прав без передачи личного пароля.',
   'Проверить официальный способ ограниченного доступа к сообществу и отчётам, согласовать требуемые разрешения.',
   'Если планируется продвижение — подготовить воронку обращений и отдельный рекламный бюджет на утверждение.'],
  needs:'Переписка и статистика ВКонтакте пока не читаются. Нужен официальный механизм авторизации и согласие.'
 },
 telegram:{
  name:'Telegram',short:'Telegram',what:'Канал Telegram рассказывает новости, а рабочий чат помогает отвечать клиентам. Бот — отдельный помощник в чате, но сам себя к делу не приставит.',
  benefit:'Подходит для новостей, повторных обращений и ответов клиентам там, где им удобно.',
  start:['Укажите публичный канал или рабочий ресурс, не личный пароль и не код входа.',
   'Определите, что полезно автоматизировать: заявки, вопросы или публикации.',
   'Если понадобится бот, его права, безопасность и возможность отключения нужно настроить отдельно.'],
  promo:['Уточните тему канала и причину подписаться — например, советы, новости или полезные предложения.',
   'Пишите регулярно и по делу, оставьте понятную ссылку для обращения.',
   'Если будете рекламировать канал, заранее определите бюджет и измеряйте заявки, а не только подписчиков.'],
  specialist:['Определить официальную модель доступа: канал, бот или ограниченная интеграция.',
   'Согласовать с владельцем права на чтение, ответы и публикацию по отдельности; не передавать коды входа.',
   'Проверить работу бота на тестовом чате и процедуру быстрого отключения.'],
  needs:'Личные сообщения не читаются. Бот и канал подключаются отдельно и с минимальными правами.'
 },
 marketplace:{
  name:'Ozon / Wildberries',short:'Маркетплейсы',what:'Маркетплейс — большой торговый центр в телефоне. В нём есть покупатели, но среди соседних витрин важно показать, почему выбрать именно вас.',
  benefit:'Можно улучшать карточки товаров и разбираться, что мешает покупателю оформить заказ.',
  start:['Добавьте открытую ссылку на витрину в Подключения.',
   'SEYVEO попробует прочитать только публичные сведения, если площадка разрешает это.',
   'Для заказов, остатков и статистики понадобится отдельное разрешённое подключение кабинета продавца.'],
  promo:['Проверьте названия, реальные фото, характеристики и ответы на частые вопросы в карточках.',
   'Сравните условия доставки и наличие товаров, используя подтверждённые данные своего кабинета.',
   'Не тратьте рекламный бюджет вслепую: сначала определите цель и считайте расходы на заказ.'],
  specialist:['Проверить официальный интерфейс интеграции выбранной площадки и доступные права.',
   'Предложить только нужные данные — товары, остатки, заказы, отчёты; сначала доступ на чтение.',
   'Не пересылать ключи API в чат или Блокнот: хранить их в защищённом серверном хранилище после согласования.'],
  needs:'Сведения открытой витрины — не статистика продаж. Кабинеты продавца сейчас не подключены.'
 },
 maps:{
  name:'Яндекс Бизнес / 2ГИС',short:'Карты',what:'Карты — дорожные указатели к вашему бизнесу. Если адрес, телефон и время работы неверные, даже хорошая реклама приведёт человека не туда.',
  benefit:'Помогают местным клиентам найти компанию и связаться с ней.',
  start:['Укажите ссылку на карточку организации в Подключениях.',
   'Проверьте адрес, контакты, график и реальные фотографии.',
   'Отзывы и статистику SEYVEO сможет читать только после поддерживаемого официального подключения.'],
  promo:['Заполните услуги, часы работы и способы связи одинаково во всех подтверждённых карточках.',
   'Добавьте настоящие фотографии и корректные сведения, отвечайте на отзывы без выдуманных обещаний.',
   'Оцените реальные звонки и обращения, а не только просмотры карточки.'],
  specialist:['Подтвердить право владельца на карточки компании и официальные способы управления.',
   'Проверить единообразие адреса, телефонов, категорий и услуг.',
   'Согласовать аналитику и ограниченные права только там, где площадка поддерживает такую интеграцию.'],
  needs:'Статистика и отзывы пока не поступают в SEYVEO — нужны отдельные поддерживаемые подключения.'
 },
 avito:{
  name:'Авито',short:'Авито',what:'Авито — площадка объявлений. Для покупателя важно быстро понять, что предлагают, сколько стоит и как связаться. Магии нет, но хороший текст делает жизнь легче.',
  benefit:'Позволяет находить обращения от людей, которые уже ищут услугу или товар.',
  start:['Добавьте общедоступную ссылку на объявления или профиль.',
   'Проверьте фотографии, описание, город и контактный способ.',
   'Чтобы в будущем видеть сообщения и статистику, понадобится отдельное официальное разрешение.'],
  promo:['Сделайте название объявления понятным, а описание — конкретным и без завышенных обещаний.',
   'Добавьте реальные фотографии и объясните, как быстро можно получить услугу.',
   'Уточните, сколько обращений получаете и какие объявления приводят заказчиков.'],
  specialist:['Проверить публичные объявления и актуальность сведений.',
   'Выяснить наличие официальной интеграции с нужными правами; не собирать пароли от профиля.',
   'При наличии поддерживаемого доступа согласовать отчёты о заявках и способ его отзыва.'],
  needs:'Автоматическое чтение сообщений и статистики Авито пока недоступно.'
 },
 crm:{
  name:'CRM',short:'CRM',what:'CRM — это электронная тетрадь для клиентов и заявок. Она помнит, кто позвонил, о чём договорились и кому нужно ответить. В отличие от бумажной тетради, не прячется под стопкой документов.',
  benefit:'Помогает не терять заявки, видеть этапы заказа и вовремя связываться с клиентами.',
  start:['Сначала выясните, где сейчас хранятся заявки: в телефоне, мессенджере, таблице или CRM.',
   'Если CRM уже есть, укажите её название в Подключениях — никаких паролей.',
   'Если CRM нет, не нужно срочно покупать систему. Можно сначала разобрать путь клиента от звонка до оплаты.'],
  promo:['Поймите, из каких источников приходят заявки: сайт, карты, Авито, соцсети.',
   'Фиксируйте, сколько человек обратилось и сколько стали клиентами.',
   'Когда процесс станет понятен, решите, нужна ли CRM для напоминаний и контроля заявок.'],
  specialist:['Определить существующую CRM и доступный официальный способ интеграции.',
   'Согласовать минимальный набор полей: источник заявки, дата, статус и ответственный; без лишних персональных данных.',
   'Реализовать защищённую авторизацию на сервере, проверить журнал действий и отзыв доступа.'],
  needs:'Без подключения SEYVEO не читает заявки, переписки и карточки клиентов.'
 },
 mail:{
  name:'Рабочая почта',short:'Почта',
  what:'Почта — цифровой почтовый ящик компании. По ней приходят заказы, счета и вопросы. Главное — не превращать «Входящие» в музей непрочитанных писем.',
  benefit:'Позволяет вовремя замечать обращения и отделять рабочее от личного.',
  start:['Уточните, какой почтовый сервис используете для работы.',
   'Определите, какие письма важны: новые заявки, ответы клиентам или документы.',
   'Для будущего доступа понадобится поддерживаемое разрешение к выбранному рабочему ящику.'],
  promo:['Укажите рабочую почту в контактах сайта и социальных сетей.',
   'Проверяйте, что ответы на обращения доходят до клиентов.',
   'Не отправляйте массовые письма без согласия получателей; лучше работать с реальными запросами.'],
  specialist:['Проверить поддерживаемую безопасную авторизацию почтового сервиса.',
   'Запросить только нужные права и согласие владельца, предпочтительно к отдельному рабочему ящику.',
   'Проверить отключение доступа и защиту персональных данных клиентов.'],
  needs:'SEYVEO не читает письма. Пароль от почты и коды подтверждения сюда передавать нельзя.'
 },
 accounting:{
  name:'Бухгалтерия / 1С',short:'Бухгалтерия',
  what:'Бухгалтерия — место, где деньги перестают быть просто цифрами в голове. Там ведут доходы, расходы и документы.',
  benefit:'Помогает вовремя видеть обязательства и не путать выручку с прибылью.',
  start:['Уточните, чем сейчас ведёте учёт: бухгалтер, программа или таблица.',
   'Определите один главный вопрос: сколько тратим, что должны оплатить или какие сроки важны.',
   'Доступ к документам и операциям понадобится согласовывать отдельно.'],
  promo:['Сначала определите, сколько можно позволить себе потратить на привлечение одного клиента.',
   'Фиксируйте рекламные расходы и связанные с ними реальные заявки.',
   'Не делайте выводы по выручке без учёта расходов и маржи.'],
  specialist:['Проверить официальный способ доступа к бухгалтерской системе и правила хранения документов.',
   'Согласовать минимально необходимые отчёты, период и права доступа.',
   'Организовать безопасную проверку на тестовых данных и возможность отозвать разрешение.'],
  needs:'Финансовые документы сейчас не загружаются. Пароли, ключи и реквизиты в чат не пересылать.'
 },
 bank:{
  name:'Банк',short:'Банк',
  what:'Банк показывает движение денег. Но не каждая входящая сумма — прибыль: часть из неё сразу уходит на расходы.',
  benefit:'В будущем позволит сопоставлять поступления и платежи с реальными заказами.',
  start:['Укажите только название банка, не номер счёта и не пароль.',
   'Решите, какую задачу хотите понять: приход денег, расходы или сверку платежей.',
   'Перед любым доступом потребуется официальный способ авторизации и отдельное согласие.'],
  promo:['Согласуйте допустимый рекламный бюджет до запуска кампании.',
   'Отдельно учитывайте потраченные средства и количество полученных заказов.',
   'Не делайте автоматические платежи и переводы без явного разрешения владельца.'],
  specialist:['Проверить наличие официального механизма ограниченного доступа к финансовым операциям.',
   'Согласовать только чтение нужных отчётов и срок действия доступа.',
   'Настроить безопасное хранение авторизации, журнал операций и немедленный отзыв прав.'],
  needs:'Банковские счета и операции не подключены. SEYVEO не имеет права самостоятельно переводить деньги.'
 },
 ads:{
  name:'Реклама',short:'Реклама',what:'Реклама — приглашение познакомиться с вашим делом. Главное, чтобы приглашение привело к заказу, а не просто красивой цифре просмотров.',
  benefit:'Помогает искать новых клиентов, но деньги расходуются только после утверждения бюджета.',
  start:['Выберите одно направление: сайт, карты, объявления или соцсеть.',
   'Назовите цель рекламы: заявки, звонки или покупки.',
   'Определите небольшой допустимый бюджет и способ понять, окупается ли реклама.'],
  promo:['Проверьте, готовы ли посадочная страница и способ принимать обращения.',
   'Сформулируйте одно понятное предложение для определённой аудитории.',
   'Запускайте тест только с согласованным бюджетом; сравните реальные обращения с расходами.'],
  specialist:['Согласовать цель, географию, бюджет, аудиторию и площадку.',
   'Настроить измерение обращений через официальные инструменты, не передавая пароли в чат.',
   'Подготовить черновик объявлений, проверить ограничения площадки и запускать только после одобрения.'],
  needs:'SEYVEO пока не создаёт и не запускает объявления и не видит рекламную статистику.'
 }
});
const ORDER=['site','vk','telegram','marketplace','maps','avito','crm','ads'];
const EXTRA_ORDER=['mail','accounting','bank'];
const LABELS=Object.freeze({site:'Сайт',vk:'ВКонтакте',telegram:'Telegram',marketplace:'Ozon / WB',maps:'Карты',avito:'Авито',crm:'CRM',ads:'Реклама',mail:'Рабочая почта',accounting:'Бухгалтерия / 1С',bank:'Банк'});
const canonical=type=>type==='yandex'||type==='gis'?'maps':TOPICS[type]?type:'';
const safeNoteText=value=>String(value||'').replace(/\s+/g,' ').trim().slice(0,500);
let topic='site',purpose='learn',mode='owner',showOtherServices=false;
const choices=$('connectionCoachChoices'),detail=$('connectionCoachDetails');
// One confirmed resource list from the existing Business Map, no second facts database.
const FOLLOWUP_KEY='seyveo-connection-followups-v1';
const registered=$('connectionCoachKnown'),registeredList=$('connectionCoachKnownList');
const presence=$('connectionCoachPresent'),presenceNote=$('connectionCoachPresentNote');
const topicFor=id=>id==='yandex'||id==='gis'?'maps':canonical(id);
const storageType=id=>id==='maps'?'yandex':id;
function knownResources(){
 const rows=map()?.resources||[];
 return {rows,types:[...new Set(rows.map(row=>topicFor(row.type)).filter(Boolean))]};
}
function followups(){
 try{
  const raw=JSON.parse(localStorage.getItem(FOLLOWUP_KEY)||'{}');
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const clean={};
  for(const [type,row] of Object.entries(raw)){
   if(!TOPICS[type]||!row||typeof row!=='object')continue;
   clean[type]={until:Number.isFinite(row.until)?Math.max(0,Math.min(row.until,Date.now()+365*86400000)):0,off:row.off===true};
  }
  return clean;
 }catch{return {}}
}
function persistFollowups(records){
 try{localStorage.setItem(FOLLOWUP_KEY,JSON.stringify(records));return true}catch{return false}
}
// One visual catalog. Every item has a permanent icon and a contextual editor.
const SERVICE_ICONS=Object.freeze({
 site:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>',
 yandex:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 gis:'<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
 avito:'<circle cx="6" cy="7" r="2.5"/><circle cx="17.5" cy="6.5" r="3"/><circle cx="7.5" cy="17" r="3"/><circle cx="17.5" cy="17.5" r="2.5"/>',
 vk:'<path d="M4 7c1 7 4 11 8 11v-5c2 0 3 3 7 5h2c-1.2-3-3.5-5-4-6 2-2 3-3 4-5h-4c-1 2-3 4-5 4V7H9v6c-2-1-3-4-4-6H4Z"/>',
 telegram:'<path d="m21 3-4 18-5.5-5-3.5 3v-5l-5-2 18-9ZM8 14l13-11-9.5 13"/>',
 crm:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 marketplace:'<path d="M4 9h16l-1 12H5L4 9ZM3 9l3-6h12l3 6M9 9v3a3 3 0 0 0 6 0V9"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
 ads:'<path d="m3 10 15-6v16L3 14v-4ZM7 15l2 6h4l-3-5M18 9c3 0 3 6 0 6"/>',
 accounting:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 7h8M8 12h2m4 0h2M8 16h2m4 0h2"/>',
 bank:'<path d="m2 9 10-6 10 6M3 9h18M5 10v9m5-9v9m4-9v9m5-9v9M2 21h20"/>',
 other:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
});
let activeResourceType='',resourceDraft='';
const resourceStatus=$('connectionCoachResourceStatus');
function resourceIcon(type){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
 svg.setAttribute('stroke-width','1.45');svg.setAttribute('stroke-linecap','round');
 svg.setAttribute('stroke-linejoin','round');
 svg.innerHTML=SERVICE_ICONS[type]||SERVICE_ICONS.other;
 return svg;
}
function renderRegistry(){
 if(!registered||!registeredList)return;
 registered.hidden=false;
 const {rows}=knownResources();
 const types=window.SEYVEO_BUSINESS_MAP?.resourceTypes?.()||[];
 const summary=$('connectionManagePrompt');
 if(summary)summary.textContent=rows.length?'Указано ресурсов: '+rows.length+' · без доступа к сервисам':'Ваши сервисы · разрешения отдельно';
 registeredList.replaceChildren();
 for(const item of types){
  const saved=rows.filter(v=>v.type===item.id);
  const expanded=activeResourceType===item.id;
  const box=document.createElement('article');box.className='sv-connect-tile'+(expanded?' is-expanded':'');
  const toggle=document.createElement('button');toggle.type='button';
  toggle.className='sv-connect-tile-top';toggle.dataset.resourceToggle=item.id;
  toggle.setAttribute('aria-expanded',String(expanded));
  toggle.setAttribute('aria-label',item.name+': '+(saved.length?'указан, не подключён':'не указан')+'. Изменить');
  const symbol=document.createElement('span');symbol.className='sv-connect-tile-icon';symbol.append(resourceIcon(item.id));
  const name=document.createElement('strong');name.textContent=item.name;
  const state=document.createElement('small');state.className='sv-connect-tile-state';
  state.textContent=saved.length?'Указан · без доступа':'Не указан';
  const glyph=document.createElement('span');glyph.className='sv-connect-tile-plus';
  glyph.textContent=expanded?'−':'+';
  toggle.append(symbol,name,state,glyph);
  box.append(toggle);
  if(saved.length&&!expanded){
   const teaser=document.createElement('div');teaser.className='sv-connect-tile-preview';
   teaser.textContent=saved.length===1?(saved[0].value==='Использую'?'Пользуюсь':saved[0].value):saved.length+' записи';
   box.append(teaser);
  }
  if(expanded){
   const editor=document.createElement('div');editor.className='sv-connect-tile-editor';
   const desc=document.createElement('p');desc.textContent=item.reason;
   editor.append(desc);
   for(const value of saved){
    const entry=document.createElement('div');entry.className='sv-connect-saved';
    const label=document.createElement('span');label.textContent=value.value==='Использую'?'Отмечено: пользуюсь':value.value;
    const remove=document.createElement('button');remove.type='button';
    remove.dataset.resourceRemoveType=item.id;remove.dataset.resourceRemoveValue=value.value;
    remove.textContent='Убрать';remove.setAttribute('aria-label','Убрать '+item.name+': '+value.value);
    entry.append(label,remove);editor.append(entry);
   }
   const form=document.createElement('form');form.dataset.resourceForm=item.id;
   form.className='sv-connect-tile-form';
   const fieldLabel=document.createElement('label');fieldLabel.textContent='Название или публичный адрес';
   const field=document.createElement('input');field.type='text';field.maxLength=180;
   field.required=true;field.autocomplete='off';field.name='resourceValue';
   field.placeholder=item.id==='site'?'https://example.ru':'Название или ссылка';
   field.value=resourceDraft;
   fieldLabel.append(field);form.append(fieldLabel);
   const save=document.createElement('button');save.type='submit';save.textContent='Сохранить';
   form.append(save);editor.append(form);
   const message=document.createElement('small');
   message.textContent='Сохраняется только эта запись. Доступ к сервису не предоставляется.';
   editor.append(message);
   const topicId=topicFor(item.id);
   if(TOPICS[topicId]){
    const guide=document.createElement('button');guide.type='button';
    guide.className='sv-connect-tile-guide';guide.dataset.resourceGuide=topicId;
    guide.textContent='Как подключить';editor.append(guide);
   }
   if(saved.length){
    const typeKey=topicFor(item.id);
    if(TOPICS[typeKey]){
     const prefs=followups()[typeKey]||{};
     const paused=prefs.off||prefs.until>Date.now();
     const actions=document.createElement('div');actions.className='sv-connect-tile-followup';
     const remind=document.createElement('button');remind.type='button';
     remind.dataset.resourceFollowup=typeKey;
     remind.dataset.resourceAction=paused?'resume':'later';
     remind.textContent=paused?'Возобновить напоминания':'Напомнить позже';
     actions.append(remind);
     if(!prefs.off){
      const silent=document.createElement('button');silent.type='button';
      silent.dataset.resourceFollowup=typeKey;silent.dataset.resourceAction='off';
      silent.textContent='Не напоминать';actions.append(silent);
     }
     editor.append(actions);
    }
   }
   box.append(editor);
  }
  registeredList.append(box);
 }
}

function renderPresence(){
 if(!presence||!presenceNote)return;
 const {rows,types}=knownResources();
 const relevant=topic==='maps'?['gis','yandex']:[topic];
 const detailed=rows.some(row=>relevant.includes(row.type)&&row.value!=='Использую');
 presence.checked=types.includes(topic);
 presence.disabled=detailed;
 presenceNote.textContent=detailed?'Название и адрес можно изменить в списке ваших сервисов выше.'
  :presence.checked?'Сэйви запомнила ресурс, но доступа к нему не получила.'
  :'Сохранится только отметка, без паролей и чтения данных.';
}

const result=$('connectionCoachResult');
const map=()=>window.SEYVEO_BUSINESS_MAP?.getState?.()||null;
/* Suggestions use only the business owner's existing, local facts.
 * They are not an AI assessment and cannot enable a service. */
const SECTOR_START=Object.freeze({
 auto:['maps','avito','crm'],beauty:['maps','vk','crm'],
 retail:['maps','marketplace','crm'],ecommerce:['marketplace','site','crm'],
 construction:['maps','avito','crm'],food:['maps','site','crm'],
 services:['site','maps','crm'],other:['site','crm','mail']
});
const SECTOR_NAMES=Object.freeze({
 auto:'автоуслуг',beauty:'красоты и ухода',retail:'розничной торговли',
 ecommerce:'интернет-магазина',construction:'строительства и ремонта',
 food:'кафе и ресторанов',services:'профессиональных услуг',other:'вашего дела'
});
function recommendations(){
 const profile=map();
 const sector=typeof profile?.industry==='string'&&SECTOR_START[profile.industry]
  ?profile.industry:'';
 const resources=Array.isArray(profile?.resources)?profile.resources:[];
 const known=[...new Set(resources.map(x=>canonical(x?.type)).filter(Boolean))];
 if(!sector&&!known.length)return null;
 const types=[...new Set([...known,...(SECTOR_START[sector]||['site','maps','crm'])])].slice(0,3);
 return {sector,types,known:new Set(known)};
}
function renderPersonal(){
 const host=$('connectionCoachPersonal'),rec=recommendations();
 host.hidden=!rec;
 if(!rec)return;
 $('connectionCoachPersonalTitle').textContent=rec.sector
  ?'Для '+SECTOR_NAMES[rec.sector]+' я бы начал с этого:'
  :'Вы уже указали эти ресурсы — начнём с них:';
 const list=$('connectionCoachPersonalChoices');
 list.replaceChildren();
 for(const type of rec.types){
  const button=document.createElement('button');
  button.type='button';button.dataset.coachRecommend=type;
  button.textContent=LABELS[type]+(rec.known.has(type)?' · указан':' · изучить');
  button.setAttribute('aria-label',LABELS[type]+(rec.known.has(type)?', указан в Подключениях':', рекомендация'));
  list.append(button);
 }
}
function context(type){
 const data=map();
 if(!data?.resources?.length)return 'SEYVEO пока не знает, какие сервисы вы используете. Это нормально — познакомимся постепенно.';
 const source=type==='maps'?['yandex','gis']:
  type==='marketplace'?['marketplace']:
  type==='crm'?['crm']:
  [type];
 const found=data.resources.filter(x=>source.includes(x.type));
 return found.length
  ?'Вы уже указали этот ресурс в Подключениях. Но доступ к нему ещё не подключён.'
  :'Этот ресурс ещё не указан в Подключениях. Если пользуетесь им, можно рассказать о нём позже.';
}
function updateChips(){
 choices.replaceChildren();
 for(const id of showOtherServices?[...ORDER,...EXTRA_ORDER]:ORDER){
  const button=document.createElement('button');
  button.type='button';button.dataset.coachType=id;button.textContent=LABELS[id];
  button.setAttribute('aria-pressed',String(id===topic));
  choices.append(button);
 }
 const more=document.createElement('button');
 more.type='button';more.className='connection-coach-more';
 more.dataset.coachMore='true';
 more.textContent=showOtherServices?'Скрыть дополнительные сервисы':'Ещё: почта, банк, 1С';
 more.setAttribute('aria-expanded',String(showOtherServices));
 choices.append(more);
 $('connectionCoachLearn').setAttribute('aria-pressed',String(purpose==='learn'));
 $('connectionCoachPromote').setAttribute('aria-pressed',String(purpose==='promote'));
 $('connectionCoachSelf').setAttribute('aria-pressed',String(mode==='owner'));
 $('connectionCoachSpecialist').setAttribute('aria-pressed',String(mode==='specialist'));
 $('connectionCoachHelp').textContent=purpose==='promote'
  ?'Сначала выберем, где вас могут найти клиенты. Разберём полезные шаги без запуска рекламы.'
  :'Выберите знакомый инструмент — объясню его назначение без технических загадок.';
}
/* Three visible actions. Full explanations remain in copy/Notepad output. */
const QUICK_STEPS=Object.freeze({
 site:{learn:['Добавьте адрес сайта','Проверьте контакты','Разрешите доступ отдельно'],promote:['Проверьте главную страницу','Добавьте кнопку связи','Считайте обращения']},
 vk:{learn:['Добавьте страницу VK','Проверьте владельца','Подключайте только с разрешением'],promote:['Проверьте описание','Добавьте способ связи','Публикуйте примеры работ']},
 telegram:{learn:['Добавьте рабочий канал','Определите нужные действия','Разрешите доступ отдельно'],promote:['Укажите пользу канала','Добавьте ссылку на связь','Отслеживайте обращения']},
 marketplace:{learn:['Добавьте ссылку на магазин','Проверьте карточки товаров','Доступ к заказам — отдельно'],promote:['Улучшите карточки','Проверьте доставку','Сравните расходы и заказы']},
 maps:{learn:['Добавьте карточку на карте','Проверьте адрес и часы','Доступ к отзывам — отдельно'],promote:['Уточните контакты','Добавьте реальные фото','Следите за обращениями']},
 avito:{learn:['Добавьте профиль','Проверьте объявления','Сообщения — после разрешения'],promote:['Уточните заголовки','Добавьте реальные фото','Проверяйте заявки']},
 crm:{learn:['Укажите вашу CRM','Уточните путь клиента','Согласуйте нужные права'],promote:['Запишите источники заявок','Считайте обращения','Следите за ответами']},
 mail:{learn:['Укажите рабочую почту','Определите важные письма','Согласуйте доступ отдельно'],promote:['Проверьте подпись','Добавьте способ обращения','Следите за ответами']},
 ads:{learn:['Укажите рекламный сервис','Определите отчёты','Согласуйте бюджет и права'],promote:['Выберите цель','Ограничьте бюджет','Измеряйте заявки']},
 accounting:{learn:['Укажите учётный сервис','Определите нужные отчёты','Разрешения — отдельно'],promote:['Сверьте расходы','Проверьте выручку','Запланируйте следующий шаг']},
 bank:{learn:['Укажите банк','Выберите нужные сведения','Разрешения — отдельно'],promote:['Уточните способы оплаты','Проверьте комиссии','Сравните расходы']}
});
function visibleSteps(){
 const key=purpose==='promote'?'promote':'learn';
 const result=QUICK_STEPS[topic]?.[key]||['Добавьте сервис','Уточните цель','Согласуйте следующий шаг'];
 return mode==='specialist'
  ?[result[0],'Передайте задачу специалисту','Проверьте результат вместе']
  :result;
}
function steps(){
 const data=TOPICS[topic];
 if(mode==='specialist'&&purpose==='promote')return [
  'Задача: привлечь реальные обращения через '+data.name+'. Сначала согласовать цель, исходные показатели и критерии результата.',
  ...data.promo,
  'Подготовить проверку результатов и понятный отчёт владельцу. Публикации, новые права доступа и любые расходы — только после отдельного согласования.'
 ];
 return mode==='specialist'?data.specialist:purpose==='promote'?data.promo:data.start;
}
function render(){
 const data=TOPICS[topic];if(!data)return;
 detail.hidden=false;
 updateChips();
 renderPersonal();
 renderRegistry();
 renderPresence();
 $('connectionCoachSelected').textContent=purpose==='promote'?'ПРИВЛЕЧЕНИЕ КЛИЕНТОВ · ПЛАН':'ПОДКЛЮЧЕНИЕ · ОБЪЯСНЕНИЕ';
 $('connectionCoachName').textContent=data.name;
 $('connectionCoachPlain').textContent=data.benefit;
 $('connectionCoachRelevance').textContent=context(topic);
 const list=$('connectionCoachSteps');list.replaceChildren();
 for(const row of visibleSteps()){
  const item=document.createElement('li');item.textContent=row;list.append(item);
 }
 $('connectionCoachSafety').textContent=(mode==='specialist'
  ?'Для специалиста: согласуйте права и способ отключения. Пароли, токены, SMS-коды и ключи сюда не присылать. '
  :'SEYVEO не просит пароли и коды. Сначала всё обсудим. ')+data.needs;
 $('connectionCoachCopy').textContent=mode==='specialist'?'Скопировать задание':'Скопировать план';
 $('connectionCoachNote').textContent=mode==='specialist'?'Задание в Блокнот':'План в Блокнот';
 result.textContent='';
}
function buildText(){
 const data=TOPICS[topic],name=purpose==='promote'?'Продвижение':'Подключение';
 return ['SEYVEO · '+name+' · '+data.name,
   'Формат: '+(mode==='specialist'?'Задание для специалиста':'Самостоятельный маршрут'),
   'Статус: план, ничего не подключено и не опубликовано.','',
   'Что это: '+data.what,
   'Польза: '+data.benefit,'',
   ...steps().map((line,i)=>(i+1)+'. '+line),
   '','Безопасность: '+data.needs,
   'Проверить официальную авторизацию, минимальные права и возможность отключения. Не отправлять пароли, токены, коды и ключи в чат.',
   '','Результат выполнения нужно будет проверить и отдельно подтвердить.'].join('\n');
}
function setType(id){
 if(!TOPICS[id])return;
 topic=id;render();
}
function start(options={}){
 purpose=options.goal==='promote'?'promote':'learn';
 mode=options.specialist===true?'specialist':'owner';
 topic=canonical(options.type)||recommendations()?.types[0]||'site';
 showOtherServices=EXTRA_ORDER.includes(topic);
 const types=window.SEYVEO_BUSINESS_MAP?.resourceTypes?.()||[];
 const chosen=types.find(v=>v.id===options.type);
 const draft=typeof options.sourcePrefill==='string'?options.sourcePrefill:'';
 if(draft){
  activeResourceType=chosen?.id||storageType(topic);
  resourceDraft=draft.slice(0,180);
 }
 render();
 // The icon tiles are the first screen. Guidance opens only on request.
 if(!options.type&&!options.specialist&&options.goal!=='promote')detail.hidden=true;
 if(draft){
  resourceStatus.textContent='Проверьте адрес перед сохранением.';
  registeredList.querySelector('input[name="resourceValue"]')?.focus({preventScroll:true});
 }
 return true;
}
$('connectionCoachPersonalChoices').addEventListener('click',event=>{
 const button=event.target.closest?.('[data-coach-recommend]');
 if(!button)return;
 const type=canonical(button.dataset.coachRecommend);
 if(!type)return;
 showOtherServices=EXTRA_ORDER.includes(type);
 setType(type);
});
choices.addEventListener('click',event=>{
 const more=event.target.closest?.('[data-coach-more]');
 if(more){
  showOtherServices=!showOtherServices;
  if(!showOtherServices&&EXTRA_ORDER.includes(topic))topic='site';
  render();return;
 }
 const button=event.target.closest?.('[data-coach-type]');
 if(button){
  if(!EXTRA_ORDER.includes(button.dataset.coachType))showOtherServices=false;
  setType(button.dataset.coachType);
 }
});
$('connectionCoachLearn').addEventListener('click',()=>{purpose='learn';render()});
$('connectionCoachPromote').addEventListener('click',()=>{purpose='promote';render()});
$('connectionCoachSelf').addEventListener('click',()=>{mode='owner';render()});
$('connectionCoachSpecialist').addEventListener('click',()=>{mode='specialist';render()});
$('connectionCoachNote').addEventListener('click',()=>{
 const api=window.SEYVEO_NOTES_API;
 if(!api||typeof api.getNotes!=='function'||typeof api.putNotes!=='function'){
  result.textContent='Блокнот сейчас недоступен. Можно скопировать план.';return;
 }
 const old=api.getNotes();
 if(old.length>=100){result.textContent='В Блокноте уже 100 записей. Старые записи не заменяю.';return}
 const record={id:'connection-guide-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
 text:buildText(),createdAt:Date.now(),preserveLines:true};
 result.textContent=api.putNotes([record,...old])
  ?'План сохранён в Блокноте. Ничего не подключено и не запущено.'
  :'Не удалось сохранить. Проверьте память устройства.';
});
$('connectionCoachCopy').addEventListener('click',async()=>{
 try{
  if(!navigator.clipboard?.writeText)throw Error('clipboard');
  await navigator.clipboard.writeText(buildText());
  result.textContent='План скопирован. Можно передать своему специалисту.';
 }catch{result.textContent='Не удалось скопировать. Используйте «В Блокнот».'}
});

// A reminder is a local status in Management, never a scheduled push or a claim of OAuth.
registeredList?.addEventListener('click',event=>{
 const toggled=event.target.closest?.('[data-resource-toggle]');
 if(toggled){
  const selected=toggled.dataset.resourceToggle;
  activeResourceType=activeResourceType===selected?'':selected;
  resourceDraft='';
  renderRegistry();
  if(activeResourceType)registeredList.querySelector('input[name="resourceValue"]')?.focus({preventScroll:true});
  return;
 }
 const remove=event.target.closest?.('[data-resource-remove-type]');
 if(remove){
  const type=remove.dataset.resourceRemoveType,value=remove.dataset.resourceRemoveValue;
  if(!window.confirm('Убрать этот ресурс из SEYVEO? Остальные данные останутся.'))return;
  const changed=window.SEYVEO_BUSINESS_MAP?.removeResourceDetail?.(type,value);
  resourceStatus.textContent=changed?.message||'Не удалось убрать ресурс.';
  renderRegistry();renderPresence();return;
 }
 const followup=event.target.closest?.('[data-resource-followup]');
 if(followup){
  const type=followup.dataset.resourceFollowup,action=followup.dataset.resourceAction;
  if(!TOPICS[type]||!['later','off','resume'].includes(action))return;
  const next=followups();
  next[type]={until:action==='later'?Date.now()+7*86400000:0,off:action==='off'};
  if(!persistFollowups(next)){resourceStatus.textContent='Не удалось сохранить напоминание.';return}
  renderRegistry();
  window.dispatchEvent(new Event('seyveo:connection-followup-changed'));
  resourceStatus.textContent=action==='later'?'Напоминание отложено на 7 дней.':action==='off'?'Напоминания отключены.':'Напоминания возобновлены.';
  return;
 }
 const guide=event.target.closest?.('[data-resource-guide]');
 if(guide){
  const selected=guide.dataset.resourceGuide;
  if(!TOPICS[selected])return;
  purpose='learn';showOtherServices=EXTRA_ORDER.includes(selected);
  setType(selected);
  detail.scrollIntoView?.({block:'nearest',behavior:'smooth'});
 }
});
registeredList?.addEventListener('submit',event=>{
 const form=event.target.closest?.('[data-resource-form]');
 if(!form)return;
 event.preventDefault();
 const type=form.dataset.resourceForm;
 const input=form.querySelector('input[name="resourceValue"]');
 const resultSave=window.SEYVEO_BUSINESS_MAP?.saveResourceDetail?.(type,input?.value);
 resourceStatus.textContent=resultSave?.message||'Не удалось сохранить ресурс.';
 if(resultSave?.ok){
  resourceDraft='';
  renderRegistry();renderPresence();
 }
});

presence?.addEventListener('change',()=>{
 const chosen=storageType(topic);
 const desired=Boolean(presence.checked);
 const saved=window.SEYVEO_BUSINESS_MAP?.markResourceUse?.(chosen,desired);
 if(!saved?.ok){result.textContent=saved?.message||'Не удалось сохранить.';renderPresence();return}
 result.textContent=desired?'Запомнила ресурс. Доступ не подключён.':'Отметка использования убрана.';
 renderRegistry();renderPresence();
});
window.addEventListener('seyveo:business-map-changed',()=>{
 renderRegistry();if(detail&&!detail.hidden)renderPresence();
});
window.addEventListener('storage',event=>{
 if(event.key==='seyveo-business-map-v1'||event.key===FOLLOWUP_KEY){
  renderRegistry();if(detail&&!detail.hidden)renderPresence();
 }
});
// An existing Management dialog opens before this listener on the same event.
window.addEventListener('seyveo:connection-help',event=>{
 start({type:event.detail?.type,goal:event.detail?.goal,specialist:event.detail?.specialist,sourcePrefill:event.detail?.sourcePrefill});
});
$('openManageConnections')?.addEventListener('click',()=>start());
/* One honest benefit-led Home recommendation, reusing the existing
 * Management connections dialog. No AI prediction or live service access. */
const HOME_MUTE='seyveo-connection-home-muted-v1';
const homeBenefits=Object.freeze({
 mail:{title:'Почта: я помогу навести порядок',why:'Когда почта будет подключена с вашим разрешением, смогу предлагать разбор личных и рабочих писем, отделять нежелательные и готовить ответы для вашей проверки. Отправка — только после вашего согласия.'},
 crm:{title:'CRM: помогу не терять клиентов',why:'После разрешённого подключения CRM смогу помогать замечать обращения без ответа, подготавливать сообщения и предлагать следующие действия. Вы утверждаете отправку.'},
 marketplace:{title:'Маркетплейсы: заказы и вопросы рядом',why:'При разрешённом доступе к Ozon или Wildberries смогу помогать разбирать заказы, отзывы и вопросы покупателей, составлять черновики ответов для проверки.'},
 vk:{title:'ВКонтакте: отвечать клиентам проще',why:'После разрешённого подключения сообщества смогу помогать разбирать сообщения и отзывы, предлагать ответы и отправлять их только после согласования.'},
 telegram:{title:'Telegram: важное не потеряется',why:'При поддерживаемом подключении рабочего бота или канала смогу помогать разбирать обращения и готовить ответы. Личные переписки не читаю.'},
 avito:{title:'Авито: обращения под контролем',why:'При разрешённом подключении смогу помогать замечать новые запросы, готовить ответы покупателям и сохранять важные договорённости.'},
 maps:{title:'Карты: обратная связь клиентов',why:'После официального подключения поддерживаемой карточки компании смогу помогать разбирать отзывы и готовить ответы для вашей проверки.'},
 site:{title:'Сайт: понимать обращения',why:'При подключении поддерживаемой аналитики и заявок сайта смогу помогать искать потерянные обращения и готовить предложения по улучшению.'},
 ads:{title:'Реклама: расходы под контролем',why:'Когда подключите рекламную статистику с ограниченными правами, смогу анализировать её вместе с обращениями и предлагать решения. Бюджет меняется только с вашего подтверждения.'},
 accounting:{title:'Учёт: меньше ручной работы',why:'При поддерживаемом и разрешённом подключении 1С или бухгалтерского сервиса смогу помогать готовить сводки и проверять согласования, без самостоятельных платежей.'},
 bank:{title:'Банк: наглядная картина денег',why:'При официальном доступе только на чтение смогу помогать сопоставлять разрешённые операции с заказами и готовить сводку. Переводы и платежи без вашего согласия не совершаются.'}
});
const homeBenefitsShort=Object.freeze({
 mail:'Смогу различать личные и рабочие письма, выделять спам и готовить ответы на проверку.',
 crm:'Смогу помогать находить забытые заявки и готовить ответы клиентам.',
 marketplace:'Смогу помогать с заказами, отзывами и вопросами покупателей на Ozon и других площадках.',
 vk:'Смогу помогать разбирать сообщения, отзывы и готовить ответы клиентам.',
 telegram:'Смогу помогать выделять рабочие обращения и предлагать ответы.',
 avito:'Смогу помогать замечать заявки и составлять ответы покупателям.',
 maps:'Смогу помогать отслеживать отзывы и готовить корректные ответы.',
 site:'Смогу помогать замечать обращения с сайта и анализировать результаты.',
 ads:'Смогу разбирать результаты рекламы и предлагать решения в согласованном бюджете.',
 accounting:'Смогу помогать собирать сводки и готовить документы к проверке.',
 bank:'Смогу помогать составлять финансовые сводки по разрешённым данным.'
});
function homeMuted(){
 try{const value=Number(localStorage.getItem(HOME_MUTE));return Number.isFinite(value)&&value>Date.now()}catch{return false}
}
function homePaused(){return homeMuted()}
function skipHomeMapTip(item){
 if(!item)return true;
 if(item.kind!=='connect')return false;
 const t=topicFor(item.type),prefs=followups();
 return Boolean(!t||prefs[t]?.off||(prefs[t]?.until>Date.now()));
}
function homeSuggestion(){
 if(homeMuted())return null;
 // An actual ONE installation must never get business connection reminders.
 try{
  const profile=JSON.parse(localStorage.getItem('seyveo-first-acquaintance-v1')||'null');
  if(profile?.focus==='life')return null;
 }catch{}
 const {types}=knownResources(),prefs=followups();
 const priority=['mail','crm','marketplace','vk','avito','maps','site','telegram','ads','accounting','bank'];
 const selected=priority.find(t=>types.includes(t)&&homeBenefits[t]&&!prefs[t]?.off&&!(prefs[t]?.until>Date.now()));
 if(!selected)return null;
 const benefit=homeBenefits[selected];
 return {kind:'connect',type:selected,title:benefit.title,why:homeBenefitsShort[selected],detail:benefit.why,
  connectionFollowup:true,resourceName:LABELS[selected]||TOPICS[selected].name};
}
function postponeFromHome(type){
 if(!TOPICS[type])return false;
 const next=followups();
 next[type]={until:Date.now()+7*86400000,off:false};
 if(!persistFollowups(next))return false;
 try{localStorage.setItem(HOME_MUTE,String(Date.now()+86400000))}catch{}
 renderRegistry();
 window.dispatchEvent(new CustomEvent('seyveo:connection-followup-changed',{detail:{type}}));
 return true;
}
window.SEYVEO_CONNECTION_COACH=Object.freeze({open:start,getText:buildText,homeSuggestion,homePaused,skipHomeMapTip,postponeFromHome});
start();
})();
