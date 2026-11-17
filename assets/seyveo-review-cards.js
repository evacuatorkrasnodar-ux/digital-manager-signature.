/* SEYVEO · Quiet Home / decision room. Existing live cards keep their handlers. */
(()=>{
 'use strict';
 const home=document.getElementById('homePage');
 const stage=document.getElementById('stage');
 if(!home||!stage)return;
 const ids=['seyveoLivingMoment','dynamic','svcpWorkHomePreview','workTimeline','svSmartStartHome'];
 const original=new Map();
 const greetingSubline=document.getElementById('subline');
 // One orange count for the dock; same source as the Home review indicator.
 const tasksButton=document.getElementById('navTasks');
 const dock=tasksButton?.closest('footer.dock');
 // A direct sibling of the dock pane can really sit BEHIND its backdrop-filter.
 // A pseudo-element inside the Tasks button cannot: the button is painted above
 // the pane as a single stacking layer, regardless of a negative child z-index.
 const countUnderlay=dock?document.createElement('span'):null;
 const countDigit=countUnderlay?document.createElement('span'):null;
 if(countUnderlay&&countDigit){
  countUnderlay.className='sv-dock-review-underlay';
  countUnderlay.setAttribute('aria-hidden','true');
  countUnderlay.hidden=true;
  countDigit.className='sv-dock-review-underlay-digit';
  countUnderlay.append(countDigit);
  dock.prepend(countUnderlay);
 }

 const room=document.createElement('section');
 room.id='svReviewRoom';room.className='sv-review-room';room.hidden=true;
 room.setAttribute('role','dialog');room.setAttribute('aria-modal','true');room.setAttribute('aria-label','Разобрать дела');
 room.innerHTML='<header class="sv-review-header"><button type="button" id="svReviewBack" aria-label="Назад на главную"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><h2>Разобрать дела</h2><span id="svReviewProgress"></span></header><div class="sv-review-content" id="svReviewContent"></div>';
 document.body.append(room);
 const content=room.querySelector('#svReviewContent');
 let open=false;
 let lastCount=-1,returnFocus=null,emptyExitTimer=0;
 // Design-only fixtures: these never enter the task store, inbox or history.
 // They let the owner inspect all three card families even when Home is idle.
 const designExamples=[
  {type:'document',label:'ДОКУМЕНТЫ',title:'Проверить договор',note:'Сэйви заметила пункт без срока поставки.',details:'В учебном договоре не указан срок поставки. Можно проверить предложение и сохранить свою редакцию.'},
  {type:'work',label:'РАБОЧИЙ ЧАТ',title:'Елена · сообщение',note:'Выкладка товаров закончена. Нужна проверка.',details:'Сэйви предлагает открыть рабочий чат, проверить результат и ответить сотруднику.'},
  {type:'mail',label:'ПОЧТА',title:'Ответить на письмо',note:'Покупатель уточняет стоимость доставки.',details:'Сэйви может подготовить черновик ответа. Это пример: настоящее письмо не отправляется.'}
 ];
 function renderDesignCards(){
  if(content.querySelector('.sv-review-demo-list'))return;
  const list=document.createElement('div');list.className='sv-review-demo-list';
  list.setAttribute('aria-label','Учебные карточки для проверки дизайна');
  for(const item of designExamples){
   const card=document.createElement('article');card.className='sv-review-demo-card';
   card.dataset.kind=item.type;
   const top=document.createElement('div');top.className='sv-review-demo-top';
   const label=document.createElement('span');label.textContent=item.label;
   const example=document.createElement('span');example.textContent='ПРИМЕР';
   top.append(label,example);
   const hero=document.createElement('div');hero.className='sv-review-demo-hero';
   const art=document.createElement('span');art.className='sv-review-demo-art';art.setAttribute('aria-hidden','true');
   art.innerHTML=item.type==='document'?'<svg viewBox="0 0 24 24"><path d="M6 2.5h8l4 4V21H6zM14 2.5v4h4M9 11h6M9 15h6"/></svg>':
    item.type==='work'?'<svg viewBox="0 0 24 24"><path d="M4 5.5h16v11H9l-5 3zM8 10h8M8 13h5"/></svg>':
    '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
   const text=document.createElement('div');text.className='sv-review-demo-copy';
   const title=document.createElement('strong');title.textContent=item.title;
   const note=document.createElement('p');note.textContent=item.note;
   text.append(title,note);hero.append(art,text);
   const detail=document.createElement('p');detail.className='sv-review-demo-detail';detail.textContent=item.details;detail.hidden=true;
   const actions=document.createElement('div');actions.className='sv-review-demo-actions';
   const more=document.createElement('button');more.type='button';more.textContent='Подробнее';
   more.setAttribute('aria-expanded','false');
   more.addEventListener('click',()=>{detail.hidden=!detail.hidden;more.setAttribute('aria-expanded',String(!detail.hidden))});
   const complete=document.createElement('button');complete.type='button';complete.textContent='Исполнить';
   complete.className='sv-review-demo-primary';
   complete.addEventListener('click',()=>{const done=card.classList.toggle('sv-review-demo-done');complete.textContent=done?'Вернуть':'Исполнить'});
   const later=document.createElement('button');later.type='button';later.textContent='Позже';
   later.addEventListener('click',()=>{list.append(card)});
   actions.append(more,complete,later);card.append(top,hero,detail,actions);list.append(card);
  }
  content.append(list);
 }
 function sources(){return ids.map(id=>document.getElementById(id)).filter(Boolean)}
 // The Home CSS deliberately masks cards, so count logical visibility,
 // not computed display (which is none until the room opens).
 function active(element){return !element.hidden}
 function count(){
  const living=document.getElementById('seyveoLivingMoment');
  const tiles=document.getElementById('seyveoLivingTiles');
  const pendingPreview=Number(window.SEYVEO_LIVING_MOMENT?.reviewCount?.())||0;
  const livingCount=pendingPreview>0?1:(living&&active(living)?Math.max(1,tiles?.querySelectorAll('.lm-field').length||0):0);
  const dynamic=document.getElementById('dynamic');
  const decisions=dynamic&&!dynamic.hidden?Array.from(dynamic.children).filter(el=>!el.hidden).length:0;
  const others=['svcpWorkHomePreview','workTimeline','svSmartStartHome'].filter(id=>{
   const item=document.getElementById(id);return item&&active(item);
  }).length;
  const today=document.querySelector('.sv-sayvi-handoff-today');
  return livingCount+decisions+others+(today&&active(today)?1:0);
 }
 function update(){
  const total=count();
  if(tasksButton){
   if(total>0)tasksButton.setAttribute('data-sv-review-count',total>99?'99+':String(total));
   else tasksButton.removeAttribute('data-sv-review-count');
   tasksButton.setAttribute('aria-label',total?'Открыть дела · '+total+' для разбора':'Открыть дела');
  }
  // Only the disc sits below the glass; a single translucent white digit
  // is painted by the Tasks button to avoid a blurry second numeral.
  if(countUnderlay)countUnderlay.hidden=total===0;
  if(total!==lastCount){lastCount=total;window.dispatchEvent(new CustomEvent('seyveo:review-count',{detail:{count:total}}));}
  // The fixed Home reminder owns the card count; no second copy.
  if(greetingSubline)greetingSubline.hidden=total>0;
  const demoCount=content.querySelectorAll('.sv-review-demo-card').length;
  const progress=demoCount?demoCount+' примера':total?total+' осталось':'Всё разобрано';
  if(document.getElementById('svReviewProgress').textContent!==progress)document.getElementById('svReviewProgress').textContent=progress;
  room.classList.toggle('sv-review-empty',!total&&!demoCount);
  // When the final decision is resolved, return to Home rather than trapping
  // the user in an empty full-screen decision room.
  if(open&&total===0&&demoCount===0&&!emptyExitTimer)emptyExitTimer=setTimeout(()=>{emptyExitTimer=0;if(open&&count()===0)leave()},450);
  else if(total>0&&emptyExitTimer){clearTimeout(emptyExitTimer);emptyExitTimer=0;}
 }
 function moveIn(element){
  if(!element||original.has(element))return;
  original.set(element,{parent:element.parentNode,next:element.nextSibling});
  content.append(element);
 }
 function enter(){
  if(open)return;
  // Restore an unfinished demo before moving its real card into the room.
  window.SEYVEO_LIVING_MOMENT?.ensureReviewCards?.();
  returnFocus=document.activeElement;
  open=true;
  sources().forEach(moveIn);
  moveIn(document.querySelector('.sv-sayvi-handoff-today'));
  renderDesignCards();
  room.hidden=false;
  document.documentElement.classList.add('sv-review-open');
  update();
  room.querySelector('#svReviewBack').focus({preventScroll:true});
 }
 function leave(){
  clearTimeout(emptyExitTimer);emptyExitTimer=0;
  if(!open){room.hidden=true;document.documentElement.classList.remove('sv-review-open');return;}
  open=false;
  original.forEach((position,element)=>{
   if(position.next?.parentNode===position.parent)position.parent.insertBefore(element,position.next);
   else position.parent.append(element);
  });
  original.clear();
  content.querySelector('.sv-review-demo-list')?.remove();
  document.documentElement.classList.remove('sv-review-open');
  room.hidden=true;
  window.dispatchEvent(new Event('seyveo:review-closed'));
  update();
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
 }
 window.addEventListener('seyveo:open-card-review',enter);
 room.querySelector('#svReviewBack').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();leave()});
 window.addEventListener('keydown',event=>{if(open&&event.key==='Escape')leave()});
 window.addEventListener('hashchange',()=>{if(open&&location.hash&&location.hash!=='#home')leave()});
 const observer=new MutationObserver(()=>{if(!document.hidden)requestAnimationFrame(update)});
 for(const element of sources())observer.observe(element,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden','class']});
 observer.observe(home,{childList:true,subtree:false});
 ['seyveo:tasks-changed','seyveo:calendar-changed','seyveo:card-visibility-changed','seyveo:home-recommendation-changed'].forEach(name=>window.addEventListener(name,update));
 // A script loaded after the first review-count event can read current state.
 window.SEYVEO_REVIEW_CARDS=Object.freeze({count});
 setInterval(update,900);
 update();
})();
