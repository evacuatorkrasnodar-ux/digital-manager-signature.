import {inspectPastedMail} from './seyveo-mail-local-assist.mjs';
import {mailTaskNextStep} from './seyveo-mail-next-step.mjs';
import {taskTimeline} from './seyveo-task-timeline.mjs';
/* SEYVEO Business Mail — embedded in manager cabinet, disconnected prototype. */
import {MAIL_SPACES,createScopedDraftStore} from './seyveo-mail-spaces.mjs';
const business=document.getElementById('unifiedBusinessTasksView');
const trigger=business?.querySelector('[data-business-hub="mail"]');
if(business&&trigger){
 const board=document.getElementById('unifiedTasksTeamBoard');
 const store=createScopedDraftStore();
 const linkedTasks=new Map();
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
 styles.textContent+='.svb-mail-handoff{display:grid;gap:8px;margin:8px 0 5px;padding:10px 0;border-top:1px solid var(--soft-line)}.svb-mail-handoff input,.svb-mail-handoff textarea{box-sizing:border-box;width:100%;border:1px solid var(--soft-line);border-radius:12px;padding:10px;background:transparent;color:inherit;font:inherit}.svb-mail-handoff textarea{min-height:90px}.svb-mail-handoff button{justify-self:start;color:var(--seyveo-emerald,#a2dcba)}';
 styles.textContent+='.svb-mail-history{gap:5px;margin:6px 0;padding:8px 0;border-top:1px solid var(--soft-line)}.svb-mail-history small{font-size:11px;color:var(--secondary)}';
 styles.textContent+='.svb-mail-history summary{cursor:pointer;color:var(--seyveo-emerald,#a2dcba);font-size:12px;letter-spacing:.02em}.svb-mail-history small{display:block;margin-top:6px}';
 styles.textContent+='.svb-mail-handoff summary{cursor:pointer;color:var(--seyveo-emerald,#9bd5b7)}.svb-mail-handoff textarea{width:100%;box-sizing:border-box;min-height:96px;margin-top:10px;background:transparent;border:1px solid var(--soft-line);border-radius:12px;color:inherit;padding:10px;font:inherit}';
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
 const assist=document.createElement('details');assist.className='svb-mail-handoff';
 const assistTitle=document.createElement('summary');assistTitle.textContent='Сэйви · разобрать текст письма';
 const paste=document.createElement('textarea');paste.placeholder='Вставьте текст рабочего письма для локального разбора';
 const analyze=document.createElement('button');analyze.type='button';analyze.textContent='Разобрать';
 const result=document.createElement('div');result.className='svb-mail-muted';result.setAttribute('aria-live','polite');
 analyze.addEventListener('click',()=>{
  const insight=inspectPastedMail(paste.value);
  result.replaceChildren();
  const line=document.createElement('p');line.textContent=insight.kind==='empty'?insight.summary:'Тема по ключевым словам: '+insight.topic+' · Суть (фрагмент оригинала): '+insight.summary;
  result.append(line);
  if(insight.reply){
   const proposed=document.createElement('p');proposed.textContent='Шаблон ответа для проверки: '+insight.reply;result.append(proposed);
   const draft=document.createElement('button');draft.type='button';draft.textContent='Перенести шаблон в черновик';draft.addEventListener('click',()=>{tab='drafts';editing=-1;render();subject.value='Ответ на обращение';message.value=insight.reply;form.scrollIntoView({block:'nearest'});});result.append(draft);
  }
 });
 const explain=document.createElement('p');explain.className='svb-mail-muted';explain.textContent='Локальная подсказка по правилам. Не ИИ, письмо никуда не отправляется. Не вставляйте конфиденциальные данные в учебный прототип.';
 assist.append(assistTitle,explain,paste,analyze,result);
 page.append(head,note,tabs,assist,list,form);business.append(page);
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
   const delegate=document.createElement('button');delegate.type='button';delegate.textContent='Подготовить поручение';
   delegate.addEventListener('click',()=>{
    const existing=item.querySelector('.svb-mail-handoff');
    if(existing){existing.remove();return;}
    const panel=document.createElement('div');panel.className='svb-mail-handoff';
    const caption=document.createElement('p');caption.className='svb-mail-muted';caption.textContent='Черновик поручения · не отправлено сотруднику';
    const assignee=document.createElement('input');assignee.placeholder='Кому поручить (имя или должность)';assignee.setAttribute('aria-label','Исполнитель поручения');
    const instruction=document.createElement('textarea');instruction.value='Проверить: '+draft.subject+'\n'+draft.body;instruction.setAttribute('aria-label','Текст поручения');
    const copy=document.createElement('button');copy.type='button';copy.textContent='Скопировать поручение';
    copy.addEventListener('click',async()=>{
     if(!assignee.value.trim()||!instruction.value.trim()){caption.textContent='Укажи исполнителя и текст поручения';return;}
     const text='Исполнитель: '+assignee.value.trim()+'\n'+instruction.value.trim();
     try{await navigator.clipboard.writeText(text);caption.textContent='Скопировано. Отправка сотруднику не выполнялась.';}
     catch{caption.textContent='Не удалось скопировать. Текст доступен выше.';}
    });
    const send=document.createElement('button');send.type='button';send.textContent='Добавить в рабочие дела';
    send.addEventListener('click',()=>{
     const people={'елена':'elena','анна':'anna','михаил':'mikhail','всем':'all'};
     const id=people[assignee.value.trim().toLocaleLowerCase('ru-RU')];
     if(!id){caption.textContent='Выбери исполнителя: Елена, Анна, Михаил или Всем';return;}
     const api=window.SEYVEO_BUSINESS_TASK_DEMO;
     if(!api){caption.textContent='Механизм поручений недоступен';return;}
     const result=api.assignFromMail({text:instruction.value.trim(),assigneeId:id,mailDraftId:'local-draft-'+i});
     if(result.ok)linkedTasks.set(i,result.ids||[result.id]);
     caption.textContent=result.ok?'Добавлено в рабочие дела · локальное демо, уведомление не отправлено':result.reason||'Не удалось создать поручение';
    });
    panel.append(caption,assignee,instruction,copy,send);item.append(panel);
   });
   const ids=linkedTasks.get(i)||[];
   if(ids.length){
    let tasks=[];try{tasks=JSON.parse(localStorage.getItem('seyveo-business-command-tasks-demo-v1')||'[]');}catch{}
    const summary=document.createElement('small');
    const names={assigned:'В работе',review:'На проверке',rework:'На доработке',approved:'Принято'};
    summary.textContent=tasks.filter(t=>ids.includes(t.id)).map(t=>t.done?'Принято':names[t.reviewStatus]||'В работе').join(' · ')||'Поручение не найдено';
    item.append(summary);
    const pending=tasks.filter(t=>ids.includes(t.id)&&t.reviewStatus==='review'&&!t.done);
    const active=tasks.filter(t=>ids.includes(t.id)&&!t.done);
    if(active.length){const advice=document.createElement('small');advice.textContent='Сэйви · '+active.map(mailTaskNextStep).join(' ');item.append(advice);}
    if(pending.length){const check=document.createElement('button');check.type='button';check.textContent='Проверить результат';check.addEventListener('click',()=>{if(window.SEYVEO_BUSINESS_TASK_DEMO?.openTask(pending[0].id)){page.hidden=true;if(board)board.hidden=false;}});item.append(check);}
    const history=document.createElement('details');history.className='svb-mail-history';const toggle=document.createElement('summary');toggle.textContent='История исполнения · подробнее';history.append(toggle);
    const milestones={assigned:'Поручение создано',review:'Сотрудник передал результат на проверку',approved:'Руководитель принял результат',rework:'Руководитель вернул на доработку'};
    for(const task of tasks.filter(t=>ids.includes(t.id))){
     const heading=document.createElement('small');heading.textContent='Исполнитель: '+({elena:'Елена',anna:'Анна',mikhail:'Михаил'}[task.assigneeId]||task.assigneeId);history.append(heading);
     for(const step of taskTimeline(task)){
      const line=document.createElement('small');line.textContent=(milestones[step.event]||step.event)+' · '+new Date(step.at).toLocaleString('ru-RU');history.append(line);
      if(step.report){const detail=document.createElement('small');detail.textContent='Отчёт на момент сдачи: '+step.report;history.append(detail);}
     }
     if(task.reportText){const p=document.createElement('small');p.textContent='Отчёт: '+String(task.reportText).slice(0,350);history.append(p);}
     if(task.photoSelected){const p=document.createElement('small');p.textContent='Фото выбрано (локальное демо)';history.append(p);}
     if(task.reviewStatus==='review'){const line=document.createElement('small');line.textContent='Результат передан на проверку';history.append(line);}
    }
    item.append(history);
    const jump=document.createElement('button');jump.type='button';jump.textContent='Открыть поручение';jump.addEventListener('click',()=>{if(window.SEYVEO_BUSINESS_TASK_DEMO?.openTask(ids[0])){page.hidden=true;if(board)board.hidden=false;}});item.append(jump);
   }
   item.prepend(title,recipient);
   item.append(edit,delegate,remove);list.append(item);
  });
 }
 form.addEventListener('submit',event=>{event.preventDefault();const draft={to:to.value.trim(),subject:subject.value.trim(),body:message.value.trim()};if(editing<0)store.add('business',draft);else store.update('business',editing,draft);editing=-1;form.reset();render();});
 window.addEventListener('seyveo:manager-tasks-updated',()=>{if(!page.hidden&&tab==='drafts')render();});
 const exit=()=>{page.hidden=true;if(board)board.hidden=false;};
 back.addEventListener('click',exit);
 window.addEventListener('hashchange',exit);
 document.addEventListener('click',event=>{
  const btn=event.target.closest?.('[data-business-hub="mail"]');if(btn!==trigger)return;
  event.preventDefault();event.stopImmediatePropagation();if(board)board.hidden=true;
  page.hidden=false;tab='inbox';editing=-1;form.reset();render();
 },true);
}
