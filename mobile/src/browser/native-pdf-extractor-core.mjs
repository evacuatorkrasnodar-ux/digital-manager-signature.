/**
 * SEYVEO Browser — safety boundary for the native PDF text module.
 * No file access, logging, global installs, network, or content inspection
 * before the user explicitly requests a local preview.
 *
 * Injected dependency enables deterministic tests without Expo / iOS / Android.
 */
export function createNativeBrowserPdfExtractor(module) {
  const ready=()=> {
    try {
      return !!module && typeof module.isAvailable==='function' &&
        module.isAvailable()===true &&
        typeof module.getPageCount==='function' &&
        typeof module.extractTextFromPage==='function';
    } catch { return false; }
  };

  const requireReady=()=>{
    if(!ready()) throw Error('pdf-native-module-unavailable');
  };

  return Object.freeze({
    isAvailable: ready,
    async getPageCount(uri) {
      requireReady();
      return module.getPageCount(uri);
    },
    async extractTextFromPage(uri,page) {
      requireReady();
      if(!Number.isSafeInteger(page)||page<1)throw Error('pdf-invalid-page');
      return module.extractTextFromPage(uri,page);
    }
  });
}
