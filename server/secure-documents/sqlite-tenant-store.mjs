/**
 * SEYVEO Secure Documents / SQLite persistence experiment.
 * Local development ONLY: no authentication, internet delivery, MFA, KMS,
 * encrypted SQLite metadata, certified EDMS or legal signatures.
 * actor MUST originate from a separately authenticated server request.
 * This API accepts a trusted actor solely to exercise data authorization.
 */
import { DatabaseSync } from 'node:sqlite';
import { randomUUID, randomBytes, createCipheriv, createDecipheriv, createHmac, hkdfSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, lstatSync, statSync, chmodSync } from 'node:fs';
import { isAbsolute, dirname } from 'node:path';
import { canCreateDocument, canReadDocument, canTransitionDocument } from '../document-authorization.mjs';

const TYPES=new Set(['approval','acknowledgement']);
const STATES=Object.freeze({read:'read',acknowledge:'acknowledged',approve:'approved',return:'returned',revoke:'revoked'});
const ROLES=new Set(['owner','admin','manager','employee']);
const idOk=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,96}$/.test(x);
const textOk=(x,max)=>typeof x==='string'&&!!x.trim()&&x.length<=max;
const denied=()=>{throw new Error('Access denied or resource unavailable.');};
const derived=(key,label)=>Buffer.from(hkdfSync('sha256',key,Buffer.from('SEYVEO-dev-sqlite-v1'),label,32));
const sealed=(key,tenant,id,payload)=>{
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(Buffer.from(tenant+'|'+id));
  const body=Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]);
  return {iv,tag:cipher.getAuthTag(),body};
};
const opened=(key,d)=>{
  const decipher=createDecipheriv('aes-256-gcm',key,d.iv);
  decipher.setAAD(Buffer.from(d.organization_id+'|'+d.id));
  decipher.setAuthTag(d.tag);
  return JSON.parse(Buffer.concat([decipher.update(d.body_cipher),decipher.final()]).toString('utf8'));
};
const docForPolicy=d=>({
  id:d.id,organizationId:d.organization_id,creatorUserId:d.creator_user_id,
  recipientUserId:d.recipient_user_id,type:d.type,status:d.status
});
const publicRow=d=>({
  id:d.id,organizationId:d.organization_id,creatorUserId:d.creator_user_id,
  recipientUserId:d.recipient_user_id,type:d.type,status:d.status,
  createdAt:d.created_at,updatedAt:d.updated_at
});

export function openDevTenantStore({filePath, masterKey}={}){
  if(process.env.NODE_ENV==='production')throw new Error('Dev-only database is disabled in production.');
  if(!isAbsolute(filePath||'')||!Buffer.isBuffer(masterKey)||masterKey.length!==32)
    throw new Error('Absolute database path and 32-byte key required.');
  const dir=dirname(filePath);
  mkdirSync(dir,{recursive:true,mode:0o700});
  if(process.platform!=='win32'&&(statSync(dir).mode&0o077))
    throw new Error('Development database directory must be private (0700).');
  try{
    const stat=lstatSync(filePath);
    if(!stat.isFile()||(process.platform!=='win32'&&(stat.mode&0o077)))
      throw new Error('Database file must be private regular file (0600).');
  }catch(e){if(e.code!=='ENOENT')throw e;}
  const db=new DatabaseSync(filePath);
  const contentKey=derived(masterKey,'content');
  const auditKey=derived(masterKey,'audit');
  try{
    db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000; PRAGMA journal_mode = DELETE;');
    if(process.platform!=='win32')chmodSync(filePath,0o600);
    db.exec("\n      CREATE TABLE IF NOT EXISTS organizations (\n        id TEXT PRIMARY KEY CHECK(length(id)>0), created_at TEXT NOT NULL\n      );\n      CREATE TABLE IF NOT EXISTS memberships (\n        organization_id TEXT NOT NULL REFERENCES organizations(id),\n        user_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','admin','manager','employee')),\n        status TEXT NOT NULL CHECK(status IN ('active','revoked')),\n        PRIMARY KEY (organization_id,user_id)\n      );\n      CREATE TABLE IF NOT EXISTS documents (\n        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),\n        creator_user_id TEXT NOT NULL, recipient_user_id TEXT NOT NULL,\n        type TEXT NOT NULL CHECK(type IN ('approval','acknowledgement')),\n        status TEXT NOT NULL CHECK(status IN ('sent','read','acknowledged','approved','returned','revoked')),\n        iv BLOB NOT NULL,tag BLOB NOT NULL,body_cipher BLOB NOT NULL,\n        created_at TEXT NOT NULL,updated_at TEXT NOT NULL,\n        FOREIGN KEY(organization_id,creator_user_id) REFERENCES memberships(organization_id,user_id),\n        FOREIGN KEY(organization_id,recipient_user_id) REFERENCES memberships(organization_id,user_id)\n      );\n      CREATE INDEX IF NOT EXISTS documents_by_tenant ON documents(organization_id,created_at);\n      CREATE INDEX IF NOT EXISTS documents_by_recipient ON documents(organization_id,recipient_user_id);\n      CREATE TABLE IF NOT EXISTS document_audit (\n        document_id TEXT NOT NULL REFERENCES documents(id),\n        event_no INTEGER NOT NULL, actor_user_id TEXT NOT NULL,\n        action TEXT NOT NULL,status TEXT NOT NULL,at TEXT NOT NULL,\n        prev_hmac TEXT NOT NULL,hmac TEXT NOT NULL,\n        PRIMARY KEY(document_id,event_no)\n      );\n      CREATE TABLE IF NOT EXISTS store_guard (\n        singleton INTEGER PRIMARY KEY CHECK(singleton=1),iv BLOB NOT NULL,\n        tag BLOB NOT NULL,body BLOB NOT NULL\n      );\n    ");
    // Detect wrong key on every subsequent open, even before reading documents.
    const guard=db.prepare('SELECT iv,tag,body FROM store_guard WHERE singleton=1').get();
    if(guard){
      const d=createDecipheriv('aes-256-gcm',contentKey,guard.iv);
      d.setAuthTag(guard.tag);
      const plain=Buffer.concat([d.update(guard.body),d.final()]);
      if(!plain.equals(Buffer.from('SEYVEO-DEV-STORE-KEY-V1')))throw new Error('Invalid key guard.');
    }else{
      const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',contentKey,iv);
      const body=Buffer.concat([c.update('SEYVEO-DEV-STORE-KEY-V1','utf8'),c.final()]);
      db.prepare('INSERT INTO store_guard VALUES(1,?,?,?)').run(iv,c.getAuthTag(),body);
    }
  }catch(e){db.close();throw e;}
  const tx=fn=>{
    db.exec('BEGIN IMMEDIATE');
    try{const result=fn();db.exec('COMMIT');return result;}
    catch(e){db.exec('ROLLBACK');throw e;}
  };
  const membership=(actor,orgId)=>{
    if(!idOk(actor?.userId)||!idOk(orgId))denied();
    const m=db.prepare('SELECT organization_id AS organizationId,user_id AS userId,role,status FROM memberships WHERE organization_id=? AND user_id=?').get(orgId,actor.userId);
    if(!m||m.status!=='active')denied();
    return m;
  };
  const load=(id,org)=>{
    if(!idOk(id)||!idOk(org))denied();
    const row=db.prepare('SELECT * FROM documents WHERE id=? AND organization_id=?').get(id,org);
    if(!row)denied();return row;
  };
  const readAccess=(actor,org,id)=>{
    const m=membership(actor,org),d=load(id,org);
    if(!canReadDocument({actor,membership:m,document:docForPolicy(d)}))denied();
    return {d,m};
  };
  const digest=(id,no,actor,action,status,at,prev)=>createHmac('sha256',auditKey)
    .update(JSON.stringify([id,no,actor,action,status,at,prev])).digest('hex');
  const appendAudit=(d,actor,action)=>{
    const prev=db.prepare('SELECT event_no,hmac FROM document_audit WHERE document_id=? ORDER BY event_no DESC LIMIT 1').get(d.id);
    const no=(prev?.event_no||0)+1,prevHash=prev?.hmac||'',at=new Date().toISOString();
    db.prepare('INSERT INTO document_audit VALUES(?,?,?,?,?,?,?,?)')
      .run(d.id,no,actor,action,d.status,at,prevHash,digest(d.id,no,actor,action,d.status,at,prevHash));
  };
  const verifyAudit=id=>{
    const entries=db.prepare('SELECT * FROM document_audit WHERE document_id=? ORDER BY event_no').all(id);
    if(!entries.length)throw new Error('Missing audit trail.');
    let prev='';
    for(let i=0;i<entries.length;i++){
      const e=entries[i];
      const expected=digest(id,i+1,e.actor_user_id,e.action,e.status,e.at,prev);
      if(e.event_no!==i+1||e.prev_hmac!==prev||
        !timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(String(e.hmac),'hex')))
        throw new Error('Audit history corrupted.');
      prev=e.hmac;
    }
    return entries.map(e=>({eventNo:e.event_no,actorUserId:e.actor_user_id,
      action:e.action,status:e.status,at:e.at}));
  };
  function bootstrapOrganization({organizationId,ownerUserId}){
    if(!idOk(organizationId)||!idOk(ownerUserId))throw new Error('Invalid bootstrap IDs.');
    // Trusted developer bootstrap only. Never make this a public HTTP endpoint.
    return tx(()=>{
      db.prepare('INSERT INTO organizations VALUES(?,?)').run(organizationId,new Date().toISOString());
      db.prepare("INSERT INTO memberships VALUES(?,?,'owner','active')").run(organizationId,ownerUserId);
    });
  }
  function addMember({actor,organizationId,userId,role}){
    if(!idOk(userId)||!ROLES.has(role)||role==='owner')denied();
    if(membership(actor,organizationId).role!=='owner')denied();
    return tx(()=>{
      db.prepare("INSERT INTO memberships VALUES(?,?,?,'active')").run(organizationId,userId,role);
    });
  }
  function revokeMember({actor,organizationId,userId}){
    if(membership(actor,organizationId).role!=='owner'||actor.userId===userId)denied();
    return tx(()=>{
      const changed=db.prepare("UPDATE memberships SET status='revoked' WHERE organization_id=? AND user_id=? AND role!='owner'").run(organizationId,userId);
      if(changed.changes!==1)denied();
    });
  }
  function createDocument({actor,organizationId,recipientUserId,type,title,body}){
    if(!TYPES.has(type)||!idOk(recipientUserId)||!textOk(title,120)||!textOk(body,8000))
      throw new Error('Invalid document fields.');
    const m=membership(actor,organizationId);
    if(!canCreateDocument({actor,membership:m,organizationId}))denied();
    if(actor.userId===recipientUserId)denied();
    const recipient=db.prepare("SELECT 1 FROM memberships WHERE organization_id=? AND user_id=? AND status='active'").get(organizationId,recipientUserId);
    if(!recipient)denied();
    const id=randomUUID(),at=new Date().toISOString();
    const encrypted=sealed(contentKey,organizationId,id,{title,body});
    return tx(()=>{
      db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?,?,?,?,?,?)')
        .run(id,organizationId,actor.userId,recipientUserId,type,'sent',encrypted.iv,
          encrypted.tag,encrypted.body,at,at);
      const row=load(id,organizationId);appendAudit(row,actor.userId,'created');
      return publicRow(row);
    });
  }
  function getDocument({actor,organizationId,documentId}){
    const {d}=readAccess(actor,organizationId,documentId);
    const content=opened(contentKey,d);
    return {...publicRow(d),title:content.title,body:content.body};
  }
  function listDocuments({actor,organizationId}){
    const m=membership(actor,organizationId);
    if(m.role==='owner'||m.role==='admin'){
      return db.prepare('SELECT * FROM documents WHERE organization_id=? ORDER BY created_at DESC').all(organizationId).map(publicRow);
    }
    return db.prepare('SELECT * FROM documents WHERE organization_id=? AND (creator_user_id=? OR recipient_user_id=?) ORDER BY created_at DESC')
      .all(organizationId,actor.userId,actor.userId).map(publicRow);
  }
  function transition({actor,organizationId,documentId,action}){
    return tx(()=>{
      const {d,m}=readAccess(actor,organizationId,documentId);
      if(!canTransitionDocument({actor,membership:m,document:docForPolicy(d),action})||
          !Object.hasOwn(STATES,action))denied();
      const now=new Date().toISOString();
      const updated=db.prepare('UPDATE documents SET status=?,updated_at=? WHERE id=? AND organization_id=? AND status=?')
        .run(STATES[action],now,documentId,organizationId,d.status);
      if(updated.changes!==1)denied();
      const next=load(documentId,organizationId);
      appendAudit(next,actor.userId,action);
      return publicRow(next);
    });
  }
  function getAudit({actor,organizationId,documentId}){
    readAccess(actor,organizationId,documentId);
    return verifyAudit(documentId);
  }
  return Object.freeze({bootstrapOrganization,addMember,revokeMember,createDocument,
    getDocument,listDocuments,transition,getAudit,close:()=>db.close()});
}
