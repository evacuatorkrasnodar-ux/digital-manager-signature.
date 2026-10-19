/* SEYVEO Intelligence Architecture v1 · immutable capability blueprint.
 * Describes the WHOLE future Felix without pretending planned tools are connected.
 * Pure module: no model calls, network, storage, secrets, tool execution or side effects.
 */
import {decide,normalizeMessage,classify} from '../hybrid-core.mjs';
import {planAgentTask} from '../agent/planner.mjs';

export const INTELLIGENCE_VERSION='1.0.0';
export const READINESS=Object.freeze({
 blueprint:'blueprint',prototype:'prototype',offline:'offline',server:'server-adapter'
});
const blueprint=(id,title,description,readiness='blueprint',privacy='standard')=>
 Object.freeze({id,title,description,readiness,privacy,
  executionEnabled:false,automaticAccess:false});

export const FELIX_CAPABILITIES=Object.freeze([
 blueprint('intelligence','Интеллект','Выбор локальной модели и GPT по разрешениям','server-adapter'),
 blueprint('dialogue','Диалог','Память контекста одной беседы','prototype'),
 blueprint('memory','Память','Только добровольно подтверждённые локальные факты','prototype','private'),
 blueprint('knowledge','Знания','Проверенные источники и документы по явному доступу'),
 blueprint('learning','Обучение','Школа Феликса, тесты, будущая настройка модели','prototype'),
 blueprint('business','Бизнес','Стратегия, клиенты, продажи, процессы и отчёты'),
 blueprint('development','Разработка','Чтение ограниченного кода и предложения изменений','prototype'),
 blueprint('documents','Документы','Просмотр и обработка только выбранных файлов','blueprint','private'),
 blueprint('calendar','Календарь','Черновики событий с подтверждением'),
 blueprint('notebook','Блокнот','Работа с заметками по разрешению','blueprint','private'),
 blueprint('communications','Связь','Почта, сообщения, звонки и контакты','blueprint','private'),
 blueprint('finance','Финансы','Бюджет, отчёты и финансовые рекомендации','blueprint','sensitive'),
 blueprint('tax','Налоги','Справка, сроки и подготовка документов','blueprint','sensitive'),
 blueprint('personal','Мой мир','Личное пространство и выборочная защита','blueprint','private'),
 blueprint('health','Здоровье','Данные здоровья только после отдельного доступа','blueprint','sensitive'),
 blueprint('care','Забота','Напоминания и бережные сценарии','blueprint','sensitive'),
 blueprint('voice','Голос','Безопасное распознавание и озвучивание','prototype','private'),
 blueprint('integrations','Интеграции','Подключаемые внешние приложения и сервисы','blueprint','private'),
 blueprint('security','Безопасность','Разрешения, ограничения и аудит действий','prototype')
]);

const TOOL_TO_CAPABILITY=Object.freeze({
 'calendar.draft':'calendar','notebook.draft':'notebook',
 'mail.draft':'communications','business.research-plan':'business',
 'code.proposal':'development'
});

/** A feature is described but not declared operational merely because its UI exists. */
export function intelligenceCatalog(){
 return Object.freeze({
  product:'SEYVEO · Цифровой управляющий',
  assistant:'Феликс',
  version:INTELLIGENCE_VERSION,
  mode:'architecture-preview',
  capabilities:FELIX_CAPABILITIES,
  limits:Object.freeze({
   localModel:'Only when self-hosted Ollama is running',
   cloud:'Requires explicit per-request consent and a configured backend',
   currentExecution:'disabled',
   personalSources:'not automatically accessed',
   crossDeviceMemory:'not implemented',
   productionReady:false
  })
 });
}

/** Compose local policies and plans, without performing the proposed operation. */
export function intelligencePlan(message,{mode='auto',allowCloud=false}={},availability={}){
 const request=normalizeMessage(message);
 const signals=classify(request);
 const task=planAgentTask(request);
 const capability=TOOL_TO_CAPABILITY[task.tool]||'dialogue';
 const info=FELIX_CAPABILITIES.find(item=>item.id===capability);
 // Private and sensitive domains are local-only until a reviewed data policy exists.
 // Regex classification alone is not sufficient consent to transmit user records.
 const localOnly=signals.private||signals.highStakes||task.status==='blocked'||
  info.privacy==='private'||info.privacy==='sensitive';
 const choice=decide(request,{mode:localOnly?'private':mode,
  allowCloud:!localOnly&&allowCloud},availability);
 const cloudEligible=choice.route==='cloud'&&!localOnly&&allowCloud===true;
 return Object.freeze({
  version:INTELLIGENCE_VERSION,
  request,
  task:Object.freeze({
   intent:task.intent,status:task.status,title:task.title,
   explanation:task.explanation,
   capability:info.id,tool:task.tool,
   steps:[...task.steps]
  }),
  intelligence:Object.freeze({
   route:cloudEligible?'cloud':choice.route==='cloud'?'unavailable':choice.route,
   reason:choice.reason,
   providerCalled:false,
   cloudConsent:cloudEligible,
   cloudProviderConnected:availability.cloud===true,
   localModelConnected:availability.local===true
  }),
  safety:Object.freeze({
   privateData:localOnly,
   sensitiveTopic:info.privacy==='sensitive'||signals.private||signals.highStakes,
   approvalRequired:task.approval.required||signals.highStakes,
   approvalGranted:false,executed:false,
   externalCallsMade:0,toolsUsed:[],changesMade:[]
  }),
  status:task.status==='blocked'?'blocked':'preview-only',
  readyToExecute:false
 });
}
