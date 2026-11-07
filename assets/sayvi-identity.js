/* SEYVEO single Sayvi identity: replace ONLY obsolete Sayvi-assistant stars.
   Preserve all button handlers, markup geometry, task/recognition stars and dock.
   Applied to static and dynamically added app surfaces, including card templates. */
(()=>{'use strict';
 const NAME=/^(\\s*)([✧✦])(?=\\s*(?:Сэйви|Сэйва|SEYVEO)(?=\\s|[·,.:!]|$))/iu;
 const SOLO_CLASSES=[
  '.svcp-sayvi-call > span[aria-hidden="true"]',
  '.svcp-home-sayvi-help > span[aria-hidden="true"]',
  '.svcp-manager-signal-mark',
  '.sv-cabinet-resume-spark',
  '.sv-home-living-mark',
  '.sv-mail-assist-symbol',
  '.syp-spark',
  '.cal-bp-report-icon',
  '.note-smart-symbol'
 ].join(',');
 function glyph(){
   const span=document.createElement('span');
   span.className='sv-sayvi-identity-glyph';
   span.setAttribute('aria-hidden','true');
   return span;
 }
 function replaceText(node){
   if(!node||node.nodeType!==3||!node.nodeValue)return;
   const parent=node.parentElement;
   if(!parent||parent.closest('script,style,textarea,svg,option,[contenteditable="true"],.sv-sayvi-identity-glyph'))return;
   const match=NAME.exec(node.nodeValue);
   if(!match)return;
   const prefix=match[1], remainder=node.nodeValue.slice(match[0].length);
   const frag=document.createDocumentFragment();
   if(prefix)frag.append(document.createTextNode(prefix));
   frag.append(glyph(),document.createTextNode(remainder));
   node.replaceWith(frag);
 }
 function replaceSolo(el){
   if(!(el instanceof Element)||!el.matches(SOLO_CLASSES)||el.querySelector('.sv-sayvi-identity-glyph'))return;
   if(!/^[✧✦]$/.test((el.textContent||'').trim()))return;
   el.replaceChildren(glyph());
 }
 function scan(root){
   if(!root)return;
   if(root.nodeType===3){replaceText(root);return}
   if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
   if(root.nodeType===1){
     if(root.matches('script,style,textarea,svg,option,[contenteditable="true"]'))return;
     replaceSolo(root);
   }
   if(root.querySelectorAll)root.querySelectorAll(SOLO_CLASSES).forEach(replaceSolo);
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   const texts=[];while(walker.nextNode())texts.push(walker.currentNode);
   texts.forEach(replaceText);
 }
 function initialize(){
   scan(document.body);
   const obs=new MutationObserver(records=>{
     const nodes=new Set();
     for(const record of records)for(const n of record.addedNodes)nodes.add(n);
     nodes.forEach(scan);
   });
   obs.observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();
