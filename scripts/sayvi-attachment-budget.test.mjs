/**
 * Sayvi attachment regression checks.
 * Run: node --test scripts/sayvi-attachment-budget.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const html=await readFile(new URL('../sayvi-chat-new.html',import.meta.url),'utf8');
const source=html.match(/async function prepareAttachments\(items,textBudget=3200\)\{[\s\S]*?(?=\n \/\/ The real Notebook tablet)/)?.[0];
assert.ok(source,'Sayvi attachment preparation function must remain present');

const textFile=(n)=>({
 file:{
  name:'document-'+n+'.txt',type:'text/plain',size:10000,
  slice:()=>({text:async()=>('Документ '+n+' — проверяем выдержку. ').repeat(100)})
 }
});

function createPreparer(fetch=async()=>{throw Error('Unexpected upload')},readPdfTextInBrowser=async()=>{throw Error('PDF.js unavailable')}){
 const form=class {append(){}};
 return runInNewContext(source+'\nprepareAttachments',{
  isReadableText:file=>file.type==='text/plain',
  readPdfTextInBrowser,
  FormData:form,
  fetch,
 });
}

test('twelve documents fit the same question without dropping other files',async()=>{
 const files=Array.from({length:12},(_,i)=>textFile(i+1));
 const result=await createPreparer()(files,3000);
 assert.equal(result.segments.length,12);
 assert.equal(result.unreadable.length,0);
 assert.ok(result.segments.join('').length<=3000);
 for(let n=1;n<=12;n++)assert.ok(result.segments[n-1].includes('document-'+n+'.txt'));
});

test('empty text budget preserves files as unreadable rather than throwing',async()=>{
 const result=await createPreparer()([textFile(1),textFile(2)],0);
 assert.equal(result.segments.length,0);
 assert.equal(result.unreadable.length,2);
});

test('PDF.js text avoids a server upload and supports textual PDF',async()=>{
 const fetch=async()=>{throw Error('PDF should not be sent to server when locally readable')};
 const readPdf=async()=>({text:'Текст из PDF: договор и подпись.',truncated:false});
 const pdf={file:{name:'contract.pdf',type:'application/pdf',size:123}};
 const result=await createPreparer(fetch,readPdf)([pdf],1000);
 assert.equal(result.unreadable.length,0);
 assert.equal(result.segments.length,1);
 assert.match(result.segments[0],/договор и подпись/);
});

test('scanned PDF without a text layer is reported honestly',async()=>{
 const fetch=async()=>{throw Error('No server call expected for a parsed scan')};
 const readPdf=async()=>({text:'',truncated:false});
 const pdf={file:{name:'scan.pdf',type:'application/pdf',size:123}};
 const result=await createPreparer(fetch,readPdf)([pdf],1000);
 assert.equal(result.segments.length,0);
 assert.equal(result.unreadable.length,1);
});

test('unprocessable PDF does not block other readable attachments',async()=>{
 const fetch=async()=>({ok:false,status:422,json:async()=>({error:'Текст не найден'})});
 const pdf={file:{name:'scan.pdf',type:'application/pdf',size:123}};
 const result=await createPreparer(fetch)([pdf,textFile(1)],1000);
 assert.equal(result.unreadable.length,1);
 assert.equal(result.unreadable[0].name,'scan.pdf');
 assert.equal(result.segments.length,1);
});

test('four attachments is the single Sayvi limit for photos and documents',()=>{
 assert.match(html,/const SAYVI_ATTACHMENT_LIMIT=4;/);
 assert.match(html,/pendingAttachments\.length>=SAYVI_ATTACHMENT_LIMIT/);
 assert.match(html,/function showAttachmentLimitNotice\(\)/);
 assert.match(html,/seyveo:sayvi-notice/);
 assert.match(html,/severity:'warning'/);
 assert.doesNotMatch(html,/pendingAttachments\.length>=12/);
 assert.doesNotMatch(html,/pendingAttachments\.length<6/);
 assert.match(html,/if\(message\.length>3900\)throw Error/);
 assert.doesNotMatch(source,/Слишком много вложений для одного вопроса/);
});

test('adding fifth item preserves four selected attachments and reports through warning button',()=>{
 const start=html.indexOf(' const SAYVI_ATTACHMENT_LIMIT=4;');
 const stop=html.indexOf('\n // Desktop drag-and-drop',start);
 assert.ok(start>0&&stop>start);
 const snippet=html.slice(start,stop);
 const selected=[];
 const warnings=[];
 const status={textContent:''};
 const context={
  pendingAttachments:selected,
  status,
  document:{dispatchEvent:ev=>warnings.push(ev.detail)},
  CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail}},
  URL:{createObjectURL:()=> 'blob:preview'},
  renderAttachments:()=>{},
  updateControls:()=>{}
 };
 const add=runInNewContext(snippet+'\naddAttachments',context);
 const files=Array.from({length:5},(_,n)=>({
  name:'file-'+n+'.pdf',type:'application/pdf',size:1000,lastModified:n
 }));
 add(files);
 assert.equal(selected.length,4);
 assert.equal(selected[3].file.name,'file-3.pdf');
 assert.equal(warnings.length,1);
 assert.equal(warnings[0].severity,'warning');
 assert.match(status.textContent,/4 вложений/);
 add([files[0]]);
 assert.equal(warnings.length,1,'duplicate should not produce limit warning');
});


test('Sayvi generates Word and PDF file cards only for completed document answers',async()=>{
 const styles=await readFile(new URL('../assets/sayvi-rich-replies.css',import.meta.url),'utf8');
 assert.match(html,/function showSayviGeneratedFiles\(bubble,message,ready=true\)/);
 assert.match(html,/row\.hidden=!available/);
 assert.match(html,/showSayviGeneratedFiles\(completed,answer,true\)/);
 assert.match(html,/downloads\.append\(word,pdf,preview\)/);
 assert.match(html,/editedDocumentDrafts\.get\(bubble\)\|\|documentDraftOnly\(replySource\(bubble\)\)/);
 assert.match(html,/assets\/sayvi-rich-replies\.css\?v=11/);
 assert.match(styles,/\.sv-has-generated-documents > \.sv-document-downloads:not\(\[hidden\]\)/);
 assert.match(styles,/\.sv-has-generated-documents \.sv-rich-document-card\{/);
});
