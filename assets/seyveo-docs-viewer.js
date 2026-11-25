/* SEYVEO Docs · one beautiful local file viewer.
 * Plain Files are deliberately user-selected or decrypted by the existing
 * password vault. Nothing is silently sent to chat, mail, API or printers.
 * Local SEYVEO image-page PDFs use the existing strict page decoder.
 * Other PDFs retain an explicit original-file action, without embedded browser chrome.
 */
(()=>{
'use strict';
const MAX=20*1024*1024;
const el=(tag,cls,text)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(text!==undefined)node.textContent=text;
 return node;
};
// Semantic document glyphs come from the shared document icon catalog.
function icon(key){
 if(key==='sayvi'){
  const mark=el('span','svdv-sayvi-mark');mark.className+=' sv-sayvi-symbol';mark.setAttribute('aria-hidden','true');return mark;
 }
 const wrap=el('span','svdv-icon');wrap.setAttribute('aria-hidden','true');
 wrap.innerHTML=window.SEYVEO_DOCUMENT_ICONS?.markup(key==='file'?'original':key)||'';
 return wrap;
}
function action(label,picture,handler,cls=''){
 const button=el('button','svdv-action'+(cls?' '+cls:''));button.type='button';
 button.append(icon(picture),el('span','',label));
 button.addEventListener('click',handler);return button;
}
const format=(name,mime)=>{
 const ext=String(name||'').split('.').pop().toLowerCase();
 const kind=/^(png|jpe?g|webp)$/.test(ext)?'image':
  ext==='pdf'?'pdf':/^(txt|md)$/.test(ext)?'text':'original';
 const nameForDisplay=ext==='jpg'?'JPEG':ext==='jpeg'?'JPEG':ext==='docx'?'WORD':
  ext==='xlsx'?'EXCEL':ext==='pptx'?'POWERPOINT':ext==='md'?'MARKDOWN':
  ext==='webp'?'WEBP':ext.toUpperCase();
 return {ext,kind,label:nameForDisplay||mime||'Файл'};
};
// Local, read-only DOCX text preview. ZIP entries stay inside the browser;
// no upload, external viewer, macros or Office scripts are executed.
async function readDocxText(file){
 const bytes=new Uint8Array(await file.arrayBuffer());
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const read16=(i)=>view.getUint16(i,true),read32=(i)=>view.getUint32(i,true);
 if(bytes.length<22)throw Error('not-zip');
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
  if(read32(i)===0x06054b50){end=i;break;}
 }
 if(end<0||read16(end+4)!==0||read16(end+6)!==0)throw Error('unsupported-zip');
 const count=read16(end+10),offset=read32(end+16);
 if(count>1500||offset>=bytes.length)throw Error('invalid-zip-index');
 const utf8=new TextDecoder('utf-8');
 let cursor=offset,entry=null;
 for(let i=0;i<count;i++){
  if(cursor+46>bytes.length||read32(cursor)!==0x02014b50)throw Error('invalid-zip-index');
  const method=read16(cursor+10),compressed=read32(cursor+20),size=read32(cursor+24);
  const nameLen=read16(cursor+28),extraLen=read16(cursor+30),commentLen=read16(cursor+32);
  if(cursor+46+nameLen+extraLen+commentLen>bytes.length)throw Error('invalid-zip-index');
  const name=utf8.decode(bytes.subarray(cursor+46,cursor+46+nameLen));
  if(name==='word/document.xml'){
   entry={method,compressed,size,offset:read32(cursor+42)};
   break;
  }
  cursor+=46+nameLen+extraLen+commentLen;
 }
 if(!entry||entry.size>2500000||entry.compressed>2500000||entry.size<1||
    entry.size>Math.max(1024,entry.compressed)*150)throw Error('invalid-document-part');
 const at=entry.offset;
 if(at+30>bytes.length||read32(at)!==0x04034b50)throw Error('invalid-part-header');
 const dataStart=at+30+read16(at+26)+read16(at+28);
 if(dataStart+entry.compressed>bytes.length)throw Error('invalid-part-data');
 const zipped=bytes.subarray(dataStart,dataStart+entry.compressed);
 let plain;
 if(entry.method===0)plain=zipped;
 else if(entry.method===8&&typeof DecompressionStream!=='undefined'){
  const inflated=new Blob([zipped]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const reader=inflated.getReader(),chunks=[];
  let size=0;
  try{
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    size+=value.byteLength;
    if(size>2500000)throw Error('document-too-large');
    chunks.push(value);
   }
  }finally{reader.releaseLock();}
  plain=new Uint8Array(size);
  let n=0;
  for(const chunk of chunks){plain.set(chunk,n);n+=chunk.length;}
 }else throw Error('compression-not-supported');
 if(plain.length>2500000||!plain.length)throw Error('invalid-document-part');
 const xml=new TextDecoder('utf-8',{fatal:true}).decode(plain);
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('xml-doctype');
 const documentXml=new DOMParser().parseFromString(xml,'application/xml');
 if(documentXml.querySelector('parsererror'))throw Error('invalid-docx-xml');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const paragraphs=documentXml.getElementsByTagNameNS(ns,'p');
 let output='',seen=0;
 for(const paragraph of paragraphs){
  if(seen++>=2000||output.length>=110000)break;
  let line='';
  for(const child of paragraph.getElementsByTagName('*')){
   if(child.namespaceURI!==ns)continue;
   if(child.localName==='t')line+=(child.textContent||'');
   else if(child.localName==='tab')line+='\t';
   else if(child.localName==='br'||child.localName==='cr')line+='\n';
  }
  output+=line+'\n';
 }
 return output.trim().slice(0,110000);
}
// Same pinned PDF.js module already used by Sayvi attachment thumbnails.
// File bytes are passed locally; no document upload or automatic external links.
let pdfLibrary=null;
function loadPdf(){
 if(!pdfLibrary)pdfLibrary=import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs').then(lib=>{
  lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';return lib;
 }).catch(e=>{pdfLibrary=null;throw e;});
 return pdfLibrary;
}
async function readPdfText(file,isActive){
 const lib=await loadPdf();
 if(!isActive())return '';
 const task=lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true,isEvalSupported:false,disableAutoFetch:true,disableStream:true});
 try{
  const doc=await task.promise;
  if(doc.numPages>12)throw Error('Редактирование текста доступно для PDF до 12 страниц.');
  const texts=[];
  for(let i=1;i<=doc.numPages;i++){
   if(!isActive())return '';
   const page=await doc.getPage(i),content=await page.getTextContent();
   const text=content.items.filter(x=>typeof x.str==='string').map(x=>x.str+(x.hasEOL?'\n':' ')).join('').trim();
   page.cleanup();
   if(!text)throw Error('В PDF есть страницы без текстового слоя. Для них нужно распознавание скана.');
   texts.push(text);
   if(texts.join('\n\n').length>12000)throw Error('Документ больше 12 000 знаков. Редактирование копии пока недоступно.');
  }
  return texts.join('\n\n');
 }finally{try{await task.destroy();}catch{}}
}
function mount(target,file,{onSignImage=null,onSayvi=null,onEdit=null,onSaveCopy=null,area=null,asSheet=false,onClose=()=>{}}={}){
 if(!target||!file||typeof file.name!=='string'||typeof file.size!=='number'||
    file.size<1||file.size>MAX||typeof file.text!=='function')return false;
 const info=format(file.name,file.type);
 let objectUrl;
 try{objectUrl=URL.createObjectURL(file);}catch{return false;}
 let active=true;
 const pageUrls=[];let pdfDocument=null,pdfTask=null,sheet=null;
 const root=el('section','svdv-viewer');
 root.setAttribute('aria-label','Просмотр документа '+file.name);
 const header=el('div','svdv-header');
 const glyph=el('span','svdv-file-icon');glyph.append(icon(info.kind==='image'?'image':info.kind==='pdf'?'pdf':'file'));
 const copy=el('div','svdv-heading');
 copy.append(el('strong','svdv-name',file.name),
  el('span','svdv-meta',info.label+' · '+(Math.max(1,Math.ceil(file.size/1024)))+' КБ'));
 header.append(glyph,copy);root.append(header);
 const stage=el('div','svdv-stage');
 let previewNeedsOriginal=info.kind==='original';
 let originalAction=null,loadedText=null,inline=null,doneControl=null,stopViewport=null,markupSession=null,sayviAfterEdit=false;
 const requireOriginal=()=>{previewNeedsOriginal=true;if(originalAction){originalAction.hidden=false;originalAction.closest('details').hidden=false;}};
 if(info.kind==='image'){
  const img=el('img','svdv-picture');
  img.src=objectUrl;img.alt='Изображение документа '+file.name;img.addEventListener('error',requireOriginal,{once:true});
  stage.append(img);
 }else if(info.kind==='pdf'){
  stage.classList.add('svdv-pdf-stage');
  const loading=el('p','svdv-preview-note','Открываем PDF…');stage.append(loading);
  const openOriginal=()=>{
   const link=el('a','svdv-original-link','Открыть PDF');link.href=objectUrl;link.target='_blank';link.rel='noopener noreferrer';return link;
  };
  void (async()=>{
   try{
    let pages=null;
    try{pages=await window.SEYVEO_DOCS_EXPORT?.readScanPdf(file);}catch{}
    if(!active)return;
    if(pages?.length){
     for(const page of pages)pageUrls.push(URL.createObjectURL(new Blob([page.jpegBytes],{type:'image/jpeg'})));
     const list=el('div','svdv-sheet-pages');
     for(const [i,url] of pageUrls.entries()){const img=el('img','svdv-reader-page');img.src=url;img.alt='Страница '+(i+1);if(i>0)img.loading='lazy';list.append(img);}
     stage.replaceChildren(list);
     return;
    }
    const lib=await loadPdf();if(!active)return;
    const data=new Uint8Array(await file.arrayBuffer());if(!active)return;
    pdfTask=lib.getDocument({data,useSystemFonts:true,isEvalSupported:false,disableAutoFetch:true,disableStream:true});
    pdfDocument=await pdfTask.promise;if(!active)return;
    const total=pdfDocument.numPages;
    const list=el('div','svdv-sheet-pages');stage.replaceChildren(list);
    let index=1,busy=false;
    const next=el('button','svdv-load-more','Показать следующие страницы');next.type='button';
    async function renderMore(){
     if(!active||busy)return;busy=true;next.disabled=true;
     try{
      const end=Math.min(total,index+3);
      while(index<=end&&active){
       const number=index,page=await pdfDocument.getPage(number);if(!active)return;
       const v=page.getViewport({scale:1});const scale=Math.min(2,1100/v.width,1500/v.height);
       const viewport=page.getViewport({scale}),canvas=el('canvas','svdv-reader-page');canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));canvas.setAttribute('aria-label','Страница '+number);
       await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport}).promise;if(!active)return;
       list.insertBefore(canvas,next.parentNode===list?next:null);page.cleanup();index++;
      }
      if(index<=total){next.textContent='Следующие страницы · '+(index-1)+' из '+total;if(!next.isConnected)list.append(next);}else next.remove();
     }catch{if(active){next.remove();list.append(el('p','svdv-preview-note','Не удалось показать остальные страницы.'),openOriginal());}}
     finally{busy=false;next.disabled=false;}
    }
    next.addEventListener('click',()=>void renderMore());await renderMore();
   }catch{
    if(!active)return;
    stage.replaceChildren(el('p','svdv-preview-note','Для этого PDF доступен просмотр оригинала.'),openOriginal());
   }
  })();
 }else if(info.kind==='text'){
  stage.classList.add('svdv-stage-document');
  const pre=el('pre','svdv-text','Открываем текст…');
  stage.append(pre);
  file.text().then(text=>{
   if(active&&pre.isConnected){loadedText=text;pre.textContent=text.slice(0,120000)||'Документ пуст.';}
  }).catch(()=>{
   if(active&&pre.isConnected){pre.textContent='Не удалось открыть текст.';requireOriginal();}
  });
 }else if(info.ext==='docx'){
  stage.classList.add('svdv-stage-document');
  stage.setAttribute('aria-busy','true');
  const pre=el('pre','svdv-text','Открываю Word…');
  const note=el('p','svdv-preview-note','Предварительный просмотр текста · оформление оригинала может отличаться.');
  stage.append(pre,note);
  readDocxText(file).then(text=>{
   if(!active||!stage.isConnected)return;
   stage.removeAttribute('aria-busy');
   if(!text)throw Error('empty-docx-text');
   loadedText=text;pre.textContent=text;
  }).catch(()=>{
   if(!active||!stage.isConnected)return;
   stage.removeAttribute('aria-busy');
   stage.classList.remove('svdv-stage-document');
   stage.classList.add('svdv-stage-unavailable');
   stage.replaceChildren(el('p','svdv-unavailable','Не удалось показать текст этого Word на устройстве. Оригинал можно открыть или сохранить.'));
  });
 }else{
  stage.classList.add('svdv-stage-unavailable');
  stage.append(el('p','svdv-unavailable','Для этого формата доступен оригинал файла. Его можно открыть или сохранить.'));
 }
 root.append(stage);
 const notice=el('p','svdv-notice');
 notice.setAttribute('role','status');
 let noticeTimer=0;
 const say=(value,timeout=0)=>{if(!active)return;clearTimeout(noticeTimer);notice.textContent=value;if(timeout&&value)noticeTimer=setTimeout(()=>{notice.textContent='';},timeout);};
 const supportsPrint=info.kind==='pdf'||info.kind==='image'||info.kind==='text'||info.ext==='docx';
 const toolbar=el('div','svdv-toolbar');
 const editorControls=el('div','svdv-inline-controls');editorControls.hidden=true;
 const editorRail=el('div','svdv-inline-rail');editorControls.append(editorRail);
 const save=el('a','svdv-action svdv-primary');
 save.href=objectUrl;save.download=file.name||'Документ';
 save.setAttribute('aria-label','Скачать файл '+file.name);
 save.className='svdv-link';save.append(icon('download'),el('span','','Скачать файл'));
 const hasFileCard=()=>!!window.SEYVEO_DOCUMENT_FILES?.sourceId?.(file);
 let editAction=null;
 const draftAPI=()=>area&&window.SEYVEO_DOCUMENT_DRAFTS;
 let sourceKey=window.SEYVEO_DOCUMENT_FILES?.sourceId?.(file)||'';
 function persistInline(){
  if(!inline||!inline.changed||!area)return Promise.resolve(true);
  const state=inline;
  if(!draftAPI()){say('Хранилище черновиков недоступно.');return Promise.resolve(false);}
  return draftAPI().save(area,{id:state.id,sourceKey,name:state.name,text:state.input.value,format:info.kind==='pdf'?'pdf':'docx',style:state.style,edited:true,fromScan:info.kind==='pdf',template:'',updatedAt:Date.now()}).then(()=>true,e=>{if(active)say(e?.message||'Не удалось сохранить черновик.');return false;});
 }
 function startInline(value,existing=null){
  if(!active||inline||markupSession)return;
  if(value.length>12000){say('Документ больше 12 000 знаков. Редактирование копии пока недоступно.');return;}
  const api=window.SEYVEO_EDITOR_CAPSULE;
  if(!api){say('Инструменты редактора недоступны.');return;}
  const input=el('textarea','svdv-inline-text');input.value=value;input.maxLength=12000;input.spellcheck=true;input.setAttribute('aria-label','Текст документа');
  const controls=editorControls,rail=api.attach(editorRail,'word');rail.replaceChildren();
  const menu=el('div','svdv-inline-menu');menu.hidden=true;menu.setAttribute('role','group');controls.replaceChildren(menu,rail);
  rail.setAttribute('aria-label','Инструменты документа');
  const state={input,rail,controls,id:existing?.id||draftAPI()?.id(),name:existing?.name||file.name.replace(/\.[^.]+$/,''),changed:!!existing,style:existing?.style?{size:[10,11,12,14,16,18,20,24].includes(existing.style.size)?existing.style.size:12,alignment:['left','center','right','both'].includes(existing.style.alignment)?existing.style.alignment:'left',heading:existing.style.heading===true}:{size:12,alignment:'left',heading:false},history:[],redo:[],last:value,saving:false,originalNodes:Array.from(stage.childNodes),oldTop:stage.scrollTop};
  inline=state;
  const update=()=>{input.style.fontSize=(state.style.size*4/3)+'px';input.style.textAlign=state.style.alignment==='both'?'justify':state.style.alignment;};
  const changed=()=>{state.changed=true;void persistInline();};
  const record=next=>{if(next===state.last)return;state.history.push(state.last);if(state.history.length>60)state.history.shift();state.redo.length=0;state.last=next;changed();sync();};
  const set=next=>{input.value=next;state.last=next;changed();sync();};
  const make=(id,label,markup,handler)=>api.button(id,label,markup,handler);
  const alignNames={left:'Слева',center:'По центру',right:'Справа',both:'По ширине'};
  const svg=path=>api.icon(path);
  const down=svg('<path d="m7 10 5 5 5-5"/>');
  const alignmentArt=key=>svg('<path d="'+({left:'M4 5h16M4 10h10M4 15h16M4 20h10',center:'M4 5h16M7 10h10M4 15h16M7 20h10',right:'M4 5h16M10 10h10M4 15h16M10 20h10',both:'M4 5h16M4 10h16M4 15h16M4 20h16'}[key])+'"/>');
  const size=make('size','Размер текста','',()=>toggleMenu('size'));
  const align=make('align','Выравнивание текста','',()=>toggleMenu('align'));
  for(const b of [size,align]){b.classList.add('svdv-inline-choice');b.setAttribute('aria-expanded','false');}
  let menuKind='';
  function refreshControls(){
   size.innerHTML='<span>'+state.style.size+' пт</span>'+down;
   size.setAttribute('aria-label','Размер текста: '+state.style.size+' пт');
   align.innerHTML=alignmentArt(state.style.alignment)+down;
   align.setAttribute('aria-label','Выравнивание: '+alignNames[state.style.alignment]);
  }
  let abortSayvi=null;
  function closeMenu(){abortSayvi?.abort();abortSayvi=null;menu.hidden=true;menuKind='';menu.classList.remove('svdv-sayvi-menu');size.setAttribute('aria-expanded','false');align.setAttribute('aria-expanded','false');tidy.setAttribute('aria-expanded','false');}
  function toggleMenu(kind){
   if(menuKind===kind){closeMenu();return;}
   closeMenu();menuKind=kind;menu.hidden=false;
   (kind==='size'?size:align).setAttribute('aria-expanded','true');
   menu.setAttribute('aria-label',kind==='size'?'Размер текста':'Выравнивание текста');
   menu.replaceChildren();
   const options=kind==='size'?[10,11,12,14,16,18,20,24].map(n=>[n,n+' пт']):Object.entries(alignNames);
   for(const [id,label] of options){
    const item=el('button','svdv-inline-option');item.type='button';
    const art=el('span','svdv-inline-option-art');if(kind==='align')art.innerHTML=alignmentArt(id);else art.textContent='А';
    const selected=kind==='size'?id===state.style.size:id===state.style.alignment;
    const check=el('span','svdv-inline-option-check');if(selected)check.innerHTML=svg('<path d="m5 12 4 4 10-10"/>');
    item.setAttribute('aria-pressed',String(selected));item.append(art,el('span','',label),check);
    item.addEventListener('click',()=>{if(kind==='size')state.style.size=id;else state.style.alignment=id;input.style.textAlign=state.style.alignment==='both'?'justify':state.style.alignment;update();refreshControls();changed();closeMenu();});
    menu.append(item);
   }
  }
  state.closeMenu=closeMenu;
  refreshControls();
  function openSayvi(){
   if(menuKind==='sayvi'){closeMenu();return;}
   closeMenu();menuKind='sayvi';menu.hidden=false;menu.classList.add('svdv-sayvi-menu');menu.setAttribute('aria-label','Инструменты Сэйви');tidy.setAttribute('aria-expanded','true');menu.replaceChildren();
   const source=input.value,begin=input.selectionStart||0,end=input.selectionEnd||0,fragment=end>begin,selected=fragment?source.slice(begin,end):source,styleBefore=JSON.stringify(state.style);
   const header=el('div','svdv-sayvi-title');header.append(icon('sayvi'),el('strong','','Сэйви'));
   const choices=el('div','svdv-sayvi-choices');
   const feedback=el('p','svdv-sayvi-feedback');feedback.setAttribute('role','status');
   const question=el('textarea','svdv-sayvi-question');question.hidden=true;question.rows=2;question.maxLength=500;question.placeholder='Что нужно уточнить?';question.setAttribute('aria-label','Вопрос Сэйви');
   const preview=el('textarea','svdv-sayvi-preview');preview.hidden=true;preview.rows=5;preview.maxLength=12000;preview.setAttribute('aria-label','Предложение Сэйви');
   const actions=el('div','svdv-sayvi-actions');actions.hidden=true;
   let proposal=null,busy=false;
   const button=(label,fn)=>{const b=el('button','',label);b.type='button';b.addEventListener('click',fn);return b;};
   const current=()=>active&&inline===state&&menuKind==='sayvi'&&header.isConnected;
   const apply=button('Применить',()=>{
    if(!proposal?.apply||busy||!current())return;
    if(input.value!==source||JSON.stringify(state.style)!==styleBefore){feedback.textContent='Документ изменился. Откройте Сэйви заново.';return;}
    const value=proposal.fragment?source.slice(0,begin)+preview.value+source.slice(end):preview.value;
    if(!value.trim()||value.length>12000){feedback.textContent='Проверьте объём текста.';return;}
    input.value=value;record(value);
    if(proposal.layout){state.style.size=12;state.style.alignment='left';state.style.heading=true;update();refreshControls();changed();}
    closeMenu();say(proposal.layout?'Оформление применено. Заголовок будет выделен в готовом файле.':'Изменения применены.',3500);
   });
   apply.className='svdv-sayvi-apply';
   actions.append(button('Закрыть',closeMenu),apply);
   function show(value,{canApply=false,fragment=false,layout=false,description=''}={}){
    proposal={apply:canApply,fragment,layout};preview.value=value;preview.readOnly=!canApply;preview.hidden=false;actions.hidden=false;apply.hidden=!canApply;feedback.textContent=description;preview.scrollTop=0;
   }
   async function run(action){
    if(busy||!current())return;
    if(!source.trim()){feedback.textContent='Сначала напишите текст документа.';return;}
    proposal=null;preview.hidden=true;actions.hidden=true;
    if(action!=='ask')question.hidden=true;
    if(action==='tidy'||action==='format'){
     try{show(api.tidyDocument(source),{canApply:true,layout:action==='format',description:action==='format'?'Первая строка — заголовок в готовом файле, 12 пт, выравнивание слева.':'Убраны лишние пустые строки и пробелы в конце строк. Смысл не изменён.'});}catch(e){feedback.textContent=e.message;}
     return;
    }
    const assistant=window.SEYVEO_EDITOR_ASSISTANT;
    if(!assistant?.available?.()){feedback.textContent=assistant?.unavailable||'ИИ пока не подключён. Базовое оформление работает.';return;}
    if(action==='ask'&&!question.value.trim()){question.hidden=false;question.focus();feedback.textContent='Напишите вопрос и нажмите «Спросить Сэйви» ещё раз.';return;}
    let prompt;
    try{prompt=api.documentPrompt(action,selected,question.value.trim());}catch(e){feedback.textContent=e.message;return;}
    if(!window.confirm('Передать '+(fragment?'выделенный фрагмент':'текст документа')+' Сэйви для обработки?'))return;
    busy=true;const controller=new AbortController();abortSayvi=controller;
    const timeout=setTimeout(()=>controller.abort(),45000);
    feedback.textContent='Сэйви обрабатывает текст…';for(const b of choices.children)b.disabled=true;
    try{
     const result=await assistant.ask(prompt,{signal:controller.signal});
     if(!current()||controller.signal.aborted)return;
     show(String(result),{canApply:action==='correct',fragment,description:action==='correct'?'Проверьте имена, даты и суммы перед применением.':'Ответ Сэйви. Документ не изменён.'});
    }catch(e){if(current())feedback.textContent=e.name==='AbortError'?'Сэйви не ответила вовремя.':e.message||'Не удалось получить ответ.';}
    finally{clearTimeout(timeout);busy=false;if(abortSayvi===controller)abortSayvi=null;if(current())for(const b of choices.children)b.disabled=false;}
   }
   for(const [action,label,kind] of [['tidy','Привести в порядок','check'],['correct','Исправить ошибки','edit'],['format','Оформить документ','format'],['review','Проверить содержание','file'],['ask','Спросить Сэйви','sayvi']]){
    const item=el('button','svdv-inline-option');item.type='button';
    const art=el('span','svdv-inline-option-art');
    if(kind==='format')art.innerHTML=alignmentArt('left');else art.append(icon(kind));
    const indicator=el('span','svdv-inline-option-check');indicator.innerHTML=svg('<path d="m9 6 6 6-6 6"/>');
    item.append(art,el('span','',label),indicator);item.addEventListener('click',()=>void run(action));choices.append(item);
   }
   menu.append(header,choices,question,feedback,preview,actions);
  }
  const tidy=make('sayvi','Сэйви',api.artwork('sayvi'),openSayvi);
  tidy.setAttribute('aria-expanded','false');tidy.setAttribute('aria-haspopup','true');
  const undo=make('undo','Отменить',api.artwork('undo'),()=>{if(state.history.length){state.redo.push(input.value);set(state.history.pop());}});
  const redo=make('redo','Повторить',api.artwork('redo'),()=>{if(state.redo.length){state.history.push(input.value);set(state.redo.pop());}});
  function sync(){undo.disabled=!state.history.length;redo.disabled=!state.redo.length;}
  const done=make('done','Готово · сохранить копию',window.SEYVEO_DOCUMENT_ICONS?.markup('check')||'✓',()=>void finishInline());
  if(doneControl){doneControl.hidden=false;doneControl.onclick=()=>void finishInline();}else rail.append(done);
  rail.append(size,align,tidy,undo,redo);
  if(info.kind==='pdf')rail.append(make('pen','Рисование',api.artwork('pen'),()=>{if(state.changed){say('Сначала нажмите галочку, чтобы сохранить изменения.',4000);return;}leaveInline();stage.replaceChildren(...state.originalNodes);stage.scrollTop=state.oldTop;openMarkup('pen');}));api.prioritize(rail,'word');sync();update();
  input.addEventListener('input',()=>record(input.value));
  rail.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault();});
  controls.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault();});
  state.dismiss=e=>{if(!controls.contains(e.target))closeMenu();};document.addEventListener('pointerdown',state.dismiss,{passive:true});
  more.open=false;toolbar.hidden=true;controls.hidden=false;
  stage.classList.add('svdv-inline-editing');stage.replaceChildren(input);
  if(sheet){sheet.classList.add('is-expanded','svdv-edit-fullscreen');stopViewport=api.viewport(sheet);}
  const meta=copy.querySelector('.svdv-meta');state.metaBefore=meta.textContent;
  if(info.kind==='pdf'||info.ext==='docx')meta.textContent=state.metaBefore+' · Текстовая копия';
  say(existing?'Черновик восстановлен.':'',existing?3000:0);
  input.focus({preventScroll:true});input.setSelectionRange(0,0);stage.scrollTop=state.oldTop;
  if(sayviAfterEdit){sayviAfterEdit=false;openSayvi();}
 }
 function leaveInline(){
  const state=inline;if(!state)return;
  stopViewport?.();stopViewport=null;sheet?.classList.remove('sv-editor-keyboard-open','svdv-edit-fullscreen');
  state.closeMenu?.();document.removeEventListener('pointerdown',state.dismiss);state.controls.hidden=true;state.rail.replaceChildren();state.controls.replaceChildren(state.rail);copy.querySelector('.svdv-meta').textContent=state.metaBefore;stage.classList.remove('svdv-inline-editing');toolbar.hidden=false;
  if(doneControl){doneControl.hidden=true;doneControl.onclick=null;}
  inline=null;
 }
 async function finishInline(){
  const state=inline;if(!state||state.saving)return;
  if(!state.changed){leaveInline();stage.replaceChildren(...state.originalNodes);stage.scrollTop=state.oldTop;say('');return;}
  if(!state.input.value.trim()){say('Введите текст документа.');return;}
  state.saving=true;state.input.readOnly=true;
  if(doneControl)doneControl.disabled=true;
  try{
   if(!await persistInline())return;
   const text=state.input.value,ex=window.SEYVEO_DOCS_EXPORT;
   const ext=info.kind==='pdf'?'pdf':info.ext==='docx'?'docx':info.ext;
   const blob=ext==='pdf'?ex.pdfFromText(text,()=>document.createElement('canvas'),state.style):ext==='docx'?ex.docxFromText(text,state.style):new Blob([text],{type:'text/plain;charset=utf-8'});
   const name=file.name.replace(/\.[^.]+$/,'').replace(/ · копия$/,'')+' · копия.'+ext;
   const next=new File([blob],name,{type:blob.type});
   let savedFileId='';if(onSaveCopy)savedFileId=await onSaveCopy(next,{text,status:'ready'});
   else{const link=el('a');link.href=URL.createObjectURL(next);link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),60000);}
   if(draftAPI())await draftAPI().remove(area,state.id).catch(()=>{});
   window.SEYVEO_DOCS_STUDIO?.refreshDrafts?.(area);
   if(!active)return;
   const old=objectUrl;objectUrl=URL.createObjectURL(next);file=next;sourceKey=typeof savedFileId==='string'?savedFileId:'';loadedText=text;
   save.href=objectUrl;save.download=name;save.setAttribute('aria-label','Скачать файл '+name);
   if(originalAction)originalAction.href=objectUrl;
   copy.querySelector('.svdv-name').textContent=name;state.metaBefore=info.label+' · '+Math.max(1,Math.ceil(next.size/1024))+' КБ';
   // Pending renders of the original are detached; the edited copy remains on this screen.
   leaveInline();stage.classList.remove('svdv-pdf-stage');stage.classList.add('svdv-stage-document');
   const preview=el('pre','svdv-text',text);preview.style.fontSize=(state.style.size*4/3)+'px';preview.style.textAlign=state.style.alignment==='both'?'justify':state.style.alignment;
   stage.replaceChildren(preview);URL.revokeObjectURL(old);say('Копия сохранена. Оригинал не изменён.',3500);
  }catch(e){if(active)say(e?.message||'Не удалось сохранить копию. Черновик сохранён.');}
  finally{state.saving=false;state.input.readOnly=false;if(doneControl)doneControl.disabled=false;}
 }
 const openMarkup=(initialMode='view')=>{
  if(markupSession||inline)return;
  const api=window.SEYVEO_PDF_MARKUP;
  if(!api||!doneControl){say('Рисование и подпись PDF недоступны.');return;}
  const originalNodes=Array.from(stage.childNodes),oldTop=stage.scrollTop;
  const restore=()=>{
   if(!active)return;
   markupSession=null;sheet?.classList.remove('svdv-edit-fullscreen');editorControls.hidden=true;editorRail.replaceChildren();editorControls.replaceChildren(editorRail);
   toolbar.hidden=false;doneControl.hidden=true;doneControl.disabled=false;doneControl.onclick=null;
   stage.classList.remove('svdv-ink-stage');stage.replaceChildren(...originalNodes);stage.scrollTop=oldTop;
  };
  editorRail.replaceChildren();editorControls.replaceChildren(editorRail);editorControls.hidden=false;toolbar.hidden=true;more.open=false;
  stage.classList.add('svdv-ink-stage');stage.replaceChildren();doneControl.hidden=false;sheet?.classList.add('is-expanded','svdv-edit-fullscreen');
  const result=api.open(file,{parent:root,loadPdf,onSave:onSaveCopy,initialMode,shared:{stage,rail:editorRail,controls:editorControls,done:doneControl,viewport:sheet||root,notice:say},onClose:restore,onText:(assistant=false)=>{sayviAfterEdit=assistant;editAction?.click();},onSaved:(next,id,output)=>{
   if(!active)return;
   const old=objectUrl;objectUrl=URL.createObjectURL(next);file=next;sourceKey=typeof id==='string'?id:'';loadedText=null;
   save.href=objectUrl;save.download=next.name;save.setAttribute('aria-label','Скачать файл '+next.name);
   if(originalAction)originalAction.href=objectUrl;
   copy.querySelector('.svdv-name').textContent=next.name;copy.querySelector('.svdv-meta').textContent=info.label+' · '+Math.max(1,Math.ceil(next.size/1024))+' КБ';
   stage.classList.remove('svdv-stage-document');stage.classList.add('svdv-pdf-stage');
   const list=el('div','svdv-sheet-pages');
   for(const [i,page] of output.entries()){const url=URL.createObjectURL(new Blob([page.jpegBytes],{type:'image/jpeg'}));pageUrls.push(url);const img=el('img','svdv-reader-page');img.src=url;img.alt='Страница '+(i+1);list.append(img);}
   stage.replaceChildren(list);
   URL.revokeObjectURL(old);say('Копия с пометками сохранена.',3500);
  }});
  if(!result){restore();say('Рисование и подпись PDF недоступны.');return;}
  markupSession=result;
 };
 if(onEdit&&(info.kind==='text'||info.ext==='docx'||info.kind==='image'||info.kind==='pdf')){
  const edit=action(info.kind==='image'?'Обработать':'Изменить','edit',async()=>{
   if(edit.disabled)return;
   edit.disabled=true;
   try{
    if(info.kind==='image'){
     const ok=await onEdit({kind:'pages',file});
     if(ok&&sheet?.open)sheet.close();
     else if(!ok&&active)say('Обработка изображения пока недоступна.');
     return;
    }
    if(inline||markupSession)return;
    if(sourceKey&&draftAPI()){
     const previous=(await draftAPI().list(area)).find(d=>d.sourceKey===sourceKey);
     if(!active)return;if(previous){startInline(String(previous.text||''),previous);return;}
    }
    let value=loadedText??(window.SEYVEO_DOCUMENT_FILES?.sourceText?.(file)||null);
    if(value===null){
     if(info.kind==='text')value=await file.text();
     else if(info.ext==='docx')value=await readDocxText(file);
     else{
      say('Подготавливаем текст…');
      let scanned=null;try{scanned=await window.SEYVEO_DOCS_EXPORT?.readScanPdf(file);}catch{}
      if(!active)return;
      if(scanned?.length){
       say('Распознаём текст страниц…');
       value=await onEdit({kind:'pdf-text',file,isActive:()=>active,inlineTextOnly:true});
       if(typeof value!=='string'){say('Распознавание отменено или недоступно.');return;}
      }else value=await readPdfText(file,()=>active);
     }
    }
    if(active)startInline(value);
   }catch(e){if(active)say(e?.message||'Не удалось открыть редактор.');}
   finally{edit.disabled=false;sayviAfterEdit=false;}
  });
  editAction=edit;
  // Text documents already support direct editing. Only images need a separate processing action.
  if(info.kind==='image')toolbar.append(edit);
  // Text and full-page previews open a confirmed editable copy.
  // Keep native selection, scrolling, zoom and inline PDF preview buttons intact.
  if(info.kind!=='image'){
   stage.classList.add('svdv-tap-edit');
   stage.tabIndex=0;stage.setAttribute('aria-label','Документ. Нажмите на текст для редактирования.');
   stage.addEventListener('keydown',event=>{
    if(event.target!==stage||inline||markupSession||edit.disabled||!stage.querySelector('.svdv-reader-page,.svdv-text'))return;
    if(event.key==='Enter'||event.key===' '){event.preventDefault();edit.click();}
   });
   let tapStart=null;
   stage.addEventListener('pointerdown',event=>{
    tapStart=event.isPrimary!==false&&event.button===0?{x:event.clientX,y:event.clientY,at:Date.now()}:null;
   },{passive:true});
   stage.addEventListener('pointercancel',()=>{tapStart=null;},{passive:true});
   stage.addEventListener('click',event=>{
    const start=tapStart;tapStart=null;
    if(!active||markupSession||!start||event.defaultPrevented||Math.hypot(event.clientX-start.x,event.clientY-start.y)>10||Date.now()-start.at>600)return;
    if(event.target.closest('button,a,input,textarea,select,summary,[contenteditable]'))return;
    if(!event.target.closest('.svdv-reader-page,.svdv-text'))return;
    if(window.getSelection?.()?.toString().trim())return;
    if(!edit.disabled)edit.click();
   });
  }
 }
 const doShare=()=>{
  if(typeof navigator==='undefined'||typeof navigator.share!=='function'){
   say('Отправка через браузер недоступна. Файл можно скачать через «Ещё».');moreBody.append(save);more.hidden=false;more.open=true;return;
  }
  const data={files:[file],title:file.name};
  try{
   if(typeof navigator.canShare==='function'&&!navigator.canShare(data)){
    say('Этот формат нельзя отправить через браузер. Можно скачать файл.');moreBody.append(save);more.hidden=false;more.open=true;return;
   }
   // iOS requires share() directly in the user's click handler.
   void navigator.share(data).catch(error=>{
    if(error?.name!=='AbortError')say('Не удалось открыть меню отправки. Можно скачать файл.');moreBody.append(save);more.hidden=false;
   });
  }catch{say('Не удалось открыть системное меню.');}
 };
 toolbar.append(action('Поделиться','share',doShare));
 if(supportsPrint)toolbar.append(action('Печать','print',()=>{
  let url=objectUrl,temporary=false;
  try{
   if(info.kind==='text'||info.ext==='docx'){
    if(loadedText===null){say('Дождись загрузки текста.');return;}
    url=URL.createObjectURL(window.SEYVEO_DOCS_EXPORT.pdfFromText(loadedText));temporary=true;
   }
   window.open(url,'_blank','noopener,noreferrer');
   if(temporary)setTimeout(()=>URL.revokeObjectURL(url),120000);
   say('В открытом документе выбери системную печать.');
  }catch(e){say(e?.message||'Не удалось подготовить печать.');}
 }));
 const more=el('details','svdv-more');
 const summary=el('summary','svdv-more-button');
 summary.append(icon('more'),el('span','','Ещё'));
 more.append(summary);
 const moreBody=el('div','svdv-more-options');
 // Drawing on the original PDF is also accessible from the editor capsule.
 if(info.kind==='pdf')moreBody.append(action('Подписать','signature',()=>openMarkup('signature')));
 if(!hasFileCard())moreBody.append(save);
 const openLink=el('a','svdv-link');
 openLink.href=objectUrl;openLink.target='_blank';openLink.rel='noopener noreferrer';
 openLink.append(icon('file'),el('span','','Открыть вне SEYVEO'));
 openLink.hidden=!previewNeedsOriginal;
 originalAction=openLink;
 moreBody.append(openLink);
 if(info.kind==='image'&&onSignImage){
  moreBody.append(action('Подписать скан','signature',()=>{
   try{
    const result=onSignImage(file);
    if(result&&typeof result.then==='function')
     result.then(ok=>{if(ok!==true)say('Не удалось открыть подпись.');},
      ()=>say('Не удалось открыть подпись.'));
    else if(result!==true)say('Инструмент подписи недоступен.');
   }catch{say('Не удалось открыть подпись.');}
  }));
 }
 if(onSayvi&&!editAction)moreBody.append(action('Сэйви поможет','sayvi',()=>onSayvi('review')));
 moreBody.addEventListener('click',event=>{if(event.target.closest('button,a'))more.open=false;});
 more.append(moreBody);toolbar.append(more);more.hidden=!Array.from(moreBody.children).some(n=>!n.hidden);
 const dismissMore=event=>{if(!more.contains(event.target))more.open=false;};
 const closeMoreOnEscape=event=>{if(event.key==='Escape'&&more.open){event.preventDefault();more.open=false;summary.focus();}};
 document.addEventListener('pointerdown',dismissMore,{passive:true});
 document.addEventListener('keydown',closeMoreOnEscape);
 root.append(toolbar,editorControls,notice);
 if(asSheet){
  sheet=el('dialog','svdv-bottom-sheet');
  sheet.setAttribute('aria-label','Просмотр '+file.name);
  const grip=el('div','svdv-sheet-grip');grip.setAttribute('aria-hidden','true');
  const close=el('button','svdv-sheet-close');close.type='button';close.setAttribute('aria-label','Назад');close.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 5-7 7 7 7"/></svg>';
  doneControl=el('button','svdv-inline-done');doneControl.type='button';doneControl.hidden=true;doneControl.setAttribute('aria-label','Готово · сохранить копию');doneControl.append(icon('check'));
  const top=el('div','svdv-sheet-top');top.append(close,copy,doneControl);header.replaceChildren(grip,top);
  async function requestClose(){if(markupSession){markupSession.requestClose();return;}if(inline?.saving)return;if(inline&&!await persistInline())return;window.SEYVEO_DOCS_STUDIO?.refreshDrafts?.(area);sheet.close();}
  close.addEventListener('click',()=>void requestClose());
  sheet.addEventListener('cancel',e=>{e.preventDefault();void requestClose();});
  window.SEYVEO_SHEET_NAVIGATION?.attach(grip,
   ()=>sheet.classList.add('is-expanded'),
   ()=>{if(inline||markupSession||sheet.classList.contains('svdv-edit-fullscreen'))return;if(sheet.classList.contains('is-expanded'))sheet.classList.remove('is-expanded');else void requestClose();});
  sheet.append(root);target.replaceChildren(sheet);
  sheet.addEventListener('close',()=>{if(active){session.destroy();onClose();}},{once:true});
  sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)void requestClose();}});
 }else target.replaceChildren(root);
 const session=Object.freeze({
  destroy(){
   if(!active)return;
   clearTimeout(noticeTimer);inline?.closeMenu?.();if(inline?.dismiss)document.removeEventListener('pointerdown',inline.dismiss);stopViewport?.();stopViewport=null;active=false;markupSession?.destroy?.();markupSession=null;if(sheet?.open)sheet.close();try{void pdfTask?.destroy()?.catch?.(()=>{});}catch{}for(const url of pageUrls)URL.revokeObjectURL(url);target.replaceChildren();
   document.removeEventListener('pointerdown',dismissMore);
   document.removeEventListener('keydown',closeMoreOnEscape);
   URL.revokeObjectURL(objectUrl);
  }
 });
 if(sheet){if(!sheet.isConnected){session.destroy();return false;}sheet.showModal();}
 return session;
}
function open(file,options={}){
 const target=el('div','svdv-sheet-host');document.body.append(target);
 const focus=document.activeElement;
 const session=mount(target,file,{...options,asSheet:true,onClose(){target.remove();options.onClose?.();if(focus?.isConnected)focus.focus({preventScroll:true});}});
 if(!session){target.remove();return false;}
 return Object.freeze({destroy(){session.destroy();target.remove();}});
}
// First-page preview for the Documents shelf. The file stays local.
async function thumbnail(file,isActive=()=>true){
 if(!file||!file.size||file.size>12*1024*1024||!isActive())return null;
 const lib=await loadPdf();if(!isActive())return null;
 const data=new Uint8Array(await file.arrayBuffer());if(!isActive())return null;
 const task=lib.getDocument({data,useSystemFonts:true,isEvalSupported:false,disableAutoFetch:true,disableStream:true});
 try{
  const doc=await task.promise;if(!isActive())return null;
  const page=await doc.getPage(1);if(!isActive())return null;
  const base=page.getViewport({scale:1});
  const viewport=page.getViewport({scale:Math.min(160/base.width,200/base.height)});
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));
  const context=canvas.getContext('2d',{alpha:false});if(!context)return null;
  await page.render({canvasContext:context,viewport,background:'#fff'}).promise;
  page.cleanup();return isActive()?canvas:null;
 }finally{try{await task.destroy();}catch{}}
}
window.SEYVEO_DOCS_VIEWER=Object.freeze({mount,open,thumbnail});
})();
