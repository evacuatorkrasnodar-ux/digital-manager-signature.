/* SEYVEO · quiet card reminders; sphere, weather and dock never move. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const home=document.getElementById('homePage');
 const stage=document.getElementById('stage');
 if(!home||!stage)return;
 const FIRST_HIDE_MS=60000,NOTICE_MS=15000,REMINDER_MS=180000;
 let hideTimer=0,lastCount=0;
 const notice=document.createElement('button');
 notice.id='svHomeCalmDetails';notice.type='button';notice.hidden=true;
 notice.setAttribute('aria-label','Открыть карточки для разбора');
 stage.after(notice);
 const isHome=()=>!home.hidden&&(!location.hash||location.hash==='#home')&&
   !document.hidden&&!root.classList.contains('seyveo-conversation');
 // Home copy never outruns Sayvi's physical return from the dock.
 const sayviSettled=()=>root.classList.contains('sv-home-empty-arrived')&&
   !root.classList.contains('sv-home-empty-arriving')&&
   !root.classList.contains('sv-home-empty-sphere-leaving');
 const reviewOpen=()=>root.classList.contains('sv-review-open')||!!document.querySelector('dialog[open]');
 const label=()=>{
  const form=lastCount%10===1&&lastCount%100!==11?'карточка':lastCount%10>=2&&lastCount%10<=4&&(lastCount%100<12||lastCount%100>14)?'карточки':'карточек';
  return `Есть ${lastCount} ${form} для разбора  ›`;
 };
 function paint(){
  const visible=lastCount>0&&isHome()&&sayviSettled()&&!reviewOpen()&&
   !root.classList.contains('sv-home-reminder-hidden')&&root.classList.contains('sv-home-greeting-expired');
  notice.hidden=!visible;
  if(lastCount&&notice.textContent!==label())notice.textContent=label();
 }
 function hide(){
  if(!isHome()||reviewOpen())return;
  root.classList.add('sv-home-reminder-hidden');paint();
 }
 function scheduleHide(delay=NOTICE_MS){
  clearTimeout(hideTimer);
  hideTimer=setTimeout(()=>{if(reviewOpen())scheduleHide(NOTICE_MS);else hide()},delay);
 }
 function show(delay=NOTICE_MS){
  if(!isHome()||!sayviSettled()||reviewOpen()||!lastCount)return;
  root.classList.remove('sv-home-reminder-hidden');paint();scheduleHide(delay);
 }
 function wakeOnBlank(event){
  if(!isHome()||!lastCount||!root.classList.contains('sv-home-reminder-hidden'))return;
  if(event.target.closest?.('button,a,input,textarea,select,[role="button"],header,footer,nav,dialog,#orb,#svHomeLivingLine'))return;
  show();event.stopPropagation();
 }
 // Window capture runs before older document-level handlers. Touch is an iOS fallback.
 window.addEventListener('pointerdown',wakeOnBlank,{capture:true,passive:true});
 window.addEventListener('touchstart',wakeOnBlank,{capture:true,passive:true});
 document.addEventListener('click',event=>{
  if(!isHome())return;
  if(event.target.closest?.('button,a,input,textarea,select,[role="button"],header,footer,nav,dialog,#orb,#svHomeLivingLine'))return;
  // Fallback when an older script intercepted pointerdown on iPhone.
  if(root.classList.contains('sv-home-reminder-hidden'))show();
  // No invisible full-screen chat shortcut: Chat belongs to the sphere.
  event.preventDefault();event.stopImmediatePropagation();
 },true);
 notice.addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:open-card-review')));
 window.addEventListener('seyveo:review-count',event=>{
  lastCount=Math.max(0,Number(event.detail?.count)||0);paint();
 });
 window.addEventListener('seyveo:home-sayvi-arrived',()=>{
  root.classList.remove('sv-home-reminder-hidden');paint();scheduleHide(FIRST_HIDE_MS);
 });
 window.addEventListener('hashchange',()=>{
  root.classList.remove('sv-home-reminder-hidden');paint();
  if(isHome())scheduleHide(FIRST_HIDE_MS);else clearTimeout(hideTimer);
 });
 window.addEventListener('seyveo:route-changed',()=>{
  if(isHome()){root.classList.remove('sv-home-reminder-hidden');paint();scheduleHide(FIRST_HIDE_MS)}
  else clearTimeout(hideTimer);
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)clearTimeout(hideTimer);
  else if(isHome()){paint();scheduleHide(FIRST_HIDE_MS)}
 });
 // Independently of taps, unresolved cards reappear every three minutes.
 setInterval(()=>show(NOTICE_MS),REMINDER_MS);
 new MutationObserver(paint).observe(root,{attributes:true,attributeFilter:['class']});
 // Review cards announce their count before this late-loaded script exists.
 lastCount=Math.max(0,Number(window.SEYVEO_REVIEW_CARDS?.count?.())||0);
 if(isHome())scheduleHide(FIRST_HIDE_MS);
 paint();
})();
