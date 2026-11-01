import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBrowserProductState} from '../src/browser/product-policy.mjs';

test('standalone free edition is a complete local Browser without a plus',()=>{
  const s=resolveBrowserProductState({distribution:'standalone'});
  assert.equal(s.edition,'free');
  assert.equal(s.editionName,'SEYVEO Browser');
  assert.equal(s.hasPlus,false);
  assert.equal(s.localTabs,true);
  assert.equal(s.localHistory,true);
  assert.equal(s.localBookmarks,true);
  assert.equal(s.canBrowseAsGuest,true);
  assert.equal(s.cloudSyncEnabled,false);
  assert.equal(s.canOfferPremiumAssistant,false);
});

test('Plus brand mark only follows a verified entitlement',()=>{
  const common={distribution:'standalone',accountId:'account-a',
    entitlement:'browser-plus',syncConsent:true};
  const notVerified=resolveBrowserProductState(common);
  assert.equal(notVerified.editionName,'SEYVEO Browser');
  assert.equal(notVerified.hasPlus,false);
  const verified=resolveBrowserProductState({...common,entitlementVerified:true});
  assert.equal(verified.editionName,'SEYVEO Browser+');
  assert.equal(verified.edition,'plus');
  assert.equal(verified.hasPlus,true);
  assert.equal(verified.cloudSyncEnabled,true);
});

test('Legacy entitlement remains internal compatibility only',()=>{
  const s=resolveBrowserProductState({accountId:'account-a',
    entitlement:'browser-premium',entitlementVerified:true});
  assert.equal(s.editionName,'SEYVEO Browser+');
});
