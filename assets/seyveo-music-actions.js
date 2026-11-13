/* SEYVEO Music · explicit Russian voice/text actions on the existing local player.
 * Never claims access to streaming catalogs or iOS hardware volume. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const msg=text=>{const el=$('sayviMusicStatus');if(el){el.textContent=text;el.hidden=false}};
const namePart=s=>String(s||'').replace(/\s+/g,' ').trim().replace(/^[«"']|[»"']$/g,'');
function handle(raw){
 if(typeof raw!=='string'||raw.length>420)return null;
 let q=raw.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/\s+/g,' ').trim()
  .replace(/^(?:сэйви|сейви|сэйва|сейва|сэй|сей|seyveo)[,.!:\s]+/,'').replace(/[!?]+$/,'').trim();
 if(!q)return null;
 const music=window.SEYVEO_MUSIC,audio=$('sayviMusicAudio');
 if(!music||!audio)return null;
 const local=()=>music.state?.().loaded||0;
 let found=q.match(/^(?:(?:найди|найти|отыщи|покажи|поищи)\s+(?:мне\s+)?(?:трек|песню|музыку)\s+)(.+)$/);
 if(found){
  const name=namePart(found[1]),results=music.searchTracks?.(name)||[];
  music.open();
  if(!results.length){
   const message=local()?'Не нашла «'+name+'» среди загруженных аудиофайлов.':'Сначала добавь свои песни в «Моя музыка». Пока внешние каталоги не подключены.';
   msg(message);return {status:'missing',message};
  }
  music.openQueue?.();
  const message=results.length===1?'Нашла «'+results[0].title+'» в твоей музыке. Нажми Play или попроси включить.':'Нашла '+results.length+' подходящих треков. Показываю список.';
  msg(message);return {status:'found',message};
 }
 found=q.match(/^(?:(?:включи|поставь|запусти|проиграй|сыграй)\s+(?:мне\s+)?(?:трек|песню)\s+)(.+)$/);
 if(found){
  const name=namePart(found[1]),result=music.playFromSearch?.(name);
  const message=result?.status==='started'?'Пробую включить «'+(result.track?.title||name)+'».':
   result?.status==='multiple'?'Нашла несколько подходящих песен. Выбери нужную из списка.':
   'Такого трека нет среди загруженных файлов. Сэйви не подключена к музыкальным каталогам.';
  msg(message);return {status:result?.status||'missing',message};
 }
 if(/^(?:(?:включи|запусти|поставь|продолжи)\s+(?:мою\s+)?музык[уауы]|продолжи воспроизведение|играй дальше)$/.test(q)){
  music.open();
  if(!local()){const message='Пока нет загруженных аудиофайлов. Добавь их через «Моя музыка».';msg(message);return{status:'missing',message}}
  if(audio.paused){const action=audio.play();action?.catch?.(()=>msg('Браузер не разрешил воспроизведение. Нажми Play в плеере.'))}
  const message='Запускаю музыку, если браузер разрешит воспроизведение.';
  msg(message);return{status:'requested',message};
 }
 if(/^(?:пауза|поставь (?:музыку )?на паузу|останови музыку|приостанови (?:музыку|воспроизведение))$/.test(q)){
  if(!local())return {status:'missing',message:'Пока нет загруженных треков.'};
  audio.pause();
  const message='Музыка на паузе.';msg(message);return{status:'paused',message};
 }
 if(/^(?:следующ(?:ий|ую) (?:трек|песню)|переключи на следующ(?:ий|ую)|предыдущ(?:ий|ую) (?:трек|песню)|верни предыдущ(?:ий|ую))$/.test(q)){
  const next=!/предыдущ/.test(q),button=$(next?'sayviMusicNext':'sayviMusicPrevious');
  if(!local()||!button||button.disabled){const message='Сейчас нечего переключать.';msg(message);return{status:'unavailable',message}}
  button.click();
  const message=next?'Переключаю на следующий трек.':'Возвращаю предыдущий трек.';
  msg(message);return{status:'requested',message};
 }
 if(/^(?:(?:сделай|убавь|уменьши|прибавь|увеличь)\s+(?:музыку|звук|громкость)\s+(?:тише|громче)?|сделай\s+(?:потише|погромче|тише|громче)|(?:музыку|звук|громкость)\s+(?:потише|погромче|тише|громче)|(?:потише|погромче|тише|громче)\s+(?:музыку|звук|громкость)|(?:тише|громче|потише|погромче))$/.test(q)){
  if(/^(?:тише|громче|потише|погромче|сделай\s+(?:тише|громче|потише|погромче))$/.test(q)&&!music.state?.().playing&&location.hash!=='#sayvi-music')return null;
  const up=/громче|прибавь|увеличь/.test(q)&&!/уменьши/.test(q);
  // iPhone Safari exposes hardware-controlled volume. The website cannot
  // honestly promise to change the user's physical speaker level.
  const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios){
   const message='На iPhone системная громкость управляется боковыми кнопками. Сэйви не может менять её из Safari.';
   msg(message);return {status:'unsupported',message};
  }
  const old=audio.volume,target=Math.max(0,Math.min(1,Math.round((old+(up?.15:-.15))*100)/100));
  if(target===old){
   const message=up?'Громкость плеера уже на максимуме.':'Громкость плеера уже на минимуме.';
   msg(message);return {status:'limit',message};
  }
  try{audio.volume=target}catch{}
  if(Math.abs(audio.volume-target)>.025){
   const message='iPhone не разрешает менять системную громкость из браузера. Используй боковые кнопки. В мобильном SEYVEO сделаем отдельное управление.';
   msg(message);return {status:'unsupported',message};
  }
  const message=(up?'Делаю громче':'Делаю тише')+' в плеере SEYVEO.';
  msg(message);return {status:'changed',message};
 }
 return null;
}
window.SEYVEO_MUSIC_ACTIONS=Object.freeze({handle});
})();