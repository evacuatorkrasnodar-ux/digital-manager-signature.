/* SEYVEO Mail cabinet UI. No remote account, no fabricated messages. */
const mailButtons=document.querySelectorAll('[data-calendar-space="mail"]');
if(mailButtons.length){
 const style=document.createElement('style');
 style.textContent=`.svmail{border:1px solid var(--soft-line,#ffffff24);border-radius:22px;background:var(--bg,#101915);color:var(--text,#fff);padding:18px;width:min(92vw,540px);max-height:83dvh;overflow:auto}.svmail::backdrop{background:#000a}.svmail-head{display:flex;justify-content:space-between;align-items:center}.svmail h2{margin:0;font-size:21px}.svmail button{font:inherit;color:inherit;cursor:pointer}.svmail-close{background:transparent;border:0;padding:10px}.svmail-tabs{display:flex;gap:5px;margin:18px 0 14px;flex-wrap:wrap}.svmail-tabs button{background:transparent;border:0;border-bottom:1px solid transparent;padding:9px 6px;font-size:12px}.svmail-tabs button[aria-selected=true]{border-bottom-color:var(--seyveo-emerald,#58b997)}.svmail-note{font-size:13px;line-height:1.55;color:var(--secondary,#acc1b5)}.svmail-empty{border-top:1px solid var(--soft-line,#ffffff24);padding:20px 0 10px;font-size:14px}.svmail-compose{display:grid;gap:9px;margin-top:15px}.svmail-compose input,.svmail-compose textarea{width:100%;box-sizing:border-box;background:transparent;border:1px solid var(--soft-line,#ffffff24);border-radius:10px;padding:11px;color:inherit;font:inherit}.svmail-compose textarea{min-height:110px;resize:vertical}.svmail-compose button{border:1px solid var(--soft-line,#ffffff24);border-radius:99px;background:transparent;padding:10px}.svmail-compose[hidden]{display:none!important}`;
 document.head.append(style);
 const dlg=document.createElement('dialog');dlg.className='svmail';dlg.setAttribute('aria-label','Почта SEYVEO');
 const head=document.createElement('div');head.className='svmail-head';const title=document.createElement('h2');title.textContent='Почта SEYVEO';const close=document.createElement('button');close.className='svmail-close';close.textContent='Готово';close.type='button';head.append(title,close);
 const tabs=document.createElement('div');tabs.className='svmail-tabs';tabs.setAttribute('role','tablist');
 const view=document.createElement('section');view.className='svmail-empty';const note=document.createElement('p');note.className='svmail-note';note.textContent='Почтовый аккаунт пока не подключён. Здесь появятся настоящие письма после безопасной авторизации.';
 const compose=document.createElement('form');compose.className='svmail-compose';compose.hidden=true;
 const to=document.createElement('input');to.type='email';to.placeholder='Кому';to.required=true;
 const subject=document.createElement('input');subject.placeholder='Тема';subject.required=true;
 const body=document.createElement('textarea');body.placeholder='Текст письма';body.required=true;
 const save=document.createElement('button');save.type='submit';save.textContent='Сохранить черновик';
 compose.append(to,subject,body,save);dlg.append(head,tabs,note,view,compose);document.body.append(dlg);
 const drafts=[];let current='inbox';
 const labels={inbox:'Входящие',sent:'Отправленные',drafts:'Черновики'};
 function render(){
  tabs.replaceChildren();
  for(const [key,label] of Object.entries(labels)){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-selected',String(current===key));b.addEventListener('click',()=>{current=key;render()});tabs.append(b);
  }
  view.replaceChildren();compose.hidden=current!=='drafts';
  const message=document.createElement('p');message.className='svmail-note';
  if(current==='drafts'){
   message.textContent=drafts.length?'Черновики этой сессии · не отправлены':'Черновиков пока нет. Можно подготовить письмо ниже.';
   for(const draft of drafts.slice().reverse()){
    const p=document.createElement('p');p.textContent=draft.subject+' · '+draft.to;view.append(p);
   }
  }else message.textContent=current==='inbox'?'Нет подключённого почтового ящика.':'Отправленные письма появятся после подключения почты.';
  view.prepend(message);
 }
 compose.addEventListener('submit',event=>{event.preventDefault();drafts.push({to:to.value,subject:subject.value,body:body.value});compose.reset();render()});
 close.addEventListener('click',()=>dlg.close());
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-calendar-space="mail"]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();current='inbox';render();dlg.showModal();
 },true);
}
