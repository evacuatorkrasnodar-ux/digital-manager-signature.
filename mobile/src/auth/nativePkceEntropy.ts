/**
 * Native entropy/hash adapter only, NOT a working login screen.
 *
 * Expo Crypto is used instead of Node crypto, Math.random, or a static
 * verifier. The browser/verified app link and exchange still require a
 * configured identity provider and native implementation.
 */
import * as Crypto from 'expo-crypto';
import { createNativePkceFlow, type NativePkceFlow } from './native-pkce-core.mjs';

export type NativeOAuthProvider = Readonly<{
  issuer: string;
  authorizationEndpoint: string;
  redirectUri: string;
  clientId: string;
}>;

export function createNativeLoginPreflight(provider: NativeOAuthProvider): NativePkceFlow {
  return createNativePkceFlow({
    ...provider,
    randomBytes: async (size: number) => Crypto.getRandomBytesAsync(size),
    sha256: async (value: Uint8Array) => {
      const input = new Uint8Array(value.length);
      input.set(value);
      const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, input);
      return new Uint8Array(digest);
    }
  });
}
