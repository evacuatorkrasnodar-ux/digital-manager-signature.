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
const qualityLabel=$('sayviMusicQuality');
const sourceQuality=window.SEYVA_MUSIC_SOURCE_QUALITY;
const status=$('sayviMusicStatus');
const collection=$('sayviMusicCollection');
const disk=$('sayviMusicDisk');
const importBtn=$('sayviMusicImport');
const options=$('sayviMusicProviders');
const providerText=$('sayviMusicProviderText');
const sourcesPanel=$('sayviMusicSourcesPanel');
const sourcesToggle=$('sayviMusicSourcesToggle');
const sourcesClose=$('sayviMusicSourcesClose');
const resume=$('sayviMusicResume');
const resumeText=$('sayviMusicResumeText');
if(!page||!audio||!fileInput||!player||!seek||!status||!heading||!collection||!importBtn)return;
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
 youtube:{
  name:'YouTube',
  copy:'Музыкальные видео можно будет показывать через разрешённый YouTube-плеер. Мы не станем извлекать звук из видео, скрывать обязательный интерфейс или обещать фоновое воспроизведение в нарушение правил.'
 },
 local:{
  name:'Мои записи',
  copy:'Сейчас доступно настоящее прослушивание ваших собственных аудиофайлов. Они остаются на устройстве и открываются только на время работы плеера.'
 }
});
let tracks=[],index=-1,url=null,selectVersion=0,queueOpen=false;
let verifiedSource=null;
function updateSourceLabel(){
 if(!qualityLabel)return;
 // A header alone is not proof of audible output: show source parameters only
 // when the decoded audio element is actually playing this selected file.
 const playing=!!audio.src&&!audio.paused&&!audio.ended;
 const show=playing&&verifiedSource?.hiRes===true;
 qualityLabel.hidden=!show;
 qualityLabel.textContent=show?'HI-RES AUDIO · '+verifiedSource.detail:'';
 qualityLabel.title=show?'Параметры исходного '+verifiedSource.format+'-файла; качество выхода iPhone или наушников не подтверждено.':'';
}
const fmt=time=>{
 if(!Number.isFinite(time)||time<0)return '0:00';
 const t=Math.floor(time);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
};
const sayviMessage=message=>{status.textContent=message;status.hidden=!message;};
function updatePlay(){
 const playing=!audio.paused&&!audio.ended&&!!audio.src;
 page.classList.toggle('sv-music-playing',playing);
 updateSourceLabel();
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
 if(!resume||!resumeText)return;
 const loaded=tracks.length>0&&index>=0;
 const playing=loaded&&!audio.paused&&!audio.ended;
 resume.hidden=!loaded;
 if(loaded){
  const track=safeName(tracks[index]);
  resumeText.textContent=(playing?'Слушаем · ':'Продолжить · ')+track;
  resume.setAttribute('aria-label','Вернуться к музыке: '+track);
 }
 document.dispatchEvent(new CustomEvent('seyveo:music-state',{detail:{loaded,playing}}));
}
function hidePanels(){
 queueOpen=false;
 collection.hidden=true;
 if(sourcesPanel)sourcesPanel.hidden=true;
 if(sourcesToggle)sourcesToggle.setAttribute('aria-expanded','false');
}
function showQueue(){
 if(!tracks.length){
  sayviMessage('Сначала выберите свои аудиофайлы.');
  importBtn.focus({preventScroll:true});
  return false;
 }
 if(sourcesPanel)sourcesPanel.hidden=true;
 if(sourcesToggle)sourcesToggle.setAttribute('aria-expanded','false');
 queueOpen=true;
 collectionRender();
 collection.querySelector('.sv-music-panel-close')?.focus({preventScroll:true});
 return true;
}
function toggleSources(force){
 if(!sourcesPanel)return;
 const show=typeof force==='boolean'?force:sourcesPanel.hidden;
 if(show){queueOpen=false;collection.hidden=true;}
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
    album:info.album||'SEYVEO Music',
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
 if(!tracks.length){
  collection.hidden=true;
  return;
 }
 collection.hidden=!queueOpen;
 const dismiss=document.createElement('button');
 dismiss.type='button';dismiss.className='sv-music-panel-close';
 dismiss.textContent='Закрыть';dismiss.setAttribute('aria-label','Закрыть очередь музыки');
 dismiss.addEventListener('click',()=>{queueOpen=false;collection.hidden=true;});
 collection.append(dismiss);
 const title=document.createElement('p');
 title.className='sv-music-collection-label';
 title.textContent='МОЯ ОЧЕРЕДЬ · '+tracks.length;
 collection.append(title);
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
  btn.addEventListener('click',()=>{switchTrack(i,true)});
  collection.append(btn);
 });
}
function switchTrack(i,autoplay=false){
 if(!tracks.length)return false;
 const newIndex=((i%tracks.length)+tracks.length)%tracks.length;
 const file=tracks[newIndex];const version=++selectVersion;
 verifiedSource=null;
 updateSourceLabel();
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
 previous.disabled=next.disabled=tracks.length<2;
 collectionRender();mediaSession();updatePlay();updateTime();
 // Hi-Res source check is bounded, asynchronous, and never delays playback.
 // No guessing from filenames (e.g. "HiRes.mp3"), metadata tags or bitrate.
 if(sourceQuality?.detect){
  Promise.resolve(sourceQuality.detect(file)).then(result=>{
   if(version!==selectVersion||tracks[index]!==file)return;
   verifiedSource=result;
   updateSourceLabel();
  }).catch(()=>{verifiedSource=null;updateSourceLabel()});
 }
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
   collectionRender();mediaSession();syncResume();
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
function open(){
 if(location.hash==='#sayvi-music')return true;
 location.hash='#sayvi-music';
 return true;
}
resume?.addEventListener('click',open);
sourcesToggle?.addEventListener('click',()=>toggleSources());
sourcesClose?.addEventListener('click',()=>toggleSources(false));
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape'||location.hash!=='#sayvi-music')return;
 if(!collection.hidden||!sourcesPanel?.hidden){hidePanels();sourcesToggle?.focus({preventScroll:true});}
});
function syncMusicRoute(){
 const inside=location.hash==='#sayvi-music';
 document.documentElement.classList.toggle('sv-music-screen',inside);
 if(!inside)hidePanels();
}
window.addEventListener('hashchange',syncMusicRoute);
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
audio.addEventListener('playing',()=>{updatePlay();sayviMessage('Сэйви: слушаем вместе.')});
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
updatePlay();updateTime();collectionRender();syncMusicRoute();
window.SEYVEO_MUSIC=Object.freeze({
 understand,open,openQueue:showQueue,closePanels:hidePanels,
 state:()=>Object.freeze({
  loaded:tracks.length,trackIndex:index,playing:!!tracks.length&&!audio.paused,
  source:'local-file',connectedServices:0
 })
});
})();