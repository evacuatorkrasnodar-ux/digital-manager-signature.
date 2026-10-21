/* SEYVEO Context Focus · deterministic priority by real local deadlines.
 * Reads supplied items only; no writes, no navigation, no network or fake AI. */
(()=>{
'use strict';
function key(date){
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
function valid(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [year,month,day]=value.split('-').map(Number);
 const parsed=new Date(year,month-1,day);
 return parsed.getFullYear()===year&&parsed.getMonth()+1===month&&parsed.getDate()===day;
}
function selectTask(items,now=new Date()){
 if(!Array.isArray(items)||!now||typeof now.getTime!=='function'||!Number.isFinite(now.getTime()))return null;
 const today=key(now),tomorrow=key(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1));
 const limit=key(new Date(now.getFullYear(),now.getMonth(),now.getDate()+3));
 const upcoming=items.filter(item=>item&&item.done!==true&&typeof item.id==='string'&&
  typeof item.title==='string'&&item.title.trim()&&valid(item.due)&&item.due<=limit);
 upcoming.sort((a,b)=>a.due.localeCompare(b.due)||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||
  a.id.localeCompare(b.id));
 const first=upcoming[0];
 if(!first)return null;
 const when=first.due<today?'Срок прошёл':first.due===today?'Срок сегодня':
  first.due===tomorrow?'Срок завтра':'Срок в ближайшие дни';
 return {id:first.id,title:first.title.trim(),when};
}
window.SEYVEO_CONTEXT_FOCUS=Object.freeze({selectTask});
})();
