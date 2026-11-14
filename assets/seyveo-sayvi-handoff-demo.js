/* SEYVEO first opening of the day: the real Sayvi greets, gently travels into
   her miniature, while the original three-slot dock grows by one slot.
   Home stays Home; task data, navigation and touch handlers are untouched.
   ?sayvi-intro=1 replays the scene for review; ?sayvi-intro=0 skips it. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const replay=params.get('sayvi-intro')==='1'||params.get('sayvi-handoff')==='1';
  const noIntro=params.get('sayvi-intro')==='0';
  const speed=params.get('sayvi-slow')==='1'?1.8:1;
  const dailyKey='seyveo-sayvi-cinema-last-day-v4';
  const currentDay=()=>{
    const d=new Date();
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  const day=currentDay();
  let alreadySeen=false;
  try{alreadySeen=localStorage.getItem(dailyKey)===day;}catch{}
  // Desktop design review: a normal or hard refresh replays the cinematic.
  // Browsers do not expose whether the HTTP cache was explicitly bypassed.
  const desktopReload=performance.getEntriesByType('navigation')[0]?.type==='reload'
    &&matchMedia('(hover: hover) and (pointer: fine)').matches;
  const atHome=!location.hash||location.hash==='#home';
  const showCinema=atHome&&!noIntro&&(replay||desktopReload||!alreadySeen);
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
    todayCard.hidden=!!hasRealCard||!item;
    const title=todayCard.querySelector('.sv-sayvi-handoff-agenda-title');
    const meta=todayCard.querySelector('.sv-sayvi-handoff-agenda-meta');
    title.textContent=item?.title||'';
    if(!item){meta.textContent='';return;}
    const date=item.date?new Date(item.date+'T12:00:00'):null;
    const isToday=date&&item.date===new Date().toLocaleDateString('sv-SE');
    const label=isToday?'Сегодня':date?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(date):'Без даты';
    meta.textContent=label+(item.time?' · '+item.time:'');
  }
  function finish({spark=false}={}){
    if(done)return;
    done=true;
    root.classList.remove('sv-cinema-boot');
    clearTimeout(introTimer);
    clearTimeout(safetyTimer);
    if(spark)root.classList.add('sv-cinema-stagger-enter');
    root.classList.add('sv-sayvi-handoff-docked');
    if(spark)root.classList.add('sv-sayvi-handoff-arrived');
    restoreOrb();
    restoreDock();
    if(smallOpacity)small.style.setProperty('opacity',smallOpacity,smallOpacityPriority);
    else small.style.removeProperty('opacity');
    root.classList.remove('sv-sayvi-handoff-inflight');
    const cluster=document.getElementById('orbCluster');
    if(cluster){cluster.setAttribute('aria-hidden','true');cluster.inert=true;}
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
    rememberOpening();
    renderToday();
    // Remove animation control once every delayed card has settled, so any
    // later live updates keep their normal transitions and touch behaviour.
    if(spark)setTimeout(()=>root.classList.remove('sv-cinema-stagger-enter'),2800);
    setTimeout(()=>root.classList.remove('sv-sayvi-handoff-arrived'),850);
  }

  function begin(){
    if(done)return;
    if(document.hidden||!atHome||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
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

  // One opening per LOCAL calendar day; route changes never replay the film.
  const launch=()=>{
    if(!showCinema||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    prepareDock();
    root.classList.remove('sv-cinema-boot');
    // The real SEYVEO pearl-signature animation lasts 9.5s. Let the complete
    // artwork play, plus one quiet beat, before Sayvi starts her journey.
    // Deliberately independent of the flight's slow-motion test multiplier.
    introTimer=setTimeout(begin,10400);
  };
  // The script is at the end of <body>; do not wait for slow images or audio.
  // A pending window.load was able to postpone the old preview indefinitely.
  requestAnimationFrame(launch);
  window.addEventListener('hashchange',()=>{
    if(!done&&location.hash&&location.hash!=='#home')finish();
    if(location.hash&&location.hash!=='#home')root.classList.remove('sv-cinema-stagger-enter');
  });
  window.addEventListener('pagehide',()=>{if(!done)finish();});
  window.addEventListener('resize',()=>{if(!done)finish();});
  // Any tap/click immediately opens the functional Home. Consume the same
  // gesture so a skip cannot accidentally activate a dock button or a card.
  let skipClickUntil=0;
  document.addEventListener('pointerdown',event=>{
    if(done)return;
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
})();
