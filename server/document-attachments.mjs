/* SEYVEO document extraction: localhost-only, no document persistence.
 * Child Python process receives bytes over stdin. No shell execution.
 */
import {spawn} from 'node:child_process';
import {resolve,dirname,extname,join} from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const BASE=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const SCRIPT=resolve(BASE,'server','document-reader.py');
const MAX=8*1024*1024;
const ACCEPT=new Set(['.pdf','.docx','.xlsx','.pptx']);

export function extractDocument(buffer,ext,{spawnProcess=spawn,timeoutMs=25000}={}){
 if(!ACCEPT.has(ext))return Promise.reject(Error('unsupported'));
 if(!Buffer.isBuffer(buffer)||!buffer.length||buffer.length>MAX)return Promise.reject(Error('large'));
 const localPython=resolve(BASE,'.venv-seyveo-docs',process.platform==='win32'?'Scripts/python.exe':'bin/python');
 const python=existsSync(localPython)?localPython:(process.platform==='win32'?'py':'python3');
 const args=existsSync(localPython)?[SCRIPT,ext]:[...(process.platform==='win32'?['-3.11']:[]),SCRIPT,ext];
 return new Promise((resolveResult,rejectResult)=>{
  const child=spawnProcess(python,args,{cwd:BASE,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONIOENCODING:'utf-8',PYTHONUTF8:'1'}});
  let stdout='',stderr='',settled=false;
  const finish=(error,value)=>{
   if(settled)return;settled=true;clearTimeout(timer);
   if(error)rejectResult(error);else resolveResult(value);
  };
  const timer=setTimeout(()=>{child.kill();finish(Error('timeout'))},timeoutMs);
  child.stdout.on('data',chunk=>{
   stdout+=chunk.toString('utf8');
   if(stdout.length>16000){child.kill();finish(Error('large-output'))}
  });
  child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString('utf8')).slice(-300)});
  child.on('error',()=>finish(Error('python-unavailable')));
  child.on('close',()=>{
   if(settled)return;
   let result;try{result=JSON.parse(stdout)}catch{finish(Error('invalid-result'));return}
   if(result?.error){finish(Error(String(result.error).slice(0,250)));return}
   if(typeof result?.text!=='string'||!result.text.trim()||result.text.length>5400){finish(Error('invalid-result'));return}
   finish(null,result);
  });
  child.stdin.on('error',()=>{});
  child.stdin.end(buffer);
 });
}

export async function readDocumentUpload(req){
 const mime=String(req.headers['content-type']||'');
 const match=/^multipart\/form-data;\s*boundary=(?:"([^"]{1,120})"|([^;\s]{1,120}))/i.exec(mime);
 const boundary=match&&(match[1]||match[2]);
 if(!boundary||!/^[\x21-\x7e]+$/.test(boundary))throw Error('format');
 const bodyParts=[];let size=0;
 for await(const part of req){size+=part.length;if(size>MAX+16384)throw Error('large');bodyParts.push(part)}
 const body=Buffer.concat(bodyParts);
 const prefix=Buffer.from('--'+boundary+'\r\n');
 if(!body.subarray(0,prefix.length).equals(prefix))throw Error('format');
 const start=body.indexOf('\r\n\r\n',prefix.length);
 if(start<0||start>8192)throw Error('format');
 const end=body.indexOf(Buffer.from('\r\n--'+boundary+'--'),start+4);
 if(end<0)throw Error('format');
 const headers=body.toString('latin1',prefix.length,start);
 if(!/content-disposition:\s*form-data;\s*name="file"/i.test(headers))throw Error('format');
 const name=/filename="([^"\r\n]{1,200})"/i.exec(headers)?.[1]||'';
 const ext=extname(name).toLowerCase();
 if(!ACCEPT.has(ext))throw Error('unsupported');
 const file=body.subarray(start+4,end);
 if(!file.length||file.length>MAX)throw Error('large');
 if(ext==='.pdf'&&!file.subarray(0,5).equals(Buffer.from('%PDF-')))throw Error('unsupported');
 if(ext!=='.pdf'&&!file.subarray(0,2).equals(Buffer.from('PK')))throw Error('unsupported');
 return extractDocument(file,ext);
}
