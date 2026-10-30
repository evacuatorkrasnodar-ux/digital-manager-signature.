import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {stageSubmissions,approveSubmission} from './knowledge-intake.mjs';
test('import stages but never publishes unapproved knowledge',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-knowledge-'));
 try{
  const inbox=join(dir,'inbox'),review=join(dir,'review'),approved=join(dir,'approved');
  await mkdir(inbox);
  await writeFile(join(inbox,'new.json'),JSON.stringify({topic:'business',title:'Правила общения с клиентами',source:'Тестовый авторский источник SEYVEO',text:'Проверь исходные данные перед ответом на вопрос о стоимости. '.repeat(5)}));
  const result=await stageSubmissions({inbox,staging:review});
  assert.equal(result.staged,1);
  assert.equal((await readdir(review)).length,1);
  await assert.rejects(readdir(approved),{code:'ENOENT'});
  const pending=JSON.parse(await readFile(join(review,(await readdir(review))[0]),'utf8'));
  assert.equal(pending.approved,false);
  const accepted=await approveSubmission({staging:review,approved,id:pending.id});
  assert.equal(accepted.approved,true);
  assert.equal((await readdir(approved)).length,1);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('unsafe and incomplete material never enters review queue',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-knowledge-'));
 try{
  const inbox=join(dir,'inbox'),review=join(dir,'review');
  await mkdir(inbox);
  await writeFile(join(inbox,'bad.json'),JSON.stringify({topic:'business',title:'Готово',source:'Коротко',text:'Всё',approved:true}));
  const result=await stageSubmissions({inbox,staging:review});
  assert.equal(result.invalid,1);assert.equal(result.staged,0);
 }finally{await rm(dir,{recursive:true,force:true})}
});
