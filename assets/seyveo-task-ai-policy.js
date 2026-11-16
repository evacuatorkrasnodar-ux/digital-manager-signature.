/* SEYVEO · a local LLM may improve uncertain drafts, never erase details
 * already understood from the user's words. */
((root)=>{
 'use strict';
 const plain=value=>String(value||'').toLocaleLowerCase('ru-RU')
  .replace(/[«»“”"'.,:;!?()—–-]/gu,' ').replace(/\s+/gu,' ').trim();
 function accept(phrase,items,deterministic,extractPlace){
  if(!Array.isArray(items)||!items.length)return false;
  // When all date/time details are confidently identified, keep the readable
  // local result: the model tends to repeat "в 18:00" and drop cafe names.
  if(deterministic?.items?.length===items.length&&deterministic.items.every(x=>x.date&&x.time&&x.title))return false;
  const original=typeof extractPlace==='function'?extractPlace(phrase):null;
  if(original){
   const match=items.some(item=>{
    const location=extractPlace(item.title);
    if(!location)return false;
    const name=plain(original.venueName||original.query);
    const kept=plain(location.venueName||location.query);
    return name===kept&&(!original.city||plain(original.city)===plain(location.city));
   });
   if(!match)return false;
  }
  // Preserve the person named after "встретиться с ...", even if the model
  // produces a grammatically plausible but wrong replacement.
  const companion=String(phrase).match(/(?:встретиться|встреча|увидеться|поговорить)\s+(?:с|со)\s+([а-яё]{3,30})(?=$|[\s,.!?])/iu);
  if(companion&&!items.some(item=>new RegExp('(?:^|[^а-яё])'+companion[1]+'(?=$|[^а-яё])','iu').test(item.title)))return false;
  // Names are user data, not spelling suggestions. In particular,
  // «позвонить Мише» must never turn into «позвонить Михаю».
  const contactCalls=[...String(phrase).matchAll(/(?:позвонить|набрать|написать|отправить\s+сообщение|созвониться\s+с)\s+([а-яё]{3,30})(?=$|[\s,.!?;])/giu)];
  for(const contact of contactCalls){
   const written=contact[1].toLocaleLowerCase('ru-RU');
   const preserved=items.some(item=>plain(item.title).split(' ').includes(written));
   if(!preserved)return false;
  }
  return true;
 }
 const api=Object.freeze({accept});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SEYVEO_TASK_AI_POLICY=api;
})(typeof window!=='undefined'?window:null);
