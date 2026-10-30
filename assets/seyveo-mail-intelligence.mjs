/* MAIL INTELLIGENCE: source-grounded preview model.
 * No inferred urgency from untrusted text. No sending or AI claims. */
export function prepareMailInsight(mail){
 if(!mail||typeof mail!=='object')throw new TypeError('Mail required');
 const subject=String(mail.subject||'Без темы').trim().slice(0,160);
 const sender=String(mail.sender||'Отправитель не указан').trim().slice(0,120);
 const body=String(mail.body||'').trim();
 const summary=String(mail.verifiedSummary||'').trim();
 const needsReply=mail.needsReply===true?'Требуется ответ':mail.needsReply===false?'Ответ не требуется':'Ответ ещё не определён';
 const priority=mail.verifiedPriority===true?String(mail.priorityLabel||'Обычное'):'Приоритет не подтверждён';
 return Object.freeze({subject,sender,summary:summary||'Сэйви сможет объяснить содержание после подключения анализа писем.',needsReply,priority,canSend:false,source:mail.source||'local'});
}
