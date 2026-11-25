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
let leavingForDocs=false,editingScanText=false,pendingScanEdit=false,autoReadExisting=false,markPreviewURL='';
let scanSource=null,scanCorrected=null,scanPreparing=false;
const originalToggle=document.createElement('button');originalToggle.type='button';originalToggle.className='sv-note-scan-original';originalToggle.hidden=true;originalToggle.textContent='Оригинал';button.before(originalToggle);
const OCR_PERMISSION='seyveo-local-ocr-consent-v1';
try{consented=localStorage.getItem(OCR_PERMISSION)==='yes';}catch{}
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
const docIcon='<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>';
const imageIcon='<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m4 17 5-5 4 4 3-3 5 5"/>';
const arrowIcon='<path d="m14 6-6 6 6 6"/>';
const shareIcon='<path d="M12 15V3m-4 4 4-4 4 4M7 9H4v12h16V9h-3"/>';


const menuShare=menuButton('Поделиться',shareIcon);
const menuPrint=menuButton('Печать','<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2h-2M7 14h10v7H7zM17 11h1"/>');

const menuBack=menuButton('Назад',arrowIcon);
const outWord=menuButton('Word (.docx)',docIcon);
const outPdf=menuButton('PDF',docIcon);
const outJpeg=menuButton('Фото (JPEG)',imageIcon);
const outTxt=menuButton('Текст (TXT)',docIcon);
const outTextPDF=menuButton('PDF',docIcon);
const groups={root:[menuShare,menuPrint],share:[menuBack,outTextPDF,outPdf,outWord,outJpeg,outTxt]};
for(const node of [...groups.root,...groups.share])menu.append(node);
const prepared=document.createElement('div');prepared.id='svScanPrepared';prepared.className='sv-menu-surface';prepared.hidden=true;
const preparedName=document.createElement('strong');const preparedAction=document.createElement('button');preparedAction.type='button';
const preparedCancel=document.createElement('button');preparedCancel.type='button';preparedCancel.setAttribute('aria-label','Закрыть');preparedCancel.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
const preparedArchive=document.createElement('button');preparedArchive.type='button';preparedArchive.innerHTML='<span>В архив документов</span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="8" width="16" height="13" rx="2"/><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M10 12h4"/></svg>';
const preparedDownload=document.createElement('button');preparedDownload.type='button';preparedDownload.innerHTML='<span>Сохранить в файлы</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg>';preparedDownload.addEventListener('click',()=>downloadPrepared());
const preparedDestinations=document.createElement('div');preparedDestinations.id='svScanShareDestinations';
function destination(label,icon,callback){
 const node=document.createElement('button');node.type='button';
 node.innerHTML='<span>'+label+'</span><svg viewBox="0 0 24 24" aria-hidden="true">'+icon+'</svg>';
 node.addEventListener('click',callback);return node;
}
const chatIcon='<path d="M20 11.5a8 8 0 0 1-8 8H5l1.5-4A8 8 0 1 1 20 11.5Z"/>';
const familyIcon='<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 14a5 5 0 0 1 5 5v1"/>';
const mailIcon='<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>';
const workChoice=destination('Рабочий чат',chatIcon,chooseWorkRoom);
const familyChoice=destination('Семейный чат',familyIcon,()=>sendDraft('family'));
const mailChoice=destination('Почта',mailIcon,()=>sendDraft('mail'));
const roomList=document.createElement('div');roomList.id='svScanShareRooms';roomList.hidden=true;
const backRooms=destination('Назад',arrowIcon,()=>showShareDestinations());
preparedDestinations.append(workChoice,familyChoice,mailChoice);
const preparedFormats=document.createElement('button');preparedFormats.type='button';preparedFormats.innerHTML='<span>Другой формат</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
preparedFormats.addEventListener('click',event=>{
 event.stopPropagation();clearPrepared();page('share');menu.hidden=false;more.setAttribute('aria-expanded','true');
});
const preparedHead=document.createElement('div');preparedHead.className='sv-scan-share-head';preparedHead.append(preparedName,preparedCancel);
prepared.append(preparedHead,preparedAction,preparedDestinations,roomList,preparedDownload,preparedArchive,preparedFormats);dialog.append(prepared);
function showShareDestinations(){
 roomList.hidden=true;roomList.replaceChildren();
 const nativeShare=canShareFile(preparedFile),internal=prepared.dataset.mode==='internal';
 preparedDestinations.hidden=!internal;preparedDownload.hidden=!internal&&nativeShare;preparedArchive.hidden=!internal;preparedFormats.hidden=!internal;
 preparedAction.hidden=internal||!nativeShare;
 workChoice.hidden=!window.SEYVEO_BUSINESS_COMMAND?.prepareSharedFile||!(window.SEYVEO_BUSINESS_COMMAND.listRooms?.()||[]).some(r=>r.id!=='dm-sayvi');
 familyChoice.hidden=!window.SEYVEO_FAMILY_CHAT?.prepareSharedFile;
 mailChoice.hidden=!window.SEYVEO_SAYVI_SURFACES?.prepareSharedMail;
}
function chooseWorkRoom(){
 if(!preparedFile||exportBusy)return;
 const rooms=(window.SEYVEO_BUSINESS_COMMAND?.listRooms?.()||[]).filter(r=>r.id!=='dm-sayvi');
 if(!rooms.length){message('Нет доступных рабочих чатов.');return;}
 roomList.replaceChildren(backRooms);
 for(const room of rooms){
  const choice=destination('',chatIcon,()=>sendDraft('work',room.id));
  choice.querySelector('span').textContent=room.label;
  roomList.append(choice);
 }
 preparedDestinations.hidden=true;preparedAction.hidden=true;preparedDownload.hidden=true;preparedArchive.hidden=true;preparedFormats.hidden=true;roomList.hidden=false;backRooms.focus({preventScroll:true});
}
async function sendDraft(target,room){
 if(!preparedFile||exportBusy)return;
 const file=preparedFile;exportBusy=true;syncMenu();
 for(const item of prepared.querySelectorAll('button'))item.disabled=true;
 try{
  let ok=false;
  if(target==='work')ok=window.SEYVEO_BUSINESS_COMMAND?.prepareSharedFile?.(room,file);
  else if(target==='family')ok=window.SEYVEO_FAMILY_CHAT?.prepareSharedFile?.(file);
  else if(target==='mail')ok=await window.SEYVEO_SAYVI_SURFACES?.prepareSharedMail?.(file);
  if(!ok){message('Не удалось прикрепить файл. Можно сохранить его или выбрать другое приложение.');return;}
  leavingForDocs=true;dialog.close();
 }catch{message('Не удалось открыть черновик. Файл остаётся доступен.');}
 finally{exportBusy=false;for(const item of prepared.querySelectorAll('button'))item.disabled=false;syncMenu();}
}
let editStartText='',knownScanText=null;
const formattedRead=document.createElement('div');formattedRead.id='svScanFormattedRead';formattedRead.hidden=true;formattedRead.tabIndex=0;formattedRead.setAttribute('role','button');formattedRead.setAttribute('aria-label','Открыть редактор документа');text.after(formattedRead);
function readableText(){return typeof savedScan?.scanText==='string'?savedScan.scanText:knownScanText;}
function showDocument(useText){
 const value=readableText(),visible=!!useText&&typeof value==='string';
 dialog.toggleAttribute('data-scan-reading-text',visible);
 if(visible)text.value=value;
 const html=visible&&savedScan?.scanRichHtml?window.SEYVEO_NOTE_RICH?.safeHTML?.(savedScan.scanRichHtml)||'':'';
 formattedRead.hidden=!html;formattedRead.innerHTML=html;
 dialog.toggleAttribute('data-scan-formatted-read',!!html);
}
const textDone=document.createElement('button');textDone.type='button';textDone.id='svScanTextDone';textDone.hidden=true;textDone.setAttribute('aria-label','Сохранить текст');
textDone.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.3l4.3 4.3 8.7-9.2"/></svg>';
textDone.addEventListener('click',()=>saveScanText());dialog.append(textDone);
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
function canShareFile(file){
 try{return !!(file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]})));}catch{return false;}
}
function showPreparedFile(file,preferNative=false){
 clearPrepared();preparedFile=file;preparedName.textContent=file.name;
 prepared.dataset.mode=preferNative?'fallback':'internal';
 showShareDestinations();
 preparedAction.innerHTML='<span>Поделиться</span><svg viewBox="0 0 24 24" aria-hidden="true">'+shareIcon+'</svg>';preparedAction.dataset.share='true';
 prepared.hidden=false;
 const first=preparedDestinations.hidden?null:Array.from(preparedDestinations.children).find(n=>!n.hidden);
 (preferNative&&!preparedAction.hidden?preparedAction:first||(preparedAction.hidden?preparedDownload:preparedAction)).focus({preventScroll:true});
 message('');
}
function showPrepared(blob,extension,share){
 const file=new File([blob],fileBase()+'.'+extension,{type:blob.type});
 if(share&&nativeShareFile(file))return;
 showPreparedFile(file,share);
}
// Prebuild the default PDF before the user taps Share. Safari requires a
// fresh user gesture for its native share sheet, not a delayed synthetic click.
let shareCache=null,nativeSharing=false;
function shareSnapshot(){
 return {file:selected,note:savedScan,text:text.value,title:fileBase(),isText:dialog.hasAttribute('data-scan-reading-text')};
}
function sameShare(a,b){
 return !!a&&a.file===b.file&&a.note===b.note&&a.text===b.text&&a.title===b.title&&a.isText===b.isText;
}
function textShareBlob(snapshot){
 if(snapshot.isText&&snapshot.text.trim()&&window.SEYVEO_DOCS_STUDIO?.textPdf)
  return window.SEYVEO_DOCS_STUDIO.textPdf(snapshot.text);
 return null;
}
function warmSharePDF(){
 if(!selected||!dialog.open||running||editingScanText)return null;
 const snapshot=shareSnapshot();
 if(sameShare(shareCache?.snapshot,snapshot))return shareCache;
 const entry={snapshot,file:null,promise:null};shareCache=entry;
 entry.promise=(async()=>{
  const blob=textShareBlob(snapshot);
  if(blob)return new File([blob],snapshot.title+'.pdf',{type:'application/pdf'});
  const canvas=await sourceCanvas(true),jpeg=await canvasJpeg(canvas);
  const pdf=window.SEYVEO_DOCS_EXPORT?.pdfFromJpegs?.([{width:canvas.width,height:canvas.height,jpegBytes:new Uint8Array(await jpeg.arrayBuffer())}]);
  if(!pdf)throw Error('Экспорт PDF недоступен.');
  return new File([pdf],snapshot.title+'.pdf',{type:'application/pdf'});
 })().then(file=>{entry.file=file;return file;}).catch(()=>{if(shareCache===entry)shareCache=null;return null;});
 return entry;
}
function nativeShareFile(file){
 if(!canShareFile(file)||nativeSharing)return false;
 const snapshot=shareSnapshot();
 const fallback=error=>{
  if(error?.name==='AbortError')return;
  if(dialog.open&&sameShare(snapshot,shareSnapshot())){
   showPreparedFile(file,true);
   message('Нажмите «Поделиться» или сохраните файл.');
  }
 };
 nativeSharing=true;
 try{
  Promise.resolve(navigator.share({files:[file]})).catch(fallback).finally(()=>{nativeSharing=false;});
 }catch(error){nativeSharing=false;fallback(error);}
 return true;
}
function shareDocument(useNative=true){
 if(!selected||running||exportBusy||nativeSharing)return;
 closeMenu(true);clearPrepared();
 const snapshot=shareSnapshot();
 let entry=sameShare(shareCache?.snapshot,snapshot)?shareCache:null;
 // A text PDF can be created synchronously in the same click handler.
 if(!entry?.file){
  try{const blob=textShareBlob(snapshot);if(blob){entry={snapshot,file:new File([blob],snapshot.title+'.pdf',{type:'application/pdf'})};shareCache=entry;}}catch{}
 }
 if(entry?.file){
  if(!useNative||!nativeShareFile(entry.file))showPreparedFile(entry.file,useNative);
  return;
 }
 entry=entry||warmSharePDF();
 if(!entry?.promise){message('Не удалось подготовить PDF.');return;}
 exportBusy=true;syncMenu();message('Подготавливаю PDF…');
 entry.promise.then(file=>{
  if(!dialog.open||!sameShare(snapshot,shareSnapshot()))return;
  if(!file){message('Не удалось подготовить PDF.');return;}
  if(useNative&&(!navigator.userActivation||navigator.userActivation.isActive)&&nativeShareFile(file))return;
  showPreparedFile(file,useNative);
 }).finally(()=>{exportBusy=false;syncMenu();});
}
function downloadPrepared(){
 if(!preparedFile)return;
 if(preparedURL)URL.revokeObjectURL(preparedURL);
 preparedURL=URL.createObjectURL(preparedFile);
 const a=document.createElement('a');a.href=preparedURL;a.download=preparedFile.name;document.body.append(a);a.click();a.remove();
}
preparedAction.addEventListener('click',()=>{
 if(!preparedFile)return;
 if(!nativeShareFile(preparedFile))downloadPrepared();
});
preparedCancel.addEventListener('click',clearPrepared);
function handoffToDocs(payload){
 const center=window.SEYVEO_DOCUMENT_CENTER;
 if(!center?.openScanWork?.(payload)){message('Не удалось открыть Документы. Скан остаётся здесь.');return false;}
 leavingForDocs=true;dialog.close();return true;
}
preparedArchive.addEventListener('click',()=>{if(preparedFile)handoffToDocs({kind:'archive',file:preparedFile});});
async function saveScanText(openEditor=false){
 if((!editingScanText&&!openEditor)||!selected||running||exportBusy)return;
 const api=window.SEYVEO_NOTES_API;
 if(!api?.getNotes||!api?.putNotes){message('Блокнот недоступен.');return;}
 const value=text.value.slice(0,8000),token=session;
 exportBusy=true;syncActions();
 try{
  let id=savedScan?.id;
  let list=api.getNotes();
  let updated;
  if(id){
   if(!list.some(n=>n.id===id))throw Error('Документ не найден.');
   updated=list.map(n=>n.id===id?{...n,scanText:value,updatedAt:Date.now()}:n);
  }else{
   const paper=window.SEYVEO_PAPER;
   if(!paper?.compressPhoto||!paper?.normalize)throw Error('Сохранение скана недоступно.');
   const photo=await paper.compressPhoto(selected);
   if(!dialog.open||session!==token)return;
   list=api.getNotes();id=String(Date.now())+'-'+Math.random().toString(36).slice(2);
   updated=[{id,title:'Скан документа',text:'Скан документа',noteKind:'art',scanDocument:true,scanText:value,paper:paper.normalize({photo,background:'light',pattern:'blank',strokes:[],texts:[]}),createdAt:Date.now()},...list];
  }
  if(!api.putNotes(updated))throw Error('Не удалось сохранить текст. Документ остаётся открытым.');
  savedScan=updated.find(n=>n.id===id);dialog.dataset.savedScan='true';
  $('noteScanTitle').textContent=savedScan.title||'Скан документа';
  text.blur();editingScanText=false;delete dialog.dataset.editScanText;outputIntent='';setStep('photo');showDocument(true);message('');
  if(openEditor){exportBusy=false;openSharedEditor(null,{focus:false});}
 }catch(e){if(dialog.open&&session===token)message(e?.message||'Не удалось сохранить документ.');}
 finally{exportBusy=false;syncActions();}
}
function activateTextEditor(){
 pendingScanEdit=false;editingScanText=true;editStartText=text.value;dialog.dataset.editScanText='true';outputIntent='';
 setStep('edit');showDocument(false);syncActions();
}
function openTextEditor(){
 if(running||exportBusy)return;
 const known=typeof savedScan?.scanText==='string'?savedScan.scanText:window.SEYVEO_NOTEBOOK_SCREEN?.scanExampleText?.(savedScan);
 if(typeof known==='string'||text.value.trim()){
  if(typeof known==='string')text.value=known;
  activateTextEditor();message('');return;
 }
 pendingScanEdit=true;
 // Keep the original image in place during consent and recognition.
 if(dialog.dataset.step!=='photo')setStep('photo');
 button.click();
}
function requestText(intent){
 closeMenu(true);clearPrepared();outputIntent=intent;
 if(dialog.dataset.step==='edit'&&text.value.trim()){syncActions();return;}
 button.click();
}
async function prepareFormat(format,share=false){
 if(!selected||running||exportBusy)return;
 closeMenu(true);clearPrepared();
 if(['docx','txt','textpdf'].includes(format)&&!text.value.trim()&&typeof savedScan?.scanText==='string')text.value=savedScan.scanText;
 if(['docx','txt','textpdf'].includes(format)&&!text.value.trim()){
  requestText(format+(share?'-share':''));return;
 }
 const token=session;exportBusy=true;syncMenu();
 try{
  let blob,ext=format;
  if(format==='docx'){
   if(!window.SEYVEO_DOCS_EXPORT?.docxFromText)throw Error('Экспорт Word недоступен.');
   blob=window.SEYVEO_DOCS_EXPORT.docxFromText(text.value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,''));
  }else if(format==='txt'){blob=new Blob([text.value],{type:'text/plain;charset=utf-8'});}
  else if(format==='textpdf'){if(!window.SEYVEO_DOCS_STUDIO?.textPdf)throw Error('Экспорт текста в PDF недоступен.');blob=window.SEYVEO_DOCS_STUDIO.textPdf(text.value);ext='pdf';}
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
 const [format,share]=outputIntent.split('-');if(['docx','txt','textpdf'].includes(format))void prepareFormat(format,share==='share');
});
menuBack.addEventListener('click',()=>page('root'));


menuShare.addEventListener('click',()=>shareDocument(true));
menuPrint.addEventListener('click',()=>void printScan());
for(const [node,format] of [[outWord,'docx'],[outPdf,'pdf'],[outTextPDF,'textpdf'],[outJpeg,'jpg'],[outTxt,'txt']])node.addEventListener('click',()=>{const share=menuPage==='share';const withMarks=format==='pdf'&&(savedScan?.paper?.strokes?.length||savedScan?.paper?.texts?.length);void prepareFormat(withMarks?'annotated':format,share);});
dialog.append(more,menu);
async function printScan(){
 if(!selected||running||exportBusy)return;
 closeMenu(true);clearPrepared();
 const win=window.open('','_blank');if(!win){message('Разрешите открытие окна для печати.');return;}
 const token=session;exportBusy=true;syncMenu();
 try{
  win.opener=null;const d=win.document;d.title=fileBase();
  const style=d.createElement('style');style.textContent='@page{size:A4;margin:14mm}body{margin:0;color:#171e29;font:12pt/1.5 system-ui,sans-serif}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}img{display:block;max-width:100%;max-height:260mm;margin:auto}@media print{button{display:none}}';d.head.append(style);
  const launch=d.createElement('button');launch.textContent='Печать';launch.addEventListener('click',()=>win.print());d.body.append(launch);
  if(dialog.hasAttribute('data-scan-reading-text')&&!(savedScan?.paper?.strokes?.length||savedScan?.paper?.texts?.length)){const pre=d.createElement('pre');pre.textContent=readableText()||'';d.body.append(pre);}
  else{const c=await sourceCanvas(true);if(!dialog.open||token!==session){win.close();return;}const img=d.createElement('img');img.alt='Документ';img.src=c.toDataURL('image/jpeg',.92);d.body.append(img);if(!img.complete)await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});}
  win.focus();win.print();
 }catch(e){try{win.close();}catch{}message('Не удалось подготовить печать.');}
 finally{exportBusy=false;syncMenu();}
}
function closeMenu(focus=false){
 menu.hidden=true;more.setAttribute('aria-expanded','false');
 menuPage='root';
 if(focus&&!more.hidden)more.focus({preventScroll:true});
}
function syncMenu(){
 const available=!!selected&&['photo','edit'].includes(dialog.dataset.step);
 more.hidden=!available||editingScanText;if(more.hidden)closeMenu();
 const inEdit=dialog.dataset.step==='edit';
 const blocked=!selected||running||exportBusy;
 textDone.hidden=!editingScanText;textDone.disabled=running||exportBusy;
 text.readOnly=running||exportBusy||dialog.hasAttribute('data-scan-reading-text');

 for(const node of new Set(Object.values(groups).flat())){node.hidden=!groups[menuPage].includes(node);node.disabled=blocked&&node!==menuBack;}


 menu.dataset.page=menuPage;

 const hasMarks=!!(savedScan?.paper?.strokes?.length||savedScan?.paper?.texts?.length);
 const shareTextPDF=!!text.value.trim()&&dialog.hasAttribute('data-scan-reading-text')&&!hasMarks;
 outPdf.querySelector('span').textContent=hasMarks?'PDF с разметкой':'PDF';
 outTextPDF.hidden=menuPage!=='share'||!shareTextPDF;
 outPdf.hidden=menuPage!=='share'||shareTextPDF;
 const format=outputIntent.split('-')[0];
 textExport.hidden=!inEdit||!['docx','txt','textpdf'].includes(format);
 textExport.disabled=blocked||!text.value.trim();
 textExport.textContent=(outputIntent.endsWith('-share')?'Подготовить для отправки: ':'Сохранить как ')+(format==='docx'?'Word (.docx)':format==='textpdf'?'PDF':'TXT');
}
more.addEventListener('click',()=>{
 if(consentBox&&!consentBox.hidden){consentBox.hidden=true;pendingScanEdit=false;more.focus({preventScroll:true});return;}
 if(!menu.hidden){closeMenu(true);return;}
 clearPrepared();page('root');if(more.hidden)return;
 menu.hidden=false;more.setAttribute('aria-expanded','true');
 // The user has not yet tapped Share; prepare a fresh file now.
 void warmSharePDF();
 (menu.querySelector('button:not([hidden]):not(:disabled)')||more).focus({preventScroll:true});
});
dialog.addEventListener('click',event=>{
 if(!prepared.hidden&&!exportBusy&&!prepared.contains(event.target)&&!menu.contains(event.target)&&!more.contains(event.target))clearPrepared();
 if(!menu.hidden&&!menu.contains(event.target)&&!more.contains(event.target))closeMenu();
 if(consentBox&&!consentBox.hidden&&!consentBox.contains(event.target)&&!button.contains(event.target)&&!more.contains(event.target)&&!menu.contains(event.target)){
  consentBox.hidden=true;pendingScanEdit=false;
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
 originalToggle.hidden=!(scanSource&&scanCorrected&&!savedScan&&!running&&!scanPreparing&&dialog.dataset.step==='photo'&&!editingScanText);
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
function clearURL(){if(localURL){URL.revokeObjectURL(localURL);localURL=''}if(markPreviewURL){URL.revokeObjectURL(markPreviewURL);markPreviewURL=''}}
function reset(){
 shareCache=null;clearPrepared();outputIntent='';editingScanText=false;pendingScanEdit=false;delete dialog.dataset.editScanText;savedScan=null;knownScanText=null;editStartText='';showDocument(false);delete dialog.dataset.savedScan;$('noteScanTitle').textContent='Сканировать';
 selected=null;scanSource=null;scanCorrected=null;scanPreparing=false;originalToggle.hidden=true;autoReadExisting=false;clearURL();preview.removeAttribute('src');preview.hidden=true;
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
  select(new File([bytes],'document.jpg',{type:parts[0].slice(5,-7)}),{auto:false});
  savedScan=original;dialog.dataset.savedScan='true';
  $('noteScanTitle').textContent=note.title||'Скан документа';
  const known=typeof original.scanText==='string'?original.scanText:window.SEYVEO_NOTEBOOK_SCREEN?.scanExampleText?.(original);
  if(typeof known==='string'){knownScanText=known;text.value=known;}
  message('');showDocument(!options.exportPDF);syncMenu();
  if(!options.exportPDF&&typeof known==='string')void warmSharePDF();
  if(options.editText)openTextEditor();
  if(original.paper.strokes?.length||original.paper.texts?.length){
   const token=session;
   Promise.resolve(window.SEYVEO_PAPER?.scanAnnotationImage?.(original)).then(canvas=>canvas?canvasJpeg(canvas):null).then(blob=>{
    if(!blob||!dialog.open||session!==token)return;
    markPreviewURL=URL.createObjectURL(blob);preview.src=markPreviewURL;
   }).catch(()=>{if(dialog.open&&session===token)message('Не удалось показать пометки. Оригинал сохранён.');});
  }
  if(options.exportPDF)void prepareFormat('annotated');
  else if(!options.editText&&typeof known!=='string'){autoReadExisting=true;button.click();}
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
async function select(file,{auto=true}={}){
 if(!file)return;
 if(!file.type.startsWith('image/')||file.type==='image/svg+xml'||file.size>15*1024*1024){
  dialog.dataset.scanError='true';
  message('Выберите обычную фотографию до 15 МБ.');return;
 }
 clearPrepared();showDocument(false);outputIntent='';session++;scanSource=file;scanCorrected=null;scanPreparing=false;selected=file;clearURL();localURL=URL.createObjectURL(file);preview.src=localURL;
 if(consentBox)consentBox.hidden=true;
 text.value='';setStep('photo');
 preview.hidden=false;button.disabled=running;syncActions();
 message('');
 if(auto){
  const token=session;scanPreparing=true;button.disabled=true;syncActions();message('Проверяем границы документа…');
  const result=await window.SEYVEO_SCAN_AUTO?.process(file);
  if(token!==session||!dialog.open)return;
  scanPreparing=false;
  if(result?.corrected){scanCorrected=result.file;selected=result.file;clearURL();localURL=URL.createObjectURL(selected);preview.src=localURL;originalToggle.textContent='Оригинал';}
  button.disabled=running;syncActions();message(result?.corrected?'Документ выровнен. Проверьте снимок.':'');
  pendingScanEdit=!intoOpenNote;if(!result?.corrected)button.click();
 }
}
originalToggle.addEventListener('click',()=>{
 if(!scanSource||!scanCorrected||running||scanPreparing||savedScan)return;
 selected=selected===scanSource?scanCorrected:scanSource;clearURL();localURL=URL.createObjectURL(selected);preview.src=localURL;originalToggle.textContent=selected===scanSource?'Авто':'Оригинал';text.value='';syncActions();message(selected===scanSource?'Исходная фотография.':'Документ выровнен.');
});
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
 if(running||scanPreparing||!selected)return;
 const file=selected,token=++session,retainLines=keepLines?.checked!==false;
 running=true;button.disabled=true;
 if(manualButton)manualButton.hidden=true;
 syncActions();
 let worker=null,sendToNotebook=false;
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
   autoReadExisting=false;
   message('Текст не найден. Можно выбрать другое фото или ввести текст вручную.');
   offerManual();
   return;
  }
  text.value=found.slice(0,8000);
  if(autoReadExisting&&savedScan?.id){
   autoReadExisting=false;
   const api=window.SEYVEO_NOTES_API,list=api?.getNotes?.();
   if(list?.some(n=>n.id===savedScan.id)){
    const next=list.map(n=>n.id===savedScan.id?{...n,scanText:text.value,updatedAt:Date.now()}:n);
    if(api.putNotes(next)){savedScan=next.find(n=>n.id===savedScan.id);showDocument(true);syncActions();message('');return;}
   }
   activateTextEditor();message('Проверьте текст и сохраните документ.');return;
  }
  if(!intoOpenNote&&!outputIntent){
   sendToNotebook=true;pendingScanEdit=false;
   message('Сохраняю в Блокнот…');return;
  }
  if(pendingScanEdit)activateTextEditor();else setStep('edit');syncActions();
  message(clean.removed?
   'Возможно, удалена строка панели телефона. Проверьте результат перед сохранением.':
   'Проверьте текст и исправьте возможные ошибки перед сохранением.');
 }catch(error){
  if(token===session&&dialog.open){
   autoReadExisting=false;
   message((error?.message||'Не удалось распознать текст.')+' Можно ввести текст вручную.');
   offerManual();
  }
 }finally{
  if(worker)try{await worker.terminate()}catch{}
  running=false;button.disabled=!selected;syncActions();
  if(dialog.open&&token===session&&sendToNotebook)void saveScanText(true);
  else if(dialog.open&&token===session&&!editingScanText&&!outputIntent)void warmSharePDF();
 }
}
function cancel(){if(exportBusy)return;if(!prepared.hidden){clearPrepared();return;}if(!consentBox.hidden){consentBox.hidden=true;pendingScanEdit=false;return;}if(running){session++;pendingScanEdit=false;autoReadExisting=false;message('Распознавание отменено.');offerManual();return;}if(editingScanText){if((!savedScan?.id||text.value!==editStartText)&&!window.confirm('Выйти без сохранения документа?'))return;if(!savedScan?.id){dialog.close();return;}text.blur();text.value=readableText()||'';editingScanText=false;delete dialog.dataset.editScanText;setStep('photo');showDocument(true);message('');return;}dialog.close()}
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
 if(running||exportBusy)return;
 if(!selected){message('Сначала выберите изображение.');return}
 const file=selected,existing=savedScan;
 if(typeof window.SEYVEO_PAPER?.open!=='function'){message('Редактор пометок недоступен.');return;}
 dialog.close();
 if(existing)window.SEYVEO_PAPER.open(existing,{scan:true,exportPDF:mode==='pdf',initialTool:mode==='marker'?'marker':'pen'});
 else{window.SEYVEO_PAPER.open(null,{scan:true,sourceFile:file,exportPDF:mode==='pdf',initialTool:mode==='marker'?'marker':'pen'});window.SEYVEO_PAPER.importPhoto(file);}
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
// Use the actual Notebook editor, including its existing keyboard accessory.
function openSharedEditor(event,options={}){
 if(!selected||running||exportBusy||!consentBox.hidden||intoOpenNote)return;
 const editor=window.SEYVEO_NOTES_EDITOR,api=window.SEYVEO_NOTES_API;
 if(!editor?.openScan||!api){message('Редактор Блокнота недоступен.');return;}
 const value=readableText();
 if(!savedScan?.id){
  if(typeof value==='string')text.value=value;
  void saveScanText(true);return;
 }
 if(typeof savedScan.scanText!=='string'){
  if(typeof value!=='string'){void saveScanText(true);return;}
  const list=api.getNotes(),next=list.map(n=>n.id===savedScan.id?{...n,scanText:value}:n);
  if(!api.putNotes(next)){message('Не удалось сохранить текст.');return;}
  savedScan=next.find(n=>n.id===savedScan.id);
 }
 const id=savedScan.id;
 const surface=formattedRead.hidden?text:formattedRead;
 const position={focus:options.focus!==false,scrollTop:surface.scrollTop,selectionStart:surface===text?text.selectionStart:null,selectionEnd:surface===text?text.selectionEnd:null};
 if(event?.type==='click'&&surface===formattedRead){position.x=event.clientX;position.y=event.clientY;}
 clearPrepared();closeMenu();
 // Keep the reader in the modal stack, avoiding a flash of the list.
 if(!editor.openScan(id,position))message('Не удалось открыть редактор.');
}
preview.setAttribute('role','button');preview.setAttribute('aria-label','Открыть редактор документа');preview.tabIndex=0;
function tapDocument(event){if(!prepared.hidden){if(!exportBusy)clearPrepared();return;}if(dialog.dataset.step==='photo'&&!editingScanText){if(intoOpenNote)button.click();else openSharedEditor(event);}}
preview.addEventListener('click',tapDocument);
formattedRead.addEventListener('click',tapDocument);
formattedRead.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();tapDocument(event);}});
preview.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();tapDocument(event);}});
text.setAttribute('aria-label','Текст документа');
text.addEventListener('click',tapDocument);
text.addEventListener('keydown',event=>{if(dialog.hasAttribute('data-scan-reading-text')&&!editingScanText&&(event.key==='Enter'||event.key===' ')){event.preventDefault();tapDocument(event);}});
text.addEventListener('input',syncActions);
manualButton?.addEventListener('click',()=>{
 if(!selected||running)return;
 if(!intoOpenNote&&!outputIntent){autoReadExisting=false;void saveScanText(true);return;}
 setStep('edit');syncActions();message('Введите текст вручную.');text.focus();
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
 consentBox.hidden=true;pendingScanEdit=false;autoReadExisting=false;
 if(selected&&!intoOpenNote&&!savedScan){pendingScanEdit=true;offerManual();message('Можно сохранить снимок и дополнить текст в Блокноте.');}
 (more.hidden?button:more).focus({preventScroll:true});
});
$('noteScanConsentYes').addEventListener('click',()=>{
 if(!selected||running)return;
 consented=true;try{localStorage.setItem(OCR_PERMISSION,'yes');}catch{}
 consentBox.hidden=true;
 recognize();
});
$('noteScanCancel').addEventListener('click',cancel);
$('noteScanToText').addEventListener('click',toNote);
$('noteScanToPaper').addEventListener('click',toPaper);
$('noteScanBack').addEventListener('click',cancel);
dialog.addEventListener('cancel',event=>{if(!prepared.hidden||editingScanText||running||exportBusy||!consentBox.hidden){event.preventDefault();cancel();}});
dialog.addEventListener('close',()=>{
 const handoff=leavingForDocs;leavingForDocs=false;
 session++;reset();intoOpenNote=false;
 if(!handoff&&!$('noteReviewDialog').open&&!$('notePaperDialog').open)
  window.SEYVEO_NOTES_API?.openNotes();
});
window.SEYVEO_NOTE_SCANNER=Object.freeze({open,openSaved,scanIntoNote,refreshSaved:(note,position)=>{
 if(!dialog.open||savedScan?.id!==note?.id)return false;
 savedScan=note;shareCache=null;showDocument(true);syncActions();message('');void warmSharePDF();
 const surface=formattedRead.hidden?text:formattedRead;
 if(Number.isFinite(position))surface.scrollTop=position;
 return true;
},suspendForDrawing:()=>{if(dialog.open){leavingForDocs=true;dialog.close();}},resumePhoto:file=>{if(!file||dialog.open)return false;open();select(file,{auto:false});return true;}});
})();
