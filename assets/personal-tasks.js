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
function creatorOf(item){
 return item?.createdBy==='sayvi'||item?.source==='sayvi'?'sayvi':item?.createdBy==='user'?'user':'';
}
function creatorName(item){return creatorOf(item)==='sayvi'?'Сэйви':creatorOf(item)==='user'?'Вы':'Не указан';}
function showCreator(item){
 const label=$('svTaskCreatedBy');if(!label)return;
 label.hidden=!item;
 label.textContent=item?'Кто создал: '+creatorName(item):'';
}
function safeParse(raw){try{const v=JSON.parse(raw||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function read(){
 let raw=null;try{raw=localStorage.getItem(KEY)}catch{}
 return safeParse(raw).filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string')
 .slice(-MAX).map(item=>({id:item.id,title:item.title.trim().slice(0,140),
 due:/^\d{4}-\d{2}-\d{2}$/.test(item.due)?item.due:'',time:/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)?item.time:'',done:item.done===true,
 createdAt:typeof item.createdAt==='string'?item.createdAt:'',doneAt:typeof item.doneAt==='string'?item.doneAt:'',
 createdBy:creatorOf(item),
 ...(safeNoteId(item.sourceNoteId)?{sourceNoteId:item.sourceNoteId}:{}),
 ...(typeof item.source==='string'&&['sayvi','work','notebook'].includes(item.source)?{source:item.source}:{}),
 category:item.category==='work'||item.category==='personal'?item.category:(item.source==='work'?'work':'personal'),
 entryType:item.entryType==='event'||item.entryType==='task'?item.entryType:svInferEntryType(item.title),
 tone:['orange','green','red','blue','yellow','purple'].includes(item.tone)?item.tone:'',
 notes:typeof item.notes==='string'?item.notes.slice(0,1000):'',
 url:typeof item.url==='string'?item.url.slice(0,500):'',
 attachment:item.attachment&&typeof item.attachment.name==='string'&&Number.isFinite(item.attachment.size)&&item.attachment.size>0&&item.attachment.size<=10*1024*1024?
  {name:item.attachment.name.slice(0,130),type:String(item.attachment.type||'').slice(0,110),size:item.attachment.size}:null,
 place:window.SEYVEO_TASK_PLACES?.cleanPlace?.(item.place)||null,
 travel:window.SEYVEO_TASK_TRAVEL_CORE?.clean?.(item.travel)||null,
 remindBefore:[15,30,60].includes(item.remindBefore)?item.remindBefore:0,
 showOnHome:item.showOnHome!==false,
 repeat:['none','daily','weekly','monthly'].includes(item.repeat)?item.repeat:'none',
 priority:['none','low','medium','high'].includes(item.priority)?item.priority:'none'}));
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
  createdAt:typeof item.createdAt==='string'?item.createdAt:'',createdBy:creatorOf(item)
 })).filter(item=>item.title);
}
function save(items){
 try{localStorage.setItem(KEY,JSON.stringify(items.slice(-MAX)));return true}
 catch{return false}
}
// Reuse locale formatters: the 105-day strip must not allocate 210 Intl
// instances on each build. Formatting and accessible labels remain identical.
const svDateFormatters=new Map();
function svDateFormatter(options){
 const key=JSON.stringify(options);
 let formatter=svDateFormatters.get(key);
 if(!formatter){formatter=new Intl.DateTimeFormat('ru-RU',options);svDateFormatters.set(key,formatter);}
 return formatter;
}
function strDate(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
 const [y,m,d]=iso.split('-').map(Number);
 const x=new Date(y,m-1,d);
 if(x.getFullYear()!==y||x.getMonth()+1!==m||x.getDate()!==d)return '';
 return svDateFormatter({day:'numeric',month:'short'}).format(x);
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
  if(window.SEYVEO_AVATAR_COLORS)avatar.style.setProperty('--sv-avatar-auto-bg',window.SEYVEO_AVATAR_COLORS.tint(avatar.textContent));
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
let svAgendaAnchorCache=null,svAgendaInitiallyAligned=false;
const SV_AGENDA_IDLE_TODAY_MS=12000;
let svAgendaTodayTimer=0,svAgendaRouletteFrame=0,svAgendaRouletteToken=0;
let svAgendaRolling=false,svAgendaIgnoreStripScrollUntil=0;
let svAgendaPointerHeld=false,svAgendaUserInteracted=false;
let svAgendaWasOpen=false,svAgendaOpeningUntil=0,svAgendaExplicitFocus=false;
let svAgendaRouletteOverlay=null;
function svAgendaCanReturnToday(){
 return !document.hidden&&!dialog.open&&!svAgendaPointerHeld&&
  document.documentElement.classList.contains('sv-agenda-scroll-active')&&
  list.clientWidth>0&&list.clientHeight>0&&
  !document.activeElement?.matches?.('input, textarea, [contenteditable="true"]');
}
function svAgendaStopRoulette(){
 ++svAgendaRouletteToken;
 if(svAgendaRouletteFrame)cancelAnimationFrame(svAgendaRouletteFrame);
 svAgendaRouletteFrame=0;svAgendaRolling=false;
 const strip=document.querySelector('#svTasksDateNav .sv-agenda-week');
 strip?.style.removeProperty('scroll-snap-type');
 svAgendaRouletteOverlay?.remove();svAgendaRouletteOverlay=null;
}
function svAgendaQueueToday(){
 clearTimeout(svAgendaTodayTimer);
 // Never start the date-wheel because layout or scroll restoration changed
 // the selection during launch. The idle return belongs to a human gesture.
 if(!svAgendaUserInteracted||!svAgendaCanReturnToday()||svAgendaRolling||svTaskSelectedDate===svTaskISO(new Date()))return;
 svAgendaTodayTimer=setTimeout(()=>{
  if(svAgendaCanReturnToday())svAgendaReturnToday();
 },SV_AGENDA_IDLE_TODAY_MS);
}
/* A long trip can put today outside the 105-day rail. In that case spin a
   temporary, purely visual rail through representative dates, retaining the
   exact beginning and end columns. No task data or navigation is changed. */
function svAgendaDistantTodayRail(strip,track,today,width){
 const current=track.children[Math.min(track.children.length-1,
  Math.max(0,Math.round(strip.scrollLeft/width)))]?.dataset.day;
 if(!svTaskDate(current))return null;
 const serial=iso=>{const [y,m,d]=iso.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;};
 const offset=serial(today)-serial(current);
 if(!offset)return null;
 const earliest=offset>0?current:today;
 const latest=offset>0?today:current;
 const span=Math.abs(offset);
 const dates=new Set();
 for(let n=0;n<=6;n++)dates.add(svTaskShiftDay(earliest,n));
 for(let n=1;n<=18;n++)dates.add(svTaskShiftDay(earliest,
  Math.round(6+(span-6)*n/19)));
 for(let n=0;n<=6;n++)dates.add(svTaskShiftDay(latest,n));
 const ordered=[...dates].sort();
 const ticker=strip.parentElement;
 if(!ticker)return null;
 const overlay=element('div','sv-agenda-week sv-agenda-roulette-week');
 overlay.setAttribute('aria-hidden','true');
 overlay.style.cssText='position:absolute;inset:0;z-index:4;overflow:hidden!important;'+
  'pointer-events:none;scroll-snap-type:none!important;touch-action:none!important;'+
  'background:'+(document.documentElement.dataset.theme==='dark'?'#25282F':'#FFFFFF');
 const fakeTrack=element('div','sv-agenda-track');
 const byDate=new Map();
 for(const item of svAgendaLastRows){
  if(!item.due)continue;
  if(!byDate.has(item.due))byDate.set(item.due,[]);
  byDate.get(item.due).push(item);
 }
 for(const iso of ordered){
  const date=svTaskDate(iso),items=byDate.get(iso)||[];
  const day=element('div','sv-agenda-day');
  day.dataset.day=iso;day.dataset.weekday=String(date.getDay());
  if(iso===today)day.dataset.today='true';
  if(iso===svTaskSelectedDate)day.dataset.selected='true';
  const weekday=svDateFormatter({weekday:'short'}).format(date).replace('.','');
  day.append(element('span','sv-agenda-weekday',weekday),
   element('span','sv-agenda-day-number',String(date.getDate())));
  const marks=element('span','sv-agenda-marks');
  if(items.some(item=>svTaskEntryType(item)==='task'&&!item.done))day.dataset.hasTasks='true';
  items.slice(0,5).forEach(item=>{
   const dot=element('i','sv-agenda-mark');
   dot.dataset.kind=svTaskCategory(item);dot.dataset.tone=svTaskDotTone(item);
   marks.append(dot);
  });
  day.append(marks);fakeTrack.append(day);
 }
 overlay.append(fakeTrack);ticker.append(overlay);
 // The first painted frame must show the dates the visitor was looking at.
 const beginning=ordered.indexOf(current)*width;
 const ending=ordered.indexOf(today)*width;
 overlay.scrollLeft=beginning;
 svAgendaRouletteOverlay=overlay;
 return {surface:overlay,start:beginning,target:ending};
}
/* A gentle date-wheel return. Only the horizontal rail is animated;
   the content changes once it has settled on the current day. */
function svAgendaReturnToday(){
 clearTimeout(svAgendaTodayTimer);
 if(!svAgendaCanReturnToday())return;
 const today=svTaskISO(new Date());
 const strip=document.querySelector('#svTasksDateNav .sv-agenda-week');
 const track=strip?.querySelector('.sv-agenda-track');
 const day=track?.querySelector('.sv-agenda-day[data-day="'+today+'"]');
 const width=track?.firstElementChild?.getBoundingClientRect().width||0;
 if(!strip||!width){
  svTaskWindowStart=today;
  svAgendaJumpToDate(today);
  return;
 }
 svAgendaStopRoulette();
 const journey=day?{
  surface:strip,start:strip.scrollLeft,target:[...track.children].indexOf(day)*width
 }:svAgendaDistantTodayRail(strip,track,today,width);
 if(!journey){svTaskWindowStart=today;svAgendaJumpToDate(today);return;}
 const {surface,start,target}=journey,distance=target-start;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced||Math.abs(distance)<1){
  svAgendaIgnoreStripScrollUntil=Date.now()+450;
  surface.scrollLeft=target;
  svAgendaStopRoulette();
  svTaskWindowStart=today;
  svAgendaJumpToDate(today);
  return;
 }
 const token=svAgendaRouletteToken;
 svAgendaRolling=true;
 if(surface===strip)strip.style.setProperty('scroll-snap-type','none','important');
 const duration=Math.min(1550,Math.max(850,850+Math.abs(distance)/width*22));
 const started=performance.now();
 const advance=now=>{
  if(token!==svAgendaRouletteToken||!svAgendaCanReturnToday()){
   svAgendaStopRoulette();svAgendaQueueToday();return;
  }
  const progress=Math.min(1,(now-started)/duration);
  const eased=progress<.5?4*progress*progress*progress:
   1-Math.pow(-2*progress+2,3)/2;
  surface.scrollLeft=start+distance*eased;
  if(progress<1){svAgendaRouletteFrame=requestAnimationFrame(advance);return;}
  surface.scrollLeft=target;
  svAgendaIgnoreStripScrollUntil=Date.now()+450;
  svAgendaStopRoulette();
  svTaskWindowStart=today;
  svAgendaJumpToDate(today);
 };
 svAgendaRouletteFrame=requestAnimationFrame(advance);
}
const svTaskCategory=item=>item.category==='work'||item.category==='personal'?item.category:(item.source==='work'?'work':'personal');
/* All categories are always visible; colors distinguish them without screen filters. */
const svTaskMatchesCategory=()=>true;
/* Conservative offline suggestion; the person can always change the category. */
/* Calendar events happen; tasks can be checked off. Preserve explicit choices. */
function svInferEntryType(title){
 const value=String(title||'').toLocaleLowerCase('ru-RU');
 if(/(^|[^а-яё])(напомни|напоминан|купить|подготовить|отправить|оплатить|сделать|проверить|забрать|заказать|позвонить|написать|выслать|убрать|помыть|сдать|завершить|задач)/u.test(value))return 'task';
 if(/(^|[^а-яё])(встреч|встрет|поездк|созвон|совещан|конференц|тренировк|заняти|урок|приём|прием|праздник|день рождени|обед|ужин|концерт|путешеств|мероприят)/u.test(value))return 'event';
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
 // Explicit intent takes priority over keywords in the remaining phrase.
 if(/^(?:личное|личный|для себя|по личным делам|домашнее)(?=$|[^а-яё])/u.test(value))return 'personal';
 if(/^(?:рабочее|рабочий|рабочая|по работе|для работы|бизнес)(?=$|[^а-яё])/u.test(value))return 'work';
 return /(^|[^а-яё])(клиент|заказчик|поставщик|сотрудник|коллега|контрагент|офис|договор|счёт|счет|отчёт|отчет|совещани|проект|работ|рабоч|бизнес|делов|начальник|бухгалтер|зарплат|командиров|брифинг|планерк)/u.test(value)?'work':'personal';
}
window.SEYVEO_TASK_CLASSIFY=Object.freeze({type:svInferEntryType,category:svSuggestTaskCategory});
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
const SV_AGENDA_SCENES=Object.freeze([]); // No synthetic calendar entries.
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
 const currentDay=nav?.querySelector('.sv-agenda-day[data-day="'+iso+'"]');
 if(!nav||!currentDay){
  svTaskWindowStart=iso;
  svAgendaRenderNav(svAgendaLastRows);
  return;
 }
 if(nav.dataset.monthSelected!==iso.slice(0,7)){
  nav.dataset.monthSelected=iso.slice(0,7);
  const date=svTaskDate(iso),month=svDateFormatter({month:'long'}).format(date);
  const name=nav.querySelector('.sv-agenda-month-name'),year=nav.querySelector('.sv-agenda-year');
  if(name)name.textContent=month.charAt(0).toLocaleUpperCase('ru-RU')+month.slice(1);
  if(year)year.textContent=String(date.getFullYear());
  // The month displayed in the shared Work header must follow the day rail.
  document.dispatchEvent(new CustomEvent('seyveo:agenda-month-changed',{
   detail:{month:name?.textContent,year:year?.textContent}
  }));
 }
 for(const button of nav.querySelectorAll('.sv-agenda-day')){
  const selected=button.dataset.day===iso;
  button.setAttribute('aria-pressed',String(selected));
  if(selected)button.dataset.selected='true';
  else delete button.dataset.selected;
 }
 svAgendaEnsureRailVisible(currentDay);
 svAgendaQueueToday();
}
/* Follow the selected day only when it is outside the visible rail. */
function svAgendaEnsureRailVisible(day){
 const strip=day?.closest('.sv-agenda-week');
 if(!strip||!strip.clientWidth||svAgendaRolling)return;
 const rail=strip.getBoundingClientRect(),box=day.getBoundingClientRect();
 if(box.left>=rail.left-1&&box.right<=rail.right+1)return;
 const width=day.getBoundingClientRect().width;
 if(!width)return;
 const delta=box.left<rail.left?box.left-rail.left:box.right-rail.right;
 const offset=strip.scrollLeft+delta;
 const target=(delta<0?Math.floor(offset/width):Math.ceil(offset/width))*width;
 svAgendaIgnoreStripScrollUntil=Date.now()+450;
 strip.scrollTo({left:Math.max(0,target),behavior:'instant'});
}
/* Cache the positions of day headings. A long flick then costs one binary
 * search per animation frame, rather than a layout read for every date. */
function svAgendaGetAnchors(){
 // A hidden Work tab has zero-size groups; never cache those coordinates.
 if(!list.clientHeight||!list.getClientRects().length){svAgendaAnchorCache=null;return [];}
 const layoutKey=[list.clientWidth,list.clientHeight,list.scrollHeight].join(':');
 if(!svAgendaAnchorCache||svAgendaAnchorCache.layoutKey!==layoutKey){
  const listTop=list.getBoundingClientRect().top+list.clientTop;
  const currentScroll=list.scrollTop;
  svAgendaAnchorCache=[...list.querySelectorAll('.sv-agenda-day-group > .sv-agenda-section-heading')]
   .filter(heading=>heading.parentElement.getClientRects().length)
   .map(heading=>({iso:heading.dataset.weatherDate||null,key:heading.dataset.weatherDate||heading.querySelector('strong')?.textContent,heading,top:Math.max(0,currentScroll+heading.parentElement.getBoundingClientRect().top-listTop)}));
  svAgendaAnchorCache.layoutKey=layoutKey;
 }
 return svAgendaAnchorCache;
}
function svAgendaAnchorAt(position){
 const anchors=svAgendaGetAnchors();
 if(!anchors.length)return null;
 let low=0,high=anchors.length-1,result=0;
 while(low<=high){
  const mid=(low+high)>>1;
  if(anchors[mid].top<=position){result=mid;low=mid+1;}
  else high=mid-1;
 }
 return anchors[result];
}
let svAgendaFadeHeading=null,svAgendaActiveHeading=null;
function svAgendaSyncPinnedDate(){
 const panel=list.parentElement;
 if(!panel)return;
 let slot=panel.querySelector('#svAgendaPinnedDate');
 if(!slot){slot=element('div','sv-agenda-pinned-date');slot.id='svAgendaPinnedDate';list.before(slot);}
 const current=svAgendaAnchorAt(list.scrollTop+1);
 // The active date already has the calendar's bottom rule above it.
 // Hide only its duplicate divider, keeping the row's geometry unchanged.
 const activeHeading=current?.heading||null;
 if(svAgendaActiveHeading!==activeHeading){
  svAgendaActiveHeading?.removeAttribute('data-sv-active-day');
  svAgendaActiveHeading=activeHeading;
  activeHeading?.setAttribute('data-sv-active-day','');
 }
 const traveled=current?Math.max(0,list.scrollTop-current.top):0;
 const fadeHeading=traveled>0.5?current.heading:null;
 if(svAgendaFadeHeading!==fadeHeading){
  if(svAgendaFadeHeading){
   svAgendaFadeHeading.removeAttribute('data-sv-edge-fade');
   svAgendaFadeHeading.style.removeProperty('--sv-agenda-edge-opacity');
  }
  svAgendaFadeHeading=fadeHeading;
  if(fadeHeading)fadeHeading.setAttribute('data-sv-edge-fade','');
 }
 if(fadeHeading){
  const alpha=String(Math.min(1,traveled/12).toFixed(2));
  if(fadeHeading.style.getPropertyValue('--sv-agenda-edge-opacity')!==alpha)
   fadeHeading.style.setProperty('--sv-agenda-edge-opacity',alpha);
 }
 if(!current){slot.replaceChildren();delete slot.dataset.key;return;}
 if(slot.dataset.key===current.key&&slot.firstElementChild)return;
 slot.dataset.key=current.key;
 slot.replaceChildren(svAgendaSection(current.iso,current.iso?undefined:current.heading.querySelector('strong')?.textContent||'Без даты'));
 document.dispatchEvent(new Event('seyveo:agenda-pinned-date-changed'));
}
/* Every dated section must be able to reach the top of the actual list. */
function svAgendaEnsureReachable(top){
 if(!list.clientHeight||!Number.isFinite(top))return;
 let tail=list.querySelector(':scope > .sv-agenda-scroll-tail');
 if(!tail){
  tail=element('div','sv-agenda-scroll-tail');
  tail.setAttribute('aria-hidden','true');
  list.append(tail);
 }
 const missing=Math.ceil(top-Math.max(0,list.scrollHeight-list.clientHeight));
 if(missing>0){
  const height=Math.ceil(tail.getBoundingClientRect().height)+missing+3;
  tail.style.setProperty('--sv-agenda-tail-height',height+'px');
  svAgendaAnchorCache=null;
 }
}
function svAgendaPrepareTail(){
 if(!list.clientHeight)return;
 const last=svAgendaGetAnchors().filter(item=>item.iso).pop();
 if(last)svAgendaEnsureReachable(last.top);
}
let svAgendaDateJumpToken=0,svAgendaDateJumpFrame=0;
function svAgendaCancelDateJump(){
 ++svAgendaDateJumpToken;
 if(svAgendaDateJumpFrame)cancelAnimationFrame(svAgendaDateJumpFrame);
 svAgendaDateJumpFrame=0;
 svAgendaJumpThrough=0;
}
function svAgendaScrollToDate(iso){
 svAgendaCancelDateJump();
 svAgendaAnchorCache=null;
 svAgendaPrepareTail();
 const anchor=svAgendaGetAnchors().find(item=>item.iso===iso);
 if(!anchor)return false;
 const target=Math.ceil(Math.max(0,anchor.top));
 svAgendaEnsureReachable(target);
 const start=list.scrollTop,distance=target-start;
 const glide=!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&Math.abs(distance)<=list.clientHeight*2.5;
 const token=svAgendaDateJumpToken;
 const duration=glide?Math.min(420,Math.max(180,Math.abs(distance)*.8)):0;
 const started=performance.now();
 svAgendaJumpThrough=Infinity;
 const finish=()=>{
  if(token!==svAgendaDateJumpToken)return;
  svAgendaAnchorCache=null;
  const finalAnchor=svAgendaGetAnchors().find(item=>item.iso===iso);
  if(finalAnchor){
   const finalTop=Math.ceil(finalAnchor.top);
   svAgendaEnsureReachable(finalTop);
   list.scrollTo({top:finalTop,behavior:'instant'});
  }
  svAgendaSyncPinnedDate();
  svAgendaMarkSelected(iso);
  svAgendaDateJumpFrame=0;
  svAgendaJumpThrough=Date.now()+100;
 };
 const advance=now=>{
  if(token!==svAgendaDateJumpToken)return;
  const progress=duration?Math.min(1,(now-started)/duration):1;
  const eased=1-Math.pow(1-progress,3);
  list.scrollTo({top:start+distance*eased,behavior:'instant'});
  if(progress<1){svAgendaDateJumpFrame=requestAnimationFrame(advance);return;}
  finish();
 };
 if(duration&&Math.abs(distance)>1)svAgendaDateJumpFrame=requestAnimationFrame(advance);
 else finish();
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
 // Navigation capsules never disappear or move during a vertical flick.
 svAgendaDockPreviousY=list.scrollTop;
 svAgendaShowDock();
}
function svAgendaJumpToDate(iso){
 svAgendaPauseDockMotion();
 svAgendaMarkSelected(iso);
 if(svAgendaScrollToDate(iso))return;
 // Dates without entries still have a selectable heading.
 render();
 svAgendaScrollToDate(iso);
}
/* The visible month in the shared header is a one-tap Today shortcut.
   Keep the full Calendar behind its separate “Все календари” control. */
window.addEventListener('seyveo:agenda-go-today',svAgendaReturnToday);
// A verified Sayvi save can take the person to the exact date of that task.
// This only moves the existing agenda viewport; it never creates a record.
window.addEventListener('seyveo:tasks-focus-date',event=>{
 const iso=event.detail?.date;
 if(svTaskDate(iso))svAgendaJumpToDate(iso);
});
function svAgendaSyncFromScroll(){
 svAgendaSyncPinnedDate();
 if(Date.now()<svAgendaJumpThrough||Date.now()<svAgendaOpeningUntil||document.getElementById('svWorkShell')?.dataset.agendaScroll!=='true')return;
 const scrollRange=list.scrollHeight-list.clientHeight;
 if(scrollRange<35)return; // All days fit on screen: retain the explicitly chosen date.
 // A long inertial flick stays on the browser's native compositor. Only
 // the current date is synchronized, via a binary search over cached anchors.
 // Match the pinned heading, rather than selecting the next visible day early.
 const focus=list.scrollTop+1;
 const current=svAgendaAnchorAt(focus);
 const iso=current?.iso;
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
 // Updating a task must not replace the entire calendar strip if its seven
 // days are unchanged. This keeps taps and transitions steady.
 const visibleThrough=svTaskShiftDay(svTaskWindowStart,83);
 const previewStart=svTaskShiftDay(svTaskWindowStart,-21);
 const previewSignature=rows.filter(item=>item.due>=previewStart&&item.due<=visibleThrough)
  .map(item=>[item.id,item.due,item.done,svTaskCategory(item),svTaskDotTone(item)].join(':')).join(';');
 const signature=[svTaskWindowStart,svTaskSelectedDate.slice(0,7),svTaskISO(new Date()),previewSignature].join('|');
 if(nav.dataset.modelSignature===signature&&nav.querySelector('.sv-agenda-day')){
  for(const button of nav.querySelectorAll('.sv-agenda-day')){
   const selected=button.dataset.day===svTaskSelectedDate;
   button.setAttribute('aria-pressed',String(selected));
   if(selected)button.dataset.selected='true';
   else delete button.dataset.selected;
  }
  return;
 }
 nav.replaceChildren();
 nav.dataset.modelSignature=signature;
 nav.dataset.monthSelected=svTaskSelectedDate.slice(0,7);
 const picked=svTaskDate(svTaskSelectedDate)||new Date();
 const month=element('button','sv-agenda-month-heading');
 month.type='button';month.setAttribute('aria-label','Вернуться к сегодняшнему дню');
 month.addEventListener('click',svAgendaReturnToday);
 const monthName=svDateFormatter({month:'long'}).format(picked);
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
 const first=svTaskDate(svTaskShiftDay(svTaskWindowStart,-21));
 const today=svTaskISO(new Date()),byDate=new Map();
 for(const item of rows){
  if(!item.due)continue;
  if(!byDate.has(item.due))byDate.set(item.due,[]);
  byDate.get(item.due).push(item);
 }
 for(let i=0;i<105;i++){
  const day=new Date(first);day.setDate(first.getDate()+i);
  const iso=svTaskISO(day),entries=byDate.get(iso)||[];
  const btn=element('button','sv-agenda-day');
  btn.type='button';btn.dataset.day=iso;btn.dataset.weekday=String(day.getDay());
  btn.setAttribute('aria-pressed',String(iso===svTaskSelectedDate));
  const dayLabel=svDateFormatter({weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(day);
  const workCount=entries.filter(task=>svTaskCategory(task)==='work').length;
  btn.setAttribute('aria-label',dayLabel+(entries.length?', дел: '+entries.length+', рабочих: '+workCount+', личных: '+(entries.length-workCount):', дел нет'));
  if(entries.some(item=>svTaskEntryType(item)==='task'&&!item.done))btn.dataset.hasTasks='true';
  if(iso===today)btn.dataset.today='true';
  if(iso===svTaskSelectedDate)btn.dataset.selected='true';
  const shortDay=svDateFormatter({weekday:'short'}).format(day).replace('.','');
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
  btn.addEventListener('click',()=>{svAgendaUserInteracted=true;svAgendaStopRoulette();svAgendaJumpToDate(iso);});
  track.append(btn);
 }
 // Native iPhone momentum permits a fast flick across multiple dates.
 // Snap always lands on a complete day rather than stopping between columns.
 let settleTimer=0,ignoreScrollUntil=0;
 let railPointer=null,railTouch=null,railUserScrolling=false;
 // Programmatic alignment and Safari's restored scroll position also emit
 // scroll/scrollend. Only an actual swipe, wheel or keyboard action may
 // change the chosen date from the rail.
 strip.addEventListener('pointerdown',event=>{railPointer={x:event.clientX,y:event.clientY};},{passive:true});
 strip.addEventListener('pointermove',event=>{
  if(railPointer&&Math.abs(event.clientX-railPointer.x)>7&&
     Math.abs(event.clientX-railPointer.x)>Math.abs(event.clientY-railPointer.y))railUserScrolling=true;
 },{passive:true});
 strip.addEventListener('pointerup',()=>{railPointer=null;},{passive:true});
 strip.addEventListener('pointercancel',()=>{railPointer=null;},{passive:true});
 strip.addEventListener('touchstart',event=>{
  const touch=event.touches[0];railTouch=touch?{x:touch.clientX,y:touch.clientY}:null;
 },{passive:true});
 strip.addEventListener('touchmove',event=>{
  const touch=event.touches[0];
  if(railTouch&&touch&&Math.abs(touch.clientX-railTouch.x)>7&&
     Math.abs(touch.clientX-railTouch.x)>Math.abs(touch.clientY-railTouch.y))railUserScrolling=true;
 },{passive:true});
 strip.addEventListener('touchend',()=>{railTouch=null;},{passive:true});
 strip.addEventListener('wheel',()=>{railUserScrolling=true;},{passive:true});
 strip.addEventListener('keydown',event=>{
  if(['ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(event.key))railUserScrolling=true;
 });
 const dayWidth=()=>track.firstElementChild?.getBoundingClientRect().width||strip.clientWidth/5.4;
 // The rail is often rendered while My Tasks is hidden. Align only once
 // its real width is known, otherwise the browser shows today minus 21 days.
 let railAligned=false;
 const alignInitial=()=>{
  if(railAligned||!strip.isConnected||strip.clientWidth<1||dayWidth()<1)return;
  railAligned=true;
  railObserver?.disconnect();
  const selected=track.querySelector('.sv-agenda-day[data-day="'+svTaskSelectedDate+'"]');
  const index=selected?[...track.children].indexOf(selected):21;
  svAgendaIgnoreStripScrollUntil=Date.now()+350;
  strip.scrollLeft=index*dayWidth();
 };
 const railObserver=window.ResizeObserver?new ResizeObserver(alignInitial):null;
 railObserver?.observe(strip);
 alignInitial();
 requestAnimationFrame(alignInitial);
 const commitScroll=()=>{
  clearTimeout(settleTimer);
  if(!railUserScrolling||svAgendaRolling||Date.now()<svAgendaIgnoreStripScrollUntil||Date.now()<ignoreScrollUntil)return;
  const unit=dayWidth();if(!unit)return;
  const index=Math.min(track.children.length-1,Math.max(0,Math.round(strip.scrollLeft/unit)));
  const iso=track.children[index]?.dataset.day;
  railUserScrolling=false;
  if(!iso||iso===svTaskSelectedDate)return;
  svAgendaUserInteracted=true;
  svTaskWindowStart=iso;
  svAgendaMarkSelected(iso);
  if(!svAgendaScrollToDate(iso)){render();svAgendaScrollToDate(iso);}
  svAgendaQueueToday();
 };
 strip.addEventListener('scroll',()=>{
  clearTimeout(settleTimer);
  settleTimer=setTimeout(commitScroll,150);
 },{passive:true});
 strip.addEventListener('scrollend',commitScroll,{passive:true});
 strip.addEventListener('click',event=>{
  const day=event.target.closest('.sv-agenda-day');
  if(!day)return;
  railUserScrolling=false;
  ignoreScrollUntil=Date.now()+350;
  clearTimeout(settleTimer);
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
   svDateFormatter({weekday:'long'}).format(day);
 }
 if(iso===today&&caption.toLocaleLowerCase('ru-RU')==='сегодня')header.dataset.today='true';
 header.append(element('strong','',caption.toLocaleUpperCase('ru-RU')));
 if(day){
  header.dataset.weatherDate=iso;
  header.append(element('span','sv-agenda-section-date',svDateFormatter({day:'numeric',month:'numeric',year:'numeric'}).format(day)));
  const weather=element('span','sv-agenda-weather');
  weather.hidden=true;
  header.append(weather);
 }
 return header;
}
function svAgendaAddRows(items,target=list){
 items.sort((a,b)=>(a.time||'00:00').localeCompare(b.time||'00:00')||a.title.localeCompare(b.title,'ru'));
 items.forEach(item=>target.append(row(item)));
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
  const group=element('section','sv-agenda-day-group');
  group.append(svAgendaSection(iso));
  if(items.length)svAgendaAddRows(items,group);
  else if(iso===selected)group.append(element('p','sv-agenda-empty-day',rows.length?'На этот день дел нет. Ближайшие дела ниже.':'Пока нет дел. Нажми +, чтобы добавить первое.'));
  list.append(group);
 }
 if(undated.length){
  const group=element('section','sv-agenda-day-group');
  group.append(svAgendaSection(null,'Без даты'));
  svAgendaAddRows(undated,group);
  list.append(group);
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
  if(item.sourceStore==='calendar')name.dataset.calendarOpen=item.calendarId;
  else if(!item.done)name.dataset.taskEdit=item.id;
  else name.dataset.taskMenu=item.id;
  name.setAttribute('aria-label',item.sourceStore==='calendar'?'Изменить событие: '+item.title:
   item.done?'Показать действия с делом: '+item.title:'Изменить дело: '+item.title);
  if(item.done)name.setAttribute('aria-expanded','false');
 }else{
  name.disabled=true;
 }
 if(item.done)name.classList.add('is-done');
 if(!compact){
  const timeLabel=deferred?'Отложено':item.time||(!item.due?'Без срока':'Весь день');
  label.append(element('span','sv-agenda-entry-time',timeLabel));
 }
 label.append(name);
 if(!compact&&!item.done&&item.travel&&item.due&&item.time){
  const departure=window.SEYVEO_TASK_TRAVEL_CORE?.departure?.(item.due,item.time,item.travel);
  const left=departure?departure.at-Date.now():NaN;
  if(Number.isFinite(left)&&left>-15*60000&&left<3*3600000){
   const line=left<=0?'Пора выходить':left<=5*60000?'Выходить скоро · '+departure.time:'Лучше выйти в '+departure.time;
   label.append(element('small','sv-travel-list-notice',line));
  }
 }
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
   svDateFormatter({day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(created)):'Неизвестно';
  const scheduled=item.due?(strDate(item.due)+(item.time?' · '+item.time:'')):'Не назначено';
  details.append(
   element('div','personal-task-detail-entry','Создано: '+creation),
   element('div','personal-task-detail-entry','Кто создал: '+creatorName(item)),
   element('div','personal-task-detail-entry',(svTaskEntryType(item)==='event'?'Когда: ':'Выполнить: ')+scheduled),
   element('div','personal-task-detail-entry','Тип: '+(svTaskEntryType(item)==='event'?'Событие':'Задача'))
  );
  if(item.travel&&item.due&&item.time){
   const departure=window.SEYVEO_TASK_TRAVEL_CORE?.departure?.(item.due,item.time,item.travel);
   if(departure)details.append(element('div','personal-task-detail-entry','Дорога: '+item.travel.minutes+' мин · выход в '+departure.time));
  }
  if(item.place){
   const routeUrl=window.SEYVEO_TASK_TRAVEL_CORE?.directionsURL?.(item.place);
   const taxiUrl=window.SEYVEO_TASK_TRAVEL_CORE?.taxiURL?.(item.place);
   for(const [caption,href] of [['Открыть маршрут ↗',routeUrl],['Такси · заказать или запланировать ↗',taxiUrl]]){
    if(!href)continue;
    const link=element('a','sv-task-travel-link',caption);link.href=href;
    link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';details.append(link);
   }
  }
  if(item.attachment){
   const attachmentButton=element('button','personal-task-detail-attachment','📎 '+item.attachment.name);
   attachmentButton.type='button';attachmentButton.dataset.taskAttachment=item.id;
   attachmentButton.setAttribute('aria-label','Скачать вложение: '+item.attachment.name);
   details.append(attachmentButton);
  }
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
  /* A single moving surface exposes the red action underneath. The outer
     calendar row never moves, so vertical scroll and date anchors stay put. */
  const surface=element('div','sv-task-swipe-foreground');
  surface.append(art,label,sayvi,checkbox);
  if(item.sourceStore!=='calendar'){
   const swipeDelete=element('button','sv-task-swipe-delete');
   swipeDelete.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M4.5 7h15M9 7V5.5h6V7m-9 0 .7 12h10.6L18 7M10 10.5v5.5m4-5.5v5.5"/></svg><span>Удалить</span>';
   swipeDelete.type='button';swipeDelete.dataset.taskSwipeDelete=item.id;
   swipeDelete.setAttribute('aria-label','Удалить дело: '+item.title);
   swipeDelete.setAttribute('aria-hidden','true');
   swipeDelete.tabIndex=-1;
   section.append(swipeDelete);
  }
  section.append(surface,menu);
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
let svAgendaRenderedModel='',svAgendaRenderedRail='';
function render(reuseOnEntry=false){
 clearTaskError();
 const all=read(),open=all.filter(item=>!item.done)
 .sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31')||a.createdAt.localeCompare(b.createdAt));
 const done=all.filter(item=>item.done).reverse();
 const living=window.SEYVEO_LIVING_MOMENT;
 const deferredIds=new Set(living?.deferredTaskIds?.()||[]);
 const preview=Array.isArray(living?.deferred?.())?living.deferred():[];
 const postponed=open.filter(item=>deferredIds.has(item.id));
 const active=open.filter(item=>!deferredIds.has(item.id));
 const visibleActive=[...active,...svCalendarAgendaEvents()].sort((a,b)=>(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31')||(a.time||'').localeCompare(b.time||''));
 const today=svTaskISO(new Date());
 if(!svTaskSelectedDate)svTaskSelectedDate=today;
 if(!svTaskWindowStart)svTaskWindowStart=today;
 // Keep the existing list/105-day rail on a normal re-entry only when
 // its complete model, date and actual rail are unchanged. A live travel
 // countdown or continuation is deliberately rebuilt rather than cached.
 let model='';
 if(!justCompletedTaskId&&!open.some(item=>item.travel)){
  try{model=JSON.stringify([today,svTaskSelectedDate,svTaskWindowStart,all,visibleActive,postponed,preview]);}catch{}
 }
 const rail=$('svTasksDateNav');
 if(reuseOnEntry===true&&model&&model===svAgendaRenderedModel&&rail?.dataset.modelSignature===svAgendaRenderedRail&&rail.querySelector('.sv-agenda-day[data-today="true"]')&&list.querySelector('.sv-agenda-section-heading[data-weather-date="'+today+'"]')){
  svAgendaAnchorCache=null;
  return;
 }
 renderContext(active);
 const hasDeferred=postponed.length>0||preview.length>0;
 const wasRendered=!!list.querySelector('.sv-agenda-section-heading');
 const previousScroll=list.scrollTop;
 const previousAnchor=wasRendered?svAgendaAnchorAt(previousScroll+1):null;
 const offsetWithinDay=previousAnchor?previousScroll-previousAnchor.top:0;
 svAgendaLastRows=visibleActive;
 svAgendaRenderNav(visibleActive);
 list.replaceChildren();
 svAgendaAnchorCache=null;
 svAgendaRenderList(visibleActive);
 list.dataset.long=String(visibleActive.length+postponed.length>=18);
 if(hasDeferred){
  const group=element('section','sv-agenda-day-group');
  group.append(svAgendaSection(null,'Отложено'));
  postponed.forEach(task=>group.append(row(task,false,true)));
  preview.forEach(item=>group.append(deferredPreviewRow(item)));
  list.append(group);
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
 svAgendaPrepareTail();
 // Restore after all sections and optional prompts have been inserted.
 if(wasRendered){
  svAgendaAnchorCache=null;
  const matching=previousAnchor&&svAgendaGetAnchors().find(item=>item.key===previousAnchor.key);
  const restore=matching?Math.max(0,matching.top+offsetWithinDay):previousScroll;
  const selected=svAgendaGetAnchors().find(item=>item.iso===svTaskSelectedDate);
  if(selected&&matching?.iso===selected.iso)svAgendaEnsureReachable(Math.max(restore,selected.top));
  list.scrollTop=restore;
 }
 summary.replaceChildren();
 if(open.length)open.slice(0,2).forEach(task=>summary.append(row(task,true)));
 else summary.append(element('p','personal-brief-empty',all.length?'Все личные дела завершены. Отличная работа.':'Личных дел пока нет.'));
 $('personalBriefCount').textContent=open.length?String(open.length):'';
 $('personalBriefCount').hidden=!open.length;
 $('personalBrief').hidden=open.length===0;
 window.dispatchEvent(new CustomEvent('seyveo:tasks-changed',{detail:{open:open.length,total:all.length}}));
 svAgendaAnchorCache=null;
 svAgendaSyncPinnedDate();
 svAgendaRenderedModel=model;
 svAgendaRenderedRail=$('svTasksDateNav')?.dataset.modelSignature||'';
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
   label=svDateFormatter({day:'numeric',month:'short',year:'numeric'}).format(parsed);
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
const svTaskListChoice=$('svNewTaskListChoice');
function svSyncTaskListChoice(){
 if(svTaskListChoice)svTaskListChoice.value=form.querySelector('input[name="personalTaskCategory"]:checked')?.value==='work'?'work':'personal';
}
svTaskListChoice?.addEventListener('change',()=>{
 const choice=form.querySelector('input[name="personalTaskCategory"][value="'+svTaskListChoice.value+'"]');
 if(choice){choice.checked=true;svTaskCategoryTouched=true;}
});
form.querySelectorAll('input[name="personalTaskType"]').forEach(choice=>choice.addEventListener('change',()=>{svTaskTypeTouched=true;}));
form.querySelectorAll('input[name="personalTaskCategory"]').forEach(choice=>choice.addEventListener('change',()=>{svTaskCategoryTouched=true;}));
input.addEventListener('input',()=>{
 syncTaskSaveState();
 if(editingTaskId)return;
 if(!svTaskCategoryTouched){
  const category=svSuggestTaskCategory(input.value);
  const choice=form.querySelector('input[name="personalTaskCategory"][value="'+category+'"]');
  if(choice)choice.checked=true;
  svSyncTaskListChoice();
 }
 if(!svTaskTypeTouched){
  const type=form.querySelector('input[name="personalTaskType"][value="'+svInferEntryType(input.value)+'"]');
  if(type)type.checked=true;
 }
});
function homeVisibilityForSave(){
 const control=$('personalTaskShowOnHome');
 // This legacy option is hidden in the current editor; do not silently opt out.
 return control?.closest('[hidden]')?true:control?.checked!==false;
}
function focusTaskWriting(){
 if(!dialog.open||input.disabled)return;
 // Keep iPhone keyboard activation inside the opening tap; do not pan the
 // whole Home screen just to reveal a caret in the task's own editor.
 input.focus({preventScroll:true});
 const end=input.value.length;
 input.setSelectionRange(end,end);
}
/* Temporary, opt-in prototype dataset. Real local task records are used
   so editing, filtering, completion and scrolling use their real handlers.
   Never seed automatically or schedule any external operation. */
const SV_TASK_SAMPLE_PREFIX='sv-task-example-20261124-';
const SV_TASK_SAMPLES=[
 [0,'08:30','Подготовить план на день','work','task','blue'],
 [0,'09:00','Завтрак с семьёй','personal','event','green'],
 [0,'10:00','Совещание по проекту','work','event','purple'],
 [0,'11:30','Проверить документы по заказу','work','task','orange'],
 [0,'12:30','Встреча с поставщиком','work','event','blue'],
 [0,'14:00','Подготовить коммерческое предложение','work','task','yellow'],
 [0,'16:00','Купить продукты','personal','task','green'],
 [0,'18:30','Тренировка в спортзале','personal','event','red'],
 [0,'20:00','Разобрать фотографии','personal','task','purple'],
 [1,'09:00','Планёрка команды','work','event','blue'],
 [1,'10:30','Проверить складские остатки','work','task','orange'],
 [1,'12:00','Обед с другом','personal','event','green'],
 [1,'15:00','Подготовить еженедельный отчёт','work','task','purple'],
 [1,'18:00','Забрать заказ из пункта выдачи','personal','task','yellow'],
 [2,'08:00','Утренняя прогулка','personal','event','green'],
 [2,'11:00','Обсуждение нового проекта','work','event','blue'],
 [2,'16:30','Составить список покупок','personal','task','orange'],
 [3,'10:00','Встреча команды по итогам недели','work','event','purple'],
 [4,'15:00','Посещение выставки','personal','event','red'],
 [null,'','Навести порядок в рабочей папке','work','task','yellow']
];
const sampleButton=element('button','sv-task-example-launch','Добавить 20 примеров');
sampleButton.type='button';sampleButton.hidden=true;
form.querySelector('.sv-new-task-main')?.after(sampleButton);
function syncTaskSampleButton(){
 sampleButton.hidden=!!editingTaskId||!!input.value.trim()||read().some(t=>t.id.startsWith(SV_TASK_SAMPLE_PREFIX));
}
input.addEventListener('input',syncTaskSampleButton);
dialog.addEventListener('sv-task-editor-sync',syncTaskSampleButton);
sampleButton.addEventListener('click',()=>{
 if(editingTaskId||input.value.trim())return;
 const all=read();
 if(all.some(t=>t.id.startsWith(SV_TASK_SAMPLE_PREFIX))){syncTaskSampleButton();return;}
 if(all.length+SV_TASK_SAMPLES.length>MAX){
  $('personalTaskStatus').textContent='Не хватает места для 20 примеров. Ваши дела не изменены.';return;
 }
 const today=svTaskISO(new Date()),createdAt=new Date().toISOString();
 const examples=SV_TASK_SAMPLES.map(([offset,time,title,category,entryType,tone],i)=>({
  id:SV_TASK_SAMPLE_PREFIX+i,title,due:offset===null?'':svTaskShiftDay(today,offset),
  time,category,entryType,tone,done:false,createdAt,doneAt:'',
  createdBy:'user',notes:'Вымышленный пример для проверки SEYVEO.',
  remindBefore:0,showOnHome:false,repeat:'none',priority:'none'
 }));
 if(!save(all.concat(examples))){
  $('personalTaskStatus').textContent='Не удалось сохранить примеры. Ваши дела не изменены.';return;
 }
 sampleButton.hidden=true;
 taskEditorSavedOnExit=true;
 if(dialog.open)dialog.close();
 render();
 window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
});
function openDialog(){
 pendingSourceNoteId='';editingTaskId='';taskEditorSavedOnExit=false;svTaskCategoryTouched=false;svTaskTypeTouched=false;
 showCreator(null);
 window.SEYVEO_TASK_PLACE_EDITOR?.reset?.();
 window.SEYVEO_TASK_ATTACHMENTS?.reset?.();
 $('personalTaskDialogTitle').textContent='Новое дело';
 $('personalTaskSave').setAttribute('aria-label','Сохранить дело');$('personalTaskSave').title='Сохранить дело';
 form.reset();
 const newCategory=form.querySelector('input[name="personalTaskCategory"][value="personal"]');
 if(newCategory)newCategory.checked=true;
 svSyncTaskListChoice();
 /* Smart-first composer never invents a due date. It is filled from the phrase
    or explicitly through "Уточнить вручную". */
 date.value='';
 dialog.dispatchEvent(new Event('sv-task-editor-sync'));syncDueDateDisplay();syncTaskSaveState();$('personalTaskStatus').textContent='';
 if(!dialog.open)dialog.showModal();
 window.requestAnimationFrame(syncDueDateDisplay);
 focusTaskWriting();
}
let taskFileSaving=false;
async function put(e){
 e.preventDefault();
 const createdBy=form.dataset.svCreatedBy==='sayvi'?'sayvi':'user';
 delete form.dataset.svCreatedBy;
 if(taskFileSaving)return;
 if(window.SEYVEO_TASK_SCREEN?.needsReview?.()){
  $('personalTaskStatus').textContent='Сэйви увидела больше четырёх дел. Раздели сообщение на две части, чтобы сохранить все дела.';
  return;
 }
 const title=(window.SEYVEO_TASK_SCREEN?.titleForSave?.()||input.value).trim().replace(/\s+/g,' ');
 if(!title){$('personalTaskStatus').textContent='Напишите, что нужно сделать.';input.focus();return}
 const attachments=window.SEYVEO_TASK_ATTACHMENTS;
 const attachmentMeta=attachments?.getMeta?.()||null;
 async function persistFile(taskIds){
  if(!attachments?.persist)return true;
  taskFileSaving=true;taskSaveButton.disabled=true;
  try{await attachments.persist(taskIds);return true}
  catch{$('personalTaskStatus').textContent='Не удалось сохранить вложение. Проверь память устройства и попробуй снова.';return false}
  finally{taskFileSaving=false;syncTaskSaveState()}
 }
 if(editingTaskId){
  const all=read(),record=all.find(task=>task.id===editingTaskId&&!task.done);
  if(!record){$('personalTaskStatus').textContent='Дело изменилось или уже выполнено. Откройте список заново.';return}
  record.title=title.slice(0,140);record.due=date.value;record.time=date.value?($('personalTaskTime')?.value||''):'';
  record.notes=$('personalTaskNotes')?.value.trim().slice(0,1000)||'';
  record.url=$('personalTaskURL')?.value.trim().slice(0,500)||'';
  record.attachment=attachmentMeta;
  record.place=window.SEYVEO_TASK_PLACE_EDITOR?.placeForSave?.()||null;
  record.travel=window.SEYVEO_TASK_TRAVEL_EDITOR?.forSave?.()||null;
  record.repeat=$('personalTaskRepeat')?.value||'none';
  record.priority=$('personalTaskPriority')?.value||'none';
  record.showOnHome=homeVisibilityForSave();
  record.category=form.querySelector('input[name="personalTaskCategory"]:checked')?.value==='work'?'work':'personal';
  record.entryType=form.querySelector('input[name="personalTaskType"]:checked')?.value==='event'?'event':'task';
  if(!await persistFile([record.id]))return;
  if(!save(all)){$('personalTaskStatus').textContent='Не удалось сохранить изменения.';return}
  void attachments?.afterSave?.([record.id]);
  editingTaskId='';taskEditorSavedOnExit=true;if(dialog.open)dialog.close();render();
  window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
  return;
 }
 const all=read();
 const planned=window.SEYVEO_TASK_SCREEN?.draftsForSave?.();
 const multiple=Array.isArray(planned)&&planned.length>1;
 const drafts=multiple?planned:[{
  title,category:form.querySelector('input[name="personalTaskCategory"]:checked')?.value==='work'?'work':'personal',
  entryType:form.querySelector('input[name="personalTaskType"]:checked')?.value==='event'?'event':'task',
  remindBefore:Array.isArray(planned)&&planned[0]?.remindBefore||0
 }];
 if(window.SEYVEO_TASK_SCREEN?.needsReview?.()||drafts.length>12){$('personalTaskStatus').textContent='В сообщении больше 12 дел. Раздели список на части, чтобы ничего не потерялось.';return}
 if(drafts.some(draft=>!draft.title?.trim())){$('personalTaskStatus').textContent='Проверь названия дел перед сохранением.';return}
 if(all.length+drafts.length>MAX){$('personalTaskStatus').textContent='Не хватает места для всех дел. Удалите ненужные завершённые дела.';return}
 const common={due:date.value,time:date.value?($('personalTaskTime')?.value||''):'',
  notes:$('personalTaskNotes')?.value.trim().slice(0,1000)||'',url:$('personalTaskURL')?.value.trim().slice(0,500)||'',
  attachment:attachmentMeta,
  repeat:$('personalTaskRepeat')?.value||'none',priority:$('personalTaskPriority')?.value||'none',
  showOnHome:homeVisibilityForSave(),done:false,createdAt:new Date().toISOString(),doneAt:'',createdBy};
 const suggestedPlace=window.SEYVEO_TASK_PLACE_EDITOR?.placeForSave?.()||null;
 const additions=drafts.map(draft=>{
  const category=draft.category==='work'?'work':'personal';
  return {...common,id:'personal-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),
   due:multiple?(draft.date||''):common.due,
   time:multiple?(draft.date?draft.time||'':''):common.time,
   title:draft.title.trim().replace(/\s+/g,' ').slice(0,140),category,
   tone:category==='work'?'blue':(multiple?draft.tone||'orange':'orange'),
   entryType:draft.entryType==='event'?'event':'task',
   place:multiple&&draft.entryType!=='event'?null:suggestedPlace,
   travel:(!multiple||draft.entryType==='event')?(window.SEYVEO_TASK_TRAVEL_EDITOR?.forSave?.()||null):null,
   remindBefore:[15,30,60].includes(draft.remindBefore)?draft.remindBefore:0,
   ...(pendingSourceNoteId?{sourceNoteId:pendingSourceNoteId}:{})};
 });
 const next=[...all,...additions];
 if(!await persistFile(additions.map(item=>item.id)))return;
 if(!save(next)){$('personalTaskStatus').textContent='Не удалось сохранить. Проверьте память браузера.';return}
 void attachments?.afterSave?.(additions.map(item=>item.id));
 pendingSourceNoteId='';justCompletedTaskId='';
 taskEditorSavedOnExit=true;if(dialog.open)dialog.close();render();
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
}
/* Manual creation commits ONLY from the checkmark. X / Escape means cancel. */
function exitTaskEditor(){
 if(!dialog.open)return;
 dialog.close();
}
function change(id,del=false){
 const all=read(),target=all.find(item=>item.id===id);if(!target)return;
 if(del){
   if(!window.confirm('Удалить дело «'+target.title+'»?'))return;
   if(!svTrashArchiveMany([id])){showTaskError('Не удалось переместить дело в «Недавно удалённые». Проверьте память устройства.');return}
   return;
 }else{
   target.done=!target.done;target.doneAt=target.done?new Date().toISOString():'';
   if(!save(all)){showTaskError('Не удалось сохранить изменение. Проверьте память устройства.');return}
 }
 justCompletedTaskId=!del&&target.done?target.id:'';
 render();
 window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
}
/* SEYVEO · Recently Deleted. Deletion is reversible for thirty days;
   attachments stay attached until final disposal, not until a toast expires. */
const SV_TASK_TRASH_KEY='seyveo-personal-tasks-trash-v1';
const SV_TASK_TRASH_AGE_MS=30*24*60*60*1000;
const SV_TASK_TRASH_LIMIT=600;
function svTrashWrite(entries){
 try{localStorage.setItem(SV_TASK_TRASH_KEY,JSON.stringify(entries));return true}
 catch{return false}
}
function svTrashRead(){
 let parsed=[];
 try{const value=JSON.parse(localStorage.getItem(SV_TASK_TRASH_KEY)||'[]');if(Array.isArray(value))parsed=value}catch{}
 const now=Date.now(),active=[],expired=[];
 for(const row of parsed){
  if(!row?.task||typeof row.task.id!=='string'||typeof row.task.title!=='string'||
     !Number.isFinite(Date.parse(row.deletedAt)))continue;
  if(now-Date.parse(row.deletedAt)>=SV_TASK_TRASH_AGE_MS)expired.push(row.task.id);
  else active.push(row);
 }
 if(expired.length&&svTrashWrite(active))void window.SEYVEO_TASK_ATTACHMENTS?.removeFor?.(expired);
 return active;
}
function svTrashChanged(){
 justCompletedTaskId='';render();
 window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
}
function svTrashArchiveMany(ids){
 if(!Array.isArray(ids)||!ids.length)return false;
 const wanted=new Set(ids.filter(id=>typeof id==='string'));
 const all=read(),moving=all.filter(item=>wanted.has(item.id));
 if(!moving.length)return false;
 const previous=svTrashRead();
 const remainingTrash=previous.filter(row=>!wanted.has(row.task.id));
 if(remainingTrash.length+moving.length>SV_TASK_TRASH_LIMIT)return false;
 const deletedAt=new Date().toISOString();
 if(!svTrashWrite([...remainingTrash,...moving.map(task=>({task,deletedAt}))]))return false;
 if(!save(all.filter(item=>!wanted.has(item.id)))){
  svTrashWrite(previous);return false;
 }
 svTrashChanged();return true;
}
function svTrashRestoreMany(ids){
 if(!Array.isArray(ids)||!ids.length)return false;
 const wanted=new Set(ids.filter(id=>typeof id==='string'));
 const trash=svTrashRead(),found=trash.filter(row=>wanted.has(row.task.id));
 const all=read(),existing=new Set(all.map(item=>item.id));
 const restoring=found.filter(row=>!existing.has(row.task.id)).map(row=>row.task);
 if(!found.length||all.length+restoring.length>MAX)return false;
 if(!save([...all,...restoring]))return false;
 if(!svTrashWrite(trash.filter(row=>!wanted.has(row.task.id)))){
  save(all);return false;
 }
 svTrashChanged();return true;
}
function svTrashRemoveMany(ids){
 if(!Array.isArray(ids)||!ids.length)return false;
 const wanted=new Set(ids.filter(id=>typeof id==='string'));
 const trash=svTrashRead(),removed=trash.filter(row=>wanted.has(row.task.id));
 if(!removed.length||!svTrashWrite(trash.filter(row=>!wanted.has(row.task.id))))return false;
 void window.SEYVEO_TASK_ATTACHMENTS?.removeFor?.(removed.map(row=>row.task.id));
 window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
 return true;
}
window.SEYVEO_PERSONAL_TASK_TRASH=Object.freeze({
 list:()=>svTrashRead().map(row=>({id:row.task.id,title:row.task.title,
  due:row.task.due,done:row.task.done,deletedAt:row.deletedAt,
  expiresAt:new Date(Date.parse(row.deletedAt)+SV_TASK_TRASH_AGE_MS).toISOString()}))
  .sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt)),
 restore:ids=>svTrashRestoreMany(Array.isArray(ids)?ids:[ids]),
 removePermanently:ids=>svTrashRemoveMany(Array.isArray(ids)?ids:[ids]),
 archive:ids=>svTrashArchiveMany(Array.isArray(ids)?ids:[ids])
});
/* Completed personal tasks remain in the original local store for History. */
window.SEYVEO_PERSONAL_TASK_HISTORY=Object.freeze({
 completed:()=>read().filter(item=>item.done).sort((a,b)=>(b.doneAt||b.createdAt).localeCompare(a.doneAt||a.createdAt)),
 removeCompleted:id=>{
  const all=read(),item=all.find(task=>task.id===id&&task.done);
  if(!item)return false;
  return svTrashArchiveMany([id]);
 },
 clearCompleted:()=>{
  const ids=read().filter(item=>item.done).map(item=>item.id);
  return ids.length?svTrashArchiveMany(ids):true;
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
  return svTrashArchiveMany(ids);
 },
 rescheduleMany:(ids,due)=>{
  if(!Array.isArray(ids)||!ids.length||ids.length>MAX||typeof due!=='string'||!strDate(due))return false;
  const chosen=new Set(ids);
  let records;try{records=JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return false}
  if(!Array.isArray(records))return false;
  const active=new Set(read().filter(t=>!t.done).map(t=>t.id));
  if([...chosen].some(id=>!active.has(id)))return false;
  const next=records.map(t=>t&&chosen.has(t.id)?{...t,due}:t);
  try{localStorage.setItem(KEY,JSON.stringify(next))}catch{return false}
  render();
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
 showCreator(task);
 $('personalTaskDialogTitle').textContent='Изменить дело';
 $('personalTaskSave').setAttribute('aria-label','Сохранить изменения');$('personalTaskSave').title='Сохранить изменения';
 input.value=task.title;syncTaskSaveState();
 const categoryChoice=form.querySelector('input[name="personalTaskCategory"][value="'+svTaskCategory(task)+'"]');
 if(categoryChoice)categoryChoice.checked=true;
 svSyncTaskListChoice();
 const typeChoice=form.querySelector('input[name="personalTaskType"][value="'+svTaskEntryType(task)+'"]');
 if(typeChoice)typeChoice.checked=true;
 date.value=task.due;
 if($('personalTaskNotes'))$('personalTaskNotes').value=task.notes||'';
 if($('personalTaskURL'))$('personalTaskURL').value=task.url||'';
 if($('personalTaskRepeat'))$('personalTaskRepeat').value=task.repeat||'none';
 if($('personalTaskPriority'))$('personalTaskPriority').value=task.priority||'none';
 if($('personalTaskShowOnHome'))$('personalTaskShowOnHome').checked=task.showOnHome===undefined?true:task.showOnHome===true;
 if($('personalTaskTime'))$('personalTaskTime').value=task.time||'';
 dialog.dispatchEvent(new Event('sv-task-editor-sync'));
 window.SEYVEO_TASK_PLACE_EDITOR?.load?.(task.place);
 window.SEYVEO_TASK_TRAVEL_EDITOR?.load?.(task.travel);
 window.SEYVEO_TASK_ATTACHMENTS?.load?.(task.id,task.attachment);
 syncDueDateDisplay();
 $('personalTaskStatus').textContent='Изменения сохраняются только после вашего подтверждения.';
 focusTaskWriting();
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
/* One deliberate tap opens the real editor. A horizontal drag only reveals a
   button; it NEVER deletes by itself. Touch scrolling stays native on iOS. */
const SV_SWIPE_WIDTH=88;
let svSwipeOpenRow=null,svSwipePointer=null,svSwipeLongTimer=0,svSwipeIgnoreClickUntil=0;
let svSwipeIgnoredRow=null;
let svTaskContext=null,svTaskUndo=null;
function svSetTaskSwipe(row,offset,dragging=false){
 if(!row)return;
 const value=Math.max(-SV_SWIPE_WIDTH,Math.min(0,offset));
 row.style.setProperty('--sv-task-swipe-offset',value+'px');
 row.classList.toggle('is-swipe-dragging',dragging);
 row.classList.toggle('is-swipe-open',value<=-SV_SWIPE_WIDTH/2);
 const button=row.querySelector('[data-task-swipe-delete]');
 if(button){
  button.tabIndex=value<=-SV_SWIPE_WIDTH/2?0:-1;
  button.setAttribute('aria-hidden',value<=-SV_SWIPE_WIDTH/2?'false':'true');
 }
 if(value===-SV_SWIPE_WIDTH)svSwipeOpenRow=row;
 else if(svSwipeOpenRow===row)svSwipeOpenRow=null;
}
function svCloseTaskSwipe(except){
 if(svSwipeOpenRow&&svSwipeOpenRow!==except)svSetTaskSwipe(svSwipeOpenRow,0);
}
function svCloseTaskContext(){
 svTaskContext?.remove();svTaskContext=null;
}
function svOpenTaskEditor(row){
 if(!row)return;
 svCloseTaskSwipe();svCloseTaskContext();
 if(row.dataset.calendarId){
  window.dispatchEvent(new CustomEvent('seyveo:calendar-open-entry',{detail:{id:row.dataset.calendarId}}));
  return;
 }
 const id=row.dataset.taskId;
 const task=read().find(item=>item.id===id&&!item.done);
 if(task)window.dispatchEvent(new CustomEvent('seyveo:home-task-edit',{detail:{id}}));
 else row.querySelector('[data-task-menu]')?.click();
}
function svOpenTaskContext(row){
 svCloseTaskContext();svCloseTaskSwipe();
 const id=row.dataset.taskId;
 if(!id)return;
 const menu=element('div','sv-task-context-menu');
 menu.setAttribute('role','menu');menu.setAttribute('aria-label','Действия с делом');
 const edit=element('button','','Изменить');
 edit.type='button';edit.setAttribute('role','menuitem');
 const editGlyph=window.SEYVEO_DOCUMENT_ICONS?.markup('edit');if(editGlyph)edit.insertAdjacentHTML('afterbegin',editGlyph);
 edit.addEventListener('click',()=>svOpenTaskEditor(row));
 menu.append(edit);
 if(!row.dataset.calendarId){
  const remove=element('button','sv-task-context-delete','Удалить');
  remove.type='button';remove.setAttribute('role','menuitem');
  const deleteGlyph=window.SEYVEO_DOCUMENT_ICONS?.markup('delete');if(deleteGlyph)remove.insertAdjacentHTML('afterbegin',deleteGlyph);
  remove.addEventListener('click',()=>{svCloseTaskContext();svDeleteTaskWithUndo(id)});
  menu.append(remove);
 }
 document.body.append(menu);svTaskContext=menu;
 const rect=row.getBoundingClientRect(),width=menu.offsetWidth,height=menu.offsetHeight;
 const left=Math.max(12,Math.min(rect.left+Math.min(35,rect.width/4),innerWidth-width-12));
 const preferredTop=rect.bottom+height+16<innerHeight-74?rect.bottom+6:rect.top-height-6;
 const top=Math.max(12,Math.min(preferredTop,innerHeight-height-12));
 menu.style.left=left+'px';menu.style.top=top+'px';
 menu.dataset.svOpensUp=String(top<rect.top);
 edit.focus({preventScroll:true});
}
function svNotifyTaskStoreChanged(){
 window.dispatchEvent(new Event('seyveo:personal-tasks-changed'));
 window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
}
function svFinalizeTaskUndo(){
 if(!svTaskUndo)return;
 const pending=svTaskUndo;svTaskUndo=null;
 clearTimeout(pending.timeout);pending.toast.remove();
 // The archived task and its attachments remain recoverable for 30 days.
}
function svDeleteTaskWithUndo(id){
 const all=read(),index=all.findIndex(task=>task.id===id);
 if(index<0)return;
 svFinalizeTaskUndo();
 if(!svTrashArchiveMany([id])){
  showTaskError('Не удалось переместить дело в «Недавно удалённые». Проверьте память устройства.');return;
 }
 svCloseTaskSwipe();svCloseTaskContext();
 const toast=element('div','sv-task-undo-toast');
 toast.setAttribute('role','status');
 const message=element('span','','Дело в «Недавно удалённых»');
 const undo=element('button','','Отменить');undo.type='button';
 toast.append(message,undo);document.body.append(toast);
 const pending={task:all[index],index,toast,timeout:0};svTaskUndo=pending;
 undo.addEventListener('click',()=>{
  if(svTaskUndo!==pending)return;
  if(!svTrashRestoreMany([pending.task.id])){
   showTaskError('Не удалось вернуть дело. Проверьте память устройства.');return;
  }
  clearTimeout(pending.timeout);pending.toast.remove();svTaskUndo=null;
 });
 pending.timeout=window.setTimeout(svFinalizeTaskUndo,6000);
}
function svClearTaskLongTimer(){clearTimeout(svSwipeLongTimer);svSwipeLongTimer=0;}
list.addEventListener('pointerdown',event=>{
 if(event.pointerType==='mouse'&&event.button!==0)return;
 const row=event.target.closest?.('.sv-agenda-entry[data-task-id]');
 if(!row||event.target.closest('[data-task-swipe-delete]'))return;
 if(event.target.closest('[data-task-toggle],[data-task-call],[data-task-origin]'))return;
 svSwipeIgnoreClickUntil=0;svSwipeIgnoredRow=null;
 svCloseTaskContext();svCloseTaskSwipe(row);
 svSwipePointer={id:event.pointerId,row,x:event.clientX,y:event.clientY,
  initial:row.classList.contains('is-swipe-open')?-SV_SWIPE_WIDTH:0,dragging:false,long:false};
 if(event.pointerType!=='mouse'){
  svClearTaskLongTimer();
  svSwipeLongTimer=window.setTimeout(()=>{
   if(!svSwipePointer||svSwipePointer.id!==event.pointerId||svSwipePointer.dragging)return;
   svSwipePointer.long=true;svSwipeIgnoredRow=row;svSwipeIgnoreClickUntil=performance.now()+700;
   svOpenTaskContext(row);
  },570);
 }
},{passive:true});
list.addEventListener('pointermove',event=>{
 const state=svSwipePointer;
 if(!state||state.id!==event.pointerId||state.long)return;
 const dx=event.clientX-state.x,dy=event.clientY-state.y;
 if(!state.dragging){
  if(Math.abs(dy)>9&&Math.abs(dy)>Math.abs(dx)){svClearTaskLongTimer();svSwipePointer=null;return;}
  if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.3){
   svClearTaskLongTimer();
   if(!state.row.querySelector('[data-task-swipe-delete]')){svSwipePointer=null;return;}
   state.dragging=true;
  }else if(Math.abs(dx)>9||Math.abs(dy)>9)svClearTaskLongTimer();
 }
 if(state.dragging)svSetTaskSwipe(state.row,state.initial+dx,true);
},{passive:true});
function svFinishTaskPointer(event,cancelled=false){
 const state=svSwipePointer;
 if(!state||state.id!==event.pointerId)return;
 svClearTaskLongTimer();svSwipePointer=null;
 if(state.dragging){
  const distance=state.initial+event.clientX-state.x;
  svSetTaskSwipe(state.row,!cancelled&&distance<-(SV_SWIPE_WIDTH/2)?-SV_SWIPE_WIDTH:0);
  svSwipeIgnoredRow=state.row;
  svSwipeIgnoreClickUntil=performance.now()+480;
 }else if(state.long){svSwipeIgnoredRow=state.row;svSwipeIgnoreClickUntil=performance.now()+650;}
}
document.addEventListener('pointerup',event=>svFinishTaskPointer(event),{capture:true,passive:true});
document.addEventListener('pointercancel',event=>svFinishTaskPointer(event,true),{capture:true,passive:true});
list.addEventListener('click',event=>{
 if(performance.now()>=svSwipeIgnoreClickUntil||
  event.target.closest?.('[data-task-swipe-delete]')||
  event.target.closest?.('.sv-agenda-entry[data-task-id]')!==svSwipeIgnoredRow)return;
 event.preventDefault();event.stopImmediatePropagation();
},{capture:true});
list.addEventListener('contextmenu',event=>{
 const row=event.target.closest?.('.sv-agenda-entry[data-task-id]');
 if(!row)return;
 event.preventDefault();svClearTaskLongTimer();svSwipePointer=null;
 svOpenTaskContext(row);
});
list.addEventListener('scroll',()=>{svClearTaskLongTimer();svCloseTaskContext();svCloseTaskSwipe();},{passive:true});
document.addEventListener('pointerdown',event=>{
 if(svTaskContext&&!svTaskContext.contains(event.target))svCloseTaskContext();
 if(svSwipeOpenRow&&!svSwipeOpenRow.contains(event.target))svCloseTaskSwipe();
},{capture:true,passive:true});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){svCloseTaskContext();svCloseTaskSwipe();}
});
window.addEventListener('hashchange',()=>{svCloseTaskContext();svCloseTaskSwipe();});
form.addEventListener('submit',put);
$('personalAddHome').addEventListener('click',openDialog);
$('personalAddTasks').addEventListener('click',openDialog);
$('personalTaskCancel').addEventListener('click',exitTaskEditor);
list.addEventListener('click',e=>{
 const btn=e.target.closest('button');
 if(!btn){
  const row=e.target.closest('.sv-task-swipe-foreground')?.closest('.sv-agenda-entry[data-task-id]');
  if(row)svOpenTaskEditor(row);
  return;
 }
 if(btn.dataset.taskSwipeDelete)svDeleteTaskWithUndo(btn.dataset.taskSwipeDelete);
 else if(btn.dataset.deferredSayvi){
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
 else if(btn.dataset.taskAttachment){
  void window.SEYVEO_TASK_ATTACHMENTS?.openFor?.(btn.dataset.taskAttachment)
   ?.then(ok=>{if(!ok)showTaskError('Не удалось открыть файл на этом устройстве.')});
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
  focusTaskWriting();
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
dialog.addEventListener('close',()=>{taskEditorSavedOnExit=false});
window.addEventListener('hashchange',()=>{if(dialog.open)exitTaskEditor();});
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
 focusTaskWriting();
});
/* A draft explicitly requested in Sayvi's separate chat opens this same
   validated editor; neither the chat nor this handoff saves the task. */
function openSayviTaskDraft(){
 const handoff=window.SEYVEO_TASK_HANDOFF;
 const title=handoff?.take?.();
 if(!title||dialog.open)return;
 // Personal Tasks is loaded before the date/venue readers on Home. The
 // handoff must wait for DOMContentLoaded: timers may run while the HTML
 // parser is still waiting for later scripts on a slower phone connection.
 if(!window.SEYVEO_TASK_SMART_NL||!window.SEYVEO_TASK_PLACE_EDITOR||!window.SEYVEO_TASK_SCREEN)return;
 handoff.clear();
 openDialog();
 input.value=title;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 dialog.dispatchEvent(new Event('sv-task-editor-sync'));
 // Recognition and venue selection are shown in their proper cards; do not
 // show a red error/status message for a normal draft handoff.
 $('personalTaskStatus').textContent='';
 syncTaskSaveState();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openSayviTaskDraft,{once:true});
else setTimeout(openSayviTaskDraft,0);
/* Explicit one-click approval of up to five tasks from a reviewed Notebook plan.
   Same local task store and renderer as the normal task editor. Atomic write,
   existing and within-plan duplicates are skipped; never truncate old tasks. */
window.addEventListener('seyveo:tasks-plan-batch',event=>{
 const detail=event.detail;
 if(window.SEYVEO_TASK_COMMIT?.saveBatch){
  const result=window.SEYVEO_TASK_COMMIT.saveBatch(detail?.items,{
   createdBy:detail?.createdBy,sourceNoteId:safeNoteId(detail?.sourceNoteId),
   classify:window.SEYVEO_TASK_CLASSIFY
  });
  if(detail)detail.result=result;
  if(result.status==='saved'){
   justCompletedTaskId='';render();
   window.dispatchEvent(new CustomEvent('seyveo:future-committed',{detail:{area:'tasks'}}));
  }
  return;
 }
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
 const createdBy=detail.createdBy==='sayvi'?'sayvi':'user';
 const next=all.concat(pending.map((draft,index)=>({
  id:'personal-'+stamp+'-'+index+'-'+Math.random().toString(36).slice(2,9),
  title:draft.title,due:draft.due,time:draft.time||'',category:svSuggestTaskCategory(draft.title),entryType:svInferEntryType(draft.title),done:false,createdAt,doneAt:'',createdBy,
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
// Agenda entry owns its one render. The route event and Work visibility
// changes below are coalesced, instead of rebuilding on hashchange too.
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden&&!svAgendaIsOpen())render();
});
// The list owns vertical momentum. Never intercept touchmove or emulate
// scrolling with JavaScript: iOS handles the gesture and its deceleration.
function svAgendaAlignInitial(){
 if(svAgendaInitiallyAligned||svAgendaUserInteracted||!document.documentElement.classList.contains('sv-agenda-scroll-active')||!list.clientHeight)return;
 const strip=document.querySelector('#svTasksDateNav .sv-agenda-week');
 const track=strip?.querySelector('.sv-agenda-track');
 const unit=track?.firstElementChild?.getBoundingClientRect().width||0;
 if(!strip?.clientWidth||!unit)return;
 const today=svTaskISO(new Date());
 const todayDay=track.querySelector('.sv-agenda-day[data-day="'+today+'"]');
 if(!todayDay)return;
 svAgendaInitiallyAligned=true;
 svTaskSelectedDate=today;svTaskWindowStart=today;
 svAgendaIgnoreStripScrollUntil=Date.now()+800;
 strip.scrollTo({left:[...track.children].indexOf(todayDay)*unit,behavior:'instant'});
 svAgendaMarkSelected(today);
 svAgendaAnchorCache=null;
 const anchor=svAgendaGetAnchors().find(item=>item.iso===today);
 if(anchor){
  svAgendaEnsureReachable(anchor.top);
  svAgendaDockPreviousY=anchor.top;
  list.scrollTo({top:anchor.top,behavior:'instant'});
 }
 svAgendaSyncPinnedDate();
}
/* Every fresh entry into My Tasks starts at today, including a PWA resume.
   A user may then browse other dates; that browsing is never overwritten
   during the same visit except by the deliberately requested Today action. */
function svAgendaIsOpen(){
 const shell=$('svWorkShell');
 return location.hash==='#tasks'&&!$('tasksPage')?.hidden&&
  document.documentElement.classList.contains('sv-agenda-scroll-active')&&
  (!shell||(shell.dataset.active==='personal'&&shell.dataset.taskToolMode!=='all'));
}
let svAgendaEntryFrame=0;
function svAgendaQueueEntry(){
 if(!svAgendaIsOpen())svAgendaWasOpen=false;
 if(svAgendaEntryFrame)return;
 svAgendaEntryFrame=requestAnimationFrame(()=>{svAgendaEntryFrame=0;svAgendaOpenAtToday();});
}
function svAgendaOpenAtToday(){
 const open=svAgendaIsOpen();
 if(!open){svAgendaWasOpen=false;return;}
 if(svAgendaWasOpen)return;
 svAgendaWasOpen=true;
 if(svAgendaExplicitFocus){svAgendaExplicitFocus=false;return;}
 svAgendaStopRoulette();svAgendaCancelDateJump();clearTimeout(svAgendaTodayTimer);
 svAgendaUserInteracted=false;svAgendaInitiallyAligned=false;
 svAgendaOpeningUntil=Date.now()+900;
 svTaskSelectedDate=svTaskISO(new Date());svTaskWindowStart=svTaskSelectedDate;
 render(true);
 // This entry already runs inside a coalesced frame. Align now, without
 // another frame showing an old scroll position. ResizeObserver can retry.
 svAgendaAlignInitial();
}
new MutationObserver(()=>{svAgendaAnchorCache=null;})
 .observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
if(window.ResizeObserver)new ResizeObserver(()=>{
 svAgendaAnchorCache=null;
 svAgendaPrepareTail();
 if(!svAgendaInitiallyAligned)requestAnimationFrame(svAgendaAlignInitial);
}).observe(list);
window.addEventListener('resize',()=>{svAgendaAnchorCache=null;if(!svAgendaInitiallyAligned)requestAnimationFrame(svAgendaAlignInitial);},{passive:true});
document.fonts?.ready?.then(()=>{svAgendaAnchorCache=null;if(!svAgendaInitiallyAligned)requestAnimationFrame(svAgendaAlignInitial);});
list.addEventListener('pointerdown',svAgendaCancelDateJump,{passive:true});
list.addEventListener('touchstart',svAgendaCancelDateJump,{passive:true});
list.addEventListener('wheel',svAgendaCancelDateJump,{passive:true});
list.addEventListener('scroll',()=>{
 svAgendaSyncDockFromScroll();
 if(svAgendaInitiallyAligned&&!svAgendaRolling)svAgendaQueueToday();
 if(svAgendaScrollFrame)return;
 svAgendaScrollFrame=requestAnimationFrame(()=>{
  svAgendaScrollFrame=0;
  svAgendaSyncFromScroll();
 });
},{passive:true});
document.addEventListener('pointerdown',event=>{
 if(!event.target.closest?.('#tasksPage'))return;
 svAgendaPointerHeld=true;
 clearTimeout(svAgendaTodayTimer);
 if(svAgendaRolling)svAgendaStopRoulette();
 if(event.target.closest?.('#svTasksDateNav')){
  svAgendaPauseDockMotion();
  svAgendaUserInteracted=true;
 }
},{passive:true,capture:true});
window.addEventListener('pointerup',()=>{if(svAgendaPointerHeld){svAgendaPointerHeld=false;svAgendaQueueToday();}},{passive:true});
window.addEventListener('pointercancel',()=>{svAgendaPointerHeld=false;svAgendaQueueToday();},{passive:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){clearTimeout(svAgendaTodayTimer);svAgendaStopRoulette();}
 else{svAgendaWasOpen=false;svAgendaQueueEntry();}
});
dialog.addEventListener('close',svAgendaPauseDockMotion);
new MutationObserver(()=>{
 if(!document.documentElement.classList.contains('sv-agenda-scroll-active')&&
    document.documentElement.classList.contains('sv-agenda-dock-minimized'))svAgendaPauseDockMotion();
 svAgendaQueueEntry();
}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
window.addEventListener('seyveo:route-changed',()=>svAgendaQueueEntry());
if(svAgendaDockMedia.addEventListener)svAgendaDockMedia.addEventListener('change',svAgendaPauseDockMotion);
render();
svAgendaQueueEntry();
window.addEventListener('pageshow',()=>{
 svAgendaWasOpen=false;
 svAgendaQueueEntry();
});
// The optional “Посмотреть в делах” action from Sayvi selects the saved day.
try{
 const focused=sessionStorage.getItem('seyveo.sayvi.task-focus-date.v1');
 sessionStorage.removeItem('seyveo.sayvi.task-focus-date.v1');
 if(svTaskDate(focused)){
  svAgendaExplicitFocus=true;
  svAgendaUserInteracted=true;
  requestAnimationFrame(()=>svAgendaJumpToDate(focused));
 }
}catch{}
})();
