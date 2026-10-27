/* SEYVEO · Permanent navigation, including on music screen.
   Music playback controls live in the SEYVEO player and its existing mini controller.
   Never repurpose the four global dock destinations into music buttons. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock');
 if(!dock||window.SEYVEO_MUSIC_DOCK)return;
 dock.classList.remove('seyveo-music-dock');
 const restore=()=>{
  dock.classList.remove('seyveo-music-dock');
  window.SEYVEO_MAGNETIC_INK?.refresh?.();
 };
 // Retain the public hook for existing modules, without taking away navigation.
 window.SEYVEO_MUSIC_DOCK=Object.freeze({
  setMode(){restore()},
  isActive(){return false}
 });
 window.addEventListener('hashchange',restore);
 window.addEventListener('seyveo:route-changed',restore);
 restore();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();