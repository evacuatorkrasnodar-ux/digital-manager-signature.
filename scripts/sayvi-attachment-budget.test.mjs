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

function createPreparer(fetch=async()=>{throw Error('Unexpected upload')}){
 const form=class {append(){}};
 return runInNewContext(source+'\nprepareAttachments',{
  isReadableText:file=>file.type==='text/plain',
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

test('unprocessable PDF does not block other readable attachments',async()=>{
 const fetch=async()=>({ok:false,status:422,json:async()=>({error:'Текст не найден'})});
 const pdf={file:{name:'scan.pdf',type:'application/pdf',size:123}};
 const result=await createPreparer(fetch)([pdf,textFile(1)],1000);
 assert.equal(result.unreadable.length,1);
 assert.equal(result.unreadable[0].name,'scan.pdf');
 assert.equal(result.segments.length,1);
});

test('image selection and outgoing request respect actual server limits',()=>{
 assert.match(html,/pendingAttachments\.filter\(entry=>\/\^image\\\/\(\?:png\|jpeg\|webp\)\$\/i\.test\(entry\.file\.type\)\)\.length>=6/);
 assert.match(html,/if\(message\.length>3900\)throw Error/);
 assert.doesNotMatch(source,/Слишком много вложений для одного вопроса/);
});
