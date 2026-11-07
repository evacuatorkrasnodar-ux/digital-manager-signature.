import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BROWSER_PDF_FILE_LIMIT,BROWSER_PDF_PAGE_LIMIT,
  inspectBrowserPdf,supportsBrowserPdfExtractor,extractBrowserPdfPreview
} from '../src/browser/browser-pdf-review.mjs';
import {prepareSayviReviewHandoff} from '../src/browser/browser-document-review.mjs';

const localUri='file:///documents/preview/sample.pdf';
const item=(bytes=12345)=>({
  id:'12345678-1234-4234-8234-123456789012',
  name:'sample.pdf',bytes,status:'complete'
});
const extractor=(pages,body='Document text')=>({
  isAvailable:()=>true,
  getPageCount:async()=>pages,
  extractTextFromPage:async(_uri,page)=>typeof body==='function'?body(page):body
});

test('PDF can be reviewed only with a valid local item under the size limit',()=>{
  assert.equal(inspectBrowserPdf(item()).canExtract,true);
  assert.equal(inspectBrowserPdf(item(BROWSER_PDF_FILE_LIMIT+1)).status,'too-large');
  assert.equal(inspectBrowserPdf({...item(),name:'other.exe'}).status,'invalid');
});

test('extracts real text returned by native adapter, not fabricated content',async()=>{
  let reads=0;
  const reader=extractor(2,page=>{reads++;return 'Page '+page+' content';});
  const preview=await extractBrowserPdfPreview(item(),localUri,reader);
  assert.equal(reads,2);
  assert.ok(preview.excerpt.includes('Page 1 content'));
  assert.ok(preview.excerpt.includes('Page 2 content'));
  assert.equal(preview.extension,'pdf');
  assert.equal(preview.truncated,false);
  assert.equal(preview.pageCount,2);
});

test('long document is bounded to first pages and clearly marked truncated',async()=>{
  let calls=0;
  const reader=extractor(400,page=>{calls++;return 'Line '+page;});
  const preview=await extractBrowserPdfPreview(item(),localUri,reader);
  assert.equal(calls,BROWSER_PDF_PAGE_LIMIT);
  assert.equal(preview.truncated,true);
  assert.equal(preview.pagesRead,BROWSER_PDF_PAGE_LIMIT);
});

test('huge page text stops at safe output bound',async()=>{
  const preview=await extractBrowserPdfPreview(item(),localUri,
    extractor(1,'A'.repeat(100000)));
  assert.ok(preview.excerpt.length<=6000);
  assert.equal(preview.truncated,true);
});

test('scanned PDFs are not described as readable text',async()=>{
  await assert.rejects(
    extractBrowserPdfPreview(item(),localUri,extractor(2,'   ')),
    /pdf-text-not-found/
  );
});

test('unavailable adapter cannot perform read',async()=>{
  assert.equal(supportsBrowserPdfExtractor(null),false);
  await assert.rejects(
    extractBrowserPdfPreview(item(),localUri,{isAvailable:()=>false,
      getPageCount:async()=>1,extractTextFromPage:async()=>''}),
    /pdf-extractor-unavailable/
  );
});

test('non-local URI and malformed page metadata are rejected',async()=>{
  await assert.rejects(
    extractBrowserPdfPreview(item(),'https://example.com/sample.pdf',extractor(2)),
    /pdf-extractor-unavailable/
  );
  await assert.rejects(
    extractBrowserPdfPreview(item(),localUri,extractor(-1)),
    /pdf-invalid-pages/
  );
});

test('PDF text handoff still requires a separate explicit consent',async()=>{
  const preview=await extractBrowserPdfPreview(item(),localUri,extractor(1));
  assert.throws(()=>prepareSayviReviewHandoff(preview),/not-authorized/);
  const approved=prepareSayviReviewHandoff(preview,{approved:true});
  assert.equal(approved.excerpt,preview.excerpt);
  assert.ok(!('uri' in approved));
  assert.ok(!('fileId' in approved));
});
