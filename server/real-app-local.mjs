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
import {createMemoryStore,memoryContext} from './local-memory.mjs';
import {validateHistory} from './local-dialogue.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const HOST='127.0.0.1',PORT=8790,ORIGIN='http://127.0.0.1:8790';
const TYPES={'.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.json':'application/json','.webmanifest':'application/manifest+json','.ico':'image/x-icon'};
const HEADERS={
 'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','cross-origin-resource-policy':'same-origin',
 'content-security-policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};
const ANCHOR="const answer=getDemoAnswer(q);\ncloseComposer();showWrittenReply(q,answer);question.value='';syncComposer();";
const MEMORY_UI="// Local-only commands. Nothing is saved without a specific confirmation.\n// Session conversation is separate from persistent memory and notes.\nconst newDialogue=/^(?:новый диалог|новая беседа|начать новый диалог|очисти беседу)$/iu.test(q.trim());\nif(composerMode!=='notes'&&newDialogue){\n if(window.SEYVEO_LOCAL_PENDING){composerMessage('Феликс ещё отвечает.');return}\n if(!window.confirm('Начать новую беседу? Текущий разговор будет очищен, но заметки «Запомни» останутся.'))return;\n window.SEYVEO_LOCAL_DIALOGUE={turns:[]};\n closeComposer();question.value='';syncComposer();\n $('orbInlineReply').hidden=false;\n $('stage').classList.add('has-inline-reply');\n $('orbInlineReplyText').textContent='Начали новый разговор. Я слушаю, о чём хочешь поговорить.';\n return;\n}\nconst memo=q.match(/^запомни\\s*[:：]\\s*(.+)$/isu);\nconst list=/^(?:память|покажи память|что ты помнишь)\\??$/iu.test(q.trim());\nconst forget=q.match(/^забудь\\s*(?:№|#)?\\s*(\\d{1,2})$/iu);\nconst erase=/^(?:очисти память|забудь всё|забудь все)$/iu.test(q.trim());\nif(composerMode!=='notes'&&(memo||list||forget||erase)){\n if(window.SEYVEO_LOCAL_PENDING){composerMessage('Феликс ещё отвечает.');return}\n const note=memo?.[1]?.trim()||'';\n if(memo){\n  if(note.length>180){composerMessage('Для памяти нужна короткая заметка до 180 символов.');return}\n  if(!window.confirm('Феликс сохранит эту заметку на данном компьютере:\\n\\n'+note+'\\n\\nПодтверждаешь?'))return;\n }\n if(erase&&!window.confirm('Удалить ВСЕ заметки памяти Феликса на этом компьютере? Восстановить их будет нельзя.'))return;\n window.SEYVEO_LOCAL_PENDING=true;\n closeComposer();question.value='';syncComposer();\n window.SEYVEO_BUSINESS_DIALOG?.reset?.();\n const panel=$('orbInlineReplyText');\n $('orbInlineReply').hidden=false;$('stage').classList.add('has-inline-reply');\n panel.textContent='Открываю локальную память…';\n const api=async(action,payload)=>{\n  const res=await fetch('/api/seyveo-memory',{\n   method:'POST',credentials:'same-origin',\n   headers:{'content-type':'application/json'},\n   body:JSON.stringify({action,...payload})\n  });\n  const value=await res.json();\n  if(!res.ok)throw Error(value.error||'Не удалось обновить память.');\n  return value.items;\n };\n const fetchList=async()=>{\n  const res=await fetch('/api/seyveo-memory',{credentials:'same-origin'});\n  const data=await res.json();\n  if(!res.ok)throw Error(data.error||'Не удалось прочитать память.');\n  return data.items;\n };\n (async()=>{\n  let items,notice='';\n  if(memo){\n   items=await api('add',{text:note});\n   notice='Запомнил! Сохранено только на этом компьютере.\\n\\n';\n  }else if(forget){\n   items=await fetchList();\n   const idx=Number(forget[1])-1;\n   if(idx<0||idx>=items.length){panel.textContent='Такого номера нет. Сначала напиши «Память».';return}\n   if(!window.confirm('Удалить из памяти:\\n\\n'+items[idx].text+'?')){\n    panel.textContent='Удаление отменено.';return;\n   }\n   items=await api('remove',{id:items[idx].id});\n   notice='Заметка удалена.\\n\\n';\n  }else if(erase){\n   items=await api('clear',{});\n   notice='Память очищена.\\n\\n';\n  }else{\n   items=await fetchList();\n  }\n  panel.textContent=notice+(items.length\n   ?'Память Феликса:\\n\\n'+items.map((x,i)=>(i+1)+'. '+x.text).join('\\n\\n')+\n     '\\n\\nЧтобы удалить запись: «Забудь 1».\\nЧтобы очистить всё: «Очисти память».'\n   :'Память пока пуста. Чтобы сохранить факт, напиши «Запомни: ...».');\n  panel.scrollTop=0;\n })().catch(()=>{panel.textContent='Память недоступна. Ничего не изменено. Проверь локальный сервер.'})\n .finally(()=>{window.SEYVEO_LOCAL_PENDING=false});\n return;\n}";
const BRIDGE="if(window.SEYVEO_LOCAL_PENDING){composerMessage('Феликс ещё отвечает.');return}\nwindow.SEYVEO_LOCAL_PENDING=true;\ncloseComposer();question.value='';syncComposer();\nwindow.SEYVEO_BUSINESS_DIALOG?.reset?.();\nconst chat=window.SEYVEO_LOCAL_DIALOGUE||(window.SEYVEO_LOCAL_DIALOGUE={turns:[]});\nconst panel=$('orbInlineReplyText');\nconst previous=chat.turns.slice(-6).map(t=>'Вы:\\n'+t.q+'\\n\\nФеликс:\\n'+t.a).join('\\n\\n────────────\\n\\n');\nconst header=(previous?previous+'\\n\\n────────────\\n\\n':'')+'Вы:\\n'+q+'\\n\\nФеликс:\\n';\npanel.textContent=header+'Феликс думает…';\n$('orbInlineReply').hidden=false;\n$('stage').classList.add('has-inline-reply');\ndocument.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'listening'}}));\n(async()=>{\n const response=await fetch('/api/seyveo-stream',{\n  method:'POST',credentials:'same-origin',\n  headers:{'content-type':'application/json'},\n  body:JSON.stringify({\n  message:q,\n  history:chat.turns.slice(-3).flatMap(t=>[\n   {role:'user',content:t.q.slice(-250)},\n   {role:'assistant',content:t.a.slice(-450)}\n  ])\n })\n });\n if(!response.ok){\n  const problem=await response.json().catch(()=>({}));\n  throw Error(problem.error||'Не удалось запустить ответ.');\n }\n if(!response.body)throw Error('Браузер не поддерживает потоковый ответ.');\n const reader=response.body.getReader();\n const decoder=new TextDecoder('utf-8');\n let carry='',answer='',finished=false;\n const consume=line=>{\n  if(!line.trim())return;\n  const part=JSON.parse(line);\n  if(part.type==='delta'&&typeof part.text==='string'){\n   answer+=part.text;\n   panel.textContent=header+answer;\n   panel.scrollTop=panel.scrollHeight;\n  }else if(part.type==='done'){finished=true}\n  else if(part.type==='error')throw Error(part.text||'Феликс не завершил ответ.');\n };\n while(true){\n  const next=await reader.read();\n  if(next.done)break;\n  carry+=decoder.decode(next.value,{stream:true});\n  let i;\n  while((i=carry.indexOf('\\n'))!==-1){\n   const line=carry.slice(0,i);\n   carry=carry.slice(i+1);\n   consume(line);\n  }\n }\n carry+=decoder.decode();\n if(carry.trim())consume(carry);\n if(!finished)throw Error('Соединение прервано до окончания ответа.');\n if(!answer.trim())throw Error('Феликс не прислал ответ.');\n chat.turns.push({q,a:answer.trim()});\n if(chat.turns.length>12)chat.turns.splice(0,chat.turns.length-12);\n})().catch(err=>{\n if(panel.textContent===header+'Феликс думает…')panel.textContent=header+(err.message||'Нет связи с Ollama.');\n else panel.textContent+='\\n\\n[Ответ прерван. Можно повторить вопрос.]';\n}).finally(()=>{\n window.SEYVEO_LOCAL_PENDING=false;\n document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'text'}}));\n});\nreturn;";
export function adaptOriginalHome(html){
 const parts=html.split(ANCHOR);
 if(parts.length!==2)throw Error('SEYVEO Home handler changed; bridge not applied.');
 const served=parts.join(BRIDGE).replace('Демо · ИИ не подключён</small>','Локальный ИИ · Qwen3 4B</small>');
 const entry="$('ask').addEventListener('submit',e=>{e.preventDefault();const q=$('question').value.trim();if(!q)return;";
 const locations=served.split(entry);
 if(locations.length!==2)throw Error('SEYVEO Home composer changed; memory patch refused.');
 return locations.join(entry+'\n'+MEMORY_UI);
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
async function readQuestion(req,{withHistory=false}={}){
 let size=0;const chunks=[];
 for await(const chunk of req){
  size+=chunk.length;if(size>8192)throw Error('large');
  chunks.push(chunk);
 }
 const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.message!=='string'||!data.message.trim()||data.message.length>4000)throw Error('invalid');
 return withHistory?{message:data.message,history:validateHistory(data.history)}:data.message;
}
function localFile(path){
 if(path==='/manifest.webmanifest')return resolve(ROOT,'manifest.webmanifest');
 if(!/^\/assets\/[a-zA-Z0-9._/-]+$/.test(path)||path.split('/').includes('..'))return null;
 const file=resolve(ROOT,'.'+path);
 if(!file.startsWith(resolve(ROOT,'assets')+sep))return null;
 return TYPES[extname(file).toLowerCase()]?file:null;
}
export function createRealLocalServer({memoryStore}={}){
 // Force offline AI, even if a paid API key exists in the environment.
 process.env.SEYVEO_ENABLE_LOCAL='1';
 process.env.SEYVEO_ENABLE_CLOUD='0';
 process.env.SEYVEO_LOCAL_MODEL='qwen3:4b-instruct';
 let busy=false,minute=0,count=0;
 const memories=memoryStore||createMemoryStore();
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
  if(req.method==='GET'&&path==='/api/seyveo-memory'){
   try{send(res,200,{items:await memories.list(),local:true})}
   catch{send(res,500,{error:'Не удалось прочитать память. Файл не изменён.'})}
   return;
  }
  if(req.method==='POST'&&path==='/api/seyveo-memory'){
   if(req.headers.origin!==ORIGIN){send(res,403,{error:'Недоверенная страница.'});return}
   if(!String(req.headers['content-type']||'').startsWith('application/json')){
    send(res,415,{error:'Ожидается JSON.'});return;
   }
   let data;
   try{
    let size=0;const chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>(withHistory?20000:8192))throw Error('large');chunks.push(chunk)}
    data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid');
   }catch{send(res,400,{error:'Неверный запрос к памяти.'});return}
   try{
    let items;
    if(data.action==='add'){
     items=(await memories.add(data.text)).items;
    }else if(data.action==='remove'){
     items=await memories.remove(data.id);
    }else if(data.action==='clear'){
     items=await memories.clear();
    }else{send(res,400,{error:'Неизвестное действие с памятью.'});return}
    send(res,200,{items,local:true});
   }catch(err){
    const error=String(err?.message||'');
    const bad=['invalid-note','note-too-long','sensitive-note','memory-full','invalid-id','unknown-id'].includes(error);
    send(res,bad?400:500,{error:bad?({
     'invalid-note':'Напиши короткую заметку.',
     'note-too-long':'Максимум 180 символов.',
     'sensitive-note':'Пароли, ключи и банковские данные сохранять нельзя.',
     'memory-full':'Память заполнена: удали ненужные заметки.',
     'invalid-id':'Неверный номер записи.',
     'unknown-id':'Запись уже удалена.'
    }[error]):'Не удалось изменить память. Существующие записи сохранены.'});
   }
   return;
  }
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
   try{message=await readQuestion(req,{withHistory:true})}
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
    const facts=await memories.list();
    const result=await askLocalStream(message.message,{
     name:'Феликс',memory:memoryContext(facts),history:message.history,signal:controller.signal,
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
