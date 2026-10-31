import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createOfflinePackManager} from '../src/core/offlinePackManager.mjs';

const contents=new TextEncoder().encode('sample pack');
const manifest={id:'small-model',kind:'language-model',title:'Offline model',bytes:contents.length,
 sha256:createHash('sha256').update(contents).digest('hex'),version:1,platform:'both',
 downloadUrl:'https://assets.example.org/pack.gguf'};
function fixture({valid=true,active=[]}={}){
 const files=new Map(),calls=[];
 const storage={
  list:async()=>[...files.values()],
  download:async p=>{calls.push('download');},
  verify:async()=>valid,
  commit:async p=>{files.set(p.id,p);calls.push('commit')},
  remove:async id=>{files.delete(id);calls.push('remove')},
  discard:async()=>calls.push('discard')
 };
 return {manager:createOfflinePackManager({storage,platform:'android',getFreeBytes:async()=>200_000_000,activeIds:()=>active}),files,calls};
}
test('installs a verified optional pack, then removes only that pack',async()=>{
 const f=fixture();
 assert.equal((await f.manager.install(manifest)).status,'installed');
 assert.equal((await f.manager.install(manifest)).status,'already-installed');
 assert.equal((await f.manager.remove('small-model')).status,'removed');
 assert.deepEqual(f.calls,['download','commit','remove']);
});
test('rejects corrupted download before commit',async()=>{
 const f=fixture({valid:false});
 await assert.rejects(f.manager.install(manifest),/integrity/);
 assert.equal(f.files.size,0);
 assert.deepEqual(f.calls,['download','discard']);
});
test('refuses removal while model in use and path traversal',async()=>{
 const f=fixture({active:['small-model']});
 await f.manager.install(manifest);
 assert.equal((await f.manager.remove('small-model')).status,'pack-in-use');
 await assert.rejects(f.manager.remove('../vault'),/invalid-pack-id/);
 assert.equal(f.files.size,1);
});
