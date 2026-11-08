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
  const pre=el('pre','svdv-text','Открываем текст…');
  stage.append(pre);
  file.text().then(text=>{
   if(active&&pre.isConnected)pre.textContent=text.slice(0,120000)||
    'Документ пуст.';
  }).catch(()=>{
   if(active&&pre.isConnected)pre.textContent='Не удалось открыть текст.';
  });
 }else{
  const fallback=el('div','svdv-fallback');
  fallback.append(icon('file'),
   el('strong','','Оригинал '+info.label),
   el('small','','Этот формат откроется в подходящем приложении.'));
  stage.append(fallback);
 }
 root.append(stage);
 const notice=el('p','svdv-notice');
 notice.setAttribute('role','status');
 const say=(value)=>{if(active)notice.textContent=value;};
 const supportsPrint=info.kind==='pdf'||info.kind==='image';
 const toolbar=el('div','svdv-toolbar');
 const doShare=()=>{
  if(typeof navigator==='undefined'||typeof navigator.share!=='function'){
   say('Системное меню недоступно. Сохраните файл и отправьте его самостоятельно.');
   return;
  }
  const data={files:[file],title:file.name};
  try{
   if(typeof navigator.canShare==='function'&&!navigator.canShare(data)){
    say('Этот формат нельзя отправить напрямую. Сохраните оригинал.');return;
   }
   // Must begin synchronously from click, before any await, for iOS Safari.
   void navigator.share(data).then(()=>{
    say('Открыто системное меню. Доставку подтвердит выбранное приложение.');
   },error=>{
    if(error?.name!=='AbortError')say('Не удалось открыть меню. Сохраните файл вручную.');
   });
  }catch{say('Меню отправки недоступно. Сохраните оригинал.');}
 };
 toolbar.append(action('Поделиться','share',doShare,'svdv-primary'));
 toolbar.append(action('Печать','print',()=>{
  if(!supportsPrint){
   say('Для печати этого формата откройте оригинал в подходящем приложении.');
   return;
  }
  // No false "printed" status and no popup opened after an async step.
  const tab=window.open(objectUrl,'_blank','noopener,noreferrer');
  if(!tab) say('Откройте оригинал и выберите «Печать» в системном меню.');
  else say('Откройте системное меню документа и выберите «Печать».');
 }));
 const sign=action('Подписать','signature',()=>{
  if(info.kind!=='image'){
   say('В этом прототипе подпись поверх готового PDF пока недоступна. Можно подписать скан в инструменте «Подписать».');
   return;
  }
  try{
   const result=onSignImage(file);
   if(result&&typeof result.then==='function'){
    result.then(ok=>{
     if(ok!==true)say('Не удалось открыть подпись. Попробуйте через «Сканировать».');
    },()=>say('Не удалось подготовить подпись.'));
   }else if(result!==true)say('Откройте инструмент «Подписать» после сканирования.');
  }catch{say('Не удалось подготовить подпись.');}
 });
 toolbar.append(sign);
 const more=el('details','svdv-more');
 const summary=el('summary','svdv-more-button');
 summary.append(icon('more'),el('span','','Ещё'));
 more.append(summary);
 const moreBody=el('div','svdv-more-options');
 const openLink=el('a','svdv-link');
 openLink.href=objectUrl;openLink.target='_blank';openLink.rel='noopener noreferrer';
 openLink.append(icon('file'),el('span','','Открыть оригинал'));
 const download=el('a','svdv-link');
 download.href=objectUrl;download.download=file.name||'Документ';
 download.append(icon('download'),el('span','','Сохранить копию'));
 moreBody.append(openLink,download,action('Сэйви поможет','sayvi',()=>{
  onSayvi('review');
 }));
 more.append(moreBody);toolbar.append(more);
 root.append(toolbar,notice);
 target.replaceChildren(root);
 return Object.freeze({
  destroy(){
   if(!active)return;
   active=false;target.replaceChildren();
   URL.revokeObjectURL(objectUrl);
  }
 });
}
window.SEYVEO_DOCS_VIEWER=Object.freeze({mount});
})();
