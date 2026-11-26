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
  prev:'<path d="M6.5 6v12M17.5 6.5 9 12l8.5 5.5z"/>',
  play:'<path d="m9 6 9 6-9 6z"/>',
  pause:'<path d="M8.5 6v12M15.5 6v12"/>',
  next:'<path d="M17.5 6v12M6.5 6.5 15 12l-8.5 5.5z"/>',
  tracks:'<path d="M8.5 6.5h10.5M8.5 12h10.5M8.5 17.5h10.5M4.5 6.5h1M4.5 12h1M4.5 17.5h1"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.3"/><path d="m15 15 5.3 5.3"/>'
 };
 const glyph=d=>'<svg class="seyveo-music-dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+icon[d]+'</svg>';
 let enabled=false,loaded=false,playing=false;
 let originalSearch=null;
 const restoreSearch=()=>{
  if(!originalSearch)return;
  outer[3].innerHTML=originalSearch.html;
  for(const [attribute,value] of Object.entries(originalSearch.attrs)){
   if(value===null)outer[3].removeAttribute(attribute);
   else outer[3].setAttribute(attribute,value);
  }
  originalSearch=null;
 };
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
  // Keep the original approved laser-drawn Search glyph exactly as it
  // appeared outside Music. Do not redraw or resize this dock control.
  // The global-search listener still receives clicks on navManage.
  delete outer[3].dataset.svMusicAction;
  outer[3].setAttribute('aria-label','Умный поиск SEYVEO');
  outer[3].setAttribute('aria-controls','svGlobalSearch');
  outer[0].setAttribute('aria-disabled',String(!loaded));
  outer[2].setAttribute('aria-disabled',String(!loaded));
  outer[1].setAttribute('aria-disabled','false');
  dock.setAttribute('aria-label','SEYVEO MUSIC · предыдущий, воспроизведение, Сэйви, следующий, поиск');
 }
 function enter(){
  if(enabled){draw();return;}
  // Return the approved laser-drawn Search control exactly as it was before
  // Music borrowed the existing dock (no replacement dock and no drift).
  const attrs=['aria-label','aria-controls','aria-expanded','title'];
  originalSearch={html:outer[3].innerHTML,attrs:Object.fromEntries(attrs.map(a=>[a,outer[3].getAttribute(a)]))};
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
  restoreSearch();
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
/* Radio stays on the Music screen; never modifies the shared dock. */
(()=>{'use strict';
function initRadio(){
 const page=document.getElementById('sayviMusicPage'),audio=document.getElementById('sayviMusicAudio'),radio=document.getElementById('svMusicRadioAudio'),panel=document.getElementById('svMusicRadio'),toggle=document.getElementById('svMusicRadioToggle');
 if(!page||!audio||!radio||!panel||!toggle||panel.dataset.ready)return;
 panel.dataset.ready='true';
 const stations=[
 {id:'jazz',name:'Radio Swiss Jazz',genre:'Джаз · соул · блюз',symbol:'♫',color:'#476861',stream:'https://stream.srg-ssr.ch/srgssr/rsj/aac/192',fallback:'https://stream.srg-ssr.ch/srgssr/rsj/mp3/128',site:'https://www.radioswissjazz.ch/en/reception/internet'},
 {id:'classic',name:'Radio Swiss Classic',genre:'Классическая музыка',symbol:'♩',color:'#687d89',stream:'https://stream.srg-ssr.ch/srgssr/rsc_de/aac/192',fallback:'https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128',site:'https://www.radioswissclassic.ch/en/reception/internet'},
 {id:'pop',name:'Radio Swiss Pop',genre:'Поп · софт-рок',symbol:'♪',color:'#71816b',stream:'https://stream.srg-ssr.ch/srgssr/rsp/aac/192',fallback:'https://stream.srg-ssr.ch/srgssr/rsp/mp3/128',site:'https://www.radioswisspop.ch/en/reception/internet'},
 {id:'paradise',name:'Radio Paradise',genre:'Авторская подборка · разные жанры',symbol:'◉',color:'#607a78',site:'https://radioparadise.com/listen'}
 ];
 const list=document.getElementById('svMusicRadioStations'),status=document.getElementById('svMusicRadioStatus');
 let current=null,usingFallback=false;
 const radioButtons=new Map();
 function report(message){status.textContent=message}
 function drawRadio(){
  for(const [id,btn] of radioButtons){
   const selected=current?.id===id&&!radio.paused;
   btn.setAttribute('aria-pressed',String(selected));btn.textContent=selected?'Ⅱ':'▶';
   btn.setAttribute('aria-label',(selected?'Пауза: ':'Слушать: ')+stations.find(x=>x.id===id).name);
  }
 }
 function stopRadio(){current=null;radio.pause();radio.removeAttribute('src');radio.load();usingFallback=false;report('');drawRadio()}
 function startRadio(station){
  if(current?.id===station.id&&!radio.paused){stopRadio();return}
  stopRadio();audio.pause();current=station;report('Подключение к '+station.name+'…');radio.src=station.stream;
  radio.play().catch(()=>{if(current===station&&radio.error)tryFallback();else if(current===station)report('Не удалось начать эфир. Нажмите снова или откройте сайт станции.')});
  drawRadio();
 }
 function tryFallback(){
  if(!current)return;
  if(!usingFallback&&current.fallback){usingFallback=true;radio.src=current.fallback;report('Подключение к резервному потоку…');radio.play().catch(()=>{if(current&&usingFallback)report('Эфир недоступен. Откройте официальный сайт станции.')});return}
  report('Эфир недоступен. Откройте официальный сайт станции.');
 }
 radio.addEventListener('error',tryFallback);
 radio.addEventListener('playing',()=>{if(current)report(current.name+' · в эфире · '+(usingFallback?'MP3 128':'AAC 192')+' кбит/с');drawRadio()});
 radio.addEventListener('pause',drawRadio);
 radio.addEventListener('waiting',()=>{if(current)report('Буферизация эфира…')});
 audio.addEventListener('play',()=>{if(current)stopRadio()});
 for(const station of stations){
  const row=document.createElement('article');row.className='sv-radio-station';
  const art=document.createElement('span');art.className='sv-radio-art';art.style.background=station.color;art.textContent=station.symbol;art.setAttribute('aria-hidden','true');
  const copy=document.createElement('div');copy.className='sv-radio-copy';
  const title=document.createElement('strong');title.textContent=station.name;
  const subtitle=document.createElement('small');subtitle.textContent=station.genre+(station.stream?' · AAC 192':'');
  const link=document.createElement('a');link.href=station.site;link.target='_blank';link.rel='noopener noreferrer';link.textContent=station.stream?'Сайт станции':'Официальный плеер ↗';
  copy.append(title,subtitle,link);row.append(art,copy);
  if(station.stream){const play=document.createElement('button');play.type='button';play.className='sv-radio-play';play.addEventListener('click',()=>startRadio(station));radioButtons.set(station.id,play);row.append(play)}
  list.append(row);
 }
 drawRadio();

 function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');stopRadio()}
 toggle.addEventListener('click',()=>{if(!panel.hidden){close();return}window.SEYVEO_MUSIC?.closePanels?.();panel.hidden=false;toggle.setAttribute('aria-expanded','true');panel.scrollIntoView({block:'nearest'});});
 const route=()=>{if(location.hash!=='#sayvi-music'||page.hidden)close()};
 window.addEventListener('hashchange',route);window.addEventListener('seyveo:route-changed',route);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initRadio,{once:true});else initRadio();
})();
