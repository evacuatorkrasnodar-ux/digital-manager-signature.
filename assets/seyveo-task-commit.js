/* SEYVEO · One validated, read-back verified task-store writer.
 * Used by the Tasks batch handler and by Save inside Sayvi's conversation.
 * No second store, remote request, guessed address or background notification. */
((root)=>{
 'use strict';
 const KEY='seyveo-personal-tasks-v1',MAX=150;
 const dateOK=value=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
  const d=new Date(value+'T12:00:00');
  return !Number.isNaN(d.getTime())&&d.getFullYear()===Number(value.slice(0,4))&&
   d.getMonth()+1===Number(value.slice(5,7))&&d.getDate()===Number(value.slice(8,10));
 };
 const timeOK=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value||'');
 function category(title){
  return /(^|[^а-яё])(клиент|заказчик|поставщик|сотрудник|коллега|контрагент|офис|договор|счёт|счет|отчёт|отчет|совещани|проект|работ|начальник|бухгалтер|зарплат|командиров|брифинг|планерк)/iu.test(title)?'work':'personal';
 }
 function type(title){
  if(/(^|[^а-яё])(напомни|напоминан|купить|подготовить|отправить|оплатить|сделать|проверить|забрать|заказать|позвонить|написать|выслать|убрать|помыть|сдать|завершить|задач)/iu.test(title))return 'task';
  return /(^|[^а-яё])(встреч|встрет|поездк|созвон|совещан|конференц|тренировк|заняти|урок|приём|прием|праздник|день рождени|обед|ужин|концерт|путешеств|мероприят)/iu.test(title)?'event':'task';
 }
 function read(storage){
  try{
   const value=JSON.parse(storage.getItem(KEY)||'[]');
   return Array.isArray(value)?value:[];
  }catch{return []}
 }
 function saveBatch(items,options={}){
  const storage=options.storage||root?.localStorage;
  if(!storage||!Array.isArray(items)||items.length<1||items.length>5)
   return {status:'invalid',message:'Не удалось прочитать дела.'};
  const all=read(storage);
  const seen=new Set(all.filter(x=>typeof x?.title==='string').map(x=>
   x.title.trim().replace(/\s+/gu,' ').toLocaleLowerCase('ru-RU')+'|'+(x.due||'')+'|'+(x.time||'')));
  const pending=[];
  let duplicates=0;
  for(const draft of items){
   if(!draft||typeof draft.title!=='string'||typeof draft.due!=='string'||
      (draft.time!==undefined&&typeof draft.time!=='string'))
    return {status:'invalid',message:'Проверь название, дату и время.'};
   const title=draft.title.trim().replace(/\s+/gu,' ').slice(0,140);
   const due=draft.due,time=draft.time||'';
   if(!title||(due&&!dateOK(due))||(time&&(!due||!timeOK(time))))
    return {status:'invalid',message:'Проверь название, дату и время.'};
   const key=title.toLocaleLowerCase('ru-RU')+'|'+due+'|'+time;
   if(seen.has(key)){duplicates++;continue}
   seen.add(key);pending.push({title,due,time});
  }
  if(!pending.length)return {status:'already',added:0,duplicates,
   message:'Это дело уже есть в «Моих делах». Повторно не записываю.'};
  if(all.length+pending.length>MAX)return {status:'full',message:'Список дел заполнен.'};
  const stamp=Date.now(),createdAt=new Date(stamp).toISOString();
  const createdBy=options.createdBy==='sayvi'?'sayvi':'user';
  const noteId=typeof options.sourceNoteId==='string'&&options.sourceNoteId.length<=128?options.sourceNoteId:'';
  const classifier=options.classify||root?.SEYVEO_TASK_CLASSIFY;
  const additions=pending.map((item,index)=>({
   id:'personal-'+stamp+'-'+index+'-'+Math.random().toString(36).slice(2,9),
   title:item.title,due:item.due,time:item.time,
   category:classifier?.category?.(item.title)||category(item.title),
   entryType:classifier?.type?.(item.title)||type(item.title),
   done:false,createdAt,doneAt:'',createdBy,
   ...(noteId?{sourceNoteId:noteId}:{})
  }));
  try{storage.setItem(KEY,JSON.stringify([...all,...additions]));}
  catch{return {status:'error',message:'Не удалось сохранить. Проверь память устройства.'}}
  const stored=read(storage);
  if(!additions.every(item=>stored.some(row=>row.id===item.id&&row.title===item.title&&
      row.due===item.due&&(row.time||'')===item.time&&row.createdBy===createdBy)))
   return {status:'error',message:'Не удалось подтвердить сохранение.'};
  return {status:'saved',added:additions.length,duplicates,records:additions,
   message:'Добавлено в «Мои дела»: '+additions.length+'.'};
 }
 function find(draft,storage=root?.localStorage){
  if(!draft||!storage||typeof draft.title!=='string')return null;
  const title=draft.title.trim().replace(/\s+/gu,' ').slice(0,140);
  return read(storage).slice().reverse().find(x=>x?.done!==true&&x?.title===title&&
   x?.due===draft.date&&(x.time||'')===(draft.time||''))||null;
 }
 const api=Object.freeze({saveBatch,find});
 if(root)root.SEYVEO_TASK_COMMIT=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
