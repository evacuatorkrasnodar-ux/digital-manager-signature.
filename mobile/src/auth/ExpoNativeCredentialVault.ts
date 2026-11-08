/**
 * Native iOS/Android SecureStore port for verified OAuth credentials.
 *
 * Not activated on the M1 Home. Use ONLY as saveVerifiedSession callback
 * after real cryptographic OIDC ID-token validation, and as a private
 * credential source for backend-verified account/session requests.
 *
 * No app-level browser storage, no SQLCipher notes, no auto-recreated login.
 * This adapter never grants a corporate role or reports "signed in".
 */
import {Platform} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {createNativeCredentialVault,type NativeCredentialVault}
  from './native-credential-vault.mjs';

const KEYCHAIN_SERVICE='seyveo.identity.native.oauth.v1';

export function createExpoNativeCredentialVault(
  issuer:string,
  clientId='seyveo-native'
):NativeCredentialVault {
  if(Platform.OS!=='ios'&&Platform.OS!=='android')
    throw new TypeError('Native iOS or Android SecureStore required.');

  // iOS Keychain items cannot migrate to another device and are read only
  // while unlocked. Android uses encrypted SharedPreferences + Keystore.
  // Do not enable requireAuthentication here: it invalidates credentials
  // on biometric enrollment changes and can block app lifecycle reads.
  const options:SecureStore.SecureStoreOptions={
    keychainService:KEYCHAIN_SERVICE,
    keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication:false
  };
  const secureStore={
    get:(key:string)=>SecureStore.getItemAsync(key,options),
    set:(key:string,value:string)=>SecureStore.setItemAsync(key,value,options),
    delete:(key:string)=>SecureStore.deleteItemAsync(key,options)
  };
  return createNativeCredentialVault({
    issuer,clientId,secureStore
  });
}
