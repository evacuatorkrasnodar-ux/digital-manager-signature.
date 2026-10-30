/* Structured text for existing SEYVEO training cards.
 * Keep event/source, Sayvi interpretation and proposed action separate.
 * Pure data module; no DOM mutation, outbound action or fabricated AI output.
 */
export const TRAINING_CARD_COPY=Object.freeze({
 work:Object.freeze({
  source:'Рабочий чат · Елена',
  fact:'Елена сообщает, что закончила выкладку товаров, и просит проверить результат.',
  reason:'Сотрудник ожидает обратной связи руководителя.',
  sayvi:'Предлагаю запросить фотографию выкладки, чтобы проверить результат.',
  action:'Ответить или перейти в чат'
 }),
 mail:Object.freeze({
  source:'Почта · Андрей',
  fact:'Клиент спрашивает о стоимости доставки.',
  reason:'Для расчёта стоимости не хватает адреса доставки.',
  sayvi:'Предлагаю уточнить адрес у Андрея.',
  action:'Проверить черновик ответа'
 }),
 contract:Object.freeze({
  source:'Документы · учебный договор',
  fact:'В учебном договоре не указан конкретный срок поставки.',
  reason:'Без срока поставки условия требуют уточнения.',
  sayvi:'Предлагаю указать конкретный срок и порядок уведомления о задержке.',
  action:'Проверить предложенное исправление'
 })
});
export function trainingCardCopy(kind){return TRAINING_CARD_COPY[kind]||null;}
