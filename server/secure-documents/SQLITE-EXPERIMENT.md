# SEYVEO Secure Documents — relational database experiment

**Status: isolated developer module, not deployed.** Does not change the mobile UI or the original local document demo.

## Added

- `sqlite-tenant-store.mjs`: local SQLite store using Node.js 22 `node:sqlite` (experimental interface).
- `sqlite-tenant-store.test.mjs`: automated tests for two organizations, managers/recipients, revoked memberships, document state changes, persistence, wrong-key failure and audit tampering.

### Data model

`organizations` → `memberships` (organization + user + role + status) → `documents` (organization, creator, recipient, status, encrypted title/body) → `document_audit`.

The database enforces foreign keys including **composite organization + user** references, so a document cannot point to a recipient from another organization.

Every store query additionally filters by organization. A member can only read documents they created or were assigned unless their current role is owner/admin. The server's existing `document-authorization.mjs` policy is reused. The store never treats a client-supplied role as a trusted credential.

### Encryption and integrity

- The **document title and body** are encrypted with AES-256-GCM before writing to SQLite. The document and organization IDs are authenticated as additional data.
- The development master key is required to reopen the database. A key verifier rejects an incorrect key.
- Audit events are chained with HMAC-SHA256 and verified when read. **This detects edits to recorded events, but NOT deletion or rollback of an entire database to a previously valid copy**.
- Database indexes, user IDs, organization IDs, membership roles, timestamps and document workflow states remain **plaintext metadata** in SQLite. SQLite is NOT encrypted wholesale.

### Local testing

```sh
node --test server/secure-documents/sqlite-tenant-store.test.mjs
```

All repository secure-document tests:

```sh
node --test server/document-authorization.test.mjs server/secure-documents/*.test.mjs
```

The SQLite binding is experimental in Node.js 22. Tests use **synthetic data only** and a private temporary directory. The module requires an absolute path, a private (0700) directory on POSIX, a private database (0600), and a 32-byte key. It refuses production mode. For development integration, a trusted server component must supply a verified `actor`; the store does **not** authenticate people itself.

### What is NOT implemented

This is **not a production EDMS backend**. The SQLite adapter is now optionally connected to the loopback-only developer HTTP server via `SEYVEO_DEV_SQLITE_PATH`, but it is **not connected to the iOS/Android application or GitHub Pages demo**. There is no server-managed identity provider, MFA, TLS remote deployment, enterprise key management, database-wide encryption, secured backups, tenant-specific keys, key rotation, multi-process locking, real delivery between devices, remote revocation notifications, regulator compliance, electronic signatures or legal evidentiary audit.

`bootstrapOrganization` and `addMember` are privileged **development-only APIs**; they must never be routed directly to untrusted clients. Only trusted server-side administration should provision or change memberships.

**Next meaningful step:** confirm full loopback HTTP tests in CI, harden the server identity, tenant and audit model, choose production-grade identity and encrypted database infrastructure, and complete a formal threat model before exposing any remote access.
