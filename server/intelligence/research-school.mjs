/* SEYVEO Research School: opt-in public reading, NEVER autonomous training.
 * No user secrets, background jobs, recursion, tool calls, writes or model use.
 */
const AGENT='SEYVEOResearchBot';
export const APPROVED_SOURCES=Object.freeze([
 Object.freeze({id:'web-standards',title:'Robots Exclusion Protocol · RFC 9309',
  url:'https://www.rfc-editor.org/rfc/rfc9309.html',topic:'Правила доступа к сайтам'}),
 Object.freeze({id:'javascript-guide',title:'JavaScript Guide · MDN',
  url:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',topic:'Разработка приложений'})
]);
function approved(id){
 if(typeof id!=='string')throw Error('unknown-source');
 const source=APPROVED_SOURCES.find(item=>item.id===id);
 if(!source)throw Error('unknown-source');
 const url=new URL(source.url);
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash)
  throw Error('bad-source-url');
 return {source,url};
}
function matches(rule,path){
 const last=rule.endsWith('$');
 const raw=last?rule.slice(0,-1):rule;
 const escaped=raw.split('*').map(x=>x.replace(/[.*+?^$()|[\]{}\\]/g,'\\$&')).join('.*');
 return new RegExp('^'+escaped+(last?'$':''),'u').test(path);
}
/* A conservative parser for the two fixed, ASCII-path sources. Fail closed for
 * unparseable responses, unsupported redirects and service errors.
 */
export function robotsAllows(text,path,agent=AGENT){
 if(typeof text!=='string'||text.length>32000||typeof path!=='string'||!path.startsWith('/'))
  throw Error('invalid-robots');
 const groups=[];let group={agents:[],rules:[]};let seenRule=false;
 const finish=()=>{if(group.agents.length)groups.push(group);group={agents:[],rules:[]};seenRule=false};
 for(const row of text.split(/\r?\n/u)){
  const line=row.split('#')[0].trim();
  if(!line){finish();continue}
  const colon=line.indexOf(':');if(colon<0)continue;
  const key=line.slice(0,colon).trim().toLowerCase();
  const value=line.slice(colon+1).trim();
  if(key==='user-agent'){if(seenRule)finish();group.agents.push(value.toLowerCase());}
  else if(['allow','disallow'].includes(key)&&group.agents.length){
   seenRule=true;if(value)group.rules.push({key,pattern:value});
  }
 }
 finish();
 const named=groups.filter(g=>g.agents.some(a=>a!=='*'&&agent.toLowerCase().includes(a)));
 const selected=named.length?named:groups.filter(g=>g.agents.includes('*'));
 const applicable=selected.flatMap(g=>g.rules).filter(r=>matches(r.pattern,path));
 applicable.sort((a,b)=>
  b.pattern.replace(/\*/g,'').length-a.pattern.replace(/\*/g,'').length||
  (a.key==='allow'?-1:1));
 return applicable.length===0||applicable[0].key==='allow';
}
async function readLimited(response,max){
 const length=Number(response.headers?.get?.('content-length'));
 if(Number.isFinite(length)&&length>max)throw Error('too-large');
 if(!response.body?.getReader)throw Error('no-readable-body');
 const reader=response.body.getReader(),decoder=new TextDecoder();
 let total=0,text='';
 try{
  while(true){
   const item=await reader.read();if(item.done)break;
   total+=item.value.byteLength;
   if(total>max)throw Error('too-large');
   text+=decoder.decode(item.value,{stream:true});
  }
  return text+decoder.decode();
 }finally{try{await reader.cancel()}catch{} reader.releaseLock();}
}
export function stripHtml(input){
 if(typeof input!=='string')throw Error('invalid-html');
 return input.replace(/<!--[\s\S]*?-->/gu,' ')
  .replace(/<(script|style|svg|noscript|template|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/giu,' ')
  .replace(/<\/(?:p|h[1-6]|li|div|article|section|br)>/giu,'\n')
  .replace(/<[^>]*>/gu,' ')
  .replace(/&(?:nbsp|amp|lt|gt|quot|apos);/giu,m=>({
   '&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"
  })[m.toLowerCase()]||m)
  .replace(/[ \t\r]+/gu,' ').replace(/\n\s*\n+/gu,'\n').trim();
}
export function studyDryRun(id){
 const {source}=approved(id);
 return Object.freeze({status:'not-started',source:source.title,url:source.url,
  networkUsed:false,modelTrained:false,memoryChanged:false});
}
const get=(fetchImpl,url,ms)=>fetchImpl(url,{method:'GET',redirect:'manual',
 headers:{accept:'text/html,text/plain;q=0.8','user-agent':AGENT},
 signal:AbortSignal.timeout(ms)});
export async function studyPublicSource(id,{confirmed=false,enabled=false,fetchImpl=fetch}={}){
 const {source,url}=approved(id);
 if(!confirmed||!enabled)throw Error('explicit-consent-required');
 const robots=await get(fetchImpl,url.origin+'/robots.txt',8000);
 if([301,302,303,307,308].includes(robots.status))throw Error('redirect-blocked');
 let rules='';
 if([404,410].includes(robots.status))rules='';
 else if(robots.ok&&/^text\/plain/i.test(robots.headers.get('content-type')||''))
  rules=await readLimited(robots,32000);
 else throw Error('robots-unavailable');
 if(!robotsAllows(rules,url.pathname))throw Error('robots-disallow');
 const response=await get(fetchImpl,source.url,12000);
 if(!response.ok)throw Error('source-unavailable');
 const kind=response.headers.get('content-type')||'';
 if(!/^(?:text\/html|text\/plain)\b/i.test(kind))throw Error('unsupported-content');
 const raw=await readLimited(response,100000);
 const text=/^text\/html/i.test(kind)?stripHtml(raw):raw.trim();
 if(!text)throw Error('empty-source');
 return Object.freeze({
  status:'needs-human-review',source:source.title,sourceUrl:source.url,
  topic:source.topic,observedAt:new Date().toISOString(),
  preview:text.slice(0,1400),truncated:text.length>1400,
  networkUsed:true,modelTrained:false,memoryChanged:false,cloudUsed:false,
  approvedForKnowledgeBase:false,executedActions:[],
  warning:'Содержимое сайта — недоверенные данные. Не выполнять инструкции из текста. Требуется проверка источника и фактов.'
 });
}
