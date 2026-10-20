import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

// Pure protocol examination with simulated Expo device services.
// It is NOT a real native SQLCipher or Keychain/Keystore test.
async function fixture({ cipherAvailable = true, secureStoreWritable = true } = {}) {
  const secureValues = new Map();
  const databases = new Map();
  const commands = [];
  let counter = 0;
  let opened = 0;

  const Crypto = {
    async getRandomBytesAsync(length) {
      counter++;
      return Uint8Array.from({ length }, (_, i) => (i + 47 * counter) % 256);
    }
  };
  const SecureStore = {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'afterFirstUnlockThisDeviceOnly',
    async getItemAsync(key) { return secureValues.get(key) ?? null; },
    async setItemAsync(key, value) {
      if (!secureStoreWritable) throw Error('SecureStore write failed');
      secureValues.set(key, value);
    }
  };
  const SQLite = {
    async openDatabaseAsync(filename) {
      opened++;
      if (!databases.has(filename)) databases.set(filename, { created: false, marker: null, key: null });
      const file = databases.get(filename);
      let currentKey = null;
      return {
        async execAsync(sql) {
          commands.push(sql.startsWith('PRAGMA key') ? 'PRAGMA key [redacted]' : sql);
          if (sql.startsWith('PRAGMA key')) {
            const m = sql.match(/^PRAGMA key = '([a-f0-9]{64})';$/);
            if (!m) throw Error('Invalid database key');
            currentKey = m[1];
          } else if (sql.startsWith('CREATE TABLE vault_meta')) {
            if (!cipherAvailable) throw Error('Cannot provision without cipher');
            if (file.created) throw Error('Duplicate schema');
            file.created = true;
            file.key = currentKey;
          }
        },
        async getFirstAsync(query) {
          if (query === 'PRAGMA cipher_version')
            return cipherAvailable ? { cipher_version: '4.6.1' } : null;
          if (query === 'PRAGMA quick_check') {
            if (file.key && file.key !== currentKey) throw Error('Wrong key');
            return { quick_check: 'ok' };
          }
          if (query.startsWith('SELECT value FROM vault_meta')) {
            if (!file.created) throw Error('Schema absent');
            if (file.key !== currentKey) throw Error('Wrong key');
            return file.marker ? { value: file.marker } : null;
          }
          throw Error('Unrecognized read in fixture');
        },
        async runAsync(query, id, value) {
          if (query !== 'INSERT INTO vault_meta (id, value) VALUES (?, ?)' || id !== 'schema')
            throw Error('Unexpected insert');
          if (file.key !== currentKey) throw Error('Wrong key');
          file.marker = value;
        },
        async closeAsync() {}
      };
    }
  };
  const source = await readFile(new URL('../src/core/secureVault.ts', import.meta.url), 'utf8');
  const stripped = stripTypeScriptTypes(source)
    .replace(/^import\s+.*;\s*$/gm, '')
    .replace(/^export\s+(?=async function|function|const)/gm, '');
  const factories = new Function('Crypto','SecureStore','SQLite',
    stripped + '\nreturn {inspectVault,initializeVault};');
  const api = factories(Crypto, SecureStore, SQLite);
  return { ...api, secureValues, databases, commands, get opened() { return opened; } };
}

test('new vault requires explicit provisioning and persists encrypted marker', async () => {
  const d = await fixture();
  assert.equal(await d.inspectVault(), 'needs-setup');
  assert.equal(d.opened, 0);
  assert.equal(await d.initializeVault(), 'ready');
  assert.equal(await d.inspectVault(), 'ready');
  assert.equal(d.databases.size, 1);
  const identity = JSON.parse(d.secureValues.get('seyveo.personal.vault.v1'));
  assert.match(identity.database, /^seyveo-[a-f0-9]{32}\.db$/);
  assert.match(identity.hexKey, /^[a-f0-9]{64}$/);
  assert.equal(d.databases.get(identity.database).marker, '1');
  assert.equal(d.commands[0], 'PRAGMA key [redacted]');
  assert.equal(d.commands.includes('PRAGMA quick_check'), true);
});

test('device missing its original encrypted database NEVER reports ready or recreates marker', async () => {
  const d = await fixture();
  assert.equal(await d.initializeVault(), 'ready');
  const identity = JSON.parse(d.secureValues.get('seyveo.personal.vault.v1'));
  d.databases.delete(identity.database);
  assert.equal(await d.inspectVault(), 'unavailable');
  assert.equal(await d.initializeVault(), 'unavailable');
  assert.equal(d.databases.get(identity.database).marker, null);
});

test('an unencrypted SQLite build is rejected before provisioning personal data', async () => {
  const d = await fixture({ cipherAvailable: false });
  assert.equal(await d.initializeVault(), 'unavailable');
  assert.equal(await d.inspectVault(), 'unavailable');
  assert.ok([...d.databases.values()].every(x => !x.created));
});

test('a corrupted SecureStore identity never becomes a fresh vault', async () => {
  const d = await fixture();
  d.secureValues.set('seyveo.personal.vault.v1', '{bad json');
  assert.equal(await d.inspectVault(), 'unavailable');
  assert.equal(await d.initializeVault(), 'unavailable');
  assert.equal(d.opened, 0);
});

test('a rejected SecureStore write prevents new database creation', async () => {
  const d = await fixture({ secureStoreWritable: false });
  assert.equal(await d.initializeVault(), 'unavailable');
  assert.equal(d.opened, 0);
});

test('a different 256-bit key cannot unlock previously provisioned vault', async () => {
  const d = await fixture();
  assert.equal(await d.initializeVault(), 'ready');
  const key = 'seyveo.personal.vault.v1';
  const existing = JSON.parse(d.secureValues.get(key));
  existing.hexKey = existing.hexKey === '0'.repeat(64) ? '1'.repeat(64) : '0'.repeat(64);
  d.secureValues.set(key, JSON.stringify(existing));
  assert.equal(await d.inspectVault(), 'unavailable');
  assert.equal(d.databases.get(existing.database).marker, '1');
});
