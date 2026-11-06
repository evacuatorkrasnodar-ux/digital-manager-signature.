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
 const greeting=/^(?:Доброе утро|Добрый день|Добрый вечер|Доброй ночи)/iu;
 let ready=false,voicePhase='',voiceUntil=0,voiceTimer=null,last='';
 const homeVisible=()=>!home.hidden&&!document.hidden&&
  (!location.hash||location.hash==='#home')&&
  !document.documentElement.classList.contains('seyveo-conversation');
 const countText=(n,noun)=>n===1?'одно '+noun:n>=2&&n<=4?'несколько '+noun:'несколько дел';
 function realStatus(){
  if(voicePhase==='listening')return 'Слушаю…';
  if(voicePhase==='speaking')return 'Сэйви отвечает…';
  if(voicePhase==='thinking')return 'Сэйви думает…';
  const life=window.SEYVEO_LIFE_EVENTS;
  const due=life?.attentionTasks?.()||[];
  if(due.length)return due.length===1?'Есть дело, которое ждёт внимания.':'Есть дела, которые ждут внимания.';
  const upcoming=life?.upcomingEvents?.()||[];
  if(upcoming.length)return upcoming.length===1?'Впереди событие в календаре.':'Впереди события в календаре.';
  const tomorrow=life?.upcomingTasks?.()||[];
  if(tomorrow.length)return tomorrow.length===1?'На завтра есть одно дело.':'На завтра есть несколько дел.';
  return 'Всё спокойно. Я рядом.';
 }
 function update(){
  const visible=ready&&homeVisible();
  const isGreeting=greeting.test(headline.textContent?.trim()||'');
  const isDemo=home.classList.contains('sv-home-preview');
  // A real owner recommendation or onboarding keeps its original informative heading.
  const canReplace=isGreeting||isDemo;
  home.classList.toggle('sv-home-presence-calm',visible&&canReplace);
  if(!visible||!canReplace){line.hidden=true;return}
  line.hidden=false;
  const msg=realStatus();
  if(last!==msg){content.textContent=msg;last=msg}
  line.dataset.svPresence=voicePhase||'quiet';
 }
 function clearVoice(){
  if(voiceTimer){clearTimeout(voiceTimer);voiceTimer=null}
  voicePhase='';voiceUntil=0;update();
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
 const watcher=new MutationObserver(update);
 watcher.observe(headline,{childList:true,characterData:true,subtree:true});
 watcher.observe(home,{attributes:true,attributeFilter:['hidden','class']});
 window.setInterval(()=>{if(homeVisible())update()},5*60*1000);
 window.setTimeout(()=>{ready=true;update()},HELLO_MS);
})();