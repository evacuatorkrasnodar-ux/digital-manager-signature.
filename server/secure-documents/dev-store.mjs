/**
 * LOCAL DEVELOPMENT ONLY: encrypted, atomic on-disk snapshot.
 *
 * No database, no multi-process locking, no backups, no key rotation, and no
 * rollback protection. AES-256-GCM detects ciphertext tampering and wrong keys,
 * but cannot detect replacement with an older valid snapshot.
 * Use only synthetic training records. Never store real company data here.
 */
import {
  randomBytes, createCipheriv, createDecipheriv, hkdfSync
} from 'node:crypto';
import {
  mkdirSync, lstatSync, openSync, closeSync, writeSync, fsyncSync,
  renameSync, readFileSync, unlinkSync, statSync
} from 'node:fs';
import { isAbsolute, dirname, basename, join } from 'node:path';

const FORMAT = 'SEYVEO_DEV_STORE_V1';
const LIMIT = 2 * 1024 * 1024;
const AAD = Buffer.from(FORMAT, 'utf8');
const b64 = data => Buffer.from(data).toString('base64url');
const bytes = text => Buffer.from(text, 'base64url');
const isString = (x, max=128) =>
  typeof x === 'string' && x.length > 0 && x.length <= max;
const isDate = x => isString(x, 40) && !Number.isNaN(Date.parse(x));
const validBufferField = x => isString(x, LIMIT) && /^[a-zA-Z0-9_-]+$/.test(x);

function validateRecord(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d) ||
    !isString(d.id) || !isString(d.organizationId) ||
    !isString(d.creatorUserId) || !isString(d.recipientUserId) ||
    !['acknowledgement','approval'].includes(d.type) ||
    !['sent','read','acknowledged','approved','returned','revoked'].includes(d.status) ||
    !isString(d.title, 120) || !isDate(d.createdAt) || !isDate(d.updatedAt) ||
    !d.sealed || typeof d.sealed !== 'object' ||
    !Buffer.isBuffer(d.sealed.iv) || d.sealed.iv.length !== 12 ||
    !Buffer.isBuffer(d.sealed.tag) || d.sealed.tag.length !== 16 ||
    !Buffer.isBuffer(d.sealed.encrypted) || d.sealed.encrypted.length > 32768)
    throw new Error('Invalid stored document format.');
}
function serialize({ documents, audit }) {
  if (!(documents instanceof Map) || !(audit instanceof Map) ||
    documents.size > 100) throw new Error('Invalid snapshot size.');
  const rows = [];
  for (const d of documents.values()) {
    validateRecord(d);
    rows.push({ ...d, sealed:{
      iv:b64(d.sealed.iv), tag:b64(d.sealed.tag),
      encrypted:b64(d.sealed.encrypted)
    }});
  }
  const logs = [];
  for (const [id, items] of audit) {
    if (!documents.has(id) || !Array.isArray(items) || items.length > 128)
      throw new Error('Invalid audit snapshot.');
    for (const e of items) {
      if (!e || !isDate(e.at) || !isString(e.actorUserId) ||
        !isString(e.action, 40) || !isString(e.status, 40))
        throw new Error('Invalid audit event.');
    }
    logs.push([id, items]);
  }
  const json = JSON.stringify({version:1, rows, logs});
  if (Buffer.byteLength(json) > LIMIT) throw new Error('Encrypted snapshot would exceed limit.');
  return Buffer.from(json);
}
function parse(data) {
  const parsed = JSON.parse(data.toString('utf8'));
  if (!parsed || parsed.version !== 1 ||
      !Array.isArray(parsed.rows) || !Array.isArray(parsed.logs) ||
      parsed.rows.length > 100 || parsed.logs.length > 100)
    throw new Error('Unsupported encrypted snapshot schema.');
  const documents = new Map(), audit = new Map();
  for (const raw of parsed.rows) {
    if (!raw || !raw.sealed ||
      !['iv','tag','encrypted'].every(k => validBufferField(raw.sealed[k])))
      throw new Error('Stored record is corrupt.');
    const d = {...raw, sealed:{
      iv:bytes(raw.sealed.iv), tag:bytes(raw.sealed.tag),
      encrypted:bytes(raw.sealed.encrypted)
    }};
    validateRecord(d);
    if (documents.has(d.id)) throw new Error('Duplicate document ID.');
    documents.set(d.id,d);
  }
  for (const [id, items] of parsed.logs) {
    if (!documents.has(id) || audit.has(id) ||
        !Array.isArray(items) || items.length > 128)
      throw new Error('Corrupt audit log.');
    for (const entry of items) {
      if (!entry || !isDate(entry.at) || !isString(entry.actorUserId) ||
          !isString(entry.action, 40) || !isString(entry.status, 40))
        throw new Error('Corrupt audit event.');
    }
    audit.set(id,items);
  }
  for (const id of documents.keys()) {
    if (!audit.has(id)) throw new Error('Missing audit history.');
  }
  return { documents, audit };
}
function assurePrivateFile(path) {
  try {
    const info=lstatSync(path);
    if (!info.isFile() || (process.platform !== 'win32' && (info.mode & 0o077)))
      throw new Error('Storage is not a private regular file (0600 required).');
    if (info.size > LIMIT * 2) throw new Error('Encrypted file exceeds size limit.');
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}
export function createEncryptedDevStore({ filePath, masterKey }) {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Development store is disabled in production.');
  if (typeof filePath !== 'string' || !isAbsolute(filePath) ||
      !Buffer.isBuffer(masterKey) || masterKey.length !== 32)
    throw new Error('Absolute storage path and 32-byte key required.');
  const dir=dirname(filePath);
  mkdirSync(dir,{recursive:true,mode:0o700});
  if (process.platform !== 'win32') {
    const st=statSync(dir);
    if ((st.mode & 0o077) || !st.isDirectory())
      throw new Error('Storage directory must be private (0700).');
  }
  function load(){
    if (!assurePrivateFile(filePath)) return {documents:new Map(),audit:new Map()};
    const envelope=JSON.parse(readFileSync(filePath,'utf8'));
    if (!envelope || envelope.format!==FORMAT ||
        !['salt','iv','tag','ciphertext'].every(k=>validBufferField(envelope[k])))
      throw new Error('Unrecognized or damaged encrypted store.');
    const salt=bytes(envelope.salt),iv=bytes(envelope.iv),tag=bytes(envelope.tag);
    if (salt.length!==16 || iv.length!==12 || tag.length!==16)
      throw new Error('Invalid encrypted store header.');
    const key=Buffer.from(hkdfSync('sha256',masterKey,salt,FORMAT,32));
    const decipher=createDecipheriv('aes-256-gcm',key,iv);
    decipher.setAAD(AAD);
    decipher.setAuthTag(tag);
    const payload=Buffer.concat([
      decipher.update(bytes(envelope.ciphertext)),decipher.final()
    ]);
    return parse(payload);
  }
  function save(snapshot) {
    const payload=serialize(snapshot);
    // Derive distinct outer snapshot key from the master key.
    const salt=randomBytes(16),iv=randomBytes(12);
    const key=Buffer.from(hkdfSync('sha256',masterKey,salt,FORMAT,32));
    const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(AAD);
    const ciphertext=Buffer.concat([cipher.update(payload),cipher.final()]);
    const envelope=JSON.stringify({
      format:FORMAT,salt:b64(salt),iv:b64(iv),
      tag:b64(cipher.getAuthTag()),ciphertext:b64(ciphertext)
    });
    if (Buffer.byteLength(envelope)>LIMIT*2) throw new Error('Encrypted store too large.');
    assurePrivateFile(filePath); // Reject symlink, readable existing file, etc.
    const tmp=join(dir,'.'+basename(filePath)+'.'+b64(randomBytes(12))+'.tmp');
    let fd;
    try {
      fd=openSync(tmp,'wx',0o600);
      const data=Buffer.from(envelope);
      let written=0;
      while(written<data.length) written+=writeSync(fd,data,written,data.length-written);
      fsyncSync(fd);closeSync(fd);fd=undefined;
      renameSync(tmp,filePath);
      // File was fsynced; best-effort directory fsync on POSIX platforms.
      if (process.platform!=='win32') {
        let dirfd;
        try {dirfd=openSync(dir,'r');fsyncSync(dirfd);} finally {if(dirfd!==undefined)closeSync(dirfd);}
      }
    } catch(e) {
      if(fd!==undefined)closeSync(fd);
      try{unlinkSync(tmp)}catch{}
      throw e;
    }
  }
  return Object.freeze({load,save});
}
