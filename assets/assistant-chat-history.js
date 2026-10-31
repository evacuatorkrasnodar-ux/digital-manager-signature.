/* SEYVEO · assistant request history. Local, read-only, not a second chat input.
   Logs only requests explicitly sent in Ask mode; never notebook drafts. */
(function(){
'use strict';
const dialog=document.getElementById('assistantChatHistoryDialog');
if(!dialog)return;
const KEY='seyveo-assistant-chat-history-v1',LIMIT=60;
const $=id=>document.getElementById(id);
function safeSearch(value){
 if(value?.status!=='results'||!Array.isArray(value.results))return null;
 const results=value.results.slice(0,6).flatMap(item=>{
  if(!item||typeof item!=='object')return [];
  let url;try{const u=new URL(item.url);if(u.protocol!=='https:'||u.username||u.password)return [];url=u.href}catch{return []}
  const title=String(item.title||'').slice(0,180);
  if(!title)return [];
  let imageUrl=null;
  if(item.imageApproved===true&&item.imageCredit){
   try{const u=new URL(item.imageUrl);if(u.protocol==='https:'&&!u.username&&!u.password)imageUrl=u.href}catch{}
  }
  return [{title,url,snippet:String(item.snippet||'').slice(0,600),
   publishedAt:String(item.publishedAt||'').slice(0,10),
   imageUrl,imageApproved:!!imageUrl,imageCredit:imageUrl?String(item.imageCredit).slice(0,110):''}];
 });
 return results.length?{status:'results',results}:null;
}
function load(){
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!Array.isArray(raw))return[];
  return raw.filter(row=>row&&typeof row.q==='string'&&typeof row.a==='string'&&Number.isFinite(row.at))
   .slice(-LIMIT).map(row=>({q:row.q.slice(0,3500),a:row.a.slice(0,20000),at:row.at,search:safeSearch(row.search),kind:row.kind==='draft'?'draft':'reply'}));
 }catch{return[]}
}
function save(items){
 try{localStorage.setItem(KEY,JSON.stringify(items.slice(-LIMIT)));return true}
 catch{return false}
}
// One existing local journal also restores the continuous Sayvi conversation.
// Read only actual saved turns; never mix in the separate Notebook drafts.
function recent(limit=30){
 const count=Math.min(LIMIT,Math.max(1,Number(limit)||30));
 return load().slice(-count).map(row=>({question:row.q,answer:row.a,search:row.search}));
}
function add({question,answer,kind,search}){
 const q=String(question||'').trim(),a=String(answer||'').trim();
 if(!q)return false;
 const at=Date.now(),row={q:q.slice(0,3500),a:a.slice(0,20000),at,search:safeSearch(search),kind:kind==='draft'?'draft':'reply'};
 const result=save([...load(),row]);
 if(dialog.open)render();
 return result;
}
function el(tag,cls,content){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=content;
 return node;
}
function render(){
 const parent=$('assistantChatHistoryList');
 parent.replaceChildren();
 const entries=load().slice().reverse();
 $('assistantChatHistoryCount').textContent=entries.length?entries.length+' сохранённых обращений':'История пока пуста';
 $('assistantChatHistoryClear').hidden=!entries.length;
 if(!entries.length){
  parent.append(el('p','assistant-chat-empty','Здесь появятся вопросы, которые вы отправите управляющему, и его ответы. Заметки из Блокнота сюда не попадают.'));
  return;
 }
 for(const row of entries){
  const item=el('details','assistant-chat-item');
  const heading=el('summary','assistant-chat-summary');
  const title=el('span','assistant-chat-question',row.q);
  const time=el('small','assistant-chat-time',new Date(row.at).toLocaleString('ru-RU'));
  heading.append(title,time);item.append(heading);
  const panel=el('div','assistant-chat-detail');
  const asked=el('div','assistant-chat-full-question',row.q);
  const label=el('small','assistant-chat-answer-label',row.kind==='draft'?'Подготовлено · локальный прототип':'Ответ · локальный прототип');
  const answer=el('div','assistant-chat-answer',row.a||'Ответ не сохранён.');
  panel.append(asked,label,answer);item.append(panel);parent.append(item);
 }
}
function open(){
 render();
 if(!dialog.open)dialog.showModal();
}
$('assistantChatHistoryBack').addEventListener('click',()=>dialog.close());
$('assistantChatHistoryDone').addEventListener('click',()=>dialog.close());
$('assistantChatHistoryClear').addEventListener('click',()=>{
 if(!window.confirm('Удалить историю вопросов помощнику на этом устройстве? Заметки в Блокноте останутся.'))return;
 if(!save([])){$('assistantChatHistoryCount').textContent='Не удалось удалить историю.';return}
 window.dispatchEvent(new Event('seyveo:chat-history-cleared'));
 render();
});
window.addEventListener('storage',e=>{if(e.key===KEY&&dialog.open)render()});
window.SEYVEO_CHAT_HISTORY=Object.freeze({open,add,render,recent});
})();