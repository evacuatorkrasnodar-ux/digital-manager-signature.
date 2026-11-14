/* Reversible cinematic prototype, opt-in via ?sayvi-handoff=1.
   Big Sayvi appears at launch, hands off to the existing 42px dock sphere,
   then the actual Tasks page opens. No changes to tasks or user data. */
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('sayvi-handoff')!=='1')return;
  const root=document.documentElement;
  root.classList.add('sv-sayvi-handoff-demo');
  const home=document.getElementById('homePage');
  const orb=document.getElementById('orb');
  const art=document.getElementById('plasmaVisual');
  const dockButton=document.getElementById('assistantButton');
  const small=dockButton?.querySelector('.sv-sayvi-velvet-sphere');
  if(!home||!orb||!art||!dockButton||!small){
    root.classList.remove('sv-sayvi-handoff-demo');
    return;
  }

  let done=false;
  let flight=null;
  let animation=null;
  let introTimer=0;
  let openTimer=0;
  let todayCard=null;
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
    todayCard.hidden=!!hasRealCard;
    const item=nextAgenda();
    const title=todayCard.querySelector('.sv-sayvi-handoff-agenda-title');
    const meta=todayCard.querySelector('.sv-sayvi-handoff-agenda-meta');
    title.textContent=item?item.title:'Сегодня всё спокойно';
    if(!item){meta.textContent='Открыть мои дела';return;}
    const date=item.date?new Date(item.date+'T12:00:00'):null;
    const isToday=date&&item.date===new Date().toLocaleDateString('sv-SE');
    const label=isToday?'Сегодня':date?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(date):'Без даты';
    meta.textContent=label+(item.time?' · '+item.time:'');
  }
  function finish({openTasks=false}={}){
    if(done)return;
    done=true;
    clearTimeout(introTimer);
    clearTimeout(openTimer);
    animation?.cancel();
    flight?.remove();
    flight=null;
    root.classList.remove('sv-sayvi-handoff-inflight');
    root.classList.add('sv-sayvi-handoff-docked','sv-sayvi-handoff-arrived');
    const cluster=document.getElementById('orbCluster');
    if(cluster){cluster.setAttribute('aria-hidden','true');cluster.inert=true;}
    renderToday();
    const targetHash=location.hash;
    if(openTasks && (!targetHash||targetHash==='#home')){
      // Let the final pearl glint settle before revealing real task content.
      openTimer=setTimeout(()=>{if(!location.hash||location.hash==='#home')location.hash='tasks';},190);
    }
    setTimeout(()=>root.classList.remove('sv-sayvi-handoff-arrived'),850);
  }

  function begin(){
    if(done)return;
    if(document.hidden){finish();return;}
    if(location.hash&&location.hash!=='#home'){finish();return;}
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish({openTasks:true});return;}
    const from=orb.getBoundingClientRect();
    const to=small.getBoundingClientRect();
    if(!from.width||!to.width){finish();return;}

    // The visible SVG silhouette occupies ~80% of its viewBox, not its img box.
    const finalScale=(to.width/.8)/from.width;
    const dx=(to.left+to.width/2)-(from.left+from.width/2);
    const dy=(to.top+to.height/2)-(from.top+from.height/2);
    flight=document.createElement('div');
    flight.className='sv-sayvi-handoff-flight';
    flight.setAttribute('aria-hidden','true');
    flight.style.left=from.left+'px';
    flight.style.top=from.top+'px';
    flight.style.width=from.width+'px';
    flight.style.height=from.height+'px';
    const visual=document.createElement('img');
    visual.src=art.currentSrc||art.src;
    visual.alt='';
    visual.decoding='async';
    visual.style.filter=getComputedStyle(art).filter;
    flight.appendChild(visual);
    document.body.appendChild(flight);
    root.classList.add('sv-sayvi-handoff-inflight');

    // A gentle lift and a long, silent glide. Only compositor-friendly
    // transform/opacity animate, so older iPhones do not need a shader pass.
    animation=flight.animate([
      {offset:0,transform:'translate3d(0,0,0) scale(1)',opacity:1},
      {offset:.20,transform:`translate3d(${dx*.055}px,${dy*-.06}px,0) scale(.93)`,opacity:1},
      {offset:.57,transform:`translate3d(${dx*.47}px,${dy*.39}px,0) scale(.53)`,opacity:1},
      {offset:.88,transform:`translate3d(${dx*.91}px,${dy*.88}px,0) scale(${finalScale*1.22})`,opacity:1},
      {offset:1,transform:`translate3d(${dx}px,${dy}px,0) scale(${finalScale})`,opacity:0}
    ],{duration:1180,easing:'cubic-bezier(.2,.74,.22,1)',fill:'forwards'});
    animation.finished.then(()=>finish({openTasks:true})).catch(()=>{});
  }

  // An intentional but short brand greeting; any user navigation takes priority.
  const launch=()=>{
    if(location.hash&&location.hash!=='#home'){finish();return;}
    introTimer=setTimeout(begin,540);
  };
  if(document.readyState==='complete')launch();
  else window.addEventListener('load',launch,{once:true});
  window.addEventListener('hashchange',()=>{if(!done)finish();});
  window.addEventListener('pagehide',()=>{if(!done)finish();});
  window.addEventListener('resize',()=>{if(flight&&!done)finish();});
  document.addEventListener('pointerdown',event=>{
    if(done){clearTimeout(openTimer);return;}
    if(event.target.closest('#orb,#assistantButton,#navTasks,#navPicture,#navManage'))finish();
  },{capture:true});
  for(const name of ['seyveo:route-changed','seyveo:tasks-changed','seyveo:calendar-changed'])
    window.addEventListener(name,renderToday);
})();
