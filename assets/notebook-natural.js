/* SEYVEO · local notebook command parser, no external AI or automatic saving. */
(function(){
'use strict';
function parseNoteInstruction(input){
 const phrase=String(input||'').trim().replace(/\s+/g,' ').slice(0,2800);
 if(!phrase)return null;
 let body=phrase.replace(/^(?:seyveo|сейвео|севео|сейво)\s*[,!:.]?\s*/i,'')
  .replace(/^пожалуйста[,\s]*/i,'').trim();
 const boundary='(?=\\s|$|[,:.!?—–-])';
 const cmds=[
  new RegExp('^(?:запомни|запомните)\\s+(?:(?:эту|мою|важную)\\s+)?(?:мысль|идею|заметку)'+boundary+'\\s*[:.,!?—–-]?\\s*','i'),
  new RegExp('^(?:запиши|сохрани|добавь)\\s+(?:это\\s+)?(?:в\\s+)?(?:мой\\s+)?(?:блокнот|заметки)'+boundary+'\\s*[:.,!?—–-]?\\s*','i'),
  new RegExp('^(?:запиши|сохрани)\\s+(?:(?:эту|мою|важную)\\s+)?(?:мысль|идею|заметку)'+boundary+'\\s*[:.,!?—–-]?\\s*','i'),
  new RegExp('^(?:запомни|запомните)'+boundary+'\\s*[:.,!?—–-]?\\s*','i')
 ];
 let matched=false;
 for(const re of cmds){
  const part=body.match(re);
  if(part){body=body.slice(part[0].length);matched=true;break}
 }
 if(!matched)return null;
 body=body.replace(/^(?:что|о\s+том,\s*что)\s+/i,'').replace(/^[,:.!?\s—–-]+/,'').trim();
 if(!body)return{status:'clarify',message:'Какую мысль сохранить? Скажи, например: «Запомни мысль: открыть новую студию». Ничего пока не записано.'};
 return{status:'ready',text:body.slice(0,2500)};
}
/* Date suggestion from explicit wording only. This does NOT create an event. */
function dateHintFromNote(input,now=new Date()){
 const phrase=String(input||'').toLowerCase().slice(0,2500);
 const weekdays={понедельник:1,вторник:2,среду:3,четверг:4,пятницу:5,субботу:6,воскресенье:0};
 const rel=phrase.match(/(?:^|[\s,;:.!?])(?:на\s+)?(завтра|послезавтра)(?=\s|[,.!?:;]|$)/i);
 const week=phrase.match(/(?:^|[\s,;:.!?])(?:в|во|на)\s+(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)(?=\s|[,.!?:;]|$)/i);
 if(!rel&&!week)return null;
 const offset=rel?(rel[1]==='завтра'?1:2):(weekdays[week[1]]-now.getDay()+7)%7||7;
 const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset);
 const pad=n=>String(n).padStart(2,'0');
 return {date:date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate()),
  label:rel?rel[1]:week[1]};
}
/* Safe local suggestions: an explicit single action, or a small action plan.
   Nothing is stored or sent elsewhere until the person reviews and confirms. */
const ACTION_WORDS='позвонить|позвони|позвоню|созвониться|встретиться|встреча|встречу|встречаемся|подготовить|отправить|купить|забрать|оплатить|написать|записаться|обсудить|проверить|сделать|заказать|напомнить|согласовать|поговорить';
const ACTION=new RegExp('(?:^|[\\s,(])(?:'+ACTION_WORDS+')(?=\\s|[,.!?;:]|$)','i');
const MEETING=/(?:^|[\s,(])(?:встретиться|встреча|встречу|встречаемся)(?=\s|[,.!?;:]|$)/i;
function actionClauses(input){
 const raw=String(input||'').trim();
 if(!raw||raw.length>8000)return [];
 // Commas only divide a note when a new actionable verb follows them.
 const re=new RegExp(',\\s*(?=(?:'+ACTION_WORDS+')(?:\\s|[,.!?;:]|$))','i');
 return raw.split(/[\n;]|[.!?](?=\s|$)/).flatMap(part=>part.split(re))
  .map(value=>value.replace(/^\s*[-•\d.)]+\s*/,'').trim())
  .filter(Boolean).slice(0,30);
}
function actionHintFromNote(input,now=new Date()){
 const candidates=actionClauses(input).filter(text=>ACTION.test(text));
 if(candidates.length!==1)return null;
 const phrase=candidates[0].slice(0,280);
 const event=MEETING.test(phrase);
 const hint=dateHintFromNote(phrase,now);
 // For precise clock times use the existing Calendar's editable review form.
 const timeMatch=phrase.match(/(?:^|\s)в\s+([01]?\d|2[0-3]):([0-5]\d)(?=\s|[,!?.]|$)/);
 const time=timeMatch?String(Number(timeMatch[1])).padStart(2,'0')+':'+timeMatch[2]:'';
 return{
  type:event?'event':'task',
  title:phrase.slice(0,140),
  ...(hint?{date:hint.date,dateLabel:hint.label}:{}),
  ...(hint&&time?{time}:{}),
 };
}
/* A single plan of 2–5 clear tasks. Mixed meeting/task notes are left for
   individual review; never quietly convert a meeting into a to-do. */
function taskPlanFromNote(input,now=new Date()){
 const candidates=actionClauses(input).filter(text=>ACTION.test(text));
 if(candidates.length<2||candidates.length>5||candidates.some(text=>MEETING.test(text)))return null;
 const seen=new Set(),items=[];
 for(const phrase of candidates){
  const hint=dateHintFromNote(phrase,now);
  const title=phrase.slice(0,140).trim();
  const due=hint?.date||'';
  const key=title.toLocaleLowerCase('ru-RU').replace(/\s+/g,' ')+'|'+due;
  if(seen.has(key))continue;
  seen.add(key);
  items.push({title,due});
 }
 return items.length>=2?{items}:null;
}
window.SEYVEO_NOTE_TASK_PLAN=taskPlanFromNote;
window.SEYVEO_NOTE_ACTION_HINT=actionHintFromNote;
window.SEYVEO_NOTE_SCHEDULE_HINT=dateHintFromNote;
window.SEYVEO_NOTE_NL=parseNoteInstruction;
})();