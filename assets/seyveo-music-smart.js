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
  let lyricAbort=null;
  function cancelLyric(){lyricAbort?.abort();lyricAbort=null}
  const close=()=>{cancelLyric();cancelRecognition();if(dialog?.open)dialog.close();++generation;mode='';lyricData=null;current=-2};
  let generation=0,mode='',lyricData=null,current=-2,deadline=0,timer=0,originalVolume=null;
  function show(label,kind){
   if(!dialog||!body)return false;
   cancelLyric();if(kind!=='recognize')cancelRecognition();
   ++generation;mode=kind;lyricData=null;current=-2;title.textContent=label;body.replaceChildren();
   if(!dialog.open){try{dialog.showModal()}catch{return false}}return true;
  }
  function message(t){const p=d.createElement('p');p.className='sv-smart-music-message';p.textContent=t;body.append(p);return p}
  function action(label,fn){const b=d.createElement('button');b.type='button';b.className='sv-smart-music-choice';b.textContent=label;b.addEventListener('click',fn);body.append(b);return b}
  $('svSmartMusicClose')?.addEventListener('click',close);
  dialog?.addEventListener('close',()=>{++generation;mode='';lyricData=null;current=-2});
  dialog?.addEventListener('click',e=>{if(e.target===dialog)close()});
  d.addEventListener('seyveo:music-view',e=>{if(e.detail?.view!=='player'&&dialog?.open)close()});
  let recognitionCancel=null;
  function cancelRecognition(){const cancel=recognitionCancel;recognitionCancel=null;cancel?.()}
  dialog?.addEventListener('close',cancelRecognition);
  dialog?.addEventListener('close',cancelLyric);
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
  function recognitionSheet(){
   cancelRecognition();
   if(!show('Распознать музыку','recognize'))return;
   const version=generation;
   message('Сэйви узнаёт композиции из вашей медиатеки.');
   message('До 10 секунд звука с вашего разрешения. Анализ на устройстве, без передачи записи в интернет.');
   const engine=w.SEYVEO_MUSIC_FINGERPRINT;
   if(!w.isSecureContext||!w.navigator.mediaDevices?.getUserMedia||!w.MediaRecorder){message('Микрофон недоступен в этом браузере.');return}
   const status=message('Готовлю музыкальный индекс…');status.id='svRecognitionIndexStatus';
   const startButton=action('Начать распознавание',()=>recordRecognition(version));startButton.id='svRecognitionStart';
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
  $('svMusicRecognizeMenu')?.addEventListener('click',recognitionSheet);
  function shareData(){
   if(!loaded())return null;
   const name=$('sayviMusicTrack')?.textContent?.trim()||'Музыка';
   const artist=$('sayviMusicArtist')?.textContent?.trim()||'';
   return {title:name,text:[name,artist==='Моя музыка'?'':artist].filter(Boolean).join(' — ')+'\nSEYVEO Music'};
  }
  function share(){
   const data=shareData();if(!data){notify('Сначала включите песню или радио.');return false}
   if(!show('Поделиться музыкой','share'))return false;
   message(data.text);
   if(w.navigator.share)action('Отправить название',async()=>{try{await w.navigator.share(data);close()}catch(e){if(e.name!=='AbortError')message('Не удалось открыть системное меню.')}});
   action('Копировать название',async()=>{try{await w.navigator.clipboard.writeText(data.text);close();notify('Название скопировано.')}catch{message('Не удалось скопировать. Выделите текст вручную.')}});
   const file=music()?.rhythmFile?.();let canShareFile=false;
   try{canShareFile=!!file&&!!w.navigator.share&&!!w.navigator.canShare?.({files:[file]})}catch{}
   if(canShareFile)action('Отправить аудиофайл',async()=>{
    if(music()?.rhythmFile?.()!==file){message('Песня изменилась. Откройте меню заново.');return}
    try{await w.navigator.share({files:[file],title:data.title});close()}catch(e){if(e.name!=='AbortError')message('Не удалось отправить файл.')}
   });
   message(canShareFile?'Отправляйте аудиофайл только если у вас есть право им делиться.':'Отправка файла не поддерживается на этом устройстве. Название можно скопировать.');
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
  async function karaoke(){
   const file=music()?.rhythmFile?.();
   if(!show('Караоке','lyrics'))return;
   if(!file){message('Текст доступен для песен из медиатеки.');return}
   const version=generation,valid=()=>version===generation&&dialog.open&&mode==='lyrics'&&music()?.rhythmFile?.()===file;
   const engine=w.SEYVEO_LYRICS,id=music()?.recognitionLibrary?.().find(x=>x.file===file)?.id;
   message('Ищем текст песни…');
   let result=null,attached=false;
   try{result=await engine?.get(id);attached=!!result;if(!result)result=await readEmbedded(file)}catch{}
   if(!valid())return;
   body.replaceChildren();
   const render=(data,imported,saved=true)=>{
    if(!valid())return;
    body.replaceChildren();current=-2;lyricData=null;
    const name=d.createElement('strong');name.className='sv-lyrics-song';name.textContent=$('sayviMusicTrack')?.textContent||'Текст песни';body.append(name);
    if(data){
     lyricData={...data,file};
     message(data.draft?'Черновик Сэйви: слова и время строк определены приблизительно, возможны ошибки.':data.timed?'Текст синхронизирован с музыкой.':'Текст без временных меток. Автосинхронизация недоступна.');
     if(!saved)message('Текст доступен до закрытия страницы: хранилище недоступно.');
     const controls=d.createElement('div');controls.className='sv-lyrics-actions';body.append(controls);
     const play=d.createElement('button');play.type='button';play.className='sv-smart-music-choice';const sync=()=>{play.textContent=audio.paused?'Воспроизвести':'Пауза'};sync();
     play.addEventListener('click',()=>{if(!valid())return;if(audio.paused)audio.play().catch(()=>notify('Не удалось воспроизвести песню.'));else audio.pause();sync()});controls.append(play);
     const save=d.createElement('button');save.type='button';save.className='sv-smart-music-choice';
     save.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 3v18M3 7h4M3 12h4M3 17h4M11 8h6M11 12h6M11 16h4"/></svg><span>В блокнот</span>';
     controls.append(save);
     const feedback=d.createElement('p');feedback.className='sv-lyrics-feedback';feedback.setAttribute('role','status');feedback.hidden=true;body.append(feedback);
     save.addEventListener('click',()=>{
      if(!valid())return;
      const title=$('sayviMusicTrack')?.textContent?.trim()||'Текст песни';
      const artist=$('sayviMusicArtist')?.textContent?.trim();
      const text=[title,artist&&artist!=='Моя музыка'?artist:'',data.lines.map(line=>line.text).join('\n')].filter(Boolean).join('\n\n');
      const saved=w.SEYVEO_MUSIC_NOTE?.save(text);
      feedback.hidden=false;
      feedback.textContent=saved?.ok?(saved.existing?'Этот текст уже есть в блокноте.':'Текст сохранён в блокноте. Музыка продолжает играть.'):(saved?.reason==='length'?'Текст длиннее лимита одной заметки (8000 символов).':saved?.reason==='limit'?'Блокнот заполнен. Освободите место для новой записи.':'Не удалось сохранить текст в блокноте.');
     });
     for(const line of data.lines){
      const el=d.createElement(data.timed?'button':'p');el.className='sv-smart-lyric';el.textContent=line.text||'♪';
      if(data.timed){el.type='button';el.addEventListener('click',()=>{if(valid()&&Number.isFinite(audio.duration))audio.currentTime=Math.max(0,Math.min(line.time,audio.duration))})}
      body.append(el);
     }
    }else {
     message('Готовый текст не найден. Сэйви может попробовать разобрать вокал на вашем компьютере.');
     const local=['localhost','127.0.0.1'].includes(w.location.hostname);
     if(local&&engine&&id){
      let status=null;
      function progress(text){if(!status){status=message(text);status.setAttribute('role','status')}else status.textContent=text;return status}
      const start=action('Распознать текст автоматически',async()=>{
       if(!valid()||lyricAbort)return;
       const ext=(file.name.match(/\.([^.]+)$/)||[])[1]?.toLowerCase();
       const type=({mp3:'audio/mpeg',m4a:'audio/mp4',aac:'audio/aac',wav:'audio/wav',flac:'audio/flac',ogg:'audio/ogg',opus:'audio/opus',aiff:'audio/aiff',aif:'audio/aiff'})[ext]||file.type;
       if(file.size>25*1024*1024){progress('Для автоматического анализа нужна песня до 25 МБ.');return}
       if(!type?.startsWith('audio/')){progress('Формат песни не поддерживается.');return}
       const controller=new AbortController();lyricAbort=controller;
       start.disabled=true;progress('Проверяю локальный движок…');
       const cancel=action('Отменить анализ',()=>controller.abort());
       try{
        const upgrade='Запущена старая версия сервера. Обновите проект из GitHub, остановите сервер (Ctrl+C) и снова запустите server/start-real-seyveo.cmd. Затем обновите страницу.';
        const check=await w.fetch('/api/seyveo-music-lyrics-status',{cache:'no-store',signal:controller.signal});
        if(check.status===404)throw Error(upgrade);
        const readiness=await check.json().catch(()=>null);
        if(!check.ok||readiness?.protocol!==1)throw Error(upgrade);
        if(!readiness.pythonConfigured)throw Error('Локальный Whisper не установлен. Запустите server/install-note-transcription.cmd, затем перезапустите SEYVEO.');
        if(readiness.busy)throw Error('Сэйви уже распознаёт запись. Повторите после завершения.');
        if(!valid()||controller.signal.aborted)return;
        progress('Сэйви разбирает вокал… Музыка может продолжать играть.');
        const response=await w.fetch('/api/seyveo-music-lyrics',{method:'POST',headers:{'content-type':type},body:file,signal:controller.signal});
        if(response.status===404)throw Error(upgrade);
        const data=await response.json().catch(()=>({}));if(!valid()||controller.signal.aborted)return;
        if(!response.ok||!data.lines?.length)throw Error(data.error||'Текст не определён.');
        const saved=await engine.put(id,data);if(valid()&&!controller.signal.aborted)render(data,true,saved);
       }catch(error){if(valid())status.textContent=controller.signal.aborted?'Анализ отменён.':String(error.message||'Анализ недоступен.')}
       finally{if(lyricAbort===controller)lyricAbort=null;if(valid()){start.disabled=false;cancel.remove()}}
      });
     }else message('Автоматическое распознавание пока доступно в локальной версии на компьютере.');
    }
    if(engine&&id){
     const input=d.createElement('input');input.type='file';input.accept='.lrc,.txt,text/plain';input.hidden=true;body.append(input);
     input.addEventListener('change',async()=>{
      const selected=input.files?.[0];if(!selected||!valid())return;
      try{
       const parsed=await engine.read(selected);if(!valid())return;
       if(!parsed){message('Не удалось прочитать текст. Выберите LRC или TXT до 128 КБ.');return}
       const saved=await engine.put(id,parsed);if(valid())render(parsed,true,saved);
      }catch{if(valid())message('Не удалось загрузить текст.')}
     });
     action(data?'Заменить текст':'Добавить текст песни',()=>input.click());
     if(imported)action('Удалить добавленный текст',async()=>{if(!valid())return;const removed=await engine.remove(id);if(valid()){if(removed)karaoke();else message('Не удалось удалить сохранённый текст.')}});
    }
    updateLine();
   };
   render(result,attached);
  }
  function updateLine(){
   if(mode!=='lyrics'||!lyricData||!dialog.open)return;
   if(music()?.rhythmFile?.()!==lyricData.file){close();return}
   if(!lyricData.timed)return;
   const next=activeLine(lyricData.lines,audio.currentTime);if(next===current)return;current=next;
   const rows=body.querySelectorAll('.sv-smart-lyric');
   rows.forEach((row,i)=>row.classList.toggle('is-current',i===next));
   const row=rows[next];if(row)body.scrollTop=Math.max(0,row.offsetTop-body.clientHeight*.35);
  }
  audio.addEventListener('timeupdate',updateLine);audio.addEventListener('seeking',updateLine);
  d.addEventListener('seyveo:music-state',()=>{if(mode==='lyrics'&&lyricData&&music()?.rhythmFile?.()!==lyricData.file){karaoke();return}updateLine();const play=body.querySelector('.sv-lyrics-actions button');if(play)play.textContent=audio.paused?'Воспроизвести':'Пауза'});
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
  $('svAdaptiveSoundMenu')?.addEventListener('click',soundSheet);
  $('svSmartShare')?.addEventListener('click',share);
  $('svSmartSleep')?.addEventListener('click',sleepSheet);
  $('svSmartKaraoke')?.addEventListener('click',karaoke);
  $('svNowKaraoke')?.addEventListener('click',karaoke);
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
 return {embeddedLyrics,activeLine,sleepMinutes,install};
});
