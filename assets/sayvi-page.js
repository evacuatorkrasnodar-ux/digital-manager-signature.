/* SEYVEO · Sayvi Chat 3.0.
   A wholly new body-level page. The old conversation shell, presentation and
   composer skins are NOT loaded. The real native #ask form and #question are
   reused for the existing assistant transport, but moved into the new page
   only while open. They are restored on close; work chat is never involved. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),root=document.documentElement;
const home=$('homePage'),nativeForm=$('ask'),nativeInput=$('question');
const oldThread=$('orbInlineReplyText'),oldReply=$('orbInlineReply');
if(!home||!nativeForm||!nativeInput||!oldThread||!oldReply)return;
if(!Array.isArray(window.SEYVEO_DEMO_CHAT_TURNS)||!window.SEYVEO_DEMO_CHAT_TURNS.length){
 const saved=window.SEYVEO_CHAT_HISTORY?.recent?.(30);
 window.SEYVEO_DEMO_CHAT_TURNS=Array.isArray(saved)?saved:[];
}
const originFormParent=nativeForm.parentNode,originFormNext=nativeForm.nextSibling;
const originThreadParent=oldThread.parentNode,originThreadNext=oldThread.nextSibling;
const page=document.createElement('section');
page.id='sayviPage';page.setAttribute('aria-label','Чат Сэйви');
page.hidden=true;
page.innerHTML='<header class="sayvi3-head">'+
 '<button type="button" id="seyveoConversationBack" aria-label="Назад"><svg viewBox="0 0 24 24"><path d="m14.5 5-7 7 7 7"/></svg></button>'+
 '<div class="sayvi3-title"><strong>Сэйви</strong><small id="seyveoConversationStatus" role="status" aria-live="polite">На связи</small></div>'+
 '<button type="button" id="seyveoConversationHistory" aria-label="История бесед"><svg viewBox="0 0 24 24"><path d="M5 5v5h5M5.5 10A7.5 7.5 0 1 1 5 15M12 7.8V12l3 2"/></svg></button>'+
 '</header><div id="sayvi3Transcript" class="sayvi3-transcript"></div><div id="sayvi3Writer" class="sayvi3-writer"></div>';
document.body.appendChild(page);
function syncViewport(){
 if(page.hidden)return;
 const vv=window.visualViewport;
 page.style.setProperty('--sayvi3-top',Math.round(vv?.offsetTop||0)+'px');
 page.style.setProperty('--sayvi3-height',Math.round(vv?.height||window.innerHeight)+'px');
}
window.visualViewport?.addEventListener('resize',syncViewport);
window.visualViewport?.addEventListener('scroll',syncViewport);
window.addEventListener('resize',syncViewport);
const transcript=$('sayvi3Transcript'),writer=$('sayvi3Writer'),statusNode=$('seyveoConversationStatus');
let returnRoute='',streamNode=null,activeAction=null,speaking=false,noticeTimer=0;
let intro=null,processing=false;
const svgs={
plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
mic:'<svg viewBox="0 0 24 24"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7"/></svg>',
send:'<svg viewBox="0 0 24 24"><path d="M12 19V5m0 0-6 6m6-6 6 6"/></svg>',
stop:'<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
copy:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/></svg>',
note:'<svg viewBox="0 0 24 24"><path d="M5 3.5h11l3 3V21H5zM16 3.5V7h3M8.5 11h7M8.5 15h7"/></svg>',
sound:'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8"/></svg>'
};
const btn=(id,label,icon)=>{
 const b=document.createElement('button');b.type='button';b.id=id;b.setAttribute('aria-label',label);b.title=label;b.innerHTML=icon;return b;
};
const plus=btn('seyveoChatPlus','Дополнительные действия',svgs.plus);
const mic=btn('seyveoConversationMic','Говорить с Сэйви',svgs.mic);
mic.className='seyveo-conversation-mic';
mic.setAttribute('aria-pressed','false');
const compact=nativeForm.querySelector('.composer-compact');
if(compact){compact.prepend(plus);compact.append(mic)}
const send=$('composerCompactSend');
const tools=document.createElement('div');tools.id='seyveoChatTools';tools.hidden=true;
tools.innerHTML='<button data-tool="browser" type="button">Браузер</button><button data-tool="note" type="button">В Блокнот</button>';
writer.append(tools);
function active(){return !page.hidden}
function status(message='На связи',duration=0){
 statusNode.textContent=message;clearTimeout(noticeTimer);
 if(duration)noticeTimer=setTimeout(()=>status(),duration);
}
function scrollEnd(){requestAnimationFrame(()=>{if(active())oldThread.scrollTop=oldThread.scrollHeight})}
function nearEnd(){return oldThread.scrollHeight-oldThread.scrollTop-oldThread.clientHeight<100}
function escapeText(x){return String(x??'')}
function act(label,icon,fn){
 const b=btn('',label,icon);b.removeAttribute('id');b.className='sayvi3-turn-action';
 b.addEventListener('click',fn);return b;
}
function copy(value){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>status('Скопировано',1300)).catch(()=>status('Не удалось скопировать',1600))}
function note(value){
 const api=window.SEYVEO_NOTES_API;
 if(!api?.getNotes||!api?.putNotes){status('Блокнот недоступен',2000);return}
 const entry={id:String(Date.now()),text:value,createdAt:Date.now()};
 status(api.putNotes([entry,...api.getNotes()])?'Сохранено в Блокнот':'Не удалось сохранить',2000);
}
function renderTurns(turns=[]){
 if(!Array.isArray(turns))turns=[];
 const follow=nearEnd(),prior=oldThread.scrollTop,nodes=[];
 for(const turn of turns){
  if(!turn||typeof turn!=='object')continue;
  for(const [kind,value] of [['you',turn.question],['sayvi',turn.answer]]){
   if(kind==='you'&&!String(value||'').trim())continue;
   const section=document.createElement('section');
   section.className='seyveo-conversation-turn seyveo-conversation-turn--'+kind;
   const speaker=document.createElement('span');speaker.className='seyveo-conversation-speaker';speaker.textContent=kind==='you'?'Вы':'Сэйви';
   const body=document.createElement('div');body.className='seyveo-conversation-body';
   body.textContent=escapeText(value);section.append(speaker,body);
   if(kind==='sayvi'){
    if(turn.rich){const el=window.SEYVEO_RICH_ANSWER?.render?.(turn.rich);if(el)section.append(el)}
    if(turn.search){const el=window.SEYVEO_LIVE_SEARCH_UI?.render?.(turn.search);if(el)section.append(el)}
    if(String(value||'').trim()&&!turn.smartStart){
     const actions=document.createElement('div');actions.className='seyveo-conversation-reply-actions';
     actions.append(act('Копировать',svgs.copy,()=>copy(String(value))),
      act('Озвучить',svgs.sound,()=>window.SEYVEO_CONVERSATION_READ_REPLY?.(String(value))),
      act('В Блокнот',svgs.note,()=>note(String(value))));
     section.append(actions);
    }
   }else if(!turn.smartStart){
    const actions=document.createElement('div');actions.className='seyveo-conversation-user-actions';
    actions.append(act('Копировать',svgs.copy,()=>copy(String(value))),
    act('Редактировать',svgs.note,()=>{nativeInput.value=String(value);nativeInput.dispatchEvent(new Event('input',{bubbles:true}));nativeInput.focus()}));
    section.append(actions);
   }
   nodes.push(section);
  }
 }
 if(!nodes.length){const w=document.createElement('p');w.className='sayvi3-empty';w.textContent='Сэйви на связи. Чем могу помочь?';nodes.push(w)}
 oldThread.replaceChildren(...nodes);
 if(follow)scrollEnd();else oldThread.scrollTop=prior;
}
function sync(){
 if(!active())return;
 const entered=!!nativeInput.value.trim(),busy=!!activeAction;
 const shouldSend=entered||busy;
 mic.hidden=shouldSend;
 send.hidden=!shouldSend;
 send.type=busy?'button':'submit';
 send.innerHTML=busy?svgs.stop:svgs.send;
 nativeForm.classList.toggle('sayvi3-has-text',entered);
 nativeInput.style.height='42px';
 nativeInput.style.height=Math.max(42,Math.min(112,nativeInput.scrollHeight))+'px';
}
function open(){
 if(active()){
  nativeForm.hidden=false;sync();return;
 }
 if(home.hidden){returnRoute=location.hash||'';$('navHome')?.click()}
 if(home.hidden)return;
 root.classList.add('seyveo-conversation');
 page.hidden=false;syncViewport();
 const parent=oldThread.parentElement;
 if(parent!==transcript)transcript.appendChild(oldThread);
 writer.prepend(nativeForm);nativeForm.classList.remove('expanded');
 $('composerModeAsk')?.click();
 nativeForm.hidden=false;nativeForm.dataset.composerMode='ask';
 window.SEYVEO_DEMO_CHAT_ACTIVE=true;
 renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||window.SEYVEO_CHAT_HISTORY?.recent?.(30)||[]);
 sync();scrollEnd();
}
function close(){
 if(!active())return;
 window.dispatchEvent(new Event('seyveo:conversation-closed'));
 window.SEYVEO_CONVERSATION_STOP_VOICE?.();
 if(activeAction){try{activeAction.cancel?.()}catch{}activeAction=null}
 page.hidden=true;root.classList.remove('seyveo-conversation');
 page.style.removeProperty('--sayvi3-top');page.style.removeProperty('--sayvi3-height');
 tools.hidden=true;intro=null;window.SEYVEO_DEMO_CHAT_ACTIVE=false;
 if(originThreadNext?.parentNode===originThreadParent)originThreadParent.insertBefore(oldThread,originThreadNext);
 else originThreadParent.appendChild(oldThread);
 if(originFormNext?.parentNode===originFormParent)originFormParent.insertBefore(nativeForm,originFormNext);
 else originFormParent.appendChild(nativeForm);
 nativeForm.style.removeProperty('--sayvi-draft-height');
 nativeForm.hidden=true;
 oldReply.hidden=true;
 $('stage')?.classList.remove('has-inline-reply');
 const route=returnRoute;returnRoute='';
 if(route&&location.hash!==route)location.hash=route;
}
$('seyveoConversationBack').addEventListener('click',close);
$('seyveoConversationHistory').addEventListener('click',()=>window.SEYVEO_CHAT_HISTORY?.open?.());
plus.addEventListener('click',()=>{tools.hidden=!tools.hidden});
tools.addEventListener('click',e=>{
 const t=e.target.closest('[data-tool]')?.dataset.tool;if(!t)return;
 tools.hidden=true;
 if(t==='browser')window.SEYVEO_BROWSER?.open?.();
 else if(t==='note'&&nativeInput.value.trim())note(nativeInput.value.trim());
});
mic.addEventListener('click',()=>window.SEYVEO_CONVERSATION_TOGGLE_VOICE?.());
send.addEventListener('click',e=>{if(!activeAction)return;e.preventDefault();e.stopImmediatePropagation();try{activeAction.cancel?.()}catch{}activeAction=null;sync();status('Остановлено',1200)});
nativeInput.addEventListener('input',sync);
nativeInput.addEventListener('keydown',e=>{if(active()&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();nativeForm.requestSubmit()}});
nativeForm.addEventListener('submit',()=>{
 queueMicrotask(()=>{sync();if(!intro)renderTurns(window.SEYVEO_DEMO_CHAT_TURNS||[])});
 // Native locally handled actions can close the composer; the separate chat
 // always retains its input after a response if the user stays here.
 setTimeout(()=>{if(active()){nativeForm.hidden=false;sync()}},340);
});
window.addEventListener('seyveo:chat-history-cleared',()=>{window.SEYVEO_DEMO_CHAT_TURNS=[];if(active())renderTurns([])});
window.addEventListener('hashchange',()=>{if(active()&&(home.hidden||(location.hash&&!['','#home'].includes(location.hash)))){returnRoute='';close()}});
document.addEventListener('seyveo:assistant-presence',e=>{
 if(!active())return;const stage=e.detail?.phase;
 if(stage==='listening'){mic.setAttribute('aria-pressed','true');status('Сэйви слушает…')}
 else if(stage==='thinking'){status('Сэйви думает…')}
 else if(stage==='speaking'){speaking=true;status('Сэйви отвечает…')}
 else if(['stop','end','listening-end'].includes(stage)){mic.setAttribute('aria-pressed','false');speaking=false;status()}
});
function beginStream(question,cancel){
 open();if(typeof cancel==='function')activeAction={cancel};sync();
 renderTurns([...(window.SEYVEO_DEMO_CHAT_TURNS||[]),{question:String(question||''),answer:''}]);
 streamNode=oldThread.querySelector('.seyveo-conversation-turn--sayvi:last-child .seyveo-conversation-body');
 if(streamNode)streamNode.textContent='Сэйви думает…';status('Сэйви пишет…');scrollEnd();
}
function updateStream(answer){if(!streamNode?.isConnected)return;const follow=nearEnd();streamNode.textContent=String(answer??'');if(follow)scrollEnd()}
function endStream(){streamNode=null;activeAction=null;sync();status()}
function beginBusinessIntroduction(){
 open();
 const turns=window.SEYVEO_DEMO_CHAT_TURNS||[];
 renderTurns([...turns,{question:'Хочу рассказать о своём бизнесе',answer:'Расскажи, чем занимается твой бизнес. Сохраним информацию только с твоего согласия.',smartStart:true}]);
 return true;
}
$('openSayviBusinessIntro')?.addEventListener('click',beginBusinessIntroduction);
window.SEYVEO_CHAT_ACTIVITY=Object.freeze({begin:cancel=>{if(activeAction)return false;activeAction={cancel};sync();status('Сэйви обрабатывает…');return true},
 finish:()=>{activeAction=null;sync();status()},cancel:()=>{if(!activeAction)return false;try{activeAction.cancel?.()}catch{}activeAction=null;sync();return true},isBusy:()=>!!activeAction});
window.SEYVEO_CONVERSATION={
 open,close,renderTurns,status,beginStream,updateStream,endStream,
 beginBusinessIntroduction,showSearchResults:payload=>{
  const question=String(payload?.query||''),answer=String(payload?.answer||payload?.message||'Результаты не найдены');
  const turns=window.SEYVEO_DEMO_CHAT_TURNS||(window.SEYVEO_DEMO_CHAT_TURNS=[]);
  turns.push({question,answer,search:payload?.status==='results'?payload:null});open();renderTurns(turns);return true;
 },
 showRichAnswer:payload=>{
  const turns=window.SEYVEO_DEMO_CHAT_TURNS||(window.SEYVEO_DEMO_CHAT_TURNS=[]);
  turns.push({question:String(payload?.question||''),answer:String(payload?.answer||''),rich:payload?.blocks});open();renderTurns(turns);return true;
 }};
window.addEventListener('seyveo:web-search-results',e=>{if(e.detail)window.SEYVEO_CONVERSATION.showSearchResults(e.detail)});
window.addEventListener('seyveo:rich-answer',e=>{if(e.detail)window.SEYVEO_CONVERSATION.showRichAnswer(e.detail)});
})();
