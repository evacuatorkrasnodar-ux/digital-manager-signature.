/** Typed interface for the platform-independent OAuth contract. */
export interface NativePkceConfig {
  issuer: string;
  authorizationEndpoint: string;
  redirectUri: string;
  clientId: string;
  redirectMode?: 'claimed-https'|'private-use';
  randomBytes: (size: number) => Promise<Uint8Array>;
  sha256: (bytes: Uint8Array) => Promise<Uint8Array>;
  now?: () => number;
}
export type PkceStart =
  | { status: 'superseded' }
  | { status: 'browser-required'; authorizationUrl: string; expiresAt: string };
export type PkceCallback =
  | { status: 'no-pending-authentication'|'expired'|'rejected'|'authorization-denied' }
  | {
      status:'exchange-required';
      authorizationCode:string;
      codeVerifier:string;
      nonce:string;
      clientId:string;
      redirectUri:string;
      issuer:string;
    };
export interface NativePkceFlow {
  begin():Promise<PkceStart>;
  acceptCallback(url: string):PkceCallback;
  cancel():void;
}
export function createNativePkceFlow(config: NativePkceConfig):NativePkceFlow;
