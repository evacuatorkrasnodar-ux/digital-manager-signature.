/* SEYVEO · Quiet Presence under the original sphere.
 * A little handwritten onboarding, then rare useful thoughts and honest
 * "soon" possibilities. Never invent emergencies or alter cards/dock/orb. */
(()=>{
 'use strict';
 const home=document.getElementById('homePage');
 const stage=document.getElementById('stage');
 const message=stage?.querySelector('.message');
 const headline=document.getElementById('headline');
 if(!home||!stage||!message||!headline)return;
 const line=document.createElement('p');
 line.id='svHomeLivingLine';
 line.className='sv-home-living-line';
 line.setAttribute('aria-live','off');
 line.hidden=true;
 const mark=document.createElement('span');
 mark.className='sv-home-living-mark';
 mark.setAttribute('aria-hidden','true');
 mark.classList.add('sv-sayvi-symbol');
 const heading=document.createElement('strong');
 heading.className='sv-home-living-heading';
 heading.hidden=true;
 const content=document.createElement('span');
 content.className='sv-home-living-copy';
 const actionRow=document.createElement('span');
 actionRow.className='sv-home-living-actions';
 actionRow.hidden=true;
 actionRow.dataset.revealed='false';
 const actionButton=document.createElement('button');
 actionButton.type='button';
 actionButton.className='sv-home-living-action';
 actionButton.dataset.svSayviAction='';
 const actionIcon=document.createElement('span');
 actionIcon.className='sv-home-living-action-icon';
 actionIcon.setAttribute('aria-hidden','true');
 const actionLabel=document.createElement('span');
 actionLabel.className='sv-home-living-action-label';
 const actionArrow=document.createElement('span');
 actionArrow.className='sv-home-living-action-arrow';
 actionArrow.setAttribute('aria-hidden','true');
 actionArrow.textContent='↗';
 actionButton.append(actionIcon,actionLabel,actionArrow);
 actionRow.append(actionButton);
 const announcement=document.createElement('span');
 announcement.className='sv-home-reply-announcement';
 announcement.setAttribute('role','status');
 announcement.setAttribute('aria-live','polite');
 announcement.setAttribute('aria-atomic','true');
 line.append(mark,heading,content,actionRow,announcement);
 message.insertAdjacentElement('afterend',line);
 // Position short thoughts relative to Sayvi's painted globe, not other text.
 function positionThought(){
  if(line.hidden||home.hidden)return;
  const sphere=document.getElementById('orb');if(!sphere)return;
  // The thought is absolutely positioned INSIDE #stage. Its old top value
  // was measured from #homePage, an entirely different origin. In Safari
  // that pushed "Красота!" below the globe even when the upper slot fit.
  const host=(line.offsetParent||stage).getBoundingClientRect();
  const orb=sphere.getBoundingClientRect();
  // The touch target is larger than the painted glass sphere. Its empty
  // transparent upper rim must not steal the room reserved for Sayvi's text.
  const visualInset=Math.min(45,orb.height*.135);
  const visibleSphereTop=orb.top+visualInset;
  const visibleSphereBottom=orb.bottom-visualInset;
  const online=home.querySelector('.sv-sayvi-home-online')?.getBoundingClientRect();
  const minViewportTop=online?.height?Math.max(30,online.bottom+8):32;
  const clearance=12,minimumTop=minViewportTop-host.top;
  const availableAbove=visibleSphereTop-host.top-minimumTop-clearance;
  line.dataset.svThoughtDensity=availableAbove<116?'compact':'regular';
  const height=Math.max(line.getBoundingClientRect().height,line.scrollHeight);
  if(!height||!orb.height)return;
  const above=visibleSphereTop-host.top-height-clearance;
  // Center the complete thought (copy + action) in the real free gap between
  // “СЭЙВИ · НА СВЯЗИ” and the visible glass, not against the sphere's edge.
  // Bias the thought up by 7px for extra air above the painted sphere.
  let top=Math.max(minimumTop,(minimumTop+above)/2-7),placement='above';
  if(above<minimumTop){
   // Only truly short phones use the lower gap; do not jump there because
   // the safe top margin was a few pixels too conservative.
   // A short phone has less space above the orb. Use the gap beneath it
   // only if the entire thought fits before the weather/shortcut row.
   const weather=document.getElementById('svSayviHomeWeather');
   const weatherTop=weather&&!weather.hidden&&getComputedStyle(weather).display!=='none'
    ?weather.getBoundingClientRect().top:window.innerHeight-105;
   const below=visibleSphereBottom-host.top+16;
   if(weatherTop-host.top-below-height>=12){top=below;placement='below';}
   else{top=minimumTop;placement='no-room';}
  }
  line.dataset.svSpace=placement;
  const value=Math.round(top)+'px';
  if(line.style.getPropertyValue('--sv-thought-top')!==value)
   line.style.setProperty('--sv-thought-top',value);
 }
 const thoughtObserver=new ResizeObserver(()=>requestAnimationFrame(positionThought));
 thoughtObserver.observe(line);
 if(document.getElementById('orb'))thoughtObserver.observe(document.getElementById('orb'));
 window.addEventListener('resize',positionThought);
 window.addEventListener('seyveo:home-sayvi-arrived',()=>requestAnimationFrame(positionThought));
 document.getElementById('orb')?.addEventListener('transitionend',()=>requestAnimationFrame(positionThought));

 const HELLO_MS=3600;
 let ready=false,voicePhase='',voiceTimer=null;
 const root=document.documentElement;
 const FIRST_IDLE_MS=4200;
 const REPEAT_IDLE_MS=60*1000;
 const HINT_HOLD_MS=18000;
 const HINT_COOLDOWN_MS=90*1000;
 const HINT_KEY='seyveo.sayvi.quiet-home-hint.v2';
 const CELEBRATION_KEY='seyveo.sayvi.completed-cards-greeting.v1';
 const intro=[
  'Хочешь поговорить? Нажми на сферу — откроем чат.',
  'Удерживай сферу — поговорим голосом. Зови меня Сэйви или Сэй.'
 ];
 // Native Unicode Emoji: iOS paints these with Apple Color Emoji. No
 // copyrighted Apple glyph images need to be copied into the PWA.
 const invitation=(text,kind,label,icon)=>({text,action:{kind,label,icon}});
 // A quiet, slowly rotating conversation, not a carousel of product ads.
 // Current actions are phrased as invitations; future actions say "soon".
 // No personal history, emergencies or abilities are ever fabricated here.
 const ideas=[
  'Не нужно подбирать особые команды. Просто расскажи своими словами.',
  'Твоё время ценно. Давай оставим больше минут для того, что любишь.',
  invitation('🎵 Хочешь музыку? Заглянем в SEYVEO SOUND — выберем под настроение.','music','Открыть музыку','🎵'),
  invitation('🎨 Может, порисуем? У нас есть настоящий планшет с кистями.','drawing','Открыть планшет','🎨'),
  invitation('Если дел накопилось много, начнём с одного. Шаг за шагом.','tasks','Мои дела','✅'),
  invitation('📄 Документы тоже могут быть проще. Покажи, с чем нужна помощь.','documents','Документы','📄'),
  invitation('📅 Важное лучше не держать в голове. Запишем в дела или календарь.','calendar','Календарь','📅'),
  'Ты для меня не просто список задач. Важно, что важно именно тебе.',
  'Для SEYVEO главное — человек. Кнопки нужны лишь для того, чтобы помогать.',
  'Я учусь быть полезной, не отвлекая тебя по пустякам.',
  'Скоро научусь помогать готовить документы к подписи.',
  'Мы скоро это сделаем: я смогу взять больше мелких дел на себя — с твоего согласия.',
  'Хочешь необычный факт? У осьминога три сердца.',
  invitation('💬 Можно просто поболтать. Не обязательно приходить ко мне с делами.','chat','Поговорим','💬'),
  invitation('📝 В SEYVEO есть блокнот. Туда можно отправить внезапную идею.','notes','Блокнот','📝'),
  'Скоро смогу лучше подбирать музыку под твой вкус и настроение.',
  'Если хочется выдохнуть, давай оставим несрочное на потом.',
  'Дела, встречи, маленькие планы — всё это можно держать рядом.',
  'Я могу быть серьёзной. А могу иногда рассказать что-нибудь смешное.',
  'Скоро научусь находить главное в длинных документах ещё точнее.',
  'Я здесь не для того, чтобы торопить. У каждого свой ритм.',
  'Хочешь навести порядок в мыслях? Расскажи, что тебя занимает.',
  'В моём мире есть музыка, записи и пространство для твоих идей.',
  'Скоро смогу помогать с повседневными делами ещё самостоятельнее.',
  'Если день непростой, можешь просто рассказать мне об этом.',
  'Мне нравится мысль, что технологии должны давать человеку свободу.',
  'Иногда достаточно одной хорошей идеи, чтобы день стал легче.',
  'Скоро хочу научиться мягко напоминать о действительно важном.',
  'Знаешь, у Венеры один оборот вокруг оси длится дольше года.',
  'Ты всегда решаешь сам. Моя задача — подсказать и помочь.',
  'Когда появится свободная минутка, можем вместе разобрать планы.',
  'Спроси, что я уже умею. А о том, что появится позже, расскажу честно.',
  'Я ещё многому учусь. Обещаю, моя помощь будет становиться умнее.',
  'И если захочешь просто тишины — всё хорошо. Я подожду.'
 ];
 const celebrationIdeas=[
  invitation('🎉 Ого, на главной всё разобрали! Может, включим музыку?','music','Включить музыку','🎵'),
  invitation('☀️ Ура, карточки закончились! Хочешь немного порисовать?','drawing','Открыть планшет','🎨'),
  invitation('✨ Вот это темп! На главной снова спокойно. Поболтаем?','chat','Поговорим','💬'),
  invitation('🎵 Всё, что было здесь, разобрали. Подберём музыку для настроения?','music','Открыть музыку','🎵'),
  invitation('🎨 Красота! Можно немного выдохнуть и открыть чистый лист.','drawing','Порисовать','🎨'),
  invitation('📝 Карточек больше нет. Хочешь записать новую идею?','notes','Открыть блокнот','📝'),
  '💫 Ну вот, на главной спокойно. Давай немного насладимся моментом.',
  invitation('🎧 Сэйви довольна: здесь всё решено. Включим что-нибудь приятное?','music','SEYVEO SOUND','🎵')
 ];
 // Small, verified evergreen curiosities and gentle, original jokes. Quotes
 // with unverified celebrity attribution never appear as invented facts.
 ideas.push(
  '☀️ Маленький факт: солнечный свет идёт до Земли около восьми минут.',
  '🙂 Почему календарь спокоен? У него всё по дням.',
  '🐧 У пингвинов тоже бывают важные дела. Например, найти свой камешек.',
  '💫 Хорошая мысль на сегодня: необязательно делать всё сразу.',
  '🌍 На Земле есть холодные пустыни. Антарктида — одна из них.',
  '😄 Я хотела пошутить про список дел, но он попросил выходной.',
  '📖 Чехов однажды написал: «Краткость — сестра таланта». Кажется, он прав.',
  '📖 Лев Толстой писал: «И нет величия там, где нет простоты, добра и правды».'
 );
 const ghost=document.createElement('span');
 ghost.className='sv-home-living-copy-ghost';
 ghost.setAttribute('aria-hidden','true');
 const typed=document.createElement('span');
 typed.className='sv-home-living-copy-typed';
 let idleSince=Date.now(),idleHint='',idleTyped='',idleTyping=false,idleAction=null;
 let miniReply='',miniTyped='',miniTyping=false,miniTimer=0,miniHideTimer=0,miniSequence=0;
 let celebrationTimer=0,celebrationPending=false,celebrationIndex=0;
 let idleRevealTimer=0,idleTypeTimer=0,idleHideTimer=0;
 let idleLastShownAt=0,idleIdeaIndex=0,introDone=false,introStep=0;
 let firstThoughtPending=true;
 let idleMarkupMounted=false,idleSequence=0;
 try{
  const stored=JSON.parse(sessionStorage.getItem(HINT_KEY)||'null');
  if(Number.isFinite(stored?.at))idleLastShownAt=stored.at;
  if(Number.isInteger(stored?.next)&&stored.next>=0)idleIdeaIndex=stored.next;
  introDone=stored?.introDone===true;
  celebrationIndex=Number.isInteger(stored?.celebration)&&stored.celebration>=0?
   stored.celebration:0;
 }catch{}
 try{
  const raw=localStorage.getItem(CELEBRATION_KEY);
  const saved=raw===null?NaN:Number(raw);
  if(Number.isInteger(saved)&&saved>=0)celebrationIndex=saved;
 }catch{}
 const homeVisible=()=>!home.hidden&&!document.hidden&&
  (!location.hash||location.hash==='#home')&&
  !document.documentElement.classList.contains('seyveo-conversation');
 const quietHome=()=>ready&&homeVisible()&&!voicePhase&&
  !root.classList.contains('sv-home-launch-pending')&&
  root.classList.contains('sv-home-greeting-expired')&&
  root.classList.contains('sv-home-empty-sphere')&&
  root.classList.contains('sv-home-empty-arrived')&&
  !root.classList.contains('sv-broadcast-onboarding')&&
  !root.classList.contains('sv-broadcast-sheet-open')&&
  !root.classList.contains('sv-broadcast-active')&&
  !root.classList.contains('sv-home-empty-arriving')&&
  !root.classList.contains('sv-home-empty-sphere-leaving')&&
  !root.classList.contains('sv-music-ambient')&&
  !root.classList.contains('sv-global-search-open')&&
  !document.querySelector('dialog[open]')&&
  !document.activeElement?.matches?.('input,textarea,[contenteditable="true"]');
 const canDisplayReply=()=>ready&&homeVisible()&&
  root.classList.contains('sv-home-empty-sphere')&&
  root.classList.contains('sv-home-empty-arrived')&&
  !root.classList.contains('sv-broadcast-sheet-open')&&
  !root.classList.contains('sv-broadcast-active')&&
  !root.classList.contains('sv-home-empty-sphere-leaving')&&
  !root.classList.contains('sv-music-ambient')&&
  !document.querySelector('dialog[open]');

 function navigateSuggestion(kind){
  if(kind==='broadcast')return window.SEYVEO_BROADCAST?.start?.({gesture:true})===true;
  if(kind==='broadcast-preferences')return window.SEYVEO_BROADCAST?.openPreferences?.()===true;
  if(kind==='profile')return window.SEYVEO_BROADCAST?.openProfile?.()===true;
  if(kind==='music'){
   if(!window.SEYVEO_MUSIC?.open)return false;
   window.SEYVEO_MUSIC.open();return true;
  }
  if(kind==='drawing'){
   if(!window.SEYVEO_PAPER?.open)return false;
   window.SEYVEO_PAPER.open();return true;
  }
  if(kind==='notes'){
   if(!window.SEYVEO_NOTES_API?.openNotes)return false;
   window.SEYVEO_NOTES_API.openNotes();return true;
  }
  if(kind==='documents'){
   if(window.SEYVEO_SAYVI_SURFACES?.open?.('contract')===true)return true;
   location.hash='#sayvi-documents';return true;
  }
  if(kind==='tasks'){
   const nav=document.getElementById('navTasks');
   if(nav){nav.click();return true;}
   location.hash='#tasks';return true;
  }
  if(kind==='calendar'){location.hash='#calendar';return true;}
  if(kind==='chat'){
   if(!window.SEYVEO_CONVERSATION?.open)return false;
   window.SEYVEO_CONVERSATION.open();return true;
  }
  return false;
 }
 actionButton.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  if(!idleAction||idleTyping||!quietHome())return;
  const kind=idleAction.kind;
  // Dismiss first, so the new page never inherits a Home suggestion.
  dropIdle();
  navigateSuggestion(kind);
 });

 function update(){
  requestAnimationFrame(positionThought);
  const visible=ready&&homeVisible();
  const replyVisible=visible&&!!miniReply&&canDisplayReply();
  const idleVisible=!replyVisible&&visible&&!!idleHint&&quietHome();
  if(replyVisible||idleVisible){
   if(!idleMarkupMounted){
    content.replaceChildren(ghost,typed);
    idleMarkupMounted=true;
   }
   const phrase=replyVisible?miniReply:idleHint;
   const written=replyVisible?miniTyped:idleTyped;
   const typing=replyVisible?miniTyping:idleTyping;
   const profileInvite=!replyVisible&&idleAction?.kind==='profile';
   heading.hidden=!profileInvite;
   if(profileInvite)heading.textContent='Давай познакомимся';
   if(ghost.textContent!==phrase)ghost.textContent=phrase;
   if(typed.textContent!==written)typed.textContent=written;
   if(!replyVisible&&idleAction){
    actionRow.hidden=false;
    actionRow.dataset.revealed=typing?'false':'true';
    if(actionButton.dataset.svSayviAction!==idleAction.kind){
     actionButton.dataset.svSayviAction=idleAction.kind;
     actionIcon.textContent=idleAction.icon;
     actionLabel.textContent=idleAction.label;
     actionButton.setAttribute('aria-label',idleAction.label);
    }
    actionIcon.hidden=!idleAction.icon;
   }else actionRow.hidden=true;
   line.dataset.svPresence=replyVisible?'reply':'idle';
   line.dataset.svTyping=typing?'true':'false';
   line.setAttribute('aria-label',phrase);
   // The live region announces the finished reply once, not every typed
   // character. Rapid per-letter announcements overwhelm VoiceOver on iOS.
   line.setAttribute('aria-live','off');
   if(line.hidden)line.hidden=false;
   return;
  }
  if(idleMarkupMounted){content.replaceChildren();idleMarkupMounted=false;}
  actionRow.hidden=true;
  heading.hidden=true;
  actionRow.dataset.revealed='false';
  line.dataset.svTyping='false';
  line.setAttribute('aria-label','');
  line.setAttribute('aria-live','off');
  // Thinking and speaking appear in the persistent top status. Only the
  // microphone acknowledgement belongs beneath the sphere.
  const status=voicePhase==='listening'?'Слушаю…':'';
  if(!visible||!status){
   if(!line.hidden)line.hidden=true;
   return;
  }
  if(content.textContent!==status)content.textContent=status;
  if(line.hidden)line.hidden=false;
  const phase=voicePhase||'quiet';
  if(line.dataset.svPresence!==phase)line.dataset.svPresence=phase;
 }
 function persistIdle(){
  try{sessionStorage.setItem(HINT_KEY,JSON.stringify({
   at:idleLastShownAt,next:idleIdeaIndex,introDone,celebration:celebrationIndex
  }));}catch{}
 }
 function dropIdle({resetClock=true}={}){
  clearTimeout(idleRevealTimer);idleRevealTimer=0;
  clearTimeout(idleTypeTimer);idleTypeTimer=0;
  clearTimeout(idleHideTimer);idleHideTimer=0;
  ++idleSequence;
  if(resetClock)idleSince=Date.now();
  if(resetClock&&!introDone)introStep=0;
  line.classList.remove('sv-home-idle-fading');
  if(!idleHint&&!idleMarkupMounted)return;
  idleHint='';idleTyped='';idleTyping=false;idleAction=null;update();
 }
 function noteActivity(event){
  if(!homeVisible())return;
  // Safari emits pointerdown and touchstart before click. Do not remove an
  // offered button during those events or its click would be lost.
  if(event?.target?.closest?.('#svHomeLivingLine [data-sv-sayvi-action]'))return;
  dropIdle();
 }
 function finishIdle(sequence){
  idleHideTimer=0;
  if(sequence!==idleSequence||!quietHome())return;
  if(!introDone&&introStep<intro.length-1){
   introStep++;
   line.classList.add('sv-home-idle-fading');
   idleHideTimer=setTimeout(()=>{
    if(sequence!==idleSequence||!quietHome())return;
    line.classList.remove('sv-home-idle-fading');
    showIdle({continuation:true});
   },470);
   return;
  }
  introDone=true;
  idleLastShownAt=Date.now();
  persistIdle();
  dropIdle({resetClock:false});
 }
 function typeIdle(sequence){
  if(sequence!==idleSequence||!idleHint||!quietHome())return;
  // Calm editorial reveal: show the whole thought at once.
  idleTyped=idleHint;
  idleTyping=false;
  update();
  idleHideTimer=setTimeout(()=>finishIdle(sequence),idleAction?HINT_HOLD_MS+6500:HINT_HOLD_MS);
 }
 function beginSuggestion(suggestion){
  idleHint=typeof suggestion==='string'?suggestion:suggestion.text;
  idleAction=typeof suggestion==='string'?null:suggestion.action;
  // The pictogram belongs on the action button, not twice in one thought.
  if(idleAction?.icon&&idleHint.startsWith(idleAction.icon))
   idleHint=idleHint.slice(idleAction.icon.length).trimStart();
  idleTyped='';idleTyping=true;
  const sequence=++idleSequence;
  firstThoughtPending=false;
  update();
  typeIdle(sequence);
 }
 function showIdle({continuation=false}={}){
  idleRevealTimer=0;
  const now=Date.now();
  const delay=firstThoughtPending?FIRST_IDLE_MS:(introDone?REPEAT_IDLE_MS:FIRST_IDLE_MS);
  if(!quietHome()||(!continuation&&now-idleSince<delay))return;
  if(root.classList.contains('sv-home-greeting-fading')&&
     !root.classList.contains('sv-home-greeting-expired'))return;
  const position=introDone?idleIdeaIndex++:idleIdeaIndex;
  const personalized=introDone&&position%4===0?
   window.SEYVEO_BROADCAST?.nextSuggestion?.():null;
  const suggestion=introDone?(personalized||ideas[position%ideas.length]):intro[introStep];
  beginSuggestion(suggestion);
 }
 function showCelebration(){
  celebrationTimer=0;
  if(!celebrationPending)return;
  if(!ready){celebrationTimer=setTimeout(showCelebration,450);return;}
  if(!quietHome()){celebrationPending=false;return;}
  if(!root.classList.contains('sv-home-greeting-expired')){
   window.dispatchEvent(new Event('seyveo:home-idle-prompt'));
   celebrationTimer=setTimeout(showCelebration,550);
   return;
  }
  celebrationPending=false;
  // A completed stack is a milestone, not the first-use tutorial.
  introDone=true;
  const suggestion=celebrationIdeas[celebrationIndex++%celebrationIdeas.length];
  try{localStorage.setItem(CELEBRATION_KEY,String(celebrationIndex));}catch{}
  idleSince=Date.now();
  persistIdle();
  beginSuggestion(suggestion);
 }
 function checkIdle(){
  if(!quietHome()){
   if(idleHint||idleRevealTimer||idleTypeTimer||idleHideTimer)
    dropIdle({resetClock:false});
   return;
  }
  const now=Date.now();
  if(idleHint||idleRevealTimer||now-idleSince<
     (firstThoughtPending?FIRST_IDLE_MS:(introDone?REPEAT_IDLE_MS:FIRST_IDLE_MS)))return;
  if(!firstThoughtPending&&introDone&&idleLastShownAt&&now>=idleLastShownAt&&
     now-idleLastShownAt<HINT_COOLDOWN_MS)return;
  // The original greeting fades before a new thought appears. Never stack
  // a second text block over it or move the approved globe/weather layout.
  if(!root.classList.contains('sv-home-greeting-expired')){
   window.dispatchEvent(new Event('seyveo:home-idle-prompt'));
   idleRevealTimer=setTimeout(showIdle,520);
  }else showIdle();
 }
 function resetMini(){
  clearTimeout(miniTimer);miniTimer=0;
  clearTimeout(miniHideTimer);miniHideTimer=0;
  ++miniSequence;
  miniReply='';miniTyped='';miniTyping=false;
  announcement.textContent='';
 }
 function clearVoice(){
  if(voiceTimer){clearTimeout(voiceTimer);voiceTimer=null}
  resetMini();
  voicePhase='';update();
 }
 function showMiniReply(value){
  const response=String(value||'').trim();
  if(!canDisplayReply()||!response||response.length>190||
    /(?:https?:\/\/|www\.|\n|\.(?:pdf|docx?|png|jpe?g)\b|<img|!\[|data:image|фотографи|изображени|вложени|прикреп|скриншот)/iu.test(response))return false;
  dropIdle();
  if(voiceTimer){clearTimeout(voiceTimer);voiceTimer=null;}
  resetMini();
  miniReply=response;miniTyped=response;miniTyping=false;
  voicePhase='reply';
  const sequence=++miniSequence;
  update();
  announcement.textContent=response;
  miniHideTimer=setTimeout(()=>{
   if(sequence===miniSequence)clearVoice();
  },11500);
  return true;
 }
 function onPresence(event){
  const phase=event.detail?.phase;
  if(phase==='ack'&&event.detail?.reply&&showMiniReply(event.detail.reply))return;
  if(phase==='listening')voicePhase='listening';
  else if(phase==='speaking')voicePhase='speaking';
  else if(phase==='ack'){resetMini();voicePhase='thinking';}
  else if(['listening-end','end','stop','text'].includes(phase)){
   resetMini();voicePhase='';
  }
  else return;
  if(voicePhase)dropIdle();
  if(voiceTimer)clearTimeout(voiceTimer);
  if(voicePhase){
   // A lost mobile lifecycle event must not leave a permanent “listening” claim.
   voiceTimer=setTimeout(clearVoice,18000);
  }
  update();
 }
 document.addEventListener('seyveo:assistant-presence',onPresence);
 for(const name of ['seyveo:life-events-changed','seyveo:tasks-changed',
  'seyveo:home-recommendation-changed','seyveo:fan-workshop-changed']){
  window.addEventListener(name,update);
 }
 // Route changes are handled once by the coalesced handler below.
 // A presence idea is never an alert: emergencies require a separately
 // verified regional source, timestamp and expiry before anything is shown.
 for(const name of ['pointerdown','keydown','touchstart','scroll'])
  document.addEventListener(name,noteActivity,{capture:true,passive:true});
 let presenceRoute=location.hash||'#home';
 function onPresenceRoute(){
  const next=location.hash||'#home';
  if(next===presenceRoute)return;
  presenceRoute=next;dropIdle();update();
 }
 window.addEventListener('hashchange',onPresenceRoute);
 window.addEventListener('seyveo:route-changed',onPresenceRoute);
 window.addEventListener('seyveo:home-sayvi-arrived',event=>{
  dropIdle();
  if(event.detail?.firstLaunch)idleSince=Date.now()+3500;
  if(event.detail?.afterCards){
   celebrationPending=true;
   clearTimeout(celebrationTimer);
   celebrationTimer=setTimeout(showCelebration,850);
  }
  update();
 });
 window.addEventListener('storage',e=>{
  if(!e.key||['seyveo-personal-tasks-v1','seyveo-calendar-events-v1'].includes(e.key))update();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){clearVoice();dropIdle();}
  else{idleSince=Date.now();update();}
 });
 // Safari safety: do not observe Home mutations while update() itself
 // modifies Home classes. That feedback loop can freeze all tap handlers.
 // Existing app events, navigation, visibility and timed refresh are sufficient.
 window.setInterval(()=>{if(homeVisible())update()},5*60*1000);
 window.setInterval(checkIdle,3500);
 window.setTimeout(()=>{ready=true;update()},HELLO_MS);
 // The existing voice recognizer can ask to display a short answer without
 // forcing a full conversation screen. No independent microphone or TTS.
 window.SEYVEO_HOME_PRESENCE=Object.freeze({canDisplayReply});
})();
