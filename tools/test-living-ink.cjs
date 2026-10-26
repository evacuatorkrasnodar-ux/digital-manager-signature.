/* SEYVEO Living Ink visual-source contract.
 * Check the actual styles/components, not a demo screenshot. Real-device visual
 * acceptance (iPhone X, modern iOS and Android) is still required. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
const vm=require('node:vm');
const inlineScripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
 .map(match=>match[1]).filter(code=>code.trim());
assert.ok(inlineScripts.length>0,'Main document has inline scripts');
assert.match(html,/assets\/navigation-system\.css\?v=1/,'Single navigation style is active');
assert.match(html,/assets\/navigation-system\.js\?v=1/,'Unified navigation semantics are active');
assert.match(navigationCss,/button\.sv-nav-redundant\{display:none!important\}/,'All redundant close controls disappear');
assert.match(navigationCss,/button\.sv-nav-done\.seyveo-close-control/,'Done is a quiet typographic action');
assert.match(navigationCss,/button\.sv-nav-back\.seyveo-close-control/,'Back keeps its round 44px control');
assert.match(navigationJs,/replaceChildren\(document\.createTextNode\('Готово'\)\)/,'Old close glyphs become Done without changing listeners');
assert.match(navigationJs,/new Set\(\[\s*'personalTaskDialog','calendarEventDialog','noteReviewDialog'/,'Edit sheets use footer actions, never duplicate close controls');
assert.match(navigationJs,/const guarded=\[/,'Existing edit forms are protected from accidental discard');
assert.match(navigationJs,/event\.stopImmediatePropagation\(\)/,'Declined unsaved changes block original close handlers');
assert.match(navigationJs,/MutationObserver\(capture\)/,'Editable snapshot is taken after dialog opens');
assert.match(navigationJs,/window\.SEYVEO_NAVIGATION=Object\.freeze/,'Navigation is initialized once');
assert.doesNotMatch(navigationJs,/location\.href|history\.pushState|localStorage/,'Navigation styling never changes routes or storage');

for(const code of inlineScripts)new vm.Script(code,{filename:'index.html inline script'});

const dock=read('assets/floating-navigation.css');
const magnetic=read('assets/magnetic-ink-dock.js');
const composer=read('assets/composer-intent.css');
const navigationCss=read('assets/navigation-system.css');
const navigationJs=read('assets/navigation-system.js');
const chatAppearance=read('assets/conversation-refined.css');
const historyStyles=read('assets/dialog-velvet.css');
const notebookStyles=read('assets/notebook-smart.css');
const paperStyles=read('assets/notebook-paper.css');
const scanStyles=read('assets/notebook-scan.css');
const taskStyles=read('assets/personal-tasks.css');
const chatLogic=read('assets/living-conversation.js');
const home=read('assets/home-velvet.css');
const future=read('assets/future-surfaces.css');
const continuity=read('assets/living-space.css');
const videoStyles=read('assets/seyveo-video.css');

// Quiet Cinema uses the existing shared workspace stylesheet, NOT a new layer.
for(const page of ['tasksPage','calendarPage','picturePage','lifePage','managePage',
 'sayviSurfacePage','sayviAnswerPage','sayviMusicPage','sayviVideoPage'])
 assert.ok(continuity.includes('#'+page),'Shared Quiet Cinema includes '+page);
assert.match(continuity,/sv-quiet-scene-enter/,'Workspace entry is compositor friendly');
assert.match(continuity,/--sv-q-surface/,'One shared visual surface token');
assert.match(continuity,/prefers-reduced-motion:reduce/,'Animation can be disabled');
assert.match(continuity,/#lifePage #calendarSpaces\.calendar-spaces-grid/,'My World has a single row surface');
assert.match(continuity,/#tasksPage \.personal-tasks-list/,'Tasks have one outlined list');
assert.match(continuity,/#calendarPage #calendarView/,'Calendar retains a real interactive grid');
assert.match(continuity,/#picturePage #pictureBusinessCharts/,'Business charts remain available');
assert.match(html,/assets\/living-space\.css\?v=22/,'All screens use versioned common stylesheet');
assert.match(html,/assets\/seyveo-video\.css\?v=3/,'Video page uses current source');
assert.match(continuity,/#calendarPage\.sv-cascade \.calendar-space-button/,'Calendar keeps independent row reveal');
assert.doesNotMatch(continuity,/#lifePage\.sv-cascade \.calendar-space-button,/,'My World children do not double animate');
assert.doesNotMatch(continuity,/#tasksPage\.sv-cascade \.personal-task-row,/,'Task rows no longer double animate');
assert.match(continuity,/#manageRoadmapDialog,#pictureBreakdownDialog/,'Dialogs share text-first actions');
assert.match(continuity,/text-underline-offset:5px/,'Confirmed actions are text, not capsules');
assert.doesNotMatch(videoStyles,/calc\(95px \+ env\(safe-area-inset-bottom/,'No doubled video bottom safe area');
assert.doesNotMatch(videoStyles,/calc\(90px \+ env\(safe-area-inset-bottom/,'Compact video does not waste vertical space');

const decisionCss=read('assets/living-moment.css');
const decisionJs=read('assets/living-moment.js');
const managementCinema=read('assets/management-glass-showcase.css');
const music=read('assets/seyveo-music-dock.js');
const wellness=read('assets/personal-wellness.css');
const life=read('assets/calendar-spaces.css');
const notesCss=read('assets/notebook-smart.css');
const roadmap=read('assets/management.js');
const quick=read('assets/assistant-quick-swipe.js');
const cssBlock=(source,selector)=>{
 const start=source.indexOf(selector+'{');
 assert.ok(start>=0,'CSS selector exists: '+selector);
 const close=source.indexOf('}',start);
 assert.ok(close>start,'CSS selector closes: '+selector);
 return source.slice(start,close+1);
};

// Single Quiet Cinema chat: same canvas, real composer geometry, saved data intact.
assert.match(chatAppearance,/html\.seyveo-conversation #ask\.prompt:not\(\.expanded\)\{\s*background:transparent!important/,'Composer shares page background');
assert.match(chatAppearance,/html\.seyveo-conversation #ask\.prompt:not\(\.expanded\):focus-within\{\s*background:transparent!important/,'Composer never becomes a separate strip');
assert.match(chatLogic,/const bottomOffset=Math\.max\(8,Math\.min\(96/,'Composer reserves measured safe area');
assert.match(chatLogic,/composerHeight\+bottomOffset\+10/,'Composer reserve leaves a safe touch gap');
assert.doesNotMatch(chatLogic,/composerHeight\+30/,'No arbitrary 30px blank gutter');
assert.match(chatLogic,/function displayChatText\(value\)/,'Long displayed messages are compact');
assert.match(chatLogic,/visibleText\.length>440/,'Oversized questions are collapsed at display only');
assert.match(chatLogic,/item\.classList\.add\('seyveo-message-folded'\)/,'Fold is a presentation class');
assert.match(chatLogic,/expand\.setAttribute\('aria-expanded','false'\)/,'Long question expansion is accessible');
assert.match(chatLogic,/if\(atBottom\|\|isNewTurn\)scrollToLatest\(\)/,'New messages scroll into view');
assert.match(chatLogic,/queueChatGeometry\(\);\s*scrollToLatest\(\);/,'Opening chat displays latest messages');
assert.match(chatAppearance,/\.seyveo-message-folded \.seyveo-conversation-body\{/,'Only folded messages clip on screen');
assert.match(chatAppearance,/html\.seyveo-conversation:not\(\[data-theme=light\]\) body\{/,'Chat canvas is one graphite surface');
assert.match(chatAppearance,/padding:6px clamp\(12px,3\.3vw,18px\) 22px!important/,'Transcript reserves actual horizontal gutters and a bottom breathing space');
assert.match(chatAppearance,/flex:1 1 0px!important;box-sizing:border-box;/,'Reader has a definite pixel flex basis');
assert.match(chatAppearance,/width:100%;height:0!important;min-height:0!important/,'Native scroll reader shrinks within its parent');
assert.match(chatAppearance,/flex:1 1 0px!important;min-height:0!important;height:0!important/,'Stage also shrinks rather than clipping its reader');
assert.match(chatAppearance,/display:flex!important;flex:1 1 0px!important;flex-direction:column/,'Nested reply cannot grow to transcript content');
assert.doesNotMatch(chatAppearance,/flex:1 1 0%!important;box-sizing:border-box/,'Do not restore the Safari percentage flex fallback');
assert.doesNotMatch(chatAppearance,/width:100%;height:100%!important;min-height:0!important/,'Regression: full-height reader cannot push its end under composer');
assert.match(chatLogic,/let latestScrollRequest=0/,'Latest-turn scroll is deduplicated');
assert.match(chatLogic,/syncChatGeometry\(\);\s*requestAnimationFrame\(\(\)=>\{/,'Scroll waits for real composer geometry');
assert.match(chatLogic,/text\.scrollTop=Math\.max\(0,text\.scrollHeight-text\.clientHeight\)/,'Reader scrolls to its actual reachable end');
assert.match(html,/conversation-refined\.css\?v=24/,'Definite reader and stage flex bases are deployed');
assert.match(html,/living-conversation\.js\?v=21/,'Latest message scroll fix is deployed');
assert.match(chatAppearance,/max-width:min\(91%,460px\);width:fit-content;min-width:0/,'Owner bubbles never exceed the message column');
assert.match(chatAppearance,/box-sizing:border-box;width:100%;max-width:100%;min-width:0/,'Chat reader cannot overflow its flex parent');
assert.match(chatLogic,/const stickToBottom=text\.scrollHeight-text\.clientHeight-text\.scrollTop<56/,'Keyboard does not hide the latest messages');
assert.match(chatLogic,/if\(stickToBottom\)requestAnimationFrame/,'Existing history reading stays undisturbed');
assert.match(html,/conversation-refined\.css\?v=22/,'Constrained chat CSS deployed');
assert.match(html,/living-conversation\.js\?v=20/,'Keyboard-aware chat JS deployed');

assert.match(chatAppearance,/linear-gradient\(180deg,#1d2025 0%,#1b1e23 55%,#191c21 100%\)/,'Softened graphite replaces pure black');
assert.match(chatAppearance,/background:rgba\(232,236,244,\.092\)/,'Owner messages have soft visual separation');
assert.match(chatAppearance,/width:44px!important;min-width:44px!important/,'Reply controls retain comfortable hit targets');
assert.match(chatAppearance,/width:19px!important;height:19px!important/,'Reply glyphs are legible');
assert.match(chatAppearance,/order:5!important;flex:0 0 44px/,'Composer controls have matching geometry');
assert.match(chatAppearance,/background:transparent!important;\s*border:0!important;border-radius:0!important;\s*-webkit-backdrop-filter:none!important;backdrop-filter:none!important/,'No overlay stripe is introduced');





assert.match(historyStyles,/#assistantChatHistoryDialog\.assistant-chat-history\[open\]\{[\s\S]*?height:auto;/,'History follows its actual content height');
assert.match(historyStyles,/#assistantChatHistoryDialog \.assistant-chat-items\{[\s\S]*?flex:0 1 auto;/,'History list does not force an empty viewport');
assert.match(historyStyles,/#assistantChatHistoryDialog \.assistant-chat-summary::after\{content:none!important/,'History has no decorative arrows');
assert.doesNotMatch(composer,/#assistantChatHistoryDialog\.assistant-chat-history\[open\]/,'No duplicated history shell in composer styles');
assert.match(historyStyles,/max-height:min\(78svh/,'History stays within a quiet centered viewport');
assert.match(historyStyles,/max-height:min\(58svh,560px\)/,'Long lists scroll within their reader');
assert.match(historyStyles,/min-height:57px;height:auto!important/,'Rows are compact and touch-readable');
assert.match(historyStyles,/border-radius:21px!important/,'Single fine-rimmed Quiet Cinema surface');
assert.match(historyStyles,/#assistantChatHistoryDialog \.assistant-chat-bottom button\[hidden\]\{display:none!important\}/,'Clear stays hidden on empty history');
assert.match(html,/assets\/composer-intent\.css\?v=17/,'Duplicate history style is no longer cached');

assert.match(notebookStyles,/height:fit-content!important/,'Notebook fits real notes');
assert.match(notebookStyles,/width:min\(520px,calc\(100vw - 24px\)\)/,'Notebook remains compact');
assert.match(notebookStyles,/border-radius:22px!important/,'Single Quiet Cinema sheet');
assert.match(notebookStyles,/-webkit-line-clamp:2/,'Previews are two lines');
assert.match(notebookStyles,/max-height:min\(61svh,570px\)/,'Long lists scroll');
assert.doesNotMatch(notebookStyles,/height:min\(840px,calc\(100svh/,'Legacy forced height gone');
assert.match(notebookStyles,/min-height:44px;padding:8px 3px;font-size:12px/,'Actions retain touch area');

assert.match(paperStyles,/#noteModeDialog \.paper-choice-list\{/,'One grouped note method surface');
assert.match(paperStyles,/#noteModeDialog \.paper-choice-item \+ \.paper-choice-item\{border-top/,'Choice lines share thin dividers');
assert.match(paperStyles,/#notePaperDialog \.paper-toolbar-primary > button/,'Paper tools remain accessible');
assert.match(paperStyles,/\.paper-sheet canvas\{display:block/,'Writable white canvas is kept intact');
assert.match(paperStyles,/#notePaperDialog \.paper-actions button\{[\s\S]*?background:transparent!important/,'Paper actions are plain text');
assert.match(scanStyles,/#noteScanDialog \.paper-scan-inputs label\{[\s\S]*?background:transparent;border:0/,'Photo picker is unpainted');
assert.match(scanStyles,/#noteScanDialog \.paper-scan-actions button\{[\s\S]*?background:transparent!important/,'Scan actions are text-only');
assert.match(scanStyles,/#noteScanDialog \.paper-scan-consent\[hidden\]/,'OCR consent flow is still present');
assert.match(notebookStyles,/height:clamp\(135px,22svh,185px\)/,'New note editor is compact');
assert.match(notebookStyles,/\.note-more-options:not\(\[hidden\]\)\{[\s\S]*?gap:0 8px/,'Notebook action list stays compact');
for(const file of ['notebook-smart.css?v=24','notebook-paper.css?v=11','notebook-scan.css?v=6'])
 assert.ok(html.includes('assets/'+file),'Refreshed notebook stylesheet '+file);

assert.match(notebookStyles,/\.notes-list:not\(\.is-empty\)\{[\s\S]*?flex:0 1 auto!important/,'Notebook does not fill empty screen');
assert.match(taskStyles,/#personalTaskDialog\.personal-task-dialog\[open\]/,'Task sheet keeps a quiet outline');
assert.match(html,/dialog-velvet\.css\?v=8/,'History CSS refreshed');

assert.match(html,/personal-tasks\.css\?v=19/,'Task CSS refreshed');

assert.match(chatLogic,/body\.textContent=displayChatText\(value\)/,'Chat renders compact spacing');
assert.match(chatLogic,/const ownText=String\(value\|\|''\)/,'Clipboard/edit preserve the original user text');



assert.equal((html.match(/<footer class="dock"/g)||[]).length,1,'Exactly one persistent dock');
assert.equal((html.match(/id="orbCluster"/g)||[]).length,1,'One original sphere');
assert.match(music,/const dock=document\.querySelector\('footer\.dock'\)/,'Music changes original dock');
assert.match(music,/if\(!mode\|\|!event\.isTrusted\)return/,'Programmatic navigation stays native');

const dockShell=cssBlock(dock,'.dock');
assert.match(dockShell,/border:1px solid rgba\(235,238,244,\.21\)!important/,'Thin dock outline');
assert.match(dockShell,/backdrop-filter:none!important/,'No power-hungry blurring');
assert.match(dockShell,/box-shadow:inset 0 1px 0 rgba\(255,255,255,\.05\)!important/,'No large shadow');
assert.doesNotMatch(dockShell,/backdrop-filter:blur\(/);
assert.match(dock,/--seyveo-dock-height:58px/,'Dock is more compact');
assert.match(dock,/height:48px!important;min-height:48px!important/,'Four side tabs retain large hit targets');
const selectedDockTab=cssBlock(dock,'.dock>.nav-item.active');
assert.match(selectedDockTab,/border-color:transparent!important/,'Active route no longer has a permanent outline');
assert.match(selectedDockTab,/background:transparent!important/,'Selected tab has no grey stain');
assert.doesNotMatch(selectedDockTab,/background:rgba\(/,'No selected pill');
const tapOutline=cssBlock(dock,'.dock>.nav-item.sv-nav-feedback');
assert.match(tapOutline,/border-color:rgba\(236,239,245,\.39\)!important/,'Tap produces the original fine contour');
assert.match(dock,/:root\[data-theme="light"\] \.dock>\.nav-item.sv-nav-feedback/,'Tap works in light mode');
assert.match(dock,/transition:border-color \.36s ease/,'Contour fades gracefully');
assert.match(magnetic,/function showSelectionFeedback\(button\)/,'Tap animation belongs to the dock controller');
assert.match(magnetic,/showSelectionFeedback\(button\);/,'User click briefly shows the outline');
assert.match(magnetic,/\},1600\);/,'Feedback ends after 1.6 seconds');
assert.match(magnetic,/if\(!event\.isTrusted\|\|musicMode\(\)\)return/,'Synthetic routing never flashes the frame');
assert.match(html,/assets\/floating-navigation\.css\?v=32/,'Timed dock CSS is loaded');
assert.match(html,/assets\/magnetic-ink-dock\.js\?v=7/,'Timed dock JS is loaded');
assert.match(dock,/prefers-reduced-motion:reduce/,'Honors reduced motion');
assert.doesNotMatch(dock,/sv-magnetic-reveal/,'Carousel animation retired');

assert.match(dock,/SEYVEO Living Ink · readable composer/,'The compact input contrast stays intentional');
assert.match(dock,/radial-gradient\(ellipse 87% 91% at 47% 50%/,'Compact input gets a feathered ink veil without a painted panel');
assert.match(dock,/#ask\.prompt:not\(\.expanded\) #question::placeholder\{/,'Real composer hint has a contrast rule');
assert.match(dock,/--sv-ink-input-hint:#b7c2d0/,'Black Velvet hint is legible');
assert.match(dock,/:root\[data-theme="light"\] #ask\.prompt:not\(\.expanded\)/,'Light theme avoids white-on-white');
assert.match(dock,/#ask\.prompt:not\(\.expanded\):focus-within\{/,'Focus increases contrast only, not geometry');
assert.match(dock,/border-width:0!important/,'No visible gray input capsule');
assert.doesNotMatch(dock,/backdrop-filter:blur\(20px\).*#ask\.prompt:not/,'No old frosted glass shell');
assert.match(html,/assets\/floating-navigation\.css\?v=\d+/,'The deployed index loads the current dock stylesheet');


const rail=cssBlock(composer,'#assistantQuickrail.assistant-quickrail');
for(const prop of ['border:0','background:transparent','box-shadow:none'])
 assert.ok(rail.includes(prop),'Quick actions have no outer box: '+prop);
assert.match(composer,/seyveo-quick-ink/,'Quick labels use bounded appearance');
assert.ok(!home.includes('background:rgba(28,31,33,.85)!important'),'Retired quickrail paint is removed');

assert.doesNotMatch(future,/background-color:var\(--card\)!important|box-shadow:inset 0 1px 0 var\(--future-soft\)/,'Old glass never repaints workspaces');
assert.doesNotMatch(future,/:root\[data-seyveo-presence=listening\] \.dock>\.assistant-button\s*\{/,'No duplicate painted voice capsule');
assert.doesNotMatch(continuity,/--sv-living-dock-glint/,'No redundant scene ring');
assert.match(continuity,/\.sv-cascade/,'Single-workspace reveal preserved');
// One Living Velvet atmosphere on every page, including Home.
assert.match(continuity,/:root:not\(\[data-theme=light\]\) body\{/,'One dark canvas for all pages');
assert.match(continuity,/:root\[data-theme=light\] body\{/,'Light atmosphere is also shared');
assert.doesNotMatch(continuity,/body:has\(#homePage:not\(\[hidden\]\)\)/,'Home must not override the atmospheric background');
assert.match(continuity,/linear-gradient\(180deg,#191b1f 0%,#141619 52%,#101216 100%\)/,'Black graphite depth restored');
assert.match(continuity,/rgba\(222,224,230,\.077\)/,'Subtle pearl halo restored');
assert.doesNotMatch(continuity,/background-attachment:fixed|backdrop-filter:blur\(/,'No scroll-heavy background filters');
assert.match(html,/assets\/living-space\.css\?v=\d+/,'Current shared atmosphere stylesheet uses a versioned URL');
assert.match(wellness,/#calendarPersonalTools \.pw-water-insight\{/,'Health insights still exist');
assert.match(life,/\.calendar-space-edit input,\.calendar-space-edit select,\.calendar-space-edit textarea\{/,'Real editors stay mounted');
assert.match(notesCss,/#notesDialog \.note-more-options button\{min-width:0;padding:7px 3px;\s*border:0;background:transparent/,'Notes have no capsule choices');
assert.match(notesCss,/#notesDialog \.note-item-actions>\.note-more-button\[aria-expanded=true\]\{\s*background:transparent/,'Expanded notes stay unpainted');
assert.match(life,/#calendarSpaceDialog :is\(#worldManageContacts,\.world-person-call\):active\{\s*background:transparent;box-shadow:none/,'Contacts use quiet touch feedback');

assert.match(html,/assets\/calendar-spaces\.css\?v=18/,'World theme version refreshed');

assert.match(life,/min-height:48px/,'Editable targets stay accessible');
assert.match(quick,/const KEY='seyveo-assistant-quick-actions-v1'/,'Favorites preserve their existing storage key');
assert.equal((roadmap.match(/\['living_intent'/g)||[]).length,1,'One Living Ink roadmap entry');
// Historical Oct 23 Quiet Cinema v3: original plasma geometry and cinematic stage.
// Management Quiet Cinema is one connected surface, never a grid of glass cards.
assert.match(managementCinema,/#seyveoCleanManageMenu\{/,'Management has one connected card');
assert.match(managementCinema,/seyveo-manage-cinema-rise/,'Management sections reveal in sequence');
assert.match(managementCinema,/\.manage-chevron\{\s*display:none!important/,'No decorative chevrons');
assert.match(managementCinema,/prefers-reduced-motion:reduce/,'Motion follows device preference');
assert.doesNotMatch(managementCinema,/backdrop-filter|filter:blur/,'No blur layers on Management');
assert.match(html,/management-glass-showcase\.css\?v=4/,'Updated Management styling is loaded');

assert.match(decisionJs,/Home Quiet Cinema v3/);
assert.match(decisionJs,/stage=\$\('stage'\)/,'Cinema must resolve stage before guarding it');
assert.match(decisionJs,/location\.hash==='#home'/,'Home route also enables the film');
assert.match(decisionJs,/function startPreview/);
assert.match(decisionJs,/window\.SEYVEO_LIVING_MOMENT/);
assert.match(decisionCss,/Black Velvet — Cinematic Presence/);
assert.match(decisionCss,/#homePage #orbCluster/);
assert.doesNotMatch(decisionJs,/lm-film-card|sv-decision|clean cinematic director/);
assert.doesNotMatch(decisionCss,/\.lm-film-card|\.sv-decision/);
assert.match(decisionCss,/\.lm-reveal \.lm-inline-item:nth-child\(2\)/,'Second flat row rises after the first');
assert.match(decisionCss,/\.lm-preview\.lm-gather \.lm-field/,'Three original rows gather in a single drawn card');
assert.match(decisionCss,/\.lm-preview\.lm-gather \.lm-inline-item/,'The second and third task stay visible after merging');
assert.doesNotMatch(decisionCss,/#seyveoLivingMoment\.lm-gather \.lm-secondary\{\s*max-height:0/,'Gather never deletes secondary items');
assert.match(decisionJs,/controls\.append\(open,execute\)/,'Only two actions: Подробнее and Исполнить');
assert.match(decisionJs,/seyveo:home-task-complete/,'Real completion uses validated personal task storage');
assert.match(decisionJs,/function finishPreviewItem/,'Demo completion removes only the selected example');
assert.doesNotMatch(decisionJs,/lm-inline-arrow/,'No extra arrow glyphs on task rows');
assert.match(decisionCss,/\.lm-polymer--main::after/,'Button arrows are disabled in the scene stylesheet');
assert.match(html,/<button class="btn primary" id="resolve" type="button">Исполнить<\/button>/,'Real advice has explicit execution entry');
assert.doesNotMatch(decisionJs,/hold\(\(\)=>disappear\(\),TIMING\.quiet\)/,'No automatic dismissal of the gathered card');
assert.match(decisionJs,/function gatherPreview/,'Three examples gather into one scene');
assert.doesNotMatch(decisionJs,/sessionStorage\.getItem\(SESSION\)/,'Same-tab reload shows the demo');
// The two actions remain visually unpainted on both themes and sizes.
const actionStart=decisionCss.indexOf('#seyveoLivingMoment .lm-polymer,\n');
assert.ok(actionStart>=0,'Text-action selector exists');
const actionCss=decisionCss.slice(actionStart,decisionCss.indexOf('}',actionStart)+1);
for(const token of ['border:0','border-radius:0','background:none','box-shadow:none'])
 assert.ok(actionCss.includes(token),'Unpainted action: '+token);
assert.match(decisionCss,/#seyveoLivingMoment \.lm-polymer::after/,'Arrows are removed from task actions');
assert.doesNotMatch(decisionCss,/background:linear-gradient\(165deg,rgba\(248,250,252,\.072\)/,'Heavy capsule gradient is retired');
assert.match(html,/living-moment\.css\?v=38/);
assert.match(html,/living-moment\.js\?v=\d+/);
for(const item of ['composer-intent.css','future-surfaces.css','floating-navigation.css',
 'home-velvet.css','living-space.css','personal-wellness.css','calendar-spaces.css'])
 assert.match(html,new RegExp('assets/'+item.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g,'\\$&')+'\\?v=\\d+'),'Versioned file: '+item);
console.log('PASS Living Ink: one drawable dock, real actions, no glass conflict, useful editors and accessible motion.');
