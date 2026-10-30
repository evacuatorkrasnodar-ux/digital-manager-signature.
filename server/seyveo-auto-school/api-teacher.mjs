/* Opt-in OpenAI teacher for synthetic SEYVEO school exercises.
 * Never reads chat history, private voice recordings, or personal memory.
 * This module sends ONLY the fixed synthetic teacher prompt when explicitly used.
 */
const ENDPOINT='https://api.openai.com/v1/responses';
export function createApiTeacher({fetchImpl=globalThis.fetch,env=process.env}={}){
 const key=env.OPENAI_API_KEY;
 const model=env.SEYVEO_SCHOOL_TEACHER_MODEL||'gpt-6-astra';
 if(typeof key!=='string'||!key.trim())throw Error('openai-api-key-missing');
 if(!/^[a-zA-Z0-9._:-]{2,80}$/.test(model))throw Error('invalid-teacher-model');
 return Object.freeze({
  model,
  async generate(prompt){
   if(typeof prompt!=='string'||prompt.length>7500)throw Error('invalid-synthetic-prompt');
   if(!prompt.includes('Только')&&!prompt.includes('вымышленные'))throw Error('synthetic-prompt-required');
   const response=await fetchImpl(ENDPOINT,{
    method:'POST',signal:AbortSignal.timeout(90000),
    headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
    body:JSON.stringify({
     model,store:false,max_output_tokens:850,
     instructions:'Ты преподаватель синтетической лаборатории SEYVEO. Создай один учебный JSON-пример на русском, без реальных имён, контактов, персональных сведений, ссылок и фактов о пользователях. Только вымышленные ситуации. Верни исключительно корректный JSON без Markdown.',
     input:prompt
    })
   });
   if(!response.ok)throw Error('teacher-api-status-'+response.status);
   const data=await response.json();
   const output=(data.output||[]).flatMap(x=>x.content||[])
    .filter(x=>x.type==='output_text').map(x=>x.text).join('');
   if(!output||output.length>11000)throw Error('invalid-teacher-output');
   let parsed;
   try{parsed=JSON.parse(output)}catch{throw Error('teacher-invalid-json')}
   if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error('teacher-invalid-json');
   return parsed;
  }
 });
}
