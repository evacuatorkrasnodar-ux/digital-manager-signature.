/* SEYVEO Music Flow · one dock, one real player, one untouched Sayvi core.
   Side buttons temporarily become understated music controls.
   Central Sayvi keeps her normal gesture and returns to the main experience. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock');
 const center=document.getElementById('assistantButton');
 const player=document.getElementById('sayviMusicAudio');
 const musicPage=document.getElementById('sayviMusicPage');
 const openMusic=window.SEYVEO_MUSIC?.open;
 const sideIds=['navHome','navTasks','navPicture','navManage'];
 const buttons=sideIds.map(id=>document.getElementById(id));
 if(!dock||!center||!player||!musicPage||buttons.some(b=>!b)||!document.getElementById('sayviMusicPlay'))return;
 if(window.SEYVEO_MUSIC_DOCK)return;
 let mode=false;
 let lastMode=null,lastPlaying=null,lastTab=null;
 const originals=buttons.map(b=>({html:b.innerHTML,aria:b.getAttribute('aria-label'),title:b.getAttribute('title')}));
 const labels=['Пред.','Играть','Далее','Треки'];
 const icons={
  previous:'<path d="M6 6v12M18 6l-9 6 9 6V6Z"/>',
  play:'<path d="m9 5 10 7-10 7V5Z"/>',
  pause:'<path d="M9 5v14M15 5v14"/>',
  next:'<path d="M18 6v12M6 6l9 6-9 6V6Z"/>',
  list:'<path d="M4 7h10M4 12h10M4 17h7M18 5v11"/><circle cx="16" cy="17" r="2"/>'
 };
 const svg=name=>'<svg class="seyveo-music-dock-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+icons[name]+'</svg>';
 function currentTab(){
  const hash=location.hash;
  if(hash==='#tasks')return 'navTasks';
  if(hash==='#calendar'||hash==='#life')return 'navPicture';
  if(hash==='#picture'||hash==='#manage'||hash==='#manage-theme')return 'navManage';
  if(!hash||hash==='#home')return 'navHome';
  return null;
 }
 function paint(){
  const playing=!!(player.currentSrc||player.getAttribute('src'))&&!player.paused&&!player.ended;
  const tab=mode?null:currentTab();
  const playback=mode?playing:null;
  // Audio events often fire in pairs; never rebuild the dock for an unchanged state.
  if(lastMode===mode&&lastPlaying===playback&&lastTab===tab)return;
  const leavingMusic=lastMode===true&&!mode;
  lastMode=mode;lastPlaying=playback;lastTab=tab;
  dock.classList.toggle('seyveo-music-dock',mode);
  buttons.forEach((b,i)=>{
   if(mode){
    b.classList.remove('active');
    b.removeAttribute('aria-current');
    const name=i===0?'previous':i===1?(playing?'pause':'play'):i===2?'next':'list';
    const label=i===1?(playing?'Пауза':'Играть'):labels[i];
    b.innerHTML=svg(name)+'<span>'+label+'</span>';
    b.setAttribute('aria-label',i===0?'Предыдущий трек':i===1?(playing?'Пауза':'Воспроизвести'):i===2?'Следующий трек':'Открыть очередь музыки');
    b.removeAttribute('title');
   }else{
    b.innerHTML=originals[i].html;
    if(originals[i].aria===null)b.removeAttribute('aria-label');else b.setAttribute('aria-label',originals[i].aria);
    if(originals[i].title===null)b.removeAttribute('title');else b.setAttribute('title',originals[i].title);
    const selected=b.id===tab;
    b.classList.toggle('active',selected);
    if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
   }
  });
  if(leavingMusic)document.dispatchEvent(new Event('seyveo:music-dock-exit'));
 }
 function showTracks(){
  // "Треки" toggles the original library; the audio keeps playing.
  const list=document.getElementById('sayviMusicCollection');
  if(list&&!list.hidden){
   window.SEYVEO_MUSIC?.closePanels?.();
   return;
  }
  openMusic?.();
  window.SEYVEO_MUSIC?.openQueue?.();
 }
 function musicAction(i){
  if(i===3){showTracks();return;}
  if(i===1){document.getElementById('sayviMusicPlay')?.click();return;}
  document.getElementById(i===0?'sayviMusicPrevious':'sayviMusicNext')?.click();
 }
 buttons.forEach((b,i)=>b.addEventListener('click',event=>{
  // Only physical/keyboard input to the music side controls is transformed.
  // Programmatic navHome.click() in other app flows must still route normally.
  if(!mode||!event.isTrusted)return;
  event.stopImmediatePropagation();event.preventDefault();
  musicAction(i);
 },true));
 center.addEventListener('click',()=>{
  // The original central-button handler still opens Sayvi/Home.
  if(mode){mode=false;paint();}
 },true);
 for(const name of ['play','playing','pause','ended','emptied'])player.addEventListener(name,()=>{if(mode)paint()});
 window.addEventListener('hashchange',()=>{
  // Exactly one dock mode, chosen by route: music only on the music screen.
  const next=location.hash==='#sayvi-music';
  if(mode!==next){mode=next;paint();}
 });
 // Restore the correct controls on hard refresh and when reentering music.
 mode=location.hash==='#sayvi-music';
 paint();
 window.SEYVEO_MUSIC_DOCK=Object.freeze({setMode(value){mode=!!value;paint()},isActive(){return mode}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();