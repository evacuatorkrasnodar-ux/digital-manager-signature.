/* SEYVEO Air · Music — native-first, PWA test drive.
 * Plays only audio files explicitly selected by the user.
 * Does NOT fetch or stream Spotify/Apple Music/YouTube; does NOT store files.
 * Keep the ORIGINAL Sayvi sphere and routing. Object URLs are ephemeral.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const page=$('sayviMusicPage');
const audio=$('sayviMusicAudio');
const fileInput=$('sayviMusicFiles');
const player=$('sayviMusicPlay');
const previous=$('sayviMusicPrevious');
const next=$('sayviMusicNext');
const seek=$('sayviMusicSeek');
const elapsed=$('sayviMusicElapsed');
const duration=$('sayviMusicDuration');
const heading=$('sayviMusicTrack');
const artist=$('sayviMusicArtist');
const status=$('sayviMusicStatus');
const collection=$('sayviMusicCollection');
const stage=$('sayviMusicStage');
const artwork=$('sayviMusicArtwork');
const miniArtwork=$('sayviMusicMiniArtwork');
const miniTitle=$('sayviMusicMiniTitle');
const miniArtist=$('sayviMusicMiniArtist');
const importBtn=$('sayviMusicImport');
const options=$('sayviMusicProviders');
const providerText=$('sayviMusicProviderText');
const sourcesPanel=$('sayviMusicSourcesPanel');
const sourcesToggle=$('sayviMusicSourcesToggle');
const sourcesClose=$('sayviMusicSourcesClose');
const mini=$('sayviMusicMini');
const miniOpen=$('sayviMusicMiniOpen');
const miniPlay=$('sayviMusicMiniPlay');
const miniNext=$('sayviMusicMiniNext');
const miniIcon=$('sayviMusicMiniIcon');
const minimize=$('sayviMusicMinimize');
const favoriteButton=$('sayviMusicFavorite');
const favoritesToggle=$('sayviMusicFavoritesToggle');
if(!page||!audio||!fileInput||!player||!seek||!status||!heading||!collection||!importBtn)return;
// The original audio file is never renamed, transcoded, uploaded or modified.
const metadata=window.SEYVEO_MUSIC_METADATA;
const fallbackInfo=file=>metadata?.filenameParts(file?.name)||{
 title:String(file?.name||'Без названия').replace(/\.[^.]+$/,''),
 artist:'',display:String(file?.name||'Без названия')
};
let trackDescriptions=new WeakMap(),coverDataURL=null,coverReader=null;
const infoFor=file=>file?(trackDescriptions.get(file)||fallbackInfo(file)):fallbackInfo(null);
const safeName=file=>infoFor(file).display;
const extensions=/\.(mp3|m4a|aac|wav|ogg|opus|flac|alac|aiff|aif|mp4)$/i;
const MAX_TRACKS=40,MAX_FILE_SIZE=180*1024*1024;
const providers=Object.freeze({
 apple:{
  name:'Apple Music',
  copy:'Для полноценной мобильной версии планируем официальное подключение MusicKit с разрешением владельца и проверкой подписки там, где сервис доступен. Сейчас подписка не подключена, и PWA не воспроизводит каталог Apple Music.'
 },
 spotify:{
  name:'Spotify',
  copy:'Здесь пока нет связи со Spotify. Его SDK и правила использования ограничивают управление воспроизведением и работу голосовых помощников; мы не будем выдавать отдельный плеер за готовую интеграцию.'
 },
 yandex:{
  name:'Яндекс Музыка',
  copy:'Добавили в план SEYVEO Play. Сейчас каталог Яндекс Музыки не подключён: для воспроизведения внутри Сэйви нужно отдельно проверить официально доступную интеграцию, права на музыку, подписку и согласие пользователя. Эта надпись пока не запускает музыку.'
 },
 vk:{
  name:'VK Музыка',
  copy:'Добавили в план SEYVEO Play. Подключение VK Музыки и право воспроизводить её каталог внутри Сэйви пока не подтверждены. Нужны официальные разрешения и поддерживаемый способ интеграции. Сейчас этот пункт показывает замысел, а не действующее подключение.'
 },
 local:{
  name:'Мои записи',
  copy:'Сейчас доступно настоящее прослушивание ваших собственных аудиофайлов. Они остаются на устройстве и открываются только на время работы плеера.'
 }
});
let tracks=[],index=-1,url=null,selectVersion=0,queueOpen=false,collectionMode='tracks';

/* Saved favorites are track fingerprints, not copied audio or subscriptions. */
const FAVORITES_KEY='seyveo-music-favorites-v1';
let favorites=new Set();
try{
 const stored=JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]');
 if(Array.isArray(stored))favorites=new Set(stored.filter(x=>typeof x==='string'&&x.length<350).slice(-200));
}catch{}
const favoriteId=file=>file?[
 String(file.name||'').trim().toLocaleLowerCase('ru-RU'),String(file.size||0),
 String(file.lastModified||0)
].join('|'):'';
function isFavorite(file){return !!file&&favorites.has(favoriteId(file))}
function updateFavorite(){
 if(!favoriteButton)return;
 const file=index>=0?tracks[index]:null;
 const liked=isFavorite(file);
 favoriteButton.disabled=!file;
 favoriteButton.setAttribute('aria-pressed',String(liked));
 favoriteButton.setAttribute('aria-label',!file?'Выберите трек для избранного':liked?'Убрать из избранного':'Добавить в избранное');
 favoriteButton.title=liked?'Убрать из избранного':'В избранное';
}
function toggleFavorite(){
 const file=index>=0?tracks[index]:null;if(!file)return;
 const key=favoriteId(file);
 if(favorites.has(key))favorites.delete(key);else favorites.add(key);
 try{localStorage.setItem(FAVORITES_KEY,JSON.stringify([...favorites].slice(-200)))}
 catch{sayviMessage('Не удалось сохранить избранное на этом устройстве.')}
 updateFavorite();collectionRender();
}
favoriteButton?.addEventListener('click',toggleFavorite);

// A dismissed remote stays hidden while the audio keeps playing.
// Entering the full music screen is the deliberate way to restore it.
let miniDismissed=false;
// A selected local file is not a playing session. Show the small remote only
// after the audio element has actually started playback at least once.
let hasPlayed=false;
const fmt=time=>{
 if(!Number.isFinite(time)||time<0)return '0:00';
 const t=Math.floor(time);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
};
const sayviMessage=message=>{status.textContent=message;status.hidden=!message;};
function updatePlay(){
 const playing=!audio.paused&&!audio.ended&&!!audio.src;
 if(playing)hasPlayed=true;
 page.classList.toggle('sv-music-playing',playing);
 if('mediaSession' in navigator){
  try{navigator.mediaSession.playbackState=playing?'playing':'paused'}catch{}
 }
 player.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');
 player.setAttribute('aria-pressed',String(playing));
 $('sayviMusicPlayIcon')?.setAttribute('d',playing?'M8 6v12M16 6v12':'M8 5.5 18 12 8 18.5z');
 syncResume();
}
function syncResume(){
 const loaded=tracks.length>0&&index>=0;
 // Empty-state visuals must never resemble a broken, disabled progress bar.
 page.classList.toggle('sv-music-empty',!loaded);
 const playing=loaded&&!audio.paused&&!audio.ended;
 // One actual audio element. The mini is a small remote, not a second player.
 if(mini){
  mini.hidden=!loaded||!hasPlayed||audio.ended||location.hash==='#sayvi-music'||miniDismissed;
  mini.classList.toggle('is-playing',playing);
  if(loaded){
   const file=tracks[index];
   const info=infoFor(file);
   if(miniTitle)miniTitle.textContent=info.title||safeName(file);
   if(miniArtist)miniArtist.textContent=info.artist||'Моя музыка';
   if(miniOpen)miniOpen.setAttribute('aria-label','Открыть плеер: '+safeName(file));
   if(miniPlay){
    miniPlay.setAttribute('aria-label',playing?'Пауза':'Продолжить воспроизведение');
    miniPlay.setAttribute('aria-pressed',String(playing));
   }
   miniIcon?.setAttribute('d',playing?'M8 6v12M16 6v12':'M8 5.5 18 12 8 18.5z');
   const canSkip=tracks.length>1;
   if(miniNext)miniNext.disabled=!canSkip;
  }
 }
 document.dispatchEvent(new CustomEvent('seyveo:music-state',{detail:{loaded,playing,hasPlayed}}));
}
function syncQueueToggle(){
 if(collection)collection.setAttribute('aria-label',collectionMode==='favorites'?'Избранные песни':'Треки SEYVEO Music');
 if(favoritesToggle){
  favoritesToggle.setAttribute('aria-expanded',String(queueOpen&&collectionMode==='favorites'&&!collection.hidden));
  favoritesToggle.setAttribute('aria-label','Избранное · песен: '+favorites.size);
 }
}
function hidePanels(){
 queueOpen=false;
 collection.hidden=true;
 if(sourcesPanel)sourcesPanel.hidden=true;
 if(sourcesToggle)sourcesToggle.setAttribute('aria-expanded','false');
 syncQueueToggle();
}
function showCollection(mode){
 if(mode==='tracks'&&!tracks.length){
  sayviMessage('Сначала выберите свои аудиофайлы.');
  importBtn.focus({preventScroll:true});
  return false;
 }
 if(sourcesPanel)sourcesPanel.hidden=true;
 sourcesToggle?.setAttribute('aria-expanded','false');
 collectionMode=mode;
 queueOpen=true;
 collectionRender();
 collection.scrollTop=0;
 syncQueueToggle();
 collection.querySelector('.sv-music-panel-close')?.focus({preventScroll:true});
 return true;
}
function showQueue(){return showCollection('tracks')}
function toggleQueue(){
 if(queueOpen&&!collection.hidden&&collectionMode==='tracks'){
  hidePanels();
  return false;
 }
 return showQueue();
}
function toggleFavorites(){
 if(queueOpen&&!collection.hidden&&collectionMode==='favorites'){hidePanels();return false}
 return showCollection('favorites');
}
function toggleSources(force){
 if(!sourcesPanel)return;
 const show=typeof force==='boolean'?force:sourcesPanel.hidden;
 if(show){queueOpen=false;collection.hidden=true;syncQueueToggle()}
 sourcesPanel.hidden=!show;
 sourcesToggle?.setAttribute('aria-expanded',String(show));
 if(show)sourcesClose?.focus({preventScroll:true});
 else sourcesToggle?.focus({preventScroll:true});
}

function updateTime(){
 const total=Number.isFinite(audio.duration)?audio.duration:0;
 const now=Number.isFinite(audio.currentTime)?audio.currentTime:0;
 elapsed.textContent=fmt(now);duration.textContent=total?fmt(total):'0:00';
 seek.max='1000';seek.value=total>0?String(Math.round(now/total*1000)):'0';
 seek.disabled=!total;
 seek.setAttribute('aria-valuetext',fmt(now)+' из '+fmt(total));
 seek.style.setProperty('--music-progress',(total>0?Math.min(100,now/total*100):0).toFixed(2)+'%');
 mini?.style.setProperty('--sv-mini-progress',(total>0?Math.min(100,now/total*100):0).toFixed(2)+'%');
}
/* Data images are already permitted by the app's CSP; blob: images are not.
   Keep MP3 cover art local, capped, and do not expand the security policy. */
function clearArtwork(){
 stage?.classList.remove('has-artwork','is-checking-artwork');
 mini?.classList.remove('has-artwork');
 for(const surface of [artwork,miniArtwork]){
  if(!surface)continue;
  surface.hidden=true;
  surface.style.removeProperty('background-image');
 }
}
function showArtwork(){
 if(!coverDataURL)return;
 const candidate=coverDataURL;
 // Decode offscreen before revealing. Failed or CSP-blocked images stay icons.
 const probe=new Image();
 probe.onload=()=>{
  if(coverDataURL!==candidate)return;
  for(const [surface,holder] of [[artwork,stage],[miniArtwork,mini]]){
   if(!surface)continue;
   surface.style.backgroundImage='url("'+candidate+'")';
   surface.hidden=false;
   holder?.classList.add('has-artwork');
  }
  stage?.classList.remove('is-checking-artwork');
 };
 probe.onerror=()=>{if(coverDataURL===candidate)stage?.classList.remove('is-checking-artwork')};
 probe.src=candidate;
}
function loadArtwork(blob,version,file){
 if(!blob||!['image/jpeg','image/png'].includes(blob.type)||blob.size>1800000){
  stage?.classList.remove('is-checking-artwork');return;
 }
 const reader=new FileReader();
 coverReader=reader;
 reader.onload=()=>{
  if(coverReader!==reader||version!==selectVersion||tracks[index]!==file)return;
  coverReader=null;
  const value=reader.result;
  if(typeof value!=='string'||!/^data:image\/(?:png|jpeg);base64,/i.test(value)){
   stage?.classList.remove('is-checking-artwork');return;
  }
  coverDataURL=value;
  showArtwork();
  mediaSession();
 };
 reader.onerror=()=>{
  if(coverReader!==reader)return;
  coverReader=null;stage?.classList.remove('is-checking-artwork');
 };
 try{reader.readAsDataURL(blob)}
 catch{if(coverReader===reader)coverReader=null;stage?.classList.remove('is-checking-artwork')}
}
function safeRelease(){
 if(coverReader){
  try{if(coverReader.readyState===FileReader.LOADING)coverReader.abort()}catch{}
  coverReader=null;
 }
 clearArtwork();
 if(url){try{URL.revokeObjectURL(url)}catch{}url=null}
 coverDataURL=null;
}
function mediaSession(){
 if(!('mediaSession' in navigator))return;
 try{
  if(typeof MediaMetadata==='function'&&index>=0){
   const info=infoFor(tracks[index]);
   navigator.mediaSession.metadata=new MediaMetadata({
    title:info.title,
    artist:info.artist||'Моя музыка · SEYVEO',
    album:info.album||'SEYVEO SOUND',
    // Only the real embedded cover (CSP-approved data URL) is used by MediaSession.
    artwork:coverDataURL&&info.artwork?[{src:coverDataURL,type:info.artwork.type||'image/jpeg',sizes:''}]:[]
   });
  }
  navigator.mediaSession.setActionHandler('play',()=>play());
  navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
  navigator.mediaSession.setActionHandler('previoustrack',()=>switchTrack(index-1,true));
  navigator.mediaSession.setActionHandler('nexttrack',()=>switchTrack(index+1,true));
  navigator.mediaSession.setActionHandler('seekto',details=>{
   if(Number.isFinite(details.seekTime))audio.currentTime=Math.min(Math.max(0,details.seekTime),audio.duration||0);
  });
 }catch{}
}
function collectionRender(){
 collection.replaceChildren();
 if(collectionMode==='tracks'&&!tracks.length){
  collection.hidden=true;
  syncQueueToggle();
  return;
 }
 collection.hidden=!queueOpen;
 const favoriteView=collectionMode==='favorites';
 const loaded=new Map(tracks.map((file,i)=>[favoriteId(file),{file,i}]));
 const entries=favoriteView?[...favorites].map(key=>({key,match:loaded.get(key)}))
  :tracks.map((file,i)=>({key:favoriteId(file),match:{file,i}}));
 const header=document.createElement('div');
 header.className='sv-music-collection-header';
 const title=document.createElement('p');
 title.className='sv-music-collection-label';
 title.textContent=favoriteView?'ИЗБРАННОЕ · '+favorites.size:'ТРЕКИ · '+tracks.length;
 const dismiss=document.createElement('button');
 dismiss.type='button';dismiss.className='sv-music-panel-close';
 dismiss.textContent='Готово';dismiss.setAttribute('aria-label','Свернуть список и вернуться к плееру');
 dismiss.addEventListener('click',hidePanels);
 header.append(title,dismiss);
 collection.append(header);
 if(favoriteView){
  const note=document.createElement('p');
  note.className='sv-music-favorites-note';
  note.textContent=!entries.length
   ?'Пока здесь пусто. Добавьте песню сердечком рядом с названием.'
   :entries.some(entry=>!entry.match)
    ?'Любимые песни сохранены. Чтобы слушать после перезапуска, выберите файлы снова через «Моя музыка».'
    :'Ваши любимые песни.';
  collection.append(note);
 }
 entries.forEach(({key,match},position)=>{
  const btn=document.createElement('button');
  btn.type='button';btn.className='sv-music-track-row';
  if(favoriteView)btn.classList.add('sv-music-favorites-row');
  const available=!!match;
  if(available){
   btn.dataset.musicIndex=String(match.i);
   btn.setAttribute('aria-current',String(match.i===index));
  }
  const count=document.createElement('span');count.className='sv-music-row-num';
  count.textContent=String(position+1).padStart(2,'0');
  const name=document.createElement('span');name.className='sv-music-row-title';
  const remembered=String(key).split('|').slice(0,-2).join('|').replace(/\.[^.]+$/,'');
  name.textContent=available
   ?safeName(match.file)
   :remembered||'Любимая песня';
  btn.append(count,name);
  if(!available){
   btn.classList.add('sv-music-favorites-unavailable');
   btn.title='Выбрать файл песни заново';
   btn.setAttribute('aria-label',name.textContent+'. Выбрать файл для воспроизведения');
   btn.addEventListener('click',()=>fileInput.click());
  }else btn.addEventListener('click',()=>switchTrack(match.i,true));
  collection.append(btn);
 });
 syncQueueToggle();
}
function switchTrack(i,autoplay=false){
 if(!tracks.length)return false;
 const newIndex=((i%tracks.length)+tracks.length)%tracks.length;
 const file=tracks[newIndex];const version=++selectVersion;
 audio.pause();audio.removeAttribute('src');audio.load();safeRelease();
 try{url=URL.createObjectURL(file)}catch{
  sayviMessage('Не удалось открыть файл. Попробуйте выбрать другой аудиофайл.');
  updatePlay();return false;
 }
 index=newIndex;
 audio.src=url;
 updateFavorite();
 const visible=infoFor(file);
 heading.textContent=visible.title;
 artist.textContent=visible.artist||'Моя музыка';
 previous.disabled=next.disabled=tracks.length<2;
 collectionRender();mediaSession();updatePlay();updateTime();
 // Bounded local ID3 read never interrupts or delays the real audio element.
 if(metadata?.describe){
  stage?.classList.add('is-checking-artwork');
  Promise.resolve(metadata.describe(file)).then(info=>{
   if(version!==selectVersion||tracks[index]!==file||!info)return;
   trackDescriptions.set(file,info);
   updateFavorite();
   if(info.artwork)loadArtwork(info.artwork,version,file);
   else stage?.classList.remove('is-checking-artwork');
   heading.textContent=info.title;
   artist.textContent=info.artist||'Моя музыка';
   collectionRender();mediaSession();syncResume();
  }).catch(()=>{if(version===selectVersion)stage?.classList.remove('is-checking-artwork')});
 }
 if(autoplay){
  const playing=audio.play();
  if(playing&&typeof playing.catch==='function')playing.catch(()=>{
   if(version!==selectVersion)return;
   sayviMessage('Для воспроизведения коснитесь значка Play. Система могла остановить автоматический запуск.');
  });
 }else sayviMessage('');
 return true;
}
function play(){
 if(!tracks.length){
  fileInput.click();
  sayviMessage('Выберите свои аудиофайлы — Сэйви откроет их здесь.');
  return;
 }
 if(!audio.paused){audio.pause();return}
 const p=audio.play();
 if(p&&typeof p.catch==='function')p.catch(()=>{
  sayviMessage('Не удалось начать воспроизведение. Возможно, формат файла не поддерживается этим устройством.');
 });
}
function ingest(list){
 const candidates=Array.from(list||[]);
 const chosen=candidates.filter(file=>{
  const name=String(file.name||'');
  return (file.type.startsWith('audio/')||extensions.test(name))&&file.size>0&&file.size<=MAX_FILE_SIZE;
 }).slice(0,MAX_TRACKS);
 if(!chosen.length){
  sayviMessage('Не нашла подходящие аудиофайлы. Выберите MP3, M4A, AAC, WAV или другой поддерживаемый телефоном формат.');
  return false;
 }
 tracks=chosen;
 trackDescriptions=new WeakMap();
 switchTrack(0,false);
 if(candidates.length>chosen.length)
  sayviMessage('Добавлено '+chosen.length+' из '+candidates.length+' файлов. Ограничение — 40 файлов до 180 МБ каждый; неподдерживаемые пропущены.');
 return true;
}
function providerChoose(name){
 const p=providers[name];if(!p)return;
 providerText.hidden=false;
 providerText.replaceChildren();
 const lead=document.createElement('strong');lead.textContent=p.name;
 const copy=document.createElement('p');copy.textContent=p.copy;
 providerText.append(lead,copy);

 options.querySelectorAll('[data-music-provider]').forEach(btn=>{
  btn.setAttribute('aria-pressed',String(btn.dataset.musicProvider===name));
 });
}
function understand(raw){
 if(typeof raw!=='string'||raw.length>300)return null;
 const value=raw.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 if(!value||/[;\n\r]/.test(value))return null;
 const command=/(?:^|[\s,])(?:включи|включить|поставь|поставить|запусти|запустить|открой|открыть|покажи|послушаем|послушать|хочу послушать|хочу слушать|проиграй|давай слушать|сыграй|поставь мне|включи мне)(?:\s+(?:мне|нам|какую-нибудь|что-нибудь|немного|пожалуйста|для меня)){0,4}\s+(?:музык|песн|трек|плейлист|плеер|джаз|рок|мелоди|радио|классик|спотиф|spotify|apple music|ютуб music|youtube music)/i;
 const direct=/^(?:(?:сэйви|сейви)[,!\s]+)?(?:музыка|музыкальный плеер|сэйви музыка|seyveo music|se y veo music)[.!?\s]*$/i;
 return command.test(value)||direct.test(value)?'music':null;
}
// The Now Playing surface returns to its actual source, not unconditionally
// Home.  A remembered route is an in-memory hint only: no new navigation
// history, persistent store or duplicate music session.
const MUSIC_RETURN_ROUTES=new Set(['#home','#life','#tasks','#calendar','#manage','#picture']);
let musicPreviousRoute=location.hash||'#home';
let musicReturnRoute='#home';
function open(){
 if(location.hash==='#sayvi-music')return true;
 // Remember synchronously as well as from hashchange so an immediate
 // minimize/open cycle on iPhone cannot inherit an older origin.
 const origin=location.hash||'#home';
 if(MUSIC_RETURN_ROUTES.has(origin))musicReturnRoute=origin;
 else musicReturnRoute='#home';
 location.hash='#sayvi-music';
 return true;
}
function minimizeMusic(){
 hidePanels();
 // Returning from Music does not stop the single audio element. Its existing
 // mini-player remains available above the original navigation dock.
 location.hash=MUSIC_RETURN_ROUTES.has(musicReturnRoute)?musicReturnRoute:'#home';
 return true;
}
minimize?.addEventListener('click',minimizeMusic);
/* Match the Now Playing dismissal gesture without taking over page scrolling.
 * Only a downward swipe across the album-art region can dismiss Music;
 * it never changes playback, seek, lyric gestures, or the fixed dock. */
if(stage){
 let start=null;
 stage.addEventListener('touchstart',event=>{
  if(event.touches.length!==1||page.classList.contains('sv-music-lyrics-mode')){
   start=null;return;
  }
  const point=event.touches[0];
  start={x:point.clientX,y:point.clientY};
 },{passive:true});
 stage.addEventListener('touchcancel',()=>{start=null},{passive:true});
 stage.addEventListener('touchend',event=>{
  if(!start||page.classList.contains('sv-music-lyrics-mode')){
   start=null;return;
  }
  const point=event.changedTouches[0];
  const dy=point.clientY-start.y,dx=Math.abs(point.clientX-start.x);
  start=null;
  if(dy>72&&dx<40&&location.hash==='#sayvi-music')minimizeMusic();
 },{passive:true});
}

/* Artwork/title keep the full-player action; horizontal swipes switch
 * the current track without opening the full screen or moving the dock. */
let suppressMiniClickUntil=0;
miniOpen?.addEventListener('click',event=>{
 if(Date.now()<suppressMiniClickUntil){
  event.preventDefault();
  return;
 }
 open();
});
if(miniOpen){
 let miniTouchStart=null;
 miniOpen.addEventListener('touchstart',event=>{
  if(event.touches.length!==1){miniTouchStart=null;return}
  const p=event.touches[0];
  miniTouchStart={x:p.clientX,y:p.clientY};
 },{passive:true});
 miniOpen.addEventListener('touchcancel',()=>{miniTouchStart=null},{passive:true});
 miniOpen.addEventListener('touchend',event=>{
  if(!miniTouchStart||event.changedTouches.length!==1){
   miniTouchStart=null;return;
  }
  const p=event.changedTouches[0];
  const dx=p.clientX-miniTouchStart.x;
  const dy=p.clientY-miniTouchStart.y;
  miniTouchStart=null;
  if(Math.abs(dx)<55||Math.abs(dy)>35||Math.abs(dx)<Math.abs(dy)*1.6)return;
  // The swipe is a deliberate transport gesture, not a click to open.
  event.preventDefault();
  suppressMiniClickUntil=Date.now()+400;
  if(tracks.length>1){
   switchTrack(index+(dx>0?-1:1),true);
  }
 },{passive:false});
}
miniPlay?.addEventListener('click',play);
miniNext?.addEventListener('click',()=>{if(tracks.length>1)switchTrack(index+1,true)});
// Now Playing stays in one stable position above the dock or chat composer.
// The fixed mini rests ABOVE the native chat writer, including multiline drafts.
// ResizeObserver reads layout changes instead of adding scroll/keyboard timers.
const miniWriter=$('ask');
if(mini&&miniWriter&&typeof ResizeObserver==='function'){
 const measureWriter=()=>{
  const height=Math.ceil(miniWriter.getBoundingClientRect().height);
  if(height>0){
   mini.style.setProperty('--sv-mini-writer-height',height+'px');
  }
 };
 new ResizeObserver(measureWriter).observe(miniWriter);
 measureWriter();
}
favoritesToggle?.addEventListener('click',toggleFavorites);
sourcesToggle?.addEventListener('click',()=>toggleSources());
sourcesClose?.addEventListener('click',()=>toggleSources(false));
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape'||location.hash!=='#sayvi-music')return;
 if(!collection.hidden||!sourcesPanel?.hidden){
  hidePanels();sourcesToggle?.focus({preventScroll:true});
 }else minimizeMusic();
});
function syncMusicRoute(){
 const current=location.hash||'#home';
 const inside=current==='#sayvi-music';
 if(inside&&musicPreviousRoute!=='#sayvi-music'){
  // Direct #hash navigation from the library, calendar or a saved task
  // reaches Music without calling open(). Preserve that valid origin too.
  musicReturnRoute=MUSIC_RETURN_ROUTES.has(musicPreviousRoute)
   ?musicPreviousRoute:'#home';
 }
 musicPreviousRoute=current;
 if(inside)miniDismissed=false;
 document.documentElement.classList.toggle('sv-music-screen',inside);
 if(!inside)hidePanels();
 else syncQueueToggle();
 syncResume();
}
window.addEventListener('hashchange',syncMusicRoute);
// Main navigation also uses history.pushState(), which does NOT fire hashchange.
// Always clear the music-only screen class when the user opens Sayvi chat.
window.addEventListener('seyveo:route-changed',syncMusicRoute);
importBtn.addEventListener('click',()=>fileInput.click());
player.addEventListener('click',play);
previous.addEventListener('click',()=>switchTrack(index-1,true));
next.addEventListener('click',()=>switchTrack(index+1,true));
fileInput.addEventListener('change',()=>{ingest(fileInput.files);fileInput.value=''});
seek.addEventListener('input',()=>{
 const duration=audio.duration;
 if(Number.isFinite(duration)&&duration>0)audio.currentTime=Number(seek.value)/1000*duration;
});
options.addEventListener('click',event=>{
 const btn=event.target.closest('[data-music-provider]');
 if(btn&&options.contains(btn))providerChoose(btn.dataset.musicProvider);
});
audio.addEventListener('timeupdate',updateTime);
audio.addEventListener('durationchange',updateTime);
audio.addEventListener('loadedmetadata',updateTime);
audio.addEventListener('playing',()=>{updatePlay();sayviMessage('')});
audio.addEventListener('pause',updatePlay);
audio.addEventListener('ended',()=>{if(tracks.length>1)switchTrack(index+1,true);else{updatePlay();sayviMessage('Сэйви: музыка закончилась. Включить ещё раз?')}});
audio.addEventListener('error',()=>{updatePlay();if(index>=0)sayviMessage('Не смогла прочитать эту запись. Возможно, её формат не поддерживается.')});
/* Screen lock/background can dispatch lifecycle changes.
 * Never stop an actively playing track on pagehide: the OS decides if WebKit
 * can continue. A full browser termination remains outside PWA control. */
window.addEventListener('pagehide',event=>{
 if(event.persisted||!audio.paused)return;
 safeRelease();
});
// Safari may return from back-forward cache after the ephemeral URL was revoked.
// Restore the selection WITHOUT starting playback or asking for permissions.
window.addEventListener('pageshow',event=>{
 if(event.persisted&&tracks.length&&index>=0&&!audio.getAttribute('src'))
  switchTrack(index,false);
});
$('sayviMusicFromComposer')?.addEventListener('click',()=>{
 $('hideInput')?.click();open();
});
previous.disabled=true;next.disabled=true;seek.disabled=true;
updateFavorite();
updatePlay();updateTime();collectionRender();syncMusicRoute();
window.SEYVEO_MUSIC=Object.freeze({
 understand,open,minimize:minimizeMusic,openQueue:showQueue,toggleQueue,closePanels:hidePanels,
 state:()=>Object.freeze({
  loaded:tracks.length,trackIndex:index,playing:!!tracks.length&&!audio.paused,
  source:'local-file',connectedServices:0
 })
});
})();