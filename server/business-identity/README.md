# SEYVEO account boundary · future iOS/Android backend

**Architecture, cryptographic reference adapter and policy tests — NOT a production identity service.** The boundary does not create accounts, send invitations, listen on HTTP(S), fetch personal
data, provide storage, run an OAuth login or OpenID Connect flow, or deploy
anything. Its separate offline JWT adapter verifies signed tokens against
preconfigured public keys and injected identity/revocation callbacks but does
not discover or operate a real provider. No real user data should be supplied.

## Изолированное SQLite-хранилище приглашений — тестовый backend

`sqlite-invitation-repository.mjs` добавляет долговременное хранение
приглашений в SQLite Node.js 22+. Это **не промышленная база пользователей**
и не работающий в интернете сервер; модуль получает соединение `db`
от доверенного backend. В нём нет OAuth-регистрации, персональных данных
SEYVEO One, UI, QR-камеры или публичного HTTPS listener.

Новая таблица `seyveo_employee_invites` хранит только `SHA256` секрета
приглашения, организацию, подтверждённый идентификатор получателя, логин,
время и состояние. **Сам одноразовый код не записывается в базу**. Уникальные
индексы запрещают повторную активную ссылку для одного получателя,
срок ограничен 15 минутами, максимум 20 активных приглашений на компанию.
После погашения, отмены либо истечения срока ссылка не возвращается в
состояние активной. Повторное использование не создаёт вторую запись.
SQLite содержит открытые метаданные; **шифрование всей базы в этом модуле
отсутствует**, поэтому нельзя использовать его с настоящими данными.

Создание и отмена принимают только сервером подтверждённого владельца
`actor:{userId,sessionId}`, извлечённого из криптографически проверенного
токена — не из тела запроса. До транзакции `identity-boundary` повторно
проверяет сессию. **В самой транзакции `BEGIN IMMEDIATE`** хранилище
повторно сверяет действующую сессию, членство `owner` в таблице
`memberships` и активный подтверждённый аккаунт приглашённого. Погашение
приглашения атомарно меняет статус кода и создаёт членство `employee`.
Если запись в `memberships` падает, весь переход откатывается.

Интеграция требует обязательных синхронных
`checkSessionInTx` и `checkRecipientInTx`, которые обращаются
к **тому же самому SQLite-соединению**, а не к кэшу и не к данным с телефона.
В тестах используются вымышленные `people`, `active_sessions` и
`memberships` в одной базе. **Эти таблицы тестов не являются настоящим
identity provider**; нельзя подменять реальную проверку токенов или
ревокацию записями, которые устанавливает пользователь. Для production
нужны настоящая связка с OIDC, надёжная транзакционная БД, криптографическая
защита секретов и резервирование, ограничения по попыткам, аудит,
распределённые блокировки, отзыв сессий и внешняя оценка безопасности.

Для передачи проверенных идентификаторов в атомарную транзакцию
`identity-boundary.mjs` теперь возвращает повторно проверенный
`identifyVerifiedPerson({token})`. Адаптер погашения получает также
подтверждённый `sessionId`, чтобы проверить его действительность
**непосредственно перед выдачей членства**. Никакие поля из QR не служат
доказательством роли.

Тест `sqlite-invitation-repository.test.mjs` проверяет реальные
файловые перезапуски SQLite, отмену, истечение срока, повторное погашение,
отзыв сеанса, недействительного владельца и откат транзакции.

```sh
node --test server/business-identity/sqlite-invitation-repository.test.mjs
```

## Owner invitation HTTP contract (server-side, no deployment)

`owner-invitation-http.mjs` introduces
`createOwnerInvitationHttpContract({identity,resolveVerifiedRecipient,
issueInvitationAtomic,revokeInvitationAtomic,now,apiOrigin})`. It is a
**Request → Response security boundary**, **not a running server**.
There is **no listening socket, TLS configuration, identity provider, real
account directory, database or deployment** included in this module.

### Future routes

- `POST /v1/organizations/{organizationId}/invitations`: authenticated
  **owner only**. Accept exactly `{"employeeLogin":"login"}`. Verify the
  current session/owner membership against server truth, resolve an
  **already verified, active personal account**, generate a random 32-byte
  one-use code, store only SHA256(code) through an atomic trusted adapter,
  recheck the owner, and return the exact `201` payload already consumed
  by `mobile/src/business/https-owner-invite-client.mjs`:
  `{"code":"...","invitation":{"id":"...","employeeLogin":"...","expiresAt":"..."}}`.
  **Maximum lifetime: 15 minutes**, no QR content for arbitrary roles.
- `DELETE /v1/organizations/{organizationId}/invitations/{invitationId}`:
  owner only; revoke through the same trusted database and return `200`.
- `POST /v1/invitations/accept`: requires the employee's separately
  **verified personal account token** and exactly `{"code":"..."}`. It
  delegates to `identity-boundary.mjs`'s `acceptVerifiedInvitation`:
  only the specifically assigned account can join, only as an employee,
  and only once with a transactional backend. A QR scan **never means
  authenticated or authorized**.

All routes are bound to a preconfigured exact HTTPS origin, reject
browser `Origin` headers, do not follow redirects, limit JSON bodies
while reading them, and use generic errors with `Cache-Control: no-store`
and `Referrer-Policy: no-referrer`. The server does not accept a claimed
client role, tenant change, redirect target, or username as proof.

**Important missing production trust:** The functions
`resolveVerifiedRecipient`, `issueInvitationAtomic` and
`revokeInvitationAtomic` must be implemented using a production-grade
identity directory and durable transactions. Inside each transaction,
the adapter MUST revalidate active owner membership/session, recipient
identity, tenant uniqueness, expiry, one-use consumption, revocation,
rate limits and invitation quotas. The adapter contracts are not a
substitute for that implementation. Current in-memory tests merely
simulate those invariants. Transport TLS, OIDC key rotation, abuse
monitoring, audit, real App Links and phone E2E tests remain unimplemented.

`owner-invitation-http.test.mjs` exercises a complete **synthetic,
in-process Request/Response round-trip** through the existing native
HTTPS invite client, QR link parser and recipient-bound acceptance.
These tests do **not** demonstrate production security or a remote API.

```sh
node --test server/business-identity/owner-invitation-http.test.mjs
```

## Experimental JWT access-token verifier (cryptographic policy, not login)

`verified-access-token.mjs` adds `createVerifiedJwtAccessSession(...)`, a
**Node.js 22+ offline development adapter** that cryptographically verifies a
signed **RFC 9068 OAuth access-token JWT**, then returns a verified
`userId/sessionId` for the existing business identity boundary.

Its deliberately narrow policy:
- Accept **only** signed RSA RS256 access tokens with explicit
  `typ: at+jwt` (or `application/at+jwt`). Do **not** accept OpenID Connect
  ID tokens (`typ: JWT`), unsigned tokens, symmetric MAC algorithms or an
  algorithm/key indicated by untrusted token claims.
- Use **explicitly configured** issuer, resource-server audience, authorized
  native `client_id`, and locally supplied, trusted RSA PUBLIC signing
  keys. Validate JWS signature, exact issuer/client, audience, issuance and
  expiry times, token ID, and the maximum one-hour token lifetime.
  Token-supplied `jku`, `jwk`, `x5u`, critical headers, or URLs are refused:
  the verifier never makes network key-discovery requests.
- Resolve the token's issuer-scoped subject through a trusted account directory
  with `resolvePerson`. A client-credentials/machine account cannot become
  a personal SEYVEO account just by having a valid signed token.
- Call `isRevoked` **on each verification**, requiring an explicit `false`
  for a known active session. Offline or failed status lookup **denies access**.
  Employer role and company ID in a JWT have **no authority**; business
  access still relies on fresh, server-side organization membership.
- Accept either an opaque trusted token or a JWT-shaped string in
  `identity-boundary.mjs`, but **always** send either through the configured
  trusted `verifySession` implementation. The token's appearance proves nothing.

The adapters `resolvePerson` and `isRevoked` are critical security
dependencies **not implemented here**. The signed-JWT module is a narrowly
scoped learning/reference implementation, **not a substitute for a reviewed
OAuth/OIDC library, key-management integration or a production session
service**. All tests use randomly generated test keys and synthetic identities.

A real backend must use provider-supported OAuth Authorization Code + PKCE
for native login, configured discovery and carefully managed JWKS rotation,
verified issuer, strict access-token audience, a reliable revoked-session
service, real person directory and complete signup/recovery and MFA policies.
Do not configure this module to send tokens to the loopback document server,
do not promote the test identity provider or bundled test keys, and never
treat passing tests as production security approval.

```sh
node --test server/business-identity/verified-access-token.test.mjs
```

The underlying recommendations are
[RFC 9068](https://www.rfc-editor.org/rfc/rfc9068) (access-token profile) and
[RFC 8725](https://www.rfc-editor.org/rfc/rfc8725) (JWT security best practices).

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
