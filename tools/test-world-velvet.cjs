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
const myWorldGradient='linear-gradient(180deg,#101615 0%,#111b19 28%,#142320 55%,#172923 78%,#0f1715 100%)';
assert.ok(scene.includes('--sv-life-viewport-gradient:'+myWorldGradient),
 'Original Emerald Velvet viewport pigment remains available');
assert.ok((scene.match(/background:var\(--sv-life-viewport-gradient\)/g)||[]).length>=2,
 'Shared and My World canvases inherit a single palette-aware viewport token');
assert.match(scene,/:root\[data-theme=dark\]\[data-palette=plum\]\{\s*--sv-life-viewport-gradient:linear-gradient\(180deg,#1c1b1a/,
 'Copper Dune uses the approved Connections reference, without recoloring Emerald Velvet');
assert.match(scene,/--sv-q-outline:var\(--seyveo-hdr-outline\)/,'One consistent outline material');
assert.match(chat,/background:var\(--sv-chat-canvas\)/,
 'Chat canvas derives from the shared palette instead of an obsolete hardcoded emerald gradient');
const chatPalette=read('assets/living-conversation.css');
assert.match(chatPalette,/--sv-chat-canvas:/,
 'The conversation palette declares its own accessible dark and light canvas');
assert.match(home,/--home-glass:rgba\(24,41,35,\.67\)/,'Home cards follow My World palette');
assert.match(management,/background:linear-gradient\(159deg,var\(--seyveo-specular\),var\(--seyveo-hdr-active\) 48%,transparent\)/,
 'Management uses shared material tokens to follow all themes');
assert.ok(html.includes('--seyveo-emerald:#386d5b'),'Emerald remains legible on White Velvet');
for(const p of ['assets/home-velvet.css','assets/living-space.css','assets/conversation-refined.css','assets/management-glass-showcase.css'])
 assert.ok(new RegExp(p.replaceAll('.','\\.').replaceAll('/','\\/')+'\\?v=\\d+').test(html),'Cache-busted CSS '+p);
assert.match(orb,/viewBox="40 30 440 440"/,'The approved sphere still has correct proportions');
assert.ok(scene.includes('background-attachment:fixed!important;'),
 'Original approved My World viewport presentation remains unchanged');
assert.ok(!scene.match(/:root:not\(\[data-theme=light\]\) body\{[^}]*background-attachment:fixed/s),
 'Shared canvas does not add fixed attachment or extra repaints');
console.log('PASS Black Velvet HDR-like: sampled My World color across Home, Chat and Management.');
