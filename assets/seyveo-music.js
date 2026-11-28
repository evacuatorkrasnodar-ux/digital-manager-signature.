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
const infoFor=file=>file?.radio?{title:file.name,artist:(file.city||file.country),display:file.name,album:'SEYVEO RADIO'}:file?(trackDescriptions.get(file)||fallbackInfo(file)):fallbackInfo(null);
const safeName=file=>infoFor(file).display;
const smoothPlay=()=>window.SEYVEO_ADAPTIVE_SOUND?.playSmooth?.()??audio.play();
const smoothPause=()=>{const engine=window.SEYVEO_ADAPTIVE_SOUND;if(engine?.pauseSmooth)engine.pauseSmooth();else audio.pause()};
// Shorten only unambiguous repeated compilation phrases in the player.
// The original title remains in metadata, collection and media session.
function setPlayerTitle(value,compact=true){
 const full=String(value||'Без названия');
 const label=compact?full.replace(/^Музыка\s+(20\d{2})\s+Русские\s+хиты\s+Сборник\s+русских\s+хитов\s+\1(?=$|[\s,.:;—–-])/i,'Русские хиты $1'):full;
 heading.dataset.fullTitle=full;
 delete heading.dataset.fullArtist;
 heading.title=full;
 heading.setAttribute('aria-label',full);
 heading.textContent=label;
}
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
const chapterAPI=window.SEYVEO_MUSIC_CHAPTERS;
let chapterFile=null,chapterRows=[],chapterSource='',chapterIndex=-1,chapterJob=0,chapterTimer=0,chapterBusy=false,chapterProgress='',chapterLastTime=-1,chapterScanned=false,chapterReadBusy=false,chapterReadDone=false;
const chapterCandidate=()=>!!chapterAPI&&!isRadio()&&!!tracks[index]&&Number.isFinite(audio.duration)&&audio.duration>=600;
const chapterCanWork=()=>!document.hidden&&!page.classList.contains('sv-karaoke-active')&&audio.paused;
const chapterLabel=i=>chapterRows[i]?.title||'Композиция '+(i+1);
const chapterAt=time=>{let at=-1;for(let i=0;i<chapterRows.length;i++){if(chapterRows[i].start>time+.025)break;at=i}return at};
function resetChapters(file){
 ++chapterJob;clearTimeout(chapterTimer);chapterFile=file?.radio?null:file;chapterRows=[];chapterSource='';chapterIndex=-1;chapterBusy=false;chapterProgress='';chapterLastTime=-1;chapterScanned=false;chapterReadBusy=false;chapterReadDone=false;const queue=$('svNowQueue');if(queue){queue.title='Очередь';queue.setAttribute('aria-label','Очередь воспроизведения');delete queue.dataset.chapterBusy}
}
function paintChapter(force=false){
 if(!chapterRows.length||chapterFile!==tracks[index])return;
 const at=chapterAt(audio.currentTime||0);
 if(!force&&at===chapterIndex)return;
 chapterIndex=at;
 if(at<0)return;
 const info=infoFor(chapterFile);
 setPlayerTitle(chapterLabel(at),false);
 heading.dataset.fullTitle=info.title;heading.dataset.fullArtist=info.artist||'';heading.title=info.title;
 artist.textContent='Сборник · '+(at+1)+' из '+chapterRows.length;
 if(queueOpen&&collectionMode==='tracks')collection.querySelectorAll('[data-chapter-index]').forEach(btn=>{if(Number(btn.dataset.chapterIndex)===at)btn.setAttribute('aria-current','true');else btn.removeAttribute('aria-current')});
 syncResume();mediaSession();
}
function acceptChapters(rows,source,persist=true){
 if(chapterFile!==tracks[index]||rows.length<2)return false;
 ++chapterJob;chapterBusy=false;chapterRows=rows;chapterSource=source;chapterIndex=-1;chapterProgress='';chapterLastTime=-1;
 if(persist&&!chapterAPI.save(favoriteId(chapterFile),rows,source))chapterProgress='Метки сохранены только до закрытия страницы.';
 paintChapter(true);updateChapterStatus();if(queueOpen&&collectionMode==='tracks')collectionRender();return true;
}
async function loadChapters(){
 if(!chapterAPI||isRadio()||chapterFile!==tracks[index]||!Number.isFinite(audio.duration)||audio.duration<=0||chapterReadBusy||chapterReadDone)return;
 const file=chapterFile,version=selectVersion;chapterReadBusy=true;
 try{
  const stored=chapterAPI.read(favoriteId(file),audio.duration);
  if(stored){if(version===selectVersion&&chapterFile===file)acceptChapters(stored.rows,stored.source,false);return}
  const rows=await chapterAPI.embedded(file,audio.duration);
  if(version===selectVersion&&chapterFile===file&&!chapterRows.length&&rows.length>1)acceptChapters(rows,'embedded');
 }catch{}finally{if(version===selectVersion&&chapterFile===file){chapterReadBusy=false;chapterReadDone=true;updateChapterStatus();scheduleChapterScan()}}
}
function updateChapterStatus(){
 const el=collection.querySelector('[data-chapter-status]');
 if(el)el.textContent=chapterProgress||chapterSummary();
 const queue=$('svNowQueue');if(queue){queue.title=chapterCandidate()?(chapterProgress||chapterSummary()):'Очередь';queue.setAttribute('aria-label',queue.title);queue.dataset.chapterBusy=String(chapterBusy)}
}
function chapterSummary(){
 if(chapterRows.length)return (chapterSource==='auto-preview'?'Предварительные метки · анализ не завершён':chapterSource==='auto'?'Возможные границы · проверьте переходы':chapterSource==='embedded'?'Главы из аудиофайла':'Сохранённые временные метки')+' · '+chapterRows.length+' комп.';
 return audio.paused?'Готов к поиску границ песен.':'Поставьте сборник на паузу для поиска границ.';
}
function scheduleChapterScan(){
 clearTimeout(chapterTimer);
 if(!chapterCandidate()||!chapterReadDone||chapterRows.length||chapterScanned||chapterBusy||!chapterCanWork())return;
 if(!/\.mp3$/i.test(chapterFile?.name||''))return;
 chapterTimer=setTimeout(startChapterScan,1500);
}
async function startChapterScan(){
 if(!chapterCandidate()||chapterRows.length||chapterBusy||!chapterCanWork()||!chapterReadDone)return;
 const file=chapterFile,job=++chapterJob;
 const valid=()=>job===chapterJob&&chapterFile===file&&tracks[index]===file;
 chapterBusy=true;chapterProgress='Ищем паузы между песнями…';updateChapterStatus();
 try{
  const rows=await chapterAPI.scan(file,audio.duration,valid,(p,candidates)=>{
   if(!valid())return;
   const count=Array.isArray(candidates)?candidates.length:0;
   chapterProgress='Анализ сборника · '+p+'%'+(count>1?' · найдено границ: '+(count-1):'');
   if(count>1&&count>chapterRows.length){
    chapterRows=candidates;chapterSource='auto-preview';chapterIndex=-1;
    paintChapter(true);
    // Keep an open manual editor intact while automatic candidates arrive.
    if(queueOpen&&collectionMode==='tracks'&&!collection.querySelector('.sv-chapters-edit[open]'))collectionRender();
   }
   updateChapterStatus();
  },chapterCanWork);
  if(!valid())return;
  chapterScanned=true;
  if(rows.length>1){acceptChapters(rows,'auto');return}
  chapterProgress=chapterRows.length>1?'Анализ не подтвердил все метки. Проверьте предварительные границы.':'Уверенные границы не найдены. Можно добавить метки вручную.';
 }catch(error){if(valid()){chapterScanned=true;const reasons={'offline-unavailable':'Браузер не поддерживает локальный анализ','format':'Формат не MP3','limit':'Запись вне лимита анализа','frame-header':'Не найдены корректные заголовки MP3','frame-timing':'Время MP3-кадров не совпадает с длительностью','decode-block':'Браузер не декодировал фрагмент MP3','decode mismatch':'Длительность декодированного фрагмента не совпала'};chapterProgress=(reasons[error?.message]||'Ошибка анализа аудио')+'. Можно добавить метки вручную.'}}
 finally{if(job===chapterJob){chapterBusy=false;updateChapterStatus()}}
}
function stopChapterScan(){
 clearTimeout(chapterTimer);
 if(chapterBusy&&!chapterCanWork()){chapterProgress='Анализ приостановлен · продолжится автоматически';updateChapterStatus()}
 else if(!chapterBusy&&chapterCanWork())scheduleChapterScan();
}
function jumpChapter(i,autoplay=true){
 const row=chapterRows[i];if(!row||chapterFile!==tracks[index])return false;
 try{audio.currentTime=row.start;chapterLastTime=-1;paintChapter(true);updateTime();savePosition(true);
  if(autoplay&&audio.paused)smoothPlay().catch(()=>sayviMessage('Нажмите Play для воспроизведения.'));
  return true;
 }catch{return false}
}
function chapterTick(){
 if(!chapterRows.length||chapterFile!==tracks[index])return;
 const time=audio.currentTime,at=chapterAt(time),old=chapterIndex;
 if(repeat==='one'&&!audio.paused&&!audio.seeking&&old>=0&&at>old&&chapterLastTime>=0&&time>=chapterLastTime&&time-chapterLastTime<3){jumpChapter(old);return}
 chapterLastTime=time;paintChapter();
}
function renderChapters(list){
 if(!chapterCandidate()&&!chapterRows.length)return;
 const section=document.createElement('section');section.className='sv-chapters';
 const label=document.createElement('strong');label.textContent='Композиции сборника';section.append(label);
 const mark=document.createElement('button');mark.type='button';mark.className='sv-chapter-row';mark.textContent='Отметить начало песни · '+fmt(audio.currentTime||0);
 mark.addEventListener('click',()=>{const t=audio.currentTime;if(!Number.isFinite(t)||t<1||t>=audio.duration-1){note.textContent='Выберите начало следующей песни на шкале.';return}const rows=chapterAPI.normalize([...chapterRows,{start:t,title:''}],audio.duration);if(rows.length>1)acceptChapters(rows,'manual');});
 const note=document.createElement('p');note.className='sv-chapters-note';note.dataset.chapterStatus='';note.setAttribute('role','status');note.textContent=chapterProgress||chapterSummary();section.append(note);
 for(let i=0;i<chapterRows.length;i++){
  const row=chapterRows[i],btn=document.createElement('button');btn.type='button';btn.className='sv-chapter-row';btn.dataset.chapterIndex=String(i);
  if(i===chapterIndex)btn.setAttribute('aria-current','true');
  const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');
  const name=document.createElement('span');name.textContent=chapterLabel(i);
  const time=document.createElement('small');time.textContent=fmt(row.start);
  btn.append(number,name,time);btn.addEventListener('click',()=>jumpChapter(i));section.append(btn);
 }
 const edit=document.createElement('details');edit.className='sv-chapters-edit';const summary=document.createElement('summary');summary.textContent=chapterRows.length?'Изменить временные метки':'Добавить временные метки';
 const area=document.createElement('textarea');area.setAttribute('aria-label','Временные метки композиций');area.placeholder='0:00 Первая песня\n3:42 Вторая песня\n7:18 Третья песня';
 area.value=chapterRows.map(row=>{const t=Math.floor(row.start),h=Math.floor(t/3600),m=Math.floor(t/60)%60,s=t%60;return (h?h+':'+String(m).padStart(2,'0'):String(m))+':'+String(s).padStart(2,'0')+(row.title?' '+row.title:'')}).join('\n');
 const actions=document.createElement('div');actions.className='sv-chapters-edit-actions';
 const save=document.createElement('button');save.type='button';save.textContent='Сохранить';
 save.addEventListener('click',()=>{const rows=chapterAPI.parse(area.value,audio.duration);if(!rows){note.textContent='Нужны хотя бы две возрастающие метки в пределах записи (мин:сек).';return}acceptChapters(rows,'manual')});actions.append(save);
 if(chapterRows.length){const reset=document.createElement('button');reset.type='button';reset.textContent='Удалить метки';reset.addEventListener('click',()=>{++chapterJob;chapterBusy=false;clearTimeout(chapterTimer);chapterAPI.clear(favoriteId(chapterFile));chapterRows=[];chapterIndex=-1;chapterScanned=true;chapterProgress='Метки удалены.';const info=infoFor(chapterFile);setPlayerTitle(info.title);artist.textContent=info.artist||'Моя музыка';syncResume();mediaSession();collectionRender()});actions.append(reset)}
 edit.append(summary,area,actions);section.append(edit,mark);
 if(chapterBusy){const resume=document.createElement('button');resume.type='button';resume.className='sv-chapter-row';resume.textContent='Продолжить анализ на паузе';resume.addEventListener('click',()=>{if(!audio.paused)smoothPause();else{note.textContent='Анализ уже выполняется.'}});section.append(resume)}
 if(!chapterRows.length&&!chapterBusy){const scan=document.createElement('button');scan.type='button';scan.className='sv-chapter-row';scan.textContent='Найти границы песен';scan.addEventListener('click',()=>{if(!audio.paused){smoothPause();note.textContent='Поиск начнётся после паузы.';chapterScanned=false;return}if(!chapterCanWork()){note.textContent='Откройте плеер и выключите караоке для анализа.';return}if(!/\.mp3$/i.test(chapterFile?.name||'')){note.textContent='Автопоиск доступен для MP3; добавьте метки вручную.';return}chapterScanned=false;startChapterScan()});section.append(scan)}
 list.append(section);
}

// One transport for full player, mini-player, swipe and Media Session.
const shuffleButton=$('sayviMusicShuffle'),repeatButton=$('sayviMusicRepeat');
const MODE_KEY='seyveo-music-playback-modes-v1';
let shuffle=false,repeat='off',shuffleOrder=[],shufflePosition=-1;
try{const saved=JSON.parse(localStorage.getItem(MODE_KEY)||'null');shuffle=saved?.shuffle===true;repeat=['all','one'].includes(saved?.repeat)?saved.repeat:'off'}catch{}
function persistModes(){try{localStorage.setItem(MODE_KEY,JSON.stringify({shuffle,repeat}))}catch{}}
function syncModes(){
 const loaded=index>=0&&tracks.length>0,radio=isRadio();
 if(shuffleButton){
  shuffleButton.disabled=!loaded||tracks.length<2||radio;shuffleButton.hidden=radio;
  shuffleButton.setAttribute('aria-pressed',String(shuffle));
  shuffleButton.setAttribute('aria-label',shuffle?'Выключить перемешивание':'Включить перемешивание');
  shuffleButton.title=shuffle?'Перемешивание включено':'Перемешать';
 }
 if(repeatButton){
  repeatButton.disabled=!loaded||radio;repeatButton.hidden=radio;
  repeatButton.dataset.repeat=repeat;repeatButton.setAttribute('aria-pressed',String(repeat!=='off'));
  const label=repeat==='one'?'Повтор одной песни':repeat==='all'?'Повтор очереди':'Повтор выключен';
  repeatButton.setAttribute('aria-label',label+'. Изменить режим');repeatButton.title=label;
 }
}
function resetShuffle(current=tracks[index]){
 const rest=tracks.filter(file=>file!==current);
 for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]]}
 shuffleOrder=current?[current,...rest]:rest;shufflePosition=current?0:-1;
}
function ensureShuffle(){
 if(shuffleOrder.length!==tracks.length||shuffleOrder[shufflePosition]!==tracks[index]||shuffleOrder.some(file=>!tracks.includes(file)))resetShuffle();
}
function navigateTrack(direction,automatic=false){
 if(!tracks.length||index<0)return false;
 if(isRadio())return automatic?false:tracks.length>1&&switchTrack(index+direction,true);
 if(chapterRows.length>1){const at=Math.max(0,chapterAt(audio.currentTime));if(automatic&&repeat==='one')return jumpChapter(at);if(!automatic){const target=at+direction;if(target>=0&&target<chapterRows.length)return jumpChapter(target);if(tracks.length===1)return jumpChapter(direction>0?0:chapterRows.length-1)}}
 if(automatic&&repeat==='one')return switchTrack(index,true,true);
 if(shuffle&&tracks.length>1){
  ensureShuffle();
  const target=shufflePosition+direction;
  if(target>=0&&target<shuffleOrder.length){
   shufflePosition=target;return switchTrack(tracks.indexOf(shuffleOrder[target]),true,true);
  }
  if(direction<0){if(!automatic){try{audio.currentTime=0}catch{}}return false}
  if(automatic&&repeat==='off')return false;
  // Start another randomized cycle, with no immediate duplicate.
  resetShuffle();shufflePosition=1;return switchTrack(tracks.indexOf(shuffleOrder[1]),true,true);
 }
 const target=index+direction;
 if(automatic&&(target>=tracks.length||target<0)&&repeat==='off')return false;
 if(tracks.length===1&&!automatic)return false;
 return switchTrack(target,true,true);
}
shuffleButton?.addEventListener('click',()=>{if(shuffleButton.disabled)return;shuffle=!shuffle;resetShuffle();persistModes();syncModes()});
repeatButton?.addEventListener('click',()=>{if(repeatButton.disabled)return;repeat=repeat==='off'?'all':repeat==='all'?'one':'off';persistModes();syncModes()});


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

// Remember the exact local file and playback position, not a transient URL.
const POSITION_KEY='seyveo-music-position-v1';
let positionFile=null,positionSource='',positionPending=null,positionLastSave=0;
function readPosition(){
 try{
  const v=JSON.parse(localStorage.getItem(POSITION_KEY)||'null');
  if(v&&typeof v.id==='string'&&Number.isFinite(v.seconds)&&v.seconds>=0)return v;
 }catch{}
 return null;
}
function writePosition(file,seconds){
 if(!file||file.radio||!Number.isFinite(seconds)||seconds<0)return;
 try{localStorage.setItem(POSITION_KEY,JSON.stringify({id:favoriteId(file),seconds,at:Date.now()}));positionLastSave=Date.now()}catch{}
}
function savePosition(force=false){
 if(!positionFile||!positionSource||audio.getAttribute('src')!==positionSource||positionPending!==null)return;
 if(!force&&Date.now()-positionLastSave<2000)return;
 if(audio.readyState<1&&!audio.ended)return;
 writePosition(positionFile,audio.ended?0:Math.max(0,audio.currentTime||0));
}
function restorePosition(){
 if(positionPending===null||!positionFile||audio.getAttribute('src')!==positionSource||audio.readyState<1)return;
 const total=audio.duration;
 if(!Number.isFinite(total)||total<=0)return;
 const target=Math.min(positionPending,Math.max(0,total-.1));
 try{audio.currentTime=target;positionPending=null;writePosition(positionFile,target)}catch{}
}

// Offline audio library: store owned audio bytes and original file identity.
const LIBRARY_DB='seyveo-music-library-v1',LIBRARY_STORE='tracks';
const savedTrackIds=new Set();
let libraryLoading=true,libraryQueue=Promise.resolve(),librarySaving=0;
const RECENT_KEY='seyveo-music-recent-local-v1';
function rememberRecent(){
 try{localStorage.setItem(RECENT_KEY,JSON.stringify(recentFiles.slice(0,12).map(file=>({id:favoriteId(file),at:recentPlayedAt.get(file)||0}))))}catch{}
}
// History is independent of audio bytes, favorites, queue and replay statistics.
function removeRecentHistory(id=null){
 const next=id===null?[]:recentFiles.filter(file=>favoriteId(file)!==id);
 try{localStorage.setItem(RECENT_KEY,JSON.stringify(next.slice(0,12).map(file=>({id:favoriteId(file),at:recentPlayedAt.get(file)||0}))))}catch{return false}
 recentFiles=next;
 for(const file of recentPlayedAt.keys())if(!recentFiles.includes(file))recentPlayedAt.delete(file);
 return true;
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
 document.dispatchEvent(new Event('seyveo:music-library'));
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
  if(localTracks.length&&!tracks.length){
   const saved=readPosition(),found=saved?localTracks.findIndex(file=>favoriteId(file)===saved.id):-1;
   tracks=localTracks;
   switchTrack(found>=0?found:Math.max(0,localTracks.indexOf(recentFiles[0])),false,false,found>=0?saved.seconds:0);
  }
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
 if(!file.radio){if(info.genre)row.genre=info.genre;if(info.language)row.language=info.language;const source=portraitSource(info.genre);if(source)row.source=source;}
 if(file.radio&&file.genre)row.genre=String(file.genre).slice(0,160);
 const stamp=new Date(now),day=month+'-'+String(stamp.getDate()).padStart(2,'0');
 bucket.days=bucket.days||{};bucket.days[day]=(Number(bucket.days[day])||0)+seconds;
 bucket.hours=Array.isArray(bucket.hours)?bucket.hours:Array(24).fill(0);
 bucket.hours[stamp.getHours()]=(Number(bucket.hours[stamp.getHours()])||0)+seconds;
 if(!bucket.trackedFrom)bucket.trackedFrom=day;
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
 const radioSeconds=all.filter(t=>t.radio).reduce((sum,t)=>sum+t.seconds,0);
 const musicSeconds=all.filter(t=>!t.radio).reduce((sum,t)=>sum+t.seconds,0);
 return {seconds,musicSeconds,radioSeconds,tracks:all.filter(t=>!t.radio).slice(0,5),stations:all.filter(t=>t.radio).slice(0,5),artists:[...artists.values()].sort((a,b)=>b.seconds-a.seconds).slice(0,5)};
}
// Musical portrait: use actual listening duration and explicit embedded tags.
const portraitSource=value=>{
 const v=String(value||'').trim();
 const match=v.match(/(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9-]+\.)+(?:com|net|org|ru|me|fm|io|info|su|xn--p1ai|music|pro|club|cc|biz|site|online|xyz))(?=$|[\s\/:?#),;])/i);
 if(!match)return '';
 const host=match[1].toLowerCase();
 if(host==='drivemusic.me')return 'DriveMusic.me';
 if(/(^|\.)youtube\.com$/.test(host))return 'YouTube';
 return host;
};
const portraitGenre=value=>{
 const v=String(value||'').trim();if(!v)return '';
 const numeric=v.match(/^\(?(\d{1,3})\)?$/);
 const codes={0:'Блюз',1:'Классический рок',2:'Кантри',3:'Танцевальная',4:'Диско',5:'Фанк',7:'Хип-хоп',8:'Джаз',9:'Метал',13:'Поп',14:'R&B',15:'Рэп',17:'Рок',18:'Техно',19:'Индастриал',20:'Альтернатива',24:'Саундтрек',26:'Эмбиент',31:'Транс',32:'Классика',33:'Инструментальная',40:'Альтернативный рок',43:'Панк',48:'Этническая',52:'Электронная',53:'Поп-фолк',54:'Европоп',55:'Dream',56:'Южный рок',59:'Гангста-рэп',62:'Поп/фанк',65:'Кабаре',66:'New Wave',67:'Психоделическая',69:'Шоу',70:'Трейлер',71:'Lo-Fi',73:'Эйсид-панк',74:'Эйсид-джаз',75:'Полька',76:'Ретро',77:'Мюзикл',78:'Рок-н-ролл',79:'Хард-рок',80:'Фолк',81:'Фолк-рок',84:'Быстрый фьюжн',85:'Бибоп',86:'Латинская',87:'Ревайвал',88:'Кельтская',89:'Блюграсс',90:'Авангард',91:'Готик-рок',92:'Прогрессивный рок',93:'Психоделический рок',94:'Симфонический рок',95:'Медленный рок',96:'Биг-бэнд',97:'Хор',98:'Лёгкая музыка',99:'Акустическая',100:'Юмор',101:'Речь',102:'Шансон',103:'Опера',104:'Камерная',105:'Соната',106:'Симфония',107:'Бути-басс',108:'Primus',109:'Порногрув',110:'Сатира',111:'Slow Jam',112:'Клаб',113:'Танго',114:'Самба',115:'Фольклор',116:'Баллада',117:'Пауэр-баллада',118:'Ритмичный соул',119:'Фристайл',120:'Дуэт',121:'Панк-рок',122:'Драм-соло',123:'Акапелла',124:'Евро-хаус',125:'Dance Hall',126:'Goa',127:'Драм-н-бейс',128:'Club-House',129:'Хардкор',130:'Террор',131:'Инди',132:'Бритпоп',133:'Afro-Punk',134:'Польский панк',135:'Бит',136:'Христианский гангста-рэп',137:'Хэви-метал',138:'Блэк-метал',139:'Кроссовер',140:'Современная христианская',141:'Христианский рок',142:'Меренге',143:'Сальса',144:'Трэш-метал',145:'Аниме',146:'J-Pop',147:'Синтипоп'};
 const raw=numeric?(codes[Number(numeric[1])]||''):v.replace(/^\(\d+\)\s*/,'').trim();if(!raw)return '';
 const k=raw.toLowerCase();
 // Source websites and placeholder tags are not musical genres.
 if(/(?:https?:\/\/|www\.|[\p{L}\d-]+\.(?:com|net|org|ru|me|fm|io|info|su|рф|music|pro|club|cc|biz|site|online|xyz)\b)/iu.test(k)||/^(?:unknown|undefined|none|other|music|audio|неизвестно|музыка|другое|n\/a|нет жанра|без жанра)$/i.test(k))return '';
 if(/^(?:country(?:\s*(?:&|and)?\s*music)?|кантри)$/i.test(k))return 'Кантри';
 if(/^(?:dance(?:\s*(?:&|and)?\s*music)?|танцевальная(?:\s+музыка)?)$/i.test(k))return 'Танцевальная';
 if(/russian rock|русский рок/.test(k))return 'Русский рок';
 if(/russian pop|русский поп/.test(k))return 'Русский поп';
 if(/chanson|шансон/.test(k))return 'Шансон';
 if(/rock|рок|metal|метал|punk|панк/.test(k))return 'Рок';
 if(/hip.?hop|rap|рэп|хип.?хоп/.test(k))return 'Хип-хоп';
 if(/pop|поп/.test(k))return 'Поп';
 if(/electro|электрон|techno|техно|house|хаус|trance|транс/.test(k))return 'Электроника';
 if(/jazz|джаз/.test(k))return 'Джаз';if(/classical|классик/.test(k))return 'Классика';
 return raw.slice(0,40);
};
const portraitLanguage=value=>{
 const v=String(value||'').trim().toLowerCase();if(!v||/^(und|xxx|zxx|mul|unknown)$/.test(v))return '';
 const codes={rus:'Русский',ru:'Русский',russian:'Русский',русский:'Русский',eng:'Английский',en:'Английский',english:'Английский',английский:'Английский',deu:'Немецкий',ger:'Немецкий',de:'Немецкий',fra:'Французский',fre:'Французский',fr:'Французский',spa:'Испанский',es:'Испанский',ita:'Итальянский',it:'Итальянский',por:'Португальский',pt:'Португальский',ukr:'Украинский',uk:'Украинский',jpn:'Японский',ja:'Японский',kor:'Корейский',ko:'Корейский',zho:'Китайский',chi:'Китайский',zh:'Китайский',ara:'Арабский',ar:'Арабский',tur:'Турецкий',tr:'Турецкий',fin:'Финский',fi:'Финский'};
 return codes[v]||'';
};
function replayPortrait(period){
 const months=Object.keys(replayMonths).filter(k=>k===period||(/^\d{4}$/.test(period)&&k.startsWith(period+'-')));
 const files=new Map(localTracks.map(file=>['file:'+favoriteId(file),file]));
 const genres=new Map(),languages=new Map(),artists=new Map(),sources=new Map(),days={},hours=Array(24).fill(0);
 let total=0,music=0,genreKnown=0,languageKnown=0,trackedFrom='';
 for(const month of months){
  const bucket=replayMonths[month];total+=Number(bucket.seconds)||0;
  if(bucket.trackedFrom&&(!trackedFrom||bucket.trackedFrom<trackedFrom))trackedFrom=bucket.trackedFrom;
  for(const [day,value] of Object.entries(bucket.days||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Number(value)))days[day]=(days[day]||0)+Math.max(0,Number(value));
  for(let i=0;i<24;i++)hours[i]+=Math.max(0,Number(bucket.hours?.[i])||0);
  for(const [key,row] of Object.entries(bucket.items||{})){
   if(!row)continue;const seconds=Number(row.seconds)||0;if(seconds<=0)continue;
   const file=files.get(key),info=file?trackDescriptions.get(file):null;
   const source=row.radio?'Радио':portraitSource(info?.genre)||portraitSource(row.source)||portraitSource(row.genre)||'Медиатека · без источника';
   sources.set(source,(sources.get(source)||0)+seconds);
   if(row.radio)continue;music+=seconds;
   const genre=portraitGenre(info?.genre||row.genre),language=portraitLanguage(info?.language||row.language);
   if(genre){genres.set(genre,(genres.get(genre)||0)+seconds);genreKnown+=seconds}
   if(language){languages.set(language,(languages.get(language)||0)+seconds);languageKnown+=seconds}
   if(row.artist&&row.artist!=='Моя музыка')artists.set(row.artist,(artists.get(row.artist)||0)+seconds);
  }
 }
 const list=map=>[...map].map(([name,seconds])=>({name,seconds})).sort((a,b)=>b.seconds-a.seconds);
 return {total,music,genreKnown,languageKnown,genres:list(genres),languages:list(languages),artists:list(artists),sources:list(sources),days,hours,trackedFrom};
}
let portraitScan=null;const portraitScanned=new WeakSet();
function enrichReplayPortrait(){
 if(portraitScan||!metadata?.describe)return portraitScan||Promise.resolve(false);
 const heard=new Map();for(const bucket of Object.values(replayMonths))for(const [key,row] of Object.entries(bucket.items||{}))if(!row.radio)heard.set(key,(heard.get(key)||0)+(Number(row.seconds)||0));
 const targets=localTracks.filter(f=>heard.has('file:'+favoriteId(f))&&!portraitScanned.has(f)).sort((a,b)=>(heard.get('file:'+favoriteId(b))||0)-(heard.get('file:'+favoriteId(a))||0)).slice(0,24);
 if(!targets.length)return Promise.resolve(false);
 portraitScan=(async()=>{let changed=false;for(const file of targets){
  if(document.hidden)break;portraitScanned.add(file);
  try{const info=await metadata.describe(file);if(!info)continue;const prior=trackDescriptions.get(file)||{};const {artwork,...details}=info;trackDescriptions.set(file,{...prior,...details});const key='file:'+favoriteId(file);
   for(const bucket of Object.values(replayMonths)){const row=bucket.items?.[key];if(!row)continue;if(info.genre){row.genre=info.genre;const source=portraitSource(info.genre);if(source)row.source=source;changed=true}if(info.language){row.language=info.language;changed=true}}
  }catch{}
 }if(changed){replayDirty=true;replaySave()}return changed})().finally(()=>{portraitScan=null});
 return portraitScan;
}
// Shared taste taxonomy: radio formats may contain more than one genre.
const tastePatterns=[
 ['russian rock',/русский рок|russian rock/i],['russian pop',/русский поп|russian pop/i],['rock',/rock|рок|metal|метал|punk|панк/i],
 ['pop',/\bpop\b|поп/i],['electronic',/electro|электрон|techno|техно|house|хаус|trance|транс|edm/i],
 ['dance',/dance|танцевальн|диско|disco/i],['jazz',/jazz|джаз/i],['classical',/classical|классическ|классика/i],
 ['hip hop',/hip.?hop|\brap\b|рэп|хип.?хоп/i],['indie',/indie|инди|альтернатив/i],
 ['russian chanson',/chanson|шансон/i],['country',/\bcountry\b|кантри/i],['blues',/blues|блюз/i],
 ['soul',/\bsoul\b|соул|r&b|rhythm and blues/i],['folk',/\bfolk\b|фолк/i]
];
function genreTasteTags(value){
 const v=String(value||'');if(!v||portraitSource(v))return [];
 const normalized=portraitGenre(v),text=v+' '+normalized;
 const hits=tastePatterns.filter(([,test])=>test.test(text)).map(([tag])=>tag);
 // Classical rock is rock, not classical music.
 return /classic(?:al)? rock|классическ[а-я]* рок/i.test(v)?hits.filter(t=>t!=='classical'):hits;
}
function sharedGenreTaste(afterMonth=''){
 const now=new Date(),current=now.getFullYear()*12+now.getMonth();
 const rows=new Map(),files=new Map(localTracks.map(file=>['file:'+favoriteId(file),file]));
 for(const [month,bucket] of Object.entries(replayMonths)){
  if(!/^\d{4}-\d{2}$/.test(month)||month<=afterMonth)continue;
  const [y,m]=month.split('-').map(Number),age=current-(y*12+m-1);if(age<0||age>2)continue;
  for(const [key,row] of Object.entries(bucket.items||{})){
   const seconds=Number(row?.seconds);if(!Number.isFinite(seconds)||seconds<=0)continue;
   const file=files.get(key),info=file?trackDescriptions.get(file):null;
   const tags=genreTasteTags(row.radio?row.genre:info?.genre||row.genre);if(!tags.length)continue;
   const weight=[1,.5,.25][age]/tags.length;
   for(const tag of tags){const item=rows.get(tag)||{tag,musicSeconds:0,radioSeconds:0};item[row.radio?'radioSeconds':'musicSeconds']+=seconds*weight;rows.set(tag,item)}
  }
 }
 return [...rows.values()].map(r=>({...r,score:r.musicSeconds+r.radioSeconds*.5})).filter(r=>r.score>=60).sort((a,b)=>b.score-a.score);
}
// Read-only summary of the same local statistics shown in My Musical World.
function discoveryTaste(){
 const months=Object.keys(replayMonths).filter(k=>/^\d{4}-\d{2}$/.test(k)).sort().slice(-3);
 const now=new Date(),current=now.getFullYear()*12+now.getMonth();
 const rows=[];
 for(const month of months){
  const [year,num]=month.split('-').map(Number),age=current-(year*12+num-1);
  if(age<0||age>2)continue;
  const artists=new Map();
  for(const item of Object.values(replayMonths[month]?.items||{})){
   if(!item||item.radio||!item.artist||item.artist==='Моя музыка')continue;
   const name=String(item.artist).trim().slice(0,100),seconds=Number(item.seconds);
   if(!name||!Number.isFinite(seconds)||seconds<=0)continue;
   const key=name.normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/\s+/g,' ').trim();
   const old=artists.get(key);artists.set(key,{name,key,seconds:(old?.seconds||0)+seconds,month,weight:[1,.5,.25][age]});
  }
  rows.push(...artists.values());
 }
 return rows.sort((a,b)=>b.seconds*b.weight-a.seconds*a.weight).slice(0,150);
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
   detail:{artist:performer,title:record.title||safeName(tracks[index]),album:typeof record.album==='string'?record.album:''}
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
 $('sayviMusicPlayIcon')?.setAttribute('d',playing?'M8 5v14M16 5v14':'M8 5.5 18 12 8 18.5z');
 syncResume();
}
let radioAirState='';
function updateRadioAir(event){
 const active=isRadio();
 if(!active){radioAirState='';page.classList.remove('sv-radio-on-air');return}
 if(event==='playing')radioAirState='live';
 else if(event==='waiting'||event==='stalled'||event==='loadstart'||event==='emptied'||event==='play')radioAirState='connecting';
 else if(event==='error')radioAirState='error';
 else if(event==='pause'||event==='ended')radioAirState='paused';
 const mode=audio.error?'error':audio.paused||audio.ended?'paused':radioAirState==='live'?'live':'connecting';
 page.classList.toggle('sv-radio-on-air',mode==='live');
 const label=$('svRadioAirLabel'),value=mode==='live'?'В эфире':mode==='connecting'?'Подключение…':mode==='error'?'Эфир недоступен':'Пауза';
 if(label&&label.textContent!==value)label.textContent=value;
}
for(const event of ['playing','waiting','stalled','loadstart','emptied','play','error','pause','ended'])audio.addEventListener(event,()=>updateRadioAir(event));
function syncResume(){
 syncModes();
 const loaded=tracks.length>0&&index>=0;
 if(loaded)previous.disabled=next.disabled=tracks.length<2&&chapterRows.length<2;
 // Empty-state visuals must never resemble a broken, disabled progress bar.
 page.classList.toggle('sv-music-empty',!loaded);
 const playing=loaded&&!audio.paused&&!audio.ended;
 const radioMode=loaded&&isRadio();page.classList.toggle('sv-music-radio-player',radioMode);
 const radioName=$('svRadioPlayerName');if(radioName){const name=radioMode?tracks[index].name:'';if(radioName.textContent!==name)radioName.textContent=name;}
 const radioFreq=$('svRadioPlayerFrequency');if(radioFreq){const match=radioMode?String(tracks[index].quality||'').match(/^\s*(\d{2,3}(?:[.,]\d+)?)\s*FM\s*$/i):null;const value=match?match[1].replace(',','.') : '';radioFreq.textContent=value;radioFreq.hidden=!value;}
 updateRadioAir();
 // One actual audio element. The mini is a small remote, not a second player.
 if(mini){
  // Replay shares the approved floating Music Home remote during an active or paused session.
  const inline=miniOnMusicHome()||(location.hash==='#sayvi-music'&&page.dataset.musicView==='replay'&&!page.hidden&&!!miniHomeSlot&&loaded&&hasPlayed&&!audio.ended&&!miniDismissed);
  if(inline){if(mini.parentNode!==miniHomeSlot)miniHomeSlot.append(mini)}
  else if(miniOrigin.parentNode&&mini.parentNode!==miniOrigin.parentNode)miniOrigin.parentNode.insertBefore(mini,miniOrigin.nextSibling);
  mini.classList.toggle('sv-music-mini-inline',inline);
  mini.hidden=!inline&&(!loaded||!hasPlayed||audio.ended||(location.hash==='#sayvi-music'&&page.dataset.musicView!=='home'&&page.dataset.musicView!=='new'&&page.dataset.musicView!=='radio'&&page.dataset.musicView!=='radio-favorites'&&page.dataset.musicView!=='library'&&page.dataset.musicView!=='replay'&&page.dataset.musicView!=='history')||miniDismissed);
  mini.classList.toggle('is-playing',playing);
  if(loaded){
   const file=tracks[index];
   const info=infoFor(file);
   renderMiniCover(file.radio?String(file.id||file.name):favoriteId(file),file.radio?file.artwork:trackThumbnails.get(file));
   if(miniTitle)miniTitle.textContent=chapterRows.length&&chapterIndex>=0?chapterLabel(chapterIndex):info.title||safeName(file);
   if(miniArtist)miniArtist.textContent=isRadio()&&radioFallback?(file.city||file.country):info.artist||'Моя музыка';
   if(miniOpen)miniOpen.setAttribute('aria-label','Открыть плеер: '+safeName(file));
   if(miniPlay){
    miniPlay.setAttribute('aria-label',playing?'Пауза':'Продолжить воспроизведение');
    miniPlay.setAttribute('aria-pressed',String(playing));
   }
   miniIcon?.setAttribute('d',playing?'M8 6v12M16 6v12':'M8 5.5 18 12 8 18.5z');
   const canSkip=tracks.length>1||chapterRows.length>1;
   if(miniNext)miniNext.disabled=!canSkip;
  }else if(inline){
   const last=window.SEYVEO_RADIO?.recent?.()[0];
   if(miniTitle)miniTitle.textContent=last?.title||'Моя музыка';
   if(miniArtist)miniArtist.textContent=last?.artist||'Выберите музыку или радио';
   if(miniOpen)miniOpen.setAttribute('aria-label',last?'Открыть плеер':'Выбрать музыку или радио');
   if(miniPlay){miniPlay.setAttribute('aria-label',last?'Включить '+last.title:'Выбрать музыку или радио');miniPlay.setAttribute('aria-pressed','false')}
   miniIcon?.setAttribute('d','M8 5.5 18 12 8 18.5z');
   if(miniNext)miniNext.disabled=true;
   renderMiniCover(last?String(last.id||last.title):null,last?.artwork);
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
 const list=collection.querySelector('.sv-collection-list');if(list)list.scrollTop=0;
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
 renderMiniCover(null,null);
 for(const surface of [artwork]){
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
  renderMiniCover(file?.radio?String(file.id||file.name):favoriteId(file),trackThumbnails.get(file)||candidate);
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
    title:chapterRows.length&&chapterIndex>=0?chapterLabel(chapterIndex):info.title,
    artist:info.artist||'Моя музыка · SEYVEO',
    album:info.album||'SEYVEO SOUND',
    // Only the real embedded cover (CSP-approved data URL) is used by MediaSession.
    artwork:page.classList.contains('sv-music-player-has-art')&&coverDataURL&&info.artwork?[{src:coverDataURL,type:info.artwork.type||'image/jpeg',sizes:''}]:[]
   });
  }
  navigator.mediaSession.setActionHandler('play',()=>{if(audio.paused||window.SEYVEO_ADAPTIVE_SOUND?.isPausing?.())play()});
  navigator.mediaSession.setActionHandler('pause',smoothPause);
  navigator.mediaSession.setActionHandler('previoustrack',()=>navigateTrack(-1));
  navigator.mediaSession.setActionHandler('nexttrack',()=>navigateTrack(1));
  navigator.mediaSession.setActionHandler('seekto',details=>{
   if(!isRadio()&&Number.isFinite(details.seekTime))audio.currentTime=Math.min(Math.max(0,details.seekTime),audio.duration||0);
  });
 }catch{}
}
// Match the existing Music library fallback art, including its stable palette.
const collectionCoverPalettes=[['#77969B','#315759'],['#8299B8','#354D73'],['#A091B3','#55446F'],['#BA9A81','#74513D'],['#819D8E','#3C6555'],['#B18F9E','#754C61'],['#8D9FAE','#465A71'],['#A9A17D','#6D633F']];
function collectionFallbackArt(tile,key){
 let hash=2166136261;
 for(const char of String(key||'music'))hash=Math.imul(hash^char.charCodeAt(0),16777619);
 const [light,deep]=collectionCoverPalettes[(hash>>>0)%collectionCoverPalettes.length];
 tile.classList.add('sv-track-fallback');
 tile.style.setProperty('--sv-track-light',light);tile.style.setProperty('--sv-track-deep',deep);
 tile.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17.2V5.6l11-2.3v11.6M9 9l11-2.3"/><ellipse cx="5.9" cy="17.6" rx="3.1" ry="2.35" transform="rotate(-12 5.9 17.6)"/><ellipse cx="16.9" cy="15.3" rx="3.1" ry="2.35" transform="rotate(-12 16.9 15.3)"/></svg>';
}
function collectionRealArt(tile,src){
 tile.classList.remove('sv-track-fallback');tile.classList.add('sv-track-cover');
 tile.replaceChildren();tile.style.backgroundImage='url("'+src+'")';
}
// Reuse exactly the library's note, rings and stable per-track palette.
let miniCoverKey=null,miniCoverSource=null;
function renderMiniCover(key,src){
 if(!miniArtwork||!mini)return;
 key=key||null;src=src||null;
 if(key===miniCoverKey&&src===miniCoverSource&&miniArtwork.hidden===!(key||src))return;
 miniCoverKey=key;miniCoverSource=src;
 miniArtwork.classList.remove('sv-track-fallback','sv-track-cover');
 miniArtwork.replaceChildren();
 miniArtwork.style.removeProperty('background-image');
 miniArtwork.style.removeProperty('--sv-track-light');
 miniArtwork.style.removeProperty('--sv-track-deep');
 if(src)collectionRealArt(miniArtwork,src);
 else if(key)collectionFallbackArt(miniArtwork,key);
 miniArtwork.hidden=!(key||src);
 mini.classList.toggle('has-artwork',!!(key||src));
}
// Session-only queue edits preserve the saved library and the playing audio source.
function editQueue(from,to,remove=false){
 if(collectionMode!=='tracks'||isRadio()||from<0||from>=tracks.length||(!remove&&(to<0||to>=tracks.length||from===to))||(remove&&from===index))return false;
 const current=tracks[index],order=tracks.slice(),file=order.splice(from,1)[0];
 if(!remove)order.splice(to,0,file);
 tracks=order;index=tracks.indexOf(current);resetShuffle(current);
 collectionRender();syncResume();return true;
}
function removeFavoriteFromList(key){
 if(!favorites.has(key))return false;
 const remaining=[...favorites].filter(id=>id!==key);
 try{localStorage.setItem(FAVORITES_KEY,JSON.stringify(remaining.slice(-200)))}catch{sayviMessage('Не удалось сохранить избранное на этом устройстве.');return false}
 favorites.delete(key);updateFavorite();collectionRender();return true;
}
function bindQueueGesture(btn,handle,file,list,slide,remove,onRemove=null){
 const WIDTH=56;
 let gesture=null,blockedUntil=0,target=null;
 const locate=()=>tracks.indexOf(file);
 const open=()=>slide.classList.contains('sv-queue-open');
 const setOpen=value=>{slide.classList.toggle('sv-queue-open',value);remove.hidden=!value;remove.tabIndex=value?0:-1;};
 const closeOthers=()=>list.querySelectorAll('.sv-queue-slide.sv-queue-open').forEach(row=>{
  if(row!==slide){row.classList.remove('sv-queue-open');const action=row.querySelector('.sv-queue-swipe-delete');if(action){action.hidden=true;action.tabIndex=-1}}
 });
 function begin(x,y,drag,id){
  closeOthers();
  if(!drag&&remove.disabled)return;
  gesture={x,y,drag,id,swipe:false,vertical:false,startOpen:open()};
  if(drag)btn.classList.add('sv-queue-dragging');
 }
 function move(x,y,event){
  const g=gesture;if(!g||g.vertical)return;
  const dx=x-g.x,dy=y-g.y;
  if(g.drag){
   if(event.cancelable)event.preventDefault();
   const row=document.elementFromPoint(x,y)?.closest('[data-queue-index]');
   if(row!==target){target?.classList.remove('sv-queue-target');target=row&&list.contains(row)?row:null;target?.classList.add('sv-queue-target')}
   const rect=list.getBoundingClientRect();
   if(y<rect.top+30)list.scrollTop-=10;else if(y>rect.bottom-30)list.scrollTop+=10;
   return;
  }
  if(!g.swipe){
   if(Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)){g.vertical=true;return}
   if(Math.abs(dx)<9||Math.abs(dx)<Math.abs(dy))return;
   if(dx>0&&!g.startOpen)return;
   g.swipe=true;slide.classList.add('sv-queue-sliding');remove.hidden=false;
  }
  if(event.cancelable)event.preventDefault();
  slide.style.setProperty('--sv-queue-offset',Math.max(-WIDTH,Math.min(0,(g.startOpen?-WIDTH:0)+dx))+'px');
 }
 function finish(x,y,cancel=false){
  const g=gesture;gesture=null;if(!g)return;
  const to=target?Number(target.dataset.queueIndex):-1;
  target?.classList.remove('sv-queue-target');target=null;
  btn.classList.remove('sv-queue-dragging');slide.classList.remove('sv-queue-sliding');slide.style.removeProperty('--sv-queue-offset');
  const dx=x-g.x,dy=y-g.y;
  if(g.drag){blockedUntil=Date.now()+450;if(!cancel&&Math.abs(dy)>8&&to>=0)editQueue(locate(),to);return}
  if(g.swipe||(!cancel&&!g.vertical&&dx<-35&&Math.abs(dx)>Math.abs(dy)*1.25)){
   blockedUntil=Date.now()+450;
   setOpen(cancel?g.startOpen:((g.startOpen?-WIDTH:0)+dx)<-26);
  }else if(cancel)setOpen(g.startOpen);
 }
 // Dedicated row surface and non-passive horizontal touchmove, matching notebook swipe.
 slide.addEventListener('touchstart',e=>{
  if(!btn.contains(e.target)||e.touches.length!==1)return;
  const p=e.touches[0],drag=handle?.contains(e.target);begin(p.clientX,p.clientY,drag,p.identifier);
  if(drag&&e.cancelable)e.preventDefault();
 },{passive:false});
 slide.addEventListener('touchmove',e=>{
  if(!gesture||e.touches.length!==1)return;const p=e.touches[0];if(p.identifier===gesture.id)move(p.clientX,p.clientY,e);
 },{passive:false});
 slide.addEventListener('touchend',e=>{
  if(!gesture)return;const p=Array.from(e.changedTouches).find(t=>t.identifier===gesture.id);if(!p)return;
  if((gesture.drag||gesture.swipe)&&e.cancelable)e.preventDefault();finish(p.clientX,p.clientY);
 },{passive:false});
 slide.addEventListener('touchcancel',()=>{if(gesture)finish(gesture.x,gesture.y,true)},{passive:true});
 btn.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'||e.button!==0)return;begin(e.clientX,e.clientY,handle?.contains(e.target),e.pointerId);
  if(gesture)try{btn.setPointerCapture(e.pointerId)}catch{}
 });
 btn.addEventListener('pointermove',e=>{if(gesture&&e.pointerType!=='touch'&&gesture.id===e.pointerId)move(e.clientX,e.clientY,e)});
 btn.addEventListener('pointerup',e=>{if(gesture&&e.pointerType!=='touch'&&gesture.id===e.pointerId)finish(e.clientX,e.clientY)});
 btn.addEventListener('pointercancel',e=>{if(gesture&&e.pointerType!=='touch')finish(gesture.x,gesture.y,true)});
 btn.addEventListener('click',e=>{
  if(Date.now()<blockedUntil||handle?.contains(e.target)||open()){e.preventDefault();e.stopImmediatePropagation();if(open()&&Date.now()>=blockedUntil&&!handle?.contains(e.target))setOpen(false)}
 },true);
 btn.addEventListener('keydown',e=>{
  if(handle&&e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();const i=locate(),to=i+(e.key==='ArrowUp'?-1:1);if(editQueue(i,to))collection.querySelector('[data-queue-index="'+to+'"]')?.focus({preventScroll:true})}
  else if(e.key==='Delete'&&onRemove){e.preventDefault();onRemove()}
  else if(e.key==='Delete'&&locate()!==index){e.preventDefault();const i=locate();if(editQueue(i,-1,true))collection.querySelector('[data-queue-index="'+Math.min(i,tracks.length-1)+'"]')?.focus({preventScroll:true})}
 });
}
function collectionRender(){
 const oldTop=collection.dataset.collectionMode===collectionMode?(collection.querySelector('.sv-collection-list')?.scrollTop||0):0;
 collection.dataset.collectionMode=collectionMode;
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
 header.append(title);
 header.append(dismiss);collection.append(header);
 const list=document.createElement('div');list.className='sv-collection-list';collection.append(list);
 if(!favoriteView&&queueOpen)renderChapters(list);
 if(!favoriteView){
  const fade=()=>list.classList.toggle('sv-queue-more',list.scrollHeight-list.clientHeight-list.scrollTop>3);
  list.addEventListener('scroll',fade,{passive:true});
  if(queueOpen)requestAnimationFrame(()=>{if(list.isConnected)fade()});
 }
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
  const tile=document.createElement('span');tile.className='sv-collection-art sv-music-track-tile';tile.setAttribute('aria-hidden','true');
  const thumb=match&&(trackThumbnails.get(match.file)||(match.file.radio?match.file.artwork:null));
  if(thumb)collectionRealArt(tile,thumb);
  else collectionFallbackArt(tile,match?.file?.radio?match.file.id:key);
  const copy=document.createElement('span');copy.className='sv-collection-copy';
  const name=document.createElement('strong');name.className='sv-music-row-title';name.textContent=info.title||'Без названия';copy.append(name);
  if(info.artist){const artist=document.createElement('small');artist.textContent=info.artist;copy.append(artist)}
  const action=document.createElement('span');action.className='sv-collection-action';action.setAttribute('aria-hidden','true');
  action.innerHTML=match?'<svg class="sv-music-outline-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5.5v13L19 12z"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10M13 3v7h7L13 3M9 15h6m-3-3v6"/></svg>';
  if(current&&!favoriteView){
    action.innerHTML='<span class="sv-queue-equalizer"><i></i><i></i><i></i></span>';
    btn.setAttribute('aria-label',(info.title||'Без названия')+' · текущий трек');
  }
  btn.append(tile,copy,action);
  let row=btn;
  if(!favoriteView&&match&&!match.file.radio){
    btn.dataset.queueIndex=String(match.i);
    const handle=document.createElement('span');handle.className='sv-queue-handle';handle.setAttribute('aria-hidden','true');
    handle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M7 8h10M7 12h10M7 16h10"/></svg>';
    handle.title='Перетащить';btn.append(handle);
    btn.setAttribute('aria-keyshortcuts','Alt+ArrowUp Alt+ArrowDown'+(current?'':' Delete'));
    const slide=document.createElement('div');slide.className='sv-queue-slide';
    const swipeDelete=document.createElement('button');swipeDelete.type='button';swipeDelete.className='sv-queue-swipe-delete';swipeDelete.hidden=true;swipeDelete.tabIndex=-1;swipeDelete.disabled=current;
    swipeDelete.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M9 7V4.5h6V7M7 7l.8 12h8.4L17 7M10 10v6m4-6v6"/></svg>';swipeDelete.setAttribute('aria-label','Убрать из очереди: '+(info.title||'Без названия'));
    swipeDelete.addEventListener('click',()=>editQueue(tracks.indexOf(match.file),-1,true));
    slide.append(btn,swipeDelete);row=slide;
    bindQueueGesture(btn,handle,match.file,list,slide,swipeDelete);
  }else if(favoriteView){
    const slide=document.createElement('div');slide.className='sv-queue-slide';
    const remove=document.createElement('button');remove.type='button';remove.className='sv-queue-swipe-delete';remove.hidden=true;remove.tabIndex=-1;
    remove.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M9 7V4.5h6V7M7 7l.8 12h8.4L17 7M10 10v6m4-6v6"/></svg>';
    remove.setAttribute('aria-label','Убрать из избранного: '+(info.title||'Без названия'));
    const forget=()=>removeFavoriteFromList(key);remove.addEventListener('click',forget);
    btn.setAttribute('aria-keyshortcuts','Delete');slide.append(btn,remove);row=slide;
    bindQueueGesture(btn,null,match?.file,list,slide,remove,forget);
  }
  if(!match){
   btn.classList.add('sv-music-favorites-unavailable');btn.title='Файл недоступен. Добавить повторно';
   btn.setAttribute('aria-label',name.textContent+'. Файл отсутствует. Добавить повторно');
   btn.addEventListener('click',()=>fileInput.click());
  }else{
   btn.addEventListener('click',()=>{if(match.local)tracks=localTracks;switchTrack(match.local?match.i:tracks.indexOf(match.file),true)});
   if(queueOpen&&!thumb&&!match.file.radio){
    const localIndex=localTracks.indexOf(match.file);
    if(localIndex>=0)prepareTrackPreview(localIndex).then(preview=>{
     if(!preview||!btn.isConnected)return;
     name.textContent=preview.title||name.textContent;
     if(preview.artist){let artist=copy.querySelector('small');if(!artist){artist=document.createElement('small');copy.append(artist)}artist.textContent=preview.artist}
     if(preview.artwork)collectionRealArt(tile,preview.artwork)
    }).catch(()=>{});
   }
  }
  list.append(row);
 });
 list.scrollTop=oldTop;
 syncQueueToggle();
}
function switchTrack(i,autoplay=false,fromNavigation=false,resumeSeconds=0){
 if(!tracks.length)return false;
 const newIndex=((i%tracks.length)+tracks.length)%tracks.length;
 const file=tracks[newIndex];const version=++selectVersion;
 if(!fromNavigation)resetShuffle(file);
 savePosition(true);resetChapters(file);positionFile=null;positionSource='';positionPending=null;
 audio.pause();audio.removeAttribute('src');audio.load();safeRelease();
 radioFallback=false;
  if(file.radio){
   index=newIndex;audio.src=file.stream;
   coverDataURL=null; // Radio has its own lightweight orbit scene; mini-player keeps station artwork.
   setPlayerTitle(file.name,false);artist.textContent=(file.city||file.country);
   previous.disabled=next.disabled=tracks.length<2;updateFavorite();collectionRender();mediaSession();updatePlay();updateTime();
   if(autoplay){sayviMessage('Подключение к '+file.name+'…');smoothPlay().catch(()=>{if(version===selectVersion&&!audio.error)sayviMessage('Не удалось начать эфир. Нажмите Play ещё раз.')});}
   return true;
  }
  try{url=URL.createObjectURL(file)}catch{
  sayviMessage('Не удалось открыть файл. Попробуйте выбрать другой аудиофайл.');
  updatePlay();return false;
 }
 index=newIndex;
 positionFile=file;positionSource=url;positionPending=resumeSeconds>0?resumeSeconds:null;
 writePosition(file,Math.max(0,resumeSeconds));
 audio.src=url;
 updateFavorite();
 const visible=infoFor(file);
 setPlayerTitle(visible.title);
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
   if(chapterRows.length)paintChapter(true);else{setPlayerTitle(info.title);artist.textContent=info.artist||'Моя музыка'}
   collectionRender();mediaSession();syncResume();
  }).catch(()=>{if(version===selectVersion)stage?.classList.remove('is-checking-artwork')});
 }
 if(autoplay){
  const playing=smoothPlay();
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
 if(!audio.paused&&!audio.ended&&!window.SEYVEO_ADAPTIVE_SOUND?.isPausing?.()){smoothPause();return}
 if(isRadio()&&!audio.getAttribute('src'))audio.src=radioFallback?tracks[index].fallback:tracks[index].stream;
 const p=smoothPlay();
 if(p&&typeof p.catch==='function')p.catch(()=>{
  sayviMessage('Не удалось начать воспроизведение. Возможно, формат файла не поддерживается этим устройством.');
 });
}
function wLyrics(){return window.SEYVEO_LYRICS}
function ingest(list){
 const files=Array.from(list||[]),lyrics=wLyrics();
 const texts=files.filter(file=>lyrics?.isText(file));
 const candidates=files.filter(file=>!lyrics?.isText(file));
 const chosen=candidates.filter(file=>{
  const name=String(file.name||'');
  return (file.type.startsWith('audio/')||extensions.test(name))&&file.size>0&&file.size<=MAX_FILE_SIZE;
 }).slice(0,MAX_TRACKS);
 if(!chosen.length&&texts.length){
  libraryQueue=libraryQueue.then(async()=>{const result=await lyrics.attach(texts,window.SEYVEO_MUSIC.recognitionLibrary());const message='Тексты: сохранено '+result.attached+(result.temporary?', временно '+result.temporary:'')+(result.skipped?', не сопоставлено '+result.skipped:'')+'.';libraryMessage(message);sayviMessage(message)}).catch(()=>libraryMessage('Не удалось добавить тексты песен.'));
  return true;
 }
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
   if(!entry){entry=file;localTracks.push(entry);if(tracks!==localTracks&&tracks.length&&!isRadio())tracks.push(entry);existing.set(id,entry);added++}
   selected.set(id,entry);
  }
  if(!tracks.length){tracks=localTracks;switchTrack(0,false)}
  libraryRefresh();
  libraryMessage('Сохранение музыки на устройстве…');
  const skipped=candidates.length-chosen.length;
  const suffix=skipped?' Пропущено: '+skipped+' (до 40 файлов за раз, до 180 МБ каждый).':'';
  try{
   await saveLibraryFiles([...selected.values()]);
   const result=texts.length?await lyrics.attach(texts,window.SEYVEO_MUSIC.recognitionLibrary()):null;
   const lyricSuffix=result?' Тексты: сохранено '+result.attached+(result.temporary?', временно '+result.temporary:'')+(result.skipped?', не сопоставлено '+result.skipped:'')+'.':'';
   const message=(added?'Добавлено '+added+'. ':'Новых файлов нет. ')+libraryCount()+'.'+suffix+lyricSuffix;
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
minimize?.addEventListener('click',()=>{
 // The left header arrow handles nested Back; this control only collapses.
 if(!window.SEYVEO_MUSIC_DOCK?.closePlayer?.())minimizeMusic();
});
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
  if(tracks.length>1||chapterRows.length>1){
   navigateTrack(dx>0?-1:1);
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
miniNext?.addEventListener('click',()=>navigateTrack(1));
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
 if(!inside){savePosition(true);hidePanels()}
 else syncQueueToggle();
 syncResume();
}
window.addEventListener('hashchange',syncMusicRoute);
// Main navigation also uses history.pushState(), which does NOT fire hashchange.
// Always clear the music-only screen class when the user opens Sayvi chat.
window.addEventListener('seyveo:route-changed',syncMusicRoute);
importBtn.addEventListener('click',()=>fileInput.click());
player.addEventListener('click',play);
previous.addEventListener('click',()=>navigateTrack(-1));
next.addEventListener('click',()=>navigateTrack(1));
fileInput.addEventListener('change',()=>{ingest(fileInput.files);fileInput.value=''});
seek.addEventListener('input',()=>{
 const duration=audio.duration;
 if(!isRadio()&&Number.isFinite(duration)&&duration>0)audio.currentTime=Number(seek.value)/1000*duration;
});
options.addEventListener('click',event=>{
 const btn=event.target.closest('[data-music-provider]');
 if(btn&&options.contains(btn))providerChoose(btn.dataset.musicProvider);
});
audio.addEventListener('timeupdate',()=>{chapterTick();updateTime();savePosition()});
audio.addEventListener('seeking',()=>{chapterLastTime=-1});
audio.addEventListener('seeked',()=>{chapterLastTime=-1;paintChapter();updateTime();savePosition(true)});
audio.addEventListener('durationchange',updateTime);
audio.addEventListener('loadedmetadata',()=>{restorePosition();updateTime();loadChapters()});
audio.addEventListener('canplay',loadChapters);
audio.addEventListener('canplay',()=>{restorePosition();updateTime()});
audio.addEventListener('play',stopChapterScan);
audio.addEventListener('playing',()=>{stopChapterScan();homeMusicSession=true;const file=tracks[index];if(file&&!file.radio){recentFiles=[file,...recentFiles.filter(item=>item!==file)].slice(0,12);recentPlayedAt.set(file,Date.now());for(const item of recentPlayedAt.keys())if(!recentFiles.includes(item))recentPlayedAt.delete(item);rememberRecent()}updatePlay();sayviMessage('');qualifyDiscoveryListen()});
audio.addEventListener('pause',()=>{stopDiscoveryListen();savePosition(true);updatePlay();if(chapterBusy){chapterProgress='Продолжаю анализ сборника…';updateChapterStatus()}else scheduleChapterScan()});
audio.addEventListener('ended',()=>{stopDiscoveryListen();if(isRadio()){updatePlay();sayviMessage('Эфир прервался. Нажмите Play для повторного подключения.');return}if(!navigateTrack(1,true)){savePosition(true);updatePlay();sayviMessage('Сэйви: музыка закончилась. Включить ещё раз?')}});
audio.addEventListener('error',()=>{stopDiscoveryListen();updatePlay();if(isRadio()){const station=tracks[index],version=selectVersion;if(!radioFallback&&station.fallback){radioFallback=true;audio.src=station.fallback;artist.textContent=(station.city||station.country);audio.play().catch(()=>{if(version===selectVersion)sayviMessage('Резервный эфир недоступен.')});return}sayviMessage('Эфир недоступен. Попробуйте другую станцию.');return}if(index>=0)sayviMessage('Не смогла прочитать эту запись. Возможно, её формат не поддерживается.')});
/* Screen lock/background can dispatch lifecycle changes.
 * Never stop an actively playing track on pagehide: the OS decides if WebKit
 * can continue. A full browser termination remains outside PWA control. */
window.addEventListener('beforeunload',event=>{if(librarySaving){event.preventDefault();event.returnValue=''}});
window.addEventListener('pagehide',()=>{savePosition(true);stopChapterScan()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){savePosition(true);stopChapterScan()}else scheduleChapterScan()});
// Keep object URLs intact in back-forward cache; document teardown frees them.
window.addEventListener('pageshow',event=>{
 if(event.persisted&&tracks.length&&index>=0&&!audio.getAttribute('src')){
  const saved=readPosition();switchTrack(index,false,false,saved?.id===favoriteId(tracks[index])?saved.seconds:0);
 }
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
 const available=stations.filter(station=>station.radio&&(/^https:\/\//.test(station.stream||'')||(station.id==='krd107'&&['127.0.0.1:8790','localhost:8790'].includes(location.host)&&/^\/api\/seyveo-radio-107\?quality=(256|128)$/.test(station.stream||''))));
 const selected=available.findIndex(station=>station.id===id);if(selected<0)return false;
 if(isRadio()&&tracks[index].id===id){play();return true;}
 tracks=available;miniDismissed=false;return switchTrack(selected,true);
}
window.SEYVEO_MUSIC=Object.freeze({
 playRadio,replaySummary,replayPortrait,enrichReplayPortrait,discoveryTaste,sharedGenreTaste,genreTasteTags,removeRecentHistory,
 understand,open,minimize:minimizeMusic,openQueue:showQueue,toggleQueue,closePanels:hidePanels,
 searchTracks,playFromSearch,playIndexFromSearch,refreshMini:syncResume,prepareTrackPreview,
 // Read-only access to the selected local File for optional visual analysis.
 rhythmFile:()=>isRadio()?null:tracks[index]||null,
 recognitionLibrary:()=>localTracks.map(file=>{const info=infoFor(file);return {id:favoriteId(file),file,title:info.title||safeName(file),artist:info.artist||'Моя музыка',album:info.album||''}}),
 browseTracks:()=>localTracks.map((file,i)=>({index:i,artKey:favoriteId(file),title:infoFor(file).title||safeName(file),artist:infoFor(file).artist||'Моя музыка',artwork:trackThumbnails.get(file)||null})),
 recentTracks:()=>recentFiles.filter(file=>localTracks.includes(file)).map(file=>({index:localTracks.indexOf(file),artKey:favoriteId(file),title:infoFor(file).title||safeName(file),artist:infoFor(file).artist||'Моя музыка',artwork:trackThumbnails.get(file)||null,playedAt:recentPlayedAt.get(file)||0})),
 state:()=>Object.freeze({
  libraryLoading,libraryCount:localTracks.length,librarySaving:librarySaving>0,savedCount:savedTrackIds.size,
  loaded:tracks.length,trackIndex:index,playing:!!tracks.length&&!audio.paused,shuffle,repeat,
  homeSession:homeMusicSession,
  source:isRadio()?'radio':'local-file',stationId:isRadio()?tracks[index].id:null,quality:isRadio()?(radioFallback?tracks[index].fallbackQuality:tracks[index].quality):null,connectedServices:0
 })
});
libraryQueue=restoreLibrary();
})();