/* SEYVEO · Sayvi chat notification center.
   In-session UI notifications only. No push permissions, no network
   requests and no persistence of possibly private status messages. */
(()=>{
 'use strict';
 const main=document.querySelector('main');
 const composer=document.getElementById('sayviComposer');
 const status=document.getElementById('sayviStatus');
 if(!main||!composer||!status||document.getElementById('sayviNoticeToggle'))return;

 const button=document.createElement('button');
 button.type='button';
 button.id='sayviNoticeToggle';
 button.setAttribute('aria-label','Центр уведомлений');
 button.setAttribute('aria-controls','sayviNoticePanel');
 button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-haspopup','true');
 button.title='Уведомления';
 const icon=document.createElement('span');
 icon.className='sv-notice-icon';
 icon.setAttribute('aria-hidden','true');
 icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>';
 const count=document.createElement('span');
 count.id='sayviNoticeCount';
 count.hidden=true;
 icon.append(count);
 const preview=document.createElement('span');
 preview.id='sayviNoticePreview';
 button.append(icon,preview);
 composer.append(button);

 const panel=document.createElement('section');
 panel.id='sayviNoticePanel';
 panel.setAttribute('role','region');
 panel.setAttribute('aria-label','Уведомления Сэйви');
 panel.hidden=true;
 const head=document.createElement('div');
 head.className='sv-notice-head';
 const heading=document.createElement('strong');
 heading.textContent='Уведомления';
 const actions=document.createElement('div');
 actions.className='sv-notice-actions';
 const clear=document.createElement('button');
 clear.type='button';
 clear.className='sv-notice-action';
 clear.textContent='Очистить';
 // The notification bell and a tap outside already close this panel.
 // Do not duplicate them with a text-only 'Свернуть' button.
 actions.append(clear);
 head.append(heading,actions);
 const list=document.createElement('div');
 list.className='sv-notice-items';
 panel.append(head,list);
 main.append(panel);

 let messages=[];
 let unread=0;
 let lastMessage='';
 let lastAt=0;
 const clock=new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'});
 function concise(message){
  if(/^Задача для Сэйви подготовлена/u.test(message))return 'Задача для Сэйви готова';
  if(/^Задача подготовлена\. Прикрепите/u.test(message))return 'Прикрепите документ и отправьте';
  const first=message.split(/[.!?]\s+/u)[0]||message;
  return first.length>100?first.slice(0,97)+'…':first;
 }
 function paint(){
  count.hidden=unread===0;
  if(unread)count.textContent=unread>9?'9+':String(unread);
  preview.textContent=messages.length?concise(messages[0].text):'';
  button.setAttribute('aria-label','Центр уведомлений'+(unread?', новых: '+unread:''));
  button.dataset.empty=messages.length?'false':'true';
  list.replaceChildren();
  if(!messages.length){
   const empty=document.createElement('p');
   empty.className='sv-notice-empty';
   empty.textContent='Пока нет уведомлений';
   list.append(empty);
  }else{
   for(const message of messages){
    const row=document.createElement('article');
    row.className='sv-notice-item';
    const label=document.createElement('p');
    label.textContent=message.text;
    const time=document.createElement('time');
    time.dateTime=new Date(message.at).toISOString();
    time.textContent=clock.format(message.at);
    row.append(label,time);
    list.append(row);
   }
  }
  clear.hidden=messages.length===0;
 }
 function show(open){
  const available=open&&!(!document.getElementById('sayviHistory')?.hidden);
  panel.hidden=!available;
  button.setAttribute('aria-expanded',String(available));
  if(available){
   unread=0;
   paint();
   button.focus({preventScroll:true});
  }
 }
 function add(value){
  const text=String(value||'').replace(/\s+/gu,' ').trim();
  if(!text)return;
  // Progress text is ephemeral; only user-useful notices become history items.
  if(/^(?:Сэйви печатает|Слушаю|Записываю|Идёт запись|Отправляем|Загружаем|Получаем ответ)(?:[.…\s]|$)/iu.test(text))return;
  const at=Date.now();
  if(text===lastMessage&&at-lastAt<3500)return;
  lastMessage=text;lastAt=at;
  messages.unshift({text:text.slice(0,450),at});
  messages=messages.slice(0,12);
  if(panel.hidden)unread=Math.min(99,unread+1);
  paint();
 }
 button.addEventListener('click',()=>show(panel.hidden));
 clear.addEventListener('click',()=>{
  messages=[];unread=0;
  lastMessage='';lastAt=0;
  paint();
 });
 document.addEventListener('pointerdown',event=>{
  if(panel.hidden)return;
  if(button.contains(event.target)||panel.contains(event.target))return;
  show(false);
 },{passive:true});
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||panel.hidden)return;
  show(false);
  button.focus({preventScroll:true});
 });
 // Observe all existing calls that set sayviStatus.textContent without
 // editing their established send, attachment, speech and history workflows.
 const observer=new MutationObserver(()=>add(status.textContent));
 observer.observe(status,{subtree:true,childList:true,characterData:true});
 document.addEventListener('seyveo:sayvi-notice',event=>{
  if(typeof event.detail?.message==='string')add(event.detail.message);
 });
 paint();
 add(status.textContent);
})();
