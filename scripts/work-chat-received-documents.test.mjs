import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [js,css,html]=await Promise.all([
 readFile(new URL('assets/seyveo-business-command.js',root),'utf8'),
 readFile(new URL('assets/seyveo-chat-attachments-unified.css',root),'utf8'),
 readFile(new URL('index.html',root),'utf8')
]);

test('received Word and PDF use real attachment rendering, not invented file blobs',()=>{
 assert.match(js,/const isReceivedDocument=!isOwn&&\['pdf','word'\]\.includes\(detail\.kind\)/);
 assert.match(js,/if\(isReceivedDocument\)node\.classList\.add\('svcp-received-document-card'\)/);
 assert.match(js,/if\(isOwn&&sourceFile instanceof File&&\['pdf','word'\]\.includes\(detail\.kind\)\)/);
 assert.match(js,/previewable\?\(\)=>svcpOpenDocument\(localFile,message\):null/);
 assert.match(js,/loadMediaLocally\(message\.mediaId\)/);
});
test('received Word and PDF show type as DOCX or PDF and retain actual filename',()=>{
 assert.match(js,/isReceivedDocument\?\(detail\.kind==='word'\?/);
 assert.match(js,/displayName\.toLowerCase\(\)\.endsWith\('\.docx'\)/);
 assert.match(js,/el\('strong','svcp-file-card-name',displayName\)/);
});
test('approved recipient cards have graphite format icons and stable layout',()=>{
 assert.match(css,/\.svcp-file-card\.svcp-received-document-card\{/);
 assert.match(css,/\.svcp-received-document-card > \.svcp-file-badge--pdf\{color:#FF4545/);
 assert.match(css,/\.svcp-received-document-card > \.svcp-file-badge\{/);
 assert.match(css,/\.svcp-received-document-card \.svcp-file-card-name\{/);
 assert.match(html,/assets\/seyveo-business-command\.js\?v=178/);
 assert.match(html,/assets\/seyveo-chat-attachments-unified\.css\?v=17/);
});

test('photo, PDF and Word messages use the same existing three-action footer',()=>{
 assert.match(js,/function dockMediaActions\(\)/);
 assert.match(js,/const row=container\.querySelector\(':scope > \.svcp-message-inline-actions'\)/);
 assert.match(js,/slot\.append\(row\)/);
 assert.match(js,/if\(!slot\.isConnected\|\|message\.mediaPurpose==='voice'\)return/);
 assert.match(css,/\.svcp-media-slot\.svcp-media-actions-contained > \.svcp-message-inline-actions\{/);
 assert.match(css,/\.svcp-media-actions-contained\.svcp-bottom-stamp > \.svcp-message-stamp/);
});
