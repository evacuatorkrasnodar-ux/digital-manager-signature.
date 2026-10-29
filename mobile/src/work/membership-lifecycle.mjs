// Offline contract for the future server membership lifecycle.
// This is a pure state machine: no identities verified and no access issued.
const STATES=new Set(['invited','active','revoked']);
export function transitionMembership(current,action){
 if(!current||!STATES.has(current.status)||!['accept','revoke'].includes(action))throw new TypeError('Invalid membership transition');
 if(action==='accept'){
  if(current.status!=='invited')return {ok:false,reason:'not-invited'};
  return {ok:true,membership:{...current,status:'active'}};
 }
 if(current.status==='revoked')return {ok:false,reason:'already-revoked'};
 return {ok:true,membership:{...current,status:'revoked'}};
}
export function validateMembershipRecord(record){
 return !!(record&&typeof record.organizationId==='string'&&record.organizationId.length>0&&
   typeof record.userId==='string'&&record.userId.length>0&&
   typeof record.role==='string'&&Array.isArray(record.branchIds)&&
   record.branchIds.every(v=>typeof v==='string'&&v.length>0)&&STATES.has(record.status));
}
