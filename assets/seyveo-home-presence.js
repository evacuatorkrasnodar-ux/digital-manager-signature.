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
 line.append(mark,content,actionRow);
 message.insertAdjacentElement('afterend',line);

 const HELLO_MS=3600;
 let ready=false,voicePhase='',voiceTimer=null;
 const root=document.documentElement;
 const FIRST_IDLE_MS=14000;
 const REPEAT_IDLE_MS=60*1000;
 const HINT_HOLD_MS=8500;
 const HINT_COOLDOWN_MS=90*1000;
 const HINT_KEY='seyveo.sayvi.quiet-home-hint.v2';
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
 const ghost=document.createElement('span');
 ghost.className='sv-home-living-copy-ghost';
 ghost.setAttribute('aria-hidden','true');
 const typed=document.createElement('span');
 typed.className='sv-home-living-copy-typed';
 let idleSince=Date.now(),idleHint='',idleTyped='',idleTyping=false,idleAction=null;
 let idleRevealTimer=0,idleTypeTimer=0,idleHideTimer=0;
 let idleLastShownAt=0,idleIdeaIndex=0,introDone=false,introStep=0;
 let idleMarkupMounted=false,idleSequence=0;
 try{
  const stored=JSON.parse(sessionStorage.getItem(HINT_KEY)||'null');
  if(Number.isFinite(stored?.at))idleLastShownAt=stored.at;
  if(Number.isInteger(stored?.next)&&stored.next>=0)idleIdeaIndex=stored.next;
  introDone=stored?.introDone===true;
 }catch{}
 const homeVisible=()=>!home.hidden&&!document.hidden&&
  (!location.hash||location.hash==='#home')&&
  !document.documentElement.classList.contains('seyveo-conversation');
 const quietHome=()=>ready&&homeVisible()&&!voicePhase&&
  root.classList.contains('sv-home-empty-sphere')&&
  root.classList.contains('sv-home-empty-arrived')&&
  !root.classList.contains('sv-home-empty-arriving')&&
  !root.classList.contains('sv-home-empty-sphere-leaving')&&
  !root.classList.contains('sv-music-ambient')&&
  !root.classList.contains('sv-global-search-open')&&
  !document.querySelector('dialog[open]')&&
  !document.activeElement?.matches?.('input,textarea,[contenteditable="true"]');

 function navigateSuggestion(kind){
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
  const visible=ready&&homeVisible();
  const idleVisible=visible&&!!idleHint&&quietHome();
  if(idleVisible){
   if(!idleMarkupMounted){
    content.replaceChildren(ghost,typed);
    idleMarkupMounted=true;
   }
   if(ghost.textContent!==idleHint)ghost.textContent=idleHint;
   if(typed.textContent!==idleTyped)typed.textContent=idleTyped;
   if(idleAction){
    actionRow.hidden=false;
    actionRow.dataset.revealed=idleTyping?'false':'true';
    if(actionButton.dataset.svSayviAction!==idleAction.kind){
     actionButton.dataset.svSayviAction=idleAction.kind;
     actionIcon.textContent=idleAction.icon;
     actionLabel.textContent=idleAction.label;
     actionButton.setAttribute('aria-label',idleAction.label);
    }
   }else actionRow.hidden=true;
   line.dataset.svPresence='idle';
   line.dataset.svTyping=idleTyping?'true':'false';
   line.setAttribute('aria-label',idleHint);
   if(line.hidden)line.hidden=false;
   return;
  }
  if(idleMarkupMounted){content.replaceChildren();idleMarkupMounted=false;}
  actionRow.hidden=true;
  actionRow.dataset.revealed='false';
  line.dataset.svTyping='false';
  line.setAttribute('aria-label','');
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
   at:idleLastShownAt,next:idleIdeaIndex,introDone
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
  const letters=Array.from(idleHint);
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   idleTyped=idleHint;idleTyping=false;update();
   idleHideTimer=setTimeout(()=>finishIdle(sequence),idleAction?HINT_HOLD_MS+6500:HINT_HOLD_MS);
   return;
  }
  let cursor=0;
  const next=()=>{
   idleTypeTimer=0;
   if(sequence!==idleSequence||!idleHint||!quietHome())return;
   if(cursor>=letters.length){
    idleTyping=false;update();
    idleHideTimer=setTimeout(()=>finishIdle(sequence),idleAction?HINT_HOLD_MS+6500:HINT_HOLD_MS);
    return;
   }
   const letter=letters[cursor++];
   idleTyped+=letter;
   update();
   // Natural cadence, with a short breath after punctuation.
   const pause=/[.!?…]/.test(letter)?190:/[,—:;]/.test(letter)?95:30+cursor%5*4;
   idleTypeTimer=setTimeout(next,pause);
  };
  idleTypeTimer=setTimeout(next,250);
 }
 function showIdle({continuation=false}={}){
  idleRevealTimer=0;
  const now=Date.now();
  const delay=introDone?REPEAT_IDLE_MS:FIRST_IDLE_MS;
  if(!quietHome()||(!continuation&&now-idleSince<delay))return;
  if(root.classList.contains('sv-home-greeting-fading')&&
     !root.classList.contains('sv-home-greeting-expired'))return;
  const suggestion=introDone?ideas[idleIdeaIndex++%ideas.length]:intro[introStep];
  idleHint=typeof suggestion==='string'?suggestion:suggestion.text;
  idleAction=typeof suggestion==='string'?null:suggestion.action;
  idleTyped='';idleTyping=true;
  const sequence=++idleSequence;
  update();
  typeIdle(sequence);
 }
 function checkIdle(){
  if(!quietHome()){
   if(idleHint||idleRevealTimer||idleTypeTimer||idleHideTimer)
    dropIdle({resetClock:false});
   return;
  }
  const now=Date.now();
  if(idleHint||idleRevealTimer||now-idleSince<
     (introDone?REPEAT_IDLE_MS:FIRST_IDLE_MS))return;
  if(introDone&&idleLastShownAt&&now>=idleLastShownAt&&
     now-idleLastShownAt<HINT_COOLDOWN_MS)return;
  // The original greeting fades before a new thought appears. Never stack
  // a second text block over it or move the approved globe/weather layout.
  if(!root.classList.contains('sv-home-greeting-expired')){
   window.dispatchEvent(new Event('seyveo:home-idle-prompt'));
   idleRevealTimer=setTimeout(showIdle,520);
  }else showIdle();
 }
 function clearVoice(){
  if(voiceTimer){clearTimeout(voiceTimer);voiceTimer=null}
  voicePhase='';update();
 }
 function onPresence(event){
  const phase=event.detail?.phase;
  if(phase==='listening')voicePhase='listening';
  else if(phase==='speaking')voicePhase='speaking';
  else if(phase==='ack')voicePhase='thinking';
  else if(['listening-end','end','stop','text'].includes(phase))voicePhase='';
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
 window.addEventListener('hashchange',update);
 // A presence idea is never an alert: emergencies require a separately
 // verified regional source, timestamp and expiry before anything is shown.
 for(const name of ['pointerdown','keydown','touchstart','scroll'])
  document.addEventListener(name,noteActivity,{capture:true,passive:true});
 window.addEventListener('hashchange',()=>{dropIdle();update();});
 window.addEventListener('seyveo:route-changed',()=>{dropIdle();update();});
 window.addEventListener('seyveo:home-sayvi-arrived',()=>{dropIdle();update();});
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
})();
