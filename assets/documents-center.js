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
function goSayvi(intent){
 // Only a generic intent crosses pages. Never place file bytes, names,
 // decrypted content or vault keys into URL, storage or chat history.
 try{sessionStorage.setItem('seyveo.sayvi.document-handoff.v1',
  JSON.stringify({intent,at:Date.now()}));}catch{}
 if(window.SEYVEO_CONVERSATION?.open)window.SEYVEO_CONVERSATION.open();
 else location.assign('sayvi-chat-new.html');
}
function makeIcon(kind){
 const wrap=el('span','sv-doc-symbol');wrap.setAttribute('aria-hidden','true');
 if(kind==='sayvi'){wrap.classList.add('sv-sayvi-symbol');return wrap;}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');
 const p=document.createElementNS('http://www.w3.org/2000/svg','path');
 p.setAttribute('d',kind==='lock'
  ? 'M5.5 10V7.5a6.5 6.5 0 0 1 13 0V10M5 10h14v11H5zM12 14v3'
  : kind==='approval'
    ? 'M5 3.5h9l5 5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2ZM14 3.5v5h5M7 14l2.5 2.5 5-5'
  : kind==='review'
    ? 'M4 3h11l4 4v5M15 3v5h4M4 3v18h10M7 12h8M7 16h5M19 19l3 3M21 16a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'
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
 action.setAttribute('aria-label','Открыть умные подключения документов');
 const copy=el('span','sv-doc-connections-copy');
 copy.append(el('strong','','Подключения документов'),
  el('small','','Сервер компании · 1С · ЭДО · подпись'));
 const chevron=el('span','sv-doc-chat-chevron','›');
 chevron.setAttribute('aria-hidden','true');
 action.append(copy,chevron);
 return action;
}
function renderPreview(parent,file){
 clearPreview();
 // One visual-first viewer for imported and decrypted files. It owns and
 // revokes only its own local blob URL. Keep the existing browser fallback.
 const opened=window.SEYVEO_DOCS_VIEWER?.mount?.(parent,file,{
  onSignImage:image=>window.SEYVEO_DOCS_STUDIO?.openImageForSignature?.(image),
  onSayvi:intent=>goSayvi(intent)
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
   el('small','','Руководитель и сотрудник · учебный маршрут'));
  const flowStats=el('span','sv-doc-flow-stats',
   working+' в работе'+(onSignature?' · '+onSignature+' на подпись':''));
  const arrow=el('span','sv-doc-flow-chevron','›');arrow.setAttribute('aria-hidden','true');
  flowCard.append(makeIcon('approval'),flowCopy,flowStats,arrow);
  host.append(flowCard);
 }
 if(view==='flow'){
  if(employeePreview()){
   const limit=el('div','sv-doc-role-info');
   limit.append(el('strong','','Доступ сотрудника · учебный режим'),
    el('small','','Учебный доступ: мои входящие, ознакомление, согласование и возврат с замечанием. Архив компании и настройки КЭП доступны руководителю.'));
   host.append(limit);
  }
  const flow=el('section','sv-doc-workspace');
  host.append(flow);
  if(!window.SEYVEO_DOCUMENT_FLOW?.mount?.(flow))flow.append(note('Согласования пока недоступны.'));
  return;
 }
 // One real archive row replaces the duplicate "protected documents"
 // intro. Keep the file picker hidden and bound to its original handler.
 const safeArea=el('section','sv-doc-safe-area');
 const selected=files[area];
 const picker=document.createElement('input');
 picker.type='file';picker.hidden=true;
 picker.accept='.pdf,.txt,.md,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.webp';
 picker.setAttribute('aria-label','Добавить документ в архив');
 picker.addEventListener('change',()=>{
  const file=picker.files?.[0];
  if(!file)return;
  if(file.size>MAX_FILE||file.size===0||!allowed.test(file.name)){
   const feedback=host?.querySelector('.sv-doc-selection-status');
   if(feedback)feedback.textContent='Выберите PDF, Word, Excel, PowerPoint, текст или изображение до 20 МБ.';
   picker.value='';return;
  }
  files[area]=file;stored[area]=false;archiveExpanded=true;showPreview=false;
  draw();
 });
 // One working developer tool surface (scan, file, create, signature,
 // print). Existing archive file picker and encryption remain authoritative.
 const tools=el('section','sv-doc-tools-slot');
 const studioReady=window.SEYVEO_DOCS_STUDIO?.mount?.(tools,{
  area,
  getCurrentFile:()=>files[area]||null,
  onPick:()=>picker.click(),
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
  storeActions.append(button('Добавить документ',()=>picker.click(),'sv-doc-primary'));
  safeArea.append(storeActions,picker);
  host.append(safeArea);
 }
 const feedback=el('p','sv-doc-selection-status');
 feedback.setAttribute('role','status');
 if(selected&&!stored[area])feedback.textContent='Выбран «'+selected.name+'». Откройте архив и подтвердите сохранение.';
 host.append(feedback);
 // Recent files and type folders use existing selected files and decrypted
 // vault metadata only while the password-protected vault is unlocked.
 const shelf=el('div','sv-doc-shelf-slot');
 host.append(shelf);
 window.SEYVEO_DOCUMENT_SHELF?.mount?.(shelf,{
  area,
  getSelected:()=>stored[area]?null:files[area],
  onPick:()=>picker.click(),
  onArchive(){
   const details=host?.querySelector('.sv-doc-vault-shell');
   if(!details)return;
   details.open=true;
   details.scrollIntoView?.({block:'nearest',behavior:'smooth'});
  },
  onOpenFile(file,fromVault){
   if(!(file instanceof File))return;
   files[area]=file;stored[area]=!!fromVault;
   showPreview=true;archiveExpanded=true;draw();
  }
 });

 const archive=el('details','sv-doc-vault-shell');
 const summary=el('summary','sv-doc-vault-summary');
 const archiveTitle=el('span','sv-doc-vault-copy');
 archiveTitle.append(el('span','sv-doc-vault-title',area==='personal'?'Мой архив':'Архив компании'),
  el('small','','Защищённый сейф · пароль'));
 summary.append(makeIcon('lock'),archiveTitle);
 const contents=el('div','sv-doc-vault');
 archive.append(summary,contents);
 archive.addEventListener('toggle',()=>{
  if(!archive.isConnected)return;
  archiveExpanded=archive.open;
  if(!archive.open)return;
  window.SEYVEO_DOCUMENT_VAULT_UI?.mount?.(contents,{
   area,currentArea:()=>area,
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
 });
 archive.open=archiveExpanded;
 if(selected){
  const preview=el('details','sv-doc-file-review');
  preview.open=showPreview;
  const sum=el('summary','','Просмотр документа');
  preview.append(sum);
  const holder=el('div','sv-doc-file-review-body');
  preview.append(holder);
  if(showPreview)renderPreview(holder,selected);
  preview.addEventListener('toggle',()=>{
   showPreview=preview.open;
   if(preview.open){holder.replaceChildren();renderPreview(holder,selected);}
   else{holder.replaceChildren();clearPreview();}
  });
  host.append(preview);
 }
 const assistant=el('section','sv-doc-assistant');
 assistant.append(el('h2','sv-doc-assistant-title','Сэйви поможет'));
 const hero=el('details','sv-doc-assistant-hero');
 const intro=el('summary','sv-doc-assistant-summary');
 const markBox=el('span','sv-doc-assistant-mark-box');
 markBox.append(makeIcon('sayvi'));intro.append(markBox);
 const copy=el('span','sv-doc-assistant-hero-copy');
 copy.append(el('strong','','Составить договор, проверить документ и исправить ошибки.'));
 intro.append(copy,el('span','sv-doc-chat-chevron','›'));
 const actions=el('div','sv-doc-assistant-actions');
 actions.append(
  button('Создать документ',()=>goSayvi('create'),'sv-doc-assistant-action'),
  button('Проверить документ',()=>goSayvi('review'),'sv-doc-assistant-action'));
 hero.append(intro,actions);assistant.append(hero);host.append(assistant);
 host.append(archive);
 if(area==='business')host.append(connectionsEntry());
 const safety=el('details','sv-doc-safety');
 safety.append(el('summary','','Безопасность и хранение'),
  note('Архив зашифрован на устройстве. Облачного восстановления нет: при очистке браузера файлы могут исчезнуть. Передача и печать — только по вашему действию. Демо-согласования не предназначены для конфиденциальных документов.'));
 // Keep the legal/storage explanation accessible when the vault opens,
 // without a second visual section under the collapsed archive card.
 archive.append(safety);
}
function backFromNested(){
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
function mount(parent){
 reset();lastPreviewRole=previewRole();
 host=el('div','sv-doc-center');parent.append(host);draw();return true;
}
function destroy(){

 window.SEYVEO_DOCUMENT_SHELF?.destroy?.();
 window.SEYVEO_DOCUMENT_VAULT?.lock?.();
 reset();host=null;
}
window.SEYVEO_DOCUMENT_CENTER=Object.freeze({mount,destroy,setArea,openApprovals,backFromNested});
})();
