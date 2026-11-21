/* SEYVEO Notebook · editable rich text without markup in the text body.
 * Text remains plain for search/tasks; safe typographic markup lives in richHtml.
 * Uses native contenteditable formatting, including Safari on iPhone. */
(()=>{'use strict';
 const dialog=document.getElementById('noteReviewDialog');
 const textarea=document.getElementById('noteReviewText');
 const form=document.getElementById('noteReviewForm');
 if(!dialog||!textarea||!form)return;
 const rich=document.createElement('div');
 rich.id='svNoteRichEditor';
 rich.className='sv-note-rich-editor';
 rich.setAttribute('contenteditable','true');
 rich.setAttribute('role','textbox');
 rich.setAttribute('aria-label','Текст заметки');
 rich.setAttribute('aria-multiline','true');
 rich.setAttribute('data-placeholder','Что нужно запомнить?');
 rich.setAttribute('spellcheck','true');
 rich.hidden=true;
 textarea.after(rich);
 let active=false,savedRange=null,locked=false,plainSelection=null;
 // Only a closed set of tones can be persisted. Do not trust arbitrary
 // inline CSS when loading a note, pasted HTML or a shared document.
 const MARKER_TONES=new Set(['lemon','mint','sky','rose']);
 const MARKER_KINDS=new Set(['highlight','underline']);
 let markerTone='lemon';
 const allowed=new Set(['B','STRONG','EM','I','U','DIV','P','BR','H2','H3']);
 function cleanup(node,into){
  if(node.nodeType===Node.TEXT_NODE){into.append(document.createTextNode(node.nodeValue||''));return;}
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const tag=node.tagName.toUpperCase();
  if(['SCRIPT','STYLE','SVG','IFRAME','OBJECT','TEMPLATE'].includes(tag))return;
  const markerKind=tag==='SPAN' && MARKER_KINDS.has(node.getAttribute('data-sv-marker'))
   ?node.getAttribute('data-sv-marker'):null;
  const safe=allowed.has(tag)?tag==='H2'?'H3':tag:markerKind?'SPAN':null;
  const dest=safe?document.createElement(safe.toLowerCase()):into;
  if(markerKind){
   const tone=node.getAttribute('data-sv-marker-tone');
   dest.setAttribute('data-sv-marker',markerKind);
   dest.setAttribute('data-sv-marker-tone',MARKER_TONES.has(tone)?tone:'lemon');
  }
  if(tag==='BR'){into.append(dest);return;}
  for(const child of Array.from(node.childNodes))cleanup(child,dest);
  if(safe)into.append(dest);
 }
 function safeHTML(html){
  if(!html)return'';
  const input=document.createElement('template');
  input.innerHTML=String(html).slice(0,40000);
  const output=document.createElement('div');
  for(const node of Array.from(input.content.childNodes))cleanup(node,output);
  return output.innerHTML.slice(0,40000);
 }
 function plainValue(){
  // innerText follows visual line breaks in contenteditable on iOS.
  return (rich.innerText||'').replace(/\u00a0/g,' ').replace(/\r\n?/g,'\n').replace(/\n$/,'').slice(0,8000);
 }
 function sync(){
  if(!active||locked)return;
  const text=plainValue();
  textarea.value=text;
  textarea.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function remember(){
  if(!active)return;
  const sel=window.getSelection();
  if(sel?.rangeCount && rich.contains(sel.anchorNode)&&rich.contains(sel.focusNode)){
   savedRange=sel.getRangeAt(0).cloneRange();
  }
 }
 function restore(){
  if(!active)return;
  rich.focus({preventScroll:true});
  const sel=window.getSelection();
  if(!sel)return;
  if(savedRange){
   try{sel.removeAllRanges();sel.addRange(savedRange.cloneRange());return;}
   catch{savedRange=null;}
  }
  const range=document.createRange();
  range.selectNodeContents(rich);range.collapse(false);
  sel.removeAllRanges();sel.addRange(range);
 }
 function activate(){
  if(active)return;
  // Transfer the native textarea selection into the rich editor before
  // hiding it; otherwise iPhone Safari formats at the end of the note.
  let start=plainSelection?.start??textarea.selectionStart??textarea.value.length;
  let end=plainSelection?.end??textarea.selectionEnd??start;
  start=Math.max(0,Math.min(start,textarea.value.length));
  end=Math.max(start,Math.min(end,textarea.value.length));
  locked=true;
  rich.textContent=textarea.value;
  textarea.hidden=true;
  rich.hidden=false;
  active=true;
  savedRange=null;
  const textNode=rich.firstChild;
  if(textNode?.nodeType===Node.TEXT_NODE){
   const range=document.createRange();
   range.setStart(textNode,start);
   range.setEnd(textNode,end);
   savedRange=range.cloneRange();
  }
  plainSelection=null;
  locked=false;
 }
 function load(html){
  const clean=safeHTML(html);
  locked=true;
  active=Boolean(clean);
  savedRange=null;plainSelection=null;
  textarea.hidden=active;
  rich.hidden=!active;
  if(active){rich.innerHTML=clean;textarea.value=plainValue();}
  else rich.replaceChildren();
  locked=false;
 }
 // Wrap only selected text nodes. Unlike surroundContents(), this also
 // handles selections crossing paragraph, bold and italic boundaries.
 // A collapsed caret must never color the entire note.
 function markSelection(kind){
  if(!MARKER_KINDS.has(kind))return false;
  activate();restore();
  const sel=window.getSelection();
  if(!sel?.rangeCount)return false;
  const range=sel.getRangeAt(0).cloneRange();
  if(range.collapsed||!rich.contains(range.commonAncestorContainer))return false;
  const walker=document.createTreeWalker(rich,NodeFilter.SHOW_TEXT);
  const pieces=[];
  while(walker.nextNode()){
   const node=walker.currentNode;
   if(!node.nodeValue||!range.intersectsNode(node))continue;
   const start=range.startContainer===node?range.startOffset:0;
   const end=range.endContainer===node?range.endOffset:node.length;
   if(end>start)pieces.push({node,start,end});
  }
  if(!pieces.length)return false;
  let last=null;
  for(const {node,start,end} of pieces){
   if(!node.isConnected)continue;
   let part=node;
   if(end<part.length)part.splitText(end);
   if(start>0)part=part.splitText(start);
   if(!part.nodeValue)continue;
   const mark=document.createElement('span');
   mark.setAttribute('data-sv-marker',kind);
   mark.setAttribute('data-sv-marker-tone',markerTone);
   part.before(mark);mark.append(part);
   last=mark;
  }
  if(!last)return false;
  const cursor=document.createRange();cursor.selectNodeContents(last);cursor.collapse(false);
  sel.removeAllRanges();sel.addRange(cursor);savedRange=cursor.cloneRange();
  sync();
  return true;
 }
 // Reuse the existing four real swatches, but reveal them only when the
 // person taps "Marker" or "Marker underline". No second color picker.
 const markerMenu=document.getElementById('svNoteFormatMenu');
 const markerColors=markerMenu?.querySelector('.sv-note-marker-colors');
 let markerMode='highlight';
 const palette=document.createElement('div');
 palette.id='svNoteMarkerPalette';
 palette.className='sv-note-marker-palette';
 palette.setAttribute('role','group');
 palette.setAttribute('aria-label','Выбрать цвет текстового маркера');
 palette.hidden=true;
 const paletteCaption=document.createElement('span');
 paletteCaption.className='sv-note-marker-caption';
 paletteCaption.textContent='Цвет маркера';
 if(markerColors)palette.append(paletteCaption,markerColors);
 dialog.append(palette);
 const updateToneButtons=()=>{
  markerColors?.querySelectorAll('[data-sv-marker-tone]').forEach(button=>
   button.setAttribute('aria-pressed',String(button.dataset.svMarkerTone===markerTone)));
 };
 const closePalette=()=>{palette.hidden=true;};
 const openPalette=kind=>{
  if(!markerColors||!['marker','marker-underline'].includes(kind))return false;
  if(active)remember();
  else plainSelection={start:textarea.selectionStart,end:textarea.selectionEnd};
  markerMode=kind==='marker'?'highlight':'underline';
  palette.dataset.svMarkerMode=markerMode;
  paletteCaption.textContent=markerMode==='underline'?'Цвет подчёркивания':'Цвет маркера';
  updateToneButtons();
  const anchor=dialog.querySelector('[data-note-tool="heading"]')?.getBoundingClientRect();
  const bounds=dialog.getBoundingClientRect();
  const width=216;
  const center=anchor?.width?anchor.left-bounds.left+anchor.width/2:bounds.width/2;
  const left=Math.max(12,Math.min(Math.max(12,bounds.width-width-12),center-width/2));
  palette.style.setProperty('--sv-note-marker-left',Math.round(left)+'px');
  markerMenu.hidden=true;
  dialog.querySelector('[data-note-tool="heading"]')?.setAttribute('aria-expanded','false');
  palette.hidden=false;
  return true;
 };
 markerColors?.addEventListener('click',event=>{
  const button=event.target.closest('button[data-sv-marker-tone]');
  if(!button||!markerColors.contains(button))return;
  if(!MARKER_TONES.has(button.dataset.svMarkerTone))return;
  markerTone=button.dataset.svMarkerTone;
  updateToneButtons();
  const ok=markSelection(markerMode);
  closePalette();
  const status=document.getElementById('noteReviewStatus');
  if(status){
   status.hidden=Boolean(ok);
   status.textContent=ok?'':'Выдели слово или фразу, затем выбери цвет маркера.';
  }
 });
 // Keep iOS/desktop text selection when choosing the swatch.
 markerMenu?.addEventListener('mousedown',event=>{
  if(event.target.closest('button'))event.preventDefault();
 });
 palette.addEventListener('mousedown',event=>{
  if(event.target.closest('button'))event.preventDefault();
 });
 document.addEventListener('pointerdown',event=>{
  if(!dialog.open||palette.hidden||palette.contains(event.target))return;
  closePalette();
 },true);
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||palette.hidden)return;
  event.preventDefault();event.stopPropagation();closePalette();
 },true);
 dialog.addEventListener('close',closePalette);
 dialog.addEventListener('seyveo:smart-note-open',closePalette);
 updateToneButtons();
 window.SEYVEO_NOTE_MARKER=Object.freeze({open:openPalette,close:closePalette});
 function applyFormat(kind){
  if(kind==='marker')return markSelection('highlight');
  if(kind==='marker-underline')return markSelection('underline');
  if(!['bold','italic','underline','heading'].includes(kind))return false;
  activate();
  restore();
  const doc=document;
  try{
   // Supported by iOS Safari; unlike textarea delimiters, this formats
   // the selection directly and keeps the caret in the editor.
   if(kind==='heading'){
    doc.execCommand('formatBlock',false,'h3');
   }else doc.execCommand(kind,false,null);
  }catch{return false;}
  remember();sync();
  rich.focus({preventScroll:true});
  return true;
 }
 function getHTML(){
  if(!active)return'';
  return safeHTML(rich.innerHTML);
 }
 function insertText(text){
  if(!active)return false;
  restore();
  try{document.execCommand('insertText',false,String(text).slice(0,8000));}
  catch{const sel=getSelection();if(sel?.rangeCount){const r=sel.getRangeAt(0);r.deleteContents();r.insertNode(document.createTextNode(String(text)));r.collapse(false);}}
  remember();sync();return true;
 }
 function appendText(text){
  if(!active)return false;
  // A transcription is appended, never substituted for a highlighted passage.
  const range=document.createRange();range.selectNodeContents(rich);range.collapse(false);
  savedRange=range.cloneRange();
  return insertText(text);
 }
 textarea.addEventListener('select',()=>{
  if(!active)plainSelection={start:textarea.selectionStart,end:textarea.selectionEnd};
 });
 textarea.addEventListener('keyup',()=>{
  if(!active)plainSelection={start:textarea.selectionStart,end:textarea.selectionEnd};
 });
 rich.addEventListener('input',()=>{remember();sync()});
 rich.addEventListener('keyup',remember);
 rich.addEventListener('mouseup',remember);
 document.addEventListener('selectionchange',()=>{
  if(active && dialog.open)remember();
 });
 rich.addEventListener('paste',event=>{
  const text=event.clipboardData?.getData('text/plain');
  if(text==null)return;
  event.preventDefault();insertText(text);
 });
 dialog.addEventListener('close',()=>{savedRange=null});
 window.SEYVEO_NOTE_RICH=Object.freeze({
  load,format:applyFormat,getHTML,safeHTML,isActive:()=>active,
  sync,insertText,appendText,rememberSelection:remember,
  markerTone:()=>markerTone,
  focus:()=>active&&rich.focus({preventScroll:true})
 });
})();
