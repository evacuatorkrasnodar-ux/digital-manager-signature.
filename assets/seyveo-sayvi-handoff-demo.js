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
  const dailyKey='seyveo-sayvi-cinema-last-day-v3';
  const currentDay=()=>{
    const d=new Date();
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  const day=currentDay();
  let alreadySeen=false;
  try{alreadySeen=localStorage.getItem(dailyKey)===day;}catch{}
  const atHome=!location.hash||location.hash==='#home';
  const showCinema=atHome&&!noIntro&&(replay||!alreadySeen);
  const root=document.documentElement;
  root.classList.add('sv-sayvi-handoff-demo');
  const home=document.getElementById('homePage');
  const orb=document.getElementById('orb');
  const dockButton=document.getElementById('assistantButton');
  const small=dockButton?.querySelector('.sv-sayvi-velvet-sphere');
  const dock=dockButton?.closest('footer.dock');
  if(!home||!orb||!dockButton||!small){
    root.classList.remove('sv-sayvi-handoff-demo');
    return;
  }
  // Never show both Sayvis. Inline priority wins over the dock's !important CSS.
  const smallOpacity=small.style.getPropertyValue('opacity');
  const smallOpacityPriority=small.style.getPropertyPriority('opacity');
  if(showCinema)small.style.setProperty('opacity','0','important');

  let done=false;
  let started=false;
  let animation=null;
  let introTimer=0;
  let safetyTimer=0;
  let flareTimer=0;
  let dockFrame=0;
  let dockMetrics=null;
  let dockStyleBefore=null;
  let todayCard=null;
  let flare=null;
  const orbHome=orb.parentNode;
  const orbNext=orb.nextSibling;
  let originalOrbStyle=null;
  const dockProperties=['--sv-feng-capsule','--sv-cinema-slot','--sv-cinema-extra'];
  function prepareDock(){
    if(!showCinema||root.dataset.theme!=='light'||!dock)return;
    // Read the actual approved capsule width, after the theme's clamp resolves.
    const full=parseFloat(getComputedStyle(dock,'::before').width);
    if(!Number.isFinite(full)||full<180)return;
    const slot=full/4;
    dockMetrics={full,slot,closed:slot*3};
    dockStyleBefore=dockProperties.map(key=>[
      key,dock.style.getPropertyValue(key),dock.style.getPropertyPriority(key)
    ]);
    dock.style.setProperty('--sv-cinema-slot',`${slot}px`);
    dock.style.setProperty('--sv-cinema-extra','0px');
    dock.style.setProperty('--sv-feng-capsule',`${slot*3}px`);
    root.classList.add('sv-cinema-intro-active');
  }
  function growDock(delay,duration){
    if(!dockMetrics)return;
    const start=performance.now();
    const frame=time=>{
      if(done)return;
      const progress=Math.max(0,Math.min(1,(time-start-delay)/duration));
      const eased=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;
      const extra=dockMetrics.slot*eased;
      dock.style.setProperty('--sv-cinema-extra',`${extra}px`);
      dock.style.setProperty('--sv-feng-capsule',`${dockMetrics.closed+extra}px`);
      if(progress<1)dockFrame=requestAnimationFrame(frame);
    };
    dockFrame=requestAnimationFrame(frame);
  }
  function restoreDock(){
    cancelAnimationFrame(dockFrame);
    if(dock&&dockStyleBefore){
      dockStyleBefore.forEach(([key,value,priority])=>{
        if(value)dock.style.setProperty(key,value,priority);
        else dock.style.removeProperty(key);
      });
    }
    root.classList.remove('sv-cinema-intro-active','sv-cinema-intro-dock-ready');
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
    clearTimeout(introTimer);
    clearTimeout(safetyTimer);
    clearTimeout(flareTimer);
    if(spark)root.classList.add('sv-cinema-revealing','sv-cinema-card-reveal');
    root.classList.add('sv-sayvi-handoff-docked');
    if(spark)root.classList.add('sv-sayvi-handoff-arrived');
    restoreOrb();
    restoreDock();
    if(smallOpacity)small.style.setProperty('opacity',smallOpacity,smallOpacityPriority);
    else small.style.removeProperty('opacity');
    root.classList.remove('sv-sayvi-handoff-inflight');
    flare?.remove();
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
    if(spark){
      setTimeout(()=>root.classList.remove('sv-cinema-revealing'),55);
      setTimeout(()=>root.classList.remove('sv-cinema-card-reveal'),900);
    }
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
    started=true;
    originalOrbStyle=orb.getAttribute('style')||'';
    document.body.appendChild(orb);
    orb.classList.add('sv-sayvi-handoff-flight');
    for(const [name,value] of Object.entries({
      left:`${from.left}px`,top:`${from.top}px`,
      width:`${from.width}px`,height:`${from.height}px`
    }))orb.style.setProperty(name,value,'important');
    orb.style.setProperty('transform','none');
    root.classList.add('sv-sayvi-handoff-inflight');
    growDock(850*speed,2350*speed);

    requestAnimationFrame(()=>{
      if(done)return;
      try{
        const land=`translate3d(${dx}px,${dy}px,0) scale(${finalScale})`;
        animation=orb.animate([
          {offset:0,transform:'translate3d(0,0,0) scale(1)',opacity:1,easing:'cubic-bezier(.34,0,.3,1)'},
          {offset:.13,transform:'translate3d(0,-7px,0) scale(1.025)',opacity:1,easing:'cubic-bezier(.54,0,.3,1)'},
          {offset:.51,transform:`translate3d(${dx*.17}px,${dy*.22}px,0) scale(.76)`,opacity:1,easing:'cubic-bezier(.45,.3,.25,1)'},
          {offset:.76,transform:`translate3d(${dx*.58}px,${dy*.68}px,0) scale(.35)`,opacity:1,easing:'cubic-bezier(.2,.7,.16,1)'},
          {offset:.91,transform:land,opacity:1,easing:'ease-out'},
          // Remain a complete miniature sphere at the landing point. The
          // matching dock artwork takes over in the same frame: no dot fade.
          {offset:1,transform:land,opacity:1}
        ],{duration:3900*speed,easing:'linear',fill:'forwards'});
        safetyTimer=setTimeout(()=>finish({spark:true}),4450*speed);
        animation.finished.then(()=>finish({spark:true})).catch(()=>{});
      }catch{finish();}
    });
  }

  // One opening per LOCAL calendar day; route changes never replay the film.
  const launch=()=>{
    if(!showCinema||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    prepareDock();
    introTimer=setTimeout(begin,3000*speed);
  };
  // The script is at the end of <body>; do not wait for slow images or audio.
  // A pending window.load was able to postpone the old preview indefinitely.
  requestAnimationFrame(launch);
  window.addEventListener('hashchange',()=>{
    if(!done&&location.hash&&location.hash!=='#home')finish();
  });
  window.addEventListener('pagehide',()=>{if(!done)finish();});
  window.addEventListener('resize',()=>{if(!done)finish();});
  document.addEventListener('pointerdown',()=>{if(!done)finish();},{capture:true});
  for(const name of ['seyveo:route-changed','seyveo:tasks-changed','seyveo:calendar-changed'])
    window.addEventListener(name,renderToday);
})();
