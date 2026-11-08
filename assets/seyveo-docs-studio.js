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
let scans=[],mode='',temporaryUrls=[];
function cleanUrls(){
 for(const url of temporaryUrls)URL.revokeObjectURL(url);
 temporaryUrls=[];
}
function reset(){cleanUrls();scans=[];mode='';}
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
 wide.append($('span','sv-doc-tool-scan-desc','Фото и страницы → PDF'));
 wide.setAttribute('aria-label','Сканировать документ: фото и страницы в PDF');
 const grid=$('div','sv-doc-tool-grid');
 const items=[
  ['Добавить файл','file',()=>onPick()],
  ['Создать','create',()=>open('create')],
  ['Подписать','sign',()=>open('sign')],
  ['Печать','print',()=>open('print')]
 ];
 for(const [label,key,action] of items){
  const el=button(label,action,'sv-doc-tool-'+key);
  el.dataset.action=key;grid.append(el);
 }
 const panel=$('section','sv-doc-tool-panel');panel.hidden=true;
 panel.setAttribute('aria-label','Инструменты документов');
 editor.append(wide,grid,panel);target.append(editor);
 let currentPrint=null;
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
  const close=button('Свернуть',()=>{panel.hidden=true;mode='';clear();},'sv-doc-tool-close');
  bar.append(copy,close);return bar;
 };
 const warn=(text)=>$('p','sv-doc-tool-warning',text);
 const message=(text)=>{
  const target=panel.querySelector('.sv-doc-tool-status');
  if(target)target.textContent=text;
 };
 function open(name){
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
  if(files.length+scans.length>12){message('Максимум 12 страниц.');return;}
  for(const f of files){
   if(!/^image\/(jpeg|png|webp)$/i.test(f.type)||f.size>12*1024*1024||
      f.size<1){message('Выберите JPEG, PNG или WebP до 12 МБ.');return;}
  }
  try{
   const processed=[];
   for(const file of files){
    const image=await imageOf(file);
    const page=jpegOf(canvasOf(image));
    processed.push(page);
   }
   scans.push(...processed);renderScan();
   message('Добавлено страниц: '+scans.length+'. Можно собрать настоящий PDF.');
  }catch{message('Не удалось обработать фото. Попробуйте другой файл.');}
 }
 function renderScan(){
  panel.append(heading('Умный сканер · пробная версия',
    'Захват фото работает. Автоуглы и OCR добавим после нативных тестов.'));
  panel.append(warn('Фото обрабатывается локально, без отправки в интернет. Снимки хранятся только до ухода со страницы.'));
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
   counter.append($('strong','','Страниц: '+scans.length));
   const thumbs=$('div','sv-doc-tool-thumbs');
   scans.forEach((page,index)=>{
    const wrap=$('div','sv-doc-tool-thumb');
    const url=URL.createObjectURL(new Blob([page.jpegBytes],{type:'image/jpeg'}));
    temporaryUrls.push(url);
    const img=$('img');img.src=url;img.alt='Страница '+(index+1);
    const del=button('Удалить '+(index+1),()=>{scans.splice(index,1);renderScan();});
    del.setAttribute('aria-label','Удалить страницу '+(index+1));
    wrap.append(img,del);thumbs.append(wrap);
   });
   counter.append(thumbs);
   counter.append(controls(
    button('Сохранить PDF',()=>{
     try{save(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans),'SEYVEO-скан.pdf');
      message('PDF подготовлен для сохранения. Проверьте загрузки.');
     }catch{message('Не удалось собрать PDF.');}
    },'sv-doc-tool-primary'),
    button('В архив',()=>{
     try{
      onImport(asFile(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(scans),'SEYVEO-скан.pdf'));
     }catch{message('Не удалось передать PDF в архив.');}
    }),
    button('Очистить страницы',()=>{scans=[];renderScan();})
   ));
  }else counter.append($('small','','Добавьте первую страницу камерой или из галереи.'));
  panel.append(counter,status(''));
 }
 function renderCreate(){
  panel.append(heading('Создать документ','Текст → настоящий PDF или редактируемый Word.'));
  const examples=$('div','sv-doc-tool-templates');
  const body=$('textarea','sv-doc-tool-text');body.rows=7;body.maxLength=12000;
  body.placeholder='Напишите текст документа…';
  const templates=[
   ['Заявление','Заявление\n\nПрошу рассмотреть моё обращение.\n\nДата: __________\nПодпись: __________'],
   ['Акт','Акт\n\nСтороны составили настоящий акт о следующем:\n\nПредмет: __________\nДата: __________'],
   ['Расписка','Расписка\n\nЯ, __________, подтверждаю получение __________.\n\nДата: __________']
  ];
  for(const [label,example] of templates){
   examples.append(button(label,()=>{body.value=example;message('Учебный шаблон. Замените пример своим текстом.');}));
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
   button('Создать с Сэйви',()=>onSayvi('create'))
  ));
  panel.append(warn('Это локальный редактор простого текста, не юридическая проверка. Образцы не являются готовыми договорами.'),status(''));
 }
 function renderSign(){
  panel.append(heading('Подпись пальцем','Рукописная отметка, не КЭП и не юридическое подписание.'));
  const paper=$('div','sv-doc-tool-sign-paper');
  const canvas=$('canvas');canvas.width=650;canvas.height=240;
  canvas.setAttribute('aria-label','Поле подписи пальцем или стилусом');
  paper.append(canvas);panel.append(paper);
  const ctx=canvas.getContext('2d');
  if(!ctx){panel.append(status('Подпись на этом устройстве недоступна.'));return;}
  ctx.strokeStyle='#1b2a31';ctx.lineWidth=3.5;
  ctx.lineCap='round';ctx.lineJoin='round';
  let drawing=false,marks=0;
  const point=e=>{
   const bounds=canvas.getBoundingClientRect();
   return{x:(e.clientX-bounds.left)*canvas.width/bounds.width,
    y:(e.clientY-bounds.top)*canvas.height/bounds.height};
  };
  canvas.addEventListener('pointerdown',e=>{
   e.preventDefault();drawing=true;
   canvas.setPointerCapture?.(e.pointerId);
   const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);
   ctx.lineTo(p.x+.1,p.y+.1);ctx.stroke();marks++;
  });
  canvas.addEventListener('pointermove',e=>{
   if(!drawing)return;e.preventDefault();
   const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();
  });
  const stop=()=>{drawing=false;};
  canvas.addEventListener('pointerup',stop);
  canvas.addEventListener('pointercancel',stop);
  const clearButton=button('Очистить',()=>{
   ctx.clearRect(0,0,canvas.width,canvas.height);marks=0;
  });
  const pngButton=button('Сохранить PNG',()=>{
   if(!marks){message('Сначала нарисуйте подпись.');return;}
   canvas.toBlob(blob=>{
    if(blob)save(blob,'SEYVEO-рукописная-подпись.png');
    else message('Не удалось сохранить подпись.');
   },'image/png');
  },'sv-doc-tool-primary');
  const onScan=button('Подписать последний скан',async()=>{
   if(!marks||!scans.length){message('Нужен рисунок подписи и хотя бы одна отсканированная страница.');return;}
   try{
    const last=scans.at(-1);
    const image=await imageOf(new Blob([last.jpegBytes],{type:'image/jpeg'}));
    const dest=canvasOf(image,1600),g=dest.getContext('2d');
    const width=dest.width*.4;
    const height=width*canvas.height/canvas.width;
    g.drawImage(canvas,dest.width-width-40,dest.height-height-40,width,height);
    const updated=scans.slice(0,-1).concat(jpegOf(dest));
    save(window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(updated),'SEYVEO-скан-с-подписью.pdf');
    message('Подготовлена копия скана с нарисованной подписью. Это не КЭП.');
   }catch{message('Не удалось собрать копию с подписью.');}
  });
  panel.append(controls(pngButton,clearButton,onScan),
   warn('Подпись на экране не равна электронной подписи. Для готовых PDF потребуется отдельный редактор; официальная КЭП подключается через «Умные подключения».'),
   status(scans.length?'Доступен последний скан из этой сессии.':'Для вставки в PDF сначала отсканируйте страницу.'));
 }
 function renderPrint(){
  panel.append(heading('Печать','Открытие файла в системном просмотрщике; принтер выбирает ОС.'));
  const filePicker=$('input');filePicker.type='file';
  filePicker.accept='.pdf,.jpg,.jpeg,.png,.webp';
  filePicker.hidden=true;
  const picked=getCurrentFile();
  if(picked&&/\.(?:pdf|jpe?g|png|webp)$/i.test(picked.name||''))currentPrint=picked;
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
  panel.append(warn('После открытия файла выберите системное «Поделиться → Печать». SEYVEO не утверждает, что принтер найден или печать завершена.'),
   status(''));
 }
 return true;
}
window.SEYVEO_DOCS_STUDIO=Object.freeze({mount,reset});
})();
