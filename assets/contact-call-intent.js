/* SEYVEO Call Intent · one shared, testable interpretation of contacts.
 * No storage, hidden access, dialing, network traffic or side effects.
 * A name is a candidate, NEVER proof that the right person was reached. */
(function(host,build){
 'use strict';
 const api=build();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else if(host)host.SEYVEO_CALL_INTENT=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const key=value=>String(value||'').trim().replace(/\s+/g,' ')
  .toLocaleLowerCase('ru-RU');
 const juliaNames=new Set([
  'юльчик','юльчику','юльчика','юличка','юличке','юличку',
  'юля','юле','юлю','юли','юлия','юлии','юлию','юлечка','юлечке','юлечку'
 ]);
 function forms(name){
  const value=key(name),out=new Set([value]);
  if(value==='юля'||value==='юлия')
   return new Set(['юля','юлия','юле','юли','юлю','юлии','юлию']);
  if(value.includes(' '))return out;
  if(value.endsWith('ия'))for(const ending of ['и','ю','е'])
   out.add(value.slice(0,-1)+ending);
  else if(value.endsWith('я'))for(const ending of ['е','и','ю'])
   out.add(value.slice(0,-1)+ending);
  else if(value.endsWith('а'))for(const ending of ['е','у','ы','и'])
   out.add(value.slice(0,-1)+ending);
  else if(value.endsWith('й'))for(const ending of ['ю','я'])
   out.add(value.slice(0,-1)+ending);
  else if(value.endsWith('ь'))out.add(value.slice(0,-1)+'и');
  else if(value.length>3){out.add(value+'у');out.add(value+'а');}
  return out;
 }
 function aliases(name){
  const value=key(name);
  const first=value.split(/[\s(,]+/)[0];
  const out=forms(name);
  if(first!==value)for(const form of forms(first))out.add(form);
  if(juliaNames.has(first))for(const alias of juliaNames)out.add(alias);
  if(first.endsWith('чик'))out.add(first+'у');
  if(first.endsWith('ка'))out.add(first.slice(0,-1)+'е');
  if(first.endsWith('ек'))out.add(first.slice(0,-2)+'ку');
  return out;
 }
 function findMatches(target,rows){
  const sought=key(target);
  if(!sought||!Array.isArray(rows))return [];
  const valid=rows.filter(x=>x&&typeof x.name==='string');
  const exact=valid.filter(x=>forms(x.name).has(sought));
  // One exact entry takes precedence. Ambiguous nickname matches require choice.
  if(exact.length)return exact;
  return valid.filter(x=>aliases(x.name).has(sought));
 }
 function parse(raw){
  if(typeof raw!=='string'||raw.length>240||/[\n\r;]/.test(raw))return '';
  const phrase=raw.trim()
   .replace(/^(?:(?:сэйви|сейви|сейва|сейвео|seyveo)[\s,!:.-]+)+/i,'')
   .replace(/^пожалуйста[,\s]+/i,'');
  const match=phrase.match(/^(?:позвони|позвонить|набери|набрать|перезвони|перезвонить)[,\s]+(?:мне\s+)?(?:пожалуйста[,\s]+)?(?:(?:моему|моей)\s+)?(.+?)\s*[.!?]*$/i);
  if(!match)return '';
  const target=match[1].replace(/(?:[,\s]+пожалуйста)\s*$/i,'').trim();
  // Future scheduling is NOT an immediate phone call. Let the reminder flow decide.
  if(!target||target.length>70||/[\d@:/\\]/.test(target)||
   /(?:^|[\s,])(?:завтра|послезавтра|сегодня|через\s+\d+|в\s+(?:понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье))(?=$|[\s,.!?])/i.test(target))return '';
  return target;
 }
 return Object.freeze({parse,findMatches,isJuliaAlias:name=>juliaNames.has(key(name))});
});
