/* SEYVEO Black Velvet HDR-like platinum glass: approved dark/light SVG regression.
 * Check the actual approved colors AND unchanged original geometry/motion.
 * The native HDR output pipeline is a separate implementation milestone.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const dark=fs.readFileSync(path.join(root,'assets/plasma-signature.svg'),'utf8');
const light=fs.readFileSync(path.join(root,'assets/plasma-signature-light.svg'),'utf8');
function paths(svg){return [...svg.matchAll(/<path\s[^>]*\bd="([^"]+)"/g)].map(m=>m[1]);}
function circles(svg){return [...svg.matchAll(/<circle\s[^>]*>/g)].map(m=>m[0]);}
for(const [label,svg] of [['dark',dark],['light',light]]){
 assert.match(svg,/viewBox="40 30 440 440"/,label+' original glass proportions');
 assert.doesNotMatch(svg,/inner-emerald|#346459|#477e70|#1d443b|#7eb29f/,label+' no abandoned jade overlay');
 assert.doesNotMatch(svg,/<circle[^>]*r="174"[^>]*fill="url\(#inner-emerald\)"/,label+' no tinted center');
 assert.match(svg,/<circle cx="260" cy="250" r="175\.4" fill="none" stroke="url\(#rim\)" stroke-width="2\.25" opacity="\.88"\/>/,label+' original silver rim geometry');
 assert.match(svg,/\.g-a\{animation:flow-a 7\.2s ease-in-out infinite alternate\}/,label+' first glass current');
 assert.match(svg,/\.g-b\{animation:flow-b 9\.1s ease-in-out infinite alternate\}/,label+' second glass current');
 assert.match(svg,/\.glass-glint\{animation:soft-glint 5\.2s ease-in-out infinite alternate\}/,label+' gentle original glint');
 assert.match(svg,/@media\(prefers-reduced-motion:reduce\)/,label+' respects reduced motion');
 for(const id of ['body','edgewash','filament','silk','rim'])
  assert.match(svg,new RegExp('id="'+id+'"'),label+' existing material '+id);
 assert.equal(circles(svg).length,4,label+' original clip path, body, edgewash and rim only');
}
assert.deepEqual(paths(dark),paths(light),'Light and dark sphere paths remain exactly identical');
assert.deepEqual(circles(dark).map(x=>x.replace(/stroke="url\(#rim\)"/,'stroke="url(#rim)"')),
 circles(light),'Identical orb circle geometry and layers');
assert.match(dark,/<radialGradient id="body"[^>]*><stop stop-color="#293c43"\/>/,
 'Approved deep graphite blue-green body');
assert.ok(dark.includes('<stop offset=".14" stop-color="#ffffff" stop-opacity=".94"/>'),
 'Approved platinum highlight on dark filaments');
assert.ok(dark.includes('<stop offset=".89" stop-color="#ffffff" stop-opacity=".98"/>'),
 'Approved bright but controlled platinum rim reflection');
assert.match(light,/<radialGradient id="body"[^>]*><stop stop-color="#ffffff"\/>/,
 'Approved White Velvet pearl body');
assert.doesNotMatch(light,/pearl-core|#253246|#51637b|#859bb1/,'No artificial smoky inner core');
assert.ok(light.includes('<stop offset=".52" stop-color="#48656d" stop-opacity=".76"/>'),
 'Approved cool-metal light filaments');
assert.ok(light.includes('<stop offset=".13" stop-color="#719592" stop-opacity=".23"/>'),
 'Approved light-theme silk');
assert.equal((html.match(/plasma-signature\.svg\?v=\d+/g)||[]).length,2,'Dark asset linked in HTML and theme handler');
assert.equal((html.match(/plasma-signature-light\.svg\?v=\d+/g)||[]).length,1,'Light asset linked in theme handler');
console.log('PASS SEYVEO approved platinum HDR-like sphere; original motion and geometry intact');
