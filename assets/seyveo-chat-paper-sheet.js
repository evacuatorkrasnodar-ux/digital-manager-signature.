/* SEYVEO Sayvi · Notebook Paper inside a native-feeling bottom sheet.
 * Reuses the full approved Notebook editor in a same-origin child frame.
 * The chat, its history and composer remain mounted and unchanged.
 */
(()=>{
 'use strict';
 const scene=document.querySelector('main');
 const input=document.getElementById('sayviInput');
 const menu=document.getElementById('sayviMenu');
 const plus=document.getElementById('sayviPlus');
 if(!scene||!input||!menu||!plus||window.SEYVEO_SAYVI_PAPER)return;
 const KEY='seyveo.sayvi.paper-handoff.v1';
 const MAX_AGE=15*60*1000;
 const scrim=document.createElement('div');
 scrim.id='sayviPaperScrim';scrim.hidden=true;
 scrim.setAttribute('aria-hidden','true');
 const sheet=document.createElement('section');
 sheet.id='sayviPaperSheet';sheet.hidden=true;
 sheet.setAttribute('role','dialog');
 sheet.setAttribute('aria-modal','true');
 sheet.setAttribute('aria-label','Планшет рисования Сэйви');
 scene.append(scrim,sheet);
 let frame=null;
 let token='';
 let isOpen=false;
 let loading=null;
 let loadTimer=0;

 function showLoadError(){
  if(!isOpen||!loading)return;
  loading.replaceChildren();
  const message=document.createElement('p');
  message.textContent='Не удалось открыть планшет. Обнови локальный сервер SEYVEO и сам чат.';
  const close=document.createElement('button');
  close.type='button';
  close.textContent='Закрыть';
  close.addEventListener('click',()=>{
   hide();
   try{sessionStorage.removeItem(KEY)}catch{}
  });
  loading.append(message,close);
 }

 function hide(){
  if(!isOpen)return;
  isOpen=false;
  if(loadTimer){clearTimeout(loadTimer);loadTimer=0;}
  scrim.hidden=true;sheet.hidden=true;
  sheet.replaceChildren();
  frame=null;token='';loading=null;
  scene.classList.remove('sayvi-paper-open');
  document.getElementById('sayviDrawIdea')?.setAttribute('aria-expanded','false');
  // Do not force the mobile keyboard open when closing the drawing sheet.
 }
 function problem(message){
  const status=document.getElementById('sayviStatus');
  if(status)status.textContent=message;
 }
 function requestClose(){
  if(!isOpen)return;
  if(!frame?.contentWindow){hide();return}
  try{
   frame.contentWindow.postMessage({type:'seyveo:paper-request-close'},location.origin);
  }catch{hide()}
 }
 async function receive(event){
  if(!isOpen||!frame||event.origin!==location.origin||
     event.source!==frame.contentWindow)return;
  const data=event.data;
  if(!data||data.nonce!==token)return;
  if(data.type==='seyveo:paper-loaded'){
   if(loadTimer){clearTimeout(loadTimer);loadTimer=0;}
   loading?.remove();
   loading=null;
   return;
  }
  if(data.type!=='seyveo:paper-handoff')return;
  const state=data.state,ref=data.ref;
  if(state!=='ready'&&state!=='cancelled')return;
  hide();
  try{sessionStorage.removeItem(KEY)}catch{}
  if(state==='cancelled')return;
  if(typeof ref!=='string'||!/^doc-[a-z0-9-]{8,90}$/i.test(ref)){
   problem('Не удалось получить рисунок из планшета.');return;
  }
  try{
   const file=await window.SEYVEO_CHAT_FILES?.restore(ref);
   if(!file||file.type!=='image/png'||file.size>8*1024*1024){
    problem('Не удалось восстановить рисунок. Повтори прикрепление.');return;
   }
   // The existing attachment handler owns previews and send validation.
   document.dispatchEvent(new CustomEvent('seyveo:sayvi-paper-attach',
    {detail:{file}}));
  }catch{problem('Не удалось прикрепить рисунок.')}
 }
 window.addEventListener('message',receive);
 scrim.addEventListener('click',requestClose);
 document.addEventListener('keydown',event=>{
  if(isOpen&&event.key==='Escape'){
   event.preventDefault();requestClose();
  }
 });
 function open(){
  if(isOpen)return;
  const activeHistory=document.getElementById('sayviHistory');
  if(activeHistory&&!activeHistory.hidden)return;
  menu.hidden=true;
  scene.classList.remove('sayvi-menu-open');
  plus.setAttribute('aria-expanded','false');
  input.blur();
  if(!window.SEYVEO_CHAT_FILES?.remember){
   problem('Планшет временно недоступен. Обнови страницу.');return;
  }
  try{
   token=typeof crypto.randomUUID==='function'
    ?crypto.randomUUID()
    :String(Date.now())+'-'+Math.random().toString(36).slice(2);
   sessionStorage.setItem(KEY,JSON.stringify({
    at:Date.now(),state:'open',draft:input.value.slice(0,8000),nonce:token
   }));
  }catch{problem('Не удалось подготовить планшет.');return}
  frame=document.createElement('iframe');
  frame.className='sayvi-paper-frame';
  frame.title='Рисование в чате Сэйви';
  frame.setAttribute('loading','eager');
  frame.setAttribute('referrerpolicy','same-origin');
  frame.src='./index.html?seyveo-draw=chat&embed=1';
  frame.addEventListener('error',()=>{
   problem('Планшет не загрузился. Попробуй снова.');
   hide();
  });
  loading=document.createElement('div');
  loading.className='sayvi-paper-loading';
  loading.setAttribute('role','status');
  loading.textContent='Открываю планшет рисования…';
  sheet.append(frame,loading);
  isOpen=true;
  loadTimer=setTimeout(showLoadError,7000);
  scrim.hidden=false;sheet.hidden=false;
  scene.classList.add('sayvi-paper-open');
  document.getElementById('sayviDrawIdea')?.setAttribute('aria-expanded','true');
 }
 window.SEYVEO_SAYVI_PAPER=Object.freeze({open,requestClose});
})();
