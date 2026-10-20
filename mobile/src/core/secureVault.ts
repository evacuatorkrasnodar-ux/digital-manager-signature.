/* SEYVEO Mobile M1 · guarded SQLCipher bootstrap, not yet a personal-data migration.
 * No login, cloud upload or automatic transfer of existing PWA localStorage.
 * NEVER print, sync or hardcode the database secret.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

const KEY_NAME = 'seyveo.personal.vault.v1';
type VaultIdentity = { version: 1; database: string; hexKey: string };
export type VaultStatus = 'needs-setup' | 'ready' | 'unavailable';

function validIdentity(value: unknown): value is VaultIdentity {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return data.version === 1 &&
    typeof data.database === 'string' &&
    /^seyveo-[a-f0-9]{32}\.db$/.test(data.database) &&
    typeof data.hexKey === 'string' &&
    /^[a-f0-9]{64}$/.test(data.hexKey);
}

async function readIdentity(): Promise<VaultIdentity | null> {
  const stored = await SecureStore.getItemAsync(KEY_NAME);
  if (stored === null) return null;
  // Corrupt metadata must NOT be interpreted as first use.
  let identity: unknown;
  try { identity = JSON.parse(stored); }
  catch { throw new Error('Vault metadata unreadable'); }
  if (!validIdentity(identity)) throw new Error('Vault metadata invalid');
  return identity;
}

async function randomHex(bytes: number): Promise<string> {
  const buffer = await Crypto.getRandomBytesAsync(bytes);
  return Array.from(buffer, x => x.toString(16).padStart(2, '0')).join('');
}

async function confirmCipher(identity: VaultIdentity): Promise<void> {
  const db = await SQLite.openDatabaseAsync(identity.database);
  try {
    // MUST be the first SQL statement after opening this connection.
    // hexKey is generated from a CSPRNG and validated as [a-f0-9]{64}.
    await db.execAsync("PRAGMA key = '" + identity.hexKey + "';");
    // An ordinary unencrypted SQLite build must fail closed.
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) throw new Error('SQLCipher unavailable');
    const check = await db.getFirstAsync<{ quick_check: string }>('PRAGMA quick_check');
    if (check?.quick_check !== 'ok') throw new Error('Vault integrity check failed');
    await db.execAsync('CREATE TABLE IF NOT EXISTS vault_meta (id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');
  } finally {
    await db.closeAsync();
  }
}

export async function inspectVault(): Promise<VaultStatus> {
  try {
    const identity = await readIdentity();
    if (!identity) return 'needs-setup';
    await confirmCipher(identity);
    return 'ready';
  } catch {
    // Do not reveal key, file names or platform diagnostics to UI.
    return 'unavailable';
  }
}

export async function initializeVault(): Promise<VaultStatus> {
  try {
    let identity = await readIdentity();
    if (!identity) {
      // A fresh random DB name avoids silently overwriting any orphaned
      // encrypted database after device credentials are lost.
      identity = {
        version: 1,
        database: 'seyveo-' + await randomHex(16) + '.db',
        hexKey: await randomHex(32)
      };
      // If SecureStore cannot persist this key, don't create the DB.
      await SecureStore.setItemAsync(KEY_NAME, JSON.stringify(identity), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
      });
    }
    await confirmCipher(identity);
    return 'ready';
  } catch {
    return 'unavailable';
  }
}
