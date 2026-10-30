/* SEYVEO mail transport contract. No credentials or delivery simulation.
 * A native app/server must inject an authenticated send implementation.
 */
export function createMailSender({send,confirm}={}){
 if(typeof send!=='function'||typeof confirm!=='function')throw new TypeError('Authenticated mail transport and receipt verifier required');
 const pending=new Set();
 return Object.freeze({
  async sendDraft({cardKey,to,subject,body,idempotencyKey}={}){
   if(!cardKey||!idempotencyKey||!to||!subject||!body)throw new Error('Incomplete mail draft');
   if(pending.has(idempotencyKey))throw new Error('Mail action already in progress');
   pending.add(idempotencyKey);
   try{
    const result=await send({to,subject,body,idempotencyKey});
    // Do not accept client-controlled receipts as proof: verify independently.
    const trusted=await confirm({result,idempotencyKey,to});
    if(!trusted||trusted.verified!==true||trusted.status!=='sent')throw new Error('Mail send not confirmed');
    return {cardKey,receipt:trusted.receipt};
   }finally{pending.delete(idempotencyKey);}
  }
 });
}
