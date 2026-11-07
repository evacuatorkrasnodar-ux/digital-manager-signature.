/**
 * One trusted document-AI wiring point.
 *
 * The only public build-time setting is the HTTPS API endpoint, never a token.
 * Access tokens are read from secure storage only after a verified OAuth
 * sign-in; no login provider has been configured yet.
 *
 * This module never starts a network request on construction or mount.
 */
import {getVerifiedNativeAccessToken} from '../auth/verifiedSessionStore';
import {createSayviDocumentClient} from './sayvi-document-client.mjs';
import type {BrowserSayviHandoff} from './browser-document-review.mjs';
import type {SayviDocumentExplanation} from './sayvi-document-client.mjs';

export type SayviReviewHandler=(document:BrowserSayviHandoff)=>Promise<SayviDocumentExplanation>;

export function createConfiguredSayviReview():SayviReviewHandler|null{
 const endpoint=process.env.EXPO_PUBLIC_SEYVEO_DOCUMENT_ENDPOINT;
 if(!endpoint)return null;
 try{
  // Never use the loopback development token or plain HTTP in a native app.
  const client=createSayviDocumentClient({
   endpoint,getAccessToken:getVerifiedNativeAccessToken,
   development:false
  });
  return document=>client.explain(document);
 }catch{
  // Malformed/missing trusted deployment configuration disables upload.
  return null;
 }
}
