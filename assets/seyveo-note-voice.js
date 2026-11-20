/* SEYVEO Smart Notebook · one-touch in-note voice transcription.
   Original audio stays in IndexedDB. Offline Whisper runs only on the user's
   own localhost server; live browser recognition remains explicit opt-in. */
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
 const $=selector=>capture.querySelector(selector);
 const timer=$('[data-voice-timer]'),hint=$('[data-voice-hint]'),state=$('[data-voice-state]');
 const pauseBtn=$('[data-voice-pause]'),stopBtn=$('[data-voice-stop]'),cancelBtn=$('[data-voice-cancel]');
 const recognize=$('[data-voice-recognize]');
 let current=null,serial=0,pending=false,pendingDownload=null,transcriptAbort=null;
 const undoTimers=new Map(),undoHandlers=new Map();
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
  if(!dialog.open||current||pending||transcriptAbort)return;
  if(pendingDownload){URL.revokeObjectURL(pendingDownload.url);pendingDownload=null;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
   capture.hidden=false;state.textContent='Микрофон недоступен';
   hint.textContent='Нужен современный браузер и защищённая страница (HTTPS или localhost).';
   pauseBtn.disabled=true;stopBtn.disabled=true;recognize.disabled=true;
   cancelBtn.textContent='Закрыть';return;
  }
  ++serial;pending=true;
  const id=serial;
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
 const notesApi=()=>window.SEYVEO_NOTES_API;
 const noteFor=item=>notesApi()?.getNotes?.().find(note=>note.id===item.noteId);
 const sameNote=item=>dialog.open&&dialog.dataset.noteId===item.noteId;
 const isInserted=(note,id)=>Array.isArray(note?.voiceTranscriptIds)&&note.voiceTranscriptIds.includes(id);
 function transcriptPresent(note,text){
  const value=String(text||'').trim(),body=String(note?.text||'');
  return Boolean(value)&&(body===value||body.endsWith('\n\n'+value)||
   body.startsWith(value+'\n\n')||body.includes('\n\n'+value+'\n\n'));
 }
 function setButton(button,label,mode){
  if(!button)return;
  button.textContent=label;
  button.dataset.voiceState=mode;
  button.setAttribute('aria-label',mode==='done'?'Распознанный текст уже в заметке':
   mode==='undo'?'Отменить вставку текста':label);
  button.disabled=mode==='busy'||mode==='done';
  if(mode==='busy')button.setAttribute('aria-busy','true');
  else button.removeAttribute('aria-busy');
 }
 function feedback(button,message){
  const card=button?.closest('.sv-note-audio');if(!card)return;
  let status=card.querySelector('.sv-note-audio-feedback');
  if(!status){status=document.createElement('small');status.className='sv-note-audio-feedback';
   status.setAttribute('role','status');status.setAttribute('aria-live','polite');card.append(status);}
  status.textContent=message||'';status.hidden=!message;
 }
 function markInserted(item,inserted){
  const api=notesApi(),notes=api?.getNotes?.();
  if(!Array.isArray(notes)||!notes.some(note=>note.id===item.noteId))throw Error('Заметка не найдена.');
  const next=notes.map(note=>{
   if(note.id!==item.noteId)return note;
   const ids=Array.isArray(note.voiceTranscriptIds)?note.voiceTranscriptIds:[];
   return {...note,voiceTranscriptIds:inserted?[...new Set([...ids,item.id])]:ids.filter(id=>id!==item.id)};
  });
  if(!api.putNotes(next))throw Error('Не удалось сохранить результат в заметке.');
 }
 function snapshot(){return {body:textField.value,rich:window.SEYVEO_NOTE_RICH?.getHTML?.()||''};}
 function restore(saved){
  window.SEYVEO_NOTE_RICH?.load?.(saved.rich);
  textField.value=saved.body;
  textField.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function insertIntoNote(item,text){
  if(!sameNote(item)||!noteFor(item))throw Error('Заметка уже закрыта.');
  if(isInserted(noteFor(item),item.id))return {already:true};
  const existing=snapshot();
  const insertion=(existing.body.trim()?'\n\n':'')+text;
  const title=document.getElementById('svNoteTitle')?.value.trim()||'';
  if(existing.body.length+insertion.length+title.length+(title?2:0)>8000)
   throw Error('В заметке недостаточно места для текста записи.');
  try{
   if(window.SEYVEO_NOTE_RICH?.isActive?.()){
    if(!window.SEYVEO_NOTE_RICH.appendText(insertion))throw Error('Не удалось вставить текст.');
   }else{
    textField.value+=insertion;
    textField.dispatchEvent(new Event('input',{bubbles:true}));
   }
   if(window.SEYVEO_NOTES_EDITOR?.ensureRecord?.()!==item.noteId)
    throw Error('Не удалось сохранить текст заметки.');
   markInserted(item,true);
  }catch(error){
   restore(existing);window.SEYVEO_NOTES_EDITOR?.ensureRecord?.();
   throw error;
  }
  const inserted=snapshot();
  return {undo(){
   if(!sameNote(item)||!isInserted(noteFor(item),item.id))return false;
   const now=snapshot();
   if(now.body!==inserted.body||now.rich!==inserted.rich)return false;
   restore(existing);
   if(window.SEYVEO_NOTES_EDITOR?.ensureRecord?.()!==item.noteId){restore(inserted);return false;}
   try{markInserted(item,false);return true;}
   catch{restore(inserted);window.SEYVEO_NOTES_EDITOR?.ensureRecord?.();return false;}
  }};
 }
 function presentUndo(item,button,undo){
  const previous=undoTimers.get(item.id);if(previous)clearTimeout(previous);
  undoHandlers.set(item.id,undo);
  setButton(button,'Отменить','undo');
  const timer=setTimeout(()=>{
   undoTimers.delete(item.id);undoHandlers.delete(item.id);
   if(sameNote(item))setButton(button,'В заметке','done');
  },10000);
  undoTimers.set(item.id,timer);
 }
 async function transcribe(item,button){
  if(!sameNote(item)||current||pending||!button)return;
  if(button.dataset.voiceState==='undo'){
   const undo=undoHandlers.get(item.id);
   if(!undo)return;
   clearTimeout(undoTimers.get(item.id));undoTimers.delete(item.id);undoHandlers.delete(item.id);
   if(undo()){setButton(button,'Распознать','idle');feedback(button,'Вставка отменена.');}
   else{setButton(button,'В заметке','done');feedback(button,'Текст уже изменён. Его можно исправить вручную.');}
   return;
  }
  if(transcriptAbort||button.dataset.voiceState==='busy'){
   if(button.dataset.voiceState!=='busy')feedback(button,'Дождись завершения текущего распознавания.');
   return;
  }
  const oldNote=noteFor(item);
  if(!oldNote)return;
  if(isInserted(oldNote,item.id)||transcriptPresent(oldNote,item.transcript)){
   if(!isInserted(oldNote,item.id))try{markInserted(item,true);}catch{}
   setButton(button,'В заметке','done');feedback(button,'');return;
  }
  const cached=String(item.transcript||'').trim();
  if(!cached&&location.origin!=='http://127.0.0.1:8790'){
   feedback(button,'Распознавание доступно в локальном SEYVEO на ПК. Аудио сохранено.');return;
  }
  setButton(button,'Распознаю…','busy');feedback(button,'');
  const controller=new AbortController();transcriptAbort=controller;
  const timeout=setTimeout(()=>controller.abort(),270000);
  try{
   let text=cached;
   if(!text){
    const response=await fetch('/api/seyveo-note-transcribe',{
     method:'POST',credentials:'same-origin',
     headers:{'Content-Type':item.type||'audio/webm'},body:item.blob,signal:controller.signal
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||'Локальное распознавание недоступно.');
    if(typeof data.text!=='string'||!data.text.trim())throw Error('Речь не распознана. Аудио сохранено.');
    text=data.text.trim();
    if(controller.signal.aborted||!sameNote(item))return;
    await window.SEYVEO_NOTE_ATTACHMENTS.updateTranscript(item.noteId,item.id,text);
    item.transcript=text;
   }
   if(controller.signal.aborted||!sameNote(item))return;
   if(transcriptPresent(noteFor(item),text)){
    markInserted(item,true);setButton(button,'В заметке','done');return;
   }
   const result=insertIntoNote(item,text);
   if(result.already){setButton(button,'В заметке','done');return;}
   presentUndo(item,button,result.undo);
  }catch(error){
   if(sameNote(item)){
    setButton(button,'Распознать','idle');
    feedback(button,controller.signal.aborted?'Распознавание не завершилось вовремя. Аудио сохранено.':
     error?.message||'Не удалось распознать речь. Аудио сохранено.');
   }
  }finally{
   clearTimeout(timeout);if(transcriptAbort===controller)transcriptAbort=null;
   if(button.dataset.voiceState==='busy')setButton(button,'Распознать','idle');
  }
 }
 dialog.addEventListener('close',()=>{
  ++serial;pending=false;transcriptAbort?.abort();transcriptAbort=null;
  for(const timer of undoTimers.values())clearTimeout(timer);
  undoTimers.clear();undoHandlers.clear();
  if(pendingDownload){URL.revokeObjectURL(pendingDownload.url);pendingDownload=null;}
  if(current){const record=current;record.canceled=true;stopRecognition(record);
   try{if(record.recorder.state!=='inactive')record.recorder.stop();}catch{}release(record);current=null;}
  capture.hidden=true;
 });
 window.SEYVEO_NOTE_VOICE=Object.freeze({start,transcribe});
})();
