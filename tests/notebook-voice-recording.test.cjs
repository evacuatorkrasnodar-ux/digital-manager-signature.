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
 assert.match(html,/seyveo-note-attachments\.js\?v=3/);
 assert.match(html,/seyveo-note-voice\.js\?v=1/);
 assert.match(html,/seyveo-note-voice\.css\?v=1/);
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
 assert.doesNotMatch(voice,/fetch\(|XMLHttpRequest|WebSocket/);
});

test('transcription requires explicit opt-in and user review before text insertion',()=>{
 assert.match(voice,/input type="checkbox" data-voice-recognize/);
 assert.match(voice,/recognize\.checked=false/);
 assert.match(voice,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/);
 assert.match(voice,/speech\.onresult/);
 assert.match(voice,/data-transcript-add/);
 assert.match(voice,/updateTranscript\(item\.noteId,item\.id,text\)/);
 assert.match(voice,/textField\.dispatchEvent\(new Event\('input'/);
 assert.match(voice,/data-sv-smart-tool="sayvi"/);
 assert.match(voice,/Аудио сохранено/);
 assert.match(attachments,/const audio=new Audio\(url\)/);
 assert.match(attachments,/toText\.textContent='В текст'/);
 assert.match(css,/--sv-dock-pearl-bg/);
});
