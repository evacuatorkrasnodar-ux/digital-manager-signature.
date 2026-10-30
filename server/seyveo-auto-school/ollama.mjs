/* Local-only Ollama adapter for SEYVEO Auto School.
 * Never sends prompts over the internet. No API keys, no tool invocation.
 */
const URL='http://127.0.0.1:11434';
const NAME=/^[a-zA-Z0-9._:-]{1,64}$/;
const safeModel=x=>{
 if(typeof x!=='string'||!NAME.test(x))throw Error('invalid-model-name');
 return x;
};
export const DEFAULT_TEACHER='qwen3:8b';
export const DEFAULT_STUDENT='qwen3:4b-instruct';
function parseObject(value){
 if(typeof value!=='string'||value.length>10000)throw Error('invalid-json-output');
 let parsed;
 try{parsed=JSON.parse(value)}catch{throw Error('invalid-json-output')}
 if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error('invalid-json-output');
 return parsed;
}
export function createLocalOllama({fetchImpl=globalThis.fetch,teacher=DEFAULT_TEACHER,
 student=DEFAULT_STUDENT,examiner=DEFAULT_TEACHER,timeoutMs=300000}={}){
 [teacher,student,examiner].forEach(safeModel);
 if(teacher===student)throw Error('student-must-differ-from-teacher');
 if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>600000)throw Error('invalid-timeout');
 async function list(){
  const response=await fetchImpl(URL+'/api/tags',{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('ollama-unavailable');
  const payload=await response.json();
  if(!Array.isArray(payload.models))throw Error('invalid-ollama-tags');
  return payload.models.map(x=>x.name).filter(x=>typeof x==='string');
 }
 async function ask(model,prompt,{json=false,temperature=0.2}={}){
  const response=await fetchImpl(URL+'/api/chat',{
   method:'POST',headers:{'content-type':'application/json'},
   signal:AbortSignal.timeout(timeoutMs),
   body:JSON.stringify({
    model,stream:false,think:false,
    ...(json?{format:'json'}:{}),
    keep_alive:'2m',
    messages:[
     {role:'system',content:'Ты работаешь в изолированной синтетической лаборатории SEYVEO. Только учебные вымышленные примеры. Ни сети, ни действий, ни личных данных пользователя.'},
     {role:'user',content:prompt}
    ],
    options:{temperature,num_predict:json?600:450,num_ctx:4096}
   })
  });
  if(!response.ok)throw Error('ollama-model-error-'+response.status);
  const payload=await response.json();
  const output=payload?.message?.content;
  if(typeof output!=='string'||!output.trim())throw Error('empty-ollama-answer');
  return json?parseObject(output):output.trim().slice(0,3000);
 }
 return Object.freeze({
  models:Object.freeze({teacher,student,examiner}),
  async verifyInstalled(){
   const installed=await list();
   const missing=[...new Set([teacher,student,examiner])].filter(name=>!installed.includes(name));
   if(missing.length)throw Error('models-not-installed: '+missing.join(', '));
   return installed;
  },
  teacherJson:(prompt)=>ask(teacher,prompt,{json:true,temperature:0.4}),
  examinerJson:(prompt)=>ask(examiner,prompt,{json:true,temperature:0}),
  studentText:(prompt)=>ask(student,prompt,{json:false,temperature:0.3})
 });
}
