import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BROWSER_REVIEW_READ_LIMIT,
  BROWSER_REVIEW_EXCERPT_LIMIT,
  inspectBrowserDocument,makeBrowserReviewPreview,prepareSayviReviewHandoff
} from '../src/browser/browser-document-review.mjs';

const file=(name,bytes=800)=>({
  id:'12345678-1234-4234-8234-123456789012',name,bytes,status:'complete'
});

test('small TXT and CSV can be previewed locally',()=>{
  for(const name of ['notes.txt','expenses.csv']){
    const result=inspectBrowserDocument(file(name));
    assert.equal(result.kind,'local-text');
    assert.equal(result.canReadText,true);
  }
});

test('PDF and Office files never fake extracted text',()=>{
  for(const name of ['contract.pdf','report.docx','table.xlsx']){
    assert.equal(inspectBrowserDocument(file(name)).kind,'needs-extractor');
    assert.throws(()=>makeBrowserReviewPreview(file(name),'text'));
  }
});

test('reject corrupt items, unsupported formats, or too large text',()=>{
  assert.equal(inspectBrowserDocument(null).canReadText,false);
  assert.equal(inspectBrowserDocument(file('file.exe')).kind,'unsupported');
  assert.equal(inspectBrowserDocument(file('large.txt',BROWSER_REVIEW_READ_LIMIT+1)).kind,'too-large');
});

test('local preview stays bounded and preserves truthful truncated status',()=>{
  const preview=makeBrowserReviewPreview(file('notes.txt'),('abc\n').repeat(3000));
  assert.ok(preview.excerpt.length<=BROWSER_REVIEW_EXCERPT_LIMIT);
  assert.equal(preview.truncated,true);
  assert.equal(preview.fileName,'notes.txt');
});

test('nothing can be handed to Sayvi without explicit approval',()=>{
  const preview=makeBrowserReviewPreview(file('notes.txt'),'Private note');
  assert.throws(()=>prepareSayviReviewHandoff(preview),/not-authorized/);
  const handoff=prepareSayviReviewHandoff(preview,{approved:true});
  assert.equal(handoff.excerpt,'Private note');
  assert.equal(handoff.source,'user-selected-local-document');
  assert.equal('uri' in handoff,false);
  assert.equal('fileId' in handoff,false);
});
