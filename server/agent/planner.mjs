/* SEYVEO Agent Core · v0.1
 * A deterministic, auditable first layer between Felix and external tools.
 * Plans only: NEVER performs a side effect, model call, file read or network request.
 * Untrusted LLM text must not be treated as permission to execute tools.
 */
import {normalizeMessage,classify} from '../hybrid-core.mjs';

export const AGENT_VERSION='0.1.0';
export const AGENT_TOOLS=Object.freeze([
 Object.freeze({id:'calendar.draft',kind:'draft',permission:'confirm-before-save'}),
 Object.freeze({id:'notebook.draft',kind:'draft',permission:'confirm-before-save'}),
 Object.freeze({id:'mail.draft',kind:'draft',permission:'confirm-before-send'}),
 Object.freeze({id:'business.research-plan',kind:'plan',permission:'review-sources'}),
 Object.freeze({id:'code.proposal',kind:'plan',permission:'review-diff'})
]);

const FORBIDDEN=/(?:оплат[иь]|заплат[иь]|перевед[иу]|спиши\s+деньг|удал[иь]|очист[иь]\s+(?:все|всё|данн|файл)|подпиш[ьи]\s+(?:договор|контракт)|разошли\s+всем|рассылк[ауи])/iu;
const ACTION=/(?:созда[йть]|запланир|запиш[ьи]|состав[ьи]|подготов[ьи]|напиш[ьи]|сдела[йть]|проверь|найд[иь]|исправ[ьи]|проанализир|разработа[йть]|отправ[ьи]|покаж[ьи]|помог[иь]|хочу|нужен|нужна)/iu;
const INTENTS=Object.freeze([
 {id:'calendar',tool:'calendar.draft',pattern:/(?:встреч|календар|запланир|напоминани|событи)/iu,
  title:'Черновик события',steps:[
   'Уточнить дату, время, название и участников, если этих данных нет',
   'Подготовить черновик события для предварительного просмотра',
   'Сохранить в календарь только после отдельного подтверждения владельца']},
 {id:'mail',tool:'mail.draft',pattern:/(?:письм|почт|email|e-mail|клиенту\s+ответ)/iu,
  title:'Черновик письма',steps:[
   'Уточнить адресата и цель письма без доступа к почте',
   'Подготовить текст письма для проверки человеком',
   'Отправить только после подключения почты и отдельного подтверждения']},
 {id:'notebook',tool:'notebook.draft',pattern:/(?:заметк|блокнот|запиш[ьи]|сохран[ьи]\s+(?:мысль|текст|идею))/iu,
  title:'Черновик заметки',steps:[
   'Выделить текст заметки, не меняя смысл и форматирование',
   'Показать заметку человеку перед сохранением',
   'Записать в Блокнот только после отдельного подтверждения']},
 {id:'code',tool:'code.proposal',pattern:/(?:github|гитхаб|репозитор|код|исходник|программ|ошибк|баг|сайт)/iu,
  title:'План разработки',steps:[
   'Изучить только явно разрешённые файлы и требования',
   'Подготовить предложение изменений и отдельный diff',
   'Проверить тесты и запросить подтверждение до изменения исходников']},
 {id:'business',tool:'business.research-plan',pattern:/(?:бизнес|открыть\s+(?:кафе|салон|магазин)|рынок|конкурент|маркетинг|продаж|финанс)/iu,
  title:'План бизнес-анализа',steps:[
   'Согласовать цель, город, бюджет и необходимые ограничения',
   'Собрать источники и проверить актуальность данных после подключения поиска',
   'Подготовить расчёты, риски и рекомендации без выдуманных рыночных цифр']}
]);

function common(message,status){
 return {
  version:AGENT_VERSION,
  request:message,
  status,
  executionAllowed:false,
  executed:false,
  toolsUsed:[],
  changesMade:[],
  approval:{required:true,granted:false},
  modelUsed:false
 };
}

/**
 * Safe structured planning only. A proposed step is never evidence of execution.
 * A user saying "разрешаю" inside a prompt is NOT an authorization token.
 * Only a future separately authenticated execution API may handle approvals.
 */
export function planAgentTask(message){
 const input=normalizeMessage(message);
 const signals=classify(input);
 if(FORBIDDEN.test(input)){
  return Object.freeze({
   ...common(input,'blocked'),
   intent:'restricted-action',tool:null,title:'Требуется защищённое подтверждение',
   explanation:'Опасные или необратимые действия недоступны. Я не выполнял платежей, удалений, подписаний или рассылок.',
   steps:['Уточнить цель и показать безопасный предварительный вариант',
          'Подключить проверенный инструмент и отдельную систему подтверждений до исполнения'],
   sensitive:signals.private
  });
 }
 if(!ACTION.test(input)){
  return Object.freeze({
   ...common(input,'conversation'),
   intent:'conversation',tool:null,title:'Свободный разговор',
   explanation:'Это обычный вопрос. Передаю его текстовому интеллекту; никаких действий не предлагаю.',
   steps:[],sensitive:signals.private
  });
 }
 const matched=INTENTS.find(item=>item.pattern.test(input));
 if(!matched){
  return Object.freeze({
   ...common(input,'clarification-needed'),
   intent:'unknown',tool:null,title:'Нужно уточнить задачу',
   explanation:'Пока не определён подходящий проверенный инструмент. Можно продолжить обычный диалог.',
   steps:['Уточнить ожидаемый результат и нужный раздел приложения'],
   sensitive:signals.private
  });
 }
 return Object.freeze({
  ...common(input,'draft'),
  intent:matched.id,tool:matched.tool,title:matched.title,
  explanation:'Это проект плана, а не выполненное поручение. Работа с внешними данными ещё не подключена.',
  steps:[...matched.steps],sensitive:signals.private,
  nextStep:'Подтвердить подготовленный результат после подключения проверенного инструмента'
 });
}
