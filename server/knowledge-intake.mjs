/* SEYVEO Knowledge intake: local files -> review queue, never live answers.
 * No network requests or private user-chat access. Approved docs remain separate.
 */
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';

const TOPICS=new Set(['business','legal','psychology']);
const slug=s=>s.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').slice(0,45);
export function validateSubmission(v){
 if(!v||typeof v!=='object'||!TOPICS.has(v.topic)||
    typeof v.title!=='string'||v.title.length<4||v.title.length>160||
    typeof v.source!=='string'||v.source.length<5||v.source.length>300||
    typeof v.text!=='string'||v.text.trim().length<60||v.text.length>45000)
  throw Error('invalid-knowledge-submission');
 if(v.approved===true)throw Error('intake-must-not-preapprove');
 return {topic:v.topic,title:v.title.trim(),source:v.source.trim(),text:v.text.trim()};
}
export async function stageSubmissions({inbox,staging}){
 if(!inbox||!staging)throw Error('missing-path');
 let entries;
 try{entries=await readdir(inbox,{withFileTypes:true})}
 catch(e){if(e.code==='ENOENT')return {found:0,staged:0,invalid:0};throw e}
 await mkdir(staging,{recursive:true});
 let staged=0,invalid=0,found=0;
 for(const entry of entries){
  if(!entry.isFile()||!entry.name.endsWith('.json'))continue;
  found++;
  try{
   const raw=await readFile(join(inbox,entry.name),'utf8');
   if(raw.length>50000)throw Error('too-large');
   const doc=validateSubmission(JSON.parse(raw));
   const fingerprint=createHash('sha256').update(JSON.stringify(doc)).digest('hex').slice(0,20);
   const filename=slug(doc.topic)+'-'+fingerprint+'.json';
   const output={id:slug(doc.topic)+'-'+fingerprint, ...doc,approved:false,reviewStatus:'pending'};
   await writeFile(join(staging,filename),JSON.stringify(output,null,2),{flag:'wx'});
   staged++;
  }catch(e){if(e.code!=='EEXIST')invalid++}
 }
 return {found,staged,invalid};
}
export async function approveSubmission({staging,approved,id}){
 if(!/^[a-z0-9-]{4,80}$/.test(id))throw Error('invalid-id');
 const path=join(staging,id+'.json');
 const raw=JSON.parse(await readFile(path,'utf8'));
 if(raw.id!==id||raw.approved!==false||raw.reviewStatus!=='pending')throw Error('not-pending');
 const doc=validateSubmission(raw);
 await mkdir(approved,{recursive:true});
 const output={id,...doc,approved:true,updated:new Date().toISOString().slice(0,10)};
 await writeFile(join(approved,id+'.json'),JSON.stringify(output,null,2),{flag:'wx'});
 return output;
}
const self=process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname);
if(self){
 const root=resolve(process.cwd());
 const action=process.argv[2];
 try{
  if(action==='scan'){
   const status=await stageSubmissions({inbox:join(root,'knowledge','inbox'),staging:join(root,'knowledge','review')});
   console.log('SEYVEO Knowledge · кандидаты:',status);
   console.log('Новые знания НЕ включены в ответы до ручного одобрения.');
  }else if(action==='approve'&&process.argv[3]){
   const result=await approveSubmission({staging:join(root,'knowledge','review'),approved:join(root,'knowledge','approved'),id:process.argv[3]});
   console.log('Одобрен материал:',result.title);
  }else{
   console.log('Использование: node server/knowledge-intake.mjs scan');
   console.log('После проверки материала: node server/knowledge-intake.mjs approve ИД');
   process.exitCode=1;
  }
 }catch(e){console.error('Ошибка импорта знаний:',e.message);process.exitCode=1}
}
