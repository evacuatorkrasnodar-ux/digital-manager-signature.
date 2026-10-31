/* One optional-pack entry point; no access to SecureVault or personal notes. */
import {Platform} from 'react-native';
import {Paths} from 'expo-file-system';
import {createExpoPackStorage} from './expoPackStorage.mjs';
import {createOfflinePackManager} from './offlinePackManager.mjs';

export function createNativeOfflinePackManager(activeIds:()=>string[]=()=>[]){
 if(Platform.OS!=='ios'&&Platform.OS!=='android')throw Error('unsupported-platform');
 return createOfflinePackManager({
  storage:createExpoPackStorage(),
  platform:Platform.OS,
  getFreeBytes:async()=>{
   const free=Paths.availableDiskSpace;
   if(!Number.isSafeInteger(free)||free<0)throw Error('disk-space-unknown');
   return free;
  },
  activeIds
 });
}
