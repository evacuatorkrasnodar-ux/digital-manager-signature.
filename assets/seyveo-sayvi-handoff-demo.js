/* Reversible cinematic prototype, opt-in via ?sayvi-handoff=1.
   Big Sayvi becomes the 42px dock sphere; Home's real cards remain on Home.
   The original orb travels above all containers, with no visual clone. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.get('sayvi-handoff')!=='1')return;
  const inspectSlow=params.get('sayvi-slow')==='1';
  const root=document.documentElement;
  root.classList.add('sv-sayvi-handoff-demo');
  const home=document.getElementById('homePage');
  const orb=document.getElementById('orb');
  const dockButton=document.getElementById('assistantButton');
  const small=dockButton?.querySelector('.sv-sayvi-velvet-sphere');
  if(!home||!orb||!dockButton||!small){
    root.classList.remove('sv-sayvi-handoff-demo');
    return;
  }

  let done=false;
  let flying=false;
  let animation=null;
  let introTimer=0;
  let todayCard=null;
  const orbHome=orb.parentNode;
  const orbNext=orb.nextSibling;
  let originalOrbStyle=null;
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
  function finish(){
    if(done)return;
    done=true;
    clearTimeout(introTimer);
    root.classList.add('sv-sayvi-handoff-docked','sv-sayvi-handoff-arrived');
    restoreOrb();
    flying=false;
    root.classList.remove('sv-sayvi-handoff-inflight');
    const cluster=document.getElementById('orbCluster');
    if(cluster){cluster.setAttribute('aria-hidden','true');cluster.inert=true;}
    renderToday();
    setTimeout(()=>root.classList.remove('sv-sayvi-handoff-arrived'),850);
  }

  function begin(){
    if(done)return;
    if(document.hidden){finish();return;}
    if(location.hash&&location.hash!=='#home'){finish();return;}
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
    const from=orb.getBoundingClientRect();
    const to=small.getBoundingClientRect();
    if(!from.width||!to.width){finish();return;}

    // Move the REAL orb into the top-level compositor. Animating it within
    // #orbCluster was clipped by Home's stacking / overflow contexts.
    const finalScale=to.width/from.width;
    const dx=(to.left+to.width/2)-(from.left+from.width/2);
    const dy=(to.top+to.height/2)-(from.top+from.height/2);
    originalOrbStyle=orb.getAttribute('style')||'';
    document.body.appendChild(orb);
    orb.classList.add('sv-sayvi-handoff-flight');
    for(const [name,value] of Object.entries({
      left:`${from.left}px`,top:`${from.top}px`,
      width:`${from.width}px`,height:`${from.height}px`
    }))orb.style.setProperty(name,value,'important');
    // A non-important transform lets the Web Animations compositor own motion.
    orb.style.setProperty('transform','none');
    flying=true;
    root.classList.add('sv-sayvi-handoff-inflight');

    requestAnimationFrame(()=>{
      if(done)return;
      const duration=inspectSlow?2800:790;
      animation=orb.animate([
        {offset:0,transform:'translate3d(0,0,0) scale(1)',opacity:1},
        {offset:.28,transform:`translate3d(${dx*.18}px,${dy*.12}px,0) scale(.91)`,opacity:1},
        {offset:.8,transform:`translate3d(${dx*.82}px,${dy*.82}px,0) scale(${finalScale+(1-finalScale)*.14})`,opacity:1},
        {offset:1,transform:`translate3d(${dx}px,${dy}px,0) scale(${finalScale})`,opacity:1}
      ],{duration,easing:'cubic-bezier(.26,.65,.23,1)',fill:'forwards'});
      animation.finished.then(finish).catch(()=>{});
    });
  }

  // An intentional but short brand greeting; any user navigation takes priority.
  const launch=()=>{
    if(location.hash&&location.hash!=='#home'){finish();return;}
    introTimer=setTimeout(begin,380);
  };
  if(document.readyState==='complete')launch();
  else window.addEventListener('load',launch,{once:true});
  window.addEventListener('hashchange',()=>{if(!done)finish();});
  window.addEventListener('pagehide',()=>{if(!done)finish();});
  window.addEventListener('resize',()=>{if(flying&&!done)finish();});
  document.addEventListener('pointerdown',event=>{
    if(done)return;
    if(event.target.closest('#orb,#assistantButton,#navTasks,#navPicture,#navManage'))finish();
  },{capture:true});
  for(const name of ['seyveo:route-changed','seyveo:tasks-changed','seyveo:calendar-changed'])
    window.addEventListener(name,renderToday);
})();
