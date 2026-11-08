'use strict';

/**
 * SEYVEO Business — server-side authorization policy prototype.
 *
 * IMPORTANT: actor MUST be hydrated by a trusted server from an authenticated
 * session and membership/role rows in the database. NEVER pass request JSON,
 * SEYVEO_PREVIEW or a browser-supplied role into this module as actor.
 * This module does not implement authentication, sessions, signing or storage.
 */
const ROLE_ACTIONS=Object.freeze({
  owner:['org.read','members.list','members.invite','members.roles.assign','members.revoke','documents.read','documents.edit','documents.assign','documents.approve','documents.send','tasks.read','tasks.assign','schedule.read','schedule.manage'],
  org_admin:['org.read','members.list','members.invite','members.revoke','documents.read','documents.edit','documents.assign','documents.approve','tasks.read','tasks.assign','schedule.read','schedule.manage'],
  hr:['org.read','members.list','members.invite','documents.read','documents.edit','documents.approve','tasks.read','schedule.read','schedule.manage'],
  accountant:['org.read','documents.read','documents.edit','documents.approve','tasks.read'],
  lawyer:['org.read','documents.read','documents.edit','documents.approve'],
  store_manager:['org.read','members.list','members.invite','documents.read','documents.edit','documents.approve','tasks.read','tasks.assign','schedule.read','schedule.manage'],
  assistant:['org.read','documents.read','tasks.read','tasks.assign','schedule.read'],
  employee:['org.read','documents.read','documents.approve','tasks.read','schedule.read']
});
const GLOBAL_ROLES=new Set(['owner','org_admin','hr','accountant','lawyer']);
const PERSONAL_CLASSES=new Set(['personal','personal-vault','private-life']);
const DOC_ACTIONS=new Set(['documents.read','documents.edit','documents.assign','documents.approve','documents.send']);
const STAFF_CLASSES=Object.freeze({
  hr:new Set(['hr']),
  accountant:new Set(['finance']),
  lawyer:new Set(['legal']),
  store_manager:new Set(['general','operations']),
  assistant:new Set(['general','operations']),
  employee:new Set(['general','operations','hr'])
});
const deny=(reason)=>Object.freeze({allowed:false,reason});
const allow=Object.freeze({allowed:true,reason:'permitted'});
const validId=value=>typeof value==='string'&&value.length>0&&value.length<=128;

function inScope(grant,resource){
  if(GLOBAL_ROLES.has(grant.role)){
    if(grant.branchId&&resource.branchId!==grant.branchId)return false;
    if(grant.departmentId&&resource.departmentId!==grant.departmentId)return false;
    return true;
  }
  // A branchless scoped role MUST NOT accidentally become organization-wide.
  if(!validId(grant.branchId)||resource.branchId!==grant.branchId)return false;
  if(grant.departmentId&&resource.departmentId!==grant.departmentId)return false;
  return true;
}
function isAssigned(actor,resource){
  return resource.assigneeUserId===actor.userId||resource.ownerUserId===actor.userId;
}
function matchesRole(actor,grant,action,resource){
  if(!ROLE_ACTIONS[grant.role]?.includes(action))return false;
  if(!inScope(grant,resource))return false;
  const isDocument=DOC_ACTIONS.has(action);
  if(isDocument){
    const cls=resource.classification||'general';
    if(grant.role==='employee'){
      if(!isAssigned(actor,resource))return false;
      if(action==='documents.approve'&&resource.assigneeUserId!==actor.userId)return false;
      if(!['documents.read','documents.approve'].includes(action))return false;
    }else if(STAFF_CLASSES[grant.role]){
      const permitted=STAFF_CLASSES[grant.role].has(cls);
      const explicitlyAssigned=isAssigned(actor,resource);
      if(!permitted&&!explicitlyAssigned)return false;
      if(grant.role==='assistant'&&action!=='documents.read')return false;
      if(['store_manager','accountant','lawyer','hr'].includes(grant.role)&&
        cls!=='general'&&!permitted)return false;
    }
  }
  if(action==='tasks.read'&&grant.role==='employee'&&!isAssigned(actor,resource))return false;
  if(action==='schedule.read'&&grant.role==='employee'&&resource.userId!==actor.userId)return false;
  if(action==='members.invite'&&grant.role==='store_manager'&&!resource.branchId)return false;
  return true;
}

/**
 * Each request must be scoped to exactly one organization and one authenticated
 * active user; unknown actions, deleted memberships, and personal vaults deny.
 */
function checkPermission(actor,action,resource){
  if(!actor||!resource||!validId(actor.userId)||!validId(actor.organizationId)||
     actor.membershipStatus!=='active')return deny('inactive-or-unauthenticated');
  if(!validId(resource.organizationId)||resource.organizationId!==actor.organizationId)
    return deny('organization-mismatch');
  if(!Object.values(ROLE_ACTIONS).some(actions=>actions.includes(action)))
    return deny('action-unsupported');
  if(PERSONAL_CLASSES.has(resource.classification))return deny('private-data');
  const grants=Array.isArray(actor.grants)?actor.grants:[];
  if(grants.some(grant=>grant&&matchesRole(actor,grant,action,resource)))return allow;
  return deny('not-authorized');
}

/** Role template assignment is distinct from merely inviting someone. */
function checkInviteRole(actor,resource,roleToInvite){
  const permission=checkPermission(actor,'members.invite',resource);
  if(!permission.allowed)return permission;
  if(!Object.hasOwn(ROLE_ACTIONS,roleToInvite)||roleToInvite==='owner')
    return deny('role-requires-owner-transfer');
  const grants=actor.grants||[];
  if(grants.some(g=>g.role==='owner'&&inScope(g,resource)))return allow;
  // No non-owner can appoint a privileged role through mass invitations.
  if(roleToInvite!=='employee')return deny('elevated-role-requires-owner');
  return allow;
}

module.exports=Object.freeze({checkPermission,checkInviteRole,ROLE_ACTIONS});
