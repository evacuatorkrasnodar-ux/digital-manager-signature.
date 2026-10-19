/* SEYVEO · LOCAL ONLY · serves the REAL unmodified Home from repo.
   It switches ONE demo-answer branch in delivered HTML; never changes
   production index.html, plasma, layouts, local data or public app.
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {respond} from './brain.mjs';
import {askLocalStream} from './local-stream.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const HOST='127.0.0.1',PORT=8790,ORIGIN='http://127.0.0.1:8790';
const TYPES={'.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.json':'application/json','.webmanifest':'application/manifest+json','.ico':'image/x-icon'};
const HEADERS={
 'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','cross-origin-resource-policy':'same-origin',
 'content-security-policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};
const ANCHOR="const answer=getDemoAnswer(q);\ncloseComposer();showWrittenReply(q,answer);question.value='';syncComposer();";
const BRIDGE="if(window.SEYVEO_LOCAL_PENDING){composerMessage('Феликс ещё отвечает.');return}\nwindow.SEYVEO_LOCAL_PENDING=true;\ncloseComposer();question.value='';syncComposer();\nwindow.SEYVEO_BUSINESS_DIALOG?.reset?.();\nconst panel=$('orbInlineReplyText');\npanel.textContent='Феликс думает…';\n$('orbInlineReply').hidden=false;\n$('stage').classList.add('has-inline-reply');\ndocument.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'listening'}}));\n(async()=>{\n const response=await fetch('/api/seyveo-stream',{\n  method:'POST',credentials:'same-origin',\n  headers:{'content-type':'application/json'},\n  body:JSON.stringify({message:q})\n });\n if(!response.ok){\n  const problem=await response.json().catch(()=>({}));\n  throw Error(problem.error||'Не удалось запустить ответ.');\n }\n if(!response.body)throw Error('Браузер не поддерживает потоковый ответ.');\n const reader=response.body.getReader();\n const decoder=new TextDecoder('utf-8');\n let carry='',answer='',finished=false;\n const consume=line=>{\n  if(!line.trim())return;\n  const part=JSON.parse(line);\n  if(part.type==='delta'&&typeof part.text==='string'){\n   answer+=part.text;\n   panel.textContent=answer;\n   panel.scrollTop=panel.scrollHeight;\n  }else if(part.type==='done'){finished=true}\n  else if(part.type==='error')throw Error(part.text||'Феликс не завершил ответ.');\n };\n while(true){\n  const next=await reader.read();\n  if(next.done)break;\n  carry+=decoder.decode(next.value,{stream:true});\n  let i;\n  while((i=carry.indexOf('\\n'))!==-1){\n   const line=carry.slice(0,i);\n   carry=carry.slice(i+1);\n   consume(line);\n  }\n }\n carry+=decoder.decode();\n if(carry.trim())consume(carry);\n if(!finished)throw Error('Соединение прервано до окончания ответа.');\n if(!answer.trim())throw Error('Феликс не прислал ответ.');\n})().catch(err=>{\n if(panel.textContent==='Феликс думает…')panel.textContent=err.message||'Нет связи с Ollama.';\n else panel.textContent+='\\n\\n[Ответ прерван. Можно повторить вопрос.]';\n}).finally(()=>{\n window.SEYVEO_LOCAL_PENDING=false;\n document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'text'}}));\n});\nreturn;";
export function adaptOriginalHome(html){
 const parts=html.split(ANCHOR);
 if(parts.length!==2)throw Error('SEYVEO Home handler changed; bridge not applied.');
 return parts.join(BRIDGE).replace('Демо · ИИ не подключён</small>','Локальный ИИ · Qwen3 4B</small>');
}
function send(res,status,data){
 res.writeHead(status,{...HEADERS,'content-type':'application/json; charset=utf-8'});
 res.end(JSON.stringify(data));
}
function safe(req){
 return req.headers.host===HOST+':'+PORT &&
 (!req.headers.origin||req.headers.origin===ORIGIN) &&
 (!req.headers['sec-fetch-site']||['same-origin','none'].includes(req.headers['sec-fetch-site']));
}
async function readQuestion(req){
 let size=0;const chunks=[];
 for await(const chunk of req){
  size+=chunk.length;if(size>8192)throw Error('large');
  chunks.push(chunk);
 }
 const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.message!=='string'||!data.message.trim()||data.message.length>4000)throw Error('invalid');
 return data.message;
}
function localFile(path){
 if(path==='/manifest.webmanifest')return resolve(ROOT,'manifest.webmanifest');
 if(!/^\/assets\/[a-zA-Z0-9._/-]+$/.test(path)||path.split('/').includes('..'))return null;
 const file=resolve(ROOT,'.'+path);
 if(!file.startsWith(resolve(ROOT,'assets')+sep))return null;
 return TYPES[extname(file).toLowerCase()]?file:null;
}
export function createRealLocalServer(){
 // Force offline AI, even if a paid API key exists in the environment.
 process.env.SEYVEO_ENABLE_LOCAL='1';
 process.env.SEYVEO_ENABLE_CLOUD='0';
 process.env.SEYVEO_LOCAL_MODEL='qwen3:4b-instruct';
 let busy=false,minute=0,count=0;
 return createServer(async(req,res)=>{
  if(!safe(req)){send(res,403,{error:'Только этот компьютер.'});return}
  const path=(req.url||'').split('?')[0];
  if(req.method==='GET'&&(path==='/'||path==='/index.html')){
   try{
    const html=adaptOriginalHome(await readFile(resolve(ROOT,'index.html'),'utf8'));
    res.writeHead(200,{...HEADERS,'content-type':'text/html; charset=utf-8'});
    res.end(html);
   }catch{send(res,500,{error:'Не удалось загрузить настоящую Главную.'})}
   return;
  }
  if(req.method==='GET'&&path==='/assets/push-status.js'){
   // No service worker or cache in this localhost experiment.
   res.writeHead(200,{...HEADERS,'content-type':'text/javascript; charset=utf-8'});
   res.end('/* PWA background cache disabled in local AI test. */');
   return;
  }
  if(req.method==='GET'&&path==='/sw.js'){send(res,404,{error:'Service worker disabled.'});return}
  if(req.method==='POST'&&path==='/api/seyveo-stream'){
   if(req.headers.origin!==ORIGIN){send(res,403,{error:'Недоверенная страница.'});return}
   if(!String(req.headers['content-type']||'').startsWith('application/json')){
    send(res,415,{error:'Ожидается JSON.'});return;
   }
   const now=Math.floor(Date.now()/60000);
   if(minute!==now){minute=now;count=0}
   if(count>=12){send(res,429,{error:'Подожди минуту перед следующим вопросом.'});return}
   if(busy){send(res,429,{error:'Феликс ещё отвечает.'});return}
   let message;
   try{message=await readQuestion(req)}
   catch{send(res,400,{error:'Нужен вопрос до 4000 символов.'});return}
   count++;busy=true;
   const controller=new AbortController();
   const disconnected=()=>{if(!res.writableEnded)controller.abort()};
   res.on('close',disconnected);
   try{
    res.writeHead(200,{
     ...HEADERS,
     'content-type':'application/x-ndjson; charset=utf-8',
     'x-accel-buffering':'no'
    });
    res.flushHeaders();
    const result=await askLocalStream(message,{
     name:'Феликс',signal:controller.signal,
     onDelta:token=>{
      if(!res.destroyed)res.write(JSON.stringify({type:'delta',text:token})+'\n');
     }
    });
    if(!res.destroyed)res.end(JSON.stringify({
     type:'done',model:result.model,cloud:false,executed:false
    })+'\n');
   }catch{
    if(!res.destroyed)res.end(JSON.stringify({
     type:'error',text:'Феликс не смог завершить ответ. Проверь Ollama.'
    })+'\n');
   }finally{
    busy=false;
    res.off('close',disconnected);
   }
   return;
  }
  if(req.method==='POST'&&path==='/api/seyveo-ask'){
   if(req.headers.origin!==ORIGIN){send(res,403,{error:'Недоверенная страница.'});return}
   if(!String(req.headers['content-type']||'').startsWith('application/json')){
    send(res,415,{error:'Ожидается JSON.'});return;
   }
   const now=Math.floor(Date.now()/60000);
   if(minute!==now){minute=now;count=0}
   if(count>=12){send(res,429,{error:'Подожди минуту перед следующим вопросом.'});return}
   if(busy){send(res,429,{error:'Феликс ещё отвечает.'});return}
   let message;
   try{message=await readQuestion(req)}
   catch{send(res,400,{error:'Нужен вопрос до 4000 символов.'});return}
   count++;busy=true;
   try{
    const result=await respond({message,mode:'private',allowCloud:false,assistantName:'Феликс'});
    send(res,200,{text:result.text,model:result.model,cloud:false,executed:false});
   }catch{send(res,500,{error:'Не удалось получить ответ.'})}
   finally{busy=false}
   return;
  }
  if(req.method==='GET'&&path==='/api/seyveo-status'){
   let online=false;
   try{
    const response=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(3000)});
    const data=await response.json();
    online=response.ok&&Array.isArray(data.models)&&data.models.some(m=>m.name==='qwen3:4b-instruct');
   }catch{}
   send(res,200,{online,model:'qwen3:4b-instruct',cloud:false});return;
  }
  if(req.method==='GET'){
   const file=localFile(path);
   if(file){
    try{
     const bytes=await readFile(file);
     res.writeHead(200,{...HEADERS,'content-type':TYPES[extname(file).toLowerCase()]});
     res.end(bytes);
    }catch{send(res,404,{error:'Ресурс не найден.'})}
    return;
   }
  }
  send(res,404,{error:'Не найдено.'});
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const server=createRealLocalServer();
 server.requestTimeout=130000;
 server.listen(PORT,HOST,()=>{
  process.stdout.write('\nSEYVEO · настоящая Главная + локальный Феликс\n');
  process.stdout.write('Открой в Chrome: '+ORIGIN+'\n');
  process.stdout.write('Qwen3 4B · GPT-6 выключен · только этот ПК\n');
  process.stdout.write('Закрыть сервер: Ctrl+C\n\n');
 });
 server.on('error',()=>{process.stderr.write('Ошибка запуска сервера на порту '+PORT+'.\n');process.exitCode=1});
}
