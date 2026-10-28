/* SEYVEO · Business Command — isolated local prototype.
 * No chat transport, corporate server, identity verification or file uploads.
 * Personal SEYVEO / My World data is never read by this module.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=$('seyveoBusinessCommandPage');
if(!root)return;
const chatRoot=$('svcpChats');
const CHAT_KEY='seyveo-business-command-chat-demo-v1';
const TASK_KEY='seyveo-business-command-tasks-demo-v1';
const RECOGNITION_KEY='seyveo-peer-recognition-demo-v1';
const RECOGNITION_TYPES=Object.freeze({
 help:{name:'Спасибо',symbol:'⭐'},
 mentor:{name:'Выручил',symbol:'🙌'},
 initiative:{name:'Хорошая идея',symbol:'💡'},
 reliable:{name:'Отличная работа',symbol:'🔥'},
 support:{name:'Поддержка',symbol:'💚'}
});
const RECOGNITION_NAMES={tanya:'Таня',anna:'Анна',mikhail:'Михаил',elena:'Елена','manager-demo':'Вы · демо'};
const ROOMS=[
 {id:'general',label:'Общий чат',kind:'groups',hint:'Для всех сотрудников · общие объявления и вопросы',mark:'◎',section:'all'},
 {id:'dm-elena',label:'Елена',kind:'personal',hint:'Кассир · личный рабочий чат',mark:'Е',person:'elena',section:'people',roleGroup:'Касса'},
 {id:'dm-anna',label:'Анна',kind:'personal',hint:'Старший продавец · личный рабочий чат',mark:'А',person:'anna',section:'people',roleGroup:'Торговый зал'},
 {id:'dm-mikhail',label:'Михаил',kind:'personal',hint:'Продавец · личный рабочий чат',mark:'М',person:'mikhail',section:'people',roleGroup:'Торговый зал'},
 {id:'team',label:'Смена и команда',kind:'groups',hint:'Обсуждение смен и задач · дополнительная группа',mark:'▦',section:'extra'},
 {id:'docs',label:'Обсуждение документов',kind:'groups',hint:'Вопросы по рабочим файлам, не хранилище документов',mark:'▤',section:'extra'},
 {id:'dm-sayvi',label:'Сэйви',kind:'personal',hint:'Рабочие подсказки · пока шаблонное демо',mark:'✧',person:'sayvi',section:'assistant'}
];
const state={tab:'chats',room:'general',viewpoint:'manager',file:null,objectUrl:null,replyTo:null,draftSource:null,chat:read(CHAT_KEY),tasks:read(TASK_KEY)};
let chatsFromTasks=false,lastRecognizedPerson=null,quickReactionTarget=null,focusSearchIndex=null,historyQuery='',historyWindow=35;
function read(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.slice(-(key===CHAT_KEY?500:100)):[]}catch{return []}}
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
 document.querySelectorAll('#svcpTeam [data-svcp-people]').forEach(button=>{
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
document.querySelectorAll('#svcpTeam [data-svcp-people]').forEach(button=>
 button.addEventListener('click',()=>peopleView(button.dataset.svcpPeople)));
function tab(name){
 if(!['chats','team','tasks'].includes(name))return;
 state.tab=name;
 root.querySelectorAll('[data-svcp-panel]').forEach(section=>{section.hidden=section.dataset.svcpPanel!==name});
 if(name==='tasks')renderTasks();
 if(name==='chats'){chatsFromTasks=false;showInbox()}
 if(name==='team')peopleView('team');
}
chatRoot.querySelectorAll('[data-svcp-room]').forEach(button=>
 button.addEventListener('click',()=>openRoom(button.dataset.svcpRoom)));
const STAFF={elena:'Елена',anna:'Анна',mikhail:'Михаил'};
function roomDetails(){return ROOMS.find(x=>x.id===state.room)||ROOMS[0]}
function privateAssignmentRecipient(){
 const room=roomDetails();
 return state.viewpoint==='manager'&&room.kind==='personal'&&room.person&&
  Object.prototype.hasOwnProperty.call(STAFF,room.person)?room.person:'';
}
function senderName(msg){
 if(msg.role==='recognition')return '✦ Знак признания · демо';
 if(msg.role==='sayvi')return 'Сэйви · демо';
 if(msg.role==='demo-elena')return 'Елена · учебный пример';
 return roomDetails().kind==='personal'?'Руководитель · демо':'Вы · демо';
}
function renderDirectory(){
 const list=$('svcpConversationList');if(!list)return;
 if(renderHistorySearch())return;
 list.replaceChildren();
 /* Keep the existing rooms and conversation IDs so old local messages still open.
    One compact name/role line and one real message preview, not three descriptions. */
 const latest=new Map();
 for(const item of state.chat){
  if(item&&typeof item.text==='string'&&item.text.trim())latest.set(item.room,item);
 }
 const sections={people:'Сотрудники',extra:'Группы'};
 let prior=null;
 const roleLabels={elena:'Кассир',anna:'Старший продавец',mikhail:'Продавец'};
 const groupHints={general:'Объявления и вопросы команды',team:'Смены и рабочие задачи',docs:'Вопросы по рабочим файлам'};
 function previewTime(at){
  if(!Number.isFinite(Number(at)))return '';
  const date=new Date(at),now=new Date();
  if(Number.isNaN(date.getTime()))return '';
  if(date.toDateString()===now.toDateString())return date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  const startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  if(date.getTime()>=startOfToday-86400000&&date.getTime()<startOfToday)return 'Вчера';
  return date.toLocaleDateString('ru-RU',{day:'numeric',month:'short',...(date.getFullYear()===now.getFullYear()?{}:{year:'2-digit'})});
 }
 for(const room of ROOMS){
  if(room.section!==prior){
   prior=room.section;
   if(sections[prior])list.append(el('div','svcp-directory-section',sections[prior]));
  }
  const person=room.person&&roleLabels[room.person];
  const last=latest.get(room.id);
  const name=room.label;
  const row=el('button','svcp-directory-item');row.type='button';
  row.setAttribute('aria-label',(room.kind==='personal'?'Открыть личный чат: ':'Открыть чат: ')+name+(person?', '+person:''));
  const avatar=el('span','svcp-directory-avatar'+(room.person==='sayvi'?' is-sayvi':''),room.mark);
  avatar.setAttribute('aria-hidden','true');
  const body=el('span','svcp-directory-item-body');
  const headline=el('span','svcp-directory-item-head');
  headline.append(el('strong','svcp-directory-name',name));
  if(last?.at){
   const time=el('time','svcp-directory-time',previewTime(last.at));
   const d=new Date(last.at);
   if(!Number.isNaN(d.getTime()))time.dateTime=d.toISOString();
   headline.append(time);
  }
  const role=person?person:room.person==='sayvi'?'Помощник':
   room.kind==='groups'?'Группа':'';
  const lastLine=last?last.text.replace(/\s+/g,' ').trim():null;
  const fallback=person?'Начать переписку':room.person==='sayvi'?'Рабочие подсказки':groupHints[room.id]||'Открыть чат';
  const description=el('span','svcp-directory-preview');
  if(role){
   description.append(el('span','svcp-directory-role',role));
   description.append(document.createTextNode(' · '));
  }
  description.append(document.createTextNode(lastLine||fallback));
  body.append(headline,description);
  const arrow=el('span','svcp-directory-chevron','›');arrow.setAttribute('aria-hidden','true');
  row.append(avatar,body,arrow);
  row.addEventListener('click',()=>openRoom(room.id));
  list.append(row);
 }
}
/* Search existing local chat history and team assignments, no new archive page. */
function renderHistorySearch(){
 const query=historyQuery.trim().toLocaleLowerCase('ru-RU'),list=$('svcpConversationList');
 if(!query||!list)return false;
 list.replaceChildren();
 const chatHits=state.chat.map((item,index)=>({item,index}))
  .filter(({item})=>item&&typeof item.text==='string'&&ROOMS.some(room=>room.id===item.room)&&
   (item.text.toLocaleLowerCase('ru-RU').includes(query)||
    (ROOMS.find(room=>room.id===item.room)?.label||'').toLocaleLowerCase('ru-RU').includes(query)))
  .reverse().slice(0,30);
 const taskHits=state.tasks.map((item,index)=>({item,index}))
  .filter(({item})=>item&&typeof item.text==='string'&&item.text.toLocaleLowerCase('ru-RU').includes(query))
  .reverse().slice(0,30);
 function heading(textValue,count){
  const h=el('div','svcp-search-results-heading');
  h.append(el('strong',null,textValue),el('small',null,String(count)));
  list.append(h);
 }
 function resultRow(title,excerpt,click){
  const row=el('button','svcp-search-result');
  row.type='button';
  row.append(el('strong',null,title),el('span',null,excerpt));
  row.addEventListener('click',click);
  list.append(row);
 }
 heading('Сообщения',chatHits.length);
 for(const {item,index} of chatHits){
  const room=ROOMS.find(x=>x.id===item.room);
  resultRow(room?.label||'Чат',item.text.slice(0,150),()=>{
   openRoom(item.room);
   focusSearchIndex=index;
   renderChat();
  });
 }
 heading('Поручения',taskHits.length);
 for(const {item,index} of taskHits){
  resultRow((item.done?'✓ Выполнено · ':'В работе · ')+(STAFF[item.assigneeId]||'Команда'),item.text.slice(0,150),()=>{
   window.SEYVEO_UNIFIED_TASKS?.openBusiness?.('preserve');
   requestAnimationFrame(()=>focusTask(index));
  });
 }
 if(!chatHits.length&&!taskHits.length){
  list.append(el('p','svcp-search-empty','Совпадений нет. Попробуй другое слово из сообщения или поручения.'));
 }
 return true;
}
$('svcpHistorySearch')?.addEventListener('input',event=>{
 historyQuery=event.target.value||'';
 if(!renderHistorySearch())renderDirectory();
});
function focusTask(index){
 const list=$('svcpTaskList');
 if(!list)return;
 const row=list.querySelector('[data-svcp-task-index="'+index+'"]');
 if(!row)return;
 const archive=row.closest('details.svcp-task-history');if(archive)archive.open=true;
 row.classList.add('is-search-hit');
 row.scrollIntoView({block:'center',behavior:'auto'});
}
function showInbox(){
 closeRecognition();
 closeComposerEmoji();
 $('svcpRecognizeOpenCard').hidden=true;lastRecognizedPerson=null;
 state.viewpoint='manager';
 window.dispatchEvent(new CustomEvent('seyveo:work-role-preview',{detail:{role:'manager'}}));
 $('svcpChatDirectory').hidden=false;
 $('svcpConversation').hidden=true;
 $('svcpReturnToTasks').hidden=true;
 $('svcpTaskDiscussionQuick').hidden=true;
 clearReply();cancelTaskDraft();cleanupPreview();
 renderDirectory();
}
function openRoom(roomId){
 closeRecognition();
 closeComposerEmoji();
 historyWindow=35;
 $('svcpRecognizeOpenCard').hidden=true;lastRecognizedPerson=null;
 const selected=ROOMS.find(x=>x.id===roomId);if(!selected)return;
 state.room=selected.id;
 state.viewpoint='manager';
 $('svcpChatDirectory').hidden=true;
 $('svcpConversation').hidden=false;
 $('svcpConversationTitle').textContent=selected.person&&selected.person!=='sayvi'
 ?selected.label+' · '+(selected.id==='dm-elena'?'кассир':selected.id==='dm-anna'?'старший продавец':'продавец')
 :selected.label;
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
 const chips=chatRoot.querySelector('.svcp-rooms');if(chips)chips.hidden=current.kind!=='groups';
 $('svcpRecognizeOpen').hidden=state.viewpoint==='elena'||!(current.person&&STAFF[current.person]);
 const directTask=$('svcpComposerDirectTask'),recipient=privateAssignmentRecipient();
 if(directTask){
  directTask.hidden=!recipient;
  directTask.setAttribute('aria-label',recipient
   ?'Создать поручение для '+STAFF[recipient]+' из написанного текста'
   :'Поручить написанное сотруднику');
  $('svcpChatForm')?.classList.toggle('svcp-can-assign',!!recipient);
 }
 $('svcpChatInput').placeholder=state.viewpoint==='elena'?'Ответ Елены · локальное демо…':current.person==='sayvi'?'Спросить Сэйви · демо…':'Сообщение или @Сэйви…';
 window.dispatchEvent(new CustomEvent('seyveo:work-role-preview',{detail:{role:state.viewpoint==='elena'?'employee':'manager'}}));
}
$('svcpConversationBack')?.addEventListener('click',showInbox);
$('svcpConversationSearch')?.addEventListener('click',()=>{
 showInbox();
 $('svcpHistorySearch')?.focus({preventScroll:true});
});
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

/* A small, reversible reaction instead of a multi-field appreciation form.
 * "manager-demo" is not a verified employee identity; no HR decision is made.
 * An emoji on a message stays in the chat; person recognition is a separate
 * explicit button in the personal chat and uses the previous staff-ledger key.
 */
/* A chat emoji is never a staff performance award. Awards remain explicit. */
const QUICK_EMOJIS=['👍','❤️','😂','🔥','👏','⭐','😊'];
const MORE_EMOJI_GROUPS=[
 {name:'Эмоции',emojis:['🥰','😍','🤣','😄','😁','😉','🥹','😢','😮','🤔','😎','🙏']},
 {name:'Поддержка',emojis:['💚','💙','💜','🫶','💪','🙌','👌','🤝','💯','✨','🎉','🏆']},
 {name:'Работа',emojis:['✅','📌','🚀','💡','👀','👏','🤩','🙈','☕','🌟','🎯','🤗']}
];
function closeMessageMenus(){
 chatRoot.querySelectorAll('.svcp-message-menu').forEach(menu=>{menu.hidden=true});
 chatRoot.querySelectorAll('.svcp-more-trigger').forEach(trigger=>trigger.setAttribute('aria-expanded','false'));
}
/* Emoji composer is separate from message reactions: an inline strip, not a modal. */
const composerEmojiStrip=$('svcpComposerEmojiStrip');
const composerEmojiButton=$('svcpComposerEmojiToggle');
let composerMoreEmojis=false;
function closeComposerEmoji(){
 if(composerEmojiStrip)composerEmojiStrip.hidden=true;
 if(composerEmojiButton)composerEmojiButton.setAttribute('aria-expanded','false');
 composerMoreEmojis=false;
}
function insertComposerEmoji(emoji){
 const input=$('svcpChatInput');
 if(!input)return;
 const from=typeof input.selectionStart==='number'?input.selectionStart:input.value.length;
 const to=typeof input.selectionEnd==='number'?input.selectionEnd:from;
 const value=input.value.slice(0,from)+emoji+input.value.slice(to);
 if(input.maxLength>0&&value.length>input.maxLength)return;
 input.value=value;
 input.focus({preventScroll:true});
 input.setSelectionRange(from+emoji.length,from+emoji.length);
 input.dispatchEvent(new Event('input',{bubbles:true}));
}
function renderComposerEmojis(){
 if(!composerEmojiStrip)return;
 composerEmojiStrip.replaceChildren();
 const emojis=composerMoreEmojis
  ?[...QUICK_EMOJIS,...MORE_EMOJI_GROUPS.flatMap(group=>group.emojis)]
  :QUICK_EMOJIS;
 for(const emoji of emojis){
  const option=el('button','svcp-composer-emoji-choice',emoji);
  option.type='button';option.setAttribute('aria-label','Вставить '+emoji);
  option.addEventListener('click',()=>insertComposerEmoji(emoji));
  composerEmojiStrip.append(option);
 }
 const more=el('button','svcp-composer-emoji-expand',composerMoreEmojis?'Меньше':'＋');
 more.type='button';more.setAttribute('aria-expanded',String(composerMoreEmojis));
 more.setAttribute('aria-label',composerMoreEmojis?'Скрыть дополнительные эмодзи':'Показать другие эмодзи');
 more.addEventListener('click',()=>{
  composerMoreEmojis=!composerMoreEmojis;
  renderComposerEmojis();
 });
 composerEmojiStrip.append(more);
}
composerEmojiButton?.addEventListener('click',()=>{
 const show=composerEmojiStrip.hidden;
 closeRecognition();closeMessageMenus();
 if(show){composerEmojiStrip.hidden=false;renderComposerEmojis();}
 else closeComposerEmoji();
 composerEmojiButton.setAttribute('aria-expanded',String(show));
});
function toggleMessageMenu(menu,trigger){
 const opening=menu.hidden;
 closeRecognition();
 closeMessageMenus();
 menu.hidden=!opening;
 trigger.setAttribute('aria-expanded',String(opening));
}
const reactionHome=$('svcpReactionPicker')?.parentElement;
function closeRecognition(){
 const panel=$('svcpReactionPicker');
 if(panel){
  panel.hidden=true;
  if(reactionHome&&panel.parentElement!==reactionHome)reactionHome.appendChild(panel);
 }
 $('svcpRecognizeOpen')?.setAttribute('aria-expanded','false');
 quickReactionTarget=null;
}
function showReactions(target,near=null){
 closeMessageMenus();
 closeRecognition();
 quickReactionTarget=target;
 const panel=$('svcpReactionPicker');
 if(!panel)return;
 const person=target.type==='person';
 $('svcpReactionLabel').textContent=person
  ?'Отметить '+STAFF[target.person]+' · знак сохранится в карточке сотрудника'
  :'Реакция на сообщение';
 $('svcpReactionOptions').hidden=!person;
 $('svcpMessageReactionOptions').hidden=person;
 $('svcpMessageReactionMore').hidden=true;
 $('svcpEmojiMoreToggle').setAttribute('aria-expanded','false');
 if(near)near.appendChild(panel);
 panel.hidden=false;
 $('svcpRecognizeOpen')?.setAttribute('aria-expanded',String(person));
}
$('svcpRecognizeOpen')?.addEventListener('click',()=>{
 if(!$('svcpReactionPicker').hidden&&quickReactionTarget?.type==='person'){closeRecognition();return}
 const room=roomDetails();
 if(room.kind!=='personal'||!room.person||!STAFF[room.person]){
  setStatus('Чтобы знак попал в карточку человека, откройте его личный рабочий чат.');
  return;
 }
 showReactions({type:'person',person:room.person});
});
$('svcpReactionCancel')?.addEventListener('click',closeRecognition);
/* Compact familiar emojis first, expandable library second. No scrolling tray. */
const quickEmojis=el('div','svcp-reaction-options svcp-quick-emojis');
quickEmojis.id='svcpMessageReactionOptions';
quickEmojis.setAttribute('role','group');
quickEmojis.setAttribute('aria-label','Быстрые реакции на сообщение');
quickEmojis.hidden=true;
const moreEmojis=el('div','svcp-emoji-more');
moreEmojis.id='svcpMessageReactionMore';
moreEmojis.hidden=true;
const personReactionOptions=$('svcpReactionOptions');
personReactionOptions.before(quickEmojis,moreEmojis);
function addEmojiButton(host,emoji){
 const button=btn(emoji,()=>{
  const target=quickReactionTarget;
  if(target?.type!=='message')return;
  closeRecognition();
  applyMessageEmoji(target.index,emoji);
 },'svcp-emoji-option');
 button.setAttribute('aria-label','Реакция '+emoji);
 host.append(button);
}
QUICK_EMOJIS.forEach(emoji=>addEmojiButton(quickEmojis,emoji));
const moreToggle=btn('＋',()=>{
 moreEmojis.hidden=!moreEmojis.hidden;
 moreToggle.setAttribute('aria-expanded',String(!moreEmojis.hidden));
},'svcp-emoji-more-toggle');
moreToggle.id='svcpEmojiMoreToggle';
moreToggle.setAttribute('aria-label','Показать больше эмодзи');
moreToggle.setAttribute('aria-controls','svcpMessageReactionMore');
moreToggle.setAttribute('aria-expanded','false');
quickEmojis.append(moreToggle);
for(const group of MORE_EMOJI_GROUPS){
 const section=el('section','svcp-emoji-group'),choices=el('div','svcp-emoji-grid');
 section.append(el('small','svcp-emoji-heading',group.name));
 group.emojis.forEach(emoji=>addEmojiButton(choices,emoji));
 section.append(choices);moreEmojis.append(section);
}
function applyPersonReaction(person,kind){
 const reward=RECOGNITION_TYPES[kind];
 if(!STAFF[person]||!reward)return;
 const entries=read(RECOGNITION_KEY);
 const day=new Date().toISOString().slice(0,10);
 if(entries.some(x=>x&&x.from==='manager-demo'&&x.to===person&&x.kind===kind&&String(x.at||'').slice(0,10)===day)){
  setStatus('Такой знак уже поставлен сегодня. Можешь выбрать другую эмоцию.');
  return;
 }
 const item={id:'reaction-'+Date.now().toString(36),from:'manager-demo',to:person,kind,
  reason:'Быстрая оценка в личном рабочем чате (без комментария)',at:new Date().toISOString(),demo:true};
 if(!save(RECOGNITION_KEY,entries.concat(item).slice(-100)))return;
 const entry={room:'dm-'+person,role:'recognition',at:Date.now(),
  text:reward.symbol+' '+RECOGNITION_NAMES['manager-demo']+' отметили '+STAFF[person]+' · '+reward.name,
  recognitionId:item.id};
 const updated=read(CHAT_KEY).concat(entry).slice(-500);
 if(save(CHAT_KEY,updated)){state.chat=updated;renderChat()}
 lastRecognizedPerson=person;
 $('svcpRecognizeOpenCard').textContent='Открыть карточку '+STAFF[person];
 $('svcpRecognizeOpenCard').hidden=false;
 setStatus('Знак '+reward.symbol+' сохранён в учебной карточке '+STAFF[person]+'. Это не проверенная оценка работы.');
 window.dispatchEvent(new CustomEvent('seyveo:recognition-changed',{detail:{personId:person}}));
}
function applyMessageEmoji(index,emoji){
 const msg=state.chat[index];
 if(!emoji||!msg||typeof msg.text!=='string')return;
 const existing=msg.demoReaction===emoji?'':emoji;
 const updated=state.chat.map((item,i)=>i===index?{...item,demoReaction:existing}:item);
 if(!save(CHAT_KEY,updated))return;
 state.chat=updated;
 renderChat();
 setStatus(existing?'Реакция '+emoji+' добавлена в чат · демо':'Реакция убрана.');
}
$('svcpReactionOptions')?.querySelectorAll('[data-svcp-reaction]').forEach(button=>
 button.addEventListener('click',()=>{
  const target=quickReactionTarget,kind=button.dataset.svcpReaction;
  if(target?.type!=='person')return;
  closeRecognition();
  applyPersonReaction(target.person,kind);
 }));
$('svcpRecognizeOpenCard')?.addEventListener('click',()=>{
 if(lastRecognizedPerson)window.SEYVEO_STAFF_CARDS?.open?.(lastRecognizedPerson);
});
function formatTime(ts){
 const dt=new Date(ts);
 return Number.isFinite(dt.getTime())?dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'';
}
function renderChat(){
 closeRecognition();
 closeMessageMenus();
 chatRoot.querySelectorAll('[data-svcp-room]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.svcpRoom===state.room)));
 const thread=$('svcpMessages');if(!thread)return;
 thread.replaceChildren();
 const messages=state.chat.map((msg,index)=>({msg,index}))
  .filter(x=>x.msg&&x.msg.room===state.room&&typeof x.msg.text==='string');
 const focusAt=focusSearchIndex===null?-1:messages.findIndex(x=>x.index===focusSearchIndex);
 const visible=focusAt>=0
  ?messages.slice(Math.max(0,focusAt-16),Math.min(messages.length,focusAt+17))
  :messages.slice(-historyWindow);
 const older=$('svcpLoadOlder');
 if(older){
  older.hidden=focusAt>=0||messages.length<=historyWindow;
  older.textContent='↑ Ранние сообщения · ещё '+Math.max(0,messages.length-historyWindow);
 }
 if(!visible.length){
  thread.append(el('p','svcp-note','Пока нет сообщений. Напишите заметку для команды или позовите Сэйви через @Сэйви. Это локальная демонстрация.'));
 }else{
  for(const {msg,index} of visible){
   const isSayvi=msg.role==='sayvi',isRecognition=msg.role==='recognition';
   const isOwn=state.viewpoint==='elena'?msg.role==='demo-elena':!isSayvi&&msg.role!=='demo-elena';
   const mentioned=state.viewpoint==='elena'&&roomDetails().kind==='groups'&&msg.text.toLocaleLowerCase('ru-RU').includes('@елена');
   const bubble=el('article','svcp-bubble '+(isRecognition?'is-recognition':isSayvi?'is-sayvi':isOwn?'is-self':'is-other')+(mentioned?' is-mentioned':'')+(index===focusSearchIndex?' is-search-hit':''));
   bubble.setAttribute('aria-label',isSayvi?'Демонстрационная подсказка Сэйви':senderName(msg));
   const meta=el('div','svcp-bubble-meta');
   meta.append(el('strong','svcp-sender',senderName(msg)),el('time','svcp-time',formatTime(msg.at)));
   bubble.append(meta);
   if(msg.replyTo&&typeof msg.replyTo.text==='string'){
    bubble.append(el('div','svcp-quote',(msg.replyTo.sender||'Сообщение')+' · '+msg.replyTo.text.slice(0,160)));
   }
   bubble.append(el('span','svcp-message-text',msg.text));
   if(msg.demoReaction){
    const chip=btn(msg.demoReaction+' 1',()=>applyMessageEmoji(index,msg.demoReaction),'svcp-bubble-reaction');
    chip.setAttribute('aria-label','Убрать реакцию '+msg.demoReaction);
    bubble.append(chip);
   }
   if(mentioned)bubble.append(el('small','svcp-mention-notice','Упоминание Елены · уведомление не отправлено'));
   if(!isRecognition){
    const actions=el('div','svcp-message-actions');
    const menu=el('div','svcp-message-menu');menu.hidden=true;
    menu.setAttribute('role','group');menu.setAttribute('aria-label','Действия с сообщением');
    const moreButton=btn('···',()=>toggleMessageMenu(menu,moreButton),'svcp-message-action svcp-more-trigger');
    moreButton.setAttribute('aria-label','Действия с сообщением');
    moreButton.setAttribute('aria-expanded','false');
    actions.append(moreButton);
    menu.append(btn('↩ Ответить',()=>{closeMessageMenus();startReply(msg)},'svcp-message-menu-item'));
    menu.append(btn('Реакция',()=>showReactions({type:'message',index},bubble),'svcp-message-menu-item'));
    if(!msg.taskId&&(!isSayvi||typeof msg.suggestTask==='string'&&msg.suggestTask.trim())&&state.viewpoint!=='elena'){
     menu.append(btn('Поручить',()=>{
      closeMessageMenus();
      if(privateAssignmentRecipient())assignExistingMessage(msg,index);
      else prepareTask(msg);
     },'svcp-message-menu-item'));
    }
    bubble.tabIndex=0;
    bubble.setAttribute('aria-description','Нажмите, чтобы ответить, выбрать реакцию или создать поручение');
    bubble.addEventListener('click',event=>{
     if(event.target.closest('button'))return;
     if(event.target.closest('.svcp-message-menu'))return;
     toggleMessageMenu(menu,moreButton);
    });
    bubble.addEventListener('keydown',event=>{
     if((event.key==='Enter'||event.key===' ')&&event.target===bubble){
      event.preventDefault();toggleMessageMenu(menu,moreButton);
     }
    });
    bubble.append(actions,menu);
   }
   thread.append(bubble);
  }
 }
 if(focusSearchIndex!==null){
  const target=thread.querySelector('.svcp-bubble.is-search-hit');
  thread.scrollTop=target?Math.max(0,target.offsetTop-thread.offsetTop-24):thread.scrollHeight;
  focusSearchIndex=null;
 }else thread.scrollTop=thread.scrollHeight;
}
$('svcpLoadOlder')?.addEventListener('click',()=>{
 historyWindow=Math.min(500,historyWindow+35);
 renderChat();
 const thread=$('svcpMessages');
 if(thread)thread.scrollTop=0;
});
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
function taskRecipients(assigneeId){
 if(assigneeId==='all')return Object.keys(STAFF);
 return Object.prototype.hasOwnProperty.call(STAFF,assigneeId)?[assigneeId]:[];
}
function feedbackTask(message){
 setStatus(message);
}
function storeTask(text,source){
 const title=String(text||'').trim().slice(0,140);
 if(!title)return false;
 const chosen=String(source?.assigneeId||'');
 const recipients=taskRecipients(chosen);
 if(!recipients.length){
  feedbackTask('Сначала выберите сотрудника или всю команду — без получателя поручение не создаётся.');
  return false;
 }
 const fresh=recipients.filter(assigneeId=>
  !state.tasks.some(item=>taskDuplicateKey(item)===taskDuplicateKey({text:title,assigneeId,done:false}))
 );
 if(!fresh.length){
  feedbackTask('Такое поручение уже есть у выбранных сотрудников.');
  return false;
 }
 const created=fresh.map((assigneeId,i)=>({
  id:'chat-'+Date.now()+'-'+i+'-'+Math.random().toString(36).slice(2,7),
  text:title,done:false,assigneeId,
  ...(source?.room?{source:'chat',room:source.room}:{})
 }));
 const updated=state.tasks.concat(created).slice(-60);
 if(!save(TASK_KEY,updated))return false;
 state.tasks=updated;renderTasks();
 window.dispatchEvent(new Event('seyveo:manager-tasks-updated'));
 const demoElena=created.find(item=>item.assigneeId==='elena');
 if(demoElena){state.lastDemoTaskId=demoElena.id;$('svcpPreviewOnHome').hidden=false}
 else{$('svcpPreviewOnHome').hidden=true}
 const status=chosen==='all'
  ?'Созданы отдельные поручения: '+fresh.map(id=>STAFF[id]).join(', ')+'.'
  :'Поручение для '+STAFF[fresh[0]]+' создано.';
 feedbackTask(status+' Пока это локальное демо: уведомления сотрудникам не отправляются.');
 return created;
}
function assignExistingMessage(msg,index){
 const person=privateAssignmentRecipient();
 if(!person||msg.taskId)return;
 const text=String(msg.suggestTask||msg.text||'').trim();
 if(!text||text.length>140||text.includes('[Выбран файл:')){
  setStatus('Для поручения нужен текст до 140 символов без вложения.');
  return;
 }
 const created=storeTask(text,{assigneeId:person,room:state.room});
 if(!created)return;
 const updated=state.chat.map((item,i)=>i===index?{...item,taskId:created[0].id}:item);
 if(save(CHAT_KEY,updated)){
  state.chat=updated;
  renderChat();
 }else setStatus('Поручение создано, но отметку в чате сохранить не удалось.');
}
$('svcpChatTaskDraft')?.addEventListener('submit',event=>{
 event.preventDefault();
 const title=$('svcpChatTaskTitle').value;
 const source={...(state.draftSource||{}),assigneeId:$('svcpChatTaskAssignee').value};
 if(!storeTask(title,source))return;
 cancelTaskDraft();
 $('svcpOpenTasks').hidden=false;
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
/* Direct assignment while composing in a personal chat:
   text is the task, the current employee is the recipient. No extra form. */
$('svcpComposerDirectTask')?.addEventListener('click',()=>{
 const person=privateAssignmentRecipient(),input=$('svcpChatInput');
 const text=input?.value.trim()||'';
 if(!person){setStatus('Поручение напрямую доступно в личном чате сотрудника.');return}
 if(!text){setStatus('Напишите поручение и нажмите «Поручить».');input?.focus({preventScroll:true});return}
 if(text.length>140){
  setStatus('Для поручения можно написать до 140 символов. Сократите текст или отправьте как сообщение.');
  input?.focus({preventScroll:true});return;
 }
 if(state.file){
  setStatus('Прикрепление файлов к поручениям пока не подключено. Уберите файл или отправьте обычное сообщение.');
  return;
 }
 const created=storeTask(text,{assigneeId:person,room:state.room});
 if(!created)return;
 const message={
  room:state.room,role:'self',text:'📌 Поручение: '+text,at:Date.now(),
  taskId:created[0].id,
  ...(state.replyTo?{replyTo:state.replyTo}:{})
 };
 const updated=state.chat.concat(message).slice(-500);
 if(save(CHAT_KEY,updated)){
  state.chat=updated;
  input.value='';
  closeComposerEmoji();clearReply();cancelTaskDraft();
  renderChat();
  setStatus('Поручение для '+STAFF[person]+' сохранено в делах и переписке. Демо, без отправки на другой телефон.');
 }else{
  setStatus('Поручение для '+STAFF[person]+' создано в делах, но сообщение в чате не сохранилось.');
 }
});
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
 const updated=state.chat.concat(messages).slice(-500);
 if(!save(CHAT_KEY,updated))return;
 state.chat=updated;
 closeComposerEmoji();
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
 window.dispatchEvent(new Event('seyveo:manager-tasks-updated'));
 const wasHistoryOpen=!!list.querySelector('.svcp-task-history[open]');
 list.replaceChildren();
 const open=state.tasks.map((task,index)=>({task,index})).filter(x=>x.task&&typeof x.task.text==='string'&&!x.task.done);
 const done=state.tasks.map((task,index)=>({task,index})).filter(x=>x.task&&typeof x.task.text==='string'&&x.task.done);
 const heading=el('div','svcp-task-section-head');
 heading.append(el('strong',null,'Активные поручения'),el('small',null,String(open.length)));
 list.append(heading);
 function taskRow(t,i){
  const row=el('div','svcp-task'+(t.done?' is-done':''));
  row.setAttribute('data-svcp-task-index',String(i));
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
  else{
   copy.append(el('small','svcp-task-assignee','Не назначено · старое демо-поручение'));
   if(!t.done){
    const recipient=el('select','svcp-task-reassign');
    recipient.setAttribute('aria-label','Назначить поручение «'+t.text.slice(0,65)+'»');
    for(const [id,title] of [
     ['','Назначить кому…'],['elena','Елена · кассир'],
     ['anna','Анна · старший продавец'],['mikhail','Михаил · продавец'],
     ['all','Всем · каждому отдельно']
    ]){
     const option=el('option','',title);option.value=id;recipient.append(option);
    }
    recipient.addEventListener('change',()=>{
     const to=taskRecipients(recipient.value);
     if(!to.length)return;
     const chosen=to.filter(assigneeId=>
      !state.tasks.some((item,j)=>j!==i&&taskDuplicateKey(item)===taskDuplicateKey({text:t.text,assigneeId,done:false}))
     );
     if(!chosen.length){
      feedbackTask('Такое поручение уже назначено выбранным сотрудникам.');
      recipient.value='';return;
     }
     const [first,...others]=chosen;
     const added=others.map((assigneeId,k)=>({
      ...t,id:'assigned-'+Date.now()+'-'+k+'-'+Math.random().toString(36).slice(2,6),
      assigneeId,done:false
     }));
     const updated=state.tasks.map((item,j)=>j===i?{...item,assigneeId:first}:item).concat(added).slice(-60);
     if(!save(TASK_KEY,updated)){recipient.value='';return}
     state.tasks=updated;
     renderTasks();syncPreviewAfterTaskEdit();
     feedbackTask('Назначено: '+chosen.map(id=>STAFF[id]).join(', ')+'. Демо, без доставки на телефон.');
    });
    copy.append(recipient);
   }
  }
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
 if(!activeBox.childElementCount)activeBox.append(el('p','svcp-task-zero','Активных поручений нет. Новую задачу можно поручить в чате сотрудника.'));
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
 window.SEYVEO_UNIFIED_TASKS?.openChat?.('tasks',roomId);
 chatsFromTasks=true;
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
function returnToTasks(){
 chatsFromTasks=false;
 $('svcpReturnToTasks').hidden=true;
 $('svcpTaskDiscussionQuick').hidden=true;
 window.SEYVEO_UNIFIED_TASKS?.openBusiness?.('preserve');
}
$('svcpReturnToTasks')?.addEventListener('click',returnToTasks);
chatRoot.querySelectorAll('[data-svcp-discuss-template]').forEach(button=>button.addEventListener('click',()=>{
 const input=$('svcpChatInput');if(!input)return;
 input.value=button.dataset.svcpDiscussTemplate||'';
 input.focus({preventScroll:true});
 input.setSelectionRange(input.value.length,input.value.length);
}));
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
 $('svcpHomeOpenChat').hidden=true;
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
 const updated=read(CHAT_KEY).concat(reply).slice(-500);
 const status=$('svcpHomeReplyStatus');
 if(!save(CHAT_KEY,updated)){
  status.textContent='Не удалось записать ответ. Проверьте место на устройстве.';
  $('svcpHomeReplyResult').hidden=false;
  return;
 }
 state.chat=updated;
 resetHomeReply();
 status.textContent='✓ Добавлено в учебный чат Елены. Реальной доставки пока нет.';
 $('svcpHomeOpenChat').hidden=false;
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
window.SEYVEO_BUSINESS_COMMAND=Object.freeze({
 openTab:tab,
 showChat:(roomId=null,viewpoint='manager')=>{
  chatsFromTasks=true;
  if(roomId&&ROOMS.some(x=>x.id===roomId)){
   openRoom(roomId);
   if(viewpoint==='elena'&&roomId==='dm-elena'){
    state.viewpoint='elena';updatePerspective();renderChat();
   }
  }else showInbox();
 },
 openPeopleView:peopleView,
 openPrivateChat:(person,view='manager')=>{
  const id='dm-'+String(person||'').toLowerCase();
  if(!ROOMS.some(x=>x.id===id&&x.person))return false;
  window.SEYVEO_UNIFIED_TASKS?.openChat?.('manage',id,view);
  return true;
 }
});
window.addEventListener('pagehide',cleanupPreview);
preparePeopleContent();
renderTasks();
tab('chats');
window.addEventListener('storage',event=>{
 if(event.key===CHAT_KEY){
  state.chat=read(CHAT_KEY);
  renderDirectory();
  if(!$('svcpConversation').hidden)renderChat();
 }
 if(event.key===TASK_KEY){
  state.tasks=read(TASK_KEY);
  renderTasks();
  syncPreviewAfterTaskEdit();
  if(historyQuery.trim())renderHistorySearch();
 }
});
})();
