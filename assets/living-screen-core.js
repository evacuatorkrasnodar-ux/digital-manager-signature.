/* SEYVEO Living Screen · deterministic scene language v1.
 * Pure reader: no storage, DOM, permissions, network or autonomous actions.
 * Real data stay in their original modules; the screen only describes it.
 * Kept testable on Node and usable by the existing single-sphere PWA. */
(function(host,build){
 'use strict';
 const api=build();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else if(host)host.SEYVEO_LIVING_SCREEN_CORE=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const safeCount=value=>Number.isInteger(value)&&value>=0&&value<=10000?value:null;
 const ruCount=(value,one,many,five)=>{
  const n=value%100,n1=value%10;
  return value+' '+(n>10&&n<20?five:n1===1?one:n1>=2&&n1<=4?many:five);
 };
 function resolve(input){
  const data=input&&typeof input==='object'?input:{};
  const screen=String(data.screen||'home');
  const count=safeCount(data.count);
  const priority=Boolean(data.priority);
  const mode=['day','week','month','deadlines'].includes(data.mode)?data.mode:'month';
  switch(screen){
   case 'tasks':
    return {context:'tasks',eyebrow:'Сэйви · поручения',
     line:priority
      ?'Я выделила ближайшее дело. Его можно открыть прямо здесь.'
      :count===0?'На сегодня открытых дел нет. Новое поручение можно добавить ниже.'
      :count===null?'Ваши поручения рядом. Сначала разберём главное.'
      :'Открыто '+ruCount(count,'дело','дела','дел')+'. Выбирайте, с чего начать.'};
   case 'calendar':{
    const names={day:'день',week:'неделю',month:'месяц',deadlines:'сроки'};
    const selection=data.selection===true;
    return {context:'calendar',eyebrow:'Сэйви · время',
     line:mode==='deadlines'?'Собрала сроки в одном месте. Коснитесь записи для продолжения.'
     :'Показываю '+names[mode]+'. '+(selection?'События выбранной даты — ниже.':'Выберите дату, чтобы увидеть её события.')};
   }
   case 'life':
    return {context:'life',eyebrow:'Сэйви · личное',
     line:'Ваши записи, люди, здоровье и забота рядом. Личное остаётся под вашим контролем.'};
   case 'picture':
    return {context:'picture',eyebrow:'Сэйви · картина',
     line:count===0?'Здесь появятся выбранные вами показатели. Подключения — под вашим контролем.'
     :count===null?'Собираю доступные показатели в одну картину.'
     :'На экране '+ruCount(count,'показатель','показателя','показателей')+'. Откройте любой для подробностей.'};
   case 'manage':
    return {context:'manage',eyebrow:'Сэйви · возможности',
     line:'Здесь вы решаете, что мне разрешено. Подключения и правила доступны ниже.'};
   case 'video':
    return {context:'video',eyebrow:'Сэйви · видео',line:''};
   case 'music':
    return {context:'music',eyebrow:'Сэйви · музыка',
     line:data.playing===true?'Музыка играет. Управление остаётся в одном доке.'
     :'Ваша музыка рядом. Выберите трек, чтобы начать.'};
   case 'sayvi':
    return {context:'sayvi',eyebrow:'Сэйви · пространство',line:''};
   default:
    return {context:'home',eyebrow:'Сэйви',line:''};
  }
 }
 return Object.freeze({resolve,ruCount});
});
