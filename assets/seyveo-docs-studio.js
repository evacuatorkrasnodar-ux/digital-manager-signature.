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
 scan:'<path d="M11 21V10a5 5 0 0 1 5-5h22l10 10v30a5 5 0 0 1-5 5H25"/><path d="M38 5v12h10M23 29h18M23 36h12"/><path d="M7 16V7h9M48 52h9v-9M7 43v9h9M57 16V7h-9"/><path d="m21 46 4 4 9-11" class="sv-doc-art-accent"/>',
 file:'<path d="M14 16h23l11 11v22a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5V21a5 5 0 0 1 5-5Z"/><path d="M37 16v12h11"/><path d="M29 34v15M22 41.5h14" class="sv-doc-art-accent"/>',
 create:'<path d="M17 9h21l10 10v29a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5Z"/><path d="M38 9v11h10M21 29h18M21 36h11"/><path d="m30 50 15-15 4 4-15 15-8 2Z" class="sv-doc-art-accent"/>',
 sign:'<path d="M12 12h35a5 5 0 0 1 5 5v28a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V17a5 5 0 0 1 5-5Z"/><path d="M16 22h20M16 29h12M16 42c7-13 8 6 14-2 5-9 2 8 11-3" class="sv-doc-art-accent"/>',
 print:'<path d="M18 23V9h28v14M18 47H9a5 5 0 0 1-5-5V28a5 5 0 0 1 5-5h46a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5h-9"/><path d="M15 37h34v20H15zM22 44h20M22 50h14"/><circle cx="51" cy="31" r="2" class="sv-doc-art-accent"/>',
 camera:'<path d="M9 19h12l5-6h13l5 6h11v31H9z"/><circle cx="32" cy="34" r="10"/><path d="m47 23 4 0" class="sv-doc-art-accent"/>',
 pages:'<path d="M16 10h27l9 9v31H16zM43 10v10h9M9 18v36h33"/><path d="M24 29h18M24 37h14" class="sv-doc-art-accent"/>',
 pdf:'<path d="M16 8h28l11 11v39H16zM44 8v12h11M23 30h24M23 38h18"/><path d="m23 49 7 5 13-12" class="sv-doc-art-accent"/>',
 finger:'<path d="M17 43c3-4 5-7 8-6V18a4 4 0 0 1 8 0v15a4 4 0 0 1 8-1l1 3c5-2 9 4 7 10l-5 13H25Z"/><path d="M16 29c0-11 5-17 13-17" class="sv-doc-art-accent"/>',
 folder:'<path d="M8 17h19l6 7h23v27H8z"/><path d="M8 29h48M24 38h17" class="sv-doc-art-accent"/>',
 export:'<path d="M16 24v29h34V24M33 7v31M23 17l10-10 10 10" class="sv-doc-art-accent"/>',
 check:'<path d="M14 32l12 12 24-25" class="sv-doc-art-accent"/><circle cx="32" cy="32" r="25"/>'
});
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
let scans=[],mode='',temporaryUrls=[],generation=0,operationEpoch=0,importBusy=false,selectedScan=0;
function cleanUrls(){
 for(const url of temporaryUrls)URL.revokeObjectURL(url);
 temporaryUrls=[];
}
function reset(){
 generation++;operationEpoch++;importBusy=false;
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
 const lines=[],limit=70;
 for(const raw of text.slice(0,12000).split(/\r?\n/)){
  if(!raw){lines.push('');continue;}
  let line='';
  for(const token of raw.split(/(\s+)/)){
   if((line+token).length>limit&&line){lines.push(line);line='';}
   line+=token;
  }
  lines.push(line);
 }
 const pages=[];
 while(lines.length){
  if(pages.length>=12)throw Error('Слишком много страниц');
  const canvas=$('canvas');
  canvas.width=900;canvas.height=1273;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas недоступен');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,900,1273);
  ctx.fillStyle='#172027';ctx.font='28px Arial,sans-serif';
  let y=100;
  for(const line of lines.splice(0,31)){ctx.fillText(line,70,y);y+=36;}
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
 const wide=button('Сканировать',()=>open('scan'),'sv-doc-tool-scan');
 wide.append($('span','sv-doc-tool-scan-desc','Лист → готовый PDF'),art('scan'));
 wide.setAttribute('aria-label','Сканировать документ: сфотографировать страницы и сохранить PDF');
 const grid=$('div','sv-doc-tool-grid');
 const items=[
  ['Добавить файл','file',()=>onPick()],
  ['Создать','create',()=>open('create')],
  ['Подписать','sign',()=>open('sign')],
  ['Печать','print',()=>open('print')]
 ];
 for(const [label,key,action] of items){
  const el=button(label,action,'sv-doc-tool-'+key);
  el.dataset.action=key;el.append(art(key));grid.append(el);
 }
 const panel=$('section','sv-doc-tool-panel');panel.hidden=true;
 panel.setAttribute('aria-label','Инструменты документов');
 editor.append(wide,grid,panel);target.append(editor);
 let currentPrint=null,documentDraft='';
 const clear=()=>{
  panel.replaceChildren();cleanUrls();
 };
 const status=(text)=>{
  const node=$('p','sv-doc-tool-status',text);node.setAttribute('role','status');
  return node;
 };
 const heading=(title,detail)=>{
  const bar=$('div','sv-doc-tool-head');
  const copy=labelRow(title,detail);
  const close=button('Свернуть',()=>{
  operationEpoch++;importBusy=false;panel.hidden=true;mode='';clear();
 },'sv-doc-tool-close');
  bar.append(copy,close);return bar;
 };
 const warn=(text)=>$('p','sv-doc-tool-warning',text);
 const message=(text)=>{
  const target=panel.querySelector('.sv-doc-tool-status');
  if(target)target.textContent=text;
 };
 function open(name){
  if(mode!==name){operationEpoch++;importBusy=false;}
  mode=name;panel.hidden=false;render();
  // Keep the controls immediately next to their triggering actions.
 }
 function render(){
  clear();if(!mode)return;
  if(mode==='scan')renderScan();
  if(mode==='create')renderCreate();
  if(mode==='sign')renderSign();
  if(mode==='print')renderPrint();
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
  footer.append(
   $('span','',scans.length?'Страница '+(selectedScan+1)+' из '+scans.length:'Пример листа'),
   $('span','',scans.length?'Ваше фото':'Направляющие · пример')
  );
  stage.append(board,footer);
  return stage;
 }
 function pdfPreviewCard(){
  const card=$('div','sv-doc-tool-pdf-card');
  const image=art('pdf');
  const copy=$('div','sv-doc-tool-pdf-copy');
  copy.append($('strong','','PDF из сканов'),
   $('small','',scans.length+' стр. · будет создан по нажатию'));
  const preview=button('Посмотреть',()=>{
   try{
    const blob=window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans);
    const url=URL.createObjectURL(blob);
    temporaryUrls.push(url);
    const link=$('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';
    document.body.append(link);link.click();link.remove();
    message('Предпросмотр PDF открыт, если это разрешает браузер.');
   }catch{message('Не удалось открыть предпросмотр PDF.');}
  },'sv-doc-tool-pdf-preview');
  preview.setAttribute('aria-label','Посмотреть собранный PDF в отдельном окне');
  card.append(image,copy,preview);return card;
 }
 function renderScan(){
  clear();
  panel.append(heading('Сканер','Фото → PDF'));
  panel.append(scannerStage());
  panel.append(pictorialSteps([['camera','Фото'],['pages','Страницы'],['pdf','PDF']]));
  const camera=$('input');camera.type='file';camera.accept='image/*';
  camera.setAttribute('capture','environment');camera.hidden=true;
  const library=$('input');library.type='file';library.accept='image/jpeg,image/png,image/webp';
  library.multiple=true;library.hidden=true;
  camera.addEventListener('change',()=>{void ingest(camera.files);camera.value='';});
  library.addEventListener('change',()=>{void ingest(library.files);library.value='';});
  panel.append(camera,library,controls(
   button('Камера',()=>camera.click(),'sv-doc-tool-primary'),
   button('Фото из галереи',()=>library.click())
  ));
  const counter=$('div','sv-doc-tool-pages');
  if(scans.length){
   counter.append($('strong','','Страницы · '+scans.length));
   const thumbs=$('div','sv-doc-tool-thumbs');
   scans.forEach((page,index)=>{
    const wrap=$('div','sv-doc-tool-thumb');
    const url=URL.createObjectURL(new Blob([page.jpegBytes],{type:'image/jpeg'}));
    temporaryUrls.push(url);
    const img=$('img');img.src=url;img.alt='Страница '+(index+1);
    const select=button('',()=>{selectedScan=index;renderScan();},
     'sv-doc-tool-thumb-select');
    select.setAttribute('aria-label','Просмотреть страницу '+(index+1));
    select.setAttribute('aria-pressed',String(index===selectedScan));
    select.append(img);
    const actions=$('div','sv-doc-tool-thumb-actions');
    const turn=button('↻',()=>{void rotatePage(index);});
    turn.setAttribute('aria-label','Повернуть страницу '+(index+1));
    const before=button('←',()=>movePage(index,-1));
    before.setAttribute('aria-label','Переместить страницу '+(index+1)+' назад');
    before.disabled=index===0;
    const after=button('→',()=>movePage(index,1));
    after.setAttribute('aria-label','Переместить страницу '+(index+1)+' вперёд');
    after.disabled=index===scans.length-1;
    actions.append(turn,before,after);
    const del=button('Удалить '+(index+1),()=>{
     scans.splice(index,1);
     if(selectedScan>index)selectedScan--;
     selectedScan=Math.min(selectedScan,Math.max(0,scans.length-1));
     renderScan();
    });
    del.setAttribute('aria-label','Удалить страницу '+(index+1));
    wrap.append(select,actions,del);thumbs.append(wrap);
   });
   counter.append(thumbs,pdfPreviewCard());
   counter.append(controls(
    button('Сохранить PDF',()=>{
     try{save(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans),'SEYVEO-скан.pdf');
      message('PDF подготовлен для сохранения. Проверьте загрузки.');
     }catch{message('Не удалось собрать PDF.');}
    },'sv-doc-tool-primary'),
    button('В Файлы / поделиться',()=>{
     try{
      const pdf=window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans);
      void shareExport(pdf,'SEYVEO-скан.pdf').then(
       result=>message(shareMessage(result,'PDF'))
      );
     }catch{message('Не удалось подготовить PDF.');}
    }),
    button('В архив',()=>{
     try{
      onImport(asFile(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans),'SEYVEO-скан.pdf'));
     }catch{message('Не удалось передать PDF в архив.');}
    }),
    button('Очистить страницы',()=>{scans=[];selectedScan=0;renderScan();})
   ));
  }else counter.append($('small','','Сфотографируйте лист или выберите фото.'));
  const info=$('details','sv-doc-tool-help');
  info.append($('summary','','О сканировании'),warn('Фото остаются на устройстве, без отправки в интернет. Автоматическая обрезка и OCR пока не подключены.'));
  panel.append(counter,info,status(''));
 }
 function renderCreate(){
  panel.append(heading('Создать','Текст → PDF или Word'));
  panel.append(pictorialSteps([['create','Написать'],['pages','Оформить'],['pdf','Сохранить']]));
  const examples=$('div','sv-doc-tool-templates');
  const body=$('textarea','sv-doc-tool-text');body.rows=7;body.maxLength=12000;
  body.value=documentDraft;
  body.addEventListener('input',()=>{documentDraft=body.value;});
  body.placeholder='Напишите текст документа…';
  const templates=[
   ['Заявление','Заявление\n\nПрошу рассмотреть моё обращение.\n\nДата: __________\nПодпись: __________'],
   ['Акт','Акт\n\nСтороны составили настоящий акт о следующем:\n\nПредмет: __________\nДата: __________'],
   ['Расписка','Расписка\n\nЯ, __________, подтверждаю получение __________.\n\nДата: __________']
  ];
  for(const [label,example] of templates){
   examples.append(button(label,()=>{
    body.value=example;documentDraft=example;
    message('Учебный шаблон. Замените пример своим текстом.');
   }));
  }
  const check=()=>body.value.trim().length>0&&body.value.length<=12000;
  panel.append(examples,body);
  panel.append(controls(
   button('Сохранить PDF',()=>{
    if(!check()){message('Введите текст документа.');return;}
    try{save(textPdf(body.value),'SEYVEO-документ.pdf');
     message('PDF подготовлен. Он содержит страницы-картинки текста.');
    }catch(e){message(e.message||'Ошибка подготовки PDF');}
   },'sv-doc-tool-primary'),
   button('Сохранить Word',()=>{
    if(!check()){message('Введите текст документа.');return;}
    try{save(window.SEYVEO_DOCS_EXPORT.docxFromText(body.value),'SEYVEO-документ.docx');
     message('Word подготовлен для сохранения.');
    }catch{message('Не удалось создать Word.');}
   }),
   button('В Файлы / поделиться',()=>{
    if(!check()){message('Введите текст документа.');return;}
    try{
     void shareExport(window.SEYVEO_DOCS_EXPORT.docxFromText(body.value),
      'SEYVEO-документ.docx').then(result=>message(shareMessage(result,'Word')));
    }catch{message('Не удалось подготовить Word.');}
   }),
   button('Создать с Сэйви',()=>onSayvi('create'))
  ));
  const info=$('details','sv-doc-tool-help');
  info.append($('summary','','О шаблонах'),warn('Это простой редактор. Шаблоны учебные, текст требует проверки.'));
  panel.append(info,status(''));
 }
 function renderSign(){
  panel.append(heading('Подпись','Документ · подпись пальцем'));
  panel.append(pictorialSteps([['file','Страница'],['finger','Подпись'],['pdf','Копия PDF']]));
  const pageIndexDefault=Math.max(0,scans.length-1);
  let placement={x:.70,y:.83};
  let pageIndex=pageIndexDefault;
  const preview=$('div','sv-doc-sign-stage');
  const pageBar=$('div','sv-doc-sign-stage-top');
  pageBar.append($('strong','','Документ'),$('small','',
   scans.length?'Страница '+(pageIndex+1)+' из '+scans.length:'Лист-пример'));
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
  canvas.width=650;canvas.height=240;
  canvas.setAttribute('aria-label','Поле подписи пальцем или стилусом');
  paper.append($('span','sv-doc-sign-paper-caption','Нарисуйте подпись'),canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx){panel.append(status('Подпись на этом устройстве недоступна.'));return;}
  ctx.strokeStyle='#1b2a31';ctx.lineWidth=3.5;
  ctx.lineCap='round';ctx.lineJoin='round';
  let drawing=false,marks=0;
  function paintPlacement(){
   for(const element of [target,overlay]){
    element.style.left=(placement.x*100)+'%';
    element.style.top=(placement.y*100)+'%';
   }
   target.hidden=!scans.length;
   overlay.hidden=!scans.length||!marks;
   if(marks&&scans.length)overlay.src=canvas.toDataURL('image/png');
  }
  function updatePreview(){
   if(!scans.length)return;
   // The actual selected scan is displayed here; the PDF exporter uses
   // precisely this selection and the chosen relative signature position.
   const file=scans[pageIndex];
   if(!file)return;
   pageBar.replaceChildren(
    $('strong','','Документ'),
    $('small','','Страница '+(pageIndex+1)+' из '+scans.length));
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
  }else{
   const sample=$('div','sv-doc-sign-page-sample');
   sample.append($('span','','SEYVEO'));
   for(let i=0;i<5;i++)sample.append($('i'));
   sample.append($('em','','Место подписи'));
   pageBody.append(sample);
   preview.append(pageBar,pageBody,stageHint);
  }
  panel.append(preview,paper);
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
  const actions=controls(onScan,pngButton,clearButton);
  onScan.classList.add('sv-doc-tool-primary');
  panel.append(actions);
  const info=$('details','sv-doc-tool-help');
  info.append($('summary','','О подписи'),
   warn('Рукописная отметка не является КЭП. Для официальной электронной подписи нужно подключение через «Умные подключения».'));
  panel.append(info,status(scans.length?
   'Подпись появится на выбранном листе.':'Для PDF сначала добавьте скан в инструменте «Сканировать».'));
 }
 function renderPrint(){
  panel.append(heading('Печать','Файл → принтер'));
  panel.append(pictorialSteps([['file','Выбрать'],['print','Печать'],['check','Готово']]));
  const filePicker=$('input');filePicker.type='file';
  filePicker.accept='.pdf,.jpg,.jpeg,.png,.webp';
  filePicker.hidden=true;
  const picked=getCurrentFile();
  if(picked&&/\.(?:pdf|jpe?g|png|webp)$/i.test(picked.name||'')){
   currentPrint=picked;
  }else if(scans.length){
   // A just-scanned document is printable immediately without a second
   // import or duplicated archive entry. This is a local preview only.
   try{
    currentPrint=asFile(
     window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans),'SEYVEO-скан.pdf'
    );
   }catch{currentPrint=null;}
  }else currentPrint=null;
  const slot=$('div','sv-doc-tool-print-file');
  const update=()=>{
   slot.replaceChildren();
   if(!currentPrint){
    slot.append($('p','','Выберите PDF или изображение для печати.'));
    return;
   }
   slot.append($('strong','',currentPrint.name));
   const url=URL.createObjectURL(currentPrint);temporaryUrls.push(url);
   const link=$('a','sv-doc-tool-print-link','Открыть для печати');
   link.href=url;link.target='_blank';link.rel='noopener noreferrer';
   slot.append(link);
  };
  filePicker.addEventListener('change',()=>{
   if(filePicker.files?.[0]){
    const f=filePicker.files[0];
    if(f.size>20*1024*1024||f.size===0||!/\.(pdf|jpe?g|png|webp)$/i.test(f.name)){
     message('Выберите PDF или фото до 20 МБ.');return;
    }
    currentPrint=f;cleanUrls();update();
   }
  });
  panel.append(filePicker,controls(button('Выбрать файл',()=>filePicker.click())),slot);
  update();
  const info=$('details','sv-doc-tool-help');
  info.append($('summary','','Как печатать'),warn('Откройте файл и выберите системное «Поделиться → Печать». Принтер и параметры выбираются в системе.'));
  panel.append(info,status(''));
 }
 return true;
}
window.SEYVEO_DOCS_STUDIO=Object.freeze({mount,reset});
})();
