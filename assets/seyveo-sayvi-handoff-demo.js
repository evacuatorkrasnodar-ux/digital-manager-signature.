/* SEYVEO Home sphere and dock continuity.
   This module keeps the real Home orb, agenda and three/four-button dock in
   sync. The public startup loading screen was removed; only an explicitly
   requested local voice demo can use the former welcome transition. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const noIntro=params.get('sayvi-intro')==='0';
  const speed=params.get('sayvi-slow')==='1'?1.8:1;
  const openingDuration=5700;
  const voiceRequested=params.get('sayvi-voice')==='1';
  const localVoicePreview=voiceRequested&&location.origin==='http://127.0.0.1:8790';
  const fileVoicePreview=!localVoicePreview&&voiceRequested;
  const atHome=!location.hash||location.hash==='#home';
  const showCinema=atHome&&!noIntro&&voiceRequested;
  const root=document.documentElement;
  root.classList.add('sv-sayvi-handoff-demo');
  const home=document.getElementById('homePage');
  const orb=document.getElementById('orb');
  const heroArtwork=document.getElementById('plasmaVisual');
  const dockButton=document.getElementById('assistantButton');
  const small=dockButton?.querySelector('.sv-sayvi-velvet-sphere');
  const dock=dockButton?.closest('footer.dock');
  if(!home||!orb||!dockButton||!small){
    root.classList.remove('sv-sayvi-handoff-demo');
    return;
  }
  // Restore the approved top-of-Home presence line independently of greeting.
  if(!home.querySelector('.sv-sayvi-home-online')){
    const online=document.createElement('div');
    online.className='sv-sayvi-home-online';
    online.textContent='Сэйви · на связи';
    home.prepend(online);
  }
  // The opening is a quiet, personalized written introduction. The ordinary
  // Home greeting (and its live task context) returns after the handoff.
  const message=home.querySelector('#stage > .message');
  let greeting=null;
  let greetingDelay=0;
  let greetingTicker=0;
  let startGreeting=()=>{};
  let welcomeSpeech='';
  if(showCinema&&message){
    // The opening greeting is complete, instantly readable, and restrained.
    // Sayvi's approved orbital entrance and voice remain unchanged.
    welcomeSpeech='Привет! Рада тебя видеть!';
    greeting=document.createElement('p');
    greeting.className='sv-cinema-written-hello';
    greeting.setAttribute('aria-label',welcomeSpeech);
    greeting.setAttribute('aria-live','off');
    const writing=document.createElement('span');
    writing.className='sv-cinema-written-line sv-cinema-written-line--plain';
    writing.textContent=welcomeSpeech;
    greeting.appendChild(writing);
    message.appendChild(greeting);
    root.classList.add('sv-cinema-greeting-active');
    startGreeting=()=>{
      greetingDelay=setTimeout(()=>{
        if(done||!greeting)return;
        greeting.classList.add('sv-cinema-written-hello--visible');
      },160);
    };
  }
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
  let safetyTimer=0;
  let dockTimer=0;
  let dockMetrics=null;
  let dockStyleBefore=null;
  let todayCard=null;
  let voiceButton=null;
  let voiceDownload=null;
  let voiceMedia=null;
  let voiceFallbackTimer=0;
  let voiceFileInput=null;
  let voiceFileUrl=null;
  let openingStartedAt=0;
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
    setTimeout(()=>root.classList.add('sv-home-greeting-expired'),fadeMs);
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
    // Empty Home greets first, then hands the same visual space to weather.
    // Pending-card Home retains its original greeting lifetime.
    const lifetime=root.classList.contains('sv-home-empty-sphere')?homeGreetingMinMs:homeGreetingMaxMs;
    homeGreetingDeadline=homeGreetingStartedAt+lifetime;
    homeGreetingTimer=setTimeout(expireHomeGreeting,lifetime);
  }
  window.addEventListener('seyveo:home-sayvi-arrived',()=>{
    if(root.classList.contains('sv-home-empty-sphere')&&homeGreetingStartedAt&&!homeGreetingDismissed)
      engageHomeGreeting();
  });
  // On an entirely empty, idle Home, a rare quiet suggestion may gently
  // replace the welcome after one minute without interrupting any card.
  window.addEventListener('seyveo:home-idle-prompt',()=>{
    if(done&&!home.hidden&&root.classList.contains('sv-home-empty-sphere'))
      expireHomeGreeting();
  });
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
    const homeNav=dock.querySelector('#navHome')?.getBoundingClientRect();
    const sayviNav=dockButton.getBoundingClientRect();
    // Read the grid tracks, not the shrinking ::before pearl surface.
    // Its max-width is smaller while the dock is short.
    const gridFull=homeNav?.width&&sayviNav.width
      ?(sayviNav.left+sayviNav.width/2-homeNav.left-homeNav.width/2)*4/3:0;
    const full=gridFull>140?gridFull:parseFloat(getComputedStyle(dock,'::before').width);
    if(!Number.isFinite(full)||full<140)return;
    dockMetrics={full,slot:full/4};
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
  const storeList=key=>{
    try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}
    catch{return [];}
  };
  function nextAgenda(){
    const today=new Date(),iso=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
    const validTime=value=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    const tasks=storeList('seyveo-personal-tasks-v1').filter(item=>item&&!item.done&&item.showOnHome!==false&&typeof item.title==='string')
      .map(item=>({title:item.title.slice(0,140),date:validDate(item.due)?item.due:'',time:validTime(item.time)?item.time:''}));
    const events=storeList('seyveo-calendar-events-v1').filter(item=>item&&typeof item.title==='string'&&validDate(item.date))
      .map(item=>({title:item.title.slice(0,140),date:item.date,time:validTime(item.time)?item.time:''}));
    const upcoming=[...tasks,...events].filter(item=>item.title.trim()&&(!item.date||item.date>=iso));
    upcoming.sort((a,b)=>(a.date||'9999-12-31').localeCompare(b.date||'9999-12-31')||(a.time||'99:99').localeCompare(b.time||'99:99'));
    return upcoming[0]||null;
  }
  function renderToday(){
    if(!done)return;
    const living=document.getElementById('seyveoLivingMoment');
    const advice=document.getElementById('dynamic');
    const hasRealCard=(living&&!living.hidden)||(advice&&!advice.hidden&&advice.childElementCount>0);
    if(!todayCard){
      todayCard=document.createElement('section');
      todayCard.className='sv-sayvi-handoff-today';
      todayCard.setAttribute('aria-label','Ближайшее дело');
      const label=document.createElement('div');
      label.className='sv-sayvi-handoff-today-label';
      label.textContent='БЛИЖАЙШЕЕ';
      const button=document.createElement('button');
      button.className='sv-sayvi-handoff-agenda-card';
      button.type='button';
      const copy=document.createElement('span');
      copy.className='sv-sayvi-handoff-agenda-copy';
      const title=document.createElement('span');
      title.className='sv-sayvi-handoff-agenda-title';
      const meta=document.createElement('span');
      meta.className='sv-sayvi-handoff-agenda-meta';
      const arrow=document.createElement('span');
      arrow.className='sv-sayvi-handoff-agenda-arrow';
      arrow.setAttribute('aria-hidden','true');
      arrow.innerHTML='<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>';
      copy.append(title,meta);
      button.append(copy,arrow);
      button.addEventListener('click',()=>{location.hash='tasks';});
      todayCard.append(label,button);
      document.getElementById('stage')?.after(todayCard);
    }
    const item=nextAgenda();
    // If the calendar has not exposed a stored upcoming item, leave Home's
    // real message/decision feed alone: never imply the user has no plans.
    const nextHidden=!!hasRealCard||!item;
    if(todayCard.hidden!==nextHidden)todayCard.hidden=nextHidden;
    const title=todayCard.querySelector('.sv-sayvi-handoff-agenda-title');
    const meta=todayCard.querySelector('.sv-sayvi-handoff-agenda-meta');
    const nextTitle=item?.title||'';
    if(title.textContent!==nextTitle)title.textContent=nextTitle;
    if(!item){if(meta.textContent)meta.textContent='';return;}
    const date=item.date?new Date(item.date+'T12:00:00'):null;
    const isToday=date&&item.date===new Date().toLocaleDateString('sv-SE');
    const label=isToday?'Сегодня':date?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(date):'Без даты';
    const nextMeta=label+(item.time?' · '+item.time:'');
    if(meta.textContent!==nextMeta)meta.textContent=nextMeta;
  }
  function finish({spark=false,stayHome=false}={}){
    if(done)return;
    // An empty Home keeps the original large Sayvi in place. There is no
    // pointless trip to the dock and back after the written welcome.
    const keepHomeSphere=!spark&&(stayHome||!shouldDockHome())&&
      (!location.hash||location.hash==='#home')&&!home.hidden;
    const firstLaunch=keepHomeSphere&&root.classList.contains('sv-home-launch-pending');
    // The head already installed the final Home layout. If a redirect or
    // onboarding took over before startup, discard only those launch flags.
    if(!keepHomeSphere&&root.classList.contains('sv-home-launch-pending'))
      root.classList.remove('sv-home-empty-at-launch','sv-home-empty-sphere','sv-home-empty-arrived');
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
    // Show the lower information at its destination, without moving the
    // upper spoken welcome through the sphere.
    const revealHomeInfo=!!greeting&&keepHomeSphere;
    if(revealHomeInfo)root.classList.add('sv-home-info-enter');
    greeting?.remove();
    greeting=null;
    root.classList.remove('sv-cinema-greeting-active');
    clearTimeout(introTimer);
    clearTimeout(safetyTimer);
    if(spark)root.classList.add('sv-cinema-stagger-enter');
    root.classList.add('sv-sayvi-handoff-docked');
    if(keepHomeSphere){
      emptySphere=true;
      emptyEntering=false;
      emptyLeaving=false;
      ++emptyEpoch;
      root.classList.remove('sv-home-empty-sphere-leaving');
      // The short three-slot pearl dock was already present throughout the
      // welcome. Do not replay a full-to-short animation on empty launch.
      root.classList.add('sv-home-empty-at-launch','sv-home-empty-sphere','sv-home-empty-arrived');
    }
    if(spark)root.classList.add('sv-sayvi-handoff-arrived');
    restoreOrb();
    restoreDock();
    if(smallOpacity)small.style.setProperty('opacity',smallOpacity,smallOpacityPriority);
    else small.style.removeProperty('opacity');
    root.classList.remove('sv-sayvi-handoff-inflight');
    if(revealHomeInfo)setTimeout(()=>root.classList.remove('sv-home-info-enter'),900);
    const cluster=document.getElementById('orbCluster');
    if(cluster){
      cluster.setAttribute('aria-hidden',keepHomeSphere?'false':'true');
      cluster.inert=!keepHomeSphere;
    }
    if(spark){
      const flash=document.createElement('span');
      flash.className='sv-cinema-dock-spark';
      flash.setAttribute('aria-hidden','true');
      const target=small.getBoundingClientRect();
      flash.style.left=`${target.left+target.width/2}px`;
      flash.style.top=`${target.top+target.height/2}px`;
      document.body.appendChild(flash);
      setTimeout(()=>flash.remove(),1050);
    }
    renderToday();
    // Cold launch already has the full-size sphere in its final slot.
    root.classList.remove('sv-home-launch-pending');
    beginHomeGreetingLifetime();
    if(keepHomeSphere)window.dispatchEvent(new CustomEvent('seyveo:home-sayvi-arrived',{detail:{firstLaunch,afterCards:false}}));
    // Remove animation control once every delayed card has settled, so any
    // later live updates keep their normal transitions and touch behaviour.
    if(spark)setTimeout(()=>root.classList.remove('sv-cinema-stagger-enter'),4200);
    setTimeout(()=>root.classList.remove('sv-sayvi-handoff-arrived'),850);
    window.dispatchEvent(new Event('seyveo:cinema-finished'));
  }

  function begin(){
    if(done)return;
    if(document.hidden||!atHome||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    if(!shouldDockHome()){finish({stayHome:true});return;}
    // Address bars and safe-area insets may settle during the long logo scene.
    // Measure the dock again immediately before beginning the actual flight.
    prepareDock();
    const from=orb.getBoundingClientRect();
    if(!from.width){finish();return;}
    const to=small.getBoundingClientRect();
    const centerX=from.left+from.width/2,centerY=from.top+from.height/2;
    // Aim at the actual painted mini sphere, never at a guessed dock slot.
    const landing=to.width&&to.height?to:dockButton.getBoundingClientRect();
    const targetX=landing.left+landing.width/2;
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
    growDock(120*speed,2200*speed);

    requestAnimationFrame(()=>{
      if(done)return;
      try{
        const land=`translate3d(${dx}px,${dy}px,0) scale(${finalScale})`;
        animation=orb.animate([
          // A single physically continuous curve avoids jumps in velocity at
          // intermediate keyframes; the miniature remains a complete sphere.
          {offset:0,transform:'translate3d(0,0,0) scale(1)',opacity:1},
          {offset:1,transform:land,opacity:1}
        ],{duration:2600*speed,easing:'cubic-bezier(.45,0,.16,1)',fill:'forwards'});
        safetyTimer=setTimeout(()=>finish({spark:true}),3200*speed);
        animation.finished.then(()=>finish({spark:true})).catch(()=>{});
      }catch{finish();}
    });
  }

  function runOpening({waitForNarration=false}={}){
    if(done)return;
    // A quiet, task-free launch has no miniature destination to prepare.
    if(shouldDockHome())prepareDock();
    // Start the original mark/word/signature choreography at a faster pace.
    // The Home controller waits two frames for its final visible geometry.
    window.dispatchEvent(new Event('seyveo:cinema-opening'));
    // The artwork is already loaded. Changing its URL on voice playback
    // caused a brief white/dark flash before the first spoken word.
    openingStartedAt=performance.now();
    startGreeting();
    // The sphere never flies away while the private project narration speaks.
    // Its audio onended event starts the flight after the final spoken word.
    if(!waitForNarration)introTimer=setTimeout(begin,openingDuration);
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
      const remaining=Math.max(700,openingDuration-(performance.now()-openingStartedAt));
      introTimer=setTimeout(begin,remaining);
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
        introTimer=setTimeout(begin,Math.max(700,openingDuration-(performance.now()-openingStartedAt)));
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

  // No automatic spoken welcome: the public launch is intentionally silent.
  // An explicitly requested private preview (?sayvi-voice=1) remains separate.

  // Wait for an actual visible frame even on a cold standalone PWA launch.
  const launch=()=>{
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
    if(!showCinema||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    if(localVoicePreview){
      prepareDock();
        showLocalVoicePreview();
    }else if(fileVoicePreview){
      prepareDock();
        showPrivateFileVoicePreview();
    }else runOpening();
  };
  // The script is at the end of <body>; do not wait for slow images or audio.
  // A pending window.load was able to postpone the old preview indefinitely.
  requestAnimationFrame(launch);
  window.addEventListener('hashchange',()=>{
    if(!done&&location.hash&&location.hash!=='#home')finish();
    if(location.hash&&location.hash!=='#home'){
      root.classList.remove('sv-cinema-stagger-enter');
      root.classList.remove('sv-home-launch-pending');
    }
  });
  window.addEventListener('pagehide',()=>{
    if(!done)finish();
    root.classList.remove('sv-home-launch-pending');
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
       root.classList.contains('sv-broadcast-active')||
       root.classList.contains('sv-broadcast-onboarding')||
       root.classList.contains('sv-home-empty-sphere')||
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
        setTimeout(()=>root.classList.remove('sv-cinema-stagger-enter'),4200);
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

  // Empty Home: the ORIGINAL Sayvi comes back when no actionable card remains.
  // This is independent of the music-only ambient mode and never clones #orb.
  const emptyOrbCluster=document.getElementById('orbCluster');
  let emptySphere=false,emptyEntering=false,emptyLeaving=false;
  let emptyMotion=null,emptySyncTimer=0,emptyEpoch=0;
  let emptyLiftTimer=0,emptyArrivalGuardTimer=0,emptyRouteTimer=0,emptyRouteLeaving=false;
  function hasHomeCards(){
    // Review cards do not alter Home sphere geometry.
    if(!document.documentElement.classList.contains('sv-review-open'))return false;
    const living=document.getElementById('seyveoLivingMoment');
    const advice=document.getElementById('dynamic');
    if(living&&!living.hidden)return true;
    if(advice&&!advice.hidden&&Array.from(advice.children).some(child=>!child.hidden))return true;
    if(todayCard&&!todayCard.hidden)return true;
    for(const id of ['svSmartStartHome','svcpWorkHomePreview','workTimeline']){
      const section=document.getElementById(id);
      if(section&&!section.hidden)return true;
    }
    return false;
  }
  // Distinguish resolving the last visible card from merely returning to
  // an already-empty Home. Only the former deserves a celebratory line.
  let hadCardsBeforeEmpty=hasHomeCards();
  let lastHasCard=hadCardsBeforeEmpty;
  function shouldDockHome(){
    // Definitive Home: the original sphere remains a chat / voice button,
    // with or without the one featured card. Only onboarding needs a dock flight.
    return root.classList.contains('sv-broadcast-onboarding');
  }
  function syncHomeCardPresence(){
    const withCards=hasHomeCards();
    if(withCards)hadCardsBeforeEmpty=true;
    if(lastHasCard&&!withCards&&emptySphere&&
       root.classList.contains('sv-home-empty-arrived')&&
       !root.classList.contains('sv-broadcast-first-return')&&
       !root.classList.contains('sv-broadcast-onboarding')){
      hadCardsBeforeEmpty=false;
      window.dispatchEvent(new CustomEvent('seyveo:home-sayvi-arrived',{
       detail:{afterCards:true}
      }));
    }
    lastHasCard=withCards;
    return withCards;
  }
  function canShowEmptySphere(){
    return done&&!document.hidden&&!home.hidden&&
      (!location.hash||location.hash==='#home')&&
      !root.classList.contains('seyveo-conversation')&&
      !root.classList.contains('sv-broadcast-onboarding')&&
      !root.classList.contains('sv-broadcast-sheet-open')&&
      !root.classList.contains('sv-music-ambient')&&
      !root.classList.contains('sv-music-ambient-leaving')&&
      !document.querySelector('dialog[open]:not(#svHomeFavoritesEditor)');
  }

  function restoreEmptyMotion(){
    emptyMotion?.cancel();emptyMotion=null;
  }
  function clearEmptyArrival(){
    clearTimeout(emptyLiftTimer);emptyLiftTimer=0;
    clearTimeout(emptyArrivalGuardTimer);emptyArrivalGuardTimer=0;
    root.classList.remove('sv-home-empty-arriving','sv-home-empty-lifted');
  }
  function enterEmptySphere(){
    if(emptySphere||emptyLeaving||!canShowEmptySphere())return;
    const afterCards=hadCardsBeforeEmpty&&!hasHomeCards()&&
      !root.classList.contains('sv-broadcast-first-return');
    hadCardsBeforeEmpty=false;
    emptySphere=true;
    const epoch=++emptyEpoch;
    cancelAmbientTimer();
    // This later return is a real dock-to-Home flight, not the first launch.
    root.classList.remove('sv-home-empty-at-launch');
    // Use the painted dock miniature as the actual physical departure point.
    // Keep it visible for the first lift-off beat, then fade it under the globe.
    const from=small.getBoundingClientRect();
    root.classList.remove('sv-home-empty-arrived');
    root.classList.add('sv-home-empty-arriving','sv-home-empty-sphere');
    if(emptyOrbCluster){emptyOrbCluster.inert=false;emptyOrbCluster.removeAttribute('aria-hidden');}
    const to=orb.getBoundingClientRect();
    const complete=()=>{
      if(epoch!==emptyEpoch||!emptySphere||
         (!emptyEntering&&!root.classList.contains('sv-home-empty-arriving')))return;
      emptyEntering=false;
      restoreEmptyMotion();
      clearEmptyArrival();
      // Never strand the weather behind the flight gate on Safari, even if
      // Web Animations is interrupted or cannot start.
      root.classList.add('sv-home-empty-arrived');
      window.dispatchEvent(new CustomEvent('seyveo:home-sayvi-arrived',{
        detail:{afterCards}
      }));
      if(!canShowEmptySphere())leaveEmptySphere();
    };
    if(reduceMotion()||!from.width||!to.width||typeof orb.animate!=='function'){
      complete();return;
    }
    const dx=from.left+from.width/2-(to.left+to.width/2);
    const dy=from.top+from.height/2-(to.top+to.height/2);
    const scale=Math.min(1,from.width/to.width);
    try{
      emptyEntering=true;
      const motion=orb.animate([
        {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`,opacity:1},
        {transform:'translate3d(0,0,0) scale(1)',opacity:1}
      ],{duration:1540,easing:'cubic-bezier(.36,.02,.16,1)',fill:'both'});
      emptyMotion=motion;
      emptyLiftTimer=setTimeout(()=>{
        if(epoch===emptyEpoch)root.classList.add('sv-home-empty-lifted');
      },160);
      // A missing animation.finished callback must not permanently hide Home.
      emptyArrivalGuardTimer=setTimeout(complete,1900);
      motion.finished.then(complete).catch(complete);
    }catch{complete();}
  }
  function leaveEmptySphere({animate=true}={}){
    // Root-class observers must not cut off a dock expansion in progress.
    if(emptyRouteLeaving)return;
    if(emptyLeaving){
      if(!animate){
        ++emptyEpoch;
        restoreEmptyMotion();
        clearEmptyArrival();
        emptyLeaving=false;
        if(emptyOrbCluster){emptyOrbCluster.inert=true;emptyOrbCluster.setAttribute('aria-hidden','true');}
        root.classList.remove('sv-home-empty-sphere','sv-home-empty-sphere-leaving','sv-home-empty-arrived','sv-home-empty-route-exit');
      }
      return;
    }
    if(!emptySphere)return;
    if(emptyEntering&&animate)return;
    // A genuine exit may expand the pearl dock; release the launch-only hold.
    root.classList.remove('sv-home-empty-at-launch');
    emptySphere=false;
    emptyLeaving=true;
    const epoch=++emptyEpoch;
    restoreEmptyMotion();
    clearEmptyArrival();
    root.classList.remove('sv-home-empty-arrived');
    const settle=()=>{
      if(epoch!==emptyEpoch)return;
      clearTimeout(emptyRouteTimer);emptyRouteTimer=0;emptyRouteLeaving=false;
      emptyLeaving=false;
      restoreEmptyMotion();
      if(emptyOrbCluster){emptyOrbCluster.inert=true;emptyOrbCluster.setAttribute('aria-hidden','true');}
      root.classList.remove('sv-home-empty-sphere','sv-home-empty-sphere-leaving','sv-home-empty-route-exit');
      if(!home.hidden&&hasHomeCards()){
        root.classList.add('sv-cinema-stagger-enter');
        setTimeout(()=>root.classList.remove('sv-cinema-stagger-enter'),4200);
      }
      scheduleEmptySphereSync(300);
      if(canShowMusicAmbient())scheduleMusicAmbient();
    };
    // A page transition needs a shorter coordinated dock expansion and mini
    // fade-in, not a second, backwards flight of the big Home sphere.
    const routeExit=!animate&&!reduceMotion()&&!document.hidden&&
      (home.hidden||(location.hash&&location.hash!=='#home')||
       !!document.querySelector('dialog[open]:not(#svHomeFavoritesEditor)'));
    if(routeExit){
      emptyRouteLeaving=true;
      if(emptyOrbCluster){emptyOrbCluster.inert=true;emptyOrbCluster.setAttribute('aria-hidden','true');}
      root.classList.add('sv-home-empty-sphere-leaving','sv-home-empty-route-exit');
      // Navigation is independent of the Home sphere cinema.
      emptyRouteTimer=setTimeout(settle,location.hash==='#tasks'?180:620);
      return;
    }
    if(!animate||reduceMotion()||home.hidden||typeof orb.animate!=='function'){
      settle();return;
    }
    const from=orb.getBoundingClientRect();
    const to=small.getBoundingClientRect();
    if(!from.width||!to.width){settle();return;}
    root.classList.add('sv-home-empty-sphere-leaving');
    const dx=to.left+to.width/2-(from.left+from.width/2);
    const dy=to.top+to.height/2-(from.top+from.height/2);
    const scale=Math.min(1,to.width/from.width);
    try{
      const motion=orb.animate([
        {transform:'translate3d(0,0,0) scale(1)',opacity:1},
        {transform:`translate3d(${dx}px,${dy}px,0) scale(${scale})`,opacity:1}
      ],{duration:1160,easing:'cubic-bezier(.44,0,.16,1)',fill:'forwards'});
      emptyMotion=motion;
      let settled=false;
      const complete=()=>{if(!settled){settled=true;settle();}};
      motion.finished.then(complete).catch(complete);
      setTimeout(complete,1500);
    }catch{settle();}
  }
  function syncEmptySphere(){
    emptySyncTimer=0;
    syncHomeCardPresence();
    // Rapid Back used to teleport the full-size sphere into position while
    // the dock was still expanding. Reverse that handoff properly: restore
    // the miniature, let Home settle one frame, then fly the ORIGINAL orb out.
    if(emptyRouteLeaving&&!home.hidden&&
      (!location.hash||location.hash==='#home')){
      clearTimeout(emptyRouteTimer);emptyRouteTimer=0;emptyRouteLeaving=false;
      emptyLeaving=false;emptySphere=false;
      ++emptyEpoch;
      restoreEmptyMotion();
      clearEmptyArrival();
      root.classList.remove('sv-home-empty-route-exit','sv-home-empty-sphere-leaving',
        'sv-home-empty-sphere','sv-home-empty-arrived');
      if(emptyOrbCluster){emptyOrbCluster.inert=true;emptyOrbCluster.setAttribute('aria-hidden','true');}
      requestAnimationFrame(()=>enterEmptySphere());
      return;
    }
    if(canShowEmptySphere()){enterEmptySphere();return;}
    const stillHome=!home.hidden&&(!location.hash||location.hash==='#home')&&
      !root.classList.contains('seyveo-conversation')&&!document.hidden&&
      !document.querySelector('dialog[open]:not(#svHomeFavoritesEditor)');
    leaveEmptySphere({animate:stillHome});
  }
  function scheduleEmptySphereSync(delay=260){
    // A review-card return changes dozens of descendant classes in one burst.
    // Keep the first scheduled reconciliation: resetting its timer for every
    // mutation could indefinitely postpone the sphere on slower iPhones.
    // Route changes take priority over the normal card-observer debounce.
    // The pearl dock must begin opening promptly, ahead of the mini orb.
    const urgent=emptySphere&&!document.hidden&&
      (home.hidden||(location.hash&&location.hash!=='#home')||
       !!document.querySelector('dialog[open]:not(#svHomeFavoritesEditor)'));
    if(urgent)delay=Math.min(delay,32);
    if(urgent&&location.hash==='#tasks'){
      clearTimeout(emptySyncTimer);emptySyncTimer=0;
      syncEmptySphere();
      return;
    }
    if(emptySyncTimer&&!urgent)return;
    clearTimeout(emptySyncTimer);
    emptySyncTimer=setTimeout(syncEmptySphere,delay);
  }
  // Card actions update hidden flags. Re-evaluate after the actual outgoing
  // animation has ended, not when a placeholder simply changes text.
  const emptyObserver=new MutationObserver(()=>scheduleEmptySphereSync());
  // Card visibility and the room's DOM moves matter; transient CSS animation
  // classes do not. Observing every class generated an excessive update storm.
  emptyObserver.observe(home,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  const homeStateFlags=()=>[
    'sv-review-open','seyveo-conversation','sv-broadcast-onboarding',
    'sv-broadcast-sheet-open','sv-music-ambient','sv-music-ambient-leaving',
    'sv-home-empty-sphere'
  ].map(flag=>root.classList.contains(flag)?'1':'0').join('');
  let lastHomeStateFlags=homeStateFlags();
  const emptyRootObserver=new MutationObserver(()=>{
    const next=homeStateFlags();
    if(next===lastHomeStateFlags)return;
    lastHomeStateFlags=next;
    scheduleEmptySphereSync(180);
  });
  emptyRootObserver.observe(root,{attributes:true,attributeFilter:['class']});
  for(const name of ['seyveo:cinema-finished','seyveo:route-changed','seyveo:tasks-changed',
    'seyveo:calendar-changed','seyveo:card-visibility-changed','seyveo:home-agenda-visibility-changed',
    'seyveo:broadcast-setup-complete','seyveo:broadcast-first-return-ended'])
    window.addEventListener(name,()=>scheduleEmptySphereSync(name==='seyveo:cinema-finished'?850:260));
  window.addEventListener('hashchange',()=>scheduleEmptySphereSync(150));
  document.addEventListener('visibilitychange',()=>scheduleEmptySphereSync(160));
  scheduleEmptySphereSync(1600);
})();
