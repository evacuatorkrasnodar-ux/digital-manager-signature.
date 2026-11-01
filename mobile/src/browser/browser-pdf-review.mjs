/**
 * SEYVEO Browser: bounded, local, digital-PDF text preview.
 *
 * No network, OCR, account or model calls. The native extractor is injected,
 * because the app has not yet selected/audited/installed a PDF native module.
 * Read only after an explicit action on a known download.
 */
import {BROWSER_REVIEW_EXCERPT_LIMIT} from './browser-document-review.mjs';

export const BROWSER_PDF_FILE_LIMIT = 10 * 1024 * 1024;
export const BROWSER_PDF_PAGE_LIMIT = 8;

export function inspectBrowserPdf(item) {
  if (!item || item.status!=='complete' ||
      typeof item.id!=='string' ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(item.id) ||
      typeof item.name!=='string' || !/\.pdf$/i.test(item.name) ||
      !Number.isSafeInteger(item.bytes) || item.bytes<=0) {
    return Object.freeze({status:'invalid',canExtract:false});
  }
  if (item.bytes > BROWSER_PDF_FILE_LIMIT) {
    return Object.freeze({status:'too-large',canExtract:false});
  }
  return Object.freeze({status:'ready',canExtract:true});
}

export function supportsBrowserPdfExtractor(extractor) {
  try {
    return !!extractor &&
      typeof extractor.getPageCount==='function' &&
      typeof extractor.extractTextFromPage==='function' &&
      (typeof extractor.isAvailable!=='function' || extractor.isAvailable()===true);
  }catch{return false;}
}

/**
 * Reads only first pages up to a finite output limit. Scanned/image PDFs with
 * no embedded text are correctly reported as unsupported until OCR exists.
 * This is NOT full-document AI analysis.
 */
export async function extractBrowserPdfPreview(item, localUri, extractor) {
  if (!inspectBrowserPdf(item).canExtract) throw Error('pdf-review-unavailable');
  if (typeof localUri!=='string' ||
      !/^file:\/\/\/[A-Za-z0-9%/._-]+$/.test(localUri) ||
      !supportsBrowserPdfExtractor(extractor)) {
    throw Error('pdf-extractor-unavailable');
  }
  const pageCount=await extractor.getPageCount(localUri);
  if (!Number.isSafeInteger(pageCount) || pageCount<1 || pageCount>100000) {
    throw Error('pdf-invalid-pages');
  }
  const take=Math.min(pageCount,BROWSER_PDF_PAGE_LIMIT);
  const blocks=[];
  let length=0, pagesRead=0, truncated=pageCount>take;
  for (let page=1; page<=take; page++) {
    // Native plugin may throw on locked or corrupted PDF; never swallow that.
    const raw=await extractor.extractTextFromPage(localUri,page);
    if (typeof raw!=='string') throw Error('pdf-invalid-text');
    const cleaned=raw.replace(/\u0000/g,'')
      .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g,'')
      .replace(/\r\n?/g,'\n').trim();
    pagesRead=page;
    if(!cleaned) continue;
    const prefix=blocks.length?'\n\n':'';
    const remaining=BROWSER_REVIEW_EXCERPT_LIMIT-length-prefix.length;
    if (remaining<=0) {truncated=true;break;}
    const slice=cleaned.slice(0,remaining);
    blocks.push(prefix+slice);
    length+=prefix.length+slice.length;
    if(cleaned.length>slice.length) {truncated=true;break;}
    if(length===BROWSER_REVIEW_EXCERPT_LIMIT && page<pageCount) {
      truncated=true;break;
    }
  }
  const excerpt=blocks.join('').trim();
  if(!excerpt) throw Error('pdf-text-not-found');
  return Object.freeze({
    fileId:item.id,fileName:item.name,extension:'pdf',
    excerpt,truncated,pagesRead,pageCount,
    lines:excerpt.split('\n').length
  });
}
