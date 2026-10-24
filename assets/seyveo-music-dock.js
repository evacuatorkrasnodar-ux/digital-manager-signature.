/* SEYVEO Music Flow: the EXISTING music player becomes a mode of the dock.
   Never touch #assistantButton, its handlers, layout or appearance. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock');
 const center=document.getElementById('assistantButton');
 const player=document.getElementById('sayviMusicAudio');
 const openMusic=window.SEYVEO_MUSIC?.open;
 const sideIds=['navHome','navTasks','navPicture','navManage'];
 const buttons=sideIds.map(id=>document.getElementById(id));
 if(!dock||!center||!player||buttons.some(b=>!b)||!document.getElementById('sayviMusicPlay'))return;
 if(document.getElementById('seyveoMusicMode'))return;
 let mode=false;
 const originals=buttons.map(b=>({html:b.innerHTML,aria:b.getAttribute('aria-label'),title:b.getAttribute('title')}));
 const glyphs=['⏮','▶','⏭','⌂'];
 const labels=['Назад','Пауза','Далее','Работа'];
 const toggle=document.createElement('button');
 toggle.type='button';toggle.id='seyveoMusicMode';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label','Включить музыкальное управление в доке');
 toggle.textContent='♫ Музыка';document.body.append(toggle);
 function paint(){
  dock.classList.toggle('seyveo-music-dock',mode);
  toggle.setAttribute('aria-pressed',String(mode));
  toggle.textContent=mode?'♫ Режим музыки':'♫ Музыка';
  buttons.forEach((b,i)=>{
   if(mode){
    const playing=!player.paused&&!player.ended;
    b.replaceChildren();
    const icon=document.createElement('span');icon.className='seyveo-music-dock-glyph';
    icon.textContent=i===1?(playing?'Ⅱ':'▶'):glyphs[i];
    const text=document.createElement('span');text.textContent=i===1?(playing?'Пауза':'Играть'):labels[i];
    b.append(icon,text);
    b.setAttribute('aria-label',i===1?(playing?'Остановить музыку':'Продолжить музыку'):labels[i]);
    b.removeAttribute('aria-current');
   }else{
    b.innerHTML=originals[i].html;
    if(originals[i].aria===null)b.removeAttribute('aria-label');else b.setAttribute('aria-label',originals[i].aria);
    if(originals[i].title===null)b.removeAttribute('title');else b.setAttribute('title',originals[i].title);
   }
  });
  if(!mode){
   // Routing code may have changed the active tab; defer restoration to its next navigation.
   document.dispatchEvent(new Event('seyveo:music-dock-exit'));
  }
 }
 function musicAction(i){
  if(i===3){mode=false;paint();return;}
  if(i===1){document.getElementById('sayviMusicPlay')?.click();return;}
  document.getElementById(i===0?'sayviMusicPrevious':'sayviMusicNext')?.click();
 }
 toggle.addEventListener('click',()=>{
  mode=!mode;
  paint();
  // The room is accessible through existing entry points, even when there are no files yet.
  if(mode&&!player.currentSrc)openMusic?.();
 });
 buttons.forEach((b,i)=>b.addEventListener('click',event=>{
  if(!mode)return;
  event.stopImmediatePropagation();event.preventDefault();
  musicAction(i);
 },true));
 player.addEventListener('play',()=>{if(mode)paint()});
 player.addEventListener('pause',()=>{if(mode)paint()});
 player.addEventListener('ended',()=>{if(mode)paint()});
 // Switching pages does not interrupt playback; the underlying player owns the audio.
 window.SEYVEO_MUSIC_DOCK=Object.freeze({setMode(value){mode=!!value;paint()},isActive(){return mode}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();