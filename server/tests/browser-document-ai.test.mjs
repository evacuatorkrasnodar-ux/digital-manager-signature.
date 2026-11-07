import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBrowserDocumentReview,parseDocumentExplanation,explainBrowserDocument
} from '../browser-document-ai.mjs';

const make=()=>({
  workspace:'browser',purpose:'document-explanation',
  approved:true,cloudConsent:true,
  document:{
    source:'user-selected-local-document',
    fileName:'contract.pdf',excerpt:'Оплата: 1500 рублей в месяц',
    truncated:true
  }
});
const fixture={
  summary:'В этом отрывке указана сумма оплаты.',
  keyPoints:['Платёж 1500 рублей'],
  cautions:['Прочитайте полный договор']
};

test('an unapproved document cannot cause an AI request',async()=>{
  let calls=0;
  const fake=async()=>{calls++;throw Error('should not be called')};
  for(const variant of [
    {...make(),approved:false},
    {...make(),cloudConsent:false},
    {...make(),cloudConsent:'yes'},
    {...make(),document:{...make().document,excerpt:' '}},
    {...make(),document:{...make().document,excerpt:'X'.repeat(6001)}},
    {...make(),document:{...make().document,fileName:'../../secret.txt'}},
    {...make(),document:{...make().document,fileName:'notes.exe'}}
  ]) {
    await assert.rejects(
      explainBrowserDocument(variant,{apiKey:'dummy-not-real',model:'test-model',fetchImpl:fake})
    );
  }
  assert.equal(calls,0);
});

test('only bounded permitted document text reaches the model; no tools or persistence',async()=>{
  let url='',sent=null,headers={};
  const fake=async (input,config)=>{
    url=input;headers=config.headers;sent=JSON.parse(config.body);
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(fixture)}}]})};
  };
  const result=await explainBrowserDocument(make(),{
    apiKey:'dummy-not-real',model:'test-model',fetchImpl:fake
  });
  assert.equal(url,'https://api.openai.com/v1/chat/completions');
  assert.equal(headers.authorization,'Bearer dummy-not-real');
  assert.equal(sent.store,false);
  assert.equal(sent.tools,undefined);
  assert.equal(sent.messages[0].role,'developer');
  assert.match(sent.messages[0].content,/недоверенными/);
  assert.match(sent.messages[1].content,/Оплата: 1500 рублей/);
  assert.deepEqual(result.keyPoints,fixture.keyPoints);
  assert.equal(result.incomplete,true);
  assert.equal(result.executed,false);
  assert.equal('fileId' in result,false);
  assert.equal('excerpt' in result,false);
});

test('model cannot claim full document was analyzed when preview is truncated',()=>{
  const result=parseDocumentExplanation({...fixture,incomplete:false},validateBrowserDocumentReview(make()));
  assert.equal(result.incomplete,true);
  assert.equal(result.advisory,true);
});

test('model errors do not reflect document text to caller',async()=>{
  const text='secret text should not be echoed';
  const input=make();input.document.excerpt=text;
  await assert.rejects(
    explainBrowserDocument(input,{
      apiKey:'dummy',model:'test-model',
      fetchImpl:async()=>({ok:false,status:500})
    }),
    error=>!String(error).includes(text)
  );
});
