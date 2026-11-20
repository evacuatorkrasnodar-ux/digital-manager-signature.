const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html');
const attachments=read('assets/seyveo-note-attachments.js');
const voice=read('assets/seyveo-note-voice.js');
const smart=read('assets/seyveo-smart-note-ink.js');
const css=read('assets/seyveo-note-voice.css');
const rich=read('assets/seyveo-note-richtext.js');

test('one contextual microphone offers separate voice recording and dictation',()=>{
 assert.match(smart,/data-sv-ink-tool="voice"/);
 assert.match(smart,/data-sv-voice-action="dictate"/);
 assert.match(smart,/data-sv-voice-action="record"/);
 assert.match(smart,/SEYVEO_NOTE_VOICE\.start\(\)/);
 assert.match(smart,/dlg\.querySelector\('\[data-note-tool="voice"\]'\)\?\.click\(\)/);
 assert.match(html,/data-note-attachment="camera"/);
 assert.match(html,/data-note-attachment="file"/);
 assert.doesNotMatch(html,/data-note-attachment="(?:record|voice|photo)"/);
 assert.match(html,/SEYVEO_NOTE_SCANNER\?\.scanIntoNote\?\.\(\)/);
 assert.match(html,/SEYVEO_NOTE_ATTACHMENTS\?\.choose\('file'\)/);
 assert.match(html,/seyveo-smart-note-ink\.js\?v=12/);
 assert.match(html,/seyveo-note-richtext\.js\?v=3/);
 assert.match(html,/seyveo-note-attachments\.js\?v=9/);
 assert.match(html,/seyveo-note-voice\.js\?v=3/);
 assert.match(html,/seyveo-note-voice\.css\?v=6/);
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

test('one tap transcribes into the note without opening a second editor or chat',()=>{
 assert.match(voice,/input type="checkbox" data-voice-recognize/);
 assert.match(voice,/recognize\.checked=false/);
 assert.match(voice,/window\.SpeechRecognition\|\|window\.webkitSpeechRecognition/);
 assert.match(voice,/speech\.onresult/);
 assert.doesNotMatch(voice,/transcriptPanel|previewItem|data-transcript-add|data-transcript-run|data-transcript-text/);
 assert.doesNotMatch(css,/\.sv-note-voice-transcript|data-transcript-/);
 assert.match(voice,/location\.origin!=='http:\/\/127\.0\.0\.1:8790'/);
 assert.match(voice,/fetch\('\/api\/seyveo-note-transcribe'/);
 assert.match(voice,/body:item\.blob,signal:controller\.signal/);
 assert.match(voice,/transcriptAbort\?\.abort\(\)/);
 assert.match(voice,/if\(!response\.ok\)throw Error/);
 assert.match(voice,/updateTranscript\(item\.noteId,item\.id,text\)/);
 assert.match(voice,/textField\.dispatchEvent\(new Event\('input'/);
 assert.match(voice,/SEYVEO_NOTES_EDITOR\?\.ensureRecord\?\.\(\)/);
 assert.match(rich,/function appendText\(text\)/);
 assert.match(voice,/SEYVEO_NOTE_RICH\.appendText\(insertion\)/);
 assert.doesNotMatch(voice,/data-sv-smart-tool="sayvi"|location\.href|location\.assign|openChat/);
 assert.match(attachments,/const audio=new Audio\(url\)/);
 assert.match(attachments,/inserted\?'В заметке':'Распознать'/);
 assert.match(attachments,/transcribe\(item,toText\)/);
 assert.match(css,/--sv-dock-pearl-bg/);
});

test('insertion is idempotent and offers safe inline undo without removing original audio',()=>{
 const block=voice.slice(voice.indexOf(' function transcriptPresent('),voice.indexOf(' function setButton('));
 const transcriptPresent=new Function(block+'\nreturn transcriptPresent;')();
 assert.equal(transcriptPresent({text:'Название\n\nРаз, два, три.'},'Раз, два, три.'),true);
 assert.equal(transcriptPresent({text:'Раз, два, три.\n\nДополнение'},'Раз, два, три.'),true);
 assert.equal(transcriptPresent({text:'Речь содержит три слова'},'три'),false);
 assert.match(voice,/voiceTranscriptIds/);
 assert.match(voice,/isInserted\(noteFor\(item\),item\.id\)/);
 assert.match(voice,/markInserted\(item,true\)/);
 assert.match(voice,/markInserted\(item,false\)/);
 assert.match(voice,/setButton\(button,'Отменить','undo'\)/);
 assert.match(voice,/setTimeout\(\(\)=>\{[\s\S]*?\},10000\)/);
 assert.match(voice,/now\.body!==inserted\.body\|\|now\.rich!==inserted\.rich/);
 assert.match(voice,/snapshot\(\)/);
 assert.match(voice,/restore\(existing\)/);
 assert.match(attachments,/voiceTranscriptIds/);
 assert.doesNotMatch(voice,/removeAttachment\(/);
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

test('audio card has centered symmetric waveform, quiet vector play and plain remove cross',()=>{
 const wave=attachments.match(/\[([\d,\s]+)\]\.forEach\(\(height,index\)=>\{/);
 assert.ok(wave,'sound bars must be present');
 const heights=wave[1].split(',').map(Number);
 assert.deepEqual(heights,heights.slice().reverse(),'waveform should mirror around its center');
 assert.equal(heights.length,49,'long and delicate waveform uses 49 strokes');
 assert.ok(Math.max(...heights)<=20,'strokes stay thin and quiet');
 assert.match(attachments,/play\.innerHTML=playing\?pauseIcon:playIcon/);
 assert.match(attachments,/remove\.className='sv-note-file-remove'\+\(isAudio\?' sv-note-audio-remove'/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) 26px!important/);
 assert.match(css,/\.sv-note-audio-remove\{[\s\S]*?background:transparent!important/);
});

test('Apple-style audio layout keeps title and close above one aligned playback row',()=>{
 assert.match(attachments,/title\.className='sv-note-audio-title'/);
 assert.match(attachments,/controls\.className='sv-note-audio-controls'/);
 assert.match(attachments,/controls\.append\(play,waveform,time\);card\.append\(title,controls\)/);
 assert.match(attachments,/controls\.append\(toText\)/);
 assert.match(attachments,/playIcon=[^\n]+fill="none" stroke="currentColor"/);
 assert.match(css,/\.sv-note-audio-title\{[\s\S]*?grid-row:1!important/);
 assert.match(css,/\.sv-note-audio-controls\{[\s\S]*?grid-row:2!important;[\s\S]*?align-items:center!important/);
 assert.match(css,/\.sv-note-audio-remove\{[\s\S]*?grid-row:1!important/);
});

test('waveform animates only while audio plays and tracks seek position',()=>{
 assert.match(css,/\.sv-note-audio-playing \.sv-note-audio-wave i\{[\s\S]*?animation:sv-note-audio-live/);
 assert.match(css,/@keyframes sv-note-audio-live/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(attachments,/waveform\.setAttribute\('role','slider'\)/);
 assert.match(attachments,/waveform\.addEventListener\('click'/);
 assert.match(attachments,/waveform\.addEventListener\('keydown'/);
 assert.match(attachments,/waveform\.children\[i\]\.classList\.toggle\('sv-note-audio-heard',i<heard\)/);
 assert.match(attachments,/card\.classList\.toggle\('sv-note-audio-playing',playing\)/);
});
