/* SEYVEO Intelligence · LOCAL browser-only demo, no cloud access.
 * Explicit loopback bind; refuses requests from another browser origin.
 * This does not expose the home PC, Ollama, or user files to the Internet.
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {respond} from './brain.mjs';

const HOST='127.0.0.1';
const PORT=8788;
const ORIGIN='http://'+HOST+':'+PORT;
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'local-web');
const ROUTES=Object.freeze({
 '/': ['index.html','text/html; charset=utf-8'],
 '/app.js': ['app.js','text/javascript; charset=utf-8'],
 '/style.css': ['style.css','text/css; charset=utf-8']
});
// Never allow cloud calls from this prototype, even if an API key is configured.
process.env.SEYVEO_ENABLE_LOCAL='1';
process.env.SEYVEO_ENABLE_CLOUD='0';
process.env.SEYVEO_LOCAL_MODEL='qwen3:4b-instruct';

const HEADERS={
 'cache-control':'no-store',
 'x-content-type-options':'nosniff',
 'referrer-policy':'no-referrer',
 'cross-origin-resource-policy':'same-origin',
 'x-frame-options':'DENY',
 'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
};
let busy=false;
let rate={minute:0,count:0};
const send=(res,code,payload)=>{
 const body=JSON.stringify(payload);
 res.writeHead(code,{...HEADERS,'content-type':'application/json; charset=utf-8'});
 res.end(body);
};
const allow=(req)=>{
 // Reject DNS rebinding, LAN-origin access and cross-site requests.
 const host=req.headers.host;
 if(host!==HOST+':'+PORT)return false;
 if(req.headers.origin&&req.headers.origin!==ORIGIN)return false;
 if(req.headers['sec-fetch-site']&&!['same-origin','none'].includes(req.headers['sec-fetch-site']))return false;
 return true;
};
async function readJson(req){
 let total=0;
 const chunks=[];
 for await(const chunk of req){
  total+=chunk.length;
  if(total>8192)throw Error('large');
  chunks.push(chunk);
 }
 const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid');
 return value;
}
async function status(){
 try{
  const response=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(4000)});
  if(!response.ok)return false;
  const data=await response.json();
  return Array.isArray(data.models)&&data.models.some(m=>m?.name==='qwen3:4b-instruct');
 }catch{return false}
}
export function createLocalBrowserServer(){
 return createServer(async(req,res)=>{
  if(!allow(req)){send(res,403,{error:'Доступ разрешён только с этого компьютера.'});return}
  const route=ROUTES[req.url];
  if(req.method==='GET'&&route){
   try{
    const body=await readFile(join(ROOT,route[0]));
    res.writeHead(200,{...HEADERS,'content-type':route[1]});
    res.end(body);
   }catch{send(res,500,{error:'Не удалось открыть страницу.'})}
   return;
  }
  if(req.url==='/api/status'&&req.method==='GET'){
   send(res,200,{online:await status(),model:'qwen3:4b-instruct',cloud:false});
   return;
  }
  if(req.url==='/api/message'&&req.method==='POST'){
   if(req.headers.origin!==ORIGIN){
    send(res,403,{error:'Неизвестная страница.'});return;
   }
   if(!String(req.headers['content-type']||'').startsWith('application/json')){
    send(res,415,{error:'Нужен JSON.'});return;
   }
   const minute=Math.floor(Date.now()/60000);
   if(rate.minute!==minute)rate={minute,count:0};
   if(rate.count>=15){send(res,429,{error:'Слишком много вопросов. Попробуй через минуту.'});return}
   if(busy){send(res,429,{error:'Феликс ещё отвечает на предыдущий вопрос.'});return}
   let data;
   try{
    data=await readJson(req);
    if(typeof data.message!=='string'||!data.message.trim()||data.message.length>4000)throw Error('invalid');
   }catch{send(res,400,{error:'Напиши один вопрос длиной до 4000 символов.'});return}
   rate.count++;
   busy=true;
   try{
    const answer=await respond({message:data.message,mode:'private',allowCloud:false,assistantName:'Феликс'});
    send(res,200,{text:answer.text,status:answer.status,model:answer.model,executed:false});
   }catch{send(res,500,{error:'Не удалось обработать запрос.'})}
   finally{busy=false}
   return;
  }
  send(res,404,{error:'Не найдено.'});
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const server=createLocalBrowserServer();
 server.requestTimeout=130000;
 server.listen(PORT,HOST,()=>{
  process.stdout.write('\nSEYVEO · Феликс в браузере\n');
  process.stdout.write('Открой в браузере: '+ORIGIN+'\n');
  process.stdout.write('Работает только на этом ПК · облако выключено\n');
  process.stdout.write('Для остановки нажми Ctrl+C.\n\n');
 });
 server.on('error',()=>{
  process.stderr.write('Не удалось запустить браузерный тест. Возможно, порт '+PORT+' занят.\n');
  process.exitCode=1;
 });
}
