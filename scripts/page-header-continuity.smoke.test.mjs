/**
 * SEYVEO page-header continuity contract.
 * Static regression checks, not a browser pixel or iPhone Safari test.
 * Run with: node --test scripts/page-header-continuity.smoke.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [html,css,shell,cabinet,taskCss,taskPicker,cabinetCss,fullscreenCss,calendarCss]=await Promise.all([
 read('index.html'),
 read('assets/seyveo-work-shell.css'),
 read('assets/seyveo-work-shell.js'),
 read('assets/seyveo-unified-tasks.js'),
 read('assets/personal-tasks.css'),
 read('assets/seyveo-calendar-pickers.js'),
 read('assets/seyveo-business-command.css'),
 read('assets/seyveo-fullscreen-workspaces.css'),
 read('assets/calendar.css')
]);

test('primary routes use the shared top-row header contract',()=>{
 const layouts=[
  /<header class="picture-head"><div class="sv-continuity-titlebar">[\s\S]*?<h1 id="pictureTitle"/,
  /<header class="life-heading">\s*<div class="sv-continuity-titlebar">[\s\S]*?<h1 id="lifeTitle"/,
  /<header class="manage-heading"><div class="sv-continuity-titlebar sv-continuity-root">[\s\S]*?<h1 id="manageTitle"/,
  /<header class="manage-theme-head sv-continuity-titlebar">[\s\S]*?<h2 id="manageThemeTitle"/,
  /<header class="sv-deep-top">\s*<div class="sv-continuity-titlebar">[\s\S]*?<h1 id="sayviSurfaceTitle"/
 ];
 layouts.forEach(re=>assert.match(html,re));
 assert.match(css,/--sv-page-title-height:54px/);
 assert.match(css,/--sv-page-slot:44px/);
 assert.match(css,/\.sv-continuity-titlebar\s*>\s*:is\(h1,h2\)/);
});

test('persistent work header keeps root titles left while preserving Back in history',()=>{
 assert.match(shell,/heading\.append\(back,title,add\)/);
 assert.match(css,/#svWorkShell\[data-shared-work="true"\] #svWorkHeader\{\s*grid-template-columns:minmax\(0,1fr\) 44px!important/);
 assert.match(css,/#svWorkShell\[data-shared-work="true"\] #svWorkTitle\{\s*grid-column:1!important/);
 assert.match(css,/#svWorkShell\[data-shared-work="true"\] #svWorkAdd:not\(\[hidden\]\)\{\s*grid-column:2/);
 assert.match(css,/#svWorkShell\[data-history="true"\] #svWorkTitle\{\s*grid-column:2!important/);
});

test('Calendar creation choices no longer cover the title bar or work tabs',()=>{
 assert.match(shell,/const destination=inSharedHeader\?shell:menuHome/);
 assert.match(css,/#svWorkShell > #calendarCreateMenu\{order:0!important\}/);
 assert.match(calendarCss,/:is\(#calendarPage #calendarCreateMenu,#svWorkShell > #calendarCreateMenu\):not\(\[hidden\]\)/);
 assert.match(html,/id="calendarCreateEvent"/);
 assert.match(html,/id="calendarCreateTask"/);
 assert.match(shell,/calendarAdd\?\.click\(\)/);
});

test('Sayvi continuation is independent from saving Cabinet tool choices',()=>{
 assert.match(html,/id="svCabinetContinueWithSayvi"/);
 assert.match(css,/sv-continuity-root/);
 assert.match(cabinet,/resume\.hidden=false/);
 assert.match(cabinet,/Продолжить с Сэйви/);
});


test('New Task and Choose Deadline use one horizontal 54px Back-and-title header',()=>{
 assert.match(html,/<header class="sv-task-page-header">[\s\S]*?id="personalTaskCancel"[\s\S]*?<h2 id="personalTaskDialogTitle">Новое дело<\/h2>/);
 assert.match(taskPicker,/stageHeader\.append\(back,stageTitle,headerSpacer\)/);
 assert.match(taskPicker,/picker\.prepend\(stageHeader\)/);
 assert.match(taskCss,/#personalTaskDialog \.sv-task-page-header\{[\s\S]*?grid-template-columns:44px minmax\(0,1fr\) 44px!important/);
 assert.match(taskCss,/#personalTaskDialog\.sv-task-date-open \.personal-task-sheet > :not\(#seyveoTaskDuePicker\)/);
 assert.match(html,/assets\/personal-tasks\.css\?v=52/);
 assert.match(html,/assets\/seyveo-calendar-pickers\.js\?v=11/);
 assert.doesNotThrow(()=>new Script(taskPicker));
});

test('Cabinet guide has only the persistent header and its Back returns to the catalog',()=>{
 assert.match(html,/<header class="sv-cabinet-dialog-head">[\s\S]*?<h2 id="svCabinetTitle">/);
 assert.match(cabinet,/textContent=GOALS\[id\]\.title/);
 assert.match(cabinet,/if\(activeGoal\)\{[\s\S]*?const id=hideGoal\(\)/);
 assert.match(cabinet,/dialog\.addEventListener\('cancel',event=>\{/);
 assert.match(fullscreenCss,/#svCabinetDialog\.sv-cabinet-dialog\[open\] \.sv-cabinet-dialog-head\{[\s\S]*?display:grid!important/);
 assert.doesNotThrow(()=>{if(cabinet.includes("sv-cabinet-guide-nav"))throw Error('Duplicate guide row exists')});
 assert.doesNotThrow(()=>{if(cabinetCss.includes('data-cabinet-view="guide"] .sv-cabinet-dialog-head'))throw Error('Guide still hides header')});
 assert.match(html,/assets\/seyveo-unified-tasks\.js\?v=65/);
 assert.match(html,/assets\/seyveo-business-command\.css\?v=115/);
 assert.match(html,/assets\/seyveo-fullscreen-workspaces\.css\?v=15/);
});

test('Calendar quick-create uses one light in-flow strip for both routes',()=>{
 assert.match(html,/id="calendarCreateEvent"[\s\S]*?cal-create-choice-icon/);
 assert.match(html,/id="calendarCreateTask"[\s\S]*?cal-create-choice-icon/);
 assert.match(calendarCss,/:is\(#calendarPage #calendarCreateMenu,#svWorkShell > #calendarCreateMenu\):not\(\[hidden\]\)/);
 assert.match(calendarCss,/border-bottom:1px solid var\(--soft-line\)!important/);
 assert.match(css,/#svWorkShell > #calendarCreateMenu\{order:0!important\}/);
 assert.match(html,/assets\/calendar\.css\?v=77/);
 assert.match(html,/assets\/seyveo-work-shell\.css\?v=16/);
});

test('Safari requests current assets and work shell syntax is valid',()=>{
 assert.match(html,/assets\/seyveo-work-shell\.css\?v=16/);
 assert.match(html,/assets\/seyveo-work-shell\.js\?v=9/);
 assert.doesNotThrow(()=>new Script(shell));
});
