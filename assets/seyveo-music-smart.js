/* SEYVEO Music · quiet smart actions. No uploads, new player or equalizer. */
(function(host,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(host)api.install(host);
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const syncsafe=(b,i)=>((b[i]&127)<<21)|((b[i+1]&127)<<14)|((b[i+2]&127)<<7)|(b[i+3]&127);
 const ascii=(b,i,n)=>String.fromCharCode(...b.subarray(i,i+n));
 const uint=(b,i)=>new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(i);
 function takeText(b,pos,enc){
  const step=enc===1||enc===2?2:1;
  let end=pos;
  while(end+step<=b.length){
   if(b[end]===0&&(step===1||b[end+1]===0))break;
   end+=step;
  }
  let bytes=b.subarray(pos,end),label=enc===0?'windows-1252':enc===3?'utf-8':enc===2?'utf-16be':'utf-16le';
  if(enc===1&&bytes[0]===0xfe&&bytes[1]===0xff)label='utf-16be';
  let text='';try{text=new TextDecoder(label).decode(bytes).replace(/\u0000/g,'').trim()}catch{}
  return {text,next:Math.min(b.length,end+step)};
 }
 function embeddedLyrics(b){
  if(b.length<10||ascii(b,0,3)!=='ID3'||![3,4].includes(b[3])||(b[5]&0xc0))return null;
  const version=b[3],end=Math.min(b.length,10+syncsafe(b,6));let plain=null;
  for(let pos=10;pos+10<=end;){
   const id=ascii(b,pos,4),size=version===4?syncsafe(b,pos+4):uint(b,pos+4);
   if(!/^[A-Z0-9]{4}$/.test(id)||!size||pos+10+size>end)break;
   const flags=b[pos+9],f=b.subarray(pos+10,pos+10+size);pos+=10+size;
   if(flags||f.length<6||f[0]>3)continue;
   const enc=f[0];
   if(id==='SYLT'&&f[4]===2){
    let at=takeText(f,6,enc).next;const lines=[];
    while(at+4<f.length&&lines.length<3000){
     const t=takeText(f,at,enc);at=t.next;if(at+4>f.length)break;
     const time=uint(f,at)/1000;at+=4;
     if(t.text)lines.push({time,text:t.text});
    }
    if(lines.length)return {timed:true,lines:lines.sort((a,b)=>a.time-b.time)};
   }
   if(id==='USLT'){
    const start=takeText(f,4,enc).next;
    const t=takeText(f,start,enc).text;
    if(t)plain={timed:false,lines:t.split(/\r?\n/).map(text=>({text})).filter(x=>x.text.trim())};
   }
  }
  return plain;
 }
 async function readEmbedded(file){
  if(!file?.slice||!/\.mp3$/i.test(file.name))return null;
  const h=new Uint8Array(await file.slice(0,10).arrayBuffer());
  if(h.length!==10||ascii(h,0,3)!=='ID3')return null;
  const size=10+syncsafe(h,6);if(size>2000000||size>file.size)return null;
  return embeddedLyrics(new Uint8Array(await file.slice(0,size).arrayBuffer()));
 }
 function activeLine(lines,time){
  let low=0,high=lines.length-1,answer=-1;
  while(low<=high){const mid=(low+high)>>1;if(lines[mid].time<=time){answer=mid;low=mid+1}else high=mid-1}
  return answer;
 }
 function lyricWindow(lines,index,duration){
  const line=lines[index];if(!line)return null;
  const next=lines[index+1]?.time;
  const wordEnd=Array.isArray(line.words)?line.words.reduce((end,v)=>Number.isFinite(v?.end)?Math.max(end,v.end):end,0):0;
  let end=Number.isFinite(line.end)&&line.end>line.time?Math.max(line.end,wordEnd):wordEnd>line.time?wordEnd:Math.min(line.time+8,Number.isFinite(next)?next:Infinity);
  if(Number.isFinite(next)&&next>line.time)end=Math.min(end,next);
  if(Number.isFinite(duration)&&duration>line.time)end=Math.min(end,duration);
  return {start:line.time,end:Math.max(line.time+.1,end)};
 }
 function lyricGap(lines,time,duration,index=activeLine(lines,time)){
  if(index<0)return lines[0]?.time>time+1?'intro':'';
  const window=lyricWindow(lines,index,duration),next=lines[index+1]?.time;
  return window&&time>window.end+1.25&&(!Number.isFinite(next)||time<next-.15)?'gap':'';
 }
 function draftCoverage(data,duration){
  const lines=Array.isArray(data?.lines)?data.lines:[];
  const sorted=lines.filter(x=>Number.isFinite(x?.time)).slice().sort((a,b)=>a.time-b.time);
  let largest=0,cursor=0,covered=0;
  for(let i=0;i<sorted.length;i++){
   const line=sorted[i],end=lyricWindow(sorted,i,duration)?.end||line.time;
   largest=Math.max(largest,line.time-cursor);
   covered+=Math.max(0,end-Math.max(cursor,line.time));
   cursor=Math.max(cursor,end);
  }
  if(Number.isFinite(duration)&&duration>0)largest=Math.max(largest,duration-cursor);
  return {count:sorted.length,covered,largest};
 }
 function needsDraftReview(data,duration=data?.duration){
  if(!data?.draft||!data.timed||data.userEdited)return false;
  const c=draftCoverage(data,duration);
  return c.count<=2||c.largest>=45||(Number.isFinite(duration)&&duration>=90&&c.count<8)||(!Number.isFinite(duration)&&c.count<8);
 }
 function needsDraftUpgrade(data,target=2){
  return !!(data?.draft&&data.timed&&!data.userEdited&&(data.recognitionVersion||1)<target&&(data.autoReviewVersion||0)<target);
 }
 function preferDraft(old,candidate){
  if(!old?.lines?.length)return candidate;
  if(!old.draft||old.userEdited)return old;
  const duration=candidate?.duration||old.duration;
  const before=draftCoverage(old,duration),after=draftCoverage(candidate,duration);
  if(after.covered>=before.covered*.85&&(after.largest<=before.largest+10||after.count>=before.count*1.5))return candidate.vocalAttempted&&candidate.recognitionVersion!==3?{...candidate,autoReviewVersion:3}:candidate;
  return {...old,autoReviewVersion:candidate.vocalAttempted?3:candidate.recognitionVersion||2,...(Number.isFinite(duration)?{duration}:{})};
 }
 function adjustedLyricTime(time,offset){
  return Math.max(0,time+Math.max(-15,Math.min(15,Number(offset)||0)));
 }
 function sleepMinutes(q){
  const m=q.match(/^(?:выключи|останови|поставь на паузу)\s+музыку\s+через\s+(\d{1,3})\s*(?:минут[уы]?|мин\.?)$/i);
  if(!m)return null;const n=Number(m[1]);return n>=1&&n<=180?n:null;
 }
 function install(w){
  const d=w.document,$=id=>d.getElementById(id),audio=$('sayviMusicAudio'),page=$('sayviMusicPage');
  if(!audio||!page||w.SEYVEO_MUSIC_SMART)return;
  const music=()=>w.SEYVEO_MUSIC;
  const loaded=()=>!!music()?.state?.().loaded&&music().state().trackIndex>=0;
  const notify=t=>{const el=$('sayviMusicStatus');if(el){el.textContent=t;el.hidden=false}};
  const dialog=$('svSmartMusicSheet'),body=$('svSmartMusicBody'),title=$('svSmartMusicTitle');
  const karaokePanel=$('svInlineKaraoke'),karaokeBody=$('svInlineKaraokeBody'),karaokeSettings=$('svInlineKaraokeSettings'),karaokeTools=$('svInlineKaraokeTools');
  let lyricAbort=null,lyricFile=null,lyricGeneration=0,lyricsActive=false,lyricOffset=0;
  let activeWords=[],lyricRows=[],lastLyricTime=-1,lyricScrollTarget=null,lyricScrollDeadline=0,lyricWatch=0,lastGap='',lyricDebug=false,lyricDebugAt=0;
  function cancelLyric(){lyricAbort?.abort();lyricAbort=null}
  const close=()=>{cancelRecognition();if(dialog?.open)dialog.close();++generation;mode=''};
  let generation=0,mode='',lyricData=null,current=-2,deadline=0,timer=0,originalVolume=null;
  function show(label,kind){
   if(!dialog||!body)return false;
   if(kind!=='recognize')cancelRecognition();
   ++generation;mode=kind;dialog.dataset.musicSheet=kind;title.textContent=label;body.replaceChildren();
   if(!dialog.open){try{dialog.showModal()}catch{return false}}return true;
  }
  function message(t){const p=d.createElement('p');p.className='sv-smart-music-message';p.textContent=t;body.append(p);return p}
  function action(label,fn){const b=d.createElement('button');b.type='button';b.className='sv-smart-music-choice';b.textContent=label;b.addEventListener('click',fn);body.append(b);return b}
  $('svSmartMusicClose')?.addEventListener('click',close);
  dialog?.addEventListener('close',()=>{++generation;mode='';delete dialog.dataset.musicSheet});
  dialog?.addEventListener('click',e=>{if(e.target===dialog)close()});
  d.addEventListener('seyveo:music-view',e=>{if(e.detail?.view!=='player'&&dialog?.open)close()});
  let recognitionCancel=null,recognitionApproved=false;
  function cancelRecognition(){const cancel=recognitionCancel;recognitionCancel=null;cancel?.()}
  dialog?.addEventListener('close',cancelRecognition);
  w.addEventListener('pagehide',cancelLyric);
  w.addEventListener('pagehide',cancelRecognition);
  d.addEventListener('visibilitychange',()=>{if(d.hidden&&mode==='recognize'){cancelRecognition();close()}});
  function updateRecognitionIndex(){
   const status=$('svRecognitionIndexStatus'),button=$('svRecognitionStart'),engine=w.SEYVEO_MUSIC_FINGERPRINT;
   if(!status||!button||mode!=='recognize')return;
   const s=engine?.state();
   status.textContent=!s?.supported?'Анализ звука недоступен на этом устройстве.':
    !s.total?'Добавьте песни в свою медиатеку.':
    'Изучено '+s.indexed+' из '+s.total+' · '+(s.busy?'Анализирую музыку…':'Индекс на устройстве')+(s.failed?' · Не прочитано: '+s.failed:'')+(s.total>s.limit?' · Лимит первой версии: '+s.limit:'')+(!s.storage?' · Без сохранения индекса':'');
   button.disabled=!s?.indexed;
  }
  d.addEventListener('seyveo:music-fingerprint',updateRecognitionIndex);
  d.addEventListener('seyveo:music-library',updateRecognitionIndex);
  function recognitionSheet(quick=false){
   cancelRecognition();
   if(!show('Распознать музыку','recognize'))return;
   const version=generation;
   message('Сэйви узнаёт композиции из вашей медиатеки.');
   message('До 10 секунд звука с вашего разрешения. Анализ на устройстве, без передачи записи в интернет.');
   const engine=w.SEYVEO_MUSIC_FINGERPRINT;
   if(!w.isSecureContext||!w.navigator.mediaDevices?.getUserMedia||!w.MediaRecorder){message('Микрофон недоступен в этом браузере.');return}
   // First use keeps explicit consent; subsequent quick taps can start immediately.
   if(quick===true&&recognitionApproved&&engine?.state().indexed){recordRecognition(version);return}
   const status=message('Готовлю музыкальный индекс…');status.id='svRecognitionIndexStatus';
   const startButton=action('Начать распознавание',()=>{recognitionApproved=true;recordRecognition(version)});startButton.id='svRecognitionStart';
   updateRecognitionIndex();engine?.schedule();
   message('Новые песни изучаются автоматически, пока музыка на паузе и приложение открыто.');
  }
  async function recordRecognition(version){
   if(version!==generation||mode!=='recognize')return;
   cancelRecognition();body.replaceChildren();
   const engine=w.SEYVEO_MUSIC_FINGERPRINT;if(!engine?.state().indexed){message('Сначала дождитесь создания музыкального индекса.');action('Назад',recognitionSheet);return}
   engine.setListening(true);
   const valid=()=>version===generation&&mode==='recognize'&&dialog?.open&&!cancelled;
   let stream=null,recorder=null,timer=0,cancelled=false;
   const controller=new AbortController();
   function release(){if(timer){w.clearTimeout(timer);timer=0}stream?.getTracks().forEach(t=>t.stop());stream=null}
   recognitionCancel=()=>{cancelled=true;controller.abort();if(recorder&&recorder.state!=='inactive'){try{recorder.stop()}catch{}}release();engine.setListening(false)};
   // Explicit start also stops our own audio, so the microphone can hear
   // the external source. Never automatically resume or restart the mic.
   if(!audio.paused)audio.pause();
   message('Разрешите доступ к микрофону.');
   try{
    stream=await w.navigator.mediaDevices.getUserMedia({audio:true,video:false});
    if(!valid()){release();return}
    const options=['audio/mp4','audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/webm'].find(t=>w.MediaRecorder.isTypeSupported?.(t));
    recorder=new w.MediaRecorder(stream,options?{mimeType:options}:undefined);
    const chunks=[];let size=0;
    recorder.ondataavailable=e=>{if(e.data.size){size+=e.data.size;if(size<=2*1024*1024)chunks.push(e.data)}};
    recorder.onerror=()=>{if(valid()){body.replaceChildren();message('Не удалось записать звук.');action('Повторить',recognitionSheet)}cancelRecognition()};
    recorder.onstop=async()=>{
     release();
     if(!valid())return;
     body.replaceChildren();message('Сэйви ищет песню…');
     try{
      const blob=new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'audio/webm'});
      if(!blob.size||size>2*1024*1024)throw Error('clip');
      const data={result:await engine.recognize(blob,{signal:controller.signal})};if(!valid())return;
      body.replaceChildren();
      if(!data.result){message('Не нашла уверенного совпадения в вашей медиатеке. Попробуйте ближе к источнику музыки.')}
      else{
       const name=d.createElement('strong');name.className='sv-adaptive-tagline';name.textContent=data.result.title;body.append(name);message(data.result.artist);
       if(data.result.album)message(data.result.album);
       action('Включить песню',()=>{const items=music()?.recognitionLibrary?.()||[];const i=items.findIndex(x=>x.id===data.result.id);if(i<0){message('Песня удалена из медиатеки.');return}close();music()?.playIndexFromSearch?.(i)});
       action('Копировать название',async()=>{try{await w.navigator.clipboard.writeText(data.result.artist+' — '+data.result.title);message('Скопировано.')}catch{message('Не удалось скопировать.')}});
      }
      action('Распознать ещё',recognitionSheet);
     }catch{if(valid()){body.replaceChildren();message('Не удалось прочитать или сравнить запись.');action('Повторить',recognitionSheet)}}
     finally{if(valid()){recognitionCancel=null;engine.setListening(false)}}
    };
    recorder.start();body.replaceChildren();message('Слушаю музыку… До 10 секунд.');
    action('Отменить',()=>{cancelRecognition();close()});
    timer=w.setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();release()},10000);
   }catch{release();if(valid()){engine.setListening(false);recognitionCancel=null;body.replaceChildren();message('Нет доступа к микрофону или формат записи не поддерживается.');action('Повторить',recognitionSheet)}}
  }
  $('svMusicRecognizeHome')?.addEventListener('click',recognitionSheet);
  $('svMusicRecognizeQuick')?.addEventListener('click',()=>recognitionSheet(true));
  function shareData(){
   if(!loaded())return null;
   const name=$('sayviMusicTrack')?.textContent?.trim()||'Музыка';
   const artist=$('sayviMusicArtist')?.textContent?.trim()||'';
   return {title:name,text:[name,artist==='Моя музыка'?'':artist].filter(Boolean).join(' — ')+'\nSEYVEO Music'};
  }
  function share(){
   const data=shareData();if(!data){notify('Сначала включите песню или радио.');return false}
   if(!show('Поделиться музыкой','share'))return false;
   const glyph=path=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
   const row=d.createElement('div');row.className='sv-share-track';
   const art=d.createElement('div');art.className='sv-share-art';art.setAttribute('aria-hidden','true');
   const original=$('sayviMusicArtwork'),image=original&&!original.hidden?w.getComputedStyle(original).backgroundImage:'none';
   if(image&&image!=='none'&&image.startsWith('url('))art.style.backgroundImage=image;
   else art.innerHTML=glyph('<path d="M9 18V5l12-2v13"/><ellipse cx="6" cy="18" rx="3" ry="2.4"/><ellipse cx="18" cy="16" rx="3" ry="2.4"/>');
   const meta=d.createElement('div');meta.className='sv-share-meta';
   const track=d.createElement('strong');track.textContent=data.title;meta.append(track);
   const artist=$('sayviMusicArtist')?.textContent?.trim();if(artist&&artist!=='Моя музыка'){const el=d.createElement('span');el.textContent=artist;meta.append(el)}
   const brand=d.createElement('small');brand.textContent='SEYVEO Music';meta.append(brand);row.append(art,meta);body.append(row);
   const choice=(label,path,fn)=>{const button=action(label,fn);const span=d.createElement('span');span.textContent=label;button.innerHTML=glyph(path);button.append(span);return button};
   if(w.navigator.share)choice('Поделиться названием','<path d="M12 15V3m-4 4 4-4 4 4M7 10H5v11h14V10h-2"/>',async()=>{try{await w.navigator.share(data);close()}catch(e){if(e.name!=='AbortError')message('Не удалось открыть системное меню.')}});
   choice('Копировать название','<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',async()=>{try{await w.navigator.clipboard.writeText(data.text);close();notify('Название скопировано.')}catch{message('Не удалось скопировать. Выделите текст вручную.')}});
   const file=music()?.rhythmFile?.();let canShareFile=false;
   try{canShareFile=!!file&&!!w.navigator.share&&!!w.navigator.canShare?.({files:[file]})}catch{}
   if(canShareFile)choice('Отправить аудиофайл','<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10l-7-7Zm0 0v7h7M12 16v-4l4-1v4"/><ellipse cx="10.5" cy="16.5" rx="1.5" ry="1.2"/><ellipse cx="14.5" cy="15.5" rx="1.5" ry="1.2"/>',async()=>{
    if(music()?.rhythmFile?.()!==file){message('Песня изменилась. Откройте меню заново.');return}
    try{await w.navigator.share({files:[file],title:data.title});close()}catch(e){if(e.name!=='AbortError')message('Не удалось отправить файл.')}
   });
   message(canShareFile?'Отправляйте только файлы, которыми имеете право делиться.':'Отправка файла не поддерживается на этом устройстве. Название можно скопировать.');
   return true;
  }
  function restoreVolume(){w.SEYVEO_ADAPTIVE_SOUND?.setFade(1);if(originalVolume!==null){try{audio.volume=originalVolume}catch{}originalVolume=null}}
  function cancelSleep(){deadline=0;w.clearInterval(timer);timer=0;restoreVolume();syncSleep()}
  function syncSleep(){
   const b=$('svSmartSleepLabel');if(b)b.textContent=deadline?'Таймер сна · '+Math.max(1,Math.ceil((deadline-Date.now())/60000))+' мин':'Таймер сна';
  }
  function tick(){
   if(!deadline)return;
   const left=deadline-Date.now();
   if(left<=0){audio.pause();cancelSleep();notify('Таймер сна: музыка остановлена.');return}
   // Safari may ignore software volume changes; pause still occurs.
   if(left<=5000&&!audio.paused){
    if(w.SEYVEO_ADAPTIVE_SOUND){w.SEYVEO_ADAPTIVE_SOUND.setFade(left/5000)}else{
     if(originalVolume===null)originalVolume=audio.volume;
     try{audio.volume=Math.max(0,originalVolume*left/5000)}catch{}
    }
   }
   syncSleep();
  }
  function setSleep(minutes){
   if(!Number.isFinite(minutes)||minutes<1||minutes>180)return false;
   cancelSleep();deadline=Date.now()+minutes*60000;timer=w.setInterval(tick,250);syncSleep();return true;
  }
  function sleepSheet(){
   if(!show('Таймер сна','sleep'))return;
   message(deadline?'Осталось '+Math.max(1,Math.ceil((deadline-Date.now())/60000))+' мин.':'Музыка остановится автоматически. В фоне работа зависит от браузера.');
   for(const n of [15,30,45,60,90])action(n+' мин',()=>{setSleep(n);close();notify('Музыка остановится через '+n+' мин.')});
   if(deadline)action('Отменить таймер',()=>{cancelSleep();close();notify('Таймер сна отключён.')});
  }
  d.addEventListener('visibilitychange',tick);w.addEventListener('pageshow',tick);
  $('sayviMusicStopAndHide')?.addEventListener('click',cancelSleep);
  function setLyricSettings(open){
   if(!karaokeSettings||!lyricsActive)return;
   karaokeSettings.hidden=!open;karaokeTools?.setAttribute('aria-expanded',String(open));
   if(open)$('svInlineKaraokeCloseSettings')?.focus({preventScroll:true});
   karaokeBody.inert=open;
  }
  function exitKaraoke(){
   w.clearInterval(lyricWatch);lyricWatch=0;lastGap='';
   cancelLyric();++lyricGeneration;lyricsActive=false;lyricData=null;lyricFile=null;current=-2;
   stopLyricFrame();activeWords=[];lyricRows=[];lastLyricTime=-1;
   page.classList.remove('sv-karaoke-active');if(karaokePanel){karaokePanel.inert=true;karaokePanel.hidden=true;}
   if(karaokeSettings)karaokeSettings.hidden=true;
   if(karaokeBody)karaokeBody.inert=false;
   karaokeTools?.setAttribute('aria-expanded','false');
   $('svNowKaraoke')?.setAttribute('aria-pressed','false');
   $('sayviMusicStage')?.setAttribute('aria-label','Обложка текущей песни');
   scheduleLibraryLyrics(1000);
  }
  function toggleKaraoke(){if(lyricsActive)exitKaraoke();else karaoke()}
  karaokeTools?.addEventListener('click',()=>setLyricSettings(karaokeSettings.hidden));
  $('svInlineKaraokeCloseSettings')?.addEventListener('click',()=>setLyricSettings(false));
  d.addEventListener('seyveo:music-view',e=>{if(e.detail?.view!=='player'&&lyricsActive)exitKaraoke()});
  page.addEventListener('keydown',e=>{if(e.key==='Escape'&&lyricsActive&&!dialog?.open){e.preventDefault();if(!karaokeSettings.hidden)setLyricSettings(false);else exitKaraoke()}});
  async function karaoke(){
   if(!karaokePanel||!karaokeBody||!karaokeSettings||page.dataset.musicView!=='player')return;
   const file=music()?.rhythmFile?.();
   cancelLyric();++lyricGeneration;lyricsActive=true;lyricData=null;current=-2;lyricFile=file;
   stopLyricFrame();activeWords=[];lyricRows=[];lastLyricTime=-1;lastGap='';
   if(!lyricWatch)lyricWatch=w.setInterval(checkLyricClock,100);
   page.classList.add('sv-karaoke-active');karaokePanel.hidden=false;karaokePanel.inert=false;
   $('svNowKaraoke')?.setAttribute('aria-pressed','true');
   $('sayviMusicStage')?.setAttribute('aria-label','Текст текущей песни');
   setLyricSettings(false);
   const body=karaokeBody,settings=$('svInlineKaraokeOptions');
   let lyricSize='normal';try{const v=w.localStorage.getItem('seyveo.lyric-size');if(['small','normal','large'].includes(v))lyricSize=v}catch{}
   body.dataset.lyricSize=lyricSize;
   body.replaceChildren();settings.replaceChildren();body.classList.remove('has-timed-lyrics','is-lyric-gap');body.scrollTop=0;
   if(karaokeTools)karaokeTools.disabled=true;
   $('svInlineKaraokeLabel').textContent='ТЕКСТ ПЕСНИ';
   paintLyricDebug(true);
   const message=(t,target=body)=>{const p=d.createElement('p');p.className='sv-smart-music-message';p.textContent=t;target.append(p);return p};
   const action=(label,fn,target=body)=>{const b=d.createElement('button');b.type='button';b.className='sv-smart-music-choice';b.textContent=label;b.addEventListener('click',fn);target.append(b);return b};
   if(!file){message('Текст доступен для песен из медиатеки.');return}
   const version=lyricGeneration,valid=()=>version===lyricGeneration&&lyricsActive&&music()?.rhythmFile?.()===file;
   const engine=w.SEYVEO_LYRICS,id=music()?.recognitionLibrary?.().find(x=>x.file===file)?.id;
   lyricOffset=0;try{if(id)lyricOffset=Math.max(-15,Math.min(15,Number(w.localStorage.getItem('seyveo-lyric-offset:'+id))||0))}catch{}
   message('Ищем текст песни…');
   let result=null,attached=false;
   try{result=await engine?.get(id);attached=!!result;if(!result)result=await readEmbedded(file)}catch{}
   if(!valid())return;
   body.replaceChildren();
   const render=(data,imported,saved=true)=>{
    if(!valid())return;
    body.replaceChildren();settings.replaceChildren();setLyricSettings(false);current=-2;lyricData=null;activeWords=[];lyricRows=[];lastLyricTime=-1;stopLyricFrame();
    body.classList.toggle('has-timed-lyrics',!!data?.timed);body.classList.remove('is-lyric-gap');lastGap='';
    if(karaokeTools)karaokeTools.disabled=!data;
    $('svInlineKaraokeLabel').textContent=data?.draft?'ТЕКСТ · ЧЕРНОВИК':'ТЕКСТ ПЕСНИ';
    let autoStart=null;
    if(data){
     if(data.timed){
      const lines=data.lines.filter(line=>Number.isFinite(line?.time)&&line.time>=0).slice().sort((a,b)=>a.time-b.time);
      if(lines.length)data={...data,lines};else data={...data,timed:false};
     }
     lyricData={...data,file};lastGap='';
     if(data.draft&&data.timed)message('Если во время вокала появляются паузы без текста, часть слов могла не распознаться.',settings);
     if(data.draft)message('Черновик Сэйви · возможны ошибки',settings);
     if(!data.timed)message('Текст без временных меток.',settings);
     if(needsDraftReview(data,audio.duration))message('Текст неполный: есть большие промежутки без распознанных слов.',settings);
     if(data.vocalMode==='separated')message('Вокал отделён локально перед распознаванием.',settings);
     if(needsDraftUpgrade(data))message('Сэйви автоматически уточнит старый черновик, когда музыка будет на паузе.',settings);
     if(data.timed&&data.lines.some(line=>line.text?.trim()&&!wordTiming(line))){
      message('Для строк без меток слов подсветка приблизительная.',settings);
      if(data.draft&&engine&&id&&['localhost','127.0.0.1'].includes(w.location.hostname))
       action('Уточнить синхронизацию слов',()=>{if(valid())render(null,false)},settings);
     }
     if(data.draft&&data.timed&&data.lines.every(line=>!line.text?.trim()||wordTiming(line))&&engine&&id&&['localhost','127.0.0.1'].includes(w.location.hostname))
      action('Повторить распознавание текста',()=>{if(valid())render(null,false)},settings);
     if(data.timed){
      const offsetBox=d.createElement('div');offsetBox.className='sv-lyric-offset';
      const label=d.createElement('p');label.textContent='Синхронизация этой песни';
      const value=d.createElement('output');value.setAttribute('aria-live','polite');
      const controls=d.createElement('div');controls.className='sv-lyric-offset-controls';
      const setOffset=delta=>{
       if(!valid())return;
       lyricOffset=Math.round(Math.max(-15,Math.min(15,delta))*10)/10;
       try{if(id)w.localStorage.setItem('seyveo-lyric-offset:'+id,String(lyricOffset))}catch{}
       value.textContent=(lyricOffset>0?'+':'')+lyricOffset.toFixed(1)+' с';
       updateLine(true);paintLyricDebug(true);
      };
      for(const [caption,aria,adjust] of [['−','Показать текст позже',()=>lyricOffset-.5],['0','Сбросить поправку',()=>0],['+','Показать текст раньше',()=>lyricOffset+.5]]){
       const button=d.createElement('button');button.type='button';button.textContent=caption;button.setAttribute('aria-label',aria);button.addEventListener('click',()=>setOffset(adjust()));controls.append(button);
      }
      offsetBox.append(label,value,controls);settings.append(offsetBox);
      message('Если текст отстаёт, нажмите «+». Если опережает — «−». Поправка запоминается для этой песни.',settings);
      value.textContent=(lyricOffset>0?'+':'')+lyricOffset.toFixed(1)+' с';
     }
     const sizeRow=d.createElement('label');sizeRow.className='sv-lyric-size-row';sizeRow.textContent='Размер текста';
     const sizeSelect=d.createElement('select');sizeSelect.setAttribute('aria-label','Размер текста песни');
     for(const [key,label] of [['small','Меньше'],['normal','Обычный'],['large','Крупнее']]){const opt=d.createElement('option');opt.value=key;opt.textContent=label;sizeSelect.append(opt)}
     sizeSelect.value=lyricSize;sizeRow.append(sizeSelect);settings.append(sizeRow);
     sizeSelect.addEventListener('change',()=>{if(!valid())return;lyricSize=sizeSelect.value;body.dataset.lyricSize=lyricSize;try{w.localStorage.setItem('seyveo.lyric-size',lyricSize)}catch{}updateLine(true)});
     action(lyricDebug?'Скрыть диагностику':'Диагностика синхронизации',()=>{lyricDebug=!lyricDebug;setLyricSettings(false);paintLyricDebug(true)},settings);
     if(!saved)message('Текст доступен до закрытия страницы: хранилище недоступно.',settings);
     const save=d.createElement('button');save.type='button';save.className='sv-smart-music-choice';
     save.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 3v18M3 7h4M3 12h4M3 17h4M11 8h6M11 12h6M11 16h4"/></svg><span>В блокнот</span>';
     settings.append(save);
     const feedback=d.createElement('p');feedback.className='sv-lyrics-feedback';feedback.setAttribute('role','status');feedback.hidden=true;settings.append(feedback);
     const copy=action('Копировать текст',async()=>{
      if(!valid())return;
      try{await w.navigator.clipboard.writeText(data.lines.map(line=>line.text).join('\n'));if(valid()){feedback.hidden=false;feedback.textContent='Текст скопирован.'}}
      catch{if(valid()){feedback.hidden=false;feedback.textContent='Не удалось скопировать текст.'}}
     },settings);
     copy.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg><span>Копировать текст</span>';
     settings.insertBefore(copy,save);
     save.addEventListener('click',()=>{
      if(!valid())return;
      const title=$('sayviMusicTrack')?.textContent?.trim()||'Текст песни';
      const artist=$('sayviMusicArtist')?.textContent?.trim();
      const text=[title,artist&&artist!=='Моя музыка'?artist:'',data.lines.map(line=>line.text).join('\n')].filter(Boolean).join('\n\n');
      const saved=w.SEYVEO_MUSIC_NOTE?.save(text);
      feedback.hidden=false;
      feedback.textContent=saved?.ok?(saved.existing?'Этот текст уже есть в блокноте.':'Текст сохранён в блокноте. Музыка продолжает играть.'):(saved?.reason==='length'?'Текст длиннее лимита одной заметки (8000 символов).':saved?.reason==='limit'?'Блокнот заполнен. Освободите место для новой записи.':'Не удалось сохранить текст в блокноте.');
     });
     if(engine&&id)action('Исправить текст',()=>{
      if(!valid())return;
      settings.replaceChildren();
      message(data.timed?'Исправьте слова, не меняя количество строк: время каждой строки сохранится.':'Исправьте текст песни.',settings);
      const editor=d.createElement('textarea');editor.className='sv-inline-lyrics-editor';editor.setAttribute('aria-label','Текст песни');editor.value=data.lines.map(line=>line.text).join('\n');settings.append(editor);
      const status=message('',settings);status.setAttribute('role','status');
      const commit=action('Сохранить изменения',async()=>{
       if(!valid())return;
       const lines=editor.value.replace(/\r/g,'').split('\n');
       if(editor.value.length>128*1024||!lines.some(line=>line.trim())||lines.length>3000){status.textContent='Проверьте размер и содержимое текста.';return}
       if(data.timed&&lines.length!==data.lines.length){status.textContent='Для сохранения синхронизации оставьте прежнее количество строк.';return}
       const corrected={...data,userEdited:true,lines:data.timed?data.lines.map((line,i)=>({...line,text:lines[i],words:lines[i]===line.text?line.words:undefined})):lines.map(text=>({text}))};
       commit.disabled=true;
       try{const saved=await engine.put(id,corrected);if(valid())render(corrected,true,saved)}catch{if(valid()){status.textContent='Не удалось сохранить исправления.';commit.disabled=false}}
      },settings);
      action('Отмена',()=>{if(valid()){render(data,imported,saved);setLyricSettings(true)}},settings);
      editor.focus({preventScroll:true});
     },settings);
     const fragment=d.createDocumentFragment();
     data.lines.forEach((line,i)=>{
      const el=d.createElement(data.timed?'button':'p');el.className='sv-smart-lyric';
      const words=[];
      if(data.timed&&line.text?.trim()){
       const exact=wordTiming(line);
       const parts=exact?exact.map(v=>v.text):line.text.trim().split(/\s+/);
       const end=lyricWindow(data.lines,i,audio.duration)?.end||line.time+4;
       const length=parts.reduce((sum,v)=>sum+Math.max(1,v.length),0);let cursor=0;
       parts.forEach((part,j)=>{
        if(j)el.append(d.createTextNode(' '));
        const span=d.createElement('span');span.className='sv-lyric-word';span.textContent=part;el.append(span);
        const weight=Math.max(1,part.length);
        const start=exact?exact[j].start:line.time+(end-line.time)*cursor/length;
        cursor+=weight;
        const finish=exact?exact[j].end:line.time+(end-line.time)*cursor/length;
        words.push({span,start,end:finish,last:-1});
       });
      }else el.textContent=line.text||'♪';
      if(data.timed){el.type='button';el.addEventListener('click',()=>{if(valid()&&Number.isFinite(audio.duration))audio.currentTime=Math.max(0,Math.min(line.time-lyricOffset,audio.duration))})}
      fragment.append(el);lyricRows.push({el,words});
     });
     body.append(fragment);
    }else {
     const local=['localhost','127.0.0.1'].includes(w.location.hostname);
     if(local&&engine&&id){
      let status=null;
      function progress(text){if(!status){status=message(text);status.setAttribute('role','status')}else status.textContent=text;return status}
      const start=action('Повторить распознавание',async()=>{
       if(!valid()||lyricAbort)return;
       pauseLibraryLyrics();
       const ext=(file.name.match(/\.([^.]+)$/)||[])[1]?.toLowerCase();
       const type=({mp3:'audio/mpeg',m4a:'audio/mp4',aac:'audio/aac',wav:'audio/wav',flac:'audio/flac',ogg:'audio/ogg',opus:'audio/opus',aiff:'audio/aiff',aif:'audio/aiff'})[ext]||file.type;
       if(file.size>25*1024*1024){progress('Для автоматического анализа нужна песня до 25 МБ.');return}
       if(!type?.startsWith('audio/')){progress('Формат песни не поддерживается.');return}
       const controller=new AbortController();lyricAbort=controller;
       const job=Array.from(w.crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
       let pollTimer=0,done=false;
       start.disabled=true;start.hidden=true;progress('Сэйви готовит текст песни…');
       const meter=d.createElement('progress');meter.className='sv-lyrics-progress';meter.max=100;meter.setAttribute('aria-label','Обработанная часть песни');status.after(meter);
       const showProgress=(phase,percent)=>{
        const labels={receiving:'Подготавливаю песню…',checking:'Проверяю аудиофайл…',loading:'Загружаю локальную модель…',separating:'Отделяю голос от музыки',decoding:'Разбираю вокал',finishing:'Подготавливаю текст…',complete:'Распознавание завершено'};
        if(Number.isFinite(percent)){meter.value=percent;progress((labels[phase]||'Анализ песни')+' · '+percent+'%')}else{meter.removeAttribute('value');progress(labels[phase]||'Сэйви готовит песню…')}
       };
       const poll=async()=>{
        if(done||!valid()||controller.signal.aborted)return;
        try{const response=await w.fetch('/api/seyveo-music-lyrics-status?job='+job,{cache:'no-store',signal:controller.signal});const data=await response.json();if(!done&&valid()&&!controller.signal.aborted&&response.ok&&data.progress)showProgress(data.progress.phase,data.progress.percent)}catch{}
        if(!done&&valid()&&!controller.signal.aborted)pollTimer=w.setTimeout(poll,1000);
       };
       const cancel=action('Отменить анализ',()=>controller.abort());
       try{
        const upgrade='Запущена старая версия сервера. Обновите проект из GitHub, остановите сервер (Ctrl+C) и снова запустите server/start-real-seyveo.cmd. Затем обновите страницу.';
        // A previous song may still be releasing the single local Whisper worker.
        for(let attempt=0;;attempt++){
         if(!valid()||controller.signal.aborted)return;
         const check=await w.fetch('/api/seyveo-music-lyrics-status',{cache:'no-store',signal:controller.signal});
         if(check.status===404)throw Error(upgrade);
         const readiness=await check.json().catch(()=>null);
         if(!check.ok||readiness?.protocol!==2)throw Error(upgrade);
         if(!readiness.pythonConfigured)throw Error('Локальный Whisper не установлен. Запустите server/install-note-transcription.cmd, затем перезапустите SEYVEO.');
         if(!readiness.busy)break;
         if(attempt>=9)throw Error('Локальный движок занят другой записью. Повторите позже.');
         progress('Освобождаю локальный движок…');
         await new Promise(resolve=>w.setTimeout(resolve,700));
        }
        if(!valid()||controller.signal.aborted)return;
        showProgress('receiving',null);pollTimer=w.setTimeout(poll,500);
        const response=await w.fetch('/api/seyveo-music-lyrics',{method:'POST',headers:{'content-type':type,'x-seyveo-lyric-job':job},body:file,signal:controller.signal});
        if(response.status===404)throw Error(upgrade);
        const data=await response.json().catch(()=>({}));if(!valid()||controller.signal.aborted)return;
        if(!response.ok||!data.lines?.length)throw Error(data.error||'Текст не определён.');
        done=true;showProgress('complete',100);
        const old=await engine.get(id);
        const previous=old?.draft?draftCoverage(old,audio.duration):null;
        const candidate=draftCoverage(data,audio.duration);
        if(previous&&candidate.covered<previous.covered*.85){
         if(valid())render(old,true);return;
        }
        if(data.vocalAttempted&&data.recognitionVersion!==3)data.autoReviewVersion=3;
        const saved=await engine.put(id,data);
        lyricReview.delete(id);lyricReady.delete(id);
        if(needsDraftReview(data,audio.duration))lyricReview.add(id);else lyricReady.add(id);
        if(valid()&&!controller.signal.aborted)render(data,true,saved);
       }catch(error){if(valid())status.textContent=controller.signal.aborted?'Анализ отменён.':String(error.message||'Анализ недоступен.')}
       finally{done=true;w.clearTimeout(pollTimer);meter.remove();if(lyricAbort===controller)lyricAbort=null;if(valid()){start.disabled=false;start.hidden=false;cancel.remove()}}
      });
      start.hidden=true;autoStart=start;
     }else message('Автоматическое распознавание пока доступно в локальной версии на компьютере. Добавьте готовый текст песни.');
    }
    if(engine&&id){
     const input=d.createElement('input');input.type='file';input.accept='.lrc,.txt,text/plain';input.hidden=true;(data?settings:body).append(input);
     input.addEventListener('change',async()=>{
      const selected=input.files?.[0];if(!selected||!valid())return;
      try{
       const parsed=await engine.read(selected);if(!valid())return;
       if(!parsed){message('Не удалось прочитать текст. Выберите LRC или TXT до 128 КБ.');return}
       cancelLyric();
       const saved=await engine.put(id,parsed);if(valid())render(parsed,true,saved);
      }catch{if(valid())message('Не удалось загрузить текст.')}
     });
     action(data?'Заменить текст':'Добавить текст песни',()=>input.click(),data?settings:body);
     if(imported)action('Удалить добавленный текст',async()=>{if(!valid())return;const removed=await engine.remove(id);if(valid()){if(removed)karaoke();else message('Не удалось удалить сохранённый текст.',settings)}},settings);
    }
    if(data?.timed){
     // Use actual viewport height for the final lines, even in compact players.
     body.style.setProperty('--sv-lyric-tail',Math.ceil(body.clientHeight*.65)+'px');
     w.requestAnimationFrame(()=>{if(valid()&&lyricData)updateLine(true)});
    }
    updateLine(true);paintLyricDebug(true);scheduleLibraryLyrics(1500);
    if(autoStart&&valid()&&!lyricAbort){autoStart.click();if(!lyricAbort)autoStart.hidden=false}
   };
   render(result,attached);
  }
  function wordTiming(line){
   const words=line.words;
   if(!Array.isArray(words)||!words.length)return null;
   const norm=s=>String(s||'').replace(/\s+/g,'');
   if(words.some(v=>!v?.text||!Number.isFinite(v.start)||!Number.isFinite(v.end)||v.end<=v.start)||norm(words.map(v=>v.text).join(''))!==norm(line.text))return null;
   return words;
  }
  function stopLyricFrame(){lyricScrollTarget=null;lyricScrollDeadline=0}
  function alignLyric(row,instant){
   const height=karaokeBody.clientHeight;
   if(!row||!height)return;
   const viewport=karaokeBody.getBoundingClientRect(),rect=row.getBoundingClientRect();
   const top=Math.max(0,Math.min(karaokeBody.scrollHeight-height,karaokeBody.scrollTop+rect.top-viewport.top+rect.height/2-height*.43));
   lyricScrollTarget=Math.round(top);
   lyricScrollDeadline=w.performance.now()+700;
   if(instant||w.matchMedia?.('(prefers-reduced-motion: reduce)').matches||audio.paused||!karaokeBody.scrollTo){
    karaokeBody.scrollTop=lyricScrollTarget;lyricScrollDeadline=0;
   }else karaokeBody.scrollTo({top:lyricScrollTarget,behavior:'smooth'});
  }
  function paintLyricDebug(force=false){
   const el=$('svInlineKaraokeDebug');if(!el)return;
   el.hidden=!lyricDebug;
   if(!lyricDebug)return;
   const now=w.performance.now();if(!force&&now-lyricDebugAt<500)return;lyricDebugAt=now;
   const fmt=n=>Number.isFinite(n)?n.toFixed(1):'—';
   const lines=lyricData?.lines||[],line=lines[current],next=lines[current+1];
   el.textContent='V31 · ASR '+(lyricData?.draft?String(lyricData.recognitionVersion||1):'—')+(lyricData?.vocalMode==='separated'?' · вокал':'')+' · сдвиг '+fmt(lyricOffset)+' с · аудио '+fmt(audio.currentTime)+' с · '+(audio.paused?'пауза':'играет')+' · '+(lyricData?.timed?'строка '+(current+1)+'/'+lines.length:'нет меток')+' · метки '+fmt(line?.time)+' → '+fmt(next?.time)+' с · прокрутка '+Math.round(karaokeBody.scrollTop)+'/'+(lyricScrollTarget??'—')+(lastGap?' · разрыв меток':'');
  }
  function checkLyricClock(){
   if(!lyricsActive)return;
   if(music()?.rhythmFile?.()!==lyricFile){void karaoke();return}
   if(lyricData?.timed){
    updateLine();
    if(lyricScrollTarget!==null&&lyricScrollDeadline&&w.performance.now()>=lyricScrollDeadline){
     if(Math.abs(karaokeBody.scrollTop-lyricScrollTarget)>3)karaokeBody.scrollTop=lyricScrollTarget;
     lyricScrollDeadline=0;
    }
   }
   paintLyricDebug();
  }
  function updateLine(immediate=false){
   if(!lyricsActive||!lyricData?.timed||!karaokeBody||music()?.rhythmFile?.()!==lyricData.file)return;
   const time=adjustedLyricTime(audio.currentTime,lyricOffset);if(!Number.isFinite(time))return;
   const seek=immediate===true||Math.abs(time-lastLyricTime)>1.2;
   lastLyricTime=time;
   const next=activeLine(lyricData.lines,time);
   const gap=lyricGap(lyricData.lines,time,audio.duration,next);
   if(gap!==lastGap){
    lastGap=gap;
    $('svInlineKaraokeLabel').textContent=gap==='intro'?'ОЖИДАНИЕ ТЕКСТА':gap==='gap'?'ПАУЗА В ТЕКСТЕ':lyricData.draft?'ТЕКСТ · ЧЕРНОВИК':'ТЕКСТ ПЕСНИ';
    karaokeBody.classList.toggle('is-lyric-gap',!!gap);
   }
   if(next!==current||seek){
    const previous=current;current=next;
    const paintRow=i=>{
     const row=lyricRows[i];if(!row)return;
     const {el,words}=row;
     el.classList.toggle('is-current',i===next);
     el.classList.toggle('is-past',i<next);
     if(i!==next)words.forEach(v=>{v.last=-1;v.span.style.removeProperty('--sv-sung')});
     if(i===next)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');
    };
    if(seek||previous<0||Math.abs(next-previous)>1)lyricRows.forEach((_,i)=>paintRow(i));
    else{paintRow(previous);paintRow(next)}
    activeWords=lyricRows[next]?.words||[];
    const row=lyricRows[next]?.el;
    if(row)alignLyric(row,seek);
    else if(seek){stopLyricFrame();karaokeBody.scrollTop=0;}
   }
   for(const v of activeWords){
    const percent=Math.round(Math.max(0,Math.min(1,(time-v.start)/Math.max(.05,v.end-v.start)))*10)*10;
    if(v.last!==percent){v.last=percent;v.span.style.setProperty('--sv-sung',percent+'%')}
   }
  }
  // One timer drives the lyric animation. Media events only force alignment
  // on discontinuities; no competing per-frame scroll writer.
  audio.addEventListener('seeking',()=>updateLine(true));
  audio.addEventListener('play',()=>updateLine(true));
  audio.addEventListener('playing',()=>updateLine(true));
  audio.addEventListener('seeked',()=>updateLine(true));
  audio.addEventListener('loadedmetadata',()=>updateLine(true));
  d.addEventListener('visibilitychange',()=>{if(!d.hidden)checkLyricClock()});
  audio.addEventListener('pause',()=>updateLine(true));
  audio.addEventListener('ended',()=>updateLine());
  w.addEventListener('resize',()=>{if(lyricsActive&&lyricData?.timed){karaokeBody.style.setProperty('--sv-lyric-tail',Math.ceil(karaokeBody.clientHeight*.65)+'px');updateLine(true)}});
  d.addEventListener('seyveo:music-state',()=>{if(lyricsActive&&music()?.rhythmFile?.()!==lyricFile)void karaoke()});

  // One local worker. Prepare missing lyrics and upgrade old automatic drafts once.
  const libraryLyricsLocal=['localhost','127.0.0.1'].includes(w.location.hostname);
  const libraryLyricStatus=$('svMusicLyricsQueueStatus');
  let libraryLyricTimer=0,libraryLyricJob=null,libraryLyricRunning=false,libraryLyricClosed=false;
  const lyricReady=new Set(),lyricSkipped=new Set(),lyricFailures=new Map(),lyricReview=new Set();
  const queueStatus=text=>{
   if(!libraryLyricStatus)return;
   libraryLyricStatus.hidden=!text;
   if(libraryLyricStatus.textContent!==text)libraryLyricStatus.textContent=text;
   const row=$('svMusicLyricsStatusRow'),bar=$('svMusicLyricsLibraryProgress');
   if(row)row.hidden=!text;
   if(bar){
    const m=text.match(/Караоке · (\d+) из (\d+) готово/);
    const total=m?Number(m[2]):0,ready=m?Number(m[1]):0;
    bar.hidden=!total||ready>=total;
    if(total){bar.max=total;bar.value=Math.min(total,ready)}
   }
  };
  function pauseLibraryLyrics(){
   w.clearTimeout(libraryLyricTimer);libraryLyricTimer=0;
   libraryLyricJob?.abort();
  }
  function scheduleLibraryLyrics(delay=1000){
   if(!libraryLyricsLocal||libraryLyricClosed||libraryLyricTimer||libraryLyricRunning)return;
   libraryLyricTimer=w.setTimeout(()=>{libraryLyricTimer=0;void prepareLibraryLyrics()},delay);
  }
  async function prepareLibraryLyrics(){
   if(libraryLyricRunning||libraryLyricClosed)return;
   const player=music(),engine=w.SEYVEO_LYRICS;
   if(!player||!engine||player.state?.().libraryLoading){scheduleLibraryLyrics(2500);return}
   if(lyricAbort||(lyricsActive&&!lyricData)){scheduleLibraryLyrics(3000);return}
   const items=player.recognitionLibrary?.()||[];
   if(!items.length){queueStatus('');return}
   const current=player.rhythmFile?.();
   const ordered=items.slice().sort((a,b)=>Number(b.file===current)-Number(a.file===current));
   const summary=()=> 'Караоке · '+items.filter(x=>lyricReady.has(x.id)).length+' из '+items.length+' готово'+(items.some(x=>lyricReview.has(x.id))?' · уточнить: '+items.filter(x=>lyricReview.has(x.id)).length:'');
   libraryLyricRunning=true;
   const controller=new AbortController();libraryLyricJob=controller;
   let nextDelay=1600,deadline=0,pollTimer=0,item=null,expired=false,finished=false,upgrade=false;
   const failItem=()=>{
    if(!item)return;
    const count=(lyricFailures.get(item.id)||0)+1;
    lyricFailures.set(item.id,count);
    if(count>=2)lyricSkipped.add(item.id);
    queueStatus(summary()+' · '+(count>=2?'пропущена песня, продолжаю':'повторю позже'));
   };
   try{
    deadline=w.setTimeout(()=>controller.abort(),15000);
    const capability=await w.fetch('/api/seyveo-music-lyrics-status',{cache:'no-store',signal:controller.signal});
    const config=await capability.json().catch(()=>null);
    w.clearTimeout(deadline);deadline=0;
    if(!capability.ok||config?.protocol!==2||!config.pythonConfigured){queueStatus(summary()+' · ожидает локальный движок');nextDelay=30000;return}
    const target=config.vocalConfigured?3:2;
    for(const entry of ordered){
     if(controller.signal.aborted)return;
     if(!entry.id||lyricReady.has(entry.id)||lyricSkipped.has(entry.id)||lyricReview.has(entry.id))continue;
     const existing=await engine.get(entry.id);
     if(controller.signal.aborted)return;
     if(existing?.lines?.length){
      if(needsDraftUpgrade(existing,target)){item=entry;upgrade=true;break}
      if(needsDraftReview(existing))lyricReview.add(entry.id);else lyricReady.add(entry.id);continue
     }
     let embedded=null;try{embedded=await readEmbedded(entry.file)}catch{}
     if(controller.signal.aborted)return;
     if(embedded?.lines?.length){if(!(await engine.get(entry.id)))await engine.put(entry.id,embedded);lyricReady.add(entry.id);continue}
     item=entry;break;
    }
    if(!item){
     const count=items.filter(x=>lyricSkipped.has(x.id)).length;
     queueStatus(summary()+(count?' · не удалось: '+count:''));
     nextDelay=0;return;
    }
    if(!audio.paused&&!audio.ended){queueStatus(summary()+' · продолжу на паузе');nextDelay=0;return}
    const ext=(item.file.name.match(/\.([^.]+)$/)||[])[1]?.toLowerCase();
    const type=({mp3:'audio/mpeg',m4a:'audio/mp4',aac:'audio/aac',wav:'audio/wav',flac:'audio/flac',ogg:'audio/ogg',opus:'audio/opus',aiff:'audio/aiff',aif:'audio/aiff'})[ext]||item.file.type;
    if(item.file.size>25*1024*1024||!type?.startsWith('audio/')){lyricSkipped.add(item.id);return}
    deadline=w.setTimeout(()=>{expired=true;controller.abort()},20000);
    const check=await w.fetch('/api/seyveo-music-lyrics-status',{cache:'no-store',signal:controller.signal});
    const readiness=await check.json().catch(()=>null);
    if(!check.ok||readiness?.protocol!==2||!readiness.pythonConfigured){queueStatus(summary()+' · ожидает локальный движок');nextDelay=30000;return}
    w.clearTimeout(deadline);deadline=0;
    if(readiness.busy){queueStatus(summary()+' · ожидаю освобождения движка');nextDelay=5000;return}
    if(controller.signal.aborted||lyricAbort||(lyricsActive&&!lyricData)||(!audio.paused&&!audio.ended))return;
    queueStatus(summary()+(upgrade?' · уточняю старый текст':' · анализ песни'));
    const job=Array.from(w.crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
    deadline=w.setTimeout(()=>{expired=true;controller.abort()},target===3?1260000:660000);
    const poll=async()=>{
     if(finished||controller.signal.aborted)return;
     // A separate short-lived request must not keep the main queue waiting.
     const statusController=new AbortController();
     const limit=w.setTimeout(()=>statusController.abort(),5000);
     try{
      const res=await w.fetch('/api/seyveo-music-lyrics-status?job='+job,{cache:'no-store',signal:statusController.signal});
      const info=await res.json();
      if(!finished&&!controller.signal.aborted&&res.ok&&info.progress){
       const p=info.progress;
       const labels={receiving:'подготовка',checking:'проверка файла',loading:'загрузка модели',separating:'отделение вокала',decoding:'распознавание',finishing:'сохранение',complete:'готово'};
       queueStatus(summary()+' · '+(labels[p.phase]||'анализ')+(Number.isFinite(p.percent)?' '+p.percent+'%':''));
      }
     }catch{}finally{w.clearTimeout(limit)}
     if(!finished&&!controller.signal.aborted)pollTimer=w.setTimeout(poll,2500);
    };
    pollTimer=w.setTimeout(poll,1000);
    const response=await w.fetch('/api/seyveo-music-lyrics',{method:'POST',headers:{'content-type':type,'x-seyveo-lyric-job':job},body:item.file,signal:controller.signal});
    const data=await response.json().catch(()=>null);
    if(controller.signal.aborted)return;
    if(!response.ok||!data?.lines?.length){
     if(response.status===409||response.status===429){nextDelay=10000;return}
     if(response.status>=500){failItem();nextDelay=8000;return}
     lyricSkipped.add(item.id);return;
    }
    if(!(music()?.recognitionLibrary?.()||[]).some(x=>x.id===item.id))return;
    const existing=await engine.get(item.id);
    if(controller.signal.aborted)return;
    if(![2,3].includes(data.recognitionVersion)){
     queueStatus(summary()+' · обновите и перезапустите локальный сервер');
     nextDelay=30000;return;
    }
    const candidate=data.vocalAttempted&&data.recognitionVersion!==3?{...data,autoReviewVersion:3}:data;
    const selected=!existing?candidate:needsDraftUpgrade(existing,target)?preferDraft(existing,candidate):existing;
    if(selected!==existing)await engine.put(item.id,selected);
    if(needsDraftReview(selected))lyricReview.add(item.id);else lyricReady.add(item.id);
    lyricFailures.delete(item.id);
    if(lyricsActive&&music()?.rhythmFile?.()===item.file&&selected!==existing&&!lyricAbort&&!karaokeBody.inert)void karaoke();
    queueStatus(summary());
   }catch(error){
    if(expired){failItem();nextDelay=8000}
    else if(!controller.signal.aborted){queueStatus(summary()+' · очередь ожидает соединение');nextDelay=15000}
   }finally{
    finished=true;w.clearTimeout(deadline);w.clearTimeout(pollTimer);
    libraryLyricRunning=false;if(libraryLyricJob===controller)libraryLyricJob=null;
    if(nextDelay)scheduleLibraryLyrics(nextDelay);
   }
  }
  audio.addEventListener('play',()=>{
   pauseLibraryLyrics();
   if(libraryLyricStatus&&!libraryLyricStatus.hidden)
    queueStatus(libraryLyricStatus.textContent.split(' · ').slice(0,2).join(' · ')+' · продолжу на паузе');
  });
  audio.addEventListener('pause',()=>scheduleLibraryLyrics(2000));
  audio.addEventListener('ended',()=>scheduleLibraryLyrics(2000));
  d.addEventListener('seyveo:music-library',()=>scheduleLibraryLyrics(1500));
  w.addEventListener('pagehide',()=>{libraryLyricClosed=true;pauseLibraryLyrics()});
  w.addEventListener('pageshow',()=>{libraryLyricClosed=false;scheduleLibraryLyrics(1500)});
  w.addEventListener('online',()=>scheduleLibraryLyrics(1000));
  scheduleLibraryLyrics(2000);
  // Source quality, never a claim about the Bluetooth/DAC/output chain.
  const sourceCache=new WeakMap();
  let qualityFile=null,qualityResult=null,qualityVersion=0,qualityRadio='',qualityPending=false;
  function paintQuality(){
   const chip=$('sayviMusicQuality'),detail=$('svAdaptiveSourceQuality');
   const q=qualityResult;
   const label=q?(q.hiRes?'Hi-Res':q.format==='MP3'?'MP3':'Lossless'):qualityRadio?'RADIO':qualityFile?(qualityPending?'…':'Аудио'):'';
   if(chip){chip.hidden=!label;chip.textContent=label;chip.title=q?'Параметры исходного файла: '+q.format+' · '+q.detail:qualityRadio?'Заявленное качество радиостанции: '+qualityRadio:qualityPending?'Анализ исходного файла':'Параметры качества не определены';chip.dataset.quality=q?.hiRes?'hires':q?'file':qualityRadio?'radio':'unknown'}
   if(detail){
    detail.replaceChildren();
    const top=d.createElement('strong');top.textContent=q?label+' · '+q.format:qualityRadio?'Радио':qualityPending?'Анализ исходного файла…':'Качество файла не определено';detail.append(top);
    if(q||qualityRadio){const sub=d.createElement('small');sub.textContent=q?(q.format==='MP3'?q.bitrateKbps+' кбит/с (первый кадр) · '+q.sampleRate/1000+' кГц':q.bits+' бит · '+q.sampleRate/1000+' кГц'):'Заявлено станцией: '+qualityRadio;detail.append(sub)}
    const note=d.createElement('small');note.textContent='Параметры источника, не качество выхода Bluetooth или ЦАП.';detail.append(note);
   }
  }
  async function syncQuality(){
   const musicState=music()?.state?.(),file=music()?.rhythmFile?.()||null;
   const radio=musicState?.source==='radio'?String(musicState.quality||'Прямой эфир'):'';
   if(file===qualityFile&&radio===qualityRadio){paintQuality();return}
   qualityFile=file;qualityRadio=radio;qualityResult=null;qualityPending=!!file;
   const version=++qualityVersion;paintQuality();
   if(!file)return;
   let info=sourceCache.get(file);
   if(info===undefined){
    try{info=await w.SEYVA_MUSIC_SOURCE_QUALITY?.detect(file)||null}catch{info=null}
    sourceCache.set(file,info);
   }
   if(version!==qualityVersion||music()?.rhythmFile?.()!==file)return;
   qualityPending=false;qualityResult=info;paintQuality();
  }
  d.addEventListener('seyveo:music-state',syncQuality);
  audio.addEventListener('loadedmetadata',syncQuality);
  d.addEventListener('seyveo:music-view',syncQuality);
  d.addEventListener('seyveo:music-library',syncQuality);
  function soundSheet(){
   if(!show('Adaptive Sound','sound'))return;
   const mark=d.createElement('div');mark.className='sv-adaptive-mark';mark.setAttribute('aria-hidden','true');
   mark.innerHTML='<svg viewBox="0 0 64 64" fill="none" stroke="currentColor"><circle cx="32" cy="32" r="29" stroke-width=".8"/><circle cx="32" cy="32" r="23" stroke-width=".6" opacity=".5"/><path d="M14 29v6m6-12v18m6-22v26m6-31v36m6-27v18m6-15v12m6-9v6" stroke-width="1.7" stroke-linecap="round"/></svg>';
   body.append(mark);
   const tagline=d.createElement('strong');tagline.className='sv-adaptive-tagline';tagline.textContent='Интеллект в каждой ноте.';body.append(tagline);
   message('Не настраивайте музыку. Наслаждайтесь ею.');
   const statusLine=d.createElement('p');statusLine.className='sv-adaptive-status';statusLine.setAttribute('aria-live','polite');body.append(statusLine);
   const sourceLine=d.createElement('div');sourceLine.id='svAdaptiveSourceQuality';body.append(sourceLine);paintQuality();
   message('Бережная коррекция громкости. Характер записи сохраняется.');
   const modeButton=action('Pure Sound · без коррекции',()=>{const engine=w.SEYVEO_ADAPTIVE_SOUND;if(engine){engine.setPure(!engine.state().pure);updateSound()}});
   modeButton.id='svAdaptivePure';
   message('Работает с поддерживаемыми локальными песнями. Радио и другие источники — без коррекции.');
   updateSound();
  }
  // Keep the header height constant. First tap on the collapsed symbol
  // reveals the controls only; never change sound mode by accident.
  const quickGroup=$('svAdaptiveQuickGroup'),quickButton=$('svAdaptiveQuick'),quickInfo=$('svAdaptiveQuickInfo');
  let quickTimer=0,quickCollapsed=false;
  const inPlayer=()=>page.dataset.musicView==='player'&&!page.hidden;
  function paintQuick(){
   if(!quickGroup||!quickButton)return;
   quickGroup.classList.toggle('is-collapsed',quickCollapsed);
   quickButton.setAttribute('aria-expanded',String(!quickCollapsed));
   if(quickInfo){quickInfo.tabIndex=quickCollapsed?-1:0;quickInfo.setAttribute('aria-hidden',String(quickCollapsed))}
   const s=w.SEYVEO_ADAPTIVE_SOUND?.state();
   quickButton.setAttribute('aria-label',quickCollapsed?'Показать управление звуком':s?.pure?'Pure Sound. Включить Adaptive Sound':'Adaptive Sound. Включить Pure Sound');
  }
  function stopQuickTimer(){if(quickTimer){w.clearTimeout(quickTimer);quickTimer=0}}
  function revealQuick(){
   stopQuickTimer();quickCollapsed=false;paintQuick();
   if(!inPlayer())return;
   quickTimer=w.setTimeout(function collapse(){
    quickTimer=0;
    if(!inPlayer())return;
    if(dialog?.open||quickGroup?.querySelector(':focus-visible')){
     quickTimer=w.setTimeout(collapse,1000);return;
    }
    quickCollapsed=true;paintQuick();
   },5000);
  }
  d.addEventListener('seyveo:music-view',e=>{if(e.detail?.view==='player')revealQuick();else{stopQuickTimer();quickCollapsed=false;paintQuick()}});
  const wakeQuick=e=>{
   if(!inPlayer()||dialog?.open)return;
   // A collapsed-symbol click is handled separately, after pointerdown.
   if(quickCollapsed&&quickGroup?.contains(e.target))return;
   revealQuick();
  };
  page.addEventListener('pointerdown',wakeQuick,{passive:true});
  if(!w.PointerEvent)page.addEventListener('touchstart',wakeQuick,{passive:true});
  page.addEventListener('keydown',e=>{if(!quickGroup?.contains(e.target)&&inPlayer()&&!dialog?.open)revealQuick()});
  dialog?.addEventListener('close',()=>{if(inPlayer())revealQuick()});
  d.addEventListener('visibilitychange',()=>{if(d.hidden)stopQuickTimer();else if(inPlayer())revealQuick()});
  if(inPlayer())revealQuick();else paintQuick();
  function updateSound(){
   const s=w.SEYVEO_ADAPTIVE_SOUND?.state();
   const quick=$('svAdaptiveQuick'),name=$('svAdaptiveQuickName'),sub=$('svAdaptiveQuickState');
   if(quick&&name&&sub){
    name.textContent=s?.pure?'Pure Sound':'Adaptive Sound';
    const states={active:s?.attenuationDb<0?'Звучание адаптировано':'Без коррекции',analysing:'Анализ записи…',waiting:'Ожидание записи',idle:'Автоматический режим',limited:'Без коррекции',unsupported:'Без коррекции',pure:'Оригинальное звучание'};
    sub.textContent=s?states[s.phase]||'Автоматический режим':'Недоступно';
    quick.dataset.soundPhase=s?.phase||'unsupported';
    quick.setAttribute('aria-pressed',String(!!s?.pure));
    paintQuick();
    quick.disabled=!s;
   }
   if(mode!=='sound'||!dialog?.open)return;
   dialog.dataset.soundPhase=s?.phase||'unsupported';
   const el=body.querySelector('.sv-adaptive-status'),b=$('svAdaptivePure');
   if(!el||!b)return;
   const labels={pure:'Pure Sound · оригинал',active:s?.attenuationDb<0?'Adaptive Sound · коррекция '+s.attenuationDb+' дБ':'Adaptive Sound · коррекция не требуется',waiting:'Ожидание данных записи',analysing:'Анализ записи…',limited:'Без коррекции · формат или размер записи',unsupported:'Без коррекции · ограничение устройства',idle:'Готов к локальной музыке'};
   el.replaceChildren();
   const headline=d.createElement('strong');headline.textContent=s?.phase==='active'&&s.attenuationDb<0?'Звучание адаптировано':(!s?'Движок недоступен':labels[s.phase]||'Готов к локальной музыке');el.append(headline);
   if(s?.phase==='active'&&s.attenuationDb<0){const db=d.createElement('small');db.textContent='Коррекция '+s.attenuationDb+' дБ';el.append(db)}
   b.textContent=s?.pure?'Вернуть Adaptive Sound':'Pure Sound · без коррекции';
   b.setAttribute('aria-pressed',String(!!s?.pure));b.disabled=!s;
  }
  d.addEventListener('seyveo:adaptive-sound',updateSound);
  $('svAdaptiveSoundOpen')?.addEventListener('click',soundSheet);
  quickButton?.addEventListener('click',()=>{if(quickCollapsed){revealQuick();return}revealQuick();const engine=w.SEYVEO_ADAPTIVE_SOUND;if(engine){engine.setPure(!engine.state().pure);updateSound()}});
  $('svAdaptiveQuickInfo')?.addEventListener('click',soundSheet);
  dialog?.addEventListener('close',()=>{delete dialog.dataset.soundPhase});
  updateSound();syncQuality();
  $('svSmartShare')?.addEventListener('click',share);
  $('svSmartSleep')?.addEventListener('click',sleepSheet);
  $('svNowKaraoke')?.addEventListener('click',toggleKaraoke);
  function handle(q){
   const pure=/^(?:включи|верни) (?:pure sound|пьюр саунд|чистый звук|оригинальное звучание)$/.test(q);
   const adaptive=/^(?:включи|верни) (?:adaptive sound|адаптив саунд|адаптивный звук|автоматический звук)$/.test(q);
   if(pure||adaptive){const engine=w.SEYVEO_ADAPTIVE_SOUND;if(!engine)return {status:'unsupported',message:'Режим звука недоступен.'};engine.setPure(pure);updateSound();return {status:'changed',message:pure?'Pure Sound. Без дополнительной коррекции.':'Adaptive Sound. Автоматическая коррекция для поддерживаемых записей.'}}
   const minutes=sleepMinutes(q);
   if(minutes!==null){setSleep(minutes);return {status:'scheduled',message:'Музыка остановится через '+minutes+' мин. Если браузер не приостановит работу приложения.'}}
   if(/^(?:отмени|отключи)\s+таймер сна$/.test(q)){cancelSleep();return {status:'changed',message:'Таймер сна отключён.'}}
   if(/^(?:что (?:сейчас )?играет|какая песня играет)$/.test(q)){const data=shareData();return {status:data?'found':'missing',message:data?data.text.split('\n')[0]:'Сейчас песня не выбрана.'}}
   if(/^(?:поделись (?:этой )?(?:песней|музыкой)|поделиться (?:песней|музыкой))$/.test(q)){const opened=share();return {status:opened?'requested':'missing',message:opened?'Выберите, как поделиться песней.':'Сначала включите песню.'}}
   return null;
  }
  w.SEYVEO_MUSIC_SMART=Object.freeze({handle,share,sleepSheet,karaoke,soundSheet,recognitionSheet});
 }
 return {embeddedLyrics,activeLine,lyricWindow,lyricGap,draftCoverage,needsDraftReview,needsDraftUpgrade,preferDraft,adjustedLyricTime,sleepMinutes,install};
});
