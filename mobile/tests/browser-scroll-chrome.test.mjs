import test from 'node:test';
import assert from 'node:assert/strict';
import {
 BROWSER_SCROLL_BRIDGE_JS, BROWSER_SCROLL_MESSAGE,
 createBrowserChromeTracker, parseBrowserScrollMessage
} from '../src/browser/scroll-chrome.mjs';

test('scroll bridge accepts only bounded numeric visibility samples',()=>{
 const good=JSON.stringify({type:BROWSER_SCROLL_MESSAGE,y:35,max:190});
 assert.deepEqual(parseBrowserScrollMessage(good),{y:35,max:190});
 assert.deepEqual(parseBrowserScrollMessage(JSON.stringify({type:BROWSER_SCROLL_MESSAGE,y:220,max:190})),{y:190,max:190});
 for(const bad of [
  '', '{', 'null', '{}', JSON.stringify({type:'user:token',y:2,max:9}),
  JSON.stringify({type:BROWSER_SCROLL_MESSAGE,y:'5',max:90}),
  JSON.stringify({type:BROWSER_SCROLL_MESSAGE,y:-1,max:90}),
  JSON.stringify({type:BROWSER_SCROLL_MESSAGE,y:10,max:-1}),
  JSON.stringify({type:BROWSER_SCROLL_MESSAGE,y:100000001,max:100000001}),
  'x'.repeat(241)
 ])assert.equal(parseBrowserScrollMessage(bad),null);
});

test('native chrome follows content scroll smoothly and returns on reverse',()=>{
 const chrome=createBrowserChromeTracker(120);
 assert.deepEqual(chrome.state,{offsetPx:0,visible:true,fullyHidden:false});
 chrome.onScroll({y:0,max:1000});
 assert.equal(chrome.onScroll({y:50,max:1000}).offsetPx,50);
 assert.equal(chrome.onScroll({y:100,max:1000}).offsetPx,100);
 assert.equal(chrome.onScroll({y:150,max:1000}).fullyHidden,true);
 assert.equal(chrome.onScroll({y:130,max:1000}).offsetPx,100);
 assert.equal(chrome.onScroll({y:0,max:1000}).offsetPx,0);
 assert.equal(chrome.state.fullyHidden,false);
});

test('ignores noise and caps large programmatic jumps',()=>{
 const chrome=createBrowserChromeTracker(140);
 chrome.onScroll({y:10,max:2000});
 assert.equal(chrome.onScroll({y:10.4,max:2000}).offsetPx,0);
 assert.equal(chrome.onScroll({y:1900,max:2000}).offsetPx,54);
 assert.equal(chrome.onScroll({y:1899.7,max:2000}).offsetPx,54);
 assert.equal(chrome.onScroll({y:Infinity,max:2000}).offsetPx,54);
 chrome.reset();
 assert.equal(chrome.state.offsetPx,0);
});

test('web bridge sends only position numbers through a throttled read-only channel',()=>{
 assert.match(BROWSER_SCROLL_BRIDGE_JS,/requestAnimationFrame/);
 assert.match(BROWSER_SCROLL_BRIDGE_JS,/ReactNativeWebView\.postMessage/);
 assert.match(BROWSER_SCROLL_BRIDGE_JS,/document\.scrollingElement/);
 assert.doesNotMatch(BROWSER_SCROLL_BRIDGE_JS,/document\.cookie|localStorage|innerText|textContent|outerHTML/);
});
