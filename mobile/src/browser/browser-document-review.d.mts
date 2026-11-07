export type BrowserDocumentReviewKind =
  'invalid'|'local-text'|'needs-extractor'|'too-large'|'unsupported';
export type BrowserDocumentReviewItem = {
  id:string;name:string;bytes:number;status:'complete';
};
export type BrowserDocumentReviewPreview = Readonly<{
  fileId:string;fileName:string;extension:'txt'|'csv'|'pdf';
  excerpt:string;truncated:boolean;lines:number;
}>;
export type BrowserSayviHandoff = Readonly<{
  source:'user-selected-local-document';
  fileName:string;excerpt:string;truncated:boolean;task:string;
}>;
export const BROWSER_REVIEW_READ_LIMIT:number;
export const BROWSER_REVIEW_EXCERPT_LIMIT:number;
export function inspectBrowserDocument(item:unknown):Readonly<{
  kind:BrowserDocumentReviewKind;
  canReadText:boolean;extension?:string;
}>;
export function makeBrowserReviewPreview(item:BrowserDocumentReviewItem,rawText:string):BrowserDocumentReviewPreview;
export function prepareSayviReviewHandoff(
  preview:BrowserDocumentReviewPreview,
  options?:{approved?:boolean}
):BrowserSayviHandoff;
