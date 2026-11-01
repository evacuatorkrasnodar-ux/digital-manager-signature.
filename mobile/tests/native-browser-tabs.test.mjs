import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_BROWSER_TABS,initialBrowserTabs,addBrowserTab,activeBrowserTab,
  selectBrowserTab,setBrowserTabUrl,observeBrowserTab,closeBrowserTab
} from '../src/browser/native-browser-tabs.mjs';

test('initial native browser has one blank tab without a network request',()=>{
  const state=initialBrowserTabs();
  assert.equal(state.tabs.length,1);
  assert.equal(activeBrowserTab(state).url,null);
  assert.equal(activeBrowserTab(state).title,'Новая вкладка');
});

test('safe HTTPS tab URL and title, no invalid navigation',()=>{
  let state=initialBrowserTabs();
  state=setBrowserTabUrl(state,state.activeId,'https://www.wikipedia.org');
  assert.equal(activeBrowserTab(state).url,'https://www.wikipedia.org/');
  assert.throws(()=>setBrowserTabUrl(state,state.activeId,'javascript:alert(1)'));
  const observed=observeBrowserTab(state,state.activeId,'https://www.wikipedia.org/wiki/History','Wikipedia');
  assert.equal(activeBrowserTab(observed).title,'Wikipedia');
  const rejected=observeBrowserTab(observed,observed.activeId,'file:///etc/passwd','bad');
  assert.strictEqual(rejected,observed);
});

test('tab selection, closing and new blank tab are stable',()=>{
  let state=initialBrowserTabs();
  const first=state.activeId;
  state=addBrowserTab(state,'https://ya.ru/');
  const second=state.activeId;
  assert.notEqual(second,first);
  state=selectBrowserTab(state,first);
  assert.equal(state.activeId,first);
  state=closeBrowserTab(state,first);
  assert.equal(state.activeId,second);
  state=closeBrowserTab(state,second);
  assert.equal(state.tabs.length,1);
  assert.equal(activeBrowserTab(state).url,null);
});

test('8 tab safety cap and no synthetic visited sites',()=>{
  let state=initialBrowserTabs();
  for(let i=1;i<MAX_BROWSER_TABS;i++)state=addBrowserTab(state);
  assert.equal(state.tabs.length,MAX_BROWSER_TABS);
  assert.strictEqual(addBrowserTab(state),state);
  assert.equal(state.tabs.filter(t=>t.url!==null).length,0);
});

test('untrusted title cannot contain control characters or exceed 48 characters',()=>{
  let state=initialBrowserTabs();
  state=observeBrowserTab(state,1,'https://example.org','Title\nInjected'.repeat(10));
  const title=activeBrowserTab(state).title;
  assert.equal(title.includes('\n'),false);
  assert.ok(title.length<=48);
});
