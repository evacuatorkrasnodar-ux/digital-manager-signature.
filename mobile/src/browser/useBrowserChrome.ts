import {useCallback,useRef,useState} from 'react';
import {
  BROWSER_SCROLL_BRIDGE_JS, createBrowserChromeTracker, parseBrowserScrollMessage,
  type ChromeState
} from './scroll-chrome.mjs';

/** Wire to React Native WebView's injectedJavaScript and onMessage.
 * The host screen must animate its existing search, tabs and glass together
 * by chromeOffsetPx; this hook never changes the current Safari prototype.
 */
export function useBrowserChrome(initialChromeHeight=180){
  const controller=useRef(createBrowserChromeTracker(initialChromeHeight));
  const [chrome,setChrome]=useState<ChromeState>(controller.current.state);
  const onWebViewMessage=useCallback((event:{nativeEvent:{data:string}})=>{
    const signal=parseBrowserScrollMessage(event.nativeEvent.data);
    if(!signal)return;
    const next=controller.current.onScroll(signal);
    setChrome(previous=>previous.offsetPx===next.offsetPx?previous:next);
  },[]);
  const resetChrome=useCallback(()=>{
    const next=controller.current.reset();
    setChrome(next);
  },[]);
  const setChromeHeight=useCallback((height:number)=>{
    const next=controller.current.setHeight(height);
    setChrome(next);
  },[]);
  return {
    chromeOffsetPx:chrome.offsetPx,
    chromeFullyHidden:chrome.fullyHidden,
    onWebViewMessage,
    injectedJavaScript:BROWSER_SCROLL_BRIDGE_JS,
    resetChrome,
    setChromeHeight
  };
}
