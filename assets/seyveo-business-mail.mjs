/* SEYVEO Business Mail — embedded in manager cabinet, disconnected prototype. */
import {MAIL_SPACES,createScopedDraftStore} from './seyveo-mail-spaces.mjs';
const business=document.getElementById('unifiedBusinessTasksView');
const trigger=business?.querySelector('[data-business-hub="mail"]');
if(business&&trigger){
 const board=document.getElementById('unifiedTasksTeamBoard');
 const store=createScopedDraftStore();
 let tab='inbox',editing=-1;
 const styles=document.createElement('style');
 styles.textContent=`
.svb-mail[hidden]{display:none!important}.svb-mail{padding:10px 2px 50px;color:var(--text)}
.svb-mail-head{display:flex;justify-content:space-between;gap:12px;align-items:center}
.svb-mail-tag{font-size:10px;letter-spacing:.12em;color:var(--seyveo-emerald,#92dcb2)}
.svb-mail h2{font-size:24px;margin:6px 0 13px}.svb-mail button{font:inherit;cursor:pointer;color:inherit;background:transparent;border:0}
.svb-mail-back{padding:10px 0;font-size:13px}.svb-mail-tabs{display:flex;border-bottom:1px solid var(--soft-line);gap:14px;margin-top:15px}
.svb-mail-tabs button{padding:11px 2px;font-size:12px;color:var(--secondary)}
.svb-mail-tabs button[aria-pressed=true]{border-bottom:2px solid var(--seyveo-emerald,#93dbb6);color:var(--text)}
.svb-mail-muted{font-size:12px;line-height:1.5;color:var(--secondary)}.svb-mail-item{padding:12px 0;border-bottom:1px solid var(--soft-line);display:grid;gap:5px}
.svb-mail-item strong{font-size:13px}.svb-mail-item small{font-size:11px;color:var(--secondary)}
.svb-mail-item button{font-size:12px;color:var(--seyveo-emerald,#93dbb6);padding:7px 5px 7px 0}
.svb-mail-form{display:grid;gap:9px;margin-top:16px}.svb-mail-form[hidden]{display:none!important}
.svb-mail-form input,.svb-mail-form textarea{width:100%;box-sizing:border-box;background:transparent;color:var(--text);border:1px solid var(--soft-line);border-radius:12px;padding:11px;font:inherit}
.svb-mail-form textarea{min-height:112px}.svb-mail-form button{border:1px solid var(--soft-line);border-radius:99px;padding:11px}
`;
 document.head.append(styles);
 const page=document.createElement('section');page.className='svb-mail';page.hidden=true;
 const head=document.createElement('div');head.className='svb-mail-head';
 const name=document.createElement('div');const tag=document.createElement('div');tag.className='svb-mail-tag';tag.textContent=MAIL_SPACES.business.technology;
 const h=document.createElement('h2');h.textContent=MAIL_SPACES.business.label;name.append(tag,h);
 const back=document.createElement('button');back.className='svb-mail-back';back.textContent='‹ Кабинет';head.append(name,back);
 const tabs=document.createElement('div');tabs.className='svb-mail-tabs';const list=document.createElement('div');
 const note=document.createElement('p');note.className='svb-mail-muted';note.textContent='Рабочий ящик не подключён. Письма компании и личная почта разделены.';
 const form=document.createElement('form');form.className='svb-mail-form';form.hidden=true;
 const to=document.createElement('input');to.type='email';to.required=true;to.placeholder='Получатель';
 const subject=document.createElement('input');subject.required=true;subject.placeholder='Тема';
 const message=document.createElement('textarea');message.required=true;message.placeholder='Текст письма';
 const save=document.createElement('button');save.type='submit';save.textContent='Сохранить рабочий черновик';form.append(to,subject,message,save);
 page.append(head,note,tabs,list,form);business.append(page);
 function render(){
  tabs.replaceChildren();list.replaceChildren();form.hidden=tab!=='drafts';
  for(const [id,label] of [['inbox','Входящие'],['sent','Отправленные'],['drafts','Черновики']]){
   const b=document.createElement('button');b.textContent=label;b.type='button';b.setAttribute('aria-pressed',String(tab===id));b.addEventListener('click',()=>{tab=id;render()});tabs.append(b);
  }
  if(tab!=='drafts'){const empty=document.createElement('p');empty.className='svb-mail-muted';empty.textContent=tab==='inbox'?'Входящие появятся после подключения рабочего ящика.':'Отправленных писем пока нет.';list.append(empty);return;}
  const drafts=store.list('business');
  if(!drafts.length){const empty=document.createElement('p');empty.className='svb-mail-muted';empty.textContent='Рабочих черновиков пока нет.';list.append(empty);}
  drafts.forEach((draft,i)=>{
   const item=document.createElement('div');item.className='svb-mail-item';
   const title=document.createElement('strong');title.textContent=draft.subject;const recipient=document.createElement('small');recipient.textContent='Кому: '+draft.to;
   const edit=document.createElement('button');edit.type='button';edit.textContent='Продолжить';edit.addEventListener('click',()=>{editing=i;to.value=draft.to;subject.value=draft.subject;message.value=draft.body;});
   const remove=document.createElement('button');remove.type='button';remove.textContent='Удалить';remove.addEventListener('click',()=>{store.remove('business',i);editing=-1;form.reset();render();});
   item.append(title,recipient,edit,remove);list.append(item);
  });
 }
 form.addEventListener('submit',event=>{event.preventDefault();const draft={to:to.value.trim(),subject:subject.value.trim(),body:message.value.trim()};if(editing<0)store.add('business',draft);else store.update('business',editing,draft);editing=-1;form.reset();render();});
 const exit=()=>{page.hidden=true;if(board)board.hidden=false;};
 back.addEventListener('click',exit);
 window.addEventListener('hashchange',exit);
 document.addEventListener('click',event=>{
  const btn=event.target.closest?.('[data-business-hub="mail"]');if(btn!==trigger)return;
  event.preventDefault();event.stopImmediatePropagation();if(board)board.hidden=true;
  page.hidden=false;tab='inbox';editing=-1;form.reset();render();
 },true);
}
