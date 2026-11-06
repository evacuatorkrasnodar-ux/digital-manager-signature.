/* Sayvi → SEYVEO LAB: explicit local card draft and user-approved save.
   Only declarative text cards. No generated plugins, hidden actions, or reminders scheduled by this feature. */
(()=>{
'use strict';
const KEY='seyveo-fan-cards-v1', MAX=24;
let pending=null;
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ').slice(0,280);
function handle(raw){
 const text=normalize(raw);if(!text)return null;
 if(pending){
  if(/^(?:да|да[,! ]+сохрани|сохрани|подтверждаю|создавай|добавь|готово|давай|окей|ок)(?:[.! ]*)$/iu.test(text)){
   const item=pending;pending=null;
   let cards;
   try{const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');cards=Array.isArray(parsed)?parsed:[]}
   catch{cards=[]}
   if(cards.length>=MAX)return {message:'В Мастерской уже 24 дополнения. Удали ненужное, затем попробуй снова.'};
   const duplicate=cards.find(x=>x&&x.title===item.title&&x.message===item.message);
   if(duplicate)return {message:'Такая карточка уже сохранена в Мастерской. Она появится на Главной, когда нет более важных дел.'};
   const saved={id:String(Date.now())+'-'+Math.random().toString(36).slice(2),title:item.title,message:item.message,period:'any',onHome:true,mark:'spark',tone:'mint'};
   try{localStorage.setItem(KEY,JSON.stringify([saved,...cards]));}
   catch{return {message:'Не удалось сохранить карточку в памяти браузера. Проверь доступ к хранилищу.'}}
   window.dispatchEvent(new Event('seyveo:fan-card-created'));
   return {message:'Готово! Я сохранила карточку «'+item.title+'» в Мастерской и включила показ на Главной. Когда нет более срочных дел, она появится под сферой. Это карточка-подсказка, не автоматическое напоминание по времени.'};
  }
  if(/^(?:нет|отмена|отмени|не надо|стоп|не сохраняй)(?:[.! ]*)$/iu.test(text)){
   pending=null;return {message:'Хорошо, карточку не сохраняю.'};
  }
  // An unrelated question must not be consumed by a pending confirmation.
 }
 // A direct completion request changes only a saved, exactly matched LAB card.
 // It does NOT complete calendar events, tasks, or perform work for the user.
 const completion=/^(?:(?:сэйви|сейви|сэй)[,!. ]+)?(?:отметь|пометь|считай)\s+карточку\s+(.+?)\s+(?:как\s+)?(?:выполненной|завершённой|завершенной|сделанной)$/iu.exec(text);
 const restore=/^(?:(?:сэйви|сейви|сэй)[,!. ]+)?(?:верни|восстанови|возобнови)\s+карточку\s+(.+)$/iu.exec(text);
 if(completion||restore){
  const wantDone=!!completion;
  const title=normalize((completion||restore)[1]).replace(/[.!]+$/,'').replace(/^[«"]|[»"]$/g,'').toLocaleLowerCase('ru-RU');
  let cards;
  try{const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');cards=Array.isArray(parsed)?parsed:[]}
  catch{return {message:'Не удалось прочитать карточки Мастерской.'}}
  const matches=cards.filter(c=>c&&String(c.title||'').trim().toLocaleLowerCase('ru-RU')===title);
  if(matches.length!==1)return {message:matches.length>1?'В Мастерской несколько карточек с таким названием. Уточни их там.':'Не нашла карточку с таким точным названием в Мастерской.'};
  const item=matches[0];
  if(item.done===wantDone)return {message:wantDone?'Карточка «'+item.title+'» уже отмечена выполненной.':'Карточка «'+item.title+'» уже активна.'};
  item.done=wantDone;item.doneAt=wantDone?new Date().toISOString():'';
  try{localStorage.setItem(KEY,JSON.stringify(cards))}
  catch{return {message:'Не удалось сохранить изменение карточки.'}}
  window.dispatchEvent(new Event('seyveo:fan-card-created'));
  return {message:wantDone?'Отметила карточку «'+item.title+'» выполненной. Она больше не будет появляться на Главной, но останется в Мастерской.':'Вернула карточку «'+item.title+'» в активные. Она снова сможет появляться на Главной.'};
 }
 // A timed reminder belongs to the existing Calendar/Tasks workflow, not LAB.
 // Preserve the normal reminder grammar and its follow-up questions.
 const timed=/^(?:(?:сэйви|сейви|сэй)[,!. ]+)?(?:создай|сделай|добавь|поставь|подготовь)\s+(?:мне\s+)?(?:(?:новую\s+)?карточку[-\s]+)?напоминани[ея](?:\s*[:—–-]\s*|\s+)?(.*)$/iu.exec(text);
 if(timed){
  const reminder='Напомни мне'+(timed[1]?.trim()?' '+timed[1].trim():'');
  const action=window.SEYVEO_LOCAL_ACTIONS?.handle?.(reminder);
  return {message:action?.message||'Напоминание относится к календарю. Уточни, пожалуйста: о чём и когда напомнить?'};
 }
 const m=/^(?:(?:сэйви|сейви|сэй)[,!. ]+)?(?:создай|сделай|добавь|подготовь|хочу создать)\s+(?:мне\s+)?(?:новую\s+)?(?:карточку|дополнение)(?:\s+(?:в мастерской|для главной|на главной))?(?:(?:\s*[:—–-]\s*|\s+(?:с названием|про|чтобы|напоминание|с текстом)\s+)(.+))?$/iu.exec(text);
 if(!m)return null;
 const subject=(m[1]||'').trim().replace(/[.!]+$/,'').trim();
 if(!subject){
  pending=null;
  return {message:'Конечно! Напиши, что должна показывать карточка. Например: «Сэйви, создай карточку: проверить ключи перед выходом».'};
 }
 const title=(subject.length<=47?subject:subject.slice(0,44).replace(/\s+\S*$/,'')+'…').replace(/^[«"]|[»"]$/g,'');
 const message=subject.slice(0,280);
 pending={title,message};
 return {message:'Подготовила карточку для Мастерской.\n\nНазвание: «'+title+'»\nТекст: '+message+'\n\nПоказывать на Главной в любое время, когда нет срочных дел. Сохранить? Ответь «Да, сохрани» или «Отмена».'};
}
window.SEYVEO_CARD_VOICE=Object.freeze({handle});
})();