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