import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [script,css,html]=await Promise.all([
 readFile(new URL('assets/seyveo-business-command.js',root),'utf8'),
 readFile(new URL('assets/seyveo-work-chat-screen.css',root),'utf8'),
 readFile(new URL('index.html',root),'utf8')
]);
test('manager may assign standalone document messages',()=>{
 assert.match(script,/if\(canAssign&&bubble\.classList\.contains\('svcp-document-only'\)\)/);
 assert.match(script,/bubble\.classList\.add\('svcp-document-assignable'\)/);
 assert.match(script,/prepareTask\(msg,index\)/);
 assert.match(script,/attachmentMediaId:msg\.mediaId/);
 assert.match(script,/if\(hasFile&&!clean\)title\.value=/);
});
test('document assignment shows exactly one action without blocking file opening',()=>{
 assert.match(css,/\.svcp-document-only\.svcp-document-assignable > \.svcp-message-inline-actions/);
 assert.match(css,/> :not\(\.svcp-action-task\)\{display:none!important\}/);
 assert.match(css,/top:calc\(100% \+ 3px\)!important/);
 assert.match(script,/previewable\?\(\)=>svcpOpenDocument\(localFile\):null/);
 assert.match(html,/assets\/seyveo-business-command\.js\?v=172/);
 assert.match(html,/assets\/seyveo-work-chat-screen\.css\?v=236/);
});
