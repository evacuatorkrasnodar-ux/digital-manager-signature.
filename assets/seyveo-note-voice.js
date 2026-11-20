/* SEYVEO Smart Notebook · in-note voice recording.
   Audio stays in the note's IndexedDB. Live speech recognition is explicit opt-in;
   the browser may use an online recognition service. No audio is sent by this module. */
(function(){
 'use strict';
 const dialog=document.getElementById('noteReviewDialog');
 const form=document.getElementById('noteReviewForm');
 const attachmentList=document.getElementById('svNoteAttachments');
 const textField=document.getElementById('noteReviewText');
 if(!dialog||!form||!attachmentList||!textField)return;
 const MAX_DURATION=5*60*1000;
 const micSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5m-4 0h8"/></svg>';
 const capture=document.createElement('section');
 capture.id='svNoteVoiceCapture';capture.className='sv-note-voice-capture';capture.hidden=true;
 capture.setAttribute('aria-label','Запись голоса');
 capture.innerHTML=`<div class="sv-note-voice-main"><span class="sv-note-voice-icon">${micSvg}</span><div class="sv-note-voice-meta"><strong data-voice-state>Запись…</strong><small data-voice-hint>Голос сохранится внутри заметки</small></div><time data-voice-timer>0:00</time></div>
  <div class="sv-note-voice-wave" aria-hidden="true"></div>
  <label class="sv-note-voice-recognize"><input type="checkbox" data-voice-recognize><span>Подготовить текст во время записи <small>Если браузер поддерживает распознавание речи. Оно может использовать интернет.</small></span></label>
  <div class="sv-note-voice-actions"><button type="button" data-voice-pause>Пауза</button><button type="button" data-voice-cancel>Отменить</button><button type="button" data-voice-stop>Сохранить запись</button></div>`;
 form.insertBefore(capture,attachmentList);
 const transcriptPanel=document.createElement('section');
 transcriptPanel.id='svNoteVoiceTranscript';transcriptPanel.className='sv-note-voice-transcript';
 transcriptPanel.hidden=true;transcriptPanel.setAttribute('aria-label','Текст голосовой записи');
 transcriptPanel.innerHTML=`<div class="sv-note-voice-transcript-head"><strong>Голосовая запись → текст</strong><button type="button" data-transcript-close aria-label="Закрыть">✕</button></div>
  <p data-transcript-hint></p><button type="button" class="sv-note-voice-run" data-transcript-run><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2.7" width="6" height="12" rx="3"/><path d="M5.5 11.3a6.5 6.5 0 0 0 13 0M12 18v3.5m-4 0h8"/></svg><span>Распознать запись</span></button><textarea data-transcript-text rows="4" maxlength="8000" spellcheck="true" placeholder="Здесь появится расшифровка…" aria-label="Проверить расшифровку"></textarea>
  <div class="sv-note-voice-transcript-actions"><button type="button" data-transcript-add>Добавить в заметку</button><button type="button" data-transcript-sayvi>Добавить и открыть Сэйви</button></div><small data-transcript-status role="status" aria-live="polite"></small>`;
 form.insertBefore(transcriptPanel,attachmentList);
 const $=selector=>capture.querySelector(selector);
 const timer=$('[data-voice-timer]'),hint=$('[data-voice-hint]'),state=$('[data-voice-state]');
 const pauseBtn=$('[data-voice-pause]'),stopBtn=$('[data-voice-stop]'),cancelBtn=$('[data-voice-cancel]');
 const recognize=$('[data-voice-recognize]');
 const preview=selector=>transcriptPanel.querySelector(selector);
 const previewText=preview('[data-transcript-text]');
 const previewStatus=preview('[data-transcript-status]');
 let current=null,previewItem=null,serial=0,pending=false,pendingDownload=null,transcriptAbort=null;
 const wave=$('.sv-note-voice-wave');
 [9,15,21,12,28,18,10,24,15,31,20,12,26,17,11,23,14,29,18,12,21,15,26,9].forEach((height,i)=>{
  const bar=document.createElement('i');bar.style.height=height+'px';bar.style.animationDelay=(i%8)*-0.13+'s';wave.append(bar);
 });
 function stamp(ms){const sec=Math.floor(Math.max(0,ms)/1000);return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');}
 function duration(record){return record.elapsed+(record.activeSince?Date.now()-record.activeSince:0);}
 function render(record){
  if(current!==record)return;
  timer.textContent=stamp(duration(record));
  const paused=record.recorder?.state==='paused';
  capture.classList.toggle('sv-note-voice-paused',paused);
  state.textContent=paused?'Пауза':record.stopping?'Сохраняем запись…':'Идёт запись';
  pauseBtn.textContent=paused?'Продолжить':'Пауза';
  if(duration(record)>=MAX_DURATION&&!record.stopping)void finish(true);
 }
 function release(record){
  clearInterval(record.interval);
  record.stream?.getTracks().forEach(track=>track.stop());
  record.interval=null;
 }
 function stopRecognition(record){
  record.wantSpeech=false;
  try{record.speech?.stop()}catch{}
 }
 function beginRecognition(record){
  if(!record||record.stopping||record.recorder?.state!=='recording')return;
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){recognize.checked=false;hint.textContent='Этот браузер не поддерживает распознавание. Аудио продолжает записываться.';return;}
  if(record.speech)return;
  try{
   const speech=new Recognition();speech.lang='ru-RU';speech.continuous=true;speech.interimResults=true;
   record.wantSpeech=true;record.speech=speech;
   speech.onresult=event=>{
    if(current!==record)return;
    for(let i=event.resultIndex;i<event.results.length;i++){
     if(event.results[i].isFinal){
      const phrase=String(event.results[i][0]?.transcript||'').trim();
      if(phrase)record.phrases.push(phrase);
     }
    }
    hint.textContent=record.phrases.length?'Речь распознаётся · '+record.phrases.join(' ').slice(-65):'Распознаём речь параллельно с записью…';
   };
   speech.onerror=event=>{
    if(current!==record)return;
    record.wantSpeech=false;recognize.checked=false;
    hint.textContent=event.error==='not-allowed'?'Распознавание не разрешено. Звук продолжает записываться.':'Распознавание прервалось. Звук продолжает записываться.';
   };
   speech.onend=()=>{
    record.speech=null;
    if(current===record&&record.wantSpeech&&!record.stopping&&record.recorder?.state==='recording'){
     window.setTimeout(()=>{if(current===record&&record.wantSpeech)beginRecognition(record);},180);
    }
   };
   speech.start();
   hint.textContent='Распознаём речь. Аудио сохраняется отдельно.';
  }catch{
   record.speech=null;record.wantSpeech=false;recognize.checked=false;
   hint.textContent='Браузер не смог включить распознавание. Аудио продолжает записываться.';
  }
 }
 async function start(){
  if(!dialog.open||current||pending)return;
  if(pendingDownload){URL.revokeObjectURL(pendingDownload.url);pendingDownload=null;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
   capture.hidden=false;state.textContent='Микрофон недоступен';
   hint.textContent='Нужен современный браузер и защищённая страница (HTTPS или localhost).';
   pauseBtn.disabled=true;stopBtn.disabled=true;recognize.disabled=true;
   cancelBtn.textContent='Закрыть';return;
  }
  ++serial;pending=true;
  const id=serial;
  transcriptPanel.hidden=true;
  capture.hidden=false;capture.classList.remove('sv-note-voice-paused');
  state.textContent='Подключаем микрофон…';hint.textContent='Запись останется только в этой заметке';
  timer.textContent='0:00';stopBtn.disabled=true;stopBtn.textContent='Сохранить запись';pauseBtn.disabled=true;
  cancelBtn.textContent='Отменить';recognize.disabled=true;recognize.checked=false;
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});}
  catch{
   pending=false;
   if(id!==serial)return;
   state.textContent='Нет доступа к микрофону';
   hint.textContent='Разреши микрофон в настройках браузера и попробуй снова.';
   cancelBtn.textContent='Закрыть';return;
  }
  pending=false;
  if(id!==serial||!dialog.open){stream.getTracks().forEach(track=>track.stop());return;}
  try{
   const types=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
   const type=types.find(value=>MediaRecorder.isTypeSupported?.(value));
   const recorder=new MediaRecorder(stream,type?{mimeType:type}:undefined);
   const record={recorder,stream,chunks:[],elapsed:0,activeSince:Date.now(),interval:null,stopping:false,
    canceled:false,phrases:[],wantSpeech:false,speech:null};
   current=record;
   recorder.ondataavailable=event=>{if(event.data?.size)record.chunks.push(event.data);};
   recorder.onerror=()=>{hint.textContent='Ошибка записи. Попробуй сохранить доступный фрагмент.';};
   recorder.onstop=async()=>{
    release(record);
    // A final speech recognition result can arrive just after the recorder stops.
    await new Promise(resolve=>setTimeout(resolve,250));
    if(record.canceled||id!==serial){if(current===record)current=null;capture.hidden=true;return;}
    const blob=new Blob(record.chunks,{type:recorder.mimeType||record.chunks[0]?.type||'audio/webm'});
    try{
     await window.SEYVEO_NOTE_ATTACHMENTS.saveRecordedAudio(blob,record.elapsed,record.phrases.join(' '));
     if(current===record){capture.hidden=true;current=null;}
    }catch(error){
     state.textContent='Не удалось сохранить аудио';
     hint.textContent=error?.message||'Проверь свободное место на устройстве.';
     pendingDownload={url:URL.createObjectURL(blob),name:'Голосовая запись.'+(blob.type.includes('mp4')?'m4a':'webm')};
     stopBtn.disabled=false;stopBtn.textContent='Скачать аудио';
     pauseBtn.disabled=true;cancelBtn.textContent='Закрыть';current=null;
    }
   };
   recorder.start(250);
   record.interval=setInterval(()=>render(record),200);
   pauseBtn.disabled=false;stopBtn.disabled=false;recognize.disabled=false;
   render(record);
  }catch{
   stream.getTracks().forEach(track=>track.stop());
   state.textContent='Не удалось начать запись';hint.textContent='Формат аудио не поддерживается. Попробуй другой браузер.';
   cancelBtn.textContent='Закрыть';
  }
 }
 async function finish(save){
  const record=current;
  if(!record||record.stopping)return;
  record.stopping=true;record.canceled=!save;
  if(record.activeSince){record.elapsed+=Date.now()-record.activeSince;record.activeSince=0;}
  stopRecognition(record);
  stopBtn.disabled=true;pauseBtn.disabled=true;recognize.disabled=true;
  render(record);
  try{if(record.recorder.state!=='inactive')record.recorder.stop();else release(record);}
  catch{release(record);current=null;capture.hidden=true;}
 }
 pauseBtn.addEventListener('click',()=>{
  const record=current;if(!record||record.stopping)return;
  try{
   if(record.recorder.state==='recording'){
    record.elapsed+=Date.now()-record.activeSince;record.activeSince=0;
    record.recorder.pause();if(record.speech)try{record.speech.stop()}catch{}
   }else if(record.recorder.state==='paused'){
    record.activeSince=Date.now();record.recorder.resume();
    if(recognize.checked)beginRecognition(record);
   }
   render(record);
  }catch{hint.textContent='Не получилось переключить паузу.';}
 });
 stopBtn.addEventListener('click',()=>{
  if(pendingDownload){
   const link=document.createElement('a');link.href=pendingDownload.url;link.download=pendingDownload.name;
   document.body.append(link);link.click();link.remove();return;
  }
  void finish(true);
 });
 cancelBtn.addEventListener('click',()=>{
  if(current){void finish(false);return;}
  ++serial;pending=false;capture.hidden=true;
  if(pendingDownload){URL.revokeObjectURL(pendingDownload.url);pendingDownload=null;}
 });
 recognize.addEventListener('change',()=>{
  const record=current;if(!record)return;
  if(recognize.checked)beginRecognition(record);
  else{
   stopRecognition(record);hint.textContent='Распознавание выключено. Аудио продолжает записываться.';
  }
 });
 function transcribe(item){
  if(!dialog.open||current||pending||dialog.dataset.noteId!==item.noteId)return;
  transcriptAbort?.abort();transcriptAbort=null;
  capture.hidden=true;
  previewItem=item;
  const existing=String(item.transcript||'').trim();
  previewText.value=existing;previewStatus.textContent='';
  preview('[data-transcript-run] span').textContent=existing?'Распознать заново':'Распознать запись';
  preview('[data-transcript-hint]').textContent=existing?
   'Черновик уже есть. Можно проверить его или распознать запись заново. Оригинальный звук останется в заметке.':
   location.origin==='http://127.0.0.1:8790'?
    'Сэйви может разобрать даже старую запись локальным Whisper. После распознавания проверь текст перед добавлением.':
    'Оригинальная запись сохранена. Автоматическое распознавание доступно через локальный SEYVEO на ПК; здесь можно прослушать аудио и вписать текст.';
  transcriptPanel.hidden=false;
 }
 function closeTranscript(){
  transcriptAbort?.abort();transcriptAbort=null;
  transcriptPanel.hidden=true;previewItem=null;
 }
 preview('[data-transcript-close]').addEventListener('click',closeTranscript);
 preview('[data-transcript-run]').addEventListener('click',async()=>{
  const item=previewItem;
  if(!item||transcriptAbort||!dialog.open)return;
  // Public GitHub Pages cannot run private models. Never POST a private audio
  // file to its 404 endpoint, even as an attempted fallback.
  if(location.origin!=='http://127.0.0.1:8790'){
   previewStatus.textContent='Для автоматической расшифровки открой локальный SEYVEO на компьютере. Аудио никуда не отправлено.';
   return;
  }
  if(previewText.value.trim()&&previewText.value.trim()!==String(item.transcript||'').trim()&&
     !window.confirm('Заменить набранный текст результатом распознавания?'))return;
  const controller=new AbortController();transcriptAbort=controller;
  const run=preview('[data-transcript-run]'),label=run.querySelector('span');
  run.disabled=true;run.setAttribute('aria-busy','true');
  label.textContent='Сэйви слушает запись…';previewStatus.textContent='Распознавание на этом компьютере. Может занять несколько минут.';
  const timeout=setTimeout(()=>controller.abort(),270000);
  try{
   const response=await fetch('/api/seyveo-note-transcribe',{
    method:'POST',credentials:'same-origin',
    headers:{'Content-Type':item.type||'audio/webm'},body:item.blob,signal:controller.signal
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||'Локальное распознавание недоступно. Запусти установщик server/install-note-transcription.cmd.');
   if(typeof data.text!=='string'||!data.text.trim())throw Error('Речь не распознана. Исходное аудио сохранено.');
   if(controller.signal.aborted||previewItem!==item||!dialog.open)return;
   previewText.value=data.text.trim().slice(0,8000);
   previewStatus.textContent='Готово. Проверь слова и нажми «Добавить в заметку». Запись не изменена.';
   preview('[data-transcript-hint]').textContent='Текст подготовлен локальным Whisper. Можно отредактировать его перед добавлением.';
   label.textContent='Распознать заново';
  }catch(error){
   if(!controller.signal.aborted&&previewItem===item)
    previewStatus.textContent=error?.message||'Не удалось разобрать звук. Исходное аудио сохранено.';
   else if(previewItem===item)previewStatus.textContent='Распознавание прервано. Аудио сохранено.';
  }finally{
   clearTimeout(timeout);if(transcriptAbort===controller)transcriptAbort=null;
   if(previewItem===item){
    run.disabled=false;run.removeAttribute('aria-busy');
    if(label.textContent==='Сэйви слушает запись…')label.textContent=item.transcript?'Распознать заново':'Распознать запись';
   }
  }
 });
 async function applyTranscript(openSayvi){
  const item=previewItem,text=previewText.value.trim();
  if(!item||!dialog.open||dialog.dataset.noteId!==item.noteId)return;
  if(!text){previewStatus.textContent='Пока нет текста. Впиши расшифровку или подготовь её во время новой записи.';return;}
  if(textField.value.length+text.length+2>8000){previewStatus.textContent='Заметка заполнена. Сократи текст перед вставкой.';return;}
  const buttons=transcriptPanel.querySelectorAll('button');buttons.forEach(button=>button.disabled=true);
  try{
   await window.SEYVEO_NOTE_ATTACHMENTS.updateTranscript(item.noteId,item.id,text);
   const insertion=(textField.value.trim()?'\n\n':'')+text;
   if(window.SEYVEO_NOTE_RICH?.isActive?.())window.SEYVEO_NOTE_RICH.insertText(insertion);
   else{textField.value+=insertion;textField.dispatchEvent(new Event('input',{bubbles:true}));}
   transcriptPanel.hidden=true;previewItem=null;
   void window.SEYVEO_NOTE_ATTACHMENTS.refreshEditor();
   if(openSayvi){
    const sayviButton=dialog.querySelector('[data-sv-smart-tool="sayvi"]');
    // Open the in-note helper, never the global chat.
    sayviButton?.click();
   }
  }catch(error){previewStatus.textContent=error?.message||'Не удалось сохранить расшифровку.';}
  finally{buttons.forEach(button=>button.disabled=false);}
 }
 preview('[data-transcript-add]').addEventListener('click',()=>{void applyTranscript(false);});
 preview('[data-transcript-sayvi]').addEventListener('click',()=>{void applyTranscript(true);});
 dialog.addEventListener('close',()=>{
  ++serial;pending=false;closeTranscript();
  if(pendingDownload){URL.revokeObjectURL(pendingDownload.url);pendingDownload=null;}
  if(current){const record=current;record.canceled=true;stopRecognition(record);
   try{if(record.recorder.state!=='inactive')record.recorder.stop();}catch{}release(record);current=null;}
  capture.hidden=true;
 });
 window.SEYVEO_NOTE_VOICE=Object.freeze({start,transcribe});
})();
