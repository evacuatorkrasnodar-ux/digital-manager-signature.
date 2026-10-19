/* SEYVEO Felix School · held-out multi-turn exam.
 * Offline by default. Only --live explicitly sends synthetic cases to local Ollama.
 * Never writes memories, alters model weights, uses GPT or reads user conversations.
 */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {safeInstruction} from '../hybrid-core.mjs';
import {validateHistory} from '../local-dialogue.mjs';
import {gradeAnswer} from './evaluate.mjs';
import {coachMessage} from './lesson-coach.mjs';

const MODEL_URL='http://127.0.0.1:11434/api/chat';
export const DIALOGUE_EXAM_FILE=new URL('./exam-batch3-dialogue.json',import.meta.url);

export function validateDialogueExam(doc){
 if(doc?.version!==1||!Array.isArray(doc.cases)||doc.cases.length<1||doc.cases.length>30)
  throw Error('invalid-exam');
 const seen=new Set();
 for(const item of doc.cases){
  if(!item||typeof item.id!=='string'||!/^[a-z][a-z0-9-]{2,54}$/u.test(item.id)||seen.has(item.id))
   throw Error('invalid-exam-id');
  seen.add(item.id);
  validateHistory(item.history);
  if(item.history.length===0||typeof item.input!=='string'||!item.input.trim()||item.input.length>600)
   throw Error('invalid-exam-dialogue');
  if(!Array.isArray(item.patterns)||item.patterns.length<1||item.patterns.length>5)
   throw Error('invalid-exam-pattern');
  if(item.mustNot!==undefined&&(!Array.isArray(item.mustNot)||item.mustNot.length>5))
   throw Error('invalid-exam-must-not');
  for(const p of [...item.patterns,...(item.mustNot||[])]){
   if(typeof p!=='string'||p.length>120)throw Error('invalid-exam-regex');
   new RegExp(p,'iu');
  }
 }
 return doc.cases;
}

export function judgeDialogueAnswer(text,test){
 const positive=gradeAnswer(text,test.patterns);
 const negative=(test.mustNot||[]).map(pattern=>({
  pattern,pass:!new RegExp(pattern,'iu').test(text)
 }));
 return Object.freeze({
  pass:positive.every(x=>x.pass)&&negative.every(x=>x.pass),
  positive,negative,
  note:'Только лексические признаки, обязательна человеческая проверка.'
 });
}

export async function evaluateDialogue({live=false,limit=3,fetchImpl=fetch,log=console.log}={}){
 const raw=JSON.parse(await readFile(DIALOGUE_EXAM_FILE,'utf8'));
 const cases=validateDialogueExam(raw);
 if(!Number.isInteger(limit)||limit<1||limit>30)throw Error('invalid-limit');
 const selected=cases.slice(0,limit);
 if(!live){
  log('SEYVEO multi-turn exam: '+cases.length+' scenarios ready (offline; no model calls).');
  log('To run consciously with local Ollama: node server/felix-school/evaluate-dialogue.mjs --live --limit='+cases.length);
  return Object.freeze({status:'dry-run',total:cases.length,calls:0});
 }
 const model=String(process.env.SEYVEO_LOCAL_MODEL||'qwen3:4b-instruct').trim();
 if(!/^[A-Za-z0-9._:-]{1,64}$/u.test(model))throw Error('invalid-model');
 let passed=0;
 for(const item of selected){
  const coaching=coachMessage(item.input);
  const result=await fetchImpl(MODEL_URL,{
   method:'POST',headers:{'content-type':'application/json'},
   signal:AbortSignal.timeout(130000),
   body:JSON.stringify({
    model,stream:false,keep_alive:'15m',
    messages:[
     {role:'system',content:safeInstruction('Феликс')},
     ...(coaching?[coaching]:[]),
     ...item.history,
     {role:'user',content:item.input}
    ],
    options:{num_predict:200,num_ctx:2048,num_thread:8,temperature:0.2}
   })
  });
  if(!result.ok)throw Error('ollama-unavailable');
  const data=await result.json();
  const answer=typeof data?.message?.content==='string'?data.message.content:'';
  const judgment=judgeDialogueAnswer(answer,item);
  if(judgment.pass)passed++;
  log((judgment.pass?'PASS':'REVIEW')+' · '+item.id);
 }
 log('Multi-turn lexical diagnostics: '+passed+'/'+selected.length+'. Inspect answers manually.');
 return Object.freeze({status:'evaluated',passed,total:selected.length,calls:selected.length});
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const argv=process.argv.slice(2);
 const live=argv.includes('--live');
 const limitArg=argv.find(x=>/^--limit=\d+$/u.test(x));
 const limit=limitArg?Number(limitArg.split('=')[1]):3;
 await evaluateDialogue({live,limit});
}
