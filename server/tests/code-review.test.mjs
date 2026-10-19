import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {reviewApprovedFile,analyzeSource,APPROVED_REVIEW_FILES} from '../agent/code-review.mjs';

test('only a fixed set of repository source files is eligible',()=>{
 assert.ok(APPROVED_REVIEW_FILES.includes('server/agent/planner.mjs'));
 assert.ok(APPROVED_REVIEW_FILES.includes('index.html'));
 for(const file of [
  '../package.json','.env','server/local-memory.mjs','server/../.env',
  'server/agent/../../.env','C:\\Users\\owner\\secrets.txt','/etc/passwd',
  'server/agent/try-agent.mjs'
 ])assert.throws(()=>analyzeSource(file,'safe text'),/file-not-approved/);
});

test('review results expose findings and hash but never actual source code',()=>{
 const source='<script>\nconst password="private-example-not-real";\nnode.innerHTML = userText;\nconsole.log(secret);\n</script>\n';
 const review=analyzeSource('index.html',source);
 assert.equal(review.file,'index.html');
 assert.equal(review.findings.length,2);
 assert.equal(review.findings[0].line,3);
 assert.equal(review.findings[0].id,'html-injection');
 assert.equal(review.findings[1].id,'console-debug');
 assert.equal(review.sha256.length,64);
 assert.equal(review.executed,false);
 assert.equal(review.testsRun,false);
 assert.equal(review.modelUsed,false);
 assert.equal(review.sourceReturned,false);
 assert.deepEqual(review.changesMade,[]);
 assert.ok(!JSON.stringify(review).includes('private-example-not-real'));
 assert.ok(review.proposals.every(p=>p.applied===false&&p.patchPrepared===false));
});

test('CSS focus changes produce review advice, not an invented patch',()=>{
 const result=analyzeSource('assets/orb-reply.css','.button{outline:none;}');
 assert.equal(result.findings[0].id,'focus-outline');
 assert.equal(result.proposals[0].applied,false);
 assert.equal(result.status,'review-suggested');
});

test('large files and non-text input are rejected',()=>{
 assert.throws(()=>analyzeSource('index.html','x'.repeat(330000)),/file-too-large/);
 assert.throws(()=>analyzeSource('index.html',null),/file-too-large/);
});

test('real repository files can be reviewed without edits',async()=>{
 const review=await reviewApprovedFile('server/agent/planner.mjs');
 assert.equal(review.file,'server/agent/planner.mjs');
 assert.equal(review.sha256.length,64);
 assert.equal(review.sourceReturned,false);
 assert.equal(review.executed,false);
});

test('symlink to a file outside allowed root cannot escape',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'seyveo-agent-readonly-'));
 const outside=await mkdtemp(join(tmpdir(),'seyveo-agent-secret-'));
 try{
  const root=join(dir,'project');
  const {mkdir}=await import('node:fs/promises');
  await mkdir(join(root,'server','agent'),{recursive:true});
  const target=join(outside,'private.txt');
  await writeFile(target,'Do not reveal secrets');
  await symlink(target,join(root,'server','agent','planner.mjs'));
  await assert.rejects(
   ()=>reviewApprovedFile('server/agent/planner.mjs',{root}),
   /outside-repository/
  );
 }finally{
  await rm(dir,{recursive:true,force:true});
  await rm(outside,{recursive:true,force:true});
 }
});
