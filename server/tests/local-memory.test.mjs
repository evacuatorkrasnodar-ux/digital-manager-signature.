import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMemoryStore,validateNote,memoryContext} from '../local-memory.mjs';

test('explicit notes survive server restarts, duplicates and removal without storing any chat log',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-memory-test-'));
 const path=join(dir,'felix.json');
 try{
  const fresh=createMemoryStore(path);
  assert.deepEqual(await fresh.list(),[]);
  await assert.rejects(stat(path),{code:'ENOENT'});
  const first=await fresh.add('Мы развиваем SEYVEO — студию автоматизации.');
  assert.equal(first.items.length,1);
  assert.equal(first.duplicate,false);
  const id=first.items[0].id;
  const duplicate=await fresh.add('Мы развиваем SEYVEO — студию автоматизации.');
  assert.equal(duplicate.duplicate,true);
  const reopened=createMemoryStore(path);
  assert.equal((await reopened.list())[0].text,'Мы развиваем SEYVEO — студию автоматизации.');
  assert.match(await readFile(path,'utf8'),/SEYVEO/);
  assert.deepEqual(Object.keys(JSON.parse(await readFile(path,'utf8'))).sort(),['items','version']);
  await reopened.add('Задача студии: найти первых трёх клиентов.');
  const facts=memoryContext(await fresh.list());
  assert.match(facts,/первых трёх клиентов/);
  assert.match(facts,/SEYVEO/);
  const rest=await reopened.remove(id);
  assert.equal(rest.length,1);
  assert.equal(rest[0].text,'Задача студии: найти первых трёх клиентов.');
  assert.deepEqual(await reopened.clear(),[]);
  assert.deepEqual(await createMemoryStore(path).list(),[]);
 }finally{
  await rm(dir,{recursive:true,force:true});
 }
});

test('memory refuses oversized text, credentials and invalid IDs; failed writes preserve the file',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-sensitive-test-'));
 const path=join(dir,'notes.json');
 try{
  const store=createMemoryStore(path);
  await store.add('Наша цель — помочь небольшим компаниям.');
  const before=await readFile(path,'utf8');
  await assert.rejects(()=>store.add('Пароль от GitHub — ABC123'),/sensitive-note/);
  await assert.rejects(()=>store.add('x'.repeat(181)),/note-too-long/);
  await assert.rejects(()=>store.remove('../../etc/passwd'),/invalid-id/);
  assert.equal(await readFile(path,'utf8'),before);
  assert.equal(validateNote('  Привет    мир  '),'Привет мир');
  assert.equal(memoryContext([]),'');
 }finally{
  await rm(dir,{recursive:true,force:true});
 }
});
