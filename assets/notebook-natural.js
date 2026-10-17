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
window.SEYVEO_NOTE_SCHEDULE_HINT=dateHintFromNote;
window.SEYVEO_NOTE_NL=parseNoteInstruction;
})();