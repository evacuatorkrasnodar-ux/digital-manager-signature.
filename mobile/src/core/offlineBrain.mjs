/* SEYVEO Offline Brain: deterministic capability router, no network calls.
 * A device may combine a downloaded knowledge pack with a compatible
 * on-device model. Missing Internet is not itself an assistant response.
 */
const SAFE=/заблуд|потерял[аи]?сь|потерялся|лес[еу]|поход|экстренн|перва[яй] помощ/iu;
const NOTES=/заметк|блокнот|запиши|запомни|вспомни/iu;
const NAV=/карт|маршрут|координат|ориентир|навигац/iu;
const NEEDS_NETWORK=/курс валют|текущ(?:ая|ие|ий) новост|погод[аыу] сейчас|закажи|отправь сообщение|позвони через интернет/iu;
export function planOfflineReply(question,{online=false,modelReady=false,packs=[],deviceLocation=false}={}){
 if(typeof question!=='string'||!question.trim())throw Error('empty-question');
 const text=question.trim();
 const available=new Set(packs);
 if(SAFE.test(text)&&available.has('safety'))
  return Object.freeze({route:'knowledge',pack:'safety',priority:'urgent',needsInternet:false});
 if(NOTES.test(text))return Object.freeze({route:'device-notes',needsInternet:false});
 if(NAV.test(text)&&available.has('maps'))
  return Object.freeze({route:'offline-maps',deviceLocation,needsInternet:false});
 if(NEEDS_NETWORK.test(text))return Object.freeze({route:'network-required',needsInternet:true});
 if(modelReady)return Object.freeze({route:'on-device-model',needsInternet:false});
 if(available.has('general'))return Object.freeze({route:'knowledge-search',needsInternet:false});
 return Object.freeze({route:'local-help',needsInternet:false});
}
export function offlineFallback(plan){
 switch(plan.route){
  case 'local-help':return 'Я рядом. Без интернета могу работать с сохранёнными заметками и загруженными офлайн-материалами. Расскажи, что случилось, и я попробую помочь доступными способами.';
  case 'network-required':return 'Для актуальных сведений нужен интернет. Пока могу помочь с тем, что сохранено на устройстве.';
  default:return null; // Requires actual local capability; never fake a result.
 }
}
