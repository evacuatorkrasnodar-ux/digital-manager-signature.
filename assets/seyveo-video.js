/* SEYVEO PLAY · one official YouTube iframe, created only by a user gesture.
 * No feed scraping, autoplay, media downloading, CSS overlays or second dock.
 * On leaving/locking: destroy iframe to release decoding and stop playback.
 * PWA: native media decoding is delegated to the browser, not owned by SEYVEO. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),core=window.SEYVEO_VIDEO_CORE;
 const page=$('sayviVideoPage'),form=$('sayviVideoForm'),
  input=$('sayviVideoUrl'),watch=$('sayviVideoWatch'),
  demo=$('sayviVideoExample'),back=$('sayviVideoBack'),
  screen=$('sayviVideoPlayer'),status=$('sayviVideoStatus'),
  save=$('sayviVideoSave'),resume=$('sayviVideoSaved'),
  forget=$('sayviVideoForget'),external=$('sayviVideoExternal');
 if(!core||!page||!form||!input||!screen||!status)return;
 const KEY='seyveo-video-saved-link-v1';
 const SAMPLE='M7lc1UVf-VE'; // Example used in the official YouTube IFrame docs.
 let chosen=null,playingFrame=null,lastRoute='',lastKnownHash='',unloadedAt=0;
 const active=()=>location.hash==='#sayvi-video'&&!page.hidden;
 const message=(value)=>{status.textContent=value};
 const safeLoad=()=>{
  try{const id=localStorage.getItem(KEY);return core.videoId(id)}catch{return null}
 };
 const setExternal=()=>{
  external.hidden=!chosen;
  if(chosen)external.href='https://www.youtube.com/watch?v='+chosen;
  else external.removeAttribute('href');
  const hasSaved=!!safeLoad();
  resume.hidden=!hasSaved;
  forget.hidden=!hasSaved;
  save.disabled=!chosen;
 };
 function dispose(){
  if(!playingFrame)return;
  // Removing the iframe stops playback and releases the remote video decoder.
  playingFrame.removeAttribute('src');
  playingFrame.remove();
  playingFrame=null;
  screen.hidden=true;
  screen.replaceChildren();
  unloadedAt=Date.now();
 }
 function choose(id){
  if(!id)return false;
  if(playingFrame)dispose();
  chosen=id;
  input.value='https://www.youtube.com/watch?v='+id;
  setExternal();
  return true;
 }
 function play(id){
  if(!active())return false;
  if(id&&!choose(id))return false;
  if(!chosen)return false;
  const src=core.embed(chosen);
  if(!src)return false;
  dispose();
  // Prevent two audio streams in the same space; never delete the local queue.
  const music=$('sayviMusicAudio');
  if(music&&!music.paused)music.pause();
  const frame=document.createElement('iframe');
  frame.className='sv-video-iframe';
  frame.title='YouTube · официальный видеоплеер';
  frame.src=src;
  frame.setAttribute('allow','encrypted-media; accelerometer; gyroscope; picture-in-picture; web-share');
  frame.setAttribute('allowfullscreen','');
  frame.setAttribute('loading','eager');
  frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
  frame.addEventListener('load',()=>{
   if(frame===playingFrame)message('Плеер открыт. Для запуска коснитесь ▶ внутри YouTube.');
  },{once:true});
  screen.hidden=false;
  screen.append(frame);
  playingFrame=frame;
  message('Загружаю официальный плеер…');
  watch.textContent='Перезагрузить видео';
  return true;
 }
 function route(){
  const inside=location.hash==='#sayvi-video';
  document.documentElement.classList.toggle('sv-video-screen',inside);
  if(!inside){
   dispose();
   watch.textContent='Смотреть';
   if(lastKnownHash==='#sayvi-video')message('Видео остановлено при выходе — для экономии заряда.');
  }
  lastKnownHash=location.hash;
 }
 function open({from=null,id=null}={}){
  if(!active()&&location.hash!=='#sayvi-video')
   lastRoute=from==='music'?'#sayvi-music':location.hash==='#sayvi-music'?'#sayvi-music':'';
  if(id)choose(core.videoId(id));
  if(location.hash!=='#sayvi-video')location.hash='#sayvi-video';
  else route();
  return true;
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const id=core.videoId(input.value);
  if(!id){
   message('Вставьте ссылку на видео YouTube, Shorts или его 11-значный ID.');
   return;
  }
  choose(id);
  play();
 });
 demo?.addEventListener('click',()=>{choose(SAMPLE);play()});
 back?.addEventListener('click',()=>{
  dispose();
  if(lastRoute==='#sayvi-music')location.hash='#sayvi-music';
  else $('navHome')?.click();
 });
 save?.addEventListener('click',()=>{
  if(!chosen)return;
  try{localStorage.setItem(KEY,chosen);message('Сохранила ссылку на этом устройстве. Само видео не скачивается.')}
  catch{message('Не удалось сохранить ссылку на этом устройстве.')}
  setExternal();
 });
 resume?.addEventListener('click',()=>{
  const id=safeLoad();
  if(!id)return;
  choose(id);
  message('Сохранённая ссылка готова. Нажмите «Смотреть», чтобы загрузить плеер.');
 });
 forget?.addEventListener('click',()=>{
  try{localStorage.removeItem(KEY)}catch{}
  setExternal();
  message('Сохранённая ссылка удалена с этого устройства.');
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&playingFrame){
   dispose();
   watch.textContent='Смотреть';
   message('Видео остановлено при сворачивании — экономим батарею. Нажмите «Смотреть», чтобы продолжить.');
  }
 });
 window.addEventListener('pagehide',dispose);
 window.addEventListener('hashchange',route);
 window.addEventListener('seyveo:route-changed',route);
 // A named action is available to the existing Sayvi input and Music sources.
 window.SEYVEO_VIDEO=Object.freeze({open,understand:core.understand,
  hasPlayer:()=>!!playingFrame,state:()=>Object.freeze({
   opened:active(),loaded:!!playingFrame,source:'official-youtube-embed',
   externalDataLoadedOnlyAfterPlay:true,
   saved:!!safeLoad()
  })});
 setExternal();route();
})();
