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
/* Curated international radio; direct HTTPS playback uses the shared Music engine. */
(()=>{'use strict';
function initRadio(){
 const page=document.getElementById('sayviMusicPage'),audio=document.getElementById('sayviMusicAudio'),panel=document.getElementById('svMusicRadio'),toggle=document.getElementById('svMusicRadioToggle');
 if(!page||!audio||!panel||!toggle||panel.dataset.ready)return;
 panel.dataset.ready='true';
 const raw=[["США","rp","Radio Paradise","Авторская подборка · рок · соул","320 AAC","https://stream.radioparadise.com/aac-320","128 AAC","https://stream.radioparadise.com/aac-128","https://radioparadise.com/listen","#354d60","#bd8f72"],["США","rp2050","Radio 2050","Современная музыка · открытия","128 AAC","https://stream.radioparadise.com/radio2050-128","","","https://radioparadise.com/listen","#38475e","#d6a17b"],["США","rprock","Radio Paradise Rock","Классический и современный рок","320 AAC","https://stream.radioparadise.com/rock-320","128 AAC","https://stream.radioparadise.com/rock-128","https://radioparadise.com/listen","#433e50","#a76c56"],["Швейцария","jazz","Radio Swiss Jazz","Джаз · соул · блюз","192 AAC","https://stream.srg-ssr.ch/srgssr/rsj/aac/192","128 MP3","https://stream.srg-ssr.ch/srgssr/rsj/mp3/128","https://www.radioswissjazz.ch/en/reception/internet","#365750","#a9b9a2"],["Швейцария","classic","Radio Swiss Classic","Классическая музыка","192 AAC","https://stream.srg-ssr.ch/srgssr/rsc_de/aac/192","128 MP3","https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128","https://www.radioswissclassic.ch/en/reception/internet","#657988","#d5c6b1"],["Швейцария","pop","Radio Swiss Pop","Поп · софт-рок","192 AAC","https://stream.srg-ssr.ch/srgssr/rsp/aac/192","128 MP3","https://stream.srg-ssr.ch/srgssr/rsp/mp3/128","https://www.radioswisspop.ch/en/reception/internet","#60735e","#d6b7a0"],["Германия","kultur","Deutschlandfunk Kultur","Музыка · культура","192 AAC","https://st02.sslstream.dlf.de/dlf/02/high/aac/stream.aac?aggregator=web","128 MP3","https://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3?aggregator=web","https://www.deutschlandfunkkultur.de/","#3d566e","#b8b0d0"],["Германия","nova","Deutschlandfunk Nova","Инди · поп · культура","192 AAC","https://st03.sslstream.dlf.de/dlf/03/high/aac/stream.aac?aggregator=web","128 MP3","https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3?aggregator=web","https://www.deutschlandfunknova.de/","#4c5973","#d7ac80"],["Франция","fip","FIP","Джаз · мировая музыка · эклектика","192 AAC","","","","https://www.radiofrance.fr/fip","#66546b","#d8aaa5"],["Франция","fipjazz","FIP Jazz","Джаз · импровизация","192 AAC","","","","https://www.radiofrance.fr/fip/radio-jazz","#514969","#d2b798"],["Чехия","czjazz","ČRo Jazz","Джаз · соул","FLAC","","","","https://jazz.rozhlas.cz/","#405a6b","#b1c8b7"],["Чехия","czclassic","ČRo D-dur","Классическая музыка","FLAC","","","","https://d-dur.rozhlas.cz/","#53687a","#d9c9ad"],["Великобритания","bbc6","BBC Radio 6 Music","Альтернатива · инди","","","","","https://www.bbc.co.uk/sounds/play/live:bbc_6music","#4e526c","#ba9ca9"],["Великобритания","bbc3","BBC Radio 3","Классика · джаз","","","","","https://www.bbc.co.uk/sounds/play/live:bbc_radio_three","#514b64","#d1bfa0"],["Россия","record","Radio Record","Электронная музыка","","","","","https://www.radiorecord.ru/","#4e5974","#c1a8ca"],["Россия","jazzru","Радио JAZZ","Джаз · блюз · соул","","","","","https://radiojazzfm.ru/","#4c5f58","#d1bda0"]];
 const makeArt=(c,d,i)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="'+c+'"/><stop offset="1" stop-color="'+d+'"/></linearGradient><radialGradient id="r"><stop stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="'+(180+i%4*70)+'" cy="210" r="290" fill="url(#r)"/><g fill="none" stroke="#fff" opacity=".58" stroke-width="2.4"><circle cx="300" cy="300" r="83"/><circle cx="300" cy="300" r="129"/><circle cx="300" cy="300" r="175"/><circle cx="300" cy="300" r="221"/></g><circle cx="300" cy="300" r="20" fill="#fff" opacity=".9"/></svg>');
 const stations=raw.map(([country,id,name,genre,quality,stream,fallbackQuality,fallback,site,c,d],i)=>({radio:true,country,id,name,genre,quality,stream,fallbackQuality,fallback,site,artwork:makeArt(c,d,i),color:c}));
 const list=document.getElementById('svMusicRadioStations'),status=document.getElementById('svMusicRadioStatus');
 if(!list||!status)return;
 const buttons=new Map();
 function drawRadio(){
  const state=window.SEYVEO_MUSIC?.state?.();
  for(const [id,btn] of buttons){const selected=state?.stationId===id&&state.playing;btn.setAttribute('aria-pressed',String(!!selected));btn.textContent=selected?'Ⅱ':'▶';btn.setAttribute('aria-label',(selected?'Пауза: ':'Слушать: ')+stations.find(x=>x.id===id).name);}
  status.textContent=state?.source==='radio'?(state.playing?'В эфире · ':'Выбрана станция · ')+stations.find(x=>x.id===state.stationId)?.name+' · '+(state.quality||''):'';
 }
 const countries=[...new Set(stations.map(x=>x.country))];
 const filter=document.createElement('select');filter.setAttribute('aria-label','Страна радиостанции');filter.style.cssText='display:block;width:100%;margin:12px 0;padding:11px 14px;border:1px solid rgba(128,138,150,.22);border-radius:18px;background:rgba(150,160,175,.12);color:inherit;font:inherit;';
 for(const name of ['Все страны',...countries]){const opt=document.createElement('option');opt.value=name;opt.textContent=name;filter.append(opt)}
 list.before(filter);
 function render(){
  list.replaceChildren();buttons.clear();
  for(const country of countries){
   if(filter.value!=='Все страны'&&filter.value!==country)continue;
   const label=document.createElement('h3');label.className='sv-music-section-title';label.style.cssText='margin:18px 0 8px;font-size:15px;';label.textContent=country;list.append(label);
   for(const station of stations.filter(x=>x.country===country)){
    const row=document.createElement('article');row.className='sv-radio-station';
    const art=document.createElement('span');art.className='sv-radio-art';art.style.backgroundColor=station.color;art.style.backgroundImage='url("'+station.artwork+'")';art.style.backgroundSize='cover';art.setAttribute('aria-hidden','true');
    const copy=document.createElement('div');copy.className='sv-radio-copy';const title=document.createElement('strong');title.textContent=station.name;
    const subtitle=document.createElement('small');subtitle.textContent=station.genre+(station.quality?' · '+station.quality:'');
    const link=document.createElement('a');link.href=station.site;link.target='_blank';link.rel='noopener noreferrer';link.textContent=station.stream?'Сайт станции':'Официальный плеер ↗';
    copy.append(title,subtitle,link);row.append(art,copy);
    if(station.stream){const play=document.createElement('button');play.type='button';play.className='sv-radio-play';play.addEventListener('click',()=>{if(!window.SEYVEO_MUSIC?.playRadio?.(stations,station.id)){status.textContent='Не удалось открыть эфир. Откройте сайт станции.';}drawRadio()});buttons.set(station.id,play);row.append(play)}
    list.append(row);
   }
  }
  drawRadio();
 }
 filter.addEventListener('change',render);render();
 document.addEventListener('seyveo:music-state',drawRadio);
 for(const name of ['playing','pause','error','emptied'])audio.addEventListener(name,drawRadio);
 toggle.addEventListener('click',()=>{if(window.SEYVEO_MUSIC_DOCK?.show){window.SEYVEO_MUSIC_DOCK.show('radio');return}panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initRadio,{once:true});else initRadio();
})();
