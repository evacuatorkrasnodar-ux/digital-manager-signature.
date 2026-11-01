import type {BrowserDownloadStorage} from './browser-download-core.mjs';
import type {BrowserDocumentReviewPreview} from './browser-document-review.mjs';
export interface ExpoBrowserDownloadStorage extends BrowserDownloadStorage {
  preview(id:string):Promise<void>;
  readLocalTextPreview(id:string):Promise<BrowserDocumentReviewPreview>;
  getLocalFileUri(id:string):Promise<string|null>;
}
export function createExpoBrowserDownloadStorage():ExpoBrowserDownloadStorage;
