/* SEYVEO Paper · transparent local intent planning (no invented AI result). */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SEYVEO_PAPER_REQUESTS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const actions=[
  {id:'smooth',label:'Сделать аккуратнее',target:'notePaperSmoothInk',match:/ровн|крив|сглад|аккурат|дрож|выпрям|исправ.*(лини|рисунк|штрих)/i},
  {id:'recognize',label:'Распознать рукопись',target:'notePaperRecognizeOpen',match:/распозн|прочит|счита[йт]|перевед.*текст|что написан|разбер.*почерк/i},
  {id:'handwriting',label:'Мой почерк',target:'notePaperMyHandwriting',match:/моим почерк|мой почерк|запомн.*букв|науч.*почерк|пиши как я|моими букв/i},
  {id:'typeset',label:'Добавить печатный текст',target:'notePaperTextAction',match:/добав.*текст|печатн.*текст|напечат|встав.*надпис/i},
  {id:'photo',label:'Настроить фото',target:'notePaperEditPhoto',match:/двиг.*фот|перемест.*фот|размер.*фот|настро.*фот/i}
 ];
 const future=[
  {id:'draw',label:'Нарисовать по просьбе',match:/нарисуй|нарисова|создай.*рисун|сгенерир|добав.*(дерев|облак|человек|животн)/i},
  {id:'understand',label:'Понять сложный рисунок',match:/что изображен|пойми.*рисун|объясни.*рисун|узнай.*предмет/i},
  {id:'spelling',label:'Полная проверка орфографии',match:/орфограф|граммат|исправ.*ошиб|провер.*ошиб|проверь.*текст|пунктуац/i},
  {id:'layout',label:'Умная композиция',match:/сделай красиво|оформ.*красив|композиц|располож.*объект/i},
  {id:'document',label:'Перенос в Документы',match:/отправ.*документ|сделай.*pdf|создай.*договор/i}
 ];
 function plan(raw){
  const request=String(raw||'').trim().slice(0,600);
  const available=actions.filter(action=>action.match.test(request)).map(({id,label,target})=>({id,label,target,status:'available'}));
  const planned=future.filter(action=>action.match.test(request)).map(({id,label})=>({id,label,status:'future'}));
  return {request,steps:[...available,...planned],unmatched:!available.length&&!planned.length};
 }
 return Object.freeze({plan});
});
