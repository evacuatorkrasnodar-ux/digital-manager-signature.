const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../assets/living-conversation.js'),'utf8');
test('chat stream retains text across detached message elements',()=>{
 assert.match(src,/streamDraft=String\(answer\?\?''\)/);
 assert.match(src,/!streamedBody\.isConnected/);
 assert.match(src,/streamedBody=bodies\[bodies\.length-1\]\|\|null/);
});
test('chat stream does not crop received answer text',()=>{
 const start=src.indexOf('function updateStream(answer)');
 const end=src.indexOf('// Only the chat shell follows iPhone',start);
 const body=src.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.doesNotMatch(body,/\.slice\(|\.substring\(|\.substr\(/);
});
