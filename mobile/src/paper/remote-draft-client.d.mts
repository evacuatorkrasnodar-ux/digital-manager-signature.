import type {NativePersonalSession} from '../business/verified-workspace-client.mjs';

export type PaperPoint=readonly [number,number,number];
export type PaperPreview={
  readonly title:string;
  readonly strokes:ReadonlyArray<{
    readonly tool:'pen';readonly color:string;readonly width:number;
    readonly points:ReadonlyArray<PaperPoint>;
  }>;
  readonly requiresConfirmation:true;
  readonly originalUntouched:true;
};
export type PaperDraftResult=
  | {status:'ready';preview:PaperPreview}
  | {status:'invalid-request'|'busy'|'consent-required'|'sign-in-required'|
    'unavailable'|'invalid-preview'};

export interface RemotePaperDraftClient {
  /** Never applies the returned preview. UI must separately confirm insertion. */
  requestDraft(args:{
    request:string;width:number;height:number;
    /** Per-call UI dialog displaying the exact text and remote recipient. */
    confirmTextSend:(details:{readonly request:string;
      readonly recipient:string;readonly purpose:'paper-preview'})=>Promise<boolean>;
  }):Promise<PaperDraftResult>;
}

export interface RemotePaperDraftClientConfig {
  apiOrigin:string;
  appOrigin:string;
  getPersonalSession:()=>Promise<NativePersonalSession|null>;
  fetchImpl:(url:string,options:object)=>Promise<{
    status:number;type?:string;
    headers?:{get:(name:string)=>string|null};
    text:()=>Promise<string>;
  }>;
  now?:()=>number;
  timeoutMs?:number;
}
export function createRemotePaperDraftClient(
  config:RemotePaperDraftClientConfig
):RemotePaperDraftClient;
