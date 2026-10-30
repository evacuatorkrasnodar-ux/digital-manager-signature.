/* SEYVEO Action History — development-only access via ?seyveoStudio.
   Reads live in-memory Card Engine data. Never claims external delivery. */
const enabled=new URLSearchParams(location.search).has('seyveoStudio');
if(enabled){
 const style=document.createElement('style');
 style.textContent='.sah-launch{position:fixed;right:12px;bottom:88px;z-index:1100;border:1px solid var(--line,#547364);border-radius:99px;background:var(--card,#1d2822);color:var(--text,#fff);padding:9px 13px;font:13px system-ui}.sah-dialog{color:var(--text,#fff);background:var(--bg,#101916);border:1px solid var(--line,#456);border-radius:20px;width:min(92vw,530px);max-height:82dvh;overflow:auto;padding:18px}.sah-dialog::backdrop{background:#0009}.sah-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.sah-dialog button{background:transparent;color:inherit;border:1px solid var(--line,#456);border-radius:99px;padding:8px 12px;min-height:40px}.sah-row{border-top:1px solid var(--line,#456);padding:12px 0;font:13px/1.5 system-ui}.sah-row small{display:block;opacity:.7}.sah-dialog h2{font:600 20px system-ui;margin:0}.sah-note{font:12px/1.4 system-ui;opacity:.7}';
 document.head.append(style);
 const launch=document.createElement('button');launch.className='sah-launch';launch.type='button';launch.textContent='История Сэйви';
 const dialog=document.createElement('dialog');dialog.className='sah-dialog';dialog.setAttribute('aria-label','История действий Сэйви');
 const header=document.createElement('div');header.className='sah-head';const h=document.createElement('h2');h.textContent='История действий';const close=document.createElement('button');close.textContent='Закрыть';close.type='button';header.append(h,close);
 const note=document.createElement('p');note.className='sah-note';note.textContent='Режим разработчика · события только этой открытой страницы · ДЕМО не означает реальную отправку.';
 const list=document.createElement('div');dialog.append(header,note,list);document.body.append(launch,dialog);
 function render(){list.replaceChildren();const api=window.SEYVEO_CARD_LIFECYCLE;const rows=api?.history?.()||[];if(!rows.length){const p=document.createElement('p');p.textContent='Пока нет зарегистрированных действий. Открой учебную карточку и заверши пример.';list.append(p);return;}
  for(const row of rows.slice(0,100)){const item=document.createElement('div');item.className='sah-row';const title=document.createElement('strong');title.textContent=row.title||row.cardType;const detail=document.createElement('small');detail.textContent=row.from+' → '+row.to+' · '+new Date(row.at).toLocaleString('ru-RU');item.append(title,detail);if(row.reason){const info=document.createElement('small');info.textContent=row.reason;item.append(info);}list.append(item);}}
 launch.addEventListener('click',()=>{render();dialog.showModal()});close.addEventListener('click',()=>dialog.close());window.addEventListener('seyveo:cards-changed',()=>{if(dialog.open)render()});
}
