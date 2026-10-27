/* SEYVEO PAY — demo only. No payment credentials, processing or storage. */
(()=>{'use strict';
const dialog=document.getElementById('seyveoPayDialog');
if(!dialog)return;
let stream=null,raf=0,detector=null,scanActive=false,launchButton=null;
const q=s=>dialog.querySelector(s);
const screen=name=>{dialog.querySelectorAll('.syp-screen').forEach(el=>el.hidden=el.dataset.sypScreen!==name);if(name!=='scan')stopCamera();};
const status=value=>{const el=q('#sypScanStatus');if(el)el.textContent=value;};
function stopCamera(){scanActive=false;if(raf)cancelAnimationFrame(raf);raf=0;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}const video=q('#sypCamera');if(video){video.pause();video.srcObject=null;}}
function open(){launchButton=document.activeElement;screen('home');if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
function close(){stopCamera();if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');launchButton?.focus?.();}
document.addEventListener('click',ev=>{if(ev.target.closest('[data-calendar-space="wallet"],[data-world-space="wallet"]')){ev.preventDefault();ev.stopImmediatePropagation();open();}},true);
dialog.addEventListener('click',ev=>{const button=ev.target.closest('[data-syp]');if(!button)return;const action=button.dataset.syp;if(action==='close')close();else if(action==='home')screen('home');else if(action==='cards')screen('cards');else if(action==='history')screen('history');else if(action==='scan'){screen('scan');status('Наведите камеру на QR-код. Денежные операции в демо недоступны.');}else if(action==='camera')startCamera();});
dialog.addEventListener('close',()=>{stopCamera();launchButton?.focus?.();});
dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
async function startCamera(){
if(stream)return;
if(!navigator.mediaDevices?.getUserMedia){status('Камера недоступна. Для доступа нужен HTTPS и разрешение устройства.');return;}
if(!('BarcodeDetector'in window)){status('Этот браузер пока не поддерживает распознавание QR. Камера и платежи не запускаются.');return;}
try{
const formats=await BarcodeDetector.getSupportedFormats();if(!formats.includes('qr_code')){status('Распознавание QR не поддерживается этим устройством.');return;}
detector=new BarcodeDetector({formats:['qr_code']});
stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
const video=q('#sypCamera');video.srcObject=stream;video.hidden=false;await video.play();scanActive=true;
status('Сканирование… Никаких платежей без вашего подтверждения.');
const scan=async()=>{if(!scanActive)return;try{const found=await detector.detect(video);if(found.length){const raw=String(found[0].rawValue||'').slice(0,300);stopCamera();video.hidden=true;status('QR распознан (демо): '+raw+'\nПлатёж не совершён. Не вводите здесь платёжные данные.');return;}}catch{}if(scanActive)raf=requestAnimationFrame(scan);};raf=requestAnimationFrame(scan);
}catch(err){stopCamera();q('#sypCamera').hidden=true;status(err?.name==='NotAllowedError'?'Доступ к камере не разрешён.':'Не удалось открыть камеру на этом устройстве.');}
}
})();
