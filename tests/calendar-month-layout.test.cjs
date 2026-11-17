const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const js = readFileSync(join(root, 'assets/calendar.js'), 'utf8');
const css = readFileSync(join(root, 'assets/seyveo-calendar-apple26.css'), 'utf8');

test('four month layouts share one calendar and persist their selection', () => {
  assert.match(js, /MONTH_LAYOUTS=\['compact','stacked','details','list'\]/);
  assert.match(js, /localStorage\.setItem\(MONTH_LAYOUT_STORE,monthLayout\)/);
  assert.match(js, /grid\.style\.setProperty\('--cal-month-layout-height',String\(weeks\*rowHeight\)\+'px'\)/);
  for (const layout of ['compact', 'stacked', 'details', 'list']) {
    assert.match(html, new RegExp(`data-month-layout="${layout}"`));
  }
});

test('Details matches List week height and keeps a title below each date', () => {
  const heights = js.match(/const rowHeight=\{([^}]+)\}\[monthLayout\]/)?.[1];
  assert.ok(heights);
  const rules = Object.fromEntries(
    [...heights.matchAll(/(compact|stacked|details|list):(\d+)/g)]
      .map(([, mode, pixels]) => [mode, Number(pixels)])
  );
  assert.equal(rules.details, rules.list);
  assert.equal(rules.details, 48);
  assert.match(js, /monthLayout==='details'\?1/);
  assert.match(js, /btn\.append\(tags\)/);
  assert.match(css, /data-month-layout="details"[^\n]*\.cal-day-chip\{height:13px/);
  assert.match(css, /data-month-layout="details"[^\n]*\.cal-day-more\{[\s\S]*?position:absolute!important/);
});

test('only List opens the selected day agenda underneath the month', () => {
  assert.match(css, /:not\(\[data-month-layout="list"\]\) #calendarAgenda/);
  assert.match(css, /\[data-month-layout="list"\] #calendarAgenda:not\(\[hidden\]\)/);
});
