/** Native browser chrome scroll-only contract. */
export const BROWSER_SCROLL_MESSAGE: string;
export const BROWSER_SCROLL_BRIDGE_JS: string;
export type ScrollSignal = {y:number;max:number};
export type ChromeState = {offsetPx:number;visible:boolean;fullyHidden:boolean};
export function parseBrowserScrollMessage(data:unknown):ScrollSignal|null;
export function createBrowserChromeTracker(heightPx?:number):{
  readonly state:ChromeState;
  setHeight(next:number):ChromeState;
  reset():ChromeState;
  onScroll(signal:ScrollSignal):ChromeState;
};
