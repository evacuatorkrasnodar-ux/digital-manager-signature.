/* SEYVEO opening: the real Sayvi greets, gently travels into
   her miniature, while the original three-slot dock grows by one slot.
   Home stays Home; task data, navigation and touch handlers are untouched.
   ?sayvi-intro=1 replays the scene for review; ?sayvi-intro=0 skips it. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const replay=params.get('sayvi-intro')==='1'||params.get('sayvi-handoff')==='1';
  const noIntro=params.get('sayvi-intro')==='0';
  const speed=params.get('sayvi-slow')==='1'?1.8:1;
  // The approved Sayvi voice is available via the trusted local server, or
  // from a file the owner explicitly imports into this browser's private data.
  // No recording is published with SEYVEO; other visitors remain silent.
  const voiceRequested=params.get('sayvi-voice')==='1';
  const localVoicePreview=voiceRequested&&location.origin==='http://127.0.0.1:8790';
  let personalVoiceSaved=false;
  try{personalVoiceSaved=localStorage.getItem('seyveo-private-voice-ready-v1')==='1';}catch{}
  const fileVoicePreview=!localVoicePreview&&(voiceRequested||personalVoiceSaved);
  // The personal cinematic uses the exact approved short WAV, never a fresh
  // TTS performance. Long project narration remains a separate local task.
  const dailyKey='seyveo-sayvi-cinema-last-day-v4';
  const currentDay=()=>{
    const d=new Date();
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  const day=currentDay();
  let alreadySeen=false;
  try{alreadySeen=localStorage.getItem(dailyKey)===day;}catch{}
  // A calm daily greeting, once per local calendar day. Reloading Safari or
  // reopening the PWA on the same day must not repeat the cinematic flight.
  // The full first-install introduction is a separate, later experience.
  const atHome=!location.hash||location.hash==='#home';
  const showCinema=atHome&&!noIntro&&(replay||voiceRequested||!alreadySeen);
  const root=document.documentElement;
  root.classList.add('sv-sayvi-handoff-demo');
  const home=document.getElementById('homePage');
  const orb=document.getElementById('orb');
  const heroArtwork=document.getElementById('plasmaVisual');
  const dockButton=document.getElementById('assistantButton');
  const small=dockButton?.querySelector('.sv-sayvi-velvet-sphere');
  const dock=dockButton?.closest('footer.dock');
  if(!home||!orb||!dockButton||!small){
    root.classList.remove('sv-sayvi-handoff-demo','sv-cinema-boot');
    return;
  }
  // Independent status line: the greeting can expire, Sayvi's presence cannot.
  // Fixed placement keeps the approved flight geometry and card positions intact.
  if(!home.querySelector('.sv-sayvi-home-online')){
    const online=document.createElement('div');
    online.className='sv-sayvi-home-online';
    online.textContent='Сэйви · на связи';
    home.prepend(online);
  }
  // The opening is a quiet written introduction. The ordinary
  // Home greeting (and its live task context) returns after the handoff.
  const message=home.querySelector('#stage > .message');
  let greeting=null;
  let greetingDelay=0;
  let greetingTicker=0;
  let writtenGreetingComplete=false;
  let startGreeting=()=>{};
  let welcomeSpeech='';
  if(showCinema&&message){
    const hour=new Date().getHours();
    const hello=hour<5?'Доброй ночи!':hour<12?'Доброе утро!':
      hour<18?'Добрый день!':'Добрый вечер!';
    const greetingLines=[{text:hello,kind:'welcome',type:79}];
    welcomeSpeech=greetingLines.map(line=>line.text).join(' ');
    greeting=document.createElement('p');
    greeting.className='sv-cinema-written-hello';
    greeting.setAttribute('aria-label',welcomeSpeech);
    greeting.setAttribute('aria-live','off');
    const writing=document.createElement('span');
    writing.className='sv-cinema-written-line sv-cinema-written-line--welcome';
    greeting.appendChild(writing);
    message.appendChild(greeting);
    root.classList.add('sv-cinema-greeting-active');
    startGreeting=()=>{greetingDelay=setTimeout(()=>{
      if(done)return;
      greeting.classList.add('sv-cinema-written-hello--visible');
      // Three distinct thoughts, never three lines at once: Sayvi writes,
      // pauses and gently erases the first two before signing the final one.
      const playPhrase=index=>{
        if(done||!greeting)return;
        const phrase=greetingLines[index];
        writing.className='sv-cinema-written-line sv-cinema-written-line--'+phrase.kind;
        writing.textContent='';
        greeting.setAttribute('aria-label',phrase.text);
        let cursor=0;
        const type=()=>{
          if(done||!greeting)return;
          cursor=Math.min(phrase.text.length,cursor+1);
          writing.textContent=phrase.text.slice(0,cursor);
          if(cursor<phrase.text.length)greetingTicker=setTimeout(type,phrase.type);
          else if(index<greetingLines.length-1)greetingTicker=setTimeout(erase,phrase.hold);
          else{
            writtenGreetingComplete=true;
            scheduleFlightWhenReady();
          }
        };
        const erase=()=>{
          if(done||!greeting)return;
          cursor=Math.max(0,cursor-1);
          writing.textContent=phrase.text.slice(0,cursor);
          if(cursor>0)greetingTicker=setTimeout(erase,phrase.erase);
          else greetingTicker=setTimeout(()=>playPhrase(index+1),285);
        };
        greetingTicker=setTimeout(type,phrase.type);
      };
      playPhrase(0);
    },1040);};
  }
  if(!greeting)writtenGreetingComplete=true;
  // The HTML fallback is dark. Synchronize the already-selected white theme
  // before the first cinematic frame to avoid a dark-to-white visual flash.
  if(root.dataset.theme==='light'&&heroArtwork?.getAttribute('src')?.includes('plasma-signature.svg')){
    heroArtwork.setAttribute('src','assets/plasma-signature-light.svg?v=24');
  }
  // Never show both Sayvis. Inline priority wins over the dock's !important CSS.
  const smallOpacity=small.style.getPropertyValue('opacity');
  const smallOpacityPriority=small.style.getPropertyPriority('opacity');
  if(showCinema)small.style.setProperty('opacity','0','important');

  let done=false;
  let animation=null;
  let introTimer=0;
  let narrationComplete=true;
  let safetyTimer=0;
  let dockTimer=0;
  let dockMetrics=null;
  let dockStyleBefore=null;
  let todayCard=null;
  let postponedCard=null;
  let currentPostponedItem=null;
  let voiceButton=null;
  let voiceDownload=null;
  let voiceMedia=null;
  let voiceFallbackTimer=0;
  let voiceFileInput=null;
  let voiceFileUrl=null;
  let openingStartedAt=0;
  // Do not cut off the final letters or the approved voice. The handoff
  // begins after BOTH have finished, with a short breathing pause.
  function scheduleFlightWhenReady(){
    if(done||!openingStartedAt||!writtenGreetingComplete||!narrationComplete||introTimer)return;
    introTimer=setTimeout(begin,1250);
  }
  // The Home greeting is a welcome, not a permanent part of the workspace.
  // Keep it for a quiet visitor, but give the room back to real cards once
  // they begin working (and in any case after five minutes).
  const homeGreetingMaxMs=5*60*1000;
  const homeGreetingMinMs=3500;
  let homeGreetingStartedAt=0;
  let homeGreetingDeadline=0;
  let homeGreetingTimer=0;
  let homeGreetingDismissed=false;
  function expireHomeGreeting(){
    if(homeGreetingDismissed||!done||!message)return;
    homeGreetingDismissed=true;
    clearTimeout(homeGreetingTimer);
    message.style.setProperty('--sv-home-greeting-height',`${Math.ceil(message.getBoundingClientRect().height)+2}px`);
    root.classList.add('sv-home-greeting-fading');
    const fadeMs=matchMedia('(prefers-reduced-motion: reduce)').matches?0:390;
    setTimeout(()=>{
      root.classList.add('sv-home-greeting-expired');
      queueTodayRefresh();
    },fadeMs);
  }
  function engageHomeGreeting(){
    if(!homeGreetingStartedAt||homeGreetingDismissed)return;
    const elapsed=Date.now()-homeGreetingStartedAt;
    clearTimeout(homeGreetingTimer);
    homeGreetingTimer=setTimeout(expireHomeGreeting,Math.max(0,homeGreetingMinMs-elapsed));
  }
  function beginHomeGreetingLifetime(){
    if(homeGreetingStartedAt||!message)return;
    homeGreetingStartedAt=Date.now();
    homeGreetingDeadline=homeGreetingStartedAt+homeGreetingMaxMs;
    homeGreetingTimer=setTimeout(expireHomeGreeting,homeGreetingMaxMs);
  }
  // A first purposeful touch or keyboard action means the visitor is already
  // working. Do not consume the event: the real control must still respond.
  document.addEventListener('pointerdown',event=>{
    if(!done||home.hidden||homeGreetingDismissed||root.classList.contains('sv-music-ambient'))return;
    if(event.target.closest('#stage > .message'))return;
    engageHomeGreeting();
  },{capture:true,passive:true});
  document.addEventListener('keydown',event=>{
    if(done&&!home.hidden&&!event.repeat)engageHomeGreeting();
  },{capture:true});
  window.addEventListener('hashchange',()=>{
    if(done&&homeGreetingStartedAt&&(location.hash&&location.hash!=='#home'))engageHomeGreeting();
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&homeGreetingStartedAt&&!homeGreetingDismissed&&Date.now()>=homeGreetingDeadline)
      expireHomeGreeting();
  });
  const orbHome=orb.parentNode;
  const orbNext=orb.nextSibling;
  let originalOrbStyle=null;
  function prepareDock(){
    if(!showCinema||root.dataset.theme!=='light'||!dock)return;
    // The existing grid stays at final coordinates. Only its background mask
    // changes; reflowing grid tracks on every frame caused visible stutter.
    const full=parseFloat(getComputedStyle(dock,'::before').width);
    if(!Number.isFinite(full)||full<180)return;
    const slot=full/4;
    dockMetrics={full,slot};
    dockStyleBefore=[dock.style.getPropertyValue('--sv-cinema-grow-duration'),dock.style.getPropertyPriority('--sv-cinema-grow-duration')];
    root.classList.add('sv-cinema-intro-active');
  }
  function growDock(delay,duration){
    if(!dockMetrics)return;
    dock.style.setProperty('--sv-cinema-grow-duration',`${duration}ms`);
    dockTimer=setTimeout(()=>{
      if(!done)root.classList.add('sv-cinema-dock-growing');
    },delay);
  }
  function restoreDock(){
    clearTimeout(dockTimer);
    if(dock&&dockStyleBefore){
      const [value,priority]=dockStyleBefore;
      if(value)dock.style.setProperty('--sv-cinema-grow-duration',value,priority);
      else dock.style.removeProperty('--sv-cinema-grow-duration');
    }
    root.classList.remove('sv-cinema-intro-active','sv-cinema-dock-growing','sv-cinema-intro-dock-ready');
    dockStyleBefore=null;
  }
  function restoreOrb(){
    animation?.cancel();
    animation=null;
    // The *same* button goes home, already concealed by the docked layout.
    if(orb.parentNode!==orbHome){
      if(orbNext&&orbNext.parentNode===orbHome)orbHome.insertBefore(orb,orbNext);
      else orbHome.appendChild(orb);
    }
    orb.classList.remove('sv-sayvi-handoff-flight');
    if(originalOrbStyle!==null){
      if(originalOrbStyle)orb.setAttribute('style',originalOrbStyle);
      else orb.removeAttribute('style');
      originalOrbStyle=null;
    }
  }
  function rememberOpening(){
    if(!showCinema)return;
    try{localStorage.setItem(dailyKey,day);}catch{}
  }
  const storeList=key=>{
    try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}
    catch{return [];}
  };
  // This owner-controlled preference affects only the Home presentation.
  // Tasks, calendar events and business decisions remain in their own stores.
  const homeAgendaKey='seyveo-home-agenda-visible-v1';
  function homeAgendaEnabled(){
    try{return localStorage.getItem(homeAgendaKey)!=='0';}catch{return true;}
  }
  const homeAgendaSwitch=document.getElementById('svHomeAgendaSwitch');
  if(homeAgendaSwitch){
    homeAgendaSwitch.checked=homeAgendaEnabled();
    homeAgendaSwitch.addEventListener('change',()=>{
      try{localStorage.setItem(homeAgendaKey,homeAgendaSwitch.checked?'1':'0');}catch{}
      window.dispatchEvent(new Event('seyveo:home-agenda-visibility-changed'));
    });
  }
  // Home without due work is a living space, not an empty page.
  // Ignore tomorrow's entries; unfinished overdue work still needs attention.
  const todayKey=()=>{
    const d=new Date();
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  function hasTodayAttention(){
    const agenda=upcomingHomeItems().length>0;
    const living=document.getElementById('seyveoLivingMoment');
    const realCards=living&&!living.hidden&&!living.classList.contains('lm-preview')&&
      !!living.querySelector('.lm-tiles > :not([hidden]),.lm-inline-item:not([hidden])');
    const dynamic=document.getElementById('dynamic');
    const advice=dynamic&&!dynamic.hidden&&
      Array.from(dynamic.children).some(el=>!el.hidden&&el.classList.contains('decision-card'));
    return !!(agenda||realCards||advice);
  }
  // Count genuine, unfinished work; never infer the layout from a single
  // rendered card (Home deliberately presents the first item of its queue).
  // The available vertical room, rather than a hard-coded four-card limit,
  // determines whether a fourth item can share Home with the sphere.
  function homeSphereLayout(){
    if(home.hidden||(location.hash&&location.hash!=='#home'))return {mode:'dock'};
    const agenda=upcomingHomeItems();
    const living=document.getElementById('seyveoLivingMoment');
    const livingCount=living&&!living.hidden&&!living.classList.contains('lm-preview')?
      [...living.querySelectorAll('.lm-tiles > :not([hidden]),.lm-inline-item:not([hidden])')].length:0;
    const dynamic=document.getElementById('dynamic');
    const adviceCount=dynamic&&!dynamic.hidden?
      [...dynamic.children].filter(el=>!el.hidden&&el.classList.contains('decision-card')).length:0;
    let count=agenda.length+livingCount+adviceCount;
    if(!count&&hasTodayAttention())count=1;
    if(!count)return {mode:'idle'};
    if(count>4)return {mode:'dock'};
    const vh=Math.max(0,document.documentElement.clientHeight||0,window.innerHeight||0);
    const header=document.getElementById('homeHeader');
    const headerHeight=header&&!header.hidden?Math.min(95,header.getBoundingClientRect().height):48;
    const messageHeight=message&&!root.classList.contains('sv-home-greeting-expired')?
      Math.max(65,Math.min(145,message.getBoundingClientRect().height)):0;
    // Reserve each real item, even though the feed initially displays one.
    // Three fit on a typical tall phone; four only when the screen allows it.
    const taskHeight=agenda.length?154+Math.max(0,agenda.length-1)*95:0;
    const otherHeight=(livingCount+adviceCount)*114;
    const room=vh-headerHeight-messageHeight-taskHeight-otherHeight-142;
    if(room<140)return {mode:'dock'};
    return {mode:'cards',size:Math.round(Math.min(205,room))};
  }
  function shouldKeepSphereHome(){
    return homeSphereLayout().mode!=='dock';
  }
  let idleDockTimer=0;
  function updateClusterInteraction(){
    const cluster=document.getElementById('orbCluster');
    if(!cluster)return;
    const visible=root.classList.contains('sv-sayvi-home-idle')||
      root.classList.contains('sv-sayvi-home-cards')||
      root.classList.contains('sv-music-ambient');
    if(visible){cluster.removeAttribute('aria-hidden');cluster.inert=false;}
    else if(done){cluster.setAttribute('aria-hidden','true');cluster.inert=true;}
  }
  function syncIdleHome(){
    if(!done)return;
    const layout=homeSphereLayout();
    const idle=layout.mode==='idle';
    const cards=layout.mode==='cards';
    const previous=root.classList.contains('sv-sayvi-home-idle')||
      root.classList.contains('sv-sayvi-home-cards');
    if(idle||cards){
      clearTimeout(idleDockTimer);
      root.classList.remove('sv-sayvi-home-idle-leaving');
      root.classList.toggle('sv-sayvi-home-idle',idle);
      root.classList.toggle('sv-sayvi-home-cards',cards);
      if(cards)root.style.setProperty('--sv-home-live-orb-size',layout.size+'px');
      else root.style.removeProperty('--sv-home-live-orb-size');
    }else if(previous){
      root.classList.remove('sv-sayvi-home-idle','sv-sayvi-home-cards');
      root.style.removeProperty('--sv-home-live-orb-size');
      root.classList.add('sv-sayvi-home-idle-leaving');
      clearTimeout(idleDockTimer);
      idleDockTimer=setTimeout(()=>root.classList.remove('sv-sayvi-home-idle-leaving'),820);
    }
    updateClusterInteraction();
  }
  // The owner's saved tasks are the only source of Home task cards.
  // Never create a second task store or show educational suggestions as real.
  const homeLaterKey='seyveo-home-task-later-v1';
  let currentHomeItem=null;
  function homeLaterMap(){
    try{
      const raw=JSON.parse(localStorage.getItem(homeLaterKey)||'{}');
      return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    }catch{return {};}
  }
  function upcomingHomeItems(includePostponed=false){
    if(!homeAgendaEnabled())return [];
    const today=todayKey(),later=homeLaterMap(),now=Date.now();
    const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
    const clock=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?s:'';
    const tasks=storeList('seyveo-personal-tasks-v1').filter(t=>
      t&&typeof t.id==='string'&&typeof t.title==='string'&&t.title.trim()&&
      !t.done&&validDate(t.due)&&t.due<=today)
      .map(t=>({key:'task:'+t.id,id:t.id,kind:'task',title:t.title.trim().slice(0,140),
        date:t.due,time:clock(t.time),notes:typeof t.notes==='string'?t.notes.trim().slice(0,280):''}));
    const events=storeList('seyveo-calendar-events-v1').filter(e=>
      e&&typeof e.id==='string'&&typeof e.title==='string'&&e.title.trim()&&
      !e.done&&e.kind!=='business'&&validDate(e.date)&&e.date===today)
      .map(e=>({key:'calendar:'+e.id,id:e.id,kind:'event',title:e.title.trim().slice(0,140),
        date:e.date,time:clock(e.time),notes:''}));
    return [...tasks,...events].filter(item=>includePostponed||!(Number(later[item.key])>now))
      .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99'));
  }
  function postponedHomeItems(){
    const later=homeLaterMap(),now=Date.now();
    return upcomingHomeItems(true).filter(item=>Number(later[item.key])>now)
      .map(item=>({...item,until:Number(later[item.key])}))
      .sort((a,b)=>a.until-b.until);
  }
  function homePostponementChanged(){
    window.dispatchEvent(new Event('seyveo:home-task-postponement-changed'));
    queueTodayRefresh();
  }
  function restoreHomeItem(item){
    if(!item)return;
    try{
      const later=homeLaterMap();
      delete later[item.key];
      localStorage.setItem(homeLaterKey,JSON.stringify(later));
    }catch{}
    homePostponementChanged();
  }
  function postponeHomeItem(item){
    if(!item)return;
    try{
      const fresh=Object.fromEntries(Object.entries(homeLaterMap())
        .filter(([,until])=>Number(until)>Date.now()).slice(-120));
      fresh[item.key]=Date.now()+60*60*1000;
      localStorage.setItem(homeLaterKey,JSON.stringify(fresh));
    }catch{}
    homePostponementChanged();
  }
  function homeItemWhen(item){
    const date=item.date===todayKey()?'Сегодня':
      new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date(item.date+'T12:00:00'));
    return date+(item.time?' · '+item.time:'');
  }
  function renderToday(){
    if(!done)return;
    if(!todayCard){
      todayCard=document.createElement('section');
      todayCard.className='sv-sayvi-handoff-today sv-home-real-task';
      todayCard.setAttribute('aria-label','Настоящее дело на главной');
      todayCard.innerHTML='<div class="sv-home-task-top"><span class="sv-home-task-eyebrow">СЭЙВИ · ВАШЕ ДЕЛО</span><span class="sv-home-task-count"></span></div>'+
        '<div class="sv-home-task-main"><span class="sv-home-task-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M8 8.5h8M8 12h6M8 15.5h4"/></svg></span>'+
        '<div class="sv-home-task-copy"><strong class="sv-home-task-title"></strong><span class="sv-home-task-meta"></span></div></div>'+
        '<p class="sv-home-task-note" hidden></p>'+
        '<div class="sv-home-task-actions" role="group" aria-label="Действия с делом">'+
        '<button type="button" data-sv-home-action="details" aria-label="Подробнее о деле" title="Подробнее"><span class="sv-home-task-action-icon"><svg viewBox="0 0 24 24"><path d="M6 18 18 6M8 6h10v10"/></svg></span><span class="sv-home-task-action-label">Подробнее</span></button>'+
        '<button type="button" data-sv-home-action="complete" aria-label="Отметить дело выполненным" title="Исполнить"><span class="sv-home-task-action-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/></svg></span><span class="sv-home-task-action-label">Исполнить</span></button>'+
        '<button type="button" data-sv-home-action="later" aria-label="Отложить карточку на час" title="Убрать на час"><span class="sv-home-task-action-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg></span><span class="sv-home-task-action-label">Позже · 1 ч</span></button></div>'+
        '<p class="sv-home-task-status" role="status" aria-live="polite" hidden></p>';
      todayCard.addEventListener('click',event=>{
        const button=event.target.closest('button[data-sv-home-action]');
        if(!button||!currentHomeItem)return;
        const item=currentHomeItem,action=button.dataset.svHomeAction;
        if(action==='later'){postponeHomeItem(item);return;}
        if(action==='details'){
          if(item.kind==='task')window.dispatchEvent(new CustomEvent('seyveo:home-task-open',{detail:{id:item.id}}));
          else location.hash='#calendar';
          return;
        }
        if(action==='complete'&&item.kind==='task'){
          const detail={id:item.id};
          window.dispatchEvent(new CustomEvent('seyveo:home-task-complete',{detail}));
          if(detail.result?.ok){queueTodayRefresh();}
          else{
            const status=todayCard.querySelector('.sv-home-task-status');
            status.textContent=detail.result?.message||'Не удалось завершить дело. Попробуйте открыть «Дела».';
            status.hidden=false;
          }
        }
      });
      let finger=null;
      todayCard.addEventListener('touchstart',event=>{
        if(event.touches.length!==1||event.target.closest('button')){finger=null;return;}
        finger={x:event.touches[0].clientX,y:event.touches[0].clientY};
      },{passive:true});
      todayCard.addEventListener('touchend',event=>{
        if(!finger||event.changedTouches.length!==1)return;
        const dx=event.changedTouches[0].clientX-finger.x;
        const dy=event.changedTouches[0].clientY-finger.y;
        finger=null;
        if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)postponeHomeItem(currentHomeItem);
      },{passive:true});
      document.getElementById('stage')?.after(todayCard);
      postponedCard=document.createElement('aside');
      postponedCard.className='sv-home-task-postponed';
      postponedCard.setAttribute('aria-label','Отложенная карточка дела');
      postponedCard.innerHTML='<span class="sv-home-task-postponed-text" role="status"></span><button type="button" aria-label="Вернуть отложенную карточку сейчас">Вернуть</button>';
      postponedCard.querySelector('button').addEventListener('click',()=>restoreHomeItem(currentPostponedItem));
      todayCard.after(postponedCard);
    }
    const items=upcomingHomeItems(),item=items[0]||null;
    currentHomeItem=item;
    todayCard.hidden=!item;
    const postponed=postponedHomeItems();
    currentPostponedItem=postponed[0]||null;
    postponedCard.hidden=!currentPostponedItem;
    if(currentPostponedItem){
      const until=new Date(currentPostponedItem.until).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
      const more=postponed.length>1?' · ещё '+(postponed.length-1):'';
      postponedCard.querySelector('.sv-home-task-postponed-text').textContent='«'+currentPostponedItem.title+'» · отложено до '+until+more;
    }
    if(!item)return;
    todayCard.querySelector('.sv-home-task-eyebrow').textContent=item.kind==='event'?'СЭЙВИ · ВАША ВСТРЕЧА':'СЭЙВИ · ВАШЕ ДЕЛО';
    todayCard.querySelector('.sv-home-task-title').textContent=item.title;
    todayCard.querySelector('.sv-home-task-meta').textContent=homeItemWhen(item);
    todayCard.querySelector('.sv-home-task-count').textContent=items.length>1?'1 из '+items.length:'';
    const note=todayCard.querySelector('.sv-home-task-note');
    note.hidden=!item.notes;
    note.textContent=item.notes;
    todayCard.querySelector('[data-sv-home-action="complete"]').hidden=item.kind!=='task';
    const status=todayCard.querySelector('.sv-home-task-status');
    status.hidden=true;status.textContent='';
  }
  // Recommendations, cards and tasks can change after docking. Keep the
  // nearest real item in sync instead of freezing the visibility at launch.
  let todayRefreshPending=false;
  function queueTodayRefresh(){
    if(!done||todayRefreshPending)return;
    todayRefreshPending=true;
    requestAnimationFrame(()=>{
      todayRefreshPending=false;
      if(!home.hidden)renderToday();
      syncIdleHome();
    });
  }
  ['seyveoLivingMoment','dynamic'].forEach(id=>{
    const container=document.getElementById(id);
    if(container&&typeof MutationObserver!=='undefined'){
      new MutationObserver(queueTodayRefresh).observe(container,{
        childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']
      });
    }
  });
  ['seyveo:tasks-changed','seyveo:personal-tasks-changed','seyveo:life-events-changed',
    'seyveo:calendar-changed','seyveo:home-recommendation-changed',
    'seyveo:home-agenda-visibility-changed']
    .forEach(type=>window.addEventListener(type,queueTodayRefresh));
  window.addEventListener('focus',queueTodayRefresh);
  window.addEventListener('hashchange',queueTodayRefresh);
  window.addEventListener('resize',queueTodayRefresh);
  window.addEventListener('storage',event=>{
    if(['seyveo-personal-tasks-v1','seyveo-calendar-events-v1',homeAgendaKey,homeLaterKey].includes(event.key)){
      if(event.key===homeAgendaKey&&homeAgendaSwitch)homeAgendaSwitch.checked=homeAgendaEnabled();
      queueTodayRefresh();
    }
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueTodayRefresh();});

  if(typeof MutationObserver!=='undefined'){
    new MutationObserver(syncIdleHome).observe(home,{attributes:true,attributeFilter:['hidden']});
    new MutationObserver(updateClusterInteraction).observe(root,{attributes:true,attributeFilter:['class']});
  }
  // Pick up the change of day even when the PWA stays open overnight.
  setInterval(()=>{if(done&&!document.hidden)queueTodayRefresh();},60000);

  function finish({spark=false}={}){
    if(done)return;
    done=true;
    voiceButton?.remove();
    voiceButton=null;
    voiceFileInput?.remove();
    voiceFileInput=null;
    if(voiceDownload)voiceDownload.hidden=false;
    clearTimeout(voiceFallbackTimer);
    if(voiceMedia){
      voiceMedia.pause();
      voiceMedia.onplaying=null;
      voiceMedia.onended=null;
      voiceMedia.onerror=null;
      voiceMedia=null;
    }
    if(voiceFileUrl){URL.revokeObjectURL(voiceFileUrl);voiceFileUrl=null;}
    clearTimeout(greetingDelay);
    clearTimeout(greetingTicker);
    greeting?.remove();
    greeting=null;
    root.classList.remove('sv-cinema-greeting-active');
    root.classList.remove('sv-cinema-boot');
    clearTimeout(introTimer);
    clearTimeout(safetyTimer);
    if(spark)root.classList.add('sv-cinema-stagger-enter');
    root.classList.add('sv-sayvi-handoff-docked');
    syncIdleHome();
    if(spark)root.classList.add('sv-sayvi-handoff-arrived');
    restoreOrb();
    restoreDock();
    if(smallOpacity)small.style.setProperty('opacity',smallOpacity,smallOpacityPriority);
    else small.style.removeProperty('opacity');
    root.classList.remove('sv-sayvi-handoff-inflight');
    updateClusterInteraction();
    if(spark){
      const flash=document.createElement('span');
      flash.className='sv-cinema-dock-spark';
      flash.setAttribute('aria-hidden','true');
      const target=small.getBoundingClientRect();
      // The full-size white star must be exactly concentric with docked Sayvi.
      flash.style.left=`${target.left+target.width/2}px`;
      flash.style.top=`${target.top+target.height/2}px`;
      document.body.appendChild(flash);
      setTimeout(()=>flash.remove(),1100);
    }
    rememberOpening();
    renderToday();
    beginHomeGreetingLifetime();
    // Remove animation control once every delayed card has settled, so any
    // later live updates keep their normal transitions and touch behaviour.
    if(spark)setTimeout(()=>root.classList.remove('sv-cinema-stagger-enter'),2800);
    setTimeout(()=>root.classList.remove('sv-sayvi-handoff-arrived'),850);
    window.dispatchEvent(new Event('seyveo:cinema-finished'));
  }

  function begin(){
    if(done)return;
    // With no work due today, Sayvi stays in the Home scene; no pointless
    // flight into the dock followed by an immediate return.
    if(shouldKeepSphereHome()){finish();return;}
    if(document.hidden||!atHome||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    // Address bars and safe-area insets may settle during the long logo scene.
    // Measure the dock again immediately before beginning the actual flight.
    prepareDock();
    const from=orb.getBoundingClientRect();
    if(!from.width){finish();return;}
    const to=small.getBoundingClientRect();
    const centerX=from.left+from.width/2,centerY=from.top+from.height/2;
    const targetX=dockMetrics?dock.getBoundingClientRect().left+dockMetrics.slot*3.5:to.left+to.width/2;
    const targetY=to.top+to.height/2;
    const dx=targetX-centerX,dy=targetY-centerY;
    const finalScale=52/from.width;

    // Lift the original painted orb above clipping contexts. Its final scale
    // matches the exact same SVG in the dock; there is no substitute animation.
    originalOrbStyle=orb.getAttribute('style')||'';
    document.body.appendChild(orb);
    orb.classList.add('sv-sayvi-handoff-flight');
    for(const [name,value] of Object.entries({
      left:`${from.left}px`,top:`${from.top}px`,
      width:`${from.width}px`,height:`${from.height}px`
    }))orb.style.setProperty(name,value,'important');
    orb.style.setProperty('transform','none');
    root.classList.add('sv-sayvi-handoff-inflight');
    // Unveil the fourth slot while Sayvi is still travelling. The capsule
    // completes its long, smooth expansion just before the sphere docks.
    growDock(180*speed,3650*speed);

    requestAnimationFrame(()=>{
      if(done)return;
      try{
        const land=`translate3d(${dx}px,${dy}px,0) scale(${finalScale})`;
        animation=orb.animate([
          // A single physically continuous curve avoids jumps in velocity at
          // intermediate keyframes; the miniature remains a complete sphere.
          {offset:0,transform:'translate3d(0,0,0) scale(1)',opacity:1},
          {offset:1,transform:land,opacity:1}
        ],{duration:4200*speed,easing:'cubic-bezier(.45,0,.16,1)',fill:'forwards'});
        safetyTimer=setTimeout(()=>finish({spark:true}),4850*speed);
        animation.finished.then(()=>finish({spark:true})).catch(()=>{});
      }catch{finish();}
    });
  }

  function runOpening({waitForNarration=false}={}){
    if(done)return;
    prepareDock();
    root.classList.remove('sv-cinema-boot');
    // The artwork is already loaded. Changing its URL on voice playback
    // caused a brief white/dark flash before the first spoken word.
    openingStartedAt=performance.now();
    startGreeting();
    // Both written and spoken greetings are allowed to finish naturally.
    narrationComplete=!waitForNarration;
    scheduleFlightWhenReady();
  }

  function showLocalVoicePreview(){
    // Read the owner's exact approved 3.36-second WAV from the loopback server.
    // The browser is allowed to play it immediately if its autoplay policy
    // permits. If Edge blocks spoken autoplay, show one explicit play control.
    // No voice sample is committed to the public website or regenerated.
    voiceButton=document.createElement('button');
    voiceButton.type='button';
    voiceButton.className='sv-cinema-local-voice';
    voiceButton.textContent='▶ Включить голос Сэйви';
    voiceButton.setAttribute('aria-label','Воспроизвести заставку с фирменным голосом Сэйви');
    voiceButton.hidden=true;
    document.body.appendChild(voiceButton);
    voiceMedia=new Audio('/api/seyveo-approved-welcome');
    voiceMedia.preload='auto';
    voiceMedia.onplaying=()=>{
      if(done||openingStartedAt)return;
      clearTimeout(voiceFallbackTimer);
      voiceButton?.remove();voiceButton=null;
      voiceDownload=document.createElement('a');
      voiceDownload.className='sv-cinema-local-voice-download';
      voiceDownload.href='/api/seyveo-approved-welcome';
      voiceDownload.download='SEYVEO-Sayvi-welcome.wav';
      voiceDownload.textContent='↓ Скачать приветствие Сэйви';
      voiceDownload.hidden=true;
      document.body.appendChild(voiceDownload);
      // Start the written scene at the first audible audio frame, with no
      // synthetic one-second silence or image reload.
      runOpening({waitForNarration:true});
    };
    voiceMedia.onended=()=>{
      if(done)return;
      narrationComplete=true;
      scheduleFlightWhenReady();
    };
    const fallback=(error)=>{
      if(done||!voiceButton)return;
      clearTimeout(voiceFallbackTimer);
      console.warn('[SEYVEO Cinema] Фирменный голос недоступен:',error?.message||error);
      voiceButton.dataset.fallback='silent';
      voiceButton.textContent='Голос недоступен · Смотреть без звука';
      voiceButton.title=String(error?.message||error).slice(0,180);
      voiceButton.hidden=false;
    };
    voiceMedia.onerror=()=>fallback(Error('Не удалось открыть локальную запись Сэйви.'));
    const play=()=>{
      if(done||!voiceMedia)return;
      voiceMedia.play().catch(error=>{
        if(done||!voiceButton)return;
        if(error?.name==='NotAllowedError'){
          // Edge requires a user gesture on some sites and profiles.
          clearTimeout(voiceFallbackTimer);
          voiceButton.hidden=false;
          voiceButton.disabled=false;
        }else fallback(error);
      });
    };
    voiceButton.addEventListener('click',()=>{
      if(done||!voiceButton)return;
      if(voiceButton.dataset.fallback==='silent'){
        voiceButton.remove();voiceButton=null;
        runOpening();return;
      }
      voiceButton.disabled=true;
      voiceButton.textContent='Готовлю приветствие Сэйви…';
      // Play is initiated synchronously inside the Edge gesture handler.
      play();
    });
    // If a slow local drive stalls, keep the preview usable rather than
    // leaving the owner on a blank, non-interactive opening indefinitely.
    voiceFallbackTimer=setTimeout(()=>{
      if(!done&&voiceButton&&openingStartedAt===0)voiceButton.hidden=false;
    },1800);
    play();
  }

  // Safari cannot read the owner's PC Downloads. One-time local import lets
  // the owner hear the same approved recording on their iPhone without making
  // the voice sample publicly downloadable on GitHub Pages. IndexedDB belongs
  // to the current Safari/PWA installation, never to our server.
  function privateVoiceDatabase(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(Error('Локальное хранение файлов недоступно.'));return;}
      const request=indexedDB.open('seyveo-private-cinema-v1',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('recordings');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||Error('Не удалось открыть хранилище Сэйви.'));
    });
  }
  async function privateVoiceGet(){
    const db=await privateVoiceDatabase();
    try{return await new Promise((resolve,reject)=>{
      const transaction=db.transaction('recordings','readonly');
      const request=transaction.objectStore('recordings').get('approved-welcome');
      request.onsuccess=()=>resolve(request.result instanceof Blob?request.result:null);
      request.onerror=()=>reject(request.error||Error('Не удалось прочитать запись Сэйви.'));
    });}finally{db.close();}
  }
  async function privateVoiceSave(blob){
    const db=await privateVoiceDatabase();
    try{await new Promise((resolve,reject)=>{
      const transaction=db.transaction('recordings','readwrite');
      transaction.objectStore('recordings').put(blob,'approved-welcome');
      transaction.oncomplete=resolve;
      transaction.onerror=()=>reject(transaction.error||Error('Не удалось сохранить запись Сэйви.'));
      transaction.onabort=()=>reject(transaction.error||Error('Запись не сохранена.'));
    });}finally{db.close();}
  }
  async function verifyAndCleanPrivateVoice(file){
    if(!file||file.size<44||file.size>500000)throw Error('Выбери короткий утверждённый WAV Сэйви.');
    if(!crypto.subtle)throw Error('Для проверки записи нужен защищённый HTTPS.');
    const bytes=await file.arrayBuffer();
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const signature=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
    if(signature!=='84776078a50c3cda79aa977712bd593905f369d545f78c5f9b17a9ea1f004a7d'){
      throw Error('Это другая запись. Выбери SEYVEO-Sayvi-welcome.wav.');
    }
    const view=new DataView(bytes),ascii=(start,end)=>String.fromCharCode(...new Uint8Array(bytes,start,end-start));
    if(ascii(0,4)!=='RIFF'||ascii(8,12)!=='WAVE'||ascii(12,16)!=='fmt '||
       view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||
       view.getUint16(22,true)!==1||view.getUint32(24,true)!==24000||
       view.getUint16(34,true)!==16||ascii(36,40)!=='data'||
       view.getUint32(40,true)!==bytes.byteLength-44){
      throw Error('Неподдерживаемый формат WAV.');
    }
    // Match the private PC server: remove the noisy 400 ms pre-roll, keep the
    // 78 ms before the first word, and fade in only during that silence.
    const trimBytes=24000*2*.4;
    const clean=new Uint8Array(bytes.byteLength-trimBytes);
    clean.set(new Uint8Array(bytes,0,44));
    clean.set(new Uint8Array(bytes,44+trimBytes),44);
    const out=new DataView(clean.buffer);
    out.setUint32(4,clean.length-8,true);
    out.setUint32(40,clean.length-44,true);
    const fadeSamples=Math.round(24000*.045);
    for(let i=0;i<fadeSamples;i++){
      const offset=44+i*2;
      out.setInt16(offset,Math.round(out.getInt16(offset,true)*i/fadeSamples),true);
    }
    return new Blob([clean],{type:'audio/wav'});
  }
  function showPrivateFileVoicePreview(){
    voiceButton=document.createElement('button');
    voiceButton.type='button';
    voiceButton.className='sv-cinema-local-voice';
    voiceButton.hidden=true;
    voiceButton.disabled=true;
    voiceButton.textContent='Подключаю голос Сэйви…';
    document.body.appendChild(voiceButton);
    voiceFileInput=document.createElement('input');
    voiceFileInput.type='file';
    voiceFileInput.accept='.wav,audio/wav';
    voiceFileInput.hidden=true;
    document.body.appendChild(voiceFileInput);
    const importControl=(message='↓ Выбрать голос Сэйви')=>{
      if(done||!voiceButton)return;
      voiceButton.dataset.mode='import';
      voiceButton.textContent=message;
      voiceButton.disabled=false;
      voiceButton.hidden=false;
    };
    const play=()=>{
      if(!voiceMedia||done)return;
      voiceMedia.play().catch(error=>{
        if(done||!voiceButton)return;
        if(error?.name==='NotAllowedError'){
          // iOS Safari only permits spoken playback after a direct tap.
          voiceButton.dataset.mode='play';
          voiceButton.textContent='▶ Включить голос Сэйви';
          voiceButton.disabled=false;
          voiceButton.hidden=false;
        }else importControl('Не удалось воспроизвести · Выбрать WAV снова');
      });
    };
    const useRecording=blob=>{
      if(done)return;
      if(voiceMedia){voiceMedia.pause();voiceMedia=null;}
      if(voiceFileUrl)URL.revokeObjectURL(voiceFileUrl);
      voiceFileUrl=URL.createObjectURL(blob);
      voiceMedia=new Audio(voiceFileUrl);
      voiceMedia.preload='auto';
      voiceMedia.onplaying=()=>{
        if(done||openingStartedAt)return;
        voiceButton?.remove();voiceButton=null;
        voiceFileInput?.remove();voiceFileInput=null;
        runOpening({waitForNarration:true});
      };
      voiceMedia.onended=()=>{
        if(done)return;
        narrationComplete=true;
        scheduleFlightWhenReady();
      };
      voiceMedia.onerror=()=>importControl('Голос недоступен · Выбрать WAV снова');
      play();
    };
    voiceFileInput.addEventListener('change',async()=>{
      const file=voiceFileInput?.files?.[0];
      if(!file||done)return;
      voiceButton.disabled=true;
      voiceButton.textContent='Проверяю фирменный голос…';
      try{
        const recording=await verifyAndCleanPrivateVoice(file);
        await privateVoiceSave(recording);
        try{localStorage.setItem('seyveo-private-voice-ready-v1','1');}catch{}
        if(!done)useRecording(recording);
      }catch(error){
        console.warn('[SEYVEO Cinema] Не удалось импортировать голос:',error?.message||error);
        importControl('Нужна утверждённая запись · Выбрать снова');
        if(voiceButton)voiceButton.title=String(error?.message||error).slice(0,180);
      }finally{if(voiceFileInput)voiceFileInput.value='';}
    });
    voiceButton.addEventListener('click',()=>{
      if(done||!voiceButton)return;
      if(voiceButton.dataset.mode==='import'){voiceFileInput?.click();return;}
      voiceButton.disabled=true;
      voiceButton.textContent='Готовлю приветствие Сэйви…';
      play();
    });
    privateVoiceGet().then(recording=>{
      if(done)return;
      if(recording)useRecording(recording);
      else importControl();
    }).catch(error=>{
      console.warn('[SEYVEO Cinema] Локальный голос недоступен:',error?.message||error);
      importControl('↓ Выбрать голос Сэйви');
    });
  }

  // Once per local day: greet on Home, fly into the dock only when the
  // real cards leave too little room for a living sphere.
  const launch=()=>{
    if(!showCinema||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    if(document.hidden){
      // iOS can construct a standalone Web App while it is still backgrounded.
      // Do not burn the opening before the first visible frame is possible.
      const onVisible=()=>{
        if(document.hidden)return;
        document.removeEventListener('visibilitychange',onVisible);
        requestAnimationFrame(launch);
      };
      document.addEventListener('visibilitychange',onVisible);
      return;
    }
    // When real work fits beside Sayvi, Home is already the destination.
    // Do not show a second written intro or resize the sphere twice.
    if(shouldKeepSphereHome()&&!voiceRequested){finish();return;}
    if(localVoicePreview){
      prepareDock();
      root.classList.remove('sv-cinema-boot');
      showLocalVoicePreview();
    }else if(fileVoicePreview){
      prepareDock();
      root.classList.remove('sv-cinema-boot');
      showPrivateFileVoicePreview();
    }else runOpening();
  };
  // The script is at the end of <body>; do not wait for slow images or audio.
  // A pending window.load was able to postpone the old preview indefinitely.
  requestAnimationFrame(launch);
  window.addEventListener('hashchange',()=>{
    if(!done&&location.hash&&location.hash!=='#home')finish();
    if(location.hash&&location.hash!=='#home')root.classList.remove('sv-cinema-stagger-enter');
  });
  window.addEventListener('pagehide',()=>{
    if(!done)finish();
  });
  let lastViewportWidth=window.innerWidth;
  window.addEventListener('resize',()=>{
    const widthChange=Math.abs(window.innerWidth-lastViewportWidth);
    lastViewportWidth=window.innerWidth;
    // iOS browser chrome often changes only the height during startup; that
    // must not cut off the artwork. A genuine width/orientation change during
    // flight is different: settle safely on the real dock target.
    if(!done&&animation&&widthChange>44)finish();
  });
  // Any tap/click immediately opens the functional Home. Consume the same
  // gesture so a skip cannot accidentally activate a dock button or a card.
  let skipClickUntil=0;
  document.addEventListener('pointerdown',event=>{
    if(done)return;
    if((localVoicePreview||fileVoicePreview)&&event.target.closest('.sv-cinema-local-voice'))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    skipClickUntil=Date.now()+650;
    finish();
  },{capture:true,passive:false});
  document.addEventListener('click',event=>{
    if(Date.now()<skipClickUntil){event.preventDefault();event.stopImmediatePropagation();}
  },{capture:true});
  for(const name of ['seyveo:route-changed','seyveo:tasks-changed','seyveo:calendar-changed'])
    window.addEventListener(name,renderToday);

  // SEYVEO Sound · ambient Home. Only a real playing music session may bring
  // the large ORIGINAL orb back, and only while Home is in front. It never
  // creates another player, another dock, or another copy of Sayvi.
  const musicAudio=document.getElementById('sayviMusicAudio');
  const musicMini=document.getElementById('sayviMusicMini');
  const ambientIdleMs=40000;
  let ambientTimer=0;
  let ambient=false;
  let ambientLeaving=false;
  let ambientMotion=null;
  let ambientGeneration=0;
  let ambientRoute=location.hash||'#home';
  let ambientTicket=0;
  const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function musicIsPlaying(){
    return !!musicAudio&&!!musicAudio.src&&!musicAudio.paused&&!musicAudio.ended&&!musicAudio.error;
  }
  function canShowMusicAmbient(){
    if(!done||ambientLeaving||document.hidden||home.hidden||
       (location.hash&&location.hash!=='#home')||
       !musicIsPlaying()||!musicMini||musicMini.hidden||
       root.classList.contains('seyveo-conversation')||
       document.querySelector('dialog[open]')||
       document.activeElement?.matches('input,textarea,[contenteditable="true"]'))return false;
    const composer=document.getElementById('ask');
    return !composer||composer.hidden;
  }
  function cancelAmbientTimer(){
    clearTimeout(ambientTimer);ambientTimer=0;
    ambientTicket++;
  }
  function scheduleMusicAmbient(delay=ambientIdleMs){
    cancelAmbientTimer();
    if(ambient||!canShowMusicAmbient())return;
    const ticket=ambientTicket;
    ambientTimer=setTimeout(()=>{
      ambientTimer=0;
      if(ticket===ambientTicket)enterMusicAmbient();
    },delay);
  }
  function restoreAmbientMotion(){
    ambientMotion?.cancel();
    ambientMotion=null;
  }
  function enterMusicAmbient(){
    if(ambient||!canShowMusicAmbient())return;
    cancelAmbientTimer();
    ambient=true;
    ambientGeneration++;
    root.classList.remove('sv-music-ambient-leaving');
    root.classList.add('sv-music-ambient');
    // Measure both states after the settled layout; the sphere rises from
    // exactly the existing assistant position rather than an invented point.
    const to=orb.getBoundingClientRect();
    const from=small.getBoundingClientRect();
    if(!reduceMotion()&&to.width&&from.width&&typeof orb.animate==='function'){
      const dx=from.left+from.width/2-(to.left+to.width/2);
      const dy=from.top+from.height/2-(to.top+to.height/2);
      const scale=Math.min(1,from.width/to.width);
      try{
        restoreAmbientMotion();
        const motion=orb.animate([
          {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`,opacity:.98},
          {transform:'translate3d(0,0,0) scale(1)',opacity:1}
        ],{duration:1320,easing:'cubic-bezier(.2,.72,.16,1)',fill:'both'});
        ambientMotion=motion;
        motion.finished.then(()=>{
          if(ambientMotion===motion)restoreAmbientMotion();
        }).catch(()=>{});
      }catch{/* The static orb remains usable without Web Animations. */}
    }
  }
  function leaveMusicAmbient({animate=true,afterTap=false}={}){
    cancelAmbientTimer();
    if(!ambient){
      // A route change or playback stop must also cancel a return flight that
      // is still in progress. Never leave the dock masked on another screen.
      if(ambientLeaving&&!animate){
        ambientGeneration++;
        ambientLeaving=false;
        restoreAmbientMotion();
        root.classList.remove('sv-music-ambient','sv-music-ambient-leaving');
      }
      return;
    }
    ambient=false;
    const generation=++ambientGeneration;
    restoreAmbientMotion();
    const settle=()=>{
      if(generation!==ambientGeneration)return;
      root.classList.remove('sv-music-ambient','sv-music-ambient-leaving');
      ambientLeaving=false;
      restoreAmbientMotion();
      if(afterTap&&!home.hidden){
        root.classList.add('sv-cinema-stagger-enter');
        setTimeout(()=>root.classList.remove('sv-cinema-stagger-enter'),2800);
      }
      if(canShowMusicAmbient())scheduleMusicAmbient();
    };
    if(!animate||reduceMotion()||!musicIsPlaying()||home.hidden||typeof orb.animate!=='function'){
      settle();return;
    }
    const from=orb.getBoundingClientRect();
    const to=small.getBoundingClientRect();
    if(!from.width||!to.width){settle();return;}
    ambientLeaving=true;
    root.classList.add('sv-music-ambient-leaving');
    const dx=to.left+to.width/2-(from.left+from.width/2);
    const dy=to.top+to.height/2-(from.top+from.height/2);
    const scale=Math.min(1,to.width/from.width);
    try{
      const motion=orb.animate([
        {transform:'translate3d(0,0,0) scale(1)',opacity:1},
        {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`,opacity:1}
      ],{duration:1150,easing:'cubic-bezier(.44,0,.16,1)',fill:'forwards'});
      ambientMotion=motion;
      let settled=false;
      const complete=()=>{
        if(settled)return;
        settled=true;settle();
      };
      motion.finished.then(complete).catch(complete);
      setTimeout(complete,1450);
    }catch{settle();}
  }
  // A touch dismisses only the ambient artwork; the first touch cannot
  // accidentally trigger an underlying task or dock action. Mini-player
  // transport controls remain live and retain the current audio session.
  document.addEventListener('pointerdown',event=>{
    if(!ambient){
      if(canShowMusicAmbient())scheduleMusicAmbient();
      return;
    }
    if(event.target.closest('#sayviMusicMini')){
      leaveMusicAmbient({animate:false});
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    skipClickUntil=Date.now()+700;
    leaveMusicAmbient({animate:true,afterTap:true});
  },{capture:true,passive:false});
  document.addEventListener('keydown',()=>{
    if(ambient)leaveMusicAmbient({animate:false});
    else if(canShowMusicAmbient())scheduleMusicAmbient();
  },{capture:true});
  function syncAmbientRoute(){
    const route=location.hash||'#home';
    if(route===ambientRoute)return;
    const fromMusic=ambientRoute==='#sayvi-music'&&route==='#home';
    ambientRoute=route;
    if(route!=='#home'){
      leaveMusicAmbient({animate:false});
      cancelAmbientTimer();
      return;
    }
    if(fromMusic){
      // Let the existing route switch reveal Home and the mini-player first.
      scheduleMusicAmbient(280);
    }else scheduleMusicAmbient();
  }
  window.addEventListener('hashchange',syncAmbientRoute);
  window.addEventListener('seyveo:route-changed',syncAmbientRoute);
  window.addEventListener('seyveo:cinema-finished',()=>scheduleMusicAmbient());
  document.addEventListener('seyveo:music-state',event=>{
    if(!event.detail?.playing){leaveMusicAmbient({animate:false});return;}
    // Music's own route synchronization may fire twice. Do not replace the
    // short return-from-player timer with a full 40-second idle delay.
    if(!ambient&&!ambientTimer)scheduleMusicAmbient();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){leaveMusicAmbient({animate:false});cancelAmbientTimer();}
    else if(canShowMusicAmbient())scheduleMusicAmbient();
  });
})();
