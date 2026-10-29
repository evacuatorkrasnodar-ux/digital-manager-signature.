// UI visibility only. Backend authorization is mandatory.
export function workspaceGate(session,membership){
 const active=Boolean(session?.verified===true&&membership?.status==='active'&&membership?.userId===session?.userId);
 return {personalVisible:true,workVisible:active};
}
