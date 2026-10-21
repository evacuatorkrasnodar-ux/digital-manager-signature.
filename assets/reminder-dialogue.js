/* SEYVEO · Pure Russian reminder conversation grammar. No writes or AI. */
(function(){
'use strict';
const pad=n=>String(n).padStart(2,'0');
const iso=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
const plus=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const valid=(y,m,d)=>{const x=new Date(y,m-1,d);return y>=1900&&y<=2100&&x.getFullYear()===y&&x.getMonth()+1===m&&x.getDate()===d?x:null};
function parseParts(input,now=new Date(),short=false){
 let rest=String(input||'').trim().replace(/\s+/g,' '),date='',time='',recognized=false;
 const take=m=>{rest=(rest.slice(0,m.index)+' '+rest.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim()};
 let m=/(?:^|\s)(?:на\s+|в\s+)?(сегодня|завтра|послезавтра)(?=\s|$|[,.!?])/i.exec(rest);
 if(m){date=iso(plus(now,{сегодня:0,завтра:1,послезавтра:2}[m[1].toLowerCase()]));recognized=true;take(m)}
 if(!date){
  m=/(?:^|\s)(?:на\s+|в\s+)?(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?(?=\s|$|[,.!?])/i.exec(rest);
  if(m){
   const y=m[3]?+m[3]:now.getFullYear(),mon=+m[2],d=+m[1];let x=valid(y,mon,d);
   if(!x)return {recognized:true,error:'Такой даты нет. Уточни день и месяц.'};
   if(!m[3]&&iso(x)<iso(now)){x=valid(y+1,mon,d);if(!x)return {recognized:true,error:'Уточни год даты.'}}
   date=iso(x);recognized=true;take(m);
  }
 }
 if(!date){
  const months={января:1,февраля:2,марта:3,апреля:4,мая:5,июня:6,июля:7,августа:8,сентября:9,октября:10,ноября:11,декабря:12};
  m=/(?:^|\s)(?:на\s+|в\s+)?(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?(?=\s|$|[,.!?])/i.exec(rest);
  if(m){
   const y=m[3]?+m[3]:now.getFullYear(),mon=months[m[2].toLowerCase()],d=+m[1];let x=valid(y,mon,d);
   if(!x)return {recognized:true,error:'Такой даты нет. Уточни день и месяц.'};
   if(!m[3]&&iso(x)<iso(now)){x=valid(y+1,mon,d);if(!x)return {recognized:true,error:'Уточни год даты.'}}
   date=iso(x);recognized=true;take(m);
  }
 }
 if(!date){
  const weekdays={понедельник:1,вторник:2,среду:3,четверг:4,пятницу:5,субботу:6,воскресенье:0};
  m=/(?:^|\s)(?:в\s+|во\s+|на\s+)?(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)(?=\s|$|[,.!?])/i.exec(rest);
  if(m){const n=(weekdays[m[1].toLowerCase()]-now.getDay()+7)%7;date=iso(plus(now,n||7));recognized=true;take(m)}
 }
 if(/(?:^|\s)(?:через|следующ\w*|кажд\w*|ежедневно|еженедельно)(?=\s|$)/i.test(rest))
  return {recognized:true,error:'Уточни конкретный день и время.'};
 const words={ноль:0,один:1,одна:1,два:2,три:3,четыре:4,пять:5,шесть:6,семь:7,восемь:8,девять:9,десять:10,одиннадцать:11,двенадцать:12};
 m=/(?:^|\s)(?:в\s+|к\s+)?(\d{1,2}|ноль|один|одна|два|три|четыре|пять|шесть|семь|восемь|девять|десять|одиннадцать|двенадцать)(?::(\d{1,2}))?\s*(утра|утром|вечера|вечером|дня)?(?=\s|$|[,.!?])/i.exec(rest);
 if(m){
  const token=m[0].trim();
  const explicit=/^(?:в|к)\s+/i.test(token)||/^\d{1,2}:\d{1,2}/.test(token);
  // '8 этаж' is a title unless the day/clock was explicit.
  const clock=explicit||date||(short&&rest.replace(/[.!?]$/,'').trim()===token);
  if(clock){
   let hour=words[m[1].toLowerCase()]??Number(m[1]),minute=m[2]?Number(m[2]):0;
   if(/вечера|вечером|дня/i.test(m[3]||'')&&hour>0&&hour<12)hour+=12;
   if(/утра|утром/i.test(m[3]||'')&&hour===12)hour=0;
   if(hour>23||minute>59)return {recognized:true,error:'Уточни время, например «в 08:00».'};
   time=pad(hour)+':'+pad(minute);recognized=true;take(m);
  }
 }
 if(/(?:^|\s)(?:сегодня|завтра|послезавтра)(?=\s|$|[,.!?])/i.test(rest)||
 /(?:^|\s)\d{1,2}[./-]\d{1,2}(?=\s|$)/.test(rest))return {recognized:true,error:'Уточни одну дату, пожалуйста.'};
 if(/(?:утром|вечером|ночью|после обеда)(?=\s|$)/i.test(rest))
  return {recognized:true,error:'Нужен точный час, например «в 08:00» или «в 20:00».'};
 return {date,time,rest:rest.replace(/^[,.!?:\s]+|[,.!?:\s]+$/g,'').trim(),recognized};
}
const question=(title,date,time)=>!title?'О чём тебе напомнить?':!date?'Когда напомнить? Например, «завтра в 8».':!time?'Во сколько напомнить? Например, «в 8 утра».':'';
function build(title,date,time,now){
 if(title.length>140)return {status:'clarify',kind:'reminder',title:'',date,time,message:'Сократи название напоминания.'};
 const due=date&&time?new Date(date+'T'+time+':00'):null;
 const old=due&&Number.isFinite(due.getTime())&&due.getTime()<=now.getTime();
 const ask=old?'Это время уже прошло. Назови другое время.':question(title,date,time);
 return {status:ask?'clarify':'ready',kind:'reminder',title,date,time,message:ask};
}
function fromPhrase(input,now=new Date()){
 if(typeof input!=='string'||input.length>700)return null;
 const phrase=input.trim().replace(/\s+/g,' ');
 const intro=/^(?:(?:сэйви|сейви|сэй|сей|seyveo|сейвео)[,!.:\s]+)?(?:пожалуйста[,\s]+)?напомни(?:те)?(?:\s+мне)?(?=\s|$|[,.!?:])/i.exec(phrase);
 if(!intro)return null;
 const parts=parseParts(phrase.slice(intro[0].length).replace(/^[,.:!\s]+/,''),now);
 if(parts.error)return {status:'clarify',kind:'reminder',title:'',date:'',time:'',message:parts.error};
 const title=parts.rest.replace(/^(?:мне|про|о том\s+что|что)\s+/i,'').trim();
 return build(title,parts.date,parts.time,now);
}
function followup(input,pending,now=new Date()){
 if(!pending||typeof pending.title!=='string'||typeof input!=='string'||input.length>130)return null;
 const value=input.trim().replace(/^(?:сэйви|сейви|сэй|сей)[,!.:\s]+/i,'').trim();
 if(/^(?:отмена|отмени|не надо|забудь|стоп)[.!?]?$/i.test(value))
  return {status:'cancelled',kind:'reminder',message:'Хорошо, напоминание не создаю.'};
 if(/^(?:добавь|запиши|создай|поставь|открой|покажи|привет|спасибо)(?=\s|$)/i.test(value))return null;
 const parts=parseParts(value,now,true);
 if(parts.error)return {status:'clarify',kind:'reminder',title:pending.title,date:pending.date||'',time:pending.time||'',message:parts.error};
 if(!parts.recognized||parts.rest)return null;
 const title=pending.title,date=parts.date||pending.date||'',time=parts.time||pending.time||'';
 return build(title,date,time,now);
}
if(typeof module!=='undefined'&&module.exports)module.exports={parseParts,fromPhrase,followup};
if(typeof window!=='undefined')window.SEYVEO_REMINDER_NL=Object.freeze({parseParts,fromPhrase,followup});
})();