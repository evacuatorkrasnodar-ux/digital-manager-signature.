/* First interactive Felix Agent Core preview. No Ollama, no GPT, no actions. */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {planAgentTask} from './planner.mjs';

export function presentPlan(plan){
 const lines=[
  'SEYVEO · Феликс / План поручения',
  'Задача: '+plan.request,
  'Статус: '+({draft:'Черновик',blocked:'Действие недоступно',conversation:'Разговор',
   'clarification-needed':'Требуется уточнение'}[plan.status]||plan.status),
  'Направление: '+plan.title,
  'Инструмент: '+(plan.tool||'не выбран'),
  'Объяснение: '+plan.explanation
 ];
 if(plan.steps.length){
  lines.push('Предлагаемые шаги:');
  for(let i=0;i<plan.steps.length;i++)lines.push('  '+(i+1)+'. '+plan.steps[i]);
 }
 lines.push('Действия выполнены: НЕТ. Сохранение / отправка: НЕТ.');
 return lines.join('\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const message=process.argv.slice(2).join(' ').trim();
 if(!message){
  console.log('Пример: node server/agent/try-agent.mjs "Создай встречу завтра в 12:00"');
 }else{
  try{console.log(presentPlan(planAgentTask(message)))}
  catch{console.error('Введите поручение длиной до 4000 символов.');process.exitCode=1}
 }
}
