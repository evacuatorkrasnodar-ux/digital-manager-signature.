# SEYVEO Browser — product plan, 01.11.2026

One browser, two distributions: embedded SEYVEO and standalone iOS/Android. Standalone browsing, history, favorites, and tabs must work free, without mandatory registration. A dismissible SEYVEO brand card may appear only on the standalone start page, never on third-party pages or inside embedded browser.

Cloud sync requires a verified entitlement, an account, and separate opt-in. Eligible purchases may include Browser Premium and relevant SEYVEO One/Business subscriptions. No automatic access to accounts on third-party websites.

CURRENT STATUS: assets/seyveo-browser.js and .css are a web prototype. Native web browsing and standalone app distribution are NOT implemented. mobile/src/browser/product-policy.mjs defines presentation capabilities only. It neither verifies purchases nor provides cloud sync.

NEXT: integrate real native browser with platform-approved WebViews; add shared navigation, safe local storage and clear privacy boundaries; separately build standalone app shell; verify on devices. Preserve existing Black Velvet design, tabs, plus, LED highlights, all five themes, optional automatic mode and the grey glass strip.

## Approved standalone themes (01.11.2026)

The independent SEYVEO Browser must offer all five existing app themes, with identical identity, glass, LED lighting and spacing:

| User theme | Existing stored value | Palette token | Contrast |
|---|---|---|---|
| White Velvet (default for first standalone install) | `light` | `white` | `light` |
| Classic Graphite | `graphite` | `graphite` | `dark` |
| Emerald Royale | `dark` | `emerald` | `dark` |
| Midnight Sapphire | `sapphire` | `sapphire` | `dark` |
| Copper Dune | `plum` | `plum` | `dark` |

`auto` is an additional mode, **not a sixth color theme**. It currently maps to Graphite with dark system appearance, White Velvet with light appearance, matching `index.html`'s current `applyTheme()` behavior.

The pure module `mobile/src/browser/browser-themes.mjs` represents these identities for future native and standalone shells. It is **not yet bound to a settings UI or a native render tree**, and does not duplicate the real color/glass/LED CSS tokens. A native implementation should reuse the design values established by the web prototype, including site-colored active tab LEDs, a grey glass navigation strip, and white readable text where required. Site content itself is not recolored.

No separate browser theme or palette defaults should silently override an explicit choice made by the user. For embedded Browser the theme follows SEYVEO's app settings; for standalone Browser it uses its own locally stored choice, optionally linked with SEYVEO after explicit account sync consent.
