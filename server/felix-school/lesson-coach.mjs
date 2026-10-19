/* SEYVEO · Felix Lesson Coach v0.1
 * Uses ONE short, hand-approved synthetic example from the existing curriculum.
 * No user chats, private memory, disk writes, Internet or fine-tuning.
 * Defaults on; SEYVEO_LESSON_COACH=0 disables instantly for A/B comparisons.
 */
import {readFileSync} from 'node:fs';
import {classify,normalizeMessage} from '../hybrid-core.mjs';

const MAX_EXAMPLE_CHARS=460;
const MAX_QUESTION_CHARS=4000;
const LESSONS=new Map();
const allowed=new Set([
 'business-metrics','business-contradiction','code-performance','code-clarity',
 'calendar-ambiguity','business-competitors','humor-respect','no-forced-joke'
]);
const dataset=readFileSync(new URL('./lessons-batch2.jsonl',import.meta.url),'utf8');
for(const row of dataset.trim().split(/\r?\n/u)){
 const item=JSON.parse(row);
 if(!allowed.has(item.skill))continue;
 if(!Array.isArray(item.messages)||item.messages.length!==2)throw Error('bad-coach-lesson');
 const [q,a]=item.messages;
 if(q.role!=='user'||a.role!=='assistant'||typeof q.content!=='string'||typeof a.content!=='string')
  throw Error('bad-coach-lesson');
 const output='Образец ответа (искусственный пример, не сведения о пользователе; не копируй дословно):\n'+
  'Запрос: '+q.content.trim()+'\nОтвет: '+a.content.trim();
 if(output.length<=MAX_EXAMPLE_CHARS)LESSONS.set(item.skill,output);
}
if(LESSONS.size!==allowed.size)throw Error('missing-vetted-coach-lessons');

// Ordered by specificity. Never interpolate user input into a model system message.
const MATCHERS=Object.freeze([
 ['code-clarity',/\b403\b|forbidden/iu],
 ['business-metrics',/(?:реклам|клик|просмотр).*(?:нет заяв|нет заказ|заявок нет|заказов нет|не покуп|конверс)/iu],
 ['business-contradiction',/(?:нанять|найм|сотрудник).*(?:без клиент|сразу|десят)/iu],
 ['calendar-ambiguity',/(?:перенес|перенеси|перенос).*(?:встреч|событи)/iu],
 ['code-performance',/(?:приложен|сайт|программ).*(?:медлен|тормоз|лага|ускорить)/iu],
 ['business-competitors',/(?:конкурент|соперник).*(?:цены|дешев|ниже)/iu],
 ['humor-respect',/(?:не смейся|не надо смеяться).*(?:опечат|ошибк)|опечат.*не смейся/iu],
 ['no-forced-joke',/(?:что такое api|объясни api)/iu]
]);
export function selectCoachingExample(message,{enabled=true}={}){
 if(!enabled||process.env.SEYVEO_LESSON_COACH==='0')return null;
 const input=normalizeMessage(message);
 if(input.length>MAX_QUESTION_CHARS)return null;
 const signals=classify(input);
 // Sensitive/high-stakes/urgent scenarios deserve direct strict rules, not examples.
 if(signals.private||signals.highStakes||/(?:экстрен|срочно плохо|боль в груди|трудно дышать)/iu.test(input))
  return null;
 const candidate=MATCHERS.find(([,regex])=>regex.test(input));
 if(!candidate)return null;
 const example=LESSONS.get(candidate[0]);
 return example?Object.freeze({skill:candidate[0],text:example}):null;
}
export function coachMessage(message,opts={}){
 const result=selectCoachingExample(message,opts);
 return result?{role:'system',content:result.text}:null;
}
