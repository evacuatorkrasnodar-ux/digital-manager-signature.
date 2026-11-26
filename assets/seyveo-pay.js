/* SEYVEO PAY · Two independent wallet views.
   Card preserves the original demo QR/cards/history; Finances owns local
   income and expenses. No payments, card credentials or bank connections. */
(()=>{'use strict';
const dialog=document.getElementById('seyveoPayDialog');
if(!dialog)return;
const shell=dialog.querySelector('.syp-shell');
const home=dialog.querySelector('[data-syp-screen="home"]');
if(!shell||!home)return;
const q=selector=>dialog.querySelector(selector);
const intro=q('.syp-top .syp-desc'),kicker=q('.syp-top .syp-kicker'),title=q('.syp-top .syp-title');
let launchButton=null,stream=null,frame=0,detector=null,scanActive=false,cameraToken=0,viewToken=0,skipCloseFocus=false;
const tabs=document.createElement('nav');
tabs.className='syp-view-switch';
tabs.setAttribute('role','group');
tabs.setAttribute('aria-label','Раздел кошелька');
// Small notebook-style icon choices, not another thick segmented capsule.
// Matched optical bounds and rounded 1.55px strokes: card/chip and financial trend.
const cardIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.5" y="5.25" width="19" height="13.5" rx="3"/><rect x="6" y="8.5" width="4.75" height="4" rx="1"/><path d="M8.375 8.5v4M14.25 10h3.75M6 15.75h2.75m3 0h2.75"/></svg>';
const financesIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 20.25h18M4.75 20.25v-5.5a1 1 0 0 1 1-1H7a1 1 0 0 1 1 1v5.5m2.5 0v-7.5a1 1 0 0 1 1-1h1.25a1 1 0 0 1 1 1v7.5m2.5 0V9.75a1 1 0 0 1 1-1h1.25a1 1 0 0 1 1 1v10.5"/><path d="m3.5 10 5-4.5 4.75 2 6.5-4.25m-3.75 0h3.75V7"/></svg>';
tabs.innerHTML='<button type="button" data-syp-tab="card" aria-pressed="true" aria-controls="sypCardHome"><span class="syp-view-icon">'+cardIcon+'</span><span>Карты</span></button>'+
 '<button type="button" data-syp-tab="finances" aria-pressed="false" aria-controls="sypBudgetScreen"><span class="syp-view-icon">'+financesIcon+'</span><span>Финансы</span></button>'+
 '<button type="button" data-syp-tab="currency" aria-pressed="false" aria-controls="sypCurrencyScreen"><span class="syp-view-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/></svg></span><span>Валюты</span></button>'+
 '<button type="button" data-syp-tab="goals" aria-pressed="false" aria-controls="sypGoalsScreen"><span class="syp-view-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13c0-4 4-7 9-7h2l3-2v4c2 1 3 3 3 5h2v4h-3l-1.5 3h-3l-.5-2.5h-5L8 20H5l-1.5-4C1 16 1 13 2 12"/><path d="M9 8.5h4"/><circle cx="16" cy="11.5" r=".6"/></svg></span><span>Копилка</span></button>';
home.id='sypCardHome';
// Reuse Notebook's free header area above the permanent Work capsule.
// Move the real controls, not a nonfunctional copy. The delegated click
// listener below therefore belongs to tabs instead of the dialog.
const workShell=document.getElementById('svWorkShell');
if(workShell?.contains(dialog))workShell.append(tabs);
else home.before(tabs);
const financeCss=document.createElement('link');
financeCss.rel='stylesheet';
financeCss.href='assets/seyveo-personal-wallet.css?v=20261126-travel-v213';
document.head.append(financeCss);
const ready=new Promise(resolve=>{
 const script=document.createElement('script');script.src='assets/seyveo-personal-wallet.js?v=20261126-travel-v213';
 script.onload=()=>resolve(!!q('[data-syp-screen="budget"]'));
 script.onerror=()=>resolve(false);
 document.body.append(script);
});
function stopCamera(){
 ++cameraToken;
 scanActive=false;
 if(frame)cancelAnimationFrame(frame);
 frame=0;
 if(stream){stream.getTracks().forEach(track=>track.stop());stream=null;}
 const video=q('#sypCamera');
 if(video){video.pause();video.srcObject=null;video.hidden=true;}
}
function status(value){const el=q('#sypScanStatus');if(el)el.textContent=value;}
function setWalletMenu(open,restoreFocus=false){
 const menu=q('#sypWalletMenu'),trigger=q('[data-syp="more"]');
 if(!menu||!trigger)return;
 menu.hidden=!open;
 trigger.setAttribute('aria-expanded',String(open));
 if(open)menu.querySelector('button')?.focus?.({preventScroll:true});
 else if(restoreFocus)trigger.focus?.({preventScroll:true});
}
function screen(name){
 const goalEditor=q('#sypGoalEditor');if(name!=='goals'&&goalEditor?.open)goalEditor.close();
 setWalletMenu(false);
 if(name!=='scan')stopCamera();
 const editor=q('#sypLoyaltyEditor');
 if(name!=='loyalty-edit'&&editor?.open)editor.close();
 for(const node of dialog.querySelectorAll('.syp-screen')){
  if(name==='loyalty-edit'&&node.dataset.sypScreen!=='loyalty-edit')continue;
  node.hidden=node.dataset.sypScreen!==name;
 }
 if(name==='loyalty-edit'&&editor&&!editor.open){
  try{editor.showModal();}catch{editor.setAttribute('open','');}
  editor.querySelector('.syp-le-scroll').scrollTop=0;
 }
 dialog.dispatchEvent(new CustomEvent('seyveo:wallet-screen',{detail:{name}}));
}
function setTab(tab){
 dialog.dataset.walletTab=tab;
 for(const button of tabs.querySelectorAll('[data-syp-tab]')){
  button.setAttribute('aria-pressed',String(button.dataset.sypTab===tab));
 }
 title.textContent='Кошелёк';
 if(tab==='goals'){
  kicker.textContent='SEYVEO · КОПИЛКА';intro.textContent='Цели накоплений';
 }else if(tab==='currency'){
  kicker.textContent='SEYVEO · ВАЛЮТЫ';
  intro.textContent='Конвертер валют';
 }else if(tab==='finances'){
  kicker.textContent='SEYVEO · МОИ ФИНАНСЫ';
  intro.textContent='Личные доходы и расходы';
 }else{
  kicker.textContent='SEYVEO / PRIVATE WALLET';
  intro.textContent='Карты и оплата';
 }
}
async function select(tab){
 const token=++viewToken;
 if(tab==='goals'){
  setTab('goals');screen('goals');dialog.scrollTop=0;window.SEYVEO_GOALS?.render();return;
 }
 if(tab==='currency'){
  setTab('currency');screen('currency');dialog.scrollTop=0;
  window.SEYVEO_FX?.open();return;
 }
 if(tab!=='finances'){
  setTab('card');
  screen('home');
  dialog.scrollTop=0;
  return;
 }
 // Never leave the QR camera running when switching to Finances.
 stopCamera();
 const loaded=await ready;
 if(token!==viewToken||!dialog.open)return;
 if(!loaded){
  setTab('card');
  screen('home');
  window.alert('Финансы не загрузились. Обнови страницу и попробуй снова.');
  return;
 }
 setTab('finances');
 screen('budget');
 window.SEYVEO_WALLET?.render?.();
 dialog.scrollTop=0;
}
function open(tab='card'){
 // Recover from either script load order: the live wallet actions always
 // belong to the shared header, never to the dialog body.
 const mountedWork=document.getElementById('svWorkShell');
 if(mountedWork?.contains(dialog)&&tabs.parentElement!==mountedWork)
  mountedWork.append(tabs);
 if(!dialog.open){
  launchButton=document.activeElement;
  // The Wallet is a normal in-flow Work page, not a top-layer modal.
  // Open the work route first when invoked from elsewhere in the app.
  const work=document.getElementById('svWorkShell');
  if(work?.contains(dialog)){
   const tasks=document.getElementById('tasksPage');
   const calendar=document.getElementById('calendarPage');
   if(tasks?.hidden&&calendar?.hidden){
    if(typeof window.SEYVEO_UNIFIED_TASKS?.openPersonal==='function')
     window.SEYVEO_UNIFIED_TASKS.openPersonal();
    else if(location.hash!=='#tasks')location.hash='#tasks';
   }
   if(typeof dialog.show==='function')dialog.show();
   else dialog.setAttribute('open','');
  }else if(typeof dialog.showModal==='function'){
   dialog.showModal();
  }else dialog.setAttribute('open','');
 }
 window.SEYVEO_WORK_SHELL?.sync?.();
 return select(['finances','currency','goals'].includes(tab)?tab:'card');
}
function close(switchingSection=false){
 const goalEditor=q('#sypGoalEditor');if(goalEditor?.open)goalEditor.close();
 const editor=q('#sypLoyaltyEditor');if(editor?.open)editor.close();
 setWalletMenu(false);
 ++viewToken;
 stopCamera();
 skipCloseFocus=!!switchingSection;
 if(typeof dialog.close==='function'&&dialog.open)dialog.close();
 else dialog.removeAttribute('open');
 if(!switchingSection)launchButton?.focus?.({preventScroll:true});
 window.SEYVEO_WORK_SHELL?.sync?.();
}
tabs.addEventListener('click',event=>{
 const tab=event.target.closest('[data-syp-tab]');
 if(tab&&tabs.contains(tab))void select(tab.dataset.sypTab);
});
dialog.addEventListener('click',event=>{
 const button=event.target.closest('[data-syp]');
 if(!button)return;
 const action=button.dataset.syp;
 if(action==='more'){setWalletMenu(button.getAttribute('aria-expanded')!=='true');return;}
 if(action==='close'){close();return;}
 if(action==='home'){screen('home');dialog.scrollTop=0;return;}
 if(action==='cards'||action==='history'||action==='add'){
  screen(action);dialog.scrollTop=0;return;
 }
 if(action==='scan'){
  screen('scan');
  status('Наведите камеру на QR-код. Денежные операции в демо недоступны.');
  dialog.scrollTop=0;
  return;
 }
 if(action==='camera')void startCamera();
});
document.addEventListener('click',event=>{
 if(event.target.closest('[data-calendar-space="wallet"],[data-world-space="wallet"]')){
  event.preventDefault();event.stopImmediatePropagation();void open();
 }
},true);
// Disclosure menu closes on outside tap or Escape, without dismissing Wallet.
document.addEventListener('click',event=>{
 const menu=q('#sypWalletMenu');
 if(!menu||menu.hidden)return;
 if(!menu.contains(event.target)&&!event.target.closest?.('[data-syp="more"]'))setWalletMenu(false);
},true);
document.addEventListener('keydown',event=>{
 const menu=q('#sypWalletMenu');
 if(event.key==='Escape'&&menu&&!menu.hidden){
  event.preventDefault();event.stopPropagation();setWalletMenu(false,true);
 }
},true);
// No backdrop dismissal: this is an inline page with the shared navigation.
dialog.addEventListener('close',e=>{
 if(e.target!==dialog)return;
 const goalEditor=q('#sypGoalEditor');if(goalEditor?.open)goalEditor.close();
 const editor=q('#sypLoyaltyEditor');if(editor?.open)editor.close();
 setWalletMenu(false);
 ++viewToken;
 stopCamera();
 if(!skipCloseFocus)launchButton?.focus?.({preventScroll:true});
 skipCloseFocus=false;
 window.SEYVEO_WORK_SHELL?.sync?.();
});
window.addEventListener('hashchange',()=>{
 if(dialog.open&&location.hash&&location.hash!=='#tasks')close(true);
});
async function startCamera(){
 if(stream||!dialog.open||q('[data-syp-screen="scan"]')?.hidden)return;
 if(!navigator.mediaDevices?.getUserMedia){
  status('Камера недоступна. Для доступа нужен HTTPS и разрешение устройства.');return;
 }
 if(!('BarcodeDetector' in window)){
  status('Этот браузер не поддерживает распознавание QR. Платежи в демо недоступны.');return;
 }
 const token=++cameraToken;
 let incoming=null;
 try{
  if(typeof BarcodeDetector.getSupportedFormats==='function'){
   const formats=await BarcodeDetector.getSupportedFormats();
   if(!formats.includes('qr_code')){
    status('Распознавание QR не поддерживается этим устройством.');return;
   }
  }
  detector=new BarcodeDetector({formats:['qr_code']});
  incoming=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
  if(token!==cameraToken||!dialog.open||q('[data-syp-screen="scan"]')?.hidden){
   incoming.getTracks().forEach(track=>track.stop());
   return;
  }
  stream=incoming;
  const video=q('#sypCamera');
  video.srcObject=stream;video.hidden=false;
  await video.play();
  if(token!==cameraToken){stopCamera();return;}
  scanActive=true;
  status('Сканирование QR… Оплата в этой демонстрации не выполняется.');
  const scan=async()=>{
   if(!scanActive||token!==cameraToken)return;
   try{
    const found=await detector.detect(video);
    if(!scanActive||token!==cameraToken)return;
    if(found.length){
     const raw=String(found[0].rawValue||'').slice(0,300);
     stopCamera();
     status('QR распознан (демо): '+raw+'\nПлатёж не совершён. Не вводите здесь платёжные данные.');
     return;
    }
   }catch{}
   if(scanActive&&token===cameraToken)frame=requestAnimationFrame(scan);
  };
  frame=requestAnimationFrame(scan);
 }catch(error){
  if(incoming&&incoming!==stream)incoming.getTracks().forEach(track=>track.stop());
  if(token!==cameraToken)return;
  stopCamera();
  status(error?.name==='NotAllowedError'
   ?'Доступ к камере не разрешён.'
   :'Не удалось открыть камеру на этом устройстве.');
 }
}
window.SEYVEO_PAY=Object.freeze({open,close,select,showLoyalty(name){if(dialog.open&&['loyalty-edit','loyalty-detail','home','add'].includes(name)){screen(name);dialog.scrollTop=0;}}});
})();
