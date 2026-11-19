/** Read-only readiness check for the Windows local Paper launcher. */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {inspectLocalPaperModel} from './paper-model-health.mjs';

export async function checkPaperModelForLauncher({inspect=inspectLocalPaperModel}={}){
 const state=await inspect();
 const messages={
  ready:'Сэйви: модель рисования готова. Рисунок будет только предпросмотром.',
  disabled:'Сэйви: локальный ИИ выключен. Запусти через start-paper-ai.cmd.',
  'model-not-installed':'Сэйви: Ollama работает, но модель рисования ещё не скачана.',
  'ollama-offline':'Сэйви: Ollama не отвечает на этом ПК (127.0.0.1:11434).',
  'invalid-configuration':'Сэйви: некорректное имя модели или конфигурация.'
 };
 return {exitCode:state.status==='ready'?0:
  state.status==='model-not-installed'?2:
  state.status==='ollama-offline'?3:4,
  message:messages[state.status]||'Сэйви: состояние модели не подтверждено.'};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const outcome=await checkPaperModelForLauncher();
 process.stdout.write(outcome.message+'\n');
 process.exitCode=outcome.exitCode;
}
