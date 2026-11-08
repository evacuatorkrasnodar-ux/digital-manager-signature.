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
const categories=[
 {id:'contracts',title:'Договоры'},
 {id:'projects',title:'Проекты'},
 {id:'clients',title:'Клиенты'},
 {id:'all',title:'Архив'}
];
const examples=[
 {type:'pdf',format:'PDF',name:'Документ PDF'},
 {type:'word',format:'DOCX',name:'Документ Word'},
 {type:'images',format:'JPG',name:'Фотография'},
 {type:'sheets',format:'XLSX',name:'Таблица'}
];
const inFolder=(name,id)=>{
 if(id==='all')return true;
 const value=String(name||'').toLocaleLowerCase('ru-RU');
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
function folderArt(){
 const art=el('span','sv-doc-folder-art');
 art.append(svg('<path d="M5 19a5 5 0 0 1 5-5h17l6 7h21a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" class="sv-doc-folder-back"/><path d="M5 30a5 5 0 0 1 5-5h44a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" class="sv-doc-folder-front"/>'));
 return art;
}
let active=null;
function openArchive(state){
 if(state!==active)return;
 state.options.onArchive?.();
}
function itemsFor(state){
 const records=state.unlocked?state.records.map(item=>({
  id:item.id,name:item.name,createdAt:item.createdAt,saved:true
 })):[];
 const selected=state.options.getSelected?.();
 if(selected instanceof File){
  records.unshift({id:'selected',name:selected.name,createdAt:Date.now(),saved:false,file:selected});
 }
 return records.sort((a,b)=>b.createdAt-a.createdAt);
}
function paint(state){
 if(state!==active)return;
 const all=itemsFor(state);
 const filtered=all.filter(item=>(state.filter==='all'||inFolder(item.name,state.filter))&&
  (!state.query||item.name.toLocaleLowerCase('ru-RU').includes(state.query.toLocaleLowerCase('ru-RU'))));
 const subset=state.expanded?filtered:filtered.slice(0,4);
 state.recentGrid.replaceChildren();
 const hasMore=filtered.length>4;
 state.showAll.textContent=state.expanded?'Свернуть':'Все файлы ›';
 state.showAll.setAttribute('aria-label',state.expanded?'Свернуть список документов':'Показать все документы');
 if(!subset.length&&state.unlocked&&all.length===0&&!state.query&&state.filter==='all'){
  const samples=el('div','sv-doc-format-examples');
  const caption=el('p','sv-doc-example-note','Примеры форматов · откройте архив или добавьте документ');
  state.recentGrid.append(caption);
  for(const example of examples){
   const card=el('button','sv-doc-recent-card sv-doc-example-card');
   card.type='button';
   card.setAttribute('aria-label','Добавить '+example.format);
   card.append(documentArt(example.type,example.format),
    el('strong','sv-doc-recent-name',example.name),
    el('small','sv-doc-recent-date','Добавить файл'));
   card.addEventListener('click',()=>state.options.onPick?.());
   state.recentGrid.append(card);
  }
 }else if(!subset.length&&!state.unlocked&&!state.query&&state.filter==='all'){
  state.recentGrid.append(el('p','sv-doc-example-note','Примеры форматов · защищённые файлы появятся после ввода пароля'));
  for(const example of examples){
   const card=el('button','sv-doc-recent-card sv-doc-example-card');
   card.type='button';card.setAttribute('aria-label','Открыть архив для '+example.format);
   card.append(documentArt(example.type,example.format),
    el('strong','sv-doc-recent-name',example.name),
    el('small','sv-doc-recent-date','Пример · открыть'));
   card.addEventListener('click',()=>openArchive(state));
   state.recentGrid.append(card);
  }
 }else if(!subset.length){
  const empty=el('div','sv-doc-recents-empty');
  empty.append(documentArt('empty',''));
  const copy=el('span','sv-doc-recents-empty-copy');
  const filteredName=categories.find(x=>x.id===state.filter)?.title;
  // A locked vault has unknown contents: never falsely say a folder is empty.
  const locked=!state.unlocked;
  copy.append(el('strong','',locked
   ?'Документы под защитой'
   :filteredName?'В подборке «'+filteredName+'» пока пусто':'Здесь будут ваши документы'),
   el('small','',locked
    ?'Откройте архив, чтобы увидеть сохранённые файлы.'
    :'Добавьте файл или создайте документ.'));
  empty.append(copy);
  const act=el('button','sv-doc-shelf-add',locked?'Открыть':'Добавить');
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
   const detail=el('small','sv-doc-recent-date',item.saved?dateOf(item.createdAt):'Не сохранён');
   card.append(fileName,detail);
   card.addEventListener('click',async()=>{
    if(state!==active)return;
    if(!item.saved){state.options.onOpenFile?.(item.file,false);return;}
    card.disabled=true;
    state.status.textContent='Открываем документ…';
    try{
     const f=await vault()?.getFile(state.options.area,item.id);
     if(state!==active)return;
     state.status.textContent='';
     state.options.onOpenFile?.(f,true);
    }catch(err){
     if(state!==active)return;
     state.status.textContent=err?.message||'Не удалось открыть файл.';
     card.disabled=false;
     refresh();
    }
   });
   state.recentGrid.append(card);
  }
 }
 // Keep a stable «Все файлы» destination even with just one document.
 // It opens the protected archive when there are no more tiles to expand.
 state.showAll.hidden=false;
 state.foldersGrid.replaceChildren();
 for(const category of categories){
  const count=all.filter(item=>inFolder(item.name,category.id)).length;
  const entry=el('button','sv-doc-folder-card sv-doc-folder-'+category.id);
  entry.type='button';entry.setAttribute('aria-pressed',String(state.filter===category.id));
  entry.setAttribute('aria-label','Подборка '+category.title+(state.unlocked?', '+count+' файлов':''));
  entry.append(folderArt(),el('strong','',category.title));
  if(state.unlocked)entry.title=count+' '+(count===1?'файл':count>=2&&count<=4?'файла':'файлов');
  entry.addEventListener('click',()=>{
   if(state!==active)return;
   state.filter=state.filter===category.id?'all':category.id;
   state.expanded=false;paint(state);
   if(!state.unlocked)openArchive(state);
  });
  state.foldersGrid.append(entry);
 }
 state.folderCaption.textContent=state.filter==='all'?'Умные подборки по названиям':'Нажмите ещё раз для отмены';
}
async function refresh(){
 const state=active;if(!state)return;
 const token=++state.token;
 // Never display metadata from the previous unlocked session while checking.
 state.records=[];state.unlocked=false;paint(state);
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
 const state={options,token:0,filter:'all',query:'',expanded:false,unlocked:false,records:[]};
 active=state;
 const recent=el('section','sv-doc-shelf sv-doc-recents');
 const header=el('div','sv-doc-shelf-heading');
 header.append(el('h2','','Недавние'));
 const showAll=el('button','sv-doc-shelf-more','Все файлы ›');
 showAll.type='button';
 showAll.addEventListener('click',()=>{
  if(state!==active)return;
  if(!state.unlocked){openArchive(state);return;}
  if(state.filter!=='all'){state.filter='all';state.expanded=false;paint(state);return;}
  if(itemsFor(state).length<=4&&!state.expanded){openArchive(state);return;}
  state.expanded=!state.expanded;paint(state);
 });
 header.append(showAll);
 const recentGrid=el('div','sv-doc-recent-grid');
 const status=el('p','sv-doc-recent-status');status.setAttribute('role','status');
 recent.append(header,recentGrid,status);
 const folders=el('section','sv-doc-shelf sv-doc-folders');
 const folderHeader=el('div','sv-doc-shelf-heading');
 folderHeader.append(el('h2','','Папки'));
 const folderCaption=el('small','sv-doc-folder-caption','Умные подборки по названиям');
 folderHeader.append(folderCaption);
 const foldersGrid=el('div','sv-doc-folders-grid');
 folders.append(folderHeader,foldersGrid);
 parent.append(recent,folders);
 Object.assign(state,{showAll,recentGrid,status,foldersGrid,folderCaption});
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
window.addEventListener('pagehide',()=>{
 if(!active)return;
 active.token++;active.records=[];active.unlocked=false;paint(active);
});
window.addEventListener('pageshow',()=>{if(active)refresh();});
function search(query){
 const state=active;if(!state)return;
 state.query=String(query||'').trim();
 state.expanded=false;paint(state);
 if(state.query)state.recentGrid.scrollIntoView?.({block:'nearest',behavior:'smooth'});
}
window.SEYVEO_DOCUMENT_SHELF=Object.freeze({mount,refresh,destroy,search});
})();