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
let tourIndex=-1,tourVisited=false;
const tour=window.SEYVEO_WELCOME_TOUR;
const panels=[...dialog.querySelectorAll('[data-welcome-step]')];
const intro=$('welcomeIntroTitle'),user=$('welcomePersonName'),other=$('welcomeCustomName');
const brandChoices=[...dialog.querySelectorAll('[data-welcome-assistant]')];
const focusChoices=[...dialog.querySelectorAll('[data-welcome-focus]')];
const progress=$('welcomeProgress'),next=$('welcomeNext'),back=$('welcomeBack'),skip=$('welcomeSkip');
const error=$('welcomeError');
const demoEntry=$('openWelcomeDemo'),overline=$('welcomeOverline'),disclaimer=$('welcomeDisclaimer');
const openingSecond=$('welcomeOpeningQuoteSecond');
const OPENING_DURATION_MS=5200;
const SIGNATURE_SOUND_KEY='seyveo-signature-sound-v1';
const soundToggle=$('seyveoSignatureSoundToggle'),soundState=$('seyveoSignatureSoundState');
/* SEYVEO Signature Sound · First Awakening Cinema Edition.
   An ORIGINAL mastered stereo WAV, recorded as a standalone app asset.
   One browser media element: no live oscillator beeps, loops or network APIs.
   Safari plays only on the owner's explicit final button gesture. */
const SIGNATURE_SOUND_ASSET='assets/seyveo-first-awakening-cinema.wav?v=1';
let signatureAudio=null;
function soundEnabled(){return read(SIGNATURE_SOUND_KEY)!=='off'}
function soundAllowed(){
 return soundEnabled()
  &&read('seyveo-discreet-mode-v1')!=='on'
  &&window.SEYVEO_DISCREET_MODE!==true
  &&!document.hidden;
}
function paintSoundSetting(){
 if(!soundToggle||!soundState)return;
 const enabled=soundEnabled();
 soundToggle.setAttribute('aria-pressed',String(enabled));
 soundToggle.setAttribute('aria-label','Фирменный звук: '+(enabled?'включён':'выключен'));
 soundState.textContent=enabled?'Вкл.':'Выкл.';
}
function prepareSignatureSound(){
 if(!soundAllowed()||!window.Audio)return;
 if(signatureAudio)return;
 try{
  const audio=new window.Audio(SIGNATURE_SOUND_ASSET);
  audio.preload='auto';
  audio.loop=false;
  audio.volume=.80;
  signatureAudio=audio;
  if(typeof audio.load==='function')audio.load();
 }catch{signatureAudio=null}
}
function stopSignatureSound(){
 if(!signatureAudio)return;
 try{signatureAudio.pause();signatureAudio.currentTime=0}catch{}
}
function playSignatureSound(){
 if(!soundAllowed())return;
 prepareSignatureSound();
 if(!signatureAudio)return;
 try{
  // Both calls occur directly inside the user click, never inside a timer.
  signatureAudio.pause();
  signatureAudio.currentTime=0;
  const started=signatureAudio.play();
  if(started&&typeof started.catch==='function')started.catch(()=>{});
 }catch{}
}
soundToggle?.addEventListener('click',()=>{
 const enabled=!soundEnabled();
 if(!store(SIGNATURE_SOUND_KEY,enabled?'on':'off')){paintSoundSetting();return}
 if(!enabled)stopSignatureSound();
 paintSoundSetting();
});
window.addEventListener('storage',event=>{
 if(event.key!==SIGNATURE_SOUND_KEY&&event.key!=='seyveo-discreet-mode-v1')return;
 if(event.key===SIGNATURE_SOUND_KEY)paintSoundSetting();
 if(!soundAllowed())stopSignatureSound();
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)stopSignatureSound();
});
paintSoundSetting();
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
 panels.forEach((panel,index)=>{panel.hidden=tourIndex>=0||index!==step});
 tour?.render(tourIndex);
 progress.hidden=tourIndex>=0||step===0||step===4;
 progress.replaceChildren();
 if(!progress.hidden){
  for(let i=1;i<=3;i++){const dot=document.createElement('span');dot.className=i<=step?'is-current':'';progress.append(dot)}
 }
 back.hidden=step===0&&tourIndex<0;
 next.textContent=tourIndex>=0?(tourIndex===(tour?.count||4)-1?'Давай знакомиться':'Дальше'):
  step===0?'Посмотреть возможности':step===4?(preview?'Показать открытие':'Открыть SEYVEO'):'Продолжить';
 skip.textContent=preview?'Выйти из демо':tourIndex>=0?'Пропустить показ':step===0?'Сразу к знакомству':step===4?'Вернуться позже':'Пропустить знакомство';
 if(overline)overline.textContent=tourIndex>=0?'ПРИМЕР · НЕ ВАШИ ДАННЫЕ':preview?'ДЕМО · ПЕРВЫЙ ЗАПУСК':'AI AUTOMATION';
 if(disclaimer)disclaimer.textContent=tourIndex>=0?'Учебный пример · ничего не сохраняется':preview?'Это только просмотр · настройки не сохраняются':'Без доступа к контактам, микрофону и другим данным';
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
 tourIndex=-1;
 const nextStep=Math.max(0,Math.min(4,i));
 step=nextStep;render();
 if(step!==0)dialog.classList.remove('is-cinematic');
 else if(dialog.open)playSignature();
}
function setTour(index){
 if(!tour)return setStep(1);
 tourIndex=Math.max(0,Math.min(tour.count-1,index));tourVisited=true;step=0;
 render();dialog.classList.remove('is-cinematic');
}
function playSignature(){
 // Replaying the intro uses its own isolated animation. Never touch Home plasma.
 dialog.classList.remove('is-cinematic');
 void $('welcomeIntroTitle').offsetWidth;
 dialog.classList.add('is-cinematic');
}
function close(){
 stopSignatureSound();
 if(openingTimer!==null){clearTimeout(openingTimer);openingTimer=null}
 dialog.classList.remove('is-cinematic','is-opening');
 if(dialog.open)dialog.close();
 const fromDemo=preview,trigger=previewTrigger;
 preview=false;previewTrigger=null;tourIndex=-1;tourVisited=false;
 tour?.reset();tour?.render(-1);
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
 // Exactly the original business phrase; life-only mode speaks to personal goals.
 openingSecond.textContent=focus==='life'
  ?'Большие возможности для вашей жизни.'
  :'Гигантский скачок для вашего бизнеса.';
 dialog.classList.add('is-opening');
 const isPreview=preview;
 next.disabled=true;back.disabled=true;skip.disabled=true;
 // WebAudio must be unlocked inside this explicit button gesture on iOS.
 // Never play on automatic launch, skip, or a non-interactive background task.
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(!reduced)playSignatureSound();
 const finish=()=>{
  if(openingTimer!==null){clearTimeout(openingTimer);openingTimer=null}
  close();
  next.disabled=false;back.disabled=false;skip.disabled=false;
  // Only the real first launch gives the EXISTING Home plasma one gentle response.
  // Management preview never changes profile, navigates away or touches the sphere.
  if(!isPreview){
   if(!document.hidden&&!$('homePage')?.hidden){
    document.dispatchEvent(new CustomEvent('seyveo:assistant-presence',{detail:{phase:'ack'}}));
   }
   // Only after a successfully completed REAL first acquaintance.
   // Demos, skipped onboarding, and existing installations are not interrupted.
   window.dispatchEvent(new CustomEvent('seyveo:first-minute-ready',{detail:{source:'first-launch'}}));
  }
 };
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
  finish();return;
 }
 openingTimer=setTimeout(finish,OPENING_DURATION_MS);
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
 if(tourIndex>=0){
  if(tourIndex<(tour?.count||4)-1)setTour(tourIndex+1);
  else setStep(1);
  return;
 }
 if(step===0){setTour(0);return}
 if(step<4)setStep(step+1);else save();
});
function startPreview(){
 if(dialog.open||document.querySelector('dialog[open]')||window.SEYVEO_FIRST_HELP?.isActive())return;
 preview=true;previewTrigger=demoEntry;
 tourIndex=-1;tourVisited=false;tour?.reset();
 assistant='Феликс';focus='life';user.value='';other.value='';
 setStep(0);
 try{dialog.showModal();playSignature();prepareSignatureSound()}catch{preview=false;previewTrigger=null}
}
demoEntry?.addEventListener('click',startPreview);
back.addEventListener('click',()=>{
 if(openingTimer!==null)return;
 if(tourIndex>=0){if(tourIndex===0)setStep(0);else setTour(tourIndex-1);return}
 if(step===1&&tourVisited){setTour((tour?.count||4)-1);return}
 if(step>0)setStep(step-1);
});
skip.addEventListener('click',()=>{
 if(!preview&&(tourIndex>=0||step===0)){setStep(1);return}
 dismiss();
});
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
 tourIndex=-1;tourVisited=false;tour?.reset();
 setStep(0);
 try{dialog.showModal();playSignature();prepareSignatureSound()}catch{}
}
window.addEventListener('pageshow',()=>setTimeout(tryOpen,900));
window.addEventListener('seyveo:first-help-finished',()=>setTimeout(tryOpen,600));
setTimeout(tryOpen,1400);
})();
