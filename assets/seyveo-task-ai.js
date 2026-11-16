/* Local Qwen task suggestions. No external endpoint, no automatic save. */
(()=>{
 'use strict';
 const dialog=document.getElementById('personalTaskDialog');
 const field=document.getElementById('personalTaskTitle');
 if(!dialog||!field)return;
 const onLocalHost=/^(127\.0\.0\.1|localhost)$/.test(location.hostname);
 let draft=null,current='',timer=0,sequence=0,controller=null;
 function reset(){
  clearTimeout(timer);sequence++;controller?.abort();controller=null;draft=null;current='';
 }
 function plan(text){return text===current?draft:null}
 function notify(){dialog.dispatchEvent(new Event('sv-task-ai-updated'))}
 async function analyze(phrase,token){
  controller?.abort();controller=new AbortController();
  try{
   const response=await fetch('/api/seyveo-task-analyze',{
    method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},
    body:JSON.stringify({message:phrase}),signal:controller.signal
   });
   if(!response.ok)return;
   const result=await response.json();
   if(!dialog.open||token!==sequence||field.value.trim()!==phrase||!Array.isArray(result.items)||result.items.length<1||result.items.length>4)return;
   const items=result.items.map(item=>({
    title:String(item.title||'').replace(/\s+/g,' ').trim().slice(0,140),
    date:/^\d{4}-\d{2}-\d{2}$/.test(item.date||'')?item.date:'',
    time:/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time||'')?item.time:''
   }));
   if(items.some(item=>item.title.length<3))return;
   const baseline=window.SEYVEO_TASK_SMART_PLAN?.(phrase);
   const guard=window.SEYVEO_TASK_AI_POLICY;
   if(guard&&!guard.accept(phrase,items,baseline,window.SEYVEO_TASK_PLACES?.extract))return;
   current=phrase;draft={items,date:items[0].date,time:items[0].time,leadMinutes:0,fromLocalAI:true};notify();
  }catch{/* Local model is optional: the on-device rule parser remains active. */}
 }
 field.addEventListener('input',()=>{
  reset();if(!onLocalHost||!dialog.open)return;
  const phrase=field.value.trim();
  if(phrase.length<12)return;
  const baseline=window.SEYVEO_TASK_SMART_PLAN?.(phrase);
  if(baseline?.items?.length&&baseline.items.every(item=>item.date&&item.time&&item.title))return;
  const token=sequence;
  timer=setTimeout(()=>void analyze(phrase,token),1100);
 });
 dialog.addEventListener('close',reset);
 window.SEYVEO_TASK_AI=Object.freeze({plan});
})();
