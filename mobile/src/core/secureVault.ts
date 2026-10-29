/* SEYVEO Mobile M1 · guarded SQLCipher bootstrap, not yet a personal-data migration.
 * No login, cloud upload or automatic transfer of existing PWA localStorage.
 * NEVER print, sync or hardcode the database secret.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

const KEY_NAME = 'seyveo.personal.vault.v1';
type VaultIdentity = { version: 1; database: string; hexKey: string; stage?: 'provisioning' | 'ready' };
export type VaultStatus = 'needs-setup' | 'ready' | 'unavailable';

function validIdentity(value: unknown): value is VaultIdentity {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return data.version === 1 &&
    typeof data.database === 'string' &&
    /^seyveo-[a-f0-9]{32}\.db$/.test(data.database) &&
    typeof data.hexKey === 'string' &&
    /^[a-f0-9]{64}$/.test(data.hexKey) &&
    (data.stage === undefined || data.stage === 'ready' || data.stage === 'provisioning');
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

async function confirmCipher(identity: VaultIdentity, firstProvision = false): Promise<void> {
  const db = await SQLite.openDatabaseAsync(identity.database);
  try {
    // MUST be the first SQL statement after opening this connection.
    // hexKey comes exclusively from a CSPRNG and is strictly hex-validated.
    await db.execAsync("PRAGMA key = '" + identity.hexKey + "';");
    // A standard unencrypted SQLite build MUST fail closed.
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) throw new Error('SQLCipher unavailable');
    const check = await db.getFirstAsync<{ quick_check: string }>('PRAGMA quick_check');
    if (check?.quick_check !== 'ok') throw new Error('Vault integrity check failed');

    // IMPORTANT: a missing database may otherwise be silently recreated by
    // openDatabaseAsync() with the correct key, concealing loss of user data.
    // Only the explicit first-time setup may create the schema and marker.
    if (firstProvision) {
      // The setup marker can be retried if process termination interrupted
      // provisioning. No user records are allowed while stage=provisioning.
      await db.execAsync('CREATE TABLE IF NOT EXISTS vault_meta (id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');
      await db.runAsync('INSERT OR IGNORE INTO vault_meta (id, value) VALUES (?, ?)', 'schema', '1');
    }
    const marker = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM vault_meta WHERE id = ?', 'schema'
    );
    if (marker?.value !== '1') throw new Error('Original encrypted vault not found');
  } finally {
    await db.closeAsync();
  }
}

export async function inspectVault(): Promise<VaultStatus> {
  try {
    const identity = await readIdentity();
    if (!identity || identity.stage === 'provisioning') return 'needs-setup';
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
        hexKey: await randomHex(32),
        stage: 'provisioning'
      };
      // If SecureStore cannot persist this key, don't create the DB.
      await SecureStore.setItemAsync(KEY_NAME, JSON.stringify(identity), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
      });
    }
    if (identity.stage === 'provisioning') {
      // Validate the encrypted DB BEFORE transitioning to ready. SecureStore
      // must record that final transition; a failed write remains recoverable.
      await confirmCipher(identity, true);
      await SecureStore.setItemAsync(KEY_NAME, JSON.stringify({...identity, stage: 'ready'}), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
      });
    } else {
      await confirmCipher(identity, false);
    }
    return 'ready';
  } catch {
    return 'unavailable';
  }
}

export async function openVerifiedVault() {
  const identity = await readIdentity();
  if (!identity || identity.stage !== 'ready') throw new Error('Vault unavailable');
  await confirmCipher(identity);
  const db = await SQLite.openDatabaseAsync(identity.database);
  try {
    await db.execAsync("PRAGMA key = '" + identity.hexKey + "';");
    const cipher = await db.getFirstAsync<{cipher_version:string}>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) throw new Error('SQLCipher required');
    return db;
  } catch(error) {
    await db.closeAsync();
    throw error;
  }
}
