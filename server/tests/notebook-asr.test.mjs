import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {request as httpRequest} from 'node:http';
import {NoteAudioError,noteAudioFormat,transcribeNoteAudio,MAX_NOTE_AUDIO_BYTES} from '../note-audio-transcriber.mjs';
import {createRealLocalServer} from '../real-app-local.mjs';

test('private Whisper adapter accepts known audio, cleans up temporary files',async()=>{
 assert.equal(noteAudioFormat('audio/webm;codecs=opus'),'webm');
 assert.equal(noteAudioFormat('audio/mp4'),'m4a');
 assert.equal(noteAudioFormat('text/html'),null);
 const content=Buffer.from('synthetic-test-audio');
 let capturedFilename;
 const result=await transcribeNoteAudio(content,'audio/webm',{runner:async filename=>{
  capturedFilename=filename;
  assert.deepEqual(await readFile(filename),content);
  const info=await stat(filename);
  assert.ok(info.isFile());
  return '  Встреча в четверг.  ';
 }});
 assert.equal(result.text,'Встреча в четверг.');
 assert.equal(result.local,true);
 await assert.rejects(readFile(capturedFilename),{code:'ENOENT'});
 await assert.rejects(transcribeNoteAudio(Buffer.alloc(0),'audio/webm'),error=>error.code==='empty-audio');
 await assert.rejects(transcribeNoteAudio(Buffer.alloc(MAX_NOTE_AUDIO_BYTES+1),'audio/webm'),error=>error.code==='too-large');
 await assert.rejects(transcribeNoteAudio(content,'text/html'),error=>error.code==='unsupported-audio');
 assert.ok(new NoteAudioError('engine-missing') instanceof Error);
});

function send(port,{origin='http://127.0.0.1:8790',type='audio/webm',body=Buffer.from('audio-test')}={}){
 return new Promise((resolve,reject)=>{
  const req=httpRequest({hostname:'127.0.0.1',port,method:'POST',path:'/api/seyveo-note-transcribe',
   headers:{host:'127.0.0.1:8790',origin,'content-type':type,'content-length':body.length}},res=>{
    const chunks=[];res.on('data',chunk=>chunks.push(chunk));
    res.on('end',()=>resolve({status:res.statusCode,data:JSON.parse(Buffer.concat(chunks).toString('utf8'))}));
   });
  req.on('error',reject);req.end(body);
 });
}

test('local server transcribes only direct same-origin audio without storing it',async()=>{
 const calls=[];
 const server=createRealLocalServer({noteTranscriber:async(bytes,type)=>{
  calls.push({bytes,type});return {text:'Позвонить Роману вечером.'};
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const port=server.address().port;
  const denied=await send(port,{origin:'https://untrusted.invalid'});
  assert.equal(denied.status,403);assert.equal(calls.length,0);
  const wrong=await send(port,{type:'text/plain'});
  assert.equal(wrong.status,415);assert.equal(calls.length,0);
  const empty=await send(port,{body:Buffer.alloc(0)});
  assert.equal(empty.status,400);assert.equal(calls.length,0);
  const valid=await send(port,{body:Buffer.from('safe-synthetic-voice')});
  assert.equal(valid.status,200);
  assert.deepEqual(valid.data,{text:'Позвонить Роману вечером.',local:true,engine:'local-whisper'});
  assert.deepEqual(calls[0],{bytes:Buffer.from('safe-synthetic-voice'),type:'audio/webm'});
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('missing local model is reported honestly and no fake text is returned',async()=>{
 const server=createRealLocalServer({noteTranscriber:async()=>{throw new NoteAudioError('engine-missing');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const res=await send(server.address().port);
  assert.equal(res.status,503);
  assert.match(res.data.error,/install-note-transcription\.cmd/);
  assert.equal(Object.hasOwn(res.data,'text'),false);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
