# SEYVEO Secure Documents — isolated developer server

**Non-production only.** This is a small Node.js 22+ loopback-only API for developing authentication, tenant authorization, document transitions, and in-memory encrypted document contents. It is **not** a secure production EDMS or certified ЭДО. No real personal, corporate or confidential documents should be used.

## Implemented

- Only two explicitly configured **test accounts**: owner (role: owner) and Elena (role: employee), in one fixed test organization `demo-org`. The server does NOT accept roles, organization membership, or user IDs from request headers as authentication.
- Passwords supplied via environment variables; scrypt-derived password hashes and random 30-minute bearer sessions kept **in memory**. Login attempts are throttled.
- Local API binds to **127.0.0.1**. CLI fails closed unless `SEYVEO_DEV_SERVER=1`, fails in `NODE_ENV=production`, and does not enable browser CORS. Browser `Origin` requests are rejected.
- Only small **text bodies** (up to 8000 characters). AES-256-GCM ciphertext, IV and tag live **in RAM only** under a 32-byte development key supplied at startup. Documents and sessions disappear on restart; **no durable storage or backups**.
- Each API route verifies session, current membership, tenant and per-document policy before returning data or changing a document status.
- Statuses distinguish reading, acknowledging, approving, returning and revoking; an in-memory, untrusted audit history is attached to each document.
- No connection to the existing GitHub Pages demo, SEYVEO One, external operators or real employees.

## Tests

```bash
node --test server/document-authorization.test.mjs server/secure-documents/dev-server.test.mjs
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

The process listens at `http://127.0.0.1:8787` by default. To use another local port set `SEYVEO_DEV_PORT` to 1024–65535. The CLI does **not** bind to all interfaces.

Example developer requests (do not put tokens in shell history in real systems):

```bash
curl -sS http://127.0.0.1:8787/health
curl -sS -X POST http://127.0.0.1:8787/v1/sessions \
  -H 'Content-Type: application/json' \
  -d '{"login":"owner","password":"choose-a-new-long-owner-test-password"}'
```

The login response includes a temporary bearer token. Use `Authorization: Bearer <token>` for other routes.

Routes:

| Method | Path | Meaning |
| --- | --- | --- |
| GET | `/health` | Development status |
| POST | `/v1/sessions` | Test account login |
| DELETE | `/v1/sessions/current` | End current session |
| GET | `/v1/organizations` | Current membership |
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

This code must **not** be deployed or exposed publicly. It has no durable encrypted database, production identity provider, MFA, validated organization onboarding, secrets/KMS, key rotation, backups, distributed session revocation, durable tamper-evident audit, antivirus scanning, PDF/file uploads, retention policy, rate limiting across machines, transport TLS termination, or real document delivery. The in-memory activity history and role demo are **not evidence of a legal signature**.

For a real Russian product, design the data flow, local infrastructure, consent, personal-data compliance, cryptographic requirements and integration with licensed operators of ЭДО and appropriate electronic signatures with legal/security experts. Do not claim regulatory certification until obtained.

**Next**: choose a persistent database and a server-managed identity system, store validated memberships server-side, design durable encrypted object storage and atomic audited transactions, then implement a separate nonproduction deployment with independent security review.
