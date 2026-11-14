/* SEYVEO Sayvi: pure-CSS matte sphere, event-driven; no simulated AI states.
   All original button handlers, semantics and SVG fallback remain unchanged. */
(() => {
  'use strict';
  const button=document.getElementById('assistantButton');
  if(!button||button.querySelector('.sv-sayvi-velvet-sphere'))return;
  const sphere=document.createElement('span');
  sphere.className='sv-sayvi-velvet-sphere';
  sphere.setAttribute('aria-hidden','true');
  sphere.dataset.state='idle';
  for(const name of ['cool','warm','tide','heart','surface']){
    const layer=document.createElement('span');
    layer.className='sv-sayvi-velvet-layer sv-sayvi-velvet-'+name;
    sphere.appendChild(layer);
  }
  button.appendChild(sphere);
  button.classList.add('sv-sayvi-velvet-ready');

  let phase='';
  let phaseTimer=0;
  function resetTimer(){
    clearTimeout(phaseTimer);
    phaseTimer=0;
  }
  function setPhase(state,timeout){
    resetTimer();
    phase=state;
    if(timeout)phaseTimer=setTimeout(()=>{phase='';sync()},timeout);
    sync();
  }
  function sync(){
    const action=button.dataset.sayviMotion||'';
    const pressed=button.matches('.listening,.pressing,.arming,[aria-pressed="true"]');
    const inferred=pressed||action==='listening'?'listening':
      action==='speaking'||action==='reply'?'speaking':'idle';
    const next=phase||inferred;
    if(sphere.dataset.state!==next)sphere.dataset.state=next;
  }

  document.addEventListener('seyveo:assistant-presence',event=>{
    const kind=event.detail?.phase;
    if(kind==='listening')setPhase('listening',70000);
    else if(kind==='speaking')setPhase('speaking',70000);
    else if(kind==='ack')setPhase('thinking',1400);
    else if(kind==='text')setPhase('speaking',2100);
    else if(['listening-end','end','stop'].includes(kind))setPhase('',0);
  });
  new MutationObserver(sync).observe(button,{
    attributes:true,
    attributeFilter:['class','aria-pressed','data-sayvi-motion']
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)setPhase('',0);
    else sync();
  });
  window.addEventListener('pageshow',sync);
  sync();
})();
