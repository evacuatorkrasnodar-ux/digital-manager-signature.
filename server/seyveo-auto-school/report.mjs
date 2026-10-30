/* SEYVEO · private readable school exam report.
 * Data is synthetic and local only. HTML is completely static, escaped and
 * must never execute model-supplied HTML or scripts.
 */
import {CURRICULUM} from './core.mjs';

const titles=new Map(CURRICULUM.map(x=>[x.id,x.title]));
const titleFor=id=>titles.get(id)||'Учебная задача';
const statusFor=x=>({
 candidate:'Нужна доработка — пример добавлен в экспериментальный набор',
 'already-passed':'Сэйви справилась — новый урок не требуется',
 rejected:'Проверка отклонена — пример не принят'
}[x.status]||'Неизвестный результат');

export function describeExam(item,index,total){
 const lines=[
  '', '════════════════════════════════════════════════════',
  'ЭКЗАМЕН '+index+'/'+total+' · '+titleFor(item.topic),
  '════════════════════════════════════════════════════',
  'РЕЗУЛЬТАТ: '+statusFor(item)
 ];
 if(item.lesson){
  lines.push('ВОПРОС УЧИТЕЛЯ: '+item.lesson.question);
  lines.push('ЭТАЛОН ОТВЕТА: '+item.lesson.reference_answer);
  lines.push('ЧТО ПРОВЕРЯЕМ: '+item.lesson.criteria.join(' | '));
 }
 if(item.studentAnswer)lines.push('ОТВЕТ СЭЙВИ: '+item.studentAnswer);
 if(item.referenceGrade)lines.push('ПРОВЕРКА ЭТАЛОНА: '+item.referenceGrade.score+'/5 — '+item.referenceGrade.reason);
 if(item.pupilGrade)lines.push('ОЦЕНКА СЭЙВИ: '+item.pupilGrade.score+'/5 — '+item.pupilGrade.reason);
 if(item.reason)lines.push('ПРИЧИНА ОТКЛОНЕНИЯ: '+item.reason);
 if(item.status==='candidate')lines.push('СЛЕДУЮЩИЙ ШАГ: учебный пример сохранится для будущей проверки и дообучения. Сейчас веса модели не меняются.');
 return lines.join('\n');
}

export function describeSession(summary,{at=new Date().toISOString()}={}){
 const lines=[
  'SEYVEO · АВТОМАТИЧЕСКАЯ ШКОЛА · ОТЧЁТ',
  'Дата сессии: '+at,
  'Проверено: '+summary.processed,
  'Сэйви справилась: '+summary.counts.passed,
  'Кандидатов для будущего обучения: '+summary.counts.candidate,
  'Отклонено: '+summary.counts.rejected,
  'ВНИМАНИЕ: оценки выставляет ИИ, не независимый эксперт. Веса модели не менялись.',
  'Отчёт содержит только синтетические примеры, не переписку пользователей.'
 ];
 summary.results.forEach((x,i)=>lines.push(describeExam(x,i+1,summary.results.length)));
 return lines.join('\n')+'\n';
}

function escapeHtml(value){
 return String(value??'').replace(/[&<>"']/g,letter=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
 }[letter]));
}
function detail(label,text){
 if(!text)return '';
 return '<div class="part"><div class="label">'+escapeHtml(label)+'</div><div class="body">'+escapeHtml(text)+'</div></div>';
}
export function htmlSession(summary,{at=new Date().toISOString()}={}){
 const cards=summary.results.map((item,i)=>{
  const examName=titleFor(item.topic);
  const status=item.status==='already-passed'?'success':item.status==='candidate'?'candidate':'rejected';
  const score=item.pupilGrade?item.pupilGrade.score+'/5':'нет оценки';
  return '<article class="card '+status+'"><div class="cardhead"><span class="topic">'+
   escapeHtml(String(i+1).padStart(2,'0')+' / '+examName)+'</span><span class="score">'+escapeHtml(score)+
   '</span></div><div class="status">'+escapeHtml(statusFor(item))+'</div>'+
   (item.lesson?detail('Вопрос учителя',item.lesson.question)+
      detail('Как правильно',item.lesson.reference_answer)+
      detail('Критерии',item.lesson.criteria.join(' · ')):'')+
   detail('Ответ Сэйви',item.studentAnswer)+
   (item.pupilGrade?detail('Оценка и разбор',item.pupilGrade.reason):'')+
   (item.referenceGrade?detail('Проверка эталона учителя',item.referenceGrade.reason):'')+
   detail('Причина отклонения',item.reason)+
   '</article>';
 }).join('\n');
 return '<!doctype html><html lang="ru"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width, initial-scale=1">'+
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">'+
  '<title>SEYVEO · Школа · Отчёт</title><style>'+
  ':root{color-scheme:dark;font-family:system-ui,Arial,sans-serif;background:#0b1310;color:#f1f8f3}'+
  '*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at top,#17392b,#0b1310 65%)}'+
  'main{max-width:830px;margin:0 auto;padding:32px 16px 72px}h1{font-size:clamp(23px,4vw,35px);font-weight:550;letter-spacing:.08em;margin:8px 0}'+
  '.overline{color:#9de0b8;font-size:11px;letter-spacing:.28em}.sub{color:#a0b6aa;font-size:13px;margin:0 0 25px}'+
  '.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:20px 0}'+
  '.stat,.card{background:#12231b;border:1px solid #355944;border-radius:19px}'+
  '.stat{padding:14px;text-align:center}.stat b{display:block;color:#a7e6bc;font-size:25px}.stat span{font-size:12px;color:#aac3b4}'+
  '.card{padding:22px;margin:12px 0;border-left:3px solid #80988b;box-shadow:0 14px 30px #0002}'+
  '.card.success{border-left-color:#63c39a}.card.candidate{border-left-color:#e5bd7b}.card.rejected{border-left-color:#c58c80}'+
  '.cardhead{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap}'+
  '.topic{font-size:18px;font-weight:600}.score{color:#a4dfbd;font-size:14px}'+
  '.status{color:#c4d6c8;font-size:12px;margin-top:7px}.part{margin-top:17px}'+
  '.label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8dab9b;margin-bottom:5px}'+
  '.body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.55}'+
  '.warning{font-size:12px;color:#b4bdb3;line-height:1.6;background:#ffffff09;padding:12px;border-radius:12px}'+
  '@media print{:root{color-scheme:light}body{color:#111;background:#fff}.stat,.card,.warning{background:#fff;color:#111;border-color:#aaa}.body,.topic{color:#111}}'+
  '</style></head><body><main>'+
  '<div class="overline">✦ SEYVEO · LEARNING ENGINE</div>'+
  '<h1>Дневник школы Сэйви</h1><p class="sub">Учитель · ученица · экзаменатор · '+
  escapeHtml(at)+'</p><div class="summary">'+
  '<div class="stat"><b>'+summary.processed+'</b><span>Проверено</span></div>'+
  '<div class="stat"><b>'+summary.counts.passed+'</b><span>Справилась</span></div>'+
  '<div class="stat"><b>'+summary.counts.candidate+'</b><span>Уроков на доработку</span></div>'+
  '</div><p class="warning">Это предварительные оценки другой модели ИИ. Экспериментальные уроки не равны реальному обучению весов и не запускаются в приложении. Данные хранятся на этом компьютере.</p>'+
  cards+'</main></body></html>';
}
