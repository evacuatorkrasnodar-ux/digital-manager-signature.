import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createBusinessIdentityBoundary} from './identity-boundary.mjs';

const clock=Date.parse('2026-10-29T12:00:00Z');
const tokens={
  owner:'A'.repeat(48),elena:'B'.repeat(48),tanya:'C'.repeat(48),
  outsider:'D'.repeat(48),manager:'E'.repeat(48)
};
const doc={
  id:'fictional-document-1',organizationId:'business-1',
  creatorUserId:'owner',recipientUserId:'elena',
  type:'approval',status:'sent'
};
const member=(userId,role,organizationId='business-1')=>({
  userId,role,organizationId,status:'active'
});
function fixture(overrides={}){
  const principals=new Map([
    [tokens.owner,{userId:'owner',sessionId:'owner-session'}],
    [tokens.elena,{userId:'elena',sessionId:'elena-session'}],
    [tokens.tanya,{userId:'tanya',sessionId:'tanya-session'}],
    [tokens.outsider,{userId:'outsider',sessionId:'outsider-session'}],
    [tokens.manager,{userId:'manager',sessionId:'manager-session'}]
  ]);
  const memberships=new Map([
    ['business-1:owner',member('owner','owner')],
    ['business-1:elena',member('elena','employee')],
    ['business-1:manager',member('manager','manager')]
  ]);
  const documents=new Map([['business-1:fictional-document-1',doc]]);
  const calls={verify:[],member:[],document:[],redeem:[]};
  const config={
    now:()=>clock,
    verifySession:async token=>{
      calls.verify.push(token);
      const x=principals.get(token);
      return x?{...x,audience:'seyveo-native',subjectType:'person',
        revoked:false,expiresAt:clock+30_000}:null;
    },
    loadMembership:async({userId,organizationId})=>{
      calls.member.push({userId,organizationId});
      return memberships.get(organizationId+':'+userId)||null;
    },
    loadDocument:async({organizationId,documentId})=>{
      calls.document.push({organizationId,documentId});
      return documents.get(organizationId+':'+documentId)||null;
    },
    loadInvitation:async()=>null,
    redeemInvitation:async args=>{calls.redeem.push(args);return false}
  };
  const boundary=createBusinessIdentityBoundary({...config,...overrides});
  return {boundary,principals,memberships,documents,calls,config};
}

test('rejects absent trusted adapters and does not accept unsigned client roles',async()=>{
  assert.throws(()=>createBusinessIdentityBoundary(),TypeError);
  const f=fixture();
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.elena,organizationId:'business-1',operation:'invite-employee',
    role:'owner',userId:'owner',membership:{role:'owner'}
  }),false);
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.outsider,organizationId:'business-1',operation:'view-workspace',
    role:'owner',userId:'owner'
  }),false);
  assert.deepEqual(f.calls.member,[{
    userId:'elena',organizationId:'business-1'
  },{
    userId:'outsider',organizationId:'business-1'
  }]);
  assert.equal(await f.boundary.canAccessBusiness({
    token:'short',organizationId:'business-1',operation:'view-workspace'
  }),false);
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'../../business-1',operation:'view-workspace'
  }),false);
});

test('personal SEYVEO One data belongs to the account holder, never their employer',async()=>{
  const f=fixture();
  assert.equal(await f.boundary.canAccessPersonal({
    token:tokens.elena,accountUserId:'elena'
  }),true);
  assert.equal(await f.boundary.canAccessPersonal({
    token:tokens.owner,accountUserId:'elena'
  }),false);
  assert.equal(await f.boundary.canAccessPersonal({
    token:tokens.manager,accountUserId:'elena'
  }),false);
  assert.equal(await f.boundary.canAccessPersonal({
    token:tokens.outsider,accountUserId:'elena'
  }),false);
  assert.equal(await f.boundary.canAccessPersonal({
    token:tokens.elena,accountUserId:'../elena'
  }),false);
  assert.deepEqual(f.calls.member,[]);
  assert.deepEqual(f.calls.document,[]);
});

test('organization permissions and documents are scoped to current verified membership',async()=>{
  const f=fixture();
  const allowed=[
    [tokens.owner,'view-workspace'],
    [tokens.elena,'view-workspace'],
    [tokens.owner,'list-members'],
    [tokens.owner,'invite-employee'],
    [tokens.owner,'revoke-employee'],
    [tokens.owner,'create-document'],
    [tokens.manager,'create-document']
  ];
  for(const [token,operation] of allowed)
    assert.equal(await f.boundary.canAccessBusiness({
      token,organizationId:'business-1',operation
    }),true,operation);
  for(const operation of ['list-members','invite-employee','revoke-employee','create-document'])
    assert.equal(await f.boundary.canAccessBusiness({
      token:tokens.elena,organizationId:'business-1',operation
    }),false,operation);
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-2',operation:'view-workspace'
  }),false);
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-1',operation:'change-personal-profile'
  }),false);
});

test('document read and transition policy is enforced after fresh tenant lookups',async()=>{
  const f=fixture();
  const allowed=[
    [tokens.owner,'read-document'],
    [tokens.elena,'read-document'],
    [tokens.elena,'read-audit'],
    [tokens.elena,'act-on-document','approve'],
    [tokens.owner,'act-on-document','revoke']
  ];
  for(const [token,operation,action] of allowed)
    assert.equal(await f.boundary.canAccessBusiness({
      token,organizationId:'business-1',documentId:doc.id,operation,action
    }),true,operation+' '+action);
  for(const [token,operation,action] of [
    [tokens.manager,'read-document'],
    [tokens.manager,'act-on-document','approve'],
    [tokens.owner,'act-on-document','approve'],
    [tokens.elena,'act-on-document','revoke'],
    [tokens.elena,'act-on-document','change-role']
  ])
    assert.equal(await f.boundary.canAccessBusiness({
      token,organizationId:'business-1',documentId:doc.id,operation,action
    }),false);
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-2',documentId:doc.id,
    operation:'read-document'
  }),false);
  f.memberships.set('business-1:elena',{
    ...member('elena','employee'),status:'revoked'
  });
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.elena,organizationId:'business-1',
    documentId:doc.id,operation:'read-document'
  }),false);
});

test('invalid or expired verified sessions and wrong membership data fail closed',async()=>{
  const f=fixture({
    verifySession:async()=>({
      userId:'owner',sessionId:'old-session',audience:'seyveo-native',
      subjectType:'person',revoked:false,expiresAt:clock
    })
  });
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-1',operation:'view-workspace'
  }),false);
  const g=fixture({
    verifySession:async()=>({
      userId:'owner',sessionId:'owner-session',audience:'other-audience',
      subjectType:'person',revoked:false,expiresAt:clock+100_000
    })
  });
  assert.equal(await g.boundary.canAccessPersonal({
    token:tokens.owner,accountUserId:'owner'
  }),false);
  const h=fixture({loadMembership:async()=>({
    ...member('owner','owner'),organizationId:'other-tenant'
  })});
  assert.equal(await h.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-1',operation:'invite-employee'
  }),false);
  const i=fixture({loadDocument:async()=>({
    ...doc,organizationId:'business-2'
  })});
  assert.equal(await i.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-1',
    documentId:doc.id,operation:'read-document'
  }),false);
  const j=fixture({
    verifySession:async()=>{throw new Error('identity provider unavailable');}
  });
  assert.equal(await j.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-1',operation:'view-workspace'
  }),false);
});

test('revocation or user substitution while loading memberships prevents stale authorization',async()=>{
  let valid=true,sessionId='first-session';
  const f=fixture({
    verifySession:async()=>valid?{
      userId:'owner',sessionId,audience:'seyveo-native',
      subjectType:'person',revoked:false,expiresAt:clock+5000
    }:null,
    loadMembership:async()=>{
      valid=false;
      return member('owner','owner');
    }
  });
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-1',operation:'revoke-employee'
  }),false);
  let hits=0;
  const g=fixture({
    verifySession:async()=>{
      hits++;
      return {
        userId:'owner',sessionId:hits===1?'first-session':'new-session',
        audience:'seyveo-native',subjectType:'person',revoked:false,
        expiresAt:clock+5000
      };
    }
  });
  assert.equal(await g.boundary.canAccessPersonal({
    token:tokens.owner,accountUserId:'owner'
  }),false);
});

test('verified, recipient-bound invitation is consumed once and cannot grant owner status',async()=>{
  const code='Q'.repeat(43),hash=createHash('sha256').update(code).digest('hex');
  const invitations=new Map([[hash,{
    id:'invite-1',organizationId:'business-1',
    userId:'tanya',role:'employee',consumed:false,expiresAt:clock+20_000
  }]]);
  const transactions=[];
  const f=fixture({
    loadInvitation:async({codeDigest})=>invitations.get(codeDigest)||null,
    redeemInvitation:async args=>{
      transactions.push(args);
      const inv=invitations.get(args.codeDigest);
      if(!inv||inv.consumed||inv.expiresAt<=clock||
         inv.id!==args.invitationId||inv.userId!==args.userId||
         inv.organizationId!==args.organizationId||args.role!=='employee')
        return false;
      invitations.set(args.codeDigest,{...inv,consumed:true});
      return true;
    }
  });
  assert.equal(await f.boundary.acceptVerifiedInvitation({
    token:tokens.owner,code
  }),false);
  assert.equal(await f.boundary.acceptVerifiedInvitation({
    token:tokens.tanya,code:'wrong'
  }),false);
  assert.equal(await f.boundary.acceptVerifiedInvitation({
    token:tokens.tanya,code
  }),true);
  assert.deepEqual(transactions,[{
    invitationId:'invite-1',codeDigest:hash,userId:'tanya',
    organizationId:'business-1',role:'employee'
  }]);
  assert.equal(await f.boundary.acceptVerifiedInvitation({
    token:tokens.tanya,code
  }),false);
});

test('invalid role, expired invite or revoked recipient cannot be accepted',async()=>{
  const code='X'.repeat(43);
  for(const invite of [
    {id:'invite-1',organizationId:'business-1',userId:'tanya',role:'owner',
      consumed:false,expiresAt:clock+5000},
    {id:'invite-1',organizationId:'business-1',userId:'tanya',role:'employee',
      consumed:false,expiresAt:clock},
    {id:'invite-1',organizationId:'business-1',userId:'other',role:'employee',
      consumed:false,expiresAt:clock+5000},
    {id:'invite-1',organizationId:'business-1',userId:'tanya',role:'employee',
      consumed:true,expiresAt:clock+5000}
  ]){
    let redeemed=0;
    const f=fixture({
      loadInvitation:async()=>invite,
      redeemInvitation:async()=>{redeemed++;return true}
    });
    assert.equal(await f.boundary.acceptVerifiedInvitation({
      token:tokens.tanya,code
    }),false);
    assert.equal(redeemed,0);
  }
  let valid=true,redeemed=0;
  const f=fixture({
    verifySession:async()=>valid?{
      userId:'tanya',sessionId:'s1',audience:'seyveo-native',
      subjectType:'person',revoked:false,expiresAt:clock+5000
    }:null,
    loadInvitation:async()=>{
      valid=false;
      return {id:'invite-1',organizationId:'business-1',userId:'tanya',
        role:'employee',consumed:false,expiresAt:clock+5000};
    },
    redeemInvitation:async()=>{redeemed++;return true}
  });
  assert.equal(await f.boundary.acceptVerifiedInvitation({
    token:tokens.tanya,code
  }),false);
  assert.equal(redeemed,0);
});

test('backend and database failures never authorize business or personal changes',async()=>{
  const f=fixture({
    loadMembership:async()=>{throw new Error('DB down');},
    loadInvitation:async()=>{throw new Error('DB down');}
  });
  assert.equal(await f.boundary.canAccessBusiness({
    token:tokens.owner,organizationId:'business-1',operation:'view-workspace'
  }),false);
  assert.equal(await f.boundary.acceptVerifiedInvitation({
    token:tokens.tanya,code:'Z'.repeat(43)
  }),false);
});
