export type WorkspaceRole='owner'|'admin'|'manager'|'employee';
export interface VerifiedWorkspace {
  id:string;
  organizationId:string;
  name:string;
  kind:'business';
  role:WorkspaceRole;
  navigation:'work'|'cabinet';
}
export interface VerifiedWorkspaceManifest {
  kind:'verified-workspace-manifest';
  version:1;
  personal:{id:'personal';kind:'personal'};
  workspaces:VerifiedWorkspace[];
  activeWorkspaceId:null;
  issuedAt:number;
}
export type WorkspaceNavigation={
  mode:'personal'|'employee'|'manager';
  activeWorkspaceId:string|null;
  tabs:ReadonlyArray<'personal'|'calendar'|'employee'|'business'>;
  workspaces:ReadonlyArray<VerifiedWorkspace>;
  showWorkSwitch:boolean;
};
export function deriveWorkspaceNavigation(
  manifest:VerifiedWorkspaceManifest|null|unknown,
  activeWorkspaceId?:string|null
):WorkspaceNavigation;
