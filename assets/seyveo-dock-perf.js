/* Local opt-in V203 diagnostics. No network, storage or personal data. */
(()=>{'use strict';
 if(!new URLSearchParams(location.search).has('seyveo-perf'))return;
 let sample=null;const records=[];
 const round=n=>Math.round(n*10)/10;
 document.addEventListener('pointerdown',e=>{
  if(!e.target.closest?.('#navTasks'))return;
  sample={version:'V203',pointerAt:performance.now(),inputDelay:round(Math.max(0,performance.now()-e.timeStamp)),from:location.hash||'#home',routeSync:0,workShell:0};
 },{capture:true,passive:true});
 document.addEventListener('click',e=>{
  if(!e.target.closest?.('#navTasks'))return;
  const item=sample||{version:'V203',pointerAt:performance.now(),from:location.hash||'#home',routeSync:0,workShell:0};
  sample=item;item.clickAt=performance.now();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   item.tapToFrame=round(performance.now()-item.clickAt);item.pointerToClick=round(item.clickAt-item.pointerAt);
   item.to=location.hash;item.tasksVisible=document.getElementById('tasksPage')?.hidden===false;
   records.push({...item});if(records.length>20)records.shift();
   if(sample===item)sample=null;
   console.table([records[records.length-1]]);
  }));
 },true);
 window.SEYVEO_DOCK_PERF=Object.freeze({phase:(name,duration)=>{if(sample&&['routeSync','workShell'].includes(name))sample[name]=round((sample[name]||0)+duration);},records:()=>records.map(x=>({...x}))});
})();