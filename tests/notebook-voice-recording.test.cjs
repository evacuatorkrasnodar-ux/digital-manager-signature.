const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const attachments=read('assets/seyveo-note-attachments.js');
const voice=read('assets/seyveo-note-voice.js');
const css=read('assets/seyveo-note-voice.css');

test('recording lives in attachment menu and does not replace the approved dock',()=>{
 assert.match(html,/data-note-attachment="record"[\s\S]*?<span>Записать аудио<\/span>/);
 assert.match(html,/data-note-attachment="voice"[\s\S]*?<span>Диктовка<\/span>/);
 assert.match(html,/action==='record'[\s\S]*?SEYVEO_NOTE_VOICE\?\.start\(\)/);
 assert.match(html,/seyveo-note-attachments\.js\?v=5/);
 assert.match(html,/seyveo-note-voice\.js\?v=2/);
 assert.match(html,/seyveo-note-voice\.css\?v=2/);
 assert.match(voice,/form\.insertBefore\(capture,attachmentList\)/);
 assert.doesNotMatch(voice,/location\.href|location\.assign|openChat/);
});

test('recording is real and stored as an audio blob beside the note, without upload',()=>{
 assert.match(voice,/navigator\.mediaDevices\.getUserMedia/);
 assert.match(voice,/new MediaRecorder\(stream/);
 assert.match(voice,/recorder\.ondataavailable/);
 assert.match(voice,/recorder\.pause\(\)/);
 assert.match(voice,/recorder\.resume\(\)/);
 assert.match(voice,/new Blob\(record\.chunks/);
 assert.match(voice,/SEYVEO_NOTE_ATTACHMENTS\.saveRecordedAudio\(blob/);
 assert.match(attachments,/DB_NAME='seyveo-notebook-files-v1'/);
 assert.match(attachments,/kind:'voice',durationMs/);
 assert.match(attachments,/MAX_FILE=10\*1024\*1024,MAX_PER_NOTE=12/);
 assert.doesNotMatch(voice,/fetch\(['"]https?:\/\/|XMLHttpRequest|WebSocket/);
});

test('transcription requires explicit opt-in and user review before text insertion',()=>{
 assert.match(voice,/input type="checkbox" data-voice-recognize/);
 assert.match(voice,/recognize\.checked=false/);
 assert.match(voice,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/);
 assert.match(voice,/speech\.onresult/);
 assert.match(voice,/data-transcript-add/);
 assert.match(voice,/data-transcript-run/);
 assert.match(voice,/location\.origin!=='http:\/\/127\.0\.0\.1:8790'/);
 assert.match(voice,/fetch\('\/api\/seyveo-note-transcribe'/);
 assert.match(voice,/body:item\.blob,signal:controller\.signal/);
 assert.match(voice,/transcriptAbort\?\.abort\(\)/);
 assert.match(voice,/if\(!response\.ok\)throw Error/);
 assert.match(voice,/updateTranscript\(item\.noteId,item\.id,text\)/);
 assert.match(voice,/textField\.dispatchEvent\(new Event\('input'/);
 assert.match(voice,/data-sv-smart-tool="sayvi"/);
 assert.match(voice,/Аудио сохранено/);
 assert.match(attachments,/const audio=new Audio\(url\)/);
 assert.match(attachments,/toText\.textContent='В текст'/);
 assert.match(css,/--sv-dock-pearl-bg/);
});

test('the existing File action recognizes imported voice recordings without a second menu item',()=>{
 const block=attachments.slice(attachments.indexOf(' const AUDIO_TYPES='),attachments.indexOf(' let dbPromise='));
 const audioTypeFor=new Function(block+'\nreturn audioTypeFor;')();
 assert.equal(audioTypeFor({name:'Голос.m4a',type:'audio/x-m4a'}),'audio/mp4');
 assert.equal(audioTypeFor({name:'Голос.m4a',type:''}),'audio/mp4');
 assert.equal(audioTypeFor({name:'Лекция.mp3',type:'audio/mpeg'}),'audio/mpeg');
 assert.equal(audioTypeFor({name:'Заметка.wav',type:'audio/x-wav'}),'audio/wav');
 assert.equal(audioTypeFor({name:'Запись.webm',type:'audio/webm;codecs=opus'}),'audio/webm');
 assert.equal(audioTypeFor({name:'Видео.mp4',type:'video/mp4'}),null);
 assert.equal(audioTypeFor({name:'Документ.pdf',type:'application/pdf'}),null);
 assert.match(attachments,/kind:'voice',imported:true,durationMs:0,transcript:''/);
 assert.match(attachments,/audioCard\(playable,canRemove,urls\)/);
 assert.match(attachments,/entry\.kind==='voice'\|\|audioTypeFor\(entry\)/);
 assert.match(html,/data-note-attachment="file"/);
 assert.doesNotMatch(html,/data-note-attachment="audio"/);
});

test('numeric and default audio names display a recording date without renaming the stored file',()=>{
 const block=attachments.slice(attachments.indexOf(' function audioDisplayName('),attachments.indexOf(' function appendRemove('));
 const audioDisplayName=new Function(block+'\nreturn audioDisplayName;')();
 const recordedAt=Date.UTC(2026,10,20,9,36);
 const imported={name:'5188286224023987367.ogg',createdAt:recordedAt,imported:true};
 assert.match(audioDisplayName(imported),/^Запись · /);
 assert.doesNotMatch(audioDisplayName(imported),/5188286224023987367|\.ogg/);
 assert.match(audioDisplayName({...imported,fileLastModified:Date.UTC(2026,10,18,9,36)}),/18 нояб/);
 assert.match(audioDisplayName({name:'Голосовая запись 09:36.webm',createdAt:recordedAt}),/^Запись · /);
 assert.equal(audioDisplayName({name:'Интервью с командой.m4a',createdAt:recordedAt}),'Интервью с командой.m4a');
 assert.match(attachments,/title\.title=item\.name\|\|''/);
});
