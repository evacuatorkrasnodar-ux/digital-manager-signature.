/* SEYVEO · Мой эфир. Consent-first interests and a quiet, text-led morning
 * program. Never invent live headlines, synthesize an unapproved voice, or
 * start music / screen wake lock without a person's tap. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const home=document.getElementById('homePage');
 const stage=document.getElementById('stage');
 if(!home||!stage)return;
 const PREF_KEY='seyveo.my-broadcast.preferences.v1';
 const SEEN_KEY='seyveo.my-broadcast.onboarding-seen.v1';
 const OPTIONS=[
  ['animals','🐾','Животные'],['humor','😄','Юмор'],
  ['music','🎵','Музыка'],['science','🚀','Наука'],
  ['facts','🌍','Интересные факты'],['history','📚','История'],
  ['quotes','💬','Цитаты'],['business','💼','Бизнес'],
  ['sport','🏆','Спорт'],['news','📰','Новости']
 ];
 const DEFAULT_TOPICS=['animals','humor','music','facts'];
 const allowed=new Set(OPTIONS.map(item=>item[0]));
 const params=new URLSearchParams(location.search);
 const qaSkip=params.get('sayvi-intro')==='0';
 const reviewIntro=params.get('broadcast-intro')==='1';
 const read=(key)=>{try{return localStorage.getItem(key)}catch{return null}};
 const write=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
 const validTopics=value=>Array.isArray(value)
  ?[...new Set(value.filter(topic=>allowed.has(topic)))]:[];
 const readPrefs=()=>{
  try{
   const raw=JSON.parse(read(PREF_KEY)||'null');
   if(raw&&Array.isArray(raw.topics))return {
    topics:validTopics(raw.topics),keepAwake:raw.keepAwake===true
   };
  }catch{}
  return {topics:[...DEFAULT_TOPICS],keepAwake:false};
 };
 let prefs=readPrefs();
 let onboarding=!qaSkip&&(reviewIntro||read(SEEN_KEY)!=='1')&&
   (!location.hash||location.hash==='#home');
 if(onboarding)root.classList.add('sv-broadcast-onboarding');
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const isHome=()=>!document.hidden&&!home.hidden&&
  (!location.hash||location.hash==='#home')&&
  !root.classList.contains('seyveo-conversation');
 const noCards=()=>root.classList.contains('sv-home-empty-sphere')&&
  root.classList.contains('sv-home-empty-arrived');

 // This is a Home introduction, not a second dialog that would trigger a
 // route handoff or an unexpected extra sphere animation.
 const overlay=document.createElement('div');
 overlay.id='svBroadcastPreferences';
 overlay.className='sv-broadcast-overlay';
 overlay.hidden=true;
 overlay.innerHTML=`
  <section class="sv-broadcast-sheet" role="dialog" aria-modal="true"
      aria-labelledby="svBroadcastTitle" aria-describedby="svBroadcastExplainer">
   <p class="sv-broadcast-eyebrow">СЭЙВИ · ЗНАКОМСТВО</p>
   <h2 id="svBroadcastTitle" tabindex="-1">Что тебе интересно?</h2>
   <p id="svBroadcastExplainer" class="sv-broadcast-description">Выбери несколько тем. Я подстрою подсказки на главной и твоё утреннее шоу.</p>
   <div class="sv-broadcast-topic-grid" role="group" aria-label="Темы моего эфира"></div>
   <p class="sv-broadcast-fineprint">Новости подключим позже, когда появятся проверенные источники. Пока не будем их выдумывать.</p>
   <label class="sv-broadcast-awake"><input type="checkbox" id="svBroadcastAwake"><span>Не гасить экран во время эфира</span></label>
   <p class="sv-broadcast-awake-note">Работает только на поддерживаемых устройствах, пока приложение открыто.</p>
   <div class="sv-broadcast-sheet-actions">
    <button type="button" id="svBroadcastLater" class="sv-broadcast-later">Позже</button>
    <button type="button" id="svBroadcastSave" class="sv-broadcast-save">Готово</button>
   </div>
  </section>`;
 document.body.appendChild(overlay);
 const grid=overlay.querySelector('.sv-broadcast-topic-grid');
 for(const [id,emoji,title] of OPTIONS){
  const label=document.createElement('label');
  label.className='sv-broadcast-topic';
  const checkbox=document.createElement('input');
  checkbox.type='checkbox';checkbox.value=id;checkbox.name='sv-broadcast-topics';
  const icon=document.createElement('span');icon.textContent=emoji;icon.className='sv-broadcast-topic-emoji';
  icon.setAttribute('aria-hidden','true');
  const caption=document.createElement('span');caption.textContent=title;
  const check=document.createElement('span');check.textContent='✓';
  check.className='sv-broadcast-topic-check';check.setAttribute('aria-hidden','true');
  label.append(checkbox,icon,caption,check);
  grid.appendChild(label);
 }
 const wakeCheckbox=overlay.querySelector('#svBroadcastAwake');
 const saveButton=overlay.querySelector('#svBroadcastSave');
 let previousFocus=null,firstReturnTimer=0,returnTyping=0;
 const returnLine=document.createElement('p');
 returnLine.id='svBroadcastReturnLine';
 returnLine.className='sv-broadcast-return-line';
 returnLine.hidden=true;
 stage.appendChild(returnLine);
 const hasActualCards=()=>{
  const living=document.getElementById('seyveoLivingMoment');
  if(living&&!living.hidden)return true;
  const advice=document.getElementById('dynamic');
  if(advice&&!advice.hidden&&[...advice.children].some(el=>!el.hidden))return true;
  for(const id of ['svSmartStartHome','svcpWorkHomePreview','workTimeline']){
   const item=document.getElementById(id);
   if(item&&!item.hidden)return true;
  }
  const agenda=home.querySelector('.sv-sayvi-handoff-today');
  return !!agenda&&!agenda.hidden;
 };
 const canBroadcast=()=>noCards()&&
  !root.classList.contains('sv-broadcast-first-return')&&!hasActualCards();
 function selected(){return [...grid.querySelectorAll('input:checked')].map(item=>item.value)}
 function setSelected(topics){
  const keys=new Set(topics);
  for(const field of grid.querySelectorAll('input'))field.checked=keys.has(field.value);
 }
 function openPreferences(){
  if(!isHome()||(!onboarding&&!noCards())||
    document.querySelector('dialog[open]'))return false;
  if(active)stop();
  previousFocus=document.activeElement;
  setSelected(prefs.topics);
  wakeCheckbox.checked=prefs.keepAwake;
  overlay.hidden=false;
  root.classList.add('sv-broadcast-sheet-open');
  overlay.querySelector('#svBroadcastTitle').focus({preventScroll:true});
  return true;
 }
 function finishFirstReturn(){
  clearTimeout(firstReturnTimer);firstReturnTimer=0;
  clearTimeout(returnTyping);returnTyping=0;
  returnLine.hidden=true;
  root.classList.remove('sv-broadcast-first-return');
  window.dispatchEvent(new Event('seyveo:broadcast-first-return-ended'));
  if(isHome()&&!hasActualCards()){
   window.dispatchEvent(new Event('seyveo:home-idle-prompt'));
   window.setTimeout(offerAfterSetup,460);
  }
 }
 function writeFirstReturn(){
  if(!root.classList.contains('sv-broadcast-first-return')||!isHome())return;
  window.dispatchEvent(new Event('seyveo:home-idle-prompt'));
  const letters=Array.from('Я запомнила, что тебе интересно. ✨');
  returnLine.textContent='';returnLine.hidden=false;
  let i=0;
  const tick=()=>{
   if(!root.classList.contains('sv-broadcast-first-return'))return;
   if(reduced()){returnLine.textContent=letters.join('');return;}
   if(i>=letters.length)return;
   returnLine.textContent+=letters[i++];
   returnTyping=setTimeout(tick,36);
  };
  returnTyping=setTimeout(tick,480);
 }
 window.addEventListener('seyveo:home-sayvi-arrived',writeFirstReturn);
 function closePreferences({save=false}={}){
  if(overlay.hidden)return;
  if(save){
   const topics=validTopics(selected());
   prefs={topics:topics.length?topics:[...DEFAULT_TOPICS],keepAwake:wakeCheckbox.checked};
   write(PREF_KEY,JSON.stringify(prefs));
  }
  overlay.hidden=true;
  root.classList.remove('sv-broadcast-sheet-open');
  const wasOnboarding=onboarding;
  onboarding=false;
  write(SEEN_KEY,'1');
  if(wasOnboarding)root.classList.add('sv-broadcast-first-return');
  root.classList.remove('sv-broadcast-onboarding');
  // The ORIGINAL miniature flies home once after the choice. If there are
  // already cards, the full-size sphere greets for a few seconds and then
  // returns to its dock slot to give actionable work the room it needs.
  if(wasOnboarding)window.dispatchEvent(new Event('seyveo:broadcast-setup-complete'));
  if(previousFocus?.isConnected&&!wasOnboarding)
   previousFocus.focus({preventScroll:true});
  previousFocus=null;
  if(wasOnboarding){
   firstReturnTimer=setTimeout(finishFirstReturn,5200);
   // No cards: keep the orb on Home, but make the show available sooner.
   window.setTimeout(()=>{
    if(root.classList.contains('sv-broadcast-first-return')&&!hasActualCards())
     finishFirstReturn();
   },2550);
  }
 }
 saveButton.addEventListener('click',()=>closePreferences({save:true}));
 overlay.querySelector('#svBroadcastLater').addEventListener('click',()=>closePreferences());
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   event.preventDefault();closePreferences();return;
  }
  if(event.key!=='Tab')return;
  const controls=[...overlay.querySelectorAll('input,button')]
   .filter(item=>!item.disabled&&!item.hidden);
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 });
 function maybeStartOnboarding(){
  if(!onboarding||!overlay.hidden||!isHome()||
   !root.classList.contains('sv-sayvi-handoff-docked'))return;
  // Wait until her original flight really lands in the dock.
  window.setTimeout(()=>{
   if(onboarding&&overlay.hidden&&isHome())openPreferences();
  },700);
 }
 window.addEventListener('seyveo:cinema-finished',maybeStartOnboarding);
 window.setTimeout(maybeStartOnboarding,1500);

 const stageBox=document.createElement('section');
 stageBox.id='svBroadcastStage';
 stageBox.className='sv-broadcast-stage';
 stageBox.hidden=true;
 stageBox.innerHTML=`
  <div class="sv-broadcast-stage-head"><span id="svBroadcastNow">МОЁ УТРО</span><span id="svBroadcastCount"></span></div>
  <p id="svBroadcastText" class="sv-broadcast-story"></p>
  <div class="sv-broadcast-progress" aria-hidden="true"><span id="svBroadcastProgress"></span></div>
  <div class="sv-broadcast-controls">
   <button type="button" id="svBroadcastPause" aria-label="Пауза" title="Пауза">Ⅱ</button>
   <button type="button" id="svBroadcastNext" aria-label="Следующая история" title="Дальше">↗</button>
   <button type="button" id="svBroadcastSettings" aria-label="Выбрать темы" title="Темы">⚙</button>
   <button type="button" id="svBroadcastStop" aria-label="Завершить эфир" title="Завершить">Завершить</button>
  </div>`;
 stage.appendChild(stageBox);
 const nowLabel=stageBox.querySelector('#svBroadcastNow');
 const count=stageBox.querySelector('#svBroadcastCount');
 const story=stageBox.querySelector('#svBroadcastText');
 const progress=stageBox.querySelector('#svBroadcastProgress');
 const pause=stageBox.querySelector('#svBroadcastPause');
 const next=stageBox.querySelector('#svBroadcastNext');
 let active=false,paused=false,queue=[],index=0,typingTimer=0,advanceTimer=0;
 let displayedIndex=-1,writtenGlyphs=0;
 let epoch=0,ownedMusic=false,screenLock=null,offer=null;
 const editorial={
  animals:[
   '🐙 У осьминога три сердца. Два помогают крови проходить через жабры.',
   '🐧 У пингвинов императорского вида папы согревают яйцо на лапах.',
   '🐝 Пчёлы общаются движениями: их танец помогает найти цветы.'
  ],
  humor:[
   '😄 Почему блокнот не спорит с календарём? У каждого свои записи.',
   '🙂 Решила составить список дел на отдых. Первым пунктом записала: ничего не составлять.',
   '😄 Спросила у часов, как дела. Они ответили: «Идут».'
  ],
  science:[
   '🚀 Свет от Солнца до Земли идёт примерно восемь минут.',
   '🌌 На Луне почти нет атмосферы, поэтому там не услышать звук как на Земле.',
   '🧠 Мозг продолжает обрабатывать звуки даже во время сна.'
  ],
  facts:[
   '🌍 Антарктида — пустыня: там очень мало осадков.',
   '🍌 С точки зрения ботаники банан — ягода.',
   '🪐 Сутки на Венере длиннее её года.'
  ],
  history:[
   '📚 Первые Олимпийские игры древности проводили в Греции.',
   '🗺️ Мореплаватели веками ориентировались по звёздам и береговым ориентирам.'
  ],
  quotes:[
   '💬 «Краткость — сестра таланта». Антон Чехов.',
   '💬 «И нет величия там, где нет простоты, добра и правды». Лев Толстой.'
  ],
  business:[
   '💼 Маленький совет: одно понятное поручение лучше пяти расплывчатых.',
   '📝 Полезно в конце дня записать одно решение, которое сэкономило время.'
  ],
  sport:[
   '🏃 Даже короткая прогулка помогает размяться после долгого сидения.',
   '🏆 В спорте важен не только результат, но и привычка регулярно тренироваться.'
  ],
  news:['📰 Проверенные новости пока не подключены. Я не буду придумывать события и выдавать их за сегодняшние.'],
  music:['🎵 Для музыкальной части выбери любимые файлы в SEYVEO SOUND. Я смогу воспроизвести их с твоего разрешения.']
 };
 const labelFor=topic=>OPTIONS.find(item=>item[0]===topic)?.[2]||'Интересное';
 const safeWeather=()=>{
  const el=document.getElementById('svSayviHomeWeather');
  const value=el&&!el.hidden?String(el.textContent||'').replace(/\s+/g,' ').trim():'';
  return value&&value.length<105?`🌦️ На сегодня: ${value}.`:
   '🌦️ Прогноз пока уточняется. Погоду покажу, когда получу свежие данные.';
 };
 function buildQueue(programNumber){
  const greetings=[
   'Доброе утро! Я Сэйви. Начнём день спокойно — с того, что интересно именно тебе.',
   'Рада тебя видеть! Впереди немного хороших мыслей и твоих любимых тем.',
   'Привет! Устроимся поудобнее. Я приготовила наше маленькое утро.'
  ];
  const list=[{label:'ПРИВЕТ',text:greetings[programNumber%greetings.length],hold:11000},
   {label:'ПОГОДА',text:safeWeather(),hold:11000}];
  const selected=prefs.topics.length?prefs.topics:[...DEFAULT_TOPICS];
  for(let pass=0;pass<3;pass++){
   for(const topic of selected){
    if(topic==='music'&&pass>0)continue;
    if(topic==='news'&&pass>0)continue;
    const items=editorial[topic]||[];
    if(!items.length||pass>=items.length)continue;
    list.push({label:labelFor(topic).toLocaleUpperCase('ru-RU'),
     text:items[(pass+programNumber)%items.length],hold:topic==='music'?16000:12000});
   }
  }
  list.push({label:'ДО ВСТРЕЧИ',text:'Вот и наше маленькое утро. Захочешь продолжить — просто скажи «Сэй» или коснись сферы. Хорошего дня! ✨',hold:13000});
  return list;
 }
 function clearTimers(){clearTimeout(typingTimer);clearTimeout(advanceTimer);typingTimer=advanceTimer=0;}
 function releaseScreen(){try{screenLock?.release()}catch{}screenLock=null;}
 function stop(){
  clearTimers();++epoch;
  if(ownedMusic){
   const audio=document.getElementById('sayviMusicAudio');
   if(audio&&!audio.paused)audio.pause();
  }
  ownedMusic=false;active=false;paused=false;queue=[];
  displayedIndex=-1;writtenGlyphs=0;
  releaseScreen();stageBox.hidden=true;
  root.classList.remove('sv-broadcast-active');
  window.dispatchEvent(new Event('seyveo:broadcast-ended'));
 }
 function writeCurrent(){
  if(!active||paused||!isHome()||!noCards())return;
  const chapter=queue[index];
  if(!chapter){stop();return;}
  clearTimers();const sequence=++epoch;
  nowLabel.textContent=chapter.label;
  count.textContent=`${index+1} / ${queue.length}`;
  progress.style.width=`${Math.round(index/queue.length*100)}%`;
  if(displayedIndex!==index){
   displayedIndex=index;writtenGlyphs=0;story.textContent='';
  }
  const glyphs=Array.from(chapter.text);
  const writeLetter=()=>{
   if(sequence!==epoch||paused||!active)return;
   if(reduced()||writtenGlyphs>=glyphs.length){
    story.textContent=chapter.text;
    writtenGlyphs=glyphs.length;
    advanceTimer=setTimeout(()=>{index++;writeCurrent()},chapter.hold);
    return;
   }
   story.textContent+=glyphs[writtenGlyphs++];
   typingTimer=setTimeout(writeLetter,/[.!?]/.test(glyphs[writtenGlyphs-1])?145:24);
  };
  writeLetter();
 }
 async function requestScreen(){
  if(!prefs.keepAwake||!navigator.wakeLock?.request)return;
  try{screenLock=await navigator.wakeLock.request('screen')}
  catch{screenLock=null}
 }
 function start(options={}){
  if(!isHome()||!canBroadcast()||!overlay.hidden)return false;
  if(active)stop();
  // A user's direct tap on Start is the only moment to request playback.
  // Files belong to their local SEYVEO SOUND library, never a fake stream.
  const userTapped=options.gesture===true&&navigator.userActivation?.isActive!==false;
  const state=window.SEYVEO_MUSIC?.state?.();
  const audio=document.getElementById('sayviMusicAudio');
  if(userTapped&&prefs.topics.includes('music')&&state?.loaded>0&&!state.playing&&audio?.src){
   document.getElementById('sayviMusicPlay')?.click();
   ownedMusic=true;
  }
  if(userTapped&&prefs.keepAwake)void requestScreen();
  const sequence=Number(read('seyveo.my-broadcast.program-number.v1')||0);
  write('seyveo.my-broadcast.program-number.v1',String(sequence+1));
  queue=buildQueue(sequence);index=0;displayedIndex=-1;writtenGlyphs=0;
  paused=false;active=true;
  stageBox.hidden=false;root.classList.add('sv-broadcast-active');
  offer?.remove();offer=null;
  window.dispatchEvent(new Event('seyveo:broadcast-started'));
  writeCurrent();
  return true;
 }
 function togglePause(){
  if(!active)return;
  paused=!paused;
  clearTimers();++epoch;
  pause.textContent=paused?'▶':'Ⅱ';
  pause.setAttribute('aria-label',paused?'Продолжить':'Пауза');
  if(!paused)writeCurrent();
 }
 pause.addEventListener('click',togglePause);
 stageBox.querySelector('#svBroadcastSettings').addEventListener('click',openPreferences);
 next.addEventListener('click',()=>{
  if(!active)return;
  paused=false;pause.textContent='Ⅱ';pause.setAttribute('aria-label','Пауза');
  index++;writeCurrent();
 });
 stageBox.querySelector('#svBroadcastStop').addEventListener('click',stop);
 function offerAfterSetup(){
  if(onboarding||!overlay.hidden||active||!canBroadcast()||!isHome()||offer)return;
  offer=document.createElement('button');
  offer.id='svBroadcastStartOffer';
  offer.type='button';offer.className='sv-broadcast-start-offer';
  offer.textContent='▶  Попробовать моё утро';
  offer.addEventListener('click',()=>start({gesture:true}));
  stage.appendChild(offer);
  setTimeout(()=>{offer?.remove();offer=null},22000);
 }
 function nextSuggestion(){
  if(onboarding||active||!overlay.hidden)return null;
  const topics=prefs.topics;
  const favorite=topics.find(topic=>topic!=='news'&&topic!=='music');
  const choices=[
   {text:'☀️ Хочешь короткое утреннее шоу с твоими любимыми темами?',action:{kind:'broadcast',label:'Начать моё утро',icon:'☀️'}},
   favorite?{text:`✨ Ты любишь тему «${labelFor(favorite)}». Добавим её в твоё утро?`,action:{kind:'broadcast',label:'Мой эфир',icon:'✨'}}:null,
   {text:'🎧 Я могу собрать маленькое утро из фактов, юмора и твоих любимых тем.',action:{kind:'broadcast',label:'Попробовать эфир',icon:'🎧'}},
   {text:'⚙️ Хочешь поменять темы? Выбирай, что тебе интересно, в любое время.',action:{kind:'broadcast-preferences',label:'Мои интересы',icon:'⚙️'}}
  ].filter(Boolean);
  const next=Number(read('seyveo.my-broadcast.hint-index.v1')||0);
  write('seyveo.my-broadcast.hint-index.v1',String((next+1)%choices.length));
  return choices[next%choices.length];
 }
 // Once the first invitation has faded, the existing quiet-thoughts system
 // makes an occasional offer. A solved card keeps its own celebration.
 window.addEventListener('seyveo:route-changed',()=>{
  if(active&&!isHome())stop();
  if(!isHome()&&root.classList.contains('sv-broadcast-first-return'))finishFirstReturn();
  if(!isHome()&&offer){offer.remove();offer=null;}
 });
 window.addEventListener('hashchange',()=>{
  if(active&&!isHome())stop();
  if(!isHome()&&!overlay.hidden)closePreferences();
  if(!isHome()&&root.classList.contains('sv-broadcast-first-return'))finishFirstReturn();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
   if(active)stop();
   releaseScreen();
  }
 });
 window.addEventListener('seyveo:tasks-changed',()=>{if(active&&!noCards())stop()});
 window.addEventListener('seyveo:card-visibility-changed',()=>{if(active&&!noCards())stop()});
 // A user returning to the app may request the show again, but nothing
 // silently restarts the microphone, audio or the daily program.
 window.SEYVEO_BROADCAST=Object.freeze({start,stop,openPreferences,
  getPreferences:()=>({topics:[...prefs.topics],keepAwake:prefs.keepAwake}),
  nextSuggestion,isActive:()=>active,isOnboarding:()=>onboarding});
})();
