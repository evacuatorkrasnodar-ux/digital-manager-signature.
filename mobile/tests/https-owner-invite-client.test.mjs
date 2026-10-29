import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createHttpsOwnerInviteClient} from '../src/business/https-owner-invite-client.mjs';
import {prepareEmployeeInviteDelivery} from '../src/business/employee-invite-delivery.mjs';
import {parseEmployeeQrInviteLink} from '../src/auth/employee-qr-invite.mjs';

const apiOrigin='https://business.seyveo.example';
const inviteLinkBase='https://join.seyveo.example/join/employee/';
const organizationId='demo-business';
const moment=Date.parse('2026-10-29T12:00:00Z');
const invite=login=>({
  code:randomBytes(32).toString('base64url'),
  invitation:{
    id:'invitation-'+login,employeeLogin:login,
    expiresAt:new Date(moment+15*60*1000).toISOString()
  }
});
const accessToken='owner-authorized-token-'+('A'.repeat(40));
const employeeToken='employee-restricted-token-'+('B'.repeat(40));
const initial={
  token:accessToken,
  sessionId:'owner-session-1',
  organizationId,expiresAt:moment+1800_000
};
const json=(payload,status=201,mime='application/json; charset=utf-8')=>{
  const raw=JSON.stringify(payload);
  return {
    status,
    type:'basic',
    headers:{get:name=>name==='content-type'?mime:
      name==='content-length'?String(Buffer.byteLength(raw)):null},
    text:async()=>raw
  };
};
function fixture(overrides={}){
  let session={...initial};
  let calls=[];
  let issued=0,cancelled=0;
  const fetchImpl=async(url,request)=>{
    calls.push({url,request});
    if(request.headers.Authorization!=='Bearer '+accessToken)
      return json({error:'forbidden'},403);
    if(request.method==='POST'){
      issued++;
      const {employeeLogin}=JSON.parse(request.body);
      return json(invite(employeeLogin));
    }
    if(request.method==='DELETE'){
      cancelled++;
      return json({ok:true},200);
    }
    return json({error:'method'},405);
  };
  const client=createHttpsOwnerInviteClient({
    apiOrigin,organizationId,inviteLinkBase,
    now:()=>moment,getSession:async()=>session,
    fetchImpl,...overrides
  });
  return {
    client,calls,
    get issued(){return issued},
    get cancelled(){return cancelled},
    setSession(value){session=value}
  };
}
test('director creates owner-authenticated invitation and same code serves QR and native share',async()=>{
  const f=fixture();
  const response=await f.client.create({employeeLogin:'elena'});
  assert.equal(response.status,'issued');
  assert.equal(f.issued,1);
  const delivery=prepareEmployeeInviteDelivery({
    inviteLinkBase,serverResponse:response.serverResponse,now:()=>moment
  });
  assert.equal(delivery.status,'ready');
  assert.equal(delivery.url,inviteLinkBase+response.serverResponse.code);
  assert.equal(parseEmployeeQrInviteLink({
    inviteLinkBase,scannedValue:delivery.url
  }).invitationCode,response.serverResponse.code);

  assert.equal(f.calls.length,1);
  const {url,request}=f.calls[0];
  assert.equal(url,apiOrigin+'/v1/organizations/demo-business/invitations');
  assert.equal(request.method,'POST');
  assert.equal(request.headers.Authorization,'Bearer '+accessToken);
  assert.equal(request.redirect,'manual');
  assert.equal(request.credentials,'omit');
  assert.equal(request.cache,'no-store');
  assert.equal(request.referrerPolicy,'no-referrer');
  assert.deepEqual(JSON.parse(request.body),{employeeLogin:'elena'});
  assert.equal(JSON.stringify(request).includes(response.serverResponse.code),false);
  assert.equal(JSON.stringify(request).includes('password'),false);
  assert.equal(JSON.stringify(request).includes('role'),false);

  const cancelled=await f.client.cancel({
    invitationId:response.serverResponse.invitation.id
  });
  assert.deepEqual(cancelled,{status:'cancelled'});
  assert.equal(f.cancelled,1);
  assert.equal(f.calls[1].request.method,'DELETE');
  assert.equal(f.calls[1].url,url+'/invitation-elena');
});

test('employee token cannot issue or cancel a director invitation (backend decides)',async()=>{
  const f=fixture();
  f.setSession({...initial,token:employeeToken,sessionId:'employee-session'});
  assert.deepEqual(await f.client.create({employeeLogin:'tanya'}),{status:'not-authorized'});
  assert.deepEqual(await f.client.cancel({invitationId:'invite-1'}),{status:'not-authorized'});
  assert.equal(f.issued,0);
  assert.equal(f.cancelled,0);
});

test('missing, revoked, expired or cross-company sessions never cause an invite request',async()=>{
  for(const invalid of [
    null,
    {...initial,token:'short'},
    {...initial,organizationId:'another-business'},
    {...initial,sessionId:'../tampered'},
    {...initial,expiresAt:moment},
    {...initial,expiresAt:moment-1}
  ]){
    const f=fixture();
    f.setSession(invalid);
    assert.deepEqual(await f.client.create({employeeLogin:'elena'}),{
      status:'not-authorized'
    });
    assert.deepEqual(await f.client.cancel({invitationId:'invite-1'}),{
      status:'not-authorized'
    });
    assert.equal(f.calls.length,0);
  }
});

test('wrong tenant and malformed employee login or invite ID denied before fetching',async()=>{
  const f=fixture();
  for(const employeeLogin of [
    '',null,'Elena','x','../owner','owner@company.example','me?role=owner'
  ])assert.deepEqual(await f.client.create({employeeLogin}),{status:'invalid-login'});
  for(const invitationId of ['',null,'../invite-1','invite/owner','x?role=owner'])
    assert.deepEqual(await f.client.cancel({invitationId}),{status:'invalid-invitation'});
  assert.equal(f.calls.length,0);
});

test('backend rejects stolen role, absent owner membership, and returns generic errors',async()=>{
  const f=fixture({
    fetchImpl:async(_url,_request)=>json({message:'SECRET owner data'},403)
  });
  assert.deepEqual(await f.client.create({employeeLogin:'elena'}),{
    status:'not-authorized'
  });
  assert.deepEqual(await f.client.cancel({invitationId:'invite-1'}),{
    status:'not-authorized'
  });
  const duplicate=fixture({fetchImpl:async()=>json({email:'secret'},409)});
  assert.deepEqual(await duplicate.client.create({employeeLogin:'elena'}),{
    status:'conflict'
  });
  assert.equal(JSON.stringify(await duplicate.client.cancel({invitationId:'invite-1'})).includes('secret'),false);
});

test('session revoked while response is pending suppresses secret invitation result',async()=>{
  let session={...initial};
  const client=createHttpsOwnerInviteClient({
    apiOrigin,organizationId,inviteLinkBase,now:()=>moment,
    getSession:async()=>session,
    fetchImpl:async()=>{
      session={...initial,sessionId:'another-device'};
      return json(invite('elena'));
    }
  });
  const result=await client.create({employeeLogin:'elena'});
  assert.deepEqual(result,{status:'not-authorized'});
  assert.equal(JSON.stringify(result).includes('code'),false);
});

test('malformed, huge, redirected, mismatched and incorrectly timed responses fail closed',async()=>{
  const wrongInvite=invite('tanya');
  const bad=[
    {status:200,type:'basic',headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(invite('elena'))},
    {status:302,type:'opaqueredirect'},
    json(wrongInvite),
    json({...invite('elena'),code:'invalid'}),
    json({...invite('elena'),invitation:{
      ...invite('elena').invitation,expiresAt:new Date(moment+3600_000).toISOString()
    }}),
    json(invite('elena'),201,'text/html'),
    {status:201,type:'basic',headers:{get:key=>key==='content-type'?'application/json':'999999'},text:async()=>JSON.stringify(invite('elena'))},
    {status:201,type:'basic',headers:{get:key=>key==='content-type'?'application/json':null},text:async()=>'{not json'},
    {status:201,type:'basic',headers:{get:key=>key==='content-type'?'application/json':null},text:async()=>'{'+('x'.repeat(10000))+'}'}
  ];
  for(const response of bad){
    const f=fixture({fetchImpl:async()=>response});
    assert.deepEqual(await f.client.create({employeeLogin:'elena'}),{
      status:'unavailable'
    });
  }
});

test('invalid HTTPS endpoints, untrusted app link and missing callbacks cannot initialize',()=>{
  const invalid=[
    {apiOrigin:'http://business.seyveo.example'},
    {apiOrigin:'https://localhost'},
    {apiOrigin:'https://business.seyveo.example/v1'},
    {apiOrigin:'https://user:password@business.seyveo.example'},
    {apiOrigin:'https://business.seyveo.example?next=bad'},
    {apiOrigin:'https://business.seyveo.example/#frag'},
    {organizationId:'../../owner'},
    {inviteLinkBase:'https://attacker.example/wrong-route/'},
    {getSession:null},{fetchImpl:null}
  ];
  for(const wrong of invalid)
    assert.throws(()=>createHttpsOwnerInviteClient({
      apiOrigin,organizationId,inviteLinkBase,
      now:()=>moment,getSession:async()=>initial,
      fetchImpl:async()=>json(invite('elena')),...wrong
    }),TypeError,JSON.stringify(wrong));
});

test('native director screen is isolated from M1 personal vault and never hardcodes invitation codes',async()=>{
  const panel=await readFile(new URL('../src/business/DirectorEmployeeInvitationPanel.tsx',import.meta.url),'utf8');
  const app=await readFile(new URL('../App.tsx',import.meta.url),'utf8');
  assert.match(panel,/EmployeeInvitationActions/);
  assert.match(panel,/client\.create\(\{employeeLogin:login\}\)/);
  assert.match(panel,/client\.cancel\(\{invitationId:ready\.invitationId\}\)/);
  assert.match(panel,/Пригласить в команду/);
  assert.match(panel,/setIssued\(null\)/);
  assert.doesNotMatch(panel,/console\.(log|warn|error)\(/);
  assert.doesNotMatch(panel,/ownerPassword|employeePassword|dev-server/);
  assert.doesNotMatch(app,/DirectorEmployeeInvitationPanel/);
});
