/* SEYVEO — Presence, a restrained response state for the existing glass sphere.
   No independent AI, audio, microphone, canvas or persistent animation.
   Text replies now appear alongside the sphere: respond immediately.
   Speech remains connected to the utterance lifecycle. */
(()=>{
'use strict';
const orb=document.getElementById('orb');
const home=document.getElementById('homePage');
if(!orb||!home)return;
let timer=0;
const hasHome=()=>!document.hidden&&!home.hidden;
function clear(){
 clearTimeout(timer);timer=0;
 orb.classList.remove('seyveo-presence-speaking','seyveo-presence-ack','seyveo-presence-finish','seyveo-presence-listening');
}
// Microphone listening has its own sustained, smoke-only state.
function listen(){
 if(!hasHome())return;
 clear();
 orb.classList.add('seyveo-presence-listening');
 // iOS may omit the recognition end callback: do not leave smoke active forever.
 timer=setTimeout(clear,70000);
}
function endListening(){
 if(!orb.classList.contains('seyveo-presence-listening'))return;
 orb.classList.remove('seyveo-presence-listening');
 clearTimeout(timer);timer=0;
}
function acknowledge(){
 if(!hasHome())return;
 clear();
 // Restart the full visible cycle after each response, including quiet mode.
 void orb.offsetWidth;
 orb.classList.add('seyveo-presence-ack');
 timer=setTimeout(clear,5800);
}
function speak(){
 if(!hasHome())return;
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
 if(phase==='listening')listen();
 else if(phase==='listening-end')endListening();
 else if(phase==='speaking')speak();
 else if(phase==='end')finish();
 else if(phase==='text')acknowledge();
 else if(phase==='ack')acknowledge();
 else if(phase==='stop')clear();
});
window.addEventListener('hashchange',clear);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)clear();
});
window.addEventListener('pagehide',clear);
})();