import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const js=readFileSync(resolve(here,'../../assets/seyveo-private-voice.js'),'utf8');
const flush=()=>new Promise(ok=>setImmediate(ok));

function harness(fakeFetch){
 const states=[],played=[];
 let resumes=0;
 class AudioContextMock{
  state='suspended';
  resume(){resumes++;this.state='running';return Promise.resolve()}
  decodeAudioData(){return Promise.resolve({duration:1})}
  createBufferSource(){
   const node={buffer:null,onended:null,connect(){},disconnect(){},start(){played.push(node)},stop(){node.onended?.()}};
   return node;
  }
  get destination(){return {}}
 }
 const window={AudioContext:AudioContextMock,addEventListener(){},SEYVEO_CONVERSATION_STOP_SPEECH:()=>{}};
 const document={dispatchEvent:event=>states.push({type:event.type,...event.detail})};
 class CustomEventMock{constructor(type,options={}){this.type=type;this.detail=options.detail}}
 runInNewContext(js,{window,document,fetch:fakeFetch,AbortController,CustomEvent:CustomEventMock,console});
 return {window,states,played,resumes:()=>resumes};
}

test('Speaker unlocks WebAudio on click and only plays when voice is ready',async()=>{
 let release;
 const pendingAudio=new Promise(resolve=>{release=resolve});
 const demo=harness(()=>pendingAudio);
 const pending=demo.window.SEYVEO_CONVERSATION_READ_REPLY('Привет, я Сэйви');
 assert.equal(demo.resumes(),1,'unlock must start synchronously on click');
 await pending;await flush();
 assert.equal(demo.states.at(-1).stage,'preparing');
 assert.equal(demo.played.length,0);
 assert(!demo.states.some(x=>x.type==='seyveo:assistant-presence'&&x.phase==='speaking'));
 release({ok:true,arrayBuffer:async()=>new ArrayBuffer(64)});
 await flush();
 assert.equal(demo.played.length,1);
 assert.equal(demo.states.at(-1).stage,'playing');
 demo.played[0].onended();
 assert.equal(demo.states.at(-1).stage,'idle');
});

test('Second tap during unlock cancels the queued voice',async()=>{
 let releaseUnlock;
 const unlock=new Promise(ok=>{releaseUnlock=ok});
 let fetchCalls=0;
 const demo=harness(()=>{fetchCalls++;return Promise.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(64)})});
 // The ordinary mock unlock resolves promptly, but two calls in one click
 // cycle must still be a cancel, not two separate audio requests.
 const p=demo.window.SEYVEO_CONVERSATION_READ_REPLY('Привет!');
 await demo.window.SEYVEO_CONVERSATION_READ_REPLY('Привет!');
 await p;await flush();
 assert.equal(fetchCalls,0);
 assert.equal(demo.played.length,0);
 assert.equal(demo.states.at(-1).stage,'idle');
 void unlock;void releaseUnlock;
});

test('Long replies are spoken in consecutive bounded phrases, never first 450 characters only',async()=>{
 const asked=[];
 const demo=harness(async(_url,options)=>{
  asked.push(JSON.parse(options.body).text);
  return {ok:true,arrayBuffer:async()=>new ArrayBuffer(64)};
 });
 const message=('Роман, доброе утро! Я проверила все дела и хочу тебе кое-что рассказать. ').repeat(12);
 await demo.window.SEYVEO_CONVERSATION_READ_REPLY(message);
 await flush();
 assert.equal(demo.played.length,1);
 assert(asked[0].length<=420);
 demo.played[0].onended();
 await flush();
 assert(asked.length>=2,'next phrase must be requested');
 assert(asked[1].length<=420);
 assert.equal(demo.played.length,2);
 let pos=1;
 while(pos<20 && demo.played[pos]){
  demo.played[pos].onended();
  await flush();
  pos++;
 }
 assert(asked.join(' ').length>=message.trim().length-3,'all text must be covered');
});

test('HTTP errors appear as visible status and never leave a stuck Stop state',async()=>{
 const demo=harness(async()=>({ok:false,json:async()=>({error:'Голосовая модель не ответила'})}));
 await demo.window.SEYVEO_CONVERSATION_READ_REPLY('Привет');
 await flush();
 assert.equal(demo.states.at(-1).stage,'error');
 assert.match(demo.states.at(-1).message,/Голосовая модель/);
 assert.equal(demo.played.length,0);
});

test('Approved voice uses natural speed and no browser synthetic fallback',()=>{
 assert.doesNotMatch(js,/playbackRate\s*=\s*1\.12/);
 assert.doesNotMatch(js,/speechSynthesis\s*\.\s*speak/);
 assert.match(js,/context\.createBufferSource\(\)/);
 assert.match(js,/\/api\/seyveo-private-tts/);
});
