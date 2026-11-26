/* SEYVEO Motion V95. Shared segmented-control motion, opt-in by known
   single-choice capsules. No cloned buttons, no changes to navigation,
   no optimistic selection: the existing aria state is authoritative. */
(()=>{
 'use strict';
 const selectors=[
  '#svWorkTabs','#svAllTasksTabs','#unifiedTasksTabs','#managerCalendarTabs',
  '#calendarViewModes','.cal-scope','.sv-pulse-periods','.pulse-periods',
  '#sayviSurfacePage[data-sv-subject="contract"] .sv-doc-switch',
  '#sayviSurfacePage[data-sv-subject="contract"] .svdf-list-filters',
  '#sayviSurfacePage[data-sv-subject="contract"] .sv-doc-edit-formats',
  '#sayviSurfacePage[data-sv-subject="mail"] .sv-mail-accounts',
  '#sayviSurfacePage[data-sv-subject="mail"] .sv-mail-sender-options',
  '#svcpChatFilters','.sv-inbox-muted-tabs','.sv-new-avatar-tabs',
  '#svcpStaffTabs','#seyveoFamilyDialog:not([data-chat-wallpaper="sky"]):not([data-chat-wallpaper="evening"]) .svf-tabs',
  // V109: the Wallet header uses independent icon launchers, not a pill.
  '#seyveoPayDialog:not(#svWorkShell #seyveoPayDialog) .syp-view-switch','.svmc-tabs','.sv-invite-segments','.svcp-people-switch'
 ];
 const query=selectors.join(',');
 const states=new Map(),pending=new Map();
 const enabled=()=>document.documentElement.dataset.theme==='light';
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const selected=b=>b.getAttribute('aria-pressed')==='true'||b.getAttribute('aria-selected')==='true';
 const available=b=>!b.disabled&&b.getAttribute('aria-disabled')!=='true';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const keyOf=t=>(t.id||selectors.find(q=>t.matches(q))||'')+'|'+(t.getAttribute('aria-label')||'');
 const nameOf=b=>b.getAttribute('aria-label')||b.textContent.trim();
 let frame=0,drag=null,suppress=null;
 const ro=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})}
 function geometry(t){
  if(!t.isConnected||!t.getClientRects().length||t.clientWidth<40||t.clientHeight<24)return null;
  if(getComputedStyle(t).visibility==='hidden')return null;
  const rect=t.getBoundingClientRect(),w=t.clientWidth,scale=rect.width/(t.offsetWidth||rect.width);
  if(!scale||!rect.height)return null;
  const buttons=Array.from(t.children).filter(b=>b.tagName==='BUTTON'&&!b.hidden&&b.getClientRects().length);
  if(buttons.length<2||buttons.length>6||buttons.some(b=>!b.hasAttribute('aria-pressed')&&!b.hasAttribute('aria-selected')))return null;
  const chosen=buttons.filter(selected);if(chosen.length!==1)return null;
  const boxes=buttons.map(b=>({b,r:b.getBoundingClientRect()})).sort((a,b)=>a.r.left-b.r.left);
  if(boxes.some(({r})=>r.width<=0||Math.abs(r.top+r.height/2-(rect.top+rect.height/2))>Math.max(4,rect.height*.25)))return null;
  const centers=boxes.map(({r})=>clamp((r.left+r.width/2-rect.left)/scale-t.clientLeft,0,w));
  if(centers.some((x,i)=>i>0&&x-centers[i-1]<5))return null;
  const bounds=[0,...centers.slice(1).map((x,i)=>(centers[i]+x)/2),w];
  const cells=boxes.map(({b},i)=>({b,x:bounds[i],width:bounds[i+1]-bounds[i],center:(bounds[i]+bounds[i+1])/2}));
  return {cells,active:cells.find(c=>c.b===chosen[0]),width:w,scale};
 }
 function setFace(t,x,width){
  t.style.setProperty('--sv-motion-x',x.toFixed(2)+'px');
  t.style.setProperty('--sv-motion-width',width.toFixed(2)+'px');
 }
 function instant(t){t.setAttribute('data-sv-motion-instant','')}
 function currentFace(t,g){
  const css=getComputedStyle(t,'::before');
  const transform=css.transform;
  const parts=transform&&transform!=='none'?transform.slice(transform.indexOf('(')+1,-1).split(',').map(Number):[];
  const x=parts.length===16?parts[12]:parts.length===6?parts[4]:g.active.x;
  const width=parseFloat(css.width);
  // V139: recover logical cell width from inset painted face for drag/resume.
  const inset=(parseFloat(css.left)||0)*2;
  return {x:Number.isFinite(x)?x:g.active.x,width:Number.isFinite(width)&&width>0?width+inset:g.active.width};
 }
 function cleanup(t){
  t.removeAttribute('data-sv-motion-ready');t.removeAttribute('data-sv-motion-static');
  t.removeAttribute('data-sv-motion-instant');t.removeAttribute('data-sv-motion-drag');
  t.style.removeProperty('--sv-motion-x');t.style.removeProperty('--sv-motion-width');
  ro?.unobserve(t);states.delete(t);
 }
 function refresh(){
  for(const t of states.keys())if(!t.isConnected||!enabled()||!t.matches(query))cleanup(t);
  if(!enabled())return;
  for(const t of document.querySelectorAll(query)){
   const g=geometry(t);
   if(!g){if(states.has(t))cleanup(t);continue}
   if(drag?.t===t&&drag.moved)continue;
   const prior=states.get(t),k=keyOf(t);
   if(!prior){
    instant(t);
    if(getComputedStyle(t).position==='static')t.setAttribute('data-sv-motion-static','');
    const p=pending.get(k),resume=p&&performance.now()-p.at<700&&p.target===nameOf(g.active.b);
    if(resume&&!reduced())setFace(t,p.x*g.width,p.width*g.width);
    else setFace(t,g.active.x,g.active.width);
    t.setAttribute('data-sv-motion-ready','');
    states.set(t,{x:g.active.x,width:g.active.width,active:g.active.b});
    ro?.observe(t);
    if(resume&&!reduced()){
     void t.offsetWidth;
     t.removeAttribute('data-sv-motion-instant');
     setFace(t,g.active.x,g.active.width);
    }else t.removeAttribute('data-sv-motion-instant');
    if(resume)pending.delete(k);
   }else{
    const changed=prior.active!==g.active.b;
    if(!changed&&(Math.abs(prior.x-g.active.x)>.5||Math.abs(prior.width-g.active.width)>.5))instant(t);
    t.removeAttribute('data-sv-motion-drag');
    if(changed||prior.x!==g.active.x||prior.width!==g.active.width||t.hasAttribute('data-sv-motion-instant')){
     setFace(t,g.active.x,g.active.width);
     if(t.hasAttribute('data-sv-motion-instant')){void t.offsetWidth;t.removeAttribute('data-sv-motion-instant')}
    }
    states.set(t,{x:g.active.x,width:g.active.width,active:g.active.b});
    const p=pending.get(k);if(p&&p.target===nameOf(g.active.b))pending.delete(k);
   }
  }
  for(const [k,p] of pending)if(performance.now()-p.at>700)pending.delete(k);
 }
 function remember(t,b,g,face=currentFace(t,g)){
  pending.set(keyOf(t),{at:performance.now(),target:nameOf(b),x:face.x/g.width,width:face.width/g.width});
 }
 function closestTrack(e){return e.target instanceof Element?e.target.closest('[data-sv-motion-ready]'):null}
 document.addEventListener('click',e=>{
  const t=closestTrack(e);if(!t)return;
  if(suppress&&e.isTrusted&&e.detail!==0&&performance.now()<suppress.until&&keyOf(t)===suppress.key){e.preventDefault();e.stopImmediatePropagation();return}
  const b=e.target.closest('button');if(!b||b.parentElement!==t||!available(b))return;
  const g=geometry(t);if(g)remember(t,b,g);
  schedule();
 },true);
 document.addEventListener('pointerdown',e=>{
  if(!enabled()||e.button!==0||e.isPrimary===false)return;
  const t=closestTrack(e);if(!t)return;
  const g=geometry(t);if(!g)return;
  suppress=null;const face=currentFace(t,g);
  drag={t,id:e.pointerId,x:e.clientX,y:e.clientY,g,face,moved:false,center:face.x+face.width/2};
 },{capture:true,passive:true});
 function faceAt(g,center){
  const cells=g.cells;
  center=clamp(center,cells[0].center,cells[cells.length-1].center);
  let i=0;while(i<cells.length-2&&center>cells[i+1].center)i++;
  const a=cells[i],b=cells[i+1],p=clamp((center-a.center)/(b.center-a.center),0,1);
  const width=a.width+(b.width-a.width)*p;
  return {x:clamp(center-width/2,0,g.width-width),width,center};
 }
 document.addEventListener('pointermove',e=>{
  const d=drag;if(!d||d.id!==e.pointerId||!d.t.isConnected)return;
  const dx=e.clientX-d.x,dy=e.clientY-d.y;
  if(!d.moved){
   if(Math.abs(dy)>7&&Math.abs(dy)>Math.abs(dx)){drag=null;return}
   if(Math.abs(dx)<6||Math.abs(dx)<Math.abs(dy))return;
   d.moved=true;d.t.setAttribute('data-sv-motion-drag','');
   try{d.t.setPointerCapture(e.pointerId)}catch{}
  }
  if(e.cancelable)e.preventDefault();
  const f=faceAt(d.g,d.face.x+d.face.width/2+dx/d.g.scale);d.center=f.center;d.last=f;setFace(d.t,f.x,f.width);
 },{capture:true,passive:false});
 function finish(e,cancel){
  const d=drag;if(!d||d.id!==e.pointerId)return;drag=null;
  if(!d.moved)return;
  const t=d.t;if(!t.isConnected)return;
  const g=geometry(t);t.removeAttribute('data-sv-motion-drag');
  try{if(t.hasPointerCapture(e.pointerId))t.releasePointerCapture(e.pointerId)}catch{}
  if(!g){cleanup(t);schedule();return}
  const target=cancel?g.active:g.cells.filter(c=>available(c.b)).sort((a,b)=>Math.abs(a.center-d.center)-Math.abs(b.center-d.center))[0]||g.active;
  if(!cancel)suppress={key:keyOf(t),until:performance.now()+400};
  if(target.b!==g.active.b){
   remember(t,target.b,g,d.last||d.face);
   target.b.click();
  }
  // Handlers can reject a switch, open a confirmation, or replace the DOM.
  // The actual selected state wins; never leave a visual false selection.
  if(t.isConnected){
   const after=geometry(t);if(after){setFace(t,after.active.x,after.active.width);states.set(t,{x:after.active.x,width:after.active.width,active:after.active.b})}
  }
  schedule();
 }
 document.addEventListener('pointerup',e=>finish(e,false),true);
 document.addEventListener('pointercancel',e=>finish(e,true),true);
 const observer=new MutationObserver(records=>{
  if(records.some(m=>m.type==='childList'||m.attributeName!=='class'||m.target.matches?.(query)||m.target===document.documentElement))schedule();
 });
 function init(){
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','aria-selected','aria-disabled','disabled','hidden','open','class','data-theme','data-chat-wallpaper','data-sv-subject','data-active']});
  window.addEventListener('resize',schedule,{passive:true});refresh();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
