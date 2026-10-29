/**
 * Validate PRIVATE deployment .env before Docker Compose.
 * Staging gate only: no real Keycloak, DNS, ACME or SMTP connection.
 * Never output configuration values or password material.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const KEYS=[
  'SEYVEO_AUTH_HOST','SEYVEO_ACME_EMAIL',
  'SEYVEO_DB_PASSWORD','SEYVEO_BOOTSTRAP_ADMIN_USERNAME',
  'SEYVEO_BOOTSTRAP_ADMIN_PASSWORD'
];
const DOMAIN=/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const INVALID_SUFFIX=/\.(?:example|invalid|test|localhost|local|internal)$/;
const validDomain=v=>DOMAIN.test(v)&&v.length<=253&&
  !INVALID_SUFFIX.test(v)&&!v.includes('..');
const secretOk=v=>typeof v==='string'&&v.length>=40&&v.length<=256&&
  /^[A-Za-z0-9_-]+$/.test(v)&&
  new Set(v).size>=10&&
  !/REPLACE|CHANGEME|PASSWORD|EXAMPLE|123456/i.test(v);
function invalid(){
  throw new Error('Staging configuration rejected.');
}
export function validateStagingContent(content){
  if(typeof content!=='string'||content.length>8192)invalid();
  const values=new Map();
  for(const line of content.split(/\r?\n/)){
    const trimmed=line.trim();
    if(!trimmed||trimmed.startsWith('#'))continue;
    const i=trimmed.indexOf('=');
    if(i<1)invalid();
    const k=trimmed.slice(0,i).trim();
    const v=trimmed.slice(i+1).trim();
    if(!KEYS.includes(k)||values.has(k)||!v||v.includes('$')||
       v.includes(String.fromCharCode(96))||v.includes('"')||
       v.includes("'")||v.includes('#')||v.startsWith(' ')||
       v.endsWith(' '))invalid();
    values.set(k,v);
  }
  if(values.size!==KEYS.length)invalid();
  const host=values.get('SEYVEO_AUTH_HOST');
  const mail=values.get('SEYVEO_ACME_EMAIL');
  const parts=mail.split('@');
  if(!validDomain(host)||parts.length!==2||
     !/^[A-Za-z0-9._%+-]{1,64}$/.test(parts[0])||
     !validDomain(parts[1])||
     !/^[a-z][a-z0-9-]{2,40}$/.test(values.get('SEYVEO_BOOTSTRAP_ADMIN_USERNAME')))
    invalid();
  const db=values.get('SEYVEO_DB_PASSWORD');
  const admin=values.get('SEYVEO_BOOTSTRAP_ADMIN_PASSWORD');
  if(!secretOk(db)||!secretOk(admin)||db===admin)invalid();
  return Object.freeze({status:'configuration-valid'});
}
export function validateStagingFile(path){
  if(typeof path!=='string'||!path.endsWith('.env'))invalid();
  try{return validateStagingContent(readFileSync(path,'utf8'));}
  catch{invalid();}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  try{
    if(process.argv.length!==3)invalid();
    validateStagingFile(process.argv[2]);
    process.stdout.write('Private staging configuration valid. DNS, SMTP and provider remain unverified.\n');
  }catch{
    process.stderr.write('Staging configuration refused. No secrets were printed.\n');
    process.exitCode=1;
  }
}
