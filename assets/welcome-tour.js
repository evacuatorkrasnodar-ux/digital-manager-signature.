/* SEYVEO · First Look Film v2 · cinematic, interactive, read-only tour.
   This preview never uses owner data or writes localStorage. */
(()=>{'use strict';
const root=document.getElementById('welcomeTour');if(!root)return;
root.innerHTML=`
<div class="film">
 <header class="film-header">
  <div class="film-brand">SEYVEO <small>AI AUTOMATION</small></div>
  <div class="film-header-controls"><button id="filmVoice" type="button" aria-pressed="false">◌ <span>Слушать</span></button><button id="filmExit" type="button">Пропустить</button></div>
 </header>
 <div class="film-intro">
  <span id="filmChapter" class="film-chapter">ГЛАВА 01 / 14 · ЗНАКОМСТВО</span>
  <h2 id="filmTitle">Привет! Я Феликс.</h2>
  <p id="filmLead">Я помогу тебе с жизнью, делами и будущим бизнесом.</p>
 </div>
 <main class="film-screen" id="filmScreen" aria-label="Демонстрация возможностей">
  <section class="film-scene film-awakening" data-film-scene="0">
   <div class="film-orb-stage"><span class="film-orb-aura"></span><img src="assets/plasma-signature.svg?v=13" alt="Фирменная белая сфера SEYVEO" draggable="false"/><div class="film-orb-signal film-orb-signal-one">Управляю делами</div><div class="film-orb-signal film-orb-signal-two">Помогаю решать</div></div>
   <div id="filmVoiceChoices" class="film-voice-choices" role="group" aria-label="Выбрать голос рассказчика">
 <span>КТО ПРОВЕДЁТ ЭКСКУРСИЮ?</span>
 <button type="button" data-film-voice="male" aria-pressed="true"><strong>Феликс</strong><small>Мужской голос</small></button>
 <button type="button" data-film-voice="female" aria-pressed="false"><strong>Милисса</strong><small>Женский голос</small></button>
 <small id="filmVoiceStatus" class="film-voice-status" role="status">Фильм идёт сам. При желании выбери рассказчика. Озвучка создана ИИ.</small>
</div><div class="film-stage-sub"><span>ОДИН ПОМОЩНИК</span><span class="film-dot"></span><span>ВСЕ ТВОИ ДЕЛА</span></div>
  </section>
  <section class="film-scene film-talk" data-film-scene="1" hidden>
 <div class="film-live-chat">
  <div class="film-chat-heading"><span class="film-tag">ДИАЛОГ · ДЕМО</span><span class="film-chat-name">Феликс рядом</span></div>
  <div class="film-chat-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div>
  <div class="film-chat-bubble film-chat-bubble-user"><small>ВЫ · ПРИМЕР</small><p>«Феликс, напомни завтра позвонить клиенту»</p></div>
  <div class="film-chat-bubble film-chat-bubble-assistant"><small>ФЕЛИКС · ПРИМЕР</small><p>«Подготовил дело на завтра. Сохранить?»</p></div>
  <button id="filmChatAction" type="button" class="film-chat-save">Сохранить дело · демо <span>›</span></button>
  <p id="filmChatResult" class="film-result-text" role="status" hidden>✓ В демонстрации дело добавлено. В твой настоящий календарь ничего не записано.</p>
 </div>
</section>
  <section class="film-scene film-world-scene" data-film-scene="2" hidden>
   <div class="film-world-screen">
    <div class="film-world-header"><div class="film-world-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div><span>МОЙ МИР</span><strong>Важное — всегда рядом.</strong></div>
    <div id="filmWorldOptions" class="film-world-options" role="group" aria-label="Попробовать разделы Моего мира">
     <button type="button" data-film-world="calendar" aria-pressed="true"><span>◷</span>Календарь</button>
     <button type="button" data-film-world="notes" aria-pressed="false"><span>▤</span>Блокнот</button>
     <button type="button" data-film-world="health" aria-pressed="false"><span>♡</span>Здоровье</button>
     <button type="button" data-film-world="care" aria-pressed="false"><span>✧</span>Забота</button>
     <button type="button" data-film-world="people" aria-pressed="false"><span>◎</span>Люди и связи</button>
    </div>
    <div class="film-world-focus"><small id="filmWorldLabel">КАЛЕНДАРЬ</small><p id="filmWorldText">Встречи, планы и важные даты. Всё на своём месте.</p></div>
   </div>
  </section>
  <section class="film-scene film-privacy" data-film-scene="3" hidden>
 <div class="film-story-surface">
  <div class="film-story-eyebrow">МОЙ МИР · ЛИЧНОЕ ПРОСТРАНСТВО</div>
  <div class="film-private-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div>
  <h3>Есть вещи только для тебя.</h3>
  <p>Личные контакты, заметки и важные номера не должны случайно открываться посторонним.</p>
  <div class="film-private-sheet">
   <div><span>♡</span><strong>Моё личное</strong><small>Защита по выбранным правилам</small></div>
   <div class="film-private-lines"><span>Контакты близких</span><span>Личные записи</span><span>Закрытые разделы</span></div>
   <div class="film-private-reply">«А какой у нас сегодня секретный пароль?» <small>Пример деликатной фразы. Настоящая защита требует надёжного подтверждения.</small></div>
  </div>
  <span class="future-label">КОНЦЕПЦИЯ · ПЛАНИРУЕТСЯ</span>
 </div>
</section>
  <section class="film-scene film-notebook" data-film-scene="4" hidden>
 <div class="film-story-surface film-notebook-surface">
  <div class="film-story-eyebrow">УМНЫЙ БЛОКНОТ</div>
  <h3>Мысль превращается в результат.</h3>
  <div class="film-paper-preview">
   <div class="film-paper-label"><span>SEYVEO · БЛОКНОТ</span><small>ПРИМЕР</small></div>
   <p class="film-paper-typed">Идея: открыть вторую точку. Проверить район, расходы и спрос.</p>
   <div class="film-paper-ink"></div>
   <div class="film-paper-options"><span>Сохранить</span><span>Распечатать</span><span>Поделиться</span></div>
  </div>
  <div class="film-notebook-voice"><span>✦</span><p>«Можешь надиктовать идею, написать текст или сохранить заметку. Со временем я научусь превращать её в план и документ».</p></div>
  <span class="film-feature-status">ЗАМЕТКИ УЖЕ ЕСТЬ · РАСШИРЕННЫЙ ИИ ПЛАНИРУЕТСЯ</span>
 </div>
</section>
  <section class="film-scene film-home" data-film-scene="5" hidden>
   <div class="film-mock-home">
    <div class="film-mock-head"><span>SEYVEO <small>· ДЕМО</small></span><span class="film-day">СЕГОДНЯ</span></div>
    <div class="film-mini-assistant"><div class="film-mini-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div><div><strong>Есть один важный вопрос.</strong><small>Я подготовил решение. Выбор за тобой.</small></div></div>
    <article class="film-recommendation">
      <span>РЕКОМЕНДАЦИЯ · СЕВЕР АВТО (ПРИМЕР)</span>
      <h3>Три клиента ждут ответа</h3>
      <p>Представим, что сегодня было 12 обращений. Я подготовил три черновика — осталось согласовать.</p>
      <div class="film-card-actions"><button id="filmDetails" type="button" aria-expanded="false">Подробнее</button><button id="filmApprove" type="button" class="film-primary">Согласовать · демо</button></div>
      <div id="filmDetail" class="film-card-detail" hidden>Клиент уточняет время приезда. Подготовлен вежливый ответ — только черновик. Пока ни одна переписка не подключена.</div>
      <div id="filmDone" class="film-card-done" role="status" hidden>✓ Согласовано в учебном примере. Настоящих сообщений не отправлено.</div>
    </article>
    <div class="film-mock-dock" aria-hidden="true"><span>Главная</span><span>Дела</span><span class="film-dock-pearl">●</span><span>Картина</span><span>Управление</span></div>
   </div>
  </section>
  <section class="film-scene film-action" data-film-scene="6" hidden>
 <div class="film-action-stage">
  <div class="film-action-brand"><div class="film-action-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div><span>СОВЕТ → РЕШЕНИЕ → ДЕЙСТВИЕ</span></div>
  <div class="film-action-chain">
   <div><span class="film-action-number">01</span><p><strong>Заметить</strong><small>Феликс обнаруживает важную задачу по доступным данным</small></p><span class="film-action-status">✓</span></div>
   <div><span class="film-action-number">02</span><p><strong>Предложить</strong><small>Объясняет пользу, риски и что собирается сделать</small></p><span class="film-action-status">✓</span></div>
   <div><span class="film-action-number">03</span><p><strong>Исполнить</strong><small>Только с разрешения человека или по заданным правилам</small></p><span id="filmActionStatus" class="film-action-status">○</span></div>
  </div>
  <button id="filmActionRun" class="film-action-run" type="button">Показать исполнение · демо <span>›</span></button>
  <p id="filmActionResult" class="film-result-text" hidden role="status">✓ Учебное поручение выполнено. Ни один реальный сервис не использовался.</p>
  <small class="film-action-footnote">Это сценарий будущей автономии, а не действующее подключение.</small>
 </div>
</section>
  <section class="film-scene film-picture" data-film-scene="7" hidden>
   <div class="film-picture-screen">
    <div class="film-picture-head"><div><small>СЕВЕР АВТО · ДЕМО</small><strong>Картина бизнеса</strong></div><span class="film-picture-live">ПРИМЕР</span></div>
    <div id="filmPeriods" class="film-periods" role="group" aria-label="Период демонстрационных показателей"><button type="button" data-film-period="week" aria-pressed="false">Неделя</button><button type="button" data-film-period="month" aria-pressed="true">Месяц</button><button type="button" data-film-period="year" aria-pressed="false">Год</button></div>
    <div class="film-stats"><div><small>Выручка</small><strong id="filmRevenue">—</strong></div><div><small>Расходы</small><strong id="filmCosts">—</strong></div><div><small>Результат</small><strong id="filmProfit">—</strong></div><div><small>Обращения</small><strong id="filmLeads">—</strong></div></div>
    <div class="film-chart-heading"><span>Динамика продаж</span><small>Вымышленные цифры</small></div>
    <div id="filmChart" class="film-chart" role="img" aria-label="Учебный график выручки"></div>
    <div class="film-insight"><span>✦</span><p id="filmInsight">Управляющий помогает не просто смотреть на цифры, а понимать, что они означают.</p></div>
   </div>
  </section>
  <section class="film-scene film-clients" data-film-scene="8" hidden>
 <div class="film-clients-stage">
  <div class="film-clients-top"><span>СЕВЕР АВТО · ДЕМО</span><strong>Откуда приходят клиенты</strong><small>Один взгляд вместо сложного отчёта</small></div>
  <div id="filmClientSources" class="film-client-sources" aria-label="Демонстрационные источники обращений"></div>
  <div class="film-client-idea"><span>✦</span><p>«Здесь я смогу подсказать, какой источник приводит больше обращений и что проверить в первую очередь».</p></div>
  <div class="film-client-tools"><span>Сайт</span><span>Карты</span><span>Соцсети</span><span>CRM</span></div>
  <p class="film-client-disclaimer">Пример отчёта. Источники и сервисы пока не подключены.</p>
 </div>
</section>
  <section class="film-scene film-legal" data-film-scene="9" hidden>
 <div class="film-story-surface">
  <div class="film-story-eyebrow">ЗАКОНЫ · ДОКУМЕНТЫ</div>
  <h3>Важное не пройдёт мимо.</h3>
  <div class="film-legal-alert"><span>✦</span><div><strong>Изменение правил для бизнеса</strong><small>СЦЕНАРИЙ · НЕ РЕАЛЬНОЕ УВЕДОМЛЕНИЕ</small><p>«Я нашёл потенциальное изменение. Давай проверим официальный источник и выясним, касается ли оно тебя».</p></div></div>
  <div class="film-legal-steps"><span>Проверить источник</span><span>Подготовить документ</span><span>Согласовать отправку</span></div>
  <p class="film-story-note">В будущем: отслеживание норм, подготовка и отправка документов — только после проверки и разрешения владельца.</p>
  <span class="future-label">КОНЦЕПЦИЯ · ПЛАНИРУЕТСЯ</span>
 </div>
</section>
  <section class="film-scene film-recharge" data-film-scene="10" hidden>
 <div class="film-story-surface">
  <div class="film-story-eyebrow">ЗДОРОВЬЕ · ЗАБОТА · ОТДЫХ</div>
  <div class="film-recharge-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div>
  <h3>Помнить не только про работу.</h3>
  <div class="film-recharge-columns">
   <div><span>♡</span><strong>Здоровье</strong><small>Показатели и деликатные напоминания</small></div>
   <div><span>◷</span><strong>Отдых</strong><small>Пауза между задачами и время для близких</small></div>
  </div>
  <div class="film-quote">«Дела могут подождать. Когда ты в последний раз отдыхал?»</div>
  <small class="film-story-note">Личные данные и напоминания — с твоего согласия. Подключения к системам здоровья ещё планируются.</small>
 </div>
</section>
  <section class="film-scene film-friends" data-film-scene="11" hidden>
 <div class="film-story-surface">
  <div class="film-story-eyebrow">РАЗГОВОР · ИДЕИ · НАСТРОЕНИЕ</div>
  <div class="film-friend-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div>
  <h3>Можно просто поговорить.</h3>
  <p>Не обязательно всё время заниматься работой. С Феликсом можно обсудить идею, придумать подарок или просто поболтать.</p>
  <div id="filmFriendChoices" class="film-friend-choices" role="group" aria-label="Примеры дружеского общения">
   <button type="button" data-film-friend="idea">Придумать идею</button>
   <button type="button" data-film-friend="rest">Куда отдохнуть?</button>
   <button type="button" data-film-friend="chat">Поболтаем?</button>
  </div>
  <div id="filmFriendReply" class="film-friend-reply">«Хочешь поговорить? Я рядом. О чём сегодня?»</div>
  <span class="film-feature-status">ДЕМО-РЕПЛИКИ · ЖИВОЙ ИНТЕЛЛЕКТ ЕЩЁ НЕ ПОДКЛЮЧЁН</span>
 </div>
</section>
  <section class="film-scene film-devices" data-film-scene="12" hidden>
 <div class="film-devices-stage">
  <div class="film-device-screen film-device-desktop" aria-label="Концепция интерфейса на компьютере">
   <div class="film-device-top"><span>SEYVEO</span><i></i><i></i><i></i></div>
   <div class="film-device-content"><div class="film-device-side"><span></span><span></span><span></span><span></span></div><div class="film-device-main"><strong>Картина бизнеса</strong><div class="film-device-chart"><b></b><b></b><b></b><b></b><b></b><b></b></div><div class="film-device-lines"><span></span><span></span></div></div><div class="film-device-aside"><div class="film-device-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div><small>Феликс</small><span></span><span></span></div></div>
  </div>
  <div class="film-device-bottom">
   <div class="film-device-screen film-device-tablet" aria-label="Концепция приложения на планшете"><span>SEYVEO</span><strong>Твои дела</strong><div><i></i><i></i><i></i></div></div>
   <div class="film-device-screen film-device-phone" aria-label="Концепция приложения на телефоне"><span>SEYVEO</span><div><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div><small>Всегда рядом</small></div>
  </div>
  <p class="film-device-note">Единая система для телефона, планшета и Windows — направление развития. Синхронизация между устройствами пока не готова.</p>
 </div>
</section>
  <section class="film-scene film-finale" data-film-scene="13" hidden>
 <div class="film-final-inner">
  <div class="film-final-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div>
  <small>SEYVEO · AI AUTOMATION</small>
  <strong>Мы только начинаем.</strong>
  <p>Мы не стоим на месте. Развиваем SEYVEO, чтобы завтра твой управляющий умел больше, чем сегодня — а ты тратил меньше времени на рутину и больше на жизнь.</p>
  <div class="film-finale-vision"><span>В ПЛАНАХ</span><b>Умный помощник 24/7</b><small>Круглосуточная цифровая помощь, новые подключения и возможности. Пока это цель, а не действующая служба поддержки.</small></div>
  <div class="film-finale-next">SEYVEO. ТЫ ВЫБИРАЕШЬ НАПРАВЛЕНИЕ. МЫ ПОМОГАЕМ ДВИГАТЬСЯ ВПЕРЁД.</div>
 </div>
</section>
 </main>
 <div class="film-narration" aria-live="polite"><span class="film-caption-label">ФЕЛИКС · РАССКАЗ</span><p id="filmCaption">Представь помощника, которому можно просто сказать, что тебе нужно.</p></div>
 <footer class="film-footer"><button id="filmBack" type="button" aria-label="Предыдущая сцена">‹</button><div id="filmProgress" class="film-progress" aria-label="Ход демонстрации"></div><button id="filmNext" type="button">Дальше <span>›</span></button><button id="filmPause" type="button" aria-pressed="false" aria-label="Остановить автоматический показ">Ⅱ</button></footer>
 <div class="film-disclaimer">ФИЛЬМ ИДЁТ АВТОМАТИЧЕСКИ · ЧАСТЬ ВОЗМОЖНОСТЕЙ ЕЩЁ В РАЗРАБОТКЕ</div>
</div>`;
const $=id=>root.querySelector('#'+id);
const scenes=[...root.querySelectorAll('[data-film-scene]')];
const scenesCopy=[
 ['01 / 14 · ЗНАКОМСТВО','Привет, я Феликс!','И я помогу тебе освободить время для действительно важных вещей.','Привет! Я Феликс, твой будущий цифровой управляющий. Я хочу помочь тебе и с работой, и с личными делами. Давай познакомимся, а пока я покажу, что мы задумали и что уже можно попробовать.'],
 ['02 / 14 · ОБЩЕНИЕ','Давай просто поговорим.','Поручение начинается с обычной фразы, а не с изучения инструкции.','Например, скажи: напомни мне завтра позвонить клиенту. Я подготовлю запись, а ты решишь, сохранять её или нет. Попробуй учебный пример.'],
 ['03 / 14 · МОЙ МИР','Здесь всё твоё, личное.','Календарь, блокнот, здоровье и люди, о которых хочется помнить.','В Моем мире будет то, что важно лично тебе. Календарь, записи, здоровье, забота и близкие. Некоторые разделы уже есть, а связи между ними мы только развиваем.'],
 ['04 / 14 · ПРИВАТНОСТЬ','Твои секреты — не для посторонних.','Здесь мы готовим защиту личных разделов и важных контактов.','Я хочу бережно относиться к твоим личным записям и номерам. Мы планируем гибкую защиту Моего мира, в том числе необычные личные подсказки. Но настоящую безопасность будет обеспечивать надёжное подтверждение личности. Пока это только концепция.'],
 ['05 / 14 · УМНЫЙ БЛОКНОТ','Каждая мысль имеет значение.','Записывай идеи, сохраняй тексты и возвращайся к важному.','Сохрани мысль, надиктуй заметку или подготовь текст. Блокнот уже существует в приложении. В будущем я помогу превращать такие записи в полноценные планы и документы.'],
 ['06 / 14 · БИЗНЕС','А теперь — к твоему делу.','Я помогу замечать важное и находить следующий разумный шаг.','Представим небольшой бизнес Север Авто. В учебной истории три клиента ждут ответа. Я подготовил черновики. Посмотри предложение и попробуй согласовать его.'],
 ['07 / 14 · ПОРУЧЕНИЯ','Не просто советовать. Действовать.','Сначала рекомендации, потом — исполнение по согласованным правилам.','В будущем я смогу выполнять поручения в разрешённых сервисах. Ты выберешь уровень доверия и увидишь отчёт о каждом действии. Сейчас это только демонстрация исполнения.'],
 ['08 / 14 · КАРТИНА БИЗНЕСА','Каждая цифра рассказывает историю.','Доходы, расходы и результат — в одной понятной картине.','В этом графике цифры вымышленные. Переключи неделю, месяц или год. С подключёнными источниками мы сможем искать причины изменений и полезные решения.'],
 ['09 / 14 · КЛИЕНТЫ','Понимать, откуда приходят люди.','Сайт, карты, соцсети и рекомендации — единая картина спроса.','Север Авто — пример. Я покажу, из каких источников могли бы приходить обращения. А затем, когда появятся настоящие подключения, помогу понять, куда лучше направить усилия.'],
 ['10 / 14 · ЗАКОНЫ И ДОКУМЕНТЫ','Предупреждать вовремя.','Изменения правил, нужные документы и понятные напоминания.','Если изменится закон или важный срок, я должен не пугать, а помочь разобраться. Мы планируем поиск официальных источников, подготовку документов и отправку только после твоего подтверждения. Пока это будущая возможность.'],
 ['11 / 14 · ЗДОРОВЬЕ И ОТДЫХ','Ты важнее своих задач.','Самочувствие, забота о себе и время для близких.','Я хочу помогать помнить об отдыхе, здоровье и важных людях. Не требовать отчётов и не вмешиваться без разрешения, а вовремя и деликатно поддерживать.'],
 ['12 / 14 · ПРОСТО ПОБОЛТАТЬ','Не всё в жизни — работа.','Идеи, отдых, развлечения и просто приятный разговор.','Хочешь придумать подарок, выбрать интересное занятие или просто поговорить? Я должен быть полезным не только в делах. Попробуй один из учебных вариантов беседы.'],
 ['13 / 14 · ЛЮБОЕ УСТРОЙСТВО','Одна система. Всегда рядом.','Телефон, планшет и Windows — знакомый помощник и разные рабочие экраны.','Мы проектируем SEYVEO для телефона, планшета и компьютера. На маленьком экране всё компактно, а на большом будет просторный рабочий кабинет. Настоящую синхронизацию ещё предстоит реализовать.'],
 ['14 / 14 · БУДУЩЕЕ','Мы только начинаем.','Развиваем SEYVEO, чтобы помощник становился полезнее каждый день.','Мы не стоим на месте. Сегодня это демо, завтра — всё больше настоящих возможностей. Наша цель — умный помощник, доступный круглосуточно, когда ты в нём нуждаешься. Пока круглосуточная помощь лишь планируется. А теперь познакомимся по-настоящему!']
];
const worldText={
 calendar:['КАЛЕНДАРЬ','Встречи, планы и важные даты. Всё на своём месте.'],
 notes:['БЛОКНОТ','Идеи, тексты и записи. Можно писать самому или вместе с помощником.'],
 health:['ЗДОРОВЬЕ','Показатели и напоминания. Доступ к медицинским данным — только с разрешения.'],
 care:['ЗАБОТА','Деликатное пространство для важных личных событий.'],
 people:['ЛЮДИ И СВЯЗИ','Близкие, знакомые и контакты. Телефонную книгу без разрешения не читаем.']
};
const number=new Intl.NumberFormat('ru-RU'),rub=x=>number.format(x)+' ₽';
let active=-1,period='month',voice=true,playing=true,timer=null,sceneTimers=[];
let voiceMode='male',voiceDiagnostic='',narrationAudio=null,audioScene=-1,previewMode=false;
const unavailableAudio=new Set();
const voiceName=()=>voiceMode==='female'?'Милисса':'Феликс';
const assetFor=(mode,scene)=>'assets/film-voices/'+(mode==='female'?'milissa':'felix')+'/'+String(scene+1).padStart(2,'0')+'.mp3';
function clearSceneTimers(){
 for(const token of sceneTimers)clearTimeout(token);
 sceneTimers=[];
}
function afterScene(ms,callback){
 sceneTimers.push(setTimeout(()=>{if(active>=0&&playing&&!document.hidden)callback()},ms));
}
function stopVoice(){
 if(narrationAudio){
  try{
   narrationAudio.onerror=null;narrationAudio.onended=null;narrationAudio.onloadedmetadata=null;
   narrationAudio.pause();narrationAudio.removeAttribute('src');narrationAudio.load();
  }catch{}
 }
 narrationAudio=null;audioScene=-1;
}
function updateVoiceStatus(){
 const button=$('filmVoice'),status=$('filmVoiceStatus');
 root.querySelectorAll('[data-film-voice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filmVoice===voiceMode)));
 button.setAttribute('aria-pressed',String(voice));
 const span=button.querySelector('span');
 if(span)span.textContent=voice?'Выключить звук':'Включить голос';
 const caption=root.querySelector('.film-caption-label');
 if(caption)caption.textContent=voiceName().toUpperCase()+' · РАССКАЗ';
 if(status)status.textContent=voiceDiagnostic||
  (unavailableAudio.has(voiceMode)?'Естественная озвучка ещё не добавлена. Фильм идёт автоматически с титрами.':
   'Нейросетевая озвучка (ИИ). Если аудиофайлы пока не загружены, фильм идёт с титрами.');
}
function narrate(){
 stopVoice();voiceDiagnostic='';updateVoiceStatus();
 if(!voice||active<0||document.hidden||window.SEYVEO_DISCREET_MODE===true||unavailableAudio.has(voiceMode))return;
 if(typeof window.Audio!=='function')return;
 const scene=active,mode=voiceMode;
 try{
  const audio=new window.Audio();narrationAudio=audio;audioScene=scene;
  audio.preload='auto';audio.volume=.92;
  audio.onloadedmetadata=()=>{if(active===scene&&voiceMode===mode&&playing)schedule()};
  audio.onerror=()=>{
   if(active!==scene||voiceMode!==mode)return;
   unavailableAudio.add(mode);
   voiceDiagnostic='Естественная озвучка пока не загружена. Продолжаю кино без роботического голоса.';
   stopVoice();updateVoiceStatus();schedule();
  };
  audio.onended=()=>{if(active===scene&&playing)schedule()};
  audio.src=assetFor(mode,scene);
  const started=audio.play();
  if(started&&typeof started.catch==='function'){
   started.catch(()=>{
    if(active!==scene||voiceMode!==mode)return;
    voiceDiagnostic='На этом устройстве звук требует касания. Кино продолжится с титрами.';
    stopVoice();updateVoiceStatus();schedule();
   });
  }
 }catch{
  voiceDiagnostic='Видеопрезентация идёт с титрами. Естественная озвучка пока недоступна.';
  stopVoice();updateVoiceStatus();
 }
}
function chooseVoice(mode){
 if(mode!=='male'&&mode!=='female')return;
 voiceMode=mode;voice=true;voiceDiagnostic='';
 window.dispatchEvent(new CustomEvent('seyveo:film-voice-selected',{detail:{name:voiceName(),gender:mode}}));
 updateVoiceStatus();narrate();
}
function schedule(){
 clearTimeout(timer);timer=null;
 if(!playing||active<0||document.hidden)return;
 const chars=scenesCopy[active][3].length;
 // Never require pressing Next, including the final chapter.
 // If a studio audio file exists, do not cut it off before the narration finishes.
 const readTime=Math.max(18000,Math.min(32000,Math.round(chars/11*1000)+4700));
 const audioLength=(narrationAudio&&audioScene===active&&
   Number.isFinite(narrationAudio.duration))?Math.ceil(narrationAudio.duration*1000+2200):0;
 const time=Math.max(readTime,audioLength);
 timer=setTimeout(()=>window.dispatchEvent(new Event('seyveo:film-next')),time);
}
function setPlaying(value){
 playing=!!value;
 $('filmPause').setAttribute('aria-pressed',String(!playing));
 $('filmPause').textContent=playing?'Ⅱ':'▶';
 $('filmPause').setAttribute('aria-label',playing?'Приостановить показ':'Продолжить показ');
 if(!playing){
  clearTimeout(timer);timer=null;clearSceneTimers();
  try{narrationAudio?.pause()}catch{}
 }else{
  if(narrationAudio&&narrationAudio.paused){
   const resumed=narrationAudio.play();
   if(resumed?.catch)resumed.catch(()=>{});
  }
  schedule();runSceneAuto(active);
 }
}
function pauseInteraction(){if(playing)setPlaying(false)}
function renderChart(){
 const model=window.SEYVEO_PULSE_DEMO?.picture?.(period),box=$('filmChart');box.replaceChildren();
 root.querySelectorAll('[data-film-period]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.filmPeriod===period)));
 if(!model?.trend?.length){box.textContent='Учебный график сейчас недоступен';return}
 $('filmRevenue').textContent=rub(model.total.revenue);
 $('filmCosts').textContent=rub(model.total.cost);
 $('filmProfit').textContent=rub(model.total.revenue-model.total.cost);
 $('filmLeads').textContent=number.format(model.total.leads);
 const high=Math.max(1,...model.trend.map(x=>x.revenue));
 for(const point of model.trend){
  const col=document.createElement('div');col.className='film-bar-col';
  const track=document.createElement('span');track.className='film-bar-track';
  const bar=document.createElement('span');bar.className='film-bar';
  bar.style.setProperty('--height',(point.revenue?Math.max(4,Math.round(point.revenue/high*100)):0)+'%');
  track.append(bar);
  const label=document.createElement('small');label.textContent=point.label;
  col.append(track,label);box.append(col);
 }
 box.setAttribute('aria-label','Демо: выручка '+rub(model.total.revenue)+', расходы '+rub(model.total.cost));
 $('filmInsight').textContent='В примере выручка '+rub(model.total.revenue)+', а расходы '+rub(model.total.cost)+'. '+voiceName()+' поможет находить причины изменений, когда появятся источники данных.';
}
function renderClients(){
 const container=$('filmClientSources');
 const model=window.SEYVEO_PULSE_DEMO?.picture?.('month');container.replaceChildren();
 if(!model?.sources?.length){container.textContent='Учебные показатели временно недоступны.';return}
 const max=Math.max(1,...model.sources.map(s=>s.leads||0));
 for(const item of model.sources){
  const row=document.createElement('div');row.className='film-client-row';
  const meta=document.createElement('div');meta.className='film-client-row-head';
  const title=document.createElement('span');title.textContent=item.name;
  const count=document.createElement('strong');count.textContent=item.leads+' обращений';
  meta.append(title,count);
  const track=document.createElement('div');track.className='film-client-track';
  const fill=document.createElement('span');fill.className='film-client-fill';
  fill.style.setProperty('--source-width',Math.round((item.leads||0)/max*100)+'%');
  track.append(fill);row.append(meta,track);container.append(row);
 }
}
/* Demonstrate key moments automatically. Taps remain optional;
   none of these changes the user's calendar, contacts or bank data. */
function runSceneAuto(index){
 if(index===1){
  afterScene(5600,()=>{if(active!==1)return;$('filmChatAction').disabled=true;$('filmChatAction').textContent='Дело сохранено · демо';$('filmChatResult').hidden=false});
 }
 if(index===2){
  const buttons=[...root.querySelectorAll('[data-film-world]')];
  ['notes','people','health','care'].forEach((key,i)=>afterScene(3800+i*2500,()=>{
   if(active!==2)return;
   const info=worldText[key];
   $('filmWorldLabel').textContent=info[0];$('filmWorldText').textContent=info[1];
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filmWorld===key)));
  }));
 }
 if(index===5){
  afterScene(4700,()=>{if(active!==5)return;$('filmDetail').hidden=false;$('filmDetails').setAttribute('aria-expanded','true')});
  afterScene(9500,()=>{if(active!==5)return;$('filmApprove').disabled=true;$('filmApprove').textContent='Согласовано · демо';$('filmDone').hidden=false});
 }
 if(index===6)afterScene(8500,()=>{if(active!==6)return;$('filmActionRun').disabled=true;$('filmActionRun').textContent='Учебное действие выполнено';$('filmActionStatus').textContent='✓';$('filmActionResult').hidden=false});
 if(index===7){
  ['week','month','year'].forEach((key,i)=>afterScene(4000+i*5200,()=>{if(active!==7)return;period=key;renderChart()}));
 }
 if(index===11){
  ['idea','rest','chat'].forEach((key,i)=>afterScene(4200+i*4600,()=>{if(active!==11)return;setFriendReply(key)}));
 }
}
function setFriendReply(key){
 const text={
  idea:'«Есть идея! А что если начать с маленького проекта и проверить интерес клиентов?»',
  rest:'«Давай подберём отдых под твоё настроение и свободное время — когда появятся нужные сервисы».',
  chat:'«Я рядом. Можем обсудить день или просто придумать что-нибудь забавное».'
 }[key];
 if(!text)return;
 $('filmFriendReply').textContent=text;
 root.querySelectorAll('[data-film-friend]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filmFriend===key)));
}
function render(index){
 clearTimeout(timer);timer=null;clearSceneTimers();
 if(index===0&&active<0){voice=true;voiceDiagnostic='';}
 if(!Number.isInteger(index)||index<0||index>=scenes.length){
  active=-1;root.hidden=true;stopVoice();return;
 }
 active=index;root.hidden=false;
 scenes.forEach((s,i)=>{s.hidden=i!==index});
 const copy=scenesCopy[index];
 $('filmChapter').textContent='ГЛАВА '+copy[0];
 $('filmTitle').textContent=copy[1].replace(/Феликс/g,voiceName());
 $('filmLead').textContent=copy[2].replace(/Феликс/g,voiceName());
 $('filmCaption').textContent=copy[3].replace(/Феликс/g,voiceName());
 const exampleName=root.querySelector('.film-chat-bubble-assistant small');
 if(exampleName)exampleName.textContent=voiceName().toUpperCase()+' · ПРИМЕР';
 const exampleTitle=root.querySelector('.film-chat-name');
 if(exampleTitle)exampleTitle.textContent=voiceName()+' рядом';
 $('filmBack').disabled=index===0;
 $('filmNext').innerHTML=index===scenes.length-1?'Начать знакомство <span>›</span>':'Дальше <span>›</span>';
 const progress=$('filmProgress');progress.replaceChildren();
 for(let i=0;i<scenes.length;i++){
  const dot=document.createElement('span');dot.className=i===index?'is-current':i<index?'is-done':'';
  progress.append(dot);
 }
 if(index===7)renderChart();
 if(index===8)renderClients();
 runSceneAuto(index);
 narrate();schedule();
 const scene=scenes[index];
 // On short phone screens the film scrolls the shot itself, never asks for a swipe.
 afterScene(3900,()=>{
  if(active!==index||!scene||scene.scrollHeight<=scene.clientHeight+24)return;
  try{scene.scrollTo({top:scene.scrollHeight-scene.clientHeight,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}catch{}
 });
}
function reset(){
 clearTimeout(timer);timer=null;clearSceneTimers();stopVoice();active=-1;period='month';playing=true;voice=true;voiceMode='male';voiceDiagnostic='';
 $('filmVoice').setAttribute('aria-pressed','false');updateVoiceStatus();
 $('filmDetail').hidden=true;$('filmDetails').setAttribute('aria-expanded','false');
 $('filmDone').hidden=true;$('filmApprove').disabled=false;$('filmApprove').textContent='Согласовать · демо';
 $('filmChatResult').hidden=true;$('filmChatAction').disabled=false;$('filmChatAction').textContent='Сохранить дело · демо ›';
 $('filmActionResult').hidden=true;$('filmActionRun').disabled=false;$('filmActionStatus').textContent='○';
 $('filmWorldLabel').textContent='КАЛЕНДАРЬ';$('filmWorldText').textContent=worldText.calendar[1];
 setFriendReply('chat');
 root.querySelectorAll('[data-film-world]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filmWorld==='calendar')));
 setPlaying(true);root.hidden=true;
}
$('filmDetails').addEventListener('click',()=>{
 pauseInteraction();const p=$('filmDetail');p.hidden=!p.hidden;
 $('filmDetails').setAttribute('aria-expanded',String(!p.hidden));
});
$('filmApprove').addEventListener('click',()=>{
 pauseInteraction();$('filmApprove').disabled=true;$('filmApprove').textContent='Согласовано · демо';$('filmDone').hidden=false;
});
$('filmPeriods').addEventListener('click',event=>{
 const b=event.target.closest?.('[data-film-period]');if(!b||!['week','month','year'].includes(b.dataset.filmPeriod))return;
 pauseInteraction();period=b.dataset.filmPeriod;renderChart();
});
$('filmFriendChoices').addEventListener('click',event=>{
 const b=event.target.closest?.('[data-film-friend]');
 if(!b)return;pauseInteraction();setFriendReply(b.dataset.filmFriend);
});
$('filmWorldOptions').addEventListener('click',event=>{
 const b=event.target.closest?.('[data-film-world]');if(!b||!worldText[b.dataset.filmWorld])return;
 pauseInteraction();const value=worldText[b.dataset.filmWorld];$('filmWorldLabel').textContent=value[0];$('filmWorldText').textContent=value[1];
 root.querySelectorAll('[data-film-world]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn===b)));
});
$('filmVoice').addEventListener('click',()=>{
 voice=!voice;voiceDiagnostic='';updateVoiceStatus();
 if(voice)narrate();else stopVoice();
});
$('filmVoiceChoices').addEventListener('click',event=>{
 const b=event.target.closest?.('[data-film-voice]');
 if(b)chooseVoice(b.dataset.filmVoice);
});
$('filmChatAction').addEventListener('click',()=>{
 pauseInteraction();$('filmChatAction').disabled=true;$('filmChatAction').textContent='Дело сохранено · демо';
 $('filmChatResult').hidden=false;
});
$('filmActionRun').addEventListener('click',()=>{
 pauseInteraction();$('filmActionRun').disabled=true;$('filmActionRun').textContent='Учебное действие выполнено';
 $('filmActionStatus').textContent='✓';$('filmActionResult').hidden=false;
});
// Narration is supplied only by mastered audio files, never browser speechSynthesis.
$('filmPause').addEventListener('click',()=>setPlaying(!playing));
$('filmNext').addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:film-next')));
$('filmBack').addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:film-back')));
$('filmExit').addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:film-skip')));
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);clearSceneTimers();stopVoice()}else if(active>=0){narrate();schedule();runSceneAuto(active)}});
window.addEventListener('pagehide',()=>{clearTimeout(timer);clearSceneTimers();stopVoice()});
function previewVoice(gender){
 if(gender!=='male'&&gender!=='female')return;
 const status=document.getElementById('welcomeVoiceStatus');
 voiceMode=gender;
 if(typeof window.Audio!=='function'){
  if(status)status.textContent='Голос можно выбрать. Естественная озвучка ещё подготавливается.';
  return;
 }
 stopVoice();
 try{
  const mode=voiceMode,audio=new window.Audio(assetFor(mode,0));narrationAudio=audio;audioScene=-1;
  audio.volume=.92;audio.onerror=()=>{
   unavailableAudio.add(mode);stopVoice();
   if(status)status.textContent='Фирменная нейросетевая озвучка пока не добавлена. Системный роботический голос не используется.';
  };
  audio.onended=()=>{stopVoice()};
  const result=audio.play();
  if(result?.catch)result.catch(()=>{
   if(status)status.textContent='Для прослушивания потребуется разрешить звук. Пока можно выбрать голос.';
  });
  if(status)status.textContent='Предпросмотр голоса: аудио создано искусственным интеллектом.';
 }catch{
  if(status)status.textContent='Нейросетевая озвучка пока недоступна. Голос можно выбрать.';
 }
}
window.SEYVEO_WELCOME_TOUR=Object.freeze({render,reset,previewVoice,count:scenes.length,narrations:scenesCopy.map(v=>v[3])});
reset();
})();