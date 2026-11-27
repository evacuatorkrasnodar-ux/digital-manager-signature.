/* Home-only, live playback controls. The approved weather, sphere, shortcuts,
   shared dock and mini-player are not modified; use the existing music engine. */
(()=>{
'use strict';
function init(){
 const $=id=>document.getElementById(id);
 const root=document.documentElement,home=$('homePage'),stage=home?.querySelector('#stage'),audio=$('sayviMusicAudio');
 if(!home||!stage||!audio||$('svHomeInlineMusic'))return;
 const note='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><ellipse cx="6" cy="18" rx="3" ry="2.2"/><ellipse cx="17" cy="16" rx="3" ry="2.2"/></svg>';
 const prev='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14M19 5 8 12l11 7z"/></svg>';
 const next='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5v14M5 5l11 7-11 7z"/></svg>';
 const play='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 18 12 8 18.5z"/></svg>';
 const pause='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
 const shuffleIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h2.5c5.5 0 7.5 12 13 12H21m-4-4 4 4-4 4M3 18h2.5c5.5 0 7.5-12 13-12H21m-4-4 4 4-4 4"/></svg>';
 const repeatIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10V8a3 3 0 0 1 3-3h13m-4-4 4 4-4 4M20 14v2a3 3 0 0 1-3 3H4m4-4-4 4 4 4"/><path class="sv-repeat-one" d="m10.5 10 1.5-1.5v7"/></svg>';
 const panel=document.createElement('section');panel.id='svHomeInlineMusic';panel.hidden=true;panel.setAttribute('aria-label','Музыка на главной');
 panel.innerHTML='<div class="sv-home-music-heading"><button type="button" class="sv-home-music-meta" aria-label="Открыть музыкальный плеер"><strong></strong><small></small></button></div><div class="sv-home-music-timeline"><input type="range" min="0" max="1000" step="1" value="0" aria-label="Положение воспроизведения"><div class="sv-home-music-times"><span>0:00</span><span>0:00</span></div></div><div class="sv-home-music-controls" role="group" aria-label="Воспроизведение"><button type="button" class="sv-home-music-mode" data-home-music="shuffle" aria-label="Включить перемешивание" aria-pressed="false" disabled>'+shuffleIcon+'</button><button type="button" data-home-music="previous" aria-label="Предыдущий трек">'+prev+'</button><button type="button" data-home-music="play" aria-label="Пауза">'+pause+'</button><button type="button" data-home-music="next" aria-label="Следующий трек">'+next+'</button><button type="button" class="sv-home-music-mode" data-home-music="repeat" data-repeat="off" aria-label="Повтор выключен. Изменить режим" aria-pressed="false" disabled>'+repeatIcon+'</button></div>';
 const back=document.createElement('button');back.type='button';back.id='svHomeMusicReturn';back.hidden=true;back.setAttribute('aria-label','Открыть музыкальный плеер');back.innerHTML=note;
 stage.append(panel,back);
 const title=panel.querySelector('strong'),artist=panel.querySelector('small'),seek=panel.querySelector('input'),times=panel.querySelector('.sv-home-music-times');
 let frame=0,weather=null,observer=null;
 const onHome=()=>!home.hidden&&(!location.hash||location.hash==='#home')&&!root.classList.contains('seyveo-conversation');
 const fmt=n=>{n=Math.max(0,Math.floor(Number.isFinite(n)?n:0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
 // Keep the weather's measured footprint, but suppress its paint and hit target.
 // The existing arrival/reveal rules use !important and can otherwise win.
 const weatherPaint=new WeakMap();
 function replaceWeather(on){
  if(!weather)return;
  if(on){
   if(!weatherPaint.has(weather)){
    weatherPaint.set(weather,{styles:['opacity','visibility','pointer-events','animation'].map(name=>[name,weather.style.getPropertyValue(name),weather.style.getPropertyPriority(name)]),aria:weather.getAttribute('aria-hidden'),tab:weather.getAttribute('tabindex')});
   }
   weather.classList.add('sv-home-music-weather-replaced');
   weather.style.setProperty('opacity','0','important');
   weather.style.setProperty('visibility','hidden','important');
   weather.style.setProperty('pointer-events','none','important');
   weather.style.setProperty('animation','none','important');
   weather.setAttribute('aria-hidden','true');
   weather.tabIndex=-1;
  }else{
   const saved=weatherPaint.get(weather);
   weather.classList.remove('sv-home-music-weather-replaced');
   if(!saved)return;
   for(const [name,value,priority] of saved.styles){if(value)weather.style.setProperty(name,value,priority);else weather.style.removeProperty(name)}
   for(const [name,value] of [['aria-hidden',saved.aria],['tabindex',saved.tab]]){if(value===null)weather.removeAttribute(name);else weather.setAttribute(name,value)}
   weatherPaint.delete(weather);
  }
 }
 function hide(){panel.hidden=back.hidden=true;replaceWeather(false)}
 function updateTime(){
  if(panel.hidden)return;
  const total=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0,now=Math.max(0,audio.currentTime||0),ratio=total?Math.min(1,now/total):0;
  seek.disabled=!total;seek.value=String(Math.round(ratio*1000));seek.style.setProperty('--sv-home-music-progress',(ratio*100).toFixed(2)+'%');
  times.firstElementChild.textContent=fmt(now);times.lastElementChild.textContent=total?'−'+fmt(total-now):'—';
 }
 const modes=[['shuffle','sayviMusicShuffle'],['repeat','sayviMusicRepeat']];
 function syncModes(){
  for(const [name,id] of modes){
   const source=$(id),button=panel.querySelector('[data-home-music="'+name+'"]');
   if(!source||!button)continue;
   button.disabled=source.disabled;button.hidden=source.hidden;
   for(const attr of ['aria-pressed','aria-label','title']){const value=source.getAttribute(attr);if(value!==null&&button.getAttribute(attr)!==value)button.setAttribute(attr,value)}
   if(name==='repeat')button.dataset.repeat=source.dataset.repeat||'off';
  }
 }
 function layout(){
  frame=0;const route=onHome();root.classList.toggle('sv-home-inline-music-route',route);
  const target=$('svSayviHomeWeather');
  if(weather!==target){replaceWeather(false);weather=target;if(weather&&observer)observer.observe(weather)}
  const session=!!window.SEYVEO_MUSIC?.state?.().homeSession;
  const playing=session&&!audio.paused&&!audio.ended;
  // Ambient music deliberately hides the weather and replaces the empty-sphere
  // state. The embedded player must work in either sphere state, independently
  // of whether the forecast is loaded or painted.
  const sphereMode=root.classList.contains('sv-home-empty-sphere')||root.classList.contains('sv-music-ambient');
  if(!route||!session||!sphereMode||root.classList.contains('sv-home-empty-arriving')||root.classList.contains('sv-home-empty-route-exit')||root.classList.contains('sv-home-weather-preview')){hide();return}
  const stageRect=stage.getBoundingClientRect(),orb=$('orb')?.getBoundingClientRect(),rail=$('svHomeFavorites'),railRect=rail&&!rail.hidden?rail.getBoundingClientRect():null,dock=document.querySelector('body > footer.dock.sv-shared-dock')?.getBoundingClientRect();
  if(!stageRect.height||!orb?.height){hide();return}
  const topLimit=orb.bottom-Math.min(45,orb.height*.135)+5;
  const bottomLimit=Math.min(dock?.top||innerHeight,railRect?.height?railRect.top:Infinity)-8;
  const room=bottomLimit-topLimit;
  const measured=weather?.getBoundingClientRect();
  const row=measured?.height&&measured?.width?measured:{top:topLimit+Math.max(0,(room-52)/2),height:52,right:stageRect.left+stageRect.width/2};
  panel.classList.toggle('sv-home-music-compact',room<130);
  panel.classList.toggle('sv-home-music-tight',room<105);
  if(room>=85){
   title.textContent=$('sayviMusicTrack')?.textContent||'Моя музыка';artist.textContent=$('sayviMusicArtist')?.textContent||'';
   panel.querySelector('[data-home-music="previous"]').disabled=!!$('sayviMusicPrevious')?.disabled;
   panel.querySelector('[data-home-music="next"]').disabled=!!$('sayviMusicNext')?.disabled;
   syncModes();
   const toggle=panel.querySelector('[data-home-music="play"]');
   if(toggle.dataset.playing!==String(playing)){toggle.dataset.playing=String(playing);toggle.innerHTML=playing?pause:play;toggle.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');toggle.setAttribute('aria-pressed',String(playing))}
   panel.hidden=false;back.hidden=true;
   const height=panel.offsetHeight;
   if(height<=room+1){
    // Prioritize breathing room under the sphere, without hiding controls
    // or overlapping the shortcut rail on short mobile viewports.
    const free=Math.max(0,room-height);
    const sphereAir=Math.min(14,free);
    const extraAir=Math.min(10,Math.max(0,free-sphereAir));
    const y=Math.min(bottomLimit-height-extraAir,Math.max(topLimit+sphereAir,row.top+row.height/2-height/2));
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
 back.addEventListener('click',()=>{if(window.SEYVEO_MUSIC_DOCK?.openPlayer)window.SEYVEO_MUSIC_DOCK.openPlayer();else window.SEYVEO_MUSIC?.open?.()});
 panel.querySelector('[data-home-music="previous"]').addEventListener('click',()=>$('sayviMusicPrevious')?.click());
 panel.querySelector('[data-home-music="play"]').addEventListener('click',()=>$('sayviMusicPlay')?.click());
 panel.querySelector('[data-home-music="next"]').addEventListener('click',()=>$('sayviMusicNext')?.click());
 for(const [name,id] of modes){
  const button=panel.querySelector('[data-home-music="'+name+'"]'),source=$(id);
  button.addEventListener('click',()=>{if(source&&!source.disabled){source.click();syncModes()}});
  if(source)new MutationObserver(syncModes).observe(source,{attributes:true,attributeFilter:['disabled','hidden','aria-pressed','aria-label','title','data-repeat']});
 }
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
