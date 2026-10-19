import test from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {createLocalBrowserServer} from '../browser-local.mjs';
const host='127.0.0.1',port=8788,origin='http://127.0.0.1:8788';
function send(path,{method='GET',headers={},data=null}={}){
 return new Promise((resolve,reject)=>{
  const value=data===null?null:JSON.stringify(data);
  const r=httpRequest({hostname:host,port,path,method,headers},res=>{
   const parts=[];res.on('data',chunk=>parts.push(chunk));
   res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(parts).toString('utf8')}));
  });
  r.on('error',reject);
  if(value!==null)r.write(value);
  r.end();
 });
}
test('browser page serves strictly on localhost and never calls cloud',async()=>{
 const server=createLocalBrowserServer();
 await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(port,host,resolve);
 });
 const original=globalThis.fetch;
 try{
  const home=await send('/');
  assert.equal(home.status,200);
  assert.match(home.body,/Феликс/);
  assert.match(home.headers['content-security-policy'],/connect-src 'self'/);
  const js=await send('/app.js');
  assert.equal(js.status,200);
  assert.match(js.body,/\/api\/message/);
  const bad=await send('/api/message',{
   method:'POST',
   headers:{'origin':'https://evil.example','content-type':'application/json'},
   data:{message:'Привет'}
  });
  assert.equal(bad.status,403);
  const badType=await send('/api/message',{
   method:'POST',headers:{origin,'content-type':'text/plain'},
   data:{message:'Привет'}
  });
  assert.equal(badType.status,415);
  let called=null;
  globalThis.fetch=async(url,options)=>{
   called={url,options};
   return {ok:true,json:async()=>({message:{content:'Привет! Я Феликс.'}})};
  };
  const good=await send('/api/message',{
   method:'POST',headers:{origin,'content-type':'application/json'},
   data:{message:'Привет'}
  });
  assert.equal(good.status,200);
  const response=JSON.parse(good.body);
  assert.equal(response.text,'Привет! Я Феликс.');
  assert.equal(response.executed,false);
  assert.equal(called.url,'http://127.0.0.1:11434/api/chat');
  assert.equal(JSON.parse(called.options.body).model,'qwen3:4b-instruct');
 }finally{
  globalThis.fetch=original;
  await new Promise(resolve=>server.close(resolve));
 }
});