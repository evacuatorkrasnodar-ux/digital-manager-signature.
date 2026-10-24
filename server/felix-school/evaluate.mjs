/* SEYVEO School of Felix · OFFLINE evaluator, not weight fine-tuning.
 * Runs synthetic, non-personal prompts against the local Ollama model ONLY
 * when the operator explicitly passes --live. No data is stored or uploaded.
 * The regex checks are crude diagnostic signals, not quality guarantees.
 */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {safeInstruction} from '../hybrid-core.mjs';
import {coachMessage} from './lesson-coach.mjs';

export const FELIX_EXAM_SUITES=Object.freeze({baseline:'./eval-cases.json',batch2:'./exam-batch2.json',batch4:'./exam-batch4-business.json',batch5:'./exam-batch5-judgment.json'});

export function gradeAnswer(text,patterns){
 if(typeof text!=='string'||!Array.isArray(patterns)||!patterns.length)
  throw Error('Invalid evaluation input.');
 return patterns.map(pattern=>({
  pattern,pass:new RegExp(pattern,'iu').test(text)
 }));
}
/** Weak lexical checks only: positive patterns AND optional forbidden claims.
 * Do not treat matching words as a validated factual answer.
 */
export function judgeAnswer(text,item){
 const positive=gradeAnswer(text,item.patterns);
 const negative=(item.mustNot||[]).map(pattern=>({
  pattern,pass:!new RegExp(pattern,'iu').test(text)
 }));
 return Object.freeze({pass:positive.every(v=>v.pass)&&negative.every(v=>v.pass),
  positive,negative});
}
export function validateCases(data){
 if(data?.version!==1||!Array.isArray(data.cases)||data.cases.length<1||data.cases.length>60)
  throw Error('Invalid Felix school evaluation data.');
 const seen=new Set();
 for(const item of data.cases){
  if(typeof item.id!=='string'||!/^[a-z][a-z0-9-]{2,50}$/.test(item.id)||seen.has(item.id))
   throw Error('Invalid or duplicate case ID.');
  if(typeof item.input!=='string'||!item.input.trim()||item.input.length>600)
   throw Error('Invalid prompt in Felix school.');
  if(!Array.isArray(item.patterns)||item.patterns.length<1||item.patterns.length>6)
   throw Error('Invalid patterns.');
  if(item.mustNot!==undefined&&(!Array.isArray(item.mustNot)||item.mustNot.length>6))
   throw Error('Invalid forbidden patterns.');
  for(const pattern of [...item.patterns,...(item.mustNot||[])]){
   if(typeof pattern!=='string'||pattern.length>130)throw Error('Invalid pattern.');
   try{new RegExp(pattern,'iu')}catch{throw Error('Invalid pattern.');}
  }
  seen.add(item.id);
 }
 return data.cases;
}

export async function evaluateLocalFelix({live=false,limit=3,suite='baseline',fetchImpl=fetch,log=console.log}={}){
 if(typeof suite!=='string'||!Object.hasOwn(FELIX_EXAM_SUITES,suite))throw Error('invalid-exam-suite');
 const data=JSON.parse(await readFile(new URL(FELIX_EXAM_SUITES[suite],import.meta.url),'utf8'));
 const cases=validateCases(data);
 if(!Number.isInteger(limit)||limit<1||limit>60)throw Error('invalid-exam-limit');
 const selected=cases.slice(0,limit);
 if(!live){
  log('SEYVEO Felix School · '+suite+' dry-run · '+cases.length+' checks ready.');
  log('No Ollama calls were made. For explicit local testing: node server/felix-school/evaluate.mjs --live --suite='+suite+' --limit='+selected.length);
  return {status:'dry-run',total:cases.length};
 }
 const model=String(process.env.SEYVEO_LOCAL_MODEL||'qwen3:4b-instruct');
 if(!/^[a-zA-Z0-9._:-]{1,64}$/.test(model))throw Error('Invalid model.');
 let passed=0;
 for(const item of selected){
  const coaching=coachMessage(item.input);
  const reply=await fetchImpl('http://127.0.0.1:11434/api/chat',{
   method:'POST',headers:{'content-type':'application/json'},
   signal:AbortSignal.timeout(130000),
   body:JSON.stringify({model,stream:false,keep_alive:'15m',
    messages:[
     {role:'system',content:safeInstruction('Феликс')},
     ...(coaching?[coaching]:[]),
     {role:'user',content:item.input}
    ],options:{num_predict:180,num_ctx:2048,num_thread:8,temperature:0.2}})
  });
  if(!reply.ok)throw Error('Ollama unavailable: HTTP '+reply.status);
  const result=await reply.json();
  const text=typeof result.message?.content==='string'?result.message.content:'';
  const judgment=judgeAnswer(text,item);
  if(judgment.pass)passed++;
  const missed=[...judgment.positive.filter(v=>!v.pass).map(v=>v.pattern),
   ...judgment.negative.filter(v=>!v.pass).map(v=>'forbidden: '+v.pattern)];
  log((judgment.pass?'PASS':'REVIEW')+' · '+item.id+' · '+missed.join(', '));
 }
 log('Felix School '+suite+' diagnostics: '+passed+'/'+selected.length+' checks matched. Human review is required.');
 return {status:'evaluated',passed,total:selected.length};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const args=process.argv.slice(2);
 const live=args.includes('--live');
 const limitFlag=args.find(a=>/^--limit=\d+$/.test(a));
 const limit=limitFlag?Number(limitFlag.split('=')[1]):3;
 const suiteFlag=args.find(a=>/^--suite=[a-z0-9-]+$/.test(a));
 const suite=suiteFlag?suiteFlag.split('=')[1]:'baseline';
 await evaluateLocalFelix({live,limit,suite});
}