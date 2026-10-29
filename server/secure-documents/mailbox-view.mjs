/**
 * SEYVEO Secure Documents: local-only mailbox projection.
 *
 * The caller must have ALREADY authenticated the actor and verified an active
 * membership for the requested organization. This helper never authenticates
 * users. It performs an extra fail-closed tenant and recipient/creator filter.
 * No bodies, signature material, or authorization tokens are returned.
 */
const allowedStatuses = new Set(['sent','read','acknowledged','approved','returned','revoked']);
const allowedTypes = new Set(['acknowledgement','approval']);
const str = value => typeof value === 'string' && value.length > 0 && value.length <= 128;

export function projectDocumentMailbox({ documents, actor, membership, organizationId, folder } = {}) {
  if (!Array.isArray(documents) ||
      !str(actor?.userId) ||
      !str(organizationId) ||
      membership?.userId !== actor.userId ||
      membership?.organizationId !== organizationId ||
      membership?.status !== 'active' ||
      !['inbox','outbox'].includes(folder)) {
    throw new Error('Mailbox authorization context invalid.');
  }

  const items = [];
  for (const doc of documents) {
    if (!doc || doc.organizationId !== organizationId || !str(doc.id) ||
        !allowedStatuses.has(doc.status) || !allowedTypes.has(doc.type)) continue;
    const expected = folder === 'inbox' ? doc.recipientUserId : doc.creatorUserId;
    if (expected !== actor.userId) continue;

    // Explicit allowlist — never put document body or extra server internals
    // in mailbox responses, even if the storage schema expands in future.
    items.push({
      id:doc.id,
      title:typeof doc.title==='string' ? doc.title.slice(0,120) : 'Документ',
      type:doc.type,
      status:doc.status,
      organizationId,
      createdAt:doc.createdAt,
      updatedAt:doc.updatedAt
    });
  }
  items.sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')) ||
    b.id.localeCompare(a.id));
  const pending = items.filter(doc=>doc.status==='sent'||doc.status==='read').length;
  return { folder, documents:items, total:items.length, pending };
}
