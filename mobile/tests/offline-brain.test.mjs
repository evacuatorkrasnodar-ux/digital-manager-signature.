import test from 'node:test';
import assert from 'node:assert/strict';
import {planOfflineReply,offlineFallback} from '../src/core/offlineBrain.mjs';
import {localModelReady} from '../src/core/modelReadiness.mjs';
test('offline safety pack takes priority over generative model',()=>{
 assert.equal(planOfflineReply('Я заблудился в лесу',{modelReady:true,packs:['safety']}).route,'knowledge');
});
test('offline notes and downloaded maps work without cloud',()=>{
 assert.equal(planOfflineReply('Покажи мои заметки').route,'device-notes');
 assert.equal(planOfflineReply('Покажи карту леса',{packs:['maps']}).route,'offline-maps');
});
test('local model handles open-ended dialogue when available',()=>{
 assert.equal(planOfflineReply('Расскажи мне историю',{modelReady:true}).route,'on-device-model');
});
test('missing connection is not default response',()=>{
 const p=planOfflineReply('Мне грустно');
 assert.equal(p.route,'local-help');
 assert.doesNotMatch(offlineFallback(p),/нет подключения|нет интернета/i);
});
test('live information is not invented offline',()=>{
 const p=planOfflineReply('Какая погода сейчас');
 assert.equal(p.needsInternet,true);
});

test('live facts cannot be invented by installed offline model',()=>{
 const result=planOfflineReply('Какая погода сейчас',{modelReady:true,packs:['general']});
 assert.equal(result.route,'network-required');
 assert.equal(result.needsInternet,true);
});

test('local model requires verified installation and native probe',()=>{
 assert.equal(localModelReady({installed:true,integrityVerified:true,runtimeLoaded:true,probeSucceeded:false}),false);
 assert.equal(localModelReady({installed:true,integrityVerified:true,runtimeLoaded:true,probeSucceeded:true}),true);
 assert.equal(planOfflineReply('Расскажи историю',{modelReady:localModelReady({installed:true})}).route,'local-help');
});
