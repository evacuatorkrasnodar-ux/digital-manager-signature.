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
window.SEYVEO_NOTE_NL=parseNoteInstruction;
})();