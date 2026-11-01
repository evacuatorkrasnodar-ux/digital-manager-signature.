/**
 * SEYVEO Browser product policy (pure UI capability state, v1).
 *
 * One browser product, two distributions: embedded SEYVEO and standalone.
 * No network, account creation, analytics, or storage side-effects.
 *
 * SECURITY: this is a presentation policy. Never grant server access, decrypt
 * synced material, or accept a purchase based solely on this client state.
 * A future backend must independently verify account, purchase and consent.
 */
export const BROWSER_DISTRIBUTIONS = Object.freeze({
  EMBEDDED: 'embedded',
  STANDALONE: 'standalone'
});

/** Entitlements must be verified by a trusted account / purchase adapter. */
export const BROWSER_PLUS_ENTITLEMENTS = Object.freeze([
  'browser-plus',
  // Legacy internal entitlement remains recognized; never display "Premium".
  'browser-premium',
  'seyveo-one',
  'seyveo-business'
]);
// Backward compatible programmatic alias for already prepared modules.
export const BROWSER_PREMIUM_ENTITLEMENTS = BROWSER_PLUS_ENTITLEMENTS;

/** Build deterministic UI capabilities; local browsing stays free. */
export function resolveBrowserProductState({
  distribution = BROWSER_DISTRIBUTIONS.EMBEDDED,
  accountId = null,
  entitlement = null,
  entitlementVerified = false,
  syncConsent = false,
  promoDismissed = false
} = {}) {
  if (!Object.values(BROWSER_DISTRIBUTIONS).includes(distribution)) {
    throw new TypeError('Unknown SEYVEO Browser distribution');
  }
  const standalone = distribution === BROWSER_DISTRIBUTIONS.STANDALONE;
  const signedIn = typeof accountId === 'string' && accountId.trim().length > 0;
  const plus = signedIn && entitlementVerified === true &&
    BROWSER_PLUS_ENTITLEMENTS.includes(entitlement);
  return Object.freeze({
    distribution,
    canBrowseAsGuest: true,
    localTabs: true,
    localHistory: true,
    localBookmarks: true,
    localCollections: true,
    showSeyveoCard: standalone && promoDismissed !== true,
    canDismissSeyveoCard: standalone,
    signedIn,
    edition: plus ? 'plus' : 'free',
    editionName: plus ? 'SEYVEO Browser+' : 'SEYVEO Browser',
    // The "+" is a brand edition mark, not the new-tab button.
    hasPlus: plus,
    hasPremium: plus, // Legacy internal consumer; no user-facing Premium label.
    canOfferCloudSync: plus,
    cloudSyncEnabled: plus && syncConsent === true,
    canOfferPremiumAssistant: plus
  });
}
