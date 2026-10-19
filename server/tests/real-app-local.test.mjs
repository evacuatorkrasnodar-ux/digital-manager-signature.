import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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
 assert.match(adapted,/\/api\/seyveo-ask/);
 assert.doesNotMatch(adapted,/const answer=getDemoAnswer\(q\)/);
 assert.equal(original.includes('window.SEYVEO_LOCAL_PENDING'),false);
 assert.throws(()=>adaptOriginalHome('A fake homepage'),/handler changed/);
 const inlineScripts=[...adapted.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(v=>v.trim());
 for(const inline of inlineScripts)new Script(inline);
});

test('Actual app with private Ollama is served on loopback and refuses foreign requests',async()=>{
 const server=createRealLocalServer();
 await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(PORT,HOST,resolve);
 });
 const oldFetch=globalThis.fetch;
 try{
  const home=await request('/');
  assert.equal(home.status,200);
  assert.match(home.body,/id="orb"/);
  assert.match(home.body,/\/api\/seyveo-ask/);
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
  const forged=await request('/api/seyveo-stream',{
   method:'POST',
   headers:{origin:'https://evil.example','content-type':'application/json'},
   data:{message:'Привет'}
  });
  assert.equal(forged.status,403);
  const rejectedBody=await request('/api/seyveo-ask',{
   method:'POST',headers:{origin:ORIGIN,'content-type':'application/json'},
   data:{message:''}
  });
  assert.equal(rejectedBody.status,400);
 }finally{
  globalThis.fetch=oldFetch;
  await new Promise(resolve=>server.close(resolve));
 }
});