/* SEYVEO voice invariants: protect the approved synthesis route.
 * These tests use source inspection only; no model loading or audio generation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const ROOT=new URL('./',import.meta.url);
const read=path=>readFile(new URL(path,ROOT),'utf8');

test('approved private voice keeps its reference and clone generation',async()=>{
 const worker=await read('seyveo-voice-school/voice_worker.py');
 assert.match(worker,/from approved_voice import app_reference, active_path/);
 assert.match(worker,/model\.generate_voice_clone\(/);
 assert.match(worker,/ref_audio=str\(reference\), x_vector_only_mode=True/);
 assert.match(worker,/language="Russian"/);
 assert.doesNotMatch(worker,/russian.stress.batch|ruaccent|stress.review/i);
});

test('private HTTP synthesis receives original text without automatic stress injection',async()=>{
 const server=await read('real-app-local.mjs');
 const start=server.indexOf("if(req.method==='POST'&&path==='/api/seyveo-private-tts')");
 const end=server.indexOf("if(req.method==='GET'&&path==='/seyveo-stress-test.html')",start);
 assert.ok(start>=0&&end>start,'expected explicit private-TTS and test-page routes');
 const route=server.slice(start,end);
 assert.match(route,/const phrase=typeof data\?\.text==='string'\?data\.text\.trim\(\):''/);
 assert.match(route,/await voiceRunner\.generate\(phrase,output\)/);
 assert.doesNotMatch(route,/russianStress|RUAccent|previewRussianStress|applyStress|replaceStress/);
});

test('mass language analysis is separate from approved private voice worker',async()=>{
 const batch=await read('russian-stress-batch.py');
 const hints=await read('russian-stress-review.py');
 assert.match(batch,/def run\(/);
 assert.match(hints,/def suggest_stress\(/);
 for(const source of [batch,hints]){
  assert.doesNotMatch(source,/import voice_worker|from voice_worker|generate_voice_clone|app_reference\(/);
 }
});
