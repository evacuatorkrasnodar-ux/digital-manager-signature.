import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {validateStagingContent} from './validate-staging.mjs';

const secret=()=>randomBytes(40).toString('hex');
const makeConfig=(changes={})=>({
  SEYVEO_AUTH_HOST:'login.samplecompany.org',
  SEYVEO_ACME_EMAIL:'ops@samplecompany.org',
  SEYVEO_DB_PASSWORD:secret(),
  SEYVEO_BOOTSTRAP_ADMIN_USERNAME:'staging-operator',
  SEYVEO_BOOTSTRAP_ADMIN_PASSWORD:secret(),
  ...changes
});
const serialize=values=>Object.entries(values)
  .map(([key,value])=>key+'='+value).join('\n')+'\n';
const read=file=>readFile(new URL(file,import.meta.url),'utf8');

test('private HTTPS staging config accepts distinct generated credentials without disclosing them',()=>{
  const config=makeConfig();
  assert.deepEqual(validateStagingContent(serialize(config)),{
    status:'configuration-valid'
  });
  assert.equal(JSON.stringify(validateStagingContent(serialize(config)))
    .includes(config.SEYVEO_DB_PASSWORD),false);
});

test('example file cannot be used as a real deployment',async()=>{
  const example=await read('.env.example');
  assert.throws(()=>validateStagingContent(example),/Staging configuration rejected/);
});

test('never accept placeholder hosts, unsafe domains, forged email or weak secrets',()=>{
  const base=makeConfig();
  const invalid=[
    {SEYVEO_AUTH_HOST:'auth-staging.example.invalid'},
    {SEYVEO_AUTH_HOST:'localhost'},
    {SEYVEO_AUTH_HOST:'192.0.2.1'},
    {SEYVEO_AUTH_HOST:'attacker.invalid'},
    {SEYVEO_AUTH_HOST:'http://login.samplecompany.org'},
    {SEYVEO_AUTH_HOST:'login.samplecompany.org:8443'},
    {SEYVEO_AUTH_HOST:'login.samplecompany.org/path'},
    {SEYVEO_AUTH_HOST:'auth.example'},
    {SEYVEO_ACME_EMAIL:'ops@example.invalid'},
    {SEYVEO_ACME_EMAIL:'someone@localhost'},
    {SEYVEO_DB_PASSWORD:'password'},
    {SEYVEO_DB_PASSWORD:'A'.repeat(64)},
    {SEYVEO_DB_PASSWORD:'REPLACE_WITH_SECRET_LONG_ENOUGH_123456789'},
    {SEYVEO_BOOTSTRAP_ADMIN_PASSWORD:base.SEYVEO_DB_PASSWORD},
    {SEYVEO_BOOTSTRAP_ADMIN_PASSWORD:'too-short'},
    {SEYVEO_BOOTSTRAP_ADMIN_PASSWORD:'secret$HOME'+secret()}
  ];
  for(const values of invalid)
    assert.throws(()=>validateStagingContent(serialize({...base,...values})),
      /Staging configuration rejected/);
});

test('refuse duplicate keys, unknown entries, env injection and missing fields',()=>{
  const config=serialize(makeConfig());
  const injected='SEYVEO_AUTH_HOST='+'$'+'{HOST}';
  for(const payload of [
    config+'SEYVEO_AUTH_HOST=evil.example.com\n',
    config+'KC_HOSTNAME_STRICT=false\n',
    config.replace(/SEYVEO_ACME_EMAIL=[^\n]+\n/,''),
    config.replace(/SEYVEO_AUTH_HOST=[^\n]+/,injected),
    config.replace(/SEYVEO_AUTH_HOST=[^\n]+/,'SEYVEO_AUTH_HOST="login.samplecompany.org"'),
    config.replace(/SEYVEO_AUTH_HOST=[^\n]+/,'SEYVEO_AUTH_HOST=login.samplecompany.org#fake'),
    config+'X'.repeat(9000)
  ])assert.throws(()=>validateStagingContent(payload),/Staging configuration rejected/);
});

test('staging realm requires verified email and exact single native PKCE client; registration initially disabled',async()=>{
  const r=JSON.parse(await read('realm/seyveo-realm.json'));
  assert.equal(r.realm,'seyveo');
  assert.equal(r.enabled,true);
  assert.equal(r.registrationAllowed,false);
  assert.equal(r.verifyEmail,true);
  assert.equal(r.sslRequired,'all');
  assert.equal(r.bruteForceProtected,true);
  assert.equal(r.clients.length,1);
  const c=r.clients[0];
  assert.equal(c.clientId,'seyveo-native');
  assert.equal(c.publicClient,true);
  assert.equal(c.standardFlowEnabled,true);
  assert.equal(c.directAccessGrantsEnabled,false);
  assert.equal(c.implicitFlowEnabled,false);
  assert.equal(c.serviceAccountsEnabled,false);
  assert.equal(c.attributes['pkce.code.challenge.method'],'S256');
  assert.deepEqual(c.redirectUris,['com.seyveo.digitalmanager:/oauth2redirect']);
  assert.deepEqual(c.webOrigins,[]);
  assert.equal('users' in r,false);
  assert.equal('secret' in c,false);
});

test('HTTPS reverse proxy is only exposed port; backend and admin are not public',async()=>{
  const compose=await read('compose.yaml');
  const caddy=await read('Caddyfile');
  const gitignore=await read('.gitignore');
  assert.match(compose,/quay\.io\/keycloak\/keycloak:26\.8\.1/);
  assert.match(compose,/image: postgres:17/);
  assert.match(compose,/KC_HOSTNAME_STRICT: "true"/);
  assert.match(compose,/KC_HTTP_ENABLED: "true"/);
  assert.match(compose,/KC_PROXY_HEADERS: xforwarded/);
  assert.match(compose,/internal: true/);
  assert.match(compose,/POSTGRES_PASSWORD: \$\{SEYVEO_DB_PASSWORD:\?/);
  assert.match(compose,/KC_BOOTSTRAP_ADMIN_PASSWORD: \$\{SEYVEO_BOOTSTRAP_ADMIN_PASSWORD:\?/);
  assert.equal((compose.match(/^\s+ports:/gm)||[]).length,1);
  assert.match(compose,/"443:443"/);
  assert.match(compose,/--import-realm/);
  assert.match(caddy,/@private/);
  assert.match(caddy,/\/admin\/\*/);
  assert.match(caddy,/\/realms\/master\/\*/);
  assert.match(caddy,/\/health\/\*/);
  assert.match(caddy,/header_up X-Forwarded-Proto https/);
  assert.match(caddy,/header_up -Forwarded/);
  assert.match(gitignore,/^\.env$/m);
  assert.match(gitignore,/^secrets\/$/m);
});
