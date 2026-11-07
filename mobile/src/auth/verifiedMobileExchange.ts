/**
 * Link verified native OAuth exchange to device-local SecureStore.
 * Config / JOSE signature verification must come from the actual trusted
 * SEYVEO OIDC provider integration; it does not exist in this repository yet.
 */
import {createNativeCodeExchange} from './native-code-exchange.mjs';
import type {ExchangeConfig} from './native-code-exchange.mjs';
import {saveVerifiedNativeSession} from './verifiedSessionStore';

export function createVerifiedMobileTokenExchange(
 options:Omit<ExchangeConfig,'saveVerifiedSession'>
){
 return createNativeCodeExchange({
   ...options,
   // There is deliberately no caller-controlled session storage hook.
   saveVerifiedSession:saveVerifiedNativeSession
 });
}
