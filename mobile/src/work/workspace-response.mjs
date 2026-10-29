// The UI stays closed until a matching server response is received.
export function workspaceResponse(data, userId, organizationId) {
  if (data?.serverVerified !== true || data?.trainingOnly !== false) return null;
  if (data.work?.userId !== userId || data.work?.organizationId !== organizationId) return null;
  if (data.work?.status !== 'active') return null;
  if (!['owner', 'manager', 'employee', 'logistics'].includes(data.work?.role)) return null;
  return { organizationId, role: data.work.role };
}
