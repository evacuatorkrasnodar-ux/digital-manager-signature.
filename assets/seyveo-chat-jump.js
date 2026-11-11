/* SEYVEO · scroll to the latest message in Sayvi and Work Messenger.
   Only a visual navigation aid. Never modifies messages, send, history or
   the chat's existing automatic scrolling decisions. */
(()=>{
 'use strict';

 function mount({listId,container,composerId,buttonId,available,watch=[]}){
  const list=document.getElementById(listId);
  const composer=document.getElementById(composerId);
  const surface=container?.();
  if(!list||!composer||!surface||document.getElementById(buttonId))return;
  const button=document.createElement('button');
  button.type='button';button.id=buttonId;button.className='sv-chat-jump';
  button.setAttribute('aria-label','Перейти к последнему сообщению');
  button.title='Вниз к новым сообщениям';
  button.hidden=true;
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4.5v14m0 0-6-6m6 6 6-6"/></svg>';
  surface.append(button);

  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let frame=0;
  function update(){
   frame=0;
   if(!list.isConnected||!surface.isConnected||!available()||
      list.clientHeight<80||list.getClientRects().length===0){
    button.hidden=true;
    return;
   }
   const distance=Math.max(0,list.scrollHeight-list.scrollTop-list.clientHeight);
   button.hidden=distance<=125;
   if(button.hidden)return;
   // Position above the *visible* input rather than guessing dock height.
   // It follows multiline input, attachment trays and mobile keyboard resize.
   const parentRect=surface.getBoundingClientRect();
   const composerRect=composer.getBoundingClientRect();
   const space=parentRect.bottom-composerRect.top+12;
   const limit=Math.max(22,parentRect.height-70);
   button.style.bottom=Math.min(limit,Math.max(22,Math.ceil(space)))+'px';
  }
  function schedule(){
   if(frame)return;
   frame=requestAnimationFrame(update);
  }
  button.addEventListener('click',()=>{
   list.scrollTo({
    top:list.scrollHeight,
    behavior:reduced?.matches?'auto':'smooth'
   });
   schedule();
  });
  list.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  const changes=new MutationObserver(schedule);
  changes.observe(list,{childList:true,subtree:true,characterData:true});
  for(const item of watch){
   if(item)changes.observe(item,{attributes:true,attributeFilter:['hidden','data-view','style','class']});
  }
  if(typeof ResizeObserver==='function'){
   const sizeObserver=new ResizeObserver(schedule);
   sizeObserver.observe(list);
   sizeObserver.observe(composer);
   sizeObserver.observe(surface);
  }
  schedule();
 }

 function init(){
  const sayvi=document.querySelector('main');
  const history=document.getElementById('sayviHistory');
  mount({
   listId:'sayviMessages',
   container:()=>sayvi,
   composerId:'sayviComposer',
   buttonId:'sayviScrollBottom',
   available:()=>!history||history.hidden,
   watch:[history]
  });

  const workScreen=document.getElementById('svcpWorkChatScreen');
  const workRoom=document.getElementById('svcpConversation');
  mount({
   listId:'svcpMessages',
   container:()=>document.getElementById('svcpMessages')?.closest('.svcp-chat'),
   composerId:'svcpChatForm',
   buttonId:'svcpScrollBottom',
   available:()=>!!workScreen&&!workScreen.hidden&&
    workScreen.contains(document.getElementById('svcpMessages'))&&
    !!workRoom&&!workRoom.hidden&&workScreen.dataset.view==='room',
   watch:[workScreen,workRoom]
  });
 }
 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
 }else init();
})();
