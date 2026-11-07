import type {BrowserPdfExtractor} from './browser-pdf-review.mjs';
export interface NativePdfExtractModule {
  isAvailable():boolean;
  getPageCount(localUri:string):Promise<number>;
  extractTextFromPage(localUri:string,page:number):Promise<string>;
}
export function createNativeBrowserPdfExtractor(module:NativePdfExtractModule|null|undefined):BrowserPdfExtractor;
