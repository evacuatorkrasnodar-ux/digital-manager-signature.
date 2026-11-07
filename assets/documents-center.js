/* SEYVEO · Documents is a private archive; document creation lives in Sayvi chat.
   Existing browser-local AES-GCM vault is preserved. No silent transfer of files. */
(()=>{
'use strict';
const MAX_FILE=20*1024*1024;
const names={personal:'Личное',business:'Бизнес'};
const allowed=/\.(?:pdf|txt|md|docx|xlsx|pptx|png|jpe?g|webp)$/i;
let area='personal',host=null,view='archive',archiveExpanded=false,readerToken=0,previewUrl=null;
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
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
}
function reset(){
 clearPreview();
 files={personal:null,business:null};stored={personal:false,business:false};
 view='archive';showPreview=false;archiveExpanded=false;
}
function setArea(next){
 if(!names[next])return false;
 area=next;view='archive';showPreview=false;
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
  : 'M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4');
 svg.append(p);wrap.append(svg);return wrap;
}
function chatAction(label,subtitle,intent,primary=false){
 const action=button('',()=>goSayvi(intent),'sv-doc-chat-action'+(primary?' sv-doc-chat-main':''));
 action.append(makeIcon(primary?'sayvi':'lock'));
 const copy=el('span','sv-doc-chat-copy');
 copy.append(el('strong','',label),el('small','',subtitle));
 const chevron=el('span','sv-doc-chat-chevron','›');chevron.setAttribute('aria-hidden','true');
 action.append(copy,chevron);return action;
}
function renderPreview(parent,file){
 clearPreview();
 const preview=el('div','sv-doc-preview');
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 const status=el('p','sv-doc-status','Выбран файл: '+file.name);
 parent.append(status);
 const object=URL.createObjectURL(file);previewUrl=object;
 const link=el('a','sv-doc-file-link','Открыть оригинал');
 link.href=object;link.target='_blank';link.rel='noopener noreferrer';
 parent.append(link);
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
 clearPreview();host.replaceChildren();
 const switcher=el('div','sv-doc-switch');
 switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Пространство документов');
 for(const key of ['personal','business']){
  const b=button(names[key],()=>setArea(key),'sv-doc-tab');
  b.setAttribute('aria-pressed',String(area===key));switcher.append(b);
 }
 host.append(switcher);
 if(view==='flow'){
  const back=button('Вернуться в хранилище',()=>{view='archive';draw();},'sv-doc-flow-back');
  const flow=el('section','sv-doc-workspace');
  host.append(back,flow);
  if(!window.SEYVEO_DOCUMENT_FLOW?.mount?.(flow))flow.append(note('Согласования пока недоступны.'));
  return;
 }
 const intro=el('section','sv-doc-intro');
 intro.append(makeIcon('lock'));
 const introCopy=el('div','sv-doc-intro-copy');
 introCopy.append(el('strong','','Защищённые документы'),
  el('small','','Личные и деловые файлы раздельно. Шифрование на этом устройстве.'));
 intro.append(introCopy);
 host.append(intro);
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
 const storeActions=el('div','sv-doc-store-actions');
 storeActions.append(button('Добавить документ',()=>picker.click(),'sv-doc-primary'));
 storeActions.append(picker);
 host.append(storeActions);
 const feedback=el('p','sv-doc-selection-status');
 feedback.setAttribute('role','status');
 if(selected&&!stored[area])feedback.textContent='Выбран «'+selected.name+'». Откройте архив и подтвердите сохранение.';
 host.append(feedback);
 const archive=el('details','sv-doc-vault-shell');
 const summary=el('summary','sv-doc-vault-summary');
 summary.append(el('span','sv-doc-vault-title','Мой защищённый архив'),
  el('small','','Доступ по паролю · файлы зашифрованы'));
 const contents=el('div','sv-doc-vault');
 archive.append(summary,contents);
 archive.addEventListener('toggle',()=>{
  archiveExpanded=archive.open;
  if(!archive.open)return;
  window.SEYVEO_DOCUMENT_VAULT_UI?.mount?.(contents,{
   area,currentArea:()=>area,
   selectedFile:()=>stored[area]?null:files[area],
   savedFile(file){if(files[area]===file)stored[area]=true;},
   draft:()=>({title:'',text:''}),
   openFile(file,target){
    if(!names[target])return;
    files[target]=file;stored[target]=true;area=target;
    showPreview=true;archiveExpanded=true;draw();
   },
   clearSession(){reset();draw();}
  });
 });
 host.append(archive);
 archive.open=archiveExpanded;
 if(selected){
  const preview=el('details','sv-doc-file-review');
  preview.open=showPreview;
  const sum=el('summary','','Посмотреть выбранный файл');
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
 assistant.append(el('h2','sv-doc-assistant-title','Работа с документами — с Сэйви'));
 assistant.append(
  chatAction('Создать с Сэйви','Подготовить новый документ в чате','create',true),
  chatAction('Проверить или исправить','Откройте чат и приложите документ','review'));
 host.append(assistant);
 host.append(note('Архив хранится только в браузере на этом устройстве. При удалении данных браузера документы могут исчезнуть. Передача файлов в чат — только по вашему действию.'));
}
function openApprovals(recordId){
 area='business';view='flow';
 if(host)draw();
 if(typeof recordId==='string')window.SEYVEO_DOCUMENT_FLOW?.select?.(recordId);
 return true;
}
function mount(parent){
 reset();host=el('div','sv-doc-center');parent.append(host);draw();return true;
}
function destroy(){
 window.SEYVEO_DOCUMENT_VAULT?.lock?.();
 reset();host=null;
}
window.SEYVEO_DOCUMENT_CENTER=Object.freeze({mount,destroy,setArea,openApprovals});
})();
