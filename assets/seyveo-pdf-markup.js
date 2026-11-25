/* Local PDF markup: original bytes never change. Export is an explicitly rasterized copy. */
(()=>{
'use strict';
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;};
function button(label,fn,cls=''){const n=el('button',cls,label);n.type='button';n.addEventListener('click',fn);return n;}
const MAX_PAGES=12,MAX_FILE=20*1024*1024;
async function imageFrom(page){
 const url=URL.createObjectURL(new Blob([page.jpegBytes],{type:'image/jpeg'}));
 try{const img=new Image();img.src=url;await img.decode();return img;}finally{URL.revokeObjectURL(url);}
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function size(w,h){const k=Math.min(1,1600/w,2200/h);return [Math.max(1,Math.round(w*k)),Math.max(1,Math.round(h*k))];}
async function jpeg(c){const b=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.9));if(!b)throw Error('Не удалось собрать страницу.');return {width:c.width,height:c.height,jpegBytes:new Uint8Array(await b.arrayBuffer())};}
function open(file,{parent,loadPdf,onSave,onSayvi}={}){
 if(!parent?.isConnected||!window.SEYVEO_DOCS_EXPORT||!window.SEYVEO_EDITOR_CAPSULE)return false;
 const capsule=window.SEYVEO_EDITOR_CAPSULE;
 if(parent.querySelector('.sv-pdf-markup[open]'))return true;
 const d=el('dialog','sv-pdf-markup');d.setAttribute('aria-label','Разметка PDF');
 const head=el('header','sv-pdf-markup-head'),title=el('strong','','Разметка PDF');
 const glyph=(name)=>{const n=el('span','sv-pdf-markup-icon');n.innerHTML=window.SEYVEO_DOCUMENT_ICONS?.markup(name)||'';return n;};
 const round=(label,kind,fn)=>{const b=button('',fn,'sv-pdf-markup-round');b.setAttribute('aria-label',label);b.title=label;b.append(glyph(kind));return b;};
 let closed=false,busy=true,dirty=false,mode='view',index=0,pdfTask=null,pages=[],drawing=null,ink='#20262d';
 const back=round('Назад','back',()=>requestClose());
 const save=round('Сохранить копию','check',()=>void exportCopy());save.disabled=true;
 head.append(back,title,save);
 const status=el('p','sv-pdf-markup-status','Подготавливаем страницы…');status.setAttribute('role','status');
 const viewport=el('div','sv-pdf-markup-viewport'),paper=el('div','sv-pdf-markup-paper');viewport.append(paper);
 const pager=el('div','sv-pdf-markup-pager'),count=el('span','','');
 const prev=round('Предыдущая страница','back',()=>go(-1)),next=round('Следующая страница','back',()=>go(1));next.classList.add('sv-pdf-markup-next');pager.append(prev,count,next);
 const inputRow=el('div','sv-pdf-markup-input-row');inputRow.hidden=true;
 const input=el('input','sv-pdf-markup-input');input.type='text';input.maxLength=240;input.placeholder='Введите текст, затем коснитесь листа';input.setAttribute('aria-label','Текст для добавления');
 inputRow.append(input);
 const rail=capsule.attach(el('div','sv-note-tools-compact'),'pdf');
 rail.setAttribute('aria-label','Инструменты PDF · прокрутите для остальных');
 const tools=[];
 function tool(label,id){const b=capsule.button(id,label,undefined,()=>setMode(id));b.setAttribute('aria-pressed','false');tools.push([id,b]);rail.append(b);}
 tool('Добавить текст','text');tool('Перо','pen');tool('Маркер','marker');tool('Ластик разметки','eraser');
 const palette=el('div','sv-pdf-ink-palette');palette.hidden=true;
 const color=capsule.button('color','Цвет разметки',undefined,()=>{palette.hidden=!palette.hidden;color.setAttribute('aria-expanded',String(!palette.hidden));});
 color.setAttribute('aria-expanded','false');rail.append(color);
 for(const [name,value] of [['Чёрный','#20262d'],['Синий','#176ab4'],['Красный','#c7353c'],['Зелёный','#21834a'],['Жёлтый','#f2c500']]){
  const swatch=button('',()=>{ink=value;rail.style.setProperty('--sv-editor-ink',value);for(const b of palette.children)b.setAttribute('aria-pressed',String(b.dataset.color===ink));palette.hidden=true;color.setAttribute('aria-expanded','false');});
  swatch.dataset.color=value;swatch.style.setProperty('--swatch',value);swatch.setAttribute('aria-label',name);swatch.setAttribute('aria-pressed',String(value===ink));palette.append(swatch);
 }
 tool('Рукописная подпись','signature');tool('Прокрутка страницы','view');
 const history=(direction)=>{const p=pages[index];if(!p||drawing||busy)return;const from=direction==='undo'?p.ops:p.redo,to=direction==='undo'?p.redo:p.ops;if(!from.length)return;to.push(from.pop());dirty=pages.some(x=>x.ops.length);paint(p);sync();};
 const undo=capsule.button('undo','Отменить действие',undefined,()=>history('undo'));
 const redo=capsule.button('redo','Повторить действие',undefined,()=>history('redo'));rail.append(undo,redo);
 const sayvi=onSayvi?capsule.button('sayvi','Сэйви поможет с исходным PDF',undefined,()=>{if(busy)return;if(dirty){status.textContent='Сначала сохраните разметку или вернитесь к оригиналу.';return;}d.close();onSayvi('review');}):null;
 if(sayvi)rail.append(sayvi);
 d.append(head,status,viewport,pager,inputRow,palette,rail);parent.append(d);
 const releaseViewport=capsule.viewport(d);
 function sync(){
  prev.disabled=busy||index===0;next.disabled=busy||index>=pages.length-1;count.textContent=pages.length?(index+1)+' из '+pages.length:'';
  save.disabled=busy||!dirty;undo.disabled=busy||!pages[index]?.ops.length;redo.disabled=busy||!pages[index]?.redo.length;color.disabled=busy;if(sayvi)sayvi.disabled=busy;
  for(const [id,b] of tools){b.disabled=busy;b.setAttribute('aria-pressed',String(mode===id));}
  inputRow.hidden=mode!=='text'||busy;paper.dataset.mode=mode;
 }
 function setMode(value){if(busy)return;mode=value;palette.hidden=true;color.setAttribute('aria-expanded','false');sync();status.textContent=value==='text'?'Введите текст и коснитесь места на листе.':value==='pen'?'Рисуйте пальцем или мышью.':value==='marker'?'Проведите по месту, которое нужно выделить.':value==='eraser'?'Ластик удаляет только ваши пометки.':value==='signature'?'Распишитесь на листе пальцем или мышью. Это не электронная подпись.':'Прокручивайте лист.';}
 function paint(p){
  const c=p.overlay,ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  for(const op of p.ops){
   if(op.kind==='text'){
    ctx.fillStyle=op.color||'#20262d';ctx.font=op.font+'px Arial, sans-serif';ctx.textBaseline='top';
    ctx.fillText(op.text,op.x,op.y,Math.max(1,c.width-op.x-3));continue;
   }
   ctx.save();if(op.kind==='eraser')ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=op.kind==='marker'?.32:1;ctx.strokeStyle=op.color||'#20262d';ctx.lineWidth=op.width;ctx.lineCap='round';ctx.lineJoin='round';
   ctx.beginPath();ctx.moveTo(op.points[0].x,op.points[0].y);for(const pt of op.points.slice(1))ctx.lineTo(pt.x,pt.y);
   if(op.points.length===1)ctx.lineTo(op.points[0].x+.1,op.points[0].y);ctx.stroke();ctx.restore();
  }
 }
 function show(){const p=pages[index];if(!p)return;paper.replaceChildren(p.base,p.overlay);paint(p);viewport.scrollTop=0;sync();}
 function go(delta){if(busy||drawing)return;index=Math.max(0,Math.min(pages.length-1,index+delta));show();}
 function point(event,c){const r=c.getBoundingClientRect();return {x:Math.max(0,Math.min(c.width-1,(event.clientX-r.left)*c.width/r.width)),y:Math.max(0,Math.min(c.height-1,(event.clientY-r.top)*c.height/r.height))};}
 function connect(p){
  const c=p.overlay;
  c.addEventListener('pointerdown',e=>{
   if(busy||mode==='view'||e.button!==0||!e.isPrimary)return;
   e.preventDefault();const pt=point(e,c),factor=c.width/595;
   if(mode==='text'){
    const text=input.value.trim();if(!text){input.focus();return;}
    const font=Math.max(12,12*factor);pt.y=Math.min(pt.y,Math.max(0,c.height-font-2));p.redo.length=0;p.ops.push({kind:'text',text,...pt,font,color:ink});dirty=true;paint(p);input.value='';sync();return;
   }
   const op={kind:mode,width:(mode==='eraser'?16:mode==='marker'?12:1.8)*factor,color:mode==='marker'&&ink==='#20262d'?'#f2c500':ink,points:[pt]};p.redo.length=0;
   drawing={id:e.pointerId,p,op};p.ops.push(op);c.setPointerCapture?.(e.pointerId);dirty=true;paint(p);sync();
  });
  c.addEventListener('pointermove',e=>{if(drawing?.id!==e.pointerId||drawing.p!==p)return;drawing.op.points.push(point(e,c));paint(p);});
  const finish=e=>{if(drawing?.id===e.pointerId){drawing=null;sync();}};
  c.addEventListener('pointerup',finish);c.addEventListener('pointercancel',finish);c.addEventListener('lostpointercapture',finish);
 }
 function requestClose(){if(busy&&dirty)return;if(dirty&&!window.confirm('Выйти без сохранения разметки? Исходный PDF не изменится.'))return;d.close();}
 d.addEventListener('cancel',e=>{if(e.target!==d)return;e.preventDefault();requestClose();});
 d.addEventListener('close',()=>{closed=true;releaseViewport();try{void pdfTask?.destroy()?.catch?.(()=>{});}catch{}d.remove();},{once:true});
 async function exportCopy(){
  if(busy||!dirty||drawing)return;
  if(!window.confirm('Сохранить отдельную копию PDF? Все страницы станут изображениями: поиск текста, ссылки и интерактивные поля в копии могут исчезнуть. Оригинал останется без изменений.'))return;
  busy=true;sync();status.textContent='Сохраняем копию…';
  try{
   const output=[];
   for(const p of pages){if(closed)return;const c=canvas(p.base.width,p.base.height);const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(p.base,0,0);ctx.drawImage(p.overlay,0,0);output.push(await jpeg(c));}
   const blob=window.SEYVEO_DOCS_EXPORT.pdfFromJpegs(output);if(blob.size>MAX_FILE)throw Error('Копия больше 20 МБ.');
   const copy=new File([blob],file.name.replace(/\.pdf$/i,'')+' — с пометками.pdf',{type:'application/pdf'});
   if(closed)return;
   if(onSave){await onSave(copy);}else{const url=URL.createObjectURL(copy);const a=el('a');a.href=url;a.download=copy.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
   dirty=false;status.textContent=onSave?'Копия сохранена в документах.':'Копия подготовлена для скачивания.';d.close();
  }catch(e){if(!closed)status.textContent=e?.message||'Не удалось сохранить копию.';}finally{busy=false;if(!closed)sync();}
 }
 async function prepare(){
  try{
   let scanned=null;try{scanned=await window.SEYVEO_DOCS_EXPORT.readScanPdf(file);}catch{}
   if(closed)return;
   if(scanned?.length){
    for(const page of scanned){if(closed)return;const img=await imageFrom(page);if(closed)return;const [w,h]=size(img.naturalWidth,img.naturalHeight),base=canvas(w,h);base.getContext('2d',{alpha:false}).drawImage(img,0,0,w,h);add(base);}
   }else{
    const lib=await loadPdf();if(closed)return;
    const data=new Uint8Array(await file.arrayBuffer());if(closed)return;
    pdfTask=lib.getDocument({data,useSystemFonts:true,isEvalSupported:false,disableAutoFetch:true,disableStream:true});const doc=await pdfTask.promise;
    if(doc.numPages>MAX_PAGES)throw Error('Разметка пока доступна для PDF до 12 страниц.');
    for(let n=1;n<=doc.numPages;n++){if(closed)return;const page=await doc.getPage(n);if(closed)return;const v=page.getViewport({scale:1}),k=Math.min(2.5,1600/v.width,2200/v.height),vp=page.getViewport({scale:k}),base=canvas(Math.ceil(vp.width),Math.ceil(vp.height));await page.render({canvasContext:base.getContext('2d',{alpha:false}),viewport:vp}).promise;if(closed)return;page.cleanup();add(base);}
   }
   if(!pages.length)throw Error('Нет доступных страниц.');
   busy=false;show();setMode('view');
  }catch(e){if(!closed){status.textContent=e?.message||'Не удалось открыть страницы.';busy=false;sync();for(const [,b] of tools)b.disabled=true;}}
 }
 function add(base){base.className='sv-pdf-markup-base';const overlay=canvas(base.width,base.height);overlay.className='sv-pdf-markup-overlay';overlay.setAttribute('aria-label','Слой разметки страницы');const p={base,overlay,ops:[],redo:[]};connect(p);pages.push(p);}
 sync();d.showModal();void prepare();return true;
}
window.SEYVEO_PDF_MARKUP=Object.freeze({open});
})();
