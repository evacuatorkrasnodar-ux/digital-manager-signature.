import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeBrowserPdfExtractor} from '../src/browser/native-pdf-extractor-core.mjs';

test('PDF native adapter forwards valid page calls only when available',async()=>{
  const calls=[];
  const module={
    isAvailable:()=>true,
    getPageCount:async uri=>{calls.push(['count',uri]);return 3;},
    extractTextFromPage:async (uri,page)=>{calls.push(['page',uri,page]);return 'actual page '+page;}
  };
  const adapter=createNativeBrowserPdfExtractor(module);
  assert.equal(adapter.isAvailable(),true);
  assert.equal(await adapter.getPageCount('file:///doc.pdf'),3);
  assert.equal(await adapter.extractTextFromPage('file:///doc.pdf',2),'actual page 2');
  assert.deepEqual(calls,[['count','file:///doc.pdf'],['page','file:///doc.pdf',2]]);
});

test('PDF adapter fails closed when native module is absent or broken',async()=>{
  for(const value of [null,undefined,{isAvailable:()=>false},{
    isAvailable:()=>{throw Error('unavailable')},
    getPageCount:async()=>1,
    extractTextFromPage:async()=>''
  }]){
    const adapter=createNativeBrowserPdfExtractor(value);
    assert.equal(adapter.isAvailable(),false);
    await assert.rejects(adapter.getPageCount('file:///doc.pdf'),/pdf-native-module-unavailable/);
  }
});

test('PDF adapter rejects invalid page even with loaded native module',async()=>{
  const adapter=createNativeBrowserPdfExtractor({
    isAvailable:()=>true,
    getPageCount:async()=>3,
    extractTextFromPage:async()=> 'abc'
  });
  await assert.rejects(adapter.extractTextFromPage('file:///doc.pdf',0),/pdf-invalid-page/);
  await assert.rejects(adapter.extractTextFromPage('file:///doc.pdf',1.5),/pdf-invalid-page/);
});
