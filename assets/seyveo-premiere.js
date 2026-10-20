/* SEYVEO · Premiere v1: ONE standalone film. No page clicks, no owner data. */
(()=>{'use strict';
 const entry=document.getElementById('openWelcomeDemo');
 const sceneData=[
  {label:'01 · ЗНАКОМСТВО',title:'Время для того, что важно.',copy:'Привет! Я Сэйви. SEYVEO создаётся, чтобы помогать с повседневными делами и освобождать время для жизни.',ms:7000,visual:'<div class="premiere-orb"><img src="assets/plasma-signature.svg" alt=""></div><div class="premiere-quiet">Один помощник · жизнь и дело</div>'},
  {label:'02 · ОДНА ПРОСЬБА',title:'Достаточно просто попросить.',copy:'«Напомни завтра позвонить маме». Помощник подготовит понятное действие, а ты решишь, что делать дальше. Сейчас это учебный пример.',ms:7300,visual:'<div class="premiere-example"><span class="premiere-chip">УЧЕБНЫЙ ПРИМЕР</span><p class="premiere-quote">«Напомни завтра позвонить маме»</p><div class="premiere-line"><span>◷</span><div><small>ЗАВТРА</small><strong>Позвонить маме</strong></div><span class="premiere-mark">✓</span></div></div>'},
  {label:'03 · МОЙ ДЕНЬ',title:'Важное не потеряется.',copy:'Календарь и Блокнот уже есть в нашем прототипе. В будущем Сэйви поможет связывать записи, встречи и планы между собой.',ms:8000,visual:'<div class="premiere-pair"><div class="premiere-tile"><span class="premiere-chip">КАЛЕНДАРЬ · ПРИМЕР</span><strong class="premiere-date">22</strong><small>Октябрь · четверг</small><p>10:30 · Важный звонок</p></div><div class="premiere-tile"><span class="premiere-chip">БЛОКНОТ · ПРИМЕР</span><strong>Хорошая идея</strong><p>Записать мысль.<br>Вернуться к ней завтра.</p></div></div>'},
  {label:'04 · МОЙ МИР',title:'Личное — на своём месте.',copy:'Близкие, важные даты, здоровье и забота собраны в личном пространстве. Дополнительная защита и подключения ещё разрабатываются.',ms:7000,visual:'<div class="premiere-world"><div><span>◎</span><strong>Люди и связи</strong></div><div><span>♡</span><strong>Здоровье</strong></div><div><span>✧</span><strong>Забота</strong></div></div><p class="premiere-quiet">Личное отдельно от рабочих задач</p>'},
  {label:'05 · СВОЁ ДЕЛО',title:'А если у тебя бизнес?',copy:'В учебной истории три клиента ждут ответа. Сэйви должен помочь заметить это и предложить следующий шаг. Настоящая CRM пока не подключена.',ms:8000,visual:'<div class="premiere-example"><span class="premiere-chip">УЧЕБНАЯ СИТУАЦИЯ</span><strong class="premiere-large">3 обращения</strong><p>Ждут внимания</p><div class="premiere-rows"><span>Запрос клиента 01 <b>новый</b></span><span>Запрос клиента 02 <b>новый</b></span><span>Запрос клиента 03 <b>новый</b></span></div></div>'},
  {label:'06 · СОГЛАСОВАНИЕ',title:'Решение остаётся за тобой.',copy:'Сэйви предложит черновик. Ты проверишь его и дашь разрешение. Сейчас показ учебный: никаких сообщений не отправляется.',ms:7400,visual:'<div class="premiere-example"><span class="premiere-chip">КОНЦЕПЦИЯ · БЕЗ ОТПРАВКИ</span><div class="premiere-step"><span>01</span><strong>Предложение подготовлено</strong></div><div class="premiere-step"><span>02</span><strong>Решение принимает человек</strong></div><div class="premiere-result">✓ Ничего не отправлено · учебный показ</div></div>'},
  {label:'07 · КАРТИНА БИЗНЕСА',title:'Цифры становятся понятнее.',copy:'Доходы, расходы и обращения — в одном месте. Пока показатели на экране вымышленные; источники данных будут подключаться только с разрешения.',ms:7900,visual:'<div class="premiere-example"><span class="premiere-chip">ДЕМОНСТРАЦИОННЫЕ ПОКАЗАТЕЛИ</span><div class="premiere-stats"><span><small>Доходы</small><strong>240 000 ₽</strong></span><span><small>Расходы</small><strong>98 000 ₽</strong></span></div><div class="premiere-bars"><i style="--h:48%"></i><i style="--h:63%"></i><i style="--h:55%"></i><i style="--h:82%"></i><i style="--h:69%"></i><i style="--h:91%"></i><i style="--h:76%"></i></div><p class="premiere-small">Все цифры приведены для примера</p></div>'},
  {label:'08 · ПРАВИЛА ДОВЕРИЯ',title:'Ты задаёшь правила.',copy:'Сначала помощник предлагает и объясняет. Более самостоятельная работа в пределах разрешений — следующий этап разработки.',ms:7100,visual:'<div class="premiere-pair"><div class="premiere-tile"><span class="premiere-chip">РЕЖИМ</span><strong>Рекомендации</strong><p>Объяснить · предложить · согласовать</p></div><div class="premiere-tile"><span class="premiere-chip">В ПЛАНАХ</span><strong>Автономия</strong><p>Действия по правилам и отчёт о результате</p></div></div>'},
  {label:'09 · SEYVEO',title:'Один помощник. Вместе с тобой.',copy:'LIFE — личные дела. PRO — развитие бизнеса. MAX — более сложные процессы. Три уровня одной системы. Подписки пока не продаются.',ms:7600,visual:'<div class="premiere-levels"><div><strong>LIFE</strong><span>Для жизни</span></div><div><strong>PRO</strong><span>Для дела</span></div><div><strong>MAX</strong><span>Для процессов</span></div></div><div class="premiere-end"><img src="assets/official-logo.svg" alt=""><strong>SEYVEO</strong><small>IT · AI · AUTOMATION</small></div>'}
 ];
 let film=null,scene=-1,timeout=null,remaining=0,started=0,paused=false,closed=true,onFinish=null,lastFocus=null;
 function stopClock(){if(timeout!==null){clearTimeout(timeout);timeout=null}}
 function render(index){
  if(closed||!film)return;
  if(index>=sceneData.length){finish(false);return}
  scene=index;
  const item=sceneData[index];
  const stage=film.querySelector('.premiere-stage');
  const key=film.querySelector('.premiere-key'),title=film.querySelector('.premiere-title'),copy=film.querySelector('.premiere-copy');
  stage.innerHTML=item.visual;key.textContent=item.label;title.textContent=item.title;copy.textContent=item.copy;
  film.querySelector('.premiere-count').textContent=(index+1)+' / '+sceneData.length;
  film.querySelectorAll('.premiere-dot').forEach((dot,i)=>{dot.classList.toggle('active',i===index);dot.classList.toggle('passed',i<index)});
  remaining=item.ms;paused=false;
  film.querySelector('.premiere-pause').textContent='Пауза';
  resumeClock();
 }
 function resumeClock(){if(closed||paused||scene<0)return;stopClock();started=Date.now();timeout=setTimeout(()=>render(scene+1),remaining)}
 function finish(skipped){
  if(closed)return;
  closed=true;stopClock();
  const cb=onFinish;onFinish=null;
  const focus=lastFocus;lastFocus=null;
  const node=film;film=null;
  if(node?.open)node.close();node?.remove();
  if(focus?.isConnected)try{focus.focus({preventScroll:true})}catch{}
  if(typeof cb==='function')try{cb(skipped)}catch{}
 }
 function start(options={}){
  if(!closed||document.querySelector('dialog[open]')||window.SEYVEO_FIRST_HELP?.isActive())return false;
  closed=false;paused=false;onFinish=options.onFinish||null;lastFocus=document.activeElement;
  const node=document.createElement('dialog');film=node;node.className='seyveo-premiere';
  node.setAttribute('aria-label','Презентация SEYVEO · 9 сцен');node.setAttribute('aria-modal','true');
  node.innerHTML='<div class="premiere-shell"><header class="premiere-top"><div class="premiere-brand"><img src="assets/official-logo.svg" alt=""><span>SEYVEO<small>IT · AI · AUTOMATION</small></span></div><div class="premiere-top-actions"><span class="premiere-count">1 / 9</span><button type="button" class="premiere-exit">Закрыть</button></div></header><main class="premiere-middle"><div class="premiere-stage" aria-hidden="true"></div><div class="premiere-narrative" aria-live="polite"><span class="premiere-key"></span><h2 class="premiere-title"></h2><p class="premiere-copy"></p></div></main><footer class="premiere-bottom"><div class="premiere-dots" aria-hidden="true">'+sceneData.map(()=>'<span class="premiere-dot"></span>').join('')+'</div><div class="premiere-foot"><span>Презентация возможностей · учебные примеры</span><button type="button" class="premiere-pause">Пауза</button></div></footer></div>';
  document.body.append(node);
  try{node.showModal()}catch{closed=true;film=null;node.remove();onFinish=null;return false}
  node.querySelector('.premiere-exit').addEventListener('click',()=>finish(true));
  node.querySelector('.premiere-pause').addEventListener('click',()=>{
   if(closed)return;
   if(paused){paused=false;node.querySelector('.premiere-pause').textContent='Пауза';resumeClock()}
   else{remaining=Math.max(0,remaining-(Date.now()-started));paused=true;stopClock();node.querySelector('.premiere-pause').textContent='Продолжить'}
  });
  node.addEventListener('cancel',e=>{e.preventDefault();finish(true)});
  render(0);
  node.querySelector('.premiere-exit').focus({preventScroll:true});
  return true;
 }
 document.addEventListener('visibilitychange',()=>{
  if(!film||closed||document.visibilityState!=='hidden'||paused)return;
  remaining=Math.max(0,remaining-(Date.now()-started));paused=true;stopClock();
  film.querySelector('.premiere-pause').textContent='Продолжить';
 });
 window.addEventListener('pagehide',()=>{if(!closed)finish(true)});
 entry?.addEventListener('click',()=>start());
 window.SEYVEO_PREMIERE=Object.freeze({start,stop:()=>finish(true),isActive:()=>!closed,count:sceneData.length});
})();