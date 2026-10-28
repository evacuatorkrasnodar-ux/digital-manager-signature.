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
const state={tab:'chats',room:'general',file:null,objectUrl:null,chat:read(CHAT_KEY),tasks:read(TASK_KEY)};
function read(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.slice(-100):[]}catch{return []}}
function save(key,list){try{localStorage.setItem(key,JSON.stringify(list))}catch{setStatus('Не удалось сохранить на этом устройстве. Проверьте свободное место и разрешения браузера.')}}
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
 renderChat();
}));
function renderChat(){
 root.querySelectorAll('[data-svcp-room]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.svcpRoom===state.room)));
 const thread=$('svcpMessages');if(!thread)return;
 thread.replaceChildren();
 const msgs=state.chat.filter(x=>x&&x.room===state.room&&typeof x.text==='string').slice(-35);
 if(!msgs.length){
  thread.append(el('p','svcp-note','Здесь будет история рабочего разговора. Пока это демонстрация: сообщения видны только на вашем устройстве.'));
 }else{
  for(const msg of msgs){
   const bubble=el('div','svcp-bubble is-self');
   bubble.append(el('strong','svcp-sender','Вы · локальное демо'),el('span','svcp-message-text',msg.text));
   thread.append(bubble);
  }
 }
 thread.scrollTop=thread.scrollHeight;
}
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
 const entry={room:state.room,text:message,at:Date.now()};
 state.chat=state.chat.concat(entry).slice(-100);
 save(CHAT_KEY,state.chat);
 input.value='';if(fileInput)fileInput.value='';
 cleanupPreview();
 renderChat();
 setStatus('Запись добавлена в локальное демо. Никому не отправлена.');
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
 state.tasks.push({text:txt.slice(0,140),done:false});
 state.tasks=state.tasks.slice(-60);
 save(TASK_KEY,state.tasks);input.value='';renderTasks();
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
