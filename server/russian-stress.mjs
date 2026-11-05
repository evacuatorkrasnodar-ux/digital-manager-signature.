/* SEYVEO pronunciation experiments. This module DOES NOT touch approved voice. */
/* Stress mark U+0301; legacy Qwen3-TTS may ignore it. OFF by default. */
const ACUTE='\u0301';
const CONTEXTS = [
 {pattern:/\b(старинный|древний|средневековый)\s+замок\b/giu,stressed:'за'+ACUTE+'мок'},
 {pattern:/\b(дверной|навесной|электронный)\s+замок\b/giu,stressed:'замо'+ACUTE+'к'},
 {pattern:/\b(пшеничная|ржаная|рисовая)\s+мука\b/giu,stressed:'мука'+ACUTE},
 {pattern:/\b(сильная|невыносимая|душевная)\s+мука\b/giu,stressed:'му'+ACUTE+'ка'},
 {pattern:/\b(географический|школьный|исторический)\s+атлас\b/giu,stressed:'а'+ACUTE+'тлас'},
 {pattern:/\b(шёлковый|шелковый|гладкий)\s+атлас\b/giu,stressed:'атла'+ACUTE+'с'},
];
const SINGLE=new Map([
 ['каталог','катало'+ACUTE+'г'],['договор','догово'+ACUTE+'р'],
 ['звонит','звони'+ACUTE+'т'],['звонишь','звони'+ACUTE+'шь'],
 ['красивее','краси'+ACUTE+'вее'],['торты','то'+ACUTE+'рты'],
 ['свекла','свёкла'],['жалюзи','жалюзи'+ACUTE],
 ['квартал','кварта'+ACUTE+'л'],['средства','сре'+ACUTE+'дства']
]);
const AMBIGUOUS=new Set(['замок','мука','атлас','стоит','плачу','дорога','вести','уже','передохнуть']);
export function stressCandidates(text){
 if(typeof text!=='string'||text.length>2000)return [];
 const found=[];
 for(const rule of CONTEXTS){
  for(const m of text.matchAll(rule.pattern)){
   const original=m[0].split(/\s+/u).at(-1);
   found.push({word:original,accented:rule.stressed,kind:'context',at:m.index+m[0].length-original.length});
  }
 }
 for(const m of text.matchAll(/[а-яё]+/giu)){
  const lower=m[0].toLowerCase();
  if(AMBIGUOUS.has(lower)||!SINGLE.has(lower))continue;
  found.push({word:m[0],accented:SINGLE.get(lower),kind:'dictionary',at:m.index});
 }
 return found.sort((a,b)=>a.at-b.at).filter((x,i,arr)=>i===0||x.at!==arr[i-1].at);
}
export function previewRussianStress(text){
 if(typeof text!=='string'||text.length>2000)return text;
 const hits=stressCandidates(text);
 let out='',previous=0;
 for(const x of hits){
  out+=text.slice(previous,x.at);
  let spoken=x.accented;
  if(x.word[0]===x.word[0].toUpperCase())spoken=spoken[0].toUpperCase()+spoken.slice(1);
  out+=spoken;previous=x.at+x.word.length;
 }
 return out+text.slice(previous);
}
/* The existing synthesis path MUST explicitly opt in after audio A/B review. */
export function russianStressPreviewEnabled(env=process.env){return env.SEYVEO_RU_STRESS_PREVIEW==='1'};
