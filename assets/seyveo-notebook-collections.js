/* SEYVEO Notebook collections · derived kinds and separate folder membership. */
(function(root){
 'use strict';
 const key='seyveo-notebook-folders-v1';
 const defs=[
 ['all','Все записи','#68717d','M4 6h16M4 12h16M4 18h16'],
 ['text','Текст','#007aff','M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6'],
 ['hand','От руки','#e58b17','M3 18c4-5 5-8 7-6s-3 6 0 6 4-5 6-3M14 8l5-5 3 3-5 5-4 1z'],
 ['scan','Сканы','#249a60','M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M7 12h10M8 7h8v10H8z'],
 ['art','Рисунки','#af52de','M3 19l5-7 4 4 4-6 5 9zM17 6a2 2 0 1 0 0 .1'],
 ['folders','Папки','#007aff','M3 6h7l2 2h9v12H3z']
 ];
 const kind=n=>n.scanDocument||n.scanOrigin||n.sampleKind==='scan-photo'||n.sampleKind==='scan-text'?'scan':n.noteKind==='handwriting'||n.inlineInk?.strokes?.length?'hand':n.noteKind==='art'?'art':n.paper?'hand':'text';
 let active='all',state={folders:[],membership:[]},rerender=()=>{},lastNotes=[];
 try{const raw=JSON.parse(root.localStorage.getItem(key)||'null');if(raw&&Array.isArray(raw.folders)&&Array.isArray(raw.membership))state={folders:raw.folders.filter(f=>typeof f.id==='string'&&typeof f.name==='string'),membership:raw.membership.filter(m=>typeof m.note==='string'&&typeof m.folder==='string')}}catch{}
 const folderOf=id=>state.membership.find(m=>m.note===id)?.folder;
 const visible=notes=>active==='all'?notes:active.startsWith('folder:')?notes.filter(n=>folderOf(n.id)===active.slice(7)):notes.filter(n=>kind(n)===active);
 const title=()=>active==='all'?'Недавние записи':active.startsWith('folder:')?(state.folders.find(f=>f.id===active.slice(7))?.name||'Папка'):(defs.find(d=>d[0]===active)?.[1]||'Записи');
 function save(next){try{root.localStorage.setItem(key,JSON.stringify(next));state=next;return true}catch{return false}}
 function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
 function icon(path,color){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.style.color=color;const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',path);svg.append(p);return svg}
 function choose(value){active=value;rerender();const list=document.getElementById('notesList');if(list)list.scrollTop=0}
 function picker(noteId=null){
  const old=document.getElementById('svNbFolderSheet');if(old){old.close();old.remove()}
  const dlg=el('dialog','sv-nb-folder-sheet');dlg.id='svNbFolderSheet';
  const top=el('div','sv-nb-folder-head');top.append(el('strong','',noteId?'Переместить в папку':'Мои папки'));
  const close=el('button','','Готово');close.type='button';close.onclick=()=>dlg.close();top.append(close);dlg.append(top);
  const list=el('div','sv-nb-folder-list');dlg.append(list);
  const form=el('form','sv-nb-folder-form');const input=el('input');input.placeholder='Название новой папки';input.maxLength=60;input.required=true;input.setAttribute('aria-label','Название новой папки');
  const add=el('button','','Создать');add.type='submit';form.append(input,add);dlg.append(form);
  const status=el('p','sv-nb-folder-status','');status.setAttribute('role','status');dlg.append(status);
  function assign(id){
   const membership=state.membership.filter(m=>m.note!==noteId);if(id)membership.push({note:noteId,folder:id});
   if(!save({...state,membership})){status.textContent='Не удалось сохранить папку.';return}
   dlg.close();rerender();
  }
  function draw(){
   list.replaceChildren();
   if(noteId){const b=el('button','sv-nb-folder-row','Без папки');b.type='button';b.onclick=()=>assign(null);list.append(b)}
   for(const f of state.folders){
    const row=el('div','sv-nb-folder-line');const b=el('button','sv-nb-folder-row');b.type='button';
    b.append(icon(defs[5][3],defs[5][2]),el('span','',f.name),el('small','',String(lastNotes.filter(n=>folderOf(n.id)===f.id).length)));
    if(noteId&&folderOf(noteId)===f.id)b.setAttribute('aria-current','true');
    b.onclick=()=>{if(noteId)assign(f.id);else{dlg.close();choose('folder:'+f.id)}};row.append(b);
    if(!noteId){const remove=el('button','sv-nb-folder-remove','×');remove.type='button';remove.setAttribute('aria-label','Удалить папку '+f.name);
     remove.onclick=()=>{if(!root.confirm('Удалить папку «'+f.name+'»? Записи останутся в блокноте.'))return;
      if(!save({folders:state.folders.filter(x=>x.id!==f.id),membership:state.membership.filter(m=>m.folder!==f.id)})){status.textContent='Не удалось удалить папку.';return}
      if(active==='folder:'+f.id)active='all';rerender();draw()};row.append(remove)}
    list.append(row);
   }
   if(!state.folders.length&&!noteId)list.append(el('p','sv-nb-folder-empty','Создай первую папку для своих записей.'));
  }
  form.onsubmit=e=>{e.preventDefault();const name=input.value.trim();if(!name)return;if(state.folders.some(f=>f.name.toLowerCase()===name.toLowerCase())){status.textContent='Такая папка уже есть.';return}
   const id='f-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
   if(!save({...state,folders:[...state.folders,{id,name}]})){status.textContent='Не удалось создать папку.';return}
   input.value='';status.textContent='';if(noteId)assign(id);else{draw();rerender()}
  };
  draw();document.body.append(dlg);dlg.addEventListener('close',()=>dlg.remove(),{once:true});dlg.showModal();
 }
 function render(notes,callback,selecting){
  lastNotes=notes;rerender=callback;const host=document.getElementById('svNotebookCategories');if(!host)return;
  host.hidden=selecting;if(selecting)return;
  host.replaceChildren();
  for(const [id,name,color,path] of defs){
   const b=el('button','sv-nb-category');b.type='button';
   b.setAttribute('aria-pressed',String(id==='folders'?active.startsWith('folder:'):active===id));
   const count=id==='all'?notes.length:id==='folders'?state.folders.length:notes.filter(n=>kind(n)===id).length;
   const mark=icon(path,color);b.append(mark,el('span','sv-nb-category-name',name),el('small','sv-nb-category-count',String(count)));
   b.onclick=()=>id==='folders'?picker():choose(id);host.append(b);
  }
 }
 root.SEYVEO_NOTE_COLLECTIONS=Object.freeze({kind,visible,title,render,isAll:()=>active==='all',move:note=>picker(note.id)});
})(window);
