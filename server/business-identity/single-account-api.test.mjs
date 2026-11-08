import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createSingleAccountApi} from './single-account-api.mjs';

const origin='https://api.seyveo.example';
const now=Date.parse('2026-11-08T12:00:00Z');
const ownerToken='O'.repeat(48);
const employeeToken='E'.repeat(48);
const outsiderToken='X'.repeat(48);
const digest=s=>createHash('sha256').update(s).digest('hex');

function fixture(){
  let enabled=true;
  const memberships=new Map([['owner:shop-1','owner']]);
  const pending=new Map();
  const principal=token=>enabled&&token!==outsiderToken?(
    token===ownerToken?{userId:'owner',sessionId:'owner-s1'}:
    token===employeeToken?{userId:'elena',sessionId:'elena-s1'}:null
  ):null;
  const identity={
    identifyVerifiedPerson:async({token})=>principal(token),
    canAccessBusiness:async({token,organizationId,operation})=>{
      const p=principal(token);
      const role=p&&memberships.get(p.userId+':'+organizationId);
      if(!role)return false;
      if(operation==='view-workspace')return true;
      if(operation==='invite-employee')return role==='owner';
      return false;
    },
    acceptVerifiedInvitation:async({token,code})=>{
      const p=principal(token);
      const pendingInvite=pending.get(digest(code));
      if(!p||!pendingInvite||pendingInvite.used||
         pendingInvite.userId!==p.userId||
         pendingInvite.expiresAt<=now)return false;
      pendingInvite.used=true;
      memberships.set(p.userId+':'+pendingInvite.organizationId,'employee');
      return true;
    }
  };
  const api=createSingleAccountApi({
    apiOrigin:origin,identity,now:()=>now,
    listCurrentMemberships:async({userId})=>[...memberships.entries()]
      .filter(([key])=>key.startsWith(userId+':'))
      .map(([key,role])=>{
        const organizationId=key.slice(userId.length+1);
        return {
          userId,organizationId,membershipId:'member-'+userId+'-'+organizationId,
          organizationName:'Учебный магазин',role,status:'active'
        };
      }),
    resolveVerifiedRecipient:async({employeeLogin})=>
      employeeLogin==='elena'?{userId:'elena',verified:true,active:true}:null,
    issueInvitationAtomic:async({
      codeDigest,organizationId,recipientUserId,role,
      expiresAt,actor,assertOwnerActive
    })=>{
      if(!(await assertOwnerActive())||actor.userId!=='owner'||
         recipientUserId!=='elena'||role!=='employee')return false;
      pending.set(codeDigest,{
        organizationId,userId:recipientUserId,expiresAt,used:false
      });
      return true;
    },
    revokeInvitationAtomic:async()=>false,
    random:()=>new Uint8Array(32).fill(7),
    makeId:()=> 'invitation-one'
  });
  const request=(path,method,token,body)=>api.handle(new Request(origin+path,{
    method,headers:{
      ...(token?{Authorization:'Bearer '+token}:{}),
      ...(body?{'Content-Type':'application/json'}:{})
    },...(body?{body:JSON.stringify(body)}:{})
  }));
  return {api,request,disable:()=>{enabled=false;},memberships};
}

test('ONE stays personal until owner issues and employee redeems one-use invite',async()=>{
  const f=fixture();
  const path='/v1/me/workspaces';
  const initial=await f.request(path,'GET',employeeToken);
  assert.equal(initial.status,200);
  assert.deepEqual((await initial.json()).workspaces,[]);
  const issued=await f.request('/v1/organizations/shop-1/invitations',
    'POST',ownerToken,{employeeLogin:'elena'});
  assert.equal(issued.status,201);
  const created=await issued.json();
  assert.equal(created.code.length,43);
  assert.equal(created.invitation.employeeLogin,'elena');
  assert.equal(created.invitation.expiresAt,new Date(now+900000).toISOString());
  const invite=await f.request('/v1/invitations/accept','POST',
    employeeToken,{code:created.code});
  assert.equal(invite.status,201);
  assert.deepEqual(await invite.json(),{ok:true});
  const after=await f.request(path,'GET',employeeToken);
  assert.equal(after.status,200);
  const snapshot=await after.json();
  assert.deepEqual(snapshot.workspaces.map(w=>[w.role,w.navigation,w.organizationId]),[
    ['employee','work','shop-1']
  ]);
  assert.equal(snapshot.personal.id,'personal');
  assert.equal(snapshot.activeWorkspaceId,null);
  const replay=await f.request('/v1/invitations/accept','POST',
    employeeToken,{code:created.code});
  assert.equal(replay.status,409);
  assert.equal((await f.request(path,'GET',employeeToken)).status,200);
});
test('stranger cannot steal code, become owner or see employee membership',async()=>{
  const f=fixture();
  const issued=await f.request('/v1/organizations/shop-1/invitations',
    'POST',ownerToken,{employeeLogin:'elena'});
  const {code}=await issued.json();
  assert.equal((await f.request('/v1/invitations/accept','POST',
    outsiderToken,{code})).status,409);
  const employee=await f.request('/v1/me/workspaces','GET',employeeToken);
  assert.deepEqual((await employee.json()).workspaces,[]);
  const forge=await f.request('/v1/organizations/shop-1/invitations',
    'POST',employeeToken,{employeeLogin:'elena',role:'owner'});
  assert.equal(forge.status,403);
});
test('invalid identity, unknown routes and broken request do not create a workspace',async()=>{
  const f=fixture();
  assert.equal((await f.request('/v1/me/workspaces','GET',null)).status,401);
  assert.equal((await f.request('/v1/me/secret','GET',employeeToken)).status,404);
  assert.equal((await f.request('/v1/me/workspaces?role=owner','GET',
    employeeToken)).status,403);
  assert.equal((await f.api.handle(null)).status,400);
  f.disable();
  assert.equal((await f.request('/v1/me/workspaces','GET',ownerToken)).status,401);
});
