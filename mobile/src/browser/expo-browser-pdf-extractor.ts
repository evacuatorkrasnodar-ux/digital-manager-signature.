import {getPageCount,extractTextFromPage,isAvailable} from 'expo-pdf-text-extract';
import {createNativeBrowserPdfExtractor} from './native-pdf-extractor-core.mjs';
import type {BrowserPdfExtractor} from './browser-pdf-review.mjs';

/**
 * Only loads the native PDF API. All reading is still initiated by the
 * user's consent action from BrowserDownloadsPanel.
 * Expo Go or a native module load failure returns unavailable.
 */
export function createExpoBrowserPdfExtractor():BrowserPdfExtractor {
  return createNativeBrowserPdfExtractor({
    getPageCount,extractTextFromPage,isAvailable
  });
}
