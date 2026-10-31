import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOfflineCatalog} from '../src/core/offlineCatalog.mjs';
const sample={id:'voice-pack',kind:'voice',title:'Voice',bytes:1024,sha256:'a'.repeat(64),version:1,platform:'both',downloadUrl:'https://assets.seyveo.com/voice.bin'};
test('catalog remains empty without published verified packs',()=>{
 assert.deepEqual(validateOfflineCatalog([],[]),[]);
});
test('only approved hosts are accepted',()=>{
 assert.throws(()=>validateOfflineCatalog([sample],[]),/unapproved-host/);
 assert.equal(validateOfflineCatalog([sample],['assets.seyveo.com']).length,1);
});
test('duplicate pack IDs and unsafe URLs are rejected',()=>{
 assert.throws(()=>validateOfflineCatalog([sample,sample],['assets.seyveo.com']),/duplicate-id/);
 assert.throws(()=>validateOfflineCatalog([{...sample,downloadUrl:'http://assets.seyveo.com/x'}],['assets.seyveo.com']));
});
