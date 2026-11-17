const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const js = readFileSync(join(root, 'assets/calendar.js'), 'utf8');
const css = readFileSync(join(root, 'assets/seyveo-calendar-apple26.css'), 'utf8');

test('four month layouts share one calendar and persist their selection', () => {
  assert.match(js, /MONTH_LAYOUTS=\['compact','stacked','details','list'\]/);
  assert.match(js, /localStorage\.setItem\(MONTH_LAYOUT_STORE,monthLayout\)/);
  assert.match(js, /grid\.style\.setProperty\('--cal-month-layout-height',String\(height\)\+'px'\)/);
  for (const layout of ['compact', 'stacked', 'details', 'list']) {
    assert.match(html, new RegExp(`data-month-layout="${layout}"`));
  }
});

test('Details grows each week to fit its busiest day, while List stays 48px', () => {
  const heights = js.match(/const rowHeight=\{([^}]+)\}\[monthLayout\]/)?.[1];
  assert.ok(heights);
  const rules = Object.fromEntries(
    [...heights.matchAll(/(compact|stacked|details|list):(\d+)/g)]
      .map(([, mode, pixels]) => [mode, Number(pixels)])
  );
  assert.equal(rules.list, 48);
  assert.equal(rules.compact, 48);
  assert.equal(rules.details, 48); // base value used only for non-detailed layouts
  const pureFunction = js.match(/const detailsWeekHeight=entryCount=>\{[\s\S]*?\n\};/)?.[0];
  assert.ok(pureFunction, 'week sizing must be a testable pure calculation');
  const expandedHeights = vm.runInNewContext(
    `const DETAILS_MAX_LABELS=4;\n${pureFunction}\n[0,1,2,3,4,5,10].map(detailsWeekHeight)`
  );
  assert.deepEqual(Array.from(expandedHeights), [52, 52, 69, 86, 103, 116, 116]);
  assert.match(js, /busiestDay=Math\.max\(busiestDay,Number\(button\.dataset\.monthEntryCount\)\|\|0\)/);
  assert.match(js, /if\(i%7===6\)\{[\s\S]*?rowHeights\.push\(monthLayout==='details'\?detailsWeekHeight\(busiestDay\):rowHeight\)/);
  assert.match(js, /monthLayout==='details'\?rowHeights\.reduce\(\(sum,row\)=>sum\+row,10\):weeks\*rowHeight/);
  assert.match(css, /grid-template-rows:var\(--cal-month-detail-rows/);
});

test('Details keeps four titles and shows +N for additional entries', () => {
  assert.match(js, /const DETAILS_MAX_LABELS=4/);
  assert.match(js, /monthLayout==='stacked'\|\|monthLayout==='details'\?DETAILS_MAX_LABELS:2/);
  assert.match(js, /btn\.append\(tags\)/);
  assert.match(css, /data-month-layout="details"[^\n]*\.cal-day-chip\{height:15px/);
  assert.match(css, /data-month-layout="details"[^\n]*\.cal-day-more\{[\s\S]*?position:static!important/);
});

test('only List opens the selected day agenda underneath the month', () => {
  assert.match(css, /:not\(\[data-month-layout="list"\]\) #calendarAgenda/);
  assert.match(css, /\[data-month-layout="list"\] #calendarAgenda:not\(\[hidden\]\)/);
});
