/* SEYVEO Music: reuse the global dock as four section tabs + its existing Search.
   Local playback stays in the original screen and audio element.
   Radio is a direct client-side stream, stopped on exit; no rebroadcast. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock'),page=document.getElementById('sayviMusicPage');
 const audio=document.getElementById('sayviMusicAudio'),radio=document.getElementById('svMusicRadioAudio');
 const existing=['navHome','navTasks','navPicture'].map(id=>document.getElementById(id));
 const assistant=document.getElementById('assistantButton'),search=document.getElementById('navManage');
 if(!dock||!page||!audio||!radio||!assistant||!search||existing.some(x=>!x)||window.SEYVEO_MUSIC_DOCK)return;
 const library=document.createElement('button');library.type='button';library.id='svMusicLibraryTab';library.className='nav-item sv-music-library-tab';library.hidden=true;
 dock.insertBefore(library,search);
 const buttons=[...existing,library];
 const glyphs={
 home:'<path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9"/>',
 new:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 7v10M7 12h10"/>',
 radio:'<circle cx="12" cy="12" r="2"/><path d="M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
 library:'<rect x="4" y="5" width="3" height="15" rx="1"/><rect x="10" y="5" width="3" height="15" rx="1"/><path d="m16 5 4 14"/>'
 };
 const sections=[['home','Главная'],['new','Новинки'],['radio','Радио'],['library','Медиатека']];
 const svg=key=>'<svg class="seyveo-music-dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+glyphs[key]+'</svg>';
 const stations=[
 {id:'jazz',name:'Radio Swiss Jazz',genre:'Джаз · соул · блюз',symbol:'♫',color:'#476861',stream:'https://stream.srg-ssr.ch/srgssr/rsj/aac/192',fallback:'https://stream.srg-ssr.ch/srgssr/rsj/mp3/128',site:'https://www.radioswissjazz.ch/en/reception/internet'},
 {id:'classic',name:'Radio Swiss Classic',genre:'Классическая музыка',symbol:'♩',color:'#687d89',stream:'https://stream.srg-ssr.ch/srgssr/rsc_de/aac/192',fallback:'https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128',site:'https://www.radioswissclassic.ch/en/reception/internet'},
 {id:'pop',name:'Radio Swiss Pop',genre:'Поп · софт-рок',symbol:'♪',color:'#71816b',stream:'https://stream.srg-ssr.ch/srgssr/rsp/aac/192',fallback:'https://stream.srg-ssr.ch/srgssr/rsp/mp3/128',site:'https://www.radioswisspop.ch/en/reception/internet'},
 {id:'paradise',name:'Radio Paradise',genre:'Авторская подборка · разные жанры',symbol:'◉',color:'#607a78',site:'https://radioparadise.com/listen'}
 ];
 const list=document.getElementById('svMusicRadioStations'),status=document.getElementById('svMusicRadioStatus');
 let current=null,usingFallback=false,enabled=false,section='home',saved=null;
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
 const originals=()=>existing.map(button=>({html:button.innerHTML,attrs:Object.fromEntries(['aria-label','aria-current','aria-disabled','title','aria-pressed'].map(a=>[a,button.getAttribute(a)]))}));
 function draw(){
  buttons.forEach((button,i)=>{
   const [key,label]=sections[i];if(button.dataset.svMusicAction!==key||!button.querySelector('.seyveo-music-dock-svg'))button.innerHTML=svg(key)+'<span>'+label+'</span>';
   button.dataset.svMusicAction=key;button.setAttribute('aria-label',label);button.title=label;
   button.removeAttribute('aria-disabled');button.setAttribute('aria-pressed',String(section===key));
   button.classList.toggle('sv-music-tab-selected',section===key);
   if(section===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
   button.classList.remove('active');
  });
  window.SEYVEO_DOCK_ACTIVE_GLASS?.refresh?.();
 }
 function show(key){
  if(!sections.some(x=>x[0]===key))return;
  if(section==='radio'&&key!=='radio')stopRadio();
  section=key;page.dataset.musicSection=key;
  window.SEYVEO_MUSIC?.closePanels?.();
  document.getElementById('svMusicRadio').hidden=key!=='radio';
  document.getElementById('svMusicLibrary').hidden=key!=='library';
  const discovery=document.getElementById('sayviDiscoveryPanel'),toggle=document.getElementById('sayviMusicDiscoveryToggle');
  if(discovery)discovery.hidden=key!=='new';
  toggle?.setAttribute('aria-expanded',String(key==='new'));
  page.scrollTop=0;draw();
 }
 function enter(){
  if(enabled){draw();return}
  saved=originals();enabled=true;dock.classList.add('seyveo-music-dock');library.hidden=false;
  dock.setAttribute('aria-label','SEYVEO MUSIC · разделы и поиск');show('home');
 }
 function leave(){
  if(!enabled)return;
  stopRadio();enabled=false;dock.classList.remove('seyveo-music-dock');library.hidden=true;
  delete page.dataset.musicSection;document.getElementById('svMusicRadio').hidden=true;document.getElementById('svMusicLibrary').hidden=true;
  document.getElementById('sayviDiscoveryPanel').hidden=true;
  buttons.forEach((button,i)=>{
   delete button.dataset.svMusicAction;button.classList.remove('sv-music-tab-selected');button.removeAttribute('aria-pressed');button.removeAttribute('aria-current');
   if(i<3&&saved){button.innerHTML=saved[i].html;for(const [attr,value] of Object.entries(saved[i].attrs)){if(value===null)button.removeAttribute(attr);else button.setAttribute(attr,value)}}
  });
  dock.setAttribute('aria-label','Нижняя панель');saved=null;
  document.dispatchEvent(new Event('seyveo:music-dock-exit'));window.SEYVEO_MAGNETIC_INK?.refresh?.();
 }
 function refresh(){if(location.hash==='#sayvi-music'&&!page.hidden)enter();else leave()}
 dock.addEventListener('click',event=>{
  if(!enabled)return;const button=event.target.closest?.('[data-sv-music-action]');
  if(!buttons.includes(button))return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();show(button.dataset.svMusicAction);
 },true);
 page.addEventListener('click',event=>{
  const action=event.target.closest?.('[data-music-library]')?.dataset.musicLibrary;if(!action)return;
  if(action==='tracks')window.SEYVEO_MUSIC?.openQueue?.();
  else if(action==='import')document.getElementById('sayviMusicImport')?.click();
  else if(action==='favorites')document.getElementById('sayviMusicFavoritesToggle')?.click();
  else if(action==='sources')document.getElementById('sayviMusicSourcesToggle')?.click();
 });
 window.addEventListener('hashchange',refresh);window.addEventListener('seyveo:route-changed',refresh);
 document.addEventListener('seyveo:music-state',refresh);
 window.SEYVEO_MUSIC_DOCK=Object.freeze({setMode:refresh,isActive:()=>enabled,show});
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();