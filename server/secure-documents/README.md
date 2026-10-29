# SEYVEO Secure Documents — isolated developer server

**Non-production only.** This Node.js 22+ loopback-only API demonstrates password sessions, tenant authorization and document transitions, with optional encrypted snapshot persistence. It remains a single-process training tool, not a production database or real secure service. It is **not** a secure production EDMS or certified ЭДО. No real personal, corporate or confidential documents should be used.

## Mobile sync: separate, experimental client logic

The new `mobile-sync-core.mjs` is a transport-independent event synchronizer
for future iOS/Android code; it does not connect a phone to the server.
It accepts a trusted identity provider, a secure request adapter, user-scoped
nonsecret cursor persistence and an idempotent event handler.

On a session change, revoked access, failed delivery, or invalid event, it
refuses to report a successful synchronization. Confidential document content
is never part of event notifications. Account secrets must be stored using
platform-secure storage, not by this module. The production transport must
use authenticated HTTPS and separate trusted user sessions.

Check local client logic with:

```sh
node --test server/secure-documents/mobile-sync-core.test.mjs
```

Do **not** expose the loopback developer server to the internet to test two
phones. Real-device tests require a separately secured backend and identity.

Sync safety note: a 401 or 403 permanently stops the current development sync instance. A missing or invalid cursor now causes retry rather than silent reset to zero; a new account must explicitly initialize its own cursor. Identity is checked again before transport to avoid requests with the previous account token.

## HTTPS-only document sync adapter — **not yet connected to phones**

`https-event-transport.mjs` adds a strict transport adapter around the existing event
cursor synchronizer. An explicitly configured **canonical HTTPS origin** is required;
plain HTTP, loopback development servers, embedded credentials, extra URL paths,
unexpected API routes and redirects are rejected. Authorized requests use bearer
tokens and `redirect: 'manual'`, `credentials: 'omit'`, `cache: 'no-store'`,
with bounded JSON event responses. The adapter suppresses raw remote error
messages so URL/token strings are not included in error logs. HTTP 401/403 is
passed to the existing synchronization logic to stop a revoked session.

Example **purely conceptual** integration (the hostname is deliberately fake;
nothing is listening there and no phone makes a request in these tests):

```js
import { createHttpsDocumentUpdateSync } from './https-event-transport.mjs';
const sync = createHttpsDocumentUpdateSync({
  apiOrigin: 'https://documents.seyveo.example',
  getIdentity: trustedNativeSessionProvider,
  readCursor: readAccountScopedCursor,
  writeCursor: saveAccountScopedCursor,
  onEvent: handleIdempotentDocumentEvent,
  onAccessLost: clearSessionAndRequireLogin
});
await sync.poll();
```

The example functions above are integration contracts, **not** implemented
production identity/storage services. This is a **JavaScript policy module only**:
the actual iOS/Android native HTTP implementation must separately prove it
honors `redirect:'manual'`, verifies system TLS certificates, prevents any token
forwarding on redirects, and stores credentials in platform-secure storage. Native
mobile integration, trustworthy staff onboarding, a secured public backend,
push notifications, and end-to-end two-phone delivery remain **unimplemented**.
Do not configure this adapter to reach the isolated HTTP development API or
process real documents.

Test using synthetic responses without contacting any external host:

```sh
node --test server/secure-documents/https-event-transport.test.mjs
```

## Implemented

- Only two explicitly configured **test accounts**: owner (role: owner) and Elena (role: employee), in one fixed test organization `demo-org`. The server does NOT accept roles, organization membership, or user IDs from request headers as authentication.
- Passwords supplied via environment variables; scrypt-derived password hashes and random 30-minute bearer sessions kept **in memory**. Login attempts are throttled.
- The training API can list and revoke **the current account's own device-labelled login sessions**; labels are unverified text, not hardware attestation. It never accepts a device ID, user ID, role or organization from a login claim. It cannot manage other users' sessions, and all sessions vanish on server restart.
- Local API binds to **127.0.0.1**. CLI fails closed unless `SEYVEO_DEV_SERVER=1`, fails in `NODE_ENV=production`, and does not enable browser CORS. Browser `Origin` requests are rejected.
- Only small **text bodies** (up to 8000 characters). AES-256-GCM protects document text in memory. **Optional** AES-256-GCM encrypted snapshots can save training documents, metadata and audit history to a local private file. Without an explicit file path, all documents disappear on restart. Sessions always expire on restart. No production backups or multi-process concurrency.
- Each API route verifies session, current membership, tenant and per-document policy before returning data or changing a document status.
- Statuses distinguish reading, acknowledging, approving, returning and revoking; the **development** audit history is kept with the encrypted snapshot if enabled. This is not a trustworthy/legal audit trail and cannot detect rollback to an older valid snapshot.
- No connection to the existing GitHub Pages demo, SEYVEO One, external operators or real employees. The inbox/outbox endpoints operate between two local test sessions only.

## Experimental per-device sessions (same computer only)

Every successful `POST /v1/sessions` accepts optional `deviceLabel` (a short, display-only string, for example `"Elena Android — test"`) and returns a server-generated `session.id` along with the existing bearer token. The label **does not** prove the device's identity; do not use real names, phone information or passwords in test labels.

An authenticated caller can inspect **only their own** sessions with `GET /v1/sessions`. The response lists non-secret IDs, labels, created/expiry timestamps and `current`, but never bearer tokens. `DELETE /v1/sessions/:id` revokes one of the caller's own sessions, and `DELETE /v1/sessions/current` logs out the current session. Tokens revoked in this single Node process immediately fail authorization; other users' sessions cannot be listed or revoked by guessed IDs. Each account may have up to five concurrent test sessions; a fresh login is possible after one is removed or expires.

These sessions and test identities are **memory-only**. They reset when the local process restarts; there is no real device enrollment, strong identity provider, MFA, distributed revocation, or remote delivery. This API must never be exposed to an external network to test two phones. A separate HTTPS-backed production architecture and independent security review are required before remote devices, real staff accounts, or confidential documents.

Run the isolated regression test:
```sh
node --test server/secure-documents/device-sessions-http.test.mjs
```

## Tests

```bash
node --test server/document-authorization.test.mjs server/secure-documents/dev-server.test.mjs server/secure-documents/dev-store.test.mjs server/secure-documents/dev-restart.test.mjs server/secure-documents/sqlite-tenant-store.test.mjs server/secure-documents/sqlite-http.test.mjs
```

GitHub Actions workflow: `.github/workflows/seyveo-secure-documents.yml`. It runs the same two test files.

## Run locally (for developers)

Use random test passwords **not used anywhere else**. Never commit keys or passwords.

```bash
export SEYVEO_DEV_SERVER=1
export SEYVEO_DEV_OWNER_PASSWORD='choose-a-new-long-owner-test-password'
export SEYVEO_DEV_EMPLOYEE_PASSWORD='choose-a-different-long-employee-test-password'
export SEYVEO_DEV_MASTER_KEY_B64="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))")"
node server/secure-documents/dev-server.mjs
```

The process listens at `http://127.0.0.1:8787` by default. To use another local port set `SEYVEO_DEV_PORT` to 1024–65535. Both the CLI and the server factory now reject an unspecified/wildcard bind (such as `server.listen(8787)` or `0.0.0.0`) **before** opening a socket. Only explicit `127.0.0.1` or `::1` is allowed. This is a development safety barrier, **not** production network security or permission to connect phones.

### Optional tenant-aware SQLite mode (synthetic data only)

The loopback-only HTTP server can now use the SQLite experiment directly. This is opt-in and is independent from the older encrypted snapshot file. Set `SEYVEO_DEV_SQLITE_PATH` to an **absolute file path** within a private folder, for example:

```bash
mkdir -p /tmp/seyveo-demo-sqlite
chmod 700 /tmp/seyveo-demo-sqlite
export SEYVEO_DEV_SQLITE_PATH=/tmp/seyveo-demo-sqlite/documents.sqlite
# Set the same SEYVEO_DEV_SERVER, password and master-key variables as above.
node server/secure-documents/dev-server.mjs
```

On first startup, the server creates only the fictional `demo-org` with two example memberships: `owner` and `elena`. Later startups **do not reset existing memberships**. Revoked employees remain revoked; the owner can still log in. The HTTP routes are the same as in the in-memory mode. SQLite stores **only document title and body as AES-GCM ciphertext**; organization IDs, user IDs, roles, workflow statuses, and timestamps remain visible metadata. The training audit has an HMAC chain, not independently trusted or legally meaningful evidence.

Keep the **same secret 32-byte master key** for every restart. A wrong key causes startup failure. Do **not** set `SEYVEO_DEV_STORE_PATH` together with `SEYVEO_DEV_SQLITE_PATH`: two persistence modes at once are rejected. The local-only server rejects requests to a non-loopback interface.

The SQLite adapter and linked HTTP route have tests:

```bash
node --test server/secure-documents/sqlite-tenant-store.test.mjs server/secure-documents/sqlite-http.test.mjs
```

This database is still experimental (`node:sqlite`), local-only and lacks production authentication, secure transport, tenant-specific key management, backups and protected off-device delivery. **Never test with confidential documents.**

### Optional encrypted persistence (synthetic data only)

Create a private directory **outside your Git repository** (for example in `/tmp` on Linux/macOS) and set a fixed random key that you can retain securely across restarts. The environment variable `SEYVEO_DEV_STORE_PATH` must be an **absolute file path** in a private directory (0700), such as `/tmp/seyveo-demo-private/docs.enc` after creating that directory with mode 0700. The encrypted snapshot file uses mode 0600. Set this variable before launching:

```bash
mkdir -p /tmp/seyveo-demo-private
chmod 700 /tmp/seyveo-demo-private
export SEYVEO_DEV_STORE_PATH=/tmp/seyveo-demo-private/docs.enc
```

**Do not generate a new master key each time if you want to reopen saved documents.** Reuse the same `SEYVEO_DEV_MASTER_KEY_B64` value. If the key is wrong, file permissions are insecure, or the snapshot was altered, the server refuses to start rather than silently deleting data. Never commit or share keys, documents, or exported snapshots. This implementation encrypts each complete snapshot and writes it using an atomic rename; it is not an encrypted database, a backup system or a multi-node store.

Example developer requests (do not put tokens in shell history in real systems):

```bash
curl -sS http://127.0.0.1:8787/health
curl -sS -X POST http://127.0.0.1:8787/v1/sessions \
  -H 'Content-Type: application/json' \
  -d '{"login":"owner","password":"choose-a-new-long-owner-test-password"}'
```

The login response includes a temporary bearer token. Use `Authorization: Bearer <token>` for other routes.

### Persistent document events (SQLite development mode)

The SQLite backend now writes a minimal **per-recipient change event** in the
same database transaction as a new document or status update.
This is useful for a future phone client that needs to catch up after being
offline. It is **not** a push notification and cannot reach another device
while the server is bound to 127.0.0.1.

An authenticated client may call:

`GET /v1/organizations/demo-org/updates?after=0`

The response contains only `events` and `nextCursor`.
Each event includes an increasing numeric cursor, document ID, event kind
(`assigned` or `status_changed`), and timestamp. It contains **no document
title or body**. Use the authorized document endpoint for details.

The cursor is **per caller's visible stream**, not a credential and not a
document access grant. The server authenticates the session and verifies the
current membership and organization on every request. Clients should persist
the last processed cursor securely, advance it only after handling the
response, and resume from the same cursor after reconnection. Events are
fetched in ascending order (up to 50 per request); request again if a full
page is returned.

Events are saved in SQLite, not delivered via Apple Push Notification service
or Firebase Cloud Messaging. There is no hardened production transport,
application sign-in, device enrollment, or background processing yet.
Revoked employees lose access to the stream.

Check with synthetic data:

```sh
node --test server/secure-documents/document-updates.test.mjs server/secure-documents/document-updates-http.test.mjs
```

### Two-account inbox/outbox polling (local development)

The server now exposes separate, **authenticated and tenant-scoped** mailboxes for the fictional `owner` and `elena` accounts:

- `GET /v1/organizations/demo-org/inbox` — only documents addressed to the authenticated user.
- `GET /v1/organizations/demo-org/outbox` — only documents created by the authenticated user.

Responses contain `folder`, `documents`, `total`, and `pending` (documents in `sent` or `read` state). Each list entry includes a document ID, title, type, status, and timestamps **but never the body or authorization token**. The document body requires its separately authenticated detail endpoint. Completed/revoked documents stay in the lists as history, and `Cache-Control: no-store` prevents caching responses.

The server does not accept an employee ID or role in the URL to select another person's mailbox. Every request checks the current session, active membership, and company ID; the database layer independently enforces its own policy. When the employee acknowledges a document, the next director polling request sees the changed status.

**These are polling APIs, not mobile push notifications, nor production delivery between two phones.**

### Conditional inbox/outbox refresh

For a logged-in session, the first `GET /v1/organizations/demo-org/inbox`
(or `outbox`) returns **200** and an `ETag` response header, e.g.
`"svdm-..."`. Subsequent GETs can provide exactly that value in
`If-None-Match`:

- **304** (empty body) means the visible mailbox is unchanged for this
  authenticated user and folder.
- **200** with a new JSON body and tag means it changed: e.g. a new document
  arrived or an employee acknowledged it.
- **401/403/404** must be treated as authentication, authorization or routing
  failures, *never* as a successfully synchronized mailbox.

Revision tags are HMAC-based and include the authenticated user ID, tenant,
folder and the authorized mailbox projection. Tags contain no readable document
text. Browser and client responses are marked `Cache-Control: private, no-store`.
**A mobile client must keep its session credential in secure platform storage,
not browser localStorage, and must not log bearer tokens or document bodies.**
The demo currently uses a short-lived RAM token and does not implement a
production mobile client or push notifications.

Tests:
`node --test server/secure-documents/mailbox-tag.test.mjs server/secure-documents/mailbox-conditional-http.test.mjs`

 A future production client may poll conservatively while active and use OS push notifications with server-side authorization when backgrounded. No notification should contain confidential document text.

For regression coverage run:
```sh
node --test server/secure-documents/mailbox-view.test.mjs server/secure-documents/mailbox-http.test.mjs
```

Routes:

| Method | Path | Meaning |
| --- | --- | --- |
| GET | `/health` | Development status |
| POST | `/v1/sessions` | Test account login |
| DELETE | `/v1/sessions/current` | End current session |
| GET | `/v1/organizations` | Current membership |
| GET | `/v1/organizations/demo-org/inbox` | Only recipient's document metadata; count pending |
| GET | `/v1/organizations/demo-org/outbox` | Only creator's document metadata; count pending |
| GET | `/v1/organizations/demo-org/updates?after=0` | Authenticated event cursor for the current account (SQLite only) |
| GET / POST | `/v1/organizations/demo-org/documents` | List readable documents / create document (owner) |
| GET | `/v1/organizations/demo-org/documents/:id` | Read allowed document and decrypted text |
| GET | `/v1/organizations/demo-org/documents/:id/audit` | Read document activity |
| POST | `/v1/organizations/demo-org/documents/:id/actions` | `{"action":"read"}`, `acknowledge`, `approve`, `return`, or `revoke` |

Create example:

```json
{
  "recipientUserId": "elena",
  "type": "acknowledgement",
  "title": "Учебный приказ",
  "body": "Только учебное содержание. Никаких настоящих документов."
}
```

## CRITICAL — what is still missing

This code must **not** be deployed or exposed publicly. It has no production database, hardened identity provider, MFA, validated organization onboarding, secrets/KMS, key rotation, backups, distributed session revocation, durable tamper-evident audit, antivirus scanning, PDF/file uploads, retention policy, rate limiting across machines, transport TLS termination, or real document delivery. The optional encrypted file has no secure rollback protection and no concurrent-process locking. The in-memory activity history and role demo are **not evidence of a legal signature**.

For a real Russian product, design the data flow, local infrastructure, consent, personal-data compliance, cryptographic requirements and integration with licensed operators of ЭДО and appropriate electronic signatures with legal/security experts. Do not claim regulatory certification until obtained.

**Next**: choose a persistent database and a server-managed identity system, store validated memberships server-side, design durable encrypted object storage and atomic audited transactions, then implement a separate nonproduction deployment with independent security review.
