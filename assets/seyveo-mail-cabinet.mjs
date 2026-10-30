import {prepareMailInsight} from './seyveo-mail-intelligence.mjs';
/* SEYVEO Mail cabinet UI. No remote account, no fabricated messages. */
const mailButtons=document.querySelectorAll('[data-calendar-space="mail"]');
if(mailButtons.length){
 const premium=document.createElement('link');premium.rel='stylesheet';premium.href='assets/seyveo-mail-premium.css?v=2';document.head.append(premium);
 const style=document.createElement('style');
 style.textContent=`.svmail{border:1px solid var(--soft-line,#ffffff24);border-radius:22px;background:var(--bg,#101915);color:var(--text,#fff);padding:18px;width:min(92vw,540px);max-height:83dvh;overflow:auto}.svmail::backdrop{background:#000a}.svmail-head{display:flex;justify-content:space-between;align-items:center}.svmail h2{margin:0;font-size:21px}.svmail button{font:inherit;color:inherit;cursor:pointer}.svmail-close{background:transparent;border:0;padding:10px}.svmail-tabs{display:flex;gap:5px;margin:18px 0 14px;flex-wrap:wrap}.svmail-tabs button{background:transparent;border:0;border-bottom:1px solid transparent;padding:9px 6px;font-size:12px}.svmail-tabs button[aria-selected=true]{border-bottom-color:var(--seyveo-emerald,#58b997)}.svmail-note{font-size:13px;line-height:1.55;color:var(--secondary,#acc1b5)}.svmail-empty{border-top:1px solid var(--soft-line,#ffffff24);padding:20px 0 10px;font-size:14px}.svmail-compose{display:grid;gap:9px;margin-top:15px}.svmail-compose input,.svmail-compose textarea{width:100%;box-sizing:border-box;background:transparent;border:1px solid var(--soft-line,#ffffff24);border-radius:10px;padding:11px;color:inherit;font:inherit}.svmail-compose textarea{min-height:110px;resize:vertical}.svmail-compose button{border:1px solid var(--soft-line,#ffffff24);border-radius:99px;background:transparent;padding:10px}.svmail-compose[hidden]{display:none!important}`;
 document.head.append(style);
 const life=document.getElementById('lifePage');
 if(!life)throw new Error('My World page missing');
 const dlg=document.createElement('section');dlg.className='svmail';dlg.hidden=true;dlg.setAttribute('aria-label','Почта SEYVEO');
 const shell=document.createElement('div');shell.className='svmail-shell';
 const head=document.createElement('div');head.className='svmail-head';const heading=document.createElement('div');const kicker=document.createElement('p');kicker.className='svmail-kicker';kicker.textContent='SEYVEO · INTELLIGENT MAIL';const title=document.createElement('h2');title.textContent='Почта';heading.append(kicker,title);const close=document.createElement('button');close.className='svmail-close';close.textContent='‹ Мой мир';close.type='button';const controls=document.createElement('div');controls.className='svmail-head-actions';const newDraft=document.createElement('button');newDraft.type='button';newDraft.className='svmail-new';newDraft.textContent='Написать';controls.append(newDraft,close);head.append(heading,controls);
 const hero=document.createElement('div');hero.className='svmail-hero';const orbit=document.createElement('div');orbit.className='svmail-orbit';const star=document.createElement('span');star.className='svmail-star';star.textContent='✦';const promise=document.createElement('span');promise.textContent='Сэйви поможет разобраться с важными письмами';orbit.append(star,promise);hero.append(orbit);
 const tabs=document.createElement('div');tabs.className='svmail-tabs';tabs.setAttribute('role','tablist');
 const search=document.createElement('input');search.className='svmail-search';search.type='search';search.placeholder='Поиск по письмам';search.setAttribute('aria-label','Поиск по письмам');
 const view=document.createElement('section');view.className='svmail-empty';const note=document.createElement('p');note.className='svmail-note';note.textContent='Почтовый аккаунт пока не подключён. Здесь появятся настоящие письма после безопасной авторизации.';
 const compose=document.createElement('form');compose.className='svmail-compose';compose.hidden=true;
 const to=document.createElement('input');to.type='email';to.placeholder='Кому';to.required=true;
 const subject=document.createElement('input');subject.placeholder='Тема';subject.required=true;
 const body=document.createElement('textarea');body.placeholder='Текст письма';body.required=true;
 const save=document.createElement('button');save.type='submit';save.textContent='Сохранить черновик';
 compose.append(to,subject,body,save);shell.append(head,hero,search,tabs,note,view,compose);dlg.append(shell);life.append(dlg);
 const drafts=[];let current='inbox';
 // Future authenticated provider can render verified insights via this adapter.
 window.SEYVEO_MAIL_PREVIEW=Object.freeze({prepare:prepareMailInsight});
let editing=-1;
 const labels={inbox:'Входящие',sent:'Отправленные',drafts:'Черновики'};
 newDraft.addEventListener('click',()=>{current='drafts';editing=-1;compose.reset();save.textContent='Сохранить черновик';search.value='';render();to.focus({preventScroll:true});compose.scrollIntoView({block:'nearest',behavior:'smooth'});});
 function render(){
  tabs.replaceChildren();
  for(const [key,label] of Object.entries(labels)){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-selected',String(current===key));b.addEventListener('click',()=>{current=key;render()});tabs.append(b);
  }
  view.replaceChildren();compose.hidden=current!=='drafts';
  note.hidden=current!=='inbox';
  const message=document.createElement('p');message.className='svmail-note';
  if(current==='drafts'){
   message.textContent=drafts.length?'Черновики сохранены только до закрытия страницы · не отправлены':'Напиши письмо — Сэйви поможет подготовить ответ после подключения ИИ.';
   for(const [index,draft] of drafts.map((draft,index)=>[index,draft]).reverse().filter(([,d])=>[d.to,d.subject,d.body].some(x=>x.toLocaleLowerCase('ru-RU').includes(search.value.toLocaleLowerCase('ru-RU'))))){
    const p=document.createElement('div');p.className='svmail-draft';const name=document.createElement('strong');name.textContent=draft.subject;const addr=document.createElement('small');addr.textContent='Кому: '+draft.to;const actions=document.createElement('div');actions.className='svmail-draft-actions';const edit=document.createElement('button');edit.type='button';edit.textContent='Продолжить';edit.addEventListener('click',()=>{editing=index;to.value=draft.to;subject.value=draft.subject;body.value=draft.body;save.textContent='Обновить черновик';compose.scrollIntoView({block:'nearest',behavior:'smooth'});});const remove=document.createElement('button');remove.type='button';remove.textContent='Удалить';remove.addEventListener('click',()=>{drafts.splice(index,1);if(editing===index){editing=-1;compose.reset();save.textContent='Сохранить черновик';}else if(editing>index)editing--;render();});actions.append(edit,remove);p.append(name,addr,actions);view.append(p);
   }
  }else message.textContent=current==='inbox'?'Нет подключённого почтового ящика.':'Отправленные письма появятся после подключения почты.';
  view.prepend(message);search.disabled=current!=='drafts';search.placeholder=current==='drafts'?'Найти черновик':'Поиск заработает после подключения почты';
 }
 compose.addEventListener('submit',event=>{event.preventDefault();const next={to:to.value.trim(),subject:subject.value.trim(),body:body.value.trim()};if(editing>=0)drafts[editing]=next;else drafts.push(next);editing=-1;save.textContent='Сохранить черновик';compose.reset();render()});
 search.addEventListener('input',render);
 const exitMail=()=>{dlg.hidden=true;life.classList.remove('svmail-active');};
 close.addEventListener('click',exitMail);
 window.addEventListener('hashchange',exitMail);
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-calendar-space="mail"]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();current='inbox';search.value='';editing=-1;compose.reset();save.textContent='Сохранить черновик';render();dlg.hidden=false;life.classList.add('svmail-active');
 },true);
}
