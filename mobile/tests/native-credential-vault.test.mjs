import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeCredentialVault} from '../src/auth/native-credential-vault.mjs';
const issuer='https://login.seyveo.example/realms/seyveo';
const clientId='seyveo-native';
const t=Date.parse('2026-11-08T12:00:00Z');
const token='A'.repeat(120);
const refresh='R'.repeat(120);
const verified={
  issuer,clientId,subject:'person-1',accessToken:token,
  idToken:'NOT_TO_BE_STORED',
  refreshToken:refresh,accessTokenExpiresIn:300,
  idTokenExpiresAt:t+600_000
};
function fixture({onSet,onDelete}={}){
  const map=new Map(),writes=[],reads=[],deletes=[];
  let now=t;
  const secureStore={
    get:async key=>{reads.push(key);return map.get(key)??null;},
    set:async(key,value)=>{
      if(onSet)await onSet(key,value);
      writes.push(key);map.set(key,value);
    },
    delete:async key=>{
      if(onDelete)await onDelete(key);
      deletes.push(key);map.delete(key);
    }
  };
  const vault=createNativeCredentialVault({
    issuer,clientId,secureStore,now:()=>now
  });
  return {vault,map,writes,reads,deletes,setTime:v=>now=v};
}
test('verified exchange saves separate Keychain credentials and no ID token',async()=>{
  const f=fixture();
  assert.deepEqual(await f.vault.saveVerifiedSession(verified),{status:'stored'});
  assert.equal(f.map.size,3);
  assert.equal(JSON.stringify([...f.map]).includes(verified.idToken),false);
  assert.equal(f.writes.at(-1),'seyveo.identity.oauth.v1.commit');
  const creds=await f.vault.getAccessCredential();
  assert.equal(creds.token,token);
  assert.equal(creds.subject,'person-1');
  assert.equal(creds.expiresAt,t+300_000);
  assert.equal('userId' in creds,false);
  assert.equal('role' in creds,false);
  assert.equal('organizationId' in creds,false);
  assert.equal('refreshToken' in creds,false);
  assert.equal(Object.isFrozen(creds),true);
  const refreshCreds=await f.vault.getRefreshCredential();
  assert.equal(refreshCreds.refreshToken,refresh);
  assert.equal('token' in refreshCreds,false);
});
test('sign out erases commit before secrets, never touching personal vault',async()=>{
  const f=fixture();
  await f.vault.saveVerifiedSession(verified);
  assert.deepEqual(await f.vault.signOut(),{status:'signed-out'});
  assert.equal(f.map.size,0);
  assert.equal(f.deletes.at(-3),'seyveo.identity.oauth.v1.commit');
  assert.equal(await f.vault.getAccessCredential(),null);
  assert.equal(await f.vault.getRefreshCredential(),null);
  assert.equal([...f.deletes].some(x=>x.includes('personal.vault')),false);
});
test('no valid commit marker means no authorization even when token fragments exist',async()=>{
  const f=fixture();
  await f.vault.saveVerifiedSession(verified);
  f.map.delete('seyveo.identity.oauth.v1.commit');
  assert.equal(await f.vault.getAccessCredential(),null);
  assert.equal(await f.vault.getRefreshCredential(),null);
  assert.equal(f.map.size,2);
});
test('expired access token is not returned as a session',async()=>{
  const f=fixture();
  await f.vault.saveVerifiedSession(verified);
  f.setTime(t+300_001);
  assert.equal(await f.vault.getAccessCredential(),null);
});
test('a failed Keychain write cannot leave a valid session even after previous login',async()=>{
  let fail=false;
  const f=fixture({onSet:async key=>{
    if(fail&&key.endsWith('.refresh'))throw new Error('sensitive-native-error');
  }});
  await f.vault.saveVerifiedSession(verified);
  fail=true;
  await assert.rejects(f.vault.saveVerifiedSession({
    ...verified,accessToken:'B'.repeat(120)
  }),/Native credential storage unavailable/);
  assert.equal(await f.vault.getAccessCredential(),null);
  assert.equal(await f.vault.getRefreshCredential(),null);
  assert.equal(f.map.has('seyveo.identity.oauth.v1.commit'),false);
});
test('an interrupted logout invalidates commit before throwing generic error',async()=>{
  let fail=false;
  const f=fixture({onDelete:async key=>{
    if(fail&&key.endsWith('.refresh'))throw new Error('native private error');
  }});
  await f.vault.saveVerifiedSession(verified);
  fail=true;
  await assert.rejects(f.vault.signOut(),/Native credential removal failed/);
  assert.equal(await f.vault.getAccessCredential(),null);
  assert.equal(f.map.has('seyveo.identity.oauth.v1.commit'),false);
});
test('serialization prevents a queued signout from being undone by slow save',async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve});
  let blocked=true;
  const f=fixture({onSet:async(key)=>{
    if(blocked&&key.endsWith('.access')){blocked=false;await gate;}
  }});
  const saving=f.vault.saveVerifiedSession(verified);
  const loggingOut=f.vault.signOut();
  release();
  await saving;
  assert.deepEqual(await loggingOut,{status:'signed-out'});
  assert.equal(await f.vault.getAccessCredential(),null);
  assert.equal(f.map.size,0);
});
test('incorrect issuer and oversized iPhone tokens fail BEFORE any storage write',async()=>{
  const f=fixture();
  for(const invalid of [
    {...verified,issuer:'https://evil.example'},
    {...verified,clientId:'evil-app'},
    {...verified,subject:'../../person'},
    {...verified,accessToken:'A'.repeat(2300)},
    {...verified,refreshToken:'R'.repeat(2200)},
    {...verified,accessTokenExpiresIn:0},
    {...verified,accessTokenExpiresIn:3601},
    {...verified,idTokenExpiresAt:t},
    {...verified,accessTokenExpiresIn:20},
    {...verified,refreshToken:'not a token with spaces'}
  ])await assert.rejects(f.vault.saveVerifiedSession(invalid),/storage refused/);
  assert.equal(f.map.size,0);
  assert.deepEqual(f.writes,[]);
});
test('native store errors or modified metadata fail closed and never echo credentials',async()=>{
  const f=fixture();
  await f.vault.saveVerifiedSession(verified);
  f.map.set('seyveo.identity.oauth.v1.commit','{tampered');
  assert.equal(await f.vault.getAccessCredential(),null);
  f.map.set('seyveo.identity.oauth.v1.commit',
    JSON.stringify({version:1,issuer,clientId,subject:'other',accessExpiresAt:t+300_000,idTokenExpiresAt:t+600_000,role:'owner'}));
  assert.equal(await f.vault.getAccessCredential(),null);
  assert.equal(await f.vault.getRefreshCredential(),null);
});
test('cannot accept web storage facade or unsafe issuer without native callbacks',()=>{
  for(const extra of [
    {issuer:'http://example.com'},
    {issuer:'https://localhost'},
    {issuer:'https://login.seyveo.example/path?redirect=evil'},
    {clientId:'not a client'},
    {secureStore:{}},
    {secureStore:{get:()=>{},set:()=>{}}}
  ])assert.throws(()=>createNativeCredentialVault({
    issuer,clientId,secureStore:{get:()=>null,set:()=>{},delete:()=>{}},
    ...extra
  }),TypeError);
});
