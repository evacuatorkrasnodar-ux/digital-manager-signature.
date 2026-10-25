/* Static regression for SEYVEO Open Canvas: single writer row only.
 * A source check is NOT a substitute for a visual test on an iPhone X.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const load=p=>fs.readFileSync(require('node:path').join(root,p),'utf8');
const js=load('assets/living-conversation.js');
const css=load('assets/conversation-refined.css');
const dockCss=load('assets/floating-navigation.css');
const home=load('index.html');
const docs=load('docs/SEYVEO-FUTURE-EXPERIENCE.md');
assert.match(js,/const compact=\$\('ask'\)\.querySelector\('\.composer-compact'\)/);
assert.match(js,/compact\.insertBefore\(\$\('seyveoConversationBack'\),compact\.firstChild\)/);
assert.match(js,/compact\.insertBefore\(\$\('seyveoConversationHistory'\),mic\)/);
assert.match(js,/compact\.insertBefore\(header\.querySelector\('\.seyveo-conversation-heading'\),mic\)/);
assert.doesNotMatch(js,/seyveoComposerFold|fold\.addEventListener/,'No redundant keyboard arrow');

assert.match(js,/\$\('seyveoConversationBack'\)\.addEventListener\('click',close\)/);
assert.match(js,/\$\('seyveoConversationHistory'\)\.addEventListener\('click',\(\)=>window\.SEYVEO_CHAT_HISTORY\?\.open\(\)\)/);
assert.match(css,/html\.seyveo-conversation #seyveoConversationHeader\{\s*display:none!important/);
assert.match(css,/#ask\.prompt:not\(\.expanded\) \.seyveo-conversation-heading\{\s*display:flex!important/);
assert.doesNotMatch(css,/#seyveoComposerFold/,'No obsolete fold rules');
assert.match(css,/#ask\.prompt:not\(\.expanded\) #seyveoConversationMic\{\s*order:5!important/);
assert.match(css,/#ask\.prompt:not\(\.expanded\) #composerCompactSend\{\s*order:6!important/);
assert.match(home,/assets\/conversation-refined\.css\?v=\d+/);
assert.match(home,/assets\/living-conversation\.js\?v=16/);
assert.equal((home.match(/<form class="prompt" id="ask"/g)||[]).length,1);
assert.equal((home.match(/<footer class="dock"/g)||[]).length,1);
// A retained message draft must never resurrect the retired slim bar above
// the fixed dock. All Ask entry points use the SAME conversation writer.
assert.match(dockCss,/html:not\(\.seyveo-conversation\) #ask\.prompt:not\(\.expanded\):not\(\[data-composer-mode="notes"\]\)\{\s*display:none!important;/);
assert.match(home,/function openComposer\(\)\{[\s\S]*?window\.SEYVEO_CONVERSATION\.open\(\);\s*return;/);
assert.match(home,/homeOrb\.addEventListener\('click',[\s\S]*?window\.SEYVEO_CONVERSATION\.open\(\)/);
assert.match(home,/assets\/floating-navigation\.css\?v=30/,'Updated dock stylesheet is cache-busted');
assert.match(docs,/SEYVEO Open Canvas/);
assert.match(docs,/Invisible Header/);
// SEYVEO Full Bleed: remove unnecessary horizontal gutters only inside chat.
assert.match(css,/max\(8px,env\(safe-area-inset-right,0px\)\)/);
assert.match(css,/max\(8px,env\(safe-area-inset-left,0px\)\)/);
assert.match(css,/width:min\(518px,calc\(100vw - 12px - env\(safe-area-inset-left,0px\) - env\(safe-area-inset-right,0px\)\)\)/);
assert.match(css,/padding:calc\(env\(safe-area-inset-top,0px\) \+ 8px\)/);
assert.match(css,/padding:6px 10px 5px!important/);
assert.match(css,/min-height:84px!important;height:auto!important;max-height:158px!important/);
assert.match(css,/bottom:max\(8px,calc\(env\(safe-area-inset-bottom,0px\) - 12px\)\)!important/);
assert.match(css,/html\.seyveo-conversation\.seyveo-composer-keyboard #ask\.prompt:not\(\.expanded\)\{\s*bottom:calc\(var\(--keyboard-offset,0px\) \+ 8px\)!important/);
assert.match(home,/const shouldTrackKeyboard=focused\|\|\(already&&!root\.classList\.contains\('seyveo-conversation'\)\)/);
assert.match(home,/const opened=!composer\.hidden&&shouldTrackKeyboard&&\(measure\.shift>115\|\|shrunk\)/);
assert.match(css,/gap:3px;margin:0 0 4px!important/);
assert.match(css,/gap:0;margin:0;/);
assert.match(css,/min-width:0;display:flex;flex-direction:column;gap:3px;\s*margin:0 0 8px/);
assert.match(css,/height:40px!important;min-height:40px!important/);
assert.match(css,/margin:-5px 2px -7px auto;padding:0/);
assert.match(css,/margin:-4px 0 -6px!important/);
assert.match(css,/\.seyveo-conversation-reply-action\[aria-pressed="true"\]\{[\s\S]*?background:transparent!important;/);
assert.match(css,/\.seyveo-conversation-reply-action:hover\{[\s\S]*?background:transparent!important;/);
assert.match(css,/width:38px!important;min-width:38px!important/);
assert.match(css,/height:40px!important;min-height:40px!important/);
assert.match(css,/color:var\(--seyveo-emerald-text,#a7d7c9\)/);
// Feather Chat: text stays legible but heavy filled bubbles are gone.
assert.match(css,/SEYVEO Feather Chat v1/);
assert.match(css,/font-size:14.5px;line-height:1.48;font-weight:400/);
assert.match(css,/font-size:15px;line-height:1.50/);
assert.match(css,/font-weight:400;letter-spacing:0;white-space:pre-wrap/);
assert.match(css,/background:linear-gradient\(150deg,#2a2d2e,#242728\)/,'Approved neutral Black Velvet chat background');
assert.match(css,/max-width:min\(92%,460px\)/);
assert.match(css,/font-size:11px;font-weight:460/);
assert.match(css,/box-shadow:none;/);
assert.match(docs,/SEYVEO Full Bleed/);
console.log('SEYVEO Open Canvas + Full Bleed: one composer, safe width and header-free chat.');
