/* SEYVEO · Management v1. Original local-only functionality.
   No external service connections and no user data uploads. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const connect=$('manageConnectionsDialog'),dataDialog=$('manageDataDialog'),roadmapDialog=$('manageRoadmapDialog');
if(!connect||!dataDialog||!roadmapDialog)return;
/* Discreet companion behavior, NOT authentication or encrypted storage.
   A deliberate opt-in on this device; "off" unless explicitly enabled. */
const DISCREET_KEY='seyveo-discreet-mode-v1';
function readDiscreetMode(){
 try{return localStorage.getItem(DISCREET_KEY)==='on'}catch{return false}
}
function paintDiscreetMode(){
 const enabled=readDiscreetMode();
 window.SEYVEO_DISCREET_MODE=enabled;
 const toggle=$('seyveoDiscreetToggle'),status=$('seyveoDiscreetState');
 if(!toggle||!status)return;
 toggle.setAttribute('aria-pressed',String(enabled));
 toggle.setAttribute('aria-label','Рядом люди: '+(enabled?'включено':'выключено'));
 status.textContent=enabled?'Вкл.':'Выкл.';
}
paintDiscreetMode();
$('seyveoDiscreetToggle')?.addEventListener('click',()=>{
 const enabled=!readDiscreetMode();
 try{localStorage.setItem(DISCREET_KEY,enabled?'on':'off')}
 catch{
  // Do not pretend the preference stuck if browser storage failed.
  paintDiscreetMode();return;
 }
 if(enabled){try{window.speechSynthesis?.cancel()}catch{}}
 paintDiscreetMode();
});
window.addEventListener('storage',event=>{
 if(event.key===DISCREET_KEY)paintDiscreetMode();
});

/* CURATED PRODUCT ROADMAP — present-day SEYVEO.
 * Ideas distilled from FUTURE V5, the project passport, three archived
 * prototypes and docs/SEYVEO-IDEAS-MASTER.md. Archive code is NOT reused.
 * ready = interface/local function present in code (not phone-certified);
 * demo = working demonstration only; plan = NOT implemented.
 * A user's checkbox is an independent local progress annotation.
 */
const roadmap=[
 {id:'foundation',name:'Основа SEYVEO',items:[
  ['velvet','Black Velvet / White Velvet','Единая тёмная и светлая тема, стеклянные элементы, кнопки и бережное движение.','ready'],
  ['sphere','Сфера и единое обращение','Центральная плазма, фирменные появления и одно понятное сообщение под ней.','ready'],
  ['navigation','Четыре раздела и Спросить','Главная для решений, Дела, Картина, Управление и центральная кнопка общения.','ready'],
  ['records','Мои дела со сроками','Создание, выполнение и хранение личных дел на устройстве. Календарная сетка ещё впереди.','ready'],
  ['notes','Мои записи и черновики','Локальный блокнот, сохранение заметок и текстовых черновиков.','ready'],
  ['composer_modes','Два режима одного поля · Спросить / В Блокнот','Явный выбор: отправить вопрос управляющему или сохранить личный текст. При наборе длинного текста открывается большой редактор.','ready'],
  ['composer_export','Редактор длинного текста · отправка и печать','Для письма и заметки доступны печать и системное «Поделиться» без отдельной страницы ввода.','ready'],
  ['assistant_chat_history','История вопросов управляющему','Локальная история отправленных запросов и демонстрационных ответов, чтение без дублирующего поля ввода. Реальный ИИ пока не подключён.','ready'],
  ['passports','Паспорта продукта и компании','Две отдельные карточки, реквизиты компании, печать и отправка.','ready'],
  ['backup','Сохранение копии данных','Выгрузка локальных записей, поручений и настроек.','ready'],
  ['first_meeting','Знакомство с управляющим','Выбор Life / Business Start / Pro / Max и имени в локальном сценарии, пока не настоящий разговор с ИИ.','demo'],
  ['decision_flow','Рекомендация → решение → история','Учебное согласование поручения, статус выполнения и журнал действий без реальной отправки.','demo'],
  ['developer_picture','Картина бизнеса и Пульс','Клиенты, заказы, продажи, расходы и графики из единого учебного набора с фильтрами.','demo'],
  ['picture_layout','Своя Картина','Выбор и перестановка доступных карточек с сохранением на устройстве.','ready'],
  ['touch_voice','Звук касаний и пробное голосовое обращение','Silk Touch на поддерживаемых устройствах; голосовое обращение пока прототип.','demo']
 ]},
 {id:'paper',name:'SEYVEO Paper · умный Блокнот',items:[
  ['paper_text','Текст, заметки и редактирование','Локальные записи, правка без создания копий, голосовая команда «Запомни мысль» с подтверждением. Не свободный ИИ-диалог.','ready'],
  ['paper_actions','Отправка и печать заметок','Компактные карточки и меню «•••»: поделиться, распечатать, удалить с подтверждением.','ready'],
  ['paper_to_calendar','Из заметки в календарь','Текстовая запись предлагает создать черновик события; явные дни недели подсказывают дату, без автосохранения.','ready'],
  ['paper_sheet','Белоснежный лист · SEYVEO Paper','Рукописные страницы на бумаге A4 по пропорциям; штрихи сохраняются и редактируются.','ready'],
  ['paper_tools','Ручка, карандаш, ластик и отмена','Три инструмента письма, отмена последнего штриха, чистая бумага, линейка или точки.','ready'],
  ['paper_stylus','Письмо пальцем и стилусом · S Pen','Ввод через Pointer Events с давлением, если браузер и устройство поддерживают; полноценное отклонение ладони не гарантируется.','ready'],
  ['paper_photo','Фото на листе и рисунок поверх','Фото с камеры или из галереи сжимается и сохраняется под штрихами после подтверждения.','ready'],
  ['paper_export','Рукописный лист: печать и отправка','Миниатюра, экспорт PNG и печать готового листа из Блокнота. Требует проверки в Safari и Samsung.','ready'],
  ['paper_scanner','Умный сканер · Фото → текст','Пробный OCR для русского и английского: добровольная загрузка модели, проверка текста перед сохранением. Не гарантирует распознавание почерка.','demo'],
  ['paper_handwriting_ocr','Распознавание рукописного текста','Разбирать фотографии и рукописные страницы, проверять сомнительные слова и предлагать перенос в дела или календарь.','plan'],
  ['paper_picture_layers','Фотографии, картинки и несколько слоёв','Несколько изображений и рисунков на одном листе, перенос, масштабирование, обрезка и безопасное хранение.','plan'],
  ['paper_smooth','Сделать почерк аккуратнее','Бережное сглаживание и выравнивание штрихов с предпросмотром; оригинал всегда сохраняется.','plan'],
  ['paper_spelling','Проверить ошибки на листе','Подсветить возможные опечатки после распознавания; исправлять только с подтверждения человека.','plan'],
  ['paper_beauty','Сделать красиво · умная композиция','Красиво расположить текст, рисунок и фото, показать вариант рядом с исходной страницей.','plan'],
  ['paper_typeset_hand','Печатный текст → рукописный стиль','Клавиатура и диктовка превращаются в красиво оформленный рукописный текст с предпросмотром.','plan'],
  ['paper_living_handwriting','Мой почерк · SEYVEO Living Handwriting','Добровольно изучать образцы собственных букв владельца и показывать текст в его персональном стиле; не имитировать подпись.','plan'],
  ['paper_documents','Черновик заметки → Документы','Передавать черновики в отдельный редактор договоров и А4/PDF; юридически значимая подпись только с разрешением.','plan']
 ]},
 {id:'sales',name:'Продажи · следующий приоритет',items:[
  ['business_events','Единая модель бизнес-событий','Одно событие связывает обращение, клиента, источник, предложение, заказ, оплату и действия управляющего.','plan'],
  ['sales_center','Продажи на человеческом языке','Сегодня: обращения, заказы, продажи и фактические поступления — строго разные показатели.','plan'],
  ['sales_funnel','Путь клиента до покупки','Обращение → квалификация → предложение → продажа; видно, где остановились.','plan'],
  ['sales_sources','Откуда приходят покупатели','VK, Telegram, MAX, OK, Дзен, сайт, Avito и другие каналы с проверенной атрибуцией.','plan'],
  ['sales_waiting','Кто ждёт ответа','Новые, ожидающие, готовые купить и потерянные клиенты; сроки реакции.','plan'],
  ['crm_inbox','Обращения из всех каналов','Единая очередь рабочих запросов из разрешённых сетей, почты, сайта и телефонии; без второй CRM.','plan'],
  ['sales_losses','Где теряем продажи','Причины отказов, незавершённые предложения и этапы с самым большим оттоком.','plan'],
  ['sales_explain','Почему продажи изменились','Понятное объяснение роста или падения на основании реальных событий, без выдуманных причин.','plan'],
  ['sales_actions','Следующий шаг с клиентом','Подготовить ответ или предложение, напомнить, создать дело; отправлять только по правилам.','plan'],
  ['sales_finance_link','Продажи связаны с деньгами','Каждый заказ передаёт сумму продажи в учёт; оплаты отдельно подтверждаются источником.','plan'],
  ['sales_promo_link','Продажи связаны с продвижением','Сохранять источник каждого заказа и видеть, какие каналы действительно работают.','plan']
 ]},
 {id:'intelligence',name:'Интеллект и самостоятельность',items:[
  ['real_brain','Настоящий интеллект','Понимает контекст, объясняет источники и отличает факт от предположения; пока не подключён.','plan'],
  ['business_memory','Память бизнеса · Business Memory Graph','Предпочтения, прошлые решения, клиенты и связи событий с согласиями и управляемым хранением.','plan'],
  ['business_twin','Единая модель бизнеса · Business Twin','Связывать клиентов, продажи, деньги, рекламу и процессы, чтобы объяснять взаимное влияние. Не отдельный старый экран.','plan'],
  ['business_simulator','Сценарии «а если?»','Проверять изменение цены, рекламы, спроса или нового канала; явно показывать допущения, не гарантии.','plan'],
  ['cause_analysis','Причины и прогнозы · Brain','Сопоставлять события, находить корневую причину и осторожно рассчитывать варианты развития.','plan'],
  ['autonomy_rules','Автопилот и правила · Rules','Отдельные границы самостоятельности по расходам, рекламе, ценам, ответам и подписи.','plan'],
  ['eyes','Цифровой след · Eyes','Наблюдение за доступными сайтом, соцсетями, площадками, CRM, рекламой и финансами через разрешённые связи.','plan'],
  ['hands','Разрешённые действия · Hands','Подготовил → показал → получил право → выполнил → подтвердил результат; защищённый серверный контур.','plan'],
  ['explain_actions','Отчёт «Я уже сделал»','Что заметил, какой был план, что выполнено, что осталось человеку; без повторного списка кнопок.','plan'],
  ['opportunities','Возможности и рост · Opportunity Engine','Сам находить новые каналы, товары, спрос и варианты улучшений, объяснять пользу и риск.','plan'],
  ['regulatory','Законы, налоги и сроки','Проверять официальные источники, дату, отношение к конкретному бизнесу и предлагать действие.','plan'],
  ['negotiations','Переговорный помощник','Подготовить вопросы, оценить предложение и оформить итог встречи — запись только с согласия.','plan'],
  ['counterparties','Проверка контрагентов','Проверить точную организацию, полномочия и открытые официальные сведения до важных сделок.','plan'],
  ['voice','Полноценный разговор · Voice','Голос, перебивание, естественный диалог и разрешения без скрытого фонового прослушивания.','plan']
 ]},
 {id:'business',name:'Операции, финансы и связи',items:[
  ['finance','Деньги без путаницы','Раздельно продажи, полученные платежи, расходы, обязательства, остаток и рассчитанную прибыль.','plan'],
  ['payments','Счета и платежи','Проверка регулярных счетов, сравнение расходов, подготовка оплаты и обязательное подтверждение.','plan'],
  ['documents','Документы и подпись','Договоры, акты, счета, декларации; проверка изменений, черновик, PDF, печать и разрешённая подпись.','plan'],
  ['mail','Единые входящие','Рабочая почта и сообщения связываются с клиентами, заказами, документами и поручениями.','plan'],
  ['channels','Подключения · связи','Авторизация почты, календарей, банков, CRM, рекламы и площадок с отзывом доступа. Сейчас нет реальных связей.','plan'],
  ['marketplaces','Маркетплейсы и объявления','Ozon, Wildberries, Яндекс Маркет, Avito: цены, остатки, отзывы, реклама и заказы.','plan'],
  ['promotion','Продвижение и реклама','Сайт, соцсети, публикации, бюджет и эффективность; управляющий рекомендует и действует по правилам.','plan'],
  ['inside_business','Бизнес внутри','Товары, остатки, поставщики, команда, процессы и автоматизация рутинных задач.','plan'],
  ['tax_inspector','Налоговый помощник','Напоминать о декларациях, платежах, сроках и изменениях со ссылкой на официальный источник.','plan'],
  ['accounting_audit','Вторые глаза по бухгалтерии','Сверять заявки, счета, акты, банк и учёт; объяснять расхождения без необоснованных обвинений.','plan'],
  ['tax_submission','Подготовка деклараций','Собрать черновик из подтверждённых сведений; подача в ФНС только после проверки и разрешения.','plan'],
  ['director_brief','Штаб управляющего','Короткая планёрка: что произошло, что важно сегодня, одно решение и следующая работа. Не отдельная стена карточек.','plan']
 ]},
 {id:'builder',name:'Создать и развивать бизнес',items:[
  ['business_builder','Business Builder · с нуля','Идея → рынок → название → сайт → контент → каналы → первые клиенты → управление.','plan'],
  ['idea_validation','Проверка бизнес-идеи','Рынок, конкуренты, спрос, экономика и риски простыми словами без гарантии успеха.','plan'],
  ['business_start','SEYVEO Business Start','Полезный полный путь запуска бизнеса, а не искусственно урезанный Pro.','plan'],
  ['business_pro','SEYVEO Business Pro','Действующая компания: клиенты, продажи, финансы, процессы и разрешённые интеграции.','plan'],
  ['business_max','SEYVEO Business Max','Команды, роли, филиалы, согласования и сложные автоматизированные процессы.','plan'],
  ['site_builder','SEYVEO Site','Отдельный конструктор сайтов, предпросмотр, публикация и размещение с ясными правами клиента.','plan'],
  ['studio','SEYVEO Studio','Услуги создания сайтов под ключ поверх той же платформы, без второго конструктора.','plan'],
  ['hosting_exit','Размещение и перенос сайтов','Честные условия подписки, уведомление о прекращении размещения, доступный экспорт данных и домен клиента.','plan'],
  ['personal_tools','Мастерская своих инструментов','Создание личной карточки, расчёта или рабочего инструмента по описанию, без дублирующих экранов.','plan']
 ]},
 {id:'life',name:'Личная жизнь, качество и безопасность',items:[
  ['life','SEYVEO Life','Личные планы, дела, дом, семья и здоровье доступны параллельно любому бизнес-уровню.','plan'],
  ['calendar','Локальный календарь','День, неделя, месяц, сроки; события с датой и временем, совместный обзор с личными делами. Внешние календари не подключены.','ready'],
  ['life_spaces','Личные пространства календаря','Ручные записи Здоровья, Заботы и Моего мира с датами; Блокнот связан с календарём, нет внешней синхронизации.','ready'],
  ['health','Здоровье и забота','Будущие адаптеры Health, шагов, пульса, давления и приватные функции Заботы; ручные записи уже доступны.','plan'],
  ['family','Семейные пространства','Общие события и дела с отдельными личными правами доступа и согласием участников.','plan'],
  ['transitions','Переход между этапами','Life ↔ Business Start / Pro / Max с сохранением личных данных и безопасным отключением рабочих связей.','plan'],
  ['security','Разрешения и защита данных','Секреты вне клиентского кода, минимальные разрешения, журнал действий и отзыв доступа.','plan'],
  ['app_lock','Одна добровольная блокировка','PIN/биометрия для всего приложения только после реального шифрования и безопасного восстановления.','plan'],
  ['offline','Работа при плохой связи','Безопасный локальный режим и очередь разрешённых действий; VPN и обход сети не обещаны.','plan'],
  ['mobile_tests','Проверка на телефонах','iPhone X, вырез камеры, safe-area, неподвижный док, светлая тема и производительность.','plan'],
  ['native','Нативное приложение','Подготовка iOS/Android, системные разрешения, тактильный отклик и доступность.','plan']
 ]}
];
const ROADMAP_KEY='seyveo-roadmap-progress-v1';
function loadRoadmapMarks(){
 try{
  const data=JSON.parse(localStorage.getItem(ROADMAP_KEY)||'null');
  return data&&data.version===1&&data.marks&&typeof data.marks==='object'&&!Array.isArray(data.marks)?data.marks:{};
 }catch{return {}}
}
let roadmapMarks=loadRoadmapMarks();
const roadmapAll=roadmap.flatMap(group=>group.items.map(([id,name,desc,stage])=>({id,name,desc,stage})));
function roadmapChecked(item){
 return Object.prototype.hasOwnProperty.call(roadmapMarks,item.id)?roadmapMarks[item.id]===true:item.stage==='ready';
}
function roadmapCounts(){
 return {total:roadmapAll.length,checked:roadmapAll.filter(roadmapChecked).length,demo:roadmapAll.filter(x=>x.stage==='demo').length,planned:roadmapAll.filter(x=>x.stage==='plan').length};
}
function roadmapCountLabel(){
 const n=roadmapCounts();
 $('manageRoadmapProgress').textContent='Отмечено: '+n.checked+' из '+n.total+' · Демо: '+n.demo+' · В планах: '+n.planned;
}
function drawRoadmap(){
 const body=$('manageRoadmapBody'),search=$('manageRoadmapSearch')?.value.trim().toLocaleLowerCase('ru')||'';
 const pending=$('manageRoadmapOnlyPending')?.checked===true;
 body.replaceChildren();
 let displayed=0;
 for(const group of roadmap){
  const matching=group.items.map(([id,name,desc,stage])=>({id,name,desc,stage}))
   .filter(item=>(!pending||!roadmapChecked(item))&&(!search||(item.name+' '+item.desc).toLocaleLowerCase('ru').includes(search)));
  if(!matching.length)continue;
  displayed+=matching.length;
  const section=document.createElement('details');section.className='manage-roadmap-group';
  section.open=!!search||pending||group.id==='foundation'||group.id==='sales';
  const summary=document.createElement('summary');summary.className='manage-roadmap-group-head';
  const title=document.createElement('strong');title.textContent=group.name;
  const count=document.createElement('span');count.textContent=matching.length+' пунктов';
  summary.append(title,count);
  const list=document.createElement('div');list.className='manage-roadmap-list';
  for(const item of matching){
   const line=document.createElement('label');line.className='manage-roadmap-item';
   line.dataset.roadmapId=item.id;
   const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.className='manage-roadmap-check';
   checkbox.checked=roadmapChecked(item);checkbox.dataset.roadmapCheck=item.id;
   checkbox.setAttribute('aria-label','Отметить выполненным: '+item.name);
   const content=document.createElement('span');content.className='manage-roadmap-copy';
   const itemTitle=document.createElement('strong');itemTitle.textContent=item.name;
   const itemDesc=document.createElement('span');itemDesc.textContent=item.desc;
   const status=document.createElement('span');status.className='manage-roadmap-stage';
   status.textContent=({ready:'Есть в коде · проверить на устройстве',demo:'Демо / прототип',plan:'В планах'})[item.stage];
   content.append(itemTitle,itemDesc,status);line.append(checkbox,content);list.append(line);
  }
  section.append(summary,list);body.append(section);
 }
 if(!displayed){
  const empty=document.createElement('p');empty.className='manage-roadmap-empty';
  empty.textContent='По этому запросу ничего не найдено. Попробуйте другое слово или отключите фильтр.';
  body.append(empty);
 }
 roadmapCountLabel();
}
function roadmapSaveMark(id,value){
 const item=roadmapAll.find(x=>x.id===id);if(!item)return;
 const marks={...roadmapMarks,[id]:value};
 try{localStorage.setItem(ROADMAP_KEY,JSON.stringify({version:1,marks}));roadmapMarks=marks;
  $('manageRoadmapSaved').textContent='Отметка сохранена на этом устройстве';
  roadmapCountLabel();
  if($('manageRoadmapOnlyPending').checked)drawRoadmap();
 }catch{
  $('manageRoadmapSaved').textContent='Не удалось сохранить отметку';
  drawRoadmap();
 }
}
$('manageRoadmapBody').addEventListener('change',event=>{
 const cb=event.target.closest('input[data-roadmap-check]');
 if(cb)roadmapSaveMark(cb.dataset.roadmapCheck,cb.checked);
});
$('manageRoadmapSearch').addEventListener('input',drawRoadmap);
$('manageRoadmapOnlyPending').addEventListener('change',drawRoadmap);

const KEYS=Object.freeze({
 app:'dm-signature-living-v2',
 previous:'dm-signature-living-v1',
 notes:'seyveo-notes-v1',
 draft:'seyveo-draft-v1',
  assistantChatHistory:'seyveo-assistant-chat-history-v1',
 tasks:'seyveo-personal-tasks-v1',
 contacts:'seyveo-private-contacts-v1',
 calendarEvents:'seyveo-calendar-events-v1',
 lifeSpaces:'seyveo-life-spaces-v1',
 privateWellness:'seyveo-private-health-care-v1',
 company:'seyveo-company-passport-v1',
 pictureWidgets:'seyveo-home-widgets-v1',
 roadmapProgress:'seyveo-roadmap-progress-v1'
});
function read(key){
 try{return localStorage.getItem(key)}catch{return null}
}
function parsed(raw,fallback){
 try{return raw===null?fallback:JSON.parse(raw)}catch{return fallback}
}
function snapshot(){
 const state=parsed(read(KEYS.app),{});
 const notes=parsed(read(KEYS.notes),[]);
 const oldState=parsed(read(KEYS.previous),null);
 const draft=read(KEYS.draft);
 const chatHistory=parsed(read(KEYS.assistantChatHistory),[]);
 const tasks=parsed(read(KEYS.tasks),[]);
 const contacts=parsed(read(KEYS.contacts),[]);
 const calendarEvents=parsed(read(KEYS.calendarEvents),[]);
 const lifeSpaces=parsed(read(KEYS.lifeSpaces),[]);
 const privateWellness=parsed(read(KEYS.privateWellness),null);
 const company=parsed(read(KEYS.company),null);
 const pictureWidgets=parsed(read(KEYS.pictureWidgets),null);
 const roadmapProgress=parsed(read(KEYS.roadmapProgress),null);
 const rawTierPreview=read('seyveo-developer-tier-preview-v1');
 const developerTierPreview=['start','pro','max'].includes(rawTierPreview)?rawTierPreview:null;
 const introduction=parsed(read('seyveo-first-acquaintance-v1'),null);
 return {
  product:'SEYVEO',
  exportedAt:new Date().toISOString(),
  source:'local browser storage on this device',
  state:state&&typeof state==='object'&&!Array.isArray(state)?state:{},
  oldState:oldState&&typeof oldState==='object'&&!Array.isArray(oldState)?oldState:null,
  notes:Array.isArray(notes)?notes:[],
   assistantChatHistory:Array.isArray(chatHistory)?chatHistory.filter(row=>row&&typeof row.q==='string'&&typeof row.a==='string').slice(-60):[],
  personalTasks:Array.isArray(tasks)?tasks:[],
  privateContacts:Array.isArray(contacts)?contacts.filter(c=>
   c&&typeof c.id==='string'&&typeof c.name==='string'&&typeof c.phone==='string').slice(0,40):[],
  calendarEvents:Array.isArray(calendarEvents)?calendarEvents:[],
  lifeSpaces:Array.isArray(lifeSpaces)?lifeSpaces:[],
  privateWellness:privateWellness&&typeof privateWellness==='object'&&!Array.isArray(privateWellness)?privateWellness:null,
  companyPassport:company&&typeof company==='object'&&!Array.isArray(company)?company:null,
  pictureWidgets:pictureWidgets&&Array.isArray(pictureWidgets.ids)?pictureWidgets:null,
  roadmapProgress:roadmapProgress&&roadmapProgress.version===1&&roadmapProgress.marks?roadmapProgress:null,
  developerTierPreview,
  draft:typeof draft==='string'?draft:'',
  introduction:introduction&&typeof introduction==='object'&&!Array.isArray(introduction)?introduction:null
 };
}
function countOf(list){return Array.isArray(list)?list.length:0}
function updateLiveSummary(){
 const text=$('manageLiveSummary');if(!text)return;
 const tasks=parsed(read(KEYS.tasks),[]);
 const count=Array.isArray(tasks)?tasks.filter(t=>t&&typeof t.title==='string'&&t.done!==true).length:0;
 const profile=parsed(read('seyveo-first-acquaintance-v1'),null);
 const names={life:'Life',start:'Business Start',pro:'Business Pro',max:'Business Max'};
 const stage=profile&&names[profile.focus]?names[profile.focus]:'Не выбрано';
 text.textContent='Личные дела: '+count+' · Направление: '+stage+' · ИИ и внешние сервисы пока не подключены';
}

function drawData(){
 const record=snapshot(),list=$('manageDataSummary');
 list.replaceChildren();
 const parts=[
  ['Знакомство',record.introduction?'Сохранено':'Нет'],
  ['Мои записи',String(countOf(record.notes))],
   ['История обращений',String(countOf(record.assistantChatHistory))+' локальных запросов'],
  ['Личные дела',String(countOf(record.personalTasks.filter(t=>t&&t.done!==true)))+' активных'],
  ['Мой мир · Контакты',String(countOf(record.privateContacts))+' контактов'],
  ['Календарь',String(countOf(record.calendarEvents))+' локальных событий'],
  ['Личные пространства',String(countOf(record.lifeSpaces))+' записей'],
  ['Здоровье и забота',record.privateWellness?'Личный журнал сохранён':'Без дополнительных записей'],
  ['Карточка компании',record.companyPassport&&record.companyPassport.name?'Заполнена':'Не заполнена'],
  ['Моя картина',record.pictureWidgets?String(record.pictureWidgets.ids.length)+' выбранных':'Стандартный набор'],
  ['Карта развития',String(roadmapCounts().checked)+' из '+String(roadmapCounts().total)+' отмечено'],
  ['Предпросмотр уровня',record.developerTierPreview?'Business '+({start:'Start',pro:'Pro',max:'Max'}[record.developerTierPreview]):'По умолчанию · Pro'],
  ['Черновик',record.draft.trim()?'Сохранён':'Нет'],
  ['Поручения в истории',String(countOf(record.state.history))],
  ['Данные', 'На этом устройстве']
 ];
 for(const [label,value] of parts){
  const row=document.createElement('div');row.className='manage-data-item';
  const a=document.createElement('span');a.textContent=label;
  const b=document.createElement('strong');b.textContent=value;
  row.append(a,b);list.append(row);
 }
 $('manageExportStatus').textContent='';
}
function saveFile(){
 try{
  const info=snapshot();
  const blob=new Blob([JSON.stringify(info,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='seyveo-local-data-'+new Date().toISOString().slice(0,10)+'.json';
  a.style.display='none';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  $('manageExportStatus').textContent='Копия подготовлена. Проверьте загрузки или файлы устройства.';
 }catch{
  $('manageExportStatus').textContent='Не удалось создать копию. Проверьте разрешения браузера.';
 }
}
$('openManageRoadmap').addEventListener('click',()=>{drawRoadmap();roadmapDialog.showModal()});
$('manageRoadmapClose').addEventListener('click',()=>roadmapDialog.close());
$('openManageConnections').addEventListener('click',()=>connect.showModal());
$('manageConnectionsClose').addEventListener('click',()=>connect.close());
$('openManageData').addEventListener('click',()=>{drawData();dataDialog.showModal()});
$('manageDataClose').addEventListener('click',()=>dataDialog.close());
$('manageExportData').addEventListener('click',saveFile);
window.addEventListener('seyveo:tasks-changed',updateLiveSummary);
window.addEventListener('seyveo:profile-changed',updateLiveSummary);
window.addEventListener('hashchange',updateLiveSummary);
window.addEventListener('storage',event=>{
 if([KEYS.tasks,'seyveo-first-acquaintance-v1'].includes(event.key))updateLiveSummary();
 if(event.key===ROADMAP_KEY){roadmapMarks=loadRoadmapMarks();if(roadmapDialog.open)drawRoadmap()}
});
updateLiveSummary();
for(const dialog of [connect,dataDialog,roadmapDialog]){
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){dialog.close()}
 });
}
})();
