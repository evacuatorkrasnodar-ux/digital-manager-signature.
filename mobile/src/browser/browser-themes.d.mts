export type BrowserThemeId = 'light'|'graphite'|'dark'|'sapphire'|'plum';
export type BrowserThemeSelection = BrowserThemeId|'auto';
export type BrowserThemeChoice = Readonly<{
  id:BrowserThemeSelection;label:string;palette?:string;contrast?:string;
}>;
export const BROWSER_THEMES:ReadonlyArray<Readonly<{
  id:BrowserThemeId;label:string;palette:string;contrast:'light'|'dark';
}>>;
export const BROWSER_THEME_AUTO:'auto';
export function resolveBrowserTheme(selected?:BrowserThemeSelection,
  options?:{prefersDark?:boolean}):Readonly<{
    selected:BrowserThemeSelection;effective:BrowserThemeId;label:string;
    palette:string;contrast:'light'|'dark';
    dataTheme:string;dataPalette:string;
  }>;
export function listBrowserThemeChoices():BrowserThemeChoice[];
