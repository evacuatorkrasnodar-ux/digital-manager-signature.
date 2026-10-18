/* SEYVEO — Presence, a restrained response state for the existing glass sphere.
   No independent AI, audio, microphone, canvas or persistent animation.
   Text replies acknowledge once; speech follows utterance lifecycle.
   This controller never moves the orb, changes its art, or touches the dock. */
(()=>{
'use strict';
const orb=document.getElementById('orb');
const home=document.getElementById('homePage');
const replyDialog=document.getElementById('info');
if(!orb||!home||!replyDialog)return;
let timer=0,pendingTextReply=false;
const hasHome=()=>!document.hidden&&!home.hidden;
function clear(){
 clearTimeout(timer);timer=0;
 orb.classList.remove('seyveo-presence-speaking','seyveo-presence-ack','seyveo-presence-finish');
}
function acknowledge(){
 if(!hasHome()||window.SEYVEO_DISCREET_MODE===true)return;
 clear();
 // Restart the short acknowledgement, even after consecutive text replies.
 void orb.offsetWidth;
 orb.classList.add('seyveo-presence-ack');
 timer=setTimeout(clear,2300);
}
function speak(){
 if(!hasHome()||window.SEYVEO_DISCREET_MODE===true)return;
 clear();
 orb.classList.add('seyveo-presence-speaking');
 // Some iOS/Web Speech implementations never deliver the final event.
 // A watchdog keeps the effect from running forever.
 timer=setTimeout(finish,70000);
}
function finish(){
 if(!orb.classList.contains('seyveo-presence-speaking'))return;
 clearTimeout(timer);timer=0;
 orb.classList.remove('seyveo-presence-speaking');
 orb.classList.add('seyveo-presence-finish');
 timer=setTimeout(clear,900);
}
document.addEventListener('seyveo:assistant-presence',event=>{
 const phase=event.detail?.phase;
 if(phase==='speaking')speak();
 else if(phase==='end')finish();
 else if(phase==='text'){
  // Text answers use an existing modal; show the subtle acknowledgment
  // when it closes, so the effect is actually visible rather than obscured.
  if(replyDialog.open){pendingTextReply=true;return}
  acknowledge();
 }else if(phase==='ack')acknowledge();
 else if(phase==='stop')clear();
});
replyDialog.addEventListener('close',()=>{
 if(!pendingTextReply)return;
 pendingTextReply=false;
 requestAnimationFrame(acknowledge);
});
window.addEventListener('hashchange',()=>{pendingTextReply=false;clear()});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){pendingTextReply=false;clear()}
});
window.addEventListener('pagehide',clear);
})();