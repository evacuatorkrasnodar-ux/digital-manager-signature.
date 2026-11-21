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
 // These ids are part of the Drawing roadmap (docs/SEYVEO-SAYVI-DRAWING.md).
 // They must never be reported as available until a real provider, preview,
 // validation and confirmed commit path are implemented.
 const future=[
  {id:'draw',label:'Нарисовать по просьбе',match:/нарисуй|нарисова|создай.*рисун|сгенерир|добав.*(дерев|облак|человек|животн)/i},
  {id:'extend',label:'Дорисовать набросок',match:/дорисуй|дорисова|продолжи.*рисун|заверши.*наброс|дополни.*рисун/i},
  {id:'colorize',label:'Раскрасить рисунок',match:/раскрас|покрас|распис.*цвет|цвет.*рисун/i},
  {id:'style',label:'Изменить художественный стиль',match:/стил[ье]|преобразуй.*стил|акварел|карандашн.*эскиз|мультяш/i},
  {id:'erase',label:'Убрать объект из рисунка',match:/удали.*(объект|лишн|предмет)|убери.*(объект|лишн|предмет)|стереть.*предмет/i},
  {id:'enhance',label:'Улучшить рисунок',match:/улучши.*рисун|более красив|выразител|доработай.*рисун|детализир|сделай красиво/i},
  {id:'understand',label:'Понять сложный рисунок',match:/что изображен|пойми.*рисун|объясни.*рисун|узнай.*предмет/i},
  {id:'spelling',label:'Полная проверка орфографии',match:/орфограф|граммат|исправ.*ошиб|провер.*ошиб|проверь.*текст|пунктуац/i},
  {id:'layout',label:'Умная композиция',match:/оформ.*красив|композиц|располож.*объект/i},
  {id:'document',label:'Перенос в Документы',match:/отправ.*документ|сделай.*pdf|создай.*договор/i}
 ];
 function plan(raw){
  const request=String(raw||'').trim().slice(0,600);
  const available=actions.filter(action=>action.match.test(request)).map(({id,label,target})=>({id,label,target,status:'available'}));
  const planned=future.filter(action=>action.match.test(request)).map(({id,label})=>({id,label,status:'future'}));
  return {request,steps:[...available,...planned],unmatched:!available.length&&!planned.length};
 }
 function verifyDraft(raw,{width=840,height=1188}={}){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<100||height<100||!raw||
   raw.kind!=='paper-preview'||raw.requiresConfirmation!==true||raw.originalUntouched!==true||
   !Array.isArray(raw.strokes)||!raw.strokes.length||raw.strokes.length>60)return null;
  let total=0;
  const strokes=[];
  for(const s of raw.strokes){
   if(s?.tool!=='pen'||typeof s.color!=='string'||!/^#[0-9a-f]{6}$/i.test(s.color)||
    !Number.isFinite(s.width)||s.width<1||s.width>20||!Array.isArray(s.points)||
    s.points.length<2||s.points.length>700)return null;
   total+=s.points.length;if(total>5000)return null;
   if(s.points.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)||
    p[0]<0||p[0]>width||p[1]<0||p[1]>height||p[2]<0||p[2]>100))return null;
   strokes.push({tool:'pen',color:s.color,width:s.width,points:s.points.map(p=>p.slice())});
  }
  return {title:String(raw.title||'Рисунок Сэйви').slice(0,100),strokes};
 }
 return Object.freeze({plan,verifyDraft});
});
