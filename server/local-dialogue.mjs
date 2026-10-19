/* SEYVEO local conversation context: bounded, non-persistent, no cloud. */
export const MAX_HISTORY_MESSAGES=6;
export const MAX_HISTORY_CHARS=2400;
export function validateHistory(history=[]){
 if(history===undefined)return [];
 if(!Array.isArray(history)||history.length>MAX_HISTORY_MESSAGES||history.length%2!==0)
  throw Error('invalid-history');
 let total=0;
 const safe=[];
 for(let i=0;i<history.length;i++){
  const row=history[i];
  const role=i%2===0?'user':'assistant';
  if(!row||typeof row!=='object'||Array.isArray(row)||row.role!==role
    ||typeof row.content!=='string')throw Error('invalid-history');
  const content=row.content.trim();
  if(!content||content.length>700)throw Error('invalid-history');
  total+=content.length;
  if(total>MAX_HISTORY_CHARS)throw Error('invalid-history');
  safe.push({role,content});
 }
 return safe;
}
