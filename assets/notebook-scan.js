/* SEYVEO · photo-to-text scanner (opt-in OCR; user must review and Save).
   Photo is processed in the browser; OCR JS/WASM and RU/EN models download from
   a third-party CDN only after the user presses "Распознать текст". */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const dialog=$('noteScanDialog');if(!dialog)return;
const preview=$('noteScanPreview'),status=$('noteScanStatus'),text=$('noteScanText'),
 button=$('noteScanRecognize');
let selected=null,localURL='',running=false,session=0,loading=null,consented=false,intoOpenNote=false;
const consentBox=$('noteScanConsent'),keepLines=$('noteScanKeepLines');
const toPaperButton=$('noteScanToPaper'),toTextButton=$('noteScanToText'),
 manualButton=$('noteScanManual');
function setStep(step){
 // Three actual work stages, not transparent overlays or duplicate controls.
 dialog.dataset.step=step;
 if(manualButton)manualButton.hidden=true;
}
function offerManual(){
 // Only offer manual entry when OCR couldn't find text or failed.
 if(manualButton)manualButton.hidden=false;
}
// Show only usable actions. OCR result remains editable, including manual text.
function syncActions(){
 if(toPaperButton)toPaperButton.disabled=!selected||running;
 if(toTextButton)toTextButton.disabled=!text.value.trim()||running;
}
/* Preserve OCR's real line breaks. Reject ONLY short, symbol-heavy phone
   status-bar garbage at the very start; never guess the meaning of a poem. */
function cleanPhoneHeader(value){
 const lines=String(value||'').replace(/\r\n?/g,'\n').split('\n');
 let removed=0;
 while(removed<2&&removed<lines.length){
  const first=lines[removed].trim();
  if(!first){removed++;continue}
  const status=first.match(/^(\d{1,2}[:.]\d{2})\s+(.{2,52})$/);
  if(!status)break;
  const tail=status[2];
  const hasUI= /[@#$%&=|\\\/<>~]|\b(?:wifi|lte|5g|4g|wl|io|o2)\b/i.test(tail);
  const letters=(tail.match(/[А-ЯЁа-яё]/g)||[]).length;
  const codeCount=(tail.match(/[A-Za-z0-9]/g)||[]).length;
  if(!hasUI||letters>0||codeCount>20)break;
  removed++;break;
 }
 return{value:lines.slice(removed).join('\n').replace(/^\n+|\n+$/g,''),removed:removed>0};
}
/* Tesseract v7 blocks → paragraphs → original OCR lines with vertical gaps.
   Fallback to data.text on unsupported/broken block geometry. */
function textInOriginalLines(data){
 const blocks=data&&Array.isArray(data.blocks)?data.blocks:[];
 const lines=[];
 for(const block of blocks){
  for(const paragraph of block.paragraphs||[]){
   for(const line of paragraph.lines||[]){
    const content=String(line?.text||'').replace(/\r\n?/g,'\n').trimEnd();
    if(!content.trim())continue;
    const box=line?.bbox||{};
    lines.push({text:content,top:Number(box.y0),bottom:Number(box.y1)});
   }
  }
 }
 if(lines.length<2)return String(data?.text||'').replace(/\r\n?/g,'\n');
 const heights=lines.map(line=>line.bottom-line.top).filter(n=>Number.isFinite(n)&&n>0);
 const typical=heights.length?heights.sort((a,b)=>a-b)[Math.floor(heights.length/2)]:0;
 let output='';
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(i>0){
   const previous=lines[i-1],gap=line.top-previous.bottom;
   // A visible stanza/paragraph gap should stay a blank line.
   output+='\n';
   if(typical>0&&Number.isFinite(gap)&&gap>typical*1.1)output+='\n';
  }
  output+=line.text;
 }
 return output;
}
window.SEYVEO_SCANNER_FORMAT=Object.freeze({cleanPhoneHeader,textInOriginalLines});
function message(s){status.textContent=s||''}
function clearURL(){if(localURL){URL.revokeObjectURL(localURL);localURL=''}}
function reset(){
 selected=null;consented=false;clearURL();preview.removeAttribute('src');preview.hidden=true;
 if(consentBox)consentBox.hidden=true;
 text.value='';text.wrap='soft';button.disabled=true;
 setStep('pick');syncActions();message('');
}
function open(){if(dialog.open)return;intoOpenNote=false;reset();dialog.showModal()}
function scanIntoNote(){
 if(dialog.open||!$('noteReviewDialog')?.open)return false;
 intoOpenNote=true;reset();dialog.showModal();
 // A direct tap on "Фото" opens the native phone camera. The captured image
 // is passed through the existing opt-in OCR and review flow.
 const camera=$('noteScanCamera');
 if(!camera)return false;
 camera.click();return true;
}
function select(file){
 if(!file)return;
 if(!file.type.startsWith('image/')||file.type==='image/svg+xml'||file.size>15*1024*1024){
  message('Выберите обычную фотографию до 15 МБ.');return;
 }
 session++;selected=file;clearURL();localURL=URL.createObjectURL(file);preview.src=localURL;
 if(consentBox)consentBox.hidden=true;
 text.value='';setStep('photo');
 preview.hidden=false;button.disabled=running;syncActions();
 message('Фото остаётся на устройстве. Проверьте результат распознавания.');
}
function loadEngine(){
 if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const timer=window.setTimeout(()=>reject(new Error('Долгая загрузка распознавания. Проверьте интернет.')),25000);
  // Load the runtime from our own origin, including in Safari PWA mode.
  script.src='assets/seyveo-ocr-tesseract.min.js';
  script.async=true;script.crossOrigin='anonymous';
  script.onload=()=>{window.clearTimeout(timer);window.Tesseract?.createWorker?resolve(window.Tesseract):reject(new Error('Движок распознавания недоступен.'))};
  script.onerror=()=>{window.clearTimeout(timer);script.remove();reject(new Error('Не удалось загрузить OCR: проверьте сеть и разрешённые источники скриптов.'))};
  document.head.append(script);
 }).catch(error=>{loading=null;throw error});
 return loading;
}
async function recognize(){
 if(running||!selected)return;
 const file=selected,token=++session,retainLines=keepLines?.checked!==false;
 running=true;button.disabled=true;syncActions();
 let worker=null;
 try{
  message('Подключаю распознавание… Это может занять время на iPhone.');
  const lib=await loadEngine();
  if(token!==session)return;
  worker=await lib.createWorker(['rus','eng'],1,{
   workerPath:new URL('assets/seyveo-ocr-worker.min.js',document.baseURI).href,
   corePath:new URL('assets/seyveo-ocr-core-lstm.wasm.js',document.baseURI).href,
   langPath:new URL('assets/',document.baseURI).href,
   gzip:false,
   logger:info=>{
   if(token!==session||!dialog.open)return;
   if(info.status==='recognizing text'&&Number.isFinite(info.progress))
    message('Распознавание: '+Math.round(info.progress*100)+'%');
  }});
  if(token!==session)return;
  if(typeof worker.setParameters==='function'){
   await worker.setParameters({
    tessedit_pageseg_mode:retainLines?'6':'3',
    preserve_interword_spaces:retainLines?'1':'0'
   });
  }
  if(token!==session)return;
  // Block geometry is requested only for line-preserving mode.
  const result=await worker.recognize(file,{},retainLines?{blocks:true}:undefined);
  if(token!==session||!dialog.open)return;
  const raw=retainLines?textInOriginalLines(result?.data):String(result?.data?.text||'');
  const clean=cleanPhoneHeader(raw);
  const found=clean.value;
  if(!found){
   message('Текст не найден. Можно выбрать другое фото или ввести текст вручную.');
   offerManual();
   return;
  }
  text.value=found.slice(0,8000);
  setStep('edit');syncActions();
  message(clean.removed?
   'Возможно, удалена строка панели телефона. Проверьте результат перед сохранением.':
   'Проверьте текст и исправьте возможные ошибки перед сохранением.');
 }catch(error){
  if(token===session&&dialog.open){
   message((error?.message||'Не удалось распознать текст.')+' Можно ввести текст вручную.');
   offerManual();
  }
 }finally{
  if(worker)try{await worker.terminate()}catch{}
  running=false;if(token===session){button.disabled=!selected;syncActions();}
 }
}
function cancel(){dialog.close()}
function toNote(){
 const value=keepLines?.checked!==false?text.value.replace(/^\n+|\n+$/g,''):text.value.trim();
 if(!value.trim()){message('Сначала распознайте текст или введите его вручную.');return}
 const appendToEditor=intoOpenNote&&$('noteReviewDialog')?.open;
 intoOpenNote=false;
 dialog.close();
 if(appendToEditor){
  const field=$('noteReviewText'),rich=window.SEYVEO_NOTE_RICH;
  if(rich?.isActive?.())rich.appendText((field.value?'\n\n':'')+value.slice(0,8000));
  else{
   const separator=field.value?'\n\n':'';
   field.value=(field.value+separator+value).slice(0,8000);
   field.dispatchEvent(new Event('input',{bubbles:true}));
  }
  return;
 }
 window.SEYVEO_NOTES_API?.reviewText(value.slice(0,8000),{preserveLines:keepLines?.checked!==false});
}
function toPaper(){
 if(!selected){message('Сначала выберите изображение.');return}
 const file=selected;
 dialog.close();
 window.SEYVEO_PAPER?.open();
 window.SEYVEO_PAPER?.importPhoto(file);
}
for(const id of ['noteScanCamera','noteScanGallery']){
 $(id)?.addEventListener('change',event=>{
  const file=event.target.files?.[0];event.target.value='';
  select(file);
 });
}
// Soft wrapping only changes how long lines LOOK on a narrow iPhone screen.
// Actual newlines and the user's "preserve lines" OCR choice stay untouched.
keepLines?.addEventListener('change',()=>{text.wrap='soft'});
text.addEventListener('input',syncActions);
manualButton?.addEventListener('click',()=>{
 if(!selected||running)return;
 setStep('edit');syncActions();
 message('Введите текст вручную и сохраните его в Блокнот.');
});
button.addEventListener('click',()=>{
 if(running||!selected)return;
 if(!consented){
  consentBox.hidden=false;
  $('noteScanConsentYes').focus({preventScroll:true});
  return;
 }
 recognize();
});
$('noteScanConsentNo').addEventListener('click',()=>{
 consentBox.hidden=true;
 button.focus({preventScroll:true});
});
$('noteScanConsentYes').addEventListener('click',()=>{
 if(!selected||running)return;
 consented=true;consentBox.hidden=true;
 recognize();
});
$('noteScanCancel').addEventListener('click',cancel);
$('noteScanToText').addEventListener('click',toNote);
$('noteScanToPaper').addEventListener('click',toPaper);
$('noteScanBack').addEventListener('click',cancel);
dialog.addEventListener('close',()=>{
 session++;reset();intoOpenNote=false;
 if(!$('noteReviewDialog').open&&!$('notePaperDialog').open)
  window.SEYVEO_NOTES_API?.openNotes();
});
window.SEYVEO_NOTE_SCANNER=Object.freeze({open,scanIntoNote});
})();
