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
 {id:'new',title:'Новая папка'},
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
const folderEntries=state=>[...categories.filter(x=>['device','scan','new','archive'].includes(x.id)),...ownFolders(state).map(x=>({id:x.id,title:x.name,custom:true,defaultFolder:x.defaultFolder===true}))];
const updateFolder=(state,category,patch)=>category.defaultFolder?localFiles().setDefaultFolder(state.options.area,category.id,patch):localFiles().update(state.options.area,category.id,patch);
function notice(state,text){state.folderCaption.textContent=text;}
function closeFolderMenu(state){state.folderMenu.hidden=true;state.folderMenu.replaceChildren();}
function revealOwnFolder(state,id){state.pendingFolder=id;void refresh();}
async function makeFolder(state){
 const name=window.prompt('Название папки','Новая папка');if(!name?.trim()||state!==active)return;
 try{const id=await localFiles().createFolder(state.options.area,name);if(state===active)revealOwnFolder(state,id);}catch(e){notice(state,e.message||'Не удалось создать папку.');}
}
function openFolderMenu(state,category){
 if(state!==active)return;
 closeFolderMenu(state);
 const menu=state.folderMenu;menu.hidden=false;
 const action=(label,fn,destructive=false)=>{const b=el('button','sv-doc-folder-menu-action'+(destructive?' sv-doc-folder-danger':''),label);b.type='button';b.addEventListener('click',async()=>{closeFolderMenu(state);try{await fn();}catch(e){notice(state,e.message||'Не удалось изменить папку.');}});menu.append(b);};
 action('Переименовать',async()=>{const name=window.prompt('Название папки',category.title);if(name?.trim())await updateFolder(state,category,{name});});
 action('В начало моих папок',async()=>{const own=ownFolders(state);const first=Math.min(...own.map(x=>x.order??x.createdAt));await updateFolder(state,category,{order:first-1});revealOwnFolder(state,category.id);});
 action('В конец моих папок',async()=>{const own=ownFolders(state);const last=Math.max(...own.map(x=>x.order??x.createdAt));await updateFolder(state,category,{order:last+1});revealOwnFolder(state,category.id);});
 action('Удалить папку',async()=>{
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
function paint(state){
 if(state!==active)return;
 const all=itemsFor(state);
 const filtered=all.filter(item=>(state.filter==='all'||inFolder(item,state.filter))&&
  (!state.query||item.name.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').includes(state.query.toLocaleLowerCase('ru-RU').replace(/ё/g,'е'))));
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
 state.showAll.textContent=state.filter==='all'&&state.expanded?'Свернуть':'Все файлы ›';
 state.showAll.setAttribute('aria-label',state.filter==='all'&&state.expanded?'Свернуть список документов':'Показать все документы');
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
  if(!locked)copy.append(el('small','','Добавьте файл'));
  empty.append(copy);
  const act=el('button','sv-doc-shelf-add',locked?'Открыть архив':'Добавить');
  act.type='button';
  act.setAttribute('aria-label',locked?'Открыть защищённый архив':'Добавить документ');
  act.addEventListener('click',()=>locked?openArchive(state):state.options.onPick?.());
  empty.append(act);
  state.recentGrid.append(empty);
 }else{
  for(const item of subset){
   const type=classify(item.name);
   const card=el('button','sv-doc-recent-card');
   card.type='button';
   card.setAttribute('aria-label','Открыть '+item.name);
   card.append(documentArt(type,formatOf(item.name)));
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
    const manage=async()=>{
     const folders=ownFolders(state).map(x=>({id:x.id,title:x.name}));
     const choices=folders.map((x,i)=>(i+1)+'. '+x.title).join('\n');
     const answer=window.prompt('Переместить в папку — введите номер. 0 — без папки. У — удалить локальную копию.\n'+choices);
     if(answer===null)return;
     try{
      if(answer.toLowerCase()==='у'){if(window.confirm('Удалить локальную копию файла?'))await localFiles().remove(state.options.area,item.id);}
      else if(answer==='0')await localFiles().update(state.options.area,item.id,{folder:''});
      else if(folders[Number(answer)-1])await localFiles().update(state.options.area,item.id,{folder:folders[Number(answer)-1].id});
     }catch(e){state.status.textContent=e.message||'Не удалось изменить файл.';}
    };
    card.addEventListener('contextmenu',e=>{e.preventDefault();void manage();});
    const wrap=el('div','sv-doc-local-file-wrap');const more=el('button','sv-doc-file-more','···');more.type='button';more.setAttribute('aria-label','Действия с файлом '+item.name);more.addEventListener('click',manage);wrap.append(card,more);state.recentGrid.append(wrap);
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
  entry.type='button';entry.setAttribute('aria-pressed',String(state.filter===category.id));
  entry.setAttribute('aria-label','Подборка '+category.title+(state.unlocked?', '+count+' файлов':''));
  entry.append(folderArt(category.id==='new'),el('strong','',category.title));
  if(category.id==='new')entry.setAttribute('aria-label','Создать новую пустую папку');
  if(state.unlocked)entry.title=count+' '+(count===1?'файл':count>=2&&count<=4?'файла':'файлов');
  let suppressClick=0;
  entry.addEventListener('click',()=>{
   if(state!==active||Date.now()<suppressClick)return;
   closeFolderMenu(state);
   if(category.id==='new'){void makeFolder(state);return;}
   if(category.id==='device'){state.options.onPick?.('all');return;}
   state.filter=category.id;state.expanded=true;paint(state);
   if(category.id==='archive'&&!state.unlocked)openArchive(state);
   else state.recent.scrollIntoView?.({block:'nearest',behavior:'smooth'});
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
   const wrap=el('div','sv-doc-custom-folder-wrap');
   const more=el('button','sv-doc-custom-folder-more','···');more.type='button';more.setAttribute('aria-label','Действия с папкой '+category.title);more.addEventListener('click',menu);
   wrap.append(entry,more);state.foldersGrid.append(wrap);
  }else state.foldersGrid.append(entry);
 }
 state.foldersGrid.scrollLeft=folderScroll;
 if(state.pendingFolder&&ownFolders(state).some(x=>x.id===state.pendingFolder)){
  const target=state.foldersGrid.querySelector('.sv-doc-folder-'+state.pendingFolder);
  if(target){const left=target.getBoundingClientRect().left-state.foldersGrid.getBoundingClientRect().left+state.foldersGrid.scrollLeft;state.foldersGrid.scrollLeft=Math.max(0,left);}
  state.pendingFolder=null;
 }
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
  if(state.filter!=='all'){state.filter='all';state.expanded=true;paint(state);return;}
  state.expanded=!state.expanded;paint(state);
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
 folderHeader.append(folderCaption);
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
 active.token++;active.records=[];active=null;
}
document.addEventListener('seyveo:documents-vault-changed',event=>{
 if(active&&(!event.detail?.area||event.detail.area===active.options.area))refresh();
});
document.addEventListener('seyveo:document-files-changed',event=>{if(active?.options.area===event.detail?.area)void refresh();});
window.addEventListener('pagehide',()=>{
 if(!active)return;
 active.token++;active.records=[];active.unlocked=false;paint(active);
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