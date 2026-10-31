import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const server=await readFile(new URL('../real-app-local.mjs',import.meta.url),'utf8');
const media=await readFile(new URL('../../assets/living-answers.js',import.meta.url),'utf8');
test('local CSP accepts only explicitly approved external image hosts',()=>{
 const policy=server.match(/img-src ([^;]+);/)?.[1];
 assert.ok(policy);
 const hosts=[...policy.matchAll(/https:\/\/[^\s]+/g)].map(m=>new URL(m[0]).hostname);
 assert.deepEqual(hosts,['upload.wikimedia.org','planetary.s3.amazonaws.com']);
 assert.match(server,/connect-src 'self';/);
 assert.match(server,/object-src 'none';/);
 assert.doesNotMatch(policy,/\*/);
});
test('all curated Living Answers images use approved HTTPS image hosts',()=>{
 const matches=[...media.matchAll(/\bimage:'(https:[^']+)'/g)];
 assert.equal(matches.length,3);
 for(const [,value] of matches){
  const url=new URL(value);
  assert.ok(['upload.wikimedia.org','planetary.s3.amazonaws.com'].includes(url.hostname));
  assert.equal(url.protocol,'https:');
 }
 assert.doesNotMatch(media,/thumb\.wikimedia\.org/);
});

test('Roadster curated answer reflects 2026 demonstration, not a stale 2017-only claim',()=>{
 assert.match(media,/15 октября 2026 года/);
 assert.match(media,/2028 год/);
 assert.match(media,/caranddriver\.com\/news\/a74145531/);
 assert.match(media,/не доказательство длительного полёта/);
});
