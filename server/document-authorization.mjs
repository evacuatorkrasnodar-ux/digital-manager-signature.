/**
 * SEYVEO Business document authorization — server-side policy foundation.
 *
 * WARNING: This is NOT authentication, a server or end-to-end encryption.
 * actor MUST come from a server-verified session, while membership MUST be
 * queried by the server for every request. Never pass client-provided roles
 * into this function. Re-check authorization within a DB transaction when
 * making a change and apply tenant filtering to every DB query.
 */
const EDITORS = new Set(['owner', 'admin', 'manager']);
const ROLES = new Set(['owner', 'admin', 'manager', 'employee']);
const TYPES = new Set(['acknowledgement', 'approval']);
const STATUSES = new Set(['sent', 'read', 'acknowledged', 'approved', 'returned', 'revoked']);

function validId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128;
}

function validMembership(actor, membership, organizationId) {
  return !!(
    actor && validId(actor.userId) &&
    membership && validId(membership.userId) &&
    membership.userId === actor.userId &&
    validId(organizationId) &&
    membership.organizationId === organizationId &&
    membership.status === 'active' &&
    ROLES.has(membership.role)
  );
}

function validDocument(document) {
  return !!(document && validId(document.id) &&
    validId(document.organizationId) && validId(document.creatorUserId) &&
    validId(document.recipientUserId) &&
    TYPES.has(document.type) && STATUSES.has(document.status));
}

/** Checks creation permission, NOT that the proposed recipient exists.
 * The server must verify the recipient has active membership in this tenant.
 */
export function canCreateDocument({ actor, membership, organizationId } = {}) {
  return validMembership(actor, membership, organizationId) &&
    EDITORS.has(membership.role);
}

/** Read is deliberately narrower than "all managers in this company".
 * Only org owners/admins, document creator, and designated recipient.
 */
export function canReadDocument({ actor, membership, document } = {}) {
  if (!validDocument(document) ||
      !validMembership(actor, membership, document.organizationId)) return false;
  return membership.role === 'owner' || membership.role === 'admin' ||
    actor.userId === document.creatorUserId ||
    actor.userId === document.recipientUserId;
}

/**
 * An audit trail is readable only by users who could read the document;
 * audit writes must happen inside an atomic database transaction, never
 * through a client-selectable audit append endpoint.
 */
export function canReadDocumentAudit(context = {}) {
  return canReadDocument(context);
}

/** A submitted employee action is restricted to the exact recipient.
 * A "read" event means viewing, not agreement; acknowledge and approve differ.
 */
export function canTransitionDocument({
  actor, membership, document, action
} = {}) {
  if (!canReadDocument({ actor, membership, document })) return false;

  const isRecipient = actor.userId === document.recipientUserId;
  const isIssuer = actor.userId === document.creatorUserId;
  const isOrgAdmin = membership.role === 'owner' || membership.role === 'admin';
  const status = document.status;

  switch (action) {
    case 'read':
      return isRecipient && status === 'sent';
    case 'acknowledge':
      return isRecipient && document.type === 'acknowledgement' &&
        (status === 'sent' || status === 'read');
    case 'approve':
      return isRecipient && document.type === 'approval' &&
        (status === 'sent' || status === 'read');
    case 'return':
      return isRecipient && document.type === 'approval' &&
        (status === 'sent' || status === 'read');
    case 'revoke':
      return (isIssuer || isOrgAdmin) &&
        (status === 'sent' || status === 'read');
    default:
      return false;
  }
}

/** Database query scoping helpers. Never rely on UI filtering. */
export function documentReadScope({ actor, membership, organizationId } = {}) {
  if (!validMembership(actor, membership, organizationId)) return null;
  if (membership.role === 'owner' || membership.role === 'admin')
    return Object.freeze({ organizationId, userId: null });
  return Object.freeze({ organizationId, userId: actor.userId });
}
