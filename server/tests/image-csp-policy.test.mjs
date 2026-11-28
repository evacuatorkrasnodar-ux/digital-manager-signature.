import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const server=await readFile(new URL('../real-app-local.mjs',import.meta.url),'utf8');
const media=await readFile(new URL('../../assets/living-answers.js',import.meta.url),'utf8');
test('local CSP accepts only explicitly approved external image hosts',()=>{
 const policy=server.match(/img-src ([^;]+);/)?.[1];
 assert.ok(policy);
 assert.match(policy,/^'self' data: blob: https:\/\/tile\.openstreetmap\.org https:\/\/commons\.wikimedia\.org https:\/\/upload\.wikimedia\.org https:\/\/planetary\.s3\.amazonaws\.com$/);
 // Blob URLs belong to this page's local previews; do not allow arbitrary network image hosts.
 const hosts=[...policy.matchAll(/https:\/\/[^\s]+/g)].map(m=>new URL(m[0]).hostname);
 assert.deepEqual(hosts,['tile.openstreetmap.org','commons.wikimedia.org','upload.wikimedia.org','planetary.s3.amazonaws.com']);
 assert.match(server,/connect-src 'self' https:\/\/nominatim\.openstreetmap\.org https:\/\/www\.wikidata\.org https:\/\/commons\.wikimedia\.org https:\/\/ru\.wikipedia\.org;/);
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

test('Wallet exchange rates are allowed only by the Home connect-src exception',()=>{
 const home=server.slice(server.indexOf('function mapHomeHeaders(){'),server.indexOf('function homePageHeaders(req)'));
 assert.match(home,/const walletRates='https:\/\/www\.cbr-xml-daily\.ru\/daily_json\.js';/);
 assert.match(home,/'connect-src':data\+' '\+walletRates/);
 const base=server.match(/connect-src ([^;]+);/)?.[1];
 assert.ok(base);
 assert.doesNotMatch(base,/cbr-xml-daily/);
});

test('Music catalog is allowed only by the Home connect-src exception',()=>{
 const home=server.slice(server.indexOf('function mapHomeHeaders(){'),server.indexOf('function homePageHeaders(req)'));
 assert.match(home,/const musicCatalog='https:\/\/itunes\.apple\.com\/search https:\/\/musicbrainz\.org\/ws\/2\/';/);
 assert.match(home,/'connect-src':data\+' '\+walletRates\+' '\+musicCatalog/);
 const base=server.match(/connect-src ([^;]+);/)?.[1];
 assert.ok(base);
 assert.doesNotMatch(base,/itunes\.apple\.com/);
});

test('Radio catalog and HTTPS media are allowed only on the main Home page',()=>{
 const home=server.slice(server.indexOf('function mapHomeHeaders(){'),server.indexOf('function homePageHeaders(req)'));
 assert.match(home,/const radioCatalog='https:\/\/de1\.api\.radio-browser\.info\/json\/stations\/search https:\/\/nl1\.api\.radio-browser\.info\/json\/stations\/search';/);
 assert.match(home,/'connect-src':data\+' '\+walletRates\+' '\+musicCatalog\+' '\+radioCatalog/);
 assert.match(home,/'media-src':'https:'/);
 const base=server.match(/connect-src ([^;]+);/)?.[1];
 assert.doesNotMatch(base,/radio-browser/);
 assert.match(server,/media-src 'self' blob:;/);
});
