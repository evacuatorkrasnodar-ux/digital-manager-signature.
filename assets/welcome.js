/* SEYVEO · First Light v1 · one question at a time.
   Optional local-only first-launch setup. No AI/backend/permission requests. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('welcomeDialog');
if(!dialog)return;
const PROFILE='seyveo-first-acquaintance-v1';
const SKIPPED='seyveo-first-acquaintance-skipped-v1';
const SEEN='seyveo-welcome-seen-v1';
const LEGACY=['dm-signature-living-v2','dm-signature-living-v1','seyveo-notes-v1','seyveo-first-help-seen-v1'];
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const store=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
const trim=(s,n)=>String(s||'').trim().replace(/\s+/g,' ').slice(0,n);
let step=0,assistant='Феликс',focus='life',preview=false,previewTrigger=null,openingTimer=null;
const panels=[...dialog.querySelectorAll('[data-welcome-step]')];
const intro=$('welcomeIntroTitle'),user=$('welcomePersonName'),other=$('welcomeCustomName');
const brandChoices=[...dialog.querySelectorAll('[data-welcome-assistant]')];
const focusChoices=[...dialog.querySelectorAll('[data-welcome-focus]')];
const progress=$('welcomeProgress'),next=$('welcomeNext'),back=$('welcomeBack'),skip=$('welcomeSkip');
const error=$('welcomeError');
const demoEntry=$('openWelcomeDemo'),overline=$('welcomeOverline'),disclaimer=$('welcomeDisclaimer');
function available(){
 return !read(PROFILE)&&!read(SKIPPED)&&!read(SEEN)&&!LEGACY.some(key=>read(key)!==null);
}
function markOptions(){
 brandChoices.forEach(button=>button.setAttribute('aria-pressed',String(!trim(other.value,40)&&button.dataset.welcomeAssistant===assistant)));
 focusChoices.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.welcomeFocus===focus)));
}
function assistantName(){return trim(other.value,40)||assistant}
function nickname(){const name=assistantName();return name==='Феликс'?'Филя':name==='Мелисса'?'Мили':name}
function render(){
 panels.forEach((panel,index)=>{panel.hidden=index!==step});
 progress.hidden=step===0||step===4;
 progress.replaceChildren();
 if(!progress.hidden){
  for(let i=1;i<=3;i++){const dot=document.createElement('span');dot.className=i<=step?'is-current':'';progress.append(dot)}
 }
 back.hidden=step===0;
 next.textContent=step===0?(preview?'Начать демо':'Начать знакомство'):step===4?(preview?'Показать открытие':'Открыть SEYVEO'):'Продолжить';
 skip.textContent=preview?'Выйти из демо':step===4?'Вернуться позже':'Пропустить знакомство';
 if(overline)overline.textContent=preview?'ДЕМО · ПЕРВЫЙ ЗАПУСК':'AI AUTOMATION';
 if(disclaimer)disclaimer.textContent=preview?'Это только просмотр · настройки не сохраняются':'Без доступа к контактам, микрофону и другим данным';
 error.textContent='';
 markOptions();
 if(step===4){
  $('welcomeFinalAssistant').textContent=nickname();
  $('welcomeFinalMessage').textContent=trim(user.value,60)
   ?'Рад знакомству, '+trim(user.value,60)+'. Начнём с того, что тебе важно.'
   :'Начнём с того, что тебе важно.';
 }
}
function setStep(i){
 const nextStep=Math.max(0,Math.min(4,i));
 step=nextStep;render();
 if(step!==0)dialog.classList.remove('is-cinematic');
 else if(dialog.open)playSignature();
}
function playSignature(){
 // Replaying the intro uses its own isolated animation. Never touch Home plasma.
 dialog.classList.remove('is-cinematic');
 void $('welcomeIntroTitle').offsetWidth;
 dialog.classList.add('is-cinematic');
}
function close(){
 if(openingTimer!==null){clearTimeout(openingTimer);openingTimer=null}
 dialog.classList.remove('is-cinematic','is-opening');
 if(dialog.open)dialog.close();
 const fromDemo=preview,trigger=previewTrigger;
 preview=false;previewTrigger=null;
 if(fromDemo&&trigger?.isConnected)try{trigger.focus({preventScroll:true})}catch{}
 window.dispatchEvent(new Event('seyveo:welcome-finished'));
}
function dismiss(){
 if(openingTimer!==null)return;
 if(!preview){store(SEEN,'1');store(SKIPPED,'1')}
 close();
}
function beginOpening(){
 if(openingTimer!==null)return;
 dialog.classList.remove('is-cinematic');
 dialog.classList.add('is-opening');
 const isPreview=preview;
 next.disabled=true;back.disabled=true;skip.disabled=true;
 const finish=()=>{
  if(openingTimer!==null){clearTimeout(openingTimer);openingTimer=null}
  close();
  next.disabled=false;back.disabled=false;skip.disabled=false;
  // Only the real first launch gives the EXISTING Home plasma one gentle response.
  // Management preview never changes profile, navigates away or touches the sphere.
  if(!isPreview&&!document.hidden&&!$('homePage')?.hidden){
   document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'ack'}}));
  }
 };
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
  finish();return;
 }
 openingTimer=setTimeout(finish,1800);
}
function save(){
 if(preview){beginOpening();return}
 const selectedName=assistantName();
 const voice=({'Феликс':'male','Филя':'male','Мелисса':'female','Мили':'female'})[selectedName]||null;
 const aliases=selectedName==='Феликс'?['Феликс','Филя']:selectedName==='Мелисса'?['Мелисса','Мили']:selectedName?[selectedName]:[];
 const now=new Date().toISOString();
 const profile={
  schemaVersion:1,name:trim(user.value,60),assistantName:selectedName,assistantVoice:voice,
  assistantAliases:aliases,focus,lifeIncluded:true,
  createdAt:now,updatedAt:now
 };
 if(!store(PROFILE,JSON.stringify(profile))){
  error.textContent='Не удалось сохранить настройки на устройстве. Проверьте доступ к хранилищу.';
  return;
 }
 store(SEEN,'1');
 try{localStorage.removeItem(SKIPPED)}catch{}
 window.dispatchEvent(new CustomEvent('seyveo:profile-changed',{detail:{focus}}));
 beginOpening();
}
brandChoices.forEach(button=>button.addEventListener('click',()=>{
 assistant=button.dataset.welcomeAssistant;
 other.value='';markOptions();
}));
other.addEventListener('input',markOptions);
focusChoices.forEach(button=>button.addEventListener('click',()=>{
 focus=button.dataset.welcomeFocus;markOptions();
}));
next.addEventListener('click',()=>{
 if(openingTimer!==null)return;
 if(step<4)setStep(step+1);else save();
});
function startPreview(){
 if(dialog.open||document.querySelector('dialog[open]')||window.SEYVEO_FIRST_HELP?.isActive())return;
 preview=true;previewTrigger=demoEntry;
 assistant='Феликс';focus='life';user.value='';other.value='';
 setStep(0);
 try{dialog.showModal();playSignature()}catch{preview=false;previewTrigger=null}
}
demoEntry?.addEventListener('click',startPreview);
back.addEventListener('click',()=>{if(openingTimer!==null)return;if(step>0)setStep(step-1)});
skip.addEventListener('click',dismiss);
dialog.addEventListener('cancel',event=>{
 event.preventDefault();
 if(openingTimer!==null)return;
 dismiss();
});
window.addEventListener('pagehide',()=>{
 // If the app is suspended during the one-time transition, don't leave a stuck modal.
 if(openingTimer!==null){close();next.disabled=false;back.disabled=false;skip.disabled=false}
});
function tryOpen(){
 if(dialog.open||preview||!available()||document.hidden||location.hash||document.querySelector('dialog[open]')||window.SEYVEO_FIRST_HELP?.isActive())return;
 // The setup is never imposed on existing owners and never requests permissions.
 setStep(0);
 try{dialog.showModal();playSignature()}catch{}
}
window.addEventListener('pageshow',()=>setTimeout(tryOpen,900));
window.addEventListener('seyveo:first-help-finished',()=>setTimeout(tryOpen,600));
setTimeout(tryOpen,1400);
})();
