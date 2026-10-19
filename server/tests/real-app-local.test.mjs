import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMemoryStore} from '../local-memory.mjs';
import {request as httpRequest} from 'node:http';
import {Script} from 'node:vm';
import {createRealLocalServer,adaptOriginalHome} from '../real-app-local.mjs';

const HOST='127.0.0.1',PORT=8790,ORIGIN='http://127.0.0.1:8790';
function request(path,{method='GET',headers={},data}={}){
 return new Promise((resolve,reject)=>{
  const req=httpRequest({hostname:HOST,port:PORT,path,method,headers},res=>{
   const chunks=[];
   res.on('data',v=>chunks.push(v));
   res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString('utf8')}));
  });
  req.on('error',reject);
  if(data!==undefined)req.write(JSON.stringify(data));
  req.end();
 });
}

test('Original main page is rendered unchanged except local reply integration',async()=>{
 const original=await readFile(new URL('../../index.html',import.meta.url),'utf8');
 const adapted=adaptOriginalHome(original);
 assert.match(adapted,/id="plasmaVisual"/);
 assert.match(adapted,/src="assets\/plasma-signature.svg\?v=13"/);
 assert.match(adapted,/id="homePage"/);
 assert.match(adapted,/window\.SEYVEO_LOCAL_PENDING=true/);
 const form=adapted.slice(adapted.indexOf("$('ask').addEventListener('submit'"));
 assert.ok(form.indexOf('const memo=')>=0);
 assert.ok(form.indexOf('const memo=')<form.indexOf("if(composerMode==='notes')"));
 assert.match(adapted,/\/api\/seyveo-stream/);
 assert.doesNotMatch(adapted,/const answer=getDemoAnswer\(q\)/);
 assert.equal(original.includes('window.SEYVEO_LOCAL_PENDING'),false);
 assert.throws(()=>adaptOriginalHome('A fake homepage'),/handler changed/);
 const inlineScripts=[...adapted.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(v=>v.trim());
 for(const inline of inlineScripts)new Script(inline);
});

test('Actual app with private Ollama is served on loopback and refuses foreign requests',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-http-memory-'));
 const server=createRealLocalServer({memoryStore:createMemoryStore(join(dir,'notes.json'))});
 await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(PORT,HOST,resolve);
 });
 const oldFetch=globalThis.fetch;
 try{
  const home=await request('/');
  assert.equal(home.status,200);
  assert.match(home.body,/id="orb"/);
  assert.match(home.body,/\/api\/seyveo-stream/);
  assert.match(home.body,/Запомни/);
  assert.match(home.body,/api\/seyveo-memory/);
  assert.match(home.headers['content-security-policy'],/connect-src 'self'/);
  const svg=await request('/assets/plasma-signature.svg?v=13');
  assert.equal(svg.status,200);
  assert.match(svg.body,/Полупрозрачная стеклянная плазма/);
  const privateFile=await request('/server/hybrid-core.mjs');
  assert.equal(privateFile.status,404);
  const serviceWorker=await request('/sw.js');
  assert.equal(serviceWorker.status,404);
  const foreign=await request('/api/seyveo-ask',{
   method:'POST',headers:{origin:'https://other.example','content-type':'application/json'},
   data:{message:'Привет'}
  });
  assert.equal(foreign.status,403);
  const wrongType=await request('/api/seyveo-ask',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'text/plain'},data:{message:'Привет'}
  });
  assert.equal(wrongType.status,415);
  let received=null;
  globalThis.fetch=async(url,opts)=>{
   received={url,opts};
   return {ok:true,json:async()=>({message:{content:'Я локальный Феликс SEYVEO!'}})};
  };
  const ok=await request('/api/seyveo-ask',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
   data:{message:'Привет!'}
  });
  assert.equal(ok.status,200);
  const data=JSON.parse(ok.body);
  assert.equal(data.text,'Я локальный Феликс SEYVEO!');
  assert.equal(data.cloud,false);
  assert.equal(data.executed,false);
  assert.equal(received.url,'http://127.0.0.1:11434/api/chat');
  assert.equal(JSON.parse(received.opts.body).model,'qwen3:4b-instruct');
  // Explicit memory is server-side and only saved on command.
  const empty=await request('/api/seyveo-memory');
  assert.equal(empty.status,200);
  assert.deepEqual(JSON.parse(empty.body).items,[]);
  const forbidden=await request('/api/seyveo-memory',{
   method:'POST',headers:{origin:'https://bad.example','content-type':'application/json'},
   data:{action:'add',text:'Недоверенная заметка'}
  });
  assert.equal(forbidden.status,403);
  const secret=await request('/api/seyveo-memory',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
   data:{action:'add',text:'Пароль к почте: 123456789'}
  });
  assert.equal(secret.status,400);
  const saved=await request('/api/seyveo-memory',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
   data:{action:'add',text:'Наш первый проект — автоматизация заявок.'}
  });
  assert.equal(saved.status,200);
  const memo=JSON.parse(saved.body).items;
  assert.equal(memo.length,1);
  assert.equal(memo[0].text,'Наш первый проект — автоматизация заявок.');

  // Stream must deliver model tokens through the original page endpoint.
  const packets=[
   {message:{role:'assistant',content:'Наш '},done:false},
   {message:{role:'assistant',content:'Феликс отвечает.'},done:false},
   {message:{role:'assistant',content:''},done:true}
  ];
  const encoder=new TextEncoder();
  let captured=null;
  globalThis.fetch=async(url,opts)=>{
   captured={url,opts};
   return {ok:true,body:new ReadableStream({
    start(ctrl){
     for(const packet of packets)ctrl.enqueue(encoder.encode(JSON.stringify(packet)+'\n'));
     ctrl.close();
    }
   })};
  };
  const stream=await request('/api/seyveo-stream',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
   data:{message:'Ответь коротко'}
  });
  assert.equal(stream.status,200);
  assert.match(stream.headers['content-type'],/application\/x-ndjson/);
  const events=stream.body.trim().split('\n').map(x=>JSON.parse(x));
  assert.deepEqual(events.map(x=>x.type),['delta','delta','done']);
  assert.equal(events[0].text+events[1].text,'Наш Феликс отвечает.');
  assert.equal(events[2].cloud,false);
  assert.equal(events[2].executed,false);
  assert.equal(captured.url,'http://127.0.0.1:11434/api/chat');
  assert.equal(JSON.parse(captured.opts.body).stream,true);
  assert.match(JSON.parse(captured.opts.body).messages[1].content,/автоматизация заявок/);
  const forged=await request('/api/seyveo-stream',{
   method:'POST',
   headers:{origin:'https://evil.example','content-type':'application/json'},
   data:{message:'Привет'}
  });
  assert.equal(forged.status,403);
  const removed=await request('/api/seyveo-memory',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
   data:{action:'remove',id:memo[0].id}
  });
  assert.equal(removed.status,200);
  assert.deepEqual(JSON.parse(removed.body).items,[]);
  const rejectedBody=await request('/api/seyveo-ask',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
   data:{message:''}
  });
  assert.equal(rejectedBody.status,400);
 }finally{
  globalThis.fetch=oldFetch;
  await new Promise(resolve=>server.close(resolve));
  await rm(dir,{recursive:true,force:true});
 }
});