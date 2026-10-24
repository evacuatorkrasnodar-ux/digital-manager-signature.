/* SEYVEO · Personal Tasks v1.
   Real local tasks, not AI or externally executed assignments. No imports from legacy code. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const list=$('personalTaskList'),summary=$('personalBriefList'),dialog=$('personalTaskDialog');
const form=$('personalTaskForm'),input=$('personalTaskTitle'),date=$('personalTaskDue');
const contactsDialog=$('seyveoContactsDialog'),callDialog=$('seyveoCallDialog');
if(!list||!summary||!dialog||!form||!input||!date||!contactsDialog||!callDialog)return;
const notice=$('personalTasksNotice');
const focusPanel=$('tasksContextFocus'),focusWhen=$('tasksContextWhen'),focusTitle=$('tasksContextTitle'),focusOpen=$('tasksContextOpen'),focusArt=$('tasksContextArtwork'),focusHint=$('tasksContextHint'),focusComplete=$('tasksContextComplete');
function renderContext(open){
 if(!focusPanel||!focusWhen||!focusTitle||!focusOpen||!focusArt||!focusComplete||!focusHint)return '';
 const priority=window.SEYVEO_CONTEXT_FOCUS?.selectTask(open)||null;
 focusPanel.hidden=!priority;
 if(!priority){focusOpen.dataset.focusTask='';focusOpen.dataset.focusCall='';focusComplete.hidden=true;return '';}
 const contact=callTargetFromTask(priority.title);
 focusWhen.textContent=priority.when;
 focusTitle.textContent=priority.title;
 focusOpen.dataset.focusTask=priority.id;
 focusOpen.dataset.focusCall=contact;
 focusArt.replaceChildren(taskIcon(contact?'phone':'note'));
 focusHint.textContent=contact?'Коснитесь, чтобы подготовить звонок':'Коснитесь, чтобы найти дело';
 focusComplete.hidden=!contact;
 focusComplete.dataset.focusTask=priority.id;
 focusOpen.setAttribute('aria-label',contact?'Подготовить звонок: '+contact:'Перейти к делу: '+priority.title);
 focusOpen.title=contact?'Подготовить звонок':'Показать дело в списке';
 focusPanel.dataset.focusKind=contact?'call':'task';
 return priority.id;
}
focusComplete?.addEventListener('click',()=>{
 const id=focusComplete.dataset.focusTask;
 if(id&&read().some(item=>item.id===id&&!item.done))change(id);
});
focusOpen?.addEventListener('click',()=>{
 const id=focusOpen.dataset.focusTask;
 if(!id||$('tasksPage')?.hidden)return;
 const task=read().find(item=>item.id===id&&!item.done);
 if(!task)return;
 const contact=callTargetFromTask(task.title);
 if(contact&&contact===focusOpen.dataset.focusCall){requestCall(contact);return;}
 const taskRow=[...list.querySelectorAll('.personal-task-row[data-task-id]')].find(item=>item.dataset.taskId===id);
 if(!taskRow)return;
 taskRow.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 taskRow.querySelector('[data-task-toggle]')?.focus({preventScroll:true});
});
function showTaskError(message){if(!notice)return;notice.textContent=message;notice.hidden=false;}
function clearTaskError(){if(!notice)return;notice.textContent='';notice.hidden=true;}
const KEY='seyveo-personal-tasks-v1',MAX=150;
let pendingSourceNoteId='',justCompletedTaskId='';
function safeNoteId(value){return typeof value==='string'&&value.length>0&&value.length<=128?value:'';}
function safeParse(raw){try{const v=JSON.parse(raw||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function read(){
 let raw=null;try{raw=localStorage.getItem(KEY)}catch{}
 return safeParse(raw).filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string')
 .slice(-MAX).map(item=>({id:item.id,title:item.title.trim().slice(0,140),
 due:/^\d{4}-\d{2}-\d{2}$/.test(item.due)?item.due:'',done:item.done===true,
 createdAt:typeof item.createdAt==='string'?item.createdAt:'',doneAt:typeof item.doneAt==='string'?item.doneAt:'',
 ...(safeNoteId(item.sourceNoteId)?{sourceNoteId:item.sourceNoteId}:{})}));
}
function save(items){
 try{localStorage.setItem(KEY,JSON.stringify(items.slice(-MAX)));return true}
 catch{return false}
}
function strDate(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
 const [y,m,d]=iso.split('-').map(Number);
 const x=new Date(y,m-1,d);
 if(x.getFullYear()!==y||x.getMonth()+1!==m||x.getDate()!==d)return '';
 return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(x);
}
function element(tag,cls,txt){
 const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;
}
function taskIcon(kind){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 const path=document.createElementNS(ns,'path');
 path.setAttribute('d',kind==='phone'
  ?'M7.2 3.8 10 6.6 8.4 8.7a13 13 0 0 0 6.9 6.9l2.1-1.6 2.8 2.8-1.8 3c-.4.7-1.2 1.1-2 1C9 20 4 15 3.2 7.6c-.1-.8.3-1.6 1-2l3-1.8Z'
  :kind==='more'?'M5 12h.1M12 12h.1M19 12h.1'
  :kind==='note'?'M7 3.5h8l4 4v13H7zM15 3.5v4h4M10 12h6M10 16h5'
  :'m8 16 8-8M9 8h7v7');
 svg.append(path);return svg;
}
function displayDate(item){
 const label=strDate(item.due);if(!label)return '';
 const current=new Date(),today=[current.getFullYear(),String(current.getMonth()+1).padStart(2,'0'),String(current.getDate()).padStart(2,'0')].join('-');
 return item.due<today?'Срок прошёл · '+label:item.due===today?'Сегодня':'До '+label;
}
/* Suggest only a next EXPLICIT instruction from the same current note.
   Ignore already saved tasks (even completed), ambiguous notes and old relative
   dates. The suggestion exists only after a user's completion tap. */
function taskKey(value){return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru-RU');}
function findContinuation(item,all){
 if(!item?.done||!item.sourceNoteId||typeof window.SEYVEO_NOTE_TASK_PLAN!=='function')return null;
 const notes=window.SEYVEO_NOTES_API?.getNotes?.();
 const origin=Array.isArray(notes)?notes.find(note=>note.id===item.sourceNoteId):null;
 if(!origin||origin.paper||origin.preserveLines)return null;
 const plan=window.SEYVEO_NOTE_TASK_PLAN(origin.text);
 if(!plan||!Array.isArray(plan.items))return null;
 const index=plan.items.findIndex(part=>taskKey(part.title)===taskKey(item.title));
 if(index<0)return null;
 const stored=new Set(all.map(part=>taskKey(part.title)));
 for(const candidate of plan.items.slice(index+1)){
  if(typeof candidate?.title==='string'&&!stored.has(taskKey(candidate.title))){
   // Relative dates in old notes must not be reinterpreted as future dates.
   return {title:candidate.title.slice(0,140),sourceNoteId:item.sourceNoteId};
  }
 }
 return null;
}
function continuationPrompt(item,action){
 const card=element('section','personal-task-continuation');
 card.setAttribute('aria-label','SEYVEO предлагает следующий шаг');
 const head=element('strong','personal-task-continuation-title','✧ SEYVEO · Продолжение дела');
 const description=element('p','','После выполнения «'+item.title+'» в исходной заметке осталось ещё одно поручение:');
 const suggestion=element('p','personal-task-continuation-next',action.title);
 const buttons=element('div','personal-task-continuation-actions');
 const prepare=element('button','personal-task-continuation-prepare','Подготовить');
 prepare.type='button';prepare.dataset.taskNext=item.id;
 const dismiss=element('button','personal-task-continuation-dismiss','Не сейчас');
 dismiss.type='button';dismiss.dataset.taskNextDismiss='true';
 buttons.append(prepare,dismiss);
 card.append(head,description,suggestion,buttons);
 return card;
}
/* A deliberately small manual directory, not access to iPhone contacts.
   Private names/numbers remain in unencrypted localStorage: disclose this in UI.
   Only a native tel: link opened by the person's tap can initiate a call. */
const CONTACT_KEY='seyveo-private-contacts-v1',CONTACT_MAX=40;
let editingContact='',deleteContact='',callTargetName='',chosenContact='',returnToCall=false;
const contactName=$('seyveoContactName'),contactPhone=$('seyveoContactPhone');
const contactStatus=$('seyveoContactStatus'),callStatus=$('seyveoCallStatus');
function cleanPhone(raw){
 const value=String(raw||'').replace(/[\s().\-\u2010-\u2015]/g,'');
 return /^\+?\d{7,15}$/.test(value)?value:'';
}
function cleanName(raw){return String(raw||'').trim().replace(/\s+/g,' ').slice(0,70);}
function contactKey(value){return cleanName(value).toLocaleLowerCase('ru-RU');}
function readContacts(){
 try{
  const raw=JSON.parse(localStorage.getItem(CONTACT_KEY)||'[]');
  return Array.isArray(raw)?raw.filter(x=>x&&typeof x.id==='string'&&
   typeof x.name==='string'&&typeof x.phone==='string'&&cleanName(x.name)&&cleanPhone(x.phone))
   .slice(0,CONTACT_MAX).map(x=>({id:x.id,name:cleanName(x.name),phone:cleanPhone(x.phone)})):[];
 }catch{return []}
}
function writeContacts(list){
 try{localStorage.setItem(CONTACT_KEY,JSON.stringify(list));return true}catch{return false}
}
function showContactStatus(message){contactStatus.textContent=message||'';}
function callTargetFromTask(title){
 // Notebook can retain a leading day: «В четверг позвонить Андрею».
 const phrase=String(title||'').trim().replace(/^(?:(?:сегодня|завтра|послезавтра)\s+|(?:в|во|на)\s+(?:понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)\s+)/i,'');
 const match=phrase.match(/^(?:позвонить|позвони|перезвонить|набрать)\s+(?:по\s+телефону\s+)?(.+)$/i);
 if(!match)return '';
 const target=match[1].split(/[,;.!?\n]/)[0]
  .replace(/\s+(?:завтра|послезавтра|сегодня|по\s+поводу|насч[её]т|чтобы|в\s+\d{1,2}(?::\d{2})?)(?:\s.*)?$/i,'')
  .trim();
 return target.length>0&&target.length<=70&&!/\d{4}/.test(target)?target:'';
}
function contactForms(name){
 const key=contactKey(name),forms=new Set([key]);
 if(key==='юля'||key==='юлия')return new Set(['юля','юлия','юле','юли','юлю','юлии','юлию']);
 if(key.includes(' '))return forms;
 if(key.endsWith('ия')){for(const end of ['и','ю','е'])forms.add(key.slice(0,-1)+end);}
 else if(key.endsWith('я')){for(const end of ['е','и','ю'])forms.add(key.slice(0,-1)+end);}
 else if(key.endsWith('а')){for(const end of ['е','у','ы','и'])forms.add(key.slice(0,-1)+end);}
 else if(key.endsWith('й')){for(const end of ['ю','я'])forms.add(key.slice(0,-1)+end);}
 else if(key.endsWith('ь'))forms.add(key.slice(0,-1)+'и');
 else if(key.length>3){forms.add(key+'у');forms.add(key+'а');}
 return forms;
}
/* Friendly Russian nickname and case matching for user's own contacts.
   No numbers guessed, and multiple possible people ALWAYS require selection. */
const juliaNames=new Set(['юльчик','юльчику','юльчика','юличка','юличке','юличку','юля','юле','юлю','юли','юлия','юлии','юлию','юлечка','юлечке','юлечку']);
function personAliases(name){
 const key=contactKey(name);
 // "Юлия Иванова" may be requested as "Юле"; do not mistake this for
 // proof of identity if there are two Julias in the directory.
 const first=key.split(/[\s(,]+/)[0];
 const forms=contactForms(name);
 if(first!==key)for(const form of contactForms(first))forms.add(form);
 if(juliaNames.has(first))for(const alias of juliaNames)forms.add(alias);
 if(first.endsWith('чик'))forms.add(first+'у');
 if(first.endsWith('ка'))forms.add(first.slice(0,-1)+'е');
 if(first.endsWith('ек'))forms.add(first.slice(0,-2)+'ку');
 return forms;
}
function matchingContacts(target,rows){
 const query=contactKey(target);
 if(!query)return [];
 // Prefer exact/grammatical match. Broader nicknames only as a fallback.
 const exact=rows.filter(c=>contactForms(c.name).has(query));
 if(exact.length)return exact;
 return rows.filter(c=>personAliases(c.name).has(query));
}
function personFromRequest(raw){
 if(typeof raw!=='string'||raw.length>200||/[\n\r;]/.test(raw))return '';
 const phrase=raw.trim().replace(/^(?:(?:сэйви|сейви|сейва|сейвео|seyveo)[\s,!:.-]+)+/i,'').trim();
 const match=phrase.match(/^(?:позвони|позвонить|набери|набрать|перезвони|перезвонить)(?:\s+(?:мне|пожалуйста))?\s+(?:(?:моему|моей)\s+)?(.+?)[.!?\s]*$/i);
 if(!match)return '';
 const target=match[1].trim();
 return target.length<=70&&!/[\d@:/]/.test(target)?target:'';
}
function renderContacts(){
 const rows=readContacts(),target=$('seyveoContactsList');target.replaceChildren();
 if(!rows.length){target.append(element('p','personal-contacts-empty','Здесь пока нет контактов. Добавьте первый номер вручную.'));return;}
 for(const c of rows){
  const row=element('div','personal-contacts-item');const details=element('div','personal-contacts-info');
  details.append(element('strong','',c.name),element('small','',c.phone));
  const actions=element('div','personal-contacts-row-actions');
  const edit=element('button','','Изменить');edit.type='button';edit.dataset.contactEdit=c.id;
  const del=element('button','','Удалить');del.type='button';del.dataset.contactDelete=c.id;
  if(deleteContact===c.id){del.textContent='Подтвердить';del.setAttribute('aria-label','Подтвердить удаление контакта '+c.name);}
  actions.append(edit,del);row.append(details,actions);target.append(row);
 }
}
function resetContactForm(){
 editingContact='';deleteContact='';
 $('seyveoContactForm').reset();
 $('seyveoContactSave').textContent='Сохранить контакт';
 $('seyveoContactCancel').hidden=true;
}
function openContacts(fromCall=false){
 if(callDialog.open)callDialog.close();
 returnToCall=Boolean(fromCall);
 resetContactForm();showContactStatus('');
 if(fromCall&&callTargetName){
  // Use the person's requested name; the user supplies the number.
  contactName.value=juliaNames.has(contactKey(callTargetName))?'Юльчик':callTargetName;
 }
 renderContacts();
 if(!contactsDialog.open)contactsDialog.showModal();
}
function renderCallList(){
 const rows=readContacts(),query=contactKey($('seyveoCallSearch').value);
 const target=$('seyveoCallList');target.replaceChildren();
 const visible=rows.filter(c=>!query||contactKey(c.name).includes(query));
 if(!visible.length){target.append(element('p','personal-contacts-empty',rows.length?'Совпадений не найдено.':'Пока нет контактов. Добавьте номер вручную.'));return;}
 for(const c of visible){
  const button=element('button','personal-call-choice');button.type='button';
  button.dataset.callChoice=c.id;button.setAttribute('aria-pressed',String(chosenContact===c.id));
  button.append(element('strong','',c.name),element('small','',c.phone));target.append(button);
 }
}
function showCallChoices(show){
 const inputGroup=$('seyveoCallSearchGroup'),listGroup=$('seyveoCallList'),switchBtn=$('seyveoCallChooseOther');
 if(inputGroup)inputGroup.hidden=!show;
 if(listGroup)listGroup.hidden=!show;
 if(switchBtn){
  switchBtn.hidden=!chosenContact;
  switchBtn.setAttribute('aria-expanded',String(show));
  switchBtn.textContent=show?'Скрыть контакты':'Другой контакт';
 }
}
function chooseCallContact(id){
 const entry=readContacts().find(c=>c.id===id);
 chosenContact=entry?.id||'';
 const picked=$('seyveoCallPicked'),dial=$('seyveoCallDial');
 picked.hidden=!entry;dial.hidden=!entry;
 if(entry){
  $('seyveoCallPickedName').textContent=entry.name;
  $('seyveoCallPickedPhone').textContent=entry.phone;
  dial.href='tel:'+entry.phone;
  dial.setAttribute('aria-label','Позвонить контакту '+entry.name);
  callStatus.textContent='Сэйви нашла номер. Нажмите «Позвонить» — телефон предложит подтвердить вызов.';
 }else{
  dial.removeAttribute('href');callStatus.textContent='Выберите контакт, чтобы подготовить звонок.';
 }
 renderCallList();
}
function openCall(targetName){
 callTargetName=String(targetName||'').slice(0,70);
 chosenContact='';
 $('seyveoCallTitle').textContent='Позвонить'+(callTargetName?' · '+callTargetName:'');
 $('seyveoCallSearch').value='';
 if(!callDialog.open)callDialog.showModal();
 const matches=matchingContacts(callTargetName,readContacts());
 chooseCallContact(matches.length===1?matches[0].id:'');
 if(matches.length>1)callStatus.textContent='Нашла несколько возможных контактов. Выберите, кому звонить.';
 else if(!matches.length)callStatus.textContent='Не нашла номер в «Моём мире». Выберите человека или добавьте контакт.';
 showCallChoices(matches.length!==1);
}
function requestCall(target){
 const person=cleanName(target);
 if(!person)return null;
 const matches=matchingContacts(person,readContacts());
 openCall(person);
 return {
  kind:'contact-call',
  message:matches.length===1
    ?'Нашла контакт «'+matches[0].name+'». Проверь номер и нажми «Позвонить».'
    :matches.length>1
    ?'Нашла несколько возможных контактов. Выбери нужного человека.'
    :'Пока не нашла «'+person+'» в «Моём мире». Можно выбрать или добавить номер.'
 };
}
window.SEYVEO_CONTACTS=Object.freeze({
 taskTarget:callTargetFromTask,understand:personFromRequest,requestCall,
 availability:target=>{
  const matches=matchingContacts(cleanName(target),readContacts());
  return Object.freeze({matches:matches.length,name:matches.length===1?matches[0].name:''});
 },
 state:()=>({count:readContacts().length})
});
window.addEventListener('seyveo:call-request',event=>{
 const target=typeof event.detail?.target==='string'?event.detail.target:'';
 if(target)requestCall(target);
});
/* The only contact directory now lives under Мой мир.
   Reuse the same local data and editors; never migrate or duplicate numbers. */
window.addEventListener('seyveo:contacts-open',()=>{
 callTargetName='';openContacts();
});
window.addEventListener('seyveo:contacts-read',event=>{
 if(event.detail)event.detail.items=readContacts();
});
window.addEventListener('seyveo:contact-call',event=>{
 const entry=readContacts().find(c=>c.id===event.detail?.id);
 if(!entry)return;
 openCall(entry.name);
 chooseCallContact(entry.id);
 showCallChoices(false);
 $('seyveoCallTitle').textContent='Позвонить · '+entry.name;
});
function contactsChanged(){
 window.dispatchEvent(new Event('seyveo:contacts-changed'));
}
/* Header close controls use the shared SEYVEO dialog handler. */
$('seyveoContactCancel').addEventListener('click',()=>{resetContactForm();showContactStatus('');renderContacts()});
$('seyveoContactForm').addEventListener('submit',event=>{
 event.preventDefault();
 const name=cleanName(contactName.value),phone=cleanPhone(contactPhone.value);
 if(name.length<2||!phone){showContactStatus('Проверьте имя и номер: от 7 до 15 цифр, допускается «+».');return;}
 const existing=readContacts();
 if(existing.some(c=>c.id!==editingContact&&contactKey(c.name)===contactKey(name)&&c.phone===phone)){
  showContactStatus('Такой контакт уже сохранён.');return;
 }
 if(!editingContact&&existing.length>=CONTACT_MAX){
  showContactStatus('В справочнике не больше 40 контактов.');return;
 }
 const updated=editingContact
  ?existing.map(c=>c.id===editingContact?{...c,name,phone}:c)
  :[...existing,{id:'contact-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name,phone}];
 if(!writeContacts(updated)){showContactStatus('Не удалось сохранить контакт. Проверьте память устройства.');return;}
 const resume=returnToCall;
 resetContactForm();renderContacts();showContactStatus('Контакт сохранён на этом устройстве.');
 contactsChanged();
 if(resume){returnToCall=false;contactsDialog.close();openCall(callTargetName);}
});
$('seyveoContactsList').addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 const rows=readContacts();
 if(b.dataset.contactEdit){
  const c=rows.find(x=>x.id===b.dataset.contactEdit);if(!c)return;
  deleteContact='';editingContact=c.id;
  contactName.value=c.name;contactPhone.value=c.phone;
  $('seyveoContactSave').textContent='Сохранить изменения';
  $('seyveoContactCancel').hidden=false;
  showContactStatus('Измените имя или номер и сохраните.');
  renderContacts();contactName.focus({preventScroll:true});
 }else if(b.dataset.contactDelete){
  const id=b.dataset.contactDelete;
  if(deleteContact!==id){deleteContact=id;showContactStatus('Нажмите «Подтвердить» для удаления.');renderContacts();return;}
  if(!writeContacts(rows.filter(x=>x.id!==id))){
   showContactStatus('Не удалось удалить контакт.');return;
  }
  resetContactForm();renderContacts();showContactStatus('Контакт удалён с устройства.');
  contactsChanged();
 }
});
$('seyveoCallList').addEventListener('click',event=>{
 const b=event.target.closest('button[data-call-choice]');
 if(b){
  chooseCallContact(b.dataset.callChoice);
  showCallChoices(false);
 }
});
$('seyveoCallChooseOther').addEventListener('click',()=>{
 const showing=!$('seyveoCallList').hidden;
 showCallChoices(!showing);
 if(!showing)$('seyveoCallSearch').focus({preventScroll:true});
});
$('seyveoCallSearch').addEventListener('input',renderCallList);
$('seyveoCallAddContact').addEventListener('click',()=>openContacts(true));
summary.addEventListener('click',event=>{
 const btn=event.target.closest('button[data-task-call]');
 if(!btn)return;
 const task=read().find(x=>x.id===btn.dataset.taskCall&&!x.done);
 const target=task?callTargetFromTask(task.title):'';
 if(target)requestCall(target);
});
$('seyveoCallDial').addEventListener('click',event=>{
 const c=readContacts().find(x=>x.id===chosenContact);
 if(!c){event.preventDefault();chooseCallContact('');return;}
 if($('seyveoCallDial').getAttribute('href')!=='tel:'+c.phone){
  event.preventDefault();chooseCallContact(c.id);
  callStatus.textContent='Номер контакта изменился. Проверьте и нажмите ещё раз.';
  return;
 }
 // Do not treat opening Phone as evidence the call actually connected.
 callStatus.textContent='Откройте «Телефон» и подтвердите вызов. Дело останется незавершённым.';
});
window.addEventListener('storage',event=>{
 if(event.key===CONTACT_KEY){
  if(contactsDialog.open)renderContacts();
  if(callDialog.open)chooseCallContact(chosenContact);
  contactsChanged();
 }
});
function row(item,compact=false){
 const section=element('div',compact?'personal-brief-row':'personal-task-row');
 section.dataset.taskId=item.id;
 const label=element('span','personal-task-content');
 const contact=callTargetFromTask(item.title);
 const name=element('button',compact&&contact?'personal-task-call-title':'personal-task-name',item.title);
 name.type='button';
 if(compact&&contact){
  name.dataset.taskCall=item.id;
  name.setAttribute('aria-label','Подготовить звонок: '+contact);
 }else if(!compact){
  name.dataset.taskMenu=item.id;
  name.setAttribute('aria-label','Показать действия с делом: '+item.title);
  name.setAttribute('aria-expanded','false');
 }else{
  name.disabled=true;
 }
 if(item.done)name.classList.add('is-done');
 label.append(name);
 const due=displayDate(item);
 if(due||item.done)label.append(element('small','',item.done?'Завершено':due));
 if(!compact){
  if(item.sourceNoteId){
   const origin=element('button','personal-task-origin','Из Блокнота · Открыть запись');
   origin.type='button';origin.dataset.taskOrigin=item.id;
   origin.setAttribute('aria-label','Открыть исходную заметку для дела: '+item.title);
   label.append(origin);
  }
  const art=element(contact&&!item.done?'button':'span','personal-task-art');
  art.append(taskIcon(contact?'phone':'note'));
  if(art.tagName==='BUTTON'){
   art.type='button';art.dataset.taskCall=item.id;
   art.setAttribute('aria-label','Подготовить звонок: '+contact);
   art.title='Позвонить';
  }else art.setAttribute('aria-hidden','true');
  const checkbox=element('button','personal-task-check',item.done?'✓':'');
  checkbox.type='button';checkbox.dataset.taskToggle=item.id;
  checkbox.setAttribute('aria-label',item.done?'Вернуть дело: '+item.title:'Завершить дело: '+item.title);
  checkbox.setAttribute('aria-pressed',String(item.done));
  const menu=element('div','personal-task-menu');menu.hidden=true;
  const remove=element('button','personal-task-menu-delete','Удалить дело');
  remove.type='button';remove.dataset.taskDelete=item.id;
  remove.setAttribute('aria-label','Удалить дело: '+item.title);
  menu.append(remove);
  section.append(art,label,checkbox,menu);
 }else section.append(label);
 return section;
}
function render(){
 clearTaskError();
 const all=read(),open=all.filter(item=>!item.done)
 .sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31')||a.createdAt.localeCompare(b.createdAt));
 const done=all.filter(item=>item.done).reverse();
 const featuredTaskId=renderContext(open);
 const visibleOpen=open.filter(item=>item.id!==featuredTaskId||focusPanel?.dataset.focusKind!=='call');
 list.replaceChildren();
 if(!all.length){
  list.append(element('p','personal-tasks-empty','Пока нет дел. Добавьте первое — SEYVEO сохранит его на этом устройстве.'));
 }else{
  if(visibleOpen.length){const head=element('h3','personal-list-title','Нужно сделать · '+visibleOpen.length);list.append(head);
   visibleOpen.forEach(task=>list.append(row(task)))}
  if(done.length){const head=element('h3','personal-list-title','Выполнено · '+done.length);list.append(head);
   done.slice(0,30).forEach(task=>list.append(row(task)))}
 }
 // Offer a single short-lived continuation only for the task just completed.
 const completed=all.find(item=>item.id===justCompletedTaskId&&item.done);
 if(completed){
  const action=findContinuation(completed,all);
  if(action)list.prepend(continuationPrompt(completed,action));
 }
 summary.replaceChildren();
 if(open.length)open.slice(0,2).forEach(task=>summary.append(row(task,true)));
 else summary.append(element('p','personal-brief-empty',all.length?'Все личные дела завершены. Отличная работа.':'Личных дел пока нет.'));
 $('personalBriefCount').textContent=open.length?String(open.length):'';
 $('personalBriefCount').hidden=!open.length;
 // Keep personal tasks in Дела; show their compact Home preview only if pending.
 $('personalBrief').hidden=open.length===0;
 window.dispatchEvent(new CustomEvent('seyveo:tasks-changed',{detail:{open:open.length,total:all.length}}));
}
function syncDueDateDisplay(){
 const display=$('personalTaskDueDisplay'),control=date.closest('.personal-task-date-control');
 if(!display||!control)return;
 const value=date.value;
 let label='Выбрать дату';
 if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
  const [year,month,day]=value.split('-').map(Number);
  const parsed=new Date(year,month-1,day);
  if(parsed.getFullYear()===year&&parsed.getMonth()===month-1&&parsed.getDate()===day)
   label=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(parsed);
 }
 display.textContent=label;
 control.dataset.filled=String(label!=='Выбрать дату');
}
for(const eventName of ['input','change','blur'])date.addEventListener(eventName,syncDueDateDisplay);
function openDialog(){
 pendingSourceNoteId='';
 form.reset();syncDueDateDisplay();$('personalTaskStatus').textContent='';
 if(!dialog.open)dialog.showModal();
 window.requestAnimationFrame(syncDueDateDisplay);
 input.focus({preventScroll:true});
}
function put(e){
 e.preventDefault();
 const title=input.value.trim().replace(/\s+/g,' ');
 if(!title){$('personalTaskStatus').textContent='Напишите, что нужно сделать.';input.focus();return}
 const all=read();
 if(all.length>=MAX){$('personalTaskStatus').textContent='Достигнут предел записей. Удалите ненужные завершённые дела.';return}
 const next=[...all,{id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),title:title.slice(0,140),due:date.value,done:false,createdAt:new Date().toISOString(),doneAt:'',
 ...(pendingSourceNoteId?{sourceNoteId:pendingSourceNoteId}:{})}];
 if(!save(next)){$('personalTaskStatus').textContent='Не удалось сохранить. Проверьте память браузера.';return}
 pendingSourceNoteId='';justCompletedTaskId='';
 dialog.close();render();
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
}
function change(id,del=false){
 const all=read(),target=all.find(item=>item.id===id);if(!target)return;
 if(del){
   if(!window.confirm('Удалить дело «'+target.title+'»?'))return;
   if(!save(all.filter(item=>item.id!==id))){showTaskError('Не удалось удалить дело. Проверьте память устройства.');return}
 }else{
   target.done=!target.done;target.doneAt=target.done?new Date().toISOString():'';
   if(!save(all)){showTaskError('Не удалось сохранить изменение. Проверьте память устройства.');return}
 }
 justCompletedTaskId=!del&&target.done?target.id:'';
 render();
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
}
form.addEventListener('submit',put);
$('personalAddHome').addEventListener('click',openDialog);
$('personalAddTasks').addEventListener('click',openDialog);
$('personalTaskCancel').addEventListener('click',()=>dialog.close());
list.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.taskToggle)change(btn.dataset.taskToggle);
 else if(btn.dataset.taskMenu){
  const taskRow=btn.closest('.personal-task-row');
  if(!taskRow)return;
  const expanded=btn.getAttribute('aria-expanded')==='true';
  list.querySelectorAll('[data-task-menu]').forEach(other=>other.setAttribute('aria-expanded','false'));
  list.querySelectorAll('.personal-task-menu').forEach(other=>{other.hidden=true});
  btn.setAttribute('aria-expanded',String(!expanded));
  const menu=taskRow.querySelector('.personal-task-menu');
  if(menu)menu.hidden=expanded;
 }
 else if(btn.dataset.taskCall){
  const task=read().find(x=>x.id===btn.dataset.taskCall);
  const target=task?callTargetFromTask(task.title):'';
  if(target)requestCall(target);
 }
 else if(btn.dataset.taskDelete)change(btn.dataset.taskDelete,true);
 else if(btn.dataset.taskNextDismiss){
  justCompletedTaskId='';render();
 }
 else if(btn.dataset.taskNext){
  const completed=read().find(item=>item.id===btn.dataset.taskNext&&item.done);
  const suggestion=completed?findContinuation(completed,read()):null;
  if(!suggestion){justCompletedTaskId='';render();showTaskError('Следующее поручение уже создано или исходная заметка изменилась.');return;}
  justCompletedTaskId='';
  openDialog();
  input.value=suggestion.title;
  pendingSourceNoteId=suggestion.sourceNoteId;
  date.value='';syncDueDateDisplay();
  $('personalTaskStatus').textContent='Из исходной заметки. Проверьте текст и укажите срок, если он нужен. Сохранение — только по вашему решению.';
  input.focus({preventScroll:true});
 }
 else if(btn.dataset.taskOrigin){
  const target=read().find(row=>row.id===btn.dataset.taskOrigin);
  if(!target?.sourceNoteId)return;
  const detail={id:target.sourceNoteId};
  window.dispatchEvent(new CustomEvent('seyveo:note-open-source',{detail}));
  if(detail.result?.status!=='opened')
   showTaskError(detail.result?.message||'Не удалось открыть исходную заметку.');
 }
});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
/* Prepared from a Notebook note; the existing task form is the only
   writer and still requires the person's explicit Save action. */
window.addEventListener('seyveo:task-plan-note',event=>{
 const draft=event.detail||{};
 const title=typeof draft.title==='string'?draft.title.trim().replace(/\s+/g,' ').slice(0,140):'';
 if(!title)return;
 openDialog();
 input.value=title;
 pendingSourceNoteId=safeNoteId(draft.sourceNoteId);
 const requested=typeof draft.date==='string'?draft.date:'';
 if(strDate(requested))date.value=requested;
 syncDueDateDisplay();
 $('personalTaskStatus').textContent='SEYVEO заметил возможное дело в заметке. Проверьте название и срок, затем сохраните.';
 input.focus({preventScroll:true});
});
/* Explicit one-click approval of up to five tasks from a reviewed Notebook plan.
   Same local task store and renderer as the normal task editor. Atomic write,
   existing and within-plan duplicates are skipped; never truncate old tasks. */
window.addEventListener('seyveo:tasks-plan-batch',event=>{
 const detail=event.detail;
 if(!detail||!Array.isArray(detail.items)||!detail.items.length||detail.items.length>5){
  if(detail)detail.result={status:'invalid',message:'Не удалось прочитать план.'};
  return;
 }
 const sourceNoteId=safeNoteId(detail.sourceNoteId);
 const all=read(),seen=new Set(all.map(item=>
  item.title.replace(/\s+/g,' ').trim().toLocaleLowerCase('ru-RU')+'|'+item.due));
 const pending=[];
 let duplicates=0;
 for(const draft of detail.items){
  if(!draft||typeof draft.title!=='string'||typeof draft.due!=='string'){
   detail.result={status:'invalid',message:'Проверьте текст дел и сроки.'};return;
  }
  const title=draft.title.trim().replace(/\s+/g,' ').slice(0,140);
  const due=draft.due;
  if(!title||(due&&!strDate(due))){
   detail.result={status:'invalid',message:'Проверьте текст дел и даты.'};return;
  }
  const key=title.toLocaleLowerCase('ru-RU')+'|'+due;
  if(seen.has(key)){duplicates++;continue}
  seen.add(key);pending.push({title,due});
 }
 if(!pending.length){
  detail.result={status:'already',added:0,duplicates,
   message:'Такие дела уже есть. Повторно ничего не добавлено.'};return;
 }
 if(all.length+pending.length>MAX){
  detail.result={status:'full',added:0,duplicates,
   message:'Для плана не хватает места в списке дел. Освободите место и повторите.'};return;
 }
 const stamp=Date.now(),createdAt=new Date(stamp).toISOString();
 const next=all.concat(pending.map((draft,index)=>({
  id:'personal-'+stamp+'-'+index+'-'+Math.random().toString(36).slice(2,9),
  title:draft.title,due:draft.due,done:false,createdAt,doneAt:'',
  ...(sourceNoteId?{sourceNoteId}:{})
 })));
 if(!save(next)){
  detail.result={status:'error',added:0,duplicates,
   message:'Не удалось сохранить план. Проверьте память устройства.'};return;
 }
 justCompletedTaskId='';
 render();
 detail.result={status:'saved',added:pending.length,duplicates,
  message:'Добавлено в Дела: '+pending.length+(duplicates?' · уже были: '+duplicates:'')+'.'};
});
window.addEventListener('storage',event=>{if(event.key===KEY){justCompletedTaskId='';render()}});
window.addEventListener('hashchange',()=>{if(!$('tasksPage')?.hidden)render()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
render();
})();