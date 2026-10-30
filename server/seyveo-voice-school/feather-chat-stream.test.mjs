import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const server=readFileSync(resolve(here,'../real-app-local.mjs'),'utf8');
const chat=readFileSync(resolve(here,'../../assets/living-conversation.js'),'utf8');
const match=server.match(/const BRIDGE=("(?:\\.|[^"\\])*");/s);
assert(match,'The local streaming bridge must exist');
const bridge=JSON.parse(match[1]);
const play=new Function('window','question','syncComposer','composerIdle',
 'clearTimeout','composerMessage','document','CustomEvent','fetch',
 'TextDecoder','showWrittenReply','console','q',bridge);

test('Ollama streams directly into Feather Chat, then adds normal speaker actions',async()=>{
 const calls=[];
 const conversation={
  open:()=>calls.push(['open']),
  beginStream:q=>calls.push(['begin',q]),
  updateStream:a=>calls.push(['delta',a])
 };
 const window={SEYVEO_CONVERSATION:conversation,
  SEYVEO_LOCAL_PENDING:false,SEYVEO_LOCAL_CHAT_ACTIVE:false};
 const question={value:'Как дела?',focus(){}};
 const chunk=new TextEncoder().encode(
  JSON.stringify({type:'delta',text:'Привет, Роман!'})+'\n'+
  JSON.stringify({type:'done'})+'\n');
 let reads=0;
 const fetch=async()=>({ok:true,body:{getReader:()=>({
  read:async()=>reads++?{done:true}:{done:false,value:chunk}
 })}});
 const saved=[];
 const showWrittenReply=(q,a)=>saved.push({question:q,answer:a});
 class CustomEventMock{constructor(type,options){this.type=type;this.detail=options.detail}}
 play(window,question,()=>{},0,()=>{},()=>{},
  {dispatchEvent:()=>{}},CustomEventMock,fetch,TextDecoder,showWrittenReply,console,
  'Расскажи');
 await new Promise(ok=>setImmediate(ok));
 assert.deepEqual(calls[0],['open']);
 assert.deepEqual(calls[1],['begin','Расскажи']);
 assert(calls.some(c=>c[0]==='delta'&&c[1]==='Привет, Роман!'));
 assert.deepEqual(saved,[{question:'Расскажи',answer:'Привет, Роман!'}]);
 assert.equal(window.SEYVEO_LOCAL_PENDING,false);
 assert(!bridge.includes("panel.textContent="),'Legacy plain-text transcript must not replace Feather Chat');
});

test('Chat finishes using its normal speaker-button reply actions',()=>{
 assert.match(chat,/replyAction\('Озвучить',SOUND_ICON,\(\)=>readReply\(answer\)\)/);
 assert.match(chat,/window\.SEYVEO_CONVERSATION=\{open,close,renderTurns,beginStream,updateStream,status\}/);
 assert.match(server,/showWrittenReply\(q,answer\.trim\(\)\)/);
});
