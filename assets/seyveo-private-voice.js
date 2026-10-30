/* Local SEYVEO voice playback: user-initiated only, one existing speaker button.
 * Never replaces the approved voice with browser speech synthesis.
 */
(()=>{
 'use strict';
 let player=null,request=null,revision=0;
 const stop=()=>{
  revision++;
  if(request){request.abort();request=null}
  if(player){player.pause();player.src='';player=null}
  document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'stop'}}));
 };
 const originalStop=window.SEYVEO_CONVERSATION_STOP_SPEECH;
 window.SEYVEO_CONVERSATION_STOP_SPEECH=()=>{
  stop();
  if(typeof originalStop==='function')originalStop();
 };
 window.SEYVEO_CONVERSATION_READ_REPLY=async(text)=>{
  if(request||player){stop();return}
  const phrase=String(text||'').replace(/[*#_`]/g,'').trim().slice(0,450);
  if(!phrase)return;
  const ticket=++revision;
  const abort=new AbortController();
  request=abort;
  document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'speaking'}}));
  try{
   const response=await fetch('/api/seyveo-private-tts',{
    method:'POST',credentials:'same-origin',signal:abort.signal,
    headers:{'content-type':'application/json'},
    body:JSON.stringify({text:phrase})
   });
   if(!response.ok){
    const body=await response.json().catch(()=>({}));
    throw Error(body.error||'Не удалось озвучить.');
   }
   const blob=await response.blob();
   if(ticket!==revision)return;
   const url=URL.createObjectURL(blob);
   const audio=new Audio(url);
   player=audio;request=null;
   const finish=()=>{
    URL.revokeObjectURL(url);
    if(player===audio){player=null;document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'stop'}}))}
   };
   audio.addEventListener('ended',finish,{once:true});
   audio.addEventListener('error',finish,{once:true});
   await audio.play();
  }catch(error){
   if(ticket!==revision||error?.name==='AbortError')return;
   request=null;player=null;
   document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'stop'}}));
   window.alert('SEYVEO · голос: '+String(error?.message||'Ошибка'));
  }
 };
 window.addEventListener('pagehide',stop);
})();
