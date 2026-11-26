/* Home-only, live playback controls. The approved weather, sphere, shortcuts,
   shared dock and mini-player are not modified; use the existing music engine. */
(()=>{
'use strict';
function init(){
 const $=id=>document.getElementById(id);
 const root=document.documentElement,home=$('homePage'),stage=home?.querySelector('#stage'),audio=$('sayviMusicAudio');
 if(!home||!stage||!audio||$('svHomeInlineMusic'))return;
 const cloud='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 18h12a3.7 3.7 0 0 0 .4-7.4 6 6 0 0 0-11.4-.7A4.1 4.1 0 0 0 5.5 18Z"/></svg>';
 const note='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><ellipse cx="6" cy="18" rx="3" ry="2.2"/><ellipse cx="17" cy="16" rx="3" ry="2.2"/></svg>';
 const prev='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5.8a1 1 0 0 1 1.5.8v10.8a1 1 0 0 1-1.5.8L2 12.9a1 1 0 0 1 0-1.8zm11 0a1 1 0 0 1 1.5.8v10.8a1 1 0 0 1-1.5.8l-8-5.3a1 1 0 0 1 0-1.8z"/></svg>';
 const next='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.8a1 1 0 0 0-1.5.8v10.8a1 1 0 0 0 1.5.8l8-5.3a1 1 0 0 0 0-1.8zm11 0a1 1 0 0 0-1.5.8v10.8a1 1 0 0 0 1.5.8l8-5.3a1 1 0 0 0 0-1.8z"/></svg>';
 const play='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.8a1.5 1.5 0 0 0-2 1.4v13.6A1.5 1.5 0 0 0 7.3 20l13-6.8a1.5 1.5 0 0 0 0-2.6Z"/></svg>';
 const pause='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="5.5" height="18" rx="1.8"/><rect x="13.5" y="3" width="5.5" height="18" rx="1.8"/></svg>';
 const panel=document.createElement('section');panel.id='svHomeInlineMusic';panel.hidden=true;panel.setAttribute('aria-label','Музыка на главной');
 panel.innerHTML='<div class="sv-home-music-heading"><button type="button" class="sv-home-music-meta" aria-label="Открыть музыкальный плеер"><strong></strong><small></small></button><button type="button" class="sv-home-music-weather" aria-label="Показать погоду">'+cloud+'</button></div><div class="sv-home-music-timeline"><input type="range" min="0" max="1000" step="1" value="0" aria-label="Положение воспроизведения"><div class="sv-home-music-times"><span>0:00</span><span>0:00</span></div></div><div class="sv-home-music-controls" role="group" aria-label="Воспроизведение"><button type="button" data-home-music="previous" aria-label="Предыдущий трек">'+prev+'</button><button type="button" data-home-music="play" aria-label="Пауза">'+pause+'</button><button type="button" data-home-music="next" aria-label="Следующий трек">'+next+'</button></div>';
 const back=document.createElement('button');back.type='button';back.id='svHomeMusicReturn';back.hidden=true;back.setAttribute('aria-label','Вернуть музыкальный плеер');back.innerHTML=note;
 stage.append(panel,back);
 const title=panel.querySelector('strong'),artist=panel.querySelector('small'),seek=panel.querySelector('input'),times=panel.querySelector('.sv-home-music-times');
 let frame=0,weatherMode=false,wasSession=false,weather=null,observer=null;
 const onHome=()=>!home.hidden&&(!location.hash||location.hash==='#home')&&!root.classList.contains('seyveo-conversation');
 const fmt=n=>{n=Math.max(0,Math.floor(Number.isFinite(n)?n:0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
 function replaceWeather(on){if(weather)weather.classList.toggle('sv-home-music-weather-replaced',on)}
 function hide(){panel.hidden=back.hidden=true;replaceWeather(false)}
 function updateTime(){
  if(panel.hidden)return;
  const total=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0,now=Math.max(0,audio.currentTime||0),ratio=total?Math.min(1,now/total):0;
  seek.disabled=!total;seek.value=String(Math.round(ratio*1000));seek.style.setProperty('--sv-home-music-progress',(ratio*100).toFixed(2)+'%');
  times.firstElementChild.textContent=fmt(now);times.lastElementChild.textContent=total?'−'+fmt(total-now):'—';
 }
 function layout(){
  frame=0;const route=onHome();root.classList.toggle('sv-home-inline-music-route',route);
  const target=$('svSayviHomeWeather');
  if(weather!==target){replaceWeather(false);weather=target;if(weather&&observer)observer.observe(weather)}
  const session=!!window.SEYVEO_MUSIC?.state?.().homeSession;
  const playing=session&&!audio.paused&&!audio.ended;
  if(!session||!wasSession)weatherMode=false;wasSession=session;
  if(!route||!session||!weather||weather.hidden||!root.classList.contains('sv-home-empty-sphere')||root.classList.contains('sv-home-empty-arriving')||root.classList.contains('sv-home-empty-route-exit')||root.classList.contains('sv-home-weather-preview')||getComputedStyle(weather).display==='none'){hide();return}
  const stageRect=stage.getBoundingClientRect(),row=weather.getBoundingClientRect(),orb=$('orb')?.getBoundingClientRect(),rail=$('svHomeFavorites'),railRect=rail&&!rail.hidden?rail.getBoundingClientRect():null,dock=document.querySelector('body > footer.dock.sv-shared-dock')?.getBoundingClientRect();
  if(!row.height||!stageRect.height){hide();return}
  const topLimit=orb?orb.bottom-Math.min(45,orb.height*.135)+5:stageRect.top;
  const bottomLimit=Math.min(dock?.top||innerHeight,railRect?.height?railRect.top:Infinity)-8;
  const room=bottomLimit-topLimit;
  panel.classList.toggle('sv-home-music-compact',room<130);
  if(!weatherMode&&room>=105){
   title.textContent=$('sayviMusicTrack')?.textContent||'Моя музыка';artist.textContent=$('sayviMusicArtist')?.textContent||'';
   panel.querySelector('[data-home-music="previous"]').disabled=!!$('sayviMusicPrevious')?.disabled;
   panel.querySelector('[data-home-music="next"]').disabled=!!$('sayviMusicNext')?.disabled;
   const toggle=panel.querySelector('[data-home-music="play"]');
   if(toggle.dataset.playing!==String(playing)){toggle.dataset.playing=String(playing);toggle.innerHTML=playing?pause:play;toggle.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');toggle.setAttribute('aria-pressed',String(playing))}
   panel.hidden=false;back.hidden=true;
   const height=panel.offsetHeight;
   if(height<=room+1){
    const y=Math.min(bottomLimit-height,Math.max(topLimit,row.top+row.height/2-height/2));
    const parent=panel.offsetParent?.getBoundingClientRect()||stageRect;
    panel.style.top=Math.round(y-parent.top)+'px';
    panel.style.left=Math.round(stageRect.left+stageRect.width/2-parent.left)+'px';
    replaceWeather(true);updateTime();return;
   }
  }
  panel.hidden=true;replaceWeather(false);
  back.hidden=false;
  const parent=back.offsetParent?.getBoundingClientRect()||stageRect;
  back.style.top=Math.round(row.top+row.height/2-parent.top-22)+'px';
  back.style.left=Math.round(Math.min(stageRect.right-44,Math.max(stageRect.left,row.right+2))-parent.left)+'px';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(layout)}
 panel.querySelector('.sv-home-music-meta').addEventListener('click',()=>{if(window.SEYVEO_MUSIC_DOCK?.openPlayer)window.SEYVEO_MUSIC_DOCK.openPlayer();else window.SEYVEO_MUSIC?.open?.()});
 panel.querySelector('.sv-home-music-weather').addEventListener('click',()=>{weatherMode=true;schedule()});
 back.addEventListener('click',()=>{weatherMode=false;schedule()});
 panel.querySelector('[data-home-music="previous"]').addEventListener('click',()=>$('sayviMusicPrevious')?.click());
 panel.querySelector('[data-home-music="play"]').addEventListener('click',()=>$('sayviMusicPlay')?.click());
 panel.querySelector('[data-home-music="next"]').addEventListener('click',()=>$('sayviMusicNext')?.click());
 seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=audio.duration*Number(seek.value)/1000;updateTime()}});
 for(const name of ['playing','play','pause','ended','emptied','error'])audio.addEventListener(name,schedule);
 for(const name of ['timeupdate','durationchange','loadedmetadata'])audio.addEventListener(name,updateTime);
 document.addEventListener('seyveo:music-state',schedule);
 for(const name of ['hashchange','seyveo:route-changed','seyveo:home-weather-position','seyveo:home-shortcuts-layout','seyveo:home-sayvi-arrived','resize'])window.addEventListener(name,schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['class']});
 new MutationObserver(schedule).observe(home,{attributes:true,attributeFilter:['hidden']});
 if(typeof ResizeObserver==='function'){observer=new ResizeObserver(schedule);for(const node of [stage,$('orb'),$('svHomeFavorites')])if(node)observer.observe(node)}
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
