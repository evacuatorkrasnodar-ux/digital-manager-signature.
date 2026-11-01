export type BrowserDownloadRequest = Readonly<{url:string;name:string;category:string;maxBytes:number}>;
export type BrowserDownloadRecord = Readonly<{
  id:string;name:string;category:string;bytes:number;savedAt:number;status:'complete';
}>;
export type BrowserDownloadProgress = {bytesWritten:number;totalBytes:number|null};
export type BrowserDownloadOperation = {
  name:string;status:'downloading'|'complete'|'failed';
  receivedBytes?:number;totalBytes?:number|null;
};
export type BrowserDownloadSnapshot = Readonly<{
  items:ReadonlyArray<BrowserDownloadRecord>;
  busy:boolean;loading:boolean;operation:BrowserDownloadOperation|null;
}>;
export type BrowserDownloadStorage = {
  list():Promise<BrowserDownloadRecord[]>;
  download(request:BrowserDownloadRequest,onProgress?:(value:BrowserDownloadProgress)=>void):Promise<BrowserDownloadRecord>;
  remove(id:string):Promise<void>;
  preview?(id:string):Promise<void>;
};
export const BROWSER_DOWNLOAD_MAX_BYTES:number;
export function parseBrowserDownloadUrl(url:string):string;
export function safeBrowserDownloadName(name:unknown):string;
export function describeBrowserDownload(url:string,preferredName?:string):BrowserDownloadRequest;
export function createBrowserDownloadController(storage:BrowserDownloadStorage,
  onChange?:(value:BrowserDownloadSnapshot)=>void):{
    snapshot():BrowserDownloadSnapshot;
    refresh():Promise<BrowserDownloadSnapshot>;
    start(url:string,preferredName?:string):Promise<BrowserDownloadRecord>;
    remove(id:string):Promise<BrowserDownloadSnapshot>;
  };
