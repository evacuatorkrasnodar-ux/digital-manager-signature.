/* SEYVEO · two intentional Home states. Never changes dock/navigation. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const home=document.getElementById('homePage');
 const stage=document.getElementById('stage');
 if(!home||!stage)return;
 const IDLE_MS=60000,PEEK_MS=15000;
 let timer=0,lastCount=0;
 const calmDetails=document.createElement('button');
 calmDetails.id='svHomeCalmDetails';calmDetails.type='button';calmDetails.hidden=true;
 calmDetails.setAttribute('aria-label','Открыть карточки для разбора');
 stage.after(calmDetails);
 const isHome=()=>!home.hidden&&(!location.hash||location.hash==='#home')&&!document.hidden;
 const canRest=()=>isHome()&&root.classList.contains('sv-home-empty-arrived')&&
  !root.classList.contains('sv-home-empty-arriving')&&
  !root.classList.contains('sv-music-ambient')&&
  !root.classList.contains('seyveo-conversation')&&
  !root.classList.contains('sv-review-open')&&
  !home.querySelector('#svHomeLivingLine[data-sv-typing="true"]')&&
  !home.querySelector('#svHomeLivingLine:focus-within')&&
  !home.querySelector('input:focus,textarea:focus')&&
  !document.querySelector('dialog[open]');
 function updateDetails(){
  calmDetails.hidden=!lastCount||!root.classList.contains('sv-home-greeting-expired')||
    !root.classList.contains('sv-home-info-awake')||!isHome();
  const form=lastCount%10===1&&lastCount%100!==11?'карточка':lastCount%10>=2&&lastCount%10<=4&&(lastCount%100<12||lastCount%100>14)?'карточки':'карточек';
  const message=`Есть ${lastCount} ${form} для разбора  ›`;
  if(calmDetails.textContent!==message)calmDetails.textContent=message;
 }
 function calm(on){
  if(on&&!canRest())return;
  if(root.classList.contains('sv-home-calm')===on)return;
  root.classList.toggle('sv-home-calm',on);
  if(on)root.classList.remove('sv-home-info-awake');
  updateDetails();
  window.dispatchEvent(new CustomEvent('seyveo:home-calm-changed',{detail:{calm:on}}));
 }
 function schedule(delay=IDLE_MS){
  clearTimeout(timer);
  if(!isHome())return;
  timer=setTimeout(()=>{if(canRest())calm(true);else schedule(IDLE_MS)},delay);
 }
 function reveal(){
  if(!root.classList.contains('sv-home-calm'))return;
  root.classList.add('sv-home-info-awake');
  calm(false);
  updateDetails();
  schedule(PEEK_MS);
 }
 document.addEventListener('pointerdown',event=>{
  if(!root.classList.contains('sv-home-calm')||!home.contains(event.target))return;
  if(event.target.closest('button,a,input,textarea,select,[role="button"],#orbCluster,#svHomeLivingLine'))return;
  reveal();
 },{passive:true});
 calmDetails.addEventListener('click',()=>window.dispatchEvent(new Event('seyveo:open-card-review')));
 window.addEventListener('seyveo:review-count',event=>{
  lastCount=Math.max(0,Number(event.detail?.count)||0);updateDetails();
 });
 window.addEventListener('seyveo:home-sayvi-arrived',()=>{calm(false);root.classList.remove('sv-home-info-awake');schedule()});
 window.addEventListener('hashchange',()=>{calm(false);root.classList.remove('sv-home-info-awake');schedule()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else schedule()});
 window.addEventListener('seyveo:route-changed',()=>{if(!isHome()){calm(false);root.classList.remove('sv-home-info-awake')}else schedule()});
 if(canRest())schedule();
})();
