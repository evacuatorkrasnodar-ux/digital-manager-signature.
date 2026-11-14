import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readApprovedWelcome,welcomeFolders,prepareWelcomeForPlayback} from './sayvi-approved-welcome.mjs';

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

test('private playback copy removes the initial transient without touching the approved master',()=>{
 const rate=24000,samples=rate*3;
 const master=Buffer.alloc(44+samples*2);
 master.write('RIFF',0,'ascii');master.writeUInt32LE(master.length-8,4);
 master.write('WAVEfmt ',8,'ascii');master.writeUInt32LE(16,16);
 master.writeUInt16LE(1,20);master.writeUInt16LE(1,22);
 master.writeUInt32LE(rate,24);master.writeUInt32LE(rate*2,28);
 master.writeUInt16LE(2,32);master.writeUInt16LE(16,34);
 master.write('data',36,'ascii');master.writeUInt32LE(samples*2,40);
 // A bad click near t=0, then natural speech beginning at t=.48 s.
 master.writeInt16LE(4000,44+100*2);
 master.writeInt16LE(10000,44+Math.round(.48*rate)*2);
 const before=Buffer.from(master);
 const cleaned=prepareWelcomeForPlayback(master);
 assert.deepEqual(master,before,'the approved file is never modified');
 assert.equal(cleaned.length,master.length-Math.round(.4*rate)*2);
 assert.equal(cleaned.readUInt32LE(4),cleaned.length-8);
 assert.equal(cleaned.readUInt32LE(40),cleaned.length-44);
 assert.equal(cleaned.readInt16LE(44),0,'the first playback sample is silent');
 assert.equal(cleaned.readInt16LE(44+Math.round(.08*rate)*2),10000,'the first spoken sample survives');
 assert.throws(()=>prepareWelcomeForPlayback(Buffer.alloc(44)),/формат/);
});
