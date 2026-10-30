/* SEYVEO Card Engine v1: deterministic, safe, no AI or external actions. */
(function(root){
 'use strict';
 const catalog=Object.freeze({
 message:{family:'Сообщения',icon:'◎',accent:'#8FE3C3',actions:['reply','open-chat','later']},
 mail:{family:'Почта',icon:'✉',accent:'#8FE3C3',actions:['review-draft','open-mail','later']},
 document:{family:'Документы',icon:'▤',accent:'#B8D4E8',actions:['review','open-document','later']},
 task:{family:'Дела',icon:'☑',accent:'#B8D4E8',actions:['open-task','later']},
 calendar:{family:'Календарь',icon:'▦',accent:'#E7D2A2',actions:['open-calendar','later']},
 health:{family:'Здоровье',icon:'♡',accent:'#E8B8C7',actions:['open-health','later']},
 care:{family:'Забота',icon:'♥',accent:'#E8B8C7',actions:['open-care','later']},
 finance:{family:'Финансы',icon:'▱',accent:'#E7D2A2',actions:['review-payment','later']},
 business:{family:'Бизнес',icon:'▥',accent:'#A5D8BB',actions:['open-business','later']},
 employee:{family:'Сотрудники',icon:'♧',accent:'#CBBFE9',actions:['open-team','later']},
 home:{family:'Умный дом',icon:'⌂',accent:'#C2DED1',actions:['open-home','later']},
 security:{family:'Безопасность',icon:'◇',accent:'#B8D4E8',actions:['review-security','later']},
 shelf:{family:'Проверка выкладки',icon:'▧',accent:'#8FE3C3',actions:['request-photo','open-chat','later']},
 recognition:{family:'Благодарность',icon:'✦',accent:'#E7D2A2',actions:['review-recognition','open-team','later']},
 secureFlow:{family:'Документооборот',icon:'▤',accent:'#B8D4E8',actions:['review-document','open-document','later']}
 });
 const eventType={ 'message.received':'message','mail.received':'mail','document.review_requested':'document',
 'task.due':'task','calendar.upcoming':'calendar','health.reminder':'health',
 'care.reminder':'care','finance.review_requested':'finance','business.sale_recorded':'business',
 'employee.requested':'employee','home.offline':'home','security.login_review':'security',
 'shelf.photo_requested':'shelf','employee.recognition_proposed':'recognition','document.signature_review':'secureFlow'};
 const trim=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
 function buildCard(event){
  if(!event||typeof event!=='object'||!Object.prototype.hasOwnProperty.call(eventType,event.type))return null;
  const family=eventType[event.type],config=catalog[family];
  const id=trim(event.id,128),title=trim(event.title,140),fact=trim(event.fact,1200);
  if(!id||!title||!fact)return null;
  return Object.freeze({id,family,eventType:event.type,title,fact,
   suggestion:trim(event.suggestion,1200),source:trim(event.source,100)||'Учебное событие',
   icon:config.icon,accent:config.accent,
   priority:['normal','important','urgent'].includes(event.priority)?event.priority:'normal',
   status:'new',actions:[...config.actions],
   demo:event.demo===true
  });
 }
 function fromEvents(events){
  if(!Array.isArray(events))return [];
  const seen=new Set(),out=[];
  for(const e of events.slice(0,200)){
   const card=buildCard(e);if(!card||seen.has(card.id))continue;
   seen.add(card.id);out.push(card);
  }
  const ranks={urgent:0,important:1,normal:2};
  return out.sort((a,b)=>ranks[a.priority]-ranks[b.priority]);
 }
 root.SEYVEO_CARD_ENGINE=Object.freeze({catalog,eventType,buildCard,fromEvents});
})(window);
