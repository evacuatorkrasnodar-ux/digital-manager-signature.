/* SEYVEO · First GPT-6 answer (manual, consent-gated smoke test).
 * Uses one harmless fixed question. NEVER accept personal data or API keys
 * from the command line or log the API credential.
 * This file is server-only; not included in the GitHub Pages PWA.
 */
import {pathToFileURL} from 'node:url';
import {askCloud} from './providers.mjs';
import {CLOUD_MODELS} from './hybrid-core.mjs';

export async function verifyFirstResponse(){
 if(process.env.SEYVEO_GPT6_SMOKE_CONSENT!=='yes')
  throw new Error('Первый платный тест не разрешён. Подтвердите SEYVEO_GPT6_SMOKE_CONSENT=yes на сервере.');
 if(process.env.SEYVEO_ENABLE_CLOUD!=='1'||!process.env.OPENAI_API_KEY)
  throw new Error('Облачная модель не включена: нужны SEYVEO_ENABLE_CLOUD=1 и серверный OPENAI_API_KEY.');
 const result=await askCloud(
  'Это первое знакомство с SEYVEO. Представься как Феликс, наш цифровой управляющий, тепло и очень кратко. Не утверждай, что ты умеешь выполнять действия.',
  {name:'Феликс',model:CLOUD_MODELS.economical}
 );
 if(result.model!==CLOUD_MODELS.economical||!result.text)
  throw new Error('Проверка модели не завершилась корректно.');
 return Object.freeze({verified:true,provider:result.provider,model:result.model,text:result.text});
}
const direct=Boolean(process.argv[1])&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct){
 verifyFirstResponse().then(result=>{
  process.stdout.write('SEYVEO Intelligence: первый реальный ответ модели получен.\n');
  process.stdout.write('Модель: '+result.model+'\n');
  process.stdout.write('Феликс: '+result.text+'\n');
 }).catch(error=>{
  const permitted=/Первый платный тест не разрешён|Облачная модель не включена/.test(String(error?.message));
  // Never print remote error text, HTTP body or private credentials.
  process.stderr.write('SEYVEO: '+(permitted?error.message:'API недоступен или не дал ожидаемый ответ. Проверьте настройки/доступ, без публикации ключа.')+'\n');
  process.exitCode=1;
 });
}
