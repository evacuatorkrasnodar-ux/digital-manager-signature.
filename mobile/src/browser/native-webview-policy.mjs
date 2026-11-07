/**
 * SEYVEO Browser native navigation boundary.
 *
 * HTTPS public-domain browsing only in the first native prototype.
 * Reject credentials, localhost, IP addresses and internal/special protocols.
 * This is a navigation guard, NOT an antivirus or DNS rebinding defense.
 * The WebView engine still enforces site isolation and the OS cookie policy.
 */
export function validateBrowserWebViewUrl(value) {
  if (typeof value!=='string' || !value.trim() || value.length>4096) {
    throw Error('browser-url-invalid');
  }
  let url;
  try { url=new URL(value.trim()); }
  catch { throw Error('browser-url-invalid'); }
  const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:' || url.username || url.password ||
     (url.port && url.port!=='443') || url.host.length>253 ||
     !host.includes('.') || host.startsWith('.') || host.endsWith('.') ||
     host.includes('..') || !/^[a-z0-9.-]+$/.test(host) ||
     /^[0-9.]+$/.test(host) ||
     /\.(?:localhost|local|internal|test|invalid|example)$/.test(host)) {
    throw Error('browser-url-not-allowed');
  }
  return url.href;
}
export function shouldLoadBrowserWebViewUrl(value){
  try { validateBrowserWebViewUrl(value); return true; }
  catch { return false; }
}
