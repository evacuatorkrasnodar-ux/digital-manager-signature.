/* SEYVEO mobile-to-server boundary: pure planning only.
 * No network calls, model execution, audio processing or private data access.
 */
export const CAPABILITIES=Object.freeze(['local-command','remote-intelligence','remote-voice']);
export function buildExecutionPlan({
  requestType='conversation',online=false,cloudConsent=false,
  authenticated=false,sensitive=false,localSupported=false
}={}){
 if(!['conversation','command','speech'].includes(requestType))throw new TypeError('Unsupported request type');
 if(requestType==='command'&&localSupported)
  return Object.freeze({route:'device',capability:'local-command',uploads:[],reason:'local-first'});
 if(sensitive&&!cloudConsent)
  return Object.freeze({route:'device-only',capability:null,uploads:[],reason:'private-data'});
 if(!online)
  return Object.freeze({route:localSupported?'device':'unavailable',capability:localSupported?'local-command':null,uploads:[],reason:'offline'});
 if(!authenticated)
  return Object.freeze({route:'unavailable',capability:null,uploads:[],reason:'authentication-required'});
 if(!cloudConsent)
  return Object.freeze({route:localSupported?'device':'unavailable',capability:localSupported?'local-command':null,uploads:[],reason:'consent-required'});
 return Object.freeze({
  route:'server',capability:requestType==='speech'?'remote-voice':'remote-intelligence',
  uploads:requestType==='speech'?['approved-text-only']:['approved-message-only'],
  reason:'authorized'
 });
}
