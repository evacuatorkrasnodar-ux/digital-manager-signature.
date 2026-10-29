/**
 * Developer-only, memory-only employee onboarding for SEYVEO Business.
 * This is NOT an identity provider, email service, or production invitation
 * system. Never expose the loopback training server to other devices.
 */
import {randomBytes, randomUUID, createHash} from 'node:crypto';

const LOGIN=/^[a-z][a-z0-9_-]{2,31}$/;
const SECRET=/^[A-Za-z0-9_-]{43}$/;
const MAX_PENDING=20;
const INVITE_MS=15*60*1000;
const MAX_REDEEM_ATTEMPTS=10;
const REDEEM_WINDOW_MS=60*1000;
const digest=value=>createHash('sha256').update(value).digest('hex');

export function createTrainingInvitations({
  users,memberships,organizationId,makeEmployeeAccount,
  revokeSessions=()=>{},now=Date.now
}={}){
  if(!(users instanceof Map)||!(memberships instanceof Map)||
    typeof organizationId!=='string'||typeof makeEmployeeAccount!=='function'||
    typeof revokeSessions!=='function'||typeof now!=='function')
    throw new TypeError('Training invitation dependencies are required.');
  const pending=new Map();
  let attempts=[];

  const cleanup=()=>{
    const time=now();
    for(const [id,item] of pending){
      if(item.expiresAt<=time)pending.delete(id);
    }
  };
  function create({actorUserId,employeeLogin}={}){
    if(actorUserId!=='owner')throw new Error('Only the fictional owner can invite employees.');
    if(typeof employeeLogin!=='string'||!LOGIN.test(employeeLogin)||
      users.has(employeeLogin)||Array.from(pending.values()).some(x=>x.employeeLogin===employeeLogin))
      throw new Error('Invalid or unavailable training login.');
    cleanup();
    if(pending.size>=MAX_PENDING)throw new Error('Too many pending training invitations.');
    const code=randomBytes(32).toString('base64url');
    const entry=Object.freeze({
      id:randomUUID(),employeeLogin,organizationId,
      codeDigest:digest(code),expiresAt:now()+INVITE_MS
    });
    pending.set(entry.id,entry);
    // Code is emitted exactly once and never stored in plaintext.
    return {invitation:{
      id:entry.id,employeeLogin,expiresAt:new Date(entry.expiresAt).toISOString()
    },code};
  }
  function cancel({actorUserId,invitationId}={}){
    if(actorUserId!=='owner')throw new Error('Only the fictional owner can cancel invitations.');
    const entry=pending.get(invitationId);
    if(!entry)throw new Error('Training invitation not found.');
    pending.delete(invitationId);
  }
  function redeem({code,password}={}){
    const time=now();
    attempts=attempts.filter(t=>time-t<REDEEM_WINDOW_MS);
    if(attempts.length>=MAX_REDEEM_ATTEMPTS)
      throw new Error('Too many training invitation attempts.');
    attempts.push(time);
    if(typeof code!=='string'||!SECRET.test(code))
      throw new Error('Invalid or expired training invitation.');
    cleanup();
    const suppliedDigest=digest(code);
    const entry=Array.from(pending.values()).find(x=>x.codeDigest===suppliedDigest);
    if(!entry||users.has(entry.employeeLogin)||memberships.has(entry.employeeLogin))
      throw new Error('Invalid or expired training invitation.');
    // Validate and hash the password BEFORE changing the member registry.
    const account=makeEmployeeAccount(entry.employeeLogin,password);
    if(!account||account.userId!==entry.employeeLogin||account.role!=='employee')
      throw new Error('Invalid employee account.');
    users.set(entry.employeeLogin,account);
    memberships.set(entry.employeeLogin,Object.freeze({
      userId:entry.employeeLogin,organizationId,role:'employee',status:'active'
    }));
    pending.delete(entry.id);
    return {user:{id:entry.employeeLogin,organizationId,role:'employee'}};
  }
  function members({actorUserId}={}){
    if(actorUserId!=='owner')throw new Error('Only the fictional owner can list members.');
    return Array.from(memberships.values()).map(m=>({
      userId:m.userId,role:m.role,status:m.status
    })).sort((a,b)=>a.userId.localeCompare(b.userId));
  }
  function revoke({actorUserId,userId}={}){
    if(actorUserId!=='owner'||userId==='owner')throw new Error('Only the owner can revoke employees.');
    const current=memberships.get(userId);
    if(!current||current.status!=='active'||current.role==='owner')
      throw new Error('Employee is not active.');
    memberships.set(userId,Object.freeze({...current,status:'revoked'}));
    revokeSessions(userId);
    // Reinstatement is intentionally not available in this training module.
  }
  return Object.freeze({create,cancel,redeem,members,revoke});
}
