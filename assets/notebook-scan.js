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
let savedScan=null,menuPage='root',exportBusy=false,outputIntent='',preparedFile=null,preparedURL='';
const consentBox=$('noteScanConsent'),keepLines=$('noteScanKeepLines');
const toPaperButton=$('noteScanToPaper'),toTextButton=$('noteScanToText'),
 manualButton=$('noteScanManual');
// Saved scan actions reuse the original OCR and annotation handlers.
const more=document.createElement('button');
more.id='svScanMore';more.type='button';more.hidden=true;
more.className='sv-header-material-circle';
more.setAttribute('aria-label','Действия с документом');
more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','svScanMenu');
more.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
const menu=document.createElement('div');
menu.id='svScanMenu';menu.className='sv-menu-surface';menu.hidden=true;
menu.setAttribute('role','group');menu.setAttribute('aria-label','Действия с документом');
function menuButton(label,path){
 const item=document.createElement('button');item.type='button';
 item.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg><span>'+label+'</span>';
 menu.append(item);return item;
}
const menuOCR=menuButton('Распознать текст','<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9h8M8 12h8M8 15h5"/>');
const menuLines=menuButton('Сохранять переносы','<path d="M4 6h16M4 11h12a4 4 0 0 1 0 8h-3m3-3-3 3 3 3M4 16h5"/>');
menuLines.setAttribute('role','checkbox');
menuLines.insertAdjacentHTML('beforeend','<svg class="sv-scan-menu-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>');
const penIcon='<path d="m5 15 12-12 4 4L9 19l-5 1 1-5Zm10-10 4 4"/>';
const docIcon='<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>';
const imageIcon='<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m4 17 5-5 4 4 3-3 5 5"/>';
const arrowIcon='<path d="m14 6-6 6 6 6"/>';
const exportIcon='<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>';
const shareIcon='<path d="M12 15V3m-4 4 4-4 4 4M7 9H4v12h16V9h-3"/>';
const chevron='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
const menuEdit=menuButton('Редактировать в…',penIcon);
const menuExport=menuButton('Сохранить как…',exportIcon);
const menuShare=menuButton('Поделиться…',shareIcon);
for(const node of [menuEdit,menuExport,menuShare])node.insertAdjacentHTML('beforeend',chevron);
const menuBack=menuButton('Назад',arrowIcon);
const editNote=menuButton('Блокнот',docIcon);
const editPaper=menuButton('Рисование · пометки',penIcon);
const editWord=menuButton('Word · текст',docIcon);
const editPdf=menuButton('PDF · пометки',penIcon);
const outWord=menuButton('Word (.docx)',docIcon);
const outPdf=menuButton('PDF · оригинал',docIcon);
const outAnnotated=menuButton('PDF · с пометками',docIcon);
const outJpeg=menuButton('JPEG · оригинал',imageIcon);
const outTxt=menuButton('TXT · текст',docIcon);
const groups={root:[menuOCR,menuLines,menuEdit,menuExport,menuShare],edit:[menuBack,editNote,editPaper,editWord,editPdf],export:[menuBack,outWord,outPdf,outAnnotated,outJpeg,outTxt],share:[menuBack,outWord,outPdf,outAnnotated,outJpeg,outTxt]};
const prepared=document.createElement('div');prepared.id='svScanPrepared';prepared.className='sv-menu-surface';prepared.hidden=true;
const preparedName=document.createElement('strong');const preparedAction=document.createElement('button');preparedAction.type='button';
const preparedCancel=document.createElement('button');preparedCancel.type='button';preparedCancel.textContent='Закрыть';
prepared.append(preparedName,preparedAction,preparedCancel);dialog.append(prepared);
const textExport=document.createElement('button');textExport.id='svScanTextExport';textExport.type='button';textExport.hidden=true;
$('noteScanText').insertAdjacentElement('afterend',textExport);
function clearPrepared(){
 prepared.hidden=true;preparedFile=null;
 if(preparedURL){URL.revokeObjectURL(preparedURL);preparedURL='';}
}
function page(name){
 menuPage=name;
 for(const node of new Set(Object.values(groups).flat()))node.hidden=!groups[name].includes(node);
 syncMenu();
}
function fileBase(){return ($('noteScanTitle').textContent||'Скан').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').trim().slice(0,100)||'Скан';}
async function sourceCanvas(withMarks=false){
 if(withMarks&&savedScan?.paper&&(savedScan.paper.strokes?.length||savedScan.paper.texts?.length)){
  const api=window.SEYVEO_PAPER;if(!api?.scanAnnotationImage)throw Error('Экспорт пометок недоступен.');
  return api.scanAnnotationImage(savedScan);
 }
 const url=URL.createObjectURL(selected);
 try{
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Не удалось открыть изображение.'));image.src=url;});
  const factor=Math.min(1,2400/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*factor));canvas.height=Math.max(1,Math.round(image.naturalHeight*factor));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
  return canvas;
 }finally{URL.revokeObjectURL(url);}
}
function canvasJpeg(canvas){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Не удалось подготовить фото.')),'image/jpeg',.92));
}
function showPrepared(blob,extension,share){
 clearPrepared();preparedFile=new File([blob],fileBase()+'.'+extension,{type:blob.type});
 preparedName.textContent=preparedFile.name;
 preparedAction.textContent=share?'Поделиться файлом':'Скачать файл';preparedAction.dataset.share=String(share);
 prepared.hidden=false;preparedAction.focus({preventScroll:true});
 message('');
}
function downloadPrepared(){
 if(!preparedFile)return;
 if(preparedURL)URL.revokeObjectURL(preparedURL);
 preparedURL=URL.createObjectURL(preparedFile);
 const a=document.createElement('a');a.href=preparedURL;a.download=preparedFile.name;document.body.append(a);a.click();a.remove();
}
preparedAction.addEventListener('click',()=>{
 if(!preparedFile)return;
 if(preparedAction.dataset.share==='true'&&navigator.share&&navigator.canShare?.({files:[preparedFile]})){
  navigator.share({files:[preparedFile]}).catch(e=>{if(e?.name!=='AbortError')message('Не удалось открыть отправку. Можно скачать файл.');preparedAction.dataset.share='false';preparedAction.textContent='Скачать файл';});
 }else downloadPrepared();
});
preparedCancel.addEventListener('click',clearPrepared);
function requestText(intent){
 closeMenu(true);clearPrepared();outputIntent=intent;
 if(dialog.dataset.step==='edit'&&text.value.trim()){syncActions();return;}
 button.click();
}
async function prepareFormat(format,share=false){
 if(!selected||running||exportBusy)return;
 closeMenu(true);clearPrepared();
 if((format==='docx'||format==='txt')&&(!text.value.trim()||dialog.dataset.step!=='edit')){
  requestText(format+(share?'-share':''));return;
 }
 const token=session;exportBusy=true;syncMenu();
 try{
  let blob,ext=format;
  if(format==='docx'){
   if(!window.SEYVEO_DOCS_EXPORT?.docxFromText)throw Error('Экспорт Word недоступен.');
   blob=window.SEYVEO_DOCS_EXPORT.docxFromText(text.value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,''));
  }else if(format==='txt'){blob=new Blob([text.value],{type:'text/plain;charset=utf-8'});}
  else{
   const canvas=await sourceCanvas(format==='annotated');
   const jpeg=await canvasJpeg(canvas);
   if(format==='jpg')blob=jpeg;
   else{
    if(!window.SEYVEO_DOCS_EXPORT?.pdfFromJpegs)throw Error('Экспорт PDF недоступен.');
    blob=window.SEYVEO_DOCS_EXPORT.pdfFromJpegs([{width:canvas.width,height:canvas.height,jpegBytes:new Uint8Array(await jpeg.arrayBuffer())}]);ext='pdf';
   }
  }
  if(dialog.open&&token===session)showPrepared(blob,ext,share);
 }catch(e){if(dialog.open&&token===session)message(e?.message||'Не удалось подготовить файл.');}
 finally{exportBusy=false;syncMenu();}
}
textExport.addEventListener('click',()=>{
 const [format,share]=outputIntent.split('-');if(['docx','txt'].includes(format))void prepareFormat(format,share==='share');
});
menuBack.addEventListener('click',()=>page('root'));
menuEdit.addEventListener('click',()=>page('edit'));
menuExport.addEventListener('click',()=>page('export'));
menuShare.addEventListener('click',()=>page('share'));
editNote.addEventListener('click',()=>{if(dialog.dataset.step==='edit'&&text.value.trim()){closeMenu();toNote();}else requestText('note');});
editWord.addEventListener('click',()=>requestText('docx'));
editPaper.addEventListener('click',()=>{closeMenu();toPaper();});
editPdf.addEventListener('click',()=>{closeMenu();toPaper('pdf');});
for(const [node,format] of [[outWord,'docx'],[outPdf,'pdf'],[outAnnotated,'annotated'],[outJpeg,'jpg'],[outTxt,'txt']])node.addEventListener('click',()=>{const share=menuPage==='share';void prepareFormat(format,share);});
dialog.append(more,menu);
function closeMenu(focus=false){
 menu.hidden=true;more.setAttribute('aria-expanded','false');
 menuPage='root';
 if(focus&&!more.hidden)more.focus({preventScroll:true});
}
function syncMenu(){
 const available=!!selected&&['photo','edit'].includes(dialog.dataset.step);
 more.hidden=!available;if(!available)closeMenu();
 const inEdit=dialog.dataset.step==='edit';
 const blocked=!selected||running||exportBusy;
 for(const node of new Set(Object.values(groups).flat())){node.hidden=!groups[menuPage].includes(node);node.disabled=blocked&&node!==menuBack;}
 if(menuPage==='root'){menuOCR.hidden=inEdit;menuLines.hidden=inEdit;}
 if(menuPage==='edit'){editPaper.disabled=blocked||inEdit;editPdf.disabled=blocked||inEdit;}
 outAnnotated.disabled=blocked||!(savedScan?.paper?.strokes?.length||savedScan?.paper?.texts?.length);
 menuLines.setAttribute('aria-checked',String(keepLines?.checked!==false));
 const format=outputIntent.split('-')[0];
 textExport.hidden=!inEdit||!['docx','txt'].includes(format);
 textExport.disabled=blocked||!text.value.trim();
 textExport.textContent=(outputIntent.endsWith('-share')?'Подготовить для отправки: ':'Сохранить как ')+(format==='docx'?'Word (.docx)':'TXT');
}
more.addEventListener('click',()=>{
 if(consentBox&&!consentBox.hidden){consentBox.hidden=true;more.focus({preventScroll:true});return;}
 if(!menu.hidden){closeMenu(true);return;}
 clearPrepared();page('root');if(more.hidden)return;
 menu.hidden=false;more.setAttribute('aria-expanded','true');
 (menu.querySelector('button:not(:disabled)')||more).focus({preventScroll:true});
});
menuOCR.addEventListener('click',()=>{closeMenu(true);button.click();});
menuLines.addEventListener('click',()=>{if(keepLines)keepLines.click();syncMenu();});
dialog.addEventListener('click',event=>{
 if(!menu.hidden&&!menu.contains(event.target)&&!more.contains(event.target))closeMenu();
 if(consentBox&&!consentBox.hidden&&!consentBox.contains(event.target)&&!button.contains(event.target)&&!more.contains(event.target)&&!menu.contains(event.target)){
  consentBox.hidden=true;
 }
});
dialog.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&consentBox&&!consentBox.hidden){
  event.preventDefault();event.stopPropagation();$('noteScanConsentNo').click();return;
 }
 if(event.key==='Escape'&&!prepared.hidden){event.preventDefault();event.stopPropagation();clearPrepared();return;}
 if(event.key==='Escape'&&!menu.hidden){event.preventDefault();event.stopPropagation();closeMenu(true);}
});

function setStep(step){
 // Three actual work stages, not transparent overlays or duplicate controls.
 dialog.dataset.step=step;
 delete dialog.dataset.scanError;
 const guidance=dialog.querySelector(':scope > p:first-of-type');
 if(guidance)guidance.textContent=step==='photo'
  ?'Проверьте снимок, затем распознайте текст.'
  :'Снимите страницу — Сэйви поможет превратить её в текст.';
 if(manualButton)manualButton.hidden=true;
 syncMenu();
}
function offerManual(){
 // Only offer manual entry when OCR couldn't find text or failed.
 if(manualButton)manualButton.hidden=false;
}
// Show only usable actions. OCR result remains editable, including manual text.
function syncActions(){
 if(toPaperButton)toPaperButton.disabled=!selected||running;
 if(toTextButton)toTextButton.disabled=!text.value.trim()||running;
 syncMenu();
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
 clearPrepared();outputIntent='';savedScan=null;delete dialog.dataset.savedScan;$('noteScanTitle').textContent='Сканировать';
 selected=null;consented=false;clearURL();preview.removeAttribute('src');preview.hidden=true;
 if(consentBox)consentBox.hidden=true;
 text.value='';text.wrap='soft';button.disabled=true;
 setStep('pick');syncActions();message('');
}
function open(){if(dialog.open)return;intoOpenNote=false;reset();dialog.showModal()}
function openSaved(note,options={}){
 if(dialog.open||!note?.paper?.photo)return false;
 try{
  const original=window.SEYVEO_NOTEBOOK_SCREEN?.polishScanExample?.(note)||note;
  const parts=original.paper.photo.split(',');
  if(!/^data:image\/(jpeg|png|webp);base64$/.test(parts[0]))return false;
  const bytes=Uint8Array.from(atob(parts[1]),c=>c.charCodeAt(0));
  intoOpenNote=false;reset();dialog.showModal();
  select(new File([bytes],'document.jpg',{type:parts[0].slice(5,-7)}));
  savedScan=original;dialog.dataset.savedScan='true';
  $('noteScanTitle').textContent=note.title||'Скан документа';
  message('');syncMenu();
  if(options.exportPDF)void prepareFormat('annotated');
  return true;
 }catch{if(dialog.open)dialog.close();return false;}
}
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
  dialog.dataset.scanError='true';
  message('Выберите обычную фотографию до 15 МБ.');return;
 }
 clearPrepared();outputIntent='';session++;selected=file;clearURL();localURL=URL.createObjectURL(file);preview.src=localURL;
 if(consentBox)consentBox.hidden=true;
 text.value='';setStep('photo');
 preview.hidden=false;button.disabled=running;syncActions();
 message('Фото обрабатывается на устройстве.');
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
 running=true;button.disabled=true;
 if(manualButton)manualButton.hidden=true;
 syncActions();
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
  running=false;button.disabled=!selected;syncActions();
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
function toPaper(mode){
 if(!selected){message('Сначала выберите изображение.');return}
 const file=selected,existing=savedScan;
 if(typeof window.SEYVEO_PAPER?.open!=='function'){message('Редактор пометок недоступен.');return;}
 dialog.close();
 if(existing)window.SEYVEO_PAPER.open(existing,{scan:true,exportPDF:mode==='pdf'});
 else{window.SEYVEO_PAPER.open(null,{scan:true,sourceFile:file,exportPDF:mode==='pdf'});window.SEYVEO_PAPER.importPhoto(file);}
}
// Test a real OCR input without needing the camera or gallery.
$('svNoteScanExample')?.addEventListener('click',()=>{
 if(running||!dialog.open)return;
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=600;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,1200);
 ctx.fillStyle='#20242b';ctx.font='bold 54px Arial';ctx.fillText('Учебный документ',65,100);
 ctx.font='44px Arial';
 ['Накладная № 014','Бумага — 5 пачек','Папки — 10 шт.','Всего: 2450 рублей','Вымышленный пример SEYVEO'].forEach((line,i)=>ctx.fillText(line,65,195+i*88));
 const token=session;
 canvas.toBlob(blob=>{
  if(!blob||!dialog.open||session!==token)return;
  select(new File([blob],'seyveo-scan-example.jpg',{type:'image/jpeg'}));
 },'image/jpeg',.92);
});
for(const id of ['noteScanCamera','noteScanGallery']){
 $(id)?.addEventListener('change',event=>{
  const file=event.target.files?.[0];event.target.value='';
  select(file);
 });
}
// Soft wrapping only changes how long lines LOOK on a narrow iPhone screen.
// Actual newlines and the user's "preserve lines" OCR choice stay untouched.
keepLines?.addEventListener('change',()=>{text.wrap='soft';syncMenu();});
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
 (more.hidden?button:more).focus({preventScroll:true});
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
window.SEYVEO_NOTE_SCANNER=Object.freeze({open,openSaved,scanIntoNote,resumePhoto:file=>{if(!file||dialog.open)return false;open();select(file);return true;}});
})();
