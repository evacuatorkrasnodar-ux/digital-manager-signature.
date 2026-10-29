/** Types for OAuth code exchange contract. No provider, storage or HTTP installed. */
export type ExchangeGrant = {
  status: 'exchange-required';
  authorizationCode: string;
  codeVerifier: string;
  nonce: string;
  clientId: string;
  redirectUri: string;
  issuer: string;
};
export type OidcVerifiedClaims = {
  /** MUST be supplied only by a trusted signature-validating OIDC SDK. */
  verified: true;
  iss: string;
  aud: string;
  nonce: string;
  sub: string;
  exp: number;
};
export type VerifiedNativeSession = {
  issuer: string;
  subject: string;
  clientId: string;
  accessToken: string;
  idToken: string;
  refreshToken: string | null;
  accessTokenExpiresIn: number;
  idTokenExpiresAt: number;
};
export interface ExchangeConfig {
  issuer: string;
  tokenEndpoint: string;
  redirectUri: string;
  clientId: string;
  redirectMode?: 'claimed-https'|'private-use';
  fetchImpl: (url: string, options: {
    method: string;
    headers: Record<string,string>;
    body: string;
    redirect: string;
    credentials: string;
    cache: string;
    referrerPolicy: string;
  }) => Promise<{
    status: number;
    type?: string;
    headers?: {get: (name: string)=>string|null};
    text: ()=>Promise<string>;
  }>;
  verifyIdToken: (params: {
    idToken: string;
    expectedIssuer: string;
    expectedAudience: string;
    expectedNonce: string;
  }) => Promise<OidcVerifiedClaims|null>;
  saveVerifiedSession: (params: VerifiedNativeSession)=>Promise<void>;
  now?: ()=>number;
}
export interface CodeExchange {
  redeem(grant: ExchangeGrant): Promise<{
    status:'stored'|'rejected'|'used'|'unavailable'|'verification-failed'
  }>;
}
export function createNativeCodeExchange(config:ExchangeConfig):CodeExchange;
