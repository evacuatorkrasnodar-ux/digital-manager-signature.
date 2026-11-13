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
 // Only useful time context belongs above the task. No repeated
 // SEYVEO label or redundant "Срок": the card is already a task card.
 const labels={
  'Срок прошёл':'Просрочено',
  'Срок сегодня':'Сегодня',
  'Срок завтра':'Завтра',
  'Срок в ближайшие дни':'В ближайшие дни'
 };
 focusWhen.textContent=labels[priority.when]||String(priority.when||'').replace(/^Срок\s+/u,'');
 focusWhen.dataset.urgency=priority.when==='Срок прошёл'?'overdue':
  priority.when==='Срок сегодня'?'today':'upcoming';
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
let pendingSourceNoteId='',justCompletedTaskId='',editingTaskId='';
let taskEditorSavedOnExit=false;
function safeNoteId(value){return typeof value==='string'&&value.length>0&&value.length<=128?value:'';}
function safeParse(raw){try{const v=JSON.parse(raw||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function read(){
 let raw=null;try{raw=localStorage.getItem(KEY)}catch{}
 return safeParse(raw).filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string')
 .slice(-MAX).map(item=>({id:item.id,title:item.title.trim().slice(0,140),
 due:/^\d{4}-\d{2}-\d{2}$/.test(item.due)?item.due:'',time:/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)?item.time:'',done:item.done===true,
 createdAt:typeof item.createdAt==='string'?item.createdAt:'',doneAt:typeof item.doneAt==='string'?item.doneAt:'',
 ...(safeNoteId(item.sourceNoteId)?{sourceNoteId:item.sourceNoteId}:{}),
 ...(typeof item.source==='string'&&['sayvi','work','notebook'].includes(item.source)?{source:item.source}:{}),
 category:item.category==='work'||item.category==='personal'?item.category:(item.source==='work'?'work':'personal'),
 entryType:item.entryType==='event'||item.entryType==='task'?item.entryType:svInferEntryType(item.title)}));
}
/* Calendar appointments keep their own validated store. The agenda reads them
   as views only: it never writes or copies an appointment into Tasks. */
const CAL_EVENTS_KEY='seyveo-calendar-events-v1';
function svCalendarAgendaEvents(){
 let data=[];try{const parsed=JSON.parse(localStorage.getItem(CAL_EVENTS_KEY)||'[]');if(Array.isArray(parsed))data=parsed}catch{}
 return data.filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))
 .slice(-300).map(item=>({
  id:'calendar:'+item.id,calendarId:item.id,sourceStore:'calendar',
  title:item.title.trim().slice(0,140),due:item.date,
  time:/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time||'')?item.time:'',
  category:item.kind==='business'?'work':'personal',entryType:'event',done:false,
  createdAt:typeof item.createdAt==='string'?item.createdAt:''
 })).filter(item=>item.title);
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
  :kind==='mail'?'M3.5 6.5h17v11h-17zM3.5 7l8.5 6 8.5-6'
  :kind==='note'?'M7 3.5h8l4 4v13H7zM15 3.5v4h4M10 12h6M10 16h5'
  :'m8 16 8-8M9 8h7v7');
 svg.append(path);return svg;
}
function displayDate(item){
 const label=strDate(item.due);
 const current=new Date(),today=[current.getFullYear(),String(current.getMonth()+1).padStart(2,'0'),String(current.getDate()).padStart(2,'0')].join('-');
 const day=label?(item.due<today?'Срок прошёл · '+label:item.due===today?'Сегодня':'До '+label):'';
 const scheduled=day&&/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time||'')?' · '+item.time:'';
 return day+scheduled;
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
 const head=element('strong','personal-task-continuation-title','SEYVEO · Продолжение дела');
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
const CONTACT_KEY='seyveo-private-contacts-v1',CONTACT_MAX=500;
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
/* Shared, pure voice/text and nickname matching. Real contacts stay here. */
const callIntent=window.SEYVEO_CALL_INTENT;
function matchingContacts(target,rows){return callIntent?.findMatches(target,rows)||[];}
function personFromRequest(raw){return callIntent?.parse(raw)||'';}
/* Native-like contact directory: sort, search, group, and call from a true tel: link.
   The original localStorage key and call-assistant integration remain unchanged. */
function phonebookIcon(kind){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');
 svg.setAttribute('fill','none');svg.setAttribute('aria-hidden','true');
 svg.setAttribute('focusable','false');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 const paths={
  call:'M22 16.9v2.8a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.3 4.2 2 2 0 0 1 4.3 2h2.8a2 2 0 0 1 2 1.7l.5 3.2a2 2 0 0 1-.6 1.8L7 10.6a16 16 0 0 0 6.4 6.4l1.9-2a2 2 0 0 1 1.8-.6l3.2.5a2 2 0 0 1 1.7 2z',
  edit:'M12 20h9M16 3l5 5-12 12-5 1 1-5L17 4a2 2 0 0 1 3 0z',
  person:'M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M16 11h6'
 };
 path.setAttribute('d',paths[kind]||paths.person);
 svg.append(path);return svg;
}
function phonebookCount(n){
 const tail=n%10===1&&n%100!==11?'контакт':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'контакта':'контактов';
 return n+' '+tail;
}
function renderContacts(){
 const all=readContacts().slice().sort((a,b)=>a.name.localeCompare(b.name,'ru',{sensitivity:'base'}));
 const search=String($('seyveoContactSearch')?.value||'').trim().toLocaleLowerCase('ru-RU');
 const numeric=search.replace(/\D/g,'');
 const rows=all.filter(c=>!search||contactKey(c.name).includes(search)||(numeric&&c.phone.replace(/\D/g,'').includes(numeric)));
 const target=$('seyveoContactsList');target.replaceChildren();
 $('seyveoContactCount').textContent=search?rows.length+' из '+phonebookCount(all.length):phonebookCount(all.length);
 // Empty directory: the magnifier and zero count only add clutter.
 $('seyveoContactSearchWrap').hidden=all.length===0;
 $('seyveoContactCount').hidden=all.length===0;
 if(!rows.length){
  const empty=element('div','sv-phonebook-empty');
  const symbol=element('span','sv-phonebook-empty-icon');
  symbol.append(phonebookIcon('person'));
  empty.append(symbol,element('strong','',search?'Ничего не найдено':'Контактов пока нет'),
    element('small','',search?'Попробуйте другое имя или номер.':'Нажмите «+», чтобы добавить первый контакт.'));
  target.append(empty);return;
 }
 let previousLetter='';
 for(const c of rows){
  const first=c.name.charAt(0).toLocaleUpperCase('ru-RU');
  const letter=/^[А-ЯЁA-Z]$/u.test(first)?first:'#';
  if(letter!==previousLetter){
   const heading=element('div','sv-phonebook-letter',letter);
   target.append(heading);previousLetter=letter;
  }
  const row=element('div','sv-phonebook-row');
  const dial=element('a','sv-phonebook-person');
  dial.href='tel:'+c.phone;dial.setAttribute('aria-label','Позвонить: '+c.name+', '+c.phone);
  const avatar=element('span','sv-phonebook-avatar',
   c.name.split(/\s+/).slice(0,2).map(x=>x.charAt(0).toLocaleUpperCase('ru-RU')).join(''));
  const copy=element('span','sv-phonebook-person-copy');
  copy.append(element('strong','',c.name),element('small','',c.phone));
  const callIcon=element('span','sv-phonebook-call');callIcon.append(phonebookIcon('call'));
  dial.append(avatar,copy,callIcon);
  const edit=element('button','sv-phonebook-edit');
  edit.type='button';edit.dataset.contactEdit=c.id;
  edit.setAttribute('aria-label','Изменить контакт '+c.name);
  edit.append(phonebookIcon('edit'));
  row.append(dial,edit);target.append(row);
 }
}
function setContactEditor(show){
 const editor=$('seyveoContactEditor');editor.hidden=!show;
 for(const id of ['seyveoContactSearchWrap','seyveoContactCount','seyveoContactsList','seyveoContactsPrivacy']){
  const node=$(id);
  if(node)node.hidden=show||(!readContacts().length&&
   (id==='seyveoContactSearchWrap'||id==='seyveoContactCount'));
 }
 $('seyveoContactAdd').hidden=show;
 $('seyveoContactCancel').hidden=!show;
 $('seyveoContactDeleteForm').hidden=!show||!editingContact;
 $('seyveoContactEditorTitle').textContent=editingContact?'Редактировать контакт':'Новый контакт';
 $('seyveoContactDeleteForm').textContent='Удалить контакт';
 if(show)contactName.focus({preventScroll:true});
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
 $('seyveoContactSearch').value='';
 renderContacts();
 if(!contactsDialog.open)contactsDialog.showModal();
 setContactEditor(Boolean(fromCall));
 if(fromCall&&callTargetName){
  contactName.value=callIntent?.isJuliaAlias(callTargetName)?'Юльчик':callTargetName;
 }
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
 callHandoffPending=false;callWasHidden=false;
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
$('seyveoContactSearch').addEventListener('input',renderContacts);
$('seyveoContactAdd').addEventListener('click',()=>{
 resetContactForm();showContactStatus('');setContactEditor(true);
});
$('seyveoContactCancel').addEventListener('click',()=>{
 resetContactForm();showContactStatus('');setContactEditor(false);renderContacts();
});
$('seyveoContactForm').addEventListener('submit',event=>{
 event.preventDefault();
 const name=cleanName(contactName.value),phone=cleanPhone(contactPhone.value);
 if(name.length<2||!phone){showContactStatus('Проверьте имя и номер: от 7 до 15 цифр, допускается «+».');return;}
 const existing=readContacts();
 if(existing.some(c=>c.id!==editingContact&&contactKey(c.name)===contactKey(name)&&c.phone===phone)){
  showContactStatus('Такой контакт уже сохранён.');return;
 }
 if(!editingContact&&existing.length>=CONTACT_MAX){
  showContactStatus('В справочнике не больше '+CONTACT_MAX+' контактов.');return;
 }
 const updated=editingContact
  ?existing.map(c=>c.id===editingContact?{...c,name,phone}:c)
  :[...existing,{id:'contact-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name,phone}];
 if(!writeContacts(updated)){showContactStatus('Не удалось сохранить контакт. Проверьте память устройства.');return;}
 const resume=returnToCall;
 resetContactForm();
 $('seyveoContactSearch').value='';
 setContactEditor(false);renderContacts();
 showContactStatus('Контакт сохранён на этом устройстве.');
 contactsChanged();
 if(resume){returnToCall=false;contactsDialog.close();openCall(callTargetName);}
});
$('seyveoContactsList').addEventListener('click',event=>{
 const edit=event.target.closest('button[data-contact-edit]');
 if(!edit)return;
 const c=readContacts().find(x=>x.id===edit.dataset.contactEdit);if(!c)return;
 resetContactForm();editingContact=c.id;
 contactName.value=c.name;contactPhone.value=c.phone;
 $('seyveoContactSave').textContent='Сохранить изменения';
 showContactStatus('');setContactEditor(true);
});
$('seyveoContactDeleteForm').addEventListener('click',()=>{
 if(!editingContact)return;
 if(deleteContact!==editingContact){
  deleteContact=editingContact;
  $('seyveoContactDeleteForm').textContent='Подтвердить удаление';
  showContactStatus('Нажмите ещё раз, чтобы удалить контакт с этого устройства.');
  return;
 }
 const rows=readContacts();
 if(!writeContacts(rows.filter(x=>x.id!==editingContact))){
  showContactStatus('Не удалось удалить контакт.');return;
 }
 resetContactForm();setContactEditor(false);renderContacts();
 showContactStatus('Контакт удалён с устройства.');
 contactsChanged();
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
// A tel: link hands control to the system. Returning does NOT prove a call
// connected; never close a task or create an invented call record.
let callHandoffPending=false,callWasHidden=false;
function restoreCallContext(){
 if(!callHandoffPending)return;
 if(document.hidden){callWasHidden=true;return;}
 if(!callWasHidden)return;
 callHandoffPending=false;callWasHidden=false;
 if(callDialog.open){
  callStatus.textContent='Сэйви снова рядом. Я не могу определить, состоялся ли разговор. Если поручение выполнено, отметьте его в «Делах».';
  window.dispatchEvent(new CustomEvent('seyveo:call-return',{detail:{verified:false}}));
 }
}
document.addEventListener('visibilitychange',restoreCallContext);
window.addEventListener('pagehide',()=>{if(callHandoffPending)callWasHidden=true;});
window.addEventListener('pageshow',restoreCallContext);
callDialog.addEventListener('close',()=>{callHandoffPending=false;callWasHidden=false;});
$('seyveoCallDial').addEventListener('click',event=>{
 const c=readContacts().find(x=>x.id===chosenContact);
 if(!c){event.preventDefault();chooseCallContact('');return;}
 if($('seyveoCallDial').getAttribute('href')!=='tel:'+c.phone){
  event.preventDefault();chooseCallContact(c.id);
  callStatus.textContent='Номер контакта изменился. Проверьте и нажмите ещё раз.';
  return;
 }
 // Only a real user tap opens the system dialer; no auto-dial or success state.
 callHandoffPending=true;callWasHidden=false;
 callStatus.textContent='Передаю номер в системный «Телефон». Подтвердите вызов там. Дело останется незавершённым.';
});
window.addEventListener('storage',event=>{
 if(event.key===CONTACT_KEY){
  if(contactsDialog.open)renderContacts();
  if(callDialog.open)chooseCallContact(chosenContact);
  contactsChanged();
 }
});
/* One real conversation for all task sources. Never auto-send or mark work done. */
function askSayviForTask({title,kind='task',note='',due='',assignee='' }={}){
 const subject=String(title||'').trim().slice(0,140);
 if(!subject)return false;
 const chat=window.SEYVEO_CONVERSATION;
 const editor=$('question'),composer=$('ask');
 if(typeof chat?.open!=='function'||!editor||!composer){
  showTaskError('Чат Сэйви сейчас недоступен. Дело осталось на месте.');return false;
 }
 const notesMode=composer.dataset.composerMode==='notes';
 const current=editor.value.trim();
 if(notesMode&&current){
  showTaskError('Сначала сохраните заметку в Блокноте. Её текст не будет заменён.');return false;
 }
 const lead=kind==='mail'
  ?'Помоги подготовить ответ на отложенное письмо.'
  :kind==='contract'
   ?'Помоги проверить отложенный документ. Если файл не прикреплён, сначала попроси его; не утверждай, что проверка уже выполнена.'
   :kind==='work'
    ?'Помоги разобраться с рабочим поручением, предложи следующий шаг и варианты решения.'
    :'Помоги мне выполнить это дело: предложи конкретные шаги.';
 const context=[lead,'Дело: '+subject,
  assignee?'Ответственный: '+String(assignee).slice(0,80):'',
  due?'Срок: '+String(due).slice(0,40):'',
  note?'Контекст: '+String(note).slice(0,350):'',
  'Не отправляй сообщения и не отмечай дело выполненным без моего подтверждения.'].filter(Boolean).join('\n');
 if(notesMode)$('composerModeAsk')?.click();
 chat.open();
 if(!document.documentElement.classList.contains('seyveo-conversation')){
  showTaskError('Не удалось открыть разговор с Сэйви.');return false;
 }
 if(current&&current!==context){
  chat.status?.('Сохранила ваш текущий черновик. Отправьте или очистите его, затем снова откройте дело через Сэйви.',6000);
  return true;
 }
 editor.value=context;
 editor.dispatchEvent(new Event('input',{bubbles:true}));
 editor.focus({preventScroll:true});
 editor.setSelectionRange?.(context.length,context.length);
 return true;
}
window.SEYVEO_TASK_ASSIST=Object.freeze({open:askSayviForTask});


/* SEYVEO Agenda · one renderer for the iOS-style date ticker and event list.
 * Data, task actions and the global shell remain owned by Personal Tasks. */
let svTaskSelectedDate='',svTaskWindowStart='';
let svAgendaLastRows=[],svAgendaScrollFrame=0,svAgendaJumpThrough=0;
const svTaskCategory=item=>item.category==='work'||item.category==='personal'?item.category:(item.source==='work'?'work':'personal');
/* All categories are always visible; colors distinguish them without screen filters. */
const svTaskMatchesCategory=()=>true;
/* Conservative offline suggestion; the person can always change the category. */
/* Calendar events happen; tasks can be checked off. Preserve explicit choices. */
function svInferEntryType(title){
 const value=String(title||'').toLocaleLowerCase('ru-RU');
 if(/(^|[^а-яё])(напомни|напоминан|купить|подготовить|отправить|оплатить|сделать|проверить|забрать|заказать|позвонить|написать|выслать|убрать|помыть|сдать|завершить|задач)/u.test(value))return 'task';
 if(/(^|[^а-яё])(встреч|поездк|созвон|совещан|конференц|тренировк|заняти|урок|приём|прием|праздник|день рождени|обед|ужин|концерт|путешеств|мероприят)/u.test(value))return 'event';
 return 'task';
}
function svTaskEntryType(item){return item.entryType==='event'?'event':'task';}
function svTaskDotTone(item){
 const tones=['orange','green','red','blue','yellow','purple'];
 if(tones.includes(item.tone))return item.tone;
 let hash=0;
 for(const char of String(item.id||item.title))hash=(Math.imul(hash,31)+char.charCodeAt(0))>>>0;
 return tones[hash%tones.length];
}
function svSuggestTaskCategory(title){
 const value=String(title||'').toLocaleLowerCase('ru-RU');
 return /(^|[^а-яё])(клиент|заказчик|поставщик|сотрудник|коллега|контрагент|офис|договор|счёт|счет|отчёт|отчет|совещани|проект|работ|начальник|бухгалтер|зарплат|командиров|брифинг|планерк)/u.test(value)?'work':'personal';
}
function svTaskISO(d){
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function svTaskDate(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return null;
 const d=new Date(iso+'T12:00:00');
 return Number.isNaN(d.getTime())?null:d;
}
function svTaskShiftDay(iso,days){
 const d=svTaskDate(iso)||new Date();
 d.setDate(d.getDate()+days);
 return svTaskISO(d);
}
/* Removable visual agenda scenes: no storage writes, notifications or imported contacts. */
const SV_AGENDA_SCENES=Object.freeze([
 {offset:0,time:'12:00',endTime:'13:00',title:'Обед с Анной',tone:'orange'},
 {offset:0,time:'13:30',endTime:'14:00',title:'Обсудить задачи с командой',tone:'blue',subtitle:'Видеозвонок'},
 {offset:0,time:'15:00',title:'Отправить макеты',tone:'blue',entryType:'task'},
 {offset:0,time:'16:30',endTime:'17:30',title:'Встреча по проекту',tone:'yellow',subtitle:'Офис'},
 {offset:1,time:'07:00',endTime:'08:00',title:'Йога',tone:'orange'},
 {offset:1,time:'10:00',endTime:'11:00',title:'Поездка за город',tone:'green'},
 {offset:1,time:'17:30',title:'Забрать заказ',tone:'blue',entryType:'task'},
 {offset:2,time:'09:00',endTime:'11:00',title:'Семейная прогулка',tone:'red'},
 {offset:2,time:'19:00',endTime:'20:30',title:'Ужин с друзьями',tone:'green'}
]);
const svAgendaSceneDone=new Set();
function svAgendaSceneEntries(){
 const today=svTaskISO(new Date());
 return SV_AGENDA_SCENES.map((item,index)=>({
  ...item,id:'scene:'+index,due:svTaskShiftDay(today,item.offset),
  category:'personal',entryType:item.entryType==='task'?'task':'event',sourceStore:'scene',done:svAgendaSceneDone.has(index)
 }));
}
function svTaskPalette(task){return svTaskCategory(task)==='work'?'blue':'neutral';}
/* The day ticker and agenda share one selected date. Scrolling updates the
 * ticker without rebuilding agenda rows and losing scroll position. */
function svAgendaMarkSelected(iso){
 if(!svTaskDate(iso))return;
 svTaskSelectedDate=iso;
 if(!svTaskWindowStart)svTaskWindowStart=iso;
 const nav=document.getElementById('svTasksDateNav');
 const lastVisible=svTaskShiftDay(svTaskWindowStart,4);
 if(iso<svTaskWindowStart||iso>lastVisible)svTaskWindowStart=svTaskShiftDay(iso,-2);
 const firstButton=nav?.querySelector('.sv-agenda-day');
 if(!nav||firstButton?.dataset.day!==svTaskWindowStart||nav.dataset.monthSelected!==iso.slice(0,7)){
  svAgendaRenderNav(svAgendaLastRows);
  return;
 }
 for(const button of nav.querySelectorAll('.sv-agenda-day')){
  const selected=button.dataset.day===iso;
  button.setAttribute('aria-pressed',String(selected));
  if(selected)button.dataset.selected='true';
  else delete button.dataset.selected;
 }
}
function svAgendaScrollToDate(iso){
 const heading=[...list.querySelectorAll('.sv-agenda-section-heading[data-weather-date]')]
  .find(item=>item.dataset.weatherDate===iso);
 if(!heading)return false;
 const target=list.scrollTop+heading.getBoundingClientRect().top-list.getBoundingClientRect().top;
 svAgendaJumpThrough=Date.now()+520;
 list.scrollTo({top:Math.max(0,target),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 window.setTimeout(()=>{svAgendaJumpThrough=0;},540);
 return true;
}
/* Minimize the approved 60px dock only while a touch user reads My Tasks.
 * Material, icons and global navigation are never modified. */
const svAgendaDockMedia=window.matchMedia('(max-width:699px) and (hover:none) and (pointer:coarse)');
let svAgendaDockPreviousY=0,svAgendaDockTravel=0,svAgendaDockDirection=0,svAgendaDockPauseUntil=0;
function svAgendaShowDock(){
 if(document.documentElement.classList.contains('sv-agenda-dock-minimized'))
  document.documentElement.classList.remove('sv-agenda-dock-minimized');
}
function svAgendaPauseDockMotion(){
 svAgendaDockPauseUntil=Date.now()+750;
 svAgendaDockPreviousY=list.scrollTop;
 svAgendaDockTravel=0;
 svAgendaDockDirection=0;
 svAgendaShowDock();
}
function svAgendaSyncDockFromScroll(){
 const root=document.documentElement,y=list.scrollTop;
 const eligible=root.classList.contains('sv-agenda-scroll-active')&&svAgendaDockMedia.matches&&!dialog.open;
 const delta=y-svAgendaDockPreviousY;
 svAgendaDockPreviousY=y;
 if(!eligible||list.scrollHeight-list.clientHeight<60||y<8){
  svAgendaDockTravel=0;svAgendaDockDirection=0;svAgendaShowDock();return;
 }
 if(Date.now()<svAgendaDockPauseUntil||Math.abs(delta)<.7)return;
 const direction=delta>0?1:-1;
 if(direction!==svAgendaDockDirection){svAgendaDockTravel=0;svAgendaDockDirection=direction;}
 svAgendaDockTravel+=Math.abs(delta);
 if(direction>0&&svAgendaDockTravel>=30&&y>35)root.classList.add('sv-agenda-dock-minimized');
 if(direction<0&&svAgendaDockTravel>=12)svAgendaShowDock();
}
function svAgendaJumpToDate(iso){
 svAgendaPauseDockMotion();
 svAgendaMarkSelected(iso);
 if(svAgendaScrollToDate(iso))return;
 // Dates without entries still have a selectable heading.
 render();
 svAgendaScrollToDate(iso);
}
function svAgendaSyncFromScroll(){
 if(Date.now()<svAgendaJumpThrough||document.getElementById('svWorkShell')?.dataset.agendaScroll!=='true')return;
 const scrollRange=list.scrollHeight-list.clientHeight;
 if(scrollRange<35)return; // All days fit on screen: retain the explicitly chosen date.
 const headings=[...list.querySelectorAll('.sv-agenda-section-heading[data-weather-date]')];
 if(!headings.length)return;
 const rect=list.getBoundingClientRect();
 const activationLine=rect.top+Math.min(85,Math.max(42,list.clientHeight*.22));
 let current=headings[0];
 for(const heading of headings){
  if(heading.getBoundingClientRect().top<=activationLine)current=heading;
  else break;
 }
 // On the final screenful, highlight the last visible day even when its
 // heading cannot reach the very top of the list.
 if(scrollRange-list.scrollTop<3){
  const finalLine=rect.top+list.clientHeight*.86;
  for(const heading of headings){
   if(heading.getBoundingClientRect().top<=finalLine)current=heading;
  }
 }
 const iso=current.dataset.weatherDate;
 if(iso&&iso!==svTaskSelectedDate)svAgendaMarkSelected(iso);
}
function svAgendaChangeWeek(step){
 if(!svTaskWindowStart)svTaskWindowStart=svTaskISO(new Date());
 svTaskWindowStart=svTaskShiftDay(svTaskWindowStart,step);
 svAgendaJumpToDate(svTaskWindowStart);
}
function svAgendaRenderNav(rows){
 const panel=list.parentElement;if(!panel)return;
 let nav=panel.querySelector('#svTasksDateNav');
 if(!nav){
  nav=element('nav','sv-agenda-nav');
  nav.id='svTasksDateNav';
  nav.setAttribute('aria-label','Календарь дел');
  list.before(nav);
 }
 if(!svTaskSelectedDate)svTaskSelectedDate=svTaskISO(new Date());
 if(!svTaskWindowStart)svTaskWindowStart=svTaskISO(new Date());
 nav.replaceChildren();
 nav.dataset.monthSelected=svTaskSelectedDate.slice(0,7);
 const picked=svTaskDate(svTaskSelectedDate)||new Date();
 const month=element('button','sv-agenda-month-heading');
 month.type='button';month.setAttribute('aria-label','Вернуться к сегодняшнему дню');
 month.addEventListener('click',()=>{
  svTaskWindowStart=svTaskISO(new Date());
  svAgendaJumpToDate(svTaskWindowStart);
 });
 const monthName=new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(picked);
 const monthLabel=element('strong','sv-agenda-month-name',monthName.charAt(0).toLocaleUpperCase('ru-RU')+monthName.slice(1));
 const year=element('span','sv-agenda-year',String(picked.getFullYear()));
 month.append(monthLabel,year);
 const ticker=element('div','sv-agenda-ticker');
 const back=element('button','sv-agenda-week-step','‹');
 back.type='button';back.setAttribute('aria-label','Предыдущие дни');
 back.addEventListener('click',()=>svAgendaChangeWeek(-1));
 const next=element('button','sv-agenda-week-step','›');
 next.type='button';next.setAttribute('aria-label','Следующие дни');
 next.addEventListener('click',()=>svAgendaChangeWeek(1));
 const strip=element('div','sv-agenda-week');
 strip.setAttribute('role','group');strip.setAttribute('aria-label','Дни недели');
 const track=element('div','sv-agenda-track');
 strip.append(track);
 const first=svTaskDate(svTaskWindowStart);
 const today=svTaskISO(new Date()),byDate=new Map();
 for(const item of rows){
  if(!item.due)continue;
  if(!byDate.has(item.due))byDate.set(item.due,[]);
  byDate.get(item.due).push(item);
 }
 for(let i=0;i<7;i++){
  const day=new Date(first);day.setDate(first.getDate()+i);
  const iso=svTaskISO(day),entries=byDate.get(iso)||[];
  const btn=element('button','sv-agenda-day');
  btn.type='button';btn.dataset.day=iso;btn.dataset.weekday=String(day.getDay());
  btn.setAttribute('aria-pressed',String(iso===svTaskSelectedDate));
  const dayLabel=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(day);
  const workCount=entries.filter(task=>svTaskCategory(task)==='work').length;
  btn.setAttribute('aria-label',dayLabel+(entries.length?', дел: '+entries.length+', рабочих: '+workCount+', личных: '+(entries.length-workCount):', дел нет'));
  if(entries.some(item=>svTaskEntryType(item)==='task'&&!item.done))btn.dataset.hasTasks='true';
  if(iso===today)btn.dataset.today='true';
  if(iso===svTaskSelectedDate)btn.dataset.selected='true';
  const shortDay=new Intl.DateTimeFormat('ru-RU',{weekday:'short'}).format(day).replace('.','');
  btn.append(element('span','sv-agenda-weekday',shortDay),
   element('span','sv-agenda-day-number',String(day.getDate())));
  const marks=element('span','sv-agenda-marks');
  marks.setAttribute('aria-hidden','true');
  // One dot is one real scheduled task; its color identifies the calendar.
  // Limit the tiny preview to five marks while preserving the true count for VoiceOver.
  // Keep an item's calendar-dot color identical to its agenda-row color.
  entries.slice(0,5).forEach(task=>{
   const dot=element('i','sv-agenda-mark');
   dot.dataset.kind=svTaskCategory(task);
   dot.dataset.tone=svTaskDotTone(task);marks.append(dot);
  });
  btn.append(marks);
  btn.addEventListener('click',()=>svAgendaJumpToDate(iso));
  track.append(btn);
 }
 // Five equal day columns form one uninterrupted rail; swipe advances the window.
 // The window advances by one day, preserving today at the left on entry.
 let touchStart=null,ignoreTapUntil=0,gestureActive=false;
 const clearMotion=()=>{
  track.style.transition='transform .16s cubic-bezier(.22,.75,.35,1)';
  track.style.transform='translate3d(0,0,0)';
 };
 strip.addEventListener('touchstart',event=>{
  if(event.touches.length!==1)return;
  const touch=event.touches[0];
  touchStart={x:touch.clientX,y:touch.clientY};
  gestureActive=false;
  track.style.transition='none';
 },{passive:true});
 strip.addEventListener('touchmove',event=>{
  if(!touchStart||event.touches.length!==1)return;
  const touch=event.touches[0],dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;
  if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.3)return;
  gestureActive=true;
  const limit=track.firstElementChild?.getBoundingClientRect().width||strip.clientWidth/5;
  track.style.transform='translate3d('+Math.max(-limit,Math.min(limit,dx))+'px,0,0)';
 },{passive:true});
 strip.addEventListener('touchend',event=>{
  if(!touchStart||!event.changedTouches.length)return;
  const touch=event.changedTouches[0];
  const dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;
  touchStart=null;
  if(!gestureActive||Math.abs(dx)<35||Math.abs(dx)<Math.abs(dy)*1.25){
   clearMotion();gestureActive=false;return;
  }
  if(event.cancelable)event.preventDefault();
  ignoreTapUntil=Date.now()+500;
  const direction=dx<0?1:-1;
  const tile=track.firstElementChild?.getBoundingClientRect().width||strip.clientWidth/5;
  track.style.transition='transform .16s cubic-bezier(.22,.75,.35,1)';
  track.style.transform='translate3d('+(dx<0?-tile:tile)+'px,0,0)';
  setTimeout(()=>svAgendaChangeWeek(direction),160);
  gestureActive=false;
 },{passive:false});
 strip.addEventListener('touchcancel',()=>{
  touchStart=null;gestureActive=false;clearMotion();
 },{passive:true});
 strip.addEventListener('click',event=>{
  if(Date.now()<=ignoreTapUntil){event.preventDefault();event.stopPropagation();}
 },true);
 ticker.append(back,strip,next);
 const handle=element('div','sv-agenda-handle');
 handle.setAttribute('aria-hidden','true');
 nav.append(month,ticker,handle);
 document.dispatchEvent(new CustomEvent('seyveo:agenda-month-changed',{
  detail:{month:monthLabel.textContent,year:year.textContent}
 }));
}
function svAgendaSection(iso,titleOverride){
 const header=element('h3','sv-agenda-section-heading');
 const day=svTaskDate(iso);
 const today=svTaskISO(new Date()),tomorrow=svTaskShiftDay(today,1);
 let caption=titleOverride||'';
 if(!caption){
  caption=iso===today?'Сегодня':iso===tomorrow?'Завтра':
   new Intl.DateTimeFormat('ru-RU',{weekday:'long'}).format(day);
 }
 if(iso===today&&caption.toLocaleLowerCase('ru-RU')==='сегодня')header.dataset.today='true';
 header.append(element('strong','',caption.toLocaleUpperCase('ru-RU')));
 if(day){
  header.dataset.weatherDate=iso;
  header.append(element('span','sv-agenda-section-date',new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'numeric',year:'numeric'}).format(day)));
  const weather=element('span','sv-agenda-weather');
  weather.hidden=true;
  header.append(weather);
 }
 return header;
}
function svAgendaAddRows(items){
 items.sort((a,b)=>(a.time||'00:00').localeCompare(b.time||'00:00')||a.title.localeCompare(b.title,'ru'));
 items.forEach(item=>list.append(row(item)));
}
function svAgendaRenderList(rows){
 const selected=svTaskSelectedDate||svTaskISO(new Date());
 const dated=new Map(),undated=[];
 for(const item of rows){
  if(!item.due){undated.push(item);continue;}
  if(!dated.has(item.due))dated.set(item.due,[]);
  dated.get(item.due).push(item);
 }
 if(!dated.has(selected))dated.set(selected,[]);
 // Chronological sections permit scrolling both backward and forward in time.
 for(const iso of [...dated.keys()].sort()){
  const items=dated.get(iso);
  list.append(svAgendaSection(iso));
  if(items.length)svAgendaAddRows(items);
  else if(iso===selected)list.append(element('p','sv-agenda-empty-day',rows.length?'На этот день дел нет. Ближайшие дела ниже.':'Пока нет дел. Нажми +, чтобы добавить первое.'));
 }
 if(undated.length){
  list.append(svAgendaSection(null,'Без даты'));
  svAgendaAddRows(undated);
 }
}

function row(item,compact=false,deferred=false){
 if(!compact&&item.sourceStore==='scene'){
  const section=element('div','personal-task-row sv-agenda-entry sv-agenda-scene');
  const isTask=svTaskEntryType(item)==='task';
  section.dataset.tone=svTaskDotTone(item);
  section.dataset.entryType=isTask?'task':'event';
  section.dataset.done=String(!!item.done);
  const marker=element(isTask?'button':'span','sv-agenda-scene-dot');
  if(isTask){
   marker.type='button';
   marker.setAttribute('aria-label',(item.done?'Вернуть задачу: ':'Завершить задачу: ')+item.title);
   marker.setAttribute('aria-pressed',String(!!item.done));
   marker.addEventListener('click',()=>{
    const index=Number(item.id.split(':')[1]);
    if(!Number.isInteger(index)||index<0||index>=SV_AGENDA_SCENES.length)return;
    if(svAgendaSceneDone.has(index))svAgendaSceneDone.delete(index);
    else svAgendaSceneDone.add(index);
    render();
   });
  }else marker.setAttribute('aria-hidden','true');
  const copy=element('span','personal-task-content');
  const range=item.time+(item.endTime?' – '+item.endTime:'');
  const name=element('span','personal-task-name',item.title);
  if(item.done)name.classList.add('is-done');
  copy.append(element('span','sv-agenda-entry-time',range),name);
  if(item.subtitle)copy.append(element('small','sv-agenda-scene-note',item.subtitle));
  section.append(marker,copy);
  return section;
 }
 const section=element('div',compact?'personal-brief-row':'personal-task-row');
 section.dataset.taskId=item.id;
 if(item.sourceStore==='calendar')section.dataset.calendarId=item.calendarId;
 if(!compact){section.classList.add('sv-agenda-entry');section.dataset.kind=svTaskCategory(item);section.dataset.entryType=svTaskEntryType(item);
  section.dataset.tone=svTaskDotTone(item);
  if(item.time)section.dataset.scheduled='true';}
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
 if(!compact){
  const timeLabel=deferred?'Отложено':item.time||(!item.due?'Без срока':'Весь день');
  label.append(element('span','sv-agenda-entry-time',timeLabel));
 }
 label.append(name);
 const due=displayDate(item);
 if(compact&&(due||item.done||deferred))label.append(element('small','',item.done?'Завершено':deferred?'Отложено':due));
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
  const detailsButton=element('button','personal-task-menu-details','Подробнее');
  detailsButton.type='button';detailsButton.dataset.taskDetails=item.id;
  detailsButton.setAttribute('aria-expanded','false');
  detailsButton.setAttribute('aria-label','Подробнее о деле: '+item.title);
  const details=element('div','personal-task-detail-data');details.hidden=true;
  const created=Date.parse(item.createdAt||'');
  const creation=Number.isFinite(created)?
   new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(created)):'Неизвестно';
  const scheduled=item.due?(strDate(item.due)+(item.time?' · '+item.time:'')):'Не назначено';
  details.append(
   element('div','personal-task-detail-entry','Создано: '+creation),
   element('div','personal-task-detail-entry',(svTaskEntryType(item)==='event'?'Когда: ':'Выполнить: ')+scheduled),
   element('div','personal-task-detail-entry','Тип: '+(svTaskEntryType(item)==='event'?'Событие':'Задача'))
  );
  menu.append(detailsButton,details);
  const editButton=element('button','personal-task-menu-details','Изменить');
  editButton.type='button';
  if(item.sourceStore==='calendar')editButton.dataset.calendarOpen=item.calendarId;
  else editButton.dataset.taskEdit=item.id;
  menu.prepend(editButton);
  const remove=element('button','personal-task-menu-delete','Удалить дело');
  remove.type='button';remove.dataset.taskDelete=item.id;
  remove.setAttribute('aria-label','Удалить дело: '+item.title);
  if(item.sourceStore!=='calendar')menu.append(remove);
  if(deferred){
   const resume=element('button','personal-task-menu-delete','Вернуть на Главную');
   resume.type='button';resume.dataset.taskResume=item.id;
   menu.prepend(resume);
  }
  const sayvi=element('button','personal-task-sayvi','Сэйви');
  sayvi.type='button';sayvi.dataset.taskSayvi=item.id;
  sayvi.setAttribute('aria-label','Обсудить с Сэйви дело: '+item.title);
  section.append(art,label,sayvi,checkbox,menu);
 }else section.append(label);
 return section;
}
/* All saved tasks and postponed Home previews appear inside this ONE list.
   The previews are read-only training data, never written to personal-tasks-v1. */
function deferredPreviewRow(item){
 const section=element('div','personal-task-row personal-deferred-row');
 section.dataset.deferredKind=item.kind;
 const art=element('span','personal-task-art');art.append(taskIcon(item.kind==='mail'?'mail':'note'));
 art.setAttribute('aria-hidden','true');
 const copy=element('span','personal-task-content');
 const header=element('button','personal-deferred-toggle',item.title);
 header.type='button';header.dataset.deferredExpand=item.kind;
 header.setAttribute('aria-expanded','false');
 const detailsId='sv-deferred-details-'+(item.kind==='mail'?'mail':'contract');
 header.setAttribute('aria-controls',detailsId);
 const compact=element('small','personal-deferred-kind',item.kind==='mail'?'Письмо · отложено':'Документ · отложено');
 copy.append(header,compact);
 const sayvi=element('button','personal-task-sayvi','Сэйви');
 sayvi.type='button';sayvi.dataset.deferredSayvi=item.kind;
 sayvi.setAttribute('aria-label','Обсудить с Сэйви: '+item.title);
 const details=element('div','personal-deferred-details');details.id=detailsId;details.hidden=true;
 const note=element('p','personal-deferred-note',item.note);
 const actions=element('div','personal-deferred-actions');
 const open=element('button','','Подробнее');
 open.type='button';open.dataset.deferredOpen=item.kind;
 open.setAttribute('aria-label','Открыть источник: '+item.title);
 const restore=element('button','','Вернуть на Главную');
 restore.type='button';restore.dataset.deferredRestore=item.kind;
 restore.setAttribute('aria-label','Вернуть карточку на Главную: '+item.title);
 actions.append(open,restore);details.append(note,actions);
 section.append(art,copy,sayvi,details);
 return section;
}
function render(){
 clearTaskError();
 const all=read(),open=all.filter(item=>!item.done)
 .sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31')||a.createdAt.localeCompare(b.createdAt));
 const done=all.filter(item=>item.done).reverse();
 const living=window.SEYVEO_LIVING_MOMENT;
 const deferredIds=new Set(living?.deferredTaskIds?.()||[]);
 const preview=Array.isArray(living?.deferred?.())?living.deferred():[];
 const postponed=open.filter(item=>deferredIds.has(item.id));
 const active=open.filter(item=>!deferredIds.has(item.id));
 const visibleActive=[...active,...svCalendarAgendaEvents(),...svAgendaSceneEntries()].sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31')||(a.time||'').localeCompare(b.time||''));
 renderContext(active);
 const hasDeferred=postponed.length>0||preview.length>0;
 const wasRendered=!!list.querySelector('.sv-agenda-section-heading');
 const previousScroll=list.scrollTop;
 svAgendaLastRows=visibleActive;
 svAgendaRenderNav(visibleActive);
 list.replaceChildren();
 svAgendaRenderList(visibleActive);
 if(wasRendered)list.scrollTop=previousScroll;
 if(hasDeferred){
  list.append(svAgendaSection(null,'Отложено'));
  postponed.forEach(task=>list.append(row(task,false,true)));
  preview.forEach(item=>list.append(deferredPreviewRow(item)));
 }
 list.classList.remove('is-empty');
 const overview=$('tasksOverview');
 if(overview){
  const count=postponed.length+preview.length;
  const countLabel=(n,one,few,many)=>{
   const rem10=n%10,rem100=n%100;
   return n+' '+(rem10===1&&rem100!==11?one:
    rem10>=2&&rem10<=4&&(rem100<12||rem100>14)?few:many);
  };
  const current=active.length?countLabel(active.length,'дело','дела','дел'):'';
  const deferred=count?countLabel(count,'отложенное дело','отложенных дела','отложенных дел'):'';
  overview.textContent=[current,deferred].filter(Boolean).join(' · ')
   ||(done.length?'Все текущие дела выполнены':'Пока нет текущих дел');
 }
 // A continuation is offered only after a real task has been completed.
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
 $('personalBrief').hidden=open.length===0;
 window.dispatchEvent(new CustomEvent('seyveo:tasks-changed',{detail:{open:open.length,total:all.length}}));
 document.dispatchEvent(new Event('seyveo:agenda-rendered'));
}
window.addEventListener('seyveo:home-deferred-changed',render);
function syncDueDateDisplay(){
 const display=$('personalTaskDueDisplay'),control=date.closest('.personal-task-date-control');
 if(!display||!control)return;
 const value=date.value;
 let label='Не выбрана';
 if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
  const [year,month,day]=value.split('-').map(Number);
  const parsed=new Date(year,month-1,day);
  if(parsed.getFullYear()===year&&parsed.getMonth()===month-1&&parsed.getDate()===day)
   label=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(parsed);
 }
 display.textContent=label;
 control.dataset.filled=String(label!=='Не выбрана');
}
for(const eventName of ['input','change','blur'])date.addEventListener(eventName,syncDueDateDisplay);
/* Save becomes available only when a title exists. Keep the same visual
   button geometry and the original submit validation/persistence path. */
const taskSaveButton=$('personalTaskSave');
function syncTaskSaveState(){
 if(!taskSaveButton)return;
 const filled=Boolean(input.value.trim());
 taskSaveButton.disabled=!filled;
 taskSaveButton.setAttribute('aria-disabled',String(!filled));
 taskSaveButton.title=filled?(editingTaskId?'Сохранить изменения':'Сохранить дело'):'Сначала напишите название дела';
}
let svTaskCategoryTouched=false,svTaskTypeTouched=false;
form.querySelectorAll('input[name="personalTaskType"]').forEach(choice=>choice.addEventListener('change',()=>{svTaskTypeTouched=true;}));
form.querySelectorAll('input[name="personalTaskCategory"]').forEach(choice=>choice.addEventListener('change',()=>{svTaskCategoryTouched=true;}));
input.addEventListener('input',()=>{
 syncTaskSaveState();
 if(editingTaskId)return;
 if(!svTaskCategoryTouched){
  const category=svSuggestTaskCategory(input.value);
  const choice=form.querySelector('input[name="personalTaskCategory"][value="'+category+'"]');
  if(choice)choice.checked=true;
 }
 if(!svTaskTypeTouched){
  const type=form.querySelector('input[name="personalTaskType"][value="'+svInferEntryType(input.value)+'"]');
  if(type)type.checked=true;
 }
});
function openDialog(){
 pendingSourceNoteId='';editingTaskId='';taskEditorSavedOnExit=false;svTaskCategoryTouched=false;svTaskTypeTouched=false;
 $('personalTaskDialogTitle').textContent='Новое дело';
 $('personalTaskSave').setAttribute('aria-label','Сохранить дело');$('personalTaskSave').title='Сохранить дело';
 form.reset();
 const newCategory=form.querySelector('input[name="personalTaskCategory"][value="personal"]');
 if(newCategory)newCategory.checked=true;
 if(!$('tasksPage')?.hidden&&svTaskSelectedDate)date.value=svTaskSelectedDate;
 dialog.dispatchEvent(new Event('sv-task-time-sync'));syncDueDateDisplay();syncTaskSaveState();$('personalTaskStatus').textContent='';
 if(!dialog.open)dialog.showModal();
 window.requestAnimationFrame(syncDueDateDisplay);
 /* Do not auto-focus: mobile keyboard viewport pan moved the Task header. */
}
function put(e){
 e.preventDefault();
 const title=input.value.trim().replace(/\s+/g,' ');
 if(!title){$('personalTaskStatus').textContent='Напишите, что нужно сделать.';input.focus();return}
 if(editingTaskId){
  const all=read(),record=all.find(task=>task.id===editingTaskId&&!task.done);
  if(!record){$('personalTaskStatus').textContent='Дело изменилось или уже выполнено. Откройте список заново.';return}
  record.title=title.slice(0,140);record.due=date.value;record.time=date.value?($('personalTaskTime')?.value||''):'';
  record.category=form.querySelector('input[name="personalTaskCategory"]:checked')?.value==='work'?'work':'personal';
  record.entryType=form.querySelector('input[name="personalTaskType"]:checked')?.value==='event'?'event':'task';
  if(!save(all)){$('personalTaskStatus').textContent='Не удалось сохранить изменения.';return}
  editingTaskId='';taskEditorSavedOnExit=true;if(dialog.open)dialog.close();render();
  window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
  return;
 }
 const all=read();
 if(all.length>=MAX){$('personalTaskStatus').textContent='Достигнут предел записей. Удалите ненужные завершённые дела.';return}
 const next=[...all,{id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),title:title.slice(0,140),due:date.value,time:date.value?($('personalTaskTime')?.value||''):'',
 category:form.querySelector('input[name="personalTaskCategory"]:checked')?.value==='work'?'work':'personal',
 entryType:form.querySelector('input[name="personalTaskType"]:checked')?.value==='event'?'event':'task',
 done:false,createdAt:new Date().toISOString(),doneAt:'',
 ...(pendingSourceNoteId?{sourceNoteId:pendingSourceNoteId}:{})}];
 if(!save(next)){$('personalTaskStatus').textContent='Не удалось сохранить. Проверьте память браузера.';return}
 pendingSourceNoteId='';justCompletedTaskId='';
 taskEditorSavedOnExit=true;if(dialog.open)dialog.close();render();
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
}
/* Back, backdrop, Escape and navigation all commit the same task once. */
function exitTaskEditor(){
 if(!dialog.open)return;
 if(dialog.classList.contains('sv-task-date-open')){
  dialog.dispatchEvent(new Event('seyveo:task-date-back'));return;
 }
 if(!input.value.trim()){dialog.close();return;}
 put({preventDefault(){}});
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
 window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
}
/* Completed personal tasks remain in the original local store for History. */
window.SEYVEO_PERSONAL_TASK_HISTORY=Object.freeze({
 completed:()=>read().filter(item=>item.done).sort((a,b)=>(b.doneAt||b.createdAt).localeCompare(a.doneAt||a.createdAt)),
 removeCompleted:id=>{
  const all=read(),item=all.find(task=>task.id===id&&task.done);
  if(!item)return false;
  if(!save(all.filter(task=>task.id!==id)))return false;
  render();window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
  return true;
 },
 clearCompleted:()=>{
  const all=read();
  if(!save(all.filter(task=>!task.done)))return false;
  render();window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
  return true;
 },
 restore:id=>{
  const all=read(),task=all.find(item=>item.id===id&&item.done);
  if(!task)return false;
  task.done=false;task.doneAt='';
  if(!save(all))return false;
  justCompletedTaskId='';render();
  window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
  window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
  return true;
 }
});
/* Shared Tasks toolbar: selection deletes from the SAME validated local
   store. No duplicate history database or unconfirmed automatic removals. */
window.SEYVEO_PERSONAL_TASK_TOOLS=Object.freeze({
 list:()=>read().map(item=>({id:item.id,title:item.title,due:item.due,done:item.done,
  createdAt:item.createdAt,doneAt:item.doneAt})),
 removeMany:ids=>{
  if(!Array.isArray(ids)||!ids.length||ids.length>MAX)return false;
  const chosen=new Set(ids.filter(id=>typeof id==='string'));
  const all=read(),remaining=all.filter(task=>!chosen.has(task.id));
  if(remaining.length===all.length)return false;
  if(!save(remaining))return false;
  justCompletedTaskId='';render();
  window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
  window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
  return true;
 }
});
/* Task edits from the Center of Decisions use the existing local editor.
   This is not a second store; edits require explicit confirmation. */
window.addEventListener('seyveo:home-task-edit',event=>{
 const detail=event.detail;
 const id=detail?.id;
 const task=typeof id==='string'?read().find(item=>item.id===id&&!item.done):null;
 if(!task){
  if(detail)detail.result={status:'unavailable',message:'Дело уже изменилось или выполнено.'};
  return;
 }
 openDialog();
 editingTaskId=id;
 $('personalTaskDialogTitle').textContent='Изменить дело';
 $('personalTaskSave').setAttribute('aria-label','Сохранить изменения');$('personalTaskSave').title='Сохранить изменения';
 input.value=task.title;syncTaskSaveState();
 const categoryChoice=form.querySelector('input[name="personalTaskCategory"][value="'+svTaskCategory(task)+'"]');
 if(categoryChoice)categoryChoice.checked=true;
 const typeChoice=form.querySelector('input[name="personalTaskType"][value="'+svTaskEntryType(task)+'"]');
 if(typeChoice)typeChoice.checked=true;
 date.value=task.due;
 if($('personalTaskTime'))$('personalTaskTime').value=task.time||'';
 dialog.dispatchEvent(new Event('sv-task-time-sync'));
 syncDueDateDisplay();
 $('personalTaskStatus').textContent='Изменения сохраняются только после вашего подтверждения.';
 /* Do not auto-focus: mobile keyboard viewport pan moved the Task header. */
 if(detail)detail.result={status:'opened'};
});
/* Home collections do not own a second database. Completing a saved task
   goes through the SAME validated Personal Tasks writer and renderer. */
window.addEventListener('seyveo:home-task-complete',event=>{
 const detail=event.detail;
 const id=detail?.id;
 if(typeof id!=='string'||!id||id.length>160){
  if(detail)detail.result={ok:false,message:'Не удалось определить дело.'};
  return;
 }
 const task=read().find(item=>item.id===id&&!item.done);
 if(!task){
  if(detail)detail.result={ok:false,message:'Дело уже завершено или изменено.'};
  return;
 }
 change(id);
 const completed=read().some(item=>item.id===id&&item.done);
 if(detail)detail.result=completed?{ok:true,message:'Дело отмечено выполненным.'}:
   {ok:false,message:'Не удалось сохранить. Проверьте память устройства.'};
});
/* Home Center of Decisions opens the exact saved task, not just the
   generic Tasks screen. Navigation remains routed through existing #tasks. */
window.addEventListener('seyveo:home-task-open',event=>{
 const id=event.detail?.id;
 if(typeof id!=='string'||!id)return;
 const task=read().find(item=>item.id===id&&!item.done);
 if(!task)return;
 if(location.hash!=='#tasks')location.hash='#tasks';
 const showTarget=()=>{
  if($('tasksPage')?.hidden)return;
  const item=[...list.querySelectorAll('.personal-task-row[data-task-id]')]
   .find(row=>row.dataset.taskId===id);
  if(!item)return;
  item.scrollIntoView({block:'center',behavior:'auto'});
  item.querySelector('[data-task-menu]')?.focus({preventScroll:true});
 };
 window.requestAnimationFrame(()=>window.setTimeout(showTarget,100));
});
form.addEventListener('submit',put);
$('personalAddHome').addEventListener('click',openDialog);
$('personalAddTasks').addEventListener('click',openDialog);
$('personalTaskCancel').addEventListener('click',exitTaskEditor);
list.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn)return;
 if(btn.dataset.deferredSayvi){
  const kind=btn.dataset.deferredSayvi;
  const item=(window.SEYVEO_LIVING_MOMENT?.deferred?.()||[]).find(entry=>entry.kind===kind);
  if(item)askSayviForTask({title:item.title,kind:kind==='mail'?'mail':'contract',note:item.note});
 }
 else if(btn.dataset.calendarOpen){
  const event=svCalendarAgendaEvents().find(item=>item.calendarId===btn.dataset.calendarOpen);
  if(!event)return;
  location.hash='#calendar';
  window.dispatchEvent(new CustomEvent('seyveo:calendar-open-entry',{detail:{id:event.calendarId}}));
 }
 else if(btn.dataset.taskEdit){
  window.dispatchEvent(new CustomEvent('seyveo:home-task-edit',{detail:{id:btn.dataset.taskEdit}}));
 }
 else if(btn.dataset.taskSayvi){
  const task=read().find(entry=>entry.id===btn.dataset.taskSayvi);
  if(task)askSayviForTask({title:task.title,kind:'task',due:task.due,
   note:[task.done?'Дело уже отмечено выполненным. Помоги проверить результат или следующий шаг.':'',
    task.sourceNoteId?'Дело создано из Блокнота. Для анализа исходного текста откройте запись.':''].filter(Boolean).join(' ')});
 }
 else if(btn.dataset.deferredExpand){
  const toggle=btn,detail=toggle.closest('.personal-deferred-row')?.querySelector('.personal-deferred-details');
  if(detail){
   const expanded=toggle.getAttribute('aria-expanded')==='true';
   list.querySelectorAll('.personal-deferred-details').forEach(node=>node.hidden=true);
   list.querySelectorAll('[data-deferred-expand]').forEach(node=>node.setAttribute('aria-expanded','false'));
   detail.hidden=expanded;toggle.setAttribute('aria-expanded',String(!expanded));
  }
 }
 else if(btn.dataset.deferredOpen){
  const kind=btn.dataset.deferredOpen==='mail'?'mail':'contract';
  const api=window.SEYVEO_SAYVI_SURFACES;
  if(api?.open)api.open(kind);
  else location.hash=kind==='mail'?'#sayvi-mail':'#sayvi-documents';
 }
 else if(btn.dataset.deferredRestore){
  window.SEYVEO_LIVING_MOMENT?.restoreDeferred?.(btn.dataset.deferredRestore);
 }
 else if(btn.dataset.taskResume){
  window.SEYVEO_LIVING_MOMENT?.restoreTask?.(btn.dataset.taskResume);
 }
 else if(btn.dataset.taskToggle)change(btn.dataset.taskToggle);
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
 else if(btn.dataset.taskDetails){
  const menu=btn.closest('.personal-task-menu');
  const details=menu?.querySelector('.personal-task-detail-data');
  if(details){
   details.hidden=!details.hidden;
   btn.setAttribute('aria-expanded',String(!details.hidden));
  }
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
  input.value=suggestion.title;syncTaskSaveState();
  pendingSourceNoteId=suggestion.sourceNoteId;
  date.value='';syncDueDateDisplay();
  $('personalTaskStatus').textContent='Из исходной заметки. Проверьте текст и укажите срок, если он нужен. Сохранение — только по вашему решению.';
  /* Do not auto-focus: mobile keyboard viewport pan moved the Task header. */
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
dialog.addEventListener('click',event=>{
 if(event.target===dialog)exitTaskEditor();
});
dialog.addEventListener('cancel',event=>{
 event.preventDefault();exitTaskEditor();
});
dialog.addEventListener('close',()=>{
 // Another module can close the dialog directly. Preserve a valid edit.
 if(!taskEditorSavedOnExit&&input.value.trim())put({preventDefault(){}});
});
window.addEventListener('hashchange',()=>{if(dialog.open)exitTaskEditor();});
window.addEventListener('pagehide',()=>{
 if(dialog.open&&!taskEditorSavedOnExit&&input.value.trim())put({preventDefault(){}});
});
/* Prepared from a Notebook note; the existing task form is the only
   writer and still requires the person's explicit Save action. */
window.addEventListener('seyveo:task-plan-note',event=>{
 const draft=event.detail||{};
 const title=typeof draft.title==='string'?draft.title.trim().replace(/\s+/g,' ').slice(0,140):'';
 if(!title)return;
 openDialog();
 input.value=title;syncTaskSaveState();
 const suggested=form.querySelector('input[name="personalTaskCategory"][value="'+svSuggestTaskCategory(title)+'"]');
 if(suggested)suggested.checked=true;
 const suggestedType=form.querySelector('input[name="personalTaskType"][value="'+svInferEntryType(title)+'"]');
 if(suggestedType)suggestedType.checked=true;
 pendingSourceNoteId=safeNoteId(draft.sourceNoteId);
 const requested=typeof draft.date==='string'?draft.date:'';
 if(strDate(requested))date.value=requested;
 syncDueDateDisplay();
 $('personalTaskStatus').textContent='SEYVEO заметил возможное дело в заметке. Проверьте название и срок, затем сохраните.';
 /* Do not auto-focus: mobile keyboard viewport pan moved the Task header. */
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
  item.title.replace(/\s+/g,' ').trim().toLocaleLowerCase('ru-RU')+'|'+item.due+'|'+(item.time||'')));
 const pending=[];
 let duplicates=0;
 for(const draft of detail.items){
  if(!draft||typeof draft.title!=='string'||typeof draft.due!=='string'){
   detail.result={status:'invalid',message:'Проверьте текст дел и сроки.'};return;
  }
  const title=draft.title.trim().replace(/\s+/g,' ').slice(0,140);
  const due=draft.due,time=typeof draft.time==='string'?draft.time:'';
  if(!title||(due&&!strDate(due))||(time&&(!due||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))){
   detail.result={status:'invalid',message:'Проверьте текст дел и даты.'};return;
  }
  const key=title.toLocaleLowerCase('ru-RU')+'|'+due+'|'+time;
  if(seen.has(key)){duplicates++;continue}
  seen.add(key);pending.push({title,due,time});
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
  title:draft.title,due:draft.due,time:draft.time||'',category:svSuggestTaskCategory(draft.title),entryType:svInferEntryType(draft.title),done:false,createdAt,doneAt:'',
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
window.addEventListener('storage',event=>{if(event.key===KEY||event.key===CAL_EVENTS_KEY){justCompletedTaskId='';render()}});
window.addEventListener('seyveo:calendar-changed',()=>{if(!$('tasksPage')?.hidden)render()});
window.addEventListener('hashchange',()=>{if(!$('tasksPage')?.hidden)render()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
list.addEventListener('scroll',()=>{
 svAgendaSyncDockFromScroll();
 if(svAgendaScrollFrame)return;
 svAgendaScrollFrame=requestAnimationFrame(()=>{
  svAgendaScrollFrame=0;
  svAgendaSyncFromScroll();
 });
},{passive:true});
document.addEventListener('pointerdown',event=>{
 if(event.target.closest?.('#svTasksDateNav'))svAgendaPauseDockMotion();
},{passive:true,capture:true});
dialog.addEventListener('close',svAgendaPauseDockMotion);
new MutationObserver(()=>{
 if(!document.documentElement.classList.contains('sv-agenda-scroll-active')&&
    document.documentElement.classList.contains('sv-agenda-dock-minimized'))svAgendaPauseDockMotion();
}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
if(svAgendaDockMedia.addEventListener)svAgendaDockMedia.addEventListener('change',svAgendaPauseDockMotion);
render();
})();