/* Manual Felix study demo. Default = offline preview.
 * Internet call requires BOTH --live AND SEYVEO_RESEARCH_ENABLE=1.
 */
import {APPROVED_SOURCES,studyDryRun,studyPublicSource} from './research-school.mjs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

function show(result){
 if(!result.networkUsed)return 'SEYVEO · Школа Феликса\nИсточник: '+result.source+
 '\nИнтернет не использовался. Нейросеть не обучалась.\nДля реального чтения: включи разрешение в окружении и явно добавь --live.';
 return [
  'SEYVEO · Школа Феликса / Материал для проверки',
  'Источник: '+result.source,
  'Адрес: '+result.sourceUrl,
  'Время получения: '+result.observedAt,
  'Статус: ТРЕБУЕТ ПРОВЕРКИ. В память НЕ сохранено.',
  '-----------------------------------',
  result.preview,
  '-----------------------------------',
  result.warning,
  'Вес модели не изменился; никаких фоновых задач нет.'
 ].join('\n');
}
export async function main(args=process.argv.slice(2),env=process.env){
 const idArg=args.find(x=>x.startsWith('--source='));
 const id=idArg?idArg.slice('--source='.length):'web-standards';
 if(args.includes('--list')){
  for(const s of APPROVED_SOURCES)console.log(s.id+' — '+s.title);
  return;
 }
 const live=args.includes('--live');
 const result=live?
  await studyPublicSource(id,{confirmed:true,enabled:env.SEYVEO_RESEARCH_ENABLE==='1'}):
  studyDryRun(id);
 console.log(show(result));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 main().catch(error=>{
  console.error('Изучение не начато: '+String(error?.message||'ошибка'));
  process.exitCode=1;
 });
}
