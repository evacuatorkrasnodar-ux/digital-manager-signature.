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
 let active=false,savedRange=null,locked=false;
 const allowed=new Set(['B','STRONG','EM','I','U','DIV','P','BR','H2','H3']);
 function cleanup(node,into){
  if(node.nodeType===Node.TEXT_NODE){into.append(document.createTextNode(node.nodeValue||''));return;}
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const tag=node.tagName.toUpperCase();
  if(['SCRIPT','STYLE','SVG','IFRAME','OBJECT','TEMPLATE'].includes(tag))return;
  const safe=allowed.has(tag)?tag==='H2'?'H3':tag:null;
  const dest=safe?document.createElement(safe.toLowerCase()):into;
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
  locked=true;
  rich.textContent=textarea.value;
  textarea.hidden=true;
  rich.hidden=false;
  active=true;
  savedRange=null;
  locked=false;
 }
 function load(html){
  const clean=safeHTML(html);
  locked=true;
  active=Boolean(clean);
  savedRange=null;
  textarea.hidden=active;
  rich.hidden=!active;
  if(active){rich.innerHTML=clean;textarea.value=plainValue();}
  else rich.replaceChildren();
  locked=false;
 }
 function applyFormat(kind){
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
  load,format:applyFormat,getHTML,isActive:()=>active,
  sync,insertText,rememberSelection:remember,
  focus:()=>active&&rich.focus({preventScroll:true})
 });
})();