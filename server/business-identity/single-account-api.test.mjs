import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createSingleAccountApi} from './single-account-api.mjs';
import {generateLocalPaperSketchJson} from '../paper-vision-draft.mjs';
import {createVerifiedAccountBridge}
  from '../../mobile/src/auth/verified-account-bridge.mjs';

const origin='https://api.seyveo.example';
const now=Date.parse('2026-11-08T12:00:00Z');
const ownerToken='O'.repeat(48);
const employeeToken='E'.repeat(48);
const outsiderToken='X'.repeat(48);
const digest=s=>createHash('sha256').update(s).digest('hex');

function fixture({paperAI}={}){
  let enabled=true;
  const memberships=new Map([['owner:shop-1','owner']]);
  const pending=new Map();
  const principal=token=>enabled&&token!==outsiderToken?(
    token===ownerToken?{userId:'owner',sessionId:'owner-s1'}:
    token===employeeToken?{userId:'elena',sessionId:'elena-s1'}:null
  ):null;
  const identity={
    identifyVerifiedPerson:async({token})=>principal(token),
    canAccessBusiness:async({token,organizationId,operation})=>{
      const p=principal(token);
      const role=p&&memberships.get(p.userId+':'+organizationId);
      if(!role)return false;
      if(operation==='view-workspace')return true;
      if(operation==='invite-employee')return role==='owner';
      return false;
    },
    acceptVerifiedInvitation:async({token,code})=>{
      const p=principal(token);
      const pendingInvite=pending.get(digest(code));
      if(!p||!pendingInvite||pendingInvite.used||
         pendingInvite.userId!==p.userId||
         pendingInvite.expiresAt<=now)return false;
      pendingInvite.used=true;
      memberships.set(p.userId+':'+pendingInvite.organizationId,'employee');
      return true;
    }
  };
  const api=createSingleAccountApi({
    apiOrigin:origin,identity,now:()=>now,
    ...(paperAI?{paperAI}:{}),
    listCurrentMemberships:async({userId})=>[...memberships.entries()]
      .filter(([key])=>key.startsWith(userId+':'))
      .map(([key,role])=>{
        const organizationId=key.slice(userId.length+1);
        return {
          userId,organizationId,membershipId:'member-'+userId+'-'+organizationId,
          organizationName:'Учебный магазин',role,status:'active'
        };
      }),
    resolveVerifiedRecipient:async({employeeLogin})=>
      employeeLogin==='elena'?{userId:'elena',verified:true,active:true}:null,
    issueInvitationAtomic:async({
      codeDigest,organizationId,recipientUserId,role,
      expiresAt,actor,assertOwnerActive
    })=>{
      if(!(await assertOwnerActive())||actor.userId!=='owner'||
         recipientUserId!=='elena'||role!=='employee')return false;
      pending.set(codeDigest,{
        organizationId,userId:recipientUserId,expiresAt,used:false
      });
      return true;
    },
    revokeInvitationAtomic:async()=>false,
    random:()=>new Uint8Array(32).fill(7),
    makeId:()=> 'invitation-one'
  });
  const request=(path,method,token,body)=>api.handle(new Request(origin+path,{
    method,headers:{
      ...(token?{Authorization:'Bearer '+token}:{}),
      ...(body?{'Content-Type':'application/json'}:{})
    },...(body?{body:JSON.stringify(body)}:{})
  }));
  return {api,request,disable:()=>{enabled=false;},memberships};
}

test('ONE stays personal until owner issues and employee redeems one-use invite',async()=>{
  const f=fixture();
  const path='/v1/me/workspaces';
  const initial=await f.request(path,'GET',employeeToken);
  assert.equal(initial.status,200);
  assert.deepEqual((await initial.json()).workspaces,[]);
  const issued=await f.request('/v1/organizations/shop-1/invitations',
    'POST',ownerToken,{employeeLogin:'elena'});
  assert.equal(issued.status,201);
  const created=await issued.json();
  assert.equal(created.code.length,43);
  assert.equal(created.invitation.employeeLogin,'elena');
  assert.equal(created.invitation.expiresAt,new Date(now+900000).toISOString());
  const invite=await f.request('/v1/invitations/accept','POST',
    employeeToken,{code:created.code});
  assert.equal(invite.status,201);
  assert.deepEqual(await invite.json(),{ok:true});
  const after=await f.request(path,'GET',employeeToken);
  assert.equal(after.status,200);
  const snapshot=await after.json();
  assert.deepEqual(snapshot.workspaces.map(w=>[w.role,w.navigation,w.organizationId]),[
    ['employee','work','shop-1']
  ]);
  assert.equal(snapshot.personal.id,'personal');
  assert.equal(snapshot.activeWorkspaceId,null);
  const replay=await f.request('/v1/invitations/accept','POST',
    employeeToken,{code:created.code});
  assert.equal(replay.status,409);
  assert.equal((await f.request(path,'GET',employeeToken)).status,200);
});
test('stranger cannot steal code, become owner or see employee membership',async()=>{
  const f=fixture();
  const issued=await f.request('/v1/organizations/shop-1/invitations',
    'POST',ownerToken,{employeeLogin:'elena'});
  const {code}=await issued.json();
  assert.equal((await f.request('/v1/invitations/accept','POST',
    outsiderToken,{code})).status,409);
  const employee=await f.request('/v1/me/workspaces','GET',employeeToken);
  assert.deepEqual((await employee.json()).workspaces,[]);
  const forge=await f.request('/v1/organizations/shop-1/invitations',
    'POST',employeeToken,{employeeLogin:'elena',role:'owner'});
  assert.equal(forge.status,403);
});
test('invalid identity, unknown routes and broken request do not create a workspace',async()=>{
  const f=fixture();
  assert.equal((await f.request('/v1/me/workspaces','GET',null)).status,401);
  assert.equal((await f.request('/v1/me/secret','GET',employeeToken)).status,404);
  assert.equal((await f.request('/v1/me/workspaces?role=owner','GET',
    employeeToken)).status,403);
  assert.equal((await f.api.handle(null)).status,400);
  f.disable();
  assert.equal((await f.request('/v1/me/workspaces','GET',ownerToken)).status,401);
});

test('Paper model is absent from the unified account API until explicit provider opt-in',async()=>{
 const f=fixture();
 const response=await f.api.handle(new Request(origin+'/v1/paper/draft',{
  method:'POST',headers:{origin:'https://app.seyveo.example',
   authorization:'Bearer '+ownerToken,'content-type':'application/json',
   'x-seyveo-paper-consent':'yes'},
  body:JSON.stringify({mode:'draw',request:'Нарисуй маяк',width:840,height:1188})
 }));
 assert.equal(response.status,404);
 assert.throws(()=>fixture({paperAI:{appOrigins:['https://app.seyveo.example']}}),
  /verified-identity-and-provider-required/);
});

test('native verified identity → consent → single account API → open-ended Ollama prompt → preview',async()=>{
 const old=process.env.SEYVEO_ENABLE_PAPER_AI;
 process.env.SEYVEO_ENABLE_PAPER_AI='1';
 try{
  const promptCalls=[];
  const f=fixture({paperAI:{
   appOrigins:['https://app.seyveo.example'],
   generateSketchJson:input=>generateLocalPaperSketchJson(input,{
    model:'qwen2.5vl:3b',fetcher:async(url,opts)=>{
     promptCalls.push({url,opts});
     return {ok:true,json:async()=>({message:{content:JSON.stringify({
      version:1,title:'Маяк на берегу',
      strokes:[{points:[[.1,.2],[.3,.7],[.5,.3]]}]
     })}})};
    }
   })
  }});
  const issuer='https://login.seyveo.example';
  const bridge=createVerifiedAccountBridge({
   apiOrigin:origin,issuer,paperAppOrigin:'https://app.seyveo.example',
   credentialVault:{getAccessCredential:async()=>({
    token:ownerToken,subject:'oidc-owner',issuer,clientId:'seyveo-native',
    expiresAt:now+200_000
   })},
   fetchImpl:(url,opts)=>f.api.handle(new Request(url,opts)),
   now:()=>now
  });
  const text='Нарисуй маяк на берегу и волны вокруг него';
  const denied=await bridge.paperDraft.requestDraft({
   request:text,width:840,height:1188,confirmTextSend:async()=>false
  });
  assert.equal(denied.status,'consent-required');
  assert.equal(promptCalls.length,0);
  const result=await bridge.paperDraft.requestDraft({
   request:text,width:840,height:1188,
   confirmTextSend:async details=>{
    assert.equal(details.recipient,origin);
    assert.equal(details.request,text);
    return true;
   }
  });
  assert.equal(result.status,'ready');
  assert.equal(result.preview.title,'Маяк на берегу');
  assert.deepEqual(result.preview.strokes[0].points[0],[84,237.6,50]);
  assert.equal(result.preview.requiresConfirmation,true);
  assert.equal(result.preview.originalUntouched,true);
  assert.equal(promptCalls.length,1);
  assert.equal(promptCalls[0].url,'http://127.0.0.1:11434/api/chat');
  const modelBody=JSON.parse(promptCalls[0].opts.body);
  assert.match(modelBody.messages[0].content,/Нарисуй маяк на берегу/);
  assert.equal(modelBody.messages[0].images,undefined);
  assert.equal(JSON.stringify(modelBody).includes(ownerToken),false);
  assert.equal(JSON.stringify(result).includes(ownerToken),false);
  f.disable();
  assert.equal((await bridge.paperDraft.requestDraft({
   request:text,width:840,height:1188,confirmTextSend:async()=>true
  })).status,'sign-in-required');
  assert.equal(promptCalls.length,1);
 }finally{
  if(old===undefined)delete process.env.SEYVEO_ENABLE_PAPER_AI;
  else process.env.SEYVEO_ENABLE_PAPER_AI=old;
 }
});
