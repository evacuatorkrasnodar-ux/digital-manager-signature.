/* SEYVEO · Living Premiere. Automated demonstration over REAL application UI.
 * Safe by design: only click read-only navigation and analytics filters.
 * Never touch records, microphone, permissions, correspondence or payments. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const $q=selector=>document.querySelector(selector);
const beats=[
 ['01 · ЗНАКОМСТВО','Привет! Я Феликс.','Я помогу управлять делами и находить время для жизни.','#orb','',0,5400],
 ['02 · ПОМОЩНИК','Одна кнопка.','Просто расскажи, что хочешь сделать. Я помогу превратить просьбу в дело.','#assistantButton','',0,4200],
 ['03 · РЕКОМЕНДАЦИИ','Замечать главное.','Три клиента ждут ответа. Посмотри, как выглядит моя рекомендация.','#dynamic','',1,5400],
 ['04 · СОГЛАСОВАНИЕ','Решение остаётся за тобой.','Я подготовил черновики. Согласовываем действие — только в учебном примере.','#dynamic','',2,4600],
 ['05 · МОЙ МИР','А здесь всё личное.','Календарь, блокнот, здоровье, забота и важные люди.','#homeWorldTrigger','world',0,4400],
 ['06 · КАЛЕНДАРЬ','Умный календарь.','Настоящий раздел уже перед тобой. Встречи, планы и важные даты.','#calendarPage','calendar',3,5000],
 ['07 · БЛОКНОТ','Мысли не теряются.','Сохраняй идеи, тексты и заметки. Умные планы — следующий этап.','#homeWorldTrigger','home',4,4300],
 ['08 · ЗАБОТА','Личное под защитой.','Здоровье, отдых, близкие и секретные номера. Защиту ещё разрабатываем.','#homeWorldTrigger','world',5,4900],
 ['09 · БИЗНЕС','Картина бизнеса.','Открываем настоящий экран с графиками и показателями.','#navPicture','picture',0,4700],
 ['10 · ГРАФИКИ','Цифры оживают.','Я покажу неделю и месяц. Всё на учебных показателях.','#pictureBars','period',0,5200],
 ['11 · КЛИЕНТЫ','Откуда приходят заказы?','Сайт, карты, соцсети. В будущем соберём источники в одну картину.','#pictureSources','',6,4400],
 ['12 · ПОРУЧЕНИЯ','Не только советы.','Заметил → предложил → согласовал → исполнил по правилам.','#navTasks','home',7,4700],
 ['13 · ЗАКОНЫ','Важное не пройдёт мимо.','Проверка официальных изменений, документы и согласованная отправка — в планах.','#orb','',8,4700],
 ['14 · ОБЩЕНИЕ','Не всё в жизни — работа.','Можно придумать подарок, спланировать отдых или просто поболтать.','#orb','',9,4300],
 ['15 · ВСЕ УСТРОЙСТВА','Один SEYVEO.','Телефон, планшет, Windows. Мы создаём единый рабочий кабинет.','#orb','',10,4300],
 ['16 · БУДУЩЕЕ','Мы только начинаем.','SEYVEO развивается. Больше интеллекта, меньше рутины, больше жизни.','#orb','home',11,5800]
];
const samples=[
 null,
 ['РЕКОМЕНДАЦИЯ · ДЕМО','Три обращения ждут ответа','12 запросов сегодня. Подготовлено 3 черновика.','Подробнее','Согласовать'],
 ['УЧЕБНОЕ СОГЛАСОВАНИЕ','✓ Действие согласовано','Ничего не отправлено. Это только показ будущей работы.','Готово','Под контролем'],
 ['КАЛЕНДАРЬ · ПРИМЕР','Завтра, 10:30','Напомнить о звонке клиенту. Ни одно событие не записано.','Встречи','Напоминания'],
 ['БЛОКНОТ · ПРИМЕР','Идея для бизнеса','Проверить спрос и расходы. Сохранить мысль, подготовить план.','Запись','План'],
 ['МОЙ МИР · БУДУЩЕЕ','Только для тебя','Защита личного, контакты, здоровье и забота.','Секреты','Близкие'],
 ['КЛИЕНТЫ · ПРИМЕР','Где новые обращения?','Карты — 8 · Сайт — 5 · Соцсети — 3.','Сравнить','Проверить'],
 ['ПОРУЧЕНИЯ · БУДУЩЕЕ','Поручение подготовлено','Заметил · предложил · согласовал · исполнил.','Правила','Отчёт'],
 ['ЗАКОНЫ · БУДУЩЕЕ','Изменение требований','Проверка официального источника → подготовка документа → согласование.','Проверить','Документ'],
 ['ЛИЧНОЕ · БУДУЩЕЕ','Можно просто поговорить','Идея, подарок, отдых, забота о себе.','Поболтаем','Отдых'],
 ['ВСЕ УСТРОЙСТВА · БУДУЩЕЕ','SEYVEO всегда рядом','iOS · Android · планшеты · Windows. Синхронизация планируется.','Мобильный','Рабочий стол'],
 ['SEYVEO · AI AUTOMATION','Мы только начинаем','Ты выбираешь направление. SEYVEO помогает двигаться вперёд.','Больше жизни','Меньше рутины']
];
let host=null,live=false,paused=false,index=-1,rev=0,timer=0,extras=[],oldHash='',preview=false,done=null,sound=null;
function delay(ms,fn){const id=rev;extras.push(setTimeout(()=>{if(live&&!paused&&rev===id)fn()},ms))}
function stopTimers(){clearTimeout(timer);timer=0;extras.forEach(clearTimeout);extras=[]}
function safeTap(el){if(el&&el.isConnected&&!el.disabled&&!el.closest('dialog'))el.click()}
function home(){safeTap($('navHome'));if(!$('homeWorldPopover')?.hidden)safeTap($('homeWorldTrigger'))}
function cue(){
 try{
  if(localStorage.getItem('seyveo-signature-sound-v1')==='off'||localStorage.getItem('seyveo-discreet-mode-v1')==='on')return;
  sound=new Audio('assets/seyveo-first-awakening-cinema.wav?v=1');sound.volume=.55;
  const p=sound.play();if(p&&p.catch)p.catch(()=>{});
 }catch{}
}
function stopSound(){try{sound?.pause()}catch{}sound=null}
function navigate(kind){
 if(kind==='home'){home();return}
 if(kind==='world'){home();delay(220,()=>safeTap($('homeWorldTrigger')));return}
 if(kind==='calendar'){
  if($('homePage')?.hidden)home();
  if($('homeWorldPopover')?.hidden)safeTap($('homeWorldTrigger'));
  delay(950,()=>safeTap($q('#homeWorldPopover [data-world-space="calendar"]')));
  return;
 }
 if(kind==='picture'){safeTap($('navPicture'));return}
 if(kind==='period'){
  if($('picturePage')?.hidden)safeTap($('navPicture'));
  delay(700,()=>safeTap($q('[data-picture-period="week"]')));
  delay(2450,()=>safeTap($q('[data-picture-period="month"]')));
 }
}
function spotlight(selector){
 if(!host)return;
 const mark=host.querySelector('.live-mark-spot'),pointer=host.querySelector('.live-virtual-tap');
 const node=$q(selector),r=node?.getBoundingClientRect();
 if(!r||r.width<5||r.height<5||r.bottom<1||r.top>innerHeight){
  mark.hidden=true;pointer.hidden=true;return;
 }
 mark.hidden=false;pointer.hidden=false;
 const x=Math.max(6,r.left-7),y=Math.max(6,r.top-7);
 Object.assign(mark.style,{left:x+'px',top:y+'px',width:Math.min(innerWidth-12,r.width+14)+'px',height:Math.min(innerHeight-12,r.height+14)+'px'});
 const px=Math.min(innerWidth-18,Math.max(16,r.left+r.width*.72));
 const py=Math.min(innerHeight-18,Math.max(16,r.top+r.height*.6));
 pointer.style.transform='translate3d('+px+'px,'+py+'px,0)';
 pointer.classList.remove('is-clicking');
 delay(700,()=>{pointer.classList.add('is-clicking');delay(280,()=>pointer.classList.remove('is-clicking'))});
}
function example(n){
 const box=host?.querySelector('.live-example');if(!box)return;
 box.hidden=!n;
 if(!n){box.replaceChildren();return}
 const [tag,title,copy,left,right]=samples[n];
 box.replaceChildren();
 const label=document.createElement('span');label.className='live-label';label.textContent=tag;
 const h=document.createElement('strong');h.textContent=title;
 const p=document.createElement('p');p.textContent=copy;
 const choices=document.createElement('div');choices.className='live-chips';
 for(const name of [left,right]){const x=document.createElement('span');x.textContent=name;choices.append(x)}
 box.append(label,h,p,choices);
}
function show(next){
 if(!live)return;
 stopTimers();rev++;
 if(next>=beats.length){finish(false);return}
 index=next;
 const [num,title,copy,target,action,sampleId,ms]=beats[next];
 host.querySelector('.live-index').textContent=num+' · '+(next+1)+' / '+beats.length;
 host.querySelector('.live-heading').textContent=title;
 host.querySelector('.live-text').textContent=copy;
 host.querySelector('.live-progress-inner').style.width=((next+1)*100/beats.length)+'%';
 example(sampleId);
 spotlight(sampleId&&target==='#dynamic'?'.live-example':
  action==='calendar'?'#homeWorldPopover [data-world-space="calendar"]':target);
 if(action){
  delay(1050,()=>{
   navigate(action);
   delay(action==='calendar'?1450:520,
    ()=>spotlight(action==='calendar'?'#calendarPage .calendar-header':target));
  });
 }
 timer=setTimeout(()=>show(next+1),ms);
}
function finish(skipped){
 if(!live)return;
 stopTimers();rev++;live=false;stopSound();
 document.documentElement.classList.remove('seyveo-showcase-running');
 host?.remove();host=null;
 home();
 if(preview&&oldHash==='#manage')safeTap($('navManage'));
 if(preview&&oldHash==='#picture')safeTap($('navPicture'));
 const callback=done;done=null;
 if(callback)try{callback(skipped)}catch{}
}
function start(options={}){
 if(live||document.querySelector('dialog[open]')||window.SEYVEO_FIRST_HELP?.isActive())return false;
 live=true;paused=false;preview=!!options.preview;oldHash=options.returnHash||'';done=options.onFinish||null;
 index=-1;rev++;
 home();
 host=document.createElement('div');host.className='seyveo-live-showcase';
 host.setAttribute('role','region');host.setAttribute('aria-label','Автоматическая демонстрация настоящего интерфейса SEYVEO');
 host.innerHTML=[
 '<div class="live-top"><span class="live-brand">SEYVEO<small>AI AUTOMATION</small></span>',
 '<span class="live-index"></span><button type="button" class="live-exit">Пропустить</button></div>',
 '<div class="live-mark-spot" hidden></div><div class="live-virtual-tap" hidden><span></span></div>',
 '<div class="live-example" hidden></div>',
 '<div class="live-caption" aria-live="polite"><span class="live-meta">ФЕЛИКС · ЗНАКОМСТВО</span>',
 '<strong class="live-heading"></strong><p class="live-text"></p>',
 '<div class="live-foot"><span>♪ SEYVEO · титры</span><button type="button" class="live-pause">Пауза</button></div></div>',
 '<div class="live-progress"><div class="live-progress-inner"></div></div>'
 ].join('');
 document.body.append(host);
 document.documentElement.classList.add('seyveo-showcase-running');
 host.querySelector('.live-exit').addEventListener('click',()=>finish(true));
 host.querySelector('.live-pause').addEventListener('click',()=>{
  paused=!paused;const b=host.querySelector('.live-pause');b.textContent=paused?'Продолжить':'Пауза';
  if(paused){stopTimers();stopSound()}else show(index);
 });
 cue();show(0);return true;
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&live&&!paused){paused=true;stopTimers();stopSound();const b=host?.querySelector('.live-pause');if(b)b.textContent='Продолжить'}
});
window.SEYVEO_LIVE_SHOWCASE=Object.freeze({start,stop:()=>finish(true),isActive:()=>live});
})();