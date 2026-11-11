/* SEYVEO Docs · one beautiful local file viewer.
 * Plain Files are deliberately user-selected or decrypted by the existing
 * password vault. Nothing is silently sent to chat, mail, API or printers.
 * The PDF stage previews the actual PDF via browser native iframe; we do
 * not claim a PDF.js renderer or certified signature.
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
const icons={
 file:'<path d="M7 2h7l5 5v15H7zM14 2v6h5M10 13h6M10 17h6"/>',
 pdf:'<path d="M7 2h7l5 5v15H7zM14 2v6h5M10 13h6M10 17h4"/>',
 image:'<rect x="2.5" y="4" width="19" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 6-5 4 3 3-4 5 6"/>',
 signature:'<path d="M4 17c3-7 4 4 7-2 3-8 4 3 8-3M4 21h16"/>',
 share:'<path d="M12 16V3m-5 5 5-5 5 5M4 14v7h16v-7"/>',
 print:'<path d="M6 9V3h12v6M6 17H4V9h16v8h-2M6 15h12v6H6zM17 12h.01"/>',
 more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3"/>',
 sayvi:'<path d="m5 18 5-10 3 6 3-4 3 8M3 20h18"/>'
};
function icon(key){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');
 svg.setAttribute('aria-hidden','true');
 svg.setAttribute('fill','none');
 svg.setAttribute('stroke','currentColor');
 svg.setAttribute('stroke-width','1.45');
 svg.setAttribute('stroke-linecap','round');
 svg.setAttribute('stroke-linejoin','round');
 const group=document.createElementNS('http://www.w3.org/2000/svg','g');
 // Constant in-repo SVG paths, never document-controlled markup.
 group.innerHTML=icons[key]||icons.file;
 svg.append(group);return svg;
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
function mount(target,file,{onSignImage=()=>{},onSayvi=()=>{}}={}){
 if(!target||!file||typeof file.name!=='string'||typeof file.size!=='number'||
    file.size<1||file.size>MAX||typeof file.text!=='function')return false;
 const info=format(file.name,file.type);
 let objectUrl;
 try{objectUrl=URL.createObjectURL(file);}catch{return false;}
 let active=true;
 const root=el('section','svdv-viewer');
 root.setAttribute('aria-label','Просмотр документа '+file.name);
 const header=el('div','svdv-header');
 const glyph=el('span','svdv-file-icon');glyph.append(icon(info.kind==='image'?'image':info.kind==='pdf'?'pdf':'file'));
 const copy=el('div','svdv-heading');
 copy.append(el('strong','svdv-name',file.name),
  el('span','svdv-meta',info.label+' · '+(Math.max(1,Math.ceil(file.size/1024)))+' КБ'));
 header.append(glyph,copy);root.append(header);
 const stage=el('div','svdv-stage');
 if(info.kind==='image'){
  const img=el('img','svdv-picture');
  img.src=objectUrl;img.alt='Изображение документа '+file.name;
  stage.append(img);
 }else if(info.kind==='pdf'){
  const frame=el('iframe','svdv-frame');
  frame.src=objectUrl;frame.title='Просмотр PDF '+file.name;
  frame.setAttribute('loading','lazy');
  stage.append(frame);
 }else if(info.kind==='text'){
  stage.classList.add('svdv-stage-document');
  const pre=el('pre','svdv-text','Открываем текст…');
  stage.append(pre);
  file.text().then(text=>{
   if(active&&pre.isConnected)pre.textContent=text.slice(0,120000)||
    'Документ пуст.';
  }).catch(()=>{
   if(active&&pre.isConnected)pre.textContent='Не удалось открыть текст.';
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
   pre.textContent=text;
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
 const say=(value)=>{if(active)notice.textContent=value;};
 const supportsPrint=info.kind==='pdf'||info.kind==='image';
 const toolbar=el('div','svdv-toolbar');
 const save=el('a','svdv-action svdv-primary');
 save.href=objectUrl;save.download=file.name||'Документ';
 save.setAttribute('aria-label','Сохранить оригинал '+file.name);
 save.append(icon('download'),el('span','','Сохранить'));
 toolbar.append(save);
 const doShare=()=>{
  if(typeof navigator==='undefined'||typeof navigator.share!=='function'){
   say('На этом устройстве доступно сохранение оригинала.');return;
  }
  const data={files:[file],title:file.name};
  try{
   if(typeof navigator.canShare==='function'&&!navigator.canShare(data)){
    say('Системная отправка этого формата недоступна. Сохрани оригинал.');return;
   }
   // iOS requires share() directly in the user's click handler.
   void navigator.share(data).catch(error=>{
    if(error?.name!=='AbortError')say('Не удалось открыть меню отправки. Сохрани оригинал.');
   });
  }catch{say('Не удалось открыть системное меню.');}
 };
 toolbar.append(action('Поделиться','share',doShare));
 const more=el('details','svdv-more');
 const summary=el('summary','svdv-more-button');
 summary.append(icon('more'),el('span','','Ещё'));
 more.append(summary);
 const moreBody=el('div','svdv-more-options');
 const openLink=el('a','svdv-link');
 openLink.href=objectUrl;openLink.target='_blank';openLink.rel='noopener noreferrer';
 openLink.append(icon('file'),el('span','','Открыть оригинал'));
 moreBody.append(openLink);
 if(supportsPrint){
  moreBody.append(action('Печать','print',()=>{
   const tab=window.open(objectUrl,'_blank','noopener,noreferrer');
   say(tab?'В открытом документе выбери системную печать.':'Открой оригинал и выбери системную печать.');
  }));
 }
 if(info.kind==='image'){
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
 moreBody.append(action('Сэйви поможет','sayvi',()=>onSayvi('review')));
 moreBody.addEventListener('click',event=>{if(event.target.closest('button,a'))more.open=false;});
 more.append(moreBody);toolbar.append(more);
 const dismissMore=event=>{if(!more.contains(event.target))more.open=false;};
 const closeMoreOnEscape=event=>{if(event.key==='Escape'&&more.open){more.open=false;summary.focus();}};
 document.addEventListener('pointerdown',dismissMore,{passive:true});
 document.addEventListener('keydown',closeMoreOnEscape);
 root.append(toolbar,notice);
 target.replaceChildren(root);
 return Object.freeze({
  destroy(){
   if(!active)return;
   active=false;target.replaceChildren();
   document.removeEventListener('pointerdown',dismissMore);
   document.removeEventListener('keydown',closeMoreOnEscape);
   URL.revokeObjectURL(objectUrl);
  }
 });
}
window.SEYVEO_DOCS_VIEWER=Object.freeze({mount});
})();
