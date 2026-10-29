import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceResponse} from '../src/work/workspace-response.mjs';
const base={serverVerified:true,trainingOnly:false,work:{userId:'elena',organizationId:'org-a',status:'active',role:'employee'}};
test('only trusted matching active production membership can render workspace',()=>{
 assert.deepEqual(workspaceResponse(base,'elena','org-a'),{organizationId:'org-a',role:'employee'});
 for(const reply of [{...base,trainingOnly:true},{...base,serverVerified:false},{...base,work:{...base.work,status:'revoked'}},{...base,work:{...base.work,role:'unknown'}}])assert.equal(workspaceResponse(reply,'elena','org-a'),null);
 assert.equal(workspaceResponse(base,'tanya','org-a'),null);
 assert.equal(workspaceResponse(base,'elena','org-b'),null);
 assert.equal(workspaceResponse(null,'elena','org-a'),null);
});
