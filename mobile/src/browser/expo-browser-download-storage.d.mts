import type {BrowserDownloadStorage} from './browser-download-core.mjs';
export interface ExpoBrowserDownloadStorage extends BrowserDownloadStorage {
  preview(id:string):Promise<void>;
  getLocalFileUri(id:string):Promise<string|null>;
}
export function createExpoBrowserDownloadStorage():ExpoBrowserDownloadStorage;
