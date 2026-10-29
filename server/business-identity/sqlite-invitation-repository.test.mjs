import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync,readFileSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {createSqliteInvitationRepository} from './sqlite-invitation-repository.mjs';
import {createBusinessIdentityBoundary} from './identity-boundary.mjs';
import {createOwnerInvitationHttpContract} from './owner-invitation-http.mjs';
import {createHttpsOwnerInviteClient}
  from '../../mobile/src/business/https-owner-invite-client.mjs';

const origin='https://business.seyveo.example';
const linkBase='https://join.seyveo.example/join/employee/';
const org='company-1';
const ownerToken='O'.repeat(48);
const elenaToken='E'.repeat(48);
const tanyaToken='T'.repeat(48);
const baseTime=Date.parse('2026-10-29T12:00:00Z');
const digest=code=>createHash('sha256').update(code).digest('hex');
const issuedCode=()=>randomBytes(32).toString('base64url');

function fixture(t){
  let clock=baseTime;
  const dir=mkdtempSync(join(tmpdir(),'seyveo-sqlite-invite-'));
  const filepath=join(dir,'staging.sqlite');
  let db=null;
  const now=()=>clock;
  const open=()=>{
    db=new DatabaseSync(filepath);
    db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=3000; PRAGMA journal_mode=DELETE;');
    db.exec([
      'CREATE TABLE IF NOT EXISTS people (',
      'user_id TEXT PRIMARY KEY, employee_login TEXT UNIQUE,',
      'verified INTEGER NOT NULL, active INTEGER NOT NULL);',
      'CREATE TABLE IF NOT EXISTS memberships (',
      'organization_id TEXT NOT NULL, user_id TEXT NOT NULL,',
      'role TEXT NOT NULL, status TEXT NOT NULL,',
      'PRIMARY KEY(organization_id,user_id));',
      'CREATE TABLE IF NOT EXISTS active_sessions (',
      'token_digest TEXT PRIMARY KEY, user_id TEXT NOT NULL,',
      'session_id TEXT NOT NULL, expires_at INTEGER NOT NULL,',
      'revoked INTEGER NOT NULL);'
    ].join(' '));
    return db;
  };
  const connection=open();
  connection.prepare('INSERT INTO people VALUES(?,?,1,1)').run('owner','owner');
  connection.prepare('INSERT INTO people VALUES(?,?,1,1)').run('elena','elena');
  connection.prepare('INSERT INTO people VALUES(?,?,1,1)').run('tanya','tanya');
  connection.prepare("INSERT INTO memberships VALUES(?,?,'owner','active')").run(org,'owner');
  connection.prepare("INSERT INTO memberships VALUES(?,?,'employee','active')").run(org,'elena');
  const persons=[
    [ownerToken,'owner','session-owner'],
    [elenaToken,'elena','session-elena'],
    [tanyaToken,'tanya','session-tanya']
  ];
  for(const [token,userId,sessionId] of persons){
    connection.prepare('INSERT INTO active_sessions VALUES(?,?,?,?,0)').run(
      digest(token),userId,sessionId,baseTime+3_600_000
    );
  }
  const checkSessionInTx=({db,actor,now})=>{
    // In a production design the verified session registry must be backed
    // by the SAME trusted transaction and token-revocation mechanism.
    return !!db.prepare(
      'SELECT 1 FROM active_sessions WHERE user_id=? AND session_id=? '+
      'AND revoked=0 AND expires_at>?'
    ).get(actor.userId,actor.sessionId,now);
  };
  const checkRecipientInTx=({db,userId,employeeLogin})=>{
    return !!db.prepare(
      'SELECT 1 FROM people WHERE user_id=? AND employee_login=? '+
      'AND verified=1 AND active=1'
    ).get(userId,employeeLogin);
  };
  const build=()=>{
    const repository=createSqliteInvitationRepository({
      db,now,checkSessionInTx,checkRecipientInTx
    });
    const identity=createBusinessIdentityBoundary({
      now,
      verifySession:async token=>{
        const row=db.prepare(
          'SELECT user_id,session_id,expires_at,revoked FROM active_sessions '+
          'WHERE token_digest=?'
        ).get(digest(token));
        return row?{
          userId:row.user_id,sessionId:row.session_id,
          expiresAt:row.expires_at,revoked:row.revoked!==0,
          audience:'seyveo-native',subjectType:'person'
        }:null;
      },
      loadMembership:async ({organizationId,userId})=>{
        const m=db.prepare(
          'SELECT organization_id AS organizationId,user_id AS userId,role,status '+
          'FROM memberships WHERE organization_id=? AND user_id=?'
        ).get(organizationId,userId);
        return m||null;
      },
      loadDocument:async()=>null,
      loadInvitation:repository.loadInvitation,
      redeemInvitation:repository.redeemInvitation
    });
    const service=createOwnerInvitationHttpContract({
      apiOrigin:origin,identity,
      now,
      resolveVerifiedRecipient:async ({employeeLogin})=>{
        const p=db.prepare(
          'SELECT user_id,verified,active FROM people WHERE employee_login=?'
        ).get(employeeLogin);
        return p?{
          userId:p.user_id,verified:p.verified===1,active:p.active===1
        }:null;
      },
      issueInvitationAtomic:repository.issueInvitationAtomic,
      revokeInvitationAtomic:repository.revokeInvitationAtomic
    });
    const native=createHttpsOwnerInviteClient({
      apiOrigin:origin,organizationId:org,
      inviteLinkBase:linkBase,now,
      getSession:async()=>({
        token:ownerToken,sessionId:'session-owner',organizationId:org,
        expiresAt:baseTime+3_600_000
      }),
      fetchImpl:async (url,init)=>service.handle(new Request(url,init))
    });
    const accept=(code,token)=>service.handle(new Request(
      origin+'/v1/invitations/accept',{
        method:'POST',headers:{
          Authorization:'Bearer '+token,'Content-Type':'application/json'
        },body:JSON.stringify({code})
      }
    ));
    return {repository,identity,service,native,accept};
  };
  t.after(()=>{
    try{db?.close()}catch{}
    rmSync(dir,{recursive:true,force:true});
  });
  return {
    get db(){return db},
    filepath,build,now,
    advance:delta=>{clock+=delta},
    close:()=>{db.close();db=null},
    reopen:()=>{open()},
    code:issuedCode
  };
}

test('SQLite persists a verified-owner employee invite across DB restart and consumes only once',async t=>{
  const h=fixture(t),one=h.build();
  const result=await one.native.create({employeeLogin:'tanya'});
  assert.equal(result.status,'issued');
  const code=result.serverResponse.code;
  const inviteId=result.serverResponse.invitation.id;
  const row=h.db.prepare('SELECT * FROM seyveo_employee_invites WHERE id=?').get(inviteId);
  assert.equal(row.status,'pending');
  assert.equal(row.role,undefined);
  assert.equal(row.code_digest,digest(code));
  assert.equal(JSON.stringify(row).includes(code),false);
  const disk=readFileSync(h.filepath);
  assert.equal(disk.includes(Buffer.from(code)),false);
  h.close();h.reopen();
  const two=h.build();
  assert.equal(two.repository.loadInvitation({codeDigest:digest(code)}).id,inviteId);
  assert.equal((await two.accept(code,elenaToken)).status,409);
  assert.equal((await two.accept(code,tanyaToken)).status,201);
  assert.equal((await two.accept(code,tanyaToken)).status,409);
  const membership=h.db.prepare(
    'SELECT role,status FROM memberships WHERE organization_id=? AND user_id=?'
  ).get(org,'tanya');
  assert.equal(membership.role,'employee');
  assert.equal(membership.status,'active');
  assert.equal(two.repository.loadInvitation({codeDigest:digest(code)}),null);
  h.close();h.reopen();
  assert.equal(h.build().repository.loadInvitation({codeDigest:digest(code)}),null);
});

test('canceled invitations stay revoked across restart and never grant membership',async t=>{
  const h=fixture(t),one=h.build();
  const created=await one.native.create({employeeLogin:'tanya'});
  assert.equal(created.status,'issued');
  assert.deepEqual(await one.native.cancel({
    invitationId:created.serverResponse.invitation.id
  }),{status:'cancelled'});
  h.close();h.reopen();
  const two=h.build();
  assert.equal((await two.accept(created.serverResponse.code,tanyaToken)).status,409);
  assert.equal(h.db.prepare('SELECT status FROM seyveo_employee_invites').get().status,'revoked');
  assert.equal(h.db.prepare(
    'SELECT 1 FROM memberships WHERE organization_id=? AND user_id=?'
  ).get(org,'tanya'),undefined);
});

test('revoked director account/session cannot create or revoke, even if authorization was previously valid',async t=>{
  const h=fixture(t),flow=h.build();
  h.db.prepare("UPDATE active_sessions SET revoked=1 WHERE user_id='owner'").run();
  assert.deepEqual(await flow.native.create({employeeLogin:'tanya'}),{
    status:'not-authorized'
  });
  const actor={userId:'owner',sessionId:'session-owner'};
  assert.equal(await flow.repository.issueInvitationAtomic({
    invitationId:'invite-forged',codeDigest:digest(h.code()),
    organizationId:org,employeeLogin:'tanya',recipientUserId:'tanya',
    role:'employee',issuedAt:baseTime,expiresAt:baseTime+900000,
    actor,assertOwnerActive:async()=>true
  }),false);
  assert.equal(await flow.repository.revokeInvitationAtomic({
    organizationId:org,invitationId:'invite-forged',actor,
    assertOwnerActive:async()=>true
  }),false);
  assert.equal(h.db.prepare('SELECT count(*) AS n FROM seyveo_employee_invites').get().n,0);
});

test('owner membership downgrade is enforced by SQLite inside each atomic transaction',async t=>{
  const h=fixture(t),flow=h.build();
  h.db.prepare(
    "UPDATE memberships SET role='manager' WHERE user_id='owner'"
  ).run();
  assert.equal(await flow.repository.issueInvitationAtomic({
    invitationId:'forged-invite',codeDigest:digest(h.code()),
    organizationId:org,employeeLogin:'tanya',recipientUserId:'tanya',
    role:'employee',issuedAt:baseTime,expiresAt:baseTime+900000,
    actor:{userId:'owner',sessionId:'session-owner'},
    assertOwnerActive:async()=>true
  }),false);
});

test('revoked recipient account/session never obtains employment membership',async t=>{
  const h=fixture(t),flow=h.build();
  const created=await flow.native.create({employeeLogin:'tanya'});
  assert.equal(created.status,'issued');
  h.db.prepare("UPDATE active_sessions SET revoked=1 WHERE user_id='tanya'").run();
  assert.equal((await flow.accept(created.serverResponse.code,tanyaToken)).status,409);
  h.db.prepare("UPDATE active_sessions SET revoked=0 WHERE user_id='tanya'").run();
  h.db.prepare("UPDATE people SET active=0 WHERE user_id='tanya'").run();
  assert.equal((await flow.accept(created.serverResponse.code,tanyaToken)).status,409);
  assert.equal(h.db.prepare("SELECT 1 FROM memberships WHERE user_id='tanya'").get(),undefined);
});

test('expiry and duplicate prevention survive restart, allow new invite after expiry',async t=>{
  const h=fixture(t),flow=h.build();
  const created=await flow.native.create({employeeLogin:'tanya'});
  assert.equal(created.status,'issued');
  assert.equal((await flow.native.create({employeeLogin:'tanya'})).status,'conflict');
  h.advance(900001);
  h.close();h.reopen();
  const second=h.build();
  assert.equal((await second.accept(created.serverResponse.code,tanyaToken)).status,409);
  const renewed=await second.native.create({employeeLogin:'tanya'});
  assert.equal(renewed.status,'issued');
  assert.notEqual(created.serverResponse.code,renewed.serverResponse.code);
  assert.equal(h.db.prepare(
    "SELECT count(*) AS n FROM seyveo_employee_invites WHERE status='expired'"
  ).get().n,1);
});

test('SQLite failure midway through membership creation rolls back consumption',async t=>{
  const h=fixture(t),flow=h.build();
  const created=await flow.native.create({employeeLogin:'tanya'});
  assert.equal(created.status,'issued');
  h.db.exec(
    "CREATE TRIGGER deny_tanya_insert BEFORE INSERT ON memberships "+
    "WHEN NEW.user_id='tanya' BEGIN SELECT RAISE(ABORT,'simulated failure'); END;"
  );
  assert.equal((await flow.accept(created.serverResponse.code,tanyaToken)).status,409);
  assert.equal(h.db.prepare(
    'SELECT status FROM seyveo_employee_invites WHERE id=?'
  ).get(created.serverResponse.invitation.id).status,'pending');
  assert.equal(h.db.prepare("SELECT 1 FROM memberships WHERE user_id='tanya'").get(),undefined);
});

test('SQLite storage denies role forgery, wrong principal and forged session',async t=>{
  const h=fixture(t),repo=h.build().repository;
  const base={
    invitationId:'attempt-1',codeDigest:digest(h.code()),
    organizationId:org,employeeLogin:'tanya',recipientUserId:'tanya',
    role:'employee',issuedAt:baseTime,expiresAt:baseTime+900000,
    actor:{userId:'owner',sessionId:'session-owner'},
    assertOwnerActive:async()=>true
  };
  for(const change of [
    {role:'owner'},
    {actor:{userId:'elena',sessionId:'session-elena'}},
    {actor:{userId:'owner',sessionId:'invented-session'}},
    {organizationId:'another-company'},
    {recipientUserId:'owner'},
    {codeDigest:'not-a-digest'}
  ]){
    assert.equal(await repo.issueInvitationAtomic({...base,...change}),false);
  }
  assert.equal(h.db.prepare('SELECT count(*) AS n FROM seyveo_employee_invites').get().n,0);
});

test('SQLite rejects owner-approval promises from unsynchronized identity checks',async t=>{
  const h=fixture(t),repo=h.build().repository;
  const actor={userId:'owner',sessionId:'session-owner'};
  const result=await repo.issueInvitationAtomic({
    invitationId:'attempt',codeDigest:digest(h.code()),organizationId:org,
    employeeLogin:'tanya',recipientUserId:'tanya',
    role:'employee',issuedAt:baseTime,expiresAt:baseTime+900000,
    actor,assertOwnerActive:async()=>true
  });
  assert.equal(result,true);
  const r=h.db.prepare('SELECT status FROM seyveo_employee_invites').get();
  assert.equal(r.status,'pending');
  // Verify the callbacks are required to report literal true rather than
  // a Promise; otherwise database code must deny the transaction.
  const invalid=createSqliteInvitationRepository({
    db:h.db,now:h.now,
    checkSessionInTx:async()=>true,
    checkRecipientInTx:()=>true
  });
  assert.equal(await invalid.revokeInvitationAtomic({
    organizationId:org,invitationId:'attempt',actor,
    assertOwnerActive:async()=>true
  }),false);
  assert.equal(h.db.prepare('SELECT status FROM seyveo_employee_invites').get().status,'pending');
});
