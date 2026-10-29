import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {prepareEmployeeInviteDelivery} from '../src/business/employee-invite-delivery.mjs';
import {parseEmployeeQrInviteLink} from '../src/auth/employee-qr-invite.mjs';

const base='https://join.seyveo.example/join/employee/';
const instant=Date.parse('2026-10-29T12:00:00Z');
const code=randomBytes(32).toString('base64url');
const invite={
  code,
  invitation:{
    id:'invite-123',employeeLogin:'elena',
    expiresAt:new Date(instant+15*60*1000).toISOString()
  }
};
const prepare=(response=invite,now=()=>instant,inviteLinkBase=base)=>
  prepareEmployeeInviteDelivery({serverResponse:response,now,inviteLinkBase});

test('QR and native share use the exact same server-issued, one-use link',()=>{
  const prepared=prepare();
  assert.deepEqual(prepared,{
    status:'ready',url:base+code,
    expiresAt:instant+900_000,invitationId:'invite-123'
  });
  const scan=parseEmployeeQrInviteLink({inviteLinkBase:base,scannedValue:prepared.url});
  assert.equal(scan.status,'invite-present');
  assert.equal(scan.invitationCode,code);
  assert.equal(Object.isFrozen(prepared),true);
  assert.equal(prepared.url.includes('elena'),false);
  assert.equal(prepared.url.includes('invite-123'),false);
  assert.equal(prepared.url.includes('role='),false);
});

test('expired or far-future secrets cannot be shown or sent by the native view',()=>{
  assert.deepEqual(prepare(invite,()=>instant+900_000),{status:'unavailable'});
  assert.deepEqual(prepare(invite,()=>instant+900_001),{status:'unavailable'});
  assert.equal(prepare(invite,()=>instant+899_999).status,'ready');
  assert.deepEqual(prepare(invite,()=>instant-1),{status:'unavailable'});
  assert.deepEqual(prepare(invite,()=>NaN),{status:'unavailable'});
  assert.deepEqual(prepare(invite,()=>Infinity),{status:'unavailable'});
});

test('invalid, absent, tampered or unverified invitation responses fail closed',()=>{
  const examples=[
    null,undefined,{},'fake',
    {code},
    {...invite,code:'short'},
    {...invite,code:'Z'.repeat(44)},
    {...invite,code:'Z'.repeat(42)},
    {...invite,code:undefined},
    {...invite,invitation:null},
    {...invite,invitation:{...invite.invitation,id:'../../owner'}},
    {...invite,invitation:{...invite.invitation,employeeLogin:'hi somebody'}},
    {...invite,invitation:{...invite.invitation,expiresAt:'tomorrow'}},
    {...invite,invitation:{...invite.invitation,expiresAt:'2026-10-29T12:15:00Z'}},
    {...invite,invitation:{...invite.invitation,expiresAt:'2026-02-30T12:15:00.000Z'}},
    {...invite,invitation:{...invite.invitation,expiresAt:'2099-10-29T12:15:00.000Z'}}
  ];
  for(const [index,response] of examples.entries())
    assert.deepEqual(prepare(response),{status:'unavailable'},'invalid response '+index);
  assert.deepEqual(prepare(invite,()=>instant,'https://evil.invalid/not-invite/'),
    {status:'unavailable'});
  assert.deepEqual(prepare(invite,()=>instant,'http://join.seyveo.example/join/employee/'),
    {status:'unavailable'});
});

test('a failure status does not reveal any token or invitation metadata',()=>{
  const status=prepare({...invite,code:'invalid'});
  assert.equal(JSON.stringify(status).includes(code),false);
  assert.equal(JSON.stringify(status).includes('elena'),false);
  assert.equal(JSON.stringify(status).includes('invite-123'),false);
});

test('future invites get a distinct code; displaying an invite never grants work access',()=>{
  const otherCode=randomBytes(32).toString('base64url');
  const other=prepare({...invite,code:otherCode,invitation:{
    ...invite.invitation,id:'invite-456'
  }});
  assert.equal(other.status,'ready');
  assert.notEqual(prepare().url,other.url);
  assert.equal('accessToken' in other,false);
  assert.equal('role' in other,false);
  assert.equal('membership' in other,false);
});
