import test from 'node:test';
import assert from 'node:assert/strict';
import {paperSketchInstruction,validatePaperSketchDraft} from '../paper-sketch-contract.mjs';

const modelDraft=()=>({
 version:1,title:'Мой дом',
 strokes:[
  {color:'#2F3A4B',width:3,points:[[0.1,0.2],[0.2,0.3],[0.3,0.4]]},
  {points:[[0.5,0.6],[0.8,0.9]]}
 ]
});

test('instructions are explicit about preview, bounded JSON and no auto-save',()=>{
 for(const mode of ['draw','improve']){
  const prompt=paperSketchInstruction({mode,request:'Нарисуй дерево'});
  assert.match(prompt,/Нарисуй дерево/);
  assert.match(prompt,/JSON/);
  assert.match(prompt,/предпросмотра/);
  assert.match(prompt,/Ничего не сохраняй/);
 }
 assert.throws(()=>paperSketchInstruction({mode:'overwrite',request:'дом'}),/invalid-mode/);
 assert.throws(()=>paperSketchInstruction({mode:'draw',request:' '}),/invalid-request/);
 assert.throws(()=>paperSketchInstruction({request:'a'.repeat(501)}),/invalid-request/);
});

test('a proposed drawing becomes compatible bounded Paper ink, never an applied edit',()=>{
 const source=modelDraft(),snapshot=structuredClone(source);
 const preview=validatePaperSketchDraft(JSON.stringify(source));
 assert.equal(preview.kind,'paper-preview');
 assert.equal(preview.title,'Мой дом');
 assert.equal(preview.requiresConfirmation,true);
 assert.equal(preview.originalUntouched,true);
 assert.deepEqual(preview.strokes[0],{
  tool:'pen',color:'#2f3a4b',width:3,
  points:[[84,237.6,50],[168,356.4,50],[252,475.2,50]]
 });
 assert.equal(preview.strokes[1].color,'#171e29');
 assert.equal(preview.strokes[1].width,4);
 assert.deepEqual(source,snapshot,'validation must not mutate proposed data');
});

test('model titles are limited and HTML-like text is neutralized',()=>{
 const candidate=modelDraft();candidate.title='<img src=x onerror=alert(1)>'.repeat(30);
 const preview=validatePaperSketchDraft(candidate);
 assert.equal(preview.title.length,100);
 assert.doesNotMatch(preview.title,/[<>]/);
});

test('malformed or dangerous responses cannot reach the Paper surface',()=>{
 const invalid=[
  '```json\n{"version":1}\n```',
  'x'.repeat(280001),
  {version:2,strokes:modelDraft().strokes},
  {version:1,strokes:[]},
  {version:1,strokes:Array.from({length:61},()=>({points:[[0,0],[1,1]]}))},
  {version:1,strokes:[{points:[[0,0],[1.001,.5]]}]},
  {version:1,strokes:[{points:[[0,0],[NaN,.5]]}]},
  {version:1,strokes:[{points:[[0,0],[Infinity,.5]]}]},
  {version:1,strokes:[{color:'url(javascript:bad)',points:[[0,0],[1,1]]}]},
  {version:1,strokes:[{width:120,points:[[0,0],[1,1]]}]},
  {version:1,strokes:[{points:Array.from({length:701},()=>[.5,.5])}]},
  {version:1,strokes:Array.from({length:8},()=>({points:Array.from({length:700},()=>[.5,.5])}))}
 ];
 for(const input of invalid)assert.throws(()=>validatePaperSketchDraft(input),undefined,JSON.stringify(input).slice(0,80));
 assert.throws(()=>validatePaperSketchDraft(modelDraft(),{width:99999}),/invalid-paper-size/);
});
