import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const js=readFileSync(resolve(here,'../../assets/seyveo-private-voice.js'),'utf8');

function harness(fakeFetch){
 const states=[];
 let resumes=0;
 const played=[];
 class AudioContextMock{
  state='suspended';
  resume(){resumes++;this.state='running';return Promise.resolve();}
  decodeAudioData(){return Promise.resolve({duration:1});}
  createBufferSource(){
   const node={buffer:null,onended:null,
    connect(){},disconnect(){},
    start(){played.push(node);},
    stop(){node.onended?.()}
   };
   return node;
  }
  get destination(){return {}}
 }
 const window={
  AudioContext:AudioContextMock,
  addEventListener(){},
  SEYVEO_CONVERSATION_STOP_SPEECH:()=>{}
 };
 const document={dispatchEvent:event=>states.push({type:event.type,...event.detail})};
 class CustomEventMock{constructor(type,options={}){this.type=type;this.detail=options.detail;}}
 runInNewContext(js,{
  window,document,fetch:fakeFetch,AbortController,
  CustomEvent:CustomEventMock,console
 });
 return {window,states,played,resumes:()=>resumes};
}

test('The click unlocks audio before fetch finishes; no false speaking or loading Stop state',async()=>{
 let release;
 const fetch=new Promise(resolve=>{release=resolve});
 const demo=harness(()=>fetch);
 const pending=demo.window.SEYVEO_CONVERSATION_READ_REPLY('Привет, я Сэйви');
 assert.equal(demo.resumes(),1);
 assert.equal(demo.states.at(-1).stage,'preparing');
 assert.equal(demo.played.length,0);
 assert(!demo.states.some(e=>e.type==='seyveo:assistant-presence'&&e.phase==='speaking'));
 release({ok:true,arrayBuffer:async()=>new ArrayBuffer(64)});
 await pending;
 assert.equal(demo.played.length,1);
 assert.equal(demo.states.at(-1).stage,'playing');
 demo.played[0].onended();
 assert.equal(demo.states.at(-1).stage,'idle');
});

test('A second tap cancels pending voice without playing late audio',async()=>{
 let release;
 const fetch=new Promise(resolve=>{release=resolve});
 const demo=harness(()=>fetch);
 const first=demo.window.SEYVEO_CONVERSATION_READ_REPLY('Привет, я Сэйви');
 await demo.window.SEYVEO_CONVERSATION_READ_REPLY('Привет, я Сэйви');
 release({ok:true,arrayBuffer:async()=>new ArrayBuffer(64)});
 await first;
 assert.equal(demo.played.length,0);
 assert.equal(demo.states.at(-1).stage,'idle');
});

test('An error is surfaced as voice status instead of freezing the chat',async()=>{
 const demo=harness(async()=>({ok:false,json:async()=>({error:'Голосовая модель не ответила'})}));
 await demo.window.SEYVEO_CONVERSATION_READ_REPLY('Привет');
 assert.equal(demo.states.at(-1).stage,'error');
 assert.match(demo.states.at(-1).message,/Голосовая модель/);
 assert.equal(demo.played.length,0);
});

test('Only approved local TTS is used; browser synthetic voice is never fallback',()=>{
 assert.doesNotMatch(js,/speechSynthesis\s*\.\s*speak/);
 assert.match(js,/\/api\/seyveo-private-tts/);
});


test('Approved voice plays at natural speed without time-stretching',()=>{
 assert.doesNotMatch(js,/playbackRate\s*=\s*1\.12/);
 assert.doesNotMatch(js,/preservesPitch\s*=/);
 assert.match(js,/context\.createBufferSource\(\)/);
});
