import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {validatePackManifest,planPackInstall,verifyPackBytes,planPackRemoval} from '../src/core/offlinePacks.mjs';
const data=new TextEncoder().encode('SEYVEO offline test pack');
const sample={id:'safety-guide',kind:'knowledge',title:'Лес и безопасность',bytes:data.length,
 sha256:createHash('sha256').update(data).digest('hex'),version:1,platform:'both',
 downloadUrl:'https://assets.example.org/seyveo/safety-guide.bin'};
test('reject incomplete or untrusted manifests',()=>{
 assert.throws(()=>validatePackManifest({...sample,sha256:'bad'}));
 assert.throws(()=>validatePackManifest({...sample,downloadUrl:'http://example.org/a'}));
 assert.throws(()=>validatePackManifest({...sample,downloadUrl:'https://127.0.0.1/a'}));
});
test('optional packs never install over device space allowance',()=>{
 const low=planPackInstall([sample],{platform:'android',freeBytes:100});
 assert.equal(low.canInstall,false);
 const enough=planPackInstall([sample],{platform:'android',freeBytes:120*1024*1024});
 assert.equal(enough.canInstall,true);
 assert.deepEqual(planPackInstall([sample],{platform:'ios',freeBytes:120*1024*1024,installedIds:['safety-guide']}).packIds,[]);
});
test('incompatible packages and duplicate IDs cannot install',()=>{
 assert.equal(planPackInstall([{...sample,platform:'ios'}],{platform:'android',freeBytes:1e9}).canInstall,false);
 assert.throws(()=>planPackInstall([sample,sample],{platform:'ios',freeBytes:1e9}),/duplicate/);
});
test('pack contents must match declared SHA-256 and exact size',async()=>{
 if(!globalThis.crypto)globalThis.crypto=webcrypto;
 assert.equal(await verifyPackBytes(data,sample),true);
 assert.equal(await verifyPackBytes(new TextEncoder().encode('other'),sample),false);
 assert.equal(await verifyPackBytes(new Uint8Array(data.length),sample),false);
});

test('optional pack removal never targets vault or active model',()=>{
 assert.throws(()=>planPackRemoval('../personal-vault',{installedIds:['offline-model']}),/invalid-pack-id/);
 assert.equal(planPackRemoval('offline-model',{installedIds:['offline-model'],activeIds:['offline-model']}).canRemove,false);
 assert.deepEqual(planPackRemoval('offline-model',{installedIds:['offline-model']}),{canRemove:true,reason:'optional-pack-only',packId:'offline-model'});
 assert.equal(planPackRemoval('offline-model',{installedIds:[]}).canRemove,false);
});
