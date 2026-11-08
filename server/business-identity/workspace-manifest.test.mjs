import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspaceManifestContract} from './workspace-manifest.mjs';

const BASE='https://api.seyveo.example';
const TOKEN='A'.repeat(48);
const now=Date.parse('2026-11-08T12:00:00Z');
const row=(organizationId,role='employee',userId='elena')=>({
  userId,organizationId,membershipId:'m-'+organizationId,
  organizationName:'Учебная компания '+organizationId,
  status:'active',role
});
function fixture(initialRows=[]){
  let signedIn=true;
  let memberships=initialRows;
  const authorized=new Set(initialRows.filter(x=>x.status==='active')
    .map(x=>x.organizationId));
  const calls=[];
  const identity={
    identifyVerifiedPerson:async({token})=>{
      calls.push('person');
      return signedIn&&token===TOKEN?{userId:'elena',sessionId:'session-1'}:null;
    },
    canAccessBusiness:async({token,organizationId,operation})=>{
      calls.push('business:'+organizationId);
      return signedIn&&token===TOKEN&&operation==='view-workspace'&&
        authorized.has(organizationId);
    }
  };
  const server=createWorkspaceManifestContract({
    identity,apiOrigin:BASE,now:()=>now,
    listCurrentMemberships:async({userId})=>{
      assert.equal(userId,'elena');
      return memberships;
    }
  });
  const get=(path='/v1/me/workspaces',method='GET',token=TOKEN)=>
    server.handle(new Request(BASE+path,{
      method,headers:token?{Authorization:'Bearer '+token}:{}
    }));
  return {
    server,get,calls,authorized,
    logout:()=>{signedIn=false;},
    setRows:rows=>{memberships=rows;}
  };
}

test('trusted adapters and a fixed HTTPS origin are mandatory',()=>{
  assert.throws(()=>createWorkspaceManifestContract(),TypeError);
  assert.throws(()=>createWorkspaceManifestContract({
    identity:{identifyVerifiedPerson:async()=>null,canAccessBusiness:async()=>false},
    listCurrentMemberships:async()=>[],apiOrigin:'http://untrusted.example'
  }),TypeError);
});

test('ONE has a personal workspace and no fabricated work or family spaces',async()=>{
  const f=fixture([]);
  const result=await f.get();
  assert.equal(result.status,200);
  const body=await result.json();
  assert.equal(body.kind,'verified-workspace-manifest');
  assert.equal(body.version,1);
  assert.deepEqual(body.personal,{id:'personal',kind:'personal'});
  assert.deepEqual(body.workspaces,[]);
  assert.equal(body.activeWorkspaceId,null);
  assert.equal(body.issuedAt,now);
  assert.equal(result.headers.get('cache-control'),'no-store, max-age=0');
  assert.equal(result.headers.get('vary'),'Authorization');
  assert.deepEqual(f.calls,['person','person']);
});

test('one account gets worker and owner workspaces without a second registration',async()=>{
  const f=fixture([row('shop-a'),row('shop-b','owner')]);
  const result=await f.get();
  assert.equal(result.status,200);
  const body=await result.json();
  assert.deepEqual(body.workspaces.map(x=>[x.organizationId,x.navigation,x.role]),[
    ['shop-a','work','employee'],['shop-b','cabinet','owner']
  ]);
  assert.equal(body.personal.id,'personal');
  assert.equal(body.activeWorkspaceId,null);
  assert.deepEqual(f.calls,['person','business:shop-a','business:shop-b','person']);
});

test('revoked workspaces disappear; personal account is not deleted',async()=>{
  const revoked={...row('shop-old'),status:'revoked'};
  const f=fixture([revoked,row('shop-new')]);
  f.authorized.delete('shop-new'); // revoked between DB read and permission check
  const response=await f.get();
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).workspaces,[]);
});

test('request-body role or arbitrary URL cannot impersonate a director',async()=>{
  const f=fixture([row('shop-a','employee')]);
  const r=await f.get('/v1/me/workspaces?role=owner');
  assert.equal(r.status,403);
  assert.equal((await f.get('/v1/me/admin')).status,404);
  assert.equal((await f.get('/v1/me/workspaces','POST')).status,405);
  assert.equal((await f.get('/v1/me/workspaces','GET',null)).status,401);
  assert.equal((await f.get('/v1/me/workspaces','GET','unverified')).status,401);
  const fromBrowser=await f.server.handle(new Request(BASE+'/v1/me/workspaces',{
    headers:{Authorization:'Bearer '+TOKEN,Origin:'https://evil.example'}
  }));
  assert.equal(fromBrowser.status,403);
});

test('cross-user membership, duplicates and malformed active roles fail closed',async()=>{
  for(const rows of [
    [row('shop-a','employee','other-person')],
    [row('shop-a'),row('shop-a','owner')],
    [row('shop-a','superadmin')],
    [{...row('shop-a'),organizationName:'\nUnsafe'}],
    [row('../not-a-tenant')]
  ]){
    const f=fixture(rows);
    const result=await f.get();
    assert.equal(result.status,503);
    assert.deepEqual(await result.json(),{error:'unavailable'});
  }
});

test('session invalidation while looking up memberships suppresses the whole list',async()=>{
  let live=true;
  const identity={
    identifyVerifiedPerson:async()=>live?{userId:'elena',sessionId:'s1'}:null,
    canAccessBusiness:async()=>true
  };
  const f=createWorkspaceManifestContract({
    identity,apiOrigin:BASE,now:()=>now,
    listCurrentMemberships:async()=>{live=false;return [row('shop-a')]}
  });
  const result=await f.handle(new Request(BASE+'/v1/me/workspaces',{
    headers:{Authorization:'Bearer '+TOKEN}
  }));
  assert.equal(result.status,401);
  assert.deepEqual(await result.json(),{error:'unauthorized'});
});

test('a changed signed-in person invalidates the entire manifest',async()=>{
  let person='elena';
  const server=createWorkspaceManifestContract({
    apiOrigin:BASE,now:()=>now,
    identity:{
      identifyVerifiedPerson:async()=>({userId:person,sessionId:'s1'}),
      canAccessBusiness:async()=>true
    },
    listCurrentMemberships:async()=>{person='another';return [row('shop-a')]}
  });
  const result=await server.handle(new Request(BASE+'/v1/me/workspaces',{
    headers:{Authorization:'Bearer '+TOKEN}
  }));
  assert.equal(result.status,401);
});

test('more than 32 entries or a failing DB never returns an unverified subset',async()=>{
  const many=Array.from({length:33},(_,i)=>row('shop-'+i));
  assert.equal((await fixture(many).get()).status,503);
  const server=createWorkspaceManifestContract({
    apiOrigin:BASE,now:()=>now,
    identity:{
      identifyVerifiedPerson:async()=>({userId:'elena',sessionId:'s1'}),
      canAccessBusiness:async()=>true
    },
    listCurrentMemberships:async()=>{throw new Error('private tenant data')}
  });
  const result=await server.handle(new Request(BASE+'/v1/me/workspaces',{
    headers:{Authorization:'Bearer '+TOKEN}
  }));
  assert.equal(result.status,503);
  assert.deepEqual(await result.json(),{error:'unavailable'});
});
