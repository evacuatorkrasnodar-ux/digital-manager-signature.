import type {EmployeeInvitationResponse} from './employee-invite-delivery.mjs';

export interface OwnerNativeSession {
  /** From trusted native session storage; never QR / URL / user input */
  token:string;
  sessionId:string;
  organizationId:string;
  expiresAt:number;
}
export type IssuedEmployeeInvite =
  | {status:'issued';serverResponse:EmployeeInvitationResponse}
  | {status:'not-authorized'|'invalid-login'|'conflict'|'unavailable'};
export type CancelledEmployeeInvite = {
  status:'cancelled'|'not-authorized'|'invalid-invitation'|'conflict'|'unavailable'
};
export interface HttpsOwnerInviteClient {
  create(params:{employeeLogin:string}):Promise<IssuedEmployeeInvite>;
  cancel(params:{invitationId:string}):Promise<CancelledEmployeeInvite>;
}
export interface InviteClientConfig {
  apiOrigin:string;
  organizationId:string;
  inviteLinkBase:string;
  getSession:()=>Promise<OwnerNativeSession|null>;
  fetchImpl:(url:string,request:{
    method:'POST'|'DELETE';
    headers:Record<string,string>;
    body?:string;
    redirect:'manual';
    credentials:'omit';
    cache:'no-store';
    referrerPolicy:'no-referrer';
  })=>Promise<{
    status:number;
    type?:string;
    headers?:{get:(name:string)=>string|null};
    text:()=>Promise<string>;
  }>;
  now?:()=>number;
}
export function createHttpsOwnerInviteClient(config:InviteClientConfig):HttpsOwnerInviteClient;
