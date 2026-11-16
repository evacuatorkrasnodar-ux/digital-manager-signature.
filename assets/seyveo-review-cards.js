/* SEYVEO · Quiet Home / decision room. Existing live cards keep their handlers. */
(()=>{
 'use strict';
 const home=document.getElementById('homePage');
 const stage=document.getElementById('stage');
 if(!home||!stage)return;
 const ids=['seyveoLivingMoment','dynamic','svcpWorkHomePreview','workTimeline','svSmartStartHome'];
 const original=new Map();
 const line=document.createElement('button');
 line.id='svReviewEntry';line.type='button';line.className='sv-review-entry';
 line.innerHTML='<span class="sv-review-entry-copy">Разобрать дела <span id="svReviewCount"></span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
 stage.after(line);
 const room=document.createElement('section');
 room.id='svReviewRoom';room.className='sv-review-room';room.hidden=true;
 room.setAttribute('role','dialog');room.setAttribute('aria-modal','true');room.setAttribute('aria-label','Разобрать дела');
 room.innerHTML='<header class="sv-review-header"><button type="button" id="svReviewBack" aria-label="Назад на главную"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><h2>Разобрать дела</h2><span id="svReviewProgress"></span></header><div class="sv-review-content" id="svReviewContent"></div>';
 document.body.append(room);
 const content=room.querySelector('#svReviewContent');
 let open=false;
 function sources(){return ids.map(id=>document.getElementById(id)).filter(Boolean)}
 // The Home CSS deliberately masks cards, so count logical visibility,
 // not computed display (which is none until the room opens).
 function active(element){return !element.hidden}
 function count(){
  const living=document.getElementById('seyveoLivingMoment');
  const tiles=document.getElementById('seyveoLivingTiles');
  const livingCount=living&&active(living)?Math.max(1,tiles?.querySelectorAll('.lm-field').length||0):0;
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
  line.hidden=!total;
  document.getElementById('svReviewCount').textContent=total?'· '+total:'';
  document.getElementById('svReviewProgress').textContent=total?total+' осталось':'Всё разобрано';
  room.classList.toggle('sv-review-empty',!total);
 }
 function moveIn(element){
  if(!element||original.has(element))return;
  original.set(element,{parent:element.parentNode,next:element.nextSibling});
  content.append(element);
 }
 function enter(){
  if(open)return;
  open=true;
  sources().forEach(moveIn);
  moveIn(document.querySelector('.sv-sayvi-handoff-today'));
  room.hidden=false;
  document.documentElement.classList.add('sv-review-open');
  update();
  room.querySelector('#svReviewBack').focus({preventScroll:true});
 }
 function leave(){
  if(!open)return;
  open=false;
  original.forEach((position,element)=>{
   if(position.next?.parentNode===position.parent)position.parent.insertBefore(element,position.next);
   else position.parent.append(element);
  });
  original.clear();
  document.documentElement.classList.remove('sv-review-open');
  room.hidden=true;
  update();
  line.focus({preventScroll:true});
 }
 line.addEventListener('click',enter);
 window.addEventListener('seyveo:open-card-review',enter);
 room.querySelector('#svReviewBack').addEventListener('click',leave);
 window.addEventListener('keydown',event=>{if(open&&event.key==='Escape')leave()});
 window.addEventListener('hashchange',()=>{if(open&&location.hash&&location.hash!=='#home')leave()});
 const observer=new MutationObserver(()=>{if(!document.hidden)requestAnimationFrame(update)});
 for(const element of sources())observer.observe(element,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden','class']});
 observer.observe(home,{childList:true,subtree:false});
 ['seyveo:tasks-changed','seyveo:calendar-changed','seyveo:card-visibility-changed','seyveo:home-recommendation-changed'].forEach(name=>window.addEventListener(name,update));
 setInterval(update,2500);
 update();
})();
