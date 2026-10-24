/* SEYVEO Signature Dock · living voice mark.
   ONE existing assistant button, same SVG/gestures. A visual response to
   real app events, not microphone monitoring or synthetic voice recognition. */
(()=>{
 'use strict';
 const button=document.getElementById('assistantButton');
 const audio=document.getElementById('sayviMusicAudio');
 if(!button)return;
 const supported=new Set(['idle','music','listening','speaking','reply','paused']);
 let voice='',replyUntil=0;
 let voiceTimeout=0,replyTimeout=0;
 const audioIsPlaying=()=>!!audio&&!audio.paused&&!audio.ended&&
   !!(audio.currentSrc||audio.getAttribute('src'));
 const visible=()=>!document.hidden;
 function paint(){
  const mode=!visible()?'paused':voice==='listening'?'listening':
   voice==='speaking'?'speaking':
   replyUntil>Date.now()?'reply':
   audioIsPlaying()?'music':'idle';
  if(supported.has(mode)&&button.dataset.sayviMotion!==mode){
   button.dataset.sayviMotion=mode;
  }
 }
 function clearVoiceTimer(){clearTimeout(voiceTimeout);voiceTimeout=0;}
 function clearReplyTimer(){clearTimeout(replyTimeout);replyTimeout=0;}
 function acknowledge(){
  replyUntil=Date.now()+1850;
  clearReplyTimer();
  replyTimeout=setTimeout(()=>{replyUntil=0;paint()},1870);
 }
 document.addEventListener('seyveo:assistant-presence',event=>{
  const phase=event.detail?.phase;
  if(phase==='listening'||phase==='speaking'){
   voice=phase;replyUntil=0;clearReplyTimer();clearVoiceTimer();
   // Some mobile speech implementations omit an end event.
   voiceTimeout=setTimeout(()=>{voice='';paint()},70000);
  }else if(phase==='listening-end'||phase==='end'||phase==='stop'){
   voice='';clearVoiceTimer();
  }else if(phase==='ack'||phase==='text'){
   voice='';clearVoiceTimer();acknowledge();
  }else{return;}
  paint();
 });
 for(const event of ['play','playing','pause','ended','emptied','error']){
  audio?.addEventListener(event,paint);
 }
 document.addEventListener('seyveo:music-state',paint);
 document.addEventListener('visibilitychange',paint);
 window.addEventListener('pageshow',paint);
 paint();
})();