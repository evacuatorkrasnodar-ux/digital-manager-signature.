/* SEYVEO · Felix local context adapter v0.1
 * Reads only explicitly requested Calendar (events + task deadlines) or Notebook
 * in the current browser session; sends no personal data to Ollama, cloud, or server.
 * No writes, no personal-space (health/care/world), no automatic permissions.
 * Mounted only in loopback Felix development build, NOT public Home.
 */
(function(root){
 'use strict';
 const MAX_SEARCH=70,MAX_NOTES=3,MAX_EVENTS=8,MAX_TASKS=8;
 const strip=s=>String(s||'').trim().replace(/\s+/gu,' ');
 const pad=n=>String(n).padStart(2,'0');
 const dateKey=date=>date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
 const dayAt=(date,offset)=>new Date(date.getFullYear(),date.getMonth(),date.getDate()+offset);
 const plain=src=>String(src||'').replace(/[\u0000-\u001f\u007f]/gu,' ').trim();
 function safeStored(storage,key,limit){
  try{
   const result=JSON.parse(storage.getItem(key)||'[]');
   return Array.isArray(result)?result.slice(0,limit):[];
  }catch{return []}
 }
 const EVENT_STORE='seyveo-calendar-events-v1',TASK_STORE='seyveo-personal-tasks-v1';
 function parse(message){
  if(typeof message!=='string'||message.length>500)return null;
  const value=strip(message).replace(/^(?:филя|феликс)[,\s]+/iu,'').replace(/[?!.]+$/gu,'').trim();
  let match=value.match(/^(?:(?:что\s+у\s+меня)|(?:что\s+у\s+меня\s+запланировано)|(?:какие\s+(?:у\s+меня\s+)?(?:планы|дела|встречи|события))|(?:покажи\s+(?:мои\s+)?(?:дела|планы|встречи|события))|(?:что\s+(?:в\s+моём\s+)?календаре))(?:\s+на)?\s+(сегодня|завтра|послезавтра)$/iu);
  if(match)return {kind:'calendar',shift:({сегодня:0,завтра:1,послезавтра:2})[match[1]]};
  // Deliberately no catch-all "remember everything": notes may contain secrets.
  match=value.match(/^(?:(?:найди|поищи|покажи)\s+(?:(?:мне\s+)?(?:в\s+)?(?:моём\s+)?блокноте\s+|(?:мою\s+)?(?:заметку|запись)\s+)|(?:что\s+я\s+(?:писал|записал)\s+))(?:про|о|об|по\s+теме|со\s+словом|содержащее\s+слово)?\s*[:：]?\s*(.{2,70})$/iu);
  if(match){
   const term=strip(match[1]).replace(/^[:：, ]+/u,'');
   if(term.length>=2&&term.length<=MAX_SEARCH)return {kind:'note-search',term};
  }
  return null;
 }
 function calendarReply(storage,now,shift){
  const date=dateKey(dayAt(now,shift));
  const label=shift===0?'сегодня':shift===1?'завтра':'послезавтра';
  const events=safeStored(storage,EVENT_STORE,300)
   .filter(x=>x&&typeof x.title==='string'&&typeof x.date==='string'&&x.date===date&&x.title.trim())
   .slice(0,MAX_EVENTS)
   .map(x=>({title:plain(x.title).slice(0,130),time:typeof x.time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/u.test(x.time)?x.time:''}))
   .sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  const tasks=safeStored(storage,TASK_STORE,150)
   .filter(x=>x&&x.done!==true&&x.due===date&&typeof x.title==='string'&&x.title.trim())
   .slice(0,MAX_TASKS).map(x=>plain(x.title).slice(0,130));
  const allEvents=safeStored(storage,EVENT_STORE,300).filter(x=>x?.date===date&&typeof x.title==='string').length;
  const allTasks=safeStored(storage,TASK_STORE,150).filter(x=>x?.due===date&&x.done!==true&&typeof x.title==='string').length;
  const missing=Math.max(0,allEvents-events.length)+Math.max(0,allTasks-tasks.length);
  const intro='Календарь на '+label+' ('+date+'):\n';
  if(!allEvents&&!allTasks)return intro+'Сохранённых событий и незавершённых дел со сроком на эту дату не нашёл.';
  const rows=[
   ...events.map(x=>'• '+(x.time?x.time+' · ':'')+x.title),
   ...tasks.map(x=>'• Дело · '+x)
  ];
  return intro+rows.join('\n')+(missing?'\nИ ещё '+missing+' записей. Открой Календарь, чтобы увидеть все.':'')+
   '\n\nЭто только локальные события и дела этого браузера. Внешние календари и записи «Моего мира», Здоровья и Заботы сюда не включены.';
 }
 function notebookReply(noteAPI,term){
  if(!noteAPI||typeof noteAPI.getNotes!=='function')
   return 'Блокнот сейчас недоступен. Открой его в приложении и попробуй ещё раз.';
  let raw;
  try{raw=noteAPI.getNotes()}catch{return 'Не удалось прочитать Блокнот. Ничего не изменено.';}
  if(!Array.isArray(raw))return 'Не удалось прочитать Блокнот. Ничего не изменено.';
  const keyword=term.toLocaleLowerCase('ru-RU');
  const variants=[keyword];
  // Gentle single-word inflection match: рекламу / реклама, клиента / клиент.
  if(/^[а-яё]{5,}$/iu.test(keyword))variants.push(keyword.replace(/[уеыаои]$/u,''));
  const matched=raw
   .filter(x=>x&&!x.paper&&typeof x.text==='string'&&variants.some(part=>part.length>=3&&x.text.toLocaleLowerCase('ru-RU').includes(part)))
   .slice(0,MAX_NOTES)
   .map(x=>{
    const text=plain(x.text);
    const at=Math.max(0,variants.map(part=>text.toLocaleLowerCase('ru-RU').indexOf(part)).find(pos=>pos>=0)??0);
    const snippet=at<0?text.slice(0,210):text.slice(Math.max(0,at-35),Math.max(0,at-35)+210);
    return '• '+(snippet.length<text.length?'…':'')+snippet+(snippet.length<text.length?'…':'');
   });
  if(!matched.length)return 'В локальном Блокноте не нашёл текстовых записей по запросу «'+term+'». Рукописные страницы без распознанного текста не искал.';
  return 'Найдено в Блокноте по запросу «'+term+'»:\n'+matched.join('\n\n')+
   '\n\nПоказаны фрагменты не более трёх записей. Чтобы изменить или удалить запись, открой Блокнот.';
 }
 function answer(message,{storage=root.localStorage,noteAPI=root.SEYVEO_NOTES_API,now=new Date()}={}){
  const intent=parse(message);
  if(!intent)return null;
  try{
   return Object.freeze({
    kind:intent.kind,localOnly:true,modelCalled:false,cloud:false,executed:false,
    text:intent.kind==='calendar'?calendarReply(storage,now,intent.shift):notebookReply(noteAPI,intent.term)
   });
  }catch{return Object.freeze({kind:intent.kind,localOnly:true,modelCalled:false,cloud:false,executed:false,
    text:'Не удалось прочитать локальные записи. Данные не менялись.'});}
 }
 // Delegate create requests to the ORIGINAL reviewed Calendar/Notebook handlers.
 // This removes only the wake-name "Филя/Феликс" before the approved handlers.
 // NO direct localStorage writes, modal bypass, network call or pretend execution.
 function draftCommand(message){
  if(typeof message!=='string'||message.length>2500)return null;
  const match=message.trim().match(/^(?:филя|феликс)(?:\s*[,!:.]\s*|\s+)([\s\S]+)$/iu);
  if(!match)return null;
  const command=match[1].trim();
  if(!command)return null;
  const calendar=/^(?:запиши|запланируй|назначь|добавь|создай|поставь)(?=\s|$)/iu.test(command)
   ?root.SEYVEO_CALENDAR_NL?.(command):null;
  if(calendar&&(calendar.status==='ready'||calendar.status==='clarify'))
   return Object.freeze({kind:'calendar-draft',command,status:calendar.status});
  // "Филя, запомни: ..." is reserved for memory rather than the Notebook.
  const notePrefix=/^(?:(?:запомни|запомните)\s+(?:(?:эту|мою|важную)\s+)?(?:мысль|идею|заметку)|(?:запиши|сохрани)\s+(?:(?:эту|мою|важную)\s+)?(?:мысль|идею|заметку)|(?:запиши|сохрани|добавь)\s+(?:это\s+)?(?:в\s+)?(?:мой\s+)?(?:блокнот|заметки))(?=\s|$|[,:.!?—–-])/iu;
  if(!notePrefix.test(command))return null;
  // The original parser flattens line breaks; do not mangle poems or notes.
  if(/[\r\n]/u.test(command))return Object.freeze({kind:'draft-clarify',status:'clarify',
   text:'Для текста с переносами строк выбери «В Блокнот» или большой редактор: там строки сохраняются. Я ничего не отправлял и не записывал.'});
  const note=root.SEYVEO_NOTE_NL?.(command);
  return note&&(note.status==='ready'||note.status==='clarify')
   ?Object.freeze({kind:'note-draft',command,status:note.status})
   :Object.freeze({kind:'draft-clarify',status:'clarify',
    text:'Не удалось подготовить заметку. Открой Блокнот и проверь текст перед сохранением.'});
 }
 root.SEYVEO_FELIX_CONTEXT=Object.freeze({parse,answer,draftCommand});
 // Local Felix only: intercept supported commands before the existing
 // composer submit handler. This leaves the approved public index.html untouched.
 // Explicitly requested personal snippets are NEVER added to model chat history.
 if(root.document?.addEventListener){
  root.document.addEventListener('submit',event=>{
   const form=event.target;
   if(form?.id!=='ask'||form.dataset?.composerMode==='notes')return;
   const question=root.document.getElementById('question');
   if(!question)return;
   const q=question.value.trim();
   const result=answer(q);
   if(!result){
    const proposed=draftCommand(q);
    if(!proposed)return;
    if(proposed.kind==='draft-clarify'){
     event.preventDefault();event.stopImmediatePropagation();
     const panel=root.document.getElementById('orbInlineReplyText');
     const overlay=root.document.getElementById('orbInlineReply');
     if(panel&&overlay){panel.textContent=proposed.text;overlay.hidden=false;}
     return;
    }
    // Do not overwrite an active reply or attempt to save while busy.
    if(root.SEYVEO_LOCAL_PENDING)return;
    // The ORIGINAL app handles the preview and explicit Save button.
    // Let its existing submit handler run; nothing is auto-saved.
    question.value=proposed.command;
    question.dispatchEvent(new Event('input',{bubbles:true}));
    return;
   }
   event.preventDefault();
   event.stopImmediatePropagation();
   const panel=root.document.getElementById('orbInlineReplyText');
   const overlay=root.document.getElementById('orbInlineReply');
   const stage=root.document.getElementById('stage');
   if(!panel||!overlay||!stage)return;
   if(root.SEYVEO_LOCAL_PENDING){
    panel.textContent='Феликс ещё отвечает. Попробуй снова после ответа.';
    return;
   }
   const history=Array.isArray(root.SEYVEO_LOCAL_DIALOGUE?.turns)
    ?root.SEYVEO_LOCAL_DIALOGUE.turns.slice(-3):[];
   const previous=history.map(t=>'Вы:\n'+t.q+'\n\nФеликс:\n'+t.a).join('\n\n────────────\n\n');
   panel.textContent=(previous?previous+'\n\n────────────\n\n':'')+
    'Вы:\n'+q+'\n\nФеликс:\n'+result.text;
   panel.scrollTop=panel.scrollHeight;
   overlay.hidden=false;
   stage.classList.add('has-inline-reply');
   question.value='';
   root.SEYVEO_LOCAL_CHAT_ACTIVE=true;
   root.SEYVEO_LOCAL_VOICE_NEXT=false;
   question.dispatchEvent(new Event('input',{bubbles:true}));
   // Do not call chat.turns.push, chat-history.add, fetch or Ollama.
   // That would disclose results in a later unrelated prompt.
  },true);
 }
})(typeof window!=='undefined'?window:globalThis);
