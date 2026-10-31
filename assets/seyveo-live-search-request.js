/* SEYVEO Live Search — one existing Feather Chat, no second composer.
   Searches public topics only; never forwards memory, private chat or business data.
   The server keeps the provider API key. */
(()=>{
 'use strict';
 let active=null;
 const excludes=/(?:^|[^а-яё])(?:мой|моя|моё|мои|моих|наш|наша|наше|наши)(?=$|[^а-яё])|(?:парол|паспорт|переписк|зарплат|договор|сотрудник|клиент|банковск|медицинск|здоровь|диагноз|личн(?:ый|ые|ая)|секретн|персональн)/iu;
 function isSearchQuestion(value){
  const q=String(value||'').trim();
  if(q.length<5||q.length>600||excludes.test(q))return false;
  return /(?:в интернете|в сети|поищи|найди (?:новост|стать|фото|картин|публикац|сведения|информац)|что нового|последн(?:ие|яя|ий)|новост|сегодня|вчера|правда(?: ли| что)?|свеж(?:ие|ая|ий)|актуальн|проверь факт|покажи (?:фото|картин))/i.test(q);
 }
 function userAllowedSearch(){
  const key='seyveo-public-web-search-consent-v1';
  try{if(localStorage.getItem(key)==='yes')return true}catch{}
  // One native, explicit consent prompt. The query goes to an external
  // provider; do not silently transmit it from a new user's chat.
  if(typeof window.confirm!=='function')return false;
  const approved=window.confirm('Разрешить Сэйви проверять публичные вопросы через интернет-поиск Brave? Отправляется только текст текущего вопроса, без личной памяти и истории.');
  if(approved){try{localStorage.setItem(key,'yes')}catch{}}
  return approved;
 }
 function start(question){
  if(!isSearchQuestion(question))return false;
  if(active)return true;
  const conversation=window.SEYVEO_CONVERSATION;
  if(!conversation?.beginStream||!conversation?.showSearchResults)return false;
  const controller=new AbortController();
  const task={controller};
  active=task;
  const cancel=()=>{
   controller.abort();
   if(active===task)active=null;
   conversation.updateStream?.('Поиск остановлен.');
   conversation.endStream?.();
  };
  conversation.beginStream(question,cancel);
  conversation.updateStream?.('Сэйви проверяет информацию в интернете…');
  (async()=>{
   try{
    const check=await fetch('/api/seyveo-live-search-status',{
     credentials:'same-origin',signal:controller.signal});
    if(!check.ok)throw Error('search-status-unavailable');
    const state=await check.json();
    if(controller.signal.aborted)return;
    if(state.configured!==true){
     conversation.showSearchResults({query:question,status:'unavailable',results:[],
      message:'Поисковик Brave пока не подключён. Нужен API-ключ на сервере.'});
     return;
    }
    if(!userAllowedSearch()){
     conversation.showSearchResults({query:question,status:'unavailable',results:[],
      message:'Поиск не запущен без разрешения.'});
     return;
    }
    const response=await fetch('/api/seyveo-live-search',{
     method:'POST',credentials:'same-origin',
     headers:{'content-type':'application/json'},
     body:JSON.stringify({message:question}),
     signal:controller.signal
    });
    const payload=await response.json().catch(()=>null);
    if(controller.signal.aborted)return;
    if(!payload||typeof payload!=='object')throw Error('invalid-response');
    if(!response.ok){
     conversation.showSearchResults({query:question,status:'unavailable',results:[],
      message:String(payload.message||payload.error||'Сервис поиска временно недоступен.').slice(0,240)});
    }else conversation.showSearchResults({...payload,query:question});
   }catch(error){
    if(controller.signal.aborted)return;
    conversation.showSearchResults({query:question,status:'unavailable',results:[],
     message:'Не удалось связаться с поисковым сервером. Проверю снова, когда он будет доступен.'});
   }finally{
    if(active===task){active=null;conversation.endStream?.()}
   }
  })();
  return true;
 }
 window.SEYVEO_LIVE_SEARCH_REQUEST=Object.freeze({start,isSearchQuestion});
})();
