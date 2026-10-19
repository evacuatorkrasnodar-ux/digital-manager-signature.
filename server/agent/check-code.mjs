/* SEYVEO Code Review · CLI demo. Reads one approved repository file, no edits. */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {APPROVED_REVIEW_FILES,reviewApprovedFile} from './code-review.mjs';

export function formatReview(review){
 const text=['SEYVEO · Феликс / Проверка исходного кода',
  'Файл: '+review.file,'Строк: '+review.lines,
  'SHA-256: '+review.sha256,
  'Замечаний для ручной проверки: '+review.findings.length];
 for(const finding of review.findings)
  text.push('  • Строка '+finding.line+' ['+finding.id+'] '+finding.detail);
 if(review.limited)text.push('Список ограничен первыми 12 замечаниями.');
 text.push('Это автоматические подсказки, не диагностика уязвимости.');
 text.push('Тесты не запускались. Файлы не изменены.');
 return text.join('\n');
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const file=process.argv.slice(2).join(' ').trim();
 if(!file){
  console.log('Запуск: node server/agent/check-code.mjs server/agent/planner.mjs');
  console.log('Разрешённые файлы: '+APPROVED_REVIEW_FILES.join(', '));
 }else{
  try{console.log(formatReview(await reviewApprovedFile(file)))}
  catch(e){console.error('Проверка отклонена: '+String(e?.message||'error'));process.exitCode=1}
 }
}