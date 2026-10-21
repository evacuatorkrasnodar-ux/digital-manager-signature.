/* SEYVEO · local Russian calendar-command parser.
   This is a conservative rule-based adapter, not a remote AI service. */
(function(){
'use strict';
const format=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const step=(date,days)=>new Date(date.getFullYear(),date.getMonth(),date.getDate()+days);
const sentence=s=>s.charAt(0).toLocaleUpperCase('ru-RU')+s.slice(1);
function parseCalendarInstruction(input,now=new Date()){
 const request=String(input||'').trim().replace(/\s+/g,' ').slice(0,500);
 const lower=request.toLocaleLowerCase('ru-RU');
 const intro=lower.match(/^(?:(?:сэйви|сейви|сэй|сей|seyveo|сейвео)[,!\s]+)?(?:пожалуйста[,\s]+)?(запиши|запланируй|назначь|добавь|создай|поставь)(?=\s|$|[,!?.:])/);
 if(!intro)return null;
 let body=request.slice(intro[0].length).trim();
 const bodyLower=body.toLocaleLowerCase('ru-RU');
 if(/в блокнот|в заметк|в документ|в список покупок|будильник/i.test(bodyLower))return null;
 const calendarHint=/календар|расписани|событи|встреч|звонок|при[её]м|к\s+(?:врачу|стоматологу|доктору|педиатру)/i.test(bodyLower);
 const dateHint=/сегодня|завтра|послезавтра|понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье|\d{1,2}[./-]\d{1,2}|\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i.test(bodyLower);
 if(!calendarHint&&!(dateHint&&/^(запиши|запланируй|назначь)$/.test(intro[1])))return null;
 const clarify=message=>({status:'clarify',message});
 if(/следующ|прошл|через\s+|недел[еюь]|выходн|утром|вечером|полдень|после обеда/i.test(body)){
  return clarify('Уточните точную дату и время. Например: «Запиши встречу 20 октября в 15:00».');
 }
 let date=null,match;
 match=body.match(/(?:^|\s)(?:на\s+|в\s+)?(сегодня|завтра|послезавтра)(?=\s|$|[,.!?])/i);
 if(match){
  const term=match[1].toLocaleLowerCase('ru-RU');
  date=step(now,term==='сегодня'?0:term==='завтра'?1:2);
  body=body.replace(match[0],' ').trim();
 }
 if(!date){
  match=body.match(/(?:^|\s)(?:на\s+|в\s+)?(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?(?=\s|$|[,!?])/i);
  if(match){
   const day=Number(match[1]),month=Number(match[2]),explicitYear=!!match[3];
   const year=explicitYear?Number(match[3]):now.getFullYear();
   date=new Date(year,month-1,day);
   if(year<1900||year>2100||date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day)
    return clarify('Дата выглядит неверной. Уточните день и месяц.');
   if(!explicitYear&&format(date)<format(now))date=new Date(year+1,month-1,day);
   body=body.replace(match[0],' ').trim();
  }
 }
 if(!date){
  const months={января:0,февраля:1,марта:2,апреля:3,мая:4,июня:5,июля:6,августа:7,сентября:8,октября:9,ноября:10,декабря:11};
  match=body.match(/(?:^|\s)(?:на\s+|в\s+)?(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4})\s*г\.?)?(?=\s|$|[,.!?])/i);
  if(match){
   const day=Number(match[1]),month=months[match[2].toLocaleLowerCase('ru-RU')],explicitYear=!!match[3];
   const year=explicitYear?Number(match[3]):now.getFullYear();
   date=new Date(year,month,day);
   if(year<1900||year>2100||date.getFullYear()!==year||date.getMonth()!==month||date.getDate()!==day)
    return clarify('Не получается определить дату. Проверьте число и месяц.');
   if(!explicitYear&&format(date)<format(now))date=new Date(year+1,month,day);
   body=body.replace(match[0],' ').trim();
  }
 }
 if(!date){
  const weekdays={понедельник:1,вторник:2,среду:3,четверг:4,пятницу:5,субботу:6,воскресенье:0};
  match=body.match(/(?:^|\s)(?:на\s+|в\s+|во\s+)?(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)(?=\s|$|[,.!?])/i);
  if(match){
   const day=weekdays[match[1].toLocaleLowerCase('ru-RU')],gap=(day-now.getDay()+7)%7;
   date=step(now,gap===0?7:gap);
   body=body.replace(match[0],' ').trim();
  }
 }
 if(!date)return clarify('Уточните дату. Например: «Запиши меня к стоматологу на вторник в 15:00».');
 let time='';
 match=body.match(/(?:^|\s)(?:в|к|на)\s*(\d{1,2})(?::(\d{1,2}))?(?=\s|$|[,.!?])/i);
 if(match){
  const hour=Number(match[1]),minute=match[2]===undefined?0:Number(match[2]);
  if(hour>23||minute>59)return clarify('Уточните время в формате 15:00 или 15:30.');
  time=String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
  body=body.replace(match[0],' ').replace(/^(?:часов|часа|час)\s*/i,'').trim();
 }
 if(/(?:^|\s)(?:в|к|на)\s*\d{1,2}[:.]\d+/i.test(body))
  return clarify('Не могу точно прочитать время. Напишите, например, «в 15:30».');
 let title=body.replace(/\s*пожалуйста[.!?]*\s*$/i,'').trim();
 for(let n=0;n<2;n++)title=title.replace(/^(?:меня|мне)\s+/i,'').replace(/^(?:в календарь|в расписание)\s+/i,'').trim();
 title=title.replace(/[,.!?]+$/,'').trim().replace(/^встречу(?=\s|$)/i,'Встреча');
 if(!title)return clarify('Что именно записать? Добавьте название события.');
 return {status:'ready',title:sentence(title.slice(0,140)),date:format(date),time};
}
window.SEYVEO_CALENDAR_NL=parseCalendarInstruction;
})();