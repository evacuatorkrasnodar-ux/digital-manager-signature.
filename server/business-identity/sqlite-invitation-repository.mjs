/**
 * SEYVEO Business SQLite invitation persistence (Node 22+).
 *
 * Backend-only staging adapter; no hosted identity, TLS or production KMS.
 * Requires an authoritative memberships table in the SAME SQLite database.
 * checkSessionInTx and checkRecipientInTx must be SYNCHRONOUS reads of
 * trusted active identity state from THIS transaction / database. Never
 * supply role or session from the HTTP request body, QR or unverified JWT.
 */
const ID=/^[A-Za-z0-9_-]{1,96}$/;
const LOGIN=/^[a-z][a-z0-9_-]{2,31}$/;
const SHA=/^[a-f0-9]{64}$/;
const LIFETIME_MS=900000;
const validId=x=>typeof x==='string'&&ID.test(x);
const validActor=x=>x&&validId(x.userId)&&validId(x.sessionId);
const timeOk=x=>Number.isSafeInteger(x)&&x>0;

export function createSqliteInvitationRepository({
  db,now=Date.now,checkSessionInTx,checkRecipientInTx
}={}){
  if(!db||typeof db.exec!=='function'||typeof db.prepare!=='function'||
     [now,checkSessionInTx,checkRecipientInTx].some(f=>typeof f!=='function'))
    throw new TypeError('Trusted SQLite and synchronous identity callbacks required.');
  db.exec([
    'CREATE TABLE IF NOT EXISTS seyveo_employee_invites (',
    'id TEXT PRIMARY KEY, organization_id TEXT NOT NULL,',
    'user_id TEXT NOT NULL, employee_login TEXT NOT NULL,',
    'code_digest TEXT NOT NULL UNIQUE,',
    "status TEXT NOT NULL CHECK(status IN ('pending','consumed','revoked','expired')),",
    'issued_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, ended_at INTEGER,',
    'CHECK(expires_at>issued_at AND expires_at-issued_at<=900000));',
    'CREATE UNIQUE INDEX IF NOT EXISTS seyveo_active_employee_invite',
    "ON seyveo_employee_invites(organization_id,user_id) WHERE status='pending';",
    'CREATE INDEX IF NOT EXISTS seyveo_employee_invites_expiry',
    'ON seyveo_employee_invites(status,expires_at);'
  ].join(' '));

  const atomic=fn=>{
    db.exec('BEGIN IMMEDIATE');
    try{
      const result=fn();
      if(result&&typeof result.then==='function')
        throw new Error('Async transaction denied.');
      db.exec('COMMIT');return result;
    }catch(error){
      try{db.exec('ROLLBACK')}catch{}
      throw error;
    }
  };
  const session=(actor,organizationId)=>{
    if(!validActor(actor)||!validId(organizationId))return false;
    return checkSessionInTx({db,actor,organizationId,now:now()})===true;
  };
  const recipient=(userId,employeeLogin)=>{
    if(!validId(userId)||typeof employeeLogin!=='string'||!LOGIN.test(employeeLogin))
      return false;
    return checkRecipientInTx({db,userId,employeeLogin,now:now()})===true;
  };
  const owner=(actor,organizationId)=>{
    if(!session(actor,organizationId))return false;
    const m=db.prepare(
      'SELECT role,status FROM memberships WHERE organization_id=? AND user_id=?'
    ).get(organizationId,actor.userId);
    return m?.role==='owner'&&m?.status==='active';
  };
  const expire=time=>db.prepare(
    "UPDATE seyveo_employee_invites SET status='expired',ended_at=? "+
    "WHERE status='pending' AND expires_at<=?"
  ).run(time,time);

  async function issueInvitationAtomic({
    invitationId,codeDigest,organizationId,employeeLogin,
    recipientUserId,role,issuedAt,expiresAt,actor,assertOwnerActive
  }={}){
    if(!validId(invitationId)||!SHA.test(codeDigest||'')||
       !validId(organizationId)||!validId(recipientUserId)||
       typeof employeeLogin!=='string'||!LOGIN.test(employeeLogin)||
       role!=='employee'||!validActor(actor)||
       !timeOk(issuedAt)||!timeOk(expiresAt)||
       expiresAt-issuedAt!==LIFETIME_MS||
       typeof assertOwnerActive!=='function')return false;
    try{
      if(await assertOwnerActive()!==true)return false;
      return atomic(()=>{
        const time=now();
        if(!timeOk(time)||issuedAt>time||expiresAt<=time||
           expiresAt-time>LIFETIME_MS||
           !owner(actor,organizationId)||
           !recipient(recipientUserId,employeeLogin))
          return false;
        expire(time);
        if(db.prepare(
          'SELECT 1 FROM memberships WHERE organization_id=? AND user_id=?'
        ).get(organizationId,recipientUserId))return false;
        if(db.prepare(
          "SELECT count(*) AS n FROM seyveo_employee_invites "+
          "WHERE organization_id=? AND status='pending'"
        ).get(organizationId).n>=20)return false;
        if(db.prepare(
          "SELECT 1 FROM seyveo_employee_invites "+
          "WHERE organization_id=? AND user_id=? AND status='pending'"
        ).get(organizationId,recipientUserId))return false;
        return db.prepare(
          'INSERT INTO seyveo_employee_invites '+
          '(id,organization_id,user_id,employee_login,code_digest,status,issued_at,expires_at) '+
          "VALUES(?,?,?,?,?,'pending',?,?)"
        ).run(invitationId,organizationId,recipientUserId,employeeLogin,
          codeDigest,issuedAt,expiresAt).changes===1;
      });
    }catch{return false;}
  }

  async function revokeInvitationAtomic({
    organizationId,invitationId,actor,assertOwnerActive
  }={}){
    if(!validId(organizationId)||!validId(invitationId)||
       !validActor(actor)||typeof assertOwnerActive!=='function')return false;
    try{
      if(await assertOwnerActive()!==true)return false;
      return atomic(()=>{
        if(!owner(actor,organizationId))return false;
        const time=now();
        if(!timeOk(time))return false;
        return db.prepare(
          "UPDATE seyveo_employee_invites SET status='revoked',ended_at=? "+
          "WHERE id=? AND organization_id=? AND status='pending' AND expires_at>?"
        ).run(time,invitationId,organizationId,time).changes===1;
      });
    }catch{return false;}
  }

  function loadInvitation({codeDigest}={}){
    if(typeof codeDigest!=='string'||!SHA.test(codeDigest))return null;
    try{
      const time=now();
      if(!timeOk(time))return null;
      const row=db.prepare(
        'SELECT id,organization_id,user_id,expires_at FROM seyveo_employee_invites '+
        "WHERE code_digest=? AND status='pending' AND expires_at>?"
      ).get(codeDigest,time);
      return row?{
        id:row.id,organizationId:row.organization_id,
        userId:row.user_id,role:'employee',consumed:false,expiresAt:row.expires_at
      }:null;
    }catch{return null;}
  }

  async function redeemInvitation({
    invitationId,codeDigest,userId,organizationId,role,sessionId
  }={}){
    if(!validId(invitationId)||typeof codeDigest!=='string'||!SHA.test(codeDigest)||
       !validId(userId)||!validId(organizationId)||role!=='employee'||
       !validId(sessionId))return false;
    try{
      return atomic(()=>{
        const time=now();
        if(!timeOk(time)||!session({userId,sessionId},organizationId))return false;
        const row=db.prepare(
          'SELECT employee_login FROM seyveo_employee_invites '+
          'WHERE id=? AND code_digest=? AND organization_id=? AND user_id=? '+
          "AND status='pending' AND expires_at>?"
        ).get(invitationId,codeDigest,organizationId,userId,time);
        if(!row||!recipient(userId,row.employee_login))return false;
        if(db.prepare(
          'SELECT 1 FROM memberships WHERE organization_id=? AND user_id=?'
        ).get(organizationId,userId))return false;
        if(db.prepare(
          "UPDATE seyveo_employee_invites SET status='consumed',ended_at=? "+
          "WHERE id=? AND code_digest=? AND status='pending' AND expires_at>?"
        ).run(time,invitationId,codeDigest,time).changes!==1)return false;
        return db.prepare(
          'INSERT INTO memberships(organization_id,user_id,role,status) '+
          "VALUES(?,?,'employee','active')"
        ).run(organizationId,userId).changes===1;
      });
    }catch{return false;}
  }
  return Object.freeze({
    issueInvitationAtomic,revokeInvitationAtomic,loadInvitation,redeemInvitation
  });
}
