/* SEYVEO local learning memory: user-approved examples, not weight training. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
const root=join(homedir(),'.seyveo-local');
const file=join(root,'approved-examples.json');
const clean=(s,n)=>String(s||'').trim().slice(0,n);
async function read(){try{const data=JSON.parse(await readFile(file,'utf8'));return Array.isArray(data)?data.slice(-200):[];}catch{return [];}}
export async function addApprovedExample(question,answer){
 const q=clean(question,600),a=clean(answer,1800);
 if(q.length<4||a.length<4)throw Error('Недостаточно текста');
 const entries=await read();
 const next=entries.filter(x=>x.question!==q);
 next.push({question:q,answer:a,approvedAt:new Date().toISOString()});
 await mkdir(root,{recursive:true});
 await writeFile(file,JSON.stringify(next.slice(-200),null,2),'utf8');
 return {saved:true,count:Math.min(next.length,200)};
}
export async function learningStats(){const rows=await read();return {count:rows.length,mode:'approved-examples',weightTraining:false};}
export async function findApprovedExamples(question){
 const q=clean(question,4000).toLowerCase();
 const terms=new Set(q.match(/[а-яёa-z0-9]{3,}/gi)||[]);
 if(!terms.size)return '';
 const rows=await read();
 const ranked=rows.map(row=>{
  const words=new Set(row.question.toLowerCase().match(/[а-яёa-z0-9]{3,}/gi)||[]);
  const overlap=[...words].filter(x=>terms.has(x)).length;
  return {row,overlap,score:overlap/Math.max(1,words.size)};
 }).filter(x=>x.overlap>=2&&x.score>=0.35).sort((a,b)=>b.score-a.score).slice(0,2);
 if(!ranked.length)return '';
 return ranked.map(x=>'Запрос-пример: '+x.row.question+'\nОдобренный ответ: '+x.row.answer).join('\n\n');
}
