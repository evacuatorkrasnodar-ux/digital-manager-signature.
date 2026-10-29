# SEYVEO account boundary · future iOS/Android backend

**Architecture and policy tests, NOT a production identity service.** This module
does not create accounts, send invitations, listen on HTTP(S), fetch personal
data, provide storage, verify an OAuth or OpenID Connect provider, or deploy
anything. No real user data should be supplied.

## Invariants

1. **One human owns one personal account.** A person may use SEYVEO One,
   SEYVEO Business, or both. Employment and team membership are separate
   organization-scoped records. Employment cannot give a company ownership of
   or access to the person's SEYVEO One data.
2. **Role comes from an active server-side organization membership**, never
   an untrusted JSON body, URL, or client header. Read membership afresh for
   each request and validate its user and organization IDs.
3. **Sessions are validated through a trusted identity provider on each
   decision** and rechecked after awaited lookups. The provider is responsible
   for validating token signature, issuer, audience, expiry, login assurance,
   stolen-device revocation, and account lifecycle. This module does not
   implement a provider or prove those guarantees by itself.
4. **An invitation is assigned to an existing verified user identity**.
   A one-use code alone never creates an identity, grants owner rights or
   chooses its own tenant. Invitation redemption must run as an atomic
   transaction that rechecks code digest, recipient, expiry, used status
   and role, and consumes the invitation together with adding the membership.
5. **Document access remains recipient-scoped** through the existing
   `server/document-authorization.mjs` rules. A company membership does not
   grant blanket access to another employee's documents.
6. **Fail closed.** Expired or revoked sessions, inaccessible memberships,
   wrong tenants, changed sessions, missing documents and backend errors
   yield denial. Decisions return boolean only; no tokens or confidential
   document contents are returned.

## API boundary

`createBusinessIdentityBoundary({verifySession, loadMembership,
loadDocument, loadInvitation, redeemInvitation, now})` returns:

- `canAccessPersonal({token, accountUserId})`
- `canAccessBusiness({token, organizationId, operation, documentId, action})`
- `acceptVerifiedInvitation({token, code})`

All interfaces are **trusted server dependency injections**, not untrusted
client claims. The demo session and SQLite helpers in
`server/secure-documents` **must not be promoted directly to production**.

### Critical integration rule

A boolean authorization decision is **not** a database lock. For a write,
the future persistent backend must perform membership and document policy
checks again **inside the same transaction that mutates the record**.
Invitation redemption must also be transactionally single-use; the
`redeemInvitation` adapter is obliged to enforce this. Do not rely on this
module as a standalone complete security boundary, cryptographic token
validator, or distributed rate limiter.

## Production prerequisites

Before real employees can connect over the internet:

- Pick a reviewed identity provider and implement verified personal account
  registration, account recovery, email/phone ownership verification if used,
  secure-device session revocation, MFA and rate limiting.
- Build a separately secured HTTPS backend with certificate validation,
  trusted server-only token verification, database transaction isolation and
  structured audit logs that never store passwords, raw access tokens or
  confidential document bodies.
- Choose user/organization/tenant schema; review RLS or equivalent mandatory
  tenant isolation, migrations, backups, restore drills and per-tenant
  encryption/key rotation.
- Implement opt-in membership invitations with a verified recipient identity.
  Allow leaving a company and revoking work access without deleting an
  employee's personal SEYVEO One account.
- Implement and test **native** iOS and Android secure storage and transport
  against a dedicated staging backend, including compromised token,
  cross-tenant, replay, race, offline and revoked-session scenarios.
- Perform threat modeling, privacy review and independent penetration testing
  before storing any real business or identity documents. Qualified Russian
  ЭДО and legally effective signatures need their own integrations/legal review.

### Run model tests

```sh
node --test server/business-identity/identity-boundary.test.mjs
```

The workflow `.github/workflows/seyveo-secure-documents.yml` includes this
test suite alongside the isolated document demo tests. Passing unit tests
does **not** establish production security, trusted identity or iPhone/Android
connectivity.
