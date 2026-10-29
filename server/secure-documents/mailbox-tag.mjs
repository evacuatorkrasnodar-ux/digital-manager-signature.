/* SEYVEO Secure Documents / conditional mailbox checks.
 * Development-only, authenticated endpoints. The tag binds to the verified
 * user, organization and folder; no document text is returned in the tag.
 * This is a polling optimization, NOT mobile push or remote delivery.
 */
import { createHmac, hkdfSync } from 'node:crypto';

export function mailboxTag({masterKey,actor,organizationId,mailbox}={}){
 if(!Buffer.isBuffer(masterKey)||masterKey.length!==32||
    typeof actor?.userId!=='string'||!actor.userId||
    typeof organizationId!=='string'||!organizationId||
    !['inbox','outbox'].includes(mailbox?.folder)||!Array.isArray(mailbox?.documents)||
    !Number.isSafeInteger(mailbox?.total)||!Number.isSafeInteger(mailbox?.pending))
   throw new Error('Invalid authenticated mailbox cursor context.');
 const key=Buffer.from(hkdfSync('sha256',masterKey,
   Buffer.from('SEYVEO-DEV-MAILBOX'),Buffer.from('conditional-etag-v1'),32));
 // Hash only permitted mailbox projection, never the full document contents.
 const digest=createHmac('sha256',key).update(JSON.stringify([
   'SEYVEO-DEV-MAILBOX-v1',organizationId,actor.userId,mailbox.folder,
   mailbox.documents,mailbox.total,mailbox.pending
 ])).digest('base64url');
 return '"svdm-'+digest+'"';
}
export function mailboxUnchanged(header,etag){
 if(typeof header!=='string'||header.length>512||typeof etag!=='string')return false;
 // Only accept a single exact strong entity-tag; reject weak, wildcard or
 // ambiguous multiple values. On doubt return a complete fresh response.
 return header.trim()===etag;
}
