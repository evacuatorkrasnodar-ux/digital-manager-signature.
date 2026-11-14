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
    const targetHash=location.hash;
    if(openTasks && (!targetHash||targetHash==='#home')){
      // Let the final pearl glint settle before revealing real task content.
      openTimer=setTimeout(()=>{location.hash='tasks';},190);
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
    if(done)return;
    if(event.target.closest('#orb,#assistantButton,#navTasks,#navPicture,#navManage'))finish();
  },{capture:true});
})();
