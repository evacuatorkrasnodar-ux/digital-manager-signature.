/* Future server-side mail intelligence contract.
 * The browser never stores AI keys or calls a provider directly.
 * Only authenticated backend responses may be passed to this validator.
 */
export function validateMailAnalysis(value){
 if(!value||typeof value!=='object')throw Error('Ответ анализа отсутствует');
 const fields=['summary','suggestedReply','suggestedTask'];
 const safe={};
 for(const field of fields){
  if(typeof value[field]!=='string')throw Error('Некорректное поле: '+field);
  safe[field]=value[field].trim().slice(0,field==='summary'?500:3000);
 }
 if(!safe.summary)throw Error('Пустое резюме письма');
 return Object.freeze({...safe,requiresHumanApproval:true,providerVerified:false});
}
export const MAIL_AI_STATUS=Object.freeze({connected:false,reason:'Для настоящего анализа нужен авторизованный сервер SEYVEO и подключённый ИИ-провайдер'});
