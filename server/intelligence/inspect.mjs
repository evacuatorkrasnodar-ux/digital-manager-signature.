/* SEYVEO Intelligence v1 · no-model architecture inspection, no side effects. */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {intelligenceCatalog,intelligencePlan} from './architecture.mjs';

export function displayArchitecture(message=''){
 const info=intelligenceCatalog();
 const state={'blueprint':'запланировано','prototype':'прототип','server-adapter':'основа на сервере'};
 const text=['SEYVEO Intelligence · '+info.version,
  'Общий интеллект Феликса. Подключения не выполняются автоматически.',''];
 for(const cap of info.capabilities)
  text.push('• '+cap.title+' ['+(state[cap.readiness]||cap.readiness)+'] — '+cap.description);
 text.push('','Важное: реальные инструменты не включены, личные данные не читаются.');
 if(message){
  const plan=intelligencePlan(message,{mode:'private',allowCloud:false},
   {local:false,cloud:false});
  text.push('','Пример запроса: '+plan.request,
    'Область: '+plan.task.capability+'; намерение: '+plan.task.intent,
    'Статус: '+plan.status+'; результат выполнен: НЕТ.');
 }
 return text.join('\n');
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 console.log(displayArchitecture(process.argv.slice(2).join(' ').trim()));
}
