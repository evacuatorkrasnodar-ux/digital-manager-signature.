/**
 * Local SQLite-only training employee identity adapter.
 * Never handles real employment credentials or accepts an unverified actor.
 * All invitations and membership changes use the same SQLite transaction.
 * The scrypt password verifier is AEAD-encrypted at rest with the DEV key.
 */
import {randomBytes,randomUUID,createHash,createCipheriv,createDecipheriv} from 'node:crypto';

const LOGIN=/^[a-z][a-z0-9_-]{2,31}$/;
const CODE=/^[A-Za-z0-9_-]{43}$/;
const INVITE_MS=15*60*1000;
const LIMIT=20;
const codeHash=value=>createHash('sha256').update(value).digest('hex');
const fail=()=>{throw new Error('Training membership or invitation unavailable.');};

export function createSqliteTrainingOnboarding({db,tx,contentKey,membership}={}){
  if(!db||typeof tx!=='function'||!Buffer.isBuffer(contentKey)||contentKey.length!==32||
     typeof membership!=='function')throw new TypeError('Trusted SQLite identity dependencies required.');
  const owner=(actor,organizationId)=>{
    if(membership(actor,organizationId).role!=='owner')fail();
  };
  const encrypt=(organizationId,userId,account)=>{
    const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',contentKey,iv);
    cipher.setAAD(Buffer.from('training-account:'+organizationId+':'+userId));
    const payload=JSON.stringify({
      salt:account.salt.toString('base64'),
      passwordHash:account.passwordHash.toString('base64')
    });
    const body=Buffer.concat([cipher.update(payload,'utf8'),cipher.final()]);
    return {iv,tag:cipher.getAuthTag(),body};
  };
  const decrypt=row=>{
    const decipher=createDecipheriv('aes-256-gcm',contentKey,row.iv);
    decipher.setAAD(Buffer.from('training-account:'+row.organization_id+':'+row.user_id));
    decipher.setAuthTag(row.tag);
    const parsed=JSON.parse(Buffer.concat([
      decipher.update(row.body_cipher),decipher.final()
    ]).toString('utf8'));
    const salt=Buffer.from(parsed.salt,'base64');
    const passwordHash=Buffer.from(parsed.passwordHash,'base64');
    if(salt.length!==16||passwordHash.length!==64)throw new Error('Corrupted training account.');
    return Object.freeze({userId:row.user_id,role:'employee',salt,passwordHash});
  };

  function getAccount({organizationId,userId}={}){
    if(!LOGIN.test(userId||''))return null;
    const row=db.prepare(
      'SELECT c.* FROM dev_employee_credentials c JOIN memberships m '+
      'ON c.organization_id=m.organization_id AND c.user_id=m.user_id '+
      "WHERE c.organization_id=? AND c.user_id=? AND m.role='employee'"
    ).get(organizationId,userId);
    return row?decrypt(row):null;
  }
  function createInvitation({actor,organizationId,employeeLogin}={}){
    owner(actor,organizationId);
    if(!LOGIN.test(employeeLogin||''))fail();
    return tx(()=>{
      const now=Date.now();
      db.prepare('DELETE FROM dev_employee_invitations WHERE expires_at<=?').run(now);
      if(db.prepare('SELECT 1 FROM memberships WHERE organization_id=? AND user_id=?')
        .get(organizationId,employeeLogin)||
        db.prepare('SELECT 1 FROM dev_employee_invitations WHERE organization_id=? AND user_id=?')
          .get(organizationId,employeeLogin))fail();
      const total=db.prepare('SELECT count(*) AS n FROM dev_employee_invitations WHERE organization_id=?')
        .get(organizationId).n;
      if(total>=LIMIT)fail();
      const code=randomBytes(32).toString('base64url');
      const id=randomUUID(),expiresAt=now+INVITE_MS;
      db.prepare('INSERT INTO dev_employee_invitations(id,organization_id,user_id,code_digest,expires_at) VALUES(?,?,?,?,?)')
        .run(id,organizationId,employeeLogin,codeHash(code),expiresAt);
      return {invitation:{
        id,employeeLogin,expiresAt:new Date(expiresAt).toISOString()
      },code};
    });
  }
  function cancelInvitation({actor,organizationId,invitationId}={}){
    owner(actor,organizationId);
    if(typeof invitationId!=='string')fail();
    return tx(()=>{
      const res=db.prepare('DELETE FROM dev_employee_invitations WHERE id=? AND organization_id=?')
        .run(invitationId,organizationId);
      if(res.changes!==1)fail();
    });
  }
  function redeemInvitation({organizationId,code,password,makeEmployeeAccount}={}){
    if(typeof code!=='string'||!CODE.test(code)||typeof makeEmployeeAccount!=='function')
      fail();
    return tx(()=>{
      const now=Date.now();
      const row=db.prepare(
        'SELECT id,user_id,expires_at FROM dev_employee_invitations WHERE organization_id=? AND code_digest=?'
      ).get(organizationId,codeHash(code));
      if(!row||row.expires_at<=now)fail();
      if(db.prepare('SELECT 1 FROM memberships WHERE organization_id=? AND user_id=?')
        .get(organizationId,row.user_id))fail();
      // New account construction (including password validation and scrypt)
      // happens before any mutations. A failure rolls back the transaction.
      const account=makeEmployeeAccount(row.user_id,password);
      if(account?.userId!==row.user_id||account?.role!=='employee'||
         !Buffer.isBuffer(account.salt)||account.salt.length!==16||
         !Buffer.isBuffer(account.passwordHash)||account.passwordHash.length!==64)
        fail();
      const enc=encrypt(organizationId,row.user_id,account);
      db.prepare("INSERT INTO memberships VALUES(?,?,'employee','active')")
        .run(organizationId,row.user_id);
      db.prepare('INSERT INTO dev_employee_credentials VALUES(?,?,?,?,?)')
        .run(organizationId,row.user_id,enc.iv,enc.tag,enc.body);
      db.prepare('DELETE FROM dev_employee_invitations WHERE id=?').run(row.id);
      return {user:{id:row.user_id,organizationId,role:'employee'}};
    });
  }
  function listMembers({actor,organizationId}={}){
    owner(actor,organizationId);
    return db.prepare('SELECT user_id AS userId,role,status FROM memberships WHERE organization_id=? ORDER BY user_id')
      .all(organizationId);
  }
  function revokeMember({actor,organizationId,userId}={}){
    owner(actor,organizationId);
    if(!LOGIN.test(userId||'')||userId===actor.userId)fail();
    return tx(()=>{
      const changed=db.prepare(
        "UPDATE memberships SET status='revoked' WHERE organization_id=? AND user_id=? AND role='employee' AND status='active'"
      ).run(organizationId,userId);
      if(changed.changes!==1)fail();
    });
  }
  return Object.freeze({
    getAccount,createInvitation,cancelInvitation,redeemInvitation,listMembers,revokeMember
  });
}
