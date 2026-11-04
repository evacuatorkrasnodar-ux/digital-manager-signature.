/* SEYVEO / Sayvi Chat 2.0
 * New single-canvas personal conversation. One original Home writer and history.
 * No cloned textarea, extra backdrop, mock AI replies, or competing dock.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const root=document.documentElement,home=$('homePage'),stage=$('stage');
const form=$('ask'),input=$('question'),reply=$('orbInlineReply'),thread=$('orbInlineReplyText');
const compact=form?.querySelector('.composer-compact');
if(!home||!stage||!form||!input||!reply||!thread||!compact)return;
const ico={
 back:'<path d="m14.5 5-7 7 7 7"/>',
 history:'<path d="M5 5v5h5M5.5 10A7.5 7.5 0 1 1 5 15M12 7.8V12l3 2"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 mic:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h8"/>',
 send:'<path d="M12 19V5m0 0-6 6m6-6 6 6"/>',
 stop:'<rect x="7" y="7" width="10" height="10" rx="2.4"/>',
 copy:'<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/>',
 edit:'<path d="m4 17-.5 3.5L7 20l12-12-3-3L4 17Zm10.5-10.5 3 3"/>',
 note:'<path d="M5 3.5h11l3 3V21H5zM16 3.5V7h3M8.5 11h7M8.5 15h7"/>',
 sound:'<path d="M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>',
 share:'<path d="M12 16V3m0 0-4 4m4-4 4 4M5 13v7h14v-7"/>'
};
const svg=name=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+ico[name]+'</svg>';
const button=(id,label,name)=>{
 const b=document.createElement('button');b.type='button';b.id=id;
 b.title=label;b.setAttribute('aria-label',label);b.innerHTML=svg(name);
 return b;
};
const header=document.createElement('header');
header.id='seyveoConversationHeader';header.className='sayvi-header';header.hidden=true;
const back=button('seyveoConversationBack','Назад','back');
const name=document.createElement('div');name.className='sayvi-title';
name.innerHTML='<strong>Сэйви<span class="sayvi-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span></strong><span id="seyveoConversationStatus" role="status" aria-live="polite">На связи</span>';
const history=button('seyveoConversationHistory','История бесед','history');
header.append(back,name,history);home.insertBefore(header,stage);
const plus=button('seyveoChatPlus','Дополнительные действия','plus');
plus.setAttribute('aria-expanded','false');plus.setAttribute('aria-controls','seyveoChatTools');
const mic=button('seyveoConversationMic','Говорить с Сэйви','mic');
mic.className='composer-icon sayvi-mic';mic.setAttribute('aria-pressed','false');
compact.insertBefore(plus,compact.firstChild);
const send=form.querySelector('#composerCompactSend');
if(send)compact.insertBefore(mic,send);
const menu=document.createElement('div');menu.id='seyveoChatTools';menu.className='sayvi-tools';
menu.hidden=true;menu.setAttribute('role','group');menu.setAttribute('aria-label','Действия Сэйви');
const menuItems=[['photo','Фотография'],['browser','Браузер'],['note','В Блокнот']];
for(const [id,label] of menuItems){const b=document.createElement('button');b.type='button';b.dataset.sayviTool=id;b.textContent=label;menu.append(b)}
form.append(menu);
const photo=document.createElement('input');photo.type='file';photo.accept='image/*';photo.hidden=true;
photo.id='seyveoChatPhotoFile';document.body.append(photo);
photo.addEventListener('change',()=>{
 if(photo.files?.length)status('Фото выбрано. Отправка вложений пока не подключена.',3400);
 photo.value='';
});
let statusTimeout=0,returnRoute='',activity=null,streamNode=null,streamReply='',geometryFrame=0;
let intro=null;
const originalSend=send?.innerHTML||'';
const active=()=>root.classList.contains('seyveo-conversation');
function status(value='На связи',timeout=0){
 const node=$('seyveoConversationStatus');if(!node)return;
 clearTimeout(statusTimeout);node.textContent=value;
 name.classList.toggle('is-processing',/печатает|пишет|думает|обрабатывает|слушает|отвечает/i.test(value));
 if(timeout)statusTimeout=setTimeout(()=>status(),timeout);
}
function toggleMenu(show){
 menu.hidden=!show;plus.setAttribute('aria-expanded',String(show));
}
plus.addEventListener('click',()=>toggleMenu(menu.hidden));
menu.addEventListener('click',event=>{
 const action=event.target.closest('[data-sayvi-tool]')?.dataset.sayviTool;
 if(!action)return;toggleMenu(false);
 if(action==='photo')photo.click();
 if(action==='browser'&&!window.SEYVEO_BROWSER?.open?.())status('Браузер пока недоступен',2300);
 if(action==='note'){const v=input.value.trim();if(v)saveToNotes(v);else status('Сначала напиши текст',2000)}
});
document.addEventListener('pointerdown',e=>{
 if(!menu.hidden&&!menu.contains(e.target)&&!plus.contains(e.target))toggleMenu(false);
},true);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!menu.hidden){e.preventDefault();toggleMenu(false);plus.focus()}
});
function saveToNotes(raw){
 const api=window.SEYVEO_NOTES_API,value=String(raw||'').trim();
 if(!value||value.length>8000){status('Нет текста для Блокнота',2100);return}
 if(typeof api?.getNotes!=='function'||typeof api?.putNotes!=='function'){
  status('Блокнот пока недоступен',2800);return;
 }
 const note={id:String(Date.now())+'-'+Math.random().toString(36).slice(2),text:value,createdAt:Date.now()};
 status(api.putNotes([note,...api.getNotes()])?'Сохранено в Блокнот':'Не удалось сохранить',2600);
}
function syncInput(){
 form.classList.toggle('sayvi-has-text',Boolean(input.value.trim()));
 if(!active())return;
 form.style.setProperty('--sayvi-draft-height','38px');
 form.style.setProperty('--sayvi-draft-height',Math.max(38,Math.min(110,input.scrollHeight||38))+'px');
 requestGeometry();
}
function syncSend(){
 if(!send)return;
 const busy=Boolean(activity);
 form.classList.toggle('sayvi-is-busy',busy);
 send.type=busy?'button':'submit';
 send.innerHTML=active()?(busy?svg('stop'):svg('send')):originalSend;
 send.classList.toggle('sayvi-stop',busy);
 send.setAttribute('aria-label',busy?'Остановить':'Отправить Сэйви');
}
function cancelAction(){
 if(!activity)return false;
 const current=activity;activity=null;syncSend();
 try{current.cancel?.()}catch{}
 status('Остановлено',1300);return true;
}
function finishAction(){
 if(!activity)return;activity=null;syncSend();status();
}
function beginAction(cancel){
 if(activity)return false;
 activity={cancel,kind:'queued'};syncSend();status('Сэйви обрабатывает…');return true;
}
send?.addEventListener('click',event=>{
 if(!activity)return;
 event.preventDefault();event.stopImmediatePropagation();cancelAction();
},true);
mic.addEventListener('click',()=>{
 if(!active())open();
 window.SEYVEO_CONVERSATION_TOGGLE_VOICE?.();
});
function renderText(v){return String(v??'').replace(/\r\n?/g,'\n').replace(/(?:[ \t]*\n){3,}/g,'\n\n').trim()}
function action(label,icon,fn){
 const b=button('',''+label,icon);b.removeAttribute('id');b.className='sayvi-message-action';
 b.addEventListener('click',fn);return b;
}
function copy(v){
 if(!navigator.clipboard?.writeText){status('Скопируй текст вручную',2500);return}
 navigator.clipboard.writeText(v).then(()=>status('Скопировано',1700)).catch(()=>status('Копирование недоступно',2300));
}
function editQuestion(v){
 if(input.value.trim()&&input.value.trim()!==v.trim()){status('Сначала отправь текущий текст',2300);return}
 open();input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));
 input.focus({preventScroll:true});
}
function share(v){
 if(navigator.share){navigator.share({title:'Ответ Сэйви',text:v}).catch(()=>{});return}
 copy(v);
}
function speak(v){
 if(window.SEYVEO_CONVERSATION_READ_REPLY)window.SEYVEO_CONVERSATION_READ_REPLY(v);
 else status('Озвучивание недоступно',2600);
}
function nearEnd(){return thread.scrollHeight-thread.scrollTop-thread.clientHeight<75}
function scrollBottom(){requestAnimationFrame(()=>{if(active())thread.scrollTop=thread.scrollHeight})}
function renderTurns(turns=[]){
 if(!Array.isArray(turns))turns=[];
 const follow=nearEnd(),nodes=[];
 turns.forEach(turn=>{
  if(!turn||typeof turn!=='object')return;
  for(const [who,raw] of [['you',turn.question],['sayvi',turn.answer]]){
   const value=renderText(raw);
   const bubble=document.createElement('section');bubble.className='seyveo-conversation-turn seyveo-conversation-turn--'+who;
   const speaker=document.createElement('span');speaker.className='seyveo-conversation-speaker';speaker.textContent=who==='you'?'Вы':'Сэйви';
   const body=document.createElement('div');body.className='seyveo-conversation-body';body.textContent=value;
   bubble.append(speaker,body);
   if(who==='you'){
    if(!value)continue;
    if(value.length>460||value.split('\n').length>9){
     bubble.classList.add('sayvi-folded');
     const expand=document.createElement('button');expand.type='button';expand.className='sayvi-expand';
     expand.textContent='Показать полностью';
     expand.addEventListener('click',()=>{
      const folded=bubble.classList.toggle('sayvi-folded');
      expand.textContent=folded?'Показать полностью':'Свернуть';
     });bubble.append(expand);
    }
    if(!turn.smartStart){
     const a=document.createElement('div');a.className='sayvi-user-actions';
     a.append(action('Копировать сообщение','copy',()=>copy(value)),
      action('Изменить сообщение','edit',()=>editQuestion(value)));
     const group=document.createElement('div');group.className='sayvi-user-group';group.append(bubble,a);nodes.push(group);
    }else nodes.push(bubble);
   }else{
    if(turn.rich){const node=window.SEYVEO_RICH_ANSWER?.render?.(turn.rich);if(node)bubble.append(node)}
    if(turn.search){const node=window.SEYVEO_LIVE_SEARCH_UI?.render?.(turn.search);if(node)bubble.append(node)}
    if(value&&!turn.smartStart){
     const a=document.createElement('div');a.className='seyveo-conversation-reply-actions';
     a.append(action('Копировать ответ','copy',()=>copy(value)),
      action('Поделиться','share',()=>share(value)),
      action('Озвучить','sound',()=>speak(value)),
      action('В Блокнот','note',()=>saveToNotes(value)));
     bubble.append(a);
    }
    nodes.push(bubble);
   }
  }
 });
 if(!nodes.length){
  const welcome=document.createElement('div');welcome.className='sayvi-welcome';
  welcome.innerHTML='<strong>Сэйви на связи</strong><p>Напиши, что нужно сделать, или просто поговорим.</p>';nodes.push(welcome);
 }
 thread.replaceChildren(...nodes);
 if(follow||active())scrollBottom();
}
function beginStream(question,cancel){
 open();if(activity?.kind==='stream')finishAction();
 if(typeof cancel==='function'){activity={kind:'stream',cancel};syncSend()}
 status('Сэйви печатает…');
 renderTurns([...(window.SEYVEO_DEMO_CHAT_TURNS||[]),{question:String(question||''),answer:''}]);
 streamNode=[...thread.querySelectorAll('.seyveo-conversation-turn--sayvi .seyveo-conversation-body')].at(-1)||null;
 streamReply='';if(streamNode)streamNode.textContent='Сэйви думает…';
 scrollBottom();
}
function updateStream(value){
 streamReply=String(value??'');if(!streamNode?.isConnected)return;
 const follow=nearEnd();streamNode.textContent=renderText(streamReply)||'Сэйви думает…';
 status('Сэйви печатает…');if(follow)scrollBottom();
}
function endStream(){streamNode=null;if(activity?.kind==='stream')finishAction();else status()}
function viewport(){
 if(!active())return;
 const vv=window.visualViewport;
 root.style.setProperty('--sayvi-view-height',Math.max(280,Math.round(vv?.height||innerHeight))+'px');
 root.style.setProperty('--sayvi-view-top',Math.max(0,Math.round(vv?.offsetTop||0))+'px');
 const rect=form.getBoundingClientRect();
 const visibleBottom=(vv?.offsetTop||0)+(vv?.height||innerHeight);
 const offset=Math.max(4,Math.min(100,Math.round(visibleBottom-rect.bottom)));
 root.style.setProperty('--sayvi-writer-clearance',(Math.ceil(rect.height)+offset+12)+'px');
}
function requestGeometry(){
 if(geometryFrame)return;
 geometryFrame=requestAnimationFrame(()=>{geometryFrame=0;viewport()});
}
window.visualViewport?.addEventListener('resize',requestGeometry);
window.visualViewport?.addEventListener('scroll',requestGeometry);
window.addEventListener('resize',requestGeometry);
if(typeof ResizeObserver==='function')new ResizeObserver(requestGeometry).observe(form);
input.addEventListener('input',syncInput);
input.addEventListener('focus',()=>{requestGeometry();setTimeout(requestGeometry,220)});
input.addEventListener('blur',()=>{requestGeometry();setTimeout(requestGeometry,200)});
form.addEventListener('submit',()=>queueMicrotask(()=>{syncInput();if(!intro)renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[])}));
function open(){
 if(active())return;
 if(home.hidden){
  returnRoute=location.hash||'';
  $('navHome')?.click();
 }
 if(home.hidden)return;
 root.classList.add('seyveo-conversation');
 header.hidden=false;
 window.SEYVEO_CONVERSATION_ENSURE_INPUT?.();
 form.hidden=false;
 reply.hidden=false;stage.classList.add('has-inline-reply');
 const quiet=$('quietSignal');if(quiet)quiet.hidden=true;
 syncSend();syncInput();status();
 renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[]);
 requestGeometry();scrollBottom();
}
function close(){
 if(!active())return;
 window.dispatchEvent(new Event('seyveo:conversation-closed'));
 intro=null;cancelAction();window.SEYVEO_CONVERSATION_STOP_VOICE?.();
 root.classList.remove('seyveo-conversation');header.hidden=true;
 toggleMenu(false);form.style.removeProperty('--sayvi-draft-height');
 ['--sayvi-view-height','--sayvi-view-top','--sayvi-writer-clearance'].forEach(v=>root.style.removeProperty(v));
 syncSend();mic.setAttribute('aria-pressed','false');
 if(!form.hidden)$('hideInput')?.click();
 window.SEYVEO_DEMO_CHAT_ACTIVE=false;
 if(!reply.hidden)$('orbInlineReplyClose')?.click();
 const dest=returnRoute;returnRoute='';
 if(dest&&location.hash!==dest)location.hash=dest;
}
back.addEventListener('click',close);
history.addEventListener('click',()=>window.SEYVEO_CHAT_HISTORY?.open?.());
window.addEventListener('hashchange',()=>{
 if(active()&&(home.hidden||location.hash&&!['','#home'].includes(location.hash))){
  returnRoute='';close();
 }
});
window.addEventListener('seyveo:chat-history-cleared',()=>{
 window.SEYVEO_DEMO_CHAT_TURNS=[];renderTurns([]);
});
document.addEventListener('seyveo:voice-status',e=>{
 if(!active())return;
 if(e.detail?.stage==='preparing')status('Готовлю голос…');
 if(e.detail?.stage==='playing')status('Сэйви говорит');
 if(e.detail?.stage==='idle')status();
});
document.addEventListener('seyveo:assistant-presence',e=>{
 const phase=e.detail?.phase;
 if(phase==='listening'){mic.setAttribute('aria-pressed','true');if(active())status('Сэйви слушает…')}
 if(phase==='listening-end'||phase==='stop'){mic.setAttribute('aria-pressed','false');if(active())status()}
 if(phase==='thinking'){open();status('Сэйви думает…')}
 if(phase==='speaking'){if(active())status('Сэйви отвечает…')}
 if(phase==='end'||phase==='text'){if(active()&&!activity)status()}
});
function showSearchResults(payload){
 const question=String(payload?.query||'').trim().slice(0,1000);if(!question)return false;
 const found=payload?.status==='results'&&Array.isArray(payload?.results)&&payload.results.length>0;
 const answer=found?String(payload.answer||'Нашла материалы по вопросу.').slice(0,20000):
  String(payload?.message||'Проверенные источники пока недоступны.').slice(0,280);
 const turns=window.SEYVEO_DEMO_CHAT_TURNS||(window.SEYVEO_DEMO_CHAT_TURNS=[]);
 turns.push({question,answer,rich:found?(window.SEYVEO_RICH_ANSWER?.cleanBlocks?.(payload.blocks)||[]):[],
  search:found?{status:'results',results:payload.results.slice(0,6)}:null});
 if(turns.length>30)turns.shift();
 open();renderTurns(turns);
 window.SEYVEO_CHAT_HISTORY?.add?.({question,answer,kind:'search'});return true;
}
function showRichAnswer(payload){
 const question=String(payload?.question||'').trim().slice(0,3500),answer=String(payload?.answer||'').trim().slice(0,20000);
 if(!question||!answer&&!payload?.blocks?.length)return false;
 const turns=window.SEYVEO_DEMO_CHAT_TURNS||(window.SEYVEO_DEMO_CHAT_TURNS=[]);
 turns.push({question,answer,rich:window.SEYVEO_RICH_ANSWER?.cleanBlocks?.(payload?.blocks)||[]});
 if(turns.length>30)turns.shift();
 open();renderTurns(turns);window.SEYVEO_CHAT_HISTORY?.add?.({question,answer,kind:'reply'});return true;
}
window.addEventListener('seyveo:web-search-results',e=>{if(e.detail)showSearchResults(e.detail)});
window.addEventListener('seyveo:rich-answer',e=>{if(e.detail)showRichAnswer(e.detail)});
function beginBusinessIntroduction(){
 const saved=window.SEYVEO_BUSINESS_MAP?.getState?.()||{};
 intro={step:'about',about:String(saved.description||''),goal:String(saved.goal||''),turns:[
  {question:'Хочу познакомить Сэйви с моим делом',answer:'Расскажи, чем занимается твой бизнес. Я сохраню это только после твоего подтверждения.'}
 ]};open();drawIntro();return true;
}
function drawIntro(){if(intro)renderTurns([...(window.SEYVEO_DEMO_CHAT_TURNS||[]),...intro.turns])}
form.addEventListener('submit',event=>{
 if(!intro)return;
 event.preventDefault();event.stopImmediatePropagation();
 const value=input.value.trim();if(!value)return;
 input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
 if(/^(отмена|отменить|выйти)$/i.test(value)){
  intro=null;renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[]);status('Ничего не сохранено',2600);return;
 }
 if(intro.step==='about'){intro.about=value.slice(0,1000);intro.step='goal';intro.turns.push({question:value,answer:'Какая сейчас главная цель твоего бизнеса?'})}
 else if(intro.step==='goal'){intro.goal=value.slice(0,320);intro.step='confirm';intro.turns.push({question:value,answer:'Сохранить?\nДело: '+intro.about+'\nЦель: '+intro.goal+'\nОтветь «сохранить» или «отмена».'})}
 else if(intro.step==='confirm'){
  if(value.toLowerCase()==='сохранить'){
   const result=window.SEYVEO_BUSINESS_MAP?.savePrivateBusinessContext?.(intro.about,intro.goal);
   intro.turns.push({question:value,answer:result?.message||'Не удалось сохранить'});
   if(result?.ok)intro=null;
  }else intro.turns.push({question:value,answer:'Для подтверждения напиши «сохранить». Для выхода — «отмена».'});
 }
 if(intro)drawIntro();else status('На связи');
},true);
$('openSayviBusinessIntro')?.addEventListener('click',beginBusinessIntroduction);
window.SEYVEO_CHAT_ACTIVITY=Object.freeze({
 begin:beginAction,finish:()=>{if(activity?.kind==='queued')finishAction()},
 cancel:cancelAction,isBusy:()=>Boolean(activity)
});
window.SEYVEO_CONVERSATION={open,close,renderTurns,beginStream,updateStream,endStream,status,
 showSearchResults,showRichAnswer,beginBusinessIntroduction};
syncSend();syncInput();
})();
