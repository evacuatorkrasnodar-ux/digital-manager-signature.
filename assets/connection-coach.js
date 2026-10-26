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
function renderRegistry(){
 if(!registered||!registeredList)return;
 const {rows,types}=knownResources(),prefs=followups();
 registered.hidden=false;
 registeredList.replaceChildren();
 const summary=$('connectionManagePrompt');
 if(summary)summary.textContent=rows.length
  ?'Указано ресурсов: '+rows.length+' · доступ пока не подключён'
  :'Рабочие ресурсы и разрешения · по желанию';
 if(!rows.length){
  const empty=document.createElement('p');
  empty.className='connection-coach-empty';
  empty.textContent='Пока ничего не указано. Добавьте только те сервисы, которыми действительно пользуетесь.';
  registeredList.append(empty);
  return;
 }
 const names=new Map((window.SEYVEO_BUSINESS_MAP?.resourceTypes?.()||[]).map(row=>[row.id,row.name]));
 const shownFollowups=new Set();
 for(const [index,item] of rows.entries()){
  const type=topicFor(item.type),state=type?prefs[type]||{}:{};
  const sleep=state.until>Date.now();
  const row=document.createElement('div');row.className='connection-coach-known-row';
  const content=document.createElement('div');content.className='connection-coach-known-copy';
  const title=document.createElement('strong');
  title.textContent=names.get(item.type)||LABELS[type]||'Ресурс';
  const value=document.createElement('small');
  value.textContent=item.value==='Использую'
   ?'Пользуюсь · указано со слов владельца'
   :item.value;
  const note=document.createElement('small');
  note.textContent='Не подключён'+(state.off?' · без напоминаний':sleep
   ?' · напоминание отложено':' · доступ не предоставлен');
  content.append(title,value,note);
  const buttons=document.createElement('div');buttons.className='connection-coach-known-actions';
  if(type&&TOPICS[type]){
   const guide=document.createElement('button');guide.type='button';
   guide.dataset.resourceGuide=type;guide.textContent='Как подключить';buttons.append(guide);
  }
  const remove=document.createElement('button');remove.type='button';
  remove.dataset.resourceRemove=String(index);remove.textContent='Убрать';
  remove.setAttribute('aria-label','Убрать ресурс '+title.textContent);
  buttons.append(remove);
  if(type&&TOPICS[type]&&!shownFollowups.has(type)){
   shownFollowups.add(type);
   const later=document.createElement('button');later.type='button';
   later.dataset.resourceFollowup=type;
   later.dataset.resourceAction=state.off||sleep?'resume':'later';
   later.textContent=state.off||sleep?'Напоминать':'Позже';
   buttons.append(later);
   if(!state.off){
    const off=document.createElement('button');off.type='button';
    off.dataset.resourceFollowup=type;off.dataset.resourceAction='off';
    off.textContent='Не напоминать';buttons.append(off);
   }
  }
  row.append(content,buttons);registeredList.append(row);
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

/* One small editor for owner-supplied resource details. No second database. */
const resourceForm=$('connectionCoachResourceForm');
const resourceType=$('connectionCoachResourceType');
const resourceValue=$('connectionCoachResourceValue');
const resourceStatus=$('connectionCoachResourceStatus');
const resourceDetails=$('connectionCoachAddResource');
for(const row of window.SEYVEO_BUSINESS_MAP?.resourceTypes?.()||[]){
 const option=document.createElement('option');option.value=row.id;option.textContent=row.name;
 resourceType?.append(option);
}
resourceForm?.addEventListener('submit',event=>{
 event.preventDefault();
 const saved=window.SEYVEO_BUSINESS_MAP?.saveResourceDetail?.(resourceType.value,resourceValue.value);
 resourceStatus.textContent=saved?.message||'Не удалось сохранить ресурс.';
 if(saved?.ok){
  resourceValue.value='';resourceDetails.open=false;renderRegistry();renderPresence();
 }
});
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
 $('connectionCoachPlain').textContent=data.what+'\n\n'+data.benefit;
 $('connectionCoachRelevance').textContent=context(topic);
 const list=$('connectionCoachSteps');list.replaceChildren();
 for(const row of steps()){
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
 mode=options.specialist===true?'specialist':'owner';topic=canonical(options.type)||recommendations()?.types[0]||'site';
 showOtherServices=EXTRA_ORDER.includes(topic);
 render();
 // A link suggested in chat is only a draft until the user presses Save.
 const draft=typeof options.sourcePrefill==='string'?options.sourcePrefill:'';
 if(draft&&resourceType&&resourceValue&&resourceDetails){
  const chosen=window.SEYVEO_BUSINESS_MAP?.resourceTypes?.().some(row=>row.id===options.type)
   ?options.type:storageType(topic);
  resourceType.value=chosen;
  resourceValue.value=draft.slice(0,180);
  resourceDetails.open=true;
  resourceStatus.textContent='Проверьте адрес или название перед сохранением.';
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
 const removing=event.target.closest?.('[data-resource-remove]');
 if(removing){
  const rows=knownResources().rows,index=Number(removing.dataset.resourceRemove);
  const item=Number.isInteger(index)&&index>=0?rows[index]:null;
  if(!item)return;
  if(!window.confirm('Убрать этот ресурс из списка SEYVEO? Остальные данные сохранятся.'))return;
  const changed=window.SEYVEO_BUSINESS_MAP?.removeResourceDetail?.(item.type,item.value);
  resourceStatus.textContent=changed?.message||'Не удалось убрать ресурс.';
  renderRegistry();renderPresence();
  return;
 }
 const guide=event.target.closest?.('[data-resource-guide]');
 if(guide){
  const selected=guide.dataset.resourceGuide;
  if(!TOPICS[selected])return;
  purpose='learn';showOtherServices=EXTRA_ORDER.includes(selected);
  setType(selected);return;
 }
 const button=event.target.closest?.('[data-resource-followup]');
 if(!button)return;
 const type=button.dataset.resourceFollowup,action=button.dataset.resourceAction;
 if(!TOPICS[type]||!['later','off','resume'].includes(action))return;
 const next=followups();
 next[type]={until:action==='later'?Date.now()+7*86400000:0,off:action==='off'};
 if(!persistFollowups(next)){result.textContent='Напоминание не сохранилось.';return}
 renderRegistry();
 window.dispatchEvent(new Event('seyveo:connection-followup-changed'));
 result.textContent=action==='later'?'Напомню в Управлении через 7 дней.':
  action==='off'?'Больше не буду напоминать об этом ресурсе.':'Напоминания для ресурса включены.';
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
