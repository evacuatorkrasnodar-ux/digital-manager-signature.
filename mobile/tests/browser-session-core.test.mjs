import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBrowserUrl,emptyBrowserSession,restoreBrowserSession,openBrowserTab,navigateBrowserTab,stepBrowserHistory,closeBrowserTab} from '../src/browser/session-core.mjs';
test('rejects executable schemes and credentials',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,test','file:///etc/passwd','https://user:pass@example.com','broken'])
    assert.equal(normalizeBrowserUrl(url),null);
  assert.equal(normalizeBrowserUrl('https://example.com/path#fragment'),'https://example.com/path');
});
test('tab history navigation and forward branch truncation',()=>{
  let s=openBrowserTab(emptyBrowserSession(),'https://one.example','first');
  s=navigateBrowserTab(s,'first','https://two.example');
  s=stepBrowserHistory(s,'first',-1);
  assert.equal(s.tabs[0].history[s.tabs[0].index],'https://one.example/');
  s=navigateBrowserTab(s,'first','https://three.example');
  assert.deepEqual(s.tabs[0].history,['https://one.example/','https://three.example/']);
  s=closeBrowserTab(s,'first');
  assert.equal(s.activeId,null);
  assert.deepEqual(s.closed,['https://three.example/']);
});
test('corrupted storage and duplicate ids recover safely',()=>{
  assert.deepEqual(restoreBrowserSession(null),emptyBrowserSession());
  const s=restoreBrowserSession({version:1,tabs:[{id:'a',history:['javascript:x','https://good.example'],index:999},{id:'a',history:['https://dup.example'],index:0}]});
  assert.equal(s.tabs.length,1);
  assert.equal(s.tabs[0].index,0);
});
