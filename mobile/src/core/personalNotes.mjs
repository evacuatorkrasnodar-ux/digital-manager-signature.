/* SEYVEO Personal Notes: strict local data contract.
 * This module validates notes but NEVER uploads, logs, or persists them.
 * Persistence is only allowed inside a verified encrypted SecureVault.
 */
export const MAX_PERSONAL_NOTE_CHARS=4000;
export function validatePersonalNote(value){
 if(typeof value!=='string')throw Error('note-must-be-text');
 const note=value.trim();
 if(!note||note.length>MAX_PERSONAL_NOTE_CHARS||/\u0000/u.test(note))
  throw Error('invalid-note-length');
 return note;
}
export function noteIdValid(value){
 return typeof value==='string'&&/^[a-f0-9-]{36}$/i.test(value);
}
export function personalNoteRow(row){
 if(!row||!noteIdValid(row.id)||typeof row.content!=='string'||
  typeof row.created_at!=='string'||typeof row.updated_at!=='string')
  throw Error('invalid-personal-note-record');
 return Object.freeze({id:row.id,text:row.content,createdAt:row.created_at,updatedAt:row.updated_at});
}
