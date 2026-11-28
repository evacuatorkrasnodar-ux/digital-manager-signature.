/* SEYVEO Podcasts — public RSS, local subscriptions and playback positions. */
(()=>{
'use strict';
const init=()=>{
const panel=document.getElementById('svMusicPodcasts');if(!panel)return;
const get=id=>document.getElementById(id),audio=get('svPodcastAudio'),form=get('svPodcastForm'),input=get('svPodcastUrl'),list=get('svPodcastFeeds'),episodes=get('svPodcastEpisodes'),status=get('svPodcastStatus'),player=get('svPodcastPlayer'),file=get('svPodcastXml');
const KEY='seyveo-podcasts-v1';
// Dedicated viewport layer; independent of the music page's grid and dock.
const overlay=document.createElement('section');overlay.id='svPodcastViewport';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Плеер подкаста');
const notice=document.createElement('p');notice.id='svPodcastViewportNotice';notice.hidden=true;notice.setAttribute('role','status');
const polish=document.createElement('style');polish.id='svPodcastPlayerPolishV16';polish.textContent=`
html body #svPodcastViewport[hidden],html body #svPodcastViewport [hidden]{display:none!important}
html body #svPodcastViewport:not([hidden]){display:block!important;position:fixed!important;inset:0!important;z-index:2147483000!important;overflow:hidden!important;background:#151515!important;color:#fff!important;isolation:isolate;--text:#fff;--secondary:#ffffffa8;--soft-line:#ffffff38}
html body #svPodcastViewport #svPodcastPlayer:not([hidden]){position:relative!important;display:flex!important;flex-direction:column!important;justify-content:flex-end!important;align-items:stretch!important;gap:14px!important;width:100%!important;height:100%!important;min-height:0!important;max-width:none!important;margin:0!important;padding:0 24px calc(22px + env(safe-area-inset-bottom,0px))!important;box-sizing:border-box!important;overflow-y:auto!important;border:0!important;border-radius:0!important;background:#151515!important;box-shadow:none!important;color:#fff!important}
html body #svPodcastViewport #svPodcastFullCover{display:block!important;position:relative!important;flex:1 1 0!important;min-height:160px!important;max-height:none!important;width:calc(100% + 48px)!important;margin:0 -24px!important;overflow:hidden!important;isolation:isolate;background:#25262c}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art{display:grid!important;place-items:center!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border-radius:0!important;overflow:hidden!important;background:radial-gradient(ellipse at 45% 20%,#465267,#272d39 48%,#151515 100%)!important;color:#ffffffb0}
html body #svPodcastViewport #svPodcastFullCover .sv-podcast-art img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 42%!important;display:block!important}
html body #svPodcastViewport #svPodcastFullCover::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#0004 0%,transparent 15%,transparent 52%,#151515 100%);pointer-events:none}
#svPodcastViewport #svPodcastFullCover .sv-podcast-art>svg{width:70px;height:70px}
#svPodcastViewport .sv-podcast-cover-label{position:absolute;top:15%;left:8%;right:8%;font-size:clamp(23px,7vw,40px);font-weight:650;line-height:1.15;text-align:center;overflow-wrap:anywhere;color:#f5f5f7}
html body #svPodcastViewport #svPodcastCollapse{display:grid!important;place-items:center!important;position:absolute!important;z-index:3;top:env(safe-area-inset-top,0px);left:50%;transform:translateX(-50%)!important;width:64px!important;height:44px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
#svPodcastViewport #svPodcastCollapse span{width:36px;height:4px;border-radius:9px;background:#ffffffa8;box-shadow:none}
#svPodcastViewport #svPodcastNowArt{display:none!important}
#svPodcastViewport .sv-podcast-now-identity,#svPodcastViewport .sv-podcast-timeline,#svPodcastViewport .sv-podcast-transport{width:100%;max-width:480px;margin:0 auto!important;flex:0 0 auto;box-sizing:border-box}
#svPodcastViewport .sv-podcast-now-copy{display:grid;gap:5px;min-width:0}
#svPodcastViewport #svPodcastPlaying{font-size:clamp(19px,5vw,25px);font-weight:650;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#fff}
#svPodcastViewport #svPodcastPlayingFeed{font-size:14px;color:#ffffffa8}
#svPodcastViewport .sv-podcast-timeline{display:grid;gap:4px}
#svPodcastViewport .sv-podcast-times{display:flex;justify-content:space-between;font-size:12px;color:#ffffffa8;font-variant-numeric:tabular-nums}
html body #svPodcastViewport #svPodcastSeek{appearance:none;-webkit-appearance:none;width:100%!important;height:24px!important;min-height:0!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;box-shadow:none!important;accent-color:#fff}
#svPodcastViewport #svPodcastSeek::-webkit-slider-runnable-track{height:4px;border-radius:99px;background:linear-gradient(to right,#fff var(--sv-podcast-progress,0%),#ffffff40 var(--sv-podcast-progress,0%))}
#svPodcastViewport #svPodcastSeek::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;margin-top:-4px}
#svPodcastViewport #svPodcastSeek::-moz-range-track{height:4px;background:#ffffff40;border-radius:99px}
#svPodcastViewport #svPodcastSeek::-moz-range-progress{height:4px;background:#fff}
#svPodcastViewport #svPodcastSeek::-moz-range-thumb{width:12px;height:12px;background:#fff;border:0;border-radius:50%}
html body #svPodcastViewport .sv-podcast-transport{display:grid!important;grid-template-columns:repeat(5,minmax(44px,1fr));align-items:center;justify-items:center;gap:0!important;padding:4px 0 8px!important}
html body #svPodcastViewport .sv-podcast-transport button,html body #svPodcastViewport .sv-podcast-transport .sv-podcast-quick{display:grid!important;place-items:center!important;position:relative!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;padding:0!important;margin:0!important;color:#fff!important;background:transparent!important;background-image:none!important;border:0!important;box-shadow:none!important;transform:none!important;font:inherit}
#svPodcastViewport .sv-podcast-transport button::before,#svPodcastViewport .sv-podcast-transport button::after{content:none!important}
#svPodcastViewport .sv-podcast-transport button svg{width:30px;height:30px}
#svPodcastViewport #svPodcastToggle svg{width:44px;height:44px}
#svPodcastViewport .sv-podcast-quick>span{font-size:14px;font-weight:600;pointer-events:none}
#svPodcastViewport .sv-podcast-quick>svg{width:24px;height:24px;pointer-events:none}
html body #svPodcastViewport .sv-podcast-quick select{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;opacity:0!important;cursor:pointer}
#svPodcastViewport .sv-podcast-quick:focus-within{outline:2px solid #fff9;border-radius:12px}
#svPodcastViewport .sv-podcast-quick.is-active{color:#8fbbff!important}
#svPodcastViewport .sv-podcast-player-tools{display:none!important}
#svPodcastViewportNotice{flex:0 0 auto;color:#ffffffa8;text-align:center;font-size:12px;margin:0}
@media(min-width:650px){html body #svPodcastViewport #svPodcastFullCover{width:min(calc(100% + 48px),680px)!important;margin:0 auto!important}}
@media(max-height:600px){html body #svPodcastViewport #svPodcastPlayer:not([hidden]){gap:7px!important;padding-bottom:12px!important}html body #svPodcastViewport #svPodcastFullCover{min-height:120px!important}}
`;document.head.appendChild(polish);
overlay.append(player);player.append(notice);document.body.append(overlay);
const speedSelect=get('svPodcastSpeed'),sleepSelect=get('svPodcastSleep'),transport=player.querySelector('.sv-podcast-transport');
const speedQuick=document.createElement('label'),sleepQuick=document.createElement('label');speedQuick.className=sleepQuick.className='sv-podcast-quick';
const speedText=document.createElement('span');speedText.textContent='1×';speedSelect.setAttribute('aria-label','Скорость воспроизведения');speedQuick.append(speedText,speedSelect);
sleepQuick.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/><path d="M15 3h4l-4 4h4"/></svg>';sleepSelect.setAttribute('aria-label','Таймер сна');sleepQuick.append(sleepSelect);transport.prepend(speedQuick);transport.append(sleepQuick);
function updateQuick(){speedText.textContent=String(speedSelect.value||'1').replace('.',',')+'×';sleepQuick.classList.toggle('is-active',Number(sleepSelect.value)>0)}
speedSelect.addEventListener('change',updateQuick);sleepSelect.addEventListener('change',updateQuick);

let state={feeds:[],progress:{},favorites:{},last:null,speed:1},selected=null,current=null,loadToken=0,lastSave=0,sleepTimer=null,fullOpen=false,podcastOwnsAudio=false;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&Array.isArray(saved.feeds)){state={...state,...saved};state.progress=state.progress||{};state.favorites=state.favorites||{}}}catch{}
const say=t=>{status.textContent=t||'';status.hidden=!t;notice.textContent=t||'';notice.hidden=!t};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{say('Не удалось сохранить изменения на устройстве.');return false}};
const el=(tag,cls,t)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(t!=null)n.textContent=t;return n};
const button=(t,fn)=>{const b=el('button','sv-podcast-button',t);b.type='button';b.addEventListener('click',fn);return b};
const https=(v,base)=>{try{const u=new URL(v,base);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
const direct=(node,name)=>Array.from(node?.children||[]).find(x=>x.localName===name);
const value=(node,name)=>direct(node,name)?.textContent?.trim()||'';
function parse(xml,base){
const d=new DOMParser().parseFromString(xml,'application/xml');if(d.querySelector('parsererror'))throw Error('Не удалось прочитать RSS.');
const channel=d.getElementsByTagName('channel')[0];if(!channel)throw Error('Это не RSS-лента подкаста.');
const title=value(channel,'title')||'Подкаст',items=[];
for(const item of Array.from(channel.children).filter(n=>n.localName==='item').slice(0,100)){
const enc=direct(item,'enclosure'),url=enc?.getAttribute('url');if(!url)continue;const type=enc.getAttribute('type')||'',src=https(url,base);
if(!src||type&&!/^(audio\/|application\/ogg)/i.test(type))continue;
const id=src;if(items.some(x=>x.id===id))continue;
const image=direct(item,'image');const imageUrl=image?.getAttribute('href')||value(image,'url');items.push({id,src,title:(value(item,'title')||'Выпуск').slice(0,250),date:value(item,'pubDate').slice(0,100),artwork:imageUrl?https(imageUrl,base):''});
}
if(!items.length)throw Error('В этой ленте нет доступных аудиовыпусков.');
const author=value(channel,'author')||value(channel,'managingEditor');const images=Array.from(channel.children).filter(x=>x.localName==='image');const artUrl=images.map(x=>x.getAttribute('href')||value(x,'url')).find(Boolean);const artwork=artUrl?https(artUrl,base):'';return {title:title.slice(0,160),author:author.slice(0,160),artwork,items};
}
function storeFeed(id,data){
const existing=state.feeds.find(f=>f.id===id);
if(existing){const merged=new Map(existing.items.map(e=>[e.id,e]));for(const e of data.items)merged.set(e.id,e);existing.items=[...data.items,...[...merged.values()].filter(e=>!data.items.some(x=>x.id===e.id))].slice(0,150);existing.title=data.title;existing.author=data.author||existing.author||'';existing.artwork=data.artwork||existing.artwork||'';existing.directoryArtwork=data.directoryArtwork||existing.directoryArtwork||'';existing.directoryId=data.directoryId||existing.directoryId||null;existing.country=data.country||existing.country||'RU';existing.updated=Date.now()}
else{if(state.feeds.length>=30)throw Error('Достигнут предел подписок.');state.feeds.unshift({id,...data,updated:Date.now()})}
persist();render();
}
const localServer=()=>['localhost','127.0.0.1'].includes(location.hostname);
async function readFeed(id,signal){
 if(localServer()){
  const res=await fetch('/api/seyveo-podcast-feed?'+new URLSearchParams({url:id}),{signal,credentials:'same-origin'});
  if(!res.ok)throw Error(res.status===404?'Обнови и перезапусти локальный сервер.':'Не удалось получить выпуски.');
  const data=await res.json();if(typeof data.xml!=='string'||data.xml.length>3000000)throw Error('Лента недоступна.');
  return {xml:data.xml,url:data.url||id}
 }
 const res=await fetch(id,{signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!res.ok)throw Error('Лента недоступна.');const xml=await res.text();if(xml.length>3000000)throw Error('Лента слишком большая.');return {xml,url:res.url||id}
}
async function load(url,meta=null){
const id=https(url);if(!id){say('Вставь HTTPS-ссылку на RSS подкаста.');return}
const token=++loadToken;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);
say('Загружаю выпуски…');get('svPodcastAdd').disabled=true;
try{const response=await readFeed(id,controller.signal);if(token!==loadToken)return;const data=parse(response.xml,response.url);if(meta){data.author=data.author||meta.author||'';data.directoryArtwork=meta.directoryArtwork||meta.artwork||'';data.artwork=data.artwork||meta.artwork||'';data.directoryId=meta.directoryId||null;data.country=meta.country||'RU'}storeFeed(id,data);input.value='';closeManual();say('');return true}
catch(e){if(token===loadToken){if(meta?.directoryId){try{const data=await directoryEpisodes(meta);if(token!==loadToken)return false;storeFeed(id,data);say('');return true}catch{}}say(e.message==='Failed to fetch'||e.name==='AbortError'||e instanceof TypeError?'Сайт не разрешает загрузить ленту из приложения. Можно добавить скачанный RSS-файл.':e.message||'Не удалось загрузить ленту.');return false}}
finally{clearTimeout(timeout);if(token===loadToken)get('svPodcastAdd').disabled=false}
}
form.addEventListener('submit',e=>{e.preventDefault();load(input.value.trim())});
file.addEventListener('change',async()=>{const f=file.files?.[0];if(!f)return;try{if(f.size>3000000)throw Error('Файл слишком большой.');const xml=typeof f.text==='function'?await f.text():await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(f)});const data=parse(xml);storeFeed('file:'+data.title,data);say('')}catch(e){say(e.message||'Не удалось прочитать файл.')}finally{file.value=''}});
const duration=s=>{const n=Math.max(0,Math.floor(s||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
function savePosition(force=false){if(!current||audio.readyState<1||!Number.isFinite(audio.currentTime))return;if(!force&&Date.now()-lastSave<5000)return;lastSave=Date.now();state.progress[current.id]={position:audio.currentTime,duration:Number.isFinite(audio.duration)?audio.duration:0,finished:audio.ended,updated:Date.now()};state.last={feed:current.feed,id:current.id};persist()}
function play(feed,ep){
if(current?.id===ep.id&&podcastOwnsAudio){openFull();if(audio.paused)audio.play().catch(()=>say('Не удалось начать воспроизведение.'));return}
savePosition(true);audio.pause();current=null;const pos=state.progress[ep.id];current={...ep,feed:feed.id};player.hidden=false;get('svPodcastPlaying').textContent=ep.title;get('svPodcastPlayingFeed').textContent=feed.title;paintCurrentCover(feed,ep);get('svPodcastMiniTitle').textContent=ep.title;get('svPodcastMiniAuthor').textContent=feed.title;podcastOwnsAudio=true;openFull();updateTransport();
const main=document.getElementById('sayviMusicAudio');main?.pause();
audio.src=ep.src;audio.playbackRate=state.speed||1;get('svPodcastSpeed').value=String(audio.playbackRate);updateQuick();
const expected=ep.src;
const resume=()=>{if(current?.src!==expected)return;if(pos&&!pos.finished&&pos.position>0&&(!Number.isFinite(audio.duration)||pos.position<audio.duration-2))try{audio.currentTime=pos.position}catch{}};
audio.addEventListener('loadedmetadata',resume,{once:true});audio.play().catch(()=>say('Нажми воспроизведение, чтобы начать слушать.'));state.last={feed:feed.id,id:ep.id};persist();renderEpisodes();renderHighlights();
}
audio.addEventListener('play',()=>{document.getElementById('sayviMusicAudio')?.pause();say('')});
const seek=get('svPodcastSeek'),toggle=get('svPodcastToggle'),mini=get('svPodcastMini'),miniToggle=get('svPodcastMiniToggle'),root=document.documentElement,page=get('sayviMusicPage');
function syncPodcastView(){
 const inside=page.dataset.musicView&&root.classList.contains('sv-music-screen'),browse=inside&&page.dataset.musicView!=='player';
 const full=!!(fullOpen&&current&&podcastOwnsAudio&&page.dataset.musicView==='podcasts'&&!panel.hidden);
 root.classList.toggle('sv-podcast-full-open',full);
 panel.classList.toggle('sv-podcast-full-open',full);
 overlay.hidden=!full;player.hidden=!full;
 if(full)get('svPodcastCollapse').focus({preventScroll:true});
 const showMini=!!(current&&podcastOwnsAudio&&browse&&!full);
 mini.hidden=!showMini;root.classList.toggle('sv-podcast-mini-active',showMini);
}
function openFull(){
 if(!current||!podcastOwnsAudio)return;
 if(page.dataset.musicView!=='podcasts')window.SEYVEO_MUSIC_DOCK?.show?.('podcasts');
 openSearch(false);resetTools();fullOpen=true;syncPodcastView();page.scrollTop=0;renderHighlights();
}
function closeFull(){fullOpen=false;syncPodcastView();renderHighlights();page.scrollTop=0;if(!mini.hidden)get('svPodcastMiniOpen').focus({preventScroll:true})}
get('svPodcastCollapse').addEventListener('click',closeFull);
get('svPodcastMiniOpen').addEventListener('click',openFull);
miniToggle.addEventListener('click',()=>{if(current){if(audio.paused||audio.ended)audio.play().catch(()=>say('Не удалось начать воспроизведение.'));else audio.pause()}});
get('svPodcastMiniForward').addEventListener('click',()=>jump(30));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fullOpen){e.preventDefault();closeFull()}});

function updateTransport(){
 const d=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0,t=Number.isFinite(audio.currentTime)?audio.currentTime:0;
 seek.disabled=!d;seek.max=String(d||1);seek.value=String(Math.min(t,d||1));seek.style.setProperty('--sv-podcast-progress',(d?100*t/d:0)+'%');get('svPodcastElapsed').textContent=duration(t);get('svPodcastRemaining').textContent='−'+duration(Math.max(0,d-t));
 const playing=!audio.paused&&!audio.ended;if(toggle.dataset.playing===String(playing))return;toggle.dataset.playing=String(playing);toggle.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');toggle.innerHTML=playing?'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l12 7-12 7z"/></svg>';miniToggle.innerHTML=toggle.innerHTML;miniToggle.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');
}
function jump(delta){if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+delta));updateTransport()}}
seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number(seek.value);updateTransport()}});
get('svPodcastRewind').addEventListener('click',()=>jump(-15));get('svPodcastForward').addEventListener('click',()=>jump(30));
toggle.addEventListener('click',()=>{if(!current)return;if(audio.paused||audio.ended)audio.play().catch(()=>say('Не удалось начать воспроизведение.'));else audio.pause()});
for(const type of ['play','pause','ended','loadedmetadata','durationchange','timeupdate','seeking','emptied'])audio.addEventListener(type,updateTransport);
document.getElementById('sayviMusicAudio')?.addEventListener('play',()=>{audio.pause();clearTimeout(sleepTimer);get('svPodcastSleep').value='0';updateQuick();podcastOwnsAudio=false;fullOpen=false;syncPodcastView();renderHighlights()});
audio.addEventListener('timeupdate',()=>savePosition());audio.addEventListener('pause',()=>{savePosition(true);renderEpisodes();renderHighlights()});audio.addEventListener('ended',()=>{savePosition(true);renderEpisodes();renderHighlights()});audio.addEventListener('error',()=>say('Выпуск сейчас недоступен.'));
get('svPodcastSpeed').addEventListener('change',e=>{state.speed=Number(e.target.value)||1;audio.playbackRate=state.speed;persist()});
get('svPodcastSleep').addEventListener('change',e=>{clearTimeout(sleepTimer);const minutes=Number(e.target.value);if(minutes>0)sleepTimer=setTimeout(()=>{audio.pause();get('svPodcastSleep').value='0';updateQuick();say('Таймер сна завершён.')},minutes*60000)});
window.addEventListener('pagehide',()=>savePosition(true));
function renderEpisodes(){
episodes.replaceChildren();const feed=state.feeds.find(f=>f.id===selected);if(!feed)return;
const header=el('div','sv-podcast-detail-title');header.append(artwork(feed),copyOf(feed.title,feed.author||feed.items.length+' выпусков'));episodes.append(header);
for(const ep of feed.items){
const row=el('div','sv-podcast-episode'),copy=button(ep.title,()=>{play(feed,ep);document.getElementById('sayviMusicPage').scrollTop=0});copy.className='sv-podcast-episode-title';
const pos=state.progress[ep.id],date=Date.parse(ep.date),meta=el('small','',[(Number.isFinite(date)?new Date(date).toLocaleDateString('ru-RU'):''),pos?.finished?'Прослушано':pos?.position>0?'Продолжить · '+duration(pos.position):''].filter(Boolean).join(' · '));
const heart=button(state.favorites[ep.id]?'♥':'♡',()=>{if(state.favorites[ep.id])delete state.favorites[ep.id];else state.favorites[ep.id]=true;persist();renderEpisodes();renderHighlights()});heart.className='sv-podcast-heart';heart.setAttribute('aria-label',state.favorites[ep.id]?'Убрать из избранного':'В избранное');heart.setAttribute('aria-pressed',String(!!state.favorites[ep.id]));
const body=el('div','sv-podcast-episode-copy');body.append(copy,meta);const p=action('',()=>{play(feed,ep);document.getElementById('sayviMusicPage').scrollTop=0});p.classList.add('sv-podcast-episode-play');p.setAttribute('aria-label','Слушать '+ep.title);p.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="m8 5 12 7-12 7z"/></svg>';row.append(body,p,heart);episodes.append(row);
}
}

const searchOpen=get('svPodcastSearchOpen'),searchForm=get('svPodcastSearchBar'),searchInput=get('svPodcastSearchInput'),results=get('svPodcastSearchResults'),manage=get('svPodcastManage'),manual=get('svPodcastManual');
let searchSerial=0,manageOpen=false;
const options=get('svPodcastOptions'),editSubscriptions=get('svPodcastEditSubscriptions');
function closeOptions(){options.hidden=true;manage.setAttribute('aria-expanded','false')}
function closeManual(){const wasOpen=!manual.hidden;manual.hidden=true;panel.classList.remove('sv-podcast-manual-active');input.blur();if(wasOpen){const label=document.querySelector('#sayviMusicPage [data-title-view="podcasts"]');if(label)label.textContent='Подкасты';if(!panel.hidden)document.getElementById('sayviMusicPage').scrollTop=0}}
function resetTools(){closeOptions();closeManual();manageOpen=false;manage.setAttribute('aria-label','Управление подписками')}
function openSearch(value=true){
 searchForm.hidden=!value;searchOpen.setAttribute('aria-expanded',String(value));
 if(value){selected=null;resetTools();render();searchInput.focus()}else{searchSerial++;results.hidden=true;results.replaceChildren();searchInput.value='';panel.classList.remove('sv-podcast-search-active');if(!panel.hidden)document.getElementById('sayviMusicPage').scrollTop=0}
}
searchOpen.addEventListener('click',()=>openSearch(searchForm.hidden));
const back=document.querySelector('#sayviMusicPage .sv-music-inner-back');back?.addEventListener('click',e=>{if(panel.hidden)return;if(!searchForm.hidden||selected||!manual.hidden){e.preventDefault();e.stopImmediatePropagation();if(!searchForm.hidden)openSearch(false);selected=null;resetTools();render();document.getElementById('sayviMusicPage').scrollTop=0}},true);
manage.addEventListener('click',()=>{if(manageOpen){manageOpen=false;manage.setAttribute('aria-label','Управление подписками');render();return}if(!options.hidden){closeOptions();return}editSubscriptions.hidden=!state.feeds.length;options.hidden=false;manage.setAttribute('aria-expanded','true')});
editSubscriptions.addEventListener('click',()=>{closeOptions();closeManual();manageOpen=true;manage.setAttribute('aria-label','Завершить управление подписками');render()});
get('svPodcastAddLink').addEventListener('click',()=>{closeOptions();selected=null;manageOpen=false;render();manual.hidden=false;panel.classList.add('sv-podcast-manual-active');say('');const label=document.querySelector('#sayviMusicPage [data-title-view="podcasts"]');if(label)label.textContent='Добавить подкаст';document.getElementById('sayviMusicPage').scrollTop=0;input.focus()});
get('svPodcastCloseManual').addEventListener('click',()=>{closeManual();say('')});
get('svPodcastAddFile').addEventListener('click',()=>{closeOptions();file.click()});
document.addEventListener('click',e=>{if(!options.hidden&&!options.contains(e.target)&&!manage.contains(e.target))closeOptions()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!options.hidden){closeOptions();manage.focus()}});

function artwork(feed,large=false){
 const a=el('span','sv-podcast-art');a.setAttribute('aria-hidden','true');
 const fallback=()=>{a.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"><circle cx="12" cy="10" r="2"/><path d="M7.5 16a7 7 0 1 1 9 0M5 19a11 11 0 1 1 14 0M11 14h2l1 7h-4z"/></svg>';if(large&&feed.title)a.append(el('span','sv-podcast-cover-label',feed.title))};
 fallback();const urls=[feed.episodeArtwork,large?feed.artwork:feed.directoryArtwork,large?feed.directoryArtwork:feed.artwork].map(v=>https(v)).filter(Boolean);const choices=[...new Set(urls)];
 const tryNext=()=>{const url=choices.shift();if(!url){fallback();return}const img=el('img');img.alt='';img.loading=large?'eager':'lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',tryNext,{once:true});a.replaceChildren(img);img.src=url};if(choices.length)tryNext();return a
}
function paintCurrentCover(feed,ep){const cover={...feed,episodeArtwork:ep.artwork||''};get('svPodcastNowArt').replaceChildren(artwork(cover));get('svPodcastFullCover').replaceChildren(artwork(cover,true));get('svPodcastMiniArt').replaceChildren(artwork(cover))}
function copyOf(title,sub,fn){const c=fn?button('',fn):el('div');c.className='sv-podcast-row-copy';c.append(el('strong','',title));if(sub)c.append(el('small','',sub));return c}
function action(t,fn){const b=button(t,fn);b.classList.add('sv-podcast-flat-action');return b}
function episodeCard(feed,ep,sub){
 const go=()=>{play(feed,ep);render();document.getElementById('sayviMusicPage').scrollTop=0};const row=el('div','sv-podcast-episode-card');const p=action('▶',go);p.setAttribute('aria-label','Слушать '+ep.title);row.append(artwork(feed),copyOf(ep.title,sub||feed.title,go),p);return row
}
function renderHighlights(){
 const resume=get('svPodcastResume'),news=get('svPodcastNew'),recs=get('svPodcastForYou');resume.replaceChildren();news.replaceChildren();recs.replaceChildren();
 const all=[];for(const feed of state.feeds)for(const ep of feed.items)all.push({feed,ep,pos:state.progress[ep.id]});
 const visibleCurrent=current&&podcastOwnsAudio?current.id:null;
 const unfinished=all.filter(x=>x.ep.id!==visibleCurrent&&x.pos?.position>0&&!x.pos.finished).sort((a,b)=>b.pos.updated-a.pos.updated);
 resume.hidden=!unfinished.length;
 if(unfinished.length){resume.append(el('h3','sv-podcast-heading','Продолжить слушать'));for(const x of unfinished.slice(0,3))resume.append(episodeCard(x.feed,x.ep,x.feed.title+' · '+duration(x.pos.position)))}
 const fresh=all.filter(x=>x.ep.id!==visibleCurrent&&!x.pos?.position&&!x.pos?.finished&&Number.isFinite(Date.parse(x.ep.date))).sort((a,b)=>Date.parse(b.ep.date)-Date.parse(a.ep.date));news.hidden=!fresh.length;
 if(fresh.length){news.append(el('h3','sv-podcast-heading','Последние выпуски'));for(const x of fresh.slice(0,4))news.append(episodeCard(x.feed,x.ep,x.feed.title+' · '+new Date(x.ep.date).toLocaleDateString('ru-RU')))}
 const weights=new Map();for(const x of all)if(x.pos?.position>0||state.favorites[x.ep.id])weights.set(x.feed.id,(weights.get(x.feed.id)||0)+Math.min(60,(x.pos?.position||0)/60)+(state.favorites[x.ep.id]?10:0));
 const featured=new Set(fresh.slice(0,4).map(x=>x.ep.id));const picks=all.filter(x=>x.ep.id!==visibleCurrent&&weights.has(x.feed.id)&&!x.pos?.position&&!x.pos?.finished&&!featured.has(x.ep.id)).sort((a,b)=>weights.get(b.feed.id)-weights.get(a.feed.id)||((Date.parse(b.ep.date)||0)-(Date.parse(a.ep.date)||0)));
 recs.hidden=!picks.length;if(picks.length){recs.append(el('h3','sv-podcast-heading','Для тебя'),el('p','sv-podcast-muted','На основе твоих прослушиваний и избранного.'));for(const x of picks.slice(0,3))recs.append(episodeCard(x.feed,x.ep))}
}
function render(){
 list.replaceChildren();list.classList.toggle('sv-podcast-grid',state.feeds.length>0&&!manageOpen);if(!state.feeds.some(f=>f.id===selected))selected=null;panel.classList.toggle('sv-podcast-detail',!!selected);syncPodcastView();const label=document.querySelector('#sayviMusicPage [data-title-view="podcasts"]');if(label)label.textContent=manual.hidden?'Подкасты':'Добавить подкаст';
 get('svPodcastIntro').hidden=!!state.feeds.length;editSubscriptions.hidden=!state.feeds.length;
 get('svPodcastTopics').hidden=!!state.feeds.length;
 for(const feed of state.feeds){
  const go=()=>{selected=feed.id;resetTools();render();document.getElementById('sayviMusicPage').scrollTop=0};
  const row=el('div','sv-podcast-feed'),title=copyOf(feed.title,feed.author||feed.items.length+' выпусков',go);title.setAttribute('aria-pressed',String(feed.id===selected));if(manageOpen)row.append(artwork(feed),title);else{const tile=button('',go);tile.className='sv-podcast-tile';tile.append(artwork(feed),title.querySelector('strong'),title.querySelector('small'));row.append(tile)}
  if(manageOpen){if(https(feed.id)){const refresh=action('↻',()=>load(feed.id,feed));refresh.setAttribute('aria-label','Обновить выпуски');row.append(refresh)}const remove=action('',()=>{if(!confirm('Убрать подписку «'+feed.title+'»?'))return;if(current?.feed===feed.id){audio.pause();current=null;fullOpen=false;podcastOwnsAudio=false;audio.removeAttribute('src');audio.load();syncPodcastView()}state.feeds=state.feeds.filter(f=>f.id!==feed.id);persist();render()});remove.classList.add('sv-podcast-trash');remove.setAttribute('aria-label','Удалить подписку «'+feed.title+'»');row.append(remove)}
  list.append(row)
 }
 if(!state.feeds.length){list.append(el('p','sv-podcast-muted','Найди любимого автора, чтобы не пропускать выпуски.'));}
 renderHighlights();renderEpisodes();
}
// Cross-site callback runs in an opaque sandbox, not in the app origin.
async function directoryRequest(path,params){
 const url=new URL('https://itunes.apple.com/'+path);for(const [k,v] of Object.entries(params))url.searchParams.set(k,String(v));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 try{const response=await fetch(url.href,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('directory');return await response.json()}catch{}finally{clearTimeout(timer)}
 return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe');frame.hidden=true;frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('aria-hidden','true');
  url.searchParams.set('callback','svPodcastDirectoryCallback');const nonce=String(Date.now())+Math.random().toString(36).slice(2);
  let timeout;const cleanup=()=>{clearTimeout(timeout);window.removeEventListener('message',onMessage);frame.remove()};
  const onMessage=e=>{if(e.source!==frame.contentWindow||e.data?.nonce!==nonce)return;const data=e.data.data;cleanup();if(data&&Array.isArray(data.results))resolve(data);else reject(Error('Каталог временно недоступен.'))};
  window.addEventListener('message',onMessage);timeout=setTimeout(()=>{cleanup();reject(Error('Каталог временно недоступен.'))},10000);
  const source=JSON.stringify(url.href).replace(/</g,'\\u003c'),key=JSON.stringify(nonce);
  frame.srcdoc='<script>function svPodcastDirectoryCallback(data){parent.postMessage({nonce:'+key+',data:data},"*")}var s=document.createElement("script");s.src='+source+';s.onerror=function(){parent.postMessage({nonce:'+key+',data:null},"*")};document.head.appendChild(s);<\/script>';
  document.body.append(frame)
 })
}
function countryFor(term){if(/[а-яё]/i.test(term))return 'RU';const region=(navigator.language||'').split('-')[1];return /^[A-Z]{2}$/.test(region||'')?region:'US'}
async function directoryEpisodes(meta){
 const data=localServer()?await fetch('/api/seyveo-podcast-episodes?'+new URLSearchParams({id:meta.directoryId,country:meta.country||'RU'}),{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('Каталог выпусков недоступен.');return r.json()}):await directoryRequest('lookup',{id:meta.directoryId,entity:'podcastEpisode',limit:50,country:meta.country||'RU'});
 const items=[];for(const x of (data.results||[])){const src=https(x.episodeUrl);if(x.kind!=='podcast-episode'||!src||items.some(e=>e.id===src))continue;items.push({id:src,src,title:String(x.trackName||'Выпуск').slice(0,250),date:String(x.releaseDate||'').slice(0,100),artwork:https(x.artworkUrl600||x.artworkUrl160||x.artworkUrl100)})}
 if(!items.length)throw Error('Выпуски недоступны');
 return {title:meta.title,author:meta.author||'',directoryId:meta.directoryId,country:meta.country||'RU',artwork:meta.artwork||'',directoryArtwork:meta.directoryArtwork||meta.artwork||'',items}
}
let following=false;
async function search(term){
 term=String(term||'').trim();if(!term)return;
 const token=++searchSerial;panel.classList.add('sv-podcast-search-active');document.getElementById('sayviMusicPage').scrollTop=0;searchInput.blur();results.hidden=false;results.replaceChildren(el('p','sv-podcast-muted','Ищу подкасты…'));
 try{
  const country=countryFor(term);const data=await directoryRequest('search',{term,media:'podcast',entity:'podcast',limit:24,country});if(token!==searchSerial)return;
  results.replaceChildren(el('h3','sv-podcast-heading','Результаты поиска'));
  const found=[];for(const x of (data.results||[])){const id=https(x.feedUrl);if(!id||found.some(f=>f.id===id))continue;found.push({id,title:String(x.collectionName||x.trackName||'Подкаст').slice(0,160),author:String(x.artistName||'').slice(0,160),directoryId:Number(x.collectionId||x.trackId)||null,artwork:https(String(x.artworkUrl600||x.artworkUrl100||x.artworkUrl60||'').replace(/^http:\/\/(?=[^/]+\.mzstatic\.com\/)/i,'https://')),country})}
  if(!found.length)results.append(el('p','sv-podcast-muted','Ничего не найдено. Попробуй другое название или тему.'));
  for(const feed of found){const saved=state.feeds.find(f=>f.id===feed.id);if(saved&&feed.artwork){saved.directoryArtwork=feed.artwork;saved.directoryId=feed.directoryId||saved.directoryId;persist()}const row=el('div','sv-podcast-result');const subscribed=state.feeds.some(f=>f.id===feed.id);const follow=action(subscribed?'✓':'＋',async()=>{if(following||state.feeds.some(f=>f.id===feed.id))return;following=true;follow.disabled=true;follow.textContent='…';try{const ok=await load(feed.id,feed);follow.textContent=ok?'✓':'＋';follow.disabled=!!ok;if(ok)follow.setAttribute('aria-label','Уже в подписках');if(!ok&&status.textContent&&token===searchSerial){const note=el('small','sv-podcast-row-error',status.textContent);row.querySelector('.sv-podcast-row-copy').append(note)}}finally{following=false}});follow.disabled=subscribed;follow.setAttribute('aria-label',subscribed?'Уже в подписках':'Подписаться на '+feed.title);row.append(artwork(feed),copyOf(feed.title,feed.author),follow);results.append(row)}
  if(found.length)results.append(el('small','sv-podcast-directory-credit','Каталог: Apple Podcasts. Аудио — из открытых лент издателей.'));
 }catch{if(token===searchSerial)results.replaceChildren(el('p','sv-podcast-muted','Каталог временно недоступен. Попробуй ещё раз.'))}
}
searchForm.addEventListener('submit',e=>{e.preventDefault();search(searchInput.value)});
searchInput.addEventListener('input',()=>{if(!searchInput.value.trim()){searchSerial++;results.hidden=true;results.replaceChildren();panel.classList.remove('sv-podcast-search-active')}});
searchInput.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();openSearch(false);searchOpen.focus()}});
get('svPodcastTopics').addEventListener('click',e=>{const b=e.target.closest('[data-podcast-topic]');if(!b)return;openSearch();searchInput.value=b.dataset.podcastTopic;search(searchInput.value)});
let refreshing=false,repairing=false;
const artAttempts=new Set();
async function restoreArtwork(){
 if(repairing)return;repairing=true;
 try{for(const feed of state.feeds){if(panel.hidden)break;if(feed.directoryArtwork||artAttempts.has(feed.id)||!https(feed.id))continue;artAttempts.add(feed.id);
  try{const data=await directoryRequest('search',{term:feed.title,media:'podcast',entity:'podcast',limit:20,country:feed.country||countryFor(feed.title)});if(!state.feeds.includes(feed))continue;
   const exact=(data.results||[]).find(x=>(feed.directoryId&&Number(x.collectionId||x.trackId)===Number(feed.directoryId))||https(x.feedUrl)===feed.id);if(!exact)continue;
   const art=https(String(exact.artworkUrl600||exact.artworkUrl100||exact.artworkUrl60||'').replace(/^http:\/\/(?=[^/]+\.mzstatic\.com\/)/i,'https://'));if(!art)continue;feed.directoryArtwork=art;feed.directoryId=Number(exact.collectionId||exact.trackId)||feed.directoryId;persist();if(current?.feed===feed.id)paintCurrentCover(feed,current);if(!panel.hidden)render();
  }catch{}}
 }finally{repairing=false}
}
async function refreshSubscriptions(){
 if(refreshing)return;refreshing=true;
 try{
  const due=state.feeds.filter(f=>https(f.id)&&Date.now()-(f.updated||0)>3600000);
  for(const feed of due){
   if(panel.hidden)break;
   const c=new AbortController(),timeout=setTimeout(()=>c.abort(),18000);
   try{
    let data;
    try{const response=await readFeed(feed.id,c.signal);data=parse(response.xml,response.url)}
    catch{if(!feed.directoryId)continue;data=await directoryEpisodes(feed)}
    if(!state.feeds.includes(feed))continue;
    const merged=new Map(feed.items.map(e=>[e.id,e]));for(const e of data.items)merged.set(e.id,e);
    feed.items=[...data.items,...[...merged.values()].filter(e=>!data.items.some(x=>x.id===e.id))].slice(0,150);
    feed.title=data.title;feed.author=data.author||feed.author||'';feed.artwork=data.artwork||feed.artwork||'';feed.updated=Date.now();persist();
    if(current?.feed===feed.id)paintCurrentCover(feed,feed.items.find(ep=>ep.id===current.id)||current);
    if(!panel.hidden){renderHighlights();renderEpisodes()}
   }catch{}finally{clearTimeout(timeout)}
  }
 }finally{refreshing=false}
}
document.addEventListener('seyveo:music-view',e=>{if(e.detail?.view==='podcasts'){render();refreshSubscriptions();restoreArtwork()}else{fullOpen=false;selected=null;openSearch(false);resetTools();if(current){savePosition(true);if(!e.detail?.view||e.detail.view==='player')audio.pause()}syncPodcastView()}});
render();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();