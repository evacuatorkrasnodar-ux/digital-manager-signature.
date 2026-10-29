import {openVerifiedVault} from '../core/secureVault';
const KEYS=['idea','city','budget','premises','team'] as const;
export type RiseAnswers=Partial<Record<(typeof KEYS)[number],string>>;
export async function loadRiseAnswers():Promise<RiseAnswers>{
 const db=await openVerifiedVault();
 try {
  await db.execAsync('CREATE TABLE IF NOT EXISTS rise_draft (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
  const rows=await db.getAllAsync<{key:string;value:string}>('SELECT key,value FROM rise_draft');
  const answers:RiseAnswers={};
  for(const row of rows)if(KEYS.includes(row.key as any)&&row.value.length<=240)answers[row.key as keyof RiseAnswers]=row.value;
  return answers;
 }finally{await db.closeAsync()}
}
export async function saveRiseAnswer(key:string,value:string){
 if(!KEYS.includes(key as any)||!value.trim()||value.length>240)throw new TypeError('Invalid RISE answer');
 const db=await openVerifiedVault();
 try{
  await db.execAsync('CREATE TABLE IF NOT EXISTS rise_draft (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
  await db.runAsync('INSERT OR REPLACE INTO rise_draft (key,value) VALUES (?,?)',key,value.trim());
 }finally{await db.closeAsync()}
}

export async function loadRiseProgress():Promise<string[]>{
 const db=await openVerifiedVault();
 try{
  await db.execAsync('CREATE TABLE IF NOT EXISTS rise_progress (id TEXT PRIMARY KEY NOT NULL)');
  const rows=await db.getAllAsync<{id:string}>('SELECT id FROM rise_progress');
  return rows.map(row=>row.id);
 }finally{await db.closeAsync()}
}
export async function setRiseProgress(id:string,done:boolean){
 if(!['concept','demand','budget','legal','launch'].includes(id))throw new TypeError('Invalid step');
 const db=await openVerifiedVault();
 try{
  await db.execAsync('CREATE TABLE IF NOT EXISTS rise_progress (id TEXT PRIMARY KEY NOT NULL)');
  if(done)await db.runAsync('INSERT OR IGNORE INTO rise_progress (id) VALUES (?)',id);
  else await db.runAsync('DELETE FROM rise_progress WHERE id = ?',id);
 }finally{await db.closeAsync()}
}

export type RiseCost={id:number;name:string;amount:number};
export async function loadRiseCosts():Promise<RiseCost[]>{
 const db=await openVerifiedVault();
 try{
  await db.execAsync('CREATE TABLE IF NOT EXISTS rise_costs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, amount INTEGER NOT NULL)');
  return await db.getAllAsync<RiseCost>('SELECT id,name,amount FROM rise_costs ORDER BY id');
 }finally{await db.closeAsync()}
}
export async function addRiseCost(name:string,amount:number){
 if(!name.trim()||name.length>120||!Number.isSafeInteger(amount)||amount<0||amount>10000000000)
  throw new TypeError('Invalid cost');
 const db=await openVerifiedVault();
 try{
  await db.execAsync('CREATE TABLE IF NOT EXISTS rise_costs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, amount INTEGER NOT NULL)');
  await db.runAsync('INSERT INTO rise_costs(name,amount) VALUES (?,?)',name.trim(),amount);
 }finally{await db.closeAsync()}
}
