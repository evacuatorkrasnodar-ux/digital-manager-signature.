import * as Crypto from 'expo-crypto';
import {withVerifiedVault} from './secureVault';
import {validatePersonalNote,personalNoteRow,noteIdValid} from './personalNotes.mjs';
export type PersonalNote={id:string;text:string;createdAt:string;updatedAt:string};
const TABLE='CREATE TABLE IF NOT EXISTS personal_notes (id TEXT PRIMARY KEY NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)';
export async function saveNote(text:string):Promise<PersonalNote>{
 const content=validatePersonalNote(text);
 const id=Crypto.randomUUID();
 const now=new Date().toISOString();
 return withVerifiedVault(async db=>{
  await db.execAsync(TABLE);
  await db.runAsync('INSERT INTO personal_notes (id,content,created_at,updated_at) VALUES (?,?,?,?)',id,content,now,now);
  return {id,text:content,createdAt:now,updatedAt:now};
 });
}
export async function listNotes():Promise<PersonalNote[]>{
 return withVerifiedVault(async db=>{
  await db.execAsync(TABLE);
  const rows=await db.getAllAsync<{id:string;content:string;created_at:string;updated_at:string}>('SELECT id,content,created_at,updated_at FROM personal_notes ORDER BY created_at DESC LIMIT 200');
  return rows.map(personalNoteRow);
 });
}
export async function removeNote(id:string):Promise<void>{
 if(!noteIdValid(id))throw Error('invalid-note-id');
 await withVerifiedVault(async db=>{
  await db.execAsync(TABLE);
  await db.runAsync('DELETE FROM personal_notes WHERE id = ?',id);
 });
}
