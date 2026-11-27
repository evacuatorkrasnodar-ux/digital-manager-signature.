/* SEYVEO Air · Music — native-first, PWA test drive.
 * Plays user-selected local files and curated HTTPS radio streams.
 * Does NOT fetch or stream Spotify/Apple Music/YouTube; stores user-imported audio locally in IndexedDB.
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
 const miniHomeSlot=$('svMusicHomeMiniSlot');
 const miniOrigin=document.createComment('seyveo music mini original position');
 if(mini?.parentNode)mini.parentNode.insertBefore(miniOrigin,mini);
 const miniOnMusicHome=()=>location.hash==='#sayvi-music'&&page.dataset.musicView==='home'&&!page.hidden&&!!miniHomeSlot;
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
let trackDescriptions=new WeakMap(),trackThumbnails=new WeakMap(),coverDataURL=null,coverReader=null;
let recentFiles=[];
const recentPlayedAt=new Map();
const infoFor=file=>file?.radio?{title:file.name,artist:file.country+' · '+file.quality,display:file.name,album:'SEYVEO RADIO'}:file?(trackDescriptions.get(file)||fallbackInfo(file)):fallbackInfo(null);
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
  copy:'Сейчас доступно настоящее прослушивание ваших собственных аудиофайлов. Они сохраняются в локальной медиатеке этого браузера и не отправляются на сервер.'
 }
});
let tracks=[],localTracks=[],index=-1,url=null,selectVersion=0,queueOpen=false,collectionMode='tracks',radioFallback=false;
 const isRadio=()=>!!tracks[index]?.radio;

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

// Offline audio library: store owned audio bytes and original file identity.
const LIBRARY_DB='seyveo-music-library-v1',LIBRARY_STORE='tracks';
const savedTrackIds=new Set();
let libraryLoading=true,libraryQueue=Promise.resolve(),librarySaving=0;
const RECENT_KEY='seyveo-music-recent-local-v1';
function rememberRecent(){
 try{localStorage.setItem(RECENT_KEY,JSON.stringify(recentFiles.slice(0,12).map(file=>({id:favoriteId(file),at:recentPlayedAt.get(file)||0}))))}catch{}
}
function restoreRecent(){
 try{
  const saved=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');if(!Array.isArray(saved))return;
  const byId=new Map(localTracks.map(file=>[favoriteId(file),file]));
  for(const entry of saved.slice(0,12)){const file=byId.get(entry?.id);if(!file||recentFiles.includes(file))continue;recentFiles.push(file);recentPlayedAt.set(file,Number(entry.at)||0)}
 }catch{}
}
const libraryNote=$('svMusicStorageStatus');
function libraryMessage(message){if(libraryNote)libraryNote.textContent=message;}
function libraryRefresh(){
 previous.disabled=next.disabled=tracks.length<2;
 collectionRender();syncResume();
}
function libraryCount(){return savedTrackIds.size+' сохранено на этом устройстве';}
function openLibraryDB(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('IndexedDB unavailable'));return}
  const request=indexedDB.open(LIBRARY_DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(LIBRARY_STORE))request.result.createObjectStore(LIBRARY_STORE,{keyPath:'id'})};
  request.onerror=()=>reject(request.error||Error('Library open failed'));
  request.onblocked=()=>reject(Error('Library blocked'));
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db)};
 });
}
async function libraryTransaction(mode,operation){
 const db=await openLibraryDB();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(LIBRARY_STORE,mode);
  let request;
  tx.oncomplete=()=>resolve(request?request.result:undefined);
  tx.onabort=tx.onerror=()=>reject(tx.error||Error('Library transaction failed'));
  try{request=operation(tx.objectStore(LIBRARY_STORE))}catch(error){try{tx.abort()}catch{}reject(error)}
 })}finally{db.close()}
}
async function restoreLibrary(){
 try{
  const keys=await libraryTransaction('readonly',store=>store.getAllKeys());
  const restored=[];let failed=0;
  // Read records one at a time rather than allocating the entire library at once.
  for(const key of keys){
   try{
    const record=await libraryTransaction('readonly',store=>store.get(key));
    if(!record||typeof record.name!=='string'){failed++;continue}
    const parts=Array.isArray(record.bytes)&&record.bytes.length&&record.bytes.every(part=>part instanceof ArrayBuffer)
     ?record.bytes:record.blob instanceof Blob&&record.blob.size?[record.blob]:null;
    if(!parts){failed++;continue}
    const file=new File(parts,record.name,{type:record.type||record.blob?.type||'',lastModified:record.lastModified||0});
    if(!file.size||(Number.isFinite(record.size)&&file.size!==record.size)){failed++;continue}
    restored.push({file,addedAt:record.addedAt||0});
   }catch{failed++}
  }
  for(const {file} of restored.sort((a,b)=>a.addedAt-b.addedAt)){
   const id=favoriteId(file);if(savedTrackIds.has(id))continue;
   localTracks.push(file);savedTrackIds.add(id);
  }
  restoreRecent();
  libraryLoading=false;
  if(localTracks.length&&!tracks.length){tracks=localTracks;switchTrack(Math.max(0,localTracks.indexOf(recentFiles[0])),false)}
  libraryRefresh();
  libraryMessage(libraryCount()+'. '+(failed?'Не удалось восстановить файлов: '+failed+'. Добавьте их повторно.':'Доступно без повторной загрузки.'));
 }catch(error){
  libraryLoading=false;libraryMessage('Не удалось открыть хранилище. Музыку можно слушать, но её сохранение может быть недоступно.');
  libraryRefresh();
 }
}
function readOwnedBytes(blob){
 if(typeof blob.arrayBuffer==='function')return blob.arrayBuffer();
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.onabort=()=>reject(Error('Read cancelled'));reader.readAsArrayBuffer(blob)});
}
async function saveLibraryFiles(files){
 const pending=files.filter(file=>!savedTrackIds.has(favoriteId(file)));
 if(!pending.length)return;
 const addedAt=Date.now();let failures=0;
 // Copy the actual bytes from iOS/Android file picker references. One track
 // per committed transaction, so a failed import never rolls back the others.
 const chunkSize=4*1024*1024;
 for(const [i,file] of pending.entries()){
  try{
   const bytes=[];
   for(let offset=0;offset<file.size;offset+=chunkSize)bytes.push(await readOwnedBytes(file.slice(offset,offset+chunkSize)));
   if(bytes.reduce((sum,part)=>sum+part.byteLength,0)!==file.size)throw Error('Incomplete file');
   const record={id:favoriteId(file),name:file.name,type:file.type,lastModified:file.lastModified,addedAt:addedAt+i,size:file.size,bytes};
   await libraryTransaction('readwrite',store=>store.put(record));
   savedTrackIds.add(record.id);
  }catch{failures++}
  libraryMessage('Сохранение на устройстве: '+(i+1)+' из '+pending.length+' · '+libraryCount());
 }
 if(failures)throw Error('Unsaved files: '+failures);
}

/* Replay: count actual advancing playback, never pauses, buffering or seeks.
   Local-only, no audio uploads. Keep up to 24 monthly aggregates. */
const REPLAY_KEY='seyveo-music-replay-v1';
let replayMonths={},replaySample=null,replayDirty=false,replayLastSave=0;
try{const saved=JSON.parse(localStorage.getItem(REPLAY_KEY)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))replayMonths=saved}catch{}
function replayMonth(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function replaySave(){
 if(!replayDirty)return;
 try{const keys=Object.keys(replayMonths).sort().slice(-24);localStorage.setItem(REPLAY_KEY,JSON.stringify(Object.fromEntries(keys.map(k=>[k,replayMonths[k]]))));replayDirty=false;replayLastSave=Date.now()}catch{}
}
function replayTick(){
 const file=tracks[index],now=Date.now(),pos=audio.currentTime;
 if(!file||audio.paused||audio.ended||audio.seeking||audio.readyState<2||!Number.isFinite(pos)){replaySample=null;return}
 const prior=replaySample;replaySample={version:selectVersion,now,pos};
 if(!prior||prior.version!==selectVersion)return;
 const wall=(now-prior.now)/1000,advance=pos-prior.pos;
 if(wall<=0||advance<=0||advance>wall*Math.max(1,audio.playbackRate)+.8)return;
 const seconds=Math.min(wall,advance/Math.max(.1,audio.playbackRate),10);
 if(seconds<=0)return;
 const month=replayMonth(),bucket=replayMonths[month]||(replayMonths[month]={seconds:0,items:{}});
 const key=file.radio?'radio:'+file.id:'file:'+favoriteId(file);
 const info=infoFor(file);
 const row=bucket.items[key]||(bucket.items[key]={seconds:0,title:'',artist:'',radio:!!file.radio});
 row.title=info.title||safeName(file);row.artist=file.radio?file.country:(info.artist||'');row.seconds+=seconds;bucket.seconds+=seconds;
 replayDirty=true;if(now-replayLastSave>15000)replaySave();
}
audio.addEventListener('timeupdate',replayTick);
for(const event of ['playing','pause','seeking','waiting','ended','emptied','error'])audio.addEventListener(event,()=>{replaySample=null;replaySave()});
window.addEventListener('pagehide',replaySave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)replaySave()});
function replaySummary(period){
 const months=Object.keys(replayMonths).filter(k=>k===period||(/^\d{4}$/.test(period)&&k.startsWith(period+'-')));
 const rows=new Map();let seconds=0;
 for(const month of months){const b=replayMonths[month];seconds+=Number(b.seconds)||0;for(const [key,item] of Object.entries(b.items||{})){const old=rows.get(key);rows.set(key,{...item,key,seconds:(old?.seconds||0)+(Number(item.seconds)||0)});}}
 const all=[...rows.values()].sort((a,b)=>b.seconds-a.seconds);
 const artists=new Map();for(const t of all.filter(t=>!t.radio&&t.artist)){const old=artists.get(t.artist);artists.set(t.artist,{title:t.artist,seconds:(old?.seconds||0)+t.seconds});}
 return {seconds,tracks:all.filter(t=>!t.radio).slice(0,5),stations:all.filter(t=>t.radio).slice(0,5),artists:[...artists.values()].sort((a,b)=>b.seconds-a.seconds).slice(0,5)};
}
function isFavorite(file){return !!file&&favorites.has(favoriteId(file))}
function updateFavorite(){
 if(!favoriteButton)return;
 const file=index>=0?tracks[index]:null;
 const liked=isFavorite(file);
 favoriteButton.disabled=!file||!!file.radio;
 favoriteButton.setAttribute('aria-pressed',String(liked));
 favoriteButton.setAttribute('aria-label',!file?'Выберите трек для избранного':liked?'Убрать из избранного':'Добавить в избранное');
 favoriteButton.title=liked?'Убрать из избранного':'В избранное';
}
function toggleFavorite(){
 const file=index>=0?tracks[index]:null;if(!file)return;
 if(file.radio)return;
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
// Home session begins on actual playback and ends only by explicit Stop.
let homeMusicSession=false;
// Discovery counts actual playback only after 30 uninterrupted seconds.
// This timer is independent of the approved mini-player and MediaSession.
let discoveryListenTimer=0,discoveryCountedVersion=-1;
function stopDiscoveryListen(){
 if(discoveryListenTimer){clearTimeout(discoveryListenTimer);discoveryListenTimer=0;}
}
function qualifyDiscoveryListen(){
 stopDiscoveryListen();
 if(!window.SEYVEO_DISCOVERY?.enabled?.()||index<0||audio.paused||isRadio())return;
 const selectedVersion=selectVersion;
 if(selectedVersion===discoveryCountedVersion)return;
 discoveryListenTimer=setTimeout(()=>{
  discoveryListenTimer=0;
  if(selectedVersion!==selectVersion||audio.paused||audio.ended||
   !window.SEYVEO_DISCOVERY?.enabled?.())return;
  const record=infoFor(tracks[index]);
  const performer=typeof record?.artist==='string'?record.artist.trim():'';
  if(!performer||performer==='Моя музыка')return;
  discoveryCountedVersion=selectedVersion;
  window.dispatchEvent(new CustomEvent('seyveo:music-qualified-listen',{
   detail:{artist:performer,title:record.title||safeName(tracks[index])}
  }));
 },30000);
}
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
  const inline=miniOnMusicHome();
  if(inline){if(mini.parentNode!==miniHomeSlot)miniHomeSlot.append(mini)}
  else if(miniOrigin.parentNode&&mini.parentNode!==miniOrigin.parentNode)miniOrigin.parentNode.insertBefore(mini,miniOrigin.nextSibling);
  mini.classList.toggle('sv-music-mini-inline',inline);
  mini.hidden=!inline&&(!loaded||!hasPlayed||audio.ended||(location.hash==='#sayvi-music'&&page.dataset.musicView!=='home'&&page.dataset.musicView!=='new'&&page.dataset.musicView!=='radio'&&page.dataset.musicView!=='library'&&page.dataset.musicView!=='replay'&&page.dataset.musicView!=='history')||miniDismissed);
  mini.classList.toggle('is-playing',playing);
  if(loaded){
   const file=tracks[index];
   const info=infoFor(file);
   if(miniTitle)miniTitle.textContent=info.title||safeName(file);
   if(miniArtist)miniArtist.textContent=isRadio()&&radioFallback?file.country+' · '+file.fallbackQuality:info.artist||'Моя музыка';
   if(miniOpen)miniOpen.setAttribute('aria-label','Открыть плеер: '+safeName(file));
   if(miniPlay){
    miniPlay.setAttribute('aria-label',playing?'Пауза':'Продолжить воспроизведение');
    miniPlay.setAttribute('aria-pressed',String(playing));
   }
   miniIcon?.setAttribute('d',playing?'M8 6v12M16 6v12':'M8 5.5 18 12 8 18.5z');
   const canSkip=tracks.length>1;
   if(miniNext)miniNext.disabled=!canSkip;
  }else if(inline){
   const last=window.SEYVEO_RADIO?.recent?.()[0];
   if(miniTitle)miniTitle.textContent=last?.title||'Моя музыка';
   if(miniArtist)miniArtist.textContent=last?.artist||'Выберите музыку или радио';
   if(miniOpen)miniOpen.setAttribute('aria-label',last?'Открыть плеер':'Выбрать музыку или радио');
   if(miniPlay){miniPlay.setAttribute('aria-label',last?'Включить '+last.title:'Выбрать музыку или радио');miniPlay.setAttribute('aria-pressed','false')}
   miniIcon?.setAttribute('d','M8 5.5 18 12 8 18.5z');
   if(miniNext)miniNext.disabled=true;
   if(miniArtwork){miniArtwork.hidden=!last?.artwork;miniArtwork.style.backgroundImage=last?.artwork?'url("'+last.artwork+'")':'';}
   mini.classList.toggle('has-artwork',!!last?.artwork);
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
 const total=!isRadio()&&Number.isFinite(audio.duration)?audio.duration:0;
 const now=Number.isFinite(audio.currentTime)?audio.currentTime:0;
 elapsed.textContent=isRadio()?'LIVE':fmt(now);duration.textContent=isRadio()?'Эфир':total?fmt(total):'0:00';
 seek.max='1000';seek.value=total>0?String(Math.round(now/total*1000)):'0';
 seek.disabled=!total;
 seek.setAttribute('aria-valuetext',fmt(now)+' из '+fmt(total));
 seek.style.setProperty('--music-progress',(total>0?Math.min(100,now/total*100):0).toFixed(2)+'%');
 mini?.style.setProperty('--sv-mini-progress',(total>0?Math.min(100,now/total*100):0).toFixed(2)+'%');
}
/* Data images are already permitted by the app's CSP; blob: images are not.
   Keep MP3 cover art local, capped, and do not expand the security policy. */
// Decode only the rows requested by the visible list, one at a time.
// The original file and its full-size player artwork remain untouched.
const trackPreviewJobs=new WeakMap();
let trackPreviewQueue=Promise.resolve();
function makeTrackThumbnail(blob){
 return new Promise(resolve=>{
  if(!blob||!['image/jpeg','image/png'].includes(blob.type)||blob.size>1800000){resolve(null);return}
  const reader=new FileReader();
  reader.onerror=reader.onabort=()=>resolve(null);
  reader.onload=()=>{
   const value=reader.result;
   if(typeof value!=='string'||!/^data:image\/(?:png|jpeg);base64,/i.test(value)){resolve(null);return}
   const probe=new Image();
   probe.onerror=()=>resolve(null);
   probe.onload=()=>{
    try{
     const side=Math.min(probe.naturalWidth,probe.naturalHeight);
     if(!side){resolve(null);return}
     const canvas=document.createElement('canvas');canvas.width=112;canvas.height=112;
     const ctx=canvas.getContext('2d');if(!ctx){resolve(null);return}
     ctx.drawImage(probe,(probe.naturalWidth-side)/2,(probe.naturalHeight-side)/2,side,side,0,0,112,112);
     resolve(canvas.toDataURL('image/jpeg',.84));
    }catch{resolve(null)}
   };
   probe.src=value;
  };
  try{reader.readAsDataURL(blob)}catch{resolve(null)}
 });
}
function prepareTrackPreview(trackIndex){
 const file=localTracks[Number(trackIndex)];
 if(!file||file.radio)return Promise.resolve(null);
 const result=()=>{const info=infoFor(file);return {title:info.title||safeName(file),artist:info.artist||'Моя музыка',artwork:trackThumbnails.get(file)||null}};
 if(trackThumbnails.has(file))return Promise.resolve(result());
 if(trackPreviewJobs.has(file))return trackPreviewJobs.get(file);
 if(!metadata?.describe)return Promise.resolve(result());
 const task=trackPreviewQueue.then(async()=>{
  if(trackThumbnails.has(file))return result();
  const info=trackDescriptions.get(file)?.artwork?trackDescriptions.get(file):await metadata.describe(file);
  if(!info)return result();
  if(!trackDescriptions.has(file)){const {artwork,...details}=info;trackDescriptions.set(file,details)}
  if(info.artwork&&!trackThumbnails.has(file)){
   const thumb=await makeTrackThumbnail(info.artwork);
   if(thumb&&!trackThumbnails.has(file))trackThumbnails.set(file,thumb);
  }
  return result();
 }).catch(()=>result());
 trackPreviewJobs.set(file,task);
 trackPreviewQueue=task.then(()=>{},()=>{});
 return task;
}

// Two background layers crossfade the decoded artwork without changing audio.
const playerBackdropLayers=Array.from(page.querySelectorAll('.sv-now-backdrop > span'));
let playerBackdropIndex=-1;
function paintPlayerBackdrop(src){
 if(!src){for(const layer of playerBackdropLayers)layer.classList.remove('is-current');return}
 if(playerBackdropLayers.length!==2)return;
 const next=(playerBackdropIndex+1)%2;
 const layer=playerBackdropLayers[next];
 layer.style.backgroundImage='linear-gradient(180deg,rgba(8,15,24,.34),rgba(8,15,24,.64) 56%,rgba(8,15,24,.89)),url("'+src+'")';
 layer.classList.add('is-current');
 if(playerBackdropIndex>=0)playerBackdropLayers[playerBackdropIndex].classList.remove('is-current');
 playerBackdropIndex=next;
}
function clearArtwork(){
 paintPlayerBackdrop(null);
 page.classList.remove('sv-music-player-has-art');page.style.removeProperty('--sv-music-player-art');
 stage?.classList.remove('has-artwork','is-checking-artwork');
 mini?.classList.remove('has-artwork');
 for(const surface of [artwork,miniArtwork]){
  if(!surface)continue;
  surface.hidden=true;
  surface.style.removeProperty('background-image');
 }
}
/* Strict editorial cover gate: only sufficiently large, square, opaque
   and detailed images are allowed on the expanded player. This is a
   conservative image heuristic, not a guarantee of original resolution. */
function coverDetail(pixels,w,h){
 const gray=new Float32Array(w*h);let sum=0,square=0,transparent=0;
 for(let i=0;i<gray.length;i++){
  const p=i*4,v=.2126*pixels[p]+.7152*pixels[p+1]+.0722*pixels[p+2];
  gray[i]=v;sum+=v;square+=v*v;if(pixels[p+3]<245)transparent++;
 }
 const n=gray.length,variance=square/n-(sum/n)**2;
 let edges=0,sharp=0,gradient=0,laplace=0,blocks=0,blockSum=0,otherSum=0,otherCount=0;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const i=y*w+x,v=gray[i],dx=Math.abs(v-gray[i-1]),dy=Math.abs(v-gray[i-w]);
  const g=dx+dy,l=Math.abs(4*v-gray[i-1]-gray[i+1]-gray[i-w]-gray[i+w]);
  gradient+=g;laplace+=l;if(g>=12){edges++;if(l>=10)sharp++}
  if(x%8===0){blockSum+=dx;blocks++}else{otherSum+=dx;otherCount++}
  if(y%8===0){blockSum+=dy;blocks++}else{otherSum+=dy;otherCount++}
 }
 const count=(w-2)*(h-2),blockRatio=(blockSum/Math.max(1,blocks))/Math.max(.5,otherSum/Math.max(1,otherCount));
 return transparent/n<=.005&&variance>=225&&edges/count>=.035&&sharp/Math.max(1,edges)>=.48&&
  gradient/count>=2.6&&laplace/Math.max(1,gradient)>=.46&&blockRatio<2.8;
}
function qualifiesFullCover(probe,file){
 const w=probe.naturalWidth,h=probe.naturalHeight;
 if(!file||file.radio||Math.min(w,h)<900||w/h<.9||w/h>1.1||w*h>16000000)return false;
 try{
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return false;
  const side=Math.min(w,h);
  ctx.drawImage(probe,(w-side)/2,(h-side)/2,side,side,0,0,320,320);
  return coverDetail(ctx.getImageData(0,0,320,320).data,320,320);
 }catch{return false}
}
function showArtwork(){
 if(!coverDataURL)return;
 const candidate=coverDataURL,version=selectVersion,file=tracks[index];
 // Never show a candidate at full size until its decoded pixels pass.
 const probe=new Image();
 probe.onload=()=>{
  if(coverDataURL!==candidate||version!==selectVersion||tracks[index]!==file)return;
  if(file&&!file.radio&&!trackThumbnails.has(file)){
   try{
    const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;
    const ctx=canvas.getContext('2d');const side=Math.min(probe.naturalWidth,probe.naturalHeight);
    if(ctx&&side>0){ctx.drawImage(probe,(probe.naturalWidth-side)/2,(probe.naturalHeight-side)/2,side,side,0,0,160,160);trackThumbnails.set(file,canvas.toDataURL('image/jpeg',.84));}
   }catch{}
  }
  // Thumbnail is independent of the full cover and remains available
  // even when the candidate fails the editorial quality gate.
  if(miniArtwork){
   const thumb=trackThumbnails.get(file)||candidate;
   miniArtwork.style.backgroundImage='url("'+thumb+'")';miniArtwork.hidden=false;
   mini?.classList.add('has-artwork');
  }
  const approved=qualifiesFullCover(probe,file);
  if(approved){
   page.style.setProperty('--sv-music-player-art','url("'+candidate+'")');page.classList.add('sv-music-player-has-art');
   paintPlayerBackdrop(candidate);
   if(artwork){artwork.style.backgroundImage='url("'+candidate+'")';artwork.hidden=false;stage?.classList.add('has-artwork')}
  }else{
   // Keep the animated rings and ambient palette; no blurred rejected cover.
   page.classList.remove('sv-music-player-has-art');page.style.removeProperty('--sv-music-player-art');
   stage?.classList.remove('has-artwork');
   if(artwork){artwork.hidden=true;artwork.style.removeProperty('background-image')}
   paintPlayerBackdrop(null);
   coverDataURL=null;
  }
  stage?.classList.remove('is-checking-artwork');
  mediaSession();syncResume();
 };
 probe.onerror=()=>{if(version===selectVersion&&coverDataURL===candidate){coverDataURL=null;stage?.classList.remove('is-checking-artwork');mediaSession()}};
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
    artwork:page.classList.contains('sv-music-player-has-art')&&coverDataURL&&info.artwork?[{src:coverDataURL,type:info.artwork.type||'image/jpeg',sizes:''}]:[]
   });
  }
  navigator.mediaSession.setActionHandler('play',()=>play());
  navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
  navigator.mediaSession.setActionHandler('previoustrack',()=>switchTrack(index-1,true));
  navigator.mediaSession.setActionHandler('nexttrack',()=>switchTrack(index+1,true));
  navigator.mediaSession.setActionHandler('seekto',details=>{
   if(!isRadio()&&Number.isFinite(details.seekTime))audio.currentTime=Math.min(Math.max(0,details.seekTime),audio.duration||0);
  });
 }catch{}
}
function collectionRender(){
 collection.replaceChildren();
 if(collectionMode==='tracks'&&!tracks.length){
  collection.hidden=true;syncQueueToggle();return;
 }
 collection.hidden=!queueOpen;
 const favoriteView=collectionMode==='favorites';
 // Favorites belong to the saved local library, not the active radio queue.
 const loaded=new Map(localTracks.map((file,i)=>[favoriteId(file),{file,i,local:true}]));
 const entries=favoriteView?[...favorites].map(key=>({key,match:loaded.get(key)}))
  :tracks.map((file,i)=>({key:favoriteId(file),match:{file,i,local:false}}));
 const header=document.createElement('div');header.className='sv-collection-head';
 const title=document.createElement('h2');title.className='sv-music-collection-label';
 title.textContent=favoriteView?'Избранное':'Очередь';
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='sv-music-panel-close';
 dismiss.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
 dismiss.setAttribute('aria-label','Закрыть список');dismiss.addEventListener('click',hidePanels);
 header.append(title,dismiss);collection.append(header);
 const list=document.createElement('div');list.className='sv-collection-list';collection.append(list);
 if(favoriteView&&!entries.length){
  const note=document.createElement('p');note.className='sv-music-favorites-note';
  note.textContent='Добавьте любимую песню сердечком.';list.append(note);
 }
 entries.forEach(({key,match})=>{
  const btn=document.createElement('button');btn.type='button';btn.className='sv-music-track-row';
  if(favoriteView)btn.classList.add('sv-music-favorites-row');
  const current=!!match&&tracks[index]===match.file;
  if(current)btn.setAttribute('aria-current','true');
  const remembered=String(key).split('|').slice(0,-2).join('|');
  const info=match?infoFor(match.file):metadata?.filenameParts(remembered)||{title:'Любимая песня',artist:''};
  const tile=document.createElement('span');tile.className='sv-collection-art';tile.setAttribute('aria-hidden','true');
  const thumb=match&&(trackThumbnails.get(match.file)||(match.file.radio?match.file.artwork:null));
  if(thumb)tile.style.backgroundImage='url("'+thumb+'")';
  else tile.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V6l11-3v11"/><ellipse cx="6" cy="17.5" rx="3" ry="2.3"/><ellipse cx="17" cy="14.5" rx="3" ry="2.3"/></svg>';
  const copy=document.createElement('span');copy.className='sv-collection-copy';
  const name=document.createElement('strong');name.className='sv-music-row-title';name.textContent=info.title||'Без названия';copy.append(name);
  if(info.artist){const artist=document.createElement('small');artist.textContent=info.artist;copy.append(artist)}
  const action=document.createElement('span');action.className='sv-collection-action';action.setAttribute('aria-hidden','true');
  action.innerHTML=match?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13L19 12z"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m-4-4 4 4 4-4M5 17v3h14v-3"/></svg>';
  btn.append(tile,copy,action);
  if(!match){
   btn.classList.add('sv-music-favorites-unavailable');btn.title='Добавить файл повторно';
   btn.setAttribute('aria-label',name.textContent+'. Файл отсутствует. Добавить повторно');
   btn.addEventListener('click',()=>fileInput.click());
  }else{
   btn.addEventListener('click',()=>{if(match.local)tracks=localTracks;switchTrack(match.i,true)});
   if(queueOpen&&!thumb&&!match.file.radio){
    const localIndex=localTracks.indexOf(match.file);
    if(localIndex>=0)prepareTrackPreview(localIndex).then(preview=>{
     if(!preview||!btn.isConnected)return;
     name.textContent=preview.title||name.textContent;
     if(preview.artist){let artist=copy.querySelector('small');if(!artist){artist=document.createElement('small');copy.append(artist)}artist.textContent=preview.artist}
     if(preview.artwork){tile.replaceChildren();tile.style.backgroundImage='url("'+preview.artwork+'")'}
    }).catch(()=>{});
   }
  }
  list.append(btn);
 });
 syncQueueToggle();
}
function switchTrack(i,autoplay=false){
 if(!tracks.length)return false;
 const newIndex=((i%tracks.length)+tracks.length)%tracks.length;
 const file=tracks[newIndex];const version=++selectVersion;
 audio.pause();audio.removeAttribute('src');audio.load();safeRelease();
 radioFallback=false;
  if(file.radio){
   index=newIndex;audio.src=file.stream;
   coverDataURL=file.artwork||null;if(coverDataURL)showArtwork();
   heading.textContent=file.name;artist.textContent=file.country+' · '+file.quality;
   previous.disabled=next.disabled=tracks.length<2;updateFavorite();collectionRender();mediaSession();updatePlay();updateTime();
   if(autoplay){sayviMessage('Подключение к '+file.name+'…');audio.play().catch(()=>{if(version===selectVersion&&!audio.error)sayviMessage('Не удалось начать эфир. Нажмите Play ещё раз.')});}
   return true;
  }
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
 if(libraryLoading&&!tracks.length){sayviMessage('Медиатека загружается.');return}
 if(!tracks.length){
  fileInput.click();
  sayviMessage('Выберите свои аудиофайлы — Сэйви откроет их здесь.');
  return;
 }
 if(!audio.paused&&!audio.ended){audio.pause();return}
 if(isRadio()&&!audio.getAttribute('src'))audio.src=radioFallback?tracks[index].fallback:tracks[index].stream;
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
  const message='Не нашла подходящие аудиофайлы. Выберите MP3, M4A, AAC, WAV или другой поддерживаемый формат.';
  sayviMessage(message);libraryMessage(message);return false;
 }
 try{navigator.storage?.persist?.()?.catch(()=>{})}catch{}
 librarySaving++;
 libraryMessage('Сохранение музыки на устройстве… Не закрывайте приложение до завершения.');
 libraryQueue=libraryQueue.then(async()=>{
  const existing=new Map(localTracks.map(file=>[favoriteId(file),file]));
  const selected=new Map();let added=0;
  for(const file of chosen){
   const id=favoriteId(file);let entry=existing.get(id);
   if(!entry){entry=file;localTracks.push(entry);existing.set(id,entry);added++}
   selected.set(id,entry);
  }
  if(!tracks.length){tracks=localTracks;switchTrack(0,false)}
  libraryRefresh();
  libraryMessage('Сохранение музыки на устройстве…');
  const skipped=candidates.length-chosen.length;
  const suffix=skipped?' Пропущено: '+skipped+' (до 40 файлов за раз, до 180 МБ каждый).':'';
  try{
   await saveLibraryFiles([...selected.values()]);
   const message=(added?'Добавлено '+added+'. ':'Новых файлов нет. ')+libraryCount()+'.'+suffix;
   libraryMessage(message);sayviMessage(message);
  }catch(error){
   const message=libraryCount()+'. Не все файлы сохранены. Несохранённые доступны до закрытия страницы. Проверьте свободное место и добавьте их повторно.'+suffix;
   libraryMessage(message);sayviMessage(message);
  }
 }).catch(()=>libraryMessage('Не удалось добавить музыку. Повторите попытку.')).finally(()=>{librarySaving=Math.max(0,librarySaving-1);syncResume()});
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
minimize?.addEventListener('click',()=>{if(!window.SEYVEO_MUSIC_DOCK?.closePlayer?.())minimizeMusic()});
/* An explicit close lives in the full Music screen, not on Home.
   Pause the real audio session and hide the small remote; preserve
   the selected local tracks so the user can return to Music later. */
const stopAndHide=$('sayviMusicStopAndHide');
stopAndHide?.addEventListener('click',()=>{
 stopDiscoveryListen();
 miniDismissed=true;
 homeMusicSession=false;
 audio.pause();
 if(isRadio()){audio.removeAttribute('src');audio.load();hasPlayed=false;}
 updatePlay();
 minimizeMusic();
 syncResume();
});

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
  if(dy>72&&dx<40&&location.hash==='#sayvi-music'){if(!window.SEYVEO_MUSIC_DOCK?.closePlayer?.())minimizeMusic()}
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
 if(miniOnMusicHome()&&index<0&&!window.SEYVEO_RADIO?.recent?.().length){window.SEYVEO_MUSIC_DOCK?.show?.('radio');return}
 if(window.SEYVEO_MUSIC_DOCK?.openPlayer)window.SEYVEO_MUSIC_DOCK.openPlayer();else open();
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
miniPlay?.addEventListener('click',()=>{
 if(!miniOnMusicHome()){play();return}
 if(index<0||!tracks.length){
  const last=window.SEYVEO_RADIO?.recent?.()[0];
  if(last&&window.SEYVEO_RADIO?.play?.(last.id)){window.SEYVEO_MUSIC_DOCK?.openPlayer?.();return}
  window.SEYVEO_MUSIC_DOCK?.show?.('radio');return;
 }
 const wasPlaying=!audio.paused&&!audio.ended;
 miniDismissed=false;play();
 if(!wasPlaying)window.SEYVEO_MUSIC_DOCK?.openPlayer?.();
});
document.addEventListener('seyveo:radio-history',()=>{if(miniOnMusicHome())syncResume()});
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
 if(!isRadio()&&Number.isFinite(duration)&&duration>0)audio.currentTime=Number(seek.value)/1000*duration;
});
options.addEventListener('click',event=>{
 const btn=event.target.closest('[data-music-provider]');
 if(btn&&options.contains(btn))providerChoose(btn.dataset.musicProvider);
});
audio.addEventListener('timeupdate',updateTime);
audio.addEventListener('durationchange',updateTime);
audio.addEventListener('loadedmetadata',updateTime);
audio.addEventListener('playing',()=>{homeMusicSession=true;const file=tracks[index];if(file&&!file.radio){recentFiles=[file,...recentFiles.filter(item=>item!==file)].slice(0,12);recentPlayedAt.set(file,Date.now());for(const item of recentPlayedAt.keys())if(!recentFiles.includes(item))recentPlayedAt.delete(item);rememberRecent()}updatePlay();sayviMessage('');qualifyDiscoveryListen()});
audio.addEventListener('pause',()=>{stopDiscoveryListen();updatePlay()});
audio.addEventListener('ended',()=>{stopDiscoveryListen();if(isRadio()){updatePlay();sayviMessage('Эфир прервался. Нажмите Play для повторного подключения.');return}if(tracks.length>1)switchTrack(index+1,true);else{updatePlay();sayviMessage('Сэйви: музыка закончилась. Включить ещё раз?')}});
audio.addEventListener('error',()=>{stopDiscoveryListen();updatePlay();if(isRadio()){const station=tracks[index],version=selectVersion;if(!radioFallback&&station.fallback){radioFallback=true;audio.src=station.fallback;artist.textContent=station.country+' · '+station.fallbackQuality;audio.play().catch(()=>{if(version===selectVersion)sayviMessage('Резервный эфир недоступен.')});return}sayviMessage('Эфир недоступен. Попробуйте другую станцию.');return}if(index>=0)sayviMessage('Не смогла прочитать эту запись. Возможно, её формат не поддерживается.')});
/* Screen lock/background can dispatch lifecycle changes.
 * Never stop an actively playing track on pagehide: the OS decides if WebKit
 * can continue. A full browser termination remains outside PWA control. */
window.addEventListener('beforeunload',event=>{if(librarySaving){event.preventDefault();event.returnValue=''}});
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
/* The one global Search can ask for a title already loaded into this
   player. Return only local track metadata; never pretend a streaming
   subscription is connected or fetch arbitrary unlicensed media. */
const musicKey=value=>String(value||'').toLocaleLowerCase('ru-RU')
 .replace(/ё/g,'е').replace(/\.[a-z0-9]{2,5}$/iu,'')
 .trim().replace(/\s+/g,' ');
function searchTracks(query){
 const q=musicKey(query);
 if(!q||q.length<2)return [];
 return localTracks.map((file,i)=>{
  const info=infoFor(file);
  const name=musicKey(info.title),artist=musicKey(info.artist),filename=musicKey(file.name);
  const full=[name,artist,filename].join(' ');
  let score=0;
  if(name===q||filename===q)score=100;
  else if(name.startsWith(q))score=80;
  else if(name.includes(q))score=65;
  else if(artist===q)score=55;
  else if(full.includes(q))score=40;
  return {title:info.title||safeName(file),artist:info.artist||'',index:i,score};
 }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,12);
}
function playIndexFromSearch(trackIndex){
 const idx=Number(trackIndex);
 if(!Number.isSafeInteger(idx)||idx<0||idx>=localTracks.length)return false;
 tracks=localTracks;open();
 return switchTrack(idx,true);
}
function playFromSearch(query){
 const q=musicKey(query),hits=searchTracks(q);
 if(!hits.length){
  open();
  sayviMessage(tracks.length
   ?'Такой песни нет среди загруженных файлов. Добавьте запись или выберите трек из списка.'
   :'Пока нет загруженных песен. Добавьте свои аудиофайлы в «Моя музыка».');
  return {status:'missing',count:tracks.length};
 }
 if(hits.length>1){
  open();showQueue();
  sayviMessage('Нашла несколько песен. Выберите нужную из списка.');
  return {status:'multiple',matches:hits};
 }
 const ok=playIndexFromSearch(hits[0].index);
 return {status:ok?'started':'unavailable',track:hits[0]};
}
function playRadio(stations,id){
 const available=stations.filter(station=>station.radio&&/^https:\/\//.test(station.stream||''));
 const selected=available.findIndex(station=>station.id===id);if(selected<0)return false;
 if(isRadio()&&tracks[index].id===id){play();return true;}
 tracks=available;miniDismissed=false;return switchTrack(selected,true);
}
window.SEYVEO_MUSIC=Object.freeze({
 playRadio,replaySummary,
 understand,open,minimize:minimizeMusic,openQueue:showQueue,toggleQueue,closePanels:hidePanels,
 searchTracks,playFromSearch,playIndexFromSearch,refreshMini:syncResume,prepareTrackPreview,
 // Read-only access to the selected local File for optional visual analysis.
 rhythmFile:()=>isRadio()?null:tracks[index]||null,
 browseTracks:()=>localTracks.map((file,i)=>({index:i,artKey:favoriteId(file),title:infoFor(file).title||safeName(file),artist:infoFor(file).artist||'Моя музыка',artwork:trackThumbnails.get(file)||null})),
 recentTracks:()=>recentFiles.filter(file=>localTracks.includes(file)).map(file=>({index:localTracks.indexOf(file),artKey:favoriteId(file),title:infoFor(file).title||safeName(file),artist:infoFor(file).artist||'Моя музыка',artwork:trackThumbnails.get(file)||null,playedAt:recentPlayedAt.get(file)||0})),
 state:()=>Object.freeze({
  libraryLoading,libraryCount:localTracks.length,librarySaving:librarySaving>0,savedCount:savedTrackIds.size,
  loaded:tracks.length,trackIndex:index,playing:!!tracks.length&&!audio.paused,
  homeSession:homeMusicSession,
  source:isRadio()?'radio':'local-file',stationId:isRadio()?tracks[index].id:null,quality:isRadio()?(radioFallback?tracks[index].fallbackQuality:tracks[index].quality):null,connectedServices:0
 })
});
libraryQueue=restoreLibrary();
})();