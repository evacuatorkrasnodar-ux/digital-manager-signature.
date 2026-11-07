export type SayviDocumentHandoff = {
  source:'user-selected-local-document';
  fileName:string;excerpt:string;truncated:boolean;
  task?:string;
};
export type SayviDocumentExplanation = Readonly<{
  summary:string;keyPoints:ReadonlyArray<string>;
  cautions:ReadonlyArray<string>;incomplete:boolean;
  advisory:true;executed:false;
}>;
export const SAYVI_DOCUMENT_ENDPOINT_PATH:string;
export function validateSayviDocumentEndpoint(endpoint:string,opts?:{development?:boolean}):string;
export function validateSayviExplanationResponse(raw:unknown):SayviDocumentExplanation;
export function createSayviDocumentClient(options:{
  endpoint:string;getAccessToken:()=>Promise<string>;
  fetchImpl?:typeof fetch;development?:boolean;
}):{explain:(input:SayviDocumentHandoff)=>Promise<SayviDocumentExplanation>};
