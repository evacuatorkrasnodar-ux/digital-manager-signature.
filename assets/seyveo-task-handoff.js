/* SEYVEO · Hand a spoken task draft to the one canonical New Task editor.
 * No task is silently saved; addresses must still be checked and confirmed. */
((root)=>{
 'use strict';
 const KEY='seyveo.sayvi.new-task-handoff.v1';
 const MAX_AGE=60000;
 function extract(value){
  const text=String(value||'').trim().slice(0,650);
  const pattern=/^(?:(?:сэй|сэйви)[,! ]+)?(?:создай|добавь|запиши|оформи|сохрани|поставь)\s+(?:мне\s+)?(?:(?:новое|новую)\s+)?(?:дело|задачу|встречу|напоминание)(?:\s*[:—-]\s*|\s+)(.{8,500})$/iu;
  const match=pattern.exec(text);
  if(!match)return '';
  const draft=match[1].trim().replace(/\s+/gu,' ');
  if(draft.length<8||/[<>\r\n]/u.test(draft))return '';
  return draft;
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
 const api=Object.freeze({extract,remember,take,clear});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SEYVEO_TASK_HANDOFF=api;
})(typeof window!=='undefined'?window:null);
