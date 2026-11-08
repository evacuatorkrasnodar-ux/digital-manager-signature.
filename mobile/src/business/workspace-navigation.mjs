/**
 * SEYVEO ONE, family and company navigation model for a SINGLE native app.
 *
 * Presentation helper ONLY. It does not verify token signatures, authorize
 * corporate operations, activate invitations, persist credentials or change
 * the approved dock. Its input must come from the signed-in HTTPS session's
 * /v1/me/workspaces response, never PWA preview roles or local storage.
 *
 * Without a verified server manifest the only safe display is personal ONE.
 * Family membership will be added only after its own trusted backend exists.
 */
const ID=/^[A-Za-z0-9_-]{1,96}$/;
const ROLES=new Set(['owner','admin','manager','employee']);
const PERSONAL=Object.freeze({
  mode:'personal',activeWorkspaceId:null,
  tabs:Object.freeze(['personal','calendar']),
  workspaces:Object.freeze([]),
  showWorkSwitch:false
});
const validId=x=>typeof x==='string'&&ID.test(x);
const validName=x=>typeof x==='string'&&x.trim().length>0&&
  x.trim().length<=80&&!/[\u0000-\u001f\u007f]/.test(x);

export function deriveWorkspaceNavigation(manifest,activeWorkspaceId=null){
  if(!manifest||manifest.kind!=='verified-workspace-manifest'||
     manifest.version!==1||manifest.personal?.id!=='personal'||
     manifest.personal?.kind!=='personal'||!Array.isArray(manifest.workspaces)||
     manifest.workspaces.length>32||!Number.isSafeInteger(manifest.issuedAt))
    return PERSONAL;
  const ids=new Set(),tenants=new Set();
  const rows=[];
  for(const row of manifest.workspaces){
    if(!row||!validId(row.id)||!validId(row.organizationId)||
       !validName(row.name)||row.kind!=='business'||
       !ROLES.has(row.role)||ids.has(row.id)||
       tenants.has(row.organizationId)||
       row.navigation!==(row.role==='employee'?'work':'cabinet'))
      return PERSONAL;
    ids.add(row.id);tenants.add(row.organizationId);
    rows.push(Object.freeze({
      id:row.id,organizationId:row.organizationId,
      name:row.name,kind:'business',role:row.role,
      navigation:row.navigation
    }));
  }
  const selected=rows.find(row=>row.id===activeWorkspaceId)||null;
  const mode=selected?selected.navigation==='work'?'employee':'manager':'personal';
  const tabs=selected
    ?selected.navigation==='work'
      ?['personal','calendar','employee']
      :['personal','calendar','business']
    :['personal','calendar'];
  return Object.freeze({
    mode,activeWorkspaceId:selected?.id??null,
    tabs:Object.freeze(tabs),
    workspaces:Object.freeze(rows),
    showWorkSwitch:rows.length>0
  });
}
