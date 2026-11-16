/* SEYVEO · Explicit task drafts use the canonical New Task editor.
 * A clear, dated meeting statement may instead be committed by Live Action,
 * which verifies the real saved record before announcing success. */
((root)=>{
 'use strict';
 const KEY='seyveo.sayvi.new-task-handoff.v1';
 const MAX_AGE=60000;
 function extract(value){
  const text=String(value||'').trim().slice(0,650);
  const pattern=/^(?:(?:сэй|сэйви)[,! ]+)?(?:создай|добавь|запиши|оформи|сохрани|поставь)\s+(?:мне\s+)?(?:(?:новое|новую)\s+)?(?:дело|задачу|встречу|напоминание)(?:\s*[:—-]\s*|\s+)(.{8,500})$/iu;
  const match=pattern.exec(text);
  const draft=(match?.[1]||'').trim().replace(/\s+/gu,' ');
  if(draft.length<8||/[<>\r\n]/u.test(draft))return '';
  return draft;
 }
 function extractMeeting(value){
  const text=String(value||'').trim();
  if(text.length<12||text.length>500||/[<>\r\n]/u.test(text))return '';
  // A full statement with a meeting, day and hour is an actionable request.
  // Questions, hypothetical situations and cancellations stay normal chat.
  const candidate=text.replace(/^(?:сэй|сэйви)[,!\s]+/iu,'').trim();
  const safeStatement=!/[?]/u.test(candidate)&&
   !/(?:^|[\s,.])(?:если|возможно|наверное|допустим|предположим|не\s+записывай|не\s+сохраняй)(?=$|[\s,.!?])/iu.test(candidate);
  const startsLikePlan=/^(?:сегодня|завтра|послезавтра|встреча|созвон|совещание)(?=$|[\s,.!?])/iu.test(candidate);
  const hasDate=/(?:^|[\s,.])(?:сегодня|завтра|послезавтра)(?=$|[\s,.!?])/iu.test(candidate);
  const hasTime=/(?:^|[\s,.])в\s+(?:[01]?\d|2[0-3])(?::[0-5]\d)?(?=$|[\s,.!?])/iu.test(candidate);
  const hasMeeting=/(?:^|[\s,.])(?:встреча|созвон|совещание)(?=$|[\s,.!?])/iu.test(candidate);
  return safeStatement&&startsLikePlan&&hasDate&&hasTime&&hasMeeting?candidate.replace(/\s+/gu,' '):'';
 }
 function remember(draft){
  const title=String(draft||'').trim();
  if(!title||title.length>500)return false;
  try{root?.sessionStorage?.setItem(KEY,JSON.stringify({text:title,at:Date.now()}));return true}
  catch{return false}
 }
 function take(){
  try{
   const raw=root?.sessionStorage?.getItem(KEY);
   if(!raw)return '';
   const entry=JSON.parse(raw);
   if(typeof entry?.text!=='string'||entry.text.length<8||entry.text.length>500||
      !Number.isFinite(entry.at)||Date.now()-entry.at>MAX_AGE||entry.at>Date.now()+5000){
    root.sessionStorage.removeItem(KEY);return '';
   }
   return entry.text.trim();
  }catch{return ''}
 }
 function clear(){try{root?.sessionStorage?.removeItem(KEY)}catch{}}
 const api=Object.freeze({extract,extractMeeting,remember,take,clear});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SEYVEO_TASK_HANDOFF=api;
})(typeof window!=='undefined'?window:null);
