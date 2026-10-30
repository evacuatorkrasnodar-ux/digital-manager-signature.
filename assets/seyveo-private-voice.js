/* SEYVEO approved voice · one speaker button in Feather Chat.
 * Natural 1.0x pitch and tempo, long responses divided into bounded phrases.
 * Audio is played through WebAudio unlocked by the original user click.
 * The approved local source voice is never uploaded or overwritten.
 */
(()=>{
 'use strict';
 let context=null,source=null,request=null,revision=0;
 const announce=(stage,message='')=>{
  document.dispatchEvent(new CustomEvent('seyveo:voice-status',{detail:{stage,message}}));
 };
 const splitPhrases=value=>{
  let left=String(value||'').replace(/[*#_]/g,'').trim().slice(0,3000);
  const parts=[];
  while(left){
   if(left.length<=420){if(left.length>1)parts.push(left);break}
   const head=left.slice(0,420);
   let cut=Math.max(head.lastIndexOf('. '),head.lastIndexOf('! '),head.lastIndexOf('? '),head.lastIndexOf('\n'));
   if(cut<160)cut=head.lastIndexOf(' ');
   if(cut<2)cut=420;
   else if(/[.!?]/.test(left[cut]))cut++;
   const part=left.slice(0,cut).trim();
   if(part.length>1)parts.push(part);
   left=left.slice(cut).trim();
  }
  return parts;
 };
 const stop=()=>{
  ++revision;
  const pending=request;request=null;
  if(pending)pending.abort();
  const current=source;source=null;
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
 const playPart=async(parts,index,ticket)=>{
  if(ticket!==revision)return;
  const abort=new AbortController();
  request=abort;
  announce('preparing',parts.length>1?('Часть '+(index+1)+' из '+parts.length):'');
  try{
   const response=await fetch('/api/seyveo-private-tts',{
    method:'POST',credentials:'same-origin',signal:abort.signal,
    headers:{'content-type':'application/json'},
    body:JSON.stringify({text:parts[index]})
   });
   if(!response.ok){
    const data=await response.json().catch(()=>({}));
    throw Error(data.error||'Ошибка голосового сервера: '+response.status);
   }
   const audioData=await response.arrayBuffer();
   if(ticket!==revision)return;
   const decoded=await context.decodeAudioData(audioData);
   if(ticket!==revision)return;
   if(context.state!=='running')await context.resume();
   if(context.state!=='running')throw Error('Браузер заблокировал звук. Нажми динамик ещё раз.');
   const node=context.createBufferSource();
   node.buffer=decoded;
   node.connect(context.destination);
   source=node;request=null;
   node.onended=()=>{
    if(source!==node)return;
    source=null;
    try{node.disconnect()}catch{}
    if(ticket!==revision)return;
    if(index+1<parts.length)void playPart(parts,index+1,ticket);
    else announce('idle');
   };
   node.start(0);
   announce('playing',parts.length>1?('Часть '+(index+1)+' из '+parts.length):'');
  }catch(error){
   if(ticket!==revision||error?.name==='AbortError')return;
   request=null;source=null;
   announce('error',String(error?.message||'Не удалось создать звук.'));
   console.error('[SEYVEO Voice]',error);
  }
 };
 window.SEYVEO_CONVERSATION_READ_REPLY=async text=>{
  // Pressing the speaker again stops both synthesis and playback.
  if(request||source){stop();return}
  const parts=splitPhrases(text);
  if(!parts.length)return;
  // Unlock sound NOW, inside the physical click handler.
  try{
   const AudioEngine=window.AudioContext||window.webkitAudioContext;
   if(!AudioEngine)throw Error('Браузер не поддерживает Web Audio.');
   if(!context)context=new AudioEngine();
   const unlock=context.resume();
   const ticket=++revision;
   await unlock;
   if(ticket===revision)void playPart(parts,0,ticket);
  }catch(error){
   announce('error',String(error?.message||error));
  }
 };
 window.addEventListener('pagehide',stop,{once:true});
})();
