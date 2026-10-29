// First sales are planning tasks, not fabricated leads or orders.
export const firstSalesSteps=Object.freeze([
 {id:'audience',title:'Описать первых покупателей'},
 {id:'offer',title:'Подготовить понятное предложение'},
 {id:'channel',title:'Выбрать канал первых обращений'},
 {id:'contact',title:'Подготовить способ связи и приёма заявок'},
 {id:'feedback',title:'Собрать отзывы первых клиентов'}
]);
export function nextSalesAction(done=[]){return firstSalesSteps.find(step=>!done.includes(step.id))??null}
