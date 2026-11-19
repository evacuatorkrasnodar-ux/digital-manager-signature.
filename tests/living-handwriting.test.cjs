const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const core=require('../assets/seyveo-living-handwriting-core.js');

const letterM=[[[90,40,38],[91,70,50],[95,130,70]],[[95,130,65],[125,55,85],[150,130,45]]];
const letterA=[[[80,125,55],[110,55,77],[145,125,60]],[[92,98,75],[132,98,67]]];

test('a user-drawn letter becomes bounded personal vector strokes',()=>{
 const source=structuredClone(letterM);
 const glyph=core.makeGlyph(source);
 assert.ok(glyph);
 assert.equal(glyph.strokes.length,2);
 assert.ok(glyph.advance>0&&glyph.advance<2);
 assert.ok(core.validGlyph(glyph));
 assert.deepEqual(letterM,source,'sample must not be mutated');
 assert.equal(core.makeGlyph([]),null);
 assert.equal(core.makeGlyph([[[400,0]]]),null);
 assert.equal(core.makeGlyph([[[NaN,10]]]),null);
});

test('only single user-selected characters can become samples, never signature strings',()=>{
 for(const c of ['м','Ё','A','7','?','-'])assert.equal(core.supported(c),true,c);
 for(const c of ['','Роман','подпись','🙂','/','_'])assert.equal(core.supported(c),false,c);
});

test('stored samples are checked, compact, and safe against malformed entries',()=>{
 const glyph=core.makeGlyph(letterA);
 const raw=JSON.stringify({version:1,glyphs:{а:glyph,'подпись':glyph,б:{...glyph,advance:500}}});
 const loaded=core.cleanAlphabet(raw);
 assert.deepEqual(Object.keys(loaded),['а']);
 assert.deepEqual(loaded.а,glyph);
 assert.deepEqual(core.cleanAlphabet('{broken'),{});
 assert.deepEqual(core.cleanAlphabet('a'.repeat(900001)),{});
 assert.deepEqual(core.cleanAlphabet({version:2,glyphs:{а:glyph}}),{});
});

test('typed text is reconstructed from the user strokes, not a cursive font',()=>{
 const glyphs={м:core.makeGlyph(letterM),а:core.makeGlyph(letterA)};
 const original=structuredClone(glyphs);
 const ink=core.composeText('мама',glyphs,{height:1188,size:55});
 assert.deepEqual(ink.missing,[]);
 assert.equal(ink.overflow,false);
 assert.equal(ink.strokes.length,8);
 assert.ok(ink.strokes.every(s=>s.tool==='pen'&&s.pressureSensitive&&s.points.length>0));
 assert.ok(ink.strokes.every(s=>s.points.every(p=>p[0]>=0&&p[0]<=840&&p[1]>=0&&p[1]<=1188)));
 assert.notDeepEqual(ink.strokes[0].points,ink.strokes[4].points,'repeated glyphs move across sheet');
 assert.deepEqual(glyphs,original,'composing must not mutate stored letters');
});

test('unknown letters are surfaced, not silently replaced with a fake handwriting font',()=>{
 const glyphs={м:core.makeGlyph(letterM)};
 const ink=core.composeText('мама!',glyphs);
 assert.deepEqual(ink.missing,['а','!']);
 assert.equal(ink.strokes.length,4);
 assert.ok(ink.strokes.every(stroke=>stroke.color==='#171e29'));
});

test('line wrapping and sheet bounds block oversized text before application',()=>{
 const glyphs={м:core.makeGlyph(letterM)};
 const wrapped=core.composeText('мммммммммммммммммммм',glyphs,{width:380,height:1800,size:60});
 assert.ok(wrapped.lines>1);
 const cramped=core.composeText('мммммммммммммммммммм',glyphs,{width:380,height:250,size:60});
 assert.equal(cramped.overflow,true);
 const tooMany=core.composeText('м'.repeat(240),glyphs,{height:4000,maxStrokes:30});
 assert.equal(tooMany.overflow,true);
 assert.ok(tooMany.strokes.length<=30);
 assert.throws(()=>core.composeText('т',{}, {width:40}),/invalid-composition-options/);
});

test('the existing Paper settings menu hosts Living Handwriting, and management is honest',()=>{
 const root=join(__dirname,'..');
 const index=readFileSync(join(root,'index.html'),'utf8');
 const management=readFileSync(join(root,'assets/management.js'),'utf8');
 const client=readFileSync(join(root,'assets/seyveo-living-handwriting.js'),'utf8');
 assert.match(index,/assets\/seyveo-living-handwriting\.js\?v=2/);
 assert.match(index,/assets\/seyveo-living-handwriting-core\.js\?v=1/);
 assert.match(client,/clearAction\.parentElement\.insertBefore\(entry,clearAction\)/);
 assert.match(client,/localStorage\.setItem\(KEY,raw\)/);
 assert.match(client,/localStorage\.removeItem\(KEY\)/);
 assert.match(client,/paper\.applyStrokeEdit\(\[\.\.\.previous,\.\.\.composed\.strokes\]\)/);
 assert.match(management,/\['paper_living_handwriting',[^\n]*'demo'\]/);
 assert.match(management,/\['paper_typeset_hand',[^\n]*'demo'\]/);
 assert.match(management,/personalHandwriting:'seyveo-paper-personal-ink-v1'/);
});
