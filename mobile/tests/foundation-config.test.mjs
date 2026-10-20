import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = file => readFile(new URL('../' + file, import.meta.url), 'utf8');

test('mobile native build enables real SQLCipher and supports both phone systems', async () => {
 const app = JSON.parse(await read('app.json')).expo;
 assert.equal(app.plugins.find(p => p[0] === 'expo-sqlite')?.[1].useSQLCipher, true);
 assert.equal(app.extra.cloudBackupEnabled, false);
 assert.equal(app.android.allowBackup, false, 'Android OS backups must remain off until encrypted Cloud Bridge exists');
 assert.ok(app.ios.bundleIdentifier);
 assert.ok(app.android.package);
 assert.ok(app.plugins.some(p => p[0] === 'expo-secure-store'));
});

test('package versions match Expo SDK 58 baseline and include a development client', async () => {
 const pkg = JSON.parse(await read('package.json'));
 assert.match(pkg.dependencies.expo, /^~58\./);
 assert.equal(pkg.dependencies.react, '19.3.0');
 assert.equal(pkg.dependencies['react-native'], '0.88.0');
 assert.match(pkg.dependencies['expo-dev-client'], /^~58\./);
 assert.equal(pkg.scripts.start, 'expo start --dev-client');
});

test('vault does not accept malformed key metadata or hardcoded keys', async () => {
 const vault = await read('src/core/secureVault.ts');
 assert.match(vault, /\^\[a-f0-9\]\{64\}\$/);
 assert.match(vault, /getRandomBytesAsync\(bytes\)/);
 assert.match(vault, /SecureStore\.getItemAsync\(KEY_NAME\)/);
 assert.match(vault, /SecureStore\.setItemAsync\(KEY_NAME/);
 assert.doesNotMatch(vault, /console\.(log|warn|error)\(/);
 assert.doesNotMatch(vault, /['"](?:password|changeme|test-key)['"]/i);
});

test('vault sets PRAGMA key before every SQLCipher read and fails closed', async () => {
 const vault = await read('src/core/secureVault.ts');
 const fn = vault.slice(vault.indexOf('async function confirmCipher'));
 const keyAt = fn.indexOf('await db.execAsync("PRAGMA key');
 const cipherAt = fn.indexOf("await db.getFirstAsync<{ cipher_version");
 const quickAt = fn.indexOf("await db.getFirstAsync<{ quick_check");
 const createAt = fn.indexOf("await db.execAsync('CREATE TABLE");
 assert.ok(keyAt >= 0 && keyAt < cipherAt && cipherAt < quickAt && quickAt < createAt);
 assert.match(fn, /if \(!cipher\?\.cipher_version\) throw/);
 assert.match(fn, /if \(check\?\.quick_check !== 'ok'\) throw/);
 assert.match(fn, /if \(firstProvision\)/);
 assert.match(fn, /INSERT INTO vault_meta/);
 assert.match(fn, /Original encrypted vault not found/);
 assert.match(fn, /if \(marker\?\.value !== '1'\) throw/);
});

test('new screen never claims encrypted storage without native verification', async () => {
 const app = await read('App.tsx');
 assert.match(app, /state === 'ready'/);
 assert.match(app, /Зашифрованная база проверена/);
 assert.match(app, /state === 'unavailable'/);
 assert.match(app, /Защита не подтверждена/);
 assert.match(app, /initializeVault\(\)/);
 assert.match(app, /Проверяем локальное хранилище/);
 assert.doesNotMatch(app, /fetch\(/);
});
