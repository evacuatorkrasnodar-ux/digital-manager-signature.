/** Only server-issued invitation responses. Never client-generate codes. */
export interface EmployeeInvitationResponse {
  code: string;
  invitation: {id:string;employeeLogin:string;expiresAt:string};
}
export type PreparedEmployeeInvite =
  | {status:'unavailable'}
  | {status:'ready';url:string;expiresAt:number;invitationId:string};
export function prepareEmployeeInviteDelivery(args:{
  inviteLinkBase:string;
  serverResponse:EmployeeInvitationResponse|null|undefined;
  now?:()=>number;
}):PreparedEmployeeInvite;
