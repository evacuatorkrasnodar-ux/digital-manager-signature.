/* SEYVEO · task request parser. Draft only: no writes or external AI. */
(function(){
'use strict';
const format=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const plus=(date,days)=>new Date(date.getFullYear(),date.getMonth(),date.getDate()+days);
const valid=(y,m,d)=>{let x=new Date(y,m-1,d);return y>=1900&&y<=2100&&x.getFullYear()===y&&x.getMonth()+1===m&&x.getDate()===d?x:null};
function understand(input,now=new Date()){
 if(typeof input!=='string'||input.length>700)return null;
 let body=input.trim().replace(/\s+/g,' ').replace(/^(?:(?:сэйви|сейви|сэй|сей|сейвео|seyveo)[,!:.\s]+)?(?:пожалуйста[,\s]+)?/i,'').trim();
 let match=body.match(/^напомни(?:те)?(?:\s+мне)?(?=\s|$|[,.!?:])/i);
 const reminder=Boolean(match);
 if(!match)match=body.match(/^(?:добавь|создай|запиши|поставь)\s+(?:(?:мне|пожалуйста)\s+)?(?:(?:в\s+)?(?:мои\s+)?(?:дела|дело|задачу|задачи|поручение))(?=\s|$|[,.!?:])/i);
 if(!match)return null;
 body=body.slice(match[0].length).replace(/^\s*[:.,!—-]\s*/,'').trim();
 const ask=message=>({status:'clarify',kind:'task',message});
 if(!body)return ask('Что нужно сделать? Например: «Добавь дело купить продукты завтра».');
 if(/(?:^|\s)(?:через\s+(?:\d+|недел\w*|месяц|год|час)|следующ\w*|прошл\w*|кажд\w*|ежедневн\w*|еженедел\w*)/i.test(body)||
    /утром|вечером|ночью|после обеда|к вечеру|до обеда/i.test(body))
  return ask('Уточните конкретную дату. Для напоминаний по часам используйте календарь.');
 if(/(?:^|\s)(?:в|к|на)\s*\d{1,2}(?::\d{1,2}|\s+час(?:ов|а)?)(?=\s|$|[,.!?])/i.test(body))
  return ask('В делах можно указать день, но не час. Для точного времени используйте событие календаря.');
 let date=null,m=body.match(/(?:^|\s)(?:на\s+|в\s+)?(сегодня|завтра|послезавтра)(?=\s|$|[,.!?])/i);
 if(m){date=plus(now,({сегодня:0,завтра:1,послезавтра:2})[m[1].toLowerCase()]);body=body.replace(m[0],' ').trim();}
 if(!date){
  m=body.match(/(?:^|\s)(?:на\s+|в\s+)?(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?(?=\s|$|[,.!?])/i);
  if(m){
   const y=m[3]?Number(m[3]):now.getFullYear(),mo=Number(m[2]),d=Number(m[1]);
   date=valid(y,mo,d);
   if(!date)return ask('Дата выглядит неверной. Проверьте число и месяц.');
   if(!m[3]&&format(date)<format(now))date=valid(y+1,mo,d);
   if(!date)return ask('Уточните год даты.');
   body=body.replace(m[0],' ').trim();
  }
 }
 if(!date){
  const names={января:1,февраля:2,марта:3,апреля:4,мая:5,июня:6,июля:7,августа:8,сентября:9,октября:10,ноября:11,декабря:12};
  m=body.match(/(?:^|\s)(?:на\s+|в\s+)?(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?(?=\s|$|[,.!?])/i);
  if(m){
   const y=m[3]?Number(m[3]):now.getFullYear(),mo=names[m[2].toLowerCase()],d=Number(m[1]);
   date=valid(y,mo,d);
   if(!date)return ask('Неверная дата. Уточните число и месяц.');
   if(!m[3]&&format(date)<format(now))date=valid(y+1,mo,d);
   if(!date)return ask('Уточните год даты.');
   body=body.replace(m[0],' ').trim();
  }
 }
 if(!date){
  const weekdays={понедельник:1,вторник:2,среду:3,четверг:4,пятницу:5,субботу:6,воскресенье:0};
  m=body.match(/(?:^|\s)(?:в\s+|во\s+|на\s+)?(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)(?=\s|$|[,.!?])/i);
  if(m){const n=(weekdays[m[1].toLowerCase()]-now.getDay()+7)%7;date=plus(now,n||7);body=body.replace(m[0],' ').trim();}
 }
 if(/(?:^|\s)(?:сегодня|завтра|послезавтра|понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)(?=\s|$|[,.!?])/i.test(body)||
 /(?:^|\s)\d{1,2}[./-]\d{1,2}(?=\s|$)/.test(body))return ask('Уточните одну дату, пожалуйста.');
 if(reminder&&!date)return ask('На какой день напомнить? Например: «Напомни завтра позвонить маме».');
 const title=body.replace(/[.!?,:]+$/,'').replace(/^(?:(?:мне|пожалуйста|что)\s+){1,2}/i,'').trim();
 if(!title)return ask('Напишите, какое дело нужно выполнить.');
 if(title.length>140)return ask('Сократите название дела до 140 символов.');
 return {status:'ready',kind:'task',title,date:date?format(date):''};
}
if(typeof module!=='undefined'&&module.exports)module.exports={understand};
if(typeof window!=='undefined')window.SEYVEO_TASK_NL=understand;
})();