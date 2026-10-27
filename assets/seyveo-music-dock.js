/* SEYVEO MUSIC · existing dock becomes a compact player ONLY in Music.
   No second dock. The original assistant button and global route handlers
   are untouched; the four outer existing buttons temporarily control audio.
   Navigating away restores all original four destinations and their labels. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock');
 const audio=document.getElementById('sayviMusicAudio');
 const outer=['navHome','navTasks','navPicture','navManage'].map(id=>document.getElementById(id));
 if(!dock||!audio||outer.some(x=>!x)||window.SEYVEO_MUSIC_DOCK)return;
 const icon={
  prev:'<path d="M6 5v14M18 6 9 12l9 6z"/>',
  play:'<path d="m8 5.5 10 6.5-10 6.5z"/>',
  pause:'<path d="M8 5.5v13M16 5.5v13"/>',
  next:'<path d="M18 5v14M6 6l9 6-9 6z"/>',
  tracks:'<path d="M8 6h12M8 12h12M8 18h12M3.5 6h.5M3.5 12h.5M3.5 18h.5"/>'
 };
 const glyph=d=>'<svg class="seyveo-music-dock-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+icon[d]+'</svg>';
 let enabled=false,loaded=false,playing=false;
 const activate=()=>location.hash==='#sayvi-music'&&!document.getElementById('sayviMusicPage')?.hidden;
 const describe=(button,label,svg,action)=>{
  button.innerHTML=glyph(svg)+'<span>'+label+'</span>';
  button.dataset.svMusicAction=action;
  button.removeAttribute('aria-current');
  button.classList.remove('active','sv-nav-feedback');
  button.setAttribute('aria-label',label==='Треки'?'Открыть список музыки':label==='Пред.'?'Предыдущий трек':label==='След.'?'Следующий трек':label);
  button.title=label==='Пред.'?'Предыдущий трек':label==='След.'?'Следующий трек':label;
 };
 function draw(){
  if(!enabled)return;
  describe(outer[0],'Пред.','prev','prev');
  describe(outer[1],playing?'Пауза':'Слушать',playing?'pause':'play','play');
  describe(outer[2],'След.','next','next');
  describe(outer[3],'Треки','tracks','tracks');
  outer[0].setAttribute('aria-disabled',String(!loaded));
  outer[2].setAttribute('aria-disabled',String(!loaded));
  outer[1].setAttribute('aria-disabled','false');
  dock.setAttribute('aria-label','SEYVEO MUSIC · предыдущий, воспроизведение, Сэйви, следующий, треки');
 }
 function enter(){
  if(enabled){draw();return;}
  enabled=true;dock.classList.add('seyveo-music-dock');
  draw();
 }
 function leave(){
  if(!enabled)return;
  enabled=false;dock.classList.remove('seyveo-music-dock');
  for(const button of outer){
   delete button.dataset.svMusicAction;
   delete button.dataset.svFixedAction;
   button.removeAttribute('aria-disabled');
  }
  document.dispatchEvent(new Event('seyveo:music-dock-exit'));
  // Paint is also needed when the music entry was opened via pushState.
  window.SEYVEO_MAGNETIC_INK?.refresh?.();
 }
 const refresh=()=>{
  const isPlaying=!audio.paused&&!audio.ended&&!!audio.getAttribute('src');
  playing=isPlaying;
  loaded=window.SEYVEO_MUSIC?.state?.().loaded>0||!!audio.getAttribute('src');
  if(activate())enter();else leave();
 };
 // Capture at the DOCK, before the original navigation listeners, so a
 // music action never accidentally switches to Tasks, Life or Management.
 dock.addEventListener('click',event=>{
  if(!enabled)return;
  const target=event.target.closest?.('button[data-sv-music-action]');
  if(!target||!outer.includes(target))return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  const action=target.dataset.svMusicAction;
  if(action==='prev'&&loaded)document.getElementById('sayviMusicPrevious')?.click();
  if(action==='play')document.getElementById('sayviMusicPlay')?.click();
  if(action==='next'&&loaded)document.getElementById('sayviMusicNext')?.click();
  if(action==='tracks')window.SEYVEO_MUSIC?.openQueue?.();
 },true);
 window.addEventListener('hashchange',refresh);
 window.addEventListener('seyveo:route-changed',refresh);
 document.addEventListener('seyveo:music-state',event=>{
  loaded=!!event.detail?.loaded;
  playing=!!event.detail?.playing;
  if(activate())enter();else leave();
 });
 for(const name of ['play','playing','pause','ended','emptied'])audio.addEventListener(name,refresh);
 window.SEYVEO_MUSIC_DOCK=Object.freeze({setMode:refresh,isActive:()=>enabled});
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();