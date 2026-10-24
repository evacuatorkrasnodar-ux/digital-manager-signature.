/* SEYVEO Workspace Signature contract: semantic actions, one dock,
 * unchanged Home, and calm shared styles for every work area.
 * Static checks complement real iPhone/browser interaction tests. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=load('index.html'),tasks=load('assets/personal-tasks.js');
const calendar=load('assets/calendar.js'),calendarCss=load('assets/calendar.css');
const taskCss=load('assets/personal-tasks.css');
const contextCss=load('assets/future-surfaces.css');
const css=load('assets/living-space.css');
assert.match(html,/id="tasksContextOpen" class="tasks-context-open seyveo-action-orb"/);
assert.match(html,/id="tasksContextArtwork"/);
assert.match(html,/id="tasksContextComplete"/);
assert.doesNotMatch(html,/К делу\s*<span[^>]*>↗/,'No heavyweight task CTA');
assert.match(html,/id="personalAddTasks"[^>]*aria-label="Добавить новое дело"/);
assert.match(tasks,/focusArt\.replaceChildren\(taskIcon\(contact\?'phone':'note'\)\)/);
assert.match(tasks,/requestCall\(contact\);return;/,'Real call preparation, never fake completed calls');
assert.match(tasks,/const art=element\(contact&&!item.done\?'button':'span','personal-task-art'\)/);
assert.match(tasks,/const menu=element\('div','personal-task-menu'\)/);
assert.match(tasks,/if\(!window\.confirm\('Удалить дело/,'Deletion still requires explicit confirmation');
assert.doesNotMatch(tasks,/personal-task-delete|seyveo-close-glyph/,'No X-shaped delete controls');
assert.match(taskCss,/#tasksPage \.personal-task-art/);
assert.match(taskCss,/#tasksPage \.personal-task-menu\[hidden\]/);
assert.match(contextCss,/#tasksPage \.tasks-context-art svg/);
assert.match(calendar,/btn\.dataset\.calendarCall=callTarget/);
assert.match(calendar,/CustomEvent\('seyveo:call-request',\{detail:\{target:name\}\}\)/);
assert.match(calendar,/else routeTask\(entry\.dataset\.calendarTask\)/,'Ordinary tasks keep navigation');
assert.match(calendarCss,/#calendarPage \.cal-entry-phone svg/);
for(const screen of ['tasksPage','calendarPage','picturePage','managePage',
  'lifePage','sayviSurfacePage','sayviAnswerPage'])
 assert.ok(css.includes('#'+screen),'Screen has shared Signature typography: '+screen);
for(const sheet of ['#notesDialog','#calendarSpaceDialog','.paper-editor-dialog',
  '.personal-call-dialog','#calendarPersonalTools'])
 assert.ok(css.includes(sheet),'Personal workspace inherits Signature: '+sheet);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(html,/assets\/sections-velvet\.css\?v=10/);
assert.match(html,/assets\/living-space\.css\?v=5/);
assert.ok(html.indexOf('assets/living-space.css?v=5')>html.indexOf('assets/dock-voice-life.css?v=1'),
 'Living Continuity is the final workspaces layer, Home remains untouched');
assert.equal((html.match(/<footer class="dock"/g)||[]).length,1);

const roadmapSource=load('assets/management.js');
const masterIdeas=load('docs/SEYVEO-IDEAS-MASTER.md');
assert.equal((roadmapSource.match(/\['living_continuity'/g)||[]).length,1,
 'Living Continuity belongs once to the existing roadmap, not a duplicate registry');
assert.match(roadmapSource,/\['living_continuity'[^\n]*'plan'\]/,
 'Living Continuity remains planned until real screens are validated');
assert.match(masterIdeas,/Каждый экран — продолжение Главной/,
 'Canonical full-screen experience decision is recorded');
assert.match(masterIdeas,/Управление → Наши идеи → Карта развития/,
 'Roadmap instructions point to the actual current UI');

assert.match(css,/#lifePage \.calendar-space-button svg/,'World uses full-sized navigable illustrations');
assert.match(css,/#calendarPage \.cal-entry/,'Calendar events become open scenes');
assert.match(css,/#picturePage \.home-widget-card/,'Business metrics stay unboxed');
assert.match(css,/#notesDialog \.note-item/,'Notebook rows stay uncluttered');
assert.match(css,/#seyveoCleanManageMenu \.manage-row\.seyveo-clean-link/,'Management keeps one large scene per entry');
assert.doesNotMatch(css,/#homePage\s+\.(?:lm-|plasma)/,'Home cinema and sphere styling untouched');
console.log('PASS Living Continuity: all secondary workspaces use one open-scene vocabulary.');
