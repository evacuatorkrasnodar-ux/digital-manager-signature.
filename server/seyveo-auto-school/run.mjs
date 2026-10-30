#!/usr/bin/env node
/* SEYVEO Auto School: one-shot automatic synthetic lesson generation.
 * Uses local Ollama only. Run manually or via Windows Task Scheduler.
 * NEVER trains model weights, uses user conversations or deploys an update.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {CURRICULUM,teacherPrompt,judgePrompt,runAutonomousSchool} from './core.mjs';
import {createLocalOllama,DEFAULT_TEACHER,DEFAULT_STUDENT} from './ollama.mjs';
import {createSchoolStore} from './store.mjs';

export function parseArgs(args){
 const options={count:2,dryRun:false,check:false,help:false};
 for(const arg of args){
  if(arg==='--dry-run')options.dryRun=true;
  else if(arg==='--check')options.check=true;
  else if(arg==='--help')options.help=true;
  else if(/^--count=\d+$/.test(arg))options.count=Number(arg.split('=')[1]);
  else throw Error('Неизвестный параметр: '+arg);
 }
 if(options.count<1||options.count>24)throw Error('Допустимо от 1 до 24 уроков за запуск.');
 return options;
}
export async function run(args=process.argv.slice(2),{output=console.log,createClient=createLocalOllama,createStore=createSchoolStore}={}){
 const options=parseArgs(args);
 if(options.help){
  output('SEYVEO Auto School\nnode server/seyveo-auto-school/run.mjs --check\nnode server/seyveo-auto-school/run.mjs --dry-run\nnode server/seyveo-auto-school/run.mjs --count=2');
  return {mode:'help'};
 }
 if(options.dryRun){
  output('План учебной сессии (без вызова моделей и без записи данных):');
  for(let i=0;i<options.count;i++)output((i+1)+'. '+CURRICULUM[i%CURRICULUM.length].title);
  return {mode:'dry-run',count:options.count};
 }
 const client=createClient(),store=createStore();
 output('SEYVEO · автономная школа | локальные модели: '+client.models.teacher+' → '+client.models.student);
 await client.verifyInstalled();
 if(options.check){output('✓ Нужные модели установлены. Облачных вызовов нет.');return {mode:'check'}}
 return store.locked(async()=>{
  const result=await runAutonomousSchool({
   count:options.count,
   generate:async(topic,sequence)=>client.teacherJson(teacherPrompt(topic,sequence)),
   grade:async(lesson,answer,context)=>client.examinerJson(judgePrompt(lesson,answer,context)),
   studentAnswer:async(question)=>client.studentText(question),
   onResult:async(record)=>output('• '+record.topic+': '+(
    record.status==='candidate'?'учебный пример готов для экспериментального набора':
    record.status==='already-passed'?'Сэйви справилась':
    'отклонено ('+record.reason+')'))
  });
  const saved=await store.appendRun(result,result.results);
  output('ИТОГ: проверено '+result.processed+', новых экспериментальных примеров '+saved.added+
    ', всего '+saved.total+'.');
  output('Данные: '+saved.exportFile);
  output('Веса модели НЕ изменены. Никакого автоматического выпуска в приложение нет.');
  return {mode:'run',result,storage:saved};
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 run().catch(error=>{
  console.error('SEYVEO School: '+String(error?.message||error));
  if(String(error?.message||'').startsWith('models-not-installed:')){
   console.error('Установи учителя: ollama pull '+DEFAULT_TEACHER);
   console.error('Установи ученицу: ollama pull '+DEFAULT_STUDENT);
  }
  process.exitCode=1;
 });
}
