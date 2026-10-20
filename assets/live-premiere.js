/* SEYVEO · Living Premiere. Automated demonstration over REAL application UI.
 * Safe by design: only click read-only navigation and analytics filters.
 * Never touch records, microphone, permissions, correspondence or payments. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const $q=selector=>document.querySelector(selector);
/* 21.10.2026 · Approved nine-scene, ~67-second presentation.
 * Scenes use read-only navigation and explicitly marked fictional examples.
 * A recorded narrator is NOT connected yet; only the optional brand sound plays.
 * Index: label, title, caption, highlight target, read-only navigation, example, ms. */
const beats=[
 ['01 · ЗНАКОМСТВО','Всё важное — рядом.','Я Сэйви. Покажу, как SEYVEO помогает наводить порядок в делах и освобождать время для жизни.','#orb','',0,7000],
 ['02 · ОДНА ПРОСЬБА','Просто скажи, что нужно.','«Напомни завтра позвонить маме». В учебном примере просьба превращается в понятное дело.','#assistantButton','',1,7300],
 ['03 · МОЙ ДЕНЬ','Дела не теряются.','Календарь и Блокнот собирают встречи, планы и важные мысли в одном месте.','#calendarPage','calendar',2,8000],
 ['04 · МОЙ МИР','Есть место для личного.','Близкие, важные даты, здоровье и забота — отдельно от рабочих вопросов.','#homeWorldTrigger','world',3,7000],
 ['05 · СВОЁ ДЕЛО','А если у тебя бизнес?','В учебной истории три клиента ждут ответа. Сэйви помогает заметить проблему и выбрать шаг.','#dynamic','home',4,8000],
 ['06 · СОГЛАСОВАНИЕ','Решение — за тобой.','Проверяешь предложение и даёшь разрешение. Исполнение сейчас показано только в примере.','#dynamic','',5,7400],
 ['07 · КАРТИНА БИЗНЕСА','Понимай, что происходит.','Доходы, расходы и источники обращений — в наглядной картине. Показатели учебные.','#navPicture','picture',6,7900],
 ['08 · ПРАВИЛА ДОВЕРИЯ','Ты задаёшь правила.','Сначала рекомендации. Позже — больше самостоятельности в пределах твоих разрешений.','#orb','home',7,7100],
 ['09 · SEYVEO','Один помощник. Растёт вместе с тобой.','LIFE — личные дела. PRO — бизнес. MAX — сложные процессы. Три уровня одной развивающейся системы.','#orb','home',8,7600]
];
const samples=[
 null,
 ['ПРОСЬБА · УЧЕБНЫЙ ПРИМЕР','Завтра — позвонить маме','Так может выглядеть подготовленное напоминание. На устройстве ничего не создано.'],
 ['КАЛЕНДАРЬ + БЛОКНОТ · ПРИМЕР','Завтра, 10:30 · важный звонок','Событие и заметка показаны для знакомства. Личные записи не изменяются.'],
 ['ЛИЧНОЕ ПРОСТРАНСТВО','Люди, здоровье, забота','Разделы приложения развиваются; дополнительные подключения и защита пока в работе.'],
 ['КЛИЕНТЫ · УЧЕБНЫЙ ПРИМЕР','Три обращения ждут ответа','Система могла бы предложить черновики ответов. Реальная почта и CRM не подключены.'],
 ['СОГЛАСОВАНИЕ · УЧЕБНЫЙ ПРИМЕР','Предложение одобрено в примере','Никаких сообщений не отправлено. Настоящие действия потребуют разрешений и проверки результата.'],
 ['КАРТИНА БИЗНЕСА · ДЕМО','Откуда приходят обращения?','Сайт, карты, соцсети. Цифры на экране — учебные, не аналитика реального бизнеса.'],
 ['РЕКОМЕНДАЦИИ / АВТОНОМИЯ','Свобода под твоим контролем','Расширенные самостоятельные действия и отчётность ещё разрабатываются.'],
 ['ОДНО ПРИЛОЖЕНИЕ · ТРИ УРОВНЯ','LIFE / PRO / MAX','Разные возможности по мере роста потребностей. Подписки и цены пока не объявлены.']
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
 const mark=host.querySelector('.live-mark-spot');
 const node=selector?$q(selector):null;
 const r=node?.getBoundingClientRect();
 const vp=window.visualViewport;
 const visibleTop=Math.max(0,vp?.offsetTop||0);
 const visibleBottom=visibleTop+(vp?.height||innerHeight);
 if(!r||r.width<5||r.height<5||r.bottom<=visibleTop||r.top>=visibleBottom){
  mark.hidden=true;return;
 }
 mark.hidden=false;
 const x=Math.max(6,r.left-6),y=Math.max(visibleTop+6,r.top-6);
 Object.assign(mark.style,{
  left:x+'px',top:y+'px',
  width:Math.max(0,Math.min(innerWidth-x-6,r.width+12))+'px',
  height:Math.max(0,Math.min(visibleBottom-y-6,r.height+12))+'px'
 });
}
function example(n){
 const box=host?.querySelector('.live-example');if(!box)return;
 box.hidden=!n;
 box.replaceChildren();
 if(!n)return;
 const [tag,title,copy]=samples[n];
 const label=document.createElement('span');label.className='live-label';label.textContent=tag;
 const h=document.createElement('strong');h.textContent=title;
 const p=document.createElement('p');p.textContent=copy;
 box.append(label,h,p);
}
function show(next){
 if(!live)return;
 stopTimers();rev++;
 if(next>=beats.length){finish(false);return}
 index=next;
 const [num,title,copy,target,action,sampleId,ms]=beats[next];
 host.querySelector('.live-index').textContent=(next+1)+' / '+beats.length;
 host.querySelector('.live-heading').textContent=title;
 host.querySelector('.live-text').textContent=copy;
 host.querySelector('.live-progress-inner').style.width=((next+1)*100/beats.length)+'%';
 example(sampleId);
 spotlight(target==='#dynamic'?null:
  action==='calendar'?'#homeWorldPopover [data-world-space="calendar"]':target);
 if(action){
  delay(1050,()=>{
   navigate(action);
   delay(action==='calendar'?1450:520,
    ()=>spotlight(target==='#dynamic'?null:
      action==='calendar'?'#calendarPage .calendar-header':target));
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
 '<div class="live-mark-spot" hidden></div>',
 '<section class="live-caption" aria-live="polite"><span class="live-meta">SEYVEO · ПРЕЗЕНТАЦИЯ</span>',
 '<strong class="live-heading"></strong><p class="live-text"></p>',
 '<div class="live-example" hidden></div>',
 '<div class="live-foot"><span>Учебные примеры · без сохранения</span><button type="button" class="live-pause">Пауза</button></div>',
 '<div class="live-progress"><div class="live-progress-inner"></div></div></section>'
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