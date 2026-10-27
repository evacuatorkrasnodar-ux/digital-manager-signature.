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
  forget=$('sayviVideoForget'),external=$('sayviVideoExternal'),
  more=$('sayviVideoMore');
 if(!core||!page||!form||!input||!screen||!status)return;
 const KEY='seyveo-video-saved-link-v1';
 const SAMPLE='M7lc1UVf-VE'; // Example used in the official YouTube IFrame docs.
 let chosen=null,playingFrame=null,lastRoute='',lastKnownHash='';
 // The HTML is the single source of markup; no duplicate toolbar or player.
 input.addEventListener('input',()=>{
  watch.textContent=core.videoId(input.value.trim())?'Смотреть':'Найти';
 });
 const active=()=>location.hash==='#sayvi-video'&&!page.hidden;
 const message=(value)=>{status.textContent=value;status.hidden=!value};
 const safeLoad=()=>{
  try{const id=localStorage.getItem(KEY);return core.videoId(id)}catch{return null}
 };
 const setExternal=()=>{
  external.hidden=!chosen;
  if(chosen)external.href='https://www.youtube.com/watch?v='+chosen;
  else external.removeAttribute('href');
  const hasSaved=!!safeLoad();
  if(more)more.hidden=!chosen&&!hasSaved;
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
   if(frame===playingFrame)message('');
  },{once:true});
  screen.hidden=false;
  screen.append(frame);
  playingFrame=frame;
  message('');
  watch.textContent='Смотреть';
  return true;
 }
 function route(){
  const inside=location.hash==='#sayvi-video';
  document.documentElement.classList.toggle('sv-video-screen',inside);
  if(!inside){
   dispose();
   watch.textContent='Найти';
   if(lastKnownHash==='#sayvi-video')message('');
  }
  lastKnownHash=location.hash;
 }
 function open({from=null,id=null}={}){
  if(!active()&&location.hash!=='#sayvi-video')
   lastRoute=from==='life'||location.hash==='#life'?'#life'
    :from==='music'||location.hash==='#sayvi-music'?'#sayvi-music':'';
  if(id)choose(core.videoId(id));
  if(location.hash!=='#sayvi-video')location.hash='#sayvi-video';
  else route();
  return true;
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const typed=input.value.trim();
  if(!typed){message('Напишите название видео или вставьте ссылку.');input.focus();return}
  const id=core.videoId(typed);
  if(id){choose(id);play();return;}
  // Official YouTube embedded search was removed. The full in-app catalogue
  // needs a separately authorized Data API integration. Never fake results.
  if(typed.length>120){message('Название слишком длинное. Сократите запрос.');return}
  if(/^(?:https?:|javascript:|data:|www\.)/i.test(typed)){
   message('Это не ссылка на видео YouTube. Проверьте адрес.');return;
  }
  const url='https://www.youtube.com/results?search_query='+encodeURIComponent(typed);
  const searchLink=document.createElement('a');
  searchLink.href=url;searchLink.target='_blank';
  searchLink.rel='noopener noreferrer';
  searchLink.click();
  message('Нашли ролик? В YouTube нажмите «Поделиться → Копировать ссылку», затем вернитесь сюда и вставьте её в это же поле.');
 });
 demo?.addEventListener('click',()=>{choose(SAMPLE);play()});
 back?.addEventListener('click',()=>{
  dispose();
  if(lastRoute==='#life'||lastRoute==='#sayvi-music')location.hash=lastRoute;
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
  message('Видео готово. Нажмите «Смотреть».');
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
