/* SEYVEO Music · Listening Room v1 — native-first, PWA test drive.
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
const disk=$('sayviMusicDisk');
const flow=$('sayviMusicFlow');
const flowLabel=$('sayviMusicFlowLabel');
const flowNext=$('sayviMusicFlowNext');
const mini=$('sayviMusicMini');
const miniOpen=$('sayviMusicMiniOpen');
const miniPlay=$('sayviMusicMiniPlay');
const miniTitle=$('sayviMusicMiniTitle');
const miniState=$('sayviMusicMiniState');
const miniIcon=$('sayviMusicMiniIcon');
const minimize=$('sayviMusicMinimize');
if(!page||!audio||!fileInput||!player||!seek||!status||!heading||!collection||!flow||!flowNext)return;
// The library is an independent, opaque screen, not part of the vinyl stage.
if(collection.parentElement!==document.body)document.body.append(collection);
// The original audio file is never renamed, transcoded, uploaded or modified.
const metadata=window.SEYVEO_MUSIC_METADATA;
const fallbackInfo=file=>metadata?.filenameParts(file?.name)||{
 title:String(file?.name||'Без названия').replace(/\.[^.]+$/,''),
 artist:'',display:String(file?.name||'Без названия')
};
let trackDescriptions=new WeakMap(),coverObjectURL=null;
const infoFor=file=>file?(trackDescriptions.get(file)||fallbackInfo(file)):fallbackInfo(null);
const safeName=file=>infoFor(file).display;
const coverFallback=new URL('assets/seyveo-music-lockscreen.png',document.baseURI).href;
const extensions=/\.(mp3|m4a|aac|wav|ogg|opus|flac|alac|aiff|aif|mp4)$/i;
const MAX_TRACKS=40,MAX_FILE_SIZE=180*1024*1024;
let tracks=[],index=-1,url=null,selectVersion=0,queueOpen=false;
const fmt=time=>{
 if(!Number.isFinite(time)||time<0)return '0:00';
 const t=Math.floor(time);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
};
const sayviMessage=message=>{status.textContent=message;status.hidden=!message;};
// A light, text-only preview. Audio and the stored queue never move or vanish.
function updateFlowPreview(animate=false){
 if(tracks.length<2||index<0){flow.hidden=true;flow.classList.remove('sv-flow-rise');return;}
 const upcoming=(index+1)%tracks.length;
 const file=tracks[upcoming];
 flowLabel.textContent='СЛЕДУЮЩИЙ · '+String(upcoming+1).padStart(2,'0');
 flowNext.textContent=infoFor(file).title||safeName(file);
 flow.hidden=false;
 if(animate&&location.hash==='#sayvi-music'){
  flow.classList.remove('sv-flow-rise');
  void flow.offsetWidth;
  flow.classList.add('sv-flow-rise');
 }
}
function animateTrackChange(previousTitle){
 heading.classList.remove('sv-flow-change');
 artist?.classList.remove('sv-flow-change');
 heading.removeAttribute('data-flow-prev');
 if(!previousTitle||previousTitle===heading.textContent||location.hash!=='#sayvi-music')return;
 heading.setAttribute('data-flow-prev',previousTitle);
 void heading.offsetWidth;
 heading.classList.add('sv-flow-change');
 artist?.classList.add('sv-flow-change');
}
function updatePlay(){
 const playing=!audio.paused&&!audio.ended&&!!audio.src;
 page.classList.toggle('sv-music-playing',playing);
 if('mediaSession' in navigator){
  try{navigator.mediaSession.playbackState=playing?'playing':'paused'}catch{}
 }
 player.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');
 player.setAttribute('aria-pressed',String(playing));
 $('sayviMusicPlayIcon')?.setAttribute('d',playing?'M8 6v12M16 6v12':'M8 5.5 18 12 8 18.5z');
 disk?.setAttribute('aria-label',playing?'Музыка воспроизводится':'Музыка остановлена');
 syncResume();
}
function syncResume(){
 const loaded=tracks.length>0&&index>=0;
 const playing=loaded&&!audio.paused&&!audio.ended;
 // One actual audio element. The mini is a small remote, not a second player.
 if(mini){
  mini.hidden=!loaded||location.hash==='#sayvi-music';
  if(loaded){
   const file=tracks[index],info=infoFor(file);
   if(miniTitle)miniTitle.textContent=info.title||safeName(file);
   if(miniState)miniState.textContent=playing?'Играет':'На паузе';
   if(miniOpen)miniOpen.setAttribute('aria-label','Вернуться в SEYVEO MUSIC: '+safeName(file));
   if(miniPlay){
    miniPlay.setAttribute('aria-label',playing?'Пауза':'Продолжить воспроизведение');
    miniPlay.setAttribute('aria-pressed',String(playing));
   }
   miniIcon?.setAttribute('d',playing?'M8 6v12M16 6v12':'M8 5.5 18 12 8 18.5z');
  }
 }
 document.dispatchEvent(new CustomEvent('seyveo:music-state',{detail:{loaded,playing}}));
}
function hidePanels(){
 queueOpen=false;
 collection.hidden=true;
}
function showQueue(){
 if(location.hash!=='#sayvi-music')open();
 queueOpen=true;
 collectionRender();
 collection.querySelector('.sv-music-panel-close')?.focus({preventScroll:true});
 return true;
}

function updateTime(){
 const total=Number.isFinite(audio.duration)?audio.duration:0;
 const now=Number.isFinite(audio.currentTime)?audio.currentTime:0;
 elapsed.textContent=fmt(now);duration.textContent=total?fmt(total):'0:00';
 seek.max='1000';seek.value=total>0?String(Math.round(now/total*1000)):'0';
 seek.disabled=!total;
 seek.setAttribute('aria-valuetext',fmt(now)+' из '+fmt(total));
 seek.style.setProperty('--music-progress',(total>0?Math.min(100,now/total*100):0).toFixed(2)+'%');
}
function safeRelease(){
 if(url){
  try{URL.revokeObjectURL(url)}catch{}
  url=null;
 }
 if(coverObjectURL){
  try{URL.revokeObjectURL(coverObjectURL)}catch{}
  coverObjectURL=null;
 }
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
    // MP3 embedded cover when available; otherwise the approved Sayvi sphere.
    artwork:[coverObjectURL
     ?{src:coverObjectURL,type:info.artwork.type,sizes:''}
     :{src:coverFallback,type:'image/png',sizes:'128x128'}]
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
 collection.hidden=!queueOpen;
 if(!queueOpen)return;
 const dismiss=document.createElement('button');
 dismiss.type='button';dismiss.className='sv-music-panel-close';
 dismiss.textContent='Готово';dismiss.setAttribute('aria-label','Вернуться к плееру');
 dismiss.addEventListener('click',()=>{queueOpen=false;collection.hidden=true;});
 collection.append(dismiss);
 const title=document.createElement('p');
 title.className='sv-music-collection-label';
 title.textContent='ТРЕКИ';
 collection.append(title);
 const actions=document.createElement('div');
 actions.className='sv-music-panel-actions';
 const add=document.createElement('button');
 add.type='button';add.className='sv-music-panel-action';
 add.textContent='+ Добавить музыку';
 add.addEventListener('click',()=>fileInput.click());
 actions.append(add);
 collection.append(actions);
 if(!tracks.length){
  const empty=document.createElement('p');
  empty.className='sv-music-collection-empty';
  empty.textContent='Пока нет треков. Добавьте музыку с устройства.';
  collection.append(empty);
  return;
 }
 tracks.forEach((file,i)=>{
  const btn=document.createElement('button');
  btn.type='button';btn.className='sv-music-track-row';
  btn.dataset.musicIndex=String(i);
  btn.setAttribute('aria-current',String(i===index));
  const count=document.createElement('span');count.className='sv-music-row-num';
  count.textContent=String(i+1).padStart(2,'0');
  const name=document.createElement('span');name.className='sv-music-row-title';
  name.textContent=safeName(file);
  btn.append(count,name);
  btn.addEventListener('click',()=>{if(switchTrack(i,true))hidePanels()});
  collection.append(btn);
 });
}
function switchTrack(i,autoplay=false){
 if(!tracks.length)return false;
 const oldTitle=index>=0?heading.textContent:'';
 const newIndex=((i%tracks.length)+tracks.length)%tracks.length;
 const file=tracks[newIndex];const version=++selectVersion;
 audio.pause();audio.removeAttribute('src');audio.load();safeRelease();
 try{url=URL.createObjectURL(file)}catch{
  sayviMessage('Не удалось открыть файл. Попробуйте выбрать другой аудиофайл.');
  updatePlay();return false;
 }
 index=newIndex;
 audio.src=url;
 const visible=infoFor(file);
 heading.textContent=visible.title;
 artist.textContent=(visible.artist?visible.artist+' · ':'Ваш аудиофайл · ')+(index+1)+' из '+tracks.length;
 animateTrackChange(oldTitle);
 updateFlowPreview(true);
 previous.disabled=next.disabled=tracks.length<2;
 collectionRender();mediaSession();updatePlay();updateTime();
 // Bounded local ID3 read never interrupts or delays the real audio element.
 if(metadata?.describe){
  Promise.resolve(metadata.describe(file)).then(info=>{
   if(version!==selectVersion||tracks[index]!==file||!info)return;
   trackDescriptions.set(file,info);
   if(info.artwork){
    try{coverObjectURL=URL.createObjectURL(info.artwork)}catch{coverObjectURL=null}
   }
   heading.textContent=info.title;
   artist.textContent=(info.artist?info.artist+' · ':'Ваш аудиофайл · ')+(index+1)+' из '+tracks.length;
   collectionRender();updateFlowPreview();mediaSession();syncResume();
  }).catch(()=>{});
 }
 if(autoplay){
  const playing=audio.play();
  if(playing&&typeof playing.catch==='function')playing.catch(()=>{
   if(version!==selectVersion)return;
   sayviMessage('Для воспроизведения коснитесь значка Play. Система могла остановить автоматический запуск.');
  });
 }else sayviMessage('Готово. Нажмите Play, чтобы послушать.');
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
function understand(raw){
 if(typeof raw!=='string'||raw.length>300)return null;
 const value=raw.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 if(!value||/[;\n\r]/.test(value))return null;
 const command=/(?:^|[\s,])(?:включи|включить|поставь|поставить|запусти|запустить|открой|открыть|покажи|послушаем|послушать|хочу послушать|хочу слушать|проиграй|давай слушать|сыграй|поставь мне|включи мне)(?:\s+(?:мне|нам|какую-нибудь|что-нибудь|немного|пожалуйста|для меня)){0,4}\s+(?:музык|песн|трек|плейлист|плеер|джаз|рок|мелоди|радио|классик|спотиф|spotify|apple music|ютуб music|youtube music)/i;
 const direct=/^(?:(?:сэйви|сейви)[,!\s]+)?(?:музыка|музыкальный плеер|сэйви музыка|seyveo music|se y veo music)[.!?\s]*$/i;
 return command.test(value)||direct.test(value)?'music':null;
}
function open(){
 if(location.hash==='#sayvi-music')return true;
 location.hash='#sayvi-music';
 return true;
}
function minimizeMusic(){
 hidePanels();
 // Switching screen never pauses the one audio element.
 location.hash='#home';
 return true;
}
minimize?.addEventListener('click',minimizeMusic);
miniOpen?.addEventListener('click',open);
miniPlay?.addEventListener('click',play);
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape'||location.hash!=='#sayvi-music')return;
 if(!collection.hidden)hidePanels();
 else minimizeMusic();
});
function syncMusicRoute(){
 const inside=location.hash==='#sayvi-music';
 document.documentElement.classList.toggle('sv-music-screen',inside);
 if(!inside)hidePanels();
 syncResume();
}
window.addEventListener('hashchange',syncMusicRoute);
player.addEventListener('click',play);
previous.addEventListener('click',()=>switchTrack(index-1,true));
next.addEventListener('click',()=>switchTrack(index+1,true));
fileInput.addEventListener('change',()=>{ingest(fileInput.files);fileInput.value=''});
seek.addEventListener('input',()=>{
 const duration=audio.duration;
 if(Number.isFinite(duration)&&duration>0)audio.currentTime=Number(seek.value)/1000*duration;
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
$('openSeyveoMusicPreview')?.addEventListener('click',open);
$('sayviMusicFromComposer')?.addEventListener('click',()=>{
 $('hideInput')?.click();open();
});
previous.disabled=true;next.disabled=true;seek.disabled=true;
updatePlay();updateTime();collectionRender();updateFlowPreview();syncMusicRoute();
window.SEYVEO_MUSIC=Object.freeze({
 understand,open,minimize:minimizeMusic,openQueue:showQueue,closePanels:hidePanels,
 state:()=>Object.freeze({
  loaded:tracks.length,trackIndex:index,playing:!!tracks.length&&!audio.paused,
  source:'local-file',connectedServices:0
 })
});
})();