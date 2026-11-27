/* Music-only navigation layer inside the existing dock shell.
   Never change the common navigation buttons, SVGs, attributes or handlers.
   Search stays the original standalone control; the main mini-player is reused. */
(()=>{'use strict';
function init(){
 const dock=document.querySelector('footer.dock.sv-shared-dock'),page=document.getElementById('sayviMusicPage');
 if(!dock||!page||window.SEYVEO_MUSIC_DOCK)return;
 const root=document.documentElement;
 const tabs=[["home","Музыка","<path d=\"M9 17.2V5.6l11-2.3v11.6M9 9l11-2.3\"/><ellipse cx=\"5.9\" cy=\"17.6\" rx=\"3.1\" ry=\"2.35\" transform=\"rotate(-12 5.9 17.6)\"/><ellipse cx=\"16.9\" cy=\"15.3\" rx=\"3.1\" ry=\"2.35\" transform=\"rotate(-12 16.9 15.3)\"/>"],["new","Новинки","<rect x=\"3.7\" y=\"3.7\" width=\"7\" height=\"7\" rx=\"1.8\"/><rect x=\"13.3\" y=\"3.7\" width=\"7\" height=\"7\" rx=\"1.8\"/><rect x=\"3.7\" y=\"13.3\" width=\"7\" height=\"7\" rx=\"1.8\"/><rect x=\"13.3\" y=\"13.3\" width=\"7\" height=\"7\" rx=\"1.8\"/>"],["radio","Радио","<circle cx=\"12\" cy=\"12\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M8.2 8.2a5.4 5.4 0 0 0 0 7.6m7.6-7.6a5.4 5.4 0 0 1 0 7.6M5.2 5.2a9.6 9.6 0 0 0 0 13.6m13.6-13.6a9.6 9.6 0 0 1 0 13.6\"/>"],["library","Медиатека","<path d=\"M7 3h10M5.5 5.8h13\"/><rect x=\"3.8\" y=\"8.5\" width=\"16.4\" height=\"12.4\" rx=\"2.5\"/><circle cx=\"12\" cy=\"14.7\" r=\"3.6\"/><circle cx=\"12\" cy=\"14.7\" r=\".75\" fill=\"currentColor\" stroke=\"none\"/>"]];
 const nav=document.createElement('nav');nav.className='sv-music-nav-only';nav.hidden=true;nav.setAttribute('aria-label','Разделы SEYVEO Music');
 for(const [key,label,icon] of tabs){const btn=document.createElement('button');btn.type='button';btn.dataset.musicNav=key;btn.setAttribute('aria-label',label);btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon+'</svg><span>'+label+'</span>';nav.append(btn)}
 dock.append(nav);
 const panels={home:'svMusicHome',new:'svMusicNew',radio:'svMusicRadio',library:'svMusicLibrary',replay:'svMusicReplay',history:'svMusicHistory'};
 const get=id=>document.getElementById(id);
 let active=false,view='home',last='home',pending=false,libraryLimit=60;
 const inside=()=>location.hash==='#sayvi-music'&&!page.hidden;
 const music=()=>window.SEYVEO_MUSIC;
 // Palette is a stable hash of the local track identity, not a random color.
 const coverPalettes=[['#77969B','#315759'],['#8299B8','#354D73'],['#A091B3','#55446F'],['#BA9A81','#74513D'],['#819D8E','#3C6555'],['#B18F9E','#754C61'],['#8D9FAE','#465A71'],['#A9A17D','#6D633F']];
 const fallbackNote='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.2V5.6l11-2.3v11.6M9 9l11-2.3"/><ellipse cx="5.9" cy="17.6" rx="3.1" ry="2.35" transform="rotate(-12 5.9 17.6)"/><ellipse cx="16.9" cy="15.3" rx="3.1" ry="2.35" transform="rotate(-12 16.9 15.3)"/></svg>';
 let coverObserver=null,coverGeneration=0;
 function stopCoverObserver(){coverObserver?.disconnect();coverObserver=null;coverGeneration++}
 function paintCover(art,src){
  if(!src)return false;
  art.classList.remove('sv-track-fallback');art.classList.add('sv-track-cover');
  art.replaceChildren();art.style.backgroundImage='url("'+src+'")';return true;
 }
 function fallbackCover(art,item){
  let hash=2166136261;
  for(const char of String(item.artKey||item.id||item.title||'music')){hash=Math.imul(hash^char.charCodeAt(0),16777619)}
  const [light,deep]=coverPalettes[(hash>>>0)%coverPalettes.length];
  art.classList.add('sv-track-fallback');
  art.style.setProperty('--sv-track-light',light);art.style.setProperty('--sv-track-deep',deep);
  art.innerHTML=fallbackNote;
 }
 function watchCover(row,item,art,title,artist,generation){
  if(item.radio||!music()?.prepareTrackPreview)return;
  const load=()=>{if(generation!==coverGeneration||!row.isConnected)return;
   music().prepareTrackPreview(item.index).then(info=>{
    if(!info||generation!==coverGeneration||!row.isConnected)return;
    title.textContent=info.title;artist.textContent=info.artist;
    if(info.artwork)paintCover(art,info.artwork);
   }).catch(()=>{});
  };
  if(typeof IntersectionObserver!=='function'){load();return}
  if(!coverObserver)coverObserver=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){
    coverObserver?.unobserve(entry.target);
    entry.target.svLoadCover?.();delete entry.target.svLoadCover;
   }
  },{root:page,rootMargin:'100px 0px'});
  row.svLoadCover=load;coverObserver.observe(row);
 }
 function renderTracks(){
  stopCoverObserver();const generation=coverGeneration;
  if(!active)return;
  if(!['home','history','library'].includes(view))return;
  const recentRadio=window.SEYVEO_RADIO?.recent?.()||[];
  const recentLocal=music()?.recentTracks?.()||[];
  const history=[...recentLocal,...recentRadio].sort((a,b)=>(b.playedAt||0)-(a.playedAt||0));
  const library=view==='library'?(music()?.browseTracks?.()||[]):[];
  const lists=view==='home'?[['svMusicRecent',history.slice(0,5),true]]:view==='history'?[['svMusicHistoryTracks',history,false]]:[['svMusicLibraryTracks',library.slice(0,libraryLimit),false]];
  for(const [id,items,recent] of lists){
   const el=get(id);if(!el)continue;el.replaceChildren();
   if(!items.length){const empty=document.createElement('p');empty.className=recent?'sv-music-recent-empty':'sv-music-browse-caption';empty.textContent=recent||view==='history'?'Включите любимую станцию или добавьте музыку. Здесь появится история прослушивания.':'Добавьте аудиофайлы с устройства.';el.append(empty);continue}
   for(const item of items){
    const button=document.createElement('button');button.type='button';button.className=recent?'sv-music-recent-card':'sv-music-library-track';
    const art=document.createElement('span');art.className='sv-music-track-tile';art.setAttribute('aria-hidden','true');
    if(!paintCover(art,item.artwork))fallbackCover(art,item);
    const title=document.createElement('strong');title.textContent=item.title;const artist=document.createElement('small');artist.textContent=item.artist;
    const copy=document.createElement('span');copy.className='sv-music-track-tile-copy';copy.append(title,artist);button.append(art,copy);
    if(recent){const icon=document.createElement('span');icon.className='sv-music-recent-play';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24"><path d="M8 5.5v13L19 12z"/></svg>';button.append(icon)}
    button.addEventListener('click',()=>{if(item.radio){if(window.SEYVEO_RADIO?.play?.(item.id))show('player')}else if(music()?.playIndexFromSearch?.(item.index))show('player')});el.append(button);
    watchCover(button,item,art,title,artist,generation);
   }
   if(view==='library'&&library.length>libraryLimit){
    const more=document.createElement('button');more.type='button';more.className='sv-replay-back';more.style.cssText='display:block;width:100%;min-height:44px;text-align:center';more.textContent='Показать ещё · '+Math.min(60,library.length-libraryLimit);more.addEventListener('click',()=>{libraryLimit+=60;renderTracks()});el.append(more);
   }
  }
 }
 document.addEventListener('seyveo:radio-history',renderTracks);
 function renderReplay(){
  const select=get('svMusicReplayPeriod'),out=get('svMusicReplayResults');if(!select||!out)return;
  if(!select.options.length){
   const now=new Date(),format=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'});
   for(let i=0;i<24;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1),option=document.createElement('option');option.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');option.textContent=format.format(d);select.append(option)}
   for(let i=0;i<3;i++){const y=now.getFullYear()-i,option=document.createElement('option');option.value=String(y);option.textContent='Итоги '+y+' года';select.append(option)}
  }
  const data=music()?.replaySummary?.(select.value);out.replaceChildren();if(!data)return;
  const total=document.createElement('div');total.className='sv-replay-total';
  const minutes=Math.floor(data.seconds/60),value=document.createElement('strong');value.textContent=minutes.toLocaleString('ru-RU');
  const label=document.createElement('span');label.textContent='мин. прослушивания';total.append(value,label);out.append(total);
  const duration=s=>s<60?Math.floor(s)+' сек.':Math.floor(s/60)+' мин.';
  if(!data.seconds){const empty=document.createElement('p');empty.className='sv-music-browse-caption';empty.textContent='Слушайте музыку и радио. Здесь появятся ваши настоящие музыкальные итоги.';out.append(empty);return}
  for(const [title,items] of [['Любимые исполнители',data.artists],['Любимые треки',data.tracks],['Любимые станции',data.stations]]){
   if(!items.length)continue;
   const h=document.createElement('h3');h.textContent=title;h.className='sv-music-section-title';out.append(h);
   for(const [i,item] of items.entries()){const row=document.createElement('div');row.className='sv-replay-row';const rank=document.createElement('span');rank.textContent=String(i+1);rank.className='sv-replay-rank';const copy=document.createElement('div');const name=document.createElement('strong');name.textContent=item.title;const sub=document.createElement('small');sub.textContent=item.artist||'';copy.append(name,sub);const time=document.createElement('span');time.textContent=duration(item.seconds);time.className='sv-replay-time';row.append(rank,copy,time);out.append(row)}
  }
 }
 get('svMusicReplayPeriod')?.addEventListener('change',renderReplay);
 document.getElementById('sayviMusicAudio')?.addEventListener('pause',()=>{if(view==='replay')renderReplay()});
 function show(key){
  if(!active||(!Object.hasOwn(panels,key)&&key!=='player'))return false;
  music()?.closePanels?.();
  if(key==='library'&&view!=='player'&&view!=='library')libraryLimit=60;
  view=key;if(key!=='player')last=key;
  page.dataset.musicView=key;root.classList.toggle('sv-music-browse',key!=='player');root.classList.toggle('sv-music-player-open',key==='player');
  for(const [name,id] of Object.entries(panels))get(id).hidden=name!==key;
  const discovery=get('sayviDiscoveryPanel');if(discovery)discovery.hidden=key!=='new';
  get('sayviMusicDiscoveryToggle')?.setAttribute('aria-expanded',String(key==='new'));
  get('svMusicRadioToggle')?.setAttribute('aria-expanded',String(key==='radio'));
  for(const btn of nav.querySelectorAll('button')){const selected=btn.dataset.musicNav===(['replay','history'].includes(key)?'home':key);btn.setAttribute('aria-pressed',String(selected));if(selected)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')}
  page.scrollTop=0;renderTracks();if(key==='replay')renderReplay();music()?.refreshMini?.();
  document.dispatchEvent(new CustomEvent('seyveo:music-view',{detail:{view:key}}));
  return true;
 }
 function enter(){
  if(active)return;active=true;nav.hidden=false;dock.classList.add('seyveo-music-dock','sv-music-navigation-only');
  const key=pending?'player':'home';pending=false;last='home';show(key);
 }
 function leave(){
  if(!active)return;stopCoverObserver();active=false;nav.hidden=true;dock.classList.remove('seyveo-music-dock','sv-music-navigation-only');
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
 const historyKey='seyveo-radio-recent-v1',timeKey='seyveo-radio-recent-time-v1';let history=[],playedAt={};
 try{const saved=JSON.parse(localStorage.getItem(timeKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))playedAt=saved}catch{}
 try{const saved=JSON.parse(localStorage.getItem(historyKey)||'[]');if(Array.isArray(saved))history=saved.filter(id=>typeof id==='string'&&stations.some(station=>station.id===id&&station.stream)).slice(0,6)}catch{}
 const recent=()=>history.map(id=>stations.find(x=>x.id===id)).filter(Boolean).map(station=>({radio:true,id:station.id,title:station.name,artist:station.country+' · '+station.quality,artwork:station.artwork,playedAt:Number(playedAt[station.id])||0}));
 window.SEYVEO_RADIO=Object.freeze({recent,play:id=>window.SEYVEO_MUSIC?.playRadio?.(stations,id)});
 audio.addEventListener('playing',()=>{const state=window.SEYVEO_MUSIC?.state?.();if(state?.source!=='radio'||!stations.some(x=>x.id===state.stationId))return;history=[state.stationId,...history.filter(id=>id!==state.stationId)].slice(0,6);playedAt[state.stationId]=Date.now();playedAt=Object.fromEntries(history.map(id=>[id,playedAt[id]||0]));try{localStorage.setItem(historyKey,JSON.stringify(history));localStorage.setItem(timeKey,JSON.stringify(playedAt))}catch{}document.dispatchEvent(new Event('seyveo:radio-history'))});
 document.dispatchEvent(new Event('seyveo:radio-history'));
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
