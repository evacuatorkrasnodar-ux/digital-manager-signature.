import type {BrowserDownloadRecord} from './browser-download-core.mjs';
import type {BrowserDocumentReviewPreview} from './browser-document-review.mjs';

export interface BrowserPdfExtractor {
  getPageCount(localUri:string):Promise<number>;
  extractTextFromPage(localUri:string,page:number):Promise<string>;
  isAvailable?():boolean;
}
export type BrowserPdfReviewPreview = BrowserDocumentReviewPreview & Readonly<{
  extension:'pdf';pagesRead:number;pageCount:number;
}>;
export const BROWSER_PDF_FILE_LIMIT:number;
export const BROWSER_PDF_PAGE_LIMIT:number;
export function inspectBrowserPdf(item:unknown):Readonly<{
  status:'ready'|'invalid'|'too-large';canExtract:boolean;
}>;
export function supportsBrowserPdfExtractor(extractor:unknown):extractor is BrowserPdfExtractor;
export function extractBrowserPdfPreview(
  item:BrowserDownloadRecord,localUri:string,extractor:BrowserPdfExtractor
):Promise<BrowserPdfReviewPreview>;
