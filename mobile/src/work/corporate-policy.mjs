// SEYVEO corporate authorization model — pure policy engine, NOT server security.
// Server MUST verify identity and membership against its own database per request.
export const ROLE_PERMISSIONS=Object.freeze({
 owner:['org:read','org:manage','members:read','members:invite','members:revoke','roles:assign','tasks:read','tasks:create','tasks:review','files:read'],
 manager:['org:read','members:read','tasks:read','tasks:create','tasks:review','files:read'],
 employee:['tasks:read'],
 logistics:['tasks:read']
});
export function allowed({membership,organizationId,branchId,permission,subjectUserId,resourceAssigneeId}={}){
 if(!membership||membership.status!=='active'||membership.organizationId!==organizationId)return false;
 if(!Object.hasOwn(ROLE_PERMISSIONS,membership.role))return false;
 if(!ROLE_PERMISSIONS[membership.role].includes(permission))return false;
 if(!['owner','manager'].includes(membership.role) &&
    permission==='tasks:read' && resourceAssigneeId!==subjectUserId)return false;
 // Managers are branch-scoped unless explicitly assigned a company-wide scope.
 if(membership.role==='manager' && branchId &&
    !Array.isArray(membership.branchIds))return false;
 if(membership.role==='manager' && branchId &&
    !membership.branchIds.includes(branchId))return false;
 if(['employee','logistics'].includes(membership.role)&&branchId &&
    (!Array.isArray(membership.branchIds)||!membership.branchIds.includes(branchId)))return false;
 return true;
}
export function invitePreview({organizationId,branchId,role,expiresAt}={}){
 if(typeof organizationId!=='string'||!organizationId.trim()||
    typeof branchId!=='string'||!branchId.trim()||
    !Object.hasOwn(ROLE_PERMISSIONS,role)||
    !Number.isSafeInteger(expiresAt)||expiresAt<=Date.now())throw new TypeError('Invalid preview invitation');
 // No token, QR secret or membership is minted client side.
 return Object.freeze({organizationId,branchId,role,expiresAt,status:'preview-only'});
}
