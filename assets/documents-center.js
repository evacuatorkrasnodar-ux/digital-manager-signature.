/* SEYVEO · Documents is a private archive; document creation lives in Sayvi chat.
   Existing browser-local AES-GCM vault is preserved. No silent transfer of files. */
(()=>{
'use strict';
const MAX_FILE=20*1024*1024;
const names={personal:'Личное',business:'Бизнес'};
const allowed=/\.(?:pdf|txt|md|docx|xlsx|pptx|png|jpe?g|webp)$/i;
let area='personal',host=null,view='archive',archiveExpanded=false,readerToken=0,previewUrl=null,viewerSession=null;
const previewRole=()=>window.SEYVEO_PREVIEW?.isEmployee?.()===true?'employee':window.SEYVEO_PREVIEW?.isManager?.()===true?'manager':'personal';
const employeePreview=()=>previewRole()==='employee';
let lastPreviewRole=null;
let files={personal:null,business:null},stored={personal:false,business:false},showPreview=false;
 let pendingChatDocument=null,pendingScanWork=null;

const el=(tag,cls,value)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(value!==undefined)n.textContent=value;
 return n;
};
const button=(label,fn,cls='')=>{
 const b=el('button','sv-doc-action'+(cls?' '+cls:''),label);
 b.type='button';b.addEventListener('click',fn);return b;
};
const note=value=>el('p','sv-doc-note',value);
function clearPreview(){
 ++readerToken;
 if(viewerSession){viewerSession.destroy();viewerSession=null;}
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
}
function reset(){
 window.SEYVEO_DOCS_STUDIO?.reset?.();
 clearPreview();
 files={personal:null,business:null};stored={personal:false,business:false};
 view='archive';showPreview=false;archiveExpanded=false;
}
function setArea(next){
 if(!names[next])return false;
 if(next!==area)window.SEYVEO_DOCS_STUDIO?.reset?.();
 area=next;view=next==='business'&&employeePreview()?'flow':'archive';
 showPreview=false;
 if(next==='business'&&employeePreview()){
  archiveExpanded=false;
  window.SEYVEO_DOCUMENT_VAULT?.lock?.();
 }
 if(host)draw();
 return true;
}
async function goSayvi(intent,context){
 const key='seyveo.sayvi.document-handoff.v1';
 if(intent==='official-form'){
  if(!context?.name||!context?.country||!context?.period)return false;
  try{
   const source=new URL(context.url);if(source.protocol!=='https:'||!/(^|\.)(nalog\.gov\.ru|src\.am|customs\.gov\.ru)$/.test(source.hostname))return false;
   sessionStorage.setItem(key,JSON.stringify({intent,at:Date.now(),name:String(context.name).slice(0,100),country:String(context.country).slice(0,50),period:String(context.period).slice(0,60),url:source.href,area}));
   location.assign('sayvi-chat-new.html?officialForm=1');return true;
  }catch{return false;}
 }
 if(intent==='edit-current'){
  if(!context||typeof context.text!=='string'||!context.text.trim()||context.text.length>12000)return false;
  try{
   const payload={text:context.text,title:String(context.title||'').slice(0,100),format:context.format==='docx'?'docx':'pdf',template:String(context.template||''),purpose:context.purpose==='format'?'format':'edit',area};
   const file=new File([JSON.stringify(payload)],'seyveo-editor-handoff.json',{type:'application/json'});
   const refs=await window.SEYVEO_CHAT_FILES?.remember([file]);
   const ref=refs?.[file.name];if(!ref)return false;
   sessionStorage.setItem(key,JSON.stringify({intent,ref,at:Date.now()}));
   location.assign('sayvi-chat-new.html?documentEditor=1');
   return true;
  }catch{return false;}
 }
 // Generic task has no document content. Private editor data travels only
 // through the encrypted per-tab cache, never in the navigation URL.
 try{sessionStorage.setItem(key,JSON.stringify({intent,at:Date.now()}));}catch{}
 if(window.SEYVEO_CONVERSATION?.open)window.SEYVEO_CONVERSATION.open();
 else location.assign('sayvi-chat-new.html');
 return true;
}
function makeIcon(kind){
 const wrap=el('span','sv-doc-symbol');wrap.setAttribute('aria-hidden','true');
 if(kind==='sayvi'){wrap.classList.add('sv-sayvi-symbol');return wrap;}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');
 const rowGlyphs={"approval":"<path d=\"M13.5 3.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9Z\"/><path d=\"M13.5 3.5V8a1 1 0 0 0 1 1H19M8 10.5h3.5\" opacity=\".65\"/><circle cx=\"13.8\" cy=\"15.6\" r=\"3.7\" fill=\"currentColor\" fill-opacity=\".08\" stroke-opacity=\".65\"/><path d=\"m11.9 15.6 1.3 1.3 2.5-2.8\"/>","connection":"<path d=\"M12.5 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H14M12.5 3.5 17 8v3M12.5 3.5V8H17M8 11h4.5M8 14h3\" /><path d=\"M15 16l1.7-1.7a2.5 2.5 0 0 1 3.5 3.5l-1.7 1.7a2.5 2.5 0 0 1-3.5 0\" opacity=\".85\"/><path d=\"m17.6 16.4-2.1 2.1a2.5 2.5 0 0 1-3.5-3.5l1.6-1.6a2.5 2.5 0 0 1 3.5 0\" opacity=\".65\"/>","lock":"<path d=\"M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10\"/><rect x=\"4.5\" y=\"10\" width=\"15\" height=\"11\" rx=\"2.8\" fill=\"currentColor\" fill-opacity=\".04\"/><circle cx=\"12\" cy=\"14.5\" r=\"1.5\" fill=\"currentColor\" fill-opacity=\".14\"/><path d=\"M12 16v2\" opacity=\".8\"/>"};
 if(Object.prototype.hasOwnProperty.call(rowGlyphs,kind)){svg.innerHTML=rowGlyphs[kind];wrap.append(svg);return wrap;}
 const p=document.createElementNS('http://www.w3.org/2000/svg','path');
 p.setAttribute('d',kind==='lock'
  ? 'M5.5 10V7.5a6.5 6.5 0 0 1 13 0V10M5 10h14v11H5zM12 14v3'
  : kind==='approval'
    ? 'M5 3.5h9l5 5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2ZM14 3.5v5h5M7 14l2.5 2.5 5-5'
  : kind==='review'
    ? 'M4 3h11l4 4v5M15 3v5h4M4 3v18h10M7 12h8M7 16h5M19 19l3 3M21 16a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'
    : kind==='connection'
    ? 'M9 8.5h-2a4.5 4.5 0 0 0 0 9h3m4-9h3a4.5 4.5 0 0 1 0 9h-3M8.5 13h7'
    : 'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4');
 svg.append(p);wrap.append(svg);return wrap;
}
function chatAction(label,subtitle,intent,primary=false){
 const action=button('',()=>goSayvi(intent),'sv-doc-chat-action'+(primary?' sv-doc-chat-main':''));
 action.append(makeIcon(primary?'sayvi':'review'));
 const copy=el('span','sv-doc-chat-copy');
 copy.append(el('strong','',label),el('small','',subtitle));
 const chevron=el('span','sv-doc-chat-chevron','›');chevron.setAttribute('aria-hidden','true');
 action.append(copy,chevron);return action;
}
function openDocumentConnections(){
 // One approved connection hub: Management → Smart Connections → Services.
 // No local fake connectors or app permissions on the Documents screen.
 const hub=window.SEYVEO_SMART_CONNECTIONS;
 if(typeof hub?.open==='function'){hub.open('services');return;}
 const trigger=document.getElementById('openManageConnections');
 if(trigger){trigger.click();return;}
 location.hash='#manage';
}
function connectionsEntry(){
 const action=button('',openDocumentConnections,'sv-doc-connections-entry');
 const prompts=window.SEYVEO_CONNECTION_PROMPTS;
 if(typeof prompts?.register==='function'){
  // Register with the same verified-only system used by Mail and Pulse.
  // There is no local fake "connected" switch.
  prompts.register(action,'documents',{scope:area,addClick:false});
  return action;
 }
 action.setAttribute('aria-label','Открыть подключения документов');
 const cloud=el('span','sv-doc-symbol');cloud.setAttribute('aria-hidden','true');cloud.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 18a4.5 4.5 0 0 1-.6-9 6.2 6.2 0 0 1 11.8 1.2A3.9 3.9 0 1 1 18 18Z"/></svg>';action.append(cloud);
 const copy=el('span','sv-doc-connections-copy');
 copy.append(el('strong','',area==='personal'?'Подключить хранилище':'Подключить документы'),
  el('small','',area==='personal'?'Синхронизация между устройствами':'1С · ЭДО · серверы'));
 action.append(copy,el('span','sv-doc-chat-chevron','›'));
 return action;
}
function renderPreview(parent,file){
 const scope=area;
 clearPreview();
 // One visual-first viewer for imported and decrypted files. It owns and
 // revokes only its own local blob URL. Keep the existing browser fallback.
 const opened=window.SEYVEO_DOCS_VIEWER?.mount?.(parent,file,{
  onSignImage:image=>window.SEYVEO_DOCS_STUDIO?.openImageForSignature?.(image),
  onEdit:payload=>window.SEYVEO_DOCS_STUDIO?.openScanWork?.(payload),
  onSaveCopy:copy=>window.SEYVEO_DOCUMENT_FILES.save(scope,copy,'device'),
  onSayvi:(intent,context)=>goSayvi(intent,context)
 });
 if(opened&&typeof opened.destroy==='function'){
  viewerSession=opened;return;
 }
 const preview=el('div','sv-doc-preview');
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 const status=el('p','sv-doc-status','Выбран файл: '+file.name);
 parent.append(status);
 const object=URL.createObjectURL(file);previewUrl=object;
 const fileActions=el('div','sv-doc-file-actions');
 const link=el('a','sv-doc-file-link','Открыть / сохранить копию');
 link.href=object;link.target='_blank';link.rel='noopener noreferrer';
 const edit=button('Редактировать с Сэйви',()=>goSayvi('edit'),'sv-doc-edit-in-chat');
 fileActions.append(link,edit);parent.append(fileActions);
 if(/^(?:png|jpg|jpeg|webp)$/.test(ext)){
  const img=el('img','sv-deep-file-image');img.src=object;img.alt='Просмотр документа';preview.append(img);
 }else if(ext==='pdf'){
  const frame=el('iframe','sv-deep-file-frame');frame.src=object;frame.title='Просмотр PDF';preview.append(frame);
 }else if(/^(?:txt|md)$/.test(ext)){
  const token=readerToken;
  file.text().then(text=>{
   if(token!==readerToken||!preview.isConnected)return;
   preview.replaceChildren(el('pre','sv-deep-file-text',text.slice(0,120000)));
   if(text.length>120000)preview.append(note('Показано начало документа.'));
  }).catch(()=>preview.replaceChildren(note('Не удалось открыть текст.')));
 }else preview.append(note('Предварительный просмотр этого формата не поддерживается браузером. Откройте оригинал.'));
 parent.append(preview);
}
function draw(){
 if(!host)return;
 // Employee perspective is inherited from the business cabinet.
 // The demo role is NOT authentication; do not render business vault controls.
 if(area==='business'&&employeePreview()){
  view='flow';showPreview=false;archiveExpanded=false;
 }
 window.SEYVEO_DOCUMENT_SHELF?.destroy?.();
 window.SEYVEO_DOCUMENT_FLOW?.unmount?.();
 clearPreview();host.replaceChildren();

 const page=document.getElementById('sayviSurfacePage');
 if(page)page.dataset.svDocView=view==='flow'?'flow':'archive';
 const switcher=el('div','sv-doc-switch');
 switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Пространство документов');
 for(const key of ['personal','business']){
  const b=button(names[key],()=>setArea(key),'sv-doc-tab');
  b.setAttribute('aria-pressed',String(area===key));switcher.append(b);
 }
 host.append(switcher);

 if(area==='business'&&!employeePreview()&&view!=='flow'){
  // Show approvals entry in the archive, not again inside approvals.
  // Status counts refer only to the local training scenario.
  const records=window.SEYVEO_DOCUMENT_FLOW?.getRecords?.()||[];
  const working=records.filter(x=>['sent','read','returned'].includes(x.state)).length;
  const onSignature=records.filter(x=>x.state==='signing').length;
  const flowCard=button('',()=>{
   window.SEYVEO_DOCS_STUDIO?.reset?.();
   view='flow';draw();
  },'sv-doc-flow-card');
  flowCard.setAttribute('aria-label','Согласования документов, учебный режим');
  const flowCopy=el('span','sv-doc-flow-copy');
  flowCopy.append(el('strong','','Согласования'),
   el('small','','Маршрут документа'));
  const flowStats=el('span','sv-doc-flow-stats',
   working+' в работе'+(onSignature?' · '+onSignature+' на подпись':''));
  const arrow=el('span','sv-doc-flow-chevron','›');arrow.setAttribute('aria-hidden','true');
  flowCard.append(makeIcon('approval'),flowCopy,flowStats,arrow);
  host.append(flowCard);
 }
 if(view==='flow'){
  if(employeePreview()){
   const limit=el('div','sv-doc-role-info');
   limit.append(el('strong','','Входящие документы'),
    el('small','','Доступ сотрудника'));
   host.append(limit);
  }
  const flow=el('section','sv-doc-workspace');
  host.append(flow);
  if(!window.SEYVEO_DOCUMENT_FLOW?.mount?.(flow))flow.append(note('Согласования пока недоступны.'));
  if(!employeePreview())host.append(connectionsEntry());
  return;
 }
 // One real archive row replaces the duplicate "protected documents"
 // intro. Keep the file picker hidden and bound to its original handler.
 const safeArea=el('section','sv-doc-safe-area');
 const selected=files[area];
 const picker=document.createElement('input');
 picker.type='file';picker.hidden=true;
 const allFileTypes='.pdf,.txt,.md,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.webp';
 const typeFilters={pdf:'.pdf',word:'.docx',images:'.png,.jpg,.jpeg,.webp',sheets:'.xlsx'};
 const openPicker=(type='all')=>{
  picker.accept=typeFilters[type]||allFileTypes;
  picker.click();
 };
 picker.accept=allFileTypes;
 picker.setAttribute('aria-label','Добавить документ в архив');
 picker.addEventListener('change',async()=>{
  const file=picker.files?.[0];
  if(!file)return;
  if(file.size>MAX_FILE||file.size===0||!allowed.test(file.name)){
   const feedback=host?.querySelector('.sv-doc-selection-status');
   if(feedback)feedback.textContent='Выберите PDF, Word, Excel, PowerPoint, текст или изображение до 20 МБ.';
   picker.value='';return;
  }
  const scope=area;
  try{await window.SEYVEO_DOCUMENT_FILES.save(scope,file,'device');}catch(e){const feedback=host?.querySelector('.sv-doc-selection-status');if(feedback)feedback.textContent=e.message||'Не удалось сохранить локальную копию.';return;}
  if(scope!==area||!picker.isConnected)return;
  files[scope]=file;stored[scope]=false;showPreview=true;draw();
 });
 // One working developer tool surface (scan, file, create, signature,
 // print). Existing archive file picker and encryption remain authoritative.
 const tools=el('section','sv-doc-tools-slot');
 const studioReady=window.SEYVEO_DOCS_STUDIO?.mount?.(tools,{
  area,
  getCurrentFile:()=>files[area]||null,
  onPick:()=>openPicker(),
  onSayvi:goSayvi,
  onImport:file=>{
   if(!(file instanceof File)||file.size>MAX_FILE||!allowed.test(file.name))
    throw Error('Unsupported generated document');
   files[area]=file;stored[area]=false;
   archiveExpanded=true;showPreview=true;draw();
  }
 })===true;
 if(studioReady){
  host.append(tools);
  // The native file picker stays in the DOM, even though it is hidden,
  // and is invoked directly from the visible user gesture.
  host.append(picker);
 }else{
  // Fallback stays visible when the illustrated studio is unavailable.
  const storeActions=el('div','sv-doc-store-actions');
  storeActions.append(button('Добавить документ',()=>openPicker(),'sv-doc-primary'));
  safeArea.append(storeActions,picker);
  host.append(safeArea);
 }
 const feedback=el('p','sv-doc-selection-status');
 feedback.setAttribute('role','status');
 host.append(feedback);
 // Recent files and type folders use existing selected files and decrypted
 // vault metadata only while the password-protected vault is unlocked.
 const shelf=el('div','sv-doc-shelf-slot');
 host.append(shelf);
 const shelfReady=window.SEYVEO_DOCUMENT_SHELF?.mount?.(shelf,{
  area,
  getSelected:()=>stored[area]?null:files[area],
  onPick:type=>openPicker(type),
  onArchive(){
   openArchiveSheet();
  },
  onOpenFile(file,fromVault,fromFolder=false){
   if(!(file instanceof File))return;
   if(fromFolder){
    const scope=area;
    clearPreview();
    const opened=window.SEYVEO_DOCS_VIEWER?.open?.(file,{
     onSignImage:image=>window.SEYVEO_DOCS_STUDIO?.openImageForSignature?.(image),
     onEdit:payload=>window.SEYVEO_DOCS_STUDIO?.openScanWork?.(payload),
     onSaveCopy:copy=>window.SEYVEO_DOCUMENT_FILES.save(scope,copy,'device'),
     onSayvi:(intent,context)=>goSayvi(intent,context),
     onClose(){viewerSession=null;}
    });
    if(opened){viewerSession=opened;return;}
   }
   files[area]=file;stored[area]=!!fromVault;
   showPreview=true;archiveExpanded=!!fromVault;draw();
  }
 })===true;
 // Document folders precede connection settings on both areas.
 host.append(connectionsEntry());

 const archive=el('dialog','sv-doc-archive-sheet');
 const archiveLabel=area==='personal'?'Архив':'Архив компании';
 archive.setAttribute('aria-label',archiveLabel);
 const archiveHead=el('header','sv-doc-scanner-head');
 const grip=el('div','sv-doc-picker-grip');grip.setAttribute('aria-hidden','true');
 const back=window.SEYVEO_DOCUMENT_PICKERS?.backButton(()=>archive.close())||button('‹',()=>archive.close());
 back.classList.add('sv-doc-scanner-round');back.setAttribute('aria-label','Назад');
 archiveHead.append(grip,back,el('strong','',archiveLabel));
 const archiveBody=el('div','sv-doc-archive-body');
 const contents=el('div','sv-doc-vault');archiveBody.append(contents);archive.append(archiveHead,archiveBody);
 const scopeArchive=area;
 function openArchiveSheet(){
  if(!archive.isConnected||archive.open||area!==scopeArchive)return;
  archiveExpanded=true;archive.showModal();
  window.SEYVEO_DOCUMENT_VAULT_UI?.mount?.(contents,{
   area:scopeArchive,currentArea:()=>area,
   selectedFile:()=>stored[area]?null:files[area],
   savedFile(file){if(files[area]===file)stored[area]=true;},
   toSayvi:intent=>goSayvi(intent),
   showIntegrations:openDocumentConnections,
   draft:()=>({title:'',text:''}),
   openFile(file,target){
    if(!names[target])return;
    files[target]=file;stored[target]=true;area=target;
    showPreview=true;archiveExpanded=true;draw();
   },
   clearSession(){reset();draw();}
  });
 }
 archive.addEventListener('seyveo:open-archive',openArchiveSheet);
 archive.addEventListener('close',()=>{if(archive.isConnected&&area===scopeArchive){archiveExpanded=false;contents.replaceChildren();}});
 window.SEYVEO_SHEET_NAVIGATION?.attach(archiveHead,null,()=>archive.close());
 if(selected&&showPreview){
  const selectedFile=selected,scope=area;
  requestAnimationFrame(()=>{
   if(!host?.isConnected||files[area]!==selectedFile||!showPreview||viewerSession)return;
   const opened=window.SEYVEO_DOCS_VIEWER?.open?.(selectedFile,{
    onSignImage:image=>window.SEYVEO_DOCS_STUDIO?.openImageForSignature?.(image),
    onEdit:payload=>window.SEYVEO_DOCS_STUDIO?.openScanWork?.(payload),
    onSaveCopy:copy=>window.SEYVEO_DOCUMENT_FILES.save(scope,copy,'device'),
    onSayvi:(intent,context)=>goSayvi(intent,context),
    onClose(){showPreview=false;viewerSession=null;}
   });
   if(opened)viewerSession=opened;
   else{
    const holder=el('div','sv-doc-file-review-body');host.append(holder);renderPreview(holder,selectedFile);
   }
  });
 }
 const assistant=el('section','sv-doc-assistant');
 // The compact assistant row already names Sayvi. No extra heading.
 const hero=el('details','sv-doc-assistant-hero');
 const intro=el('summary','sv-doc-assistant-summary');
 const markBox=el('span','sv-doc-assistant-mark-box');
 markBox.append(makeIcon('sayvi'));intro.append(markBox);
 const copy=el('span','sv-doc-assistant-hero-copy');
 copy.append(el('strong','','Сэйви поможет'),el('small','','Создать или проверить документ'));
 intro.setAttribute('aria-label','Сэйви: создать или проверить документ');
 const chevron=el('span','sv-doc-chat-chevron');
 chevron.setAttribute('aria-hidden','true');
 intro.append(copy,chevron);
 const actions=el('div','sv-doc-assistant-actions');
 actions.append(
  button('Создать с Сэйви',()=>goSayvi('create'),'sv-doc-assistant-action'),
  button('Проверить с Сэйви',()=>goSayvi('review'),'sv-doc-assistant-action'));
 hero.append(intro,actions);assistant.append(hero);host.append(assistant);
 if(!shelfReady){const entry=button(archiveLabel,openArchiveSheet,'sv-doc-archive-fallback');host.append(entry);}
 host.append(archive);
 const safety=el('details','sv-doc-safety');
 safety.append(el('summary','','О защите данных'),
  note('Архив защищён отдельным паролем, который нельзя восстановить. Черновики и локальные копии файлов шифруются ключом браузера без отдельного пароля. Это не резервная копия и не парольный архив. Очистка данных браузера может удалить документы и черновики. Сохраните важные файлы отдельно. Учебные согласования не шифруются — не используйте в них реальные данные.'));
 // Keep the legal/storage explanation accessible when the vault opens,
 // without a second visual section under the collapsed archive card.
 archiveBody.append(safety);
 if(archiveExpanded)openArchiveSheet();
}
function backFromNested(){
 const approval=host?.querySelector('.svdf-document-page[open]');if(approval){approval.close();return true;}
 const folder=host?.querySelector('.sv-doc-folder-page[open]');if(folder){folder.close();return true;}
 const archive=host?.querySelector('.sv-doc-archive-sheet[open]');if(archive){archive.close();return true;}
 // Shared titlebar Back navigates within Documents first.
 // An employee has no business vault, so their Back exits normally.
 if(area!=='business'||view!=='flow'||employeePreview())return false;
 view='archive';draw();return true;
}
function openApprovals(recordId){
 window.SEYVEO_DOCS_STUDIO?.reset?.();
 area='business';view='flow';
 if(host)draw();
 if(typeof recordId==='string')window.SEYVEO_DOCUMENT_FLOW?.select?.(recordId);
 return true;
}
function syncPreviewRole(){
 const current=previewRole();
 if(current===lastPreviewRole)return;
 lastPreviewRole=current;
 // Clear unlocked keys, scanned pages and decrypted previews across roles.
 // This is hygiene on a shared demo browser, not security enforcement.
 window.SEYVEO_DOCS_STUDIO?.reset?.();
 window.SEYVEO_DOCUMENT_VAULT?.lock?.();
 clearPreview();
 archiveExpanded=false;showPreview=false;
 // A previously decrypted File must not remain in JS memory after a role change.
 files={personal:null,business:null};stored={personal:false,business:false};
 if(area==='business')view=current==='employee'?'flow':'archive';
 if(host?.isConnected)draw();
}
window.addEventListener('seyveo:preview-role-changed',syncPreviewRole);
function importFromChat(file){
 if(!(file instanceof File)||file.size<1||file.size>MAX_FILE||!allowed.test(file.name)||employeePreview())return false;
 // Explicit in-memory selection only. Never autosave into encrypted vault.
 pendingChatDocument=file;
 if(host?.isConnected){
  area='business';view='archive';files.business=file;stored.business=false;
  archiveExpanded=true;showPreview=true;pendingChatDocument=null;draw();
 }
 return true;
}
function openScanWork(payload){
 if(!payload||!['word','pages','sign','archive'].includes(payload.kind))return false;
 if(payload.kind==='word'&&!String(payload.text||'').trim())return false;
 if(payload.kind!=='word'&&(!(payload.file instanceof File)||payload.file.size<1||payload.file.size>MAX_FILE||!allowed.test(payload.file.name)))return false;
 const route=window.SEYVEO_SAYVI_SURFACES;
 if(typeof route?.open!=='function')return false;
 // Scans originate from the personal Notebook. No business-vault transfer.
 pendingScanWork=payload;
 if(!route.open('contract','personal')){pendingScanWork=null;return false;}
 return true;
}
function mount(parent){
 reset();lastPreviewRole=previewRole();
 if(pendingChatDocument&&!employeePreview()){
  area='business';view='archive';files.business=pendingChatDocument;stored.business=false;
  archiveExpanded=true;showPreview=true;
 }
 pendingChatDocument=null;
 const work=pendingScanWork;pendingScanWork=null;
 if(work){
  area='personal';view='archive';
  if(work.kind==='archive'){files.personal=work.file;stored.personal=false;archiveExpanded=true;showPreview=true;}
 }
 host=el('div','sv-doc-center');parent.append(host);draw();
 const returnKey='seyveo.document-editor-return.v1';
 let returned=null;try{returned=JSON.parse(sessionStorage.getItem(returnKey)||'null');sessionStorage.removeItem(returnKey);}catch{}
 if(returned?.ref&&Date.now()-returned.at>=0&&Date.now()-returned.at<180000){
  const target=host;
  void (async()=>{
   const file=await window.SEYVEO_CHAT_FILES?.restore(returned.ref);if(!file)throw Error('Результат Сэйви недоступен.');
   const payload=JSON.parse(await file.text());
   if(payload.kind!=='sayvi-result'||typeof payload.text!=='string'||!payload.text.trim()||payload.text.length>12000||!names[payload.area])throw Error('Некорректный результат.');
   if(host!==target||!host.isConnected)return;
   if(payload.area==='business'&&employeePreview())throw Error('Недоступно в текущей роли.');
   if(area!==payload.area)setArea(payload.area);
   if(!await window.SEYVEO_DOCS_STUDIO?.openScanWork?.(payload))throw Error('Не удалось открыть результат.');
  })().catch(error=>{if(host===target&&host.isConnected)host.prepend(note(error.message||'Не удалось восстановить результат Сэйви.'));});
 }

 if(work&&work.kind!=='archive'){
  const target=host;
  requestAnimationFrame(()=>{if(host!==target||!host.isConnected)return;
   Promise.resolve(window.SEYVEO_DOCS_STUDIO?.openScanWork?.(work)).then(ok=>{
    if(!ok&&host===target)host.prepend(note('Не удалось открыть редактор. Исходный скан не изменён.'));
   }).catch(()=>{if(host===target)host.prepend(note('Не удалось открыть редактор.'));});
  });
 }
 return true;
}
function getSearchContext(){
 return Object.freeze({area,view,mounted:!!host?.isConnected});
}
async function searchInCurrentDocuments(query,{requestArchive=false,scope=area}={}){
 if(!host?.isConnected)return false;
 const requested=scope==='business'&&!employeePreview()?'business':'personal';
 if(requested!==area)setArea(requested);
 if(view==='flow'){
  if(employeePreview())return false;
  view='archive';draw();
 }
 // Auth state is authoritative: simply filter visible documents when the
 // vault is already unlocked. Never re-create or re-prompt for a password.
 let unlocked=false;
 try{unlocked=(await window.SEYVEO_DOCUMENT_VAULT?.status?.())?.unlocked===true}catch{}
 if(!host?.isConnected)return false;
 if(unlocked)void window.SEYVEO_DOCUMENT_SHELF?.refresh?.();
 window.SEYVEO_DOCUMENT_SHELF?.search?.(String(query||'').slice(0,160));
 if(!unlocked&&requestArchive){
  host.querySelector('.sv-doc-archive-sheet')?.dispatchEvent(new Event('seyveo:open-archive'));
 }
 return true;
}
function revealArchiveForSearch(scope='personal',query=''){
 // The password form belongs to the existing encrypted vault. Neither
 // assistant nor search can collect, store or see the user's password.
 const target=scope==='business'&&!employeePreview()?'business':'personal';
 if(target!==area)setArea(target);
 if(view==='flow'&&!employeePreview()){view='archive';draw()}
 const details=host?.querySelector('.sv-doc-archive-sheet');
 if(!details)return false;
 details.dispatchEvent(new Event('seyveo:open-archive'));
 if(query)window.SEYVEO_DOCUMENT_SHELF?.search?.(query);
 return true;
}
function destroy(){

 window.SEYVEO_DOCUMENT_SHELF?.destroy?.();
 window.SEYVEO_DOCUMENT_VAULT?.lock?.();
 reset();host=null;
}
window.SEYVEO_DOCUMENT_CENTER=Object.freeze({mount,destroy,setArea,openApprovals,backFromNested,importFromChat,openScanWork,revealArchiveForSearch,getSearchContext,searchInCurrentDocuments});
})();
