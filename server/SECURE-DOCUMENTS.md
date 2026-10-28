# SEYVEO Secure Documents: server groundwork (not deployed)

This directory now contains a **pure document authorization policy and tests**, not a running document server.

Run tests on a machine with Node.js 20+:

```sh
node --test server/document-authorization.test.mjs
```

## Security boundaries

The mobile app or its browser demo is NEVER a source of trusted roles or tenant IDs.

A future server must, for EVERY request:
1. Authenticate the human/device with a verified session/token (the policy does **not** do authentication).
2. Read current membership and role directly from its own database; check the membership is active.
3. Load the document by ID *and organization ID* within its own database.
4. Call the policy with the server-verified actor, DB membership and loaded document.
5. Re-check membership and document state in the same transaction used for state transitions.
6. Make an immutable audit entry containing actor, tenant, document, action, timestamp and result; sign or hash-chain audit records if the threat model requires tamper evidence.
7. Atomically commit state changes and append audit records. Concurrent requests must not double-approve/revoke.
8. Enforce document access at the storage/API layer. File downloads and previews must also be authorized; any signed download URL must have short expiry.

The policy is deny-by-default:
- owner/admin: reads documents only within own tenant;
- manager: creates documents; reads own or specifically addressed documents;
- employee: reads only specifically addressed documents;
- designated recipient: can acknowledge or approve depending on document type;
- issuer or owner/admin: may revoke only pending documents;
- unknown roles, cross-tenant, suspended and invalid actors: denied.

**Important:** `documentReadScope()` returns only a safe *scope intention*. Implement actual SQL filtering with `organization_id` AND either tenant-wide access for owner/admin OR `creator_user_id = userId OR recipient_user_id = userId`. Do not treat it as complete query enforcement.

## What is NOT included

- No login, identity provider, session store, MFA or server process.
- No database, cloud hosting or deployment.
- No key management, encryption service, uploads, backups, push delivery, or audit persistence.
- No Russian ЭДО operator, electronic signature, certificate or МЧД integration.
- No legal-signature guarantee, regulatory certification, or protection against a compromised device.
- No changes to personal SEYVEO One files or to the existing single-device document demo.

## Next implementation milestone

Select an identity provider and backend stack; provision isolated development infrastructure; implement endpoints such as:
`POST /organizations/{orgId}/documents`,
`GET /organizations/{orgId}/documents/{docId}`,
`POST /organizations/{orgId}/documents/{docId}/actions`,
`GET /organizations/{orgId}/documents/{docId}/audit`.

Every backend endpoint must enforce auth and authorization before returning metadata, downloading files, or changing statuses. The browser demo localStorage must never serve as the authoritative source for a real company.
