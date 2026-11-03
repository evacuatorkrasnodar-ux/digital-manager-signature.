/* SEYVEO Business · real locally saved operations. Initialized independently from chart dialogs. */
(()=>{
'use strict';
if(window.SEYVEO_PULSE_LEDGER)return;
/* Owner-entered operations: local-only ledger, no invented bank or CRM data. */
const LEDGER_KEY='seyveo-business-pulse-operations-v1';
function ledgerRead(){
 try{
  const rows=JSON.parse(localStorage.getItem(LEDGER_KEY)||'[]');
  if(!Array.isArray(rows))return [];
  return rows.filter(r=>r&&typeof r.id==='string'&&['sale','expense','order','lead'].includes(r.kind)&&
   Number.isSafeInteger(r.amount)&&r.amount>=0&&r.amount<=100000000&&
   /^\d{4}-\d{2}-\d{2}$/.test(r.day)&&typeof r.label==='string').slice(-500);
 }catch{return []}
}
function ledgerWrite(items){
 try{localStorage.setItem(LEDGER_KEY,JSON.stringify(items.slice(-500)));return true}catch{return false}
}

window.SEYVEO_PULSE_LEDGER=Object.freeze({
 list:()=>ledgerRead().slice().reverse(),
 add(input){
  const kind=String(input?.kind||''),label=String(input?.label||'').trim().slice(0,70);
  const amount=Number(input?.amount||0),day=String(input?.day||'');
  if(!['sale','expense','order','lead'].includes(kind)||!label||
   !Number.isSafeInteger(amount)||amount<0||amount>100000000||
   !/^\d{4}-\d{2}-\d{2}$/.test(day)||Number.isNaN(new Date(day+'T12:00:00').getTime()))
   return {ok:false,error:'Проверьте тип, сумму, дату и описание.'};
  const result=ledgerRead();
  if(result.length>=500)return {ok:false,error:'Журнал заполнен (500 записей). Удалите старые записи.'};
  result.push({id:'op-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),kind,label,amount,day,createdAt:new Date().toISOString()});
  if(!ledgerWrite(result))return {ok:false,error:'Не удалось сохранить на устройстве.'};
  window.dispatchEvent(new Event('seyveo:pulse-ledger-changed'));
  return {ok:true};
 },
 remove(id){
  const rows=ledgerRead();if(!rows.some(x=>x.id===id))return false;
  if(!ledgerWrite(rows.filter(x=>x.id!==id)))return false;
  window.dispatchEvent(new Event('seyveo:pulse-ledger-changed'));return true;
 }
});
})();
