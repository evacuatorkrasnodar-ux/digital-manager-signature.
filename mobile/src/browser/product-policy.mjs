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
export const BROWSER_PREMIUM_ENTITLEMENTS = Object.freeze([
  'browser-premium',
  'seyveo-one',
  'seyveo-business'
]);

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
  const premium = signedIn && entitlementVerified === true &&
    BROWSER_PREMIUM_ENTITLEMENTS.includes(entitlement);
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
    hasPremium: premium,
    canOfferCloudSync: premium,
    cloudSyncEnabled: premium && syncConsent === true,
    canOfferPremiumAssistant: premium
  });
}
