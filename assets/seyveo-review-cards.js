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
 function sources(){return ids.map(id=>document.getElementById(id)).filter(Boolean)}
 // The Home CSS deliberately masks cards, so count logical visibility,
 // not computed display (which is none until the room opens).
 function active(element){return !element.hidden}
 function count(){
  const living=document.getElementById('seyveoLivingMoment');
  const tiles=document.getElementById('seyveoLivingTiles');
  const pendingPreview=Number(window.SEYVEO_LIVING_MOMENT?.reviewCount?.())||0;
  const livingCount=pendingPreview>0?(window.SEYVEO_LIVING_MOMENT?.reviewExamplesActive?.()?pendingPreview:1):
   (living&&active(living)?Math.max(1,tiles?.querySelectorAll('.lm-field').length||0):0);
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
  const demoCount=window.SEYVEO_LIVING_MOMENT?.reviewExamplesActive?.()?
   Number(window.SEYVEO_LIVING_MOMENT?.reviewCount?.())||0:0;
  const demoLabel=demoCount===1?'карточка':demoCount>=2&&demoCount<=4?'карточки':'карточек';
  const progress=demoCount?demoCount+' '+demoLabel:total?total+' осталось':'Всё разобрано';
  if(document.getElementById('svReviewProgress').textContent!==progress)document.getElementById('svReviewProgress').textContent=progress;
  room.classList.toggle('sv-review-empty',!total);
  // When the final decision is resolved, return to Home rather than trapping
  // the user in an empty full-screen decision room.
  if(open&&total===0&&!emptyExitTimer)emptyExitTimer=setTimeout(()=>{emptyExitTimer=0;if(open&&count()===0)leave()},450);
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
  window.SEYVEO_LIVING_MOMENT?.showReviewExamples?.();
  returnFocus=document.activeElement;
  open=true;
  sources().forEach(moveIn);
  moveIn(document.querySelector('.sv-sayvi-handoff-today'));
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
