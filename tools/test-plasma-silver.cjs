/* SEYVEO classic silver glass: dark/light SVG regression. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const dark=fs.readFileSync(path.join(root,'assets/plasma-signature.svg'),'utf8');
const light=fs.readFileSync(path.join(root,'assets/plasma-signature-light.svg'),'utf8');
for(const [label,svg] of [['dark',dark],['light',light]]){
 assert.match(svg,/viewBox="40 30 440 440"/,label+' original glass proportions');
 assert.doesNotMatch(svg,/inner-emerald|#346459|#477e70|#1d443b|#7eb29f/,label+' no experimental jade overlay');
 assert.doesNotMatch(svg,/<circle[^>]*r="174"[^>]*fill="url\(#inner-emerald\)"/,label+' no tinted center');
 assert.match(svg,/<circle cx="260" cy="250" r="175\.4" fill="none" stroke="url\(#rim\)" stroke-width="2\.25" opacity="\.88"\/>/,label+' original silver rim');
 assert.match(svg,/\.g-a\{animation:flow-a 7\.2s ease-in-out infinite alternate\}/,label+' first original glass current');
 assert.match(svg,/\.g-b\{animation:flow-b 9\.1s ease-in-out infinite alternate\}/,label+' second original glass current');
 assert.match(svg,/@media\(prefers-reduced-motion:reduce\)/,label+' respects reduced motion');
}
assert.match(dark,/<stop stop-color="#202b3f"\/>/,'Original dark graphite restored');
assert.match(light,/<stop stop-color="#f8faff"\/>/,'Original White Velvet pearl body restored');
assert.match(light,/<radialGradient id="pearl-core" cx="\.49" cy="\.52" r="\.57">/,'One soft inner pearl core, no thickened stripes');
assert.match(light,/<stop stop-color="#253246" stop-opacity="\.56"\/>/,'Core has actual graphite depth');
assert.match(light,/<circle cx="260" cy="250" r="168" fill="url\(#pearl-core\)"\/>/,'Core lives inside unchanged glass shell');
assert.match(light,/<stop offset="\.36" stop-color="#7f93ab" stop-opacity="\.44"\/>/,'Historical gentle silver filaments restored');
assert.match(light,/<stop offset="\.13" stop-color="#fdfdff" stop-opacity="\.39"\/>/,'Historical flowing pearl silk restored');
assert.doesNotMatch(light,/#53677c|#64788e|#566b81|#6c7e91/,'No new dark stripe palette');
assert.equal(html.split('plasma-signature.svg?v=18').length-1,2,'Dark asset version linked in HTML and theme handler');
assert.equal(html.split('plasma-signature-light.svg?v=20').length-1,1,'Light asset version linked in theme handler');
console.log('PASS SEYVEO original silver sphere and both themes');
