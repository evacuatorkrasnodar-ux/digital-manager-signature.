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
 {id:'general',label:'Общий'},
 {id:'team',label:'Команда'},
 {id:'docs',label:'Документы'}
];
const state={tab:'chats',room:'general',file:null,objectUrl:null,replyTo:null,draftSource:null,chat:read(CHAT_KEY),tasks:read(TASK_KEY)};
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
 if(name==='chats')renderChat();
 if(name==='team')peopleView('team');
}
root.querySelectorAll('[data-svcp-room]').forEach(button=>button.addEventListener('click',()=>{
 state.room=button.dataset.svcpRoom;
 clearReply();cancelTaskDraft();
 renderChat();
}));
function senderName(msg){return msg.role==='sayvi'?'Сэйви · демо-подсказка':'Вы · локальное демо'}
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
   const bubble=el('article','svcp-bubble '+(isSayvi?'is-sayvi':'is-self'));
   bubble.setAttribute('aria-label',isSayvi?'Демонстрационная подсказка Сэйви':'Ваше сообщение');
   const meta=el('div','svcp-bubble-meta');
   meta.append(el('strong','svcp-sender',senderName(msg)),el('time','svcp-time',formatTime(msg.at)));
   bubble.append(meta);
   if(msg.replyTo&&typeof msg.replyTo.text==='string'){
    bubble.append(el('div','svcp-quote',(msg.replyTo.sender||'Сообщение')+' · '+msg.replyTo.text.slice(0,160)));
   }
   bubble.append(el('span','svcp-message-text',msg.text));
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
 state.draftSource={room:msg.room};
 $('svcpChatTaskTitle').value=clean;
 $('svcpChatTaskDraft').hidden=false;
 $('svcpChatTaskTitle').focus({preventScroll:true});
}
function cancelTaskDraft(){state.draftSource=null;$('svcpChatTaskDraft').hidden=true}
$('svcpChatTaskCancel')?.addEventListener('click',cancelTaskDraft);
$('svcpOpenTasks')?.addEventListener('click',()=>window.SEYVEO_UNIFIED_TASKS?.openBusiness?.());
function storeTask(text,source){
 const title=String(text||'').trim().slice(0,140);
 if(!title)return false;
 const updated=state.tasks.concat({text:title,done:false,...(source?{source:'chat',room:source.room}: {})}).slice(-60);
 if(!save(TASK_KEY,updated))return false;
 state.tasks=updated;renderTasks();return true;
}
$('svcpChatTaskDraft')?.addEventListener('submit',event=>{
 event.preventDefault();
 const title=$('svcpChatTaskTitle').value;
 if(!storeTask(title,state.draftSource))return;
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
 const entry={room:state.room,text:message,at:Date.now(),role:'self',...(state.replyTo?{replyTo:state.replyTo}:{})};
 const callSayvi=/(^|\s)@(?:сэйви|сэй|seyveo|sayvi)(?=\s|[,:.!?]|$)/i.test(txt);
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
 setStatus(callSayvi?'Сэйви ответила демонстрационной подсказкой. Сообщения никому не отправлены.':'Сообщение записано только на этом устройстве.');
});
$('svcpChatInput')?.addEventListener('keydown',event=>{
 if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){
  event.preventDefault();$('svcpChatForm')?.requestSubmit();
 }
});
function renderTasks(){
 const list=$('svcpTaskList');if(!list)return;
 list.replaceChildren();
 if(!state.tasks.length){list.append(el('p','svcp-sub','Рабочих поручений пока нет. Добавьте пример — он останется только в этом браузере.'));return}
 state.tasks.forEach((t,i)=>{
  if(!t||typeof t.text!=='string')return;
  const r=el('div','svcp-task'+(t.done?' is-done':''));
  const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=!!t.done;
  checkbox.setAttribute('aria-label','Отметить выполнение: '+t.text);
  checkbox.addEventListener('change',()=>{t.done=checkbox.checked;save(TASK_KEY,state.tasks);renderTasks()});
  const text=el('span',null,t.text);
  const remove=btn('Удалить',()=>{state.tasks.splice(i,1);save(TASK_KEY,state.tasks);renderTasks()},'svcp-ghost');
  r.append(checkbox,text,remove);list.append(r);
 });
}
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
window.SEYVEO_BUSINESS_COMMAND=Object.freeze({openTab:tab,openPeopleView:peopleView});
window.addEventListener('pagehide',cleanupPreview);
preparePeopleContent();
tab('chats');
})();
