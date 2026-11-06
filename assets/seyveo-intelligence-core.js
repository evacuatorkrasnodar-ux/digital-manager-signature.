/* SEYVEO Intelligence Core v1 — shared browser-side contract for Life, Business and LAB.
 * This is NOT a language model. The model remains server-side.
 * Never transmit local records or execute a model suggestion automatically.
 */
(()=>{
'use strict';
if(window.SEYVEO_INTELLIGENCE_CORE)return;
const definitions=Object.freeze([
 {name:'calendar.read',workspace:'life',risk:'read',description:'Read a user-approved calendar summary'},
 {name:'tasks.read',workspace:'life',risk:'read',description:'Read user-approved local task summary'},
 {name:'note.create',workspace:'life',risk:'write',description:'Create a local note after confirmation'},
 {name:'task.create',workspace:'life',risk:'write',description:'Create a local task after confirmation'},
 {name:'calendar.create',workspace:'life',risk:'write',description:'Create a calendar entry after confirmation'},
 {name:'business.read',workspace:'business',risk:'read',description:'Business information (requires role and connected data)'},
 {name:'lab.draft',workspace:'lab',risk:'draft',description:'Prepare a workshop extension without installing it'}
]);
const byName=new Map(definitions.map(x=>[x.name,x]));
const types=new Set(['life','business','lab']);
const MAX_TEXT=2400;
const clip=(value,max=MAX_TEXT)=>typeof value==='string'?value.trim().slice(0,max):'';
function tools(workspace='life'){
 if(!types.has(workspace))return [];
 return definitions.filter(x=>x.workspace===workspace).map(x=>({...x}));
}
function prepare({message,workspace='life'}={}){
 if(!types.has(workspace))return {ok:false,error:'unknown-workspace'};
 const text=clip(message);
 if(!text)return {ok:false,error:'empty-message'};
 return {ok:true,request:{message:text,workspace,
  // Capabilities are descriptive, not permission to access any data.
  capabilities:tools(workspace).map(({name,risk})=>({name,risk}))}};
}
function validateProposal(proposal,workspace='life'){
 if(!types.has(workspace)||!proposal||typeof proposal!=='object'||Array.isArray(proposal))return null;
 const tool=byName.get(proposal.tool);
 if(!tool||tool.workspace!==workspace||tool.risk==='read')return null;
 const title=clip(proposal.title,140),description=clip(proposal.description,500);
 if(!title||!description)return null;
 // The full action arguments remain untrusted and are never executed here.
 return Object.freeze({tool:tool.name,title,description,requiresConfirmation:true});
}
function requestConfirmation(proposal,workspace='life'){
 const safe=validateProposal(proposal,workspace);
 if(!safe)return {ok:false,error:'invalid-proposal'};
 // No browser confirm, no implicit execution; UI must show a review step.
 return {ok:true,proposal:safe,status:'awaiting-user-review'};
}
const core=Object.freeze({version:1,tools,prepare,validateProposal,requestConfirmation});
Object.defineProperty(window,'SEYVEO_INTELLIGENCE_CORE',{value:core,configurable:false,writable:false});
})();