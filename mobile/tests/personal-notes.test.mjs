import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePersonalNote,noteIdValid,personalNoteRow,MAX_PERSONAL_NOTE_CHARS} from '../src/core/personalNotes.mjs';
test('personal notes accept bounded human text',()=>{
 assert.equal(validatePersonalNote('  Купить продукты  '),'Купить продукты');
 assert.equal(validatePersonalNote('а'.repeat(MAX_PERSONAL_NOTE_CHARS)).length,MAX_PERSONAL_NOTE_CHARS);
 assert.throws(()=>validatePersonalNote('  '),/invalid-note-length/);
 assert.throws(()=>validatePersonalNote('а'.repeat(MAX_PERSONAL_NOTE_CHARS+1)),/invalid-note-length/);
});
test('a note identifier is validated before use',()=>{
 assert.equal(noteIdValid('01234567-89ab-cdef-0123-456789abcdef'),true);
 assert.equal(noteIdValid('../secrets'),false);
});
test('read result has explicit bounded fields and no secret columns',()=>{
 const row=personalNoteRow({id:'01234567-89ab-cdef-0123-456789abcdef',content:'План на день',created_at:'2026-10-31',updated_at:'2026-10-31',hexKey:'secret'});
 assert.deepEqual(Object.keys(row),['id','text','createdAt','updatedAt']);
});
