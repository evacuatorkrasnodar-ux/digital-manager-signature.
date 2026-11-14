import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readApprovedWelcome,welcomeFolders} from './sayvi-approved-welcome.mjs';

test('finds only the exact approved locally downloaded greeting',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'seyveo-welcome-test-'));
 try{
  const audio=Buffer.alloc(512,17);
  const hash=createHash('sha256').update(audio).digest('hex');
  await writeFile(join(folder,'SEYVEO-Sayvi-welcome.wav'),Buffer.alloc(512,99));
  await writeFile(join(folder,'SEYVEO-Sayvi-welcome(2).wav'),audio);
  await writeFile(join(folder,'SEYVEO-Sayvi-welcome-unsafe.wav'),audio);
  assert.deepEqual(await readApprovedWelcome({folders:[join(folder,'missing'),folder],sha256:hash}),audio);
  assert.equal(await readApprovedWelcome({folders:[folder]}),null);
 }finally{await rm(folder,{recursive:true,force:true})}
});

test('owner downloads lookup does not traverse other directories',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'seyveo-welcome-folders-'));
 try{
  await mkdir(join(folder,'Downloads'));
  assert.deepEqual(welcomeFolders({profile:folder,oneDrive:undefined}),[
   join(folder,'Downloads'),join(folder,'Загрузки')
  ]);
 }finally{await rm(folder,{recursive:true,force:true})}
});
