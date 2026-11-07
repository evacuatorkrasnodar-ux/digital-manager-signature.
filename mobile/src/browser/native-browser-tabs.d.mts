export type NativeBrowserTab = Readonly<{id:number;url:string|null;title:string}>;
export type NativeBrowserTabsState = Readonly<{
  tabs:ReadonlyArray<NativeBrowserTab>;activeId:number;nextId:number;
}>;
export const MAX_BROWSER_TABS:number;
export function initialBrowserTabs():NativeBrowserTabsState;
export function activeBrowserTab(state:NativeBrowserTabsState):NativeBrowserTab;
export function addBrowserTab(state:NativeBrowserTabsState,url?:string|null):NativeBrowserTabsState;
export function selectBrowserTab(state:NativeBrowserTabsState,id:number):NativeBrowserTabsState;
export function setBrowserTabUrl(state:NativeBrowserTabsState,id:number,url:string):NativeBrowserTabsState;
export function observeBrowserTab(state:NativeBrowserTabsState,id:number,url:string,title?:string):NativeBrowserTabsState;
export function closeBrowserTab(state:NativeBrowserTabsState,id:number):NativeBrowserTabsState;
