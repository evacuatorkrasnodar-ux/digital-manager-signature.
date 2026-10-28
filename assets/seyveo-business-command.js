/* SEYVEO · Business Command — isolated local prototype.
 * No chat transport, corporate server, identity verification or file uploads.
 * Personal SEYVEO / My World data is never read by this module.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=$('seyveoBusinessCommandPage');
if(!root)return;
const CHAT_KEY='seyveo-business-command-chat-demo-v1';
const TASK_KEY='seyveo-business-command-tasks-demo-v1';
const ROOMS=[
 {id:'general',label:'Общий чат',kind:'groups',hint:'Группа для всей команды',mark:'◎'},
 {id:'team',label:'Моя команда',kind:'groups',hint:'Рабочая группа',mark:'▦'},
 {id:'docs',label:'Документы',kind:'groups',hint:'Обсуждение рабочих файлов',mark:'▤'},
 {id:'dm-elena',label:'Елена',kind:'personal',hint:'Администратор · личный рабочий чат',mark:'Е',person:'elena'},
 {id:'dm-anna',label:'Анна',kind:'personal',hint:'Старший продавец · личный рабочий чат',mark:'А',person:'anna'},
 {id:'dm-mikhail',label:'Михаил',kind:'personal',hint:'Продавец · личный рабочий чат',mark:'М',person:'mikhail'},
 {id:'dm-sayvi',label:'Сэйви',kind:'personal',hint:'Рабочая помощница · шаблонное демо',mark:'✧',person:'sayvi'}
];
const state={tab:'chats',room:'general',filter:'all',viewpoint:'manager',file:null,objectUrl:null,replyTo:null,draftSource:null,chat:read(CHAT_KEY),tasks:read(TASK_KEY)};
function read(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.slice(-100):[]}catch{return []}}
function save(key,list){try{localStorage.setItem(key,JSON.stringify(list));return true}catch{setStatus('Не удалось сохранить на этом устройстве. Проверьте свободное место и разрешения браузера.');return false}}
function setStatus(s){const el=$('svcpChatStatus');if(el)el.textContent=s}
function el(tag,cls,txt){const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node}

/* Reuse the working employee, shift, recruitment and ROI widgets rather than
   creating parallel copies. Moving existing DOM nodes preserves their listeners. */
function peopleView(name){
 const hiring=name==='hiring';
 const directory=$('svcpPeopleDirectory'),recruitment=$('svcpPeopleHiring');
 if(directory)directory.hidden=hiring;
 if(recruitment)recruitment.hidden=!hiring;
 root.querySelectorAll('[data-svcp-people]').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.svcpPeople===(hiring?'hiring':'team')));
 });
}
function preparePeopleContent(){
 const cards=$('seyveoStaffCards'),cardsHost=$('svcpPeopleCardsHost');
 if(cards&&cardsHost){
  const obsoleteWrapper=cards.closest('details.seyveo-hr-fold');
  cardsHost.append(cards);
  // This wrapper belonged to the old recruiting menu and is now empty.
  obsoleteWrapper?.remove();
 }
 const shiftFold=$('seyveoShiftToggle')?.closest('details.seyveo-hr-fold');
 const shiftHost=$('svcpPeopleShiftHost');
 if(shiftFold&&shiftHost)shiftHost.append(shiftFold);
 const interview=$('seyveoHrDemoOpen');
 const recruitingBody=interview?.closest('details.seyveo-manage-fold')?.querySelector('.seyveo-manage-fold-body');
 const recruitingHost=$('svcpPeopleHiringHost');
 if(recruitingBody&&recruitingHost)recruitingHost.append(...Array.from(recruitingBody.childNodes));
 const roi=$('seyveoRoiForm'),roiHost=$('pictureEfficiencyHost');
 if(roi&&roiHost)roiHost.append(roi);
 peopleView('team');
}
root.querySelectorAll('[data-svcp-people]').forEach(button=>
 button.addEventListener('click',()=>peopleView(button.dataset.svcpPeople)));
function tab(name){
 if(!['chats','team','tasks'].includes(name))return;
 state.tab=name;
 root.querySelectorAll('[data-svcp-panel]').forEach(section=>{section.hidden=section.dataset.svcpPanel!==name});
 if(name==='tasks')renderTasks();
 if(name==='chats')showInbox();
 if(name==='team')peopleView('team');
}
root.querySelectorAll('[data-svcp-room]').forEach(button=>
 button.addEventListener('click',()=>openRoom(button.dataset.svcpRoom)));
const STAFF={elena:'Елена',anna:'Анна',mikhail:'Михаил'};
function roomDetails(){return ROOMS.find(x=>x.id===state.room)||ROOMS[0]}
function senderName(msg){
 if(msg.role==='sayvi')return 'Сэйви · демо';
 if(msg.role==='demo-elena')return 'Елена · учебный пример';
 return roomDetails().kind==='personal'?'Руководитель · демо':'Вы · демо';
}
function renderDirectory(){
 const list=$('svcpConversationList');if(!list)return;
 list.replaceChildren();
 root.querySelectorAll('[data-svcp-filter]').forEach(button=>
  button.setAttribute('aria-pressed',String(button.dataset.svcpFilter===state.filter)));
 for(const room of ROOMS){
  if(state.filter!=='all'&&room.kind!==state.filter)continue;
  const row=el('button','svcp-directory-item');row.type='button';
  row.setAttribute('aria-label','Открыть '+(room.kind==='personal'?'личный чат ':'группу ')+room.label);
  const art=el('span','svcp-directory-avatar'+(room.person==='sayvi'?' is-sayvi':''),room.mark);
  art.setAttribute('aria-hidden','true');
  const main=el('span','svcp-directory-item-body');
  const last=state.chat.filter(x=>x&&x.room===room.id&&typeof x.text==='string').slice(-1)[0];
  const preview=el('span','svcp-directory-preview',
   last?(last.role==='sayvi'?'Сэйви: ':last.role==='demo-elena'?'Елена (демо): ':'Вы: ')+last.text.replace(/\s+/g,' ').slice(0,76):
   room.kind==='personal'?'Написать лично · демо':'Открыть группу');
  main.append(el('strong','',room.label),el('small','',room.hint),preview);
  const arrow=el('span','svcp-directory-chevron','›');arrow.setAttribute('aria-hidden','true');
  row.append(art,main,arrow);
  row.addEventListener('click',()=>openRoom(room.id));
  list.append(row);
 }
}
function showInbox(){
 state.viewpoint='manager';
 $('svcpChatDirectory').hidden=false;
 $('svcpConversation').hidden=true;
 $('svcpReturnToTasks').hidden=true;
 $('svcpTaskDiscussionQuick').hidden=true;
 clearReply();cancelTaskDraft();cleanupPreview();
 renderDirectory();
}
function openRoom(roomId){
 const selected=ROOMS.find(x=>x.id===roomId);if(!selected)return;
 state.room=selected.id;
 state.viewpoint='manager';
 $('svcpChatDirectory').hidden=true;
 $('svcpConversation').hidden=false;
 $('svcpConversationTitle').textContent=selected.label;
 clearReply();cancelTaskDraft();cleanupPreview();
 $('svcpOpenTasks').hidden=true;
 $('svcpPreviewOnHome').hidden=true;
 $('svcpReturnToTasks').hidden=true;
 $('svcpTaskDiscussionQuick').hidden=true;
 updatePerspective();renderChat();
}
function updatePerspective(){
 const current=roomDetails();
 const allowed=current.kind==='groups'||current.id==='dm-elena';
 const button=$('svcpElenaPerspective');
 button.hidden=!allowed;
 button.textContent=state.viewpoint==='elena'?'Вернуться к руководителю':'Взгляд Елены';
 button.setAttribute('aria-pressed',String(state.viewpoint==='elena'));
 $('svcpConversationDetail').textContent=state.viewpoint==='elena'
  ?'Как выглядел бы чат у Елены · учебный пример'
  :current.hint+' · на одном устройстве';
 $('svcpMentionElena').hidden=current.kind!=='groups';
 const chips=root.querySelector('.svcp-rooms');if(chips)chips.hidden=current.kind!=='groups';
 $('svcpChatInput').placeholder=state.viewpoint==='elena'?'Ответ Елены · локальное демо…':current.person==='sayvi'?'Спросить Сэйви · демо…':'Сообщение или @Сэйви…';
}
root.querySelectorAll('[data-svcp-filter]').forEach(button=>
 button.addEventListener('click',()=>{state.filter=button.dataset.svcpFilter;renderDirectory()}));
$('svcpConversationBack')?.addEventListener('click',showInbox);
$('svcpElenaPerspective')?.addEventListener('click',()=>{
 state.viewpoint=state.viewpoint==='elena'?'manager':'elena';
 clearReply();cancelTaskDraft();updatePerspective();renderChat();
});
$('svcpMentionElena')?.addEventListener('click',()=>{
 const input=$('svcpChatInput');if(!input)return;
 input.value=(input.value.trim()?input.value.trim()+' ':'')+'@Елена ';
 input.focus({preventScroll:true});
 input.setSelectionRange(input.value.length,input.value.length);
});

function formatTime(ts){
 const dt=new Date(ts);
 return Number.isFinite(dt.getTime())?dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'';
}
function renderChat(){
 root.querySelectorAll('[data-svcp-room]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.svcpRoom===state.room)));
 const thread=$('svcpMessages');if(!thread)return;
 thread.replaceChildren();
 const messages=state.chat.filter(x=>x&&x.room===state.room&&typeof x.text==='string').slice(-35);
 if(!messages.length){
  thread.append(el('p','svcp-note','Пока нет сообщений. Напишите заметку для команды или позовите Сэйви через @Сэйви. Это локальная демонстрация.'));
 }else{
  for(const msg of messages){
   const isSayvi=msg.role==='sayvi';
   const isOwn=state.viewpoint==='elena'?msg.role==='demo-elena':!isSayvi&&msg.role!=='demo-elena';
   const mentioned=state.viewpoint==='elena'&&roomDetails().kind==='groups'&&msg.text.toLocaleLowerCase('ru-RU').includes('@елена');
   const bubble=el('article','svcp-bubble '+(isSayvi?'is-sayvi':isOwn?'is-self':'is-other')+(mentioned?' is-mentioned':''));
   bubble.setAttribute('aria-label',isSayvi?'Демонстрационная подсказка Сэйви':senderName(msg));
   const meta=el('div','svcp-bubble-meta');
   meta.append(el('strong','svcp-sender',senderName(msg)),el('time','svcp-time',formatTime(msg.at)));
   bubble.append(meta);
   if(msg.replyTo&&typeof msg.replyTo.text==='string'){
    bubble.append(el('div','svcp-quote',(msg.replyTo.sender||'Сообщение')+' · '+msg.replyTo.text.slice(0,160)));
   }
   bubble.append(el('span','svcp-message-text',msg.text));
   if(mentioned)bubble.append(el('small','svcp-mention-notice','Упоминание Елены · уведомление не отправлено'));
   const actions=el('div','svcp-message-actions');
   actions.append(btn('Ответить',()=>startReply(msg),'svcp-message-action'));
   if(!isSayvi||typeof msg.suggestTask==='string'&&msg.suggestTask.trim()){
    actions.append(btn(isSayvi?'Подготовить поручение':'В поручение',()=>prepareTask(msg),'svcp-message-action'));
   }
   bubble.append(actions);thread.append(bubble);
  }
 }
 thread.scrollTop=thread.scrollHeight;
}
function startReply(msg){
 state.replyTo={text:String(msg.text||'').slice(0,160),sender:senderName(msg)};
 $('svcpReplyText').textContent='Ответ на: '+state.replyTo.sender+' · '+state.replyTo.text;
 $('svcpReplyPreview').hidden=false;
 $('svcpChatInput')?.focus({preventScroll:true});
}
function clearReply(){state.replyTo=null;$('svcpReplyPreview').hidden=true;$('svcpReplyText').textContent=''}
$('svcpReplyCancel')?.addEventListener('click',clearReply);
function suggestFromChat(message){
 const request=message.replace(/@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)\s*[,—:-]?\s*/gi,'').trim();
 if(/возврат|вернуть товар/i.test(request))return {
  text:'В этой демонстрации инструкции компании ещё не подключены. Лучше уточнить утверждённый порядок возврата у ответственного. Могу подготовить поручение на проверку.',
  task:'Уточнить утверждённый порядок возврата товара'
 };
 if(/график|смен[ыуе]|выходн/i.test(request))return {
  text:'Могу подготовить поручение по графику. Для точного ответа о сменах сначала нужны согласованные данные компании.',
  task:'Уточнить и подтвердить график смен'
 };
 if(/поруч|задач|подготов|проверь|нужно|сдела|договор|заказ|отчёт|отчет|план|напомни/i.test(request))return {
  text:'Могу оформить сказанное как поручение. Проверьте формулировку и подтвердите добавление — без этого ничего не запишу.',
  task:request.slice(0,140)
 };
 return {
  text:'Я здесь. Сейчас это пробная подсказка без подключения ИИ и корпоративных инструкций. Могу помочь подготовить поручение из конкретного рабочего сообщения — после вашего подтверждения.',
  task:''
 };
}
function prepareTask(msg){
 const proposed=typeof msg.suggestTask==='string'&&msg.suggestTask.trim()?msg.suggestTask:msg.text;
 // Images and file names are never promoted to tasks automatically.
 const clean=String(proposed||'').replace(/@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)\s*[,—:-]?\s*/gi,'').replace(/\[Выбран файл:[\s\S]*$/,'').trim().slice(0,140);
 if(!clean){setStatus('В этом сообщении нет текста для поручения.');return}
 const room=ROOMS.find(x=>x.id===msg.room);
 state.draftSource={room:msg.room,assigneeId:room?.person&&room.person!=='sayvi'?room.person:''};
 $('svcpChatTaskAssignee').value=state.draftSource.assigneeId;
 $('svcpChatTaskTitle').value=clean;
 $('svcpChatTaskDraft').hidden=false;
 $('svcpChatTaskTitle').focus({preventScroll:true});
}
function cancelTaskDraft(){state.draftSource=null;$('svcpChatTaskDraft').hidden=true}
$('svcpChatTaskCancel')?.addEventListener('click',cancelTaskDraft);
$('svcpOpenTasks')?.addEventListener('click',()=>window.SEYVEO_UNIFIED_TASKS?.openBusiness?.());
function taskDuplicateKey(task){
 if(!task||task.done||typeof task.text!=='string')return '';
 return (task.assigneeId||'')+'|'+task.text.trim().replace(/\s+/g,' ').toLocaleLowerCase('ru-RU');
}
function storeTask(text,source){
 const title=String(text||'').trim().slice(0,140);
 if(!title)return false;
 const assigneeId=source?.assigneeId&&Object.prototype.hasOwnProperty.call(STAFF,source.assigneeId)?source.assigneeId:'';
 const duplicateKey=taskDuplicateKey({text:title,assigneeId,done:false});
 if(state.tasks.some(item=>taskDuplicateKey(item)===duplicateKey)){
  setStatus('Такое поручение уже есть среди невыполненных. Откройте «Дела → Команде» или измените формулировку.');
  $('svcpOpenTasks').hidden=false;
  return false;
 }
 const newTask={id:'chat-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),text:title,done:false,...(source?{source:'chat',room:source.room}: {}),...(assigneeId?{assigneeId}:{})};
 const updated=state.tasks.concat(newTask).slice(-60);
 if(!save(TASK_KEY,updated))return false;
 state.tasks=updated;renderTasks();
 if(assigneeId==='elena'){state.lastDemoTaskId=newTask.id;$('svcpPreviewOnHome').hidden=false;}
 else{$('svcpPreviewOnHome').hidden=true;}
 return true;
}
$('svcpChatTaskDraft')?.addEventListener('submit',event=>{
 event.preventDefault();
 const title=$('svcpChatTaskTitle').value;
 const source={...(state.draftSource||{}),assigneeId:$('svcpChatTaskAssignee').value};
 if(!storeTask(title,source))return;
 cancelTaskDraft();
 $('svcpOpenTasks').hidden=false;
 setStatus('Поручение добавлено в «Дела → Команде» на этом устройстве. Сотрудникам не отправлено.');
});
$('svcpCallSayvi')?.addEventListener('click',()=>{
 const input=$('svcpChatInput');if(!input)return;
 if(!/(^|\s)@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)/i.test(input.value))
  input.value=(input.value.trim()?input.value.trim()+' ':'')+'@Сэйви ';
 input.focus({preventScroll:true});
 input.setSelectionRange(input.value.length,input.value.length);
});
const fileInput=$('svcpFile');
function cleanupPreview(){
 if(state.objectUrl){URL.revokeObjectURL(state.objectUrl);state.objectUrl=null}
 state.file=null;
 const display=$('svcpAttachmentPreview');if(display){display.replaceChildren();display.hidden=true}
}
fileInput?.addEventListener('change',()=>{
 cleanupPreview();
 const file=fileInput.files?.[0];if(!file)return;
 if(file.size>20*1024*1024){fileInput.value='';setStatus('Для демонстрационного просмотра выберите файл до 20 МБ.');return}
 state.file=file;
 const display=$('svcpAttachmentPreview');if(!display)return;
 display.hidden=false;
 if(file.type.startsWith('image/')){
  state.objectUrl=URL.createObjectURL(file);
  const img=el('img');img.src=state.objectUrl;img.alt='Предпросмотр выбранной фотографии';display.append(img);
 }
 display.append(el('span',null,file.name+' · только предпросмотр на устройстве'));
 display.append(btn('Убрать',()=>{fileInput.value='';cleanupPreview()},'svcp-ghost'));
});
function btn(text,action,cls){
 const button=el('button',cls,text);button.type='button';button.addEventListener('click',action);return button;
}
$('svcpChatForm')?.addEventListener('submit',event=>{
 event.preventDefault();
 const input=$('svcpChatInput'),txt=input?.value.trim()||'';
 if(!txt&&!state.file){setStatus('Введите сообщение или выберите файл.');return}
 const fileName=state.file?.name;
 const message=[txt,fileName?'[Выбран файл: '+fileName+'. Это только имя — файл не отправлен и не сохранён.]':''].filter(Boolean).join('\n');
 const entry={room:state.room,text:message,at:Date.now(),role:state.viewpoint==='elena'?'demo-elena':'self',...(state.replyTo?{replyTo:state.replyTo}:{})};
 const callSayvi=state.room==='dm-sayvi'||/(^|\s)@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)/i.test(txt);
 const messages=[entry];
 if(callSayvi){
  const advice=suggestFromChat(txt);
  messages.push({room:state.room,role:'sayvi',text:advice.text,at:Date.now(),...(advice.task?{suggestTask:advice.task}:{})});
 }
 const updated=state.chat.concat(messages).slice(-100);
 if(!save(CHAT_KEY,updated))return;
 state.chat=updated;
 input.value='';if(fileInput)fileInput.value='';
 cleanupPreview();clearReply();cancelTaskDraft();
 renderChat();
 setStatus(callSayvi?'Сэйви ответила шаблонной подсказкой. Это не подключённый ИИ.':state.viewpoint==='elena'?'Ответ Елены показан как учебный пример на этом устройстве.':'Сообщение записано локально. Доставки и уведомлений пока нет.');
});
$('svcpChatInput')?.addEventListener('keydown',event=>{
 if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){
  event.preventDefault();$('svcpChatForm')?.requestSubmit();
 }
});
function renderTasks(){
 const list=$('svcpTaskList');if(!list)return;
 const wasHistoryOpen=!!list.querySelector('.svcp-task-history[open]');
 list.replaceChildren();
 const open=state.tasks.map((task,index)=>({task,index})).filter(x=>x.task&&typeof x.task.text==='string'&&!x.task.done);
 const done=state.tasks.map((task,index)=>({task,index})).filter(x=>x.task&&typeof x.task.text==='string'&&x.task.done);
 const heading=el('div','svcp-task-section-head');
 heading.append(el('strong',null,'В работе'),el('small',null,String(open.length)));
 list.append(heading);
 function taskRow(t,i){
  const row=el('div','svcp-task'+(t.done?' is-done':''));
  const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=!!t.done;
  checkbox.setAttribute('aria-label',(t.done?'Вернуть в работу: ':'Завершить поручение: ')+t.text);
  checkbox.addEventListener('change',()=>{
   const updated=state.tasks.map((item,index)=>index===i?{...item,done:checkbox.checked}:item);
   if(!save(TASK_KEY,updated)){checkbox.checked=!checkbox.checked;return}
   state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
  });
  const copy=el('div','svcp-task-copy');
  copy.append(el('strong','svcp-task-title',t.text));
  if(t.assigneeId&&Object.prototype.hasOwnProperty.call(STAFF,t.assigneeId))
   copy.append(el('small','svcp-task-assignee','Исполнитель: '+STAFF[t.assigneeId]+' · демо'));
  else copy.append(el('small','svcp-task-assignee','Без исполнителя · демо'));
  const actions=el('div','svcp-task-actions');
  actions.append(btn('Обсудить',()=>openTaskDiscussion(t),'svcp-task-discuss'));
  actions.append(btn('Удалить',()=>{
   const updated=state.tasks.filter((_,index)=>index!==i);
   if(!save(TASK_KEY,updated))return;
   state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
  },'svcp-ghost'));
  row.append(checkbox,copy,actions);
  return row;
 }
 const openSeen=new Set(),dups=[];
 const activeBox=el('div','svcp-task-active');
 for(const {task,index} of open){
  const key=taskDuplicateKey(task);
  if(key&&openSeen.has(key)){dups.push(index);continue}
  if(key)openSeen.add(key);
  activeBox.append(taskRow(task,index));
 }
 if(!activeBox.childElementCount)activeBox.append(el('p','svcp-task-zero','Новых поручений нет. Выполненные находятся в истории ниже.'));
 list.append(activeBox);
 if(dups.length){
  const info=el('div','svcp-duplicate-summary');
  info.append(el('span',null,'Одинаковых активных задач скрыто: '+dups.length));
  info.append(btn('Убрать повторы',()=>{
   const set=new Set(dups),updated=state.tasks.filter((_,i)=>!set.has(i));
   if(!save(TASK_KEY,updated))return;
   state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
  },'svcp-ghost'));
  list.append(info);
 }
 if(done.length){
  const details=el('details','svcp-task-history');
  details.open=wasHistoryOpen;
  const summary=el('summary','svcp-task-history-title');
  summary.append(el('strong',null,'Выполнено'),el('small',null,String(done.length)),el('span','svcp-history-chevron','›'));
  details.append(summary);
  const completed=el('div','svcp-task-completed');
  const completedSeen=new Set(),duplicateDone=[];
  for(const {task,index} of done){
   const key=taskDuplicateKey({...task,done:false});
   if(key&&completedSeen.has(key)){duplicateDone.push(index);continue}
   if(key)completedSeen.add(key);
   completed.append(taskRow(task,index));
  }
  details.append(completed);
  if(duplicateDone.length){
   const info=el('div','svcp-duplicate-summary');
   info.append(el('span',null,'Одинаковых выполненных записей: '+duplicateDone.length));
   info.append(btn('Убрать повторы',()=>{
    const set=new Set(duplicateDone),updated=state.tasks.filter((_,i)=>!set.has(i));
    if(!save(TASK_KEY,updated))return;
    state.tasks=updated;renderTasks();syncPreviewAfterTaskEdit();
   },'svcp-ghost'));
   details.append(info);
  }
  list.append(details);
 }
}
function openTaskDiscussion(task){
 if(!task||typeof task.text!=='string')return;
 const person=task.assigneeId&&Object.prototype.hasOwnProperty.call(STAFF,task.assigneeId)?task.assigneeId:'';
 const roomId=person?'dm-'+person:'general';
 if(location.hash!=='#manage')location.hash='#manage';
 window.SEYVEO_BUSINESS_NAV?.returnToMenu?.();
 document.querySelector('[data-clean-business="chat"]')?.click();
 tab('chats');openRoom(roomId);
 if(person==='elena'){
  state.viewpoint='elena';
  updatePerspective();renderChat();
  // In an assignment discussion the employee identity is already explicit.
  // Keep a single easy way back rather than two cramped header controls.
  $('svcpElenaPerspective').hidden=true;
 }
 const message={room:roomId,role:'self',text:task.text};
 startReply(message);
 $('svcpReturnToTasks').hidden=false;
 $('svcpTaskDiscussionQuick').hidden=false;
}
$('svcpReturnToTasks')?.addEventListener('click',()=>{
 $('svcpReturnToTasks').hidden=true;
 $('svcpTaskDiscussionQuick').hidden=true;
 window.SEYVEO_UNIFIED_TASKS?.openBusiness?.('manage');
});
root.querySelectorAll('[data-svcp-discuss-template]').forEach(button=>button.addEventListener('click',()=>{
 const input=$('svcpChatInput');if(!input)return;
 input.value=button.dataset.svcpDiscussTemplate||'';
 input.focus({preventScroll:true});
 input.setSelectionRange(input.value.length,input.value.length);
}));
$('svcpTaskForm')?.addEventListener('submit',e=>{
 e.preventDefault();
 const input=$('svcpTaskInput');const txt=input?.value.trim()||'';
 if(!txt)return;
 if(storeTask(txt,null))input.value='';
});
// Business tools keep their original handlers; the surrounding layout is unified.
root.querySelectorAll('[data-svcp-feature]').forEach(button=>
 button.addEventListener('click',()=>
  window.SEYVEO_BUSINESS_NAV?.openFeature?.(button.dataset.svcpFeature)));
/* Only a user-requested preview: this is not a real incoming push or an
   employee account. It uses the same already-saved demonstration task. */
let previewStarted=false;
function syncPreviewAfterTaskEdit(){
 if(!state.lastDemoTaskId)return;
 if(workTaskForPreview())return;
 state.lastDemoTaskId=null;
 previewStarted=false;
 $('svcpWorkHomePreview').hidden=true;
 $('svcpPreviewOnHome').hidden=true;
 resetHomeReply();
}
function workTaskForPreview(){
 return state.tasks.find(t=>t&&t.id===state.lastDemoTaskId&&t.assigneeId==='elena'&&!t.done)||null;
}
function resetHomeReply(){
 const form=$('svcpHomeReplyForm'),result=$('svcpHomeReplyResult');
 form.hidden=true;
 $('svcpHomePreviewReply').setAttribute('aria-expanded','false');
 $('svcpHomeReplyText').value='';
 result.hidden=true;
 $('svcpHomeReplyStatus').textContent='';
 const choices=$('svcpHomeSayviSuggestions');choices.hidden=true;
 $('svcpHomeSayviHelp').setAttribute('aria-expanded','false');
}
$('svcpHomePreviewReply')?.addEventListener('click',()=>{
 if(!workTaskForPreview())return;
 const form=$('svcpHomeReplyForm');
 if(form.hidden){
  resetHomeReply();
  form.hidden=false;
  $('svcpHomePreviewReply').setAttribute('aria-expanded','true');
  $('svcpHomeReplyText').focus({preventScroll:true});
 }else resetHomeReply();
});
$('svcpHomeReplyCancel')?.addEventListener('click',resetHomeReply);
$('svcpHomeSayviHelp')?.addEventListener('click',()=>{
 if(!workTaskForPreview())return;
 const panel=$('svcpHomeSayviSuggestions');
 panel.hidden=!panel.hidden;
 $('svcpHomeSayviHelp').setAttribute('aria-expanded',String(!panel.hidden));
});
function sayviReplyDraft(kind,task){
 const subject=String(task?.text||'поручение').trim().slice(0,95);
 if(kind==='accept')return 'Приняла поручение «'+subject+'». Приступаю к выполнению.';
 if(kind==='clarify')return 'Подскажите, пожалуйста, к какому времени нужно выполнить поручение «'+subject+'»? Хочу всё сделать правильно.';
 if(kind==='disagree')return 'Хотела бы обсудить поручение «'+subject+'». Есть вопросы по условиям. Можно предложить другой вариант выполнения?';
 return '';
}
$('svcpHomeSayviSuggestions')?.querySelectorAll('[data-svcp-home-suggestion]').forEach(button=>
 button.addEventListener('click',()=>{
  const task=workTaskForPreview();if(!task)return;
  const text=sayviReplyDraft(button.dataset.svcpHomeSuggestion,task);
  if(!text)return;
  $('svcpHomeReplyText').value=text.slice(0,500);
  $('svcpHomeSayviSuggestions').hidden=true;
  $('svcpHomeSayviHelp').setAttribute('aria-expanded','false');
  $('svcpHomeReplyText').focus({preventScroll:true});
 }));
$('svcpHomeReplyForm')?.addEventListener('submit',event=>{
 event.preventDefault();
 const task=workTaskForPreview(),input=$('svcpHomeReplyText'),text=input.value.trim().slice(0,500);
 if(!task||!text)return;
 const reply={room:'dm-elena',role:'demo-elena',text,at:Date.now(),
  replyTo:{sender:'Руководитель · поручение',text:task.text.slice(0,160)}};
 const updated=read(CHAT_KEY).concat(reply).slice(-100);
 const status=$('svcpHomeReplyStatus');
 if(!save(CHAT_KEY,updated)){
  status.textContent='Не удалось записать ответ. Проверьте место на устройстве.';
  $('svcpHomeReplyResult').hidden=false;
  return;
 }
 state.chat=updated;
 resetHomeReply();
 status.textContent='✓ Добавлено в учебный чат Елены. Реальной доставки пока нет.';
 $('svcpHomeReplyResult').hidden=false;
 renderDirectory();
});
$('svcpHomeOpenChat')?.addEventListener('click',()=>{
 if($('svcpHomeReplyResult').hidden)return;
 window.SEYVEO_BUSINESS_COMMAND?.openPrivateChat?.('elena','elena');
});
function syncWorkPreview(){
 const task=workTaskForPreview(),card=$('svcpWorkHomePreview');
 if(!card)return;
 if(!task){card.hidden=true;resetHomeReply();return}
 $('svcpHomePreviewTitle').textContent=task.text;
 $('svcpHomePreviewExecute').textContent=previewStarted?'Подтвердить выполнение':'Исполнить';
 $('svcpHomePreviewDetail').textContent=previewStarted
  ?'Задача в работе · подтвердите выполнение, когда она действительно сделана'
  :'Поручение руководителя · учебная демонстрация на одном устройстве';
 card.hidden=false;
}
$('svcpPreviewOnHome')?.addEventListener('click',()=>{
 const task=workTaskForPreview();
 if(!task){$('svcpPreviewOnHome').hidden=true;return}
 previewStarted=false;
 resetHomeReply();
 syncWorkPreview();
 location.hash='#home';
});
$('svcpHomePreviewClose')?.addEventListener('click',()=>{
 $('svcpWorkHomePreview').hidden=true;
 state.lastDemoTaskId=null;
 previewStarted=false;
 resetHomeReply();
});
$('svcpHomePreviewDetails')?.addEventListener('click',()=>{
 window.SEYVEO_UNIFIED_TASKS?.openBusiness?.();
});
$('svcpHomePreviewExecute')?.addEventListener('click',()=>{
 const task=workTaskForPreview();if(!task)return;
 if(!previewStarted){previewStarted=true;syncWorkPreview();return}
 const updated=state.tasks.map(item=>item.id===task.id?{...item,done:true}:item);
 if(!save(TASK_KEY,updated))return;
 state.tasks=updated;
 state.lastDemoTaskId=null;
 previewStarted=false;
 $('svcpWorkHomePreview').hidden=true;
 $('svcpPreviewOnHome').hidden=true;
 resetHomeReply();
 renderTasks();
 window.dispatchEvent(new CustomEvent('seyveo:demo-task-completed',{detail:{id:task.id}}));
});
window.SEYVEO_BUSINESS_COMMAND=Object.freeze({openTab:tab,openPeopleView:peopleView,openPrivateChat:(person,view='manager')=>{
 const id='dm-'+String(person||'').toLowerCase();
 if(!ROOMS.some(x=>x.id===id&&x.person))return false;
 if(location.hash!=='#manage')location.hash='#manage';
 document.querySelector('[data-clean-business="chat"]')?.click();
 tab('chats');openRoom(id);
 if(view==='elena'&&id==='dm-elena'){
  state.viewpoint='elena';
  updatePerspective();renderChat();
 }
 return true;
}});
window.addEventListener('pagehide',cleanupPreview);
preparePeopleContent();
renderTasks();
tab('chats');
window.addEventListener('storage',event=>{
 if(event.key!==TASK_KEY)return;
 state.tasks=read(TASK_KEY);
 renderTasks();
 syncPreviewAfterTaskEdit();
});
})();
