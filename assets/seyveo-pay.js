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
let launchButton=null,stream=null,frame=0,detector=null,scanActive=false,cameraToken=0,viewToken=0;
const tabs=document.createElement('nav');
tabs.className='syp-view-switch';
tabs.setAttribute('role','group');
tabs.setAttribute('aria-label','Раздел кошелька');
tabs.innerHTML='<button type="button" data-syp-tab="card" aria-pressed="true" aria-controls="sypCardHome">Карта</button><button type="button" data-syp-tab="finances" aria-pressed="false" aria-controls="sypBudgetScreen">Финансы</button>';
home.id='sypCardHome';
home.before(tabs);
const financeCss=document.createElement('link');
financeCss.rel='stylesheet';
financeCss.href='assets/seyveo-personal-wallet.css?v=4';
document.head.append(financeCss);
const ready=new Promise(resolve=>{
 const script=document.createElement('script');script.src='assets/seyveo-personal-wallet.js?v=5';
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
function screen(name){
 if(name!=='scan')stopCamera();
 for(const node of dialog.querySelectorAll('.syp-screen'))node.hidden=node.dataset.sypScreen!==name;
}
function setTab(tab){
 dialog.dataset.walletTab=tab;
 for(const button of tabs.querySelectorAll('[data-syp-tab]')){
  button.setAttribute('aria-pressed',String(button.dataset.sypTab===tab));
 }
 title.textContent='Кошелёк';
 if(tab==='finances'){
  kicker.textContent='SEYVEO · МОИ ФИНАНСЫ';
  intro.textContent='Личные доходы и расходы';
 }else{
  kicker.textContent='SEYVEO / PRIVATE WALLET';
  intro.textContent='Карты и оплата';
 }
}
async function select(tab){
 const token=++viewToken;
 if(tab!=='finances'){
  setTab('card');
  screen('home');
  dialog.scrollTop=0;
  return;
 }
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
 // Showing a modal is synchronous to preserve the user's tap/keyboard activation.
 if(!dialog.open){
  launchButton=document.activeElement;
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
 }
 return select(tab==='finances'?'finances':'card');
}
function close(){
 ++viewToken;
 stopCamera();
 if(typeof dialog.close==='function')dialog.close();
 else dialog.removeAttribute('open');
 launchButton?.focus?.({preventScroll:true});
}
dialog.addEventListener('click',event=>{
 const tab=event.target.closest('[data-syp-tab]');
 if(tab&&tabs.contains(tab)){
  void select(tab.dataset.sypTab);
  return;
 }
 const button=event.target.closest('[data-syp]');
 if(!button)return;
 const action=button.dataset.syp;
 if(action==='close'){close();return;}
 if(action==='home'){screen('home');dialog.scrollTop=0;return;}
 if(action==='cards'||action==='history'){
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
dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
dialog.addEventListener('close',()=>{
 ++viewToken;
 stopCamera();
 launchButton?.focus?.({preventScroll:true});
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
window.SEYVEO_PAY=Object.freeze({open,close,select});
})();
