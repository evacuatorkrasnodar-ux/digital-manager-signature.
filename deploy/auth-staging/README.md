# SEYVEO · Keycloak authorization staging

**This is an unlaunched deployment blueprint, not a live sign-in service.**
No VPS, DNS changes, SMTP credentials, customer accounts, TLS certificates
or live login have been provisioned through this repository.

## Architecture and scope

`compose.yaml` defines **Keycloak 26.8.1**, a private PostgreSQL 17
database and a public **Caddy** reverse proxy that obtains HTTPS certificates
using ACME. Keycloak runs with `start` (NOT `start-dev`), a fixed
`KC_HOSTNAME=https://...`, `KC_HOSTNAME_STRICT=true`, and
`KC_PROXY_HEADERS=xforwarded`. Only Caddy exposes ports 80/443.
Neither database nor Keycloak nor its management port publishes any host
port. Caddy blocks public `/admin`, `/realms/master`, `/health`
and `/metrics` routes. The backend Keycloak HTTP port is reachable
only from the reverse proxy's Docker network; untrusted forwarded
headers are overwritten by Caddy.

The file `realm/seyveo-realm.json` installs a **public** OAuth client:
`seyveo-native` with exact registered
`com.seyveo.digitalmanager:/oauth2redirect` and PKCE S256, no client
secret, no implicit grant and no password grant. This matches the native
iPhone X / Android browser integration. It requires separate token
verification and credential storage to make real sign-in possible.

**Registration starts disabled.** `verifyEmail=true` but SMTP has not been
configured. Do **not** enable public user registration until a real SMTP
provider, successful verification-email delivery and recovery flow are
confirmed. The already working SEYVEO business mailbox is **not**
automatically a Keycloak SMTP sender.

## Server-owner deployment steps (NOT executed by ChatGPT)

1. Provision an isolated, patched Linux VPS with enough RAM and storage
   for at least a 2 GB Keycloak allocation, plus DB and proxy. Choose
   jurisdiction/data-processing and backup policies before accepting
   personal information. Restrict SSH to approved keys/IPs; enable
   updates and firewall rules, allowing inbound TCP 80/443 only.
   **Do not** deploy on a personal phone or expose the existing
   loopback-only Secure Documents training server.
2. Register a **new auth subdomain** controlled by SEYVEO and point its
   DNS A/AAAA records at the VPS. Set up an actual email address for ACME
   notifications. Use only a subdomain you control, not the example
   placeholder and not an unrelated provider.
3. In `deploy/auth-staging`, create a private `.env` from
   `.env.example`; replace all values with your owned hostname, ACME email,
   and **two different CSPRNG-generated secrets** (at least 40 characters).
   Generate each locally with Node.js:
   `node -e "console.log(require('node:crypto').randomBytes(40).toString('hex'))"`.
   Protect the file (`chmod 600 .env` on Linux); **never** send its
   contents to chat, commit it, place it in GitHub Actions or print Docker
   configuration containing secrets.
4. Validate **before** running Docker:

   ```sh
   node validate-staging.mjs .env
   docker compose --env-file .env -f compose.yaml config --quiet
   ```

   The preflight rejects placeholder DNS, duplicate passwords, weak
   secrets, extra configuration keys and obvious injection. The source
   code test suite checks no admin/database ports leak through Compose.
   It is NOT a security audit or actual DNS/TLS verification.
5. After reviewing the configuration and securely storing off-host
   backups, the server operator may launch staging explicitly:

   ```sh
   docker compose --env-file .env -f compose.yaml up -d
   docker compose --env-file .env -f compose.yaml ps
   ```

   The public OIDC discovery endpoint should then become available at
   `https://YOUR-AUTH-HOST/realms/seyveo/.well-known/openid-configuration`.
   Check that `issuer` exactly matches the deployed URL, that
   `authorization_response_iss_parameter_supported` is `true` (RFC 9207),
   and that code authorization and PKCE S256 are supported. **Do not
   weaken native callback checks** if the live issuer fails the test.
6. Administration is **intentionally blocked from public HTTPS**.
   Perform first-time configuration only over an operator-controlled
   private management channel / SSH tunnel or Keycloak's administrative
   CLI inside the container. Never open the admin console or master realm
   to the internet to make setup easier. Create a permanent personal
   admin protected by MFA, disable/remove the temporary bootstrap account,
   and rotate bootstrap secrets.
7. Configure SMTP in **Realm settings → Email** through that private
   administrative channel. Check sender address, transport encryption,
   correct SMTP credentials, SPF/DKIM/DMARC, and the real deliverability of
   verification and password-reset messages. Only *after* this succeeds,
   explicitly enable user registration in the active realm and test email
   verification + account recovery using non-real synthetic test users.
   Importing the realm a second time **does not overwrite** an existing
   realm: change settings through protected administration.
8. Before using a production-like mobile app, verify Keycloak's actual
   OAuth access JWT format against the SEYVEO resource server. Our
   verifier demands **RFC 9068** signed RS256 `typ=at+jwt`,
   proper `client_id` and `aud`. Regular ID tokens are not acceptable
   as resource-server access tokens. A live Keycloak configuration may
   require dedicated mappers/token-profile setup or another reviewed
   token-verification design. The native code exchange also needs a
   trusted *cryptographic* ID-token verifier, SecureStore session adapter,
   refresh/revocation policies and real phone testing.
9. Add monitoring, request throttling, audited secret handling, SMTP
   abuse protection, encrypted and tested offsite DB backups, restore
   exercises, host firewall, OS patches, private-network isolation and
   service upgrades before considering real users.

## Limits / security notes

- **No production deployment, live users, active public URLs or email
  sending happened as part of this PR.** Public host and SMTP are not
  provisioned. The sample `.env.example` is intentionally nonfunctional.
- The standalone Compose setup uses environment variables for the DB and
  bootstrap admin passwords. Docker administrators can inspect those
  variables. That is **staging-only**: production must integrate a secure
  secret manager/keystore and rotated credentials. PostgreSQL files are
  not transparently encrypted by this Compose blueprint. Offsite encrypted
  backups and security review are needed.
- Docker image tags `postgres:17` and `caddy:2` receive new patch
  releases; for production pin reviewed image digests and patch regularly.
  Keycloak's exact image version must also be reviewed before each update.
- TLS is terminated at Caddy, with internal HTTP over a private
  same-host Docker network. Production high-availability deployments
  should evaluate end-to-end re-encrypted TLS between proxy and Keycloak,
  per Keycloak's reverse-proxy recommendations.
- The Caddyfile intentionally disables the public admin UI, so **SMTP
  and registration cannot be switched on using the public site**.
- iPhone X uses a private-use reverse-domain callback. Other apps may
  claim private-use schemes, hence PKCE and strict callback checks remain
  mandatory. A real installed IPA/APK validation is still required.
- Working in Russia and internationally cannot be assumed from a
  Compose deployment; verify actual reachability, local regulations and
  independent fallback availability without bypassing restrictions.

## Maintainer tests

```sh
node --test staging-config.test.mjs
```

Useful official references:

- [Keycloak containers](https://www.keycloak.org/server/containers)
- [Keycloak hostname and proxy headers](https://www.keycloak.org/server/hostname)
- [Keycloak reverse proxy](https://www.keycloak.org/server/reverseproxy)
- [Keycloak realm import](https://www.keycloak.org/server/importExport)
- [Keycloak SMTP setup](https://www.keycloak.org/docs/latest/server_admin/)
- [RFC 8252: native OAuth apps](https://www.rfc-editor.org/rfc/rfc8252)
- [RFC 9207: authorization response issuer](https://www.rfc-editor.org/rfc/rfc9207)
