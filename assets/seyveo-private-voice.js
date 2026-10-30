/* SEYVEO private voice · Feather Chat's existing speaker button.
 * The voice sample stays on the owner's PC. Don't mark "speaking"
 * before audio exists; unlock WebAudio synchronously with the click.
 */
(()=>{
 'use strict';
 let context=null,source=null,request=null,revision=0;
 const announce=(stage,message='')=>{
  document.dispatchEvent(new CustomEvent('seyveo:voice-status',{detail:{stage,message}}));
 };
 const stop=()=>{
  ++revision;
  const pending=request;
  request=null;
  if(pending)pending.abort();
  const current=source;
  source=null;
  if(current){
   current.onended=null;
   try{current.stop()}catch{}
   try{current.disconnect()}catch{}
  }
  announce('idle');
 };
 const previousStop=window.SEYVEO_CONVERSATION_STOP_SPEECH;
 window.SEYVEO_CONVERSATION_STOP_SPEECH=()=>{
  stop();
  if(typeof previousStop==='function')previousStop();
 };
 window.SEYVEO_CONVERSATION_READ_REPLY=async text=>{
  // Second tap cancels the pending request or stops actual playback.
  if(request||source){stop();return}
  const phrase=String(text||'').replace(/[*#_]/g,'').trim().slice(0,450);
  if(!phrase)return;
  // Resume the audio engine during the real click, before any await.
  // Audio.play() after async CPU synthesis can be blocked by Edge.
  let unlocked;
  try{
   const AudioEngine=window.AudioContext||window.webkitAudioContext;
   if(!AudioEngine)throw Error('Браузер не поддерживает Web Audio.');
   if(!context)context=new AudioEngine();
   unlocked=context.resume();
  }catch(error){
   announce('error',String(error.message||error));return;
  }
  const ticket=++revision;
  const abort=new AbortController();
  request=abort;
  announce('preparing');
  try{
   const response=await fetch('/api/seyveo-private-tts',{
    method:'POST',credentials:'same-origin',signal:abort.signal,
    headers:{'content-type':'application/json'},
    body:JSON.stringify({text:phrase})
   });
   if(!response.ok){
    const data=await response.json().catch(()=>({}));
    throw Error(data.error||'Ошибка голосового сервера: '+response.status);
   }
   const audioData=await response.arrayBuffer();
   if(ticket!==revision)return;
   const decoded=await context.decodeAudioData(audioData);
   await unlocked;
   if(ticket!==revision)return;
   if(context.state!=='running')throw Error('Браузер заблокировал звук. Нажми на значок динамика ещё раз.');
   const node=context.createBufferSource();
   node.buffer=decoded;
   node.connect(context.destination);
   source=node;
   request=null;
   node.onended=()=>{
    if(source===node){
     source=null;
     try{node.disconnect()}catch{}
     announce('idle');
    }
   };
   node.start(0);
   announce('playing');
  }catch(error){
   if(ticket!==revision||error?.name==='AbortError')return;
   request=null;source=null;
   announce('error',String(error?.message||'Не удалось создать звук.'));
   console.error('[SEYVEO Voice]',error);
  }
 };
 window.addEventListener('pagehide',stop,{once:true});
})();