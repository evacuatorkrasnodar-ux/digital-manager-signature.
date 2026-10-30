/* SEYVEO · single entry point for routing text to self-hosted or API AI.
 * No tools can execute, no state or conversations are stored in this build.
 */
import {decide,normalizeMessage,responseUnavailable} from './hybrid-core.mjs';
import {availableModels,askLocal,askCloud} from './providers.mjs';

export async function respond(payload){
 const message=normalizeMessage(payload?.message);
 const mode=typeof payload?.mode==='string'?payload.mode:'auto';
 const allowCloud=payload?.allowCloud===true;
 const name='SEYVEO';
 const availability=availableModels();
 const plan=decide(message,{mode,allowCloud},availability);
 if(plan.route==='unavailable')return {...responseUnavailable(plan),route:plan.route,reason:plan.reason};
 try{
  const result=plan.route==='cloud'
   ?await askCloud(message,{name,model:plan.proposedCloudModel})
   :await askLocal(message,{name});
  // A generated recommendation is never proof an external action was executed.
  return Object.freeze({
   status:'answered',provider:result.provider,model:result.model,
   text:result.text,route:plan.route,
   privacy:plan.privacy,
   approvalRequired:plan.humanApprovalRequired,
   executed:false,toolsUsed:[]
  });
 }catch(error){
  // Generic error only. Never expose API errors, keys or sensitive prompt data.
  return Object.freeze({
   status:'temporarily-unavailable',
   provider:'none',model:null,route:plan.route,
   text:'Сейва пока не смогла получить ответ. Проверь подключение выбранной модели. Реальных действий я не выполнял.',
   approvalRequired:plan.humanApprovalRequired,
   executed:false
  });
 }
}
