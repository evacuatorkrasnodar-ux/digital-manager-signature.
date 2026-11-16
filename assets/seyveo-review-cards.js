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
 // The permanent Home button is retired; only the Work capsule opens review.
 const greetingSubline=document.getElementById('subline');
 const greetingAction=document.createElement('button');
 greetingAction.type='button';greetingAction.id='svHomeReviewText';
 greetingAction.className='sv-home-review-text';greetingAction.hidden=true;
 greetingAction.setAttribute('aria-label','Открыть карточки для разбора');
 greetingSubline?.after(greetingAction);
 const room=document.createElement('section');
 room.id='svReviewRoom';room.className='sv-review-room';room.hidden=true;
 room.setAttribute('role','dialog');room.setAttribute('aria-modal','true');room.setAttribute('aria-label','Разобрать дела');
 room.innerHTML='<header class="sv-review-header"><button type="button" id="svReviewBack" aria-label="Назад на главную"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><h2>Разобрать дела</h2><span id="svReviewProgress"></span></header><div class="sv-review-content" id="svReviewContent"></div>';
 document.body.append(room);
 const content=room.querySelector('#svReviewContent');
 let open=false;
 let lastCount=-1,returnFocus=null;
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
  line.hidden=true;
  if(total!==lastCount){lastCount=total;window.dispatchEvent(new CustomEvent('seyveo:review-count',{detail:{count:total}}));}
  greetingAction.hidden=!total;
  if(total){
   const form=total%10===1&&total%100!==11?'карточка':total%10>=2&&total%10<=4&&(total%100<12||total%100>14)?'карточки':'карточек';
   const label=`Есть ${total} ${form} для разбора`;
   const text=label+'  ›';
   if(greetingAction.textContent!==text)greetingAction.textContent=text;
  }
  const number=total?'· '+total:'';
  const progress=total?total+' осталось':'Всё разобрано';
  // The retired Home control is deliberately detached from document.
  const retiredCount=line.querySelector('#svReviewCount');
  if(retiredCount&&retiredCount.textContent!==number)retiredCount.textContent=number;
  if(document.getElementById('svReviewProgress').textContent!==progress)document.getElementById('svReviewProgress').textContent=progress;
  room.classList.toggle('sv-review-empty',!total);
  positionEntry();
 }
 function positionEntry(){
  if(line.hidden||home.hidden||open)return;
  const base=home.getBoundingClientRect().top;
  let bottom=0;
  for(const selector of ['#stage > .message','#svSayviHomeWeather','#svHomeLivingLine']){
   const node=home.querySelector(selector);
   if(!node||node.hidden)continue;
   const style=getComputedStyle(node);
   if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)<.05)continue;
   bottom=Math.max(bottom,node.getBoundingClientRect().bottom);
  }
  if(!bottom)return;
  const next=Math.round(bottom-base+14)+'px';
  if(line.style.getPropertyValue('--sv-review-top')!==next)line.style.setProperty('--sv-review-top',next);
 }
 function moveIn(element){
  if(!element||original.has(element))return;
  original.set(element,{parent:element.parentNode,next:element.nextSibling});
  content.append(element);
 }
 function enter(){
  if(open)return;
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
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
 }
 window.addEventListener('seyveo:open-card-review',enter);
 greetingAction.addEventListener('click',enter);
 room.querySelector('#svReviewBack').addEventListener('click',leave);
 window.addEventListener('keydown',event=>{if(open&&event.key==='Escape')leave()});
 window.addEventListener('hashchange',()=>{if(open&&location.hash&&location.hash!=='#home')leave()});
 const observer=new MutationObserver(()=>{if(!document.hidden)requestAnimationFrame(update)});
 for(const element of sources())observer.observe(element,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden','class']});
 observer.observe(home,{childList:true,subtree:false});
 const textObserver=new MutationObserver(()=>requestAnimationFrame(positionEntry));
 for(const element of [home.querySelector('#stage > .message'),document.getElementById('svSayviHomeWeather'),document.getElementById('svHomeLivingLine')].filter(Boolean)){
  textObserver.observe(element,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});
 }
 textObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',positionEntry);
 ['seyveo:tasks-changed','seyveo:calendar-changed','seyveo:card-visibility-changed','seyveo:home-recommendation-changed'].forEach(name=>window.addEventListener(name,update));
 setInterval(update,900);
 update();
})();
