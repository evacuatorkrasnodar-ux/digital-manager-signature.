/**
 * SEYVEO employee QR link contract. A valid link never authenticates a user
 * and never confers work membership by itself.
 */
export type EmployeeQrScan =
  | {status:'invalid-qr'}
  | {status:'invite-present';invitationCode:string};
export function createEmployeeQrInviteLink(params:{
  /** Must be exact, configured app-claimed HTTPS link ending /join/employee/ */
  inviteLinkBase:string;
  /** Single-use 32-byte random invite code issued by a trusted backend */
  invitationCode:string;
}):string;
export function parseEmployeeQrInviteLink(params:{
  inviteLinkBase:string;
  scannedValue:unknown;
}):EmployeeQrScan;
