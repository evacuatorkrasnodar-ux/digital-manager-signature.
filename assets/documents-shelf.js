/* SEYVEO Documents · real recent files and automatic type folders.
 * No sample files, cloud access, persisted plaintext filenames or fake folders.
 * Encrypted vault metadata is read only after explicit password unlock.
 */
(()=>{
'use strict';
const vault=()=>window.SEYVEO_DOCUMENT_VAULT;
const el=(tag,cls,value)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(value!==undefined)n.textContent=value;
 return n;
};
const localFiles=()=>window.SEYVEO_DOCUMENT_FILES;
const categories=[
 {id:'device',title:'На устройстве'},
 {id:'scan',title:'Сканы'},
 {id:'contracts',title:'Договоры'},
 {id:'projects',title:'Проекты'},
 {id:'clients',title:'Клиенты'},
 {id:'archive',title:'Архив'}
];
const examples=[
 {type:'pdf',format:'PDF',name:'Документ PDF'},
 {type:'word',format:'DOCX',name:'Документ Word'},
 {type:'images',format:'JPG',name:'Фотография'},
 {type:'sheets',format:'XLSX',name:'Таблица'}
];
const inFolder=(item,id)=>{
 if(id==='archive')return item.saved===true;
 if(id.startsWith('smart-')){
  if(!item.local)return false;
  if(id==='smart-partners')return Boolean(item.counterparty);
  if(id==='smart-due')return Boolean(item.dueDate)&&!['paid','closed'].includes(item.status);
  return docType(item)===id.slice(6);
 }
 if(['scan','created','device'].includes(id))return item.source===id;
 if(item.folder)return item.folder===id;
 const value=String(item.name||'').toLocaleLowerCase('ru-RU');
 if(id==='contracts')return /договор|контракт|соглашен|contract|agreement/.test(value);
 if(id==='projects')return /проект|project|бриф|brief|задач/.test(value);
 if(id==='clients')return /клиент|customer|client|заказчик/.test(value);
 return false;
};
const classify=name=>{
 const ext=String(name||'').split('.').pop().toLowerCase();
 if(ext==='pdf')return 'pdf';
 if(['doc','docx'].includes(ext))return 'word';
 if(['png','jpg','jpeg','webp','heic'].includes(ext))return 'images';
 if(['xls','xlsx','csv'].includes(ext))return 'sheets';
 return 'other';
};
const formatOf=name=>{
 const ext=String(name||'').split('.').pop().toUpperCase();
 return (['PDF','DOC','DOCX','PNG','JPG','JPEG','WEBP','XLS','XLSX','PPTX','TXT','MD'].includes(ext)?ext:'FILE').slice(0,5);
};
const dateOf=stamp=>{
 const d=new Date(Number(stamp)||0);
 if(!Number.isFinite(d.getTime())||d.getTime()===0)return 'Документ';
 const today=new Date();
 if(d.toDateString()===today.toDateString())return 'Сегодня, '+d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 const yesterday=new Date(today);yesterday.setDate(today.getDate()-1);
 if(d.toDateString()===yesterday.toDateString())return 'Вчера, '+d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
};
const svg=(paths,viewBox='0 0 64 72')=>{
 const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
 icon.setAttribute('viewBox',viewBox);
 icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');
 icon.innerHTML=paths;
 return icon;
};
function documentArt(type,label){
 const art=el('span','sv-doc-file-art sv-doc-file-art-'+type);
 art.append(svg('<path d="M15 5h26l12 12v47a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z" class="sv-doc-paper"/><path d="M41 5v12h12" class="sv-doc-fold"/><path d="M20 27h22M20 33h18M20 39h22" class="sv-doc-lines"/>'));
 art.append(el('span','sv-doc-format-label',label));
 return art;
}
function folderArt(plus=false){
 const art=el('span','sv-doc-folder-art');
 art.append(svg('<path d="M5 19a5 5 0 0 1 5-5h17l6 7h21a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" class="sv-doc-folder-back"/><path d="M5 30a5 5 0 0 1 5-5h44a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" class="sv-doc-folder-front"/>'+(plus?'<path d="M32 34v14M25 41h14" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round"/>':'')));
 return art;
}
let active=null;
// One small in-memory preview at a time; never decrypt the protected archive for thumbnails.
let previewQueue=Promise.resolve();
function schedulePdfPreview(state,item,card,art){
 if(item.saved||(!item.local&&!item.file))return;
 previewQueue=previewQueue.catch(()=>{}).then(async()=>{
  const current=()=>state===active&&card.isConnected;
  if(!current())return;
  const viewer=window.SEYVEO_DOCS_VIEWER;
  if(typeof viewer?.thumbnail!=='function')return;
  try{
   const file=item.local?await localFiles().get(state.options.area,item.id):item.file;
   if(!current())return;
   const canvas=await viewer.thumbnail(file,current);
   if(!canvas||!current())return;
   canvas.className='sv-doc-pdf-thumbnail';canvas.setAttribute('aria-hidden','true');
   art.classList.add('sv-doc-file-art-preview');art.querySelector('svg')?.remove();art.prepend(canvas);
  }catch{/* Keep the real format icon if preview is unavailable. */}
 });
}
const defaultIds=['contracts','projects','clients'];
const ownFolders=state=>{
 // No pre-created sample folders. Keep only legacy folders the user actually used.
 const defaults=categories.filter(x=>defaultIds.includes(x.id)).map((x,i)=>{
  const prefs=state.local.find(p=>p.kind==='folder-pref'&&p.target===x.id);
  const assigned=state.local.some(p=>p.kind==='file'&&p.folder===x.id);
  if(!assigned&&!prefs?.name&&!Number.isFinite(prefs?.order))return null;
  return {id:x.id,name:prefs?.name||x.title,createdAt:i,order:prefs?.order??i,hidden:prefs?.hidden===true,defaultFolder:true};
 }).filter(Boolean);
 return [...defaults,...state.local.filter(x=>x.kind==='folder')].filter(x=>!x.hidden).sort((a,b)=>(a.order??a.createdAt)-(b.order??b.createdAt)||a.id.localeCompare(b.id));
};
const docType=item=>item.docType||localFiles()?.inferDocumentType?.(item.name)||'other';
const smartFolders=state=>{
 const files=state.local.filter(x=>x.kind==='file');
 const types=localFiles()?.docTypes||{};
 const output=Object.entries(types).filter(([id])=>id!=='other'&&files.some(x=>docType(x)===id)).map(([id,title])=>({id:'smart-'+id,title,smart:true}));
 if(files.some(x=>x.counterparty))output.push({id:'smart-partners',title:'Контрагенты',smart:true});
 if(files.some(x=>x.dueDate&&!['paid','closed'].includes(x.status)))output.push({id:'smart-due',title:'Со сроком',smart:true});
 return output;
};
const folderEntries=state=>[...categories.filter(x=>['device','scan','archive'].includes(x.id)),...ownFolders(state).map(x=>({id:x.id,title:x.name,custom:true,defaultFolder:x.defaultFolder===true})),...smartFolders(state)];
const updateFolder=(state,category,patch)=>category.defaultFolder?localFiles().setDefaultFolder(state.options.area,category.id,patch):localFiles().update(state.options.area,category.id,patch);
function notice(state,text){state.folderCaption.textContent=text;}
function closeFolderMenu(state){state.folderMenu.hidden=true;state.folderMenu.replaceChildren();}
function revealOwnFolder(state,id){state.pendingFolder=id;void refresh();}
// Naming is a real app sheet, not a browser prompt. The encrypted storage
// API remains the only writer; failed saves leave the draft name in place.
function editFolderName(state,category=null){
 if(state!==active||state.folderEditor?.open)return;
 const dlg=el('dialog','sv-doc-my-templates sv-doc-folder-name-sheet');
 state.folderEditor=dlg;
 const title=category?'Переименовать папку':'Новая папка';
 dlg.setAttribute('aria-label',title);
 const head=el('header','sv-doc-my-template-head');
 const back=el('button','sv-doc-my-template-back');back.type='button';back.setAttribute('aria-label','Назад');
 back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 back.addEventListener('click',()=>dlg.close());
 head.append(back,el('strong','',title));
 const form=el('form','sv-doc-my-template-content sv-doc-folder-name-form');
 const field=el('input','sv-doc-my-template-input');field.type='text';field.maxLength=60;
 field.placeholder='Название папки';field.setAttribute('aria-label','Название папки');field.value=category?.title||'';
 field.autocomplete='off';field.setAttribute('enterkeyhint','done');
 const save=el('button','sv-doc-my-template-primary',category?'Сохранить':'Создать');save.type='submit';
 const feedback=el('small','sv-doc-my-template-note');feedback.setAttribute('role','status');
 let saving=false;
 function sync(){save.disabled=saving||!field.value.trim();}
 field.addEventListener('input',sync);
 dlg.addEventListener('cancel',event=>{if(saving)event.preventDefault();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();const name=field.value.trim();
  if(saving||!name||state!==active)return;
  saving=true;field.readOnly=true;back.disabled=true;sync();feedback.textContent='';
  try{
   const id=category?category.id:await localFiles().createFolder(state.options.area,name);
   if(category)await updateFolder(state,category,{name});
   if(dlg.open)dlg.close();
   if(state===active)revealOwnFolder(state,id);
  }catch(error){feedback.textContent=error.message||'Не удалось сохранить папку.';}
  finally{saving=false;field.readOnly=false;back.disabled=false;sync();}
 });
 form.append(field,save,feedback);dlg.append(head,form);
 state.foldersGrid.parentElement.append(dlg);
 dlg.addEventListener('close',()=>{if(state.folderEditor===dlg)state.folderEditor=null;dlg.remove();},{once:true});
 sync();dlg.showModal();field.focus();if(category)field.select();
}
function makeFolder(state){editFolderName(state);}
function actionIcon(kind){const mark=el('span','sv-doc-menu-icon');mark.setAttribute('aria-hidden','true');mark.innerHTML=window.SEYVEO_DOCUMENT_ICONS?.markup(kind)||'';return mark;}
function openFolderMenu(state,category){
 if(state!==active)return;
 closeFolderMenu(state);
 const menu=state.folderMenu;menu.hidden=false;
 const action=(label,kind,fn,destructive=false)=>{const b=el('button','sv-doc-folder-menu-action'+(destructive?' sv-doc-folder-danger':''));b.append(actionIcon(kind),el('span','',label));b.type='button';b.addEventListener('click',async()=>{closeFolderMenu(state);try{await fn();}catch(e){notice(state,e.message||'Не удалось изменить папку.');}});menu.append(b);};
 action('Переименовать','rename',()=>editFolderName(state,category));
 const move=el('button','sv-doc-folder-menu-action');move.type='button';move.append(actionIcon('first'),el('span','','Переместить'));move.setAttribute('aria-expanded','false');
 move.addEventListener('click',()=>{
  menu.replaceChildren();menu.hidden=false;
  const back=el('button','sv-doc-folder-menu-action');back.type='button';back.append(actionIcon('back'),el('span','','Назад'));back.addEventListener('click',()=>openFolderMenu(state,category));menu.append(back);
  action('В начало','first',async()=>{const own=ownFolders(state);const first=Math.min(...own.map(x=>x.order??x.createdAt));await updateFolder(state,category,{order:first-1});revealOwnFolder(state,category.id);});
  action('В конец','last',async()=>{const own=ownFolders(state);const last=Math.max(...own.map(x=>x.order??x.createdAt));await updateFolder(state,category,{order:last+1});revealOwnFolder(state,category.id);});
  back.focus({preventScroll:true});
 });menu.append(move);
 action('Удалить папку','delete',async()=>{
  if(category.defaultFolder){
   if(!window.confirm('Удалить папку «'+category.title+'» из списка? Документы останутся в «Все файлы».'))return;
   await updateFolder(state,category,{hidden:true});
  }else{
   if(!window.confirm('Удалить пустую папку «'+category.title+'»?'))return;
   await localFiles().removeFolder(state.options.area,category.id);
  }
  if(state.filter===category.id){state.filter='all';state.expanded=false;paint(state);}
 },true);
}
function openArchive(state){
 if(state!==active)return;
 state.options.onArchive?.();
}
function itemsFor(state){
 const records=state.unlocked?state.records.map(item=>({
  id:item.id,name:item.name,createdAt:item.createdAt,saved:true
 })):[];
 records.push(...state.local.filter(item=>item.kind==='file').map(item=>({...item,local:true,saved:false})));
 const selected=state.options.getSelected?.();
 if(selected instanceof File&&!records.some(item=>item.local&&item.name===selected.name&&item.size===selected.size)){
  records.unshift({id:'selected',name:selected.name,createdAt:Date.now(),saved:false,file:selected});
 }
 return records.sort((a,b)=>b.createdAt-a.createdAt);
}
function openDocumentDetails(state,item){
 if(state!==active||!item.local)return;
 const api=localFiles(),area=state.options.area;
 const dlg=el('dialog','sv-doc-my-templates sv-doc-professional-details');
 const head=el('header','sv-doc-my-template-head');
 const pickers=window.SEYVEO_DOCUMENT_PICKERS;
 const back=pickers.backButton(()=>dlg.close());back.classList.add('sv-doc-my-template-back');
 head.append(back,el('strong','','О документе'));
 const content=el('div','sv-doc-my-template-content');
 const feedback=el('small','sv-doc-my-template-note');feedback.setAttribute('role','status');
 const form=el('form','sv-doc-document-fields');
 const field=(label,control,kind,parent=form)=>{
  const node=el(control.tagName==='BUTTON'?'div':'label','sv-doc-document-field');
  const title=el('span','sv-doc-detail-label');
  const glyphs={
   building:'<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 8h.1M15 8h.1M9 12h.1M15 12h.1M10 20v-4h4v4"/>',
   hash:'<path d="M10 4 6 20M18 4l-4 16M4 9h16M3 15h16"/>',
   calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4m8-4v4M4 10h16M8 14h1m3 0h1m3 0h1"/>',
   history:'<path d="M3.5 11a8.5 8.5 0 1 1 3 7.5M3.5 5v6h6M12 7v5l3 2"/>'
  };
  const mark=glyphs[kind]?el('span','sv-doc-detail-icon'):actionIcon(kind);
  if(glyphs[kind]){mark.setAttribute('aria-hidden','true');mark.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+glyphs[kind]+'</svg>';}
  mark.classList.add('sv-doc-detail-icon');
  title.append(mark,el('span','',label));node.append(title,control);parent.append(node);return control;
 };
 const select=(label,values,initial)=>pickers.choice(label,values,initial);
 const input=(value,max,type='text')=>{const n=el('input','');n.type=type;n.value=value||'';n.placeholder='Указать';if(max)n.maxLength=max;return n;};
 const type=field('Категория',select('Категория',Object.entries(api.docTypes).map(([key,label])=>[key,key==='other'?'Прочее':label]),docType(item)),'original');
 const folder=field('Папка',select('Папка',[['','Все файлы'],...ownFolders(state).map(x=>[x.id,x.name])],item.folder||''),'archive');
 const counterparty=field('Контрагент',input(item.counterparty,120),'building');
 const ref=field('Номер договора',input(item.reference,100),'hash');
 const due=field('Важная дата',pickers.date('Важная дата',item.dueDate,'Не задана',area),'calendar');
 due.classList.add('sv-doc-detail-date');
 const extra=el('details','sv-doc-version-history sv-doc-detail-extra');
 const extraTitle=el('summary','');extraTitle.append(actionIcon('info'),el('span','','Дополнительные сведения'));extra.append(extraTitle);
 const status=field('Состояние документа',select('Состояние документа',[['','Не указано'],['draft','Черновик'],['ready','Подготовлен'],['sent','Отправлен'],['signed','Подписан'],['paid','Оплачен'],['closed','Закрыт']],item.status||''),'check',extra);
 extra.append(el('small','sv-doc-my-template-note','Ручная отметка не подтверждает подпись или оплату.'));
 form.append(extra);
 const action=(name,fn,cls='sv-doc-my-template-option')=>{const n=el('button',cls,name);n.type='button';n.addEventListener('click',fn);return n;};
 const save=action('',async()=>{if(save.disabled)return;save.disabled=true;back.disabled=true;feedback.textContent='';try{
  await api.updateDocument(area,item.id,{docType:type.value,counterparty:counterparty.value,reference:ref.value,dueDate:due.value,status:status.value});
  if(folder.value!==(item.folder||''))await api.update(area,item.id,{folder:folder.value});
  dlg.close();
 }catch(e){feedback.textContent=e.message||'Не удалось сохранить сведения.';feedback.scrollIntoView({block:'nearest'});}finally{save.disabled=false;back.disabled=false;}
 },'sv-doc-picker-round sv-doc-detail-save');
 save.setAttribute('aria-label','Сохранить сведения');save.title='Сохранить сведения';save.append(actionIcon('check'));head.append(save);
 form.addEventListener('submit',e=>e.preventDefault());
 const history=el('details','sv-doc-version-history');const historyTitle=el('summary','');historyTitle.append(actionIcon('history'),el('span','','История версий'));history.append(historyTitle);
 const versions=el('div','sv-doc-my-template-list');
 for(const v of [...(item.versions||[])].reverse()){
  versions.append(action('Версия '+v.version+' · '+dateOf(v.at),async()=>{try{const f=await api.getVersion(area,item.id,v.version);const url=URL.createObjectURL(f);const a=el('a','');a.href=url;a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){feedback.textContent=e.message;}}));
 }
 if(!item.versions?.length)versions.append(el('small','sv-doc-my-template-note','Предыдущих версий пока нет.'));
 const picker=el('input','');picker.type='file';picker.accept='.pdf,.docx,.xlsx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp';picker.hidden=true;
 picker.addEventListener('change',async()=>{const f=picker.files?.[0];if(!f)return;try{if(!/\.(pdf|docx|xlsx|pptx|txt|md|png|jpe?g|webp)$/i.test(f.name))throw Error('Неподдерживаемый формат.');if(!window.confirm('Добавить новую версию? Предыдущая версия останется в истории.'))return;await api.addVersion(area,item.id,f);dlg.close();}catch(e){feedback.textContent=e.message;}finally{picker.value='';}});
 const addVersion=action('',()=>picker.click(),'sv-doc-my-template-option sv-doc-detail-add-version');
 const plus=el('span','sv-doc-detail-icon');plus.setAttribute('aria-hidden','true');plus.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
 addVersion.append(plus,el('span','','Добавить новую версию'));versions.append(addVersion,picker);history.append(versions);
 const identity=el('div','sv-doc-detail-identity');identity.append(documentArt(classify(item.name),formatOf(item.name)),el('strong','sv-doc-document-name',item.name),el('small','',formatOf(item.name)+' · '+dateOf(item.createdAt)));
 content.append(feedback,form,history,action('Удалить документ',async()=>{if(!window.confirm('Удалить локальный документ и его версии?'))return;try{await api.remove(area,item.id);dlg.close();}catch(e){feedback.textContent=e.message;}},'sv-doc-my-template-delete'));
 dlg.append(head,identity,content);(state.folderPage?.dialog.open?state.folderPage.dialog:state.recent).append(dlg);dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.showModal();
}
// Folder contents are a separate sheet. The home shelf is never filtered by opening a folder.
function paintFolder(state){
 const folder=state.folderPage;
 if(!folder?.dialog.open||state!==active)return;
 const category=folder.category.id==='all'?folder.category:folderEntries(state).find(x=>x.id===folder.category.id);
 if(!category){folder.dialog.close();return;}
 folder.title.textContent=category.title;
 const items=itemsFor(state).filter(item=>category.id==='all'||inFolder(item,category.id));
 const scroll=folder.body.scrollTop;folder.list.replaceChildren();
 if(!items.length){
  const empty=el('div','sv-doc-folder-page-empty');
  empty.append(folderArt(),el('strong','','В папке пока пусто'),el('small','',category.id==='scan'?'Новые сканы появятся здесь':'Документы появятся здесь'));
  if(category.id==='all'){empty.querySelector('strong').textContent='Пока нет документов';}
  folder.list.append(empty);
 }
 for(const item of items){
  const row=el('div','sv-doc-folder-file-row');
  const open=el('button','sv-doc-folder-file-open');open.type='button';open.setAttribute('aria-label','Открыть '+item.name);
  const type=classify(item.name),art=documentArt(type,formatOf(item.name));
  const copy=el('span','sv-doc-folder-file-copy');copy.append(el('strong','',item.name),el('small','',dateOf(item.createdAt)));
  open.append(art,copy);row.append(open);
  if(type==='pdf')schedulePdfPreview(state,item,open,art);
  open.addEventListener('click',async()=>{
   if(state!==active||!folder.dialog.open||folder.busy)return;
   folder.busy=true;open.disabled=true;folder.status.textContent='';
   try{
    const file=item.local?await localFiles().get(state.options.area,item.id):item.saved?await vault()?.getFile(state.options.area,item.id):item.file;
    if(state===active&&folder.dialog.open&&file instanceof File)state.options.onOpenFile?.(file,!!item.saved,true);
   }catch(e){if(state===active&&folder.dialog.open)folder.status.textContent=e.message||'Не удалось открыть документ.';}
   finally{folder.busy=false;open.disabled=false;}
  });
  if(item.local){
   const manage=()=>openDocumentDetails(state,item);
   open.addEventListener('contextmenu',e=>{e.preventDefault();manage();});
   const more=el('button','sv-doc-folder-file-more');more.type='button';more.setAttribute('aria-label','Действия с файлом '+item.name);more.append(actionIcon('more'));more.addEventListener('click',manage);row.append(more);
  }
  folder.list.append(row);
 }
 folder.body.scrollTop=scroll;
}
function openFolderPage(state,category,trigger){
 if(state!==active||state.folderPage?.dialog.open)return;
 const dialog=el('dialog','sv-doc-archive-sheet sv-doc-folder-page');
 dialog.setAttribute('aria-label',category.title);
 const head=el('header','sv-doc-scanner-head');
 const grip=el('div','sv-doc-picker-grip');grip.setAttribute('aria-hidden','true');
 const back=window.SEYVEO_DOCUMENT_PICKERS.backButton(()=>dialog.close());back.classList.add('sv-doc-scanner-round');
 const title=el('strong','',category.title);head.append(grip,back,title);
 const body=el('div','sv-doc-archive-body sv-doc-folder-page-body');
 const list=el('div','sv-doc-folder-page-list');
 const status=el('p','sv-doc-folder-page-status');status.setAttribute('role','status');
 body.append(list,status);dialog.append(head,body);state.recent.parentElement.append(dialog);
 state.folderPage={dialog,category,title,body,list,status,busy:false};
 dialog.addEventListener('close',()=>{
  if(state.folderPage?.dialog===dialog)state.folderPage=null;
  dialog.remove();
  if(state===active){
   const target=trigger?.isConnected?trigger:category.id==='all'?state.showAll:state.foldersGrid.querySelector('.sv-doc-folder-'+category.id);
   target?.focus?.({preventScroll:true});
  }
 },{once:true});
 window.SEYVEO_SHEET_NAVIGATION?.attach(head,null,()=>dialog.close());
 dialog.showModal();paintFolder(state);
}
function paint(state){
 if(state!==active)return;
 const all=itemsFor(state);
 if(state.filter.startsWith('smart-')&&!smartFolders(state).some(x=>x.id===state.filter))state.filter='all';
 const normalize=value=>String(value||'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
 const filtered=all.filter(item=>(state.filter==='all'||inFolder(item,state.filter))&&
  (!state.query||normalize([item.name,item.local?item.counterparty:'',item.local?item.reference:'',item.local?item.searchText:''].join(' ')).includes(normalize(state.query))));
 const subset=state.expanded?filtered:filtered.slice(0,4);
 const recentScroll=state.recentGrid.scrollLeft;
 state.recentGrid.replaceChildren();
 // Sample icons are a format picker, not invented 'recent documents'.
 const showingFormats=!subset.length&&!state.query&&state.filter==='all'&&!state.expanded&&(!state.unlocked||all.length===0);
 // The document toolbar already has one Add action. Hide the four sample-format
 // buttons when there are no real recents; keep real files, search and folders.
 if(state.recent){
  state.recent.hidden=showingFormats;
  // Older Documents CSS forces display:grid even on a hidden shelf.
  // Inline override ensures placeholder format tiles NEVER leak on iPhone.
  if(showingFormats)state.recent.style.setProperty('display','none','important');
  else state.recent.style.removeProperty('display');
 }
 state.recentTitle.textContent=state.filter==='all'?(state.expanded?'Все файлы':'Недавние'):(folderEntries(state).find(x=>x.id===state.filter)?.title||'Файлы');
 const hasMore=filtered.length>4;
 state.showAll.textContent='Все файлы ›';
 state.showAll.setAttribute('aria-label','Показать все документы');
 if(showingFormats&&state.unlocked){
  for(const example of examples){
   const card=el('button','sv-doc-recent-card sv-doc-example-card');
   card.type='button';
   card.setAttribute('aria-label','Добавить '+example.format);
   card.append(documentArt(example.type,example.format),
    el('strong','sv-doc-recent-name',example.name));
   card.addEventListener('click',()=>state.options.onPick?.(example.type));
   state.recentGrid.append(card);
  }
 }else if(showingFormats&&!state.unlocked){
  for(const example of examples){
   const card=el('button','sv-doc-recent-card sv-doc-example-card');
   card.type='button';card.setAttribute('aria-label','Выбрать файл '+example.format);
   card.append(documentArt(example.type,example.format),
    el('strong','sv-doc-recent-name',example.name));
   card.addEventListener('click',()=>state.options.onPick?.(example.type));
   state.recentGrid.append(card);
  }
 }else if(!subset.length){
  const empty=el('div','sv-doc-recents-empty');
  empty.append(documentArt('empty',''));
  const copy=el('span','sv-doc-recents-empty-copy');
  const filteredName=folderEntries(state).find(x=>x.id===state.filter)?.title;
  // The locked vault does not reveal whether files exist.
  const locked=!state.unlocked&&state.filter==='archive';
  if(locked)empty.classList.add('sv-doc-recents-locked');
  copy.append(el('strong','',locked?'Архив закрыт'
   :filteredName?'В папке «'+filteredName+'» пусто':'Пока нет документов'));
  if(!locked)copy.append(el('small','',state.filter==='scan'?'Новые сканы появятся здесь':'Добавьте файл через верхнюю панель'));
  empty.append(copy);
  // Scanner and Add already live in the toolbar; only the locked archive
  // needs its own action because opening it is a separate protected flow.
  if(locked){
   const act=el('button','sv-doc-shelf-add','Открыть архив');
   act.type='button';
   act.setAttribute('aria-label','Открыть защищённый архив');
   act.addEventListener('click',()=>openArchive(state));
   empty.append(act);
  }
  state.recentGrid.append(empty);
 }else{
  for(const item of subset){
   const type=classify(item.name);
   const card=el('button','sv-doc-recent-card');
   card.type='button';
   card.setAttribute('aria-label','Открыть '+item.name);
   const art=documentArt(type,formatOf(item.name));card.append(art);
   if(type==='pdf')schedulePdfPreview(state,item,card,art);
   const fileName=el('strong','sv-doc-recent-name',item.name);
   fileName.title=item.name;
   const detail=el('small','sv-doc-recent-date',item.saved||item.local?dateOf(item.createdAt):'Не сохранён');
   card.append(fileName,detail);
   card.addEventListener('click',async()=>{
    if(state!==active)return;
    if(!item.saved&&!item.local){state.options.onOpenFile?.(item.file,false);return;}
    card.disabled=true;
    state.status.textContent='Открываем документ…';
    try{
     const f=item.local?await localFiles().get(state.options.area,item.id):await vault()?.getFile(state.options.area,item.id);
     if(state!==active)return;
     state.status.textContent='';
     state.options.onOpenFile?.(f,!item.local);
    }catch(err){
     if(state!==active)return;
     state.status.textContent=err?.message||'Не удалось открыть файл.';
     card.disabled=false;
     refresh();
    }
   });
   if(item.local){
    const manage=()=>openDocumentDetails(state,item);
    card.addEventListener('contextmenu',e=>{e.preventDefault();void manage();});
    const wrap=el('div','sv-doc-local-file-wrap');const more=el('button','sv-doc-file-more');more.append(actionIcon('more'));more.type='button';more.setAttribute('aria-label','Действия с файлом '+item.name);more.addEventListener('click',manage);wrap.append(card,more);state.recentGrid.append(wrap);
   }else state.recentGrid.append(card);
  }
 }
 state.recentGrid.scrollLeft=recentScroll;
 // Keep a stable «Все файлы» destination even with just one document.
 // It opens the protected archive when there are no more tiles to expand.
 state.showAll.hidden=false;
 // Repainting after selecting a folder must not jump the swipe row back to start.
 const folderScroll=state.foldersGrid.scrollLeft;
 state.foldersGrid.replaceChildren();
 for(const category of folderEntries(state)){
  const count=all.filter(item=>category.id==='all'||inFolder(item,category.id)).length;
  const entry=el('button','sv-doc-folder-card sv-doc-folder-'+category.id);
  entry.type='button';entry.setAttribute('aria-haspopup','dialog');
  entry.setAttribute('aria-label','Подборка '+category.title+(state.unlocked?', '+count+' файлов':''));
  const folderName=el('strong','',category.title);folderName.title=category.title;
  entry.append(folderArt(),folderName);
  if(category.smart){entry.classList.add('sv-doc-smart-folder');entry.title='Умная подборка · '+count;}
  if(state.unlocked)entry.title=count+' '+(count===1?'файл':count>=2&&count<=4?'файла':'файлов');
  let suppressClick=0;
  entry.addEventListener('click',()=>{
   if(state!==active||Date.now()<suppressClick)return;
   closeFolderMenu(state);
   if(category.id==='device'){state.options.onPick?.('all');return;}
   if(category.id==='archive'){openArchive(state);return;}
   openFolderPage(state,category,entry);
  });
  if(category.custom){
   entry.setAttribute('aria-haspopup','true');
   const menu=()=>{suppressClick=Date.now()+650;openFolderMenu(state,category);};
   entry.addEventListener('contextmenu',e=>{e.preventDefault();menu();});
   entry.addEventListener('keydown',e=>{if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();menu();}});
   let timer=0,start=null;
   const cancel=()=>{clearTimeout(timer);timer=0;start=null;};
   entry.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;cancel();start={x:e.clientX,y:e.clientY};timer=setTimeout(()=>{timer=0;menu();},550);});
   entry.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)cancel();});
   for(const event of ['pointerup','pointercancel','pointerleave'])entry.addEventListener(event,cancel);
   entry.setAttribute('aria-description','Долгое нажатие или Shift+F10: действия с папкой');
   entry.style.webkitTouchCallout='none';
  }
  state.foldersGrid.append(entry);
 }
 state.foldersGrid.scrollLeft=folderScroll;
 if(state.pendingFolder&&ownFolders(state).some(x=>x.id===state.pendingFolder)){
  const target=state.foldersGrid.querySelector('.sv-doc-folder-'+state.pendingFolder);
  if(target){const left=target.getBoundingClientRect().left-state.foldersGrid.getBoundingClientRect().left+state.foldersGrid.scrollLeft;state.foldersGrid.scrollLeft=Math.max(0,left);}
  state.pendingFolder=null;
 }
 paintFolder(state);
}

async function refresh(){
 const state=active;if(!state)return;
 const token=++state.token;
 // Never display metadata from the previous unlocked session while checking.
 state.records=[];state.unlocked=false;paint(state);
 try{const local=await localFiles()?.list(state.options.area)||[];if(state!==active||token!==state.token)return;state.local=local;paint(state);}catch(e){if(state===active&&token===state.token)state.status.textContent='Не удалось прочитать локальные файлы.';}
 try{
  const module=vault();
  if(!module)return;
  const status=await module.status();
  if(state!==active||token!==state.token)return;
  if(status.unlocked){
   const records=await module.list(state.options.area);
   if(state!==active||token!==state.token)return;
   state.records=records;state.unlocked=true;
  }
  paint(state);
 }catch{
  if(state!==active||token!==state.token)return;
  state.records=[];state.unlocked=false;paint(state);
 }
}
function mount(parent,options={}){
 if(!parent)return false;
 destroy();
 const state={options,token:0,filter:'all',query:'',expanded:false,unlocked:false,records:[],local:[]};
 active=state;
 const recent=el('section','sv-doc-shelf sv-doc-recents');
 const header=el('div','sv-doc-shelf-heading');
 const recentTitle=el('h2','','Недавние');
 header.append(recentTitle);
 const showAll=el('button','sv-doc-shelf-more','Все файлы ›');
 showAll.type='button';
 showAll.addEventListener('click',()=>{
  if(state!==active)return;
  if(state.query){state.query='';state.filter='all';state.expanded=false;paint(state);}
  openFolderPage(state,{id:'all',title:'Все файлы'},showAll);
 });
 header.append(showAll);
 const recentGrid=el('div','sv-doc-recent-grid');
 recentGrid.setAttribute('role','region');
 recentGrid.setAttribute('aria-label','Карточки форматов и документы, листайте горизонтально');
 recentGrid.tabIndex=0;
 const status=el('p','sv-doc-recent-status');status.setAttribute('role','status');
 recent.append(header,recentGrid,status);
 const folders=el('section','sv-doc-shelf sv-doc-folders');
 const folderHeader=el('div','sv-doc-shelf-heading');
 folderHeader.append(el('h2','','Папки'));
 const folderCaption=el('small','sv-doc-folder-caption','');
 const addFolder=el('button','sv-doc-folder-add');addFolder.type='button';addFolder.setAttribute('aria-label','Создать новую папку');addFolder.title='Новая папка';addFolder.append(svg('<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>','0 0 24 24'));addFolder.addEventListener('click',()=>{if(state===active)void makeFolder(state);});
 folderHeader.append(folderCaption,addFolder);
 const foldersGrid=el('div','sv-doc-folders-grid');
 foldersGrid.setAttribute('role','region');
 foldersGrid.setAttribute('aria-label','Папки документов, листайте горизонтально');
 foldersGrid.tabIndex=0;
 const folderMenu=el('div','sv-doc-folder-menu sv-menu-surface');folderMenu.hidden=true;folderMenu.setAttribute('role','group');folderMenu.setAttribute('aria-label','Действия с папкой');
 folders.append(folderHeader,foldersGrid,folderMenu);
 folders.addEventListener('keydown',e=>{if(e.key==='Escape')closeFolderMenu(state);});
 foldersGrid.addEventListener('scroll',()=>closeFolderMenu(state),{passive:true});
 parent.append(recent,folders);
 Object.assign(state,{recent,recentTitle,showAll,recentGrid,status,foldersGrid,folderCaption,folderMenu});
 refresh();
 return true;
}
function destroy(){
 if(!active)return;
 const state=active;active=null;state.token++;state.records=[];if(state.folderEditor?.open)state.folderEditor.close();if(state.folderPage?.dialog.open)state.folderPage.dialog.close();
}
document.addEventListener('seyveo:documents-vault-changed',event=>{
 if(active&&(!event.detail?.area||event.detail.area===active.options.area))refresh();
});
document.addEventListener('seyveo:document-files-changed',event=>{if(active?.options.area===event.detail?.area)void refresh();});
window.addEventListener('pagehide',()=>{
 if(!active)return;
 active.token++;active.records=[];active.unlocked=false;if(active.folderPage?.dialog.open)active.folderPage.dialog.close();paint(active);
});
window.addEventListener('pageshow',()=>{if(active)refresh();});
function search(query){
 const state=active;if(!state)return;
 state.query=String(query||'').trim();
 state.filter='all';state.expanded=!!state.query;paint(state);
 if(state.query)state.recentGrid.scrollIntoView?.({block:'nearest',behavior:'smooth'});
}
window.SEYVEO_DOCUMENT_SHELF=Object.freeze({mount,refresh,destroy,search});
})();