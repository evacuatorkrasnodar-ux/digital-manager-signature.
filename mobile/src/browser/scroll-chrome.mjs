// SEYVEO Browser — native WebView scroll signal / chrome motion.
// Only controls local visual state; never reads article text, links, cookies or credentials.
export const BROWSER_SCROLL_MESSAGE = 'seyveo:browser-scroll:v1';

/** Read-only, throttled (one animation frame) signal from an actual native WebView. */
export const BROWSER_SCROLL_BRIDGE_JS = `(function(){
  if (window.__seyveoScrollBridgeV1) return true;
  window.__seyveoScrollBridgeV1 = true;
  var queued = false;
  function report(){
    queued = false;
    var bridge = window.ReactNativeWebView;
    if (!bridge || typeof bridge.postMessage !== 'function') return;
    var doc = document.scrollingElement || document.documentElement || document.body;
    var y = Math.max(0, Number(window.scrollY || doc.scrollTop || 0));
    var max = Math.max(0, Number(doc.scrollHeight || 0) - Number(window.innerHeight || 0));
    if (!Number.isFinite(y) || !Number.isFinite(max)) return;
    bridge.postMessage(JSON.stringify({type:'seyveo:browser-scroll:v1',y:y,max:max}));
  }
  function schedule(){
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(report);
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('pageshow', schedule, {passive:true});
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, {once:true});
  }
  schedule();
  return true;
})(); true;`;

/** An untrusted website message can only move browser chrome, never run commands. */
export function parseBrowserScrollMessage(data){
  if (typeof data !== 'string' || data.length > 240) return null;
  try{
    const event = JSON.parse(data);
    if (!event || event.type !== BROWSER_SCROLL_MESSAGE) return null;
    const y = event.y, max = event.max;
    if (typeof y !== 'number' || typeof max !== 'number') return null;
    if (!Number.isFinite(y) || !Number.isFinite(max) || y < 0 || max < 0) return null;
    if (y > 100000000 || max > 100000000) return null;
    return {y:Math.min(y,max),max};
  }catch{return null}
}

/** Positive offset slides search + tabs + grey glass upwards; zero fully reveals them. */
export function createBrowserChromeTracker(heightPx=180){
  let height = Number.isFinite(heightPx) ? Math.max(1,heightPx) : 180;
  let offset = 0, lastY = null;
  function snapshot(){return {offsetPx:offset,visible:offset<height,fullyHidden:offset>=height};}
  return {
    get state(){return snapshot()},
    setHeight(next){
      if(!Number.isFinite(next) || next<=0)return snapshot();
      height=next;offset=Math.min(offset,height);
      return snapshot();
    },
    reset(){offset=0;lastY=null;return snapshot()},
    onScroll(signal){
      if (!signal || !Number.isFinite(signal.y) || !Number.isFinite(signal.max))return snapshot();
      const y=Math.max(0,Math.min(signal.y,signal.max));
      if (lastY === null){lastY=y;return snapshot()}
      if (y<=8){lastY=y;offset=0;return snapshot()}
      // A huge jump is often a hash anchor or programmatic navigation; do not
      // fling the controls off screen in one frame.
      const delta=Math.max(-54,Math.min(54,y-lastY));
      lastY=y;
      if(Math.abs(delta)<1)return snapshot();
      offset=Math.max(0,Math.min(height,offset+delta));
      return snapshot();
    }
  };
}
