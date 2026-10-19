/* SEYVEO Intelligence · local private developer chat.
 * Connects ONLY to Ollama on 127.0.0.1:11434. No OpenAI request,
 * no API keys, no persistence, no external actions or public PWA access.
 */
import {createInterface} from 'node:readline/promises';
import {stdin,stdout,stderr} from 'node:process';
import {respond} from './brain.mjs';

const MODEL='qwen3:4b-instruct';
// This entry point overrides any local computer environment settings.
process.env.SEYVEO_ENABLE_LOCAL='1';
process.env.SEYVEO_ENABLE_CLOUD='0';
process.env.SEYVEO_LOCAL_MODEL=MODEL;

async function checkOllama(){
 try{
  const res=await fetch('http://127.0.0.1:11434/api/tags',{
   signal:AbortSignal.timeout(5000)
  });
  if(!res.ok)return 'Ollama запущена, но не отвечает корректно.';
  const data=await res.json();
  const names=Array.isArray(data.models)?data.models.map(m=>m.name):[];
  if(!names.includes(MODEL))return 'Модель '+MODEL+' не найдена. Проверьте в CMD: ollama list';
  return null;
 }catch{
  return 'Не удалось связаться с Ollama. Откройте приложение Ollama и повторите попытку.';
 }
}
async function run(){
 const issue=await checkOllama();
 if(issue){stderr.write(issue+'\n');process.exitCode=1;return}
 const rl=createInterface({input:stdin,output:stdout});
 stdout.write('\nSEYVEO · Феликс · локальный тест\n');
 stdout.write('Модель: '+MODEL+' · облако отключено · никаких действий не выполняется\n');
 stdout.write('Для выхода введите /bye\n\n');
 try{
  while(true){
   let message;
   try{message=await rl.question('Вы: ')}catch{break}
   if(!message?.trim())continue;
   if(['/bye','/exit'].includes(message.trim().toLowerCase()))break;
   if(message.length>4000){
    stdout.write('Сократите вопрос до 4000 символов.\n');continue;
   }
   stdout.write('Феликс думает...\n');
   const answer=await respond({
    message,mode:'private',allowCloud:false,assistantName:'Феликс'
   });
   stdout.write('Феликс: '+answer.text+'\n\n');
  }
 }finally{rl.close();stdout.write('До встречи!\n')}
}
run().catch(()=>{
 stderr.write('Не удалось запустить локальный тест Феликса.\n');
 process.exitCode=1;
});
