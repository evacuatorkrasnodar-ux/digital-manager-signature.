/* SEYVEO · Quiet Presence under the original sphere.
 * Listening status wins; very occasional idle ideas live in the same line.
 * No fabricated emergencies, auto-play, card changes or dock mutations. */
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
 line.append(mark,content);
 message.insertAdjacentElement('afterend',line);

 const HELLO_MS=3600;
 let ready=false,voicePhase='',voiceTimer=null;
 const root=document.documentElement;
 const IDLE_MS=60*1000;
 const HINT_VISIBLE_MS=18*1000;
 const HINT_COOLDOWN_MS=25*60*1000;
 const HINT_KEY='seyveo.sayvi.quiet-home-hint.v1';
 const ideas=[
  'Хочешь немного музыки? Подберу под настроение.',
  'Могу помочь с письмом, документом или планом на день.',
  'Маленький факт: у осьминога три сердца. Удивительно, правда?',
  'Если захочешь поболтать — я здесь.',
  'У меня нет кофе-брейков. Но идеи иногда лучше приходят на паузе.',
  'Можем придумать что-нибудь приятное на вечер.'
 ];
 let idleSince=Date.now(),idleHint='',idleVisibleUntil=0;
 let idleRevealTimer=0,idleLastShownAt=0,idleIdeaIndex=0;
 try{
  const stored=JSON.parse(sessionStorage.getItem(HINT_KEY)||'null');
  if(Number.isFinite(stored?.at))idleLastShownAt=stored.at;
  if(Number.isInteger(stored?.next)&&stored.next>=0)idleIdeaIndex=stored.next;
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

 function update(){
  const visible=ready&&homeVisible();
  // The quiet line supplements the original greeting, it never replaces it.
  // Thinking and speaking now live in the persistent top status. Keep only
  // the microphone acknowledgement here, never duplicate the same words.
  const status=voicePhase==='listening'?'Слушаю…'
   :voicePhase?''
   :idleHint&&quietHome()?idleHint:'';
  if(!visible||!status){
   if(!line.hidden)line.hidden=true;
   return;
  }
  if(content.textContent!==status)content.textContent=status;
  if(line.hidden)line.hidden=false;
  const phase=voicePhase||(idleHint?'idle':'quiet');
  if(line.dataset.svPresence!==phase)line.dataset.svPresence=phase;
 }
 function dropIdle({resetClock=true}={}){
  clearTimeout(idleRevealTimer);idleRevealTimer=0;
  if(resetClock)idleSince=Date.now();
  if(!idleHint)return;
  idleHint='';idleVisibleUntil=0;update();
 }
 function noteActivity(){
  if(!homeVisible())return;
  dropIdle();
 }
 function showIdle(){
  idleRevealTimer=0;
  const now=Date.now();
  if(!quietHome()||now-idleSince<IDLE_MS)return;
  if(root.classList.contains('sv-home-greeting-fading')&&
     !root.classList.contains('sv-home-greeting-expired'))return;
  idleHint=ideas[idleIdeaIndex%ideas.length];
  idleIdeaIndex++;
  idleVisibleUntil=now+HINT_VISIBLE_MS;
  idleLastShownAt=now;
  try{sessionStorage.setItem(HINT_KEY,JSON.stringify({at:now,next:idleIdeaIndex}));}catch{}
  update();
 }
 function checkIdle(){
  if(!quietHome()){
   if(idleHint||idleRevealTimer)dropIdle({resetClock:false});
   return;
  }
  const now=Date.now();
  if(idleHint){
   if(now>=idleVisibleUntil)dropIdle({resetClock:false});
   return;
  }
  if(idleRevealTimer||now-idleSince<IDLE_MS)return;
  if(idleLastShownAt&&now>=idleLastShownAt&&
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
