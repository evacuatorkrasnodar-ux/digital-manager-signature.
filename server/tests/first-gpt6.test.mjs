import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyFirstResponse} from '../verify-gpt6.mjs';

test('First GPT-6 request is not possible without explicit consent',async()=>{
 const old=process.env.SEYVEO_GPT6_SMOKE_CONSENT;
 delete process.env.SEYVEO_GPT6_SMOKE_CONSENT;
 try{await assert.rejects(()=>verifyFirstResponse(),/не разрешён/)}
 finally{if(old===undefined)delete process.env.SEYVEO_GPT6_SMOKE_CONSENT;else process.env.SEYVEO_GPT6_SMOKE_CONSENT=old}
});
test('Cannot call paid model without server API key',async()=>{
 const oldConsent=process.env.SEYVEO_GPT6_SMOKE_CONSENT;
 const oldFlag=process.env.SEYVEO_ENABLE_CLOUD;
 const oldKey=process.env.OPENAI_API_KEY;
 process.env.SEYVEO_GPT6_SMOKE_CONSENT='yes';
 process.env.SEYVEO_ENABLE_CLOUD='1';
 delete process.env.OPENAI_API_KEY;
 try{await assert.rejects(()=>verifyFirstResponse(),/не включена/)}
 finally{
  if(oldConsent===undefined)delete process.env.SEYVEO_GPT6_SMOKE_CONSENT;else process.env.SEYVEO_GPT6_SMOKE_CONSENT=oldConsent;
  if(oldFlag===undefined)delete process.env.SEYVEO_ENABLE_CLOUD;else process.env.SEYVEO_ENABLE_CLOUD=oldFlag;
  if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
 }
});
test('First GPT-6 greeting uses only fixed prompt, cheap model and one call',async()=>{
 const oldConsent=process.env.SEYVEO_GPT6_SMOKE_CONSENT;
 const oldFlag=process.env.SEYVEO_ENABLE_CLOUD;
 const oldKey=process.env.OPENAI_API_KEY;
 const oldFetch=globalThis.fetch;
 let count=0,body=null;
 process.env.SEYVEO_GPT6_SMOKE_CONSENT='yes';
 process.env.SEYVEO_ENABLE_CLOUD='1';
 process.env.OPENAI_API_KEY='fixture-key-no-real-charge';
 globalThis.fetch=async(_url,opts)=>{
  count++;body=JSON.parse(opts.body);
  return {ok:true,json:async()=>({output:[{type:'message',content:[{type:'output_text',text:'Привет, я Феликс!'}]}]})};
 };
 try{
  const result=await verifyFirstResponse();
  assert.equal(result.verified,true);
  assert.equal(result.model,'gpt-6-luna');
  assert.equal(count,1);
  assert.equal(body.store,false);
  assert.equal(body.input[1].role,'user');
  assert.match(body.input[1].content[0].text,/Феликс/);
 }finally{
  globalThis.fetch=oldFetch;
  if(oldConsent===undefined)delete process.env.SEYVEO_GPT6_SMOKE_CONSENT;else process.env.SEYVEO_GPT6_SMOKE_CONSENT=oldConsent;
  if(oldFlag===undefined)delete process.env.SEYVEO_ENABLE_CLOUD;else process.env.SEYVEO_ENABLE_CLOUD=oldFlag;
  if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
 }
});
