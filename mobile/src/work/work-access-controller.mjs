// UI state only; protected API calls must still be authorized by server.
export function createWorkAccessController(client) {
  let sequence = 0;
  let state = {status:'locked', workspace:null};
  return {
    getState: () => state,
    lock: () => {sequence++; state={status:'locked',workspace:null}; return state;},
    refresh: async () => {
      const current=++sequence;
      state={status:'checking',workspace:null};
      let response;
      try {response=await client.refresh();} catch {response=null;}
      if(current!==sequence) return state;
      state=response?.status==='ready' && response.workspace
        ? {status:'verified',workspace:response.workspace}
        : {status:'locked',workspace:null};
      return state;
    }
  };
}
