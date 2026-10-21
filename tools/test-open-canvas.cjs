/* Static regression for SEYVEO Open Canvas: single writer row only.
 * A source check is NOT a substitute for a visual test on an iPhone X.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const load=p=>fs.readFileSync(require('node:path').join(root,p),'utf8');
const js=load('assets/living-conversation.js');
const css=load('assets/conversation-refined.css');
const home=load('index.html');
const docs=load('docs/SEYVEO-FUTURE-EXPERIENCE.md');
assert.match(js,/const compact=\$\('ask'\)\.querySelector\('\.composer-compact'\)/);
assert.match(js,/compact\.insertBefore\(\$\('seyveoConversationBack'\),compact\.firstChild\)/);
assert.match(js,/compact\.insertBefore\(\$\('seyveoConversationHistory'\),fold\)/);
assert.match(js,/compact\.insertBefore\(header\.querySelector\('\.seyveo-conversation-heading'\),fold\)/);
assert.match(js,/fold\.addEventListener\('click',\(\)=>\{\s*const field=\$\('question'\)/);
assert.match(js,/if\(field&&document\.activeElement===field\)field\.blur\(\)/);
assert.doesNotMatch(js,/fold\.addEventListener\('click',\(\)=>close\(\)\)/);
assert.match(js,/\$\('seyveoConversationBack'\)\.addEventListener\('click',close\)/);
assert.match(js,/\$\('seyveoConversationHistory'\)\.addEventListener\('click',\(\)=>window\.SEYVEO_CHAT_HISTORY\?\.open\(\)\)/);
assert.match(css,/html\.seyveo-conversation #seyveoConversationHeader\{\s*display:none!important/);
assert.match(css,/#ask\.prompt:not\(\.expanded\) \.seyveo-conversation-heading\{\s*display:flex!important/);
assert.match(css,/#ask\.prompt:not\(\.expanded\) #seyveoComposerFold\{\s*order:4!important/);
assert.match(css,/#ask\.prompt:not\(\.expanded\) #seyveoConversationMic\{\s*order:5!important/);
assert.match(css,/#ask\.prompt:not\(\.expanded\) #composerCompactSend\{\s*order:6!important/);
assert.match(home,/assets\/conversation-refined\.css\?v=8/);
assert.match(home,/assets\/living-conversation\.js\?v=15/);
assert.equal((home.match(/<form class="prompt" id="ask"/g)||[]).length,1);
assert.equal((home.match(/<footer class="dock"/g)||[]).length,1);
assert.match(docs,/SEYVEO Open Canvas/);
assert.match(docs,/Invisible Header/);
// SEYVEO Full Bleed: remove unnecessary horizontal gutters only inside chat.
assert.match(css,/max\(8px,env\(safe-area-inset-right,0px\)\)/);
assert.match(css,/max\(8px,env\(safe-area-inset-left,0px\)\)/);
assert.match(css,/width:min\(518px,calc\(100vw - 12px - env\(safe-area-inset-left,0px\) - env\(safe-area-inset-right,0px\)\)\)/);
assert.match(css,/padding:calc\(env\(safe-area-inset-top,0px\) \+ 8px\)/);
assert.match(css,/padding:11px 12px 9px!important/);
assert.match(docs,/SEYVEO Full Bleed/);
console.log('SEYVEO Open Canvas + Full Bleed: one composer, safe width and header-free chat.');
