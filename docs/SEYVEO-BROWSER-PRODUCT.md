# SEYVEO Browser — product plan, 01.11.2026

One browser, two distributions: embedded SEYVEO and standalone iOS/Android. Standalone browsing, history, favorites, and tabs must work free, without mandatory registration. A dismissible SEYVEO brand card may appear only on the standalone start page, never on third-party pages or inside embedded browser.

Cloud sync requires a verified entitlement, an account, and separate opt-in. Eligible purchases may include Browser Premium and relevant SEYVEO One/Business subscriptions. No automatic access to accounts on third-party websites.

CURRENT STATUS: assets/seyveo-browser.js and .css are a web prototype. Native web browsing and standalone app distribution are NOT implemented. mobile/src/browser/product-policy.mjs defines presentation capabilities only. It neither verifies purchases nor provides cloud sync.

NEXT: integrate real native browser with platform-approved WebViews; add shared navigation, safe local storage and clear privacy boundaries; separately build standalone app shell; verify on devices. Preserve existing Black Velvet design, tabs, plus, LED highlights, three themes and the grey glass strip.
