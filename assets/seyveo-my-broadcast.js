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
 const SEEN_KEY='seyveo.my-broadcast.onboarding-seen.v3';
 const PREVIOUS_SEEN_KEY='seyveo.my-broadcast.onboarding-seen.v2';
 const PROFILE_KEY='seyveo-first-acquaintance-v1';
 const PROFILE_SECTIONS={
  life:{title:'Что тебе нравится?',description:'Выбери то, что близко именно тебе. Всё необязательно.',
   key:'lifeInterests',options:[['music','Музыка'],['films','Кино'],['books','Книги'],
    ['travel','Путешествия'],['animals','Животные'],['nature','Природа'],
    ['sport','Спорт'],['food','Кулинария'],['tech','Технологии'],['art','Творчество']]},
  help:{title:'В чём тебе помогать?',description:'Я буду лучше понимать, когда предложить помощь.',
   key:'assistanceNeeds',options:[['plans','Дела и планы'],['reminders','Напоминания'],
    ['learning','Обучение'],['home','Дом и быт'],['family','Семья'],
    ['wellness','Забота о себе'],['creative','Идеи и творчество']]},
  talk:{title:'Как нам общаться?',description:'Выбери привычный для тебя стиль. Его всегда можно изменить.',
   key:'conversationStyle',single:true,options:[['balanced','По ситуации'],
    ['brief','Коротко и по делу'],['detailed','С объяснениями']]}
 };
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
 const readProfile=()=>{try{return JSON.parse(read(PROFILE_KEY)||'null')||{}}catch{return {}}};
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
 let profile=readProfile(),introStep='name',profileSection=null;
 let onboarding=!qaSkip&&(reviewIntro||
  (read(SEEN_KEY)!=='1'&&read(PREVIOUS_SEEN_KEY)!=='1'))&&
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
   <p class="sv-broadcast-eyebrow" id="svBroadcastStepLabel">СЭЙВИ · ЗНАКОМСТВО</p>
   <h2 id="svBroadcastTitle" tabindex="-1">Привет! Давай знакомиться</h2>
   <p id="svBroadcastExplainer" class="sv-broadcast-description">Меня зовут Сэйви. Друзья зовут просто Сэй. А как обращаться к тебе?</p>
   <div id="svBroadcastNamePanel" class="sv-broadcast-name-panel">
    <label for="svBroadcastName">Твоё имя</label>
    <input id="svBroadcastName" type="text" autocomplete="given-name" maxlength="60" enterkeyhint="next" placeholder="Например, Роман">
    <p>Можно пропустить. Потом скажи: «Сэйви, запомни моё имя».</p>
   </div>
   <div id="svBroadcastInterestsPanel" hidden>
    <div class="sv-broadcast-topic-grid" role="group" aria-label="Темы моего эфира"></div>
    <label class="sv-broadcast-awake"><input type="checkbox" id="svBroadcastAwake"><span>Не гасить экран во время эфира</span></label>
    <p class="sv-broadcast-awake-note">Только на поддерживаемых устройствах, пока приложение открыто.</p>
   </div>
   <div id="svBroadcastProfileMenu" class="sv-broadcast-profile-menu" hidden>
    <button type="button" data-sv-profile="life"><span>♡</span><strong>Моя жизнь</strong><small>Увлечения и интересы</small><b aria-hidden="true">›</b></button>
    <button type="button" data-sv-profile="help"><span>✧</span><strong>Чем мне помочь</strong><small>Повседневные задачи</small><b aria-hidden="true">›</b></button>
    <button type="button" data-sv-profile="talk"><span>◌</span><strong>Как общаться</strong><small>Твой комфортный стиль</small><b aria-hidden="true">›</b></button>
    <p class="sv-broadcast-fineprint">Только то, что ты сам расскажешь. Ответы остаются на этом устройстве, их можно изменить или удалить.</p>
    <button type="button" id="svBroadcastForgetProfile" class="sv-broadcast-profile-forget">Удалить ответы анкеты</button>
   </div>
   <div id="svBroadcastProfileForm" class="sv-broadcast-profile-form" hidden></div>
   <div class="sv-broadcast-sheet-actions">
    <button type="button" id="svBroadcastLater" class="sv-broadcast-later">Позже</button>
    <button type="button" id="svBroadcastSave" class="sv-broadcast-save">Продолжить</button>
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
 const nameField=overlay.querySelector('#svBroadcastName');
 const namePanel=overlay.querySelector('#svBroadcastNamePanel');
 const interestsPanel=overlay.querySelector('#svBroadcastInterestsPanel');
 const profileMenu=overlay.querySelector('#svBroadcastProfileMenu');
 const profileForm=overlay.querySelector('#svBroadcastProfileForm');
 const stepLabel=overlay.querySelector('#svBroadcastStepLabel');
 const title=overlay.querySelector('#svBroadcastTitle');
 const explainer=overlay.querySelector('#svBroadcastExplainer');
 const laterButton=overlay.querySelector('#svBroadcastLater');
 function renderStep(){
  namePanel.hidden=introStep!=='name';
  interestsPanel.hidden=introStep!=='interests';
  profileMenu.hidden=introStep!=='profile-menu';
  profileForm.hidden=introStep!=='profile-form';
  const section=PROFILE_SECTIONS[profileSection];
  stepLabel.textContent=onboarding?'СЭЙВИ · ЗНАКОМСТВО':
   introStep==='interests'?'СЭЙВИ · МОЁ УТРО':'СЭЙВИ · ОБО МНЕ';
  title.textContent=introStep==='name'?'Привет! Давай знакомиться':
   introStep==='interests'?'О чём рассказывать?':
   introStep==='profile-menu'?'Расскажи о себе':section?.title||'Твои интересы';
  explainer.textContent=introStep==='name'?'Я Сэйви, друзья зовут Сэй. А как мне к тебе обращаться?':
   introStep==='interests'?'Это отдельная настройка «Моего утра». Выбирай темы только если захочешь слушать эфир.':
   introStep==='profile-menu'?'Я буду узнавать тебя постепенно, чтобы помогать именно так, как тебе удобно.':
   section?.description||'';
  saveButton.hidden=introStep==='profile-menu';
  saveButton.textContent=onboarding?'Начнём':introStep==='profile-form'?'Запомнить':'Сохранить';
  laterButton.textContent=introStep==='profile-form'?'Назад':onboarding?'Пока без имени':'Закрыть';
  title.focus({preventScroll:true});
 }
 function showProfileSection(id){
  const section=PROFILE_SECTIONS[id];if(!section)return;
  profileSection=id;profile=readProfile();profileForm.replaceChildren();
  const grid=document.createElement('div');grid.className='sv-broadcast-profile-grid';
  const saved=section.single?[profile[section.key]]:
   (Array.isArray(profile[section.key])?profile[section.key]:[]);
  for(const [value,label] of section.options){
   const row=document.createElement('label');row.className='sv-broadcast-profile-choice';
   const input=document.createElement('input');input.type=section.single?'radio':'checkbox';
   input.name='sv-profile-'+id;input.value=value;input.checked=saved.includes(value);
   const name=document.createElement('span');name.textContent=label;
   const check=document.createElement('span');check.textContent='✓';check.setAttribute('aria-hidden','true');
   row.append(input,name,check);grid.append(row);
  }
  profileForm.append(grid);introStep='profile-form';renderStep();
 }
 profileMenu.addEventListener('click',event=>{
  const option=event.target.closest('[data-sv-profile]');
  if(option)showProfileSection(option.dataset.svProfile);
 });
 overlay.querySelector('#svBroadcastForgetProfile').addEventListener('click',()=>{
  if(!window.confirm('Удалить ответы на анкеты? Имя останется.'))return;
  profile=readProfile();
  for(const section of Object.values(PROFILE_SECTIONS))delete profile[section.key];
  profile.updatedAt=new Date().toISOString();write(PROFILE_KEY,JSON.stringify(profile));
  window.dispatchEvent(new Event('seyveo:profile-changed'));
 });
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
 function openSheet(mode){
  if(!isHome()||!overlay.hidden||document.querySelector('dialog[open]'))return false;
  if(active)stop();
  previousFocus=document.activeElement;
  setSelected(prefs.topics);
  wakeCheckbox.checked=prefs.keepAwake;
  profile=readProfile();
  nameField.value=profile.name||'';
  introStep=onboarding?'name':mode;
  profileSection=null;
  overlay.hidden=false;
  root.classList.add('sv-broadcast-sheet-open');
  renderStep();
  return true;
 }
 const openPreferences=()=>openSheet('interests');
 const openProfile=()=>!onboarding&&openSheet('profile-menu');
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
  const userName=readProfile().name;
  const letters=Array.from(userName?
   `Рада знакомству, ${userName}! Я рядом. ✨`:
   'Рада знакомству! Я рядом. ✨');
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
   if(onboarding){
    const providedName=nameField.value.trim().replace(/\s+/g,' ').slice(0,60);
    profile={...profile,schemaVersion:1,name:providedName||profile.name||'',
     assistantName:'Сэйви',assistantVoice:'female',
     assistantAliases:['Сэйви','Сэй','SEYVEO'],
     updatedAt:new Date().toISOString()};
    write(PROFILE_KEY,JSON.stringify(profile));
    window.dispatchEvent(new Event('seyveo:profile-changed'));
   }else if(introStep==='interests'){
    const topics=validTopics(selected());
    prefs={topics,keepAwake:wakeCheckbox.checked};
    write(PREF_KEY,JSON.stringify(prefs));
   }else if(introStep==='profile-form'){
    const section=PROFILE_SECTIONS[profileSection];
    if(section){
     const values=[...profileForm.querySelectorAll('input:checked')].map(input=>input.value);
     profile={...readProfile(),schemaVersion:1,[section.key]:section.single?
      (values[0]||'balanced'):values,updatedAt:new Date().toISOString()};
     write(PROFILE_KEY,JSON.stringify(profile));
     window.dispatchEvent(new CustomEvent('seyveo:profile-changed',
      {detail:{section:profileSection}}));
     introStep='profile-menu';renderStep();return;
    }
   }
  }
  overlay.hidden=true;
  root.classList.remove('sv-broadcast-sheet-open');
  const wasOnboarding=onboarding;
  onboarding=false;
  write(SEEN_KEY,'1');
  write(PREVIOUS_SEEN_KEY,'1');
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
 saveButton.addEventListener('click',()=>{
  closePreferences({save:true});
 });
 laterButton.addEventListener('click',()=>{
  if(introStep==='profile-form'){
   introStep='profile-menu';renderStep();return;
  }
  closePreferences();
 });
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   event.preventDefault();closePreferences();return;
  }
  if(event.key!=='Tab')return;
  const controls=[...overlay.querySelectorAll('input,button')]
   .filter(item=>!item.disabled&&item.getClientRects().length>0);
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&[first,overlay.querySelector('#svBroadcastTitle')].includes(document.activeElement)){
   event.preventDefault();last.focus();
  }
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
  offer.textContent='♡  Расскажи мне о себе';
  offer.addEventListener('click',()=>openProfile());
  stage.appendChild(offer);
  setTimeout(()=>{offer?.remove();offer=null},22000);
 }
 function nextSuggestion(){
  if(onboarding||active||!overlay.hidden)return null;
  const person=readProfile();
  const missing=Object.values(PROFILE_SECTIONS).some(section=>
   !Object.prototype.hasOwnProperty.call(person,section.key));
  const life=Array.isArray(person.lifeInterests)?person.lifeInterests:[];
  const needs=Array.isArray(person.assistanceNeeds)?person.assistanceNeeds:[];
  const personalAction=life.includes('music')?
   {text:'🎵 Ты рассказывал, что тебе нравится музыка. Заглянем в SEYVEO SOUND?',
    action:{kind:'music',label:'Открыть музыку',icon:'🎵'}}:
   life.includes('art')?
    {text:'✏️ Помню, тебе интересно творчество. Хочешь немного порисовать?',
     action:{kind:'drawing',label:'Порисовать',icon:'✏️'}}:
   needs.includes('plans')?
    {text:'✨ Ты просил помогать с планами. Посмотрим, что на сегодня?',
     action:{kind:'tasks',label:'Мои дела',icon:'✓'}}:null;
  const topics=prefs.topics;
  const favorite=topics.find(topic=>topic!=='news'&&topic!=='music');
  const choices=[
   missing?{text:'♡ Хочешь рассказать немного о себе? Так мне будет легче тебя понимать.',action:{kind:'profile',label:'Расскажу о себе',icon:'♡'}}:null,
   personalAction,
   {text:'☀️ Если захочешь, я могу устроить для тебя небольшое утреннее шоу — с рассказами и музыкой.',action:{kind:'broadcast-preferences',label:'Настроить моё утро',icon:'☀️'}},
   favorite?{text:`✨ Я могу рассказывать о том, что тебе интересно, например: ${labelFor(favorite).toLowerCase()}.`,action:{kind:'broadcast',label:'Послушать',icon:'✨'}}:null,
   {text:'♡ Расскажи, что сейчас важно для тебя. Я запомню только то, что ты сам выберешь.',action:{kind:'profile',label:'Мои анкеты',icon:'♡'}}
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
 window.SEYVEO_BROADCAST=Object.freeze({start,stop,openPreferences,openProfile,
  getPreferences:()=>({topics:[...prefs.topics],keepAwake:prefs.keepAwake}),
  getProfile:()=>({...readProfile()}),
  nextSuggestion,isActive:()=>active,isOnboarding:()=>onboarding,
  rememberName(name){
   const clean=String(name||'').trim().replace(/\s+/g,' ').slice(0,60);
   if(!clean)return false;
   profile={...readProfile(),schemaVersion:1,name:clean,updatedAt:new Date().toISOString()};
   const value=JSON.stringify(profile);
   write(PROFILE_KEY,value);
   if(read(PROFILE_KEY)!==value)return false;
   window.dispatchEvent(new Event('seyveo:profile-changed'));
   return true;
  }});
})();
