/* SEYVEO Intelligence · Hybrid Core v0.1
 * A transport-neutral brain for a future privately authenticated backend.
 * No networking, storage or model calls happen in this module.
 */
export const VALID_MODES=Object.freeze(['auto','private','cloud']);
export const CLOUD_MODELS=Object.freeze({
 economical:'gpt-6-luna',
 capable:'gpt-6.1-sol',
 expert:'gpt-6-astra'
});
export const MAX_MESSAGE_CHARS=4000;
export const MAX_OUTPUT_TOKENS=700;
const PRIVATE_PATTERN=/(?:парол|пин.?код|cvv|cvc|секретн(?:ые|ый|ая|ое)?\s+(?:номера|контакт|запис)|паспорт|снилс|инн|медицин|здоров|болезн|диагноз|лекарств|банковск|номер\s+карт|адрес\s+дома|дата\s+рождения|личн(?:ые|ый|ая)\s+(?:переписк|контакт))/iu;
const HIGH_STAKES_PATTERN=/(?:перевед[иу]|заплат|оплат|куп[иь]|продай|подпиши|отправ[ьи]|удали|измени\s+права|уволь|закон|юрист|суд|налог|контракт|договор|финанс|лечен|назначь\s+лекарств)/iu;
const COMPLEX_PATTERN=/(?:проанализир|стратег|почему\s+упал|сравни|исследу|бизнес.?план|конкурент|маркетингов|прогноз|разработ|написать\s+код|алгоритм|оптимизир|обоснуй)/iu;
const ACTION_PATTERN=/(?:отправ|позвони|куп[иь]|перевед[иу]|заплат|оплат|удали|измен[ьи]|подпиши|создай\s+(?:письмо|дело|задачу|документ)|добавь\s+(?:контакт|встреч))/iu;

export function normalizeMessage(message){
 if(typeof message!=='string')throw new TypeError('Сообщение должно быть текстом.');
 const text=message.trim();
 if(!text||text.length>MAX_MESSAGE_CHARS)throw new RangeError('Сообщение пустое или слишком длинное.');
 return text;
}
export function classify(message){
 const text=normalizeMessage(message);
 return Object.freeze({
  private:PRIVATE_PATTERN.test(text),
  highStakes:HIGH_STAKES_PATTERN.test(text),
  complex:COMPLEX_PATTERN.test(text),
  action:ACTION_PATTERN.test(text)
 });
}
/**
 * Route only a message provided deliberately to SEYVEO. Never scrape local
 * data. A cloud request requires explicit, per-message allowCloud consent.
 * Private/sensitive content is refused to cloud even when allowCloud=true;
 * future granular authorizations must be separately implemented and audited.
 */
export function decide(message,options={},availability={}){
 const text=normalizeMessage(message);
 const signals=classify(text);
 const requested=VALID_MODES.includes(options.mode)?options.mode:'auto';
 const localReady=availability.local===true;
 const cloudReady=availability.cloud===true;
 const cloudAllowed=cloudReady&&options.allowCloud===true&&requested!=='private'&&!signals.private;
 const actionNeedsApproval=signals.action||signals.highStakes;
 const proposed=signals.complex?'capable':'economical';
 const resultBase={privacy:signals.private?'sensitive':'ordinary',
  humanApprovalRequired:actionNeedsApproval,
  executionAllowed:false,
  cloudConsentGranted:options.allowCloud===true,
  escalationSuggested:signals.complex,
  proposedCloudModel:CLOUD_MODELS[proposed]};
 if(requested==='private'||signals.private){
  return Object.freeze({...resultBase,route:localReady?'local':'unavailable',
   reason:signals.private?'sensitive-information':'private-preference'});
 }
 // For ordinary tasks, a configured self-hosted model is the default.
 if(localReady&&requested!=='cloud'&&!signals.complex)
  return Object.freeze({...resultBase,route:'local',reason:'routine-local'});
 // Complex tasks: use the stronger cloud model only with explicit consent.
 if(cloudAllowed&&(requested==='cloud'||signals.complex||!localReady))
  return Object.freeze({...resultBase,route:'cloud',reason:signals.complex?'complex-with-consent':'requested-with-consent'});
 if(localReady)
  return Object.freeze({...resultBase,route:'local',reason:'fallback-local'});
 return Object.freeze({...resultBase,route:'unavailable',
  reason:!cloudReady?'no-model-connected':'no-cloud-consent'});
}
export function safeInstruction(name='Феликс'){
 const assistant=String(name)==='Милисса'?'Милисса':'Феликс';
 return [
  'Ты '+assistant+', цифровой управляющий студии SEYVEO.',
  'Отвечай по-русски, ясно, тепло и по существу.',
  'Не притворяйся, что у тебя есть доступ к календарю, контактам, почте, документам, деньгам или истории пользователя.',
  'Никогда не утверждай, что отправил письмо, оплатил счёт, изменил данные или выполнил реальное поручение без отчёта подтверждённого инструмента.',
  'Для финансовых, юридических и медицинских тем объясняй неопределённость и необходимость проверки.',
  'Предлагай следующий безопасный шаг; не заявляй о разрешениях, которых не предоставили.',
  'Нельзя выполнять действия вне этого разговора. Сейчас тебе доступны только текстовые ответы.'
 ].join(' ');
}
export function responseUnavailable(plan){
 const detail=plan.reason==='sensitive-information'
  ?'Это личные данные. Я не отправлю их внешнему ИИ. Сначала нужен защищённый локальный интеллект.'
  :plan.reason==='no-cloud-consent'
  ?'Облачный интеллект не включён для этого вопроса. Дай разрешение на конкретный запрос или подключи собственную модель.'
  :'Мозг SEYVEO подготовлен, но модель пока не подключена. Я не стану выдавать демонстрационный ответ за настоящий ИИ.';
 return {status:'not-connected',provider:'none',model:null,text:detail,
  approvalRequired:plan.humanApprovalRequired,executed:false};
}
