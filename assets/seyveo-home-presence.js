/* SEYVEO · Quiet Presence under the original sphere.
 * One unobtrusive local status, no cycling slogans, no invented events.
 * This never changes the orb, card renderer, card action logic or dock. */
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
 mark.textContent='✧';
 const content=document.createElement('span');
 content.className='sv-home-living-copy';
 line.append(mark,content);
 message.insertAdjacentElement('afterend',line);

 const HELLO_MS=3600;
 let ready=false,voicePhase='',voiceTimer=null;
 const homeVisible=()=>!home.hidden&&!document.hidden&&
  (!location.hash||location.hash==='#home')&&
  !document.documentElement.classList.contains('seyveo-conversation');

 function update(){
  const visible=ready&&homeVisible();
  // The quiet line supplements the original greeting, it never replaces it.
  const status=voicePhase==='listening'?'Слушаю…'
   :voicePhase==='speaking'?'Сэйви отвечает…'
   :voicePhase==='thinking'?'Сэйви думает…'
   :'';
  if(!visible||!status){
   if(!line.hidden)line.hidden=true;
   return;
  }
  if(content.textContent!==status)content.textContent=status;
  if(line.hidden)line.hidden=false;
  const phase=voicePhase||'quiet';
  if(line.dataset.svPresence!==phase)line.dataset.svPresence=phase;
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
 window.addEventListener('storage',e=>{
  if(!e.key||['seyveo-personal-tasks-v1','seyveo-calendar-events-v1'].includes(e.key))update();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)clearVoice();
  else update();
 });
 // Safari safety: do not observe Home mutations while update() itself
 // modifies Home classes. That feedback loop can freeze all tap handlers.
 // Existing app events, navigation, visibility and timed refresh are sufficient.
 window.setInterval(()=>{if(homeVisible())update()},5*60*1000);
 window.setTimeout(()=>{ready=true;update()},HELLO_MS);
})();