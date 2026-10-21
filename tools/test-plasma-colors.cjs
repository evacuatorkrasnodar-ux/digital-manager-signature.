/* SEYVEO plasma signature: inner-only jade and stable glass shell. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const dark=fs.readFileSync(path.join(root,'assets/plasma-signature.svg'),'utf8');
const light=fs.readFileSync(path.join(root,'assets/plasma-signature-light.svg'),'utf8');
for(const [name,svg] of [['dark',dark],['light',light]]){
 assert.match(svg,/viewBox="40 30 440 440"/,name+' approved size unchanged');
 assert.match(svg,/<radialGradient id="inner-emerald"[^>]*>/,name+' has a soft inner-only jade wash');
 assert.match(svg,/r="174" fill="url\(#inner-emerald\)"/,name+' accent stays inside the outer rim');
 assert.match(svg,/<circle cx="260" cy="250" r="175\.4" fill="none" stroke="url\(#rim\)" stroke-width="2\.25" opacity="\.88"\/>/,name+' signature silver rim unchanged');
 assert.match(svg,/\.g-a\{animation:flow-a 7\.2s ease-in-out infinite alternate\}/,name+' first inner movement preserved');
 assert.match(svg,/\.g-b\{animation:flow-b 9\.1s ease-in-out infinite alternate\}/,name+' second inner movement preserved');
 assert.match(svg,/@media\(prefers-reduced-motion:reduce\)/,name+' reduced-motion preserved');
 assert.equal((svg.match(/id="inner-emerald"/g)||[]).length,1,name+' accent id unique');
}
assert.match(dark,/#346459/, 'Brand-deep muted jade on dark background');
assert.match(light,/#477e70/, 'Quiet jade accent on light background');
assert.equal(html.split('plasma-signature.svg?v=17').length-1,2,'Dark signature is cache-busted in markup and theme handler');
assert.equal(html.split('plasma-signature-light.svg?v=17').length-1,1,'Light signature is cache-busted in theme handler');
console.log('PASS SEYVEO signatures: branded internal jade, original silver glass and animations');
