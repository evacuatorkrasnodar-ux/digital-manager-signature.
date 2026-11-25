/* SEYVEO Docs · visible, usable developer tool studio.
 * Uses real local browser camera/photo import, PDF, DOCX, and canvas strokes.
 * No fake OCR, AI upload, printer discovery, electronic signature or EDMS.
 * Temporary scans exist only in memory; user explicitly exports/imports.
 */
(()=>{
'use strict';
const $=(tag,className,label)=>{
 const n=document.createElement(tag);
 if(className)n.className=className;
 if(label!==undefined)n.textContent=label;
 return n;
};
const button=(label,action,className='')=>{
 const n=$('button','sv-doc-tool-button '+className,label);
 n.type='button';n.addEventListener('click',action);return n;
};
/* SEYVEO-owned line pictograms: tiny visual instructions, no icon library
 * download, no emoji substitution, no Apple proprietary assets. */
const PICTOGRAMS=Object.freeze({
 scan:'<path d="M9 20V9h11M44 9h11v11M55 44v11H44M20 55H9V44"/><path d="M24 16h15l7 7v25H24zM39 16v8h7M29 31h12M29 37h11M29 43h8"/><path d="M14 35h36" class="sv-doc-art-accent"/>',
 file:'<path d="M17 8h22l10 10v33a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"/><path d="M39 8v11h10"/><path d="M31 29v18M22 38h18" class="sv-doc-art-accent"/>',
 create:'<path d="M17 8h22l9 9v17M39 8v10h9M13 15v35a5 5 0 0 0 5 5h17M21 27h17M21 34h10"/><path d="m29 49 2-9 16-16a3 3 0 0 1 4 0l5 5a3 3 0 0 1 0 4L40 49l-9 3Z" class="sv-doc-art-accent"/><path d="m44 27 9 9" class="sv-doc-art-accent"/>',
 sign:'<rect x="10" y="12" width="44" height="40" rx="6"/><path d="M18 23h28M18 30h17"/><path d="M17 44c7-10 7 4 14-3 4-6 5 5 10-2 3-5 3 4 7-1" class="sv-doc-art-accent"/>',
 convert:'<path d="M12 26c2-10 11-17 22-17 8 0 15 4 19 10M53 9v10H43"/><path d="M52 38c-2 10-11 17-22 17-8 0-15-4-19-10M11 55V45h10" class="sv-doc-art-accent"/>',
 print:'<path d="M18 23V9h28v14M18 45H9a5 5 0 0 1-5-5V29a6 6 0 0 1 6-6h44a6 6 0 0 1 6 6v11a5 5 0 0 1-5 5h-9"/><path d="M16 36h32v20H16zM22 44h19M22 49h14"/><circle cx="50" cy="31" r="1.8" class="sv-doc-art-accent"/>',
 camera:'<path d="M9 19h12l5-6h13l5 6h11v31H9z"/><circle cx="32" cy="34" r="10"/><path d="m47 23 4 0" class="sv-doc-art-accent"/>',
 pages:'<path d="M16 10h27l9 9v31H16zM43 10v10h9M9 18v36h33"/><path d="M24 29h18M24 37h14" class="sv-doc-art-accent"/>',
 pdf:'<path d="M16 8h28l11 11v39H16zM44 8v12h11M23 30h24M23 38h18"/><path d="m23 49 7 5 13-12" class="sv-doc-art-accent"/>',
 finger:'<path d="M17 43c3-4 5-7 8-6V18a4 4 0 0 1 8 0v15a4 4 0 0 1 8-1l1 3c5-2 9 4 7 10l-5 13H25Z"/><path d="M16 29c0-11 5-17 13-17" class="sv-doc-art-accent"/>',
 folder:'<path d="M8 17h19l6 7h23v27H8z"/><path d="M8 29h48M24 38h17" class="sv-doc-art-accent"/>',
 export:'<path d="M16 24v29h34V24M33 7v31M23 17l10-10 10 10" class="sv-doc-art-accent"/>',
 check:'<path d="M14 32l12 12 24-25" class="sv-doc-art-accent"/><circle cx="32" cy="32" r="25"/>'
});
/* Small, consistent iOS-style line icons for the five document actions.
   Full-feature editor illustrations elsewhere retain their existing art. */
// Shared glyphs are supplied by seyveo-document-icons.js.
function toolArt(kind){
 const wrap=$('span','sv-doc-tool-icon');
 wrap.setAttribute('aria-hidden','true');
 wrap.innerHTML=window.SEYVEO_DOCUMENT_ICONS?.markup(kind)||'';
 return wrap;
}
function art(kind,small=false){
 const node=$('span','sv-doc-art'+(small?' sv-doc-art-small':''));
 node.setAttribute('aria-hidden','true');
 const paths=PICTOGRAMS[kind]||PICTOGRAMS.file;
 node.innerHTML='<svg viewBox="0 0 64 64" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'+
  '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.7">'+paths+'</g></svg>';
 return node;
}
function pictorialSteps(steps){
 const group=$('div','sv-doc-tool-steps');
 group.setAttribute('aria-label','Как это работает');
 steps.forEach(([kind,title],index)=>{
  if(index)group.append($('span','sv-doc-tool-step-arrow','›'));
  const step=$('div','sv-doc-tool-step');
  step.append(art(kind,true),$('small','',title));
  group.append(step);
 });
 return group;
}
let scans=[],mode='',temporaryUrls=[],generation=0,operationEpoch=0,importBusy=false,selectedScan=0,activeStudio=null,activeHandoff=null;
function cleanUrls(){
 for(const url of temporaryUrls)URL.revokeObjectURL(url);
 temporaryUrls=[];
}
function reset(){
 generation++;operationEpoch++;importBusy=false;activeStudio=null;activeHandoff=null;
 cleanUrls();scans=[];mode='';selectedScan=0;
}
const fromBase64=data=>{
 const b64=data.split(',')[1];
 if(!b64)throw Error('Не удалось обработать изображение');
 const raw=atob(b64),out=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
 return out;
};
function imageOf(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};
  image.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Невозможно прочитать фото'));};
  image.src=url;
 });
}
function canvasOf(image,maxWidth=1600){
 const scale=Math.min(1,maxWidth/Math.max(image.naturalWidth,image.naturalHeight));
 const w=Math.max(1,Math.round(image.naturalWidth*scale));
 const h=Math.max(1,Math.round(image.naturalHeight*scale));
 const canvas=$('canvas');
 canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Canvas недоступен');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
 ctx.drawImage(image,0,0,w,h);
 return canvas;
}
function jpegOf(canvas){
 return {width:canvas.width,height:canvas.height,
  jpegBytes:fromBase64(canvas.toDataURL('image/jpeg',0.86))};
}
function asFile(blob,name){
 return new File([blob],name,{type:blob.type,lastModified:Date.now()});
}
function save(blob,name){
 const url=URL.createObjectURL(blob),a=$('a');
 a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();
 // Safari needs the blob URL to outlive the current click.
 window.setTimeout(()=>URL.revokeObjectURL(url),20000);
}
/**
 * On iPhone, native Share exposes "Save to Files"; desktop keeps a direct
 * download. This is a user-initiated export, never an automatic upload.
 * navigator.share() must be invoked in the original tap activation.
 */
function shareExport(blob,name){
 try{
  if(typeof navigator!=='undefined'&&
     typeof navigator.canShare==='function'&&
     typeof navigator.share==='function'){
   const file=asFile(blob,name),data={files:[file],title:name};
   if(navigator.canShare(data)){
    return navigator.share(data).then(()=> 'shared',error=>
     error?.name==='AbortError'?'cancelled':'failed');
   }
  }
 }catch{}
 save(blob,name);
 return Promise.resolve('download');
}
function shareMessage(status,format){
 if(status==='shared')return format+' передан в системное меню. Сохранение зависит от выбранного приложения.';
 if(status==='cancelled')return 'Действие отменено. Исходный файл не изменён.';
 if(status==='download')return format+' подготовлен для загрузки. Проверьте файлы браузера.';
 return 'Системное меню недоступно. Воспользуйтесь обычным сохранением файла.';
}
function textPdf(text){
 if(typeof text!=='string'||!text.trim())throw Error('Введите текст');
 const lines=[],measure=$('canvas').getContext('2d');
 if(!measure)throw Error('Canvas недоступен');
 measure.font='28px Arial,sans-serif';
 const pageWidth=900,pageHeight=1273,margin=70;
 const usable=pageWidth-2*margin;
 for(const raw of text.slice(0,12000).split(/\r?\n/)){
  if(!raw.trim()){lines.push('');continue;}
  let line='';
  for(const word of raw.trim().split(/\s+/)){
   const candidate=line?line+' '+word:word;
   if(measure.measureText(candidate).width<=usable){line=candidate;continue;}
   if(line){lines.push(line);line='';}
   // Long identifiers and words must fit the printable width as well.
   for(const ch of word){
    if(line&&measure.measureText(line+ch).width>usable){lines.push(line);line='';}
    line+=ch;
   }
  }
  if(line)lines.push(line);
 }
 const pages=[];
 while(lines.length){
  if(pages.length>=12)throw Error('Слишком много страниц');
  const canvas=$('canvas');
  canvas.width=pageWidth;canvas.height=pageHeight;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas недоступен');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,pageWidth,pageHeight);
  ctx.fillStyle='#172027';ctx.font='28px Arial,sans-serif';
  let y=100;
  // Enforce the printable width again at drawing time: the font metrics
  // on a rendering canvas can differ from those of the measurement canvas.
  for(const line of lines.splice(0,31)){ctx.fillText(line,margin,y,usable);y+=36;}
  pages.push(jpegOf(canvas));
 }
 return window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(pages);
}
function labelRow(title,note){
 const node=$('div','sv-doc-tool-lead');
 node.append($('strong','',title),$('small','',note));return node;
}
function controls(...actions){
 const row=$('div','sv-doc-tool-controls');row.append(...actions);return row;
}
function mount(target,{
 area='personal',getCurrentFile=()=>null,onPick=()=>{},onImport=()=>{},
 onSayvi=()=>{}
}={}){
 if(!target)return false;
 const editor=$('section','sv-doc-tools');
 editor.append($('h2','sv-doc-tools-heading','Быстрые действия'));
 // Three primary document actions; contextual actions live with the document.
 const grid=$('div','sv-doc-tool-grid');
 const scan=button('Сканер',()=>open('scan'),'sv-doc-tool-scan');
 scan.dataset.action='scan';
 scan.setAttribute('aria-label','Сканировать документ: сфотографировать страницы и сохранить PDF');
 scan.append(toolArt('scan'));grid.append(scan);
 const items=[
  ['Добавить','file',()=>onPick()],
  ['Создать','create',()=>open('create')]
 ];
 for(const [label,key,action] of items){
  const control=button(label,action,'sv-doc-tool-'+key);
  control.dataset.action=key;control.append(toolArt(key));grid.append(control);
 }
 const panel=$('section','sv-doc-tool-panel');panel.hidden=true;
 panel.id='svDocToolPanel';
 panel.setAttribute('aria-label','Инструменты документов');
 const draftSection=$('section','sv-doc-drafts');draftSection.hidden=true;
 const scannerSheet=$('dialog','sv-doc-scanner-sheet');
 scannerSheet.setAttribute('aria-labelledby','sv-doc-scanner-title');
 const scannerHead=$('header','sv-doc-scanner-head');
 const grip=$('div','sv-doc-picker-grip');grip.setAttribute('aria-hidden','true');
 const scannerBack=button('',requestWorkspaceBack,'sv-doc-scanner-round');
 scannerBack.setAttribute('aria-label','Назад');scannerBack.append(toolArt('back'));scannerBack.autofocus=true;
 const scannerTitle=$('strong','','Сканер');scannerTitle.id='sv-doc-scanner-title';
 scannerHead.append(grip,scannerBack,scannerTitle);
 scannerSheet.append(scannerHead);
 const exitSheet=$('dialog','sv-doc-scanner-exit');
 exitSheet.setAttribute('aria-label','Несохранённый скан');
 const exitTitle=$('strong','','Сохранить скан?');
 const exitNote=$('p','','Страницы ещё не сохранены в PDF.');
 const exitSave=button('Сохранить PDF',()=>{exitSheet.close();if(mode!=='scan')open('scan');panel.querySelector('.sv-doc-scan-save')?.click();},'sv-doc-scanner-exit-save');
 const exitContinue=button('Продолжить редактирование',()=>exitSheet.close(),'sv-doc-scanner-exit-continue');
 const exitDiscard=button('Выйти без сохранения',()=>{exitSheet.close();scans=[];selectedScan=0;closePanel();},'sv-doc-scanner-exit-discard');
 exitSheet.append(exitTitle,exitNote,exitSave,exitContinue,exitDiscard);scannerSheet.append(exitSheet);
 let scanSaving=false;
 function requestScanExit(){
  if(scanSaving){message('Сохранение PDF…');return;}
  if(importBusy){message('Дождитесь обработки фотографий.');return;}
  if(!scans.length){closePanel();return;}
  if(!exitSheet.open)exitSheet.showModal();
 }
 let createLeaving=false;
 async function requestCreateExit(){
  if(createLeaving)return;
  createLeaving=true;scannerBack.disabled=true;
  try{
   await persistDraft();
   if(mode!=='create'||!panel.isConnected)return;
   if(saveFailed){message(draftError);return;}
   closePanel();newDraft();
  }finally{createLeaving=false;scannerBack.disabled=false;}
 }
 function requestWorkspaceBack(){
  if(mode==='create'){void requestCreateExit();return;}
  if(mode==='sign'||mode==='print')open('scan');else requestScanExit();
 }
 scannerSheet.addEventListener('cancel',e=>{if(e.target!==scannerSheet)return;e.preventDefault();requestWorkspaceBack();});
 window.SEYVEO_SHEET_NAVIGATION?.attach(scannerHead,null,requestWorkspaceBack);
 editor.append(grid,panel,draftSection,scannerSheet);target.append(editor);
 // Primary toolbar and contextual document actions open the existing panels.
 for(const action of grid.querySelectorAll('button[data-action]:not([data-action="file"])')){
  action.setAttribute('aria-pressed','false');
  action.setAttribute('aria-expanded','false');
  action.setAttribute('aria-controls','svDocToolPanel');
 }
 let currentPrint=null,documentDraft='',documentFormat='pdf',documentTemplate='',documentName='',fromScan=false,wordStyle={size:12,alignment:'left',heading:false};
 const drafts=window.SEYVEO_DOCUMENT_DRAFTS;
 let draftId=null,draftRefresh=0,saveSeq=0,saveFailed=false,savePending=false,latestSave=Promise.resolve(),savedSignature='',draftEdited=false;
 const draftFeedback=$('p','sv-doc-draft-feedback');draftFeedback.setAttribute('role','status');
 editor.append(draftFeedback);const savedNotice=$('p','sv-doc-scan-saved-notice');savedNotice.setAttribute('role','status');editor.append(savedNotice);
 const draftError='Черновик не сохранён. Не закрывайте приложение.';
 function setDraftFeedback(value){
  draftFeedback.textContent=value;
  const indicator=panel.querySelector('.sv-doc-draft-indicator');
  if(indicator)indicator.textContent=value;
 }
 function newDraft(){
  draftId=null;documentDraft='';documentFormat='pdf';documentTemplate='';documentName='';fromScan=false;wordStyle={size:12,alignment:'left',heading:false};savedSignature='';draftEdited=false;
 }
 function persistDraft(){
  // A new draft requires an explicit user edit or an intentional scan import.
  if(!draftId&&!draftEdited)return Promise.resolve();
  if(!draftId&&!documentDraft.trim()&&!documentName.trim())return Promise.resolve();
  if(!drafts){saveFailed=true;setDraftFeedback(draftError);return Promise.resolve();}
  if(!draftId)draftId=drafts.id();
  const value={id:draftId,text:documentDraft,name:documentName,format:documentFormat,template:documentTemplate,fromScan,edited:true,style:{...wordStyle}};
  const sig=JSON.stringify(value);
  if(sig===savedSignature&&!saveFailed)return latestSave;
  savedSignature=sig;
  const seq=++saveSeq;savePending=true;setDraftFeedback('Сохранение черновика…');
  latestSave=drafts.save(area,{...value,updatedAt:Date.now()}).then(()=>{
   if(seq===saveSeq){savePending=false;saveFailed=false;setDraftFeedback('');}
   if(!panel.querySelector('dialog[open]'))void refreshDrafts();
  },()=>{
   if(seq===saveSeq){savePending=false;saveFailed=true;setDraftFeedback(draftError);}
  });
  return latestSave;
 }
 async function refreshDrafts(){
  const seq=++draftRefresh;
  if(!drafts)return;
  let items;
  try{items=await drafts.list(area);}catch{if(seq===draftRefresh){draftSection.hidden=false;draftSection.replaceChildren($('p','sv-doc-draft-feedback','Не удалось открыть черновики.'));}return;}
  if(seq!==draftRefresh||!editor.isConnected)return;
  const wasOpen=Boolean(draftSection.querySelector('details[open]'));
  draftSection.hidden=!items.length;draftSection.replaceChildren();
  if(!items.length)return;
  const details=$('details','sv-doc-draft-list');details.open=wasOpen;
  const summary=$('summary','sv-doc-draft-summary');
  summary.append(toolArt('create'),$('strong','','Черновики'),$('span','sv-doc-draft-count',String(items.length)));details.append(summary);
  for(const item of items){
   const row=$('div','sv-doc-draft-row');
   const title=item.name?.trim()||String(item.text||'').trim().split('\n')[0].slice(0,70)||'Документ';
   const launch=button('',async()=>{
    await persistDraft();if(saveFailed||!editor.isConnected)return;
    if(draftId===item.id&&mode==='create'){panel.querySelector('.sv-doc-edit-resume')?.click();return;}
    newDraft();draftId=item.id;documentDraft=String(item.text||'').slice(0,12000);
    documentName=String(item.name||'').slice(0,100);documentFormat=item.format==='docx'?'docx':'pdf';
    documentTemplate=String(item.template||'');fromScan=item.fromScan===true;
    wordStyle={size:[10,11,12,14,16,18].includes(item.style?.size)?item.style.size:12,alignment:['left','center','right','both'].includes(item.style?.alignment)?item.style.alignment:'left',heading:item.style?.heading===true};
    mode='create';panel.dataset.mode=mode;panel.hidden=false;render();syncToolSelection();
    panel.querySelector('.sv-doc-edit-resume')?.click();
   },'sv-doc-draft-open');
   const copy=$('span','sv-doc-draft-copy');
   copy.append($('span','sv-doc-draft-title',title),$('small','',new Date(item.updatedAt).toLocaleDateString('ru-RU')));
   launch.append(toolArt('create'),copy);
   const more=button('',()=>toggleActions(!row.classList.contains('sv-doc-draft-revealed')),'sv-doc-draft-more');
   more.setAttribute('aria-label','Действия с черновиком '+title);
   more.setAttribute('aria-expanded','false');
   more.innerHTML=window.SEYVEO_DOCUMENT_ICONS?.markup('more')||'';
   const erase=button('Удалить',async()=>{
    if(!window.confirm('Удалить этот черновик?'))return;
    try{await drafts.remove(area,item.id);if(draftId===item.id){newDraft();if(mode==='create')render();}await refreshDrafts();}
    catch{setDraftFeedback('Не удалось удалить черновик.');}
   },'sv-doc-draft-delete');
   erase.setAttribute('aria-label','Удалить черновик '+title);
   erase.textContent='';erase.append(toolArt('delete'),$('span','','Удалить'));
   const actions=$('div','sv-doc-draft-actions sv-menu-surface');actions.hidden=true;
   actions.append(erase);
   function toggleActions(open){
    if(open)for(const other of details.querySelectorAll('.sv-doc-draft-row.sv-doc-draft-revealed')){
     if(other===row)continue;
     other.classList.remove('sv-doc-draft-revealed');
     other.querySelector('.sv-doc-draft-actions').hidden=true;
     other.querySelector('.sv-doc-draft-more').setAttribute('aria-expanded','false');
    }
    row.classList.toggle('sv-doc-draft-revealed',open);
    actions.hidden=!open;more.setAttribute('aria-expanded',String(open));
   }
   let start=null,suppressClickUntil=0;
   row.addEventListener('touchstart',e=>{const t=e.touches[0];start=t?{x:t.clientX,y:t.clientY}:null;},{passive:true});
   row.addEventListener('touchend',e=>{
    const t=e.changedTouches[0];
    if(start&&t&&Math.abs(t.clientY-start.y)<45&&Math.abs(t.clientX-start.x)>45){
     toggleActions(start.x>t.clientX);suppressClickUntil=Date.now()+400;
    }
    start=null;
   },{passive:true});
   row.addEventListener('click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}else if(!actions.contains(e.target)&&!more.contains(e.target)&&row.classList.contains('sv-doc-draft-revealed')){e.preventDefault();e.stopImmediatePropagation();toggleActions(false);}},true);
   row.addEventListener('contextmenu',e=>{e.preventDefault();toggleActions(true);});
   row.addEventListener('keydown',e=>{if(e.key==='Escape'){toggleActions(false);more.focus();}});
   row.append(launch,more,actions);details.append(row);
  }
  draftSection.append(details);
 }
 // The containing Documents screen attaches this slot just after mount.
 requestAnimationFrame(()=>void refreshDrafts());
 const clear=()=>{
  const sheet=panel.querySelector('dialog.sv-doc-edit-sheet[open]');
  if(sheet)sheet.close();
  panel.replaceChildren();cleanUrls();
 };
 const status=(text)=>{
  const node=$('p','sv-doc-tool-status',text);node.setAttribute('role','status');
  return node;
 };
 const heading=(title,detail)=>{
  const bar=$('div','sv-doc-tool-head');
  bar.append(labelRow(title,detail));
  return bar;
 };
 const syncToolSelection=()=>{
  grid.querySelectorAll('button[data-action]:not([data-action="file"])').forEach(action=>{
   const selected=!panel.hidden&&(mode===action.dataset.action||action.dataset.action==='scan'&&['sign','print'].includes(mode));
   action.setAttribute('aria-pressed',String(selected));
   action.setAttribute('aria-expanded',String(selected));
   if(action.dataset.action==='scan'){
    action.setAttribute('aria-label',selected?
     'Свернуть сканер':'Сканировать документ: сфотографировать страницы и сохранить PDF');
   }
  });
 };
 const closePanel=()=>{
  operationEpoch++;importBusy=false;panel.hidden=true;
  delete panel.dataset.mode;delete panel.dataset.hasScans;
  mode='';clear();if(exitSheet.open)exitSheet.close();if(scannerSheet.open)scannerSheet.close();editor.insertBefore(panel,draftSection);syncToolSelection();
 };
 const warn=(text)=>$('p','sv-doc-tool-warning',text);
 const message=(text)=>{
  const target=panel.querySelector('dialog.sv-doc-edit-sheet[open] .sv-doc-tool-status')||panel.querySelector(':scope > .sv-doc-tool-status');
  if(target)target.textContent=text;
 };
 function open(name){
  if(scanSaving)return;
  if(mode===name&&!panel.hidden){requestWorkspaceBack();return;}
  if(name==='scan')savedNotice.textContent='';
  if(mode!==name){operationEpoch++;importBusy=false;}
  mode=name;panel.dataset.mode=name;panel.hidden=false;
  delete panel.dataset.hasScans;
  render();syncToolSelection();
 }
 function render(){
  clear();if(!mode)return;
  const separate=['scan','sign','print','create'].includes(mode);
  if(separate){
   scannerSheet.classList.toggle('sv-doc-create-sheet',mode==='create');
   scannerTitle.textContent=mode==='create'?'Создать документ':mode==='sign'?'Подпись':mode==='print'?'Печать':'Сканер';
   scannerSheet.insertBefore(panel,exitSheet);
  }else{
   if(exitSheet.open)exitSheet.close();if(scannerSheet.open)scannerSheet.close();
   editor.insertBefore(panel,draftSection);
  }
  // Open the parent first: an imported Word/PDF may immediately open its own editor dialog.
  if(separate&&scannerSheet.isConnected&&!scannerSheet.open)scannerSheet.showModal();
  if(mode==='scan')renderScan();
  if(mode==='create')renderCreate();
  if(mode==='sign')renderSign();
  if(mode==='print')renderPrint();
  if(separate)panel.scrollTop=0;
 }
 async function ingest(list){
  const files=Array.from(list||[]);
  if(!files.length)return;
  if(importBusy){message('Предыдущие фотографии ещё обрабатываются.');return;}
  if(files.length+scans.length>12){message('Максимум 12 страниц.');return;}
  for(const f of files){
   if(!/^image\/(jpeg|png|webp)$/i.test(f.type)||f.size>12*1024*1024||
      f.size<1){message('Выберите JPEG, PNG или WebP до 12 МБ.');return;}
  }
  const generationAtStart=generation,epoch=operationEpoch;
  importBusy=true;
  try{
   const processed=[];
   for(const file of files){
    const image=await imageOf(file);
    // If a person left Docs, switched roles, or changed the open
    // tool while camera/library was loading, discard the result.
    if(generationAtStart!==generation||epoch!==operationEpoch||
       mode!=='scan')return;
    processed.push(jpegOf(canvasOf(image)));
   }
   if(generationAtStart!==generation||epoch!==operationEpoch)return;
   const firstNew=scans.length;
   scans.push(...processed);selectedScan=firstNew;renderScan();
   message('Добавлено страниц: '+scans.length+'. Можно собрать настоящий PDF.');
  }catch{
   if(generationAtStart===generation&&epoch===operationEpoch)
    message('Не удалось обработать фото. Попробуйте другой файл.');
  }finally{
   if(generationAtStart===generation&&epoch===operationEpoch)
    importBusy=false;
  }
 }
 async function rotatePage(index){
  const page=scans[index],at=generation,epoch=operationEpoch;
  if(!page)return;
  try{
   const image=await imageOf(new Blob([page.jpegBytes],{type:'image/jpeg'}));
   if(at!==generation||epoch!==operationEpoch||mode!=='scan'||
      scans[index]!==page)return;
   const canvas=$('canvas');
   canvas.width=page.height;canvas.height=page.width;
   const ctx=canvas.getContext('2d');
   if(!ctx)throw Error('Нет обработки изображения');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.translate(canvas.width,0);ctx.rotate(Math.PI/2);
   ctx.drawImage(image,0,0,page.width,page.height);
   scans[index]=jpegOf(canvas);selectedScan=index;renderScan();
   message('Страница '+(index+1)+' повёрнута на 90°.');
  }catch{
   if(at===generation&&epoch===operationEpoch)
    message('Не удалось повернуть страницу.');
  }
 }
 function movePage(index,offset){
  const next=index+offset;
  if(index<0||next<0||next>=scans.length)return;
  const [page]=scans.splice(index,1);
  scans.splice(next,0,page);
  if(selectedScan===index)selectedScan=next;
  else if(selectedScan===next)selectedScan=index;
  renderScan();message('Изменён порядок страниц.');
 }
 function scannerStage(){
  const stage=$('div','sv-doc-scan-stage');
  stage.setAttribute('aria-label',scans.length?'Предпросмотр отсканированной страницы':'Пример расположения листа для сканирования');
  const board=$('div','sv-doc-scan-board');
  const guide=$('div','sv-doc-scan-guide');
  const sheet=$('div','sv-doc-scan-sheet');
  if(scans.length){
   selectedScan=Math.min(Math.max(0,selectedScan),scans.length-1);
   const url=URL.createObjectURL(new Blob(
    [scans[selectedScan].jpegBytes],{type:'image/jpeg'}
   ));
   temporaryUrls.push(url);
   const image=$('img','sv-doc-scan-sheet-image');
   image.src=url;image.alt='Страница '+(selectedScan+1)+' из '+scans.length;
   sheet.append(image);
  }else{
   const sample=$('div','sv-doc-scan-sheet-sample');
   sample.append($('span','sv-doc-scan-sheet-stamp','SEYVEO'));
   for(const width of ['long','long','medium','long','short']){
    sample.append($('span','sv-doc-scan-faux-line sv-doc-scan-line-'+width));
   }
   sample.append($('span','sv-doc-scan-faux-sign'));
   sheet.append(sample);
  }
  guide.append(sheet);
  for(const position of ['tl','tr','bl','br']){
   const corner=$('span','sv-doc-scan-corner sv-doc-scan-corner-'+position);
   corner.setAttribute('aria-hidden','true');guide.append(corner);
  }
  board.append(guide);
  const footer=$('div','sv-doc-scan-stage-meta');
  footer.append($('span','',scans.length?'Страница '+(selectedScan+1)+' из '+scans.length:'Пример листа'));
  stage.append(board,footer);
  return stage;
 }
 let ocrEnginePromise=null;
 function getOcrEngine(){
  if(window.Tesseract?.createWorker)return Promise.resolve(window.Tesseract);
  if(ocrEnginePromise)return ocrEnginePromise;
  ocrEnginePromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
   script.async=true;script.crossOrigin='anonymous';
   const timer=setTimeout(()=>reject(Error('Не удалось загрузить распознавание вовремя.')),25000);
   script.onload=()=>{clearTimeout(timer);window.Tesseract?.createWorker?resolve(window.Tesseract):reject(Error('OCR недоступен.'));};
   script.onerror=()=>{clearTimeout(timer);reject(Error('Нет связи с библиотекой распознавания.'));};
   document.head.append(script);
  }).catch(error=>{ocrEnginePromise=null;throw error;});
  return ocrEnginePromise;
 }
 async function recognizeScanText(page,output,action){
  if(!page||action.disabled)return;
  if(!window.Tesseract?.createWorker&&!window.confirm(
   'Для распознавания потребуется скачать движок и языковые модели из интернета. Фото обрабатывается на этом устройстве. Продолжить?'))return;
  const startEpoch=operationEpoch, startGeneration=generation;
  action.disabled=true;output.hidden=false;output.value='Подготавливаю распознавание…';
  let worker;
  try{
   const tesseract=await getOcrEngine();
   if(startEpoch!==operationEpoch||startGeneration!==generation||!scans.includes(page))return;
   worker=await tesseract.createWorker(['rus','eng'],1);
   if(startEpoch!==operationEpoch||startGeneration!==generation||!scans.includes(page))return;
   const image=new Blob([page.jpegBytes],{type:'image/jpeg'});
   const result=await worker.recognize(image);
   if(startEpoch!==operationEpoch||startGeneration!==generation||!scans.includes(page))return;
   const value=String(result?.data?.text||'').trim();
   output.value=value||'Текст не найден. Попробуйте более чёткое фото.';
   message(value?'Текст распознан. Проверьте ошибки перед использованием.':'Текст на странице не обнаружен.');
  }catch(error){
   if(startEpoch===operationEpoch&&startGeneration===generation)
    output.value=(error?.message||'Не удалось распознать текст.');
  }finally{
   if(worker)try{await worker.terminate();}catch{}
   action.disabled=false;
  }
 }
 function renderScan(){
  clear();
  panel.dataset.hasScans=String(scans.length>0);
  if(!scans.length){const empty=$('div','sv-doc-scanner-empty');empty.append(toolArt('scan'),$('strong','','Добавьте страницы'),$('small','','Сделайте фото или выберите изображения'));panel.append(empty);}
  if(scans.length)panel.append(scannerStage());
  const camera=$('input');camera.type='file';camera.accept='image/*';
  camera.setAttribute('capture','environment');camera.hidden=true;
  const library=$('input');library.type='file';library.accept='image/jpeg,image/png,image/webp';
  library.multiple=true;library.hidden=true;
  camera.addEventListener('change',()=>{void ingest(camera.files);camera.value='';});
  library.addEventListener('change',()=>{void ingest(library.files);library.value='';});
  const capture=button('Камера',()=>camera.click(),'sv-doc-tool-primary sv-doc-scan-source');
  capture.prepend(toolArt('camera'));
  const gallery=button('Из галереи',()=>library.click(),'sv-doc-scan-source');
  gallery.prepend(toolArt('gallery'));
  panel.append(camera,library,controls(capture,gallery));
  const counter=$('div','sv-doc-tool-pages');
  if(scans.length){
   const index=selectedScan;
   if(scans.length>1){
    const thumbs=$('div','sv-doc-tool-thumbs sv-doc-scan-compact-thumbs');
    scans.forEach((page,i)=>{
     const url=URL.createObjectURL(new Blob([page.jpegBytes],{type:'image/jpeg'}));temporaryUrls.push(url);
     const img=$('img');img.src=url;img.alt='Страница '+(i+1);
     const select=button('',()=>{selectedScan=i;renderScan();},'sv-doc-tool-thumb-select');
     select.setAttribute('aria-label','Просмотреть страницу '+(i+1));select.setAttribute('aria-pressed',String(i===index));
     select.append(img);thumbs.append(select);
    });
    counter.append(thumbs);
   }
   const pageActions=$('div','sv-doc-tool-thumb-actions sv-doc-scan-page-actions');
   const pageAction=(label,kind,fn)=>{
    const n=button('',fn);n.setAttribute('aria-label',label);n.title=label;n.append(toolArt(kind));return n;
   };
   const rotate=pageAction('Повернуть страницу','undo',()=>{void rotatePage(index);});
   rotate.querySelector('.sv-doc-tool-icon').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4v6h-6M20 10a8 8 0 1 0-1.5 7.5"/></svg>';
   pageActions.append(rotate);
   if(scans.length>1){
    const before=pageAction('Переместить страницу назад','back',()=>movePage(index,-1));before.disabled=index===0;
    const after=pageAction('Переместить страницу вперёд','back',()=>movePage(index,1));after.classList.add('sv-doc-scan-forward');after.disabled=index===scans.length-1;
    pageActions.append(before,after);
   }
   pageActions.append(pageAction('Удалить страницу','delete',()=>{
    if(!window.confirm('Удалить страницу '+(index+1)+'?'))return;
    scans.splice(index,1);selectedScan=Math.min(index,Math.max(0,scans.length-1));renderScan();
   }));
   counter.append(pageActions);
   const savePdf=button('Сохранить PDF',async()=>{
    if(savePdf.disabled||scanSaving||importBusy)return;savePdf.disabled=true;scanSaving=true;
    const at=generation,epoch=operationEpoch,pages=scans.slice();panel.inert=true;scannerBack.disabled=true;
    try{
     const name='Скан '+new Date().toLocaleDateString('ru-RU')+' '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}).replace(':','-')+'.pdf';
     const file=asFile(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(pages),name);
     await window.SEYVEO_DOCUMENT_FILES.save(area,file,'scan');
     if(at===generation&&epoch===operationEpoch&&mode==='scan'&&panel.isConnected){scans=[];selectedScan=0;closePanel();const note=editor.querySelector('.sv-doc-scan-saved-notice');if(note)note.textContent='PDF сохранён в папке «Сканы».';}
    }catch(e){if(at===generation&&epoch===operationEpoch)message(e.message||'Не удалось сохранить PDF.');}
    finally{scanSaving=false;panel.inert=false;scannerBack.disabled=false;savePdf.disabled=false;}
   },'sv-doc-tool-primary sv-doc-scan-save');
   const more=$('details','sv-doc-scan-more');
   const summary=$('summary','sv-doc-scan-more-toggle');summary.append(toolArt('more'));summary.setAttribute('aria-label','Ещё действия со сканом');more.append(summary);
   const menu=$('div','sv-doc-scan-more-menu');
   const add=(label,kind,fn)=>{
    const n=button(label,()=>{more.open=false;fn();},'sv-doc-scan-menu-action');n.prepend(toolArt(kind));menu.append(n);
   };
   add('Подписать скан','sign',()=>open('sign'));
   add('Посмотреть PDF','original',()=>{
    try{
     const url=URL.createObjectURL(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans));temporaryUrls.push(url);
     const link=$('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';document.body.append(link);link.click();link.remove();
    }catch{message('Не удалось открыть предпросмотр PDF.');}
   });
   add('Печать','print',()=>open('print'));
   add('Поделиться','share',()=>{
    try{void shareExport(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans),'SEYVEO-скан.pdf').then(result=>message(shareMessage(result,'PDF')));}
    catch{message('Не удалось подготовить PDF.');}
   });
   add('В защищённый архив','archive',()=>{
    try{onImport(asFile(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans),'SEYVEO-скан.pdf'));}
    catch{message('Не удалось передать PDF в архив.');}
   });
   add('Очистить страницы','delete',()=>{
    if(window.confirm('Удалить все страницы текущего скана?')){scans=[];selectedScan=0;renderScan();}
   });
   more.append(menu);
   const finish=$('div','sv-doc-scan-finish');finish.append(savePdf,more);counter.append(finish);
  }
  if(scans.length)panel.append(counter);
  panel.append(status(''));
 }
 function renderCreate(){
  // The workspace header already names this screen; avoid a duplicate title.

  // Editable starting forms, not jurisdiction-verified legal documents.
  const templates=area==='business'?[
  {
    "id": "services",
    "name": "Услуги",
    "icon": "contract",
    "content": "ДОГОВОР ОКАЗАНИЯ УСЛУГ\n\nДата, место, номер: __________\nЗаказчик: [реквизиты, представитель и основание полномочий]\nИсполнитель: [реквизиты, представитель и основание полномочий]\n\n1. Услуги и ожидаемый результат: __________\n2. Сроки и этапы: __________\n3. Цена, валюта, налоги и порядок оплаты: __________\n4. Порядок сдачи, приёмки и исправления недостатков: __________\n5. Обязанности сторон и конфиденциальность: __________\n6. Ответственность и прекращение: __________\n7. Применимое право и споры: __________\nПриложения: __________\n\nРеквизиты и подписи: __________"
  },
  {
    "id": "supply",
    "name": "Поставка",
    "icon": "contract",
    "content": "ДОГОВОР ПОСТАВКИ\n\nДата и номер: __________\nПоставщик: [реквизиты и полномочия]\nПокупатель: [реквизиты и полномочия]\n\nТовар, количество, ассортимент и качество: __________\nЦена, налоги, валюта и оплата: __________\nМесто, сроки и условия поставки: __________\nПорядок передачи, приёмки и предъявления претензий: __________\nГарантии и ответственность: __________\nИзменение, прекращение и разрешение споров: __________\nСпецификация: __________\n\nРеквизиты и подписи: __________"
  },
  {
    "id": "work-act",
    "name": "Акт работ",
    "icon": "act",
    "content": "АКТ ВЫПОЛНЕННЫХ РАБОТ / ОКАЗАННЫХ УСЛУГ\n\nДата и номер: __________\nЗаказчик: __________\nИсполнитель: __________\nДоговор / заказ: __________\nПериод исполнения: __________\n\nПеречень работ или услуг, объём: __________\nСтоимость, валюта, налоги: __________\nРезультат приёмки, замечания и сроки устранения: __________\n\nРеквизиты, должности и подписи уполномоченных лиц: __________"
  },
  {
    "id": "invoice",
    "name": "Счёт",
    "icon": "receipt",
    "content": "СЧЁТ НА ОПЛАТУ\n\nНомер и дата: __________\nПродавец / исполнитель: [название, реквизиты]\nПокупатель / заказчик: [название, реквизиты]\nОснование: __________\n\nНаименование | количество | цена | сумма\n____________________________________\nНалоги (если применимо): __________\nИтого и валюта: __________\nСрок оплаты: __________\nБанковские реквизиты: __________\nНазначение платежа: __________\n\nОтветственное лицо: __________"
  },
  {
    "id": "offer",
    "name": "Коммерческое предложение",
    "icon": "statement",
    "content": "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ\n\nКому: __________\nОт компании: __________\n\nЗадача клиента: __________\nПредлагаемое решение: __________\nСостав работ или товаров: __________\nСтоимость, валюта и условия оплаты: __________\nСроки реализации: __________\nСрок действия предложения: __________\nКонтакт для согласования: __________"
  },
  {
    "id": "nda",
    "name": "Конфиденциальность",
    "icon": "contract",
    "content": "СОГЛАШЕНИЕ О КОНФИДЕНЦИАЛЬНОСТИ\n\nДата и стороны: __________\nЦель обмена информацией: __________\n\nКакие сведения являются конфиденциальными: __________\nДопустимые цели использования: __________\nИсключения и разрешённые получатели: __________\nМеры защиты и порядок уведомления об утечке: __________\nСрок обязательств, возврат и уничтожение данных: __________\nОтветственность и применимое право: __________\n\nПодписи сторон: __________"
  },
  {
    "id": "order",
    "name": "Приказ",
    "icon": "statement",
    "content": "ПРИКАЗ\n\nОрганизация: __________\nНомер, дата, место: __________\nТема: __________\nОснование: __________\n\nПРИКАЗЫВАЮ:\n1. [действие, ответственный, срок].\n2. [следующее поручение].\n3. [порядок контроля исполнения].\n\nРуководитель: [должность, ФИО, подпись]\nОзнакомлены: __________"
  },
  {
    "id": "addendum",
    "name": "Доп. соглашение",
    "icon": "contract",
    "content": "ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ\n\nНомер, дата, место: __________\nК договору: [номер и дата]\nСтороны и представители: __________\n\n1. Изменяемые положения договора: __________\n2. Новая редакция / дополнительные условия: __________\n3. Дата вступления изменений в силу: __________\n4. Положения договора, остающиеся без изменений: __________\n\nРеквизиты и подписи: __________"
  },
  {
    "id": "minutes",
    "name": "Протокол",
    "icon": "act",
    "content": "ПРОТОКОЛ СОВЕЩАНИЯ\n\nОрганизация, дата, место: __________\nУчастники: __________\nПредседатель / ведущий: __________\nПовестка: __________\n\nОбсуждение: __________\nПринятые решения: __________\nОтветственные и сроки: __________\nДата следующей проверки: __________\n\nПодписи при необходимости: __________"
  },
  {
    "id": "letter",
    "name": "Деловое письмо",
    "icon": "statement",
    "content": "ДЕЛОВОЕ ПИСЬМО\n\nОтправитель: [организация, контакты]\nПолучатель: [организация, должность, ФИО]\nДата и исходящий номер: __________\nТема: __________\n\nУважаемый(ая) __________!\n\n[Суть обращения, обстоятельства и предложение.]\n[Ожидаемый ответ и срок.]\n\nПриложения: __________\nС уважением,\n[должность, ФИО, подпись, контакты]"
  }
]:[
  {
    "id": "statement",
    "name": "Заявление",
    "icon": "statement",
    "content": "ЗАЯВЛЕНИЕ\n\nКому: [организация, должность, ФИО]\nОт кого: [ФИО, контакты]\n\nПрошу: [суть обращения].\nОбстоятельства и основания: [описание].\nПриложения: [перечень, если есть].\n\nДата: __________\nПодпись: __________"
  },
  {
    "id": "lease",
    "name": "Аренда",
    "icon": "contract",
    "content": "ДОГОВОР АРЕНДЫ\n\nМесто и дата: __________\nАрендодатель: [данные стороны]\nАрендатор: [данные стороны]\n\n1. Объект аренды: [адрес, описание, состояние].\n2. Срок аренды: [начало и окончание].\n3. Плата: [сумма, валюта, сроки и способ оплаты].\n4. Обеспечительный платёж и расходы: [условия].\n5. Передача, использование, ремонт и возврат объекта: [условия].\n6. Изменение и прекращение договора: [условия].\n7. Применимое право и разрешение споров: [согласовать].\n\nРеквизиты и подписи сторон: __________"
  },
  {
    "id": "sale",
    "name": "Купля-продажа",
    "icon": "contract",
    "content": "ДОГОВОР КУПЛИ-ПРОДАЖИ\n\nДата и место: __________\nПродавец: [данные]\nПокупатель: [данные]\n\n1. Предмет продажи: [описание, идентификаторы, состояние].\n2. Цена и валюта: __________\n3. Порядок и срок оплаты: __________\n4. Передача имущества и документов: __________\n5. Известные недостатки и ограничения: __________\n6. Ответственность, возврат и разрешение споров: __________\n\nРеквизиты и подписи сторон: __________"
  },
  {
    "id": "receipt",
    "name": "Расписка",
    "icon": "receipt",
    "content": "РАСПИСКА\n\nМесто и дата: __________\nЯ, [ФИО и идентифицирующие данные получателя], получил(а) от [ФИО и данные передающей стороны] следующее:\n[сумма цифрами и прописью, валюта / описание имущества].\nОснование передачи: __________\nУсловия возврата или исполнения, если применимо: __________\nДополнительные условия: __________\n\nПодпись получателя и расшифровка: __________"
  },
  {
    "id": "power",
    "name": "Доверенность",
    "icon": "statement",
    "content": "ДОВЕРЕННОСТЬ\n\nМесто и дата выдачи: __________\nДоверитель: [ФИО, данные]\nПредставитель: [ФИО, данные]\n\nПолномочия представителя: [точный перечень действий, организации, ограничения].\nСрок действия: __________\nПередоверие: [условия, если допустимо].\nДополнительные условия: __________\n\nПодпись доверителя: __________\nУдостоверение: [если требуется применимым законодательством]."
  },
  {
    "id": "act",
    "name": "Акт передачи",
    "icon": "act",
    "content": "АКТ ПРИЁМА-ПЕРЕДАЧИ\n\nМесто и дата: __________\nПередающая сторона: __________\nПринимающая сторона: __________\nОснование передачи: __________\n\nПредмет, количество, комплектность: __________\nСостояние и обнаруженные недостатки: __________\nПереданные документы и принадлежности: __________\nЗамечания сторон: __________\n\nПодписи сторон: __________"
  },
  {
    "id": "claim",
    "name": "Претензия",
    "icon": "statement",
    "content": "ПРЕТЕНЗИЯ\n\nКому: [адресат]\nОт кого: [ФИО и контакты]\n\nОбстоятельства: [даты, договор, товар или услуга].\nНарушение: [описание].\nТребование: [желаемый результат].\nСрок и способ ответа: __________\nПриложения: [подтверждающие материалы].\n\nДата и подпись: __________"
  },
  {
    "id": "agreement",
    "name": "Соглашение",
    "icon": "contract",
    "content": "СОГЛАШЕНИЕ\n\nМесто и дата: __________\nСторона 1: __________\nСторона 2: __________\n\nПредмет соглашения: __________\nОбязательства каждой стороны: __________\nСроки, расходы и порядок исполнения: __________\nИзменение и прекращение: __________\nПрименимое право и разрешение споров: __________\n\nПодписи сторон: __________"
  }
];
  templates.push(...(area==='business'?[{"id":"employment","name":"Трудовой договор","icon":"contract","content":"ТРУДОВОЙ ДОГОВОР — ПРОЕКТ\n\nРаботодатель и работник: __________\n\nМесто и трудовая функция: __________\n\nДата начала и срок: __________\n\nОплата и режим работы: __________\n\nОтпуск и гарантии: __________\n\nУсловия труда: __________\n\nПрекращение и обязательные условия по местному праву: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"contractor","name":"Подряд","icon":"contract","content":"ДОГОВОР ПОДРЯДА\n\nСтороны: __________\n\nРаботы и результат: __________\n\nМатериалы и оборудование: __________\n\nСроки: __________\n\nЦена и оплата: __________\n\nПриёмка, недостатки и гарантии: __________\n\nОтветственность и споры: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"office-lease","name":"Аренда офиса","icon":"contract","content":"ДОГОВОР АРЕНДЫ ПОМЕЩЕНИЯ\n\nСтороны и полномочия: __________\n\nАдрес и характеристики: __________\n\nНазначение и срок: __________\n\nПлата и расходы: __________\n\nОбеспечение: __________\n\nРемонт, передача и возврат: __________\n\nПрекращение: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"agency","name":"Агентский договор","icon":"contract","content":"АГЕНТСКИЙ ДОГОВОР\n\nСтороны: __________\n\nПоручение и полномочия: __________\n\nТерритория и срок: __________\n\nВознаграждение и расходы: __________\n\nОтчётность: __________\n\nПрекращение и ответственность: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"loan-business","name":"Заём","icon":"contract","content":"ДОГОВОР ЗАЙМА\n\nСтороны и реквизиты: __________\n\nСумма и валюта: __________\n\nПорядок выдачи: __________\n\nПроценты: __________\n\nСрок и график возврата: __________\n\nОбеспечение: __________\n\nОтветственность: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"spec","name":"Спецификация","icon":"act","content":"СПЕЦИФИКАЦИЯ К ДОГОВОРУ\n\nНомер договора: __________\n\nСтороны: __________\n\nПозиции, количество, единицы, цена: __________\n\nКачество и комплектация: __________\n\nСрок и место поставки: __________\n\nИтого и налоги: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"delivery","name":"Накладная","icon":"act","content":"ВЕДОМОСТЬ ПЕРЕДАЧИ ТОВАРА — ПРОЕКТ\n\nДата и номер: __________\n\nОтправитель и получатель: __________\n\nОснование: __________\n\nТовары, количество, единицы, цена: __________\n\nИтого: __________\n\nОтветственные за передачу и приёмку: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"reconciliation","name":"Акт сверки","icon":"act","content":"АКТ СВЕРКИ ВЗАИМОРАСЧЁТОВ\n\nСтороны: __________\n\nПериод: __________\n\nНачальное сальдо: __________\n\nОперации и документы: __________\n\nОплаты: __________\n\nКонечное сальдо: __________\n\nРасхождения: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"estimate","name":"Смета","icon":"receipt","content":"СМЕТА\n\nЗаказчик и проект: __________\n\nРаботы и материалы: __________\n\nКоличество, ставки и суммы: __________\n\nДополнительные расходы: __________\n\nИтого, налоги и валюта: __________\n\nСрок действия: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"purchase-order","name":"Заказ","icon":"statement","content":"ЗАКАЗ НА ПОСТАВКУ\n\nЗаказчик и поставщик: __________\n\nНомер и дата: __________\n\nПозиции и количество: __________\n\nЦена и валюта: __________\n\nДоставка: __________\n\nОплата: __________\n\nОтветственные: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"claim-business","name":"Претензия","icon":"statement","content":"ДЕЛОВАЯ ПРЕТЕНЗИЯ\n\nСтороны: __________\n\nДоговор и обстоятельства: __________\n\nНарушение: __________\n\nРасчёт требований: __________\n\nТребование и срок ответа: __________\n\nПриложения: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"termination","name":"Расторжение","icon":"contract","content":"СОГЛАШЕНИЕ О РАСТОРЖЕНИИ ДОГОВОРА\n\nСтороны: __________\n\nДоговор: __________\n\nДата прекращения: __________\n\nРасчёты и возврат имущества: __________\n\nОставшиеся обязательства: __________\n\nСпоры: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"job-description","name":"Инструкция","icon":"statement","content":"ДОЛЖНОСТНАЯ ИНСТРУКЦИЯ\n\nОрганизация и должность: __________\n\nПодчинённость: __________\n\nТребования: __________\n\nФункции: __________\n\nПрава: __________\n\nОтветственность: __________\n\nОзнакомление: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"service-note","name":"Служебная","icon":"statement","content":"СЛУЖЕБНАЯ ЗАПИСКА\n\nАдресат: __________\n\nАвтор: __________\n\nТема: __________\n\nОбстоятельства: __________\n\nПредложение: __________\n\nСрок и приложения: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"expense","name":"Авансовый отчёт","icon":"receipt","content":"ПОДГОТОВКА АВАНСОВОГО ОТЧЁТА\n\nОрганизация и сотрудник: __________\n\nОснование и период: __________\n\nПолученный аванс: __________\n\nРасходы и подтверждающие документы: __________\n\nОстаток или перерасход: __________\n\nПроверка бухгалтерией: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"trip","name":"Командировка","icon":"statement","content":"ПРОЕКТ РАСПОРЯЖЕНИЯ О КОМАНДИРОВКЕ\n\nОрганизация: __________\n\nСотрудник: __________\n\nМесто, даты и цель: __________\n\nТранспорт и расходы: __________\n\nОтчётность: __________\n\nОтветственные: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"inventory-business","name":"Инвентаризация","icon":"act","content":"ИНВЕНТАРИЗАЦИОННАЯ ВЕДОМОСТЬ — ПРОЕКТ\n\nОрганизация и место: __________\n\nДата и основание: __________\n\nКомиссия: __________\n\nПозиции, учётное и фактическое количество: __________\n\nРасхождения: __________\n\nЗамечания: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"privacy","name":"Персональные данные","icon":"statement","content":"ПРОЕКТ СОГЛАСИЯ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ\n\nСубъект и оператор: __________\n\nЦели: __________\n\nКатегории данных: __________\n\nДействия и получатели: __________\n\nСрок хранения: __________\n\nОтзыв: __________\n\nТребования местного права: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"tax-usn-prep","name":"Декларация УСН","icon":"receipt","content":"ПОДГОТОВКА К ДЕКЛАРАЦИИ УСН РФ — НЕ ОФИЦИАЛЬНЫЙ БЛАНК\n\nОтчётный год: __________\n\nНалогоплательщик и ИНН: __________\n\nОбъект налогообложения: __________\n\nДоходы и расходы по периодам: __________\n\nАвансы и допустимые уменьшения: __________\n\nПодтверждения: __________\n\nАктуальная форма ФНС — проверить: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"tax-vat-prep","name":"Декларация НДС","icon":"receipt","content":"ПОДГОТОВКА К ДЕКЛАРАЦИИ НДС — НЕ ОФИЦИАЛЬНЫЙ БЛАНК\n\nСтрана и отчётный период: __________\n\nНалогоплательщик: __________\n\nОперации и налоговые базы: __________\n\nСтавки и начисления: __________\n\nВходной налог и основания вычетов: __________\n\nРегистры и подтверждения: __________\n\nОфициальный формат — проверить: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"tax-profit-prep","name":"Налог на прибыль","icon":"receipt","content":"ПОДГОТОВКА К ДЕКЛАРАЦИИ НАЛОГА НА ПРИБЫЛЬ — НЕ ОФИЦИАЛЬНЫЙ БЛАНК\n\nСтрана и период: __________\n\nНалогоплательщик: __________\n\nДоходы: __________\n\nРасходы и корректировки: __________\n\nЛьготы и убытки: __________\n\nАвансы: __________\n\nОфициальная форма — проверить: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"customs-business-prep","name":"Таможенная","icon":"receipt","content":"ПОДГОТОВКА СВЕДЕНИЙ О ТОВАРАХ ДЛЯ ТАМОЖЕННОЙ ДЕКЛАРАЦИИ — НЕ ОФИЦИАЛЬНЫЙ БЛАНК\n\nЮрисдикция и процедура: __________\n\nДекларант: __________\n\nОтправитель и получатель: __________\n\nТовары и классификация: __________\n\nСтоимость, валюта, происхождение: __________\n\nПеревозка и документы: __________\n\nРазрешения: __________\n\nОфициальная форма — проверить: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"official-usn","name":"УСН · ФНС","icon":"receipt","url":"https://www.nalog.gov.ru/rn77/taxation/taxes/usn/"},{"id":"official-vat","name":"НДС · ФНС","icon":"receipt","url":"https://www.nalog.gov.ru/rn77/TAXATION/TAXES/NDS/"},{"id":"official-armenia-business","name":"Отчётность · РА","icon":"receipt","url":"https://src.am/ru/getMenusContents/111"}]:[{"id":"loan","name":"Заём","icon":"contract","content":"ДОГОВОР ЗАЙМА\n\nСтороны и данные: __________\n\nСумма и валюта: __________\n\nДата передачи: __________\n\nПроценты или их отсутствие: __________\n\nГрафик возврата: __________\n\nДосрочный возврат: __________\n\nОтветственность и споры: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"gift","name":"Дарение","icon":"contract","content":"ДОГОВОР ДАРЕНИЯ\n\nДаритель: __________\n\nОдаряемый: __________\n\nПредмет и права на него: __________\n\nБезвозмездность: __________\n\nПорядок передачи: __________\n\nУсловия и ограничения: __________\n\nПрименимое право: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"car-sale","name":"Продажа авто","icon":"contract","content":"ДОГОВОР КУПЛИ-ПРОДАЖИ АВТОМОБИЛЯ\n\nПродавец и покупатель: __________\n\nМарка, модель, VIN, год: __________\n\nРегистрационные документы: __________\n\nЦена и оплата: __________\n\nСостояние и ограничения: __________\n\nДата и порядок передачи: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"rent-act","name":"Акт аренды","icon":"act","content":"АКТ ПЕРЕДАЧИ АРЕНДОВАННОГО ИМУЩЕСТВА\n\nСтороны и договор: __________\n\nАдрес или объект: __________\n\nСостояние и дефекты: __________\n\nКомплектность, ключи: __________\n\nПоказания счётчиков: __________\n\nЗамечания: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"refund","name":"Возврат","icon":"statement","content":"ЗАЯВЛЕНИЕ О ВОЗВРАТЕ\n\nАдресат и заявитель: __________\n\nТовар или услуга: __________\n\nДата и сумма оплаты: __________\n\nПричина и требование: __________\n\nСпособ возврата: __________\n\nПодтверждающие документы: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"complaint","name":"Жалоба","icon":"statement","content":"ЖАЛОБА\n\nАдресат и заявитель: __________\n\nОбжалуемое действие: __________\n\nДаты и обстоятельства: __________\n\nОснования: __________\n\nПросьба: __________\n\nПриложения: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"petition","name":"Ходатайство","icon":"statement","content":"ХОДАТАЙСТВО\n\nОрган и заявитель: __________\n\nДело или обращение: __________\n\nПросьба: __________\n\nОбоснование: __________\n\nДоказательства: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"consent","name":"Согласие","icon":"statement","content":"ПИСЬМЕННОЕ СОГЛАСИЕ\n\nЛицо, дающее согласие: __________\n\nПолучатель: __________\n\nПредмет, объём и цель: __________\n\nСрок: __________\n\nУсловия и порядок отзыва: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"explanation","name":"Объяснительная","icon":"statement","content":"ОБЪЯСНИТЕЛЬНАЯ ЗАПИСКА\n\nАдресат: __________\n\nАвтор: __________\n\nДата события: __________\n\nОбстоятельства: __________\n\nПричины: __________\n\nПриложения: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"resume","name":"Резюме","icon":"statement","content":"РЕЗЮМЕ\n\nФИО и контакты: __________\n\nЖелаемая должность: __________\n\nОпыт работы: __________\n\nОбразование: __________\n\nНавыки: __________\n\nЯзыки: __________\n\nДополнительная информация: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"employment-request","name":"Приём на работу","icon":"statement","content":"ЗАЯВЛЕНИЕ О ПРИЁМЕ НА РАБОТУ\n\nРаботодатель: __________\n\nЗаявитель: __________\n\nДолжность: __________\n\nПредполагаемая дата начала: __________\n\nУсловия для согласования: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"leave-request","name":"Отпуск","icon":"statement","content":"ЗАЯВЛЕНИЕ НА ОТПУСК\n\nРаботодатель: __________\n\nРаботник и должность: __________\n\nВид отпуска: __________\n\nДаты и продолжительность: __________\n\nОснование при необходимости: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"resignation","name":"Увольнение","icon":"statement","content":"ЗАЯВЛЕНИЕ О ПРЕКРАЩЕНИИ ТРУДОВЫХ ОТНОШЕНИЙ\n\nРаботодатель: __________\n\nРаботник и должность: __________\n\nПросьба и основание: __________\n\nЖелаемая дата: __________\n\nКонтакты: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"inventory","name":"Опись","icon":"act","content":"ОПИСЬ ИМУЩЕСТВА\n\nВладелец: __________\n\nЦель составления: __________\n\nМесто хранения: __________\n\nПредметы, количество, состояние и стоимость: __________\n\nПриложения: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"income-prep","name":"Декларация доходов","icon":"receipt","content":"ПОДГОТОВКА СВЕДЕНИЙ ДЛЯ ДЕКЛАРАЦИИ ДОХОДОВ — НЕ ОФИЦИАЛЬНЫЙ БЛАНК\n\nСтрана и налоговое резидентство: __________\n\nОтчётный год: __________\n\nНалогоплательщик: __________\n\nИсточники дохода и суммы с валютой: __________\n\nУдержанные налоги: __________\n\nВычеты и подтверждения: __________\n\nОфициальная форма и способ подачи — проверить: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"customs-prep","name":"Таможенная","icon":"receipt","content":"ПОДГОТОВКА К ТАМОЖЕННОМУ ДЕКЛАРИРОВАНИЮ — НЕ ОФИЦИАЛЬНЫЙ БЛАНК\n\nСтрана и направление поездки: __________\n\nДата и маршрут: __________\n\nДекларант: __________\n\nТовары, количество, стоимость и валюта: __________\n\nНаличные и иные декларируемые предметы: __________\n\nРазрешения и подтверждения: __________\n\nАктуальная официальная форма — проверить: __________\n\nДата: __________\nПодпись / подписи: __________"},{"id":"official-3ndfl","name":"3-НДФЛ · РФ","icon":"receipt","url":"https://www.nalog.gov.ru/rn77/taxation/taxes/ndfl/form_ndfl/"},{"id":"official-armenia","name":"Доходы · РА","icon":"receipt","url":"https://www.src.am/en/physical"}]));

  const sectionTitle=$('div','sv-doc-create-subhead');
  let switchingDraft=false;
  async function beginNew(content='',template='',format='pdf'){
   if(switchingDraft)return;switchingDraft=true;
   try{await persistDraft();if(saveFailed||!panel.isConnected||mode!=='create')return;newDraft();
   body.value=content;documentDraft=content;documentTemplate=template;documentFormat=format==='docx'?'docx':'pdf';filename.value='';
   size.value='12';alignment.value='left';firstLine.setAttribute('aria-pressed','false');headingCheck.hidden=true;
   refreshStyle();syncFormat();syncTemplate();lastWordText=body.value;wordHistory.length=0;
   revealEditor();
   }finally{switchingDraft=false;}
  }
  const officialForms=[
   {id:'official-3ndfl',name:'3-НДФЛ',country:'RU',type:'personal',url:'https://www.nalog.gov.ru/rn77/taxation/taxes/ndfl/form_ndfl/',period:'year'},
   {id:'official-armenia',name:'Декларация доходов',country:'AM',type:'personal',url:'https://src.am/ru/getMenusContents/122',period:'year'},
   {id:'official-customs',name:'Пассажирская декларация',country:'RU',type:'personal',url:'https://domodedovo.customs.gov.ru/ved/pravila-peremeshheniya-tovarov/elektronnyj-blank-passazhirskoj-tamozhennoj-deklaraczii',period:'date'},
   {id:'official-usn',name:'Декларация УСН',country:'RU',type:'business',url:'https://www.nalog.gov.ru/rn77/taxation/taxes/usn/',period:'year'},
   {id:'official-vat',name:'Декларация НДС',country:'RU',type:'business',url:'https://www.nalog.gov.ru/rn77/taxation/taxes/nds/',period:'quarter'},
   {id:'official-profit',name:'Налог на прибыль',country:'RU',type:'business',url:'https://www.nalog.gov.ru/rn77/taxation/taxes/profitul/',period:'report'},
   {id:'official-armenia-business',name:'Налоговая отчётность',country:'AM',type:'business',url:'https://www.src.am/ru/legal',period:'report'}
  ];
  const official=officialForms.filter(x=>x.type===area),countryNames={RU:'Россия',AM:'Армения'};
  const countryKey='seyveo.documents.country.'+area;
  function preferredCountry(){
   try{const stored=localStorage.getItem(countryKey);if(countryNames[stored])return stored;}catch{}
   try{const region=new Intl.Locale(navigator.language).region;const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
    if(region==='RU'&&/^(Europe\/(Moscow|Samara|Volgograd|Kirov|Kaliningrad|Astrakhan|Saratov|Ulyanovsk)|Asia\/(Yekaterinburg|Omsk|Novosibirsk|Krasnoyarsk|Irkutsk|Yakutsk|Vladivostok|Magadan|Kamchatka|Sakhalin|Anadyr|Barnaul|Tomsk|Chita|Srednekolymsk))$/.test(zone))return 'RU';
    if(region==='AM'&&zone==='Asia/Yerevan')return 'AM';
   }catch{}
   return '';
  }
  for(let i=templates.length-1;i>=0;i--)if(templates[i].url)templates.splice(i,1);
  templates.push(...official.sort((a,b)=>Number(b.country===preferredCountry())-Number(a.country===preferredCountry())).map(x=>({...x,icon:'receipt',name:x.name+' · '+(x.country==='RU'?'РФ':'РА')})));
  function openOfficial(selected){
   const pickers=window.SEYVEO_DOCUMENT_PICKERS;
   const dlg=$('dialog','sv-doc-official-dialog');
   const header=$('div','sv-doc-official-header');
   const close=pickers.backButton(()=>dlg.close());close.classList.add('sv-doc-official-back');
   header.append(close,$('strong','','Официальная форма'));
   const country=pickers.choice('Страна документа',[...new Set(official.map(x=>x.country))].map(c=>[c,countryNames[c]]),selected.country);
   const form=pickers.choice('Вид документа',[]);
   const periodSlot=$('div','sv-doc-official-period-slot');
   let period=null;
   const info=$('small','sv-doc-official-note','Актуальность бланка проверяйте на сайте ведомства.');
   const source=$('a','sv-doc-official-source','Официальный источник');source.target='_blank';source.rel='noopener noreferrer';
   const label=(name,node)=>{const l=$('div','sv-doc-official-field');l.append($('span','',name),node);return l;};
   function current(){return official.find(x=>x.id===form.value);}
   function syncPeriod(){const item=current();if(!item)return;period=pickers.period(item.period==='date'?'Дата пересечения границы':'Отчётный период',item.period,area);periodSlot.replaceChildren(period);source.href=item.url;info.textContent='Актуальность бланка проверяйте на сайте ведомства.';}
   function syncForms(preferred){form.setChoices(official.filter(x=>x.country===country.value).map(x=>[x.id,x.name]),preferred);syncPeriod();}
   country.addEventListener('change',()=>{try{localStorage.setItem(countryKey,country.value)}catch{}syncForms('');});form.addEventListener('change',syncPeriod);syncForms(selected.id);
   const help=button('',async()=>{
    const item=current();if(!item||!period?.value.trim()){info.textContent='Выберите период документа.';period?.focus();return;}
    try{localStorage.setItem(countryKey,item.country)}catch{}
    help.disabled=true;
    const ok=await onSayvi('official-form',{name:item.name,country:countryNames[item.country],period:period.value.trim(),url:item.url});
    if(ok===false){info.textContent='Не удалось открыть Сэйви. Официальный источник остаётся доступен.';help.disabled=false;}
   },'sv-doc-official-help');
   const mark=$('span','sv-doc-official-ai-mark sv-sayvi-symbol');mark.setAttribute('aria-hidden','true');help.append(mark,$('span','','Заполнить с Сэйви'));
   dlg.append(header,label('Страна',country),label('Документ',form),label('Период',periodSlot),source,help,info);
   dlg.addEventListener('close',()=>dlg.remove(),{once:true});panel.append(dlg);dlg.showModal();
  }
  const blank=button('Чистый лист',()=>beginNew(),'sv-doc-create-blank');
  sectionTitle.append($('strong','','Шаблоны'),blank);
  const examples=$('div','sv-doc-tool-templates');
  examples.setAttribute('role','region');
  examples.setAttribute('aria-label','Шаблоны документов, листайте горизонтально');
  examples.tabIndex=0;
  examples.title='Редактируемые образцы. Проверяйте требования законодательства вашей страны.';
  const body=$('textarea','sv-doc-edit-body');
  body.rows=6;body.maxLength=12000;
  body.value=documentDraft;
  body.placeholder='Ваш текст документа…';
  body.setAttribute('aria-label','Текст создаваемого документа');
  const cards=[];

  function selectTemplate(id,content){beginNew(content,id);}
  function syncTemplate(){
   cards.forEach(({id,button})=>
    button.setAttribute('aria-pressed',String(documentTemplate===id)));
  }
  const library=()=>window.SEYVEO_DOCUMENT_FILES;
  function templateDialog(title,{librarySheet=false}={}){
   const dlg=$('dialog','sv-doc-my-templates');
   const head=$('header','sv-doc-my-template-head');
   const close=button('',()=>dlg.close(),'sv-doc-my-template-back');close.setAttribute('aria-label','Назад');close.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m14 5-7 7 7 7"/></svg>';
   head.append(close,$('strong','',title));dlg.append(head);
   if(librarySheet){
    dlg.classList.add('sv-doc-library-sheet');
    const grip=$('div','sv-doc-library-grip');grip.setAttribute('aria-hidden','true');head.prepend(grip);
    window.SEYVEO_SHEET_NAVIGATION?.attach(head,null,()=>close.click());
   }
   const content=$('div','sv-doc-my-template-content');dlg.append(content);
   const parent=panel.querySelector('dialog.sv-doc-edit-sheet[open]')||panel;
   parent.append(dlg);dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.showModal();
   return {dlg,content};
  }
  async function rememberTemplate(value,feedback){
   try{const result=await library().saveTemplate(area,value);feedback.textContent=result.duplicate?'Уже в моих шаблонах':'Сохранено в «Мои шаблоны»';return true;}
   catch(e){feedback.textContent=e.message||'Не удалось сохранить шаблон';return false;}
  }
  function saveTemplateDialog(value){
   const {dlg,content}=templateDialog('Сохранить шаблон');
   const name=$('input','sv-doc-my-template-input');name.value=value.name;name.maxLength=100;name.placeholder='Название шаблона';name.setAttribute('aria-label','Название шаблона');
   const feedback=$('small','sv-doc-my-template-note',value.officialId?'Сохраняется ссылка на форму, а не бланк за конкретный год.':'Проверьте, что в образце нет ненужных личных данных.');
   const save=button('Сохранить',async()=>{save.disabled=true;if(await rememberTemplate({...value,name:name.value},feedback)){save.textContent='Сохранено';setTimeout(()=>{if(dlg.open)dlg.close();},650);}else save.disabled=false;},'sv-doc-my-template-primary');
   content.append(name,save,feedback);
  }
  function templateActions(item){
   const {dlg,content}=templateDialog(item.name);
   const info=$('small','sv-doc-my-template-note');
   content.append(button('Сохранить в мои шаблоны',async()=>{const result=await rememberTemplate({name:item.name,text:item.content||'',officialId:item.url?item.id:'',format:'pdf'},info);if(result)setTimeout(()=>{if(dlg.open)dlg.close();},650);},'sv-doc-my-template-primary'),
    button('Открыть документ',()=>{dlg.close();if(item.url)openOfficial(item);else selectTemplate(item.id,item.content);},'sv-doc-my-template-option'),
    button('Поделиться',async()=>{try{const text=item.url||item.content;if(navigator.share)await navigator.share({title:item.name,text});else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);info.textContent='Скопировано';}else info.textContent='Поделиться на этом устройстве нельзя.';}catch(e){if(e.name!=='AbortError')info.textContent='Не удалось поделиться.';}},'sv-doc-my-template-option'),info);
  }
  function bindTemplateHold(card,item){
   let timer=null,start=null,suppress=false;
   const cancel=()=>{clearTimeout(timer);timer=null;start=null;};
   const show=()=>{cancel();suppress=true;templateActions(item);};
   card.addEventListener('pointerdown',e=>{cancel();suppress=false;if(e.button!==0)return;start=[e.clientX,e.clientY];timer=setTimeout(show,500);});
   card.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start[0],e.clientY-start[1])>9)cancel();});
   for(const event of ['pointerup','pointercancel','pointerleave'])card.addEventListener(event,cancel);
   card.addEventListener('contextmenu',e=>{e.preventDefault();if(!suppress)show();});
   card.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();suppress=false;}},true);
  }
  async function openMyTemplates(){
   const {dlg,content}=templateDialog('Мои шаблоны',{librarySheet:true});
   const list=$('div','sv-doc-my-template-list'),feedback=$('small','sv-doc-my-template-note','Загрузка…');
   async function paint(){
    try{
     const items=await library().listTemplates(area);if(!dlg.isConnected)return;
     list.replaceChildren();feedback.textContent=items.length?'':'Пока пусто. Удерживайте шаблон в библиотеке или сохраните свой документ.';
     for(const item of items){
      const row=$('div','sv-doc-my-template-row');
      const open=button('',async()=>{try{const saved=await library().getTemplate(area,item.id);
       if(saved.officialId){const form=official.find(x=>x.id===saved.officialId);if(!form)throw Error('Форма больше недоступна.');dlg.close();openOfficial(form);return;}
       dlg.close();await beginNew(saved.text,'saved:'+item.id,saved.format);
      }catch(e){feedback.textContent=e.message||'Не удалось открыть шаблон';}},'sv-doc-my-template-open');
      open.append($('strong','',item.name),$('small','',item.official?'Официальная форма':'Шаблон'));
      const more=button('…',()=>{const menu=templateDialog(item.name);const input=$('input','sv-doc-my-template-input');input.value=item.name;input.maxLength=100;input.setAttribute('aria-label','Название шаблона');const note=$('small','sv-doc-my-template-note');
       menu.content.append(input,button('Переименовать',async()=>{try{await library().renameTemplate(area,item.id,input.value);menu.dlg.close();await paint();}catch(e){note.textContent=e.message;}},'sv-doc-my-template-primary'),button('Удалить шаблон',async()=>{if(!window.confirm('Удалить только этот шаблон?'))return;try{await library().removeTemplate(area,item.id);menu.dlg.close();await paint();}catch(e){note.textContent=e.message;}},'sv-doc-my-template-delete'),note);
      },'sv-doc-my-template-more');more.setAttribute('aria-label','Действия: '+item.name);
      row.append(open,more);list.append(row);
     }
    }catch(e){feedback.textContent=e.message||'Хранилище недоступно';}
   }
   content.append(list,feedback);
   const importInput=$('input','');importInput.type='file';importInput.accept='.txt,text/plain';importInput.hidden=true;
   importInput.addEventListener('change',async()=>{try{const f=importInput.files?.[0];if(!f)return;if(f.size>100000)throw Error('Текстовый шаблон слишком большой.');const value=await f.text();if(!value.trim()||value.length>12000)throw Error('До 12 000 символов.');await rememberTemplate({name:f.name.replace(/\.txt$/i,''),text:value,format:'pdf'},feedback);await paint();}catch(e){feedback.textContent=e.message;}});
   content.append(button('Добавить из файла',()=>importInput.click(),'sv-doc-my-template-option'),importInput);
   await paint();
  }
  const myCard=button('',openMyTemplates,'sv-doc-template-card sv-doc-my-template-card');
  const myGlyph=$('span','sv-doc-template-glyph');myGlyph.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M3 7V5h7l2 3h9v12H3z"/><path d="M9 11h6v6l-3-2-3 2z"/></svg>';
  myCard.append(myGlyph,$('strong','sv-doc-template-name','Мои шаблоны'));examples.append(myCard);
  for(const item of templates){
   const card=button('',()=>{if(item.url){openOfficial(item);return;}selectTemplate(item.id,item.content);},
    'sv-doc-template-card sv-doc-template-'+item.id);
   card.setAttribute('aria-label',(item.url?'Открыть официальный источник: ':'Выбрать шаблон: ')+item.name);
   if(item.url){card.title='Официальная форма · выбор периода';card.classList.add('sv-doc-template-official');}
   card.setAttribute('aria-pressed',String(documentTemplate===item.id));
   const paper=$('span','sv-doc-template-glyph');
   paper.setAttribute('aria-hidden','true');
   const motifs={
    statement:'<path d="M8 10h8M8 13h8M8 16h5" opacity=".72"/>',
    contract:'<path d="M8 10h8M8 13h8" opacity=".7"/><path d="M8 17c2-3 3 2 5 0l3-1"/>',
    act:'<path d="M8 10h8M8 13h5" opacity=".7"/><circle cx="15" cy="17" r="3" fill="currentColor" fill-opacity=".08"/><path d="m13.5 17 1 1 2-2"/>',
    receipt:'<path d="M8 10h8M8 13h5" opacity=".7"/><path d="M8 17h8M10 15.5v3" opacity=".8"/>'
   };
   const taxMotifs={
    usn:'<path d="M8 11h7M8 14h4M9 18l6-6"/><circle cx="9" cy="13" r=".7"/><circle cx="15" cy="18" r=".7"/>',
    vat:'<rect x="8" y="10" width="7" height="8" rx="1"/><path d="M9.5 13h4M10 16h.1m3 0h.1"/>',
    profit:'<path d="M8 18v-3m3 3v-5m3 5v-8M8 11l3-2 3 1"/>',
    customs:'<path d="m8 12 4-2 4 2v5l-4 2-4-2zM8 12l4 2 4-2M12 14v5"/>',
    income:'<circle cx="12" cy="12" r="2"/><path d="M8 18v-1a4 4 0 0 1 8 0v1"/>',
    report:'<path d="M8 10h8M8 13h8M8 16h8M11 10v6"/>'
   };
   const taxKind=/usn/.test(item.id)?'usn':/vat/.test(item.id)?'vat':/profit/.test(item.id)?'profit':/customs/.test(item.id)?'customs':/income|3ndfl|^official-armenia$/.test(item.id)?'income':/official-armenia-business/.test(item.id)?'report':'';
   card.title=item.url?'Официальная форма · '+item.name:item.name;
   paper.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h6l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M13 3v4a1 1 0 0 0 1 1h4" opacity=".65"/>'+(taxMotifs[taxKind]||motifs[item.icon]||motifs.statement)+'</svg>';
   card.append(paper,$('strong','sv-doc-template-name',item.name));
   bindTemplateHold(card,item);
   cards.push({id:item.id,button:card});
   examples.append(card);
  }

  const templateSearch=$('input','sv-doc-template-search');templateSearch.type='search';templateSearch.placeholder='Найти шаблон';templateSearch.setAttribute('aria-label','Поиск шаблонов документов');
  const searchWrap=$('div','sv-doc-template-search-wrap');
  const clearSearch=button('',()=>{templateSearch.value='';templateSearch.dispatchEvent(new Event('input'));templateSearch.focus();},'sv-doc-template-search-clear');
  clearSearch.setAttribute('aria-label','Очистить поиск');clearSearch.hidden=true;
  clearSearch.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
  searchWrap.append(templateSearch,clearSearch);
  const templateEmpty=$('small','sv-doc-template-empty','Ничего не найдено');templateEmpty.hidden=true;
  templateSearch.addEventListener('input',()=>{
   const query=templateSearch.value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
   myCard.hidden=Boolean(query);clearSearch.hidden=!templateSearch.value;
   let count=0;
   cards.forEach(({id,button})=>{const item=templates.find(t=>t.id===id);const match=(!query||[item.name,item.content?.split('\n')[0],item.url?'официальная декларация отчётность налоги':''].join(' ').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').includes(query));button.hidden=!match;if(match)count++;});
   examples.scrollLeft=0;templateEmpty.hidden=count>0;
  });
  body.addEventListener('input',()=>{
   if(documentDraft===body.value)return;
   draftEdited=true;documentDraft=body.value;
   documentTemplate='';syncTemplate();void persistDraft();
  });
  const editing=$('div','sv-doc-edit-content');
  const filename=$('input','sv-doc-edit-name');filename.type='text';filename.value=documentName;filename.maxLength=100;filename.setAttribute('aria-label','Название документа');filename.placeholder='Название документа';
  filename.addEventListener('input',()=>{if(documentName===filename.value)return;draftEdited=true;documentName=filename.value;void persistDraft();});
  const typography=$('div','sv-doc-edit-typography');
  typography.setAttribute('role','group');typography.setAttribute('aria-label','Форматирование Word');
  const size=$('select','sv-doc-tool-page-select');size.setAttribute('aria-label','Размер шрифта');
  for(const n of [10,11,12,14,16,18]){const item=$('option','',n+' пт');item.value=String(n);size.append(item);}
  size.value=String(wordStyle.size);
  const alignment=$('select','sv-doc-tool-page-select');alignment.setAttribute('aria-label','Выравнивание текста');
  for(const [id,label] of [['left','Слева'],['center','По центру'],['right','Справа'],['both','По ширине']]){
   const item=$('option','',label);item.value=id;alignment.append(item);
  }
  alignment.value=wordStyle.alignment;
  const typographyIcon=kind=>window.SEYVEO_DOCUMENT_ICONS?.markup(kind)||'';
  const formatMenu=$('div','sv-doc-word-menu sv-menu-surface');
  formatMenu.id='svDocWordFormatMenu';formatMenu.hidden=true;
  formatMenu.setAttribute('role','group');formatMenu.setAttribute('aria-label','Оформление текста');
  const formatTrigger=button('Aa',()=>setFormatMenu(formatMenu.hidden),'sv-doc-word-trigger');
  formatTrigger.setAttribute('aria-label','Оформление текста');
  formatTrigger.setAttribute('aria-controls',formatMenu.id);
  formatTrigger.setAttribute('aria-expanded','false');
  function setFormatMenu(open){
   formatMenu.hidden=!open;formatTrigger.setAttribute('aria-expanded',String(open));
  }
  const icon=(kind)=>{const el=$('span','sv-doc-word-menu-icon');el.setAttribute('aria-hidden','true');el.innerHTML=typographyIcon(kind);return el;};
  const rail=$('div','sv-doc-word-rail');
  rail.setAttribute('role','group');rail.setAttribute('aria-label','Инструменты Word, листайте горизонтально');
  const chevron=()=>{const node=icon('down');node.classList.add('sv-doc-word-rail-chevron');return node;};
  const sizeControl=$('label','sv-doc-word-rail-choice');
  const sizeFace=$('span','sv-doc-word-rail-size');sizeFace.setAttribute('aria-hidden','true');
  sizeControl.append(sizeFace,chevron(),size);
  const alignControl=$('label','sv-doc-word-rail-choice');
  const alignIcon=icon('');alignControl.append(alignIcon,chevron(),alignment);
  const firstLine=button('',()=>{
   draftEdited=true;wordStyle.heading=!wordStyle.heading;
   firstLine.setAttribute('aria-pressed',String(wordStyle.heading));
   headingCheck.hidden=!wordStyle.heading;
   refreshStyle();void persistDraft();
  },'sv-doc-word-menu-row sv-doc-word-menu-heading');
  firstLine.setAttribute('aria-label','Первую строку оформить жирным заголовком');
  firstLine.setAttribute('aria-pressed',String(wordStyle.heading));
  const headingCheck=icon('check');headingCheck.classList.add('sv-doc-word-menu-check');headingCheck.hidden=!wordStyle.heading;
  firstLine.append(icon('heading'),$('span','','Заголовок'),headingCheck);
  const alignKinds={left:'align-left',center:'align-center',right:'align-right',both:'align-both'};
  const alignNames={left:'Слева',center:'По центру',right:'Справа',both:'По ширине'};
  const refreshStyle=()=>{
   wordStyle.size=Number(size.value);wordStyle.alignment=alignment.value;
   body.style.fontSize=wordStyle.size+'pt';body.style.textAlign=wordStyle.alignment==='both'?'justify':wordStyle.alignment;
   sizeFace.textContent=wordStyle.size+' пт';
   alignment.title='Выравнивание: '+alignNames[wordStyle.alignment];
   sizeControl.classList.toggle('sv-doc-word-rail-active',wordStyle.size!==12);
   alignControl.classList.toggle('sv-doc-word-rail-active',wordStyle.alignment!=='left');
   alignIcon.innerHTML=typographyIcon(alignKinds[wordStyle.alignment]||alignKinds.left);
   formatTrigger.classList.toggle('sv-doc-word-modified',wordStyle.heading);
  };
  const changeStyle=()=>{if(wordStyle.size===Number(size.value)&&wordStyle.alignment===alignment.value)return;draftEdited=true;refreshStyle();void persistDraft();};
  size.addEventListener('change',changeStyle);alignment.addEventListener('change',changeStyle);refreshStyle();
  formatMenu.append(firstLine);
  const wordHistory=[];let lastWordText=body.value;
  body.addEventListener('input',()=>{
   if(body.value!==lastWordText){wordHistory.push(lastWordText);if(wordHistory.length>50)wordHistory.shift();lastWordText=body.value;}
  });
  const replaceWordText=value=>{if(documentDraft===value)return;draftEdited=true;body.value=value;documentDraft=value;lastWordText=value;documentTemplate='';syncTemplate();void persistDraft();};
  const wordTool=(label,kind,fn)=>{const control=button('',fn,'sv-doc-word-extra');control.setAttribute('aria-label',label);control.title=label;control.append(icon(kind));return control;};
  const undoTool=wordTool('Отменить ввод','undo',()=>{if(wordHistory.length)replaceWordText(wordHistory.pop());body.focus({preventScroll:true});});
  const copyTool=wordTool('Копировать текст','copy',async()=>{
   try{await navigator.clipboard.writeText(body.value.slice(body.selectionStart,body.selectionEnd)||body.value);message('Текст скопирован.');}catch{message('Не удалось скопировать текст.');}
  });
  const clearTool=wordTool('Очистить текст','clear',()=>{
   if(body.value&&window.confirm('Очистить текст документа?')){wordHistory.push(body.value);replaceWordText('');body.focus({preventScroll:true});}
  });
  async function helpWithCurrentDocument(){
   if(!body.value.trim()){sheet.close();onSayvi('create');return;}
   await persistDraft();
   if(saveFailed){message('Не удалось сохранить изменения. Повторите попытку.');return;}
   const ok=await onSayvi('edit-current',{text:body.value,title:filename.value.trim(),format:documentFormat,template:documentTemplate});
   if(ok===false)message('Не удалось передать документ Сэйви. Текст остался в редакторе.');
  }
  const sayviTool=button('',helpWithCurrentDocument,'sv-doc-word-extra');
  sayviTool.setAttribute('aria-label','Сэйви');sayviTool.append($('span','sv-doc-word-ai sv-sayvi-symbol'));
  rail.append(sizeControl,alignControl,formatTrigger,sayviTool,undoTool,copyTool,clearTool);
  rail.addEventListener('mousedown',event=>{if(event.target.closest('button'))event.preventDefault();});
  typography.append(rail,formatMenu);
  typography.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!formatMenu.hidden){event.preventDefault();event.stopPropagation();setFormatMenu(false);formatTrigger.focus();}
  });
  editing.append(filename,body);

  const formatSwitch=$('div','sv-doc-edit-formats');
  formatSwitch.setAttribute('role','group');
  formatSwitch.setAttribute('aria-label','Выбор формата документа');
  const saveButton=button('',()=>{
   const {dlg,content}=templateDialog('Сохранить');
   content.append(button('Сохранить документ',()=>{dlg.close();void saveSelected();},'sv-doc-my-template-primary'),button('Сохранить как шаблон',()=>{dlg.close();if(!body.value.trim()){message('Напишите текст документа.');return;}saveTemplateDialog({name:filename.value.trim()||body.value.split('\n').find(x=>x.trim())?.trim().slice(0,100)||'Шаблон',text:body.value,format:documentFormat});},'sv-doc-my-template-option'));
  },'sv-doc-edit-action');
  const saveLabel=$('span','','Сохранить');
  const shareButton=button('',shareSelected,'sv-doc-edit-action');
  const selectedFormat=[];
  for(const option of [
   {id:'pdf',label:'PDF',caption:'Для просмотра',art:'pdf'},
   {id:'docx',label:'Word',caption:'Для правок',art:'file'}
  ]){
   const optionButton=button('',()=>{
    if(documentFormat===option.id)return;draftEdited=true;documentFormat=option.id;syncFormat();void persistDraft();
   },'sv-doc-edit-format');
   optionButton.append($('span','',option.label));
   optionButton.setAttribute('aria-pressed',String(documentFormat===option.id));
   const formatDescription=option.id==='pdf'?'PDF · изображение текста':'Word · редактируемый DOCX';
   optionButton.setAttribute('aria-label',formatDescription);
   optionButton.title=formatDescription;
   selectedFormat.push({id:option.id,button:optionButton});
   formatSwitch.append(optionButton);
  }
  function syncFormat(){
   selectedFormat.forEach(({id,button})=>
    button.setAttribute('aria-pressed',String(id===documentFormat)));
   saveButton.setAttribute('aria-label',documentFormat==='pdf'?'Сохранить PDF':'Сохранить Word');

   const isWord=documentFormat==='docx';
   typography.dataset.word=String(isWord);
   typography.hidden=false;
   for(const control of [sizeControl,alignControl,formatTrigger])control.hidden=!isWord;
   if(!isWord)setFormatMenu(false);
   rail.scrollLeft=0;
   body.style.fontSize=documentFormat==='docx'?wordStyle.size+'pt':'';
   body.style.textAlign=documentFormat==='docx'?(wordStyle.alignment==='both'?'justify':wordStyle.alignment):'';
  }
  function safeDocumentName(){
   const first=body.value.split('\n').map(x=>x.trim()).find(Boolean)||'Документ';
   const title=documentName.trim()||first.slice(0,80);
   return title.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').trim()||'Документ';
  }
  function preparedFile(){
   if(!body.value.trim()||body.value.length>12000){
    message('Напишите текст документа.');return null;
   }
   try{
    if(documentFormat==='pdf'){
     return {blob:textPdf(body.value),name:safeDocumentName()+'.pdf',label:'PDF'};
    }
    return {blob:window.SEYVEO_DOCS_EXPORT.docxFromText(body.value,wordStyle),
     name:safeDocumentName()+'.docx',label:'Word'};
   }catch(error){
    message(error?.message||'Не удалось подготовить документ.');
    return null;
   }
  }
  async function saveSelected(){
   const ready=preparedFile();if(!ready)return;
   try{
    await window.SEYVEO_DOCUMENT_FILES.save(area,asFile(ready.blob,ready.name),'created',{text:body.value,status:'ready'});
    message('Документ сохранён в разделе «Все файлы».');
   }catch(e){message(e.message||'Не удалось сохранить документ.');}
  }
  function shareSelected(){
   const ready=preparedFile();if(!ready)return;
   void shareExport(ready.blob,ready.name).then(
    result=>message(shareMessage(result,ready.label)),
    ()=>message('Не удалось открыть системное меню.')
   );
  }
  syncFormat();
  const sheet=$('dialog','sv-doc-edit-sheet');
  sheet.setAttribute('aria-label',fromScan?'Редактор Word':'Редактор документа');
  const top=$('header','sv-doc-edit-top');
  const actionIcon=(kind)=>{
   const mark=$('span','sv-doc-edit-icon');
   mark.setAttribute('aria-hidden','true');
   mark.innerHTML=window.SEYVEO_DOCUMENT_ICONS?.markup(kind)||'';
   return mark;
  };
  const back=button('',async()=>{
   await persistDraft();
   if(saveFailed&&!window.confirm('Черновик не сохранён. Выйти из редактора?'))return;
   if(typeof sheet.close==='function')sheet.close();else sheet.removeAttribute('open');
  },'sv-doc-edit-back');
  back.setAttribute('aria-label','Назад к созданию документа');
  back.append(actionIcon('back'));
  const sayviEditor=button('',helpWithCurrentDocument,'sv-doc-edit-ai');
  sayviEditor.setAttribute('aria-label','Создать с Сэйви');
  const aiMark=$('span','sv-doc-edit-ai-mark sv-sayvi-symbol');aiMark.setAttribute('aria-hidden','true');sayviEditor.append(aiMark);
  top.append(back,$('strong','',fromScan?'Редактор Word':'Документ'),sayviEditor);
  saveButton.append(actionIcon('download'),saveLabel);
  shareButton.append(actionIcon('share'),$('span','','Поделиться'));
  const archive=button('',()=>{
   const ready=preparedFile();if(!ready)return;
   try{onImport(asFile(ready.blob,ready.name));if(sheet.open)sheet.close();}
   catch(error){message(error?.message||'Не удалось подготовить файл для архива.');}
  },'sv-doc-edit-action');
  archive.append(actionIcon('archive'),$('span','','В архив'));
  const footer=$('footer','sv-doc-edit-footer');
  const actions=$('div','sv-doc-edit-actions');actions.append(saveButton,shareButton,archive);
  const draftIndicator=$('small','sv-doc-draft-indicator');draftIndicator.setAttribute('role','status');draftIndicator.textContent=draftFeedback.textContent;
  footer.append(typography,formatSwitch,actions,status(''),draftIndicator);
  sheet.append(top,editing,footer);
  sheet.addEventListener('pointerdown',event=>{if(!typography.contains(event.target))setFormatMenu(false);});
  sheet.addEventListener('cancel',event=>{event.preventDefault();if(!formatMenu.hidden){setFormatMenu(false);formatTrigger.focus();}else back.click();});
  let restingHeight=0,viewportFrame=0,viewportTimers=[],keyboardWasOpen=false;
  function syncEditorViewport(){
   viewportFrame=0;if(!sheet.open)return;
   const v=window.visualViewport;
   const height=Math.round(v?.height||window.innerHeight);
   const top=Math.max(0,Math.round(v?.offsetTop||0));
   const active=document.activeElement;
   const focused=sheet.contains(active)&&active.matches('textarea,input,select,[contenteditable="true"]');
   const layoutHeight=Math.round(Math.max(window.innerHeight,document.documentElement.clientHeight));
   if(!restingHeight)restingHeight=Math.max(height,layoutHeight);
   if(!focused&&!keyboardWasOpen)restingHeight=Math.max(height,layoutHeight);
   const shrink=Math.max(restingHeight,layoutHeight)-height;
   const scale=v?.scale||1;
   const keyboard=scale<1.15&&shrink>=80&&(focused||keyboardWasOpen);
   keyboardWasOpen=keyboard;
   sheet.classList.toggle('sv-doc-keyboard-open',keyboard);
   if(keyboard){
    sheet.style.setProperty('--sv-doc-editor-height',height+'px');
    sheet.style.setProperty('--sv-doc-editor-top',top+'px');
   }else{
    sheet.style.removeProperty('--sv-doc-editor-height');sheet.style.removeProperty('--sv-doc-editor-top');
   }
  }
  function queueEditorViewport(){if(!viewportFrame)viewportFrame=requestAnimationFrame(syncEditorViewport);}
  function settleEditorViewport(){
   queueEditorViewport();
   viewportTimers.forEach(clearTimeout);
   viewportTimers=[80,180,350,600].map(ms=>setTimeout(queueEditorViewport,ms));
  }
  function startEditorViewport(){
   restingHeight=Math.max(window.innerHeight,document.documentElement.clientHeight,window.visualViewport?.height||0);
   keyboardWasOpen=false;
   window.visualViewport?.addEventListener('resize',queueEditorViewport);
   window.visualViewport?.addEventListener('scroll',queueEditorViewport);
   window.addEventListener('resize',queueEditorViewport);
   settleEditorViewport();
  }
  sheet.addEventListener('focusin',settleEditorViewport);sheet.addEventListener('focusout',settleEditorViewport);
  sheet.addEventListener('close',()=>{
   setFormatMenu(false);
   window.visualViewport?.removeEventListener('resize',queueEditorViewport);
   window.visualViewport?.removeEventListener('scroll',queueEditorViewport);
   window.removeEventListener('resize',queueEditorViewport);
   if(viewportFrame)cancelAnimationFrame(viewportFrame);
   viewportTimers.forEach(clearTimeout);viewportTimers=[];
   viewportFrame=0;restingHeight=0;keyboardWasOpen=false;
   sheet.classList.remove('sv-doc-keyboard-open');
   sheet.style.removeProperty('--sv-doc-editor-height');sheet.style.removeProperty('--sv-doc-editor-top');
  });
  const resume=button('Продолжить документ',()=>revealEditor(),'sv-doc-edit-resume');
  function syncResume(){
   const hasContent=Boolean(documentDraft.trim()||documentName.trim());
   resume.hidden=!(hasContent&&(draftId||draftEdited||saveFailed));
   const title=documentName.trim()||documentDraft.trim().split('\n')[0].slice(0,80)||'Документ';
   resume.replaceChildren(toolArt('create'),$('span','sv-doc-resume-copy','Продолжить: '+title));
   resume.title=title;
  }
  syncResume();
  function revealEditor(){
   rail.scrollLeft=0;
   if(!sheet.open){
    if(typeof sheet.showModal==='function')sheet.showModal();
    else sheet.setAttribute('open','');
    startEditorViewport();
   }
   back.focus({preventScroll:true});
  }
  sheet.addEventListener('close',()=>{
   if(!panel.isConnected||!sheet.isConnected)return;
   void persistDraft().then(()=>{syncResume();void refreshDrafts();});
  });
  const sayvi=button('',()=>onSayvi('create'),'sv-doc-create-sayvi');
  const sayviMark=$('span','sv-doc-create-sayvi-mark sv-sayvi-symbol');
  sayviMark.setAttribute('aria-hidden','true');
  sayvi.append(sayviMark,$('span','','Создать с Сэйви'));
  panel.dataset.createStage='choose';
  if(!fromScan){
   panel.append(sectionTitle,searchWrap,examples,templateEmpty);
  }
  panel.append(resume,sayvi,status(''),sheet);
  if(fromScan&&documentDraft.trim()&&sheet.isConnected){revealEditor();void persistDraft();}

 }
 function renderSign(){
  panel.dataset.hasScans=String(scans.length>0);
  panel.append(heading('Подпись',scans.length?
   'Выберите место и нарисуйте подпись':'Рисуйте пальцем или стилусом'));
  // The large paper is not a real document until a page is imported.
  if(scans.length){
   panel.append(pictorialSteps([['file','Страница'],['finger','Подпись'],['pdf','Копия PDF']]));
  }else{
   panel.append($('p','sv-doc-sign-empty',
    'Чтобы подписать PDF, сначала добавьте страницу через «Сканер» выше.'));
  }
  const pageIndexDefault=Math.max(0,scans.length-1);
  let placement={x:.70,y:.83};
  let pageIndex=pageIndexDefault;
  const preview=$('div','sv-doc-sign-stage');
  const pageBar=$('div','sv-doc-sign-stage-top');
  const zoom=button('Увеличить',()=>{
   const expanded=preview.dataset.expanded==='true';
   preview.dataset.expanded=String(!expanded);
   zoom.textContent=expanded?'Увеличить':'Уменьшить';
   zoom.setAttribute('aria-pressed',String(!expanded));
  },'sv-doc-sign-zoom');
  zoom.setAttribute('aria-pressed','false');
  pageBar.append($('strong','','Документ'),$('small','',
   scans.length?'Страница '+(pageIndex+1)+' из '+scans.length:'Лист-пример'));
  if(scans.length)pageBar.append(zoom);
  const pageBody=$('div','sv-doc-sign-document');
  pageBody.setAttribute('aria-label',scans.length?
   'Коснитесь документа, чтобы выбрать место подписи':'Пример документа без загруженного скана');
  const overlay=$('img','sv-doc-sign-stroke');
  overlay.alt='Предпросмотр нарисованной подписи';
  overlay.hidden=true;
  const target=$('span','sv-doc-sign-target');
  target.setAttribute('aria-hidden','true');
  const stageHint=$('small','sv-doc-sign-stage-hint',
   scans.length?'Нажмите на лист, чтобы выбрать место':'Сначала добавьте скан');
  const choosePage=$('select','sv-doc-tool-page-select');
  choosePage.setAttribute('aria-label','Страница для подписи');
  scans.forEach((_,index)=>{
   const option=$('option','','Страница '+(index+1));
   option.value=String(index);choosePage.append(option);
  });
  choosePage.value=String(pageIndexDefault);
  const pageRail=$('div','sv-doc-sign-pages');
  pageRail.setAttribute('aria-label','Выбор страницы документа');
  const pageButtons=[];
  if(scans.length){
   scans.forEach((p,index)=>{
    const url=URL.createObjectURL(new Blob([p.jpegBytes],{type:'image/jpeg'}));
    temporaryUrls.push(url);
    const thumb=button('',()=>{
     pageIndex=index;choosePage.value=String(index);
     updatePreview();
    },'sv-doc-sign-page-button');
    thumb.setAttribute('aria-label','Страница '+(index+1));
    const picture=$('img');picture.src=url;picture.alt='';
    const badge=$('small','',String(index+1));
    thumb.append(picture,badge);
    pageRail.append(thumb);pageButtons.push(thumb);
   });
  }
  const paper=$('div','sv-doc-tool-sign-paper');
  const canvas=$('canvas');
  canvas.width=720;canvas.height=225;
  canvas.setAttribute('aria-label','Поле подписи пальцем или стилусом');
  paper.append($('span','sv-doc-sign-paper-caption','Нарисуйте подпись'),canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx){panel.append(status('Подпись на этом устройстве недоступна.'));return;}
  ctx.strokeStyle='#1b2a31';ctx.lineWidth=3.5;
  ctx.lineCap='round';ctx.lineJoin='round';
  let drawing=false,marks=0,actionRow=null;
  function paintPlacement(){
   for(const element of [target,overlay]){
    element.style.left=(placement.x*100)+'%';
    element.style.top=(placement.y*100)+'%';
   }
   target.hidden=!scans.length;
   overlay.hidden=!scans.length||!marks;
   if(marks&&scans.length)overlay.src=canvas.toDataURL('image/png');
   if(actionRow)actionRow.hidden=marks===0;
  }
  function updatePreview(){
   if(!scans.length)return;
   // The actual selected scan is displayed here; the PDF exporter uses
   // precisely this selection and the chosen relative signature position.
   const file=scans[pageIndex];
   if(!file)return;
   pageBody.style.aspectRatio=file.width+' / '+file.height;
   pageBar.replaceChildren(
    $('strong','','Документ'),
    $('small','','Страница '+(pageIndex+1)+' из '+scans.length),zoom);
   pageBody.replaceChildren();
   const pageUrl=URL.createObjectURL(new Blob([file.jpegBytes],{type:'image/jpeg'}));
   temporaryUrls.push(pageUrl);
   const image=$('img','sv-doc-sign-page-image');
   image.src=pageUrl;image.alt='Просмотр страницы '+(pageIndex+1);
   pageBody.append(image,target,overlay);
   pageButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===pageIndex)));
   paintPlacement();
  }
  pageBody.addEventListener('click',event=>{
   if(!scans.length)return;
   const rect=pageBody.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   const x=(event.clientX-rect.left)/rect.width;
   const y=(event.clientY-rect.top)/rect.height;
   placement={
    x:Math.min(.80,Math.max(.20,x)),
    y:Math.min(.92,Math.max(.08,y))
   };
   paintPlacement();
  });
  choosePage.addEventListener('change',()=>{
   const next=Number(choosePage.value);
   if(Number.isSafeInteger(next)&&next>=0&&next<scans.length){
    pageIndex=next;updatePreview();
   }
  });
  if(scans.length){
   updatePreview();
   preview.append(pageBar,pageBody,stageHint,choosePage,pageRail);
   panel.append(preview);
  }
  // A real scan is previewed above; otherwise only the signature pad appears.
  panel.append(paper);
  const point=e=>{
   const bounds=canvas.getBoundingClientRect();
   if(!bounds.width||!bounds.height)return {x:0,y:0};
   return{x:(e.clientX-bounds.left)*canvas.width/bounds.width,
    y:(e.clientY-bounds.top)*canvas.height/bounds.height};
  };
  canvas.addEventListener('pointerdown',e=>{
   e.preventDefault();drawing=true;
   canvas.setPointerCapture?.(e.pointerId);
   const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);
   ctx.lineTo(p.x+.1,p.y+.1);ctx.stroke();marks++;
   paintPlacement();
  });
  canvas.addEventListener('pointermove',e=>{
   if(!drawing)return;e.preventDefault();
   const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();
  });
  const stop=()=>{
   if(drawing){drawing=false;paintPlacement();}
  };
  canvas.addEventListener('pointerup',stop);
  canvas.addEventListener('pointercancel',stop);
  const clearButton=button('Очистить',()=>{
   ctx.clearRect(0,0,canvas.width,canvas.height);marks=0;
   paintPlacement();
  });
  const pngButton=button('Сохранить PNG',()=>{
   if(!marks){message('Сначала нарисуйте подпись.');return;}
   canvas.toBlob(blob=>{
    if(blob)save(blob,'SEYVEO-рукописная-подпись.png');
    else message('Не удалось сохранить подпись.');
   },'image/png');
  });
  const onScan=button('Подписать копию PDF',async()=>{
   const generationAtStart=generation,epoch=operationEpoch;
   if(!marks||!scans.length){
    message('Сначала сделайте скан и нарисуйте подпись.');return;
   }
   try{
    // Read directly from the accessible selector too, to ensure its value
    // stays authoritative for assistive technology and programmatic input.
    const index=Number(choosePage.value);
    if(!Number.isSafeInteger(index)||index<0||index>=scans.length){
     message('Выберите страницу для подписи.');return;
    }
    const selectedPage=scans[index];
    const image=await imageOf(new Blob([selectedPage.jpegBytes],{type:'image/jpeg'}));
    if(generationAtStart!==generation||epoch!==operationEpoch||
       scans[index]!==selectedPage||mode!=='sign')return;
    const dest=canvasOf(image,1600),g=dest.getContext('2d');
    const width=dest.width*.4;
    const height=width*canvas.height/canvas.width;
    // Same document-relative placement as the on-screen preview;
    // prevent spilling the handwritten mark outside the page.
    const left=Math.max(0,Math.min(dest.width-width,
     placement.x*dest.width-width/2));
    const top=Math.max(0,Math.min(dest.height-height,
     placement.y*dest.height-height/2));
    g.drawImage(canvas,left,top,width,height);
    const updated=scans.slice();updated[index]=jpegOf(dest);
    save(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(updated),
     'SEYVEO-скан-с-подписью.pdf');
    message('Сохранена отдельная копия: страница '+(index+1)+'. Это не КЭП.');
   }catch{message('Не удалось создать копию с подписью.');}
  });
  const actions=controls(...(scans.length?
   [onScan,pngButton,clearButton]:[pngButton,clearButton]));
  onScan.className+=' sv-doc-tool-primary';
  actionRow=actions;
  actionRow.hidden=marks===0;
  panel.append(actions);
  const info=$('details','sv-doc-tool-help');
  info.append($('summary','','О подписи'),
   warn('Рукописная отметка не является КЭП. Для официальной электронной подписи нужно подключение через «Умные подключения».'));
  panel.append(info,status(''));
 }
 function renderPrint(){
  panel.append(heading('Печать','PDF или фото · через системное меню'));
  const filePicker=$('input');
  filePicker.type='file';filePicker.accept='.pdf,.jpg,.jpeg,.png,.webp';
  filePicker.setAttribute('aria-label','Выбрать документ для печати');
  filePicker.hidden=true;
  const picked=getCurrentFile();
  if(scans.length){
   // A scanned PDF can be printed without first adding it to the vault.
   // This is a private browser preview, never a print-success signal.
   try{
    currentPrint=asFile(
     window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans),'SEYVEO-скан.pdf'
    );
   }catch{currentPrint=null;}
  }else if(picked&&/\.(?:pdf|jpe?g|png|webp)$/i.test(picked.name||'')){
   currentPrint=picked;
  }else currentPrint=null;

  const stage=$('div','sv-doc-print-stage');
  stage.hidden=true;
  const frame=$('div','sv-doc-print-paper-frame');
  const paper=$('div','sv-doc-print-paper');
  paper.setAttribute('aria-label','Предпросмотр листа для печати');
  const meta=$('div','sv-doc-print-paper-meta');
  frame.append(paper);
  const controlsRow=$('div','sv-doc-print-controls');
  const choose=button('Выбрать файл',()=>filePicker.click());
  choose.className+=' sv-doc-print-choose';
  const openLink=$('a','sv-doc-tool-print-link sv-doc-print-open','Открыть для печати');
  openLink.target='_blank';openLink.rel='noopener noreferrer';
  openLink.setAttribute('aria-label','Открыть выбранный документ для системной печати');
  openLink.hidden=true;
  controlsRow.append(choose,openLink);
  stage.append(frame,meta);
  let activeUrl=null;
  function update(){
   // Each selected file owns exactly one live blob URL. Revoking the
   // previous URL releases a decrypted in-memory copy on file switch.
   if(activeUrl){
    URL.revokeObjectURL(activeUrl);
    temporaryUrls=temporaryUrls.filter(u=>u!==activeUrl);
    activeUrl=null;
   }
   paper.replaceChildren();meta.replaceChildren();
   controlsRow.dataset.hasFile=currentPrint?'true':'false';
   stage.hidden=!currentPrint;
   printHint.hidden=!currentPrint;
   choose.textContent=currentPrint?'Другой файл':'Выбрать PDF или фото';
   if(!currentPrint){
    openLink.hidden=true;openLink.removeAttribute('href');
    return;
   }
   const ext=String(currentPrint.name||'').split('.').pop().toLowerCase();
   try{
    activeUrl=URL.createObjectURL(currentPrint);
    temporaryUrls.push(activeUrl);
   }catch{
    currentPrint=null;controlsRow.dataset.hasFile='false';
    stage.hidden=true;printHint.hidden=true;choose.textContent='Выбрать PDF или фото';
    openLink.hidden=true;openLink.removeAttribute('href');
    message('Не удалось открыть файл. Выберите другой.');
    return;
   }
   if(ext==='pdf'){
    // Browser-native PDF display; Safari can instead use the actual
    // "Open for printing" action if the embedded renderer is unavailable.
    const preview=$('iframe','sv-doc-print-pdf');
    preview.src=activeUrl;preview.title='Предпросмотр PDF '+currentPrint.name;
    preview.setAttribute('loading','lazy');
    paper.append(preview);
   }else{
    const image=$('img','sv-doc-print-image');
    image.src=activeUrl;image.alt='Предпросмотр изображения '+currentPrint.name;
    paper.append(image);
   }
   meta.append($('strong','',currentPrint.name),
    $('small','',ext==='pdf'?'PDF · оригинал':'Фото · оригинал'));
   openLink.href=activeUrl;openLink.hidden=false;
  }
  filePicker.addEventListener('change',()=>{
   const f=filePicker.files?.[0];
   if(!f)return;
   if(f.size>20*1024*1024||f.size<1||
      !/\.(?:pdf|jpe?g|png|webp)$/i.test(f.name)){
    message('Выберите PDF или фото до 20 МБ.');return;
   }
   currentPrint=f;update();
  });
  const printHint=$('p','sv-doc-print-inline-note',
   'В открытом файле выберите «Поделиться → Печать».');
  panel.append(filePicker,stage,controlsRow,printHint,status(''));
  update();
 }
 // The document viewer can hand an explicitly opened JPEG/PNG/WebP to
 // this existing signing tool. PDF editing is NOT implemented: no silent
 // conversion, no replacement of the encrypted original.
 async function openSignImage(file){
  if(!file||!/^\s*image\/(jpeg|png|webp)\s*$/i.test(file.type||'')||
     !Number.isSafeInteger(file.size)||file.size<1||
     file.size>12*1024*1024)return false;
  const instance=openSignImage,at=generation,epoch=operationEpoch;
  try{
   const image=await imageOf(file);
   if(activeStudio!==instance||at!==generation||epoch!==operationEpoch)
    return false;
   const page=jpegOf(canvasOf(image));
   if(activeStudio!==instance||at!==generation||epoch!==operationEpoch)
    return false;
   operationEpoch++;importBusy=false;
   scans=[page];selectedScan=0;
   mode='sign';panel.dataset.mode='sign';panel.hidden=false;render();
   syncToolSelection();
   panel.scrollIntoView?.({block:'nearest',behavior:'smooth'});
   return true;
  }catch{return false;}
 }
 activeStudio=openSignImage;
 activeHandoff=async payload=>{
  if(!payload||!panel.isConnected)return false;
  if(payload.kind==='sayvi-result'){
   const value=String(payload.text||'');if(!value.trim()||value.length>12000)return false;
   await persistDraft();if(saveFailed||!panel.isConnected)return false;
   newDraft();draftEdited=true;documentDraft=value;documentName=String(payload.title||'').slice(0,100);
   documentFormat=payload.format==='docx'?'docx':'pdf';documentTemplate='';
   operationEpoch++;mode='create';panel.dataset.mode=mode;panel.hidden=false;render();syncToolSelection();
   panel.querySelector('.sv-doc-edit-resume')?.click();
   await persistDraft();return !saveFailed;
  }
  if(payload.kind==='word'){
   const value=String(payload.text||'').slice(0,12000);
   if(!value.trim())return false;
   await persistDraft();if(saveFailed||!panel.isConnected)return false;newDraft();draftEdited=true;documentDraft=value;documentFormat='docx';documentTemplate='';fromScan=true;wordStyle={size:12,alignment:'left',heading:false};
   documentName=String(payload.title||'Документ').slice(0,100);
   operationEpoch++;mode='create';panel.dataset.mode=mode;panel.hidden=false;render();syncToolSelection();void persistDraft();
   panel.scrollIntoView?.({block:'nearest'});return true;
  }
  if(payload.kind==='pdf-text'){
   const at=generation,epoch=++operationEpoch;
   const valid=()=>at===generation&&epoch===operationEpoch&&panel.isConnected&&payload.isActive?.()!==false;
   if(!window.Tesseract?.createWorker&&!window.confirm('Для распознавания потребуется скачать движок и языковые модели из интернета. Страницы обрабатываются на устройстве. Продолжить?'))return false;
   let worker;
   try{
    const pages=await window.SEYVEO_DOCS_EXPORT.readScanPdf(payload.file);
    if(!valid())return false;
    const engine=await getOcrEngine();if(!valid())return false;
    worker=await engine.createWorker(['rus','eng'],1);if(!valid())return false;
    const texts=[];
    for(const page of pages){
     const result=await worker.recognize(new Blob([page.jpegBytes],{type:'image/jpeg'}));
     if(!valid())return false;
     const value=String(result?.data?.text||'').trim();
     if(!value)throw Error('Не удалось распознать текст одной из страниц. Оригинал не изменён.');
     texts.push(value);
     if(texts.join('\n\n').length>12000)throw Error('Документ больше 12 000 знаков. Редактирование копии пока недоступно.');
    }
    await persistDraft();if(saveFailed||!valid())return false;
    newDraft();draftEdited=true;documentDraft=texts.join('\n\n');documentFormat='docx';fromScan=true;
    documentName=String(payload.file.name||'Документ').replace(/\.[^.]+$/,'').slice(0,100);
    mode='create';panel.dataset.mode=mode;panel.hidden=false;render();syncToolSelection();
    void persistDraft();return true;
   }finally{if(worker)try{await worker.terminate();}catch{}}
  }
  if(payload.kind==='pdf-file'){
   const at=generation,epoch=++operationEpoch;
   if(!window.SEYVEO_DOCS_EXPORT?.readScanPdf)throw Error('Редактор страниц недоступен.');
   const pages=await window.SEYVEO_DOCS_EXPORT.readScanPdf(payload.file);
   if(at!==generation||epoch!==operationEpoch||!panel.isConnected)return false;
   scans=pages;selectedScan=0;mode='scan';panel.dataset.mode=mode;panel.hidden=false;render();syncToolSelection();
   panel.scrollIntoView?.({block:'nearest'});return true;
  }
  if(payload.kind==='pages'||payload.kind==='sign'){
   const file=payload.file;if(!(file instanceof Blob)||!/^image\/(jpeg|png|webp)$/i.test(file.type))return false;
   const at=generation,epoch=++operationEpoch;
   try{
    const image=await imageOf(file);
    if(at!==generation||epoch!==operationEpoch||!panel.isConnected)return false;
    scans=[jpegOf(canvasOf(image))];selectedScan=0;mode=payload.kind==='sign'?'sign':'scan';
    panel.dataset.mode=mode;panel.hidden=false;render();syncToolSelection();
    panel.scrollIntoView?.({block:'nearest'});return true;
   }catch{return false;}
  }
  return false;
 };
 return true;
}
function openImageForSignature(file){
 return activeStudio?activeStudio(file):Promise.resolve(false);
}
window.SEYVEO_DOCS_STUDIO=Object.freeze({mount,reset,openImageForSignature,textPdf,openScanWork:payload=>activeHandoff?activeHandoff(payload):Promise.resolve(false)});
})();
