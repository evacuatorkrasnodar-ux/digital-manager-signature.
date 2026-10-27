/* SEYVEO · Approved Black Velvet HDR-like palette derived from My World.
 * Web SDR rendering, not a claim of native high-dynamic-range output.
 * Orb shapes and animations are independently guarded by plasma test.
 */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html');
const scene=read('assets/living-space.css');
const chat=read('assets/conversation-refined.css');
const home=read('assets/home-velvet.css');
const management=read('assets/management-glass-showcase.css');
const orb=read('assets/plasma-signature.svg');
const core=html.match(/:root\{font-family:[\s\S]*?\}\s*:root\[data-theme=light\]/)?.[0]||'';
const values={
 '--bg':'#111917','--card':'#192a25','--card2':'#21332c',
 '--seyveo-emerald':'#91c9b5','--seyveo-hdr-outline':'rgba(165,208,190,.20)',
 '--seyveo-metal-peak':'#fbfffd'
};
for(const [token,value] of Object.entries(values))
 assert.ok(core.includes(token+':'+value),'My World shared palette: '+token);
assert.match(scene,/linear-gradient\(180deg,#101817 0%,#111e1b 27%,#142521 53%,#172b25 78%,#10211d 100%\)/,
 'All workspaces use sampled My World velvet atmosphere');
assert.match(scene,/--sv-q-outline:var\(--seyveo-hdr-outline\)/,'One consistent outline material');
assert.match(chat,/linear-gradient\(180deg,#111917 0%,#142521 52%,#10211d 100%\)/,
 'Chat matches the same muted tone');
assert.match(home,/--home-glass:rgba\(24,41,35,\.67\)/,'Home cards follow My World palette');
assert.match(management,/rgba\(125,163,142,\.016\)/,'Management uses subtle green only');
assert.ok(html.includes('--seyveo-emerald:#386d5b'),'Emerald remains legible on White Velvet');
for(const p of ['assets/home-velvet.css','assets/living-space.css','assets/conversation-refined.css','assets/management-glass-showcase.css'])
 assert.ok(new RegExp(p.replaceAll('.','\\.').replaceAll('/','\\/')+'\\?v=\\d+').test(html),'Cache-busted CSS '+p);
assert.match(orb,/viewBox="40 30 440 440"/,'The approved sphere still has correct proportions');
assert.doesNotMatch(scene,/background-attachment:fixed/,'No scroll-heavy atmospheric filter');
console.log('PASS Black Velvet HDR-like: sampled My World color across Home, Chat and Management.');
