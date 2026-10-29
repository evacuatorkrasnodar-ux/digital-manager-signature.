/**
 * Expo native iOS/Android system authentication browser.
 *
 * This is a reusable adapter — NOT mounted on diagnostic M1 Home.
 * Never call until the actual OIDC provider, native callback registration,
 * verified ID-token exchange and secure session persistence are configured.
 *
 * For iPhone X (iOS <=16), use the dedicated reverse-domain private-use
 * scheme because Expo's HTTPS Universal Link auth callback needs iOS 17.4+.
 */
import {Platform} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {createNativeLoginPreflight,type NativeOAuthProvider}
  from './nativePkceEntropy';
import {createNativeBrowserLogin,type AuthGrant,type BrowserLogin}
  from './native-browser-login.mjs';

export type TrustedNativeExchange=(grant:AuthGrant)=>Promise<{status:string}>;

export function createExpoNativeLogin(
  provider:NativeOAuthProvider,
  exchangeGrant:TrustedNativeExchange,
  verifiedHttpsCallbackReady=false
):BrowserLogin {
  if(Platform.OS!=='ios'&&Platform.OS!=='android')
    throw new TypeError('Native iOS/Android OAuth only.');
  const flow=createNativeLoginPreflight(provider);
  return createNativeBrowserLogin({
    flow,
    redirectUri:provider.redirectUri,
    redirectMode:provider.redirectMode??'claimed-https',
    platform:Platform.OS,
    verifiedHttpsCallbackReady,
    openAuthSession:async (url,redirectUri,options)=>
      WebBrowser.openAuthSessionAsync(url,redirectUri,options),
    exchangeGrant
  });
}
