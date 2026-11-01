/**
 * SEYVEO Browser — shared theme identities for embedded and standalone shells.
 *
 * These ids mirror the current app's applyTheme() values. Actual colors,
 * glass and LEDs come from shared design tokens, not duplicate theme CSS.
 * Standalone/native UI is NOT yet wired to this mapping.
 */
export const BROWSER_THEMES = Object.freeze([
  Object.freeze({id:'light',label:'White Velvet',palette:'white',contrast:'light'}),
  Object.freeze({id:'graphite',label:'Classic Graphite',palette:'graphite',contrast:'dark'}),
  Object.freeze({id:'dark',label:'Emerald Royale',palette:'emerald',contrast:'dark'}),
  Object.freeze({id:'sapphire',label:'Midnight Sapphire',palette:'sapphire',contrast:'dark'}),
  Object.freeze({id:'plum',label:'Copper Dune',palette:'plum',contrast:'dark'})
]);

export const BROWSER_THEME_AUTO = 'auto';
const BY_ID = new Map(BROWSER_THEMES.map(theme=>[theme.id,theme]));

/**
 * Return the selected theme's palette and document attributes.
 * The existing SEYVEO app currently resolves auto to Graphite when the
 * OS is dark and White Velvet when the OS is light.
 */
export function resolveBrowserTheme(selected='light',{prefersDark=false}={}){
  const saved = BY_ID.has(selected) || selected === BROWSER_THEME_AUTO ? selected : 'light';
  const effective = saved === BROWSER_THEME_AUTO ? (prefersDark ? 'graphite' : 'light') : saved;
  const theme = BY_ID.get(effective);
  return Object.freeze({
    selected: saved,
    effective: theme.id,
    label: theme.label,
    palette: theme.palette,
    contrast: theme.contrast,
    dataTheme: theme.contrast,
    dataPalette: theme.palette
  });
}

/** User-facing theme picker: five palettes and automatic system mode. */
export function listBrowserThemeChoices(){
  return [...BROWSER_THEMES, Object.freeze({id:BROWSER_THEME_AUTO,label:'Автоматически'})];
}
