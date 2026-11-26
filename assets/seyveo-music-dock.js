/* Music-only navigation layer inside the existing dock shell.
   Never change the common navigation buttons, SVGs, attributes or handlers.
   Search stays the original standalone control; the main mini-player is reused. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock.sv-shared-dock'),page=document.getElementById('sayviMusicPage');
 if(!dock||!page||window.SEYVEO_MUSIC_DOCK)return;
 const root=document.documentElement;
 const tabs=[['home','Главная','<path d="M3.5 10 12 3l8.5 7v9.5a1 1 0 0 1-1 1H15v-6h-6v6H4.5a1 1 0 0 1-1-1Z"/>'],['new','Новинки','<rect x="4" y="4" width="7" height="7" rx="1.7"/><rect x="13" y="4" width="7" height="7" rx="1.7"/><rect x="4" y="13" width="7" height="7" rx="1.7"/><rect x="13" y="13" width="7" height="7" rx="1.7"/>'],['radio','Радио','<circle cx="12" cy="12" r="1.7" fill="currentColor"/><path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6m7.6-7.6a5.4 5.4 0 0 1 0 7.6M5.2 5.2a9.6 9.6 0 0 0 0 13.6m13.6-13.6a9.6 9.6 0 0 1 0 13.6"/>'],['library','Медиатека','<rect x="5" y="6" width="14" height="15" rx="3"/><path d="M8 3h8m-6 14v-7l5-1v6"/><ellipse cx="8.5" cy="17" rx="1.5" ry="1.1"/><ellipse cx="13.5" cy="15" rx="1.5" ry="1.1"/>']];
 const nav=document.createElement('nav');nav.className='sv-music-nav-only';nav.hidden=true;nav.setAttribute('aria-label','Разделы SEYVEO Music');
 for(const [key,label,icon] of tabs){const btn=document.createElement('button');btn.type='button';btn.dataset.musicNav=key;btn.setAttribute('aria-label',label);btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon+'</svg><span>'+label+'</span>';nav.append(btn)}
 dock.append(nav);
 const panels={home:'svMusicHome',new:'svMusicNew',radio:'svMusicRadio',library:'svMusicLibrary'};
 const get=id=>document.getElementById(id);
 let active=false,view='home',last='home',pending=false;
 const inside=()=>location.hash==='#sayvi-music'&&!page.hidden;
 const music=()=>window.SEYVEO_MUSIC;
 function renderTracks(){
  if(!active)return;
  const lists=[['svMusicRecent',music()?.recentTracks?.()||[],true],['svMusicLibraryTracks',music()?.browseTracks?.()||[],false]];
  for(const [id,items,recent] of lists){
   const el=get(id);if(!el)continue;el.replaceChildren();
   if(!items.length){const empty=document.createElement('p');empty.className='sv-music-browse-caption';empty.textContent=recent?'Здесь появятся треки, которые вы действительно слушали.':'Добавьте аудиофайлы с устройства.';el.append(empty);continue}
   for(const item of items){const button=document.createElement('button');button.type='button';button.className=recent?'sv-music-recent-card':'sv-music-library-track';const art=document.createElement('span');art.className='sv-music-track-tile';art.textContent='♪';art.setAttribute('aria-hidden','true');const title=document.createElement('strong');title.textContent=item.title;const artist=document.createElement('small');artist.textContent=item.artist;const text=document.createElement('span');text.className='sv-music-track-tile-copy';text.append(title,artist);button.append(art,text);button.addEventListener('click',()=>{music()?.playIndexFromSearch?.(item.index);show('player')});el.append(button)}
  }
 }
 function show(key){
  if(!active||(!Object.hasOwn(panels,key)&&key!=='player'))return false;
  music()?.closePanels?.();
  view=key;if(key!=='player')last=key;
  page.dataset.musicView=key;root.classList.toggle('sv-music-browse',key!=='player');root.classList.toggle('sv-music-player-open',key==='player');
  for(const [name,id] of Object.entries(panels))get(id).hidden=name!==key;
  const discovery=get('sayviDiscoveryPanel');if(discovery)discovery.hidden=key!=='new';
  get('sayviMusicDiscoveryToggle')?.setAttribute('aria-expanded',String(key==='new'));
  get('svMusicRadioToggle')?.setAttribute('aria-expanded',String(key==='radio'));
  for(const btn of nav.querySelectorAll('button')){const selected=btn.dataset.musicNav===key;btn.setAttribute('aria-pressed',String(selected));if(selected)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')}
  page.scrollTop=0;renderTracks();music()?.refreshMini?.();
  document.dispatchEvent(new CustomEvent('seyveo:music-view',{detail:{view:key}}));
  return true;
 }
 function enter(){
  if(active)return;active=true;nav.hidden=false;dock.classList.add('seyveo-music-dock','sv-music-navigation-only');
  const key=pending?'player':'home';pending=false;last='home';show(key);
 }
 function leave(){
  if(!active)return;active=false;nav.hidden=true;dock.classList.remove('seyveo-music-dock','sv-music-navigation-only');
  root.classList.remove('sv-music-browse','sv-music-player-open');delete page.dataset.musicView;
  for(const id of Object.values(panels))get(id).hidden=true;
  const discovery=get('sayviDiscoveryPanel');if(discovery)discovery.hidden=true;
  document.dispatchEvent(new CustomEvent('seyveo:music-view',{detail:{view:null}}));
  document.dispatchEvent(new Event('seyveo:music-dock-exit'));window.SEYVEO_MAGNETIC_INK?.refresh?.();music()?.refreshMini?.();
 }
 function refresh(){if(inside())enter();else leave()}
 function openPlayer(){if(active)return show('player');pending=true;return music()?.open?.()}
 function closePlayer(){if(!active||view!=='player')return false;return show(last)}
 nav.addEventListener('click',e=>{const btn=e.target.closest('button[data-music-nav]');if(!btn)return;e.preventDefault();e.stopPropagation();show(btn.dataset.musicNav)});
 page.addEventListener('click',e=>{const btn=e.target.closest('[data-music-view-action]');if(!btn)return;const key=btn.dataset.musicViewAction;if(key==='import')get('sayviMusicImport')?.click();else if(key==='favorites')get('sayviMusicFavoritesToggle')?.click();else if(key==='sources')get('sayviMusicSourcesToggle')?.click();else show(key)});
 window.addEventListener('hashchange',refresh);window.addEventListener('seyveo:route-changed',refresh);
 new MutationObserver(refresh).observe(page,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('seyveo:music-state',()=>{refresh();renderTracks()});
 window.SEYVEO_MUSIC_DOCK=Object.freeze({setMode:refresh,isActive:()=>active,show,openPlayer,closePlayer});
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
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
 toggle.addEventListener('click',()=>{if(window.SEYVEO_MUSIC_DOCK?.show){window.SEYVEO_MUSIC_DOCK.show('radio');return}if(!panel.hidden){close();return}window.SEYVEO_MUSIC?.closePanels?.();panel.hidden=false;toggle.setAttribute('aria-expanded','true');panel.scrollIntoView({block:'nearest'});});
 document.addEventListener('seyveo:music-view',event=>{if(event.detail?.view!=='radio'&&current)stopRadio()});
 const route=()=>{if(location.hash!=='#sayvi-music'||page.hidden)close()};
 window.addEventListener('hashchange',route);window.addEventListener('seyveo:route-changed',route);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initRadio,{once:true});else initRadio();
})();
