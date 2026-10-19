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
  <span id="filmChapter" class="film-chapter">ГЛАВА 01 / 05 · ПРОБУЖДЕНИЕ</span>
  <h2 id="filmTitle">Помощник, который рядом.</h2>
  <p id="filmLead">Не нужно разбираться в сложных меню. Просто расскажи, что тебе нужно.</p>
 </div>
 <main class="film-screen" id="filmScreen" aria-label="Демонстрация возможностей">
  <section class="film-scene film-awakening" data-film-scene="0">
   <div class="film-orb-stage"><span class="film-orb-aura"></span><img src="assets/plasma-signature.svg?v=13" alt="Фирменная белая сфера SEYVEO" draggable="false"/><div class="film-orb-signal film-orb-signal-one">Управляю делами</div><div class="film-orb-signal film-orb-signal-two">Помогаю решать</div></div>
   <div class="film-stage-sub"><span>ОДИН ПОМОЩНИК</span><span class="film-dot"></span><span>ВСЕ ТВОИ ДЕЛА</span></div>
  </section>
  <section class="film-scene film-home" data-film-scene="1" hidden>
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
  <section class="film-scene film-picture" data-film-scene="2" hidden>
   <div class="film-picture-screen">
    <div class="film-picture-head"><div><small>СЕВЕР АВТО · ДЕМО</small><strong>Картина бизнеса</strong></div><span class="film-picture-live">ПРИМЕР</span></div>
    <div id="filmPeriods" class="film-periods" role="group" aria-label="Период демонстрационных показателей"><button type="button" data-film-period="week" aria-pressed="false">Неделя</button><button type="button" data-film-period="month" aria-pressed="true">Месяц</button><button type="button" data-film-period="year" aria-pressed="false">Год</button></div>
    <div class="film-stats"><div><small>Выручка</small><strong id="filmRevenue">—</strong></div><div><small>Расходы</small><strong id="filmCosts">—</strong></div><div><small>Результат</small><strong id="filmProfit">—</strong></div><div><small>Обращения</small><strong id="filmLeads">—</strong></div></div>
    <div class="film-chart-heading"><span>Динамика продаж</span><small>Вымышленные цифры</small></div>
    <div id="filmChart" class="film-chart" role="img" aria-label="Учебный график выручки"></div>
    <div class="film-insight"><span>✦</span><p id="filmInsight">Управляющий помогает не просто смотреть на цифры, а понимать, что они означают.</p></div>
   </div>
  </section>
  <section class="film-scene film-world-scene" data-film-scene="3" hidden>
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
  <section class="film-scene film-finale" data-film-scene="4" hidden>
   <div class="film-final-inner"><div class="film-final-orb"><img src="assets/plasma-signature.svg?v=13" alt="" draggable="false"></div><small>ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА</small><strong>Теперь — твоя история.</strong><p>Я показал возможности на вымышленных данных. Давай познакомимся, узнаем твои цели и выберем первый полезный шаг.</p><span>Никаких выдуманных клиентов и финансов в твоих данных не останется.</span></div>
  </section>
 </main>
 <div class="film-narration" aria-live="polite"><span class="film-caption-label">ФЕЛИКС · РАССКАЗ</span><p id="filmCaption">Представь помощника, которому можно просто сказать, что тебе нужно.</p></div>
 <footer class="film-footer"><button id="filmBack" type="button" aria-label="Предыдущая сцена">‹</button><div id="filmProgress" class="film-progress" aria-label="Ход демонстрации"></div><button id="filmNext" type="button">Дальше <span>›</span></button><button id="filmPause" type="button" aria-pressed="false" aria-label="Остановить автоматический показ">Ⅱ</button></footer>
 <div class="film-disclaimer">ДЕМО · ПРИМЕР ВОЗМОЖНОСТЕЙ · РЕАЛЬНЫЙ ИИ И СЕРВИСЫ ПОКА НЕ ПОДКЛЮЧЕНЫ</div>
</div>`;
const $=id=>root.querySelector('#'+id);
const scenes=[...root.querySelectorAll('[data-film-scene]')];
const scenesCopy=[
 ['01 / 05 · ПРОБУЖДЕНИЕ','Помощник, который рядом.','Не нужно разбираться в сложных меню. Просто расскажи, что тебе нужно.','Представь помощника, которому можно просто сказать, что ты хочешь сделать. Я покажу тебе, как это будет выглядеть.'],
 ['02 / 05 · РЕКОМЕНДАЦИИ','Решение вместо десятка кнопок.','Феликс сам замечает важное и предлагает одно действие.','Вот вымышленная компания Север Авто. Три клиента ждут ответа. Я подготовил черновики. Попробуй посмотреть предложение и согласовать его.'],
 ['03 / 05 · КАРТИНА БИЗНЕСА','Видеть больше, чем цифры.','Интерактивный график показывает, как может работать аналитика.','Здесь ты видишь пример бизнес показателей. Выбери неделю, месяц или год. Когда подключим реальные источники, Феликс сможет помогать с анализом.'],
 ['04 / 05 · МОЙ МИР','Работа и жизнь — в гармонии.','Календарь, заметки и забота о близких — рядом, но отдельно от бизнеса.','Здесь личное пространство. Нажми на календарь, блокнот, здоровье или другие разделы, чтобы увидеть их возможности.'],
 ['05 / 05 · ВМЕСТЕ','Теперь — твоя история.','Больше не пример. Давай познакомимся и выберем первый полезный шаг.','Демонстрация закончена. А теперь давай познакомимся. Я узнаю твои цели и подскажу, с чего начать.']
];
const worldText={
 calendar:['КАЛЕНДАРЬ','Встречи, планы и важные даты. Всё на своём месте.'],
 notes:['БЛОКНОТ','Идеи, тексты и записи. Можно писать самому или вместе с помощником.'],
 health:['ЗДОРОВЬЕ','Показатели и напоминания. Доступ к медицинским данным — только с разрешения.'],
 care:['ЗАБОТА','Деликатное пространство для важных личных событий.'],
 people:['ЛЮДИ И СВЯЗИ','Близкие, знакомые и контакты. Телефонную книгу без разрешения не читаем.']
};
const number=new Intl.NumberFormat('ru-RU'),rub=x=>number.format(x)+' ₽';
let active=-1,period='month',voice=false,playing=true,timer=null,lastUtterance=null;
function stopVoice(){if('speechSynthesis' in window)try{window.speechSynthesis.cancel()}catch{}lastUtterance=null}
function narrate(){
 stopVoice();
 if(!voice||active<0||document.hidden||!window.SpeechSynthesisUtterance||!window.speechSynthesis)return;
 try{
  const say=new window.SpeechSynthesisUtterance(scenesCopy[active][3]);say.lang='ru-RU';say.rate=.96;say.volume=.85;
  const voices=window.speechSynthesis.getVoices?.()||[];
  say.voice=voices.find(v=>v.lang?.toLowerCase().startsWith('ru')&&v.localService)||voices.find(v=>v.lang?.toLowerCase().startsWith('ru'))||null;
  lastUtterance=say;window.speechSynthesis.speak(say);
 }catch{}
}
function schedule(){
 clearTimeout(timer);timer=null;
 if(!playing||active<0||active>=scenes.length-1||document.hidden)return;
 timer=setTimeout(()=>window.dispatchEvent(new Event('seyveo:film-next')),active===0?9000:active===1?12500:11000);
}
function setPlaying(value){
 playing=!!value;
 $('filmPause').setAttribute('aria-pressed',String(!playing));
 $('filmPause').textContent=playing?'Ⅱ':'▶';
 $('filmPause').setAttribute('aria-label',playing?'Приостановить показ':'Продолжить показ');
 schedule();
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
 $('filmInsight').textContent='В примере выручка '+rub(model.total.revenue)+', а расходы '+rub(model.total.cost)+'. Феликс поможет находить причины изменений, когда появятся источники данных.';
}
function render(index){
 clearTimeout(timer);timer=null;
 if(!Number.isInteger(index)||index<0||index>=scenes.length){
  active=-1;root.hidden=true;stopVoice();return;
 }
 active=index;root.hidden=false;
 scenes.forEach((s,i)=>{s.hidden=i!==index});
 const copy=scenesCopy[index];
 $('filmChapter').textContent='ГЛАВА '+copy[0];
 $('filmTitle').textContent=copy[1];$('filmLead').textContent=copy[2];$('filmCaption').textContent=copy[3];
 $('filmBack').disabled=index===0;
 $('filmNext').innerHTML=index===scenes.length-1?'Познакомиться <span>›</span>':'Дальше <span>›</span>';
 const progress=$('filmProgress');progress.replaceChildren();
 for(let i=0;i<scenes.length;i++){
  const dot=document.createElement('span');dot.className=i===index?'is-current':i<index?'is-done':'';
  progress.append(dot);
 }
 if(index===2)renderChart();
 narrate();schedule();
}
function reset(){
 clearTimeout(timer);timer=null;stopVoice();active=-1;period='month';playing=true;voice=false;
 $('filmVoice').setAttribute('aria-pressed','false');$('filmVoice').innerHTML='◌ <span>Слушать</span>';
 $('filmDetail').hidden=true;$('filmDetails').setAttribute('aria-expanded','false');
 $('filmDone').hidden=true;$('filmApprove').disabled=false;$('filmApprove').textContent='Согласовать · демо';
 $('filmWorldLabel').textContent='КАЛЕНДАРЬ';$('filmWorldText').textContent=worldText.calendar[1];
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
$('filmWorldOptions').addEventListener('click',event=>{
 const b=event.target.closest?.('[data-film-world]');if(!b||!worldText[b.dataset.filmWorld])return;
 pauseInteraction();const value=worldText[b.dataset.filmWorld];$('filmWorldLabel').textContent=value[0];$('filmWorldText').textContent=value[1];
 root.querySelectorAll('[data-film-world]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn===b)));
});
$('filmVoice').addEventListener('click',()=>{
 voice=!voice;$('filmVoice').setAttribute('aria-pressed',String(voice));
 $('filmVoice').innerHTML=voice?'◉ <span>Без звука</span>':'◌ <span>Слушать</span>';
 if(voice)narrate();else stopVoice();
});
$('filmPause').addEventListener('click',()=>setPlaying(!playing));
$('filmNext').addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:film-next')));
$('filmBack').addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:film-back')));
$('filmExit').addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:film-skip')));
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);stopVoice()}else if(active>=0){schedule()}});
window.addEventListener('pagehide',()=>{clearTimeout(timer);stopVoice()});
window.SEYVEO_WELCOME_TOUR=Object.freeze({render,reset,count:scenes.length});
reset();
})();