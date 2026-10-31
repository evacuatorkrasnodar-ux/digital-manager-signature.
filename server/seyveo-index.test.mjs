import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {searchLocalIndex} from './seyveo-index.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('local index retrieves approved notes without network',async()=>{
 const found=await searchLocalIndex('управление клиентскими заявками CRM',root);
 assert.ok(found.length>0);
 assert.ok(found.some(x=>x.title&&x.source&&x.excerpt));
 assert.ok(found.every(x=>!('url' in x)));
});
test('local index does not fabricate sources on unmatched query',async()=>{
 const found=await searchLocalIndex('абракадабра9876 постороннийтермин123',root);
 assert.equal(found.length,0);
});
