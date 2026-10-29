// UI-only controller: every protected request still needs server authorization.
export function createWorkAccessController(client) {
 if(!client||typeof client.refresh!=='function')throw new TypeError('Workspace client required');
 let sequence=0;
 let state=Object.freeze({status:'locked',workspace:null});
 const listeners=new Set();
 const publish=next=>{state=Object.freeze(next);for(const listener of listeners)listener(state);return state};
 return Object.freeze({
  getState:()=>state,
  subscribe(listener){
   if(typeof listener!=='function')throw new TypeError('Listener required');
   listeners.add(listener);
   listener(state);
   return ()=>listeners.delete(listener);
  },
  lock:()=>{sequence++;return publish({status:'locked',workspace:null})},
  refresh:async()=>{
   const current=++sequence;
   publish({status:'checking',workspace:null});
   let answer;
   try{answer=await client.refresh()}catch{answer=null}
   if(current!==sequence)return state;
   const work=answer?.workspace;
   const valid=answer?.status==='ready'&&work&&
    typeof work.organizationId==='string'&&work.organizationId.length>0&&
    ['owner','manager','employee','logistics'].includes(work.role);
   return publish(valid
    ?{status:'verified',workspace:Object.freeze({organizationId:work.organizationId,role:work.role})}
    :{status:'locked',workspace:null});
  }
 });
}
