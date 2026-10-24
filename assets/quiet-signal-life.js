/* SEYVEO Quiet Signal · life in the original home divider.
   A single state machine, driven by genuine music/voice events.
   Does not read a microphone, analyze audio, create a second orb or replace any markup. */
(()=>{
 'use strict';
 const shelf=document.getElementById('quietSignal');
 const home=document.getElementById('homePage');
 const audio=document.getElementById('sayviMusicAudio');
 if(!shelf||!home)return;
 const states=['qsl-idle','qsl-music','qsl-speaking','qsl-listening','qsl-suspended'];
 let voice='';
 let voiceDeadline=0;
 const musicPlaying=()=>Boolean(audio&&!audio.paused&&!audio.ended&&
  (audio.currentSrc||audio.getAttribute('src')||audio.src));
 const sceneVisible=()=>!document.hidden&&!home.hidden&&
  !document.documentElement.classList.contains('seyveo-conversation');
 function sync(){
  const state=!sceneVisible()?'suspended':voice==='listening'?'listening':
   voice==='speaking'?'speaking':musicPlaying()?'music':'idle';
  for(const css of states)shelf.classList.toggle(css,css==='qsl-'+state);
  shelf.dataset.quietState=state;
 }
 document.addEventListener('seyveo:assistant-presence',event=>{
  const phase=event.detail?.phase;
  if(phase==='listening'||phase==='speaking'){
   voice=phase;
   clearTimeout(voiceDeadline);
   // Mobile speech APIs sometimes omit the end event; fail back to real music/idle.
   voiceDeadline=setTimeout(()=>{voice='';sync()},60000);
  }else if(phase==='listening-end'||phase==='end'||phase==='stop'||
            phase==='ack'||phase==='text'){
   voice='';
   clearTimeout(voiceDeadline);
  }
  sync();
 });
 for(const name of ['play','playing','pause','ended','emptied','error'])
  audio?.addEventListener(name,sync);
 document.addEventListener('seyveo:music-state',sync);
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
 window.addEventListener('pageshow',sync);
 sync();
})();