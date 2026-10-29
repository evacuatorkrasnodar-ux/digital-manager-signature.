## Приглашение сотрудника по QR — безопасный контракт, не готовый экран

В `src/auth/employee-qr-invite.mjs` добавлены создание URI-полезной
нагрузки для будущего QR-кода и строгая проверка отсканированного адреса.
Это **не** генератор картинки QR, не QR-камера и не реальная регистрация.
В приложении пока нет действующих корпоративных приглашений на телефоны.

Запланированный сценарий SEYVEO Business:

1. Руководитель в «Пульте управления» нажимает **«Пригласить сотрудника»**.
   Защищённый сервер проверяет его права и создаёт **персональное**
   одноразовое приглашение на конкретный подтверждённый аккаунт сотрудника
   с коротким сроком действия (например, 15 минут).
2. У сервера получается непредсказуемый 256-битный одноразовый код.
   Будущий QR отображает зарегистрированную HTTPS-ссылку вида
   `https://join.seyveo.example/join/employee/<code>`.
   Домен `.example` — только тестовая иллюстрация, он **не действует**.
   **Нельзя** размещать имя, email, документы, ИНН, пароль, роли или токен
   пользовательской сессии непосредственно в QR.
3. Сотрудник сканирует его системной камерой или внутри SEYVEO.
   Установленное iOS/Android-приложение должно получать ссылку через
   **проверенный Universal Link / Android App Link**, а при отсутствии
   приложения человек видит безопасную страницу установки. Для реальных
   ссылок потребуются домен и проверка привязки приложений.
4. Сотрудник входит в **свой личный** аккаунт или создаёт его через
   реальную систему авторизации. Приложение показывает компанию и
   запрошенную рабочую роль **из ответа доверенного сервера** и просит
   подтвердить вступление.
5. Сервер проверяет соответствие подтверждённого аккаунта адресату
   приглашения, срок, отзыв и одноразовость в транзакции. После этого
   выдаётся доступ только к рабочему пространству. QR **сам по себе
   не даёт прав**; скриншот кода тоже не должен давать доступ постороннему.
   Руководитель может отозвать приглашение или рабочее членство.

Индивидуальная ссылка — **чувствительный секрет**, даже при привязке
адресата. Нельзя логировать целую ссылку, передавать её в аналитику,
отправлять в небезопасные push-уведомления или делать бессрочной.
Нужны `Referrer-Policy: no-referrer`, `Cache-Control: no-store`,
ограничение повторных попыток, безопасные fallback-страницы без сторонних
скриптов и серверные проверки, а не только валидация в приложении.

Личные музыка, заметки, здоровье и SEYVEO One остаются доступными человеку
в его собственном пространстве, но **никогда** не становятся видимы
руководителю, в том числе после увольнения.

```sh
cd mobile
node --test tests/employee-qr-invite.test.mjs
```

Это тесты безопасного **формата ссылки и политики погашения**, а не
тест настоящего QR-сканера, установленной связи с сервером или проверки
телефонов. Для производства потребуются сервер-поставщик приглашений,
верифицированная личность, генерация изображения QR, нативный Deep Link
обработчик, экран подтверждения и проверка на реальных iPhone/Android.

## OAuth token exchange contract — no live credentials

`src/auth/native-code-exchange.mjs` now describes the **next step after**
`native-pkce-core.mjs` accepts the one-time callback. It is an isolated
dependency-injected contract, **not a live login or an installed provider SDK**.

A trusted native transport must send an HTTPS POST with
`grant_type=authorization_code`, the returned one-use authorization code,
the **exact registered redirect**, public `client_id`, and the private PKCE
`code_verifier`. There is no client secret in the app. The adapter requests
`redirect:'manual'`, `credentials:'omit'`, `cache:'no-store'`,
checks endpoint origin and response content/type/size, refuses redirects,
returns no raw network errors, and exchanges a grant at most once.

Before any credentials can be saved, an externally supplied
`verifyIdToken` callback **must cryptographically verify** the OIDC
ID-token signature and key, issuer, audience, validity/expiration, and nonce.
The contract **also checks** the returned verified claims against the
expected issuer, native client ID and one-time nonce. A valid access-token
response without a verified ID token **cannot authenticate a person**.

`saveVerifiedSession` is deliberately unimplemented: a future mobile
integration must use platform-secure storage with OS-specific lifecycle and
logout handling. The adapter only returns `{status:'stored'}` after that
trusted callback reports success; it never returns tokens for display or
logs. Synthetic integration tests use fake credentials and callbacks;
**they do not test cryptographic ID-token verification, real certificates,
secure device storage, or actual HTTP redirects on iOS/Android**.

```sh
cd mobile
node --test tests/native-code-exchange.test.mjs
```

Required before real phone sign-in: choose and configure a supported OIDC
provider, register a public native OAuth client, set up HTTPS
Universal/Verified App Links and domain association, integrate a vetted
system-browser authentication library and OIDC/JWKS verifier, confirm native
transport redirects cannot forward secrets, implement secure token storage
and revocation/refresh rotation, and complete on-device acceptance testing.
OAuth sign-in and backend tenant authorization are **different checks**;
a successful login cannot make an employee a company owner.

Standards: [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700) and
[Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/).

## SEYVEO native identity · OAuth authorization-code + PKCE (contract only)

This directory now contains a **provider-independent, tested authorization
preflight** under `src/auth/`, not a login UI or a real authenticated user
session. There are **no configured identity-provider keys, tenant accounts,
domain-based App Links, OAuth client registrations or real tokens**.

- `native-pkce-core.mjs` holds a single short-lived authorization attempt,
  generates a fresh 32-byte state, PKCE verifier and OpenID nonce with an
  injected cryptographic RNG, and computes the S256 challenge. The browser
  URL requests `response_type=code` only; no implicit token response and no
  client secret. A new attempt cancels the old one.
- Callback parsing requires the **exact configured app-claimed HTTPS callback
  URL**, matching state and the expected authorization-server issuer
  (`iss`, per RFC 9207), exactly one authorization code, no fragments,
  token parameters, duplicate parameters, or unrecognized fields. Matching
  callbacks are consumed once and expire after five minutes. The code and
  verifier are released **only to trusted native exchange code**, never as
  a proof of successful login.
- `nativePkceEntropy.ts` supplies native entropy and SHA-256 via the already
  installed `expo-crypto` package. It does not launch a browser, exchange
  codes, persist session tokens or contact a network service.
- `tests/native-pkce-core.test.mjs` uses synthetic OAuth responses and Node
  CSPRNG/hash implementations. It does **not** confirm real browser redirects
  or Android/iOS App Link entitlements.

Before enabling login, select a supported identity provider and register a
**public native OAuth client** with exact iOS Universal Link and Android
verified App Link redirect; prove the domain association files and app signing
keys on real devices. The chosen provider must support the authorization-code
flow with PKCE S256, OpenID identity validation, and an issuer identification
response. Use Expo AuthSession / a reviewed provider SDK to launch the
**system authentication browser** (never an embedded WebView). A reviewed
native adapter must POST the one-use code and verifier to the configured HTTPS
token endpoint, validate ID token/nonce and access-token issuer/audience,
securely store credentials in native device storage, and handle logout,
refresh token rotation, revocation, errors and offline login states. The
SEYVEO Business backend must continue verifying access tokens and current
organization membership independently; employers never gain personal
SEYVEO One access.

```sh
node --test tests/native-pkce-core.test.mjs
```

References: [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252),
[RFC 9700](https://www.rfc-editor.org/rfc/rfc9700),
[Expo SDK 58 Crypto](https://docs.expo.dev/versions/v58.0.0/sdk/crypto/),
[Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/).

**Not production:** no phone can sign in using these sources yet. Do not use
real passwords, user accounts or confidential documents in the current demo.


# SEYVEO Mobile · M1 (настоящий iOS / Android)

**20.10.2026 — первая изолированная нативная основа, без изменения утверждённой Главной, плазмы и дока.**

Этот каталог — старт отдельного мобильного приложения, **не обёртка PWA**. Экран `App.tsx` — только временная диагностика защищённого Personal Core, **не финальный дизайн Главной SEYVEO**. Используем React Native 0.88 / Expo SDK 58, TypeScript, нативный SQLCipher и системное хранилище ключей.

## CI и самостоятельная Android-сборка · 20.10.2026

Создан GitHub Actions workflow: [SEYVEO Mobile · Native Foundation](https://github.com/evacuatorkrasnodar-ux/digital-manager-signature./actions/workflows/mobile-native.yml). При изменениях `mobile/**` он должен запускать **реальные** Node-тесты, TypeScript-проверку и сборку JS для Android/iOS. Статус проверять на странице Actions: один только коммит **не доказывает**, что тесты GitHub уже завершились.

**Чтобы собрать Android APK вручную** (отдельная вычислительно тяжёлая операция):

1. Открыть ссылку на workflow → **Run workflow** → ветка `main` → **Run workflow**.
2. После успешного задания **Native configuration, types and bundles** должна начаться задача **Android native debug APK (manual run only)**.
3. При успешном выполнении перейти в нужный запуск Actions → **Artifacts** → скачать `seyveo-mobile-m1-android-debug`.
4. Это **DEBUG-сборка для разработчика, не готовое приложение для клиентов**; для проверки интерфейса она может потребовать запущенный Metro (`npm start`) в той же сети. APK не содержит пользовательских записей, логинов, моделей и полноценного экрана Фили.
5. Ручной тест на реальном Android обязателен: запустить, выбрать «Создать хранилище», убедиться, что показывается «Зашифрованная база проверена», полностью закрыть и открыть приложение, подтвердить тот же результат. Принудительная недоступность SQLCipher должна приводить к сообщению «Защита не подтверждена». Никогда не переносить настоящие секреты до проверки восстановления.

Сборка iOS **не** следует автоматически за Android: `expo export --platform ios` проверяет лишь JavaScript-пакет, **не нативную сборку .ipa**. Для iPhone потребуется macOS/Xcode либо отдельная EAS сборка и собственная приёмка. В этом репозитории не надо обещать поддержку каждой версии iOS до проверки минимального deployment target.

**Защита данных для M1:** `android.allowBackup=false` отключает системный Android Auto Backup до внедрения действительно зашифрованного Cloud Bridge. Проверка хранилища теперь использует внутреннюю метку схемы. Если оригинальная база или её ключ утрачены, приложение **отказывается показывать «готово»** и не подменяет пустой файл прежними данными. Отсутствие ключа при первом запуске после удаления приложения — отдельный случай; восстановление ключей и резервных копий ещё в планах.

### Двухэтапная инициализация базы

Ключ генерируется однажды; метаданные сначала имеют состояние `provisioning`. Приложение проверяет наличие SQLCipher, создаёт только технический маркер и **только после его проверки** переводит статус в `ready`. При прерывании между этими шагами можно продолжить настройку **с тем же ключом**, не создавая вторую базу. Если готовая база исчезла, новый пустой файл **не** выдаётся за старое хранилище. Проверено восемью моделируемыми сценариями, но нативная криптография ещё не сертифицирована.

## Что уже сохранено в GitHub

- `App.tsx`: проверяет статус и предлагает вручную инициализировать новую локальную базу данных. **Никакого реального переноса пользовательских данных или скрытого облачного доступа нет.**
- `src/core/secureVault.ts`: генерация уникальной случайной 256-битной парольной строки для SQLCipher, хранение в SecureStore, уникальное имя файла, `PRAGMA key` **до любых SQL-запросов**, проверка `cipher_version` и `quick_check`. Если SQLCipher недоступен или возникает ошибка, интерфейс показывает **«Защита не подтверждена»**, а не хранит сведения в обычном SQLite.
- `app.json`: нативные идентификаторы iOS/Android; плагин `expo-sqlite` включает `useSQLCipher: true`, конфигурация `expo-secure-store`. Облачные копии **выключены**.
- `tests/foundation-config.test.mjs`: пять статических и восемь моделируемых сценариев защиты конфигурации и защитных условий. Это **не** испытание реальной криптографии или ОС.

**Ограничения M1:** экран не содержит личных данных и не даёт сохранить заметки; база пока содержит только техническую таблицу `vault_meta`. Отдельная процедура восстановления ключа после потери телефона ещё не реализована, поэтому **не использовать текущий прототип для настоящих секретов и документов**. Отсутствие SecureStore-ключа не является доказательством отсутствия прежней базы: новый файл получает случайное независимое имя. Зашифрованные базы невозможно восстановить без соответствующего ключа.

## Запуск на Windows — Android

Нужны Node.js **22.13+**, npm, Android Studio/SDK и устройство или эмулятор с включённой отладкой.

```powershell
cd mobile
npm install
npx expo install --fix
npx expo-doctor
npm run check
npm test
npx expo run:android
```

После первой нативной сборки:

```powershell
npm start
```

> **ВАЖНО:** SQLCipher **не работает в Expo Go**. Для проверки обязателен собственный нативный development build, именно с `useSQLCipher: true`. `expo install --fix` приведёт версии пакетов к совместимой версии SDK, а изменения надо фиксировать в lockfile. Не принимать успешную проверку одного `npm test` за проверку реального шифрования.

## iOS

Для локальной компиляции iOS необходимы macOS и Xcode. На Windows можно собирать iOS **через EAS Build** при настроенном проекте, разрешениях и необходимых учётных записях Apple/Expo:

```powershell
npx eas-cli@latest build --platform ios --profile development
```

Наличие исходников не означает, что .ipa уже собран или прошёл ревью Apple. **На iPhone X** требуется отдельная проверка установленной версии iOS и поведения фоновых процессов.

## Следующая техническая работа

1. Подтвердить настоящий старт приложения и `SQLCipher cipher_version` в Android development build; затем повторить на iPhone.
2. Сделать корректные миграции схемы, безопасный экспорт с ключом восстановления и модульные тесты на **реальной** базе SQLCipher.
3. Перенести Календарь и Блокнот в Personal Core с отдельной проверкой прав и без копирования `localStorage` напрямую.
4. Подключить Smart Clean: временные данные сразу, глубокая оптимизация при зарядке, **никогда** не трогать оригиналы/журнал.
5. Добавить добровольный Cloud Bridge после подтверждённого локального шифрования и тестового восстановления.
6. Воссоздать утверждённые Главную, сферу, док и Black Velvet как полноценные нативные компоненты, без веб-обёртки.

Архитектура и критерии безопасности: [SEYVEO-MOBILE-PERSONAL-CORE.md](../docs/SEYVEO-MOBILE-PERSONAL-CORE.md). Прежний веб-прототип остаётся в корневых `index.html` и `assets/` без изменений.

Официальные источники: https://docs.expo.dev/versions/v58.0.0/ , https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/ , https://docs.expo.dev/versions/v58.0.0/sdk/securestore/
