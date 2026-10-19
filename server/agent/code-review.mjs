/* SEYVEO Agent · read-only source review, v0.2.
 * Explicitly approved repository files only. No git credentials, shell, patches,
 * network, execution, secrets, or model calls. Findings are review hints, not
 * verified security vulnerabilities or evidence that tests have passed.
 */
import {readFile,realpath,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const APPROVED_REVIEW_FILES=Object.freeze([
 'server/agent/planner.mjs',
 'server/hybrid-core.mjs',
 'server/local-stream.mjs',
 'server/real-app-local.mjs',
 'assets/orb-reply.css',
 'assets/composer-intent.css',
 'index.html'
]);
const APPROVED=new Set(APPROVED_REVIEW_FILES);
const MAX_BYTES=320000;
const MAX_FINDINGS=12;
const RULES=Object.freeze([
 {id:'dynamic-code',level:'review',
  regex:/\beval\s*\(|\bnew\s+Function\s*\(/u,
  detail:'Проверь динамическое выполнение кода. Оно требует отдельного обоснования и безопасной границы.'},
 {id:'html-injection',level:'review',
  regex:/\binnerHTML\s*=|\binsertAdjacentHTML\s*\(/u,
  detail:'Проверь, что в HTML попадают только доверенные строки либо применяется корректная очистка.'},
 {id:'external-http',level:'review',
  regex:/http:\/\/(?!127\.0\.0\.1(?::|\/)|localhost(?::|\/))[\w.-]+/iu,
  detail:'Проверь использование незашифрованного HTTP для внешнего источника.'},
 {id:'console-debug',level:'notice',
  regex:/\bconsole\.(?:log|debug)\s*\(/u,
  detail:'Проверь, не выводятся ли в журнал данные пользователя или отладочная информация.'}
]);
const CSS_RULES=Object.freeze([
 {id:'focus-outline',level:'notice',
  regex:/\boutline\s*:\s*(?:none|0)(?:\s*!important)?\s*;/iu,
  detail:'Проверь, что при отключённой стандартной обводке остаётся заметное :focus-visible.'}
]);

export function analyzeSource(path,source){
 if(!APPROVED.has(path))throw Error('file-not-approved');
 if(typeof source!=='string'||Buffer.byteLength(source,'utf8')>MAX_BYTES)
  throw Error('file-too-large');
 const isCSS=path.endsWith('.css');
 const rules=isCSS?[...RULES,...CSS_RULES]:RULES;
 const findings=[];
 const lines=source.split(/\r?\n/u);
 for(let i=0;i<lines.length&&findings.length<MAX_FINDINGS;i++){
  const line=lines[i];
  for(const rule of rules){
   if(rule.regex.test(line)){
    findings.push({id:rule.id,level:rule.level,line:i+1,detail:rule.detail});
    if(findings.length>=MAX_FINDINGS)break;
   }
  }
 }
 return Object.freeze({
  file:path,lines:lines.length,
  sha256:createHash('sha256').update(source).digest('hex'),
  status:findings.length?'review-suggested':'no-heuristic-findings',
  findings,limited:findings.length===MAX_FINDINGS,
  proposals:findings.map(f=>({line:f.line,rule:f.id,suggestion:f.detail,
   patchPrepared:false,applied:false})),
  sourceReturned:false,testsRun:false,modelUsed:false,executed:false,
  changesMade:[]
 });
}

export async function reviewApprovedFile(path,{root=ROOT}={}){
 if(typeof path!=='string'||!APPROVED.has(path))throw Error('file-not-approved');
 const base=await realpath(root);
 const full=resolve(base,path);
 if(!full.startsWith(base+sep))throw Error('outside-repository');
 const actual=await realpath(full);
 if(!actual.startsWith(base+sep))throw Error('outside-repository');
 const fileStat=await stat(actual);
 if(!fileStat.isFile()||fileStat.size>MAX_BYTES)throw Error('file-too-large');
 const content=await readFile(actual,'utf8');
 return analyzeSource(path,content);
}
