import {planOfflineReply,offlineFallback} from './offlineBrain.mjs';
export function planSeyveoAction(text,capabilities={}){
 const plan=planOfflineReply(text,{modelReady:false,packs:[],...capabilities});
 return {route:plan.route,needsInternet:plan.needsInternet,message:offlineFallback(plan)};
}
