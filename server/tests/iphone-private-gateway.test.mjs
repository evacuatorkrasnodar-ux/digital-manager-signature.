import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer,request as httpRequest} from 'node:http';
import {createIphoneGateway,gatewayConfig,authorizeGatewayRequest} from '../iphone-private-gateway.mjs';

const hostname='owner-workstation.example-tailnet.ts.net';
const origin='https://'+hostname;
const owner='owner@example.com';
const conf=gatewayConfig({SEYVEO_TAILNET_HOST:hostname,SEYVEO_TAILNET_OWNER:owner});
const headers=()=>({
 host:hostname,'tailscale-user-login':owner,'sec-fetch-site':'same-origin'
});
function listen(server){
 return new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>resolve(server.address().port));
 });
}
function close(server){return new Promise(resolve=>server.close(resolve))}
function get(port,path,opts={}){
 return new Promise((resolve,reject)=>{
  const request=httpRequest({hostname:'127.0.0.1',port,path,method:opts.method||'GET',
   headers:opts.headers||{}},response=>{
    let text='';
    response.on('data',part=>{text+=part.toString('utf8')});
    response.on('end',()=>resolve({status:response.statusCode,body:text,headers:response.headers}));
   });
  request.on('error',reject);
  request.end(opts.body||undefined);
 });
}
test('gateway never starts without explicit owner and tailnet hostname',()=>{
 assert.throws(()=>gatewayConfig({}),/SEYVEO_TAILNET_HOST/);
 assert.throws(()=>gatewayConfig({SEYVEO_TAILNET_HOST:'public.example.com',SEYVEO_TAILNET_OWNER:owner}),/SEYVEO_TAILNET_HOST/);
 assert.throws(()=>gatewayConfig({SEYVEO_TAILNET_HOST:hostname}),/SEYVEO_TAILNET_OWNER/);
 assert.equal(conf.origin,origin);
 assert.equal(conf.port,8791);
});
test('identity, host, Origin and cross-site access are independently checked',()=>{
 const req={method:'POST',socket:{remoteAddress:'127.0.0.1'},headers:{...headers(),origin}};
 assert.equal(authorizeGatewayRequest(req,conf),200);
 assert.equal(authorizeGatewayRequest({...req,headers:{...headers(),origin,host:'evil.example'}},conf),403);
 assert.equal(authorizeGatewayRequest({...req,headers:{...headers(),origin,'tailscale-user-login':'other@example.com'}},conf),403);
 assert.equal(authorizeGatewayRequest({...req,headers:{...headers(),origin,'tailscale-user-login':undefined}},conf),403);
 assert.equal(authorizeGatewayRequest({...req,headers:{...headers(),origin:'https://evil.example'}},conf),403);
 assert.equal(authorizeGatewayRequest({...req,headers:{...headers(),origin,'sec-fetch-site':'cross-site'}},conf),403);
 assert.equal(authorizeGatewayRequest({...req,socket:{remoteAddress:'192.168.1.12'}},conf),403);
});
test('owner alone can load the real app and stream local answer, never private files',async()=>{
 const upstream=createServer(async(req,res)=>{
  assert.equal(req.headers.host,'127.0.0.1:8790');
  assert.equal(req.headers.origin,'http://127.0.0.1:8790');
  assert.equal(req.headers['sec-fetch-site'],'same-origin');
  if(req.url==='/'){
   res.writeHead(200,{'content-type':'text/html','content-security-policy':"default-src 'none'; connect-src 'self'"});
   res.end('<main id="homePage"><button id="orb">SEYVEO</button></main>');
  }else if(req.url==='/api/seyveo-intelligence-catalog'){
   res.writeHead(200,{'content-type':'application/json'});
   res.end(JSON.stringify({mode:'architecture-preview',capabilities:[{id:'business'}]}));
  }else if(req.url==='/api/seyveo-intelligence-preview'){
   let json='';for await(const chunk of req)json+=chunk.toString();
   assert.equal(JSON.parse(json).message,'Создай встречу завтра');
   res.writeHead(200,{'content-type':'application/json'});
   res.end(JSON.stringify({status:'preview-only',safety:{executed:false}}));
  }else if(req.url==='/api/seyveo-agent-review'){
   let json='';for await(const chunk of req)json+=chunk.toString();
   assert.equal(JSON.parse(json).file,'server/agent/planner.mjs');
   res.writeHead(200,{'content-type':'application/json'});
   res.end(JSON.stringify({file:'server/agent/planner.mjs',executed:false,sourceReturned:false}));
  }else if(req.url==='/api/seyveo-agent-plan'){
   let json='';for await(const chunk of req)json+=chunk.toString('utf8');
   assert.equal(JSON.parse(json).message,'Создай встречу в календаре');
   res.writeHead(200,{'content-type':'application/json; charset=utf-8'});
   res.end(JSON.stringify({intent:'calendar',executed:false,tool:'calendar.draft'}));
  }else if(req.url==='/api/seyveo-stream'){
   let payload='';for await(const chunk of req)payload+=chunk.toString();
   assert.equal(JSON.parse(payload).message,'Привет, Феликс!');
   res.writeHead(200,{'content-type':'application/x-ndjson; charset=utf-8'});
   res.write(JSON.stringify({type:'delta',text:'Привет, '})+'\n');
   res.end(JSON.stringify({type:'done',cloud:false,executed:false})+'\n');
  }else{
   res.writeHead(404);res.end('not-found');
  }
 });
 const upPort=await listen(upstream);
 const gateway=createIphoneGateway({config:conf,upstreamPort:upPort});
 const port=await listen(gateway);
 try{
  const denied=await get(port,'/',{headers:{host:hostname}});
  assert.equal(denied.status,403);
  const wrong=await get(port,'/',{headers:{...headers(),'tailscale-user-login':'other@example.com'}});
  assert.equal(wrong.status,403);
  const homepage=await get(port,'/',{headers:headers()});
  assert.equal(homepage.status,200);
  assert.match(homepage.body,/id="homePage"/);
  assert.match(homepage.headers['content-security-policy'],/connect-src 'self'/);
  assert.equal(homepage.headers['cache-control'],'no-store');
  const source=await get(port,'/server/hybrid-core.mjs',{headers:headers()});
  assert.equal(source.status,404);
  const traversal=await get(port,'/assets/../server/brain.mjs',{headers:headers()});
  assert.equal(traversal.status,404);
  const foreign=await get(port,'/api/seyveo-stream',{method:'POST',headers:{
   ...headers(),origin:'https://evil.example','content-type':'application/json'
  },body:JSON.stringify({message:'bad'})});
  assert.equal(foreign.status,403);
  const wrongType=await get(port,'/api/seyveo-stream',{method:'POST',headers:{
   ...headers(),origin,'content-type':'text/plain'
  },body:'bad'});
  assert.equal(wrongType.status,415);
  const cat=await get(port,'/api/seyveo-intelligence-catalog',{headers:headers()});
  assert.equal(cat.status,200);
  assert.equal(JSON.parse(cat.body).mode,'architecture-preview');
  const prev=await get(port,'/api/seyveo-intelligence-preview',{method:'POST',headers:{
   ...headers(),origin,'content-type':'application/json'
  },body:JSON.stringify({message:'Создай встречу завтра'})});
  assert.equal(prev.status,200);
  assert.equal(JSON.parse(prev.body).safety.executed,false);
  const outsider=await get(port,'/api/seyveo-intelligence-preview',{method:'POST',headers:{
   ...headers(),origin,'tailscale-user-login':'outsider@example.com','content-type':'application/json'
  },body:JSON.stringify({message:'Создай встречу завтра'})});
  assert.equal(outsider.status,403);
  const inspected=await get(port,'/api/seyveo-agent-review',{method:'POST',headers:{
   ...headers(),origin,'content-type':'application/json'
  },body:JSON.stringify({file:'server/agent/planner.mjs'})});
  assert.equal(inspected.status,200);
  assert.equal(JSON.parse(inspected.body).sourceReturned,false);
  assert.equal(JSON.parse(inspected.body).executed,false);
  const deniedInspector=await get(port,'/api/seyveo-agent-review',{method:'POST',headers:{
   ...headers(),'tailscale-user-login':'other@example.com',origin,'content-type':'application/json'
  },body:JSON.stringify({file:'index.html'})});
  assert.equal(deniedInspector.status,403);
  const planned=await get(port,'/api/seyveo-agent-plan',{method:'POST',headers:{
   ...headers(),origin,'content-type':'application/json'
  },body:JSON.stringify({message:'Создай встречу в календаре'})});
  assert.equal(planned.status,200);
  assert.equal(JSON.parse(planned.body).intent,'calendar');
  assert.equal(JSON.parse(planned.body).executed,false);
  const stream=await get(port,'/api/seyveo-stream',{method:'POST',headers:{
   ...headers(),origin,'content-type':'application/json'
  },body:JSON.stringify({message:'Привет, Феликс!'})});
  assert.equal(stream.status,200);
  assert.deepEqual(stream.body.trim().split('\n').map(line=>JSON.parse(line).type),['delta','done']);
  const oversized=await get(port,'/api/seyveo-ask',{method:'POST',headers:{
   ...headers(),origin,'content-type':'application/json'
  },body:JSON.stringify({message:'x'.repeat(25000)})});
  assert.equal(oversized.status,413);
 }finally{
  await close(gateway);
  await close(upstream);
 }
});