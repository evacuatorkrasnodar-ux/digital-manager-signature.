/* SEYVEO Card Engine v1 — isolated testable domain logic.
 * No DOM, network, external side effects or storage. Integrations must acknowledge real success.
 */
export const CARD_TYPES=Object.freeze(['message','document','task','approval','reminder','calendar','finance','businessInsight','people','care','device','systemNotice']);
const ACTIONS={message:['reply','chat'],document:['review','chat'],task:['execute','chat'],approval:['approve','chat'],reminder:['execute','chat'],calendar:['open','chat'],finance:['review','chat'],businessInsight:['open','chat'],people:['open','chat'],care:['open','chat'],device:['execute','chat'],systemNotice:['open','chat']};
const LABELS={reply:'Ответить',chat:'В чат',review:'Открыть',execute:'Исполнить',approve:'Подтвердить',open:'Открыть'};
const TYPE_BY_EVENT={email_received:'message',message_received:'message',document_received:'document',task_assigned:'task',approval_requested:'approval',reminder_due:'reminder',calendar_changed:'calendar',finance_notice:'finance',business_insight:'businessInsight',employee_update:'people',care_reminder:'care',device_alert:'device'};
const done=new Set(['succeeded','archived','canceled','expired']);
const allowed={new:['shown','deferred','canceled'],shown:['action_pending','deferred','canceled'],deferred:['shown','canceled'],action_pending:['executing','shown','failed'],executing:['succeeded','failed'],failed:['action_pending','shown'],succeeded:['archived'],archived:[],canceled:[],expired:[]};
function requiredString(s,name){if(typeof s!=='string'||!s.trim())throw new TypeError('Missing '+name);return s.trim();}
export function eventKey(e){return ['source','accountId','sourceRecordId','eventType'].map(k=>requiredString(e[k],k)).concat(String(e.revision??0)).join('\u001f');}
export function explainPriority(e){
 const level=Number.isInteger(e.priority)&&e.priority>=0&&e.priority<=3?e.priority:2;
 const labels=['Критическое','Важное','Обычное','Информационное'];
 // Only source-provided, verified explanations. Never infer urgency from text.
 const reason=typeof e.priorityReason==='string'&&e.priorityReason.trim()
   ?e.priorityReason.trim().slice(0,240)
   :'Причина приоритета источником не указана.';
 return {level,label:labels[level],reason,verified:!!(e.priorityReasonVerified===true)};
}
export function createCard(e,{workspaceId,accountId}={}){
 if(!e||typeof e!=='object')throw new TypeError('Invalid event');
 const key=eventKey(e),type=TYPE_BY_EVENT[e.eventType]||'systemNotice';
 if(accountId!==undefined&&e.accountId!==accountId)throw new Error('Account boundary');
 if(workspaceId!==undefined&&e.workspaceId!==workspaceId)throw new Error('Workspace boundary');
 const actions=ACTIONS[type].map(id=>({id,label:LABELS[id],requiresConfirmation:['approve','execute','reply'].includes(id)}));
 return {id:'card:'+key,eventId:requiredString(e.eventId,'eventId'),dedupeKey:key,
 cardType:type,sourceLabel:String(e.source),actorLabel:String(e.actorLabel||''),
 title:requiredString(e.title,'title'),contextText:String(e.contextText||''),assistantText:String(e.assistantText||''),
 proposalText:String(e.proposalText||''),priority:Math.max(0,Math.min(3,Number.isInteger(e.priority)?e.priority:2)),
 priorityExplanation:explainPriority(e),colorToken:type,actions:actions.slice(0,2),status:'new',version:1,accountId:e.accountId,workspaceId:e.workspaceId||null,
 createdAt:e.createdAt||new Date().toISOString(),history:[],privacyLevel:e.privacyLevel||'private'};
}
export function transition(card,next,meta={}){
 if(!allowed[card.status]?.includes(next))throw new Error('Invalid transition: '+card.status+' -> '+next);
 if(next==='succeeded'&&meta.acknowledged!==true)throw new Error('Verified acknowledgement required');
 const history=[...card.history,{from:card.status,to:next,at:meta.at||new Date().toISOString(),reason:meta.reason||''}];
 return {...card,status:next,version:card.version+1,history};
}
export function ingest(events,scope){
 const seen=new Set(),cards=[];
 for(const e of events){const card=createCard(e,scope);if(seen.has(card.dedupeKey))continue;seen.add(card.dedupeKey);cards.push(card);}
 return cards.sort((a,b)=>a.priority-b.priority||a.createdAt.localeCompare(b.createdAt));
}
export function visible(cards){return cards.filter(c=>!done.has(c.status)&&c.status!=='deferred');}
export function actionFor(card,id){const action=card.actions.find(a=>a.id===id);if(!action)throw new Error('Action not allowed');return action;}
export function createDemoEvents(){
 const common={source:'demo',accountId:'demo-account',workspaceId:'demo-workspace',revision:1};
 return [
 {...common,eventId:'demo-email-1',sourceRecordId:'email-1',eventType:'email_received',priority:1,priorityReason:'Клиент ожидает ответа о доставке.',priorityReasonVerified:true,title:'Письмо от Андрея',actorLabel:'Клиент Андрей',contextText:'Андрей спрашивает о стоимости доставки.',assistantText:'Я подготовила короткий ответ.',proposalText:'Уточнить адрес доставки.'},
 {...common,eventId:'demo-doc-1',sourceRecordId:'doc-1',eventType:'document_received',priority:1,priorityReason:'Документ ожидает проверки перед дальнейшими действиями.',priorityReasonVerified:true,title:'Документ на проверку',actorLabel:'Рабочие документы',contextText:'Получен новый договор.',assistantText:'Проверь реквизиты и условия.',proposalText:'Открыть документ для просмотра.'},
 {...common,eventId:'demo-task-1',sourceRecordId:'task-1',eventType:'task_assigned',priority:2,priorityReason:'Это обычное учебное поручение без подтверждённого срочного срока.',priorityReasonVerified:true,title:'Поручение сотруднику',actorLabel:'Команда',contextText:'Нужно проверить выкладку товара.',assistantText:'Предлагаю запросить фотографию.',proposalText:'Исполнить после подтверждения.'}
 ];
}
