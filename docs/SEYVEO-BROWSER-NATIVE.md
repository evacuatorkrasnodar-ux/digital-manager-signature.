# SEYVEO Browser — trusted native site viewer contract

Status: **integration seam implemented in the browser UI; no iOS/Android shell or public standalone app has been built or published yet**.

## One browser in two forms

- The same **SEYVEO Browser** interface runs inside SEYVEO One / Business and in the future separate free Browser app.
- Free: local browsing, open tabs, local history, bookmarks and collections without mandatory account. No intrusive ads.
- Browser+ (future, explicitly authorized and paid): optional device sync, recovery and encrypted cloud backup. No cloud upload as part of this bridge.
- Preserve Black Velvet / light / emerald themes, fixed original five-button dock, My Signature in the personal world and the unified URL bar.
- **Never inject a bridge into an arbitrary remote webpage.** Only the trusted bundled SEYVEO interface may access the bridge; native website view must use a separate isolated WKWebView or Android WebView.

## Trusted host API

The native shell injects `window.SEYVEO_NATIVE_BROWSER` **into the trusted bundled UI only** before `seyveo-browser.js` runs. It must supply synchronous functions:

```ts
window.SEYVEO_NATIVE_BROWSER = {
  show({ url, tabId, containerId }): boolean,
  hide(): void,
  reload?(): boolean
};
```

- `show` returns **true** only when the native website view has accepted the HTTPS URL and is mounted within the **site content pane**. Never cover tabs, search bar, gray menu strip, safe areas or the original dock. Native site view should reflect the host's current visible geometry.
- `hide` conceals the native website view when visiting Browser Home, opening the Browser menu, switching to Sayvi, or leaving the Browser; preserve tab navigation state for a later return.
- `reload` is optional. If unavailable or false, the UI may call `show` for the current URL.
- The host notifies trusted UI on real native navigations: `window.SEYVEO_BROWSER.nativeNavigation({url,tabId,replace:false})`. Use `replace:true` for redirects that replace the active entry. **HTTPS only, with no embedded credentials**. Navigation across sites must be reported so the existing Back, Forward, tabs and local history remain real. The bridge never accesses private Sayvi text.
- An unavailable or rejected native bridge automatically falls back to today's safe iframe-based **web demo**. No native capability is claimed in the browser UI unless the native host actually provides it.
- Do not add `allow-same-origin` to the current sandboxed iframe.

## Native implementation boundaries

**iPhone:** native website surface = WKWebView, hosted separately from the trusted app UI; install a WKNavigationDelegate for main-frame location updates, HTTPS policy, error handling and safe external scheme routing.

**Android:** native website surface = android.webkit.WebView, hosted separately from the trusted app UI; report real main-frame location through WebViewClient and handle downloads, permissions and external schemes with explicit user action. Do not expose `addJavascriptInterface` or native app APIs to untrusted website content.

In both cases: website cookies/storage stay inside the native site container, separate from SEYVEO's assistant/account state. No silent upload of browsing history or credentials. Passwords and payment forms belong to the native website view, never to the Sayvi conversation.

## Required device tests before describing this as a real browser

1. Open Wikipedia, Yandex, YouTube, an ordinary HTTPS site and a blocked site: real websites render in the native view rather than the demo iframe.
2. Tap internal links, back, forward, reload, tabs; make sure URL, history and back/forward buttons remain synchronized.
3. Open Sayvi from a website and return: site content, video state and scroll position are retained where possible; the shared dock works correctly.
4. Run on a notched iPhone and Android with gesture navigation; verify that website view does not cover the search bar, magnetic strip, dock or keyboard.
5. Check privacy, permission prompts, offline mode, tracker-blocking behavior, and external schemes. Validate no bridge exposure to third-party sites.
6. Check fresh installation **without an account**, separate app installation flow, and optional Browser+ sync only after purchase and explicit consent.

Publishing an App Store or Android store URL must wait until an actual approved listing exists. No fictional install links.
